"use client"

import Link from "next/link"
import { Images, Globe, Lock, Eye, Settings, ShoppingBag, Camera, Users, Clock, AlertTriangle } from "lucide-react"

function formatDate(iso) {
    return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
}

function formatExpiry(iso) {
    return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function getExpiryStatus(expiresAt) {
    if (!expiresAt) return null
    const now = new Date()
    const exp = new Date(expiresAt)
    const diffMs = exp - now
    if (diffMs < 0) return "expired"
    if (diffMs < 1000 * 60 * 60 * 24 * 3) return "soon" // menos de 3 días
    return "active"
}

export default function GalleryCard({ gallery }) {
    const hasOrders = gallery.ordersCount > 0
    const expiryStatus = getExpiryStatus(gallery.expiresAt)
    const isExpired = expiryStatus === "expired"

    return (
        <div
            style={{
                background: "white",
                border: isExpired ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                borderRadius: 16,
                overflow: "hidden",
                transition: "box-shadow 0.15s, transform 0.15s",
                cursor: "pointer",
                opacity: isExpired ? 0.85 : 1,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"
                e.currentTarget.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none"
                e.currentTarget.style.transform = "translateY(0)"
            }}
        >
            {/* Cover image */}
            <div style={{ position: "relative", width: "100%", height: 160, background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)", overflow: "hidden" }}>
                {gallery.coverImage ? (
                    <img
                        src={gallery.coverImage}
                        alt={gallery.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Camera size={28} color="#cbd5e1" strokeWidth={1.5} />
                        <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 500 }}>Sin portada</span>
                    </div>
                )}

                {/* Overlay gradient */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)" }} />

                {/* Status badges */}
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    {isExpired ? (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10, fontWeight: 700, color: "#991b1b",
                            background: "rgba(254,226,226,0.97)", border: "1px solid #fca5a5",
                            padding: "3px 8px", borderRadius: 20,
                            backdropFilter: "blur(4px)",
                        }}>
                            <AlertTriangle size={9} /> Vencida
                        </span>
                    ) : (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10, fontWeight: 700,
                            color: gallery.isPublic ? "#065f46" : "#374151",
                            background: gallery.isPublic ? "rgba(236,253,245,0.95)" : "rgba(249,250,251,0.95)",
                            border: `1px solid ${gallery.isPublic ? "#a7f3d0" : "#e5e7eb"}`,
                            padding: "3px 8px", borderRadius: 20,
                            backdropFilter: "blur(4px)",
                        }}>
                            {gallery.isPublic ? <Globe size={9} /> : <Lock size={9} />}
                            {gallery.isPublic ? "Pública" : "Privada"}
                        </span>
                    )}
                    {gallery.galleryType === "event" && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10, fontWeight: 700, color: "#4338ca",
                            background: "rgba(238,242,255,0.95)", border: "1px solid #c7d2fe",
                            padding: "3px 8px", borderRadius: 20,
                            backdropFilter: "blur(4px)",
                        }}>
                            <Users size={9} /> Evento
                        </span>
                    )}
                    {expiryStatus === "soon" && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10, fontWeight: 700, color: "#92400e",
                            background: "rgba(255,251,235,0.97)", border: "1px solid #fde68a",
                            padding: "3px 8px", borderRadius: 20,
                            backdropFilter: "blur(4px)",
                        }}>
                            <Clock size={9} /> Vence pronto
                        </span>
                    )}
                </div>

                {/* Orders badge */}
                {hasOrders && (
                    <div style={{ position: "absolute", top: 10, left: 10 }}>
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10, fontWeight: 700, color: "#1e40af",
                            background: "rgba(239,246,255,0.95)", border: "1px solid #bfdbfe",
                            padding: "3px 8px", borderRadius: 20,
                            backdropFilter: "blur(4px)",
                        }}>
                            <ShoppingBag size={9} />
                            {gallery.ordersCount} {gallery.ordersCount === 1 ? "orden" : "órdenes"}
                        </span>
                    </div>
                )}

                {/* Photo count bottom left */}
                <div style={{ position: "absolute", bottom: 10, left: 12 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                        {gallery.photosCount} {gallery.photosCount === 1 ? "foto" : "fotos"}
                        {gallery.maxPhotos !== -1 && gallery.maxPhotos > 0 && (
                            <span style={{ opacity: 0.65 }}> / {gallery.maxPhotos}</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "14px 16px 14px" }}>
                <div style={{ marginBottom: 12 }}>
                    <h3 style={{
                        fontSize: 14, fontWeight: 700, color: isExpired ? "#991b1b" : "#0f172a",
                        margin: "0 0 3px", lineHeight: 1.3,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                        {gallery.title}
                    </h3>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                        Creada el {formatDate(gallery.createdAt)}
                    </p>
                    {gallery.expiresAt && (
                        <p style={{ fontSize: 11, margin: "3px 0 0", color: isExpired ? "#dc2626" : expiryStatus === "soon" ? "#d97706" : "#64748b", fontWeight: 500 }}>
                            {isExpired ? "⛔ Venció el " : "⏱ Vence el "}{formatExpiry(gallery.expiresAt)}
                        </p>
                    )}
                </div>

                {/* Photo usage bar (if limited) */}
                {gallery.maxPhotos !== -1 && gallery.maxPhotos > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{
                                height: "100%",
                                width: `${Math.min(100, (gallery.photosCount / gallery.maxPhotos) * 100)}%`,
                                background: gallery.photosCount >= gallery.maxPhotos ? "#ef4444"
                                    : gallery.photosCount / gallery.maxPhotos >= 0.8 ? "#f59e0b"
                                    : "#10b981",
                                borderRadius: 99,
                                transition: "width 0.3s ease",
                            }} />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/dashboard/galleries/${gallery.id}`} style={{ textDecoration: "none", flex: 1 }}>
                        <button style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
                            color: "white", border: "none", borderRadius: 10,
                            padding: "8px 0", fontSize: 12, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                        }}>
                            <Settings size={13} />
                            Gestionar
                        </button>
                    </Link>
                    <Link href={`/g/${gallery.slug}`} target="_blank" style={{ textDecoration: "none" }}>
                        <button style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            background: "#f8fafc", color: "#475569",
                            border: "1px solid #e2e8f0", borderRadius: 10,
                            padding: "8px 12px", fontSize: 12, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            whiteSpace: "nowrap",
                        }}>
                            <Eye size={13} />
                            Ver
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
