import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "mihost.com.ar"

function extractSlug(hostname) {
    // Producción: "juan.mihost.com.ar" → "juan"
    if (hostname.endsWith(`.${ROOT_DOMAIN}`) && !hostname.startsWith("www.")) {
        return hostname.replace(`.${ROOT_DOMAIN}`, "")
    }

    // Local: "juan.localhost" o "juan.localhost:3000" → "juan"
    const localhostMatch = hostname.match(/^([^.]+)\.localhost(:\d+)?$/)
    if (localhostMatch) {
        return localhostMatch[1]
    }

    return null
}

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { pathname } = req.nextUrl
    const hostname = req.headers.get("host") || ""

    const slug = extractSlug(hostname)

    if (slug) {
        // Archivos estáticos, API y assets pasan sin tocar
        if (
            pathname.startsWith("/_next") ||
            pathname.startsWith("/api") ||
            pathname.startsWith("/favicon")
        ) {
            return NextResponse.next()
        }

        const url = req.nextUrl.clone()

        // [slug].photobook.com.ar/linktree → /l/[slug]
        if (pathname === "/linktree") {
            url.pathname = `/l/${slug}`
            return NextResponse.rewrite(url)
        }

        // Todo lo demás → /p/[slug]/...  (portfolio público)
        url.pathname = `/p/${slug}${pathname === "/" ? "" : pathname}`
        return NextResponse.rewrite(url)
    }

    // Proteger /dashboard
    if (pathname.startsWith("/dashboard") && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}