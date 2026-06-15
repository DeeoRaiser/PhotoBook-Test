/**
 * src/lib/bot-notifier.js
 *
 * Envía mensajes proactivos por WhatsApp a través del bot BuilderBot/Baileys.
 *
 * Variables de entorno requeridas en .env:
 *   WHATSAPP_BOT_INTERNAL_URL  → URL interna del bot, ej: http://localhost:3008
 *   BOT_SECRET                 → Secret compartido (mismo valor en bot y app)
 */

const BOT_URL = process.env.WHATSAPP_BOT_INTERNAL_URL?.replace(/\/$/, "")
const BOT_SECRET = process.env.BOT_SECRET

/**
 * Envía un mensaje de WhatsApp proactivo via el bot.
 * @param {string} phone   - Número del destinatario (cualquier formato)
 * @param {string} message - Texto a enviar
 */
export async function sendWhatsAppMessage(phone, message) {
    if (!BOT_URL) {
        console.warn("[BotNotifier] WHATSAPP_BOT_INTERNAL_URL no configurado — mensaje no enviado")
        return { ok: false, error: "BOT_URL no configurado" }
    }
    if (!phone) {
        console.warn("[BotNotifier] Número de teléfono vacío — mensaje no enviado")
        return { ok: false, error: "phone vacío" }
    }

    try {
        const res = await fetch(`${BOT_URL}/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(BOT_SECRET ? { "x-bot-secret": BOT_SECRET } : {}),
            },
            body: JSON.stringify({ phone, message }),
            signal: AbortSignal.timeout(8000),
        })

        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            console.error("[BotNotifier] Error del bot:", res.status, body)
            return { ok: false, error: body.error ?? `HTTP ${res.status}` }
        }

        return { ok: true }
    } catch (err) {
        console.error("[BotNotifier] Error al contactar bot:", err?.message ?? err)
        return { ok: false, error: err?.message ?? "Error desconocido" }
    }
}

/**
 * Construye el mensaje de notificación de link de descarga listo.
 * La URL va sola en su línea para que WhatsApp la convierta en link clickeable.
 */
export function buildDownloadReadyMessage({ clientName, galleryTitle, downloadUrl, expiresAt }) {
    const expiry = expiresAt
        ? new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: process.env.TZ || "America/Argentina/Buenos_Aires",
        }).format(new Date(expiresAt))
        : null

    const text = (
        `✅ *¡Hola ${clientName}! Tu pedido fue aprobado.*\n\n` +
        `📸 *${galleryTitle}*\n\n` +
        `Ya podés descargar tus fotos desde el siguiente enlace:` +
        (expiry ? `\n\n⏰ _El enlace vence el ${expiry}._` : "")
    )

    // Devolvemos array — cada elemento se envía como mensaje separado.
    // La URL va sola en su propio mensaje para que WhatsApp la convierta en link clickeable.
    return [text, downloadUrl]
}