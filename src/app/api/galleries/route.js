import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import slugify from "slugify"
import bcrypt from "bcryptjs"


const createGallerySchema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    isPublic: z.boolean().default(true),
    password: z.string().optional(),
    galleryType: z.enum(["standard", "event"]).default("standard"),
    proPhotosAreFree: z.boolean().default(false),
    eventStartsAt: z.string().datetime({ offset: true }).optional().nullable(),
    expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
    downloadLinkDuration: z.number().int().min(1).max(8760).default(48),
    printableEnabled: z.boolean().default(false),
    themeSlug: z.string().default("classic"),
})

export async function POST(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const photographerId = session.user.id

        // ── Verificar plan activo ─────────────────────────────────────────────
        const photographer = await prisma.photographer.findUnique({
            where: { id: photographerId },
            include: {
                subscription: { include: { plan: true } },
                _count: { select: { galleries: true } },
            },
        })

        const sub  = photographer?.subscription
        const now  = new Date()
        const plan = sub?.plan

        const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now

        if (!hasActivePlan) {
            return NextResponse.json(
                { error: "Necesitás un plan activo para crear galerías. Contactá al administrador.", code: "NO_PLAN" },
                { status: 403 }
            )
        }

        // ── Verificar límite de galerías del plan ─────────────────────────────
        if (plan.maxGalleries !== -1 && photographer._count.galleries >= plan.maxGalleries) {
            return NextResponse.json(
                {
                    error: `Tu plan "${plan.name}" permite hasta ${plan.maxGalleries} ${plan.maxGalleries === 1 ? "galería" : "galerías"}. Actualizá tu plan para crear más.`,
                    code: "GALLERY_LIMIT",
                },
                { status: 403 }
            )
        }

        // ── Validar body ──────────────────────────────────────────────────────
        const body = await req.json()
        const parsed = createGallerySchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { title, description, isPublic, password, galleryType, proPhotosAreFree, eventStartsAt, expiresAt, downloadLinkDuration, printableEnabled, themeSlug } = parsed.data

        if (!isPublic && !password) {
            return NextResponse.json(
                { error: "Las galerías privadas requieren contraseña" },
                { status: 400 }
            )
        }

        // ── Verificar permiso de impresión ────────────────────────────────────
        const wantsPrintable = printableEnabled === true
        if (wantsPrintable && !plan.allowsPrintable) {
            return NextResponse.json(
                { error: "Tu plan no incluye la opción de impresión. Actualizá tu plan para acceder a esta función.", code: "PRINTABLE_NOT_ALLOWED" },
                { status: 403 }
            )
        }

        // ── Verificar permiso de galería de evento ────────────────────────────
        if (galleryType === "event") {
            if (!plan.allowsEventGalleries) {
                return NextResponse.json(
                    { error: "Tu plan no incluye galerías de evento. Actualizá tu plan para acceder a esta función.", code: "EVENT_NOT_ALLOWED" },
                    { status: 403 }
                )
            }
            const eventCount = await prisma.gallery.count({
                where: { photographerId, galleryType: "event" },
            })
            const freeLeft = Math.max(0, (plan.freeEventGalleries ?? 0) - eventCount)
            const extraPrice = Number(plan.extraEventGalleryPrice ?? 0)

            if (freeLeft === 0 && extraPrice === 0) {
                return NextResponse.json(
                    {
                        error: "Ya usaste todas las galerías de evento incluidas en tu plan y no hay precio de galería extra configurado. Contactá al administrador.",
                        code: "EVENT_NO_EXTRA_PRICE",
                    },
                    { status: 403 }
                )
            }
        }

        // Generar slug único
        let baseSlug = slugify(title, { lower: true, strict: true })
        let slug = baseSlug
        let count = 1
        while (await prisma.gallery.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${count++}`
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null

        const gallery = await prisma.gallery.create({
            data: {
                title,
                description,
                slug,
                isPublic,
                password: hashedPassword,
                galleryType,
                proPhotosAreFree,
                eventStartsAt: eventStartsAt ? new Date(eventStartsAt) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                downloadLinkDuration: downloadLinkDuration ?? 48,
                printableEnabled: wantsPrintable,
                themeSlug: themeSlug || "classic",
                photographerId,
            },
        })

        return NextResponse.json(gallery, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function GET(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const now = new Date()

        const [galleries, photographer] = await Promise.all([
            prisma.gallery.findMany({
                where: { photographerId: session.user.id },
                orderBy: { createdAt: "desc" },
                include: { _count: { select: { photos: true, orders: true } } },
            }),
            prisma.photographer.findUnique({
                where: { id: session.user.id },
                include: { subscription: { include: { plan: true } } },
            }),
        ])

        const sub = photographer?.subscription
        const plan = sub?.plan
        const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now

        return NextResponse.json({
            galleries,
            plan: plan ? {
                name: plan.name,
                maxPhotos: plan.maxPhotos,
                maxGalleries: plan.maxGalleries,
                allowsEventGalleries: plan.allowsEventGalleries,
                freeEventGalleries: plan.freeEventGalleries ?? 0,
                extraEventGalleryPrice: Number(plan.extraEventGalleryPrice ?? 0),
                allowsPrintable: plan.allowsPrintable ?? false,
            } : null,
            hasActivePlan,
            eventGalleriesUsed: galleries.filter(g => g.galleryType === "event").length,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}