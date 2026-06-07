// src/app/api/galleries/[id]/route.js
// Versión completa: GET + PATCH (con themeSlug/tokenOverrides) + DELETE

import { NextResponse } from "next/server"
import { auth }         from "@/lib/auth"
import { prisma }       from "@/lib/prisma"
import { deleteFromBunny } from "@/lib/bunny"
import bcrypt           from "bcryptjs"
import { z }            from "zod"

const updateSchema = z.object({
    // Info general
    title:                z.string().min(2).optional(),
    description:          z.string().optional(),
    // Visibilidad
    isPublic:             z.boolean().optional(),
    password:             z.string().min(4).optional().nullable(),
    removePassword:       z.boolean().optional(),
    // Vencimiento
    expiresAt:            z.string().datetime({ offset: true }).optional().nullable(),
    removeExpiry:         z.boolean().optional(),
    // Descarga
    downloadLinkDuration: z.number().int().min(1).max(8760).optional(),
    // Impresión
    printableEnabled:     z.boolean().optional(),
    // Theme (nuevo)
    themeSlug:            z.string().optional(),
    tokenOverrides:       z.record(z.string(), z.unknown()).optional(),
})

// ── GET ───────────────────────────────────────────────────────
export async function GET(req, context) {
    try {
        const { id } = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const gallery = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
            include: {
                photos:       { orderBy: { createdAt: "asc" } },
                pricingTiers: { orderBy: { minQty: "asc" } },
                printSizes: {
                    orderBy: { sortOrder: "asc" },
                    include: { tiers: { orderBy: { minQty: "asc" } } },
                },
                _count: { select: { orders: true } },
            },
        })

        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        const { password: _, ...safeGallery } = gallery
        return NextResponse.json({ ...safeGallery, hasPassword: !!gallery.password })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// ── PATCH ─────────────────────────────────────────────────────
export async function PATCH(req, context) {
    try {
        const { id } = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body   = await req.json()
        const parsed = updateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const existing = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        const {
            title, description, isPublic, password, removePassword,
            expiresAt, removeExpiry, downloadLinkDuration, printableEnabled,
            themeSlug, tokenOverrides,
        } = parsed.data

        // Validar coherencia visibilidad/contraseña
        const willBePrivate    = isPublic === false || (isPublic === undefined && !existing.isPublic)
        const willHavePassword = password ? true : removePassword ? false : !!existing.password
        if (willBePrivate && !willHavePassword) {
            return NextResponse.json(
                { error: "Las galerías privadas requieren contraseña" },
                { status: 400 }
            )
        }

        const data = {}
        if (title !== undefined)       data.title = title
        if (description !== undefined) data.description = description
        if (isPublic !== undefined)    data.isPublic = isPublic

        if (removePassword)  data.password = null
        else if (password)   data.password = await bcrypt.hash(password, 10)

        if (removeExpiry)    data.expiresAt = null
        else if (expiresAt)  data.expiresAt = new Date(expiresAt)

        if (downloadLinkDuration !== undefined) data.downloadLinkDuration = downloadLinkDuration

        // Theme
        if (themeSlug !== undefined)      data.themeSlug = themeSlug
        if (tokenOverrides !== undefined) data.tokenOverrides = tokenOverrides

        // Impresión — verificar permiso del plan
        if (printableEnabled !== undefined) {
            if (printableEnabled === true) {
                const photographer = await prisma.photographer.findUnique({
                    where: { id: session.user.id },
                    include: { subscription: { include: { plan: true } } },
                })
                if (!photographer?.subscription?.plan?.allowsPrintable) {
                    return NextResponse.json(
                        { error: "Tu plan no incluye la opción de impresión.", code: "PRINTABLE_NOT_ALLOWED" },
                        { status: 403 }
                    )
                }
            }
            data.printableEnabled = printableEnabled
        }

        const updated = await prisma.gallery.update({ where: { id }, data })
        const { password: __, ...safeUpdated } = updated
        return NextResponse.json({ ...safeUpdated, hasPassword: !!updated.password })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// ── DELETE ────────────────────────────────────────────────────
export async function DELETE(req, context) {
    try {
        const { id } = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const gallery = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
            include: { photos: true },
        })
        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        const totalBytes = gallery.photos.reduce((sum, p) => sum + (p.sizeBytes || 0), 0)

        await Promise.allSettled(gallery.photos.map(p => deleteFromBunny(p.bunnyPath)))
        await prisma.gallery.delete({ where: { id } })

        if (totalBytes > 0) {
            await prisma.photographer.update({
                where: { id: session.user.id },
                data: { storageUsedBytes: { decrement: BigInt(totalBytes) } },
            })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
