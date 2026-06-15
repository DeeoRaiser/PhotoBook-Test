"use client"

import { useState, useRef } from "react"
import {
    X, ShoppingBag, Loader2, CheckCircle2,
    Mail, User, Phone, ExternalLink, Tag,
    Upload, Paperclip, Check, Copy, Building2,
    CreditCard, Handshake, ArrowLeft, Printer, ImageIcon, MessageCircle,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getCart, clearCart } from "@/lib/cart"
import { calcPrice } from "@/lib/pricing"

const phoneRegex = /^(?:(?:\+?54)?(?:9)?)?(?:11|[2368]\d)(?:(?=\d{0,2}15)\d{2}15|\d{2})?\d{8}$/
const schema = z.object({
    clientName:  z.string().min(2, "Ingresá tu nombre completo"),
    clientEmail: z.string().email("Email inválido"),
    clientPhone: z.string().min(8, "Ingresá un número válido").regex(phoneRegex, "Celular inválido (ej: 11 1234-5678)"),
})

const STEP = { METHOD: "method", FORM: "form", LOADING: "loading", REDIRECT: "redirect", SUCCESS: "success", ERROR: "error" }

// Payment methods available
function getPaymentMethods(hasMpToken, hasTransferInfo) {
    const methods = []
    if (hasMpToken) methods.push({
        id: "mercadopago",
        label: "Mercado Pago",
        sub: "Pagá online de forma segura",
        icon: CreditCard,
        color: "#009ee3",
        bg: "#e8f5fe",
        border: "#b3d9f7",
    })
    if (hasTransferInfo) methods.push({
        id: "transferencia",
        label: "Transferencia bancaria",
        sub: "Alias / CBU y adjuntá el comprobante",
        icon: Building2,
        color: "#059669",
        bg: "#ecfdf5",
        border: "#a7f3d0",
    })
    methods.push({
        id: "manual",
        label: "Acordar con el fotógrafo",
        sub: "Coordinan el pago directamente",
        icon: Handshake,
        color: "#7c3aed",
        bg: "#f5f3ff",
        border: "#ddd6fe",
    })
    return methods
}

const S = {
    overlay: { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" },
    modal: { background: "white", borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.3)", width: "100%", maxWidth: 440, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 },
    label: { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", display: "block", marginBottom: 5 },
    input: (focus, err) => ({
        width: "100%", padding: "10px 13px 10px 36px",
        fontSize: 13, fontWeight: 500, color: "#0f172a", background: "white",
        borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
        border: `1px solid ${err ? "#fca5a5" : focus ? "#93c5fd" : "#e2e8f0"}`,
        transition: "border-color 0.15s",
    }),
    submitBtn: (disabled) => ({
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: "11px", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
        color: "white", border: "none", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#94a3b8" : "linear-gradient(135deg,#1a1a2e,#1e3a5f)",
        boxShadow: disabled ? "none" : "0 4px 12px rgba(15,23,42,0.2)",
    }),
}

function FocusInput({ id, type = "text", placeholder, registration, hasError, icon: Icon }) {
    const [focused, setFocused] = useState(false)
    return (
        <div style={{ position: "relative" }}>
            {Icon && <Icon size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />}
            <input id={id} type={type} placeholder={placeholder} {...registration}
                onFocus={() => setFocused(true)}
                onBlur={e => { setFocused(false); registration.onBlur?.(e) }}
                style={S.input(focused, hasError)}
            />
        </div>
    )
}

function CopyBtn({ text }) {
    const [copied, setCopied] = useState(false)
    return (
        <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: copied ? "#10b981" : "#64748b", padding: "3px 6px", flexShrink: 0 }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "¡Copiado!" : "Copiar"}
        </button>
    )
}

export default function CheckoutModal({ galleryId, hasMpToken = false, gallery, onClose }) {
    const [step, setStep]               = useState(STEP.METHOD)
    const [paymentMethod, setPaymentMethod] = useState(null)
    const [serverError, setServerError] = useState("")
    const [order, setOrder]             = useState(null)
    const [receiptFile, setReceiptFile] = useState(null)
    const [receiptPreview, setReceiptPreview] = useState(null)
    const receiptRef = useRef(null)

    // Snapshot del carrito tomado al abrir el modal.
    // clearCart() se llama antes de pasar a STEP.SUCCESS, por eso
    // no podemos leer getCart() en el render del paso SUCCESS — ya estaría vacío.
    const [cartSnapshot] = useState(() => getCart())
    const [totalSnapshot] = useState(() => {
        const c = getCart()
        const ids = c.map(p => p.id)
        return gallery
            ? calcPrice(gallery, ids).total
            : c.reduce((s, p) => s + Number(p.price), 0)
    })

    const cart        = getCart()
    const selectedIds = cart.map(p => p.id)
    const { total, tierLabel, pricePerPhoto } = gallery
        ? calcPrice(gallery, selectedIds)
        : { total: cart.reduce((s, p) => s + p.price, 0), tierLabel: null, pricePerPhoto: null }
    const isTiered = gallery?.pricingMode === "tiered"

    const transferAlias  = gallery?.transferAlias || null
    const transferCbu    = gallery?.transferCbu   || null
    const hasTransferInfo = !!(transferAlias || transferCbu)

    const paymentMethods = getPaymentMethods(hasMpToken, hasTransferInfo)

    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

    const handleReceiptChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setReceiptFile(file)
        const reader = new FileReader()
        reader.onload = ev => setReceiptPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const onSubmit = async (data) => {
        setStep(STEP.LOADING); setServerError("")
        try {
            let receiptDataUrl = null
            if (receiptFile && paymentMethod === "transferencia") {
                receiptDataUrl = await new Promise((res, rej) => {
                    const r = new FileReader()
                    r.onload = ev => res(ev.target.result)
                    r.onerror = rej
                    r.readAsDataURL(receiptFile)
                })
            }

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientName: data.clientName,
                    clientEmail: data.clientEmail,
                    clientPhone: data.clientPhone,
                    galleryId,
                    photos: cart.map(p => ({
                                id: p.id,
                                price: p.price,
                                itemType: p.itemType || "digital",
                                printSelections: p.printSelections ?? [],
                            })),
                    tieredTotal: isTiered ? total : undefined,
                    receiptDataUrl,
                    clientPaymentMethod: paymentMethod,
                }),
            })

            const json = await res.json()
            if (!res.ok) {
                const detail = json.details ? " — " + JSON.stringify(json.details) : ""
                setServerError((json.error || "Error al crear el pedido") + detail)
                setStep(STEP.ERROR); return
            }

            if (json.mode === "mercadopago" && json.initPoint) {
                clearCart(); setStep(STEP.REDIRECT)
                setTimeout(() => { window.location.href = json.initPoint }, 800)
            } else {
                clearCart(); setOrder(json); setStep(STEP.SUCCESS)
            }
        } catch {
            setServerError("Error de conexión. Intentá de nuevo.")
            setStep(STEP.ERROR)
        }
    }

    const typeLabel  = { digital: null, print: "Impresión", both: "Digital + Impresión" }
    const typeColor  = { print: "#ea580c", both: "#7c3aed" }
    const typeBg     = { print: "#fff7ed", both: "#faf5ff" }
    const typeBorder = { print: "#fed7aa", both: "#ddd6fe" }

    // ── Cart summary (reused) ────────────────────────────────────────────────
    const CartSummary = () => (
        <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: 10 }}>
                SELECCIÓN — {cart.length} {cart.length === 1 ? "ÍTEM" : "ÍTEMS"}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {cart.slice(0, 5).map(photo => (
                    <div key={photo._key || photo.id} style={{ position: "relative", width: 46, height: 46, borderRadius: 8, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
                        <img src={photo.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {photo.itemType === "print" && (
                            <div style={{ position: "absolute", bottom: 0, right: 0, background: "#ea580c", borderRadius: "4px 0 0 0", padding: "1px 3px" }}>
                                <Printer size={8} color="white" />
                            </div>
                        )}
                        {photo.itemType === "both" && (
                            <div style={{ position: "absolute", bottom: 0, right: 0, background: "#7c3aed", borderRadius: "4px 0 0 0", padding: "1px 3px" }}>
                                <Printer size={8} color="white" />
                            </div>
                        )}
                    </div>
                ))}
                {cart.length > 5 && (
                    <div style={{ width: 46, height: 46, borderRadius: 8, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                        +{cart.length - 5}
                    </div>
                )}
            </div>
            {isTiered && tierLabel && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 9px", marginBottom: 8 }}>
                    <Tag size={10} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 10, color: "#92400e" }}>
                        <strong>{tierLabel}</strong> — ${pricePerPhoto?.toLocaleString("es-AR")}/foto × {selectedIds.length}
                    </span>
                </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>${total.toFixed(2)}</span>
            </div>
        </div>
    )

    return (
        <div style={S.overlay}>
            <div style={S.modal}>

                {/* ── HEADER ── */}
                <div style={S.header}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {step === STEP.FORM && (
                            <button onClick={() => setStep(STEP.METHOD)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px 4px 2px 0", display: "flex", alignItems: "center" }}>
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <ShoppingBag size={16} color="#475569" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                            {step === STEP.METHOD ? "¿Cómo querés pagar?" : step === STEP.SUCCESS ? "¡Pedido registrado!" : "Finalizar pedido"}
                        </span>
                    </div>
                    {step !== STEP.REDIRECT && (
                        <button onClick={onClose} disabled={step === STEP.LOADING}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* ── REDIRECT ── */}
                {step === STEP.REDIRECT && (
                    <div style={{ padding: "52px 24px", textAlign: "center" }}>
                        <Loader2 size={36} color="#94a3b8" style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px", display: "block" }} />
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 5px" }}>Redirigiendo a Mercado Pago...</p>
                        <p style={{ fontSize: 12, color: "#94a3b8" }}>No cierres esta ventana</p>
                    </div>
                )}

                {/* ── SUCCESS ── */}
                {step === STEP.SUCCESS && (
                    <div style={{ padding: ".5rem", textAlign: "center", overflowY: "auto" }}>
                        <div style={{ width: 58, height: 58, borderRadius: 18, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                            <CheckCircle2 size={28} color="#059669" />
                        </div>

                        {/* Message by payment type */}
                        {paymentMethod === "transferencia" && (
                            <>
                                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>¡Pedido registrado!</h2>
                                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
                                    {receiptFile ? "Tu comprobante fue adjuntado. " : ""}
                                    El fotógrafo verificará el pago y te enviará el link de descarga a{" "}
                                    <strong style={{ color: "#0f172a" }}>{order?.clientEmail}</strong>
                                </p>
                                {receiptFile && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "9px 13px", marginBottom: 14, justifyContent: "center" }}>
                                        <Paperclip size={13} color="#059669" />
                                        <span style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>Comprobante adjuntado</span>
                                    </div>
                                )}
                            </>
                        )}
                        {paymentMethod === "manual" && (
                            <>
                                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>¡Pedido registrado!</h2>
                                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
                                    El fotógrafo te va a contactar para coordinar el pago. Una vez confirmado, recibirás el link de descarga en{" "}
                                    <strong style={{ color: "#0f172a" }}>{order?.clientEmail}</strong>
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "9px 13px", marginBottom: 14, justifyContent: "center" }}>
                                    <Handshake size={13} color="#7c3aed" />
                                    <span style={{ fontSize: 12, color: "#5b21b6", fontWeight: 600 }}>El link se genera cuando el fotógrafo confirme el pago</span>
                                </div>
                            </>
                        )}

                        {/* ── WhatsApp CTA — solo para transferencia y manual ── */}
                        {(paymentMethod === "transferencia" || paymentMethod === "manual") && order?.whatsappLink && (
                            <div style={{
                                background: "#f0fdf4",
                                border: "2px solid #25d366",
                                borderRadius: 14,
                                padding: "16px 14px",
                                marginBottom: 16,
                                textAlign: "left",
                            }}>
                                {/* Ícono + título */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 12,
                                        background: "#25d366",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <MessageCircle size={18} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 800, color: "#14532d", margin: 0 }}>
                                            ¡Avisanos por WhatsApp!
                                        </p>
                                        <p style={{ fontSize: 11, color: "#16a34a", margin: 0 }}>
                                            Para avisarte cuando tu descarga esté lista
                                        </p>
                                    </div>
                                </div>

                                {/* Explicación */}
                                <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.6, margin: "0 0 12px" }}>
                                    Escribinos con tu <strong>número de pedido</strong> y cuando confirmemos el pago
                                    te enviamos el link de descarga directo al chat.
                                </p>

                                {/* Código de pedido */}
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    background: "white", border: "1px solid #bbf7d0",
                                    borderRadius: 10, padding: "9px 12px", marginBottom: 10,
                                }}>
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: "#86efac", letterSpacing: "0.05em", margin: "0 0 2px" }}>TU NÚMERO DE PEDIDO</p>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: "#14532d", letterSpacing: "0.03em" }}>
                                            N° {order.whatsappCode}
                                        </span>
                                    </div>
                                    {order?.whatsappMessage && <CopyBtn text={order.whatsappMessage} />}
                                </div>

                                {/* Botón principal */}
                                <a
                                    href={order.whatsappLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        width: "100%", padding: "12px",
                                        background: "#25d366",
                                        borderRadius: 11,
                                        color: "white", fontSize: 14, fontWeight: 800,
                                        textDecoration: "none", boxSizing: "border-box",
                                    }}
                                >
                                    <MessageCircle size={16} /> Enviar WhatsApp ahora
                                </a>
                                <p style={{ fontSize: 10, color: "#4ade80", margin: "8px 0 0", textAlign: "center" }}>
                                    El mensaje ya está escrito — solo tocá Enviar
                                </p>
                            </div>
                        )}

                        {/* Order summary */}
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", marginBottom: 16, textAlign: "left" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 0 8px" }}>RESUMEN</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 110, overflowY: "auto" }}>
                                {cartSnapshot.length > 0 ? cartSnapshot.map(photo => (
                                    <div key={photo._key || photo.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, gap: 8 }}>
                                        <span style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{photo.title || "Foto"}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                            {typeLabel[photo.itemType] && (
                                                <span style={{
                                                    fontSize: 9, fontWeight: 700,
                                                    color: typeColor[photo.itemType],
                                                    background: typeBg[photo.itemType],
                                                    border: `1px solid ${typeBorder[photo.itemType]}`,
                                                    padding: "1px 5px", borderRadius: 20,
                                                    display: "flex", alignItems: "center", gap: 3,
                                                }}>
                                                    <Printer size={8} /> {typeLabel[photo.itemType]}
                                                </span>
                                            )}
                                            <span style={{ fontWeight: 700, color: "#0f172a" }}>${Number(photo.price).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )) : <p style={{ fontSize: 12, color: "#94a3b8" }}>{order?.items?.length || 0} fotos</p>}
                            </div>
                            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Total</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>${totalSnapshot.toFixed(2)}</span>
                            </div>
                        </div>

                        <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", fontFamily: "inherit" }}>
                            Cerrar
                        </button>
                    </div>
                )}

                {/* ── STEP 1: PAYMENT METHOD SELECTOR ── */}
                {step === STEP.METHOD && (
                    <>
                        <CartSummary />
                        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>
                                Seleccioná cómo querés abonar tu pedido:
                            </p>
                            {paymentMethods.map(m => {
                                const Icon = m.icon
                                const selected = paymentMethod === m.id
                                return (
                                    <button key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                                        display: "flex", alignItems: "center", gap: 13,
                                        padding: "13px 16px", borderRadius: 14,
                                        background: selected ? m.bg : "white",
                                        border: `2px solid ${selected ? m.border : "#e2e8f0"}`,
                                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                                        transition: "all 0.12s",
                                        boxShadow: selected ? `0 0 0 3px ${m.border}40` : "none",
                                    }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: selected ? m.bg : "#f8fafc", border: `1px solid ${selected ? m.border : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Icon size={19} color={selected ? m.color : "#94a3b8"} strokeWidth={1.8} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 14, fontWeight: 700, color: selected ? m.color : "#0f172a", margin: "0 0 2px" }}>{m.label}</p>
                                            <p style={{ fontSize: 11, color: selected ? m.color : "#94a3b8", margin: 0, opacity: selected ? 0.8 : 1 }}>{m.sub}</p>
                                        </div>
                                        <div style={{
                                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                                            border: `2px solid ${selected ? m.color : "#e2e8f0"}`,
                                            background: selected ? m.color : "transparent",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            {selected && <Check size={11} color="white" strokeWidth={3} />}
                                        </div>
                                    </button>
                                )
                            })}

                            <button
                                disabled={!paymentMethod}
                                onClick={() => setStep(STEP.FORM)}
                                style={{ ...S.submitBtn(!paymentMethod), marginTop: 6 }}
                            >
                                Continuar →
                            </button>
                        </div>
                    </>
                )}

                {/* ── STEP 2: DATOS + CONFIRMACIÓN ── */}
                {(step === STEP.FORM || step === STEP.LOADING || step === STEP.ERROR) && (
                    <>
                        <CartSummary />
                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {/* Payment method indicator */}
                            {paymentMethod && (() => {
                                const m = paymentMethods.find(x => x.id === paymentMethod)
                                const Icon = m.icon
                                return (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderBottom: "1px solid #f1f5f9", background: m.bg }}>
                                        <Icon size={14} color={m.color} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.label}</span>
                                    </div>
                                )
                            })()}

                            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 13 }}>
                                {/* Nombre */}
                                <div>
                                    <label style={S.label}>TU NOMBRE</label>
                                    <FocusInput id="clientName" placeholder="Juan García" registration={register("clientName")} hasError={!!errors.clientName} icon={User} />
                                    {errors.clientName && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.clientName.message}</p>}
                                </div>
                                {/* Email */}
                                <div>
                                    <label style={S.label}>EMAIL</label>
                                    <FocusInput id="clientEmail" type="email" placeholder="juan@email.com" registration={register("clientEmail")} hasError={!!errors.clientEmail} icon={Mail} />
                                    {errors.clientEmail && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.clientEmail.message}</p>}
                                </div>
                                {/* Celular */}
                                <div>
                                    <label style={S.label}>CELULAR</label>
                                    <FocusInput id="clientPhone" type="tel" placeholder="11 1234-5678" registration={register("clientPhone")} hasError={!!errors.clientPhone} icon={Phone} />
                                    {errors.clientPhone && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.clientPhone.message}</p>}
                                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Para que el fotógrafo pueda contactarte</p>
                                </div>

                                {/* Transferencia: datos bancarios + comprobante */}
                                {paymentMethod === "transferencia" && (
                                    <>
                                        {(transferAlias || transferCbu) && (
                                            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "13px 15px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                                                    <Building2 size={13} color="#16a34a" />
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Datos para transferir</span>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                                    {transferAlias && (
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid #bbf7d0", borderRadius: 9, padding: "7px 12px" }}>
                                                            <div>
                                                                <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 0 1px" }}>ALIAS</p>
                                                                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{transferAlias}</p>
                                                            </div>
                                                            <CopyBtn text={transferAlias} />
                                                        </div>
                                                    )}
                                                    {transferCbu && (
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid #bbf7d0", borderRadius: 9, padding: "7px 12px" }}>
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 0 1px" }}>CBU / CVU</p>
                                                                <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{transferCbu}</p>
                                                            </div>
                                                            <CopyBtn text={transferCbu} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Receipt upload */}
                                        <div>
                                            <label style={S.label}>COMPROBANTE <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 10 }}>(opcional pero recomendado)</span></label>
                                            <div onClick={() => receiptRef.current?.click()} style={{
                                                border: `2px dashed ${receiptFile ? "#a7f3d0" : "#e2e8f0"}`,
                                                borderRadius: 12, padding: receiptFile ? "10px 14px" : "18px 14px",
                                                textAlign: "center", cursor: "pointer",
                                                background: receiptFile ? "#f0fdf4" : "#fafafa",
                                                transition: "all 0.15s",
                                            }}>
                                                {receiptFile ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center" }}>
                                                        {receiptPreview?.startsWith("data:image") ? (
                                                            <img src={receiptPreview} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
                                                        ) : (
                                                            <div style={{ width: 40, height: 40, borderRadius: 7, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                <Paperclip size={16} color="#16a34a" />
                                                            </div>
                                                        )}
                                                        <div style={{ textAlign: "left", minWidth: 0 }}>
                                                            <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{receiptFile.name}</p>
                                                            <p style={{ fontSize: 10, color: "#16a34a", margin: 0 }}>Toca para cambiar</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 7px" }}>
                                                            <Upload size={14} color="#94a3b8" />
                                                        </div>
                                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", margin: "0 0 2px" }}>Adjuntar comprobante</p>
                                                        <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>JPG, PNG o PDF</p>
                                                    </>
                                                )}
                                            </div>
                                            <input ref={receiptRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleReceiptChange} />
                                        </div>
                                    </>
                                )}

                                {/* Manual: info */}
                                {paymentMethod === "manual" && (
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "11px 14px" }}>
                                        <Handshake size={13} color="#7c3aed" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <p style={{ fontSize: 11, color: "#5b21b6", margin: 0, lineHeight: 1.5 }}>
                                            Tu pedido quedará registrado y el fotógrafo te contactará para coordinar el pago. <strong>El link de descarga se genera solo una vez que confirme el pago.</strong>
                                        </p>
                                    </div>
                                )}

                                {/* MP info */}
                                {paymentMethod === "mercadopago" && (
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#e8f5fe", border: "1px solid #b3d9f7", borderRadius: 12, padding: "11px 14px" }}>
                                        <ExternalLink size={13} color="#009ee3" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <p style={{ fontSize: 11, color: "#004f72", margin: 0, lineHeight: 1.5 }}>
                                            Serás redirigido a <strong>Mercado Pago</strong> para completar el pago. Al confirmar recibirás el link de descarga automáticamente.
                                        </p>
                                    </div>
                                )}

                                {serverError && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 13px", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                                        <X size={12} /> {serverError}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: 10 }}>
                                    {step === STEP.ERROR && (
                                        <button type="button" onClick={() => setStep(STEP.FORM)} style={{ flex: 1, padding: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", fontFamily: "inherit" }}>
                                            Reintentar
                                        </button>
                                    )}
                                    <button type="submit" disabled={step === STEP.LOADING} style={S.submitBtn(step === STEP.LOADING)}>
                                        {step === STEP.LOADING
                                            ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Procesando...</>
                                            : paymentMethod === "mercadopago"
                                            ? <><ExternalLink size={14} /> Ir a pagar</>
                                            : <><ShoppingBag size={14} /> Confirmar pedido</>
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    )
}