"use client"

import { useEffect, useState, useCallback } from "react"
import {
    CreditCard, Search, Loader2, CheckCircle2, Clock,
    AlertTriangle, XCircle, DollarSign, TrendingUp,
    ChevronLeft, ChevronRight, RefreshCw, Pencil,
    Check, X, CalendarDays, User, Zap, Filter,
    BadgeCheck, Ban, RotateCcw, ChevronDown, ChevronUp,
    ArrowUpCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
    return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(d) {
    return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
}

function daysLeft(expiresAt) {
    return Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
}

function daysLeftLabel(sub) {
    if (sub.status !== "ACTIVE") return null
    const d = daysLeft(sub.expiresAt)
    if (d < 0)  return { text: "Vencida", cls: "text-red-600" }
    if (d === 0) return { text: "Vence hoy", cls: "text-red-600 font-semibold" }
    if (d <= 7)  return { text: `Vence en ${d}d`, cls: "text-amber-600 font-semibold" }
    if (d <= 30) return { text: `${d} días`, cls: "text-amber-500" }
    return { text: `${d} días`, cls: "text-green-600" }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CFG = {
    ACTIVE:    { label: "Activa",     cls: "bg-green-100 text-green-800 border-green-200" },
    EXPIRED:   { label: "Vencida",    cls: "bg-red-100 text-red-800 border-red-200" },
    SUSPENDED: { label: "Suspendida", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    CANCELLED: { label: "Cancelada",  cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
}

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.CANCELLED
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
            {cfg.label}
        </span>
    )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "text-neutral-700", onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={`text-left w-full p-4 rounded-xl border transition-all ${
                active
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                    : "border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm"
            }`}
        >
            <div className={`flex items-center gap-2 mb-2 ${active ? "text-neutral-300" : "text-neutral-400"}`}>
                <Icon size={15} />
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${active ? "text-white" : color}`}>{value}</p>
            {sub && <p className={`text-xs mt-0.5 ${active ? "text-neutral-400" : "text-neutral-400"}`}>{sub}</p>}
        </button>
    )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ sub, plans, onClose, onSaved }) {
    const [status, setStatus]   = useState(sub.status)
    const [planId, setPlanId]   = useState(sub.planId)
    const [extend, setExtend]   = useState("")
    const [notes, setNotes]     = useState(sub.notes || "")
    const [saving, setSaving]   = useState(false)
    const [error, setError]     = useState("")

    const handleSave = async () => {
        setSaving(true)
        setError("")
        try {
            const body = { status, notes }
            if (planId !== sub.planId) body.planId = planId   // cambio de plan
            if (extend) body.extendDays = Number(extend)

            // Si cambió el plan, primero actualizar via POST (upsert)
            let res
            if (planId !== sub.planId) {
                res = await fetch("/api/admin/subscriptions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        photographerId: sub.photographerId,
                        planId,
                        amountPaid: sub.amountPaid,
                        paymentMethod: sub.paymentMethod,
                        paymentRef: sub.paymentRef,
                        notes,
                    }),
                })
            } else {
                res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                })
            }

            if (!res.ok) {
                const j = await res.json()
                setError(j.error || "Error al guardar")
                return
            }
            onSaved()
        } catch {
            setError("Error de red")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                        <p className="font-semibold text-neutral-900">Editar suscripción</p>
                        <p className="text-sm text-neutral-500">{sub.photographer.name}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Estado */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Estado</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                            <option value="ACTIVE">Activa</option>
                            <option value="SUSPENDED">Suspendida</option>
                            <option value="CANCELLED">Cancelada</option>
                            <option value="EXPIRED">Vencida</option>
                        </select>
                    </div>

                    {/* Plan */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Plan</label>
                        <select
                            value={planId}
                            onChange={e => setPlanId(e.target.value)}
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — ${Number(p.price).toFixed(0)} / {p.durationDays}d
                                </option>
                            ))}
                        </select>
                        {planId !== sub.planId && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle size={11} /> Cambiar el plan reinicia la suscripción desde hoy.
                            </p>
                        )}
                    </div>

                    {/* Extender días */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Extender días</label>
                        <div className="flex gap-2">
                            {[7, 15, 30].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setExtend(String(d))}
                                    className={`flex-1 py-1.5 rounded-lg border text-sm transition-colors ${
                                        extend === String(d)
                                            ? "bg-neutral-900 text-white border-neutral-900"
                                            : "border-neutral-200 hover:border-neutral-400"
                                    }`}
                                >
                                    +{d}d
                                </button>
                            ))}
                            <input
                                type="number"
                                min="1"
                                placeholder="Custom"
                                value={extend}
                                onChange={e => setExtend(e.target.value)}
                                className="flex-1 border border-neutral-200 rounded-lg px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            />
                        </div>
                        {extend && (
                            <p className="text-xs text-green-600">
                                Nuevo vencimiento aprox.: {fmtDate(new Date(
                                    Math.max(new Date(sub.expiresAt), new Date()).getTime()
                                    + Number(extend) * 24 * 60 * 60 * 1000
                                ))}
                            </p>
                        )}
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Notas internas</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Ej: Pago manual por transferencia..."
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertTriangle size={13} /> {error}
                        </p>
                    )}
                </div>

                <div className="flex gap-2 px-5 pb-5">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : <Check size={15} className="mr-2" />}
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Subscription Row ─────────────────────────────────────────────────────────

function SubRow({ sub, onEdit }) {
    const [expanded, setExpanded] = useState(false)
    const dl = daysLeftLabel(sub)
    const isFree = sub.paymentMethod === "free"

    return (
        <div className="border-b border-neutral-100 last:border-0">
            {/* Fila principal */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpanded(v => !v)}
            >
                {/* Avatar + nombre */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 text-sm font-semibold text-neutral-600 uppercase">
                        {sub.photographer.name?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-neutral-900 truncate">{sub.photographer.name}</p>
                            <StatusBadge status={sub.status} />
                            {isFree && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                    Gratis
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{sub.photographer.email}</p>
                    </div>
                </div>

                {/* Plan */}
                <div className="hidden sm:block text-center px-4 min-w-[100px]">
                    <p className="text-sm font-medium text-neutral-800">{sub.plan.name}</p>
                    <p className="text-xs text-neutral-400">
                        {isFree ? "Gratis" : `$${fmt(sub.amountPaid || sub.plan.price)}`}
                    </p>
                </div>

                {/* Vencimiento */}
                <div className="hidden md:block text-center px-4 min-w-[110px]">
                    <p className="text-xs text-neutral-400">Vence</p>
                    <p className="text-sm text-neutral-700">{fmtDate(sub.expiresAt)}</p>
                    {dl && <p className={`text-xs ${dl.cls}`}>{dl.text}</p>}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pl-3">
                    <button
                        onClick={e => { e.stopPropagation(); onEdit(sub) }}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                    {expanded
                        ? <ChevronUp size={15} className="text-neutral-400" />
                        : <ChevronDown size={15} className="text-neutral-400" />
                    }
                </div>
            </div>

            {/* Detalle expandido */}
            {expanded && (
                <div className="px-5 pb-4 bg-neutral-50 border-t border-neutral-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Plan</p>
                            <p className="text-sm font-medium">{sub.plan.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Monto pagado</p>
                            <p className="text-sm font-medium">
                                {isFree ? "Gratis" : sub.amountPaid ? `$${fmt(sub.amountPaid)}` : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Método de pago</p>
                            <p className="text-sm font-medium capitalize">{sub.paymentMethod || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Referencia MP</p>
                            <p className="text-sm font-mono text-neutral-600 truncate">
                                {sub.paymentRef || "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Inicio</p>
                            <p className="text-sm">{fmtDate(sub.startDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Vencimiento</p>
                            <p className="text-sm">{fmtDate(sub.expiresAt)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Galerías máx.</p>
                            <p className="text-sm">{sub.plan.maxGalleries === -1 ? "Ilimitadas" : sub.plan.maxGalleries}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 mb-0.5">Fotos máx.</p>
                            <p className="text-sm">{sub.plan.maxPhotos === -1 ? "Ilimitadas" : sub.plan.maxPhotos}</p>
                        </div>
                        {sub.notes && (
                            <div className="col-span-2 sm:col-span-4">
                                <p className="text-xs text-neutral-400 mb-0.5">Notas</p>
                                <p className="text-sm text-neutral-600 italic">{sub.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTERS = [
    { key: "",          label: "Todas",           icon: CreditCard },
    { key: "active",    label: "Activas",          icon: CheckCircle2 },
    { key: "expiring",  label: "Por vencer",       icon: Clock },
    { key: "expired",   label: "Vencidas",         icon: XCircle },
    { key: "free",      label: "Gratuitas",        icon: Zap },
]

export default function SubscriptionsPage() {
    const [data, setData]       = useState(null)
    const [plans, setPlans]     = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch]   = useState("")
    const [filter, setFilter]   = useState("")
    const [page, setPage]       = useState(1)
    const [editing, setEditing] = useState(null)

    const fetchData = useCallback(async (p = page) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ filter, page: p })
            if (search) params.set("search", search)
            const res = await fetch(`/api/admin/subscriptions?${params}`)
            const json = await res.json()
            setData(json)
        } finally {
            setLoading(false)
        }
    }, [filter, search, page])

    // Fetch plans for edit modal
    useEffect(() => {
        fetch("/api/admin/plans").then(r => r.json()).then(setPlans).catch(() => {})
    }, [])

    // Debounce search
    useEffect(() => {
        setPage(1)
        const t = setTimeout(() => fetchData(1), search ? 350 : 0)
        return () => clearTimeout(t)
    }, [search, filter])

    useEffect(() => {
        fetchData(page)
    }, [page])

    const handleFilterChange = (key) => {
        setFilter(key)
        setPage(1)
    }

    const stats = data?.stats
    const pagination = data?.pagination

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">Suscripciones</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        {stats ? `${stats.active} activas · ${stats.expiring7} por vencer esta semana` : "Cargando..."}
                    </p>
                </div>
                <button
                    onClick={() => fetchData(page)}
                    className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Stats cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard
                        icon={CheckCircle2}
                        label="Activas"
                        value={stats.active}
                        sub={`${stats.expiring30} vencen en 30 días`}
                        color="text-green-700"
                        onClick={() => handleFilterChange(filter === "active" ? "" : "active")}
                        active={filter === "active"}
                    />
                    <StatCard
                        icon={Clock}
                        label="Por vencer (7d)"
                        value={stats.expiring7}
                        sub="Requieren atención"
                        color={stats.expiring7 > 0 ? "text-amber-700" : "text-neutral-700"}
                        onClick={() => handleFilterChange(filter === "expiring" ? "" : "expiring")}
                        active={filter === "expiring"}
                    />
                    <StatCard
                        icon={DollarSign}
                        label="Ingresos del mes"
                        value={`$${fmt(stats.revenueMonth)}`}
                        sub={`Total: $${fmt(stats.revenueAll)}`}
                        color="text-blue-700"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Nuevas (30d)"
                        value={stats.recentCount}
                        sub={`${stats.inactive} vencidas/canceladas`}
                        color="text-purple-700"
                        onClick={() => handleFilterChange(filter === "expired" ? "" : "expired")}
                        active={filter === "expired"}
                    />
                </div>
            )}

            {/* Filtros + búsqueda */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* Búsqueda */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Buscar fotógrafo por nombre o email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {/* Filter pills */}
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map(f => {
                        const Icon = f.icon
                        return (
                            <button
                                key={f.key}
                                onClick={() => handleFilterChange(f.key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                    filter === f.key
                                        ? "bg-neutral-900 text-white border-neutral-900"
                                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
                                }`}
                            >
                                <Icon size={13} />
                                {f.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tabla */}
            <Card className="overflow-hidden">
                {/* Encabezado tabla */}
                <div className="hidden sm:grid grid-cols-[1fr_110px_130px_80px] px-5 py-2.5 bg-neutral-50 border-b text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    <span>Fotógrafo</span>
                    <span className="text-center">Plan</span>
                    <span className="text-center">Vencimiento</span>
                    <span></span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-neutral-400" />
                    </div>
                ) : !data?.subscriptions?.length ? (
                    <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
                        <CreditCard size={32} className="opacity-30" />
                        <p className="text-sm">No se encontraron suscripciones</p>
                    </div>
                ) : (
                    <div>
                        {data.subscriptions.map(sub => (
                            <SubRow
                                key={sub.id}
                                sub={sub}
                                onEdit={setEditing}
                            />
                        ))}
                    </div>
                )}
            </Card>

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-neutral-500">
                        Mostrando {((page - 1) * pagination.pageSize) + 1}–{Math.min(page * pagination.pageSize, pagination.total)} de {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        <span className="text-sm text-neutral-600 px-1">
                            {page} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal de edición */}
            {editing && (
                <EditModal
                    sub={editing}
                    plans={plans}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null)
                        fetchData(page)
                    }}
                />
            )}
        </div>
    )
}
