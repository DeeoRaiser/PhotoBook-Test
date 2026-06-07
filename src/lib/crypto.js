import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey() {
    const keyHex = process.env.ENCRYPTION_KEY
    if (!keyHex || keyHex.length !== 64) {
        throw new Error(
            "ENCRYPTION_KEY debe ser una clave hex de 64 caracteres (32 bytes). " +
            "Generá una con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        )
    }
    return Buffer.from(keyHex, "hex")
}

export function encrypt(text) {
    const key = getKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(stored) {
    const key = getKey()
    const [ivHex, tagHex, encryptedHex] = stored.split(":")
    const iv = Buffer.from(ivHex, "hex")
    const tag = Buffer.from(tagHex, "hex")
    const encrypted = Buffer.from(encryptedHex, "hex")
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}