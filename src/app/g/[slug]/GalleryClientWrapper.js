// src/app/g/[slug]/GalleryClientWrapper.js
// Wrapper client-side que gestiona favoritos, zoom, carrito y face search,
// y delega el renderizado al ThemeRenderer (iframe con HTML del theme).

"use client"

import { useState, useCallback, useEffect } from "react"
import ThemeRenderer from "@/components/gallery-themes/ThemeRenderer"
import { useCart } from "@/components/gallery/logic/useCart"
import CartDrawer from "@/components/gallery/ui/CartDrawer"

const FAVORITES_KEY = (galleryId) => `pb_favs_${galleryId}`

// ── Modal de selección print/digital ──────────────────────────────────────────
function AddToCartModal({ photo, gallery, onAdd, onClose }) {
    if (!photo) return null

    const hasPrint   = gallery.printableEnabled && photo.printPrice != null
    const hasDigital = photo.price != null

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 10000,
                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "16px",
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: "16px",
                    padding: "28px 24px", maxWidth: "360px", width: "100%",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                    display: "flex", flexDirection: "column", gap: "16px",
                }}
            >
                {/* Thumbnail */}
                {photo.bunnyUrl && (
                    <img
                        src={photo.bunnyUrl}
                        alt={photo.title ?? ""}
                        style={{
                            width: "100%", height: "160px",
                            objectFit: "cover", borderRadius: "10px",
                        }}
                    />
                )}

                <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111" }}>
                        {photo.title || "Agregar al carrito"}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>
                        Seleccioná el tipo de producto
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {hasDigital && (
                        <button
                            onClick={() => { onAdd(photo, "digital"); onClose() }}
                            style={{
                                padding: "12px 16px", borderRadius: "10px",
                                border: "2px solid #111", background: "#111",
                                color: "#fff", fontWeight: 700, fontSize: "14px",
                                cursor: "pointer", textAlign: "left",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}
                        >
                            <span>🖼 Foto digital</span>
                            <span>${Number(photo.price).toLocaleString("es-AR")}</span>
                        </button>
                    )}
                    {hasPrint && (
                        <button
                            onClick={() => { onAdd(photo, "print"); onClose() }}
                            style={{
                                padding: "12px 16px", borderRadius: "10px",
                                border: "2px solid #2563eb", background: "#2563eb",
                                color: "#fff", fontWeight: 700, fontSize: "14px",
                                cursor: "pointer", textAlign: "left",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}
                        >
                            <span>🖨 Impresión física</span>
                            <span>${Number(photo.printPrice).toLocaleString("es-AR")}</span>
                        </button>
                    )}
                    {!hasDigital && !hasPrint && (
                        <p style={{ color: "#888", fontSize: "13px", textAlign: "center" }}>
                            Esta foto no tiene precio configurado.
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        padding: "10px", borderRadius: "8px",
                        border: "1px solid #e5e7eb", background: "transparent",
                        color: "#666", fontSize: "13px", cursor: "pointer",
                    }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function GalleryClientWrapper({ gallery, theme, galleryPassword }) {
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
    const [favorites, setFavorites] = useState([])
    const [zoomedPhoto, setZoomedPhoto] = useState(null)
    const [showFaceSearch, setShowFaceSearch] = useState(false)

    // Carrito
    const {
        cartItems,
        addToCart,
        removeFromCart,
        cartOpen,
        openCart,
        closeCart,
        cartTotal,
    } = useCart(gallery.id)

    // Modal de selección de tipo (print / digital)
    const [cartModalPhoto, setCartModalPhoto] = useState(null)

    // Cargar favoritos desde localStorage
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY(gallery.id)) || "[]")
            setFavorites(stored)
        } catch {
            setFavorites([])
        }
    }, [gallery.id])

    // Persistir favoritos
    useEffect(() => {
        try {
            localStorage.setItem(FAVORITES_KEY(gallery.id), JSON.stringify(favorites))
        } catch { }
    }, [favorites, gallery.id])

    const toggleFavorite = useCallback((photoId) => {
        setFavorites(prev => {
            const exists = prev.some(f => f.id === photoId)
            return exists
                ? prev.filter(f => f.id !== photoId)
                : [...prev, { id: photoId }]
        })
    }, [])

    // Fotos filtradas según favoritos
    const displayedPhotos = showFavoritesOnly
        ? gallery.photos.filter(p => favorites.some(f => f.id === p.id))
        : gallery.photos

    const handleZoom = useCallback((photo) => {
        setZoomedPhoto(photo)
    }, [])

    const handleFaceSearch = useCallback(() => {
        setShowFaceSearch(true)
    }, [])

    // Cuando el theme dispara addToCart: si la galería tiene impresiones,
    // mostrar modal de selección; si solo tiene digital, agregar directo.
    const handleAddToCart = useCallback((photo, type) => {
        const hasPrint   = gallery.printableEnabled && photo.printPrice != null
        const hasDigital = photo.price != null

        if (type === "print" || type === "digital") {
            // El theme ya especificó el tipo — agregar directo
            addToCart(photo, type)
        } else if (hasPrint && hasDigital) {
            // Ambas opciones disponibles → mostrar modal
            setCartModalPhoto(photo)
        } else if (hasPrint) {
            addToCart(photo, "print")
        } else {
            addToCart(photo, "digital")
        }
    }, [gallery.printableEnabled, addToCart])

    if (!theme) {
        return (
            <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "system-ui" }}>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>No hay un theme configurado para esta galería.</p>
            </div>
        )
    }

    return (
        <>
            <ThemeRenderer
                theme={theme}
                gallery={gallery}
                displayedPhotos={displayedPhotos}
                showFavoritesOnly={showFavoritesOnly}
                setShowFavoritesOnly={setShowFavoritesOnly}
                favorites={favorites}
                onZoom={handleZoom}
                onFaceSearch={handleFaceSearch}
                onAddToCart={handleAddToCart}
                onOpenCart={openCart}
                galleryPassword={galleryPassword}
            />

            {/* Modal de selección print/digital */}
            <AddToCartModal
                photo={cartModalPhoto}
                gallery={gallery}
                onAdd={addToCart}
                onClose={() => setCartModalPhoto(null)}
            />

            {/* Carrito */}
            <CartDrawer
                open={cartOpen}
                onClose={closeCart}
                items={cartItems}
                onRemove={removeFromCart}
                total={cartTotal}
                gallery={gallery}
            />

            {/* Zoom modal — fuera del iframe, en el host React */}
            {zoomedPhoto && (
                <div
                    onClick={() => setZoomedPhoto(null)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "zoom-out",
                    }}
                >
                    <img
                        src={zoomedPhoto.bunnyUrl}
                        alt={zoomedPhoto.title || ""}
                        style={{
                            maxWidth: "95vw", maxHeight: "92vh",
                            objectFit: "contain", borderRadius: 8,
                            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setZoomedPhoto(null)}
                        style={{
                            position: "fixed", top: 20, right: 20,
                            width: 40, height: 40, borderRadius: "50%",
                            background: "rgba(255,255,255,0.12)", border: "none",
                            cursor: "pointer", color: "white", fontSize: 20,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </>
    )
}