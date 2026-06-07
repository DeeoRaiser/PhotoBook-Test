// node scripts/create-admin.js admin@admin.com 123456 "Admin"

import { PrismaClient } from "../src/generated/prisma/index.js"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 10000,
})

const prisma = new PrismaClient({
    adapter,
})

async function main() {
    const email = process.argv[2]
    const password = process.argv[3]
    const name = process.argv[4] || "Admin"

    if (!email || !password) {
        console.log(
            'Uso: node scripts/create-admin.js admin@admin.com 123456 "Admin"'
        )
        process.exit(1)
    }

    const exists = await prisma.adminUser.findUnique({
        where: { email },
    })

    if (exists) {
        console.log("⚠️ Ya existe un admin con ese email")
        process.exit(1)
    }

    const hashed = await bcrypt.hash(password, 12)

    const admin = await prisma.adminUser.create({
        data: {
            name,
            email,
            password: hashed,
        },
    })

    console.log(`✅ Admin creado: ${admin.email}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })