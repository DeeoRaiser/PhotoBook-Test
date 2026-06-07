import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth"

export async function POST(req) {
    try {
        const { email, password } = await req.json()

        const admin = await prisma.adminUser.findUnique({ where: { email } })
        if (!admin) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
        }

        const match = await bcrypt.compare(password, admin.password)
        if (!match) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
        }

        const token = await signAdminToken(admin.id)

        const res = NextResponse.json({ ok: true, name: admin.name })
        res.cookies.set(ADMIN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 8, // 8 horas
            path: "/",
        })
        return res
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function DELETE() {
    const res = NextResponse.json({ ok: true })
    res.cookies.delete(ADMIN_COOKIE)
    return res
}