import nodemailer from "nodemailer"
import path from "path"

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

// ─────────────────────────────────────────────────────────────
// TEMPLATE BASE
// ─────────────────────────────────────────────────────────────

function createEmailLayout({ preview, content }) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta name="color-scheme" content="light only">
        <title>PhotoBook</title>
    </head>

    <body style="
        margin:0;
        padding:0;
        background:#f4f5f7;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
        color:#111827;
    ">

        <!-- Preview Text -->
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            ${preview}
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 16px;">
            <tr>
                <td align="center">

                    <table width="620" cellpadding="0" cellspacing="0" border="0" style="
                        width:100%;
                        max-width:620px;
                        background:#ffffff;
                        border-radius:24px;
                        overflow:hidden;
                        border:1px solid #e5e7eb;
                        box-shadow:0 10px 40px rgba(0,0,0,0.06);
                    ">

                        <!-- HEADER -->
                    <tr>
                        <td style="
                            background:linear-gradient(135deg,#0f172a 0%, #111827 100%);
                            padding:48px 48px 42px;
                            text-align:center;
                        ">

                            <!-- Logo -->
                            <div style="margin-bottom:22px;">
                                <img
                                    src="cid:photobooklogo"
                                    alt="PhotoBook"
                                    width="72"
                                    height="72"
                                    style="
                                        display:block;
                                        margin:0 auto;
                                        object-fit:contain;
                                    "
                                />
                            </div>

                            <!-- Brand -->
                            <h1 style="
                                margin:0;
                                color:#ffffff;
                                font-size:34px;
                                line-height:1.1;
                                font-weight:900;
                                letter-spacing:-1.4px;
                            ">
                                PhotoBook
                            </h1>

                            <p style="
                                margin:10px 0 0;
                                color:#cbd5e1;
                                font-size:15px;
                                line-height:1.7;
                                font-weight:500;
                            ">
                                Plataforma profesional para fotógrafos y clientes
                            </p>

                        </td>
                    </tr>

                        <!-- CONTENT -->
                        <tr>
                            <td style="padding:48px;">
                                ${content}
                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td style="
                                background:#f9fafb;
                                border-top:1px solid #e5e7eb;
                                padding:32px 48px;
                                text-align:center;
                            ">

                                <p style="
                                    margin:0 0 10px;
                                    color:#6b7280;
                                    font-size:13px;
                                    line-height:1.7;
                                ">
                                    Este email fue enviado automáticamente por PhotoBook.
                                </p>

                                <p style="
                                    margin:0;
                                    color:#9ca3af;
                                    font-size:12px;
                                ">
                                    © ${new Date().getFullYear()} PhotoBook. Todos los derechos reservados.
                                </p>

                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>
    `
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES
// ─────────────────────────────────────────────────────────────

function createButton(label, url) {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <a href="${url}"
                    style="
                        display:inline-block;
                        background:#111827;
                        color:#ffffff;
                        text-decoration:none;
                        padding:16px 34px;
                        border-radius:14px;
                        font-size:15px;
                        font-weight:700;
                        letter-spacing:0.2px;
                    ">
                    ${label}
                </a>
            </td>
        </tr>
    </table>
    `
}

function createCodeBlock(code) {
    return `
    <div style="
        background:linear-gradient(180deg,#f9fafb 0%, #f3f4f6 100%);
        border:1px solid #e5e7eb;
        border-radius:22px;
        padding:30px;
        text-align:center;
        margin:32px 0;
    ">

        <p style="
            margin:0 0 14px;
            color:#6b7280;
            font-size:13px;
            text-transform:uppercase;
            letter-spacing:1.4px;
            font-weight:700;
        ">
            Código de verificación
        </p>

        <div style="
            font-size:46px;
            line-height:1;
            letter-spacing:14px;
            font-weight:900;
            color:#111827;
            font-family:monospace;
        ">
            ${code}
        </div>

    </div>
    `
}

function createDivider() {
    return `
    <div style="
        height:1px;
        background:#e5e7eb;
        margin:32px 0;
    "></div>
    `
}

// ─────────────────────────────────────────────────────────────
// EMAIL VERIFICACIÓN
// ─────────────────────────────────────────────────────────────

export async function sendVerificationEmail({
    name,
    email,
    code,
    verifyUrl,
}) {
    const content = `
        <h2 style="
            margin:0 0 12px;
            font-size:30px;
            line-height:1.2;
            color:#111827;
            font-weight:800;
            letter-spacing:-1px;
        ">
            Hola ${name} 👋
        </h2>

        <p style="
            margin:0;
            color:#4b5563;
            font-size:16px;
            line-height:1.8;
        ">
            Gracias por registrarte en <strong>PhotoBook</strong>.
            Para activar tu cuenta ingresá el siguiente código
            de verificación:
        </p>

        ${createCodeBlock(code)}

        <p style="
            margin:0 0 28px;
            color:#6b7280;
            font-size:14px;
            text-align:center;
        ">
            Este código expira en <strong>24 horas</strong>.
        </p>

        ${createButton("Verificar mi cuenta", verifyUrl)}

        ${createDivider()}

        <div style="
            background:#f9fafb;
            border-radius:16px;
            padding:20px;
        ">
            <p style="
                margin:0;
                color:#6b7280;
                font-size:13px;
                line-height:1.7;
            ">
                Si no creaste una cuenta en PhotoBook,
                podés ignorar este email de forma segura.
            </p>
        </div>
    `

    const html = createEmailLayout({
        preview: "Verificá tu cuenta de PhotoBook",
        content,
    })

    await transporter.sendMail({
        from: `"PhotoBook" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: "📸 Verificá tu cuenta en PhotoBook",
        html,

        attachments: [
            {
                filename: "logo.png",
                path: "./public/logo.png",
                cid: "photobooklogo",
            },
        ],
    })
}

// ─────────────────────────────────────────────────────────────
// RECUPERACIÓN DE CONTRASEÑA
// ─────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail({ name, email, resetUrl }) {
    const content = `
        <h2 style="
            margin:0 0 12px;
            font-size:30px;
            line-height:1.2;
            color:#111827;
            font-weight:800;
            letter-spacing:-1px;
        ">
            Recuperá tu contraseña 🔑
        </h2>

        <p style="
            margin:0 0 28px;
            color:#4b5563;
            font-size:16px;
            line-height:1.8;
        ">
            Hola <strong>${name}</strong>,
            recibimos una solicitud para restablecer la contraseña de tu cuenta en
            <strong>PhotoBook</strong>. Hacé clic en el botón para crear una nueva contraseña:
        </p>

        ${createButton("Restablecer contraseña", resetUrl)}

        <p style="
            margin:24px 0 0;
            color:#6b7280;
            font-size:13px;
            text-align:center;
            line-height:1.7;
        ">
            Este enlace expirará en <strong>1 hora</strong>.
        </p>

        ${createDivider()}

        <div style="
            background:#f9fafb;
            border-radius:16px;
            padding:20px;
        ">
            <p style="
                margin:0 0 10px;
                color:#6b7280;
                font-size:13px;
                line-height:1.7;
            ">
                Si no solicitaste el cambio de contraseña, podés ignorar este email de forma segura.
                Tu contraseña no será modificada.
            </p>
            <p style="
                margin:0;
                color:#9ca3af;
                font-size:12px;
                line-height:1.7;
                word-break:break-all;
            ">
                Si el botón no funciona, copiá este enlace: ${resetUrl}
            </p>
        </div>
    `

    const html = createEmailLayout({
        preview: "Restablecé tu contraseña de PhotoBook",
        content,
    })

    await transporter.sendMail({
        from: `"PhotoBook" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: "🔑 Restablecé tu contraseña en PhotoBook",
        html,
        attachments: [
            {
                filename: "logo.png",
                path: "./public/logo.png",
                cid: "photobooklogo",
            },
        ],
    })
}

// ─────────────────────────────────────────────────────────────
// CONFIRMACIÓN DE COMPRA
// ─────────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail({
    clientName,
    clientEmail,
    photographerName,
    galleryTitle,
    photos,
    total,
    downloadUrl,
    expiresAt,
}) {
    const expiresFormatted = new Date(expiresAt).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })

    const photoRows = photos.map((photo) => `
        <tr>
            <td style="
                padding:14px 0;
                border-bottom:1px solid #f3f4f6;
                color:#374151;
                font-size:14px;
            ">
                ${photo.title || "Fotografía"}
            </td>

            <td style="
                padding:14px 0;
                border-bottom:1px solid #f3f4f6;
                color:#111827;
                font-size:14px;
                font-weight:700;
                text-align:right;
            ">
                $${Number(photo.price).toFixed(2)}
            </td>
        </tr>
    `).join("")

    const content = `
        <h2 style="
            margin:0 0 12px;
            font-size:30px;
            line-height:1.2;
            color:#111827;
            font-weight:800;
            letter-spacing:-1px;
        ">
            Tus fotos están listas ✨
        </h2>

        <p style="
            margin:0 0 10px;
            color:#4b5563;
            font-size:16px;
            line-height:1.8;
        ">
            Hola <strong>${clientName}</strong>,
            tu pedido de la galería
            <strong>${galleryTitle}</strong>
            ya está disponible para descargar.
        </p>

        <p style="
            margin:0 0 32px;
            color:#6b7280;
            font-size:15px;
            line-height:1.7;
        ">
            Fotógrafo: <strong>${photographerName}</strong>
        </p>

        ${createButton("⬇ Descargar mis fotos", downloadUrl)}

        <p style="
            margin:24px 0 0;
            color:#6b7280;
            font-size:13px;
            text-align:center;
            line-height:1.7;
        ">
            El enlace expirará el
            <strong>${expiresFormatted}</strong>
        </p>

        ${createDivider()}

        <h3 style="
            margin:0 0 18px;
            color:#111827;
            font-size:16px;
            font-weight:800;
            letter-spacing:-0.3px;
        ">
            Resumen del pedido
        </h3>

        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${photoRows}

            <tr>
                <td style="
                    padding-top:18px;
                    color:#111827;
                    font-size:16px;
                    font-weight:800;
                ">
                    Total
                </td>

                <td style="
                    padding-top:18px;
                    color:#111827;
                    font-size:18px;
                    font-weight:900;
                    text-align:right;
                ">
                    $${Number(total).toFixed(2)}
                </td>
            </tr>
        </table>

        ${createDivider()}

        <div style="
            background:#f9fafb;
            border-radius:16px;
            padding:20px;
        ">
            <p style="
                margin:0 0 10px;
                color:#6b7280;
                font-size:13px;
                line-height:1.7;
            ">
                Si el botón no funciona, copiá y pegá este enlace:
            </p>

            <a href="${downloadUrl}" style="
                color:#111827;
                font-size:13px;
                line-height:1.7;
                word-break:break-all;
            ">
                ${downloadUrl}
            </a>
        </div>
    `

    const html = createEmailLayout({
        preview: "Tus fotos ya están disponibles para descargar",
        content,
    })

    await transporter.sendMail({
        from: `"PhotoBook" <${process.env.SMTP_FROM}>`,
        to: clientEmail,
        subject: `📸 Tus fotos de "${galleryTitle}" ya están listas`,
        html,
    })
}