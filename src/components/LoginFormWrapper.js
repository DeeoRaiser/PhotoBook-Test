"use client"

import { useSearchParams } from "next/navigation"
import LoginForm from "@/components/LoginForm"

export default function LoginFormWrapper() {
    const params = useSearchParams()
    return <LoginForm registered={params.get("registered") === "true"} />
}
