import { DollarSign } from "lucide-react"

const ventasTour = {
    id: "first-sale",
    icon: DollarSign,
    iconBg: "linear-gradient(135deg,#fef3c7,#fde68a)",
    iconColor: "#d97706",
    title: "Hacer mi primera venta",
    description: "Configurá Mercado Pago y habilitá una galería paga para vender fotos.",
    estimatedTime: "4 min",
    steps: [
        {
            id: "intro",
            title: "Tu primera venta 🛒",
            body: "Para cobrar por tus fotos necesitás conectar Mercado Pago y tener una galería con precios configurados.",
            route: "/dashboard",
            selector: null,
        },
        {
            id: "mp-connect",
            title: "Conectar Mercado Pago",
            body: "Andá a Configuración y buscá la sección «Mercado Pago». Hacé clic en «Conectar» para autorizar la conexión.",
            route: "/dashboard/settings",
            selector: "button",
            selectorText: "Conectar",
            tip: "Necesitás tener una cuenta de Mercado Pago activa con CBU/CVU configurado.",
        },
        {
            id: "done",
            title: "¡Listo para vender! 🎉",
            body: "Cuando un cliente compre fotos, el pago se acredita automáticamente. Podés ver las órdenes en «Órdenes».",
            route: "/dashboard",
            selector: null,
            tip: "Los pagos pueden demorar hasta 24hs según el método de pago del cliente.",
            final: true,
        },
    ],
}

export default ventasTour