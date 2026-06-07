import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, ChevronRight, Camera, Images, ShoppingBag, LayoutDashboard } from "lucide-react"
import StatCard from "@/components/dashboard-stat-card"
import GalleryRow from "@/components/dashboard-gallery-row"
import NoPlanModal from "@/components/NoPlanModal"
import ProTipCarousel from "@/components/ProTipCarousel"
import LinktreeStatsCard from "@/components/linktree-stats-card"
import StorageDonut from "@/components/StorageDonut"

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const [
        galleriesCount, ordersCount, revenue, recentGalleries, recentOrders, subscription, tips, storageData] = await Promise.all([
            prisma.gallery.count({
                where: { photographerId: session.user.id }
            }),

            prisma.order.count({
                where: {
                    gallery: { photographerId: session.user.id },
                    status: { in: ["PAID", "DELIVERED"] },
                },
            }),

            prisma.order.aggregate({
                where: {
                    gallery: { photographerId: session.user.id },
                    status: { in: ["PAID", "DELIVERED"] },
                },
                _sum: { total: true },
            }),

            prisma.gallery.findMany({
                where: { photographerId: session.user.id },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    _count: {
                        select: { photos: true }
                    }
                },
            }),

            prisma.order.findMany({
                where: {
                    gallery: { photographerId: session.user.id },
                    status: { in: ["PAID", "DELIVERED"] },
                },
                orderBy: { createdAt: "desc" },
                take: 3,
                include: {
                    gallery: {
                        select: { title: true }
                    }
                },
            }),

            // SUSCRIPCIÓN
            prisma.subscription.findUnique({
                where: {
                    photographerId: session.user.id
                },
                include: {
                    plan: true
                }
            }),

            // TIPS del dashboard
            prisma.dashboardTip.findMany({
                where: { isActive: true },
                orderBy: [{ isPinned: "desc" }, { order: "asc" }, { createdAt: "desc" }],
            }),

            // STORAGE
            prisma.photographer.findUnique({
                where: { id: session.user.id },
                select: { storageUsedBytes: true },
            }),
        ])

    const totalRevenue = Number(revenue._sum.total || 0)
    const firstName = session.user.name?.split(" ")[0] ?? "Fotógrafo"

    // Serializar objetos de Prisma: convierte Decimal → number y Date → string ISO
    // de forma recursiva para que sea compatible con Client Components de Next.js.
    function serializePrisma(obj) {
        if (obj === null || obj === undefined) return obj
        if (obj instanceof Date) return obj.toISOString()
        // Decimal de Prisma: tiene método toFixed y propiedad d (array interno)
        if (typeof obj === "object" && typeof obj.toFixed === "function" && !Array.isArray(obj)) {
            return Number(obj)
        }
        if (Array.isArray(obj)) return obj.map(serializePrisma)
        if (typeof obj === "object") {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, serializePrisma(v)])
            )
        }
        return obj
    }

    const subscriptionSerialized = serializePrisma(subscription)
    const hour = new Date().getHours()
    const greeting = hour < 13 ? "BUENOS DÍAS" : hour < 19 ? "BUENAS TARDES" : "BUENAS NOCHES"

    const stats = [
        {
            label: "Galerías activas",
            value: galleriesCount,
            icon: "Images",
            iconColor: "#3b82f6",
            iconBg: "#eff6ff",
            borderAccent: "#bfdbfe",
            trend: null,
            href: "/dashboard/galleries",
        },
        {
            label: "Órdenes completadas",
            value: ordersCount,
            icon: "ShoppingBag",
            iconColor: "#10b981",
            iconBg: "#ecfdf5",
            borderAccent: "#a7f3d0",
            trend: ordersCount > 0,
            href: "/dashboard/orders",
        },
        {
            label: "Ingresos totales",
            value: `$${totalRevenue.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: "DollarSign",
            iconColor: "#8b5cf6",
            iconBg: "#f5f3ff",
            borderAccent: "#ddd6fe",
            trend: totalRevenue > 0,
            href: "/dashboard/orders",
        },
    ]

    return (

        <div style={{ padding: ".5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            <NoPlanModal subscription={subscriptionSerialized} />
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, marginLeft: "4rem" }}>
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <LayoutDashboard size={18} color="#3b82f6" />
                        </div>
                        <div className="ml-2 flex flex-row items-center">
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 7px 0" }}>
                                {greeting}
                            </p>
                            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>
                                {firstName} 👋
                            </h1>
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "6px 0 0" }}>
                        Aquí está el resumen de tu actividad.
                    </p>
                </div>
            </div>
            {/* Stat cards — Client Components */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16    }}>
                {stats.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                ))}
            </div>

            <StorageDonut style={{ padding: ".5rem" }}
                usedBytes={Number(storageData?.storageUsedBytes ?? 0)}
                maxGB={subscription?.plan?.maxStorageGB ?? -1}
            />
            {/* Two column layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>

                {/* Recent galleries */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden",  marginTop:"16px",}}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Images size={13} color="#64748b" strokeWidth={1.8} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Galerías recientes</span>
                        </div>
                        <Link href="/dashboard/galleries" style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 12,
                            border: "1px solid rgba(56, 189, 248, 0.28)",
                            background: "linear-gradient(135deg, rgba(14,165,233,0.10), rgba(56,189,248,0.08))",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#0ea5e9",
                            fontFamily: "inherit",
                            transition: "all .2s ease",
                            boxShadow: "0 2px 8px rgba(14,165,233,0.10)",
                            textDecoration: "none",
                        }}>
                            Ver todas <ChevronRight size={13} />
                        </Link>
                    </div>

                    {recentGalleries.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 24px" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                <Camera size={22} color="#cbd5e1" strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", margin: "0 0 4px" }}>Sin galerías todavía</p>
                            <p style={{ fontSize: 12, color: "#cbd5e1", margin: "0 0 16px" }}>Creá tu primera galería para empezar</p>
                            <Link href="/dashboard/galleries/new" style={{ textDecoration: "none" }}>
                                <button style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                                    + Crear galería
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div>
                            {recentGalleries.map((gallery, i) => (
                                <GalleryRow
                                    key={gallery.id}
                                    gallery={gallery}
                                    isLast={i === recentGalleries.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Recent orders */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Images size={13} color="#64748b" strokeWidth={1.8} />
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Últimas ventas</span>
                            </div>
                            <Link href="/dashboard/orders" style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 14px",
                                borderRadius: 12,
                                border: "1px solid rgba(56, 189, 248, 0.28)",
                                background: "linear-gradient(135deg, rgba(14,165,233,0.10), rgba(56,189,248,0.08))",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#0ea5e9",
                                fontFamily: "inherit",
                                transition: "all .2s ease",
                                boxShadow: "0 2px 8px rgba(14,165,233,0.10)",
                                textDecoration: "none",
                            }}>
                                Ver todas <ChevronRight size={13} />
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div style={{ padding: "24px 18px", textAlign: "center" }}>
                                <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>Sin ventas aún</p>
                            </div>
                        ) : (
                            <div>
                                {recentOrders.map((order, i) => (
                                    <div key={order.id} style={{
                                        padding: "10px 18px",
                                        borderBottom: i < recentOrders.length - 1 ? "1px solid #f8fafc" : "none",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                    }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {order.gallery?.title}
                                            </p>
                                            <p style={{ fontSize: 10, color: "#94a3b8", margin: "1px 0 0" }}>
                                                #{order.id.slice(-6).toUpperCase()}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginLeft: 8, flexShrink: 0 }}>
                                            ${Number(order.total).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/*                         <div style={{ padding: "10px 18px", borderTop: "1px solid #f1f5f9" }}>
                            <Link href="/dashboard/orders" style={{ textDecoration: "none", fontSize: 11, color: "#3b82f6", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                                Ver todas las órdenes <ChevronRight size={12} />
                            </Link>
                        </div> */}
                    </div>
                    < LinktreeStatsCard />


                    {/* Pro Tips Carousel */}
                    <ProTipCarousel tips={tips} />
                </div>
            </div>
        </div>
    )
}