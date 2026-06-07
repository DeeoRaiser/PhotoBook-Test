import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET(req, context) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const params = await context.params

        const plan = await prisma.plan.findUnique({
            where: { id: params.id },
            include: {
                _count: { select: { subscriptions: true } },
            },
        })

        if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

        return NextResponse.json(plan)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PATCH(req, context) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const params = await context.params
        const body = await req.json()

        const existing = await prisma.plan.findUnique({ where: { id: params.id } })
        if (!existing) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

        const data = {}
        if (body.name !== undefined) data.name = body.name.trim()
        if (body.price !== undefined) data.price = Number(body.price)
        if (body.durationDays !== undefined) data.durationDays = Number(body.durationDays)
        if (body.maxGalleries !== undefined) data.maxGalleries = Number(body.maxGalleries)
        if (body.maxPhotos !== undefined) data.maxPhotos = Number(body.maxPhotos)
        if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
        if (body.allowsMercadoPago !== undefined) data.allowsMercadoPago = Boolean(body.allowsMercadoPago)
        if (body.allowsPortfolio !== undefined) data.allowsPortfolio = Boolean(body.allowsPortfolio)
        if (body.maxPortfolioPhotos !== undefined) data.maxPortfolioPhotos = Number(body.maxPortfolioPhotos)
        if (body.allowsEventGalleries !== undefined) data.allowsEventGalleries = Boolean(body.allowsEventGalleries)
        if (body.freeEventGalleries !== undefined) data.freeEventGalleries = Number(body.freeEventGalleries)
        if (body.extraEventGalleryPrice !== undefined) data.extraEventGalleryPrice = Number(body.extraEventGalleryPrice)
        if (body.allowsPrintable  !== undefined) data.allowsPrintable  = Boolean(body.allowsPrintable)
        if (body.maxStorageGB     !== undefined) data.maxStorageGB     = Number(body.maxStorageGB)
        if (body.allowsLinktree   !== undefined) data.allowsLinktree   = Boolean(body.allowsLinktree)
        if (body.maxLinktreeLinks !== undefined) data.maxLinktreeLinks = Number(body.maxLinktreeLinks)

        const updated = await prisma.plan.update({
            where: { id: params.id },
            data,
            include: {
                _count: { select: { subscriptions: true } },
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function DELETE(req, context) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const params = await context.params

        // Verificar si tiene suscripciones activas
        const activeCount = await prisma.subscription.count({
            where: {
                planId: params.id,
                status: "ACTIVE",
                expiresAt: { gte: new Date() },
            },
        })

        if (activeCount > 0) {
            return NextResponse.json(
                { error: `No se puede eliminar: tiene ${activeCount} suscripción${activeCount > 1 ? "es" : ""} activa${activeCount > 1 ? "s" : ""}` },
                { status: 409 }
            )
        }

        await prisma.plan.delete({ where: { id: params.id } })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}