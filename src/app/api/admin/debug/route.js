import { cookies } from "next/headers"
import { verifyAdminToken } from "@/lib/admin-auth"

export async function GET() {
    const cookieStore = await cookies()
    const all = cookieStore.getAll()
    const token = cookieStore.get("pm_admin_token")?.value
    const payload = token ? await verifyAdminToken(token) : null
    
    return Response.json({
        cookies: all.map(c => c.name),
        hasToken: !!token,
        tokenPayload: payload,
    })
}