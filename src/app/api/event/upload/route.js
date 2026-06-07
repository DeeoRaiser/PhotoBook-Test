import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, generateFileName } from "@/lib/bunny"

// POST: invitado sube una foto/video a la sección comunidad
export async function POST(req) {
    try {
        const formData = await req.formData()
        const accessToken = formData.get("accessToken")
        const gallerySlug = formData.get("gallerySlug")
        const files = formData.getAll("files")

        if (!accessToken || !gallerySlug || !files?.length) {
            return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
        }

        // Verificar guest token
        const guest = await prisma.eventGuest.findUnique({
            where: { accessToken },
            include: { gallery: { select: { id: true, slug: true, galleryType: true } } },
        })

        if (!guest) return NextResponse.json({ error: "Token inválido" }, { status: 401 })
        if (guest.gallery.slug !== gallerySlug) return NextResponse.json({ error: "Token incorrecto para esta galería" }, { status: 403 })
        if (guest.gallery.galleryType !== "event") return NextResponse.json({ error: "Galería no es de tipo evento" }, { status: 400 })

        const uploaded = []
        const errors = []

        for (const file of files) {
            try {
                const isVideo = file.type.startsWith("video/")
                const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/heic"]
                const allowedVideo = ["video/mp4", "video/quicktime", "video/webm"]
                const allowed = [...allowedImage, ...allowedVideo]

                if (!allowed.includes(file.type)) {
                    errors.push({ name: file.name, error: "Tipo de archivo no permitido" })
                    continue
                }

                const maxSize = isVideo ? 200 * 1024 * 1024 : 30 * 1024 * 1024
                if (file.size > maxSize) {
                    errors.push({ name: file.name, error: `Archivo demasiado grande (máx ${isVideo ? "200MB" : "30MB"})` })
                    continue
                }

                const buffer = Buffer.from(await file.arrayBuffer())
                const fileName = generateFileName(file.name)
                const folder = `events/${guest.gallery.id}/community`
                const { bunnyPath, bunnyUrl } = await uploadToBunny(buffer, fileName, folder)

                const photo = await prisma.communityPhoto.create({
                    data: {
                        bunnyUrl,
                        bunnyPath,
                        isVideo,
                        galleryId: guest.gallery.id,
                        guestId: guest.id,
                    },
                    include: { guest: { select: { id: true, name: true, selfieUrl: true } } },
                })

                uploaded.push(photo)
            } catch (err) {
                console.error("Upload error:", err)
                errors.push({ name: file.name, error: "Error al subir el archivo" })
            }
        }

        return NextResponse.json({ uploaded, errors })
    } catch (error) {
        console.error("Upload route error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}