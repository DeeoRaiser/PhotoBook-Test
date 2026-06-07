"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    X, Globe, Lock, KeyRound, Eye, EyeOff,
    Loader2, Check, AlertCircle, ShieldOff,
    FileText, Calendar, Download, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Duración del link de descarga en horas → label legible
const DOWNLOAD_DURATIONS = [
    { value: 24,   label: "24 horas" },
    { value: 48,   label: "48 horas" },
    { value: 72,   label: "3 días" },
    { value: 168,  label: "7 días" },
    { value: 336,  label: "14 días" },
    { value: 720,  label: "30 días" },
    { value: 8760, label: "1 año" },
]

function buildSchema(hasPassword) {
    return z.object({
        // Info general
        title:       z.string().min(2, "El título debe tener al menos 2 caracteres"),
        description: z.string().optional(),

        // Visibilidad
        isPublic:        z.boolean(),
        changePassword:  z.boolean(),
        newPassword:     z.string().optional(),
        removePassword:  z.boolean(),

        // Vencimiento
        hasExpiry:    z.boolean(),
        expiresAt:    z.string().optional(),

        // Descarga
        downloadLinkDuration: z.number().int().min(1).max(8760),
    }).superRefine((data, ctx) => {
        if (!data.isPublic) {
            const willHavePassword = data.removePassword
                ? false
                : data.changePassword
                ? !!data.newPassword && data.newPassword.length >= 4
                : hasPassword
            if (!willHavePassword) {
                ctx.addIssue({
                    path: ["newPassword"],
                    code: z.ZodIssueCode.custom,
                    message: "Las galerías privadas requieren contraseña (mínimo 4 caracteres)",
                })
            }
        }
        if (data.changePassword && (!data.newPassword || data.newPassword.length < 4)) {
            ctx.addIssue({
                path: ["newPassword"],
                code: z.ZodIssueCode.custom,
                message: "La contraseña debe tener al menos 4 caracteres",
            })
        }
        if (data.hasExpiry && !data.expiresAt) {
            ctx.addIssue({
                path: ["expiresAt"],
                code: z.ZodIssueCode.custom,
                message: "Elegí una fecha de vencimiento",
            })
        }
        if (data.hasExpiry && data.expiresAt) {
            const d = new Date(data.expiresAt)
            if (isNaN(d.getTime()) || d <= new Date()) {
                ctx.addIssue({
                    path: ["expiresAt"],
                    code: z.ZodIssueCode.custom,
                    message: "La fecha debe ser futura",
                })
            }
        }
    })
}

// Convierte una fecha ISO a string para <input type="datetime-local">
function toDatetimeLocal(iso) {
    if (!iso) return ""
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GallerySettingsModal({ gallery, onClose, onUpdated }) {
    const [saving, setSaving]           = useState(false)
    const [serverError, setServerError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [success, setSuccess]         = useState(false)
    const [activeTab, setActiveTab]     = useState("info") // "info" | "visibility" | "expiry"

    const hasExpiry    = !!gallery.expiresAt
    const hasPassword  = !!gallery.hasPassword

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(buildSchema(hasPassword)),
        defaultValues: {
            title:               gallery.title || "",
            description:         gallery.description || "",
            isPublic:            gallery.isPublic,
            changePassword:      false,
            newPassword:         "",
            removePassword:      false,
            hasExpiry:           hasExpiry,
            expiresAt:           hasExpiry ? toDatetimeLocal(gallery.expiresAt) : "",
            downloadLinkDuration: gallery.downloadLinkDuration ?? 72,
        },
    })

    const isPublicVal       = watch("isPublic")
    const changePasswordVal = watch("changePassword")
    const removePasswordVal = watch("removePassword")
    const hasExpiryVal      = watch("hasExpiry")

    const onSubmit = async (data) => {
        setSaving(true)
        setServerError("")

        const body = {
            title:       data.title,
            description: data.description || "",
            isPublic:    data.isPublic,
            downloadLinkDuration: data.downloadLinkDuration,
        }

        // Contraseña
        if (data.removePassword) {
            body.removePassword = true
        } else if (data.changePassword && data.newPassword) {
            body.password = data.newPassword
        }

        // Vencimiento
        if (!data.hasExpiry) {
            body.removeExpiry = true
        } else if (data.expiresAt) {
            body.expiresAt = new Date(data.expiresAt).toISOString()
        }

        const res = await fetch(`/api/galleries/${gallery.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        if (res.ok) {
            const updated = await res.json()
            setSuccess(true)
            setTimeout(() => { onUpdated(updated); onClose() }, 700)
        } else {
            const json = await res.json()
            setServerError(json.error || "Error al guardar")
        }

        setSaving(false)
    }

    const handleVisibilityChange = (pub) => {
        setValue("isPublic", pub)
        if (pub) { setValue("changePassword", false); setValue("removePassword", false) }
    }
    const handleRemovePassword = (val) => {
        setValue("removePassword", val)
        if (val) setValue("changePassword", false)
    }
    const handleChangePassword = (val) => {
        setValue("changePassword", val)
        if (val) setValue("removePassword", false)
    }

    const TABS = [
        { id: "info",       label: "Información",  icon: FileText },
        { id: "visibility", label: "Visibilidad",  icon: Globe },
        { id: "expiry",     label: "Vencimiento",  icon: Calendar },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
                    <h2 className="font-semibold text-neutral-900">Editar galería</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-100 shrink-0 px-2">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                activeTab === id
                                    ? "border-neutral-900 text-neutral-900"
                                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                        {/* ── TAB: INFORMACIÓN GENERAL ── */}
                        {activeTab === "info" && (
                            <>
                                <div className="space-y-1.5">
                                    <Label>Título <span className="text-red-500">*</span></Label>
                                    <Input
                                        {...register("title")}
                                        placeholder="Ej: Boda de Ana y Carlos"
                                        autoFocus
                                    />
                                    {errors.title && (
                                        <p className="text-xs text-red-500">{errors.title.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Descripción <span className="text-neutral-400 font-normal text-xs">(opcional)</span></Label>
                                    <textarea
                                        {...register("description")}
                                        placeholder="Breve descripción de la galería..."
                                        rows={4}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    />
                                </div>
                            </>
                        )}

                        {/* ── TAB: VISIBILIDAD ── */}
                        {activeTab === "visibility" && (
                            <>
                                {/* Visibilidad pública/privada */}
                                <div className="space-y-2">
                                    <Label>Acceso</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleVisibilityChange(true)}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${
                                                isPublicVal
                                                    ? "border-neutral-900 bg-neutral-50"
                                                    : "border-neutral-200 hover:border-neutral-300"
                                            }`}
                                        >
                                            <Globe size={18} className={isPublicVal ? "text-neutral-900" : "text-neutral-400"} />
                                            <div>
                                                <p className={`text-sm font-medium ${isPublicVal ? "text-neutral-900" : "text-neutral-500"}`}>Pública</p>
                                                <p className="text-xs text-neutral-400">Acceso libre</p>
                                            </div>
                                            {isPublicVal && <Check size={14} className="ml-auto text-neutral-900" />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleVisibilityChange(false)}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${
                                                !isPublicVal
                                                    ? "border-neutral-900 bg-neutral-50"
                                                    : "border-neutral-200 hover:border-neutral-300"
                                            }`}
                                        >
                                            <Lock size={18} className={!isPublicVal ? "text-neutral-900" : "text-neutral-400"} />
                                            <div>
                                                <p className={`text-sm font-medium ${!isPublicVal ? "text-neutral-900" : "text-neutral-500"}`}>Privada</p>
                                                <p className="text-xs text-neutral-400">Con contraseña</p>
                                            </div>
                                            {!isPublicVal && <Check size={14} className="ml-auto text-neutral-900" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Contraseña */}
                                <div className="space-y-3">
                                    <Label>Contraseña</Label>

                                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                                        hasPassword
                                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                                            : "bg-neutral-50 text-neutral-500 border border-neutral-100"
                                    }`}>
                                        <KeyRound size={14} />
                                        {hasPassword ? "Esta galería tiene contraseña configurada" : "Esta galería no tiene contraseña"}
                                    </div>

                                    {/* Cambiar / agregar contraseña */}
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <div
                                            onClick={() => handleChangePassword(!changePasswordVal)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${changePasswordVal ? "bg-neutral-900" : "bg-neutral-200"}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${changePasswordVal ? "translate-x-5" : "translate-x-0.5"}`} />
                                        </div>
                                        <span className="text-sm text-neutral-700">
                                            {hasPassword ? "Cambiar contraseña" : "Agregar contraseña"}
                                        </span>
                                    </label>

                                    {changePasswordVal && (
                                        <div className="space-y-1.5 pl-1">
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    {...register("newPassword")}
                                                    placeholder="Nueva contraseña (mín. 4 caracteres)"
                                                    className="pr-10"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {errors.newPassword && (
                                                <p className="text-xs text-red-500">{errors.newPassword.message}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Quitar contraseña */}
                                    {hasPassword && isPublicVal && (
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                            <div
                                                onClick={() => handleRemovePassword(!removePasswordVal)}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${removePasswordVal ? "bg-red-500" : "bg-neutral-200"}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${removePasswordVal ? "translate-x-5" : "translate-x-0.5"}`} />
                                            </div>
                                            <span className="text-sm text-neutral-700 flex items-center gap-1.5">
                                                <ShieldOff size={14} className="text-neutral-400" />
                                                Quitar contraseña
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Aviso cambio de visibilidad */}
                                {gallery.isPublic !== isPublicVal && (
                                    <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span>
                                            {isPublicVal
                                                ? "La galería pasará a ser pública. Cualquiera con el link podrá acceder."
                                                : "La galería pasará a ser privada. Solo quienes tengan la contraseña podrán acceder."
                                            }
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── TAB: VENCIMIENTO Y DESCARGAS ── */}
                        {activeTab === "expiry" && (
                            <>
                                {/* Vencimiento */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-neutral-400" />
                                        Vencimiento de la galería
                                    </Label>

                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <div
                                            onClick={() => {
                                                setValue("hasExpiry", !hasExpiryVal)
                                                if (!hasExpiryVal) setValue("expiresAt", "")
                                            }}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${hasExpiryVal ? "bg-neutral-900" : "bg-neutral-200"}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasExpiryVal ? "translate-x-5" : "translate-x-0.5"}`} />
                                        </div>
                                        <span className="text-sm text-neutral-700">Activar fecha de vencimiento</span>
                                    </label>

                                    {hasExpiryVal && (
                                        <div className="space-y-1.5">
                                            <Input
                                                type="datetime-local"
                                                {...register("expiresAt")}
                                                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                                            />
                                            {errors.expiresAt && (
                                                <p className="text-xs text-red-500">{errors.expiresAt.message}</p>
                                            )}
                                            <p className="text-xs text-neutral-400">
                                                Después de esta fecha la galería no será accesible para los clientes.
                                            </p>
                                        </div>
                                    )}

                                    {!hasExpiryVal && hasExpiry && (
                                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Al guardar se eliminará la fecha de vencimiento actual.
                                        </p>
                                    )}
                                </div>

                                {/* Duración del link de descarga */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-1.5">
                                        <Download size={14} className="text-neutral-400" />
                                        Duración del link de descarga
                                    </Label>

                                    <div className="flex flex-wrap gap-2">
                                        {DOWNLOAD_DURATIONS.map(({ value, label }) => {
                                            const current = watch("downloadLinkDuration")
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setValue("downloadLinkDuration", value)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                        current === value
                                                            ? "bg-neutral-900 text-white"
                                                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                                        <Clock size={11} />
                                        Tiempo que tiene el cliente para descargar sus fotos desde que se genera el link.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer fijo */}
                    <div className="shrink-0 border-t border-neutral-100 px-6 py-4 space-y-3">
                        {serverError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                <AlertCircle size={16} />
                                {serverError}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 gap-2" disabled={saving}>
                                {saving ? (
                                    <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                                ) : success ? (
                                    <><Check size={16} /> Guardado</>
                                ) : (
                                    "Guardar cambios"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}