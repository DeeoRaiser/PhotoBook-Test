import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildWhatsAppDeepLink, buildWhatsAppOrderMessage } from "@/lib/whatsapp-orders"

export async function GET(req, context) {
    try {
        const params = await context.params
        const { id } = params

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                downloadToken: true,
                downloadExpiresAt: true,
                whatsappCode: true,
                clientEmail: true,
                clientName: true,
                total: true,
                mpStatus: true,
                items: {
                    include: {
                        photo: { select: { title: true } },
                    },
                },
            },
        })

        if (!order) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
        }

        const baseUrl = process.env.NEXTAUTH_URL
        const downloadUrl = order.downloadToken
            ? `${baseUrl}/download/${order.downloadToken}`
            : null
        const whatsappMessage = order.whatsappCode
            ? buildWhatsAppOrderMessage(order.whatsappCode)
            : null
        const whatsappLink = whatsappMessage
            ? buildWhatsAppDeepLink(process.env.WHATSAPP_BOT_PUBLIC_NUMBER || process.env.WHATSAPP_BOT_PHONE_NUMBER, whatsappMessage)
            : null

        return NextResponse.json({ ...order, downloadUrl, whatsappMessage, whatsappLink })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}