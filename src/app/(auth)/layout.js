import AuthBackground from "@/components/auth-background"

export default function AuthLayout({ children }) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Animated particle canvas */}
            <AuthBackground />

            {/* Subtle radial glow behind the card */}
            <div style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 600, height: 600,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(30,58,95,0.5) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 1,
            }} />

            {/* Card content */}
            <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", justifyContent: "center", padding: "24px 16px" }}>
                {children}
            </div>
        </div>
    )
}
