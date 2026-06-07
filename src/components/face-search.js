"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Camera, X, Loader2, ScanFace, RefreshCw, AlertCircle, CheckCircle, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Carga face-api.js desde /public/faceapi-loader.js ───────────────────────
let faPromise = null

function loadFaceApi() {
    if (faPromise) return faPromise
    faPromise = new Promise((resolve, reject) => {
        if (window._faceapiReady) return resolve(window.faceapi)
        const script = document.createElement("script")
        script.src = "/faceapi-loader.js"
        script.onload = async () => {
            try {
                const fa = await window.faceapiInit()
                window._faceapiReady = true
                resolve(fa)
            } catch (err) { reject(err) }
        }
        script.onerror = () => reject(new Error("No se pudo cargar face-api"))
        document.head.appendChild(script)
    })
    return faPromise
}

// ─── Opciones del detector ────────────────────────────────────────────────────
// inputSize 416 es el mejor balance velocidad/precisión con TinyFaceDetector
const DETECTOR_OPTIONS = (fa) => new fa.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.28,
})

// ─── Normalización de imagen ─────────────────────────────────────────────────
// Aplica corrección de brillo/contraste sobre un canvas
// para reducir el impacto de condiciones de iluminación distintas
function normalizeCanvas(src) {
    const dst = document.createElement("canvas")
    dst.width = src.width
    dst.height = src.height
    const ctx = dst.getContext("2d")
    ctx.drawImage(src, 0, 0)

    const imageData = ctx.getImageData(0, 0, dst.width, dst.height)
    const data = imageData.data

    // Calcular luminosidad media
    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    }
    const avgLuma = sum / (data.length / 4)

    // Ajustar brillo hacia 128 (neutro)
    const target = 128
    const adjust = target - avgLuma

    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + adjust))
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjust))
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjust))
    }

    ctx.putImageData(imageData, 0, 0)
    return dst
}

// ─── Flip horizontal de un canvas ────────────────────────────────────────────
function flipCanvas(src) {
    const dst = document.createElement("canvas")
    dst.width = src.width
    dst.height = src.height
    const ctx = dst.getContext("2d")
    ctx.translate(src.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(src, 0, 0)
    return dst
}

// ─── Promediar descriptores (centroide) ───────────────────────────────────────
// Reduce el ruido tomando el centroide de N descriptores del mismo rostro
function averageDescriptors(descriptors) {
    if (descriptors.length === 1) return descriptors[0]
    const len = descriptors[0].length
    const avg = new Float32Array(len)
    for (const d of descriptors) {
        for (let i = 0; i < len; i++) avg[i] += d[i]
    }
    for (let i = 0; i < len; i++) avg[i] /= descriptors.length
    // Re-normalizar el centroide
    let norm = 0
    for (let i = 0; i < len; i++) norm += avg[i] ** 2
    norm = Math.sqrt(norm) || 1
    for (let i = 0; i < len; i++) avg[i] /= norm
    return avg
}

// ─── Obtener descriptor de la selfie ─────────────────────────────────────────
// Estrategia multi-shot: detectar en la imagen original + flip + normalizada.
// Si alguna falla, se usa solo las que funcionaron.
// Devuelve un descriptor promediado (más robusto) o null si no detectó nada.
async function getSelfieDescriptors(fa, imgEl) {
    // Dibujar el elemento en un canvas para poder manipularlo
    const base = document.createElement("canvas")
    base.width = imgEl.naturalWidth || imgEl.width
    base.height = imgEl.naturalHeight || imgEl.height
    base.getContext("2d").drawImage(imgEl, 0, 0)

    const variants = [
        base,
        normalizeCanvas(base),
        flipCanvas(base),
        normalizeCanvas(flipCanvas(base)),
    ]

    const opts = DETECTOR_OPTIONS(fa)
    const descriptors = []

    for (const canvas of variants) {
        try {
            const det = await fa
                .detectSingleFace(canvas, opts)
                .withFaceLandmarks()
                .withFaceDescriptor()
            if (det?.descriptor) descriptors.push(det.descriptor)
        } catch { /* ignorar variante fallida */ }
    }

    if (descriptors.length === 0) {
        // Último intento: inputSize máximo y umbral muy bajo
        try {
            const fallback = new fa.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.18 })
            const det = await fa
                .detectSingleFace(base, fallback)
                .withFaceLandmarks()
                .withFaceDescriptor()
            if (det?.descriptor) descriptors.push(det.descriptor)
        } catch { /* nada más que hacer */ }
    }

    if (descriptors.length === 0) return null
    return averageDescriptors(descriptors)
}

// ─── Obtener descriptores de una foto de la galería ──────────────────────────
// Detecta TODAS las caras. Para cada una extrae descriptor en original + normalizado
// y los promedia. Así una cara en sombra o sobreexpuesta tiene mejor representación.
async function getPhotoDescriptors(fa, imgEl) {
    const base = document.createElement("canvas")
    base.width = imgEl.naturalWidth || imgEl.width
    base.height = imgEl.naturalHeight || imgEl.height
    base.getContext("2d").drawImage(imgEl, 0, 0)

    const normalized = normalizeCanvas(base)
    const opts = DETECTOR_OPTIONS(fa)

    // Detectar en original
    const detsBase = await fa
        .detectAllFaces(base, opts)
        .withFaceLandmarks()
        .withFaceDescriptors()

    if (!detsBase.length) return []

    // Para cada cara, también extraer de la versión normalizada si existe
    const detsNorm = await fa
        .detectAllFaces(normalized, opts)
        .withFaceLandmarks()
        .withFaceDescriptors()

    const results = detsBase.map((detBase, idx) => {
        const bucket = [detBase.descriptor]
        if (detsNorm[idx]?.descriptor) bucket.push(detsNorm[idx].descriptor)
        return averageDescriptors(bucket)
    })

    return results
}

// ─── Cargar imagen desde URL ──────────────────────────────────────────────────
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

// ─── Umbrales ─────────────────────────────────────────────────────────────────
// face-api recomienda 0.6. Usamos 0.58 para un balance real entre
// falsos positivos y falsos negativos en fotos de eventos/grupos.
const THRESHOLD = 0.50

// ─── Estados ──────────────────────────────────────────────────────────────────
const STEPS = { IDLE: "idle", CAMERA: "camera", PROCESSING: "processing", RESULTS: "results", ERROR: "error" }

// ─── Componente ───────────────────────────────────────────────────────────────
export default function FaceSearch({ photos, galleryPassword = null, onPhotoFound, onClose }) {
    const [step, setStep] = useState(STEPS.CAMERA)
    const [progress, setProgress] = useState({ current: 0, total: 0, message: "" })
    const [matches, setMatches] = useState([])
    const [error, setError] = useState("")
    const [stream, setStream] = useState(null)
    const [capturedImage, setCapturedImage] = useState(null)
    const [capturedFrames, setCapturedFrames] = useState([]) // multi-shot
    const [capturingMulti, setCapturingMulti] = useState(false)

    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        return () => { if (stream) stream.getTracks().forEach((t) => t.stop()) }
    }, [stream])

    // Iniciar cámara automáticamente al montar el componente
    useEffect(() => {
        startCamera()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const startCamera = async () => {
        setError("")
        setStep(STEPS.CAMERA)
        setCapturedImage(null)
        setCapturedFrames([])
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            })
            setStream(mediaStream)
            if (videoRef.current) videoRef.current.srcObject = mediaStream
        } catch {
            setError("No se pudo acceder a la cámara. Verificá los permisos del navegador.")
            setStep(STEPS.ERROR)
        }
    }

    const stopCamera = useCallback(() => {
        if (stream) stream.getTracks().forEach((t) => t.stop())
        setStream(null)
    }, [stream])

    // Capturar un frame del video como dataURL
    const captureFrame = useCallback(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return null
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        ctx.save()
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0)
        ctx.restore()
        return canvas.toDataURL("image/jpeg", 0.92)
    }, [])

    // Captura automática: 3 frames con 400ms de diferencia para mayor robustez
    const captureMulti = async () => {
        setCapturingMulti(true)
        const frames = []
        for (let i = 0; i < 3; i++) {
            const frame = captureFrame()
            if (frame) frames.push(frame)
            if (i < 2) await new Promise(r => setTimeout(r, 400))
        }
        setCapturingMulti(false)
        if (frames.length === 0) return
        setCapturedFrames(frames)
        setCapturedImage(frames[0]) // preview
        stopCamera()
    }

    const retake = () => {
        setCapturedImage(null)
        setCapturedFrames([])
        startCamera()
    }

    const search = async () => {
        if (!capturedImage) return
        setStep(STEPS.PROCESSING)
        setProgress({ current: 0, total: 0, message: "Cargando modelos..." })

        try {
            const fa = await loadFaceApi()

            // ── Selfie: promediar descriptores de todos los frames capturados ──
            setProgress({ current: 0, total: 0, message: "Analizando tu selfie..." })

            const frames = capturedFrames.length > 0 ? capturedFrames : [capturedImage]
            const selfieDescriptors = []

            for (const frameUrl of frames) {
                try {
                    const img = await loadImage(frameUrl)
                    const desc = await getSelfieDescriptors(fa, img)
                    if (desc) selfieDescriptors.push(desc)
                } catch { /* ignorar frame fallido */ }
            }

            if (selfieDescriptors.length === 0) {
                setError("No se detectó ninguna cara en la selfie. Intentá con mejor iluminación, de frente y sin lentes.")
                setStep(STEPS.ERROR)
                return
            }

            // Centroide de todos los frames de la selfie
            const selfieDescriptor = averageDescriptors(selfieDescriptors)

            // ── Galería ───────────────────────────────────────────────
            const photosWithId = photos.filter((p) => p.id)
            setProgress({ current: 0, total: photosWithId.length, message: "Buscando en las fotos..." })

            const results = []

            for (let i = 0; i < photosWithId.length; i++) {
                const photo = photosWithId[i]
                setProgress({
                    current: i + 1,
                    total: photosWithId.length,
                    message: `Analizando foto ${i + 1} de ${photosWithId.length}...`,
                })

                try {
                    const url = galleryPassword
                        ? `/api/photos/protected/${photo.id}?pwd=${encodeURIComponent(galleryPassword)}`
                        : `/api/photos/protected/${photo.id}`

                    const img = await loadImage(url)
                    const descriptors = await getPhotoDescriptors(fa, img)

                    // Tomar la distancia mínima entre la selfie y cualquier cara en la foto
                    let bestDist = Infinity
                    for (const descriptor of descriptors) {
                        const dist = fa.euclideanDistance(selfieDescriptor, descriptor)
                        if (dist < bestDist) bestDist = dist
                    }

                    if (bestDist < THRESHOLD) {
                        const confidence = Math.round((1 - bestDist / THRESHOLD) * 100)
                        results.push({ photo, distance: bestDist, confidence })
                    }
                } catch {
                    console.warn(`No se pudo procesar foto ${photo.id}`)
                }
            }

            results.sort((a, b) => a.distance - b.distance)
            setMatches(results)
            setStep(STEPS.RESULTS)

        } catch (err) {
            console.error("Error en búsqueda facial:", err)
            setError("Ocurrió un error durante la búsqueda. Intentá de nuevo.")
            setStep(STEPS.ERROR)
        }
    }

    const reset = () => {
        stopCamera()
        setCapturedImage(null)
        setCapturedFrames([])
        setMatches([])
        setError("")
        setProgress({ current: 0, total: 0, message: "" })
        onClose?.()
    }

    const protectedUrl = (id) => galleryPassword
        ? `/api/photos/protected/${id}?pwd=${encodeURIComponent(galleryPassword)}`
        : `/api/photos/protected/${id}`

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl w-full sm:max-w-lg h-dvh sm:h-auto sm:max-h-[90dvh] flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
                            <div className="flex items-center gap-2">
                                <ScanFace size={18} className="text-neutral-700" />
                                <h2 className="font-semibold text-neutral-900">Buscarme en las fotos</h2>
                            </div>
                            <button onClick={reset} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* CÁMARA */}
                        {step === STEPS.CAMERA && (
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <p className="text-sm text-neutral-500 text-center">
                                    Mirá de frente a la cámara con buena iluminación
                                </p>
                                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                                    {!capturedImage ? (
                                        <video ref={videoRef} autoPlay playsInline muted
                                            className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                                    ) : (
                                        <img src={capturedImage} alt="Selfie capturada" className="w-full h-full object-cover" />
                                    )}
                                    {!capturedImage && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-44 h-56 border-2 border-white/60 rounded-full" />
                                        </div>
                                    )}
                                    {/* Indicador de frames capturados */}
                                    {capturedImage && capturedFrames.length > 1 && (
                                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                            {capturedFrames.length} frames ✓
                                        </div>
                                    )}
                                </div>
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Indicador de multi-captura */}
                                {capturingMulti && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                                        <Loader2 size={14} className="animate-spin" />
                                        Capturando frames...
                                    </div>
                                )}

                                {!capturedImage ? (
                                    <Button onClick={captureMulti} className="w-full gap-2" disabled={capturingMulti}>
                                        {capturingMulti ? (
                                            <><Loader2 size={16} className="animate-spin" /> Capturando...</>
                                        ) : (
                                            <><Camera size={16} /> Sacar foto</>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={retake} className="flex-1 gap-2">
                                            <RefreshCw size={16} /> Repetir
                                        </Button>
                                        <Button onClick={search} className="flex-1 gap-2">
                                            <ScanFace size={16} /> Buscar
                                        </Button>
                                    </div>
                                )}

                                {/* Tip de iluminación */}
                                {!capturedImage && (
                                    <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-1">
                                        <Sun size={12} />
                                        Mejor resultado con luz natural de frente, sin lentes
                                    </p>
                                )}
                            </div>
                        )}

                        {/* PROCESANDO */}
                        {step === STEPS.PROCESSING && (
                            <div className="flex-1 overflow-y-auto p-8 text-center space-y-5">
                                <div className="relative inline-flex">
                                    <Loader2 size={40} className="animate-spin text-neutral-300" />
                                    <ScanFace size={18} className="absolute inset-0 m-auto text-neutral-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">{progress.message}</p>
                                    {progress.total > 0 && (
                                        <p className="text-sm text-neutral-400 mt-1">
                                            {progress.current} / {progress.total} fotos analizadas
                                        </p>
                                    )}
                                </div>
                                {progress.total > 0 && (
                                    <div className="w-full bg-neutral-100 rounded-full h-2">
                                        <div className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                                    </div>
                                )}
                                <p className="text-xs text-neutral-400">
                                    El análisis se hace en tu dispositivo — tus fotos no se envían a ningún servidor
                                </p>
                            </div>
                        )}

                        {/* RESULTADOS */}
                        {step === STEPS.RESULTS && (
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {matches.length === 0 ? (
                                    <div className="text-center py-8 space-y-3">
                                        <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-100 rounded-full">
                                            <ScanFace size={24} className="text-neutral-400" />
                                        </div>
                                        <p className="font-medium text-neutral-700">No encontramos fotos tuyas</p>
                                        <p className="text-sm text-neutral-400">
                                            Intentá con luz natural de frente y sin lentes
                                        </p>
                                        <Button variant="outline" onClick={retake} className="gap-2 mt-2">
                                            <RefreshCw size={15} /> Intentar de nuevo
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span className="font-medium text-neutral-900">
                                                {matches.length} {matches.length === 1 ? "foto encontrada" : "fotos encontradas"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                                            {matches.map(({ photo, confidence }) => (
                                                <button key={photo.id}
                                                    onClick={() => { onPhotoFound?.(photo); reset() }}
                                                    className="relative group aspect-square rounded-xl overflow-hidden bg-neutral-100 hover:ring-2 hover:ring-neutral-900 transition-all">
                                                    <img src={protectedUrl(photo.id)} alt={photo.title || "Foto"} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                                                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                            {confidence}% similitud
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-neutral-400 text-center">
                                            Hacé click en una foto para verla en detalle
                                        </p>
                                    </>
                                )}
                                <Button variant="outline" onClick={reset} className="w-full">Cerrar</Button>
                            </div>
                        )}

                        {/* ERROR */}
                        {step === STEPS.ERROR && (
                            <div className="flex-1 overflow-y-auto p-8 text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full">
                                    <AlertCircle size={24} className="text-red-400" />
                                </div>
                                <p className="text-sm text-neutral-600">{error}</p>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={reset} className="flex-1">Cancelar</Button>
                                    <Button onClick={startCamera} className="flex-1 gap-2">
                                        <RefreshCw size={15} /> Intentar de nuevo
                                    </Button>
                                </div>
                            </div>
                        )}
            </div>
        </div>
    )
}