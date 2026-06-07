import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — devuelve config de precio + tamaños de impresión
export async function GET(req, context) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await context.params

        const gallery = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
            include: {
                pricingTiers: { orderBy: { minQty: "asc" } },
                printSizes: {
                    orderBy: { sortOrder: "asc" },
                    include: { tiers: { orderBy: { minQty: "asc" } } },
                },
            },
        })

        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        return NextResponse.json({
            pricingMode:  gallery.pricingMode,
            pricingTiers: gallery.pricingTiers,
            printSizes:   gallery.printSizes,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// PUT — reemplaza toda la configuración de precios + tamaños de impresión
export async function PUT(req, context) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await context.params
        const { pricingMode, tiers, defaultPrice, printSizes } = await req.json()

        const gallery = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        if (!["per_photo", "tiered"].includes(pricingMode)) {
            return NextResponse.json({ error: "pricingMode inválido" }, { status: 400 })
        }

        if (pricingMode === "tiered") {
            if (!Array.isArray(tiers) || tiers.length === 0) {
                return NextResponse.json({ error: "Debés definir al menos un rango de precio" }, { status: 400 })
            }
            for (const t of tiers) {
                if (isNaN(Number(t.minQty)) || Number(t.minQty) < 1)
                    return NextResponse.json({ error: "Cantidad mínima inválida" }, { status: 400 })
                if (t.maxQty !== null && t.maxQty !== undefined && Number(t.maxQty) < Number(t.minQty))
                    return NextResponse.json({ error: "La cantidad máxima no puede ser menor a la mínima" }, { status: 400 })
                if (isNaN(Number(t.price)) || Number(t.price) < 0)
                    return NextResponse.json({ error: "Precio inválido en uno de los rangos" }, { status: 400 })
            }
        }

        // Validar printSizes si vienen
        if (Array.isArray(printSizes)) {
            for (const ps of printSizes) {
                if (!ps.label?.trim())
                    return NextResponse.json({ error: "Cada tamaño debe tener un nombre" }, { status: 400 })
                if (!Array.isArray(ps.tiers) || ps.tiers.length === 0)
                    return NextResponse.json({ error: `El tamaño "${ps.label}" debe tener al menos un rango de precio` }, { status: 400 })
                for (const t of ps.tiers) {
                    if (isNaN(Number(t.price)) || Number(t.price) < 0)
                        return NextResponse.json({ error: `Precio inválido en tamaño "${ps.label}"` }, { status: 400 })
                }
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.gallery.update({
                where: { id },
                data: { pricingMode },
            })

            // Reemplazar tiers digitales
            await tx.pricingTier.deleteMany({ where: { galleryId: id } })
            if (pricingMode === "tiered" && tiers?.length > 0) {
                await tx.pricingTier.createMany({
                    data: tiers.map((t) => ({
                        galleryId: id,
                        minQty:    Number(t.minQty),
                        maxQty:    t.maxQty != null ? Number(t.maxQty) : null,
                        price:     Number(t.price),
                    })),
                })
            }

            // Actualizar precio por foto si es per_photo
            if (pricingMode === "per_photo" && defaultPrice !== undefined) {
                await tx.photo.updateMany({
                    where: { galleryId: id },
                    data: { price: Number(defaultPrice) },
                })
            }

            // Reemplazar tamaños de impresión (siempre, independiente del modo)
            if (Array.isArray(printSizes)) {
                // Borrar todos los tamaños existentes (cascade elimina sus tiers)
                await tx.printSize.deleteMany({ where: { galleryId: id } })

                for (let i = 0; i < printSizes.length; i++) {
                    const ps = printSizes[i]
                    const created = await tx.printSize.create({
                        data: {
                            galleryId: id,
                            label:     ps.label.trim(),
                            sortOrder: i,
                        },
                    })
                    if (ps.tiers?.length > 0) {
                        await tx.printSizeTier.createMany({
                            data: ps.tiers.map((t) => ({
                                printSizeId: created.id,
                                minQty:      Number(t.minQty),
                                maxQty:      t.maxQty != null ? Number(t.maxQty) : null,
                                price:       Number(t.price),
                            })),
                        })
                    }
                }
            }
        })

        const updated = await prisma.gallery.findUnique({
            where: { id },
            include: {
                pricingTiers: { orderBy: { minQty: "asc" } },
                printSizes: {
                    orderBy: { sortOrder: "asc" },
                    include: { tiers: { orderBy: { minQty: "asc" } } },
                },
            },
        })

        return NextResponse.json({
            pricingMode:  updated.pricingMode,
            pricingTiers: updated.pricingTiers,
            printSizes:   updated.printSizes,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
