"use client"

import { useState, useEffect, useRef } from "react"
import {
    User, Link2, Globe, Lock, Save,
    Loader2, Check, AlertCircle, ExternalLink,
    Mail, Phone, MessageCircle,
    MapPin, Camera, Sparkles, ToggleLeft, ToggleRight,
    Copy, CheckCheck, Upload, Trash2, ImagePlus, Star,
    Palette, Eye, Images, Share2, ChevronDown, ChevronUp
} from "lucide-react"

import ShareModal from "@/components/SharedModal"
import PortfolioImagesSection from "@/components/PortfolioImagesSection"
import { FaFacebook as Facebook, FaInstagram as Instagram, FaYoutube as Youtube, FaLinkedin as Linkedin, FaTiktok as Tiktok, FaWhatsapp as Whatsapp } from "react-icons/fa"

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    navy: "#0f172a",
    slate: "#475569",
    muted: "#94a3b8",
    border: "#e2e8f0",
    surface: "#f8fafc",
    white: "#ffffff",
    green: "#10b981",
    red: "#ef4444",
}
const F = "'DM Sans', system-ui, sans-serif"
const R = { sm: 8, md: 10, lg: 14, xl: 16 }

// ─── Provincias argentinas ─────────────────────────────────────────────────────
const PROVINCIAS = [
    "Buenos Aires", "Ciudad de Buenos Aires", "Catamarca", "Chaco", "Chubut",
    "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
    "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta",
    "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
    "Tierra del Fuego", "Tucumán",
].sort((a, b) => a.localeCompare(b, "es"))

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
    card: {
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 12,
    },
    cardHead: {
        padding: "14px 18px",
        borderBottom: `1px solid ${C.surface}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        userSelect: "none",
    },
    cardHeadLeft: { display: "flex", alignItems: "center", gap: 10 },
    icon: (bg) => ({
        width: 32, height: 32, borderRadius: 10,
        background: bg, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
    }),
    cardTitle: { fontSize: 13, fontWeight: 700, color: C.navy, margin: 0 },
    cardSub: { fontSize: 11, color: C.muted, margin: "1px 0 0" },
    body: { padding: "18px 20px" },
    label: { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", display: "block", marginBottom: 5 },
    input: {
        width: "100%", padding: "9px 12px", fontSize: 13, fontWeight: 500, color: C.navy,
        background: C.white, border: `1px solid ${C.border}`, borderRadius: R.md,
        outline: "none", fontFamily: F, boxSizing: "border-box", transition: "border-color 0.15s",
    },
    textarea: {
        width: "100%", padding: "9px 12px", fontSize: 13, fontWeight: 500, color: C.navy,
        background: C.white, border: `1px solid ${C.border}`, borderRadius: R.md,
        outline: "none", fontFamily: F, boxSizing: "border-box", resize: "vertical", minHeight: 88,
    },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    hint: { fontSize: 11, color: C.muted, marginTop: 4 },
    successMsg: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "9px 14px", marginBottom: 14 },
    errorMsg: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 14px", marginBottom: 14 },
}

// ─── Collapsible section ───────────────────────────────────────────────────────
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
                    {open
                        ? <ChevronUp size={15} color={C.muted} />
                        : <ChevronDown size={15} color={C.muted} />}
                </div>
            </div>
            {open && <div style={S.body}>{children}</div>}
        </div>
    )
}

// ─── Lock screen ──────────────────────────────────────────────────────────────
function PortfolioLocked() {
    return (
        <div style={{ padding: "1rem", maxWidth: 560, margin: "0 auto", fontFamily: F }}>
            <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, padding: "56px 32px", textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg,#f0f9ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid #bfdbfe" }}>
                    <Lock size={24} color="#3b82f6" />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: C.navy, margin: "0 0 8px" }}>Portfolio Público</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
                    Tu plan actual no incluye portfolio público. Mejorá tu plan para tener tu perfil profesional.
                </p>
                <a href="/dashboard/subscription" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", color: C.white, borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                    <Sparkles size={14} /> Ver planes disponibles
                </a>
            </div>
        </div>
    )
}

// ─── Image Uploader ───────────────────────────────────────────────────────────
function ImageUploader({ type, label, hint, currentUrl, onUploaded, onDeleted }) {
    const inputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState("")
    const [preview, setPreview] = useState(currentUrl || null)

    useEffect(() => { setPreview(currentUrl || null) }, [currentUrl])

    const handleFile = async (file) => {
        if (!file) return
        setError("")
        setUploading(true)
        setPreview(URL.createObjectURL(file))
        const fd = new FormData()
        fd.append("type", type)
        fd.append("file", file)
        const res = await fetch("/api/photographer/portfolio", { method: "POST", body: fd })
        const json = await res.json()
        if (res.ok) { onUploaded(json.url); setPreview(json.url) }
        else { setError(json.error || "Error al subir"); setPreview(currentUrl || null) }
        setUploading(false)
    }

    const handleDelete = async () => {
        setDeleting(true)
        const res = await fetch("/api/photographer/portfolio", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type }),
        })
        if (res.ok) { setPreview(null); onDeleted() }
        else { const j = await res.json(); setError(j.error || "Error al eliminar") }
        setDeleting(false)
    }

    const isCover = type === "cover"

    return (
        <div>
            <label style={S.label}>{label}</label>
            {isCover ? (
                // Cover: banner horizontal
                <div>
                    <div style={{
                        width: "100%", height: 100, borderRadius: 12,
                        background: preview ? `url(${preview}) center/cover no-repeat` : "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
                        border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", position: "relative", opacity: uploading ? 0.6 : 1, marginBottom: 10,
                    }}>
                        {!preview && !uploading && <ImagePlus size={24} color="#cbd5e1" />}
                        {uploading && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 size={18} color="#64748b" style={{ animation: "spin 1s linear infinite" }} />
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: R.md, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, background: C.navy, color: C.white, border: "none" }}>
                            <Upload size={12} /> {preview ? "Cambiar" : "Subir portada"}
                        </button>
                        {preview && (
                            <button onClick={handleDelete} disabled={deleting} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: R.md, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                                {deleting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />} Eliminar
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                // Avatar: circular
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                        background: preview ? `url(${preview}) center/cover no-repeat` : "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
                        border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", position: "relative", opacity: uploading ? 0.6 : 1,
                    }}>
                        {!preview && !uploading && <ImagePlus size={18} color="#cbd5e1" />}
                        {uploading && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 size={14} color="#64748b" style={{ animation: "spin 1s linear infinite" }} />
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: R.md, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, background: C.navy, color: C.white, border: "none" }}>
                            <Upload size={12} /> {preview ? "Cambiar foto" : "Subir foto"}
                        </button>
                        {preview && (
                            <button onClick={handleDelete} disabled={deleting} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: R.md, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                                {deleting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />} Eliminar
                            </button>
                        )}
                    </div>
                </div>
            )}
            {error && <p style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>{error}</p>}
            {hint && <p style={S.hint}>{hint}</p>}
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
        </div>
    )
}

// ─── Social input ─────────────────────────────────────────────────────────────
function SocialField({ icon: Icon, label, value, onChange, placeholder, color }) {
    return (
        <div>
            <label style={S.label}>{label}</label>
            <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <Icon size={14} color={value ? color : C.muted} />
                </div>
                <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...S.input, paddingLeft: 34 }} />
            </div>
        </div>
    )
}

// ─── LocationPicker ────────────────────────────────────────────────────────────
function LocationPicker({ province, city, cityNormalized, onChangeProvince, onChangeCity }) {
    const [localities, setLocalities] = useState([])
    const [loadingLoc, setLoadingLoc] = useState(false)
    const [query, setQuery] = useState(city || "")
    const [showDrop, setShowDrop] = useState(false)
    const cacheRef = useRef({})
    const wrapRef = useRef(null)

    useEffect(() => {
        if (!province) { setLocalities([]); return }
        if (cacheRef.current[province]) { setLocalities(cacheRef.current[province]); return }
        setLoadingLoc(true)
        setLocalities([])
        fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(province)}&max=5000`)
            .then(r => r.json())
            .then(data => {
                const sorted = data.localidades.map(l => l.nombre).sort((a, b) => a.localeCompare(b, "es"))
                cacheRef.current[province] = sorted
                setLocalities(sorted)
            })
            .catch(() => { })
            .finally(() => setLoadingLoc(false))
    }, [province])

    useEffect(() => {
        setQuery("")
        onChangeCity("", "")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [province])

    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const filtered = query.length >= 1
        ? localities.filter(l => l.toLowerCase().startsWith(query.toLowerCase())).slice(0, 8)
        : []

    return (
        <div style={S.row2}>
            <div>
                <label style={S.label}>PROVINCIA</label>
                <div style={{ position: "relative" }}>
                    <MapPin size={14} color={C.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <select value={province} onChange={e => onChangeProvince(e.target.value)}
                        style={{ ...S.input, paddingLeft: 34, appearance: "none", cursor: "pointer", color: province ? C.navy : C.muted }}>
                        <option value="">Seleccioná una provincia</option>
                        {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>
            <div ref={wrapRef}>
                <label style={S.label}>
                    LOCALIDAD
                    {cityNormalized && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: "#059669", fontWeight: 600, background: "#ecfdf5", padding: "1px 6px", borderRadius: 4, border: "1px solid #a7f3d0" }}>✓ verificada</span>
                    )}
                </label>
                <div style={{ position: "relative" }}>
                    <MapPin size={14} color={cityNormalized ? "#059669" : C.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input value={query}
                        onChange={e => { setQuery(e.target.value); setShowDrop(true); if (!e.target.value) onChangeCity("", "") }}
                        onFocus={() => query.length >= 1 && setShowDrop(true)}
                        placeholder={!province ? "Primero elegí una provincia" : loadingLoc ? "Cargando..." : "Buscá tu ciudad..."}
                        disabled={!province || loadingLoc}
                        style={{ ...S.input, paddingLeft: 34, borderColor: cityNormalized ? "#a7f3d0" : undefined }}
                    />
                    {loadingLoc && <Loader2 size={13} color={C.muted} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite" }} />}
                    {showDrop && filtered.length > 0 && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: C.white, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden" }}>
                            {filtered.map(loc => (
                                <button key={loc} onMouseDown={() => { setQuery(loc); setShowDrop(false); onChangeCity(loc, loc) }}
                                    style={{ width: "100%", textAlign: "left", padding: "8px 13px", fontSize: 13, fontWeight: 500, color: C.navy, background: "none", border: "none", cursor: "pointer", fontFamily: F, borderBottom: `1px solid ${C.surface}`, display: "flex", alignItems: "center", gap: 8 }}
                                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                                >
                                    <MapPin size={12} color={C.muted} />{loc}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Theme Picker ─────────────────────────────────────────────────────────────
const PRESET_THEMES = [
    { key: "dark", label: "Oscuro", preview: ["#0f172a", "#1e293b", "#3b82f6"] },
    { key: "light", label: "Claro", preview: ["#f8fafc", "#e2e8f0", "#0f172a"] },
    { key: "warm", label: "Cálido", preview: ["#1c1008", "#292010", "#f59e0b"] },
]

function parseCustomTheme(val) {
    if (!val?.startsWith("custom:")) return null
    const parts = val.split(":")
    return { bg: parts[1] || "#0f172a", card: parts[2] || "#1e293b", accent: parts[3] || "#3b82f6" }
}

const CUSTOM_DEFAULTS = { bg: "#0f0a1e", card: "#1a1035", accent: "#a855f7" }

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
                        cursor: "pointer", fontFamily: F, transition: "all .15s",
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
                    cursor: "pointer", fontFamily: F, transition: "all .15s",
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
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0, letterSpacing: ".04em" }}>COLORES DEL TEMA</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        {[
                            { label: "FONDO", val: localBg, setVal: setLocalBg, key: "bg" },
                            { label: "TARJETAS", val: localCard, setVal: setLocalCard, key: "card" },
                            { label: "ACENTO", val: localAccent, setVal: setLocalAccent, key: "accent" },
                        ].map(({ label, val, setVal, key }) => (
                            <div key={key}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>{label}</label>
                                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                                    <div style={{ position: "relative", width: 36, height: 36, borderRadius: R.md, overflow: "hidden", border: `2px solid ${C.border}`, flexShrink: 0, cursor: "pointer" }}>
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
                                        style={{ flex: 1, padding: "7px 9px", fontSize: 12, fontWeight: 600, fontFamily: "monospace", background: C.white, border: `1px solid ${C.border}`, borderRadius: R.sm, outline: "none", color: C.navy }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Featured Gallery Toggle ───────────────────────────────────────────────────
function FeaturedGalleryRow({ gallery, onToggle }) {
    const [loading, setLoading] = useState(false)
    const [featured, setFeatured] = useState(gallery.isFeatured)

    const handle = async () => {
        setLoading(true)
        const res = await fetch("/api/photographer/portfolio", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toggleFeatured: gallery.id }),
        })
        if (res.ok) { setFeatured(f => !f); onToggle?.() }
        setLoading(false)
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.surface}` }}>
            <div style={{ width: 40, height: 40, borderRadius: R.md, background: gallery.coverImage ? `url(${gallery.coverImage}) center/cover` : C.surface, border: `1px solid ${C.border}`, flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.navy, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gallery.title}</p>
            <button onClick={handle} disabled={loading} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: R.sm,
                background: featured ? "linear-gradient(135deg,#fef9c3,#fef08a)" : C.surface,
                color: featured ? "#854d0e" : C.slate, fontSize: 12, fontWeight: 700,
                border: `1px solid ${featured ? "#fde047" : C.border}`,
                cursor: "pointer", fontFamily: F,
            }}>
                {loading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Star size={11} fill={featured ? "currentColor" : "none"} />}
                {featured ? "Destacada" : "Destacar"}
            </button>
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
    const [loading, setLoading] = useState(true)
    const [planAllowsPortfolio, setPlan] = useState(false)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)
    const [showShare, setShowShare] = useState(false)

    const [enabled, setEnabled] = useState(false)
    const [slug, setSlug] = useState("")
    const [realName, setRealName] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [specialty, setSpecialty] = useState("")
    const [city, setCity] = useState("")
    const [cityNormalized, setCityNormalized] = useState("")
    const [province, setProvince] = useState("")
    const [coverUrl, setCoverUrl] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [instagram, setInstagram] = useState("")
    const [facebook, setFacebook] = useState("")
    const [youtube, setYoutube] = useState("")
    const [linkedin, setLinkedin] = useState("")
    const [tiktok, setTiktok] = useState("")
    const [website, setWebsite] = useState("")
    const [emailContact, setEmailContact] = useState("")
    const [whatsapp, setWhatsapp] = useState("")
    const [theme, setTheme] = useState("dark")
    const [galleries, setGalleries] = useState([])
    const [views, setViews] = useState(0)

    const fetchData = () => {
        fetch("/api/photographer/settings")
            .then(r => r.json())
            .then(d => setRealName(d.name ?? ""))

        fetch("/api/photographer/portfolio")
            .then(r => r.json())
            .then(d => {
                setPlan(d.planAllowsPortfolio ?? false)
                setEnabled(d.portfolioEnabled ?? false)
                setSlug(d.portfolioSlug ?? "")
                setDisplayName(d.portfolioDisplayName ?? "")
                setBio(d.portfolioBio ?? "")
                setSpecialty(d.portfolioSpecialty ?? "")
                setCity(d.portfolioCity ?? "")
                setCityNormalized(d.portfolioCityNormalized ?? "")
                setProvince(d.portfolioProvince ?? "")
                setCoverUrl(d.portfolioCoverUrl ?? "")
                setAvatarUrl(d.portfolioAvatarUrl ?? "")
                setInstagram(d.portfolioInstagram ?? "")
                setFacebook(d.portfolioFacebook ?? "")
                setYoutube(d.portfolioYoutube ?? "")
                setLinkedin(d.portfolioLinkedin ?? "")
                setTiktok(d.portfolioTiktok ?? "")
                setWebsite(d.portfolioWebsite ?? "")
                setEmailContact(d.portfolioEmail ?? "")
                setWhatsapp(d.portfolioWhatsapp ?? "")
                setTheme(d.portfolioTheme ?? "dark")
                setGalleries(d.galleries ?? [])
                setViews(d.portfolioViews ?? 0)
                setLoading(false)
            })
    }

    useEffect(() => { fetchData() }, [])

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 size={22} color={C.muted} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!planAllowsPortfolio) return <PortfolioLocked />

    const publicUrl = slug ? `${slug}.photobook.com.ar` : null

    const handleSave = async () => {
        setSaving(true); setError(""); setSuccess(false)

        const nameRes = await fetch("/api/photographer/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: realName.trim() }),
        })
        if (!nameRes.ok) {
            const json = await nameRes.json()
            setError(json.error || "Error al guardar el nombre")
            setSaving(false); return
        }

        const res = await fetch("/api/photographer/portfolio", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                portfolioEnabled: enabled, portfolioSlug: slug,
                portfolioDisplayName: displayName, portfolioBio: bio,
                portfolioSpecialty: specialty, portfolioCity: city,
                portfolioCityNormalized: cityNormalized, portfolioProvince: province,
                portfolioInstagram: instagram, portfolioFacebook: facebook,
                portfolioYoutube: youtube, portfolioLinkedin: linkedin,
                portfolioTiktok: tiktok, portfolioWebsite: website,
                portfolioEmail: emailContact, portfolioWhatsapp: whatsapp,
                portfolioTheme: theme,
            }),
        })
        const json = await res.json()
        if (res.ok) { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
        else setError(json.error || "Error al guardar")
        setSaving(false)
    }

    const handleCopy = () => {
        if (!publicUrl) return
        navigator.clipboard.writeText(publicUrl)
        setCopied(true); setTimeout(() => setCopied(false), 2000)
    }

    const T = {
        card: C.white, cardBorder: C.border,
        text: C.navy, textSub: C.slate,
        btn: { bg: C.navy, color: C.white },
        btnSec: { bg: C.surface, border: C.border },
        input: { bg: C.white, border: C.border },
    }

    return (
        <div style={{ padding: "0 .5rem 100px", maxWidth: 760, margin: "0 auto", fontFamily: F }}>
            <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={publicUrl} title={displayName || realName} T={T} />

            {/* ── HEADER ── */}
           <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", marginBottom: 14, marginLeft: "4rem" }} className="flex-col">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={17} color="#3b82f6" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.navy, margin: 0, letterSpacing: "-0.025em" }}>Mi PhotoBook</h1>
                        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Perfil público con tus galerías y redes</p>
                    </div>
                </div>

                {/* Toggle de visibilidad prominente en el header */}
                <button onClick={() => setEnabled(v => !v)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                    borderRadius: 10, border: `1px solid ${enabled ? "#a7f3d0" : C.border}`,
                    background: enabled ? "#ecfdf5" : C.surface,
                    color: enabled ? "#059669" : C.slate,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F,
                }}>
                    {enabled
                        ? <><ToggleRight size={18} color="#16a34a" /> Activo</>
                        : <><ToggleLeft size={18} color={C.muted} /> Inactivo</>
                    }
                </button>
            </div>



            {/* ── URL ── */}
            {enabled && (
                <div style={{ ...S.card, marginBottom: 12 }}>
                    <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                        {views > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "#f0f9ff", borderRadius: R.sm, border: "1px solid #bae6fd", flexShrink: 0 }}>
                                <Eye size={12} color="#0284c7" />
                                <span style={{ fontSize: 11, color: "#0369a1", fontWeight: 600, whiteSpace: "nowrap" }}>{views.toLocaleString("es-AR")} visitas</span>
                            </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", flex: 1, alignItems: "center", border: `1px solid ${C.border}`, borderRadius: R.md, overflow: "hidden", background: C.white, minWidth: 0 }}>
                                <Globe size={14} color="#16a34a" style={{ flexShrink: 0, marginLeft: "14px" }} />
                                <input
                                    value={slug}
                                    onChange={e => setSlug(e.target.value)}
                                    placeholder="tu-nombre"
                                    style={{ ...S.input, border: "none", borderRadius: 0, flex: 1 }}
                                />
                                <span style={{ padding: "9px 12px", fontSize: 12, color: C.muted, whiteSpace: "nowrap", borderLeft: `1px solid ${C.border}`, background: C.surface }}>
                                    .photobook.com.ar
                                </span>
                            </div>

                        </div>
                        {publicUrl && (
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.md, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600, fontFamily: F }}>
                                    {copied ? <CheckCheck size={13} color="#059669" /> : <Copy size={13} />}
                                    {copied ? "Copiado" : "Copiar"}
                                </button>
                                <a href={`https://${publicUrl}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.md, border: `1px solid ${C.border}`, background: C.white, textDecoration: "none", color: C.slate, fontSize: 12, fontWeight: 600, fontFamily: F }}>
                                    <ExternalLink size={13} /> Ver
                                </a>
                                <button onClick={() => setShowShare(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.md, border: "none", background: C.navy, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                                    <Share2 size={13} /> Compartir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── IMÁGENES ── */}
            <Section icon={<Camera size={14} color="#9333ea" />} iconBg="linear-gradient(135deg,#fdf4ff,#f3e8ff)"
                title="Fotos de perfil" sub="Portada y avatar de tu página pública">
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <ImageUploader type="cover" label="FOTO DE PORTADA" hint="Recomendado: 1920 × 600 px"
                        currentUrl={coverUrl} onUploaded={url => setCoverUrl(url)} onDeleted={() => setCoverUrl("")} />
                    <ImageUploader type="avatar" label="FOTO DE PERFIL" hint="Recomendado: 400 × 400 px"
                        currentUrl={avatarUrl} onUploaded={url => setAvatarUrl(url)} onDeleted={() => setAvatarUrl("")} />
                </div>
            </Section>

            {/* ── INFO PERSONAL ── */}
            <Section icon={<User size={14} color="#3b82f6" />} iconBg="linear-gradient(135deg,#eff6ff,#dbeafe)"
                title="Información personal" sub="Datos que se muestran en tu perfil">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                        <div>
                            <label style={S.label}>NOMBRE REAL</label>
                            <input value={realName} onChange={e => setRealName(e.target.value)} placeholder="Tu nombre completo" style={S.input} />
                            <p style={S.hint}>Usado en notificaciones y órdenes internas</p>
                        </div>
                        <div>
                            <label style={S.label}>NOMBRE PÚBLICO</label>
                            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="El nombre visible en tu portfolio" style={S.input} />
                            <p style={S.hint}>Si lo dejás vacío se usa el nombre de tu cuenta</p>
                        </div>
                    </div>
                    <div id="specialty">
                        <label style={S.label}>ESPECIALIDAD</label>
                        <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ej: Fotografía de bodas, Retrato..." style={S.input} />
                    </div>
                    <LocationPicker
                        province={province} city={city} cityNormalized={cityNormalized}
                        onChangeProvince={prov => { setProvince(prov); setCity(""); setCityNormalized("") }}
                        onChangeCity={(displayCity, normalized) => { setCity(displayCity); setCityNormalized(normalized) }}
                    />
                    <div>
                        <label style={S.label}>BIO / DESCRIPCIÓN</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Contá quién sos, tu estilo y experiencia..." style={S.textarea} rows={3} />
                    </div>
                </div>
            </Section>

            {/* ── TEMA ── */}
            <Section icon={<Palette size={14} color="#d97706" />} iconBg="linear-gradient(135deg,#fef3c7,#fde68a)"
                title="Tema de color" sub="Paleta visual de tu portfolio" defaultOpen={false}>
                <ThemePicker value={theme} onChange={setTheme} />
            </Section>

            {/* ── REDES + CONTACTO ── */}
            <Section icon={<Link2 size={14} color="#f97316" />} iconBg="linear-gradient(135deg,#fff7ed,#ffedd5)"
                title="Redes sociales y contacto" sub="Links y formas de contacto para tus clientes" defaultOpen={false}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <SocialField icon={Instagram} label="INSTAGRAM" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." color="#E1306C" />
                    <SocialField icon={Facebook} label="FACEBOOK" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/..." color="#1877F2" />
                    <SocialField icon={Tiktok} label="TIKTOK" value={tiktok} onChange={setTiktok} placeholder="https://tiktok.com/@..." color="#000000" />
                    <SocialField icon={Youtube} label="YOUTUBE" value={youtube} onChange={setYoutube} placeholder="https://youtube.com/..." color="#FF0000" />
                    <SocialField icon={Linkedin} label="LINKEDIN" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/..." color="#0A66C2" />
                    <SocialField icon={Globe} label="SITIO WEB" value={website} onChange={setWebsite} placeholder="https://..." color={C.slate} />
                    <SocialField icon={Mail} label="EMAIL" value={emailContact} onChange={setEmailContact} placeholder="tu@email.com" color={C.slate} />
                    <SocialField icon={Whatsapp} label="WHATSAPP" value={whatsapp} onChange={setWhatsapp} placeholder="+54 9 351 000 0000" color="#25D366" />
                </div>
            </Section>

            {/* ── IMÁGENES DEL PORTFOLIO ── */}
            <Section icon={<Images size={14} color="#0284c7" />} iconBg="linear-gradient(135deg,#f0f9ff,#e0f2fe)"
                title="Imágenes del portfolio" sub="Fotos de muestra que se muestran en tu perfil" defaultOpen={false}>
                <PortfolioImagesSection />
            </Section>

            {/* ── GALERÍAS DESTACADAS ── */}
            {galleries.length > 0 && (
                <Section icon={<Star size={14} color="#ca8a04" />} iconBg="linear-gradient(135deg,#fefce8,#fef9c3)"
                    title="Galerías destacadas" sub="Aparecen primero en tu portfolio"
                    badge={<span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", background: "#fef9c3", border: "1px solid #fde047", borderRadius: 20, padding: "2px 8px" }}>{galleries.length}</span>}
                    defaultOpen={false}>
                    {galleries.map(g => <FeaturedGalleryRow key={g.id} gallery={g} onToggle={fetchData} />)}
                </Section>
            )}

            {/* ── SAVE ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, paddingBottom: 24 }}>
                {success && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 11, fontSize: 12, fontWeight: 700, color: "#059669" }}>
                        <Check size={13} /> Cambios guardados correctamente
                    </div>
                )}
                {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 11, fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
                        <AlertCircle size={13} /> {error}
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