-- Migration: agregar campos para suscripciones recurrentes de MercadoPago
-- Archivo: prisma/migrations/XXXX_add_mp_subscription/migration.sql
-- (Prisma genera este archivo automáticamente con `prisma migrate dev`)

-- Agregar mpSubscriptionId a Subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "mpSubscriptionId" TEXT;

-- Tabla de historial de pagos de suscripción
CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "subscriptionId"  TEXT NOT NULL,
    "mpInvoiceId"     TEXT NOT NULL UNIQUE,
    "mpPreapprovalId" TEXT NOT NULL,
    "amount"          DECIMAL(10,2) NOT NULL,
    "currency"        TEXT NOT NULL DEFAULT 'ARS',
    "status"          TEXT NOT NULL DEFAULT 'approved',
    "paidAt"          TIMESTAMP(3) NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_mpInvoiceId_idx" ON "SubscriptionPayment"("mpInvoiceId");
