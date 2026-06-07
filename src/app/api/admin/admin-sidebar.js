"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    Shield, Users, CreditCard, BarChart3,
    Settings, LogOut, ChevronRight, Package, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { label: "Dashboard", href: "/admin", icon: BarChart3 },
    { label: "Fotógrafos", href: "/admin/photographers", icon: Users },
    { label: "Suscripciones", href: "/admin/subscriptions", icon: CreditCard },
    { label: "Planes", href: "/admin/plans", icon: Package },
    { label: "Consejos Pro", href: "/admin/tips", icon: Sparkles },
]

export default function AdminSidebar({ admin }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await fetch("/api/admin/auth", { method: "DELETE" })
        router.push("/admin/login")
    }

    return (
        <aside className="w-60 bg-neutral-900 flex flex-col shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
                <div className="bg-white/10 rounded-lg p-1.5">
                    <Shield size={16} className="text-white" />
                </div>
                <div>
                    <p className="text-white font-semibold text-sm">PhotoBook</p>
                    <p className="text-neutral-500 text-xs">Admin Panel</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-white/15 text-white"
                                    : "text-neutral-400 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Icon size={16} />
                            {item.label}
                            {isActive && <ChevronRight size={13} className="ml-auto" />}
                        </Link>
                    )
                })}
            </nav>

            {/* User */}
            <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
                <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{admin.name}</p>
                    <p className="text-xs text-neutral-500">{admin.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-white/10 hover:text-red-400 transition-colors"
                >
                    <LogOut size={16} />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    )
}