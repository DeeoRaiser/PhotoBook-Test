"use client"

/**
 * src/components/gallery/logic/usePhotoZoom.js
 * Maneja la foto en zoom con navegación prev/next.
 * Idéntico en todos los themes.
 */

import { useState, useCallback } from "react"

export function usePhotoZoom(photos = []) {
  const [zoomedIndex, setZoomedIndex] = useState(null)

  const openZoom = useCallback((photo) => {
    const idx = photos.findIndex(p => p.id === photo.id)
    setZoomedIndex(idx >= 0 ? idx : null)
  }, [photos])

  const closeZoom = useCallback(() => setZoomedIndex(null), [])

  const goNext = useCallback(() => {
    setZoomedIndex(prev =>
      prev === null ? null : (prev + 1) % photos.length
    )
  }, [photos.length])

  const goPrev = useCallback(() => {
    setZoomedIndex(prev =>
      prev === null ? null : (prev - 1 + photos.length) % photos.length
    )
  }, [photos.length])

  // Navegación por teclado
  // (se monta en PhotoModal — no acá, para no duplicar listeners)

  const zoomedPhoto = zoomedIndex !== null ? photos[zoomedIndex] : null

  return { zoomedPhoto, openZoom, closeZoom, goNext, goPrev }
}
