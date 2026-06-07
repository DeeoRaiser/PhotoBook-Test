import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: listar fotos de la comunidad de una galería
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const gallerySlug = searchParams.get("gallerySlug")

        if (!gallerySlug) {
            return NextResponse.json({ error: "gallerySlug requerido" }, { status: 400 })
        }

        const gallery = await prisma.gallery.findUnique({
            where: { slug: gallerySlug },
            select: { id: true },
        })

        if (!gallery) {
            return NextResponse.json({ error: "Galería no encontrada" }, { status: 404 })
        }

        const photos = await prisma.communityPhoto.findMany({
            where: { galleryId: gallery.id },
            include: {
                guest: { select: { id: true, name: true, selfieUrl: true } },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ photos })
    } catch (error) {
        console.error("GET community error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// POST: subir foto/video de la comunidad
export async function POST(req) {
    try {
        const body = await req.json()
        const { gallerySlug, accessToken, bunnyUrl, bunnyPath, width, height, isVideo } = body

        if (!gallerySlug || !accessToken || !bunnyUrl || !bunnyPath) {
            return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
        }

        // Verificar token del invitado
        const guest = await prisma.eventGuest.findUnique({
            where: { accessToken },
            include: { gallery: { select: { id: true, slug: true, galleryType: true } } },
        })

        if (!guest) {
            return NextResponse.json({ error: "Token de acceso inválido" }, { status: 401 })
        }

        if (guest.gallery.slug !== gallerySlug) {
            return NextResponse.json({ error: "Token no corresponde a esta galería" }, { status: 403 })
        }

        if (guest.gallery.galleryType !== "event") {
            return NextResponse.json({ error: "Galería no es de tipo evento" }, { status: 400 })
        }

        const photo = await prisma.communityPhoto.create({
            data: {
                bunnyUrl,
                bunnyPath,
                width: width || null,
                height: height || null,
                isVideo: isVideo || false,
                galleryId: guest.gallery.id,
                guestId: guest.id,
            },
            include: {
                guest: { select: { id: true, name: true, selfieUrl: true } },
            },
        })

        return NextResponse.json({ photo })
    } catch (error) {
        console.error("POST community error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}