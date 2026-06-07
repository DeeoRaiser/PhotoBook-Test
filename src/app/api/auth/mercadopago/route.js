import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { buildAuthUrl } from "@/lib/mercadopago"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// GET /api/auth/mercadopago
// Verifica que el fotógrafo tenga un plan con MP habilitado
// y lo redirige al flujo OAuth de MercadoPago.
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Verificar que el plan del fotógrafo incluya MP
        const now = new Date()
        const photographer = await prisma.photographer.findUnique({
            where: { id: session.user.id },
            select: {
                subscription: {
                    select: {
                        status: true,
                        expiresAt: true,
                        plan: { select: { allowsMercadoPago: true } },
                    },
                },
            },
        })

        const sub = photographer?.subscription
        const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now
        const planAllowsMp = hasActivePlan ? (sub.plan?.allowsMercadoPago ?? false) : false

        if (!planAllowsMp) {
            return NextResponse.json(
                { error: "Tu plan no incluye cobros con Mercado Pago" },
                { status: 403 }
            )
        }

        // Generar state aleatorio (anti-CSRF) y code_verifier (PKCE requerido por MP)
        const state = crypto.randomBytes(24).toString("hex")
        const codeVerifier = crypto.randomBytes(32).toString("base64url")
        const codeChallenge = crypto
            .createHash("sha256")
            .update(codeVerifier)
            .digest("base64url")

        // Guardar state + codeVerifier en DB (expira en 10 min)
        await prisma.mpOAuthState.deleteMany({
            where: { photographerId: session.user.id },
        })
        await prisma.mpOAuthState.create({
            data: {
                state,
                codeVerifier,
                photographerId: session.user.id,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        })

        // Redirigir a MercadoPago con PKCE
        const authUrl = buildAuthUrl(state, codeChallenge)
        return NextResponse.redirect(authUrl)

    } catch (error) {
        console.error("[MP OAuth Init] Error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
