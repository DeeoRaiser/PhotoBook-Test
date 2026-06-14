import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

class EmailNotVerifiedError extends CredentialsSignin {
    code = "EMAIL_NOT_VERIFIED"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    pages: {
        signIn: "/login",
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            async authorize(credentials) {
                const photographer = await prisma.photographer.findUnique({
                    where: { email: credentials.email },
                })

                if (!photographer) return null
                if (photographer.isBlocked) return null

                const isValid = await bcrypt.compare(credentials.password, photographer.password)
                if (!isValid) return null

                if (!photographer.emailVerified) {
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

    callbacks: {
        async signIn({ user, account }) {
            // ✅ CORRECCIÓN: Google usa 'oidc', Facebook usa 'oauth'. 
            // Validamos que sea cualquiera de los dos para proceder.
            const isExternal = account?.type === "oauth" || account?.type === "oidc"
            if (!isExternal) return true
            if (!user.email) return false

            try {
                console.log(`→ External signIn (${account.provider}/${account.type}) para:`, user.email)

                let photographer = await prisma.photographer.findUnique({
                    where: { email: user.email },
                })

                if (!photographer) {
                    console.log("→ Creando nuevo fotógrafo desde red social:", user.email)
                    photographer = await prisma.photographer.create({
                        data: {
                            email: user.email,
                            name: user.name ?? user.email.split("@")[0],
                            password: "",
                            emailVerified: true,
                            avatar: user.image ?? null,
                        },
                    })
                } else {
                    if (photographer.isBlocked) return false
                    if (!photographer.emailVerified) {
                        await prisma.photographer.update({
                            where: { id: photographer.id },
                            data: { emailVerified: true },
                        })
                    }
                }

                // Guardar cuenta vinculada
                try {
                    await prisma.oAuthAccount.upsert({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            },
                        },
                        update: {
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            id_token: account.id_token,
                        },
                        create: {
                            photographerId: photographer.id,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                        },
                    })
                } catch (e) {}

                return true
            } catch (err) {
                console.error("External signIn error:", err)
                return false
            }
        },

        async jwt({ token, user, account }) {
            try {
                // En el login inicial
                if (user && account) {
                    console.log(`→ JWT Inicial para:`, user.email)
                    
                    // Buscamos siempre el ID de la BD para asegurar consistencia
                    const photographer = await prisma.photographer.findUnique({
                        where: { email: user.email },
                        select: { id: true }
                    })

                    if (photographer) {
                        token.id = photographer.id
                        token.role = "PHOTOGRAPHER"
                        console.log("→ ID de Prisma asignado:", token.id)
                    }
                    return token
                }

                // Peticiones posteriores
                return token
            } catch (err) {
                console.error("JWT error:", err)
                return token
            }
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
                session.user.role = token.role
                console.log("→ Sesión activa ID:", session.user.id)
            }
            return session
        },
    },
})
