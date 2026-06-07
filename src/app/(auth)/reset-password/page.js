import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import ResetPasswordContent from "./ResetPasswordContent"

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Cargando...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
