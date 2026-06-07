/**
 * INTEGRACIÓN EN src/app/(dashboard)/dashboard/galleries/[id]/page.js
 * ─────────────────────────────────────────────────────────────────────
 * Reemplaza el bloque "Panel: Diseño" existente por ThemeSelector.
 *
 * 1. Agregar el import al inicio del archivo:
 */

import ThemeSelector from "@/components/dashboard/ThemeSelector"

/**
 * 2. En el JSX, reemplazar el panel de Diseño actual por:
 */

// Dentro del componente GalleryDetailPage:
// (gallery viene del estado, fetchGallery recarga desde la API)

{showDesign && (
  <div style={S.panel}>
    <div style={S.panelHeader}>
      <div>
        <p style={S.panelTitle}>Diseño de galería</p>
        <p style={S.panelSub}>
          Elegí el estilo visual. Los cambios se aplican al instante para tus clientes.
        </p>
      </div>
      <button style={S.closeBtn} onClick={() => setShowDesign(false)}>
        <X size={14} color="#94a3b8" />
      </button>
    </div>

    <ThemeSelector
      galleryId={gallery.id}
      currentSlug={gallery.themeSlug ?? "classic"}
      tokenOverrides={gallery.tokenOverrides ?? {}}
      onSaved={fetchGallery}
    />
  </div>
)}

/**
 * 3. En NewGalleryForm.js, el selector al crear también usa ThemeSelector
 *    pero en modo "solo selección" (sin tokenOverrides todavía):
 */

// En NewGalleryForm — sección Diseño visual:
import ThemeSelector from "@/components/dashboard/ThemeSelector"

// Estado:
const [themeSlug, setThemeSlug] = useState("classic")

// En el form submit, agregar al payload:
// themeSlug

// JSX — reemplazar la Card de "Diseño visual":
<Card>
  <CardHeader>
    <CardTitle className="text-base">Diseño visual</CardTitle>
    <CardDescription>
      Elegí cómo van a ver tu galería los clientes. Podés cambiarlo después.
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/*
      En creación no tenemos galleryId todavía,
      así que ThemeSelector actúa solo como picker visual.
      Controlamos el valor con estado local y lo enviamos en el submit.
    */}
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "12px",
    }}>
      {THEME_METADATA.map(theme => {
        const isSelected = themeSlug === theme.slug
        return (
          <button
            key={theme.slug}
            type="button"
            onClick={() => {
              setThemeSlug(theme.slug)
              setValue("themeSlug", theme.slug)
            }}
            style={{
              display: "flex", flexDirection: "column",
              padding: 0, borderRadius: "14px",
              border: `2px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
              background: isSelected ? "#f8fafc" : "white",
              cursor: "pointer", overflow: "hidden",
              textAlign: "left", fontFamily: "inherit",
              boxShadow: isSelected ? "0 0 0 3px rgba(15,23,42,0.08)" : "none",
            }}
          >
            {/* Thumbnail SVG */}
            <div style={{ width:"100%", aspectRatio:"16/10", background:"#f1f5f9" }}>
              {THUMBNAILS[theme.slug]}
            </div>
            <div style={{ padding: "10px 12px 12px" }}>
              <p style={{ fontSize:"13px", fontWeight:"700", margin:0 }}>{theme.name}</p>
              <p style={{ fontSize:"11px", color:"#9ca3af", margin:"3px 0 0" }}>
                {theme.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  </CardContent>
</Card>

/**
 * 4. En el schema Zod de NewGalleryForm, agregar:
 *    themeSlug: z.string().default("classic"),
 *
 * 5. En el payload del submit de NewGalleryForm, agregar:
 *    themeSlug: data.themeSlug ?? "classic",
 *
 * 6. En /api/galleries/route.js (POST), agregar themeSlug al create:
 *    await prisma.gallery.create({
 *      data: {
 *        ...
 *        themeSlug: body.themeSlug ?? "classic",
 *        tokenOverrides: {},
 *      }
 *    })
 */
