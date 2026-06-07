import { MessageCircle } from "lucide-react"

const compartirTour = {
    id: "share-gallery",
    icon: MessageCircle,
    iconBg: "linear-gradient(135deg,#fdf4ff,#f3e8ff)",
    iconColor: "#9333ea",
    title: "Compartir una galería",
    description: "Aprendé a enviarle el link a tus clientes y cómo proteger el acceso.",
    estimatedTime: "2 min",
    steps: [
        {
            id: "intro",
            title: "Compartir tu galería 📤",
            body: "Una vez que subiste las fotos, podés compartir el link directamente con tus clientes.",
            route: "/dashboard/galleries",
            selector: null,
        },
        {
            id: "copy-link",
            title: "Copiá el link",
            body: "Dentro de la galería encontrás el botón «Copiar link» o «Compartir». Ese es el link que le mandás al cliente.",
            route: "/dashboard/galleries",
            selector: "button",
            selectorText: "Copiar",
            tip: "El link tiene el formato: photobook.com.ar/g/nombre-de-galeria",
            final: true,
        },
    ],
}

export default compartirTour