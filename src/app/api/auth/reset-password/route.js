import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
    email: z.string().email(),
    token: z.string().min(1),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export async function POST(req) {
    try {
        const body = await req.json()
        const parsed = schema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { email, token, password } = parsed.data

        const photographer = await prisma.photographer.findUnique({ where: { email } })

        if (!photographer) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
        }

        if (!photographer.resetPasswordToken || photographer.resetPasswordToken !== token) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
        }

        if (photographer.resetPasswordTokenExpires && photographer.resetPasswordTokenExpires < new Date()) {
            return NextResponse.json({ error: "El enlace expiró. Solicitá uno nuevo." }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.photographer.update({
            where: { email },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordTokenExpires: null,
            },
        })

        return NextResponse.json({ message: "Contraseña actualizada correctamente" }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
