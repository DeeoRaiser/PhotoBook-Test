import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

function formatGallery(gallery) {
    return {
        id: gallery.id,
        title: gallery.title,
        description: gallery.description,
        isPublic: gallery.isPublic,
        galleryType: gallery.galleryType,
        themeSlug: gallery.themeSlug ?? "classic",        // ← FIX: era gallery.template (campo inexistente)
        tokenOverrides: gallery.tokenOverrides ?? {},     // ← FIX: campo nuevo, necesario para colores custom
        template: gallery.themeSlug ?? "classic",         // ← alias para compatibilidad con frontend externo
        proPhotosAreFree: gallery.proPhotosAreFree,
        photographerName: gallery.photographer.name,
        photographerAvatar: gallery.photographer.portfolioAvatarUrl || null,
        photographerPortfolioSlug: gallery.photographer.portfolioEnabled && gallery.photographer.portfolioSlug ? gallery.photographer.portfolioSlug : null,
        hasMpToken: !!gallery.photographer.mpAccessToken,
        transferAlias: gallery.photographer.transferAlias || null,
        transferCbu: gallery.photographer.transferCbu || null,
        coverImage: gallery.coverImage || null,
        printableEnabled: gallery.printableEnabled,
        pricingMode: gallery.pricingMode,
        pricingTiers: gallery.pricingTiers
            ? gallery.pricingTiers
                .map((t) => ({ id: t.id, minQty: t.minQty, maxQty: t.maxQty, price: Number(t.price) }))
                .sort((a, b) => a.minQty - b.minQty)
            : [],
        printSizes: (gallery.printSizes || []).map((ps) => ({
            id: ps.id,
            label: ps.label,
            sortOrder: ps.sortOrder,
            tiers: (ps.tiers || []).map((t) => ({
                id: t.id, minQty: t.minQty, maxQty: t.maxQty, price: Number(t.price),
            })),
        })),
        photos: gallery.photos.map((p) => ({
            id: p.id,
            title: p.title,
            price: Number(p.price),
            bunnyUrl: p.bunnyUrl,
        })),
    }
}

export async function GET(req, context) {
    try {
        const params = await context.params
        const { slug } = params

        const gallery = await prisma.gallery.findUnique({
            where: { slug },
            include: {
                photographer: { select: { name: true, portfolioAvatarUrl: true, portfolioEnabled: true, portfolioSlug: true, mpAccessToken: true, transferAlias: true, transferCbu: true } },
                photos: { orderBy: { createdAt: "asc" } },
                pricingTiers: true,
                printSizes: {
                    orderBy: { sortOrder: "asc" },
                    include: { tiers: { orderBy: { minQty: "asc" } } },
                },
            },
        })

        if (!gallery) {
            return NextResponse.json({ error: "Galería no encontrada" }, { status: 404 })
        }

        // Verificar vencimiento
        if (gallery.expiresAt && new Date() > new Date(gallery.expiresAt)) {
            return NextResponse.json({
                expired: true,
                title: gallery.title,
                photographerName: gallery.photographer.name,
                expiresAt: gallery.expiresAt,
            }, { status: 410 })
        }

        if (!gallery.isPublic) {
            return NextResponse.json({
                id: gallery.id,
                galleryType: gallery.galleryType,
                themeSlug: gallery.themeSlug ?? "classic",    // ← FIX: era gallery.template (campo inexistente)
                tokenOverrides: gallery.tokenOverrides ?? {}, // ← FIX: campo nuevo
                template: gallery.themeSlug ?? "classic",     // ← alias para compatibilidad
                proPhotosAreFree: gallery.proPhotosAreFree,
                title: gallery.title,
                description: gallery.description,
                isPublic: false,
                photographerName: gallery.photographer.name,
                photographerAvatar: gallery.photographer.portfolioAvatarUrl || null,
                photographerPortfolioSlug: gallery.photographer.portfolioEnabled && gallery.photographer.portfolioSlug ? gallery.photographer.portfolioSlug : null,
                hasMpToken: !!gallery.photographer.mpAccessToken,
                transferAlias: gallery.photographer.transferAlias || null,
                transferCbu: gallery.photographer.transferCbu || null,
                coverImage: gallery.coverImage || null,
                requiresPassword: true,
            })
        }

        return NextResponse.json(formatGallery(gallery))
    } catch (error) {
        console.error("GET gallery error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function POST(req, context) {
    try {
        const params = await context.params
        const { slug } = params
        const body = await req.json()

        // ── Verificación de contraseña ────────────────────────────────────────
        if (body.password !== undefined) {
            const gallery = await prisma.gallery.findUnique({
                where: { slug },
                include: {
                    photographer: {
                        select: {
                            name: true,
                            portfolioAvatarUrl: true,
                            portfolioEnabled: true,
                            portfolioSlug: true,
                            mpAccessToken: true,
                            transferAlias: true,
                            transferCbu: true,
                        },
                    },
                    photos: { orderBy: { createdAt: "asc" } },
                    pricingTiers: true,
                    printSizes: {
                        orderBy: { sortOrder: "asc" },
                        include: { tiers: { orderBy: { minQty: "asc" } } },
                    },
                },
            })

            if (!gallery) {
                return NextResponse.json({ error: "Galería no encontrada" }, { status: 404 })
            }

            if (!gallery.password) {
                return NextResponse.json({ error: "Esta galería no tiene contraseña" }, { status: 400 })
            }

            const valid = await bcrypt.compare(body.password, gallery.password)
            if (!valid) {
                return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
            }

            // Verificar vencimiento también al ingresar con contraseña
            if (gallery.expiresAt && new Date() > new Date(gallery.expiresAt)) {
                return NextResponse.json({
                    expired: true,
                    title: gallery.title,
                    photographerName: gallery.photographer.name,
                    expiresAt: gallery.expiresAt,
                }, { status: 410 })
            }

            return NextResponse.json(formatGallery(gallery))
        }

        // ── Check-in de evento ────────────────────────────────────────────────
        const { gallerySlug, name, selfieDataUrl } = body

        if (!gallerySlug) {
            return NextResponse.json({ error: "Galería requerida" }, { status: 400 })
        }

        if (!name || name.trim().length < 2 || name.trim().length > 60) {
            return NextResponse.json({ error: "Nombre inválido" }, { status: 400 })
        }

        const cleanName = name.trim()

        const gallery = await prisma.gallery.findUnique({
            where: { slug: gallerySlug },
            select: { id: true, galleryType: true, title: true },
        })

        if (!gallery) {
            return NextResponse.json({ error: "Galería no encontrada" }, { status: 404 })
        }

        if (gallery.galleryType !== "event") {
            return NextResponse.json({ error: "Esta galería no es de tipo evento" }, { status: 400 })
        }

        // Evitar duplicados
        const existing = await prisma.eventGuest.findFirst({
            where: {
                galleryId: gallery.id,
                name: cleanName,
            },
        })

        if (existing) {
            return NextResponse.json({
                guestId: existing.id,
                accessToken: existing.accessToken,
                name: existing.name,
                galleryTitle: gallery.title,
            })
        }

        const accessToken = nanoid(32)

        // Subir selfie a Bunny si existe
        let selfieUrl = null
        if (selfieDataUrl) {
            try {
                // El dataUrl viene como "data:image/jpeg;base64,..."
                const matches = selfieDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
                if (matches) {
                    const ext = matches[1].split("/")[1] // jpeg, png, webp
                    const buffer = Buffer.from(matches[2], "base64")
                    const fileName = `${nanoid(12)}.${ext}`
                    const { bunnyUrl } = await uploadToBunny(buffer, fileName, "selfies")
                    selfieUrl = bunnyUrl
                }
            } catch (err) {
                console.error("Error subiendo selfie a Bunny:", err)
                // No bloqueamos el checkin si falla la selfie
            }
        }

        const guest = await prisma.eventGuest.create({
            data: {
                name: cleanName,
                selfieUrl,
                accessToken,
                galleryId: gallery.id,
            },
        })

        return NextResponse.json({
            guestId: guest.id,
            accessToken: guest.accessToken,
            name: guest.name,
            galleryTitle: gallery.title,
        })
    } catch (error) {
        console.error("Check-in error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}