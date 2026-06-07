"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ImagePlus, Star, Trash2, Loader2, AlertCircle, Upload, X } from "lucide-react"

const MAX_SIZE = 5 * 1024 * 1024 // 2 MB
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export default function PortfolioImagesSection() {
    const [images, setImages]           = useState([])
    const [max, setMax]                 = useState(0)       // maxPortfolioPhotos del plan
    const [loading, setLoading]         = useState(true)
    const [uploading, setUploading]     = useState(false)
    const [error, setError]             = useState("")
    const [deletingId, setDeletingId]   = useState(null)
    const [featuringId, setFeaturingId] = useState(null)
    const [dragging, setDragging]       = useState(false)
    const inputRef                      = useRef(null)

    const fetchImages = useCallback(() => {
        setLoading(true)
        fetch("/api/photographer/portfolio/images")
            .then(r => r.json())
            .then(d => {
                setImages(d.images ?? [])
                setMax(d.maxPortfolioPhotos ?? 0)
            })
            .catch(() => setError("Error al cargar las fotos"))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { fetchImages() }, [fetchImages])

    // max===0: campo no migrado aún → permitir; max===-1: ilimitado; max>0: verificar límite
    const canUploadMore = max === -1 || max === 0 || images.length < max

    // ── Upload ──────────────────────────────────────────────────────────────
    async function handleFiles(files) {
        setError("")
        const file = files[0]
        if (!file) return

        if (!ALLOWED.includes(file.type)) {
            setError("Solo JPG, PNG o WEBP")
            return
        }
        if (file.size > MAX_SIZE) {
            setError("La imagen no puede superar 2 MB")
            return
        }
        if (!canUploadMore) {
            setError(`Tu plan permite máximo ${max} foto${max === 1 ? "" : "s"} en el portfolio`)
            return
        }

        setUploading(true)
        const fd = new FormData()
        fd.append("file", file)

        try {
            const res = await fetch("/api/photographer/portfolio/images", { method: "POST", body: fd })
            const data = await res.json()
            if (!res.ok) { setError(data.error || "Error al subir la foto"); return }
            setImages(prev => [...prev, data])
        } catch {
            setError("Error al subir la foto")
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    // ── Delete ──────────────────────────────────────────────────────────────
    async function handleDelete(id) {
        setDeletingId(id)
        try {
            const res = await fetch("/api/photographer/portfolio/images", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            })
            if (res.ok) setImages(prev => prev.filter(img => img.id !== id))
            else setError("Error al eliminar la foto")
        } catch {
            setError("Error al eliminar la foto")
        } finally {
            setDeletingId(null)
        }
    }

    // ── Toggle featured ─────────────────────────────────────────────────────
    async function handleFeature(img) {
        setFeaturingId(img.id)
        try {
            const res = await fetch("/api/photographer/portfolio/images", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: img.id, isFeatured: !img.isFeatured }),
            })
            const data = await res.json()
            if (res.ok) {
                setImages(prev =>
                    prev.map(i => i.id === img.id ? { ...i, isFeatured: data.isFeatured } : i)
                )
            } else {
                setError("Error al actualizar")
            }
        } catch {
            setError("Error al actualizar")
        } finally {
            setFeaturingId(null)
        }
    }

    // ── Drag & drop ─────────────────────────────────────────────────────────
    function onDragOver(e) { e.preventDefault(); setDragging(true) }
    function onDragLeave() { setDragging(false) }
    function onDrop(e) { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }

    // ── Pill: slots ─────────────────────────────────────────────────────────
    const slotLabel = (max === -1 || max === 0)
        ? `${images.length} foto${images.length === 1 ? "" : "s"}`
        : `${images.length} / ${max} foto${max === 1 ? "" : "s"}`

    return (
        <div style={S.section}>
            {/* Header */}
            <div style={S.sectionHead}>
                <div style={S.sectionIcon("linear-gradient(135deg,#f0fdf4,#dcfce7)")}>
                    <ImagePlus size={15} color="#16a34a" />
                </div>
                <div>
                    <p style={S.sectionTitle}>Fotos del portfolio</p>
                    <p style={S.sectionSub}>
                        Subí tus mejores trabajos · JPG, PNG o WEBP · máx. 2 MB por foto
                        {max > 0 && ` · hasta ${max} foto${max === 1 ? "" : "s"} según tu plan`}
                    </p>
                </div>
                <span style={S.pill}>{slotLabel}</span>
            </div>

            <div style={{ padding: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {error && (
                    <div style={S.errBox}>
                        <AlertCircle size={14} />
                        {error}
                        <button onClick={() => setError("")} style={S.errClose}><X size={12} /></button>
                    </div>
                )}

                {/* Upload zone */}
                {canUploadMore && (
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => !uploading && inputRef.current?.click()}
                        style={{
                            ...S.dropzone,
                            borderColor: dragging ? "#16a34a" : "#d1d5db",
                            background: dragging ? "#f0fdf4" : "#fafafa",
                            cursor: uploading ? "default" : "pointer",
                        }}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={20} color="#16a34a" style={{ animation: "spin 1s linear infinite" }} />
                                <span style={S.dropText}>Subiendo...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={20} color="#94a3b8" />
                                <span style={S.dropText}>Arrastrá una foto acá</span>
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>— o —</span>
                                <button
                                    onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                                    style={S.uploadBtn}
                                >
                                    <ImagePlus size={13} /> Seleccionar foto
                                </button>
                            </>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            style={{ display: "none" }}
                            onChange={e => handleFiles(e.target.files)}
                        />
                    </div>
                )}

                {/* Grid */}
                {loading
                    ? <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <Loader2 size={18} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
                      </div>
                    : images.length === 0
                        ? <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, margin: 0 }}>
                            Todavía no subiste ninguna foto
                          </p>
                        : <div style={S.grid}>
                            {images.map(img => (
                                <ImageCard
                                    key={img.id}
                                    img={img}
                                    deletingId={deletingId}
                                    featuringId={featuringId}
                                    onDelete={handleDelete}
                                    onFeature={handleFeature}
                                />
                            ))}
                          </div>
                }

                {/* Plan limit reached */}
                {max > 0 && !canUploadMore && images.length > 0 && (
                    <p style={{ fontSize: 12, color: "#f59e0b", margin: 0, textAlign: "center" }}>
                        Llegaste al límite de fotos de tu plan ({max}). Mejorá tu plan para subir más.
                    </p>
                )}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

// ─── ImageCard ─────────────────────────────────────────────────────────────────
function ImageCard({ img, deletingId, featuringId, onDelete, onFeature }) {
    const [hovered, setHovered] = useState(false)
    const isDeleting  = deletingId === img.id
    const isFeaturing = featuringId === img.id

    return (
        <div
            style={{ ...S.card, opacity: isDeleting ? 0.5 : 1 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={img.bunnyUrl}
                alt={img.caption || "Portfolio"}
                style={S.thumb}
            />

            {/* Featured badge — siempre visible */}
            {img.isFeatured && (
                <div style={S.featuredBadge}>
                    <Star size={9} fill="currentColor" /> Destacada
                </div>
            )}

            {/* Overlay actions — visible al hacer hover */}
            <div style={{ ...S.overlay, opacity: hovered || isDeleting || isFeaturing ? 1 : 0 }}>
                {/* Feature toggle */}
                <button
                    onClick={() => onFeature(img)}
                    disabled={isFeaturing || isDeleting}
                    title={img.isFeatured ? "Quitar destacado" : "Destacar foto"}
                    style={{
                        ...S.iconBtn,
                        background: img.isFeatured ? "#fef08a" : "rgba(255,255,255,0.9)",
                        color: img.isFeatured ? "#854d0e" : "#475569",
                    }}
                >
                    {isFeaturing
                        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : <Star size={13} fill={img.isFeatured ? "currentColor" : "none"} />
                    }
                </button>

                {/* Delete */}
                <button
                    onClick={() => onDelete(img.id)}
                    disabled={isDeleting || isFeaturing}
                    title="Eliminar foto"
                    style={{ ...S.iconBtn, background: "rgba(254,202,202,0.95)", color: "#b91c1c" }}
                >
                    {isDeleting
                        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : <Trash2 size={13} />
                    }
                </button>
            </div>
        </div>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
    section: {
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    sectionHead: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 20px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fafafa",
    },
    sectionIcon: (bg) => ({
        width: 34, height: 34,
        borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: bg, flexShrink: 0,
    }),
    sectionTitle: { margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" },
    sectionSub:   { margin: 0, fontSize: 12, color: "#64748b", marginTop: 2 },
    pill: {
        marginLeft: "auto",
        fontSize: 11, fontWeight: 700,
        background: "#f1f5f9", color: "#475569",
        padding: "3px 10px", borderRadius: 20,
        border: "1px solid #e2e8f0", whiteSpace: "nowrap",
    },
    dropzone: {
        border: "2px dashed",
        borderRadius: 12,
        padding: "28px 20px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 8,
        transition: "border-color 0.2s, background 0.2s",
    },
    dropText: { fontSize: 13, color: "#64748b" },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 10,
    },
    card: {
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        aspectRatio: "1 / 1",
        background: "#f1f5f9",
        transition: "opacity 0.2s",
    },
    thumb: {
        width: "100%", height: "100%",
        objectFit: "cover", display: "block",
    },
    overlay: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
        gap: 5, padding: 7,
        background: "linear-gradient(to bottom,rgba(0,0,0,0.25) 0%,transparent 50%)",
        opacity: 0,
        transition: "opacity 0.18s",
        // Show on hover via CSS class — handled inline below
    },
    iconBtn: {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 8,
        border: "none", cursor: "pointer",
        padding: 0,
    },
    featuredBadge: {
        position: "absolute", bottom: 6, left: 6,
        background: "rgba(254,240,138,0.95)",
        color: "#854d0e",
        fontSize: 10, fontWeight: 700,
        padding: "2px 7px", borderRadius: 6,
        display: "flex", alignItems: "center", gap: 4,
    },
    errBox: {
        display: "flex", alignItems: "center", gap: 8,
        background: "#fef2f2", border: "1px solid #fecaca",
        color: "#b91c1c", borderRadius: 10,
        padding: "10px 14px", fontSize: 13,
    },
    errClose: {
        marginLeft: "auto", background: "none", border: "none",
        cursor: "pointer", color: "#b91c1c", padding: 0, display: "flex",
    },
    uploadBtn: {
        display: "flex", alignItems: "center", gap: 6,
        background: "#0f172a", color: "white",
        border: "none", borderRadius: 8,
        padding: "8px 16px", fontSize: 13, fontWeight: 600,
        cursor: "pointer", marginTop: 4,
    },
}