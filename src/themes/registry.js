/**
 * src/themes/registry.js
 * ─────────────────────────────────────────────────────────────
 * Registro central de themes disponibles.
 *
 * AGREGAR UN THEME NUEVO:
 *   1. Crear carpeta src/themes/mi-theme/
 *   2. Crear src/themes/mi-theme/index.js con el objeto del theme
 *   3. Agregar una línea en THEME_REGISTRY
 *   4. Agregar una entrada en THEME_METADATA
 *   → Aparece automáticamente en el selector del dashboard
 * ─────────────────────────────────────────────────────────────
 */

export const THEME_REGISTRY = {
  classic:    () => import("./classic/index.js"),
  cinematic:  () => import("./cinematic/index.js"),
  minimal:    () => import("./minimal/index.js"),
  magazine:   () => import("./magazine/index.js"),
  "dark-luxe":() => import("./dark-luxe/index.js"),
}

export const DEFAULT_THEME_SLUG = "classic"

/**
 * Carga un theme por su slug.
 * Si el slug no existe en el registro, carga el theme por defecto.
 */
export async function loadTheme(slug) {
  const loader = THEME_REGISTRY[slug] ?? THEME_REGISTRY[DEFAULT_THEME_SLUG]
  const module = await loader()
  return module.default
}

/**
 * Metadatos de todos los themes disponibles.
 * ThemeSelector los lee directamente — sin API, sin fetch.
 * Agregar un theme acá lo hace aparecer automáticamente en el selector.
 */
export const THEME_METADATA = [
  {
    slug:        "classic",
    name:        "Clásica",
    description: "Grid limpio con hero oscuro. La opción más versátil.",
    thumbnail:   null,
  },
  {
    slug:        "cinematic",
    name:        "Cinemática",
    description: "Fondo negro, portada fullscreen. Ideal para bodas.",
    thumbnail:   null,
  },
  {
    slug:        "minimal",
    name:        "Minimal",
    description: "Fondo blanco, máximo espacio para las fotos.",
    thumbnail:   null,
  },
  {
    slug:        "magazine",
    name:        "Magazine",
    description: "Masonry editorial con fotos a distintas alturas.",
    thumbnail:   null,
  },
  {
    slug:        "dark-luxe",
    name:        "Dark Luxe",
    description: "Oscuro y elegante con animaciones de entrada y efectos dorados.",
    thumbnail:   null,
  },
]
