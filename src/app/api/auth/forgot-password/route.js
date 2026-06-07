import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/mail"

export async function POST(req) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "El email es requerido" }, { status: 400 })
        }

        const photographer = await prisma.photographer.findUnique({ where: { email } })

        // Responder siempre con éxito para no revelar si el email existe o no
        if (!photographer) {
            return NextResponse.json(
                { message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." },
                { status: 200 }
            )
        }

        // Generar token seguro
        const token = crypto.randomBytes(32).toString("hex")
        const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

        await prisma.photographer.update({
            where: { email },
            data: {
                resetPasswordToken: token,
                resetPasswordTokenExpires: expires,
            },
        })

        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
        await sendPasswordResetEmail({ name: photographer.name, email, resetUrl })

        return NextResponse.json(
            { message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." },
            { status: 200 }
        )
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
