import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search") || ""
        const status = searchParams.get("status") // "active" | "blocked" | "expired"

        const now = new Date()

        const photographers = await prisma.photographer.findMany({
            where: {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ],
                }),
                ...(status === "blocked" && { isBlocked: true }),
                ...(status === "active" && {
                    isBlocked: false,
                    subscription: {
                        is: {
                            status: "ACTIVE",
                            expiresAt: { gte: now },
                        },
                    },
                }),
                ...(status === "expired" && {
                    isBlocked: false,
                    OR: [
                        { subscription: { is: null } },
                        { subscription: { is: { expiresAt: { lt: now } } } },
                    ],
                }),
            },
            include: {
                subscription: { include: { plan: true } },
                _count: { select: { galleries: true } },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(
            photographers.map(p => ({
                ...p,
                storageUsedBytes: Number(p.storageUsedBytes),
            }))
        )
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}