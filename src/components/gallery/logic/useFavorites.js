"use client"

/**
 * src/components/gallery/logic/useFavorites.js
 * Maneja favoritos con persistencia en localStorage.
 * Idéntico en todos los themes.
 */

import { useState, useEffect, useCallback } from "react"

const key = (galleryId) => `pb_favs_${galleryId}`

export function useFavorites(galleryId) {
  const [favorites, setFavorites] = useState(() => new Set())

  // Cargar desde localStorage al montar
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key(galleryId)) ?? "[]")
      setFavorites(new Set(stored))
    } catch {
      setFavorites(new Set())
    }
  }, [galleryId])

  // Persistir cuando cambian
  useEffect(() => {
    try {
      localStorage.setItem(key(galleryId), JSON.stringify([...favorites]))
    } catch { }
  }, [favorites, galleryId])

  const toggleFavorite = useCallback((photoId) => {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(photoId) ? next.delete(photoId) : next.add(photoId)
      return next
    })
  }, [])

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  return { favorites, toggleFavorite, showFavoritesOnly, setShowFavoritesOnly }
}
