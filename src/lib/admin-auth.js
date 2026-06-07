import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

const SECRET = new TextEncoder().encode(
    process.env.ADMIN_SECRET || "admin-secret-change-this-in-production"
)
const COOKIE = "pm_admin_token"

export async function signAdminToken(adminId) {
    return new SignJWT({ adminId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("8h")
        .sign(SECRET)
}

export async function verifyAdminToken(token) {
    try {
        const { payload } = await jwtVerify(token, SECRET)
        return payload
    } catch {
        return null
    }
}

export async function getAdminSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE)?.value
    if (!token) return null
    const payload = await verifyAdminToken(token)
    if (!payload?.adminId) return null

    const admin = await prisma.adminUser.findUnique({
        where: { id: payload.adminId },
        select: { id: true, name: true, email: true },
    })
    return admin
}

export { COOKIE as ADMIN_COOKIE }