/**
 * src/themes/dark-luxe/index.js
 * ─────────────────────────────────────────────────────────────
 * Theme: Dark Luxe — Rediseño completo
 *
 * Concepto: lujo editorial oscuro con cobre quemado.
 * Fondo carbón cálido (no negro frío), acentos cobre/ámbar,
 * tipografía condensada con mucho carácter, fotos grandes con
 * hover de resplandor sutil. Toolbar flotante abajo a la derecha.
 * ─────────────────────────────────────────────────────────────
 */

export default {
  slug: "dark-luxe",
  name: "Dark Luxe",
  description: "Editorial oscuro con acentos cobre. Lujo sofisticado.",

  tokens: {
    // Carbón cálido — no tan frío como negro puro
    colorBg: "#161412",
    colorSurface: "#211e1b",
    colorBorder: "rgba(185,130,80,0.12)",
    colorText: "#ede8e3",
    colorTextMuted: "rgba(237,232,227,0.50)",
    colorAccent: "#c8814a",       // cobre quemado
    colorAccentFg: "#161412",
    colorOverlay: "rgba(0,0,0,0.55)",


    authorAvatarSize: "130px",

    // Hero oscuro cálido
    colorHeroBg: "#161412",
    colorHeroText: "#ede8e3",
    colorHeroTextMuted: "rgba(237,232,227,0.55)",

    // Toolbar
    colorToolbarBg: "rgba(22,20,18,0.94)",
    colorToolbarBorder: "rgba(185,130,80,0.15)",
    colorToolbarText: "rgba(237,232,227,0.70)",

    // Botones
    colorBtnBg: "rgba(255,255,255,0.05)",
    colorBtnText: "rgba(237,232,227,0.85)",
    colorBtnBorder: "rgba(185,130,80,0.20)",
    colorBtnHoverBg: "rgba(200,129,74,0.12)",

    // Tipografía con carácter
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSizeTitle: "3rem",
    fontWeightTitle: 900,
    letterSpacingTitle: "-0.05em",

    // Fotos amplias, casi sin gap
    photoRadius: "2px",
    photoGap: "6px",
    photoColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    photoShadow: "none",
    transitionSpeed: "0.4s",
    transitionEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    contentMaxWidth: "1200px",
    toolbarBlur: "20px",
    btnRadius: "3px",
  },

  layout: {
    heroStyle: "dark-top",
    toolbarPosition: "fixed-bottom-right",
    cartPosition: "fixed-bottom-right",
    gridStyle: "grid",
    photoAspect: "3/2",
    photoHoverEffect: "lift",
    pricePosition: "overlay-bottom-left",
  },

  customCss: `
/* Dark Luxe: carbón cálido y acentos cobre */

.pb-hero {
  padding: 72px 0 56px;
  background: linear-gradient(145deg, #161412 0%, #1e1a16 60%, #241f19 100%);
  border-bottom: 1px solid rgba(185,130,80,0.14);
  position: relative;
  overflow: hidden;
}

/* Textura sutil de grain en el hero */
.pb-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}

/* Línea decorativa cobre */
.pb-hero::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #c8814a, transparent);
}

.pb-hero-title {
  font-size: var(--pb-font-size-title);
  font-weight: var(--pb-font-weight-title);
  letter-spacing: var(--pb-letter-spacing-title);
  color: #ede8e3;
  position: relative;
  z-index: 1;
  line-height: 1.0;
  /* Subrayado cobre decorativo en el título */
  background: linear-gradient(135deg, #ede8e3 60%, #c8814a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pb-hero-desc,
.pb-hero-desc *,
.pb-hero-desc a {
  position: relative;
  z-index: 1;
  color: rgba(237,232,227,0.60) !important;
}

.pb-hero-desc a:hover,
.pb-hero a[href]:hover {
  color: #c8814a !important;
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
  background: #211e1b;
  cursor: zoom-in;
  transition: all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(185,130,80,0.08);
  position: relative;
}

/* Resplandor cobre en hover */
.pb-photo-card:hover {
  transform: translateY(-8px) scale(1.01);
  box-shadow:
    0 20px 40px rgba(0,0,0,0.45),
    0 0 0 1px rgba(200,129,74,0.25),
    0 0 30px rgba(200,129,74,0.08);
  border-color: rgba(200,129,74,0.28);
}

.pb-photo-img {
  width: 150%;
  height: 150%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  filter: brightness(0.92) saturate(0.9);
}

.pb-photo-card:hover .pb-photo-img {
  transform: scale(1.05);
  filter: brightness(1.0) saturate(1.05);
}

/* Toolbar flotante estilizada */
.pb-toolbar {
  border: 1px solid rgba(185,130,80,0.18) !important;
  border-radius: 14px !important;
  box-shadow:
    0 16px 40px rgba(0,0,0,0.45),
    0 0 0 1px rgba(200,129,74,0.08) !important;
}

.pb-toolbar-btn {
  transition: all 0.25s ease;
  border: 1px solid rgba(185,130,80,0.15) !important;
  border-radius: 6px !important;
}

.pb-toolbar-btn:hover {
  border-color: rgba(200,129,74,0.40) !important;
  color: #c8814a !important;
  background: rgba(200,129,74,0.10) !important;
  transform: translateY(-1px);
}

/* Overlay y precio */
.pb-photo-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent) !important;
}

.pb-photo-price {
  color: #ede8e3 !important;
  background: rgba(22,20,18,0.75) !important;
  padding: 5px 10px !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  letter-spacing: 0.06em !important;
  border: 1px solid rgba(200,129,74,0.30) !important;
  border-radius: 2px !important;
}

/* Animación de entrada */
@keyframes luxeIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.pb-photo-card {
  animation: luxeIn 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.pb-photo-card:nth-child(1)  { animation-delay: .03s }
.pb-photo-card:nth-child(2)  { animation-delay: .07s }
.pb-photo-card:nth-child(3)  { animation-delay: .11s }
.pb-photo-card:nth-child(4)  { animation-delay: .15s }
.pb-photo-card:nth-child(5)  { animation-delay: .19s }
.pb-photo-card:nth-child(6)  { animation-delay: .23s }
.pb-photo-card:nth-child(7)  { animation-delay: .27s }
.pb-photo-card:nth-child(8)  { animation-delay: .31s }
.pb-photo-card:nth-child(9)  { animation-delay: .35s }
.pb-photo-card:nth-child(10) { animation-delay: .39s }
.pb-photo-card:nth-child(11) { animation-delay: .43s }
.pb-photo-card:nth-child(12) { animation-delay: .47s }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
  `,
};