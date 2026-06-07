import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH: editar un link (label, url, icon, isActive, sortOrder)
export async function PATCH(req, context) {
    const { id } = await context.params
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const link = await prisma.linktreeLink.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!link) return NextResponse.json({ error: "Link no encontrado" }, { status: 404 })

        const body = await req.json()
        const data = {}
        if (body.label     !== undefined) data.label     = body.label.trim()
        if (body.url       !== undefined) data.url       = body.url.trim()
        if (body.icon      !== undefined) data.icon      = body.icon
        if (body.imageUrl  !== undefined) data.imageUrl  = body.imageUrl || null
        if (body.isActive  !== undefined) data.isActive  = Boolean(body.isActive)
        if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder)

        const updated = await prisma.linktreeLink.update({ where: { id }, data })
        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// DELETE: eliminar un link
export async function DELETE(req, context) {
    const { id } = await context.params
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const link = await prisma.linktreeLink.findFirst({
            where: { id, photographerId: session.user.id },
        })
        if (!link) return NextResponse.json({ error: "Link no encontrado" }, { status: 404 })

        await prisma.linktreeLink.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
