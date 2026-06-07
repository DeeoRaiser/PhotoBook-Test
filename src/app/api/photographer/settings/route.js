import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const now = new Date()

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                email: true,
                watermarkType: true,
                watermarkText: true,
                watermarkLogoUrl: true,
                mpAccessToken: true,
                mpUserId: true,
                transferAlias: true,
                transferCbu: true,
                subscription: {
                    select: {
                        status: true,
                        expiresAt: true,
                        plan: {
                            select: {
                                name: true,
                                allowsMercadoPago: true,
                            },
                        },
                    },
                },
            },
        })

        if (!photographer) {
            console.error("[settings GET] photographer no encontrado para id:", session.user.id)
            return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 404 })
        }

        const sub = photographer.subscription
        const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now
        const planAllowsMp = hasActivePlan ? (sub.plan?.allowsMercadoPago ?? false) : false

        return NextResponse.json({
            ...photographer,
            hasMpToken: !!photographer.mpAccessToken,
            // Nunca enviar tokens al cliente
            mpAccessToken: undefined,
            mpUserId: photographer.mpUserId || null,
            transferAlias: photographer.transferAlias || "",
            transferCbu: photographer.transferCbu || "",
            planAllowsMp,
            planName: hasActivePlan ? sub.plan?.name : null,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PATCH(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const data = {}

        if (body.name !== undefined) data.name = body.name
        if (body.transferAlias !== undefined) data.transferAlias = body.transferAlias || null
        if (body.transferCbu !== undefined) data.transferCbu = body.transferCbu || null

        // Desconexión de MercadoPago (borrar tokens OAuth)
        if (body.disconnectMp === true) {
            data.mpAccessToken = null
            data.mpRefreshToken = null
            data.mpUserId = null
            data.mpTokenExpiresAt = null
        }

        const updated = await prisma.photographer.update({
            where: { id: session.user.id },
            data,
            select: { name: true, email: true, mpAccessToken: true },
        })

        return NextResponse.json({
            name: updated.name,
            email: updated.email,
            hasMpToken: !!updated.mpAccessToken,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}