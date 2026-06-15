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
        margin: "0 0 20px",
    },
    // ── OAuth buttons ──────────────────────────────────────────────────
    oauthWrap: {
        display: "flex", flexDirection: "column", gap: 10, marginBottom: 20,
    },
    oauthBtn: {
        width: "100%", padding: "11px 0",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 12, color: "white",
        fontSize: 14, fontWeight: 600, cursor: "pointer",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "background 0.15s, border-color 0.15s",
    },
    orRow: {
        display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
    },
    orLine: {
        flex: 1, height: 1, background: "rgba(255,255,255,0.08)",
    },
    orText: {
        fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)",
        letterSpacing: "0.08em",
    },
    // ── Fields ─────────────────────────────────────────────────────────
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

// SVG logos inline para no depender de librerías externas
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
    )
}

function FacebookIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
    )
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
                onFocus={(e) => { setFocused(true); registration.onBlur?.(e) }}
                onBlur={(e) => { setFocused(false); registration.onBlur?.(e) }}
                style={{
                    ...S.input,
                    paddingRight: isPassword ? 45 : 14,
                    ...(focused ? S.inputFocus : {}),
                    borderColor: hasError
                        ? "rgba(248,113,113,0.6)"
                        : focused ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.12)",
                }}
                autoComplete={isPassword ? "current-password" : "email"}
            />
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: "absolute", right: 12, top: "50%",
                        transform: "translateY(-50%)", background: "transparent",
                        border: "none", cursor: "pointer", display: "flex",
                        alignItems: "center", color: "rgba(255,255,255,0.45)", padding: 0,
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
    const [oauthLoading, setOauthLoading] = useState(null) // "google" | "facebook" | null

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    const handleOAuth = async (provider) => {
        setOauthLoading(provider)
        setServerError("")
        try {
            await signIn(provider, { callbackUrl: "/dashboard" })
        } catch {
            setServerError("Error al conectar con " + provider + ". Intentá de nuevo.")
            setOauthLoading(null)
        }
    }

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
                    <img src="/logo.png" alt="PhotoBook" className="h-12 object-contain opacity-90" />
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

            {/* ── Botones OAuth ── */}
            <div style={S.oauthWrap}>
                <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    disabled={!!oauthLoading}
                    style={{ ...S.oauthBtn, opacity: oauthLoading ? 0.6 : 1 }}
                >
                    {oauthLoading === "google"
                        ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        : <GoogleIcon />
                    }
                    Continuar con Google
                </button>

              {/*   <button
                    type="button"
                    onClick={() => handleOAuth("facebook")}
                    disabled={!!oauthLoading}
                    style={{ ...S.oauthBtn, opacity: oauthLoading ? 0.6 : 1 }}
                >
                    {oauthLoading === "facebook"
                        ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        : <FacebookIcon />
                    }
                    Continuar con Facebook
                </button> */}
            </div>

            {/* Aviso legal OAuth */}
            <p style={{
                fontSize: 11, color: "rgba(255,255,255,0.25)",
                textAlign: "center", lineHeight: 1.6,
                margin: "-8px 0 16px",
            }}>
                Al continuar aceptás nuestros{" "}
                <a href="/terms" target="_blank" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>
                    Términos
                </a>
                {" "}y{" "}
                <a href="/privacy" target="_blank" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>
                    Política de Privacidad
                </a>
            </p>

            {/* ── Separador ── */}
            <div style={S.orRow}>
                <div style={S.orLine} />
                <span style={S.orText}>O CON EMAIL</span>
                <div style={S.orLine} />
            </div>

            {/* ── Form credentials ── */}
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
                    disabled={isSubmitting || !!oauthLoading}
                    style={{ ...S.submitBtn, opacity: (isSubmitting || oauthLoading) ? 0.7 : 1 }}
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