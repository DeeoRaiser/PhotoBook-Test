"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Sparkles, ChevronLeft, ChevronRight, Pin } from "lucide-react"
import Link from "next/link"

export default function ProTipCarousel({ tips }) {
    const [index, setIndex] = useState(0)
    const [animating, setAnimating] = useState(false)
    const [direction, setDirection] = useState("next") // "next" | "prev"
    const intervalRef = useRef(null)

    const total = tips.length

    const goTo = useCallback((nextIndex, dir = "next") => {
        if (animating || total <= 1) return
        setDirection(dir)
        setAnimating(true)
        setTimeout(() => {
            setIndex(nextIndex)
            setAnimating(false)
        }, 300)
    }, [animating, total])

    const next = useCallback(() => {
        goTo((index + 1) % total, "next")
    }, [goTo, index, total])

    const prev = useCallback(() => {
        goTo((index - 1 + total) % total, "prev")
    }, [goTo, index, total])

    // Auto-advance every 6 seconds
    useEffect(() => {
        if (total <= 1) return
        intervalRef.current = setInterval(next, 6000)
        return () => clearInterval(intervalRef.current)
    }, [next, total])

    const resetInterval = useCallback(() => {
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(next, 6000)
    }, [next])

    if (!tips || total === 0) return null

    const tip = tips[index]

    return (
        <div
            style={{
                borderRadius: 16,
                padding: "18px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                position: "relative",
                overflow: "hidden",
                userSelect: "none",
            }}
        >
            {/* Background circles */}
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
            <div style={{ position: "absolute", bottom: -30, right: 10, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={13} color="#fbbf24" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.04em" }}>
                        CONSEJO PRO
                    </span>
                    {tip.isPinned && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)",
                            borderRadius: 99, padding: "1px 7px", fontSize: 9, fontWeight: 700,
                            color: "#fbbf24", letterSpacing: "0.04em",
                        }}>
                            <Pin size={8} /> FIJO
                        </span>
                    )}
                </div>

                {/* Navigation arrows + dots */}
                {total > 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                            onClick={() => { prev(); resetInterval() }}
                            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: 0 }}
                        >
                            <ChevronLeft size={12} />
                        </button>

                        <div style={{ display: "flex", gap: 4 }}>
                            {tips.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { goTo(i, i > index ? "next" : "prev"); resetInterval() }}
                                    style={{
                                        width: i === index ? 14 : 5, height: 5,
                                        borderRadius: 99, border: "none", padding: 0, cursor: "pointer",
                                        background: i === index ? "#fbbf24" : "rgba(255,255,255,0.25)",
                                        transition: "all 0.3s ease",
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => { next(); resetInterval() }}
                            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: 0 }}
                        >
                            <ChevronRight size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content — animated slide */}
            <div
                style={{
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    opacity: animating ? 0 : 1,
                    transform: animating
                        ? `translateX(${direction === "next" ? "-12px" : "12px"})`
                        : "translateX(0)",
                }}
            >
                <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: "0 0 6px", lineHeight: 1.4 }}>
                    {tip.title}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: 1.5 }}>
                    {tip.description}
                </p>

                {tip.buttonLabel && tip.buttonUrl && (
                    <Link href={tip.buttonUrl} style={{ textDecoration: "none" }}>
                        <button style={{
                            fontSize: 11, fontWeight: 700, color: "#0f172a",
                            background: "white", border: "none", borderRadius: 8,
                            padding: "7px 14px", cursor: "pointer", fontFamily: "inherit",
                        }}>
                            {tip.buttonLabel} →
                        </button>
                    </Link>
                )}
            </div>

            {/* Progress bar */}
            {total > 1 && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.06)" }}>
                    <div
                        key={index}
                        style={{
                            height: "100%", background: "rgba(251,191,36,0.5)", borderRadius: 2,
                            animation: "tipProgress 6s linear forwards",
                        }}
                    />
                </div>
            )}

            <style>{`
                @keyframes tipProgress {
                    from { width: 0% }
                    to   { width: 100% }
                }
            `}</style>
        </div>
    )
}
