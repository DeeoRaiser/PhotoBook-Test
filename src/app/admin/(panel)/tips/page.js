"use client"

import { useEffect, useState } from "react"
import {
    Sparkles, Plus, Loader2, Pencil, Trash2, X,
    Save, Pin, PinOff, ToggleLeft, ToggleRight, GripVertical, Link2, ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ─── TipForm ─────────────────────────────────────────────────────────────────
function TipForm({ initial = null, onSave, onCancel, saving }) {
    const [title, setTitle] = useState(initial?.title || "")
    const [description, setDescription] = useState(initial?.description || "")
    const [buttonLabel, setButtonLabel] = useState(initial?.buttonLabel || "")
    const [buttonUrl, setButtonUrl] = useState(initial?.buttonUrl || "")
    const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false)
    const [isActive, setIsActive] = useState(initial?.isActive ?? true)
    const [order, setOrder] = useState(initial?.order !== undefined ? String(initial.order) : "0")

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({
            title,
            description,
            buttonLabel: buttonLabel.trim() || null,
            buttonUrl: buttonUrl.trim() || null,
            isPinned,
            isActive,
            order: Number(order),
        })
    }

    const Toggle = ({ value, onChange, label }) => (
        <button
            type="button"
            onClick={() => onChange(!value)}
            style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "none", border: "none", cursor: "pointer",
                padding: "6px 0", fontSize: 13, color: value ? "#0f172a" : "#94a3b8",
                fontFamily: "inherit",
            }}
        >
            {value
                ? <ToggleRight size={20} color="#2563eb" />
                : <ToggleLeft size={20} color="#cbd5e1" />
            }
            {label}
        </button>
    )

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Label>Título *</Label>
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej: Activá contraseña en tus galerías privadas"
                    required
                    style={{ marginTop: 4 }}
                />
            </div>

            <div>
                <Label>Descripción *</Label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ej: Protegé el acceso y compartí el link solo con tus clientes."
                    required
                    rows={3}
                    style={{
                        width: "100%", marginTop: 4, padding: "8px 12px",
                        border: "1px solid #e2e8f0", borderRadius: 8,
                        fontSize: 13, fontFamily: "inherit", resize: "vertical",
                        outline: "none", lineHeight: 1.5, color: "#0f172a",
                    }}
                />
            </div>

            {/* Botón opcional */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Botón (opcional)
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                        <Label style={{ fontSize: 12 }}>Texto del botón</Label>
                        <Input
                            value={buttonLabel}
                            onChange={e => setButtonLabel(e.target.value)}
                            placeholder="Ej: Ver galerías"
                            style={{ marginTop: 4 }}
                        />
                    </div>
                    <div>
                        <Label style={{ fontSize: 12 }}>URL de destino</Label>
                        <Input
                            value={buttonUrl}
                            onChange={e => setButtonUrl(e.target.value)}
                            placeholder="Ej: /dashboard/galleries"
                            style={{ marginTop: 4 }}
                        />
                    </div>
                </div>
                {(!buttonLabel && buttonUrl) || (buttonLabel && !buttonUrl) ? (
                    <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>
                        ⚠ Completá ambos campos para mostrar el botón
                    </p>
                ) : null}
            </div>

            {/* Switches */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                    <Toggle
                        value={isPinned}
                        onChange={setIsPinned}
                        label={<span>Fijar tip<br /><span style={{ fontSize: 11, color: "#94a3b8" }}>Siempre visible</span></span>}
                    />
                </div>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                    <Toggle
                        value={isActive}
                        onChange={setIsActive}
                        label={<span>Activo<br /><span style={{ fontSize: 11, color: "#94a3b8" }}>Aparece en rotación</span></span>}
                    />
                </div>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                    <Label style={{ fontSize: 12 }}>Orden</Label>
                    <Input
                        type="number"
                        min="0"
                        value={order}
                        onChange={e => setOrder(e.target.value)}
                        style={{ marginTop: 4, width: "100%" }}
                    />
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                    <X size={14} style={{ marginRight: 4 }} /> Cancelar
                </Button>
                <Button type="submit" disabled={saving} style={{ background: "#0f172a", color: "white" }}>
                    {saving ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 4 }} /> : <Save size={14} style={{ marginRight: 4 }} />}
                    {initial ? "Guardar cambios" : "Crear tip"}
                </Button>
            </div>
        </form>
    )
}

// ─── TipCard ──────────────────────────────────────────────────────────────────
function TipCard({ tip, onEdit, onDelete, onTogglePin, onToggleActive, deleting }) {
    return (
        <div style={{
            background: "white", border: `1px solid ${tip.isPinned ? "#bfdbfe" : "#e2e8f0"}`,
            borderRadius: 14, overflow: "hidden",
            boxShadow: tip.isPinned ? "0 0 0 3px #eff6ff" : "none",
            opacity: tip.isActive ? 1 : 0.55,
        }}>
            {/* Preview strip */}
            <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                padding: "14px 18px",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: -10, right: -10, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                    <Sparkles size={11} color="#fbbf24" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.04em" }}>CONSEJO PRO</span>
                    {tip.isPinned && (
                        <span style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 99, padding: "1px 6px", fontSize: 9, fontWeight: 700, color: "#fbbf24" }}>
                            FIJO
                        </span>
                    )}
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "white", margin: "0 0 4px", lineHeight: 1.3 }}>{tip.title}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.4 }}>{tip.description}</p>
                {tip.buttonLabel && (
                    <div style={{ marginTop: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", background: "white", borderRadius: 6, padding: "4px 10px" }}>
                            {tip.buttonLabel} →
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {/* Pin toggle */}
                <button
                    onClick={() => onTogglePin(tip)}
                    title={tip.isPinned ? "Desanclar" : "Anclar (siempre visible)"}
                    style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: tip.isPinned ? "#eff6ff" : "#f8fafc",
                        border: `1px solid ${tip.isPinned ? "#bfdbfe" : "#e2e8f0"}`,
                        borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                        fontSize: 11, fontWeight: 600, color: tip.isPinned ? "#2563eb" : "#64748b",
                        fontFamily: "inherit",
                    }}
                >
                    {tip.isPinned ? <Pin size={12} /> : <PinOff size={12} />}
                    {tip.isPinned ? "Fijado" : "Fijar"}
                </button>

                {/* Active toggle */}
                <button
                    onClick={() => onToggleActive(tip)}
                    style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: tip.isActive ? "#ecfdf5" : "#f8fafc",
                        border: `1px solid ${tip.isActive ? "#a7f3d0" : "#e2e8f0"}`,
                        borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                        fontSize: 11, fontWeight: 600, color: tip.isActive ? "#059669" : "#94a3b8",
                        fontFamily: "inherit",
                    }}
                >
                    {tip.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                    {tip.isActive ? "Activo" : "Inactivo"}
                </button>

                {tip.buttonUrl && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94a3b8", marginLeft: 2 }}>
                        <Link2 size={10} /> {tip.buttonUrl}
                    </span>
                )}

                <div style={{ flex: 1 }} />

                <button
                    onClick={() => onEdit(tip)}
                    style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", fontFamily: "inherit" }}
                >
                    <Pencil size={11} /> Editar
                </button>
                <button
                    onClick={() => onDelete(tip.id)}
                    disabled={deleting === tip.id}
                    style={{ background: "none", border: "1px solid #fee2e2", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#ef4444", fontFamily: "inherit" }}
                >
                    {deleting === tip.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Eliminar
                </button>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TipsAdminPage() {
    const [tips, setTips] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingTip, setEditingTip] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [error, setError] = useState("")

    const load = async () => {
        setLoading(true)
        const res = await fetch("/api/admin/tips")
        const data = await res.json()
        setTips(data)
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleSave = async (data) => {
        setSaving(true)
        setError("")
        try {
            const isEdit = !!editingTip
            const res = await fetch(
                isEdit ? `/api/admin/tips/${editingTip.id}` : "/api/admin/tips",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            )
            if (!res.ok) {
                const err = await res.json()
                setError(err.error || "Error al guardar")
            } else {
                setShowForm(false)
                setEditingTip(null)
                await load()
            }
        } catch {
            setError("Error de red")
        }
        setSaving(false)
    }

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este tip?")) return
        setDeleting(id)
        await fetch(`/api/admin/tips/${id}`, { method: "DELETE" })
        await load()
        setDeleting(null)
    }

    const handleToggle = async (tip, field) => {
        await fetch(`/api/admin/tips/${tip.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: !tip[field] }),
        })
        await load()
    }

    const pinnedTips = tips.filter(t => t.isPinned)
    const activeTips = tips.filter(t => t.isActive && !t.isPinned)
    const inactiveTips = tips.filter(t => !t.isActive && !t.isPinned)

    return (
        <div style={{ padding: ".5rem", maxWidth: 860, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#fef9c3,#fef08a)", border: "1px solid #fde047", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Sparkles size={18} color="#ca8a04" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Consejos Pro</h1>
                        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Tips que se muestran en el dashboard de los fotógrafos</p>
                    </div>
                </div>
                <Button
                    onClick={() => { setEditingTip(null); setShowForm(true) }}
                    style={{ background: "#0f172a", color: "white", display: "flex", alignItems: "center", gap: 6 }}
                >
                    <Plus size={14} /> Nuevo tip
                </Button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                    { label: "Fijados", value: pinnedTips.length, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                    { label: "Activos", value: activeTips.length, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
                    { label: "Inactivos", value: inactiveTips.length, color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "14px 18px" }}>
                        <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                        <p style={{ fontSize: 12, color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Form */}
            {(showForm || editingTip) && (
                <Card style={{ marginBottom: 24, border: "1px solid #bfdbfe", boxShadow: "0 0 0 3px #eff6ff" }}>
                    <CardHeader style={{ paddingBottom: 8 }}>
                        <CardTitle style={{ fontSize: 15 }}>
                            {editingTip ? "Editar tip" : "Nuevo tip"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>
                                {error}
                            </div>
                        )}
                        <TipForm
                            initial={editingTip}
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingTip(null) }}
                            saving={saving}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Tips list */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: "#94a3b8" }} />
                </div>
            ) : tips.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: 16, border: "1px dashed #e2e8f0" }}>
                    <Sparkles size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", margin: "0 0 4px" }}>Sin tips todavía</p>
                    <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>Creá el primer consejo para los fotógrafos</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {pinnedTips.length > 0 && (
                        <section>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
                                <Pin size={11} /> Fijados — siempre visibles
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {pinnedTips.map(t => (
                                    <TipCard key={t.id} tip={t} onEdit={tip => { setEditingTip(tip); setShowForm(false) }} onDelete={handleDelete} onTogglePin={t => handleToggle(t, "isPinned")} onToggleActive={t => handleToggle(t, "isActive")} deleting={deleting} />
                                ))}
                            </div>
                        </section>
                    )}
                    {activeTips.length > 0 && (
                        <section>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                                Activos — rotación aleatoria
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {activeTips.map(t => (
                                    <TipCard key={t.id} tip={t} onEdit={tip => { setEditingTip(tip); setShowForm(false) }} onDelete={handleDelete} onTogglePin={t => handleToggle(t, "isPinned")} onToggleActive={t => handleToggle(t, "isActive")} deleting={deleting} />
                                ))}
                            </div>
                        </section>
                    )}
                    {inactiveTips.length > 0 && (
                        <section>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                                Inactivos
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {inactiveTips.map(t => (
                                    <TipCard key={t.id} tip={t} onEdit={tip => { setEditingTip(tip); setShowForm(false) }} onDelete={handleDelete} onTogglePin={t => handleToggle(t, "isPinned")} onToggleActive={t => handleToggle(t, "isActive")} deleting={deleting} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
