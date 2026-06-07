"use client"

/**
 * src/components/gallery/ui/PhotoModal.jsx
 * ─────────────────────────────────────────────────────────────
 * Modal de zoom de foto con navegación prev/next y teclado.
 * Completamente independiente del theme — siempre igual.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect } from "react"


function protectedUrl(photoId, password = null) {
    const base = `/api/photos/protected/${photoId}`
    return password ? `${base}?pwd=${encodeURIComponent(password)}` : base
}

export default function PhotoModal({
  photo,
  onClose,
  onNext,
  onPrev,
  onAddToCart,
  onToggleFavorite,
  favorites,
  cartItems,
  gallery,
  galleryPassword,
}) {
  // Navegación por teclado
  useEffect(() => {
    if (!photo) return
    const handler = (e) => {
      if (e.key === "Escape")     onClose()
      if (e.key === "ArrowRight") onNext()
      if (e.key === "ArrowLeft")  onPrev()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [photo, onClose, onNext, onPrev])

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = photo ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [photo])

  if (!photo) return null

  const isFree    = !!gallery?.proPhotosAreFree
  const imgSrc    = isFree ? photo.bunnyUrl : protectedUrl(photo.id, galleryPassword)
  const isFavorite = favorites.has(photo.id)
  const inCart     = cartItems.some(i => (i.photoId ?? i.id) === photo.id)

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Contenedor principal — detiene propagación del click */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "95vw",
          maxHeight: "95dvh",
          gap: "12px",
        }}
      >
        {/* Imagen */}
        <img
          src={imgSrc}
          alt={photo.title ?? ""}
          style={{
            maxWidth: "95vw",
            maxHeight: "82dvh",
            objectFit: "contain",
            borderRadius: "8px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            display: "block",
          }}
        />

        {/* Barra de acciones debajo de la imagen */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
          borderRadius: "100px",
          padding: "8px 16px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {/* Precio */}
          <span style={{
            fontSize: "14px", fontWeight: "700",
            color: "rgba(255,255,255,0.7)",
          }}>
            ${Number(photo.price).toLocaleString("es-AR")}
          </span>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />

          {/* Favorito */}
          <ModalBtn
            onClick={() => onToggleFavorite(photo.id)}
            title={isFavorite ? "Quitar favorito" : "Guardar favorito"}
            active={isFavorite}
          >
            {isFavorite ? "★ Favorito" : "☆ Favorito"}
          </ModalBtn>

          {/* Agregar al carrito */}
          <ModalBtn
            onClick={() => onAddToCart(photo)}
            title={inCart ? "Ya está en el carrito" : "Agregar al carrito"}
            active={inCart}
            accent
          >
            {inCart ? "✓ En carrito" : "🛒 Agregar"}
          </ModalBtn>

          {/* Impresión — si la galería lo permite */}
          {gallery.printableEnabled && photo.printPrice && (
            <ModalBtn
              onClick={() => onAddToCart(photo, "print")}
              title="Agregar versión impresa"
            >
              🖨 ${Number(photo.printPrice).toLocaleString("es-AR")}
            </ModalBtn>
          )}
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: "16px", right: "16px",
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "white", fontSize: "18px",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ✕
      </button>

      {/* Prev */}
      <NavBtn side="left" onClick={e => { e.stopPropagation(); onPrev() }}>‹</NavBtn>

      {/* Next */}
      <NavBtn side="right" onClick={e => { e.stopPropagation(); onNext() }}>›</NavBtn>
    </div>
  )
}

function ModalBtn({ onClick, title, active, accent, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "6px 12px",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: accent && active
          ? "var(--pb-color-accent)"
          : active
          ? "rgba(255,255,255,0.15)"
          : "transparent",
        color: accent && active
          ? "var(--pb-color-accent-fg)"
          : "rgba(255,255,255,0.8)",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  )
}

function NavBtn({ side, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        top: "50%",
        [side]: "12px",
        transform: "translateY(-50%)",
        width: 44, height: 44,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "white",
        fontSize: "24px",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
    >
      {children}
    </button>
  )
}
