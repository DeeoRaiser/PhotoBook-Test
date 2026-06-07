"use client"

import { useEffect, useState } from "react"
import {
    ShoppingBag, Loader2, Mail, Calendar, Images,
    ChevronDown, ChevronUp, Copy, Check, Link as LinkIcon,
    MessageCircle, Download, DollarSign, Clock,
    CheckCircle2, XCircle, TrendingUp, Camera
} from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    PENDING: { label: "Pendiente", short: "Pend.", color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
    PAID: { label: "Pagada", short: "Pag.", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
    DELIVERED: { label: "Entregada", short: "Entr.", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
    CANCELLED: { label: "Cancelada", short: "Canc.", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" },
}

const STATUS_TRANSITIONS = {
    PENDING: ["PAID", "CANCELLED"],
    PAID: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
}

const FILTERS = ["Todas", "PENDING", "PAID", "DELIVERED", "CANCELLED"]

const F = {
    page: { padding: ".5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" },
    card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", marginBottom: 10, transition: "box-shadow 0.15s" },
    statCard: { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" },
    expandedArea: { borderTop: "1px solid #f1f5f9", padding: "18px 20px", background: "#fafafa" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n) {
    return `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function fallbackCopy(text) {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0"
    document.body.appendChild(ta)
    ta.focus(); ta.select()
    try { document.execCommand("copy") } catch {}
    document.body.removeChild(ta)
}

function CopyButton({ text, label = "Copiar" }) {
    const [copied, setCopied] = useState(false)
    const handle = (e) => {
        e.stopPropagation()
        try {
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
            } else {
                fallbackCopy(text)
            }
        } catch {
            fallbackCopy(text)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button onClick={handle} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600,
            color: copied ? "#10b981" : "#64748b",
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 8px", borderRadius: 7,
            fontFamily: "inherit",
        }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "¡Copiado!" : label}
        </button>
    )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order: initialOrder, onStatusChange }) {
    const [order, setOrder] = useState(initialOrder)
    const [expanded, setExpanded] = useState(false)
    const [updating, setUpdating] = useState(false)

    useEffect(() => { setOrder(initialOrder) }, [initialOrder])

    const transitions = STATUS_TRANSITIONS[order.status]

    const handleStatus = async (newStatus) => {
        setUpdating(true)
        const res = await fetch(`/api/orders/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) setOrder(await res.json())
        onStatusChange()
        setUpdating(false)
    }

    const whatsappText = order.downloadUrl
        ? `Hola ${order.clientName}, tus fotos están listas para descargar: ${order.downloadUrl}`
        : null

    const galleryName = order.gallery?.title ?? order.galleryTitle ?? null

    return (
        <div style={F.card}>
            {/* ── Summary row (always visible, click to expand) ── */}
            <div
                onClick={() => setExpanded(e => !e)}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 18px", cursor: "pointer", gap: 12,
                }}
            >
                {/* Left: status dot + client info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                        background: STATUS_CONFIG[order.status]?.dot ?? "#94a3b8",
                    }} />
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {order.clientName}
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {order.clientEmail}
                            {galleryName && <span style={{ marginLeft: 6, color: "#cbd5e1" }}>· {galleryName}</span>}
                        </p>
                    </div>
                </div>

                {/* Right: status badge + total + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                        color: STATUS_CONFIG[order.status]?.color,
                        background: STATUS_CONFIG[order.status]?.bg,
                        border: `1px solid ${STATUS_CONFIG[order.status]?.border}`,
                    }}>
                        {STATUS_CONFIG[order.status]?.short}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                        {fmtMoney(order.total)}
                    </span>
                    {expanded
                        ? <ChevronUp size={15} color="#94a3b8" />
                        : <ChevronDown size={15} color="#94a3b8" />}
                </div>
            </div>

                {/* ── Expanded detail ── */}
                {expanded && (
                    <div style={F.expandedArea}>

                        {/* Payment method badge */}
                        {order.clientPaymentMethod && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>MÉTODO DE PAGO:</span>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                                    ...(order.clientPaymentMethod === "mercadopago"
                                        ? { color: "#004f72", background: "#e8f5fe", border: "1px solid #b3d9f7" }
                                        : order.clientPaymentMethod === "transferencia"
                                            ? { color: "#065f46", background: "#ecfdf5", border: "1px solid #a7f3d0" }
                                            : { color: "#5b21b6", background: "#f5f3ff", border: "1px solid #ddd6fe" })
                                }}>
                                    {order.clientPaymentMethod === "mercadopago" ? "Mercado Pago"
                                        : order.clientPaymentMethod === "transferencia" ? "Transferencia"
                                            : "Acordar con fotógrafo"}
                                </span>
                            </div>
                        )}

                        {/* Photo thumbnails */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                            {order.items.map((item) => (
                                <div key={item.id} style={{ position: "relative" }}>
                                    <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
                                        {item.photo ? (
                                            <img src={item.photo.bunnyUrl} alt={item.photo.title || "Foto"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : item.photoUrl ? (
                                            <img src={item.photoUrl} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35, filter: "grayscale(1)" }} />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Camera size={16} color="#cbd5e1" />
                                            </div>
                                        )}
                                    </div>
                                    <span style={{
                                        position: "absolute", bottom: -4, right: -4,
                                        background: "white", border: "1px solid #e2e8f0",
                                        fontSize: 9, fontWeight: 700, color: "#374151",
                                        padding: "1px 5px", borderRadius: 6,
                                    }}>
                                        {fmtMoney(item.price)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Download link block */}
                        {order.downloadUrl && (
                            <div style={{
                                background: "white", border: "1px solid #a7f3d0",
                                borderRadius: 14, padding: "14px 16px", marginBottom: 14,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: 7, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Download size={11} color="#059669" />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.04em" }}>LINK DE DESCARGA ACTIVO</span>
                                </div>

                                {/* URL row */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: "#f8fafc", border: "1px solid #e2e8f0",
                                    borderRadius: 10, padding: "7px 10px", marginBottom: 10,
                                }}>
                                    <LinkIcon size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                                        {order.downloadUrl}
                                    </span>
                                    <CopyButton text={order.downloadUrl} label="Copiar link" />
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: 6,
                                            fontSize: 11, fontWeight: 700, color: "white",
                                            background: "#25d366", borderRadius: 9,
                                            padding: "6px 12px", textDecoration: "none",
                                        }}
                                    >
                                        <MessageCircle size={12} /> Enviar por WhatsApp
                                    </a>
                                    <CopyButton text={whatsappText} label="Copiar mensaje" />
                                    <a
                                        href={order.downloadUrl} target="_blank" rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b", textDecoration: "none", fontWeight: 600 }}
                                    >
                                        <Download size={11} /> Ver página
                                    </a>
                                </div>

                                {/* Expiry */}
                                {order.downloadExpiresAt && (
                                    <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 10, margin: "10px 0 0" }}>
                                        Expira: {new Date(order.downloadExpiresAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        {order.downloadCount > 0 && (
                                            <span style={{ marginLeft: 8, color: "#cbd5e1" }}>
                                                · Descargado {order.downloadCount} {order.downloadCount === 1 ? "vez" : "veces"}
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Receipt / Comprobante */}
                        {order.receiptUrl && (
                            <div style={{
                                background: "white", border: "1px solid #a7f3d0",
                                borderRadius: 13, padding: "12px 15px", marginBottom: 13,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: 7, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.04em" }}>COMPROBANTE ADJUNTO</span>
                                </div>
                                {order.receiptUrl.startsWith("data:image") ? (
                                    <img src={order.receiptUrl} alt="Comprobante" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc" }} />
                                ) : order.receiptUrl.startsWith("data:application/pdf") ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "8px 12px" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                        <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Comprobante PDF adjunto</span>
                                        <a href={order.receiptUrl} download="comprobante.pdf" target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginLeft: "auto", textDecoration: "none" }}>
                                            Descargar
                                        </a>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 12, color: "#64748b" }}>Comprobante disponible</div>
                                )}
                            </div>
                        )}

                        {/* Status actions */}
                        {transitions.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Cambiar estado:</span>
                                {transitions.map((s) => {
                                    const c = STATUS_CONFIG[s]
                                    const isDanger = s === "CANCELLED"
                                    return (
                                        <button key={s}
                                            disabled={updating}
                                            onClick={e => { e.stopPropagation(); handleStatus(s) }}
                                            style={{
                                                display: "inline-flex", alignItems: "center", gap: 6,
                                                fontSize: 11, fontWeight: 700,
                                                color: isDanger ? "#dc2626" : c.color,
                                                background: isDanger ? "#fef2f2" : c.bg,
                                                border: `1px solid ${isDanger ? "#fecaca" : c.border}`,
                                                borderRadius: 9, padding: "6px 12px",
                                                cursor: updating ? "not-allowed" : "pointer",
                                                opacity: updating ? 0.6 : 1,
                                                fontFamily: "inherit",
                                            }}
                                        >
                                            {updating
                                                ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                                                : s === "PAID" ? <><CheckCircle2 size={11} /> Marcar como pagada</>
                                                    : s === "DELIVERED" ? <><Download size={11} /> Marcar como entregada</>
                                                        : <><XCircle size={11} /> Cancelar orden</>
                                            }
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Pending hint */}
                        {order.status === "PENDING" && !order.downloadToken && (
                            <div style={{
                                display: "flex", alignItems: "flex-start", gap: 8,
                                background: "#fffbeb", border: "1px solid #fde68a",
                                borderRadius: 10, padding: "10px 12px", marginTop: 12,
                            }}>
                                <Clock size={12} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                                <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                                    Cuando el cliente pague, hacé click en <strong>Marcar como pagada</strong> para generar el link de descarga automáticamente.
                                </p>
                            </div>
                        )}

                        {transitions.length === 0 && (
                            <p style={{ fontSize: 11, color: "#94a3b8" }}>Esta orden está en su estado final.</p>
                        )}
                    </div>
                )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("Todas")

    const fetchOrders = async () => {
        setLoading(true)
        const params = filter !== "Todas" ? `?status=${filter}` : ""
        const res = await fetch(`/api/orders/photographer${params}`)
        const data = await res.json()
        const base = window.location.origin
        setOrders(data.map(o => ({
            ...o,
            downloadUrl: o.downloadToken ? `${base}/download/${o.downloadToken}` : null,
        })))
        setLoading(false)
    }

    useEffect(() => { fetchOrders() }, [filter])

    const allOrders = orders
    const revenue = allOrders.filter(o => ["PAID", "DELIVERED"].includes(o.status)).reduce((s, o) => s + Number(o.total), 0)
    const pending = allOrders.filter(o => o.status === "PENDING").length
    const delivered = allOrders.filter(o => o.status === "DELIVERED").length

    // Count per status for filter badges
    const countByStatus = allOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})

    return (
        <div style={F.page}>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, marginLeft: "4rem" }}>
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingBag size={18} color="#3b82f6" />
                        </div>
                        <h1 className="ml-2" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                            Órdenes
                        </h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                        {allOrders.length} {allOrders.length === 1 ? "orden" : "órdenes"} en total
                        {pending > 0 && (
                            <span style={{ marginLeft: 8, color: "#d97706", fontWeight: 700 }}>
                                · {pending} pendiente{pending > 1 ? "s" : ""}
                            </span>
                        )}
                    </p>
                </div>
            </div>
            {/* ── Stat cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
                {/* Ingresos */}
                <div style={{ ...F.statCard }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#ddd6fe", borderRadius: "16px 16px 0 0" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }}>Ingresos confirmados</p>
                            <p style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>
                                {fmtMoney(revenue)}
                            </p>
                        </div>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DollarSign size={17} color="#8b5cf6" strokeWidth={1.8} />
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                        <TrendingUp size={10} color="#10b981" />
                        <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>Pagadas + Entregadas</span>
                    </div>
                </div>

                {/* Pendientes */}
                <div style={{ ...F.statCard }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#fde68a", borderRadius: "16px 16px 0 0" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }}>Pendientes de pago</p>
                            <p style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>{pending}</p>
                        </div>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Clock size={17} color="#d97706" strokeWidth={1.8} />
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                        <span style={{ fontSize: 10, color: pending > 0 ? "#d97706" : "#94a3b8", fontWeight: 600 }}>
                            {pending > 0 ? "Requieren atención" : "Sin pendientes"}
                        </span>
                    </div>
                </div>

                {/* Entregadas */}
                <div style={{ ...F.statCard }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#a7f3d0", borderRadius: "16px 16px 0 0" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }}>Entregadas</p>
                            <p style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>{delivered}</p>
                        </div>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CheckCircle2 size={17} color="#059669" strokeWidth={1.8} />
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Completadas con éxito</span>
                    </div>
                </div>
            </div>

            {/* ── Filtros ── */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {FILTERS.map(f => {
                    const active = filter === f
                    const label = f === "Todas" ? "Todas" : STATUS_CONFIG[f].label
                    const count = f === "Todas" ? allOrders.length : (countByStatus[f] || 0)
                    return (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                            background: active ? "linear-gradient(135deg,#1a1a2e,#1e3a5f)" : "white",
                            color: active ? "white" : "#64748b",
                            border: active ? "none" : "1px solid #e2e8f0",
                            boxShadow: active ? "0 4px 12px rgba(15,23,42,0.2)" : "none",
                        }}>
                            {label}
                            {count > 0 && (
                                <span style={{
                                    fontSize: 10, fontWeight: 800, lineHeight: 1,
                                    background: active ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                                    color: active ? "white" : "#64748b",
                                    padding: "1px 6px", borderRadius: 20,
                                }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ── Lista de órdenes ── */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                    <Loader2 size={22} color="#cbd5e1" style={{ animation: "spin 1s linear infinite" }} />
                </div>
            ) : orders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 24px" }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 18, background: "#f8fafc",
                        border: "1px solid #e2e8f0", display: "flex", alignItems: "center",
                        justifyContent: "center", margin: "0 auto 16px",
                    }}>
                        <ShoppingBag size={24} color="#cbd5e1" strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", margin: "0 0 4px" }}>
                        {filter === "Todas" ? "No hay órdenes todavía" : `Sin órdenes "${STATUS_CONFIG[filter]?.label}"`}
                    </p>
                    <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>
                        {filter === "Todas" ? "Las órdenes de tus clientes aparecerán acá" : "Probá con otro filtro"}
                    </p>
                </div>
            ) : (
                <div>
                    {orders.map(order => (
                        <OrderCard key={order.id} order={order} onStatusChange={fetchOrders} />
                    ))}
                </div>
            )}
        </div>
    )
}