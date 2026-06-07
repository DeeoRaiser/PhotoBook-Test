// src/components/admin/admin-sidebar.js
// Igual al original + nav item "Themes"
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    Shield, Users, CreditCard, BarChart3,
    LogOut, Package, ShoppingBag, Menu, X,
    Mail, Sparkles, Palette,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { label: "Dashboard",      href: "/admin",                icon: BarChart3,  description: "Vista general" },
    { label: "Fotógrafos",     href: "/admin/photographers",  icon: Users,      description: "Gestión de usuarios" },
    { label: "Órdenes",        href: "/admin/orders",         icon: ShoppingBag,description: "Pedidos y ventas" },
    { label: "Suscripciones",  href: "/admin/subscriptions",  icon: CreditCard, description: "Pagos activos" },
    { label: "Planes",         href: "/admin/plans",          icon: Package,    description: "Configurar planes" },
    { label: "Consejos Pro",   href: "/admin/tips",           icon: Sparkles,   description: "Configurar Tips" },
    { label: "Mensajes",       href: "/admin/messages",       icon: Mail,       description: "Envío masivo de emails" },
    { label: "Themes",         href: "/admin/themes",         icon: Palette,    description: "Plantillas de galería" },
]

function SidebarContent({ admin, onNavigate }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await fetch("/api/admin/auth", { method: "DELETE" })
        router.push("/admin/login")
    }

    const initials = admin?.name
        ? admin.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        : "A"

    return (
        <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}>
            {/* Logo */}
            <div className="px-5 pt-6 pb-5">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center rounded-xl"
                        style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 4px 14px rgba(59,130,246,0.4)" }}>
                        <Shield size={16} color="white" strokeWidth={2.2} />
                    </div>
                    <div>
                        <span className="block text-[15px] font-bold" style={{ color: "white", letterSpacing: "-0.02em" }}>PhotoBook</span>
                        <span className="block text-[10px] font-bold" style={{ color: "#3b82f6", letterSpacing: "0.1em" }}>ADMIN</span>
                    </div>
                </div>
            </div>

            <div className="mx-4 mb-4" style={{ height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)" }} />

            <p className="px-5 mb-2 text-[10px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>PANEL</p>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
                                isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/8"
                            )}
                            style={isActive ? { background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" } : {}}
                        >
                            <div className={cn(
                                "flex items-center justify-center rounded-lg transition-all duration-150",
                                isActive ? "bg-white/20" : "bg-white/8 group-hover:bg-white/12"
                            )} style={{ width: 32, height: 32 }}>
                                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-[13px] font-semibold leading-none mb-0.5", isActive ? "text-white" : "")}>
                                    {item.label}
                                </p>
                                <p className="text-[10px] leading-none truncate" style={{ color: isActive ? "rgba(255,255,255,0.6)" : "rgba(148,163,184,0.7)" }}>
                                    {item.description}
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="mx-4 my-4" style={{ height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)" }} />

            {/* User footer */}
            <div className="px-4 pb-6">
                <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-center rounded-lg text-[13px] font-bold text-white flex-shrink-0"
                        style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate leading-none mb-0.5">{admin?.name}</p>
                        <p className="text-[10px] truncate leading-none" style={{ color: "rgba(148,163,184,0.7)" }}>{admin?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-150"
                >
                    <div className="flex items-center justify-center rounded-lg bg-white/8" style={{ width: 32, height: 32 }}>
                        <LogOut size={14} strokeWidth={1.8} />
                    </div>
                    <span className="text-[13px] font-semibold">Cerrar sesión</span>
                </button>
            </div>
        </div>
    )
}

export default function AdminSidebar({ admin }) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => { setMobileOpen(false) }, [pathname])

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col w-60 flex-shrink-0" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
                <SidebarContent admin={admin} />
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
                style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                        <Shield size={13} color="white" />
                    </div>
                    <span className="text-[14px] font-bold text-white">PhotoBook Admin</span>
                </div>
                <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white p-1">
                    <Menu size={20} />
                </button>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <>
                    <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col"
                        style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
                        <div className="flex justify-end p-4">
                            <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <SidebarContent admin={admin} onNavigate={() => setMobileOpen(false)} />
                    </aside>
                </>
            )}
        </>
    )
}
