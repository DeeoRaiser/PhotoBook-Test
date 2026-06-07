/**
 * src/themes/minimal/index.js
 * ─────────────────────────────────────────────────────────────
 * Theme: Minimal
 * Versión anterior que funcionaba perfectamente.
 * ─────────────────────────────────────────────────────────────
 */

export default {
  slug: "minimal",
  name: "Minimal",
  description: "Fondo blanco, máximo espacio para las fotos.",

  tokens: {
    colorBg: "#ffffff",
    colorSurface: "#ffffff",
    colorBorder: "#f3f4f6",
    colorText: "#111827",
    colorTextMuted: "#9ca3af",
    colorAccent: "#111827",
    colorAccentFg: "#ffffff",
    colorOverlay: "rgba(0,0,0,0.25)",
    colorHeroBg: "#ffffff",
    colorHeroText: "#111827",
    colorHeroTextMuted: "#9ca3af",
    colorToolbarBg: "rgba(255,255,255,0.96)",
    colorToolbarBorder: "#f3f4f6",
    colorToolbarText: "#374151",
    colorBtnBg: "#ffffff",
    colorBtnText: "#374151",
    colorBtnBorder: "#e5e7eb",
    colorBtnHoverBg: "#f9fafb",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSizeBase: "13px",
    fontSizeTitle: "1.4rem",
    fontWeightTitle: 700,
    letterSpacingTitle: "-0.01em",
    photoRadius: "4px",
    photoGap: "4px",
    photoColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    photoShadow: "none",
    transitionSpeed: "0.15s",
    transitionEasing: "ease",
    contentMaxWidth: "900px",
    contentPadding: "0 16px",
    toolbarBlur: "12px",
    toolbarHeight: "48px",
    btnRadius: "8px",
    authorAvatarSize: "80px"
  },

  layout: {
    heroStyle: "minimal-top",
    toolbarPosition: "sticky-top",
    cartPosition: "toolbar",
    gridStyle: "grid",
    photoAspect: "1/1",
    photoHoverEffect: "fade",
    pricePosition: "none"
  },

  customCss: `
/* Minimal: Limpio y directo */

.pb-hero {
  padding: 20px 0 16px;
  border-bottom: 1px solid #f3f4f6;
}

.pb-photo-grid {
  padding: 16px 0;
  display: grid;
  grid-template-columns: var(--pb-photo-columns);
  gap: var(--pb-photo-gap);
}

.pb-photo-card {
  border-radius: var(--pb-photo-radius);
  overflow: hidden;
  background: #ffffff;
  cursor: zoom-in;
  transition: all 0.15s ease;
  border: 1px solid #f3f4f6;
}

.pb-photo-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: #e5e7eb;
}

.pb-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.15s ease;
}

.pb-photo-card:hover .pb-photo-img {
  transform: scale(1.08);
}

.pb-toolbar {
  border-bottom: 1px solid #f3f4f6;
}

.pb-toolbar-btn {
  transition: all 0.15s ease;
}

.pb-toolbar-btn:hover {
  background: #f9fafb;
}
  `
};
