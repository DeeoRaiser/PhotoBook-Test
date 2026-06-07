import { PrismaClient } from "../src/generated/prisma/index.js"
import { PrismaPg } from "@prisma/adapter-pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definido. El bot necesita acceder a la misma base de datos que la app.")
}

const globalForPrisma = globalThis

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.WHATSAPP_BOT_DB_POOL_MAX || 3),
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
})

export const prisma =
  globalForPrisma.whatsappBotPrisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.whatsappBotPrisma = prisma
}
