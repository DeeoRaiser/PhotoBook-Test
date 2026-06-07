# Feature: Versión Imprimible

Permite que los fotógrafos ofrezcan fotos para imprimir, controlado por plan.

## Archivos modificados (15 archivos)

```
prisma/
  schema.prisma

src/
  app/
    admin/(panel)/plans/
      page.js
    api/
      admin/plans/
        route.js
        [id]/route.js
      galleries/
        route.js
        [id]/route.js
        [id]/photos/route.js
      orders/
        route.js
    (dashboard)/dashboard/galleries/
      new/
        page.js
        NewGalleryForm.js
      [id]/
        page.js
  components/
    photo-card.js
    cart-drawer.js
    checkout-modal.js
  lib/
    cart.js
```

## Pasos para implementar

### 1. Reemplazar los archivos
Copiar cada archivo de este zip a su ruta correspondiente en el proyecto,
respetando la estructura de carpetas.

### 2. Migración de base de datos
```bash
npx prisma migrate dev --name add_printable_feature
```

Esto agrega a la DB:
- `Plan.allowsPrintable` (Boolean, default false)
- `Gallery.printableEnabled` (Boolean, default false)
- `Photo.printPrice` (Decimal, nullable)
- `OrderItem.itemType` (String, default "digital")
- `OrderItem.printPrice` (Decimal, nullable)

### 3. Activar en un plan (desde el panel de admin)
1. Ir a `/admin/plans`
2. Editar el plan deseado
3. Activar el toggle naranja **"Versión Imprimible"**
4. Guardar

### 4. Usar como fotógrafo
1. Crear una nueva galería → aparece la card "Versión Imprimible"
2. Activar la opción "Digital + Impresión"
3. Al subir fotos → ingresar **Precio digital** y **Precio impresión** por separado

### 5. Flujo del cliente (vista pública)
- Las fotos con `printPrice` muestran el botón **"Elegir formato"**
- Se abre un selector con 3 opciones:
  - Solo digital (precio normal)
  - Solo impresión (precio de impresión)
  - Digital + impresión (suma de ambos)
- El carrito y checkout muestran el tipo de cada ítem con badge de color

## Notas importantes
- El precio se **recalcula server-side** en `/api/orders` para evitar manipulación desde el cliente
- El `itemType` y `printPrice` se guardan como snapshot en `OrderItem` para preservar el historial
- Los ítems de MercadoPago incluyen el sufijo `(Impresión)` o `(Digital + Impresión)` en el título
