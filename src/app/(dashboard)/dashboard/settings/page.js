"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Type, Upload, Check, Loader2, AlertCircle,
    CreditCard, CheckCircle2,
    Trash2, Lock, Sparkles, ShieldCheck
} from "lucide-react"
import Link from "next/link"

const textSchema = z.object({
    text: z.string().min(1, "El texto no puede estar vacío").max(30, "Máximo 30 caracteres"),
})

const S = {
    page: { padding: ".5rem", maxWidth: 680, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" },
    section: { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", marginBottom: 20 },
    sectionHead: { padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 12 },
    sectionIcon: (color, bg) => ({ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),
    sectionTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" },
    sectionSub: { fontSize: 12, color: "#94a3b8", margin: 0 },
    body: { padding: "20px 22px" },
    label: { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", display: "block", marginBottom: 6 },
    input: (focus, error) => ({
        width: "100%", padding: "10px 13px",
        fontSize: 13, fontWeight: 500, color: "#0f172a",
        background: "white",
        border: `1px solid ${error ? "#fca5a5" : focus ? "#93c5fd" : "#e2e8f0"}`,
        borderRadius: 10, outline: "none",
        fontFamily: "inherit", boxSizing: "border-box",
        transition: "border-color 0.15s",
    }),
    btn: (variant = "primary") => ({
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: "10px 18px", borderRadius: 11, fontSize: 13, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit", border: "none",
        ...(variant === "primary" ? {
            background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
            color: "white", boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
        } : variant === "danger" ? {
            background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
        } : {
            background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0",
        }),
    }),
}

export default function SettingsPage() {
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeType, setActiveType] = useState("text")
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)

    const [savingWatermark, setSavingWatermark] = useState(false)
    const [successWatermark, setSuccessWatermark] = useState(false)
    const [errorWatermark, setErrorWatermark] = useState("")

    const [savingMp, setSavingMp] = useState(false)
    const [successMp, setSuccessMp] = useState(false)
    const [hasMpToken, setHasMpToken] = useState(false)
    const [mpUserId, setMpUserId] = useState(null)
    const [planAllowsMp, setPlanAllowsMp] = useState(false)
    const [planName, setPlanName] = useState(null)
    const [mpDiag, setMpDiag] = useState(null)
    const [loadingDiag, setLoadingDiag] = useState(false)

    const [transferAlias, setTransferAlias] = useState("")
    const [transferCbu, setTransferCbu] = useState("")
    const [savingTransfer, setSavingTransfer] = useState(false)
    const [successTransfer, setSuccessTransfer] = useState(false)
    const [errorTransfer, setErrorTransfer] = useState("")
    const [aliasFocused, setAliasFocused] = useState(false)
    const [cbuFocused, setCbuFocused] = useState(false)

    const [textFocused, setTextFocused] = useState(false)

    const fileRef = useRef(null)

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(textSchema),
        defaultValues: { text: "PhotoBook" },
    })

    const fetchSettings = async () => {
        const res = await fetch("/api/photographer/settings", { cache: "no-store" })
        const data = await res.json()
        setConfig(data)
        setActiveType(data.watermarkType || "text")
        setValue("text", data.watermarkText || "PhotoBook")
        if (data.watermarkLogoUrl) setLogoPreview(data.watermarkLogoUrl)
        setHasMpToken(data.hasMpToken || false)
        setMpUserId(data.mpUserId || null)
        setPlanAllowsMp(data.planAllowsMp || false)
        setPlanName(data.planName || null)
        setTransferAlias(data.transferAlias || "")
        setTransferCbu(data.transferCbu || "")
        setLoading(false)
        return data
    }

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const mpConnected = params.get("mp_connected") === "1"
        const mpError = params.get("mp_error")

        // Limpiar query params de la URL sin recargar la página
        if (mpConnected || mpError) {
            window.history.replaceState({}, "", window.location.pathname)
        }

        if (mpConnected) {
            // Pequeño delay para asegurar que el callback ya persistió en DB
            setTimeout(() => {
                fetchSettings().then(data => {
                    if (data.hasMpToken) {
                        setSuccessMp(true)
                        setTimeout(() => setSuccessMp(false), 5000)
                    }
                })
            }, 500)
        } else {
            fetchSettings()
        }
    }, [])

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
    }

    const handleSaveTransfer = async () => {
        setSavingTransfer(true); setErrorTransfer(""); setSuccessTransfer(false)
        const res = await fetch("/api/photographer/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transferAlias, transferCbu }),
        })
        if (res.ok) {
            setSuccessTransfer(true)
            setTimeout(() => setSuccessTransfer(false), 3000)
        } else {
            const json = await res.json()
            setErrorTransfer(json.error || "Error al guardar")
        }
        setSavingTransfer(false)
    }

    const onSubmitWatermark = async (data) => {
        setSavingWatermark(true); setErrorWatermark(""); setSuccessWatermark(false)
        if (activeType === "logo" && !logoFile && !config?.watermarkLogoUrl) {
            setErrorWatermark("Subí un logo para usar esta opción")
            setSavingWatermark(false); return
        }
        const formData = new FormData()
        formData.append("type", activeType)
        formData.append("text", data.text)
        if (logoFile) formData.append("logo", logoFile)
        const res = await fetch("/api/photographer/watermark", { method: "POST", body: formData })
        if (res.ok) {
            const updated = await res.json()
            setConfig(prev => ({ ...prev, ...updated }))
            setSuccessWatermark(true)
            setTimeout(() => setSuccessWatermark(false), 3000)
        } else {
            const json = await res.json()
            setErrorWatermark(json.error || "Error al guardar")
        }
        setSavingWatermark(false)
    }

    const handleConnectMp = () => {
        // Redirige al endpoint que inicia el flujo OAuth
        window.location.href = "/api/auth/mercadopago"
    }

    const handleDiagMp = async () => {
        setLoadingDiag(true)
        try {
            const res = await fetch("/api/photographer/mp-status", { cache: "no-store" })
            const data = await res.json()
            setMpDiag(data)
        } catch {
            setMpDiag({ diagnosis: "❌ Error al consultar el estado" })
        } finally {
            setLoadingDiag(false)
        }
    }

    const handleDisconnectMp = async () => {
        if (!confirm("¿Desconectar tu cuenta de Mercado Pago? Los clientes no podrán pagar online hasta que vuelvas a conectarla.")) return
        setSavingMp(true)
        const res = await fetch("/api/photographer/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disconnectMp: true }),
        })
        if (res.ok) {
            setHasMpToken(false)
            setMpUserId(null)
        }
        setSavingMp(false)
    }

    const currentText = watch("text")

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 300 }}>
            <Loader2 size={22} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    return (
        <div style={{ padding: ".5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* ── Header ── */}

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, marginLeft: "4rem" }}>
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sparkles size={18} color="#3b82f6" />
                        </div>
                        <h1 className="ml-2" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                            Configuración
                        </h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                        Personalizá tu cuenta y cómo cobrás a tus clientes
                    </p>
                </div>
            </div>


            {/* ── MERCADO PAGO ── */}
            <div style={S.section}>
                <div style={S.sectionHead}>
                    <div style={S.sectionIcon("#2563eb", "#eff6ff")}>
                        <CreditCard size={17} color="#2563eb" strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <p style={S.sectionTitle}>Cobros con Mercado Pago</p>
                            {/* Plan badge */}
                            {planAllowsMp ? (
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700, color: "#059669",
                                    background: "#ecfdf5", border: "1px solid #a7f3d0",
                                    padding: "2px 8px", borderRadius: 20,
                                }}>
                                    <ShieldCheck size={9} /> Incluido en tu plan
                                </span>
                            ) : (
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 10, fontWeight: 700, color: "#d97706",
                                    background: "#fffbeb", border: "1px solid #fde68a",
                                    padding: "2px 8px", borderRadius: 20,
                                }}>
                                    <Lock size={9} /> Requiere upgrade
                                </span>
                            )}
                        </div>
                        <p style={S.sectionSub}>Recibí pagos online directamente en tu cuenta de MP.</p>
                    </div>
                </div>

                <div style={S.body}>

                    {/* ── Plan no incluye MP — locked state ── */}
                    {!planAllowsMp && (
                        <div style={{
                            border: "1px solid #e2e8f0", borderRadius: 14,
                            overflow: "hidden", marginBottom: 0,
                        }}>
                            {/* Locked overlay header */}
                            <div style={{
                                background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                                padding: "16px 18px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex", alignItems: "center", gap: 10,
                            }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 10,
                                    background: "#f1f5f9", border: "1px solid #e2e8f0",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Lock size={16} color="#94a3b8" />
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#475569", margin: "0 0 2px" }}>
                                        Función no disponible en tu plan
                                    </p>
                                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                                        {planName
                                            ? `El plan "${planName}" no incluye cobros con Mercado Pago.`
                                            : "No tenés un plan activo."}
                                    </p>
                                </div>
                            </div>

                            {/* Blurred / disabled preview of the form */}
                            <div style={{ position: "relative" }}>
                                <div style={{ padding: "16px 18px", filter: "blur(3px)", userSelect: "none", pointerEvents: "none", opacity: 0.5 }}>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>MERCADO PAGO</div>
                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>
                                            Cuenta conectada vía OAuth
                                        </div>
                                    </div>
                                    <div style={{ height: 38, background: "#f1f5f9", borderRadius: 10 }} />
                                </div>

                                {/* Upgrade CTA overlay */}
                                <div style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center",
                                    gap: 10,
                                }}>
                                    <div style={{
                                        background: "white", border: "1px solid #e2e8f0",
                                        borderRadius: 14, padding: "14px 20px",
                                        textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 6 }}>
                                            <Sparkles size={14} color="#d97706" />
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Disponible desde el plan Pro</span>
                                        </div>
                                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 12px" }}>
                                            Habilitá cobros automáticos con Mercado Pago
                                        </p>
                                        <Link href="/dashboard/subscription" style={{ textDecoration: "none" }}>
                                            <button style={{
                                                display: "inline-flex", alignItems: "center", gap: 6,
                                                background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
                                                color: "white", border: "none", borderRadius: 9,
                                                padding: "8px 16px", fontSize: 12, fontWeight: 700,
                                                cursor: "pointer", fontFamily: "inherit",
                                                boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
                                            }}>
                                                <Sparkles size={12} /> Ver planes disponibles
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Plan incluye MP — active form ── */}
                    {planAllowsMp && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Status pill */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                background: hasMpToken ? "#ecfdf5" : "#f8fafc",
                                border: `1px solid ${hasMpToken ? "#a7f3d0" : "#e2e8f0"}`,
                                borderRadius: 12, padding: "12px 16px",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 9,
                                        background: hasMpToken ? "#d1fae5" : "#f1f5f9",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {hasMpToken
                                            ? <CheckCircle2 size={16} color="#059669" />
                                            : <AlertCircle size={16} color="#94a3b8" />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: hasMpToken ? "#065f46" : "#475569", margin: "0 0 1px" }}>
                                            {hasMpToken ? "Cuenta conectada" : "Sin configurar"}
                                        </p>
                                        <p style={{ fontSize: 11, color: hasMpToken ? "#059669" : "#94a3b8", margin: 0 }}>
                                            {hasMpToken
                                                ? "Los pagos se acreditan en tu cuenta automáticamente."
                                                : "Sin conexión, coordinás los pagos manualmente."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Botón OAuth */}
                            {successMp && (
                                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "9px 13px", fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                                    <Check size={13} /> ¡Cuenta conectada exitosamente!
                                </div>
                            )}

                            {/* Diagnóstico MP */}
                            <div style={{ marginTop: 4 }}>
                                <button
                                    onClick={handleDiagMp}
                                    disabled={loadingDiag}
                                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, color: "#94a3b8", fontFamily: "inherit", textDecoration: "underline" }}
                                >
                                    {loadingDiag ? "Verificando..." : "Verificar estado de conexión"}
                                </button>
                                {mpDiag && (
                                    <div style={{ marginTop: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 13px", fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
                                        <p style={{ margin: 0, fontWeight: 700, color: "#475569" }}>{mpDiag.diagnosis}</p>
                                        {!mpDiag.pkceColumnExists && (
                                            <p style={{ margin: 0, color: "#dc2626", fontWeight: 600 }}>⚠️ Falta correr la migración SQL. El OAuth va a fallar hasta que se aplique.</p>
                                        )}
                                        {mpDiag.hasAccessToken && <p style={{ margin: 0, color: "#64748b" }}>Token: ✅ presente</p>}
                                        {mpDiag.mpUserId && <p style={{ margin: 0, color: "#64748b" }}>MP User ID: <strong style={{ fontFamily: "monospace" }}>{mpDiag.mpUserId}</strong></p>}
                                        {mpDiag.tokenExpired === true && <p style={{ margin: 0, color: "#f59e0b", fontWeight: 600 }}>⚠️ Token expirado — reconectá tu cuenta</p>}
                                        {mpDiag.tokenExpired === false && <p style={{ margin: 0, color: "#059669" }}>Vence en: {mpDiag.tokenExpiresIn}</p>}
                                    </div>
                                )}
                            </div>

                            {hasMpToken ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {mpUserId && (
                                        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                                            ID de cuenta MP: <strong style={{ color: "#1e293b", fontFamily: "monospace" }}>{mpUserId}</strong>
                                        </p>
                                    )}
                                    <button
                                        onClick={handleConnectMp}
                                        style={{
                                            ...S.btn("secondary"),
                                            width: "100%",
                                        }}
                                    >
                                        Reconectar con Mercado Pago
                                    </button>
                                    <button
                                        onClick={handleDisconnectMp}
                                        disabled={savingMp}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            background: "#fef2f2", border: "1px solid #fecaca",
                                            borderRadius: 8, padding: "8px 14px",
                                            fontSize: 12, fontWeight: 600, color: "#dc2626",
                                            cursor: savingMp ? "not-allowed" : "pointer",
                                            opacity: savingMp ? 0.55 : 1,
                                            fontFamily: "inherit", width: "100%",
                                        }}
                                    >
                                        {savingMp
                                            ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Desconectando...</>
                                            : <><Trash2 size={13} /> Desconectar cuenta</>
                                        }
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectMp}
                                    style={{
                                        ...S.btn("primary"),
                                        width: "100%",
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                                    Conectar con Mercado Pago
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>


            {/* ── TRANSFERENCIA BANCARIA ── */
                <div style={S.section}>
                    <div style={S.sectionHead}>
                        <div style={S.sectionIcon("#059669", "#ecfdf5")}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </div>
                        <div>
                            <p style={S.sectionTitle}>Datos de transferencia</p>
                            <p style={S.sectionSub}>Alias y CBU/CVU que verá el cliente al comprar sin Mercado Pago.</p>
                        </div>
                    </div>
                    <div style={S.body}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={S.label}>ALIAS</label>
                                <input
                                    value={transferAlias}
                                    onChange={e => setTransferAlias(e.target.value)}
                                    onFocus={() => setAliasFocused(true)}
                                    onBlur={() => setAliasFocused(false)}
                                    placeholder="mi.alias.mp"
                                    style={S.input(aliasFocused, false)}
                                />
                                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>Alias de tu cuenta bancaria o Mercado Pago</p>
                            </div>
                            <div>
                                <label style={S.label}>CBU / CVU</label>
                                <input
                                    value={transferCbu}
                                    onChange={e => setTransferCbu(e.target.value)}
                                    onFocus={() => setCbuFocused(true)}
                                    onBlur={() => setCbuFocused(false)}
                                    placeholder="0000000000000000000000"
                                    style={{ ...S.input(cbuFocused, false), fontFamily: "monospace", letterSpacing: "0.04em" }}
                                />
                            </div>

                            {errorTransfer && (
                                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 13px", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                                    <AlertCircle size={13} /> {errorTransfer}
                                </div>
                            )}

                            <button
                                onClick={handleSaveTransfer}
                                disabled={savingTransfer}
                                style={{ ...S.btn("primary"), width: "100%", opacity: savingTransfer ? 0.7 : 1 }}
                            >
                                {savingTransfer
                                    ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                                    : successTransfer
                                        ? <><Check size={14} /> ¡Guardado!</>
                                        : "Guardar datos de transferencia"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            }
            {/* ── MARCA DE AGUA ── */}
            <form onSubmit={handleSubmit(onSubmitWatermark)}>
                <div style={S.section}>
                    <div style={S.sectionHead}>
                        <div style={S.sectionIcon("#7c3aed", "#f5f3ff")}>
                            <Type size={17} color="#7c3aed" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={S.sectionTitle}>Marca de agua</p>
                            <p style={S.sectionSub}>Protegé tus fotos automáticamente en todas las galerías.</p>
                        </div>
                    </div>

                    <div style={S.body}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Toggle text/logo */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#f8fafc", borderRadius: 12, padding: 5, border: "1px solid #e2e8f0" }}>
                                {["text", "logo"].map(type => (
                                    <button key={type} type="button" onClick={() => setActiveType(type)} style={{
                                        padding: "8px 0", borderRadius: 9, fontSize: 12, fontWeight: 700,
                                        cursor: "pointer", border: "none", fontFamily: "inherit",
                                        background: activeType === type ? "white" : "transparent",
                                        color: activeType === type ? "#0f172a" : "#94a3b8",
                                        boxShadow: activeType === type ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                        transition: "all 0.12s",
                                    }}>
                                        {type === "text" ? "Texto" : "Logo"}
                                    </button>
                                ))}
                            </div>

                            {/* Text input */}
                            {activeType === "text" && (
                                <div>
                                    <label style={S.label}>TEXTO DE LA MARCA</label>
                                    <input
                                        {...register("text")}
                                        onFocus={() => setTextFocused(true)}
                                        onBlur={() => setTextFocused(false)}
                                        style={S.input(textFocused, !!errors.text)}
                                    />
                                    {errors.text && (
                                        <p style={{ fontSize: 11, color: "#ef4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                                            <AlertCircle size={11} /> {errors.text.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Logo upload */}
                            {activeType === "logo" && (
                                <div>
                                    <label style={S.label}>LOGO</label>
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        style={{
                                            border: "2px dashed #e2e8f0", borderRadius: 12,
                                            padding: "24px 16px", textAlign: "center", cursor: "pointer",
                                            background: "#fafafa", transition: "border-color 0.15s",
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} style={{ maxHeight: 60, objectFit: "contain", margin: "0 auto", display: "block" }} />
                                        ) : (
                                            <>
                                                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                                                    <Upload size={17} color="#94a3b8" />
                                                </div>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", margin: "0 0 3px" }}>Subí tu logo</p>
                                                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>PNG o SVG recomendado</p>
                                            </>
                                        )}
                                    </div>
                                    <input ref={fileRef} type="file" style={{ display: "none" }} accept="image/*" onChange={handleLogoChange} />
                                </div>
                            )}

                            {/* Preview */}
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", marginBottom: 10 }}>VISTA PREVIA</p>
                                <div style={{ height: 100, background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {activeType === "text"
                                        ? <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 600, letterSpacing: "0.05em" }}>{currentText}</span>
                                        : logoPreview
                                            ? <img src={logoPreview} style={{ maxHeight: 50, opacity: 0.55 }} />
                                            : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Sin logo</span>
                                    }
                                </div>
                            </div>

                            {errorWatermark && (
                                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 13px", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                                    <AlertCircle size={13} /> {errorWatermark}
                                </div>
                            )}

                            <button type="submit" disabled={savingWatermark} style={{ ...S.btn("primary"), width: "100%", opacity: savingWatermark ? 0.7 : 1 }}>
                                {savingWatermark
                                    ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                                    : successWatermark
                                        ? <><Check size={14} /> ¡Guardado!</>
                                        : "Guardar marca de agua"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}