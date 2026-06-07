import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import LinktreePublicPage from "./LinktreePublicPage"

export async function generateMetadata({ params }) {
    const { slug } = await params
    const photographer = await prisma.photographer.findUnique({
        where: { linktreeSlug: slug },
        select: { linktreeTitle: true, name: true, linktreeBio: true, linktreeAvatarUrl: true, portfolioAvatarUrl: true },
    })
    if (!photographer) return { title: "No encontrado" }
    const title = photographer.linktreeTitle || photographer.name
    const ogImage = photographer.linktreeAvatarUrl || photographer.portfolioAvatarUrl
    return {
        title,
        description: photographer.linktreeBio || `Links de ${title}`,
        openGraph: {
            title,
            description: photographer.linktreeBio || `Links de ${title}`,
            images: ogImage ? [ogImage] : [],
        },
    }
}

export default async function LinktreePage({ params }) {
    const { slug } = await params

    const photographer = await prisma.photographer.findUnique({
        where: { linktreeSlug: slug },
        select: {
            id: true,
            name: true,
            linktreeEnabled: true,
            linktreeTitle: true,
            linktreeBio: true,
            linktreeTheme: true,
            linktreeAvatarUrl: true,
            linktreeBackgroundUrl: true,
            portfolioAvatarUrl: true,
            portfolioSlug: true,
            subscription: { include: { plan: { select: { allowsLinktree: true } } } },
            linktreeLinks: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
            },
        },
    })

    if (!photographer) notFound()

    const sub = photographer.subscription
    const now = new Date()
    const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now
    const allowsLinktree = hasActivePlan && (sub.plan?.allowsLinktree ?? false)

    if (!photographer.linktreeEnabled || !allowsLinktree) notFound()

    const data = {
        name:          photographer.name,
        title:         photographer.linktreeTitle || photographer.name,
        bio:           photographer.linktreeBio,
        theme:         photographer.linktreeTheme || "dark",
        // avatar: el propio del linktree, o el del portfolio como fallback
        avatarUrl:     photographer.linktreeAvatarUrl || photographer.portfolioAvatarUrl || null,
        backgroundUrl: photographer.linktreeBackgroundUrl || null,
        portfolioSlug: photographer.portfolioSlug,
        links:         photographer.linktreeLinks.map(l => ({
            id:    l.id,
            label: l.label,
            url:   l.url,
            icon:  l.icon,
            imageUrl: l.imageUrl || null,
        })),
    }

    // Registrar visita (fire and forget, no bloquea el render)
    prisma.photographer.update({
        where: { id: photographer.id },
        data: { linktreeViews: { increment: 1 } },
    }).catch(() => {})

    return <LinktreePublicPage data={data} />
}