// src/app/api/photographer/subscription/cancel/route.js
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MP_API = "https://api.mercadopago.com"
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const sub = await prisma.subscription.findUnique({
            where: { photographerId: session.user.id },
        })

        if (!sub) {
            return NextResponse.json({ error: "No tenés una suscripción activa" }, { status: 404 })
        }

        // Cancelar en MercadoPago si es una suscripción recurrente
        if (sub.mpSubscriptionId) {
            const res = await fetch(`${MP_API}/preapproval/${sub.mpSubscriptionId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
                body: JSON.stringify({ status: "cancelled" }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                console.error("[Cancel] Error al cancelar en MP:", err)
                // Continuamos de todas formas para actualizar en DB
            } else {
                console.log(`[Cancel] Suscripción MP ${sub.mpSubscriptionId} cancelada`)
            }
        }

        // Marcar como cancelada en nuestra DB.
        // El acceso sigue hasta la fecha de expiresAt ya pagada.
        await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: "CANCELLED",
                autoRenew: false,
            },
        })

        console.log(`[Cancel] ✅ Suscripción cancelada para fotógrafo ${session.user.id}`)

        return NextResponse.json({
            ok: true,
            message: "Suscripción cancelada. Seguís teniendo acceso hasta la fecha de vencimiento.",
            expiresAt: sub.expiresAt,
        })
    } catch (error) {
        console.error("[Cancel] Error:", error)
        return NextResponse.json({ error: "Error al cancelar la suscripción" }, { status: 500 })
    }
}
