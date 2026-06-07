"use client"

import Link from "next/link"
import { TrendingUp, ArrowUpRight, Images, ShoppingBag, DollarSign } from "lucide-react"

const ICONS = { Images, ShoppingBag, DollarSign }

export default function StatCard({ stat }) {
    const Icon = ICONS[stat.icon]
    return (
        <Link href={stat.href} style={{ textDecoration: "none" }}>
            <div
                style={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: "20px 22px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "box-shadow 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.borderAccent, borderRadius: "16px 16px 0 0" }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", margin: "0 0 10px", textTransform: "uppercase" }}>
                            {stat.label}
                        </p>
                        <p style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>
                            {stat.value}
                        </p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {Icon && <Icon size={19} color={stat.iconColor} strokeWidth={1.8} />}
                    </div>
                </div>
                {stat.trend ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
                        <TrendingUp size={11} color="#10b981" />
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>En crecimiento</span>
                    </div>
                ) : (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <ArrowUpRight size={11} color="#94a3b8" />
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Ver detalle</span>
                    </div>
                )}
            </div>
        </Link>
    )
}
