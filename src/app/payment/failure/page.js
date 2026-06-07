import { XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PaymentFailurePage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <XCircle size={32} className="text-red-500" />
                </div>

                <h1 className="text-xl font-semibold text-neutral-900 mb-2">
                    El pago no se procesó
                </h1>

                <p className="text-neutral-500 text-sm mb-6">
                    Hubo un problema con tu pago. Podés intentarlo de nuevo o usar otro medio de pago.
                </p>

                <Link href="/">
                    <Button className="w-full">
                        Volver al inicio
                    </Button>
                </Link>
            </div>
        </div>
    )
}