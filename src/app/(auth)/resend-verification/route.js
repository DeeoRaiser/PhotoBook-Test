import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/mail"

export async function POST(req) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 })
        }

        const photographer = await prisma.photographer.findUnique({ where: { email } })

        if (!photographer) {
            // Respondemos igual para no revelar si el email existe
            return NextResponse.json({ message: "Si el email existe, te enviamos el código." }, { status: 200 })
        }

        if (photographer.emailVerified) {
            return NextResponse.json({ message: "La cuenta ya está verificada." }, { status: 200 })
        }

        const code = crypto.randomInt(100000, 999999).toString()
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hs

        await prisma.photographer.update({
            where: { email },
            data: {
                verificationToken: code,
                verificationTokenExpires: expires,
            },
        })

        const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?email=${encodeURIComponent(email)}`
        await sendVerificationEmail({ name: photographer.name, email, code, verifyUrl })

        return NextResponse.json({ message: "Código reenviado. Revisá tu mail." }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}