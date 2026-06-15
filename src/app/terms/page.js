export const metadata = {
    title: "Condiciones del Servicio — PhotoBook",
    description: "Términos y condiciones de uso de la plataforma PhotoBook.",
}

const S = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        color: "#e2e8f0",
        padding: "0 0 80px",
    },
    header: {
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "32px 24px 28px",
        textAlign: "center",
        background: "rgba(255,255,255,0.02)",
    },
    logo: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#64748b",
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: "#f1f5f9",
        margin: "0 0 8px",
        letterSpacing: "-0.02em",
    },
    subtitle: {
        fontSize: 13,
        color: "#64748b",
        margin: 0,
    },
    container: {
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px 0",
    },
    section: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 700,
        color: "#f1f5f9",
        margin: "0 0 12px",
        paddingBottom: 8,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    p: {
        fontSize: 14,
        lineHeight: 1.75,
        color: "#94a3b8",
        margin: "0 0 12px",
    },
    ul: {
        margin: "0 0 12px",
        paddingLeft: 20,
    },
    li: {
        fontSize: 14,
        lineHeight: 1.75,
        color: "#94a3b8",
        marginBottom: 6,
    },
    highlight: {
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.15)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 32,
    },
    highlightText: {
        fontSize: 13,
        color: "#93c5fd",
        margin: 0,
        lineHeight: 1.6,
    },
    email: {
        color: "#60a5fa",
        textDecoration: "none",
    },
    back: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        color: "#64748b",
        textDecoration: "none",
        marginTop: 40,
        padding: "8px 0",
    },
}

export default function TermsOfServicePage() {
    const lastUpdated = "15 de junio de 2025"

    return (
        <div style={S.page}>
            {/* Header */}
            <header style={S.header}>
                <p style={S.logo}>PhotoBook</p>
                <h1 style={S.title}>Condiciones del Servicio</h1>
                <p style={S.subtitle}>Última actualización: {lastUpdated}</p>
            </header>

            <div style={S.container}>
                {/* Resumen */}
                <div style={S.highlight}>
                    <p style={S.highlightText}>
                        Al usar PhotoBook aceptás estas condiciones. La plataforma conecta fotógrafos
                        con sus clientes para la venta y entrega digital de fotografías. Leé este
                        documento antes de registrarte.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>1. Aceptación de los términos</h2>
                    <p style={S.p}>
                        Al acceder o usar PhotoBook (la "Plataforma"), aceptás quedar vinculado por
                        estas Condiciones del Servicio. Si no estás de acuerdo, no uses la Plataforma.
                    </p>
                    <p style={S.p}>
                        PhotoBook se reserva el derecho de modificar estos términos en cualquier momento.
                        Los cambios significativos serán notificados por email.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>2. Descripción del servicio</h2>
                    <p style={S.p}>PhotoBook es una plataforma que permite a fotógrafos:</p>
                    <ul style={S.ul}>
                        <li style={S.li}>Crear galerías digitales y compartirlas con sus clientes.</li>
                        <li style={S.li}>Vender fotografías digitales y servicios de impresión.</li>
                        <li style={S.li}>Gestionar pedidos, pagos y entregas de forma automatizada.</li>
                        <li style={S.li}>Configurar su perfil público y portfolio.</li>
                    </ul>
                    <p style={S.p}>Los clientes pueden acceder a galerías compartidas, comprar fotografías y descargarlas mediante links de tiempo limitado.</p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>3. Registro y cuenta</h2>
                    <p style={S.p}>
                        Para usar la Plataforma como fotógrafo debés crear una cuenta con información
                        veraz y actualizada. Sos responsable de mantener la confidencialidad de tu
                        contraseña y de toda actividad que ocurra bajo tu cuenta.
                    </p>
                    <p style={S.p}>
                        Podés registrarte con email y contraseña o mediante Google OAuth. Al usar Google,
                        aceptás también las condiciones de uso de Google.
                    </p>
                    <p style={S.p}>
                        PhotoBook puede suspender o eliminar cuentas que violen estas condiciones, sin
                        previo aviso en casos de abuso grave.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>4. Contenido y propiedad intelectual</h2>
                    <p style={S.p}>
                        Mantenés todos los derechos sobre las fotografías que subís a la Plataforma.
                        Al subirlas, nos otorgás una licencia limitada, no exclusiva y revocable para
                        almacenarlas, mostrarlas y entregarlas a tus clientes según tu configuración.
                    </p>
                    <p style={S.p}>No podés subir contenido que:</p>
                    <ul style={S.ul}>
                        <li style={S.li}>Infrinja derechos de autor o propiedad intelectual de terceros.</li>
                        <li style={S.li}>Contenga material ilegal, abusivo, difamatorio o pornográfico.</li>
                        <li style={S.li}>Comprometa la privacidad de personas sin su consentimiento.</li>
                    </ul>
                    <p style={S.p}>
                        PhotoBook se reserva el derecho de eliminar contenido que viole estas condiciones.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>5. Pagos y comisiones</h2>
                    <p style={S.p}>
                        Los pagos entre clientes y fotógrafos se procesan a través de MercadoPago o
                        mediante transferencia bancaria directa acordada entre las partes.
                    </p>
                    <p style={S.p}>
                        PhotoBook no retiene fondos ni cobra comisión sobre las transacciones en la
                        versión actual. Los planes de suscripción y sus condiciones se detallan en la
                        sección de precios de la Plataforma.
                    </p>
                    <p style={S.p}>
                        Las disputas de pago entre fotógrafo y cliente deben resolverse entre las partes.
                        PhotoBook no actúa como intermediario financiero.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>6. Links de descarga</h2>
                    <p style={S.p}>
                        Los links de descarga tienen una duración configurable por el fotógrafo. Una
                        vez vencido el link, el acceso a las fotografías no está garantizado. Es
                        responsabilidad del cliente descargar las fotos dentro del período habilitado.
                    </p>
                    <p style={S.p}>
                        PhotoBook no se responsabiliza por la pérdida de acceso a fotografías por links
                        vencidos, errores en el email proporcionado, o problemas de conectividad del
                        cliente.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>7. Limitación de responsabilidad</h2>
                    <p style={S.p}>
                        PhotoBook se provee "tal como está". No garantizamos disponibilidad ininterrumpida
                        del servicio. No somos responsables por pérdida de datos, lucro cesante, daños
                        indirectos o consecuentes derivados del uso de la Plataforma.
                    </p>
                    <p style={S.p}>
                        La responsabilidad máxima de PhotoBook ante cualquier reclamo no superará el
                        monto pagado por el usuario en concepto de suscripción en los últimos 3 meses.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>8. Conducta prohibida</h2>
                    <p style={S.p}>Está prohibido:</p>
                    <ul style={S.ul}>
                        <li style={S.li}>Usar la Plataforma para fines ilegales o no autorizados.</li>
                        <li style={S.li}>Intentar acceder sin autorización a cuentas o sistemas ajenos.</li>
                        <li style={S.li}>Distribuir links de descarga a personas no autorizadas.</li>
                        <li style={S.li}>Realizar ingeniería inversa o extraer datos de la Plataforma.</li>
                        <li style={S.li}>Usar bots o scripts automáticos sin autorización expresa.</li>
                    </ul>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>9. Cancelación y cierre de cuenta</h2>
                    <p style={S.p}>
                        Podés cancelar tu cuenta en cualquier momento desde la configuración de tu perfil
                        o escribiéndonos. Al cancelar, tus galerías y fotografías serán eliminadas de
                        los servidores en un plazo de 30 días.
                    </p>
                    <p style={S.p}>
                        Los pedidos completados y su historial pueden conservarse por obligaciones
                        fiscales o legales.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>10. Ley aplicable</h2>
                    <p style={S.p}>
                        Estas condiciones se rigen por las leyes de la República Argentina. Cualquier
                        disputa se someterá a la jurisdicción de los tribunales ordinarios de la
                        Ciudad Autónoma de Buenos Aires.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>11. Contacto</h2>
                    <p style={S.p}>
                        Para consultas sobre estas condiciones escribinos a{" "}
                        <a href="mailto:soporte@photobook.com.ar" style={S.email}>soporte@photobook.com.ar</a>
                    </p>
                </div>

                <a href="/" style={S.back}>← Volver al inicio</a>
            </div>
        </div>
    )
}