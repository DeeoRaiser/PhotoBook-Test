import "dotenv/config"
import qrcode from "qrcode-terminal"
import { addKeyword, createBot, createFlow, createProvider, EVENTS, MemoryDB } from "@builderbot/bot"
import { BaileysProvider } from "@builderbot/provider-baileys"
import { fetchLatestWaWebVersion } from "@whiskeysockets/baileys"
import { prisma } from "./prisma.mjs"
import { extractOrderCode, getSenderPhone, phonesMatch, buildDownloadUrl } from "./utils.mjs"

const PORT = Number(process.env.WHATSAPP_BOT_PORT || 3008)
const USE_PAIRING_CODE = process.env.WHATSAPP_BOT_USE_PAIRING_CODE === "true"
const PHONE_NUMBER = process.env.WHATSAPP_BOT_PHONE_NUMBER

const orderFlow = addKeyword(EVENTS.WELCOME).addAction(async (ctx, { flowDynamic }) => {
    const code = extractOrderCode(ctx.body)

    if (!code) {
        await flowDynamic(
            "👋 Hola! Para recuperar tus fotos, enviame un mensaje con el formato:\n\n" +
            "*Solicito las fotos del pedido N° ABC123*\n\n" +
            "Podés encontrar el código en el correo de confirmación de tu compra."
        )
        return
    }

    try {
        const order = await prisma.order.findFirst({
            where: { OR: [{ whatsappCode: code }, { id: code }] }
        })

        if (!order) {
            await flowDynamic("❌ No encontramos ningún pedido con ese código. Verificá que sea correcto e intentá de nuevo.")
            return
        }

        const senderPhone = getSenderPhone(ctx)
        if (!phonesMatch(senderPhone, order.clientPhone)) {
            await flowDynamic("❌ El número desde el que escribís no coincide con el registrado en el pedido.")
            return
        }

        const isPaid =
            order.status === "PAID" ||
            order.status === "DELIVERED" ||
            order.mpStatus === "approved"

        if (!isPaid) {
            await flowDynamic("⏳ Tu pedido existe pero todavía no figura como pagado. Si ya abonaste, esperá unos minutos y volvé a intentarlo.")
            return
        }

        if (!order.downloadToken) {
            await flowDynamic("⚠️ Tu pedido está aprobado pero el enlace de descarga todavía se está generando. Intentá en unos minutos.")
            return
        }

        const url = buildDownloadUrl(order.downloadToken)
        if (!url) {
            await flowDynamic("⚠️ No pude construir el enlace de descarga. Verificá que NEXTAUTH_URL esté configurado correctamente.")
            return
        }

        await flowDynamic(
            `✅ *¡Pedido verificado!*\n\n` +
            `Podés descargar tus fotos desde el siguiente enlace:\n\n` +
            `📎 ${url}\n\n` +
            `_El enlace tiene vigencia limitada. Si venció, volvé a escribirnos._`
        )
    } catch (e) {
        console.error("[WhatsAppBot] Error al consultar DB:", e)
        await flowDynamic("⚠️ Ocurrió un error interno. Por favor intentá de nuevo en unos minutos.")
    }
})

async function main() {
    console.log("[WhatsAppBot] Iniciando...")

    // Obtener la versión actual del protocolo de WhatsApp Web en tiempo real.
    // Esto evita el error 405 que ocurre cuando la versión hardcodeada en Baileys queda obsoleta.
    console.log("[WhatsAppBot] Consultando versión actual de WhatsApp Web...")
    const { version, isLatest } = await fetchLatestWaWebVersion()
    console.log(`[WhatsAppBot] Versión WA Web: ${version.join(".")} ${isLatest ? "(latest)" : "(fallback - puede causar 405)"}`)

    const providerConfig = {
        version,
        // Fingerprint de browser no-Windows — evita rechazo por plataforma
        browser: ["Ubuntu", "Chrome", "125.0.0.0"],
    }

    if (USE_PAIRING_CODE) {
        if (!PHONE_NUMBER) {
            throw new Error("WHATSAPP_BOT_USE_PAIRING_CODE=true requiere WHATSAPP_BOT_PHONE_NUMBER en .env")
        }
        providerConfig.usePairingCode = true
        providerConfig.phoneNumber = PHONE_NUMBER
        console.log(`[WhatsAppBot] Modo pairing code activado para ${PHONE_NUMBER}`)
    } else {
        console.log("[WhatsAppBot] Modo QR. Esperá el código en la terminal...")
    }

    const adapterProvider = createProvider(BaileysProvider, providerConfig)

    adapterProvider.on("require_action", ({ payload }) => {
        if (payload?.qr) {
            console.log("\n📱 Escaneá este QR con WhatsApp → Dispositivos vinculados → Vincular dispositivo:\n")
            qrcode.generate(payload.qr, { small: true })
            console.log("\n⏳ El QR se actualiza cada ~60 segundos.\n")
        }
    })

    adapterProvider.on("ready", () => {
        console.log("[WhatsAppBot] ✅ Conectado a WhatsApp correctamente.")
    })

    adapterProvider.on("auth_failure", (msg) => {
        console.error("[WhatsAppBot] ❌ Error de autenticación:", msg)
        console.error("[WhatsAppBot] Si el error es 405, la versión de WA Web cambió. Reiniciá el bot para obtener la nueva versión.")
    })

    const bot = await createBot({
        flow: createFlow([orderFlow]),
        provider: adapterProvider,
        database: new MemoryDB(),
    })

    bot.httpServer(PORT)
    console.log(`[WhatsAppBot] Servidor HTTP interno en http://localhost:${PORT}`)

    // Mantener el proceso vivo explícitamente.
    // Necesario porque si el proveedor falla antes de que el servidor HTTP inicie,
    // Node no tiene handles activos y cierra el proceso.
    process.stdin.resume()
}

main().catch((err) => {
    console.error("[WhatsAppBot] Error fatal al iniciar:", err)
    process.exit(1)
})
