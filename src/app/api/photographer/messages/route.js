import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — obtener mensajes + count no leídos
export async function GET() {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const messages = await prisma.contactMessage.findMany({
            where: { photographerId: session.user.id },
            orderBy: { createdAt: "desc" },
        })

        const unread = messages.filter(m => !m.isRead).length

        return NextResponse.json({ messages, unread })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Error" }, { status: 500 })
    }
}

// PATCH — marcar como leído/no leído
export async function PATCH(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id, isRead, markAllRead } = await req.json()

        if (markAllRead) {
            await prisma.contactMessage.updateMany({
                where: { photographerId: session.user.id, isRead: false },
                data: { isRead: true },
            })
            return NextResponse.json({ ok: true })
        }

        // Verificar que el mensaje pertenece al fotógrafo
        const msg = await prisma.contactMessage.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!msg) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

        await prisma.contactMessage.update({
            where: { id },
            data: { isRead },
        })

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Error" }, { status: 500 })
    }
}

// DELETE — eliminar mensaje
export async function DELETE(req) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await req.json()

        const msg = await prisma.contactMessage.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!msg) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

        await prisma.contactMessage.delete({ where: { id } })

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Error" }, { status: 500 })
    }
}