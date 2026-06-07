import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, deleteFromBunny } from "@/lib/bunny"

export async function DELETE(req, context) {
    try {
        const { photoId } = await context.params
        const { searchParams } = new URL(req.url)
        const accessToken = searchParams.get("accessToken")

        if (!accessToken) {
            return NextResponse.json({ error: "Token requerido" }, { status: 401 })
        }

        // Verificar que el token pertenece a un invitado válido
        const guest = await prisma.eventGuest.findUnique({
            where: { accessToken },
        })

        if (!guest) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 })
        }

        // Buscar la foto y verificar que pertenece a este invitado
        const photo = await prisma.communityPhoto.findUnique({
            where: { id: photoId },
        })

        if (!photo) {
            return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
        }

        if (photo.guestId !== guest.id) {
            return NextResponse.json({ error: "No tenés permiso para borrar esta foto" }, { status: 403 })
        }

        // Borrar de Bunny CDN
        if (photo.bunnyPath) {
            try {
                await deleteFromBunny(photo.bunnyPath)
            } catch (err) {
                console.error("Error borrando de Bunny:", err)
                // Continuar aunque falle Bunny — al menos borramos de la DB
            }
        }

        // Borrar de la DB
        await prisma.communityPhoto.delete({ where: { id: photoId } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE community photo error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PATCH(req) {
    try {
        const { accessToken, selfieDataUrl } = await req.json()

        if (!accessToken) {
            return NextResponse.json({ error: "Token requerido" }, { status: 401 })
        }

        if (!selfieDataUrl || !selfieDataUrl.startsWith("data:image/")) {
            return NextResponse.json({ error: "Imagen inválida" }, { status: 400 })
        }

        const guest = await prisma.eventGuest.findUnique({
            where: { accessToken },
            select: { id: true, galleryId: true, selfieBunnyPath: true },
        })

        if (!guest) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 })
        }

        const matches = selfieDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        if (!matches) {
            return NextResponse.json({ error: "Formato de imagen inválido" }, { status: 400 })
        }

        const mimeType = matches[1]
        const base64Data = matches[2]
        const rawExt = mimeType.split("/")[1]
        const ext = rawExt === "jpeg" ? "jpg" : rawExt
        const buffer = Buffer.from(base64Data, "base64")

        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const fileName = `${timestamp}-${random}.${ext}`
        const folder = `events/${guest.galleryId}/selfies`

        const { bunnyUrl, bunnyPath } = await uploadToBunny(buffer, fileName, folder)

        // Borrar selfie vieja solo si tiene path guardado en Bunny
        if (guest.selfieBunnyPath) {
            try {
                await deleteFromBunny(guest.selfieBunnyPath)
            } catch (err) {
                console.error("Error borrando selfie vieja:", err)
            }
        }

        await prisma.eventGuest.update({
            where: { accessToken },
            data: {
                selfieUrl: bunnyUrl,
                selfieBunnyPath: bunnyPath,
            },
        })

        return NextResponse.json({ selfieUrl: bunnyUrl })
    } catch (error) {
        console.error("PATCH selfie error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}