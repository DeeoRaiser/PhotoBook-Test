"use client"
import { useState } from "react"
import { X, Copy  } from "lucide-react"
// ── Share Modal ────────────────────────────────────────────────────────────────
export default function ShareModal({ isOpen, onClose, url, title, T }) {
    const [copied, setCopied] = useState(false)
    if (!isOpen) return null
    const handleCopy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif" }} onClick={onClose}>
            <div style={{ background: T.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380, border: `1px solid ${T.cardBorder}` }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>Compartir perfil</h3>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: T.btnSec.bg, border: `1px solid ${T.btnSec.border}`, color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} /></button>
                </div>
                <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 14px" }}>{title}</p>
                <div style={{ display: "flex", gap: 8, background: T.input.bg, border: `1px solid ${T.input.border}`, borderRadius: 12, padding: "4px 4px 4px 12px", marginBottom: 16 }}>
                    <span style={{ flex: 1, fontSize: 12, color: T.textSub, wordBreak: "break-all", alignSelf: "center" }}>{url}</span>
                    <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 9, background: T.btn.bg, color: T.btn.color, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }}>
                        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "¡Copiado!" : "Copiar"}
                    </button>
                </div>
            </div>
        </div>
    )
}