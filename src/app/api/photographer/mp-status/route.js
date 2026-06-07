import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/photographer/mp-status
// Diagnóstico: muestra el estado real de MP en la DB sin exponer el token.
// Solo accesible por el fotógrafo autenticado.
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const photographer = await prisma.photographer.findUnique({
        where: { id: session.user.id },
        select: {
            mpAccessToken: true,
            mpRefreshToken: true,
            mpUserId: true,
            mpTokenExpiresAt: true,
        },
    })

    if (!photographer) {
        return NextResponse.json({ error: "Fotógrafo no encontrado" }, { status: 404 })
    }

    // Verificar si la columna codeVerifier existe en MpOAuthState
    let pkceColumnExists = false
    try {
        await prisma.$queryRaw`SELECT "codeVerifier" FROM "MpOAuthState" LIMIT 1`
        pkceColumnExists = true
    } catch {
        pkceColumnExists = false
    }

    const now = new Date()
    const expiresAt = photographer.mpTokenExpiresAt
    const tokenExpired = expiresAt ? expiresAt < now : null
    const tokenExpiresIn = expiresAt
        ? Math.round((expiresAt - now) / 1000 / 60) + " minutos"
        : null

    return NextResponse.json({
        hasAccessToken: !!photographer.mpAccessToken,
        hasRefreshToken: !!photographer.mpRefreshToken,
        mpUserId: photographer.mpUserId || null,
        tokenExpired,
        tokenExpiresIn,
        tokenExpiresAt: expiresAt || null,
        pkceColumnExists,
        // Si falta la columna PKCE, el OAuth va a fallar
        canConnectMp: pkceColumnExists,
        diagnosis: !photographer.mpAccessToken
            ? "❌ Sin token — nunca conectó MP o el OAuth falló, si el problema persiste comunicate con soporte"
            : tokenExpired
            ? "⚠️ Token expirado — necesita reconectar"
            : "✅ Token activo",
    })
}
