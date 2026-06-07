import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, generateFileName } from "@/lib/bunny"

export async function POST(req, context) {
    const params = await context.params
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        // Verificar que la galería pertenece al fotógrafo e incluir plan
        const gallery = await prisma.gallery.findFirst({
            where: { id: params.id, photographerId: session.user.id },
            include: {
                _count: { select: { photos: true } },
                photographer: {
                    include: { subscription: { include: { plan: true } } },
                },
            },
        })

        if (!gallery) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

        // ── Verificar plan activo ─────────────────────────────────────────────
        const sub  = gallery.photographer.subscription
        const now  = new Date()
        const plan = sub?.plan
        const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now

        if (!hasActivePlan) {
            return NextResponse.json(
                { error: "Necesitás un plan activo para subir fotos.", code: "NO_PLAN" },
                { status: 403 }
            )
        }

        // ── Verificar límite de fotos del plan ────────────────────────────────
        const currentCount = gallery._count.photos
        const maxPhotos    = plan.maxPhotos // -1 = ilimitado

        const formData = await req.formData()
        const files      = formData.getAll("photos")
        const price      = parseFloat(formData.get("price") || "0")

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 })
        }

        // ── Verificar límite de almacenamiento del plan ───────────────────────
        const maxStorageGB = plan.maxStorageGB ?? -1
        if (maxStorageGB !== -1) {
            const usedBytes     = Number(gallery.photographer.storageUsedBytes ?? 0)
            const limitBytes    = maxStorageGB * 1024 * 1024 * 1024
            const incomingBytes = files.reduce((sum, f) => sum + (f.size || 0), 0)

            if (usedBytes >= limitBytes) {
                const usedGB = (usedBytes / (1024 ** 3)).toFixed(2)
                return NextResponse.json(
                    {
                        error: `Tu plan "${plan.name}" tiene un límite de ${maxStorageGB} GB de almacenamiento y ya lo alcanzaste (${usedGB} GB usados). Eliminá fotos o actualizá tu plan.`,
                        code: "STORAGE_LIMIT",
                        limitGB: maxStorageGB,
                        usedGB: Number(usedGB),
                    },
                    { status: 403 }
                )
            }

            if (usedBytes + incomingBytes > limitBytes) {
                const usedGB      = (usedBytes / (1024 ** 3)).toFixed(2)
                const availableGB = ((limitBytes - usedBytes) / (1024 ** 3)).toFixed(2)
                return NextResponse.json(
                    {
                        error: `No hay suficiente espacio disponible. Tu plan permite ${maxStorageGB} GB en total, tenés ${availableGB} GB libres y estás intentando subir ${(incomingBytes / (1024 ** 3)).toFixed(2)} GB.`,
                        code: "STORAGE_LIMIT_PARTIAL",
                        limitGB: maxStorageGB,
                        usedGB: Number(usedGB),
                        availableGB: Number(availableGB),
                    },
                    { status: 403 }
                )
            }
        }

        if (maxPhotos !== -1) {
            const remaining = maxPhotos - currentCount
            if (remaining <= 0) {
                return NextResponse.json(
                    {
                        error: `Tu plan "${plan.name}" permite hasta ${maxPhotos} fotos por galería y esta galería ya está llena.`,
                        code: "PHOTO_LIMIT",
                        limit: maxPhotos,
                        current: currentCount,
                    },
                    { status: 403 }
                )
            }
            if (files.length > remaining) {
                return NextResponse.json(
                    {
                        error: `Solo podés subir ${remaining} foto${remaining === 1 ? "" : "s"} más en esta galería (límite del plan: ${maxPhotos}).`,
                        code: "PHOTO_LIMIT_PARTIAL",
                        limit: maxPhotos,
                        current: currentCount,
                        remaining,
                    },
                    { status: 403 }
                )
            }
        }

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        const maxSize      = 20 * 1024 * 1024 // 20MB

        const uploaded = []
        const errors   = []
        let totalUploadedBytes = 0

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                errors.push({ name: file.name, error: "Tipo de archivo no permitido" })
                continue
            }
            if (file.size > maxSize) {
                errors.push({ name: file.name, error: "El archivo supera los 20MB" })
                continue
            }

            try {
                const buffer   = await file.arrayBuffer()
                const fileName = generateFileName(file.name)
                const folder   = `galleries/${gallery.id}`

                const { bunnyPath, bunnyUrl } = await uploadToBunny(
                    Buffer.from(buffer),
                    fileName,
                    folder
                )

                const photo = await prisma.photo.create({
                    data: {
                        bunnyPath,
                        bunnyUrl,
                        price,
                        galleryId: gallery.id,
                        title: file.name.split(".")[0],
                        sizeBytes: file.size,
                    },
                })

                totalUploadedBytes += file.size
                uploaded.push(photo)
            } catch (err) {
                console.error(`Error subiendo ${file.name}:`, err)
                errors.push({ name: file.name, error: "Error al subir el archivo" })
            }
        }

        // ── Actualizar almacenamiento usado del fotógrafo ─────────────────────
        if (totalUploadedBytes > 0) {
            await prisma.photographer.update({
                where: { id: session.user.id },
                data: { storageUsedBytes: { increment: BigInt(totalUploadedBytes) } },
            })
        }

        return NextResponse.json({ uploaded, errors }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function GET(req, context) {
    const params = await context.params
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const photos = await prisma.photo.findMany({
            where: {
                galleryId: params.id,
                gallery: { photographerId: session.user.id },
            },
            orderBy: { createdAt: "asc" },
        })

        return NextResponse.json(photos)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
