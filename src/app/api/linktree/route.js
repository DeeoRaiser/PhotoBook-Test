import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: trae configuración + links del fotógrafo autenticado
export async function GET() {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            select: {
                linktreeEnabled: true,
                linktreeSlug: true,
                publicSlug: true,
                portfolioSlug: true,
                portfolioEnabled: true,
                linktreeTitle: true,
                linktreeBio: true,
                linktreeTheme: true,
                linktreeAvatarUrl: true,
                linktreeBackgroundUrl: true,
                portfolioAvatarUrl: true,
                subscription: {
                    select: {
                        status: true,
                        expiresAt: true,
                        plan: {
                            select: {
                                allowsLinktree: true,
                                maxLinktreeLinks: true,
                            },
                        },
                    },
                },
                linktreeLinks: { orderBy: { sortOrder: "asc" } },
            },
        })

        // Guard: el fotógrafo no existe aún en la DB
        if (!photographer) {
            return NextResponse.json({
                config: {
                    enabled: false, slug: null, title: null,
                    bio: null, theme: "dark", avatarUrl: null,
                    backgroundUrl: null, portfolioAvatarUrl: null,
                },
                links: [],
                plan: { allowsLinktree: false, maxLinktreeLinks: 0 },
            })
        }

        const sub  = photographer?.subscription
        const plan = sub?.plan
        const now  = new Date()
        const hasActivePlan  = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now
        const allowsLinktree   = hasActivePlan && (plan.allowsLinktree ?? false)
        const maxLinktreeLinks = hasActivePlan ? (plan.maxLinktreeLinks ?? 5) : 0

        // The slug is always publicSlug (canonical).
        // Falls back to linktreeSlug for backwards compat during transition.
        const effectiveSlug = photographer.publicSlug || photographer.linktreeSlug

        return NextResponse.json({
            config: {
                enabled:            photographer.linktreeEnabled,
                slug:               effectiveSlug,
                // Tell the frontend whether slug is locked (portfolio already set it)
                slugLockedBy:       photographer.portfolioEnabled && photographer.portfolioSlug
                                        ? "portfolio"
                                        : null,
                title:              photographer.linktreeTitle,
                bio:                photographer.linktreeBio,
                theme:              photographer.linktreeTheme,
                avatarUrl:          photographer.linktreeAvatarUrl,
                backgroundUrl:      photographer.linktreeBackgroundUrl,
                portfolioAvatarUrl: photographer.portfolioAvatarUrl,
            },
            links: photographer.linktreeLinks,
            plan: { allowsLinktree, maxLinktreeLinks },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// PATCH: actualiza la configuración general del linktree
export async function PATCH(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            include: { subscription: { include: { plan: true } } },
            // Note: include returns all scalar fields, portfolioSlug/portfolioEnabled included
        })

        if (!photographer) return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 404 })

        const sub  = photographer?.subscription
        const plan = sub?.plan
        const now  = new Date()
        const hasActivePlan  = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now
        const allowsLinktree = hasActivePlan && (plan?.allowsLinktree ?? false)

        if (!allowsLinktree) {
            return NextResponse.json({ error: "Tu plan no incluye Linktree.", code: "PLAN_REQUIRED" }, { status: 403 })
        }

        if (body.slug !== undefined) {
            const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "")
            if (slug && slug.length < 3) {
                return NextResponse.json({ error: "El slug debe tener al menos 3 caracteres" }, { status: 400 })
            }
            if (slug) {
                // If portfolio already owns the slug, block the change
                if (photographer.portfolioEnabled && photographer.portfolioSlug) {
                    return NextResponse.json({
                        error: "Tu slug está controlado por el portfolio. Cambialo desde allí.",
                        code: "SLUG_LOCKED_BY_PORTFOLIO",
                    }, { status: 409 })
                }
                // Check uniqueness against the unified publicSlug field
                const exists = await prisma.photographer.findFirst({
                    where: { publicSlug: slug, NOT: { id: session.user.id } },
                })
                if (exists) return NextResponse.json({ error: "Ese nombre ya está en uso" }, { status: 409 })
            }
            body.slug = slug || null
        }

        const data = {}
        if (body.enabled       !== undefined) data.linktreeEnabled       = Boolean(body.enabled)
        if (body.slug          !== undefined) {
            data.linktreeSlug = body.slug
            data.publicSlug   = body.slug   // keep in sync
        }
        if (body.title         !== undefined) data.linktreeTitle         = body.title || null
        if (body.bio           !== undefined) data.linktreeBio           = body.bio || null
        if (body.theme         !== undefined) data.linktreeTheme         = body.theme
        if (body.avatarUrl     !== undefined) data.linktreeAvatarUrl     = body.avatarUrl || null
        if (body.backgroundUrl !== undefined) data.linktreeBackgroundUrl = body.backgroundUrl || null

        const updated = await prisma.photographer.update({
            where: { id: session.user.id },
            data,
            select: {
                linktreeEnabled: true,
                linktreeSlug: true,
                linktreeTitle: true,
                linktreeBio: true,
                linktreeTheme: true,
                linktreeAvatarUrl: true,
            },
        })

        return NextResponse.json({ config: updated })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// POST: agrega un nuevo link
export async function POST(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const { label, url, icon, imageUrl } = body

        if (!label?.trim()) return NextResponse.json({ error: "El label es requerido" }, { status: 400 })
        if (!url?.trim())   return NextResponse.json({ error: "La URL es requerida" }, { status: 400 })

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            include: {
                subscription: { include: { plan: true } },
                _count: { select: { linktreeLinks: true } },
            },
        })

        if (!photographer) return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 404 })

        const sub  = photographer?.subscription
        const plan = sub?.plan
        const now  = new Date()
        const hasActivePlan  = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now
        const allowsLinktree = hasActivePlan && (plan?.allowsLinktree ?? false)
        const maxLinks       = hasActivePlan ? (plan?.maxLinktreeLinks ?? 5) : 0

        if (!allowsLinktree) {
            return NextResponse.json({ error: "Tu plan no incluye Linktree.", code: "PLAN_REQUIRED" }, { status: 403 })
        }
        if (maxLinks !== -1 && photographer._count.linktreeLinks >= maxLinks) {
            return NextResponse.json({
                error: `Tu plan permite hasta ${maxLinks} links. Eliminá uno para agregar otro.`,
                code: "LINK_LIMIT",
            }, { status: 403 })
        }

        const last = await prisma.linktreeLink.findFirst({
            where: { photographerId: session.user.id },
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
        })
        const sortOrder = (last?.sortOrder ?? -1) + 1

        const link = await prisma.linktreeLink.create({
            data: {
                label:  label.trim(),
                url:    url.trim(),
                icon:   icon || "link",
                imageUrl: imageUrl || null,
                sortOrder,
                photographerId: session.user.id,
            },
        })

        return NextResponse.json(link, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}