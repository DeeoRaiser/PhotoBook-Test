"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, X, Trash2, ShoppingBag, Tag, Printer, ImageIcon } from "lucide-react"
import { getCart, removeFromCart, clearCart } from "@/lib/cart"
import { Button } from "@/components/ui/button"
import CheckoutModal from "@/components/checkout-modal"
import { calcPrice } from "@/lib/pricing"

export default function CartDrawer({ galleryId, hasMpToken, gallery }) {
    const [open, setOpen] = useState(false)
    const [cart, setCart] = useState([])
    const [showCheckout, setShowCheckout] = useState(false)

    useEffect(() => {
        setCart(getCart())
        const sync = () => setCart(getCart())
        window.addEventListener("cart-updated", sync)
        return () => window.removeEventListener("cart-updated", sync)
    }, [])

    const isTiered = gallery?.pricingMode === "tiered"

    // IDs de fotos que llevan precio digital (digital o ambas)
    const digitalIds = cart.filter((p) => p.itemType !== "print").map((p) => p.id)

    // Tier actual segun cantidad de digitales en el carrito
    const currentTier = (() => {
        if (!isTiered || !gallery?.pricingTiers?.length) return null
        const tiers = [...gallery.pricingTiers].sort((a, b) => a.minQty - b.minQty)
        const qty = digitalIds.length
        return qty > 0
            ? (tiers.find((t) => qty >= Number(t.minQty) && (t.maxQty === null || qty <= Number(t.maxQty))) || tiers[tiers.length - 1])
            : null
    })()

    // tierLabel: usar calcPrice solo para obtener el label del rango actual
    const { tierLabel } = gallery && isTiered
        ? calcPrice(gallery, digitalIds.length ? digitalIds : cart.map((p) => p.id))
        : { tierLabel: null }

    // Precio total de impresion de un item (suma de pricePerCopy * qty por cada tamanio)
    const getItemPrintTotal = (item) =>
        (item.printSelections || []).reduce((s, sel) => s + Number(sel.pricePerCopy) * sel.qty, 0)

    // Precio por item segun su tipo y el tier actual (para mostrarlo en el drawer)
    const getItemDisplayPrice = (item) => {
        const printTotal = getItemPrintTotal(item)
        if (!isTiered || !currentTier) {
            if (item.itemType === "print") return printTotal
            if (item.itemType === "both")  return Number(currentTier?.price ?? item.price) + printTotal
            return Number(item.price)
        }
        const tierPrice = Number(currentTier.price)
        if (item.itemType === "print") return printTotal
        if (item.itemType === "both")  return tierPrice + printTotal
        return tierPrice
    }

    // Total correcto según itemType:
    //   per_photo  → p.price ya tiene el valor correcto guardado (digital, print o digital+print)
    //   tiered     → tier.price * cant_digitales + printPrice * cant_con_impresion
    const total = (() => {
        if (!gallery) return 0
        if (isTiered && currentTier) {
            const tierPrice = Number(currentTier.price)
            const digitalTotal = tierPrice * digitalIds.length
            const printTotal = cart.reduce((sum, p) => {
                if (p.itemType === "print" || p.itemType === "both") {
                    return sum + (p.printSelections || []).reduce((s, sel) => s + Number(sel.pricePerCopy) * sel.qty, 0)
                }
                return sum
            }, 0)
            return digitalTotal + printTotal
        }
        if (isTiered && cart.length > 0 && !currentTier) {
            return cart.reduce((sum, p) => sum + (p.printSelections || []).reduce((s, sel) => s + Number(sel.pricePerCopy) * sel.qty, 0), 0)
        }
        // per_photo: p.price ya fue calculado correctamente al agregar
        return cart.reduce((sum, p) => sum + Number(p.price), 0)
    })()

    const typeLabel = { digital: "Digital", print: "Impresa", both: "Digital + Impresión" }
    const typeColor = { digital: "#0284c7", print: "#ea580c", both: "#7c3aed" }
    const typeIcon  = {
        digital: <ImageIcon size={10} />,
        print:   <Printer size={10} />,
        both:    <><ImageIcon size={10} /><span style={{ fontSize: 8 }}>+</span><Printer size={10} /></>,
    }

    const handleRemove = (photoId, itemType = "digital") => {
        removeFromCart(photoId, itemType)
        setCart(getCart())
    }

    const handleClear = () => {
        clearCart()
        setCart([])
    }

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 bg-neutral-900 text-white rounded-full p-4 shadow-lg hover:bg-neutral-700 transition-colors z-40 flex items-center gap-2"
            >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                    <span className="bg-white text-neutral-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cart.length}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={18} className="text-neutral-700" />
                        <h2 className="font-semibold text-neutral-900">Tu carrito</h2>
                        {cart.length > 0 && (
                            <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full">
                                {cart.length}
                            </span>
                        )}
                    </div>
                    <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-3">
                            <ShoppingBag size={40} className="opacity-30" />
                            <p className="text-sm">Tu carrito está vacío</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {cart.map((photo) => (
                                <div key={photo._key || photo.id} className="flex items-center gap-3 px-5 py-3.5">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                                        <img
                                            src={photo.bunnyUrl || photo.previewUrl}
                                            alt={photo.title || "Foto"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-neutral-800 truncate">
                                            {photo.title || "Foto"}
                                        </p>
                                        {!isTiered && (
                                            <>
                                            
                                            <p className="text-sm text-neutral-500">${getItemDisplayPrice(photo).toFixed(2)}</p>
                                            {photo.printSelections?.length > 0 && (
                                                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                                                    {photo.printSelections.map((sel, i) => (
                                                        <span key={i} style={{
                                                            fontSize: 10, color: "#ea580c",
                                                            display: "flex", alignItems: "center", gap: 3,
                                                        }}>
                                                            <Printer size={9} />
                                                            {sel.label} × {sel.qty} = ${(Number(sel.pricePerCopy) * sel.qty).toLocaleString("es-AR")}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            </>
                                        )}
                                        {photo.itemType && (
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 3,
                                                fontSize: 9, fontWeight: 700, marginTop: 2,
                                                color: typeColor[photo.itemType],
                                                background: photo.itemType === "print" ? "#fff7ed" : photo.itemType === "both" ? "#faf5ff" : "#f0f9ff",
                                                border: `1px solid ${photo.itemType === "print" ? "#fed7aa" : photo.itemType === "both" ? "#ddd6fe" : "#bae6fd"}`,
                                                padding: "1px 6px", borderRadius: 20,
                                            }}>
                                                {typeIcon[photo.itemType]} {typeLabel[photo.itemType]}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemove(photo.id, photo.itemType)}
                                        className="text-neutral-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t border-neutral-100 px-5 py-4 space-y-3">
                        {/* Tier label si aplica */}
                        {isTiered && (tierLabel || digitalIds.length > 0) && (() => {
                            const printItems  = cart.filter((p) => p.itemType === "print" || p.itemType === "both")
                            const printTotal  = printItems.reduce((s, p) => s + (p.printSelections || []).reduce((ss, sel) => ss + Number(sel.pricePerCopy) * sel.qty, 0), 0)
                            const digitalTotal = currentTier ? Number(currentTier.price) * digitalIds.length : 0
                            return (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
                                    {/* Linea digitales */}
                                    {digitalIds.length > 0 && currentTier && (
                                        <div className="flex items-center gap-2">
                                            <Tag size={13} className="text-amber-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                {tierLabel && <p className="text-xs text-amber-700 font-semibold">{tierLabel}</p>}
                                                <p className="text-xs text-amber-600">
                                                    ${Number(currentTier.price).toLocaleString("es-AR")}/foto × {digitalIds.length} foto{digitalIds.length !== 1 ? "s" : ""} = ${digitalTotal.toLocaleString("es-AR")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Linea impresiones */}
                                    {printItems.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <Printer size={13} className="text-orange-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-orange-600 font-medium">Impresiones = ${printTotal.toLocaleString("es-AR")}</p>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">Total</span>
                            <span className="text-lg font-semibold text-neutral-900">${total.toFixed(2)}</span>
                        </div>
                        <Button
                            className="w-full gap-2"
                            onClick={() => { setOpen(false); setShowCheckout(true) }}
                        >
                            <ShoppingBag size={16} />
                            Realizar pedido
                        </Button>
                        <button
                            onClick={handleClear}
                            className="w-full text-xs text-neutral-400 hover:text-red-500 transition-colors text-center"
                        >
                            Vaciar carrito
                        </button>
                    </div>
                )}
            </div>

            {/* Modal checkout */}
            {showCheckout && (
                <CheckoutModal
                    galleryId={galleryId}
                    hasMpToken={hasMpToken}
                    gallery={gallery}
                    onClose={() => { setShowCheckout(false); setCart(getCart()) }}
                />
            )}
        </>
    )
}