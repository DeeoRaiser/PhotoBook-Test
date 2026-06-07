import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST: toggle like on a community photo
// Uses localStorage on client to track liked photos (no auth needed)
export async function POST(req) {
    try {
        const { photoId, action } = await req.json() // action: "like" | "unlike"

        if (!photoId || !["like", "unlike"].includes(action)) {
            return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
        }

        const photo = await prisma.communityPhoto.findUnique({
            where: { id: photoId },
            select: { id: true, likesCount: true },
        })

        if (!photo) {
            return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
        }

        const newCount = action === "like"
            ? photo.likesCount + 1
            : Math.max(0, photo.likesCount - 1)

        const updated = await prisma.communityPhoto.update({
            where: { id: photoId },
            data: { likesCount: newCount },
            select: { id: true, likesCount: true },
        })

        return NextResponse.json({ id: updated.id, likesCount: updated.likesCount })
    } catch (error) {
        console.error("Like error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
