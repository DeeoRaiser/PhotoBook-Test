import { MercadoPagoConfig, Preference, Payment } from "mercadopago"

// ── Cliente de plataforma (para suscripciones y galerías extra) ──────────────
const platformClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
})

export const preferenceClient = new Preference(platformClient)
export const paymentClient = new Payment(platformClient)

// ── OAuth helpers ─────────────────────────────────────────────────────────────

const MP_OAUTH_URL = "https://auth.mercadopago.com.ar/authorization"
const MP_TOKEN_URL = "https://api.mercadopago.com/oauth/token"

// Elimina barra final para evitar doble // en redirect_uri
const BASE_URL = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "")

/**
 * Construye la URL de autorización OAuth a la que se redirige al fotógrafo.
 * state: string opaco que se valida en el callback para prevenir CSRF.
 * codeChallenge: hash SHA-256 del code_verifier (PKCE requerido por MP).
 */
export function buildAuthUrl(state, codeChallenge) {
    const params = new URLSearchParams({
        client_id: process.env.MP_CLIENT_ID,
        response_type: "code",
        platform_id: "mp",
        state,
        redirect_uri: `${BASE_URL}/api/auth/mercadopago/callback`,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    })
    return `${MP_OAUTH_URL}?${params.toString()}`
}

/**
 * Canjea un authorization code por access_token + refresh_token.
 * codeVerifier: el valor original PKCE (se guardó en DB al iniciar el flujo).
 * Devuelve el objeto completo de la respuesta de MP.
 */
export async function exchangeCodeForTokens(code, codeVerifier) {
    const body = {
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${BASE_URL}/api/auth/mercadopago/callback`,
    }
    if (codeVerifier) body.code_verifier = codeVerifier

    const res = await fetch(MP_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `MP OAuth error ${res.status}`)
    }

    return res.json()
    // Respuesta incluye: access_token, token_type, expires_in,
    // scope, user_id, refresh_token, public_key, live_mode
}

/**
 * Refresca un access_token expirado usando el refresh_token.
 */
export async function refreshAccessToken(refreshToken) {
    const res = await fetch(MP_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: process.env.MP_CLIENT_ID,
            client_secret: process.env.MP_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `MP refresh error ${res.status}`)
    }

    return res.json()
}

/**
 * Devuelve un cliente MP con el access_token del fotógrafo.
 * Útil para crear preferencias en nombre del fotógrafo.
 */
export function buildPhotographerClient(accessToken) {
    return new MercadoPagoConfig({ accessToken })
}

/**
 * Obtiene el access_token activo de un fotógrafo.
 * Si el token está por vencer (menos de 1 hora), lo refresca automáticamente
 * y persiste el nuevo token en la DB.
 *
 * Lanza error si el fotógrafo no tiene token o si el refresh falla.
 */
export async function getPhotographerMpToken(photographerId) {
    // Import dinámico para evitar dependencia circular con prisma en este lib
    const { prisma } = await import("@/lib/prisma")
    const { decrypt, encrypt } = await import("@/lib/crypto")

    const photographer = await prisma.photographer.findUnique({
        where: { id: photographerId },
        select: {
            mpAccessToken: true,
            mpRefreshToken: true,
            mpTokenExpiresAt: true,
        },
    })

    if (!photographer?.mpAccessToken) {
        throw new Error(`Fotógrafo ${photographerId} no tiene cuenta de MP conectada.`)
    }

    const expiresAt = photographer.mpTokenExpiresAt
    const needsRefresh = expiresAt && expiresAt < new Date(Date.now() + 60 * 60 * 1000) // menos de 1h

    // Token vigente — devolver directamente
    if (!needsRefresh) {
        return decrypt(photographer.mpAccessToken)
    }

    // Token vencido o próximo a vencer — intentar refresh
    if (!photographer.mpRefreshToken) {
        // Sin refresh token: devolver el actual y esperar que aún funcione
        console.warn(`[MP Token] Fotógrafo ${photographerId} sin refresh_token, usando token actual.`)
        return decrypt(photographer.mpAccessToken)
    }

    console.log(`[MP Token] Refrescando token para fotógrafo ${photographerId}...`)

    const tokenData = await refreshAccessToken(decrypt(photographer.mpRefreshToken))

    const newExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

    await prisma.photographer.update({
        where: { id: photographerId },
        data: {
            mpAccessToken: encrypt(tokenData.access_token),
            mpRefreshToken: tokenData.refresh_token
                ? encrypt(tokenData.refresh_token)
                : photographer.mpRefreshToken,
            mpTokenExpiresAt: newExpiresAt,
        },
    })

    console.log(`[MP Token] ✅ Token refrescado para fotógrafo ${photographerId}`)
    return tokenData.access_token
}
