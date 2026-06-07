"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react"

const schema = z.object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
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
        height: 1, background: "rgba(255,255,255,0.08)",
        margin: "0 0 28px",
    },
    heading: {
        fontSize: 20, fontWeight: 800, color: "white",
        letterSpacing: "-0.02em", margin: "0 0 4px",
    },
    subheading: {
        fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 24px",
    },
    fieldWrap: { marginBottom: 16 },
    label: {
        display: "block", fontSize: 12, fontWeight: 700,
        color: "rgba(255,255,255,0.6)", marginBottom: 6,
        letterSpacing: "0.02em",
    },
    inputWrap: { position: "relative" },
    input: {
        width: "100%", padding: "11px 42px 11px 14px",
        fontSize: 14, fontWeight: 500, color: "white",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12, outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s",
        boxSizing: "border-box",
    },
    eyeBtn: {
        position: "absolute", right: 12, top: "50%",
        transform: "translateY(-50%)",
        background: "none", border: "none",
        color: "rgba(255,255,255,0.3)", cursor: "pointer",
        display: "flex", alignItems: "center", padding: 0,
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
        transition: "opacity 0.15s",
        marginTop: 8,
    },
    footer: {
        textAlign: "center", marginTop: 22,
        fontSize: 13,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    },
    footerLink: {
        color: "#60a5fa", fontWeight: 600, textDecoration: "none",
        display: "flex", alignItems: "center", gap: 4,
    },
}

function PasswordInput({ id, label, registration, hasError, errorMsg }) {
    const [focused, setFocused] = useState(false)
    const [show, setShow] = useState(false)
    return (
        <div style={S.fieldWrap}>
            <label htmlFor={id} style={S.label}>{label}</label>
            <div style={S.inputWrap}>
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    {...registration}
                    onFocus={() => setFocused(true)}
                    onBlur={(e) => { setFocused(false); registration.onBlur && registration.onBlur(e) }}
                    style={{
                        ...S.input,
                        borderColor: hasError ? "rgba(248,113,113,0.6)" : focused ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.12)",
                        background: focused ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)",
                    }}
                    autoComplete="new-password"
                />
                <button type="button" style={S.eyeBtn} onClick={() => setShow(v => !v)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {hasError && (
                <p style={S.fieldError}><AlertCircle size={11} />{errorMsg}</p>
            )}
        </div>
    )
}

export default function ResetPasswordContent() {
    const params = useSearchParams()
    const router = useRouter()
    const token = params.get("token")
    const email = params.get("email")

    const [serverError, setServerError] = useState("")
    const [success, setSuccess] = useState(false)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    if (!token || !email) {
        return (
            <div style={S.card}>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <AlertCircle size={40} color="#f87171" style={{ marginBottom: 16 }} />
                    <h1 style={{ ...S.heading, textAlign: "center", marginBottom: 8 }}>Enlace inválido</h1>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                        Este enlace es inválido o ya fue utilizado.
                    </p>
                    <Link href="/forgot-password" style={S.footerLink}>
                        Solicitar uno nuevo
                    </Link>
                </div>
            </div>
        )
    }

    const onSubmit = async (data) => {
        setServerError("")
        const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, token, password: data.password }),
        })
        const json = await res.json()

        if (res.ok) {
            setSuccess(true)
            setTimeout(() => router.push("/login"), 3000)
        } else {
            setServerError(json.error || "Ocurrió un error. Intentá de nuevo.")
        }
    }

    return (
        <div style={S.card}>
            {/* Logo */}
            <div style={S.logoWrap}>
                <div style={S.logoIcon}>
                    <img src="/logo.png" alt="PhotoBook" className="h-12 object-contain opacity-90" />
                </div>
                <div>
                    <div style={S.logoName}>PhotoBook</div>
                    <div style={S.logoSub}>Tu market profesional</div>
                </div>
            </div>

            <div style={S.divider} />

            <h1 style={S.heading}>Nueva contraseña</h1>
            <p style={S.subheading}>Elegí una contraseña segura para tu cuenta.</p>

            {success ? (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                    background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 12, padding: "20px 16px", textAlign: "center",
                }}>
                    <CheckCircle2 size={28} color="#6ee7b7" />
                    <p style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                        ¡Contraseña actualizada! Redirigiendo al login...
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <PasswordInput
                        id="password"
                        label="NUEVA CONTRASEÑA"
                        registration={register("password")}
                        hasError={!!errors.password}
                        errorMsg={errors.password?.message}
                    />
                    <PasswordInput
                        id="confirmPassword"
                        label="CONFIRMAR CONTRASEÑA"
                        registration={register("confirmPassword")}
                        hasError={!!errors.confirmPassword}
                        errorMsg={errors.confirmPassword?.message}
                    />

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
                            ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                            : "Guardar nueva contraseña"
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
