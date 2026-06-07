"use client"

import { useState, useEffect, useMemo } from "react"
import { Link2, TrendingUp, MousePointerClick, Eye, ExternalLink, ChevronDown, ChevronUp, BarChart2, CalendarDays } from "lucide-react"

const LINK_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16"]

// ── Filtros de fecha disponibles ─────────────────────────────────────────────
const DATE_PRESETS = [
    { key: "today",   label: "Hoy" },
    { key: "week",    label: "Semana" },
    { key: "month",   label: "Mes" },
    { key: "custom",  label: "Fechas" },
]

function getPresetRange(key) {
    const now = new Date()
    const pad = s => String(s).padStart(2, "0")
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

    if (key === "today") {
        const t = fmt(now)
        return { from: t, to: t }
    }
    if (key === "week") {
        const mon = new Date(now)
        mon.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
        return { from: fmt(mon), to: fmt(now) }
    }
    if (key === "month") {
        const first = new Date(now.getFullYear(), now.getMonth(), 1)
        return { from: fmt(first), to: fmt(now) }
    }
    return null
}

// ── Selector de fechas ───────────────────────────────────────────────────────
function DateRangeSelector({ activePreset, customFrom, customTo, onPreset, onCustomChange }) {
    const isCustom = activePreset === "custom"

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {DATE_PRESETS.map(({ key, label }) => {
                const active = activePreset === key
                return (
                    <button
                        key={key}
                        onClick={() => onPreset(key)}
                        style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            border: `1.5px solid ${active ? "#3b82f6" : "#e2e8f0"}`,
                            background: active ? "#eff6ff" : "white",
                            color: active ? "#3b82f6" : "#64748b",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all .15s",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        {key === "custom" && <CalendarDays size={11} />}
                        {label}
                    </button>
                )
            })}

            {isCustom && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 2 }}>
                    <input
                        type="date"
                        value={customFrom}
                        max={customTo || undefined}
                        onChange={e => onCustomChange("from", e.target.value)}
                        style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            border: "1.5px solid #bfdbfe",
                            fontSize: 11,
                            color: "#0f172a",
                            fontFamily: "inherit",
                            background: "#f8fafc",
                            outline: "none",
                        }}
                    />
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>→</span>
                    <input
                        type="date"
                        value={customTo}
                        min={customFrom || undefined}
                        onChange={e => onCustomChange("to", e.target.value)}
                        style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            border: "1.5px solid #bfdbfe",
                            fontSize: 11,
                            color: "#0f172a",
                            fontFamily: "inherit",
                            background: "#f8fafc",
                            outline: "none",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

// ── Spark de barras ──────────────────────────────────────────────────────────
function SparkBars({ data, color = "#3b82f6", height = 28 }) {
    if (!data?.length) return null
    const max = Math.max(...data.map(d => d.clicks), 1)
    const w = 5, gap = 2
    const totalW = data.length * (w + gap) - gap
    return (
        <svg width={totalW} height={height} style={{ display: "block" }}>
            {data.map((d, i) => {
                const barH = Math.max(2, (d.clicks / max) * (height - 2))
                return (
                    <rect key={d.date} x={i*(w+gap)} y={height-barH} width={w} height={barH} rx={1.5}
                        fill={d.clicks > 0 ? color : "#e2e8f0"} opacity={d.clicks > 0 ? 1 : 0.5} />
                )
            })}
        </svg>
    )
}

// ── Gráfico de línea ─────────────────────────────────────────────────────────
function LineChart({ data, height = 110 }) {
    if (!data?.length) return null
    const max = Math.max(...data.map(d => d.clicks), 1)
    const pad = { t: 8, r: 8, b: 22, l: 26 }
    const vbW = 560

    const W = vbW - pad.l - pad.r
    const H = height - pad.t - pad.b
    const pts = data.map((d, i) => ({
        x: pad.l + (i / Math.max(data.length - 1, 1)) * W,
        y: pad.t + H - (d.clicks / max) * H,
        ...d,
    }))
    const path = pts.map((p, i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    const area = `${path} L${pts[pts.length-1].x.toFixed(1)},${(pad.t+H).toFixed(1)} L${pad.l},${(pad.t+H).toFixed(1)} Z`
    const labels = [0, Math.floor(data.length/2), data.length-1].map(i => ({ x: pts[i]?.x, lbl: data[i]?.date?.slice(5) }))

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${vbW} ${height}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
            <defs>
                <linearGradient id="ltg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.16"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
            </defs>
            {[0,0.5,1].map((f,i) => <line key={i} x1={pad.l} y1={pad.t+H-f*H} x2={pad.l+W} y2={pad.t+H-f*H} stroke="#f1f5f9" strokeWidth="1"/>)}
            <path d={area} fill="url(#ltg)"/>
            <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            {pts.map((p,i) => p.clicks>0 && <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5"/>)}
            {labels.map((l,i) => l.x!==undefined && (
                <text key={i} x={l.x} y={height-4} textAnchor="middle" style={{fontSize:9,fill:"#94a3b8",fontFamily:"inherit"}}>{l.lbl}</text>
            ))}
            <text x={pad.l-4} y={pad.t+4} textAnchor="end" style={{fontSize:9,fill:"#94a3b8",fontFamily:"inherit"}}>{max}</text>
        </svg>
    )
}

// ── Row de un link ───────────────────────────────────────────────────────────
function LinkRow({ link, idx, isActive, sparkDays, clicksByLink, onToggle }) {
    const color = LINK_COLORS[idx % LINK_COLORS.length]
    const maxClicks = link._max
    const pct = maxClicks > 0 ? (link.clicks / maxClicks) * 100 : 0

    const linkDays = useMemo(() => {
        const map = {}
        for (const r of (clicksByLink || []).filter(r => r.linkId === link.id)) {
            map[r.date] = (map[r.date] || 0) + r.clicks
        }
        return (sparkDays || []).map(d => ({ date: d.date, clicks: map[d.date] ?? 0 }))
    }, [clicksByLink, link.id, sparkDays])

    return (
        <div onClick={onToggle} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            border: `1.5px solid ${isActive ? color : "#f1f5f9"}`,
            background: isActive ? `${color}0d` : "#f8fafc",
            cursor: "pointer", transition: "all .12s",
        }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin:"0 0 4px", fontSize:12, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {link.label}
                </p>
                <div style={{ height:4, borderRadius:4, background:"#e2e8f0", overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", borderRadius:4, background:color, transition:"width .4s ease" }} />
                </div>
            </div>
            <SparkBars data={linkDays} color={color} />
            <div style={{ flexShrink:0, textAlign:"right", minWidth:36 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#0f172a" }}>{link.clicks.toLocaleString("es-AR")}</p>
                <p style={{ margin:0, fontSize:9, color:"#94a3b8", fontWeight:600 }}>clicks</p>
            </div>
        </div>
    )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function LinktreeStatsCard() {
    const today = new Date()
    const pad   = s => String(s).padStart(2, "0")
    const fmtD  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const todayStr = fmtD(today)

    const [data,       setData]       = useState(null)
    const [loading,    setLoading]    = useState(true)
    const [expanded,   setExpanded]   = useState(false)
    const [activeLink, setActiveLink] = useState(null)

    // ── Estado del filtro de fecha
    const [preset,     setPreset]     = useState("month")
    const [customFrom, setCustomFrom] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7); return fmtD(d)
    })
    const [customTo,   setCustomTo]   = useState(todayStr)

    // Rango activo resuelto
    const activeRange = useMemo(() => {
        if (preset !== "custom") return getPresetRange(preset)
        if (customFrom && customTo) return { from: customFrom, to: customTo }
        return null
    }, [preset, customFrom, customTo])

    // ── Fetch con parámetros de fecha
    useEffect(() => {
        if (!activeRange) return
        setLoading(true)
        setActiveLink(null)
        const url = `/api/linktree/stats?from=${activeRange.from}&to=${activeRange.to}`
        fetch(url)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))

    }, [activeRange?.from, activeRange?.to])

    const handlePreset = (key) => {
        setPreset(key)
        // Si cambia a custom inicializar con la semana anterior
        if (key === "custom") {
            const from = new Date(); from.setDate(from.getDate() - 6)
            setCustomFrom(fmtD(from))
            setCustomTo(todayStr)
        }
    }

    const handleCustomChange = (field, value) => {
        if (field === "from") setCustomFrom(value)
        else setCustomTo(value)
    }

    const filteredByDay = useMemo(() => {
        console.log("data")
        console.log(data)
        if (!data) return []
        if (!activeLink) return data.clicksByDay
        const map = {}
        for (const r of (data.clicksByLink || []).filter(r => r.linkId === activeLink))
            map[r.date] = (map[r.date] || 0) + r.clicks
        return (data.clicksByDay || []).map(d => ({ date: d.date, clicks: map[d.date] ?? 0 }))
    }, [data, activeLink])

    // Últimos 12 días del rango para los sparks
    const sparkDays = useMemo(() => (data?.clicksByDay || []).slice(-12), [data])

    // Clicks en el rango seleccionado
    const rangeClicks = useMemo(() => (data?.clicksByDay || []).reduce((s,d) => s + d.clicks, 0), [data])

    const linksWithMax = useMemo(() => {
        if (!data?.links) return []
        const max = Math.max(...data.links.map(l => l.clicks), 1)
        return data.links.map(l => ({ ...l, _max: max }))
    }, [data])

    // Etiqueta del período activo para mostrar en gráfico
    const periodLabel = useMemo(() => {
        if (!activeRange) return ""
        if (preset === "today")  return "Hoy"
        if (preset === "week")   return "Esta semana"
        if (preset === "month")  return "Este mes"
        return `${activeRange.from} → ${activeRange.to}`
    }, [preset, activeRange])

    if (loading) return (
        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:16, padding:"18px 24px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid #e2e8f0", borderTopColor:"#3b82f6", animation:"spin .8s linear infinite" }} />
            <span style={{ fontSize:13, color:"#94a3b8" }}>Cargando métricas del Linktree…</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!data?.linktreeEnabled) return null

    const hasData = data.totalClicks > 0 || data.linktreeViews > 0

    return (
        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:16, overflow:"hidden", fontFamily:"'DM Sans',system-ui,sans-serif" }}>

            {/* Header */}
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Link2 size={14} color="#3b82f6" />
                    </div>
                    <div>
                        <span style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>Linktree</span>
{/*                         {data.linktreeSlug && (
                            <a href={`/l/${data.linktreeSlug}`} target="_blank" rel="noreferrer"
                                style={{ display:"inline-flex", alignItems:"center", gap:3, marginLeft:8, fontSize:11, color:"#3b82f6", textDecoration:"none" }}>
                                /l/{data.linktreeSlug} <ExternalLink size={10} />
                            </a>
                        )} */}
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(v => !v)}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 12,
                        border: "1px solid rgba(56, 189, 248, 0.28)",
                        background: expanded
                            ? "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(56,189,248,0.14))"
                            : "linear-gradient(135deg, rgba(14,165,233,0.10), rgba(56,189,248,0.08))",
                        cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0ea5e9",
                        fontFamily: "inherit", transition: "all .2s ease",
                        boxShadow: expanded ? "0 4px 14px rgba(14,165,233,0.18)" : "0 2px 8px rgba(14,165,233,0.10)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(14,165,233,0.22)" }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = expanded ? "0 4px 14px rgba(14,165,233,0.18)" : "0 2px 8px rgba(14,165,233,0.10)" }}
                >
                    {expanded ? <><ChevronUp size={14} /> Ver menos</> : <><ChevronDown size={14} /> Ver detalles</>}
                </button>
            </div>

            {/* Filtro de fechas */}
            <div style={{ padding:"12px 20px", borderBottom:"1px solid #f1f5f9", background:"#fafbfc" }}>
                <DateRangeSelector
                    activePreset={preset}
                    customFrom={customFrom}
                    customTo={customTo}
                    onPreset={handlePreset}
                    onCustomChange={handleCustomChange}
                />
            </div>

            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr" }}>
                {[
                    { Icon: MousePointerClick, label:"Clicks totales",     value: data.totalClicks.toLocaleString("es-AR"),   color:"#3b82f6", bg:"#eff6ff" },
                    { Icon: Eye,               label:"Visitas a la página", value: data.linktreeViews.toLocaleString("es-AR"), color:"#8b5cf6", bg:"#f5f3ff" },
                    { Icon: TrendingUp,         label:`Clicks — ${periodLabel}`, value: rangeClicks.toLocaleString("es-AR"),   color:"#10b981", bg:"#ecfdf5" },
                ].map(({ Icon, label, value, color, bg }, i) => (
                    <div key={i} style={{ padding:"14px 16px", borderRight: i<2 ? "1px solid #f1f5f9" : "none" }}>
                        <div style={{ width:26, height:26, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:6 }}>
                            <Icon size={12} color={color} />
                        </div>
                        <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:800, color:"#0f172a", lineHeight:1 }}>{value}</p>
                        <p style={{ margin:0, fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Gráfico de línea */}
            {hasData && (
                <div style={{ padding:"16px 20px 10px", borderTop:"1px solid #f1f5f9" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                            {activeLink
                                ? `"${data.links.find(l => l.id === activeLink)?.label}" — ${periodLabel}`
                                : `Clicks totales — ${periodLabel}`}
                        </p>
                        {activeLink && (
                            <button onClick={() => setActiveLink(null)} style={{ fontSize:10, color:"#3b82f6", border:"none", background:"none", cursor:"pointer", fontFamily:"inherit", padding:0, fontWeight:700 }}>
                                ← Ver todos
                            </button>
                        )}
                    </div>
                    <LineChart data={filteredByDay} height={110} />
                </div>
            )}

            {/* Detalle por link */}
            {expanded && (
                <div style={{ borderTop:"1px solid #f1f5f9", padding:"14px 20px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                        <BarChart2 size={13} color="#64748b" />
                        <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>

                        💡 Hacé clic en un link para filtrar el gráfico

                        </p>
                    </div>
                    {linksWithMax.length === 0 ? (
                        <p style={{ fontSize:12, color:"#cbd5e1", margin:0 }}>No tenés links configurados.</p>
                    ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {linksWithMax.map((link, i) => (
                                <LinkRow
                                    key={link.id}
                                    link={link}
                                    idx={i}
                                    isActive={activeLink === link.id}
                                    sparkDays={sparkDays}
                                    clicksByLink={data.clicksByLink}
                                    onToggle={() => setActiveLink(activeLink === link.id ? null : link.id)}
                                />
                            ))}
                        </div>
                    )}

                </div>
            )}
        </div>
    )
}