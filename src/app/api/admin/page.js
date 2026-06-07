import { getAdminSession } from "@/lib/admin-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Users, CreditCard, AlertTriangle, Clock, Images, ShoppingBag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default async function AdminDashboard() {
    const admin = await getAdminSession()
    if (!admin) redirect("/admin/login")

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [
        totalPhotographers,
        blocked,
        activeSubscriptions,
        expiringSoon,
        noSubscription,
        totalGalleries,
        totalOrders,
        recentPhotographers,
    ] = await Promise.all([
        prisma.photographer.count(),
        prisma.photographer.count({ where: { isBlocked: true } }),
        prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now } } }),
        prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7Days } } }),
        prisma.photographer.count({ where: { subscription: null } }),
        prisma.gallery.count(),
        prisma.order.count(),
        prisma.photographer.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            include: {
                subscription: { include: { plan: true } },
                _count: { select: { galleries: true } },
            },
        }),
    ])

    const stats = [
        { label: "Fotógrafos", value: totalPhotographers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Suscripciones activas", value: activeSubscriptions, icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
        { label: "Vencen en 7 días", value: expiringSoon, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/subscriptions?filter=expiring" },
        { label: "Sin suscripción", value: noSubscription, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", href: "/admin/photographers?status=expired" },
        { label: "Galerías totales", value: totalGalleries, icon: Images, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Órdenes totales", value: totalOrders, icon: ShoppingBag, color: "text-neutral-600", bg: "bg-neutral-100" },
    ]

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
                <p className="text-neutral-500 text-sm mt-1">Resumen general de la plataforma</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {stats.map((stat) => {
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

            {/* Fotógrafos recientes */}
            <Card>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                    <h2 className="font-medium text-neutral-900">Fotógrafos recientes</h2>
                    <Link href="/admin/photographers" className="text-sm text-neutral-500 hover:text-neutral-800">
                        Ver todos →
                    </Link>
                </div>
                <div className="divide-y divide-neutral-100">
                    {recentPhotographers.map((p) => {
                        const isExpired = p.subscription
                            ? new Date(p.subscription.expiresAt) < now
                            : true
                        const daysLeft = p.subscription
                            ? Math.ceil((new Date(p.subscription.expiresAt) - now) / (1000 * 60 * 60 * 24))
                            : null

                        return (
                            <Link
                                key={p.id}
                                href={`/admin/photographers/${p.id}`}
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
                                        <p className="text-xs text-neutral-400">{p.email} · {p._count.galleries} galerías</p>
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
                                        <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                                            Sin plan
                                        </span>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </Card>
        </div>
    )
}