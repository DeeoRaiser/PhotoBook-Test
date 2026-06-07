import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const status    = searchParams.get("status")
        const galleryId = searchParams.get("galleryId")

        // Traemos todas las órdenes del fotógrafo usando el campo snapshot `photographerId`.
        // Esto incluye órdenes de galerías ya eliminadas (donde galleryId quedó NULL).
        const where = {
            photographerId: session.user.id,
            ...(status    && { status }),
            ...(galleryId && { galleryId }),
        }

        const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                gallery: { select: { title: true, slug: true } },
                items: {
                    include: { photo: { select: { bunnyUrl: true, title: true } } },
                },
            },
        })

        return NextResponse.json(orders)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}