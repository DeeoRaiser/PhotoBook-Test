"use client"

// src/app/(dashboard)/dashboard/subscription/page.js

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    CreditCard, Check, Loader2, AlertCircle, CheckCircle2, XCircle,
    Clock, PartyPopper, X, RefreshCw, AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import BenefitsSlider from "@/components/planes/BenefitsSlider"
import PlanCard from "@/components/planes/PlanCard"

// ─── Modal de Éxito ──────────────────────────────────────────────────────────

function SuccessModal({ plan, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex justify-center mb-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 size={42} className="text-green-600" />
                        </div>
                        <div className="absolute -top-1 -right-1">
                            <PartyPopper size={22} className="text-amber-500" />
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-2 mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900">¡Felicitaciones!</h2>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                        Tu plan{plan?.name ? <> <strong className="text-neutral-800">{plan.name}</strong></> : ""} fue activado correctamente.
                        Ya podés usar todas las funciones disponibles en tu cuenta.
                    </p>
                </div>

                {plan && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                            <Check size={14} className="text-green-600 shrink-0" />
                            <span>Plan <strong>{plan.name}</strong> activo</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                            <Check size={14} className="text-green-600 shrink-0" />
                            <span>{plan.maxGalleries === -1 ? "Galerías ilimitadas" : `Hasta ${plan.maxGalleries} galerías`}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                            <RefreshCw size={14} className="text-green-600 shrink-0" />
                            <span>Se renueva automáticamente cada mes</span>
                        </div>
                        {plan.allowsMercadoPago && (
                            <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <Check size={14} className="text-green-600 shrink-0" />
                                <span>Cobros con MercadoPago habilitados</span>
                            </div>
                        )}
                    </div>
                )}

                <Button
                    className="w-full bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl h-11"
                    onClick={onClose}
                >
                    ¡Genial, empezar a usar!
                </Button>
            </div>
        </div>
    )
}

// ─── Modal de Cancelación ────────────────────────────────────────────────────

function CancelModal({ subscription, onConfirm, onClose, cancelling }) {
    const expiresAt = subscription?.expiresAt
        ? new Date(subscription.expiresAt).toLocaleDateString("es-AR", {
            day: "numeric", month: "long", year: "numeric",
          })
        : null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle size={32} className="text-red-600" />
                    </div>
                </div>

                <div className="text-center space-y-2 mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">¿Cancelar suscripción?</h2>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                        Tu suscripción no se renovará automáticamente. Vas a seguir teniendo acceso
                        {expiresAt ? <> hasta el <strong>{expiresAt}</strong></> : " hasta la fecha de vencimiento"}.
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                    <p className="text-xs text-amber-800 text-center">
                        No se realizará ningún cobro adicional desde MercadoPago.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-11"
                        onClick={onClose}
                        disabled={cancelling}
                    >
                        Volver
                    </Button>
                    <Button
                        className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                        disabled={cancelling}
                    >
                        {cancelling ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                        Sí, cancelar
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Banner de estado ─────────────────────────────────────────────────────────

function StatusBanner({ status, isPolling }) {
    if (!status) return null

    const config = {
        pending: {
            icon: isPolling ? Loader2 : Clock,
            text: isPolling
                ? "Verificando tu suscripción con MercadoPago, aguardá un momento…"
                : "Tu suscripción está pendiente de confirmación. Te notificaremos cuando se active.",
            cls: "bg-blue-50 border-blue-200 text-blue-800",
            spin: isPolling,
        },
        failure: {
            icon: XCircle,
            text: "No pudimos procesar el pago. Podés intentarlo de nuevo.",
            cls: "bg-red-50 border-red-200 text-red-800",
        },
    }[status]

    if (!config) return null
    const Icon = config.icon

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border mb-6 ${config.cls}`}>
            <Icon size={20} className={`shrink-0 mt-0.5 ${config.spin ? "animate-spin" : ""}`} />
            <p className="text-sm font-medium">{config.text}</p>
        </div>
    )
}

// ─── Banner de auto-renovación activa ────────────────────────────────────────

function AutoRenewBanner({ subscription, onCancelClick }) {
    if (!subscription || subscription.status !== "ACTIVE") return null
    if (!subscription.autoRenew) return null

    return (
        <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-3">
                <RefreshCw size={16} className="text-green-600 shrink-0" />
                <p className="text-sm text-green-800">
                    <strong>Renovación automática activa.</strong>{" "}
                    Se cobrará mensualmente desde tu cuenta de MercadoPago.
                </p>
            </div>
            <button
                onClick={onCancelClick}
                className="text-xs text-neutral-400 hover:text-red-500 underline whitespace-nowrap transition-colors"
            >
                Cancelar
            </button>
        </div>
    )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const MAX_POLL_ATTEMPTS = 20
const POLL_INTERVAL_MS = 3000

export default function SubscriptionPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const paymentStatus = searchParams.get("status")

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [checkingOut, setCheckingOut] = useState(null)

    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [activatedPlan, setActivatedPlan] = useState(null)
    const [isPolling, setIsPolling] = useState(false)

    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    const pollAttemptsRef = useRef(0)
    const pollTimerRef = useRef(null)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/photographer/subscription")
            if (!res.ok) throw new Error("Error al cargar la suscripción")
            const json = await res.json()
            setData(json)
            return json
        } catch (err) {
            setError(err.message)
            return null
        }
    }, [])

    // Carga inicial
    useEffect(() => {
        fetchData().finally(() => setLoading(false))
    }, [fetchData])

    // Polling cuando viene status=success desde MercadoPago
    useEffect(() => {
        if (paymentStatus !== "success") return

        router.replace("/dashboard/subscription", { scroll: false })

        pollAttemptsRef.current = 0
        setIsPolling(true)

        const poll = async () => {
            pollAttemptsRef.current += 1

            const json = await fetchData()

            if (json?.subscription?.status === "ACTIVE") {
                setIsPolling(false)
                clearTimeout(pollTimerRef.current)

                const plan = json.plans?.find(p => p.id === json.subscription.planId)
                    || json.subscription.plan
                setActivatedPlan(plan || json.subscription)
                setShowSuccessModal(true)
                return
            }

            if (pollAttemptsRef.current < MAX_POLL_ATTEMPTS) {
                pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
            } else {
                setIsPolling(false)
            }
        }

        pollTimerRef.current = setTimeout(poll, 2000)
        return () => clearTimeout(pollTimerRef.current)
    }, [paymentStatus, fetchData, router])

    const handleSelectPlan = async (plan) => {
        try {
            setCheckingOut(plan.id)
            const res = await fetch("/api/photographer/subscription/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId: plan.id }),
            })
            const json = await res.json()

            if (!res.ok) {
                alert(json.error || "Error al iniciar el pago")
                return
            }

            // Plan gratuito
            if (json.free) {
                const freshData = await fetchData()
                const activePlan = freshData?.plans?.find(p => p.id === plan.id) || plan
                setActivatedPlan(activePlan)
                setShowSuccessModal(true)
                return
            }

            // Plan pago: redirigir a la página de suscripción de MercadoPago
            const url = process.env.NODE_ENV === "production"
                ? json.initPoint
                : json.sandboxInitPoint || json.initPoint
            window.location.href = url
        } catch (err) {
            alert("Error al conectar con el servidor de pagos")
            console.error(err)
        } finally {
            setCheckingOut(null)
        }
    }

    const handleCancelSubscription = async () => {
        try {
            setCancelling(true)
            const res = await fetch("/api/photographer/subscription/cancel", { method: "POST" })
            const json = await res.json()

            if (!res.ok) {
                alert(json.error || "Error al cancelar la suscripción")
                return
            }

            setShowCancelModal(false)
            await fetchData()
        } catch (err) {
            alert("Error al conectar con el servidor")
            console.error(err)
        } finally {
            setCancelling(false)
        }
    }

    // ─── Renders ───────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 size={28} className="animate-spin text-neutral-400" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-neutral-600">{error}</p>
                <Button variant="outline" onClick={() => fetchData()}>Reintentar</Button>
            </div>
        )
    }

    const { subscription, plans } = data
    const hasActivePlan = subscription?.status === "ACTIVE"

    return (
        <div style={{ padding: ".5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, marginLeft: "4rem" }}>
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CreditCard size={18} color="#3b82f6" />
                        </div>
                        <h1 className="ml-2" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                            Mi suscripción
                        </h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                        {hasActivePlan
                            ? "Tu plan actual está marcado. El cobro es automático cada mes."
                            : "Elegí el plan que mejor se adapte a tu negocio."}
                    </p>
                </div>
            </div>

            {/* Banner de estado */}
            <StatusBanner
                status={paymentStatus === "success" ? (isPolling ? "pending" : null) : paymentStatus}
                isPolling={isPolling}
            />

            {/* Banner de auto-renovación */}
            <AutoRenewBanner
                subscription={subscription}
                onCancelClick={() => setShowCancelModal(true)}
            />

            {/* Beneficios */}
            <BenefitsSlider />

            {/* Sin plan activo */}
            {!hasActivePlan && !isPolling && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        No tenés un plan activo. Elegí uno para empezar a usar todas las funciones.
                    </p>
                </div>
            )}

            {/* Grilla de planes */}
            <div className="grid gap-6 pt-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                {plans.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        subscription={subscription}
                        onSelect={handleSelectPlan}
                        loading={checkingOut}
                    />
                ))}
            </div>

            {/* Modal de éxito */}
            {showSuccessModal && (
                <SuccessModal
                    plan={activatedPlan}
                    onClose={() => { setShowSuccessModal(false); setActivatedPlan(null) }}
                />
            )}

            {/* Modal de cancelación */}
            {showCancelModal && (
                <CancelModal
                    subscription={subscription}
                    onConfirm={handleCancelSubscription}
                    onClose={() => setShowCancelModal(false)}
                    cancelling={cancelling}
                />
            )}
        </div>
    )
}
