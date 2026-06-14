// src/app/api/photographer/subscription/route.js
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MP_API = "https://api.mercadopago.com"
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

/**
 * FIX: Cuando el fotógrafo vuelve del checkout de MP y el frontend hace polling,
 * si la suscripción sigue en SUSPENDED, consultamos directamente a la API de MP
 * para verificar si el preapproval ya fue autorizado y el pago procesado.
 * Esto resuelve el caso donde el webhook de MP llega con retraso.
 */
async function syncSubscriptionWithMP(sub) {
    if (!sub?.mpSubscriptionId || sub.status !== "SUSPENDED") return sub

    try {
        // Verificar si el preapproval ya está autorizado en MP
        const res = await fetch(`${MP_API}/preapproval/${sub.mpSubscriptionId}`, {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        })
        if (!res.ok) return sub

        const preapproval = await res.json()
        console.log(`[Sub Sync] Preapproval ${sub.mpSubscriptionId} status en MP: ${preapproval.status}`)

        if (preapproval.status !== "authorized") return sub

        // El preapproval está autorizado — verificar si hay un pago procesado
        // Buscar en authorized_payments por este preapproval
        const paymentsRes = await fetch(
            `${MP_API}/authorized_payments/search?preapproval_id=${sub.mpSubscriptionId}&status=processed`,
            { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
        )

        let expiresAt = new Date(Date.now() + sub.plan.durationDays * 24 * 60 * 60 * 1000)
        let amountPaid = sub.plan.price
        let paymentRef = sub.mpSubscriptionId

        if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json()
            const payments = paymentsData.results || []
            
            if (payments.length > 0) {
                const lastPayment = payments[0]
                amountPaid = lastPayment.transaction_amount ?? amountPaid
                paymentRef = String(lastPayment.id)
                
                // Registrar el pago si no existe
                const existingPayment = await prisma.subscriptionPayment.findUnique({
                    where: { mpInvoiceId: String(lastPayment.id) },
                })
                if (!existingPayment) {
                    await prisma.subscriptionPayment.create({
                        data: {
                            subscriptionId: sub.id,
                            mpInvoiceId: String(lastPayment.id),
                            mpPreapprovalId: sub.mpSubscriptionId,
                            amount: amountPaid,
                            currency: "ARS",
                            status: "approved",
                            paidAt: new Date(),
                        },
                    }).catch(err => console.warn("[Sub Sync] No se pudo registrar el pago:", err.message))
                }
            }
        }

        // Activar la suscripción
        const updated = await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: "ACTIVE",
                expiresAt,
                autoRenew: true,
                amountPaid,
                paymentRef,
                updatedAt: new Date(),
            },
            include: { plan: true },
        })

        console.log(`[Sub Sync] ✅ Suscripción ${sub.id} activada via sync directo con MP`)
        return updated
    } catch (err) {
        console.error("[Sub Sync] Error al sincronizar con MP:", err.message)
        return sub
    }
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        })

        if (!photographer) {
            return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 404 })
        }

        let subscription = photographer.subscription

        // Verificar si la suscripción expiró
        if (
            subscription &&
            subscription.status === "ACTIVE" &&
            new Date(subscription.expiresAt) < new Date()
        ) {
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: "EXPIRED" },
            })
            subscription.status = "EXPIRED"
        }

        // FIX: Si la suscripción está SUSPENDED (pago pendiente de confirmación),
        // intentar sincronizar con MP antes de responder al polling del frontend
        if (subscription?.status === "SUSPENDED" && subscription?.mpSubscriptionId) {
            subscription = await syncSubscriptionWithMP(subscription)
        }

        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" },
        })

        return NextResponse.json({
            subscription,
            plans,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
