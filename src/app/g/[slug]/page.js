// src/app/g/[slug]/page.js
// Server Component — carga galería + theme desde filesystem

import { notFound } from "next/navigation"
import { prisma }   from "@/lib/prisma"
import { loadTheme }  from "@/themes/registry.js"
import { mergeTheme } from "@/themes/schema.js"
import ThemeProvider  from "@/themes/ThemeProvider.js"
import GalleryShell      from "./GalleryShell.js"
import EventCountdown    from "./EventCountdown.js"
import EventGalleryView  from "@/components/event-gallery-view.js"

export async function generateMetadata({ params }) {
    const { slug } = await params
    const gallery = await prisma.gallery.findUnique({
        where: { slug },
        select: { title: true, description: true, coverImage: true },
    })
    if (!gallery) return {}
    return {
        title: gallery.title,
        description: gallery.description ?? undefined,
        openGraph: { images: gallery.coverImage ? [gallery.coverImage] : [] },
    }
}

// Convierte todos los campos Decimal de un objeto a Number.
// Next.js no puede serializar objetos Decimal al pasar props
// de Server Components a Client Components.
function serializeDecimals(obj) {
    if (obj === null || obj === undefined) return obj

    if (
        typeof obj === "object" &&
        obj?.constructor?.name?.includes("Decimal")
    ) {
        return Number(obj)
    }

    if (Array.isArray(obj)) {
        return obj.map(serializeDecimals)
    }

    if (typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [
                k,
                serializeDecimals(v),
            ])
        )
    }

    return obj
}
export default async function GalleryPage({ params, searchParams }) {
    const { slug } = await params

    // ── Cargar galería ────────────────────────────────────────
    const gallery = await prisma.gallery.findUnique({
        where: { slug },
        include: {
            photos:       { orderBy: { createdAt: "asc" } },
            pricingTiers: { orderBy: { minQty: "asc" } },
            printSizes: {
                orderBy: { sortOrder: "asc" },
                include: { tiers: { orderBy: { minQty: "asc" } } },
            },
            photographer: {
                select: {
                    id: true, name: true, avatar: true, portfolioAvatarUrl: true,
                    portfolioSlug: true, portfolioEnabled: true,
                    mpAccessToken: true,
                    transferAlias: true,
                    transferCbu: true,
                },
            },
        },
    })

    if (!gallery) notFound()

    // ── Galería expirada ──────────────────────────────────────
    if (gallery.expiresAt && new Date(gallery.expiresAt) < new Date()) {
        return <ExpiredScreen />
    }

    // ── Cuenta regresiva: el evento todavía no comenzó ────────
    if (gallery.galleryType === "event" && gallery.eventStartsAt && new Date(gallery.eventStartsAt) > new Date()) {
        return (
            <EventCountdown
                title={gallery.title}
                description={gallery.description}
                coverImage={gallery.coverImage}
                eventStartsAt={gallery.eventStartsAt.toISOString()}
                photographerName={gallery.photographer?.name ?? ""}
                photographerAvatar={gallery.photographer?.portfolioAvatarUrl ?? gallery.photographer?.avatar ?? null}
            />
        )
    }

    const needsPassword = !gallery.isPublic && !!gallery.password

    // ── Cargar theme desde filesystem ─────────────────────────
    const themeSlug       = gallery.themeSlug ?? "classic"
    const tokenOverrides  = gallery.tokenOverrides ?? {}
    const themeDefinition = await loadTheme(themeSlug)
    const theme           = mergeTheme(themeDefinition, tokenOverrides)

    // ── Serializar — quitar password + convertir Decimal → Number ──
    // Next.js lanza error si pasan objetos Decimal a client components.
    const { password: _pw, photographer: _ph, ...rest } = gallery

    const safeGallery = serializeDecimals({
        ...rest,
        hasPassword:          needsPassword,
        photographerName:     gallery.photographer?.name    ?? "",
        photographerAvatar:   gallery.photographer?.portfolioAvatarUrl ?? gallery.photographer?.avatar ?? null,
        photographerSlug:     gallery.photographer?.portfolioEnabled
                                ? gallery.photographer?.portfolioSlug
                                : null,
        // Métodos de pago: el token no se expone al cliente, solo un booleano
        hasMpToken:           !!(gallery.photographer?.mpAccessToken),
        transferAlias:        gallery.photographer?.transferAlias ?? null,
        transferCbu:          gallery.photographer?.transferCbu   ?? null,
    })

    // ── Galería de evento ─────────────────────────────────────
    // EventGalleryView tiene su propia estructura: tabs community/pro,
    // checkin, upload de invitados, likes, face search, etc.
    // Es completamente distinta a GalleryShell (galería estándar).
    if (safeGallery.galleryType === "event") {
        return (
            <ThemeProvider theme={theme}>
                <EventGalleryView
                    gallery={safeGallery}
                    slug={slug}
                    galleryPassword={needsPassword ? gallery.password : null}
                />
            </ThemeProvider>
        )
    }

    // ── Galería estándar ──────────────────────────────────────
    return (
        <ThemeProvider theme={theme}>
            <GalleryShell
                gallery={safeGallery}
                theme={theme}
                galleryPassword={needsPassword ? gallery.password : null}
            />
        </ThemeProvider>
    )
}

function ExpiredScreen() {
    return (
        <div style={{
            minHeight: "100dvh", display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "#f8fafc", fontFamily: "system-ui",
        }}>
            <div style={{ textAlign: "center", padding: 32 }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                    Galería expirada
                </p>
                <p style={{ fontSize: 14, color: "#64748b" }}>
                    Esta galería ya no está disponible.
                </p>
            </div>
        </div>
    )
}