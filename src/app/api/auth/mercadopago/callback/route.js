import { NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/mercadopago"
import { encrypt } from "@/lib/crypto"
import { prisma } from "@/lib/prisma"

// GET /api/auth/mercadopago/callback?code=XXX&state=YYY
// MercadoPago redirige acá tras la autorización del fotógrafo.
// No depende de cookies ni sesión — el state se valida contra la DB.
export async function GET(req) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const settingsUrl = `${baseUrl}/dashboard/settings`

    try {
        const url = new URL(req.url)
        const code = url.searchParams.get("code")
        const returnedState = url.searchParams.get("state")
        const mpError = url.searchParams.get("error")

        // El fotógrafo canceló la autorización en MP
        if (mpError) {
            console.warn("[MP OAuth Callback] El usuario canceló:", mpError)
            return NextResponse.redirect(`${settingsUrl}?mp_error=cancelled`)
        }

        if (!code || !returnedState) {
            return NextResponse.redirect(`${settingsUrl}?mp_error=no_code`)
        }

        // Buscar el state en DB y validar
        const now = new Date()
        const oauthState = await prisma.mpOAuthState.findUnique({
            where: { state: returnedState },
        })

        if (!oauthState) {
            console.error("[MP OAuth Callback] State no encontrado en DB.")
            return NextResponse.redirect(`${settingsUrl}?mp_error=invalid_state`)
        }

        if (oauthState.expiresAt < now) {
            console.error("[MP OAuth Callback] State expirado.")
            await prisma.mpOAuthState.delete({ where: { state: returnedState } })
            return NextResponse.redirect(`${settingsUrl}?mp_error=expired_state`)
        }

        const photographerId = oauthState.photographerId
        const codeVerifier = oauthState.codeVerifier

        // Limpiar el state (uso único)
        await prisma.mpOAuthState.delete({ where: { state: returnedState } })

        // Canjear code por tokens, enviando el codeVerifier PKCE
        let tokenData
        try {
            tokenData = await exchangeCodeForTokens(code, codeVerifier)
        } catch (err) {
            console.error("[MP OAuth Callback] Error canjeando code:", err.message)
            return NextResponse.redirect(`${settingsUrl}?mp_error=token_exchange`)
        }

        const {
            access_token,
            refresh_token,
            user_id,
            expires_in,
        } = tokenData

        if (!access_token) {
            console.error("[MP OAuth Callback] Respuesta sin access_token:", tokenData)
            return NextResponse.redirect(`${settingsUrl}?mp_error=no_token`)
        }

        // Calcular fecha de expiración
        const expiresAt = expires_in
            ? new Date(Date.now() + expires_in * 1000)
            : null

        // Guardar tokens encriptados en la DB
        await prisma.photographer.update({
            where: { id: photographerId },
            data: {
                mpAccessToken: encrypt(access_token),
                mpRefreshToken: refresh_token ? encrypt(refresh_token) : null,
                mpUserId: user_id ? String(user_id) : null,
                mpTokenExpiresAt: expiresAt,
            },
        })

        console.log(
            `[MP OAuth Callback] ✅ Tokens guardados para fotógrafo ${photographerId}, MP user_id: ${user_id}`
        )

        return NextResponse.redirect(`${settingsUrl}?mp_connected=1`)

    } catch (error) {
        console.error("[MP OAuth Callback] Error general:", error)
        return NextResponse.redirect(`${settingsUrl}?mp_error=internal`)
    }
}
