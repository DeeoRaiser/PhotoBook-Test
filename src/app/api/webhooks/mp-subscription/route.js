import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Payment } from "mercadopago"

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
})
const paymentClient = new Payment(mpClient)

export async function POST(req) {
    try {
        const body = await req.json()
        console.log("[MP Subscription Webhook]", JSON.stringify(body))

        // MercadoPago envía topic=payment o type=payment
        const type = body.type || body.topic
        const paymentId = body.data?.id || body.id

        if (type !== "payment" || !paymentId) {
            return NextResponse.json({ received: true })
        }

        // Consultar el pago a MP
        const payment = await paymentClient.get({ id: paymentId })

        if (payment.status !== "approved") {
            console.log(`[MP Subscription] Pago ${paymentId} estado: ${payment.status} — ignorado`)
            return NextResponse.json({ received: true })
        }

        // Parsear external_reference
        let ref
        try {
            ref = JSON.parse(payment.external_reference)
        } catch {
            console.error("[MP Subscription] external_reference inválido:", payment.external_reference)
            return NextResponse.json({ received: true })
        }

        const { photographerId, planId } = ref
        if (!photographerId || !planId) {
            console.error("[MP Subscription] Faltan datos en external_reference")
            return NextResponse.json({ received: true })
        }

        const plan = await prisma.plan.findUnique({ where: { id: planId } })
        if (!plan) {
            console.error("[MP Subscription] Plan no encontrado:", planId)
            return NextResponse.json({ received: true })
        }

        // Evitar procesar el mismo pago dos veces
        const existing = await prisma.subscription.findFirst({
            where: { paymentRef: String(paymentId) },
        })
        if (existing) {
            console.log("[MP Subscription] Pago ya procesado:", paymentId)
            return NextResponse.json({ received: true })
        }

        const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)

        // Upsert — si ya tenía suscripción la renueva/actualiza
        await prisma.subscription.upsert({
            where: { photographerId },
            create: {
                photographerId,
                planId,
                expiresAt,
                status: "ACTIVE",
                amountPaid: payment.transaction_amount,
                paymentMethod: "mp",
                paymentRef: String(paymentId),
                startDate: new Date(),
            },
            update: {
                planId,
                expiresAt,
                status: "ACTIVE",
                amountPaid: payment.transaction_amount,
                paymentMethod: "mp",
                paymentRef: String(paymentId),
                startDate: new Date(),
            },
        })

        console.log(`[MP Subscription] ✅ Suscripción activada para fotógrafo ${photographerId}, plan ${plan.name}`)
        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("[MP Subscription] Error en webhook:", error)
        // Siempre responder 200 a MP para que no reintente indefinidamente
        return NextResponse.json({ received: true })
    }
}

// GET para verificación de URL desde el panel de MP
export async function GET() {
    return NextResponse.json({ ok: true })
}
