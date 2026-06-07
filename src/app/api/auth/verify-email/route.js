import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req) {
    try {
        const { email, code } = await req.json()

        if (!email || !code) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
        }

        const photographer = await prisma.photographer.findUnique({ where: { email } })

        if (!photographer) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        if (photographer.emailVerified) {
            return NextResponse.json({ message: "La cuenta ya está verificada" }, { status: 200 })
        }

        if (!photographer.verificationToken || photographer.verificationToken !== code) {
            return NextResponse.json({ error: "Código incorrecto" }, { status: 400 })
        }

        if (photographer.verificationTokenExpires && photographer.verificationTokenExpires < new Date()) {
            return NextResponse.json(
                { error: "El código expiró. Intentá registrarte de nuevo para recibir uno nuevo." },
                { status: 400 }
            )
        }

        await prisma.photographer.update({
            where: { email },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpires: null,
            },
        })

        return NextResponse.json({ message: "Cuenta verificada correctamente" }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}