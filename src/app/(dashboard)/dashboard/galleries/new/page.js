import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NewGalleryForm from "./NewGalleryForm"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default async function NewGalleryPage() {
    const session = await auth()
    const now = new Date()

    const photographer = await prisma.photographer.findUnique({
        where: { id: session.user.id },
        include: {
            subscription: { include: { plan: true } },
            _count: { select: { galleries: true } },
        },
    })

    const sub = photographer?.subscription
    const plan = sub?.plan
    const hasActivePlan = sub && sub.status === "ACTIVE" && new Date(sub.expiresAt) > now

    // Sin plan — mostrar bloqueo
    if (!hasActivePlan) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/dashboard/galleries">
                        <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
                    </Link>
                    <h1 className="text-2xl font-semibold text-neutral-900">Nueva galería</h1>
                </div>
                <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <div className="bg-amber-100 p-3 rounded-xl shrink-0">
                        <AlertTriangle size={22} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm text-amber-700 leading-relaxed">
                            Activá un plan para crear galerías y subir fotos.
                        </p>

                        <div className="flex gap-3 mt-4">
                            <Link href="/dashboard/subscription">
                                <Button
                                    size="sm"
                                    className="bg-sky-600 hover:bg-sky-700 text-white"
                                >
                                    <Sparkles size={14} className="mr-2" />
                                    Ver planes disponibles
                                </Button>
                            </Link>

                            <Link href="/dashboard/galleries">
                                <Button variant="outline" size="sm">
                                    Volver a mis galerías
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Con plan pero límite alcanzado
    const maxGalleries = plan.maxGalleries
    const usedGalleries = photographer._count.galleries

    if (maxGalleries !== -1 && usedGalleries >= maxGalleries) {
        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/dashboard/galleries">
                        <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
                    </Link>
                    <h1 className="text-2xl font-semibold text-neutral-900">Nueva galería</h1>
                </div>
                <div className="flex items-start gap-4 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="bg-blue-100 p-3 rounded-xl shrink-0">
                        <AlertTriangle size={22} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-900 mb-1">Límite de galerías alcanzado</p>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Tu plan <strong>{plan.name}</strong> permite hasta {maxGalleries} {maxGalleries === 1 ? "galería" : "galerías"}
                            y ya tenés {usedGalleries}.</p>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Consulta por los planes disponibles para aumentar tu límite.
                        </p>

                        <Link href="/dashboard/subscription" className="inline-flex items-center text-[15px] font-bold px-2.5 py-1 rounded-md" style={{ marginTop: 16, background: "#0284c7", color: "white" }}>
                            Mejorar ahora
                            <Tags size={16} style={{ marginLeft: 8 }} />
                        </Link>

                        {/* 
                        <Link href="/dashboard/galleries" className="inline-block mt-4">
                            <Button variant="outline" size="sm">Volver a mis galerías</Button>
                        </Link> */}
                    </div>
                </div>
            </div>
        )
    }

    // Todo OK — mostrar el formulario con info del plan
    const eventGalleriesUsed = await prisma.gallery.count({
        where: { photographerId: session.user.id, galleryType: "event" },
    })

    return (
        <NewGalleryForm
            planName={plan.name}
            maxPhotos={plan.maxPhotos}
            galleriesUsed={usedGalleries}
            galleriesMax={maxGalleries}
            allowsEventGalleries={plan.allowsEventGalleries ?? false}
            freeEventGalleries={plan.freeEventGalleries ?? 0}
            extraEventGalleryPrice={Number(plan.extraEventGalleryPrice ?? 0)}
            eventGalleriesUsed={eventGalleriesUsed}
            allowsPrintable={plan.allowsPrintable ?? false}
        />
    )
}
