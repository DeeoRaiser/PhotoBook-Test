import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const city = searchParams.get("city") || ""
        const province = searchParams.get("province") || ""

        // Build city search: match by city name (contains), case-insensitive
        const whereCity = city
            ? { portfolioCity: { contains: city, mode: "insensitive" } }
            : province
            ? { portfolioCity: { contains: province, mode: "insensitive" } }
            : {}

        const photographers = await prisma.photographer.findMany({
            where: {
                portfolioEnabled: true,
                isBlocked: false,
                ...whereCity,
            },
            select: {
                id: true,
                name: true,
                portfolioSlug: true,
                portfolioCity: true,
                portfolioSpecialty: true,
                portfolioAvatarUrl: true,
                portfolioCoverUrl: true,
                portfolioBio: true,
                _count: {
                    select: { galleries: { where: { isPublic: true } } }
                }
            },
            orderBy: { name: "asc" },
            take: 50,
        })

        return NextResponse.json(photographers)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Error" }, { status: 500 })
    }
}