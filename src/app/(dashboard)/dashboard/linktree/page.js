"use client"

import { useState, useEffect, useRef } from "react"
import {
    Loader2, Link2, Check, Save, Plus, ExternalLink, Copy,
    GripVertical, Eye, EyeOff, Edit3, Trash2, Palette,
    Upload, X, ImageIcon, CheckCheck, AlertTriangle, Sparkles,
    ToggleLeft, ToggleRight, Share2, Globe, User, Image, ChevronDown, ChevronUp,
} from "lucide-react"
import ShareModal from "@/components/SharedModal"
import {
    FaInstagram, FaFacebook, FaYoutube, FaLinkedin, FaTiktok,
    FaWhatsapp, FaTwitter, FaSpotify, FaPinterest, FaTwitch,
    FaSnapchat, FaVimeo, FaBehance, FaDribbble, FaPatreon,
    FaPaypal, FaTelegram, FaDiscord,
} from "react-icons/fa"
import {
    FiLink, FiGlobe, FiMail, FiCamera, FiImage, FiPhone,
    FiShoppingBag, FiVideo, FiMusic, FiStar, FiMapPin,
} from "react-icons/fi"

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    navy:    "#0f172a",
    slate:   "#475569",
    muted:   "#94a3b8",
    border:  "#e2e8f0",
    surface: "#f8fafc",
    white:   "#ffffff",
    green:   "#16a34a",
}
const F = "'DM Sans', system-ui, sans-serif"
const R = { sm: 8, md: 10, lg: 14 }

// ─── Shared styles ─────────────────────────────────────────────────────────────
const S = {
    card: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
    cardHead: { padding: "14px 18px", borderBottom: `1px solid ${C.surface}`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" },
    cardHeadLeft: { display: "flex", alignItems: "center", gap: 10 },
    icon: (bg) => ({ width: 32, height: 32, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),
    cardTitle: { fontSize: 13, fontWeight: 700, color: C.navy, margin: 0 },
    cardSub: { fontSize: 11, color: C.muted, margin: "1px 0 0" },
    body: { padding: "18px 20px" },
    label: { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", display: "block", marginBottom: 5 },
    input: { width: "100%", padding: "9px 12px", fontSize: 13, fontWeight: 500, color: C.navy, background: C.white, border: `1px solid ${C.border}`, borderRadius: R.md, outline: "none", fontFamily: F, boxSizing: "border-box" },
    textarea: { width: "100%", padding: "9px 12px", fontSize: 13, fontWeight: 500, color: C.navy, background: C.white, border: `1px solid ${C.border}`, borderRadius: R.md, outline: "none", fontFamily: F, boxSizing: "border-box", resize: "vertical", minHeight: 72 },
    hint: { fontSize: 11, color: C.muted, marginTop: 4 },
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
    { value: "none",      label: "Sin ícono",    Icon: null,          group: "general" },
    { value: "link",      label: "Link",          Icon: FiLink,        group: "general" },
    { value: "instagram", label: "Instagram",     Icon: FaInstagram,   group: "social" },
    { value: "facebook",  label: "Facebook",      Icon: FaFacebook,    group: "social" },
    { value: "youtube",   label: "YouTube",       Icon: FaYoutube,     group: "social" },
    { value: "tiktok",    label: "TikTok",        Icon: FaTiktok,      group: "social" },
    { value: "twitter",   label: "X / Twitter",   Icon: FaTwitter,     group: "social" },
    { value: "linkedin",  label: "LinkedIn",      Icon: FaLinkedin,    group: "social" },
    { value: "whatsapp",  label: "WhatsApp",      Icon: FaWhatsapp,    group: "social" },
    { value: "telegram",  label: "Telegram",      Icon: FaTelegram,    group: "social" },
    { value: "discord",   label: "Discord",       Icon: FaDiscord,     group: "social" },
    { value: "twitch",    label: "Twitch",        Icon: FaTwitch,      group: "social" },
    { value: "snapchat",  label: "Snapchat",      Icon: FaSnapchat,    group: "social" },
    { value: "pinterest", label: "Pinterest",     Icon: FaPinterest,   group: "social" },
    { value: "spotify",   label: "Spotify",       Icon: FaSpotify,     group: "content" },
    { value: "vimeo",     label: "Vimeo",         Icon: FaVimeo,       group: "content" },
    { value: "behance",   label: "Behance",       Icon: FaBehance,     group: "content" },
    { value: "dribbble",  label: "Dribbble",      Icon: FaDribbble,    group: "content" },
    { value: "patreon",   label: "Patreon",       Icon: FaPatreon,     group: "content" },
    { value: "paypal",    label: "PayPal",        Icon: FaPaypal,      group: "content" },
    { value: "web",       label: "Sitio web",     Icon: FiGlobe,       group: "util" },
    { value: "email",     label: "Email",         Icon: FiMail,        group: "util" },
    { value: "phone",     label: "Teléfono",      Icon: FiPhone,       group: "util" },
    { value: "shop",      label: "Tienda",        Icon: FiShoppingBag, group: "util" },
    { value: "video",     label: "Video",         Icon: FiVideo,       group: "util" },
    { value: "music",     label: "Música",        Icon: FiMusic,       group: "util" },
    { value: "star",      label: "Destacado",     Icon: FiStar,        group: "util" },
    { value: "location",  label: "Ubicación",     Icon: FiMapPin,      group: "util" },
    { value: "camera",    label: "Fotografía",    Icon: FiCamera,      group: "photo" },
    { value: "gallery",   label: "Galería",       Icon: FiImage,       group: "photo" },
]

const ICON_GROUP_LABELS = { general: "General", social: "Redes sociales", content: "Contenido", util: "Utilidades", photo: "Fotografía" }

function IconComponent({ name, size = 16 }) {
    if (name === "none") return null
    const found = ICON_OPTIONS.find(o => o.value === name)
    if (!found || !found.Icon) return <FiLink size={size} />
    return <found.Icon size={size} />
}

function IconPicker({ value, onChange }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.keys(ICON_GROUP_LABELS).map(group => {
                const icons = ICON_OPTIONS.filter(o => o.group === group)
                return (
                    <div key={group}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 5px" }}>
                            {ICON_GROUP_LABELS[group]}
                        </p>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {icons.map(o => (
                                <button key={o.value} onClick={() => onChange(o.value)} title={o.label} style={{
                                    width: 34, height: 34, borderRadius: 8,
                                    border: `1px solid ${value === o.value ? "#3b82f6" : C.border}`,
                                    background: value === o.value ? "#eff6ff" : C.white,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: value === o.value ? "#3b82f6" : C.muted,
                                }}>
                                    {o.Icon ? <o.Icon size={14} /> : <span style={{ fontSize: 13 }}>—</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Collapsible Section ───────────────────────────────────────────────────────
function Section({ icon, iconBg, title, sub, defaultOpen = true, badge, children }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div style={S.card}>
            <div style={S.cardHead} onClick={() => setOpen(v => !v)}>
                <div style={S.cardHeadLeft}>
                    <div style={S.icon(iconBg)}>{icon}</div>
                    <div>
                        <p style={S.cardTitle}>{title}</p>
                        {sub && <p style={S.cardSub}>{sub}</p>}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {badge}
                    {open ? <ChevronUp size={15} color={C.muted} /> : <ChevronDown size={15} color={C.muted} />}
                </div>
            </div>
            {open && <div style={S.body}>{children}</div>}
        </div>
    )
}

// ─── Theme Picker ──────────────────────────────────────────────────────────────
const PRESET_THEMES = [
    { key: "dark",     label: "Oscuro",    preview: ["#0f172a", "#1e293b", "#3b82f6"] },
    { key: "light",    label: "Claro",     preview: ["#f8fafc", "#e2e8f0", "#0f172a"] },
    { key: "gradient", label: "Degradado", preview: ["#4f46e5", "#7c3aed", "#db2777"] },
    { key: "warm",     label: "Cálido",    preview: ["#1c1008", "#292010", "#f59e0b"] },
]
const CUSTOM_DEFAULTS = { bg: "#0f0a1e", card: "#1a1035", accent: "#a855f7" }

function parseCustomTheme(val) {
    if (!val?.startsWith("custom:")) return null
    const parts = val.split(":")
    return { bg: parts[1] || "#0f172a", card: parts[2] || "#1e293b", accent: parts[3] || "#3b82f6" }
}

function ThemePicker({ value, onChange }) {
    const isCustom = value?.startsWith("custom")
    const custom = parseCustomTheme(value) || CUSTOM_DEFAULTS
    const [localBg, setLocalBg] = useState(custom.bg)
    const [localCard, setLocalCard] = useState(custom.card)
    const [localAccent, setLocalAccent] = useState(custom.accent)

    useEffect(() => {
        if (value?.startsWith("custom:")) {
            const p = parseCustomTheme(value)
            if (p) { setLocalBg(p.bg); setLocalCard(p.card); setLocalAccent(p.accent) }
        }
    }, [value])

    const applyCustom = (bg, card, accent) => onChange(`custom:${bg}:${card}:${accent}`)

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PRESET_THEMES.map(t => (
                    <button key={t.key} onClick={() => onChange(t.key)} style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                        padding: "10px 14px", borderRadius: 12,
                        border: `2px solid ${value === t.key ? "#3b82f6" : C.border}`,
                        background: value === t.key ? "#eff6ff" : C.white,
                        cursor: "pointer", fontFamily: F,
                    }}>
                        <div style={{ display: "flex", gap: 3 }}>
                            {t.preview.map((c, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 5, background: c, border: "1px solid rgba(0,0,0,.08)" }} />)}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: value === t.key ? "#2563eb" : C.slate }}>{t.label}</span>
                        {value === t.key && <Check size={11} color="#2563eb" />}
                    </button>
                ))}
                <button onClick={() => applyCustom(localBg, localCard, localAccent)} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                    padding: "10px 14px", borderRadius: 12,
                    border: `2px solid ${isCustom ? "#3b82f6" : C.border}`,
                    background: isCustom ? "#eff6ff" : C.white,
                    cursor: "pointer", fontFamily: F,
                }}>
                    <div style={{ display: "flex", gap: 3 }}>
                        {[localBg, localCard, localAccent].map((c, i) => (
                            <div key={i} style={{ width: 16, height: 16, borderRadius: 5, background: isCustom ? c : ["#6b7280", "#9ca3af", "#d1d5db"][i], border: "1px solid rgba(0,0,0,.08)" }} />
                        ))}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isCustom ? "#2563eb" : C.slate }}>Personalizado</span>
                    {isCustom && <Check size={11} color="#2563eb" />}
                </button>
            </div>

            {isCustom && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                        { label: "FONDO", val: localBg, setVal: setLocalBg, key: "bg" },
                        { label: "TARJETAS", val: localCard, setVal: setLocalCard, key: "card" },
                        { label: "ACENTO", val: localAccent, setVal: setLocalAccent, key: "accent" },
                    ].map(({ label, val, setVal, key }) => (
                        <div key={key}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>{label}</label>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <div style={{ position: "relative", width: 32, height: 32, borderRadius: R.md, overflow: "hidden", border: `2px solid ${C.border}`, flexShrink: 0 }}>
                                    <input type="color" value={val}
                                        onChange={e => {
                                            setVal(e.target.value)
                                            const nb = key === "bg" ? e.target.value : localBg
                                            const nc = key === "card" ? e.target.value : localCard
                                            const na = key === "accent" ? e.target.value : localAccent
                                            applyCustom(nb, nc, na)
                                        }}
                                        style={{ position: "absolute", inset: "-4px", width: "calc(100% + 8px)", height: "calc(100% + 8px)", border: "none", cursor: "pointer", padding: 0 }}
                                    />
                                </div>
                                <input value={val}
                                    onChange={e => {
                                        const v = e.target.value; setVal(v)
                                        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                                            const nb = key === "bg" ? v : localBg
                                            const nc = key === "card" ? v : localCard
                                            const na = key === "accent" ? v : localAccent
                                            applyCustom(nb, nc, na)
                                        }
                                    }}
                                    maxLength={7}
                                    style={{ flex: 1, padding: "6px 8px", fontSize: 11, fontWeight: 600, fontFamily: "monospace", background: C.white, border: `1px solid ${C.border}`, borderRadius: R.sm, outline: "none", color: C.navy }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Transparency detection ────────────────────────────────────────────────────
function hasTransparency(file) {
    return new Promise((resolve) => {
        if (file.type === "image/jpeg") { resolve(false); return }
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement("canvas")
            const size = Math.min(img.width, img.height, 64)
            canvas.width = size; canvas.height = size
            const ctx = canvas.getContext("2d")
            ctx.drawImage(img, 0, 0, size, size)
            const data = ctx.getImageData(0, 0, size, size).data
            let found = false
            for (let i = 3; i < data.length; i += 4) { if (data[i] < 250) { found = true; break } }
            URL.revokeObjectURL(url); resolve(found)
        }
        img.onerror = () => { URL.revokeObjectURL(url); resolve(false) }
        img.src = url
    })
}

// ─── ImageUploader ─────────────────────────────────────────────────────────────
function ImageUploader({ type, currentUrl, shape, onUploaded, onRemove }) {
    const inputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [pendingFile, setPendingFile] = useState(null)
    const [isTransparent, setIsTransparent] = useState(false)
    const [bgColor, setBgColor] = useState("#ffffff")

    const doUpload = async (file, color) => {
        setError(null); setUploading(true)
        try {
            const fd = new FormData()
            fd.append("file", file); fd.append("type", type)
            if (color) fd.append("bgColor", color)
            const res = await fetch("/api/linktree/upload", { method: "POST", body: fd })
            const data = await res.json()
            if (!res.ok) { setError(data.error); return }
            onUploaded(data.url); setPendingFile(null); setIsTransparent(false)
        } catch { setError("Error al subir") }
        finally { setUploading(false); if (inputRef.current) inputRef.current.value = "" }
    }

    const handleFile = async (e) => {
        const file = e.target.files?.[0]; if (!file) return
        if (type === "avatar") {
            const transparent = await hasTransparency(file)
            if (transparent) { setPendingFile(file); setIsTransparent(true); setBgColor("#ffffff"); return }
        }
        await doUpload(file, null)
    }

    const isCircle = shape === "circle"

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    {currentUrl ? (
                        <>
                            <img src={currentUrl} alt="" style={{ width: isCircle ? 56 : 88, height: 56, objectFit: "cover", borderRadius: isCircle ? "50%" : 10, border: `2px solid ${C.border}`, display: "block" }} />
                            <button onClick={onRemove} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "2px solid white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                                <X size={10} color="white" />
                            </button>
                        </>
                    ) : (
                        <div style={{ width: isCircle ? 56 : 88, height: 56, borderRadius: isCircle ? "50%" : 10, background: "#f1f5f9", border: "2px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ImageIcon size={18} color="#94a3b8" />
                        </div>
                    )}
                </div>
                <div>
                    <button onClick={() => inputRef.current?.click()} disabled={uploading}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, fontWeight: 600, color: C.slate, cursor: uploading ? "not-allowed" : "pointer", fontFamily: F, opacity: uploading ? 0.65 : 1 }}>
                        {uploading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={12} />}
                        {uploading ? "Subiendo..." : "Subir imagen"}
                    </button>
                    <p style={S.hint}>JPG, PNG o WEBP · máx 10 MB</p>
                    {error && <p style={{ fontSize: 11, color: "#ef4444", margin: "3px 0 0" }}>{error}</p>}
                </div>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFile} />
            </div>

            {isTransparent && pendingFile && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>🎨 Imagen con fondo transparente</p>
                    <p style={{ fontSize: 11, color: "#b45309", margin: "0 0 10px" }}>Elegí un color de fondo antes de subir.</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {["#ffffff", "#000000", "#f8fafc", "#1e293b", "#fef3c7", "#ffe4e6", "#dbeafe", "#d1fae5"].map(c => (
                            <button key={c} onClick={() => setBgColor(c)} style={{ width: 26, height: 26, borderRadius: 6, background: c, border: `2px solid ${bgColor === c ? "#3b82f6" : "rgba(0,0,0,0.15)"}`, cursor: "pointer", padding: 0 }} />
                        ))}
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 26, height: 26, border: `2px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 1, background: C.white }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button onClick={() => { if (pendingFile) doUpload(pendingFile, null) }} disabled={uploading}
                            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, cursor: "pointer", fontFamily: F, color: C.slate }}>
                            Sin fondo
                        </button>
                        <button onClick={() => { if (pendingFile) doUpload(pendingFile, bgColor) }} disabled={uploading}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                            {uploading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={11} />}
                            Subir con este fondo
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── LinkRow ──────────────────────────────────────────────────────────────────
function LinkRow({ link, onUpdate, onDelete, onToggle, onDragStart, onDragEnter, onDrop, isDraggingOver }) {
    const [editing, setEditing] = useState(false)
    const [label, setLabel] = useState(link.label)
    const [url, setUrl] = useState(link.url)
    const [icon, setIcon] = useState(link.icon)
    const [imageUrl, setImageUrl] = useState(link.imageUrl || null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleSave = async () => {
        if (!label.trim() || !url.trim()) return
        setSaving(true)
        try {
            const res = await fetch(`/api/linktree/${link.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label, url, icon, imageUrl }),
            })
            if (res.ok) { onUpdate(await res.json()); setEditing(false) }
        } finally { setSaving(false) }
    }

    const handleDelete = async () => {
        if (!confirm(`¿Eliminar "${link.label}"?`)) return
        setDeleting(true)
        try { const res = await fetch(`/api/linktree/${link.id}`, { method: "DELETE" }); if (res.ok) onDelete(link.id) }
        finally { setDeleting(false) }
    }

    const base = {
        background: isDraggingOver ? "#f0f7ff" : C.white,
        border: `1px solid ${isDraggingOver ? "#93c5fd" : link.isActive ? C.border : "#f1f5f9"}`,
        borderRadius: 12, padding: "12px 14px",
        opacity: link.isActive ? 1 : 0.55, transition: "all 0.15s",
        boxShadow: isDraggingOver ? "0 0 0 2px #bfdbfe" : "none",
    }

    if (editing) return (
        <div style={{ ...base, border: "1px solid #bfdbfe", boxShadow: "0 0 0 3px rgba(59,130,246,0.08)", opacity: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Texto del botón"
                    style={{ ...S.input }} />
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                    style={{ ...S.input }} />
                <div>
                    <p style={S.label}>ÍCONO</p>
                    <IconPicker value={icon} onChange={setIcon} />
                </div>
                <div style={{ borderTop: `1px solid ${C.surface}`, paddingTop: 10 }}>
                    <p style={S.label}>IMAGEN DEL BOTÓN <span style={{ fontWeight: 400, textTransform: "none", color: C.muted }}>(opcional)</span></p>
                    <ImageUploader type="link" shape="rect" currentUrl={imageUrl}
                        onUploaded={url => setImageUrl(url)} onRemove={() => setImageUrl(null)} />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => { setEditing(false); setLabel(link.label); setUrl(link.url); setIcon(link.icon); setImageUrl(link.imageUrl || null) }}
                        style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, cursor: "pointer", fontFamily: F, color: C.slate }}>
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                        {saving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />} Guardar
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div style={{ ...base, userSelect: "none" }}
            onDragOver={e => { e.preventDefault(); onDragEnter() }}
            onDrop={e => { e.preventDefault(); onDrop() }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div draggable onDragStart={onDragStart}
                    style={{ cursor: "grab", display: "flex", alignItems: "center", flexShrink: 0, touchAction: "none" }}>
                    <GripVertical size={14} color={isDraggingOver ? "#3b82f6" : "#cbd5e1"} />
                </div>
                {link.imageUrl
                    ? <img src={link.imageUrl} alt="" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 7, border: `1px solid ${C.border}`, flexShrink: 0 }} />
                    : link.icon !== "none"
                        ? <span style={{ color: C.slate, flexShrink: 0 }}><IconComponent name={link.icon} /></span>
                        : <span style={{ width: 16, flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.url}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: C.muted, marginRight: 2 }}>{link.clicks} clicks</span>
                    <button onClick={() => onToggle(link.id, !link.isActive)} title={link.isActive ? "Ocultar" : "Mostrar"}
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        {link.isActive ? <Eye size={13} color={C.slate} /> : <EyeOff size={13} color={C.muted} />}
                    </button>
                    <button onClick={() => setEditing(true)} title="Editar"
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Edit3 size={13} color={C.slate} />
                    </button>
                    <button onClick={handleDelete} disabled={deleting} title="Eliminar"
                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fee2e2", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        {deleting ? <Loader2 size={13} color="#ef4444" style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={13} color="#ef4444" />}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Locked ────────────────────────────────────────────────────────────────────
function LinktreeLocked() {
    return (
        <div style={{ padding: "48px 16px", maxWidth: 560, margin: "0 auto", fontFamily: F }}>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
                <Sparkles size={32} color="#d97706" style={{ marginBottom: 12 }} />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#92400e", margin: "0 0 8px" }}>Linktree no incluido en tu plan</h2>
                <p style={{ fontSize: 13, color: "#b45309", margin: "0 0 24px" }}>Actualizá tu plan para crear tu página de links personalizada.</p>
                <a href="/dashboard/subscription" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#d97706", color: "white", textDecoration: "none", padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
                    <Sparkles size={14} /> Ver planes
                </a>
            </div>
        </div>
    )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function LinktreeDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [plan, setPlan] = useState(null)
    const [config, setConfig] = useState({})
    const [links, setLinks] = useState([])
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState(null)
    const [copied, setCopied] = useState(false)
    const [showShare, setShowShare] = useState(false)
    const [slugLockedBy, setSlugLockedBy] = useState(null)
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "photobook.com.ar"

    // Nuevo link
    const [showAddForm, setShowAddForm] = useState(false)
    const [newLabel, setNewLabel] = useState("")
    const [newUrl, setNewUrl] = useState("")
    const [newIcon, setNewIcon] = useState("link")
    const [newImageUrl, setNewImageUrl] = useState(null)
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState(null)

    // Drag
    const dragIdx = useRef(null)
    const [dragOver, setDragOver] = useState(null)

    useEffect(() => {
        fetch("/api/linktree")
            .then(r => r.json())
            .then(data => { setPlan(data.plan); setConfig(data.config || {}); setLinks(data.links || []); setSlugLockedBy(data.config?.slugLockedBy || null) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const publicUrl = config.slug ? `${config.slug}.${ROOT_DOMAIN}/linktree` : null

    const handleCopy = () => {
        if (!publicUrl) return
        try {
            if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(publicUrl).catch(() => fallbackCopy(publicUrl)) }
            else { fallbackCopy(publicUrl) }
        } catch { fallbackCopy(publicUrl) }
        setCopied(true); setTimeout(() => setCopied(false), 2000)
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea")
        ta.value = text; ta.style.cssText = "position:fixed;top:-9999px;opacity:0"
        document.body.appendChild(ta); ta.focus(); ta.select()
        try { document.execCommand("copy") } catch {}
        document.body.removeChild(ta)
    }

    const handleSave = async () => {
        setSaving(true); setSaveMsg(null)
        try {
            const res = await fetch("/api/linktree", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            })
            const data = await res.json()
            if (!res.ok) { setSaveMsg({ error: true, text: data.error }); return }
            setConfig(prev => ({ ...prev, ...data.config }))
            setSaveMsg({ error: false, text: "Cambios guardados correctamente" })
            setTimeout(() => setSaveMsg(null), 3000)
        } finally { setSaving(false) }
    }

    const handleAddLink = async () => {
        if (!newLabel.trim() || !newUrl.trim()) return
        setAdding(true); setAddError(null)
        try {
            const res = await fetch("/api/linktree", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: newLabel, url: newUrl, icon: newIcon, imageUrl: newImageUrl }),
            })
            const data = await res.json()
            if (!res.ok) { setAddError(data.error); return }
            setLinks(prev => [...prev, data])
            setNewLabel(""); setNewUrl(""); setNewIcon("link"); setNewImageUrl(null); setShowAddForm(false)
        } finally { setAdding(false) }
    }

    const handleReorder = async (fromIdx, toIdx) => {
        setDragOver(null); dragIdx.current = null
        if (fromIdx === null || fromIdx === undefined || fromIdx === toIdx) return
        const reordered = [...links]
        const [moved] = reordered.splice(fromIdx, 1)
        reordered.splice(toIdx, 0, moved)
        setLinks(reordered)
        const updates = reordered.map((l, i) => ({ id: l.id, sortOrder: i }))
        try {
            await Promise.all(updates.map(({ id, sortOrder }) =>
                fetch(`/api/linktree/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder }) })
            ))
        } catch (e) { console.error("Error al guardar orden:", e) }
    }

    const handleUpdate = (updated) => setLinks(prev => prev.map(l => l.id === updated.id ? updated : l))
    const handleDelete = (id) => setLinks(prev => prev.filter(l => l.id !== id))
    const handleToggle = async (id, isActive) => {
        const res = await fetch(`/api/linktree/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) })
        if (res.ok) handleUpdate(await res.json())
    }

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 size={22} color={C.muted} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!plan?.allowsLinktree) return <LinktreeLocked />

    const maxLinks = plan?.maxLinktreeLinks ?? 5
    const canAdd = maxLinks === -1 || links.length < maxLinks

    return (
        <div style={{ padding: "0 .5rem 40px", maxWidth: 760, margin: "0 auto", fontFamily: F }}>

            <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={publicUrl} title={config.title || ""} T={{
                card: C.white, cardBorder: C.border, text: C.navy, textSub: C.slate,
                btn: { bg: C.navy, color: C.white },
                btnSec: { bg: C.surface, border: C.border },
                input: { bg: C.white, border: C.border },
            }} />

            {/* ── HEADER ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", marginBottom: 14, marginLeft: "4rem" }} className="flex-col">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Link2 size={17} color="#3b82f6" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.navy, margin: 0, letterSpacing: "-0.025em" }}>Linktree</h1>
                        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                            {links.length === 0 ? "Sin links todavía" : `${links.length}${maxLinks !== -1 ? ` / ${maxLinks}` : ""} links`}
                        </p>
                    </div>
                </div>

                {/* Toggle prominente */}
                <button onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                    borderRadius: 10, border: `1px solid ${config.enabled ? "#a7f3d0" : C.border}`,
                    background: config.enabled ? "#ecfdf5" : C.surface,
                    color: config.enabled ? "#059669" : C.slate,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F,
                }}>
                    {config.enabled
                        ? <><ToggleRight size={18} color="#16a34a" /> Activo</>
                        : <><ToggleLeft size={18} color={C.muted} /> Inactivo</>
                    }
                </button>
            </div>

            {/* ── URL ── */}
            <Section icon={<Globe size={14} color="#16a34a" />} iconBg="linear-gradient(135deg,#f0fdf4,#dcfce7)"
                title="URL pública" sub="Dirección de tu página de links">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", flex: 1, alignItems: "center", border: `1px solid ${slugLockedBy ? "#fde68a" : C.border}`, borderRadius: R.md, overflow: "hidden", background: C.white, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", padding: "9px 11px", borderRight: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
                                <Globe size={13} color="#16a34a" />
                            </div>
                            <input
                                value={config.slug || ""}
                                onChange={e => !slugLockedBy && setConfig(c => ({ ...c, slug: e.target.value }))}
                                placeholder="tu-nombre"
                                readOnly={!!slugLockedBy}
                                title={slugLockedBy ? "El slug está controlado por tu portfolio" : undefined}
                                style={{ ...S.input, border: "none", borderRadius: 0, flex: 1, background: slugLockedBy ? C.surface : C.white, color: slugLockedBy ? C.muted : C.navy, cursor: slugLockedBy ? "not-allowed" : "text" }}
                            />
                            <span style={{ padding: "9px 11px", background: C.surface, borderLeft: `1px solid ${C.border}`, fontSize: 12, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                                .{ROOT_DOMAIN}/linktree
                            </span>
                        </div>
                    </div>
                    {slugLockedBy === "portfolio" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 12, color: "#92400e" }}>
                            <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0 }} />
                            <span>Este slug lo controla tu <a href="/dashboard/portfolio" style={{ color: "#d97706", fontWeight: 700 }}>portfolio</a>. Para cambiarlo, editalo desde allí y se actualizará aquí automáticamente.</span>
                        </div>
                    )}
                    {publicUrl && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.md, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600, fontFamily: F }}>
                                {copied ? <CheckCheck size={13} color="#059669" /> : <Copy size={13} />}
                                {copied ? "Copiado" : "Copiar"}
                            </button>
                            <a href={`https://${publicUrl}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.md, border: `1px solid ${C.border}`, background: C.white, textDecoration: "none", color: C.slate, fontSize: 12, fontWeight: 600, fontFamily: F }}>
                                <ExternalLink size={13} /> Ver página
                            </a>
                            <button onClick={() => setShowShare(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.md, border: "none", background: C.navy, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                                <Share2 size={13} /> Compartir
                            </button>
                        </div>
                    )}
                </div>
            </Section>

            {/* ── PERFIL ── */}
            <Section icon={<User size={14} color="#3b82f6" />} iconBg="linear-gradient(135deg,#eff6ff,#dbeafe)"
                title="Perfil" sub="Título, bio y foto de la página">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                        <label style={S.label}>TÍTULO</label>
                        <input value={config.title || ""} onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
                            placeholder="Tu nombre o marca" style={S.input} />
                    </div>
                    <div>
                        <label style={S.label}>BIO</label>
                        <textarea value={config.bio || ""} onChange={e => setConfig(c => ({ ...c, bio: e.target.value }))}
                            placeholder="Una breve descripción..." rows={2} style={S.textarea} />
                    </div>

                    {/* Foto de perfil */}
                    <div>
                        <label style={S.label}>FOTO DE PERFIL</label>
                        {config.portfolioAvatarUrl && (
                            <div style={{ marginBottom: 10 }}>
                                <button onClick={() => setConfig(c => ({ ...c, avatarUrl: null }))} style={{
                                    display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 10,
                                    border: `2px solid ${!config.avatarUrl ? "#3b82f6" : C.border}`,
                                    background: !config.avatarUrl ? "#eff6ff" : C.white, cursor: "pointer", fontFamily: F,
                                }}>
                                    <img src={config.portfolioAvatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: !config.avatarUrl ? "#2563eb" : C.slate }}>Usar foto del portfolio</span>
                                    {!config.avatarUrl && <Check size={13} color="#2563eb" />}
                                </button>
                            </div>
                        )}
                        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 10px", letterSpacing: ".04em" }}>
                                {config.avatarUrl ? "FOTO PERSONALIZADA (activa)" : "SUBIR FOTO PERSONALIZADA"}
                            </p>
                            <ImageUploader type="avatar" shape="circle" currentUrl={config.avatarUrl || null}
                                onUploaded={url => setConfig(c => ({ ...c, avatarUrl: url }))}
                                onRemove={() => setConfig(c => ({ ...c, avatarUrl: null }))} />
                        </div>
                        {!config.portfolioAvatarUrl && !config.avatarUrl && (
                            <p style={S.hint}>Sin foto. Completá tu <a href="/dashboard/portfolio" style={{ color: "#3b82f6" }}>portfolio</a> para sincronizarla automáticamente.</p>
                        )}
                    </div>
                </div>
            </Section>

            {/* ── TEMA ── */}
            <Section icon={<Palette size={14} color="#d97706" />} iconBg="linear-gradient(135deg,#fef3c7,#fde68a)"
                title="Tema de color" sub="Paleta visual de tu página de links" defaultOpen={false}>
                <ThemePicker value={config.theme || "dark"} onChange={val => setConfig(c => ({ ...c, theme: val }))} />
            </Section>

            {/* ── FONDO ── */}
            <Section icon={<Image size={14} color="#9333ea" />} iconBg="linear-gradient(135deg,#fdf4ff,#f3e8ff)"
                title="Foto de fondo" sub="Se superpone con el color del tema" defaultOpen={false}>
                <ImageUploader type="background" shape="rect" currentUrl={config.backgroundUrl || null}
                    onUploaded={url => setConfig(c => ({ ...c, backgroundUrl: url }))}
                    onRemove={() => setConfig(c => ({ ...c, backgroundUrl: null }))} />
            </Section>

            {/* ── LINKS ── */}
            <Section
                icon={<Link2 size={14} color="#0284c7" />} iconBg="linear-gradient(135deg,#f0f9ff,#e0f2fe)"
                title="Links"
                sub={maxLinks !== -1 ? `${links.length} de ${maxLinks} links usados` : `${links.length} links`}
                badge={
                    canAdd && (
                        <button onClick={e => { e.stopPropagation(); setShowAddForm(s => !s) }} style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 11px", borderRadius: 8, border: "none",
                            background: showAddForm ? C.surface : "linear-gradient(135deg,#1a1a2e,#1e3a5f)",
                            color: showAddForm ? C.slate : "white",
                            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F,
                        }}>
                            <Plus size={12} /> Agregar
                        </button>
                    )
                }
            >
                {!canAdd && maxLinks !== -1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                        <AlertTriangle size={14} color="#d97706" />
                        <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>
                            Límite de {maxLinks} links alcanzado.{" "}
                            <a href="/dashboard/subscription" style={{ color: "#d97706", fontWeight: 700 }}>Mejorar plan →</a>
                        </p>
                    </div>
                )}

                {showAddForm && (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Texto del botón (ej: Instagram)"
                            style={S.input} />
                        <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (ej: https://instagram.com/...)"
                            style={S.input} />
                        <div>
                            <p style={S.label}>ÍCONO</p>
                            <IconPicker value={newIcon} onChange={setNewIcon} />
                        </div>
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                            <p style={S.label}>IMAGEN DEL BOTÓN <span style={{ fontWeight: 400, textTransform: "none", color: C.muted }}>(opcional)</span></p>
                            <ImageUploader type="link" shape="rect" currentUrl={newImageUrl}
                                onUploaded={url => setNewImageUrl(url)} onRemove={() => setNewImageUrl(null)} />
                        </div>
                        {addError && <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>⚠️ {addError}</p>}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button onClick={() => { setShowAddForm(false); setNewLabel(""); setNewUrl(""); setNewIcon("link"); setNewImageUrl(null); setAddError(null) }}
                                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, cursor: "pointer", fontFamily: F, color: C.slate }}>
                                Cancelar
                            </button>
                            <button onClick={handleAddLink} disabled={adding || !newLabel.trim() || !newUrl.trim()}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "none", background: "#16a34a", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, opacity: (!newLabel.trim() || !newUrl.trim()) ? 0.5 : 1 }}>
                                {adding ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={12} />} Agregar
                            </button>
                        </div>
                    </div>
                )}

                {links.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>
                        <Link2 size={28} style={{ marginBottom: 8, opacity: 0.35 }} />
                        <p style={{ fontSize: 13, margin: 0 }}>Agregá tu primer link</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {links.map((link, idx) => (
                            <LinkRow key={link.id} link={link}
                                onUpdate={handleUpdate} onDelete={handleDelete} onToggle={handleToggle}
                                isDraggingOver={dragOver === idx}
                                onDragStart={() => { dragIdx.current = idx }}
                                onDragEnter={() => setDragOver(idx)}
                                onDrop={() => handleReorder(dragIdx.current, idx)}
                            />
                        ))}
                    </div>
                )}
            </Section>

            {/* ── SAVE ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, paddingBottom: 24 }}>
                {saveMsg && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                        background: saveMsg.error ? "#fef2f2" : "#ecfdf5",
                        border: `1px solid ${saveMsg.error ? "#fecaca" : "#a7f3d0"}`,
                        borderRadius: 11, fontSize: 12, fontWeight: 700,
                        color: saveMsg.error ? "#dc2626" : "#059669",
                    }}>
                        {saveMsg.error ? <AlertTriangle size={13} /> : <Check size={13} />} {saveMsg.text}
                    </div>
                )}
                <button onClick={handleSave} disabled={saving} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "13px 24px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
                    color: C.white, fontSize: 14, fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer", fontFamily: F,
                    opacity: saving ? 0.8 : 1, width: "100%",
                }}>
                    {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
                    {saving ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}