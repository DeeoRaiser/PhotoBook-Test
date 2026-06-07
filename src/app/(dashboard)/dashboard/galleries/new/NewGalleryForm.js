"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    ArrowLeft, Lock, Globe, Images, Info, AlertTriangle,
    Camera, Users, DollarSign, Gift, Clock, Timer, Loader2,
    CreditCard, CheckCircle2, XCircle, Printer, CalendarClock
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const schema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    isPublic: z.boolean().default(true),
    password: z.string().optional(),
    galleryType: z.enum(["standard", "event"]).default("standard"),
    themeId: z.string().optional().nullable(),
    proPhotosAreFree: z.boolean().default(false),
    eventStartsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    downloadLinkDuration: z.number().int().min(1).max(8760).default(48),
}).refine((data) => {
    if (!data.isPublic && (!data.password || data.password.length < 4)) return false
    return true
}, {
    message: "Las galerías privadas requieren una contraseña de al menos 4 caracteres",
    path: ["password"],
})

export default function NewGalleryForm({ planName, maxPhotos, galleriesUsed, galleriesMax, allowsEventGalleries, freeEventGalleries, extraEventGalleryPrice, eventGalleriesUsed, allowsPrintable }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [serverError, setServerError] = useState("")
    const [isPublic, setIsPublic] = useState(true)
    const [galleryType, setGalleryType] = useState("standard")
    const [proPhotosAreFree, setProPhotosAreFree] = useState(false)
    const [hasExpiry, setHasExpiry] = useState(false)
    const [hasEventStart, setHasEventStart] = useState(false)
    const [printableEnabled, setPrintableEnabled] = useState(false)
    const [themeId, setThemeId] = useState(null)       // null hasta que carguen los themes
    const [themes, setThemes] = useState([])
    const [loadingThemes, setLoadingThemes] = useState(true)

    const [mpModal, setMpModal] = useState(null)
    const pollRef = useRef(null)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { isPublic: true, galleryType: "standard", proPhotosAreFree: false, downloadLinkDuration: 48, themeId: null, eventStartsAt: null },
    })

/*     // Cargar themes disponibles desde la API
    useEffect(() => {
        fetch("/api/themes")
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : []
                setThemes(list)
                // Seleccionar "classic" por defecto si existe
                const defaultTheme = list.find(t => t.slug === "classic") || list[0]
                if (defaultTheme) {
                    setThemeId(defaultTheme.id)
                    setValue("themeId", defaultTheme.id)
                }
                setLoadingThemes(false)
            })
            .catch(() => setLoadingThemes(false))
    }, [setValue]) */

    // Detectar retorno desde MP
    useEffect(() => {
        const eventPayment = searchParams.get("event_payment")
        const pid = searchParams.get("pid")
        if (!pid) return
        if (eventPayment === "success" || eventPayment === "pending") {
            setMpModal({ step: "waiting", paymentRecordId: pid })
            startPolling(pid)
        } else if (eventPayment === "failure") {
            setMpModal({ step: "failure", paymentRecordId: pid })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startPolling = (pid) => {
        let attempts = 0
        const maxAttempts = 24
        pollRef.current = setInterval(async () => {
            attempts++
            try {
                const res = await fetch(`/api/photographer/event-gallery-checkout?pid=${pid}`)
                const json = await res.json()
                if (json.status === "APPROVED" && json.galleryId) {
                    clearInterval(pollRef.current)
                    setMpModal({ step: "success", galleryId: json.galleryId })
                } else if (json.status === "FAILED" || attempts >= maxAttempts) {
                    clearInterval(pollRef.current)
                    setMpModal({ step: "failure", paymentRecordId: pid })
                }
            } catch { }
        }, 5000)
    }

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const isExtraEventGallery = galleryType === "event" && allowsEventGalleries && eventGalleriesUsed >= freeEventGalleries && extraEventGalleryPrice > 0

    const onSubmit = async (data) => {
        setServerError("")
        // Resolver el slug del theme seleccionado (la API espera themeSlug, no themeId)
        const selectedTheme = themes.find(t => t.id === themeId)
        const themeSlug = selectedTheme?.slug ?? "classic"

        const { themeId: _drop, ...rest } = data
        const payload = {
            ...rest,
            expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
            eventStartsAt: data.eventStartsAt ? new Date(data.eventStartsAt).toISOString() : null,
            downloadLinkDuration: Number(data.downloadLinkDuration) || 48,
            printableEnabled: allowsPrintable ? printableEnabled : false,
            themeSlug,
        }

        if (data.galleryType === "event" && isExtraEventGallery) {
            setMpModal({ step: "confirm", pendingData: payload, amount: extraEventGalleryPrice })
            return
        }

        const res = await fetch("/api/galleries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        if (res.ok) {
            const gallery = await res.json()
            router.push(`/dashboard/galleries/${gallery.id}`)
        } else {
            const json = await res.json()
            setServerError(json.error || "Error al crear la galería")
        }
    }

    const handleConfirmPayment = async () => {
        if (!mpModal?.pendingData) return
        setMpModal(prev => ({ ...prev, step: "processing" }))
        try {
            const res = await fetch("/api/photographer/event-gallery-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mpModal.pendingData),
            })
            const json = await res.json()
            if (!res.ok) {
                setMpModal(null)
                setServerError(json.error || "Error al iniciar el pago")
                return
            }
            const url = process.env.NODE_ENV === "production" ? json.initPoint : json.sandboxInitPoint || json.initPoint
            window.location.href = url
        } catch {
            setMpModal(null)
            setServerError("Error al conectar con el servidor de pagos")
        }
    }

    const handleToggleExpiry = (enabled) => {
        setHasExpiry(enabled)
        if (!enabled) setValue("expiresAt", null)
    }

    const handleToggleEventStart = (enabled) => {
        setHasEventStart(enabled)
        if (!enabled) setValue("eventStartsAt", null)
    }

    const handleVisibility = (pub) => {
        setIsPublic(pub)
        setValue("isPublic", pub)
        if (pub) setValue("password", "")
    }

    const handleType = (type) => {
        setGalleryType(type)
        setValue("galleryType", type)
        if (type === "standard") {
            setProPhotosAreFree(false)
            setValue("proPhotosAreFree", false)
            setHasEventStart(false)
            setValue("eventStartsAt", null)
        }
    }

    const handleThemeChange = (id) => {
        setThemeId(id)
        setValue("themeId", id)
    }

    const handleProFree = (free) => {
        setProPhotosAreFree(free)
        setValue("proPhotosAreFree", free)
    }

    return (
        <div className="px-0 py-4 md:p-8 max-w-2xl mx-auto">
            <div className="flex items-end gap-3 mb-8 justify-center">
                <Link href="/dashboard/galleries">
                    <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">Nueva galería</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">Configurá los detalles de tu galería</p>
                </div>
            </div>

            {/* Info del plan */}
            <div className="mb-6 flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                <Info size={15} className="text-neutral-400 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-500">
                    Plan <strong className="text-neutral-700">{planName}</strong>
                    {galleriesMax !== -1 && <> · Galerías: {galleriesUsed + 1} de {galleriesMax}</>}
                    {maxPhotos !== -1 && <> · Hasta <strong className="text-neutral-700">{maxPhotos} fotos</strong> por galería</>}
                    {maxPhotos === -1 && <> · Fotos ilimitadas por galería</>}
                    {allowsEventGalleries && freeEventGalleries > 0 && <> · Eventos: {eventGalleriesUsed} usados ({Math.max(0, freeEventGalleries - eventGalleriesUsed)} gratis restantes)</>}
                    {allowsEventGalleries && freeEventGalleries === 0 && extraEventGalleryPrice > 0 && <> · Eventos: {eventGalleriesUsed} usados (sin cupo gratis, ${extraEventGalleryPrice.toLocaleString("es-AR")} c/u)</>}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Información general */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Información general</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="title">Título *</Label>
                            <Input id="title" {...register("title")} placeholder="Ej: Casamiento García - Noviembre 2024" />
                            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="description">Descripción (opcional)</Label>
                            <textarea
                                id="description"
                                {...register("description")}
                                placeholder="Una breve descripción de la galería..."
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tipo de galería */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Tipo de galería</CardTitle>
                        <CardDescription>Elegí el tipo según el uso que le vas a dar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => handleType("standard")}
                                className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-colors ${galleryType === "standard" ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                <div className={`p-2 rounded-lg ${galleryType === "standard" ? "bg-neutral-900" : "bg-neutral-100"}`}>
                                    <Images size={18} className={galleryType === "standard" ? "text-white" : "text-neutral-400"} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${galleryType === "standard" ? "text-neutral-900" : "text-neutral-500"}`}>Estándar</p>
                                    <p className="text-xs text-neutral-400 mt-0.5">Solo fotos del fotógrafo</p>
                                </div>
                            </button>

                            <button type="button" onClick={() => allowsEventGalleries && handleType("event")} disabled={!allowsEventGalleries}
                                className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-colors ${!allowsEventGalleries ? "border-neutral-100 bg-neutral-50 opacity-50 cursor-not-allowed" : galleryType === "event" ? "border-indigo-600 bg-indigo-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                <div className={`p-2 rounded-lg ${galleryType === "event" && allowsEventGalleries ? "bg-indigo-600" : "bg-neutral-100"}`}>
                                    <Users size={18} className={galleryType === "event" && allowsEventGalleries ? "text-white" : "text-neutral-400"} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${galleryType === "event" && allowsEventGalleries ? "text-indigo-700" : "text-neutral-500"}`}>Evento</p>
                                    <p className="text-xs text-neutral-400 mt-0.5">
                                        {!allowsEventGalleries ? "No incluido en tu plan" : (eventGalleriesUsed < freeEventGalleries || freeEventGalleries === 0) ? "Fotógrafo + invitados · QR" : `Galería extra · $${extraEventGalleryPrice.toLocaleString("es-AR")}`}
                                    </p>
                                </div>
                            </button>
                        </div>

                        {galleryType === "event" && (
                            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                                <Camera size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-indigo-700 leading-relaxed">
                                    La galería tendrá dos secciones: <strong>Profesional</strong> (tus fotos) e <strong>Invitados</strong> (fotos de los asistentes).
                                    Los invitados se registran escaneando un <strong>QR</strong> y pueden subir sus propias fotos y videos.
                                </p>
                            </div>
                        )}

                        {galleryType === "event" && allowsEventGalleries && eventGalleriesUsed >= freeEventGalleries && extraEventGalleryPrice > 0 && (
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    Ya usaste tus <strong>{freeEventGalleries}</strong> galería{freeEventGalleries !== 1 ? "s" : ""} de evento incluidas en el plan.
                                    Esta galería tendrá un costo adicional de <strong>${extraEventGalleryPrice.toLocaleString("es-AR")}</strong>.
                                </p>
                            </div>
                        )}

                        {galleryType === "event" && (
                            <div>
                                <Label className="mb-2 block text-sm font-medium text-neutral-700">Fotos del fotógrafo</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => handleProFree(false)}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${!proPhotosAreFree ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                        <DollarSign size={18} className={!proPhotosAreFree ? "text-neutral-900 mt-0.5" : "text-neutral-400 mt-0.5"} />
                                        <div>
                                            <p className={`text-sm font-semibold ${!proPhotosAreFree ? "text-neutral-900" : "text-neutral-500"}`}>Con costo</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">Los invitados pagan para descargar</p>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => handleProFree(true)}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${proPhotosAreFree ? "border-emerald-600 bg-emerald-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                        <Gift size={18} className={proPhotosAreFree ? "text-emerald-600 mt-0.5" : "text-neutral-400 mt-0.5"} />
                                        <div>
                                            <p className={`text-sm font-semibold ${proPhotosAreFree ? "text-emerald-700" : "text-neutral-500"}`}>Gratis</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">Descarga libre para todos</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {galleryType === "event" && (
                            <div className="border-t border-neutral-100 pt-4">
                                <Label className="mb-2 block text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                    <CalendarClock size={14} className="text-neutral-400" /> Fecha y hora de inicio del evento
                                </Label>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <button type="button" onClick={() => handleToggleEventStart(false)}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${!hasEventStart ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                        <Globe size={18} className={!hasEventStart ? "text-neutral-900" : "text-neutral-400"} />
                                        <div>
                                            <p className={`text-sm font-semibold ${!hasEventStart ? "text-neutral-900" : "text-neutral-500"}`}>Sin cuenta regresiva</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">La galería abre de inmediato</p>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => handleToggleEventStart(true)}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${hasEventStart ? "border-indigo-600 bg-indigo-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                        <CalendarClock size={18} className={hasEventStart ? "text-indigo-600" : "text-neutral-400"} />
                                        <div>
                                            <p className={`text-sm font-semibold ${hasEventStart ? "text-indigo-700" : "text-neutral-500"}`}>Con cuenta regresiva</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">Compartí el link antes del evento</p>
                                        </div>
                                    </button>
                                </div>
                                {hasEventStart && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="eventStartsAt">Inicio del evento *</Label>
                                        <Input
                                            id="eventStartsAt"
                                            type="datetime-local"
                                            {...register("eventStartsAt")}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 mt-2">
                                            <CalendarClock size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-indigo-700 leading-relaxed">
                                                Hasta esa fecha y hora, quienes accedan al link verán una <strong>pantalla de cuenta regresiva</strong> personalizada con el nombre de la galería. Al llegar el momento, la galería se abre automáticamente.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Visibilidad */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Visibilidad</CardTitle>
                        <CardDescription>Las galerías privadas requieren contraseña para acceder</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => handleVisibility(true)}
                                className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-colors ${isPublic ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                <Globe size={20} className={isPublic ? "text-neutral-900" : "text-neutral-400"} />
                                <div>
                                    <p className={`text-sm font-medium ${isPublic ? "text-neutral-900" : "text-neutral-500"}`}>Pública</p>
                                    <p className="text-xs text-neutral-400">Cualquiera con el link</p>
                                </div>
                            </button>
                            <button type="button" onClick={() => handleVisibility(false)}
                                className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-colors ${!isPublic ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                <Lock size={20} className={!isPublic ? "text-neutral-900" : "text-neutral-400"} />
                                <div>
                                    <p className={`text-sm font-medium ${!isPublic ? "text-neutral-900" : "text-neutral-500"}`}>Privada</p>
                                    <p className="text-xs text-neutral-400">Solo con contraseña</p>
                                </div>
                            </button>
                        </div>
                        {!isPublic && (
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Contraseña de acceso *</Label>
                                <Input id="password" type="text" {...register("password")} placeholder="Contraseña que le darás al cliente" />
                                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vencimiento y descargas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock size={16} /> Vencimiento y descargas
                        </CardTitle>
                        <CardDescription>Controlá hasta cuándo se puede acceder y por cuánto tiempo son válidos los links de descarga</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <Label className="mb-2 block text-sm font-medium text-neutral-700">Fecha de vencimiento de la galería</Label>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <button type="button" onClick={() => handleToggleExpiry(false)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${!hasExpiry ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                    <Globe size={18} className={!hasExpiry ? "text-neutral-900" : "text-neutral-400"} />
                                    <div>
                                        <p className={`text-sm font-semibold ${!hasExpiry ? "text-neutral-900" : "text-neutral-500"}`}>Sin vencimiento</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">La galería no expira</p>
                                    </div>
                                </button>
                                <button type="button" onClick={() => handleToggleExpiry(true)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${hasExpiry ? "border-amber-500 bg-amber-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                    <Clock size={18} className={hasExpiry ? "text-amber-600" : "text-neutral-400"} />
                                    <div>
                                        <p className={`text-sm font-semibold ${hasExpiry ? "text-amber-700" : "text-neutral-500"}`}>Con vencimiento</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">Definí una fecha límite</p>
                                    </div>
                                </button>
                            </div>
                            {hasExpiry && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="expiresAt">Activa hasta *</Label>
                                    <Input id="expiresAt" type="datetime-local" {...register("expiresAt")} min={new Date().toISOString().slice(0, 16)} />
                                    <p className="text-xs text-neutral-400">Después de esta fecha los clientes no podrán ver ni comprar fotos.</p>
                                    {errors.expiresAt && <p className="text-sm text-red-500">{errors.expiresAt.message}</p>}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-neutral-100">
                            <Label htmlFor="downloadLinkDuration" className="flex items-center gap-1.5">
                                <Timer size={14} className="text-neutral-400" /> Duración de links de descarga
                            </Label>
                            <select id="downloadLinkDuration" {...register("downloadLinkDuration", { valueAsNumber: true })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <option value={24}>24 horas</option>
                                <option value={48}>48 horas (recomendado)</option>
                                <option value={72}>72 horas</option>
                                <option value={168}>7 días</option>
                                <option value={720}>30 días</option>
                                <option value={8760}>1 año</option>
                            </select>
                            <p className="text-xs text-neutral-400">Los links de descarga enviados al cliente expirarán después de este tiempo.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Versión Imprimible */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Printer size={16} /> Versión Imprimible
                        </CardTitle>
                        <CardDescription>
                            {allowsPrintable ? "Permitís que tus clientes compren una versión impresa además de la digital" : "Tu plan actual no incluye la opción de venta de fotos impresas"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {allowsPrintable ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setPrintableEnabled(false)}
                                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-colors ${!printableEnabled ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                    <div className={`p-2 rounded-lg ${!printableEnabled ? "bg-neutral-900" : "bg-neutral-100"}`}>
                                        <Images size={18} className={!printableEnabled ? "text-white" : "text-neutral-400"} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${!printableEnabled ? "text-neutral-900" : "text-neutral-500"}`}>Solo digital</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">Descarga de archivos solamente</p>
                                    </div>
                                </button>
                                <button type="button" onClick={() => setPrintableEnabled(true)}
                                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-colors ${printableEnabled ? "border-orange-500 bg-orange-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                                    <div className={`p-2 rounded-lg ${printableEnabled ? "bg-orange-500" : "bg-neutral-100"}`}>
                                        <Printer size={18} className={printableEnabled ? "text-white" : "text-neutral-400"} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${printableEnabled ? "text-orange-700" : "text-neutral-500"}`}>Digital + Impresión</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">Clientes eligen digital, impresa o ambas</p>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                                <Printer size={15} className="text-neutral-300 shrink-0 mt-0.5" />
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    La opción de impresión está disponible en planes superiores. Contactá al administrador para conocer las opciones de upgrade.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>


                {serverError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-red-600">{serverError}</p>
                    </div>
                )}

                <div className="flex gap-3 justify-end">
                    <Link href="/dashboard/galleries">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? <><Loader2 size={14} className="animate-spin mr-2" />Creando...</>
                            : isExtraEventGallery
                                ? <><CreditCard size={14} className="mr-2" />Pagar y crear galería</>
                                : "Crear galería"
                        }
                    </Button>
                </div>
            </form>

            {/* Modal de pago MP */}
            {mpModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
                    <div style={{ background: "white", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", fontFamily: "'DM Sans', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>

                        {mpModal.step === "confirm" && (<>
                            <div style={{ width: 60, height: 60, borderRadius: 16, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <CreditCard size={28} color="#9333ea" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Galería de evento extra</h2>
                                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Ya usaste todas las galerías de evento incluidas en tu plan.<br />Esta galería tiene un costo adicional de:</p>
                                <p style={{ fontSize: 32, fontWeight: 900, color: "#7e22ce", margin: "12px 0 4px" }}>${mpModal.amount?.toLocaleString("es-AR")}</p>
                                <p style={{ fontSize: 11, color: "#94a3b8" }}>Se procesará vía Mercado Pago</p>
                            </div>
                            <div style={{ display: "flex", gap: 10, width: "100%" }}>
                                <button onClick={() => setMpModal(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>Cancelar</button>
                                <button onClick={handleConfirmPayment} style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7e22ce,#a855f7)", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                    <CreditCard size={14} /> Ir a Mercado Pago
                                </button>
                            </div>
                        </>)}

                        {mpModal.step === "processing" && (<>
                            <Loader2 size={40} color="#9333ea" style={{ animation: "spin 1s linear infinite" }} />
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Generando link de pago…</h2>
                                <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Serás redirigido a Mercado Pago en un momento.</p>
                            </div>
                        </>)}

                        {mpModal.step === "waiting" && (<>
                            <Loader2 size={40} color="#9333ea" style={{ animation: "spin 1s linear infinite" }} />
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Confirmando pago…</h2>
                                <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Estamos procesando tu pago y creando la galería.</p>
                            </div>
                        </>)}

                        {mpModal.step === "success" && (<>
                            <div style={{ width: 60, height: 60, borderRadius: 16, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <CheckCircle2 size={32} color="#16a34a" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>¡Pago confirmado!</h2>
                                <p style={{ fontSize: 13, color: "#64748b" }}>Tu galería de evento fue creada exitosamente.</p>
                            </div>
                            <button onClick={() => router.push(`/dashboard/galleries/${mpModal.galleryId}`)} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#15803d,#16a34a)", fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer" }}>
                                Ir a la galería →
                            </button>
                        </>)}

                        {mpModal.step === "failure" && (<>
                            <div style={{ width: 60, height: 60, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <XCircle size={32} color="#dc2626" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Pago no completado</h2>
                                <p style={{ fontSize: 13, color: "#64748b" }}>El pago no fue procesado. Podés intentarlo de nuevo.</p>
                            </div>
                            <button onClick={() => setMpModal(null)} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "#0f172a", fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer" }}>
                                Volver al formulario
                            </button>
                        </>)}
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}
        </div>
    )
}