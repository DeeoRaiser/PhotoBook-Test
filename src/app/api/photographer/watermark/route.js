import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, deleteFromBunny, generateFileName } from "@/lib/bunny"

// GET — obtener configuración actual
export async function GET() {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            select: {
                watermarkType: true,
                watermarkText: true,
                watermarkLogoUrl: true,
            },
        })

        return NextResponse.json(photographer)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// POST — actualizar marca de agua
export async function POST(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const formData = await req.formData()
        const type = formData.get("type") // "text" | "logo"
        const text = formData.get("text")
        const logoFile = formData.get("logo")

        if (!["text", "logo"].includes(type)) {
            return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
        }

        if (type === "text" && (!text || text.trim().length < 1)) {
            return NextResponse.json({ error: "El texto no puede estar vacío" }, { status: 400 })
        }

        const data = { watermarkType: type }

        if (type === "text") {
            data.watermarkText = text.trim()
        }

        if (type === "logo" && logoFile && logoFile.size > 0) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
            if (!allowedTypes.includes(logoFile.type)) {
                return NextResponse.json(
                    { error: "Solo se permiten PNG, JPG, WEBP o SVG" },
                    { status: 400 }
                )
            }

            if (logoFile.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "El logo no puede superar 5MB" }, { status: 400 })
            }

            // Borrar logo anterior si existe
            const current = await prisma.photographer.findUnique({
                where: { id: session.user.id },
                select: { watermarkLogoBunnyPath: true },
            })
            if (current?.watermarkLogoBunnyPath) {
                await deleteFromBunny(current.watermarkLogoBunnyPath).catch(() => {})
            }

            // Subir nuevo logo
            const buffer = await logoFile.arrayBuffer()
            const fileName = generateFileName(logoFile.name)
            const { bunnyPath, bunnyUrl } = await uploadToBunny(
                Buffer.from(buffer),
                fileName,
                "watermarks"
            )

            data.watermarkLogoUrl = bunnyUrl
            data.watermarkLogoBunnyPath = bunnyPath
        }

        const updated = await prisma.photographer.update({
            where: { id: session.user.id },
            data,
            select: {
                watermarkType: true,
                watermarkText: true,
                watermarkLogoUrl: true,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}