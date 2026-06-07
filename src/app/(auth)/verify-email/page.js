"use client"

import { Suspense } from "react"
import VerifyEmailContent from "./VerifyEmailContent"

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <VerifyEmailContent />
        </Suspense>
    )
}