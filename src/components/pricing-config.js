"use client"

import { useState, useEffect } from "react"
import {
    DollarSign, Plus, Trash2, Save, Loader2,
    Info, CheckCircle2, AlertCircle, Printer, ChevronDown, ChevronUp,
} from "lucide-react"

const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 9,
    border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit",
    outline: "none", background: "white", color: "#1e293b",
    boxSizing: "border-box",
}
const labelStyle = {
    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
    fontSize: 9, fontWeight: 700, color: "#94a3b8",
    letterSpacing: "0.04em", whiteSpace: "nowrap", pointerEvents: "none",
}

function TierRow({ tier, index, onChange, onRemove, isLast }) {
    return (
        <>
            <div className="tier-row-desktop" style={{
                display: "grid", gridTemplateColumns: "24px 1fr auto 140px auto 36px",
                alignItems: "center", gap: 8, padding: "10px 12px",
                background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: 12,
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "center" }}>{index + 1}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <span style={labelStyle}>desde</span>
                        <input type="number" min="1" value={tier.minQty}
                            onChange={(e) => onChange(index, "minQty", Number(e.target.value))}
                            style={inputStyle} />
                    </div>
                    <span style={{ fontSize: 12, color: "#cbd5e1", flexShrink: 0 }}>—</span>
                    <div style={{ flex: 1, position: "relative" }}>
                        <span style={labelStyle}>{isLast && !tier.maxQty ? "\u221e" : "hasta"}</span>
                        <input type="number" min={tier.minQty} value={tier.maxQty ?? ""}
                            onChange={(e) => onChange(index, "maxQty", e.target.value === "" ? null : Number(e.target.value))}
                            placeholder={isLast ? "\u221e" : ""}
                            style={inputStyle} />
                    </div>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>fotos</span>
                <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8", pointerEvents: "none" }}>$</span>
                    <input type="number" min="0" step="100" value={tier.price}
                        onChange={(e) => onChange(index, "price", Number(e.target.value))}
                        style={{ ...inputStyle, paddingLeft: 22, width: "100%" }} />
                    <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#cbd5e1", pointerEvents: "none" }}>/foto</span>
                </div>
                <div style={{ textAlign: "right", minWidth: 0 }}>
                    {tier.price > 0 && tier.minQty > 0 && (
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>
                            ej: ${(Number(tier.price) * (tier.maxQty ?? tier.minQty)).toLocaleString("es-AR")}
                        </span>
                    )}
                </div>
                <button onClick={() => onRemove(index)} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 9,
                    background: "#fff1f2", border: "1px solid #fecdd3", cursor: "pointer",
                }}>
                    <Trash2 size={13} color="#f43f5e" />
                </button>
            </div>
            <div className="tier-row-mobile" style={{
                flexDirection: "column", gap: 8, padding: "12px",
                background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: 12,
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Rango {index + 1}</span>
                    <button onClick={() => onRemove(index)} style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: 8,
                        background: "#fff1f2", border: "1px solid #fecdd3", cursor: "pointer",
                    }}><Trash2 size={12} color="#f43f5e" /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ position: "relative" }}>
                        <span style={labelStyle}>desde (fotos)</span>
                        <input type="number" min="1" value={tier.minQty}
                            onChange={(e) => onChange(index, "minQty", Number(e.target.value))} style={inputStyle} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={labelStyle}>{isLast && !tier.maxQty ? "\u221e fotos" : "hasta (fotos)"}</span>
                        <input type="number" min={tier.minQty} value={tier.maxQty ?? ""}
                            onChange={(e) => onChange(index, "maxQty", e.target.value === "" ? null : Number(e.target.value))}
                            placeholder={isLast ? "\u221e" : ""} style={inputStyle} />
                    </div>
                </div>
                <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8", pointerEvents: "none" }}>$</span>
                    <input type="number" min="0" step="100" value={tier.price}
                        onChange={(e) => onChange(index, "price", Number(e.target.value))}
                        style={{ ...inputStyle, paddingLeft: 22 }} />
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#cbd5e1", pointerEvents: "none" }}>/foto</span>
                </div>
            </div>
        </>
    )
}

function PrintSizeTierRow({ tier, index, onChange, onRemove, isLast }) {
    return (
        <div style={{
            display: "grid", gridTemplateColumns: "1fr auto 100px 28px",
            alignItems: "center", gap: 6, padding: "7px 10px",
            background: "#fffbf5", border: "1px solid #fed7aa", borderRadius: 8,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ ...labelStyle, color: "#fb923c" }}>desde</span>
                    <input type="number" min="1" value={tier.minQty}
                        onChange={(e) => onChange(index, "minQty", Number(e.target.value))}
                        style={{ ...inputStyle, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 11, color: "#fdba74", flexShrink: 0 }}>—</span>
                <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ ...labelStyle, color: "#fb923c" }}>{isLast && !tier.maxQty ? "\u221e" : "hasta"}</span>
                    <input type="number" min={tier.minQty} value={tier.maxQty ?? ""}
                        onChange={(e) => onChange(index, "maxQty", e.target.value === "" ? null : Number(e.target.value))}
                        placeholder={isLast ? "\u221e" : ""}
                        style={{ ...inputStyle, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 10, color: "#fb923c", whiteSpace: "nowrap", flexShrink: 0 }}>copias</span>
            </div>
            <span style={{ fontSize: 10, color: "#fb923c" }}>=</span>
            <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#fb923c", pointerEvents: "none" }}>$</span>
                <input type="number" min="0" step="100" value={tier.price}
                    onChange={(e) => onChange(index, "price", Number(e.target.value))}
                    style={{ ...inputStyle, paddingLeft: 20, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12 }} />
            </div>
            <button onClick={() => onRemove(index)} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 26, height: 26, borderRadius: 7,
                background: "#fff1f2", border: "1px solid #fecdd3", cursor: "pointer",
            }}><Trash2 size={11} color="#f43f5e" /></button>
        </div>
    )
}

function PrintSizeCard({ ps, psIndex, onChange, onRemove }) {
    const [expanded, setExpanded] = useState(true)

    const handleTierChange = (tIdx, field, val) => {
        const newTiers = ps.tiers.map((t, i) => i === tIdx ? { ...t, [field]: val } : t)
        onChange(psIndex, { ...ps, tiers: newTiers })
    }
    const handleTierRemove = (tIdx) =>
        onChange(psIndex, { ...ps, tiers: ps.tiers.filter((_, i) => i !== tIdx) })
    const handleAddTier = () => {
        const last = ps.tiers[ps.tiers.length - 1]
        const newMin = last ? (last.maxQty ? last.maxQty + 1 : last.minQty + 4) : 1
        onChange(psIndex, { ...ps, tiers: [...ps.tiers, { minQty: newMin, maxQty: null, price: 0 }] })
    }

    return (
        <div style={{ border: "1px solid #fed7aa", borderRadius: 14, overflow: "hidden", background: "white" }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: "#fff7ed", borderBottom: expanded ? "1px solid #fed7aa" : "none",
            }}>
                <Printer size={14} color="#ea580c" style={{ flexShrink: 0 }} />
                <input type="text" value={ps.label}
                    onChange={(e) => onChange(psIndex, { ...ps, label: e.target.value })}
                    placeholder="ej: 10x15, 20x30, A4..."
                    style={{
                        flex: 1, padding: "5px 8px", borderRadius: 7,
                        border: "1px solid #fed7aa", fontSize: 13, fontWeight: 600,
                        background: "white", color: "#c2410c", fontFamily: "inherit", outline: "none",
                    }} />
                <button onClick={() => setExpanded(!expanded)} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 7,
                    background: "white", border: "1px solid #fed7aa", cursor: "pointer",
                }}>
                    {expanded ? <ChevronUp size={13} color="#ea580c" /> : <ChevronDown size={13} color="#ea580c" />}
                </button>
                <button onClick={() => onRemove(psIndex)} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 7,
                    background: "#fff1f2", border: "1px solid #fecdd3", cursor: "pointer",
                }}><Trash2 size={12} color="#f43f5e" /></button>
            </div>
            {expanded && (
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.04em" }}>
                        PRECIO POR CANTIDAD DE COPIAS
                    </p>
                    {ps.tiers.map((t, tIdx) => (
                        <PrintSizeTierRow key={tIdx} tier={t} index={tIdx}
                            onChange={handleTierChange} onRemove={handleTierRemove}
                            isLast={tIdx === ps.tiers.length - 1} />
                    ))}
                    <button onClick={handleAddTier} style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        padding: "6px 0", borderRadius: 8, width: "100%",
                        border: "1px dashed #fed7aa", background: "#fffbf5",
                        color: "#fb923c", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                    }}><Plus size={12} /> Agregar rango</button>
                </div>
            )}
        </div>
    )
}

export default function PricingConfig({
    galleryId, initialMode, initialTiers, initialDefaultPrice,
    initialPrintSizes, printableEnabled, onSaved,
}) {
    const [mode, setMode] = useState(initialMode || "per_photo")
    const [tiers, setTiers] = useState(
        initialTiers?.length
            ? initialTiers.map((t) => ({
                  ...t, minQty: Number(t.minQty),
                  maxQty: t.maxQty != null ? Number(t.maxQty) : null, price: Number(t.price),
              }))
            : []
    )
    const [defaultPrice, setDefaultPrice] = useState(initialDefaultPrice ?? "")
    const [printSizes, setPrintSizes] = useState(
        initialPrintSizes?.length
            ? initialPrintSizes.map((ps) => ({
                  ...ps,
                  tiers: (ps.tiers || []).map((t) => ({
                      ...t, minQty: Number(t.minQty),
                      maxQty: t.maxQty != null ? Number(t.maxQty) : null, price: Number(t.price),
                  })),
              }))
            : []
    )
    const [saving, setSaving] = useState(false)
    const [saved, setSaved]   = useState(false)
    const [error, setError]   = useState("")

    useEffect(() => {
        if (mode === "tiered" && tiers.length === 0) {
            setTiers([
                { minQty: 1,  maxQty: 1,    price: 1500 },
                { minQty: 2,  maxQty: 4,    price: 1300 },
                { minQty: 5,  maxQty: 10,   price: 1200 },
                { minQty: 11, maxQty: null,  price: 1100 },
            ])
        }
    }, [mode])

    const handleTierChange = (i, field, val) =>
        setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
    const handleAddTier = () => {
        const last = tiers[tiers.length - 1]
        const newMin = last ? (last.maxQty ? last.maxQty + 1 : last.minQty + 3) : 1
        setTiers((prev) => [...prev, { minQty: newMin, maxQty: null, price: 0 }])
    }
    const handleRemoveTier = (i) => setTiers((prev) => prev.filter((_, idx) => idx !== i))

    const handlePrintSizeChange = (i, updated) =>
        setPrintSizes((prev) => prev.map((ps, idx) => idx === i ? updated : ps))
    const handlePrintSizeRemove = (i) =>
        setPrintSizes((prev) => prev.filter((_, idx) => idx !== i))
    const handleAddPrintSize = () =>
        setPrintSizes((prev) => [...prev, { label: "", tiers: [{ minQty: 1, maxQty: null, price: 0 }] }])

    const handleSave = async () => {
        setSaving(true); setError(""); setSaved(false)
        try {
            const body = {
                pricingMode: mode,
                tiers: mode === "tiered" ? tiers : [],
                defaultPrice: mode === "per_photo" && defaultPrice !== "" ? Number(defaultPrice) : undefined,
                printSizes: printableEnabled ? printSizes : [],
            }
            const res  = await fetch(`/api/galleries/${galleryId}/pricing`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const json = await res.json()
            if (!res.ok) { setError(json.error || "Error al guardar"); return }
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
            onSaved?.()
        } catch { setError("Error de red") }
        finally { setSaving(false) }
    }

    return (
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                    { value: "per_photo", icon: <DollarSign size={17} />, label: "Precio por foto", sub: "Cada foto tiene su precio" },
                    { value: "tiered", icon: <span style={{ fontSize: 18, lineHeight: 1 }}>⊞</span>, label: "Precio por paquete", sub: "Rangos según cantidad" },
                ].map(({ value, icon, label, sub }) => {
                    const active = mode === value
                    return (
                        <button key={value} onClick={() => setMode(value)} style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                            padding: "14px 10px", borderRadius: 14,
                            border: `2px solid ${active ? "#1a1a2e" : "#e2e8f0"}`,
                            background: active ? "linear-gradient(135deg,#1a1a2e,#1e3a5f)" : "white",
                            color: active ? "white" : "#64748b",
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}>
                            {icon}
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
                            <span style={{ fontSize: 10, opacity: 0.7 }}>{sub}</span>
                        </button>
                    )
                })}
            </div>

            {mode === "tiered" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="tier-headers-desktop" style={{
                        display: "grid", gridTemplateColumns: "24px 1fr auto 140px auto 36px",
                        gap: 8, padding: "0 12px",
                    }}>
                        {["#", "Rango de fotos", "", "Precio digital", "", ""].map((h, i) => (
                            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>{h}</span>
                        ))}
                    </div>
                    {tiers.map((tier, i) => (
                        <TierRow key={i} tier={tier} index={i}
                            onChange={handleTierChange} onRemove={handleRemoveTier}
                            isLast={i === tiers.length - 1} />
                    ))}
                    <button onClick={handleAddTier} style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "9px 0", borderRadius: 10, width: "100%",
                        border: "1px dashed #cbd5e1", background: "#f8fafc",
                        color: "#64748b", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                    }}><Plus size={14} /> Agregar rango</button>
                </div>
            )}

            {mode === "per_photo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{
                        display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px",
                        background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10,
                    }}>
                        <Info size={14} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 12, color: "#0369a1", lineHeight: 1.4 }}>
                            Podés aplicar un precio base a todas las fotos, o editarlo individualmente desde cada foto.
                        </p>
                    </div>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8", pointerEvents: "none" }}>$</span>
                        <input type="number" min="0" step="100" value={defaultPrice}
                            onChange={(e) => setDefaultPrice(e.target.value)}
                            placeholder="Precio base para todas las fotos"
                            style={{ ...inputStyle, paddingLeft: 26, fontSize: 14 }} />
                    </div>
                </div>
            )}

            {printableEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        paddingBottom: 8, borderBottom: "1px solid #f1f5f9",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <Printer size={15} color="#ea580c" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Tamaños de impresión</span>
                        </div>
                        <button onClick={handleAddPrintSize} style={{
                            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                            borderRadius: 8, border: "1px solid #fed7aa", background: "#fff7ed",
                            color: "#ea580c", fontSize: 12, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                        }}><Plus size={12} /> Agregar tamaño</button>
                    </div>

                    {printSizes.length === 0 && (
                        <div style={{
                            padding: "20px 16px", textAlign: "center",
                            border: "1px dashed #fed7aa", borderRadius: 12, background: "#fffbf5",
                        }}>
                            <Printer size={22} color="#fdba74" style={{ margin: "0 auto 8px", display: "block" }} />
                            <p style={{ margin: 0, fontSize: 13, color: "#fb923c", fontWeight: 600 }}>No hay tamaños definidos</p>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#fdba74" }}>
                                Agregá tamaños (ej: 10x15, 20x30) con sus precios por cantidad de copias
                            </p>
                        </div>
                    )}

                    {printSizes.map((ps, i) => (
                        <PrintSizeCard key={i} ps={ps} psIndex={i}
                            onChange={handlePrintSizeChange} onRemove={handlePrintSizeRemove} />
                    ))}
                </div>
            )}

            {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10 }}>
                    <AlertCircle size={14} color="#f43f5e" />
                    <p style={{ margin: 0, fontSize: 13, color: "#e11d48" }}>{error}</p>
                </div>
            )}
            {saved && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                    <CheckCircle2 size={14} color="#22c55e" />
                    <p style={{ margin: 0, fontSize: 13, color: "#16a34a" }}>Configuración guardada correctamente</p>
                </div>
            )}

            <button onClick={handleSave} disabled={saving} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 0", borderRadius: 12, width: "100%",
                border: "none", background: saving ? "#94a3b8" : "linear-gradient(135deg,#1a1a2e,#1e3a5f)",
                color: "white", fontSize: 14, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}>
                {saving
                    ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                    : <><Save size={14} /> Guardar configuración</>
                }
            </button>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 519px) { .tier-row-desktop { display: none !important; } .tier-row-mobile { display: flex !important; } .tier-headers-desktop { display: none !important; } } .tier-row-mobile { display: none; }`}</style>
        </div>
    )
}
