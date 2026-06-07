"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
    LayoutDashboard, Images, ShoppingBag, LogOut,
    Menu, X, Camera, Settings, CreditCard,
    Sparkles, UserCircle, MessageCircle, Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle  } from "@/components/ui/sheet"

const BASE_NAV = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Resumen general" },
    { label: "Galerías", href: "/dashboard/galleries", icon: Images, description: "Tus álbumes" },
    { label: "Órdenes", href: "/dashboard/orders", icon: ShoppingBag, description: "Ventas y pedidos" },
    { label: "Mi Plan", href: "/dashboard/subscription", icon: CreditCard, description: "Suscripción activa" },
    { label: "Configuración", href: "/dashboard/settings", icon: Settings, description: "Cuenta y perfil" },
]

const PORTFOLIO_ITEM = {
    label: "Mi PhotoBook",
    href: "/dashboard/portfolio",
    icon: UserCircle,
    description: "Perfil público",
}

const MESSAGES_ITEM = {
    label: "Mensajes",
    href: "/dashboard/messages",
    icon: MessageCircle,
    description: "Consultas del portfolio",
}

const LINKTREE_ITEM = {
    label: "Linktree",
    href: "/dashboard/linktree",
    icon: Link2,
    description: "Tu página de links",
}

function NavContent({ user, onNavigate }) {
    const pathname = usePathname()
    const [allowsPortfolio, setAllowsPortfolio] = useState(false)
    const [allowsLinktree, setAllowsLinktree]   = useState(false)
    const [unread, setUnread] = useState(0)
    const [avatarUrl, setAvatarUrl] = useState(null)

    useEffect(() => {
        fetch("/api/photographer/portfolio")
            .then(r => r.ok ? r.json() : {})
            .then(d => {
                setAllowsPortfolio(d.planAllowsPortfolio ?? false)
                setAvatarUrl(d.portfolioAvatarUrl ?? null)
            })
            .catch(() => { })
    }, [])

    useEffect(() => {
        fetch("/api/linktree")
            .then(r => r.ok ? r.json() : {})
            .then(d => setAllowsLinktree(d.plan?.allowsLinktree ?? false))
            .catch(() => { })
    }, [])

    useEffect(() => {
        if (!allowsPortfolio) return
        const fetchUnread = () => {
            fetch("/api/photographer/messages")
                .then(r => r.ok ? r.json() : {})
                .then(d => setUnread(d.unread ?? 0))
                .catch(() => { })
        }
        fetchUnread()
        const interval = setInterval(fetchUnread, 30000) // poll cada 30s
        return () => clearInterval(interval)
    }, [allowsPortfolio])

    const navItems = (() => {
        let items = [...BASE_NAV]
        if (allowsPortfolio) {
            items = [...items.slice(0, 3), PORTFOLIO_ITEM, MESSAGES_ITEM, ...items.slice(3)]
        }
        if (allowsLinktree) {
            // Insertar Linktree después de Portfolio (o después de Órdenes si no hay portfolio)
            const insertAfter = allowsPortfolio ? MESSAGES_ITEM.href : "/dashboard/orders"
            const idx = items.findIndex(i => i.href === insertAfter)
            items = [...items.slice(0, idx + 1), LINKTREE_ITEM, ...items.slice(idx + 1)]
        }
        return items
    })()

    //console.log (user)
    const initials = user?.name
        ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
        : "?"

    return (
        <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}>
            <div className="px-5 pt-3 pb-3">
                <div className="flex items-center gap-2.5">
                    <img
                        src="/logo.png"
                        alt="PhotoBook"
                        className="h-10 object-contain opacity-90"
                    />

                    <div>
                        <span className="block text-[15px] font-bold" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>PhotoBook</span>
                        <span className="block text-[10px] font-semibold" style={{ color: "#94a3b8", letterSpacing: "0.07em" }}>STUDIO</span>
                    </div>
                </div>
            </div>

            <div className="mx-4 mb-4" style={{ height: 1, background: "linear-gradient(90deg, #e2e8f0 0%, transparent 100%)" }} />

            <p className="px-5 mb-2 text-[10px] font-bold tracking-widest" style={{ color: "#94a3b8" }}>MENÚ</p>

            <nav className="flex-1 px-3 space-y-0.5">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    const isMessages = item.href === "/dashboard/messages"
                    const showBadge = isMessages && unread > 0

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-150 group",
                                isActive ? "text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
                            )}
                            style={isActive ? { background: "linear-gradient(135deg, #1a1a2e 0%, #1e3a5f 100%)", boxShadow: "0 4px 14px rgba(15,23,42,0.25)" } : {}}
                        >
                            <div className={cn("flex items-center justify-center rounded-lg transition-all duration-150 relative", isActive ? "bg-white/15" : "bg-slate-100 group-hover:bg-slate-200")}
                                style={{ width: 32, height: 32 }}>
                                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                                {showBadge && (
                                    <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: "#ef4444", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid white" }}>
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-[13px] font-semibold leading-none mb-0.5", isActive ? "text-white" : "")}>{item.label}</p>
                                <p className={cn("text-[10px] leading-none truncate", isActive ? "text-white/50" : "text-slate-400")}>{item.description}</p>
                            </div>
                            {showBadge && !isActive && (
                                <span style={{ fontSize: 10, fontWeight: 800, background: "#ef4444", color: "white", padding: "2px 7px", borderRadius: 20 }}>{unread}</span>
                            )}
                            {isActive && <div className="rounded-full" style={{ width: 5, height: 5, background: "rgba(255,255,255,0.6)" }} />}
                        </Link>
                    )
                })}
            </nav>
<div className="px-3 pb-5 space-y-4">
    
    <div
        style={{
            height: 1,
            background: "linear-gradient(to right, transparent, #e2e8f0, transparent)",
        }}
    />

    <div className="flex items-center gap-3">
        
        {/* Avatar */}
        {avatarUrl ? (
            <img
                src={avatarUrl}
                alt={user?.name ?? "Avatar"}
                className="rounded-2xl shrink-0 shadow-sm object-cover"
                style={{ width: 42, height: 42 }}
            />
        ) : (
        <div
            className="flex items-center justify-center rounded-2xl text-[12px] font-bold shrink-0 shadow-sm"
            style={{
                width: 42,
                height: 42,
                background: "linear-gradient(135deg, #1a1a2e, #1e3a5f)",
                color: "white",
            }}
        >
            {initials}
        </div>
        )}

        {/* User info */}
        <div className="flex-1 min-w-0">
            <p
                className="text-[13px] font-semibold truncate"
                style={{ color: "#0f172a" }}
            >
                {user?.name}
            </p>

            <p
                className="text-[11px] truncate"
                style={{ color: "#94a3b8" }}
            >
                {user?.email}
            </p>
        </div>

        {/* Logout button */}
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Cerrar sesión"
            className="
                group
                flex items-center gap-2
                px-3 py-2
                rounded-xl
                border border-red-100
                bg-red-50/70
                hover:bg-red-500
                transition-all duration-200
                hover:shadow-lg hover:shadow-red-500/20
                active:scale-95
            "
        >
            <LogOut
                size={15}
                className="
                    text-red-500
                    group-hover:text-white
                    transition-colors
                "
            />

            <span
                className="
                    text-[12px]
                    font-semibold
                    text-red-500
                    group-hover:text-white
                    transition-colors
                    hidden md:block
                "
            >
                Salir
            </span>
        </button>
    </div>
</div>
        </div>
    )
}

export default function Sidebar({ user }) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            <aside
                className="hidden md:flex flex-col shrink-0"
                style={{
                    width: 240,
                    background: "#ffffff",
                    borderRight: "1px solid #e2e8f0",
                    boxShadow: "2px 0 12px rgba(0,0,0,0.04)"
                }}
            >
                <NavContent user={user} />
            </aside>

            <div className="md:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <div className="fixed top-4 left-4 z-50">
                        <SheetTrigger asChild>
                            <button
                                className="flex items-center justify-center rounded-xl shadow-md transition-colors"
                                style={{
                                    width: 40,
                                    height: 40,
                                    background: "white",
                                    border: "1px solid #e2e8f0",
                                    color: "#475569"
                                }}
                            >
                                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                        </SheetTrigger>
                    </div>

                    <SheetContent
                        side="left"
                        className="p-0"
                        style={{ width: 240 }}
                    >
                        <SheetHeader className="sr-only">
                            <SheetTitle>Menú lateral</SheetTitle>
                        </SheetHeader>

                        <NavContent
                            user={user}
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}