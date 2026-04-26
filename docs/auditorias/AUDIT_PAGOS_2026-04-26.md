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
