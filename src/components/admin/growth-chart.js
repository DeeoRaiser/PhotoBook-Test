"use client"

import { useState } from "react"

const TABS = [
    { key: "revenue",       label: "Ingresos ($)" },
    { key: "orders",        label: "Ventas" },
    { key: "photographers", label: "Fotógrafos" },
]

export default function GrowthChart({ data }) {
    const [active, setActive] = useState("revenue")
    const [hovered, setHovered] = useState(null)

    if (!data?.length) return null

    const values = data.map((d) => d[active])
    const max    = Math.max(...values, 1)
    const min    = 0

    // Dimensiones del gráfico
    const W = 600, H = 160
    const padL = 48, padR = 16, padT = 12, padB = 32
    const chartW = W - padL - padR
    const chartH = H - padT - padB
    const n      = data.length

    const xPos = (i) => padL + (i / (n - 1)) * chartW
    const yPos = (v) => padT + chartH - ((v - min) / (max - min)) * chartH

    // Línea SVG
    const points = data.map((d, i) => `${xPos(i)},${yPos(d[active])}`).join(" ")
    const areaPoints = [
        `${xPos(0)},${padT + chartH}`,
        ...data.map((d, i) => `${xPos(i)},${yPos(d[active])}`),
        `${xPos(n - 1)},${padT + chartH}`,
    ].join(" ")

    // Líneas de referencia horizontales
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: padT + chartH * (1 - f),
        val: Math.round((min + (max - min) * f)),
    }))

    const fmt = (v) => active === "revenue"
        ? `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`
        : String(v)

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-1 mb-4">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => { setActive(t.key); setHovered(null) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            active === t.key
                                ? "bg-neutral-900 text-white"
                                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* SVG Chart */}
            <div className="relative w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full"
                    style={{ minWidth: 300 }}
                    onMouseLeave={() => setHovered(null)}
                >
                    <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#171717" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#171717" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {gridLines.map(({ y, val }) => (
                        <g key={val}>
                            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e5e5" strokeWidth="1" />
                            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#a3a3a3">
                                {fmt(val)}
                            </text>
                        </g>
                    ))}

                    {/* Área de relleno */}
                    <polygon points={areaPoints} fill="url(#chartGrad)" />

                    {/* Línea principal */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#171717"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Puntos + hover areas */}
                    {data.map((d, i) => {
                        const x = xPos(i)
                        const y = yPos(d[active])
                        const isHov = hovered === i
                        return (
                            <g key={i}>
                                {/* Área hover invisible */}
                                <rect
                                    x={x - (chartW / n / 2)}
                                    y={padT}
                                    width={chartW / n}
                                    height={chartH}
                                    fill="transparent"
                                    onMouseEnter={() => setHovered(i)}
                                />
                                {/* Línea vertical al hover */}
                                {isHov && (
                                    <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#d4d4d4" strokeWidth="1" strokeDasharray="3,3" />
                                )}
                                {/* Punto */}
                                <circle
                                    cx={x} cy={y} r={isHov ? 5 : 3}
                                    fill={isHov ? "#171717" : "white"}
                                    stroke="#171717"
                                    strokeWidth="2"
                                    style={{ transition: "r 0.1s" }}
                                />
                                {/* Tooltip */}
                                {isHov && (
                                    <g>
                                        <rect
                                            x={Math.min(x - 30, W - padR - 72)}
                                            y={y - 34}
                                            width={64}
                                            height={22}
                                            rx={4}
                                            fill="#171717"
                                        />
                                        <text
                                            x={Math.min(x - 30, W - padR - 72) + 32}
                                            y={y - 18}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fill="white"
                                            fontWeight="600"
                                        >
                                            {fmt(d[active])}
                                        </text>
                                    </g>
                                )}
                                {/* Label mes */}
                                <text x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#a3a3a3">
                                    {d.label}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}
