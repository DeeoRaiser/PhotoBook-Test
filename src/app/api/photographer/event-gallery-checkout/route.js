import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Preference } from "mercadopago"
import slugify from "slugify"
import bcrypt from "bcryptjs"

// Cliente MP de la plataforma (admin)
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
})
const preferenceClient = new Preference(mpClient)

// POST /api/photographer/event-gallery-checkout
// Body: los mismos campos que POST /api/galleries (title, description, isPublic, password,
//        proPhotosAreFree, expiresAt, downloadLinkDuration)
// Respuesta: { preferenceId, initPoint, sandboxInitPoint, paymentId }
export async function POST(req) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const photographerId = session.user.id

        // ── 1. Verificar plan activo con galerías de evento habilitadas ──────
        const photographer = await prisma.photographer.findUnique({
            where: { id: photographerId },
            include: { subscription: { include: { plan: true } } },
        })

        const sub = photographer?.subscription
        const now = new Date()
        const plan = sub?.plan
        const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now

        if (!hasActivePlan) {
            return NextResponse.json({ error: "Sin plan activo" }, { status: 403 })
        }
        if (!plan.allowsEventGalleries) {
            return NextResponse.json({ error: "Tu plan no incluye galerías de evento" }, { status: 403 })
        }

        const extraPrice = Number(plan.extraEventGalleryPrice ?? 0)
        if (extraPrice <= 0) {
            return NextResponse.json(
                { error: "No hay precio de galería extra configurado en tu plan. Contactá al administrador." },
                { status: 403 }
            )
        }

        // ── 2. Confirmar que realmente no le quedan galerías gratis ──────────
        const eventCount = await prisma.gallery.count({
            where: { photographerId, galleryType: "event" },
        })
        const freeLeft = Math.max(0, (plan.freeEventGalleries ?? 0) - eventCount)
        if (freeLeft > 0) {
            return NextResponse.json(
                { error: "Todavía tenés galerías de evento gratuitas disponibles. Usá el flujo normal de creación." },
                { status: 400 }
            )
        }

        // ── 3. Leer y validar los datos de la galería pendiente ──────────────
        const body = await req.json()
        const { title, description, isPublic, password, proPhotosAreFree, expiresAt, downloadLinkDuration } = body

        if (!title || title.trim().length < 2) {
            return NextResponse.json({ error: "El título debe tener al menos 2 caracteres" }, { status: 400 })
        }
        if (isPublic === false && !password) {
            return NextResponse.json({ error: "Las galerías privadas requieren contraseña" }, { status: 400 })
        }

        // ── 4. Crear el registro de pago en estado PENDING ───────────────────
        const pendingGalleryData = {
            title: title.trim(),
            description: description || null,
            isPublic: isPublic !== false,
            password: password || null,
            proPhotosAreFree: proPhotosAreFree === true,
            expiresAt: expiresAt || null,
            downloadLinkDuration: downloadLinkDuration ?? 48,
        }

        const paymentRecord = await prisma.eventGalleryPayment.create({
            data: {
                photographerId,
                status: "PENDING",
                pendingGalleryData,
            },
        })

        // ── 5. Crear preferencia de Mercado Pago ─────────────────────────────
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

        const preference = await preferenceClient.create({
            body: {
                items: [
                    {
                        id: `event-gallery-${paymentRecord.id}`,
                        title: `Galería de Evento Extra: "${title.trim()}"`,
                        description: `Galería de evento adicional para el plan ${plan.name}`,
                        quantity: 1,
                        unit_price: extraPrice,
                        currency_id: "ARS",
                    },
                ],
                payer: {
                    email: photographer.email,
                    name: photographer.name,
                },
                back_urls: {
                    success: `${baseUrl}/dashboard/galleries/new?event_payment=success&pid=${paymentRecord.id}`,
                    failure: `${baseUrl}/dashboard/galleries/new?event_payment=failure&pid=${paymentRecord.id}`,
                    pending: `${baseUrl}/dashboard/galleries/new?event_payment=pending&pid=${paymentRecord.id}`,
                },
                external_reference: JSON.stringify({
                    type: "event_gallery",
                    paymentRecordId: paymentRecord.id,
                    photographerId,
                }),
                notification_url: `${baseUrl}/api/webhooks/mp-event-gallery`,
                statement_descriptor: "PhotoMarket Evento",
                expires: false,
            },
        })

        // Guardar el preferenceId en el registro
        await prisma.eventGalleryPayment.update({
            where: { id: paymentRecord.id },
            data: { mpPreferenceId: preference.id },
        })

        return NextResponse.json({
            paymentRecordId: paymentRecord.id,
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            amount: extraPrice,
        })
    } catch (error) {
        console.error("[EventGalleryCheckout] Error:", error)
        return NextResponse.json({ error: "Error al procesar la solicitud de pago" }, { status: 500 })
    }
}

// GET /api/photographer/event-gallery-checkout?pid=xxx
// Consulta el estado de un pago de galería extra y, si está aprobado,
// devuelve el ID de la galería creada.
export async function GET(req) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const url = new URL(req.url)
        const pid = url.searchParams.get("pid")
        if (!pid) return NextResponse.json({ error: "pid requerido" }, { status: 400 })

        const record = await prisma.eventGalleryPayment.findUnique({ where: { id: pid } })
        if (!record || record.photographerId !== session.user.id) {
            return NextResponse.json({ error: "No encontrado" }, { status: 404 })
        }

        return NextResponse.json({
            status: record.status,
            galleryId: record.galleryId ?? null,
        })
    } catch (error) {
        console.error("[EventGalleryCheckout GET] Error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
