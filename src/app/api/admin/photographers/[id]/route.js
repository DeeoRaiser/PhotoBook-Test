import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"
import bcrypt from "bcryptjs"

export async function GET(req, { params }) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await params

        const photographer = await prisma.photographer.findUnique({
            where: { id },
            include: {
                subscription: { include: { plan: true } },
                _count: { select: { galleries: true } },
            },
        })

        if (!photographer) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

        // Total generado: órdenes PAID o DELIVERED de sus galerías
        const revenueResult = await prisma.order.aggregate({
            where: {
                photographerId: id,
                status: { in: ["PAID", "DELIVERED"] },
            },
            _sum: { total: true },
            _count: { id: true },
        })

        const totalRevenue = Number(revenueResult._sum.total ?? 0)
        const totalOrders = revenueResult._count.id

        return NextResponse.json({
            ...photographer,
            storageUsedBytes: Number(photographer.storageUsedBytes),
            stats: {
                totalRevenue,
                totalOrders,
            },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PATCH(req, { params }) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await params
        const body = await req.json()

        const updateData = {}

        if (body.name !== undefined) updateData.name = body.name
        if (body.email !== undefined) updateData.email = body.email
        if (body.isBlocked !== undefined) updateData.isBlocked = body.isBlocked
        if (body.blockedReason !== undefined) updateData.blockedReason = body.blockedReason

        if (body.newPassword) {
            updateData.password = await bcrypt.hash(body.newPassword, 10)
        }

        const updated = await prisma.photographer.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json({
            ...updated,
            storageUsedBytes: Number(updated.storageUsedBytes),
        })
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
        await prisma.photographer.delete({ where: { id } })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}