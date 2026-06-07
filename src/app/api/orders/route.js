import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { getPhotographerMpToken } from "@/lib/mercadopago"
import { buildWhatsAppDeepLink, buildWhatsAppOrderMessage, generateUniqueOrderCode } from "@/lib/whatsapp-orders"
import { z } from "zod"

const orderSchema = z.object({
    clientName: z.string().min(2),
    clientEmail: z.string().email(),
    clientPhone: z.string().optional(),
    galleryId: z.string(),
    photos: z.array(z.object({
        id: z.string(),
        price: z.number(),
        itemType: z.enum(["digital", "print", "both"]).default("digital"),
        printPrice: z.number().nullable().optional(),
    })).min(1),
    tieredTotal: z.number().optional(),
    receiptDataUrl: z.string().nullable().optional(),
    clientPaymentMethod: z.enum(["mercadopago","transferencia","manual"]).optional(),
})

export async function POST(req) {
    try {
        const body = await req.json()
        const parsed = orderSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { clientName, clientEmail, galleryId, photos, tieredTotal, receiptDataUrl, clientPaymentMethod } = parsed.data

        console.log("[Orders] Buscando galería:", galleryId)
        const gallery = await prisma.gallery.findUnique({
            where: { id: galleryId },
            include: {
                photographer: {
                    select: { id: true, name: true, email: true, mpUserId: true },
                },
                pricingTiers: true,
            },
        })
        if (!gallery) {
            return NextResponse.json({ error: "Galería no encontrada" }, { status: 404 })
        }

        const photoIds = photos.map((p) => p.id)
        const dbPhotos = await prisma.photo.findMany({
            where: { id: { in: photoIds }, galleryId },
        })
        if (dbPhotos.length !== photoIds.length) {
            return NextResponse.json({ error: "Algunas fotos no son válidas" }, { status: 400 })
        }

        // Calcular total según modo de pricing
        let total
        let itemPrices  // precio por item para guardar en OrderItem

        if (gallery.pricingMode === "tiered" && gallery.pricingTiers.length > 0) {
            const qty = dbPhotos.length
            const tiers = [...gallery.pricingTiers].sort((a, b) => a.minQty - b.minQty)
            const tier = tiers.find(
                (t) => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty)
            ) || tiers[tiers.length - 1]

            const pricePerPhoto = Number(tier.price)
            total = pricePerPhoto * qty
            itemPrices = dbPhotos.map(() => pricePerPhoto)
        } else {
            // per_photo: usar el precio del cliente que ya incluye printPrice si aplica
            // Validar que el precio enviado es coherente con los datos de la DB
            const photoMap = Object.fromEntries(photos.map(p => [p.id, p]))
            itemPrices = dbPhotos.map((dbPhoto) => {
                const clientItem = photoMap[dbPhoto.id]
                const basePrice = Number(dbPhoto.price)
                const printPrice = dbPhoto.printPrice != null ? Number(dbPhoto.printPrice) : 0
                const itemType = clientItem?.itemType || "digital"

                // Recalcular precio server-side para evitar manipulación
                if (itemType === "print")  return printPrice
                if (itemType === "both")   return basePrice + printPrice
                return basePrice
            })
            total = itemPrices.reduce((sum, p) => sum + p, 0)
        }

        console.log("[Orders] Creando orden en DB, total:", total)
        const whatsappCode = await generateUniqueOrderCode(prisma)

        // Crear orden PENDING — guardamos snapshot de título de galería y datos de fotos
        // para que el historial persista aunque se eliminen galería/fotos en el futuro
        const order = await prisma.order.create({
            data: {
                clientName,
                clientEmail,
                clientPhone: parsed.data.clientPhone ?? null,
                whatsappCode,
                total,
                galleryId,
                galleryTitle:    gallery.title,
                photographerId:  gallery.photographer.id ?? null,
                status: "PENDING",
                receiptUrl: receiptDataUrl || null,
                clientPaymentMethod: clientPaymentMethod || null,
                items: {
                    create: dbPhotos.map((photo, i) => {
                        const clientItem = photos.find(p => p.id === photo.id)
                        const itemType = clientItem?.itemType || "digital"
                        const printPrice = itemType !== "digital" && photo.printPrice != null
                            ? Number(photo.printPrice)
                            : null
                        return {
                            photo:      { connect: { id: photo.id } },
                            price:      itemPrices[i],
                            itemType,
                            photoTitle: photo.title || null,
                            photoUrl:   photo.bunnyUrl,
                        }
                    }),
                },
            },
        })

        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const whatsappMessage = buildWhatsAppOrderMessage(order.whatsappCode)
        const whatsappLink = buildWhatsAppDeepLink(process.env.WHATSAPP_BOT_PUBLIC_NUMBER || process.env.WHATSAPP_BOT_PHONE_NUMBER, whatsappMessage)
        const photographerId = gallery.photographer.id
        const photographerMpUserId = gallery.photographer.mpUserId

        console.log("[Orders] Orden creada:", order.id, "| método:", clientPaymentMethod)
        // ── Con Mercado Pago ────────────────────
        if (clientPaymentMethod === "mercadopago") {
            try {
                const accessToken = await getPhotographerMpToken(photographerId)
                const mpClient = new MercadoPagoConfig({ accessToken })
                const preferenceClient = new Preference(mpClient)

                const preference = await preferenceClient.create({
                    body: {
                        external_reference: order.id,
                        // collector_id indica a qué cuenta de MP va el dinero (la del fotógrafo)
                        ...(photographerMpUserId && { collector_id: Number(photographerMpUserId) }),
                        payer: { name: clientName, email: clientEmail },
                        items: gallery.pricingMode === "tiered"
                            ? [{
                                id: galleryId,
                                title: `Paquete ${dbPhotos.length} fotos — ${gallery.title}`,
                                quantity: 1,
                                unit_price: total,
                                currency_id: "ARS",
                            }]
                            : dbPhotos.map((photo, i) => {
                                const clientItem = photos.find(p => p.id === photo.id)
                                const itemType = clientItem?.itemType || "digital"
                                const typeSuffix = itemType === "print" ? " (Impresión)" : itemType === "both" ? " (Digital + Impresión)" : ""
                                return {
                                    id: photo.id,
                                    title: (photo.title || "Foto") + typeSuffix,
                                    quantity: 1,
                                    unit_price: itemPrices[i],
                                    currency_id: "ARS",
                                }
                            }),
                        back_urls: {
                            success: `${baseUrl}/payment/success?order=${order.id}`,
                            failure: `${baseUrl}/payment/failure?order=${order.id}`,
                            pending: `${baseUrl}/payment/pending?order=${order.id}`,
                        },
                        ...(baseUrl && !baseUrl.includes('localhost') && { auto_return: "approved" }),
                        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                        statement_descriptor: "PhotoBook",
                        metadata: { orderId: order.id },
                    },
                })

                await prisma.order.update({
                    where: { id: order.id },
                    data: { mpPreferenceId: preference.id },
                })

                return NextResponse.json({
                    orderId: order.id,
                    whatsappCode: order.whatsappCode,
                    whatsappMessage,
                    whatsappLink,
                    mode: "mercadopago",
                    initPoint: preference.init_point,
                }, { status: 201 })

            } catch (mpError) {
                console.error("[Orders] Error MP:", mpError?.message || mpError)
                return NextResponse.json(
                    { error: "Error al crear preferencia de pago: " + (mpError?.message || "Error desconocido") },
                    { status: 500 }
                )
            }
        }

        // ── Sin Mercado Pago — modo manual ────────────────────
        return NextResponse.json({
            orderId: order.id,
            whatsappCode: order.whatsappCode,
            whatsappMessage,
            whatsappLink,
            mode: "manual",
            initPoint: null,
            clientEmail,
        }, { status: 201 })

    } catch (error) {
        console.error("Error creando orden:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}