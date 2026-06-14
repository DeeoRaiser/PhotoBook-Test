"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { HelpCircle, X, ChevronRight, ChevronLeft, Check, Play } from "lucide-react"
import TOURS from "./tours/index"

// ─── (Tours definidos en src/components/tours/) ───────────────────────────────

// ─── Hook: detectar mobile ────────────────────────────────────────────────────
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])
    return isMobile
}

// ─── Scroll manual síncrono (compatible iOS Safari) ───────────────────────────
// scrollIntoView({ behavior:"instant" }) no está soportado en Safari/iOS.
// En cambio calculamos el offsetTop acumulado del elemento y hacemos
// window.scrollTo() directamente, que SÍ es síncrono en todos los browsers.
// Encuentra el scroll container real del elemento
// (puede ser window, o un div con overflow:auto/scroll como el <main> del dashboard)
function getScrollContainer(el) {
    let node = el.parentElement
    while (node && node !== document.body) {
        const style = window.getComputedStyle(node)
        const overflow = style.overflowY
        if (overflow === "auto" || overflow === "scroll") return node
        node = node.parentElement
    }
    return window
}

function scrollToElementSync(el, isMobile) {
    const container = getScrollContainer(el)
    const vh = window.visualViewport?.height || window.innerHeight

    // Posición del elemento relativa al container
    const elRect = el.getBoundingClientRect()
    const isWindow = container === window

    const containerScrollTop = isWindow ? window.scrollY : container.scrollTop
    const containerRect = isWindow
        ? { top: 0 }
        : container.getBoundingClientRect()

    // Posición del centro del elemento en el documento (relativa al container)
    const elMidInContainer = containerScrollTop + elRect.top - containerRect.top + el.offsetHeight / 2

    let targetScrollTop
    if (isMobile) {
        const cardH = vh * 0.46
        // Determinar si el elemento está en zona baja o alta del viewport actual
        const elCenterInViewport = elRect.top + el.offsetHeight / 2
        const goesOnTop = elCenterInViewport > vh * 0.5
        if (goesOnTop) {
            const freeMid = cardH + (vh - cardH) * 0.45
            targetScrollTop = elMidInContainer - freeMid
        } else {
            const freeMid = (vh - cardH) * 0.45
            targetScrollTop = elMidInContainer - freeMid
        }
    } else {
        targetScrollTop = elMidInContainer - vh / 2
    }

    if (isWindow) {
        window.scrollTo(0, Math.max(0, targetScrollTop))
    } else {
        container.scrollTop = Math.max(0, targetScrollTop)
    }
}

// ─── Spotlight ─────────────────────────────────────────────────────────────────
function Spotlight({ selector, selectorText, selectorFallbackText, expandSection, selectParent, onRectChange, isMobile }) {
    const [rect, setRect] = useState(null)

    useEffect(() => {
        if (!selector && !selectorText && !selectorFallbackText && !expandSection) {
            setRect(null)
            onRectChange?.(null)
            return
        }

        let cancelled = false

        const calcRect = (el) => {
            // scrollTo es síncrono en la llamada pero el layout se actualiza
            // en el próximo frame — hay que esperar el rAF para que getBCR sea correcto.
            scrollToElementSync(el, isMobile)
            requestAnimationFrame(() => {
                if (cancelled) return
                const r = el.getBoundingClientRect()
                if (r.width === 0 || r.height === 0) {
                    setRect(null)
                    onRectChange?.(null)
                    return
                }
                const vh = window.visualViewport?.height || window.innerHeight
                const computed = {
                    top: r.top - 6,
                    left: r.left - 6,
                    width: r.width + 12,
                    height: r.height + 12,
                    centerY: (r.top + r.height / 2) / vh,
                }
                setRect(computed)
                onRectChange?.(computed)
            })
        }

        const findEl = () => {
            let el = null

            // 1. Buscar por texto en elementos interactivos
            if (selectorText || selectorFallbackText) {
                const texts = [selectorText, selectorFallbackText].filter(Boolean)
                const candidates = document.querySelectorAll("button, a, [role='button'], div[style*='cursor']")
                for (const text of texts) {
                    el = [...candidates].find(e => e.textContent?.trim().includes(text))
                    if (el) break
                }
            }

            // 2. Buscar por selector CSS
            if (!el && selector) {
                try { el = document.querySelector(selector) } catch (_) {}
            }

            // 3. Si el elemento está oculto (sección colapsada) y hay expandSection, expandir
            const isHidden = (node) => !node || node.offsetWidth === 0 || node.offsetHeight === 0
            if (expandSection && isHidden(el)) {
                const allDivs = document.querySelectorAll("div, button, h2, h3")
                const header = [...allDivs].find(h => {
                    const directText = [...h.childNodes]
                        .map(n => n.textContent || "")
                        .join("")
                    return directText.includes(expandSection)
                })
                if (header) {
                    header.click()
                    setTimeout(() => { if (!cancelled) findEl() }, 400)
                    return
                }
            }

            if (!el || isHidden(el)) {
                // Reintentar una vez más si el DOM todavía no está listo
                setTimeout(() => { if (!cancelled) findEl() }, 300)
                return
            }

            // selectParent: marcar el contenedor padre en lugar del elemento (ej: input + sufijo)
            const target = selectParent ? (el.parentElement || el) : el
            calcRect(target)
        }

        // Esperar a que el DOM esté disponible tras el cambio de step/ruta
        const t = setTimeout(findEl, 400)
        return () => {
            cancelled = true
            clearTimeout(t)
        }
    }, [selector, selectorText, selectorFallbackText, expandSection, isMobile])

    if (!rect) return null

    const clipHole = `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${rect.left}px ${rect.top}px,
        ${rect.left}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top}px,
        ${rect.left}px ${rect.top}px
    )`

    return (
        <>
            <div style={{
                position: "fixed", inset: 0, zIndex: 9997,
                backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
                background: "rgba(0,0,0,0.42)",
                clipPath: clipHole, WebkitClipPath: clipHole,
                pointerEvents: "none",
            }} />
            <div style={{
                position: "fixed",
                top: rect.top, left: rect.left,
                width: rect.width, height: rect.height,
                zIndex: 9998, borderRadius: 10, pointerEvents: "none",
                boxShadow: "0 0 0 3px #3b82f6, 0 0 0 6px rgba(59,130,246,0.25), 0 0 20px rgba(59,130,246,0.35)",
                animation: "tour-pulse 2s ease infinite",
            }} />
        </>
    )
}

// ─── Tour card ─────────────────────────────────────────────────────────────────
// Desktop: fijo bottom-right.
// Mobile:  fijo, se posiciona arriba o abajo según dónde esté el elemento resaltado
//          (elementCenterY > 0.5 → elemento en mitad inferior → card arriba, y viceversa).
//          Cuando no hay elemento (selector null) va abajo por defecto.
function TourCard({ step, stepIndex, totalSteps, onNext, onPrev, onBranch, onClose, tourTitle, isMobile, elementCenterY }) {
    const isFirst = stepIndex === 0
    const isFinal = step.final
    const isQuestion = step.question

    // Decidir posición mobile dinámicamente
    // elementCenterY: null = sin elemento → abajo
    // > 0.5 → elemento en zona baja → card arriba
    // <= 0.5 → elemento en zona alta → card abajo
    const mobileOnTop = elementCenterY !== null && elementCenterY > 0.5

    const cardStyle = isMobile
        ? {
            position: "fixed",
            left: 10, right: 10,
            zIndex: 9999,
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 -4px 40px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            maxHeight: "46vh",
            display: "flex",
            flexDirection: "column",
            ...(mobileOnTop
                ? { top: 12, bottom: "auto" }
                : { bottom: 12, top: "auto" }),
        }
        : {
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 9999,
            width: 340,
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
        }

    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: isMobile ? "12px 14px 10px" : "14px 16px 12px",
                borderBottom: "1px solid #f1f5f9",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Play size={11} color="white" fill="white" />
                    </div>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", margin: 0 }}>TOUR · {tourTitle.toUpperCase()}</p>
                        {!isQuestion && (
                            <p style={{ fontSize: 10, color: "#cbd5e1", margin: 0 }}>Paso {stepIndex + 1} de {totalSteps}</p>
                        )}
                    </div>
                </div>
                <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <X size={13} color="#94a3b8" />
                </button>
            </div>

            {/* Progress */}
            {!isQuestion && (
                <div style={{ height: 3, background: "#f1f5f9", flexShrink: 0 }}>
                    <div style={{ height: "100%", width: `${((stepIndex + 1) / totalSteps) * 100}%`, background: "linear-gradient(90deg,#3b82f6,#6366f1)", borderRadius: 99, transition: "width .4s ease" }} />
                </div>
            )}

            {/* Body — scrollable si el contenido no entra */}
            <div style={{ padding: isMobile ? "10px 14px" : "16px 18px", overflowY: "auto", flex: 1 }}>
                <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#0f172a", margin: "0 0 5px", letterSpacing: "-0.02em" }}>
                    {step.title}
                </h3>
                <p style={{ fontSize: isMobile ? 12 : 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                    {step.body}
                </p>
                {step.tip && (
                    <div style={{ marginTop: 8, padding: "7px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
                        <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 }}>{step.tip}</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ padding: isMobile ? "0 14px 12px" : "0 18px 16px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                {isQuestion ? (
                    <>
                        <button onClick={() => onBranch("yes")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            <span>{step.questionYes}</span><ChevronRight size={15} />
                        </button>
                        <button onClick={() => onBranch("no")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            <span>{step.questionNo}</span><ChevronRight size={15} />
                        </button>
                    </>
                ) : isFinal ? (
                    <button onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        <Check size={15} /> ¡Entendido!
                    </button>
                ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                        {!isFirst && (
                            <button onClick={onPrev} style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                <ChevronLeft size={14} /> Atrás
                            </button>
                        )}
                        <button onClick={onNext} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            {isFirst ? "Empezar" : "Siguiente"} <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── FAQ Panel ────────────────────────────────────────────────────────────────
function FAQPanel({ onStartTour, onClose, isMobile }) {
    const FAQS = [
        { q: "¿Cómo subo fotos a una galería?", a: "Una vez creada la galería, abrila desde la lista y usá el botón «Subir fotos». Podés arrastrar y soltar o seleccionar desde tu computadora. Los formatos aceptados son JPG, PNG y WEBP." },
        { q: "¿Cuántas fotos puedo subir?", a: "Depende de tu plan. En planes básicos hay un límite por galería. En planes Pro el límite es mucho mayor o ilimitado." },
        { q: "¿Cómo recibo el dinero de las ventas?", a: "El dinero se acredita directamente en tu cuenta de Mercado Pago. Podés retirarlo a tu CBU/CVU en cualquier momento desde la app." },
        { q: "¿Mis clientes necesitan crearse una cuenta?", a: "No. Los clientes entran con el link que vos les compartís. Si la galería tiene contraseña, solo necesitan ingresar esa clave." },
        { q: "¿Puedo cambiar el precio de una galería ya publicada?", a: "Sí. Podés modificar los precios en cualquier momento. Los cambios se aplican de inmediato." },
        { q: "¿Cómo protejo mis fotos de descargas no autorizadas?", a: "El sistema aplica marca de agua automáticamente en las previsualizaciones. Solo los compradores reciben las fotos en alta calidad." },
    ]

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: isMobile ? "stretch" : "flex-end",
            padding: isMobile ? 0 : 24,
            fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} />

            <div style={{
                position: "relative", zIndex: 1,
                width: isMobile ? "100%" : "min(480px, calc(100vw - 32px))",
                maxHeight: isMobile ? "85vh" : "calc(100vh - 48px)",
                background: "#ffffff",
                borderRadius: isMobile ? "24px 24px 0 0" : 24,
                boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
                animation: isMobile ? "tour-slide-up 0.3s ease both" : "tour-slide-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
                {isMobile && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 2px" }}>
                        <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e2e8f0" }} />
                    </div>
                )}

                <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <HelpCircle size={18} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>Centro de Ayuda</h2>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Guías y preguntas frecuentes</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={15} color="#94a3b8" />
                    </button>
                </div>

                <div style={{ overflowY: "auto", flex: 1 }}>
                    <div style={{ padding: "16px 20px 0" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", margin: "0 0 12px" }}>TOURS INTERACTIVOS</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {TOURS.map(tour => {
                                const Icon = tour.icon
                                return (
                                    <button key={tour.id} onClick={() => onStartTour(tour)} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "12px 14px", borderRadius: 14,
                                        border: "1px solid #e2e8f0", background: "#f8fafc",
                                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                                        WebkitTapHighlightColor: "transparent",
                                    }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 11, background: tour.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Icon size={17} color={tour.iconColor} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{tour.title}</p>
                                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tour.description}</p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                            <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>⏱ {tour.estimatedTime}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)" }}>
                                                <Play size={9} color="white" fill="white" />
                                                <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>Iniciar</span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ padding: "16px 20px 20px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", margin: "0 0 12px" }}>PREGUNTAS FRECUENTES</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}
                        </div>
                    </div>
                </div>

                <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", flexShrink: 0, background: "#f8fafc" }}>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, textAlign: "center" }}>
                        ¿Necesitás más ayuda? Escribinos a <a href="mailto:soporte@photobook.com.ar" style={{ color: "#3b82f6", fontWeight: 600 }}>soporte@photobook.com.ar</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

function FAQItem({ faq }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ borderRadius: 10, border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <button onClick={() => setOpen(v => !v)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 14px", background: "white", border: "none", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", gap: 10,
                WebkitTapHighlightColor: "transparent",
            }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", flex: 1 }}>{faq.q}</span>
                <ChevronRight size={14} color="#94a3b8" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
            </button>
            {open && (
                <div style={{ padding: "0 14px 12px", background: "white" }}>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
                </div>
            )}
        </div>
    )
}

// ─── Main HelpTour ─────────────────────────────────────────────────────────────
export default function HelpTour() {
    const router = useRouter()
    const isMobile = useIsMobile()
    const [showPanel, setShowPanel] = useState(false)
    const [activeTour, setActiveTour] = useState(null)
    const [stepIndex, setStepIndex] = useState(0)
    const [steps, setSteps] = useState([])
    // centerY del elemento resaltado (null si no hay elemento)
    const [elementCenterY, setElementCenterY] = useState(null)

    const currentStep = steps[stepIndex] || null

    const startTour = useCallback((tour) => {
        setActiveTour(tour)
        setSteps(tour.steps)
        setStepIndex(0)
        setElementCenterY(null)
        setShowPanel(false)
        if (tour.steps[0]?.route) router.push(tour.steps[0].route)
    }, [router])

    const handleNext = useCallback(() => {
        const next = stepIndex + 1
        if (next >= steps.length) { endTour(); return }
        setElementCenterY(null)
        setStepIndex(next)
        if (steps[next]?.route) router.push(steps[next].route)
    }, [stepIndex, steps, router])

    const handlePrev = useCallback(() => {
        const prev = stepIndex - 1
        if (prev < 0) return
        setElementCenterY(null)
        setStepIndex(prev)
        if (steps[prev]?.route) router.push(steps[prev].route)
    }, [stepIndex, steps, router])

    const handleBranch = useCallback((answer) => {
        // Usar el step actual si tiene sub-ramas propias (pregunta anidada), si no el tour raíz
        const ctx = (currentStep?.branchYes || currentStep?.branchNo) ? currentStep : activeTour
        const branchSteps = answer === "yes" ? ctx.branchYes : ctx.branchNo
        if (!branchSteps) { endTour(); return }
        setSteps(branchSteps)
        setStepIndex(0)
        setElementCenterY(null)
        if (branchSteps[0]?.route) router.push(branchSteps[0].route)
    }, [activeTour, currentStep, router])

    const endTour = useCallback(() => {
        setActiveTour(null)
        setSteps([])
        setStepIndex(0)
        setElementCenterY(null)
    }, [])

    const handleRectChange = useCallback((rect) => {
        setElementCenterY(rect ? rect.centerY : null)
    }, [])

    const totalSteps = steps.length

    // Botón help: desktop = bottom-left, mobile = bottom-right
    const btnStyle = {
        position: "fixed",
        zIndex: 9000,
        width: 44, height: 44,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)",
        border: "none", color: "white", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(15,23,42,0.35)",
        WebkitTapHighlightColor: "transparent",
        transition: "transform .2s, box-shadow .2s",
        ...(isMobile
            ? { bottom: 20, right: 16 }
            : { bottom: 24, right: 24 }),
    }

    return (
        <>
            <button onClick={() => setShowPanel(v => !v)} title="Centro de Ayuda" style={btnStyle}>
                {showPanel ? <X size={18} /> : <HelpCircle size={44} />}
            </button>

            {showPanel && !activeTour && (
                <FAQPanel onStartTour={startTour} onClose={() => setShowPanel(false)} isMobile={isMobile} />
            )}

            {activeTour && currentStep && (
                <>
                    <Spotlight
                        selector={currentStep.selector}
                        selectorText={currentStep.selectorText}
                        selectorFallbackText={currentStep.selectorFallbackText}
                        expandSection={currentStep.expandSection}
                        selectParent={currentStep.selectParent}
                        onRectChange={handleRectChange}
                        isMobile={isMobile}
                    />
                    <TourCard
                        step={currentStep}
                        stepIndex={stepIndex}
                        totalSteps={totalSteps}
                        tourTitle={activeTour.title}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        onBranch={handleBranch}
                        onClose={endTour}
                        isMobile={isMobile}
                        elementCenterY={elementCenterY}
                    />
                </>
            )}

            <style>{`
                @keyframes tour-slide-in {
                    from { opacity: 0; transform: translateY(16px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes tour-slide-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes tour-pulse {
                    0%, 100% { box-shadow: 0 0 0 3px #3b82f6, 0 0 0 6px rgba(59,130,246,0.3), 0 0 24px rgba(59,130,246,0.3); }
                    50%       { box-shadow: 0 0 0 3px #3b82f6, 0 0 0 8px rgba(59,130,246,0.15), 0 0 32px rgba(59,130,246,0.2); }
                }
            `}</style>
        </>
    )
}