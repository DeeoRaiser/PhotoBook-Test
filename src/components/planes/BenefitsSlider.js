"use client"

import { useEffect, useState } from "react"
import {
    Check,
    ShieldCheck,
    Zap,
    Headphones,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
} from "lucide-react"

export default function BenefitsSlider() {
    const items = [
        {
            icon: <Zap size={18} />,
            title: "Activación inmediata",
            desc: "Empezá a cobrar online en minutos.",
        },
        {
            icon: <ShieldCheck size={18} />,
            title: "Pagos seguros",
            desc: "Procesados mediante MercadoPago.",
        },
        {
            icon: <Check size={18} />,
            title: "Upgrade instantáneo",
            desc: "Cambiá de plan sin interrupciones.",
        },
        {
            icon: <Headphones size={18} />,
            title: "Soporte 24hs",
            desc: "Asistencia rápida cuando la necesites.",
        },
    ]

    const [current, setCurrent] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % items.length)
        }, 3500)

        return () => clearInterval(interval)
    }, [items.length])

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % items.length)
    }

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + items.length) % items.length)
    }

return (
    <>
        <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
            {/* Glow sutil */}
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-green-100 blur-3xl opacity-50" />

            <div className="relative p-6 md:p-8">
                {/* Header */}
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        <Check size={13} />
                        Beneficios incluidos
                    </span>

                    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
                        Todo listo para vender
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
                        Todo lo que necesitás para comenzar a cobrar y gestionar
                        tu negocio desde el primer día.
                    </p>
                </div>

                {/* Slider */}
                <div className="relative mt-8 h-[130px] overflow-hidden">
                    <div
                        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
                        style={{
                            transform: `translateX(-${current * 100}%)`,
                        }}
                    >
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="flex min-w-full items-center"
                            >
                                <div className="flex items-center gap-5">
                                    {/* Icon */}
                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                        {item.icon}
                                    </div>

                                    {/* Text */}
                                    <div>
                                        <h4 className="text-lg font-medium text-neutral-900">
                                            {item.title}
                                        </h4>

                                        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dots minimalistas */}
                <div className="mt-6 flex justify-center gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrent(index)}
                            className={`transition-all duration-300 ${
                                current === index
                                    ? "h-1.5 w-8 rounded-full bg-green-500"
                                    : "h-1.5 w-1.5 rounded-full bg-neutral-300"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* WhatsApp minimalista */}
        <a
            href="https://wa.me/543512531103"
            target="_blank"
            rel="noopener noreferrer"
            className="
                fixed bottom-6 right-6 z-50
                flex h-12 w-12 items-center justify-center
                rounded-full
                border border-white/30
                bg-white/80
                backdrop-blur-xl
                text-green-600
                shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                transition-all duration-300
                hover:scale-105
            "
        >
            <MessageCircle size={20} />
        </a>
    </>
)
}