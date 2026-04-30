# Moovy — Histórico de Auditorías y Planes

> **Este archivo NO se carga automáticamente en sesiones de Claude.**
> Es un archivo de referencia con auditorías y planes que YA fueron aplicados al código.
> Las acciones recomendadas en estos documentos están implementadas en producción.
> Se mantiene para trazabilidad histórica y auditoría legal/AAIP.
>
> Para info canónica vigente, ver `.claude/CLAUDE.md`.
> Para histórico de ramas, ver `.claude/CHANGELOG.md`.

---



---

# Archivo: `docs/auditorias/ANALISIS-FINANCIERO-MOOVY.md`

# Auditoría Financiera Integral — MOOVY
**Fecha**: 19 de marzo de 2026
**Versión**: 1.0
**Equipo**: Arquitectura de Pagos · Integración MP · Consultoría Financiera · Compliance

---

## RESUMEN EJECUTIVO

Moovy tiene una base sólida de integración con MercadoPago (Checkout Pro + OAuth para vendors + webhooks con HMAC), un sistema de comisiones configurable por comercio, y un flujo de pedidos funcional para pagos digitales y efectivo. Sin embargo, el **diferenciador central** (pago instantáneo al comercio) está **parcialmente implementado**: la arquitectura OAuth + split de MP Marketplace existe en el código pero requiere que cada comercio vincule su cuenta MP, y no hay fallback para comercios sin cuenta MP. Faltan módulos completos de propinas, cupones, wallet de repartidor, rendición de efectivo, y facturación AFIP.

**Veredicto**: Moovy está al ~45% de su circuito financiero completo. El flujo MP→comercio vía split funciona si el comercio tiene cuenta MP vinculada. Todo lo demás (transferencia bancaria, efectivo con rendición, propinas, cupones, compliance) está ausente o es manual.

---

## PASO 2 — MAPA DEL ESTADO ACTUAL

### Implementado y funcional

| Módulo | Archivos clave | Estado |
|--------|---------------|--------|
| Checkout Pro con preferencias | `src/lib/mercadopago.ts` (L40-94), `src/app/api/orders/route.ts` (L299-407) | Funciona en sandbox |
| Webhook MP con HMAC + idempotencia | `src/app/api/webhooks/mercadopago/route.ts` | Seguro (V-012, V-015) |
| OAuth MP para vendors (connect/disconnect) | `src/app/api/mp/connect/route.ts`, `callback/route.ts`, `disconnect/route.ts` | Funciona |
| Split de pagos (marketplace_fee) | `src/lib/mercadopago.ts` L75, `createVendorPreference()` L259-266 | Implementado |
| Comisiones por comercio (configurable) | `src/app/api/orders/route.ts` L144-156, schema Merchant.commissionRate | Funciona (default 8%) |
| Comisiones por seller marketplace | `src/app/api/orders/route.ts` L246, schema SellerProfile.commissionRate | Funciona (default 12%) |
| Cálculo de delivery por distancia+categoría | `src/lib/delivery.ts`, DeliveryRate + PackageCategory en schema | Funciona |
| Dashboard earnings comercio | `src/app/api/merchant/earnings/route.ts` | Funciona |
| Dashboard earnings repartidor | `src/app/api/driver/earnings/route.ts` | Funciona (80% del deliveryFee) |
| Dashboard revenue OPS | `src/app/api/ops/revenue/route.ts` | Funciona |
| Panel de comisiones OPS | `src/app/api/admin/comisiones/route.ts`, page comisiones | Funciona |
| Sistema de puntos y referidos | `src/lib/points.ts` (373 líneas completas) | Funciona |
| Reembolso manual (admin) | `src/app/api/ops/refund/route.ts` | Funciona con audit |
| Pedidos en efectivo (flujo básico) | `src/app/api/orders/route.ts` flujo cash | Funciona (sin rendición) |
| Soft delete de pedidos | `src/app/api/admin/orders/route.ts` | Funciona |

### Empezado pero incompleto

| Módulo | Lo que existe | Lo que falta |
|--------|--------------|-------------|
| Pago instantáneo al comercio | OAuth MP + split preference con marketplace_fee | No hay verificación de que el comercio tenga MP vinculado antes de crear pedido; no hay fallback; no hay refresh automático de tokens expirados |
| SubOrder payouts | Campos `payoutStatus`, `paidOutAt`, `mpTransferId` en schema | No hay lógica que ejecute el payout ni que actualice estos campos |
| Reembolso vía MP API | Campo en schema + endpoint manual | No se llama a la API de refunds de MP (`/v1/payments/{id}/refunds`); solo se marca en DB |
| Datos fiscales comercio | `constanciaAfipUrl`, `habilitacionMunicipalUrl`, `cuit` en schema Merchant | No hay validación CUIT real, no hay integración AFIP |
| Datos bancarios seller | `bankAlias`, `bankCbu` en schema SellerProfile | No se usan para hacer transferencias; solo se almacenan |
| Scheduled orders con pago | Cron `scheduled-notify` tiene TODO en L149 | Falta trigger de refund si se cancela pedido pre-pagado con MP |

### Falta completamente

| Módulo | Impacto |
|--------|---------|
| Sistema de propinas (tips/gratuity) | No existe campo, UI, ni lógica. Crítico para retención de repartidores |
| Wallet / balance del repartidor | No hay acumulación, neteo, ni retiro. Solo cálculo informativo |
| Rendición de efectivo | No hay control de cuánto debe el repartidor tras cobrar cash |
| Pago por transferencia bancaria | No hay flujo, ni generación de referencia, ni confirmación |
| Pago por QR de MercadoPago | No implementado |
| Sistema de cupones / descuentos | Solo existe descuento por puntos. No hay códigos promo |
| Facturación electrónica AFIP | No hay integración |
| Retenciones / percepciones impositivas | No hay cálculo |
| Contracargos (chargebacks) | No hay manejo |
| Polling de reconciliación | No hay cron que verifique pagos pendientes en MP |
| Refresh automático de tokens OAuth MP | No hay cron ni middleware que renueve tokens expirados |
| Reembolso automático vía API MP | Solo marca en DB, no ejecuta refund real |

### Implementado pero con riesgos

| Problema | Archivo | Riesgo |
|----------|---------|--------|
| El total del pedido se calcula server-side pero el `deliveryFee` viene del frontend | `orders/route.ts` L87 `deliveryFee` del body | Medio: un atacante podría enviar deliveryFee=0 |
| No se valida que el comercio tenga MP vinculado antes de aceptar pago MP | `orders/route.ts` L310-330 | Alto: si vendorAccessToken es null, se crea preference con token de Moovy (el dinero va a Moovy, no al comercio) |
| `commissionPaid` se marca manualmente por admin | `admin/comisiones/route.ts` PATCH | Medio: sin automatización, depende de proceso humano |
| Reembolso no revierte en MercadoPago | `ops/refund/route.ts` | Alto: solo cambia estado en DB, el comprador no recibe su dinero de vuelta en MP |
| riderCommissionPercent en StoreSettings vs DeliveryRate | `driver/earnings/route.ts` L50 vs `assignment-engine.ts` L852 | Medio: dos fuentes de verdad para cuánto gana el repartidor |

---

## FASE 1 — CIRCUITO COMPLETO: PAGO CON MERCADOPAGO

### 1.1 — Flujo del comprador

**Tipo de checkout**: Checkout Pro (redirect a MercadoPago).

**Creación de preferencia** (`src/lib/mercadopago.ts` L40-94):
- Items se mapean con `id`, `title`, `quantity`, `unit_price`, `currency_id: "ARS"`.
- Delivery fee se agrega como item separado si > 0 (L54-62).
- `external_reference` = `order.id` para mapeo en webhook.
- `notification_url` solo se configura en producción (L82-84, localhost excluido).
- Soporta `marketplace_fee` para split payments cuando hay vendor token (L75).

**Cálculo del monto**: Server-side en `src/app/api/orders/route.ts`:
- `subtotal` = suma de (precio × cantidad) de cada item (L116-138).
- `moovyCommission` = subtotal × (commissionRate / 100) (L150).
- `merchantPayout` = subtotal - moovyCommission (L155).
- `total` = subtotal + deliveryFee - discount (L165).
- **BRECHA**: `deliveryFee` viene del body del request (L87), no se recalcula server-side. Debería recalcularse usando `calculateDeliveryCost()` de `src/lib/delivery.ts`.

**Desglose enviado a MP**: Items de productos + delivery como item separado. **FALTA**: No se envían datos de `shipment` ni `payer` completos. La propina no existe.

**Estados manejados** (`src/app/api/webhooks/mercadopago/route.ts`):
- `approved` → `handleApproved()`: status=CONFIRMED, paymentStatus=PAID, paidAt=now, email+socket (L153-196).
- `rejected` → `handleRejected()`: restaura stock, status=CANCELLED, paymentStatus=FAILED (L200-235).
- `pending/in_process` → solo actualiza mpStatus (L108-115).

**Pantallas de retorno** (`src/app/(store)/checkout/` flujo mp-return):
- Polling a `/api/payments/{orderId}/status` cada 3s, máximo 60s.
- Muestra éxito, pendiente o timeout.
- **BRECHA**: No hay pantalla diferenciada para "rejected" vs "timeout".

**Idempotency key**: Se usa `eventId` en `MpWebhookLog` para evitar procesamiento duplicado (V-015). Pero NO se envía `X-Idempotency-Key` al crear la preferencia — esto podría causar preferencias duplicadas si hay retry del frontend.

**Almacenamiento**: `mpPreferenceId`, `mpPaymentId`, `mpStatus`, `paidAt` en Order. Payment record separado con `rawPayload` completo.

### 1.2 — Webhook / IPN de MercadoPago

**Endpoint**: `POST /api/webhooks/mercadopago` (291 líneas).

**Validación de autenticidad**:
- HMAC-SHA256 con `MP_WEBHOOK_SECRET` obligatorio (V-012). Timing-safe comparison.
- **BRECHA**: No se valida IP de origen de MercadoPago. MP envía webhooks desde IPs específicas que deberían whitelistearse.
- **BRECHA**: No se hace segunda verificación consultando la API de MP (`GET /v1/payments/{id}`) para confirmar estado real. Actualmente confía en el webhook.
  - **ACTUALIZACIÓN**: Sí se consulta la API (L70-80): `paymentApi.get({ id: dataId })`. Este punto está cubierto.

**Eventos manejados**: Solo `payment` type (L56). No se manejan explícitamente `payment.created` vs `payment.updated` — se procesan ambos igual.

**Retry y reconciliación**:
- **BRECHA CRÍTICA**: No hay cron de polling/reconciliación. Si un webhook se pierde (MercadoPago reintenta hasta 3 veces, pero si el servidor está caído las 3 veces, se pierde). Debería haber un cron que busque pedidos en `AWAITING_PAYMENT` por más de X minutos y consulte la API de MP.

### 1.3 — Split / distribución del dinero

**Mecanismo**: MercadoPago Marketplace (split automático).

**Implementación** (`src/app/api/orders/route.ts` L299-407):
1. Se busca `vendorAccessToken` del comercio/seller vinculado por OAuth.
2. Si existe: se llama `createVendorPreference()` con el token del vendor y `marketplace_fee` = `moovyCommission`.
3. El dinero va directo a la cuenta MP del vendor, MP retiene el marketplace_fee para Moovy.
4. Si NO existe token: se crea preferencia normal con token de Moovy → **TODO EL DINERO VA A MOOVY**.

**BRECHA CRÍTICA**: No hay validación previa. Si un comercio no tiene MP vinculado y el comprador paga con MP, el dinero va a Moovy y no hay mecanismo automático para transferirlo al comercio. Esto contradice el diferenciador de "pago instantáneo".

**Registro contable**: El Order tiene `moovyCommission` y `merchantPayout`, pero no hay tabla de `Transaction` que registre el movimiento real de dinero. El SubOrder tiene `payoutStatus` y `mpTransferId` pero nunca se actualizan.

---

## FASE 2 — PAGO INSTANTÁNEO AL COMERCIO (EL DIFERENCIADOR)

### 2.1 — Arquitectura del pago instantáneo

**Estado actual**: Opción A (MercadoPago Marketplace Split) está **parcialmente implementada**.

**Lo que funciona**:
- OAuth de MP para vincular comercios (`/api/mp/connect`, `/api/mp/callback`).
- Almacenamiento de `mpAccessToken`, `mpRefreshToken`, `mpUserId`, `mpEmail`, `mpLinkedAt` en Merchant y SellerProfile.
- Creación de preferencia con token del vendor + `marketplace_fee`.
- El comercio recibiría el dinero en su cuenta MP instantáneamente (menos el marketplace_fee de Moovy).

**Lo que falta**:
1. **Gate de verificación**: No se valida que el comercio tenga MP vinculado antes de permitir checkout con MP. Un comprador puede pagar con MP a un comercio sin cuenta vinculada → dinero va a Moovy.
2. **Refresh de tokens**: `refreshOAuthToken()` existe en `mercadopago.ts` (L237-256) pero **nunca se invoca**. Los tokens de MP expiran. No hay cron ni middleware que los renueve.
3. **Fallback**: Si el token del vendor falla, no hay retry ni notificación al admin.
4. **Multi-vendor**: Si un pedido tiene productos de 2+ vendors, ¿cómo se splittea? El código actual (L310) toma `singleVendor` y usa su token. Para pedidos multi-vendor, cae al token de Moovy.
5. **Desvinculación**: Si un comercio desvincula su MP (`/api/mp/disconnect`), los pedidos pendientes quedan sin resolver.

**Evaluación de opciones**:

**Opción A — MercadoPago Marketplace (RECOMENDADA)**:
- Es lo que ya está parcialmente implementado.
- El comprador paga → MP splitea automáticamente → comercio recibe al instante en su cuenta MP.
- Moovy cobra su marketplace_fee sin tocar el dinero del comercio.
- **Pros**: Legal (no sos intermediario financiero), instantáneo, auditable por MP.
- **Contras**: Requiere que TODOS los comercios tengan cuenta MP. No funciona para pedidos multi-vendor con un solo pago.
- **Solución multi-vendor**: Crear una preferencia separada por vendor group, o usar la API de Advanced Payments de MP (POST `/v1/advanced_payments`).

**Opción B — Pago directo al comercio**:
- Viable si el checkout se hace con el token del comercio directamente.
- Moovy cobra su comisión por facturación mensual o descuento.
- **Problema**: Moovy no tiene control del pago. Si hay disputa, el comercio maneja el contracargo.
- **No recomendada** para Moovy porque pierde control operativo.

**Opción C — Pago a Moovy + transferencia inmediata**:
- **RIESGO LEGAL ALTO**: Moovy actuaría como Proveedor de Servicios de Pago (PSP), requiere autorización del BCRA según Comunicación "A" 6885.
- Solo viable con licencia de PSP o usando un intermediario regulado.
- **No recomendada**.

**Opción D — MP Point / QR en el comercio**:
- No viable para delivery (el comprador no está en el comercio).
- Sí viable para pickup (retiro en local), pero limitado.

### 2.2 — Datos financieros del comercio

**Almacenados actualmente** (schema Merchant L352-416):
- `mpAccessToken`, `mpRefreshToken`, `mpUserId`, `mpEmail`, `mpLinkedAt` — OAuth MP
- `commissionRate` (Float, default 8%)
- `cuit` — **Solo en registro, no validado contra AFIP**
- `constanciaAfipUrl`, `habilitacionMunicipalUrl`, `registroSanitarioUrl` — Documentos subidos
- `deliveryFee` (Float, default 0)

**Almacenados en SellerProfile** (L454-479):
- Mismos campos MP OAuth
- `bankAlias`, `bankCbu` — Para transferencias futuras
- `commissionRate` (Float, default 12%)
- `cuit`, `acceptedTermsAt`

**Lo que falta**:
- Condición ante AFIP (monotributo, responsable inscripto, exento) — necesario para facturación.
- Categoría de monotributo (define tope de facturación).
- CBU/CVU del comercio (en Merchant no existe, solo en SellerProfile).
- Datos de facturación (razón social, domicilio fiscal).
- **Validación de CUIT real** (contra API de AFIP o padrón).
- **Encriptación at-rest** de mpAccessToken y datos sensibles — reconocido como deuda técnica pendiente en CLAUDE.md.

### 2.3 — Conciliación y trazabilidad

**Estado actual**: **No hay registro granular de distribución por pedido**.

El Order tiene `moovyCommission` y `merchantPayout` calculados, pero no hay una tabla de `Transaction` que diga "de este pago de $5000, $4250 fueron al comercio (via MP split), $500 a Moovy (marketplace_fee), $200 al repartidor (delivery fee), $50 de propina". La propina ni siquiera existe.

**Dashboard del comercio**: `GET /api/merchant/earnings` muestra `totalSales`, `payout`, `commission` agregados. No muestra el detalle por pedido de cuánto recibió realmente en su cuenta MP.

**Dashboard de Moovy (OPS)**: `/api/ops/revenue` muestra totales agregados con breakdown por mes y método de pago. No hay conciliación contra los pagos reales de MP.

**BRECHA CRÍTICA**: No hay reconciliación. Moovy no puede verificar que lo que calculó como `merchantPayout` es efectivamente lo que el comercio recibió en MP.

---

## FASE 3 — CIRCUITO COMPLETO: PAGO POR TRANSFERENCIA BANCARIA

### Estado: NO IMPLEMENTADO

No existe ningún flujo de transferencia bancaria en el código. El checkout (`src/app/(store)/checkout/page.tsx`) solo ofrece "Efectivo" y "MercadoPago" como métodos de pago.

**Lo que se necesitaría**:
1. Opción de pago "Transferencia" en checkout.
2. Generar referencia única (número de operación) por pedido.
3. Mostrar CBU/CVU de destino (del comercio si pago directo, o de Moovy si centralizado).
4. Plazo límite para transferir (ej: 30 min).
5. Confirmación: manual (comprador sube comprobante) o automática (si destino es CVU de MP, se puede detectar vía webhook).
6. Cron que cancele pedidos no pagados pasado el plazo.
7. Distribución: si va al comercio directo, Moovy cobra comisión por separado (facturación mensual).

**Prioridad**: P1 (primer mes post-lanzamiento). No es bloqueante para MVP si MercadoPago + efectivo están disponibles.

---

## FASE 4 — CIRCUITO COMPLETO: PAGO EN EFECTIVO

### 4.1 — Flujo del pedido

**Implementado** (`src/app/api/orders/route.ts` flujo cash, L409-440):
- El comprador selecciona "Efectivo" en checkout.
- El pedido se crea con `status: PENDING`, `paymentMethod: "cash"`, `paymentStatus: "PENDING"`.
- Se envía email de confirmación inmediatamente.
- Se notifica a vendors y admin por socket.
- No hay límite de monto para efectivo.
- No es configurable por comercio (todos aceptan efectivo).

### 4.2 — El repartidor como cobrador

**Parcialmente implementado**:
- El repartidor marca el pedido como DELIVERED.
- **BRECHA**: No hay flujo de "cobrado en efectivo". El repartidor no confirma que recibió el dinero.
- **BRECHA**: No se registra el monto exacto cobrado en efectivo.
- **BRECHA**: No hay gestión de cambio ni foto de evidencia.

### 4.3 — Distribución del efectivo

**NO IMPLEMENTADO**.

Cuando el repartidor cobra en efectivo, tiene en sus manos dinero que no es 100% suyo:
- Parte del comercio: subtotal - comisión Moovy
- Parte de Moovy: comisión
- Parte del repartidor: delivery fee (o su porcentaje)

**No existe**:
- Sistema de rendición de efectivo.
- Cuenta corriente repartidor-comercio-Moovy.
- Tracking de efectivo en circulación.
- Corte de caja por turno.
- Bloqueo por no rendición.
- Neteo contra balance digital.

**Prioridad**: P0 si se lanza con efectivo. Sin rendición, el repartidor puede quedarse con todo el efectivo.

### 4.4 — Contabilidad del efectivo

**NO IMPLEMENTADO**. No hay registro de efectivo cobrado vs rendido. No hay corte de caja.

---

## FASE 5 — PROPINAS PARA REPARTIDORES

### Estado: NO IMPLEMENTADO

No existe campo `tip`/`tipAmount`/`propina` en ningún modelo (Order, SubOrder, Payment). No hay UI de propina en checkout ni post-entrega. No hay cálculo ni distribución de propinas.

**Lo que se necesita**:
1. Campo `tipAmount` en Order (Float, default 0).
2. UI pre-checkout: montos sugeridos ($100, $200, $500, libre) o post-entrega.
3. Si MP: incluir como item separado en la preferencia, o como parte del `marketplace_fee` inverso (el tip NO debería ir a Moovy).
4. Si efectivo: el comprador da de más al repartidor (fuera del sistema, opcional registrar).
5. 100% al repartidor siempre.
6. Historial de propinas en dashboard del repartidor.

**Prioridad**: P1. Importante para retención de repartidores pero no bloqueante para lanzamiento.

---

## FASE 6 — COMISIONES Y MONETIZACIÓN DE MOOVY

### 6.1 — Modelo de comisiones

**Implementado**:
- Porcentaje sobre subtotal de productos (NO incluye delivery ni propina).
- Configurable por comercio: `Merchant.commissionRate` (default 8%).
- Configurable por seller marketplace: `SellerProfile.commissionRate` (default 12%).
- Defaults globales leídos de MoovyConfig: `default_merchant_commission_pct`, `default_seller_commission_pct`.
- Cálculo server-side en `orders/route.ts` L150-156.

**BRECHA**: No hay planes/tiers de comisión (básico/premium). No hay comisión por categoría. No hay fee fijo + porcentaje (solo porcentaje). Estos podrían ser mejoras futuras.

### 6.2 — Cobro según método de pago

- **MercadoPago**: Via `marketplace_fee` en split automático. Funciona si vendor tiene MP vinculado.
- **Efectivo**: `commissionPaid` flag en Order, admin marca manualmente como pagado en `/ops/comisiones`. **BRECHA**: No hay mecanismo real de cobro.
- **Transferencia**: No implementado.

### 6.3 — Facturación de comisiones

**NO IMPLEMENTADO**. No hay integración AFIP, no se genera factura electrónica, no hay comprobante para el comercio.

### 6.4 — Fee de delivery

**Implementado** en dos sistemas:
1. `src/lib/delivery.ts`: Cálculo dinámico basado en distancia, combustible, mantenimiento. Usado en checkout.
2. `DeliveryRate` + `PackageCategory` en schema: Base + precio/km por categoría de paquete. Usado en assignment engine para calcular earnings del repartidor.

**Distribución**: El repartidor recibe `riderCommissionPercent` (default 80%) del `deliveryFee`, según `StoreSettings`. El 20% restante va a Moovy.

**BRECHA**: Hay dos fuentes de verdad para cuánto gana el repartidor: `StoreSettings.riderCommissionPercent` (80%) usado en `driver/earnings` vs `DeliveryRate.basePriceArs + pricePerKmArs` usado en `assignment-engine`. Debería unificarse.

---

## FASE 7 — COBRO DEL REPARTIDOR

### 7.1 — Fuentes de ingreso

- Fee de delivery × 80% (configurable vía StoreSettings) — **Implementado en cálculo, no en pago real**.
- Propinas digitales — **NO IMPLEMENTADO**.
- Propinas en efectivo — **NO IMPLEMENTADO**.
- Bonificaciones — **NO IMPLEMENTADO**.

### 7.2 — Wallet / balance del repartidor

**NO IMPLEMENTADO**. No hay modelo Wallet ni Balance para repartidores. El endpoint `driver/earnings` calcula ganancias informativas pero no hay acumulación real.

**Lo que se necesita**:
- Modelo `DriverWallet` con balance acumulado.
- Cada entrega suma `deliveryFee × riderPercent`.
- Cada cobro de efectivo resta lo que no es del repartidor.
- Balance visible en tiempo real.

### 7.3 — Retiro / liquidación

**NO IMPLEMENTADO**. No hay transferencia a CBU/CVU, ni a cuenta MP. No hay frecuencia de liquidación.

### 7.4 — Rendición de efectivo

**NO IMPLEMENTADO**. Ver Fase 4.3.

---

## FASE 8 — REEMBOLSOS, CANCELACIONES Y DISPUTAS

### 8.1 — Cancelación antes de preparar

**Parcialmente implementado**:
- Cron `merchant-timeout` cancela pedidos no confirmados (`src/app/api/cron/merchant-timeout/route.ts`).
- `scheduled-notify` cancela pedidos programados no confirmados.
- Se restaura stock en rechazo de pago (`webhooks/mercadopago` handleRejected L200-235).
- **BRECHA**: Si un pedido con MP está en CONFIRMED (ya pagado) y se cancela, **no se ejecuta refund en MP**. Solo se marca en DB. El TODO en `scheduled-notify` L149 lo confirma.

### 8.2 — Cancelación después de preparar

**NO IMPLEMENTADO como flujo**. No hay lógica de quién absorbe el costo. El admin puede hacer refund manual desde OPS, pero es completamente manual.

### 8.3 — Producto defectuoso o faltante

**NO IMPLEMENTADO**. No hay reembolso parcial automático. El refund endpoint (`ops/refund`) permite monto parcial pero es manual y **no revierte en MP**.

### 8.4 — Contracargos (chargebacks)

**NO IMPLEMENTADO**. Si un comprador hace chargeback:
- Con split de MP: el contracargo va contra la cuenta del vendor (comercio). MP lo maneja.
- Sin split: el contracargo va contra Moovy.
- No hay prevención ni manejo de disputas.

### 8.5 — Disputas por efectivo

**NO IMPLEMENTADO**. No hay evidencia fotográfica, no hay GPS timestamp de entrega, no hay registro de cobro.

---

## FASE 9 — CUPONES, DESCUENTOS Y PROMOCIONES

### Estado: NO IMPLEMENTADO

No existe modelo `Coupon` ni `Promotion` en el schema. El único descuento disponible es por canje de puntos (sistema de puntos, `src/lib/points.ts`).

**Lo que se necesita**:
- Modelo `Coupon`: código, tipo (porcentaje/fijo/delivery gratis), monto, vigencia, usos máximos, usos por usuario, monto mínimo, comercio específico o global, quién absorbe (Moovy/comercio).
- Validación server-side completa.
- Integración con cálculo de total en `orders/route.ts`.

**Prioridad**: P2. Útil para crecimiento pero no bloqueante.

---

## FASE 10 — COMPLIANCE, IMPUESTOS Y FACTURACIÓN

### 10.1 — Obligaciones impositivas

**NO IMPLEMENTADO**. Como marketplace digital en Argentina, Moovy tiene obligaciones:
- IVA sobre comisiones cobradas (21%).
- Régimen de información RG 4415/2019 AFIP (marketplaces deben informar ventas de terceros).
- IIBB según jurisdicción (Tierra del Fuego tiene régimen especial — analizar si aplica Convenio Multilateral).
- Retención de IVA/Ganancias a vendedores según RG 4622 (si aplica).
- Percepción de IIBB sobre compradores de otras provincias (si aplica).

### 10.2 — Facturación electrónica

**NO IMPLEMENTADO**. No hay integración con AFIP (WSFE/WSFEX). Moovy debería emitir Factura C (si es monotributista) o B/A (si es responsable inscripto) por las comisiones cobradas a cada comercio.

### 10.3 — Datos fiscales

- CUIT de comercio: se almacena pero no se valida.
- Condición ante AFIP: **NO se recopila**.
- Datos fiscales del repartidor: CUIT en schema Driver, pero sin validación.
- **BRECHA**: Sin condición AFIP no se puede determinar tipo de factura a emitir.

### 10.4 — Regulaciones BCRA

Con el modelo MP Marketplace (Opción A), **Moovy NO toca el dinero** del comercio → no es intermediario financiero → no necesita autorización BCRA.

**PERO**: Con pagos en efectivo, el repartidor cobra en nombre del comercio y de Moovy → existe un flujo de dinero físico fuera del sistema regulado. Esto debería manejarse como "cobro por cuenta y orden de terceros" con documentación adecuada.

---

## ENTREGABLE 1 — MAPA FINANCIERO DE MOOVY

```
COMPRADOR
    │
    ├── [MercadoPago] ──────────────────────────────────────────────
    │   │                                                           │
    │   ├── Subtotal productos ─── MP Split ──→ CUENTA MP COMERCIO ✅ (si vinculado)
    │   │                              │
    │   │                              └──→ marketplace_fee ──→ CUENTA MP MOOVY ✅
    │   │
    │   ├── Delivery fee ─── (incluido en preferencia como item) ──→ CUENTA MP MOOVY ❌
    │   │   └── (debería ir al repartidor, pero va a Moovy y no se redistribuye)
    │   │
    │   ├── Propina ─── NO EXISTE ❌
    │   │
    │   └── Descuento puntos ─── se descuenta del total ✅
    │
    ├── [Efectivo] ──────────────────────────────────────────────────
    │   │
    │   └── Total en efectivo ──→ REPARTIDOR (bolsillo) ✅
    │       │
    │       ├── Parte comercio (subtotal - comisión) ──→ ¿? ❌ SIN RENDICIÓN
    │       ├── Parte Moovy (comisión) ──→ ¿? ❌ SIN RENDICIÓN
    │       └── Parte repartidor (delivery fee) ──→ se queda ✅ (de facto)
    │
    └── [Transferencia] ─── NO IMPLEMENTADO ❌
```

---

## ENTREGABLE 2 — MATRIZ DE CIRCUITOS DE PAGO

| Concepto | MercadoPago | Efectivo | Transferencia |
|----------|-------------|----------|---------------|
| Pago productos → comercio | ✅ Via MP split (si vinculado). ❌ Si no, va a Moovy sin redistribución | ❌ Repartidor cobra, sin rendición formal | ❌ No implementado |
| Comisión → Moovy | ✅ marketplace_fee automático | ⚠️ Solo marca en DB, cobro manual | ❌ No implementado |
| Fee delivery → repartidor | ❌ Va a Moovy en la preferencia MP, no se transfiere al repartidor | ⚠️ El repartidor se queda todo el efectivo (incluido lo que no es suyo) | ❌ No implementado |
| Propina → repartidor | ❌ No existe | ❌ No existe (informal) | ❌ No existe |
| Reembolso → comprador | ❌ Solo marca DB, no ejecuta refund MP API | ❌ No implementado (¿efectivo de vuelta?) | ❌ No implementado |
| Pago al repartidor (acumulado) | ❌ No hay wallet ni liquidación | N/A (cobra en mano) | ❌ No implementado |

---

## ENTREGABLE 3 — LISTA DE BRECHAS (Ordenado por prioridad)

### P0 — Bloqueante para lanzar

| # | Brecha | Esfuerzo | Archivos afectados |
|---|--------|----------|--------------------|
| 1 | Validar que comercio tenga MP vinculado antes de checkout MP | 2h | `orders/route.ts`, checkout page |
| 2 | Rendición de efectivo (modelo + flujo básico) | 3-5 días | Nuevo modelo, nuevas APIs, UI repartidor |
| 3 | Recálculo server-side del deliveryFee | 4h | `orders/route.ts` |
| 4 | Reembolso real vía API MP (`/v1/payments/{id}/refunds`) | 1 día | `ops/refund/route.ts`, `mercadopago.ts` |
| 5 | Cron de reconciliación MP (polling pagos pendientes) | 1 día | Nuevo cron |
| 6 | Refresh automático de tokens OAuth MP | 1 día | Nuevo cron o middleware, `mercadopago.ts` |
| 7 | Gate: bloquear checkout MP si comercio no vinculado | 4h | `orders/route.ts`, checkout UI |

### P1 — Primer mes post-lanzamiento

| # | Brecha | Esfuerzo |
|---|--------|----------|
| 8 | Sistema de propinas (modelo + UI + distribución) | 3-5 días |
| 9 | Wallet del repartidor (modelo + acumulación + vista) | 3-5 días |
| 10 | Liquidación/payout del repartidor (transferencia CBU/CVU) | 3-5 días |
| 11 | Flujo de transferencia bancaria | 5-7 días |
| 12 | Unificar fuente de verdad de earnings repartidor | 1 día |
| 13 | Manejo de pedidos multi-vendor con MP (Advanced Payments o preferencias separadas) | 3-5 días |
| 14 | Delivery fee como ítem que va al repartidor (no a Moovy) en split MP | 2 días |
| 15 | Dashboard de conciliación (MP real vs calculado) | 3-5 días |

### P2 — Segundo/tercer mes

| # | Brecha | Esfuerzo |
|---|--------|----------|
| 16 | Sistema de cupones/descuentos | 5-7 días |
| 17 | Facturación electrónica AFIP (comisiones) | 7-10 días |
| 18 | Régimen de información RG 4415 | 3-5 días |
| 19 | Contracargos y disputas | 3-5 días |
| 20 | Encriptación at-rest de datos sensibles (tokens MP, CBU, CUIT) | 2-3 días |
| 21 | Pago por QR de MercadoPago (para pickup) | 3-5 días |
| 22 | Configurable: aceptar/rechazar efectivo por comercio | 1 día |
| 23 | Bonificaciones repartidores (lluvia, alta demanda) | 3-5 días |
| 24 | Validación de CUIT contra AFIP | 2 días |

---

## ENTREGABLE 4 — RECOMENDACIÓN ARQUITECTÓNICA

### Pago instantáneo al comercio: MercadoPago Marketplace (Opción A mejorada)

**Decisión**: Usar MP Marketplace con OAuth + split como base. Es lo que ya está implementado y es la opción legal y técnicamente más sólida.

**Mejoras necesarias**:

1. **Gate obligatorio**: El comercio DEBE vincular su cuenta MP para recibir pedidos con pago digital. Si no tiene MP vinculado, solo puede recibir pedidos en efectivo (o transferencia manual en el futuro).

2. **Multi-vendor**: Para pedidos con productos de múltiples vendors, crear preferencias separadas (una por vendor) o usar Advanced Payments de MP. Esto es complejo; para el MVP, limitar a un vendor por pedido con MP split.

3. **Delivery fee**: El delivery fee NO debe ir en el split del comercio. Opciones:
   - Incluirlo como parte del marketplace_fee (Moovy lo cobra y luego paga al repartidor).
   - O crear un segundo split para el repartidor (si tiene MP vinculado).
   - Recomendación MVP: Moovy cobra delivery fee como marketplace_fee adicional y lo acumula en wallet del repartidor para liquidación periódica.

4. **Propina**: Si se implementa, debe ser un item separado en la preferencia que NO se incluya en el marketplace_fee (100% va al vendor → luego se redistribuye al repartidor, o se usa split separado).

5. **Refresh de tokens**: Implementar cron diario que verifique tokens por expirar y los renueve con `refreshOAuthToken()`.

6. **Fallback**: Si la preferencia falla (token expirado, error de MP), notificar al admin y poner el pedido en estado de espera, NO crear preferencia con token de Moovy.

---

## ENTREGABLE 5 — ROADMAP FINANCIERO (3 meses)

### Sprint 0 — Circuito mínimo viable (2 semanas)

**Métodos de pago**: MercadoPago + Efectivo
**Alcance mínimo**:

- [x] Checkout Pro con split MP (ya existe)
- [x] Webhook con HMAC (ya existe)
- [ ] Gate: bloquear MP si comercio no tiene MP vinculado
- [ ] Recálculo server-side de deliveryFee
- [ ] Rendición de efectivo básica (repartidor marca "entregué $X", admin concilia)
- [ ] Refund real vía API MP
- [ ] Cron de reconciliación (pedidos AWAITING_PAYMENT > 30 min)
- [ ] Cron de refresh tokens OAuth MP

### Mes 1 — Completar circuitos

- [ ] Sistema de propinas (pre-checkout, montos sugeridos)
- [ ] Wallet del repartidor (acumulación digital)
- [ ] Liquidación semanal automática del repartidor (a su cuenta MP)
- [ ] Transferencia bancaria como método de pago (básico: mostrar CBU, confirmar manual)
- [ ] Unificar cálculo de earnings repartidor
- [ ] Dashboard de conciliación básico
- [ ] Config por comercio: aceptar/rechazar efectivo

### Mes 2 — Optimización y dashboards

- [ ] Dashboard financiero completo para comercios (ingresos, comisiones, facturas)
- [ ] Dashboard financiero para repartidores (ganancias, propinas, rendiciones)
- [ ] Conciliación automática MP vs DB
- [ ] Sistema de cupones/descuentos
- [ ] Corte de caja por turno del repartidor
- [ ] Neteo de efectivo vs digital en wallet repartidor
- [ ] Contracargos: flujo de disputa y resolución

### Mes 3 — Compliance y escala

- [ ] Facturación electrónica AFIP por comisiones
- [ ] Régimen de información RG 4415
- [ ] Encriptación at-rest de datos sensibles
- [ ] Validación CUIT contra AFIP
- [ ] Pago por QR (para pickup)
- [ ] Bonificaciones repartidores
- [ ] Preparación para credenciales productivas de MP

---

## ENTREGABLE 6 — MODELOS DE DATOS SUGERIDOS

### Nuevos modelos necesarios en schema.prisma

```prisma
// ============================================
// WALLET DEL REPARTIDOR
// ============================================
model DriverWallet {
  id        String   @id @default(cuid())
  driverId  String   @unique
  driver    Driver   @relation(fields: [driverId], references: [id])

  // Balances
  availableBalance  Float @default(0)  // Disponible para retiro
  pendingBalance    Float @default(0)  // Pendiente de liquidación
  cashOwed          Float @default(0)  // Efectivo que debe rendir

  // Totales históricos
  totalEarned       Float @default(0)
  totalWithdrawn    Float @default(0)
  totalCashCollected Float @default(0)
  totalCashSettled  Float @default(0)

  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  transactions WalletTransaction[]
  payouts      Payout[]
  cashSettlements CashSettlement[]
}

// ============================================
// TRANSACCIONES DE WALLET
// ============================================
model WalletTransaction {
  id          String   @id @default(cuid())
  walletId    String
  wallet      DriverWallet @relation(fields: [walletId], references: [id])

  type        WalletTxType  // DELIVERY_FEE, TIP, CASH_COLLECTED, CASH_SETTLED, PAYOUT, ADJUSTMENT
  amount      Float         // Positivo = ingreso, Negativo = egreso
  balanceAfter Float

  // Referencia al pedido
  orderId     String?
  order       Order?   @relation(fields: [orderId], references: [id])

  description String
  metadata    Json?

  createdAt   DateTime @default(now())

  @@index([walletId, createdAt])
  @@index([orderId])
}

enum WalletTxType {
  DELIVERY_FEE      // Ganancia por delivery
  TIP               // Propina digital
  CASH_COLLECTED    // Efectivo cobrado (aumenta cashOwed)
  CASH_SETTLED      // Rendición de efectivo (reduce cashOwed)
  PAYOUT            // Retiro/liquidación
  ADJUSTMENT        // Ajuste manual admin
  BONUS             // Bonificación (lluvia, demanda, etc.)
}

// ============================================
// LIQUIDACIONES / PAYOUTS
// ============================================
model Payout {
  id          String   @id @default(cuid())
  walletId    String
  wallet      DriverWallet @relation(fields: [walletId], references: [id])

  amount      Float
  method      PayoutMethod  // MP_TRANSFER, BANK_TRANSFER, CASH
  status      PayoutStatus  // PENDING, PROCESSING, COMPLETED, FAILED

  // Destino
  mpUserId    String?       // Si va a cuenta MP
  bankCbu     String?       // Si va a CBU

  // Tracking
  externalId  String?       // ID de transferencia MP o bancaria
  processedAt DateTime?
  failReason  String?

  createdAt   DateTime @default(now())

  @@index([walletId, status])
}

enum PayoutMethod {
  MP_TRANSFER
  BANK_TRANSFER
  CASH
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ============================================
// RENDICIÓN DE EFECTIVO
// ============================================
model CashSettlement {
  id          String   @id @default(cuid())
  walletId    String
  wallet      DriverWallet @relation(fields: [walletId], references: [id])
  driverId    String
  driver      Driver   @relation(fields: [driverId], references: [id])

  // Montos
  totalCollected    Float   // Total cobrado en efectivo en el período
  driverKeeps       Float   // Lo que el repartidor se queda (delivery fee + propina)
  merchantOwed      Float   // Lo que debe al comercio
  moovyOwed         Float   // Lo que debe a Moovy (comisión)

  // Estado
  status      SettlementStatus  // PENDING, PARTIAL, SETTLED, OVERDUE
  settledAt   DateTime?

  // Detalles
  orders      Json    // Array de orderIds incluidos
  notes       String?

  // Verificación
  verifiedBy  String?   // Admin que verificó
  verifiedAt  DateTime?

  createdAt   DateTime @default(now())

  @@index([driverId, status])
  @@index([walletId, createdAt])
}

enum SettlementStatus {
  PENDING
  PARTIAL
  SETTLED
  OVERDUE
}

// ============================================
// PROPINAS
// ============================================
// Agregar a Order:
//   tipAmount     Float   @default(0)
//   tipMethod     String? // "mercadopago", "cash", "post_delivery"
//   tipPaidAt     DateTime?

// ============================================
// CUPONES / DESCUENTOS
// ============================================
model Coupon {
  id            String   @id @default(cuid())
  code          String   @unique

  // Tipo
  type          CouponType  // PERCENTAGE, FIXED_AMOUNT, FREE_DELIVERY
  value         Float       // % o monto fijo

  // Límites
  maxUses       Int?        // null = ilimitado
  maxUsesPerUser Int @default(1)
  currentUses   Int  @default(0)
  minOrderAmount Float?     // Monto mínimo de pedido
  maxDiscount   Float?      // Tope de descuento (para porcentaje)

  // Vigencia
  validFrom     DateTime
  validUntil    DateTime
  isActive      Boolean  @default(true)

  // Alcance
  merchantId    String?      // null = todos los comercios
  merchant      Merchant? @relation(fields: [merchantId], references: [id])

  // Absorción
  absorbedBy    CouponAbsorber // MOOVY, MERCHANT, SPLIT
  moovySplit    Float?         // Si SPLIT, % que absorbe Moovy

  // Metadata
  description   String?
  createdBy     String       // Admin userId

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  redemptions   CouponRedemption[]

  @@index([code])
  @@index([validUntil, isActive])
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_DELIVERY
}

enum CouponAbsorber {
  MOOVY
  MERCHANT
  SPLIT
}

model CouponRedemption {
  id        String   @id @default(cuid())
  couponId  String
  coupon    Coupon   @relation(fields: [couponId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])

  discountApplied Float

  createdAt DateTime @default(now())

  @@unique([couponId, userId, orderId])
  @@index([userId])
}

// ============================================
// REGISTRO DE TRANSACCIONES FINANCIERAS (LEDGER)
// ============================================
model FinancialTransaction {
  id          String   @id @default(cuid())

  // Referencia
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])

  // Partes
  fromActor   String   // "buyer", "moovy", "driver:{id}", "merchant:{id}", "seller:{id}"
  toActor     String

  // Monto
  amount      Float
  currency    String   @default("ARS")
  concept     TxConcept // PRODUCT_PAYMENT, COMMISSION, DELIVERY_FEE, TIP, REFUND, SETTLEMENT

  // Método
  method      String   // "mp_split", "mp_transfer", "cash", "bank_transfer", "internal"

  // Estado
  status      String   @default("COMPLETED") // PENDING, COMPLETED, FAILED, REVERSED
  externalId  String?  // ID de MP u otro sistema externo

  // Metadata
  metadata    Json?

  createdAt   DateTime @default(now())

  @@index([orderId])
  @@index([fromActor, createdAt])
  @@index([toActor, createdAt])
}

enum TxConcept {
  PRODUCT_PAYMENT   // Pago de productos al comercio
  COMMISSION        // Comisión a Moovy
  DELIVERY_FEE      // Fee de delivery
  TIP               // Propina
  REFUND            // Reembolso
  CASH_SETTLEMENT   // Rendición de efectivo
  PAYOUT            // Liquidación
  ADJUSTMENT        // Ajuste
}
```

---

## ENTREGABLE 7 — RESUMEN DE CÓDIGO A IMPLEMENTAR

Dado el volumen, a continuación se describen los módulos clave con pseudo-implementación. El código final debe adaptarse al stack exacto de Moovy (Next.js 16, Prisma 5, TypeScript).

### 7.1 — Gate de verificación MP del comercio

En `src/app/api/orders/route.ts`, antes de crear preferencia MP:

```typescript
// Verificar que el comercio tenga MP vinculado para pagos MP
if (paymentMethod === "mercadopago") {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { mpAccessToken: true, mpLinkedAt: true, name: true }
  });

  if (!merchant?.mpAccessToken) {
    return NextResponse.json(
      { error: `El comercio ${merchant?.name} no tiene MercadoPago vinculado. Usá efectivo o contactá al comercio.` },
      { status: 400 }
    );
  }
}
```

### 7.2 — Refund real vía API MP

En `src/app/api/ops/refund/route.ts`:

```typescript
// Después de validaciones existentes, antes de marcar en DB:
if (order.paymentMethod === "mercadopago" && order.mpPaymentId) {
  try {
    const refundResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${order.mpPaymentId}/refunds`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `refund-${orderId}-${Date.now()}`
        },
        body: JSON.stringify(
          amount < order.total ? { amount } : {} // Parcial o total
        )
      }
    );

    if (!refundResponse.ok) {
      const error = await refundResponse.json();
      return NextResponse.json(
        { error: `Error al procesar reembolso en MercadoPago: ${error.message}` },
        { status: 502 }
      );
    }

    const refundData = await refundResponse.json();
    // refundData.id → guardar como referencia
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo conectar con MercadoPago para el reembolso" },
      { status: 502 }
    );
  }
}
```

### 7.3 — Cron de reconciliación

Nuevo archivo `src/app/api/cron/payment-reconciliation/route.ts`:

```typescript
// Buscar pedidos en AWAITING_PAYMENT por más de 30 min
// Consultar API de MP por cada mpPreferenceId
// Si el pago fue aprobado: ejecutar handleApproved
// Si fue rechazado: ejecutar handleRejected
// Si sigue pending: si tiene más de 24h, cancelar
```

### 7.4 — Cron de refresh de tokens OAuth

Nuevo archivo `src/app/api/cron/mp-token-refresh/route.ts`:

```typescript
// Buscar merchants y sellers con mpLinkedAt + 170 días (tokens MP duran 180 días)
// Para cada uno: llamar refreshOAuthToken()
// Actualizar mpAccessToken y mpRefreshToken en DB
// Si falla: notificar al comercio que revincule
```

---

## EDGE CASES FINANCIEROS

| Escenario | Estado actual | Riesgo |
|-----------|--------------|--------|
| MercadoPago caído | La preferencia falla, el comprador ve error genérico | Medio: debería ofrecer pago en efectivo como fallback |
| Pago queda en "pending" por horas (ej: pago en Rapipago) | El webhook actualizará cuando se pague | Bajo: pero no hay UI para que el comprador vea "estamos esperando tu pago" |
| Comercio cierra su cuenta MP | mpAccessToken queda inválido, preferencia falla | Alto: debe detectarse y desactivar MP para ese comercio |
| Repartidor acumula mucho efectivo sin rendir | No hay control | Crítico: puede acumular miles de pesos sin obligación de rendir |
| Pedido con cupón + propina + delivery gratis | Cupones y propinas no existen | N/A por ahora |
| Redondeos y centavos en splits | MP maneja redondeos, pero moovyCommission se calcula con Float | Bajo: usar Math.round() en comisiones |
| Pedido multi-vendor con MP | Cae a token de Moovy, todo el dinero va a Moovy | Alto: el comercio no recibe al instante |

---

## VEREDICTO FINAL

Moovy tiene una arquitectura de pagos bien encaminada con MercadoPago Marketplace, pero está lejos de ser un circuito financiero completo. Las brechas más críticas son:

1. **Sin rendición de efectivo** → riesgo financiero real desde el día 1.
2. **Sin refund real en MP** → los compradores reembolsados no reciben su dinero.
3. **Sin gate de verificación MP** → el dinero puede ir a Moovy en vez del comercio.
4. **Sin wallet del repartidor** → no hay forma de pagar ni controlar a los repartidores.

El diferenciador de "pago instantáneo al comercio" **funciona técnicamente** si el comercio tiene MP vinculado (gracias al split). Pero necesita los gates, refresh de tokens, y fallbacks mencionados para ser confiable en producción.

**Recomendación**: No lanzar con efectivo hasta tener rendición básica. Lanzar primero solo con MercadoPago (forzando vinculación), implementar las 7 brechas P0 (estimado: 2-3 semanas de desarrollo), y luego habilitar efectivo.



---

# Archivo: `docs/auditorias/auditoria-portal-repartidor.md`

# Auditoría UX — Portal Repartidor MOOVY

**Fecha:** 15 de marzo de 2026
**Auditor:** Análisis experto de UX para aplicaciones de delivery
**Alcance:** Portal completo del repartidor (`/repartidor/*`)

---

## 1. Resumen Ejecutivo

El portal del repartidor tiene una base sólida con un dashboard centrado en mapa, sistema de ofertas de pedidos en tiempo real y navegación GPS integrada. Sin embargo, presenta problemas serios de **navegación redundante**, **funcionalidades mock sin conectar a APIs reales**, y **fricciones innecesarias** para un usuario que opera con las manos ocupadas (manejando moto/bici, cargando paquetes).

**Veredicto general:** El portal necesita simplificación, consolidación de navegación y conexión real de datos antes de ser usable en producción.

---

## 2. Inventario de Pantallas

| Pantalla | Ruta | Estado | Datos |
|----------|------|--------|-------|
| Dashboard principal | `/repartidor/dashboard` | Funcional | API real |
| Pedidos (lista) | `/repartidor/pedidos` | Parcial | API real pero botones muertos |
| Ganancias (página) | `/repartidor/ganancias` | Mock | Datos hardcodeados |
| Historial (página) | `/repartidor/historial` | Mock | Datos hardcodeados |
| Perfil (página) | `/repartidor/perfil` | Funcional | API real |
| Soporte (página) | `/repartidor/soporte` | Funcional | API real + polling |
| Login | `/repartidor/login` | Funcional | Delegado a componente compartido |
| Registro | `/repartidor/registro` | Funcional | Wizard 4 pasos completo |
| EarningsView (SPA) | Vista interna dashboard | Mock | Datos hardcodeados |
| HistoryView (SPA) | Vista interna dashboard | Mock | Datos hardcodeados |
| ProfileView (SPA) | Vista interna dashboard | Funcional | API real |
| SettingsView (SPA) | Vista interna dashboard | Stub | Solo placeholder |
| SupportView (SPA) | Vista interna dashboard | Funcional | API real |

---

## 3. Problema #1: Triple Navegación Redundante (CRÍTICO)

Este es el problema más grave del portal. Existen **tres sistemas de navegación paralelos** que compiten entre sí:

### 3.1 Bottom Tab Bar (RiderBottomNav)
4 tabs fijos en la parte inferior: Inicio, Ganancias, Historial, Perfil.

### 3.2 Sidebar / Drawer (Sidebar.tsx)
Menú hamburguesa lateral con 6 opciones: Dashboard, Historial, Mis ganancias, Soporte, Mi Perfil, Configuración.

### 3.3 Quick Actions en el Dashboard
2 botones rápidos en la vista principal: Historial y Resumen (ganancias).

### Inconsistencias detectadas

| Concepto | Bottom Nav | Sidebar | Quick Actions |
|----------|-----------|---------|---------------|
| Ganancias | "Ganancias" | "Mis ganancias" | "Resumen" |
| Perfil | "Perfil" | "Mi Perfil" | No existe |
| Soporte | No existe | "Soporte" | No existe |
| Configuración | No existe | "Configuración" | No existe |
| Historial | "Historial" | "Historial" | "Historial" |

**Impacto:** El repartidor no sabe cuál es la navegación principal. Con las manos ocupadas, tener que decidir entre 3 formas de llegar al mismo lugar es inaceptable.

**Recomendación:** Eliminar el sidebar completamente. La bottom nav debe ser el único sistema de navegación. Reorganizar a 5 tabs: Inicio, Pedidos, Ganancias, Soporte, Perfil (con Configuración dentro de Perfil).

---

## 4. Problema #2: Páginas Duplicadas (CRÍTICO)

Existen **dos versiones** de las mismas pantallas:

| Funcionalidad | Página standalone | Vista SPA en dashboard |
|---------------|------------------|----------------------|
| Ganancias | `/repartidor/ganancias` | `EarningsView.tsx` |
| Historial | `/repartidor/historial` | `HistoryView.tsx` |
| Perfil | `/repartidor/perfil` | `ProfileView.tsx` |
| Soporte | `/repartidor/soporte` | `SupportView.tsx` |

Ambas versiones tienen datos mock y UI ligeramente diferentes. Esto genera:
- Doble mantenimiento de código.
- Comportamiento inconsistente (una puede tener datos reales y la otra mock).
- Confusión sobre cuál es la "correcta".

**Recomendación:** Elegir UN enfoque (SPA views dentro del dashboard o páginas separadas) y eliminar el otro. El enfoque SPA es mejor para repartidores porque evita recargas de página y mantiene el mapa/GPS activo en segundo plano.

---

## 5. Problema #3: Datos Mock en Producción (CRÍTICO)

Las siguientes pantallas muestran datos inventados, no conectados a ninguna API:

### Ganancias (EarningsView + /ganancias)
- Array hardcodeado de 7 días con valores fijos.
- El selector "Esta semana / Este mes" cambia visualmente pero muestra los mismos datos.
- Comparación con "semana anterior" usa `previousTotal = 38000` hardcodeado.

### Historial (HistoryView + /historial)
- Array hardcodeado de 6 entregas con fechas de enero 2026.
- Filtros "Todas/Completadas/Canceladas" funcionan localmente sobre datos falsos.
- Ratings son estáticos (4 o 5 estrellas siempre).

**Impacto:** Si un repartidor ve ganancias que no coinciden con la realidad, pierde confianza total en la app.

**Recomendación:** Conectar ambas vistas a APIs reales. El endpoint `/api/driver/orders?status=historial` ya existe y devuelve datos reales. Para ganancias, crear un endpoint `/api/driver/earnings` que agregue datos de `deliveryFee` por período.

---

## 6. Problema #4: Botones Muertos y Funcionalidad Fantasma

### Página de Pedidos (`/repartidor/pedidos`)
- Botón **"Ver Detalles"** en pedidos activos: no tiene `onClick` handler. No hace nada.
- Botón **"Actualizar"** en pedidos activos: no tiene `onClick` handler. No hace nada.
- Botón **"Ver Comprobante"** en historial: no tiene `onClick` handler. No hace nada.

### Sidebar
- **Historial**, **Mis ganancias**, **Soporte**, **Mi Perfil**, **Configuración**: todos tienen `href="#"` (enlaces muertos). Solo "Dashboard" tiene enlace real.

### Dashboard
- Botón **"Aceptar"** en ofertas: funcional, pero tras aceptar solo hace `fetchDashboard(true)` sin feedback visual claro de éxito. El toast solo aparece desde la página de Pedidos.

### SettingsView
- Página completamente vacía. Solo muestra "Próximamente: Ajustes de la aplicación".

**Impacto:** Botones que no hacen nada destruyen la confianza del usuario y generan frustración.

**Recomendación:** Eliminar todos los botones sin funcionalidad. Es mejor no mostrar un botón que mostrar uno roto. Si la funcionalidad está "próximamente", indicarlo con un badge, no con un botón clickeable.

---

## 7. Problema #5: Ergonomía para Manos Ocupadas

### Lo que está bien
- El mapa como elemento central es correcto (un repartidor vive en el mapa).
- Toggle online/offline grande y accesible.
- Bottom sheet arrastrable para ver navegación sin soltar el manubrio.
- Ofertas de pedidos con botones grandes ("Aceptar" / "Rechazar").
- GPS integrado con navegación turn-by-turn.

### Lo que está mal

**a) `window.confirm()` para aceptar pedidos**
En `/repartidor/pedidos`, aceptar un pedido lanza un `window.confirm("¿Aceptar este pedido?")`. Esto es un popup nativo del browser que:
- Requiere precisión para tocar "Aceptar" en el diálogo nativo (targets pequeños).
- Rompe la experiencia mobile (los diálogos nativos se ven diferentes en cada browser).
- Añade un paso innecesario (el repartidor ya tocó "Aceptar Pedido").

**b) Tabs de 3 opciones en Pedidos**
Los tabs "Disponibles / Activos / Historial" son demasiado granulares. Un repartidor en movimiento no necesita hacer arqueología de sus pedidos antiguos desde la misma pantalla donde acepta nuevos.

**c) Sidebar requiere gesto de hamburguesa + scroll + tap**
Tres pasos para llegar a cualquier opción del sidebar. Con una mano en el manubrio, esto es peligroso.

**d) Ocultar/mostrar ganancias con Eye icon**
El botón de ojo para ocultar ganancias (`showEarnings` toggle) es una funcionalidad de "privacidad" que nadie usa mientras reparte. Ocupa espacio y añade complejidad visual.

**e) No hay gestos de swipe**
Para cambiar entre pedidos activos o para avanzar el estado de un pedido, el repartidor debe tocar botones específicos. Un swipe (deslizar) sería mucho más rápido y seguro mientras se conduce.

---

## 8. Problema #6: Flujo de Estado del Pedido Incompleto

Desde el dashboard, el repartidor puede aceptar un pedido y ver la navegación GPS. Sin embargo, no hay un flujo claro para avanzar los estados del pedido:

| Estado | Acción del repartidor | UI actual |
|--------|----------------------|-----------|
| DRIVER_ASSIGNED | Ir al comercio | Solo muestra mapa |
| DRIVER_ARRIVED | Avisar que llegó al comercio | No hay botón |
| PICKED_UP | Confirmar que recogió el pedido | No hay botón visible |
| IN_DELIVERY | En camino al cliente | Automático |
| DELIVERED | Confirmar entrega | No hay botón visible |

El endpoint `/api/driver/orders/[id]/status` existe, pero no hay botones en la UI del dashboard que lo invoquen de forma clara. El repartidor no tiene forma de avanzar el flujo de entrega paso a paso.

**Recomendación:** Agregar un botón de acción principal grande en el bottom sheet que cambie según el estado: "Llegué al comercio" > "Pedido recogido" > "Entregado". Un solo botón, una sola acción, sin menús.

---

## 9. Problema #7: Polling Excesivo vs Socket.IO

El dashboard hace polling cada 5 segundos (`setInterval 5000ms`) para refrescar datos. Sin embargo, la app ya tiene Socket.IO configurado. El soporte hace polling cada 3 segundos para mensajes nuevos.

**Impacto:**
- Consume batería del celular del repartidor (que necesita durar todo el turno).
- Consume datos móviles innecesariamente.
- Latencia de hasta 5 segundos para ver un nuevo pedido (en delivery, cada segundo cuenta).

**Recomendación:** Migrar a Socket.IO para notificaciones de nuevos pedidos y cambios de estado. Dejar polling solo como fallback con intervalo de 30 segundos.

---

## 10. Lo Que Funciona Bien

No todo es negativo. Estos elementos están bien diseñados:

1. **Dashboard centrado en mapa:** Correcto para un repartidor. El mapa es lo primero que necesita ver.

2. **Sistema de ofertas con timer:** Las ofertas de pedido muestran ganancia estimada, distancia al comercio, distancia al cliente y tiempo estimado. Esto permite tomar decisiones rápidas.

3. **Pantalla de GPS sin señal:** Diseño cuidado con instrucciones paso a paso para habilitar GPS. Incluye botón de "Compartir ubicación" y "Refrescar".

4. **Bottom sheet arrastrable:** Permite ver instrucciones de navegación sin ocupar toda la pantalla. Tres estados (minimizado, medio, expandido) dan flexibilidad.

5. **Navegación turn-by-turn:** Integrada con iconos de maniobras (girar izquierda, derecha, U-turn, etc.), distancia al próximo giro y destino.

6. **Registro en 4 pasos:** Wizard bien estructurado con validación condicional (documentos diferentes para bici vs moto/auto), uploads de documentos y aceptación de términos.

7. **Soporte por chat:** Funcional con API real, mensajes en tiempo real (polling), badges de no leídos y formulario de nueva consulta.

8. **Push notifications:** Integradas con prompt al usuario y manejo de permisos.

---

## 11. Recomendaciones Priorizadas

### Prioridad 1 — Críticas (antes de producción)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Eliminar sidebar, dejar solo bottom nav como navegación única | Medio | Alto |
| 2 | Eliminar páginas standalone duplicadas (usar solo SPA views) | Medio | Alto |
| 3 | Conectar Ganancias y Historial a APIs reales | Alto | Crítico |
| 4 | Agregar botón de avance de estado del pedido en el bottom sheet | Alto | Crítico |
| 5 | Eliminar `window.confirm()`, usar slide-to-confirm o modal propio | Bajo | Alto |
| 6 | Eliminar o deshabilitar todos los botones sin funcionalidad | Bajo | Alto |

### Prioridad 2 — Mejoras importantes

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 7 | Migrar polling a Socket.IO para pedidos nuevos | Medio | Alto |
| 8 | Agregar feedback háptico (vibración) al aceptar/rechazar pedido | Bajo | Medio |
| 9 | Simplificar tabs de Pedidos: solo "Nuevos" y "En curso" | Bajo | Medio |
| 10 | Eliminar toggle de ocultar ganancias (innecesario para el contexto) | Bajo | Bajo |

### Prioridad 3 — Experiencia premium

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 11 | Agregar swipe-to-advance para cambiar estado del pedido | Medio | Alto |
| 12 | Modo nocturno automático (repartidores nocturnos) | Medio | Medio |
| 13 | Indicador de batería baja con recomendación de ahorro | Bajo | Medio |
| 14 | Botón directo para llamar al cliente desde el pedido activo | Bajo | Alto |
| 15 | Resumen de turno al ponerse offline (ganaste X, hiciste Y entregas) | Medio | Medio |

---

## 12. Comparación con Apps de Referencia

| Feature | Rappi Driver | PedidosYa Rider | MOOVY actual |
|---------|-------------|-----------------|--------------|
| Navegación única | Bottom nav | Bottom nav | Triple (nav + sidebar + quick actions) |
| Avance de estado | Slide-to-confirm | Botón grande | No existe |
| Datos en vivo | Socket/Push | Socket/Push | Polling 5s |
| Modo offline | Caché local | Caché local | No existe |
| Resumen de turno | Al cerrar | Al cerrar | No existe |
| Llamar cliente | 1 tap | 1 tap | No accesible |
| Dark mode | Automático | Manual | No existe |

---

## 13. Conclusión

El portal tiene un buen cimiento técnico (mapa, GPS, navegación, sistema de ofertas). Los problemas principales son de **arquitectura de UX** (triple navegación, páginas duplicadas) y de **completitud** (datos mock, botones muertos, flujo de estado incompleto).

La recomendación principal es: **simplificar antes de agregar**. Consolidar la navegación, eliminar lo que no funciona, conectar datos reales y crear el flujo de avance de estado del pedido. Con esos cambios, el portal pasa de ser un prototipo a ser una herramienta usable para repartidores en producción.



---

# Archivo: `docs/auditorias/auditoria-ux-cro-moovy.md`

# Auditoría UX/UI y CRO — Landing MOOVY

**Fecha:** 15 de marzo de 2026
**Auditor:** Análisis senior UX/CRO — Marketplaces delivery LATAM
**Objeto:** Página principal (`/`) de somosmoovy.com

---

## 1. Primera impresión (5 segundos)

**¿Qué entiendo que hace MOOVY?** Que es un delivery de productos de comercios locales en Ushuaia. Eso queda más o menos claro, pero depende enteramente de lo que digan los slides del hero — si el slide activo en ese momento es el de marketplace o el de comunidad, el mensaje se diluye.

**¿Value proposition clara?** No. No hay un headline estático, permanente, que diga qué es MOOVY. Todo depende de un slider rotativo. Si el usuario llega y el slide visible es uno genérico, no entiende la propuesta en 5 segundos. Rappi tiene "Todo lo que necesitás, en minutos" fijo, siempre visible. PedidosYa tiene "¿Qué querés pedir?" con un buscador. MOOVY no tiene nada equivalente.

**¿CTA principal visible?** El CTA está *dentro* del slider, posicionado con `absolute bottom-6`. Eso significa que depende del contenido del slide actual. No hay un CTA persistente above the fold.

**¿Jerarquía visual?** Compiten: el slider hero, la barra de social proof, y las categorías. Las tres secciones están empaquetadas con muy poco breathing room (el hero tiene pt-3 y las categorías pt-4). Se siente todo apilado sin una pausa visual que guíe el ojo.

---

## 2. Análisis sección por sección

### 2.1 Header

**Qué hace bien:**
- Logo centrado en mobile es un patrón estándar de delivery apps.
- El carrito con badge rojo es visible y funcional.
- Buscador global con debounce es un buen feature.
- El saludo "Hola, [nombre]" da cercanía, muy apropiado para ciudad chica.

**Qué hace mal:**
- En mobile, hay 4-5 íconos comprimidos a la derecha (search, puntos, bell, carrito) con `gap-0.5`. Es un clutter zone. En pantallas de 320px esto se vuelve ilegible.
- "Ushuaia" como location para usuarios no logueados no linkea a nada ni ofrece contexto. En Rappi, el location abre un selector de dirección. Acá es decorativo.
- No hay link a "Ingresar" en mobile para usuarios no logueados — solo aparece en desktop.
- El botón de carrito en desktop dice "Carrito" con texto, pero en mobile es solo ícono. Inconsistencia menor pero el label en desktop ocupa espacio innecesario.

**Cambio concreto:**
- En mobile, eliminar el badge de puntos del header (moverlo al perfil). Dejar solo: search, bell/pedidos, carrito. Tres íconos máximo.
- Agregar un botón "Ingresar" visible en mobile para no-logueados, reemplazando el ícono de bell que no se usa si no estás logueado.

### 2.2 Hero Slider

**Qué hace bien:**
- Soporta imágenes reales con overlay para legibilidad.
- Touch swipe funciona. Auto-slide con intervalo configurable.
- La ilustración SVG del delivery es simpática cuando no hay imagen.

**Qué hace mal:**
- **Problema crítico:** No hay headline estático. El slider ES el hero. Si no hay slides en la DB (`slides.length === 0`), el hero **desaparece completamente** (`return null`). El usuario ve directamente las categorías. Esto es una bomba de tiempo operativa.
- El CTA está posicionado con `absolute bottom-6` lo cual lo desconecta visualmente del texto del slide. Parece flotar.
- `min-h-[260px]` en mobile es mucho espacio para un slider que el usuario va a scrollear rápido. El contenido importante (comercios, productos) queda lejos.
- Los dots de navegación son muy pequeños (w-2 h-2) para dedos en mobile.

**Cambio concreto:**
- Agregar un hero estático fallback que siempre aparezca, independiente de los slides. Headline: **"Todo Ushuaia en tu puerta"**, subtítulo: **"Pedí de comercios locales y recibí en minutos"**, CTA: **"Explorar comercios"**. Los slides se superponen como carousel solo si existen.
- Reducir `min-h` en mobile a 200px. El hero en mobile de delivery apps (Rappi, PedidosYa) es compacto: título + buscador/CTA + listo.
- Mover el CTA del slider a posición relativa (no absolute). Que fluya con el contenido.

### 2.3 Social Proof Banner ("X pedidos hoy en Ushuaia")

**Qué hace bien:**
- El dot verde pulsante da sensación de actividad en vivo.
- Específico a Ushuaia — ancla la experiencia local.
- Solo aparece si `todayOrders > 0`, evitando el ridículo de "0 pedidos hoy".

**Qué hace mal:**
- Si hay 2 pedidos a las 10am, "2 pedidos hoy en Ushuaia" se siente patético, no como social proof. Para una ciudad de 80k, necesitás un umbral mínimo.
- La posición es correcta (post-hero) pero el diseño es tan sutil (text-sm, green-50 bg) que pasa desapercibido.

**Cambio concreto:**
- Mostrar solo si `todayOrders >= 5` (o un umbral configurable). Debajo de 5, no mostrarlo.
- Alternativamente, usar métricas acumuladas: **"Más de 1.200 pedidos entregados en Ushuaia"** (lifetime count). Esto siempre crece y siempre impresiona.
- Hacerlo más prominente: fondo `bg-[#e60012]` con texto blanco, o integrado al hero como un badge.

### 2.4 Categorías

**Qué hace bien:**
- Íconos en círculos rojos son visualmente coherentes con la marca.
- En mobile, el auto-scroll dual (una fila derecha, otra izquierda) es visualmente dinámico y llama la atención.

**Qué hace mal:**
- El título "Explorá por Categoría" es genérico y no motivante. No dice por qué debería explorar.
- En mobile, las categorías se triplican (`[...categories, ...categories, ...categories]`) para el scroll infinito. Con 6 categorías, son 18 items x 2 filas = 36 cards renderizadas. Si hay pocas categorías (2-3), se ven repetidas de forma obvia.
- Las categorías usan íconos de Lucide genéricos (Milk, Wine, Sandwich). No son fotos reales de productos de Ushuaia. En una ciudad chica, mostrar fotos del kiosco de la esquina convierte más que un ícono vectorial.
- `w-28` en mobile es angosto — el texto se trunca con `truncate`. "Sandwichería" probablemente se corta.

**Cambio concreto:**
- Cambiar título a: **"¿Qué querés pedir?"** — directo, orientado a acción.
- Usar imágenes reales en las categorías (fotos de productos locales) en vez de íconos. Si no hay fotos, al menos usar íconos más grandes y descriptivos.
- Eliminar el auto-scroll infinito en mobile. Usar una fila única scrolleable con snap. El movimiento automático distrae y compite con el hero slider.

### 2.5 Comercios Cercanos

**Qué hace bien:**
- Grid responsivo (1-2-3-4 columnas) bien implementado.
- MerchantCard tiene la información esencial: nombre, rating, tiempo de delivery, fee, estado abierto/cerrado.
- El badge "ABIERTO/CERRADO" es claro.
- "Envío Gratis" en verde es un buen motivador.
- HeartButton para favoritos agrega engagement.

**Qué hace mal:**
- El título "Comercios Cercanos" es engañoso — no hay geolocalización implementada. Son todos los comercios de Ushuaia. Decir "cercanos" cuando no hay distancia real crea expectativas falsas.
- Se muestran hasta 12 comercios (`take: 12`), pero si hay 3-4 abiertos y 8 cerrados, la grilla se llena de comercios cerrados. Eso es anti-conversión. El usuario ve una pared de "CERRADO" y piensa que la app no funciona.
- El empty state ("Estamos sumando comercios cada dia") tiene un ícono genérico a baja opacidad. No tiene CTA ni esperanza concreta.
- El `aspect-video` para la imagen del comercio es 16:9, lo cual en mobile (col-1) es un rectángulo enorme que empuja el contenido hacia abajo.

**Cambio concreto:**
- Cambiar título a **"Comercios en Ushuaia"** — honesto y local.
- Limitar comercios cerrados a máximo 2 visibles. Mostrar primero los abiertos, y debajo un texto: **"X comercios más abren mañana"** con link a ver todos.
- En el empty state, agregar CTA: **"¿Tenés un comercio? Sumate a MOOVY"** linkeando a `/comercio/registro`.

### 2.6 Productos Recomendados

**Qué hace bien:**
- Grid de 2 columnas en mobile es correcto para browsing de productos.
- Badge "Destacado" en rojo sobre la imagen funciona.
- Precio en rojo y grande, bien visible.
- Badges de "Sin Stock" y "Cerrado" informan al usuario.

**Qué hace mal:**
- El título "Productos Recomendados" no dice recomendados por quién ni por qué. Es genérico.
- No hay botón "Agregar al carrito" directo desde la card — el usuario tiene que entrar al detalle para comprar. En PedidosYa, el botón "+" está en la card. Esto reduce conversión mediblemente.
- Mostrar productos de comercios cerrados o sin stock en la home es desperdicio de espacio. El usuario ve algo que quiere, hace click, y se frustra.
- La sección tiene `py-12 lg:py-16` — excesivo padding vertical que aleja el contenido del marketplace debajo.

**Cambio concreto:**
- Cambiar título a **"Lo más pedido"** o **"Populares ahora"** — más urgente y social.
- Agregar botón "+" de agregar al carrito en cada card (como hace PedidosYa).
- Filtrar en el query: solo productos de comercios abiertos y con stock > 0. El query actual es `where: { isActive: true, isFeatured: true }` — falta `merchant: { isOpen: true }` y `stock: { gt: 0 }`.
- Reducir padding a `py-8 lg:py-10`.

### 2.7 Marketplace

**Qué hace bien:**
- ListingCard incluye info del vendedor (avatar, nombre, rating) que da confianza.
- Badge de condición (Nuevo/Usado/Reacondicionado) es informativo.
- Badge de disponibilidad del vendedor (Abierto/Cerrado/Vuelve en X min) es un buen toque.

**Qué hace mal:**
- El título es solo **"Marketplace"** en rojo. Cero contexto. Un usuario nuevo de Ushuaia no sabe qué es el marketplace de MOOVY ni en qué se diferencia de la sección de comercios de arriba.
- Solo se muestran 4 listings (`take: 4`). Si hay pocos, la sección se ve vacía. Si hay muchos, 4 no es suficiente muestra.
- La sección completa desaparece si no hay listings (`recentListings.length > 0`). No hay estado vacío con CTA para vendedores.

**Cambio concreto:**
- Cambiar título a **"Marketplace — Comprá y vendé entre vecinos"** o **"De particular a particular en Ushuaia"**.
- Agregar subtítulo: **"Encontrá productos únicos de vendedores de tu ciudad"**.
- Mostrar 6-8 listings en vez de 4.
- Cuando no hay listings, mostrar un CTA: **"Vendé lo que ya no usás — Es gratis publicar"** → `/vendedor/registro`.

### 2.8 Cómo Funciona MOOVY

**Qué hace bien:**
- 3 pasos simples (Elegí, Pagá, Recibí) es un patrón probado.
- Emojis como íconos son ligeros y universales.
- Copy conciso en cada paso.

**Qué hace mal:**
- El subtítulo "Comprar en Ushuaia nunca fue tan facil" (sin acento en "fácil") tiene un error ortográfico.
- Los emojis (🛒 💳 🚀) se ven diferentes en cada SO/browser. En Android viejo pueden verse mal.
- La sección está demasiado abajo en el scroll. Un usuario nuevo debería ver esto ANTES de los productos, para entender el servicio.
- No hay un CTA después de los 3 pasos. El usuario lee "Recibí" y luego... nada. Debería haber un botón.

**Cambio concreto:**
- Corregir a **"Comprar en Ushuaia nunca fue tan fácil"**.
- Reemplazar emojis por íconos SVG o de Lucide para consistencia cross-platform.
- Mover esta sección ARRIBA, entre el social proof banner y las categorías. Es el lugar donde Rappi y PedidosYa ponen su "cómo funciona" para nuevos usuarios.
- Agregar CTA al final: **"Empezá a pedir"** → `/productos`.

### 2.9 Sección "¿Listo para comprar?"

**Qué hace bien:**
- CTA grande y claro ("Ver Productos").
- Copy directo.

**Qué hace mal:**
- Es una sección de cierre genérica sin diferenciación. "Explorá nuestro catálogo y encontrá todo lo que necesitás" podría ser de cualquier e-commerce del mundo.
- El CTA "Ver Productos" repite lo que ya hay en "Comercios Cercanos > Ver todos" y "Productos Recomendados > Ver todos". Tres CTAs al mismo destino (`/productos`).
- No hay CTA alternativo para vendedores/comercios/repartidores que llegaron a la home.

**Cambio concreto:**
- Transformar en una sección de doble CTA: **"Pedí ahora"** (buyer) y **"Sumate como comercio o repartidor"** (supply side). En una ciudad de 80k, reclutar oferta es tan importante como captar demanda.
- Texto: **"¿Tenés un comercio, sos repartidor o querés vender tus cosas? MOOVY te conecta con todo Ushuaia."**

### 2.10 Footer (en page.tsx — el duplicado)

**Nota:** Hay un footer inline en `page.tsx` (líneas 440-493) Y un componente `Footer.tsx` separado. Esto sugiere que el footer de la home es diferente al footer global. El de `page.tsx` es más simple; el de `Footer.tsx` es más completo.

**Qué hace bien (Footer.tsx):**
- Links a registro de repartidor y comercio — captación de supply side.
- "Hecho con ❤️ en Ushuaia" — toque local que construye cercanía.
- Links legales completos (cookies, devoluciones, cancelaciones, términos por rol).

**Qué hace mal:**
- Los social links (Instagram, Facebook, Twitter) apuntan a `href="#"` — no hay redes reales configuradas. Un usuario que hace click se queda en la misma página. Esto destruye credibilidad.
- "Consultas por WhatsApp" no tiene link a WhatsApp. Debería ser un `wa.me/549XXXXXXX`.
- Sección "Soporte" tiene 10 links — demasiados. Nadie lee 10 links legales en un footer. Los términos por rol (vendedor, repartidor, comercio) deberían estar solo en los flujos de registro respectivos.
- El footer de `page.tsx` no usa el componente `Footer.tsx`. Inconsistencia.

**Cambio concreto:**
- Usar `Footer.tsx` en la home también, no el footer inline.
- Conectar Instagram y WhatsApp con links reales o remover los íconos de redes inexistentes.
- Reducir links legales a 4: Términos, Privacidad, Devoluciones, Ayuda. El resto va dentro de Ayuda.
- Agregar un CTA de WhatsApp real con ícono verde y número visible. En Ushuaia, WhatsApp > email.

---

## 3. Jerarquía de información

### Orden actual:
1. Hero Slider
2. Social Proof Banner
3. Categorías
4. Comercios Cercanos
5. Productos Recomendados
6. Marketplace
7. Cómo Funciona
8. ¿Listo para comprar?
9. Footer

### Problemas:
- "Cómo funciona" está en posición 7. Un usuario nuevo nunca llega ahí — ya abandonó o ya compró. Esta sección es para explicar el servicio *antes* de mostrar producto.
- Hay tres secciones de catálogo seguidas (comercios, productos, marketplace) sin diferenciación clara. El usuario no entiende por qué hay 3 grillas distintas.
- No hay sección de testimonios/reviews, no hay sección de descarga de app (si la hay como PWA), no hay sección de beneficios diferenciadores.

### Orden propuesto:
1. **Hero estático** — Headline fijo + CTA + buscador integrado
2. **Social proof** — Métrica acumulada, no diaria
3. **Cómo funciona** — 3 pasos, para nuevos usuarios
4. **Categorías** — Punto de entrada rápido
5. **Comercios abiertos** — Solo abiertos, máximo 8
6. **Productos populares** — Solo disponibles, con botón "+"
7. **Marketplace** — Con copy explicativo
8. **Doble CTA** — Comprador + supply side (comercio/repartidor/vendedor)
9. **Footer**

**Justificación:** El patrón probado en LATAM es: propuesta de valor → confianza → cómo funciona → catálogo. No al revés.

---

## 4. Análisis de CTAs

### CTAs visibles:
1. **Botón del slide activo** (texto variable, dentro del hero) — CTA primario implícito
2. **"Ver todos"** en Comercios Cercanos → `/productos`
3. **"Ver todos"** en Productos Recomendados → `/productos`
4. **"Ver todo"** en Marketplace → `/marketplace`
5. **"Ver Productos"** en sección cierre → `/productos`
6. **"Carrito"** en header desktop
7. **Ícono carrito** en header mobile
8. **"Ingresar"** en header desktop (no-logueados)

### Problemas:
- **3 CTAs van a `/productos`**: "Ver todos" (comercios), "Ver todos" (productos), "Ver Productos" (cierre). Redundancia que diluye.
- **No hay CTA de registro/login** en mobile para usuarios no logueados. Es la acción más importante para retención y no tiene botón visible.
- **No hay CTA sticky en mobile.** Cuando el usuario scrollea las 9 secciones, el único CTA visible es el carrito en el header. Rappi y PedidosYa tienen un bottom bar persistente.
- **Falta CTA "Quiero vender" o "Registrar mi comercio"** en la home. Solo está en el footer.

### CTAs faltantes críticos:
- **Bottom bar mobile** con: Home, Buscar, Pedidos, Perfil (patrón estándar delivery apps)
- **CTA "Registrate" o "Ingresar"** visible en mobile
- **CTA "Sumate como comercio"** en la home, no solo en el footer

---

## 5. Copy & Messaging

### Títulos genéricos vs. específicos:
| Título actual | Problema | Alternativa propuesta |
|---|---|---|
| "Explorá por Categoría" | Genérico, no motivante | **"¿Qué querés pedir?"** |
| "Comercios Cercanos" | Engañoso (no hay geo) | **"Comercios en Ushuaia"** |
| "Productos Recomendados" | Pasivo, sin urgencia | **"Lo más pedido"** |
| "Marketplace" | No explica nada | **"Comprá y vendé entre vecinos"** |
| "¿Listo para comprar?" | Genérico de template | **"Todo Ushuaia a un click"** |

### Prueba social:
- El banner de pedidos diarios es la única prueba social. No hay reviews, testimonios, cantidad de comercios, ni métricas de satisfacción.
- Falta: **"Ya somos +X comercios en MOOVY"** o **"4.8 promedio de satisfacción"**.

### Urgencia/escasez:
- No hay ningún elemento de urgencia. No hay ofertas con tiempo limitado, no hay "últimas unidades", no hay "delivery gratis hasta las X". Para una app nueva en una ciudad chica, algún incentivo temporal ayuda a la primera compra.

### Los 3 peores títulos reescritos:
1. ~~"Explorá por Categoría"~~ → **"¿Qué te pinta pedir?"** (coloquial argentino, orientado a acción)
2. ~~"Productos Recomendados"~~ → **"Lo más pedido en Ushuaia"** (social proof + local)
3. ~~"Explorá nuestro catálogo y encontrá todo lo que necesitás"~~ → **"Tu primer pedido te llega en minutos — probá MOOVY"** (beneficio concreto + CTA implícito)

---

## 6. Diseño visual y consistencia

### Paleta de colores:
- Rojo `#e60012` como primario: transmite energía y urgencia, coherente con delivery. Pero se usa en TODO — títulos, badges, botones, gradientes, acentos. Cuando todo es rojo, nada destaca.
- Fondos alternados white/gray-50 entre secciones es correcto pero predecible.
- No hay color secundario definido. El amarillo/amber de los puntos MOOVER, el verde de "Abierto", el azul de "Verificado" son funcionales pero no de marca.

### Tipografía:
- Junegull para el logotipo es distintiva.
- Poppins como font del body es legible y moderna.
- La jerarquía de tamaños es aceptable (2xl-3xl para títulos, sm-base para cuerpo).
- Pero los títulos de sección siguen todos el mismo patrón: "Palabra <span rojo>Palabra</span>". Es un pattern que se vuelve predecible después de la segunda sección.

### Espaciado:
- Las secciones de comercios y productos tienen buen breathing room.
- Pero el hero + social proof + categorías están comprimidos (pt-3, pt-4, py-4). Se siente apretado en el above-the-fold.

### Imágenes:
- Las categorías usan íconos de Lucide — genéricos.
- MerchantCard y ListingCard muestran imágenes reales (si existen) o placeholders grises genéricos.
- El hero tiene una ilustración SVG inline del repartidor que es simpática pero amateur comparada con las fotos profesionales de Rappi/PedidosYa.

### Consistencia:
- Cards de comercio vs cards de producto tienen estilos diferentes (bordes, padding, sombras). MerchantCard tiene `shadow-sm hover:shadow-lg`, ProductCard tiene solo `border border-gray-100 rounded-xl`. Debería unificarse.
- Dos footers diferentes (inline en page.tsx y componente Footer.tsx) es una inconsistencia de implementación.

---

## 7. Mobile-first

### ¿Nativa o "desktop achicado"?
Mayormente mobile-first, con buenas decisiones:
- Header diferenciado para mobile vs desktop.
- Categorías con scroll horizontal en mobile.
- Grid responsive en comercios/productos.

### Problemas mobile:
- **No hay bottom navigation bar.** Toda app de delivery tiene tabs abajo: Home, Buscar, Pedidos, Perfil. MOOVY no tiene ninguna. El usuario tiene que volver al header para todo. Esto es el problema mobile #1.
- El header mobile tiene demasiados íconos apilados (search + puntos + bell + carrito).
- El hero slider con min-h 260px en mobile ocupa más de la mitad de la pantalla. El contenido real (comercios) está debajo del fold.
- Las categorías con doble fila auto-scroll son dinámicas pero pueden causar motion sickness y no son clickeables fácilmente en movimiento.
- La sección "Cómo funciona" apila las 3 cards en columna (md:grid-cols-3 → cols-1 en mobile). Con padding, ocupa 3+ pantallas completas de scroll.

### Cambios concretos mobile:
- Agregar **bottom navigation bar** fija: Inicio, Buscar, Mis Pedidos, Mi Perfil. Es el cambio #1 más importante para mobile.
- Reducir hero a max 180px de alto en mobile.
- Categorías en fila única, sin auto-scroll, snap scroll manual.
- "Cómo funciona" en mobile: 3 items horizontales scrolleables, no apilados.

---

## 8. Confianza y credibilidad

### Señales de trust presentes:
- Badge "Verificado" en comercios.
- Rating con estrellas en comercios y vendedores.
- Métodos de pago mencionados (MercadoPago, efectivo).
- Links legales completos (términos, privacidad, devoluciones, etc.).
- "X pedidos hoy" como social proof.

### Señales de trust faltantes:
- **No hay testimonios/reviews** de compradores reales visibles en la home.
- **No hay logos de comercios conocidos** de Ushuaia. En una ciudad de 80k, la gente conoce los locales. Mostrar "La Anónima", "Panadería X", "Kiosco Y" como logos en un banner genera trust instantáneo.
- **No hay fotos reales de Ushuaia** — ni de las calles, ni de repartidores reales, ni de comercios. Todo es genérico.
- **No hay sección "Pagás seguro"** con logos de MercadoPago/Visa/Mastercard. La confianza en pagos online es crítica en Argentina.
- **No hay número de WhatsApp visible** para soporte. En Ushuaia, la gente quiere poder escribir por WhatsApp si algo sale mal.
- **Redes sociales apuntan a "#"** — si no hay redes, no mostrar los íconos.

### ¿El social proof es creíble?
Con 80k habitantes y una app nueva, "3 pedidos hoy" puede ser la realidad pero se ve mal. Mejor usar métricas acumuladas que siempre crecen.

---

## 9. Performance percibido

### Loading states:
- Hay loading skeletons para `/productos` y `/marketplace` (archivos `loading.tsx`), lo cual es bueno.
- Pero la home page es un server component con `force-dynamic` y `revalidate = 0`. Cada visita hace 6 queries a la DB (slides, categories, merchants, products, listings, todayStats). Si la DB es lenta, el usuario ve pantalla blanca.

### Imágenes:
- MerchantCard usa `<img>` nativo en vez de `next/Image`. Esto significa sin lazy loading automático, sin optimización de tamaño, sin WebP conversion. Con 12 comercios cargando imágenes de portada, el First Contentful Paint se va a resentir.
- Lo mismo para ListingCard y las product cards.
- El hero sí usa `next/Image` con `priority` — correcto.

### Sugerencias:
- Reemplazar `<img>` por `next/Image` en MerchantCard y ListingCard para lazy loading y optimización automática.
- Agregar un `loading.tsx` para la home page con skeleton del hero + categorías.
- Considerar ISR (Incremental Static Regeneration) con `revalidate = 60` en vez de `force-dynamic`. Los datos de la home no cambian cada segundo.

---

## 10. Top 5 cambios de mayor impacto

### 1. Agregar bottom navigation bar en mobile
**Qué cambiar:** Crear un componente `BottomNav` fijo en mobile con 4 tabs: Inicio (home icon), Buscar (search), Mis Pedidos (package), Mi Perfil (user). Estilo: fondo blanco, borde top sutil, ícono activo en rojo `#e60012`. Height: 56px. Con safe-area-inset-bottom para iPhone.

**Por qué:** Es el patrón universal #1 en apps de delivery LATAM. Sin bottom nav, la navegación depende del header (zona incómoda para el pulgar) y no hay acceso directo a funciones clave. Rappi, PedidosYa, iFood, Didi Food — todos tienen bottom nav. Su ausencia hace que MOOVY se sienta como "sitio web" y no como "app".

**Esfuerzo:** Medio (componente nuevo + layout adjustment).

### 2. Hero estático con value proposition fija + buscador
**Qué cambiar:** Reemplazar el hero slider como elemento principal por un bloque estático: fondo rojo/gradiente MOOVY, título **"Todo Ushuaia en tu puerta"** (text-3xl bold white), subtítulo **"Comercios, productos y marketplace — delivery en minutos"** (text-base white/80), y un search bar prominente (w-full, rounded-full, placeholder "¿Qué querés pedir?"). El slider puede quedar debajo como carousel promocional secundario de menor altura.

**Por qué:** El slider actual no comunica la propuesta de valor de forma confiable. Si el slide es irrelevante, el usuario no entiende qué es MOOVY. Un headline fijo + buscador es el patrón que usan Rappi y PedidosYa porque resuelve las dos preguntas del usuario: "¿qué es esto?" y "¿cómo busco lo que quiero?".

**Esfuerzo:** Medio (reestructurar hero section).

### 3. Filtrar productos no disponibles y agregar botón "+" al carrito
**Qué cambiar:** En las queries de la home, filtrar `merchant.isOpen: true` y `stock > 0` para productos, y vendedores online para marketplace. Agregar un botón circular "+" en la esquina inferior derecha de cada product card que agregue al carrito directamente (sin entrar al detalle).

**Por qué:** Mostrar productos de comercios cerrados o sin stock genera frustración (click → decepción → abandono). El botón "+" reduce la fricción de conversión de 3 pasos (ver card → click → ver detalle → agregar) a 1 paso (ver card → "+"). PedidosYa reporta +20% de add-to-cart con botón directo en card.

**Esfuerzo:** Bajo-Medio (query filter + botón en card).

### 4. Agregar sección de trust con logos de medios de pago y comercios locales
**Qué cambiar:** Crear una franja horizontal entre "Cómo funciona" y las categorías con: logos de MercadoPago, Visa, Mastercard (miniaturizados, grises) + texto **"Pagás seguro con MercadoPago o en efectivo"** + cantidad de comercios activos (**"Ya somos +X comercios"**). Si hay logos de comercios conocidos de Ushuaia, mostrarlos en fila.

**Por qué:** Argentina tiene alta desconfianza en pagos online. Mostrar los logos de los procesadores de pago reduce la ansiedad de compra. Y en una ciudad de 80k, ver el logo de una panadería que conocés genera confianza inmediata.

**Esfuerzo:** Bajo (sección estática con assets).

### 5. CTA de captación supply-side visible en la home
**Qué cambiar:** Antes del footer, agregar una sección con 3 cards horizontales (scrolleable en mobile): **"Registrá tu comercio"** (→ `/comercio/registro`), **"Sé repartidor MOOVY"** (→ `/repartidor/registro`), **"Vendé tus cosas"** (→ `/vendedor/registro`). Diseño: fondo dark (gray-900), cards con borde y gradiente sutil, CTA blanco en cada una.

**Por qué:** En un marketplace bilateral de ciudad chica, reclutar oferta (comercios + repartidores + vendedores) desde la home es igual de importante que convertir compradores. Actualmente estos CTAs solo están enterrados en el footer. Un growth hack de PedidosYa en ciudades nuevas fue exactamente esto: secciones prominentes de reclutamiento en la home.

**Esfuerzo:** Bajo (sección estática con links).

---

*Fin de la auditoría. Todos los cambios sugeridos están priorizados por impacto en conversión y factibilidad técnica dentro del stack actual de MOOVY (Next.js + Tailwind + Prisma).*



---

# Archivo: `docs/auditorias/AUDIT_EMAILS.md`

# Auditoría Completa del Sistema de Emails — MOOVY

**Fecha**: 20 de marzo de 2026
**Alcance**: 180 emails analizados en 13 categorías
**Proyecto**: Moovy — Marketplace + Delivery (Ushuaia, Tierra del Fuego)

---

## ENTREGABLE 1 — Inventario Cruzado de Emails

### Estado actual del sistema

**Emails implementados: 8 de 180 (4.4%)**

| Email implementado | Función | Archivo | Línea | Trigger |
|---|---|---|---|---|
| Bienvenida comprador | `sendWelcomeEmail()` | `src/lib/email.ts` | L19 | POST `/api/auth/register` (L152) |
| Confirmación de pedido (cash) | `sendOrderConfirmationEmail()` | `src/lib/email.ts` | L73 | POST `/api/orders` (L507-519) |
| Confirmación de pedido (MP) | `sendOrderConfirmationEmail()` | `src/lib/email.ts` | L73 | Webhook MP approved (L187-199) |
| Reset de contraseña | `sendPasswordResetEmail()` | `src/lib/email.ts` | L190 | POST `/api/auth/forgot-password` (L50) |
| Contraseña cambiada | Inline transporter | `src/app/api/auth/change-password/route.ts` | L95 | POST `/api/auth/change-password` |
| Solicitud repartidor (→ admin) | `sendDriverRequestNotification()` | `src/lib/email.ts` | L233 | POST `/api/auth/activate-driver` (L39) |
| Repartidor aprobado | `sendDriverApprovalEmail()` | `src/lib/email.ts` | L273 | PUT `/api/admin/drivers/[id]/approve` (L53) |
| MOOVY X interés (→ prospecto + admin) | Inline transporter | `src/app/api/moovyx/register/route.ts` | L27-87 | POST `/api/moovyx/register` |

---

### Inventario completo: 180 emails × estado

#### CATEGORÍA 1 — Registro y Onboarding

**1.1 — Comprador**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 1 | Bienvenida | ✅ Implementado | `src/lib/email.ts` L19 | HTML inline, responsive, con código referido | POST `/api/auth/register` éxito | P0 |
| 2 | Verificación de email | ❌ Falta | — | — | No existe verificación de email | P1 |
| 3 | Verificación de teléfono | ❌ Falta | — | — | No existe verificación de teléfono | P2 |
| 4 | Perfil completado | ❌ Falta | — | — | — | P3 |
| 5 | Primera compra incentivo | ❌ Falta | — | — | — | P2 |

**1.2 — Comercio / Vendedor**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 6 | Solicitud recibida | ❌ Falta | — | — | POST `/api/auth/register/merchant` no envía email al comercio | P0 |
| 7 | Verificación de email comercio | ❌ Falta | — | — | — | P1 |
| 8 | Documentación pendiente | ❌ Falta | — | — | — | P1 |
| 9 | Tienda aprobada | ❌ Falta | — | — | El admin verifica desde OPS pero no se envía email | P0 |
| 10 | Tienda rechazada | ❌ Falta | — | — | — | P0 |
| 11 | Bienvenida + onboarding | ❌ Falta | — | — | — | P1 |
| 12 | Vinculación MercadoPago | ❌ Falta | — | — | — | P2 |
| 13 | Datos bancarios confirmados | ❌ Falta | — | — | — | P2 |

**1.3 — Repartidor**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 14 | Solicitud recibida | ⚠️ Parcial | `src/lib/email.ts` L233 | Solo notifica al ADMIN, NO al repartidor | POST `/api/auth/activate-driver` | P0 |
| 15 | Verificación de email | ❌ Falta | — | — | — | P1 |
| 16 | Documentación pendiente | ❌ Falta | — | — | — | P1 |
| 17 | Aprobado como repartidor | ✅ Implementado | `src/lib/email.ts` L273 | HTML con CTA al panel rider | PUT `/api/admin/drivers/[id]/approve` | P0 |
| 18 | Rechazado como repartidor | ❌ Falta | — | — | — | P0 |
| 19 | Bienvenida + onboarding | ❌ Falta | — | — | — | P1 |

---

#### CATEGORÍA 2 — Autenticación y Seguridad

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 20 | Recuperar contraseña | ✅ Implementado | `src/lib/email.ts` L190 | Link con token 1h expiración | POST `/api/auth/forgot-password` | P0 |
| 21 | Contraseña cambiada | ✅ Implementado | `change-password/route.ts` L95 | HTML con fecha/hora y alerta "¿No fuiste vos?" | POST `/api/auth/change-password` éxito | P0 |
| 22 | Email cambiado | ❌ Falta | — | — | — | P1 |
| 23 | Teléfono cambiado | ❌ Falta | — | — | — | P2 |
| 24 | Login desde nuevo dispositivo | ❌ Falta | — | — | — | P1 |
| 25 | Intentos de login fallidos | ❌ Falta | — | — | — | P2 |
| 26 | Cuenta bloqueada | ❌ Falta | — | — | — | P1 |
| 27 | Cuenta desbloqueada | ❌ Falta | — | — | — | P2 |
| 28 | MFA/2FA activado | ❌ Falta | — | — | No existe 2FA en el sistema | P3 |
| 29 | MFA/2FA desactivado | ❌ Falta | — | — | — | P3 |
| 30 | Sesiones cerradas | ❌ Falta | — | — | — | P3 |
| 31 | Datos personales actualizados | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 3 — Ciclo de Vida del Pedido (Comprador)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 32 | Pedido confirmado | ✅ Implementado | `src/lib/email.ts` L73 | HTML itemizado con precios, dirección, método de pago | POST `/api/orders` (cash) + webhook MP (approved) | P0 |
| 33 | Pago aprobado | ⚠️ Parcial | — | Se fusiona con #32 (confirmación = pago OK). No hay email separado para "pago aprobado" | — | P1 |
| 34 | Pago pendiente | ❌ Falta | — | — | — | P0 |
| 35 | Pago rechazado | ❌ Falta | — | — | Webhook MP con status rejected no envía email | P0 |
| 36 | Pedido aceptado por comercio | ❌ Falta | — | — | Socket emit existe pero no email | P1 |
| 37 | Pedido rechazado por comercio | ❌ Falta | — | — | — | P0 |
| 38 | Pedido en preparación | ❌ Falta | — | — | Solo push notification | P2 |
| 39 | Repartidor asignado | ❌ Falta | — | — | Solo push notification | P2 |
| 40 | Pedido en camino | ❌ Falta | — | — | Solo push notification | P1 |
| 41 | Pedido entregado | ❌ Falta | — | — | Solo push notification | P0 |
| 42 | Pedido cancelado por comprador | ❌ Falta | — | — | — | P0 |
| 43 | Pedido cancelado por comercio | ❌ Falta | — | — | — | P0 |
| 44 | Pedido cancelado por sistema | ❌ Falta | — | — | merchant-timeout existe pero no envía email | P0 |
| 45 | Reembolso procesado | ❌ Falta | — | — | POST `/api/ops/refund` no envía email | P0 |
| 46 | Reembolso parcial | ❌ Falta | — | — | — | P1 |
| 47 | Pedido con problema reportado | ❌ Falta | — | — | — | P1 |
| 48 | Problema resuelto | ❌ Falta | — | — | — | P1 |
| 49 | Calificación recordatorio | ❌ Falta | — | — | — | P2 |
| 50 | Comprobante / factura | ❌ Falta | — | — | — | P1 |

---

#### CATEGORÍA 4 — Ciclo de Vida del Pedido (Comercio)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 51 | Nuevo pedido recibido | ❌ Falta | — | — | Solo push notification vía socket | P0 |
| 52 | Recordatorio pedido sin aceptar | ❌ Falta | — | — | merchant-timeout cancela pero no notifica por email | P0 |
| 53 | Pedido cancelado (comprador) | ❌ Falta | — | — | — | P1 |
| 54 | Pedido cancelado (sistema) | ❌ Falta | — | — | — | P1 |
| 55 | Repartidor asignado al pedido | ❌ Falta | — | — | — | P2 |
| 56 | Pedido retirado por repartidor | ❌ Falta | — | — | — | P2 |
| 57 | Pedido entregado | ❌ Falta | — | — | — | P1 |
| 58 | Reclamo de comprador | ❌ Falta | — | — | — | P1 |
| 59 | Reclamo resuelto | ❌ Falta | — | — | — | P2 |
| 60 | Calificación recibida | ❌ Falta | — | — | POST rate-merchant no envía email | P2 |
| 61 | Calificación negativa alerta | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 5 — Ciclo de Vida del Pedido (Repartidor)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 62 | Pedido asignado | ❌ Falta | — | — | Solo push notification | P1 |
| 63 | Pedido reasignado | ❌ Falta | — | — | — | P2 |
| 64 | Pedido cancelado | ❌ Falta | — | — | — | P1 |
| 65 | Entrega confirmada | ❌ Falta | — | — | — | P2 |
| 66 | Propina recibida | ❌ Falta | — | — | — | P3 |
| 67 | Calificación recibida | ❌ Falta | — | — | — | P3 |
| 68 | Calificación negativa alerta | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 6 — Emails Financieros (Comprador)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 69 | Resumen de compra | ⚠️ Parcial | — | El email #32 incluye desglose, pero no es un comprobante formal post-entrega | — | P1 |
| 70 | Método de pago agregado | ❌ Falta | — | — | — | P3 |
| 71 | Método de pago eliminado | ❌ Falta | — | — | — | P3 |
| 72 | Transferencia pendiente recordatorio | ❌ Falta | — | — | — | P1 |
| 73 | Transferencia confirmada | ❌ Falta | — | — | — | P1 |
| 74 | Cupón recibido | ❌ Falta | — | — | No existe sistema de cupones | P2 |
| 75 | Cupón por vencer | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 7 — Emails Financieros (Comercio)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 76 | Pago recibido (por pedido) | ❌ Falta | — | — | El comercio cobra instantáneamente pero no recibe email | P0 |
| 77 | Resumen diario de ventas | ❌ Falta | — | — | — | P1 |
| 78 | Resumen semanal de ventas | ❌ Falta | — | — | — | P2 |
| 79 | Resumen mensual + facturación | ❌ Falta | — | — | — | P1 |
| 80 | Factura de comisión Moovy | ❌ Falta | — | — | — | P2 |
| 81 | Cambio en tasa de comisión | ❌ Falta | — | — | — | P1 |
| 82 | Problema con cuenta de MP | ❌ Falta | — | — | — | P0 |
| 83 | Problema con CBU/CVU | ❌ Falta | — | — | — | P1 |
| 84 | Contracargo recibido | ❌ Falta | — | — | — | P1 |
| 85 | Contracargo resuelto | ❌ Falta | — | — | — | P2 |
| 86 | Rendición de efectivo pendiente | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 8 — Emails Financieros (Repartidor)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 87 | Resumen diario de ganancias | ❌ Falta | — | — | — | P2 |
| 88 | Resumen semanal | ❌ Falta | — | — | — | P2 |
| 89 | Liquidación / pago procesado | ❌ Falta | — | — | — | P1 |
| 90 | Retiro solicitado | ❌ Falta | — | — | — | P2 |
| 91 | Retiro procesado | ❌ Falta | — | — | — | P2 |
| 92 | Retiro rechazado | ❌ Falta | — | — | — | P2 |
| 93 | Efectivo pendiente de rendir | ❌ Falta | — | — | — | P1 |
| 94 | Rendición de efectivo confirmada | ❌ Falta | — | — | — | P2 |
| 95 | Alerta efectivo acumulado alto | ❌ Falta | — | — | — | P1 |
| 96 | Deuda neteada | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 9 — Gestión de Tienda (Comercio)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 97 | Producto aprobado | ❌ Falta | — | — | — | P2 |
| 98 | Producto rechazado | ❌ Falta | — | — | — | P2 |
| 99 | Producto con stock bajo | ❌ Falta | — | — | — | P2 |
| 100 | Producto sin stock | ❌ Falta | — | — | — | P1 |
| 101 | Tienda pausada por inactividad | ❌ Falta | — | — | — | P2 |
| 102 | Tienda suspendida | ❌ Falta | — | — | OPS puede suspender pero no envía email | P0 |
| 103 | Tienda reactivada | ❌ Falta | — | — | — | P1 |
| 104 | Horario de atención actualizado | ❌ Falta | — | — | — | P3 |
| 105 | Zona de delivery modificada | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 10 — Gestión de Cuenta del Repartidor

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 106 | Documentación por vencer | ❌ Falta | — | — | No hay tracking de vencimiento | P1 |
| 107 | Documentación vencida | ❌ Falta | — | — | — | P1 |
| 108 | Documentación actualizada | ❌ Falta | — | — | — | P2 |
| 109 | Cuenta suspendida | ❌ Falta | — | — | — | P0 |
| 110 | Cuenta reactivada | ❌ Falta | — | — | — | P1 |
| 111 | Zona/horario actualizado | ❌ Falta | — | — | — | P3 |
| 112 | Nivel/categoría alcanzado | ❌ Falta | — | — | Niveles MOOVER existen pero no notifican | P2 |
| 113 | Bono o incentivo ganado | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 11 — Administrativos y de Sistema

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 114 | Solicitud eliminación de cuenta | ❌ Falta | — | — | POST `/api/profile/delete` existe pero no envía email | P0 |
| 115 | Cuenta eliminada | ❌ Falta | — | — | — | P0 |
| 116 | Cambios en TyC | ❌ Falta | — | — | — | P1 |
| 117 | Cambios en política privacidad | ❌ Falta | — | — | — | P1 |
| 118 | Mantenimiento programado | ❌ Falta | — | — | — | P2 |
| 119 | Incidente resuelto | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 12 — Engagement y Retención

**Comprador**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 120 | Carrito abandonado | ❌ Falta | — | — | Carrito es Zustand client-side, no persiste en server | P2 |
| 121 | Win-back 15 días | ❌ Falta | — | — | — | P2 |
| 122 | Win-back 30 días | ❌ Falta | — | — | — | P3 |
| 123 | Nuevo comercio en tu zona | ❌ Falta | — | — | — | P3 |
| 124 | Promo comercio favorito | ❌ Falta | — | — | — | P3 |
| 125 | Cumpleaños | ❌ Falta | — | — | No se guarda fecha de nacimiento | P3 |
| 126 | Aniversario en la plataforma | ❌ Falta | — | — | — | P3 |
| 127 | Pedido recurrente sugerido | ❌ Falta | — | — | — | P3 |

**Comercio**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 128 | Tips para vender más | ❌ Falta | — | — | — | P3 |
| 129 | Estadísticas mensuales | ❌ Falta | — | — | — | P2 |
| 130 | Oportunidad de promoción | ❌ Falta | — | — | — | P3 |
| 131 | Inactividad del comercio | ❌ Falta | — | — | — | P2 |

**Repartidor**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 132 | Resumen desempeño semanal | ❌ Falta | — | — | — | P2 |
| 133 | Zona con alta demanda | ❌ Falta | — | — | — | P3 |
| 134 | Incentivo activo | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 13 — Emails para el Owner de MOOVY

**13.1 — Alertas financieras críticas**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 135 | Pasarela de pagos caída | ❌ Falta | P0 |
| 136 | Webhooks no se reciben | ❌ Falta | P0 |
| 137 | Split de pago falló al comercio | ❌ Falta | P0 |
| 138 | Contracargo recibido | ❌ Falta | P1 |
| 139 | Reembolsos inusuales | ❌ Falta | P1 |
| 140 | Repartidor con efectivo alto | ❌ Falta | P1 |
| 141 | Efectivo global sin rendir | ❌ Falta | P2 |
| 142 | Liquidación a repartidor falló | ❌ Falta | P1 |
| 143 | Facturación AFIP falló | ❌ Falta | P2 |
| 144 | Ingresos diarios anómalos | ❌ Falta | P2 |

**13.2 — Alertas de seguridad y sistema**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 145 | Servidor caído | ❌ Falta | P0 |
| 146 | Tasa de errores HTTP alta | ❌ Falta | P1 |
| 147 | Base de datos en riesgo | ❌ Falta | P1 |
| 148 | Intentos acceso panel admin | ❌ Falta | P1 |
| 149 | Posible fraude de usuario | ❌ Falta | P1 |
| 150 | Creación masiva de cuentas | ❌ Falta | P2 |
| 151 | Scraping detectado | ❌ Falta | P3 |
| 152 | Certificado SSL por vencer | ❌ Falta | P2 |
| 153 | Vulnerabilidad en dependencia | ❌ Falta | P2 |
| 154 | Backup falló | ❌ Falta | P1 |
| 155 | Datos sensibles en logs | ❌ Falta | P1 |

**13.3 — Alertas operativas del negocio**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 156 | Nuevo comercio solicita registro | ❌ Falta | P1 |
| 157 | Nuevo repartidor solicita registro | ⚠️ Parcial — notifica al admin pero sin link directo de acción | P1 |
| 158 | Comercio con calificación en caída | ❌ Falta | P2 |
| 159 | Repartidor con calificación en caída | ❌ Falta | P2 |
| 160 | Reclamos sin responder | ❌ Falta | P1 |
| 161 | Pedidos sin repartidor | ❌ Falta | P0 |
| 162 | Zona sin cobertura | ❌ Falta | P1 |
| 163 | Comercio no responde pedidos | ❌ Falta | P1 |
| 164 | Comercio con alta tasa de rechazo | ❌ Falta | P2 |
| 165 | Delivery demorado sistémico | ❌ Falta | P2 |
| 166 | Primer pedido comercio nuevo | ❌ Falta | P3 |

**13.4 — Reportes periódicos ejecutivos**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 167 | Reporte diario resumido | ❌ Falta | P0 |
| 168 | Reporte semanal de negocio | ❌ Falta | P1 |
| 169 | Reporte mensual financiero | ❌ Falta | P1 |
| 170 | Reporte mensual de crecimiento | ❌ Falta | P2 |
| 171 | Reporte de salud de la plataforma | ❌ Falta | P2 |

**13.5 — Alerts de compliance y legales**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 172 | Comercio sin datos fiscales | ❌ Falta | P1 |
| 173 | Umbral facturación AFIP | ❌ Falta | P1 |
| 174 | Solicitud eliminación de datos | ❌ Falta | P0 |
| 175 | Vencimiento de habilitaciones | ❌ Falta | P2 |
| 176 | Usuario reportó contenido ilegal | ❌ Falta | P1 |

**13.6 — Hitos y celebraciones**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 177 | Hito de pedidos | ❌ Falta | P3 |
| 178 | Hito de comercios | ❌ Falta | P3 |
| 179 | Hito de facturación | ❌ Falta | P3 |
| 180 | Récord diario de pedidos | ❌ Falta | P3 |

---

### Resumen numérico

| Estado | Cantidad | % |
|---|---|---|
| ✅ Implementado | 6 | 3.3% |
| ⚠️ Parcial | 3 | 1.7% |
| ❌ Falta | 171 | 95.0% |
| **Total** | **180** | **100%** |

Por prioridad de los faltantes:

| Prioridad | Cantidad | Descripción |
|---|---|---|
| **P0** | 27 | Obligatorios para lanzar |
| **P1** | 53 | Importantes primer mes |
| **P2** | 52 | Segundo mes |
| **P3** | 39 | Nice-to-have |

---

## ENTREGABLE 2 — Análisis de Infraestructura de Emails

### Servicio de envío

**Servicio**: Nodemailer con Gmail SMTP (smtp.gmail.com:587, TLS)

**Configuración actual** (de `.env` y `src/lib/email.ts`):
- Host: `smtp.gmail.com`
- Puerto: `587` (STARTTLS)
- Auth: Gmail App Password (16 chars)
- From: `"MOOVY" <somosmoovy@gmail.com>`

**Problemas críticos**:

1. **Gmail tiene límite de 500 emails/día** (2000 con Google Workspace). Para producción con múltiples comercios y usuarios, esto es insuficiente. Un día con 100 pedidos ya genera ~300-500 emails solo transaccionales.

2. **No es un servicio transaccional dedicado**: Gmail no ofrece estadísticas de entrega, tasas de apertura, bounce handling, ni cumple con los estándares de deliverability que requiere una plataforma de marketplace.

3. **Credenciales duplicadas**: Hay 3 instancias de `nodemailer.createTransport()` — una centralizada en `email.ts` y dos inline en `change-password/route.ts` y `moovyx/register/route.ts`. Inconsistencia de mantenimiento.

### Cola de emails (queue/worker)

**Estado: NO EXISTE**. Todos los emails se envían de forma síncrona dentro del request HTTP. Si el SMTP tarda o falla, el response del API se retrasa pero no se rompe (try-catch silencioso).

**Riesgo**: Si Gmail tiene un timeout de 30s, el usuario espera 30s adicionales en su request. Si el email falla, se pierde para siempre — nadie se entera.

### Retry automático

**Estado: NO EXISTE**. Los 8 emails implementados usan try-catch que loguea a `console.error` y sigue. Si falla, el email se pierde definitivamente. No hay dead letter queue, no hay reintento, no hay alerta.

### Logging de emails enviados

**Estado: NO EXISTE**. Solo hay `console.log("[Email] Welcome email sent to:", email)`. No hay tabla en la base de datos, no hay registro persistente. Imposible auditar si un email se envió o no, o diagnosticar quejas de usuarios.

### Tracking (apertura / clic)

**Estado: NO EXISTE**. No hay pixel de tracking ni redirección de links. Imposible medir tasas de apertura, engagement, o efectividad de los emails.

### SPF, DKIM, DMARC

**Estado: PARCIAL POR DEFECTO**. Al enviar desde `@gmail.com`, Google gestiona SPF y DKIM automáticamente. Sin embargo, si migran a un dominio propio (`@somosmoovy.com`), necesitarán configurar:
- SPF: registro TXT en DNS de somosmoovy.com
- DKIM: firma del servicio de email
- DMARC: política de rechazo

**Actualmente**: Los emails salen como `somosmoovy@gmail.com`, lo cual es aceptable para MVP pero no profesional para producción.

### Templates responsive

**Estado: SÍ, BÁSICO**. Los templates usan `max-width: 600px; margin: 0 auto` lo cual los hace razonablemente responsive. Usan inline CSS (correcto para email). Sin embargo:
- No tienen dark mode support
- No usan `<table>` para layout (algunos clientes de email no soportan `<div>` bien)
- No hay media queries para mobile
- El `grid-template-columns` en order confirmation NO funciona en Outlook

### Branding de Moovy

**Estado: SÍ, PARCIAL**. Todos los templates incluyen:
- Logo: `https://somosmoovy.com/logo-moovy.png` (NOTA: es el PNG viejo, el nuevo es SVG)
- Gradiente rojo MOOVY (`#e60012` a `#ff4d5e`)
- Footer: `© MOOVY™. Ushuaia, Tierra del Fuego.`
- Pero: el logo apunta a un PNG que está en la deuda técnica como "requiere reemplazo"

### Sistema de templates centralizado

**Estado: NO**. Cada email tiene su HTML inline embebido en la función. No hay base template compartido, no hay header/footer reutilizable, no hay sistema de layouts. Si cambia el logo o el footer, hay que editar 8+ lugares.

### Unsubscribe en emails marketing

**Estado: NO EXISTE**. Ningún email tiene link de unsubscribe. Para emails transaccionales (confirmación pedido, reset password) no es obligatorio. Pero para emails de engagement (cuando se implementen) es **obligatorio por ley** (CAN-SPAM, GDPR, Ley 25.326 Argentina).

### Preferencias de notificaciones

**Estado: PARCIAL**. El perfil del usuario tiene toggle de notificaciones push en `mi-perfil/page.tsx`, pero NO hay preferencias para emails. No existe campo `emailPreferences` en el modelo User.

---

## ENTREGABLE 3 — Lista Priorizada de Emails Faltantes

### P0 — Obligatorios para lanzar (27 emails)

Sin estos, el negocio no puede operar de forma confiable. Los usuarios quedan sin información crítica.

**Flujo de pedido (comprador) — 7 emails**:
- #34 Pago pendiente — El comprador no sabe si su pago se procesó
- #35 Pago rechazado — Sin este, el comprador piensa que pagó cuando no
- #37 Pedido rechazado por comercio — Dinero cobrado, pedido cancelado, usuario sin info
- #41 Pedido entregado — Confirmación + invitación a calificar
- #42 Pedido cancelado por comprador — Estado del reembolso
- #43 Pedido cancelado por comercio — Motivo + reembolso
- #44 Pedido cancelado por sistema — Timeout, sin repartidor
- #45 Reembolso procesado — El comprador DEBE saber que le devolvieron la plata

**Onboarding comercio — 3 emails**:
- #6 Solicitud recibida (comercio) — El comercio se registra y no recibe ningún email
- #9 Tienda aprobada — Se activa su tienda y no se entera por email
- #10 Tienda rechazada — Se rechaza y no sabe por qué

**Onboarding repartidor — 2 emails**:
- #14 Solicitud recibida (al repartidor, no solo al admin) — El repartidor no sabe si se registró bien
- #18 Rechazado como repartidor — Se rechaza y no se entera

**Comercio operativo — 2 emails**:
- #51 Nuevo pedido recibido — Email de backup si push falla o está apagado
- #76 Pago recibido (por pedido) — Diferenciador del negocio: el comercio cobra al instante y debe saberlo

**Repartidor operativo — 1 email**:
- #109 Cuenta suspendida — Sin este, el repartidor no sabe por qué no le llegan pedidos

**Comercio moderación — 1 email**:
- #102 Tienda suspendida — El comercio pierde ventas y no sabe por qué

**Administrativo — 2 emails**:
- #114 Solicitud eliminación de cuenta — Obligatorio legalmente (GDPR/Ley 25.326)
- #115 Cuenta eliminada — Confirmación legal

**Owner — 4 emails**:
- #135 Pasarela de pagos caída — Sin esto el owner no se entera que la plataforma está rota
- #136 Webhooks no se reciben — Pedidos quedan en limbo
- #137 Split de pago falló — Comercio no cobró, riesgo operativo
- #145 Servidor caído / downtime — El negocio está muerto y nadie sabe
- #161 Pedidos sin repartidor — Compradores esperando, experiencia destruida
- #167 Reporte diario resumido — Visibilidad mínima del negocio
- #174 Solicitud eliminación de datos — Plazo legal, compliance obligatorio

### P1 — Importantes primer mes (53 emails)

Mejoran confianza, seguridad y operación del día a día.

- #2 Verificación de email
- #7 Verificación email comercio
- #8 Documentación pendiente (comercio)
- #11 Bienvenida + onboarding comercio
- #15 Verificación email repartidor
- #16 Documentación pendiente (repartidor)
- #19 Bienvenida + onboarding repartidor
- #22 Email cambiado
- #24 Login nuevo dispositivo
- #26 Cuenta bloqueada
- #33 Pago aprobado (separado de confirmación)
- #36 Pedido aceptado por comercio
- #40 Pedido en camino
- #46 Reembolso parcial
- #47 Pedido con problema reportado
- #48 Problema resuelto
- #50 Comprobante / factura
- #52 Recordatorio pedido sin aceptar
- #53 Pedido cancelado por comprador (→ comercio)
- #54 Pedido cancelado por sistema (→ comercio)
- #57 Pedido entregado (→ comercio con desglose)
- #58 Reclamo de comprador (→ comercio)
- #62 Pedido asignado (→ repartidor)
- #64 Pedido cancelado (→ repartidor)
- #69 Resumen de compra formal
- #72 Transferencia pendiente recordatorio
- #73 Transferencia confirmada
- #77 Resumen diario de ventas (comercio)
- #79 Resumen mensual + facturación (comercio)
- #81 Cambio en tasa de comisión
- #82 Problema con cuenta de MP (comercio)
- #83 Problema con CBU/CVU
- #89 Liquidación / pago procesado (repartidor)
- #93 Efectivo pendiente de rendir
- #95 Alerta efectivo acumulado alto
- #100 Producto sin stock
- #103 Tienda reactivada
- #106 Documentación por vencer
- #107 Documentación vencida
- #110 Cuenta reactivada (repartidor)
- #116 Cambios en TyC
- #117 Cambios política privacidad
- #138 Contracargo recibido (owner)
- #139 Reembolsos inusuales (owner)
- #140 Repartidor con efectivo alto (owner)
- #146 Tasa errores HTTP alta (owner)
- #147 Base de datos en riesgo (owner)
- #148 Intentos acceso panel admin (owner)
- #149 Posible fraude (owner)
- #154 Backup falló (owner)
- #155 Datos sensibles en logs (owner)
- #156 Nuevo comercio solicita registro (owner)
- #160 Reclamos sin responder (owner)
- #162 Zona sin cobertura (owner)
- #163 Comercio no responde pedidos (owner)
- #168 Reporte semanal (owner)
- #169 Reporte mensual financiero (owner)
- #172 Comercio sin datos fiscales (owner)
- #173 Umbral facturación AFIP (owner)
- #176 Usuario reportó contenido ilegal (owner)

### P2 — Segundo mes (52 emails)

Retención, engagement, métricas. Los emails de la lista #3-5, #12-13, #23, #25, #27, #38-39, #49, #55-56, #59-61, #63, #65, #74, #78, #80, #84-88, #90-92, #94, #96-99, #101, #108, #112, #118-122, #129, #131-132, #141-144, #150, #152-153, #158-159, #164-165, #170-171, #175.

### P3 — Nice-to-have (39 emails)

Gamification, celebrations, advanced engagement. Los emails #4, #28-31, #66-68, #70-71, #75, #104-105, #111, #113, #122-128, #130, #133-134, #151, #166, #177-180.

---

## ENTREGABLE 4 — Análisis de Infraestructura Actual y Problemas

### Problemas detectados en el código actual

**1. Logo roto en emails de producción**
```
const companyLogo = "https://somosmoovy.com/logo-moovy.png";
```
El CLAUDE.md dice: "logo-moovy.png (PNG viejo) — aún referenciados en emails, requieren reemplazo en producción por versiones rojas actualizadas". Todos los emails en producción muestran un logo desactualizado o potencialmente roto.

**2. Link roto en email de aprobación repartidor**
```typescript
// email.ts L291
href="${baseUrl}/rider"
```
La ruta del portal repartidor es `/repartidor`, no `/rider`. Este link lleva a un 404.

**3. Transporter duplicado sin centralizar**
`change-password/route.ts` y `moovyx/register/route.ts` crean sus propios transporters inline en lugar de usar el centralizado de `email.ts`. Si cambian credenciales SMTP, hay que recordar cambiar en 3 lugares.

**4. Email de confirmación no se envía en todos los flujos de pago**
En `api/orders/route.ts`, el email de confirmación solo se envía para pagos en efectivo (L507-519). Para MercadoPago, se envía desde el webhook (L187-199). Pero si el webhook falla o se retrasa, el comprador no recibe confirmación. No hay verificación de que el email se haya enviado.

**5. Sin fallback si SMTP falla**
Si Gmail está caído, los 8 emails del sistema simplemente se pierden. No hay cola, no hay retry, no hay proveedor alternativo.

**6. console.log expone emails en producción**
```typescript
console.log("[Email] Welcome email sent to:", email);
```
Todos los emails enviados se loguean con la dirección del destinatario en la consola de producción.

---

## ENTREGABLE 5 — Arquitectura Recomendada de Emails

### Servicio recomendado: Resend

**¿Por qué Resend y no otros?**

| Criterio | Gmail SMTP (actual) | SendGrid | Resend | Amazon SES |
|---|---|---|---|---|
| Límite free | 500/día | 100/día | 3000/mes | 62.000/mes (solo con EC2) |
| Precio escalable | No escala | $19.95/mes 50k | $20/mes 50k | $0.10/1000 |
| API moderna (REST) | No | Sí | Sí (TypeScript native) | Sí |
| React Email support | No | No | Sí (creadores) | No |
| Dashboard analytics | No | Sí | Sí | Básico |
| Webhooks (bounce/open) | No | Sí | Sí | Sí |
| Setup para Next.js | Nodemailer | SDK pesado | 1 línea import | SDK pesado |
| Dominio custom | Requiere Workspace | Sí | Sí | Sí |

**Resend es ideal para Moovy** porque: es TypeScript nativo, se integra con Next.js en 1 import, tiene plan free de 3000 emails/mes (suficiente para el lanzamiento en Ushuaia), soporta React Email para templates, tiene dashboard de analytics, y escala a $20/mes para 50k emails.

### Arquitectura propuesta

```
[Evento en la app] → [emailQueue.add()] → [Worker procesa cola] → [Resend API] → [Webhook bounce/delivery] → [EmailLog DB]
                                                                                                                      ↓
                                                                                               [Retry automático si falla]
```

**Componentes**:

1. **`src/lib/email-service.ts`** — Servicio centralizado con Resend SDK
2. **`src/lib/email-queue.ts`** — Cola en memoria (para MVP) o BullMQ (para escala)
3. **`src/lib/email-templates/`** — Templates con React Email (JSX → HTML)
4. **`src/app/api/webhooks/email/route.ts`** — Webhook de Resend para bounce/delivery tracking
5. **Modelo `EmailLog`** en Prisma — Registro de cada email enviado
6. **Modelo `EmailPreference`** en Prisma — Preferencias por usuario

### Modelo de datos propuesto

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  to          String
  subject     String
  template    String   // e.g., "order_confirmed", "welcome"
  status      String   // "sent", "delivered", "bounced", "failed"
  resendId    String?  // ID devuelto por Resend
  userId      String?
  orderId     String?
  metadata    Json?    // datos adicionales
  error       String?  // error si falló
  attempts    Int      @default(1)
  openedAt    DateTime?
  clickedAt   DateTime?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([template])
  @@index([status])
  @@index([createdAt])
}

model EmailPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  transactional   Boolean  @default(true)  // siempre true, no se puede desactivar
  orderUpdates    Boolean  @default(true)
  marketing       Boolean  @default(true)
  weeklyReport    Boolean  @default(true)
  dailyReport     Boolean  @default(true)  // solo para comercios/repartidores
  securityAlerts  Boolean  @default(true)  // siempre true, no se puede desactivar

  user            User     @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### Configuración SPF, DKIM, DMARC para somosmoovy.com

```dns
; SPF — permitir Resend y Google enviar desde somosmoovy.com
somosmoovy.com.  TXT  "v=spf1 include:_spf.google.com include:send.resend.com ~all"

; DKIM — Resend provee el registro al verificar dominio
resend._domainkey.somosmoovy.com.  TXT  "v=DKIM1; k=rsa; p=MIGf..."

; DMARC — política de cuarentena (no reject inicialmente)
_dmarc.somosmoovy.com.  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@somosmoovy.com; pct=100"
```

---

## ENTREGABLE 6 — Mapa Visual de Touchpoints

### COMPRADOR

```
Registro ──→ [1 Bienvenida ✅] ──→ [2 Verificar email ❌]
                                          │
                                          ▼
                                   Primera compra
                                          │
         ┌────────────────────────────────┤
         ▼                                ▼
    [Pago cash]                    [Pago MP]
         │                                │
         ▼                                ▼
[32 Confirmación ✅]         [34 Pago pendiente ❌]──→[33 Pago aprobado ❌]
         │                                            [35 Pago rechazado ❌]
         ▼                                │
[36 Aceptado por comercio ❌]◄────────────┘
         │
         ├──→ [37 Rechazado por comercio ❌] ──→ [45 Reembolso ❌]
         │
         ▼
[39 Repartidor asignado ❌]
         │
         ▼
[40 Pedido en camino ❌]
         │
         ├──→ [42 Cancelado por comprador ❌] ──→ [45 Reembolso ❌]
         │
         ▼
[41 Pedido entregado ❌] ──→ [49 Calificá ❌] ──→ [50 Comprobante ❌]

         ... (si inactivo) ...

[121 Win-back 15d ❌] ──→ [122 Win-back 30d ❌]
```

### COMERCIO

```
Registro ──→ [6 Solicitud recibida ❌] ──→ [8 Doc pendiente ❌]
                                                   │
                    ┌──────────────────────────────┤
                    ▼                              ▼
           [9 Aprobada ❌]                [10 Rechazada ❌]
                    │
                    ▼
           [11 Onboarding ❌] ──→ [12 Vinculó MP ❌]
                    │
                    ▼
             Primer pedido
                    │
                    ▼
           [51 Nuevo pedido ❌] ──→ [52 Recordatorio ❌] ──→ [54 Cancelado sistema ❌]
                    │
                    ▼
           [55 Repartidor asignado ❌]
                    │
                    ▼
           [57 Entregado ❌] ──→ [76 Pago recibido ❌]
                    │
                    ▼
           [60 Calificación ❌]

                    ... cada día ...
           [77 Resumen diario ❌]

                    ... cada mes ...
           [79 Resumen mensual ❌] ──→ [80 Factura comisión ❌]
```

### REPARTIDOR

```
Registro ──→ [14 Solicitud recibida ⚠️ solo admin] ──→ [16 Doc pendiente ❌]
                                                              │
                         ┌────────────────────────────────────┤
                         ▼                                    ▼
                [17 Aprobado ✅]                     [18 Rechazado ❌]
                         │
                         ▼
                [19 Onboarding ❌]
                         │
                         ▼
                  Primer delivery
                         │
                         ▼
                [62 Pedido asignado ❌] ──→ [63 Reasignado ❌]
                         │
                         ▼
                [65 Entrega confirmada ❌] ──→ [66 Propina ❌]
                         │
                         ▼
                [67 Calificación ❌]

                         ... cada día ...
                [87 Resumen diario ❌]

                         ... cada semana ...
                [88 Resumen semanal ❌]

                         ... documentación ...
                [106 Doc por vencer ❌] ──→ [107 Doc vencida ❌]
```

### OWNER / DUEÑO DE MOOVY

```
                    ┌─── 08:00 AM ───────────────────────────────────┐
                    │ [167 Reporte diario ❌]                         │
                    └────────────────────────────────────────────────┘
                                         │
                    Durante el día (alertas según eventos):
                    │
                    ├──→ [161 Pedidos sin repartidor ❌]  🟠
                    ├──→ [160 Reclamos sin responder ❌]  🟠
                    ├──→ [135 Pasarela caída ❌]          🔴
                    ├──→ [145 Servidor caído ❌]          🔴
                    ├──→ [137 Split falló ❌]             🟠
                    ├──→ [149 Fraude detectado ❌]        🟠
                    ├──→ [156 Nuevo comercio ❌]          🟡
                    ├──→ [157 Nuevo repartidor ⚠️]        🟡
                    │
                    ┌─── Lunes 09:00 AM ─────────────────────────────┐
                    │ [168 Reporte semanal ❌]                        │
                    └────────────────────────────────────────────────┘
                    │
                    ┌─── 1ro de cada mes ────────────────────────────┐
                    │ [169 Reporte mensual financiero ❌]             │
                    │ [170 Reporte mensual crecimiento ❌]            │
                    │ [171 Reporte salud plataforma ❌]               │
                    └────────────────────────────────────────────────┘
                    │
                    ┌─── Hitos (cuando se alcanzan) ─────────────────┐
                    │ [177 Hito pedidos ❌] 🎉                        │
                    │ [179 Hito facturación ❌] 🎉                    │
                    │ [180 Récord diario ❌] 🎉                       │
                    └────────────────────────────────────────────────┘
```

---

## VEREDICTO FINAL

### ¿Está el sistema de emails de Moovy listo para producción?

**NO. El sistema de emails necesita un rediseño completo.**

**Situación actual**: Solo 8 de 180 emails están implementados (4.4%). De los 27 emails P0 (obligatorios para lanzar), solo 4 existen parcialmente. La infraestructura (Gmail SMTP, sin cola, sin retry, sin logging, sin tracking) no es apta para una plataforma de marketplace en producción.

**Riesgos críticos si se lanza así**:

1. **Comprador paga y no recibe confirmación** si el webhook MP falla — sin email de pago pendiente ni rechazado, queda en la oscuridad.

2. **Comercio se registra y no recibe ningún email** — no sabe si fue aprobado, rechazado, o si hay documentación pendiente.

3. **Reembolsos sin notificación** — el comprador no sabe que le devolvieron el dinero.

4. **Owner sin visibilidad** — no hay reportes diarios, ni alertas de sistema caído, ni notificación de pasarela de pagos fallida. Si MercadoPago se cae a las 3 AM, nadie se entera hasta que alguien revise el dashboard.

5. **Sin eliminación de cuenta notificada** — incumplimiento de la Ley 25.326 de Protección de Datos Personales de Argentina y requisito de Google Play.

6. **Gmail como SMTP** — máximo 500 emails/día, sin analytics, sin bounce handling. Un Black Friday con 200 pedidos colapsa el sistema de emails.

**Lo mínimo viable para lanzar**: Implementar los 27 emails P0, migrar de Gmail a Resend, centralizar templates, agregar EmailLog en la DB, y configurar SPF/DKIM/DMARC para somosmoovy.com.

---

*Fin del análisis. Documento generado el 20 de marzo de 2026.*



---

# Archivo: `docs/auditorias/AUDIT_LOGISTICS.md`

# Análisis Logístico Integral de MOOVY
## Auditoría de 10 fases — Marzo 2026

---

# PARTE 1: MAPA DEL ESTADO ACTUAL

## Resumen ejecutivo

Moovy tiene una base logística **sorprendentemente sólida para un proyecto en etapa temprana**. El assignment engine con PostGIS, la state machine de pedidos, el tracking en tiempo real con Socket.IO, y el sistema de package categories configurables lo ponen por encima del 80% de los startups de delivery argentinos en su mismo estadío. Sin embargo, hay brechas críticas que impiden operar como tienda + marketplace multi-categoría real.

### Lo que está implementado y funciona ✅

| Componente | Archivos clave | Estado |
|------------|----------------|--------|
| Assignment engine con PostGIS | `src/lib/assignment-engine.ts` | Funcional con scoring por distancia + rating |
| Package categories (MICRO→XL) con volumeScore | `prisma/schema.prisma` (PackageCategory) | 5 categorías configurables desde OPS |
| Vehicle-package matching | assignment-engine.ts línea 135 | PostGIS filtra por `allowedVehicles` |
| Delivery rates por categoría | DeliveryRate model + OPS config | Base + $/km configurable |
| Timeout cascade con max attempts | assignment-engine.ts (processExpiredAssignments) | Configurable vía MoovyConfig |
| Tracking GPS en tiempo real | Socket.IO + driver/location endpoint | Con validación anti-spoofing (200km/h) |
| Proof of delivery (foto) | Order.deliveryPhoto | Campo existe, driver puede subir foto |
| Google Distance Matrix para distancia real | api/delivery/calculate | Con fallback a Haversine |
| State machine de pedidos | src/lib/orderStates.ts | 10 estados con transiciones validadas |
| Multi-vendor con SubOrders | SubOrder model | Cada vendor puede tener driver distinto |
| Delivery programado (scheduled) | Order.deliveryType, scheduledSlotStart/End | Schema listo |
| Config desde OPS | /ops/configuracion-logistica | UI completa para categories, rates, timeouts |
| 4 tipos de vehículo | VehicleTypeEnum: BIKE, MOTO, CAR, TRUCK | Registrado al crear cuenta driver |

### Lo que está configurado pero incompleto ⚠️

| Componente | Qué falta | Impacto |
|------------|-----------|---------|
| Package categories sin HOT/FRESH/FRAGILE | Solo hay sizing (MICRO→XL), no tipos especiales | No se puede diferenciar comida caliente de un libro |
| Delivery programado (schema listo, lógica parcial) | No hay UI de selección de ventana horaria ni lógica de asignación previa | El comprador no puede elegir cuándo recibir |
| Zonas de cobertura | Solo hay Merchant.deliveryRadiusKm (radio fijo) | Sin polígonos, sin zonas diferenciadas |
| ETA al comprador | Se calcula internamente pero no se muestra dinámicamente antes de la compra | El comprador no sabe cuánto tarda antes de pagar |
| Costo de envío por categoría de paquete | DeliveryRate existe pero el checkout usa la fórmula de `delivery.ts` (fuel-based) | Dos sistemas de pricing coexisten sin conectarse |
| Multi-vehículo por driver | Solo 1 vehicleType por driver | No puede usar moto lunes y auto sábado |
| Proof of delivery | Solo foto, sin firma ni código | No hay confirmación bidireccional |

### Lo que falta completamente ❌

| Componente | Criticidad | Notas |
|------------|-----------|-------|
| Categorías especiales (HOT, FRESH, FRAGILE) | P0 | Bloqueante para food delivery real |
| SLA diferenciado por tipo de envío | P0 | Comida caliente y mueble no pueden tener mismo SLA |
| maxDeliveryTimeMinutes en shipment | P0 | Sin esto, comida llega fría |
| Declaración de peso/dimensiones por el comercio | P1 | Solo Listings tienen campos; Products no los usan |
| Batching de pedidos (agrupar 2-3 del mismo comercio) | P1 | Cada pedido = 1 driver, ineficiente |
| Surge pricing / demanda dinámica | P2 | Precio fijo sin importar hora/clima/demanda |
| Reverse logistics (devoluciones con driver) | P2 | No hay flujo de enviar driver a buscar devolución |
| Geofencing por polígonos | P2 | Solo radio fijo del comercio |
| Ventanas de entrega seleccionables | P2 | Schema listo, sin UI ni lógica |
| Batching multi-comercio (pick 2 comercios cercanos) | P3 | Complejidad alta, post-lanzamiento |
| Predicción de demanda | P3 | Requiere histórico suficiente |
| Pre-posicionamiento de drivers | P3 | Requiere demanda predecible |
| Entrega con ayudante (muebles pesados) | P3 | Para carga XXL |
| Teléfono enmascarado (privacidad) | P3 | Requiere servicio de telefonía |

---

# PARTE 2: ANÁLISIS POR FASES

---

## FASE 1 — CLASIFICACIÓN DE ENVÍOS

### 1.1 Estado actual

Moovy tiene 5 categorías basadas en **tamaño/volumen** (PackageCategory):

```
MICRO  → volumeScore=1,  maxWeight=500g,   dims: 15×10×5cm,    vehicles: [BIKE,MOTO,CAR,TRUCK]
SMALL  → volumeScore=3,  maxWeight=2000g,  dims: 30×20×15cm,   vehicles: [BIKE,MOTO,CAR,TRUCK]
MEDIUM → volumeScore=6,  maxWeight=5000g,  dims: 50×40×30cm,   vehicles: [MOTO,CAR,TRUCK]
LARGE  → volumeScore=10, maxWeight=15000g, dims: 80×60×50cm,   vehicles: [CAR,TRUCK]
XL     → volumeScore=20, maxWeight=30000g, dims: 120×80×80cm,  vehicles: [TRUCK]
```

El scoring de pedido agrega `volumeScore × quantity` de cada item y mapea a umbrales:

```
≤5 = MICRO, ≤15 = SMALL, ≤30 = MEDIUM, ≤60 = LARGE, >60 = XL
```

**Archivo**: `src/lib/assignment-engine.ts`, líneas 28-97

### 1.2 Brecha vs industria

**Lo que falta**: Las 5 categorías actuales clasifican por **dimensión física** pero ignoran completamente la **naturaleza del producto**. En la industria, Rappi/Uber Eats/iFood diferencian:

- **Por urgencia temporal**: Comida caliente (30 min max) vs paquetería (mismo día) vs programado (1-3 días)
- **Por requisitos de manipulación**: Frágil, líquidos, cadena de frío, peligroso
- **Por tipo de servicio**: Express, standard, economy, premium

### 1.3 Diseño recomendado

Agregar un sistema de **tags/flags** sobre las categorías existentes, sin reemplazarlas:

```
PackageCategory (existente)     →  Define TAMAÑO (MICRO→XL)
ShipmentType (nuevo)            →  Define NATURALEZA (HOT, FRESH, FRAGILE, STANDARD)
```

**Nuevo modelo ShipmentType:**

```prisma
model ShipmentType {
  id                    String   @id @default(cuid())
  code                  String   @unique  // HOT, FRESH, FRAGILE, STANDARD, DOCUMENT
  name                  String             // "Comida caliente", "Perecedero", etc.
  maxDeliveryMinutes    Int                // SLA máximo: HOT=45, FRESH=90, STANDARD=480
  requiresThermalBag    Boolean  @default(false)
  requiresColdChain     Boolean  @default(false)
  requiresCarefulHandle Boolean  @default(false)
  priorityWeight        Int      @default(0)  // Para scoring: HOT=100, FRESH=50, STANDARD=0
  surchargeArs          Float    @default(0)  // Recargo sobre tarifa base
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**Datos seed sugeridos:**

| Code | maxDeliveryMin | thermalBag | coldChain | carefulHandle | priority | surcharge |
|------|---------------|------------|-----------|---------------|----------|-----------|
| HOT | 45 | true | false | false | 100 | 0 |
| FRESH | 90 | false | true | false | 80 | 200 |
| FRAGILE | 480 | false | false | true | 30 | 150 |
| STANDARD | 480 | false | false | false | 0 | 0 |
| DOCUMENT | 240 | false | false | false | 10 | 0 |

**Integración con Order:**

```prisma
// Agregar a Order:
shipmentTypeCode  String   @default("STANDARD")
shipmentType      ShipmentType @relation(fields: [shipmentTypeCode], references: [code])
```

**Cálculo automático del ShipmentType:**
- Si el merchant es de categoría "Gastronomía/Comida": default HOT
- Si algún producto tiene tag "perecedero" o "refrigerado": FRESH
- Si algún producto tiene tag "frágil": FRAGILE
- Si todos son documentos/sobres: DOCUMENT
- Default: STANDARD
- Override manual por el comercio al preparar el pedido

### 1.4 Prioridad: P0

Sin esto, no se puede diferenciar una hamburguesa de un sillón. Es bloqueante para operar como plataforma multi-categoría.

---

## FASE 2 — PERFIL DE VEHÍCULO Y CAPACIDAD DEL DRIVER

### 2.1 Estado actual

**Modelo Driver** (schema.prisma, líneas 423-457):
- `vehicleType`: String nullable — valores: "bicicleta", "moto", "auto", "camioneta"
- `vehicleBrand`, `vehicleModel`, `vehicleYear`, `vehicleColor`, `licensePlate`: datos del vehículo
- Documentos: `licenciaUrl`, `seguroUrl`, `vtvUrl`, `dniFrenteUrl`, `dniDorsoUrl`
- Sin campo de capacidad de carga
- Sin campo de equipamiento (bolsa térmica, rack, etc.)
- Sin soporte multi-vehículo
- Sin foto del vehículo

**Registro de driver** (`src/app/repartidor/registro/page.tsx`, líneas 35-40):
```typescript
const VEHICLE_TYPES = [
  { value: "bicicleta", label: "Bicicleta", icon: "🚲", motorized: false },
  { value: "moto", label: "Moto", icon: "🏍️", motorized: true },
  { value: "auto", label: "Auto", icon: "🚗", motorized: true },
  { value: "camioneta", label: "Camioneta", icon: "🚙", motorized: true },
];
```

### 2.2 Brechas

1. **Sin capacidad declarada**: No se sabe si la moto tiene baúl de 30L o de 80L
2. **Sin equipamiento**: No se sabe si tiene bolsa térmica (crítico para HOT/FRESH)
3. **Sin foto del vehículo**: Imposible verificar estado/tipo real
4. **Sin multi-vehículo**: Un driver no puede cambiar entre moto y auto
5. **Inconsistencia de naming**: El schema usa VehicleTypeEnum (BIKE, MOTO, CAR, TRUCK) pero el registro guarda "bicicleta", "moto", "auto", "camioneta". El assignment engine consulta por el enum. **Esto es un bug potencial** si los valores guardados no matchean.
6. **Sin "camión" ni "SUV"**: Solo 4 tipos. Para muebles/carga pesada se necesita al menos camioneta grande y camión/flete.

### 2.3 Diseño recomendado

**Fase inmediata (P1)**: Agregar campos al modelo Driver existente:

```prisma
// Agregar a Driver:
hasThermalBag        Boolean  @default(false)
hasColdStorage       Boolean  @default(false)
hasExternalRack      Boolean  @default(false)
vehiclePhotoUrl      String?
maxCargoWeightKg     Float?    // Capacidad declarada
maxCargoVolumeLiters Float?    // Capacidad declarada
isEnclosed           Boolean  @default(false)  // Protección contra lluvia
```

**Fase posterior (P2)**: Modelo Vehicle separado para multi-vehículo:

```prisma
model Vehicle {
  id                   String   @id @default(cuid())
  driverId             String
  driver               Driver   @relation(fields: [driverId], references: [id])
  type                 VehicleTypeEnum
  brand                String?
  model                String?
  year                 Int?
  color                String?
  licensePlate         String?
  photoUrl             String?
  maxWeightKg          Float
  maxVolumeLiters      Float
  isEnclosed           Boolean  @default(false)
  hasThermalBag        Boolean  @default(false)
  hasColdStorage       Boolean  @default(false)
  isActive             Boolean  @default(true)
  isCurrentVehicle     Boolean  @default(false)  // El que usa HOY
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([driverId])
}

// Agregar a Driver:
activeVehicleId  String?  // FK al vehículo que está usando ahora
```

**Fix inmediato del naming**: Normalizar los valores de vehicleType al enum durante el registro. Actualmente se guardan en español minúscula pero el assignment engine consulta por el enum en mayúscula. Verificar que la query PostGIS haga la comparación correctamente.

### 2.4 Prioridad

- P0: Fix del naming inconsistente (potencial bug de matching)
- P1: Campos de equipamiento (thermalBag, cargoWeight)
- P2: Modelo Vehicle separado para multi-vehículo

---

## FASE 3 — ALGORITMO DE MATCHING (DISPATCH ENGINE)

### 3.1 Estado actual

El motor de asignación actual (`src/lib/assignment-engine.ts`) usa un modelo de **cascada por proximidad + rating**:

**Algoritmo actual:**
1. Calcular categoría del pedido → obtener `allowedVehicles`
2. Query PostGIS: buscar drivers online con vehicleType compatible dentro de `search_radius` (50km default)
3. Ordenar en dos tiers:
   - **Dentro de rating_radius (300m)**: por rating DESC (mejor rating = primero)
   - **Fuera de rating_radius**: por distancia ASC (más cerca = primero)
4. Ofrecer al primer driver del ranking
5. Si no acepta en `timeout` (20s): ofrecer al siguiente
6. Repetir hasta `max_attempts` (5)
7. Si nadie acepta: marcar UNASSIGNABLE, notificar admin

**Valores configurables desde OPS (MoovyConfig):**

| Parámetro | Default | Configurable |
|-----------|---------|-------------|
| driver_response_timeout_seconds | 20 | ✅ |
| max_assignment_attempts | 5 | ✅ |
| assignment_rating_radius_meters | 300 | ✅ |
| driver_search_radius_meters | 50000 | ✅ |

**Valores hardcodeados:**

| Parámetro | Valor | Archivo/Línea |
|-----------|-------|--------------|
| Grace window post-expiry | 10s | assignment-engine.ts:575 |
| Score thresholds (MICRO→XL) | 5/15/30/60 | assignment-engine.ts:28-34 |
| Vehicle speeds | MOTO:25, AUTO:20, BICI:12 km/h | geo.ts:43-49 |
| Earnings fallback | 500 + km×300 | assignment-engine.ts:864 |
| Haversine fallback radius | 50km | assignment-engine.ts:197 |

### 3.2 Evaluación del algoritmo

**Fortalezas:**
- PostGIS para queries geoespaciales eficientes (ST_DWithin, ST_Distance)
- Two-tier sorting (rating dentro de radio, distancia fuera) es un buen balance
- Serializable isolation en accept para prevenir race conditions
- Cascade automático con cron cada ~10s
- Fallback a Haversine si PostGIS falla
- Estimación de earnings mostrada al driver antes de aceptar

**Debilidades:**
- **No es scoring multivariable**: Solo usa distancia + rating. No considera acceptance_rate, velocidad histórica, carga actual, fairness.
- **No hay priorización de pedidos**: Un pedido HOT urgente y un paquete estándar reciben el mismo tratamiento en la cola.
- **No hay batching**: Cada pedido = 1 asignación. Si hay 3 pedidos del mismo comercio, se buscan 3 drivers.
- **No hay surge/escalamiento de radio**: Si no hay drivers cerca, no se expande el radio progresivamente.
- **No hay fairness**: Un driver que lleva 2 horas sin pedido no tiene prioridad sobre uno que acaba de entregar.
- **No considera el estado del pedido (HOT vs STANDARD)**: Todos entran a la misma cola.

### 3.3 Diseño del Dispatch Engine mejorado

**Scoring multivariable recomendado:**

```
SCORE = w1 × proximity_score       // 0-100, inversamente proporcional a distancia
       + w2 × vehicle_fit_score    // 0 (eliminatorio) o 50 (ok) o 100 (ideal)
       + w3 × rating_score         // 0-100, normalizado del rating 1-5
       + w4 × acceptance_rate      // 0-100, % de aceptaciones últimos 7 días
       + w5 × idle_time_bonus      // 0-100, proporcional al tiempo sin pedido
       + w6 × equipment_bonus      // 0-50, si tiene bolsa térmica y el pedido es HOT
```

**Pesos sugeridos (Sprint 0):**

```typescript
const WEIGHTS = {
  proximity: 0.40,      // La distancia sigue siendo lo más importante
  vehicleFit: 0.15,     // Penalizar enviar camioneta por una hamburguesa
  rating: 0.15,          // Calidad del servicio
  acceptanceRate: 0.10,  // Fiabilidad
  idleTime: 0.10,        // Fairness
  equipment: 0.10,       // Match de equipamiento
};
```

**Implementación gradual:**
- **Sprint 0**: Mantener el algoritmo actual pero agregar filtro por ShipmentType + priorización de cola
- **Mes 1**: Agregar scoring multivariable completo
- **Mes 2**: Agregar batching y surge

### 3.4 Reglas de priorización de cola

Antes de asignar drivers, los pedidos pendientes deberían ordenarse por prioridad:

```typescript
function calculateOrderPriority(order: Order): number {
  let priority = 0;

  // Por tipo de envío (urgencia)
  if (order.shipmentTypeCode === 'HOT') priority += 100;
  if (order.shipmentTypeCode === 'FRESH') priority += 80;

  // Por tiempo de espera (antigüedad)
  const waitMinutes = (Date.now() - order.createdAt.getTime()) / 60000;
  priority += Math.min(waitMinutes * 2, 60); // Max +60 por espera

  // Por intentos fallidos (ya esperó mucho)
  priority += order.assignmentAttempts * 15;

  return priority;
}
```

### 3.5 Prioridad: P0-P1

- P0: Filtro por ShipmentType (HOT no puede ir en bici sin bolsa térmica)
- P0: Priorización de cola por urgencia
- P1: Scoring multivariable completo
- P2: Batching
- P3: Surge pricing / expansión dinámica de radio

---

## FASE 4 — CÁLCULO DE COSTO DE ENVÍO

### 4.1 Estado actual

Moovy tiene **DOS sistemas de pricing** que coexisten sin conectarse:

**Sistema 1: Fuel-based** (`src/lib/delivery.ts`)
```
roundTripKm = distancia × 2
fuelCost = roundTripKm × fuelConsumption × fuelPrice
total = (baseDeliveryFee + fuelCost) × maintenanceFactor
```

Parámetros (StoreSettings):
- baseDeliveryFee: 500 ARS
- fuelPricePerLiter: 1200 ARS
- fuelConsumptionPerKm: 0.06 L/km
- maintenanceFactor: 1.35

**Sistema 2: Category-based** (DeliveryRate por PackageCategory)
```
earnings = basePriceArs + pricePerKmArs × distanciaKm
```

Usado para: calcular earnings del driver, NO para cobrarle al comprador.

**Problema**: El comprador paga según el Sistema 1 (fuel-based, igual para todos). El driver gana según el Sistema 2 (category-based). No hay conexión.

### 4.2 Brechas vs industria

- **Sin diferenciación por categoría al comprador**: Enviar un sobre cuesta lo mismo que un mueble
- **Sin surge pricing**: Mismo precio llueva o haga sol, viernes 20hs o martes 10hs
- **Sin opciones de velocidad**: No hay "Express" vs "Standard" vs "Económico"
- **Sin recargo por manipulación especial**: Frágil, cadena de frío, mueble pesado
- **Sin envío gratis del comercio**: El merchant no puede absorber el costo (solo hay freeDeliveryMinimum global)
- **El fee se calcula client-side y se envía al server**: Seguridad preocupante (el comprador podría manipularlo)

### 4.3 Diseño recomendado

**Fórmula unificada:**

```typescript
function calculateShippingCost(params: {
  distanceKm: number;
  packageCategory: string;      // MICRO, SMALL, MEDIUM, LARGE, XL
  shipmentType: string;         // HOT, FRESH, FRAGILE, STANDARD
  orderTotal: number;
  merchantId: string;
  requestedSpeed?: 'EXPRESS' | 'STANDARD' | 'ECONOMY';
}): ShippingCostResult {

  // 1. Base por categoría de paquete (DeliveryRate)
  const rate = getDeliveryRate(params.packageCategory);
  let cost = rate.basePriceArs + rate.pricePerKmArs * params.distanceKm;

  // 2. Recargo por tipo de envío
  const shipmentType = getShipmentType(params.shipmentType);
  cost += shipmentType.surchargeArs;

  // 3. Recargo por peso/volumen excedente (si aplica)
  // Omitido en Sprint 0

  // 4. Surge multiplier (si aplica)
  // const surge = getSurgeMultiplier(zone, datetime);
  // cost *= surge; // Sprint 2

  // 5. Speed multiplier
  if (params.requestedSpeed === 'EXPRESS') cost *= 1.3;
  if (params.requestedSpeed === 'ECONOMY') cost *= 0.8;

  // 6. Free delivery check
  const merchant = getMerchant(params.merchantId);
  if (merchant.freeDeliveryMinimum && params.orderTotal >= merchant.freeDeliveryMinimum) {
    cost = 0;
  }

  // 7. Merchant subsidy (el comercio puede absorber parte)
  if (merchant.deliverySubsidyPercent > 0) {
    cost *= (1 - merchant.deliverySubsidyPercent / 100);
  }

  return {
    subtotal: cost,
    surcharges: { ... },
    total: Math.ceil(cost),
    estimatedMinutes: calculateETA(params),
  };
}
```

**Crítico: Validar server-side**: El costo SIEMPRE debe calcularse en el server al crear la orden, nunca confiar en el valor que manda el frontend.

### 4.4 Tarifas sugeridas (valores iniciales para Ushuaia)

| Categoría | Base (ARS) | $/km (ARS) | Notas |
|-----------|-----------|------------|-------|
| MICRO | 400 | 150 | Sobres, documentos |
| SMALL | 500 | 200 | Paquetes chicos |
| MEDIUM | 600 | 250 | Comida, cajas medianas |
| LARGE | 800 | 350 | Electrodomésticos chicos |
| XL | 1200 | 500 | Muebles, carga pesada |

| Recargo | Monto (ARS) |
|---------|------------|
| HOT (bolsa térmica) | 0 (incluido en base) |
| FRESH (cadena frío) | +200 |
| FRAGILE (manipulación) | +150 |
| EXPRESS (+30% velocidad) | +30% sobre total |

### 4.5 Prioridad: P0

El pricing actual es funcional pero cobrar lo mismo por un sobre que por un mueble no es viable comercialmente.

---

## FASE 5 — CÁLCULO DE ETA

### 5.1 Estado actual

**Función**: `estimateTravelTime()` en `src/lib/geo.ts` (líneas 38-55)

```typescript
// Velocidades (hardcoded):
MOTO: 25 km/h, AUTO: 20 km/h, BICI: 12 km/h
// Fórmula:
minutes = ceil(distanceKm / speed * 60)
// Bounds: min 2 min, max 60 min
```

**Campos del Merchant**: `deliveryTimeMin` (default 30), `deliveryTimeMax` (default 45)

**Problema**: El ETA no incluye tiempo de preparación del comercio, tiempo de espera de driver, ni tiempo de retiro. Solo es tiempo de viaje.

### 5.2 Diseño recomendado

```typescript
function calculateFullETA(params: {
  distanceDriverToMerchant: number;  // km
  distanceMerchantToCustomer: number; // km
  vehicleType: string;
  merchantPrepTimeMin: number;    // Del merchant o del seller
  shipmentType: string;
  hasDriverAssigned: boolean;
}): ETAResult {

  // 1. Tiempo de preparación del comercio
  const prepTime = params.merchantPrepTimeMin; // Merchant.deliveryTimeMin

  // 2. Tiempo de espera de driver (si no hay uno asignado)
  const driverWaitTime = params.hasDriverAssigned ? 0 : 5; // promedio 5 min

  // 3. Tiempo driver → comercio
  const driverToMerchant = estimateTravelTime(
    params.distanceDriverToMerchant,
    params.vehicleType
  );

  // 4. Tiempo en comercio (retiro)
  const pickupTime = 3; // minutos promedio

  // 5. Tiempo comercio → destino
  const merchantToCustomer = estimateTravelTime(
    params.distanceMerchantToCustomer,
    params.vehicleType
  );

  // 6. Buffer de imprevistos
  const buffer = Math.ceil((driverToMerchant + merchantToCustomer) * 0.15);

  const totalMin = prepTime + driverWaitTime + driverToMerchant
                   + pickupTime + merchantToCustomer + buffer;

  // 7. SLA check
  const shipmentType = getShipmentType(params.shipmentType);
  const exceedsSLA = totalMin > shipmentType.maxDeliveryMinutes;

  return {
    totalMinutes: totalMin,
    rangeMin: totalMin - 5,
    rangeMax: totalMin + 10,
    breakdown: { prepTime, driverWaitTime, driverToMerchant, pickupTime, merchantToCustomer, buffer },
    exceedsSLA,
    slaMinutes: shipmentType.maxDeliveryMinutes,
  };
}
```

**Visualización al comprador**: Mostrar rango (ej: "35-50 min") basado en `rangeMin`/`rangeMax`, NO un número exacto.

**SLA diferenciado:**

| Tipo | SLA target | SLA max | Acción si excede |
|------|-----------|---------|-----------------|
| HOT | 30 min | 45 min | Alertar al comprador antes de pagar |
| FRESH | 45 min | 90 min | Alertar |
| STANDARD | 60 min | 480 min (mismo día) | Informar |
| DOCUMENT | 30 min | 240 min | Informar |

### 5.3 Prioridad: P1

El ETA actual funciona pero es impreciso. Mejorarlo aumenta confianza del comprador.

---

## FASE 6 — FLUJO COMPLETO DEL PEDIDO

### 6.1 State machine actual

**Archivo**: `src/lib/orderStates.ts`

Estados actuales (10):
```
PENDING → AWAITING_PAYMENT → CONFIRMED → PREPARING → READY →
DRIVER_ASSIGNED → PICKED_UP → IN_DELIVERY → DELIVERED
+ CANCELLED, SCHEDULED, UNASSIGNABLE
```

DeliveryStatus (paralelo, 4 valores):
```
DRIVER_ASSIGNED → DRIVER_ARRIVED → PICKED_UP → DELIVERED
```

### 6.2 Evaluación

**Bien**:
- Separación de OrderStatus y DeliveryStatus es correcta
- Timestamps en estados clave (deliveredAt, scheduledConfirmedAt, etc.)
- UNASSIGNABLE como estado terminal cuando no hay drivers

**Faltas**:
- No hay estado `READY_FOR_PICKUP` diferenciado de `READY`
- No hay `DRIVER_EN_ROUTE_TO_STORE` (entre asignación y llegada al comercio)
- No hay `ARRIVING` (driver llegando al destino, último tramo)
- No hay `DELIVERY_FAILED` (comprador no estaba, rechazo en puerta)
- No hay `RETURN_TO_STORE` (devolución al comercio por entrega fallida)
- No hay `REJECTED_BY_STORE` diferenciado (el comercio rechaza el pedido)
- No hay logging de timestamps por cada transición

### 6.3 State machine recomendada

```
[PENDING]
  → [AWAITING_PAYMENT] (si MP)
  → [CONFIRMED] (si cash o pago recibido)
  → [CANCELLED_BY_BUYER]

[AWAITING_PAYMENT]
  → [CONFIRMED] (webhook MP approved)
  → [CANCELLED_BY_SYSTEM] (pago expirado/rechazado)

[CONFIRMED]
  → [PREPARING] (merchant acepta)
  → [REJECTED_BY_STORE] (merchant rechaza → refund)
  → [CANCELLED_BY_BUYER] (antes de que el merchant acepte)

[PREPARING]
  → [READY_FOR_PICKUP] (merchant termina preparación)
  → [CANCELLED_BY_SYSTEM] (timeout sin preparar)

[READY_FOR_PICKUP]
  → [DRIVER_ASSIGNED] (driver acepta)

[DRIVER_ASSIGNED]
  → [DRIVER_EN_ROUTE] (driver confirma que va al comercio)
  → [DRIVER_AT_STORE] (driver llega, GPS o manual)

[DRIVER_AT_STORE]
  → [PICKED_UP] (driver confirma retiro, foto opcional)

[PICKED_UP]
  → [IN_TRANSIT] (driver en camino al destino)
  → [ARRIVING] (driver a <500m del destino)

[IN_TRANSIT]
  → [ARRIVING]

[ARRIVING]
  → [DELIVERED] (driver confirma entrega, foto de proof)
  → [DELIVERY_FAILED] (comprador no está)

[DELIVERY_FAILED]
  → [RETURN_TO_STORE] (se devuelve al comercio)
  → [DELIVERED] (segundo intento exitoso)

[DELIVERED]
  → [CONFIRMED_BY_BUYER] (rating + confirmación)
```

**Nota**: Implementar esto de forma gradual. Sprint 0 puede mantener los estados actuales y agregar solo REJECTED_BY_STORE y DELIVERY_FAILED.

### 6.4 Qué ve cada actor

| Estado | Comprador ve | Comercio ve | Driver ve | Admin ve |
|--------|-------------|-------------|-----------|----------|
| PENDING | "Procesando tu pedido" | — | — | Nuevo pedido |
| CONFIRMED | "Pedido confirmado" | "Nuevo pedido!" + aceptar/rechazar | — | En cola |
| PREPARING | "El comercio está preparando tu pedido" | "Preparando" + marcar listo | — | Preparando |
| READY_FOR_PICKUP | "Tu pedido está listo, buscando repartidor" | "Listo, esperando repartidor" | Oferta de pedido | Buscando driver |
| DRIVER_ASSIGNED | "Repartidor asignado: Juan" + mapa | "Juan va en camino a retirar" | Ir al comercio + navegación | Driver asignado |
| PICKED_UP | "Tu pedido está en camino" + mapa tracking | "Pedido retirado" | Ir al destino + navegación | En tránsito |
| DELIVERED | "Entregado! Calificá" | "Entregado" + revenue | Resumen + ganancia | Completado |

### 6.5 Prioridad: P1

Los estados actuales funcionan. Agregar REJECTED_BY_STORE y DELIVERY_FAILED es P0. El resto es P1-P2.

---

## FASE 7 — ZONAS, COBERTURA Y GEOFENCING

### 7.1 Estado actual

- **Merchant.deliveryRadiusKm** (default 5km): Radio fijo circular por comercio
- **StoreSettings.maxDeliveryDistance** (default 15km): Límite global
- **PostGIS ST_DWithin**: Usado para buscar drivers dentro de un radio
- **No hay modelo de zonas**: Sin polígonos, sin zonas diferenciadas, sin recargos por zona

### 7.2 Brechas

- Un radio circular no refleja la realidad urbana (calles, puentes, ríos)
- No se pueden definir zonas donde no se hacen envíos (ej: zona industrial, al otro lado del aeropuerto)
- No hay recargos por distancia a zonas periféricas
- No hay restricciones por horario en ciertas zonas
- El driver no puede indicar zonas donde no quiere trabajar

### 7.3 Diseño recomendado (progresivo)

**Sprint 0 (mantener)**: Radio fijo por merchant. Funciona para Ushuaia que es chica.

**Mes 2**: Agregar modelo DeliveryZone con polígonos GeoJSON:

```prisma
model DeliveryZone {
  id              String   @id @default(cuid())
  name            String   // "Centro", "Barrio Sur", "Zona Industrial"
  polygon         Unsupported("geography")  // PostGIS polygon
  isActive        Boolean  @default(true)
  surchargeArs    Float    @default(0)       // Recargo por zona
  isRestricted    Boolean  @default(false)   // No se hacen envíos aquí
  maxVehicleType  String?  // Solo ciertos vehículos
  notes           String?  // "Solo motos, calles angostas"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Mes 3**: Zonas de alta demanda para pre-posicionamiento + surge.

### 7.4 Prioridad: P2-P3

Para Ushuaia con radio fijo alcanza inicialmente. Cuando se expanda a más ciudades, las zonas serán críticas.

---

## FASE 8 — TRACKING Y VISIBILIDAD

### 8.1 Estado actual

**Tracking del comprador**: ✅ Implementado
- Mapa en tiempo real con `OrderTrackingMiniMap` (Google Maps + Directions API)
- Polling cada 10 segundos + Socket.IO real-time
- Smooth GPS interpolation (1s ease-out cubic)
- Tracking público sin auth (`/seguimiento/[orderId]`)
- Timeline de 8 pasos visual

**Vista del comercio**: ⚠️ Parcial
- Ve estado del pedido en tiempo real via Socket.IO
- NO ve la ubicación del driver en mapa

**Vista del driver**: ✅ Implementado
- Dashboard con pedidos disponibles/activos
- Navegación via Google Maps / Waze (links, no integrada)
- Botones para cambiar estado (ARRIVED, PICKED_UP, DELIVERED)
- Push notifications para nuevas ofertas

**Privacidad**: ⚠️ Parcial
- Se comparte nombre y foto del driver al comprador
- La dirección completa del comprador es visible para el driver desde que acepta
- No hay anonimización de teléfonos
- Info se mantiene visible después de la entrega

### 8.2 Brechas

- El comercio debería ver ubicación del driver que va a retirar (ETA de retiro)
- El driver debería poder marcar "llegué" automáticamente por GPS (geofence del comercio)
- Proof of delivery debería ser obligatorio (foto), no solo optional
- Comunicación debería ser por chat in-app, no por teléfono directo
- Tracking debería desaparecer X minutos después de la entrega

### 8.3 Prioridad

- P1: Vista del driver para el comercio (ETA de retiro)
- P1: Proof of delivery obligatorio (foto)
- P2: Auto-detección de llegada por GPS
- P3: Chat in-app
- P3: Anonimización de teléfonos

---

## FASE 9 — CASOS ESPECIALES Y EDGE CASES

### 9.1 Pedido multi-paquete

**Estado actual**: El assignment engine suma `volumeScore × quantity` de todos los items. Esto es correcto para determinar el tamaño total, pero no considera el item más voluminoso individualmente.

**Mejora**: Si un item individual requiere CAR pero el score total es SMALL, igual debería asignar CAR. Agregar:

```typescript
const maxItemCategory = Math.max(...items.map(i => i.packageCategory.volumeScore));
const maxVehicles = getVehiclesForScore(maxItemCategory);
// allowedVehicles = intersection of totalScore vehicles AND maxItem vehicles
// (usar el más restrictivo)
```

### 9.2 Pedido multi-comercio

**Estado actual**: SubOrders permiten drivers separados por vendor. El schema lo soporta.

**Falta**: La lógica de assignment solo opera a nivel Order, no SubOrder. Cada SubOrder debería tener su propio ciclo de asignación si los merchants están en ubicaciones diferentes.

### 9.3 Pedido que requiere 2 personas

**No existe**. Para Sprint 0, simplemente informar al comprador que envíos XXL requieren que alguien ayude a recibir. P3 para implementar servicio de ayudante.

### 9.4 Ventanas de entrega

**Schema listo** (scheduledSlotStart/End en Order). Falta la UI del comprador para seleccionar ventana y la lógica de asignar driver justo antes de la ventana.

### 9.5 Entrega fallida

**No existe**. No hay estado DELIVERY_FAILED ni lógica de reintentos. El driver solo puede marcar DELIVERED. Si el comprador no está, no hay protocolo.

**Recomendación P1**: Agregar flujo:
1. Driver marca "Cliente no disponible"
2. Se intenta contactar al comprador (push + llamada)
3. Timer de 5 minutos de espera
4. Si no responde: driver puede marcar DELIVERY_FAILED
5. El driver recibe compensación parcial por el viaje
6. Se ofrece al comprador reprogramar o cancelar

### 9.6 Clima adverso

**No existe**. Para Ushuaia (clima extremo) es relevante. P2 para agregar:
- Multiplicador de ETA en días de mal clima
- Suspensión de bicicletas en nieve/lluvia fuerte
- Notificación al comprador de posible demora

### 9.7 Reverse logistics

**No existe**. No hay flujo de enviar un driver a buscar una devolución. P2-P3.

---

## FASE 10 — MÉTRICAS Y ESCALABILIDAD

### 10.1 KPIs que faltan

No hay dashboard de métricas logísticas. El OPS tiene datos crudos pero no KPIs calculados.

**KPIs esenciales a implementar (P1):**
- Tiempo promedio de entrega (desde CONFIRMED hasta DELIVERED)
- % entregas dentro del SLA por tipo de envío
- Tiempo promedio de asignación (desde PREPARING hasta DRIVER_ASSIGNED)
- Tasa de pedidos sin driver (UNASSIGNABLE / total)
- Tasa de rechazo de drivers (rechazos / ofertas totales)
- Utilización de drivers (tiempo con pedido / tiempo online)

Todos estos datos YA están en la DB (AssignmentLog, Order timestamps). Solo falta calcularlos y mostrarlos.

### 10.2 Escalabilidad

**Actual**: El cron `assignment-tick` procesa expired assignments secuencialmente. Con 10-50 pedidos diarios está bien.

**Problema a 1000+ pedidos**: El cron podría tardar más que su intervalo. Cada `findNextEligibleDriver` hace una query PostGIS completa.

**Recomendación P2-P3**:
- Usar cola de mensajes (Bull/BullMQ con Redis) para cada assignment como job independiente
- Indexar AssignmentLog por (orderId, outcome) para acelerar exclusiones
- Cache de drivers online en Redis (no consultar DB cada vez)
- Batch las notificaciones push

---

# PARTE 3: ENTREGABLES

## Entregable 1: Taxonomía de envíos completa

| Categoría Física | Tipo Especial | Vehículos | SLA (min) | Tarifa base | $/km |
|-----------------|--------------|-----------|-----------|------------|------|
| MICRO | STANDARD | BIKE,MOTO,CAR,TRUCK | 480 | 400 | 150 |
| MICRO | DOCUMENT | BIKE,MOTO,CAR | 240 | 350 | 120 |
| SMALL | STANDARD | BIKE,MOTO,CAR,TRUCK | 480 | 500 | 200 |
| SMALL | FRAGILE | MOTO*,CAR,TRUCK | 480 | 650 | 200 |
| MEDIUM | STANDARD | MOTO,CAR,TRUCK | 480 | 600 | 250 |
| MEDIUM | HOT | MOTO,CAR | 45 | 600 | 250 |
| MEDIUM | FRESH | MOTO*,CAR,TRUCK | 90 | 800 | 250 |
| LARGE | STANDARD | CAR,TRUCK | 480 | 800 | 350 |
| LARGE | FRAGILE | CAR,TRUCK | 480 | 950 | 350 |
| XL | STANDARD | TRUCK | 1440 | 1200 | 500 |
| XL | FRAGILE | TRUCK | 1440 | 1500 | 500 |

\* Con equipamiento adecuado (bolsa térmica para FRESH en moto, embalaje para FRAGILE)

## Entregable 2: Matriz de compatibilidad vehículo ↔ paquete

| Categoría | Bicicleta | Moto | Auto | Camioneta |
|-----------|-----------|------|------|-----------|
| MICRO | ✅ | ✅ | ✅ | ✅ |
| SMALL | ✅ | ✅ | ✅ | ✅ |
| MEDIUM | ⚠️ (solo si cabe en mochila) | ✅ | ✅ | ✅ |
| LARGE | ❌ | ❌ | ✅ | ✅ |
| XL | ❌ | ❌ | ❌ | ✅ |
| HOT | ✅ (con bolsa) | ✅ (con bolsa) | ✅ | ❌ (no apropiado) |
| FRESH | ❌ | ⚠️ (con cooler) | ✅ | ✅ |
| FRAGILE | ❌ | ⚠️ (con cuidado) | ✅ | ✅ |

## Entregable 3: State machine simplificada (diagrama)

```
PENDING ──→ AWAITING_PAYMENT ──→ CONFIRMED ──→ PREPARING
   │              │                   │              │
   └──→ CANCELLED_BY_BUYER     REJECTED_BY_STORE   │
                  │                                  ↓
            CANCELLED_BY_SYSTEM              READY_FOR_PICKUP
                                                    │
                                             DRIVER_ASSIGNED
                                                    │
                                              PICKED_UP
                                                    │
                                              IN_TRANSIT
                                                    │
                                        ┌───── ARRIVING ─────┐
                                        ↓                    ↓
                                    DELIVERED         DELIVERY_FAILED
                                        │                    │
                                  CONFIRMED_BY_BUYER   RETURN_TO_STORE
```

## Entregable 4: Lista de brechas priorizadas

### P0 — Bloqueante para multi-categoría (Sprint 0, semana 1-2)

1. **ShipmentType model + seed** — Sin esto no hay HOT vs STANDARD
2. **Fix naming vehicleType** — "bicicleta" vs "BIKE" puede romper matching
3. **Validar deliveryFee server-side** — El frontend envía el fee, se debe recalcular
4. **maxDeliveryTimeMinutes** — Comida caliente sin SLA = llega fría
5. **ShipmentType en Order** — Conectar el tipo al pedido

### P1 — Primer mes (Sprint 1-4)

6. Campos equipamiento en Driver (thermalBag, cargoWeight)
7. ETA completo (prep + driver + tránsito + buffer)
8. Mostrar ETA al comprador ANTES de pagar
9. Costo de envío diferenciado por categoría al comprador
10. Estado DELIVERY_FAILED + protocolo de reintentos
11. Estado REJECTED_BY_STORE
12. Proof of delivery obligatorio (foto)
13. KPIs logísticos en OPS dashboard
14. Priorización de cola por urgencia (HOT primero)
15. Vista del driver para el comercio (ETA de retiro)

### P2 — Segundo mes

16. Scoring multivariable completo (acceptance_rate, idle_time, etc.)
17. Batching de pedidos del mismo comercio
18. Ventanas de entrega (UI + lógica)
19. Zonas de cobertura con polígonos GeoJSON
20. Surge pricing (horario pico, mal clima)
21. Multiplicador de ETA por clima
22. Reverse logistics (devolución con driver)
23. Merchant puede ofrecer envío gratis / subsidio parcial
24. Dashboard de métricas logísticas completo

### P3 — Tercer mes / mejora continua

25. Multi-vehículo por driver (modelo Vehicle separado)
26. Batching multi-comercio
27. Pre-posicionamiento de drivers en zonas de demanda
28. Chat in-app (reemplazar teléfono directo)
29. Anonimización de teléfonos
30. Predicción de demanda (histórico)
31. Auto-detección de llegada por GPS (geofence)
32. Servicio de ayudante para carga pesada (XXL)
33. Cola de mensajes (Bull/Redis) para assignments a escala

## Entregable 5: Roadmap logístico

### Sprint 0 (Semana 1-2) — MVP Multi-categoría
- Crear modelo ShipmentType con 5 tipos seed
- Agregar shipmentTypeCode a Order
- Fix naming vehicleType (normalizar a enum)
- Validar deliveryFee server-side (recalcular al crear orden)
- Conectar DeliveryRate al cálculo del comprador (no solo del driver)
- Auto-detectar ShipmentType según rubro del comercio

### Mes 1 (Sprints 1-4) — Matching inteligente + UX
- Campos de equipamiento en Driver
- ETA completo con breakdown
- Mostrar ETA + costo desglosado al comprador en checkout
- Estado DELIVERY_FAILED con protocolo
- Estado REJECTED_BY_STORE
- Proof of delivery obligatorio
- Priorización de cola por urgencia
- KPIs logísticos básicos en OPS
- Vista de driver para el comercio

### Mes 2 (Sprints 5-8) — Optimización
- Scoring multivariable
- Batching de pedidos
- Ventanas de entrega
- Zonas con polígonos (si se expande a otra ciudad)
- Surge pricing
- ETA ajustado por clima
- Reverse logistics básico
- Subsidio de envío por merchant

### Mes 3 (Sprints 9-12) — Escalabilidad
- Multi-vehículo por driver
- Batching multi-comercio
- Pre-posicionamiento
- Bull/Redis para assignments
- Predicción de demanda
- Chat in-app
- Geofence auto-arrival

---

# PARTE 4: VEREDICTO FINAL

## ¿Qué tan lejos está Moovy de logística profesional?

**Respuesta honesta**: Moovy está al **60-65%** de un sistema logístico de nivel profesional para su escala actual (Ushuaia, <100 pedidos/día).

**Lo que tiene bien**:
- PostGIS para queries geoespaciales (esto lo pone adelante del 90% de los startups argentinos)
- Assignment engine con timeout cascade configurable
- Tracking en tiempo real con Socket.IO + Google Maps
- Package categories con vehicle matching
- Multi-vendor con SubOrders
- Config editable desde OPS (no hardcodeado)

**Lo que le falta para ser profesional**:
- Diferenciación por tipo de producto (HOT vs STANDARD) — es la brecha #1
- SLAs y ETA realistas
- Pricing por categoría al comprador
- Manejo de entregas fallidas
- Métricas operativas
- Scoring multivariable en el dispatch

**Comparación con la industria**:
- vs **Rappi/PedidosYa**: Moovy tiene el 40% de su funcionalidad logística. Les falta batching, surge, zonas, métricas, reverse logistics.
- vs **Mercado Envíos**: Moovy tiene el 30%. ME tiene cross-docking, múltiples carriers, SLAs contractuales, insurance.
- vs **Amazon Logistics**: Moovy tiene el 15%. Amazon tiene predicción ML, warehousing, same-day a escala nacional.
- vs **Un startup argentino promedio**: Moovy está **por encima**. La base PostGIS + assignment engine configurable es sólida.

**La buena noticia**: Con el Sprint 0 (2 semanas) + Mes 1, Moovy puede llegar al 80% de lo necesario para operar profesionalmente en Ushuaia como tienda + marketplace multi-categoría. El 20% restante es optimización que se puede hacer iterativamente con datos reales de operación.



---

# Archivo: `docs/auditorias/AUDIT_PAGOS_2026-04-26.md`

# Auditoría de Pagos — Moovy 2026-04-26

**Autor:** Auditoría integral solicitada por Mauro (founder)
**Fecha:** 2026-04-26
**Rama:** `docs/pagos-revision-completa`
**Trigger:** las credenciales TEST de MercadoPago se desactivaron en el panel del founder, generando dudas sobre el estado real del sistema de pagos. Mauro pidió revisión exhaustiva antes de avanzar con `feat/driver-bank-mp`.

> Pagos es el corazón financiero de Moovy. Antes de agregar features encima, hay que entender qué hay implementado, qué funciona, qué está mediano, y qué falta. Este documento es la respuesta.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Cobro al buyer (Checkout Pro)](#cobro-al-buyer)
3. [Pagos a los actores (merchant, seller, driver)](#pagos-a-los-actores)
4. [Configuración: variables de entorno y modos TEST/PROD](#configuración)
5. [Matriz consolidada de estado](#matriz-consolidada)
6. [Riesgos y gaps críticos](#riesgos-y-gaps)
7. [Recomendación del consejo](#recomendación-del-consejo)
8. [Plan de testing TEST → PROD](#plan-de-testing)
9. [Roadmap pre-launch y post-launch](#roadmap)
10. [Apéndice — `.env.example` propuesto](#apéndice)

---

## Resumen ejecutivo

**Lo que Moovy YA tiene implementado (y funciona):**

- ✅ **Cobro al buyer con Checkout Pro** end-to-end: creación de preference, redirect, webhook con validación HMAC, idempotencia robusta vía `MpWebhookLog`, validación de monto con tolerancia $1, restauración automática de stock al rechazo.
- ✅ **OAuth MP para merchants y sellers**: pueden conectar sus cuentas de MP via flow estándar y dejar guardados sus tokens (`mpAccessToken`, `mpRefreshToken`, `mpUserId`, `mpEmail`).
- ✅ **Split payment automático para merchants y sellers** que tienen su MP conectado: la plata se reparte al instante en el checkout (Moovy se queda con su comisión, el vendor cobra el neto directo a su cuenta MP).
- ✅ **PayoutBatch + PayoutItem** para pagos manuales en bulk a merchants y drivers (admin selecciona, genera CSV, transfiere afuera, marca como pagado con auditoría).
- ✅ **Refund function** existente (`createRefund` en `src/lib/mercadopago.ts`).
- ✅ **Encriptación at-rest** con AES-256-GCM para datos fiscales (CUIT, CBU/Alias, tokens MP) en merchants y sellers.

**Lo que NO tiene implementado (gaps críticos):**

- ❌ **Pagos a drivers no funcionan**: el modelo `Driver` no tiene campos bancarios (`bankCbu`, `bankAlias`, `bankAccount`, OAuth MP). Aunque `PayoutBatch` soporta `recipientType: DRIVER`, el endpoint POST rechaza la generación de batch porque ningún driver tiene `bankAccount`. Los pagos a drivers se hacen 100% offline (admin pasa CBU por WhatsApp y transfiere manualmente sin trazabilidad en el sistema).
- ❌ **Pagos a sellers via batch NO existen**: aunque seller tiene OAuth y campos bancarios, las funciones `getPendingMerchantPayouts()` y `getPendingDriverPayouts()` cubren los dos primeros pero **no hay equivalente para seller**. Los sellers solo cobran via split payment automático — si no tienen MP conectado, no hay forma de pagarles vía el sistema.
- ❌ **Refund automático en cancelación**: el helper `createRefund` existe pero NO se llama automáticamente cuando admin cancela un pedido pagado. Hay un TODO comentado en `cron/scheduled-notify`. Hoy el admin cancela y dispara refund manual desde el panel MP por su cuenta.
- ❌ **Refund vía endpoint admin**: no hay endpoint manual `POST /api/admin/orders/[id]/refund` visible (la función existe pero está colgada).
- ❌ **Cron de generación automática de batches**: no hay cron diario/semanal que arme batches solo. Todo es 100% manual desde `/ops/pagos-pendientes`.
- ⚠️ **`MP_PUBLIC_KEY`** declarada en `env-validation.ts` como required pero **nunca se usa en el código**. Es código muerto en validación.
- ⚠️ **Email duplicado al buyer en cobro exitoso**: se manda confirmación al crear orden Y al confirmar pago. El buyer recibe 2 emails muy similares.
- ⚠️ **Stock no se restaura si pedido en `PREPARING+`**: por diseño documentado (requiere intervención manual). Riesgo de descuadre si merchant cancela tarde.

**Estado de la operación actual (TEST):**

El sistema está corriendo con `MP_ACCESS_TOKEN` que comienza con `TEST-`. La detección sandbox/PROD se basa en `process.env.NODE_ENV !== "production"`. Las TEST credentials de MP **caducan** después de períodos largos de inactividad — es por eso que Mauro vio el panel pidiendo reactivar. **No es bug del proyecto, es comportamiento normal de MP.** Se resuelve regenerando las credenciales en el panel y copiándolas al `.env`.

**Veredicto del consejo (sin sugerir todavía):**

Para lanzar Moovy de manera segura, **NO falta agregar más features de pago**. Falta:

1. **Hacer end-to-end test exhaustivo** del flujo de cobro al buyer en TEST con las credenciales nuevas (cobro exitoso, rechazo, webhook recibido, refund).
2. **Habilitar el OAuth de merchants** en producción (hoy probablemente nunca se usó porque está en TEST).
3. **Decidir si el pago a drivers** se hace por batch (con CBU/Alias) o por OAuth MP, y construir lo necesario.
4. **Activar credenciales de producción** en MP cuando todo lo anterior pase end-to-end en TEST.
5. **Posponer split-payment automático para drivers** (no es viable hasta que tengan OAuth, muchas semanas de trabajo + setup de credenciales adicionales en MP).

**Una decisión arquitectónica clave**: Mauro originalmente pidió "ambos" para drivers (CBU + OAuth MP). El consejo recomienda fuertemente **empezar solo con CBU/Alias** para drivers. Razones detalladas en sección 7.

---

## Cobro al buyer

### Endpoint de creación

**Path:** `src/app/api/orders/route.ts` (~1131 líneas, método POST)

Cuando el buyer toca "Pagar" en el frontend:

1. Frontend hace `POST /api/orders` con `paymentMethod: "mercadopago"` (o `"cash"`), items, dirección, etc.
2. Servidor valida en una transacción serializable: stock, delivery fee server-side (nunca confía en el cliente), zonas excluidas (Costa Susana hardcoded), cupones, puntos.
3. Crea `Order` con `status=PENDING`, `paymentStatus=PENDING`.
4. Si el método es `mercadopago`:
   - Resuelve si hay `vendorAccessToken` (split payment): busca `mpAccessToken` en el `Merchant` o `SellerProfile` que está cobrando.
   - Calcula `marketplace_fee = Σ(subOrder.moovyCommission)` solo si hay vendor token Y comisión > 0.
   - Construye el body de la preference vía `buildPreferenceBody()` en `src/lib/mercadopago.ts`.
   - Llama a `createVendorPreference(token, body)` si hay split, o `preferenceApi.create()` con el token de Moovy si no.
   - Recibe `preference.id` + `init_point` + `sandbox_init_point`.
   - Actualiza Order con `mpPreferenceId`, pasa a `status=AWAITING_PAYMENT`.
5. Si el método es `cash`:
   - No crea preference. Pasa directo a `requiresMerchantConfirmation: true`.
6. Emite socket event `new_order` al merchant/seller (no espera confirmación de pago — el merchant ya ve el pedido entrante).
7. Manda email de confirmación de orden al buyer.
8. Devuelve 201 con `{ orderId, preferenceId, initPoint, sandboxInitPoint }`.

### Webhook handler

**Path:** `src/app/api/webhooks/mercadopago/route.ts` (~510 líneas)

Cuando MP recibe el pago del buyer y notifica:

1. **Validación HMAC** (línea 27-41): rechaza si falta `MP_WEBHOOK_SECRET` o el header `x-signature` no matchea con `crypto.timingSafeEqual`. Template: `id:{dataId};request-id:{xRequestId};ts:{ts};` con HMAC-SHA256.
2. **Idempotencia** (línea 43-58): genera `eventId` determinístico (`xRequestId` o fallback `payment-{dataId}`) y consulta `MpWebhookLog`. Si ya se procesó, devuelve `already_processed: true` sin hacer nada. Si no, hace `upsert` con `processed: false`.
3. **Fetch del payment** desde MP via `paymentApi.get(mpPaymentId)`.
4. **Validación de monto** (línea 139-177): si la diferencia entre lo pagado y `order.total` supera $1, marca `order.mpStatus = "amount_mismatch"` y NO confirma. Esto previene cobros parciales o manipulación.
5. **Procesamiento por estado**:
   - **approved** → `handleApproved`: `paymentStatus=PAID`, `status=CONFIRMED`, `paidAt=now()`. Emite socket `payment_confirmed` a merchant/seller. Manda email al buyer.
   - **rejected** → `handleRejected`: si la orden está en `PENDING / CONFIRMED / AWAITING_PAYMENT / SCHEDULED`, restaura stock y cancela. Si está en `PREPARING+`, solo marca `paymentStatus=FAILED` (requiere intervención manual). Push notification al buyer con tipo `PAYMENT_REJECTED`.
   - **pending / in_process / otros**: solo actualiza `mpStatus`, no cambia el estado de la orden.
6. Marca `MpWebhookLog.processed = true` y devuelve 200.

**Race condition handling**: si el webhook llega antes de que se haya commiteado la orden (race con `POST /api/orders`), reintenta una vez con espera de 2s. Si aún no aparece, devuelve 404 y MP lo reintenta automáticamente.

### Refund

**Función:** `createRefund(mpPaymentId)` en `src/lib/mercadopago.ts` línea 275-316.

Hace `POST https://api.mercadopago.com/v1/payments/{id}/refunds` con body vacío (refund total). Usa `MP_ACCESS_TOKEN` para autenticarse. Devuelve `{ id, status, amount }` o `null` si falla.

**Cuándo se usa hoy:**
- Auto-cancel por timeout en `cron/retry-assignments` (rama del 2026-04-21 ISSUE-015).
- Auto-cancel cuando merchant rechaza pedido ya pagado (rama anterior — confirmar).

**Cuándo NO se usa (debería):**
- Cancelación manual del admin desde panel.
- Cancelación del buyer (si el flujo lo permite).
- Refund parcial (multi-vendor con uno solo cancelado).

### Conclusión

El cobro al buyer está **maduro y funcional** en TEST. Tiene buenas prácticas (idempotencia robusta, HMAC validation, transacciones serializables, validación de monto). Lo único que falta es **probar end-to-end con las nuevas credenciales TEST** que Mauro va a regenerar, y después activar PROD.

---

## Pagos a los actores

### Merchant

**Cómo cobra hoy:**
- **Si tiene OAuth MP conectado**: split payment automático. La plata del buyer se reparte en el momento del checkout. Moovy recibe la comisión, merchant recibe el neto directo a su cuenta MP. Sin demoras.
- **Si NO tiene OAuth MP**: la plata entra a Moovy (cuenta operativa). Admin tiene que generar `PayoutBatch` periódicamente, descargar CSV, transferir manualmente desde su MP/banco al CBU/Alias del merchant, y marcar como pagado en el panel.

**Estado**: ✅ Funcional para los dos casos. Schema completo (`mpAccessToken`, `mpRefreshToken`, `mpUserId`, `mpEmail`, `bankAccount`, `cuit`, todos encriptados). UI de OAuth en `/comercios/configuracion`.

**Caveat**: nunca se probó OAuth en producción. Hoy todos los merchants en TEST seguramente no tienen OAuth (porque MP TEST no tiene flow de OAuth real igual al de PROD).

### Seller (marketplace)

**Cómo cobra hoy:**
- **Si tiene OAuth MP conectado**: igual que merchant — split payment automático.
- **Si NO tiene OAuth MP**: 🚨 **el sistema NO tiene forma de pagarle vía batch**. No hay función `getPendingSellerPayouts()`. Los sellers están huérfanos del flujo de batch manual. Hoy el admin tiene que pagar manualmente afuera del sistema sin trazabilidad.

**Estado**: 🟡 OAuth funciona, batch falta.

### Driver

**Cómo cobra hoy:**
- **NO tiene OAuth MP**: el modelo `Driver` no tiene campos `mp*`.
- **NO tiene campos bancarios en schema**: no hay `bankCbu`, `bankAlias`, `bankAccount`. Solo `cuit` (encriptado) que sirve para identificar pero no para transferir.
- **`PayoutBatch` para drivers existe** pero el endpoint `POST /api/admin/payouts/batches` rechaza la creación con un 400 si algún driver no tiene `bankAccount` cargado — y como ningún driver lo tiene, **no se puede generar ningún batch para drivers**.

**Estado**: ❌ **NO FUNCIONAL.** El admin paga 100% offline (WhatsApp el CBU, transfiere desde su banco/MP, registra en una planilla externa). Sin trazabilidad en el sistema, sin audit trail, sin defensa en disputas.

### Tabla resumen

| Actor | OAuth MP | Datos bancarios DB | Split payment | Batch payout | Estado |
|---|---|---|---|---|---|
| **Merchant** | ✅ | ✅ | ✅ (si OAuth) | ✅ (si banco) | Funcional |
| **Seller** | ✅ | ✅ | ✅ (si OAuth) | ❌ (no implementado) | Parcial |
| **Driver** | ❌ | ❌ | ❌ | ❌ (rechaza por falta de banco) | No funcional |

---

## Configuración

### Variables de entorno usadas hoy

Solo 3 variables de MP están en uso por el código:

```bash
MP_ACCESS_TOKEN     # Token de plataforma Moovy. Usado para SDK init, refunds, OAuth signing.
MP_WEBHOOK_SECRET   # HMAC secret para validar webhooks (anti-spoofing).
MP_APP_ID           # ID público de la app Moovy en el panel MP. Usado en URL OAuth authorize.
```

### Variables declaradas pero NO usadas

```bash
MP_PUBLIC_KEY       # Declarada en env-validation.ts como required en producción.
                    # NO se usa en el código actualmente.
                    # Probablemente intencional: placeholder para cuando se use Checkout API
                    # (en lugar de Checkout Pro) que sí necesita publishing key del frontend.
```

### Modo TEST vs PROD — cómo se decide

El código distingue por `process.env.NODE_ENV !== "production"`. No hay otro flag explícito. El comportamiento diferencial:

| Comportamiento | TEST/dev | PROD |
|---|---|---|
| `auto_return` en preference | Deshabilitado (evita redirect loops en sandbox) | `"approved"` |
| `notification_url` en preference | Excluido si baseUrl es localhost | Incluido |
| Logs de debug | Verbosos | Silenciosos |
| URLs de back_url | localhost | somosmoovy.com |

**No hay validación** de que el `MP_ACCESS_TOKEN` sea coherente con el modo (ej: que en PROD no esté usando un token `TEST-`). Riesgo: si alguien hace deploy a PROD con `.env` que tiene token TEST, todos los pagos van a sandbox y nadie cobra.

### SDK MercadoPago

Versión instalada: **`mercadopago@^2.12.0`** (declarada en `package.json`). Usa la API v2 (recomendada por MP, no la v1 deprecada). Inicialización singleton en `src/lib/mercadopago.ts`.

### `.env.example` actual

El archivo existe en el repo (`.env.example`, 66 líneas). Tiene las 4 variables MP listadas (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `MP_APP_ID`) pero **NO documenta la separación TEST/PROD** ni explica de dónde se sacan los valores. Falta agregar:

- Comentarios sobre cuándo usar `TEST-` vs `APP_USR-`.
- Cómo regenerar las credenciales TEST cuando se desactivan.
- Nota sobre que `MP_PUBLIC_KEY` no se usa todavía (para evitar confusión).
- Cuando se agregue OAuth para drivers, faltarán `MP_CLIENT_ID` (= `MP_APP_ID`) y `MP_CLIENT_SECRET`.

Ver sección "Apéndice" para versión propuesta.

---

## Matriz consolidada

### Por flujo de pago

| Flujo | Implementado | Probado en TEST | Probado en PROD | Riesgo si rompe |
|---|---|---|---|---|
| Cobro buyer con MP | ✅ | ⚠️ pendiente verificar con TEST nuevas | ❌ | 🔴 Crítico — sin pago no hay venta |
| Cobro buyer con efectivo | ✅ | ✅ | ⚠️ probablemente | 🟡 Medio |
| Webhook MP → confirmar orden | ✅ | ⚠️ pendiente | ❌ | 🔴 Crítico |
| Refund automático cancelación | 🟡 (parcial — solo en cron) | ❌ | ❌ | 🟠 Alto |
| Split payment merchant | ✅ | ❌ | ❌ | 🟠 Alto (USP) |
| Split payment seller | ✅ | ❌ | ❌ | 🟠 Alto |
| Batch payout merchant | ✅ | ⚠️ | ❌ | 🟠 Alto |
| Batch payout driver | ❌ (schema bloquea) | ❌ | ❌ | 🔴 Crítico (no se puede pagar) |
| Batch payout seller | ❌ (no implementado) | ❌ | ❌ | 🟠 Alto |
| Refund manual admin | ❌ (no hay endpoint) | ❌ | ❌ | 🟡 Medio |

### Por actor

| Actor | Cobra al instante (split) | Cobra por batch | Tiene UI de configuración | Tiene email cuando le pagan |
|---|---|---|---|---|
| Buyer | N/A | N/A | N/A | ✅ confirmación |
| Merchant | ✅ si OAuth | ✅ | ✅ | ⚠️ parcial |
| Seller | ✅ si OAuth | ❌ | ✅ | ⚠️ parcial |
| Driver | ❌ | ❌ | ❌ | ❌ |

---

## Riesgos y gaps

### Críticos (bloquean lanzamiento o ponen plata en riesgo)

1. **Drivers no se les puede pagar via sistema**: 100% manual offline. Si Moovy lanza con 5+ drivers, esto es operacionalmente insostenible y genera disputas.
2. **OAuth de merchant nunca probado en PROD**: si merchants importantes no logran conectar MP, el split payment falla y la plata queda en Moovy hasta que admin transfiera manualmente. Demora UX para el merchant que esperaba "cobrar al instante".
3. **No hay auto-refund cuando admin cancela**: el admin tiene que recordar hacerlo manual desde el panel MP. Riesgo: cancelación procesada en sistema sin refund disparado → buyer reclama.
4. **No hay validación de coherencia token vs entorno**: si en PROD se deploy un `.env` con token TEST, los pagos van a sandbox y nadie cobra.

### Importantes (afectan UX o operación)

5. **Sellers sin OAuth no pueden cobrar via batch**: queda fuera del flujo administrativo.
6. **Email duplicado al buyer**: confirmación de orden + confirmación de pago llegan casi al mismo tiempo y dicen casi lo mismo.
7. **Stock no se restaura post-`PREPARING`**: si merchant cancela tarde, requiere intervención manual.
8. **`MP_PUBLIC_KEY` declarada pero no usada**: confunde futuros devs.

### Menores (mejoras incrementales)

9. No hay cron de generación automática de batches (admin lo dispara manual cada vez).
10. No hay endpoint admin de refund manual (la función existe colgada).
11. No hay test E2E automatizados de flow de pagos (todo el testing es manual).

---

## Recomendación del consejo

> **Visión:** Moovy va a manejar millones de ARS al mes en 6-12 meses. La estrategia de pagos debe pensarse para ese escenario, no para los primeros días. Pero las primeras decisiones tienen que ser conservadoras — la complejidad agrega riesgo, y plata es lo último que querés que se rompa.

### Pregunta estratégica #1: split payment vs batch — ¿cuál usar para cada actor?

|  | Split payment | Batch (lo que hay hoy) |
|---|---|---|
| **Pros** | UX excelente — "cobré al instante" (USP de Moovy). Cero trabajo operativo del admin. | Control total: podés ajustar contracargos antes de pagar. Ideal en disputas. No requiere OAuth. |
| **Contras** | Requiere OAuth obligatorio del actor. Si MP rechaza el split, el pedido falla. Si hay disputa después, ya pagaste. | UX para el actor: espera 1-7 días. Trabajo operativo del admin. |
| **Riesgo** | Bajo si el actor está consolidado (proveedor confiable). Alto si recién se incorpora. | Bajo (admin valida cada pago). |

**Recomendación por rol:**

- **Merchants** → **batch en mes 1-3 + split a partir del mes 4.**
  - Razón: en delivery hay disputas frecuentes ("el comercio mandó hamburguesa fría", "cobraron de más", "faltaba un ítem"). El admin necesita poder ajustar el pago antes de transferir. Cuando un merchant lleva 3+ meses con cero disputas, le habilitás split automático para premiarlo (también incentiva calidad).
  - Implementación: ya existe el flujo batch. Para split lo único que falta es habilitar `mpAccessToken` chequeo en el endpoint y UI para que merchant conecte MP.

- **Drivers** → **batch desde el día 1.**
  - Razón: los viajes tienen menos disputas (entregó/no entregó). Pero el driver en el día 1 no tiene OAuth listo y MP requiere mucha verificación de identidad. Empezá con CBU/Alias clásico.
  - Implementación: agregar campos bancarios al modelo `Driver`, agregar UI en el portal del driver, dejar que el batch existente funcione contra esos datos.
  - Post-launch (3-6 meses): considerar OAuth si los drivers se quejan de la espera.

- **Sellers (marketplace)** → **batch siempre.**
  - Razón: productos físicos tienen riesgo de devolución alto. Mismo argumento que merchant pero peor (no hay verificación de "entrega correcta" como en delivery).
  - Implementación: hace falta función `getPendingSellerPayouts()` en `src/lib/payouts.ts` y soporte en el endpoint y UI. Si OAuth ya está, podés usar split más adelante para sellers premium.

### Pregunta estratégica #2: ¿cómo paga Moovy a los actores cuando NO hay split?

Hoy: admin descarga CSV y transfiere manualmente desde su MP o banco. **Esto es manual y no escala.** Dos caminos:

**A. Mantener manual con CSV en bulk (corto plazo, 0-6 meses):**
- 5-30 actores: viable. Admin transfiere 1 vez por semana, 30 minutos de trabajo.
- 30+: crítico. Cada error de tipeo es disputa. Audit trail débil.

**B. Integrar API de transferencias de MP (mediano plazo, 6-12 meses):**
- MP tiene endpoint `/v1/money_requests` para iniciar transferencias programáticas desde una cuenta a otra MP.
- Requiere que el actor tenga OAuth conectado (o sea cuenta MP del actor identificada).
- Una vez integrado: admin marca el batch como "ejecutar" y el sistema dispara las N transferencias en paralelo, con tracking de éxito/falla.
- Costo: más desarrollo (~1-2 sprints). Beneficio: cero trabajo manual + audit completo.

**Recomendación**: empezá con A (lo que ya tenés). Antes de pasar a B, validá que el flujo manual aguanta 50 actores. La escalabilidad de B requiere setup de credenciales adicionales en MP que tarda semanas.

### Pregunta estratégica #3: ¿cuándo activar PROD?

**Criterios mínimos antes de pasar de TEST a PROD:**

1. ✅ Cobro al buyer probado end-to-end en TEST con las credenciales nuevas (regeneradas hoy en panel MP).
2. ✅ Webhook validado: enviar pago TEST → ver en logs que el HMAC pasó, el monto matcheó, y la orden se confirmó.
3. ✅ Refund probado: rechazar un pedido pagado y confirmar que el dinero vuelve al buyer en TEST.
4. ✅ OAuth del primer merchant real en TEST (un comercio amigo, validar el flow).
5. ✅ Split payment probado con ese merchant: hacer pedido, verificar que la plata se reparte (Moovy recibe comisión, merchant recibe neto).
6. ⚠️ Solo entonces, regenerar credenciales PROD en MP y activar.

**No es necesario que esté lista la integración de drivers para activar PROD del cobro a buyers.** Son flujos independientes — Moovy puede operar 1-3 meses pagando a drivers manual mientras el cobro al buyer está 100% en producción.

---

## Plan de testing

### Paso 1 — regenerar credenciales TEST (10 min)

1. Andá al [panel de MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel).
2. Entrá a tu app de Moovy.
3. **Sección "Credenciales de prueba"**: si están desactivadas, hacé click en "Activar" o "Regenerar". MP te va a dar:
   - Public Key (empieza con `TEST-`)
   - Access Token (empieza con `TEST-`)
4. **Sección "Credenciales de producción"** (no la toques todavía): tomá nota de que existe un Access Token de prod separado. Lo usás solo cuando termines testing.
5. **Webhook Secret**: si es la primera vez, generá uno nuevo (string random largo). Guardalo en MP en "Notificaciones" y en tu `.env`.
6. **App ID**: número que ves en la URL del panel (no se regenera).

### Paso 2 — actualizar `.env` local (5 min)

Editá tu `.env` con las credenciales TEST nuevas:

```bash
MP_ACCESS_TOKEN="TEST-XXXXXXX-NUEVO-VALOR"
MP_PUBLIC_KEY="TEST-yyyyyyyy"   # Aunque no se usa en código, el env-validation lo pide en prod
MP_WEBHOOK_SECRET="el_secret_que_generaste"
MP_APP_ID="el_app_id_que_no_cambia"
```

### Paso 3 — testear cobro al buyer en local (15 min)

1. `npm run dev`
2. Crear un pedido como buyer con `paymentMethod: "mercadopago"`.
3. En el redirect a MP, **usar tarjeta de testing**:
   - Visa aprobada: `4509 9535 6623 3704`, cualquier CVV, vencimiento futuro.
   - Mastercard aprobada: `5031 7557 3453 0604`.
   - Mastercard rechazada (testing flujo de error): poner cualquiera y nombre `OTHE` (el sistema rechaza).
4. **Verificar en local**:
   - Después del pago: orden pasa a `CONFIRMED` y `paymentStatus=PAID`.
   - En logs aparece "Webhook MP recibido", validación HMAC OK, idempotencia OK.
   - Email de confirmación llega al buyer.
   - Socket emit `payment_confirmed` aparece en `/ops/live`.

**Cosa importante**: en local, MP no te puede mandar webhooks porque no expone tu localhost. Para probar el webhook hay 2 opciones:
- **Usar ngrok** (`ngrok http 3000`) y configurar el webhook URL en MP a la URL pública.
- **Disparar el webhook manualmente** con `curl` simulando MP (para validar la lógica, no la red).

### Paso 4 — testear rechazo + refund (10 min)

1. Hacer un pedido y pagar con tarjeta de testing rechazada.
2. Confirmar que la orden queda `CANCELLED`, `paymentStatus=FAILED`, stock restaurado.
3. Probar el flujo manual: aprobar un pedido, después cancelarlo desde admin, ver si dispara refund (si está implementado para ese path).

### Paso 5 — testear OAuth del primer merchant (20 min)

1. Crear un merchant de prueba en TEST.
2. En `/comercios/configuracion`, hacer click en "Conectar MercadoPago".
3. Loguearse en MP TEST como otra cuenta (la del merchant).
4. Autorizar.
5. Verificar que `Merchant.mpAccessToken`, `mpRefreshToken`, `mpUserId`, `mpEmail` se guardaron en DB (encriptados).

### Paso 6 — testear split payment (15 min)

1. Como buyer, hacer un pedido al merchant que conectó MP.
2. Pagar con MP TEST.
3. Verificar:
   - La preference incluyó `marketplace_fee` con la comisión calculada.
   - El cobro fue exitoso.
   - **En el panel del merchant en MP**: aparece como "venta recibida".
   - **En el panel de Moovy**: solo aparece la comisión (no el total).

### Paso 7 — pasar a PROD

Si los pasos 1-6 todos pasaron sin sorpresas:

1. Regenerar credenciales **producción** en el panel MP.
2. Validá tu `.env` de producción (en el VPS):
   ```bash
   MP_ACCESS_TOKEN="APP_USR-..."   # Empieza con APP_USR, NO con TEST-
   MP_PUBLIC_KEY="APP_USR-..."
   MP_WEBHOOK_SECRET="el_secret_de_prod"
   MP_APP_ID="..."
   ```
3. Configurá el webhook URL de PROD en el panel MP: `https://somosmoovy.com/api/webhooks/mercadopago`.
4. Hacé un **pago real de prueba** (vos, con tu tarjeta, $100 a un merchant de prueba). Verificá que todo el flujo funciona end-to-end.
5. Refund de ese pago para no quedar con plata fantasma en el sistema.
6. Comunicá al primer merchant para que conecte su MP en PROD.

---

## Roadmap

### Pre-launch (próximas 2 semanas, en orden)

1. **Regenerar credenciales TEST** (10 min — Mauro hoy mismo).
2. **Test E2E cobro buyer** (45 min — Mauro + Claude pareja, los 7 pasos del plan de testing).
3. **Implementar refund automático en admin cancelation** (rama nueva ~3-4h — endpoint `/api/admin/orders/[id]/refund` + integrar en flow de cancelación).
4. **`feat/driver-bank-mp` SIMPLIFICADA — solo CBU/Alias** (rama nueva ~6-8h):
   - Schema: agregar `bankCbu`, `bankAlias`, `bankAccount` a `Driver` (nullable).
   - UI driver: sección "Mis pagos" con form CBU/Alias.
   - Validación: helper `bank-account.ts` ya existe (rama del 2026-04-23).
   - Encriptación: aplicar `encryptDriverData` (helper ya existe).
   - **Sin OAuth MP** en esta rama. Eso queda post-launch.
5. **`feat/seller-payout-batch`** (rama nueva ~3-4h — agregar `getPendingSellerPayouts()`, soporte en endpoint y UI).
6. **Email "te pagamos $X"** al actor cuando admin marca batch como PAID (~1h).
7. **Activar PROD** (cuando todo lo anterior pase E2E en TEST).

### Post-launch (mes 2-6)

- **OAuth MP para drivers** (cuando 30+ drivers operen y batch manual sea cuello de botella).
- **API de transferencias programáticas** (sustituir el CSV manual por trigger desde el sistema).
- **Split payment activo para merchants premium** (3+ meses sin disputas).
- **Refund parcial multi-vendor** (cuando uno solo cancela en pedido con varios sellers).
- **Dashboard de reconciliación** en `/ops/finanzas` (matchear webhooks recibidos vs payments en MP, alertar discrepancias).

### Reglas operativas que el consejo recomienda escribir en CLAUDE.md

> Las siguientes reglas no están en el código todavía pero las traemos como decisiones del consejo de auditoría:

- **Regla #X**: nunca activar producción de pagos sin un test E2E manual del checkout completo en TEST con las credenciales nuevas. Una hora de testing salva mil disputas.
- **Regla #Y**: validación de coherencia entorno↔token: en startup, si `NODE_ENV === "production"` y `MP_ACCESS_TOKEN.startsWith("TEST-")`, abortar con error fatal. No deployar PROD con credenciales TEST.
- **Regla #Z**: cualquier cancelación de pedido pagado DEBE disparar refund automático. Si el refund falla, alertar a admin via socket + email para resolver manual. NUNCA cancelar sin refund — el buyer reclama el doble (cancelaron Y no me devolvieron plata).

---

## Apéndice

### `.env.example` propuesto (sección MP)

Cuando termine la auditoría, vamos a actualizar `.env.example` con esta sección expandida:

```bash
# ============================================================
# MERCADOPAGO
# ============================================================
#
# IMPORTANTE: Distinguir credenciales TEST vs PRODUCCIÓN.
# - TEST: empiezan con "TEST-" — para sandbox y desarrollo local.
#         Caducan después de ~60-90 días sin uso. Si esto pasa, regenerar
#         desde el panel de MP > Credenciales de prueba > Activar/Regenerar.
# - PROD: empiezan con "APP_USR-" — para producción. Las generás cuando
#         tu app pase la verificación de MP. NO las commitees al repo.
#
# Para obtenerlas:
#   1. https://www.mercadopago.com.ar/developers/panel
#   2. Crear o entrar a la app "MOOVY"
#   3. Sección "Credenciales" — copiar Access Token, Public Key, App ID
#   4. Sección "Notificaciones" — generar webhook secret HMAC nuevo

# Token principal de la app Moovy. Usado para crear preferences (Checkout Pro),
# refunds, OAuth signing. NUNCA loguear ni exponer al frontend.
MP_ACCESS_TOKEN="TEST-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"

# Public Key (la del frontend Checkout API). Hoy NO se usa en el código pero
# está validada en env-validation.ts como required en producción.
# Cuando agreguemos Checkout API (en lugar de Checkout Pro redirect), se va a usar.
MP_PUBLIC_KEY="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# HMAC secret para validar webhooks. Configurarlo TAMBIÉN en el panel MP en la
# sección "Notificaciones" → Webhooks → Secret. Si MP y .env no coinciden,
# todos los webhooks van a fallar con 401.
MP_WEBHOOK_SECRET="webhook_hmac_secret_largo_y_aleatorio"

# ID público de la app en MP. Usado para construir URLs de OAuth authorize.
# Se llama también "Client ID" en el panel.
MP_APP_ID="3105420000000000"

# Cuando agreguemos OAuth para drivers (post-launch), también va a hacer falta:
# MP_CLIENT_SECRET="..."   # Disponible en panel MP > Credenciales > Client Secret
# (es distinto del access token; específico para flow OAuth)
```

---

## Próximos pasos concretos

Mauro:

1. **Regenerá las credenciales TEST en el panel MP** (10 min).
2. **Actualizá tu `.env` local** con las credenciales nuevas.
3. **Avisame cuando estén listas** y arrancamos los 7 pasos del plan de testing en pareja. No agregamos features hasta confirmar que el cobro al buyer funciona end-to-end con las credenciales TEST regeneradas.
4. Una vez que pase TEST, **decidimos juntos** si arrancamos `feat/driver-bank-mp` simplificada (solo CBU/Alias) o si activamos PROD del cobro buyer primero.

**Esta auditoría queda como referencia permanente en `docs/auditorias/`. Releerla cuando dudes del estado de pagos.**



---

# Archivo: `docs/auditorias/MOOVY_Security_Fixes.md`

# MOOVY - Codigo de Correccion: Top 10 Vulnerabilidades Criticas

> Fecha: 19 de Marzo de 2026 | Clasificacion: CONFIDENCIAL

---

## FIX 1 — V-002: Eliminar Secrets Hardcodeados (socket-server.ts)

**Archivo:** `scripts/socket-server.ts` lineas 12-13

**Antes:**
```typescript
const SOCKET_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const CRON_SECRET = process.env.CRON_SECRET || "moovy-cron-secret-change-in-production";
```

**Despues:**
```typescript
const SOCKET_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

if (!SOCKET_SECRET) {
  console.error("FATAL: AUTH_SECRET or NEXTAUTH_SECRET must be set");
  process.exit(1);
}
if (!CRON_SECRET) {
  console.error("FATAL: CRON_SECRET must be set");
  process.exit(1);
}
```

---

## FIX 2 — V-005: Eliminar Endpoints Debug

**Archivos a eliminar:**
- `src/app/api/debug-cookies/route.ts`
- `src/app/api/debug-session/route.ts`

**Alternativa (si se necesitan en dev):**
```typescript
// src/app/api/debug-session/route.ts
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    roles: (session.user as any).roles || [],
    // NUNCA exponer: cookies, headers, tokens, stack traces
  });
}
```

---

## FIX 3 — V-006: Restringir CORS de Socket.IO

**Archivo:** `scripts/socket-server.ts` linea ~60

**Antes:**
```typescript
cors: { origin: true, methods: ["GET", "POST"], credentials: true }
```

**Despues:**
```typescript
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // Agregar dominios adicionales si es necesario
].filter(Boolean);

cors: {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.warn(`Socket.IO CORS rejected origin: ${origin}`);
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}
```

---

## FIX 4 — V-012: Requerir MP_WEBHOOK_SECRET

**Archivo:** `src/app/api/webhooks/mercadopago/route.ts` linea ~27

**Antes:**
```typescript
if (process.env.MP_WEBHOOK_SECRET) {
  const isValid = verifyWebhookSignature(/* ... */);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
}
// Si no hay secret, se skipea la validacion
```

**Despues:**
```typescript
if (!process.env.MP_WEBHOOK_SECRET) {
  console.error("CRITICAL: MP_WEBHOOK_SECRET is not configured. Rejecting webhook.");
  return NextResponse.json({ error: "Webhook validation not configured" }, { status: 500 });
}

const isValid = verifyWebhookSignature(
  request.headers.get("x-signature") || "",
  request.headers.get("x-request-id") || "",
  dataId,
  process.env.MP_WEBHOOK_SECRET
);

if (!isValid) {
  console.warn(`Invalid webhook signature from ${request.headers.get("x-forwarded-for")}`);
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

---

## FIX 5 — V-014: Validar Montos de Refund

**Archivo:** `src/app/api/ops/refund/route.ts`

**Codigo corregido completo:**
```typescript
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { orderId, amount, reason } = await request.json();

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    return NextResponse.json({ error: "Motivo requerido (minimo 10 caracteres)" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Validar estado de pago (solo refundir pagos completados)
  if (!["COMPLETED", "PAID"].includes(order.paymentStatus || "")) {
    return NextResponse.json({
      error: `No se puede reembolsar un pedido con estado de pago: ${order.paymentStatus}`
    }, { status: 400 });
  }

  if (order.paymentStatus === "REFUNDED") {
    return NextResponse.json({ error: "Este pedido ya fue reembolsado" }, { status: 400 });
  }

  // Validar monto
  const refundAmount = amount ? Number(amount) : order.total;
  if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > order.total) {
    return NextResponse.json({
      error: `Monto invalido. Debe ser entre $0.01 y $${order.total}`
    }, { status: 400 });
  }

  // Idempotency key
  const idempotencyKey = `refund-${orderId}-${crypto.randomUUID()}`;

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "REFUNDED",
      adminNotes: `${order.adminNotes || ""}\n[REEMBOLSO ${new Date().toISOString()}] $${refundAmount} por ${session.user.email} | Motivo: ${reason.trim()} | Key: ${idempotencyKey}`.trim()
    }
  });

  // Audit log
  await logAudit({
    action: "REFUND_PROCESSED",
    entityType: "order",
    entityId: orderId,
    userId: session.user.id,
    details: { refundAmount, reason: reason.trim(), idempotencyKey, originalTotal: order.total }
  });

  return NextResponse.json({ success: true, order: updatedOrder });
}
```

---

## FIX 6 — V-003/V-027: Unificar Validacion de Password

**Archivo:** `src/app/api/auth/reset-password/route.ts` y `change-password/route.ts`

**En ambos archivos, reemplazar:**
```typescript
if (!password || password.length < 6) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

**Con:**
```typescript
import { validatePasswordStrength } from "@/lib/security";

const passwordValidation = validatePasswordStrength(password);
if (!passwordValidation.isValid) {
  return NextResponse.json({
    error: `Password invalido: ${passwordValidation.errors.join(", ")}`
  }, { status: 400 });
}
```

**Tambien en `src/app/api/auth/register/route.ts`:**
```typescript
// Reemplazar la validacion simple con:
const passwordValidation = validatePasswordStrength(password);
if (!passwordValidation.isValid) {
  return NextResponse.json({
    error: `La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero`
  }, { status: 400 });
}
```

---

## FIX 7 — V-018: Validar Magic Bytes en Uploads

**Archivo:** `src/app/api/upload/route.ts`

**Agregar antes del procesamiento con sharp:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Validar tamano ANTES de leer
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: `Archivo demasiado grande. Maximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
    { status: 400 }
  );
}

const buffer = Buffer.from(await file.arrayBuffer());

// Validar magic bytes
const MAGIC_BYTES: Record<string, number[][]> = {
  jpeg: [[0xFF, 0xD8, 0xFF]],
  png: [[0x89, 0x50, 0x4E, 0x47]],
  gif: [[0x47, 0x49, 0x46, 0x38]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function validateMagicBytes(buf: Buffer): boolean {
  for (const signatures of Object.values(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => buf[i] === byte)) {
        return true;
      }
    }
  }
  return false;
}

if (!validateMagicBytes(buffer)) {
  return NextResponse.json(
    { error: "Formato de imagen no soportado. Solo JPEG, PNG, GIF y WebP." },
    { status: 400 }
  );
}

// Validar extension
const ext = file.name?.split(".").pop()?.toLowerCase();
if (!ext || !["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
  return NextResponse.json(
    { error: "Extension de archivo no permitida" },
    { status: 400 }
  );
}
```

---

## FIX 8 — V-028: Timing-Safe Comparison en Crons

**Archivos:** `src/app/api/cron/assignment-tick/route.ts` y `seller-resume/route.ts`

**Antes:**
```typescript
const token = authHeader?.replace("Bearer ", "");
if (!token || token !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
```

**Despues:**
```typescript
import crypto from "crypto";

function verifyToken(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(provided, "utf-8"),
    Buffer.from(expected, "utf-8")
  );
}

const token = authHeader?.replace("Bearer ", "");
if (!verifyToken(token, process.env.CRON_SECRET)) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
```

---

## FIX 9 — V-024: Audit Logging en Exports

**Archivo:** `src/app/api/ops/export/route.ts`

**Agregar despues de la validacion de auth y antes del return:**
```typescript
import { logAudit } from "@/lib/audit";

// Despues de generar el CSV y antes de retornarlo:
await logAudit({
  action: "DATA_EXPORT",
  entityType: type, // "orders" | "users" | "merchants"
  entityId: `export-${type}-${new Date().toISOString()}`,
  userId: session.user.id,
  details: {
    exportType: type,
    recordCount: data.length,
    filters: { dateFrom, dateTo, search },
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown"
  }
});
```

---

## FIX 10 — V-001/V-030: Validacion de Env Vars al Startup

**Nuevo archivo:** `src/lib/env-validation.ts`

```typescript
/**
 * Validates required environment variables at application startup.
 * Import this in layout.tsx or middleware to ensure early failure.
 */

const REQUIRED_VARS = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
] as const;

const REQUIRED_IN_PRODUCTION = [
  "MP_ACCESS_TOKEN",
  "MP_PUBLIC_KEY",
  "MP_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
] as const;

const WEAK_SECRET_PATTERNS = [
  /moovy.*secret/i,
  /cambiar.*produccion/i,
  /change.*production/i,
  /fallback/i,
  /default/i,
  /your_.*_here/i,
];

export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      errors.push(`Missing required env var: ${key}`);
    }
  }

  // Check production-required vars
  if (process.env.NODE_ENV === "production") {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]) {
        errors.push(`Missing production env var: ${key}`);
      }
    }
  }

  // Check for weak secrets
  const secretVars = ["AUTH_SECRET", "NEXTAUTH_SECRET", "CRON_SECRET"];
  for (const key of secretVars) {
    const value = process.env[key];
    if (value) {
      if (value.length < 32) {
        warnings.push(`${key} is too short (${value.length} chars, minimum 32)`);
      }
      for (const pattern of WEAK_SECRET_PATTERNS) {
        if (pattern.test(value)) {
          errors.push(`${key} matches weak pattern: ${pattern}. Generate a strong random secret.`);
          break;
        }
      }
    }
  }

  if (warnings.length > 0) {
    console.warn("[ENV WARNING]", warnings.join(" | "));
  }

  if (errors.length > 0) {
    console.error("[ENV FATAL]", errors.join(" | "));
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Environment validation failed: ${errors.join("; ")}`);
    }
  }
}
```

**Uso:** Importar en `src/lib/auth.ts` al inicio:
```typescript
import { validateEnv } from "./env-validation";
validateEnv();
```

---

## Resumen de Esfuerzo Estimado

| Fix | Vulnerabilidad | Esfuerzo |
|-----|---------------|----------|
| FIX 1 | V-002: Secrets hardcodeados | 1 hora |
| FIX 2 | V-005: Debug endpoints | 30 min |
| FIX 3 | V-006: Socket CORS | 1 hora |
| FIX 4 | V-012: Webhook validation | 1 hora |
| FIX 5 | V-014: Refund validation | 3 horas |
| FIX 6 | V-003/V-027: Password policy | 2 horas |
| FIX 7 | V-018: Upload magic bytes | 2 horas |
| FIX 8 | V-028: Timing-safe cron | 1 hora |
| FIX 9 | V-024: Export audit logging | 1 hora |
| FIX 10 | V-001/V-030: Env validation | 2 horas |
| **TOTAL** | | **~14 horas** |



---

# Archivo: `docs/auditorias/role-system-audit-2026-04-10.md`

# Auditoría del sistema de roles de Moovy

**Fecha:** 2026-04-10
**Rama:** `feat/roles-single-source-of-truth`
**Estado:** Propuesta de rediseño — pendiente de aprobación del fundador
**Alcance:** Auth, autorización, control de acceso por rol, aprobación de merchants/drivers/sellers

---

## 0. TL;DR — qué está roto y por qué

El sistema de roles de Moovy tiene **6 fuentes de verdad distintas** que compiten por representar el mismo concepto ("¿este usuario puede entrar al portal de comercio?"). Cada endpoint nuevo tiene que recordar actualizar entre 3 y 5 de ellas, y ninguno lo hace de forma consistente. El resultado es un estado que deriva con el tiempo y bugs silenciosos donde el usuario:

- ve un portal al que no puede entrar,
- es aprobado pero su sesión sigue "pendiente",
- tiene un rol activo en una tabla e inactivo en otra,
- pasa un middleware y muere en un layout.

Los parches (auto-heal, role-access helpers) reducen los síntomas pero no atacan la causa. El sistema necesita **una única fuente de verdad derivada** en vez de múltiples flags mantenidas a mano.

---

## 1. Las 6 fuentes de verdad actuales

Para saber "¿X puede acceder al portal de comercio?", el código tiene que consultar y mantener en sincronía:

| # | Campo | Tipo | Escrito por | Leído por |
|---|-------|------|-------------|-----------|
| 1 | `User.role` | String legacy | Solo registro inicial | JWT build (auth.ts:105) |
| 2 | `UserRole[].isActive` | Boolean por fila | Registro + approve + reject + auto-heal | `authorize()` (auth.ts:43) |
| 3 | `Merchant.approvalStatus` | String (PENDING/APPROVED/REJECTED/SUSPENDED) | Register, approve, reject | `getMerchantAccess()` (role-access.ts:42) |
| 4 | `Merchant.isActive` | Boolean | Register (false), approve (true), reject (false) | **Nada lo lee** en el gate de acceso |
| 5 | `Merchant.isVerified` | Boolean | Approve (true), reject (false) | Badges/UI |
| 6 | `Merchant.isSuspended` | Boolean | Suspend/unsuspend endpoints | `getMerchantAccess()` (role-access.ts:72) |

Más los equivalentes para `Driver.*` (con lógica inversa en `isActive`) y `SellerProfile.*` (que no tiene `approvalStatus`, se auto-activa). Total: ~15 campos repartidos en 4 tablas mantenidos a mano.

---

## 2. Inconsistencias verificadas en el código actual

Cada una con archivo, línea y explicación del impacto. Ordenadas por severidad.

### 2.1 [CRÍTICA] Approve/reject no refresca el JWT del usuario

**Dónde:** `src/app/api/admin/merchants/[id]/approve/route.ts`, `src/app/api/admin/drivers/[id]/approve/route.ts` y sus equivalentes reject.

**Qué pasa:** Cuando admin aprueba un merchant, el endpoint actualiza correctamente `Merchant.approvalStatus`, `Merchant.isActive`, `Merchant.isVerified` y activa el `UserRole COMERCIO` dentro de una `$transaction`. **Pero el JWT del usuario aprobado sigue exactamente igual hasta que haga logout/login.** El client del user no tiene forma de saber que algo cambió.

**Impacto real:** El síntoma que Mauro reporta como "aprobar/rechazar repartidor no funciona" probablemente es esto. Admin aprueba, la DB queda bien, pero el driver no ve el cambio en su portal porque su sesión todavía tiene el estado viejo. A ojo del driver, el approve "no hizo nada".

**Por qué el auto-heal no lo arregla:** `autoHealUserRoles` corre en `authorize()` (en el próximo login) y en `jwt()` trigger `update` (si el client pide un refresh). Pero ningún endpoint le dice al client "pedí refresh ahora". Y el driver no va a hacer logout por su cuenta, porque desde su perspectiva la app está rota.

### 2.2 [CRÍTICA] Auto-heal de COMERCIO inyecta el rol sin validar approvalStatus

**Dónde:** `src/lib/auto-heal-roles.ts:75-95`

**Código literal:**
```typescript
// Auto-heal COMERCIO: si existe Merchant para este user, asegurar
// UserRole COMERCIO. NOTA: aceptamos el merchant independientemente de
// su approvalStatus — el gate de aprobación es responsabilidad de
// `role-access.ts` (getMerchantAccess).
if (!activeRoles.has("COMERCIO")) {
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        select: { id: true },  // NO lee approvalStatus
    });
    if (merchant) {
        await prisma.userRole.upsert({...});
    }
}
```

**Qué pasa:** Un usuario con un Merchant en estado PENDING o REJECTED, después de auto-heal, termina con `UserRole COMERCIO.isActive = true` en la DB. El rol existe en el JWT. El `PortalSwitcher` le muestra el botón "Comercio". Cuando hace click, `getMerchantAccess()` lo bouncea a `/comercios/pendiente-aprobacion`.

**Comparación con DRIVER:** el auto-heal de DRIVER **sí** chequea `approvalStatus === "APPROVED"` (línea 42). Así que la lógica no es consistente entre tipos dentro del mismo archivo.

**Por qué era una decisión consciente:** yo mismo documenté esto en CLAUDE.md con la intención de "separar gating de role-presence". En retrospectiva, fue el parche equivocado: introduce una inconsistencia entre "tengo el rol" y "puedo usar el rol" que después tenemos que desentrañar en cada capa. La solución correcta es derivar el rol a partir de `approvalStatus`, no tenerlo como campo independiente.

### 2.3 [ALTA] `Merchant.isActive` y `Driver.isActive` tienen semántica opuesta

**Dónde:**
- `schema.prisma:393` — `Merchant.isActive @default(false)`
- `schema.prisma:503` — `Driver.isActive @default(true)`

**Problema:**
- Merchant arranca `isActive: false` → approve lo pone en `true` → reject lo vuelve a `false`.
- Driver arranca `isActive: true` → reject lo pone en `false`.
- `getMerchantAccess()` **no chequea** `isActive` (solo `approvalStatus` + `isSuspended`).
- `getDriverAccess()` **sí chequea** `isActive`.

**Consecuencia práctica:** Si un admin quiere "desactivar sin rechazar" a un merchant aprobado (por ejemplo, porque el comercio se fue de vacaciones), pone `isActive: false` y **no pasa nada** — el merchant sigue entrando al portal. Para el mismo caso con un driver, funciona.

**Origen del problema:** se agregaron los tres flags (`approvalStatus`, `isActive`, `isVerified`) en momentos distintos y nadie los consolidó. Hoy hay tres campos para representar una sola cosa.

### 2.4 [ALTA] `suspend` no desactiva UserRole (pero `reject` sí)

**Dónde:**
- `src/app/api/admin/users/[id]/suspend/route.ts:134-191` — solo toca `User.isSuspended`, nunca `UserRole.isActive`.
- `src/app/api/admin/merchants/[id]/reject/route.ts:55-58` — sí desactiva `UserRole COMERCIO`.

**Problema:** Dos formas de "bloquear a un usuario" con implementaciones distintas. Si querés preguntarle a la DB "¿este user tiene rol activo?", tenés que chequear además `User.isSuspended`, porque `UserRole.isActive` puede estar `true` mientras el user está suspendido.

**Consecuencia:** cualquier query que asuma "UserRole.isActive = true significa que el rol está vivo" está equivocada.

### 2.5 [ALTA] SellerProfile no tiene `approvalStatus` — modelo inconsistente con Merchant/Driver

**Dónde:** `schema.prisma:553-590`

**Problema:** SellerProfile solo tiene `isActive` e `isSuspended`, no tiene gate de aprobación. Cuando alguien se registra como seller, queda inmediatamente activo sin pasar por admin. Merchant y Driver sí pasan por admin approval.

**Consecuencias:**
- Cualquier persona puede listar productos en el marketplace sin validación.
- No hay `rejectionReason` para sellers.
- No hay trail de auditoría para "por qué rechazaste a X seller".
- La lógica de `getSellerAccess()` es distinta de `getMerchantAccess()` y `getDriverAccess()`.

### 2.6 [MEDIA] Approve/reject merchant y driver no llaman a `logAudit()`

**Dónde:**
- `admin/merchants/[id]/approve/route.ts` — sin logAudit
- `admin/merchants/[id]/reject/route.ts` — sin logAudit
- `admin/drivers/[id]/approve/route.ts` — sin logAudit
- `admin/drivers/[id]/reject/route.ts` — sin logAudit
- `admin/users/[id]/suspend/route.ts:212-222` — **sí** tiene logAudit
- `admin/users/[id]/unsuspend/route.ts:189-197` — **sí** tiene logAudit

**Problema:** Aprobar o rechazar un comercio/repartidor es la operación **más sensible** del panel admin (decide quién puede cobrar en la plataforma) y es la única que no queda registrada en el audit log. Compliance gap y riesgo legal.

### 2.7 [MEDIA] PortalSwitcher muestra portales según JWT sin validar estado real

**Dónde:** `src/components/ui/PortalSwitcher.tsx:39-47`

**Problema:** filtra portales por `userRoles.includes(p.role)` leyendo del JWT. No consulta `approvalStatus`. Si el user tiene COMERCIO en el JWT pero el Merchant está PENDING, ve el botón "Comercio" en el switcher. Click → redirect a pendiente-aprobacion.

**Impacto:** UX confusa, no es fuga de seguridad. Pero es un síntoma claro del problema de fondo: la UI y la seguridad leen distintas fuentes de verdad.

### 2.8 [BAJA] `User.role` legacy nunca se actualiza después del registro

**Dónde:** `schema.prisma:39`, `auth.ts:105`

**Problema:** `User.role` arranca como `"USER"` en el registro y nunca más se toca. `auth.ts` lo sigue leyendo para construir `token.role`. Cualquier código que dependa de ese campo está leyendo un valor obsoleto.

**Evidencia:** grep de `user.role` en el código muestra lecturas en `auth.ts`, `auth-utils.ts`, y algunos lugares dispersos.

### 2.9 [BAJA] Alias MERCHANT ↔ COMERCIO

**Dónde:** `src/lib/auth-utils.ts:19-27`

**Problema:** El enum de Prisma usa `COMERCIO`. El código viejo usa `MERCHANT`. `auth-utils.ts` mantiene un alias bidireccional `ROLE_ALIASES` para que ambos funcionen. `proxy.ts:143` usa `['MERCHANT', 'COMERCIO', 'ADMIN']` — tiene que incluir ambos porque no sabe cuál está en el JWT del user.

**Impacto:** cognitivo. Cada vez que tocás código de roles tenés que recordar el alias. Fuente de bugs futuros si alguien se olvida.

### 2.10 [BAJA] Driver auto-heal tiene lógica redundante

**Dónde:** `src/lib/auto-heal-roles.ts:42`

**Código:**
```typescript
if (driver && (driver.approvalStatus === "APPROVED" || driver.isActive)) {
```

**Problema:** La condición `|| driver.isActive` es redundante porque cualquier driver REJECTED también tiene `isActive: false`. Funciona por accidente. Si alguien cambia la semántica de `isActive` en el futuro, se rompe silenciosamente.

---

## 3. Diagnóstico raíz — por qué esto sigue pasando

El diseño actual trata el rol como **estado persistido** que hay que mantener sincronizado entre múltiples tablas. Cada vez que cambia algo en una tabla (merchant aprobado, driver suspendido, seller desactivado), alguien tiene que acordarse de actualizar la otra tabla. Nadie se acuerda siempre. Resultado: drift.

El auto-heal es un síntoma de este diseño, no una solución. Existe porque aceptamos que el drift va a pasar y tratamos de repararlo en cada login. Pero el auto-heal en sí mismo tomó decisiones cuestionables (COMERCIO se activa aunque esté PENDING) que empeoran el problema.

**El principio correcto es:** los roles no se guardan, se derivan. Un usuario **es** un merchant si existe un `Merchant` aprobado apuntando a su `userId`. Punto. No hace falta una fila en `UserRole` que diga "COMERCIO activo" — esa fila siempre es redundante con el estado del Merchant.

Con ese principio:

- No hay drift posible, porque solo hay una fuente de verdad.
- No hace falta auto-heal.
- `approve` solo cambia `Merchant.approvalStatus`. Nada más que sincronizar.
- El JWT se puede construir barato en cada request sin leer dos tablas.
- `PortalSwitcher`, `proxy`, `layout` y `role-access` leen todos del mismo lugar.

---

## 4. Propuesta de rediseño

### 4.1 Nuevo módulo central: `src/lib/roles.ts`

Una sola función que computa el estado de acceso de un usuario a partir del estado de dominio (Merchant, Driver, SellerProfile, User). Retorna un objeto con forma bien definida:

```typescript
type PortalStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

type UserAccess = {
  userId: string;
  isAdmin: boolean;
  isBuyer: boolean;              // todos los users son buyers por default
  merchant: PortalStatus;        // derivado de Merchant
  driver: PortalStatus;          // derivado de Driver
  seller: PortalStatus;          // derivado de SellerProfile
  isGloballySuspended: boolean;  // User.isSuspended
};

async function computeUserAccess(userId: string): Promise<UserAccess>;
```

`computeUserAccess` hace **una sola query con joins** que trae User + Merchant + Driver + SellerProfile (select mínimo), y devuelve el objeto derivado. Sin escrituras, sin auto-heal, sin drift.

Sobre este helper se construyen los gates específicos:

```typescript
async function requireMerchantAccess(userId: string): Promise<void>;
  // throws redirect(...) si merchant !== "approved"

async function requireDriverAccess(userId: string): Promise<void>;
async function requireSellerAccess(userId: string): Promise<void>;
async function requireAdminAccess(userId: string): Promise<void>;
```

Cada `require*Access` lanza un `redirect()` de Next.js con el destino correcto según el estado. Los layouts protegidos se vuelven de dos líneas:

```typescript
const session = await auth();
await requireMerchantAccess(session!.user!.id);
return <>{children}</>;
```

### 4.2 Qué hace el JWT

El JWT solo guarda lo mínimo estable: `userId`, `isAdmin` (porque admin sí es un campo plano en User), y nada más. No guarda `roles[]`, no guarda `merchantId`, no guarda nada derivado.

Cuando un layout o una API route necesita saber "¿este user puede ser merchant?", llama a `computeUserAccess(userId)` al inicio de la request. Es una sola query indexada, muy barata.

**Beneficio:** el JWT nunca queda desactualizado. El estado siempre se lee fresh del dominio.

**Costo:** una query extra por request protegida. Aceptable — es una query con índices y select mínimo. Se puede cachear por request con `React.cache()` si hace falta.

### 4.3 Qué hace proxy.ts

Solo chequea que haya sesión. Nada de roles. Los roles los chequean los layouts (que ya corren Server Components y pueden usar `requireXAccess`). Esto simplifica proxy.ts y elimina la duplicación entre proxy y layout.

### 4.4 Qué hacen los endpoints de registro

Crean el `Merchant` / `Driver` / `SellerProfile` con `approvalStatus: "PENDING"`. **No tocan `UserRole`.** (Fase 1 del rediseño mantiene la tabla por compatibilidad, pero ya no se usa para gating.)

### 4.5 Qué hacen los endpoints de approve/reject

Solo actualizan `approvalStatus` (más `approvedAt`, `rejectionReason`, `rejectedBy`). **No tocan `UserRole`, no tocan `isActive`, no tocan `isVerified`.** Esos campos o se eliminan en Fase 2 o se dejan como display-only.

Además, agregan audit log.

### 4.6 Qué hace suspend/unsuspend

Sigue tocando `User.isSuspended`. `computeUserAccess` chequea esto y cualquier gate falla si el user está globalmente suspendido. Sin tocar UserRole.

### 4.7 PortalSwitcher

Recibe el objeto `UserAccess` completo (se pasa desde el Server Component padre), no el JWT. Solo muestra portales donde `merchant === "approved"`, `driver === "approved"`, etc. Si está `"pending"`, muestra el portal en gris con un badge "Pendiente" que lleva a la pantalla de pendiente-aprobacion explícita.

### 4.8 Qué se borra

- `src/lib/auto-heal-roles.ts` — innecesario si no hay drift.
- `src/lib/role-access.ts` — reemplazado por `requireXAccess` en `roles.ts`.
- `src/lib/auth-utils.ts` — `hasRole`, `hasAnyRole`, `getUserRoles`, `ROLE_ALIASES` → todo reemplazado por `UserAccess`.
- Lectura de `token.roles` en cualquier lado del código.
- Lectura de `UserRole` table en cualquier lado del código (queda la tabla, pero para features futuras como audit de cambios de rol).
- `Merchant.isActive`, `Merchant.isVerified`, `Driver.isActive` como gates de acceso — se leen como display-only o se borran en Fase 2.
- Lógica de `refreshRoles` en `jwt()` callback — no hace falta, el JWT no guarda roles.

### 4.9 Qué se conserva

- `Merchant.approvalStatus`, `Driver.approvalStatus` — fuente de verdad.
- `Merchant.isSuspended`, `Driver.isSuspended`, `User.isSuspended` — bloqueos temporales ortogonales al approval.
- `Merchant.rejectionReason`, `Driver.rejectionReason`.
- `UserRole` table con `isActive` (por ahora) — no se borra para no forzar migración schema en Fase 1, pero deja de ser fuente de verdad.
- NextAuth + credentials + bcrypt.
- Audit log infrastructure (se va a usar más).
- Suspend/unsuspend flow (con mejoras menores).

### 4.10 Qué se crea nuevo

- `src/lib/roles.ts` — módulo canónico.
- `SellerProfile.approvalStatus` (Fase 2, schema migration) — para que seller sea consistente con merchant/driver.
- `scripts/validate-role-flows.ts` — script que simula los 12 flujos (register → approve → access / register → reject → access / suspend → access / etc.) contra la DB real y valida que cada estado lleve al lugar esperado.
- Audit log entries para approve/reject.
- Llamada a `update({ refreshRoles: true })` desde el cliente admin después de aprobar, para que el user aprobado vea el cambio sin logout. **Espera — con el nuevo diseño esto no hace falta**, porque el JWT no guarda roles. Tacho esta línea.

### 4.11 Fases del rediseño

**Fase 1 (esta rama, sin tocar schema):**
1. Crear `src/lib/roles.ts` con `computeUserAccess` y `requireXAccess`.
2. Crear `scripts/validate-role-flows.ts`.
3. Refactorear los 3 layouts protegidos para usar `requireXAccess`.
4. Refactorear `proxy.ts` para solo chequear sesión.
5. Refactorear endpoints de approve/reject para solo tocar `approvalStatus` + audit log. **No tocar UserRole** (Fase 1 los deja en sync por consistencia, pero el código ya no los lee como gate).
6. Refactorear endpoints de registro para no escribir `UserRole` (o seguir escribiéndolo por compat, pero el código ya no lo lee).
7. Refactorear PortalSwitcher para recibir `UserAccess`.
8. Eliminar `role-access.ts`, `auto-heal-roles.ts`, `auth-utils.ts`.
9. Eliminar lógica de `refreshRoles` en `jwt()` callback.
10. Correr `validate-role-flows.ts` — debe pasar los 12 casos.
11. tsc limpio.
12. Mauro smoke-testea manualmente los flujos.
13. Cierre de rama.

**Fase 2 (rama aparte, schema migration):**
1. Agregar `SellerProfile.approvalStatus`.
2. Eliminar `Merchant.isActive`, `Merchant.isVerified`, `Driver.isActive` (ya nadie los lee como gate).
3. Eliminar columna `UserRole.isActive` o la tabla entera.
4. Eliminar `User.role` legacy.
5. db push + verificar.

Fase 2 es opcional y puede esperar. La crítica es Fase 1 — elimina el drift y los bugs sin tocar schema.

---

## 5. Verificación de interferencia (meta-regla de Mauro)

Antes de borrar algo, chequeamos quién más lo usa. Todavía no lo ejecuté como grep exhaustivo, pero listo los consumidores conocidos de cada cosa a borrar:

| A borrar | Consumidores conocidos | Acción |
|----------|------------------------|--------|
| `role-access.ts` (getMerchantAccess, getDriverAccess, getSellerAccess) | 3 layouts protegidos | Reemplazar las 3 llamadas por `requireXAccess` y después borrar |
| `auto-heal-roles.ts` (autoHealUserRoles) | `auth.ts` authorize() y jwt() update | Quitar los 2 callsites y después borrar |
| `auth-utils.ts` (hasRole, hasAnyRole, getUserRoles, ROLE_ALIASES) | proxy.ts, 3 layouts, algunos otros | Requiere grep completo (parte del plan de ejecución) |
| Lectura de `token.roles` en jwt() callback | auth.ts mismo | Simplificar construcción de token |
| Lectura de `UserRole.isActive` como gate | `authorize()`, auto-heal | Queda la tabla pero no se lee |
| Escritura de `UserRole` en approve/reject | 4 endpoints admin | Quitar las escrituras (Fase 2 borra la columna) |

Cada uno de estos pasos va a incluir un grep previo al archivo afectado, y si aparece un consumidor nuevo que no está en esta lista, se documenta antes de borrar.

---

## 6. Riesgos del rediseño

1. **Una query extra por layout.** Cada request a un portal protegido hace una query `computeUserAccess` con joins. Mitigación: índices correctos (ya existen en `userId`), select mínimo, `React.cache()` por request si hace falta medir.

2. **Regresiones en edge cases que no documenté.** Mitigación: el script `validate-role-flows.ts` corre 12+ casos contra la DB real. Cualquier regresión sale ahí.

3. **Admin pierde la capacidad de "desactivar sin rechazar".** Hoy (en teoría) puedes poner `Merchant.isActive: false` sin `approvalStatus: REJECTED`. En el nuevo diseño eso no existe. Mitigación: si realmente necesitamos "pausa sin rechazo", se modela como `isSuspended: true`, que ya existe y ya se maneja. O se agrega un estado `"PAUSED"` a `approvalStatus`.

4. **Código externo (crons, webhooks) que lea UserRole.** Mitigación: grep para detectarlos. En Fase 1 dejamos UserRole intacto, solo dejamos de usarlo como gate. Nada externo se rompe.

5. **NextAuth v5 tiene cuirks con lo que acepta en JWT.** Mitigación: mantener `isAdmin` flag (ya está) + `userId`. Eso es todo lo que necesita.

---

## 7. Preguntas de aprobación para Mauro

Antes de tocar código necesito que confirmes o corrijas cuatro cosas:

### Pregunta 1 — ¿Alcance de Fase 1?

Fase 1 propone refactorear todo el código de autorización sin tocar schema. Son aproximadamente 15-20 archivos modificados, 3-4 archivos borrados, 2 archivos nuevos (`roles.ts` y `validate-role-flows.ts`). Tiempo estimado: esta sesión completa.

¿Te cierra el alcance? ¿O preferís partir Fase 1 en dos chunks más chicos?

### Pregunta 2 — ¿SellerProfile en Fase 1 o Fase 2?

Hoy cualquier persona registrada puede ser seller sin admin approval. Eso es un **agujero de producto** (legal y de compliance — vendedor marketplace sin validar). Opciones:

- **(a)** Fase 1: agregar `SellerProfile.approvalStatus` en schema ahora y meterlo en el flujo de approve/reject admin. Implica un `db push` en esta rama.
- **(b)** Fase 2: dejar seller como está en Fase 1, arreglarlo en una rama aparte cuando tocamos schema.
- **(c)** Fase 1 light: en `computeUserAccess`, tratar seller igual que antes (solo `isActive`) pero dejar la estructura lista para que Fase 2 solo haga schema change.

Mi recomendación: **(c)**. Pero dependía de vos qué tanta prisa hay con el agujero de seller.

### Pregunta 3 — ¿Mantenemos `UserRole` table o la eliminamos?

- **Fase 1 sin tocar:** UserRole sigue existiendo y se sigue escribiendo (por compat), pero el código de gating ya no la lee. En el día a día no pasa nada.
- **Fase 2:** eliminamos `UserRole.isActive` o la tabla entera.

Mi recomendación: mantener en Fase 1 para minimizar cambios de schema. Confirmame que te parece bien.

### Pregunta 4 — ¿Script de validación corre contra DB real o mockeada?

Mauro estableció en CLAUDE.md regla: "Cada feature que toque parámetros financieros o configurables DEBE incluir script de verificación que pruebe contra la DB real (no mocks)". Roles no es financiero, pero es sensible igual.

- **(a)** `validate-role-flows.ts` crea usuarios de prueba en la DB real, los aprueba/rechaza, verifica los redirects, y limpia al final.
- **(b)** `validate-role-flows.ts` asume que la DB tiene un snapshot seed con usuarios en cada estado y solo lee.

Mi recomendación: **(a)** porque ejercita escrituras, que es donde vive el bug. Requiere permisos de escritura en la DB local.

---

## 8. Próximos pasos si aprobás

1. Vos respondés las 4 preguntas de arriba (o me decís "aprobado default" y uso mis recomendaciones).
2. Creo `src/lib/roles.ts` **y nada más**, te lo muestro, lo aprobás.
3. Creo `scripts/validate-role-flows.ts` **y nada más**, te lo muestro, lo aprobás, lo corrés.
4. Recién con esos dos archivos validados arranco a refactorear layouts, proxy, endpoints, etc. — un chunk a la vez, con tsc + validate-role-flows.ts después de cada chunk.
5. Al final: commit, finish.ps1, cierre de rama.

No escribo ni una línea de código hasta tener las 4 respuestas (o la aprobación default).



---

# Archivo: `docs/planes/CAMBIOS_COMPARTIDOS_EMAILS.md`

# Cambios en archivos compartidos necesarios para integrar emails P0

> **Este archivo documenta los cambios que se deben hacer en archivos fuera del módulo de emails**
> para conectar las funciones de email con sus triggers en las rutas API.
>
> Los archivos de email creados son:
> - `src/lib/email.ts` — Refactorizado: layout helper, fixes (logo, link /rider)
> - `src/lib/email-p0.ts` — 23 funciones nuevas P0
> - `src/lib/email-registry.ts` — Registro + preview para panel OPS
> - `src/app/api/ops/emails/preview/route.ts` — API de preview
> - `src/app/ops/(protected)/emails/page.tsx` — Panel OPS de gestión de emails

---

## 1. Onboarding Comercio

### #6 — Solicitud de comercio recibida
**Archivo:** `src/app/api/auth/register/merchant/route.ts`
**Dónde:** Después de crear el merchant exitosamente (antes del return)
```typescript
import { sendMerchantRequestReceivedEmail } from "@/lib/email-p0";

// Después de crear merchant...
sendMerchantRequestReceivedEmail({
    email: merchantUser.email,
    businessName: body.businessName,
    contactName: body.contactName || merchantUser.name || "",
}).catch(console.error);
```

### #9 — Tienda aprobada
**Archivo:** `src/app/api/admin/merchants/[id]/route.ts` (o el endpoint que verifica comercios)
**Dónde:** Cuando se cambia `isVerified` a `true`
```typescript
import { sendMerchantApprovedEmail } from "@/lib/email-p0";

// Después de verificar...
sendMerchantApprovedEmail({
    email: merchant.user.email,
    businessName: merchant.businessName,
    contactName: merchant.user.name || "",
}).catch(console.error);
```

### #10 — Tienda rechazada
**Archivo:** `src/app/api/admin/merchants/[id]/route.ts`
**Dónde:** Cuando se rechaza un comercio
```typescript
import { sendMerchantRejectedEmail } from "@/lib/email-p0";

sendMerchantRejectedEmail({
    email: merchant.user.email,
    businessName: merchant.businessName,
    contactName: merchant.user.name || "",
    reason: body.rejectionReason || undefined,
}).catch(console.error);
```

---

## 2. Onboarding Repartidor

### #14 — Solicitud de repartidor recibida (al repartidor)
**Archivo:** `src/app/api/auth/activate-driver/route.ts`
**Dónde:** Después de `sendDriverRequestNotification()` (línea ~39)
```typescript
import { sendDriverRequestReceivedEmail } from "@/lib/email-p0";

// Después de notificar al admin, también notificar al repartidor
sendDriverRequestReceivedEmail({
    email: user.email,
    driverName: user.name || "",
    vehicleType: body.vehicleType,
}).catch(console.error);
```

### #18 — Repartidor rechazado
**Archivo:** Crear `src/app/api/admin/drivers/[id]/reject/route.ts` o agregar lógica en el endpoint existente
```typescript
import { sendDriverRejectedEmail } from "@/lib/email-p0";

sendDriverRejectedEmail({
    email: driver.user.email,
    driverName: driver.user.name || "",
    reason: body.rejectionReason || undefined,
}).catch(console.error);
```

---

## 3. Ciclo de Vida del Pedido (Comprador)

### #34 — Pago pendiente
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts`
**Dónde:** Cuando `payment.status === "in_process"` o `"pending"`
```typescript
import { sendPaymentPendingEmail } from "@/lib/email-p0";

sendPaymentPendingEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    paymentMethod: "MercadoPago",
}).catch(console.error);
```

### #35 — Pago rechazado
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts`
**Dónde:** Cuando `payment.status === "rejected"`
```typescript
import { sendPaymentRejectedEmail } from "@/lib/email-p0";

sendPaymentRejectedEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    reason: payment.status_detail || undefined,
}).catch(console.error);
```

### #37 — Pedido rechazado por comercio
**Archivo:** Endpoint donde el comercio rechaza (e.g., `/api/orders/[id]/reject` o `/api/merchant/orders/[id]/reject`)
```typescript
import { sendOrderRejectedByMerchantEmail } from "@/lib/email-p0";

sendOrderRejectedByMerchantEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    merchantName: order.merchant.businessName,
    reason: body.reason || undefined,
    willRefund: order.paymentMethod !== "cash",
    total: order.total,
}).catch(console.error);
```

### #41 — Pedido entregado
**Archivo:** `src/app/api/driver/status/route.ts` (o donde se marca DELIVERED)
**Dónde:** Cuando `status === "DELIVERED"`
```typescript
import { sendOrderDeliveredEmail } from "@/lib/email-p0";

sendOrderDeliveredEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    deliveryTime: `${Math.round((Date.now() - order.createdAt.getTime()) / 60000)} minutos`,
}).catch(console.error);
```

### #42 — Pedido cancelado por comprador
**Archivo:** Endpoint de cancelación por comprador (e.g., `/api/orders/[id]/cancel`)
```typescript
import { sendOrderCancelledByBuyerEmail } from "@/lib/email-p0";

sendOrderCancelledByBuyerEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    willRefund: order.paymentMethod !== "cash",
    paymentMethod: order.paymentMethod,
}).catch(console.error);
```

### #43 — Pedido cancelado por comercio
**Archivo:** Endpoint donde comercio cancela un pedido
```typescript
import { sendOrderCancelledByMerchantEmail } from "@/lib/email-p0";

sendOrderCancelledByMerchantEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    merchantName: order.merchant.businessName,
    total: order.total,
    reason: body.reason || undefined,
    willRefund: order.paymentMethod !== "cash",
}).catch(console.error);
```

### #44 — Pedido cancelado por sistema
**Archivo:** `src/app/api/cron/merchant-timeout/route.ts` y/o `src/lib/assignment-engine.ts`
**Dónde:** Cuando el cron cancela por timeout
```typescript
import { sendOrderCancelledBySystemEmail } from "@/lib/email-p0";

sendOrderCancelledBySystemEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    reason: "El comercio no respondió dentro del tiempo límite.",
    willRefund: order.paymentMethod !== "cash",
}).catch(console.error);
```

### #45 — Reembolso procesado
**Archivo:** `src/app/api/ops/refund/route.ts`
**Dónde:** Después de marcar `paymentStatus: "REFUNDED"` exitosamente
```typescript
import { sendRefundProcessedEmail } from "@/lib/email-p0";

sendRefundProcessedEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    refundAmount: body.amount || order.total,
    reason: body.reason || undefined,
    paymentMethod: order.paymentMethod,
}).catch(console.error);
```

---

## 4. Ciclo de Vida del Pedido (Comercio)

### #51 — Nuevo pedido recibido
**Archivo:** `src/app/api/orders/route.ts`
**Dónde:** Después de crear la orden exitosamente (junto con el socket emit)
```typescript
import { sendMerchantNewOrderEmail } from "@/lib/email-p0";

sendMerchantNewOrderEmail({
    email: merchant.user.email || merchant.email,
    merchantName: merchant.businessName,
    orderNumber: order.orderNumber,
    customerName: session.user.name || "",
    total: order.total,
    itemCount: orderItems.length,
    isPickup: body.isPickup || false,
}).catch(console.error);
```

### #52 — Recordatorio pedido sin aceptar
**Archivo:** `src/app/api/cron/merchant-timeout/route.ts`
**Dónde:** Antes de cancelar, cuando el pedido lleva X minutos sin respuesta (agregar un check intermedio)
```typescript
import { sendMerchantOrderReminderEmail } from "@/lib/email-p0";

// Si lleva más de la mitad del timeout, enviar recordatorio (una sola vez)
if (minutesSinceOrder > timeoutMinutes / 2 && !order.reminderSent) {
    sendMerchantOrderReminderEmail({
        email: merchant.user.email,
        merchantName: merchant.businessName,
        orderNumber: order.orderNumber,
        minutesSinceOrder,
        timeoutMinutes,
    }).catch(console.error);
    // NOTA: necesita campo `reminderSent` en Order para evitar duplicados (ver schema changes abajo)
}
```

### #76 — Pago recibido (comercio)
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts` y/o `src/app/api/orders/route.ts` (para cash)
**Dónde:** Cuando se confirma el pago
```typescript
import { sendMerchantPaymentReceivedEmail } from "@/lib/email-p0";

sendMerchantPaymentReceivedEmail({
    email: merchant.user.email,
    merchantName: merchant.businessName,
    orderNumber: order.orderNumber,
    amount: subOrder.total,
    commission: subOrder.commission,
    netAmount: subOrder.total - subOrder.commission,
    paymentMethod: order.paymentMethod,
}).catch(console.error);
```

---

## 5. Moderación

### #102 — Tienda suspendida
**Archivo:** `src/app/api/admin/merchants/[id]/route.ts`
**Dónde:** Cuando se cambia `isActive` a `false` (suspensión)
```typescript
import { sendMerchantSuspendedEmail } from "@/lib/email-p0";

sendMerchantSuspendedEmail({
    email: merchant.user.email,
    businessName: merchant.businessName,
    contactName: merchant.user.name || "",
    reason: body.suspensionReason || undefined,
}).catch(console.error);
```

### #109 — Cuenta repartidor suspendida
**Archivo:** Endpoint donde se suspende un repartidor desde OPS
```typescript
import { sendDriverSuspendedEmail } from "@/lib/email-p0";

sendDriverSuspendedEmail({
    email: driver.user.email,
    driverName: driver.user.name || "",
    reason: body.suspensionReason || undefined,
}).catch(console.error);
```

---

## 6. Eliminación de Cuenta

### #114 + #174 — Solicitud de eliminación (al usuario + al owner)
**Archivo:** `src/app/api/profile/delete/route.ts`
**Dónde:** Después de marcar la eliminación
```typescript
import { sendAccountDeletionRequestEmail, sendOwnerDataDeletionRequestEmail } from "@/lib/email-p0";

// Al usuario
sendAccountDeletionRequestEmail({
    email: user.email,
    userName: user.name || "",
    deletionDate: deletionDate.toLocaleDateString('es-AR'),
}).catch(console.error);

// Al owner (compliance)
sendOwnerDataDeletionRequestEmail({
    userName: user.name || "",
    userEmail: user.email,
    userId: user.id,
    requestDate: new Date().toLocaleDateString('es-AR'),
    roles: userRoles.map(r => r.role),
}).catch(console.error);
```

### #115 — Cuenta eliminada
**Archivo:** Proceso de eliminación final (cron o inmediato)
```typescript
import { sendAccountDeletedEmail } from "@/lib/email-p0";

sendAccountDeletedEmail({
    email: user.email,
    userName: user.name || "",
}).catch(console.error);
```

---

## 7. Alertas Owner

### #135/#136/#137/#145 — Alertas críticas
**Archivos posibles:**
- `src/app/api/health/route.ts` — para #145 servidor caído
- `src/app/api/webhooks/mercadopago/route.ts` — para #135/#136 pasarela/webhooks
- Donde se detecte falla de split — para #137

```typescript
import { sendOwnerCriticalAlertEmail } from "@/lib/email-p0";

// Ejemplo: pasarela caída
sendOwnerCriticalAlertEmail({
    alertType: 'payment_gateway_down',
    title: 'Pasarela de pagos no responde',
    description: 'La API de MercadoPago no está respondiendo. Los pagos con tarjeta están fallando.',
    details: `Error: ${error.message}\nEndpoint: ${url}\nFallas consecutivas: ${failCount}`,
    severity: 'critical',
}).catch(console.error);
```

### #161 — Pedidos sin repartidor
**Archivo:** `src/app/api/cron/assignment-tick/route.ts` o nuevo cron dedicado
```typescript
import { sendOwnerUnassignedOrdersEmail } from "@/lib/email-p0";

if (unassignedOrders.length > 0) {
    sendOwnerUnassignedOrdersEmail({
        unassignedCount: unassignedOrders.length,
        oldestOrderMinutes: Math.round((Date.now() - oldestOrder.createdAt.getTime()) / 60000),
        orderNumbers: unassignedOrders.map(o => o.orderNumber),
    }).catch(console.error);
}
```

### #167 — Reporte diario
**Archivo:** Crear `src/app/api/cron/daily-report/route.ts` (nuevo cron)
```typescript
import { sendOwnerDailyReportEmail } from "@/lib/email-p0";

sendOwnerDailyReportEmail({
    date: new Date().toLocaleDateString('es-AR'),
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    totalCommission,
    newUsers,
    newMerchants,
    newDrivers,
    avgDeliveryTime,
    topMerchant: topMerchant ? { name: topMerchant.businessName, orders: topMerchant._count.orders } : undefined,
}).catch(console.error);
```

---

## 8. Cambios en el Sidebar de OPS

### Agregar link "Emails" en OpsSidebar
**Archivo:** `src/components/ops/OpsSidebar.tsx`
**Dónde:** En la sección "Sistema" (junto a Backups, Configuración, etc.)
```tsx
<Link href="/ops/emails">
    <span>📧</span> Emails
</Link>
```

---

## 9. Variables de entorno nuevas

Agregar a `.env` y `.env.example`:
```env
# Email del owner para alertas críticas (default: ADMIN_EMAIL)
OWNER_EMAIL=maurod@me.com
```

---

## 10. Cambios opcionales en el schema (Prisma)

Para el #52 (recordatorio sin duplicar), se necesitaría:
```prisma
model Order {
    // ...campos existentes...
    emailReminderSentAt DateTime? // Para evitar enviar recordatorio duplicado
}
```

**Ejecutar** `npx prisma db push` después de agregar este campo.

---

## Resumen de archivos que requieren cambios

| Archivo compartido | Emails a conectar | Cambio necesario |
|---|---|---|
| `src/app/api/auth/register/merchant/route.ts` | #6 | Agregar import + llamada |
| `src/app/api/auth/activate-driver/route.ts` | #14 | Agregar import + llamada |
| `src/app/api/admin/merchants/[id]/route.ts` | #9, #10, #102 | Agregar imports + llamadas condicionales |
| `src/app/api/admin/drivers/[id]/approve/route.ts` | (ya existe) | — |
| `src/app/api/webhooks/mercadopago/route.ts` | #34, #35, #76 | Agregar imports + llamadas por status |
| `src/app/api/orders/route.ts` | #51 | Agregar import + llamada |
| `src/app/api/cron/merchant-timeout/route.ts` | #44, #52 | Agregar imports + llamadas |
| `src/app/api/ops/refund/route.ts` | #45 | Agregar import + llamada |
| `src/app/api/driver/status/route.ts` (o equiv.) | #41 | Agregar import + llamada |
| `src/app/api/profile/delete/route.ts` | #114, #174 | Agregar imports + llamadas |
| `src/app/api/health/route.ts` | #135, #145 | Agregar imports + llamadas |
| `src/app/api/cron/assignment-tick/route.ts` | #161 | Agregar import + llamada |
| `src/components/ops/OpsSidebar.tsx` | — | Link "Emails" |
| `.env` / `.env.example` | — | `OWNER_EMAIL` |
| `prisma/schema.prisma` | #52 | Campo `emailReminderSentAt` (opcional) |

---

*Generado el 20 de marzo de 2026*



---

# Archivo: `docs/planes/CAMBIOS_COMPARTIDOS_LOGISTICS.md`

# Cambios en archivos compartidos necesarios para P0 Logístico

> Este documento lista los cambios que NO se aplicaron por restricción de scope,
> pero que son necesarios para que los módulos P0 funcionen al 100%.
>
> Prioridad: aplicar estos cambios **antes del lanzamiento**.

---

## 1. Schema Prisma — Modelo ShipmentType (NUEVO)

**Archivo**: `prisma/schema.prisma`

Agregar el siguiente modelo:

```prisma
model ShipmentType {
  id                    String   @id @default(cuid())
  code                  String   @unique  // HOT, FRESH, FRAGILE, STANDARD, DOCUMENT
  name                  String             // "Comida caliente", "Perecedero", etc.
  maxDeliveryMinutes    Int                // SLA máximo: HOT=45, FRESH=90, STANDARD=480
  requiresThermalBag    Boolean  @default(false)
  requiresColdChain     Boolean  @default(false)
  requiresCarefulHandle Boolean  @default(false)
  priorityWeight        Int      @default(0)  // Para scoring: HOT=100, FRESH=50
  surchargeArs          Float    @default(0)  // Recargo sobre tarifa base
  allowedVehicles       String[] @default(["BIKE", "MOTO", "CAR", "TRUCK"])
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  orders                Order[]
}
```

**Seed data**: ver `src/lib/shipment-types.ts` → `SHIPMENT_TYPES` para los valores.

---

## 2. Schema Prisma — Campo shipmentTypeCode en Order

**Archivo**: `prisma/schema.prisma` → modelo `Order`

Agregar los siguientes campos:

```prisma
// En el modelo Order, agregar:
shipmentTypeCode  String       @default("STANDARD")
shipmentType      ShipmentType? @relation(fields: [shipmentTypeCode], references: [code])
```

**Nota**: El campo es opcional con default "STANDARD" para que los pedidos existentes no se rompan.

Después de agregar, ejecutar:
```bash
npx prisma db push
```

---

## 3. API de creación de pedidos — Validación server-side del deliveryFee

**Archivo**: `src/app/api/orders/route.ts`

### Cambio requerido:

En el POST handler, después de calcular el subtotal y antes de crear la orden, agregar:

```typescript
import { calculateShippingCost, validateDeliveryFee } from "@/lib/shipping-cost-calculator";
import { autoDetectShipmentType } from "@/lib/shipment-types";
import { calculateOrderCategory } from "@/lib/assignment-engine";

// Después de la línea: let finalTotal = subtotal + (deliveryFee || 0);

// --- P0: Recalcular deliveryFee server-side ---
if (!isPickup && distanceKm) {
  // Determinar categoría de paquete
  const itemCats = items.map((i: any) => ({
    packageCategory: i.packageCategory || null,
    quantity: i.quantity,
    name: i.name || "",
  }));
  const orderCat = await calculateOrderCategory(itemCats, {
    merchantCategoryName: merchant?.category?.name,
  });

  // Calcular costo server-side
  const serverCost = calculateShippingCost({
    distanceKm,
    packageCategory: orderCat.category,
    shipmentTypeCode: orderCat.shipmentTypeCode,
    orderTotal: subtotal,
    freeDeliveryMinimum: merchant?.freeDeliveryMinimum ?? null,
  });

  // Validar y corregir el fee del frontend
  const validation = validateDeliveryFee(deliveryFee || 0, serverCost);
  if (validation.wasModified) {
    console.log(`[Orders] deliveryFee corregido: $${deliveryFee} → $${validation.correctedFee} (${validation.reason})`);
  }
  deliveryFee = validation.correctedFee;
  finalTotal = subtotal + deliveryFee;

  // Guardar el shipmentTypeCode en la orden (cuando el campo exista en schema)
  // shipmentTypeCode = orderCat.shipmentTypeCode;
}
// --- Fin P0 ---
```

### Líneas específicas a modificar:

1. **Línea ~66**: `deliveryFee` — cambiar de `const` a `let` si es const
2. **Línea ~88**: `let finalTotal = subtotal + (deliveryFee || 0);` — mover después del recálculo
3. **Línea ~173**: `deliveryFee: isPickup ? 0 : (deliveryFee || 0)` — ya usa el valor corregido

---

## 4. Schema Prisma — Campos de equipamiento en Driver (P1)

**Archivo**: `prisma/schema.prisma` → modelo `Driver`

Agregar para habilitar el filtro por equipamiento (P1, no bloqueante P0):

```prisma
// En el modelo Driver, agregar:
hasThermalBag        Boolean  @default(false)
hasColdStorage       Boolean  @default(false)
hasExternalRack      Boolean  @default(false)
maxCargoWeightKg     Float?
maxCargoVolumeLiters Float?
```

---

## 5. Fix naming vehicleType en registro de driver (RECOMENDADO)

**Archivo**: `src/app/api/auth/register/driver/route.ts`

### Cambio recomendado:

Al guardar el `vehicleType`, normalizar al enum canónico:

```typescript
import { normalizeVehicleTypeOrDefault } from "@/lib/vehicle-type-mapping";

// Donde se guarda vehicleType, reemplazar:
// vehicleType: body.vehicleType,
// Por:
vehicleType: normalizeVehicleTypeOrDefault(body.vehicleType),
```

**Nota**: El assignment engine ya maneja ambos formatos (P0 fix), pero normalizar en el registro es más limpio a largo plazo.

---

## 6. API de cálculo de delivery — Nuevo endpoint (OPCIONAL)

Crear un nuevo endpoint para que el frontend pueda obtener el costo correcto:

**Archivo**: `src/app/api/delivery/calculate/route.ts` (NUEVO)

```typescript
import { calculateShippingCost } from "@/lib/shipping-cost-calculator";
import { calculatePreCheckoutETA } from "@/lib/eta-calculator";
import { autoDetectShipmentType } from "@/lib/shipment-types";

export async function POST(req: Request) {
  const { distanceKm, packageCategory, merchantId, orderTotal, items } = await req.json();

  // Auto-detect shipment type
  const shipmentTypeCode = autoDetectShipmentType({
    merchantCategoryName: merchant?.category?.name,
    productNames: items?.map((i: any) => i.name) || [],
  });

  // Calculate cost
  const cost = calculateShippingCost({
    distanceKm,
    packageCategory: packageCategory || "MEDIUM",
    shipmentTypeCode,
    orderTotal: orderTotal || 0,
    freeDeliveryMinimum: merchant?.freeDeliveryMinimum ?? null,
  });

  // Calculate ETA
  const eta = calculatePreCheckoutETA({
    distanceMerchantToCustomerKm: distanceKm,
    merchantPrepTimeMin: merchant?.deliveryTimeMin || 30,
    shipmentTypeCode,
  });

  return Response.json({
    cost,
    eta: {
      displayLabel: eta.displayLabel,
      totalMinutes: eta.totalMinutes,
      exceedsSLA: eta.exceedsSLA,
      slaWarning: eta.slaWarning,
    },
    shipmentType: {
      code: shipmentTypeCode,
      name: getShipmentType(shipmentTypeCode).name,
      icon: getShipmentType(shipmentTypeCode).icon,
    },
  });
}
```

---

## 7. Panel OPS — Configuración de ShipmentTypes ✅ IMPLEMENTADO

**Estado**: Completamente implementado vía MoovyConfig (JSON en tabla key-value).

El panel OPS ahora incluye 8 tabs con configuración completa:
- **Global**: Timeouts, comisiones, distancia máx, intentos asignación
- **Paquetes**: Categorías de paquete con dimensiones y vehículos
- **Tipos de Envío**: SLA, prioridad, recargos, vehículos, flags de equipamiento
- **Vehículos**: Velocidades promedio por tipo
- **Prioridad**: Parámetros de la cola de asignación
- **ETA**: Parámetros del calculador de tiempo estimado
- **SLA en Vivo**: Dashboard en tiempo real con pedidos activos
- **Tarifas**: DeliveryRate + tarifas fallback

Todos los campos tienen botón (i) con explicación detallada.

**Nota**: Cuando se agregue el modelo `ShipmentType` en Prisma (punto 1),
se podrá migrar de MoovyConfig a tablas dedicadas sin cambios en la UI.

---

## Resumen de archivos a modificar

| Archivo | Tipo de cambio | Prioridad |
|---------|---------------|-----------|
| `prisma/schema.prisma` | Modelo ShipmentType + campo en Order | P0 |
| `src/app/api/orders/route.ts` | Validación server-side deliveryFee | P0 |
| `src/app/api/auth/register/driver/route.ts` | Normalizar vehicleType | P1 |
| `prisma/schema.prisma` (Driver) | Campos equipamiento | P1 |
| `src/app/api/delivery/calculate/route.ts` | Nuevo endpoint | P1 |
| `src/app/ops/.../configuracion-logistica` | UI de ShipmentTypes | ✅ HECHO |

---

## Dependencias de los nuevos módulos

```
shipment-types.ts       ← sin dependencias externas (constantes puras)
vehicle-type-mapping.ts ← sin dependencias externas (constantes puras)
shipping-cost-calculator.ts ← depende de shipment-types.ts
order-priority.ts       ← depende de shipment-types.ts
eta-calculator.ts       ← depende de vehicle-type-mapping.ts, shipment-types.ts
assignment-engine.ts    ← importa todo lo anterior (ya modificado)
geo.ts                  ← importa vehicle-type-mapping.ts (ya modificado)
```

Ningún módulo nuevo depende de Prisma directamente (excepto `logistics-config.ts` que lee/escribe MoovyConfig).

**Módulos nuevos agregados en esta fase:**
- `src/lib/logistics-config.ts` — Loaders/writers centralizados + info texts
- `src/app/api/ops/config/shipment-types/route.ts` — CRUD ShipmentTypes config
- `src/app/api/ops/config/vehicle-speeds/route.ts` — CRUD velocidades
- `src/app/api/ops/config/priority-queue/route.ts` — CRUD prioridad cola
- `src/app/api/ops/config/eta-calculator/route.ts` — CRUD ETA config
- `src/app/api/ops/config/shipping-defaults/route.ts` — CRUD tarifas fallback
- `src/app/api/ops/logistics/sla-dashboard/route.ts` — Dashboard SLA en vivo

**Módulos modificados:**
- `src/lib/order-priority.ts` — Acepta `PriorityConfigOverrides` opcional
- `src/lib/eta-calculator.ts` — Acepta `ETAConfigOverrides` opcional
- `src/app/ops/(protected)/configuracion-logistica/page.tsx` — Reescrito completo (8 tabs)



---

# Archivo: `docs/planes/PLAN-RIDER-REDESIGN.md`

# PLAN: Rediseño Integral del Portal Repartidor MOOVY

**Fecha:** 15 de Marzo 2026
**Estado:** PLAN — sin modificaciones a archivos
**Prioridad:** Alta

---

## 1. BUGS CRÍTICOS ENCONTRADOS

### 1.1 — 404 en `/repartidor` (desde Mi Perfil)

**Problema:** El link "Panel de Repartidor" en `mi-perfil/page.tsx` (línea 269) apunta a `href="/repartidor"`, pero NO existe `page.tsx` en esa ruta raíz. La estructura real es:

```
src/app/repartidor/
├── login/page.tsx          ← público
├── registro/page.tsx       ← público
└── (protected)/
    ├── dashboard/page.tsx  ← el dashboard real
    ├── ganancias/
    ├── historial/
    ├── pedidos/
    ├── perfil/
    └── soporte/
```

**Solución:** Crear `src/app/repartidor/page.tsx` como redirect:
- Si el usuario tiene rol DRIVER activo → redirect a `/repartidor/(protected)/dashboard`
- Si no tiene rol DRIVER → redirect a `/repartidor/login`
- Alternativa más simple: cambiar el `href` en mi-perfil a `/repartidor/dashboard` (directo al dashboard dentro del route group `(protected)`)

**Recomendación experta:** Crear el archivo de redirect. Es más robusto, funciona como entry point canónico y los otros portales (comercios, vendedor, ops) probablemente también necesitan esto.

### 1.2 — Navegación "atrás" va a `/` en vez de la tienda

**Problema:** En `ProfileView.tsx` (línea 317), el link "Ir a la tienda" apunta a `href="/"` que es la landing/home page, no la tienda propiamente. El usuario espera volver a donde estaba comprando.

**Solución:** Cambiar `href="/"` a `href="/tienda"` que es la ruta canónica de la tienda dentro del route group `(store)`.

### 1.3 — Inconsistencia `/` vs `/tienda`

**Problema:** En toda la app se usa `/` y `/tienda` indistintamente para referirse a la tienda. El `BottomNav` de la tienda usa `/tienda`, pero muchos links usan `/`.

**Solución:** Auditar y unificar. `/` debería ser la landing pública, `/tienda` la experiencia de compra con sesión.

---

## 2. AUDITORÍA COMPLETA DE RUTAS Y LINKS

### 2.1 — Links inter-portal desde Mi Perfil

| Destino | Link actual | Estado | Fix necesario |
|---------|-------------|--------|---------------|
| Panel Vendedor | `/vendedor` | ⚠️ Verificar | Crear redirect si no existe root page |
| Panel Repartidor | `/repartidor` | ❌ 404 | Crear redirect → `/repartidor/dashboard` |
| Panel Comercio | `/comercios` | ✅ OK | — |
| Panel Operaciones | `/ops` | ✅ OK | — |

### 2.2 — Links dentro del portal repartidor

| Componente | Link | Destino | Estado |
|-----------|------|---------|--------|
| ProfileView | `href="/"` | "Ir a tienda" | ❌ Va a landing, no a tienda |
| ProfileView | signOut callbackUrl | `/repartidor/login` | ✅ OK |
| Error boundary | backHref | `/repartidor/dashboard` | ✅ OK |
| RiderBottomNav | tabs | SPA tabs (no links) | ✅ OK |

### 2.3 — Entry points por portal

| Portal | Root page | ¿Existe? | Acción |
|--------|-----------|----------|--------|
| Store (`/`) | `(store)/page.tsx` | ✅ | — |
| Repartidor (`/repartidor`) | — | ❌ | Crear redirect |
| Comercios (`/comercios`) | Verificar | ⚠️ | Verificar |
| Vendedor (`/vendedor`) | Verificar | ⚠️ | Verificar |
| OPS (`/ops`) | Verificar | ⚠️ | Verificar |

---

## 3. REDISEÑO DEL DASHBOARD — Análisis del diseño actual

### 3.1 — Problemas del layout actual

El dashboard actual tiene un diseño **map-first** donde el mapa ocupa la parte superior (220px card) y es lo primero que se ve. Esto tiene varios problemas:

1. **El mapa sin contexto no aporta valor:** Cuando el repartidor está offline o esperando pedidos, un mapa vacío ocupa espacio premium sin dar información útil.
2. **Prioridad visual incorrecta:** Lo más importante para un repartidor al abrir la app es: ¿Estoy conectado? ¿Tengo pedidos? ¿Cuánto gané hoy? El mapa es secundario.
3. **Duplicación de UI:** El estado online/offline y las stats aparecen tanto en el card mode como en el fullscreen BottomSheet, creando redundancia.
4. **El "Toca para abrir mapa" es un paso extra innecesario** para acceder a la navegación durante un pedido activo.

### 3.2 — Cómo lo hacen las mejores apps del mundo

**DoorDash (Dasher):**
- Dashboard centrado en GANANCIAS y ESTADO como primer elemento visual
- Mapa aparece SOLO cuando hay un pedido activo
- Layout limpio: estado → stats del día → lista de ofertas disponibles
- Barra inferior simple: Inicio / Programar / Ganancias / Perfil

**Uber Eats Driver:**
- Pantalla principal: botón gigante "Conectarse" como hero
- Al conectarse: mapa fullscreen con overlay de stats en la parte inferior
- Sin mapa cuando está offline — solo un card con earnings y un CTA

**Rappi (Soyrappi):**
- Estado de conexión como header fijo con gradiente
- Stats en grid compacto (pedidos, ganancias, calificación)
- Mapa solo se activa con pedido
- Notificaciones de nuevos pedidos como modal overlay

### 3.3 — Propuesta de rediseño: "Status-First Dashboard"

**Concepto:** El dashboard prioriza el ESTADO y la ACCIÓN del repartidor. El mapa es una herramienta de navegación, no un elemento decorativo.

#### Layout propuesto — SIN pedido activo (offline):

```
┌─────────────────────────────┐
│  ○ MOOVY          🔔  ⚙️   │ ← Header con logo, notif, settings
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │  👤 Hola, Mauro     │    │
│  │  ⭐ 4.9  •  Nivel 3 │    │ ← Saludo + rating + nivel
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │    ⏻ CONECTARSE     │    │ ← Botón hero grande
│  │  Toca para empezar  │    │
│  └─────────────────────┘    │
│                             │
│  ┌──────┐  ┌──────────┐    │
│  │ $2.5K│  │  12      │    │ ← Stats: Ganancias + Completados
│  │ Hoy  │  │ Entregas │    │
│  └──────┘  └──────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 📊 Resumen semanal  │    │ ← Mini gráfico de ganancias
│  │ ▃▅▇▅▃▇█            │    │    (motivacional)
│  └─────────────────────┘    │
│                             │
├─────────────────────────────┤
│ 🏠  💰  📋  💬  👤        │ ← Bottom nav
└─────────────────────────────┘
```

#### Layout propuesto — Conectado, esperando ofertas:

```
┌─────────────────────────────┐
│  ● CONECTADO    🔔  ⚙️     │ ← Punto verde animado
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │  📡 Buscando...     │    │
│  │  Estás en la zona   │    │ ← Animación sutil
│  │  [mapa mini radius] │    │    mapa PEQUEÑO mostrando
│  │  ● Tu ubicación     │    │    solo radio de alcance
│  └─────────────────────┘    │
│                             │
│  ┌──────┐  ┌──────────┐    │
│  │ $2.5K│  │  12      │    │
│  │ Hoy  │  │ Entregas │    │
│  └──────┘  └──────────┘    │
│                             │
│  ⏻ DESCONECTARSE            │ ← Botón secundario
│                             │
├─────────────────────────────┤
│ 🏠  💰  📋  💬  👤        │
└─────────────────────────────┘
```

#### Layout propuesto — CON pedido activo:

```
┌─────────────────────────────┐
│  [═══ MAPA FULLSCREEN ═══] │
│  [                        ] │
│  [   🚗 → 📍 comercio    ] │ ← Mapa ocupa todo
│  [                        ] │
│  [  📍 cliente            ] │
│  [                        ] │
│  [  [← Inicio]  [MAPS→]  ] │ ← Floating buttons
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ #ORD-1234             │   │ ← BottomSheet con info
│ │ Comercio → Cliente    │   │
│ │ ☎️ Llamar             │   │
│ │                       │   │
│ │ ═══ Deslizá → Llegué  │   │ ← SwipeToConfirm
│ └───────────────────────┘   │
└─────────────────────────────┘
```

**Cambios clave del rediseño:**

1. **Eliminar mapa-card en modo idle** — Reemplazar por un mini-mapa circular (solo radio) cuando está conectado, o eliminarlo completamente cuando está offline.
2. **Botón de conexión como hero element** — Grande, central, imposible de perder.
3. **Stats siempre visibles** — Ganancias y completados en grid compacto, visibles en todos los estados.
4. **Mapa fullscreen SOLO con pedido activo** — Transición automática cuando se acepta un pedido.
5. **Header con acceso a configuración** — Icono ⚙️ para settings (ver sección 5).
6. **Saludo personalizado** — Humaniza la experiencia, muestra rating y nivel.

---

## 4. ANÁLISIS DE COLORES

### 4.1 — Paleta actual

| Elemento | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primario MOOVY | Rojo | `#e60012` | Branding, CTAs, nav activa |
| Online | Verde esmeralda | `emerald-500` | Estado conectado |
| Offline | Rojo/Gris | `#e60012` / gris | Estado desconectado |
| Oferta nueva | Naranja | `orange-500` | Popup de pedidos |
| Navegación | Azul Google | `#4285F4` | Botón MAPS |
| Dark mode BG | Gris oscuro | `#0f1117` | Fondo principal |
| Dark mode Surface | Gris medio | `#1a1d27` | Cards |
| Dark mode Alt | Gris claro | `#22252f` | Elementos secundarios |

### 4.2 — Problemas detectados

1. **Rojo sobrecargado:** El rojo `#e60012` se usa para TODO: marca, botones, íconos, estado offline, nav activa. Pierde jerarquía.
2. **Contraste naranja/rojo:** Las ofertas (naranja) y la marca (rojo) son tonos cercanos; se confunden visualmente.
3. **Dark mode bien implementado** pero los colores de acento no cambian — el rojo `#e60012` sobre fondo `#0f1117` tiene buen contraste, pero podría suavizarse.
4. **Sin identidad visual diferenciada** por estado: todo usa el mismo rojo.

### 4.3 — Propuesta de paleta mejorada

**Sistema de colores semánticos:**

| Contexto | Light | Dark | Uso |
|----------|-------|------|-----|
| Marca (accent) | `#e60012` | `#ff2d3a` | Logo, branding sutil |
| CTA Principal | `#e60012` | `#e60012` | Botones primarios |
| Estado online | `#10b981` (emerald-500) | `#34d399` | Botón conectado, indicadores |
| Estado offline | `#6b7280` (gray-500) | `#9ca3af` | Botón desconectado (NO rojo) |
| Oferta/Alerta | `#f59e0b` (amber-500) | `#fbbf24` | Nuevos pedidos |
| Info/Nav | `#3b82f6` (blue-500) | `#60a5fa` | Navegación, links |
| Éxito | `#22c55e` (green-500) | `#4ade80` | Entrega completada |
| Background | `#f9fafb` | `#0f1117` | Fondo principal |
| Surface | `#ffffff` | `#1a1d27` | Cards |
| Text primary | `#111827` | `#f9fafb` | Texto principal |
| Text secondary | `#6b7280` | `#9ca3af` | Texto secundario |

**Cambio principal:** Estado offline pasa de ROJO a GRIS neutro. El rojo se reserva para la marca y CTAs, no para estados pasivos.

---

## 5. NUEVA FUNCIONALIDAD: CONFIGURACIÓN DEL REPARTIDOR

### 5.1 — Pantalla de Settings (⚙️)

Accesible desde el header del dashboard o desde la tab "Perfil".

**Secciones propuestas:**

1. **Apariencia**
   - Toggle dark mode: Automático (OS) / Siempre claro / Siempre oscuro
   - Esto agrega un override sobre `prefers-color-scheme`

2. **Notificaciones**
   - Push para nuevos pedidos: ON/OFF
   - Sonido de alerta: ON/OFF
   - Vibración: ON/OFF

3. **Navegación**
   - App de mapas preferida: Google Maps / Waze / Apple Maps
   - Evitar autopistas: ON/OFF

4. **Turno**
   - Auto-desconectar después de X horas inactivo
   - Recordatorio de batería: umbral configurable (20%, 15%, 10%)

5. **Cuenta**
   - Ver datos personales
   - Documentación (DNI, licencia, seguro)
   - Cerrar sesión

### 5.2 — Implementación técnica

- Nuevo componente: `src/components/rider/views/SettingsView.tsx`
- Almacenamiento: `localStorage` para preferencias de UI (dark mode, app de mapas)
- API para preferencias server-side: `/api/driver/preferences` (POST/GET)
- Nueva tab en `RiderBottomNav` o accesible desde icono en header

---

## 6. PLAN DE EJECUCIÓN POR FASES

### Fase 1: Fixes críticos (1 rama — `fix/rider-routing`)
**Archivos a modificar:** 3-4

1. Crear `src/app/repartidor/page.tsx` — redirect inteligente a dashboard o login
2. Cambiar `href="/"` → `href="/tienda"` en `ProfileView.tsx`
3. Cambiar `href="/repartidor"` → `href="/repartidor/dashboard"` en `mi-perfil/page.tsx` (o confiar en el redirect del punto 1)
4. Verificar que `/vendedor`, `/comercios`, `/ops` tengan root redirects similares

### Fase 2: Rediseño dashboard layout (1 rama — `feat/rider-dashboard-v2`)
**Archivos a modificar:** 2-3

1. Refactorizar `dashboard/page.tsx` — nuevo layout "Status-First"
   - Estado offline: hero connect button + stats + saludo
   - Estado online sin pedido: mini-mapa circular + "buscando" + stats
   - Estado con pedido activo: mapa fullscreen automático + BottomSheet (ya existe)
2. Actualizar `RiderMiniMap` para soportar modo "radius" (solo punto del driver + radio)
3. Agregar header con saludo personalizado

### Fase 3: Paleta de colores y dark mode override (1 rama — `feat/rider-colors`)
**Archivos a modificar:** 3-5

1. Refactorizar variables CSS `--rider-*` con la nueva paleta semántica
2. Estado offline → gris en vez de rojo
3. Crear `useThemePreference` hook (auto/light/dark)
4. Aplicar nueva paleta en dashboard y componentes rider

### Fase 4: Pantalla de configuración (1 rama — `feat/rider-settings`)
**Archivos a modificar:** 4-5

1. Crear `SettingsView.tsx`
2. API `/api/driver/preferences`
3. Hook `useThemePreference` (si no se hizo en Fase 3)
4. Integrar en dashboard (icono header o nueva tab)
5. Almacenamiento local + API

### Fase 5: Polish final (1 rama — `feat/rider-polish-v2`)
**Archivos a modificar:** 3-4

1. Mini gráfico de ganancias semanales en dashboard idle
2. Animaciones de transición entre estados (offline → online → con pedido)
3. Resumen semanal motivacional
4. Testing integral de todos los flujos

---

## 7. ESTIMACIÓN DE ESFUERZO

| Fase | Complejidad | Archivos | Riesgo |
|------|-------------|----------|--------|
| 1. Fixes críticos | Baja | 3-4 | Bajo |
| 2. Rediseño layout | Alta | 2-3 | Medio (archivo grande) |
| 3. Colores | Media | 3-5 | Bajo |
| 4. Settings | Media | 4-5 | Bajo |
| 5. Polish | Media | 3-4 | Bajo |

**Orden recomendado:** Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5

Las fases 1 y 3 pueden hacerse en paralelo si se prefiere.

---

## 8. BENCHMARKS DE REFERENCIA

Las decisiones de diseño están basadas en análisis de:

- **DoorDash Dasher** (mayo 2025): layout simplificado, earnings tracking en tiempo real, "Earn by Time" mode
- **Uber Eats Driver**: botón de conexión como hero, mapa solo con pedido activo, instant cash-out
- **Rappi Soyrappi**: estado de conexión como header fijo, stats en grid compacto
- **Principios UX clave del mercado**: transparencia en ganancias, flexibilidad, incentivos visibles, optimización de rutas, feedback continuo

