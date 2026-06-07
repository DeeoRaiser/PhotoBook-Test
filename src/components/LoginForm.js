"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"

const schema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Ingresá tu contraseña"),
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
        margin: "0 0 24px",
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
    inputFocus: {
        borderColor: "rgba(59,130,246,0.6)",
        background: "rgba(255,255,255,0.1)",
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
    },
    footerLink: {
        color: "#60a5fa", fontWeight: 600, textDecoration: "none",
    },
}

function FocusInput({ id, type = "text", placeholder, registration, hasError }) {
    const [focused, setFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === "password"

    return (
        <div style={{ position: "relative" }}>
            <input
                id={id}
                type={isPassword ? (showPassword ? "text" : "password") : type}
                placeholder={placeholder}
                {...registration}
                onFocus={(e) => {
                    setFocused(true)
                    registration.onBlur && registration.onBlur(e)
                }}
                onBlur={(e) => {
                    setFocused(false)
                    registration.onBlur && registration.onBlur(e)
                }}
                style={{
                    ...S.input,
                    paddingRight: isPassword ? 45 : 14,
                    ...(focused ? S.inputFocus : {}),
                    borderColor: hasError
                        ? "rgba(248,113,113,0.6)"
                        : focused
                            ? "rgba(59,130,246,0.6)"
                            : "rgba(255,255,255,0.12)",
                }}
                autoComplete={isPassword ? "current-password" : "email"}
            />

            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.45)",
                        padding: 0,
                    }}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    )
}

export default function LoginForm({ registered }) {
    const router = useRouter()
    const [serverError, setServerError] = useState("")
    const [emailNotVerified, setEmailNotVerified] = useState(false)
    const [resendEmail, setResendEmail] = useState("")
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSuccess, setResendSuccess] = useState("")

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data) => {
        setServerError("")
        setEmailNotVerified(false)
        setResendSuccess("")

        const res = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        })

        if (res?.error) {
            // NextAuth v5: el código del error custom viene en res.code
            if (res.code === "EMAIL_NOT_VERIFIED" || res.error?.includes?.("EMAIL_NOT_VERIFIED")) {
                setEmailNotVerified(true)
                setResendEmail(data.email)
            } else {
                setServerError("Email o contraseña incorrectos")
            }
            return
        }

        router.push("/dashboard")
        router.refresh()
    }

    const handleResend = async () => {
        setResendLoading(true)
        setResendSuccess("")
        try {
            const res = await fetch("/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resendEmail }),
            })
            const data = await res.json()
            setResendSuccess(data.message || "Código reenviado.")
        } catch {
            setResendSuccess("Error al reenviar. Intentá de nuevo.")
        } finally {
            setResendLoading(false)
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

            <h1 style={S.heading}>Bienvenido de vuelta</h1>
            <p style={S.subheading}>Iniciá sesión en tu panel de fotógrafo</p>

            {/* Success banner */}
            {registered && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 12, padding: "10px 14px", marginBottom: 20,
                    fontSize: 12, color: "#6ee7b7", fontWeight: 600,
                }}>
                    <CheckCircle2 size={14} />
                    ¡Cuenta creada! Ya podés iniciar sesión.
                </div>
            )}

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

                <div style={S.fieldWrap}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <label htmlFor="password" style={{ ...S.label, marginBottom: 0 }}>CONTRASEÑA</label>
                        <Link href="/forgot-password" style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, textDecoration: "none" }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <FocusInput
                        id="password" type="password" placeholder="••••••••"
                        registration={register("password")} hasError={!!errors.password}
                    />
                    {errors.password && (
                        <p style={S.fieldError}><AlertCircle size={11} />{errors.password.message}</p>
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

                {emailNotVerified && (
                    <div style={{
                        background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
                        borderRadius: 12, padding: "12px 14px", marginBottom: 12,
                        fontSize: 12, color: "#fde68a",
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                            <AlertCircle size={13} /> Tu email no está verificado
                        </div>
                        <p style={{ margin: "0 0 8px", color: "rgba(253,230,138,0.8)" }}>
                            Revisá tu bandeja de entrada o reenviá el código de verificación.
                        </p>
                        {resendSuccess ? (
                            <p style={{ margin: 0, color: "#6ee7b7", fontWeight: 600 }}>{resendSuccess}</p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                style={{
                                    background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)",
                                    borderRadius: 8, padding: "6px 12px", color: "#fde68a",
                                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                    display: "flex", alignItems: "center", gap: 6,
                                }}
                            >
                                {resendLoading
                                    ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</>
                                    : "Reenviar email de verificación"
                                }
                            </button>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ ...S.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
                >
                    {isSubmitting
                        ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Ingresando...</>
                        : "Iniciar sesión"
                    }
                </button>
            </form>

            <div style={S.footer}>
                ¿No tenés cuenta?{" "}
                <Link href="/register" style={S.footerLink}>Registrate</Link>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    )
}