"use client"

import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight, ShoppingCart, Star, Check, Download, Printer, ImageIcon, Plus } from "lucide-react"
import { addToCart, removeFromCart, isInCart, getCart, getCartItemType, toggleFavorite, isFavorite } from "@/lib/cart"

function protectedUrl(photoId, password = null) {
    const base = `/api/photos/protected/${photoId}`
    return password ? `${base}?pwd=${encodeURIComponent(password)}` : base
}

// ── Modal de selección de formato ────────────────────────────────────────────
function findPrintSizeTierPrice(sizeTiers, qty) {
    if (!sizeTiers?.length) return 0
    const sorted = [...sizeTiers].sort((a, b) => a.minQty - b.minQty)
    const tier = sorted.find((t) => qty >= Number(t.minQty) && (t.maxQty === null || qty <= Number(t.maxQty)))
        || sorted[sorted.length - 1]
    return Number(tier.price)
}

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
                                    fontSize: 16, color: qty === 0 ? "#cbd5e1" : "#374151",
                                    fontWeight: 700,
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

function calcPrintTotal(printSizes, selections) {
    return selections.reduce((sum, sel) => {
        if (sel.qty === 0) return sum
        const ps = printSizes.find((p) => p.id === sel.sizeId)
        if (!ps) return sum
        return sum + findPrintSizeTierPrice(ps.tiers, sel.qty) * sel.qty
    }, 0)
}

function FormatModal({ photo, imgSrc, digitalPrice, printSizes, onClose, onSelect }) {
    const hasPrint = printSizes?.length > 0
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
            accentColor: "#0f172a", bg: "#f8fafc", activeBg: "#f1f5f9",
            border: "#e2e8f0", activeBorder: "#0f172a",
        },
        ...(hasPrint ? [
            {
                key: "print", label: "Solo impresión",
                sub: "Foto impresa y enviada a domicilio",
                icon: <Printer size={18} />,
                price: printTotal,
                accentColor: "#ea580c", bg: "#fff7ed", activeBg: "#fff7ed",
                border: "#fed7aa", activeBorder: "#ea580c",
            },
            {
                key: "both", label: "Digital + impresión",
                sub: "Archivo descargable y foto impresa",
                icon: <span style={{ display: "flex", alignItems: "center", gap: 2 }}><ImageIcon size={15} /><Plus size={10} /><Printer size={15} /></span>,
                price: digitalPrice + printTotal,
                accentColor: "#7c3aed", bg: "#faf5ff", activeBg: "#f5f3ff",
                border: "#ddd6fe", activeBorder: "#7c3aed",
            },
        ] : []),
    ]

    const selectedOpt = options.find((o) => o.key === selected)

    return createPortal(
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        }} onClick={onClose}>
            <div style={{
                background: "white", borderRadius: 20, width: "100%", maxWidth: 440,
                maxHeight: "90vh", overflowY: "auto",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
                animation: "fmIn 0.18s cubic-bezier(.4,0,.2,1)",
                fontFamily: "inherit",
            }} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f1f5f9" }}>
                        <img src={imgSrc} alt={photo.title || "Foto"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {photo.title || "Foto"}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Elegí cómo querés esta foto</p>
                    </div>
                    <button onClick={onClose} style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
                        background: "white", cursor: "pointer", flexShrink: 0,
                    }}><X size={14} color="#94a3b8" /></button>
                </div>

                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Opciones de formato */}
                    {options.map((opt) => {
                        const active = selected === opt.key
                        return (
                            <button key={opt.key} onClick={() => setSelected(opt.key)} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "11px 14px", borderRadius: 12, width: "100%",
                                border: `2px solid ${active ? opt.activeBorder : opt.border}`,
                                background: active ? opt.activeBg : opt.bg,
                                cursor: "pointer", transition: "all 0.12s",
                                textAlign: "left", fontFamily: "inherit",
                            }}>
                                <span style={{ color: active ? opt.accentColor : "#94a3b8", display: "flex", flexShrink: 0 }}>{opt.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: active ? opt.accentColor : "#374151" }}>{opt.label}</p>
                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{opt.sub}</p>
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 800, color: active ? opt.accentColor : "#64748b", flexShrink: 0 }}>
                                    {opt.key === "digital"
                                        ? `$${opt.price.toLocaleString("es-AR")}`
                                        : activePrintSelections.length > 0
                                            ? `$${opt.price.toLocaleString("es-AR")}`
                                            : "Elegir"
                                    }
                                </span>
                                <span style={{
                                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                                    border: `2px solid ${active ? opt.activeBorder : "#e2e8f0"}`,
                                    background: active ? opt.accentColor : "white",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {active && <Check size={10} color="white" strokeWidth={3} />}
                                </span>
                            </button>
                        )
                    })}

                    {/* Selector de tamaños (visible cuando se elige print o both) */}
                    {hasPrint && (selected === "print" || selected === "both") && (
                        <div style={{
                            padding: "12px", borderRadius: 12,
                            border: "1px solid #fed7aa", background: "#fffbf5",
                        }}>
                            <PrintSizeSelector
                                printSizes={printSizes}
                                selections={printSelections}
                                onChange={handleQtyChange}
                            />
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div style={{ padding: "0 18px 18px" }}>
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


export default function PhotoZoom({
    photo,
    photos,
    galleryPassword = null,
    onClose,
    onNext,
    onPrev,
    isTiered = false,
    isFree = false,
    pricingTiers = [],
    printSizes = [],
    printableEnabled = false,
}) {
    const [cartItemType, setCartItemType] = useState(() => getCartItemType(photo.id))
    const [fav, setFav]                   = useState(isFavorite(photo.id))
    const [showModal, setShowModal]       = useState(false)
    const [mounted, setMounted]           = useState(false)

    // Swipe en mobile
    const [touchStart, setTouchStart] = useState(null)

    useEffect(() => { setMounted(true) }, [])

    // Precio digital del tier correcto segun cantidad actual del carrito
    const getTieredDigitalPrice = useCallback(() => {
        if (!isTiered || !pricingTiers?.length) return Number(photo.price)
        const currentCart = getCart()
        const alreadyIn = currentCart.some((p) => p.id === photo.id)
        const nextQty = alreadyIn ? currentCart.length : currentCart.length + 1
        const sorted = [...pricingTiers].sort((a, b) => a.minQty - b.minQty)
        const tier = sorted.find((t) => nextQty >= Number(t.minQty) && (t.maxQty === null || nextQty <= Number(t.maxQty)))
            || sorted[sorted.length - 1]
        return Number(tier.price)
    }, [isTiered, pricingTiers, photo.id, photo.price])

    const getDigitalPrice = useCallback(() => {
        return isTiered ? getTieredDigitalPrice() : Number(photo.price)
    }, [isTiered, getTieredDigitalPrice, photo.price])

    const hasPrint = printableEnabled && printSizes?.length > 0
    const imgSrc   = isFree ? photo.bunnyUrl : protectedUrl(photo.id, galleryPassword)

    const inCart = cartItemType !== null

    useEffect(() => {
        setCartItemType(getCartItemType(photo.id))
        setFav(isFavorite(photo.id))
        const syncCart = () => setCartItemType(getCartItemType(photo.id))
        const syncFavs = () => setFav(isFavorite(photo.id))
        window.addEventListener("cart-updated", syncCart)
        window.addEventListener("favorites-updated", syncFavs)
        return () => {
            window.removeEventListener("cart-updated", syncCart)
            window.removeEventListener("favorites-updated", syncFavs)
        }
    }, [photo.id])

    // Bloquear scroll del body mientras está abierto
    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => { document.body.style.overflow = "" }
    }, [])

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape" && !showModal) onClose()
            if (e.key === "ArrowRight" && !showModal) onNext?.()
            if (e.key === "ArrowLeft"  && !showModal) onPrev?.()
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [onClose, onNext, onPrev, showModal])

    const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)
    const handleTouchEnd = (e) => {
        if (touchStart === null) return
        const delta = touchStart - e.changedTouches[0].clientX
        if (Math.abs(delta) > 50) {
            if (delta > 0) onNext?.()
            else           onPrev?.()
        }
        setTouchStart(null)
    }

    // priceForType removed - price calculated in FormatModal per printSelections

    const handleCart = () => {
        if (inCart) {
            removeFromCart(photo.id, cartItemType)
            setCartItemType(null)
            window.dispatchEvent(new Event("cart-updated"))
            return
        }
        if (hasPrint) {
            setShowModal(true)
            return
        }
        addToCart({
            id: photo.id,
            title: photo.title,
            price: getDigitalPrice(),
            itemType: "digital",
            previewUrl: imgSrc,
            bunnyUrl: photo.bunnyUrl,
        })
        setCartItemType("digital")
        window.dispatchEvent(new Event("cart-updated"))
    }

    const handleSelectFormat = useCallback((type, printSelections) => {
        const d = getDigitalPrice()
        const printTotal = (printSelections || []).reduce((s, sel) => s + sel.pricePerCopy * sel.qty, 0)
        const price = type === "digital" ? d : type === "print" ? printTotal : d + printTotal
        addToCart({
            id: photo.id,
            title: photo.title,
            price,
            itemType: type,
            printSelections: type !== "digital" ? printSelections : undefined,
            previewUrl: imgSrc,
            bunnyUrl: photo.bunnyUrl,
        })
        setCartItemType(type)
        setShowModal(false)
        window.dispatchEvent(new Event("cart-updated"))
    }, [photo, getDigitalPrice, imgSrc])

    const handleFav = () => {
        toggleFavorite({
            id: photo.id,
            title: photo.title,
            price: photo.price,
            previewUrl: imgSrc,
            bunnyUrl: photo.bunnyUrl,
        })
        setFav(!fav)
    }

    const typeLabels = { digital: "Digital", print: "Impresa", both: "Digital+🖨" }

    return (
        <>
        <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Barra superior */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleFav}
                        className={`p-2 rounded-full transition-colors ${
                            fav ? "bg-yellow-400 text-white" : "bg-white/15 text-white hover:bg-white/25"
                        }`}
                    >
                        <Star size={18} fill={fav ? "currentColor" : "none"} />
                    </button>
                    {photo.title && (
                        <p className="text-white/80 text-sm font-medium truncate max-w-[180px] sm:max-w-xs">
                            {photo.title}
                        </p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Zona de imagen — ocupa el espacio disponible */}
            <div className="flex-1 relative flex items-center justify-center min-h-0 px-2 sm:px-12">
                {/* Botón anterior */}
                {onPrev && (
                    <button
                        onClick={onPrev}
                        className="absolute left-1 sm:left-3 z-10 p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                    >
                        <ChevronLeft size={22} />
                    </button>
                )}

                {/* Imagen */}
                <img
                    src={imgSrc}
                    alt={photo.title || "Foto"}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg select-none"
                    style={{ maxHeight: "calc(100vh - 160px)" }}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                />

                {/* Botón siguiente */}
                {onNext && (
                    <button
                        onClick={onNext}
                        className="absolute right-1 sm:right-3 z-10 p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                    >
                        <ChevronRight size={22} />
                    </button>
                )}
            </div>

            {/* Barra inferior */}
            <div className="shrink-0 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    {!isFree && !isTiered && (
                        <p className="text-white font-semibold text-base">
                            ${Number(photo.price).toFixed(2)}
                            {hasPrint && (
                                <span style={{ fontSize: 12, color: "#fed7aa", fontWeight: 600, marginLeft: 8 }}>
                                    🖨 +${Number(effectivePrintPrice).toFixed(2)}
                                </span>
                            )}
                        </p>
                    )}
                    {isFree && (
                        <p className="text-emerald-400 font-semibold text-sm flex items-center gap-1.5">
                            <Check size={14} /> Descarga gratuita
                        </p>
                    )}
                    {inCart && cartItemType && (
                        <p className="text-white/60 text-xs mt-0.5">
                            {typeLabels[cartItemType]}
                        </p>
                    )}
                    {photos?.length > 1 && (
                        <p className="text-white/40 text-xs mt-0.5">
                            Deslizá para navegar
                        </p>
                    )}
                </div>
                {isFree ? (
                    <a
                        href={photo.bunnyUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shrink-0"
                    >
                        <Download size={16} /> Descargar
                    </a>
                ) : (
                    <button
                        onClick={handleCart}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shrink-0 ${
                            inCart
                                ? "bg-green-500 text-white"
                                : "bg-white text-neutral-900 hover:bg-neutral-100"
                        }`}
                    >
                        {inCart ? (
                            <><Check size={16} /> En carrito</>
                        ) : hasPrint ? (
                            <><Printer size={16} /> Elegir formato</>
                        ) : (
                            <><ShoppingCart size={16} /> Agregar</>
                        )}
                    </button>
                )}
            </div>
        </div>

        {/* Modal de formato — portal al body, z-index por encima del lightbox */}
        {mounted && showModal && (
            <FormatModal
                photo={photo}
                imgSrc={imgSrc}
                digitalPrice={getDigitalPrice()}
                printSizes={printSizes}
                onClose={() => setShowModal(false)}
                onSelect={handleSelectFormat}
            />
        )}
        </>
    )
}
