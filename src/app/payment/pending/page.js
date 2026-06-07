import { Clock } from "lucide-react"

export default function PaymentPendingPage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                    <Clock size={32} className="text-amber-500" />
                </div>
                <h1 className="text-xl font-semibold text-neutral-900 mb-2">
                    Pago pendiente
                </h1>
                <p className="text-neutral-500 text-sm mb-2">
                    Tu pago está siendo procesado. Esto puede demorar hasta 24 horas.
                </p>
                <p className="text-neutral-400 text-sm">
                    Cuando se confirme recibirás el link de descarga en tu email automáticamente.
                </p>
            </div>
        </div>
    )
}