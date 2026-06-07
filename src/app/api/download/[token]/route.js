import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import archiver from "archiver"
import { Readable } from "stream"

export async function GET(req, context) {
    try {
        const params = await context.params
        const { token } = params

        // Buscar orden por token
        const order = await prisma.order.findUnique({
            where: { downloadToken: token },
            include: {
                items: {
                    include: {
                        photo: true,
                    },
                },
                gallery: {
                    select: { title: true, slug: true },
                },
            },
        })

        if (!order) {
            return new NextResponse("Link de descarga no válido", { status: 404 })
        }

        // Verificar expiración
        if (new Date() > new Date(order.downloadExpiresAt)) {
            return new NextResponse("Este link de descarga ha expirado", { status: 410 })
        }

        // Incrementar contador de descargas
        await prisma.order.update({
            where: { id: order.id },
            data: { downloadCount: { increment: 1 } },
        })

        // Nombre del ZIP
        const zipName = `${order.gallery.slug}-fotos.zip`

        // Crear stream del ZIP
        const archive = archiver("zip", { zlib: { level: 6 } })

        // Descargar y agregar cada foto al ZIP
        const photoPromises = order.items.map(async (item, index) => {
            const res = await fetch(item.photo.bunnyUrl)
            if (!res.ok) throw new Error(`Error descargando foto ${item.photo.id}`)

            const buffer = Buffer.from(await res.arrayBuffer())
            const ext = item.photo.bunnyUrl.split(".").pop().split("?")[0] || "jpg"
            const fileName = item.photo.title
                ? `${String(index + 1).padStart(2, "0")}-${item.photo.title}.${ext}`
                : `${String(index + 1).padStart(2, "0")}-foto.${ext}`

            archive.append(buffer, { name: fileName })
        })

        // Esperar todas las fotos antes de finalizar
        await Promise.all(photoPromises)
        archive.finalize()

        // Convertir stream de archiver a ReadableStream de Web API
        const nodeStream = Readable.from(archive)
        const webStream = new ReadableStream({
            start(controller) {
                nodeStream.on("data", (chunk) => controller.enqueue(chunk))
                nodeStream.on("end", () => controller.close())
                nodeStream.on("error", (err) => controller.error(err))
            },
        })

        return new NextResponse(webStream, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${zipName}"`,
                "Cache-Control": "no-store",
            },
        })
    } catch (error) {
        console.error("Error generando ZIP:", error)
        return new NextResponse("Error al generar la descarga", { status: 500 })
    }
}