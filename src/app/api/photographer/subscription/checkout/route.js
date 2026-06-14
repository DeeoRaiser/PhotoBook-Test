// src/app/api/photographer/subscription/checkout/route.js
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MP_API = "https://api.mercadopago.com"
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const BASE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")

/**
 * Calcula el crédito por días no usados del plan actual.
 *
 * Ejemplo: Plan A $100/30 días, lleva 15 días usados → quedan 15 días.
 * Crédito = (100 / 30) * 15 = $50.
 * El nuevo plan de $200 queda en $150.
 *
 * @returns {{ creditAmount: number, daysRemaining: number, dailyRate: number }}
 */
function calcUpgradeCredit(currentSubscription) {
    if (
        !currentSubscription ||
        currentSubscription.status !== "ACTIVE" ||
        !currentSubscription.plan ||
        !currentSubscription.expiresAt
    ) {
        return { creditAmount: 0, daysRemaining: 0, dailyRate: 0 }
    }

    const now = new Date()
    const expiresAt = new Date(currentSubscription.expiresAt)

    // Días restantes (fracción incluida para mayor precisión, redondeamos al final)
    const msRemaining = expiresAt - now
    if (msRemaining <= 0) return { creditAmount: 0, daysRemaining: 0, dailyRate: 0 }

    const daysRemaining = msRemaining / (1000 * 60 * 60 * 24)
    const planPrice = Number(currentSubscription.plan.price)
    const planDuration = currentSubscription.plan.durationDays || 30
    const dailyRate = planPrice / planDuration

    // Crédito = tarifa diaria × días restantes, redondeado a 2 decimales
    const creditAmount = Math.round(dailyRate * daysRemaining * 100) / 100

    return {
        creditAmount,
        daysRemaining: Math.ceil(daysRemaining),
        dailyRate: Math.round(dailyRate * 100) / 100,
    }
}

/**
 * Crea una suscripción recurrente en MercadoPago (preapproval).
 * Si hay un descuento por upgrade, el primer cobro se hace por el monto ajustado.
 * MP debitará el precio completo del plan a partir del segundo mes.
 */
async function createMpSubscription({ plan, photographer, firstPaymentAmount }) {
    const chargeAmount = firstPaymentAmount ?? Number(plan.price)

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
            transaction_amount: chargeAmount,
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

        // ─── Plan gratuito: activar directamente ─────────────────────────────
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
                    notes: null,
                },
            })

            console.log(`[Checkout] ✅ Plan gratuito "${plan.name}" activado para fotógrafo ${photographer.id}`)
            return NextResponse.json({ free: true, message: `Plan ${plan.name} activado correctamente.` })
        }

        // ─── Buscar suscripción activa existente ──────────────────────────────
        const existingSub = await prisma.subscription.findUnique({
            where: { photographerId: photographer.id },
            include: { plan: true },
        })

        // ─── Calcular descuento por cambio de plan ────────────────────────────
        // Solo aplica cuando el fotógrafo ya tiene un plan activo diferente al nuevo
        const isChangingPlan = existingSub?.status === "ACTIVE" && existingSub.planId !== planId
        const { creditAmount, daysRemaining, dailyRate } = isChangingPlan
            ? calcUpgradeCredit(existingSub)
            : { creditAmount: 0, daysRemaining: 0, dailyRate: 0 }

        const planPrice = Number(plan.price)
        // El primer cobro tiene el descuento aplicado (mínimo $1 para que MP no rechace)
        const firstPaymentAmount = isChangingPlan
            ? Math.max(1, Math.round((planPrice - creditAmount) * 100) / 100)
            : planPrice

        const hasDiscount = isChangingPlan && creditAmount > 0

        if (hasDiscount) {
            console.log(
                `[Checkout] Cambio de plan detectado. ` +
                `Plan anterior: ${existingSub.plan.name} ($${existingSub.plan.price}). ` +
                `Días restantes: ${daysRemaining}. ` +
                `Crédito: $${creditAmount}. ` +
                `Primer cobro: $${firstPaymentAmount} (en vez de $${planPrice})`
            )
        }

        // ─── Cancelar suscripción MP anterior si existe ───────────────────────
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
                console.warn("[Checkout] No se pudo cancelar suscripción anterior:", err.message)
            }
        }

        // ─── Crear suscripción recurrente en MercadoPago ─────────────────────
        const mpSub = await createMpSubscription({
            plan,
            photographer,
            firstPaymentAmount: hasDiscount ? firstPaymentAmount : undefined,
        })

        console.log(`[Checkout] Suscripción MP creada: ${mpSub.id} para fotógrafo ${photographer.id}`)

        // ─── Guardar en DB con el detalle del descuento si corresponde ────────
        const discountNote = hasDiscount
            ? JSON.stringify({
                previousPlanName: existingSub.plan.name,
                previousPlanPrice: Number(existingSub.plan.price),
                daysRemaining,
                dailyRate,
                creditAmount,
                newPlanPrice: planPrice,
                firstPaymentAmount,
            })
            : null

        await prisma.subscription.upsert({
            where: { photographerId: photographer.id },
            create: {
                photographerId: photographer.id,
                planId: plan.id,
                expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
                status: "SUSPENDED",
                autoRenew: true,
                amountPaid: 0,
                paymentMethod: "mp_subscription",
                paymentRef: null,
                mpSubscriptionId: mpSub.id,
                startDate: new Date(),
                notes: discountNote,
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
                notes: discountNote,
            },
        })

        return NextResponse.json({
            free: false,
            subscriptionId: mpSub.id,
            initPoint: mpSub.init_point,
            sandboxInitPoint: mpSub.sandbox_init_point || mpSub.init_point,
            // Devolver info del descuento al frontend para mostrarlo
            discount: hasDiscount
                ? {
                    creditAmount,
                    daysRemaining,
                    originalPrice: planPrice,
                    finalPrice: firstPaymentAmount,
                }
                : null,
        })
    } catch (error) {
        console.error("Error en checkout de suscripción:", error)
        return NextResponse.json({ error: "Error al procesar la solicitud de pago" }, { status: 500 })
    }
}
