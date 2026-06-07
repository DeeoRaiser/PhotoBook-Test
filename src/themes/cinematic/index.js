/**
 * src/themes/cinematic/index.js
 * ─────────────────────────────────────────────────────────────
 * Theme: Cinemática
 * Hero fullscreen con foto de portada. Fondo oscuro pero respirable.
 * ─────────────────────────────────────────────────────────────
 */

export default {
  slug: "cinematic",
  name: "Cinemática",
  description: "Portada fullscreen y grid oscuro. Ideal para bodas y retratos.",

  tokens: {
    // Fondo oscuro pero no negro puro — más respirable
    colorBg: "#181818",
    colorSurface: "#242424",
    colorBorder: "rgba(255,255,255,0.10)",
    colorText: "#f0f0f0",
    colorTextMuted: "rgba(240,240,240,0.55)",
    colorAccent: "#ffffff",
    colorAccentFg: "#181818",
    colorOverlay: "rgba(0,0,0,0.45)",

    // Hero con foto de portada fullscreen
    colorHeroBg: "#181818",
    colorHeroText: "#ffffff",
    colorHeroTextMuted: "rgba(255,255,255,0.65)",

    // Toolbar legible sobre fondo oscuro
    colorToolbarBg: "rgba(24,24,24,0.90)",
    colorToolbarBorder: "rgba(255,255,255,0.08)",
    colorToolbarText: "rgba(255,255,255,0.75)",

    // Botones visibles
    colorBtnBg: "rgba(255,255,255,0.08)",
    colorBtnText: "rgba(255,255,255,0.85)",
    colorBtnBorder: "rgba(255,255,255,0.15)",
    colorBtnHoverBg: "rgba(255,255,255,0.16)",

    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSizeTitle: "2.8rem",
    fontWeightTitle: 900,
    letterSpacingTitle: "-0.04em",

    photoRadius: "4px",
    photoGap: "4px",
    photoColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    photoShadow: "none",
    transitionSpeed: "0.35s",
    transitionEasing: "cubic-bezier(0.4, 0, 0.2, 1)",
    contentMaxWidth: "1100px",
    toolbarBlur: "20px",
    btnRadius: "3px",
  },

  layout: {
    // fullscreen-bg muestra la foto de portada cubriendo toda la pantalla
    heroStyle: "fullscreen-bg",
    toolbarPosition: "fixed-bottom-right",
    cartPosition: "fixed-bottom-right",
    gridStyle: "grid",
    photoAspect: "3/2",
    photoHoverEffect: "fade",
    pricePosition: "overlay-bottom-left",
  },

  customCss: `
/* Cinemática: oscuro respirable con hero de portada fullscreen */

.pb-hero {
  min-height: 100dvh;
  display: flex;
  align-items: flex-end;
  padding: 0 0 60px;
  position: relative;
}

.pb-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.15) 0%,
    rgba(0,0,0,0.0) 40%,
    rgba(0,0,0,0.65) 100%
  );
  pointer-events: none;
  z-index: 1;
}

.pb-hero-title {
  font-size: var(--pb-font-size-title);
  font-weight: var(--pb-font-weight-title);
  letter-spacing: var(--pb-letter-spacing-title);
  color: #ffffff;
  text-shadow: 0 2px 20px rgba(0,0,0,0.6);
  position: relative;
  z-index: 2;
  line-height: 1.05;
}

.pb-hero-desc {
  position: relative;
  z-index: 2;
  color: rgba(255,255,255,0.75);
  text-shadow: 0 1px 8px rgba(0,0,0,0.5);
}

.pb-photo-grid {
  padding: 32px 0 100px;
  display: grid;
  grid-template-columns: var(--pb-photo-columns);
  gap: var(--pb-photo-gap);
}

.pb-photo-card {
  border-radius: var(--pb-photo-radius);
  overflow: hidden;
  background: #242424;
  cursor: zoom-in;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.06);
}

.pb-photo-card:hover {
  transform: translateY(-6px) scale(1.015);
  box-shadow: 0 24px 48px rgba(0,0,0,0.45);
  border-color: rgba(255,255,255,0.14);
}

.pb-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.pb-photo-card:hover .pb-photo-img {
  transform: scale(1.06);
}

.pb-toolbar {
  border-top: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
}

.pb-toolbar-btn {
  transition: all 0.25s ease;
  font-size: 12px;
  letter-spacing: 0.05em;
}

.pb-toolbar-btn:hover {
  border-color: rgba(255,255,255,0.3) !important;
  color: #ffffff !important;
  background: rgba(255,255,255,0.1) !important;
}

.pb-photo-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.55), transparent) !important;
}

.pb-photo-price {
  background: rgba(0,0,0,0.55) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  border-radius: 2px !important;
}

/* Animación de entrada suave */
@keyframes cinemaIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.pb-photo-card {
  animation: cinemaIn 0.5s ease both;
}

.pb-photo-card:nth-child(1)  { animation-delay: .04s }
.pb-photo-card:nth-child(2)  { animation-delay: .08s }
.pb-photo-card:nth-child(3)  { animation-delay: .12s }
.pb-photo-card:nth-child(4)  { animation-delay: .16s }
.pb-photo-card:nth-child(5)  { animation-delay: .20s }
.pb-photo-card:nth-child(6)  { animation-delay: .24s }
.pb-photo-card:nth-child(7)  { animation-delay: .28s }
.pb-photo-card:nth-child(8)  { animation-delay: .32s }
.pb-photo-card:nth-child(9)  { animation-delay: .36s }
.pb-photo-card:nth-child(10) { animation-delay: .40s }
.pb-photo-card:nth-child(11) { animation-delay: .44s }
.pb-photo-card:nth-child(12) { animation-delay: .48s }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
  `,
};