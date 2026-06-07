"use client"

/**
 * src/components/gallery/ui/FaceSearchModal.jsx
 * ─────────────────────────────────────────────────────────────
 * Modal de búsqueda facial por IA.
 * El usuario sube una foto suya y el sistema devuelve
 * las fotos de la galería donde aparece.
 * Independiente del theme — siempre el mismo.
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState, useEffect } from "react"

export default function FaceSearchModal({
  open,
  onClose,
  onSearch,
  results,
  loading,
  error,
  onZoom,
}) {
  const fileRef  = useRef(null)
  const [preview, setPreview] = useState(null)

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Limpiar preview al cerrar
  useEffect(() => {
    if (!open) setPreview(null)
  }, [open])

  const handleFile = async (file) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    await onSearch(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith("image/")) handleFile(file)
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--pb-color-surface)",
          borderRadius: "20px",
          width: "min(500px, 100%)",
          maxHeight: "90dvh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          fontFamily: "var(--pb-font-family)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: "1px solid var(--pb-color-border)",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontSize: "16px", fontWeight: "800",
              color: "var(--pb-color-text)", margin: 0,
            }}>
              🔍 Buscarme en las fotos
            </h2>
            <p style={{
              fontSize: "12px", color: "var(--pb-color-text-muted)",
              margin: "4px 0 0",
            }}>
              Subí una foto tuya y te encontramos en la galería
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "8px",
              border: "1px solid var(--pb-color-border)",
              background: "transparent",
              color: "var(--pb-color-text-muted)",
              cursor: "pointer", fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* Zona de upload */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed var(--pb-color-border)",
              borderRadius: "14px",
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "var(--pb-color-bg)",
              transition: "border-color 0.15s",
              position: "relative",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Tu foto"
                style={{
                  width: 80, height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                  margin: "0 auto 10px",
                  display: "block",
                  border: "3px solid var(--pb-color-accent)",
                }}
              />
            ) : (
              <div style={{
                width: 56, height: 56,
                borderRadius: "50%",
                background: "var(--pb-color-border)",
                margin: "0 auto 12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px",
              }}>
                📸
              </div>
            )}

            <p style={{
              fontSize: "14px", fontWeight: "600",
              color: "var(--pb-color-text)", margin: "0 0 4px",
            }}>
              {preview ? "Cambiar foto" : "Arrastrá o tocá para subir"}
            </p>
            <p style={{
              fontSize: "12px", color: "var(--pb-color-text-muted)", margin: 0,
            }}>
              JPG o PNG — mejor una foto de tu cara clara
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={e => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* Estado: cargando */}
          {loading && (
            <div style={{
              textAlign: "center", padding: "24px 0",
              color: "var(--pb-color-text-muted)", fontSize: "14px",
            }}>
              <div style={{
                width: 32, height: 32,
                border: "3px solid var(--pb-color-border)",
                borderTopColor: "var(--pb-color-accent)",
                borderRadius: "50%",
                animation: "pb-spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }} />
              Analizando la foto…
              <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              marginTop: "16px", padding: "12px 16px",
              background: "#fef2f2", borderRadius: "10px",
              border: "1px solid #fecaca",
              color: "#dc2626", fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          {/* Resultados */}
          {!loading && results.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <p style={{
                fontSize: "13px", fontWeight: "700",
                color: "var(--pb-color-text)",
                marginBottom: "12px",
              }}>
                Encontramos {results.length} foto{results.length !== 1 ? "s" : ""} con tu cara
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: "8px",
              }}>
                {results.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => { onZoom(photo); onClose() }}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "8px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--pb-color-accent)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
                  >
                    <img
                      src={photo.bunnyUrl}
                      alt=""
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover", display: "block",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && !error && preview && results.length === 0 && (
            <div style={{
              marginTop: "20px", textAlign: "center",
              padding: "20px 0", color: "var(--pb-color-text-muted)",
              fontSize: "13px",
            }}>
              No encontramos fotos con tu cara en esta galería.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
