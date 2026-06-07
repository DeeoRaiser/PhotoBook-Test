"use client"

import { HardDrive } from "lucide-react"

function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function StorageDonut({ usedBytes, maxGB }) {
    const unlimited = maxGB === -1
    const maxBytes = unlimited ? null : maxGB * 1024 * 1024 * 1024
    const pct = unlimited ? 0 : Math.min(100, (usedBytes / maxBytes) * 100)
    const free = unlimited ? null : Math.max(0, maxBytes - usedBytes)

    // SVG donut
    const R = 52
    const STROKE = 11
    const C = 2 * Math.PI * R
    const filled = unlimited ? 0 : (pct / 100) * C
    const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f97316" : "#3b82f6"

    return (
        <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <HardDrive size={13} color="#64748b" strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Almacenamiento</span>
            </div>

            {/* Chart + legend row */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {/* Donut SVG */}
                <div style={{ position: "relative", flexShrink: 0, width: 130, height: 130 }}>
                    <svg width="130" height="130" viewBox="0 0 130 130">
                        {/* Track */}
                        <circle
                            cx="65" cy="65" r={R}
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth={STROKE}
                        />
                        {/* Filled arc */}
                        {!unlimited && (
                            <circle
                                cx="65" cy="65" r={R}
                                fill="none"
                                stroke={color}
                                strokeWidth={STROKE}
                                strokeDasharray={`${filled} ${C - filled}`}
                                strokeDashoffset={C / 4}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dasharray 0.6s ease" }}
                            />
                        )}
                    </svg>
                    {/* Center label */}
                    <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                    }}>
                        {unlimited ? (
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#3b82f6", letterSpacing: "-0.01em" }}>∞</span>
                        ) : (
                            <>
                                <span style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-0.03em" }}>
                                    {pct < 1 ? "<1" : Math.round(pct)}%
                                </span>
                                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>usado</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Usado */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Utilizado</span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", paddingLeft: 14 }}>
                            {formatBytes(Number(usedBytes))}
                        </span>
                    </div>

                    {/* Disponible */}
                    {!unlimited && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f1f5f9", border: "1px solid #cbd5e1", flexShrink: 0 }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Disponible</span>
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", paddingLeft: 14 }}>
                                {formatBytes(free)}
                            </span>
                        </div>
                    )}

                    {/* Total */}
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, paddingLeft: 14 }}>
                        {unlimited ? "Sin límite de almacenamiento" : `Total: ${maxGB >= 1 ? `${maxGB} GB` : `${maxGB * 1024} MB`}`}
                    </div>

                    {/* Alerta si > 90% */}
                    {!unlimited && pct > 90 && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "#dc2626" }}>
                            ⚠ Espacio casi agotado
                        </div>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {!unlimited && (
                <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" }}>
                    <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 99,
                        transition: "width 0.6s ease",
                    }} />
                </div>
            )}
        </div>
    )
}