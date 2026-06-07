/**
 * src/themes/schema.js
 * ─────────────────────────────────────────────────────────────
 * Fuente de verdad del sistema de themes.
 *
 * Define:
 *   TOKEN_DEFAULTS   → valores base de todos los tokens CSS
 *   LAYOUT_OPTIONS   → valores válidos para cada opción de layout
 *   LAYOUT_DEFAULTS  → valores base del layout
 *   mergeTheme()     → combina defaults + overrides de DB + customCss
 *   tokensToCss()    → convierte tokens a string CSS (:root { --x: y })
 *   scopeCustomCss() → aisla el customCss bajo [data-theme="slug"]
 * ─────────────────────────────────────────────────────────────
 */

export const TOKEN_DEFAULTS = {
  // Colores base
  colorBg:           "#f8fafc",
  colorSurface:      "#ffffff",
  colorBorder:       "#e2e8f0",
  colorText:         "#0f172a",
  colorTextMuted:    "#94a3b8",
  colorAccent:       "#0f172a",
  colorAccentFg:     "#ffffff",
  colorOverlay:      "rgba(0,0,0,0.35)",

  // Hero
  colorHeroBg:       "#0f172a",
  colorHeroText:     "#ffffff",
  colorHeroTextMuted:"rgba(255,255,255,0.6)",

  // Toolbar
  colorToolbarBg:    "rgba(248,250,252,0.92)",
  colorToolbarBorder:"#e2e8f0",
  colorToolbarText:  "#475569",

  // Botones
  colorBtnBg:        "#ffffff",
  colorBtnText:      "#475569",
  colorBtnBorder:    "#e2e8f0",
  colorBtnHoverBg:   "#f1f5f9",

  // Tipografía
  fontFamily:        "'DM Sans', system-ui, sans-serif",
  fontSizeBase:      "14px",
  fontSizeTitle:     "1.75rem",
  fontWeightTitle:   "800",
  fontWeightBody:    "400",
  letterSpacingTitle:"-0.03em",

  // Fotos
  photoRadius:       "12px",
  photoGap:          "10px",
  photoColumns:      "repeat(auto-fill, minmax(180px, 1fr))",
  photoShadow:       "none",
  photoObjectFit:    "cover",

  // Animaciones
  transitionSpeed:   "0.2s",
  transitionEasing:  "ease",
  photoHoverScale:   "1.04",

  // Espaciado general
  contentMaxWidth:   "980px",
  contentPadding:    "0 16px",
  sectionGap:        "24px",

  // Toolbar
  toolbarBlur:       "8px",
  toolbarHeight:     "52px",

  // Autor / fotógrafo
  authorAvatarSize:  "100px",

  // Botones
  btnRadius:         "10px",
  btnPaddingX:       "14px",
  btnPaddingY:       "8px",
  btnFontWeight:     "600",
  btnFontSize:       "13px",
}

export const LAYOUT_OPTIONS = {
  heroStyle: [
    "dark-top",
    "light-top",
    "fullscreen-bg",
    "minimal-top",
    "none",
  ],
  toolbarPosition: [
    "sticky-top",
    "fixed-bottom-center",
    "fixed-bottom-right",
    "none",
  ],
  cartPosition: [
    "toolbar",
    "fixed-bottom-right",
    "hero",
    "none",
  ],
  gridStyle: [
    "grid",
    "masonry",
    "slideshow",
  ],
  photoAspect: [
    "4/3",
    "3/2",
    "1/1",
    "16/9",
    "free",
  ],
  photoHoverEffect: [
    "scale",
    "fade",
    "lift",
    "none",
  ],
  pricePosition: [
    "overlay-bottom-left",
    "below-photo",
    "none",
  ],
}

export const LAYOUT_DEFAULTS = {
  heroStyle:          "dark-top",
  toolbarPosition:    "sticky-top",
  cartPosition:       "toolbar",
  gridStyle:          "grid",
  photoAspect:        "4/3",
  photoHoverEffect:   "scale",
  pricePosition:      "overlay-bottom-left",
}

// ─── HELPERS ─────────────────────────────────────────────────

function tokenToCssVar(name) {
  return "--pb-" + name.replace(/([A-Z])/g, (m) => "-" + m.toLowerCase())
}

/**
 * Convierte el objeto de tokens a un bloque CSS :root { ... }
 */
export function tokensToCss(tokens) {
  const vars = Object.entries(tokens)
    .map(([key, value]) => `  ${tokenToCssVar(key)}: ${value};`)
    .join("\n")
  return `:root {\n${vars}\n}`
}

/**
 * Aisla el customCss del theme bajo su selector [data-theme="slug"].
 *
 * Estrategia de aislamiento:
 *   - Reglas normales: se envuelven en [data-theme="slug"] { ... }
 *   - @keyframes: se sacan al scope global (los keyframes no se heredan
 *     y no pueden estar dentro de selectores de atributo) pero se prefijan
 *     con el slug para evitar colisiones entre themes.
 *   - @media / @supports: se mantienen como at-rules pero sus reglas
 *     internas se envuelven con el selector del theme.
 *   - @font-face: se sacan al scope global (son globales por naturaleza).
 *
 * @param {string} css   - CSS raw del theme
 * @param {string} slug  - slug del theme (ej: "cinematic")
 * @returns {string}     - CSS procesado y aislado
 */
export function scopeCustomCss(css, slug) {
  if (!css || !css.trim()) return ""

  const selector = `[data-theme="${slug}"]`
  const keyframePrefix = `pb-${slug}`

  // Separar el CSS en bloques top-level
  // Cada bloque es una at-rule (@keyframes, @media, @font-face, @supports)
  // o una regla normal terminada en }
  const blocks = splitCssBlocks(css)

  const globalBlocks  = []  // @keyframes, @font-face → scope global
  const scopedBlocks  = []  // todo lo demás → bajo [data-theme]

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // ── @keyframes ──────────────────────────────────────────
    // Se sacan al scope global pero se prefixa el nombre para
    // que no colisionen con keyframes de otros themes.
    // Ej: @keyframes fadeIn → @keyframes pb-cinematic-fadeIn
    if (/^@keyframes\s/i.test(trimmed)) {
      const prefixed = trimmed.replace(
        /^@keyframes\s+([\w-]+)/i,
        (_, name) => `@keyframes ${keyframePrefix}-${name}`
      )
      globalBlocks.push(prefixed)

      // También reemplazar referencias al keyframe dentro del CSS
      // (animation-name: fadeIn → animation-name: pb-slug-fadeIn)
      // Esto se hace en el paso de post-proceso de scopedBlocks
      continue
    }

    // ── @font-face ───────────────────────────────────────────
    // Siempre global — las fuentes son un recurso global.
    if (/^@font-face\s*\{/i.test(trimmed)) {
      globalBlocks.push(trimmed)
      continue
    }

    // ── @media / @supports ───────────────────────────────────
    // Mantener la at-rule pero aislar las reglas internas.
    if (/^@(media|supports)\s/i.test(trimmed)) {
      const inner = extractAtRuleContent(trimmed)
      const atRule = trimmed.match(/^(@(?:media|supports)[^{]+)/i)?.[1]?.trim() ?? ""
      if (inner && atRule) {
        const scopedInner = scopeRules(inner, selector)
        scopedBlocks.push(`${atRule} {\n${scopedInner}\n}`)
      }
      continue
    }

    // ── Reglas normales ──────────────────────────────────────
    scopedBlocks.push(scopeRules(trimmed, selector))
  }

  // Post-proceso: reemplazar referencias a keyframes en los scoped blocks
  // animation: fadeIn 1s → animation: pb-slug-fadeIn 1s
// Recolectar todos los nombres de keyframes definidos en este theme
const keyframeNames = globalBlocks
  .map(b => {
    const m = b.match(/^@keyframes\s+([\w-]+)/i)
    return m ? m[1].replace(`${keyframePrefix}-`, "") : null
  })
  .filter(Boolean)

const processedScoped = scopedBlocks
  .join("\n\n")
  .replace(
    /\banimation(?:-name)?\s*:\s*([^;}{]+)/g,
    (match, valueList) => {
      // Reemplazar cada nombre de keyframe conocido en la lista de valores
      const replaced = valueList.replace(
        /\b([\w-]+)\b/g,
        (word) => {
          const cssKeywords = [
            "none","infinite","linear","ease","ease-in","ease-out",
            "ease-in-out","step-start","step-end","forwards","backwards",
            "both","normal","reverse","alternate","alternate-reverse",
            "running","paused","inherit","initial","unset","revert"
          ]
          if (
            cssKeywords.includes(word) ||
            word.startsWith(`${keyframePrefix}-`) ||
            !keyframeNames.includes(word)   // ← solo renombrar keyframes conocidos
          ) {
            return word
          }
          return `${keyframePrefix}-${word}`
        }
      )
      return match.replace(valueList, replaced)
    }
  )

  const parts = []
  if (globalBlocks.length)  parts.push(globalBlocks.join("\n\n"))
  if (processedScoped)      parts.push(processedScoped)

  return parts.join("\n\n")
}

// ── Helpers internos de scopeCustomCss ───────────────────────

/**
 * Divide un string CSS en bloques top-level respetando llaves anidadas.
 */
function splitCssBlocks(css) {
  const blocks = []
  let depth = 0
  let start = 0
  let inString = false
  let stringChar = ""

  for (let i = 0; i < css.length; i++) {
    const ch = css[i]

    // Manejar strings CSS (valores entre comillas)
    if ((ch === '"' || ch === "'") && css[i - 1] !== "\\") {
      if (!inString) { inString = true; stringChar = ch }
      else if (ch === stringChar) { inString = false }
      continue
    }
    if (inString) continue

    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) {
        blocks.push(css.slice(start, i + 1))
        start = i + 1
      }
    }
  }

  // Capturar contenido sin llaves al final (poco probable en CSS válido)
  const remaining = css.slice(start).trim()
  if (remaining) blocks.push(remaining)

  return blocks
}

/**
 * Extrae el contenido entre las primeras llaves de una at-rule.
 */
function extractAtRuleContent(block) {
  const first = block.indexOf("{")
  const last  = block.lastIndexOf("}")
  if (first === -1 || last === -1) return ""
  return block.slice(first + 1, last)
}

/**
 * Envuelve cada regla CSS bajo el selector del theme.
 * Maneja :root, html, body y selectores múltiples.
 */
function scopeRules(css, selector) {
  const blocks = splitCssBlocks(css)
  return blocks.map(block => {
    const trimmed = block.trim()
    if (!trimmed) return ""

    // Extraer el selector y el cuerpo
    const braceIdx = trimmed.indexOf("{")
    if (braceIdx === -1) return trimmed

    const rawSelectors = trimmed.slice(0, braceIdx).trim()
    const body         = trimmed.slice(braceIdx)

    // Procesar cada selector separado por coma
    const scoped = rawSelectors
      .split(",")
      .map(sel => {
        const s = sel.trim()
        // :root y html → reemplazar por el selector del theme
        if (s === ":root" || s === "html") return selector
        // body → [data-theme] body o simplemente el theme wrapper
        if (s === "body") return selector
        // Selectores que ya tienen el prefijo → no tocar
        if (s.startsWith(selector)) return s
        // Resto → anidar bajo el selector del theme
        return `${selector} ${s}`
      })
      .join(",\n")

    return `${scoped} ${body}`
  }).join("\n\n")
}

/**
 * Fusiona los defaults del sistema con los tokens del theme
 * y los overrides de DB. Ahora también incluye customCss.
 *
 * Orden de precedencia (mayor gana):
 *   TOKEN_DEFAULTS < theme.tokens < db.tokenOverrides
 *
 * customCss:
 *   Solo viene de la definición del theme en el filesystem.
 *   Los overrides de DB no pueden sobreescribir el CSS custom
 *   (solo pueden sobreescribir tokens individuales).
 */
export function mergeTheme(themeDefinition, dbTokenOverrides = {}) {
  const rawCustomCss = themeDefinition.customCss ?? ""

  return {
    tokens: {
      ...TOKEN_DEFAULTS,
      ...(themeDefinition.tokens ?? {}),
      ...dbTokenOverrides,
    },
    layout: {
      ...LAYOUT_DEFAULTS,
      ...(themeDefinition.layout ?? {}),
    },
    // CSS custom ya procesado y aislado — listo para inyectar en <style>
    customCss: rawCustomCss
      ? scopeCustomCss(rawCustomCss, themeDefinition.slug)
      : "",
    slug:        themeDefinition.slug,
    name:        themeDefinition.name,
    description: themeDefinition.description ?? "",
  }
}

/**
 * Valida que un objeto de layout solo use valores permitidos.
 */
export function validateLayout(layout) {
  const errors = []
  for (const [key, validValues] of Object.entries(LAYOUT_OPTIONS)) {
    if (layout[key] !== undefined && !validValues.includes(layout[key])) {
      errors.push(`"${key}" tiene valor inválido: "${layout[key]}". Válidos: ${validValues.join(", ")}`)
    }
  }
  return { valid: errors.length === 0, errors }
}
