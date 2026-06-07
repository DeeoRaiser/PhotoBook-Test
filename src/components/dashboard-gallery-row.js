"use client"

import Link from "next/link"
import { Images, Globe, Lock, ChevronRight } from "lucide-react"

export default function GalleryRow({ gallery, isLast }) {
    return (
        <Link href={`/dashboard/galleries/${gallery.id}`} style={{ textDecoration: "none" }}>
            <div
                style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 22px",
                    borderBottom: isLast ? "none" : "1px solid #f8fafc",
                    transition: "background 0.1s",
                    cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Images size={15} color="#64748b" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {gallery.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{gallery._count.photos} fotos</span>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>·</span>
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            fontSize: 10, fontWeight: 600,
                            color: gallery.isPublic ? "#059669" : "#64748b",
                            background: gallery.isPublic ? "#ecfdf5" : "#f8fafc",
                            border: `1px solid ${gallery.isPublic ? "#a7f3d0" : "#e2e8f0"}`,
                            padding: "1px 6px", borderRadius: 6,
                        }}>
                            {gallery.isPublic ? <><Globe size={9} /> Pública</> : <><Lock size={9} /> Privada</>}
                        </span>
                    </div>
                </div>
                <ChevronRight size={14} color="#cbd5e1" />
            </div>
        </Link>
    )
}
