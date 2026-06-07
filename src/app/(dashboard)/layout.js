import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DashboardBackground from "@/components/dashboard-background"
import HelpTour from "@/components/HelpTour"

export default async function DashboardLayout({ children }) {
    const session = await auth()
    if (!session) redirect("/login")

    return (
        <div style={{ display: "flex", height: "100vh", background: "#f1f5f9", position: "relative" }}>
            <DashboardBackground />

                <Sidebar user={session.user} />

            <main style={{ flex: 1, padding: "1rem", overflowY: "auto", position: "relative", zIndex: 1 }}>
                {children}
            </main>
            <HelpTour />
        </div>
    )
}
