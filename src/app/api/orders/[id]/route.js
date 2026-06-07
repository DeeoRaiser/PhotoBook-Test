import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { activateOrder } from "@/lib/order-helpers"

export async function GET(req, context) {
    try {
        const params = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const order = await prisma.order.findFirst({
            where: {
                id: params.id,
                gallery: { photographerId: session.user.id },
            },
            include: {
                items: { include: { photo: true } },
                gallery: { select: { title: true, slug: true } },
            },
        })

        if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })

        const baseUrl = process.env.NEXTAUTH_URL
        const downloadUrl = order.downloadToken
            ? `${baseUrl}/download/${order.downloadToken}`
            : null

        return NextResponse.json({ ...order, downloadUrl })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PATCH(req, context) {
    try {
        const params = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { status } = await req.json()

        const validStatuses = ["PENDING", "PAID", "DELIVERED", "CANCELLED"]
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
        }

        const order = await prisma.order.findFirst({
            where: {
                id: params.id,
                gallery: { photographerId: session.user.id },
            },
        })
        if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })

        // Si el fotógrafo marca como PAID manualmente → activar descarga + email
        if (status === "PAID" && !order.downloadToken) {
            const activated = await activateOrder(params.id, null, "manual")
            const baseUrl = process.env.NEXTAUTH_URL
            return NextResponse.json({
                ...activated,
                downloadUrl: `${baseUrl}/download/${activated.downloadToken}`,
            })
        }

        // Cualquier otro cambio de estado
        const updated = await prisma.order.update({
            where: { id: params.id },
            data: { status },
        })

        const baseUrl = process.env.NEXTAUTH_URL
        const downloadUrl = updated.downloadToken
            ? `${baseUrl}/download/${updated.downloadToken}`
            : null

        return NextResponse.json({ ...updated, downloadUrl })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}