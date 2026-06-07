"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const res = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })

        if (res.ok) {

    router.refresh()
    router.push("/admin")

        } else {
            const json = await res.json()
            setError(json.error || "Credenciales inválidas")
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-4">
                        <Shield size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white">Panel de Admin</h1>
                    <p className="text-neutral-400 text-sm mt-1">PhotoBook</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-neutral-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@ejemplo.com"
                            className="bg-white/10 border-white/20 text-white placeholder:text-neutral-500 focus:border-white/40"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-neutral-300">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-white/10 border-white/20 text-white placeholder:text-neutral-500 focus:border-white/40 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full bg-white text-neutral-900 hover:bg-neutral-100"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                        Ingresar
                    </Button>
                </form>
            </div>
        </div>
    )
}