import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Preference } from "mercadopago"

// Cliente MP del owner/plataforma
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
})
const preferenceClient = new Preference(mpClient)

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
                    amountPaid: 0,
                    paymentMethod: "free",
                    paymentRef: `free-${photographer.id}-${Date.now()}`,
                    startDate: new Date(),
                },
                update: {
                    planId: plan.id,
                    expiresAt,
                    status: "ACTIVE",
                    amountPaid: 0,
                    paymentMethod: "free",
                    paymentRef: `free-${photographer.id}-${Date.now()}`,
                    startDate: new Date(),
                },
            })

            console.log(`[Checkout] ✅ Plan gratuito "${plan.name}" activado para fotógrafo ${photographer.id}`)

            return NextResponse.json({
                free: true,
                message: `Plan ${plan.name} activado correctamente.`,
            })
        }

        // ─── Plan pago: crear preferencia en MercadoPago ─────────────────────
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

        const preference = await preferenceClient.create({
            body: {
                items: [
                    {
                        id: plan.id,
                        title: `Plan ${plan.name} - PhotoBook`,
                        description: `${plan.durationDays} días · ${plan.maxGalleries === -1 ? "Galerías ilimitadas" : `${plan.maxGalleries} galerías`} · ${plan.maxPhotos === -1 ? "Fotos ilimitadas" : `${plan.maxPhotos} fotos por galería`}`,
                        quantity: 1,
                        unit_price: Number(plan.price),
                        currency_id: "ARS",
                    },
                ],
                payer: {
                    email: photographer.email,
                    name: photographer.name,
                },
                back_urls: {
                    success: `${baseUrl}/dashboard/subscription?status=success`,
                    failure: `${baseUrl}/dashboard/subscription?status=failure`,
                    pending: `${baseUrl}/dashboard/subscription?status=pending`,
                },
                external_reference: JSON.stringify({
                    photographerId: photographer.id,
                    planId: plan.id,
                }),
                notification_url: `${baseUrl}/api/webhooks/mp-subscription`,
                statement_descriptor: "PhotoBook",
                expires: false,
            },
        })

        return NextResponse.json({
            free: false,
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
        })
    } catch (error) {
        console.error("Error en checkout de suscripción:", error)
        return NextResponse.json({ error: "Error al procesar la solicitud de pago" }, { status: 500 })
    }
}
