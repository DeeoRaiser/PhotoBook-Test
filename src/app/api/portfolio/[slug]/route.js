import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, deleteFromBunny, generateFileName } from "@/lib/bunny"

async function getActivePlan(photographerId) {
    const now = new Date()
    const sub = await prisma.subscription.findUnique({
        where: { photographerId },
        select: {
            status: true,
            expiresAt: true,
            plan: { select: { allowsPortfolio: true } },
        },
    })
    if (!sub || sub.status !== "ACTIVE" || new Date(sub.expiresAt) <= now) return null
    return sub.plan
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE = 8 * 1024 * 1024

// GET — datos del portfolio
export async function GET() {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                portfolioEnabled: true,
                portfolioSlug: true,
                portfolioDisplayName: true,
                portfolioBio: true,
                portfolioSpecialty: true,
                portfolioCity: true,
                portfolioCityNormalized: true,
                portfolioProvince: true,
                portfolioCoverUrl: true,
                portfolioAvatarUrl: true,
                portfolioInstagram: true,
                portfolioFacebook: true,
                portfolioYoutube: true,
                portfolioLinkedin: true,
                portfolioTiktok: true,
                portfolioWebsite: true,
                portfolioEmail: true,
                portfolioWhatsapp: true,
                portfolioTheme: true,
                portfolioViews: true,
            },
        })

        // Galerías con estado de destacado
        const galleries = await prisma.gallery.findMany({
            where: { photographerId: session.user.id, isPublic: true },
            select: { id: true, title: true, isFeatured: true, coverImage: true },
            orderBy: { createdAt: "desc" },
        })

        const plan = await getActivePlan(session.user.id)
        return NextResponse.json({ ...photographer, galleries, planAllowsPortfolio: plan?.allowsPortfolio ?? false })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// POST — subir imagen (cover o avatar)
export async function POST(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const plan = await getActivePlan(session.user.id)
        if (!plan?.allowsPortfolio) {
            return NextResponse.json({ error: "Tu plan no incluye la función de Portfolio" }, { status: 403 })
        }

        const formData = await req.formData()
        const type = formData.get("type") // "cover" | "avatar"
        const file = formData.get("file")

        if (!["cover", "avatar"].includes(type))
            return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
        if (!file || file.size === 0)
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
        if (!ALLOWED_IMAGE_TYPES.includes(file.type))
            return NextResponse.json({ error: "Solo JPG, PNG o WEBP" }, { status: 400 })
        if (file.size > MAX_SIZE)
            return NextResponse.json({ error: "La imagen no puede superar 8 MB" }, { status: 400 })

        const urlField  = type === "cover" ? "portfolioCoverUrl"       : "portfolioAvatarUrl"
        const pathField = type === "cover" ? "portfolioCoverBunnyPath" : "portfolioAvatarBunnyPath"
        const folder    = type === "cover" ? "portfolio/covers"        : "portfolio/avatars"

        const current = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            select: { [pathField]: true },
        })
        if (current?.[pathField]) await deleteFromBunny(current[pathField]).catch(() => {})

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileName = generateFileName(file.name)
        const { bunnyPath, bunnyUrl } = await uploadToBunny(buffer, fileName, folder)

        await prisma.photographer.update({
            where: { id: session.user.id },
            data: { [urlField]: bunnyUrl, [pathField]: bunnyPath },
        })

        return NextResponse.json({ url: bunnyUrl })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// PATCH — guardar datos de texto
export async function PATCH(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const plan = await getActivePlan(session.user.id)
        if (!plan?.allowsPortfolio) {
            return NextResponse.json({ error: "Tu plan no incluye la función de Portfolio" }, { status: 403 })
        }

        const body = await req.json()

        // Togglear destacado de galería
        if (body.toggleFeatured !== undefined) {
            const gallery = await prisma.gallery.findFirst({
                where: { id: body.toggleFeatured, photographerId: session.user.id },
            })
            if (!gallery) return NextResponse.json({ error: "Galería no encontrada" }, { status: 409 })
            await prisma.gallery.update({
                where: { id: body.toggleFeatured },
                data: { isFeatured: !gallery.isFeatured },
            })
            return NextResponse.json({ ok: true, isFeatured: !gallery.isFeatured })
        }

        const data = {}

const textFields = [
            "portfolioDisplayName", "portfolioBio", "portfolioSpecialty",
            "portfolioCity", "portfolioCityNormalized", "portfolioProvince",
            "portfolioInstagram", "portfolioFacebook", "portfolioYoutube",
            "portfolioLinkedin", "portfolioTiktok", "portfolioWebsite",
            "portfolioEmail", "portfolioWhatsapp",
        ]
        for (const field of textFields) {
            if (body[field] !== undefined) data[field] = body[field] || null
        }

// portfolioTheme puede ser "dark" | "light" | "warm" | "custom:#bg:#card:#accent"

console.log("Received portfolioTheme:", body.portfolioTheme)

        if (body.portfolioTheme !== undefined) {
            const valid = ["dark", "light", "warm"]
            if (valid.includes(body.portfolioTheme)) {
                data.portfolioTheme = body.portfolioTheme
            } else if (typeof body.portfolioTheme === "string" && body.portfolioTheme.startsWith("custom:")) {
                // Validar formato custom:#rrggbb:#rrggbb:#rrggbb
                const parts = body.portfolioTheme.split(":")
                const hexRe = /^#[0-9a-fA-F]{6}$/
                if (parts.length === 4 && hexRe.test(parts[1]) && hexRe.test(parts[2]) && hexRe.test(parts[3])) {
                    data.portfolioTheme = body.portfolioTheme
                } else {
                    data.portfolioTheme = "dark"
                }
            } else {
                data.portfolioTheme = "dark"
            }
        }



        if (body.portfolioSlug !== undefined) {
            const slug = (body.portfolioSlug || "")
                .toLowerCase().trim()
                .replace(/[^a-z0-9-_]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")

            if (slug) {
                const existing = await prisma.photographer.findFirst({
                    where: { portfolioSlug: slug, NOT: { id: session.user.id } },
                })
                if (existing)
                    return NextResponse.json({ error: "Ese nombre de perfil ya está en uso" }, { status: 409 })
                data.portfolioSlug = slug
            } else {
                data.portfolioSlug = null
            }
        }

        if (body.portfolioEnabled !== undefined) data.portfolioEnabled = Boolean(body.portfolioEnabled)

        await prisma.photographer.update({ where: { id: session.user.id }, data })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// DELETE — eliminar imagen
export async function DELETE(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { type } = await req.json()
        if (!["cover", "avatar"].includes(type))
            return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })

        const urlField  = type === "cover" ? "portfolioCoverUrl"       : "portfolioAvatarUrl"
        const pathField = type === "cover" ? "portfolioCoverBunnyPath" : "portfolioAvatarBunnyPath"

        const current = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            select: { [pathField]: true },
        })
        if (current?.[pathField]) await deleteFromBunny(current[pathField]).catch(() => {})

        await prisma.photographer.update({
            where: { id: session.user.id },
            data: { [urlField]: null, [pathField]: null },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}