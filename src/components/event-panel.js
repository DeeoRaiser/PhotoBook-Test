"use client"

import { useState, useEffect, useCallback } from "react"
import {
    QrCode, Users, Camera, Video, Download,
    RefreshCw, Loader2, Trash2, ChevronDown, ChevronUp,
    ExternalLink
} from "lucide-react"

export default function EventPanel({ galleryId, gallerySlug }) {
    const [guests, setGuests] = useState([])
    const [communityPhotos, setCommunityPhotos] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedGuest, setExpandedGuest] = useState(null)
    const [deletingPhoto, setDeletingPhoto] = useState(null)
    const [showQr, setShowQr] = useState(false)

    const checkinUrl = typeof window !== "undefined"
        ? `${window.location.origin}/g/${gallerySlug}/checkin`
        : `/g/${gallerySlug}/checkin`

    const fetch_data = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/galleries/${galleryId}/community`)
            const data = await res.json()
            setGuests(data.guests || [])
            setCommunityPhotos(data.photos || [])
        } catch {}
        setLoading(false)
    }, [galleryId])

    useEffect(() => { fetch_data() }, [fetch_data])

    const handleDeletePhoto = async (photoId) => {
        if (!confirm("¿Eliminar esta foto?")) return
        setDeletingPhoto(photoId)
        await fetch(`/api/galleries/${galleryId}/community`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoId }),
        })
        await fetch_data()
        setDeletingPhoto(null)
    }

    const downloadQr = () => {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkinUrl)}&bgcolor=ffffff&color=0f172a&qzone=2`
        const link = document.createElement("a")
        link.download = `qr-evento-${gallerySlug}.png`
        link.href = qrApiUrl
        link.target = "_blank"
        link.click()
    }

    // Group photos by guest
    const photosByGuest = {}
    communityPhotos.forEach((p) => {
        if (!photosByGuest[p.guestId]) photosByGuest[p.guestId] = []
        photosByGuest[p.guestId].push(p)
    })

    const totalPhotos = communityPhotos.filter((p) => !p.isVideo).length
    const totalVideos = communityPhotos.filter((p) => p.isVideo).length

    return (
        <div style={S.root}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <p style={S.title}>Panel de Evento</p>
                    <p style={S.sub}>{guests.length} invitados · {totalPhotos} fotos · {totalVideos} videos</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button style={S.iconBtn} onClick={fetch_data} title="Actualizar">
                        <RefreshCw size={14} />
                    </button>
                    <button
                        style={{ ...S.iconBtn, background: showQr ? "#0f172a" : "white", color: showQr ? "white" : "#475569" }}
                        onClick={() => setShowQr((v) => !v)}
                    >
                        <QrCode size={14} />
                    </button>
                </div>
            </div>

            {/* QR Section */}
            {showQr && (
                <div style={S.qrBox}>
                    <div style={S.qrLeft}>
                        <p style={S.qrTitle}>Código QR para invitados</p>
                        <p style={S.qrSub}>
                            Mostrá este QR en el evento. Al escanearlo, los invitados se registran con su nombre y selfie.
                        </p>
                        <div style={S.qrUrl}>{checkinUrl}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button style={S.qrBtn} onClick={downloadQr}>
                                <Download size={13} /> Descargar QR
                            </button>
                            <a
                                href={checkinUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ ...S.qrBtn, background: "white", color: "#475569", border: "1px solid #e2e8f0", textDecoration: "none" }}
                            >
                                <ExternalLink size={13} /> Abrir
                            </a>
                        </div>
                    </div>
                    <div style={S.qrRight}>
                        <QrCodeCanvas url={checkinUrl} id="event-qr-canvas" />
                    </div>
                </div>
            )}

            {/* Guest list */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                    <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "#94a3b8" }} />
                </div>
            ) : guests.length === 0 ? (
                <div style={S.empty}>
                    <Users size={28} color="#cbd5e1" strokeWidth={1.5} />
                    <p style={S.emptyTitle}>Aún no hay invitados registrados</p>
                    <p style={S.emptySub}>Compartí el QR para que los invitados se registren y empiecen a subir sus fotos</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {guests.map((guest) => {
                        const gPhotos = photosByGuest[guest.id] || []
                        const isExpanded = expandedGuest === guest.id
                        return (
                            <div key={guest.id} style={S.guestCard}>
                                <button
                                    style={S.guestRow}
                                    onClick={() => setExpandedGuest(isExpanded ? null : guest.id)}
                                >
                                    {/* Avatar */}
                                    {guest.selfieUrl ? (
                                        <img src={guest.selfieUrl} alt="" style={S.guestAvatar} />
                                    ) : (
                                        <div style={S.guestAvatarFallback}>{guest.name[0]?.toUpperCase()}</div>
                                    )}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={S.guestName}>{guest.name}</p>
                                        <p style={S.guestMeta}>
                                            {gPhotos.filter(p => !p.isVideo).length} fotos · {gPhotos.filter(p => p.isVideo).length} videos
                                            · {new Date(guest.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>

                                    {isExpanded ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                                </button>

                                {/* Expanded: photos grid */}
                                {isExpanded && gPhotos.length > 0 && (
                                    <div style={S.guestPhotos}>
                                        {gPhotos.map((photo) => (
                                            <div key={photo.id} style={S.photoThumb}>
                                                {photo.isVideo ? (
                                                    <div style={S.videoThumb}>
                                                        <Video size={18} color="white" />
                                                    </div>
                                                ) : (
                                                    <img src={photo.bunnyUrl} alt="" style={S.thumbImg} />
                                                )}
                                                <button
                                                    style={S.deleteBtn}
                                                    onClick={() => handleDeletePhoto(photo.id)}
                                                    disabled={deletingPhoto === photo.id}
                                                >
                                                    {deletingPhoto === photo.id
                                                        ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                                                        : <Trash2 size={10} />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {isExpanded && gPhotos.length === 0 && (
                                    <p style={{ fontSize: 12, color: "#94a3b8", padding: "10px 14px 14px" }}>
                                        Este invitado aún no subió fotos
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ── Mini QR canvas renderer using native canvas API ────────────────────────
function QrCodeCanvas({ url, id }) {
    // We use a simple approach: display the URL as a QR using a free API
    // In production, use 'qrcode' npm package for offline generation
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=0f172a&qzone=2`
    return (
        <img
            id={id}
            src={qrApiUrl}
            alt="QR Check-in"
            style={{ width: 160, height: 160, borderRadius: 12, display: "block" }}
            crossOrigin="anonymous"
        />
    )
}

const S = {
    root: {
        background: "white", border: "1px solid #e2e8f0",
        borderRadius: 16, overflow: "hidden",
        fontFamily: "'DM Sans', system-ui, sans-serif",
    },
    header: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 18px", borderBottom: "1px solid #f1f5f9",
    },
    title: { fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 },
    sub: { fontSize: 11, color: "#94a3b8", margin: "2px 0 0" },
    iconBtn: {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32, borderRadius: 9,
        border: "1px solid #e2e8f0", background: "white",
        cursor: "pointer", color: "#475569",
    },

    // QR box
    qrBox: {
        display: "flex", gap: 20, alignItems: "flex-start",
        padding: "16px 18px", borderBottom: "1px solid #f1f5f9",
        background: "#fafafa", flexWrap: "wrap",
    },
    qrLeft: { flex: 1, minWidth: 200 },
    qrRight: { flexShrink: 0 },
    qrTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
    qrSub: { fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 },
    qrUrl: {
        fontSize: 11, color: "#6366f1", fontWeight: 600,
        background: "#eef2ff", padding: "6px 10px", borderRadius: 8,
        wordBreak: "break-all",
    },
    qrBtn: {
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "#0f172a", color: "white", border: "none",
        borderRadius: 8, padding: "7px 12px",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        fontFamily: "inherit",
    },

    // Guest list
    empty: { textAlign: "center", padding: "40px 24px" },
    emptyTitle: { fontSize: 14, fontWeight: 600, color: "#94a3b8", margin: "10px 0 4px" },
    emptySub: { fontSize: 12, color: "#cbd5e1", margin: 0, maxWidth: 280, marginLeft: "auto", marginRight: "auto" },

    guestCard: {
        border: "1px solid #f1f5f9", borderRadius: 12,
        overflow: "hidden", margin: "0 14px 8px",
    },
    guestRow: {
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", background: "white",
        border: "none", cursor: "pointer", width: "100%",
        textAlign: "left", fontFamily: "inherit",
    },
    guestAvatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
    guestAvatarFallback: {
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        color: "white", fontSize: 15, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    guestName: { fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 },
    guestMeta: { fontSize: 11, color: "#94a3b8", margin: "2px 0 0" },

    guestPhotos: {
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
        gap: 6, padding: "8px 12px 12px", background: "#f8fafc",
    },
    photoThumb: {
        position: "relative", aspectRatio: "1",
        borderRadius: 8, overflow: "hidden", background: "#e2e8f0",
    },
    thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    videoThumb: {
        width: "100%", height: "100%", background: "#1e293b",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    deleteBtn: {
        position: "absolute", top: 3, right: 3,
        width: 20, height: 20, borderRadius: 6,
        background: "rgba(239,68,68,0.85)", border: "none",
        cursor: "pointer", color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
}