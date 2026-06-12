"use client"

// src/components/planes/PlanCard.js

import {
    Check,
    Zap,
    Loader2,
    RefreshCw,
    Calendar,
    DollarSign,
    Images,
    Camera,
    Clock,
    CreditCard,
    Globe,
    ImageIcon,
    PartyPopper,
    Printer,
    HardDrive,
    Link2,
    XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"

// Helpers
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

function daysLeft(expiresAt) {
    const diff = new Date(expiresAt) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Feature icon map
const FEATURE_ICONS = {
    "Galerías":             Images,
    "Fotos / galería":      Camera,
    "Facturación":          RefreshCw,
    "Mercado Pago":         CreditCard,
    "Portfolio Público":    Globe,
    "Fotos portfolio":      ImageIcon,
    "Galerías de Evento":   PartyPopper,
    "Versión Imprimible":   Printer,
    "Almacenamiento":       HardDrive,
    "Linktree":             Link2,
}

export default function PlanCard({ plan, subscription, onSelect, loading }) {
    const isCurrent  = plan.id === subscription?.planId && subscription?.status === "ACTIVE"
    const hasActive  = subscription?.status === "ACTIVE"
    const isUpgrade  = hasActive && !isCurrent
    const isFree     = Number(plan.price) === 0
    const remaining  = isCurrent ? daysLeft(subscription.expiresAt) : null
    const isExpiring = isCurrent && remaining !== null && remaining <= 7
    const isCancelled = isCurrent && subscription?.status === "CANCELLED"
    const isAutoRenew = isCurrent && subscription?.autoRenew === true

    const features = [
        {
            label: "Galerías",
            value: plan.maxGalleries === -1 ? "Ilimitadas" : plan.maxGalleries,
        },
        {
            label: "Fotos / galería",
            value: plan.maxPhotos === -1 ? "Ilimitadas" : plan.maxPhotos,
        },
        {
            label: "Facturación",
            value: isFree ? "Gratis" : "Mensual automática",
        },
        {
            label: "Mercado Pago",
            value: plan.allowsMercadoPago ? "Incluido" : "No incluido",
            included: plan.allowsMercadoPago,
        },
        {
            label: "Portfolio Público",
            value: plan.allowsPortfolio ? "Incluido" : "No incluido",
            included: plan.allowsPortfolio,
        },
        {
            label: "Fotos portfolio",
            value: plan.maxPortfolioPhotos === -1 ? "Ilimitado" : plan.maxPortfolioPhotos || 0,
        },
        {
            label: "Galerías de Evento",
            value: plan.allowsEventGalleries
                ? plan.freeEventGalleries > 0
                    ? `${plan.freeEventGalleries} gratis${Number(plan.extraEventGalleryPrice) > 0
                        ? ` + $${Number(plan.extraEventGalleryPrice).toLocaleString("es-AR")} c/u`
                        : ""}`
                    : "Incluido"
                : "No incluido",
            included: plan.allowsEventGalleries,
        },
        {
            label: "Versión Imprimible",
            value: plan.allowsPrintable ? "Incluido" : "No incluido",
            included: plan.allowsPrintable,
        },
        {
            label: "Almacenamiento",
            value: plan.maxStorageGB === -1 ? "Ilimitado" : `${plan.maxStorageGB} GB`,
        },
        {
            label: "Linktree",
            value: plan.maxLinktreeLinks === -1 ? "Ilimitado" : `Hasta ${plan.maxLinktreeLinks} links`,
            included: plan.allowsLinktree,
        },
    ]

    return (
        <div className={`
            relative flex h-full flex-col rounded-[28px]
            bg-white px-6 py-6 transition-all duration-300
            ${isCurrent
                ? "shadow-2xl shadow-neutral-200/70 ring-1 ring-neutral-900"
                : "shadow-sm hover:shadow-xl hover:-translate-y-1"
            }
        `}>
            {/* Badge */}
            {isCurrent && (
                <div className="mb-5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-white">
                        <Check size={11} /> PLAN ACTUAL
                    </span>
                    {isAutoRenew && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[11px] font-semibold text-green-800">
                            <RefreshCw size={10} /> AUTO-RENUEVA
                        </span>
                    )}
                </div>
            )}

            {/* Header */}
            <div>
                <h3 className="text-2xl font-black tracking-tight text-neutral-900">{plan.name}</h3>
                <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tight text-neutral-900">
                        {isFree ? "Gratis" : `$${Number(plan.price).toLocaleString("es-AR")}`}
                    </span>
                </div>
                {!isFree && (
                    <p className="mt-1 text-sm text-neutral-500">por mes · cobro automático</p>
                )}
            </div>

            {/* Divider */}
            <div className="my-6 h-px bg-neutral-200" />

            {/* Features */}
            <div className="flex-1 space-y-3">
                {features.map((feature, index) => {
                    const Icon = FEATURE_ICONS[feature.label] ?? Check
                    const dimmed = feature.included === false
                    return (
                        <div key={index} className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-2 min-w-0">
                                <Icon
                                    size={15}
                                    className={`mt-0.5 shrink-0 ${dimmed ? "text-neutral-300" : "text-green-600"}`}
                                />
                                <span className={`text-sm ${dimmed ? "text-neutral-400" : "text-neutral-600"}`}>
                                    {feature.label}
                                </span>
                            </div>
                            <span className={`text-sm font-semibold text-right ${dimmed ? "text-neutral-400" : "text-neutral-900"}`}>
                                {feature.value}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Expiration */}
            {isCurrent && (
                <>
                    <div className="my-6 h-px bg-neutral-200" />
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isExpiring ? "bg-amber-100" : "bg-neutral-100"}`}>
                            <Calendar size={16} className={isExpiring ? "text-amber-700" : "text-neutral-600"} />
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${isExpiring ? "text-amber-800" : "text-neutral-800"}`}>
                                {isAutoRenew
                                    ? `Próximo cobro en ${remaining} día${remaining !== 1 ? "s" : ""}`
                                    : isExpiring
                                        ? `Vence en ${remaining} día${remaining !== 1 ? "s" : ""}`
                                        : `${remaining} días restantes`}
                            </p>
                            <p className="text-xs text-neutral-500">
                                {isAutoRenew ? "Se renueva el" : "Vence el"} {formatDate(subscription.expiresAt)}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Button */}
            <div className="mt-7">
                {isCurrent ? (
                    // Si es auto-renew, no mostramos botón de renovar (MP lo hace solo)
                    isAutoRenew ? (
                        <div className="h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-center gap-2">
                            <RefreshCw size={15} className="text-green-600" />
                            <span className="text-sm text-neutral-600 font-medium">Cobro automático activo</span>
                        </div>
                    ) : (
                        <Button
                            className="h-12 w-full rounded-2xl border-neutral-300 font-semibold"
                            variant="outline"
                            onClick={() => onSelect(plan)}
                            disabled={loading === plan.id}
                        >
                            {loading === plan.id
                                ? <Loader2 size={17} className="mr-2 animate-spin" />
                                : <RefreshCw size={17} className="mr-2" />}
                            Reactivar suscripción
                        </Button>
                    )
                ) : (
                    <Button
                        className="h-12 w-full rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 font-semibold shadow-lg shadow-neutral-200"
                        onClick={() => onSelect(plan)}
                        disabled={loading === plan.id}
                    >
                        {loading === plan.id
                            ? <Loader2 size={17} className="mr-2 animate-spin" />
                            : isUpgrade
                                ? <DollarSign size={17} className="mr-2" />
                                : <Zap size={17} className="mr-2" />}
                        {isUpgrade ? "Cambiar plan" : isFree ? "Activar gratis" : "Suscribirse"}
                    </Button>
                )}
            </div>
        </div>
    )
}
