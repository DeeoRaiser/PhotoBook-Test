/**
 * Dado un rango y la cantidad seleccionada, devuelve el tier que aplica.
 */
function findTier(tiers, qty) {
    const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty)
    return (
        sorted.find((t) => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty))
        || sorted[sorted.length - 1]   // si supera el último rango, usar ese
    )
}

/**
 * Calcula el precio total y el precio por foto según el modo de la galería.
 *
 * Modo "per_photo" : cada foto tiene su precio individual.
 * Modo "tiered"    : tier.price es el PRECIO POR FOTO dentro del rango.
 *                    total = tier.price × qty
 *
 * @param {object}   gallery          - { pricingMode, pricingTiers, photos }
 * @param {string[]} selectedPhotoIds - IDs seleccionados
 * @returns {{ total: number, pricePerPhoto: number, tierLabel: string|null }}
 */
export function calcPrice(gallery, selectedPhotoIds) {
    const qty = selectedPhotoIds.length

    if (qty === 0) return { total: 0, pricePerPhoto: 0, tierLabel: null }

    if (gallery.pricingMode === "tiered" && gallery.pricingTiers?.length > 0) {
        const tier = findTier(gallery.pricingTiers, qty)
        const pricePerPhoto = Number(tier.price)
        const total = pricePerPhoto * qty

        const rangeLabel = tier.maxQty
            ? `${tier.minQty}–${tier.maxQty} fotos`
            : `${tier.minQty}+ fotos`

        return { total, pricePerPhoto, tierLabel: rangeLabel }
    }

    // per_photo: sumar precios individuales
    const photosMap = Object.fromEntries((gallery.photos || []).map((p) => [p.id, p]))
    const total = selectedPhotoIds.reduce((sum, id) => sum + Number(photosMap[id]?.price || 0), 0)
    return {
        total,
        pricePerPhoto: qty > 0 ? total / qty : 0,
        tierLabel: null,
    }
}

/**
 * Precio que se guarda en cada OrderItem al crear la orden.
 * Siempre es el precio unitario (por foto) para ese item.
 */
export function calcItemPrice(gallery, selectedPhotoIds, photoId) {
    if (gallery.pricingMode === "tiered" && gallery.pricingTiers?.length > 0) {
        const tier = findTier(gallery.pricingTiers, selectedPhotoIds.length)
        return Number(tier.price)   // precio por foto del rango
    }
    const photo = (gallery.photos || []).find((p) => p.id === photoId)
    return photo ? Number(photo.price) : 0
}
