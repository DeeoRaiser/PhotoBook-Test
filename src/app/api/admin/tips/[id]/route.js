import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function PATCH(req, { params }) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await params
        const body = await req.json()
        const { title, description, buttonLabel, buttonUrl, isPinned, isActive, order } = body

        const tip = await prisma.dashboardTip.update({
            where: { id },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(description !== undefined && { description: description.trim() }),
                ...(buttonLabel !== undefined && { buttonLabel: buttonLabel?.trim() || null }),
                ...(buttonUrl !== undefined && { buttonUrl: buttonUrl?.trim() || null }),
                ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
                ...(isActive !== undefined && { isActive: Boolean(isActive) }),
                ...(order !== undefined && { order: Number(order) }),
            },
        })

        return NextResponse.json(tip)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function DELETE(req, { params }) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await params
        await prisma.dashboardTip.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
