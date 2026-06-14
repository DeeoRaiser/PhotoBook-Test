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
        if (type === "subscription_preapproval") {
            await handlePreapproval(resourceId)
            return NextResponse.json({ received: true })
        }

        // ── 2. Evento de pago autorizado (primer cobro + renovaciones) ───────
        // FIX: este evento es el que realmente confirma que el pago fue procesado.
        // Tanto el primer pago como las renovaciones llegan aquí.
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
        return NextResponse.json({ received: true })
    }
}

/**
 * Maneja el evento subscription_preapproval.
 * Con suscripciones recurrentes de MP, este evento llega con status "pending"
 * al crear la suscripción y puede llegar como "authorized" más tarde.
 * El evento principal de activación es subscription_authorized_payment.
 */
async function handlePreapproval(preapprovalId) {
    console.log(`[Preapproval] Procesando: ${preapprovalId}`)

    const preapproval = await mpGet(`/preapproval/${preapprovalId}`)
    console.log(`[Preapproval] Status: ${preapproval.status}`)

    // Manejar cancelaciones y pausas
    if (preapproval.status === "cancelled" || preapproval.status === "paused") {
        await prisma.subscription.updateMany({
            where: { mpSubscriptionId: preapprovalId },
            data: {
                status: preapproval.status === "cancelled" ? "CANCELLED" : "SUSPENDED",
                autoRenew: false,
            },
        })
        console.log(`[Preapproval] Suscripción ${preapprovalId} marcada como ${preapproval.status}`)
        return
    }

    // Si llegó como "authorized", activar directamente (igual que authorized_payment)
    if (preapproval.status === "authorized") {
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

    // status "pending": el fotógrafo acaba de aprobar, esperamos el authorized_payment
    console.log(`[Preapproval] Status "${preapproval.status}" — esperando evento authorized_payment para activar`)
}

/**
 * Maneja el evento subscription_authorized_payment.
 * 
 * FIX PRINCIPAL: Este evento llega TANTO para el primer pago como para renovaciones.
 * Antes solo renovaba suscripciones ya ACTIVE. Ahora también activa las SUSPENDED
 * (que es el estado inicial mientras el usuario no completó el primer cobro).
 */
async function handleAuthorizedPayment(invoiceId) {
    console.log(`[AuthPayment] Procesando invoice: ${invoiceId}`)

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

    // Evitar duplicados
    const already = await prisma.subscriptionPayment.findUnique({
        where: { mpInvoiceId: String(invoiceId) },
    })
    if (already) {
        console.log(`[AuthPayment] Invoice ${invoiceId} ya procesado`)
        return
    }

    // Buscar suscripción por preapproval ID (puede estar SUSPENDED o ACTIVE)
    let sub = await prisma.subscription.findFirst({
        where: { mpSubscriptionId: preapprovalId },
        include: { plan: true },
    })

    // FIX: Si no está en nuestra DB todavía (caso raro de race condition extremo),
    // obtener los datos del preapproval y crear la suscripción
    if (!sub) {
        console.warn(`[AuthPayment] Suscripción no encontrada para preapproval ${preapprovalId}, consultando MP...`)
        try {
            const preapproval = await mpGet(`/preapproval/${preapprovalId}`)
            let ref
            try { ref = JSON.parse(preapproval.external_reference) } catch { ref = null }

            if (ref?.photographerId && ref?.planId) {
                const plan = await prisma.plan.findUnique({ where: { id: ref.planId } })
                if (plan) {
                    const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
                    sub = await prisma.subscription.upsert({
                        where: { photographerId: ref.photographerId },
                        create: {
                            photographerId: ref.photographerId,
                            planId: plan.id,
                            expiresAt,
                            status: "ACTIVE",
                            autoRenew: true,
                            amountPaid: invoice.transaction_amount ?? plan.price,
                            paymentMethod: "mp_subscription",
                            paymentRef: String(invoiceId),
                            mpSubscriptionId: preapprovalId,
                            startDate: new Date(),
                        },
                        update: {
                            planId: plan.id,
                            expiresAt,
                            status: "ACTIVE",
                            autoRenew: true,
                            amountPaid: invoice.transaction_amount ?? plan.price,
                            paymentMethod: "mp_subscription",
                            mpSubscriptionId: preapprovalId,
                            startDate: new Date(),
                        },
                        include: { plan: true },
                    })
                    console.log(`[AuthPayment] ✅ Suscripción creada y activada para fotógrafo ${ref.photographerId}`)
                }
            }
        } catch (err) {
            console.error("[AuthPayment] No se pudo recuperar el preapproval:", err.message)
        }

        if (!sub) return
    }

    // Calcular nueva fecha de vencimiento
    // Si la suscripción está SUSPENDED (primer pago), partir desde ahora
    // Si está ACTIVE (renovación), extender desde la fecha actual de expiración
    const baseDate = (sub.status === "ACTIVE" && sub.expiresAt > new Date())
        ? sub.expiresAt
        : new Date()
    const expiresAt = new Date(baseDate.getTime() + sub.plan.durationDays * 24 * 60 * 60 * 1000)

    // Registrar el pago y activar/renovar la suscripción en una transacción
    await prisma.$transaction([
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
        prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: "ACTIVE",   // ← activa tanto el primer pago como renovaciones
                expiresAt,
                autoRenew: true,
                amountPaid: invoice.transaction_amount ?? sub.plan.price,
                paymentRef: String(invoiceId),
                updatedAt: new Date(),
            },
        }),
    ])

    console.log(`[AuthPayment] ✅ Suscripción ${sub.status === "ACTIVE" ? "renovada" : "activada"} para fotógrafo ${sub.photographerId}. Expiración: ${expiresAt.toISOString()}`)
}

/**
 * Compatibilidad con el webhook de pago único (modo anterior).
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
