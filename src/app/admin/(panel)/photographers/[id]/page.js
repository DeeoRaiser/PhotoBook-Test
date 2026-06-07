"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft, Shield, ShieldOff, KeyRound, Trash2,
    Loader2, CheckCircle, Clock, AlertTriangle,
    CreditCard, Images, Save, X, TrendingUp, HardDrive, ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PLAN_EXTEND_OPTIONS = [7, 15, 30, 60, 90, 180, 365]

export default function PhotographerDetailPage() {
    const { id } = useParams()
    const router = useRouter()

    const [photographer, setPhotographer] = useState(null)
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState({ type: "", text: "" })

    // Formulario edición
    const [editName, setEditName] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [blockReason, setBlockReason] = useState("")

    // Suscripción
    const [selectedPlan, setSelectedPlan] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("transferencia")
    const [paymentRef, setPaymentRef] = useState("")
    const [amountPaid, setAmountPaid] = useState("")
    const [subNotes, setSubNotes] = useState("")
    const [extendDays, setExtendDays] = useState(30)

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/photographers/${id}`).then((r) => r.json()),
            fetch("/api/admin/plans").then((r) => r.json()),
        ]).then(([ph, pl]) => {
            setPhotographer(ph)
            setEditName(ph.name)
            setEditEmail(ph.email)
            setBlockReason(ph.blockedReason || "")
            setPlans(pl)
            if (pl.length > 0) setSelectedPlan(pl[0].id)
            setLoading(false)
        })
    }, [id])

    const showMsg = (type, text) => {
        setMsg({ type, text })
        setTimeout(() => setMsg({ type: "", text: "" }), 3000)
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        const body = { name: editName, email: editEmail }
        if (newPassword) body.newPassword = newPassword

        const res = await fetch(`/api/admin/photographers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        if (res.ok) {
            const updated = await res.json()
            setPhotographer((prev) => ({ ...prev, ...updated }))
            setNewPassword("")
            showMsg("success", "Perfil actualizado")
        } else {
            showMsg("error", "Error al guardar")
        }
        setSaving(false)
    }

    const handleToggleBlock = async () => {
        const action = photographer.isBlocked ? "desbloquear" : "bloquear"
        if (!confirm(`¿${action} a ${photographer.name}?`)) return

        setSaving(true)
        const res = await fetch(`/api/admin/photographers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                isBlocked: !photographer.isBlocked,
                blockedReason: photographer.isBlocked ? null : blockReason,
            }),
        })

        if (res.ok) {
            const updated = await res.json()
            setPhotographer((prev) => ({ ...prev, ...updated }))
            showMsg("success", `Fotógrafo ${photographer.isBlocked ? "desbloqueado" : "bloqueado"}`)
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm(`¿Eliminar permanentemente a ${photographer.name} y todos sus datos?`)) return
        if (!confirm("Esta acción NO se puede deshacer. ¿Confirmás?")) return

        const res = await fetch(`/api/admin/photographers/${id}`, { method: "DELETE" })
        if (res.ok) router.push("/admin/photographers")
    }

    const handleAssignPlan = async () => {
        if (!selectedPlan) return
        setSaving(true)

        const res = await fetch("/api/admin/subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                photographerId: id,
                planId: selectedPlan,
                amountPaid: amountPaid ? Number(amountPaid) : null,
                paymentMethod,
                paymentRef,
                notes: subNotes,
            }),
        })

        if (res.ok) {
            const sub = await res.json()
            setPhotographer((prev) => ({ ...prev, subscription: sub }))
            setPaymentRef("")
            setAmountPaid("")
            setSubNotes("")
            showMsg("success", "Plan asignado correctamente")
        } else {
            showMsg("error", "Error al asignar plan")
        }
        setSaving(false)
    }

    const handleExtendSubscription = async () => {
        if (!photographer.subscription) return
        setSaving(true)

        const res = await fetch(`/api/admin/subscriptions/${photographer.subscription.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ extendDays }),
        })

        if (res.ok) {
            const sub = await res.json()
            setPhotographer((prev) => ({ ...prev, subscription: { ...prev.subscription, ...sub } }))
            showMsg("success", `Suscripción extendida ${extendDays} días`)
        }
        setSaving(false)
    }

    const handleSuspendSubscription = async () => {
        if (!photographer.subscription) return
        if (!confirm("¿Suspender la suscripción?")) return
        setSaving(true)

        const res = await fetch(`/api/admin/subscriptions/${photographer.subscription.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "SUSPENDED" }),
        })

        if (res.ok) {
            const sub = await res.json()
            setPhotographer((prev) => ({ ...prev, subscription: { ...prev.subscription, ...sub } }))
            showMsg("success", "Suscripción suspendida")
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-neutral-400" />
            </div>
        )
    }

    const sub = photographer.subscription
    const now = new Date()
    const isExpired = sub ? new Date(sub.expiresAt) < now : true
    const daysLeft = sub ? Math.ceil((new Date(sub.expiresAt) - now) / (1000 * 60 * 60 * 24)) : null

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/admin/photographers">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft size={18} />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-semibold text-neutral-900">{photographer.name}</h1>
                        {photographer.isBlocked && (
                            <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                                Bloqueado
                            </span>
                        )}
                    </div>
                    <p className="text-neutral-500 text-sm mt-0.5">{photographer.email}</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 gap-2"
                    onClick={handleDelete}
                >
                    <Trash2 size={14} />
                    Eliminar cuenta
                </Button>
            </div>

            {/* Mensaje de feedback */}
            {msg.text && (
                <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                    msg.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                    {msg.type === "success" ? <CheckCircle size={15} /> : <X size={15} />}
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── Perfil ── */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Datos del fotógrafo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Nombre</Label>
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nueva contraseña (dejar vacío para no cambiar)</Label>
                            <div className="relative">
                                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                                <Save size={15} />
                                Guardar cambios
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Bloqueo ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            {photographer.isBlocked
                                ? <ShieldOff size={16} className="text-red-500" />
                                : <Shield size={16} className="text-green-500" />
                            }
                            Acceso a la plataforma
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!photographer.isBlocked && (
                            <div className="space-y-1.5">
                                <Label>Motivo del bloqueo (opcional)</Label>
                                <Input
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Ej: Falta de pago, uso indebido..."
                                />
                            </div>
                        )}

                        {photographer.isBlocked && photographer.blockedReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
                                Motivo: {photographer.blockedReason}
                            </div>
                        )}

                        <Button
                            onClick={handleToggleBlock}
                            disabled={saving}
                            variant={photographer.isBlocked ? "outline" : "destructive"}
                            className="w-full gap-2"
                        >
                            {photographer.isBlocked ? (
                                <><Shield size={15} /> Desbloquear cuenta</>
                            ) : (
                                <><ShieldOff size={15} /> Bloquear cuenta</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* ── Estadísticas ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Images size={16} />
                            Estadísticas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Galerías</span>
                                <span className="font-medium">{photographer._count?.galleries ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Miembro desde</span>
                                <span className="font-medium">
                                    {new Date(photographer.createdAt).toLocaleDateString("es-AR", {
                                        day: "2-digit", month: "short", year: "numeric"
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">MP configurado</span>
                                <span className={`font-medium ${photographer.mpAccessToken ? "text-green-600" : "text-neutral-400"}`}>
                                    {photographer.mpAccessToken ? "Sí" : "No"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Métricas financieras y disco ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp size={16} />
                            Actividad económica
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Gastado en plataforma */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Gastado en plataforma</p>
                                <p className="text-xl font-semibold text-neutral-900 mt-0.5">
                                    ${Number(photographer.subscription?.amountPaid ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    {photographer.subscription
                                        ? `Plan ${photographer.subscription.plan?.name} · ${photographer.subscription.paymentMethod ?? "sin método"}`
                                        : "Sin suscripción"}
                                </p>
                            </div>
                            <CreditCard size={18} className="text-neutral-300 mt-0.5" />
                        </div>

                        <div className="border-t border-neutral-100" />

                        {/* Ventas generadas */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Ventas generadas</p>
                                <p className="text-xl font-semibold text-green-700 mt-0.5">
                                    ${(photographer.stats?.totalRevenue ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    {photographer.stats?.totalOrders ?? 0} órdenes pagadas
                                </p>
                            </div>
                            <ShoppingCart size={18} className="text-neutral-300 mt-0.5" />
                        </div>

                        <div className="border-t border-neutral-100" />

                        {/* Uso de disco */}
                        {(() => {
                            const usedBytes = photographer.storageUsedBytes ?? 0
                            const maxGB = photographer.subscription?.plan?.maxStorageGB ?? -1
                            const usedGB = usedBytes / (1024 ** 3)
                            const usedLabel = usedGB < 1
                                ? `${(usedBytes / (1024 ** 2)).toFixed(1)} MB`
                                : `${usedGB.toFixed(2)} GB`
                            const unlimited = maxGB === -1
                            const pct = unlimited ? 0 : Math.min(100, (usedGB / maxGB) * 100)
                            const barColor = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-blue-500"

                            return (
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-sm text-neutral-500">Uso de almacenamiento</p>
                                            <p className="text-base font-semibold text-neutral-900 mt-0.5">
                                                {usedLabel}
                                                <span className="text-neutral-400 font-normal text-sm">
                                                    {unlimited ? " / ilimitado" : ` / ${maxGB} GB`}
                                                </span>
                                            </p>
                                        </div>
                                        <HardDrive size={18} className="text-neutral-300 mt-0.5" />
                                    </div>
                                    {!unlimited && (
                                        <div className="w-full bg-neutral-100 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${barColor}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    )}
                                    {!unlimited && (
                                        <p className="text-xs text-neutral-400 mt-1">{pct.toFixed(1)}% utilizado</p>
                                    )}
                                </div>
                            )
                        })()}
                    </CardContent>
                </Card>

                {/* ── Suscripción actual ── */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CreditCard size={16} />
                            Suscripción
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">

                        {/* Estado actual */}
                        {sub ? (
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${
                                isExpired
                                    ? "bg-red-50 border-red-200"
                                    : daysLeft <= 7
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-green-50 border-green-200"
                            }`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {isExpired
                                            ? <AlertTriangle size={15} className="text-red-500" />
                                            : daysLeft <= 7
                                            ? <Clock size={15} className="text-amber-500" />
                                            : <CheckCircle size={15} className="text-green-500" />
                                        }
                                        <span className="font-medium text-sm">
                                            {sub.plan.name} — {sub.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Vence: {new Date(sub.expiresAt).toLocaleDateString("es-AR", {
                                            day: "2-digit", month: "long", year: "numeric"
                                        })}
                                        {!isExpired && ` (${daysLeft} días restantes)`}
                                    </p>
                                    {sub.notes && (
                                        <p className="text-xs text-neutral-400 mt-1">Notas: {sub.notes}</p>
                                    )}
                                </div>
                                {!isExpired && sub.status === "ACTIVE" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSuspendSubscription}
                                        disabled={saving}
                                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                    >
                                        Suspender
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-500 flex items-center gap-2">
                                <AlertTriangle size={15} className="text-neutral-400" />
                                Sin suscripción activa
                            </div>
                        )}

                        {/* Extender suscripción existente */}
                        {sub && !isExpired && (
                            <div className="border border-neutral-200 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-medium text-neutral-700">Extender suscripción actual</p>
                                <div className="flex gap-2 flex-wrap">
                                    {PLAN_EXTEND_OPTIONS.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setExtendDays(d)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                extendDays === d
                                                    ? "bg-neutral-900 text-white"
                                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                            }`}
                                        >
                                            +{d}d
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={handleExtendSubscription} disabled={saving} size="sm" className="gap-2">
                                    <Clock size={14} />
                                    Extender {extendDays} días
                                </Button>
                            </div>
                        )}

                        {/* Asignar nuevo plan */}
                        <div className="border border-neutral-200 rounded-xl p-4 space-y-4">
                            <p className="text-sm font-medium text-neutral-700">
                                {sub ? "Cambiar plan" : "Asignar plan"}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Plan</Label>
                                    <select
                                        value={selectedPlan}
                                        onChange={(e) => setSelectedPlan(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} — ${Number(plan.price).toFixed(2)} / {plan.durationDays}d
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Método de pago</Label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="transferencia">Transferencia</option>
                                        <option value="mp">Mercado Pago</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Monto pagado</Label>
                                    <Input
                                        type="number"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Referencia de pago</Label>
                                    <Input
                                        value={paymentRef}
                                        onChange={(e) => setPaymentRef(e.target.value)}
                                        placeholder="Nro. operación, comprobante..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Notas internas</Label>
                                <Input
                                    value={subNotes}
                                    onChange={(e) => setSubNotes(e.target.value)}
                                    placeholder="Acuerdos especiales, descuentos, etc."
                                />
                            </div>

                            <Button onClick={handleAssignPlan} disabled={saving || !selectedPlan} className="gap-2">
                                <CreditCard size={15} />
                                {sub ? "Cambiar plan" : "Asignar plan"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}