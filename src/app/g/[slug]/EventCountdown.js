"use client"

/**
 * src/app/g/[slug]/EventCountdown.js
 * ─────────────────────────────────────────────────────────────
 * Pantalla de cuenta regresiva para galerías de evento.
 * Se muestra cuando eventStartsAt > ahora.
 *
 * Al llegar a 00:00:00 recarga la página automáticamente
 * para mostrar la galería real.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from "react"

function calcRemaining(target) {
    const diff = Math.max(0, new Date(target) - Date.now())
    const totalSeconds = Math.floor(diff / 1000)
    return {
        days:    Math.floor(totalSeconds / 86400),
        hours:   Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        done:    diff === 0,
    }
}

function pad(n) {
    return String(n).padStart(2, "0")
}

export default function EventCountdown({
    title,
    description,
    coverImage,
    eventStartsAt,
    photographerName,
    photographerAvatar,
}) {
    // Inicializamos en null para que SSR y cliente rendericen lo mismo.
    // El countdown real arranca en el primer useEffect (solo cliente).
    const [remaining, setRemaining] = useState(null)
    const [formattedDate, setFormattedDate] = useState("")

    const tick = useCallback(() => {
        const next = calcRemaining(eventStartsAt)
        setRemaining(next)
        if (next.done) {
            setTimeout(() => window.location.reload(), 1200)
        }
    }, [eventStartsAt])

    useEffect(() => {
        // Calcular inmediatamente al montar (evita el salto de 1 segundo)
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [tick])

    useEffect(() => {
        setFormattedDate(
            new Date(eventStartsAt).toLocaleString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        )
    }, [eventStartsAt])

    const hasDays = remaining ? remaining.days > 0 : false

    return (
        <div style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: coverImage
                ? "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
                : "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
            padding: "32px 16px",
        }}>

            {/* Fondo con imagen de portada si existe */}
            {coverImage && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${coverImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.15,
                    zIndex: 0,
                }} />
            )}

            {/* Partículas decorativas */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                        position: "absolute",
                        width: `${80 + i * 60}px`,
                        height: `${80 + i * 60}px`,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.06)",
                        top: `${10 + i * 12}%`,
                        left: `${-5 + i * 18}%`,
                        animation: `pulse-ring ${4 + i}s ease-in-out infinite alternate`,
                    }} />
                ))}
            </div>

            {/* Contenido principal */}
            <div style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "32px",
                maxWidth: "580px",
                width: "100%",
                textAlign: "center",
            }}>

                {/* Fotógrafo */}
                {photographerName && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {photographerAvatar ? (
                            <img
                                src={photographerAvatar}
                                alt={photographerName}
                                style={{
                                    width: "36px", height: "36px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid rgba(255,255,255,0.25)",
                                }}
                            />
                        ) : (
                            <div style={{
                                width: "36px", height: "36px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "14px", fontWeight: "700", color: "white",
                                border: "2px solid rgba(255,255,255,0.25)",
                                flexShrink: 0,
                            }}>
                                {photographerName[0].toUpperCase()}
                            </div>
                        )}
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
                            {photographerName}
                        </span>
                    </div>
                )}

                {/* Título y descripción */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "100px",
                        padding: "4px 14px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "rgba(255,255,255,0.75)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        alignSelf: "center",
                    }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f97316", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />
                        Próximamente
                    </div>

                    <h1 style={{
                        fontSize: "clamp(24px, 5vw, 42px)",
                        fontWeight: "800",
                        color: "white",
                        margin: 0,
                        lineHeight: 1.15,
                        letterSpacing: "-0.02em",
                        textShadow: "0 2px 24px rgba(0,0,0,0.4)",
                    }}>
                        {title}
                    </h1>

                    {description && (
                        <p style={{
                            fontSize: "15px",
                            color: "rgba(255,255,255,0.6)",
                            margin: 0,
                            lineHeight: 1.6,
                            maxWidth: "420px",
                            alignSelf: "center",
                        }}>
                            {description}
                        </p>
                    )}
                </div>

                {/* Cuenta regresiva — solo cliente, remaining es null durante SSR */}
                {remaining && (
                <div style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}>
                    {hasDays && (
                        <>
                            <TimeUnit value={remaining.days} label="días" big />
                            <Separator />
                        </>
                    )}
                    <TimeUnit value={remaining.hours} label="horas" big={!hasDays} />
                    <Separator />
                    <TimeUnit value={remaining.minutes} label="min" big={!hasDays} />
                    <Separator />
                    <TimeUnit value={remaining.seconds} label="seg" big={!hasDays} pulse />
                </div>
                )}

                {/* Mensaje al finalizar */}
                {remaining?.done && (
                    <div style={{
                        background: "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "16px",
                        padding: "16px 24px",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "600",
                        animation: "fade-in 0.4s ease",
                    }}>
                        ¡El evento comenzó! Abriendo la galería…
                    </div>
                )}

                {/* Fecha legible — renderizada solo en cliente para evitar hydration mismatch */}
                {!remaining?.done && formattedDate && (
                    <p style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.4)",
                        margin: 0,
                    }}>
                        {formattedDate}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div style={{
                position: "absolute",
                bottom: "20px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.2)",
                zIndex: 1,
            }}>
                Powered by <strong style={{ color: "rgba(255,255,255,0.35)" }}>photobook.com.ar</strong>
            </div>

            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.15); opacity: 0; }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes count-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                }
            `}</style>
        </div>
    )
}

function TimeUnit({ value, label, big, pulse }) {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
        }}>
            <div style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "16px",
                padding: big ? "16px 20px" : "12px 16px",
                minWidth: big ? "80px" : "64px",
                textAlign: "center",
                animation: pulse ? "count-pulse 1s ease-in-out infinite" : "none",
            }}>
                <span style={{
                    fontSize: big ? "clamp(32px, 6vw, 52px)" : "clamp(24px, 4vw, 40px)",
                    fontWeight: "800",
                    color: "white",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    display: "block",
                    fontVariantNumeric: "tabular-nums",
                }}>
                    {pad(value)}
                </span>
            </div>
            <span style={{
                fontSize: "10px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
            }}>
                {label}
            </span>
        </div>
    )
}

function Separator() {
    return (
        <span style={{
            fontSize: "clamp(24px, 4vw, 40px)",
            fontWeight: "800",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "20px",
            animation: "blink 1.2s ease-in-out infinite",
            lineHeight: 1,
        }}>
            :
        </span>
    )
}
