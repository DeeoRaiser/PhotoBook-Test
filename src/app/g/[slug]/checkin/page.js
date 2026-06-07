"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Camera, ArrowRight, Loader2, Check, RefreshCw, X } from "lucide-react"

export default function CheckinPage() {
    const { slug } = useParams()
    const router = useRouter()

    const [step, setStep] = useState("info") // "info" | "selfie" | "submitting" | "done"
    const [name, setName] = useState("")
    const [nameError, setNameError] = useState("")
    const [selfieDataUrl, setSelfieDataUrl] = useState(null)
    const [cameraError, setCameraError] = useState("")
    const [galleryTitle, setGalleryTitle] = useState("")
    const [loadingGallery, setLoadingGallery] = useState(true)

    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    // Verificar que la galería existe y es de tipo evento
    useEffect(() => {
        async function fetchGallery() {
            try {
                const res = await fetch(`/api/galleries/public/${slug}`)
                const data = await res.json()
                if (!res.ok) {
                    router.replace(`/g/${slug}`)
                    return
                }
                if (data.galleryType && data.galleryType !== "event") {
                    router.replace(`/g/${slug}`)
                    return
                }
                setGalleryTitle(data.title)
            } catch {
                router.replace(`/g/${slug}`)
            } finally {
                setLoadingGallery(false)
            }
        }
        fetchGallery()
    }, [slug, router])

    const startCamera = useCallback(async () => {
        setCameraError("")
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }
        } catch {
            setCameraError("No se pudo acceder a la cámara. Podés continuar sin selfie.")
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
    }, [])

    useEffect(() => {
        if (step === "selfie") startCamera()
        return () => { if (step === "selfie") stopCamera() }
    }, [step, startCamera, stopCamera])

    const takeSelfie = () => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        // Mirror the image (selfie style)
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
        setSelfieDataUrl(dataUrl)
        stopCamera()
    }

    const retakeSelfie = () => {
        setSelfieDataUrl(null)
        startCamera()
    }

    const handleNameNext = () => {
        if (!name.trim() || name.trim().length < 2) {
            setNameError("Ingresá tu nombre completo")
            return
        }
        setNameError("")
        setStep("selfie")
    }

    const handleSubmit = async () => {
        setStep("submitting")
        try {
            const res = await fetch("/api/event/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gallerySlug: slug,
                    name: name.trim(),
                    selfieDataUrl: selfieDataUrl || null,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Guardar token en localStorage para esta galería
            localStorage.setItem(`event_token_${slug}`, data.accessToken)
            localStorage.setItem(`event_guest_${slug}`, JSON.stringify({
                id: data.guestId,
                name: data.name,
                token: data.accessToken,
            }))

            setStep("done")
            setTimeout(() => router.push(`/g/${slug}`), 1800)
        } catch (err) {
            console.error(err)
            setStep("selfie")
        }
    }

    useEffect(() => {
        async function init() {
            if (!slug) return

            // 🔐 1. Ver si ya existe guest
            const existing = localStorage.getItem(`event_guest_${slug}`)
            if (existing) {
                router.replace(`/g/${slug}`)
                return
            }

            // 🌐 2. Validar galería
            try {
                const res = await fetch(`/api/galleries/public/${slug}`)
                const data = await res.json()

                if (!res.ok) {
                    router.replace(`/g/${slug}`)
                    return
                }

                if (data.galleryType && data.galleryType !== "event") {
                    router.replace(`/g/${slug}`)
                    return
                }

                setGalleryTitle(data.title)
            } catch {
                router.replace(`/g/${slug}`)
            } finally {
                setLoadingGallery(false)
            }
        }

        init()
    }, [slug, router])

    if (loadingGallery) {
        return (
            <div style={styles.root}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#94a3b8" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={styles.root}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.iconWrap}>
                        <Camera size={26} color="white" />
                    </div>
                    <h1 style={styles.title}>¡Bienvenido/a!</h1>
                    <p style={styles.subtitle}>{galleryTitle}</p>
                    <p style={styles.desc}>
                        Registrate para compartir tus fotos con todos los invitados y ver las del fotógrafo.
                    </p>
                </div>

                {/* Step: Nombre */}
                {step === "info" && (
                    <div style={styles.body}>
                        <div style={styles.stepBadge}>Paso 1 de 2 · Tu nombre</div>
                        <label style={styles.label}>¿Cómo te llamás?</label>
                        <input
                            style={{ ...styles.input, borderColor: nameError ? "#fca5a5" : "#e2e8f0" }}
                            type="text"
                            placeholder="Ej: Sofía González"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                            autoFocus
                        />
                        {nameError && <p style={styles.error}>{nameError}</p>}
                        <button style={styles.btnPrimary} onClick={handleNameNext}>
                            Continuar <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* Step: Selfie */}
                {step === "selfie" && (
                    <div style={styles.body}>
                        <div style={styles.stepBadge}>Paso 2 de 2 · Tu selfie</div>
                        <p style={styles.label}>Sacate una selfie para que los demás te reconozcan</p>

                        <div style={styles.cameraWrap}>
                            {!selfieDataUrl ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        style={{ ...styles.video, transform: "scaleX(-1)" }}
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                    {cameraError ? (
                                        <div style={styles.cameraError}>
                                            <X size={18} color="#ef4444" />
                                            <span>{cameraError}</span>
                                        </div>
                                    ) : (
                                        <button style={styles.captureBtn} onClick={takeSelfie}>
                                            <div style={styles.captureInner} />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <img src={selfieDataUrl} alt="Selfie" style={styles.selfiePreview} />
                            )}
                            <canvas ref={canvasRef} style={{ display: "none" }} />
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            {selfieDataUrl && (
                                <button style={styles.btnOutline} onClick={retakeSelfie}>
                                    <RefreshCw size={14} /> Volver a sacar
                                </button>
                            )}
                            <button
                                style={{ ...styles.btnPrimary, flex: 1 }}
                                onClick={handleSubmit}
                            >
                                {selfieDataUrl ? (
                                    <>Listo, entrar <ArrowRight size={16} /></>
                                ) : (
                                    <>Entrar sin selfie <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Submitting */}
                {step === "submitting" && (
                    <div style={{ ...styles.body, textAlign: "center", padding: "40px 24px" }}>
                        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#6366f1", margin: "0 auto 16px" }} />
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Registrando...</p>
                    </div>
                )}

                {/* Step: Done */}
                {step === "done" && (
                    <div style={{ ...styles.body, textAlign: "center", padding: "40px 24px" }}>
                        <div style={styles.successIcon}>
                            <Check size={28} color="white" />
                        </div>
                        <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                            ¡Listo, {name.split(" ")[0]}!
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b" }}>Entrando a la galería...</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

const styles = {
    root: {
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
    },
    card: {
        background: "white",
        borderRadius: 24,
        width: "100%",
        maxWidth: 420,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        animation: "fadeUp 0.4s ease",
    },
    header: {
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        padding: "32px 24px 28px",
        textAlign: "center",
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 18,
        background: "rgba(255,255,255,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
    },
    title: { fontSize: 22, fontWeight: 800, color: "white", margin: "0 0 4px", letterSpacing: "-0.02em" },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 10px", fontWeight: 500 },
    desc: { fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5 },
    body: { padding: "24px" },
    stepBadge: {
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        color: "#6366f1",
        background: "#eef2ff",
        padding: "4px 10px",
        borderRadius: 20,
        marginBottom: 16,
        letterSpacing: "0.02em",
    },
    label: { fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 10px", display: "block" },
    input: {
        width: "100%",
        padding: "12px 14px",
        fontSize: 15,
        border: "2px solid #e2e8f0",
        borderRadius: 12,
        outline: "none",
        fontFamily: "inherit",
        color: "#0f172a",
        marginBottom: 6,
        boxSizing: "border-box",
        transition: "border-color 0.15s",
    },
    error: { fontSize: 12, color: "#ef4444", margin: "0 0 12px" },
    btnPrimary: {
        width: "100%",
        padding: "13px 20px",
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        color: "white",
        border: "none",
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 12,
        fontFamily: "inherit",
    },
    btnOutline: {
        padding: "13px 16px",
        background: "white",
        color: "#475569",
        border: "1.5px solid #e2e8f0",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
    },
    cameraWrap: {
        position: "relative",
        width: "100%",
        aspectRatio: "1",
        borderRadius: 16,
        overflow: "hidden",
        background: "#0f172a",
        marginBottom: 16,
    },
    video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    selfiePreview: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    captureBtn: {
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: 60,
        height: 60,
        borderRadius: "50%",
        border: "4px solid white",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    },
    captureInner: {
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "white",
    },
    cameraError: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "#ef4444",
        fontSize: 13,
        fontWeight: 500,
        background: "#0f172a",
        padding: 24,
        textAlign: "center",
    },
    successIcon: {
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #10b981, #059669)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
        boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
    },
}