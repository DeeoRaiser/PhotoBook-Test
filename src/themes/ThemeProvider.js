/**
 * src/themes/ThemeProvider.jsx
 * ─────────────────────────────────────────────────────────────
 * Server Component.
 *
 * Inyecta dos bloques <style> en el documento:
 *   1. CSS vars (tokens)  — siempre presente
 *   2. customCss del theme — solo si el theme lo define
 *
 * IMPORTANTE: el atributo `precedence` es requerido por React 18+
 * para que los <style> sean "hoistables". Sin él, React los trata
 * como nodos DOM normales y los puede descartar durante la
 * hidratación cuando un Client Component hijo (GalleryShell) monta.
 * Con `precedence`, React los eleva al <head> y los mantiene
 * estables entre navegaciones y re-renders.
 * ─────────────────────────────────────────────────────────────
 */

import { tokensToCss } from "./schema.js"

export default function ThemeProvider({ theme, children }) {
  const tokensCss = tokensToCss(theme.tokens)
  const customCss = theme.customCss ?? ""

  return (
    <>
      {/* Bloque 1: CSS custom properties (tokens) */}
      <style
        href={`pb-tokens-${theme.slug}`}
        precedence="default"
        dangerouslySetInnerHTML={{ __html: tokensCss }}
      />

      {/* Bloque 2: CSS custom del theme (solo si existe) */}
      {customCss && (
        <style
          href={`pb-custom-${theme.slug}`}
          precedence="low"
          dangerouslySetInnerHTML={{ __html: customCss }}
        />
      )}

      {/*
        data-theme en el wrapper activa el aislamiento del customCss.
        Todos los estilos custom están bajo [data-theme="slug"],
        por lo que solo aplican dentro de este div.
      */}
      <div data-theme={theme.slug} style={{ minHeight: "100dvh" }}>
        {children}
      </div>
    </>
  )
}