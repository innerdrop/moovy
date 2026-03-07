# Plan de Integracion MercadoPago — Moovy Marketplace

---

## 1. ESTADO ACTUAL DEL CHECKOUT

### 1.1 Flujo de pago en efectivo (unico metodo activo)

El checkout es un formulario de 3 pasos en `src/app/(store)/checkout/page.tsx` (839 lineas):

| Paso | Que hace |
|------|----------|
| **1. Envio** | Elige entre "Envio a domicilio" o "Retiro en local". Si es envio, selecciona o crea direccion con autocomplete de Google Maps. |
| **2. Costo de envio** | Llama a `POST /api/delivery/calculate` con la direccion y el merchant. Retorna `distanceKm`, `totalCost`, `isFreeDelivery`. Solo se muestra si es envio a domicilio. |
| **3. Pago** | Widget de puntos MOOVER (descuento hasta 15% del subtotal). Seleccion de metodo de pago. Boton "Confirmar Pedido". |

Al confirmar, el frontend arma el payload y hace `POST /api/orders`:

```
checkout/page.tsx  ->  POST /api/orders  ->  Order + SubOrders + OrderItems
                                          ->  Decrementa stock
                                          ->  Procesa puntos (earn + redeem)
                                          ->  Socket emit a cada vendedor + admin
                                          ->  Email de confirmacion
                                          ->  Redirect a /mis-pedidos
```

El `paymentStatus` queda en `"PENDING"` siempre. No hay flujo que lo cambie a `"PAID"` automaticamente — todo es manual por admin.

### 1.2 Boton de MP deshabilitado

En `checkout/page.tsx` lineas 725-740:

```tsx
<label className="... opacity-50 ...">
  <input type="radio" value="mercadopago" disabled className="sr-only" />
  <span>Mercado Pago</span>
  <p>Proximamente...</p>
</label>
```

- El `<input>` tiene `disabled` + `className="sr-only"` (oculto visualmente)
- El `<label>` tiene `opacity-50` para indicar que no esta disponible
- El state permite `"cash" | "mercadopago"` pero solo cash es seleccionable
- En `src/lib/validations.ts` L38 el schema Zod acepta `["cash", "transfer", "card"]` — no incluye `"mercadopago"`

### 1.3 Estructura de SubOrders por vendedor

El cart (Zustand, `src/store/cart.ts`) agrupa items con `groupByVendor()`:

```
CartItem { merchantId?, sellerId?, type: "product" | "listing" }
    |
    v
VendorGroup { vendorId: "merchant_xxx" | "seller_xxx", vendorType, items[], subtotal }
```

En `POST /api/orders` (lineas 202-251), por cada grupo se crea un `SubOrder`:

```
Order (total global)
  |-- SubOrder (merchantId=X, subtotal=150, moovyCommission=12, sellerPayout=138)
  |-- SubOrder (sellerId=Y,   subtotal=80,  moovyCommission=8,  sellerPayout=72)
  |-- SubOrder (merchantId=Z, subtotal=200, moovyCommission=16, sellerPayout=184)
```

### 1.4 Calculo y distribucion del total

```
subtotal = sum(item.price * item.quantity)
deliveryFee = /api/delivery/calculate result (o 0 si pickup/free)
discount = puntos MOOVER aplicados
total = subtotal + deliveryFee - discount
```

Comisiones por grupo:
- **Merchant**: `commissionRate` del modelo Merchant (default 8%)
- **Seller**: hardcoded 10% en `api/orders/route.ts` L222-224

```
moovyCommission = groupSubtotal * (rate / 100)
sellerPayout    = groupSubtotal - moovyCommission
```

El campo `commissionPaid` (Boolean) existe en Order pero **nunca se actualiza** en ningun endpoint — es solo placeholder.

---

## 2. QUE NECESITA MP PARA ESTE PROYECTO

### 2.1 Marketplace con split de pagos

MercadoPago ofrece la **Marketplace API** (anteriormente "Split payments") que permite:

- **Un pago del comprador** que se divide automaticamente entre multiples vendedores
- **Moovy como marketplace** (Application owner) cobra comision en cada transaccion
- Cada vendedor debe tener una **cuenta MP vinculada** via OAuth

Modelo MP Marketplace:
```
Comprador paga $430 via MP
  |
  v
MP retiene y distribuye:
  -> Merchant A: $138 (subtotal $150 - 8% comision)
  -> Seller B:   $72  (subtotal $80 - 10% comision)
  -> Merchant C: $184 (subtotal $200 - 8% comision)
  -> Moovy:      $36  (sum de comisiones)
```

### 2.2 Flujo completo: preference -> pago -> webhook -> confirmacion

```
1. CHECKOUT: usuario elige MP y confirma
   |
2. Backend crea Order con status="AWAITING_PAYMENT", paymentStatus="PENDING"
   Stock decrementado (reservado)
   |
3. Backend llama MP API -> crea Preference con:
   - items[] (del carrito)
   - marketplace_fee (comision Moovy)
   - back_urls (success, failure, pending)
   - notification_url (webhook)
   - metadata: { orderId, orderNumber }
   |
4. Frontend recibe preference.init_point -> redirige a MP Checkout
   |
5. Usuario paga en MP (tarjeta, debito, MP wallet, etc)
   |
6. MP redirige al usuario a back_url (success/failure/pending)
   |
7. MP envia webhook POST /api/webhooks/mercadopago
   -> Verifica firma HMAC
   -> Consulta GET /v1/payments/{id} para confirmar status
   -> Si approved: Order.paymentStatus = "PAID", status = "CONFIRMED"
   -> Si rejected: Order.paymentStatus = "FAILED", restaurar stock
   -> Si pending:  no cambiar nada, esperar siguiente webhook
   |
8. Socket emit a merchant/seller + admin con status actualizado
```

### 2.3 Requisitos de MP para Argentina

- Cuenta MP de Moovy como "Marketplace Application"
- Cada vendedor/merchant vinculado via OAuth (MP requiere esto para split)
- Access Token de la aplicacion (server-side) + Public Key (client-side)
- Webhook secret para validar notificaciones
- Moneda: ARS

---

## 3. MODELOS DE BD A AGREGAR O MODIFICAR

### 3.1 SellerProfile — campos MP nuevos

```prisma
// Agregar a model SellerProfile:
mpAccessToken     String?   // OAuth token del vendedor (encriptado)
mpRefreshToken    String?   // Para renovar el access token
mpUserId          String?   @unique  // MP user ID del vendedor
mpEmail           String?   // Email de la cuenta MP vinculada
mpLinkedAt        DateTime? // Cuando se vinculo
```

Estado actual del modelo (`prisma/schema.prisma`):
- Ya tiene `bankAlias` y `bankCbu` para pagos bancarios
- `commissionRate` Float default 12 — ya existe
- Falta todo lo de MP

### 3.2 Merchant — campos MP nuevos

```prisma
// Agregar a model Merchant:
mpAccessToken     String?
mpRefreshToken    String?
mpUserId          String?   @unique
mpEmail           String?
mpLinkedAt        DateTime?
```

Estado actual: tiene `bankAccount`, `cuit`, `cuil`, `businessName` — solo bancario.

### 3.3 Order — campos a agregar

```prisma
// Agregar a model Order:
mpPreferenceId    String?   // ID de la Preference de MP
mpPaymentId       String?   // ID del Payment aprobado
mpMerchantOrderId String?   // ID del Merchant Order de MP
mpStatus          String?   // "approved", "rejected", "pending", "in_process"
paidAt            DateTime? // Timestamp de cuando se confirmo el pago
```

El campo `paymentId` (String?) ya existe pero nunca se usa — se puede reutilizar como `mpPaymentId` o mantener ambos.

### 3.4 SubOrder — campos a agregar

```prisma
// Agregar a model SubOrder:
mpTransferId      String?   // ID de la transferencia MP al vendedor
payoutStatus      String    @default("PENDING")  // PENDING, TRANSFERRED, FAILED
paidOutAt         DateTime?
```

### 3.5 Tabla nueva: Payment (log de transacciones)

```prisma
model Payment {
  id              String   @id @default(cuid())
  orderId         String
  mpPaymentId     String   @unique  // ID externo de MP
  mpStatus        String   // "approved", "rejected", "pending", etc
  mpStatusDetail  String?  // "accredited", "pending_contingency", etc
  amount          Float
  currency        String   @default("ARS")
  payerEmail      String?
  paymentMethod   String?  // "credit_card", "debit_card", "account_money", etc
  rawPayload      Json?    // Payload completo del webhook (para debug)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  order           Order    @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([mpPaymentId])
}
```

### 3.6 Tabla nueva: MpWebhookLog (idempotencia de webhooks)

```prisma
model MpWebhookLog {
  id          String   @id @default(cuid())
  eventId     String   @unique  // x-request-id de MP para idempotencia
  eventType   String   // "payment", "merchant_order", etc
  resourceId  String   // ID del recurso (payment ID)
  processed   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([resourceId])
}
```

---

## 4. ENDPOINTS A CREAR

### 4.1 Pagos

| Metodo | Ruta | Funcion |
|--------|------|---------|
| `POST` | `/api/payments/preference` | Crea MP Preference con items, fees, back_urls. Retorna `{ preferenceId, initPoint }` |
| `POST` | `/api/webhooks/mercadopago` | Recibe notificaciones de MP. Valida HMAC. Actualiza Order/Payment. Emite socket. |
| `GET`  | `/api/payments/[orderId]/status` | Consulta estado de pago de una orden (para polling desde frontend). |

### 4.2 Vinculacion de cuentas MP (OAuth)

| Metodo | Ruta | Funcion |
|--------|------|---------|
| `GET`  | `/api/mp/connect` | Genera URL de OAuth de MP y redirige al vendedor/merchant para vincular su cuenta |
| `GET`  | `/api/mp/callback` | Callback de OAuth. Recibe `code`, intercambia por `access_token`, guarda en SellerProfile/Merchant |
| `POST` | `/api/mp/disconnect` | Desvincula cuenta MP (limpia tokens) |
| `GET`  | `/api/mp/status` | Retorna si el vendedor/merchant tiene cuenta MP vinculada |

### 4.3 Admin/Ops

| Metodo | Ruta | Funcion |
|--------|------|---------|
| `GET`  | `/api/admin/payments` | Lista pagos con filtros (status, fecha, vendedor). Para panel ops. |
| `POST` | `/api/admin/payments/[id]/refund` | Inicia reembolso via MP API |

### 4.4 Modificaciones a endpoints existentes

| Endpoint | Cambio |
|----------|--------|
| `POST /api/orders` | Si `paymentMethod === "mercadopago"`: no confirmar orden, dejarla en `AWAITING_PAYMENT`. Crear Preference. Retornar `initPoint`. |
| `PATCH /api/orders/[id]` | Permitir transicion `AWAITING_PAYMENT -> CONFIRMED` (via webhook) o `AWAITING_PAYMENT -> CANCELLED` (timeout/rechazo) |
| `DELETE /api/orders/[id]` | Si `paymentStatus === "PAID"`, no permitir cancel directo — requiere refund primero |

### 4.5 Validaciones

| Archivo | Cambio |
|---------|--------|
| `src/lib/validations.ts` | Agregar `"mercadopago"` al enum de `paymentMethod` |

---

## 5. PLAN DE IMPLEMENTACION

Dividido en 5 prompts ejecutables de menor a mayor riesgo. Cada uno es autonomo y deployable.

### Prompt 1: Schema + Migracion (riesgo: bajo)
> **Rama:** `feat/mp-schema`

- Agregar campos MP a `SellerProfile` y `Merchant` en schema.prisma
- Agregar campos MP a `Order` y `SubOrder`
- Crear modelos `Payment` y `MpWebhookLog`
- Agregar `"mercadopago"` al enum en `validations.ts`
- Agregar `"AWAITING_PAYMENT"` como status valido en Order
- Ejecutar `npx prisma migrate dev`
- Verificar con `npx tsc --noEmit`

**No rompe nada**: solo agrega campos opcionales y tablas nuevas.

### Prompt 2: Lib MP + Preference (riesgo: bajo)
> **Rama:** `feat/mp-preference`

- Instalar `mercadopago` SDK (`npm install mercadopago`)
- Crear `src/lib/mercadopago.ts`: inicializacion del SDK, helpers
- Crear `POST /api/payments/preference`: genera Preference con items, marketplace_fee, back_urls, notification_url, metadata
- Crear `GET /api/payments/[orderId]/status`: consulta estado
- Agregar env vars: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`
- Tests unitarios del helper de Preference

**No rompe nada**: endpoints nuevos, no modifica flujo existente.

### Prompt 3: Webhook + Estado de pago (riesgo: medio)
> **Rama:** `feat/mp-webhook`

- Crear `POST /api/webhooks/mercadopago`: validacion HMAC, idempotencia con `MpWebhookLog`, consulta a MP API para confirmar status
- Logica de transicion: `approved` -> Order.paymentStatus="PAID", status="CONFIRMED"; `rejected` -> restaurar stock, status="CANCELLED"
- Crear registro en tabla `Payment` con payload del webhook
- Socket emit a vendedores y admin cuando pago se confirma
- Email de confirmacion de pago al comprador

**Riesgo medio**: modifica estado de ordenes, pero solo para ordenes MP (no afecta cash).

### Prompt 4: Checkout frontend (riesgo: medio)
> **Rama:** `feat/mp-checkout-ui`

- Habilitar boton MP en checkout (quitar `disabled`, `opacity-50`)
- Si `paymentMethod === "mercadopago"`: al confirmar, llamar a `/api/payments/preference` en vez de crear orden directamente
- Modificar `POST /api/orders` para soportar flujo MP: crear orden con `AWAITING_PAYMENT`, decrementar stock, retornar `preferenceId`
- Redirigir a `preference.init_point` (checkout externo de MP)
- Crear pagina `/checkout/mp-return` para manejar back_urls (success/failure/pending)
- Polling de `/api/payments/[orderId]/status` en la pagina de retorno
- Mostrar estado de pago en `/mis-pedidos/[orderId]`

**Riesgo medio**: modifica flujo de checkout pero cash sigue funcionando igual.

### Prompt 5: OAuth vendedores + Split (riesgo: alto)
> **Rama:** `feat/mp-oauth-split`

- Crear flujo OAuth: `/api/mp/connect`, `/api/mp/callback`, `/api/mp/disconnect`
- UI en dashboard de vendedor/merchant para vincular cuenta MP
- Modificar creacion de Preference para incluir `marketplace_fee` y `collector_id` por cada vendedor vinculado
- Logica de split: distribuir pago entre vendedores segun SubOrders
- Fallback: si vendedor no tiene MP vinculado, pago va completo a Moovy (se paga manualmente despues)
- Panel ops: ver estado de vinculacion MP de cada vendedor

**Riesgo alto**: requiere cuentas MP reales, OAuth flow, y manejo de tokens sensibles. Testear en sandbox primero.

---

## Archivos clave del proyecto referenciados

| Archivo | Relevancia |
|---------|------------|
| `src/app/(store)/checkout/page.tsx` | Checkout UI, boton MP deshabilitado |
| `src/app/api/orders/route.ts` | POST: creacion de orden, SubOrders, comisiones |
| `src/store/cart.ts` | Zustand cart con groupByVendor() |
| `prisma/schema.prisma` | Order, SubOrder, Merchant, SellerProfile |
| `src/lib/validations.ts` | Schema Zod de paymentMethod |
| `src/lib/email.ts` | Labels de metodo de pago en emails |
| `src/app/api/orders/[id]/route.ts` | PATCH: transiciones de status |
| `src/next.config.ts` | CSP ya permite `api.mercadopago.com` |
