"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Send, Users, Filter, Mail, CheckCircle2,
    AlertCircle, Loader2, ChevronDown, Eye,
    Calendar, CreditCard, XCircle, RefreshCw,
} from "lucide-react"

// ─── helpers ────────────────────────────────────────────────────────────────

function Badge({ children, color = "slate" }) {
    const colors = {
        slate:  { bg: "#f1f5f9", text: "#475569" },
        blue:   { bg: "#eff6ff", text: "#2563eb" },
        green:  { bg: "#f0fdf4", text: "#16a34a" },
        red:    { bg: "#fef2f2", text: "#dc2626" },
        amber:  { bg: "#fffbeb", text: "#d97706" },
    }
    const c = colors[color] || colors.slate
    return (
        <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "2px 10px", borderRadius: 20,
            fontSize: 11, fontWeight: 700,
            background: c.bg, color: c.text,
        }}>
            {children}
        </span>
    )
}

function Card({ children, style = {} }) {
    return (
        <div style={{
            background: "white", borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            ...style,
        }}>
            {children}
        </div>
    )
}

function SectionTitle({ icon: Icon, children }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Icon size={13} color="white" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{children}</span>
        </div>
    )
}

const PLAN_STATUS_OPTIONS = [
    { value: "",         label: "Todos los usuarios" },
    { value: "active",   label: "Con plan activo" },
    { value: "inactive", label: "Plan vencido / inactivo" },
    { value: "no_plan",  label: "Sin plan (nunca tuvieron)" },
    { value: "specific", label: "Plan específico…" },
]

// ─── HTML Editor con preview ──────────────────────────────────────────────────

function RichEditor({ onChange }) {
    const [html, setHtml] = useState("")
    const [tab, setTab] = useState("code") // "code" | "preview"

    const handleChange = (val) => {
        setHtml(val)
        onChange(val)
    }

    const previewDoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  body { margin: 0; padding: 14px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         font-size: 14px; color: #374151; line-height: 1.75; }
  a { color: #3b82f6; } img { max-width: 100%; } hr { border:none; border-top:1px solid #e2e8f0; margin:16px 0; }
  ul, ol { padding-left: 20px; } p { margin: 0 0 12px; }
</style></head><body>${html}</body></html>`

    return (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            {/* Tabs */}
            <div style={{ display: "flex", background: "white", borderBottom: "1px solid #e2e8f0" }}>
                {[["code", "✏️ HTML"], ["preview", "👁 Preview"]].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setTab(key)} style={{
                        padding: "8px 18px", border: "none", cursor: "pointer", fontFamily: "inherit",
                        fontSize: 12, fontWeight: 700,
                        background: tab === key ? "#0f172a" : "transparent",
                        color: tab === key ? "white" : "#64748b",
                        borderRadius: key === "code" ? "10px 0 0 0" : "0 10px 0 0",
                    }}>{label}</button>
                ))}
                <div style={{ flex: 1, display: "flex", alignItems: "center", paddingRight: 12, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Escribí HTML válido</span>
                </div>
            </div>

            {/* Code */}
            {tab === "code" && (
                <textarea
                    value={html}
                    onChange={e => handleChange(e.target.value)}
                    placeholder={"<p>Hola, escribí tu mensaje en HTML aquí.</p>\n<p>Podés usar <strong>negrita</strong>, <a href=\"https://...\">links</a>, etc.</p>"}
                    spellCheck={false}
                    style={{
                        width: "100%", minHeight: 240, padding: "14px 16px",
                        fontSize: 12, color: "#0f172a", lineHeight: 1.7,
                        border: "none", outline: "none", resize: "vertical",
                        fontFamily: "'Fira Code', 'Courier New', monospace",
                        background: "#f8fafc", boxSizing: "border-box",
                    }}
                />
            )}

            {/* Preview */}
            {tab === "preview" && (
                html.trim() ? (
                    <iframe
                        sandbox="allow-same-origin"
                        srcDoc={previewDoc}
                        style={{ width: "100%", minHeight: 240, border: "none", background: "white" }}
                        onLoad={e => {
                            try {
                                const h = e.target.contentDocument?.body?.scrollHeight
                                if (h) e.target.style.height = Math.max(240, h + 24) + "px"
                            } catch {}
                        }}
                    />
                ) : (
                    <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
                        <p style={{ color: "#94a3b8", fontSize: 13 }}>Escribí HTML en la pestaña ✏️ para ver el preview</p>
                    </div>
                )
            )}
        </div>
    )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
    const [plans, setPlans] = useState([])

    // Criteria
    const [registeredFrom, setRegisteredFrom] = useState("")
    const [registeredTo, setRegisteredTo]     = useState("")
    const [planStatus, setPlanStatus]         = useState("")
    const [planId, setPlanId]                 = useState("")

    // Message
    const [subject, setSubject] = useState("")
    const [body, setBody]       = useState("")   // HTML content

    // UI state
    const [preview, setPreview]     = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [sending, setSending]     = useState(false)
    const [result, setResult]       = useState(null)
    const [previewDirty, setPreviewDirty] = useState(true)

    useEffect(() => {
        fetch("/api/admin/plans")
            .then(r => r.ok ? r.json() : [])
            .then(setPlans)
            .catch(() => {})
    }, [])

    useEffect(() => {
        setPreviewDirty(true)
        setPreview(null)
    }, [registeredFrom, registeredTo, planStatus, planId])

    const buildParams = useCallback(() => {
        const p = new URLSearchParams()
        if (registeredFrom) p.set("registeredFrom", registeredFrom)
        if (registeredTo)   p.set("registeredTo", registeredTo)
        if (planStatus)     p.set("planStatus", planStatus)
        if (planStatus === "specific" && planId) p.set("planId", planId)
        return p.toString()
    }, [registeredFrom, registeredTo, planStatus, planId])

    const handlePreview = useCallback(async () => {
        setPreviewLoading(true)
        setPreview(null)
        try {
            const res = await fetch(`/api/admin/messages?${buildParams()}`)
            const data = await res.json()
            setPreview(data)
            setPreviewDirty(false)
        } catch {
            setPreview({ error: "No se pudo cargar la previsualización" })
        } finally {
            setPreviewLoading(false)
        }
    }, [buildParams])

    const handleSend = useCallback(async () => {
        const plainText = body.replace(/<[^>]+>/g, "").trim()
        if (!subject.trim() || !plainText) return
        if (!preview || preview.count === 0) return

        setSending(true)
        setResult(null)
        try {
            const res = await fetch("/api/admin/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    body,       // HTML
                    isHtml: true,
                    criteria: {
                        registeredFrom: registeredFrom || null,
                        registeredTo:   registeredTo   || null,
                        planStatus:     planStatus     || null,
                        planId:         planStatus === "specific" ? planId : null,
                    },
                }),
            })
            const data = await res.json()
            setResult(data)
        } catch {
            setResult({ error: "Error de conexión al enviar" })
        } finally {
            setSending(false)
        }
    }, [subject, body, registeredFrom, registeredTo, planStatus, planId, preview])

    const bodyHasContent = body.replace(/<[^>]+>/g, "").trim().length > 0
    const canSend = subject.trim() && bodyHasContent && preview?.count > 0 && !previewDirty

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            padding: "32px 28px",
            fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif",
        }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 14px rgba(15,23,42,0.25)",
                    }}>
                        <Mail size={18} color="white" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                            Mensajes masivos
                        </h1>
                        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                            Enviá emails a segmentos de usuarios
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

                {/* LEFT */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Criteria card */}
                    <Card style={{ padding: 24 }}>
                        <SectionTitle icon={Filter}>Criterios de segmentación</SectionTitle>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                                <label style={labelStyle}><Calendar size={11} style={{ marginRight: 4 }} />Registro desde</label>
                                <input type="date" value={registeredFrom} onChange={e => setRegisteredFrom(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}><Calendar size={11} style={{ marginRight: 4 }} />Registro hasta</label>
                                <input type="date" value={registeredTo} onChange={e => setRegisteredTo(e.target.value)} style={inputStyle} />
                            </div>

                            <div style={{ gridColumn: planStatus === "specific" ? "1" : "1 / -1" }}>
                                <label style={labelStyle}><CreditCard size={11} style={{ marginRight: 4 }} />Estado del plan</label>
                                <div style={{ position: "relative" }}>
                                    <select value={planStatus} onChange={e => { setPlanStatus(e.target.value); setPlanId("") }} style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}>
                                        {PLAN_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                </div>
                            </div>

                            {planStatus === "specific" && (
                                <div>
                                    <label style={labelStyle}>Plan</label>
                                    <div style={{ position: "relative" }}>
                                        <select value={planId} onChange={e => setPlanId(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}>
                                            <option value="">Seleccionar plan…</option>
                                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                            <button onClick={handlePreview} disabled={previewLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: previewDirty ? "#0f172a" : "#f1f5f9", color: previewDirty ? "white" : "#475569", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.15s" }}>
                                {previewLoading ? <><Loader2 size={13} className="animate-spin" /> Calculando…</> : <><Eye size={13} /> Ver destinatarios</>}
                            </button>
                            {preview && !previewDirty && (
                                <span style={{ fontSize: 12, color: "#64748b" }}>
                                    {preview.count === 0 ? "Ningún usuario coincide" : <><strong style={{ color: "#0f172a" }}>{preview.count}</strong> usuario{preview.count !== 1 ? "s" : ""} recibirán el mensaje</>}
                                </span>
                            )}
                            {previewDirty && preview !== null && (
                                <span style={{ fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                                    <RefreshCw size={11} /> Criterios modificados — actualizá la previsualización
                                </span>
                            )}
                        </div>
                    </Card>

                    {/* Message card */}
                    <Card style={{ padding: 24 }}>
                        <SectionTitle icon={Mail}>Redactar mensaje</SectionTitle>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={labelStyle}>Asunto del email</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Novedad importante para tu cuenta"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Cuerpo del mensaje</label>
                                <RichEditor
                                    onChange={setBody}
                                    placeholder={"Escribí el mensaje aquí…\n\nUsá la barra de herramientas para dar formato.\nCada usuario verá su nombre al inicio."}
                                />
                                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
                                    El saludo con el nombre del usuario se agrega automáticamente al inicio del email.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={!canSend || sending}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "14px 24px", borderRadius: 12,
                            background: canSend && !sending ? "linear-gradient(135deg, #1a1a2e, #1e3a5f)" : "#e2e8f0",
                            color: canSend && !sending ? "white" : "#94a3b8",
                            border: "none",
                            cursor: canSend && !sending ? "pointer" : "not-allowed",
                            fontSize: 14, fontWeight: 800,
                            boxShadow: canSend && !sending ? "0 4px 14px rgba(15,23,42,0.3)" : "none",
                            transition: "all 0.2s", letterSpacing: "-0.2px",
                        }}
                    >
                        {sending
                            ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
                            : <><Send size={15} /> Enviar mensaje{preview?.count > 0 && !previewDirty ? ` a ${preview.count} usuario${preview.count !== 1 ? "s" : ""}` : ""}</>
                        }
                    </button>

                    {/* Result */}
                    {result && (
                        <Card style={{ padding: 20 }}>
                            {result.error ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#dc2626" }}>
                                    <AlertCircle size={18} />
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{result.error}</span>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                        <CheckCircle2 size={20} color="#16a34a" />
                                        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Envío completado</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <div style={statPill("#f0fdf4", "#16a34a")}>✓ {result.sent} enviados</div>
                                        {result.failed > 0 && <div style={statPill("#fef2f2", "#dc2626")}>✗ {result.failed} fallidos</div>}
                                        <div style={statPill("#f8fafc", "#64748b")}>{result.total} total</div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                {/* RIGHT — Preview panel */}
                <div style={{ position: "sticky", top: 24 }}>
                    <Card style={{ padding: 20 }}>
                        <SectionTitle icon={Users}>Previsualización</SectionTitle>

                        {!preview && !previewLoading && (
                            <div style={{ textAlign: "center", padding: "32px 16px" }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f1f5f9", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Users size={20} color="#94a3b8" />
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                                    Configurá los criterios y presioná <strong style={{ color: "#475569" }}>Ver destinatarios</strong> para ver quiénes recibirán el mensaje.
                                </p>
                            </div>
                        )}

                        {previewLoading && (
                            <div style={{ textAlign: "center", padding: "32px 16px" }}>
                                <Loader2 size={24} color="#94a3b8" className="animate-spin" style={{ margin: "0 auto 8px" }} />
                                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Calculando…</p>
                            </div>
                        )}

                        {preview && !previewLoading && (
                            <div>
                                {preview.error ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", fontSize: 12 }}>
                                        <XCircle size={14} /> {preview.error}
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, marginBottom: 14, background: preview.count > 0 ? "#f0fdf4" : "#fef2f2" }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: preview.count > 0 ? "#15803d" : "#dc2626" }}>
                                                {preview.count > 0 ? `${preview.count} destinatario${preview.count !== 1 ? "s" : ""}` : "Sin coincidencias"}
                                            </span>
                                            <Badge color={preview.count > 0 ? "green" : "red"}>{preview.count > 0 ? "✓ OK" : "0"}</Badge>
                                        </div>

                                        {preview.preview?.length > 0 && (
                                            <>
                                                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Muestra (5 primeros)</p>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                    {preview.preview.map((p, i) => (
                                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                                            <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 800 }}>
                                                                {p.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?"}
                                                            </div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                                                                <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.email}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {preview.count > 5 && (
                                                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>y {preview.count - 5} más…</p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </Card>

                    <Card style={{ padding: 16, marginTop: 12 }}>
                        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Criterios activos</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {!registeredFrom && !registeredTo && !planStatus ? (
                                <Badge color="slate">Sin filtros — todos los usuarios</Badge>
                            ) : (
                                <>
                                    {registeredFrom && <Badge color="blue">Desde {registeredFrom}</Badge>}
                                    {registeredTo && <Badge color="blue">Hasta {registeredTo}</Badge>}
                                    {planStatus && (
                                        <Badge color={planStatus === "active" ? "green" : planStatus === "inactive" ? "amber" : planStatus === "no_plan" ? "red" : "blue"}>
                                            {PLAN_STATUS_OPTIONS.find(o => o.value === planStatus)?.label}
                                            {planStatus === "specific" && planId && `: ${plans.find(p => p.id === planId)?.name || ""}`}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
                [contenteditable]:empty:before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }
                [contenteditable] a { color: #3b82f6; }
                [contenteditable] ul { padding-left: 20px; }
                [contenteditable] ol { padding-left: 20px; }
            `}</style>
        </div>
    )
}

// ─── style helpers ────────────────────────────────────────────────────────────

const labelStyle = {
    display: "flex", alignItems: "center",
    marginBottom: 6, fontSize: 11, fontWeight: 700,
    color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase",
}

const inputStyle = {
    width: "100%", padding: "9px 12px",
    borderRadius: 10, border: "1px solid #e2e8f0",
    fontSize: 13, color: "#0f172a",
    background: "#f8fafc", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
    fontFamily: "inherit",
}

function statPill(bg, color) {
    return {
        display: "inline-flex", alignItems: "center",
        padding: "4px 12px", borderRadius: 20,
        background: bg, color,
        fontSize: 12, fontWeight: 700,
    }
}
