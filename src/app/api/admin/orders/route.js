import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const status     = searchParams.get("status")   // PENDING | PAID | DELIVERED | CANCELLED
        const search     = searchParams.get("search") || ""
        const page       = Math.max(1, parseInt(searchParams.get("page") || "1"))
        const pageSize   = 20

        const where = {
            ...(status && { status }),
            ...(search && {
                OR: [
                    { clientEmail: { contains: search, mode: "insensitive" } },
                    { clientName:  { contains: search, mode: "insensitive" } },
                    { gallery: { photographer: { name: { contains: search, mode: "insensitive" } } } },
                ],
            }),
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    items: {
                        include: { photo: { select: { title: true, bunnyUrl: true } } },
                    },
                    gallery: {
                        select: {
                            title: true,
                            photographer: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ])

        return NextResponse.json({ orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
