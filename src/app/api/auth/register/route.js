import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/mail"

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
})

export async function POST(req) {
    try {
        const body = await req.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { name, email, password } = parsed.data

        const existing = await prisma.photographer.findUnique({ where: { email } })
        if (existing) {
            // Si existe pero no verificó, podemos reenviar el token
            if (!existing.emailVerified) {
                const code = crypto.randomInt(100000, 999999).toString()
                const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hs

                await prisma.photographer.update({
                    where: { email },
                    data: {
                        verificationToken: code,
                        verificationTokenExpires: expires,
                    },
                })

                const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${code}&email=${encodeURIComponent(email)}`
                await sendVerificationEmail({ name: existing.name, email, code, verifyUrl })

                return NextResponse.json(
                    { message: "Te reenviamos el código de verificación al mail." },
                    { status: 200 }
                )
            }

            return NextResponse.json(
                { error: "El email ya está registrado" },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        // Código numérico de 6 dígitos
        const code = crypto.randomInt(100000, 999999).toString()
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hs

        await prisma.photographer.create({
            data: {
                name,
                email,
                password: hashedPassword,
                emailVerified: false,
                verificationToken: code,
                verificationTokenExpires: expires,
            },
        })

        const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${code}&email=${encodeURIComponent(email)}`
        await sendVerificationEmail({ name, email, code, verifyUrl })

        return NextResponse.json(
            { message: "Cuenta creada. Revisá tu mail para verificar tu cuenta." },
            { status: 201 }
        )
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}