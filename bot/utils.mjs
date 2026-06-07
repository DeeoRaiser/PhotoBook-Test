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

export function getSenderPhone(ctx) {
  return normalizePhone(ctx?.from || ctx?.key?.participant || ctx?.key?.remoteJid || "")
}

export function getBaseUrl() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.PUBLIC_APP_URL
  return baseUrl?.replace(/\/$/, "")
}

export function buildDownloadUrl(downloadToken) {
  const baseUrl = getBaseUrl()
  if (!baseUrl || !downloadToken) return null
  return `${baseUrl}/download/${downloadToken}`
}

export function formatDateTime(date) {
  if (!date) return ""
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: process.env.TZ || "America/Argentina/Buenos_Aires",
  }).format(new Date(date))
}

export function buildWhatsAppOrderMessage(orderCode) {
  return `Solicito las fotos del pedido N° ${orderCode}`
}

export function buildWhatsAppDeepLink(phone, message) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
