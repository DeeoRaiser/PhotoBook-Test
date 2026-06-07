import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { getPhotographerMpToken } from "@/lib/mercadopago"
import { activateOrder } from "@/lib/order-helpers"

export async function POST(req) {
    try {
        // ── LOG 1: Body crudo que llegó de MercadoPago ────────────────────────────
        const body = await req.json()
        console.log("[MP Webhook] Body recibido:", JSON.stringify(body, null, 2))

        const { type, data } = body

        if (type !== "payment") {
            console.log("[MP Webhook] Evento ignorado, type:", type)
            return NextResponse.json({ ok: true })
        }

        const paymentId = data?.id
        console.log("[MP Webhook] paymentId:", paymentId)

        if (!paymentId) {
            console.error("[MP Webhook] ERROR: No vino payment id en el body")
            return NextResponse.json({ error: "Sin payment id" }, { status: 400 })
        }

        // ── LOG 2: Intentar obtener orderId con token de plataforma ───────────────
        let orderId = null

        try {
            console.log("[MP Webhook] Intentando obtener pago con token de PLATAFORMA...")
            const { paymentClient } = await import("@/lib/mercadopago")
            const paymentInfo = await paymentClient.get({ id: paymentId })
            console.log("[MP Webhook] Respuesta con token de plataforma:", JSON.stringify({
                id: paymentInfo.id,
                status: paymentInfo.status,
                external_reference: paymentInfo.external_reference,
            }, null, 2))
            orderId = paymentInfo.external_reference
        } catch (e) {
            console.warn("[MP Webhook] No se pudo usar token de plataforma:", e.message)
        }

        // Fallback: query param
        if (!orderId) {
            const url = new URL(req.url)
            const fromQuery = url.searchParams.get("external_reference")
            console.log("[MP Webhook] Buscando orderId en query params:", fromQuery)
            orderId = fromQuery || null
        }

        console.log("[MP Webhook] orderId resuelto:", orderId)

        if (!orderId) {
            console.error("[MP Webhook] ERROR: No se pudo determinar orderId")
            return NextResponse.json({ error: "No se pudo determinar la orden" }, { status: 400 })
        }

        // ── LOG 3: Buscar la orden en la BD ───────────────────────────────────────
        console.log("[MP Webhook] Buscando orden en BD con id:", orderId)
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                gallery: {
                    include: {
                        photographer: {
                            select: { id: true },
                        },
                    },
                },
            },
        })

        if (!order) {
            console.error("[MP Webhook] ERROR: Orden no encontrada en BD para id:", orderId)
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
        }

        console.log("[MP Webhook] Orden encontrada:", JSON.stringify({
            id: order.id,
            status: order.status,
            clientEmail: order.clientEmail,
            downloadToken: order.downloadToken ?? "(vacío)",
        }, null, 2))

        const photographerId = order.gallery?.photographer?.id

        if (!photographerId) {
            console.error("[MP Webhook] ERROR: No se pudo obtener el photographerId de la orden")
            return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 400 })
        }

        // ── Consultar pago: primero con token del fotógrafo, fallback a token de plataforma ──
        let payment
        try {
            const accessToken = await getPhotographerMpToken(photographerId)
            console.log("[MP Webhook] Token del fotógrafo obtenido OK")
            const mpClient = new MercadoPagoConfig({ accessToken })
            const photographerPaymentClient = new Payment(mpClient)
            console.log("[MP Webhook] Consultando pago con token del FOTÓGRAFO, paymentId:", paymentId)
            payment = await photographerPaymentClient.get({ id: paymentId })
            console.log("[MP Webhook] Respuesta con token fotógrafo:", JSON.stringify({
                id: payment.id,
                status: payment.status,
                status_detail: payment.status_detail,
                external_reference: payment.external_reference,
                transaction_amount: payment.transaction_amount,
            }, null, 2))
        } catch (e) {
            console.warn("[MP Webhook] No se pudo usar token del fotógrafo:", e.message, "— intentando con token de plataforma...")
            try {
                const { paymentClient } = await import("@/lib/mercadopago")
                payment = await paymentClient.get({ id: paymentId })
                console.log("[MP Webhook] Respuesta con token de PLATAFORMA:", JSON.stringify({
                    id: payment.id,
                    status: payment.status,
                    status_detail: payment.status_detail,
                    external_reference: payment.external_reference,
                    transaction_amount: payment.transaction_amount,
                }, null, 2))
            } catch (e2) {
                console.error("[MP Webhook] ERROR consultando pago con ambos tokens:", e2.message)
                return NextResponse.json({ error: "Error consultando pago en MP" }, { status: 500 })
            }
        }

        // ── LOG 5: Estado del pago ─────────────────────────────────────────────────
        if (payment.status !== "approved") {
            console.log("[MP Webhook] Pago NO aprobado, status:", payment.status, "| status_detail:", payment.status_detail)
            return NextResponse.json({ ok: true, status: payment.status })
        }

        console.log("[MP Webhook] Pago APROBADO. Activando orden:", orderId)

        // ── LOG 6: Activar la orden ────────────────────────────────────────────────
        try {
            await activateOrder(orderId, String(paymentId), payment.status)
            console.log("[MP Webhook] ✅ Orden activada correctamente:", orderId)
        } catch (e) {
            console.error("[MP Webhook] ERROR al activar la orden:", e.message)
            return NextResponse.json({ error: "Error activando orden" }, { status: 500 })
        }

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error("[MP Webhook] ERROR general no capturado:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// MP también envía GET para verificar el endpoint
export async function GET() {
    return NextResponse.json({ ok: true })
}