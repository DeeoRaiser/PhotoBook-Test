import { prisma } from "@/lib/prisma"
import { sendOrderConfirmationEmail } from "@/lib/mail"
import crypto from "crypto"

export async function activateOrder(orderId, mpPaymentId, mpStatus) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: { include: { photo: true } },
            gallery: {
                select: {
                    title: true,
                    downloadLinkDuration: true,
                    photographer: { select: { name: true, email: true } },
                },
            },
        },
    })

    if (!order) throw new Error("Orden no encontrada")

    // Evitar procesar dos veces
    if (order.downloadToken) return order

    const downloadToken = crypto.randomBytes(32).toString("hex")
    // Usar la duración configurada en la galería (default 48hs si no está definida)
    const durationHours = order.gallery?.downloadLinkDuration ?? 48
    const downloadExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000)
    const baseUrl = process.env.NEXTAUTH_URL

    const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
            status: "DELIVERED",
            mpPaymentId: mpPaymentId ?? null,
            mpStatus: mpStatus ?? "approved",
            downloadToken,
            downloadExpiresAt,
        },
        include: {
            items: { include: { photo: true } },
            gallery: {
                include: {
                    photographer: { select: { name: true } },
                },
            },
        },
    })

    const downloadUrl = `${baseUrl}/download/${downloadToken}`

    // Enviar email con link de descarga
    console.log("[OrderHelpers] Enviando email a:", order.clientEmail, "| downloadUrl:", downloadUrl)
    await sendOrderConfirmationEmail({
        clientName: order.clientName,
        clientEmail: order.clientEmail,
        photographerName: order.gallery.photographer.name,
        galleryTitle: order.gallery.title,
        photos: order.items.map((i) => ({
            title: i.photo.title,
            price: i.price,
        })),
        total: order.total,
        downloadUrl,
        expiresAt: downloadExpiresAt,
    }).catch((err) => console.error("[OrderHelpers] Error enviando email:", err?.message || err))

    return { ...updated, downloadUrl }
}