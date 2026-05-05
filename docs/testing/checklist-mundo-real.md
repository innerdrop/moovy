# Checklist de prueba de mundo real — pre-lanzamiento

> Rama: `chore/seed-mundo-real`. Documento operativo para correr antes del launch.
> Asume que ya corriste `setup-mundo-real.ts --execute` y tenés las 4 cuentas test sembradas.

## Antes de empezar

Tener abiertos:

- **Chrome con 3 perfiles** (Buyer / Driver / Admin) — ver `mock-geolocation.md`
- **Panel Sensors** de DevTools abierto en cada uno (para mockear GPS cuando haga falta)
- **MercadoPago test cards** a mano:
  - Aprobada: `5031 7557 3453 0604` (Mastercard) o `4509 9535 6623 3704` (Visa)
  - Rechazada: `5031 4332 1540 6351` o `4774 4777 9999 9991`
  - Vencimiento: `11/30`, CVV: `123`, Titular: `APRO` (aprobada) / `OTHE` (rechazada)
- **PowerShell** con `npm run dev` corriendo en `C:\dev\moovy`

## ✅ Categoría 1 — Setup base

- [ ] **Cuentas test sembradas correctamente**
  - Login admin OPS (`maurod@me.com`) → ir a `/ops/usuarios`
  - Verificar que aparecen las 4 cuentas: `buyer.test`, `merchant.test`, `driver.test`, `seller.test`
- [ ] **Comercio test aprobado y abierto**
  - `/ops/comercios` → click en "Comercio Test"
  - Status APPROVED, todos los docs APPROVED, isOpen true
- [ ] **5 productos sembrados en el merchant**
  - `/ops/comercios/[id]` → ver productos
  - Aparecen los 5 con sus pesos/categorías
- [ ] **Driver test aprobado, MOTO, online**
  - `/ops/repartidores` → "Repartidor Test"
  - approvalStatus APPROVED, isOnline true, vehicleType MOTO
- [ ] **Seller marketplace aprobado**
  - `/ops/vendedores` → "Vendedor Marketplace Test"
  - isVerified true, applicationStatus APPROVED
- [ ] **Zonas A/B/C creadas**
  - `/ops/zonas-delivery` → 3 zonas con multiplicadores 1.0/1.15/1.35 y bonus 0/150/350
  - Polígonos dibujados (los hiciste vos a mano con la UX pro)

## 💳 Categoría 2 — Pagos MercadoPago

- [ ] **Pago aprobado completa el flow**
  - Logueate como Buyer en perfil 1
  - Agregar al carrito 2-3 productos del Merchant Test
  - Checkout → tarjeta APRO → resultado: pedido creado, status `PAID`
- [ ] **Pago rechazado bloquea el pedido**
  - Agregar al carrito otra vez
  - Checkout → tarjeta OTHE → resultado: error claro, pedido NO se crea
- [ ] **Webhook MP procesa idempotente**
  - En la DB: `SELECT * FROM "MpWebhookLog" ORDER BY "createdAt" DESC LIMIT 5;`
  - Cada eventId aparece UNA vez con `processed: true`
- [ ] **Comisión calculada correcta**
  - Pedido $10.000 con merchant en first-month-free → `merchantPayout = 10000`
  - Pedido $10.000 con merchant mes 2+ (BRONCE 8%) → `merchantPayout = 9200`
  - SQL para confirmar: `SELECT subtotal, "moovyCommission", "sellerPayout", "merchantCommissionRate", "merchantCommissionSource" FROM "SubOrder" ORDER BY "createdAt" DESC LIMIT 5;`
- [ ] **Costo operativo embebido (5% subtotal)**
  - SQL: `SELECT subtotal, "deliveryFee", "tripCost", "operationalCost" FROM "SubOrder" ORDER BY "createdAt" DESC LIMIT 1;`
  - `operationalCost === Math.round(subtotal * 0.05)`
- [ ] **Driver payout exacto persistido**
  - SQL: `SELECT "driverPayoutAmount", "tripCost", "zoneDriverBonus" FROM "SubOrder" ORDER BY "createdAt" DESC LIMIT 1;`
  - `driverPayoutAmount === Math.round(tripCost * 0.80) + zoneDriverBonus`

## 🔐 Categoría 3 — Sistema PIN doble

- [ ] **PIN retiro: comercio lo ve en DRIVER_ARRIVED**
  - Buyer pide → Merchant acepta → Driver acepta → Driver mockea GPS al **comercio (-54.804/-68.306)** → Driver marca "Llegué"
  - En el panel Merchant aparece el PIN de pickup
- [ ] **PIN retiro: driver lo ingresa correctamente**
  - Driver tipea el PIN visto → status pasa a `PICKED_UP`
  - SQL: `SELECT "pickupPinVerifiedAt" FROM "SubOrder" ORDER BY "createdAt" DESC LIMIT 1;` → no es null
- [ ] **PIN entrega: cliente lo ve en `PICKED_UP`**
  - Buyer recibe push/notif del PIN al estado picked_up
- [ ] **PIN entrega: requiere geofence <100m**
  - Driver con GPS del comercio (lejos del buyer) intenta marcar entrega → error 409 PIN_NOT_VERIFIED por distancia
  - Driver mockea GPS al **buyer (-54.806/-68.310)** → ahora el PIN valida → status `DELIVERED`
- [ ] **5 intentos fallidos lockean al driver**
  - Driver ingresa PIN equivocado 5 veces → driver suspendido + alerta en `/ops/fraude`
  - SQL: `SELECT "fraudScore", "isSuspended" FROM "Driver" WHERE id = ...;`

## 📦 Categoría 4 — Flujos críticos end-to-end

- [ ] **Buyer hace pedido completo (happy path)**
  - Login → home → seleccionar producto del Merchant Test → agregar al carrito → checkout → pagar → ver tracking → recibir
- [ ] **Multi-vendor (merchant + seller marketplace en mismo pedido)**
  - Listing del Seller agregado al carrito + producto del Merchant
  - Checkout uno solo → al confirmar se generan 2 SubOrder con drivers/PINs independientes
- [ ] **Pedido grande forza vehículo más grande**
  - Buyer agrega 5 unidades de "Caja electrodoméstico chico" (LARGE, 2.5kg c/u = 12.5kg total)
  - Verificar que el vehículo asignado o sugerido sea Auto (no MOTO)
- [ ] **Pickup (sin delivery)**
  - Buyer elige pickup en checkout → fee = 0 → driver no se asigna
- [ ] **Cancelación con refund + reverse points**
  - Buyer hace pedido usando 500 puntos como descuento + paga MP aprobado
  - Admin OPS cancela la orden → puntos earn revertidos, puntos used devueltos al balance
  - Refund MP visible en el SubOrder

## 🗺️ Categoría 5 — Zonas de delivery

- [ ] **Pedido a Zona A (Centro): multiplicador 1.0**
  - Buyer en Av. San Martín → fee normal sin recargo
  - SQL: `"zoneCode": "Zona A — Centro", "zoneMultiplier": 1.0, "zoneDriverBonus": 0`
- [ ] **Pedido a Zona B (Intermedia): +15% + bonus driver $150**
  - Mockear GPS Buyer a una calle entre Alem y Las Primulas (ej: -54.800/-68.310)
  - Crear nuevo pedido → fee debe verse 15% más caro en el preview
  - Línea visible en el desglose: "↳ Zona B — Intermedia +15%"
- [ ] **Pedido a Zona C (Alta): +35% + bonus driver $350**
  - Mockear GPS Buyer a Andorra (ej: -54.785/-68.305)
  - Fee +35% en preview, snapshot en SubOrder con bonus 350
- [ ] **Comercio cerrado bloquea compra**
  - Admin pausa el Merchant Test (`isOpen: false`)
  - Buyer entra al producto → ve banner amarillo "Tienda cerrada"
  - Botón "Agregar al carrito" deshabilitado
- [ ] **Fuera de horario bloquea compra**
  - Admin cambia el `scheduleJson` del Merchant Test a "lun-vie 9-18" + ahora son las 23h
  - Buyer entra al producto → mismo bloqueo

## 🔒 Categoría 6 — Seguridad

- [ ] **Auto-compra bloqueada**
  - Login como Seller → intentar comprar uno de sus propios listings → bloqueado por backend
- [ ] **Delivery fee no manipulable**
  - DevTools → cambiar el `deliveryFee` del request POST `/api/orders` por un valor menor
  - El server lo recalcula y rechaza si la diferencia >25%
- [ ] **IDOR: no puedo ver pedidos de otro user**
  - Buyer logueado intenta GET `/api/orders/<id-de-otro-user>` → 403
- [ ] **Sin token: 401 en endpoints protegidos**
  - DevTools → borrar cookies → recargar `/comercios/pedidos` → 401
- [ ] **No hay secrets en código**
  - `git log -p | grep -i "password\|secret\|key"` no devuelve secrets

## 🏔️ Categoría 7 — Ushuaia específico

- [ ] **Zona excluida bloquea pedido**
  - `/ops/zonas-excluidas` → agregar un círculo de exclusión (ej: Costa Susana, lat -54.78, lng -68.45, radio 1km)
  - Buyer mockea GPS en esa zona → checkout devuelve `zone_excluded` con mensaje claro
- [ ] **Clima cambia multiplicador**
  - Admin → `/ops/config-biblia` → cambiar `activeClimateCondition` a `lluvia_leve`
  - Nuevo pedido → fee se ve 15% más caro
- [ ] **Demanda alta cambia multiplicador**
  - Mismo, cambiar a `alta` → fee 20% más caro

## 🚀 Categoría 8 — Infraestructura (manual)

- [ ] **`devmain.ps1` deploya sin tocar prod data**
  - En modo default, dry-run, no aplica cambios reales
- [ ] **`pm2 restart moovy` levanta limpio**
  - SSH al VPS → `pm2 restart moovy` → app responde en 3s sin errores en logs
- [ ] **Logs útiles para debug**
  - `pm2 logs moovy --lines 50` → ver que tiene contexto (orderId, userId, action)
- [ ] **MP credenciales de producción cargadas**
  - DÍA DEL LAUNCH solamente. Verificar `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY` en producción.

## Después del checklist

Cuando todas las casillas estén marcadas:

1. Documentar issues encontrados en `ISSUES.md` (si los hay)
2. Si hubo bugs, abrir rama de fix y resolverlos
3. Re-correr categoría afectada
4. Cuando estén todas verdes: aprobar GO al launch

Si algo bloquea, abrir rama puntual `fix/<problema>` y arreglar antes de aprobar.

## Notas finales

Este checklist es **manual**. Los tests automatizados (Vitest unit + Playwright
E2E) están planificados para post-launch (semanas 1-4 según `PROJECT_STATUS.md`).
Una vez que tengas confianza en el flujo manual, vale la pena automatizar al
menos los puntos de Categoría 2 (pagos) y Categoría 3 (PIN) que son los más
críticos en plata real.
