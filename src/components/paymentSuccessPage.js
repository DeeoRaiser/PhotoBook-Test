"use client"
import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Download, Clock, Loader2, Mail, MessageCircle } from "lucide-react"

const MAX_ATTEMPTS = 20 // 20 × 3s = ~60 segundos de polling

function PaymentSuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("order")

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (!orderId) {
            setLoading(false)
            return
        }

        let cancelled = false
        let attempt = 0

        const poll = async () => {
            if (cancelled) return

            try {
                const res = await fetch(`/api/orders/${orderId}/status`)

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`)
                }

                const data = await res.json()
                if (cancelled) return

                setOrder(data)

                // Seguir reintentando si sigue PENDING y tiene token de descarga nulo
                const isPending = data.status === "PENDING" || !data.downloadToken
                if (isPending && attempt < MAX_ATTEMPTS) {
                    attempt++
                    setTimeout(poll, 3000)
                } else {
                    setLoading(false)
                }
            } catch {
                if (cancelled) return
                // Error de red: reintentar hasta el límite
                if (attempt < MAX_ATTEMPTS) {
                    attempt++
                    setTimeout(poll, 3000)
                } else {
                    setFailed(true)
                    setLoading(false)
                }
            }
        }

        poll()
        return () => { cancelled = true }
    }, [orderId])

    if (!orderId) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <p className="text-neutral-500">Orden no encontrada.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <Loader2 size={36} className="animate-spin text-neutral-400 mx-auto" />
                    <p className="text-neutral-600 font-medium">Confirmando tu pago...</p>
                    <p className="text-neutral-400 text-sm">Esto puede demorar unos segundos</p>
                </div>
            </div>
        )
    }

    if (failed || !order) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <CheckCircle size={36} className="text-green-500 mx-auto" />
                    <p className="text-neutral-800 font-semibold">¡Tu pago fue procesado!</p>
                    <p className="text-neutral-500 text-sm">
                        Recibirás el link de descarga en tu email en unos minutos.
                        Si no llega, revisá la carpeta de spam.
                    </p>
                </div>
            </div>
        )
    }

    const downloadToken = order?.downloadToken

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="bg-neutral-900 px-6 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-400/20 rounded-full mb-4">
                        <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <h1 className="text-white text-xl font-semibold mb-1">
                        ¡Pago confirmado!
                    </h1>
                    <p className="text-neutral-400 text-sm">
                        Hola {order?.clientName}, tu compra fue procesada.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <Mail size={16} className="text-blue-500 shrink-0" />
                        <div>
                            <p className="text-sm text-blue-800 font-medium">Email enviado</p>
                            <p className="text-xs text-blue-600">
                                Revisá <span className="font-semibold">{order?.clientEmail}</span>
                            </p>
                        </div>
                    </div>

                    {order?.whatsappLink && (
                        <div className="space-y-3 bg-green-50 border border-green-100 rounded-xl px-4 py-4">
                            <div className="flex items-start gap-3">
                                <MessageCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm text-green-900 font-semibold">Recibir por WhatsApp</p>
                                    <p className="text-xs text-green-700">
                                        Tocá el botón y enviá el mensaje prearmado para validar tu pedido con el bot.
                                    </p>
                                    {order?.whatsappCode && (
                                        <p className="text-xs text-green-800 font-medium">
                                            Código de pedido: {order.whatsappCode}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <a
                                href={order.whatsappLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                            >
                                <MessageCircle size={18} />
                                Solicitar fotos por WhatsApp
                            </a>
                        </div>
                    )}

                    {downloadToken ? (
                        <div className="space-y-3">
                            <a
                                href={`/api/download/${downloadToken}`}
                                download
                                className="flex items-center justify-center gap-2 w-full bg-neutral-900 hover:bg-neutral-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                            >
                                <Download size={18} />
                                Descargar mis fotos en ZIP
                            </a>
                            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                                <Clock size={11} />
                                <span>Link válido por 72 horas · también en tu email</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500 text-center">
                            El link de descarga llegará a tu email en instantes.
                        </p>
                    )}

                    {order?.items && (
                        <div className="bg-neutral-50 rounded-xl p-4">
                            <p className="text-xs text-neutral-400 mb-3 font-medium uppercase tracking-wide">
                                Resumen
                            </p>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {order.items.map((item, i) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-neutral-600 truncate flex-1 pr-2">
                                            {item.photo?.title || `Foto ${i + 1}`}
                                        </span>
                                        <span className="text-neutral-900 font-medium shrink-0">
                                            ${Number(item.price).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-neutral-200 mt-3 pt-3 flex justify-between">
                                <span className="text-sm font-semibold text-neutral-700">Total pagado</span>
                                <span className="text-sm font-semibold text-neutral-900">
                                    ${Number(order.total).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <Loader2 size={36} className="animate-spin text-neutral-400 mx-auto" />
                <p className="text-neutral-600 font-medium">Cargando...</p>
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    )
}
