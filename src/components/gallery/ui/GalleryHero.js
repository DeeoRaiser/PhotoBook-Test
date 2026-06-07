"use client"

/**
 * src/components/gallery/ui/GalleryHero.jsx
 * ─────────────────────────────────────────────────────────────
 * Hero de la galería.
 * Se adapta a layout.heroStyle para mostrar la portada
 * de forma distinta según el theme.
 *
 * heroStyle values manejados acá:
 *   "dark-top"       → bloque oscuro arriba con portada opcional
 *   "light-top"      → bloque claro arriba con portada opcional
 *   "fullscreen-bg"  → solo título flotando (el fondo lo pone GalleryShell)
 *   "minimal-top"    → solo el nav, sin hero (lo maneja MinimalTopLayout)
 *   "none"           → nada
 * ─────────────────────────────────────────────────────────────
 */

export default function GalleryHero({ gallery, layout, actions, cartItems }) {
  const { heroStyle } = layout

  if (heroStyle === "none" || heroStyle === "minimal-top") return null

  // ── fullscreen-bg: título + autor flotando sobre el fondo que pone GalleryShell ──
  if (heroStyle === "fullscreen-bg") {
    return (
      <div className="pb-hero" style={{
        padding: "48px 24px 32px",
        maxWidth: "var(--pb-content-max-width)",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        <Title gallery={gallery} />
        <div style={{ alignSelf: "flex-start" }}>
          <Author gallery={gallery} />
        </div>
      </div>
    )
  }

  // ── dark-top / light-top: bloque completo arriba ───────────
  const isDark = heroStyle === "dark-top"

  return (
    <section className="pb-hero" style={{
      position: "relative",
      background: "var(--pb-color-hero-bg)",
      overflow: "hidden",
      minHeight: gallery.coverImage ? "220px" : "auto",
    }}>
      {/* Imagen de portada */}
      {gallery.coverImage && (
        <>
          <img
            src={gallery.coverImage}
            alt={gallery.title}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              opacity: isDark ? 0.55 : 0.35,
            }}
          />
          {/* Gradiente para que el texto sea legible */}
          <div style={{
            position: "absolute", inset: 0,
            background: isDark
              ? "linear-gradient(to bottom, rgba(15,23,42,0.1), rgba(15,23,42,0.85))"
              : "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.80))",
          }} />
        </>
      )}

      {/* Contenido del hero */}
      <div style={{
        position: "relative",
        maxWidth: "var(--pb-content-max-width)",
        margin: "0 auto",
        padding: "var(--pb-hero-padding, 40px 24px 32px)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        <Title gallery={gallery} />

        {/* Autor */}
        <div style={{ alignSelf: "flex-start" }}>
          <Author gallery={gallery} />
        </div>
      </div>
    </section>
  )
}

function Title({ gallery }) {
  return (
    <div>
      <h1 className="pb-hero-title" style={{
        fontSize: "var(--pb-font-size-title)",
        fontWeight: "var(--pb-font-weight-title)",
        color: "var(--pb-color-hero-text)",
        letterSpacing: "var(--pb-letter-spacing-title)",
        margin: 0,
        lineHeight: 1.1,
      }}>
        {gallery.title}
      </h1>
      {gallery.description && (
        <p className="pb-hero-desc" style={{
          fontSize: "13px",
          color: "var(--pb-color-hero-text-muted)",
          marginTop: "8px",
          lineHeight: 1.5,
        }}>
          {gallery.description}
        </p>
      )}
    </div>
  )
}

function Author({ gallery }) {
  if (!gallery.photographerName) return null

  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {gallery.photographerAvatar ? (
        <img
          src={gallery.photographerAvatar}
          alt={gallery.photographerName}
          style={{
            width: "var(--pb-author-avatar-size)", 
            height: "var(--pb-author-avatar-size)", 
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid rgba(255,255,255,0.25)",
          }}
        />
      ) : (
        <div style={{
          width: "var(--pb-author-avatar-size)",
          height: "var(--pb-author-avatar-size)",
          borderRadius: "50%",
          background: "var(--pb-color-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: "700",
          color: "var(--pb-color-accent-fg)",
          border: "2px solid rgba(255,255,255,0.15)",
          flexShrink: 0,
        }}>
          {gallery.photographerName[0].toUpperCase()}
        </div>
      )}
      <div>
        <p style={{
          fontSize: "13px", fontWeight: "700",
          color: "var(--pb-color-hero-text)", margin: 0,
        }}>
          {gallery.photographerName}
        </p>
        <p style={{
          fontSize: "11px",
          color: "var(--pb-color-hero-text-muted)", margin: 0,
        }}>
          Fotógrafo
        </p>
      </div>
    </div>
  )

  if (gallery.photographerSlug) {
    return (
      <a
        href={`/p/${gallery.photographerSlug}`}
        style={{ textDecoration: "none", display: "inline-flex" }}
      >
        {inner}
      </a>
    )
  }

  return inner
}