import { getAdminSession } from "@/lib/admin-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import {
    Users, CreditCard, AlertTriangle, Clock,
    Images, ShoppingBag, TrendingUp, TrendingDown,
    Minus, DollarSign, ReceiptText, BarChart3, Download
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import GrowthChart from "@/components/admin/growth-chart"

function Growth({ value }) {
    if (value === null) return <span className="text-xs text-neutral-400">Sin datos previos</span>
    if (value === 0) return (
        <span className="flex items-center gap-0.5 text-xs text-neutral-400">
            <Minus size={11} /> igual que el mes pasado
        </span>
    )
    const positive = value > 0
    return (
        <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {positive ? "+" : ""}{value}% vs mes anterior
        </span>
    )
}

function fmt(n) {
    return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default async function AdminDashboard() {
    const admin = await getAdminSession()
    if (!admin) redirect("/admin/login")

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        return {
            label: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
            gte: new Date(d.getFullYear(), d.getMonth(), 1),
            lt: new Date(d.getFullYear(), d.getMonth() + 1, 1),
        }
    })

    const [
        totalPhotographers,
        blocked,
        activeSubscriptions,
        expiringSoon,
        noSubscription,
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
        recentPhotographers,
        recentOrders,
        // datos mensuales (3 queries × 6 meses)
        ...monthlyRaw
    ] = await Promise.all([
        prisma.photographer.count(),
        prisma.photographer.count({ where: { isBlocked: true } }),
        prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now } } }),
        prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7Days } } }),
        prisma.photographer.count({ where: { subscription: null } }),
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
        prisma.photographer.findMany({
            orderBy: { createdAt: "desc" },
            take: 6,
            include: {
                subscription: { include: { plan: true } },
                _count: { select: { galleries: true } },
            },
        }),
        prisma.order.findMany({
            where: { status: "PAID" },
            orderBy: { createdAt: "desc" },
            take: 6,
            include: {
                gallery: {
                    select: {
                        title: true,
                        photographer: { select: { name: true } },
                    },
                },
            },
        }),
        // 3 queries por cada uno de los 6 meses
        ...months.flatMap((m) => [
            prisma.photographer.count({ where: { createdAt: { gte: m.gte, lt: m.lt } } }),
            prisma.order.count({ where: { status: "PAID", createdAt: { gte: m.gte, lt: m.lt } } }),
            prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: m.gte, lt: m.lt } }, _sum: { total: true } }),
        ]),
    ])

    const toNum = (val) => Number(val ?? 0)
    const pct = (cur, prev) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100)

    const orderRevenueTotal = toNum(revenueAllTime._sum.total)
    const orderRevenueThisMonth = toNum(revenueThisMonth._sum.total)
    const orderRevenueLastMonth = toNum(revenueLastMonth._sum.total)
    const subRevenueTotal = toNum(subscriptionRevenueAllTime._sum.amountPaid)
    const subRevenueThisMonth = toNum(subscriptionRevenueThisMonth._sum.amountPaid)
    const avgOrder = toNum(avgOrderValue._avg.total)
    const ordersGrowth = pct(orderRevenueThisMonth, orderRevenueLastMonth)
    const countGrowth = pct(ordersThisMonth, ordersLastMonth)

    // Armar datos del gráfico
    const chartData = months.map((m, i) => {
        const base = i * 3
        return {
            label: m.label,
            photographers: monthlyRaw[base],
            orders: monthlyRaw[base + 1],
            revenue: toNum(monthlyRaw[base + 2]?._sum?.total),
        }
    })

    const platformStats = [
        { label: "Fotógrafos", value: totalPhotographers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Suscripciones activas", value: activeSubscriptions, icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
        { label: "Vencen en 7 días", value: expiringSoon, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/photographers?status=expired" },
        { label: "Sin suscripción", value: noSubscription, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", href: "/admin/photographers?status=expired" },
        { label: "Galerías totales", value: totalGalleries, icon: Images, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Ventas concretadas", value: totalOrders, icon: ShoppingBag, color: "text-neutral-600", bg: "bg-neutral-100" },
    ]

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
                    <p className="text-neutral-500 text-sm mt-1">Resumen general de la plataforma</p>
                </div>
                {/* Exportar */}
                <div className="flex gap-2">
                    <a
                        href="/api/admin/export?type=photographers"
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors font-medium"
                    >
                        <Download size={13} /> Fotógrafos CSV
                    </a>
                    <a
                        href="/api/admin/export?type=orders"
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors font-medium"
                    >
                        <Download size={13} /> Órdenes CSV
                    </a>
                </div>
            </div>

            {/* ── Revenue ─────────────────────────────────────────── */}
            <section>
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Ingresos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="lg:col-span-1 bg-neutral-900 border-0">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-neutral-400 font-medium">Total plataforma</p>
                                <div className="bg-white/10 p-2 rounded-lg">
                                    <DollarSign size={16} className="text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white">${fmt(orderRevenueTotal + subRevenueTotal)}</p>
                            <p className="text-xs text-neutral-500 mt-1">histórico acumulado</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-neutral-500 font-medium">Ventas este mes</p>
                                <div className="bg-green-50 p-2 rounded-lg">
                                    <BarChart3 size={16} className="text-green-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-neutral-900">${fmt(orderRevenueThisMonth)}</p>
                            <div className="mt-1.5"><Growth value={ordersGrowth} /></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-neutral-500 font-medium">Suscripciones este mes</p>
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <CreditCard size={16} className="text-blue-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-neutral-900">${fmt(subRevenueThisMonth)}</p>
                            <p className="text-xs text-neutral-400 mt-1.5">${fmt(subRevenueTotal)} total histórico</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-neutral-500 font-medium">Ticket promedio</p>
                                <div className="bg-purple-50 p-2 rounded-lg">
                                    <ReceiptText size={16} className="text-purple-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-neutral-900">${fmt(avgOrder)}</p>
                            <div className="mt-1.5"><Growth value={countGrowth} /></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Barra comparativa */}
                <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                    <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                        <span>Este mes ({ordersThisMonth} ventas) — ${fmt(orderRevenueThisMonth)}</span>
                        <span>Mes anterior ({ordersLastMonth} ventas) — ${fmt(orderRevenueLastMonth)}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all ${orderRevenueThisMonth >= orderRevenueLastMonth ? "bg-green-500" : "bg-amber-400"}`}
                            style={{
                                width: `${Math.min(100, (orderRevenueLastMonth === 0 && orderRevenueThisMonth === 0) ? 0
                                    : orderRevenueLastMonth === 0 ? 100
                                        : (orderRevenueThisMonth / Math.max(orderRevenueThisMonth, orderRevenueLastMonth)) * 100)}%`,
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* ── Gráfico de crecimiento ───────────────────────────── */}
            <section>
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Últimos 6 meses</h2>
                <Card>
                    <CardContent className="p-6">
                        <GrowthChart data={chartData} />
                    </CardContent>
                </Card>
            </section>

            {/* ── Stats de plataforma ──────────────────────────────── */}
            <section>
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Plataforma</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {platformStats.map((stat) => {
                        const Icon = stat.icon
                        const content = (
                            <Card className={stat.href ? "hover:shadow-md transition-shadow cursor-pointer" : ""}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-neutral-500 mb-1">{stat.label}</p>
                                            <p className="text-3xl font-semibold text-neutral-900">{stat.value}</p>
                                        </div>
                                        <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                        return stat.href
                            ? <Link key={stat.label} href={stat.href}>{content}</Link>
                            : <div key={stat.label}>{content}</div>
                    })}
                </div>
            </section>

            {/* ── Tablas recientes ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                        <h2 className="font-medium text-neutral-900">Últimas ventas</h2>
                        <Link href="/admin/orders" className="text-sm text-neutral-500 hover:text-neutral-800">Ver todas →</Link>
                    </div>
                    <div className="divide-y divide-neutral-100">
                        {recentOrders.length === 0 ? (
                            <p className="text-sm text-neutral-400 text-center py-8">Sin ventas aún</p>
                        ) : recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                                <div>
                                    <p className="text-sm font-medium text-neutral-900">{order.clientName || order.clientEmail}</p>
                                    <p className="text-xs text-neutral-400">
                                        {order.gallery?.photographer?.name
                                            ? `${order.gallery.photographer.name} · ${order.gallery.title}`
                                            : order.galleryTitle || "Galería eliminada"}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className="text-sm font-semibold text-neutral-900">${fmt(order.total)}</p>
                                    <p className="text-xs text-neutral-400">
                                        {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                        <h2 className="font-medium text-neutral-900">Fotógrafos recientes</h2>
                        <Link href="/admin/photographers" className="text-sm text-neutral-500 hover:text-neutral-800">Ver todos →</Link>
                    </div>
                    <div className="divide-y divide-neutral-100">
                        {recentPhotographers.map((p) => {
                            const isExpired = p.subscription ? new Date(p.subscription.expiresAt) < now : true
                            const daysLeft = p.subscription
                                ? Math.ceil((new Date(p.subscription.expiresAt) - now) / (1000 * 60 * 60 * 24))
                                : null
                            return (
                                <Link key={p.id} href={`/admin/photographers/${p.id}`}
                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-semibold text-neutral-600 shrink-0">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                                                {p.isBlocked && (
                                                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Bloqueado</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-400">{p._count.galleries} galerías</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        {p.subscription && !isExpired ? (
                                            <>
                                                <p className="text-xs font-medium text-neutral-700">{p.subscription.plan.name}</p>
                                                <p className={`text-xs ${daysLeft <= 7 ? "text-amber-600" : "text-neutral-400"}`}>
                                                    {daysLeft}d restantes
                                                </p>
                                            </>
                                        ) : (
                                            <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">Sin plan</span>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </Card>
            </div>
        </div>
    )
}
