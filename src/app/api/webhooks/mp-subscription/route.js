// src/app/api/webhooks/mp-subscription/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const MP_API = "https://api.mercadopago.com"
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

async function mpGet(path) {
    const res = await fetch(`${MP_API}${path}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `MP GET error ${res.status} en ${path}`)
    }
    return res.json()
}

export async function POST(req) {
    try {
        const body = await req.json()
        console.log("[MP Sub Webhook] Recibido:", JSON.stringify(body))

        const type = body.type || body.topic
        const resourceId = body.data?.id || body.id

        if (!resourceId) {
            return NextResponse.json({ received: true })
        }

        // ── 1. Evento de suscripción (preapproval) ───────────────────────────
        // Ocurre cuando el usuario aprueba la suscripción en el checkout de MP.
        if (type === "subscription_preapproval") {
            await handlePreapproval(resourceId)
            return NextResponse.json({ received: true })
        }

        // ── 2. Evento de pago autorizado (subscription_authorized_payment) ──
        // Ocurre cada vez que MP cobra exitosamente un período (primer pago y renovaciones).
        if (type === "subscription_authorized_payment") {
            await handleAuthorizedPayment(resourceId)
            return NextResponse.json({ received: true })
        }

        // ── 3. Compatibilidad hacia atrás con evento "payment" (pago único) ──
        if (type === "payment") {
            await handleLegacyPayment(resourceId)
            return NextResponse.json({ received: true })
        }

        console.log(`[MP Sub Webhook] Tipo de evento ignorado: ${type}`)
        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("[MP Sub Webhook] Error:", error)
        // Siempre responder 200 a MP para que no reintente indefinidamente
        return NextResponse.json({ received: true })
    }
}

/**
 * Maneja el evento subscription_preapproval.
 * Cuando el fotógrafo aprueba la suscripción en MP, este evento llega
 * con status "authorized". Activamos la suscripción en nuestra DB.
 */
async function handlePreapproval(preapprovalId) {
    console.log(`[Preapproval] Procesando: ${preapprovalId}`)

    const preapproval = await mpGet(`/preapproval/${preapprovalId}`)
    console.log(`[Preapproval] Status: ${preapproval.status}`)

    // Solo procesar si está autorizado
    if (preapproval.status !== "authorized") {
        // Si fue cancelado/suspendido, actualizar en DB
        if (preapproval.status === "cancelled" || preapproval.status === "paused") {
            await prisma.subscription.updateMany({
                where: { mpSubscriptionId: preapprovalId },
                data: {
                    status: preapproval.status === "cancelled" ? "CANCELLED" : "SUSPENDED",
                    autoRenew: false,
                },
            })
            console.log(`[Preapproval] Suscripción ${preapprovalId} marcada como ${preapproval.status}`)
        }
        return
    }

    // Parsear external_reference
    let ref
    try {
        ref = JSON.parse(preapproval.external_reference)
    } catch {
        console.error("[Preapproval] external_reference inválido:", preapproval.external_reference)
        return
    }

    const { photographerId, planId } = ref
    if (!photographerId || !planId) {
        console.error("[Preapproval] Faltan datos en external_reference")
        return
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) {
        console.error("[Preapproval] Plan no encontrado:", planId)
        return
    }

    // Calcular nueva fecha de vencimiento
    const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)

    await prisma.subscription.upsert({
        where: { photographerId },
        create: {
            photographerId,
            planId,
            expiresAt,
            status: "ACTIVE",
            autoRenew: true,
            amountPaid: preapproval.auto_recurring?.transaction_amount ?? 0,
            paymentMethod: "mp_subscription",
            paymentRef: preapprovalId,
            mpSubscriptionId: preapprovalId,
            startDate: new Date(),
        },
        update: {
            planId,
            expiresAt,
            status: "ACTIVE",
            autoRenew: true,
            amountPaid: preapproval.auto_recurring?.transaction_amount ?? 0,
            paymentMethod: "mp_subscription",
            mpSubscriptionId: preapprovalId,
            startDate: new Date(),
        },
    })

    console.log(`[Preapproval] ✅ Suscripción activada para fotógrafo ${photographerId}, plan ${plan.name}`)
}

/**
 * Maneja el evento subscription_authorized_payment.
 * Ocurre en cada cobro periódico exitoso (primer mes + renovaciones).
 * Renueva la fecha de vencimiento en nuestra DB.
 */
async function handleAuthorizedPayment(invoiceId) {
    console.log(`[AuthPayment] Procesando invoice: ${invoiceId}`)

    // Obtener el detalle del pago autorizado
    const invoice = await mpGet(`/authorized_payments/${invoiceId}`)
    console.log(`[AuthPayment] Status: ${invoice.status}, Preapproval: ${invoice.preapproval_id}`)

    if (invoice.status !== "processed") {
        console.log(`[AuthPayment] Invoice ${invoiceId} no procesado aún, ignorando`)
        return
    }

    const preapprovalId = invoice.preapproval_id
    if (!preapprovalId) {
        console.error("[AuthPayment] Sin preapproval_id en el invoice")
        return
    }

    // Evitar duplicados: verificar si ya procesamos este invoice
    const already = await prisma.subscriptionPayment.findUnique({
        where: { mpInvoiceId: String(invoiceId) },
    })
    if (already) {
        console.log(`[AuthPayment] Invoice ${invoiceId} ya procesado`)
        return
    }

    // Buscar la suscripción por el ID de preapproval de MP
    const sub = await prisma.subscription.findFirst({
        where: { mpSubscriptionId: preapprovalId },
        include: { plan: true },
    })

    if (!sub) {
        console.error("[AuthPayment] Suscripción no encontrada para preapproval:", preapprovalId)
        return
    }

    // Renovar: sumar 1 mes a la fecha de vencimiento actual (o desde ahora si ya expiró)
    const baseDate = sub.expiresAt > new Date() ? sub.expiresAt : new Date()
    const expiresAt = new Date(baseDate.getTime() + sub.plan.durationDays * 24 * 60 * 60 * 1000)

    // Registrar el pago y actualizar la suscripción en una transacción
    await prisma.$transaction([
        // Crear registro histórico del pago
        prisma.subscriptionPayment.create({
            data: {
                subscriptionId: sub.id,
                mpInvoiceId: String(invoiceId),
                mpPreapprovalId: preapprovalId,
                amount: invoice.transaction_amount ?? sub.plan.price,
                currency: "ARS",
                status: "approved",
                paidAt: new Date(),
            },
        }),
        // Renovar la suscripción
        prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: "ACTIVE",
                expiresAt,
                autoRenew: true,
                amountPaid: invoice.transaction_amount ?? sub.plan.price,
                paymentRef: String(invoiceId),
                updatedAt: new Date(),
            },
        }),
    ])

    console.log(`[AuthPayment] ✅ Suscripción renovada para fotógrafo ${sub.photographerId}. Nueva expiración: ${expiresAt.toISOString()}`)
}

/**
 * Compatibilidad con el webhook de pago único (modo anterior).
 * Se puede eliminar una vez que todos los fotógrafos migren a suscripciones.
 */
async function handleLegacyPayment(paymentId) {
    const { MercadoPagoConfig, Payment } = await import("mercadopago")
    const mpClient = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })
    const paymentClient = new Payment(mpClient)

    const payment = await paymentClient.get({ id: paymentId })

    if (payment.status !== "approved") {
        console.log(`[Legacy] Pago ${paymentId} estado: ${payment.status} — ignorado`)
        return
    }

    let ref
    try {
        ref = JSON.parse(payment.external_reference)
    } catch {
        return
    }

    const { photographerId, planId } = ref
    if (!photographerId || !planId) return

    const existing = await prisma.subscription.findFirst({
        where: { paymentRef: String(paymentId) },
    })
    if (existing) {
        console.log("[Legacy] Pago ya procesado:", paymentId)
        return
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) return

    const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)

    await prisma.subscription.upsert({
        where: { photographerId },
        create: {
            photographerId,
            planId,
            expiresAt,
            status: "ACTIVE",
            autoRenew: false,
            amountPaid: payment.transaction_amount,
            paymentMethod: "mp",
            paymentRef: String(paymentId),
            startDate: new Date(),
        },
        update: {
            planId,
            expiresAt,
            status: "ACTIVE",
            autoRenew: false,
            amountPaid: payment.transaction_amount,
            paymentMethod: "mp",
            paymentRef: String(paymentId),
            startDate: new Date(),
        },
    })

    console.log(`[Legacy] ✅ Suscripción (pago único) activada para fotógrafo ${photographerId}`)
}

// GET para verificación de URL desde el panel de MP
export async function GET() {
    return NextResponse.json({ ok: true })
}
