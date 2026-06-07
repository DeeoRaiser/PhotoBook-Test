"use client"

/**
 * src/components/gallery/ui/PhotoCard.js
 * Tarjeta de foto con soporte completo:
 * - Carrito digital / impresión / ambos
 * - Modal de selección de formato (FormatModal) cuando hay printSizes
 * - Favoritos
 * - Zoom
 * - Precios tiered y per_photo
 */

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ShoppingCart, Star, Check, Printer, ImageIcon, X } from "lucide-react"
import { getCart, getCartItemType } from "@/lib/cart"

// ── URL de imagen protegida (con watermark) ──────────────────────────────────
function protectedUrl(photoId, password = null) {
    const base = `/api/photos/protected/${photoId}`
    return password ? `${base}?pwd=${encodeURIComponent(password)}` : base
}


const ASPECT_MAP = {
    "4/3":  "4/3",
    "3/2":  "3/2",
    "1/1":  "1/1",
    "16/9": "16/9",
    "free": null,
}

// ── Helpers de precio ────────────────────────────────────────────────────────

function findPrintSizeTierPrice(sizeTiers, qty) {
    if (!sizeTiers?.length) return 0
    const sorted = [...sizeTiers].sort((a, b) => a.minQty - b.minQty)
    const tier = sorted.find(
        (t) => qty >= Number(t.minQty) && (t.maxQty === null || qty <= Number(t.maxQty))
    ) || sorted[sorted.length - 1]
    return Number(tier.price)
}

function calcPrintTotal(printSizes, selections) {
    return selections.reduce((sum, sel) => {
        if (sel.qty === 0) return sum
        const ps = printSizes.find((p) => p.id === sel.sizeId)
        if (!ps) return sum
        return sum + findPrintSizeTierPrice(ps.tiers, sel.qty) * sel.qty
    }, 0)
}

// ── Selector de tamaños de impresión ────────────────────────────────────────

function PrintSizeSelector({ printSizes, selections, onChange }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>
                ELEGÍ TAMAÑOS Y CANTIDADES
            </p>
            {printSizes.map((ps) => {
                const sel = selections.find((s) => s.sizeId === ps.id)
                const qty = sel?.qty ?? 0
                const pricePerCopy = findPrintSizeTierPrice(ps.tiers, qty > 0 ? qty : 1)
                return (
                    <div key={ps.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10,
                        border: `1px solid ${qty > 0 ? "#fed7aa" : "#e2e8f0"}`,
                        background: qty > 0 ? "#fffbf5" : "#fafafa",
                        transition: "all 0.12s",
                    }}>
                        <Printer size={14} color={qty > 0 ? "#ea580c" : "#94a3b8"} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: qty > 0 ? "#c2410c" : "#374151" }}>
                            {ps.label}
                        </span>
                        {qty > 0 && (
                            <span style={{ fontSize: 11, color: "#fb923c", fontWeight: 600 }}>
                                ${pricePerCopy.toLocaleString("es-AR")}/u
                            </span>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                                onClick={() => onChange(ps.id, Math.max(0, qty - 1))}
                                disabled={qty === 0}
                                style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    border: "1px solid #e2e8f0", background: qty === 0 ? "#f8fafc" : "white",
                                    cursor: qty === 0 ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 16, color: qty === 0 ? "#cbd5e1" : "#374151", fontWeight: 700,
                                }}
                            >−</button>
                            <span style={{
                                minWidth: 24, textAlign: "center", fontSize: 13,
                                fontWeight: 700, color: qty > 0 ? "#ea580c" : "#94a3b8",
                            }}>{qty}</span>
                            <button
                                onClick={() => onChange(ps.id, qty + 1)}
                                style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    border: "1px solid #e2e8f0", background: "white",
                                    cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 16, color: "#374151", fontWeight: 700,
                                }}
                            >+</button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ── Modal de selección de formato ────────────────────────────────────────────

function FormatModal({ photo, imgSrc, digitalPrice, printableEnabled, printSizes, onClose, onSelect }) {
    const hasPrint = printableEnabled && printSizes?.length > 0
    const [selected, setSelected] = useState("digital")
    const [printSelections, setPrintSelections] = useState(
        (printSizes || []).map((ps) => ({ sizeId: ps.id, label: ps.label, qty: 0 }))
    )

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose() }
        document.addEventListener("keydown", handler)
        document.body.style.overflow = "hidden"
        return () => {
            document.removeEventListener("keydown", handler)
            document.body.style.overflow = ""
        }
    }, [onClose])

    const handleQtyChange = (sizeId, qty) => {
        setPrintSelections((prev) => prev.map((s) => s.sizeId === sizeId ? { ...s, qty } : s))
    }

    const printTotal = calcPrintTotal(printSizes || [], printSelections)
    const activePrintSelections = printSelections.filter((s) => s.qty > 0)

    const canConfirm = (() => {
        if (selected === "digital") return true
        if (selected === "print") return activePrintSelections.length > 0
        if (selected === "both") return activePrintSelections.length > 0
        return false
    })()

    const priceForSelected = (() => {
        if (selected === "digital") return digitalPrice
        if (selected === "print") return printTotal
        return digitalPrice + printTotal
    })()

    const options = [
        {
            key: "digital", label: "Solo digital",
            sub: "Descarga en alta resolución",
            icon: <ImageIcon size={18} />,
            price: digitalPrice,
            accentColor: "#0f172a", activeBorder: "#0f172a",
            bg: "#f8fafc", activeBg: "#f1f5f9", border: "#e2e8f0",
        },
        ...(hasPrint ? [
            {
                key: "print", label: "Solo impresión",
                sub: "Foto impresa y enviada a domicilio",
                icon: <Printer size={18} />,
                price: printTotal,
                accentColor: "#ea580c", activeBorder: "#ea580c",
                bg: "#fff7ed", activeBg: "#fff7ed", border: "#fed7aa",
            },
            {
                key: "both", label: "Digital + impresión",
                sub: "Archivo descargable y foto impresa",
                icon: <><ImageIcon size={16} /><span style={{ fontSize: 10 }}>+</span><Printer size={16} /></>,
                price: digitalPrice + printTotal,
                accentColor: "#7c3aed", activeBorder: "#7c3aed",
                bg: "#faf5ff", activeBg: "#faf5ff", border: "#ddd6fe",
            },
        ] : []),
    ]

    const selectedOpt = options.find((o) => o.key === selected)

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 99999,
                background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "16px", fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "white", borderRadius: 20,
                    width: "100%", maxWidth: 420, maxHeight: "90dvh",
                    overflowY: "auto",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
                    animation: "fmIn 0.18s ease",
                }}
            >
                {/* Header con imagen */}
                <div style={{ position: "relative", height: 180, borderRadius: "20px 20px 0 0", overflow: "hidden", background: "#f1f5f9" }}>
                    <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                        onClick={onClose}
                        style={{
                            position: "absolute", top: 12, right: 12,
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(0,0,0,0.45)", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "white",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Título */}
                <div style={{ padding: "16px 18px 12px" }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                        {photo.title || "Elegí el formato"}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
                        Seleccioná cómo querés recibir tu foto
                    </p>
                </div>

                {/* Opciones */}
                <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {options.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setSelected(opt.key)}
                            style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "12px 14px", borderRadius: 12, width: "100%", textAlign: "left",
                                border: `2px solid ${selected === opt.key ? opt.activeBorder : opt.border}`,
                                background: selected === opt.key ? opt.activeBg : opt.bg,
                                cursor: "pointer", transition: "all 0.12s",
                                fontFamily: "inherit",
                            }}
                        >
                            <span style={{ color: selected === opt.key ? opt.accentColor : "#94a3b8", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                                {opt.icon}
                            </span>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: selected === opt.key ? opt.accentColor : "#374151" }}>
                                    {opt.label}
                                </p>
                                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>{opt.sub}</p>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: selected === opt.key ? opt.accentColor : "#64748b", flexShrink: 0 }}>
                                {opt.price > 0 ? `$${opt.price.toLocaleString("es-AR")}` : "—"}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Selector de tamaños si aplica */}
                {(selected === "print" || selected === "both") && hasPrint && (
                    <div style={{ padding: "14px 18px 0" }}>
                        <PrintSizeSelector
                            printSizes={printSizes}
                            selections={printSelections}
                            onChange={handleQtyChange}
                        />
                    </div>
                )}

                {/* CTA */}
                <div style={{ padding: "16px 18px 18px" }}>
                    <button
                        onClick={() => {
                            if (!canConfirm) return
                            onSelect(selected, activePrintSelections.map((s) => {
                                const ps = printSizes.find((p) => p.id === s.sizeId)
                                return {
                                    sizeId: s.sizeId,
                                    label: s.label,
                                    qty: s.qty,
                                    pricePerCopy: findPrintSizeTierPrice(ps?.tiers || [], s.qty),
                                }
                            }))
                        }}
                        disabled={!canConfirm}
                        style={{
                            width: "100%", padding: "13px 0", borderRadius: 12,
                            border: "none", cursor: canConfirm ? "pointer" : "not-allowed",
                            background: canConfirm ? (selectedOpt?.accentColor || "#0f172a") : "#e2e8f0",
                            color: canConfirm ? "white" : "#94a3b8",
                            fontSize: 14, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            fontFamily: "inherit", transition: "all 0.1s",
                        }}
                    >
                        <ShoppingCart size={16} />
                        {canConfirm
                            ? `Agregar al carrito · $${priceForSelected.toLocaleString("es-AR")}`
                            : "Seleccioná al menos un tamaño"
                        }
                    </button>
                </div>
            </div>
            <style>{`@keyframes fmIn { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>,
        document.body
    )
}

// ── PhotoCard ─────────────────────────────────────────────────────────────────

export default function PhotoCard({ photo, layout, isFavorite, inCart, actions, gallery, galleryPassword }) {
    const [hovered, setHovered]     = useState(false)
    const [cartItemType, setCartItemType] = useState(null)
    const [justAdded, setJustAdded] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [mounted, setMounted]     = useState(false)
    const [imgLoaded, setImgLoaded] = useState(false)

    const aspect = ASPECT_MAP[layout?.photoAspect] ?? undefined

    // createPortal necesita que el DOM exista
    useEffect(() => {
        setMounted(true)
        // Inyectar keyframe del skeleton una sola vez
        if (!document.getElementById("pb-skeleton-style")) {
            const style = document.createElement("style")
            style.id = "pb-skeleton-style"
            style.textContent = "@keyframes pb-skeleton-shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }"
            document.head.appendChild(style)
        }
    }, [])

    // Sincronizar estado del carrito
    useEffect(() => {
        setCartItemType(getCartItemType(photo.id))
        const sync = () => setCartItemType(getCartItemType(photo.id))
        window.addEventListener("cart-updated", sync)
        return () => window.removeEventListener("cart-updated", sync)
    }, [photo.id])

    const isTiered       = gallery?.pricingMode === "tiered"
    const printSizes     = gallery?.printSizes || []
    const printableEnabled = !!gallery?.printableEnabled
    const hasPrint       = printableEnabled && printSizes.length > 0
    const isInCart       = cartItemType !== null

    // Precio digital según tier actual
    const getDigitalPrice = useCallback(() => {
        if (!isTiered || !gallery?.pricingTiers?.length) return Number(photo.price)
        const currentCart = getCart()
        const alreadyIn = currentCart.some((p) => p.id === photo.id)
        const nextQty = alreadyIn ? currentCart.length : currentCart.length + 1
        const sorted = [...gallery.pricingTiers].sort((a, b) => a.minQty - b.minQty)
        const tier = sorted.find(
            (t) => nextQty >= Number(t.minQty) && (t.maxQty === null || nextQty <= Number(t.maxQty))
        ) || sorted[sorted.length - 1]
        return Number(tier.price)
    }, [isTiered, gallery?.pricingTiers, photo.id, photo.price])

    const isFree = !!gallery?.proPhotosAreFree
    const imgSrc = isFree ? photo.bunnyUrl : protectedUrl(photo.id, galleryPassword)

    const handleCartClick = (e) => {
        e.stopPropagation()
        if (isInCart) {
            actions.onRemoveFromCart?.(photo.id, cartItemType)
            setCartItemType(null)
            return
        }
        if (hasPrint) {
            setShowModal(true)
            return
        }
        // Solo digital sin modal
        actions.onAddToCart?.(
            { ...photo, price: getDigitalPrice(), previewUrl: imgSrc },
            "digital",
            []
        )
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1500)
    }

    const handleSelectFormat = useCallback((type, printSelections) => {
        const d = getDigitalPrice()
        const printTotal = (printSelections || []).reduce((s, sel) => s + sel.pricePerCopy * sel.qty, 0)
        const price = type === "digital" ? d : type === "print" ? printTotal : d + printTotal
        actions.onAddToCart?.(
            { ...photo, price, previewUrl: imgSrc },
            type,
            printSelections
        )
        setShowModal(false)
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1500)
    }, [photo, getDigitalPrice, imgSrc, actions])

    const typeLabel = { digital: "Digital", print: "Impresa", both: "Digital+🖨" }
    const typeColor = { digital: "#0f172a", print: "#ea580c", both: "#7c3aed" }

    return (
        <>
            <div
                className="pb-photo-card"
                style={{
                    position: "relative",
                    aspectRatio: aspect ?? undefined,
                    borderRadius: "var(--pb-photo-radius, 12px)",
                    overflow: "hidden",
                    background: "var(--pb-color-surface, #f1f5f9)",
                    cursor: "zoom-in",
                    boxShadow: hovered
                        ? "0 20px 25px -12px rgba(0,0,0,0.15)"
                        : "var(--pb-photo-shadow, none)",
                    transform: hovered ? "translateY(-4px)" : "translateY(0)",
                    transition: "transform var(--pb-transition-speed, 0.3s) ease, box-shadow var(--pb-transition-speed, 0.3s) ease",
                }}
                onClick={() => actions.onZoom?.(photo)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <img
                    className="pb-photo-img"
                    src={imgSrc}
                    alt={photo.title ?? ""}
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    style={{
                    position: aspect ? "absolute" : "relative",
                    inset: aspect ? 0 : "auto",
                    width: "100%",
                    height: aspect ? "100%" : "auto",
                    objectFit: "cover",
                    display: "block",
                    transform: hovered ? "scale(1.06)" : "scale(1)",
                    transition: "transform var(--pb-transition-speed, 0.3s) ease",
                    opacity: imgLoaded ? 1 : 0,
                }}
                />

                {/* Skeleton — visible mientras la imagen no cargó */}
                {!imgLoaded && (
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(90deg, var(--pb-color-surface, #f1f5f9) 25%, var(--pb-color-border, #e2e8f0) 50%, var(--pb-color-surface, #f1f5f9) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "pb-skeleton-shimmer 1.4s ease infinite",
                    }} />
                )}

                {/* Overlay */}
                <div className="pb-photo-overlay" style={{
                    position: "absolute", inset: 0,
                    background: hovered ? "var(--pb-color-overlay, rgba(0,0,0,0.35))" : "rgba(0,0,0,0)",
                    transition: "background var(--pb-transition-speed, 0.3s) ease",
                    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                    padding: "8px",
                    pointerEvents: hovered ? "auto" : "none",
                }}>
                    {/* Precio */}
                    {layout?.pricePosition === "overlay-bottom-left" && hovered && !isTiered && (
                        <span className="pb-photo-price" style={{
                            fontSize: "12px", fontWeight: 700, color: "#fff",
                            background: "rgba(0,0,0,0.4)",
                            borderRadius: "6px", padding: "2px 7px",
                        }}>
                            ${Number(photo.price).toLocaleString("es-AR")}
                        </span>
                    )}

                    {/* Acciones (hover) */}
                    {hovered && (
                        <div
                            style={{ display: "flex", gap: "6px", marginLeft: "auto" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Favorito */}
                            <button
                                onClick={(e) => { e.stopPropagation(); actions.onToggleFavorite?.(photo.id) }}
                                title="Favorito"
                                style={{
                                    width: 32, height: 32, borderRadius: "50%",
                                    border: "none",
                                    background: isFavorite ? "#facc15" : "rgba(0,0,0,0.45)",
                                    color: "white", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 15, transition: "background 0.15s",
                                }}
                            >
                                {isFavorite ? "★" : "☆"}
                            </button>

                            {/* Carrito */}
                            <button
                                onClick={handleCartClick}
                                title={isInCart ? "Quitar del carrito" : hasPrint ? "Elegir formato" : "Agregar"}
                                style={{
                                    height: 32, borderRadius: 10, padding: "0 10px",
                                    border: "none",
                                    background: isInCart
                                        ? (typeColor[cartItemType] || "#10b981")
                                        : "rgba(0,0,0,0.45)",
                                    color: "white", cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 5,
                                    fontSize: 12, fontWeight: 700,
                                    fontFamily: "inherit", transition: "background 0.15s",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {isInCart ? (
                                    <><Check size={12} /> {justAdded ? "¡Listo!" : typeLabel[cartItemType]}</>
                                ) : hasPrint ? (
                                    <><Printer size={12} /> Elegir</>
                                ) : (
                                    <><ShoppingCart size={12} /> Agregar</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Badge favorito visible siempre */}
                {isFavorite && !hovered && (
                    <div style={{
                        position: "absolute", top: 7, right: 7,
                        width: 22, height: 22, borderRadius: "50%",
                        background: "rgba(0,0,0,0.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, color: "#facc15",
                    }}>★</div>
                )}

                {/* Badge tipo en carrito */}
                {isInCart && !hovered && (
                    <div style={{
                        position: "absolute", top: 7, left: 7,
                        background: typeColor[cartItemType] || "#10b981",
                        color: "white", borderRadius: 20,
                        padding: "2px 7px", fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 3,
                    }}>
                        <Check size={9} /> {typeLabel[cartItemType]}
                    </div>
                )}
            </div>

            {/* Modal — portal al body */}
            {mounted && showModal && (
                <FormatModal
                    photo={photo}
                    imgSrc={imgSrc}
                    digitalPrice={getDigitalPrice()}
                    printableEnabled={printableEnabled}
                    printSizes={printSizes}
                    onClose={() => setShowModal(false)}
                    onSelect={handleSelectFormat}
                />
            )}
        </>
    )
}