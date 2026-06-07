"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    CreditCard, Check, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, PartyPopper, X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import BenefitsSlider from "@/components/planes/BenefitsSlider"
import PlanCard from "@/components/planes/PlanCard"

// ─── Modal de Éxito ──────────────────────────────────────────────────────────

function SuccessModal({ plan, onClose }) {
    // Cerrar con Escape
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
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Ícono animado */}
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

                {/* Texto */}
                <div className="text-center space-y-2 mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900">
                        ¡Felicitaciones!
                    </h2>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                        Tu plan{plan?.name ? <> <strong className="text-neutral-800">{plan.name}</strong></> : ""} fue activado correctamente.
                        Ya podés usar todas las funciones disponibles en tu cuenta.
                    </p>
                </div>

                {/* Detalles del plan */}
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
                            <Check size={14} className="text-green-600 shrink-0" />
                            <span>{plan.maxPhotos === -1 ? "Fotos ilimitadas" : `Hasta ${plan.maxPhotos} fotos por galería`}</span>
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

// ─── Banner de estado ─────────────────────────────────────────────────────────

function StatusBanner({ status, isPolling }) {
    if (!status) return null

    const config = {
        pending: {
            icon: isPolling ? Loader2 : Clock,
            text: isPolling
                ? "Verificando tu pago con MercadoPago, aguardá un momento…"
                : "Tu pago está pendiente de acreditación. Te notificaremos cuando se confirme.",
            cls: "bg-blue-50 border-blue-200 text-blue-800",
            spin: isPolling,
        },
        failure: {
            icon: XCircle,
            text: "El pago no pudo procesarse. Podés intentarlo de nuevo.",
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

// ─── Main Page ───────────────────────────────────────────────────────────────

const MAX_POLL_ATTEMPTS = 20  // 20 × 3s = ~60 segundos
const POLL_INTERVAL_MS = 3000

export default function SubscriptionPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const paymentStatus = searchParams.get("status")

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [checkingOut, setCheckingOut] = useState(null)

    // Estado del modal y polling
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [activatedPlan, setActivatedPlan] = useState(null)
    const [isPolling, setIsPolling] = useState(false)

    // Ref para guardar el planId que se esperaba activar (para el modal)
    const pollAttemptsRef = useRef(0)
    const pollTimerRef = useRef(null)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/photographer/subscription")
            if (!res.ok) throw new Error("Error al cargar la suscripción")
            const json = await res.json()
            setData(json)
            console.log("json")
            console.log(json)
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

        // Limpiar la URL para que recargando no re-dispare
        router.replace("/dashboard/subscription", { scroll: false })

        pollAttemptsRef.current = 0
        setIsPolling(true)

        const poll = async () => {
            pollAttemptsRef.current += 1

            const json = await fetchData()

            // Verificar si la suscripción ya quedó activa
            if (json?.subscription?.status === "ACTIVE") {
                setIsPolling(false)
                clearTimeout(pollTimerRef.current)

                // Mostrar modal con el plan activado
                const plan = json.plans?.find(p => p.id === json.subscription.planId)
                    || json.subscription.plan
                setActivatedPlan(plan || json.subscription)
                setShowSuccessModal(true)
                return
            }

            // Seguir reintentando si no llegó el webhook todavía
            if (pollAttemptsRef.current < MAX_POLL_ATTEMPTS) {
                pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
            } else {
                // Timeout: se agotaron los intentos, dejar de hacer polling
                setIsPolling(false)
            }
        }

        // Primer intento después de 2s (darle tiempo al webhook)
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

            // Plan gratuito: activado en el servidor, mostrar modal directamente
            if (json.free) {
                const freshData = await fetchData()
                const activePlan = freshData?.plans?.find(p => p.id === plan.id) || plan
                setActivatedPlan(activePlan)
                setShowSuccessModal(true)
                return
            }

            // Plan pago: redirigir a MercadoPago
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

    const handleCloseModal = () => {
        setShowSuccessModal(false)
        setActivatedPlan(null)
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
                                ? "Tu plan actual está marcado. Podés renovarlo o cambiarlo en cualquier momento."
                                : "Elegí el plan que mejor se adapte a tu negocio."}
                        </p>
                    </div>
                </div>

                {/* Banner de estado (sólo pending y failure; success se maneja con modal) */}
                <StatusBanner
                    status={paymentStatus === "success" ? (isPolling ? "pending" : null) : paymentStatus}
                    isPolling={isPolling}
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
                                {/* Modal de éxito */}
            {showSuccessModal && (
                <SuccessModal plan={activatedPlan} onClose={handleCloseModal} />
            )}
                </div>
            </div>
    )
}