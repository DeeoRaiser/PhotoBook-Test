"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react"

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
        margin: "0 0 28px",
    },
    codeWrap: {
        display: "flex", gap: 10, justifyContent: "center",
        marginBottom: 24,
    },
    codeInput: {
        width: 48, height: 56,
        textAlign: "center",
        fontSize: 22, fontWeight: 800, color: "white",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12, outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s",
        caretColor: "transparent",
    },
    submitBtn: {
        width: "100%", padding: "12px 0",
        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        color: "white", border: "none", borderRadius: 12,
        fontSize: 14, fontWeight: 700, cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    },
    successBox: {
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 16,
        fontSize: 13, color: "#86efac", fontWeight: 600,
    },
    errorBox: {
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: 12, padding: "10px 14px", marginBottom: 12,
        fontSize: 12, color: "#fca5a5", fontWeight: 600,
    },
    footer: {
        textAlign: "center", marginTop: 22,
        fontSize: 13, color: "rgba(255,255,255,0.35)",
    },
    resendBtn: {
        background: "none", border: "none", color: "#60a5fa",
        fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        fontSize: 13, padding: 0,
    },
}

export default function VerifyEmailContent() {
    const router = useRouter()
    const params = useSearchParams()

    // Puede llegar por query (?token=XXXXXX&email=...) desde el link del mail
    const tokenFromUrl = params.get("token") || ""
    const emailFromUrl = params.get("email") || ""

    const [digits, setDigits] = useState(["", "", "", "", "", ""])
    const [email, setEmail] = useState(emailFromUrl)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")
    const inputRefs = useRef([])

    // Si llegó con token completo por URL, verificar automáticamente
    useEffect(() => {
        if (tokenFromUrl.length === 6 && emailFromUrl) {
            setDigits(tokenFromUrl.split(""))
            verify(tokenFromUrl, emailFromUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function verify(code, emailToVerify) {
        setLoading(true)
        setError("")
        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToVerify, code }),
            })
            const json = await res.json()
            if (res.ok) {
                setSuccess(true)
                setTimeout(() => router.push("/login?verified=true"), 2500)
            } else {
                setError(json.error || "Error al verificar")
            }
        } finally {
            setLoading(false)
        }
    }

    function handleDigit(i, val) {
        const clean = val.replace(/\D/g, "").slice(-1)
        const next = [...digits]
        next[i] = clean
        setDigits(next)
        if (clean && i < 5) inputRefs.current[i + 1]?.focus()
    }

    function handleKeyDown(i, e) {
        if (e.key === "Backspace" && !digits[i] && i > 0) {
            inputRefs.current[i - 1]?.focus()
        }
    }

    function handlePaste(e) {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
        if (pasted.length === 6) {
            setDigits(pasted.split(""))
            inputRefs.current[5]?.focus()
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const code = digits.join("")
        if (code.length !== 6 || !email) return
        await verify(code, email)
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

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(59,130,246,0.2)", display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <Mail size={18} color="#60a5fa" />
                </div>
                <h1 style={S.heading}>Verificá tu cuenta</h1>
            </div>
            <p style={S.subheading}>
                Ingresá el código de 6 dígitos que te enviamos al correo
                {email ? <> <strong style={{ color: "rgba(255,255,255,0.6)" }}>{email}</strong></> : ""}.
            </p>

            {success ? (
                <div style={S.successBox}>
                    <CheckCircle size={16} />
                    ¡Cuenta verificada! Redirigiendo al login…
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Inputs de dígitos */}
                    <div style={S.codeWrap} onPaste={handlePaste}>
                        {digits.map((d, i) => (
                            <input
                                key={i}
                                ref={el => inputRefs.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={d}
                                onChange={e => handleDigit(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                style={{
                                    ...S.codeInput,
                                    borderColor: error
                                        ? "rgba(248,113,113,0.6)"
                                        : d
                                            ? "rgba(59,130,246,0.6)"
                                            : "rgba(255,255,255,0.12)",
                                    background: d ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.07)",
                                }}
                            />
                        ))}
                    </div>

                    {/* Email (editable si no vino por URL) */}
                    {!emailFromUrl && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={{
                                display: "block", fontSize: 12, fontWeight: 700,
                                color: "rgba(255,255,255,0.6)", marginBottom: 6,
                                letterSpacing: "0.02em",
                            }}>TU EMAIL</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="juan@email.com"
                                style={{
                                    width: "100%", padding: "11px 14px",
                                    fontSize: 14, fontWeight: 500, color: "white",
                                    background: "rgba(255,255,255,0.07)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 12, outline: "none",
                                    fontFamily: "inherit", boxSizing: "border-box",
                                }}
                            />
                        </div>
                    )}

                    {error && (
                        <div style={S.errorBox}>
                            <AlertCircle size={13} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || digits.join("").length !== 6}
                        style={{ ...S.submitBtn, opacity: (loading || digits.join("").length !== 6) ? 0.6 : 1 }}
                    >
                        {loading
                            ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Verificando...</>
                            : "Verificar cuenta"
                        }
                    </button>
                </form>
            )}

            <div style={S.footer}>
                ¿No recibiste el mail?{" "}
                <button
                    style={S.resendBtn}
                    onClick={() => router.push("/register")}
                >
                    Intentá registrarte de nuevo
                </button>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    )
}