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
