import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFromBunny } from "@/lib/bunny"

// GET: listar fotos comunitarias de una galería (para el dashboard del fotógrafo)
export async function GET(req, context) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await context.params

        const gallery = await prisma.gallery.findUnique({
            where: { id, photographerId: session.user.id },
            select: { id: true, galleryType: true },
        })

        if (!gallery) return NextResponse.json({ error: "Galería no encontrada" }, { status: 404 })

        const photos = await prisma.communityPhoto.findMany({
            where: { galleryId: id },
            include: { guest: { select: { id: true, name: true, selfieUrl: true } } },
            orderBy: { createdAt: "desc" },
        })

        const guests = await prisma.eventGuest.findMany({
            where: { galleryId: id },
            orderBy: { createdAt: "asc" },
            include: { _count: { select: { communityPhotos: true } } },
        })

        return NextResponse.json({ photos, guests })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// DELETE: eliminar una foto comunitaria (solo el fotógrafo/dueño)
export async function DELETE(req, context) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await context.params
        const { photoId } = await req.json()

        const gallery = await prisma.gallery.findUnique({
            where: { id, photographerId: session.user.id },
        })
        if (!gallery) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

        const photo = await prisma.communityPhoto.findUnique({ where: { id: photoId } })
        if (!photo) return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })

        await deleteFromBunny(photo.bunnyPath)
        await prisma.communityPhoto.delete({ where: { id: photoId } })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}