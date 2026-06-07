"use client"

/**
 * src/components/gallery/logic/useCart.js
 * Maneja el carrito con persistencia en localStorage.
 * Compatible con lib/cart.js (getCart, addToCart, removeFromCart, clearCart).
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import {
    getCart,
    addToCart as libAddToCart,
    removeFromCart as libRemoveFromCart,
    getCartItemType,
} from "@/lib/cart"

export function useCart(galleryId) {
    const [cartItems, setCartItems] = useState([])
    const [cartOpen, setCartOpen]   = useState(false)

    // Sincronizar con localStorage al montar y cuando cart-updated dispara
    useEffect(() => {
        const sync = () => setCartItems(getCart())
        sync()
        window.addEventListener("cart-updated", sync)
        return () => window.removeEventListener("cart-updated", sync)
    }, [])

    /**
     * addToCart(photo, type, printSelections)
     * - photo: objeto foto completo
     * - type: "digital" | "print" | "both"
     * - printSelections: array de { sizeId, label, qty, pricePerCopy }
     */
    const addToCart = useCallback((photo, type = "digital", printSelections = []) => {
        libAddToCart({
            id:              photo.id,
            title:           photo.title,
            price:           photo.price,
            itemType:        type,
            printSelections: type !== "digital" ? printSelections : undefined,
            previewUrl:      photo.previewUrl ?? photo.bunnyUrl,
            bunnyUrl:        photo.bunnyUrl,
        })
    }, [])

    const removeFromCart = useCallback((photoId, type = "digital") => {
        libRemoveFromCart(photoId, type)
    }, [])

    const getItemType = useCallback((photoId) => {
        return getCartItemType(photoId)
    }, [])

    const cartTotal = useMemo(
        () => cartItems.reduce((sum, i) => sum + Number(i.price), 0),
        [cartItems]
    )

    const openCart  = useCallback(() => setCartOpen(true),  [])
    const closeCart = useCallback(() => setCartOpen(false), [])

    return {
        cartItems, addToCart, removeFromCart, getItemType,
        cartOpen, openCart, closeCart,
        cartTotal,
    }
}
