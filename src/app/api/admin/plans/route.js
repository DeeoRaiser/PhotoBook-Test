import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET() {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { price: "asc" },
            include: {
                _count: { select: { subscriptions: true } },
            },
        })
        return NextResponse.json(plans)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const { name, price, durationDays, maxGalleries, maxPhotos, allowsMercadoPago, allowsPortfolio, maxPortfolioPhotos, allowsEventGalleries, freeEventGalleries, extraEventGalleryPrice, allowsPrintable, maxStorageGB, allowsLinktree, maxLinktreeLinks } = body

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
        }
        if (price === undefined || price < 0) {
            return NextResponse.json({ error: "El precio es requerido" }, { status: 400 })
        }

        const plan = await prisma.plan.create({
            data: {
                name: name.trim(),
                price: Number(price),
                durationDays: Number(durationDays) || 30,
                maxGalleries: Number(maxGalleries) ?? -1,
                maxPhotos: Number(maxPhotos) ?? -1,
                allowsMercadoPago: Boolean(allowsMercadoPago) ?? false,
                allowsPortfolio: Boolean(allowsPortfolio) ?? false,
                maxPortfolioPhotos: Number(maxPortfolioPhotos) ?? -1,
                allowsEventGalleries: Boolean(allowsEventGalleries) ?? false,
                freeEventGalleries: Number(freeEventGalleries) || 0,
                extraEventGalleryPrice: Number(extraEventGalleryPrice) || 0,
                allowsPrintable: Boolean(allowsPrintable) ?? false,
                maxStorageGB: maxStorageGB !== undefined ? Number(maxStorageGB) : -1,
                allowsLinktree: Boolean(allowsLinktree) ?? false,
                maxLinktreeLinks: maxLinktreeLinks !== undefined ? Number(maxLinktreeLinks) : 5,
            },
            include: {
                _count: { select: { subscriptions: true } },
            },
        })

        return NextResponse.json(plan, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}