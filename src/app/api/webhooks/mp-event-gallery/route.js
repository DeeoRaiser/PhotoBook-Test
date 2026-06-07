import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Payment } from "mercadopago"
import slugify from "slugify"
import bcrypt from "bcryptjs"

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
})
const paymentClient = new Payment(mpClient)

export async function POST(req) {
    try {
        const body = await req.json()
        console.log("[MP EventGallery Webhook] Body:", JSON.stringify(body))

        const type = body.type || body.topic
        const paymentId = body.data?.id || body.id

        if (type !== "payment" || !paymentId) {
            return NextResponse.json({ received: true })
        }

        // ── Consultar el pago a MP ───────────────────────────────────────────
        const payment = await paymentClient.get({ id: paymentId })
        console.log("[MP EventGallery Webhook] Pago:", payment.status, payment.external_reference)

        if (payment.status !== "approved") {
            // Si el pago falló, marcar el registro
            if (payment.status === "rejected" || payment.status === "cancelled") {
                try {
                    const ref = JSON.parse(payment.external_reference || "{}")
                    if (ref.type === "event_gallery" && ref.paymentRecordId) {
                        await prisma.eventGalleryPayment.update({
                            where: { id: ref.paymentRecordId },
                            data: { status: "FAILED", mpPaymentId: String(paymentId) },
                        })
                    }
                } catch {}
            }
            return NextResponse.json({ received: true })
        }

        // ── Parsear external_reference ───────────────────────────────────────
        let ref
        try {
            ref = JSON.parse(payment.external_reference)
        } catch {
            console.error("[MP EventGallery] external_reference inválido:", payment.external_reference)
            return NextResponse.json({ received: true })
        }

        if (ref.type !== "event_gallery" || !ref.paymentRecordId || !ref.photographerId) {
            console.log("[MP EventGallery] No es un pago de galería de evento, ignorado")
            return NextResponse.json({ received: true })
        }

        const { paymentRecordId, photographerId } = ref

        // ── Idempotencia: evitar procesar dos veces ──────────────────────────
        const existing = await prisma.eventGalleryPayment.findFirst({
            where: { mpPaymentId: String(paymentId) },
        })
        if (existing) {
            console.log("[MP EventGallery] Pago ya procesado:", paymentId)
            return NextResponse.json({ received: true })
        }

        // ── Obtener el registro de pago con los datos de la galería ──────────
        const record = await prisma.eventGalleryPayment.findUnique({
            where: { id: paymentRecordId },
        })
        if (!record) {
            console.error("[MP EventGallery] Registro de pago no encontrado:", paymentRecordId)
            return NextResponse.json({ received: true })
        }
        if (record.status === "APPROVED") {
            console.log("[MP EventGallery] Registro ya aprobado, ignorado")
            return NextResponse.json({ received: true })
        }

        // ── Crear la galería ─────────────────────────────────────────────────
        const data = record.pendingGalleryData
        let baseSlug = slugify(data.title, { lower: true, strict: true })
        let slug = baseSlug
        let count = 1
        while (await prisma.gallery.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${count++}`
        }

        const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null

        const gallery = await prisma.gallery.create({
            data: {
                title: data.title,
                description: data.description || null,
                slug,
                isPublic: data.isPublic !== false,
                password: hashedPassword,
                galleryType: "event",
                proPhotosAreFree: data.proPhotosAreFree === true,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                downloadLinkDuration: data.downloadLinkDuration ?? 48,
                photographerId,
            },
        })

        // ── Marcar el pago como aprobado y vincular la galería ───────────────
        await prisma.eventGalleryPayment.update({
            where: { id: paymentRecordId },
            data: {
                status: "APPROVED",
                mpPaymentId: String(paymentId),
                amountPaid: payment.transaction_amount,
                galleryId: gallery.id,
            },
        })

        console.log(`[MP EventGallery] ✅ Galería creada: ${gallery.id} (slug: ${gallery.slug}) para fotógrafo ${photographerId}`)
        return NextResponse.json({ received: true })

    } catch (error) {
        console.error("[MP EventGallery Webhook] Error:", error)
        return NextResponse.json({ received: true })
    }
}

export async function GET() {
    return NextResponse.json({ ok: true })
}
