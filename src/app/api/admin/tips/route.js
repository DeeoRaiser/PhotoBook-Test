import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET() {
    try {
        const tips = await prisma.dashboardTip.findMany({
            orderBy: [{ isPinned: "desc" }, { order: "asc" }, { createdAt: "desc" }],
        })
        return NextResponse.json(tips)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const { title, description, buttonLabel, buttonUrl, isPinned, isActive, order } = body

        if (!title?.trim()) return NextResponse.json({ error: "El título es requerido" }, { status: 400 })
        if (!description?.trim()) return NextResponse.json({ error: "La descripción es requerida" }, { status: 400 })

        const tip = await prisma.dashboardTip.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                buttonLabel: buttonLabel?.trim() || null,
                buttonUrl: buttonUrl?.trim() || null,
                isPinned: Boolean(isPinned),
                isActive: isActive !== false,
                order: Number(order) || 0,
            },
        })

        return NextResponse.json(tip, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
