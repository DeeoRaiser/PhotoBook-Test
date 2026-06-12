# Migración a Suscripciones Recurrentes — MercadoPago

## ¿Qué cambia?

| Antes | Ahora |
|-------|-------|
| Preference (pago único) | Preapproval (suscripción recurrente) |
| El fotógrafo paga manualmente cada mes | MercadoPago debita automáticamente |
| Webhook `payment` | Webhooks `subscription_preapproval` + `subscription_authorized_payment` |
| Sin campo `mpSubscriptionId` | Campo `mpSubscriptionId` en `Subscription` + tabla `SubscriptionPayment` |

---

## Paso 1 — Actualizar el schema de Prisma

En `prisma/schema.prisma`, hacer estos dos cambios:

### 1a. Agregar campo al modelo `Subscription`
```prisma
model Subscription {
  // ... campos existentes ...
  mpSubscriptionId  String?             // ← AGREGAR ESTA LÍNEA
  payments          SubscriptionPayment[] // ← AGREGAR ESTA LÍNEA
}
```

### 1b. Agregar nuevo modelo al final del schema
```prisma
model SubscriptionPayment {
  id              String       @id @default(cuid())
  subscriptionId  String
  mpInvoiceId     String       @unique
  mpPreapprovalId String
  amount          Decimal      @db.Decimal(10, 2)
  currency        String       @default("ARS")
  status          String       @default("approved")
  paidAt          DateTime
  createdAt       DateTime     @default(now())
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId])
  @@index([mpInvoiceId])
}
```

Luego correr la migración:
```bash
npx prisma migrate dev --name add_mp_subscription
npx prisma generate
```

---

## Paso 2 — Reemplazar los archivos

Copiar los archivos de esta carpeta a sus destinos:

| Archivo fuente | Destino en el proyecto |
|----------------|----------------------|
| `checkout-route.js` | `src/app/api/photographer/subscription/checkout/route.js` |
| `webhook-route.js` | `src/app/api/webhooks/mp-subscription/route.js` |
| `cancel-route.js` | `src/app/api/photographer/subscription/cancel/route.js` ← **NUEVO** |
| `subscription-page.js` | `src/app/(dashboard)/dashboard/subscription/page.js` |
| `PlanCard.js` | `src/components/planes/PlanCard.js` |

---

## Paso 3 — Configurar webhooks en MercadoPago

En el panel de MP (Desarrolladores → Webhooks), registrar el endpoint:
```
https://tudominio.com/api/webhooks/mp-subscription
```

Marcar los eventos:
- ✅ `subscription_preapproval`
- ✅ `subscription_authorized_payment`
- ✅ `payment` (para compatibilidad con pagos únicos existentes)

---

## Flujo completo

```
Fotógrafo elige plan
        ↓
POST /api/photographer/subscription/checkout
        ↓
Crea "preapproval" en MP → guarda mpSubscriptionId con status SUSPENDED
        ↓
Redirige a mp.init_point (página de MP para aceptar la suscripción)
        ↓
Fotógrafo acepta en MP
        ↓
MP envía webhook: subscription_preapproval (status: authorized)
        ↓
handlePreapproval() → Subscription status = ACTIVE, autoRenew = true
        ↓
Cada mes: MP cobra automáticamente
        ↓
MP envía webhook: subscription_authorized_payment
        ↓
handleAuthorizedPayment() → extiende expiresAt + crea SubscriptionPayment
```

---

## Flujo de cancelación

```
Fotógrafo hace clic en "Cancelar suscripción"
        ↓
Modal de confirmación
        ↓
POST /api/photographer/subscription/cancel
        ↓
PUT /preapproval/{id} { status: "cancelled" } → MP no cobra más
        ↓
Subscription status = CANCELLED, autoRenew = false
        ↓
El fotógrafo conserva acceso hasta expiresAt
```

---

## Compatibilidad hacia atrás

Los fotógrafos con suscripciones antiguas (pago único) siguen funcionando normalmente:
- `autoRenew = false` en su suscripción
- Al vencer, ven el botón "Reactivar suscripción" → los lleva al nuevo flujo recurrente
- El webhook de `payment` sigue siendo procesado (función `handleLegacyPayment`)

---

## Variables de entorno necesarias

Las mismas que ya tenés — no se necesitan variables nuevas:
```env
MP_ACCESS_TOKEN=APP_USR-...
NEXTAUTH_URL=https://tudominio.com
```

---

## Notas importantes

- **Sandbox**: En desarrollo, MP no envía webhooks automáticamente. Podés testear manualmente usando la API de MP con tokens de sandbox.
- **El preapproval tiene su propia URL de checkout** (`init_point`), distinta a las Preferences. Es la página donde el usuario acepta que MP le cobre mensualmente.
- **Sin doble cobro**: Si el fotógrafo ya tiene una suscripción MP activa y elige un nuevo plan, el checkout cancela la anterior automáticamente antes de crear la nueva.
