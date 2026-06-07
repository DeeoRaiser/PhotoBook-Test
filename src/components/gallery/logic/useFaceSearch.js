"use client"

/**
 * src/components/gallery/logic/useFaceSearch.js
 * Maneja la búsqueda facial por IA.
 * Idéntico en todos los themes.
 */

import { useState, useCallback } from "react"

export function useFaceSearch(galleryId) {
  const [faceSearchOpen,    setFaceSearchOpen]    = useState(false)
  const [faceSearchResults, setFaceSearchResults] = useState([])
  const [faceSearchLoading, setFaceSearchLoading] = useState(false)
  const [faceSearchError,   setFaceSearchError]   = useState(null)

  const openFaceSearch  = useCallback(() => setFaceSearchOpen(true),  [])
  const closeFaceSearch = useCallback(() => {
    setFaceSearchOpen(false)
    setFaceSearchResults([])
    setFaceSearchError(null)
  }, [])

  const searchByFace = useCallback(async (imageFile) => {
    setFaceSearchLoading(true)
    setFaceSearchError(null)
    setFaceSearchResults([])

    try {
      const formData = new FormData()
      formData.append("image", imageFile)
      formData.append("galleryId", galleryId)

      const res = await fetch("/api/face-search", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Error en la búsqueda")
      }

      const { photos } = await res.json()
      setFaceSearchResults(photos ?? [])
    } catch (err) {
      setFaceSearchError(err.message)
    } finally {
      setFaceSearchLoading(false)
    }
  }, [galleryId])

  return {
    faceSearchOpen,
    openFaceSearch,
    closeFaceSearch,
    faceSearchResults,
    faceSearchLoading,
    faceSearchError,
    searchByFace,
  }
}
