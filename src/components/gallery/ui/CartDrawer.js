"use client"

/**
 * src/components/gallery/ui/CartDrawer.js
 * Drawer lateral del carrito.
 * Usa CheckoutModal de producción para el flujo de pago.
 */

import { useState, useEffect } from "react"
import { ShoppingCart, X, Trash2, ShoppingBag, Printer, ImageIcon, Tag } from "lucide-react"
import CheckoutModal from "@/components/checkout-modal"
import { clearCart } from "@/lib/cart"
import { calcPrice } from "@/lib/pricing"

export default function CartDrawer({ open, onClose, items, onRemove, total, gallery }) {
    const [showCheckout, setShowCheckout] = useState(false)

    // Bloquear scroll cuando está abierto
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [open])

    // Cerrar con Escape
    useEffect(() => {
        if (!open) return
        const handler = (e) => { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [open, onClose])

    const isTiered = gallery?.pricingMode === "tiered"

    // IDs de fotos digitales
    const digitalItems = items.filter((i) => (i.itemType || i.type) !== "print")
    const digitalIds   = digitalItems.map((i) => i.id || i.photoId)

    // Tier actual según cantidad de digitales
    const currentTier = (() => {
        if (!isTiered || !gallery?.pricingTiers?.length) return null
        const tiers = [...gallery.pricingTiers].sort((a, b) => a.minQty - b.minQty)
        const qty = digitalIds.length
        return qty > 0
            ? (tiers.find((t) => qty >= Number(t.minQty) && (t.maxQty === null || qty <= Number(t.maxQty))) || tiers[tiers.length - 1])
            : null
    })()

    const { tierLabel } = gallery && isTiered
        ? calcPrice(gallery, digitalIds.length ? digitalIds : items.map((i) => i.id || i.photoId))
        : { tierLabel: null }

    // Total de impresiones
    const getPrintTotal = (item) =>
        (item.printSelections || []).reduce((s, sel) => s + Number(sel.pricePerCopy) * sel.qty, 0)

    // Total correcto
    const computedTotal = (() => {
        if (!gallery) return total
        if (isTiered && currentTier) {
            const tierPrice   = Number(currentTier.price)
            const digitalTotal = tierPrice * digitalIds.length
            const printTotal  = items.reduce((sum, i) => {
                const t = i.itemType || i.type
                return (t === "print" || t === "both")
                    ? sum + getPrintTotal(i)
                    : sum
            }, 0)
            return digitalTotal + printTotal
        }
        return total
    })()

    const typeLabel = { digital: "Digital", print: "Impresa", both: "Digital + Impresión" }
    const typeColor = { digital: "#0284c7", print: "#ea580c", both: "#7c3aed" }

    const handleClear = () => {
        clearCart()
    }

    return (
        <>
            {/* Backdrop */}
            {open && (
                <div
                    onClick={onClose}
                    style={{
                        position: "fixed", inset: 0, zIndex: 9000,
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                    }}
                />
            )}

            {/* Panel */}
            <div style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: "min(400px, 95vw)",
                zIndex: 9001,
                background: "var(--pb-color-surface, #fff)",
                borderLeft: "1px solid var(--pb-color-border, #e2e8f0)",
                boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
                display: "flex", flexDirection: "column",
                transform: open ? "translateX(0)" : "translateX(100%)",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                fontFamily: "var(--pb-font-family, 'DM Sans', system-ui, sans-serif)",
            }}>

                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "18px 20px",
                    borderBottom: "1px solid var(--pb-color-border, #e2e8f0)",
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShoppingCart size={18} />
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--pb-color-text, #0f172a)", margin: 0 }}>
                            Tu carrito {items.length > 0 && `(${items.length})`}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: "1px solid var(--pb-color-border, #e2e8f0)",
                            background: "transparent",
                            color: "var(--pb-color-text-muted, #94a3b8)",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Items */}
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
                    {items.length === 0 ? (
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", height: "100%",
                            color: "var(--pb-color-text-muted, #94a3b8)", gap: 12,
                        }}>
                            <ShoppingBag size={40} style={{ opacity: 0.3 }} />
                            <p style={{ fontSize: 14, margin: 0 }}>Tu carrito está vacío</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {items.map((item) => {
                                const itemType = item.itemType || item.type || "digital"
                                const photoId  = item.id || item.photoId
                                return (
                                    <div key={item._key || `${photoId}-${itemType}`} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "12px 0",
                                        borderBottom: "1px solid var(--pb-color-border, #f1f5f9)",
                                    }}>
                                        <div style={{
                                            width: 56, height: 42, borderRadius: 8,
                                            overflow: "hidden", background: "#f1f5f9", flexShrink: 0,
                                        }}>
                                            <img
                                                src={item.previewUrl || item.photoUrl || item.bunnyUrl}
                                                alt={item.title || "Foto"}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 13, fontWeight: 600,
                                                color: "var(--pb-color-text, #0f172a)",
                                                margin: 0, whiteSpace: "nowrap",
                                                overflow: "hidden", textOverflow: "ellipsis",
                                            }}>
                                                {item.title || "Foto"}
                                            </p>
                                            {!isTiered && (
                                                <p style={{ fontSize: 12, color: "var(--pb-color-text-muted, #64748b)", margin: "2px 0 0" }}>
                                                    ${Number(item.price).toLocaleString("es-AR")}
                                                </p>
                                            )}
                                            {/* Print selections detail */}
                                            {item.printSelections?.length > 0 && (
                                                <div style={{ marginTop: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                                                    {item.printSelections.map((sel, i) => (
                                                        <span key={i} style={{ fontSize: 10, color: "#ea580c", display: "flex", alignItems: "center", gap: 3 }}>
                                                            <Printer size={9} />
                                                            {sel.label} × {sel.qty} = ${(Number(sel.pricePerCopy) * sel.qty).toLocaleString("es-AR")}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Tipo badge */}
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 3,
                                                fontSize: 9, fontWeight: 700, marginTop: 3,
                                                color: typeColor[itemType] || "#64748b",
                                                background: itemType === "print" ? "#fff7ed" : itemType === "both" ? "#faf5ff" : "#f0f9ff",
                                                border: `1px solid ${itemType === "print" ? "#fed7aa" : itemType === "both" ? "#ddd6fe" : "#bae6fd"}`,
                                                padding: "1px 6px", borderRadius: 20,
                                            }}>
                                                {itemType === "digital" && <ImageIcon size={9} />}
                                                {itemType === "print" && <Printer size={9} />}
                                                {itemType === "both" && <><ImageIcon size={9} /><Printer size={9} /></>}
                                                {typeLabel[itemType] || itemType}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onRemove(photoId, itemType)}
                                            style={{
                                                background: "none", border: "none",
                                                color: "#cbd5e1", cursor: "pointer",
                                                padding: 4, borderRadius: 6,
                                                display: "flex", alignItems: "center",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                                            onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div style={{
                        borderTop: "1px solid var(--pb-color-border, #e2e8f0)",
                        padding: "16px 20px",
                        flexShrink: 0,
                        display: "flex", flexDirection: "column", gap: 12,
                    }}>
                        {/* Tier info */}
                        {isTiered && (tierLabel || digitalIds.length > 0) && (() => {
                            const printItems  = items.filter((i) => { const t = i.itemType || i.type; return t === "print" || t === "both" })
                            const printTotal  = printItems.reduce((s, i) => s + getPrintTotal(i), 0)
                            const digitalTotal = currentTier ? Number(currentTier.price) * digitalIds.length : 0
                            return (
                                <div style={{
                                    background: "#fffbeb",
                                    border: "1px solid #fde68a",
                                    borderRadius: 10, padding: "10px 12px",
                                    display: "flex", flexDirection: "column", gap: 6,
                                }}>
                                    {digitalIds.length > 0 && currentTier && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <Tag size={13} color="#d97706" style={{ flexShrink: 0 }} />
                                            <div>
                                                {tierLabel && <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#92400e" }}>{tierLabel}</p>}
                                                <p style={{ margin: 0, fontSize: 11, color: "#b45309" }}>
                                                    ${Number(currentTier.price).toLocaleString("es-AR")}/foto × {digitalIds.length} = ${digitalTotal.toLocaleString("es-AR")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {printItems.length > 0 && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <Printer size={13} color="#ea580c" style={{ flexShrink: 0 }} />
                                            <p style={{ margin: 0, fontSize: 11, color: "#ea580c", fontWeight: 600 }}>
                                                Impresiones = ${printTotal.toLocaleString("es-AR")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}

                        {/* Total */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 14, color: "var(--pb-color-text-muted, #64748b)" }}>Total</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "var(--pb-color-text, #0f172a)" }}>
                                ${Number(computedTotal).toLocaleString("es-AR")}
                            </span>
                        </div>

                        {/* Botón checkout */}
                        <button
                            onClick={() => { onClose(); setShowCheckout(true) }}
                            style={{
                                width: "100%", padding: "13px",
                                borderRadius: "var(--pb-btn-radius, 12px)",
                                border: "none",
                                background: "var(--pb-color-accent, #0f172a)",
                                color: "var(--pb-color-accent-fg, white)",
                                fontSize: 14, fontWeight: 800,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                transition: "opacity 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                            <ShoppingBag size={16} />
                            Realizar pedido
                        </button>

                        <button
                            onClick={handleClear}
                            style={{
                                background: "none", border: "none",
                                fontSize: 12, color: "#94a3b8",
                                cursor: "pointer", fontFamily: "inherit",
                                textAlign: "center",
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
                        >
                            Vaciar carrito
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de checkout */}
            {showCheckout && (
                <CheckoutModal
                    galleryId={gallery?.id}
                    hasMpToken={gallery?.hasMpToken ?? false}
                    gallery={gallery}
                    onClose={() => setShowCheckout(false)}
                />
            )}
        </>
    )
}
