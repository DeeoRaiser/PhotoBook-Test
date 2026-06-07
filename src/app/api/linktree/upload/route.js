import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToBunny, deleteFromBunny, generateFileName } from "@/lib/bunny"
import sharp from "sharp"

// Dimensiones según el tipo de imagen
const RESIZE_CONFIG = {
    avatar:     { width: 200,  height: 200,  fit: "cover" },
    background: { width: 1200, height: null, fit: "inside" },
    link:       { width: 120,  height: 120,  fit: "cover" },
}

async function resizeImage(buffer, type) {
    const cfg = RESIZE_CONFIG[type] || RESIZE_CONFIG.link

    let pipeline = sharp(buffer)

    if (cfg.height) {
        pipeline = pipeline.resize(cfg.width, cfg.height, { fit: cfg.fit, position: "centre" })
    } else {
        pipeline = pipeline.resize(cfg.width, undefined, { fit: cfg.fit, withoutEnlargement: true })
    }

    // Siempre convertir a WebP para ahorrar espacio
    return pipeline.webp({ quality: 82 }).toBuffer()
}

// POST: subir imagen para el linktree
export async function POST(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        // Verificar plan
        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            include: { subscription: { include: { plan: true } } },
        })
        const sub  = photographer?.subscription
        const plan = sub?.plan
        const now  = new Date()
        const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now
        const allowsLinktree = hasActivePlan && (plan?.allowsLinktree ?? false)

        if (!allowsLinktree) {
            return NextResponse.json({ error: "Tu plan no incluye Linktree.", code: "PLAN_REQUIRED" }, { status: 403 })
        }

        const formData = await req.formData()
        const file = formData.get("file")
        const type = formData.get("type") // "background" | "avatar" | "link"

        if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })

        const allowed = ["image/jpeg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) {
            return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG o WebP" }, { status: 400 })
        }
        const maxSize = 10 * 1024 * 1024 // 10 MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "La imagen no puede superar 10MB" }, { status: 400 })
        }

        // Redimensionar y convertir a WebP
        const rawBuffer   = Buffer.from(await file.arrayBuffer())
        const webpBuffer  = await resizeImage(rawBuffer, type)

        // Siempre subir como .webp
        const baseName = file.name.replace(/\.[^.]+$/, "")
        const fileName = generateFileName(baseName + ".webp")
        const folder   = `linktree/${session.user.id}`
        const { bunnyPath, bunnyUrl } = await uploadToBunny(webpBuffer, fileName, folder)

        // Eliminar imagen anterior si corresponde (solo avatar y background se guardan en Photographer)
        if (type === "background" && photographer.linktreeBackgroundBunnyPath) {
            deleteFromBunny(photographer.linktreeBackgroundBunnyPath).catch(() => {})
        }
        if (type === "avatar" && photographer.linktreeAvatarBunnyPath) {
            deleteFromBunny(photographer.linktreeAvatarBunnyPath).catch(() => {})
        }

        // Guardar en DB solo para avatar y background (link se guarda en LinktreeLink desde el cliente)
        if (type === "background" || type === "avatar") {
            const fieldUrl  = type === "background" ? "linktreeBackgroundUrl"       : "linktreeAvatarUrl"
            const fieldPath = type === "background" ? "linktreeBackgroundBunnyPath" : "linktreeAvatarBunnyPath"

            await prisma.photographer.update({
                where: { id: session.user.id },
                data: { [fieldUrl]: bunnyUrl, [fieldPath]: bunnyPath },
            })
        }

        return NextResponse.json({ url: bunnyUrl, bunnyPath })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
