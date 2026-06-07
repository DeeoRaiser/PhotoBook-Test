    "use client"

    import { useEffect, useState } from "react"
    import { useRouter } from "next/navigation"
    import { Sparkles, CheckCircle2 } from "lucide-react"

    export default function NoPlanModal({ subscription }) {
        const router = useRouter()
        const [open, setOpen] = useState(false)

        useEffect(() => {
            const expired =
                subscription?.expiresAt &&
                new Date(subscription.expiresAt) < new Date()

            if (
                !subscription ||
                subscription.status !== "ACTIVE" ||
                expired
            ) {
                setOpen(true)
            }
        }, [subscription])

        if (!open) return null

        return (
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15,23,42,0.68)",
                    backdropFilter: "blur(8px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 280,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 520,
                        maxHeight:"80vh",
                        borderRadius: 28,
                        overflow: "hidden",
                        background: "white",
                        boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
                        border: "1px solid #e2e8f0",
                        position: "relative",
                    }}
                >
                    {/* Glow */}
                    <div
                        style={{
                            position: "absolute",
                            top: -120,
                            right: -120,
                            width: 260,
                            height: 260,
                            borderRadius: "50%",
                            background: "rgba(59,130,246,0.12)",
                            filter: "blur(60px)",
                        }}
                    />

                    {/* Header */}
                    <div
                        style={{
                            padding: "34px 34px 20px",
                            position: "relative",
                        }}
                    >
<div
    style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 22,
        gap: 16,
    }}
>
    <div
        style={{
            width: 72,
            height: 72,
            minWidth: 72,
            borderRadius: 22,
            background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(59,130,246,0.12)",
        }}
    >
        <Sparkles size={30} color="#2563eb" />
    </div>

    <div
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#ecfdf5",
            color: "#059669",
            border: "1px solid #a7f3d0",
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".02em",
            whiteSpace: "nowrap",
        }}
    >
        <CheckCircle2 size={14} />
        PLAN GRATUITO DISPONIBLE
    </div>
</div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 34,
                                lineHeight: 1.05,
                                letterSpacing: "-0.04em",
                                fontWeight: 800,
                                color: "#0f172a",
                            }}
                        >
                            Activá tu cuenta
                        </h2>

                        <p
                            style={{
                                marginTop: 18,
                                marginBottom: 0,
                                fontSize: 15,
                                lineHeight: 1.75,
                                color: "#64748b",
                                maxWidth: 430,
                            }}
                        >
                            Para comenzar a crear galerías y vender tus fotos,
                            necesitás activar un plan.
                        </p>

                        <p
                            style={{
                                marginTop: 14,
                                marginBottom: 0,
                                fontSize: 15,
                                lineHeight: 1.75,
                                color: "#0f172a",
                                fontWeight: 600,
                                maxWidth: 430,
                            }}
                        >
                            Podés empezar ahora mismo con nuestro{" "}
                            <span
                                style={{
                                    color: "#2563eb",
                                    fontWeight: 800,
                                }}
                            >
                                plan gratuito
                            </span>{" "}
                            y luego actualizar cuando quieras.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div
                        style={{
                            padding: "0 34px 10px",
                        }}
                    >
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: 34,
                            paddingTop: 24,
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                        }}
                    >
                        <button
                            onClick={() => router.push("/dashboard/subscription")}
                            style={{
                                height: 54,
                                borderRadius: 16,
                                border: "none",
                                background:
                                    "linear-gradient(135deg,#0f172a 0%, #1e3a5f 100%)",
                                color: "white",
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow:
                                    "0 18px 40px rgba(15,23,42,0.22)",
                                transition: "all .2s ease",
                            }}
                        >
                            VER PLANES
                        </button>

                        <p
                            style={{
                                textAlign: "center",
                                margin: 0,
                                fontSize: 12,
                                color: "#94a3b8",
                                lineHeight: 1.5,
                            }}
                        >
                            No necesitás tarjeta de crédito para comenzar.
                        </p>
                    </div>
                </div>
            </div>
        )
    }