import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function PATCH(req, context) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const params = await context.params
        const body = await req.json()

        const data = {}
        if (body.status) data.status = body.status
        if (body.expiresAt) data.expiresAt = new Date(body.expiresAt)
        if (body.notes !== undefined) data.notes = body.notes
        if (body.extendDays) {
            const sub = await prisma.subscription.findUnique({ where: { id: params.id } })
            const base = sub.expiresAt > new Date() ? sub.expiresAt : new Date()
            data.expiresAt = new Date(base.getTime() + body.extendDays * 24 * 60 * 60 * 1000)
            data.status = "ACTIVE"
        }

        const updated = await prisma.subscription.update({
            where: { id: params.id },
            data,
            include: { plan: true },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}