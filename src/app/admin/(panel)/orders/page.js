"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
    ShoppingBag, Loader2, Search, Mail, Calendar,
    ChevronDown, ChevronUp, Copy, Check, Download,
    MessageCircle, ChevronLeft, ChevronRight, ExternalLink,
    Images
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const STATUS_CONFIG = {
    PENDING:   { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    PAID:      { label: "Pagada",     color: "bg-blue-100 text-blue-800 border-blue-200" },
    DELIVERED: { label: "Entregada",  color: "bg-green-100 text-green-800 border-green-200" },
    CANCELLED: { label: "Cancelada",  color: "bg-red-100 text-red-800 border-red-200" },
}

const FILTERS = [
    { key: "", label: "Todas" },
    { key: "PENDING",   label: "Pendientes" },
    { key: "PAID",      label: "Pagadas" },
    { key: "DELIVERED", label: "Entregadas" },
    { key: "CANCELLED", label: "Canceladas" },
]

function fmt(n) {
    return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors shrink-0"
        >
            {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
            {copied ? "Copiado" : "Copiar"}
        </button>
    )
}

function OrderRow({ order }) {
    const [expanded, setExpanded] = useState(false)
    const cfg = STATUS_CONFIG[order.status]
    const downloadUrl = order.downloadToken
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/download/${order.downloadToken}`
        : null

    const waText = downloadUrl
        ? `Hola ${order.clientName}, tus fotos están listas: ${downloadUrl}`
        : null

    return (
        <div className="border-b border-neutral-100 last:border-0">
            {/* Fila principal */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Ícono */}
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                        <ShoppingBag size={16} className="text-neutral-400" />
                    </div>

                    {/* Info principal */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-neutral-900">{order.clientName || "—"}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                                {cfg.label}
                            </span>
                            {order.downloadToken && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-0.5">
                                    <Download size={9} /> Link activo
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-neutral-400 truncate">
                                <Mail size={10} />{order.clientEmail}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                                <Images size={10} />{order.items.length} foto{order.items.length !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                                <Calendar size={10} />
                                {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Monto + fotógrafo + toggle */}
                <div className="flex items-center gap-4 shrink-0 ml-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-neutral-900">${fmt(order.total)}</p>
                        <p className="text-xs text-neutral-400 truncate max-w-[120px]">{order.gallery?.photographer?.name ?? "—"}</p>                    </div>
                    {expanded ? <ChevronUp size={15} className="text-neutral-400" /> : <ChevronDown size={15} className="text-neutral-400" />}
                </div>
            </div>

            {/* Detalle expandido */}
            {expanded && (
                <div className="bg-neutral-50 border-t border-neutral-100 px-5 py-4 space-y-4">

                    {/* Info de la orden */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                            <p className="text-neutral-400 mb-0.5">Fotógrafo</p>
                            {order.gallery?.photographer ? (
                                <Link
                                    href={`/admin/photographers/${order.gallery.photographer.id}`}
                                    className="font-medium text-neutral-800 hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {order.gallery.photographer.name}
                                    <ExternalLink size={10} />
                                </Link>
                            ) : (
                                <p className="font-medium text-neutral-400 italic">Galería eliminada</p>
                            )}
                        </div>
                        <div>
                            <p className="text-neutral-400 mb-0.5">Galería</p>
                            <p className="font-medium text-neutral-800">
                                {order.gallery?.title ?? order.galleryTitle ?? <span className="italic text-neutral-400">Eliminada</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-neutral-400 mb-0.5">Total</p>
                            <p className="font-semibold text-neutral-900">${fmt(order.total)}</p>
                        </div>
                        {order.clientPhone && (
                            <div>
                                <p className="text-neutral-400 mb-0.5">Teléfono</p>
                                <p className="font-medium text-neutral-800">{order.clientPhone}</p>
                            </div>
                        )}
                        {order.mpPaymentId && (
                            <div>
                                <p className="text-neutral-400 mb-0.5">ID pago MP</p>
                                <p className="font-mono text-xs text-neutral-700">{order.mpPaymentId}</p>
                            </div>
                        )}
                    </div>

                    {/* Fotos */}
                    {order.items.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                            {order.items.map((item) => (
                                <div key={item.id} className="relative">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                                        {item.photo ? (
                                            <img
                                                src={item.photo.bunnyUrl}
                                                alt={item.photo.title || "Foto"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : item.photoUrl ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={item.photoUrl}
                                                    alt={item.photoTitle || "Foto"}
                                                    className="w-full h-full object-cover opacity-40 grayscale"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[9px] text-neutral-600 font-medium text-center leading-tight px-1">Eliminada</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs text-center p-1">
                                                Eliminada
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 bg-white border border-neutral-200 text-xs px-1 py-0.5 rounded font-medium text-neutral-700">
                                        ${fmt(item.price)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Link de descarga */}
                    {downloadUrl && (
                        <div className="bg-white border border-green-200 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1.5">
                                <Download size={11} /> Link de descarga activo
                            </p>
                            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                                <span className="text-xs text-neutral-500 font-mono truncate flex-1">{downloadUrl}</span>
                                <CopyButton text={downloadUrl} />
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {waText && (
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <MessageCircle size={12} /> Enviar por WhatsApp
                                    </a>
                                )}
                                <a
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
                                >
                                    <ExternalLink size={11} /> Ver página de descarga
                                </a>
                            </div>
                            {order.downloadExpiresAt && (
                                <p className="text-xs text-neutral-400">
                                    Expira: {new Date(order.downloadExpiresAt).toLocaleDateString("es-AR", {
                                        day: "2-digit", month: "long", year: "numeric",
                                        hour: "2-digit", minute: "2-digit"
                                    })}
                                    {order.downloadCount > 0 && (
                                        <span className="ml-2 text-neutral-300">
                                            · Descargado {order.downloadCount} {order.downloadCount === 1 ? "vez" : "veces"}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function AdminOrdersPage() {
    const [data, setData]       = useState({ orders: [], total: 0, totalPages: 1 })
    const [loading, setLoading] = useState(true)
    const [search, setSearch]   = useState("")
    const [status, setStatus]   = useState("")
    const [page, setPage]       = useState(1)

    const fetch_ = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (status) params.set("status", status)
        if (search) params.set("search", search)
        params.set("page", String(page))
        const res = await fetch(`/api/admin/orders?${params}`)
        const json = await res.json()
        setData(json)
        setLoading(false)
    }, [status, search, page])

    useEffect(() => {
        const t = setTimeout(fetch_, search ? 350 : 0)
        return () => clearTimeout(t)
    }, [fetch_])

    // Resetear página al cambiar filtros
    useEffect(() => { setPage(1) }, [status, search])

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-neutral-900">Órdenes</h1>
                <p className="text-neutral-500 text-sm mt-1">
                    {data.total} {data.total === 1 ? "orden" : "órdenes"} en total
                </p>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por cliente, email o fotógrafo..."
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatus(f.key)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                status === f.key
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
                ) : data.orders.length === 0 ? (
                    <div className="text-center py-16 text-neutral-400">
                        <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No hay órdenes con esos filtros</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {data.orders.map((order) => (
                            <OrderRow key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </Card>

            {/* Paginación */}
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-neutral-400">
                        Página {page} de {data.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={14} /> Anterior
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            disabled={page === data.totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
