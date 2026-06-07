const CART_KEY = "pm_cart"
const FAVORITES_KEY = "pm_favorites"

// Clave única por ítem: misma foto puede estar como "digital", "print" o "both"
export function cartItemKey(photoId, itemType = "digital") {
    return `${photoId}__${itemType}`
}

// ── CARRITO ──────────────────────────────────────────

export function getCart() {
    if (typeof window === "undefined") return []
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || "[]")
    } catch {
        return []
    }
}

export function addToCart(photo) {
    const cart = getCart()
    const key = cartItemKey(photo.id, photo.itemType || "digital")
    const exists = cart.find((p) => cartItemKey(p.id, p.itemType) === key)
    if (exists) return cart
    const item = {
        ...photo,
        itemType: photo.itemType || "digital",
        _key: key,
    }
    const updated = [...cart, item]
    localStorage.setItem(CART_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("cart-updated"))
    return updated
}

export function removeFromCart(photoId, itemType = "digital") {
    const key = cartItemKey(photoId, itemType)
    const updated = getCart().filter((p) => cartItemKey(p.id, p.itemType) !== key)
    localStorage.setItem(CART_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("cart-updated"))
    return updated
}

export function isInCart(photoId, itemType = "digital") {
    const key = cartItemKey(photoId, itemType)
    return getCart().some((p) => cartItemKey(p.id, p.itemType) === key)
}

// Devuelve el itemType que ya está en carrito para esta foto (o null)
export function getCartItemType(photoId) {
    const item = getCart().find((p) => p.id === photoId)
    return item?.itemType ?? null
}

export function clearCart() {
    localStorage.removeItem(CART_KEY)
    window.dispatchEvent(new Event("cart-updated"))
}

export function getCartCount() {
    return getCart().length
}

// ── FAVORITOS ────────────────────────────────────────

export function getFavorites() {
    if (typeof window === "undefined") return []
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")
    } catch {
        return []
    }
}

export function toggleFavorite(photo) {
    const favs = getFavorites()
    const exists = favs.find((p) => p.id === photo.id)
    const updated = exists
        ? favs.filter((p) => p.id !== photo.id)
        : [...favs, photo]
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("favorites-updated"))
    return updated
}

export function isFavorite(photoId) {
    return getFavorites().some((p) => p.id === photoId)
}
