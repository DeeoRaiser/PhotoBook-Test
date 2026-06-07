"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ImagePlus, Trash2, Loader2, Check, Star, Upload, X, Move } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CoverPicker({ gallery, onUpdated }) {
    const [mode, setMode]           = useState(null)   // null | "pick" | "reposition"
    const [saving, setSaving]       = useState(false)
    const [error, setError]         = useState("")
    const fileRef                   = useRef(null)

    // Estado del repositionador
    const [pos, setPos]             = useState({ x: 50, y: 50 }) // porcentaje
    const [dragging, setDragging]   = useState(false)
    const dragStart                 = useRef(null) // { mouseX, mouseY, posX, posY }
    const previewRef                = useRef(null)

    const current   = gallery.coverImage
    const savedPos  = gallery.coverPosition || "50% 50%"

    // Parsear posición guardada al abrir el editor
    useEffect(() => {
        if (mode === "reposition") {
            const parts = savedPos.split(" ")
            setPos({
                x: parseFloat(parts[0]) || 50,
                y: parseFloat(parts[1]) || 50,
            })
        }
    }, [mode])

    // ── Seleccionar foto existente ────────────────────────────────────────────
    const handlePickPhoto = async (photo) => {
        setSaving(true); setError("")
        try {
            const res = await fetch(`/api/galleries/${gallery.id}/cover`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoId: photo.id }),
            })
            const json = await res.json()
            if (!res.ok) { setError(json.error || "Error"); return }
            onUpdated({ coverImage: json.coverImage, coverPosition: "50% 50%" })
            setMode(null)
        } catch { setError("Error de red") }
        finally { setSaving(false) }
    }

    // ── Subir imagen propia ───────────────────────────────────────────────────
    const handleUpload = async (file) => {
        if (!file) return
        setSaving(true); setError("")
        try {
            const form = new FormData()
            form.append("cover", file)
            const res = await fetch(`/api/galleries/${gallery.id}/cover`, {
                method: "PUT",
                body: form,
            })
            const json = await res.json()
            if (!res.ok) { setError(json.error || "Error"); return }
            onUpdated({ coverImage: json.coverImage, coverPosition: "50% 50%" })
            setMode(null)
        } catch { setError("Error de red") }
        finally { setSaving(false) }
    }

    // ── Quitar portada ────────────────────────────────────────────────────────
    const handleRemove = async () => {
        setSaving(true); setError("")
        try {
            const res = await fetch(`/api/galleries/${gallery.id}/cover`, { method: "DELETE" })
            if (!res.ok) { const j = await res.json(); setError(j.error || "Error"); return }
            onUpdated({ coverImage: null, coverPosition: "50% 50%" })
        } catch { setError("Error de red") }
        finally { setSaving(false) }
    }

    // ── Guardar posición ──────────────────────────────────────────────────────
    const handleSavePosition = async () => {
        setSaving(true); setError("")
        try {
            const coverPosition = `${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%`
            const res = await fetch(`/api/galleries/${gallery.id}/cover`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ coverPosition }),
            })
            const json = await res.json()
            if (!res.ok) { setError(json.error || "Error"); return }
            onUpdated({ coverPosition: json.coverPosition })
            setMode(null)
        } catch { setError("Error de red") }
        finally { setSaving(false) }
    }

    // ── Lógica de drag ────────────────────────────────────────────────────────
    const startDrag = useCallback((clientX, clientY) => {
        setDragging(true)
        dragStart.current = { mouseX: clientX, mouseY: clientY, posX: pos.x, posY: pos.y }
    }, [pos])

    const onDrag = useCallback((clientX, clientY) => {
        if (!dragging || !dragStart.current || !previewRef.current) return
        const rect = previewRef.current.getBoundingClientRect()
        const dx = clientX - dragStart.current.mouseX
        const dy = clientY - dragStart.current.mouseY
        // Cuanto más pequeño es el contenedor vs la imagen, más "amplificado" es el movimiento
        const sensitivityX = 100 / rect.width * 1.5
        const sensitivityY = 100 / rect.height * 1.5
        const newX = Math.min(100, Math.max(0, dragStart.current.posX - dx * sensitivityX))
        const newY = Math.min(100, Math.max(0, dragStart.current.posY - dy * sensitivityY))
        setPos({ x: newX, y: newY })
    }, [dragging])

    const stopDrag = useCallback(() => {
        setDragging(false)
        dragStart.current = null
    }, [])

    // Mouse events
    const onMouseDown = (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY) }
    const onMouseMove = useCallback((e) => onDrag(e.clientX, e.clientY), [onDrag])
    const onMouseUp   = useCallback(() => stopDrag(), [stopDrag])

    // Touch events
    const onTouchStart = (e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY) }
    const onTouchMove  = useCallback((e) => { e.preventDefault(); const t = e.touches[0]; onDrag(t.clientX, t.clientY) }, [onDrag])
    const onTouchEnd   = useCallback(() => stopDrag(), [stopDrag])

    useEffect(() => {
        if (!dragging) return
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
        window.addEventListener("touchmove", onTouchMove, { passive: false })
        window.addEventListener("touchend", onTouchEnd)
        return () => {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
            window.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("touchend", onTouchEnd)
        }
    }, [dragging, onMouseMove, onMouseUp, onTouchMove, onTouchEnd])

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">

            {/* ── Vista previa / Editor de posición ── */}
            {mode === "reposition" ? (
                <div className="space-y-2">
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <Move size={12} />
                        Arrastrá la imagen para elegir el área visible
                    </p>

                    {/* Canvas de reposicionamiento */}
                    <div
                        ref={previewRef}
                        className="relative w-full overflow-hidden rounded-xl border border-neutral-200 select-none"
                        style={{
                            height: 180,
                            cursor: dragging ? "grabbing" : "grab",
                            touchAction: "none",
                        }}
                        onMouseDown={onMouseDown}
                        onTouchStart={onTouchStart}
                    >
                        <img
                            src={current}
                            alt="Portada"
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: `${pos.x}% ${pos.y}%`,
                                pointerEvents: "none",
                                userSelect: "none",
                                transition: dragging ? "none" : "object-position 0.1s ease",
                            }}
                        />
                        {/* Crosshair central sutil */}
                        <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            pointerEvents: "none",
                        }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: "50%",
                                border: "2px solid rgba(255,255,255,0.8)",
                                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                                background: "rgba(255,255,255,0.15)",
                            }} />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={handleSavePosition}
                            disabled={saving}
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Guardar posición
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMode(null)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            ) : (
                /* Vista previa normal */
                <div
                    className="relative w-full bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200"
                    style={{ height: 160 }}
                >
                    {current ? (
                        <>
                            <img
                                src={current}
                                alt="Portada"
                                style={{
                                    width: "100%", height: "100%",
                                    objectFit: "cover",
                                    objectPosition: savedPos,
                                    display: "block",
                                }}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                            <button
                                onClick={handleRemove}
                                disabled={saving}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors disabled:opacity-50"
                                title="Quitar portada"
                            >
                                <Trash2 size={13} />
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 gap-2">
                            <ImagePlus size={28} />
                            <p className="text-xs">Sin portada</p>
                        </div>
                    )}
                    {saving && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 size={22} className="animate-spin text-neutral-500" />
                        </div>
                    )}
                </div>
            )}

            {/* ── Botones de acción principales ── */}
            {!mode && (
                <div className="flex gap-2 flex-wrap">
                    {gallery.photos?.length > 0 && (
                        <Button variant="outline" size="sm" className="flex-1 gap-2"
                            onClick={() => setMode("pick")} disabled={saving}>
                            <Star size={13} />
                            Usar foto de la galería
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1 gap-2"
                        onClick={() => fileRef.current?.click()} disabled={saving}>
                        <Upload size={13} />
                        Subir imagen
                    </Button>
                    {current && (
                        <Button variant="outline" size="sm" className="gap-2"
                            onClick={() => setMode("reposition")} disabled={saving}
                            title="Mover y recortar la portada">
                            <Move size={13} />
                            Ajustar encuadre
                        </Button>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files?.[0])}
                    />
                </div>
            )}

            {/* ── Grid para seleccionar foto existente ── */}
            {mode === "pick" && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-neutral-600">Elegí la foto de portada:</p>
                        <button onClick={() => setMode(null)} className="text-neutral-400 hover:text-neutral-700">
                            <X size={15} />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {gallery.photos.map((photo) => {
                            const isCurrent = current === photo.bunnyUrl
                            return (
                                <button
                                    key={photo.id}
                                    onClick={() => handlePickPhoto(photo)}
                                    disabled={saving}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                        isCurrent
                                            ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
                                            : "border-transparent hover:border-neutral-400"
                                    }`}
                                >
                                    <img
                                        src={photo.bunnyUrl}
                                        alt={photo.title || "Foto"}
                                        className="w-full h-full object-cover"
                                    />
                                    {isCurrent && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <Check size={16} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    )
}