"use client"

import { useState, useEffect } from "react"
import {
    MessageCircle, Mail, Trash2, CheckCheck,
    Loader2, MailCheck, Reply,
    Clock, RefreshCw, Inbox, Phone
} from "lucide-react"
import { FaWhatsapp as Whatsapp } from "react-icons/fa"

function formatDate(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return "Ahora"
    if (mins < 60) return `Hace ${mins} min`
    if (hours < 24) return `Hace ${hours}h`
    if (days < 7) return `Hace ${days}d`
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: days > 365 ? "numeric" : undefined })
}

// Detecta si el string contiene HTML real
function isHtml(str) {
    return /<[a-z][\s\S]*>/i.test(str)
}

// Preview limpio para la lista (sin tags)
function htmlToPlainPreview(str) {
    return str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

// Renderizador seguro de HTML en un iframe sandboxed
function HtmlMessageBody({ html }) {
    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #374151; line-height: 1.75; word-break: break-word; }
  a { color: #3b82f6; }
  img { max-width: 100%; height: auto; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  ul, ol { padding-left: 20px; }
  p { margin: 0 0 12px; }
</style></head><body>${html}</body></html>`

    return (
        <iframe
            sandbox="allow-same-origin"
            srcDoc={doc}
            style={{ width: "100%", border: "none", borderRadius: 8, minHeight: 120 }}
            onLoad={e => {
                // Auto-height
                try {
                    const h = e.target.contentDocument?.body?.scrollHeight
                    if (h) e.target.style.height = h + 24 + "px"
                } catch { }
            }}
        />
    )
}

export default function MessagesPage() {
    const [messages, setMessages] = useState([])
    const [unread, setUnread] = useState(0)
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [markingAll, setMarkingAll] = useState(false)
    const [filter, setFilter] = useState("all")
    const [isMobile, setIsMobile] = useState(false)

    const fetchMessages = async () => {
        const res = await fetch("/api/photographer/messages")
        if (res.ok) {
            const data = await res.json()
            setMessages(data.messages || [])
            setUnread(data.unread || 0)
        }
        setLoading(false)
    }

    useEffect(() => { fetchMessages() }, [])

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    const openMessage = async (msg) => {
        setSelected(msg)
        if (!msg.isRead) {
            await fetch("/api/photographer/messages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: msg.id, isRead: true }),
            })
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))
            setUnread(prev => Math.max(0, prev - 1))
            setSelected(prev => prev?.id === msg.id ? { ...prev, isRead: true } : prev)
        }
    }

    const deleteMessage = async (id) => {
        if (!confirm("¿Eliminar este mensaje?")) return
        setDeleting(id)
        await fetch("/api/photographer/messages", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        })
        setMessages(prev => prev.filter(m => m.id !== id))
        if (selected?.id === id) setSelected(null)
        setDeleting(null)
    }

    const markAllRead = async () => {
        setMarkingAll(true)
        await fetch("/api/photographer/messages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAllRead: true }),
        })
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })))
        setUnread(0)
        setMarkingAll(false)
    }

    const displayed = filter === "unread" ? messages.filter(m => !m.isRead) : messages

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 300 }}>
            <Loader2 size={24} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    return (
        <div style={{ padding: ".5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 28, marginLeft: "4rem" }} className="flex-col">
                <div className="flex items-center">
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MessageCircle size={18} color="#3b82f6" />
                    </div>
                    <h1 className="ml-2" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                        Mensajes
                        {unread > 0 && (
                            <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, background: "#3b82f6", color: "white", padding: "2px 9px", borderRadius: 20 }}>{unread} nuevos</span>
                        )}
                    </h1>
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Consultas recibidas desde tu portfolio</p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                {unread > 0 && (
                    <button onClick={markAllRead} disabled={markingAll} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        {markingAll ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCheck size={13} />}
                        Marcar todo como leído
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-row justify-between">
                <div style={{ display: "flex", gap: 4, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, marginBottom: 16, width: "fit-content" }}>
                    {[{ key: "all", label: `Todos (${messages.length})` }, { key: "unread", label: `No leídos (${unread})` }].map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)} style={{
                            padding: "6px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
                            fontSize: 12, fontWeight: 700,
                            background: filter === f.key ? "#0f172a" : "transparent",
                            color: filter === f.key ? "white" : "#64748b",
                        }}>{f.label}</button>
                    ))}
                </div>
                <button onClick={fetchMessages} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b" }}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {displayed.length === 0 ? (
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <Inbox size={28} color="#cbd5e1" strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", margin: "0 0 6px" }}>
                        {filter === "unread" ? "No tenés mensajes sin leer" : "No recibiste mensajes aún"}
                    </p>
                    <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0 }}>
                        {filter === "unread" ? "¡Estás al día!" : "Cuando alguien te contacte desde tu portfolio, los mensajes aparecen acá"}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : (selected ? "1fr 1.4fr" : "1fr"),
                    gap: 16,
                    alignItems: "start",
                }}>
                    {/* Lista */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                        {displayed.map(msg => {
                            const preview = isHtml(msg.message)
                                ? htmlToPlainPreview(msg.message)
                                : msg.message
                            return (
                                <div key={msg.id} onClick={() => openMessage(msg)}
                                    style={{
                                        background: selected?.id === msg.id ? "#eff6ff" : msg.isRead ? "white" : "#f0f9ff",
                                        border: `1.5px solid ${selected?.id === msg.id ? "#3b82f6" : msg.isRead ? "#e2e8f0" : "#bfdbfe"}`,
                                        borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                                        transition: "all .15s", position: "relative", minWidth: 0, overflow: "hidden",
                                    }}>
                                    {!msg.isRead && (
                                        <div style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
                                    )}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: msg.isRead ? "#f1f5f9" : "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: msg.isRead ? "#64748b" : "white" }}>
                                            {msg.senderName[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: msg.isRead ? 600 : 800, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.senderName}</p>
                                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.senderEmail || msg.senderPhone}</p>
                                        </div>
                                        <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>{formatDate(msg.createdAt)}</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: "#475569", margin: 0, paddingLeft: 46, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", display: "block" }}>
                                        {preview}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Detalle */}
                    {selected && (
                         <div style={{padding:"0.5rem", maxWidth: "720", margin: "0 auto", fontFamily: "DM Sans system-ui, sans-serif"}}>
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, marginLeft: "2rem" }}>
                                <div className="flex flex-col">
                                    <div className="flex items-center">
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <MessageCircle size={18} color="#3b82f6" />
                                        </div>
                                        <h1 className="ml-2" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                                            Mensajes
                                            {unread > 0 && (
                                                <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, background: "#3b82f6", color: "white", padding: "2px 9px", borderRadius: 20 }}>{unread} nuevos</span>
                                            )}
                                        </h1>
                                    </div>
                                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Consultas recibidas desde tu portfolio</p>
                                </div>
                            </div>

                            {/* Meta */}
                            <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
                                    <Clock size={12} /> {new Date(selected.createdAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: selected.isRead ? "#10b981" : "#94a3b8" }}>
                                    {selected.isRead ? <MailCheck size={12} color="#10b981" /> : <Mail size={12} />}
                                    {selected.isRead ? "Leído" : "No leído"}
                                </div>
                            </div>

                            {/* Cuerpo */}
                            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
                                {isHtml(selected.message) ? (
                                    <HtmlMessageBody html={selected.message} />
                                ) : (
                                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, margin: "0 0 24px", whiteSpace: "pre-line", wordBreak: "break-word", overflowWrap: "break-word" }}>
                                        {selected.message}
                                    </p>
                                )}

                                {/* Acciones */}
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}>
                                    {selected.senderEmail && (
                                        <a href={`mailto:${selected.senderEmail}?subject=Re: Tu consulta en mi PhotoBook`}
                                            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                            <Reply size={14} /> Responder por email
                                        </a>
                                    )}
                                    {selected.senderPhone && (
                                        <a href={`https://wa.me/${selected.senderPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                                            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                            <Whatsapp size={14} /> WhatsApp
                                        </a>
                                    )}
                                    {selected.senderPhone && (
                                        <a href={`tel:${selected.senderPhone.replace(/\s/g, "")}`}
                                            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, border: "1px solid #e2e8f0", background: "white", color: "#374151", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                            <Phone size={14} /> Llamar
                                        </a>
                                    )}
                                    <button onClick={() => deleteMessage(selected.id)} disabled={deleting === selected.id}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                        <Trash2 size={14} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
