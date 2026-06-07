"use client"

/**
 * src/components/dashboard/ThemeSelector.jsx
 * ─────────────────────────────────────────────────────────────
 * Selector de theme para el dashboard del fotógrafo.
 * Muestra los themes disponibles en cards con preview SVG,
 * permite elegir y opcionalmente ajustar tokens de color.
 *
 * Props:
 *   galleryId      → id de la galería
 *   currentSlug    → themeSlug actual de la galería
 *   tokenOverrides → JSON de overrides actuales
 *   onSaved        → callback al guardar exitosamente
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect } from "react"
import { THEME_METADATA } from "@/themes/registry.js"
import { Check, Loader2, ChevronDown, ChevronUp } from "lucide-react"

// Thumbnails SVG inline por slug (sin imágenes externas)
const THUMBNAILS = {
  classic: (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="160" height="100" fill="#f8fafc"/>
      <rect width="160" height="36" fill="#0f172a"/>
      <rect x="10" y="10" width="60" height="8" rx="2" fill="rgba(255,255,255,0.75)"/>
      <rect x="10" y="22" width="36" height="5" rx="1" fill="rgba(255,255,255,0.3)"/>
      <circle cx="18" cy="32" r="6" fill="#4f46e5"/>
      {[0,1,2,3].map(i => (
        <rect key={i} x={10+i*38} y="44" width="33" height="22" rx="3"
          fill={i%2===0?"#e2e8f0":"#cbd5e1"}/>
      ))}
      {[0,1,2,3].map(i => (
        <rect key={i} x={10+i*38} y="70" width="33" height="20" rx="3"
          fill={i%2===0?"#cbd5e1":"#e2e8f0"}/>
      ))}
    </svg>
  ),
  cinematic: (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="160" height="100" fill="#080808"/>
      <rect x="0" y="14" width="160" height="72" fill="#1c1c1e"/>
      <rect x="0" y="0" width="160" height="14" fill="#080808"/>
      <rect x="0" y="86" width="160" height="14" fill="#080808"/>
      <rect x="12" y="22" width="70" height="8" rx="2" fill="rgba(255,255,255,0.7)"/>
      <rect x="12" y="34" width="44" height="5" rx="1" fill="rgba(255,255,255,0.3)"/>
      <circle cx="12" cy="58" r="10" fill="rgba(255,255,255,0.07)"/>
      <circle cx="148" cy="58" r="10" fill="rgba(255,255,255,0.07)"/>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={12+i*30} y="72" width="24" height="16" rx="2"
          fill={i===2?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.07)"}/>
      ))}
    </svg>
  ),
  minimal: (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="160" height="100" fill="#ffffff"/>
      <rect x="10" y="8" width="40" height="6" rx="2" fill="#111827"/>
      <rect x="110" y="8" width="40" height="6" rx="2" fill="#e5e7eb"/>
      <line x1="0" y1="22" x2="160" y2="22" stroke="#f3f4f6" strokeWidth="1"/>
      <rect x="10" y="28" width="140" height="58" rx="4" fill="#f3f4f6"/>
      <circle cx="72" cy="92" r="3" fill="#d1d5db"/>
      <circle cx="80" cy="92" r="3" fill="#111827"/>
      <circle cx="88" cy="92" r="3" fill="#d1d5db"/>
    </svg>
  ),
  magazine: (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="160" height="100" fill="#f5f0eb"/>
      <rect x="10" y="8" width="50" height="7" rx="2" fill="#292524"/>
      <rect x="10" y="19" width="30" height="4" rx="1" fill="#a8a29e"/>
      <rect x="10" y="28" width="70" height="62" rx="3" fill="#d6cfc8"/>
      <rect x="84" y="28" width="66" height="30" rx="3" fill="#c8c1ba"/>
      <rect x="84" y="61" width="66" height="29" rx="3" fill="#d6cfc8"/>
    </svg>
  ),
}

// Tokens que el fotógrafo puede ajustar (subconjunto seguro)
// El admin puede ampliar esta lista en el futuro
const EDITABLE_TOKENS = [
  { key: "colorAccent",    label: "Color de acento",      type: "color" },
  { key: "colorBg",        label: "Color de fondo",        type: "color" },
  { key: "colorSurface",   label: "Color de superficie",   type: "color" },
  { key: "colorText",      label: "Color de texto",        type: "color" },
  { key: "photoRadius",    label: "Redondez de fotos",     type: "select",
    options: ["0px","4px","8px","12px","16px","24px"] },
  { key: "photoGap",       label: "Espacio entre fotos",   type: "select",
    options: ["2px","6px","10px","14px","20px"] },
  { key: "transitionSpeed",label: "Velocidad de animación",type: "select",
    options: ["0s","0.1s","0.2s","0.3s","0.5s"] },
]

// Tokens de paleta para galerías de evento
// Usan los mismos tokens del sistema — así cualquier theme aplica automáticamente.
const EDITABLE_TOKENS_EVENT = [
  { key: "colorBg",       label: "Fondo de la página",    type: "color" },
  { key: "colorHeroBg",   label: "Fondo del banner",      type: "color" },
  { key: "colorSurface",  label: "Fondo de tarjetas",     type: "color" },
  { key: "colorBorder",   label: "Color de bordes",       type: "color" },
  { key: "colorAccent",   label: "Color de acento",       type: "color" },
  { key: "colorAccentFg", label: "Texto sobre el acento", type: "color" },
  { key: "colorText",     label: "Color de texto",        type: "color" },
  { key: "colorTextMuted",label: "Texto secundario",      type: "color" },
]

export default function ThemeSelector({
  galleryId,
  currentSlug,
  tokenOverrides = {},
  onSaved,
  isEventGallery = false,
}) {
  const [selectedSlug, setSelectedSlug]       = useState(currentSlug ?? "classic")
  const [overrides, setOverrides]             = useState(tokenOverrides)
  const [saving, setSaving]                   = useState(false)
  const [saved, setSaved]                     = useState(false)
  const [showTokens, setShowTokens]           = useState(false)

  // Sincronizar cuando la galería llega del fetch del padre.
  // useState() solo inicializa en el primer render — si los props llegan
  // después del mount (fetch async), el estado queda con el valor inicial stale.
  useEffect(() => {
    setSelectedSlug(currentSlug ?? "classic")
    setOverrides(tokenOverrides)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId])

  const isDirty = selectedSlug !== currentSlug ||
    JSON.stringify(overrides) !== JSON.stringify(tokenOverrides)

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    const res = await fetch(`/api/galleries/${galleryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeSlug:      selectedSlug,
        tokenOverrides: overrides,
      }),
    })
    if (res.ok) {
      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }, [galleryId, selectedSlug, overrides, onSaved])

  const setToken = (key, value) => {
    setOverrides(prev => ({ ...prev, [key]: value }))
  }

  const resetToken = (key) => {
    setOverrides(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Grid de themes ─────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "12px",
      }}>
        {THEME_METADATA.map(theme => {
          const isSelected = selectedSlug === theme.slug
          return (
            <button
              key={theme.slug}
              type="button"
              onClick={() => setSelectedSlug(theme.slug)}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 0,
                borderRadius: "14px",
                border: `2px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
                background: isSelected ? "#f8fafc" : "white",
                cursor: "pointer",
                overflow: "hidden",
                textAlign: "left",
                fontFamily: "inherit",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(15,23,42,0.08)"
                  : "none",
                transition: "border-color .15s, box-shadow .15s",
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: "100%",
                aspectRatio: "16/10",
                background: "#f1f5f9",
                overflow: "hidden",
                position: "relative",
              }}>
                {THUMBNAILS[theme.slug] ?? (
                  <div style={{
                    width: "100%", height: "100%",
                    background: "linear-gradient(135deg,#1e293b,#334155)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "600",
                  }}>
                    {theme.name}
                  </div>
                )}

                {/* Badge seleccionado */}
                {isSelected && (
                  <div style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: "#0f172a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={11} color="white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "10px 12px 12px" }}>
                <p style={{
                  fontSize: "13px", fontWeight: "700", margin: 0,
                  color: isSelected ? "#0f172a" : "#374151",
                }}>
                  {theme.name}
                </p>
                <p style={{
                  fontSize: "11px", color: "#9ca3af",
                  margin: "3px 0 0", lineHeight: 1.4,
                }}>
                  {theme.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Ajustes de tokens (colapsable) ─────────────────── */}
      <div style={{
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <button
          type="button"
          onClick={() => setShowTokens(v => !v)}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            background: "#f8fafc",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "13px", fontWeight: "600", color: "#374151",
          }}
        >
          <span>Ajustes avanzados de color y estilo</span>
          {showTokens
            ? <ChevronUp size={15} color="#94a3b8" />
            : <ChevronDown size={15} color="#94a3b8" />
          }
        </button>

        {showTokens && (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Título de sección */}
            {isEventGallery && (
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                Paleta del evento
              </p>
            )}
            {(isEventGallery ? EDITABLE_TOKENS_EVENT : EDITABLE_TOKENS).map(token => {
              const currentValue = overrides[token.key]
              const hasOverride  = currentValue !== undefined

              return (
                <div key={token.key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Label */}
                  <label style={{
                    fontSize: "12px", fontWeight: "600", color: "#374151",
                    flex: "0 0 160px", lineHeight: 1.3,
                  }}>
                    {token.label}
                    {hasOverride && (
                      <span style={{
                        marginLeft: "6px", fontSize: "10px",
                        color: "#6366f1", fontWeight: "700",
                      }}>
                        EDITADO
                      </span>
                    )}
                  </label>

                  {/* Control */}
                  {token.type === "color" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="color"
                        value={currentValue ?? "#000000"}
                        onChange={e => setToken(token.key, e.target.value)}
                        style={{
                          width: "36px", height: "36px",
                          padding: "2px", border: "1px solid #e2e8f0",
                          borderRadius: "8px", cursor: "pointer", background: "white",
                        }}
                      />
                      <input
                        type="text"
                        value={currentValue ?? ""}
                        onChange={e => setToken(token.key, e.target.value)}
                        placeholder="ej: #0f172a"
                        style={{
                          width: "90px", padding: "7px 10px",
                          fontSize: "12px", fontFamily: "monospace",
                          border: "1px solid #e2e8f0", borderRadius: "8px",
                          outline: "none", color: "#0f172a",
                        }}
                      />
                    </div>
                  )}

                  {token.type === "select" && (
                    <select
                      value={currentValue ?? ""}
                      onChange={e => setToken(token.key, e.target.value)}
                      style={{
                        padding: "7px 10px",
                        fontSize: "12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        background: "white",
                        color: "#0f172a",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    >
                      <option value="">Por defecto</option>
                      {token.options.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  )}

                  {/* Resetear override */}
                  {hasOverride && (
                    <button
                      type="button"
                      onClick={() => resetToken(token.key)}
                      style={{
                        fontSize: "11px", color: "#94a3b8",
                        background: "none", border: "none",
                        cursor: "pointer", padding: "4px",
                        fontFamily: "inherit",
                      }}
                      title="Restaurar valor del theme"
                    >
                      ✕ resetear
                    </button>
                  )}
                </div>
              )
            })}

            {/* Resetear todo */}
            {Object.keys(overrides).length > 0 && (
              <button
                type="button"
                onClick={() => setOverrides({})}
                style={{
                  alignSelf: "flex-start",
                  fontSize: "12px", color: "#ef4444",
                  background: "none", border: "none",
                  cursor: "pointer", padding: "4px",
                  fontFamily: "inherit", fontWeight: "600",
                }}
              >
                Restaurar todos los valores del theme
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Botón guardar ──────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 18px",
            borderRadius: "10px", border: "none",
            background: saved
              ? "#10b981"
              : isDirty
              ? "#0f172a"
              : "#e2e8f0",
            color: isDirty || saved ? "white" : "#94a3b8",
            fontSize: "13px", fontWeight: "700",
            cursor: saving || !isDirty ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "background .2s",
          }}
        >
          {saving ? (
            <><Loader2 size={14} style={{ animation: "pb-spin 1s linear infinite" }} /> Guardando...</>
          ) : saved ? (
            <><Check size={14} /> Guardado</>
          ) : (
            "Guardar diseño"
          )}
        </button>

        {isDirty && !saving && (
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Tenés cambios sin guardar
          </span>
        )}
      </div>

      <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
