import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Download, Clock, CheckCircle, XCircle, Images, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import FooterCafeNegro from "@/components/FooterCafeNegro"

export default async function DownloadPage({ params }) {
    const { token } = await params

    const order = await prisma.order.findUnique({
        where: { downloadToken: token },
        include: {
            items: {
                include: { photo: { select: { title: true, price: true } } },
            },
            gallery: {
                select: {
                    title: true,
                    photographer: { select: { name: true } },
                },
            },
        },
    })


    const galleryName =
        order?.gallery?.title ??
        order?.galleryTitle ??
        "Galería eliminada"

    const photographerName =
        order?.gallery?.photographer?.name ??
        "Fotógrafo"

    const isExpired =
        order?.downloadExpiresAt &&
        new Date() > new Date(order.downloadExpiresAt)

    const expiresFormatted = order?.downloadExpiresAt
        ? new Date(order.downloadExpiresAt).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : null
    const isValid = order && !isExpired
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-900 text-white rounded-2xl mb-4">
                        <Camera size={24} />
                    </div>
                    <p className="text-neutral-500 text-sm">PhotoBook</p>
                </div>

                {/* Token inválido */}
                {!order && (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
                        <XCircle size={40} className="mx-auto mb-4 text-red-400" />
                        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
                            Link no válido
                        </h1>
                        <p className="text-neutral-500 text-sm">
                            Este link de descarga no existe o ya fue eliminado.
                        </p>
                    </div>
                )}

                {/* Expirado */}
                {isExpired && (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
                        <Clock size={40} className="mx-auto mb-4 text-amber-400" />
                        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
                            Link expirado
                        </h1>
                        <p className="text-neutral-500 text-sm mb-4">
                            Este link venció el {expiresFormatted}. Contactá al fotógrafo para obtener uno nuevo.
                        </p>
                        <p className="text-sm font-medium text-neutral-700">
                            {photographerName}
                        </p>
                    </div>
                )}

                {/* Válido */}
                {isValid && (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">

                        {/* Header */}
                        <div className="bg-neutral-900 px-6 py-5 text-center">
                            <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
                            <h1 className="text-white font-semibold text-lg">
                                Tus fotos están listas
                            </h1>
                            <p className="text-neutral-400 text-sm mt-1">
                                {galleryName} · por {photographerName}
                            </p>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Info cliente */}
                            <div className="text-center">
                                <p className="text-sm text-neutral-500">Pedido de</p>
                                <p className="font-medium text-neutral-900">{order.clientName}</p>
                            </div>

                            {/* Lista de fotos */}
                            <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <Images size={12} />
                                    {order.items.length} {order.items.length === 1 ? "foto" : "fotos"} incluidas
                                </p>
                                {order.items.map((item, i) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-600">
                                            {item.photo?.title || item.photoTitle || `Foto ${i + 1}`}
                                        </span>
                                        <span className="text-neutral-900 font-medium">
                                            ${Number(item.price).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                <div className="border-t border-neutral-200 pt-2 mt-2 flex justify-between">
                                    <span className="text-sm font-semibold text-neutral-700">Total</span>
                                    <span className="text-sm font-semibold text-neutral-900">
                                        ${Number(order.total).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Botón de descarga */}
                            <a href={`/api/download/${token}`} download>
                                <Button className="w-full gap-2 h-12 text-base">
                                    <Download size={18} />
                                    Descargar fotos en ZIP
                                </Button>
                            </a>

                            {/* Expiración */}
                            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                                <Clock size={12} />
                                <span>Link válido hasta el {expiresFormatted}</span>
                            </div>

                            {/* Contador de descargas */}
                            {order.downloadCount > 0 && (
                                <p className="text-center text-xs text-neutral-300">
                                    Descargado {order.downloadCount} {order.downloadCount === 1 ? "vez" : "veces"}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <FooterCafeNegro />
            </div>
        </div>
    )
}