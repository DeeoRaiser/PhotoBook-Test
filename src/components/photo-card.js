"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ShoppingCart, Star, Check, Download, Printer, ImageIcon, X, Plus } from "lucide-react"
import { addToCart, removeFromCart, getCart, getCartItemType, toggleFavorite, isFavorite } from "@/lib/cart"

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

function FormatModal({ photo, imgSrc, digitalPrice,printableEnabled, printSizes, onClose, onSelect }) {
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


// ── PhotoCard ─────────────────────────────────────────────────────────────────
export default function PhotoCard({
    photo,
    galleryPassword = null,
    onZoom,
    isTiered = false,
    isFree = false,
    pricingTiers = [],
    printSizes = [],
    printableEnabled = false,
}) {
    const [cartItemType, setCartItemType] = useState(null)
    const [fav, setFav]                   = useState(false)
    const [justAdded, setJustAdded]       = useState(false)
    const [showModal, setShowModal]       = useState(false)
    const [mounted, setMounted]           = useState(false)

    // createPortal necesita que el DOM exista
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

    const inCart = cartItemType !== null

    const handleCart = (e) => {
        e.stopPropagation()
        if (inCart) {
            removeFromCart(photo.id, cartItemType)
            setCartItemType(null)
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
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1500)
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
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1500)
    }, [photo, getDigitalPrice, imgSrc])

    const handleFav = (e) => {
        e.stopPropagation()
        toggleFavorite({ id: photo.id, title: photo.title, price: Number(photo.price), previewUrl: imgSrc })
        setFav(!fav)
    }

    const typeLabel = { digital: "Digital", print: "Impresa", both: "Digital+🖨" }
    const typeColor = { digital: "#0f172a", print: "#ea580c", both: "#7c3aed" }

    return (
        <>
            <div
                className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-100 cursor-zoom-in"
                onClick={() => onZoom?.(photo)}
            >
                <img
                    src={imgSrc}
                    alt={photo.title || "Foto"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />

                {/* Favorito */}
                <button
                    onClick={handleFav}
                    className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                        fav
                            ? "bg-yellow-400 text-white opacity-100"
                            : "bg-black/30 text-white opacity-0 group-hover:opacity-100"
                    }`}
                >
                    <Star size={14} fill={fav ? "currentColor" : "none"} />
                </button>

                {/* Badge tipo en carrito */}
                {!isFree && inCart && (
                    <div style={{
                        position: "absolute", top: 8, left: 8,
                        background: typeColor[cartItemType] || "#10b981",
                        color: "white", borderRadius: 20,
                        padding: "2px 7px", fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 3,
                    }}>
                        <Check size={9} /> {typeLabel[cartItemType]}
                    </div>
                )}

                {/* Barra inferior con precio y botón */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    {isFree ? (
                        <div className="flex justify-center">
                            <a
                                href={photo.bunnyUrl}
                                download target="_blank" rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-neutral-900 hover:bg-neutral-100 transition-colors"
                            >
                                <Download size={12} /> Descargar
                            </a>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                            {!isTiered && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    <span className="text-white text-sm font-semibold drop-shadow">
                                        ${Number(photo.price).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={handleCart}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto ${
                                    inCart
                                        ? "bg-green-500 text-white"
                                        : "bg-white text-neutral-900 hover:bg-neutral-100"
                                }`}
                            >
                                {inCart ? (
                                    <><Check size={12} />{justAdded ? "¡Agregado!" : "En carrito"}</>
                                ) : hasPrint ? (
                                    <><Printer size={12} />Elegir formato</>
                                ) : (
                                    <><ShoppingCart size={12} />Agregar</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal — portal al body, por encima de todo, sin conflictos */}
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