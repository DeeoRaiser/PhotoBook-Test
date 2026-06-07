/**
 * src/themes/magazine/index.js
 * ─────────────────────────────────────────────────────────────
 * Theme: Magazine
 * Editorial masonry con avatar agrandado y banner legible.
 * FIX: descripción y link de portfolio ahora legibles (color explícito).
 * ─────────────────────────────────────────────────────────────
 */

export default {
  slug: "magazine",
  name: "Magazine",
  description: "Masonry editorial con fotos a distintas alturas.",

  tokens: {
    colorBg: "#fdfcfb",
    colorSurface: "#ffffff",
    colorBorder: "rgba(0,0,0,0.06)",
    colorText: "#1a1a1a",
    colorTextMuted: "#555555",
    colorAccent: "#1a1a1a",
    colorAccentFg: "#ffffff",
    colorOverlay: "rgba(0,0,0,0.25)",

    // Hero claro → los textos deben ser oscuros explícitamente
    colorHeroBg: "#fdfcfb",
    colorHeroText: "#1a1a1a",
    // FIX clave: este token se usa para desc y links del hero —
    // estaba en blanco por defecto, invisible sobre fondo claro
    colorHeroTextMuted: "#555555",

    colorToolbarBg: "rgba(255,255,255,0.88)",
    colorToolbarBorder: "rgba(0,0,0,0.10)",
    colorToolbarText: "#1a1a1a",
    colorBtnBg: "rgba(255,255,255,0.9)",
    colorBtnText: "#1a1a1a",
    colorBtnBorder: "rgba(0,0,0,0.08)",
    colorBtnHoverBg: "#ffffff",

    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSizeTitle: "2.25rem",
    fontWeightTitle: 800,
    letterSpacingTitle: "-0.04em",
    photoRadius: "0px",
    photoGap: "24px",
    photoColumns: "3",
    contentMaxWidth: "1200px",
    toolbarBlur: "12px",
    btnRadius: "100px",
    authorAvatarSize: "140px",
  },

  layout: {
    heroStyle: "light-top",
    toolbarPosition: "fixed-bottom-center",
    cartPosition: "toolbar",
    gridStyle: "masonry",
    photoAspect: "free",
    photoHoverEffect: "lift",
    pricePosition: "overlay-bottom-left",
  },

  customCss: `
/* Magazine: Editorial profesional — textos del hero corregidos */

.pb-hero {
  padding: 80px 0 60px;
  text-align: center;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  position: relative;
  background: linear-gradient(180deg, #fdfcfb 0%, #f5f3f0 100%);
}

.pb-hero-title {
  font-size: var(--pb-font-size-title);
  font-weight: var(--pb-font-weight-title);
  letter-spacing: var(--pb-letter-spacing-title);
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
  /* Color explícito para garantizar legibilidad sin importar el token */
  color: #1a1a1a !important;
}

/* FIX: descripción y todo texto secundario del hero */
.pb-hero-desc,
.pb-hero-desc *,
.pb-hero-desc a,
.pb-hero-desc p,
.pb-hero-desc span {
  position: relative;
  z-index: 2;
  color: #4a4a4a !important;
  text-shadow: none !important;
}

/* FIX: link de portfolio dentro del hero */
.pb-hero-desc a,
.pb-hero a[href],
.pb-hero .pb-portfolio-link {
  color: #1a1a1a !important;
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.pb-hero-desc a:hover,
.pb-hero a[href]:hover,
.pb-hero .pb-portfolio-link:hover {
  opacity: 0.65;
}

/* Asegurar que cualquier texto muted del hero sea legible */
.pb-hero [class*="muted"],
.pb-hero [class*="desc"],
.pb-hero [class*="sub"] {
  color: #555555 !important;
}

.pb-photo-grid {
  column-count: var(--pb-photo-columns);
  column-gap: var(--pb-photo-gap);
  padding: 40px 0 120px;
}

.pb-photo-card {
  break-inside: avoid;
  margin-bottom: var(--pb-photo-gap);
  transition: all 0.4s ease;
  border: 1px solid rgba(0,0,0,0.05);
}

.pb-photo-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.10);
  z-index: 10;
}

.pb-photo-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  transition: all 0.6s ease;
  filter: grayscale(0.15);
}

.pb-photo-card:hover .pb-photo-img {
  filter: grayscale(0);
  transform: scale(1.03);
}

.pb-toolbar {
  padding: 8px !important;
  border: 1px solid rgba(0,0,0,0.1) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12) !important;
}

.pb-toolbar-btn {
  border: none !important;
  padding: 8px 16px !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  transition: all 0.3s ease !important;
}

.pb-toolbar-btn:hover {
  background: #1a1a1a !important;
  color: #ffffff !important;
  transform: translateY(-2px);
}

.pb-photo-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.4), transparent) !important;
}

.pb-photo-price {
  background: #ffffff !important;
  color: #1a1a1a !important;
  padding: 6px 12px !important;
  font-weight: 800 !important;
  font-size: 11px !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase;
  border-radius: 2px !important;
}

@media (max-width: 768px) {
  .pb-photo-grid { column-count: 2; }
}

@media (max-width: 480px) {
  .pb-photo-grid { column-count: 1; }
}
  `,
};