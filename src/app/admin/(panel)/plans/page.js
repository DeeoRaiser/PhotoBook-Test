"use client"

import { useEffect, useState } from "react"
import {
    Package, Plus, Loader2, Check, Pencil,
    Trash2, X, ToggleLeft, ToggleRight, Users,
    AlertCircle, Save, CreditCard, UserCircle, Printer, Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ─── PlanForm ─────────────────────────────────────────────────────────────────
function PlanForm({ initial = null, onSave, onCancel, saving }) {
    const [name, setName] = useState(initial?.name || "")
    const [price, setPrice] = useState(initial?.price ? String(initial.price) : "")
    const [durationDays, setDurationDays] = useState(initial?.durationDays ? String(initial.durationDays) : "30")
    const [maxGalleries, setMaxGalleries] = useState(initial?.maxGalleries !== undefined ? String(initial.maxGalleries) : "-1")
    const [maxPhotos, setMaxPhotos] = useState(initial?.maxPhotos !== undefined ? String(initial.maxPhotos) : "-1")
    const [allowsMercadoPago, setAllowsMercadoPago] = useState(initial?.allowsMercadoPago ?? false)
    const [allowsPortfolio, setAllowsPortfolio] = useState(initial?.allowsPortfolio ?? false)
    const [allowsEventGalleries, setAllowsEventGalleries] = useState(initial?.allowsEventGalleries ?? false)
    const [freeEventGalleries, setFreeEventGalleries] = useState(initial?.freeEventGalleries !== undefined ? String(initial.freeEventGalleries) : "0")
    const [extraEventGalleryPrice, setExtraEventGalleryPrice] = useState(initial?.extraEventGalleryPrice !== undefined ? String(initial.extraEventGalleryPrice) : "0")
    const [maxPortfolioPhotos, setMaxPortfolioPhotos] = useState(initial?.maxPortfolioPhotos !== undefined ? String(initial.maxPortfolioPhotos) : "-1")
    const [allowsPrintable, setAllowsPrintable] = useState(initial?.allowsPrintable ?? false)
    const [maxStorageGB, setMaxStorageGB] = useState(initial?.maxStorageGB !== undefined ? String(initial.maxStorageGB) : "-1")
    const [allowsLinktree, setAllowsLinktree]       = useState(initial?.allowsLinktree ?? false)
    const [maxLinktreeLinks, setMaxLinktreeLinks]   = useState(initial?.maxLinktreeLinks !== undefined ? String(initial.maxLinktreeLinks) : "5")

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({
            name, price: Number(price),
            durationDays: Number(durationDays),
            maxGalleries: Number(maxGalleries),
            maxPhotos: Number(maxPhotos),
            allowsMercadoPago,
            allowsPortfolio,
            maxPortfolioPhotos: Number(maxPortfolioPhotos),
            allowsEventGalleries,
            freeEventGalleries: Number(freeEventGalleries),
            extraEventGalleryPrice: Number(extraEventGalleryPrice),
            allowsPrintable,
            maxStorageGB: Number(maxStorageGB),
            allowsLinktree,
            maxLinktreeLinks: Number(maxLinktreeLinks),
        })
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {/* Nombre */}
            <div>
                <Label>Nombre del plan *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Básico, Pro, Ilimitado" required style={{ marginTop: 4 }} />
            </div>

            {/* Grid de campos numéricos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                    <Label>Precio ($) *</Label>
                    <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required style={{ marginTop: 4 }} />
                </div>
                <div>
                    <Label>Duración (días)</Label>
                    <Input type="number" min="1" value={durationDays} onChange={e => setDurationDays(e.target.value)} style={{ marginTop: 4 }} />
                </div>
                <div>
                    <Label>Máx. galerías</Label>
                    <Input type="number" min="-1" value={maxGalleries} onChange={e => setMaxGalleries(e.target.value)} style={{ marginTop: 4 }} />
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>-1 = ilimitado</p>
                </div>
                <div>
                    <Label>Máx. fotos / galería</Label>
                    <Input type="number" min="-1" value={maxPhotos} onChange={e => setMaxPhotos(e.target.value)} style={{ marginTop: 4 }} />
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>-1 = ilimitado</p>
                </div>
                <div>
                    <Label>Almacenamiento (GB)</Label>
                    <Input type="number" min="-1" step="0.1" value={maxStorageGB} onChange={e => setMaxStorageGB(e.target.value)} style={{ marginTop: 4 }} />
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>-1 = ilimitado</p>
                </div>
                <div>
                    <Label>Máx. links Linktree</Label>
                    <Input type="number" min="-1" value={maxLinktreeLinks} onChange={e => setMaxLinktreeLinks(e.target.value)} style={{ marginTop: 4 }} />
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>-1 = ilimitado</p>
                </div>
            </div>

            {/* Toggle Mercado Pago */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: allowsMercadoPago ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${allowsMercadoPago ? "#bfdbfe" : "#e2e8f0"}`,
                borderRadius: 12, padding: "12px 16px",
                transition: "all 0.15s",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: allowsMercadoPago ? "#dbeafe" : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <CreditCard size={15} color={allowsMercadoPago ? "#2563eb" : "#94a3b8"} />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: allowsMercadoPago ? "#1e40af" : "#475569", margin: 0 }}>
                            Mercado Pago
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                            Permite conectar cuenta de MP para cobros online
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setAllowsMercadoPago(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
                >
                    {allowsMercadoPago
                        ? <ToggleRight size={28} color="#2563eb" />
                        : <ToggleLeft size={28} color="#cbd5e1" />
                    }
                </button>
            </div>

            {/* Toggle Portfolio */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: allowsPortfolio ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${allowsPortfolio ? "#bbf7d0" : "#e2e8f0"}`,
                borderRadius: 12, padding: "12px 16px",
                transition: "all 0.15s",
                flexWrap: "wrap", gap: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: allowsPortfolio ? "#dcfce7" : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <UserCircle size={15} color={allowsPortfolio ? "#16a34a" : "#94a3b8"} />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: allowsPortfolio ? "#15803d" : "#475569", margin: 0 }}>
                            Portfolio Público
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                            Perfil LinkedIn-style con galerías y redes
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setAllowsPortfolio(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
                >
                    {allowsPortfolio
                        ? <ToggleRight size={28} color="#16a34a" />
                        : <ToggleLeft size={28} color="#cbd5e1" />
                    }
                </button>
                {allowsPortfolio && (
                    <div style={{ width: "100%", paddingTop: 10, borderTop: "1px solid #bbf7d0" }}>
                        <Label style={{ fontSize: 12, color: "#15803d", marginBottom: 4, display: "block" }}>Máx. fotos de portfolio</Label>
                        <Input type="number" min="-1" value={maxPortfolioPhotos} onChange={e => setMaxPortfolioPhotos(e.target.value)} style={{ maxWidth: 120 }} />
                        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>-1 = ilimitado · 0 = sin acceso</p>
                    </div>
                )}
            </div>

            {/* Toggle Galerías de Evento */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: allowsEventGalleries ? "#fdf4ff" : "#f8fafc",
                border: `1px solid ${allowsEventGalleries ? "#e9d5ff" : "#e2e8f0"}`,
                borderRadius: 12, padding: "12px 16px",
                transition: "all 0.15s",
                flexWrap: "wrap", gap: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: allowsEventGalleries ? "#f3e8ff" : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Users size={15} color={allowsEventGalleries ? "#9333ea" : "#94a3b8"} />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: allowsEventGalleries ? "#7e22ce" : "#475569", margin: 0 }}>
                            Galerías de Evento
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                            Galería con sección de invitados y QR de check-in
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setAllowsEventGalleries(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
                >
                    {allowsEventGalleries
                        ? <ToggleRight size={28} color="#9333ea" />
                        : <ToggleLeft size={28} color="#cbd5e1" />
                    }
                </button>
                {allowsEventGalleries && (
                    <div style={{ width: "100%", paddingTop: 10, borderTop: "1px solid #e9d5ff", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                            <Label style={{ fontSize: 12, color: "#7e22ce", marginBottom: 4, display: "block" }}>
                                Galerías de evento incluidas gratis
                            </Label>
                            <Input
                                type="number" min="0"
                                value={freeEventGalleries}
                                onChange={e => setFreeEventGalleries(e.target.value)}
                                style={{ maxWidth: 120 }}
                            />
                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>0 = ninguna gratis</p>
                        </div>
                        <div>
                            <Label style={{ fontSize: 12, color: "#7e22ce", marginBottom: 4, display: "block" }}>
                                Precio por galería extra ($)
                            </Label>
                            <Input
                                type="number" min="0" step="100"
                                value={extraEventGalleryPrice}
                                onChange={e => setExtraEventGalleryPrice(e.target.value)}
                                style={{ maxWidth: 120 }}
                            />
                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>0 = no permitidas adicionales</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Impresión */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: allowsPrintable ? "#fff7ed" : "#f8fafc",
                border: `1px solid ${allowsPrintable ? "#fed7aa" : "#e2e8f0"}`,
                borderRadius: 12, padding: "12px 16px",
                transition: "all 0.15s",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: allowsPrintable ? "#ffedd5" : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Printer size={15} color={allowsPrintable ? "#ea580c" : "#94a3b8"} />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: allowsPrintable ? "#c2410c" : "#475569", margin: 0 }}>
                            Versión Imprimible
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                            El fotógrafo puede ofrecer fotos para imprimir con precio propio
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setAllowsPrintable(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
                >
                    {allowsPrintable
                        ? <ToggleRight size={28} color="#ea580c" />
                        : <ToggleLeft size={28} color="#cbd5e1" />
                    }
                </button>
            </div>

            {/* Toggle Linktree */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: allowsLinktree ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${allowsLinktree ? "#bbf7d0" : "#e2e8f0"}`,
                borderRadius: 12, padding: "12px 16px",
                transition: "all 0.15s",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: allowsLinktree ? "#dcfce7" : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Link2 size={15} color={allowsLinktree ? "#16a34a" : "#94a3b8"} />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: allowsLinktree ? "#15803d" : "#475569", margin: 0 }}>
                            Linktree
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                            El fotógrafo puede crear su página de links personalizada
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setAllowsLinktree(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
                >
                    {allowsLinktree
                        ? <ToggleRight size={28} color="#16a34a" />
                        : <ToggleLeft  size={28} color="#cbd5e1" />
                    }
                </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
                <Button type="submit" disabled={saving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {initial ? "Guardar cambios" : "Crear plan"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                )}
            </div>
        </form>
    )
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, onUpdated, onDeleted }) {
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState("")

    const handleSave = async (data) => {
        setSaving(true); setError("")
        const res = await fetch(`/api/admin/plans/${plan.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
        if (res.ok) { onUpdated(await res.json()); setEditing(false) }
        else { const j = await res.json(); setError(j.error || "Error al guardar") }
        setSaving(false)
    }

    const handleToggleActive = async () => {
        setSaving(true)
        const res = await fetch(`/api/admin/plans/${plan.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !plan.isActive }),
        })
        if (res.ok) onUpdated(await res.json())
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm(`¿Eliminar el plan "${plan.name}"?`)) return
        setDeleting(true); setError("")
        const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" })
        if (res.ok) onDeleted(plan.id)
        else { const j = await res.json(); setError(j.error || "Error al eliminar") }
        setDeleting(false)
    }

    return (
        <Card style={{ overflow: "hidden", opacity: plan.isActive ? 1 : 0.6, transition: "opacity 0.15s", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <CardContent style={{ padding: 20 }}>
                {editing ? (
                    <>
                        {error && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
                                <AlertCircle size={13} /> {error}
                            </div>
                        )}
                        <PlanForm initial={plan} onSave={handleSave} onCancel={() => { setEditing(false); setError("") }} saving={saving} />
                    </>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{plan.name}</h3>
                                    {!plan.isActive && (
                                        <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#64748b", padding: "2px 7px", borderRadius: 20 }}>Inactivo</span>
                                    )}
                                </div>
                                <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                    ${Number(plan.price).toFixed(2)}
                                    <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>/ {plan.durationDays} días</span>
                                </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <button onClick={handleToggleActive} disabled={saving} title={plan.isActive ? "Desactivar" : "Activar"}
                                    style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: plan.isActive ? "#16a34a" : "#94a3b8" }}>
                                    {plan.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                                <button onClick={() => setEditing(true)} title="Editar"
                                    style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}>
                                    <Pencil size={14} />
                                </button>
                                <button onClick={handleDelete} disabled={deleting} title="Eliminar"
                                    style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}>
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Feature rows */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                            {[
                                { label: "Galerías", value: plan.maxGalleries === -1 ? "Ilimitadas" : plan.maxGalleries },
                                { label: "Fotos / galería", value: plan.maxPhotos === -1 ? "Ilimitadas" : plan.maxPhotos },
                                { label: "Duración", value: `${plan.durationDays} días` },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                    <span style={{ color: "#64748b" }}>{label}</span>
                                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{value}</span>
                                </div>
                            ))}

                            {/* Mercado Pago row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                                    <CreditCard size={12} /> Mercado Pago
                                </span>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700,
                                    color: plan.allowsMercadoPago ? "#059669" : "#94a3b8",
                                    background: plan.allowsMercadoPago ? "#ecfdf5" : "#f8fafc",
                                    border: `1px solid ${plan.allowsMercadoPago ? "#a7f3d0" : "#e2e8f0"}`,
                                    padding: "2px 8px", borderRadius: 20,
                                }}>
                                    {plan.allowsMercadoPago ? <><Check size={9} /> Incluido</> : "No incluido"}
                                </span>
                            </div>

                            {/* Portfolio Público row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 8 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                                    <UserCircle size={12} /> Portfolio Público
                                </span>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700,
                                    color: plan.allowsPortfolio ? "#059669" : "#94a3b8",
                                    background: plan.allowsPortfolio ? "#ecfdf5" : "#f8fafc",
                                    border: `1px solid ${plan.allowsPortfolio ? "#a7f3d0" : "#e2e8f0"}`,
                                    padding: "2px 8px", borderRadius: 20,
                                }}>
                                    {plan.allowsPortfolio ? <><Check size={9} /> Incluido</> : "No incluido"}
                                </span>
                            </div>

                            {/* Fotos de Portfolio row */}
                            {plan.allowsPortfolio && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 8 }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                                        <UserCircle size={12} /> Fotos portfolio
                                    </span>
                                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                        {plan.maxPortfolioPhotos === -1 ? "Ilimitadas" : plan.maxPortfolioPhotos === 0 ? "Sin acceso" : plan.maxPortfolioPhotos}
                                    </span>
                                </div>
                            )}

                            {/* Galerías de Evento row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 8 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                                    <Users size={12} /> Galerías de Evento
                                </span>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700,
                                    color: plan.allowsEventGalleries ? "#7e22ce" : "#94a3b8",
                                    background: plan.allowsEventGalleries ? "#fdf4ff" : "#f8fafc",
                                    border: `1px solid ${plan.allowsEventGalleries ? "#e9d5ff" : "#e2e8f0"}`,
                                    padding: "2px 8px", borderRadius: 20,
                                }}>
                                    {plan.allowsEventGalleries
                                        ? <><Check size={9} /> {plan.freeEventGalleries} gratis{Number(plan.extraEventGalleryPrice) > 0 ? ` + $${Number(plan.extraEventGalleryPrice).toLocaleString("es-AR")} c/u` : ""}</>
                                        : "No incluido"}
                                </span>
                            </div>

                            {/* Impresión row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 8 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                                    <Printer size={12} /> Versión Imprimible
                                </span>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700,
                                    color: plan.allowsPrintable ? "#ea580c" : "#94a3b8",
                                    background: plan.allowsPrintable ? "#fff7ed" : "#f8fafc",
                                    border: `1px solid ${plan.allowsPrintable ? "#fed7aa" : "#e2e8f0"}`,
                                    padding: "2px 8px", borderRadius: 20,
                                }}>
                                    {plan.allowsPrintable ? <><Check size={9} /> Incluido</> : "No incluido"}
                                </span>
                            </div>

                            {/* Almacenamiento row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 8 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                                    💾 Almacenamiento
                                </span>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                    {(plan.maxStorageGB ?? -1) === -1 ? "Ilimitado" : `${plan.maxStorageGB} GB`}
                                </span>
                            </div>

                            {/* Linktree row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 8 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                                    <Link2 size={12} /> Linktree
                                </span>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700,
                                    color: plan.allowsLinktree ? "#15803d" : "#94a3b8",
                                    background: plan.allowsLinktree ? "#f0fdf4" : "#f8fafc",
                                    border: `1px solid ${plan.allowsLinktree ? "#bbf7d0" : "#e2e8f0"}`,
                                    padding: "2px 8px", borderRadius: 20,
                                }}>
                                    {plan.allowsLinktree
                                        ? <><Check size={9} /> {(plan.maxLinktreeLinks ?? 5) === -1 ? "Ilimitado" : `hasta ${plan.maxLinktreeLinks} links`}</>
                                        : "No incluido"}
                                </span>
                            </div>
                        </div>

                        {/* Subscriptions count */}
                        <div style={{ paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8" }}>
                            <Users size={11} />
                            {plan._count?.subscriptions ?? 0} suscripción{plan._count?.subscriptions !== 1 ? "es" : ""}
                        </div>

                        {error && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px", marginTop: 12 }}>
                                <AlertCircle size={13} /> {error}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// ─── PlansPage ────────────────────────────────────────────────────────────────
export default function PlansPage() {
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [savingNew, setSavingNew] = useState(false)
    const [createError, setCreateError] = useState("")
    const [createSuccess, setCreateSuccess] = useState(false)

    useEffect(() => {
        fetch("/api/admin/plans").then(r => r.json()).then(data => { setPlans(data); setLoading(false) })
    }, [])

const handleCreate = async (data) => {
    setSavingNew(true);
    setCreateError("");

    try {
        const res = await fetch("/api/admin/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json?.error || "Error al crear");
        }

        setPlans(prev => [...prev, json]);
        setCreating(false);
        setCreateSuccess(true);

        setTimeout(() => setCreateSuccess(false), 2500);

    } catch (error) {
        setCreateError(error.message || "Error inesperado");
    } finally {
        setSavingNew(false);
    }
};

    const handleUpdated = (updated) => setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
    const handleDeleted = (id) => setPlans(prev => prev.filter(p => p.id !== id))

    const activePlans = plans.filter(p => p.isActive)
    const inactivePlans = plans.filter(p => !p.isActive)

    return (
        <div style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {/* Header */}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.025em", margin: "0 0 4px" }}>Planes</h1>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                        {activePlans.length} activo{activePlans.length !== 1 ? "s" : ""}
                        {inactivePlans.length > 0 && ` · ${inactivePlans.length} inactivo${inactivePlans.length !== 1 ? "s" : ""}`}
                    </p>
                </div>

                {!creating && (
                    <Button onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 11, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "white", boxShadow: "0 4px 12px rgba(59,130,246,0.35)" }}>
                        <Plus size={15} /> Nuevo plan
                    </Button>
                )}
            </div>


            {createSuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: "10px 16px", marginBottom: 20 }}>
                    <Check size={14} /> Plan creado correctamente
                </div>
            )}


            {creating && (
                <Card style={{ marginBottom: 24, border: "2px solid #3b82f6", borderRadius: 16 }}>
                    <CardHeader style={{ paddingBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <CardTitle style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
                                <Plus size={15} /> Nuevo plan
                            </CardTitle>
                            <button onClick={() => { setCreating(false); setCreateError("") }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                <X size={17} />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {createError && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
                                <AlertCircle size={13} /> {createError}
                            </div>
                        )}
                        <PlanForm onSave={handleCreate} onCancel={() => { setCreating(false); setCreateError("") }} saving={savingNew} />
                    </CardContent>
                </Card>
            )}


            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                    <Loader2 size={22} color="#94a3b8" className="animate-spin" />
                </div>
            ) : plans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(255,255,255,0.3)" }}>
                    <Package size={44} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                    <p style={{ fontWeight: 700, margin: "0 0 4px" }}>No hay planes creados</p>
                    <p style={{ fontSize: 12 }}>Creá el primer plan con el botón de arriba</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {activePlans.length > 0 && (
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.07em", marginBottom: 12 }}>ACTIVOS</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                                {activePlans.map(plan => <PlanCard key={plan.id} plan={plan} onUpdated={handleUpdated} onDeleted={handleDeleted} />)}
                            </div>
                        </div>
                    )}

                    {inactivePlans.length > 0 && (
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.07em", marginBottom: 12 }}>INACTIVOS</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                                {inactivePlans.map(plan => <PlanCard key={plan.id} plan={plan} onUpdated={handleUpdated} onDeleted={handleDeleted} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}