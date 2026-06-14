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
        <PricingTiers gallery={gallery} />
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

        {/* Detalle de precios por paquete */}
        <PricingTiers gallery={gallery} isDark={isDark} />
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

/**
 * PricingTiers — muestra los rangos de precio cuando pricingMode === "tiered".
 * Se adapta visualmente al contexto: hero oscuro, claro o fullscreen-bg.
 */
function PricingTiers({ gallery, isDark }) {
  if (gallery.pricingMode !== "tiered") return null
  if (!gallery.pricingTiers?.length) return null

  const tiers = [...gallery.pricingTiers].sort((a, b) => Number(a.minQty) - Number(b.minQty))

  // Colores adaptados al fondo del hero
  const textColor     = isDark === false ? "#0f172a" : "var(--pb-color-hero-text, #fff)"
  const mutedColor    = isDark === false ? "#475569" : "rgba(255,255,255,0.7)"
  const bgCard        = isDark === false ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.10)"
  const borderCard    = isDark === false ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)"
  const accentColor   = "#f59e0b"

  return (
    <div style={{ marginTop: 4 }}>
      {/* Título de la sección */}
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: accentColor,
        margin: "0 0 8px",
      }}>
        💰 Precios por paquete
      </p>

      {/* Lista de tiers */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}>
        {tiers.map((tier, i) => {
          const rangeLabel = tier.maxQty
            ? `${tier.minQty}–${tier.maxQty} fotos`
            : `${tier.minQty}+ fotos`

          return (
            <div
              key={tier.id ?? i}
              style={{
                background: bgCard,
                border: `1px solid ${borderCard}`,
                borderRadius: 10,
                padding: "8px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 110,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: mutedColor }}>
                {rangeLabel}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: textColor }}>
                ${Number(tier.price).toLocaleString("es-AR")}
                <span style={{ fontSize: 10, fontWeight: 500, color: mutedColor }}> /foto</span>
              </span>
            </div>
          )
        })}
      </div>
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