import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

// Genera los últimos N meses como { year, month, label, gte, lt }
function lastNMonths(n) {
    const months = []
    const now = new Date()
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const gte = new Date(d.getFullYear(), d.getMonth(), 1)
        const lt  = new Date(d.getFullYear(), d.getMonth() + 1, 1)
        months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            label: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
            gte,
            lt,
        })
    }
    return months
}

export async function GET() {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const now = new Date()
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

        const months = lastNMonths(6)

        const [
            totalPhotographers,
            blocked,
            activeSubscriptions,
            expiredSubscriptions,
            expiringSoon,
            totalGalleries,
            totalOrders,
            revenueAllTime,
            revenueThisMonth,
            revenueLastMonth,
            subscriptionRevenueAllTime,
            subscriptionRevenueThisMonth,
            avgOrderValue,
            ordersThisMonth,
            ordersLastMonth,
            // datos mensuales en paralelo
            ...monthlyRaw
        ] = await Promise.all([
            prisma.photographer.count(),
            prisma.photographer.count({ where: { isBlocked: true } }),
            prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now } } }),
            prisma.subscription.count({ where: { OR: [{ status: "EXPIRED" }, { expiresAt: { lt: now } }] } }),
            prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7Days } } }),
            prisma.gallery.count(),
            prisma.order.count({ where: { status: "PAID" } }),
            prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
            prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: startOfThisMonth } }, _sum: { total: true } }),
            prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { total: true } }),
            prisma.subscription.aggregate({ where: { amountPaid: { not: null } }, _sum: { amountPaid: true } }),
            prisma.subscription.aggregate({ where: { amountPaid: { not: null }, createdAt: { gte: startOfThisMonth } }, _sum: { amountPaid: true } }),
            prisma.order.aggregate({ where: { status: "PAID" }, _avg: { total: true } }),
            prisma.order.count({ where: { status: "PAID", createdAt: { gte: startOfThisMonth } } }),
            prisma.order.count({ where: { status: "PAID", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

            // Por cada mes: contar fotógrafos registrados + órdenes PAID + revenue
            ...months.flatMap((m) => [
                prisma.photographer.count({ where: { createdAt: { gte: m.gte, lt: m.lt } } }),
                prisma.order.count({ where: { status: "PAID", createdAt: { gte: m.gte, lt: m.lt } } }),
                prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: m.gte, lt: m.lt } }, _sum: { total: true } }),
            ]),
        ])

        const toNum = (val) => Number(val ?? 0)
        const pct   = (cur, prev) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100)

        // Reconstruir datos mensuales (3 queries por mes)
        const chartData = months.map((m, i) => {
            const base = i * 3
            return {
                label:         m.label,
                photographers: monthlyRaw[base],
                orders:        monthlyRaw[base + 1],
                revenue:       toNum(monthlyRaw[base + 2]._sum?.total),
            }
        })

        return NextResponse.json({
            totalPhotographers,
            blocked,
            activeSubscriptions,
            expiredSubscriptions,
            expiringSoon,
            totalGalleries,
            totalOrders,
            revenue: {
                ordersAllTime:          toNum(revenueAllTime._sum.total),
                ordersThisMonth:        toNum(revenueThisMonth._sum.total),
                ordersLastMonth:        toNum(revenueLastMonth._sum.total),
                ordersGrowth:           pct(toNum(revenueThisMonth._sum.total), toNum(revenueLastMonth._sum.total)),
                subscriptionsAllTime:   toNum(subscriptionRevenueAllTime._sum.amountPaid),
                subscriptionsThisMonth: toNum(subscriptionRevenueThisMonth._sum.amountPaid),
                totalAllTime:           toNum(revenueAllTime._sum.total) + toNum(subscriptionRevenueAllTime._sum.amountPaid),
                avgOrderValue:          toNum(avgOrderValue._avg.total),
                ordersThisMonthCount:   ordersThisMonth,
                ordersLastMonthCount:   ordersLastMonth,
                ordersCountGrowth:      pct(ordersThisMonth, ordersLastMonth),
            },
            chartData,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
