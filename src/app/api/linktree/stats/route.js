import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/linktree/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
// Retorna:
//   totalClicks       — suma total de clicks de todos los links (acumulado histórico)
//   linktreeViews     — visitas totales a la página /l/[slug] (acumulado histórico)
//   links             — [ { id, label, icon, clicks } ] con clicks del rango, ordenados desc
//   clicksByDay       — días del rango: [ { date: "2025-05-01", clicks: 12 } ]
//   clicksByLink      — por link en el rango: [ { linkId, label, date, clicks } ]
export async function GET(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const photographerId = session.user.id
        const { searchParams } = new URL(request.url)

        // Rango de fechas: por defecto el mes en curso
        const now   = new Date()
        const tz    = "America/Argentina/Buenos_Aires"

        let fromStr = searchParams.get("from")
        let toStr   = searchParams.get("to")

        // Fallback: mes actual
        if (!fromStr) {
            const first = new Date(now.getFullYear(), now.getMonth(), 1)
            fromStr = first.toISOString().slice(0, 10)
        }
        if (!toStr) {
            toStr = now.toISOString().slice(0, 10)
        }

        // Convertir a objetos Date (inicio y fin del día en UTC considerando TZ Argentina = UTC-3)
        const since = new Date(`${fromStr}T00:00:00-03:00`)
        const until = new Date(`${toStr}T23:59:59-03:00`)

        const [photographer, allLinksTotal, rawClicksByDay, rawClicksByLink] = await Promise.all([
            // Visitas totales + datos del linktree (siempre histórico)
            prisma.photographer.findUnique({
                where: { id: photographerId },
                select: {
                    linktreeViews:   true,
                    linktreeEnabled: true,
                    linktreeSlug:    true,
                },
            }),

            // Total acumulado de clicks por link (para el KPI "Clicks totales")
            prisma.linktreeLink.findMany({
                where: { photographerId },
                select: { id: true, label: true, icon: true, clicks: true, isActive: true },
                orderBy: { clicks: "desc" },
            }),

// Clicks por día en el rango
prisma.$queryRaw`
    SELECT
        DATE("clickedAt" AT TIME ZONE 'America/Argentina/Buenos_Aires') AS "day",
        COUNT(*)::int AS clicks
    FROM "LinktreeLinkClick"
    WHERE "photographerId" = ${photographerId}
      AND "clickedAt" >= ${since}
      AND "clickedAt" <= ${until}
    GROUP BY "day"
    ORDER BY "day" ASC
`,

// Clicks por link y por día en el rango
prisma.$queryRaw`
    SELECT
        c."linkId",
        l."label",
        l."icon",
        DATE(c."clickedAt" AT TIME ZONE 'America/Argentina/Buenos_Aires') AS "day",
        COUNT(*)::int AS clicks
    FROM "LinktreeLinkClick" c
    JOIN "LinktreeLink" l ON l."id" = c."linkId"
    WHERE c."photographerId" = ${photographerId}
      AND c."clickedAt" >= ${since}
      AND c."clickedAt" <= ${until}
    GROUP BY
        c."linkId",
        l."label",
        l."icon",
        "day"
    ORDER BY "day" ASC, clicks DESC
`,
        ])

        const totalClicks = allLinksTotal.reduce((s, l) => s + l.clicks, 0)

        // Rellenar días sin clicks con 0 para que el gráfico sea continuo
        const clicksByDay = fillDays(rawClicksByDay, since, until)

        // Clicks por link en el rango (para el ranking en "Ver detalles")
        const clicksByLink = (rawClicksByLink || []).map(r => ({
            linkId: r.linkId,
            label:  r.label,
            icon:   r.icon,
            date:   r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
            clicks: Number(r.clicks),
        }))

        // Recalcular clicks por link para el rango seleccionado
        const clicksByLinkAgg = {}
        for (const r of clicksByLink) {
            clicksByLinkAgg[r.linkId] = (clicksByLinkAgg[r.linkId] || 0) + r.clicks
        }
        const linksInRange = allLinksTotal.map(l => ({
            ...l,
            clicks: clicksByLinkAgg[l.id] ?? 0,
        })).sort((a, b) => b.clicks - a.clicks)

        return NextResponse.json({
            totalClicks,
            linktreeViews:   photographer?.linktreeViews   ?? 0,
            linktreeEnabled: photographer?.linktreeEnabled ?? false,
            linktreeSlug:    photographer?.linktreeSlug    ?? null,
            links: linksInRange,
            clicksByDay,
            clicksByLink,
            // Devolver el rango resuelto para que el cliente lo pueda mostrar
            range: { from: fromStr, to: toStr },
        })
    } catch (error) {
        console.error("linktree stats error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// Rellena los días sin datos con clicks: 0 para un gráfico sin gaps
function fillDays(raw, since, until) {
    const map = {}
    for (const r of raw || []) {
        const d = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day)
        map[d] = Number(r.clicks)
    }
    const result = []
    const cur    = new Date(since)
    const end    = new Date(until)
    while (cur <= end) {
        const key = cur.toISOString().slice(0, 10)
        result.push({ date: key, clicks: map[key] ?? 0 })
        cur.setDate(cur.getDate() + 1)
    }
    return result
}