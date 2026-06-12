// src/app/api/photographer/subscription/checkout/route.js
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MP_API = "https://api.mercadopago.com"
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const BASE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")

/**
 * Crea una suscripción recurrente en MercadoPago (preapproval).
 * MP debitará automáticamente cada 30 días.
 */
async function createMpSubscription({ plan, photographer }) {
    const body = {
        reason: `Plan ${plan.name} - PhotoBook`,
        external_reference: JSON.stringify({
            photographerId: photographer.id,
            planId: plan.id,
        }),
        payer_email: photographer.email,
        auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: Number(plan.price),
            currency_id: "ARS",
        },
        back_url: `${BASE_URL}/dashboard/subscription?status=success`,
        status: "pending",
    }

    const res = await fetch(`${MP_API}/preapproval`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `MP Subscription error ${res.status}`)
    }

    return res.json()
    // Respuesta incluye: id, init_point, status, auto_recurring, etc.
}

export async function POST(req) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { planId } = await req.json()
        if (!planId) {
            return NextResponse.json({ error: "planId requerido" }, { status: 400 })
        }

        const [photographer, plan] = await Promise.all([
            prisma.photographer.findUnique({ where: { id: session.user.id } }),
            prisma.plan.findUnique({ where: { id: planId, isActive: true } }),
        ])

        if (!photographer) {
            return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 404 })
        }
        if (!plan) {
            return NextResponse.json({ error: "Plan no encontrado o inactivo" }, { status: 404 })
        }

        // ─── Plan gratuito: activar directamente sin pasar por MercadoPago ───
        if (Number(plan.price) === 0) {
            const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)

            await prisma.subscription.upsert({
                where: { photographerId: photographer.id },
                create: {
                    photographerId: photographer.id,
                    planId: plan.id,
                    expiresAt,
                    status: "ACTIVE",
                    autoRenew: false,
                    amountPaid: 0,
                    paymentMethod: "free",
                    paymentRef: `free-${photographer.id}-${Date.now()}`,
                    startDate: new Date(),
                },
                update: {
                    planId: plan.id,
                    expiresAt,
                    status: "ACTIVE",
                    autoRenew: false,
                    amountPaid: 0,
                    paymentMethod: "free",
                    paymentRef: `free-${photographer.id}-${Date.now()}`,
                    startDate: new Date(),
                },
            })

            console.log(`[Checkout] ✅ Plan gratuito "${plan.name}" activado para fotógrafo ${photographer.id}`)
            return NextResponse.json({ free: true, message: `Plan ${plan.name} activado correctamente.` })
        }

        // ─── Si ya tiene una suscripción MP activa, cancelarla antes de crear una nueva ───
        const existingSub = await prisma.subscription.findUnique({
            where: { photographerId: photographer.id },
        })

        if (existingSub?.mpSubscriptionId) {
            try {
                await fetch(`${MP_API}/preapproval/${existingSub.mpSubscriptionId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${ACCESS_TOKEN}`,
                    },
                    body: JSON.stringify({ status: "cancelled" }),
                })
                console.log(`[Checkout] Suscripción MP anterior cancelada: ${existingSub.mpSubscriptionId}`)
            } catch (err) {
                // No bloquear si falla la cancelación del anterior
                console.warn("[Checkout] No se pudo cancelar suscripción anterior:", err.message)
            }
        }

        // ─── Plan pago: crear suscripción recurrente en MercadoPago ─────────────────────
        const mpSub = await createMpSubscription({ plan, photographer })

        console.log(`[Checkout] Suscripción MP creada: ${mpSub.id} para fotógrafo ${photographer.id}`)

        // Guardar el ID de suscripción MP en nuestra DB (estado pending hasta que MP confirme)
        await prisma.subscription.upsert({
            where: { photographerId: photographer.id },
            create: {
                photographerId: photographer.id,
                planId: plan.id,
                // expiresAt temporal, se actualiza cuando el webhook confirma el pago
                expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
                status: "SUSPENDED",
                autoRenew: true,
                amountPaid: 0,
                paymentMethod: "mp_subscription",
                paymentRef: null,
                mpSubscriptionId: mpSub.id,
                startDate: new Date(),
            },
            update: {
                planId: plan.id,
                expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
                status: "SUSPENDED",
                autoRenew: true,
                amountPaid: 0,
                paymentMethod: "mp_subscription",
                paymentRef: null,
                mpSubscriptionId: mpSub.id,
                startDate: new Date(),
            },
        })

        return NextResponse.json({
            free: false,
            subscriptionId: mpSub.id,
            initPoint: mpSub.init_point,
            sandboxInitPoint: mpSub.sandbox_init_point || mpSub.init_point,
        })
    } catch (error) {
        console.error("Error en checkout de suscripción:", error)
        return NextResponse.json({ error: "Error al procesar la solicitud de pago" }, { status: 500 })
    }
}
