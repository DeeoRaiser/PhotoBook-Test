import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
    Plus, Images, AlertTriangle, Camera,
    FolderOpen, Sparkles
} from "lucide-react"
import GalleryCard from "@/components/gallery-card"

export default async function GalleriesPage() {
    const session = await auth()
    const now = new Date()

    const [galleries, photographer] = await Promise.all([
        prisma.gallery.findMany({
            where: { photographerId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { photos: true, orders: true } } },
        }),
        prisma.photographer.findUnique({
            where: { id: session.user.id },
            include: { subscription: { include: { plan: true } } },
        }),
    ])

    const sub = photographer?.subscription
    const plan = sub?.plan
    const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now

    const maxGalleries = hasActivePlan ? plan.maxGalleries : 0
    const canCreate = hasActivePlan && (maxGalleries === -1 || galleries.length < maxGalleries)
    const usedGalleries = galleries.length
    const usagePercent = maxGalleries === -1 ? 0 : Math.min(100, (usedGalleries / maxGalleries) * 100)
    const usageColor = usagePercent >= 100 ? "#ef4444" : usagePercent >= 80 ? "#f59e0b" : "#10b981"

    // Almacenamiento
    const maxStorageGB    = hasActivePlan ? (plan.maxStorageGB ?? -1) : 0
    const usedBytes       = Number(photographer?.storageUsedBytes ?? 0)
    const usedGB          = usedBytes / (1024 ** 3)
    const storagePercent  = maxStorageGB === -1 ? 0 : Math.min(100, (usedGB / maxStorageGB) * 100)
    const storageColor    = storagePercent >= 100 ? "#ef4444" : storagePercent >= 80 ? "#f59e0b" : "#10b981"
    const formatGB = (gb) => gb < 0.01 ? `${(gb * 1024).toFixed(0)} MB` : `${gb.toFixed(2)} GB`

    // Serialize galleries for client component
    const galleriesData = galleries.map(g => ({
        id: g.id,
        title: g.title,
        slug: g.slug,
        isPublic: g.isPublic,
        coverImage: g.coverImage ?? null,
        photosCount: g._count.photos,
        ordersCount: g._count.orders,
        createdAt: g.createdAt.toISOString(),
        galleryType: g.galleryType,
        maxPhotos: hasActivePlan ? (plan.maxPhotos ?? -1) : 0,
    }))

    return (
        <div style={{ padding: ".5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, marginLeft: "4rem" }}>
                <div className="flex flex-col" >
                    <div className="flex items-center">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                             <Images size={18} color="#3b82f6" />
                        </div>
                        <h1 className="ml-2" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                            Galerías
                        </h1>
                    </div>

                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                        {usedGalleries === 0
                            ? "No tenés galerías todavía"
                            : `${usedGalleries} ${usedGalleries === 1 ? "galería" : "galerías"}${hasActivePlan && maxGalleries !== -1 ? ` · ${maxGalleries - usedGalleries} disponibles` : ""}`
                        }
                    </p>
                </div>

                {canCreate ? (
                    <Link href="/dashboard/galleries/new" style={{ textDecoration: "none" }}>
                        <button style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "linear-gradient(135deg, #1a1a2e 0%, #1e3a5f 100%)",
                            color: "white", border: "none", borderRadius: 12,
                            padding: "10px 18px", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", boxShadow: "0 4px 14px rgba(15,23,42,0.22)",
                            fontFamily: "inherit",
                        }}>
                            <Plus size={15} strokeWidth={2.5} />
                            Nueva
                        </button>
                    </Link>
                ) : (
                    <button disabled style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0",
                        borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 600,
                        cursor: "not-allowed", fontFamily: "inherit",
                    }}>
                        <Plus size={15} strokeWidth={2.5} />
                        Nueva galería
                    </button>
                )}
            </div>

            {/* Alerts */}
            {!hasActivePlan && (
                <div style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    background: "#fffbeb", border: "1px solid #fde68a",
                    borderRadius: 14, padding: "14px 18px", marginBottom: 20,
                }}>
                    <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 2px" }}>Sin plan activo</p>
                        <p style={{ fontSize: 12, color: "#b45309", margin: 0 }}>
                            Necesitás un plan activo para crear galerías y subir fotos.{" "}
                            <Link href="/dashboard/subscription" style={{ color: "#d97706", fontWeight: 600 }}>Ver planes →</Link>
                        </p>
                    </div>
                </div>
            )}

            {hasActivePlan && maxGalleries !== -1 && usedGalleries >= maxGalleries && (
                <div style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    background: "#eff6ff", border: "1px solid #bfdbfe",
                    borderRadius: 14, padding: "14px 18px", marginBottom: 20,
                }}>
                    <AlertTriangle size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1e40af", margin: "0 0 2px" }}>Límite alcanzado</p>
                        <p style={{ fontSize: 12, color: "#2563eb", margin: 0 }}>
                            Tu plan <strong>{plan.name}</strong> permite hasta {maxGalleries} {maxGalleries === 1 ? "galería" : "galerías"}.{" "}
                            <Link href="/dashboard/subscription" style={{ color: "#3b82f6", fontWeight: 600 }}>Mejorar plan →</Link>
                        </p>
                    </div>
                </div>
            )}

            {/* Usage bar */}
            {hasActivePlan && (maxGalleries !== -1 || maxStorageGB !== -1) && (
                <div style={{
                    background: "white", border: "1px solid #e2e8f0",
                    borderRadius: 14, padding: "16px 20px", marginBottom: 24,
                }}>
                    {/* Header del card */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FolderOpen size={14} color="#64748b" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: 0, letterSpacing: "0.04em" }}>USO DEL PLAN</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{plan.name}</p>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Barra de galerías */}
                        {maxGalleries !== -1 && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                                        <FolderOpen size={11} color="#94a3b8" /> Galerías
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                                        {usedGalleries} / {maxGalleries}
                                    </span>
                                </div>
                                <div style={{ height: 7, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${usagePercent}%`, background: usageColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                                </div>
                            </div>
                        )}

                        {/* Barra de almacenamiento */}
                        {maxStorageGB !== -1 ? (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                                        💾 Almacenamiento
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                                        {formatGB(usedGB)} / {maxStorageGB} GB
                                    </span>
                                </div>
                                <div style={{ height: 7, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${storagePercent}%`, background: storageColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                                </div>
                                {storagePercent >= 80 && (
                                    <p style={{ fontSize: 11, color: storagePercent >= 100 ? "#ef4444" : "#d97706", marginTop: 5, marginBottom: 0, fontWeight: 600 }}>
                                        {storagePercent >= 100
                                            ? "⚠️ Almacenamiento lleno. No podés subir más fotos."
                                            : `⚠️ Queda solo ${formatGB((maxStorageGB - usedGB))} de espacio libre.`}
                                        {" "}<Link href="/dashboard/subscription" style={{ color: "inherit" }}>Mejorar plan →</Link>
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                                        💾 Almacenamiento
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>
                                        {formatGB(usedGB)} usados · Ilimitado
                                    </span>
                                </div>
                                <div style={{ height: 7, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, #d1fae5, #6ee7b7)", borderRadius: 99 }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {galleries.length === 0 ? (
                <div style={{
                    background: "white", border: "1px solid #e2e8f0", borderRadius: 16,
                    padding: "64px 24px", textAlign: "center",
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20,
                        background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                        border: "1px solid #e2e8f0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                    }}>
                        <Camera size={26} color="#cbd5e1" strokeWidth={1.5} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#64748b", margin: "0 0 6px" }}>
                        {hasActivePlan ? "Todavía no tenés galerías" : "Necesitás un plan activo"}
                    </h3>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                        {hasActivePlan
                            ? "Creá tu primera galería para empezar a compartir y vender tus fotos."
                            : "Activá un plan para crear galerías y subir fotos."
                        }
                    </p>
                    {canCreate && (
                        <Link href="/dashboard/galleries/new" style={{ textDecoration: "none" }}>
                            <button style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
                                color: "white", border: "none", borderRadius: 12,
                                padding: "11px 22px", fontSize: 13, fontWeight: 600,
                                cursor: "pointer", fontFamily: "inherit",
                                boxShadow: "0 4px 14px rgba(15,23,42,0.2)",
                            }}>
                                <Plus size={15} />
                                Crear primera galería
                            </button>
                        </Link>
                    )}
                    {!hasActivePlan && (
                        <Link href="/dashboard/subscription" style={{ textDecoration: "none" }}>
                            <button style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                                color: "white", border: "none", borderRadius: 12,
                                padding: "11px 22px", fontSize: 13, fontWeight: 600,
                                cursor: "pointer", fontFamily: "inherit",
                                boxShadow: "0 4px 14px rgba(2,132,199,0.3)",
                            }}>
                                <Sparkles size={14} />
                                Ver planes disponibles
                            </button>
                        </Link>
                    )}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {galleriesData.map((gallery) => (
                        <GalleryCard key={gallery.id} gallery={gallery} />
                    ))}
                </div>
            )}
        </div>
    )
}