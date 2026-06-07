import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"

function toCSV(rows, headers) {
    const escape = (v) => {
        const s = v === null || v === undefined ? "" : String(v)
        return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s
    }
    const lines = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    ]
    return lines.join("\n")
}

export async function GET(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") // "photographers" | "orders"

        if (type === "photographers") {
            const photographers = await prisma.photographer.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    subscription: { include: { plan: true } },
                    _count: { select: { galleries: true } },
                },
            })

            const rows = photographers.map((p) => ({
                nombre:        p.name,
                email:         p.email,
                bloqueado:     p.isBlocked ? "Sí" : "No",
                galerías:      p._count.galleries,
                plan:          p.subscription?.plan?.name ?? "Sin plan",
                suscripción_hasta: p.subscription
                    ? new Date(p.subscription.expiresAt).toLocaleDateString("es-AR")
                    : "",
                monto_pagado:  p.subscription?.amountPaid ?? "",
                método_pago:   p.subscription?.paymentMethod ?? "",
                registrado:    new Date(p.createdAt).toLocaleDateString("es-AR"),
            }))

            const headers = ["nombre","email","bloqueado","galerías","plan","suscripción_hasta","monto_pagado","método_pago","registrado"]
            const csv = toCSV(rows, headers)

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="fotografos_${new Date().toISOString().slice(0,10)}.csv"`,
                },
            })
        }

        if (type === "orders") {
            const orders = await prisma.order.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    gallery: {
                        select: {
                            title: true,
                            photographer: { select: { name: true, email: true } },
                        },
                    },
                    items: true,
                },
            })

            const rows = orders.map((o) => ({
                fecha:            new Date(o.createdAt).toLocaleDateString("es-AR"),
                cliente:          o.clientName ?? "",
                email_cliente:    o.clientEmail,
                teléfono:         o.clientPhone ?? "",
                estado:           o.status,
                total:            Number(o.total).toFixed(2),
                fotos:            o.items.length,
                galería:          o.gallery.title,
                fotógrafo:        o.gallery.photographer.name,
                email_fotógrafo:  o.gallery.photographer.email,
                mp_payment_id:    o.mpPaymentId ?? "",
                mp_status:        o.mpStatus ?? "",
                link_activo:      o.downloadToken ? "Sí" : "No",
            }))

            const headers = ["fecha","cliente","email_cliente","teléfono","estado","total","fotos","galería","fotógrafo","email_fotógrafo","mp_payment_id","mp_status","link_activo"]
            const csv = toCSV(rows, headers)

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="ordenes_${new Date().toISOString().slice(0,10)}.csv"`,
                },
            })
        }

        return NextResponse.json({ error: "Tipo inválido. Usá ?type=photographers o ?type=orders" }, { status: 400 })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
