"use client"

import { useState } from "react"

import {
    FaInstagram,
    FaFacebook,
    FaYoutube,
    FaLinkedin,
    FaTiktok,
    FaWhatsapp,
    FaTwitter,
    FaSpotify,
    FaPinterest,
    FaTwitch,
    FaSnapchat,
    FaVimeo,
    FaBehance,
    FaDribbble,
    FaPatreon,
    FaPaypal,
    FaTelegram,
    FaDiscord,
} from "react-icons/fa"

import {
    FiGlobe,
    FiMail,
    FiLink,
    FiCamera,
    FiImage,
    FiExternalLink,
    FiPhone,
    FiShoppingBag,
    FiVideo,
    FiMusic,
    FiStar,
    FiMapPin,
    FiShare2,
    FiCheck,
} from "react-icons/fi"

const THEMES = {
    dark: {
        page:       "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
        card:       "rgba(255,255,255,0.06)",
        cardBorder: "rgba(255,255,255,0.1)",
        cardHover:  "rgba(255,255,255,0.11)",
        text:       "#f1f5f9",
        textSub:    "#94a3b8",
        avatarBorder: "rgba(255,255,255,0.15)",
        avatarGrad: "linear-gradient(135deg,#1e1b4b,#312e81)",
    },

    light: {
        page:       "linear-gradient(160deg, #f0f4ff 0%, #e8eaf6 100%)",
        card:       "#ffffff",
        cardBorder: "#e2e8f0",
        cardHover:  "#f8fafc",
        text:       "#0f172a",
        textSub:    "#64748b",
        avatarBorder: "#e2e8f0",
        avatarGrad: "linear-gradient(135deg,#dbeafe,#e0e7ff)",
    },

    gradient: {
        page:       "linear-gradient(160deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
        card:       "rgba(255,255,255,0.15)",
        cardBorder: "rgba(255,255,255,0.25)",
        cardHover:  "rgba(255,255,255,0.22)",
        text:       "#ffffff",
        textSub:    "rgba(255,255,255,0.75)",
        avatarBorder: "rgba(255,255,255,0.4)",
        avatarGrad: "linear-gradient(135deg,rgba(255,255,255,0.2),rgba(255,255,255,0.1))",
    },

    warm: {
        page:       "linear-gradient(160deg, #1c1008 0%, #2d1a08 100%)",
        card:       "rgba(255,255,255,0.07)",
        cardBorder: "rgba(255,255,255,0.1)",
        cardHover:  "rgba(255,255,255,0.12)",
        text:       "#fef3c7",
        textSub:    "#a16207",
        avatarBorder: "rgba(245,158,11,0.3)",
        avatarGrad: "linear-gradient(135deg,#292010,#3d2a10)",
    },
}

// Parsea "custom:#bg:#card:#accent" y genera un objeto de tema
function buildCustomTheme(val) {
    const parts = val.split(":")
    const bg     = parts[1] || "#0f0a1e"
    const card   = parts[2] || "#1a1035"
    const accent = parts[3] || "#a855f7"

    const r = parseInt(bg.slice(1, 3), 16)
    const g = parseInt(bg.slice(3, 5), 16)
    const b = parseInt(bg.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const isDark = luminance < 0.5

    return {
        page:         bg,
        card:         card,
        cardBorder:   isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
        cardHover:    isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
        text:         isDark ? "#f1f5f9" : "#0f172a",
        textSub:      isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
        avatarBorder: accent + "55",
        avatarGrad:   `linear-gradient(135deg,${card},${bg})`,
        accent,
    }
}

function resolveTheme(theme) {
    if (!theme) return THEMES.dark
    if (theme.startsWith("custom:")) return buildCustomTheme(theme)
    return THEMES[theme] || THEMES.dark
}

const ICON_MAP = {
    instagram: <FaInstagram size={18} />,
    facebook:  <FaFacebook  size={18} />,
    youtube:   <FaYoutube   size={18} />,
    linkedin:  <FaLinkedin  size={18} />,
    tiktok:    <FaTiktok    size={18} />,
    whatsapp:  <FaWhatsapp  size={18} />,
    twitter:   <FaTwitter   size={18} />,
    spotify:   <FaSpotify   size={18} />,
    pinterest: <FaPinterest size={18} />,
    twitch:    <FaTwitch    size={18} />,
    snapchat:  <FaSnapchat  size={18} />,
    vimeo:     <FaVimeo     size={18} />,
    behance:   <FaBehance   size={18} />,
    dribbble:  <FaDribbble  size={18} />,
    patreon:   <FaPatreon   size={18} />,
    paypal:    <FaPaypal    size={18} />,
    telegram:  <FaTelegram  size={18} />,
    discord:   <FaDiscord   size={18} />,

    web:       <FiGlobe       size={18} />,
    email:     <FiMail        size={18} />,
    phone:     <FiPhone       size={18} />,
    shop:      <FiShoppingBag size={18} />,
    video:     <FiVideo       size={18} />,
    music:     <FiMusic       size={18} />,
    star:      <FiStar        size={18} />,
    location:  <FiMapPin      size={18} />,

    camera:    <FiCamera size={18} />,
    gallery:   <FiImage  size={18} />,
    portfolio: <FiCamera size={18} />,

    link:      <FiLink size={18} />,
    none:      null,
}

// Altura fija para todos los botones — con o sin imagen siempre iguales
const BUTTON_HEIGHT = 60

function LinkButton({ link, theme }) {
    const t = resolveTheme(theme)
    const [hovered, setHovered] = useState(false)

    const handleClick = async () => {
        try {
            await fetch(`/api/linktree/${link.id}/click`, { method: "POST" })
        } catch {}

        const raw = link.url.trim()

        // Protocolos que se usan con location.href, no con window.open URL
        const nativeProtocols = ["tel:", "mailto:", "whatsapp:", "sms:", "tg:"]
        if (nativeProtocols.some(p => raw.startsWith(p))) {
            window.location.href = raw
            return
        }

        // URLs con protocolo explícito (http/https/ftp…)
        const url = /^[a-z][a-z0-9+\-.]*:\/\//i.test(raw) ? raw : `https://${raw}`

        window.open(url, "_blank", "noopener,noreferrer")
    }

    // Ícono: null si es "none"
    const iconEl = link.icon === "none" ? null : (ICON_MAP[link.icon] ?? ICON_MAP.link)

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "100%",
                height: BUTTON_HEIGHT,
                display: "flex",
                alignItems: "center",
                padding: 0,
                background: hovered ? t.cardHover : t.card,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 14,
                cursor: "pointer",
                transition: "all 0.18s ease",
                transform: hovered ? "translateY(-2px)" : "none",
                boxShadow: hovered
                    ? "0 8px 24px rgba(0,0,0,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.07)",
                fontFamily: "inherit",
                textAlign: "left",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            {/* Imagen a la izquierda — ocupa exactamente la altura del botón */}
            {link.imageUrl && (
                <img
                    src={link.imageUrl}
                    alt=""
                    style={{
                        width: BUTTON_HEIGHT,
                        height: BUTTON_HEIGHT,
                        objectFit: "cover",
                        flexShrink: 0,
                        display: "block",
                    }}
                />
            )}

            {/* Contenido */}
            <span
                style={{
                    flex: 1,
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                }}
            >
                {iconEl && (
                    <span style={{ color: t.textSub, flexShrink: 0, display: "flex", alignItems: "center" }}>
                        {iconEl}
                    </span>
                )}

                <span style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: 600,
                    color: t.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}>
                    {link.label}
                </span>

                <FiExternalLink size={13} color={t.textSub} style={{ flexShrink: 0, opacity: 0.6 }} />
            </span>
        </button>
    )
}

export default function LinktreePublicPage({ data }) {
    const {
        title,
        bio,
        theme,
        avatarUrl,
        backgroundUrl,
        links = [],
    } = data

    const t = resolveTheme(theme)
    const displayAvatar = avatarUrl || null
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const url = typeof window !== "undefined" ? window.location.href : ""
        if (navigator.share) {
            try {
                await navigator.share({ title: title || "Links", url })
            } catch {}
        } else {
            try {
                await navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch {}
        }
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "48px 16px 80px",
                fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
        >
            {/* Botón compartir — esquina superior derecha */}
            <button
                onClick={handleShare}
                title="Compartir"
                style={{
                    position: "fixed",
                    top: 16,
                    right: 16,
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: `1px solid ${t.cardBorder}`,
                    background: t.card,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                    transition: "transform 0.15s ease, opacity 0.15s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
                {copied
                    ? <FiCheck size={16} color={t.text} />
                    : <FiShare2 size={16} color={t.text} />
                }
            </button>
            {/* Capa de fondo: imagen o color del tema */}
            {backgroundUrl ? (
                <>
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0,
                        width: "100%", height: "100%",
                        backgroundImage: `url(${backgroundUrl})`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        zIndex: 0,
                        transform: "translateZ(0)",
                        willChange: "transform",
                    }} />
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0,
                        width: "100%", height: "100%",
                        background: t.page, opacity: 0.6, zIndex: 1,
                        transform: "translateZ(0)",
                    }} />
                </>
            ) : (
                <div style={{ position: "fixed", inset: 0, background: t.page, zIndex: 0 }} />
            )}

            <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 2 }}>

                {/* Avatar */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    {displayAvatar ? (
                        <img
                            src={displayAvatar}
                            alt={title}
                            style={{
                                width: 180, height: 180, borderRadius: "50%",
                                objectFit: "cover", border: `3px solid ${t.avatarBorder}`,
                                display: "inline-block",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 180, height: 180, borderRadius: "50%",
                            background: t.avatarGrad, border: `3px solid ${t.avatarBorder}`,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <FiCamera size={32} color="rgba(255,255,255,0.6)" />
                        </div>
                    )}
                </div>

                {/* Nombre y bio */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h1 style={{
                        fontSize: 22, fontWeight: 800,
                        color: t.text,
                        margin: "0 0 8px", letterSpacing: "-0.02em",
                        // Sombra de texto para legibilidad sobre imágenes de fondo
                        textShadow: backgroundUrl
                            ? "0 1px 8px rgba(0,0,0,0.55), 0 0px 2px rgba(0,0,0,0.4)"
                            : "none",
                    }}>
                        {title}
                    </h1>

                    {bio && (
                        <p style={{
                            fontSize: 14,
                            color: t.textSub,
                            margin: 0,
                            lineHeight: 1.6,
                            maxWidth: 360,
                            marginInline: "auto",
                            textShadow: backgroundUrl
                                ? "0 1px 6px rgba(0,0,0,0.7), 0 0px 2px rgba(0,0,0,0.5)"
                                : "none",
                        }}>
                            {bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {links.length === 0 ? (
                        <p style={{ textAlign: "center", color: t.textSub, fontSize: 14 }}>
                            No hay links disponibles aún.
                        </p>
                    ) : (
                        links.map(link => (
                            <LinkButton key={link.id} link={link} theme={theme} />
                        ))
                    )}
                </div>

                {/* Branding */}
                <p style={{
                    textAlign: "center",
                    marginTop: 40,
                    fontSize: 12,
                    color: t.textSub,
                    opacity: 0.5,
                }}>
                    Creado con PhotoBook
                </p>
            </div>
        </div>
    )
}