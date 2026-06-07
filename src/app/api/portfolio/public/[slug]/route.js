import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET público — datos del portfolio de un fotógrafo por slug
export async function GET(req, { params }) {
    try {
        const { slug } = await params

        const photographer = await prisma.photographer.findFirst({
            where: {
                portfolioSlug: slug,
                portfolioEnabled: true,
                isBlocked: false,
            },
            select: {
                id: true,
                name: true,
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
                portfolioSlug: true,
            },
        })

        if (!photographer) {
            return NextResponse.json({ error: "Portfolio no encontrado" }, { status: 404 })
        }

        // Incrementar vistas (fire-and-forget, no bloquea la respuesta)
        prisma.photographer.update({
            where: { id: photographer.id },
            data: { portfolioViews: { increment: 1 } },
        }).catch(() => {})

        // Galerías públicas del fotógrafo
        const galleries = await prisma.gallery.findMany({
            where: { photographerId: photographer.id, isPublic: true },
            select: {
                id: true,
                title: true,
                slug: true,
                isFeatured: true,
                coverImage: true,
                createdAt: true,
            },
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        })

        return NextResponse.json({ ...photographer, galleries })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
