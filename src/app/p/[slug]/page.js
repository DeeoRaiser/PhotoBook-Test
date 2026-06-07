"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { use } from "react"
import {
    Globe, Loader2, Mail, MapPin, Camera, MessageCircle,
    Images, User, Eye, Share2, Grid3X3, List, Sparkles,
    X, Copy, Check, ChevronLeft, ChevronRight, Star,
    Phone, ExternalLink, Send, Play, Lock, Heart
} from "lucide-react"
import {
    FaFacebook as Facebook, FaInstagram as Instagram,
    FaYoutube as Youtube, FaLinkedin as Linkedin,
    FaTiktok as Tiktok, FaWhatsapp as Whatsapp
} from "react-icons/fa"
import ShareModal from "@/components/SharedModal"

// ── Temas ──────────────────────────────────────────────────────────────────────
const THEMES = {
    dark: {
        page: "#0f172a",
        card: "#1e293b",
        cardBorder: "rgba(255,255,255,0.08)",
        text: "#f1f5f9",
        textSub: "#94a3b8",
        textMuted: "#475569",
        accent: "#3b82f6",
        accentBg: "rgba(59,130,246,0.15)",
        accentBorder: "rgba(59,130,246,0.3)",
        tag: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
        pill: { bg: "rgba(255,255,255,0.08)", color: "#94a3b8" },
        btn: { bg: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "white" },
        btnSec: { bg: "rgba(255,255,255,0.07)", color: "#e2e8f0", border: "rgba(255,255,255,0.12)" },
        btnWa: { bg: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white" },
        statsBar: "rgba(255,255,255,0.04)",
        statsBorder: "rgba(255,255,255,0.08)",
        tabBar: "rgba(255,255,255,0.05)",
        tabActive: { bg: "rgba(255,255,255,0.1)", color: "#f1f5f9" },
        tabInactive: { color: "#64748b" },
        input: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "#f1f5f9", placeholder: "#475569" },
        coverGrad: "linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)",
        coverOverlay: "linear-gradient(to bottom,rgba(15,23,42,.2),rgba(15,23,42,.85),#0f172a)",
        avatarBorder: "#0f172a",
        avatarGrad: "linear-gradient(135deg,#1e1b4b,#312e81)",
        social: {
            instagram: { color: "#E1306C", bg: "rgba(225,48,108,0.12)", border: "rgba(225,48,108,0.25)" },
            facebook: { color: "#1877F2", bg: "rgba(24,119,242,0.12)", border: "rgba(24,119,242,0.25)" },
            youtube: { color: "#FF0000", bg: "rgba(255,0,0,0.12)", border: "rgba(255,0,0,0.25)" },
            linkedin: { color: "#0A66C2", bg: "rgba(10,102,194,0.12)", border: "rgba(10,102,194,0.25)" },
            tiktok: { color: "#e2e8f0", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)" },
            website: { color: "#94a3b8", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" },
            email: { color: "#94a3b8", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" },
            whatsapp: { color: "#25D366", bg: "rgba(37,211,102,0.12)", border: "rgba(37,211,102,0.25)" },
        }
    },
    light: {
        page: "#f8fafc",
        card: "#ffffff",
        cardBorder: "#e2e8f0",
        text: "#0f172a",
        textSub: "#475569",
        textMuted: "#94a3b8",
        accent: "#0f172a",
        accentBg: "rgba(15,23,42,0.07)",
        accentBorder: "rgba(15,23,42,0.15)",
        tag: { bg: "#f1f5f9", color: "#334155", border: "#e2e8f0" },
        pill: { bg: "#f1f5f9", color: "#64748b" },
        btn: { bg: "linear-gradient(135deg,#0f172a,#1e3a5f)", color: "white" },
        btnSec: { bg: "white", color: "#374151", border: "#d1d5db" },
        btnWa: { bg: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white" },
        statsBar: "#f1f5f9",
        statsBorder: "#e2e8f0",
        tabBar: "#f1f5f9",
        tabActive: { bg: "white", color: "#0f172a" },
        tabInactive: { color: "#64748b" },
        input: { bg: "white", border: "#d1d5db", color: "#0f172a", placeholder: "#9ca3af" },
        coverGrad: "linear-gradient(135deg,#e2e8f0,#cbd5e1,#94a3b8)",
        coverOverlay: "linear-gradient(to bottom,rgba(248,250,252,.1),rgba(248,250,252,.75),#f8fafc)",
        avatarBorder: "#f8fafc",
        avatarGrad: "linear-gradient(135deg,#334155,#475569)",
        social: {
            instagram: { color: "#E1306C", bg: "#fdf2f8", border: "#fbcfe8" },
            facebook: { color: "#1877F2", bg: "#eff6ff", border: "#bfdbfe" },
            youtube: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
            linkedin: { color: "#0A66C2", bg: "#eff6ff", border: "#bfdbfe" },
            tiktok: { color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
            website: { color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
            email: { color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
            whatsapp: { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
        }
    },
    warm: {
        page: "#1c1008",
        card: "#261a0c",
        cardBorder: "rgba(245,158,11,0.12)",
        text: "#fef3c7",
        textSub: "#d97706",
        textMuted: "#92400e",
        accent: "#f59e0b",
        accentBg: "rgba(245,158,11,0.12)",
        accentBorder: "rgba(245,158,11,0.3)",
        tag: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
        pill: { bg: "rgba(245,158,11,0.08)", color: "#d97706" },
        btn: { bg: "linear-gradient(135deg,#d97706,#b45309)", color: "white" },
        btnSec: { bg: "rgba(245,158,11,0.08)", color: "#fef3c7", border: "rgba(245,158,11,0.2)" },
        btnWa: { bg: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white" },
        statsBar: "rgba(245,158,11,0.05)",
        statsBorder: "rgba(245,158,11,0.12)",
        tabBar: "rgba(245,158,11,0.06)",
        tabActive: { bg: "rgba(245,158,11,0.15)", color: "#fef3c7" },
        tabInactive: { color: "#92400e" },
        input: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", color: "#fef3c7", placeholder: "#92400e" },
        coverGrad: "linear-gradient(135deg,#1c1008,#292010,#3d2b0d)",
        coverOverlay: "linear-gradient(to bottom,rgba(28,16,8,.2),rgba(28,16,8,.85),#1c1008)",
        avatarBorder: "#1c1008",
        avatarGrad: "linear-gradient(135deg,#92400e,#b45309)",
        social: {
            instagram: { color: "#E1306C", bg: "rgba(225,48,108,0.12)", border: "rgba(225,48,108,0.2)" },
            facebook: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
            youtube: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)" },
            linkedin: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
            tiktok: { color: "#fef3c7", bg: "rgba(254,243,199,0.08)", border: "rgba(254,243,199,0.15)" },
            website: { color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)" },
            email: { color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)" },
            whatsapp: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)" },
        }
    }
}

const SOCIAL_CONFIG = {
    instagram: { icon: Instagram, label: "Instagram" },
    facebook: { icon: Facebook, label: "Facebook" },
    youtube: { icon: Youtube, label: "YouTube" },
    linkedin: { icon: Linkedin, label: "LinkedIn" },
    tiktok: { icon: Tiktok, label: "TikTok" },
    website: { icon: Globe, label: "Sitio Web" },
    email: { icon: Mail, label: "Email" },
    whatsapp: { icon: Whatsapp, label: "WhatsApp" },
}

// ── Gallery Preview Lightbox ───────────────────────────────────────────────────
function GalleryPreviewLightbox({ gallery, onClose }) {
    const [photos, setPhotos] = useState([])
    const [loading, setLoading] = useState(true)
    const [idx, setIdx] = useState(0)
    const touchRef = useRef(null)

    useEffect(() => {
        fetch(`/api/galleries/public/${gallery.slug}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setPhotos(d?.photos?.slice(0, 12) || []); setLoading(false) })
    }, [gallery.slug])

    useEffect(() => {
        const h = e => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") setIdx(i => (i + 1) % Math.max(photos.length, 1)); if (e.key === "ArrowLeft") setIdx(i => (i - 1 + Math.max(photos.length, 1)) % Math.max(photos.length, 1)) }
        document.body.style.overflow = "hidden"
        window.addEventListener("keydown", h)
        return () => { window.removeEventListener("keydown", h); document.body.style.overflow = "" }
    }, [onClose, photos.length])

    const nav = dir => setIdx(i => (i + dir + photos.length) % photos.length)

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',system-ui,sans-serif" }}
            onTouchStart={e => { touchRef.current = e.touches[0].clientX }}
            onTouchEnd={e => { if (touchRef.current === null) return; const d = touchRef.current - e.changedTouches[0].clientX; if (Math.abs(d) > 50) nav(d > 0 ? 1 : -1); touchRef.current = null }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>{gallery.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", margin: 0 }}>{gallery._count?.photos ?? photos.length} fotos · preview</p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <a href={`/g/${gallery.slug}`} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: "rgba(255,255,255,.1)", color: "white", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                        <ExternalLink size={13} /> Ver galería completa
                    </a>
                    <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Main image */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 0 }}>
                {loading ? (
                    <Loader2 size={32} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
                ) : photos.length === 0 ? (
                    <div style={{ textAlign: "center", color: "rgba(255,255,255,.4)" }}>
                        <Lock size={40} style={{ marginBottom: 12 }} />
                        <p style={{ margin: 0 }}>Galería privada — hacé clic en "Ver galería completa"</p>
                    </div>
                ) : (
                    <>
                        {photos.length > 1 && <button onClick={() => nav(-1)} style={{ position: "absolute", left: 12, zIndex: 2, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.12)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={22} /></button>}
                        <img src={photos[idx]?.bunnyUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: "0 60px", boxSizing: "border-box" }} draggable={false} onContextMenu={e => e.preventDefault()} />
                        {photos.length > 1 && <button onClick={() => nav(1)} style={{ position: "absolute", right: 12, zIndex: 2, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.12)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={22} /></button>}
                    </>
                )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
                <div style={{ display: "flex", gap: 6, padding: "12px 16px", overflowX: "auto", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    {photos.map((p, i) => (
                        <div key={p.id} onClick={() => setIdx(i)} style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: `2px solid ${i === idx ? "#3b82f6" : "transparent"}`, opacity: i === idx ? 1 : 0.5, transition: "all .15s" }}>
                            <img src={p.bunnyUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    ))}
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ── Gallery Card ──────────────────────────────────────────────────────────────
function GalleryCard({ gallery, T, onPreview }) {
    const [hovered, setHovered] = useState(false)
    const photoCount = gallery._count?.photos ?? 0

    return (
        <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, overflow: "hidden", transition: "transform .2s, box-shadow .2s", transform: hovered ? "translateY(-3px)" : "none", boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.3)" : "none", cursor: "pointer" }}>
            {/* Cover */}
            <div style={{ position: "relative", aspectRatio: "16/9", background: T.card, overflow: "hidden" }} onClick={() => onPreview(gallery)}>
                {gallery.coverImage
                    ? <img src={gallery.coverImage} alt={gallery.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s", transform: hovered ? "scale(1.05)" : "scale(1)" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.2))", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={36} color={T.textMuted} strokeWidth={1.5} /></div>
                }
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.6),transparent)", opacity: hovered ? 1 : 0, transition: "opacity .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, color: "white", fontSize: 13, fontWeight: 700 }}>
                        <Eye size={14} /> Vista previa
                    </div>
                </div>
                {gallery.isFeatured && (
                    <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(245,158,11,0.9)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "white" }}>
                        <Star size={10} fill="currentColor" /> Destacada
                    </div>
                )}
                {gallery.galleryType === "event" && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(99,102,241,0.85)", borderRadius: 20, padding: "4px 9px", fontSize: 10, fontWeight: 700, color: "white" }}>Evento</div>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: "14px 16px 16px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gallery.title}</h3>
                {gallery.description && <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>{gallery.description}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{new Date(gallery.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: T.pill.bg, color: T.pill.color }}>{photoCount} foto{photoCount !== 1 ? "s" : ""}</span>
                        <a href={`/g/${gallery.slug}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: T.accentBg, color: T.accent, border: `1px solid ${T.accentBorder}`, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                            Ver <ExternalLink size={9} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Social Button ─────────────────────────────────────────────────────────────
function SocialBtn({ type, href, T }) {
    const cfg = SOCIAL_CONFIG[type]
    const style = T.social[type] || T.social.website
    if (!cfg) return null
    const Icon = cfg.icon
    return (
        <a href={href} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 12, background: style.bg, border: `1px solid ${style.border}`, color: style.color, textDecoration: "none", fontSize: 13, fontWeight: 600, transition: "opacity .15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".75"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <Icon size={18} /> {cfg.label}
        </a>
    )
}

// ── Photo Lightbox ────────────────────────────────────────────────────────────
function PhotoLightbox({ photos, initialIndex, onClose }) {
    const [idx, setIdx] = useState(initialIndex)
    const touchRef = useRef(null)
    const nav = dir => setIdx(i => (i + dir + photos.length) % photos.length)

    useEffect(() => {
        const h = e => {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowRight") nav(1)
            if (e.key === "ArrowLeft") nav(-1)
        }
        document.body.style.overflow = "hidden"
        window.addEventListener("keydown", h)
        return () => { window.removeEventListener("keydown", h); document.body.style.overflow = "" }
    }, [onClose, photos.length])

    const photo = photos[idx]

    return (
        <div
            style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.96)", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',system-ui,sans-serif" }}
            onTouchStart={e => { touchRef.current = e.touches[0].clientX }}
            onTouchEnd={e => { if (touchRef.current === null) return; const d = touchRef.current - e.changedTouches[0].clientX; if (Math.abs(d) > 50) nav(d > 0 ? 1 : -1); touchRef.current = null }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.45)", margin: 0 }}>{idx + 1} / {photos.length}</p>
                <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={18} />
                </button>
            </div>

            {/* Main image */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 0, padding: "0 60px" }}>
                {photos.length > 1 && (
                    <button onClick={() => nav(-1)} style={{ position: "absolute", left: 12, zIndex: 2, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.12)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronLeft size={22} />
                    </button>
                )}
                <img
                    src={photo.bunnyUrl}
                    alt={photo.caption || ""}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                />
                {photos.length > 1 && (
                    <button onClick={() => nav(1)} style={{ position: "absolute", right: 12, zIndex: 2, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.12)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronRight size={22} />
                    </button>
                )}
            </div>

            {/* Caption */}
            {photo.caption && (
                <div style={{ padding: "12px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", margin: 0 }}>{photo.caption}</p>
                </div>
            )}

            {/* Thumbnail strip */}
            {photos.length > 1 && (
                <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    {photos.map((p, i) => (
                        <div key={p.id} onClick={() => setIdx(i)}
                            style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: `2px solid ${i === idx ? "#3b82f6" : "transparent"}`, opacity: i === idx ? 1 : 0.45, transition: "all .15s" }}>
                            <img src={p.bunnyUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm({ data, T }) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name || !message) { setError("Completá el nombre y el mensaje"); return }
        if (!email && !phone) { setError("Ingresá al menos un email o teléfono para que pueda responderte"); return }
        setSending(true); setError("")
        try {
            const res = await fetch("/api/portfolio/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photographerEmail: data.portfolioEmail, photographerId: data.id, name, email, phone, message, photographerName: data.name })
            })
            if (res.ok) setSent(true)
            else setError("Error al enviar. Intentá de nuevo.")
        } catch { setError("Error de conexión") }
        setSending(false)
    }

    const inp = { width: "100%", padding: "11px 14px", fontSize: 13, fontWeight: 500, borderRadius: 11, border: `1.5px solid ${T.input.border}`, background: T.input.bg, color: T.input.color, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }

    if (sent) return (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Check size={24} color="#22c55e" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>¡Mensaje enviado!</p>
            <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>{data.name} va a recibir tu consulta y te va a responder pronto.</p>
        </div>
    )

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Nombre */}
            <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: ".05em", display: "block", marginBottom: 5 }}>TU NOMBRE *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Juan García" style={inp} />
            </div>

            {/* Email + Teléfono */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: ".05em", display: "block", marginBottom: 5 }}>
                        EMAIL
                        <span style={{ fontSize: 10, fontWeight: 500, color: T.textMuted, marginLeft: 5 }}>(o teléfono)</span>
                    </label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@email.com" style={inp} />
                </div>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: ".05em", display: "block", marginBottom: 5 }}>
                        TELÉFONO
                        <span style={{ fontSize: 10, fontWeight: 500, color: T.textMuted, marginLeft: 5 }}>(o email)</span>
                    </label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 11 1234-5678" style={inp} />
                </div>
            </div>
            <p style={{ fontSize: 11, color: T.textMuted, margin: "-4px 0 0" }}>Completá al menos uno de los dos campos de contacto</p>

            {/* Mensaje */}
            <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: ".05em", display: "block", marginBottom: 5 }}>MENSAJE *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hola, me interesa tu trabajo..." rows={4} style={{ ...inp, resize: "vertical", minHeight: 100 }} />
            </div>

            {error && <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>}

            <button type="submit" disabled={sending} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, border: "none", cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, background: T.btn.bg, color: T.btn.color, opacity: sending ? .7 : 1 }}>
                {sending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                {sending ? "Enviando..." : "Enviar mensaje"}
            </button>
        </form>
    )
}



// ── Main Component ─────────────────────────────────────────────────────────────
export default function PublicPortfolioPage({ params }) {
    const { slug } = use(params)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("galleries")
    const [viewMode, setViewMode] = useState("grid")
    const [showShare, setShowShare] = useState(false)
    const [previewGallery, setPreviewGallery] = useState(null)
    const [scrollY, setScrollY] = useState(0)
    const [lightboxPhoto, setLightboxPhoto] = useState(null)

    useEffect(() => {
        const h = () => setScrollY(window.scrollY)
        window.addEventListener("scroll", h, { passive: true })
        return () => window.removeEventListener("scroll", h)
    }, [])

    useEffect(() => {
        fetch(`/api/portfolio/public/${slug}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false) })
    }, [slug])

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0f172a", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            <Loader2 size={32} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Cargando PhotoBook...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!data) return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#0f172a", fontFamily: "'DM Sans',system-ui,sans-serif", padding: 24 }}>
            <Camera size={48} color="#334155" strokeWidth={1.5} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Portfolio no encontrado</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0, textAlign: "center" }}>Este perfil no existe o fue desactivado</p>
        </div>
    )

    // ── helpers para mezclar colores sin color-mix ──────────────────────────
    function hexToRgb(hex) {
        const h = hex.replace("#", "")
        return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
        }
    }
    function mix(hex1, hex2, t = 0.5) {
        const a = hexToRgb(hex1), b = hexToRgb(hex2)
        const r = Math.round(a.r + (b.r - a.r) * t)
        const g = Math.round(a.g + (b.g - a.g) * t)
        const bl = Math.round(a.b + (b.b - a.b) * t)
        return `rgb(${r},${g},${bl})`
    }

    let T
    if (data.portfolioTheme?.startsWith("custom:")) {
        const parts = data.portfolioTheme.split(":")
        const bg = parts[1] || "#0f172a"
        const card = parts[2] || "#1e293b"
        const accent = parts[3] || "#3b82f6"

        const { r, g, b } = hexToRgb(bg)
        const isDark = r * 0.299 + g * 0.587 + b * 0.114 < 128

        const textColor = isDark ? "#f1f5f9" : "#0f172a"
        const textSub = isDark ? "#94a3b8" : "#475569"
        const textMuted = isDark ? "#475569" : "#94a3b8"

        T = {
            page: bg,
            card: card,
            cardBorder: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
            text: textColor,
            textSub,
            textMuted,
            accent,
            accentBg: `${accent}22`,
            accentBorder: `${accent}44`,
            tag: { bg: `${accent}22`, color: accent, border: `${accent}44` },
            pill: { bg: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9", color: textSub },
            btn: { bg: accent, color: "#ffffff" },
            btnSec: { bg: isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9", color: textColor, border: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0" },
            btnWa: { bg: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white" },
            statsBar: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
            statsBorder: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
            tabBar: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
            tabActive: { bg: isDark ? "rgba(255,255,255,0.1)" : "white", color: textColor },
            tabInactive: { color: textMuted },
            input: { bg: isDark ? "rgba(255,255,255,0.05)" : "white", border: isDark ? "rgba(255,255,255,0.1)" : "#d1d5db", color: textColor, placeholder: textMuted },
            coverGrad: `linear-gradient(135deg, ${bg}, ${mix(bg, accent, 0.4)})`,
            coverOverlay: `linear-gradient(to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7), ${bg})`,
            avatarBorder: bg,
            avatarGrad: `linear-gradient(135deg, ${mix(accent, "#000000", 0.4)}, ${accent})`,
            social: {
                instagram: { color: "#E1306C", bg: "rgba(225,48,108,0.12)", border: "rgba(225,48,108,0.25)" },
                facebook: { color: "#1877F2", bg: "rgba(24,119,242,0.12)", border: "rgba(24,119,242,0.25)" },
                youtube: { color: "#FF0000", bg: "rgba(255,0,0,0.12)", border: "rgba(255,0,0,0.25)" },
                linkedin: { color: "#0A66C2", bg: "rgba(10,102,194,0.12)", border: "rgba(10,102,194,0.25)" },
                tiktok: { color: textColor, bg: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9", border: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0" },
                website: { color: textSub, bg: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc", border: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0" },
                email: { color: textSub, bg: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc", border: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0" },
                whatsapp: { color: "#25D366", bg: "rgba(37,211,102,0.12)", border: "rgba(37,211,102,0.25)" },
            }
        }
    } else {
        T = THEMES[data.portfolioTheme || "light"] || THEMES.light
    }

    const tags = (data.portfolioSpecialty || "").split(",").map(s => s.trim()).filter(Boolean)

    const socials = [
        data.portfolioInstagram && { key: "instagram", href: data.portfolioInstagram },
        data.portfolioFacebook && { key: "facebook", href: data.portfolioFacebook },
        data.portfolioYoutube && { key: "youtube", href: data.portfolioYoutube },
        data.portfolioLinkedin && { key: "linkedin", href: data.portfolioLinkedin },
        data.portfolioTiktok && { key: "tiktok", href: data.portfolioTiktok },
        data.portfolioWebsite && { key: "website", href: data.portfolioWebsite },
        data.portfolioEmail && { key: "email", href: `mailto:${data.portfolioEmail}` },
        data.portfolioWhatsapp && { key: "whatsapp", href: `https://wa.me/${data.portfolioWhatsapp.replace(/\D/g, "")}` },
    ].filter(Boolean)

    const featured = (data.galleries || []).filter(g => g.isFeatured)
    const rest = (data.galleries || []).filter(g => !g.isFeatured)
    const allGalleries = [...featured, ...rest]

    const parallaxOffset = scrollY * 0.1
    const coverOpacity = Math.max(0, 1 - scrollY / 450)

    const tabs = [
        { key: "photos", label: "Fotos", icon: Camera, count: (data.portfolioImages || []).length },
        { key: "galleries", label: "Galerías", icon: Images, count: allGalleries.length },
        { key: "about", label: "Sobre mí", icon: User, count: null },
        { key: "contact", label: "Contacto", icon: MessageCircle, count: null },
    ]

    const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`

    return (
        <div style={{ minHeight: "100vh", background: T.page, fontFamily: "'DM Sans',system-ui,sans-serif", color: T.text, WebkitFontSmoothing: "antialiased" }}>

            {/* ── LIGHTBOX PREVIEW ── */}
            {previewGallery && <GalleryPreviewLightbox gallery={previewGallery} onClose={() => setPreviewGallery(null)} />}

            {lightboxPhoto !== null && (
                <PhotoLightbox
                    photos={data.portfolioImages || []}
                    initialIndex={lightboxPhoto.index}
                    onClose={() => setLightboxPhoto(null)}
                />
            )}


            {/* ── SHARE MODAL ── */}
            <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={publicUrl} title={data.name} T={T} />

            {/* ── COVER ── */}
            <div style={{ position: "fixed", top: -45, left: 0, right: 0, height: 440, zIndex: 0, overflow: "hidden", transform: `translateY(${parallaxOffset}px)`, opacity: coverOpacity }}>
                {data.portfolioCoverUrl
                    ? <img src={data.portfolioCoverUrl} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.85)" }} />
                    : <div style={{ width: "100%", height: "100%", background: T.coverGrad, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={52} color="rgba(255,255,255,0.9)" /></div>
                }
                <div style={{ position: "absolute", inset: 0, background: T.coverOverlay }} />
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "230px 20px 60px" }}>

                {/* ── PROFILE HEADER ── */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>

                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0, marginTop: -70 }}>
                        <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
                            {data.portfolioAvatarUrl
                                ? <img src={data.portfolioAvatarUrl} alt={data.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${T.avatarBorder}`, display: "block" }} />
                                : <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: T.avatarGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 800, color: "white", border: `4px solid ${T.avatarBorder}` }}>{data.name?.[0]?.toUpperCase()}</div>
                            }
                        </div>
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h1 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-.02em", lineHeight: 1.2 }}>{data.name}</h1>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            {tags[0] && <span style={{ fontSize: 13, fontWeight: 600, color: T.accent, background: T.tag.bg, border: `1px solid ${T.tag.border}`, padding: "4px 12px", borderRadius: 20 }}>{tags[0]}</span>}
                            {data.portfolioCity && <span style={{ fontSize: 13, color: T.textSub, display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} />{data.portfolioCity}</span>}
                            <span style={{ fontSize: 12, color: T.textMuted }}>Miembro desde {new Date(data.createdAt).getFullYear()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => setShowShare(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, border: `1px solid ${T.btnSec.border}`, background: T.btnSec.bg, color: T.btnSec.color, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            <Share2 size={15} /> Compartir
                        </button>
                        {data.portfolioWhatsapp && (
                            <a href={`https://wa.me/${data.portfolioWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, border: "none", background: T.btnWa.bg, color: T.btnWa.color, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                <Whatsapp size={15} /> WhatsApp
                            </a>
                        )}
                        {data.portfolioEmail && !data.portfolioWhatsapp && (
                            <button onClick={() => setActiveTab("contact")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, border: "none", background: T.btn.bg, color: T.btn.color, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                <MessageCircle size={15} /> Contactar
                            </button>
                        )}
                    </div>
                </div>

                {/* ── STATS BAR ── */}
                <div style={{ display: "flex", gap: 0, background: T.statsBar, border: `1px solid ${T.statsBorder}`, borderRadius: 16, marginBottom: 24, overflow: "hidden" }}>
                    {[
                        { icon: Camera, value: data.stats?.totalPhotos ?? 0, label: "Fotos" },
                        { icon: Images, value: data.stats?.totalGalleries ?? 0, label: "Galerías" },
                        { icon: Eye, value: data.stats?.totalViews ?? 0, label: "Vistas" },
                    ].map((s, i) => (
                        <div key={s.label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 12px", borderRight: i < 2 ? `1px solid ${T.statsBorder}` : "none" }}>
                            <s.icon size={16} color={T.accent} />
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1 }}>{s.value.toLocaleString("es-AR")}</p>
                                <p style={{ fontSize: 11, color: T.textMuted, margin: "2px 0 0" }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── TABS ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }} className="flex-col">

                    <div style={{ display: "flex", gap: 3, background: T.tabBar, borderRadius: 14, padding: 4, flex: 1, minWidth: 0 }}>
                        {tabs.map(tab => {
                            const active = activeTab === tab.key
                            const Icon = tab.icon
                            return (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    title={tab.label}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, transition: "all .15s", background: active ? T.tabActive.bg : "transparent", color: active ? T.tabActive.color : T.tabInactive.color, minWidth: 0, overflow: "hidden" }}>
                                    <Icon size={15} style={{ flexShrink: 0 }} />
                                    <span style={{ display: "var(--tab-label-display, inline)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</span>
                                    {tab.count !== null && <span style={{ display: "var(--tab-pill-display, inline)", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 20, background: active ? "rgba(255,255,255,.15)" : T.pill.bg, color: active ? T.tabActive.color : T.textMuted, flexShrink: 0 }}>{tab.count}</span>}
                                </button>
                            )
                        })}
                    </div>
                    <style>{`
                        @media (max-width: 480px) {
                            :root { --tab-label-display: none; --tab-pill-display: none; }
                        }
                    `}</style>
                    {activeTab === "galleries" && (
                        <div
                            className="hidden md:flex gap-1 rounded-xl p-1"
                            style={{ background: T.tabBar }}
                        >
                            {[{ mode: "grid", Icon: Grid3X3 }, { mode: "list", Icon: List }].map(
                                ({ mode, Icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
                                        style={{
                                            border: "none",
                                            cursor: "pointer",
                                            background:
                                                viewMode === mode ? T.tabActive.bg : "transparent",
                                            color:
                                                viewMode === mode
                                                    ? T.tabActive.color
                                                    : T.tabInactive.color,
                                        }}
                                    >
                                        <Icon size={16} />
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* ── TAB: GALERÍAS ── */}
                {activeTab === "galleries" && (
                    <>
                        {featured.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                    <p style={{ fontSize: 13, fontWeight: 700, color: T.textSub, margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>Destacadas</p>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill,minmax(280px,1fr))" : "1fr", gap: 16 }}>
                                    {featured.map(g => <GalleryCard key={g.id} gallery={g} T={T} onPreview={setPreviewGallery} />)}
                                </div>
                                {rest.length > 0 && <div style={{ height: 1, background: T.cardBorder, margin: "28px 0 20px" }} />}
                            </div>
                        )}

                        {rest.length === 0 && featured.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                                <Images size={48} color={T.textMuted} strokeWidth={1.3} style={{ marginBottom: 16 }} />
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textSub, margin: "0 0 6px" }}>Sin galerías publicadas</h3>
                                <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Este fotógrafo aún no ha compartido galerías públicas</p>
                            </div>
                        ) : (
                            rest.length > 0 && (
                                <>
                                    {featured.length > 0 && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                            <Images size={14} color={T.textSub} />
                                            <p style={{ fontSize: 13, fontWeight: 700, color: T.textSub, margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>Todas las galerías</p>
                                        </div>
                                    )}
                                    <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill,minmax(280px,1fr))" : "1fr", gap: 16 }}>
                                        {rest.map(g => <GalleryCard key={g.id} gallery={g} T={T} onPreview={setPreviewGallery} />)}
                                    </div>
                                </>
                            )
                        )}
                    </>
                )}


                {/* ── TAB: FOTOS ── */}
                {activeTab === "photos" && (
                    <>
                        {(data.portfolioImages || []).length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                                <Camera size={48} color={T.textMuted} strokeWidth={1.3} style={{ marginBottom: 16 }} />
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textSub, margin: "0 0 6px" }}>Sin fotos en el portfolio</h3>
                                <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Este fotógrafo aún no ha subido fotos a su portfolio</p>
                            </div>
                        ) : (
                            <>
                                {/* Grid estilo Instagram: 3 columnas, cuadradas */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: 3,
                                }}>
                                    {(data.portfolioImages || []).map((img, i) => (
                                        <div
                                            key={img.id}
                                            onClick={() => setLightboxPhoto({ index: i })}
                                            style={{
                                                position: "relative",
                                                aspectRatio: "1/1",
                                                overflow: "hidden",
                                                cursor: "pointer",
                                                background: T.card,
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.querySelector("img").style.transform = "scale(1.06)"
                                                e.currentTarget.querySelector(".overlay").style.opacity = "1"
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.querySelector("img").style.transform = "scale(1)"
                                                e.currentTarget.querySelector(".overlay").style.opacity = "0"
                                            }}
                                        >
                                            <img
                                                src={img.bunnyUrl}
                                                alt={img.caption || ""}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s ease" }}
                                                draggable={false}
                                                onContextMenu={e => e.preventDefault()}
                                            />
                                            {/* Overlay hover */}
                                            <div className="overlay" style={{
                                                position: "absolute", inset: 0,
                                                background: "rgba(0,0,0,0.38)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                opacity: 0, transition: "opacity .2s",
                                                gap: 8,
                                            }}>
                                                <Eye size={22} color="white" strokeWidth={2} />
                                                {img.isFeatured && <Star size={16} color="#f59e0b" fill="#f59e0b" />}
                                            </div>
                                            {/* Badge destacada */}
                                            {img.isFeatured && (
                                                <div style={{ position: "absolute", top: 7, left: 7, width: 22, height: 22, borderRadius: "50%", background: "rgba(245,158,11,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Star size={11} color="white" fill="white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Contador */}
                                <p style={{ fontSize: 12, color: T.textMuted, textAlign: "center", marginTop: 16 }}>
                                    {(data.portfolioImages || []).length} foto{(data.portfolioImages || []).length !== 1 ? "s" : ""}
                                </p>
                            </>
                        )}
                    </>
                )}

                {/* ── TAB: SOBRE MÍ ── */}
                {activeTab === "about" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {data.portfolioBio && (
                            <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 18, padding: "22px 24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                    <User size={18} color={T.accent} /> <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Sobre mí</h2>
                                </div>
                                <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{data.portfolioBio}</p>
                            </div>
                        )}
                        {tags.length > 0 && (
                            <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 18, padding: "22px 24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                    <Sparkles size={18} color={T.accent} /> <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Especialidades</h2>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {tags.map(t => <span key={t} style={{ fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, background: T.tag.bg, color: T.accent, border: `1px solid ${T.tag.border}` }}>#{t}</span>)}
                                </div>
                            </div>
                        )}
                        {socials.length > 0 && (
                            <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 18, padding: "22px 24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                    <Globe size={18} color={T.accent} /> <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Redes y contacto</h2>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
                                    {socials.map(s => <SocialBtn key={s.key} type={s.key} href={s.href} T={T} />)}
                                </div>
                            </div>
                        )}
                        {!data.portfolioBio && tags.length === 0 && socials.length === 0 && (
                            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                                <User size={48} color={T.textMuted} strokeWidth={1.3} style={{ marginBottom: 16 }} />
                                <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>Este fotógrafo aún no completó su perfil</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: CONTACTO ── */}
                {activeTab === "contact" && (
                    <div style={{ maxWidth: 580, margin: "0 auto" }}>
                        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 18, padding: "24px 26px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                                <MessageCircle size={18} color={T.accent} />
                                <div>
                                    <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>Contactar a {data.name}</h2>
                                    <p style={{ fontSize: 12, color: T.textSub, margin: 0 }}>Te va a responder a la brevedad</p>
                                </div>
                            </div>

                            {/* Quick contact buttons */}
                            {(data.portfolioWhatsapp || data.portfolioEmail) && (
                                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                                    {data.portfolioWhatsapp && (
                                        <a href={`https://wa.me/${data.portfolioWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                            <Whatsapp size={16} /> WhatsApp
                                        </a>
                                    )}
                                    {data.portfolioWhatsapp && (
                                        <a href={`tel:${data.portfolioWhatsapp.replace(/\s/g, "")}`}
                                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: T.btnSec.bg, border: `1px solid ${T.btnSec.border}`, color: T.btnSec.color, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                            <Phone size={16} /> Llamar
                                        </a>
                                    )}
                                    {data.portfolioEmail && (
                                        <a href={`mailto:${data.portfolioEmail}`}
                                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: T.btnSec.bg, border: `1px solid ${T.btnSec.border}`, color: T.btnSec.color, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                            <Mail size={16} /> Enviar email
                                        </a>
                                    )}
                                </div>
                            )}

                            <div style={{ height: 1, background: T.cardBorder, margin: "0 0 20px" }} />
                            <p style={{ fontSize: 13, fontWeight: 700, color: T.textSub, margin: "0 0 16px" }}>O enviá un mensaje directo:</p>
                            <ContactForm data={data} T={T} />

                            {!data.portfolioEmail && !data.portfolioWhatsapp && (
                                <p style={{ fontSize: 13, color: T.textSub, textAlign: "center", padding: "20px 0" }}>Este fotógrafo no tiene datos de contacto disponibles aún.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center py-8 pb-10 border-t mt-10 border-gray-200">

<div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-400"></div>
                {/* Powered */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span>Powered by</span>
                    <img
                        src="/logoTiny.png"
                        alt="CafeNegro"
                        className="h-9 object-contain opacity-90"
                    />
                    <span className="text-gray-600 font-bold">
                        photobook.com.ar
                    </span>
                </div>
                

                {/* Created by + logo */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span>Created by</span>

                    <img
                        src="/logoCafeNegro.png"
                        alt="CafeNegro"
                        className="h-9 object-contain opacity-90"
                    />

                    <span className="text-gray-600 font-bold">
                        cafenegro.com.ar
                    </span>
                </div>
            </div>





        </div>
    )
}