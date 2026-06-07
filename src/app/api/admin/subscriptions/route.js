import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const filter   = searchParams.get("filter") || ""   // active | expiring | expired | cancelled | free
        const search   = searchParams.get("search") || ""
        const page     = Math.max(1, parseInt(searchParams.get("page") || "1"))
        const pageSize = 20

        const now      = new Date()
        const in7Days  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000)
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        // ── Filtro de estado ───────────────────────────────────────────
        let statusWhere = {}
        if (filter === "active")    statusWhere = { status: "ACTIVE",    expiresAt: { gt: in7Days  } }
        if (filter === "expiring")  statusWhere = { status: "ACTIVE",    expiresAt: { gte: now, lte: in7Days } }
        if (filter === "expired")   statusWhere = { status: { in: ["EXPIRED", "CANCELLED", "SUSPENDED"] } }
        if (filter === "free")      statusWhere = { paymentMethod: "free" }

        const where = {
            ...statusWhere,
            ...(search ? {
                photographer: {
                    OR: [
                        { name:  { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ],
                },
            } : {}),
        }

        const [total, subscriptions, stats] = await Promise.all([
            prisma.subscription.count({ where }),
            prisma.subscription.findMany({
                where,
                include: {
                    plan: true,
                    photographer: { select: { id: true, name: true, email: true, avatar: true } },
                },
                orderBy: { updatedAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            // Stats generales (siempre sin filtro)
            Promise.all([
                prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
                prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7Days } } }),
                prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: in30Days } } }),
                prisma.subscription.count({ where: { status: { in: ["EXPIRED", "CANCELLED"] } } }),
                prisma.subscription.aggregate({
                    where: { paymentMethod: { not: "free" }, amountPaid: { not: null } },
                    _sum: { amountPaid: true },
                }),
                // Ingresos del mes actual
                prisma.subscription.aggregate({
                    where: {
                        paymentMethod: { not: "free" },
                        amountPaid: { not: null },
                        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
                    },
                    _sum: { amountPaid: true },
                }),
                // Nuevas suscripciones últimos 30 días
                prisma.subscription.count({
                    where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
                }),
            ]),
        ])

        const [active, expiring7, expiring30, inactive, revenueAll, revenueMonth, recentCount] = stats

        return NextResponse.json({
            subscriptions,
            pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
            stats: {
                active,
                expiring7,
                expiring30,
                inactive,
                revenueAll:    Number(revenueAll._sum.amountPaid    || 0),
                revenueMonth:  Number(revenueMonth._sum.amountPaid  || 0),
                recentCount,
            },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const {
            photographerId, planId, amountPaid,
            paymentMethod, paymentRef, notes, durationDays,
        } = body

        const plan = await prisma.plan.findUnique({ where: { id: planId } })
        if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

        const days = durationDays || plan.durationDays
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

        const subscription = await prisma.subscription.upsert({
            where: { photographerId },
            create: {
                photographerId,
                planId,
                expiresAt,
                status: "ACTIVE",
                amountPaid,
                paymentMethod,
                paymentRef,
                notes,
            },
            update: {
                planId,
                expiresAt,
                status: "ACTIVE",
                amountPaid,
                paymentMethod,
                paymentRef,
                notes,
                startDate: new Date(),
            },
            include: { plan: true },
        })

        return NextResponse.json(subscription, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}