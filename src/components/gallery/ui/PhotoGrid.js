"use client"

/**
 * src/components/gallery/ui/PhotoGrid.js
 * Renderiza las fotos según layout.gridStyle y layout.photoAspect.
 * Pasa gallery a PhotoCard para que tenga acceso a pricingTiers, printSizes, etc.
 */

import PhotoCard from "./PhotoCard"

export default function PhotoGrid({ photos, layout, favorites, cartItems, actions, gallery, galleryPassword }) {
    if (!photos?.length) {
        return (
            <div style={{
                textAlign: "center", padding: "60px 20px",
                color: "var(--pb-color-text-muted)", fontSize: "14px",
            }}>
                No hay fotos para mostrar.
            </div>
        )
    }

    const cardProps = (photo) => ({
        photo,
        layout,
        gallery,
        galleryPassword,
        isFavorite: favorites.has(photo.id),
        inCart: cartItems.some(i => i.photoId === photo.id || i.id === photo.id),
        actions,
    })

    // ── Grid uniforme ──────────────────────────────────────────
    if (layout.gridStyle === "grid") {
        return (
            <div className="pb-photo-grid" style={{
                display: "grid",
                gridTemplateColumns: "var(--pb-photo-columns)",
                gap: "var(--pb-photo-gap)",
            }}>
                {photos.map(photo => (
                    <PhotoCard key={photo.id} {...cardProps(photo)} />
                ))}
            </div>
        )
    }

    // ── Masonry con CSS columns ────────────────────────────────
    if (layout.gridStyle === "masonry") {
        return (
            <div className="pb-photo-grid" style={{
                columns: "var(--pb-photo-columns)",
                gap: "var(--pb-photo-gap)",
            }}>
                {photos.map(photo => (
                    <div
                        key={photo.id}
                        style={{
                            breakInside: "avoid",
                            marginBottom: "var(--pb-photo-gap)",
                            display: "block",
                        }}
                    >
                        <PhotoCard {...cardProps(photo)} layout={{ ...layout, photoAspect: "free" }} />
                    </div>
                ))}
            </div>
        )
    }

    // ── Slideshow: una foto a la vez ───────────────────────────
    if (layout.gridStyle === "slideshow") {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>
                {photos[0] && (
                    <div
                        onClick={() => actions.onZoom(photos[0])}
                        style={{
                            width: "100%", maxWidth: "720px",
                            aspectRatio: "4/3",
                            borderRadius: "var(--pb-photo-radius)",
                            overflow: "hidden", cursor: "zoom-in",
                            background: "var(--pb-color-surface)",
                        }}
                    >
                        <img
                            src={photos[0].bunnyUrl}
                            alt={photos[0].title ?? ""}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    </div>
                )}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                    {photos.map(photo => (
                        <div
                            key={photo.id}
                            onClick={() => actions.onZoom(photo)}
                            style={{
                                width: 72, height: 54, borderRadius: "6px",
                                overflow: "hidden", cursor: "pointer",
                                border: "2px solid transparent",
                                transition: "border-color 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--pb-color-accent)"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
                        >
                            <img
                                src={photo.bunnyUrl}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return null
}
