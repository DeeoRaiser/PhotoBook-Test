import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

class EmailNotVerifiedError extends CredentialsSignin {
    code = "EMAIL_NOT_VERIFIED"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log("→ authorize called with:", credentials.email)

                const admin = await prisma.adminUser.findUnique({
                    where: { email: credentials.email },
                })
                console.log("→ admin found:", !!admin)

                const photographer = await prisma.photographer.findUnique({
                    where: { email: credentials.email },
                })
                console.log("→ photographer found:", !!photographer)
                console.log("→ isBlocked:", photographer?.isBlocked)
                console.log("→ emailVerified:", photographer?.emailVerified)

                if(!photographer) return null
                if(photographer.isBlocked) return null

                // ✅ Validar contraseña PRIMERO
                const isValid = await bcrypt.compare(credentials.password, photographer.password)
                if(!isValid) return null

                // ✅ Luego chequear verificación (contraseña ya confirmada)
                if(!photographer.emailVerified) {
        throw new EmailNotVerifiedError()
                }

return {
    id: photographer.id,
    email: photographer.email,
    name: photographer.name,
    role: "PHOTOGRAPHER",
}
            },
        }),
    ],
})