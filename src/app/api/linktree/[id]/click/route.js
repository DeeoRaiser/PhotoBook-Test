import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

// POST público: registrar click en un link (con log histórico)
export async function POST(req, context) {
    const { id } = await context.params
    try {
        // Buscar el link para obtener el photographerId
        const link = await prisma.linktreeLink.findUnique({
            where: { id },
            select: { photographerId: true, isActive: true },
        })

        if (!link || !link.isActive) {
            return NextResponse.json({ ok: false })
        }

        // Incrementar el contador total Y registrar el click con fecha en paralelo
        await Promise.all([
            prisma.linktreeLink.update({
                where: { id },
                data: { clicks: { increment: 1 } },
            }),
            prisma.$executeRaw`
                INSERT INTO "LinktreeLinkClick" ("id", "linkId", "photographerId", "clickedAt")
                VALUES (${nanoid()}, ${id}, ${link.photographerId}, NOW())
            `,
        ])

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error("click error:", err)
        return NextResponse.json({ ok: false })
    }
}
