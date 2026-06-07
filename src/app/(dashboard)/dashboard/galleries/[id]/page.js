"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft, Upload, Trash2, Eye, Copy, Check,
    Lock, Globe, Loader2, X, Settings,
    Camera, Users, Palette, Image, DollarSign, CalendarDays, MoreVertical
} from "lucide-react"
import PricingConfig   from "@/components/pricing-config"
import CoverPicker     from "@/components/cover-picker"
import EventPanel      from "@/components/event-panel"
import ThemeSelector   from "@/components/dashboard/ThemeSelector"
import GallerySettingsModal from "@/components/gallery/gallery-settings-modal"

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
    navy:       "#0f172a",
    slate:      "#475569",
    muted:      "#94a3b8",
    border:     "#e2e8f0",
    surface:    "#f8fafc",
    white:      "#ffffff",
    green:      "#10b981",
    red:        "#ef4444",
    redLight:   "#fecaca",
    activeTab:  "#0f172a",
    activeBg:   "#ffffff",
}
const F = "'DM Sans', system-ui, sans-serif"
const R = { sm: 8, md: 10, lg: 14, xl: 16 }

// ─── Tab definitions (built dynamically to support conditional Event tab) ────
const buildTabs = (isEvent) => {
    const tabs = [
        { id: "photos",     label: "Fotos",      icon: Camera },
        { id: "prices",     label: "Precios",     icon: DollarSign },
        { id: "appearance", label: "Apariencia",  icon: Palette },
    ]
    if (isEvent) tabs.push({ id: "event", label: "Evento", icon: CalendarDays })
    return tabs
}

// ─── Small reusable styles ───────────────────────────────────────────────────
const btn = (variant = "ghost") => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", borderRadius: R.md,
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: F, whiteSpace: "nowrap", border: "none",
    ...(variant === "primary"  && { background: C.navy,     color: C.white }),
    ...(variant === "ghost"    && { background: C.white,    color: C.slate,   border: `1px solid ${C.border}` }),
    ...(variant === "danger"   && { background: C.white,    color: C.red,     border: `1px solid ${C.redLight}` }),
    ...(variant === "icon"     && { background: C.white,    color: C.slate,   border: `1px solid ${C.border}`, width: 36, height: 36, padding: 0, justifyContent: "center", borderRadius: R.md }),
})

// ─── Component ───────────────────────────────────────────────────────────────
export default function GalleryDetailPage() {
    const { id }   = useParams()
    const router   = useRouter()

    const [gallery, setGallery]               = useState(null)
    const [loading, setLoading]               = useState(true)
    const [activeTab, setActiveTab]           = useState("photos")
    const [uploading, setUploading]           = useState(false)
    const [uploadProgress, setUploadProgress] = useState([])
    const [isDragging, setIsDragging]         = useState(false)
    const [deletingPhoto, setDeletingPhoto]   = useState(null)
    const [copied, setCopied]                 = useState(false)
    const [showSettings, setShowSettings]     = useState(false)
    const [menuOpen, setMenuOpen]             = useState(false)

    const fileInputRef = useRef(null)
    const menuRef      = useRef(null)

    // Close mobile menu on outside click
    useEffect(() => {
        if (!menuOpen) return
        const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
        document.addEventListener("mousedown", h)
        return () => document.removeEventListener("mousedown", h)
    }, [menuOpen])

    const fetchGallery = useCallback(async () => {
        const res = await fetch(`/api/galleries/${id}`)
        if (!res.ok) { router.push("/dashboard/galleries"); return }
        const data = await res.json()
        setGallery(data)
        setLoading(false)
    }, [id, router])

    useEffect(() => { fetchGallery() }, [fetchGallery])

    const handleGalleryUpdated = (updated) =>
        setGallery((prev) => ({ ...prev, ...updated }))

    // ── Upload ────────────────────────────────────────────────────────────────
    const handleUpload = async (files) => {
        if (!files?.length) return
        setUploading(true)
        const arr = Array.from(files)
        setUploadProgress(arr.map((f) => ({ name: f.name, status: "uploading" })))
        const form = new FormData()
        arr.forEach((f) => form.append("photos", f))
        form.append("price", gallery.photos?.[0] ? String(Number(gallery.photos[0].price)) : "0")
        try {
            const res  = await fetch(`/api/galleries/${id}/photos`, { method: "POST", body: form })
            const data = await res.json()
            if (!res.ok) {
                setUploadProgress(arr.map((f) => ({ name: f.name, status: "error", error: data.error || "Error" })))
                return
            }
            setUploadProgress(arr.map((f) => {
                const err = data.errors?.find((e) => e.name === f.name)
                return { name: f.name, status: err ? "error" : "done", error: err?.error }
            }))
            await fetchGallery()
        } catch {
            setUploadProgress(arr.map((f) => ({ name: f.name, status: "error", error: "Error de red" })))
        } finally {
            setUploading(false)
            setTimeout(() => setUploadProgress([]), 3500)
        }
    }

    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files) }

    const handleDeletePhoto = async (photoId) => {
        setDeletingPhoto(photoId)
        await fetch(`/api/galleries/${id}/photos/${photoId}`, { method: "DELETE" })
        await fetchGallery()
        setDeletingPhoto(null)
    }

    const handleDeleteGallery = async () => {
        if (!confirm("¿Eliminar esta galería y todas sus fotos? Esta acción no se puede deshacer.")) return
        await fetch(`/api/galleries/${id}`, { method: "DELETE" })
        router.push("/dashboard/galleries")
    }

    const copyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/g/${gallery.slug}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: C.muted }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    const isEvent = gallery.galleryType === "event"
    const TABS    = buildTabs(isEvent)

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: "28px 24px 64px", maxWidth: 980, margin: "0 auto", fontFamily: F }}>

            {/* ════════════════════════════════════════════════════════════════
                HEADER
            ════════════════════════════════════════════════════════════════ */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>

                {/* Left: back + title */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <Link href="/dashboard/galleries" style={{ textDecoration: "none" }}>
                        <button style={btn("icon")} title="Volver">
                            <ArrowLeft size={16} />
                        </button>
                    </Link>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.navy, letterSpacing: "-0.025em", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {gallery.title}
                            </h1>
                            {/* Public/private badge */}
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: gallery.isPublic ? "#065f46" : C.slate, background: gallery.isPublic ? "#ecfdf5" : C.surface, border: `1px solid ${gallery.isPublic ? "#a7f3d0" : C.border}`, padding: "3px 8px", borderRadius: 20 }}>
                                {gallery.isPublic ? <><Globe size={9} /> Pública</> : <><Lock size={9} /> Privada</>}
                            </span>
                            {isEvent && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#4338ca", background: "#eef2ff", border: "1px solid #c7d2fe", padding: "3px 8px", borderRadius: 20 }}>
                                    <Users size={9} /> Evento
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
                            {gallery.photos.length} {gallery.photos.length === 1 ? "foto" : "fotos"}
                        </p>
                    </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>

                    {/* Desktop */}
                    <div className="hdr-desktop" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button style={btn("icon")} onClick={() => setShowSettings(true)} title="Configuración">
                            <Settings size={15} />
                        </button>
                        <button style={btn("ghost")} onClick={copyLink}>
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? "¡Copiado!" : "Copiar link"}
                        </button>
                        <Link href={`/g/${gallery.slug}`} target="_blank" style={{ textDecoration: "none" }}>
                            <button style={btn("primary")}>
                                <Eye size={13} /> Ver galería
                            </button>
                        </Link>
                        <button style={btn("danger")} onClick={handleDeleteGallery}>
                            <Trash2 size={13} /> Eliminar
                        </button>
                    </div>

                    {/* Mobile: "..." */}
                    <div className="hdr-mobile" style={{ position: "relative" }} ref={menuRef}>
                        <button style={btn("icon")} onClick={() => setMenuOpen(v => !v)}>
                            <MoreVertical size={16} />
                        </button>
                        {menuOpen && (
                            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", padding: 6, minWidth: 200, zIndex: 100 }}>
                                {[
                                    { label: "Configuración",   icon: <Settings size={14} />,  action: () => { setShowSettings(true); setMenuOpen(false) } },
                                    { label: copied ? "¡Copiado!" : "Copiar link", icon: copied ? <Check size={14} color={C.green} /> : <Copy size={14} />, action: () => { copyLink(); setMenuOpen(false) } },
                                ].map((item) => (
                                    <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: R.sm, cursor: "pointer", fontSize: 13, fontWeight: 500, width: "100%", border: "none", background: "transparent", fontFamily: F, color: "#374151", textAlign: "left" }}>
                                        {item.icon} {item.label}
                                    </button>
                                ))}
                                <Link href={`/g/${gallery.slug}`} target="_blank" style={{ textDecoration: "none" }}>
                                    <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: R.sm, cursor: "pointer", fontSize: 13, fontWeight: 500, width: "100%", border: "none", background: "transparent", fontFamily: F, color: "#374151", textAlign: "left" }}>
                                        <Eye size={14} /> Ver galería
                                    </button>
                                </Link>
                                <div style={{ height: 1, background: C.surface, margin: "4px 0" }} />
                                <button onClick={() => { handleDeleteGallery(); setMenuOpen(false) }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: R.sm, cursor: "pointer", fontSize: 13, fontWeight: 500, width: "100%", border: "none", background: "transparent", fontFamily: F, color: C.red, textAlign: "left" }}>
                                    <Trash2 size={14} /> Eliminar galería
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* ── FIN HEADER ── */}


            {/* ════════════════════════════════════════════════════════════════
                TAB BAR
            ════════════════════════════════════════════════════════════════ */}
            <div style={{ display: "flex", gap: 2, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, padding: 4, marginBottom: 24, width: "fit-content" }}>
                {TABS.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id
                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            style={{
                                display: "flex", alignItems: "center", gap: 7,
                                padding: "8px 16px", borderRadius: R.md,
                                fontSize: 13, fontWeight: active ? 700 : 500,
                                cursor: "pointer", fontFamily: F, border: "none",
                                background: active ? C.white : "transparent",
                                color: active ? C.navy : C.muted,
                                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.15s",
                            }}
                        >
                            <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                            {label}
                        </button>
                    )
                })}
            </div>
            {/* ── FIN TAB BAR ── */}


            {/* ════════════════════════════════════════════════════════════════
                TAB: FOTOS
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === "photos" && (
                <div>
                    {/* Upload zone */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: "20px 22px", marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: "0 0 14px" }}>Subir fotos</p>

                        <div
                            style={{
                                border: `2px dashed ${isDragging ? "#1e3a5f" : C.border}`,
                                borderRadius: R.lg, padding: "36px 20px", textAlign: "center",
                                cursor: "pointer", background: isDragging ? "#f0f9ff" : C.surface,
                                transition: "all 0.15s",
                            }}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: isDragging ? "#e0f2fe" : "#f1f5f9", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <Upload size={22} color={isDragging ? "#0284c7" : C.muted} strokeWidth={1.8} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: isDragging ? "#0284c7" : "#374151", margin: "0 0 5px" }}>
                                {isDragging ? "Soltá las fotos acá" : "Arrastrá las fotos acá"}
                            </p>
                            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>
                                o hacé click para seleccionar
                            </p>
                            <span style={{ display: "inline-block", fontSize: 11, color: "#94a3b8", background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "3px 10px" }}>
                                JPG · PNG · WEBP · máx. 20MB
                            </span>
                            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files)} />
                        </div>

                        {/* Uploading spinner */}
                        {uploading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "#64748b" }}>
                                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                                Subiendo fotos al servidor...
                            </div>
                        )}

                        {/* Per-file progress */}
                        {uploadProgress.length > 0 && (
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                                {uploadProgress.map((f, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: f.status === "done" ? C.green : f.status === "error" ? C.red : f.status === "uploading" ? "#3b82f6" : C.border }} />
                                        <span style={{ fontSize: 12, color: C.slate, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0, color: f.status === "done" ? C.green : f.status === "error" ? C.red : C.muted }}>
                                            {f.status === "done" ? "Subida" : f.status === "error" ? (f.error || "Error") : f.status === "uploading" ? "Subiendo..." : "Esperando..."}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Photo grid */}
                    {gallery.photos.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "52px 24px" }}>
                            <div style={{ width: 60, height: 60, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                <Camera size={24} color="#cbd5e1" strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: C.muted, margin: "0 0 4px" }}>No hay fotos todavía</p>
                            <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>Subí fotos usando la zona de arriba</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
                            {gallery.photos.map((photo) => (
                                <div key={photo.id} style={{ position: "relative", aspectRatio: "1", borderRadius: R.lg, overflow: "hidden", background: "#f1f5f9" }} className="photo-thumb-hover">
                                    <img src={photo.bunnyUrl} alt={photo.title || "Foto"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    <div className="photo-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: 8, opacity: 0, transition: "all 0.15s" }}>
                                        {gallery.pricingMode !== "tiered" && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "white", background: "rgba(0,0,0,0.55)", padding: "3px 7px", borderRadius: 7 }}>
                                                    ${Number(photo.price).toFixed(2)}
                                                </span>
                                                {gallery.printableEnabled && photo.printPrice != null && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fed7aa", background: "rgba(0,0,0,0.55)", padding: "2px 6px", borderRadius: 7, display: "flex", alignItems: "center", gap: 3 }}>
                                                        🖨 ${Number(photo.printPrice).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            disabled={deletingPhoto === photo.id}
                                            style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: R.sm, background: C.red, border: "none", cursor: "pointer", color: "white", opacity: deletingPhoto === photo.id ? 0.6 : 1 }}
                                        >
                                            {deletingPhoto === photo.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: PRECIOS
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === "prices" && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: "24px 24px" }}>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: "0 0 4px" }}>Precios de la galería</p>
                        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                            Definí cuánto pagan tus clientes por las fotos. Podés cobrar por foto individual o por paquetes.
                        </p>
                    </div>
                    <PricingConfig
                        galleryId={gallery.id}
                        initialMode={gallery.pricingMode || "per_photo"}
                        initialTiers={gallery.pricingTiers || []}
                        initialDefaultPrice={gallery.photos?.[0] ? Number(gallery.photos[0].price) : 0}
                        initialPrintSizes={gallery.printSizes || []}
                        printableEnabled={gallery.printableEnabled}
                        onSaved={fetchGallery}
                    />
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: APARIENCIA
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === "appearance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Diseño / Tema */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: "24px 24px" }}>
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: "0 0 4px" }}>Diseño de galería</p>
                            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                                Elegí el estilo visual que ven tus clientes. Se aplica al instante sin afectar las fotos.
                            </p>
                        </div>
                        <ThemeSelector
                            galleryId={gallery.id}
                            currentSlug={gallery.themeSlug ?? "classic"}
                            tokenOverrides={gallery.tokenOverrides ?? {}}
                            onSaved={fetchGallery}
                            isEventGallery={isEvent}
                        />
                    </div>

                    {/* Portada */}
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: "24px 24px" }}>
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: "0 0 4px" }}>Foto de portada</p>
                            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                                Se muestra en la lista de galerías y en la pantalla de contraseña.
                            </p>
                        </div>
                        <CoverPicker
                            gallery={gallery}
                            onUpdated={(changes) => setGallery((prev) => ({ ...prev, ...changes }))}
                        />
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB: EVENTO (solo si isEvent)
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === "event" && isEvent && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: "24px 24px" }}>
                    <EventPanel galleryId={gallery.id} gallerySlug={gallery.slug} />
                </div>
            )}


            {/* ════════════════════════════════════════════════════════════════
                MODAL: CONFIGURACION
            ════════════════════════════════════════════════════════════════ */}
            {showSettings && (
                <GallerySettingsModal
                    gallery={gallery}
                    onClose={() => setShowSettings(false)}
                    onUpdated={handleGalleryUpdated}
                />
            )}


            {/* ── CSS global ─────────────────────────────────────────────── */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .hdr-desktop { display: flex !important; }
                .hdr-mobile  { display: none  !important; }
                @media (max-width: 640px) {
                    .hdr-desktop { display: none  !important; }
                    .hdr-mobile  { display: block !important; }
                }

                .photo-thumb-hover:hover .photo-overlay {
                    background: rgba(0,0,0,0.42) !important;
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    )
}