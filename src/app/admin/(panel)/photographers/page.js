"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    Users, Search, Loader2, ShieldOff,
    CheckCircle, Clock, AlertTriangle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

const STATUS_FILTERS = [
    { key: "", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "expired", label: "Sin plan / vencido" },
    { key: "blocked", label: "Bloqueados" },
]

export default function PhotographersPage() {
    const [photographers, setPhotographers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("")
    const searchParams = useSearchParams()

    useEffect(() => {
        const s = searchParams.get("status") || ""
        setStatus(s)
    }, [searchParams])

    useEffect(() => {
        const timer = setTimeout(async () => {
            setLoading(true)
            const params = new URLSearchParams()
            if (search) params.set("search", search)
            if (status) params.set("status", status)
            const res = await fetch(`/api/admin/photographers?${params}`)
            const data = await res.json()
            setPhotographers(Array.isArray(data) ? data : [])

            setLoading(false)
        }, 300)
        return () => clearTimeout(timer)
    }, [search, status])

    const now = new Date()

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">Fotógrafos</h1>
                    <p className="text-neutral-500 text-sm mt-1">{photographers.length} registros</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatus(f.key)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${status === f.key
                                    ? "bg-neutral-900 text-white"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla */}
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-neutral-400" />
                    </div>
                ) : photographers.length === 0 ? (
                    <div className="text-center py-16 text-neutral-400">
                        <Users size={36} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No hay fotógrafos con esos filtros</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {photographers.map((p) => {
                            const sub = p.subscription
                            const isExpired = sub ? new Date(sub.expiresAt) < now : true
                            const daysLeft = sub
                                ? Math.ceil((new Date(sub.expiresAt) - now) / (1000 * 60 * 60 * 24))
                                : null
                            const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0

                            return (
                                <Link
                                    key={p.id}
                                    href={`/admin/photographers/${p.id}`}
                                    className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center font-semibold text-neutral-600 shrink-0">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-neutral-900">{p.name}</span>
                                                {p.isBlocked && (
                                                    <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                        <ShieldOff size={9} /> Bloqueado
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-400 truncate">{p.email} · {p._count.galleries} galerías</p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 ml-4 text-right">
                                        {p.isBlocked ? (
                                            <span className="text-xs text-red-500">Bloqueado</span>
                                        ) : sub && !isExpired ? (
                                            <div>
                                                <p className="text-xs font-medium text-neutral-700">{sub.plan.name}</p>
                                                <p className={`text-xs flex items-center justify-end gap-1 ${isExpiringSoon ? "text-amber-600" : "text-neutral-400"}`}>
                                                    {isExpiringSoon && <Clock size={10} />}
                                                    {daysLeft}d restantes
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-xs flex items-center gap-1 text-neutral-400">
                                                <AlertTriangle size={11} />
                                                Sin plan
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </Card>
        </div>
    )
}