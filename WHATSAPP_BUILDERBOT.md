# Implementación de BuilderBot con Baileys para entrega de fotos por WhatsApp

**Autor:** Manus AI  
**Proyecto:** PhotoBook  
**Fecha:** 2026-06-05

## Resumen ejecutivo

Se incorporó un proceso independiente de **BuilderBot con Baileys** para que los clientes puedan solicitar por WhatsApp las fotos HD de un pedido ya pagado. La implementación valida el número o código de pedido recibido, consulta la misma base de datos PostgreSQL del proyecto mediante Prisma, compara el teléfono del remitente con el teléfono registrado en el checkout y comprueba que el pago esté aprobado antes de entregar el acceso. BuilderBot provee la abstracción de flujos conversacionales y el proveedor Baileys permite conectarse a WhatsApp Web sin Selenium ni Chromium, según la documentación oficial de BuilderBot.[1] [2]

> La estrategia elegida prioriza enviar un **enlace temporal de descarga** ya compatible con el endpoint existente de la aplicación. Opcionalmente, el bot puede intentar enviar archivos por WhatsApp cuando `WHATSAPP_BOT_DELIVERY_MODE=media` y la cantidad de fotos no supera `WHATSAPP_BOT_MAX_DIRECT_FILES`.

## Flujo funcional implementado

El flujo queda alineado con el proceso solicitado: el cliente compra, el sistema genera un mensaje predefinido, el cliente lo envía al WhatsApp conectado, el bot valida pedido, teléfono y estado de pago, y finalmente entrega un enlace temporal o informa el motivo de rechazo. Baileys opera como un dispositivo vinculado de WhatsApp Web y no como WhatsApp Business Cloud API, por lo que el bot debe mantenerse ejecutándose en un proceso persistente.[3]

| Paso | Componente | Resultado |
| --- | --- | --- |
| Compra creada | `src/app/api/orders/route.js` | Se genera `whatsappCode` único y se devuelve `whatsappMessage` / `whatsappLink`. |
| Pago aprobado | Webhook o confirmación existente | Se mantiene la lógica actual de `downloadToken` y vencimiento temporal. |
| Mensaje entrante | `bot/index.mjs` | BuilderBot captura cualquier mensaje inicial mediante `EVENTS.WELCOME`. |
| Extracción | `bot/utils.mjs` | Se detecta el código desde mensajes como `Solicito las fotos del pedido N° ABC123`. |
| Validación | `bot/index.mjs` + Prisma | Se valida existencia, teléfono y pago aprobado. |
| Entrega | Endpoint `/download/{token}` | Se envía URL temporal o archivos directos si está configurado. |

## Archivos agregados o modificados

| Archivo | Cambio principal |
| --- | --- |
| `bot/index.mjs` | Proceso principal de BuilderBot/Baileys con validación de pedidos y entrega de fotos. |
| `bot/prisma.mjs` | Cliente Prisma para el proceso independiente del bot, usando el adapter PostgreSQL. |
| `bot/utils.mjs` | Normalización de teléfonos, extracción de código y construcción de URL de descarga. |
| `src/lib/whatsapp-orders.js` | Generación de códigos únicos y enlaces `wa.me` con mensaje predefinido. |
| `prisma/schema.prisma` | Nuevo campo `whatsappCode` único en `Order`. |
| `src/app/api/orders/route.js` | La creación de pedidos asigna código de WhatsApp y devuelve mensaje/enlace. |
| `src/app/api/orders/[id]/status/route.js` | La pantalla de éxito puede consultar `whatsappCode`, `whatsappMessage` y `whatsappLink`. |
| `src/components/paymentSuccessPage.js` | Botón para solicitar fotos por WhatsApp tras Mercado Pago. |
| `src/components/checkout-modal.js` | Muestra código y enlace de WhatsApp para pedidos manuales o transferencia. |
| `.env.whatsapp.example` | Plantilla de variables necesarias para operar el bot. |
| `package.json` | Scripts `bot:dev` y `bot:start`; dependencias `@builderbot/bot` y `@builderbot/provider-baileys`. |

## Variables de entorno

Copiar `.env.whatsapp.example` como referencia y completar estos valores en el entorno real. No se deben versionar credenciales reales ni tokens privados.

| Variable | Uso |
| --- | --- |
| `NEXTAUTH_URL` | Dominio público usado para construir el enlace temporal de descarga. |
| `WHATSAPP_BOT_PHONE_NUMBER` | Número conectado al bot, en formato internacional sin signos ni espacios. |
| `WHATSAPP_BOT_PUBLIC_NUMBER` | Número usado para crear enlaces `wa.me`; si falta, se usa `WHATSAPP_BOT_PHONE_NUMBER`. |
| `WHATSAPP_BOT_PORT` | Puerto HTTP interno del bot; por defecto `3008`. |
| `WHATSAPP_BOT_USE_PAIRING_CODE` | Activa vinculación con código en vez de QR cuando vale `true`. |
| `WHATSAPP_BOT_DELIVERY_MODE` | `link` para enlace temporal; `media` para intentar envío directo de archivos. |
| `WHATSAPP_BOT_MAX_DIRECT_FILES` | Máximo de archivos para envío directo por WhatsApp. |
| `WHATSAPP_BOT_DOWNLOAD_RENEW_HOURS` | Horas de vigencia al renovar un token vencido desde el bot. |
| `WHATSAPP_BOT_DB_POOL_MAX` | Tamaño máximo del pool PostgreSQL del proceso del bot. |

## Instalación y migración

Después de actualizar el proyecto, instalar dependencias y regenerar Prisma. BuilderBot requiere Node.js moderno; la guía oficial indica Node 20 o superior para sus proyectos.[2]

```bash
npm install
npx prisma generate
```

Como se agregó `Order.whatsappCode`, la base de datos debe sincronizarse en el entorno real. En desarrollo puede usarse:

```bash
npx prisma migrate dev --name add_whatsapp_order_code
```

En producción, generar y aplicar la migración siguiendo el flujo habitual del proyecto:

```bash
npx prisma migrate deploy
```

Si existen pedidos previos sin `whatsappCode`, conviene crear un script de backfill antes de exigir la restricción única en producción. Para una base nueva o entornos de desarrollo, Prisma generará la columna nullable y la restricción única de acuerdo con el schema actual.

## Ejecución del bot

Para desarrollo, ejecutar:

```bash
npm run bot:dev
```

Para producción, ejecutar el proceso como servicio persistente:

```bash
npm run bot:start
```

El proceso imprimirá el QR o utilizará pairing code si `WHATSAPP_BOT_USE_PAIRING_CODE=true`. BuilderBot documenta que el proveedor Baileys puede configurarse con `usePairingCode` y `phoneNumber` para vincular el dispositivo.[1]

## Validaciones de seguridad implementadas

El bot no entrega fotos si falta cualquiera de las condiciones exigidas. La comparación de teléfono normaliza dígitos y tolera formatos comunes de Argentina, incluyendo prefijos `54`, `549` y números con o sin característica. La aprobación se considera válida si `Order.status` es `PAID` o `DELIVERED`, o si `mpStatus` es `approved`.

| Validación | Comportamiento si falla |
| --- | --- |
| Código no detectado | Solicita reenviar un mensaje con formato `Solicito las fotos del pedido N° ...`. |
| Pedido inexistente | Informa que no pudo verificar el pedido. |
| Teléfono distinto | Rechaza la entrega porque el remitente no coincide con el teléfono de compra. |
| Pago no aprobado | Informa que el pedido existe pero aún no figura pagado. |
| Token ausente o vencido | Si el pago está aprobado, renueva el token temporal antes de responder. |

## Validaciones realizadas en sandbox

Se realizaron verificaciones técnicas sin iniciar una sesión real de WhatsApp, porque eso requiere escanear QR o vincular el dispositivo del negocio. La compilación de Next.js terminó correctamente, las utilidades de extracción y teléfono pasaron una prueba mínima, y las exportaciones de BuilderBot/Baileys usadas por el código fueron importadas con éxito.

| Verificación | Resultado |
| --- | --- |
| `npm install` | Correcto; instaló BuilderBot y proveedor Baileys. |
| `npx prisma generate` | Correcto; cliente generado con el nuevo campo. |
| `node --check bot/index.mjs bot/prisma.mjs bot/utils.mjs` | Correcto; sin errores de sintaxis. |
| Prueba de utilidades `extractOrderCode`, `normalizePhone`, `phonesMatch` | Correcta. |
| Prueba de imports de BuilderBot/Baileys | Correcta. |
| `npm run build` | Correcto; Next.js compiló exitosamente. |
| `npm run lint` | Reportó errores preexistentes en componentes no relacionados con la integración. |

## Advertencia sobre Baileys

Durante `npm install`, npm informó una advertencia de seguridad para una versión de `baileys` incluida transitivamente por el proveedor actual. No se forzó `npm audit fix --force` porque puede introducir cambios incompatibles. La recomendación práctica es revisar la actualización del proveedor `@builderbot/provider-baileys` cuando publique una versión que resuelva esa dependencia transitiva o evaluar un override controlado en un entorno de pruebas antes de producción.

## Referencias

[1]: https://www.builderbot.app/providers/baileys "BuilderBot — Baileys Provider"  
[2]: https://www.builderbot.app/quickstart "BuilderBot — Quickstart"  
[3]: https://baileys.wiki/docs/intro "Baileys — Introduction"
