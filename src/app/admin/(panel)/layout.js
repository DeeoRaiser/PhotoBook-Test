import { getAdminSession } from "@/lib/admin-auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/admin-sidebar"

export default async function AdminLayout({ children }) {
    const admin = await getAdminSession()
    if (!admin) redirect("/admin/login")

    return (
        <div className="flex h-screen bg-neutral-950">
            <AdminSidebar admin={admin} />
            <main className="flex-1 overflow-y-auto bg-neutral-50 pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    )
}
