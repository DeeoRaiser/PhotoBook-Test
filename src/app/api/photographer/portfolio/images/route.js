import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, deleteFromBunny, generateFileName } from "@/lib/bunny"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 2 MB

async function getActivePlan(photographerId) {
    const now = new Date()
    const sub = await prisma.subscription.findUnique({
        where: { photographerId },
        select: {
            status: true,
            expiresAt: true,
            plan: { select: { allowsPortfolio: true, maxPortfolioPhotos: true } },
        },
    })
    if (!sub || sub.status !== "ACTIVE" || new Date(sub.expiresAt) <= now) return null
    return {
        allowsPortfolio: sub.plan?.allowsPortfolio ?? false,
        // Si la columna aún no existe en BD Prisma devuelve undefined → ilimitado
        maxPortfolioPhotos: sub.plan?.maxPortfolioPhotos ?? -1,
    }
}

// GET — listar fotos del portfolio
export async function GET() {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const plan = await getActivePlan(session.user.id)
        if (!plan?.allowsPortfolio) {
            return NextResponse.json({ error: "Tu plan no incluye Portfolio" }, { status: 403 })
        }

        const images = await prisma.portfolioImage.findMany({
            where: { photographerId: session.user.id },
            orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
            select: {
                id: true,
                bunnyUrl: true,
                caption: true,
                isFeatured: true,
                order: true,
                createdAt: true,
            },
        })

        return NextResponse.json({
            images,
            maxPortfolioPhotos: plan.maxPortfolioPhotos,
            total: images.length,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// POST — subir nueva foto
export async function POST(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const plan = await getActivePlan(session.user.id)
        if (!plan?.allowsPortfolio) {
            return NextResponse.json({ error: "Tu plan no incluye Portfolio" }, { status: 403 })
        }

        // Verificar límite del plan
        if (plan.maxPortfolioPhotos !== -1) {
            const current = await prisma.portfolioImage.count({
                where: { photographerId: session.user.id },
            })
            if (current >= plan.maxPortfolioPhotos) {
                return NextResponse.json(
                    { error: `Tu plan permite máximo ${plan.maxPortfolioPhotos} foto${plan.maxPortfolioPhotos === 1 ? "" : "s"} en el portfolio` },
                    { status: 403 }
                )
            }
        }

        const formData = await req.formData()
        const file = formData.get("file")
        const caption = formData.get("caption") || null

        if (!file || file.size === 0)
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
        if (!ALLOWED_TYPES.includes(file.type))
            return NextResponse.json({ error: "Solo JPG, PNG o WEBP" }, { status: 400 })
        if (file.size > MAX_SIZE)
            return NextResponse.json({ error: "La imagen no puede superar 2 MB" }, { status: 400 })

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileName = generateFileName(file.name)
        const { bunnyPath, bunnyUrl } = await uploadToBunny(buffer, fileName, "portfolio/images")

        const image = await prisma.portfolioImage.create({
            data: {
                bunnyUrl,
                bunnyPath,
                caption,
                photographerId: session.user.id,
            },
            select: { id: true, bunnyUrl: true, caption: true, isFeatured: true, order: true },
        })

        return NextResponse.json(image, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// PATCH — destacar/quitar destacado o actualizar caption
export async function PATCH(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const plan = await getActivePlan(session.user.id)
        if (!plan?.allowsPortfolio) {
            return NextResponse.json({ error: "Tu plan no incluye Portfolio" }, { status: 403 })
        }

        const { id, isFeatured, caption } = await req.json()
        if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

        // Verificar que pertenezca al fotógrafo
        const image = await prisma.portfolioImage.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!image) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 })

        const data = {}
        if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured)
        if (caption !== undefined) data.caption = caption || null

        const updated = await prisma.portfolioImage.update({
            where: { id },
            data,
            select: { id: true, isFeatured: true, caption: true },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// DELETE — eliminar foto
export async function DELETE(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

        const image = await prisma.portfolioImage.findFirst({
            where: { id, photographerId: session.user.id },
            select: { bunnyPath: true },
        })
        if (!image) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 })

        await deleteFromBunny(image.bunnyPath).catch(() => {})
        await prisma.portfolioImage.delete({ where: { id } })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}