"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"

const schema = z.object({
    email: z.string().email("Email inválido"),
})

const S = {
    card: {
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 24,
        padding: "36px 36px 32px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
        fontFamily: "'DM Sans', system-ui, sans-serif",
    },
    logoWrap: {
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28,
    },
    logoIcon: {
        width: 55, height: 55, borderRadius: 12,
        background: "linear-gradient(135deg, #ffff, #ffff)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
        marginRight: 12,
    },
    logoName: {
        fontSize: 22, fontWeight: 800, color: "white",
        letterSpacing: "-0.02em", lineHeight: 1,
    },
    logoSub: {
        fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.1em", marginTop: 2,
    },
    divider: {
        height: 1,
        background: "rgba(255,255,255,0.08)",
        margin: "0 0 28px",
    },
    heading: {
        fontSize: 20, fontWeight: 800, color: "white",
        letterSpacing: "-0.02em", margin: "0 0 4px",
    },
    subheading: {
        fontSize: 13, color: "rgba(255,255,255,0.4)",
        margin: "0 0 24px", lineHeight: 1.6,
    },
    fieldWrap: { marginBottom: 16 },
    label: {
        display: "block", fontSize: 12, fontWeight: 700,
        color: "rgba(255,255,255,0.6)", marginBottom: 6,
        letterSpacing: "0.02em",
    },
    input: {
        width: "100%", padding: "11px 14px",
        fontSize: 14, fontWeight: 500, color: "white",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12, outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s",
        boxSizing: "border-box",
    },
    fieldError: {
        fontSize: 11, color: "#f87171",
        marginTop: 5, display: "flex", alignItems: "center", gap: 4,
    },
    submitBtn: {
        width: "100%", padding: "12px 0",
        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        color: "white", border: "none", borderRadius: 12,
        fontSize: 14, fontWeight: 700, cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "opacity 0.15s, transform 0.1s",
        marginTop: 8,
    },
    footer: {
        textAlign: "center", marginTop: 22,
        fontSize: 13, color: "rgba(255,255,255,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    },
    footerLink: {
        color: "#60a5fa", fontWeight: 600, textDecoration: "none",
        display: "flex", alignItems: "center", gap: 4,
    },
}

function FocusInput({ id, type = "text", placeholder, registration, hasError }) {
    const [focused, setFocused] = useState(false)
    return (
        <input
            id={id}
            type={type}
            placeholder={placeholder}
            {...registration}
            onFocus={() => setFocused(true)}
            onBlur={(e) => { setFocused(false); registration.onBlur && registration.onBlur(e) }}
            style={{
                ...S.input,
                borderColor: hasError ? "rgba(248,113,113,0.6)" : focused ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.12)",
                background: focused ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)",
            }}
            autoComplete="email"
        />
    )
}

export default function ForgotPasswordPage() {
    const [serverMessage, setServerMessage] = useState("")
    const [serverError, setServerError] = useState("")
    const [sent, setSent] = useState(false)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data) => {
        setServerError("")
        setServerMessage("")

        const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
        const json = await res.json()

        if (res.ok) {
            setServerMessage(json.message)
            setSent(true)
        } else {
            setServerError(json.error || "Ocurrió un error. Intentá de nuevo.")
        }
    }

    return (
        <div style={S.card}>
            {/* Logo */}
            <div style={S.logoWrap}>
                <div style={S.logoIcon}>
                    <img
                        src="/logo.png"
                        alt="PhotoBook"
                        className="h-12 object-contain opacity-90"
                    />
                </div>
                <div>
                    <div style={S.logoName}>PhotoBook</div>
                    <div style={S.logoSub}>Tu market profesional</div>
                </div>
            </div>

            <div style={S.divider} />

            <h1 style={S.heading}>Recuperar contraseña</h1>
            <p style={S.subheading}>
                Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            {sent ? (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                    background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 12, padding: "20px 16px", marginBottom: 20, textAlign: "center",
                }}>
                    <CheckCircle2 size={28} color="#6ee7b7" />
                    <p style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                        {serverMessage}
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div style={S.fieldWrap}>
                        <label htmlFor="email" style={S.label}>EMAIL</label>
                        <FocusInput
                            id="email" type="email" placeholder="juan@email.com"
                            registration={register("email")} hasError={!!errors.email}
                        />
                        {errors.email && (
                            <p style={S.fieldError}><AlertCircle size={11} />{errors.email.message}</p>
                        )}
                    </div>

                    {serverError && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: 12, padding: "10px 14px", marginBottom: 12,
                            fontSize: 12, color: "#fca5a5", fontWeight: 600,
                        }}>
                            <AlertCircle size={13} /> {serverError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ ...S.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
                    >
                        {isSubmitting
                            ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</>
                            : "Enviar enlace de recuperación"
                        }
                    </button>
                </form>
            )}

            <div style={S.footer}>
                <Link href="/login" style={S.footerLink}>
                    <ArrowLeft size={13} /> Volver al inicio de sesión
                </Link>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    )
}
