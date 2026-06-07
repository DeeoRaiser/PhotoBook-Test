/**
 * src/themes/classic/index.js
 * ─────────────────────────────────────────────────────────────
 * Theme: Clásica Radical (Corregido)
 * 
 * Grid limpio, profesional y de alto impacto.
 * ✅ TODOS LOS BOTONES: Toolbar sticky-top con búsqueda/favs/carrito.
 * ✅ DISEÑO RADICAL: Animaciones de elevación, efectos de sombra suave y tipografía moderna.
 * ─────────────────────────────────────────────────────────────
 */

export default {
  slug: "classic",
  name: "Clásica",
  description: "Grid versátil con hero oscuro. El estándar de oro para galerías.",

  tokens: {
    // Colores base profesionales
    colorBg: "#f8fafc",
    colorSurface: "#ffffff",
    colorBorder: "#e2e8f0",
    colorText: "#0f172a",
    colorTextMuted: "#64748b",
    colorAccent: "#3b82f6", // Azul moderno
    colorAccentFg: "#ffffff",
    colorOverlay: "rgba(15, 23, 42, 0.4)",

    // Hero
    colorHeroBg: "#0f172a",
    colorHeroText: "#ffffff",

    // Toolbar
    colorToolbarBg: "rgba(255,255,255,0.9)",
    colorToolbarBorder: "#e2e8f0",
    colorToolbarText: "#475569",

    // Botones
    colorBtnBg: "#ffffff",
    colorBtnText: "#475569",
    colorBtnBorder: "#e2e8f0",
    colorBtnHoverBg: "#f8fafc",

    // Tipografía
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSizeTitle: "2rem",
    fontWeightTitle: 800,
    letterSpacingTitle: "-0.03em",

    // Grilla
    photoRadius: "12px",
    photoGap: "16px",
    photoColumns: "repeat(auto-fill, minmax(280px, 1fr))",

    // Layout
    contentMaxWidth: "1100px",
    toolbarBlur: "8px",
    btnRadius: "10px"
  },

  layout: {
    heroStyle: "dark-top",
    toolbarPosition: "sticky-top",
    cartPosition: "toolbar",
    gridStyle: "grid",
    photoAspect: "4/3",
    photoHoverEffect: "lift",
    pricePosition: "overlay-bottom-left"
  },

  customCss: `
/* ── ANIMACIONES RADICALES ───────────────────────────────────── */

@keyframes pb-classic-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pb-classic-hover-pulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

/* ── HERO ────────────────────────────────────────────────────── */

.pb-hero {
  animation: pb-classic-fade-in 0.8s ease-out both;
  padding: 100px 0 80px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  position: relative;
  overflow: hidden;
}

.pb-hero::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.pb-hero-title {
  font-size: var(--pb-font-size-title);
  font-weight: var(--pb-font-weight-title);
  letter-spacing: var(--pb-letter-spacing-title);
}

/* ── TOOLBAR ─────────────────────────────────────────────────── */

.pb-toolbar {
  border-bottom: 1px solid var(--pb-color-toolbar-border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.pb-toolbar-btn {
  transition: all 0.2s ease !important;
  font-weight: 700 !important;
}

.pb-toolbar-btn:hover {
  border-color: var(--pb-color-accent) !important;
  color: var(--pb-color-accent) !important;
  transform: translateY(-1px);
}

/* ── GRID ────────────────────────────────────────────────────── */

.pb-photo-grid {
  padding: 40px 0;
  animation: pb-classic-fade-in 0.8s 0.2s ease-out both;
}

.pb-photo-card {
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pb-photo-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
}

.pb-photo-img {
  transition: transform 0.5s ease;
}

.pb-photo-card:hover .pb-photo-img {
  transform: scale(1.08);
}

/* ── OVERLAY Y PRECIO ────────────────────────────────────────── */

.pb-photo-overlay {
  background: linear-gradient(to top, rgba(15, 23, 42, 0.6), transparent) !important;
}

.pb-photo-price {
  background: var(--pb-color-accent) !important;
  color: white !important;
  padding: 4px 10px !important;
  font-weight: 700 !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
`
};
