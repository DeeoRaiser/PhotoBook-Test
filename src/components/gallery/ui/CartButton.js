"use client"

/**
 * src/components/gallery/ui/CartButton.jsx
 * ─────────────────────────────────────────────────────────────
 * Botón flotante de carrito.
 * Solo se renderiza cuando layout.cartPosition === "fixed-bottom-right".
 * (Cuando está en "toolbar" lo renderiza GalleryToolbar directamente)
 * ─────────────────────────────────────────────────────────────
 */

export default function CartButton({ cartItems, onClick, position }) {
  if (position !== "fixed-bottom-right") return null

  const count = cartItems.length

  return (
    <button
      className="pb-cart-button"
      onClick={onClick}
      title="Ver carrito"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 18px",
        borderRadius: "100px",
        border: "1px solid var(--pb-color-btn-border)",
        background: "var(--pb-color-accent)",
        color: "var(--pb-color-accent-fg)",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)"
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)"
      }}
    >
      🛒
      {count > 0 && (
        <span style={{
          background: "var(--pb-color-accent-fg)",
          color: "var(--pb-color-accent)",
          borderRadius: "12px",
          padding: "1px 7px",
          fontSize: "12px",
          fontWeight: "800",
        }}>
          {count}
        </span>
      )}
    </button>
  )
}
