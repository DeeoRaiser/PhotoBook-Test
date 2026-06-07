import { PrismaClient } from "@/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  //ssl: { rejectUnauthorized: false },
  // Render cierra conexiones idle después de pocos segundos
  // idleTimeoutMillis: 0 le dice al pool que no expire conexiones
  max: 5,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
})

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}