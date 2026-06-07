// src/components/gallery-themes/ThemeRenderer.js
// Renderiza un theme HTML en un iframe, inyectando window.GALLERY_DATA
// y también reemplazando placeholders {{key}} en el HTML estático.
//
// GALLERY_DATA expone:
//   gallery         → objeto completo (sin password)
//   photos          → array de fotos (filtered, igual que displayedPhotos)
//   showFavoritesOnly
//   favorites       → array de IDs de favoritos
//   galleryPassword
//
// El HTML del theme puede:
//   a) usar placeholders estáticos:  {{gallery.title}}, {{gallery.photographerName}}
//   b) acceder a window.GALLERY_DATA desde <script> para lógica dinámica
//   c) disparar eventos al padre con window.parent.postMessage({ type, payload })
//      Tipos soportados: "zoom", "faceSearch", "toggleFavorites", "addToCart"

"use client"

import { useEffect, useRef, useCallback } from "react"

// Reemplaza placeholders simples {{key.subkey}} con valores del objeto data
function applyPlaceholders(html, data, prefix = "") {
    let result = html
    for (const [key, value] of Object.entries(data)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            result = applyPlaceholders(result, value, fullKey)
        } else {
            const safeValue = value === null || value === undefined ? "" : String(value)
            result = result.replaceAll(`{{${fullKey}}}`, safeValue)
        }
    }
    return result
}

// Construye el HTML final combinando placeholders + inyección de GALLERY_DATA
function buildIframeHTML(htmlTemplate, galleryData) {
    // 1. Reemplazar placeholders simples
    let html = applyPlaceholders(htmlTemplate, {
        gallery: galleryData.gallery,
        photoCount: galleryData.photos?.length ?? 0,
    })

    // 2. Inyectar script con window.GALLERY_DATA antes de </head> o al inicio
    const injectionScript = `
<script>
window.GALLERY_DATA = ${JSON.stringify(galleryData)};

// Helper: despachar acción al componente React padre
window.galleryAction = function(type, payload) {
    window.parent.postMessage({ source: 'gallery-theme', type, payload }, '*');
};
</script>`

    if (html.includes("</head>")) {
        html = html.replace("</head>", `${injectionScript}</head>`)
    } else {
        html = injectionScript + html
    }

    return html
}

export default function ThemeRenderer({
    theme,                   // { htmlTemplate, ... }
    gallery,
    displayedPhotos,
    showFavoritesOnly,
    setShowFavoritesOnly,
    favorites,
    onZoom,
    onFaceSearch,
    onAddToCart,
    onOpenCart,
    galleryPassword,
    style = {},
}) {
    const iframeRef = useRef(null)

    const galleryData = {
        gallery,
        photos: displayedPhotos,
        showFavoritesOnly,
        favorites: favorites.map(f => f.id),
        galleryPassword,
    }

    // Escuchar mensajes del iframe
    const handleMessage = useCallback((event) => {
        if (!event.data || event.data.source !== "gallery-theme") return
        const { type, payload } = event.data

        switch (type) {
            case "zoom":
                if (payload?.photoId) {
                    const photo = gallery.photos?.find(p => p.id === payload.photoId)
                    if (photo) onZoom?.(photo)
                }
                break
            case "addToCart":
                if (payload?.photoId) {
                    const photo = gallery.photos?.find(p => p.id === payload.photoId)
                    if (photo) onAddToCart?.(photo, payload.type ?? "digital")
                }
                break
            case "openCart":
                onOpenCart?.()
                break
            case "faceSearch":
                onFaceSearch?.()
                break
            case "toggleFavorites":
                setShowFavoritesOnly?.(v => !v)
                break
            case "ready":
                // El theme avisó que cargó — podemos enviarle actualizaciones
                break
        }
    }, [gallery, onZoom, onFaceSearch, onAddToCart, onOpenCart, setShowFavoritesOnly])

    useEffect(() => {
        window.addEventListener("message", handleMessage)
        return () => window.removeEventListener("message", handleMessage)
    }, [handleMessage])

    // Cuando cambian los datos (favoritos, filtro), actualizar el iframe via postMessage
    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe?.contentWindow) return

        iframe.contentWindow.postMessage({
            source: "gallery-host",
            type: "dataUpdate",
            payload: {
                photos: displayedPhotos,
                showFavoritesOnly,
                favorites: favorites.map(f => f.id),
            },
        }, "*")
    }, [displayedPhotos, showFavoritesOnly, favorites])

    const srcDoc = buildIframeHTML(theme.htmlTemplate, galleryData)

    return (
        <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            style={{
                width: "100%",
                minHeight: "100dvh",
                border: "none",
                display: "block",
                ...style,
            }}
            title={`Galería: ${gallery.title}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
    )
}