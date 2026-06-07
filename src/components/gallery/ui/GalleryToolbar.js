"use client"

/**
 * src/components/gallery/ui/GalleryToolbar.jsx
 * ─────────────────────────────────────────────────────────────
 * Barra de herramientas: contador de fotos, favoritos, búsqueda facial,
 * y opcionalmente el botón de carrito.
 *
 * Se posiciona según layout.toolbarPosition:
 *   "sticky-top"          → pegada al top al hacer scroll
 *   "fixed-bottom-center" → flotante abajo al centro (Magazine)
 *   "fixed-bottom-right"  → flotante abajo derecha
 *   "none"                → no se renderiza (lo maneja GalleryShell)
 *
 * showTitle → prop opcional para MinimalTopLayout
 * ─────────────────────────────────────────────────────────────
 */

import { Search, Star } from "lucide-react"

const POSITION_STYLES = {
  "sticky-top": {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    borderBottom: "var(--pb-toolbar-border, 1px solid var(--pb-color-toolbar-border))",
    borderRadius: 0,
    margin: 0,
  },
  "fixed-bottom-center": {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 30,
    borderRadius: "100px",
    border: "1px solid var(--pb-color-toolbar-border)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    width: "auto",
    minWidth: "min(300px, calc(100vw - 32px))",
    maxWidth: "calc(100vw - 32px)",
  },
  "fixed-bottom-right": {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 30,
    borderRadius: "16px",
    border: "1px solid var(--pb-color-toolbar-border)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    width: "auto",
  },
}

export default function GalleryToolbar({
  gallery,
  layout,
  photos,
  totalPhotos,
  showFavoritesOnly,
  favoritesCount,
  actions,
  cartItems,
  showTitle = false,
}) {
  const posStyle = POSITION_STYLES[layout.toolbarPosition] ?? POSITION_STYLES["sticky-top"]
  const isFloating = layout.toolbarPosition !== "sticky-top"

  return (
    <div className="pb-toolbar" style={{
      background: "var(--pb-color-toolbar-bg)",
      backdropFilter: `blur(var(--pb-toolbar-blur))`,
      color: "var(--pb-color-toolbar-text)",
      ...posStyle,
    }}>
      <div style={{
        maxWidth: isFloating ? "none" : "var(--pb-content-max-width)",
        margin: "0 auto",
        padding: isFloating ? "10px 16px" : "0 16px",
        height: isFloating ? "auto" : "var(--pb-toolbar-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        flexWrap: "wrap",
      }}>

        {/* Izquierda: título (solo si showTitle) o contador */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          {showTitle && (
            <span style={{
              fontSize: "14px", fontWeight: "800",
              color: "var(--pb-color-text)",
              letterSpacing: "var(--pb-letter-spacing-title)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: "200px",
            }}>
              {gallery.title}
            </span>
          )}
          <span style={{ fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
            {showFavoritesOnly
              ? `${photos.length} favorito${photos.length !== 1 ? "s" : ""}`
              : `${totalPhotos} foto${totalPhotos !== 1 ? "s" : ""}`
            }
          </span>
        </div>

        {/* Derecha: acciones */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>

          {/* Toggle favoritos */}
          <ToolbarBtn
            onClick={actions.onToggleFavFilter}
            active={showFavoritesOnly}
            title="Ver favoritos"
          >
            {favoritesCount > 0 ? `★ ${favoritesCount}` : "☆"}
          </ToolbarBtn>

          {/* Búsqueda facial */}
          <ToolbarBtn onClick={actions.onFaceSearch} title="Buscarme en las fotos">
            <Search/>
          </ToolbarBtn>

          {/* Carrito — solo si layout.cartPosition === "toolbar" */}
          {layout.cartPosition === "toolbar" && (
            <ToolbarBtn
              onClick={actions.onOpenCart}
              title="Ver carrito"
              active={cartItems.length > 0}
            >
              🛒 {cartItems.length > 0 && (
                <span style={{
                  background: "var(--pb-color-accent)",
                  color: "var(--pb-color-accent-fg)",
                  borderRadius: "10px",
                  padding: "0 5px",
                  fontSize: "10px",
                  fontWeight: "800",
                  marginLeft: "2px",
                }}>
                  {cartItems.length}
                </span>
              )}
            </ToolbarBtn>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      className="pb-toolbar-btn"
      onClick={onClick}
      title={title}
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        padding: "var(--pb-btn-padding-y) var(--pb-btn-padding-x)",
        borderRadius: "var(--pb-btn-radius)",
        border: `1px solid var(--pb-color-btn-border)`,
        background: active ? "var(--pb-color-accent)" : "var(--pb-color-btn-bg)",
        color: active ? "var(--pb-color-accent-fg)" : "var(--pb-color-btn-text)",
        fontSize: "var(--pb-btn-font-size)",
        fontWeight: "var(--pb-btn-font-weight)",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  )
}
