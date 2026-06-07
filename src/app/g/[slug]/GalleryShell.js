"use client"

/**
 * src/app/g/[slug]/GalleryShell.jsx
 * ─────────────────────────────────────────────────────────────
 * Client Component. Único en toda la app.
 *
 * Responsabilidades:
 *   1. Montar todos los hooks de lógica (favoritos, zoom, carrito, etc.)
 *   2. Leer theme.layout y decidir la estructura HTML
 *   3. Pasar los datos y acciones a los bloques UI
 *
 * El theme NO renderiza nada — GalleryShell lo hace todo.
 * El theme solo declara QUÉ configuración de layout quiere.
 *
 * Props:
 *   gallery  → objeto completo de la galería (sin password)
 *   theme    → resultado de mergeTheme() — { tokens, layout, slug, name }
 * ─────────────────────────────────────────────────────────────
 */

import { useMemo } from "react"
import { useFavorites }   from "@/components/gallery/logic/useFavorites"
import { usePhotoZoom }   from "@/components/gallery/logic/usePhotoZoom"
import { useCart }        from "@/components/gallery/logic/useCart"
import { useFaceSearch }  from "@/components/gallery/logic/useFaceSearch"

import GalleryHero        from "@/components/gallery/ui/GalleryHero"
import GalleryToolbar     from "@/components/gallery/ui/GalleryToolbar"
import PhotoGrid          from "@/components/gallery/ui/PhotoGrid"
import PhotoModal         from "@/components/gallery/ui/PhotoModal"
import CartDrawer         from "@/components/gallery/ui/CartDrawer"
import FaceSearchModal    from "@/components/gallery/ui/FaceSearchModal"
import CartButton         from "@/components/gallery/ui/CartButton"

export default function GalleryShell({ gallery, theme, galleryPassword }) {
  const { layout } = theme

  // ── Hooks de lógica ────────────────────────────────────────
  // Siempre se montan todos, independientemente del theme.
  // El theme no puede afectar qué lógica existe.

  const {
    favorites,
    toggleFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
  } = useFavorites(gallery.id)

  const {
    zoomedPhoto,
    openZoom,
    closeZoom,
    goNext,
    goPrev,
  } = usePhotoZoom(gallery.photos)

  const {
    cartItems,
    addToCart,
    removeFromCart,
    cartOpen,
    openCart,
    closeCart,
    cartTotal,
  } = useCart(gallery.id)

  const {
    faceSearchOpen,
    openFaceSearch,
    closeFaceSearch,
    faceSearchResults,
    searchByFace,
    faceSearchLoading,
  } = useFaceSearch(gallery.id)

  // ── Fotos filtradas ─────────────────────────────────────────
  const displayedPhotos = useMemo(() => {
    if (!showFavoritesOnly) return gallery.photos
    return gallery.photos.filter(p => favorites.has(p.id))
  }, [gallery.photos, showFavoritesOnly, favorites])

  // ── Objeto de acciones (pasado a todos los bloques UI) ──────
  // Un único objeto evita prop drilling y facilita agregar acciones nuevas.
  const actions = {
    onZoom:            openZoom,
    onAddToCart:       addToCart,
    onRemoveFromCart:  removeFromCart,
    onOpenCart:        openCart,
    onToggleFavorite:  toggleFavorite,
    onFaceSearch:      openFaceSearch,
    onToggleFavFilter: () => setShowFavoritesOnly(v => !v),
  }

  // ── Props comunes para todos los bloques UI ─────────────────
  const gridProps = {
    photos:           displayedPhotos,
    layout,
    favorites,
    cartItems,
    actions,
    gallery,
    galleryPassword,
  }

  const heroProps = {
    gallery,
    layout,
    actions,
    cartItems,
  }

  const toolbarProps = {
    gallery,
    layout,
    photos:           displayedPhotos,
    totalPhotos:      gallery.photos.length,
    showFavoritesOnly,
    favoritesCount:   favorites.size,
    actions,
    cartItems,
  }

  // ── Render según layout.heroStyle ──────────────────────────
  // Cada rama arma una estructura HTML distinta.
  // Los componentes son siempre los mismos — cambia dónde van.

  return (
    <>
      {/* ── LAYOUT: Cinematic — portada como fondo fijo ── */}
      {layout.heroStyle === "fullscreen-bg" && (
        <FullscreenBgLayout
          gallery={gallery}
          layout={layout}
          heroProps={heroProps}
          toolbarProps={toolbarProps}
          gridProps={gridProps}
          actions={actions}
          cartItems={cartItems}
        />
      )}

      {/* ── LAYOUT: Classic / Magazine / Light — hero arriba ── */}
      {(layout.heroStyle === "dark-top" || layout.heroStyle === "light-top") && (
        <HeroTopLayout
          layout={layout}
          heroProps={heroProps}
          toolbarProps={toolbarProps}
          gridProps={gridProps}
          actions={actions}
          cartItems={cartItems}
        />
      )}

      {/* ── LAYOUT: Minimal — solo título, sin imagen de portada ── */}
      {layout.heroStyle === "minimal-top" && (
        <MinimalTopLayout
          layout={layout}
          heroProps={heroProps}
          toolbarProps={toolbarProps}
          gridProps={gridProps}
          actions={actions}
          cartItems={cartItems}
        />
      )}

      {/* ── LAYOUT: None — sin hero, directo a las fotos ── */}
      {layout.heroStyle === "none" && (
        <NoHeroLayout
          layout={layout}
          toolbarProps={toolbarProps}
          gridProps={gridProps}
          actions={actions}
          cartItems={cartItems}
        />
      )}

      {/* ── Modales — siempre presentes, fuera del layout ── */}
      {/* No dependen del theme — siempre se renderizan igual  */}
      <PhotoModal
        photo={zoomedPhoto}
        onClose={closeZoom}
        onNext={goNext}
        onPrev={goPrev}
        onAddToCart={addToCart}
        onToggleFavorite={toggleFavorite}
        favorites={favorites}
        cartItems={cartItems}
        gallery={gallery}
        galleryPassword={galleryPassword}
      />

      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        items={cartItems}
        onRemove={removeFromCart}
        total={cartTotal}
        gallery={gallery}
      />

      <FaceSearchModal
        open={faceSearchOpen}
        onClose={closeFaceSearch}
        onSearch={searchByFace}
        results={faceSearchResults}
        loading={faceSearchLoading}
        onZoom={openZoom}
      />

      {/* ── Cart flotante — solo cuando cartPosition lo indica ── */}
      {layout.cartPosition === "fixed-bottom-right" && (
        <CartButton
          position="fixed-bottom-right"
          cartItems={cartItems}
          onClick={openCart}
        />
      )}
    </>
  )
}

// ─── Sub-layouts ──────────────────────────────────────────────
// Son componentes internos de este archivo — no se exportan.
// Cada uno arma la estructura HTML de su configuración de hero.
// ─────────────────────────────────────────────────────────────

/**
 * fullscreen-bg: la portada ocupa toda la pantalla de fondo.
 * El contenido scrollea sobre ella.
 * Usado por: Cinematic
 */
function FullscreenBgLayout({ gallery, layout, heroProps, toolbarProps, gridProps, actions, cartItems }) {
  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: "var(--pb-color-bg)" }}>

      {/* Imagen de fondo fija */}
      {gallery.coverImage && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: `url(${gallery.coverImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.25,
          pointerEvents: "none",
        }} />
      )}

      {/* Contenido scrollable sobre el fondo */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* En cinematic el hero es solo el título + autor, sin bloque de imagen */}
        <GalleryHero {...heroProps} />

        {/* Toolbar — puede ser none en cinematic */}
        {layout.toolbarPosition !== "none" && (
          <GalleryToolbar {...toolbarProps} />
        )}

        {/* Grid de fotos */}
        <main style={{
          maxWidth: "var(--pb-content-max-width)",
          margin: "0 auto",
          padding: "var(--pb-content-padding)",
          paddingBottom: "80px",
        }}>
          <PhotoGrid {...gridProps} />
        </main>

        <footer style={{
          textAlign: "center", padding: "24px",
          borderTop: "1px solid var(--pb-color-border)",
          color: "var(--pb-color-text-muted)", fontSize: "12px",
        }}>
          Powered by <strong>photobook.com.ar</strong>
        </footer>
      </div>
    </div>
  )
}

/**
 * dark-top / light-top: hero fijo arriba, luego toolbar y grid.
 * Usado por: Classic, Magazine
 */
function HeroTopLayout({ layout, heroProps, toolbarProps, gridProps, actions, cartItems }) {
  return (
    <div style={{ background: "var(--pb-color-bg)", minHeight: "100dvh" }}>

      <GalleryHero {...heroProps} />

      {/* Toolbar sticky o flotante según layout.toolbarPosition */}
      {layout.toolbarPosition !== "none" && (
        <GalleryToolbar {...toolbarProps} />
      )}

      <main style={{
        maxWidth: "var(--pb-content-max-width)",
        margin: "0 auto",
        padding: "var(--pb-content-padding)",
        paddingTop: "var(--pb-section-gap)",
        paddingBottom: layout.toolbarPosition === "fixed-bottom-center" ? "100px" : "80px",
      }}>
        <PhotoGrid {...gridProps} />
      </main>

      <footer style={{
        textAlign: "center", padding: "24px",
        borderTop: "1px solid var(--pb-color-border)",
        color: "var(--pb-color-text-muted)", fontSize: "12px",
      }}>
        Powered by <strong>photobook.com.ar</strong>
      </footer>
    </div>
  )
}

/**
 * minimal-top: solo el título y autor, sin imagen de portada.
 * Fondo blanco, nav minimalista.
 * Usado por: Minimal
 */
function MinimalTopLayout({ layout, heroProps, toolbarProps, gridProps }) {
  // Si toolbarPosition es floating, el nav solo muestra el título
  // y la toolbar se renderiza en su posición correcta (pill flotante)
  const isFloatingToolbar = layout.toolbarPosition === "fixed-bottom-center" ||
                            layout.toolbarPosition === "fixed-bottom-right"

  const bottomPadding = isFloatingToolbar ? "100px"
    : layout.toolbarPosition === "sticky-top" ? "80px"
    : "80px"

  return (
    <div style={{ background: "var(--pb-color-bg)", minHeight: "100dvh" }}>

      {/* Nav superior — siempre presente en minimal-top */}
      <nav className="pb-toolbar" style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "var(--pb-color-toolbar-bg)",
        backdropFilter: "blur(var(--pb-toolbar-blur))",
        borderBottom: "1px solid var(--pb-color-border)",
      }}>
        {isFloatingToolbar ? (
          // Solo título en el nav — la toolbar va abajo como pill
          <div style={{
            maxWidth: "var(--pb-content-max-width)",
            margin: "0 auto",
            padding: "0 16px",
            height: "var(--pb-toolbar-height)",
            display: "flex",
            alignItems: "center",
          }}>
            <span style={{
              fontSize: "14px", fontWeight: "800",
              color: "var(--pb-color-text)",
              letterSpacing: "var(--pb-letter-spacing-title)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {heroProps.gallery.title}
            </span>
          </div>
        ) : (
          // Toolbar completa en el nav (sticky-top)
          <GalleryToolbar {...toolbarProps} showTitle />
        )}
      </nav>

      {/* Toolbar flotante — solo si no es sticky-top */}
      {isFloatingToolbar && (
        <GalleryToolbar {...toolbarProps} />
      )}

      <main style={{
        maxWidth: "var(--pb-content-max-width)",
        margin: "0 auto",
        padding: "var(--pb-content-padding)",
        paddingTop: "var(--pb-section-gap)",
        paddingBottom: bottomPadding,
      }}>
        {/* Título completo, descripción y autor sobre el grid */}
        <div style={{ marginBottom: "24px" }}>
          <h1 className="pb-hero-title" style={{
            fontSize: "var(--pb-font-size-title)",
            fontWeight: "var(--pb-font-weight-title)",
            color: "var(--pb-color-text)",
            letterSpacing: "var(--pb-letter-spacing-title)",
            margin: 0,
          }}>
            {heroProps.gallery.title}
          </h1>
          {heroProps.gallery.description && (
            <p style={{ color: "var(--pb-color-text-muted)", marginTop: "6px", fontSize: "13px", lineHeight: 1.5 }}>
              {heroProps.gallery.description}
            </p>
          )}

          {/* Autor — foto de perfil + nombre + link al portfolio */}
          {heroProps.gallery.photographerName && (
            <MinimalAuthor gallery={heroProps.gallery} />
          )}
        </div>

        <PhotoGrid {...gridProps} />
      </main>
    </div>
  )
}


/**
 * Autor para MinimalTopLayout — versión light (fondo claro)
 */
function MinimalAuthor({ gallery }) {
  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px" }}>
      {gallery.photographerAvatar ? (
        <img
          src={gallery.photographerAvatar}
          alt={gallery.photographerName}
          style={{
            width: "var(--pb-author-avatar-size)",
            height: "var(--pb-author-avatar-size)",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid var(--pb-color-border)",
            flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: "var(--pb-author-avatar-size)",
          height: "var(--pb-author-avatar-size)",
          borderRadius: "50%",
          background: "var(--pb-color-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: "700",
          color: "var(--pb-color-accent-fg)",
          flexShrink: 0,
        }}>
          {gallery.photographerName[0].toUpperCase()}
        </div>
      )}
      <div>
        <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--pb-color-text)", margin: 0 }}>
          {gallery.photographerName}
        </p>
        {gallery.photographerSlug && (
          <p style={{ fontSize: "11px", color: "var(--pb-color-text-muted)", margin: "1px 0 0" }}>
            Ver portfolio →
          </p>
        )}
      </div>
    </div>
  )

  if (gallery.photographerSlug) {
    return (
      <a href={`/p/${gallery.photographerSlug}`} style={{ textDecoration: "none" }}>
        {inner}
      </a>
    )
  }
  return inner
}

/**
 * none: sin hero, acceso directo a las fotos.
 * Para galerías muy simples o casos de uso específicos.
 */
function NoHeroLayout({ layout, toolbarProps, gridProps }) {
  return (
    <div style={{ background: "var(--pb-color-bg)", minHeight: "100dvh" }}>
      {layout.toolbarPosition !== "none" && (
        <GalleryToolbar {...toolbarProps} />
      )}
      <main style={{
        maxWidth: "var(--pb-content-max-width)",
        margin: "0 auto",
        padding: "var(--pb-content-padding)",
        paddingBottom: "80px",
      }}>
        <PhotoGrid {...gridProps} />
      </main>
    </div>
  )
}
