import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToBunny } from "@/lib/bunny"
import { nanoid } from "nanoid"

export async function POST(req) {
    try {
        const body = await req.json()
        const { gallerySlug, name, selfieDataUrl } = body

        if (!gallerySlug) {
            return NextResponse.json({ error: "Galería requerida" }, { status: 400 })
        }

        if (!name || name.trim().length < 2 || name.trim().length > 60) {
            return NextResponse.json({ error: "Nombre inválido" }, { status: 400 })
        }

        const cleanName = name.trim()

        const gallery = await prisma.gallery.findUnique({
            where: { slug: gallerySlug },
            select: { id: true, galleryType: true, title: true },
        })

        if (!gallery) {
            return NextResponse.json({ error: "Galería no encontrada" }, { status: 404 })
        }

        if (gallery.galleryType !== "event") {
            return NextResponse.json({ error: "Esta galería no es de tipo evento" }, { status: 400 })
        }

        // Evitar duplicados
        const existing = await prisma.eventGuest.findFirst({
            where: {
                galleryId: gallery.id,
                name: cleanName,
            },
        })

        if (existing) {
            return NextResponse.json({
                guestId: existing.id,
                accessToken: existing.accessToken,
                name: existing.name,
                galleryTitle: gallery.title,
            })
        }

        // Subir selfie a Bunny si viene (nunca guardar el base64 crudo en la DB)
        let selfieUrl = null
        let selfieBunnyPath = null

        if (selfieDataUrl && selfieDataUrl.startsWith("data:image/")) {
            try {
                const matches = selfieDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
                if (matches) {
                    const mimeType = matches[1]
                    const base64Data = matches[2]
                    const rawExt = mimeType.split("/")[1]
                    const ext = rawExt === "jpeg" ? "jpg" : rawExt
                    const buffer = Buffer.from(base64Data, "base64")

                    const timestamp = Date.now()
                    const random = Math.random().toString(36).substring(2, 8)
                    const fileName = `${timestamp}-${random}.${ext}`
                    const folder = `events/${gallery.id}/selfies`

                    const result = await uploadToBunny(buffer, fileName, folder)
                    selfieUrl = result.bunnyUrl
                    selfieBunnyPath = result.bunnyPath
                }
            } catch (err) {
                // Si falla la subida de selfie, continuar sin ella (no bloquear el check-in)
                console.error("Selfie upload error:", err)
            }
        }

        const accessToken = nanoid(32)

        const guest = await prisma.eventGuest.create({
            data: {
                name: cleanName,
                selfieUrl,
                selfieBunnyPath,
                accessToken,
                galleryId: gallery.id,
            },
        })

        return NextResponse.json({
            guestId: guest.id,
            accessToken: guest.accessToken,
            name: guest.name,
            galleryTitle: gallery.title,
        })
    } catch (error) {
        console.error("Check-in error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}