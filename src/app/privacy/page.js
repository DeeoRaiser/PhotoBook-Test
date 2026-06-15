export const metadata = {
    title: "Política de Privacidad — PhotoBook",
    description: "Cómo recopilamos, usamos y protegemos tu información personal en PhotoBook.",
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

export default function PrivacyPolicyPage() {
    const lastUpdated = "15 de junio de 2025"

    return (
        <div style={S.page}>
            {/* Header */}
            <header style={S.header}>
                <p style={S.logo}>PhotoBook</p>
                <h1 style={S.title}>Política de Privacidad</h1>
                <p style={S.subtitle}>Última actualización: {lastUpdated}</p>
            </header>

            <div style={S.container}>
                {/* Resumen */}
                <div style={S.highlight}>
                    <p style={S.highlightText}>
                        En PhotoBook respetamos tu privacidad. Recopilamos solo la información necesaria
                        para que fotógrafos y clientes puedan conectarse y compartir imágenes de forma
                        segura. Nunca vendemos tus datos a terceros.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>1. Información que recopilamos</h2>
                    <p style={S.p}>Recopilamos información que nos proporcionás directamente:</p>
                    <ul style={S.ul}>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña al registrarte.</li>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>Datos de compra:</strong> nombre, email y teléfono celular para gestionar pedidos y enviar links de descarga.</li>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>Contenido:</strong> fotografías, galerías y archivos que subís a la plataforma.</li>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>Datos de pago:</strong> procesados por MercadoPago. No almacenamos datos de tarjetas.</li>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>Comunicaciones:</strong> mensajes que nos enviás a través del formulario de contacto o WhatsApp.</li>
                    </ul>
                    <p style={S.p}>También recopilamos información automáticamente:</p>
                    <ul style={S.ul}>
                        <li style={S.li}>Datos de uso y navegación (páginas visitadas, tiempo en la plataforma).</li>
                        <li style={S.li}>Dirección IP y tipo de dispositivo para seguridad y analítica.</li>
                        <li style={S.li}>Cookies técnicas necesarias para el funcionamiento de la sesión.</li>
                    </ul>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>2. Cómo usamos tu información</h2>
                    <ul style={S.ul}>
                        <li style={S.li}>Crear y gestionar tu cuenta de fotógrafo o cliente.</li>
                        <li style={S.li}>Procesar pedidos y enviar links de descarga de fotografías.</li>
                        <li style={S.li}>Enviarte notificaciones sobre el estado de tus pedidos por email y WhatsApp.</li>
                        <li style={S.li}>Autenticar tu identidad mediante Google OAuth (si elegís esta opción).</li>
                        <li style={S.li}>Mejorar la plataforma mediante análisis de uso agregado.</li>
                        <li style={S.li}>Cumplir con obligaciones legales aplicables.</li>
                    </ul>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>3. Compartir información con terceros</h2>
                    <p style={S.p}>No vendemos ni alquilamos tus datos. Solo los compartimos con:</p>
                    <ul style={S.ul}>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>MercadoPago:</strong> para procesar pagos de forma segura.</li>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>Google:</strong> si iniciás sesión con Google OAuth, para autenticar tu identidad.</li>
                        <li style={S.li}><strong style={{ color: "#cbd5e1" }}>Proveedores de email:</strong> para enviar notificaciones transaccionales.</li>
                    </ul>
                    <p style={S.p}>Podemos divulgar información si así lo exige la ley o para proteger los derechos de la plataforma.</p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>4. Almacenamiento y seguridad</h2>
                    <p style={S.p}>
                        Tus datos se almacenan en servidores seguros. Usamos cifrado en tránsito (HTTPS)
                        y en reposo. Las contraseñas se almacenan con hash bcrypt y nunca en texto plano.
                    </p>
                    <p style={S.p}>
                        Los links de descarga tienen vencimiento configurable y son únicos por pedido,
                        lo que limita el acceso no autorizado a las fotografías.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>5. Retención de datos</h2>
                    <p style={S.p}>
                        Conservamos tu información mientras tu cuenta esté activa o sea necesario para
                        prestar el servicio. Podés solicitar la eliminación de tu cuenta y datos en
                        cualquier momento escribiéndonos.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>6. Tus derechos</h2>
                    <p style={S.p}>Tenés derecho a:</p>
                    <ul style={S.ul}>
                        <li style={S.li}>Acceder a los datos personales que tenemos sobre vos.</li>
                        <li style={S.li}>Solicitar la corrección de datos incorrectos.</li>
                        <li style={S.li}>Solicitar la eliminación de tu cuenta y datos asociados.</li>
                        <li style={S.li}>Revocar el consentimiento para el uso de tus datos.</li>
                    </ul>
                    <p style={S.p}>
                        Para ejercer cualquiera de estos derechos, escribinos a{" "}
                        <a href="mailto:soporte@photobook.com.ar" style={S.email}>soporte@photobook.com.ar</a>
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>7. Cookies</h2>
                    <p style={S.p}>
                        Usamos cookies técnicas esenciales para mantener tu sesión activa. No usamos
                        cookies de rastreo publicitario. Google Analytics puede usar cookies propias
                        para analítica de uso agregada y anónima.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>8. Cambios a esta política</h2>
                    <p style={S.p}>
                        Podemos actualizar esta política ocasionalmente. Te notificaremos por email
                        sobre cambios significativos. El uso continuado de la plataforma tras la
                        actualización implica aceptación de los nuevos términos.
                    </p>
                </div>

                <div style={S.section}>
                    <h2 style={S.sectionTitle}>9. Contacto</h2>
                    <p style={S.p}>
                        Para consultas sobre privacidad escribinos a{" "}
                        <a href="mailto:soporte@photobook.com.ar" style={S.email}>soporte@photobook.com.ar</a>
                    </p>
                </div>

                <a href="/" style={S.back}>← Volver al inicio</a>
            </div>
        </div>
    )
}