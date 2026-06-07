import crypto from "crypto"

export function normalizePhone(value = "") {
  return String(value)
    .trim()
    .replace(/@s\.whatsapp\.net$/i, "")
    .replace(/@c\.us$/i, "")
    .replace(/\D/g, "")
}

export function phonesMatch(incomingPhone, storedPhone) {
  const incoming = normalizePhone(incomingPhone)
  const stored = normalizePhone(storedPhone)

  if (!incoming || !stored) return false
  if (incoming === stored) return true

  // WhatsApp suele enviar el número con código de país. Esta comparación tolera
  // diferencias habituales de prefijo mientras evita coincidencias demasiado cortas.
  const minComparableLength = 8
  return (
    incoming.length >= minComparableLength &&
    stored.length >= minComparableLength &&
    (incoming.endsWith(stored) || stored.endsWith(incoming))
  )
}

export function extractOrderCode(message = "") {
  const text = String(message).trim()

  const labelledMatch = text.match(/(?:pedido|orden|order|n[°ºo]?|#)\s*[:#\-]?\s*([a-z0-9_-]{5,})/i)
  if (labelledMatch?.[1]) return labelledMatch[1].trim()

  const numericMatch = text.match(/\b\d{5,12}\b/)
  if (numericMatch?.[0]) return numericMatch[0]

  const cuidLikeMatch = text.match(/\b[a-z][a-z0-9]{12,}\b/i)
  if (cuidLikeMatch?.[0]) return cuidLikeMatch[0]

  return null
}

export async function generateUniqueOrderCode(prisma, length = 6) {
  const min = 10 ** (length - 1)
  const range = 9 * min

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = String(min + crypto.randomInt(range))
    const existing = await prisma.order.findUnique({ where: { whatsappCode: code } })
    if (!existing) return code
  }

  return crypto.randomBytes(5).toString("hex").toUpperCase()
}

export function buildWhatsAppOrderMessage(orderCode) {
  return `Solicito las fotos del pedido N° ${orderCode}`
}

export function buildWhatsAppDeepLink(phone, message) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
