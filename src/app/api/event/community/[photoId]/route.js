import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFromBunny } from "@/lib/bunny"

export async function DELETE(req, context) {
    try {
        const { photoId } = await context.params
        const { searchParams } = new URL(req.url)
        const accessToken = searchParams.get("accessToken")

        if (!accessToken) {
            return NextResponse.json({ error: "Token requerido" }, { status: 401 })
        }

        const guest = await prisma.eventGuest.findUnique({
            where: { accessToken },
        })

        if (!guest) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 })
        }

        const photo = await prisma.communityPhoto.findUnique({
            where: { id: photoId },
        })

        if (!photo) {
            return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
        }

        if (photo.guestId !== guest.id) {
            return NextResponse.json({ error: "No tenés permiso para borrar esta foto" }, { status: 403 })
        }

        if (photo.bunnyPath) {
            try {
                await deleteFromBunny(photo.bunnyPath)
            } catch (err) {
                console.error("Error borrando de Bunny:", err)
            }
        }

        await prisma.communityPhoto.delete({ where: { id: photoId } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE community photo error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}