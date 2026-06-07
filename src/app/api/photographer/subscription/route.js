import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        })

        if (!photographer) {
            return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 404 })
        }

        // Verificar si la suscripción expiró y actualizarla
        if (
            photographer.subscription &&
            photographer.subscription.status === "ACTIVE" &&
            new Date(photographer.subscription.expiresAt) < new Date()
        ) {
            await prisma.subscription.update({
                where: { id: photographer.subscription.id },
                data: { status: "EXPIRED" },
            })
            photographer.subscription.status = "EXPIRED"
        }

        // Traer planes activos disponibles
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" },
        })

        return NextResponse.json({
            subscription: photographer.subscription,
            plans,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
