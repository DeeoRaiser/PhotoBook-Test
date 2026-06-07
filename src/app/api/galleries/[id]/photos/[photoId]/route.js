import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFromBunny } from "@/lib/bunny"

export async function DELETE(req, context) {
    const params = await context.params
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const photo = await prisma.photo.findFirst({
            where: {
                id: params.photoId,
                galleryId: params.id,
                gallery: { photographerId: session.user.id },
            },
        })

        if (!photo) return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })

        await deleteFromBunny(photo.bunnyPath)
        await prisma.photo.delete({ where: { id: photo.id } })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}