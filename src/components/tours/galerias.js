import { Images } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Tour: Crear una galería
//
// REGLA DE SELECTORES:
//   selectorText  → textContent.trim().includes(text) sobre button/a/[role=button]
//                   Usar la parte ÚNICA del texto del botón (título principal).
//                   El textContent real es "Título" + "subtítulo", así que
//                   cualquier substring único del título alcanza.
//   selector CSS  → para inputs/selects que no son botones (id="xxx")
//   null en ambos → paso informativo sin spotlight
//
// IMPORTANTE – inputs condicionales:
//   #password     solo existe en DOM cuando isPublic === false
//   #eventStartsAt solo existe cuando hasEventStart === true
//   #expiresAt    solo existe cuando hasExpiry === true
//   → Siempre poner PRIMERO el paso que activa el toggle, DESPUÉS el input.
//   → El tour no hace clic automático; el usuario activa el toggle y avanza.
//
// Árbol de ramas:
//   steps → pregunta "¿Qué tipo?" → branchYes (Evento) | branchNo (Estándar)
//   branchNo → pregunta "¿Cobrar?" → branchYes (Estándar paga) | branchNo (Gratuita)
// ─────────────────────────────────────────────────────────────────────────────

const galeriesTour = {
    id: "create-gallery",
    icon: Images,
    iconBg: "linear-gradient(135deg,#eff6ff,#dbeafe)",
    iconColor: "#3b82f6",
    title: "Crear una galería",
    description: "Te guío paso a paso para crear y configurar tu primera galería fotográfica.",
    estimatedTime: "5 min",
    steps: [
        {
            id: "intro",
            title: "Vamos a crear tu galería 📸",
            body: "Una galería es el espacio donde entregás las fotos de un trabajo a tus clientes. Puede ser pública o privada, gratuita o paga, estándar o de evento. Este tour cubre todo.",
            route: "/dashboard/galleries",
            selector: null,
            selectorText: null,
        },
        {
            id: "go-galleries",
            title: "Ir a Galerías",
            body: "En el menú lateral (o en el ☰ en celular), hacé clic en «Galerías» para ver tus álbumes.",
            route: "/dashboard/galleries",
            selector: "a[href='/dashboard/galleries']",
            selectorText: null,
            tip: "Desde ahí también podés ver y gestionar las galerías que ya tenés.",
        },
        {
            id: "new-gallery-btn",
            title: "Crear nueva galería",
            body: "Hacé clic en el botón «Nueva» para abrir el formulario de creación.",
            route: "/dashboard/galleries",
            selectorText: "Nueva",
            selectorFallbackText: "Crear primera galería",
            tip: "Si el botón está deshabilitado, revisá que tu plan no haya llegado al límite de galerías.",
        },
        {
            // Campo: <Input id="title" />
            id: "gallery-title",
            title: "Dale un título claro",
            body: "Escribí un nombre descriptivo. Un buen título ayuda a tus clientes a identificar su trabajo al instante.\n\nPor ejemplo: «Casamiento García – Nov 2024».",
            route: "/dashboard/galleries/new",
            selector: "#title",
            selectorText: null,
            tip: "Incluí el nombre del cliente y la fecha: es lo más fácil para buscarlo después.",
        },
        {
            // Campo: <textarea id="description" />
            id: "gallery-description",
            title: "Descripción (opcional)",
            body: "Podés agregar una descripción breve. Aparece en la galería pública y le da más contexto al cliente.",
            route: "/dashboard/galleries/new",
            selector: "#description",
            selectorText: null,
            tip: "Algo simple como «Sesión de boda en Mendoza, 15 de noviembre» ya está perfecto.",
        },
        {
            // Sección Tipo de galería — sin spotlight, explicación general
            id: "gallery-type-section",
            title: "Sección: Tipo de galería",
            body: "Esta sección define el comportamiento de la galería.\n\n• «Estándar»: para entregas donde solo vos subís fotos — retratos, familia, productos.\n\n• «Evento»: para bodas, cumpleaños y fiestas — los invitados también pueden subir sus fotos con QR y búsqueda facial.",
            route: "/dashboard/galleries/new",
            selector: null,
            selectorText: null,
            tip: "Si el botón «Evento» aparece en gris, tu plan actual no lo incluye.",
        },
        {
            id: "gallery-type-question",
            title: "¿Qué tipo de galería necesitás?",
            body: "Elegí según el trabajo:\n\n• Estándar: retratos, familia, productos, arquitectura — solo vos subís fotos.\n\n• Evento: bodas, cumpleaños, fiestas — los invitados también pueden subir fotos y buscar las suyas con reconocimiento facial.",
            question: true,
            questionYes: "🎉 Evento (QR + invitados)",
            questionNo: "🖼️ Estándar",
        },
    ],

    // ── Rama: Galería de Evento ───────────────────────────────────────────────
    branchYes: [
        {
            // Botón: textContent = "EventoFotógrafo + invitados · QR"  (o variante con precio)
            // "Evento" es único en el form — no hay otro botón con ese texto
            id: "type-event-btn",
            title: "Seleccioná «Evento»",
            body: "Hacé clic en el botón «Evento» dentro de la sección Tipo de galería.",
            route: "/dashboard/galleries/new",
            selectorText: "Evento",
            tip: "Al seleccionarlo aparecen las opciones de fotos del fotógrafo y la cuenta regresiva.",
        },
        {
            // Botón: textContent = "Con costoLos invitados pagan para descargar"
            // "Con costo" es único
            id: "event-pro-photos-cost",
            title: "Fotos del fotógrafo: ¿con costo o gratis?",
            body: "Elegís si tus fotos profesionales tienen precio o son de descarga libre.\n\n• «Con costo»: los invitados pagan para descargar tus fotos — lo más común.\n\n• «Gratis»: descarga libre para todos — ideal cuando el contratante ya pagó el paquete completo.",
            route: "/dashboard/galleries/new",
            selectorText: "Con costo",
            tip: "«Con costo» es la opción predeterminada. Si querés cambiarla, hacé clic en «Gratis».",
        },
        {
            // Botón: textContent = "GratisDescarga libre para todos"
            // "Gratis" es único en el form (no existe otro botón con ese texto)
            id: "event-pro-photos-free",
            title: "Opción «Gratis» para las fotos",
            body: "Si el evento ya fue cobrado por contrato, seleccioná «Gratis» para que los invitados descarguen sin pagar. Dejá «Con costo» seleccionado si vas a cobrar por descarga.",
            route: "/dashboard/galleries/new",
            selectorText: "Gratis",
            tip: "Esta opción también es buena para eventos corporativos donde la empresa ya pagó todo.",
        },
        {
            // Botón: textContent = "Sin cuenta regresivaLa galería abre de inmediato"
            // "Sin cuenta regresiva" es único
            id: "event-no-countdown",
            title: "Fecha de inicio del evento",
            body: "Podés elegir si la galería muestra una cuenta regresiva antes de abrirse.\n\n• «Sin cuenta regresiva»: la galería está disponible de inmediato.\n\n• «Con cuenta regresiva»: muestra un contador hasta la hora de inicio — útil para compartir el QR antes del evento.",
            route: "/dashboard/galleries/new",
            selectorText: "Sin cuenta regresiva",
            tip: "Compartir el QR antes del evento es una buena práctica: los invitados llegan sabiendo cómo usarlo.",
        },
        {
            // Botón: textContent = "Con cuenta regresivaCompartí el link antes del evento"
            // "Con cuenta regresiva" es único
            id: "event-countdown-toggle",
            title: "Activar cuenta regresiva",
            body: "Si querés que la galería muestre un contador, hacé clic en «Con cuenta regresiva». Aparecerá un campo para ingresar la fecha y hora exacta del evento.",
            route: "/dashboard/galleries/new",
            selectorText: "Con cuenta regresiva",
            tip: "Una vez que el evento empieza, el contador desaparece solo y muestra la galería.",
        },
        {
            // Input: <Input id="eventStartsAt" /> — solo existe en DOM cuando hasEventStart === true
            // El paso anterior activa el toggle, este paso aparece después
            id: "event-start-input",
            title: "Fecha y hora del evento",
            body: "Completá acá la fecha y hora exacta en que comienza el evento. Hasta ese momento los visitantes verán el contador.",
            route: "/dashboard/galleries/new",
            selector: "#eventStartsAt",
            selectorText: null,
            tip: "Usá la hora real de inicio, no la de llegada de los invitados.",
        },
        {
            // Botón: textContent = "PúblicaCualquiera con el link"
            // "Pública" es único (el otro botón es "Privada")
            id: "event-visibility-public",
            title: "Visibilidad de la galería",
            body: "Elegís cómo acceden los invitados.\n\n• «Pública»: cualquier persona con el link o el QR puede entrar — sin fricción, ideal para eventos masivos.\n\n• «Privada»: requiere contraseña además del link — más control, pero tenés que repartir la clave en el momento.",
            route: "/dashboard/galleries/new",
            selectorText: "Pública",
            tip: "Para eventos grandes, «Pública» evita el caos de tener que dar contraseñas en el momento.",
        },
        {
            // Botón: textContent = "PrivadaSolo con contraseña"
            // "Privada" es único
            id: "event-visibility-private",
            title: "¿Querés protegerla con contraseña?",
            body: "Si preferís mayor control, hacé clic en «Privada». Vas a necesitar compartir la contraseña junto con el QR a los invitados.",
            route: "/dashboard/galleries/new",
            selectorText: "Privada",
            tip: "Elegí una contraseña corta y fácil de tipear en celular. Evitá @, #, ! y similares.",
        },
        {
            // Input: <Input id="password" /> — solo existe en DOM cuando isPublic === false
            // El paso anterior activa la visibilidad privada, este aparece después
            id: "event-password-input",
            title: "Contraseña de acceso",
            body: "Escribí la contraseña que los invitados van a necesitar para entrar. Debe tener al menos 4 caracteres.",
            route: "/dashboard/galleries/new",
            selector: "#password",
            selectorText: null,
            tip: "Algo como el apellido del contratante + año funciona bien. Ej: garcia2024",
        },
        {
            // Botón: textContent = "Sin vencimientoLa galería no expira"
            // "Sin vencimiento" es único
            id: "event-no-expiry",
            title: "Sección: Vencimiento y descargas",
            body: "Controlás el tiempo de vida de la galería.\n\n• «Sin vencimiento»: la galería queda activa indefinidamente.\n\n• «Con vencimiento»: definís una fecha de cierre automático. Para eventos, 1 o 2 semanas es una buena práctica.",
            route: "/dashboard/galleries/new",
            selectorText: "Sin vencimiento",
            tip: "Avisales a los invitados antes de que venza para que descarguen a tiempo.",
        },
        {
            // Botón: textContent = "Con vencimientoDefiní una fecha límite"
            id: "event-expiry-toggle",
            title: "Activar vencimiento",
            body: "Si querés que la galería tenga un cierre automático, hacé clic en «Con vencimiento». Aparecerá un campo para elegir la fecha límite.",
            route: "/dashboard/galleries/new",
            selectorText: "Con vencimiento",
            tip: "Después de esa fecha los invitados ya no podrán ver ni descargar fotos.",
        },
        {
            // Input: <Input id="expiresAt" /> — solo existe cuando hasExpiry === true
            id: "event-expiry-input",
            title: "Fecha de cierre",
            body: "Elegí acá hasta cuándo estará disponible la galería.",
            route: "/dashboard/galleries/new",
            selector: "#expiresAt",
            selectorText: null,
            tip: "Después de esa fecha los invitados ya no podrán ver ni descargar fotos.",
        },
        {
            // Select: <select id="downloadLinkDuration" />
            id: "event-download-duration",
            title: "Duración de links de descarga",
            body: "Cuando un invitado descarga o compra fotos, recibe un link temporal. Acá definís por cuánto tiempo es válido.\n\nPara eventos recomendamos 48 o 72 horas.",
            route: "/dashboard/galleries/new",
            selector: "#downloadLinkDuration",
            selectorText: null,
            tip: "Si alguien pierde el link, podés regenerarlo desde el panel de Órdenes.",
        },
        {
            // Botón: textContent = "Solo digitalDescarga de archivos solamente"
            // "Solo digital" es único
            id: "event-printable",
            title: "Sección: Versión Imprimible",
            body: "Si tu plan lo incluye, podés ofrecer fotos impresas además de digitales.\n\n• «Solo digital»: los invitados solo descargan archivos.\n\n• «Digital + Impresión»: pueden pedir fotos impresas también.",
            route: "/dashboard/galleries/new",
            selectorText: "Solo digital",
            tip: "La venta de impresiones es un diferencial enorme para bodas. Suma valor sin trabajo extra.",
        },
        {
            // Botón: textContent = "Digital + ImpresiónClientes eligen digital, impresa o ambas"
            id: "event-printable-toggle",
            title: "Activar impresiones (opcional)",
            body: "Si tu plan incluye esta opción y querés vender fotos impresas, hacé clic en «Digital + Impresión». Los tamaños y precios se configuran dentro de la galería después de crearla.",
            route: "/dashboard/galleries/new",
            selectorText: "Digital + Impresión",
            tip: "Si tu plan no incluye impresiones, estos botones no aparecen.",
        },
        {
            // Botón submit: textContent = "Crear galería" o "Pagar y crear galería"
            id: "event-submit",
            title: "¡Todo listo! Creá la galería 🎊",
            body: "Revisá que todo esté bien y hacé clic en «Crear galería». Una vez creada vas a poder subir tus fotos y obtener el QR para compartir con los invitados.\n\n⚠️ Si ya usaste todas las galerías de evento de tu plan, aparecerá un pago adicional antes de crear.",
            route: "/dashboard/galleries/new",
            selector: "button[type='submit']",
            selectorText: "Crear galería",
            selectorFallbackText: "Pagar y crear galería",
            tip: "El QR lo encontrás dentro de la galería creada. Podés imprimirlo o enviarlo por WhatsApp.",
            final: true,
        },
    ],

    // ── Rama: Galería Estándar ────────────────────────────────────────────────
    branchNo: [
        {
            // Botón: textContent = "EstándarSolo fotos del fotógrafo"
            // "Estándar" es único
            id: "type-standard-btn",
            title: "Seleccioná «Estándar»",
            body: "Hacé clic en el botón «Estándar» dentro de la sección Tipo de galería.",
            route: "/dashboard/galleries/new",
            selectorText: "Estándar",
            tip: "En la galería estándar solo vos podés subir contenido — ideal para entregas profesionales.",
        },
        {
            // Botón: textContent = "PúblicaCualquiera con el link"
            id: "standard-visibility-public",
            title: "Sección: Visibilidad",
            body: "Elegís cómo acceden tus clientes.\n\n• «Pública»: cualquiera con el link puede entrar sin contraseña.\n\n• «Privada»: el cliente necesita ingresar una contraseña además del link.",
            route: "/dashboard/galleries/new",
            selectorText: "Pública",
            tip: "Para entregas a clientes particulares, la galería privada es la opción más profesional.",
        },
        {
            // Botón: textContent = "PrivadaSolo con contraseña"
            id: "standard-visibility-private",
            title: "¿Querés protegerla con contraseña?",
            body: "Si la galería es para un cliente específico, hacé clic en «Privada». Solo el cliente con la contraseña podrá acceder.",
            route: "/dashboard/galleries/new",
            selectorText: "Privada",
            tip: "Combiná el apellido del cliente con el año para una contraseña fácil. Ej: garcia2024",
        },
        {
            // Input: <Input id="password" /> — solo existe cuando isPublic === false
            id: "standard-password-input",
            title: "Contraseña de acceso",
            body: "Escribí acá la contraseña que el cliente va a necesitar para ingresar. Debe tener al menos 4 caracteres. Es lo que le vas a compartir junto con el link.",
            route: "/dashboard/galleries/new",
            selector: "#password",
            selectorText: null,
            tip: "Evitá caracteres especiales como @, #, ! — son difíciles de tipear en celular.",
        },
        {
            id: "standard-paid-question",
            title: "¿Querés cobrar por las fotos?",
            body: "La galería puede ser:\n\n• Gratuita: el cliente descarga sin pagar — ideal para entregas incluidas en el contrato.\n\n• Paga: cada foto o paquete tiene un precio — los precios los configurás dentro de la galería después de crearla.",
            question: true,
            questionYes: "💰 Sí, quiero cobrar",
            questionNo: "🎁 No, entrega gratuita",
            branchYes: [
                {
                    // Sin selector — paso informativo
                    id: "paid-pricing-info",
                    title: "Cómo configurar los precios 💰",
                    body: "Después de crear la galería, dentro de la sección «Precios» elegís la modalidad:\n\n• «Por foto»: precio fijo por imagen.\n\n• «Por pack»: precio escalonado según cantidad — a más fotos, más barato le sale al cliente cada una.",
                    route: "/dashboard/galleries/new",
                    selector: null,
                    selectorText: null,
                    tip: "El precio por pack incentiva al cliente a comprar más: «5 por $5.000, 10 por $8.000, todas por $12.000».",
                },
                {
                    // Botón: textContent = "Sin vencimientoLa galería no expira"
                    id: "paid-no-expiry",
                    title: "Sección: Vencimiento y descargas",
                    body: "Controlás el tiempo de vida de la galería.\n\n• «Sin vencimiento»: la galería queda activa indefinidamente.\n\n• «Con vencimiento»: para galerías pagas, un límite de tiempo genera urgencia de compra.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Sin vencimiento",
                    tip: "Una galería sin vencimiento puede llevar a que los clientes posterguen la compra indefinidamente.",
                },
                {
                    // Botón: textContent = "Con vencimientoDefiní una fecha límite"
                    id: "paid-expiry-toggle",
                    title: "Activar vencimiento",
                    body: "Hacé clic en «Con vencimiento» para definir una fecha de cierre. Después de esa fecha los clientes ya no podrán ver ni comprar fotos.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Con vencimiento",
                    tip: "Muchos fotógrafos usan 30 días: tiempo suficiente pero con sensación de límite.",
                },
                {
                    // Input: <Input id="expiresAt" /> — solo existe cuando hasExpiry === true
                    id: "paid-expiry-input",
                    title: "Fecha de cierre",
                    body: "Elegí acá la fecha y hora en que la galería dejará de estar accesible para compras.",
                    route: "/dashboard/galleries/new",
                    selector: "#expiresAt",
                    selectorText: null,
                    tip: "Después de esa fecha los clientes ya no podrán comprar ni descargar fotos.",
                },
                {
                    // Select: <select id="downloadLinkDuration" />
                    id: "paid-download-duration",
                    title: "Duración de links de descarga",
                    body: "Cuando el cliente paga, recibe un link temporal para descargar. Acá definís por cuánto tiempo es válido ese link.\n\nPara galerías pagas recomendamos 48 horas.",
                    route: "/dashboard/galleries/new",
                    selector: "#downloadLinkDuration",
                    selectorText: null,
                    tip: "Si el cliente no descarga a tiempo, podés regenerar el link desde el panel de Órdenes.",
                },
                {
                    // Botón: textContent = "Solo digitalDescarga de archivos solamente"
                    id: "paid-printable",
                    title: "Sección: Versión Imprimible",
                    body: "Si tu plan lo incluye, podés ofrecer fotos impresas además de digitales.\n\n• «Solo digital»: el cliente solo descarga archivos.\n\n• «Digital + Impresión»: puede pedir fotos impresas también.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Solo digital",
                    tip: "La venta de impresiones es un diferencial enorme para bodas y retratos.",
                },
                {
                    // Botón: textContent = "Digital + ImpresiónClientes eligen digital, impresa o ambas"
                    id: "paid-printable-toggle",
                    title: "Activar impresiones (opcional)",
                    body: "Si tu plan incluye esta opción, hacé clic en «Digital + Impresión». Los tamaños y precios de impresión se configuran dentro de la galería después de crearla.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Digital + Impresión",
                    tip: "Recordá tener tu Mercado Pago conectado en Configuración para recibir pagos.",
                },
                {
                    // Botón submit
                    id: "paid-submit",
                    title: "¡Listo para crear y cobrar! 🎉",
                    body: "Hacé clic en «Crear galería». Una vez creada:\n\n1. Entrá a la galería y configurá los precios en «Precios».\n2. Subí las fotos.\n3. Compartí el link con tu cliente.",
                    route: "/dashboard/galleries/new",
                    selector: "button[type='submit']",
                    selectorText: "Crear galería",
                    tip: "Sin Mercado Pago conectado los clientes no podrán pagar. Configuralo antes de compartir.",
                    final: true,
                },
            ],
            branchNo: [
                {
                    // Botón: textContent = "Sin vencimientoLa galería no expira"
                    id: "free-no-expiry",
                    title: "Sección: Vencimiento y descargas",
                    body: "Controlás el tiempo de vida de la galería.\n\n• «Sin vencimiento»: la galería queda activa para siempre — el cliente puede descargar cuando quiera.\n\n• «Con vencimiento»: definís una fecha de cierre automático.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Sin vencimiento",
                    tip: "Para entregas gratuitas, «Sin vencimiento» es lo más cómodo para el cliente.",
                },
                {
                    // Botón: textContent = "Con vencimientoDefiní una fecha límite"
                    id: "free-expiry-toggle",
                    title: "¿Querés que expire la galería?",
                    body: "Si querés poner un límite de tiempo, hacé clic en «Con vencimiento». Para entregas gratuitas es opcional, pero ayuda a mantener el orden si manejás muchos trabajos.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Con vencimiento",
                    tip: "Muchos fotógrafos usan 90 días: tiempo más que suficiente para que el cliente descargue todo.",
                },
                {
                    // Input: <Input id="expiresAt" /> — solo existe cuando hasExpiry === true
                    id: "free-expiry-input",
                    title: "Fecha de cierre",
                    body: "Si elegiste «Con vencimiento», configurá acá hasta cuándo estará disponible la galería.",
                    route: "/dashboard/galleries/new",
                    selector: "#expiresAt",
                    selectorText: null,
                    tip: "Después de esa fecha el cliente ya no podrá ver ni descargar las fotos.",
                },
                {
                    // Select: <select id="downloadLinkDuration" />
                    id: "free-download-duration",
                    title: "Duración de links de descarga",
                    body: "Cuando el cliente hace clic en «Descargar», recibe un link temporal. Acá definís por cuánto tiempo es válido ese link.\n\nPara entregas gratuitas recomendamos 7 días o más.",
                    route: "/dashboard/galleries/new",
                    selector: "#downloadLinkDuration",
                    selectorText: null,
                    tip: "Para entregas gratuitas, links más largos (7–30 días) son más cómodos para el cliente.",
                },
                {
                    // Botón: textContent = "Solo digitalDescarga de archivos solamente"
                    id: "free-printable",
                    title: "Sección: Versión Imprimible",
                    body: "Si tu plan lo incluye, podés ofrecer fotos impresas además de la descarga digital gratuita.\n\n• «Solo digital»: el cliente solo descarga archivos.\n\n• «Digital + Impresión»: la descarga digital sigue siendo gratis, pero el cliente puede pagar por fotos impresas.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Solo digital",
                    tip: "Ofrecer impresiones en una galería gratuita es una forma de generar ingresos adicionales.",
                },
                {
                    // Botón: textContent = "Digital + ImpresiónClientes eligen digital, impresa o ambas"
                    id: "free-printable-toggle",
                    title: "Activar impresiones (opcional)",
                    body: "Si tu plan incluye esta opción y querés vender fotos impresas, hacé clic en «Digital + Impresión». Los tamaños y precios de impresión se configuran dentro de la galería después de crearla.",
                    route: "/dashboard/galleries/new",
                    selectorText: "Digital + Impresión",
                    tip: "Es el mejor de los dos mundos: el cliente descarga gratis y vos ganás extra por las impresiones.",
                },
                {
                    // Botón submit
                    id: "free-submit",
                    title: "¡Galería gratuita lista! 🎉",
                    body: "Hacé clic en «Crear galería», subí las fotos y compartí el link con tu cliente. Pueden ver y descargar todo sin pagar.\n\nTip: subí una foto de portada antes de compartir — hace que el link se vea más profesional al enviarlo por WhatsApp.",
                    route: "/dashboard/galleries/new",
                    selector: "button[type='submit']",
                    selectorText: "Crear galería",
                    tip: "Subí una foto de portada antes de compartir: hace que el link se vea mucho más profesional.",
                    final: true,
                },
            ],
        },
    ],
}

export default galeriesTour