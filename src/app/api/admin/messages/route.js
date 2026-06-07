import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin-auth"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

function buildEmailHtml({ name, subject, body, isHtml = false }) {
    const bodyHtml = isHtml
        ? body
        : body
            .split("\n")
            .map(line => line.trim() ? `<p style="margin:0 0 14px;line-height:1.7;color:#374151;">${line}</p>` : "<br/>")
            .join("")

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 10px 40px rgba(0,0,0,0.06);">
        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px 48px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PhotoBook</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;">Studio</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- BODY -->
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6b7280;letter-spacing:0.05em;">Hola, ${name} 👋</p>
            <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${subject}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 48px 36px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              Este mensaje fue enviado por el equipo de PhotoBook.<br/>
              Si tenés alguna consulta, respondé este email y te ayudamos.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// POST /api/admin/messages
// Body: { subject, body, criteria: { registeredFrom, registeredTo, planStatus, planId } }
export async function POST(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { subject, body, isHtml = false, criteria } = await req.json()

        if (!subject?.trim() || !body?.trim()) {
            return NextResponse.json({ error: "Asunto y mensaje son requeridos" }, { status: 400 })
        }

        const now = new Date()
        const where = buildWhere(criteria, now)

        const photographers = await prisma.photographer.findMany({
            where,
            select: { id: true, name: true, email: true },
        })

        if (photographers.length === 0) {
            return NextResponse.json({ error: "No hay usuarios que coincidan con los criterios seleccionados" }, { status: 400 })
        }

        // Send emails in batches of 10 to avoid SMTP overload
        // AND save each message to the DB so it appears in dashboard/messages
        let sent = 0
        let failed = 0
        const BATCH = 10

        for (let i = 0; i < photographers.length; i += BATCH) {
            const batch = photographers.slice(i, i + BATCH)
            await Promise.allSettled(
                batch.map(async (p) => {
                    try {
                        await transporter.sendMail({
                            from: `"PhotoBook" <${process.env.SMTP_USER}>`,
                            to: p.email,
                            subject,
                            html: buildEmailHtml({ name: p.name, subject, body, isHtml }),
                        })

                        // Guardar en la bandeja de entrada del fotógrafo
                        await prisma.contactMessage.create({
                            data: {
                                photographerId: p.id,
                                senderName:     "PhotoBook Admin",
                                senderEmail:    process.env.SMTP_USER || "admin@photobook.com",
                                message:        `<p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0f172a;">${subject}</p>${body}`,
                                isRead:         false,
                            },
                        })

                        sent++
                    } catch (err) {
                        console.error(`Failed to send to ${p.email}:`, err.message)
                        failed++
                    }
                })
            )
        }

        return NextResponse.json({ sent, failed, total: photographers.length })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}

// GET /api/admin/messages?... — devuelve cuántos usuarios matchean los criterios
export async function GET(req) {
    try {
        const admin = await getAdminSession()
        if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const criteria = {
            registeredFrom: searchParams.get("registeredFrom"),
            registeredTo:   searchParams.get("registeredTo"),
            planStatus:     searchParams.get("planStatus"),
            planId:         searchParams.get("planId"),
        }

        const now = new Date()
        const where = buildWhere(criteria, now)

        const count = await prisma.photographer.count({ where })
        const preview = await prisma.photographer.findMany({
            where,
            select: { name: true, email: true },
            take: 5,
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ count, preview })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

function buildWhere(criteria = {}, now) {
    const { registeredFrom, registeredTo, planStatus, planId } = criteria

    const where = {}

    if (registeredFrom || registeredTo) {
        where.createdAt = {}
        if (registeredFrom) where.createdAt.gte = new Date(registeredFrom)
        if (registeredTo) {
            const to = new Date(registeredTo)
            to.setHours(23, 59, 59, 999)
            where.createdAt.lte = to
        }
    }

    if (planStatus === "no_plan") {
        where.subscription = { is: null }
    } else if (planStatus === "inactive") {
        where.subscription = {
            is: {
                OR: [
                    { status: { not: "ACTIVE" } },
                    { expiresAt: { lt: now } },
                ],
            },
        }
    } else if (planStatus === "active") {
        where.subscription = {
            is: {
                status: "ACTIVE",
                expiresAt: { gte: now },
            },
        }
    } else if (planStatus === "specific" && planId) {
        where.subscription = {
            is: {
                planId,
                status: "ACTIVE",
                expiresAt: { gte: now },
            },
        }
    }

    return where
}
