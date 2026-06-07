import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, deleteFromBunny, generateFileName } from "@/lib/bunny"

// PUT — establece la foto de portada
// Acepta dos modos:
//   a) multipart/form-data con un archivo "cover" → sube a Bunny y guarda la URL
//   b) JSON { photoId } → usa la URL de una foto existente de la galería
export async function PUT(req, context) {
    try {
        const { id } = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const gallery = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        const contentType = req.headers.get("content-type") || ""

        // ── Modo A: subida de archivo propio ──────────────────────────────────
        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData()
            const file = formData.get("cover")

            if (!file || typeof file === "string") {
                return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
            }

            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json({ error: "Tipo de archivo no permitido. Usá JPG, PNG o WEBP." }, { status: 400 })
            }
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: "La imagen no puede superar los 10MB" }, { status: 400 })
            }

            const buffer   = Buffer.from(await file.arrayBuffer())
            const fileName = generateFileName(file.name)
            const { bunnyUrl, bunnyPath } = await uploadToBunny(buffer, fileName, `covers/${id}`)

            // Si había una portada subida manualmente antes, eliminarla
            if (gallery.coverBunnyPath) {
                await deleteFromBunny(gallery.coverBunnyPath).catch(() => {})
            }

            const updated = await prisma.gallery.update({
                where: { id },
                data: { coverImage: bunnyUrl, coverBunnyPath: bunnyPath },
            })

            return NextResponse.json({ coverImage: updated.coverImage })
        }

        // ── Modo B: usar foto existente de la galería ─────────────────────────
        const { photoId } = await req.json()
        if (!photoId) return NextResponse.json({ error: "photoId requerido" }, { status: 400 })

        const photo = await prisma.photo.findFirst({
            where: { id: photoId, galleryId: id },
        })
        if (!photo) return NextResponse.json({ error: "Foto no encontrada en esta galería" }, { status: 404 })

        // Si tenía una portada subida manualmente, limpiarla
        if (gallery.coverBunnyPath) {
            await deleteFromBunny(gallery.coverBunnyPath).catch(() => {})
        }

        const updated = await prisma.gallery.update({
            where: { id },
            data: { coverImage: photo.bunnyUrl, coverBunnyPath: null },
        })

        return NextResponse.json({ coverImage: updated.coverImage })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// PATCH — guarda solo la posición visual del crop (coverPosition)
export async function PATCH(req, context) {
    try {
        const { id } = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const gallery = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        const { coverPosition } = await req.json()
        if (!coverPosition || typeof coverPosition !== "string") {
            return NextResponse.json({ error: "coverPosition requerido" }, { status: 400 })
        }

        const updated = await prisma.gallery.update({
            where: { id },
            data: { coverPosition },
        })

        return NextResponse.json({ coverPosition: updated.coverPosition })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// DELETE — quita la portada
export async function DELETE(req, context) {
    try {
        const { id } = await context.params
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const gallery = await prisma.gallery.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        if (gallery.coverBunnyPath) {
            await deleteFromBunny(gallery.coverBunnyPath).catch(() => {})
        }

        await prisma.gallery.update({
            where: { id },
            data: { coverImage: null, coverBunnyPath: null },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}