"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {    Loader2,    AlertCircle,    CheckCircle,    Eye,    EyeOff} from "lucide-react"



const schema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
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
    fieldWrap: { marginBottom: 14 },
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
        marginTop: 8,
    },
    footer: {
        textAlign: "center", marginTop: 22,
        fontSize: 13, color: "rgba(255,255,255,0.35)",
    },
    footerLink: {
        color: "#60a5fa", fontWeight: 600, textDecoration: "none",
    },
    successBox: {
        display: "flex", alignItems: "flex-start", gap: 10,
        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 16,
        fontSize: 13, color: "#86efac", fontWeight: 500, lineHeight: 1.5,
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
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                    setFocused(false)
                    registration.onBlur?.(e)
                }}
                style={{
                    ...S.input,
                    paddingRight: isPassword ? 46 : 14,
                    borderColor: hasError
                        ? "rgba(248,113,113,0.6)"
                        : focused
                            ? "rgba(59,130,246,0.6)"
                            : "rgba(255,255,255,0.12)",
                    background: focused
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(255,255,255,0.07)",
                }}
                autoComplete={
                    isPassword ? "new-password" : "email"
                }
            />

            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: "absolute",
                        top: "50%",
                        right: 14,
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: showPassword
                            ? "rgba(255,255,255,0.75)"
                            : "rgba(255,255,255,0.35)",
                        transition: "all 0.2s ease",
                    }}
                >
                    {showPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />
                    }
                </button>
            )}
        </div>
    )
}

export default function RegisterPage() {
    const router = useRouter()
    const [serverError, setServerError] = useState("")
    const [registered, setRegistered] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState("")

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data) => {
        setServerError("")
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
        if (res.ok) {
            setRegisteredEmail(data.email)
            setRegistered(true)
        } else {
            const json = await res.json()
            setServerError(json.error || "Error al registrarse")
        }
    }

    if (registered) {
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

                {/* Icono */}
                <div
                    style={{
                        width: 78,
                        height: 78,
                        borderRadius: 22,
                        background:
                            "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))",
                        border: "1px solid rgba(74,222,128,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                        boxShadow: "0 10px 30px rgba(34,197,94,0.15)",
                    }}
                >
                    <CheckCircle size={40} color="#4ade80" />
                </div>

                {/* Título */}
                <h1
                    style={{
                        ...S.heading,
                        textAlign: "center",
                        fontSize: 28,
                        marginBottom: 12,
                    }}
                >
                    Revisá tu correo 📩
                </h1>

                {/* Texto */}
                <p
                    style={{
                        ...S.subheading,
                        textAlign: "center",
                        margin: "0 0 28px",
                        lineHeight: 1.8,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.55)",
                    }}
                >
                    Te enviamos un código de verificación a:
                    <br />

                    <span
                        style={{
                            display: "inline-block",
                            marginTop: 10,
                            padding: "10px 14px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "white",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {registeredEmail}
                    </span>
                </p>

                {/* Aviso importante */}
                <div
                    style={{
                        background: "rgba(251,191,36,0.10)",
                        border: "1px solid rgba(251,191,36,0.22)",
                        borderRadius: 16,
                        padding: "16px 18px",
                        marginBottom: 24,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                borderRadius: 10,
                                background: "rgba(251,191,36,0.16)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                            }}
                        >
                            ⚠️
                        </div>

                        <div>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#fde68a",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    marginBottom: 6,
                                }}
                            >
                                ¿No encontrás el email?
                            </p>

                            <p
                                style={{
                                    margin: 0,
                                    color: "rgba(255,255,255,0.65)",
                                    fontSize: 12,
                                    lineHeight: 1.7,
                                }}
                            >
                                Revisá tu carpeta de{" "}
                                <strong style={{ color: "#fff" }}>
                                    Spam, Promociones o Correo no deseado
                                </strong>.
                                <br />
                                Algunos proveedores pueden demorar unos minutos en
                                entregar el mensaje.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={() =>
                        router.push(
                            `/verify-email?email=${encodeURIComponent(
                                registeredEmail
                            )}`
                        )
                    }
                    style={{
                        ...S.submitBtn,
                        height: 52,
                        fontSize: 15,
                    }}
                >
                    Verificar mi cuenta
                </button>

                {/* Texto adicional */}
                <p
                    style={{
                        textAlign: "center",
                        marginTop: 18,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.35)",
                        lineHeight: 1.7,
                    }}
                >
                    El código de verificación expira en 24 horas.
                </p>

                {/* Footer */}
                <div style={S.footer}>
                    ¿Ya verificaste tu cuenta?{" "}
                    <Link href="/login" style={S.footerLink}>
                        Iniciá sesión
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div style={S.card}>
            {/* Logo */}
            <div style={S.logoWrap}>
                <div style={S.logoIcon}>
                    <img
                        src="/logo.png"
                        alt="PhotoBook"
                        style={{
                            width: 38,
                            height: 38,
                            objectFit: "contain",
                        }}
                    />
                </div>
                <div>
                    <div style={S.logoName}>PhotoBook</div>
                    <div style={S.logoSub}>Tu market profesional</div>
                </div>
            </div>

            <div style={S.divider} />

            <h1 style={S.heading}>Crear cuenta</h1>
            <p style={S.subheading}>Registrate como fotógrafo en PhotoBook</p>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={S.fieldWrap}>
                    <label htmlFor="name" style={S.label}>NOMBRE COMPLETO</label>
                    <FocusInput
                        id="name" placeholder="Juan García"
                        registration={register("name")} hasError={!!errors.name}
                    />
                    {errors.name && (
                        <p style={S.fieldError}><AlertCircle size={11} />{errors.name.message}</p>
                    )}
                </div>

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
                    <label htmlFor="password" style={S.label}>CONTRASEÑA</label>
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

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ ...S.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
                >
                    {isSubmitting
                        ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Creando cuenta...</>
                        : "Crear cuenta"
                    }
                </button>
            </form>

            <div style={S.footer}>
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" style={S.footerLink}>Iniciá sesión</Link>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    )
}