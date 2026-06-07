import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { processProtectedImage } from "@/lib/watermark"
import bcrypt from "bcryptjs"

const cache = new Map()
const CACHE_TTL = 1000 * 60 * 10

export async function GET(req, context) {
    try {
        const params = await context.params
        const { photoId } = params

        const { searchParams } = new URL(req.url)
        const galleryPassword = searchParams.get("pwd")

        // Traer foto + galería + configuración de marca de agua del fotógrafo
        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
            include: {
                gallery: {
                    select: {
                        isPublic: true,
                        password: true,
                        slug: true,
                        proPhotosAreFree: true,
                        photographer: {
                            select: {
                                watermarkType: true,
                                watermarkText: true,
                                watermarkLogoUrl: true,
                            },
                        },
                    },
                },
            },
        })

        if (!photo) {
            return new NextResponse("Foto no encontrada", { status: 404 })
        }

        // Verificar acceso a galería privada
        if (!photo.gallery.isPublic) {
            if (!galleryPassword) {
                return new NextResponse("Acceso denegado", { status: 401 })
            }
            const valid = await bcrypt.compare(galleryPassword, photo.gallery.password)
            if (!valid) {
                return new NextResponse("Contraseña incorrecta", { status: 401 })
            }
        }

        // Si las fotos son gratuitas: redirigir directo a Bunny sin watermark
        if (photo.gallery.proPhotosAreFree) {
            return NextResponse.redirect(photo.bunnyUrl, { status: 302 })
        }

        // Cache — incluye tipo de watermark en la key para invalidar si cambia
        const { watermarkType, watermarkText, watermarkLogoUrl } = photo.gallery.photographer
        const cacheKey = `${photoId}_${watermarkType}_${watermarkText}`
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return new NextResponse(cached.buffer, {
                headers: {
                    "Content-Type": "image/jpeg",
                    "Cache-Control": "private, max-age=600",
                    "X-Robots-Tag": "noindex",
                },
            })
        }

        // Descargar original desde Bunny
        const bunnyRes = await fetch(photo.bunnyUrl)
        if (!bunnyRes.ok) {
            return new NextResponse("Error al obtener imagen", { status: 502 })
        }

        const originalBuffer = Buffer.from(await bunnyRes.arrayBuffer())

        // Procesar con la configuración del fotógrafo
        const protectedBuffer = await processProtectedImage(originalBuffer, {
            type: watermarkType,
            text: watermarkText,
            logoUrl: watermarkLogoUrl,
        })

        // Guardar en cache
        cache.set(cacheKey, { buffer: protectedBuffer, timestamp: Date.now() })

        if (cache.size > 100) {
            const now = Date.now()
            for (const [key, val] of cache.entries()) {
                if (now - val.timestamp > CACHE_TTL) cache.delete(key)
            }
        }

        return new NextResponse(protectedBuffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "private, max-age=600",
                "X-Robots-Tag": "noindex",
            },
        })
    } catch (error) {
        console.error("Error procesando imagen:", error)
        return new NextResponse("Error interno", { status: 500 })
    }
}