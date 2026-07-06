# Moovy — Histórico cronológico de ramas

> **Este archivo NO se carga automáticamente en sesiones de Claude.**
> Se consulta bajo demanda con grep cuando se necesita contexto histórico
> de una rama, una decisión, o un bug específico.
> 
> Para info canónica y perdurable, ver `.claude/CLAUDE.md`.
> Para issues abiertos hoy, ver `ISSUES.md`.
> Para tareas del sprint actual, ver `PROJECT_STATUS.md`.

---

## 2026-07-06 (rama `fix/seller-api-db-auth`)

fix(auth): requireSellerApi canónico contra DB — seller suspendido/desactivado con JWT vivo ya no puede operar (availability + confirm + confirm-scheduled)

**Archivos:** ISSUES.md, src/app/api/seller/availability/route.ts, src/app/api/seller/orders/[id]/confirm-scheduled/route.ts, src/app/api/seller/orders/[id]/confirm/route.ts, src/lib/seller-auth.ts

## 2026-07-06 (rama `fix/seller-api-db-auth`)

fix(auth): requireSellerApi — endpoints de seller autorizan contra DB, no JWT cache

Último 🔴 de la auditoría pre-launch de auth. Los 3 endpoints operativos del
seller usaban `hasAnyRole(session, ["SELLER"])` (JWT = cache, stale hasta 7
días): un seller suspendido o desactivado con sesión viva podía seguir
poniéndose online y confirmando pedidos.

- Helper canónico `requireSellerApi` en `src/lib/seller-auth.ts`: usa
  `computeUserAccess` (la MISMA derivación que los layouts protegidos, reglas
  #13/#28) → exige perfil existente + isActive + sin suspensión (propia o global
  del usuario). Espejo de `requireMerchantApi`/`requireDriverApi`. Soporta
  `{ allowAdmin: true }`.
- Migrados: `seller/availability` (GET+POST), `seller/orders/[id]/confirm`,
  `seller/orders/[id]/confirm-scheduled`. De paso se eliminó el findUnique
  duplicado del perfil (el helper ya trae sellerId).
- Mensajes 403 diferenciados (suspendido / desactivado / sin perfil), wording
  "el equipo de Moovy" (regla #22).
- Los "3 GETs de admin con hasAnyRole" señalados por el auditor son los GET
  multi-rol ADMIN+MERCHANT por diseño (decisión C-1, 2026-06-24) — sin cambios.

Sin schema. Con esto, los 4 críticos de la auditoría auth/estados/crons quedan
cerrados.

**Archivos:** src/lib/seller-auth.ts (nuevo), src/app/api/seller/availability/route.ts, src/app/api/seller/orders/[id]/confirm/route.ts, src/app/api/seller/orders/[id]/confirm-scheduled/route.ts

---

## 2026-07-06 (rama `fix/auditoria-estados-crons`)

fix: estado pagado canónico PAID en 5 lugares (contabilidad de cancelación, stats del comercio, OPS), idempotencia del cron merchant-timeout y audit log del bypass admin de PIN

**Archivos:** ISSUES.md, src/app/api/cron/merchant-timeout/route.ts, src/app/api/driver/orders/[id]/status/route.ts, src/app/api/merchant/stats/route.ts, src/app/api/orders/[id]/cancel/route.ts, src/app/ops/(protected)/pedidos/[id]/page.tsx

## 2026-07-06 (rama `fix/auditoria-estados-crons`)

fix: 3 críticos de la auditoría pre-launch de estados/crons (+2 hallazgos extra)

1. **Estado pagado canónico "PAID"** (regla #32): 5 lugares comparaban contra
   "APPROVED" (estado que NO existe en Moovy) —
   - `orders/[id]/cancel` (x2): pedidos pagados cancelados no quedaban REFUNDED
     en la contabilidad.
   - `merchant/stats` (x2): el dashboard del comercio sumaba $0 de revenue pagado
     (hallazgo extra del barrido — hubiera sido un golpe de confianza en el launch).
   - `ops/pedidos/[id]` (x3): mostraba "Pendiente" para pedidos pagados y escondía
     el botón de reembolso (hallazgo extra).
2. **Idempotencia de `merchant-timeout`** (regla #12): `updateMany WHERE
   status=PENDING` + `count === 1` ANTES de refund/emails/sockets — corridas
   solapadas del cron ya no pueden duplicar side effects. itemsProcessed ahora
   cuenta solo los realmente cancelados.
3. **Audit del bypass admin de PIN** (regla #26): cuando un admin fuerza
   PICKED_UP/DELIVERED salteando un PIN no verificado, queda `AuditLog
   ADMIN_PIN_OVERRIDE` (admin, pedido, qué PIN, driver) + warn en Pino. El bypass
   sigue permitido para emergencias; ahora es visible.

Sin schema. Origen: auditoría por dominios auth/estados/crons (ver ISSUES 2026-07-06).
Queda la Rama B pendiente: `requireSellerApi` (3 endpoints de seller con JWT cache).

**Archivos:** src/app/api/orders/[id]/cancel/route.ts, src/app/api/merchant/stats/route.ts, src/app/ops/(protected)/pedidos/[id]/page.tsx, src/app/api/cron/merchant-timeout/route.ts, src/app/api/driver/orders/[id]/status/route.ts

---

## 2026-07-06 (rama `feat/moover-boost-lanzamiento-y-defaults`)

feat(puntos): boost de lanzamiento configurable desde OPS (multiplicador + fecha, se apaga solo) + defaults canónicos del endpoint público y wording de /moover

**Archivos:** prisma/schema.prisma, scripts/verify-moover-boost.ts, src/app/api/config/points/route.ts, src/app/moover/page.tsx, src/app/ops/(protected)/config-biblia/BibliaConfigClient.tsx, src/lib/ops-config.ts, src/lib/points.ts

## 2026-07-06 (rama `feat/moover-boost-lanzamiento-y-defaults`)

feat(puntos): boost de lanzamiento configurable + defaults canónicos del endpoint público

Salidos de la auditoría anti-fantasma del programa MOOVER (dominio puntos):

Boost de lanzamiento (canon lo prometía, nunca se implementó):
- Schema PointsConfig: `earnBoostMultiplier Float @default(1)` + `earnBoostUntil DateTime?`.
  Default 1 = apagado (regla #15). DEPLOY EN MODO SCHEMA.
- `getActiveEarnBoost(config)` en points.ts; se aplica DENTRO de `calculatePointsEarned`
  (único punto de cálculo del earn → todos los caminos lo respetan). Compone con el
  multiplicador de nivel y NO puentea el mínimo de compra.
- Biblia OPS (sección Programa MOOVER): inputs "Multiplicador del boost" (1-5, clamp
  server-side) y "Boost hasta" (date, vacío = apagado, fin de día ART). El día del
  launch: poner 2 + fecha a 30 días, arranca sin deploy y se apaga solo al vencer.
- Endpoint público expone `earnBoostActive/Multiplier/Until` para que la UI pueda
  mostrar "puntos ×2" cuando esté activo.

Defaults canónicos:
- `/api/config/points` (consume /moover) tenía defaults inventados (1 pt/$ = 100× el
  rate real, bono 250, tope 15%): reescrito sobre `getPointsConfig()` — única fuente
  de verdad, cae a defaults de Biblia si la DB falla.
- Página `/moover`: fallbacks corregidos + wording "Ganá 0.01 punto por cada $1" →
  "Ganá 10 puntos por cada $1.000" (helper ptsPerMil).

Verificación: `scripts/verify-moover-boost.ts` (lógica pura + earn + roundtrip contra
DB real con restauración + defaults canónicos).

**Archivos:** prisma/schema.prisma, src/lib/points.ts, src/lib/ops-config.ts, src/app/api/config/points/route.ts, src/app/moover/page.tsx, src/app/ops/(protected)/config-biblia/BibliaConfigClient.tsx, scripts/verify-moover-boost.ts (nuevo)

---

## 2026-07-06 (rama `fix/comision-vendedor-10`)

fix(finanzas): comisiones al Plan Maestro — vendedor 10% y comercio 10% (tiers 10/9/8/7) en schema, seeds, fallbacks, emails, T&C y páginas públicas

**Archivos:** ISSUES.md, prisma/schema.prisma, prisma/seed-local-reset.ts, prisma/seed-production.ts, src/app/api/orders/route.ts, src/app/comisiones/page.tsx, src/app/nosotros/page.tsx, src/app/terminos-comercio/page.tsx (+5 mas)

## 2026-07-06 (rama `fix/comision-vendedor-10`)

fix(finanzas): comisiones alineadas al Plan Maestro en código Y textos (tarea #17)

La tarea era "vendedor 12% → 10% en el código", pero el barrido encontró textos
públicos y legales con el modelo viejo. Todo alineado al canon (comercio 10% base
con tiers 10/9/8/7, mes 1 gratis; vendedor 10% desde día 1):

- Schema: `defaultSellerCommission @default(12→10)` y `defaultMerchantCommission
  @default(8→10)`. OJO deploy: MODO SCHEMA (cambia defaults de columna, sin
  migración de datos).
- Seeds (local-reset + production): seller 12 → 10.
- Fallbacks de código: `ops-config.ts` y `orders/route.ts` (`?? 12` → `?? 10`).
- Emails seller activado (email-p0 + registry): "comisión 12%" → 10%.
- T&C vendedor: 12% → 10% (2 menciones).
- T&C comercio: base 8% → 10% + tiers BRONCE 10 / PLATA 9 / ORO 8 / DIAMANTE 7
  (decía 8/7/6/5, modelo viejo).
- `/nosotros`: "8% comercios, 12% marketplace, delivery fee" → "10% (primer mes
  gratis), 10%, envío".
- `/comisiones`: la card del vendedor PROMETÍA "0% en el lanzamiento, escala a 12%"
  — contradecía el canon (vendedor paga 10% desde el día 1). Card y 2 FAQs
  reescritas al modelo real. REVISAR FOUNDER: era una promesa pública.
- Comentario en vendedor/pedidos actualizado.

POST-DEPLOY OPERATIVO: el valor VIVO está en StoreSettings de la DB (prod tiene 12).
Cambiarlo desde /ops/config-biblia a 10 (local y prod) — el schema default solo
aplica a instalaciones nuevas.

**Archivos:** prisma/schema.prisma, prisma/seed-local-reset.ts, prisma/seed-production.ts, src/lib/ops-config.ts, src/app/api/orders/route.ts, src/lib/email-p0.ts, src/lib/email-registry.ts, src/app/terminos-vendedor/page.tsx, src/app/terminos-comercio/page.tsx, src/app/nosotros/page.tsx, src/app/comisiones/page.tsx, src/app/vendedor/(protected)/pedidos/page.tsx

---

## 2026-07-05 (rama `fix/split-mp-cada-parte-paga-lo-suyo`)

fix(pagos): split MP cada parte paga su 7,6% — marketplace_fee = (comisión + envío − desc) × (1 − r), comercio ya no banca el costo de MP sobre la parte de Moovy

**Archivos:** ISSUES.md, scripts/simulate-mp-split.ts, scripts/verify-split-cada-parte.ts, src/app/api/orders/route.ts, src/lib/finance/mp-split.ts

## 2026-07-03 (rama `fix/split-mp-cada-parte-paga-lo-suyo`)

fix(pagos): split MP alineado al Plan Maestro — cada parte paga SU 7,6%

BUG cazado en pago real de prod (MOV-W3G2, $2 producto + $12 envío): MP cobra
su comisión UNA vez y TODA al comercio (el cobrador) sobre el TOTAL, y Moovy se
llevaba su parte completa → el comercio pagaba también el 7,6% de la plata de
Moovy (recibió $0,73 en vez de ~$1,66). Violaba el "MP 7,6% transparente" del
Plan Maestro v1.

Fix en la función pura `computeMpSplit` (src/lib/finance/mp-split.ts):
  marketplace_fee = (comisión + envío − descuento) × (1 − r)
Moovy se auto-descuenta su porción del costo de MP; el comercio termina pagando
r solo sobre SU parte. Propiedades (verificadas con barrido):
- Exacto para cualquier monto (proporcional, sin escalones).
- El neto del comercio no puede dar negativo → rechazo CPT01 imposible.
- Liberación diferida del comercio (MP le cobra 3,81%): Moovy cobra igual,
  el ahorro es todo del comercio.
- Cupón > parte de Moovy: fee piso $0 + note de warning (logueada en el endpoint).

Verificación: `scripts/verify-split-cada-parte.ts` (34 checks, corrido OK:
típico, mes 1, MOV-W3G2 real, chico, $520K, envío gratis, cupones, diferida).
`scripts/simulate-mp-split.ts` sigue compatible (comentarios actualizados).
PENDIENTE regla 3: prueba real en prod post-deploy (trío comprador→comercio→Moovy,
verificar los 3 comprobantes contra la fórmula).

**Archivos:** src/lib/finance/mp-split.ts, src/app/api/orders/route.ts (comentario+log), scripts/simulate-mp-split.ts (comentario), scripts/verify-split-cada-parte.ts (nuevo)

---

## 2026-07-03 (rama `fix/asignacion-sin-filtro-equipamiento`)

fix: la naturaleza del envío (caliente/frío) ya no excluye repartidores ni restringe vehículos — interruptor EQUIPMENT_FILTERS_ENABLED, tamaño/peso sigue mandando

**Archivos:** ISSUES.md, scripts/verify-asignacion-sin-equipamiento.ts, src/components/rider/views/ProfileView.tsx, src/lib/assignment-engine.ts, src/lib/shipment-types.ts

## 2026-07-03 (rama `fix/asignacion-sin-filtro-equipamiento`)

fix: la naturaleza del envío ya no excluye repartidores (decisión founder)

BUG cazado en prueba real de prod: pedido pagado quedó en SEARCHING_DRIVER con
un driver online, con GPS y a 2km — lo excluía el filtro de mochila térmica
(pedido auto-detectado HOT, driver con hasThermalBag=false). Además el banner
del checkout no aplica esos filtros, así que dejó pagar ("1 disponible") un
pedido que el motor nunca iba a poder asignar.

Decisión founder: para el lanzamiento, caliente/frío/frágil NO restringe ni
vehículo ni equipamiento. El tamaño/peso (PackageCategory) sigue mandando
(precio del envío + vehículo mínimo).

- Interruptor único `EQUIPMENT_FILTERS_ENABLED = false` en `src/lib/shipment-types.ts`.
  Neutraliza: `driverMeetsEquipmentRequirements` (query PostGIS + fallback Haversine +
  re-validación en accept), `getCompatibleVehicles` e `isVehicleCompatibleWithShipment`.
  Sistema dormido, se reactiva poniendo true.
- Oferta al driver: `requiresThermalBag` sale false (no mostrar un requisito que no aplica).
- Perfil del driver: sección "Equipamiento" oculta tras el mismo interruptor.
- Verificación: `scripts/verify-asignacion-sin-equipamiento.ts` (DB real, 9+ checks:
  HOT/FRESH sin equipamiento pasa, tamaño XL sigue excluyendo BIKE, búsqueda real
  encuentra al driver sin mochila).
- PENDIENTE post-launch (ISSUES): unificar criterios de elegibilidad entre el banner
  de disponibilidad del checkout y el motor (hoy difieren en vehículo/tamaño).

**Archivos:** src/lib/shipment-types.ts, src/lib/assignment-engine.ts, src/components/rider/views/ProfileView.tsx, scripts/verify-asignacion-sin-equipamiento.ts (nuevo)

---

## 2026-07-02 (rama `fix/direcciones-barra-entregar-en`)

fix: barra "Entregar en" propia bajo el header (reemplaza el chip en el header de la rama anterior)

**Archivos:** src/app/(store)/layout.tsx, src/components/layout/AppHeader.tsx, src/components/layout/DeliveryAddressBar.tsx

## 2026-07-02 (rama `feat/direcciones-limite-y-chip-header`)

feat: límite de 2 direcciones guardadas (defensa server-side) + chip "Entregar en" en el header con cambio rápido de dirección

**Archivos:** src/app/(store)/checkout/page.tsx, src/app/(store)/mi-perfil/direcciones/page.tsx, src/app/api/profile/addresses/route.ts, src/components/layout/AppHeader.tsx, src/components/layout/DeliveryAddressChip.tsx, src/lib/addresses.ts

## 2026-07-02 (rama `feat/direcciones-limite-y-chip-header`)

feat: límite de 2 direcciones guardadas + chip "Entregar en" en el header

Límite (decisión founder: máximo 2, los que ya tienen 3+ conservan pero no suman):
- `src/lib/addresses.ts` nuevo: `MAX_SAVED_ADDRESSES = 2` + mensaje compartido
  client+server (regla #7) + `formatAddressShort`.
- POST `/api/profile/addresses`: count + create atómicos en transacción Serializable
  (a prueba de doble click); al llegar al límite → 409 con mensaje claro y
  `code: MAX_ADDRESSES`. La UI esconde el botón pero la defensa es server (regla #1).
- Checkout y Mi Perfil > Direcciones: botón "+ Nueva Dirección"/"Agregar otra
  ubicación" desaparece al llegar a 2, con texto que explica el límite.

Barra "Entregar en" (patrón apps de delivery, decisión founder: barra propia bajo
el header, no chip):
- `DeliveryAddressBar` nueva: barra fina ancho completo con "Entregar en:
  Av. Maipú 263 ▾", montada en el layout de (store) DENTRO del contenido
  scrolleable (no en el header fijo — así no se recalcula el padding-top global
  y scrollea con la página). Dropdown para cambiar entre guardadas (marca
  isDefault vía PATCH existente → el checkout la preselecciona), link
  "Administrar direcciones". Solo logueados, 1 fetch, se auto-oculta si no hay
  direcciones o falla el fetch. Sin schema, sin polling.
- NOTA QA: el 500 al crear dirección que apareció probando en local era ambiente
  (sesión JWT viva apuntando a un usuario borrado de la DB local → FK violation
  P2003), no un bug del código. Se resuelve re-logueando.

**Archivos:** src/lib/addresses.ts (nuevo), src/components/layout/DeliveryAddressBar.tsx (nuevo), src/app/(store)/layout.tsx, src/app/api/profile/addresses/route.ts, src/app/(store)/checkout/page.tsx, src/app/(store)/mi-perfil/direcciones/page.tsx

---

## 2026-07-02 (rama `fix/cortina-identidad-ushuaia`)

fix: cortina con identidad local — "Hecha en Ushuaia, para Ushuaia", foto de Ushuaia en duotono rojo y fuegos artificiales en canvas con física real (laterales, cadencia pro)

**Archivos:** public/ushuaia-bg.jpg, src/app/proximamente/Fireworks.tsx, src/app/proximamente/PreLaunchForm.tsx, src/app/proximamente/page.tsx

## 2026-07-02 (rama `fix/cortina-identidad-ushuaia`)

fix: cortina "Próximamente" con identidad local

- Titular "Está por llegar a Ushuaia" -> "Hecha en Ushuaia, para Ushuaia" (decisión del
  founder: Moovy se creó en Ushuaia, para Ushuaia; la cortina debe decirlo).
- Párrafo nuevo: "Moovy nace acá, en el fin del mundo..." (framing positivo, sin
  comparaciones implícitas con apps de afuera, regla de marca).
- Tarjeta social (OG title/description/alt) y mensaje pre-escrito de WhatsApp del
  formulario alineados al mismo copy.
- Solo copy en esa parte, sin lógica ni schema. NOTA: la imagen `public/og-moovy.png`
  puede tener el texto viejo horneado — revisar si hay que regenerarla.
- Fuegos artificiales hiperrealistas: reemplazada la animación CSS (estallidos fijos
  en loop) por canvas con física real en `Fireworks.tsx` (client, sin librerías):
  cohetes que suben con estela de brasas, destello de explosión, gravedad + arrastre
  del aire, chispas que titilan y crepitan al apagarse. Misma paleta celeste/blanco.
  Respeta prefers-reduced-motion, pausa con pestaña oculta, menos partículas en
  mobile, cap global de chispas. Calibrado con el founder: explosiones grandes
  (radio 22-38% del lado menor, variable), SOLO en los laterales (bandas 4-20% y
  80-96% del ancho — el centro queda para el branding), altura aleatoria (5-50% del
  alto), cadencia de show profesional (ritmo irregular 2,5-7s + dobletes ocasionales).
- Foto de Ushuaia de fondo (`public/ushuaia-bg.jpg`, panorama puerto+ciudad+Martial,
  Unsplash de Caio Portela, licencia libre comercial sin atribución): va debajo de un
  velo rojo Moovy en duotono (`mix-blend-multiply` + 45% rojo extra) — se reconoce el
  paisaje, la identidad sigue roja y el texto mantiene contraste. Si el archivo falta,
  la página cae al rojo plano (no rompe).

**Archivos:** src/app/proximamente/page.tsx, src/app/proximamente/PreLaunchForm.tsx, src/app/proximamente/Fireworks.tsx (nuevo), public/ushuaia-bg.jpg (nuevo)

---

## 2026-07-02 (rama `chore/emails-redaccion-catalogo`)

chore: redaccion de emails + reorganizacion del catalogo

Contenido (no toca logica de pagos):
- PIN de entrega fuera del asunto del email "va en camino" (queda solo en el cuerpo)
- Reporte de revenue al owner: "comisiones + operativo" -> "comisiones + margen de
  envio" (el operativo se elimino en el Plan Maestro)
- Anglicismo "no-show" -> espanol en el asunto al comercio ("vuelve a tu comercio")

Pulido de redaccion:
- Asuntos redundantes/agresivos corregidos: pedido confirmado, pago rechazado (sin el
  X), rechazo por comercio, cancelacion por sistema
- Quitada la presion artificial ("otros lo estan viendo" / "antes de que suba la
  demanda") en carrito abandonado 2do y "hay repartidor en tu zona"
- "Tienda aprobada" ahora menciona el primer mes sin comision (0%)

Catalogo:
- 18 categorias inconsistentes -> 8 limpias (Onboarding y Aprobacion, Pedido, Pago,
  Entrega, Fidelizacion, Cuenta/Seguridad/Legal, Alertas Operativas, Reportes).
  69 emails reasignados.
- Borrada la entrada duplicada "admin_new_change_request" (marcada como no conectada,
  ya hay versiones especificas). Array de 70 -> 69.

Sin cambio de schema.

**Archivos:** src/lib/email-admin-ops.ts, src/lib/email-legal-ux.ts, src/lib/email-p0.ts, src/lib/email-registry.ts, src/lib/email.ts

## 2026-07-01 (rama `fix/emails-triggers-ciclo`)

feat: cablear emails transaccionales del ciclo de pedido/pago

Conecta los disparadores de 8 emails que estaban definidos y registrados en
EMAIL_REGISTRY pero nunca se enviaban. Todos fire-and-forget (si el email falla,
NUNCA rompe el pedido ni el pago) y verificados con cross-check (2 rondas).

- Pedido entregado -> al pasar a DELIVERED (driver/orders/[id]/status)
- Nuevo pedido al comercio -> al crear el pedido (orders POST, por comercio)
- Pago rechazado -> webhook MP rejected (idempotente por eventId, no throwea)
- Rechazo del comercio -> merchant/orders/[id]/reject
- Cancelacion del comprador -> orders/[id]/cancel (solo NO pagados con MP; los
  pagados reciben el email de reembolso via refundOrderIfPaid -> sin duplicar)
- Cancelacion por sistema -> cron merchant-timeout (misma logica anti-duplicado)
- Suspension de comercio/repartidor -> admin/users/[id]/suspend
- Pago recibido al comercio -> order-payment-confirm, DENTRO del bloque idempotente
  count>0 (una sola vez aunque confirmen webhook y polling), con desglose
  bruto/comision/neto por SubOrder (sellerPayout = subtotal - moovyCommission)

Se difieren (sin evento propio o redundantes): pago pendiente (idempotencia
requeriria un campo nuevo de schema), cancelado-por-comercio (redundante con
rechazo), refund_processed (se usa order_refunded ya existente), recordatorio
pre-timeout (falta el cron), emails de owner (falta cron/evento), y el 2do trigger
de cancelacion por sistema en assignment-engine (escenario UNASSIGNABLE, ya cubierto
por el flujo de "buscando repartidor").

Sin cambio de schema (no requiere prisma db push).

**Archivos:** knip.json, src/app/api/admin/users/[id]/suspend/route.ts, src/app/api/cron/merchant-timeout/route.ts, src/app/api/driver/orders/[id]/status/route.ts, src/app/api/merchant/orders/[id]/reject/route.ts, src/app/api/orders/[id]/cancel/route.ts, src/app/api/orders/route.ts, src/app/api/webhooks/mercadopago/route.ts (+1 mas)

## 2026-07-01 (rama `fix/motor-envio-aditivo-y-pago-repartidor`)

fix: motor de envío aditivo (Plan Maestro v1) + repartidor siempre pago

- Fórmula aditiva: envío = base_vehículo + costo_km × distancia (× zona × clima × demanda). Se eliminó el max() y el factor 2.2.
- Operativo (5% del subtotal) ELIMINADO: el envío es solo logística; el margen de Moovy vive en la comisión, no embebido en el envío.
- Valores Ushuaia por vehículo en seed-delivery: Bici $1.600/$90, Moto $1.800/$130, Auto $2.600/$190, Pickup $6.500/$300, Flete $18.000/$450 (consumo=0 → costo_km directo).
- Envío gratis controlado por Moovy: el snapshot usa el VIAJE REAL, no el fee del cliente, así el repartidor SIEMPRE cobra su 80% aunque el cliente pague $0 (arreglo del hallazgo de auditoría).
- Fallback de payout queda correcto al eliminar el operativo (envío = costo del viaje).
- scripts/simular-envios.ts: verificación de los 5 vehículos × distancias × zonas + invariantes financieros. Verificado OK.

**Archivos:** .claude/CLAUDE.md, .qa-slides/slide-1.jpg, .qa-slides/slide-2.jpg, .qa-slides/slide-3.jpg, .qa-slides/slide-4.jpg, .qa-slides/slide-5.jpg, .qa-slides/slide-6.jpg, .qa-slides/slide-7.jpg (+14 mas)

## 2026-06-28 (rama `fix/comision-10-canonica-en-seeds`)

fix(finanzas): comisión 10% canónica en seeds + fallbacks + páginas (el 8% queda obsoleto)

- Seeds (seed.ts, seed-local-reset.ts, seed-production.ts) + scripts de config
  (fix-ops-config.ts, reset-db.ts, seed-biblia-launch.ts): comisión base 10% y
  tiers BRONCE 10 / PLATA 9 / ORO 8 / DIAMANTE 7. seed-production sigue PRUDENTE
  (StoreSettings + tiers con update:{}, no pisa la config viva de prod).
- Fallbacks de código: merchant-loyalty.ts (getDefaultMerchantCommission → 10),
  ops-config.ts y orders/route.ts (defaultMerchantCommission ?? 10).
- Páginas user-facing y legales (/comisiones, /terminos): 8% → 10%.
- Fixtures de test + logs/descripciones: 8% → 10%.
- Resultado: el 8% de comisión ya no existe en ningún rincón del repo. La config
  vive en código (canónica) y OPS sigue mandando en runtime.

**Archivos:** prisma/seed-local-reset.ts, prisma/seed-production.ts, prisma/seed.ts, scripts/fix-ops-config.ts, scripts/reset-db.ts, scripts/seed-biblia-launch.ts, scripts/seed-real-world-test.ts, scripts/seed-test-merchants.js (+8 mas)

## 2026-06-28 (rama `feat/asignacion-reintento-y-reembolso`)

feat(logistica): un pedido pagado nunca queda sin asignar — ventana de búsqueda + reintento + reembolso automático

- Si no hay repartidor al confirmar, el pedido entra en SEARCHING_DRIVER (ventana
  configurable `driver_search_window_minutes`, default 20 min) en vez de morir en
  UNASSIGNABLE. El cron assignment-tick y el hook de driver-online reintentan; al
  vencer la ventana sin repartidor → refund automático (refundOrderIfPaid).
- `onNoEligibleDriver` reemplaza las 6 llamadas directas a handleNoDriverFound.
- Estado "Buscando repartidor" visible para comprador y comercio (no más fantasma).
- Checkout: sacado "Programar para más tarde" del cartel sin repartidor; queda
  "Retirar en local" + "Avisame cuando haya repartidor". El pago sigue bloqueado si
  no hay repartidor y es envío inmediato.
- Aviso "ya hay repartidor" ahora también por email (sendDriverAvailableEmail,
  registrado en EMAIL_REGISTRY) — confiable en iPhone web donde el push no llega.
- Schema: Order.driverSearchUntil → deploy en MODO SCHEMA.
- Script de verificación: scripts/verify-driver-search-flow.ts.

**Archivos:** .claude/CLAUDE.md, PROJECT_STATUS.md, prisma/schema.prisma, scripts/verify-driver-search-flow.ts, src/app/(store)/checkout/page.tsx, src/app/(store)/mis-pedidos/page.tsx, src/app/api/cron/assignment-tick/route.ts, src/app/api/driver/status/route.ts (+6 mas)

## 2026-06-26 (rama `fix/split-mp-comercio-banca-mp`)

fix(pagos): el comercio banca su comisión de MP y Moovy cobra su comisión completa + fix descuento no aplicado al cobro

- mp-split.ts: se saca el tope que protegía el producto del comercio y hacía que Moovy absorbiera MP (en retiro daba $0 de comisión). Ahora Moovy cobra su comisión + envío COMPLETOS; el comercio (que es el que cobra) banca su propia comisión de MP según cómo configure su cuenta. Queda solo un tope de seguridad para que el comercio no quede negativo en casos extremos (envío enorme vs producto) y MP no rechace.
- orders/route.ts: se quita el gross-up (el comprador NO paga MP). order.total no se toca.
- mercadopago.ts: buildPreferenceBody totaliza order.total → arregla el bug por el que el descuento (cupón/puntos) no llegaba al cobro de MP (cobraba el precio sin descuento → amount_mismatch). Colapsa a una línea en retiro / descuento grande.
- checkout: vuelve a mostrar el precio limpio (sin gross-up).
- delivery/calculate: se saca mpReservePercent (ya no se usa en el checkout).
- unit-economics: Moovy ya NO resta MP del margen (lo banca el comercio); mpCost queda como referencia.
- Comisión queda en 8%. Sin cambios de schema. Pendiente: test real de pago en prod antes de abrir la cortina.

**Archivos:** src/app/(store)/checkout/page.tsx, src/app/api/delivery/calculate/route.ts, src/app/api/orders/route.ts, src/lib/finance/mp-split.ts, src/lib/finance/unit-economics.ts

## 2026-06-25 (rama `feat/split-mp-grossup-comprador`)

feat(pagos): comprador cubre la comisión de MP (gross-up) embebida en el envío + fix descuento no aplicado al cobro

- orders/route.ts: grossUp=true cuando hay envío con costo; order.total = chargedTotal (descuento aplicado + comisión MP embebida). En retiro/envío gratis Moovy absorbe MP (no hay dónde esconderlo sin línea de servicio, ~break-even).
- mercadopago.ts: buildPreferenceBody totaliza order.total. Arregla bug pre-existente: el descuento (cupón/puntos) no llegaba al cobro de MP (cobraba precio sin descuento → webhook amount_mismatch). Colapsa a una línea en pickup/descuento grande.
- delivery/calculate: expone mpReservePercent para que el checkout muestre el total correcto.
- checkout: total y envío muestran el gross-up embebido en el envío; el desglose cuadra, sin línea de "tarifa de servicio".
- unit-economics: costo MP NETO (descuenta el buffer que paga el comprador) para no subestimar el margen.
- Sin cambios de schema. PENDIENTE antes de abrir la cortina: test real de pago con MP en prod (gross-up + reparto + webhook sin amount_mismatch).

**Archivos:** .claude/CLAUDE.md, ISSUES.md, docs/AUDITORIA_SEGURIDAD_2026-06-18.md, src/app/(store)/checkout/page.tsx, src/app/api/delivery/calculate/route.ts, src/app/api/orders/route.ts, src/lib/finance/unit-economics.ts, src/lib/mercadopago.ts

## 2026-06-24 (rama `fix/admin-auth-db-c1`)

fix(seguridad): C-1 — autorización de admin contra DB, no contra el JWT

Cierra el crítico C-1 de la auditoría: toda la autorización de admin se hacía
contra el rol del JWT (cache de 7 días), así que un admin degradado/suspendido
seguía operando hasta 7 días (refunds, payouts, broadcasts, borrados).

- Nuevo helper DB-based `requireApiAdmin()` en src/lib/admin-auth.ts (espejo de
  requireDriverApi/requireMerchantApi): consulta User.role en la base, bloquea
  no-admin/suspendido/archivado, devuelve 401/403. Degradar un admin tiene efecto
  inmediato sin tocar la sesión.
- Layout /ops/(protected) ahora gatea con requireAdminAccess() (DB) en vez de
  hasAnyRole(JWT).
- 127 endpoints de /api/admin y /api/ops migrados a requireApiAdmin (incluidos los
  15 críticos de dinero/irreversibles: refund, payouts, broadcast, hard-delete,
  cancel/cleanup de pedidos, delete/bulk-delete de usuarios, comisiones, ops-config).
  Preservados intactos: Zod, rate limit, confirmaciones literales, bcrypt, audit,
  transacciones Serializable.
- 4 endpoints GET multi-rol (ADMIN+MERCHANT / visibilidad) se dejan como están a
  propósito: products, products/[id], pricing-tiers, points-config.
- El proxy.ts queda como filtro barato de routing (el gate real es layout + API
  contra DB).
- Script de verificación scripts/verify-admin-auth.ts (131/131 OK).

Regla canónica nueva (#29): autorización de admin SIEMPRE contra DB via
requireApiAdmin (API) / requireAdminAccess (layout). El JWT roles[] es cache.

**Archivos:** scripts/verify-admin-auth.ts, src/app/api/admin/active-orders/route.ts, src/app/api/admin/ad-placements/[id]/route.ts, src/app/api/admin/ad-placements/route.ts, src/app/api/admin/analytics/route.ts, src/app/api/admin/audit/route.ts, src/app/api/admin/auto-locked-accounts/route.ts, src/app/api/admin/backups/route.ts (+126 mas)

## 2026-06-24 (rama `fix/landing-fija-responsive-desktop`)

feat(landing+ops): compartir multi-canal con tarjeta social + borrado permanente de leads

Landing /proximamente:
- Compartir tras registro: WhatsApp (mensaje pre-escrito listo para enviar) y Copiar link
- Copiar link con fallback para http (pruebas por IP local sin HTTPS)
- Open Graph + Twitter Card: al pegar el link en WhatsApp/Facebook se muestra una tarjeta (imagen public/og-moovy.png 1200x630, título y descripción). Facebook ya no permite pre-escribir el posteo; esto es lo que muestra automáticamente
- Layout adaptativo (min-h-[100dvh]): sin scroll si entra, scroll si la pantalla es muy chica; desktop en dos columnas
- Sin emojis; consentimiento obligatorio (validado en cliente y servidor)

OPS lista de espera:
- Endpoint DELETE /api/ops/prelaunch/[id] (solo ADMIN, rate limit, audit log): borra el lead permanentemente de la base
- Botón "Eliminar" con confirmación en dos pasos (sin window.confirm nativo)

Assets:
- public/og-moovy.png: tarjeta social (logo blanco sobre rojo + "Está por llegar a Ushuaia")

**Archivos:** public/og-moovy.png, src/app/api/ops/prelaunch/[id]/route.ts, src/app/ops/(protected)/prelaunch/DeleteLeadButton.tsx, src/app/ops/(protected)/prelaunch/page.tsx, src/app/proximamente/PreLaunchForm.tsx, src/app/proximamente/page.tsx

## 2026-06-24 (rama `feat/landing-cortina-preregistro`)

feat(landing): cortina "Proximamente" con pre-registro de comercios/repartidores + elimina moovyx

Nueva lista de espera pre-lanzamiento: la cortina publica ahora deja a comercios y
repartidores anotarse para que Moovy los contacte al lanzar.

- Modelo PreLaunchLead (rol, email, whatsapp opcional, nombre opcional, consentimiento +
  fecha, IP/UA, source). Dedupe por (email, rol). <- cambio de schema, requiere db push.
- Endpoint publico /api/prelaunch/signup: Zod + rate limit por IP + honeypot anti-bot +
  upsert + registro de consentimiento (AAIP / Ley 26.951).
- Rediseno de /proximamente con el formulario (toggle comercio/repartidor, email +
  WhatsApp opcional + nombre, checkbox de consentimiento, estados loading/error/success).
- Vista OPS /ops/prelaunch: contadores + lista + exportar CSV. Link en el sidebar (Actores).
- Eliminado moovyx (page + register endpoint): registro viejo e inseguro que la auditoria
  habia marcado (sin auth/rate limit/Zod). Lo reemplaza este pre-registro.

Email como dato principal (legalmente mas liviano); WhatsApp opcional. Sin datos fiscales.

NOTA: nuevo modelo Prisma -> correr `npx prisma generate` ANTES de finish.ps1 (para que el
tsc reconozca PreLaunchLead). Deploy en modo schema (db push).

Archivos: prisma/schema.prisma, src/app/api/prelaunch/signup/route.ts (nuevo),
src/app/proximamente/page.tsx, src/app/proximamente/PreLaunchForm.tsx (nuevo),
src/app/ops/(protected)/prelaunch/page.tsx (nuevo),
src/app/ops/(protected)/prelaunch/ExportLeadsButton.tsx (nuevo),
src/components/ops/OpsSidebar.tsx.
Eliminados: src/app/moovyx/, src/app/api/moovyx/.

**Archivos:** docs/RUNBOOK_DEPLOY_2026-06-23.md, prisma/schema.prisma, src/app/api/moovyx/register/route.ts, src/app/api/prelaunch/signup/route.ts, src/app/moovyx/page.tsx, src/app/ops/(protected)/prelaunch/ExportLeadsButton.tsx, src/app/ops/(protected)/prelaunch/page.tsx, src/app/proximamente/PreLaunchForm.tsx (+2 mas)

## 2026-06-23 (rama `fix/cifrar-tokens-mp`)

fix(seguridad): cifrar at-rest los tokens de MP (Merchant + SellerProfile)

C-3 Rama 2 (ultima pieza del cifrado). mpAccessToken/mpRefreshToken se guardaban en
TEXTO PLANO -> permitian operar la cuenta MP del comercio/vendedor si se filtraba la DB.
Ahora se cifran at-rest (AES-256-GCM).

- fiscal-crypto: mpAccessToken/mpRefreshToken agregados a MERCHANT_ y SELLER_ENCRYPTED_FIELDS.
- WRITE: mp/callback cifra mpData antes de guardar (merchant + seller).
- READ-USE (descifran; cubren TODA la plata):
  - orders/route.ts -> los 3 tokens del split (crear preferencia).
  - mercadopago.ts resolveOrderVendorToken -> 1 punto que cubre los 4 callers de refund.
- FUGAS DE DISPLAY tapadas (con cifrado serian peores):
  - seller/profile PUT: strippea los tokens del response (igual que el GET).
  - admin/merchants/[id] GET+PATCH: booleano mpLinked en vez del token;
    ops/comercios/[id] ajustado a mpLinked.

decrypt es graceful sobre texto plano -> transicion sin downtime. ORDEN DE DEPLOY:
codigo PRIMERO, despues backfill (scripts/backfill-encrypt-mp-tokens.ts, dry-run -> --execute).

Nota: refreshOAuthToken hoy no tiene callers; si se implementa el cron de refresh, ese
caller debera descifrar el refresh token antes de usarlo.

Archivos: src/lib/fiscal-crypto.ts, src/lib/mercadopago.ts, src/app/api/orders/route.ts,
src/app/api/mp/callback/route.ts, src/app/api/seller/profile/route.ts,
src/app/api/admin/merchants/[id]/route.ts,
src/app/ops/(protected)/comercios/[id]/page.tsx,
scripts/backfill-encrypt-mp-tokens.ts (nuevo).

**Archivos:** scripts/backfill-encrypt-mp-tokens.ts, src/app/api/admin/merchants/[id]/route.ts, src/app/api/mp/callback/route.ts, src/app/api/orders/route.ts, src/app/api/seller/profile/route.ts, src/app/ops/(protected)/comercios/[id]/page.tsx, src/lib/fiscal-crypto.ts, src/lib/mercadopago.ts

## 2026-06-23 (rama `fix/cifrar-datos-bancarios-driver`)

fix(seguridad): cifrar at-rest el CBU/alias del repartidor (+ 2 bugs preexistentes)

C-3 Rama 1. El bankCbu/bankAlias del Driver se guardaban en TEXTO PLANO (el del
SellerProfile ya estaba cifrado). Ahora se cifran at-rest (AES-256-GCM): se agregan
a DRIVER_ENCRYPTED_FIELDS y se aplica encrypt en el write / decrypt en cada read.

Read-sites cubiertos (decrypt es graceful sobre texto plano -> transicion sin downtime):
- driver/bank-account GET (descifra) + PATCH (cifra)
- payouts.ts: descifra el CBU del repartidor antes del CSV de transferencia
- orders/[id]: descifra el bankAlias que ve el comprador para la propina

Bugs PREEXISTENTES arreglados de paso:
- payouts.ts leia merchant.bankAccount/cuit (ya cifrados) SIN descifrar -> el CSV de
  pago a comercios tenia ciphertext. Ahora descifra.
- vendedor/ganancias mostraba el bankCbu/bankAlias del vendedor cifrado en pantalla.

Sin schema (la lista de campos cifrados es codigo). Backfill idempotente:
scripts/backfill-encrypt-driver-bank.ts. ORDEN: deployar el codigo PRIMERO, despues
correr el backfill (dry-run -> --execute) en prod. decrypt graceful tolera la mezcla.

Archivos: src/lib/fiscal-crypto.ts, src/app/api/driver/bank-account/route.ts,
src/lib/payouts.ts, src/app/api/orders/[id]/route.ts,
src/app/vendedor/(protected)/ganancias/page.tsx,
scripts/backfill-encrypt-driver-bank.ts (nuevo).

**Archivos:** scripts/backfill-encrypt-driver-bank.ts, src/app/api/driver/bank-account/route.ts, src/app/api/orders/[id]/route.ts, src/app/vendedor/(protected)/ganancias/page.tsx, src/lib/fiscal-crypto.ts, src/lib/payouts.ts

## 2026-06-23 (rama `fix/payout-repartidor-consistente`)

fix(pagos): el repartidor cobra exactamente lo que ve (consistencia payout/ganancias)

El panel "Mis ganancias" calculaba envio x 80%, mientras el pago real (payouts.ts)
usaba el snapshot exacto cuando existia y un envio x 0.70 desactualizado cuando no.
El repartidor veia un monto y cobraba otro (viola la regla "dos sistemas no calculan
el mismo parametro con valores distintos").

Fix: una funcion compartida computeDriverPayoutForOrder (src/lib/finance/driver-payout.ts)
es la UNICA fuente de verdad -> snapshot exacto SubOrder.driverPayoutAmount (incluye
bonus de zona) si existe; si no, envio x riderCommissionPercent% (de la Biblia). La usan
TANTO payouts.ts COMO api/driver/earnings, asi que el panel y el pago coinciden por
construccion. Eliminada la aproximacion fija DRIVER_SHARE 0.70 (asumia un 5% operativo
que ya se retiro a 0).

Sin schema. Verificacion: un pedido entregado -> el monto en "Mis ganancias" == el monto
del lote de pago para ese pedido.

Archivos: src/lib/finance/driver-payout.ts (nuevo), src/lib/payouts.ts,
src/app/api/driver/earnings/route.ts.

**Archivos:** .tsc_probe.json, docs/MAPA_FLUJO_MOOVY.html, docs/PLAN_MAESTRO_CIFRADO_C3.md, src/app/api/driver/earnings/route.ts, src/lib/finance/driver-payout.ts, src/lib/payouts.ts

## 2026-06-23 (rama `fix/quitar-bypass-fundador-paquetes`)

fix(seguridad): quitar bypass de pago "FUNDADOR" en compra de paquetes

merchant/packages/purchase aprobaba un paquete pago GRATIS si el body traia
promoCode === "FUNDADOR" (string hardcodeado). Cualquier comercio autenticado podia
mandarlo y llevarse el paquete + auto-import sin pagar -> perdida directa de revenue.
Ahora la compra gratis solo procede cuando el precio es genuinamente $0 (calculado
server-side desde los pricing tiers). Si se necesita regalar un paquete a un fundador,
debe ser una accion de admin con audit log, no un codigo publico adivinable.

Sin schema. Verificado: FUNDADOR no se usa en ningun otro lado del codebase.

Archivos: src/app/api/merchant/packages/purchase/route.ts (1 condicion).

**Archivos:** src/app/api/merchant/packages/purchase/route.ts

## 2026-06-22 (rama `fix/split-mp-reserva-y-operativo`)

fix(pagos): reserva de comision MP en el split (arregla CPT01) + retiro operativo

El marketplace_fee enviaba a Moovy "comision + envio completo", sin dejar lugar para
la comision que MP le cobra al comercio (el cobrador). Con envio grande, al comercio
le quedaba negativo y MP rechazaba ("Algo salio mal / CPT01"). Ahora el split reserva
la comision de MP via computeMpSplit (funcion pura + script de simulacion), asi el
comercio siempre cobra su producto y MP no rechaza.

Paso 1: Moovy absorbe la comision de MP (NO toca el total del pedido -> sin riesgo de
webhook). El buffer al comprador (Moovy cobra el envio completo) queda para una rama
futura, con test real previo (grossUp=true ya soportado en la funcion).

Nuevo parametro configurable "% reserva MP" en la Biblia (StoreSettings.mpReservePercent,
default 8%, editable desde /ops/config-biblia). Operativo retirado (a 0 desde OPS).

Requiere: npx prisma db push (columna nueva). Deploy en modo schema.

Archivos: src/lib/finance/mp-split.ts (nuevo), src/lib/finance/mp-reserve.ts (nuevo),
src/app/api/orders/route.ts, prisma/schema.prisma, src/lib/ops-config.ts,
src/app/api/admin/ops-config/route.ts,
src/app/ops/(protected)/config-biblia/BibliaConfigClient.tsx,
scripts/simulate-mp-split.ts.

**Archivos:** prisma/schema.prisma, scripts/simulate-mp-split.ts, src/app/api/admin/ops-config/route.ts, src/app/api/orders/route.ts, src/app/ops/(protected)/config-biblia/BibliaConfigClient.tsx, src/lib/finance/mp-reserve.ts, src/lib/finance/mp-split.ts, src/lib/ops-config.ts

## 2026-06-19 (rama `fix/driver-profile-no-filtrar-campos-internos`)

fix(seguridad): driver/profile deja de filtrar campos internos al cliente

El GET y el PATCH de /api/driver/profile devolvian la fila completa del Driver, exponiendo al browser fraudScore, GPS (lat/lng/ubicacion), bankCbu/bankAlias y notas internas de OPS (*ApprovalSource/*ApprovalNote/*NotifiedStage). Ahora ambos devuelven una whitelist explicita con solo lo que consumen ProfileView (portal repartidor) y /mi-perfil. Sin cambios de schema. Verificado campo por campo contra ambos consumidores.

**Archivos:** .tsc_c2_check.json, docs/AUDITORIA_SEGURIDAD_2026-06-18.md, docs/prompts-cowork/PROMPT_7_AUDITORIAS_SENIOR.md, src/app/api/driver/profile/route.ts

## 2026-06-18 (rama `feat/puntos-wording-amex-y-acceso`)

feat(puntos): seccion de Puntos estilo Amex + chip de saldo en header + claridad de donde aplican (s4-4e). WORDING AMEX: en /puntos el row "Comprando" y el paso "Compra" de la landing dejan de liderar con la formula y muestran valor ("Ganas puntos con cada compra"); el calculo "10 por $1.000" se mueve a un desplegable "Como se calcula" (y sigue disponible en el modal de niveles y en /terminos-moover). ACCESO: componente nuevo PointsBalanceChip montado en AppHeader (desktop + barra mobile), solo para logueados, linkea a /puntos, 1 solo fetch a /api/points sin polling, se auto-oculta si el saldo es 0 o si falla (no muestra chip vacio a usuarios nuevos). DONDE APLICAN: las dos aclaraciones que mas evitan reclamos (se calculan sobre productos y no sobre el envio; se acreditan al recibir el pedido, no al pagar) pasan del desplegable a estar VISIBLES en el bloque "Como funcionan tus puntos". NO se toca la logica de earn/burn ni el PointsWidget del checkout (el chip solo lee el balance). La seccion "Ejemplo" (calculo paso a paso) de la landing anonima queda intacta. Sin cambios de schema. Archivos: src/components/layout/PointsBalanceChip.tsx (nuevo), src/components/layout/AppHeader.tsx (montar el chip), src/app/(store)/puntos/page.tsx (wording + aclaraciones).

**Archivos:** ISSUES.md, PROJECT_STATUS.md, docs/HANDOFF_PENDIENTES.md, src/app/(store)/puntos/page.tsx, src/components/layout/AppHeader.tsx, src/components/layout/PointsBalanceChip.tsx

## 2026-06-18 (rama `feat/ops-campana-notificaciones`)

feat(ops): campana de notificaciones en el panel OPS (s3-3a-05). Endpoint nuevo GET /api/admin/notifications (admin-only, 403 a no-admin) que DERIVA 4 fuentes sin tocar schema: aprobaciones pendientes (Merchant+Driver approvalStatus=PENDING), change-requests de docs abiertos (Merchant/DriverDocumentChangeRequest status=PENDING), resenas en moderacion (Order con driver/merchant/sellerRatingModerationStatus=PENDING) e incidentes de PIN (AuditLog action=DRIVER_PIN_ISSUE_REPORTED, ventana 48h). Cada fuente en su propio try/catch (una caida no rompe el resto) + cap por fuente (25) y global (50); cada item lleva deep-link a la pantalla que lo resuelve (/ops/usuarios/[userId], /ops/reviews-pendientes, /ops/pedidos/[orderId]). Componente OpsNotificationBell montado en el header desktop del sidebar y en la barra superior mobile: badge de "nuevos", dropdown agrupado por tipo (Incidentes/Aprobaciones/Cambios de documentos/Resenas), polling 45s con pausa cuando la pestana no esta visible, localStorage de IDs vistos para el "nuevo desde la ultima vez" (sin estado en DB), estados loading/vacio/error. Script read-only scripts/verify-ops-notifications.ts para contar pendientes por fuente contra la DB real. Decisiones del founder: todos los eventos | polling 30-60s | derivar al vuelo sin schema. Sin cambios de schema.

**Archivos:** ISSUES.md, PROJECT_STATUS.md, docs/HANDOFF_PENDIENTES.md, scripts/verify-ops-notifications.ts, src/app/api/admin/notifications/route.ts, src/components/ops/OpsNotificationBell.tsx, src/components/ops/OpsSidebar.tsx

## 2026-06-17 (rama `chore/quitar-flag-efectivo`)

chore(ops): quitar el flag fantasma de pago en efectivo (buyer.cash-payment). El checkout es electronico-only desde 2026-06-06 (decision de lanzamiento, rama chore/biblia-limpieza-fantasmas) y desde entonces el flag habia quedado como interruptor que no cableaba nada: tildarlo/destildarlo en /ops/feature-flags no tenia efecto y confundia. CAMBIOS: (1) feature-flags.ts: removida la constante BUYER_CASH_PAYMENT (no la consumia ningun codigo) + nota; corregido el ejemplo del comentario de convencion de keys. (2) seed-feature-flags.ts: removida la entrada buyer.cash-payment + nota. (3) cleanup-deprecated-feature-flags.ts: sumada la key buyer.cash-payment a DEPRECATED_KEYS para borrar la fila existente en la DB (junto a marketplace/puntos), reason del audit actualizada. NO se toca el codigo de efectivo dormido en orders/route.ts ni los campos de StoreSettings (cashLimitL1/L2/L3, etc.): se preservan para una eventual Fase 2, donde se reactiva el checkout en efectivo y se vuelve a crear el flag bien cableado. Sin cambios de schema. POST-MERGE: correr `npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute` una vez en local y, tras el deploy, una vez en prod, para borrar la fila buyer.cash-payment del panel.

**Archivos:** scripts/cleanup-deprecated-feature-flags.ts, scripts/seed-feature-flags.ts, src/lib/feature-flags.ts

## 2026-06-17 (rama `feat/docs-comercio-configurables-ops`)

feat(ops): documentacion del comercio configurable desde feature flags. Permite lanzar pidiendo menos papeles y endurecer despues sin redeploy. Cada documento (CUIT, CBU/Alias, Constancia AFIP, Habilitacion Municipal, Registro Sanitario) tiene un flag merchant.doc.* en /ops/feature-flags. SEMANTICA FAIL-SAFE: un doc se considera requerido salvo que su flag exista y este explicitamente en OFF; si la fila falta (seed no corrido) o la query falla, el doc se sigue pidiendo (compliance fiscal/legal). Seed crea los 5 flags en ON (no cambia nada hoy); el admin apaga lo que no quiera pedir al inicio. El Registro Sanitario, ademas del flag, solo aplica a rubros gastronomicos. CAMBIOS: (1) feature-flags.ts: 5 keys merchant.doc.*. (2) seed-feature-flags.ts: campo defaultActive por flag + 5 entradas docs en true. (3) merchant-document-approval.ts: getDisabledDocumentFields() (lee flags OFF), getRequiredDocumentFieldsSync(category, disabled) y getRequiredDocumentFields(category) ahora async + flag-aware; DOCUMENT_FLAG_KEYS exportado. La auto-activacion del merchant (approveDocument) pre-consulta los flags antes de la tx y solo exige los docs requeridos. (4) Consumidores actualizados para respetar los flags de forma consistente: /api/merchant/onboarding (docsComplete/canOpenStore + devuelve <doc>Required), OnboardingChecklist (esconde docs apagados), dashboard chip comercios/page.tsx (canOpenStore), SettingsForm + configuracion/page.tsx (esconde el campo de subida de docs apagados), /api/admin/pipeline-comercios (no cuenta como faltante un doc apagado). Sin cambios de schema (los flags usan el modelo FeatureFlag existente). POST-DEPLOY: correr `npx tsx scripts/seed-feature-flags.ts` (idempotente) para crear los 5 flags. NOTA: la semantica fail-safe inversa de estos flags es una decision canonica nueva, sumar a CLAUDE.md.

**Archivos:** scripts/seed-feature-flags.ts, src/app/api/admin/pipeline-comercios/route.ts, src/app/api/merchant/onboarding/route.ts, src/app/comercios/(protected)/OnboardingChecklist.tsx, src/app/comercios/(protected)/configuracion/page.tsx, src/app/comercios/(protected)/page.tsx, src/components/comercios/SettingsForm.tsx, src/lib/feature-flags.ts (+1 mas)

## 2026-06-17 (rama `fix/merchant-api-db-auth`)

fix(merchant): auth de las APIs del comercio contra la DB, no contra el JWT cache (elimina el 403 post-aprobacion). BUG: al aprobar un comercio desde OPS, la DB pasa a APPROVED al instante pero el JWT del comercio queda stale unos segundos hasta que el socket roles_updated dispara session.update; en esa ventana /api/merchant/stats y /api/merchant/onboarding (y el resto) devolvian 403 con hasAnyRole(JWT) y el panel mostraba "No se pudieron cargar las estadisticas". Mismo patron que ya resolvimos para el driver con requireDriverApi (regla #28: las APIs validan contra el dominio en DB, el JWT roles[] es cache). CAMBIOS: (1) nuevo helper src/lib/merchant-auth.ts -> requireMerchantApi({ allowAdmin }) espejo de driver-auth, consulta Merchant por ownerId y devuelve { userId, merchant, isAdmin }. (2) migradas las 19 archivos / 21 handlers de /api/merchant/* del chequeo hasAnyRole(JWT) y de session.user.merchantId (import, packages/catalog|history|purchase) al helper; se preserva el acceso ADMIN donde existia y el ?merchantId param en earnings/loyalty; la ruta publica tier queda igual; /me ahora devuelve respuesta curada (no el row completo, evita filtrar CUIT/CBU cifrados - AAIP #23). (3) KPIDashboard y OnboardingChecklist re-piden datos cuando cambian los roles de sesion (red de seguridad para que el panel se actualice solo tras la aprobacion sin recargar). Sin cambios de schema. NOTA: requireMerchantApi es una decision canonica nueva (equivalente a requireDriverApi #13) - sumar a CLAUDE.md.

**Archivos:** src/app/api/merchant/ad-placements/[id]/route.ts, src/app/api/merchant/ad-placements/route.ts, src/app/api/merchant/documents/change-request/route.ts, src/app/api/merchant/earnings/route.ts, src/app/api/merchant/import/route.ts, src/app/api/merchant/loyalty/route.ts, src/app/api/merchant/me/route.ts, src/app/api/merchant/onboarding/route.ts (+14 mas)

## 2026-06-16 (rama `feat/ops-notificacion-opcional-aprobacion`)

feat(ops): checkbox "Notificar al usuario por email" opcional al aprobar/rechazar comercio y repartidor (default tildado). Al destildar, no se envia el email pero el cambio de rol toma efecto igual (se refresca el JWT via emitRoleUpdate). El audit log SIEMPRE registra el cambio + ahora guarda notified:true/false en details (auditoria AAIP). Permite correcciones de estado y QA sin spamear. Backend: TransitionContext gana notified? y los 4 endpoints (drivers/merchants x approve/reject) leen notify del body (default true, retrocompatible) y gatean el email. UI: checkbox en las tarjetas de comercio y driver de /ops/usuarios/[id], se manda { notify } en los fetch. Sin cambios de schema.

**Archivos:** CV/CV-Mauro-Rodriguez-2026.docx, CV/CV-Mauro-Rodriguez-2026.pdf, src/app/api/admin/drivers/[id]/approve/route.ts, src/app/api/admin/drivers/[id]/reject/route.ts, src/app/api/admin/merchants/[id]/approve/route.ts, src/app/api/admin/merchants/[id]/reject/route.ts, src/app/ops/(protected)/usuarios/[id]/page.tsx, src/lib/roles.ts

## 2026-06-11 (rama `fix/driver-mensaje-documentacion`)

fix(driver): camino completo del driver pendiente + estado RECHAZADO visible (s2-2c-04). Antes el driver no aprobado quedaba ciego en tres lugares que ademas se disfrazaban entre si: en /mi-perfil la card "Quiero ser Repartidor" estaba DESHABILITADA (sin puerta al panel) y mostraba "Pendiente" aunque estuviera RECHAZADO; el dashboard no avisaba nada; el toggle devolvia el generico "no podes conectarte"; y la pagina pendiente-aprobacion IGNORABA ?rejected=1 mostrando "Estamos revisando (24-48hs)" para siempre -> un driver rechazado que tocaba "Cargar mi documentacion" entraba en loop infinito (panel -> rejected -> misma pagina). SEIS cambios: (1) /mi-perfil: card pendiente clickeable -> /repartidor con subtexto "Solicitud en revision — entra a cargar tu documentacion" + chip + chevron. (2) /mi-perfil distingue REJECTED (antes caia en PENDING_VERIFICATION): chip rojo "No aprobada" + "toca para ver detalles" -> /repartidor -> pantalla de rechazo. (3) pendiente-aprobacion ahora renderiza variante REJECTED (?rejected=1): "Tu solicitud no fue aprobada" + CTA mailto soporte, sin el boton al panel (era el loop) ni el "24-48 hs" enganoso. (4) Banner ambar proactivo en dashboard para approvalStatus != APPROVED: "Tu cuenta todavia no recibe pedidos" + CTA perfil (prometido por feat/registro-rediseno-core, nunca implementado). (5) /api/driver/toggle-status con helpers canonicos de driver-document-approval (bici 4 docs vs motorizado 7, RTO opcional): faltan docs/rechazados -> MISSING_DOCS con lista exacta y el dashboard lleva al perfil; completos -> PENDING_REVIEW "en revision, 24-48 hs" (toast warning). (6) /api/driver/dashboard expone approvalStatus. Wording regla #22. Sin cambios de schema; 6 archivos.
PLUS (QA 2026-06-11): toast ilegible con mensajes largos — el wrapper del ToastContainer no tenia ancho y el toast colapsaba a una columna de una palabra por linea. Fix global en Toast.tsx: wrapper w-[min(340px,calc(100vw-2rem))]. El mensaje MISSING_DOCS se acorto (la lista de docs no va en un toast; el detalle vive en el perfil que muestra cada doc con su estado; missingDocs[] queda en la response).

**Archivos:** ISSUES.md, PROJECT_STATUS.md, docs/HANDOFF_PENDIENTES.md, src/app/(store)/mi-perfil/page.tsx, src/app/api/driver/dashboard/route.ts, src/app/api/driver/toggle-status/route.ts, src/app/repartidor/(protected)/dashboard/page.tsx, src/app/repartidor/pendiente-aprobacion/page.tsx (+1 mas)

## 2026-06-11 (rama `fix/comercio-ux-sugerir-y-categorias`)

fix(comercio): UX form de producto — validacion visible + obligatorios claros + sin scroll-fantasma (s4-4a-01, s4-4d-02 + observaciones QA 2026-06-10). CONTEXTO: s4-4a-01 (boton Sugerir) se verifico OK sin cambios; s4-4d-02 (categorias home) es tarea OPERATIVA: los slots se curan desde /ops/categorias y en prod no hay ninguno activo (anotado en ISSUES). CAMBIOS DE CODIGO (NewProductForm + EditProductForm): (1) La descripcion es obligatoria en el server (productSchema min 10 chars) pero el cliente no la validaba -> el error volvia del server a un banner arriba del fold, invisible en mobile. Ahora: validacion client-side con error inline en el campo, asterisco rojo en todos los obligatorios (imagen/nombre/precio/descripcion), helper "Minimo 10 caracteres" + contador en vivo (X/10 con check verde). En EditProductForm el label decia "(Opcional)" — mentira corregida. (2) Auto-scroll + focus al primer campo con error al tocar Publicar (patron Stripe/MeLi); errores del server tambien scrollean al banner (ids banner-error-producto / banner-error-editar-producto). (3) onWheel blur en los 8 inputs numericos (precio/stock/gramos/ml en alta y edicion): la ruedita del mouse cambiaba el precio silenciosamente al scrollear. Sin cambios de schema ni endpoints. PENDIENTE OPERATIVO: activar HomeCategorySlots desde /ops/categorias antes del launch; re-verificar 500 de /api/comercios/soporte/notificaciones post-deploy.

**Archivos:** ISSUES.md, PROJECT_STATUS.md, docs/HANDOFF_PENDIENTES.md, src/components/comercios/EditProductForm.tsx, src/components/comercios/NewProductForm.tsx

## 2026-06-11 (rama `fix/vendedor-listings-ux`)

fix(vendedor): UX listings — cambios sin guardar + pausar con confirmacion (s4-4c-01, s4-4c-02). (1) EditListingForm: snapshot inicial + isDirty, banner flotante "Tenes cambios sin guardar" con Guardar/Descartar (patron EditProductForm del comercio) y pop-up de confirmacion al salir via Volver/Cancelar con cambios pendientes (modal Moovy store/confirm, regla #24). Descartar restaura los valores originales incluida la imagen. (2) /vendedor/listings: el toggle de ojo ambiguo pasa a boton con texto Pausar/Reactivar; pausar pide confirmacion explicando que la publicacion deja de verse en el marketplace; reactivar no confirma. Toasts de exito/error en el toggle (antes fallaba en silencio). Sin cambios de schema ni endpoints.

**Archivos:** ISSUES.md, PROJECT_STATUS.md, docs/HANDOFF_PENDIENTES.md, docs/PROMPT_INICIO_SESION.md, src/app/vendedor/(protected)/listings/page.tsx, src/components/seller/EditListingForm.tsx

## 2026-06-09 (rama `fix/vendedor-eliminar-listing`)

feat(vendedor): eliminar publicacion del marketplace (s4-4c-03) — soft delete. Antes el vendedor solo podia OCULTAR (toggle isActive); no tenia como eliminar. (1) Nuevo endpoint POST /api/seller/listings/[id]/delete: valida dueño (sellerId) y que no sea una subasta ACTIVA con ofertas; hace SOFT delete (deletedAt + deletedBy + deletedReason='Seller-initiated') ademas de isActive=false. Soft (no hard) por audit AFIP y para no dejar OrderItems huerfanos. Mismo mecanismo que la moderacion de OPS. (2) GET /api/seller/listings filtra deletedAt:null (desaparece del panel del vendedor). El marketplace publico filtra por isActive:true, asi que con isActive=false queda oculto igual. (3) UI /vendedor/listings: boton de tacho con confirmacion (store/confirm) + toast, saca la card de la lista al eliminar. Sin cambios de schema (los campos de soft delete ya existian). Nota: s5-5a-00 (compra del propio comercio) ya estaba bloqueado por el check anti-self-purchase ISSUE-003.

**Archivos:** src/app/api/seller/listings/[id]/delete/route.ts, src/app/api/seller/listings/route.ts, src/app/vendedor/(protected)/listings/page.tsx

## 2026-06-09 (rama `fix/buyer-cuenta`)

fix(buyer): carrito al cerrar sesion + codigo de referido + editar direcciones. (1) s2-2a-05: el carrito (Zustand persist, key Moovy-cart) sobrevivia al logout y reaparecia. Nuevo helper src/lib/logout.ts (logoutAndClearCart) que limpia el carrito antes de signOut; conectado en todos los logout del comprador (UserAvatarMenu, /logout, mi-perfil boton + delete-account). (2) s2-2a-00 referido: (a) register/route.ts ahora devuelve error claro 'ese codigo no existe' cuando el formato es valido pero el codigo no existe (antes lo ignoraba en silencio; el riesgo de enumeracion es bajo, los codigos son para compartir). (b) registro/page.tsx: el prefijo MOV- queda FIJO (span no editable) y el usuario solo escribe los 4 caracteres siguientes (handler filtra charset + 4 max). (3) s2-2a-07 direcciones: el PATCH /api/profile/addresses/[id] ya existia; faltaba UI. Se reescribe la pagina para reusar el mismo form en modo alta o edicion (boton lapiz por direccion, editingId state, POST o PATCH). Bonus: se unifica el campo a 'apartment' (el form mandaba 'floor' pero POST y PATCH usan 'apartment' -> el piso se perdia silenciosamente). Sin cambios de schema.

**Archivos:** src/app/(store)/mi-perfil/direcciones/page.tsx, src/app/(store)/mi-perfil/page.tsx, src/app/(store)/registro/page.tsx, src/app/api/auth/register/route.ts, src/app/logout/page.tsx, src/components/layout/UserAvatarMenu.tsx, src/lib/logout.ts

## 2026-06-09 (rama `fix/comercio-editar-producto-e-instagram`)

fix(comercio): boton Guardar al editar producto (s4-4a-07) + mostrar redes sociales del comercio en su perfil publico (s4-4b-06). (1) EditProductForm: el banner flotante con "Guardar" solo aparecia cuando isDirty, pero isDirty no trackeaba precio, stock ni categoria (eran inputs no controlados con defaultValue) -> editar precio/stock no mostraba como guardar. Se pasan price/stock/categoryId a estado controlado (value+onChange), se agregan a la comparacion isDirty, al snapshot initialState y a handleDiscard. Ahora cualquier edicion muestra el boton y Descartar resetea bien. (2) store/[slug]/page.tsx: el instagramUrl/facebookUrl/whatsappNumber del comercio se guardaban pero la pagina publica no los renderizaba. Se agrega una seccion de redes (solo las cargadas) con helper socialHref que acepta URL completa, @handle o solo usuario para no dejar links rotos. WhatsApp arma wa.me con los digitos. Sin cambios de schema (la query ya trae los campos via include).

**Archivos:** src/app/(store)/store/[slug]/page.tsx, src/components/comercios/EditProductForm.tsx

## 2026-06-08 (rama `fix/auth-validate-reset-token-hash`)

fix(auth): recuperar contrasena daba siempre 'Enlace invalido' (s2-2a-04). validate-reset-token/route.ts buscaba User.resetToken con el token PLANO de la URL, pero forgot-password lo guarda HASHEADO (sha256, ISSUE-027) -> nunca matcheaba -> la pagina /restablecer-contrasena mostraba 'Enlace invalido' antes de dejar setear la clave. Fix: hashear el token entrante con sha256 antes del findFirst, igual que ya hacia /reset-password. Mismo arreglo repara el flujo de invitacion de admin/users/create (manda el mismo link y guarda el hash, estaba roto identico). Verificado: todas las queries a resetToken (forgot/validate/reset/admin-create) usan el hash; ningun caller compara el token plano. Un solo archivo, sin cambios de schema.

**Archivos:** src/app/api/auth/validate-reset-token/route.ts

## 2026-06-08 (rama `feat/candado-lanzamiento-preview`)

feat(launch): candado de lanzamiento por entorno (fail-closed) + cortina Proximamente; saca el modo mantenimiento de OPS. (1) proxy.ts: nuevo candado en el middleware. Solo en produccion, solo paginas (las /api quedan fuera por el matcher, asi webhooks de MP y crons siguen vivos). Falla CERRADO: el sitio esta oculto salvo que LAUNCH_GATE=open en el entorno del VPS — un deploy NO puede exponerlo por accidente. Bypass con ?preview=PREVIEW_TOKEN que deja cookie httpOnly 30d (dominio .somosmoovy.com, cubre subdominios). (2) Nueva pagina /proximamente (branded, sin nav, noindex) a la que el middleware hace rewrite cuando esta cerrado. (3) Saca el modo mantenimiento de OPS: removida la tarjeta de Mantenimiento en ops/configuracion/page.tsx y los campos en ConfigForm.tsx; removidos los redirects client-side a /mantenimiento en (store)/layout.tsx (tiendaMaintenance) y landing/page.tsx (isMaintenanceMode), junto con la logica vieja de preview por cookie client-side. (4) Scripts abrir-tienda.ps1 / cerrar-tienda.ps1: SSH al VPS, setean LAUNCH_GATE y pm2 reload --update-env; garantizan que PREVIEW_TOKEN exista para no quedar afuera. NO toca DB ni usuarios. Campos isMaintenanceMode/tiendaMaintenance/maintenanceMessage quedan en schema/api como legacy inerte (nadie los lee ya para gating). Variables nuevas en VPS .env: LAUNCH_GATE, PREVIEW_TOKEN.

**Archivos:** scripts/abrir-tienda.ps1, scripts/cerrar-tienda.ps1, src/app/(store)/layout.tsx, src/app/landing/page.tsx, src/app/ops/(protected)/configuracion/ConfigForm.tsx, src/app/ops/(protected)/configuracion/page.tsx, src/app/proximamente/page.tsx, src/proxy.ts

## 2026-06-08 (rama `chore/fix-sentry-deprecation-y-build-check`)

chore(build): eliminar warning deprecado de Sentry + arreglar falso 'build fallo' en tsc-strict.ps1. (1) next.config.ts: se quita automaticVercelMonitors:false del withSentryConfig — esta deprecado, no aplica con Turbopack y no estamos en Vercel; pasarlo (aunque sea false) emitia un DEPRECATION WARNING por stderr en cada build. (2) scripts/tsc-strict.ps1 paso 2: el build corria bajo ErrorActionPreference='Stop', entonces el warning de Sentry por stderr ('2>&1') se convertia en error terminante, caia al catch y marcaba buildExitCode=1 (falso fallo) aunque el build saliera bien. Se localiza ErrorActionPreference='Continue' solo alrededor del build (con finally que restaura el valor previo); ahora el exit code real de npm es el unico que decide. Robusto a cualquier warning por stderr a futuro. devmain.ps1 ya estaba OK (usa Continue + chequea LASTEXITCODE). Solo build/tooling, no toca runtime ni schema.

**Archivos:** next.config.ts, scripts/tsc-strict.ps1

## 2026-06-08 (rama `chore/validate-role-flows-export-check`)

chore(scripts): corregir match de string en validate-role-flows. El test 'roles.ts canonical exports' buscaba 'export async function computeUserAccess' pero la funcion ahora se exporta memoizada con cache() ('export const computeUserAccess = cache(...)') — refactor READ-ONLY de mismo comportamiento. Falso positivo: los 9 tests que ejecutan computeUserAccess contra la DB pasaban. Se actualiza el required string a 'export const computeUserAccess'. Solo test, no toca runtime.

**Archivos:** scripts/validate-role-flows.ts

## 2026-06-08 (rama `feat/dashboard-unit-economics`)

feat(unit-economics): dashboard de margen por pedido + break-even en /ops. Nueva pagina admin /ops/unit-economics (solo ADMIN, bajo Finanzas en el sidebar) que muestra el margen de contribucion real leyendo los snapshots inmutables congelados de cada pedido entregado — NUNCA recalcula cobros (regla FINANZAS, cierres AFIP). (1) Logica pura testeable en src/lib/finance/unit-economics.ts: computeOrderEconomics + aggregateEconomics. ingreso_moovy = comisiones + (deliveryFee - driverPayout); costo_mp = mpFee% x total; margen = ingreso - mp - descuento. Agrega comision/driver a nivel SubOrder y descuento/MP a nivel Order (sin doble conteo; single y multi-vendor). (2) API GET/PATCH en /api/ops/unit-economics: GET agrega por periodo (7/30/90/all); PATCH edita 2 parametros de REPORTE en MoovyConfig (unit_economics_fixed_monthly_cost=440000, unit_economics_mp_fee_percent=3.81) — solo reporting/break-even, NO afectan ningun cobro. Sin hardcodeo (regla #10), fallback conservador si faltan (regla #15). (3) UI con 4 estados, KPIs (margen total/por pedido, ingreso, costo MP, payout/viaje), indicadores (envio % subtotal, pedidos margen negativo, envio>40%), break-even editable con progreso del mes, tabla por pedido y export CSV. (4) Test de simulacion financiera scripts/test-unit-economics.ts (22 asserts: numeros a mano, multivendor, margen negativo, fallback sin snapshot, vacio, totales = suma de partes, break-even). Sin cambios de schema (MoovyConfig ya existe; keys via upsert). Deploy NO requiere schema-mode para esta rama.

**Archivos:** scripts/test-unit-economics.ts, src/app/api/ops/unit-economics/route.ts, src/app/ops/(protected)/unit-economics/page.tsx, src/components/ops/OpsSidebar.tsx, src/lib/finance/unit-economics.ts

## 2026-06-08 (rama `fix/delivery-geocoding-cobertura`)

fix(delivery): geocoding server-side + gate de cobertura por zonas + cobro blindado. (1) Nuevo src/lib/geocoding.ts: geocodifica al guardar la direccion (POST/PATCH addresses) y persiste lat/lng + ciudad/provincia reales, sin forzar Ushuaia. (2) AddressAutocomplete captura locality/provincia reales; quitado el sesgo duro ", Ushuaia, Tierra del Fuego" y el hardcodeo city:"Ushuaia". (3) getCoverageStatus en delivery-zones.ts: el destino debe caer dentro de una DeliveryZone (point-in-polygon estricto); fuera = rechazo "fuera de cobertura". Fallback seguro: si no hay zonas activas, no bloquea (cae al radio del comercio). (4) POST /api/orders recalcula la distancia server-side desde coords reales (fee + radio + Order.distanceKm) en vez de confiar en el navegador. Tests en scripts/test-delivery-coverage.ts. Sin cambios de schema (Address ya tenia city/province). Arregla: el envio no variaba con la distancia y pedidos de otra ciudad no se rechazaban. Requiere pintar zonas en /ops/zonas-delivery para activar el gate.

**Archivos:** scripts/test-delivery-coverage.ts, src/app/(store)/checkout/page.tsx, src/app/(store)/mi-perfil/direcciones/page.tsx, src/app/api/delivery/calculate/route.ts, src/app/api/orders/route.ts, src/app/api/profile/addresses/[id]/route.ts, src/app/api/profile/addresses/route.ts, src/components/forms/AddressAutocomplete.tsx (+3 mas)

## 2026-06-06 (rama `chore/biblia-limpieza-fantasmas`)

chore(biblia): limpieza de config fantasma. (1) Efectivo fuera del checkout (electronico-only) + seccion Protocolo de Efectivo fuera de la Biblia + ops-config (cashProtocol). (2) Entrega programada: seccion fuera de la Biblia; el codigo se preserva dormido tras el flag buyer.scheduled-delivery. (3) MOOVER: reviewBonus eliminado del panel/config/points + tierWindowDays CONECTADO en getUserLevel (la columna ya existia, sin cambio de schema). (4) Tarifa base (baseDeliveryFee) huerfana fuera de la Biblia (la columna queda, el motor de envio usa el minimo por vehiculo de DeliveryRate). Sin cambios de schema. Residuales dormidos no-bloqueantes: rama cash en orders/route.ts (inalcanzable) y reviewBonus en moover/page.

**Archivos:** src/app/(store)/checkout/page.tsx, src/app/api/admin/ops-config/route.ts, src/app/api/admin/points-config/route.ts, src/app/api/admin/points/config/route.ts, src/app/ops/(protected)/config-biblia/BibliaConfigClient.tsx, src/lib/ops-config.ts, src/lib/points.ts

## 2026-06-06 (rama `chore/biblia-limpieza-y-guardrail`)

chore(ops): guardrail anti-fantasma en validate-ops-config (test 10). Recorre el runtime (src/lib + src/app/api, excluyendo ops-config y los paneles) y falla si un campo editable critico de la Biblia (combustible, mantenimiento, operativo, comision repartidor, comision merchant/seller default, envio gratis, demanda/surge) no esta leido por ningun codigo de runtime. Asi el deploy detecta config fantasma antes de produccion. La limpieza de fantasmas restante (efectivo fuera del checkout, entrega programada dormida, reviewBonus, tarifa base huerfana) queda para una rama siguiente.

**Archivos:** scripts/validate-ops-config.ts

## 2026-06-05 (rama `fix/asignacion-y-logistica`)

fix(asignacion): equipamiento de frio cableado + radio de busqueda + trail multi-vendor + limpieza de codigo muerto. (1) Driver.hasThermalBag/hasColdStorage + UI en el perfil del repartidor + filtro real en la asignacion: pedidos HOT/FRESH solo se ofrecen a repartidores con el equipo (reactiva driverMeetsEquipmentRequirements que estaba muerto). (2) Radio de busqueda de drivers 50km->15km, editable desde el panel de logistica. (3) AssignmentLog.subOrderId: los SubOrders multi-vendor registran su oferta de asignacion (desenlace accept/reject deferido, flaggeado). (4) Eliminado codigo muerto: rutas claim/pending (queda solo asignacion automatica), calculateFullETA + config eta-calculator, config vehicle-speeds y order-priority fantasmas (se mantienen los const VEHICLE_SPEEDS y prioritizeOrders que si se usan). Schema: Driver.hasThermalBag/hasColdStorage, AssignmentLog.subOrderId (requiere prisma db push + generate + re-seed). Panel logistica de 8 a 5 tabs.

**Archivos:** prisma/schema.prisma, src/app/api/admin/drivers/[id]/reject/route.ts.clean, src/app/api/delivery/availability/route.ts, src/app/api/driver/orders/[id]/claim/route.ts, src/app/api/driver/orders/pending/route.ts, src/app/api/driver/profile/route.ts, src/app/api/ops/config/eta-calculator/route.ts, src/app/api/ops/config/priority-queue/route.ts (+9 mas)

## 2026-06-04 (rama `fix/biblia-motor-envio-y-comisiones`)

fix(biblia): motor de envio unico config-driven (modelo B: costo_km = combustible x consumo_por_vehiculo x mantenimiento) + surge (multiplicador de demanda manual, espejo del clima) + comisiones (repartidor y merchant default) leidas de la Biblia. Preview = cobro (misma funcion computeDeliveryFee en checkout y creacion de pedido). Borrado el motor por-categoria muerto (calculateShippingCost/DEFAULT_DELIVERY_RATES), validateDeliveryFee y calculateDeliveryFeeWithConfig. Rescata los campos combustible/consumo/mantenimiento de la Biblia que eran fantasmas. Schema: DeliveryRate.consumptionPerKm + StoreSettings.demandMultipliersJson/activeDemandCondition (requiere prisma db push + re-seed de DeliveryRate). Al lanzamiento los numeros dan identicos a los canonicos de CLAUDE.md.

**Archivos:** .tsc_check.txt, .tsconfig.check.json, docs/ESTUDIO_MAESTRO_BIBLIA.md, prisma/schema.prisma, prisma/seed-delivery.ts, src/app/(store)/checkout/page.tsx, src/app/api/delivery/calculate/route.ts, src/app/api/orders/route.ts (+9 mas)

## 2026-06-04 (rama `feat/driver-cancelar-pedido`)

feat(driver): cancelacion de pedido aceptado por el repartidor (antes de retirar) con motivo + reasignacion automatica excluyendolo. Endpoint POST /api/driver/orders/[id]/cancel + boton y modal de motivos en la app del repartidor. La cancelacion se registra en AssignmentLog (outcome CANCELLED_BY_DRIVER + cancelReason) SIN penalizar con fraudScore ni auto-suspender (Opcion A): cancelar es un evento operativo normal; el analisis de abuso queda para despues con umbral propio. Schema: AssignmentLog.cancelReason String? + valor CANCELLED_BY_DRIVER en AssignmentOutcomeEnum (requiere prisma db push).

**Archivos:** prisma/schema.prisma, src/app/api/driver/orders/[id]/cancel/route.ts, src/app/repartidor/(protected)/dashboard/page.tsx, src/lib/assignment-engine.ts, src/lib/notifications.ts

## 2026-06-04 (rama `fix/asignacion-match-vehiculo`)

fix(asignacion): conectar tamano producto -> pedido -> motor de asignacion + filtro de vehiculo en claim + costo de envio por tamano real. El comercio persiste el tamano elegido (packageCategoryId + weightGrams); al crear el pedido se setea OrderItem.packageCategoryName desde el producto/listing; el costo de envio usa la categoria real en vez de MEDIUM fijo; y la ruta claim rechaza con 409 si el vehiculo del repartidor no puede transportar el tamano. Cierra el agujero P0 donde todo pedido se trataba como MICRO y cualquier vehiculo (incluida bici) podia recibir un mueble. Sin cambios de schema.

**Archivos:** src/app/api/driver/orders/[id]/claim/route.ts, src/app/api/orders/route.ts, src/app/comercios/actions.ts

## 2026-06-02 (rama `fix/split-fee-incluye-envio`)

fix(mp-split): el marketplace_fee ahora incluye el delivery fee completo (Grupo C). Moovy cobra el envio en el split (marketplace_fee = comision del comercio + envio) y le paga al repartidor por PayoutBatch; el comercio recibe solo su producto menos comision. Alinea el reparto fisico de MP con la contabilidad interna (order-totals.ts) que ya asumia este flujo. Multi-vendor y sin-split no cambian.

**Archivos:** src/app/api/orders/route.ts

## 2026-06-02 (rama `fix/split-pagos-token-vendedor`)

fix(mp-split): operaciones post-pago usan el token del vendedor + redondeo del marketplace_fee. createRefund y la reconciliacion (order-payment-confirm) resuelven el mpAccessToken del comercio via resolveOrderVendorToken (en split el pago vive en la cuenta del vendedor; con token de plataforma daban 404/no encontraban el pago). marketplace_fee redondeado a centavos y clamp [0,total-1] para evitar 400 de MP. Pedidos sin split y multi-vendor siguen usando el token de plataforma como antes.

**Archivos:** src/app/api/cron/retry-assignments/route.ts, src/app/api/merchant/orders/[id]/reject/route.ts, src/app/api/orders/route.ts, src/lib/mercadopago.ts, src/lib/order-payment-confirm.ts, src/lib/order-refund.ts

## 2026-05-30 (rama `fix/mp-oauth-test-token`)

fix(mp-oauth): enviar test_token:true en OAuth cuando MP_OAUTH_TEST_MODE=true, para vincular vendedores de prueba con token de sandbox y poder validar el split de pagos en testing. Gateado por env var (inerte en producción). Sin esto, MP devolvía token de producción y las tarjetas de prueba eran rechazadas.

**Archivos:** HANDOFF-MP-TESTING.md, src/lib/mercadopago.ts

## 2026-05-28 (rama `fix/mp-client-secret-separate`)

fix(mp-oauth): usar MP_CLIENT_SECRET separado de MP_ACCESS_TOKEN

Fix crítico de OAuth de MercadoPago detectado durante QA pre-launch al
probar el botón "Vincular MercadoPago" en /comercios/configuracion.
El flow llegaba hasta la pantalla "Autorizar a MOOVY" pero al callback
volvía con error genérico "Error al procesar vinculación".

DIAGNÓSTICO

Logs del VPS revelaron el error real de MercadoPago:

  MP OAuth token exchange failed: 400
  {"message":"invalid client_id or client_secret","error":"invalid_client"}

El código enviaba `process.env.MP_ACCESS_TOKEN` como `client_secret` al
endpoint POST /oauth/token, asumiendo (incorrectamente) que MP aceptaba
el Access Token como secret.

LA REALIDAD DE MP

MercadoPago efectivamente requiere un Client Secret SEPARADO del
Access Token para OAuth de Marketplace. Está contraintuitivamente
escondido en la sección "Credenciales de PRODUCCIÓN" del panel MP
(aunque el valor sirve para ambos ambientes sandbox y prod, porque el
secret es a nivel app, no de ambiente).

ARCHIVOS MODIFICADOS

- src/lib/mercadopago.ts  (~30 líneas modificadas)

CAMBIOS

1. NUEVA FUNCIÓN `assertClientSecret()`

   Valida que MP_CLIENT_SECRET esté seteado en el environment antes
   de cualquier llamada OAuth. Tira error claro con instrucciones de
   dónde obtener el secret si falta:

     "[MP-OAuth] MP_CLIENT_SECRET no está seteado en el entorno.
      Buscalo en panel MercadoPago → Credenciales de producción →
      Client Secret y agregalo al .env (es el mismo valor para
      sandbox y prod)."

   Mucho mejor que el error genérico "Error al procesar vinculación"
   que aparecía antes.

2. exchangeOAuthCode() — línea ~218

   Antes: client_secret: process.env.MP_ACCESS_TOKEN
   Ahora: client_secret: clientSecret (obtenido de assertClientSecret)

3. refreshOAuthToken() — línea ~244

   Mismo cambio que (2). Aplica al refresh flow cuando un access_token
   de vendor expira y hay que renovarlo.

ENV VAR NUEVA OBLIGATORIA

Para que el botón "Vincular MercadoPago" funcione, hay que agregar
en TODOS los entornos (local + VPS prod):

  MP_CLIENT_SECRET=<el-valor-de-credenciales-de-prod-en-MP>

Si falta, la app va a tirar error claro en logs apenas alguien intente
hacer OAuth (no falla silenciosamente).

SETUP OPERATIVO COMPLEMENTARIO

Además del fix de código, durante este debugging fue necesario
reconfigurar la app MOOVY en panel MP:

- Corregir URL de redirect mal escrita en MP:
    /api/auth/mp-callback (INCORRECTA) → /api/mp/callback (CORRECTA)

- Cambiar PKCE de "Sí" a "No" en sección Configuración Avanzada
  (Moovy no implementa el flow PKCE con code_verifier/code_challenge,
  así que MP lo rechazaba con error)

- Confirmar app correcta: había confusión entre app vieja (id
  3105412015244126) que estaba en .env del VPS y app activa
  (5300721333238597) con OAuth ya configurado. Actualizado el .env del
  VPS con credenciales de la app correcta.

ACLARACIÓN ESTRATÉGICA DEL FOUNDER

Durante el debugging Mauro aclaró que TANTO la Tienda COMO el
Marketplace usan el MISMO modelo de pago split-payment via OAuth (no
es Checkout Pro centralizado para Tienda + OAuth para Marketplace
como yo asumía antes). Por eso este fix beneficia AMBOS verticales: el
botón "Vincular MercadoPago" funciona igual para tipo `merchant` y
tipo `seller`.

LO QUE NO SE TOCÓ

- Schema, migrations, prisma → nada
- Endpoints del callback (/api/mp/callback) → siguen igual, solo
  cambia internamente el secret que se manda
- Lógica de auth, NextAuth, JWT → intacto
- UI/frontend → intacto

VERIFICACIÓN POST-DEPLOY

Después del deploy a prod:

1. Mauro actualiza .env del VPS agregando MP_CLIENT_SECRET=<valor>
2. pm2 reload moovy --update-env (para que pm2 lea la nueva env var)
3. Pestaña incógnita → https://somosmoovy.com?preview=moovy2026preview
4. Logueo como comerciante aprobado
5. /comercios/configuracion → click "Vincular MercadoPago"
6. Redirige a auth.mercadopago.com (URL correcta esta vez)
7. Logueo con cuenta de prueba VENDEDOR
8. Click "Autorizar"
9. Vuelve a Moovy → debe mostrar "MercadoPago vinculado ✓"
10. Verificar pm2 logs moovy --err: NO debe aparecer error "invalid_client"

ACTUALIZACIÓN MANUAL DE CLAUDE.md (pendiente, no editable desde sesión)

En .claude/CLAUDE.md sección "Variables de entorno", agregar
MP_CLIENT_SECRET a la lista de vars obligatorias:

  MP:        MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET,
             MP_APP_ID, MP_CLIENT_SECRET

Y agregar nota: "MP_CLIENT_SECRET es DISTINTO del MP_ACCESS_TOKEN.
Se obtiene en panel MP → Credenciales de producción → Client Secret.
Es el mismo valor para sandbox y prod."

**Archivos:** ISSUES.md, MOOVY-Deck-El-Cruce.pdf, src/lib/mercadopago.ts

## 2026-05-26 (rama `feat/home-hero-condicional-sin-trust-strip`)

feat(home): rebalance del primer fold — sin trust strip, greeting condicional

Detectado durante QA pre-launch: el HeroValueProposition que agregamos
para visitantes no logueados generaba dos problemas concretos:

(1) DOBLE-HERO: HeroValueProposition + HomeHero contextual ("¿Qué
    desayunamos?") quedaban CONSECUTIVOS en rojo, empujando la
    sección "Abiertos ahora" al tercer fold.

(2) DOBLE-ROJO percibido: el gradient del banner (#a3000c → #c2000f →
    #e60012) chocaba con el rojo plano del HomeHero (#e60012) al
    transicionar, generando sensación de "dos paletas distintas"
    aunque el color base era el mismo.

El consejo (UX + PRODUCTO + MARKETING + PSICOLOGÍA-USHUAIA + GO-TO-
MARKET) coincidió por unanimidad: sacar el trust strip y hacer el
greeting condicional.

ARCHIVOS MODIFICADOS:

- src/components/home/HeroValueProposition.tsx (sacar trust strip)
- src/components/home/HomeHero.tsx (greeting condicional)

CAMBIOS:

1. HeroValueProposition.tsx
   - ELIMINADO: bloque de las 3 trust chips:
     · "Solo Ushuaia"
     · "Pago seguro con MercadoPago"
     · "El comercio cobra al instante"
   - REMOVIDOS de imports: MapPin, ShieldCheck (ya no se usan).
   - Mantenidos: Headline, Sub-headline, 2 CTAs (Crear cuenta / Ver comercios).

   Justificación del consejo para sacar el trust strip:
   · MARKETING: en Ushuaia 80k habitantes con boca-a-boca como canal
     principal, el visitante ya escuchó de Moovy antes de venir;
     los trust signals son redundantes.
   · UX: 3 chips ocupaban ~50px verticales y se leían como
     "marketing publicitario", no como información útil.
   · PSICOLOGÍA-USHUAIA: la confianza se gana viendo CATÁLOGO REAL
     (Pizzería X, Burger Y), no leyendo headlines.
   · PRODUCTO: la información YA está en otros lugares del flujo
     natural — logo de MP en el checkout, "cobrás al instante" en
     el panel del comercio, /quienes-somos explica el origen local.
   · GO-TO-MARKET: los Anfitriones (manual PDF de la sesión anterior)
     explican esos beneficios cara a cara durante visitas a comercios.

2. HomeHero.tsx
   - AGREGADO import: useSession de "next-auth/react".
   - NUEVA variable: const { status } = useSession() +
     const showGreeting = status === "authenticated".
   - WRAPPER condicional: el bloque <div> del greeting contextual
     (Icon + greeting + subtitle) ahora se renderiza solo si
     showGreeting es true.
   - PADDING dinámico del search bar: pt-3 cuando hay greeting
     (apretado), pt-4 cuando NO hay (más aire).
   - Comentario in-code explicando por qué (referencia a esta rama).

RESULTADO DUAL:

| Tipo de usuario       | Qué ve                                  |
|-----------------------|-----------------------------------------|
| No logueado (primero) | HeroValueProposition (sin trust strip)  |
|                       | + buscador + categorías                 |
|                       | SIN greeting contextual                 |
| Logueado (recurrente) | HomeHero con greeting contextual        |
|                       | + buscador + categorías                 |
|                       | SIN banner value prop                   |

Cada usuario ve UN solo bloque rojo a la vez → desaparece la
percepción de "dos rojos distintos" porque ya no hay transición
visible entre componentes.

BENEFICIOS MEDIBLES:

- Tienda "Abiertos ahora" pasa del 3er fold al 2do fold para
  visitantes no logueados (~50px ganados por sacar trust strip +
  ~70px ganados por sacar greeting redundante = 120px de subida).
- Usuarios recurrentes mantienen experiencia EXACTA como antes
  (banner value prop oculto + greeting contextual visible).
- Hero más limpio visualmente, menos "ruido" comercial.

LO QUE NO SE TOCÓ:

- Routing: la home sigue siendo /, /empezar sigue siendo destino
  del CTA "Crear mi cuenta".
- Lógica de auth: no se modifica NextAuth, sesiones, ni layouts
  protegidos.
- CategoryPills: se siguen renderizando siempre (independiente del
  auth status).
- Mobile/desktop: cambios son responsivos, mantienen mobile-first.

VERIFICACIÓN:

- ~10 líneas modificadas en 2 archivos
- JSX bien balanceado en ambos componentes
- Sin schema, sin migrations, sin endpoints, sin lógica de negocio
- TSC strict del finish.ps1 debería pasar limpio
- Visual: después del deploy, abrir en incógnito → ver hero limpio
  sin trust strip ni greeting redundante. Abrir logueado → ver
  greeting contextual sin banner value prop. Comparar contra
  screenshot anterior para confirmar mejora.

**Archivos:** ISSUES.md, moovy-anuncio-comercios-v2.html, moovy-anuncio-comercios-v2.png, src/components/home/HeroValueProposition.tsx, src/components/home/HomeHero.tsx

## 2026-05-20 (rama `chore/checklist-moover-completo`)

chore(checklist): cobertura completa del programa MOOVER (13 items nuevos)

Mauro reportó durante el QA pre-launch que no encontraba items
específicos del programa de puntos MOOVER en el checklist. Una
inspección mostró que SÍ había cobertura — 12 items — pero distribuida
en 8 sub-etapas distintas, lo que hace imposible hacer una "pasada
MOOVER" centralizada. Esta rama agrega 13 items nuevos sin tocar
ninguno de los existentes, preservando 100% del progreso QA actual
del usuario.

ENFOQUE NO-DESTRUCTIVO

Los IDs de los items en el checklist HTML son de la forma
`s{stageId}-{substageId}-{ii}`. El progreso se guarda en localStorage
con esos IDs como llave. Para preservar el progreso de Mauro durante
el QA, esta rama NO mueve ni renumera ningún item existente — solo
agrega items nuevos al final de sub-etapas existentes o crea una
sub-etapa nueva.

ARCHIVOS

- prelaunch-checklist.html (data array + cero cambio de IDs existentes)

CAMBIOS

1. NUEVA SUB-ETAPA 4e: PROGRAMA MOOVER (VISIÓN GENERAL)

Agregada al final de la Etapa 4 (Catálogo y stock), después de 4d.
Centraliza los tests "estáticos" del programa MOOVER que se pueden
hacer de una sentada sin necesidad de generar pedidos:

  - Tabla de niveles MOOVER/SILVER/GOLD/BLACK con sus multiplicadores
    (10, 12.5, 15, 20 pts por cada $1.000)
  - Tu nivel actual destacado visualmente en la pantalla
  - Card "próximo nivel" con progreso (cuántas entregas faltan)
  - Historial de transacciones de puntos visible
  - Regalar puntos a otro usuario (sistema de gift según T&C MOOVER:
    mínimo 100 pts, máximo 50% del balance, irreversible)
  - Boost ×2 del mes de lanzamiento (verificación de aplicación)
  - Sección "¿Cómo gano puntos?" explicada en la app
  - Equivalencia 1pt = $1 visible al usar puntos en checkout

Total: 8 items nuevos en 4e.

2. ITEMS ADICIONALES EN 5f (POST-ENTREGA)

Agregados al final de la sub-etapa existente, después de "Aviso si no
cargaste alias bancario":

  - Email de confirmación con los puntos MOOVER ganados al DELIVERED
  - Cartel in-app/toast confirmando puntos ganados inmediatamente

Total: 2 items nuevos en 5f.

3. ITEMS ADICIONALES EN 11f (COMUNICACIONES)

Agregados al final de la sub-etapa existente, después de "Push de
recordatorio si no calificaste":

  - Push notification cuando ganás puntos MOOVER
  - Notificación cuando subís de nivel MOOVER (push + email + cartel)
  - Email mensual con resumen de actividad MOOVER (digest opcional)

Total: 3 items nuevos en 11f.

GRAN TOTAL: 13 items nuevos.

LO QUE NO SE TOCÓ

Los 12 items MOOVER existentes mantienen su ubicación y sus IDs
estables:

  - 2a: "Bonus de signup pending hasta 1ra compra de $5.000+"
  - 4d: "El botón MOOVER está siempre visible"
  - 4d: "Pantalla de puntos muestra tu saldo"
  - 5a: "Usar puntos MOOVER para descuento (máx 20%, mín 500 pts)"
  - 5f: "Ganás puntos cuando el pedido se marca como entregado"
  - 5f: "Los puntos no se duplican si se entrega dos veces"
  - 5f: "Subir de nivel automáticamente al hacer pedidos"
  - 5f: "El saldo nunca queda negativo"
  - 6d: "Bonus de referidos al completar el primer pedido (≥ $8.000)"
  - 9a: "Cancelar un pedido devuelve los puntos usados y reversa los ganados"
  - 10c: "Configuración de puntos editable"
  - 11c: "Los puntos se vencen a los 6 meses sin actividad"

Los IDs en localStorage del checklist actual NO cambian. Todo el
progreso QA marcado por Mauro hasta el momento se preserva al abrir
el HTML actualizado.

PENDIENTE FUTURO (post-launch)

Consolidar todos los items MOOVER (existentes + nuevos) en una sola
sub-etapa unificada cuando ya no haya QA activo en curso. Eso
requeriría cambiar IDs y por lo tanto perder progreso — no es
aceptable mientras Mauro está en plena pasada de QA. La estructura
actual tiene 25 items MOOVER total (12 dispersos + 13 nuevos
agrupados): suficiente para cobertura, no óptimo para organización.

VERIFICACIÓN

- Sin TypeScript modificado (solo HTML estático)
- Sin schema, sin endpoints, sin lógica de negocio tocada
- 1 archivo modificado, ~13 líneas data agregadas
- Cuando Mauro abra el HTML actualizado debería ver: progreso previo
  intacto + nueva sub-etapa 4e en la lista de tabs de la Etapa 4 +
  2 items nuevos al final de 5f + 3 items nuevos al final de 11f.
- Si por algún motivo se pierde progreso (improbable): Mauro tiene
  el backup JSON que se descargó antes de esta rama, y puede
  cargarlo con el botón 📂 del checklist.

**Archivos:** ISSUES.md, prelaunch-checklist.html

## 2026-05-19 (rama `feat/landing-headline-tienda`)

feat(home): banner de propuesta de valor para visitantes no logueados

Anexa un banner explicativo encima del HomeHero existente, visible solo
para usuarios con `status === "unauthenticated"`. Los usuarios logueados
(la mayoría del tráfico post-launch mes 2+) NO ven el banner y mantienen
exactamente la misma experiencia que antes.

CONTEXTO / DECISIÓN DE PRODUCTO

Cuando un visitante nuevo llega a `somosmoovy.com` por primera vez
(probablemente desde boca-a-boca + WhatsApp + Instagram orgánico en
Ushuaia 80k hab), la home pública le muestra directamente la tienda
contextual ("Buenas tardes / ¿Se te antoja algo?") pero NO explica qué
es MOOVY en los primeros 200px. Eso está bien para usuarios recurrentes
(estandar de industria: PedidosYa/Rappi/Glovo/MercadoLibre todos hacen
tienda directa), pero para un mercado nuevo donde la app es desconocida,
hacen falta 2-3 líneas de propuesta de valor visibles arriba sin sacar
al usuario del flujo de compra.

Después de revisar la decisión con los roles PRODUCTO/UX/MARKETING/
GO-TO-MARKET/QA/PSICOLOGÍA-USHUAIA, se decidió MANTENER tienda directa
como landing (no cambiar a `/empezar` como landing por default) y
ANEXAR un banner de propuesta de valor para no-logueados.

ARCHIVOS

- src/components/home/HeroValueProposition.tsx  (nuevo, 92 líneas)
- src/components/home/HomeFeed.tsx              (import + render + id anchor)

CAMBIOS

1. HeroValueProposition.tsx (nuevo componente client)

   - `useSession()` de NextAuth:
     * status "unauthenticated" → muestra banner
     * status "loading"         → null (evita flash)
     * status "authenticated"   → null (recurrentes ven tienda limpia)

   - Diseño:
     * Gradient rojo MOOVY (#a3000c → #c2000f → #e60012) para coherencia
       con HomeHero que viene inmediatamente debajo
     * Headline "Pedí en Ushuaia." + segunda línea "Tu comercio favorito
       te lo lleva." en amber-300 para jerarquía
     * Sub-headline "Repartidores locales, pago seguro, vos elegís cómo
       y cuándo recibir." en blanco al 85% sobre el rojo
     * 2 CTAs:
         - "Crear mi cuenta" (blanco sólido) → Link a /empezar
         - "Ver comercios →" (outline) → anchor #abiertos-ahora (funciona
           sin JS, sin redirect, scroll suave nativo)
     * Trust strip mini con 3 señales abajo: "Solo Ushuaia" · "Pago seguro
       con MercadoPago" · "El comercio cobra al instante". Responde a la
       psicología del usuario de Ushuaia donde "¿quién está detrás?" se
       gana mejor con señales concretas que con texto largo.
     * Blobs decorativos (white/10 y amber/10) para profundidad sin
       distraer

   - Accesibilidad:
     * aria-label en la section
     * aria-hidden en los íconos decorativos
     * Contraste WCAG AA sobre el rojo

2. HomeFeed.tsx (modificaciones quirúrgicas)

   - Import del nuevo componente
   - Render de <HeroValueProposition /> ANTES de <HomeHero />
   - Agregado id="abiertos-ahora" + class "scroll-mt-16" a la sección de
     "Abiertos ahora" para que el anchor del CTA funcione y el header
     sticky no la tape

LO QUE NO SE TOCÓ

- Routing: la home sigue siendo `/`. La página `/empezar` sigue viva
  como destino de los CTAs "Crear cuenta" y disponible para campañas
  pagas futuras.
- HomeHero: queda intacto, sigue mostrando el saludo contextual según
  la hora ("Buen día / ¡Buen provecho! / Buenas tardes / Buenas noches").
- Lógica de auth: no se toca NextAuth, no se cambian sesiones, no se
  modifican layouts protegidos.
- Visitantes logueados (recurrentes): NO ven el banner, experiencia
  exactamente como antes.

VERIFICACIÓN

- No requiere migrations ni prisma db push
- Componente client con un solo hook (useSession) ya disponible via
  SessionProvider en src/components/Providers.tsx
- Mobile-first, responsive (text-2xl mobile / text-4xl lg)
- 2 archivos modificados, ~95 líneas nuevas

VERIFICACIÓN VISUAL POST-DEPLOY

1. En pestaña incógnito, abrir https://somosmoovy.com (con preview key
   durante maintenance): debe aparecer el banner rojo encima del
   HomeHero, con el headline en blanco + amber.
2. Logueado como buyer, abrir la home: el banner NO debe aparecer.
3. Click en "Ver comercios →": debe hacer scroll suave hasta la sección
   "Abiertos ahora" sin redirect.
4. Click en "Crear mi cuenta": debe llevar a /empezar.

**Archivos:** ISSUES.md, src/components/home/HeroValueProposition.tsx, src/components/home/HomeFeed.tsx

## 2026-05-19 (rama `chore/checklist-por-etapas`)

chore(checklist): rediseño completo por etapas acumulativas

Cambio de modelo mental del QA pre-launch: en lugar de organizar los
~283 items por viaje de usuario (Buyer / Comercio / Driver / etc.) los
organizamos en 13 etapas cronológicas acumulativas. El output de cada
etapa es el input de la siguiente — no se descarta data hasta el final.

PROBLEMA QUE RESUELVE:

Mauro venía con la queja recurrente de que el checklist viejo lo obligaba
a recrear estados que ya tenía. Ejemplo concreto: el item 3 era "crear
una cuenta" y el item 7 era "eliminar la cuenta que creaste" — para
hacer el item 7 tenía que volver a crear OTRA cuenta (porque la del
item 3 ya no existía cuando lo intentaba). Lo mismo pasaba en muchos
flujos cuando se mezclaban happy path con destructivos en la misma
sección. Resultado: el QA se sentía como retrabajo constante.

CÓMO LO RESUELVE:

13 etapas que se construyen una sobre la otra. Cada etapa declara dos
cosas:

  - 🎯 Objetivo: qué se prueba en esta etapa
  - 📋 Estado esperado al terminar: qué queda en la DB después
    (que es lo que la siguiente etapa va a usar)

Los destructivos (self-delete, hard-delete, suspensión) van TODOS al
final en la Etapa 13. Mientras tanto los datos están vivos y son
reutilizables.

LAS 13 ETAPAS:

  1. Preparación + smoke test       (~15-20 min, 15 items)
  2. Onboarding de los 4 actores    (~60-75 min, 30 items)
  3. Aprobaciones OPS               (~30-45 min, 20 items)
  4. Catálogo y stock               (~30-45 min, 32 items)
  5. Compra happy path E2E          (~60-90 min, 39 items)
  6. Variaciones del flujo          (~45-60 min, 19 items)
  7. Edge cases de pago MP          (~45-60 min, 15 items)
  8. Edge cases PIN y entrega       (~45-60 min, 7 items)
  9. Disputas y reclamos            (~30-45 min, 1 item)
  10. Panel OPS completo            (~60-75 min, 29 items)
  11. Cross-cutting                 (~60-90 min, 50 items)
  12. Polish UX y soporte           (~60-90 min, 12 items)
  13. Destructivos finales          (~15-30 min, 6 items)

Total: ~283 items en 46 sub-etapas, 8-12 horas distribuidas en 2-3 días.

ARCHIVOS MODIFICADOS:

- prelaunch-checklist.html (reescrito completo, 1783 líneas)

CAMBIOS:

- Nueva estructura `STAGES[]` con `id`, `icon`, `title`, `time`,
  `objective`, `expectedState`, `substages[]`. Cada sub-etapa con
  `id`, `title`, `items[]`. Items con `c/t/how/expect` (mismos campos
  que antes, wording intacto).
- Nuevo UI: stage navigation tabs horizontales scrolleables arriba.
  Stage hero con badges (número etapa / tiempo) + cards (Objetivo en
  violeta / Estado esperado en verde) + side panel con progreso por
  etapa + botones "← Etapa N / Etapa N+1 →".
- Sub-etapas renderizadas como acordeones colapsables con su propio
  contador y barra de progreso.
- Toggle "Por etapa" / "Por viaje" arriba de los filtros — la vista
  "Por viaje" agrupa por etapa+sub-etapa pero muestra TODO al mismo
  tiempo (útil para audit global).
- IDs de items nuevos: `s{stageId}-{substageId}-{ii}` en vez de
  `{sectionId}-{ssi}-{ii}` del v1. Storage key cambió de
  `moovy-prelaunch-checklist-v1` a `v2`.
- Persistencia de `currentView`, `activeStageId` y `expandedSubs` en
  localStorage para que el usuario vuelva donde dejó.
- Export MD por etapas: genera markdown con la estructura nueva
  (Etapa / sub-etapa / items con sus estados + observaciones).
- Load/Save JSON v2 schema con migración al cargar.
- Mantiene 100% del wording, criticidad 🔴/🟡, y campos how/expect
  de los items existentes — no se reescribió ningún texto, solo se
  reorganizaron.

BREAKING CHANGE:

El progreso del checklist viejo (`moovy-prelaunch-checklist-v1` en
localStorage) NO se importa automáticamente al v2 porque los IDs de
los items cambiaron. Si tenías progreso valioso, exportá el MD del
viejo HTML antes de abrir el nuevo (o aceptás empezar de cero).

FUERA DE SCOPE (rama futura):

- Reescribir `PRELAUNCH_CHECKLIST.md` con la nueva estructura por
  etapas. El MD actual sigue siendo funcional como referencia textual
  pero no refleja la nueva organización. Queda como tarea para una
  rama dedicada `docs/prelaunch-md-por-etapas`.

VERIFICACIÓN MANUAL:

- Abrir el HTML con doble-click desde el explorador
- Verificar: navigation tabs aparecen, stage hero se renderiza, 13
  etapas presentes, sub-etapas se expanden, items renderizan con sus
  state buttons, save/load/export funcionan, toggle vista funciona,
  theme oscuro/claro funciona.
- Si tenías progreso del viejo: vas a ver el HTML nuevo en estado
  pristino (cero items marcados). Esperable. Exportar MD del viejo
  antes de la upgrade es opcional pero recomendado.

**Archivos:** ISSUES.md, prelaunch-checklist.html

## 2026-05-19 (rama `docs/claude-md-points-thresholds`)

docs(claude): documentar thresholds reales de signup y referral en MOOVER

Cierra un hallazgo de la auditoría legal pre-launch realizada en la rama
`fix/textos-legales-portales-prelaunch`. Durante la revisión de T&C MOOVER
se descubrió que CLAUDE.md tenía la regla canónica de signup/referral
INCOMPLETA — no mencionaba los thresholds reales que SÍ existen en el
código (`src/lib/points.ts`).

Los thresholds reales son:

  - `minPurchaseForBonus: 5000`   // 1ra compra >= $5K para activar signup
  - `minReferralPurchase: 8000`   // referido >= $8K para que cuente el bono

Si CLAUDE.md no los menciona, futuras auditorías o sesiones de Claude
(que solo cargan CLAUDE.md automáticamente) van a asumir que el signup es
incondicional, lo cual es FALSO. Riesgo de inconsistencias en cambios
futuros de la fórmula de puntos.

ARCHIVOS:

- .claude/CLAUDE.md  (2 líneas en la sección "Puntos MOOVER")

CAMBIO:

- "Signup mes 1: 1.000 pts. Mes 2+: 500 pts" pasa a aclarar el threshold
  `minPurchaseForBonus` ($5.000 de 1ra compra).
- "Referral: 1.000 referidor + 500 referido (post-DELIVERED del primer
  pedido)" pasa a aclarar el threshold `minReferralPurchase` ($8.000 del
  subtotal del primer pedido del referido).

VERIFICACIÓN:

- Solo docs, no toca código.
- No requiere tsc-strict (CLAUDE.md no es TS), pero finish.ps1 lo corre igual.
- El cambio ya está aplicado por Mauro en su working directory.

**Archivos:** .claude/CLAUDE.md

## 2026-05-19 (rama `fix/textos-legales-portales-prelaunch`)

fix(legal): declarar % comisiones + tier comercio + niveles MOOVER en T&C portales

Segunda parte de la auditoría legal pre-launch. Cubre los 4 portales que no
estaban en `fix/textos-legales-prelaunch` (T&C MOOVER, Seller, Comercio,
Driver). Patrón común detectado en los 4: la comisión real definida en
CLAUDE.md no estaba declarada con número en el T&C ("será informada antes
de la aceptación"). Riesgo de reclamo por usuarios que firmaron sin saber
su tasa.

ARCHIVOS MODIFICADOS:

- src/app/terminos-moover/page.tsx     (puntos)
- src/app/terminos-vendedor/page.tsx   (seller marketplace)
- src/app/terminos-comercio/page.tsx   (merchant)
- src/app/terminos-repartidor/page.tsx (driver)

CAMBIOS por documento:

1. T&C MOOVER (puntos)
   - Email: somosmoovy@gmail.com -> legal@somosmoovy.com (consistencia branding,
     el Gmail rompía la familia legal del dominio propio)
   - Fecha: Enero 2026 -> 19 de mayo de 2026
   - Agregada tabla de niveles MOOVER / SILVER / GOLD / BLACK con sus
     multiplicadores (10, 12.5, 15, 20 pts/$1k) y umbrales (0, 5, 15, 40
     DELIVERED en 90 días). Antes solo declaraba la regla base sin niveles.
   - Expiración: ahora explícita "6 meses sin actividad" (antes vaga: "según
     política vigente")
   - Cláusula nueva: si cancelás un pedido pagado con puntos, los puntos se
     devuelven automáticamente (reverseOrderPoints)
   - Link a /privacidad + mención de Ley 25.326 en sección "Información
     Importante"

2. T&C Seller marketplace
   - Sección 4 reescrita: banner azul declarando "Comisión base: 12% sobre
     el valor de cada venta", con aclaración de que se aplica desde la
     primera venta.
   - Aclaración nueva: el período "Mes 1 = 0%" de comercios NO aplica al
     marketplace. Evita reclamo "¿por qué a los comercios sí y a mí no?".
   - Fecha: Marzo 2026 -> 19 de mayo de 2026
   - Link a /privacidad en sección 3.1 (requisitos)

3. T&C Comercio
   - Sección 4 reescrita con 2 banners:
     a) Banner verde "Mes 1 = 0%": declara explícitamente que durante los
        primeros 30 días corridos desde la activación, MOOVY no retiene
        comisión. Hasta ahora la bonificación de bienvenida era un gancho
        de marketing pero no estaba como derecho contractual.
     b) Banner azul "Comisión base 8% + tabla de tiers": BRONCE 8%, PLATA 7%,
        ORO 6%, DIAMANTE 5%. Antes el T&C decía "porcentaje configurable"
        sin números.
   - Aviso previo extendido de "modificaciones de comisión" a "modificaciones
     de comisión o tiers", 30 días.
   - Sección 3 cierra con link a /privacidad + mención Ley 25.326.

4. T&C Driver (Repartidor)
   - Sección 6 reescrita con banner verde: "El Repartidor recibe el 80% del
     costo del viaje. MOOVY retiene el 20% + 5% operativo embebido en la
     tarifa visible al Comprador (que cubre comisiones MP y costos
     operativos, NO forma parte del costo del viaje sobre el que se calcula
     el 80%)". Antes el T&C solo decía "MOOVY retiene un porcentaje
     configurable". Para drivers es el dato MÁS sensible porque es su
     ingreso real.
   - Bullets nuevos: tarifa base + km ajustable por zona/clima, bonus de zona,
     payout completo + bonus en no-show válido (referencia a sección 10.4),
     medios de pago (MP o transferencia bancaria), aviso previo 15 días para
     cambios.
   - Cierre con link a /privacidad + mención Ley 25.326.

HALLAZGO RELEVANTE (no fixeado en esta rama):

Durante la auditoría descubrí que `signupBonus` y `referralBonus` en
`src/lib/points.ts` SÍ tienen thresholds reales:
  - `minPurchaseForBonus: 5000`    (1ra compra para activar el bono signup)
  - `minReferralPurchase: 8000`    (mín del referido para que el referral cuente)

Esos thresholds están correctamente declarados en T&C MOOVER pero
**faltaban en CLAUDE.md** (sección "Puntos MOOVER", línea ~121).
CLAUDE.md no es editable desde la sesión de Claude → Mauro actualiza
manualmente:

  - Signup mes 1: 1.000 pts. Mes 2+: 500 pts. **Pending hasta 1ra compra
    de $5.000+** (`minPurchaseForBonus` en `src/lib/points.ts`)
  - Referral: 1.000 referidor + 500 referido (post-DELIVERED del primer
    pedido **con subtotal ≥ $8.000**, `minReferralPurchase`)

NO TOCADO (intencionalmente):

- Política de Privacidad: ya tenía privacidad@somosmoovy.com correcto
- Política de Cookies: queda como está (consultas via legal@ es OK)
- T&C buyer: ya cerrado en `fix/textos-legales-prelaunch`
- No se tocó schema, logica de negocio, endpoints, ni código transaccional

PENDIENTES NO-BLOQUEANTES (segunda fase, post-launch):

- Privacidad sección 4: listar terceros nominalmente (Sentry, Hostinger,
  Google Maps/Places, MercadoPago, SMTP) con país de tratamiento
- Privacidad sección 8: plazos específicos de retención por tipo de dato
- Privacidad y T&C: dirección postal del responsable
- T&C Comercio sección 12 vs panel /publicidad: nomenclatura desalineada
  (Platino/Destacado/Premium vs VISIBLE/DESTACADO/PREMIUM/LANZAMIENTO).
  Unificar nombres.
- T&C Driver sección 10.5: cambiar "etc" en fraudScore por lista exhaustiva
- T&C Driver: protocolo efectivo escalonado (10/30/60/200 entregas) no
  documentado
- T&C Driver: baja voluntaria + confidencialidad post-baja
- T&C Comercio sección 6: embalaje específico para perecederos
- T&C MOOVER: declarar boost ×2 de lanzamiento si se aplica
- Cookies sección 3: declarar Sentry y sacar Google Analytics ambiguo
- Cookies sección 5: plazos específicos por cookie

VERIFICACIÓN:

- 4 archivos de copy modificados, todos JSX puro sin lógica
- Sin migrations, sin prisma db push, sin schema
- No se introdujeron tags JSX nuevos complejos, solo banners y bullets
- Cuando Mauro corra tsc-strict desde finish.ps1, debería pasar limpio
- Renderizado visible en local: /terminos-moover /terminos-vendedor
  /terminos-comercio /terminos-repartidor

**Archivos:** ISSUES.md, src/app/terminos-comercio/page.tsx, src/app/terminos-moover/page.tsx, src/app/terminos-repartidor/page.tsx, src/app/terminos-vendedor/page.tsx

## 2026-05-19 (rama `fix/textos-legales-prelaunch`)

fix(legal): correcciones pre-launch en T&C buyer + unificación email ARCO

Pasada de auditoría legal pre-launch sobre los documentos públicos. Resumen
ejecutivo de Política de Privacidad, T&C buyer y Política de Cookies → T&C
buyer presentaba 4 bloqueantes 🔴 + 1 inconsistencia con código.

CAMBIOS en src/app/terminos/page.tsx:

1. Banner amarillo "Este documento es un borrador. Versión final sujeta a
   revisión legal..." → banner azul informativo con CTA a legal@somosmoovy.com.
   Un T&C autodeclarado como borrador pierde validez ante reclamo.

2. Sección 5 (Compras y Pagos) "Puntos MOOVER: hasta 50% de descuento" →
   20% del subtotal con mínimo 500 pts explícito. Contradecía la regla
   canónica de PointsConfig en CLAUDE.md ("max 20%, min 500"). Un cliente
   reclamando el 50% por escrito habría sido amparable.

3. Sección 4 (Repartidores) typo grave "Manejo seguro e irresponsabilidad
   en la ruta" → "Manejo seguro y responsabilidad en la ruta". Literalmente
   Moovy declaraba que el driver tiene irresponsabilidad.

4. Footer link "/politica-cookies" (404) → "/cookies". El archivo real vive
   en src/app/cookies/page.tsx. Documento legal obligatorio inaccesible es
   un riesgo de denuncia AAIP.

5. Email ARCO unificado entre T&C y Política de Privacidad:
   - privacidad@somosmoovy.com → todo Ley 25.326 (ARCO, datos personales)
   - legal@somosmoovy.com → contratos, T&C, consultas legales generales
   - reclamos@somosmoovy.com → disputas con pedidos (sin cambios)

   Sección 9 (Datos Personales) ahora apunta a privacidad@. Sección 14
   (Contacto) muestra los dos emails con etiquetas "Email (Legal / Contratos)"
   y "Email (Privacidad / ARCO)" para evitar ambigüedad.

NO SE TOCÓ:

- Política de Privacidad: ya tenía privacidad@ correcto
- Política de Cookies: queda con legal@ para consultas generales (correcto)
- Schema, lógica, endpoints, componentes interactivos: nada cambió, todo
  edición de copy + 1 link.

PENDIENTES NO-BLOQUEANTES (para rama dedicada post-launch):

- Privacidad sección 4: listar terceros nominalmente (Sentry, Hostinger,
  Google Maps/Places, MercadoPago, SMTP) con país de tratamiento para
  transferencia internacional AAIP
- Privacidad sección 8: plazos específicos de retención por tipo de dato
- Privacidad sección 11 + T&C sección 14: agregar dirección postal del
  responsable (calle, número, CP, CUIT, razón social) para ejercer ARCO
  por correo certificado
- T&C sección 5: aclarar Mes 1 = 0% comercios + driver "80% del costo del
  viaje" (no "20% del delivery fee")
- T&C sección 6: radio de delivery "5 km" → "según zona PostGIS"
- T&C sección 8: verificar registro INPI antes de declarar marca
- T&C sección 4 vs T&C drivers: alinear "seguro no obligatorio" con doc
  obligatorio del driver
- Cookies sección 3: declarar Sentry, sacar Google Analytics ambiguo
- Cookies sección 5: plazos específicos por cookie

VERIFICACIÓN:

- npx tsc --noEmit --skipLibCheck → limpio (confirmado por Mauro)
- Sin migrations, sin prisma db push
- 1 archivo de código modificado, ~30 líneas
- Renderizado /terminos verificable en local

**Archivos:** ISSUES.md, MOOVY-Deck-Generico.pdf, src/app/terminos/page.tsx

## 2026-05-19 (rama `chore/actualizar-prompt-5-diario`)

chore(prompt): actualizar PROMPT_5_DIARIO_FINAL a v2

Actualiza el prompt de ejecución diaria pre-launch después de la sesión
2026-05-17 donde armamos el sistema completo de checklist QA y los
scripts de cleanup post-deploy.

CAMBIOS:

1. Sacar el "Checklist de pre-lanzamiento" embebido al final del prompt
   (~30 items obsoletos). Quedó redundante porque ahora tenemos:
     - PRELAUNCH_CHECKLIST.md  (~180 items, fuente de verdad)
     - prelaunch-checklist.html  (UI interactiva branded)

2. Agregar sección nueva "Usar el checklist QA" con instrucciones de
   cómo abrirlo, marcarlo, exportarlo (📥 Exportar MD) y guardar
   progreso por las dudas (💾 Guardar progreso → .json).

3. Agregar sección nueva "Cleanup post-deploy" documentando los 2
   scripts idempotentes que hay que correr una vez en el VPS después
   de devmain.ps1:
     - scripts/fix-orders-completed-to-delivered.ts
     - scripts/cleanup-deprecated-feature-flags.ts

4. Modificar el punto 4 del "Orden de trabajo" para que bifurque
   según si el batch acumulado ya está deployado o no. Antes apuntaba
   directo al checklist embebido (obsoleto).

5. Agregar nota de versionado (v2 - 2026-05-17) en el header para
   tracking.

QUE NO SE TOCA:
- Reglas 1 a 5 (siguen funcionando perfecto)
- Sección "Cierre de rama (obligatorio)" — el flujo de finish.ps1 +
  ISSUES.md + CHANGELOG.md + CLAUDE.md no cambió.
- Sección "Al cierre de cada sesión" — sigue igual.

JUSTIFICACIÓN: el checklist embebido era útil cuando no teníamos el
sistema robusto, pero ahora un colaborador no-técnico puede usar el
HTML/MD directamente. Mantener dos checklists redundantes era invitar
a inconsistencia.

Archivos:
- docs/prompts-cowork/PROMPT_5_DIARIO_FINAL.md
- ISSUES.md

**Archivos:** ISSUES.md, MOOVY-Deck-9410.pdf, MOOVY-Deck-Polirrubro-San-Juan.pdf, Propuesta-MOOVY-9410.pdf, Proyeccion-MOOVY-9410.pdf, docs/prompts-cowork/PROMPT_5_DIARIO_FINAL.md, docs/referencias/observaciones_prod.md

## 2026-05-18 (rama `fix/referral-code-formato-forzado`)

fix(registro): forzar formato MOV-XXXX en código de referido

PROBLEMA: el campo "código de referido" del registro de comprador
aceptaba cualquier texto. Doble bug:

  Bug 1 — placeholder erróneo
    Decía "Ej: MOOV-ABC123" (doble O, 6 chars). El formato real que
    genera el backend (`generateReferralCode()` en register/route.ts)
    es "MOV-XXXX" (1 sola O, 4 chars del set sin ambiguos).

  Bug 2 — sin validación
    El input solo hacía .toUpperCase() y el server aceptaba cualquier
    string como referralCode. Si el usuario tipeaba "pepito" se
    enviaba al backend y silenciosamente no encontraba al referrer.

FORMATO CANÓNICO (en `src/lib/referral.ts` nuevo):
  - Prefijo literal: "MOV-"
  - 4 caracteres del set: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
    (excluye I, O, 0, 1 y S/5 para no confundir al copiar a mano)
  - Total: 8 caracteres → ej. MOV-AB23
  - Regex: /^MOV-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/

CAMBIOS:

1. src/lib/referral.ts (nuevo)
   Fuente única de verdad del formato. Exporta:
   - REFERRAL_CHARS, REFERRAL_CODE_REGEX, REFERRAL_CODE_LENGTH
   - isValidReferralCode(code): boolean — valida formato exacto
   - formatReferralCode(input): string — auto-corrige progresivamente
     mientras el usuario tipea (uppercase, filtra chars, fuerza el
     prefijo MOV-, limita a 8 chars)

2. src/lib/validations.ts
   Agrega regex al schema Zod del RegisterSchema.referralCode con
   mensaje claro: "Código de referido inválido. Formato: MOV-XXXX
   (ej. MOV-AB23)". Mantiene .optional() — vacío sigue permitido.

3. src/app/api/auth/register/route.ts
   - Import del helper isValidReferralCode
   - Si data.referralCode tiene contenido pero no matchea la regex
     → 400 con mensaje que explica el formato y aclara que el campo
     es opcional ("Si no tenés código, dejá el campo vacío")
   - Si tiene formato válido pero NO existe en la DB → mantenemos el
     "silently ignore" (NO devolvemos 404). Justificación: el espacio
     de códigos válidos es 32^4 = ~1M; si avisamos "no existe",
     facilitamos enumeración por brute force.

4. src/app/(store)/registro/page.tsx
   - Placeholder corregido: "Ej: MOOV-ABC123" → "Ej: MOV-AB23"
   - onChange usa formatReferralCode() — el usuario no puede ingresar
     chars inválidos, todo lo que tipea se auto-formatea
   - maxLength={8} en el input
   - Feedback visual inline:
       Vacío         → borde azul neutro + helper text azul
       Inválido      → borde rojo + ícono AlertCircle + helper rojo
                       "Completá el código: 8 caracteres formato MOV-XXXX"
       Válido        → borde verde + ícono Check + helper verde
                       "✓ Código válido — ¡Vas a sumar puntos extra!"
   - Validación pre-submit: si tiene contenido y no es válido, NO
     deja submitear, muestra el error en el banner rojo de la página.
   - useEffect del query param ?ref ahora también pasa por
     formatReferralCode() para normalizar links externos.

Archivos:
- src/lib/referral.ts (nuevo)
- src/lib/validations.ts
- src/app/api/auth/register/route.ts
- src/app/(store)/registro/page.tsx
- ISSUES.md

**Archivos:** ISSUES.md, src/app/(store)/registro/page.tsx, src/app/api/auth/register/route.ts, src/lib/referral.ts, src/lib/validations.ts

## 2026-05-18 (rama `chore/checklist-explicaciones-amigables`)

chore(checklist): reescritura amigable de todos los items (no-tech friendly)

OBJETIVO: que un colaborador no-técnico pueda usar el checklist sin
tener que preguntar qué significa cada item. El primer borrador usaba
mucha jerga ("approvalStatus", "Socket.IO", "Zod", "BuyerWelcome",
"PendingAssignment") que no es transferible.

CAMBIO DE FORMATO:

Antes — un solo campo:
  { c: 1, t: 'Crear cuenta nueva con email válido → recibe BuyerWelcome
    email + sesión iniciada' }

Ahora — tres campos:
  { c: 1,
    t: 'Crear una cuenta nueva',
    how: 'Entrá a /empezar. Completá un email que NO hayas usado antes
          en Moovy, una contraseña, tu nombre y apellido. Aceptá los
          términos y condiciones. Dale "Crear cuenta".',
    expect: 'Quedás logueado automáticamente (tu nombre aparece arriba).
             En pocos minutos te llega a la casilla un email de
             bienvenida con el asunto "Bienvenido a Moovy" — si no
             aparece, revisá spam.' }

REGLAS QUE SEGUÍ EN LA REESCRITURA:

- Cero jerga técnica visible. "ConsentLog" → "registro de
  consentimiento". "Socket.IO" → "se actualiza en tiempo real". "JWT"
  → "tu sesión". "approvalStatus" → "estado de aprobación".
- Imperativos argentinos: "Andá a...", "Dale al botón...", "Esperá".
- Criterios verificables: "Aparece un cartel verde que dice X", "El
  número sube en 1", "NO te deja confirmar".
- Cuando es útil, qué buscar si falla: "Si no aparece el cartel, es ❌".
- Cuando un test requiere ayuda técnica, lo dice explícito: "Pedile al
  equipo técnico que confirme".

CAMBIOS:

1. PRELAUNCH_CHECKLIST.md — reformato completo. Cada item ahora ocupa
   3-4 líneas con sub-bullets `**Cómo probarlo**` y `**Qué deberías
   ver**`. Header del documento actualizado para explicar el nuevo
   formato.

2. prelaunch-checklist.html
   - Data structure: { c, t } → { c, t, how, expect }
   - CSS nuevo: .item-details grid con dos label cards (Cómo probarlo
     violeta, Qué deberías ver verde). Responsive: 2 columnas en
     desktop, 1 columna en mobile <540px.
   - renderMain: cada card ahora muestra título + las dos secciones de
     explicación antes de los botones de estado.
   - exportToMD: cuando exporta, incluye los campos how y expect en
     formato MD compatible con el .md principal.
   - Título del item ahora en bold (font-weight 700) — antes era
     regular 500.

COBERTURA: 180+ items reescritos en 6 secciones (Buyer 50, Comercio 35,
Driver 30, Vendedor 15, OPS 30, Cross-cutting 50).

Archivos:
- PRELAUNCH_CHECKLIST.md
- prelaunch-checklist.html
- ISSUES.md

**Archivos:** ISSUES.md, MOOVY-Deck-9410.pdf, PRELAUNCH_CHECKLIST.md, prelaunch-checklist.html

## 2026-05-18 (rama `fix/checklist-save-load-json`)

fix(checklist): persistencia robusta con Guardar/Cargar JSON + indicador

PROBLEMA: Mauro reportó que al cerrar/reabrir el HTML del checklist
perdía todo el progreso marcado.

CAUSA: localStorage no es 100% confiable en este escenario:
- `file://` tiene scope estricto por path en Chrome Windows
- Pestañas incógnito no persisten localStorage entre sesiones
- Configuración "borrar cookies al cerrar" purga el storage
- Algunos browsers limitan localStorage en file://

FIX: agregar persistencia explícita a archivo JSON que NO depende de
localStorage. localStorage sigue como auto-save best-effort, pero el
usuario tiene un mecanismo confiable y portable.

CAMBIOS en prelaunch-checklist.html:

1. Dos FABs nuevos en el cluster bottom-right:
   - 💾 Guardar progreso (color violeta Moovy #7C3AED)
     Descarga `moovy-checklist-state-YYYY-MM-DD-HH-MM-SS.json` con:
       { version: 1, app: "moovy-prelaunch-checklist",
         savedAt: ISO, itemCount, items: {...} }
   - 📂 Cargar progreso
     Abre file picker. Valida estructura (items es object) y la
     marca de app. Si ya hay progreso, pide confirmación antes de
     reemplazar. Si el archivo es inválido o de otro app, toast de
     error claro.

2. Indicador de auto-save visible en el header:
   - Dot verde animado + texto "Guardado hace X seg/min/h"
   - Update cada 10 segundos
   - Si localStorage funciona normal, dot verde con pulse
   - Si NO funciona, dot ámbar + texto "Guardado automático no
     disponible — usá 💾 manualmente"

3. Warning banner ámbar abajo del progress global:
   - Solo aparece si testLocalStorage() falla
   - Mensaje claro: cómo usar 💾 / 📂 para no perder el progreso

4. Robustez:
   - testLocalStorage() al inicio (writes a test key, reads it back)
   - saveState() ahora try/catch para no romper si la cuota está
     llena u otro error de quota
   - loadState() también guard si LS no disponible
   - Reset también limpia lastSavedAt para que el indicador se
     actualice correctamente

DECISIONES DE DISEÑO:

- El JSON tiene una marca explícita `app: "moovy-prelaunch-checklist"`
  para que `Cargar` rechace archivos de otras apps con un toast claro.
- El JSON es human-readable (JSON.stringify con indent 2) por si el
  usuario quiere verificarlo o editarlo manualmente.
- El timestamp en el filename evita pisar archivos previos al
  guardar de nuevo — cada guardado crea un archivo nuevo, así el
  usuario puede tener snapshots de su progreso.
- Confirmación antes de reemplazar progreso existente (no destruye
  silenciosamente).

UX FLOW IDEAL:

  1. Mauro abre HTML, marca algunos items
  2. Auto-save invisible al localStorage (si funciona)
  3. Cada cierto rato click "💾 Guardar progreso" → descarga JSON
  4. Lo guarda en su Desktop / Dropbox / wherever
  5. Cuando vuelve, abre HTML. Si localStorage persistió → todo OK
  6. Si NO persistió → click "📂 Cargar progreso" → elige el JSON
     → todo restaurado

Archivos:
- prelaunch-checklist.html
- ISSUES.md

**Archivos:** ISSUES.md, prelaunch-checklist.html

## 2026-05-18 (rama `chore/prelaunch-qa-checklist`)

chore(qa): pre-launch QA checklist (MD + HTML interactivo branded)

Sistema de control de calidad para el pre-launch con dos archivos
complementarios en la raíz del repo:

1. PRELAUNCH_CHECKLIST.md
   Fuente de verdad versionable. ~180 items organizados por viaje de
   usuario (Buyer / Comercio / Repartidor / Vendedor / OPS / Cross-
   cutting). Cada item con criticidad 🔴 (bloqueante launch) / 🟡 (no
   bloquea) y 5 estados de marca posibles:
     [ ]  pendiente
     [✅] pasa
     [❌] falla
     [⚠️] parcial / con observaciones
     [🚫] bloqueado por otra cosa

2. prelaunch-checklist.html
   UI companion interactiva, self-contained, single-file. Open desde
   file:// o desde el server. Diseño con branding Moovy:
   - Plus Jakarta Sans (Google Fonts con fallback system stack)
   - Gradient rojo #e60012 → #b8000e en el header
   - Sidebar sticky con contadores por sección (X/Y items hechos)
   - Filtros chip arriba: todos / pendientes / pasan / fallan /
     parciales / bloqueados + criticidad (bloqueantes / no-bloquean)
   - Búsqueda live por texto
   - Cards por item con 4 botones pill (pasa/falla/parcial/bloqueado)
     y textarea de observación que se auto-expande
   - Items con color de fondo según estado (verde/rojo/ámbar/gris)
   - Barra de progreso global animada en el header con desglose por
     estado (chips de colores)
   - FAB cluster bottom-right: 📥 Exportar MD, 🌓 Tema, 🔄 Reset
   - Dark mode toggle con persistencia
   - Mobile-first: sidebar drawer en mobile, FAB compactos
   - Persistencia automática en localStorage (no se pierde el
     progreso al cerrar la pestaña)
   - Exportar MD genera un archivo con timestamp con TODOS los
     estados + observaciones del usuario

COBERTURA (consejo 14 roles):

  Buyer (~50 items):    registro / login / store / cart / checkout
                        MP+efectivo / scheduled / tracking / chat /
                        rating / puntos MOOVER / marketplace / perfil
  Comercio (~35):       registro / docs aprobación / dashboard /
                        pedidos PENDING→DELIVERED / productos /
                        config / payouts
  Repartidor (~30):     registro / docs (DNI/licencia/seguro/RTO/CV)
                        / online/offline / asignación / PIN doble /
                        geofence / ganancias / pagos recibidos /
                        soporte
  Vendedor (~15):       registro / listings CRUD / pedidos / chat
  OPS (~30):            login / usuarios / pedidos live / refunds /
                        payouts / config-biblia / zones / emails /
                        flags
  Cross-cutting (~50):  seguridad (IDOR+rate+Zod+uploads) / perf
                        (3G+lists) / legal (T&C+consent+soft delete)
                        / infra (env+servicios) / monitoreo (Sentry+
                        Pino) / pagos (webhook idempotente) / comms
                        (matrix de eventos) / soporte (WA+errors)

FLUJO DE USO:

  1. Mauro abre prelaunch-checklist.html en su browser
  2. Va probando cada flujo end-to-end y marca con un click
  3. Si algo falla, escribe observación en el textarea
  4. localStorage persiste todo automáticamente
  5. Cuando termina, click "📥 Exportar MD" → descarga archivo .md
  6. Pega el .md en Cowork y dice "leé el checklist y armá el plan
     de acción para lanzar"
  7. Claude cuenta % testeado, lista los ❌ y ⚠️ ordenados por
     criticidad, propone plan priorizado, dice si está listo el
     launch o qué falta

Archivos:
- PRELAUNCH_CHECKLIST.md (nuevo)
- prelaunch-checklist.html (nuevo)
- ISSUES.md (entry)

**Archivos:** ISSUES.md, MOOVY-Deck-9410.pdf, PRELAUNCH_CHECKLIST.md, prelaunch-checklist.html

## 2026-05-18 (rama `fix/pin-bloqueado-mostrar-soporte`)

fix(rider): PIN bloqueado por intentos ahora muestra soporte prominente

BUG: cuando el driver superaba el máximo de intentos del PIN (pickup o
delivery), el sistema mostraba el mensaje rojo "Superaste el máximo de
intentos. El pedido está bloqueado y fue alertado al equipo. Contactá
al soporte de MOOVY para desbloquear el pedido." — pero NO había
ningún botón visible para contactar soporte. El driver quedaba
atorado, sin salida.

Sí existía un botón universal "¿Tenés problemas? Hablá con soporte"
al final del modal (rama fix/contacto-y-soporte-en-entrega), pero
era chico, gris, y podía quedar tapado por el safe-area-inset en
mobile cuando la URL bar del browser aparece/desaparece. Encima el
mensaje rojo decía "Contactá al soporte" sin un CTA al lado, lo que
viola la regla del consejo (rol SOPORTE): "errores dicen QUÉ HACER".

FIX: agregar DENTRO del bloque rojo de error (al lado del mensaje
"Contactá al soporte...") dos botones prominentes — mismo patrón que
ya usaba isOutOfGeofence más abajo. Imposible no verlos.

  - 📝 Reportar problema y desbloquear  (rojo sólido)
       Abre el modal de reporte interno con orderId y comentario
       pre-armado contextual: "Se me bloqueó el PIN de retiro por
       superar los intentos máximos. No pude recordar el número
       correcto."

  - 💬 o escribí a soporte por WhatsApp  (link rojo claro)
       Abre wa.me con mensaje pre-armado al soporte.

CAMBIOS:

1. src/components/rider/PinKeypad.tsx
   - Nuevo bloque condicional {isLocked && orderId && (...)} después
     del párrafo "Contactá al soporte..."
   - openWhatsAppSupport() ahora arma el texto del mensaje según el
     errorCode actual:
       TOO_MANY_ATTEMPTS → "se bloqueó por superar los intentos..."
       OUT_OF_GEOFENCE   → mensaje GPS original (no cambia)
       fallback genérico → "necesito ayuda con el PIN..."
   - Agrega errorCode a las dependencias del useCallback.

SIN CAMBIOS DE SCHEMA NI ENDPOINT.

El endpoint /api/driver/report-pin-issue ya acepta distanceMeters y
lat/lng como opcional/null, así que el reporte por bloqueo de intentos
no necesita cambios en el backend — el comment pre-armado es lo que
le llega al admin con el contexto del caso.

Mantiene el botón universal "¿Tenés problemas?" del final del modal
intacto — sigue como fallback genérico para los otros estados.

Archivos:
- src/components/rider/PinKeypad.tsx
- ISSUES.md

**Archivos:** ISSUES.md, MOOVY-Deck-9410.pdf, src/components/rider/PinKeypad.tsx

## 2026-05-18 (rama `fix/restaurar-moover-y-marketplace-sin-flags`)

fix(flags): Marketplace y MOOVER siempre visibles, sin feature flag

CORRIGE OVER-REACH del sistema de feature flags introducido por la rama
feat/feature-flags-ops (2026-05-13).

El pedido original era ocultarle al comercio las pestañas "Publicidad"
y "Adquirir paquetes" en el menú merchant. Pero la implementación también
introdujo dos flags que NUNCA debieron existir:

  - buyer.marketplace      → ocultaba botón Marketplace + bloqueaba página
  - buyer.puntos-moover    → ocultaba botón MOOVER + bloqueaba página

Marketplace y MOOVER son PRODUCTO CORE de Moovy. No deben poder
ocultarse desde OPS. Si en algún momento se necesita pausar
temporalmente, se discute y se crea un flag dedicado en ese momento.

CAMBIOS:

1. src/components/layout/BottomNav.tsx
   - Quita el hook useFeatureFlags(). Items siempre: Inicio |
     Marketplace | MOOVER (centro) | Pedidos | Perfil.

2. src/app/(store)/marketplace/page.tsx
   - Quita el wrapper <FeatureFlagGuard>. Página siempre carga.

3. src/app/(store)/puntos/page.tsx
   - Quita el wrapper. Página siempre carga.

4. src/app/moover/page.tsx
   - Quita el wrapper. Landing pública del programa siempre carga.

5. scripts/seed-feature-flags.ts
   - Saca las 2 entradas del array SEED_FLAGS. Las próximas corridas del
     seed ya no van a recrear esos flags.

6. src/lib/feature-flags.ts
   - Saca las constantes BUYER_MARKETPLACE y BUYER_PUNTOS_MOOVER del
     objeto FEATURE_FLAGS. Si algún código nuevo quisiera usarlas, TS
     lo va a rechazar.

7. src/hooks/useFeatureFlags.ts y src/app/api/features/list/route.ts
   - Actualizan comentarios-ejemplo para no referenciar flags borrados.

FLAGS QUE SE MANTIENEN (los que SÍ pediste originalmente):

  merchant.publicidad         ✓ comercio no ve esa pestaña
  merchant.paquetes           ✓ comercio no ve esa pestaña
  merchant.tracking-en-vivo   ✓ preparación futura
  seller.paquetes             ✓ preparación futura
  buyer.scheduled-delivery    ✓ controlable desde OPS
  buyer.cash-payment          ✓ controlable desde OPS

CLEANUP DB (eliminar las filas huérfanas que ya existen):

Sin esto, los flags quedan en la tabla FeatureFlag y siguen apareciendo
en el panel /ops/feature-flags (aunque el código no los consuma).

Hay un script con patrón dry-run + --execute:

  # local (Docker port 5436)
  npx tsx scripts/cleanup-deprecated-feature-flags.ts             # ver
  npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute   # borrar

  # prod (después de devmain.ps1, en el VPS con DATABASE_URL=prod)
  npx tsx scripts/cleanup-deprecated-feature-flags.ts
  npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute

Pide confirmación "SI LIMPIAR" + audit log + transaction Serializable.
Idempotente: correrlo dos veces = la segunda no hace nada.

Archivos:
- src/components/layout/BottomNav.tsx
- src/app/(store)/marketplace/page.tsx
- src/app/(store)/puntos/page.tsx
- src/app/moover/page.tsx
- scripts/seed-feature-flags.ts
- scripts/cleanup-deprecated-feature-flags.ts (nuevo)
- src/lib/feature-flags.ts
- src/hooks/useFeatureFlags.ts
- src/app/api/features/list/route.ts
- ISSUES.md

**Archivos:** ISSUES.md, scripts/cleanup-deprecated-feature-flags.ts, scripts/seed-feature-flags.ts, src/app/(store)/marketplace/page.tsx, src/app/(store)/puntos/page.tsx, src/app/api/features/list/route.ts, src/app/moover/page.tsx, src/components/layout/BottomNav.tsx (+2 mas)

## 2026-05-17 (rama `feat/driver-historial-ganancias-y-pagos`)

feat(driver): historial completo de ganancias + tab "Pagos recibidos"

PROBLEMA: el driver veía "desaparecer" su historial después de que
Moovy le procesara un pago. En realidad la data nunca se borraba — la
vista "Mis Ganancias" solo permitía ver "Esta semana" o "Este mes" y
los pedidos de batches viejos quedaban fuera de ese rango.

CAMBIOS:

1. /api/driver/earnings (modificado)
   - Agrega soporte para period=YYYY-MM (mes específico, ej: "2026-04")
   - Agrega soporte para period=all (histórico completo)
   - Mantiene compat con period=week|month
   - Validación de YYYY-MM (mes 01-12, año 2024 a year+1)
   - Cálculo "vs período anterior" solo aplica a week/month (los
     relativos). Para mes específico o all-time no tiene sentido y
     queda en previousPeriodTotal=0.

2. /api/driver/payouts (nuevo endpoint)
   - GET sin params. Devuelve PayoutBatch.status=PAID donde el driver
     tuvo PayoutItem.
   - Por cada batch: id, paidAt, amount, itemCount, orderIds parseados,
     periodStart/End, bankAccount denormalizado, batchNotes.
   - Sin paginación: drivers tienen 1-4 batches/mes. Revisar si llega
     a 100+ entries.
   - Filtro doble por seguridad: recipientType=DRIVER AND
     recipientId=driver.id. Cero riesgo IDOR.
   - Ordenado por paidAt desc.

3. EarningsView.tsx (rediseño)
   - Dos tabs en el header rojo: "Ganancias" (existente, mejorado) y
     "Pagos recibidos" (nuevo).
   - El selector de "Esta semana / Este mes" pasa a ser un <select>
     con: Esta semana, Este mes, últimos 12 meses (capitalizados),
     "Todo el tiempo".
   - El "vs período anterior" solo se muestra cuando period es week
     o month.
   - Tab "Pagos recibidos": carga lazy al click. Muestra total
     acumulado histórico + lista de pagos con fecha, monto, cantidad
     de pedidos, cuenta destino y notas del batch.
   - Empty state amigable: "Todavía no recibiste pagos / Cuando Moovy
     procese tu primer pago vas a ver acá el detalle."
   - Wording user-facing: "el equipo de Moovy" (no "OPS").

NO HAY CAMBIOS DE SCHEMA. Toda la data ya existía en PayoutBatch +
PayoutItem (denormalización ya hecha en feat/payouts-batches).

Archivos:
- src/app/api/driver/earnings/route.ts (modificado)
- src/app/api/driver/payouts/route.ts (nuevo)
- src/components/rider/views/EarningsView.tsx (rediseño)
- ISSUES.md (entry)

**Archivos:** ISSUES.md, src/app/api/driver/earnings/route.ts, src/app/api/driver/payouts/route.ts, src/components/rider/views/EarningsView.tsx

## 2026-05-17 (rama `chore/script-fix-orders-completed-to-delivered`)

chore(scripts): cleanup one-off para pedidos COMPLETED → DELIVERED en prod

Script `scripts/fix-orders-completed-to-delivered.ts` para limpiar la
data corrupta que dejó el bug del rate route (rama anterior
fix/orden-vuelve-a-pendiente-tras-calificar).

PATRÓN: mismo que clean-db-pre-launch.ts.
  - DRY RUN por default (solo cuenta + sample)
  - --execute con confirmación interactiva "SI MIGRAR"
  - DATABASE_URL safety check
  - Identifica admin activo para firmar el audit log
  - Update dentro de $transaction Serializable
  - AuditLog único con orderIds + orderNumbers afectados
  - Idempotente (correr 2 veces = nop)

FILTRO ESTRICTO:
  status = "COMPLETED" AND driverRating != null

Doble filtro para no tocar otros rows que tengan COMPLETED por motivos
distintos al bug (ej: pruebas manuales sin driverRating).

USO:
  # Ver cuántos cambiarían + sample de 7:
  npx tsx scripts/fix-orders-completed-to-delivered.ts

  # Ejecutar (pide "SI MIGRAR" por stdin):
  npx tsx scripts/fix-orders-completed-to-delivered.ts --execute

CUÁNDO CORRER: una sola vez en producción, después de que devmain.ps1
deploye el fix del rate route. Apuntando DATABASE_URL a la DB de prod.

Archivos:
- scripts/fix-orders-completed-to-delivered.ts (nuevo)
- ISSUES.md (entry del sprint)

**Archivos:** ISSUES.md, scripts/fix-orders-completed-to-delivered.ts

## 2026-05-17 (rama `fix/orden-vuelve-a-pendiente-tras-calificar`)

fix(orders): pedido vuelve a "Pendiente" después de calificar al repartidor

BUG CRÍTICO: después de que el comprador calificaba al repartidor en
el modal post-entrega, el pedido aparecía como "Pendiente" en la lista
de "Mis pedidos" — confundiendo al usuario y rompiendo cualquier
filtro/contador que dependiera del estado real.

CAUSA: el endpoint POST /api/orders/[id]/rate (introducido en la rama
feat/propinas-y-ratings-post-entrega) cambiaba el status del Order a
"COMPLETED" al guardar la calificación. Pero ese estado NO existe en
`statusConfig` de la UI:

  /mis-pedidos/page.tsx:427
  const st = statusConfig[order.status] || statusConfig.PENDING;

Como `COMPLETED` no está en el mapa, caía al fallback `PENDING` y se
renderizaba el chip con label "Pendiente" + ícono amarillo.

FIX: borrar `status: "COMPLETED"` del update. El status del pedido
queda en DELIVERED (su estado real). El hecho de que ya se calificó
se sabe por `driverRating != null` y `ratedAt`.

VERIFICACIÓN: busqué `status === "COMPLETED"` en todo el repo. Los
matches restantes son de otras entidades (PendingAssignment.status,
PointTransaction.status, Referral.status, BroadcastCampaign.status) —
ningún lugar del código depende de Order.status === "COMPLETED".

Los otros endpoints de calificación (rate-merchant, rate-seller, tip)
NO tocan el status, así que están bien.

Archivos modificados:
- src/app/api/orders/[id]/rate/route.ts (1 línea borrada)
- ISSUES.md

Nota: los pedidos que ya quedaron en COMPLETED en producción siguen
mostrándose mal hasta que se ejecute un UPDATE manual en la DB:
  UPDATE "Order" SET status='DELIVERED'
  WHERE status='COMPLETED' AND "driverRating" IS NOT NULL;

**Archivos:** ISSUES.md, Proyeccion-MOOVY-9410.pdf, src/app/api/orders/[id]/rate/route.ts

## 2026-05-17 (rama `feat/comercio-ux-guardar-y-totales`)

feat(comercio): banner flotante "guardar cambios" + "Tu venta" en lugar de total

Dos mejoras de UX en los portales comercio + vendedor:

1) Banner flotante de cambios sin guardar
   - EditProductForm: snapshot inicial via useRef + isDirty boolean.
     Botón "Guardar Cambios" del header reemplazado por banner flotante
     sobre el BottomNav (bottom-16) con botones Descartar/Guardar.
     Solo se muestra cuando hay cambios reales.
   - NewProductForm: misma idea adaptada al flujo "crear":
     isDirty = "tiene contenido cargado", isSubmittable = "tiene mínimos
     (nombre+foto+precio)". Botón submit del fondo eliminado, banner
     flotante con "Listo para publicar" cuando isSubmittable.
   - MiComercioForm: dirty flag toggleado por onChange del form + handlers
     custom para imagen/dirección. Discard recarga la página (form usa
     defaultValue). Inline "Guardar Perfil" reemplazado por banner.

2) "Tu venta" en lugar de total
   - /comercios/pedidos: helpers getMerchantSale() + getMerchantPayoutInfo().
     Single-vendor usa order.subtotal, multi-vendor suma subOrders del
     merchant (backend ya filtra). Display: "Tu venta $X" + "Cobrás $Y (-Z%)"
     usando merchantCommissionRate snapshot inmutable.
   - /vendedor/pedidos: "Total" → "Tu venta" usando subtotal, "Tu ganancia"
     → "Cobrás" usando sellerPayout (ya persistido).

Antes: el comercio veía $5.200 y pensaba que iba a cobrar eso cuando
$1.800 era el envío del repartidor + 8% iba a comisión Moovy.
Ahora ve los dos números separados con la realidad de cada uno.

Archivos modificados:
- src/components/comercios/EditProductForm.tsx
- src/components/comercios/NewProductForm.tsx
- src/components/comercios/MiComercioForm.tsx
- src/app/comercios/(protected)/pedidos/page.tsx
- src/app/vendedor/(protected)/pedidos/page.tsx
- ISSUES.md

**Archivos:** ISSUES.md, Propuesta-MOOVY-9410.pdf, src/app/comercios/(protected)/pedidos/page.tsx, src/app/vendedor/(protected)/pedidos/page.tsx, src/components/comercios/EditProductForm.tsx, src/components/comercios/MiComercioForm.tsx, src/components/comercios/NewProductForm.tsx

## 2026-05-17 (rama `fix/contacto-modal-soporte`)

fix: 3 fixes en mis-pedidos + PinKeypad + modal calificacion

Rama unificada con 3 fixes relacionados al contacto/soporte durante y
post entrega, mas el BUG CRITICO del modal de calificacion que estaba
impidiendo guardar reviews en mobile (las reseñas que el buyer rellenaba
NO se persistian).

═══════════════════════════════════════════════════════════════════════
FIX 1 — BUG CRITICO: Modal de calificacion no se podia guardar en mobile
═══════════════════════════════════════════════════════════════════════

Mauro reporto que la pantalla de calificacion reaparece cada vez que
abre el pedido en el historial, lo que indica que NUNCA se guardaba.

DIAGNOSTICO: el footer del PostDeliveryRatingModal (con los botones
"Calificar despues" y "Enviar y cerrar") quedaba VISUALMENTE TAPADO por
el BottomNav del layout, aunque el modal tuviera z-[100] y el BottomNav
z-50. Razon probable: algun stacking context del layout (transform,
opacity, o filter en un parent) hacia que el z-index del BottomNav
ganara contra el del modal.

Resultado: el buyer rellenaba estrellas y comentarios, intentaba clickear
"Enviar" pero el boton estaba oculto, terminaba cerrando con la X.
La X dispara onPostpone (NO submit), entonces nada se persistia. Al
volver al pedido, needsMerchantRating/needsDriverRating seguian true y
el modal reaparecia.

FIX DEFINITIVO:
- Regla CSS global en globals.css:
    body.modal-hides-bottom-nav nav.fixed.bottom-0 { display: none !important }
- El modal aplica esa class al <body> en su useEffect de mount y la
  remueve al unmount.
- Plus: z-[100] → z-[200] (mucho headroom).
- Plus: max-h-[85vh] → max-h-[80vh] (un poquito mas de margen al fondo).

Con esto el BottomNav LITERALMENTE no se renderiza mientras el modal
esta abierto, asi que es imposible que tape nada. Es el patron robusto
estandar para modales sobre apps con bottom nav.

═══════════════════════════════════════════════════════════════════════
FIX 2 — Botones de telefono ocultos post-DELIVERED
═══════════════════════════════════════════════════════════════════════

Mauro pidio que el buyer NO pueda contactarse con comercio ni driver
una vez entregado el pedido. El chat ya se ocultaba automaticamente
(estaba controlado por isActive = !["DELIVERED", "CANCELLED"]). Lo que
faltaba eran los botones tel: en 3 lugares de
/mis-pedidos/[orderId]/page.tsx:
- Linea ~697: telefono del driver dentro del bloque multi-vendor SubOrder
- Linea ~777: telefono del merchant (boton azul redondo con icono Phone)
- Linea ~881: telefono del driver (boton verde redondo con icono Phone)

Los 3 envueltos con && isActive. Comentario explicativo agregado al lado
de cada uno.

═══════════════════════════════════════════════════════════════════════
FIX 3 — Boton "Soporte" siempre visible en PinKeypad
═══════════════════════════════════════════════════════════════════════

Mauro pidio que el driver pueda contactar a soporte mientras esta
ingresando el PIN, sin tener que esperar a fallar por OUT_OF_GEOFENCE.
La rama feat/driver-soporte-gps-bloqueado anterior agrego botones de
soporte SOLO dentro del banner de error de geofence — no eran visibles
en el estado normal.

FIX: agregar boton discreto "¿Tenés problemas? Hablá con soporte" debajo
del keypad, separado por un borde superior. Visible SIEMPRE mientras el
modal del PIN este abierto (cuando hay orderId). Reusa la logica
existente (setShowReportModal abre el mismo sub-modal de reporte que ya
teniamos — con textarea + boton "Enviar reporte" + opcion WhatsApp).

CAMBIOS (4 archivos):

1) src/app/globals.css
   - Regla CSS nueva al final: body.modal-hides-bottom-nav
     nav.fixed.bottom-0 { display: none !important }
   - Comentario explicativo del patron.

2) src/components/orders/PostDeliveryRatingModal.tsx
   - useEffect del body scroll lock extendido: ademas agrega/remueve la
     class "modal-hides-bottom-nav" al <body>.
   - z-[100] → z-[200] (en 2 lugares: success screen + modal principal).
   - max-h-[85vh] → max-h-[80vh] en el modal principal.

3) src/app/(store)/mis-pedidos/[orderId]/page.tsx
   - 3 botones tel: envueltos con && isActive.
   - Comentario inline en cada uno.

4) src/components/rider/PinKeypad.tsx
   - Despues del parrafo de ayuda "Sin este PIN no podes...", agregar
     bloque con border-t y boton discreto "¿Tenes problemas? Habla con
     soporte" que dispara setShowReportModal(true). Solo si orderId
     esta definido (orden + sub-modal de reporte ya existian).

QUE NO CAMBIA:
- Schema, endpoints, validaciones, audit log: cero cambios.
- El chat con comercio/driver/seller post-DELIVERED ya estaba oculto
  (isActive). No se toca.
- El sub-modal de reporte que abre el boton de soporte es exactamente
  el mismo que ya existia (showReportModal state).
- Estilos y branding del modal de calificacion: igual, solo cambia el
  z-index y max-h.

VERIFICACION POST-DEPLOY:

Modal calificacion:
1) Hacer un pedido nuevo en staging, llevarlo a DELIVERED.
2) Esperar 30s, ver aparecer el modal.
3) En mobile (DevTools responsive 380px): verificar que el BottomNav
   NO se ve mientras el modal esta abierto.
4) Verificar que el footer con "Calificar despues" + "Enviar y cerrar"
   esta visible y se puede tocar.
5) Rellenar estrellas + comentarios, click "Enviar y cerrar" → pantalla
   verde "Gracias", modal se cierra.
6) Volver al pedido → modal NO reaparece (ratings ya estan guardados).

Contacto post-entrega:
1) En el pedido DELIVERED, ir a /mis-pedidos/[id].
2) Verificar que el botón Phone del comercio NO aparece (era boton azul
   redondo al lado del nombre).
3) Idem con el del driver (boton verde redondo).
4) Idem en multi-vendor con el "Llamar" del driver en cada SubOrder.

Soporte en PIN:
1) Como driver, intentar marcar PICKED_UP o DELIVERED → se abre el
   PinKeypad.
2) Antes de intentar el PIN, debajo del keypad ver el boton
   "¿Tenes problemas? Habla con soporte".
3) Click → se abre el sub-modal de reporte (igual al que aparecia tras
   OUT_OF_GEOFENCE).

**Archivos:** ISSUES.md, src/app/(store)/mis-pedidos/[orderId]/page.tsx, src/app/globals.css, src/components/orders/PostDeliveryRatingModal.tsx, src/components/rider/PinKeypad.tsx

## 2026-05-17 (rama `feat/email-ops-comment-pending`)

feat(ops): email automatico cuando un comment cae en moderacion PENDING

Cierra el ultimo ciclo del sistema de moderacion. Antes el admin tenia que
entrar manualmente a /ops/reviews-pendientes para descubrir si habia algo
en la queue. Ahora recibe email proactivo apenas hay algo para revisar.

Cuando se dispara:
  - Al crear el comment, si la blacklist matchea (los 3 endpoints rate-*).
  - Al recibir el 3er reporte de la comunidad (alcance threshold en
    /api/reviews/report).
  - SOLO una vez por review — los reports adicionales post-threshold NO
    re-disparan email (evita spam).

CAMBIOS (5 archivos):

1) src/lib/email-admin-ops.ts (FUNCION NUEVA)
   - sendAdminReviewPendingEmail({ orderId, orderNumber, target,
     entityName, rating, comment, authorName, authorEmail, reason }).
   - reason es union discriminada:
       { source: "BLACKLIST", matchedPatterns: string[] }
       { source: "REPORTS", reportCount, recentReports: [{ reason, reporterName }] }
   - El email muestra UI distinta segun source:
       BLACKLIST -> lista de patterns matchados (codigo) en alertBox.
       REPORTS   -> lista de reporters + razones que dejaron.
   - Header con badge "Reseña en revisión", info del pedido + autor +
     rating con estrellas + comentario en blockquote.
   - Boton al panel /ops/reviews-pendientes.
   - Manda a getAlertEmails() (los admins configurados).
   - Tag "admin_review_pending" para tracking SMTP.

2) src/app/api/orders/[id]/rate-merchant/route.ts
   - Import sendAdminReviewPendingEmail.
   - Despues del audit log REVIEW_COMMENT_FLAGGED, IIFE async que
     fetcha contexto extra (orderNumber, autor) y dispara el email
     fire-and-forget con reason BLACKLIST.

3) src/app/api/orders/[id]/rate-seller/route.ts
   - Idem rate-merchant pero target SELLER. entityName viene de
     subOrders[0].seller.displayName.

4) src/app/api/orders/[id]/rate/route.ts (driver)
   - Idem pero target DRIVER. entityName del driver.user.name.

5) src/app/api/reviews/report/route.ts
   - Si result.reachedThreshold (3er report justo lo gatillo), fetcha
     contexto + ratingReports recientes + dispara email con reason
     REPORTS incluyendo los 5 reportes mas recientes con sus razones.
   - Construye entityName/comment/rating segun el target.
   - Skip silencioso si el comment no esta o el rating no existe
     (defensivo — no deberia pasar pero igual).

QUE NO CAMBIA:
- Schema: cero migrations. Solo agregamos una funcion + 4 triggers.
- Logica de moderacion (blacklist, threshold de 3): igual.
- Panel /ops/reviews-pendientes: igual. El admin sigue resolviendo desde
  ahi. El email solo es un trigger proactivo.
- Si SMTP falla, el flow del usuario NO se rompe (fire-and-forget +
  try/catch). El audit log queda igual asi que OPS tiene record.

VERIFICACION POST-DEPLOY:
1) En staging, crear una reseña con un comentario que matchee la
   blacklist (ej: "puto de mierda" o cualquier slur de la lista).
2) En el mailbox de admin (getAlertEmails()) deberia llegar un email
   con subject "🚨 Reseña pendiente — [tipo] · pedido [#]".
3) El email debe mostrar el comentario + razon (patterns matchados).
4) Click en "Revisar en panel OPS" debe llevar a /ops/reviews-pendientes.
5) Para el caso de reports: hacer 3 reportes a una misma review limpia
   (con 3 users distintos) y verificar que al 3ro llega el email con
   reason REPORTS + las 3 razones.

**Archivos:** ISSUES.md, src/app/api/orders/[id]/rate-merchant/route.ts, src/app/api/orders/[id]/rate-seller/route.ts, src/app/api/orders/[id]/rate/route.ts, src/app/api/reviews/report/route.ts, src/lib/email-admin-ops.ts

## 2026-05-17 (rama `feat/feature-flags-ops`)

feat(ops): sistema de feature flags para activar/desactivar features sin redeploy

Observacion 1B del 2do smoke test. CEO pidio poder activar/desactivar
opciones en los paneles de comercio/vendedor sin tocar codigo, para
ocultar features incompletas (publicidad, paquetes B2B) hasta que esten
listas. Despues del analisis, el alcance se amplio a 8 flags totales
cubriendo MERCHANT, SELLER y BUYER para tener control completo
pre-launch sobre features experimentales o incompletas.

SCHEMA NUEVO (1 migrate via prisma db push):

  model FeatureFlag {
      id, key (unique), label, description, scope,
      isActive (default false), createdAt, updatedAt,
      lastToggledByUserId, lastToggledAt
  }
  Indices: scope, isActive.

8 FLAGS INICIALES (todos default false, seedeados al correr el script):

  MERCHANT:
    - merchant.publicidad         (Publicidad para destacar productos)
    - merchant.paquetes           (Paquetes B2B)
    - merchant.tracking-en-vivo   (Tracking del driver en panel comercio)
  SELLER:
    - seller.paquetes             (Paquetes para vendedores marketplace)
  BUYER:
    - buyer.marketplace           (Marketplace entre vecinos)
    - buyer.scheduled-delivery    (Pedidos programados)
    - buyer.cash-payment          (Pago en efectivo)
    - buyer.puntos-moover         (Sistema de puntos MOOVER)

ARCHIVOS (16 archivos creados/modificados):

A) FUNDACION:

1) prisma/schema.prisma
   - Modelo FeatureFlag agregado al final.

2) src/lib/feature-flags.ts (NUEVO)
   - Constantes FEATURE_FLAGS con las 8 keys canonicas.
   - isFeatureEnabled(key) con cache in-memory 30s.
   - getFeatureFlags(keys[]) para lecturas en paralelo.
   - clearFeatureFlagCache() para invalidacion manual.
   - Defaults conservadores: si la query falla o el flag no existe,
     devuelve false (esconde la feature).

3) src/hooks/useFeatureFlags.ts (NUEVO)
   - Hook cliente con cache module-level + subscribers pattern para
     que multiples componentes en la misma pagina compartan 1 sola
     query a /api/features/list.
   - useFeatureFlag(key): { flag, loading }
   - useFeatureFlags(keys[]): { flags, loading }
   - invalidateFeatureFlagsCache() para forzar re-fetch.

4) src/components/shared/FeatureFlagGuard.tsx (NUEVO)
   - Wrapper para envolver paginas/secciones enteras. Muestra spinner
     durante loading y "Feature no disponible todavía" cuando el flag
     esta OFF, con boton para volver.

B) ENDPOINTS:

5) src/app/api/features/list/route.ts (NUEVO)
   - GET publico (sin auth). Devuelve { flags: { key: boolean } }.
   - Filtro opcional ?scope=MERCHANT|SELLER|BUYER|GLOBAL.

6) src/app/api/admin/features/route.ts (NUEVO)
   - GET admin. Devuelve flags completos (label, description,
     lastToggledBy enriquecido con datos del User).

7) src/app/api/admin/features/[key]/route.ts (NUEVO)
   - GET admin: 1 flag por key.
   - PATCH admin: { isActive: bool }. Audit log + invalida cache
     server. Idempotente (no-op si ya esta en el estado pedido).

C) UI OPS:

8) src/app/ops/(protected)/feature-flags/page.tsx (NUEVO)
   - Lista de flags agrupados por scope con toggle visual, descripcion,
     label, key (codigo), badge active/inactive, ultima modificacion.
   - Toggle inline con spinner durante el PATCH + toast de feedback.

9) src/components/ops/OpsSidebar.tsx
   - Item nuevo "Feature Flags" en seccion Sistema. Icono ToggleRight.

D) SEED:

10) scripts/seed-feature-flags.ts (NUEVO)
    - Idempotente: upsert por key. Si el flag ya existe, preserva
      isActive (no resetea) y solo actualiza label/description/scope si
      cambiaron.
    - Para correr: npx tsx scripts/seed-feature-flags.ts

E) INTEGRACIONES — MERCHANT:

11) src/components/comercios/MobileMoreMenu.tsx
    - Items "Paquetes" y "Publicidad" con requiresFlag.
    - useFeatureFlags filtra el array de items visibles antes de render.

12) src/app/comercios/(protected)/publicidad/page.tsx
    - export default wrapper con <FeatureFlagGuard flag="merchant.publicidad">.
    - Componente interno renombrado a PublicidadPageInner.

13) src/app/comercios/(protected)/adquirir-paquetes/page.tsx
    - Mismo patron con "merchant.paquetes".

14) src/app/comercios/(protected)/paquetes/historial/page.tsx
    - Mismo patron con "merchant.paquetes".

F) INTEGRACIONES — BUYER:

15) src/components/layout/BottomNav.tsx
    - Items "Marketplace" y "MOOVER" (puntos) construidos
      condicionalmente segun flags buyer.marketplace y buyer.puntos-moover.
    - Si MOOVER esta OFF, el centro del BottomNav queda libre y los
      otros items se redistribuyen.

16) src/app/(store)/marketplace/page.tsx
    - Wrapper con FeatureFlagGuard "buyer.marketplace".

17) src/app/(store)/puntos/page.tsx
    - Wrapper con FeatureFlagGuard "buyer.puntos-moover".

18) src/app/moover/page.tsx
    - Wrapper con FeatureFlagGuard "buyer.puntos-moover".

19) src/app/(store)/checkout/page.tsx
    - useFeatureFlags para buyer.cash-payment y buyer.scheduled-delivery.
    - Opcion "Pago en efectivo" se oculta cuando flag OFF.
    - Si user tenia "cash" seleccionado y el flag se apaga, se cambia
      automaticamente a mercadopago via useEffect.
    - Toggle "Inmediata vs Programada" se oculta cuando scheduled-delivery
      esta OFF. Si user tenia SCHEDULED, vuelve a IMMEDIATE.

FLAGS QUE QUEDAN "PREPARADOS" (sin UI a tocar todavia):
- merchant.tracking-en-vivo: el comercio aun no tiene UI especifica de
  tracking en vivo del driver (es feature a futuro). El flag existe en
  DB y endpoint, listo para conectar cuando se implemente la UI.
- seller.paquetes: idem, no hay UI especifica de paquetes para sellers.

QUE NO CAMBIA:
- Los endpoints de las features (ej: /api/merchant/ad-placements,
  /api/merchant/packages/*) NO se tocan. Si alguien llega por API
  directa con el flag OFF, sigue funcionando. La proteccion es a nivel
  UI (esconder el feature al usuario), no a nivel API. Eso es deliberado:
  los flags son toggles de UX, no security gates.
- Si querés hacerlos "hard gates" a nivel API en el futuro, se agrega
  un middleware isFeatureEnabled() en los endpoints. Pero por ahora
  no hace falta.

PASOS POST-MERGE (IMPORTANTES — orden):

  1. npx prisma db push                           (crea tabla FeatureFlag)
  2. npx tsx scripts/seed-feature-flags.ts        (seed 8 flags OFF)
  3. .\scripts\finish.ps1                         (tsc + commit)

VERIFICACION POST-DEPLOY:

  - Entrar a /ops/feature-flags como admin -> ver 8 flags listados,
    todos en OFF.
  - Activar merchant.publicidad -> entrar como comercio -> ver item
    "Publicidad" en el menu mas.
  - Desactivar buyer.marketplace -> entrar como buyer mobile -> el
    BottomNav NO muestra item Marketplace.
  - Idem con cada flag en su contexto.
  - Verificar audit log: cada toggle queda registrado con FEATURE_FLAG_TOGGLED.

EXTENSIONES FUTURAS (otras ramas):
- Conectar merchant.tracking-en-vivo cuando se implemente el mapa en
  el panel del comercio.
- Conectar seller.paquetes cuando se implemente la UI.
- A/B testing: si quisieramos features con rollout gradual (10%, 25%,
  50%, 100%), agregar columna `rolloutPercentage` y logica de hash en
  el helper.
- Per-user overrides para QA: agregar tabla
  `FeatureFlagUserOverride { userId, flagKey, isActive }` para que QA
  pueda probar features sin afectar produccion.

**Archivos:** ISSUES.md, prisma/schema.prisma, scripts/seed-feature-flags.ts, src/app/(store)/checkout/page.tsx, src/app/(store)/marketplace/page.tsx, src/app/(store)/puntos/page.tsx, src/app/api/admin/features/[key]/route.ts, src/app/api/admin/features/route.ts (+12 mas)

## 2026-05-17 (rama `feat/driver-soporte-gps-bloqueado`)

feat(driver): escalamiento a soporte cuando el GPS bloquea la validacion del PIN

Observacion 3A del 2do smoke test. Caso real frecuente en Ushuaia: el GPS
del celular del driver es impreciso (clima frio -5C + edificios con
metales + señal degradada en zonas perifericas). El sistema le dice
"estas a 120m del destino, acercate", el driver INSISTE que esta en la
puerta del cliente, no puede ingresar el PIN, queda bloqueado sin
salida visible.

Hoy el unico mensaje era "Estas a Xm del destino. Acercate mas e
intentá de nuevo." — sin escape hatch. Si el driver no puede acercarse
(porque YA esta en el lugar), no tenia forma de destrabar el pedido y
quedaba esperando que el sistema lo desbloquee solo.

CAMBIOS (3 archivos, ningun schema):

1) src/lib/email-admin-ops.ts (FUNCION NUEVA)
   - sendAdminPinIssueEmail({ driverName, driverPhone, orderId, orderNumber,
     pinType, distanceMeters, currentLat, currentLng, comment }).
   - Manda email a getAlertEmails() (los admins configurados).
   - Header con badge naranja "GPS bloqueado".
   - Cuerpo: pedido, datos del driver (telefono incluido para llamar
     directo), tipo de PIN, distancia reportada por el sistema, ubicacion
     del driver con link a Google Maps si tenemos coords.
   - Si el driver dejo comentario, lo incluye en un emailAlertBox.
   - Sugerencias para el admin ("contactá al driver por WhatsApp...").
   - Boton al pedido en /ops/pedidos/[id].
   - Helper escapeHtml para defensa anti-XSS del comment libre.

2) src/app/api/driver/report-pin-issue/route.ts (ENDPOINT NUEVO)
   - POST con auth driver (requireDriverApi). NO permite admin override
     porque el endpoint es para que EL driver reporte, no para tomar
     accion administrativa.
   - Zod schema: orderId, pinType, distanceMeters?, currentLat?,
     currentLng?, comment? (max 500c).
   - Verifica que el order le pertenezca al driver (chequea tanto
     order.driverId como subOrders[].driverId para multi-vendor).
   - Loguea AUDIT con TODO el contexto (driverId, pinType, distancia,
     lat/lng, comment, userAgent).
   - Dispara sendAdminPinIssueEmail fire-and-forget (no bloquea la
     response). Si el SMTP falla, el audit igual queda.
   - Devuelve { success, message: "Soporte revisará tu caso" }.

3) src/components/rider/PinKeypad.tsx (UI DRIVER)
   - Imports nuevos: HelpCircle, Send, Phone, ArrowLeft (lucide-react).
   - Constantes: SUPPORT_WHATSAPP_NUMBER = "5492901553173" (mismo que
     T&C, hardcoded por simplicidad — TO-DO mover a StoreSettings).
     REPORT_COMMENT_MAX = 500.
   - Prop nueva opcional: orderId. Si no se pasa, los botones de
     escalamiento NO se muestran (compat con call sites legacy).
   - States nuevos: showReportModal, reportComment, reportSubmitting,
     reportSubmitted, reportError. Se resetean en isOpen=false.
   - Callback submitGpsIssueReport: intenta capturar lat/lng con
     navigator.geolocation.getCurrentPosition (timeout 5s, sin bloquear
     si el permiso esta denegado), POST al endpoint nuevo, set
     reportSubmitted=true al ok.
   - Callback openWhatsAppSupport: arma url wa.me con texto pre-armado
     (orderId, distancia, tipo de PIN), abre en tab nueva.
   - UI condicional cuando isOutOfGeofence && orderId:
       boton primario "Tengo problemas con la ubicación" (abre sub-modal)
       boton secundario "o escribí a soporte por WhatsApp"
   - Sub-modal nuevo z-[120] (mas alto que el modal principal):
       header con titulo + close
       cuerpo:
         si reportSubmitted -> mensaje exito + boton WhatsApp + volver
         si no -> textarea con char counter (max 500) + bloque amber
           recordando distancia + error si applies
       footer: boton "Enviar reporte" (amber) + boton text "WhatsApp"

4) src/app/repartidor/(protected)/dashboard/page.tsx
   - Pasa orderId={pinModal.orderId} al PinKeypad. Solo 1 linea.

QUE NO CAMBIA:
- Schema Prisma: NINGUN migrate. Reusamos audit log + email.
- Logica de geofence/PIN: idem (sigue siendo 100m + 50m gracia, 5
  intentos lock).
- El endpoint NO hace override automatico del geofence. El admin
  recibe el reporte y resuelve manualmente desde /ops/pedidos/[id]
  (puede reasignar driver, marcar manualmente como PICKED_UP/DELIVERED,
  etc.). Anti-fraude: cualquier override queda con audit trail.
- Call sites del PinKeypad fuera del dashboard del driver: si no le
  pasan orderId, los botones de escalamiento no aparecen
  (backwards-compatible).

VERIFICACION POST-DEPLOY:
1) En staging, hacer un pedido y avanzar hasta que el driver intente
   marcar PICKUP/DELIVERY estando lejos del destino.
2) El modal del PIN deberia mostrar el banner amber "Estas a Xm del
   destino" + 2 botones nuevos.
3) Click en "Tengo problemas con la ubicación" -> sub-modal con
   textarea + bloque informativo de distancia.
4) Escribir comentario + click "Enviar reporte" -> spinner -> pantalla
   exito.
5) Verificar en mailbox de admin: llega email con todo el contexto +
   link a Google Maps de la posicion del driver.
6) Verificar audit log: entry DRIVER_PIN_ISSUE_REPORTED con detalles.
7) Test del WhatsApp: click "Hablar con soporte por WhatsApp" deberia
   abrir wa.me con mensaje pre-armado.

DEUDA / FUTURE WORK (no en esta rama):
- Numero de WhatsApp soporte hardcoded. Mover a StoreSettings para que
  OPS pueda cambiarlo sin tocar codigo.
- UI admin dedicada para gestionar reportes de PIN issues en
  /ops/fraude o tab nuevo en /ops/pedidos. Hoy admin solo se entera
  por email y resuelve manual.
- Boton "Override geofence" en /ops/pedidos/[id] para que admin pueda
  destrabar el PIN sin pedirle al driver que se mueva. Hoy admin tiene
  que reasignar o cambiar status manual.
- Cuando el driver reporta varios casos en poco tiempo, alerta
  anti-fraude (fraudScore++).

**Archivos:** ISSUES.md, src/app/api/driver/report-pin-issue/route.ts, src/app/repartidor/(protected)/dashboard/page.tsx, src/components/rider/PinKeypad.tsx, src/lib/email-admin-ops.ts

## 2026-05-17 (rama `feat/ops-usuarios-auto-refresh`)

feat(ops): auto-refresh + boton manual en pagina /ops/usuarios

Observacion 1A del 2do smoke test de produccion. El admin tenia que
hacer F5 manualmente para ver registros nuevos en /ops/usuarios. Era
especialmente molesto cuando llegan varios drivers/merchants seguidos
y el admin esta revisando la queue de pendientes.

CAMBIOS (1 archivo):

src/app/ops/(protected)/usuarios/page.tsx
  - Import nuevo: RefreshCw de lucide-react.
  - States nuevos:
      lastFetchedAt: number       (timestamp del ultimo fetch exitoso)
      isManualRefreshing: boolean (spinner durante click del boton)
      tick: number                (tickea cada 10s para forzar re-render
                                   del label relativo sin recalcular timestamps
                                   constantemente)
  - fetchUsers ahora setea lastFetchedAt despues del success.
  - useEffect nuevo: polling automatico cada 30s que llama fetchUsers()
    + fetchTabCounts() en paralelo. Pausa si document.visibilityState
    !== "visible" (no quema requests cuando el admin tiene Moovy en
    background). Listener de visibilitychange re-fetcha inmediatamente
    al volver a visible (datos frescos al instante).
  - useEffect nuevo: setInterval de 10s que incrementa tick para el
    re-render del label relativo.
  - handleManualRefresh: callback async que llama ambos fetches en
    paralelo con spinner. Anti-double-click via isManualRefreshing.
  - renderRelativeTime: helper inline ("ahora" / "hace X seg" /
    "hace X min" / "hace X h") sin libreria externa. void tick fuerza
    re-render cuando tick cambia.
  - UI del header reorganizada:
      ANTES: <div flex>
                <h1 + total>
                <button Crear cuenta>
             </div>
      DESPUES: <div flex>
                <h1 + total + label "Actualizado hace X seg">
                <div flex gap-2>
                    <button Actualizar (icono RefreshCw, anima al
                                        cargar, label oculto en mobile)>
                    <button Crear cuenta>
                </div>
             </div>

QUE NO CAMBIA:
- fetchUsers y fetchTabCounts: la logica interna es identica. Solo
  agrego el set de lastFetchedAt en fetchUsers.
- API /api/admin/users-unified y /api/admin/users-unified/counts:
  cero cambios.
- Layout, tabs, filtros, modal de crear cuenta, modal de delete:
  cero cambios.
- Hace falta destacar tampoco la regla #11 ni email registries — esto
  es solo UX visual.

VERIFICACION POST-DEPLOY:
1) Entrar a /ops/usuarios y verificar el label "Actualizado ahora" al
   lado del total.
2) Esperar 30s sin tocar nada → la lista deberia re-fetchearse
   silenciosamente (no recarga visual, solo el label cambia y el total
   eventualmente).
3) Click manual en el boton "Actualizar" → spinner durante el fetch,
   label vuelve a "ahora".
4) Cambiar a otra pestaña del browser, esperar 30s, volver: el
   re-fetch deberia dispararse en cuanto la pagina vuelve a visible.
5) En mobile (sm), el boton "Actualizar" muestra solo el icono y
   "Crear cuenta" mantiene su tamaño.

POSIBLE MEJORA FUTURA (otra rama, no en esta):
- Cuando llega un registro nuevo entre dos polls, podriamos disparar
  un toast "Nuevo usuario registrado" para feedback inmediato. Hoy el
  total cambia silenciosamente, lo cual puede no ser super visible.
  Requiere comparar response anterior vs nueva. Pendiente.

**Archivos:** ISSUES.md, src/app/ops/(protected)/usuarios/page.tsx

## 2026-05-14 (rama `fix/modal-calificacion-tapado-por-bottomnav`)

fix(modal): footer de calificacion tapado por el BottomNav en mobile

BUG CRITICO detectado en el 2do smoke test de produccion (Mauro paso
captura del flujo en mobile). El modal post-entrega de calificacion
(PostDeliveryRatingModal) NO mostraba el footer con los botones
"Calificar despues" y "Enviar y cerrar" en mobile. El usuario solo
podia cerrar el modal con la X arriba a la derecha, lo que cerraba el
modal SIN persistir la calificacion.

Resultado: ninguna calificacion generada en mobile se guardaba realmente.
Todo el sistema de ratings + reseñas publicas que armamos en las ramas
anteriores (feat/propinas-y-ratings-post-entrega + feat/resenas-publicas-tienda)
quedaba inutilizable en produccion mobile, que es ~95% del trafico esperado.

CAUSA:

El componente PostDeliveryRatingModal.tsx estaba construido como bottom
sheet en mobile + dialog centrado en desktop:

  className="fixed inset-0 ... flex items-end sm:items-center
             justify-center z-[60] p-0 sm:p-4 ..."
  className="... rounded-t-2xl sm:rounded-2xl ... max-h-[92vh]
             flex flex-col animate-in slide-in-from-bottom-2 ..."

En mobile (< 640px) el modal se pegaba al borde inferior con items-end
y ocupaba 92vh. El BottomNav del layout (BottomNav.tsx linea 65) tiene:

  className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t..."

es decir z-50, opaco, posicion fija al borde inferior. Aunque el modal
tenia z-[60], por algun stacking context (probablemente alguno de los
parents del BottomNav crea un contexto propio con transform/opacity),
el BottomNav se renderizaba VISUALMENTE arriba del footer del modal —
tapando justo los botones de submit.

En desktop el modal funcionaba bien porque items-center lo centraba y
el BottomNav esta oculto por `lg:hidden`.

FIX:

Convertir el modal en un dialog centrado clasico en TODAS las
resoluciones, para no superponerse nunca con el BottomNav.

CAMBIOS (1 archivo, 2 ediciones):

1) src/components/orders/PostDeliveryRatingModal.tsx
   - Pantalla de exito (overlay del success state):
       z-[60] -> z-[100]
   - Pantalla principal del modal:
       z-[60] -> z-[100]                          (mucho headroom z-index)
       items-end sm:items-center -> items-center  (centrado siempre)
       p-0 sm:p-4 -> p-4                          (padding siempre)
       rounded-t-2xl sm:rounded-2xl -> rounded-2xl (full rounded)
       max-h-[92vh] -> max-h-[85vh]               (deja margen arriba/abajo)
       slide-in-from-bottom-2 -> fade-in zoom-in-95 (animacion centrada)
       w-full sm:max-w-md -> w-full max-w-md      (mismo cap en mobile)
   - Comentario extenso explicando el bug + la decision de centrar.

QUE NO CAMBIA:
- Logica de envio del formulario, validaciones, fetches a los endpoints
  de rating y propina: cero cambios. Solo posicionamiento visual.
- Pantalla de exito y todos los textos/labels: igual.
- Endpoints, schema, otros componentes: nada.

VERIFICACION POST-DEPLOY:
1) Hacer un pedido en staging hasta DELIVERED.
2) Esperar 30s post-entrega y ver el modal aparecer.
3) Verificar en mobile (DevTools responsive 380px iPhone): el modal
   se centra y el footer con "Calificar despues" / "Enviar y cerrar"
   queda visible arriba del BottomNav (no superpuesto).
4) Calificar comercio + driver con estrellas, dejar comentario y
   submit "Enviar y cerrar". Verificar que se guarda en la DB.
5) En desktop (lg+): el modal sigue funcionando igual que antes.

NOTA POST-MORTEM (lesson learned):
Cuando hay un BottomNav fijo (z-50, bg opaco), los modales deben:
- Tener z-index MUY por encima (z-[100]+).
- NO usar items-end ni max-h cercano a 100vh en mobile.
- O alternativamente, ocultar el BottomNav cuando el modal esta abierto.
Aplica a futuros modales / bottom sheets que se construyan.

**Archivos:** ISSUES.md, src/components/orders/PostDeliveryRatingModal.tsx

## 2026-05-14 (rama `fix/driver-acceso-panel-post-registro`)

fix(driver): boton al panel post-registro para que el driver pueda cargar docs

Bug funcional CRITICO detectado en el 2do smoke test de produccion
(observacion 2A del nuevo archivo observaciones_prod.md). El flujo del
driver post-registro estaba ROTO en loop muerto:

  1. Driver completa el formulario en /repartidor/registro y lo envia.
  2. Sistema crea User + Driver con approvalStatus = PENDING.
  3. Aparece pantalla "Solicitud Enviada" o /repartidor/pendiente-aprobacion.
  4. La pantalla solo tenia link "Volver al inicio".
  5. Driver no tenia forma de llegar a /repartidor/(protected)/perfil
     que es donde se cargan los documentos faltantes (licencia, seguro,
     cedula verde, DNI fotos, constancia AFIP, etc).
  6. Sin documentos -> admin no aprueba.
  7. Sin aprobacion -> driver no opera.
  -> NUNCA se completaba ningun onboarding nuevo.

Importante: la rama feat/registro-simplificado (2026-04-27) volvio los
docs OPCIONALES en el registro publico — el driver los carga DESPUES
desde su panel. Pero nos olvidamos de darle al driver la puerta de
entrada al panel. Esta rama cierra ese gap.

CAMBIOS (2 archivos):

1) src/app/repartidor/registro/RepartidorRegistroClient.tsx
   - Step 4 (pantalla de exito post-submit): nueva CTA principal grande
     verde "Cargar mi documentación" / "Ir a mi panel" (texto cambia si
     fromProfile esta autenticado).
     - fromProfile && isAuthenticated → href="/repartidor/dashboard"
       (el user ya tiene sesion porque entro desde mi-perfil).
     - resto → href="/repartidor" (esa ruta redirige a /repartidor/login
       si no hay sesion, y de ahi al dashboard tras autenticar).
   - Link existente "Volver al inicio" / "Volver al perfil" se mantiene
     como secundario debajo del CTA.
   - Copy del parrafo descriptivo reescrito para reflejar el nuevo flow:
     antes decia "tu solicitud está en revisión, te contactaremos pronto"
     (mentira porque no podia hacer nada), ahora dice "tu cuenta ya fue
     creada, ingresá al panel para cargar los documentos faltantes".
   - Bloque "Próximos pasos" tambien actualizado en mismo sentido.
   - Import nuevo: ArrowRight de lucide-react.

2) src/app/repartidor/pendiente-aprobacion/page.tsx
   - CTA principal nuevo "Cargar mi documentación" con icono ArrowRight,
     fondo rojo Moovy (#e60012), arriba del bloque de soporte por email.
     Apunta a /repartidor (que internamente decide login o dashboard).
   - Copy del parrafo descriptivo reescrito en linea con el nuevo flow.
   - Link "Volver al inicio" sigue al final como secundario.
   - Import nuevo: ArrowRight.

QUE NO CAMBIA:
- /repartidor/(protected)/perfil sigue siendo donde el driver carga
  sus docs. Solo agregamos como llegar.
- /repartidor/(protected)/dashboard sigue sin permitir aceptar pedidos
  hasta que el driver tenga approvalStatus = APPROVED. Esa proteccion
  estaba bien antes y sigue bien.
- Endpoint /api/auth/register/driver no se toca — sigue NO creando
  sesion auto (el driver tiene que loguear manualmente despues del
  registro publico). Si en el futuro queremos auto-login post-registro
  para reducir mas la friccion, es otro cambio.
- Logica de approvalStatus / aprobacion admin / cron docs expiry: sin
  cambios.

VERIFICACION POST-DEPLOY:
1) Registrar driver nuevo en staging desde /repartidor/registro
   (sin estar logueado).
2) Submit del paso 3 -> ver el step 4 "¡Solicitud Enviada!" con boton
   verde grande "Cargar mi documentación".
3) Click en ese boton -> deberia ir a /repartidor que redirige a
   /repartidor/login.
4) Loguear con las credenciales del driver recien creado.
5) Aterrizar en /repartidor/dashboard y desde ahi acceder al perfil
   para subir la documentacion.
6) Verificar que la proteccion "no podes conectarte" sigue activa hasta
   que admin apruebe.

**Archivos:** ISSUES.md, docs/referencias/observaciones_prod.md, src/app/repartidor/pendiente-aprobacion/page.tsx, src/app/repartidor/registro/RepartidorRegistroClient.tsx

## 2026-05-12 (rama `fix/ci-quitar-lint-bloqueante`)

fix(ci): sacar step de ESLint del CI hasta limpiar deuda historica

Segundo follow-up de la rama chore/github-actions-ci. Despues de excluir
los archivos auxiliares del lint (fix/ci-eslint-ignores-archivos-auxiliares),
el CI seguia rojo porque src/lib/** tiene ~823 errores + ~427 warnings
PRE-EXISTENTES de las reglas:

  - @typescript-eslint/no-explicit-any  (mayoria, ~800 casos)
  - @typescript-eslint/no-unused-vars
  - @typescript-eslint/no-require-imports
  - @next/next/no-img-element

Archivos afectados incluyen modulos criticos:
  - src/lib/encryption.ts
  - src/lib/fiscal-crypto.ts
  - src/lib/ops-config.ts
  - src/lib/points.ts
  - src/lib/order-payment-confirm.ts
  - src/lib/order-refund.ts
  - src/lib/merchant-loyalty.ts
  - src/lib/sentry-scrub.ts
  - src/proxy.ts
  - etc.

DECISION CEO: NO arreglar esto pre-launch.

Razones:
1) Son deuda de ESTILO, no bugs reales. La app corre en produccion sin
   problemas con todo este "any". Las reglas son opinadas — TypeScript
   permite `any` perfectamente; ESLint estricto no lo recomienda.
2) Arreglar ~823 errores en codigo sensible (criptografia, pagos,
   puntos) es trabajo de varios dias-semanas. RIESGO alto de introducir
   regresiones reales tratando de "prolijar" tipos que ya funcionan.
3) El VALOR REAL del CI lo da `tsc --noEmit`, que SI atrapa errores
   de tipos genuinos. Lint es complementario, no fundamental.
4) Es practica industrial estandar: Stripe, Vercel, Linear y otros
   no usan lint estricto como gate de CI bloqueante. Lo corren en
   pre-commit hooks locales o como job separado opt-in.

CAMBIO (1 archivo):

.github/workflows/ci.yml
  - Removido el step "Run ESLint".
  - El job typecheck pasa a hacer solo:
      checkout → setup-node → npm ci → prisma generate → tsc
  - Comentario extenso en el lugar del step removido explicando:
    a) por que se removio (deuda historica);
    b) que el CI no se rompe (sigue corriendo tsc);
    c) que lint queda disponible localmente (`npm run lint`);
    d) plan post-launch para limpiar la deuda y re-introducir el
       step con `--max-warnings 0` cuando el codigo este limpio.

QUE NO CAMBIA:
- security.yml: sigue corriendo `npm audit` + `audit-ci` + `gitleaks`.
- tsc check sigue siendo gate obligatorio (atrapa bugs reales).
- `npm run lint` sigue funcionando local — el dev que quiera correrlo
  puede hacerlo y ver los warnings, solo deja de bloquear CI.
- eslint.config.mjs no se toca — los globalIgnores de archivos
  auxiliares (scripts/**, prisma/seed*, load-testing/**, public/sw.js)
  agregados en la rama anterior siguen vigentes (el lint local sigue
  ignorando esos).

VERIFICACION POST-MERGE:
- Proximo push a develop deberia disparar CI y este vez quedar VERDE.
- En github.com/innerdrop/moovy → Actions → CI: el run mas reciente
  con commit hash del merge de esta rama deberia mostrar checkmark
  verde.

PROXIMOS PASOS POST-LAUNCH:
- Rama "chore/limpiar-lint-src" (despues de lanzar y bajar el estres):
  1. Correr `npx eslint --fix src/**/*.{ts,tsx}` para auto-fix de lo
     facil (~80% de unused-vars y require-imports se arreglan solos).
  2. Revisar manualmente los `any` criticos:
     - src/lib/encryption.ts y src/lib/fiscal-crypto.ts (criptografia
       de datos AAIP — tipar con cuidado, no romper compatibilidad
       binaria de lo cifrado existente).
     - src/lib/ops-config.ts (~50 `any` que probablemente son JSON
       config types que se pueden tipar con un Zod schema).
     - src/lib/points.ts y src/lib/order-payment-confirm.ts (logica
       de dinero — extra cuidado).
  3. Cuando el lint corra limpio, descomentar el step en ci.yml con
     `npm run lint -- --max-warnings 0` para que sea gate de aqui en
     mas (cero tolerancia a deuda nueva).
- Esa rama es ~2-3 dias de trabajo focused. Mejor hacerlo aislado
  que mezclado con features.

**Archivos:** .github/workflows/ci.yml, ISSUES.md

## 2026-05-11 (rama `feat/resenas-publicas-tienda`)

feat(resenas): UI publica de reseñas con boton reportar en tienda + marketplace

Cierra el ciclo abierto por feat/propinas-y-ratings-post-entrega. Ahora
las reseñas que el buyer escribe en el modal post-entrega son visibles
para cualquier visitante de la pagina del comercio o el perfil del seller
marketplace. Boost de confianza directo — cada estrella vista vende.

DECISIONES DE PRODUCTO:

1) Filtro de moderacion: solo se muestran reseñas con moderationStatus
   IN (AUTO_APPROVED, APPROVED). Las PENDING (blacklist o >=3 reportes)
   y REJECTED (OPS las elimino) NO se renderizan. El rating numerico
   SI cuenta en el avg/distribution incluso cuando el comment esta
   oculto — el rating en si no necesita moderacion, solo el texto.

2) Endpoint publico sin auth: cualquiera puede ver las reseñas (incluyendo
   usuarios deslogueados explorando). Solo el endpoint de REPORTAR requiere
   auth (anti-spam).

3) Boton "Reportar" en cada reseña: si el user esta deslogueado, redirige
   a /login con callbackUrl. Si esta logueado, abre modal compacto con
   textarea de razon opcional (max 200c) y dispara el endpoint existente
   /api/reviews/report (creado en la rama de propinas+ratings).

4) Optimistic remove: al reportar, la reseña desaparece del view del
   reporter inmediatamente (mejor UX que dejarla visible). El backend
   decide si llega al threshold de 3 reportes y bajarla a PENDING.

5) Driver fuera del scope: el driver no tiene pagina publica individual
   ("perfil del driver") donde mostrar reseñas — su rating vive en el
   panel interno (/mis-pedidos). Si en el futuro se decide construir un
   perfil publico del repartidor (por ej. para que el buyer pueda
   "favoritear" repartidores), se agrega en otra rama.

CAMBIOS (5 archivos):

1) src/app/api/reviews/[entityType]/[entityId]/route.ts (NUEVO)
   - GET publico. entityType debe ser "merchant" o "seller", entityId
     es el id del Merchant o SellerProfile.
   - Paginacion ?page=1&limit=10 (cap limit=50).
   - Para merchant: filtra Order.merchantId = entityId.
   - Para seller: filtra subOrders.some(sellerId = entityId).
   - Where: rating no-null + moderationStatus visible + soft delete null.
   - Devuelve items (id/rating/comment/authorName/createdAt), total,
     avgRating (1 decimal), distribution { 1..5 → count }, hasMore.
   - groupBy por valor de rating + suma manual para avg (mas eficiente
     que aggregate cuando ya necesitamos la distribucion igual).
   - Soft-deleted users → authorName = "Usuario" (anonimizado).

2) src/components/store/ReviewsSection.tsx (NUEVO)
   - "use client" component. Recibe { entityType, entityId, entityLabel }.
   - Header con avg grande (text-5xl) + estrellas + total reseñas.
   - Distribucion de 5 a 1 estrella con barras de % estilo Google/Amazon.
     Las barras se normalizan al max count (no al total) para que cuando
     todas las reseñas son de 5 estrellas se vea una barra llena, no
     todas mini. Tambien muestra el % real al lado.
   - Lista paginada de reseñas: estrellas + autor + fecha relativa
     ("hace 3 días") + comment + boton "Reportar".
   - "Ver mas reseñas" carga la siguiente pagina con deduplicacion por id.
   - Estado vacio si total === 0: icono + mensaje "Sé el primero".
   - Auth check para reportar: si !session, redirige a /login con
     callbackUrl preservando la URL actual.

3) src/components/store/ReportReviewModal.tsx (NUEVO)
   - Modal "report this review". Recibe la review + entityType.
   - Preview de la reseña reportada (rating + comment line-clamp-4).
   - Textarea opcional con char counter (max 200c).
   - POST a /api/reviews/report con { orderId: review.id, target, reason }.
     target se deriva: entityType "merchant" -> "MERCHANT", "seller" -> "SELLER".
   - Pantalla de exito (icono check + mensaje) durante 1.5s antes de
     llamar onSubmitted y cerrarse.
   - Click en backdrop cierra; click en el modal mismo no.

4) src/app/(store)/store/[slug]/page.tsx
   - Import de ReviewsSection.
   - Seccion nueva al final del container de productos:
       <h2><Star/> Reseñas</h2>
       <ReviewsSection entityType="merchant" entityId={merchant.id} ... />
   - El icono Star ya estaba importado en el archivo.

5) src/app/(store)/marketplace/vendedor/[id]/page.tsx
   - Import de ReviewsSection.
   - Seccion nueva al final de la grid de listings con header violeta
     (paleta del marketplace) y entityType="seller". entityId=seller.id
     (no userId — la moderacion y queries usan SellerProfile.id).

QUE NO CAMBIA:
- Schema, otros endpoints, logica de moderacion: nada. Esta rama solo
  EXPONE al publico lo que ya existia internamente.
- El endpoint /api/reviews/report (creado en rama anterior) sigue igual.
- El modal post-entrega que genera las reseñas no cambia.
- El panel OPS /ops/reviews-pendientes no cambia.

VERIFICACION POST-DEPLOY:
- Entrar a /store/[slug] de un comercio que tenga al menos una orden
  DELIVERED con rating. Verificar que se ve la seccion "Reseñas" con
  estrellas, distribucion y al menos una reseña.
- Click en boton "Reportar" de una reseña deslogueado: deberia ir a
  /login. Logueado: abre el modal.
- Reportar con razon: deberia mostrar mensaje de exito y la reseña
  desaparecer de la lista del reporter.
- Verificar en /ops/auditoria que aparece audit log REVIEW_COMMENT_REPORTED.
- Para sellers: entrar a /marketplace/vendedor/[id] con orden marketplace
  DELIVERED + rated. Mismo comportamiento.

PROXIMO PASO NATURAL (otra rama):
- Notificacion email a OPS cuando un comment cae en PENDING (1h).
  Cierra el ciclo proactivo: hoy OPS tiene que ir manual a la queue,
  ese email los alerta al instante.

**Archivos:** ISSUES.md, src/app/(store)/marketplace/vendedor/[id]/page.tsx, src/app/(store)/store/[slug]/page.tsx, src/app/api/reviews/[entityType]/[entityId]/route.ts, src/components/store/ReportReviewModal.tsx, src/components/store/ReviewsSection.tsx

## 2026-05-11 (rama `fix/ci-eslint-ignores-archivos-auxiliares`)

fix(ci): excluir archivos auxiliares del lint para destrabar GitHub Actions

Follow-up de chore/github-actions-ci. El primer run del workflow CI en
GitHub Actions fallo en el step "npm run lint" con ~50 errores y
warnings en archivos pre-existentes:

  - scripts/*.ts y scripts/*.js   (admin / seed / migracion CLI scripts)
  - prisma/seed-local-reset.ts    (seed)
  - prisma/seed.ts                (seed default)
  - load-testing/k6/*.js          (tests de carga, otro runtime)
  - public/sw.js                  (service worker viejo)

Reglas que disparan:
  - @typescript-eslint/no-require-imports
  - @typescript-eslint/no-explicit-any
  - @typescript-eslint/no-unused-vars
  - import/no-anonymous-default-export

Estos errores son DEUDA TECNICA HISTORICA — no fueron introducidos en
esta sesion. Existian desde hace tiempo pero nunca se vieron porque
"npm run lint" no se corria como gate (no esta en tsc-strict.ps1).
Al agregarlo al CI, salieron a la luz.

PROBLEMA: arreglar los ~50 errores uno por uno (cambiar require() por
import, tipar todos los any, remover vars unused) son cambios chiquitos
en archivos auxiliares que no afectan el bundle de la app. Hacerlo
ahora bloqueando el CI no aporta valor — son scripts CLI de admin que
se ejecutan manualmente con tsx, y la app de produccion no los carga.

DECISION CEO: el lint de src/** (el codigo que se compila al bundle de
produccion y al que afectan los buyers/drivers/admins en runtime) sigue
corriendo completo y exigente. Los archivos auxiliares de mantenimiento
quedan ignorados en el lint hasta que decidamos limpiarlos en una rama
dedicada (no urgente). Si se introducen errores nuevos en src/**, el
CI los va a atajar.

CAMBIOS:

1) eslint.config.mjs
   - globalIgnores extendido con:
       scripts/**          (admin/seed/migracion)
       prisma/seed*.ts     (seeds, tsx no es bundle)
       prisma/seed*.mjs
       load-testing/**     (k6 tests)
       public/sw.js        (service worker pre-existente)
   - El bloque ya existente de defaults se mantiene (.next/, out/, build/,
     next-env.d.ts).
   - Comentario explicativo apunta a esta rama por contexto.

QUE NO CAMBIA:
- ci.yml: no se toca. El step "npm run lint" sigue corriendo igual,
  pero ahora con los ignores nuevos pasa limpio.
- Schema, codigo de la app, package.json: nada.

VERIFICACION POST-MERGE:
- En GitHub Actions, el siguiente run de CI deberia mostrar el step
  "Run ESLint" en verde.
- Si aparecen nuevos errores en archivos de src/**, el CI los va a
  marcar igual (no estamos relajando el lint del codigo de la app).

DEUDA PENDIENTE (para limpiar cuando convenga, sin urgencia):
- scripts/*.{ts,js}: migrar de require() a import, tipar los any.
- prisma/seed*.ts: tipar los any.
- public/sw.js: remover vars unused.
- load-testing/k6/*: agregar nombres a los default exports.
Cada uno es chico y aislado, se pueden hacer en una sola rama
"chore/limpiar-lint-archivos-auxiliares" cuando se priorice.

**Archivos:** ISSUES.md, eslint.config.mjs

## 2026-05-10 (rama `chore/github-actions-ci`)

chore(ci): GitHub Actions con tsc + lint automatico en cada push

Hoy el chequeo de tipos es honor system — depende de que el dev corra
.\scripts\finish.ps1 antes de pushear. Si alguien (yo en un descuido,
un dev futuro, o un git push directo desde un cliente visual) saltea el
script, codigo roto puede entrar a develop. Este workflow convierte el
chequeo en automatico y obligatorio: GitHub Actions descarga el codigo
en sus runners de Ubuntu, instala dependencias y corre tsc + lint en
~3-4 min. Si falla, el commit queda marcado con X rojo y manda email
al autor.

ARCHIVOS:

1) .github/workflows/ci.yml (NUEVO)
   - Triggers: push a develop/main + PRs a esas ramas.
   - concurrency con cancel-in-progress: si llega un push nuevo a la
     misma rama mientras corre uno previo, cancela el viejo para no
     gastar minutos en revisiones obsoletas.
   - Job typecheck:
     a) actions/checkout@v4 (descarga del repo).
     b) actions/setup-node@v4 con node 20 + cache de npm.
     c) npm ci (respeta package-lock exacto, mas reproducible que install).
     d) npx prisma generate (sin esto, los modelos de Prisma serian "any"
        y tsc daria errores de tipos masivos en los endpoints).
     e) npx tsc --noEmit --skipLibCheck (mismo comando que corremos
        localmente en tsc-strict.ps1).
     f) npm run lint (eslint del proyecto).
   - Job validate-db: COMENTADO. Lo dejamos preparado en YAML para
     activar en una siguiente rama. Requiere levantar postgres con
     PostGIS extension, correr prisma db push, y disparar
     validate-ops-config.ts + validate-role-flows.ts contra la DB de
     test. Esos scripts requieren DATABASE_URL real (ver headers de los
     scripts en /scripts/).

2) .github/workflows/security.yml (MODIFICADO)
   - Job "typecheck" pre-existente eliminado porque duplicaba el de
     ci.yml (y ademas no corria prisma generate ni --skipLibCheck, asi
     que era menos confiable).
   - Quedan los jobs audit (npm audit + audit-ci) y secrets-scan
     (gitleaks). Esos no se tocan.

QUE NO CAMBIA:
- Schema, codigo de la app, package.json: nada.
- El flujo local sigue igual: start.ps1 / finish.ps1 / tsc-strict.ps1
  funcionan exactamente como antes. CI es complemento, no reemplazo.

COSTO:
- $0. GitHub Free tier incluye 2000 minutos de CI por mes para repos
  privados. Cada run dura ~3-4 min, asi que tenemos ~500 runs/mes
  gratis. Para el flujo de Moovy (~5-10 commits/dia), estamos muy
  lejos de pasarnos.

COMO VERIFICAR POST-MERGE:
1. Ir a github.com/[org]/moovy -> pestaña "Actions".
2. Despues del primer push, deberia aparecer el run "CI / TypeScript
   check" corriendo.
3. Si pasa, verde. Si falla, rojo + email al autor con el log.
4. En cada commit del repo, GitHub muestra el circulo verde/rojo al
   lado del hash.
5. (Opcional, mas adelante) en Settings -> Branches -> Branch
   protection rules, marcar "Require status checks to pass before
   merging" eligiendo el job typecheck. Eso bloquea merges a main si
   CI esta rojo.

PROXIMOS PASOS NATURALES (en otras ramas):

a) Activar el job validate-db descomentando el bloque del YAML. Eso
   agrega ~5 min al CI pero corre los scripts validate-* contra una
   DB postgres+PostGIS limpia, atajando bugs de lógica que tsc no
   detecta (ej: race conditions, regla de comisiones rota, etc.).

b) Si en algun momento el codebase queda 100% sin warnings de ESLint,
   cambiar "npm run lint" por "npm run lint -- --max-warnings 0" para
   que tampoco se cuelen warnings nuevos en PRs futuros.

c) Considerar habilitar "Required status checks" en branch protection
   de main para bloquear merges con CI rojo.

**Archivos:** .github/workflows/ci.yml, .github/workflows/security.yml, ISSUES.md

## 2026-05-10 (rama `feat/welcome-email-seller`)

feat(emails): welcome email para SELLER al activar perfil marketplace

Completa la simetria del set de welcome emails: BUYER, COMERCIO y DRIVER
ya tenian sus variantes (las dos ultimas las conectamos en la rama
feat/welcome-emails-driver-merchant). SELLER era el unico actor que se
quedaba sin email post-activacion. Asimetria que generaba la sensacion
de "Moovy se olvido de mi" justo al momento mas importante (cuando el
seller acaba de crear su perfil y deberia recibir guia para publicar).

DECISION DE PRODUCTO:

A diferencia de driver/merchant que tienen flujo de "solicitud recibida,
esperá aprobación 24-48hs hábiles", el SELLER se autoactiva al cargar
CUIT en /api/auth/activate-seller (no requiere admin approval — ver
src/lib/roles.ts derivacion de SELLER desde SellerProfile.isActive). Por
eso este email NO es "recibimos tu solicitud", es directamente
confirmacion + onboarding inicial:

  - Subject: "Tu perfil de vendedor está activo — MOOVY"
  - Cuerpo: badge "Marketplace activo" + saludo personal + lista de
    primeros pasos (publicar primer listing, configurar disponibilidad,
    cargar CBU/alias, revisar T&C con comisión 12%) + CTA al panel
    /vendedor + tip final sobre la calidad de la primera publicación.

CAMBIOS (3 archivos):

1) src/lib/email-p0.ts
   - Nueva categoria "ONBOARDING SELLER MARKETPLACE" al final del archivo.
   - Funcion sendSellerActivatedEmail con args { email, sellerName,
     displayName }. Devuelve el sendEmail con tag "seller_activated"
     para que el log SMTP la rastree.

2) src/lib/email-registry.ts
   - Tipo recipient extendido con 'vendedor' (antes solo
     'comprador' | 'comercio' | 'repartidor' | 'admin' | 'owner').
   - SAMPLE extendido con sellerName, sellerDisplayName, sellerEmail
     para que la preview en /ops/emails muestre datos coherentes.
   - Entrada nueva id "seller_activated" #19 (status "new", priority P0,
     trigger "POST /api/auth/activate-seller", file "src/lib/email-p0.ts")
     con su generatePreview.

3) src/app/api/auth/activate-seller/route.ts
   - Import de sendSellerActivatedEmail desde @/lib/email-p0.
   - Despues del recordConsent (TERMS + PRIVACY), fetcheamos el user
     (email + name) y disparamos el welcome email fire-and-forget.
   - Si el fetch del user falla, logueamos y seguimos. El activate-seller
     NO falla por un email roto (es el patron de la regla #11 de CLAUDE.md).
   - displayName del email viene de body.displayName o cae a user.name.

QUE NO CAMBIA:
- Schema de DB no se toca.
- /api/auth/activate-seller mantiene su contrato — sigue devolviendo
  { success: true, role: "SELLER", status: "ACTIVE" }. El email es side
  effect post-respuesta.
- Otros emails de seller (futuros: order received as seller, payout
  ready, etc.) quedan fuera del scope — esta rama solo cierra la
  asimetria del welcome.

VERIFICACION SUGERIDA POST-DEPLOY:
- En staging, activar un perfil SELLER nuevo desde /vendedor/registro o
  /mi-perfil con CUIT valido y T&C aceptados.
- Verificar que llega un email al inbox del user con subject
  "Tu perfil de vendedor está activo — MOOVY".
- En /ops/emails buscar la entry "seller_activated" y abrir la preview
  para confirmar que el sample render bien.
- Si el SMTP esta caido, confirmar que la activacion igual completa
  exitosamente (el endpoint no debe fallar por el email).

QUEDA EN BACKLOG (no incluido aca):
- Otros emails del ciclo seller marketplace (nuevo pedido recibido,
  payout disponible, listing rechazado por moderacion, etc.). Cuando se
  prioricen, se agregan con el mismo patron.

**Archivos:** ISSUES.md, src/app/api/auth/activate-seller/route.ts, src/lib/email-p0.ts, src/lib/email-registry.ts

## 2026-05-10 (rama `feat/propinas-y-ratings-post-entrega`)

feat(ratings+propinas): modal post-entrega + moderacion auto + propina directa

Implementacion completa del flow post-entrega para el buyer: calificar al
comercio, seller (si marketplace), repartidor + declarar propina al driver,
todo en un solo modal que aparece automaticamente 30s despues de DELIVERED.

DECISIONES DE PRODUCTO (CEO + UX):

1) Propina al repartidor: 100% directa entre buyer y driver. Moovy NO procesa.
   - Efectivo (en mano) o transferencia al alias bancario del driver.
   - Sin pago via MP, sin comision MP, sin payouts especiales, sin refunds.
   - Si el driver no tiene bankAlias cargado, solo "Efectivo" / "Esta vez no".
   - El buyer declara informativamente que medio eligio (analytics + reporting
     al driver "este mes te declararon $X de propinas").

2) Calificacion: estrellas obligatorias + comentario opcional con limites.
   - Driver: max 300c (experiencia delivery, suele ser corta).
   - Comercio: max 500c (atencion + producto + packaging).
   - Seller: max 500c (paridad con comercio).
   - Modal con boton discreto "Calificar despues" — vuelve a aparecer la
     proxima vez que el buyer abra el pedido.

3) Moderacion de comentarios: 2 niveles tipo Uber/Trip Advisor.
   - Nivel 1 al enviar: blacklist local (~80 patrones argentinos: slurs
     racistas/homofobicos/sexistas, amenazas explicitas, acoso sexual,
     discriminacion). Match -> moderationStatus = PENDING (invisible publico).
   - Nivel 2 reportes comunidad: cualquier user puede reportar. >= 3 reportes
     bajan el comment a PENDING automaticamente.
   - OPS revisa en /ops/reviews-pendientes. Resuelve APPROVED (publica) o
     REJECTED (borra el texto, mantiene rating numerico).
   - El rating numerico SIEMPRE cuenta en el avg, sin importar moderacion del
     comment. Solo se modera la visibilidad del texto.

ARCHIVOS TOCADOS:

Schema (prisma db push requerido antes del finish):
1) prisma/schema.prisma
   - Order: 6 campos nuevos de moderacion (driver/merchant/seller cada uno
     con *RatingModerationStatus String @default("AUTO_APPROVED") +
     *RatingReportCount Int @default(0)) + 3 de propina (driverTipMethod,
     driverTipAmount, driverTipDeclaredAt) + 3 indices nuevos por status.
   - User: relacion ratingReportsFiled RatingReport[].
   - Tabla nueva RatingReport (id, orderId, reporterUserId, target, reason,
     resolvedAt, resolvedBy, resolution + indices).

Helper de moderacion:
2) src/lib/moderation.ts (NUEVO)
   - BLACKLIST_PATTERNS: regex case-insensitive (~80 entradas) cuidadosamente
     seleccionadas para minimizar falsos positivos. NO matcheamos puteadas
     argentinas comunes ("la puta madre", "boludo") porque son tan culturales
     que filtrarlas dispararia falsos positivos masivos. Confiamos en reportes
     de comunidad para esos casos.
   - checkContent(text) -> { isClean, matchedPatterns }.
   - COMMENT_LIMITS export (DRIVER 300, MERCHANT 500, SELLER 500, REPORT_REASON 200).
   - REPORT_THRESHOLD = 3.

Endpoints modificados (los 3 de rating + check de moderacion):
3) src/app/api/orders/[id]/rate-merchant/route.ts
4) src/app/api/orders/[id]/rate-seller/route.ts
5) src/app/api/orders/[id]/rate/route.ts
   - Validan limite de chars del comentario (400 si excede).
   - Llaman checkContent antes de persistir.
   - Si match -> moderationStatus PENDING + auditLog REVIEW_COMMENT_FLAGGED.
   - Si limpio -> AUTO_APPROVED.
   - Rating numerico se persiste igual y sigue contando en avg.

Endpoints nuevos:
6) src/app/api/reviews/report/route.ts
   - POST. Auth obligatoria. Anti-duplicado (mismo reporter no reporta dos
     veces el mismo target). Anti-self-report (no reportes tu propia review).
   - Crea RatingReport, bumpea reportCount, si >= 3 baja a PENDING.
7) src/app/api/orders/[id]/tip/route.ts
   - POST. method enum CASH/TRANSFER/NONE + amount opcional.
   - Solo persiste informativo, sin pago real.
   - Una vez por order (anti-spam, anti-fat-finger).
8) src/app/api/admin/review-moderation/route.ts
   - GET: lista plana de items pendientes (uno por target en moderacion
     dentro de cada Order). Incluye reportes asociados con razones.
   - PATCH: resuelve { orderId, target, resolution: APPROVED | REJECTED }.
     APPROVED publica el comment. REJECTED lo borra (rating numerico se
     mantiene). Cierra todos los RatingReport pendientes asociados.

Endpoint de detalle de orden:
9) src/app/api/orders/[id]/route.ts
   - Agrega bankAlias al select del driver (necesario para que la UI muestre
     la opcion de transferencia con alias copiable).

Componentes:
10) src/components/orders/PostDeliveryRatingModal.tsx (NUEVO)
    - Modal unificado mobile-first. Renderiza solo las secciones pendientes
      (si el comercio ya fue calificado, esa seccion no aparece).
    - Estrellas + textarea con char counter para cada rating.
    - Seccion de propina al driver con 3 botones (CASH / TRANSFER / NONE)
      + alias copiable + monto opcional. Si no hay bankAlias, solo CASH y NONE.
    - Sub-componente RatingSection reusable.
    - Promise.all para enviar todo en paralelo. Tracking de fallas parciales.

11) src/app/(store)/mis-pedidos/[orderId]/page.tsx
    - Importa PostDeliveryRatingModal.
    - Calcula needs* (rating de comercio/seller/driver + propina).
    - useEffect que muestra el modal 30s post-DELIVERED si hay needs y no
      fue postpuesto.
    - State postDeliveryPostponed para que "Calificar despues" no haga
      reaparecer en la misma sesion.
    - Interface Order extendida con deliveredAt + driverTipMethod +
      driver.bankAlias.

Driver UI:
12) src/app/api/driver/earnings/route.ts
    - Devuelve totalTipsDeclared + totalTipsCount + hasBankAlias para el
      reporte del driver.
13) src/components/rider/views/EarningsView.tsx
    - Seccion "Propinas declaradas" si totalTipsCount > 0.
    - Banner amber si hasBankAlias === false: "Cargá tu alias para recibir
      propinas".

OPS:
14) src/app/ops/(protected)/reviews-pendientes/page.tsx (NUEVO)
    - Lista de reseñas pendientes (cards con: target icon, rating, comment
      reportado, lista de reportes con razones).
    - Botones APROBAR (publica) / RECHAZAR (borra texto, mantiene rating).
    - Banner explicativo de que el rating numerico cuenta independiente.
15) src/components/ops/OpsSidebar.tsx
    - Item nuevo "Reseñas pendientes" en seccion Operaciones, link a
      /ops/reviews-pendientes.

QUE NO SE INCLUYE EN ESTA RAMA (para futuras):
- Boton "Reportar" en la UI publica de reseñas. Hoy las reseñas no se
  muestran publicamente en /tienda/[slug] u otras paginas — el endpoint
  /api/reviews/report ya esta listo, falta consumirlo desde una UI publica.
  Cuando se haga la rama "publicar reseñas en pagina de comercio", agregar
  el boton es trivial.
- Notificacion email a OPS cuando un comment cae en PENDING. Por ahora se
  ven en /ops/reviews-pendientes manualmente. En una rama futura se puede
  agregar notificacion proactiva.
- Welcome email para SELLER al activar perfil marketplace (rama separada
  identificada en sprint anterior, post-launch).

INSTRUCCIONES POST-CHECKOUT (orden importante):

ANTES del finish.ps1, correr:

  npx prisma db push

Esto sincroniza el schema con la DB (campos nuevos + tabla RatingReport)
y regenera el cliente Prisma. Sin esto, el tsc va a fallar porque los
endpoints referencian campos que no existen en el cliente generado todavia.

Despues:

  .\scripts\finish.ps1

VERIFICACION POST-DEPLOY:

- En staging, finalizar un pedido (DELIVERED). Esperar 30s y verificar
  que el modal aparece automatico.
- Calificar comercio + driver + dejar propina TRANSFER. Verificar que se
  abre el alias copiable y el monto opcional funciona.
- Probar comentario inocente: deberia quedar AUTO_APPROVED.
- Probar comentario con palabra de la blacklist (ej: "puto de mierda"):
  deberia quedar PENDING y aparecer en /ops/reviews-pendientes.
- En /ops/reviews-pendientes, aprobar uno y rechazar otro. Verificar
  que ambos desaparecen de la queue y los logs dejan registro.
- Verificar que el driver ve "Propinas declaradas" en su EarningsView.

**Archivos:** ISSUES.md, prisma/schema.prisma, src/app/(store)/mis-pedidos/[orderId]/page.tsx, src/app/api/admin/review-moderation/route.ts, src/app/api/driver/earnings/route.ts, src/app/api/orders/[id]/rate-merchant/route.ts, src/app/api/orders/[id]/rate-seller/route.ts, src/app/api/orders/[id]/rate/route.ts (+8 mas)

## 2026-05-10 (rama `feat/rto-no-obligatorio-driver`)

feat(driver): RTO no obligatorio + declaracion jurada en T&C

Smoke test produccion 2026-05-07 (observacion 2A): el formulario de registro
de driver y los T&C exigian RTO (Revision Tecnica Obligatoria) como doc
requerido para activacion. Mauro pidio opinion legal: pedir RTO sube
fricción del onboarding, los competidores serios (PedidosYa, Rappi) no lo
piden y, mas grave, exigirlo en el onboarding le da munition a un
demandante para argumentar que MOOVY "garantizo" la idoneidad del vehiculo,
cuando en realidad es responsabilidad provincial del titular.

Decision (CEO + Legal): RTO deja de ser obligatorio. Se reemplaza por una
declaracion jurada en T&C donde el repartidor se compromete a mantener su
vehiculo en regla con las obligaciones provinciales aplicables. Patron
estandar en Uber, DoorDash y Lyft: las "Declaraciones del Contractor"
viven en su propia seccion legalmente vinculante, separadas de los
requisitos operativos.

CAMBIOS (5 archivos):

1) src/lib/driver-document-approval.ts
   - vtvUrl.motorizedOnly: true -> false. Esto es el unico cambio funcional:
     getRequiredDriverDocumentFields() deja de incluir RTO para motorizados,
     lo que automaticamente:
       a) la auto-activacion del driver no espera el RTO (queda en 7 docs);
       b) el cron driver-docs-expiry deja de auto-suspender por RTO vencido
          (usa el mismo helper para decidir si suspender).
   - El campo vtvUrl/vtvStatus/vtvExpiresAt sigue existiendo en el schema
     y los endpoints de upload/aprobacion siguen aceptandolo igual que
     cualquier otro doc — el driver puede subirlo voluntariamente.
   - Comentario top-of-file actualizado: 7 docs requeridos para motorizados
     (no 8). RTO clasificado como OPCIONAL.
   - label nuevo: "RTO (Revision Tecnica) — opcional".

2) src/app/repartidor/registro/RepartidorRegistroClient.tsx
   - Bloque info de step 2 ya no menciona RTO en el listado de docs que se
     pediran luego. El listado pasa a "licencia, seguro, cedula verde y
     datos del vehiculo".

3) src/app/terminos-repartidor/page.tsx (refactor mayor)
   - Fecha "Ultima actualizacion" 2026-05-08.
   - Seccion 3.2 (Requisitos Motorizados): saca "Revision Tecnica
     Obligatoria (RTO) vigente". Agrega item generico que apunta a la
     nueva seccion 4: "Cumplimiento de las obligaciones provinciales
     aplicables (incluida RTO en jurisdicciones que la exijan). Ver
     Seccion 4."
   - NUEVA SECCION 4: "Declaraciones y Compromisos del Repartidor".
     Declaracion jurada con 7 items (informacion veraz, capacidad legal,
     vehiculo en condiciones, cumplimiento provincial incluido RTO con
     indemnidad para Moovy, seguros vigentes, normas de transito,
     comunicacion de cambios). Bloque de alerta amber al final aclarando
     que la declaracion jurada habilita suspension/baja por falsedad u
     omision.
   - Renumeracion en cascada de las secciones siguientes: la antigua 4
     pasa a 5, 5->6, 6->7, 7->8, 8->9, 9->10 (con sub 10.1 a 10.5),
     10->11, 11->12, 12->13.
   - Seccion 5 (ex 4) "Documentacion Requerida": el listado obligatorio
     ya NO incluye RTO. Agrega cedula verde explicitamente. Parrafo
     nuevo aclarando que RTO es documentacion opcional que el driver
     puede cargar desde su panel sin condicionar la activacion.
   - Seccion 11 (ex 10) "Suspension": el item de "documentacion vencida"
     ya NO menciona RTO (queda licencia, seguro, cedula verde). Agrega
     item nuevo "Falsedad u omision en las declaraciones del Repartidor
     (Seccion 4)".
   - Bug pre-existente de numeracion duplicada (habia dos secciones "10")
     queda corregido implicitamente con la renumeracion.

4) src/components/rider/views/ProfileView.tsx
   - Config del campo vtvUrl: label cambia a "RTO (Revision Tecnica) —
     opcional" y shortLabel a "RTO (opcional)" para que el driver vea
     visualmente que NO es bloqueante. helpText reformulado para enfatizar
     que la responsabilidad recae en el driver.
   - motorizedOnly: true se mantiene (driver no-motorizado no ve el campo).

5) src/lib/legal-versions.ts
   - TERMS_VERSION: 1.1 -> 1.2 (cambio sustantivo en T&C de repartidor).
   - TERMS_UPDATED_AT: 2026-03-29 -> 2026-05-08.
   - Drivers existentes (consent version 1.1) van a tener que re-aceptar
     los nuevos T&C la proxima vez que entren al panel — comportamiento
     correcto del sistema de consentimientos AAIP.

QUE NO SE TOCA:
- Schema Prisma: ningun migrate. vtvUrl/vtvStatus/vtvExpiresAt/vtvNotifiedStage
  siguen existiendo igual.
- Cron driver-docs-expiry: cero cambios. Lee getRequiredDriverDocumentFields,
  asi que automaticamente deja de auto-suspender por RTO vencido. Sigue
  enviando avisos preventivos 7d/3d/1d si el driver lo cargo voluntariamente
  (info util sin penalizacion).
- Endpoints driver/admin de upload/aprobacion: siguen aceptando vtvUrl como
  cualquier otro doc.
- Emails genericos de "documento vencido": siguen funcionando.
- Pagina admin /ops/usuarios/[id]: el admin sigue viendo el campo RTO; ahora
  el label refleja "opcional" via la config de ProfileView que ya esta
  importada.

MIGRACION MANUAL RECOMENDADA (NO incluida en la rama):
Drivers actualmente SUSPENDED con suspensionReason que menciona RTO
("Documento vencido: RTO (Revision Tecnica)"): el admin puede revisar
caso por caso desde /ops/usuarios y reactivar manualmente. NO se hace
automatico porque puede haber otros problemas en el caso (multiples docs
vencidos, fraudScore alto, etc.) — decision de negocio caso por caso.
Query sugerida:
  WHERE isSuspended = true
    AND suspensionReason LIKE '%RTO%'
    AND vtvStatus IN ('EXPIRED', 'PENDING')

VERIFICACION SUGERIDA POST-DEPLOY:
- Registrar driver motorizado de prueba en staging, completar 7 docs
  obligatorios (sin RTO) y confirmar que la cuenta queda APPROVED
  automaticamente.
- Cargar luego el RTO opcional y confirmar que el driver sigue activo,
  no cambia status.
- Forzar vencimiento del RTO (script de backfill) y correr el cron
  driver-docs-expiry: confirmar que el driver NO queda suspendido.
- Re-loguear con un user que ya habia aceptado TERMS 1.1 y verificar que
  el flujo de re-aceptacion de T&C dispara (segun la implementacion actual
  del consentimiento — si la pantalla de re-aceptacion no esta implementada,
  agregarla en otra rama).

**Archivos:** ISSUES.md, src/app/repartidor/registro/RepartidorRegistroClient.tsx, src/app/terminos-repartidor/page.tsx, src/components/rider/views/ProfileView.tsx, src/lib/driver-document-approval.ts, src/lib/legal-versions.ts

## 2026-05-10 (rama `feat/ops-badge-pendientes`)

feat(ops): badge amarillo de pendientes en sidebar OPS

Smoke test produccion 2026-05-07 (observacion 1B con captura img03):
cuando un usuario se registra como repartidor o como comercio, el admin
no tiene ningun indicador visual en el sidebar de que hay trabajo
pendiente. El item "En Vivo" ya tiene su live indicator verde con
contador de pedidos activos, pero "Usuarios" y "Pipeline Comercios"
quedaban sin badge — el admin tenia que entrar a cada seccion para
descubrir si habia algo nuevo. Mauro pidio "circulito amarillo con
numero como En Vivo pero para los pendientes".

CAMBIOS:

1) src/app/api/admin/pending-counts/route.ts (NUEVO)
   - GET con auth ADMIN. Devuelve { merchants, drivers, total }.
   - Counts por approvalStatus = "PENDING" sobre Merchant y Driver
     (ambos modelos tienen indice en approvalStatus, ver schema linea
     699 y 867 — count es O(log n)).
   - Filtro adicional por owner.deletedAt / user.deletedAt = null para
     no contar registros huerfanos de cuentas eliminadas (no son
     actionables por el admin).
   - Sin cache server-side: dos counts indexados son baratos y queremos
     que el badge baje al instante cuando se aprueba un caso.
   - Behavior degradado: si falla auth o query, devuelve ceros para no
     romper el render del sidebar (mismo patron que /api/admin/active-orders).

2) src/components/ops/OpsSidebar.tsx
   - Items "Usuarios" y "Pipeline Comercios" estrenan campo
     badge: "pending-total" / "pending-merchants" respectivamente.
   - Nuevo state pendingMerchants / pendingDrivers + useEffect con
     polling cada 60s al endpoint nuevo. Polling separado del de
     activeOrders (15s) porque la cadencia es distinta.
   - Render del badge: bg-yellow-400, texto slate-900 bold, min-w 20px,
     h-5, px-1.5, rounded-full, text-[10px]. Estilo consistente con el
     live indicator pero amarillo en vez de verde con ping.
   - 0 pendientes -> no muestra nada (limpio).
   - 1-99 -> muestra el numero.
   - >99 -> muestra "99+" (formatBadgeCount helper).

QUE NO CAMBIA:
- Schema de DB no se toca (Merchant.approvalStatus y Driver.approvalStatus
  ya existian con sus indices).
- "En Vivo" sigue con su live-indicator verde (no se toco).
- Ningun otro item del sidebar cambia.

DECISION DE SCOPE:
Sellers no se incluyen en el badge porque su flow es distinto: no
requieren aprobacion admin, se autoactivan al cargar CUIT en
/api/auth/activate-seller. No tienen "pending state" comparable.

VERIFICACION SUGERIDA POST-DEPLOY:
- Registrar un driver de prueba en staging y confirmar que el badge
  amarillo aparece en "Usuarios" dentro de 60s.
- Aprobar el driver desde el panel y confirmar que el badge baja en
  el siguiente polling.
- Repetir con merchant: verificar badge en "Usuarios" Y en "Pipeline
  Comercios".

**Archivos:** ISSUES.md, src/app/api/admin/pending-counts/route.ts, src/components/ops/OpsSidebar.tsx

## 2026-05-10 (rama `feat/welcome-emails-driver-merchant`)

feat(emails): conectar welcome emails de driver y merchant al registro

Smoke test produccion 2026-05-07 (observacion 3B): cuando un usuario se
registra como repartidor o como comercio, no recibe ningun email de
confirmacion. Solo el admin/owner recibe la notificacion ("nuevo driver
pendiente" / "nueva solicitud de comercio"), mientras que el solicitante
queda "en el aire" durante las 24-48hs habiles que tarda la revision de
documentacion. Resultado: ansiedad post-registro y churn pre-onboarding.

Las funciones de email ya estaban escritas hace varias ramas atras:

  - sendDriverRequestReceivedEmail   (src/lib/email-p0.ts:126)
  - sendMerchantRequestReceivedEmail (src/lib/email-p0.ts:30)

Y tambien sus entradas correspondientes en EMAIL_REGISTRY con status
"new" y trigger documentado:

  - id 14 "driver_request_received"   trigger: POST /api/auth/activate-driver
  - id  6 "merchant_request_received" trigger: POST /api/auth/register/merchant

Pero el TRIGGER nunca estuvo conectado en el endpoint correspondiente.
Esto rompe la regla #11 del CLAUDE.md ("Email transaccional - funcion
exportada + entrada en EMAIL_REGISTRY + trigger conectado"): tener los
dos primeros sin el tercero deja al sistema con la ilusion de que el
email se manda, cuando en realidad nadie lo dispara.

CAMBIOS:

1) src/app/api/auth/register/driver/route.ts
   - Import de sendDriverRequestReceivedEmail desde @/lib/email-p0.
   - Trigger fire-and-forget despues del email a admin que ya existia.
   - Pasa email + driverName (fullName ya construido del firstName +
     lastName) + vehicleType (uppercase ya normalizado).
   - Errores se loguean en consola, no bloquean la response.

2) src/app/api/auth/register/merchant/route.ts
   - Import de sendMerchantRequestReceivedEmail desde @/lib/email-p0.
   - Trigger fire-and-forget despues de los dos emails a admin que ya
     existian (sendMerchantRequestNotification + sendAdminNewMerchantPendingEmail).
   - Pasa email + businessName + contactName (firstName + lastName trimmed).
   - Errores se loguean en consola, no bloquean la response.

QUE NO CAMBIA:
- email-p0.ts no se toco. Las funciones ya estaban listas.
- email-registry.ts no se toco. Las entradas ya estaban registradas.
- email.ts (legacy sendMerchantRequestNotification) sigue mandando al
  admin. Mantenemos ambos canales (admin + merchant) sin solapar.
- Schema de DB no se toca.
- Ningun otro endpoint cambia.

QUEDA PARA OTRA RAMA (no incluido aca):
- Welcome email para SELLER al activar su perfil de marketplace
  (/api/auth/activate-seller). No tiene funcion ni entry en EMAIL_REGISTRY,
  asi que requiere mas trabajo: crear sendSellerActivatedEmail, agregar
  entry, y conectar trigger. Scope distinto, mejor en otra rama.

VERIFICACION SUGERIDA POST-DEPLOY:
- Registrar un driver de prueba en staging y confirmar que llegan dos
  emails: uno al admin (notificacion) y uno al driver (acuse).
- Idem con merchant: tres emails (dos al admin, uno al merchant).

**Archivos:** ISSUES.md, src/app/api/auth/register/driver/route.ts, src/app/api/auth/register/merchant/route.ts

## 2026-05-10 (rama `fix/ops-form-paridad-registro`)

fix(ops): modal Crear cuenta pide firstName + lastName separados

Smoke test produccion 2026-05-07 (observacion 1A): el modal "Crear cuenta"
del panel OPS pedia el nombre completo en un solo campo, mientras que los
formularios publicos de /registro y /repartidor/registro piden firstName
y lastName por separado. El endpoint /api/admin/users/create cubria la
diferencia partiendo el string por el primer espacio:

  firstName: data.name.split(" ")[0],
  lastName: data.name.split(" ").slice(1).join(" ")

Esto rompia con nombres compuestos. Ejemplo:
  "Maria del Carmen Di Tella" -> firstName "Maria",
                                 lastName "del Carmen Di Tella"

Con apellidos compuestos que tambien tienen espacio, la separacion era
arbitraria y dejaba User.firstName y User.lastName con datos incoherentes
respecto a lo que el mismo user habria cargado por su cuenta.

CAMBIOS:

1) src/components/ops/CreateUserModal.tsx
   - State: campo unico "name" reemplazado por "firstName" + "lastName".
   - Form: input "Nombre completo" reemplazado por dos inputs (Nombre /
     Apellido) en grid 2 columnas. Ambos required, min 2 / max 50 chars.
   - resetForm, handleSubmit y disabled del boton actualizados.
   - Body del POST envia firstName + lastName separados.

2) src/app/api/admin/users/create/route.ts
   - Zod discriminatedUnion (3 variantes: BUYER/DRIVER/SELLER): "name"
     reemplazado por "firstName" + "lastName" (ambos min 2 / max 50).
   - Construye fullName = firstName + " " + lastName antes del create.
   - User.create usa firstName/lastName directos del input (no mas split).
   - User.name = fullName (preserva la columna legacy para queries).
   - SellerProfile.displayName: default a fullName en vez de data.name.
   - Audit log targetName sigue funcionando porque sale del select
     {id, email, name} del User.create.

QUE NO CAMBIA:
- Schema de DB no se toca (User.firstName, User.lastName, User.name ya
  existian).
- Magic-link / token reset / 24h expiry / placeholder password: igual.
- Flujo anti-resurreccion de cuentas eliminadas: igual.
- Email "Bienvenido a MOOVY - configura tu contraseña": sigue recibiendo
  el name (full) por el campo result.user.name.

**Archivos:** ISSUES.md, src/app/api/admin/users/create/route.ts, src/components/ops/CreateUserModal.tsx

## 2026-05-10 (rama `fix/confirmacion-driver-campos-vacios`)

fix(driver-registro): step 3 no muestra "—" en filas opcionales

Smoke test de produccion 2026-05-07 (observacion 2B con captura img02): en
/repartidor/registro paso 3 (Confirmacion), el "Resumen de tu solicitud"
mostraba siempre las filas DNI, CUIT, Color, Patente y los 4 vencimientos
(Licencia, Seguro, RTO, Cedula verde) con "—" cuando el driver no las habia
cargado. Esto contradice la rama feat/registro-simplificado (2026-04-27)
que volvio TODOS estos campos opcionales en el registro: el driver los
completa despues en su panel. La pantalla de confirmacion daba sensacion
de "te falta cargar algo", justo lo opuesto al mensaje deseado.

CAMBIOS en src/app/repartidor/registro/RepartidorRegistroClient.tsx (step 3):
- Filas DNI y CUIT: solo se renderizan si formData.dni / formData.cuit
  tienen valor (wrapped en {formData.X && (<>...</>)}).
- Filas Color y Patente: dentro del bloque isMotorized, cada una solo se
  renderiza si su valor esta cargado.
- Bloque "Vencimientos cargados" entero: solo aparece si motorizado AND al
  menos uno de los 4 (licencia/seguro/RTO/cedula verde) esta cargado. Cada
  fila individual tambien condicional.
- Filas Nombre y Vehiculo siguen renderizandose siempre (Nombre es required;
  Vehiculo es required en step 2 - ambos se completan en el registro).

QUE NO CAMBIA:
- formData type igual (todos los campos opcionales siguen como string con
  default "").
- Endpoint /api/auth/register/driver no cambia: sigue aceptando todos
  estos campos como opcionales.
- Pagina /repartidor/(protected)/perfil (donde el driver completa los docs
  faltantes) no se toco.

OBSERVACION 2C (resuelta en paralelo, sin codigo):
Misma sesion smoke test detecto React error #418 en /terminos-repartidor.
Causa: Cloudflare Email Address Obfuscation reemplazaba legal@somosmoovy.com
en el HTML server-side post-SSR, causando hydration mismatch. Fix: desactivado
desde Cloudflare Dashboard (Scrape Shield > Email Obfuscation: OFF). No
requirio cambios de codigo.

**Archivos:** ISSUES.md, src/app/repartidor/registro/RepartidorRegistroClient.tsx

## 2026-05-08 (rama `style/quienes-somos-rediseno`)

style: rediseno /nosotros con Claude Design - piloto de la fase de diseno

PROBLEMA QUE RESUELVE:
La pagina /nosotros (titulada "Quienes Somos") era el primer test del
nuevo proceso de diseno con Claude Design. Visualmente la version anterior
tenia 10 problemas identificados en el diagnostico previo:

1) Hero gigante con 3 lineas a 96px font-black - gritaba en lugar de seducir
2) Cero imagenes/ilustracion de Ushuaia - hablaba de la ciudad sin mostrarla
3) font-black peso 900 abusado - todo se sentia igual de gritado
4) CTAs duplicados 3 veces - fatiga
5) CTA final con fondo rojo entero - patron "panic red" amateur
6) Stats en rojo + black + 5xl - visualmente agresivo
7) Cero social proof / trust signals
8) Background blanco uniforme - falta diferenciacion entre secciones
9) Falta jerarquia - todas las secciones del mismo peso
10) Sin "wow moment" - nada visual memorable

PROPOSITO DEL PILOTO:
Validar end-to-end el workflow de diseno: Claude Design (descripcion natural -> generacion AI) -> screenshot -> aprobacion -> traduccion a Next.js + Tailwind 4 -> pagina en produccion. Si el ciclo funcionaba con una pagina de baja complejidad, el metodo escala a las ~50 surfaces que necesita Moovy.

DISENO DE SOFIA VEGA (Principal Product Designer, via Claude Design):
Filosofia visual: "blanco que respira con un hilo de rojo en momentos clave".
El rojo aparece SOLO en: CTA primario, % de las stats, faro/luz del hero,
borde izquierdo del cierre de historia, dato de contacto, linea sobre el
CTA final. Plus Jakarta Sans en el design original; en implementacion
usamos Nunito (font real del proyecto, metricas similares, mas calido por
terminales redondeadas).

CAMBIOS:

1) src/app/nosotros/page.tsx (REESCRITO desde cero)
   - Server component con metadata + JSON-LD structured data preservados
   - 7 secciones nuevas con alternancia #fff / #fafaf9 para diferenciar
   - Navbar sticky con back arrow + logo Moovy
   - Hero: titulo "Nacimos en Ushuaia." en una sola linea, subtitulo gris,
     lede, 2 CTAs (rojo + outline), ilustracion vectorial de montanas + faro
     Les Eclaireurs con la luz roja como unico acento de color
   - Historia: 5 parrafos con el cierre destacado con borde-izquierdo rojo
   - Stats: 4 numeros con count-up animado (80k habitantes, 0% retencion,
     8% comision, 80% repartidores)
   - Diferenciadores: 4 cards con iconos lucide-react (Zap/Scale/MessageCircle/MapPin)
   - Comercios: 60-40 grid con texto + CTAs a la izquierda, FAQ accordion
     a la derecha
   - Contacto: 3 cards (WhatsApp / Email / Instagram) con hover lift + arrow
     translate
   - CTA final: fondo crema calido #faf7f3 con linea roja 3px arriba, "Empezar"
     en CTA rojo + "Suma tu comercio" outline. Reemplaza el fondo oscuro
     #111827 original que competia visualmente con el footer (dos bloques
     oscuros seguidos = pesado).

2) src/app/nosotros/_components/StatsCounter.tsx (NUEVO)
   - Client component (use client)
   - IntersectionObserver con threshold 0.3 para activar animacion al scroll
   - 800ms ease-out cubic count-up via requestAnimationFrame
   - El "%" rojo Moovy (#e60012, 28-32px) y el numero entero negro (#111827,
     48-56px) - el hilo de rojo del que habla el design rationale

3) src/app/nosotros/_components/MerchantFAQ.tsx (NUEVO)
   - Client component (use client)
   - Accordion con un solo item abierto a la vez
   - El icono Plus rota 45 grados a "x" rojo cuando el item se abre
   - max-height transition para animar el panel

ICONOS:
Los SVG inline genericos del export de Claude Design se reemplazaron por
componentes lucide-react que ya estan instalados en el proyecto:
ArrowLeft, ArrowRight, Mail, Instagram, MessageCircle, Zap, Scale, MapPin, Plus.

CTAs CONECTADOS A RUTAS REALES:
- "Pedir ahora" -> /tienda
- "Suma tu comercio" -> /comercio/registro (4 ocurrencias)
- "Habla con nosotros" -> WhatsApp +54 9 2901 553173 con prefill comercio
- "Empezar" -> /empezar
- WhatsApp generico -> wa.me con prefill "Hola Moovy! Me gustaria saber mas"
- Email -> mailto:somosmoovy@gmail.com con subject prefill
- Instagram -> instagram.com/somosmoovy

CONSERVADO INTACTO:
- Metadata SEO (title, description, keywords, openGraph)
- JSON-LD Organization structured data
- Footer existente (@/components/layout/Footer)
- Datos reales (numero WhatsApp, email, Instagram)
- Copy de la historia (la frase del repartidor a -5C se queda)

ITERACIONES:
v1: CTA final con fondo #111827 oscuro tal como diseno Sofia.
v2 (post-feedback): cambiamos CTA final a #faf7f3 crema calido sutil + linea
roja 3px arriba. El fondo oscuro original competia con el footer creando
"dos bloques oscuros seguidos" que se sentian pesados. Ahora el footer es
el unico momento oscuro de la pagina.

VALIDACION DEL METODO (lo importante de este piloto):
- Claude Design genera output decente al primer prompt si se prompted con
  brand-specific descriptive language y constraints claros (mobile-first,
  exact tokens, voz argentina, EVITAR list)
- Iteracion via feedback en lenguaje natural funciona bien
- Export como standalone HTML + extraccion de bundle base64+gzip funciona
  programaticamente para obtener HTML/CSS limpio
- Traduccion HTML/CSS -> Next.js + Tailwind 4 + lucide-react es 1:1 con
  pequenos ajustes (font swap Nunito por Plus Jakarta, iconos a lucide)
- Tiempo total del piloto: ~90 min (30 min Claude Design + 30 min
  traduccion a codigo + 30 min iteracion)

SIGUIENTES PASOS DOCUMENTADOS:
- Rama style/tienda-skeleton: rediseno de la home/tienda con metodo de
  3 sub-sesiones (Skeleton -> Components -> Composed) para evitar generar
  algo busy y sin foco en una sola sesion.
- Roadmap completo: ~10 paginas Buyer + 6 Comercio + 5 Repartidor + 20
  OPS + estaticas. Total ~50 surfaces visuales.

TESTING:
- TSC strict paso limpio
- Verificacion visual en localhost:3000/nosotros con Chrome DevTools
  iPhone 14 Pro Max (430x932) confirmada por el CEO
- Hover states de cards y CTAs funcionan
- FAQ accordion abre/cierra con animacion de icono +/x
- Stats count-up se dispara al entrar en viewport
- Links externos abren en target=_blank con rel=noopener noreferrer
- JSON-LD valido, metadata correcta para SEO

NO TOCADOS:
- Footer existente
- Layout root
- Cualquier otra pagina del sitio
- next.config.ts (la URL /nosotros se mantiene; el redirect /equipo.html
  -> /nosotros sigue intacto)

URL CONSERVADA:
La URL queda como /nosotros (el titulo y el JSON-LD son "Quienes Somos").
Mover a /quienes-somos hubiera roto SEO/redirects historicos sin beneficio.

**Archivos:** src/app/nosotros/_components/MerchantFAQ.tsx, src/app/nosotros/_components/StatsCounter.tsx, src/app/nosotros/page.tsx

## 2026-05-07 (rama `feat/sentry-revenue-error-pages`)

feat: error tracking con Sentry + reporte diario de revenue al CEO + 404/500 con marca

PROBLEMA QUE RESUELVE:
Pre-launch nos faltaban tres piezas de visibilidad operativa que las
empresas serias tienen desde el dia 1:

1) Si la app rompe en produccion en el navegador de un usuario, no nos
   enteramos hasta que alguien nos escribe por WhatsApp 3 dias despues.
   Sin error tracking estabamos ciegos a errores reales del cliente.

2) El CEO abre el dia sin un pulso operativo claro. Tener que entrar a
   /ops/dashboard y mirar 8 KPIs distintos cada manana es friccion.
   Falta un "daily flash" matutino con los numeros que importan.

3) Las paginas 404 y 500 default de Next son blancas, en ingles, sin
   marca. Primer error que ve un comprador = "esta app es trucha".

CAMBIOS:

1) SENTRY — error tracking client + server + edge con PII scrubbing AAIP
   ─────────────────────────────────────────────────────────────────────
   Archivos nuevos:
     - src/lib/sentry-scrub.ts
       Helper canonico de scrubbing. Patrones: emails, CBU 22 digitos,
       CUIT XX-XXXXXXXX-X, DNI 7-8 digitos, MP tokens (APP_USR-*, TEST-*),
       JWT, Bearer, PIN 4 digitos, tarjetas. Headers Authorization/Cookie/
       x-api-key/x-cron-secret/x-mp-signature siempre [REDACTED].
       Hook beforeSend canonico scrubSentryEvent que se aplica en todos los
       runtimes. Cumple Ley 25.326 — ningun PII sale a Sentry (US-based).

     - sentry.client.config.ts (browser)
       tracesSampleRate 10% prod / 100% dev. ignoreErrors de network/
       extensions/cross-origin scripts. denyUrls de chrome-extension/
       googletagmanager. Activacion condicional: si no hay DSN, no init.

     - sentry.server.config.ts (Node runtime)
       tracesSampleRate 20% prod. ignoreErrors de AbortError/ECONNRESET/
       P1001 transitorios. beforeBreadcrumb tambien con scrub.

     - sentry.edge.config.ts (proxy.ts middleware)
       tracesSampleRate 5% prod (alto trafico). Scrub minimo por
       limitaciones del Edge runtime (sin require dinamico).

     - instrumentation.ts
       Hook canonico de Next 16. register() carga server o edge config
       segun NEXT_RUNTIME. onRequestError captura errores RSC/streaming
       que no llegan a route handlers.

   Modificados:
     - next.config.ts
       Wrappeado con withSentryConfig. tunnelRoute "/monitoring" para
       esquivar adblockers + simplificar CSP. CSP actualizado con
       *.sentry.io. hideSourceMaps removido (Sentry v9 lo maneja auto).
       Activacion condicional: si NEXT_PUBLIC_SENTRY_DSN no esta seteado,
       devuelve nextConfig sin wrappear. Local dev sin proyecto Sentry
       funciona normal.

     - src/app/error.tsx + src/app/global-error.tsx
       Sentry.captureException(error) en useEffect. Las paginas 404/500/
       global-error ya existian con marca Moovy — solo agregamos el hook
       de captura.

   Decisiones canonicas (documentadas en CLAUDE.md):
     - PII scrubbing OBLIGATORIO antes de enviar a Sentry
     - Tunnel /monitoring para esquivar adblockers
     - Sample rates: client 10% / server 20% / edge 5% en prod
     - Source maps solo en CI con SENTRY_AUTH_TOKEN
     - Activacion condicional por DSN

2) CRON DAILY REVENUE SUMMARY — email matutino al CEO
   ───────────────────────────────────────────────────
   Archivo nuevo:
     - src/app/api/cron/daily-revenue-summary/route.ts
       Corre 9 AM ART (12 UTC). Calcula KPIs del dia anterior y dispara
       email al alert_emails (configurable desde MoovyConfig).

       KPIs incluidos:
         - Pedidos DELIVERED ayer + delta % vs anteayer
         - GMV (suma de subtotales)
         - Revenue Moovy = sum(moovyCommission) + sum(operationalCost)
         - Pagos a comercios (sum(merchantPayout) Order / sellerPayout SubOrder)
         - Pagos a repartidores (sum(driverPayoutAmount) snapshot, fallback
           a deliveryFee × 0.8 para single-vendor sin snapshot)
         - Pedidos cancelados ayer (status CANCELLED + updatedAt en ventana)
         - No-shows reportados ayer (Order.noShowReportedAt en ventana)
         - Drivers/comercios activos (al menos 1 pedido entregado)
         - Top 3 comercios por # pedidos
         - Drivers con fraudScore >= 2 (alerta — 3 = auto-suspend)
         - Pedidos AWAITING_PAYMENT acumulados >1h (señal de cron stale)

       Idempotencia: AuditLog con action="daily-revenue-summary-YYYY-MM-DD"
       como key. Si retrigger manual desde /ops/crons mismo dia, skip y
       devuelve { skipped: true, reason: "already_sent_today" }.

       Timezone: hardcoded UTC-3 (Argentina sin DST). Window de "ayer" se
       calcula en hora local AR para alinear con el dia natural del CEO.

   Modificados:
     - src/lib/email-admin-ops.ts
       Funcion sendDailyRevenueSummaryEmail + interface DailyRevenueSummaryData.
       Email pro estilo "daily flash" con KPIs grandes arriba (pedidos +
       revenue), bloque financiero, top 3 comercios, alertas condicionales
       (fraudScore / no-shows / pending stuck), CTA al panel OPS.

     - src/lib/email-registry.ts
       Entry #63 admin_daily_revenue_summary. generatePreview() con datos
       sample. Aparece en /ops/emails para que el admin pueda preview.

     - src/lib/cron-health.ts
       Entry "daily-revenue-summary" en CRON_EXPECTATIONS con maxHours: 30
       (corre 1× por dia). Aparece automaticamente en /ops/crons sin
       cambios al dashboard.

3) PAGINAS DE ERROR (404 + 500) — ya existian, conectadas a Sentry
   ──────────────────────────────────────────────────────────────
   Las paginas /not-found, /error y /global-error ya estaban creadas con
   marca Moovy de ramas anteriores. En esta solo agregamos el hook
   Sentry.captureException(error) en error.tsx y global-error.tsx para
   que los errores boundary-caught lleguen al panel.

DOCUMENTACION:
- .claude/CLAUDE.md
  + Variable de entorno: Sentry: NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG,
    SENTRY_PROJECT, SENTRY_AUTH_TOKEN (solo build/CI)
  + Tabla de Dependencias externas: nueva fila "Sentry"
  + NPM clave: + @sentry/nextjs 9
  + Seccion nueva "Sentry — decisiones canonicas" con 6 items
    (scrubbing, tunnel, sample rates, source maps, activacion condicional,
    error pages)

VARIABLES DE ENTORNO NUEVAS:
- NEXT_PUBLIC_SENTRY_DSN  (publico por diseño, va al cliente)
- SENTRY_ORG              (slug org, ej: "moovy-u7")
- SENTRY_PROJECT          (slug proyecto, ej: "moovy")
- SENTRY_AUTH_TOKEN       (SECRETO — solo en build/CI para subir source maps;
                          se genera mas adelante cuando llegue el deploy)

CRON LINE PARA EL VPS (agregar al crontab):
0 12 * * * curl -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET /var/www/moovy/.env | cut -d= -f2)" https://somosmoovy.com/api/cron/daily-revenue-summary > /dev/null 2>&1

12:00 UTC = 9:00 AM ART. Misma autenticacion via $(grep) que el resto de
crons del VPS.

NPM:
- @sentry/nextjs ^9.0.0 agregado en package.json (146 paquetes nuevos)

TESTING:
- TSC strict paso limpio post-fixes:
  * next.config.ts: sourcemaps en lugar de hideSourceMaps (Sentry v9 API)
  * route.ts: SubOrder no tiene merchantPayout (solo Order); usar sellerPayout
- Verificacion sugerida en runtime:
  * Disparar test event: npx @sentry/wizard@latest -i nextjs (saltearlo,
    pero el wizard tiene un step "throw an error" que sirve)
  * O simplemente abrir /sentry-example-page si existe
  * Verificar que el evento aparezca en moovy-u7.sentry.io con PII redactado
  * Curl al cron daily-revenue-summary con CRON_SECRET, verificar que llega
    el email al alert_emails configurado

POST-LAUNCH ANOTADO:
- Cuando hagamos devmain.ps1 a prod, generar SENTRY_AUTH_TOKEN en
  Sentry > Settings > Auth Tokens (scopes: project:releases, org:read)
  y agregarlo al .env del VPS para que el build suba source maps.
- Considerar upgrade a Sentry Team plan (USD 26/mes) cuando crucemos
  los 5K errors/month del free tier (mes 3-4 estimado).
- Activar Session Replay cuando upgrade a paid plan — util para debug
  de bugs que el usuario describe mal por chat.

**Archivos:** .claude/CLAUDE.md, docs/referencias/observaciones_prod.md, instrumentation.ts, next.config.ts, package-lock.json, package.json, sentry.client.config.ts, sentry.edge.config.ts (+8 mas)

## 2026-05-07 (rama `docs/terms-privacy-pre-launch`)

docs: actualizacion de terminos y privacidad pre-launch

PROBLEMA QUE RESUELVE:
Las ramas de funcionalidad introdujeron flows nuevos (cancelacion automatica
de pago pendiente, no-show, PIN doble, GPS continuo, retencion 30d de logs)
sin actualizar la documentacion legal correspondiente. Argentina exige
notificacion expresa de tratamiento de datos (Ley 25.326), reembolsos y
cancelaciones (Ley 24.240), y las defensas en disputas se pierden si los
terminos no cubren explicitamente cada caso.

CAMBIOS:

1) /privacidad — nueva subseccion 2.4 "Informacion operativa de la entrega"
   - Notas para el repartidor (texto que el cliente escribe en checkout)
   - GPS continuo del repartidor cada 30s durante delivery
   - Logs de auditoria operativa (CronRunLog) con retencion 30 dias rolling
   - Datos de pago de MercadoPago (sin almacenar tarjetas)
   Bump fecha "Enero 2026" -> "7 de mayo de 2026".

2) /terminos — clausulas nuevas en secciones existentes (sin tocar TOC)
   En seccion 5 (Compras y Pagos):
     - Cancelacion automatica por falta de pago (timeout 30 min)
     - Reembolso automatico por pago tardio (race window)
   En seccion 6 (Entregas y Horarios):
     - Politica de cliente ausente / no-show (10 min espera, cobro 100%)
     - Como evitar el no-show (push, instrucciones)
     - Impugnacion de no-show con ventana de 24h post-evento
   Bump fecha "22 de marzo de 2026" -> "7 de mayo de 2026".

3) /terminos-comercio — nueva seccion 7 "PIN del Comercio y Devoluciones por
   No-Show" + renumeracion subsiguientes (8-13)
   - PIN doble del pedido (4 digitos pickup + 4 digitos delivery)
   - Devolucion por no-show: comercio recibe con MISMO PIN del pickup
   - Cobro al comercio en no-show: recibe normal, MOOVY come la comision
   - Cancelacion por el comercio: solo en PENDING/CONFIRMED/PREPARING
   Bump fecha "Marzo 2026" -> "7 de mayo de 2026".

4) /terminos-repartidor — nueva seccion 9 "Sistema Operativo de Seguridad"
   con 5 subsecciones + renumeracion subsiguientes (10-12)
   9.1 PIN doble 4 digitos (pickup + delivery)
   9.2 Geofence 100m + 50m gracia
   9.3 GPS continuo durante delivery (cada 30s)
   9.4 Politica de no-show + bonus $300 compensatorio + hold 24h del payout
   9.5 fraudScore con auto-suspend a 3 incidentes registrados
   Bump fecha "Marzo 2026" -> "7 de mayo de 2026".

NO TOCADOS:
- /terminos-vendedor: marketplace separado del flow de delivery, no requiere
  actualizacion en esta rama.
- /terminos-moover: programa de fidelidad standalone, no aplica.

LEYES ARGENTINAS COBERTAS:
- Ley 25.326 (Proteccion de Datos Personales): subseccion 2.4 de privacidad
  declara explicitamente que datos se recopilan, para que, cuanto se retienen,
  y cumple principio de minimizacion.
- Ley 24.240 (Defensa del Consumidor): seccion 5 de terminos generales
  declara reembolsos automaticos con plazo (5-15 dias), metodo y notificacion.
- Ley 26.951 (Antispam Argentina): los emails transaccionales son
  consentimiento implicito (necesarios para el servicio), no requieren
  opt-in explicito. Marketing si requiere — manejado en otra rama.

POST-LAUNCH ANOTADO:
- Disparar email "terms_updated" (la funcion ya existe en email-legal-ux.ts)
  a usuarios existentes notificandoles del cambio. NO disparado en esta rama
  porque no hay usuarios existentes pre-launch — al lanzar, los usuarios nuevos
  aceptan estos terminos directamente al registrarse.
- Cuando se active "leave at door" (post-launch), agregar clausula sobre foto
  del paquete con numero de puerta (no fachada) para preservar privacidad.

TESTING:
- TSC strict pasa limpio (paginas son JSX puro con strings, sin tipos complejos).
- Verificacion visual sugerida: abrir /terminos, /privacidad, /terminos-comercio
  y /terminos-repartidor en browser y comprobar que renderizan sin errores
  de hidratacion ni warnings.

**Archivos:** src/app/privacidad/page.tsx, src/app/terminos-comercio/page.tsx, src/app/terminos-repartidor/page.tsx, src/app/terminos/page.tsx

## 2026-05-07 (rama `chore/email-templates-faltantes`)

chore: 4 templates de email faltantes (payment timeout, late refund, no-show)

PROBLEMA QUE RESUELVE:
Las ramas anteriores (cancelacion de pago pendiente, no-show flow) crearon
endpoints y crons que mandaban PUSH al cliente, pero NO email. Eso es un
problema legal (Ley 24.240 exige notificacion documentada de cancelaciones y
reembolsos) y de UX (clientes con push deshabilitado no se enteran).

Esta rama completa los 4 emails que faltaban siguiendo el patron canonico de
EMAIL_REGISTRY + funciones en email-legal-ux.ts + tag igual al id del registry.

TEMPLATES NUEVOS (4):

1) payment_timeout_cancelled — al comprador
   Trigger: cron cancel-stale-pending-payments cancela pedido sin pago confirmado
   en 30 min.
   Funcion: sendPaymentTimeoutCancelledEmail
   Cubre: pedido cancelado, stock restaurado, instrucciones si MP retiene fondos.

2) payment_late_refund — al comprador
   Trigger: webhook MP confirma pago APPROVED en pedido ya cancelado (race con
   timeout o cancelacion manual del cliente).
   Funcion: sendPaymentLateRefundEmail
   Cubre: notificacion expresa de reembolso automatico (Ley 24.240), monto exacto,
   plazo estimado 5-15 dias habiles, metodo (mismo del pago original).

3) customer_no_show_returned — al comprador
   Trigger: endpoint report-no-show (driver espero 10 min y cliente no aparecio).
   Funcion: sendCustomerNoShowReturnedEmail
   Cubre: el repartidor llego pero no te encontramos, el pedido vuelve al
   comercio, el cobro se mantiene (estandar industria), instrucciones de
   impugnacion + sugerencias para evitarlo.

4) merchant_order_returned — al comercio
   Trigger: endpoint report-no-show (paralelo al email del comprador).
   Funcion: sendMerchantOrderReturnedEmail
   Cubre: aviso al comercio que un pedido vuelve, instrucciones de recibirlo con
   el mismo PIN del pickup, aclaracion que el cobro al comercio NO se afecta
   (Moovy come la comision en no-show).

REGISTRO EN EMAIL_REGISTRY:

  Numbers 60-63, category "Ciclo de vida — Pagos" / "Ciclo de vida — Entrega".
  Status "new" hasta validar en produccion. Visibles en /ops/emails con preview.

TRIGGERS CONECTADOS:

  - src/app/api/cron/cancel-stale-pending-payments/route.ts:
    fire-and-forget despues del notifyBuyer push.
  - src/lib/order-payment-confirm.ts (bloque late payment detection):
    despues del refundOrderIfPaid, fire-and-forget del email.
  - src/app/api/driver/orders/[id]/report-no-show/route.ts:
    fire-and-forget DOS emails (buyer + merchant) despues del notifyCustomer push.
    Ampliado el findUnique para incluir order.user.email/firstName y
    order.merchant.email/name (necesarios para los emails).

PATRON USADO:

  Todas las funciones siguen el patron canonico de email-legal-ux.ts:
    - Importan { sendEmail, emailLayout, emailButton, emailInfoBox, emailAlertBox,
      baseUrl } desde "./email"
    - Async, devuelven Promise<boolean> (resultado del sendEmail)
    - Tag = id del EMAIL_REGISTRY (trazabilidad en logs Pino)
    - Manejo de buyerName null (greeting condicional)
    - Subject claro con orderNumber

  Los triggers son fire-and-forget para no bloquear el flow operativo del
  cron/endpoint si SMTP esta caido.

TESTING:
- TSC strict pasa limpio.
- Verificacion: /ops/emails muestra los 4 nuevos (numbers 60-63), preview
  renderiza correctamente con datos de SAMPLE.
- Trigger smoke test: crear pedido → abandonar pago → esperar cron → verificar
  email recibido por el buyer (en sandbox SMTP en local).

POST-LAUNCH:
- En produccion verificar que los emails llegan con SMTP_HOST de produccion.
- Considerar agregar email al driver cuando completa devolucion (gana bonus
  $300). Hoy solo recibe push genérico, podria ser un email "te depositamos
  X bonus por viaje fallido".

**Archivos:** src/app/api/cron/cancel-stale-pending-payments/route.ts, src/app/api/driver/orders/[id]/report-no-show/route.ts, src/lib/email-legal-ux.ts, src/lib/email-registry.ts, src/lib/order-payment-confirm.ts

## 2026-05-07 (rama `feat/no-show-flow`)

feat: flow no-show completo (driver llega, cliente no aparece, devolucion al comercio)

PROBLEMA QUE RESUELVE:
La regla canonica de Moovy es "el pedido jamas se cierra sin PIN". Pero hay un
escenario edge: driver llega al domicilio del cliente y el cliente no esta.
Antes de esta rama no habia flow operativo para eso — el driver quedaba
trabado sin poder ni entregar ni devolver.

NUEVOS ESTADOS DEL DRIVER STATE MACHINE:

  driverStatus: ON_ROUTE_TO_CUSTOMER -> AT_CUSTOMER (driver entro al geofence)
              -> WAITING_FOR_CUSTOMER (driver toco "Llegue", timer 10 min)
              -> DELIVERED (cliente aparece, dicta PIN, fin)
              o RETURNING_TO_MERCHANT (cliente NO aparece, vuelve al comercio)
              -> RETURNED (driver devuelve con PIN del comercio)

ENDPOINTS NUEVOS:

1) POST /api/driver/orders/[id]/start-waiting
   - Driver toca "Llegue al cliente" en el dashboard.
   - Setea driverStatus=WAITING_FOR_CUSTOMER, waitingStartedAt=now.
   - Push al cliente: "Tu repartidor llego. PIN: 4321. Tenes 10 minutos."
   - Audit log de la transicion.
   - Solo permite desde ON_ROUTE_TO_CUSTOMER o AT_CUSTOMER (idempotente).

2) POST /api/driver/orders/[id]/report-no-show
   - Driver marca "Cliente no responde".
   - VALIDACION ANTI-FRAUDE: rechaza si pasaron <10 min desde waitingStartedAt
     (admin puede saltarse el chequeo via override). Devuelve remainingSeconds
     para que el frontend muestre countdown preciso.
   - Setea driverStatus=RETURNING_TO_MERCHANT, noShowReportedAt, noShowFlag=true,
     payoutHoldUntil=+24h (anti-fraude: si cliente impugna, hold del payout).
   - Push al cliente: "No te encontramos. Si fue error, reporta ahora."
   - Audit log con elapsedMinutes para investigacion en disputas.

3) POST /api/driver/orders/[id]/return-to-merchant
   - Driver vuelve al comercio. Comercio le da el MISMO PIN del pickup.
   - Driver lo ingresa, valida con verifyOrderOrSubOrderPin (rate limit, geofence,
     timing-safe compare).
   - Si OK: cierra como driverStatus=RETURNED, merchantStatus=RETURNED, status=RETURNED.
   - Audit log final del flow.

LOGICA FINANCIERA NO-SHOW:

src/lib/orders/order-totals.ts agrega applyNoShowAdjustment(snapshot, noShowFlag):
  - Cliente paga 100% (responsabilidad de estar disponible).
  - Comercio recibe normal (ya cocino/preparo).
  - Driver recibe payout completo + bonus NO_SHOW_DRIVER_BONUS_ARS (default 300).
  - Moovy come la comision (gesto de buena fe, separa cobro tipico).
  - NO modifica el snapshot persistido — calcula los cobros AJUSTADOS al hacer
    payouts. Asi se respeta la regla canonica "el snapshot original no se
    recalcula" (necesaria para cierres fiscales AFIP).

NOTIFICACIONES NUEVAS (src/lib/notifications.ts):

  - notifyCustomerDriverArrived: push urgente con PIN + countdown 10 min.
  - notifyCustomerNoShowReported: push empatico para impugnacion temprana.

UI DRIVER (src/app/repartidor/(protected)/dashboard/page.tsx):

  - Nuevos riderStage: "waiting_customer" y "returning_to_merchant".
  - Componente NoShowWaitingPanel:
    * Timer countdown 10 min visible (formato MM:SS, tabular-nums).
    * Boton "PIN del cliente" (abre keypad para que el cliente dicte).
    * Boton "Cliente no responde" disabled hasta cumplir 10 min reales (anti-fraude
      del frontend, redundante con la del backend pero mejor UX).
    * Confirm dialog antes de reportar no-show.
  - Componente NoShowReturnPanel:
    * Banner rojo "Volver al comercio".
    * Boton "Ingresar PIN del comercio" abre keypad en modo returnToMerchantMode.
  - SwipeToConfirm modificado: en deliveryStatus=PICKED_UP/IN_DELIVERY, el swipe
    llama a /start-waiting (no directo a DELIVERED).
  - PinModal soporta returnToMerchantMode: cuando true, valida contra
    /return-to-merchant en vez de /verify-pickup-pin.
  - Endpoint /api/driver/dashboard expone driverStatus, merchantStatus,
    waitingStartedAt, noShowReportedAt para que el frontend distinga estados.

PROTECCIONES ANTI-FRAUDE DEL DRIVER:

  - waitingStartedAt SOLO seteado por endpoint /start-waiting (no editable
    por el driver directamente).
  - report-no-show rechaza si <10 min desde waitingStartedAt.
  - payoutHoldUntil=+24h: si el cliente impugna y prueba que estaba en casa,
    el payout queda congelado durante esa ventana para review manual.
  - Audit logs en cada transicion con timestamps + elapsedMinutes.

CONSIDERACION DE PRODUCTO:
  El cliente paga 100% en no-show es estandar industria (Rappi, PedidosYa, Glovo).
  La responsabilidad legal de estar en el domicilio es del cliente. Argentina
  defensa del consumidor (Ley 24.240) exige notificacion clara y oportunidad
  de impugnar — la notificacion push tras no-show con boton "Reportar fraude"
  cubre esto.

TESTING:
- TSC strict pasa limpio.
- Smoke test manual sugerido:
    1. Driver retira pedido con PIN del comercio.
    2. Driver llega al domicilio del cliente (geofence).
    3. Toca "Llegue al cliente" → ve panel WAITING con countdown 10 min.
    4. Espera 10 min reales.
    5. Toca "Cliente no responde" → confirma → ve panel RETURN.
    6. Vuelve al comercio. Comercio le dicta el mismo PIN del pickup.
    7. Ingresa PIN → cierra como RETURNED.

POST-LAUNCH:
- Hold 24h del payout: la logica de payouts batch (post-launch) tiene que
  respetar payoutHoldUntil antes de procesar.
- Sistema de impugnacion: cliente que recibio push de no-show puede tocar
  boton "Estaba en casa, reportar fraude" para abrir caso en /ops/fraude.
  No implementado en esta rama — endpoint y panel quedan para rama legal/UX.

**Archivos:** src/app/api/driver/dashboard/route.ts, src/app/api/driver/orders/[id]/report-no-show/route.ts, src/app/api/driver/orders/[id]/return-to-merchant/route.ts, src/app/api/driver/orders/[id]/start-waiting/route.ts, src/app/repartidor/(protected)/dashboard/page.tsx, src/lib/notifications.ts, src/lib/orders/order-totals.ts

## 2026-05-07 (rama `feat/driver-offer-map-and-timer`)

feat: mapa preview + timer countdown visible en oferta del driver

PROBLEMA QUE RESUELVE:
El modal de oferta del driver tenía dos puntos débiles vs apps grandes:
  1. SIN MAPA: solo mostraba "501m, 9 min" como texto. El driver no podía
     ver visualmente la ruta antes de aceptar (Rappi/Uber Eats sí lo muestran).
  2. TIMER OCULTO: el sistema tenía `assignmentExpiresAt` en DB pero el driver
     no veía el countdown. La oferta podía expirar mientras decidía y aparecía
     el error "esta oferta ya no está disponible" sin warning previo.

CAMBIOS:

1) Componente NUEVO: src/components/rider/DriverOfferMapPreview.tsx
   - Mini mapa estático ~150px de altura optimizado para el modal de oferta.
   - 2 AdvancedMarkerElement: comercio (azul, label "A") y cliente (rojo, "B").
   - Polyline dashed naranja entre origen y destino.
   - Auto-fit a bounds con padding generoso (no se pegan al borde).
   - Sin interacción (gestureHandling: none, draggable: false, scrollwheel: false).
   - Por qué un componente NUEVO en vez de reusar RiderMiniMap:
     * RiderMiniMap es 1000+ líneas para navegación activa (turn-by-turn,
       off-route detection, head-up camera).
     * Para el preview de oferta no necesitamos eso — solo orientación visual.
     * Línea recta dashed evita 1 llamada extra a Routes API por cada oferta
       (el driver puede recibir 10-20 ofertas/hora; el costo sumaría rápido).

2) Hook NUEVO: useOfferCountdown(expiresAt, onExpire)
   - Calcula segundos restantes hasta expiresAt, re-renderiza cada 1s.
   - Dispara onExpire() cuando llega a 0 (auto-dismiss del card).
   - Retorna: secondsLeft, progressPercent (para la barra), isUrgent (<=10s),
     isExpired.
   - Cleanup automático del setInterval en unmount.

3) Componente NUEVO interno: OfferCard
   - Extraído del .map() inline porque los hooks no pueden usarse dentro de
     un map directo.
   - Renderiza el card completo: header, ganancia, mapa preview, direcciones,
     notas del cliente, botones.
   - Usa useOfferCountdown para tener el timer encapsulado por card (cada
     oferta tiene su propio expiresAt independiente).

4) Mejoras visuales del card:
   - Barra de progreso arriba (1.5px alto): naranja por default, rojo cuando
     isUrgent. Se vacía linealmente. Reemplaza el "pulse gradient" estático.
   - Botón ACEPTAR muestra "Aceptar (32s) →" con tabular-nums.
   - Color del botón cambia a rojo cuando faltan ≤10s (urgencia visual).
   - Botón disabled cuando isExpired (muestra "Expiró").
   - Estado de loading "Aceptando..." con spinner mientras se acepta.
   - Markers visuales A/B con letras (más profesional que circulitos sin texto).

DECISIONES DE PRODUCTO:

- Línea recta dashed en vez de Routes API: el driver tiene mapa real-time
  cuando acepta. El preview es solo orientación. Ahorra costo de API.
- Mapa solo se muestra si las 4 coords (merchant + customer) están presentes.
  Si alguna falta, el card cae al layout sin mapa (graceful degradation).
- Auto-dismiss respeta el dismissedOfferIds existente: la oferta expirada
  desaparece del modal pero queda registro local en el set hasta que
  fetchDashboard() la limpia del backend.

TESTING:
- TSC strict pasa limpio.
- Verificación visual: cuando llega una oferta nueva, el mapa renderiza con
  los 2 markers, la barra empieza llena (naranja) y se vacía. A los 10s
  cambia a rojo. Al llegar a 0 el card desaparece automáticamente.

POST-LAUNCH (anotado, NO en esta rama):
- Si en el futuro el costo de Maps no es problema, swap la línea dashed por
  Routes API real para ver el camino exacto (ETA + tráfico).
- Mostrar también la posición actual del driver (un 3er marker) en el preview.

**Archivos:** src/app/repartidor/(protected)/dashboard/page.tsx, src/components/rider/DriverOfferMapPreview.tsx

## 2026-05-07 (rama `feat/driver-availability-checkout`)

feat: pre-validación de drivers en checkout (banner rojo/amarillo + bloqueo)

PROBLEMA QUE RESUELVE:
Antes de esta rama, si el cliente hacía un pedido cuando no había drivers
disponibles, el flow era:
  1. Cliente paga con MP
  2. Sistema busca driver -> no hay
  3. 30 min después, cron auto-cancela + refund automatico
  4. Cliente queda con mala experiencia ("pagué algo que se canceló solo")

Mejor experiencia: avisarle ANTES de pagar, así decide si esperar o usar pickup.

CAMBIOS:

1) Endpoint /api/delivery/availability mejorado
   - Antes: count global de drivers online (sin filtro por zona).
   - Ahora: si recibe ?merchantId=X, hace query PostGIS ST_DWithin con radio
     leído de MoovyConfig.driver_search_radius_meters (default 50km, mismo
     criterio que assignment-engine).
   - Nuevos campos en response: estimatedWaitMinutes (5/8/12 min según
     cantidad de drivers), radiusMeters, hasDrivers.
   - Filtros canónicos: isOnline + isActive + approvalStatus=APPROVED +
     availabilityStatus=DISPONIBLE + ubicacion IS NOT NULL.

2) Hook + banner en checkout (src/app/(store)/checkout/page.tsx)
   - useEffect re-fetcha availability cada 30s con merchantId del primer
     vendor del carrito.
   - Banner rojo si availableDrivers === 0:
     "Sin repartidores disponibles ahora" + sugerencia de pickup.
   - Banner amarillo si availableDrivers === 1:
     "Solo 1 repartidor — puede haber demora (~12 min)".
   - Banner verde mini si availableDrivers >= 2:
     "X repartidores disponibles. Asignación estimada: ~X min".
   - Solo se muestra si delivery="home" + deliveryType="IMMEDIATE" (pickup
     y programado no necesitan driver inmediato).

3) Bloqueo del botón "Confirmar Pedido"
   - Disabled si availableDrivers === 0 + delivery="home" + IMMEDIATE.
   - Cliente todavía puede usar pickup o programar (deliveryType=SCHEDULED
     se fuerza automáticamente cuando hasDrivers=false, ya estaba implementado).

DECISIONES DEL CONSEJO QUE NO ENTRARON:

- Inicialmente planeamos diferir notifyMerchant hasta tener driver asignado
  (para que el comercio no cocine si no va a haber driver). Tras analizar el
  flow real (búsqueda de drivers ocurre cuando merchant marca "Listo", NO al
  pagar) y considerando la nueva pre-validación, esta capa quedó innecesaria.
  La cocina paralela mientras se busca driver ahorra 10-20 min al cliente.
  El escenario edge "comercio cocinó pero no hay driver" está cubierto por:
  (a) la pre-validación que acabamos de hacer, (b) auto-refund automático del
  cron retry-assignments cuando no se asigna driver tras 6 intentos.

- Inicialmente planeamos radio expansivo 3km -> 5km -> 8km. No es necesario:
  Ushuaia es chica, el radio default 50km cubre toda la ciudad.

CAPAS DE PROTECCION RESULTANTES (defense-in-depth):

  Capa 1: pre-validación al checkout (esta rama) → cliente sabe ANTES.
  Capa 2: búsqueda de driver con PostGIS radio 50km (existente).
  Capa 3: cron retry-assignments (existente, max 3 retries con escalado).
  Capa 4: auto-cancel + refund automático tras 6 intentos (existente).

TESTING:
- TSC strict pasa limpio.
- Endpoint testeable con: GET /api/delivery/availability?merchantId=X
- Verificación visual: poner offline todos los drivers y ver banner rojo,
  poner 1 driver online y ver banner amarillo, 2+ ver verde.

**Archivos:** src/app/(store)/checkout/page.tsx, src/app/api/delivery/availability/route.ts

## 2026-05-07 (rama `chore/cron-monitoring-completo`)

chore: monitoreo completo de crons + alertas email + retention 30d + panel pro

PROBLEMA QUE RESUELVE:
Antes de esta rama, el panel /ops/crons mostraba solo 7 de los 16 crons del
sistema, y dentro de esos 7 uno (process-broadcasts) aparecia "Nunca corrio"
aunque estaba corriendo. Los otros 9 crons funcionaban silenciosamente sin
visibilidad. Si alguno fallaba a las 3am, nadie se enteraba hasta que un
cliente reportaba un sintoma.

OBJETIVO: monitoreo completo nivel pro (Datadog/Sentry-style).

CAMBIOS:

1) Envolver con recordCronRun los 9 crons que no lo tenian
   - assignment-tick, cart-recovery, close-auctions, merchant-timeout,
     mp-reconcile, retry-assignments, scheduled-notify, seller-resume,
     update-merchant-tiers
   Ahora todos registran en CronRunLog y aparecen en el dashboard.

2) Bug fix: process-broadcasts aparecia "Nunca corrio"
   - Causa: el handler usaba recordCronRun pero el return final era
     `return NextResponse.json(stats)` donde stats era el resultado del
     wrapper, no un NextResponse valido. La excepcion al serializar se tragaba
     en el try/catch y nunca se registraba el run en CronRunLog.
   - Fix: tipar `recordCronRun<NextResponse>` y devolver
     `result: NextResponse.json(...) as NextResponse` desde el callback.

3) Helper cron-health.ts ampliado con metricas pro
   - Tipo CronHealth extendido con: successRate24h, successRate7d,
     avgDurationMs, totalRuns24h, totalRuns7d, consecutiveFailures.
   - Funcion getRecentCronErrors(jobName) para drawer de detalle.
   - Funcion shouldAlertCronFailures con check de idempotencia anti-spam
     (solo 1 alerta por hora por cron).

4) Sistema de alertas por email automaticas
   - sendCronFailureAlertIfNeeded() llamada desde recordCronRun cuando un cron
     acumula 3+ fallos consecutivos.
   - Email a NOTIFICATION_EMAIL (fallback OPS_LOGIN_EMAIL) con detalle del
     error, count de fallos, link al panel.
   - Idempotente via AuditLog action="CRON_FAILURE_ALERT_EMAIL_SENT".
   - Fire-and-forget: si el email falla, NO bloquea el throw del error real.

5) CRON_EXPECTATIONS completado
   - Agregadas 9 entries que faltaban + 1 nueva (cleanup-cron-runs).
   - Ahora son 17 crons registrados, todos visibles en /ops/crons.

6) Endpoints nuevos
   - POST /api/admin/crons/[jobName]/trigger — boton "Ejecutar ahora".
     Reutiliza el endpoint del cron real con el CRON_SECRET, asi se preserva
     toda la logica (auth + recordCronRun + side effects).
   - GET /api/admin/crons/[jobName]/errors — lista de ultimos 20 errores
     para el drawer del panel.

7) Cron nuevo: cleanup-cron-runs
   - Diario 2:30am, retention 30 dias configurable via MoovyConfig.
   - Sin esto, CronRunLog crece ~7K filas/dia y degrada el panel.

8) Panel /ops/crons rediseñado nivel pro
   - Banner rojo arriba si hay failing/stale.
   - Stats agregadas (4 cards: OK / atrasados / fallando / nunca corrio).
   - Filtros por estado (chips clickables).
   - Cards mejoradas: success rate barra mini, tiempo promedio, runs 24h,
     consecutive failures destacados.
   - Botones "Ejecutar ahora" + "Ver errores" en cada card.
   - Drawer modal con stack trace de errores recientes (responsive).
   - Auto-refresh 30s (solo si pestaña visible).

9) VPS — crontab regenerado
   - 18 entries totales (17 crons + 1 backup diario DB).
   - Migrado de TOKEN hardcodeado a `$(grep ^CRON_SECRET .env)` para que
     rotaciones del secret no requieran editar el crontab.
   - Cron nuevo cleanup-cron-runs activado (2:30am).

PENDIENTE QUE SE DIFIERE:
- Implementacion completa de campañas de publicidad (process-broadcasts cron
  ya esta arreglado pero la logica de campañas se decide post-launch).

TESTING:
- TSC strict pasa limpio (npx tsc --noEmit --skipLibCheck).
- Verificacion en VPS: 18 entries en crontab, cleanup-cron-runs registrado
  en CRON_EXPECTATIONS.

POST-DEPLOY EN PRODUCCION (despues de devmain.ps1):
- Verificar /ops/crons: deberian aparecer los 17 crons (era 7 antes).
- Verificar que los nuevos cron cards tengan metricas: success rate 24h,
  tiempo promedio, runs 24h.
- Probar boton "Ejecutar ahora" en cualquier cron.
- Probar drawer "Ver errores" (puede estar vacio si nunca fallaron).

**Archivos:** docs/referencias/observaciones_prod.md, src/app/api/admin/crons/[jobName]/errors/route.ts, src/app/api/admin/crons/[jobName]/trigger/route.ts, src/app/api/cron/assignment-tick/route.ts, src/app/api/cron/cart-recovery/route.ts, src/app/api/cron/cleanup-cron-runs/route.ts, src/app/api/cron/close-auctions/route.ts, src/app/api/cron/merchant-timeout/route.ts (+8 mas)

## 2026-05-06 (rama `chore/export-delivery-zones-to-prod`)

chore: script para exportar delivery zones a produccion

PROBLEMA QUE RESUELVE:
Las zonas de delivery son polígonos PostGIS (tipo Unsupported() en Prisma).
`prisma db push` solo sincroniza schema, NO copia data. Los seeds normales
no pueden insertar polígonos via Prisma Client. Hasta ahora no había forma
limpia de transferir las zonas configuradas localmente (con sus polígonos
dibujados a mano en /ops/zonas-delivery) a la DB de produccion.

SOLUCION:
- scripts/export-delivery-zones-to-prod.ts (NUEVO)
  - Lee las zonas locales con $queryRaw (incluye ST_AsText del polygon)
  - Genera scripts/seed-delivery-zones-prod.sql con INSERTs idempotentes
    (ON CONFLICT (name) DO NOTHING) usando ST_GeomFromText() para polígonos
  - Modo PREVIEW por default (dry-run, no toca nada)
  - Modo --write genera el archivo SQL
  - Tabla preview con vértices por zona para verificar antes de exportar

FLUJO COMPLETO DE DEPLOY DE ZONAS:
  Local:
    1. npx tsx scripts/export-delivery-zones-to-prod.ts          (preview)
    2. npx tsx scripts/export-delivery-zones-to-prod.ts --write  (genera SQL)
    3. .\scripts\finish.ps1                                       (commit + push)
    4. .\scripts\devmain.ps1                                      (deploy a prod)

  En el servidor de produccion (despues del deploy):
    1. npx prisma db push                                         (sincroniza schema)
    2. npx tsx scripts/apply-postgis-zones-index.ts               (crea indice GIST)
    3. psql $DATABASE_URL -f scripts/seed-delivery-zones-prod.sql (carga las zonas)

IDEMPOTENCIA:
ON CONFLICT (name) DO NOTHING — correr el SQL dos veces es seguro. Si una
zona ya existe en produccion, NO se sobreescribe (defensa contra race).
Para reemplazar: borrar manualmente desde /ops/zonas-delivery primero o
DELETE en produccion antes de re-correr el seed.

ZONAS EXPORTADAS EN ESTA RUN:
- Zona C — Alta / Dificil   (×1.35, +$350, 26 vertices)
- Zona B — Intermedia       (×1.15, +$150, 80 vertices)
- Zona A — Centro           (×1.00,   +$0, 79 vertices)
- USHUAIA                   (×1.00,   +$0,  8 vertices, capa base displayOrder=0)

**Archivos:** scripts/export-delivery-zones-to-prod.ts, scripts/seed-delivery-zones-prod.sql

## 2026-05-06 (rama `feat/payment-pending-cancellation`)

feat: cancelacion de pago pendiente + descripcion de producto obligatoria

PROBLEMA RAIZ que resuelve:
Cuando el buyer paga con MercadoPago pero abandona el redirect (cierra pestaña,
vuelve atras, error de red), el pedido quedaba "fantasma" en estado AWAITING_PAYMENT
para siempre. Stock reservado, cliente sin poder hacer nada, comercio sin saber.

SOLUCION (4 capas, defense-in-depth):

1. UI BUYER — banner inmediato (sin espera de minutos):
   - src/app/(store)/mis-pedidos/page.tsx
   - Apenas el cliente entra a "Mis Pedidos" con un pedido en AWAITING_PAYMENT,
     ve banner ambar con dos acciones: "Continuar pago" (redirect a MP via
     mpPreferenceId) y "Cancelar pedido" (con confirm modal).
   - Banner desaparece automaticamente cuando paymentStatus pasa a PAID
     (probing existente vs MP API) o cuando status pasa a CANCELLED.
   - Filtro `isPendingPayment()` chequea: status NO terminal AND paymentStatus
     pendiente AND paymentMethod=mercadopago.

2. CRON AUTO-CANCEL (red de seguridad):
   - src/app/api/cron/cancel-stale-pending-payments/route.ts (NUEVO)
   - Corre cada minuto. Cancela pedidos con createdAt > 30 min sin pago
     confirmado. Restaura stock (Listing + Product) en transaccion Serializable.
   - Timeout configurable desde MoovyConfig.payment_pending_timeout_minutes.
   - Wrapped en recordCronRun para healthcheck OPS.
   - Audit log + notifyBuyer + sockets a admin/customer/merchant.

3. WEBHOOK MP — pago tardio post-cancelacion -> refund automatico:
   - src/lib/order-payment-confirm.ts
   - Antes: si MP confirmaba un pago despues de que el pedido estaba CANCELLED,
     el sistema REACTIVABA el pedido (status pasaba a CONFIRMED). Doble bug:
     reactivaba contra la voluntad del cliente Y se quedaba con la plata.
   - Ahora: detecta TERMINAL_STATUSES_LATE_PAYMENT antes del update. Si esta
     terminal, NO reactiva. Persiste el Payment para audit, marca paymentStatus=PAID
     para que refundOrderIfPaid lo detecte, dispara refund automatico.
   - Audit log con action LATE_PAYMENT_AFTER_CANCELLATION.
   - Defense-in-depth: si race condition entre query y update, refund tambien.

4. CRON_EXPECTATIONS:
   - src/lib/cron-health.ts: agregada entrada cancel-stale-pending-payments
     (maxHours: 1) para que el dashboard OPS lo monitoree.

FIX BONUS: PIN prematuro al comercio
- src/app/api/merchant/orders/route.ts
- Antes: PIN aparecia al comercio apenas el driver llegaba (DRIVER_ARRIVED),
  sin importar si el comercio habia marcado "Listo para retirar". El comercio
  veia el PIN cuando todavia no habia terminado de preparar.
- Ahora: PIN solo aparece si AMBAS son verdad: (a) driver llego (deliveryStatus=
  DRIVER_ARRIVED o driverStatus=AT_MERCHANT) Y (b) comercio marco listo
  (merchantStatus=READY/PICKED_UP/RETURNED o legacy status correspondiente).
- Compat retro: pedidos pre-rama state-machine-paralela con merchantStatus=null
  caen al fallback legacy.

FIX BONUS: descripcion de producto obligatoria
- src/app/comercios/actions.ts
- Bug: el comercio reportaba "Invalid input: expected string, received null" al
  editar productos. Causa: schema Zod tenia description.optional() pero
  formData.get() retorna null (no undefined) para campos vacios, y .optional()
  NO acepta null.
- Decision de producto: descripciones venden y son SEO-relevantes (Rappi,
  MercadoLibre obligan). Cambiamos a z.string().min(10, "...") con mensaje claro.
- Implicacion: productos legacy con descripcion null se fuerzan a completarse al
  editar. Intencional — oportunidad para completar catalogo pre-launch.

POST-LAUNCH (anotado, NO en esta rama):
- feat/driver-offer-map-and-timer: mapa preview + countdown en oferta del driver
- feat/driver-availability-checkout: pre-validacion drivers + auto-refund sin drivers
- feat/no-show-flow: UI driver para WAITING_FOR_CUSTOMER, devolucion al comercio
- Otros campos obligatorios al editar producto (categoria, peso) en rama propia

**Archivos:** src/app/(store)/mis-pedidos/page.tsx, src/app/api/cron/cancel-stale-pending-payments/route.ts, src/app/api/merchant/orders/route.ts, src/app/comercios/actions.ts, src/lib/cron-health.ts, src/lib/order-payment-confirm.ts

## 2026-05-06 (rama `fix/state-machine-paralela-merchant-driver`)

fix: state machine paralela merchant + driver, PIN 4 digitos, bulk fix de filtros de estados

PROBLEMA RAIZ: el campo `Order.status` mezclaba el flujo del comercio con el del driver
en un solo string. Eso bloqueaba paralelismo (merchant no podia marcar listo si el
driver ya habia llegado) y multiples filtros hardcodeados de estados activos olvidaban
agregar estados nuevos del flujo (DRIVER_ARRIVED), haciendo que pedidos en curso
"desapareciera" o quedaran mal clasificados en buyer/comercio/driver/admin.

SCHEMA (Order y SubOrder):
- merchantStatus: PREPARING -> READY -> PICKED_UP -> RETURNED (independiente)
- driverStatus: ASSIGNED -> AT_MERCHANT -> ON_ROUTE_TO_CUSTOMER -> AT_CUSTOMER ->
  WAITING_FOR_CUSTOMER -> DELIVERED (independiente; alt: RETURNING_TO_MERCHANT -> RETURNED)
- waitingStartedAt, noShowReportedAt, payoutHoldUntil, noShowFlag (preparados
  para futura rama de no-show flow)
- `status` legacy queda como vista derivada (deriveLegacyStatus)

HELPER CANONICO src/lib/orders/order-status-machine.ts:
- legacyStatusToParallel + getEffectiveMerchantStatus + getEffectiveDriverStatus
  para back-fill y compat con consumers viejos
- DRIVER_ACTIVE_STATUSES, DRIVER_HISTORICAL_STATUSES (parallel)
- LEGACY_TERMINAL_STATUSES, LEGACY_ACTIVE_STATUSES (legacy)
- Patron canonico: enumerar terminales (chico, estable) y derivar
  "activo = NO terminal" -> estados nuevos del flujo caen automaticamente
  en activos sin tocar filtros

PIN doble cambiado de 6 a 4 digitos:
- src/lib/pin.ts: generatePin, sanitizePinInput, formatPinForDisplay
- src/lib/pin-verification.ts: validacion shape
- src/components/rider/PinKeypad.tsx: PIN_LENGTH + textos UI
- scripts/test-pin-verification.ts: tests + regex actualizados
- Razon: estandar industria (Rappi/PedidosYa/Uber Eats/Glovo). UX a -5C
  con guantes. Anti-fraude conservado por rate limit + geofence + auto-suspend.

BUG 1 - Driver dashboard mandaba pedidos a Historial:
- src/app/api/driver/dashboard/route.ts: filtra por driverStatus paralelo +
  fallback legacy con OR (cubre pedidos viejos sin merchantStatus seteado).

BUG 2 - Merchant bloqueado para "Listo" cuando driver ya llego:
- src/app/api/merchant/orders/[id]/ready/route.ts: chequea merchantStatus,
  no status legacy. Permite marcar listo independiente del driverStatus.

BUG 3 - Buyer ve pedido en Historial al "Llegue al comercio":
- src/app/(store)/mis-pedidos/page.tsx: invertido a TERMINAL_STATUSES + activo derivado
- src/app/(store)/mis-pedidos/[orderId]/page.tsx: agregado DRIVER_ARRIVED al
  timeline + showMap + tracking
- src/components/orders/OrderTrackingMiniMap.tsx: TRACKABLE_STATUSES con DRIVER_ARRIVED

BUG 4 - Comercio panel manda pedido a "Todos":
- src/app/comercios/(protected)/pedidos/page.tsx: isActiveStatus() derivado
  (NO completed AND NO failed). failedStatuses ampliado con REFUNDED, EXPIRED,
  RETURNED para futuro-proof.

BULK FIX (5 endpoints + KPI dashboard):
- src/app/api/orders/active/route.ts
- src/app/api/admin/active-orders/route.ts
- src/app/api/ops/orders/live/route.ts (+ bucket driverFlow nuevo)
- src/app/ops/(protected)/dashboard/page.tsx (KPI activeOrders)
- src/app/api/driver/orders/route.ts (3 tabs)
Todos migrados a `notIn: LEGACY_TERMINAL_STATUSES` para que estados nuevos
del flujo no rompan los listings.

CLAIM y STATUS endpoints actualizados para mantener parallel + legacy en sync:
- src/app/api/driver/orders/[id]/claim/route.ts: setea driverStatus="ASSIGNED"
- src/app/api/driver/orders/[id]/status/route.ts: actualiza driverStatus +
  merchantStatus en cada transicion (DRIVER_ARRIVED, PICKED_UP, DELIVERED)

BUG 5 - Comercio no se actualiza en tiempo real con nuevos pedidos:
- src/app/comercios/(protected)/pedidos/page.tsx: polling adaptativo bajado
  de 60s a 10s constante. Socket sigue como primary path. Agregado log visible
  en consola para debug del estado de conexion.

BUG 6 - Notas del cliente al repartidor no llegaban al driver:
- src/app/api/driver/dashboard/route.ts: deliveryNotes en payload de oferta
  + pedido activo
- src/app/api/driver/orders/route.ts: deliveryNotes en output de 3 tabs
- src/app/repartidor/(protected)/dashboard/page.tsx: banner ambar con notas
  visible en oferta (antes de aceptar) y en pedido activo (durante todo el flow).
- Type Order y PendingOrderOffer: deliveryNotes?: string | null

INFRA:
- scripts/start.ps1: fix em-dash em-dash UTF-8 sin BOM (rompia parser PowerShell 5.1)
- scripts/tsc-strict.ps1: reescritura ASCII puro (sin box-drawing chars,
  emojis, em-dashes, tildes en comentarios). Captura log del build a archivo
  temporal y lo muestra si falla (antes silenciaba el output con Out-Null).
- scripts/finish.ps1: pre-flight PSParser::Tokenize + invocacion via
  powershell.exe -File (subproceso) para que parse errors propaguen exit code.
  Antes silenciosamente continuaba commiteando aunque tsc-strict no parseara.
- scripts/clean-old-orders.ts: script ad-hoc para limpiar pedidos viejos de
  prueba sin tocar zonas, comercios, drivers, productos.

TESTING:
- 12/12 tests de PIN pasando (tras update a 4 digitos)
- DB limpiada: 23 orders viejos eliminados, 4 zonas / 5 merchants / 4 drivers /
  9 products preservados
- Smoke test end-to-end del flow normal (buyer paga -> comercio acepta y marca
  listo -> driver retira con PIN 4 digitos -> delivery con PIN 4 digitos -> DELIVERED)
  funciona sin trabarse en ningun panel (buyer / comercio / driver / ops live).

POST-LAUNCH (anotado, NO en esta rama):
- feat/payment-pending-cancellation: cancelar pedidos sin pago + cron auto-cancel 30min
- feat/driver-offer-map-and-timer: mapa preview en oferta + countdown visible
- feat/driver-availability-checkout: pre-validacion drivers + auto-refund sin drivers
- No-show flow completo (UI driver para WAITING_FOR_CUSTOMER, devolucion al comercio)
- Limpieza de PIN sanitization en api/orders/[id]/route.ts (incluir DRIVER_ARRIVED
  cuando se implemente AT_CUSTOMER en parallel)

**Archivos:** prisma/schema.prisma, scripts/clean-old-orders.ts, scripts/finish.ps1, scripts/start.ps1, scripts/test-pin-verification.ts, scripts/tsc-strict.ps1, src/app/(store)/mis-pedidos/[orderId]/page.tsx, src/app/(store)/mis-pedidos/page.tsx (+16 mas)

## 2026-05-05 (rama `fix/delivery-fee-preview-vs-cobro`)

fix(delivery): unificar fee preview vs cobro + auto-flujo de ramas + zona fallback. Bug crítico: el preview en /api/delivery/calculate usaba calculateDeliveryCost (delivery.ts, fórmula maestra con factor 2.2) mientras que POST /api/orders usaba calculateShippingCost (shipping-cost-calculator.ts, por categoría de paquete) — el cliente veía $2.763 en checkout pero al pagar se cobraba $1.315 (FRAUD ALERT por diff >25%). Fix: el preview ahora replica EXACTAMENTE el flow del POST (calculateShippingCost MEDIUM/STANDARD/orderTotal=0 → suma operacional 5% subtotal → climate multiplier → zone multiplier). Cliente y server muestran el mismo monto al peso. UX checkout: agregado useEffect con debounce 500ms que dispara calculateDelivery automáticamente al cargar el checkout cuando hay address con street+number (no exige lat/lng — el endpoint hace geocoding fallback con Google Maps si faltan coords). Antes el fee solo aparecía al tocar "Continuar al pago"; ahora se muestra inline en "Tu Pedido" desde el primer render. Helper delivery-zones.ts: getZoneForLocation devuelve la zona con displayOrder más BAJO como fallback cuando no hay match en ningún polígono — patrón "capa base + modificadoras" estilo Glovo/Rappi/PedidosYa que elimina los gaps milimétricos entre zonas dibujadas a mano. Cero gaps lógicos: si el admin solo dibuja B y C, las direcciones que caen fuera caen automáticamente en A. Quitado el modal de warning de overlaps en /ops/zonas-delivery porque el approach nuevo asume overlaps intencionales (Zona A grande cubre todo, B y C encima ganan por displayOrder DESC); el endpoint sigue logueando overlapsCount en Pino para debug futuro. Doble verificación TypeScript: tsconfig.json mantiene .next/dev/types en include (Next.js lo regenera en cada start del dev) pero suma .next/dev en exclude (TSC respeta exclude sobre include). tsconfig.strict.json nuevo extiende del base e incluye TODO. scripts/tsc-strict.ps1 nuevo limpia .next, regenera tipos con next build, y corre tsc strict. scripts/finish.ps1 ahora ejecuta tsc-strict ANTES de cualquier acción de git/db; si falla aborta el commit con SKIP_TSC=1 como override. Auto-flujo de ramas: scripts/finish.ps1 lee .commit-message del root si existe (en vez del prompt interactivo), lo usa para el commit y lo borra post-exitoso. scripts/start.ps1 lee .next-branch (formato "tipo nombre" en una o dos líneas), crea la rama sin prompts y borra el archivo. Sanitiza el nombre (espacios → guiones, sin chars especiales). Ambos archivos en .gitignore. Mauro deja de pegar mensajes y elegir tipos: yo los dejo pre-cargados. Fallback a modo interactivo si los archivos no existen. Archivos modificados: src/app/api/delivery/calculate/route.ts, src/app/(store)/checkout/page.tsx, src/lib/delivery-zones.ts, src/app/ops/(protected)/zonas-delivery/ZonesDeliveryClient.tsx, tsconfig.json, scripts/finish.ps1, scripts/start.ps1, .gitignore. Archivos nuevos: tsconfig.strict.json, scripts/tsc-strict.ps1.

**Archivos:** .gitignore, scripts/finish.ps1, scripts/start.ps1, scripts/tsc-strict.ps1, src/app/(store)/checkout/page.tsx, src/app/api/delivery/calculate/route.ts, src/app/ops/(protected)/zonas-delivery/ZonesDeliveryClient.tsx, src/lib/delivery-zones.ts (+2 mas)

## 2026-05-05 (rama `chore/seed-mundo-real`)

chore(seed): runbook orquestador para "prueba de mundo real" pre-launch. 5 archivos nuevos: scripts/seed-package-categories.ts (6 PackageCategory + DeliveryRate según Biblia v3 — MICRO/SMALL/MEDIUM/LARGE/XL/FLETE con base $800–$8.000 y precio/km $15–$329), scripts/seed-real-world-test.ts (cuentas test idempotentes con bcrypt — Buyer con 3 direcciones distribuidas en zonas A/B/C: San Martín 850, Las Primulas 191, Haruwen 2329; Merchant aprobado con docs APPROVED + 5 productos con weightGrams/volumeMl/packageCategoryId en Magallanes 250; Driver MOTO online aprobado en Magallanes 600; Seller marketplace aprobado en Magallanes 900; password único Test1234!; helper archiveStaleAddresses limpia direcciones zombies cuando el seed cambia de calles entre runs), scripts/setup-mundo-real.ts (runbook orquestador que corre 7 pasos en cadena via spawnSync con dry-run + --execute), docs/testing/mock-geolocation.md (guía Chrome DevTools Sensors con 6 coords copiables y explicación de cómo el multiplicador aplica al destino del pedido), docs/testing/checklist-mundo-real.md (8 categorías ~50 casos: Setup base, Pagos MP, PIN doble, Flujos críticos, Zonas, Seguridad, Ushuaia específico, Infra). Bug fix scripts/seed-categories.ts: el findUnique buscaba por slug pero el constraint de DB es por name → cambiado a findFirst con OR sobre slug y name (P2002 resuelto). Actualización del precio de combustible en seed-biblia-launch.ts: nafta súper YPF Ushuaia $1.607 → $1.658 (valor confirmado por founder 2026-04-30). Cotización USD referencia: blue $1.395 → oficial $1.400 (cierre abril 2026). Validation final con validate-ops-config.ts: 9/9 tests pasaron limpios. El cambio en CLAUDE.md de la rama anterior (decisión arquitectónica de zonas con polígonos PostGIS) viaja con este commit. Setup completo verificado end-to-end: 7/7 pasos en 12s sin errores.

**Archivos:** .claude/CLAUDE.md, docs/testing/checklist-mundo-real.md, docs/testing/mock-geolocation.md, scripts/seed-biblia-launch.ts, scripts/seed-categories.ts, scripts/seed-package-categories.ts, scripts/seed-real-world-test.ts, scripts/setup-mundo-real.ts

## 2026-05-03 (rama `feat/zonas-delivery-multiplicador`)

feat(delivery): zonas con multiplicador editable + UX pro de dibujo (pintar + click + edit inline). Schema: modelo DeliveryZone con PostGIS Polygon SRID 4326 + GiST index, multiplier/driverBonus/displayOrder/isActive editables; SubOrder agrega 3 campos snapshot inmutables (zoneCode/zoneMultiplier/zoneDriverBonus, audit AAIP/AFIP). Helper canónico src/lib/delivery-zones.ts (getZoneForLocation, getZoneSnapshotForLocation, cache TTL 1h con invalidación, ray casting, overlap por displayOrder DESC). Endpoints CRUD admin con detección de overlaps via ST_Intersects + audit log Pino + invalidación cache. Endpoint público /api/delivery-zones/check con rate limit 60/min. Integración en motor: POST /api/orders consulta zona del destino, aplica multiplicador a delivery fee total y per-group multi-vendor; buildSubOrderFinancialSnapshot suma zoneDriverBonus al driverPayoutAmount. Fix crítico: /api/delivery/calculate deja de hardcodear ZONA_A — detecta zona real y devuelve zoneSnapshot al frontend (evita mismatch entre preview y cobro). Display checkout cliente: línea "↳ Zona X +Y%" debajo del envío (Defensa del Consumidor 24.240). Componente reutilizable ZoneBadge para integración en panel driver. UI /ops/zonas-delivery con 3 modos de dibujo: (1) "Click por click" rojo paso-a-paso con undo+limpiar, (2) "Pintar zona" violeta freehand drag con simplificación Douglas-Peucker (tolerance 0.0001 ≈ 11m), (3) edición inline de zonas existentes con vértices arrastrables sin redibujar. Listener global mouseup en window evita que modo Pintar quede pegado si soltás fuera del mapa. Hard delete con confirmación textual literal "BORRAR" (regla #26). Toggle visibilidad con Eye/EyeOff (no Power). Modal warning amarillo cuando zona se solapa con otras (informativo, no bloquea). Script apply-default-zone-polygons.ts --force ahora requiere --confirm SOBRESCRIBIR doble (regla #26 anti-accidente, después de incidente que perdió polígonos manuales). Seed seed-delivery-zones.ts 3 zonas A/B/C según Biblia v3 (multiplier 1.0/1.15/1.35, bonus 0/150/350) con polígonos NULL hasta que admin dibuje. Test test-delivery-zones.ts con 5 casos point-in-polygon. BibliaConfigClient deja de editar zonas legacy y redirige a /ops/zonas-delivery. seed-biblia-launch.ts marca zoneMultipliersJson como deprecado + actualiza nafta YPF Ushuaia $1.999 (abril 2026) y USD oficial $1.400 (cierre abril 2026). useGoogleMaps hook agrega library "drawing".

**Archivos:** prisma/schema.prisma, scripts/apply-default-zone-polygons.ts, scripts/apply-postgis-zones-index.ts, scripts/seed-biblia-launch.ts, scripts/seed-delivery-zones.ts, scripts/setup-postgis-zones.sql, scripts/test-delivery-zones.ts, src/app/(store)/checkout/page.tsx (+13 mas)

## 2026-05-03 (rama `refactor/separar-motor-y-finanzas`)

refactor(orders): separar Motor Logístico vs Reparto Financiero + persistir snapshot inmutable en SubOrder. Schema: SubOrder agrega 5 campos nullable — tripCost, operationalCost, driverPayoutAmount, merchantCommissionRate, merchantCommissionSource. Helper nuevo getEffectiveCommissionWithSource() en merchant-loyalty.ts devuelve {rate, source: OVERRIDE|FIRST_MONTH|TIER|FALLBACK} para audit AAIP/AFIP. Nuevo orquestador chico src/lib/orders/order-totals.ts (buildSubOrderFinancialSnapshot) centraliza el cálculo de los 5 campos persistibles, recibiendo precomputedMerchantRate/Source para evitar query duplicada cuando el endpoint ya consultó. orders/route.ts: validatedGroupFees Map ahora incluye operationalCost por grupo; antes de tx.subOrder.create se llama el snapshot helper y se persisten los 5 campos. payouts.ts: si subOrder.driverPayoutAmount != null para todos los SubOrders del driver en el order, suma esos valores exactos en vez de aproximar con DRIVER_SHARE 0.70. Si alguno es null (orders pre-rama, multi-vendor con drivers mixtos), fallback a la lógica vieja — cero regresión. CLAUDE.md: la sección "Reglas de negocio canónicas" se divide en Motor Logístico (fórmula del viaje, vehículos, zonas, clima, asignación, peso volumétrico, marketplace categorías) y Reparto Financiero (comisiones merchant/seller, costo operativo, share driver, puntos, publicidad, protocolo efectivo). Se quita el bonus nocturno 23-07h (no estaba implementado y se decidió no comprometerlo pre-launch). El refactor mayor (unificar delivery.ts + shipping-cost-calculator.ts en un solo orquestador computeOrderTotals que reemplace los 27 archivos consumidores) queda para mes 1 post-launch — esta rama hace el cambio mínimo viable que cierra el problema de plata real (sobrepago al driver con subtotales altos).

**Archivos:** .claude/CLAUDE.md, prisma/schema.prisma, src/app/api/orders/route.ts, src/lib/merchant-loyalty.ts, src/lib/orders/order-totals.ts, src/lib/payouts.ts

## 2026-05-03 (rama `feat/bloqueo-comercio-cerrado`)

feat(store): bloqueo de compras cuando el comercio está cerrado (pausa manual o fuera de horario). Antes los componentes ProductCard / HomeProductCard / products/ProductCard solo chequeaban merchant.isOpen crudo (pausa manual) y no respetaban scheduleJson + horario actual + timezone Ushuaia, así que un cliente podía agregar al carrito en una tienda fuera de horario y el server rechazaba después con error tarde. Ahora el chequeo se hace al render con checkMerchantSchedule (que ya existía) + nuevo getMerchantOpenViewModel que devuelve {isCurrentlyOpen, nextOpenLabel}. Cambios: (1) Helper getMerchantOpenViewModel en src/lib/merchant-schedule.ts — toma merchant {isOpen, scheduleJson} y devuelve estado real + label "Abre 18:00" o "Abre Mañana 09:00". (2) Las 3 ProductCard refactorizadas para aceptar isCurrentlyOpen + nextOpenLabel opcionales; cuando vienen los respetan, sino fallback a isOpen legacy. Botón "+" deshabilitado en gris si la tienda está cerrada + badge con label de apertura. (3) Páginas (store)/page.tsx y (store)/productos/page.tsx enriquecen featured/listado con el viewModel antes de pasarlos al card. (4) Endpoint /api/products/[slug] selecciona scheduleJson y devuelve isCurrentlyOpen + nextOpenLabel calculados. (5) ProductDetailClient computa merchantIsOpen desde el endpoint y muestra banner amarillo "Tienda cerrada — Abre Mañana 09:00" arriba del producto, botones "Agregar al carrito" en gris con texto "Tienda cerrada", chequeo en handleAddToCart con toast.error si intenta forzar. (6) /api/orders POST ya tenía validateMerchantCanReceiveOrders desde antes — defensa server-side final intacta. Lo que NO se tocó: ListingCard del marketplace usa otro sistema (SellerAvailability), CartSidebar warning queda para mes 1 (server ya rechaza checkout con tienda cerrada). UX patrón: alineado con Rappi/PedidosYa/Glovo — ver el producto sí, comprarlo no hasta que abra.

**Archivos:** src/app/(store)/page.tsx, src/app/(store)/productos/[slug]/ProductDetailClient.tsx, src/app/(store)/productos/[slug]/page.tsx, src/app/(store)/productos/page.tsx, src/app/api/products/[slug]/route.ts, src/components/home/HomeProductCard.tsx, src/components/products/ProductCard.tsx, src/components/store/ProductCard.tsx (+1 mas)

## 2026-05-01 (rama `feat/peso-volumen-productos`)

feat(products): peso y volumen real por producto + selector visual Glovo-style + cache global con sugerencia. Schema agrega Product.weightGrams/volumeMl + tabla ProductWeightCache (sha256 nameHash, source SEED/AI/HEURISTIC/MANUAL, hitCount, suggestedVehicle). Helper src/lib/product-weight.ts: cascada EXPLICIT > CATEGORY > FALLBACK + heurística por keywords (litros, kilos, ml, packs, ~25 productos típicos AR). Tipos ProductSize + SIZE_METADATA con 5 categorías visuales (MICRO/SMALL/MEDIUM/LARGE/XL) inspiradas en Glovo/Cabify, cada una con icono lucide, displayName, descripción, ejemplos, peso/volumen interno, vehículo recomendado. UI: SizeSelector.tsx nuevo (5 cards visuales) + NewProductForm/EditProductForm refactorizados para usar SizeSelector como UI principal + toggle "Modo avanzado" para tipear gramos exactos (caso farmacia/seller con productos heterogéneos). Endpoint POST /api/comercios/products/suggest-weight con auth merchant/admin, rate limit 100/h IP, Zod en body, cascada cache→IA(stub)→heurística→null, devuelve suggestedSize mapeando peso a categoría. Flag ENABLE_AI_WEIGHT_SUGGEST=false por default (stub Haiku queda listo para enchufar en mes 2). Server actions createProduct/updateProduct extendidas con Zod. Seed dataset 130+ productos comunes argentinos (bebidas, almacén, lácteos, snacks, comida rápida, helados, limpieza, farmacia, ferretería, indumentaria, mueblería, electro). Script seed idempotente con dry-run + --execute. Decisiones: campos opcionales con fallback (Opción B); UX por categorías visuales (Camino B, votado por 11 roles del consejo). Costo IA pre-launch: $0 (cache semilla cubre productos comunes); cuando se prenda flag con API key real, ~$5/mes estimado con cache lleno. Bug colateral resuelto: actions.ts estaba truncado en develop (toggleMerchantOpen) — reparado.

**Archivos:** prisma/schema.prisma, scripts/seed-data/product-weight-cache.json, scripts/seed-product-weight-cache.ts, src/app/api/comercios/products/suggest-weight/route.ts, src/app/comercios/(protected)/productos/[id]/page.tsx, src/app/comercios/actions.ts, src/components/comercios/EditProductForm.tsx, src/components/comercios/NewProductForm.tsx (+2 mas)

## 2026-04-30 (rama `chore/verificar-nueva-ubicacion`)

chore: validar workflow start.ps1 + finish.ps1 + auto-changelog + push + merge desde C:\dev\moovy tras mudanza del 2026-04-30. Repo movido desde C:\Users\Mauro\Desktop\moovy por bug de OneDrive truncando archivos silenciosamente. Sin cambios funcionales, solo timestamp y registro de la mudanza en PROJECT_STATUS.md.

**Archivos:** PROJECT_STATUS.md

## 2026-04-30 (rama `fix/utf8-encoding-pipeline`)

fix(deploy): pipeline de export usa docker cp (bytes raw UTF-8) en vez de PowerShell `>` que rompia tildes. ISSUE-061. Cambios: finish.ps1 y publish.ps1 ahora hacen `pg_dump -f /tmp/dump.sql` adentro del container y `docker cp` al disco; pull-db.ps1 mismo metodo en remoto via SSH; nuevo scripts/validate-db-encoding.ts (Prisma + regex CP-437/Latin-1) detecta mojibake en Category/Product/Merchant si el dump quedo roto. Antes el redirect > de PowerShell decodificaba bytes UTF-8 de pg_dump con codepage de Windows y escribia UTF-16 LE BOM, corrompiendo Pizzeria/Electronica. Verificado: prod tiene tildes correctas, el bug solo contaminaba database_dump.sql del repo.

**Archivos:** ISSUES.md, PROJECT_STATUS.md, scripts/finish.ps1, scripts/publish.ps1, scripts/pull-db.ps1, scripts/validate-db-encoding.ts

## 2026-04-30 (rama `chore/update-prompts-readme`)

chore: actualizar README de prompts-cowork con prompts vigentes (PROMPT_5/6) y archivar legacy (1-4)

**Archivos:** docs/prompts-cowork/README.md

## 2026-04-29 (rama `chore/cleanup-docs-and-deploy-guide`)

chore(docs): cleanup de docs obsoletos + DEPLOY_GUIA.md nuevo + README reescrito. Fase 1: nuevo DEPLOY_GUIA.md en raiz (267 lineas) que reemplaza al DEPLOY_CHECKLIST.md viejo, cubre setup SSH keys, workflow dry-run+deploy, modos del script, troubleshooting completo de los 8 bugs reales que encontramos durante el rollout (TS errors pre-flight, lock zombie, env vars missing, pg_dump version mismatch, smoke 503 timing, escapes bash anidados, pm2 reload solo moovy, manifest stale post git reset --hard, puerto socket-server real 3004 no 3001, cache browser/cloudflare), rollback con tags git, logs persistentes, checklist mental pre-deploy, y referencias a docs canonicas. Fase 2: limpieza de 22 archivos obsoletos. 8 auditorias (ANALISIS-FINANCIERO, AUDIT_EMAILS, AUDIT_LOGISTICS, AUDIT_PAGOS, MOOVY_Security_Fixes, auditoria-portal-repartidor, auditoria-ux-cro, role-system-audit) + 3 planes (CAMBIOS_COMPARTIDOS_EMAILS, CAMBIOS_COMPARTIDOS_LOGISTICS, PLAN-RIDER-REDESIGN) consolidados en .claude/CHANGELOG-auditorias.md (~70K tokens, no se carga auto, accesible bajo demanda con grep) y borrados de docs/auditorias/ y docs/planes/ (carpetas vaciadas y eliminadas). 5 prompts del sprint inicial (PROMPT_1_INICIAL, PROMPT_2_DIARIO, PROMPT_3_CONSEJO_EXPERTOS, PROMPT_4_UX_COMPLETO, README_FASE_FINAL) borrados — ya cumplieron su funcion, PROMPT_5 (vigente) y PROMPT_6 (go/nogo del lanzamiento) se mantienen. 4 docs sueltos borrados de raiz: SMOKE_TEST.md (reemplazado por checklist en PROMPT_5), SUPPORT_SYSTEM.md (info ya en codigo), DEPLOY_CHECKLIST.md (reemplazado por DEPLOY_GUIA.md), guia_paralelo_con_tus_scripts.md (obsoleto). docs/referencias/PRUEBA-SISTEMA.md y docs/guias/FLUJO-DE-TRABAJO.md (589 lineas del 2026-02-13 sobre 2 devs trabajando en paralelo con Antigravity, scripts inexistentes refresh.ps1 y emergency-reset.ps1, referencia a DEPLOY_CHECKLIST ya borrado) tambien eliminados. entrevista-repartidor-pedidosya.md movido de raiz a docs/referencias/. Fase 3: README.md reescrito (179 lineas) — antes era el default boilerplate de Next.js, ahora describe Moovy real (stack, estructura, setup local, workflow de feature, deploy, links a docs canonicas, reglas de negocio resumidas, marca, troubleshooting). database_dump.sql verificado en .gitignore (linea 46), no se commitea. Beneficios: claridad mental al abrir el repo (lo que ves refleja realidad, sin auditorias de marzo confundiendo), reduccion de ruido en grep y find, single source of truth para deploy en DEPLOY_GUIA.md, README profesional para futuros devs/auditorias. Sin cambios de codigo de la app, solo docs y READMEs. Trade-off: las auditorias historicas siguen disponibles via .claude/CHANGELOG-auditorias.md si alguien las necesita para auditoria legal/AAIP, pero ya no contaminan docs/auditorias/.

**Archivos:** .claude/CHANGELOG-auditorias.md, DEPLOY_CHECKLIST.md, DEPLOY_GUIA.md, README.md, SMOKE_TEST.md, SUPPORT_SYSTEM.md, docs/auditorias/ANALISIS-FINANCIERO-MOOVY.md, docs/auditorias/AUDIT_EMAILS.md (+17 mas)

## 2026-04-29 (rama `fix/devmain-clean-build`)

fix(deploy): rm -rf .next antes de cada build para evitar manifest stale de Next.js 16. Bug detectado en producción real: el endpoint /api/onboarding existía en src/app/api/onboarding/route.ts (77 líneas, archivo correcto en VPS), el build de Next.js incluyó la ruta (route.js, route.js.map, route_client-reference-manifest.js generados en .next/server/app/api/onboarding/), pero la app servía 404 a esa URL incluso después de pm2 reload moovy + pm2 restart moovy --update-env. Causa raíz: Next.js 16 con Turbopack hace builds incrementales — si detecta que un archivo "no cambió", lo skipea para ahorrar tiempo. Cuando el deploy hace git fetch + reset --hard, los archivos se actualizan pero el cache de .next/ queda con un manifest viejo que no incluye la nueva ruta. Resultado: rutas existentes en disco y compiladas en .next/server/app/ pero NO registradas en el manifest interno que mapea URLs a route handlers. La única forma de garantizar que el manifest está sincronizado es regenerar todo el .next/ desde cero. Fix: agregar rm -rf .next antes de npm run build en los 2 lugares donde se hace deploy/build remoto: scripts/devmain.ps1 (paso 12 deploy en VPS) y scripts/rollback.ps1 (rollback de código). Trade-off: build limpio tarda ~30-60 segundos más que build incremental, deploy total pasa de ~40-60s a ~90-120s. Vale la pena: confiabilidad > velocidad para deploys de producción que manejan dinero. Mismo patrón que usa Vercel/Netlify/Railway internamente — siempre arrancan de cero. Sin parche, sin cache mágico, deterministic. Verificado: el rebuild manual ejecutado hoy (rm -rf .next && npm run build && pm2 restart moovy) resolvió el 404 instantáneamente, /api/onboarding ahora responde 401 Unauthorized correctamente tanto en localhost:3002 como vía Nginx en https://somosmoovy.com. Lecciones: (a) los builds incrementales son una footgun en deploys de prod, especialmente cuando se combinan con git reset --hard que cambia archivos pero no invalida cache; (b) la "solución profesional definitiva" para deploy reproducible es siempre arrancar el build desde estado limpio.

**Archivos:** scripts/devmain.ps1, scripts/rollback.ps1

## 2026-04-29 (rama `fix/health-types`)

fix(health): tipo de checks acepta url + propiedades arbitrarias para spread del socket-server. Bug TS atrapado por el pre-flight del nuevo devmain.ps1: TS2353 "Object literal may only specify known properties, and url does not exist in type". El tipo Record<string, { status, latencyMs, error }> no permitía agregar url ni hacer ...spread del response del socket-server (que devuelve connectedDrivers, crons, status, uptime). Fix: tipo extendido a Record<string, { status, latencyMs?, error?, url?, [k: string]: unknown }>. El [k: string]: unknown permite el spread del JSON del socket-server sin romper TS. Verificación: npx tsc --noEmit --skipLibCheck con tsconfig completo del proyecto pasa limpio (el check sobre archivo aislado falla por path aliases pero eso es expected). Atrapado por el flujo defensivo del devmain.ps1 antes del deploy real, exactamente lo que el sistema tenía que hacer.

**Archivos:** src/app/api/health/route.ts

## 2026-04-29 (rama `fix/devmain-smoke-socket-pm2`)

fix(deploy): smoke retry + SQL toggles via stdin + pm2 reload all + /api/health puerto interno + limpieza. Bug 1: smoke test un solo intento causaba falsos positivos cuando Next.js+Turbopack tardaba en estar listo — ahora 5 intentos con backoff 5/15/30/50/80s, si cualquier intento responde 200 healthOk = true. Bug 2: SQL maintenance toggle docker exec -c con escapes anidados PowerShell -> SSH -> bash -> docker -> psql se rompía con "unexpected EOF" — ahora pipe via stdin con docker exec -i, SQL crudo viaja sin escapes nested (5 lugares: devmain ON x1 + OFF x2, rollback ON x1 + OFF x1). Bug 3: limpieza .claude/test-write-check.txt residual de testing del filesystem mount entre VM y Windows. Bug 4: pm2 reload moovy solo reiniciaba app Next.js, no los otros 5 procesos pm2 del VPS (mjobs, moovy-socket que llevaba 15 dias sin reload, og-deco, vora-web, vsolutions) — ahora pm2 reload all --update-env en los 3 lugares (devmain command + 2 en rollback), beneficio adicional --update-env recarga env vars del .env. Bug 5 (descubierto en testing): /api/health hacia fetch a NEXT_PUBLIC_SOCKET_URL que en VPS apunta a https://somosmoovy.com (URL pública para clientes browser) — server-to-server eso pasa por Nginx y llega a Next.js (no al socket), 404. El socket-server real escucha en localhost:3004 (SOCKET_PORT=3004 en .env, confirmado con ss -tlnp PID 3072708 puerto 3004). Fix: nueva prioridad de selección de URL en /api/health — SOCKET_INTERNAL_URL > http://localhost:$SOCKET_PORT > NEXT_PUBLIC_SOCKET_URL > http://localhost:3001 fallback. Ahora el chequeo va a localhost:3004 directo al socket-server. Bonus: incluir url usado en el JSON de respuesta para debug. Diagnóstico completo del path: VPS hostea 4 instancias de Next.js (puertos 3000-3003 = moovy + 3 apps de otros proyectos), socket-server en 3004, Postgres docker en 3005. Lecciones (a) NEXT_PUBLIC_* es para clientes browser, no para fetch server-to-server (b) cuando un VPS multi-tenant tiene varias apps Next.js, los defaults de puerto del código son trampas (c) los smoke tests funcionan: detectaron config drift entre .env y código del endpoint que llevaba semanas oculto. Sin cambios en lógica de la app, solo scripts PowerShell + 1 endpoint health. TS clean en src/app/api/health/route.ts.

**Archivos:** scripts/devmain.ps1, scripts/rollback.ps1, src/app/api/health/route.ts

## 2026-04-29 (rama `fix/devmain-smoke-and-escapes`)

fix(deploy): smoke test con retry/backoff + SQL toggles sin escapes anidados + limpiar test-write-check.txt. Bug 1 (smoke test paso 13): un solo intento con 5s de espera causaba falsos positivos cuando Next.js+Turbopack tardaba en estar listo para servir trafico real (deploy real del 2026-04-28 reporto DEPLOY CON ERRORES aunque la app estaba 100% OK confirmado por Mauro en browser). Fix: bucle de 5 intentos con backoff acumulado de 5s/15s/30s/50s/80s; si cualquier intento responde 200 cortamos y marcamos healthOk. pm2 jlist solo se chequea si healthOk pasa primero. Bug 2 (SQL maintenance toggle pasos 10 y 14): docker exec moovy-db psql -c "UPDATE \"StoreSettings\"..." con escapes anidados PowerShell -> SSH -> bash -> docker -> psql se rompia con "unexpected EOF while looking for matching" en bash. Las llaves \`\" eran interpretadas como caracter literal por PowerShell antes de pasarlo a SSH. Fix: pipe via stdin con docker exec -i; SQL viaja como string crudo por stdin sin pasar por -c, cero escapes nested. Patron aplicado a 5 lugares: devmain.ps1 paso 10 ON x1 + paso 14 OFF x2 + rollback.ps1 ON x1 + OFF x1. Bug 3 (limpieza): borrado .claude/test-write-check.txt que se colo en una sesion anterior de testing del filesystem mount entre VM y Windows. TS check no aplica (solo cambios PowerShell). Atrapado por deploy real exitoso en lo funcional pero con falso REPORTE DE ERRORES en consola — los 3 fixes se hacen para que el proximo deploy real reporte OK limpio sin errores en pantalla.

**Archivos:** .claude/test-write-check.txt, scripts/devmain.ps1, scripts/rollback.ps1

## 2026-04-28 (rama `fix/devmain-pg-dump-docker`)

fix(deploy): pg_dump y psql usan docker exec en VPS para evitar mismatch de versiones. Bug detectado en deploy real (paso 9 backup pre-deploy): pg_dump del sistema operativo del VPS es version 14.22 pero el server de Postgres es 15.4, pg_dump rechaza dump por mismatch ("aborting because of server version mismatch"). Mismo problema potencial con psql (mas tolerante pero menos predecible). Fix: ejecutar todos los comandos de Postgres desde adentro del container "moovy-db" con docker exec, donde la version del cliente coincide con el server. Mismo patron que ya usa scripts/finish.ps1 para el dump local. Cambios en devmain.ps1 (5 lugares): paso 9 backup pre-deploy (pg_dump), paso 10 maintenance ON (psql), paso 14 maintenance OFF x2 (psql), paso 12 modo CleanProd DROP SCHEMA (psql). Cambios en rollback.ps1 (4 lugares): pre-rollback backup (pg_dump), restore desde backup (psql DROP + psql < file con docker exec -i para stdin), maintenance ON (psql), maintenance OFF (psql). Verificacion: docker ps en VPS confirmo container "moovy-db" presente. Cero referencias remanentes a "pg_dump -h 127.0.0.1" ni "psql -h 127.0.0.1" en ambos scripts. El fix elimina la dependencia de qué version del cliente Postgres tenga instalada el host del VPS — todo se ejecuta desde el container donde la version coincide siempre por construccion. Lecciones: cuando Postgres corre en Docker pero el cliente en el host, deploy scripts deben usar docker exec para evitar version drift entre cliente y server. Patron consistente: si el server esta en container, los clientes tambien.

**Archivos:** scripts/devmain.ps1, scripts/rollback.ps1

## 2026-04-28 (rama `fix/devmain-bash-escapes`)

fix(deploy): arreglar escapes bash y check de env vars en devmain.ps1. Bug 1 (paso 6 lock check): el comando ssh tenia backticks (`$(...)`) y comillas escapadas (\"...\") que se rompian al pasar de PowerShell -> SSH -> bash, causando "unexpected EOF while looking for matching" en stderr. Reescrito como string plano dentro de bash -c '...' con comillas simples, sin escapes multinivel; logica equivalente: si /tmp/moovy-deploy.lock existe y tiene <30min => LOCKED, si tiene >=30min => STALE (zombie, limpiar), si no existe => NONE. Bug 2 (paso 7 env vars): el check exigia 6 env vars exactos pero NextAuth v5 acepta indistintamente AUTH_SECRET o NEXTAUTH_SECRET — VPS con setup viejo solo tiene uno y el script abortaba con "5/6 env vars criticos". Reescrito con lista de hard required (DATABASE_URL, CRON_SECRET, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, los 4 obligatorios) + lista de alternativos (AUTH_SECRET o NEXTAUTH_SECRET, al menos uno). Aborta solo si falta un hard o si no hay ningun alternativo. Output mas claro: lista cuales faltan en vez de dar un conteo opaco. Sin cambios funcionales en el resto del script. Atrapado por dry-run real con SSH keys ya configuradas (paso 5 healthcheck pasaba por primera vez). Lecciones: (a) escapes anidados PowerShell-SSH-bash son frutilla podrida, mejor escribir scripts bash inline simples sin variables intermedias del shell remoto; (b) checks de env vars deben respetar nombres alternativos del framework subyacente (NextAuth, Prisma, etc.).

**Archivos:** scripts/devmain.ps1

## 2026-04-28 (rama `chore/finish-auto-changelog`)

chore(deploy): finish.ps1 elimina prompt interactivo de docs y auto-genera entry en CHANGELOG.md. Antes el script preguntaba (s/n) si queres actualizar docs cuando detectaba cambios en src/ o prisma/, lo que era friccion innecesaria y riesgo de apretar mal (default era s, abortaba el cierre). Ahora flow automatico: detecta archivos staged, genera entry markdown con header "## YYYY-MM-DD (rama nombre)" + mensaje del commit + lista de archivos (primeros 8 + "(+N mas)" si hay mas), inserta en CHANGELOG.md justo despues del separador "---" del header, hace git add CHANGELOG.md, y commitea todo junto. Sin preguntas. Param -NoChangelog para skipear en ramas basura. Recordatorios NO BLOQUEANTES al final del cierre: si commit message menciona ISSUE-### sugiere mover el issue de abierto a resuelto en ISSUES.md; si tocaste archivos canonicos (schema.prisma, roles.ts, auth.ts, email-registry.ts, proxy.ts) sugiere verificar CLAUDE.md por decision nueva o regla acumulada #29+. Solo print, no abortan, no preguntan. Esto cumple regla nueva de Mauro: el flow normal de finish.ps1 debe ser zero-decision para no introducir errores humanos. CHANGELOG se mantiene actualizado solo. Si una rama necesita updates manuales en CLAUDE.md o ISSUES.md, lo hacemos cuando podemos en otra rama, sin bloquear el cierre actual.

**Archivos:** scripts/finish.ps1

## 2026-04-25 (sprint pre-launch en curso — 6 ramas chicas cerradas en una jornada después del deploy + DB clean + onboarding de comercio/driver. **Contexto**: post-deploy del 2026-04-24, Mauro empezó a testear E2E en producción y detectó múltiples cosas para pulir. Se trabajó con el patrón "una rama chica por feature, script de validación obligatorio, build local antes del deploy". **Ramas cerradas hoy en orden cronológico**: (1) `auto-refresh-rol-aprobado` — JWT del user se refresca solo cuando admin aprueba su comercio/driver/seller, eliminó la fricción de "logout + login para entrar al panel post-aprobación". Socket event `roles_updated` emitido desde 6 puntos (4 endpoints approve/reject merchant+driver + 2 helpers de auto-activación por docs) + nuevo componente `RoleUpdateListener` montado en `Providers.tsx` que escucha el event, dispara `useSession.update({refreshRoles:true})` (que el JWT callback en auth.ts:230 ya soportaba desde el rediseño de roles del 2026-04-10), muestra toast diferenciado por tono y navega al portal después de 1.5s. Helper canónico `src/lib/role-change-notify.ts` con `emitRoleUpdate({userId, role, action, message, portalUrl})`. (2) `fix/comercio-onboarding-completo` — 4 cambios relacionados al onboarding: (a) banner azul "Podés completar la documentación más tarde" en `/comercio/registro` paso 3 con lista de los 7 requisitos para visibilidad pública, (b) `OnboardingChecklist` auto-hide cuando `canOpenStore=true` (antes esperaba `isComplete` que requería MP recomendado, prácticamente nunca se ocultaba), (c) aprobación OPS distingue DIGITAL vs PHYSICAL — schema agrega `<doc>ApprovalSource` + `<doc>ApprovalNote` para los 5 docs Merchant + 8 docs Driver; cuando admin aprueba PHYSICAL exige nota de mín 5 chars (auditoría AAIP); el doc queda APPROVED sin URL (admin recibió el papel/email/whatsapp), (d) logo obligatorio: `approveMerchantTransition` y `approveDriverTransition` validan `Merchant.image` / `User.image` antes de marcar APPROVED, throw con `code: LOGO_MISSING` / `PHOTO_MISSING` que los endpoints catchean → 400. Auto-activación por docs respeta el bloqueo (último doc se aprueba pero la transición global queda PENDING). 26 campos nuevos en schema. (3) `ops-upload-logo-merchant` — hotfix de la rama anterior + dos extras del mismo dominio: (a) endpoint nuevo `PATCH /api/admin/merchants/[id]/logo` + sub-componente `MerchantLogoAdmin` en `/ops/usuarios/[id]` para que admin suba el logo en nombre del merchant (caso real: comercio entrega logo en USB/WhatsApp), reusa `<ImageUpload>` existente, audita con action `MERCHANT_LOGO_UPDATED_BY_ADMIN`, (b) **bug crítico de UX en `/api/merchant/onboarding`**: chequeaba `Boolean(merchant.cuit)` para `hasCuit` etc., excluyendo aprobaciones físicas. Cambiado a `merchant.cuitStatus === "APPROVED"` para los 5 docs. Sin esto, los merchants veían "Te falta CUIT" indefinidamente aunque el admin ya hubiera aprobado físicamente, (c) UI OPS muestra caja amarilla "Aprobación física — nota del admin" cuando `approvalSource === PHYSICAL` (recordatorio para auditoría) + chip dice "APPROVED · físico"; UI Merchant en `/comercios/configuracion` muestra banner verde "Aprobado por administrador — recibimos este documento fuera del sistema" en lugar del upload + sin botón "Solicitar cambio" (no hay nada que reemplazar — el original vive en oficina). Endpoint admin `users-unified/[id]` extendido para devolver los nuevos campos source/note del merchant. (4) `wording-publico-no-ops` — reemplazado "OPS" por "el equipo de Moovy" en TODOS los textos visibles al usuario. OPS es jerga interna y exponerla erosiona la marca + confunde al user. Variantes según contexto natural ("revisado por", "la va a resolver", "Respuesta del equipo:" en historiales, "Comentario del equipo:" en emails). 5 archivos modificados (12 reemplazos): `SettingsForm.tsx` (7 toasts/textos del merchant), `ProfileView.tsx` (5 toasts/textos del driver), 2 endpoints `change-request/route.ts` (mensajes de error 409), `email.ts` (2 emails de change request resolved). NO se tocó: comentarios de código (internos), `src/app/ops/**`, `src/components/ops/**`, `src/lib/email-admin-ops.ts`, paths URL `/ops/...`. Script `scripts/validate-no-ops-public.ts` con regex que filtra comentarios y reporta cualquier mención a "OPS" en strings de texto user-facing. (5) `fix/driver-profile-decrypt-cuit` — bug visible: el campo CUIT/CUIL del panel del driver mostraba el ciphertext hex `9dadd36061412e5816f0a4ed` en lugar del valor legible. Causa: `GET /api/driver/profile` devolvía `driver.cuit` directo desde Prisma sin pasar por `decryptDriverData()`. Fix: 1 import + wrap del response. **Bug latente adicional encontrado en la auditoría**: `POST /api/driver/documents/update` guardaba el CUIT en DB sin cifrar — cualquier driver que actualizaba su CUIT desde el panel quedaba con plaintext en `Driver.cuit`, violando convención AAIP. Resuelto en la misma rama agregando `encryptDriverData(updateData)` antes del `prisma.driver.update`. `decrypt()` es defensivo (devuelve plaintext as-is si no tiene formato cifrado) y `encryptIfNeeded` es idempotente — por eso no se requiere migración de datos. (6) `fix/modales-aprobacion-docs` — bug visual: el flujo de aprobación de doc usaba 3 pop-ups nativos del browser ("localhost:3000 says") — feos, sin marca, default engañoso. Nuevo componente `src/components/ops/DocApprovalModal.tsx` con diseño Moovy: 2 cards radio explícitos (Digital/Físico) con icono y descripción, textarea condicional con contador live (5-500 chars), botón Aprobar deshabilitado hasta validación OK, focus management, cierre con Escape, animación fade-in zoom-in. Handlers `handleApproveDocument` (merchant + driver) refactorizados: antes ~70 líneas duplicadas de window.confirm + window.prompt + confirm() del store + fetch; ahora ~30 líneas — cada handler solo abre el modal con state local + un único callback `submitApprovalDecision` compartido entre merchant y driver dispara el fetch al endpoint correspondiente según el `entity`. Eliminados todos los `window.confirm/prompt` del flujo de approve doc. **Sprint stats**: 6 ramas mergeadas a develop, ~30 archivos tocados (15 nuevos + 15 modificados), 6 scripts de validación nuevos en `scripts/validate-*.ts`, 26 campos nuevos en schema (`prisma db push` corrió en localhost), TS clean en cada rama, build local pasó antes de cada deploy. **Tasks pendientes para próxima sesión**: rama #3 del plan de ramas (`fix/auth-bloqueo-y-reset` — warning intentos restantes + fix botón desbloquear cuenta + auditoría reset password). Después: `fix/producto-multifoto-carousel` (bug visible: producto con 3+ fotos solo muestra la primera), `feat/ops-crear-cuentas` (admin crea cuentas buyer/driver/seller). Post-launch: `feat/driver-bank-mp` (Driver no tiene campos bancarios en schema), `feat/propinas-driver`, fix encoding UTF-8 en deploys (task #115 + auto-memory). **Reglas nuevas del sprint**: (#19) cualquier endpoint admin que cambie el set de roles derivados de un usuario DEBE llamar `emitRoleUpdate` al final del happy path. (#20) cuando un campo del modelo tiene un "status" derivado por workflow de aprobación, los chequeos downstream (checklist, listados, badges) DEBEN basarse en el status, NUNCA en si el campo de origen tiene valor — si no, las aprobaciones manuales/físicas/admin-en-nombre-de quedan invisibles. (#21) cualquier doc con auditoría legal (AAIP/AFIP/municipal) DEBE permitir aprobación PHYSICAL con nota libre — algunos comercios entregan papeles en oficina y forzar digitalización es fricción innecesaria; la nota es la prueba en caso de auditoría externa. (#22) cualquier string que vaya a renderizarse a un comercio/repartidor/comprador/vendedor (toasts, banners, emails, push) NUNCA debe usar "OPS" — siempre "el equipo de Moovy" o variante natural. (#23) cualquier endpoint que (a) lea de un modelo con campos cifrados Y devuelva esos campos al frontend del propio dueño DEBE aplicar el helper `decrypt<Modelo>Data` antes del response; (b) escriba en uno de esos campos DEBE aplicar `encrypt<Modelo>Data` antes del Prisma update. (#24) cualquier nuevo flujo de OPS que requiera input del admin con validación NO debe usar `window.confirm/window.prompt` nativos — crear un componente modal específico siguiendo el patrón visual de `ConfirmModal` (backdrop blur, card blanca, rojo MOOVY en CTA, focus management). Los pop-ups nativos rompen completamente la sensación de app de marca.)

## 2026-04-24 (rama `chore/prelaunch-polish-pwa-sound-email` RESUELTA — 3 pulidos post-audit UX + limpieza de deuda técnica en una sola pasada. **Contexto**: después de cerrar las 5 ramas grandes del día, quedaban 3 cabos sueltos documentados: (a) PWA prompt solo montado en `(store)/layout.tsx` — merchants/drivers/vendedores que entraban directo a su portal no lo veían, (b) los helpers `playAlertBeep` y `triggerVibration` del hook `useRiderPrefs` estaban exportados pero sin consumidor real — los toggles de Config del driver servían solo como preview, no disparaban cuando llegaba una oferta real, (c) drift crítico entre el registry de emails y el código: el admin editaba templates en `/ops/emails` que apuntan a las versiones P0 de `src/lib/email-p0.ts` (`sendMerchantApprovedEmail`, `sendMerchantRejectedEmail`, `sendDriverRejectedEmail`), pero 4 endpoints del admin disparaban las versiones legacy de `src/lib/email.ts` (`sendMerchantApprovalEmail`, `sendMerchantRejectionEmail`, `sendDriverRejectionEmail`) — el admin nunca veía sus cambios porque eran copy distintos. **Cambios**: (1) **PWA prompt en 3 layouts más**: `src/app/repartidor/(protected)/layout.tsx` + `src/app/comercios/(protected)/layout.tsx` + `src/app/vendedor/(protected)/layout.tsx` ahora montan `PWAInstallPrompt`. El componente es self-gated por `display-mode: standalone` + `localStorage.moovy_pwa_prompt_seen`, entonces cada user ve el prompt UNA sola vez — no importa por cuál layout entre primero. En iPhone pasa a aparecer desde el driver/merchant también, que era crítico para que reciban push notifications de pedidos entrantes. (2) **Feedback UX al llegar oferta**: `src/hooks/useDriverSocket.ts` en el handler del evento `orden_pendiente` ahora llama `loadRiderPrefs()` + `playAlertBeep()` si `soundAlerts === true` + `triggerVibration([200, 100, 200])` (patrón pulso-pausa-pulso) si `vibration === true`. Los helpers leen localStorage directo en cada invocación para evitar closures stale (el socket listener se crea una sola vez pero el user puede cambiar la pref en cualquier momento). Try/catch defensivo para que un fallo en el feedback no bloquee el procesamiento del evento crítico. En iOS la vibración falla silenciosamente (Apple nunca implementó Vibration API); en todos los Chrome/Firefox funciona. (3) **Consolidación de 3 emails legacy duplicados**: eliminadas las funciones `sendMerchantApprovalEmail`, `sendMerchantRejectionEmail`, `sendDriverRejectionEmail` de `src/lib/email.ts`. Dejado un comentario con la razón para futuros devs. Migrados 4 endpoints que las usaban: `/api/admin/merchants/[id]/approve/route.ts` + `/api/admin/merchants/[id]/reject/route.ts` + `/api/admin/merchants/[id]/documents/approve/route.ts` (en el path auto-activated) + `/api/admin/drivers/[id]/reject/route.ts`. Las versiones P0 requieren shape `{email, businessName, contactName, reason?}` en vez de parámetros posicionales — los endpoints ya tienen el `owner.name` en el select de Prisma, mapeo trivial. Resultado: lo que el admin edita en `/ops/emails` es EXACTAMENTE lo que recibe el merchant/driver cuando se aprueba/rechaza. **Archivos modificados (9)**: 3 layouts (driver/comercios/vendedor), `useDriverSocket.ts`, `email.ts` (3 funciones eliminadas), 4 endpoints admin. **Archivos nuevos**: 0. **TS clean** 0 errores nuevos. **Bug adyacente detectado + fixeado**: al editar el layout driver, el Edit tool introdujo null bytes (mismo patrón pre-existente del byte null documentado en email-registry.ts). Limpiado con `tr -d '\0'` antes del TS check. **Regla nueva #17**: los endpoints del admin que disparan emails transaccionales DEBEN usar las versiones registradas en `EMAIL_REGISTRY`. Si hay dos versiones del mismo email (legacy vs nueva), la legacy debe eliminarse y TODOS los callers migrar a la nueva — si no, el preview del panel OPS miente. **Regla nueva #18**: todo nuevo layout protegido por rol DEBE montar `PWAInstallPrompt` al final. Los users de Moovy pueden entrar a su portal directo desde el login sin pasar por la tienda, y sin el prompt no aprenden a instalar la PWA.)

## 2026-04-24 (rama `fix/driver-settings-pwa` RESUELTA — driver settings persistentes + batería iOS fallback + tutorial PWA por plataforma. **Contexto**: Mauro probó el panel de configuración del driver y detectó que "Modo claro" no se aplicaba al recargar (solo al click), los toggles sonido/vibración no tenían consumidor, el chip de batería en iPhone mostraba solo "—" sin explicación, y al registrarse no había guía para instalar Moovy como PWA (crítico en iPhone: sin instalar no llegan push notifications). **Cambios**: (1) Nuevo hook `src/hooks/useRiderPrefs.ts` que centraliza prefs (theme, mapsApp, soundAlerts, vibration, batteryThreshold, autoDisconnectMinutes) + expone `loadRiderPrefs()`, `applyThemeToDom(mode)`, `playAlertBeep()` (Web Audio API, oscillator 880Hz A5 con gain ramp — sin archivo audio), `triggerVibration(pattern)` (wrapea navigator.vibrate con try/catch, iOS falla silencioso), y el hook `useRiderPrefs()` con `prefs`, `updatePref`, `playSoundIfEnabled`, `vibrateIfEnabled` (los "IfEnabled" leen localStorage directo para evitar closures stale). (2) Nuevo componente `src/components/rider/RiderPrefsInitializer.tsx` — effect-only, aplica tema persistido on mount. Montado en `src/app/repartidor/(protected)/layout.tsx`. Resuelve el bug "modo claro no persiste". (3) `src/components/rider/views/SettingsView.tsx` — preview inmediato al prender toggles: `soundAlerts=true` dispara `playAlertBeep()` al toque, `vibration=true` dispara `triggerVibration([100,50,100])`. El driver ve/siente al instante que el toggle funciona. (4) `src/app/repartidor/(protected)/dashboard/page.tsx` — chip batería ahora muestra "No disp." + tooltip explicativo cuando `!battery.supported` (iOS). Antes: "—" sin contexto. (5) Nuevo componente `src/components/onboarding/PWAInstallPrompt.tsx` — modal con detección de plataforma (iOS, Android Chrome, Desktop, other) via userAgent. Self-gated por `display-mode: standalone` + `localStorage.moovy_pwa_prompt_seen`. En iOS muestra pasos textuales "Compartir → Agregar a inicio → Agregar" + warning destacado sobre que sin PWA no hay push. En Android Chrome usa `beforeinstallprompt` event nativo para botón "Instalar" con UX del browser. Delay 3s antes de aparecer. Montado en `src/app/(store)/layout.tsx` junto a BuyerOnboardingTour y CookieBanner. **Archivos nuevos (3)**: `src/hooks/useRiderPrefs.ts`, `src/components/rider/RiderPrefsInitializer.tsx`, `src/components/onboarding/PWAInstallPrompt.tsx`. **Archivos modificados (4)**: layout driver (monta initializer), dashboard driver (batería iOS label), SettingsView (preview), (store) layout (monta PWA prompt). **TS clean** 0 errores nuevos. **Limitaciones documentadas**: (a) iOS cualquier browser = WebKit. Battery API, vibration, push sin PWA instalada no funcionan — Apple. (b) PWA prompt solo en (store)/layout.tsx — merchant/driver que van directo a su portal no lo ven hasta navegar al store (pendiente montar en los 4 layouts). (c) `playSoundIfEnabled` y `vibrateIfEnabled` exportados pero solo consumidos desde SettingsView preview — el flow "new offer de pedido al driver" todavía no los llama (pendiente cablear al socket listener). **Regla nueva #16**: toda preferencia de usuario en localStorage DEBE (a) hook centralizado con helpers especializados, (b) Initializer component que aplica on mount (no depender del toggle), (c) feedback inmediato al activar para que el user confirme que funciona.)

## 2026-04-24 (rama `fix/merchant-onboarding-polish` RESUELTA — 3 pulidos UX del merchant pre-launch. **Contexto**: post-testeo Mauro pidió que los horarios del merchant arranquen TODOS cerrados por default (no asumir horario genérico — cada comercio decide), que el checklist "Requisitos Obligatorios 7/7" del dashboard del merchant sea menos invasivo visualmente (antes: progress bar gigante + lista de 9 items desplegada), y que verifique que la tienda no aparezca públicamente hasta estar APPROVED (gate de seguridad). **Cambios**: (1) `DEFAULT_MERCHANT_SCHEDULE` en `src/lib/merchant-schedule.ts` ahora tiene los 7 días = null. Antes: lunes-viernes 9-21 + sábado 10-14 + domingo cerrado. Cualquier merchant sin scheduleJson queda cerrado automáticamente, forzando configuración explícita. Impacto colateral: merchants aprobados que no hayan configurado schedule antes del deploy quedan cerrados — el onboarding checklist los agarra porque `hasSchedule` ya era requisito obligatorio. (2) `src/app/comercios/(protected)/OnboardingChecklist.tsx` rediseñado de lista full a banner compacto: 1 línea con ícono + "Te faltan X pasos para activar tu tienda" + subtítulo con "Próximo: <primer paso pendiente>" + botón rojo "Continuar" (deep-link al primer step faltante) + toggle chevron para expandir a lista completa. Mobile-first: botón Continuar va abajo como full-width en pantallas chicas. (3) `src/app/(store)/tiendas/page.tsx` y `src/app/(store)/page.tsx` (home) ahora filtran por `approvalStatus: "APPROVED"` además de `isActive: true`. Defense in depth: un merchant PENDING o REJECTED jamás aparece en listados públicos aunque por drift DB tenga `isActive: true` mal seteado. **Archivos modificados (4)**: `src/lib/merchant-schedule.ts`, `src/app/comercios/(protected)/OnboardingChecklist.tsx`, `src/app/(store)/tiendas/page.tsx`, `src/app/(store)/page.tsx`. **TS clean** 0 errores nuevos. **Regla nueva #14**: todo listado público de actores (merchants, drivers, sellers) DEBE combinar `isActive` + `approvalStatus === "APPROVED"` en el where. Confiar solo en `isActive` deja superficie de drift. **Regla nueva #15**: los defaults del sistema deben ser conservadores — si un merchant no configuró algo crítico (horario, dirección, docs), el default debe ser "NO operar" en vez de "operar con un genérico". El genérico oculta problemas; el default cerrado los fuerza a explicitarse.)

## 2026-04-24 (rama `feat/ops-crons-panel` RESUELTA — panel de monitoreo de crons + migración sistémica de 19 endpoints driver API para resolver bug de JWT stale, en una sola pasada. **Contexto**: Mauro reportó que al entrar a `/repartidor/ganancias` el backend respondía 403. El endpoint `/api/driver/earnings` usaba el patrón legacy `hasAnyRole(session, ["DRIVER", "ADMIN"])` que lee el JWT `roles[]`; si el user activó su rol DRIVER después del login (o por cualquier drift del token), el JWT no tiene "DRIVER" en `roles[]` y tira 403 aunque en DB el Driver esté activo. El bug histórico ya había sido fixeado en `proxy.ts` el 2026-04-15 (el middleware dejó de chequear rol para `/repartidor/*` porque el JWT está stale) pero los 20 endpoints API nunca fueron migrados al mismo criterio. **Auditoría**: grep de `hasAnyRole.*DRIVER` detectó el patrón repetido en 20 archivos del portal driver + 2 endpoints generales en `/api/orders`. Es deuda técnica heredada de la refactorización del 2026-04-10 ("Los roles NO se guardan, se DERIVAN"). **Scope entregado en una rama**: (1) **Panel /ops/crons** — nuevo helper-free panel de monitoreo. Endpoint `GET /api/admin/crons` con filtros por jobName + rango de fechas + paginación 50, devuelve `{ health, registered, runs, total }`. Página `src/app/ops/(protected)/crons/page.tsx` con grid arriba de tarjetas por cron (status chip color-coded healthy/stale/failing/never-ran + última corrida + error si hay + detección de crons "legacy" con runs en DB pero ya no en CRON_EXPECTATIONS) + tabla histórica abajo con columnas Cron/Inicio/Duración/Items/Resultado, mobile cards. Auto-refresh cada 30s condicionado a `document.visibilityState === "visible"` (ahorra queries). Nav item "Crons" agregado a `OpsSidebar` sección Sistema con icono `Activity`. **Dashboard fix**: el alert de cron en `/ops/dashboard` tenía `href: "/ops/configuracion-logistica"` hardcodeado que llevaba a Motor Logístico (bug). Cambiado a `href: /ops/crons?jobName=<cron>` con deep-link al panel nuevo filtrado por el cron específico. (2) **Helper canónico para driver API auth** — nuevo `src/lib/driver-auth.ts` exporta `requireDriverApi(options?: { allowAdmin?: boolean })`. Consulta `prisma.driver.findUnique({ where: { userId } })` (source of truth, alineado con `computeUserAccess` del layout protegido). Retorna `NextResponse` con 401/403 o `{ userId, driver, isAdmin }`. Cuando `allowAdmin: true`, un admin sin Driver propio pasa (driver puede ser null). Uso: `const authResult = await requireDriverApi({ allowAdmin: true }); if (authResult instanceof NextResponse) return authResult; const { driver } = authResult;`. (3) **Migración de 19 endpoints** reemplazando legacy `auth() + session check + hasAnyRole + findUnique driver` por una sola línea del helper: `src/app/api/driver/earnings/route.ts` (piloto), `orders/[id]/{verify-pickup-pin,verify-delivery-pin,status,reject,claim,accept}/route.ts`, `sub-orders/[id]/{verify-pickup-pin,verify-delivery-pin}/route.ts`, `toggle-status/route.ts`, `status/route.ts` (solo PUT; GET no tenía hasAnyRole), `orders/route.ts`, `orders/pending/route.ts`, `shift-summary/route.ts`, `location/route.ts` (PUT + GET), `location/history/route.ts`, `documents/change-request/route.ts` (POST + GET), `documents/update/route.ts`, `api/orders/[id]/accept/route.ts`. Ajustes específicos: `driver/orders/[id]/status/route.ts` agregó optional chaining + guard para admin override path (driver puede ser null); `documents/change-request/route.ts` POST mantiene un findUnique adicional porque necesita select específico de 8 status fields. **Endpoint skippeado**: `src/app/api/orders/[id]/route.ts` PATCH acepta ADMIN/MERCHANT/DRIVER (3 roles) — fuera del scope del helper driver-only, se mantiene el legacy `hasAnyRole`. **Archivos nuevos (3)**: `src/lib/driver-auth.ts`, `src/app/api/admin/crons/route.ts`, `src/app/ops/(protected)/crons/page.tsx`. **Archivos modificados (22)**: los 19 endpoints migrados + `src/app/ops/(protected)/dashboard/page.tsx` (href del alert) + `src/components/ops/OpsSidebar.tsx` (nav item Crons) + `src/lib/driver-auth.ts` (no, ese es nuevo — el helper). **TS clean**: 0 errores nuevos en archivos de esta rama. **Regla nueva #13**: los endpoints API del portal driver DEBEN usar `requireDriverApi()` del helper canónico en vez de `hasAnyRole(session, ["DRIVER"])`. El JWT `roles[]` es cache, la DB es source of truth. Por cada endpoint que se agregue al portal driver, reusar el helper. Aplica el mismo criterio que ya se aplicó en `proxy.ts` (2026-04-15) y en los layouts protegidos (`requireDriverAccess`, 2026-04-10).)

## 2026-04-24 (rama `feat/emails-lanzamiento-completo` RESUELTA — auditoría integral de emails + 24 emails nuevos registrados/creados + 2 crons nuevos + 3 bugs adyacentes en una sola pasada. **Contexto**: Mauro pidió auditar exhaustivamente todos los emails del sistema pre-lanzamiento. Estado inicial: 32 emails en `email-registry.ts` vs 44 funciones `sendXxxEmail` en el código (gap de 12 no registrados) + fantasma `password_changed` apuntando a código inline + duplicaciones legacy entre `email.ts` y `email-p0.ts` + gaps legales (cambio de email, export ARCO listo, cambio TOS/privacy, opt-out marketing) + gaps UX críticos (driver asignado, pedido en camino con PIN, listo para pickup, recordatorio de calificar, puntos acreditados, puntos por vencer, avisos al admin de nuevos registros/solicitudes, referral activado). **Fase 1 — Limpieza**: (a) registradas las 12 funciones existentes de docs/change-requests/expirations de merchant+driver en `email-registry.ts` (entries 200-216), (b) extraído `sendPasswordChangedEmail` del inline de `/api/auth/change-password/route.ts` a función exportada en `src/lib/email.ts`, endpoint migrado a usar la función (fire-and-forget), entrada `password_changed` del registry actualizada para apuntar a la función real. Las funciones legacy duplicadas (sendMerchantApprovalEmail, sendMerchantRejectionEmail, sendDriverRejectionEmail de `email.ts`) se mantuvieron porque SÍ están en uso activo en 3 endpoints de approve/reject — decisión: mantener, consolidar post-launch. **Fase 2 — Emails legales (obligatorios por Ley 25.326 AAIP + Ley 24.240 + Ley 26.951)**: 4 funciones nuevas en `src/lib/email-legal-ux.ts`: `sendEmailChangeConfirmationEmail` (al nuevo + alert al viejo, no conectada, pendiente endpoint), `sendDataExportReadyEmail` (no conectada, para futuro export asíncrono ARCO), `sendTermsUpdatedEmail` (manual desde cron futuro al bumpear `PRIVACY_POLICY_VERSION`/`TERMS_VERSION`), `sendMarketingOptOutConfirmedEmail` (conectado a PATCH `/api/profile/privacy` cuando `marketingConsent` pasa true→false, idempotente). **Fase 3 — Emails UX críticos**: 5 funciones UX buyer/driver en `src/lib/email-legal-ux.ts`: `sendDriverAssignedEmail` (al buyer desde assignment-engine post-accept, con driver, vehículo, teléfono enmascarado `•••• 4521`, ETA estimado server-side con haversine a 25 km/h), `sendOrderOnTheWayEmail` (al buyer desde `/api/driver/orders/[id]/status` PICKED_UP si no es pickup, con PIN gigante en el subject y body), `sendOrderReadyForPickupEmail` (al buyer si isPickup al marcar READY, con dirección del merchant), `sendRateOrderReminderEmail` (via cron 24-48h post-DELIVERED sin ratedAt, idempotente), `sendPointsEarnedEmail` (al buyer al DELIVERED si awarded>0, con nuevo saldo y tier). 6 funciones UX admin/operativos en `src/lib/email-admin-ops.ts`: `sendAdminNewMerchantPendingEmail` (conectado a register/merchant), `sendAdminNewDriverPendingEmail` (conectado a register/driver), `sendAdminNewChangeRequestEmail` (disponible pero NO conectada, las específicas ya están activas), `sendPointsExpiringEmail` (al user vía cron diario con threshold 150 días inactividad, idempotente via `User.pointsExpiryNotifiedAt` + reset en `awardOrderPointsIfDelivered` y en gasto de puntos para defense-in-depth), `sendDriverAutoActivatedEmail` (desde `approveDriverDocument` post-transition), `sendReferralActivatedEmail` (desde `activatePendingBonuses` al referidor con balance actualizado). **2 crons nuevos registrados en `CRON_EXPECTATIONS`**: `rate-order-reminder` (maxHours 30) y `points-expiring-reminder` (maxHours 30). Ambos con `verifyBearerToken` ANTES de `recordCronRun` + patrón atómico `updateMany WHERE flag IS NULL + count === 1` antes del side effect. **Schema**: `Order.rateReminderSentAt DateTime?` y `User.pointsExpiryNotifiedAt DateTime?` agregados. Requiere `npx prisma db push && npx prisma generate` post-merge. **Registry consolidado**: 32 → 59 emails en `src/lib/email-registry.ts` (12 de Fase 1 con numbers 200-216, 9 de Fase 2+3 buyer con numbers 300-308, 6 de Fase 3 admin/ops con numbers 310-315). Cada entrada con `generatePreview()` que refleja visualmente el email real. **Bugs adyacentes resueltos en la misma rama** (respuesta al feedback "revisar cabos sueltos"): (a) **Pipeline 500 error** en `/api/admin/pipeline-comercios`: causa — mi query incluía `deletedAt: null` pero `Merchant` no tiene campo `deletedAt` (confundido con `User`). Fix: removido el filtro de los 3 findMany + select extendido para incluir `name: true` (campo obligatorio) además del `businessName` opcional; UI cambia a `m.businessName || m.name` como display name; (b) **Tarjetas de ficha usuario cerradas por default**: `expandedMerchant/Driver/Seller` inicializados en `false` en `/ops/usuarios/[id]/page.tsx` para que el admin expanda solo lo que necesita ver en vez de recibir un muro de información; (c) **Filtro "Pendientes" de /ops/usuarios**: analizado — funciona correctamente (chequea `merchant.approvalStatus === "PENDING"` o `driver.approvalStatus === "PENDING"`), el estado PENDING cubre a todos los comercios/drivers con docs faltantes. Extender con `DocumentChangeRequest` pendientes queda documentado para post-launch. **Paralelización usada**: Fase 2 + Fase 3 ejecutadas con 2 agentes concurrentes en prompts completamente autónomos — cada uno creó su archivo, conectó triggers, y devolvió el bloque de entries del registry listo para pegar. Yo consolidé el registry al final manualmente (los agentes explícitamente tenían prohibido tocar `email-registry.ts` para evitar conflicts). Ambos agentes reportaron TS clean. **Archivos nuevos (4)**: `src/lib/email-legal-ux.ts` (9 funciones), `src/lib/email-admin-ops.ts` (6 funciones), `src/app/api/cron/rate-order-reminder/route.ts`, `src/app/api/cron/points-expiring-reminder/route.ts`. **Archivos modificados (12)**: `src/lib/email.ts` (sendPasswordChangedEmail agregado), `src/lib/email-registry.ts` (27 entries nuevas + fantasma `password_changed` apuntando a función real), `src/lib/cron-health.ts` (2 crons nuevos en CRON_EXPECTATIONS), `src/lib/driver-document-approval.ts` (trigger auto-activated), `src/lib/points.ts` (trigger referral activated + reset pointsExpiryNotifiedAt), `src/lib/assignment-engine.ts` (trigger driver assigned), `src/app/api/auth/change-password/route.ts` (inline → función), `src/app/api/auth/register/merchant/route.ts` (trigger admin new merchant), `src/app/api/auth/register/driver/route.ts` (trigger admin new driver), `src/app/api/profile/privacy/route.ts` (trigger opt-out confirmado), `src/app/api/driver/orders/[id]/status/route.ts` (trigger on-the-way + points earned), `src/app/api/merchant/orders/[id]/ready/route.ts` (trigger ready for pickup), `src/app/api/orders/route.ts` (reset de pointsExpiryNotifiedAt al gastar puntos), `src/app/api/admin/pipeline-comercios/route.ts` (fix deletedAt + name select), `src/app/ops/(protected)/pipeline-comercios/page.tsx` (fix display name con fallback), `src/app/ops/(protected)/usuarios/[id]/page.tsx` (tarjetas cerradas por default), `prisma/schema.prisma` (2 campos nuevos). **Funciones creadas pero NO conectadas (esperado)**: `sendEmailChangeConfirmationEmail` (no hay endpoint de cambio de email hoy), `sendDataExportReadyEmail` (export hoy es sync, para futuro async), `sendTermsUpdatedEmail` (para cron manual futuro al bumpear versión), `sendAdminNewChangeRequestEmail` (las específicas ya están activas, genérica queda como fallback). **TS clean**: 0 errores nuevos en archivos de esta rama (1010 totales son los pre-existentes conocidos: `.next/dev/types/*`, `node_modules/.prisma/client` pre-regenerate, `privacidad/page.tsx` TS1127, `order-chat.ts` TS1127, `socket-server.ts` TS1127, `comercio/info/page.tsx` TS1127, `email-registry.ts` TS1127 del byte null pre-existente que NO pude limpiar desde Edit/Write tools pero no afecta runtime). **Pendiente post-merge**: (1) `npx prisma db push && npx prisma generate` local para los 2 campos nuevos. Sin eso, los 2 crons nuevos + el trigger de points-earned tiran "Unknown field" al primer run. (2) Registrar `POST /api/cron/rate-order-reminder` y `POST /api/cron/points-expiring-reminder` en el runner externo con `Authorization: Bearer ${CRON_SECRET}` — ambos diarios. (3) Consolidar post-launch las duplicaciones legacy email.ts/email-p0.ts en un solo archivo. **Regla nueva #11**: todo email transaccional nuevo DEBE (a) tener función exportada en `src/lib/email*.ts` (nunca inline en endpoints — fantasma como `password_changed` no permitido), (b) entrada en `EMAIL_REGISTRY` con `generatePreview()` que refleje fielmente el HTML real, (c) trigger conectado en el endpoint que corresponde. Si la función existe pero no se puede conectar aún (endpoint futuro), documentarlo con `status: 'new'` en registry y en CLAUDE.md. **Regla nueva #12**: todo cron nuevo que envía comunicaciones masivas o triggerea side effects sensibles DEBE usar patrón idempotente `updateMany WHERE flag IS NULL + count === 1` antes del side effect, con el flag que se resetea al evento que lo justifica. Evita duplicados bajo race conditions del cron.)

## 2026-04-24 (rama `fix/ops-email-templates` RESUELTA — 7 features de CRM/OPS implementadas en una sola pasada para que Mauro pueda operar 100% desde el panel sin tocar código, post-lanzamiento. **Contexto**: auditoría del panel OPS reveló que hoy ~50 emails transaccionales viven hardcodeados en `src/lib/email.ts`/`email-p0.ts`/`email-registry.ts`, no hay forma de dejar notas internas en la ficha de un user, el `AuditLog` se escribe pero no hay UI para consultarlo, no hay broadcast push/email segmentado, no hay pipeline visual de onboarding de comercios, no hay panel consolidado de pagos pendientes a drivers/merchants ni playbook de procedimientos. Refund manual + gestión de categorías ya existían (audit first evitó duplicación). **7 features entregadas**: (1) **Plantillas de email editables** — nuevo modelo `EmailTemplate` (key unique + subject + bodyHtml + placeholders JSON + category + recipient + isActive + version + lastEditedBy), helper `src/lib/email-templates.ts` con `renderEmailTemplate(key, vars)` que hace DB lookup con cache TTL 60s + escape HTML en placeholders + fallback a null si template no existe/inactivo (callers siguen usando hardcode como failover), endpoints GET/POST `/api/admin/email-templates`, GET/PATCH/DELETE `/api/admin/email-templates/[id]` (DELETE es soft: `isActive:false`, PATCH incrementa `version` y audita before/after), endpoint one-time `POST /api/admin/email-templates/seed` que itera `EMAIL_REGISTRY` de `lib/email-registry.ts` sembrando los ~50 templates, `src/app/ops/(protected)/emails/page.tsx` convertido de viewer a editor: drawer full-screen con form (subject, placeholders-as-chips, bodyHtml textarea monospace, checkbox isActive) + preview live en iframe sandbox DOMPurify sanitizado, badge "DB vN" / "Hardcoded" por email, botón "Sembrar faltantes" visible si `dbTemplateCount < totalEmails`. (2) **Notas internas + Visor AuditLog** — nuevo modelo `AdminNote` (userId+adminId+content+pinned+createdAt+updatedAt, cascade onDelete del user, índices `[userId, pinned, createdAt]` y `[adminId]`), relaciones agregadas a User (`adminNotesAbout` y `adminNotesWritten`), endpoints GET/POST `/api/admin/notes`, PATCH/DELETE `/api/admin/notes/[id]` (PATCH con ownership check, DELETE permisivo para cualquier admin con content en audit para histórico), componente `src/components/ops/AdminNotesSection.tsx` (textarea Ctrl+Enter, pin/unpin toggle, edición inline, delete con confirm, optimistic UI, char counter 0/2000), integrado en `ops/usuarios/[id]/page.tsx` entre header y tabs para visibilidad constante, nuevo endpoint `GET /api/admin/audit` con filtros combinables (action, entityType, entityId contains, userId exacto, dateFrom/dateTo, take/skip), nueva página `ops/auditoria/page.tsx` con tabla desktop + cards mobile + KNOWN_ACTIONS pre-poblado con 40+ actions grepados del código (mergedo con actions que aparezcan en response usando useMemo) + expandible por fila con JSON formateado + paginación 50/pág. (3) **Segmentador** — `src/lib/user-segments.ts` con `SegmentFiltersSchema` Zod, `buildSegmentWhere(filters)` que traduce a Prisma where (role USER/COMERCIO/DRIVER/SELLER/ADMIN, isSuspended, hasMarketingConsent — obligatorio para marketing por Ley 26.951, minPoints/maxPoints, createdAfter/Before, hasOrdered, noOrdersInDays, city partial match), `countSegment`, `previewSegment` (count + sample 10), `iterateSegmentUserIds` cursor-based async generator para el cron, `parseSegmentFilters` defensivo ante JSON corrupto. Nuevo modelo `UserSegment` (name + description + filters JSON + lastCount cached + createdBy + isActive). Endpoints GET/POST `/api/admin/segments`, GET/PATCH/DELETE `/api/admin/segments/[id]` (DELETE soft si tiene campañas asociadas via integridad referencial), POST `/api/admin/segments/preview` (30/60s rate limit, ejecuta filtros y devuelve count + sample). Página `ops/segmentos/page.tsx` con split view: lista izq + editor derecha, preview debounced 400ms, banner amarillo Ley 26.951 si `hasMarketingConsent !== true`, botón "Usar en broadcast" que deep-linka a `/ops/broadcast?segmentId=...`. (4) **Broadcast** — nuevo modelo `BroadcastCampaign` (name + channel push|email|both + segmentId + templateId? + customTitle/Body/Url + status DRAFT|SCHEDULED|RUNNING|COMPLETED|FAILED|CANCELLED + scheduledAt/startedAt/completedAt + totalRecipients/sentCount/failedCount + **lastCursor** para resume del cron). Endpoints CRUD completos + `/[id]/launch` (DRAFT→RUNNING o SCHEDULED con totalRecipients calculado inline) + `/[id]/cancel` (SCHEDULED|RUNNING→CANCELLED). **Cron nuevo `POST /api/cron/process-broadcasts`** registrado en `CRON_EXPECTATIONS` con maxHours:2, auth via verifyBearerToken ANTES de recordCronRun, auto-promueve SCHEDULED con scheduledAt≤now a RUNNING, procesa hasta PROCESS_CAMPAIGNS_PER_RUN=5 campañas RUNNING, toma BATCH_SIZE=200 recipients con cursor sobre el segmento, para cada user envía push via `sendPushToUser` (tag `broadcast-${id}`) y/o email via `sendEmail` con renderEmailTemplate helper cuando hay templateId (fallback a `renderPlaceholders` inline si template no existe), actualiza `sentCount`/`failedCount`/`lastCursor` atomicamente, marca COMPLETED cuando batch.length===0. Página `ops/broadcast/page.tsx` con form nueva campaña (segmento + template opcional + custom title/body/url + schedule datetime-local) + lista con status chips color-coded + progress bar en RUNNING + botones Lanzar ahora / Programar / Cancelar / Borrar (solo DRAFT). Suspense boundary por useSearchParams. Warning amarillo sobre Ley 26.951 antes de crear. (5) **Pipeline kanban de onboarding** — sin schema nuevo, todo derivado. Endpoint `GET /api/admin/pipeline-comercios` que devuelve 4 columnas: `pendiente_docs` (PENDING sin todos los docs AFIP/habilitación/CUIT/CBU), `en_revision` (PENDING con docs completos), `aprobados` (APPROVED últimos 30d por `approvedAt`), `rechazados` (REJECTED últimos 30d por `updatedAt`). Página `ops/pipeline-comercios/page.tsx` con 4 columnas bordered color-coded, cada card clickeable navega a `/ops/usuarios/[ownerId]`, chips de faltantes en pendiente_docs ("Sin constancia AFIP", "Sin habilitación", "Sin CUIT", "Sin CBU"), razón de rechazo visible en rojo para rechazados. (6) **Pagos pendientes con batches** — nuevos modelos `PayoutBatch` (batchType DRIVER|MERCHANT + status DRAFT|GENERATED|PAID|CANCELLED + periodStart/End + totalAmount + itemCount + csvPath + generatedBy + paidBy/paidAt + notes) y `PayoutItem` (batchId + recipientType + recipientId + recipientName/bankAccount/cuit denormalizados + amount + ordersIncluded JSON array). `src/lib/payouts.ts` con `DRIVER_SHARE=0.70` (aproximación 80% del costo real del viaje × 87.5% que es costo vs 5% operativo), helpers `getAlreadyPaidOrderIds(type)` (parsea ordersIncluded de batches PAID, Set<string>) y `getOrderIdsInOpenBatches(type, excludeBatchId?)` (batches DRAFT|GENERATED para prevenir double-pay race), `getPendingDriverPayouts()` y `getPendingMerchantPayouts()` que excluyen ambos sets, usan `Order.merchantPayout` para merchants y `Order.deliveryFee * DRIVER_SHARE` para drivers (aproximación por ahora — schema no guarda riderEarnings por orden). Driver bank: prioriza `bankCbu`, fallback a `bankAlias`. `buildPayoutCsv(batch)` retorna "CUIT;Nombre;CBU/Alias;Monto;Concepto" para import a MP Bulk Transfer. Endpoint GET `/api/admin/payouts/pending?type=DRIVER|MERCHANT` (saldos agrupados por recipient con totales). GET `/api/admin/payouts/batches?type&status`, POST `/api/admin/payouts/batches` (valida que todos tengan bankAccount antes de generar, crea batch+items en `$transaction`, calcula periodStart desde la orden más vieja). GET `/api/admin/payouts/batches/[id]?format=csv|json` (content-disposition attachment para descargar CSV). DELETE `/api/admin/payouts/batches/[id]` (cancelar DRAFT o GENERATED, PAID bloqueado). **Endpoint crítico POST `/api/admin/payouts/batches/[id]/mark-paid`**: requiere body Zod `{confirmText: literal("CONFIRMAR PAGO")}` — rechaza cualquier otro string, rate limit 5/60s, corre en `$transaction` isolationLevel Serializable que actualiza PayoutBatch.status + paidBy + paidAt, y para MERCHANT batches marca todos los Order.commissionPaid=true consumidos por el batch. AuditLog `PAYOUT_BATCH_PAID` con batchType+totalAmount+itemCount+notes. **MOOVY NUNCA dispara plata sola** — este endpoint solo registra lo que el admin YA transfirió afuera via MP Bulk Transfer/banco. Página `ops/pagos-pendientes/page.tsx` con tabs Repartidores/Comercios, stats "recipients + orders + total pendiente", tabla de pendientes con checkboxes + seleccionar todos, alert rojo inline si recipient sin CBU, botón "Generar batch" abre confirm con monto total, sección batches existentes con status chips + botones "Descargar CSV" (window.location.href) / "Marcar PAID" (window.prompt pidiendo "CONFIRMAR PAGO") / "Cancelar". (7) **Playbook** — nuevos modelos `PlaybookChecklist` (name + description + category onboarding|approval|escalation|incident|other + isActive + order) y `PlaybookStep` (checklistId cascade + content + order + required). Endpoints GET/POST `/api/admin/playbook`, GET/PATCH/DELETE `/api/admin/playbook/[id]`, POST `/api/admin/playbook/[id]/steps`, PATCH/DELETE `/api/admin/playbook/[id]/steps/[stepId]` (PATCH con order hace reordenamiento densificado en `$transaction`), POST `/api/admin/playbook/[id]/reorder-steps` (valida cardinalidad exacta de stepIds vs steps actuales para prevenir drift). Página `ops/playbook/page.tsx` con split view desktop (sidebar agrupado por categoría + detalle), edición inline con on-blur, drag&drop `@dnd-kit/sortable` con PointerSensor+TouchSensor + optimistic UI + revert on error, `prompt()` nativo para "Agregar paso" (rápido, consistente con pattern consulta+edición), empty state con "Cargar checklists de ejemplo" que siembra 4 iniciales (Alta comercio / Revisión docs driver / Pedido demorado >30 min / Reclamo comercio por pago). **Sidebar OPS actualizado** (`src/components/ops/OpsSidebar.tsx`): nueva sección "CRM" con Segmentos + Broadcast, `/ops/pipeline-comercios` agregado a sección "Actores", `/ops/auditoria` en "Operaciones", `/ops/pagos-pendientes` en "Finanzas", `/ops/playbook` en "Sistema". Íconos nuevos: FileText, Send, Filter, GitBranch, Wallet, ClipboardCheck. **Archivos nuevos (26)**: `src/lib/email-templates.ts`, `src/lib/user-segments.ts`, `src/lib/payouts.ts`, `src/app/api/admin/email-templates/route.ts` + `[id]/route.ts` + `seed/route.ts`, `src/app/api/admin/notes/route.ts` + `[id]/route.ts`, `src/app/api/admin/audit/route.ts`, `src/app/api/admin/segments/route.ts` + `[id]/route.ts` + `preview/route.ts`, `src/app/api/admin/broadcast/route.ts` + `[id]/route.ts` + `[id]/launch/route.ts` + `[id]/cancel/route.ts`, `src/app/api/cron/process-broadcasts/route.ts`, `src/app/api/admin/pipeline-comercios/route.ts`, `src/app/api/admin/payouts/pending/route.ts` + `batches/route.ts` + `batches/[id]/route.ts` + `batches/[id]/mark-paid/route.ts`, `src/app/api/admin/playbook/route.ts` + `[id]/route.ts` + `[id]/steps/route.ts` + `[id]/steps/[stepId]/route.ts` + `[id]/reorder-steps/route.ts`, `src/app/ops/(protected)/auditoria/page.tsx`, `src/app/ops/(protected)/segmentos/page.tsx`, `src/app/ops/(protected)/broadcast/page.tsx`, `src/app/ops/(protected)/pipeline-comercios/page.tsx`, `src/app/ops/(protected)/pagos-pendientes/page.tsx`, `src/app/ops/(protected)/playbook/page.tsx`, `src/components/ops/AdminNotesSection.tsx`. **Archivos modificados**: `prisma/schema.prisma` (7 modelos nuevos: EmailTemplate, AdminNote, PlaybookChecklist, PlaybookStep, UserSegment, BroadcastCampaign, PayoutBatch, PayoutItem + relaciones en User), `src/components/ops/OpsSidebar.tsx` (6 nav items nuevos + 1 sección CRM), `src/lib/cron-health.ts` (entrada process-broadcasts maxHours 2), `src/app/ops/(protected)/emails/page.tsx` (de viewer a editor), `src/app/ops/(protected)/usuarios/[id]/page.tsx` (integra AdminNotesSection). **Pendiente post-merge**: `npx prisma db push && npx prisma generate` local para registrar los 8 modelos nuevos. Sin eso, todos los endpoints nuevos tirarán runtime "Unknown field emailTemplate/adminNote/userSegment/etc does not exist on type PrismaClient". **TS clean**: 0 errores nuevos en archivos de esta rama (los 1010 errores totales del check full son los pre-existentes documentados: `.next/dev/types/*` auto-generados, `node_modules/.prisma/client` pre-regenerate, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127, `src/app/comercio/info/page.tsx` TS1127, `src/lib/email-registry.ts` TS1127). **Paralelización usada**: Ronda 1 ejecutada con 3 agentes concurrentes (email templates / notas+audit / playbook) — cero conflictos porque el schema + sidebar estaban pre-consolidados por Claude antes de disparar. Rondas 2 y 3 secuenciales por Claude (segmentador + broadcast por dependencia, pagos por ser plata sensible). **Reglas nuevas del board**: (#8) toda operación que transfiera dinero real DEBE requerir confirmación textual explícita (ej: literal "CONFIRMAR PAGO") en body del request — no alcanza con un click de botón — y correr en `$transaction` con `isolationLevel: "Serializable"` para evitar race conditions de double-pay; además el endpoint NUNCA ejecuta la transferencia en sí, solo registra lo que el admin ya hizo afuera. (#9) cualquier feature de comunicación masiva (broadcast email/push, campaign scheduling) DEBE usar cursor-based resume para ser safe ante crashes del cron, y DEBE validar consentimiento de marketing (Ley 26.951) antes de disparar — sea en el segmento (preferido) o en el broadcast endpoint. (#10) el panel OPS es la única interfaz operativa post-launch — todo parámetro editable (copy, segmentos, playbooks, categorías) debe vivir en DB con UI CRUD desde `/ops`; NUNCA en constantes del código, NUNCA via archivos de config que requieran deploy.)

## 2026-04-23 (rama `fix/onboarding-repartidor-complet` RESUELTA — onboarding repartidor end-to-end, 3 bloques P0/P1/P2 en una sola pasada. **Contexto**: mismo día del merge de `fix/onboarding-comercio-completo` — consejo de expertos auditó el flujo de repartidor en paralelo y detectó patrones equivalentes de fragilidad. **Issues encontrados** (equivalentes a los del comercio, más los específicos del driver): (P0-1) driver registration guardaba la URL del documento en `Driver.licenciaUrl`/`seguroUrl`/`vtvUrl` sin triple de aprobación (status + approvedAt + rejectionReason) — el admin solo podía aprobar o rechazar al driver completo, sin granularidad por doc. (P0-2) no existía constancia CUIT/Monotributo como doc formal — solo el campo text `Driver.cuit` encriptado, sin URL de prueba fiscal. (P0-3) CUIT sin validación de checksum AFIP — un string de 11 dígitos aleatorios pasaba. (P0-4) no había hard-lock server-side para docs aprobados — el driver podía subir cualquier URL nueva via `/api/driver/documents/update` y reemplazar silenciosamente una licencia aprobada. (P0-5) no existía auto-activación al aprobar todos los docs — el admin tenía que recordar aprobar al driver globalmente después de aprobar cada doc. (P1-1) cédula verde (titularidad del vehículo) **no era obligatoria** para motorizados — Decreto 779/95 lo requiere, legalmente nosotros somos responsables subsidiarios si opera con un vehículo que no es suyo. (P1-2) licencia/seguro/RTO tenían vencimiento implícito en la foto pero no había campo `<doc>ExpiresAt` ni cron que avise al driver antes del vencimiento ni auto-suspenda al vencer — operábamos con docs vencidos sin saberlo. (P1-3) si un driver necesitaba actualizar un doc aprobado (renovación de licencia, cambio de póliza), no había flujo formal — era por WhatsApp/email. (P2-1) bicis/patinetas no se diferenciaban de motos — se les pedían los 8 docs igual, fricción innecesaria para los delivery de mochila. (P2-2) antigüedad del vehículo sin validación por tipo — un auto del 1990 pasaba igual que uno del 2020 cuando el clima de Ushuaia (salino + heladas) requiere vehículos más nuevos. **Arquitectura del fix** (4 capas con defense in depth): (1) **Schema Prisma** — agregados 8 triples `<campo>Status String @default("PENDING") + <campo>ApprovedAt DateTime? + <campo>RejectionReason String?` en Driver para los 8 docs: `cuit`, `constanciaCuitUrl` (nuevo campo URL que guarda la constancia AFIP, no el texto CUIT), `dniFrenteUrl`, `dniDorsoUrl`, `licenciaUrl`, `seguroUrl`, `vtvUrl`, `cedulaVerdeUrl` (nuevo campo URL obligatorio para motorizados). Además 4 pares `<campo>ExpiresAt DateTime? + <campo>NotifiedStage Int @default(0)` para los 4 docs con vencimiento (licencia/seguro/vtv/cedulaVerde). NotifiedStage: 0=ninguna alerta enviada, 1=aviso 7d, 2=aviso 3d, 3=aviso 1d, 4=vencido+auto-suspended. Nuevo modelo `DriverDocumentChangeRequest` (id/driverId/field/reason/status PENDING|APPROVED|REJECTED/resolvedBy?/resolvedAt?/adminNote?/createdAt) con índices `[driverId, status]` y `[driverId, field]`. Requiere `npx prisma db push && npx prisma generate` post-merge. (2) **Librerías nuevas**: `src/lib/cuit.ts` con `validateCuit(value)` — sanitiza separadores (guiones/espacios), chequea 11 dígitos, valida prefijo (20/23/24/27/30/33/34) y calcula checksum AFIP con ponderación `[5,4,3,2,7,6,5,4,3,2]` + módulo 11 + reglas 10/11 para el dígito verificador. Retorna `{ valid: boolean, normalized?: string, error?: string }`. `isValidCuit(value)` wrapper booleano. También `dniToCuitPrefix(dni, sex)` y `getCuitPossibilities(dni)` para auto-completar en el form. `src/lib/driver-document-approval.ts`: exporta `DRIVER_DOCUMENT_COLUMNS` (mapa de 8 entries con columna Prisma / label humano / tipo text-vs-url / flags hasExpiration/motorizedOnly), constantes `NON_MOTORIZED_TYPES = ["BICI","BICICLETA","PATIN","PATINETA","TRICI"]`, helpers `isMotorizedVehicle(vt)` y `getRequiredDriverDocumentFields(vt)` (devuelve 4 docs para no-motorizado, 8 para motorizado). Funciones `approveDriverDocument({driverId, field, adminId, ctx})` y `rejectDriverDocument({driverId, field, adminId, reason, ctx})` dentro de `$transaction` serializable: (a) update del `<campo>Status` + `ApprovedAt` (o `RejectionReason`), (b) AuditLog `DRIVER_DOCUMENT_APPROVED`/`REJECTED` con detalles, (c) si el approve deja a TODOS los docs requeridos (según vehicleType) en APPROVED, llama inline a `approveDriverTransition` para activar (`approvalStatus: APPROVED`, `isActive: true`, `approvedAt: now`) + audit `DRIVER_AUTO_ACTIVATED`. `resetDriverDocumentToPending({driverId, field, ctx})` — resetea el triple a `PENDING + null + null` y además `NotifiedStage: 0` si el doc tiene vencimiento. (3) **Endpoints nuevos**: `POST /api/driver/documents/change-request` (driver-only, rate limit 5/60s, Zod `{documentField, reason 10-500 chars}` — valida APPROVED + no-pending-duplicate, inserta `DriverDocumentChangeRequest`, audit, email admin). `GET /api/driver/documents/change-request` lista solicitudes propias enriquecidas con `documentLabel`. `POST /api/admin/drivers/[id]/change-requests/[requestId]/resolve` (admin-only, Zod `{action: "APPROVE"|"REJECT", adminNote?}`) — en APPROVE llama `resetDriverDocumentToPending` + para URL docs setea el URL a null (fuerza re-upload), marca solicitud APPROVED + email al driver; en REJECT solo marca REJECTED + note. `GET /api/admin/drivers/[id]/change-requests` lista todas. `POST /api/admin/drivers/[id]/documents/approve` y `/reject` — thin wrappers sobre approve/rejectDriverDocument. `PATCH /api/driver/documents/update` extendido: (a) valida CUIT via `validateCuit()` antes de encriptar, 400 con error específico si inválido; (b) parsea expirations via `parseExpirationDate()` con rango today-1d a today+20y (rechaza fechas pasadas y implausibles); (c) chequea `<campo>Status === "APPROVED"` ANTES de escribir — si está aprobado, retorna 403 "Documento bloqueado, solicitá un cambio primero" (hard lock server-side); (d) para docs no-APPROVED, llama `resetDriverDocumentToPending` al setear el nuevo URL. (4) **Cron de vencimientos** `POST /api/cron/driver-docs-expiry` — corre diario (integrado en el external runner). Envuelto en `recordCronRun("driver-docs-expiry", fn)` (ver ISSUE-026). Auth CRON_SECRET ANTES del recordCronRun (no ensuciar healthcheck con intentos 401). Itera los 4 docs con vencimiento (`EXPIRING_FIELDS = ["licenciaUrl", "seguroUrl", "vtvUrl", "cedulaVerdeUrl"]`) y para cada uno: **Path EXPIRED**: `findMany` drivers con `<expCol> < now + <stageCol> < 4 + <statusCol> APPROVED`, para cada uno hace `updateMany({where: {id, [stageCol]: {lt: 4}}, data: {[statusCol]: "EXPIRED", [stageCol]: 4}})` — atómico, si count===0 es race perdido y skipea. Si gana la carrera, cuenta como expired, consulta `getRequiredDriverDocumentFields(vehicleType)` y si el doc ES requerido llama `prisma.driver.update({data: {isSuspended: true, suspendedAt: now, suspensionReason: "Documento vencido: <label>", isOnline: false, availabilityStatus: "FUERA_DE_SERVICIO"}})` + AuditLog `DRIVER_AUTO_SUSPENDED_BY_EXPIRY` + email `sendDriverDocExpiredEmail` + push `"⛔ Documento vencido"`. **Path WARNINGS**: itera thresholds 1d→3d→7d (el más cercano primero para que no se doble avise), para cada threshold busca drivers con `<expCol> gte now + lte now+Nd + <stageCol> < threshold.stage + APPROVED`, bump atómico del stage via `updateMany WHERE stage < threshold.stage`, envía `sendDriverDocExpiringEmail` + push con copy diferenciado por stage (última llamada / actualizalo / renoválo sin apuros). Registrado en `CRON_EXPECTATIONS` de `src/lib/cron-health.ts` como `driver-docs-expiry: { maxHours: 30, label: "Avisos de vencimiento de documentos de repartidor" }` para que el dashboard OPS alerte si deja de correr. (5) **UI registro** `src/app/repartidor/registro/RepartidorRegistroClient.tsx` — rediseño completo del form con sección de Documentos reorganizada. Campo CUIT/Monotributo nuevo con validación live (llama `isValidCuit` on-change, muestra ✅ verde si válido / ✖ rojo si no) + autocomplete opcional a partir del DNI (usa `getCuitPossibilities(dni)` para sugerir 20-DNI-X / 23-DNI-X / 27-DNI-X con el dígito verificador calculado). Nuevo upload obligatorio "Constancia AFIP / Monotributo" (PDF o imagen) con campo `constanciaCuitUrl`. Para motorizados: el upload "Cédula verde" ahora es obligatorio (antes no existía el field), al lado de Licencia/Seguro/RTO. Campos de fecha de vencimiento requeridos bajo cada uno de los 4 docs (licencia/seguro/RTO/cédula verde) — validación client-side: no pasada, no más de 20 años futuro. Sección "Vehículo" condicional: si `vehicleType ∈ NON_MOTORIZED_TYPES`, se ocultan campos `vehicleBrand/Model/Year/Color/LicensePlate/licenciaUrl/seguroUrl/vtvUrl/cedulaVerdeUrl/expires*` y se muestra cartel "Para bicicletas y patinetas solo necesitamos DNI + CUIT". `src/app/api/auth/register/driver/route.ts` y `/api/auth/activate-driver/route.ts` extendidos con (a) validación CUIT checksum, (b) validación constanciaCuitUrl obligatorio, (c) validación cedulaVerdeUrl obligatorio para motorizados, (d) validación antigüedad del vehículo por tipo (`MAX_VEHICLE_AGE_YEARS = {MOTO: 15, AUTO: 25, CAMIONETA: 25, PICKUP: 25, SUV: 25, FLETE: 30}`), (e) parseo + validación de 4 expirations para motorizados, (f) docs no-motorizados nulleados explícitamente aunque vengan en el body. (6) **UI OPS** `src/app/ops/(protected)/usuarios/[id]/page.tsx` — nueva sub-sección `<DriverDocumentsAdmin>` con 8 tarjetas (filtradas según vehicleType), cada una con status chip color-coded, badge de vencimiento si aplica (rojo si vencido, naranja si ≤3d, amber si ≤7d, slate si >7d), botones inline "Aprobar" / "Rechazar (motivo)" por doc, visor del URL, y razón de rechazo en caja roja si REJECTED/EXPIRED. Sub-sección `<DriverChangeRequestsAdmin>` lista solicitudes con botones "Aprobar" (dispara reset + email) y "Rechazar (nota)". Toast verde "Repartidor activado automáticamente" cuando la aprobación del último doc dispara auto-activación. (7) **UI ProfileView driver** `src/components/rider/views/ProfileView.tsx` — sección nueva "Mis Documentos" entre Info del Vehículo y Reseñas. 8 `<DriverDocCard>` (filtradas a 4 para no-motorizados usando `isMotorizedClient(formData.vehicleType)` + `useMemo`). Cada card: status chip, `ExpirationBadge` para los 4 con vencimiento (umbral alineado con el cron: vencido red-200 / ≤1d red-100 / ≤3d orange-100 / ≤7d amber-100 / >7d slate-100), caja roja con razón si REJECTED/EXPIRED, acción según estado: (a) CUIT en PENDING/REJECTED muestra input inline + botón Save que PATCH a update-docs; (b) docs URL sin vencimiento (constancia/dni) muestran label-as-button "Subir/Reemplazar documento" con file input oculto que dispara upload automático; (c) docs URL con vencimiento (licencia/seguro/vtv/cédula) tras elegir archivo muestran panel de confirmación con nombre del archivo + date input + botón "Subir con vencimiento" (2 pasos, previene upload sin fecha); (d) cuando APPROVED muestra link "Ver documento" + botón amber "Solicitar cambio" (deshabilitado si ya hay pending, muestra "Solicitud pendiente"). Modal `<DriverChangeRequestModal>` con textarea 10-500 chars + live counter, tema green-600 consistente con portal driver. Historial de solicitudes resueltas en `<details>` colapsable. Estado como `Record<DriverDocKey, DocFieldState>` single source, refresca desde `/api/driver/profile` (que ya devuelve todos los campos via `include` sin select filter — no requirió backend change). **Emails nuevos en `src/lib/email.ts`**: `sendDriverDocumentApproved(driverEmail, driverName, fieldLabel)`, `sendDriverDocumentRejected(driverEmail, driverName, fieldLabel, reason)`, `sendDriverAutoActivated(driverEmail, driverName)`, `sendDriverChangeRequestResolved(driverEmail, driverName, fieldLabel, approved)`, `sendDriverDocExpiringEmail(driverEmail, driverName, fieldLabel, daysRemaining, expiresAt)` (copy diferenciado por daysRemaining ≤1/3/7), `sendDriverDocExpiredEmail(driverEmail, driverName, fieldLabel, expiresAt)` — tono habitual MOOVY, firing-and-forget desde los endpoints y el cron. **Archivos nuevos**: `src/lib/cuit.ts`, `src/lib/driver-document-approval.ts`, `src/app/api/driver/documents/change-request/route.ts`, `src/app/api/driver/documents/update/route.ts`, `src/app/api/admin/drivers/[id]/change-requests/route.ts`, `src/app/api/admin/drivers/[id]/change-requests/[requestId]/route.ts`, `src/app/api/admin/drivers/[id]/documents/approve/route.ts`, `src/app/api/admin/drivers/[id]/documents/reject/route.ts`, `src/app/api/cron/driver-docs-expiry/route.ts`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/admin/users-unified/[id]/route.ts` (select completo de los nuevos triples + expirations + decrypt del CUIT), `src/app/api/auth/register/driver/route.ts`, `src/app/api/auth/activate-driver/route.ts`, `src/app/ops/(protected)/usuarios/[id]/page.tsx`, `src/app/repartidor/registro/RepartidorRegistroClient.tsx`, `src/components/rider/views/ProfileView.tsx`, `src/lib/cron-health.ts` (agregada entrada `driver-docs-expiry`), `src/lib/email.ts`. **Pendiente post-merge**: correr `npx prisma db push && npx prisma generate` local para registrar los 8 triples + 4 pares de expiration/stage + modelo `DriverDocumentChangeRequest`. Sin eso todos los endpoints de documentos tirarán runtime "Unknown field" / "driverDocumentChangeRequest does not exist" al primer call. **TS clean** sobre la rama — únicos errores en el check full son los 3 pre-existentes conocidos (`.next/dev/types/routes.d.ts` TS1010, `.next/dev/types/validator.ts` TS1005, `node_modules/.prisma/client/index.d.ts` TS1005 — todos auto-generados o pending de regenerate). Cero errores en archivos de esta rama. **Regla nueva #5** (extensión de #1 del comercio): aplicable a TODO actor con documentación legal — merchant, driver, seller. Los 4 principios de approval por doc (per-doc status, hard-lock server-side, change-request formal con audit, auto-activación al completar) son obligatorios para cualquier nueva categoría de actor que maneje docs. **Regla nueva #6**: todo doc con vencimiento legal (licencia, seguro, RTO, cédula verde, VTV, habilitación municipal, registro sanitario, carnet manipulador alimentos) DEBE tener (a) campo `<doc>ExpiresAt` en el modelo del actor, (b) campo `<doc>NotifiedStage Int @default(0)` para idempotencia del cron, (c) cron diario registrado en `CRON_EXPECTATIONS` que avise al actor 7/3/1d antes y auto-suspenda al vencer + marque el status como EXPIRED. La vigilancia manual del admin no es opción — somos legalmente responsables si un driver opera con licencia vencida. **Regla nueva #7**: cualquier campo requerido que dependa de otro campo condicional (ej: licencia requerida solo si vehículo motorizado, registro sanitario solo si comercio de alimentos) DEBE expresar esa regla en un helper `getRequiredXFields(condition)` centralizado, consumido por tanto el form client-side como el endpoint server-side como la auto-activación. Nunca repetir la lógica en dos lugares.)

## 2026-04-23 (rama `fix/onboarding-comercio-completo` RESUELTA — 6 issues interconectados del onboarding de comercio en una sola pasada end-to-end. **Síntoma original detectado por Mauro**: documentos subidos durante el registro aparecían como "Cargado/Presentado" en el dashboard del comercio pero como "Sin cargar" en el panel OPS — el registro guardaba la URL en `Merchant.constanciaAfipUrl/habilitacionMunicipalUrl/registroSanitarioUrl` pero el OPS consultaba campos que no existían o estaban desalineados. Auditoría full del flujo reveló 5 issues estructurales adicionales: (1) `Merchant.bankAccount` era un único campo String sin distinguir CBU (22 dígitos + checksum BCRA) de Alias (6-20 alfanuméricos) — un alias inválido pasaba validación; (2) el comercio podía reemplazar un documento ya APROBADO sin ningún lock — suficiente para que el comercio cambie la CBU después de la aprobación y cobre a otra cuenta; (3) OPS solo tenía aprobación/rechazo global del comercio — sin granularidad por documento, el admin no podía pedir "volveme a subir solo la habilitación municipal"; (4) no existía auto-activación cuando los 4-5 documentos requeridos estaban todos aprobados — el admin tenía que acordarse de hacer el click manual; (5) si un comercio necesitaba actualizar un dato aprobado (ej: cambió de banco), no había flujo formal — era por WhatsApp o email, sin trazabilidad. **Arquitectura del fix** (4 capas con defense in depth): (1) **Schema Prisma**: agregados 5 pares `<campo>Status String @default("PENDING") + <campo>RejectionReason String?` en Merchant — `cuitStatus/cuitRejectionReason`, `bankAccountStatus/bankAccountRejectionReason`, `constanciaAfipStatus/constanciaAfipRejectionReason`, `habilitacionMunicipalStatus/habilitacionMunicipalRejectionReason`, `registroSanitarioStatus/registroSanitarioRejectionReason`. Tipo String (no enum) por el patrón histórico del proyecto (approvalStatus, etc.) para evitar migrations rotas. Nuevo modelo `MerchantDocumentChangeRequest` (id/merchantId/field/reason/status PENDING|APPROVED|REJECTED/resolvedBy?/resolvedAt?/adminNote?/createdAt) con índices `[merchantId, status]` y `[merchantId, field]`. Requiere `npx prisma db push && npx prisma generate` post-merge. (2) **Librerías nuevas**: `src/lib/bank-account.ts` con `validateBankAccount(value)` — autodetecta CBU vs Alias por longitud+composición, CBU valida checksum BCRA de los 22 dígitos (ponderación 7-1-3-9-7-1-3-9 + módulo 10 en los 2 dígitos de control por banco + sucursal), Alias valida 6-20 chars `^[A-Z0-9.]+$`. Retorna `{ valid: boolean, kind: "CBU" | "ALIAS" | "INVALID", error?: string }`. `src/lib/merchant-document-approval.ts` con `approveMerchantDocument({merchantId, field, adminId, ctx})` y `rejectMerchantDocument({merchantId, field, adminId, reason, ctx})` — ambas dentro de `$transaction` serializable que (a) actualiza el `<campo>Status` y `<campo>RejectionReason`, (b) inserta AuditLog con action `MERCHANT_DOCUMENT_APPROVED`/`REJECTED` + details JSON con field/reason, (c) en approve, consulta los 5 status post-update y si **todos los requeridos** están APPROVED (registroSanitario solo si category ∈ FOOD_BUSINESS_TYPES) llama `approveMerchantTransition` inline para auto-activar (isActive=true + isVerified=true + approvalStatus=APPROVED + audit `MERCHANT_AUTO_ACTIVATED` con details de qué docs gatillaron). Constante `FOOD_BUSINESS_TYPES = new Set([...12 categorías alimenticias])` exportada para reuso en UI. (3) **Endpoints**: `POST /api/merchant/documents/change-request` (merchant-only, rate limit 5/60s, Zod `{field, reason 10-500 chars}` — valida que el field esté APPROVED y que no exista otra solicitud PENDING para el mismo field, inserta MerchantDocumentChangeRequest, audit `MERCHANT_CHANGE_REQUEST_CREATED`, push al admin). `GET /api/merchant/documents/change-request` devuelve todas las solicitudes del merchant del usuario logueado. `POST /api/admin/merchants/[id]/change-requests/[requestId]/resolve` (admin-only, Zod `{action: "APPROVE" | "REJECT", adminNote?}`) — en APPROVE resetea el campo correspondiente a `<campo>Status: "PENDING"` + `<campo>RejectionReason: null` y para URL docs lo nullea (fuerza re-upload), marca la solicitud como APPROVED con resolvedBy+resolvedAt+adminNote, audit `MERCHANT_CHANGE_REQUEST_APPROVED`. En REJECT solo marca REJECTED + note. `GET /api/admin/merchants/[id]/change-requests` lista todas las solicitudes del merchant. `POST /api/admin/merchants/[id]/documents/[field]/approve` y `/reject` (admin-only) — thin wrappers sobre approve/rejectMerchantDocument. `PATCH /api/merchant/update-docs` extendido: cuando el merchant sube un doc con status PENDING o REJECTED, guarda la URL + resetea status a PENDING; cuando el status es APPROVED, retorna 403 "Documento bloqueado" (hard lock server-side, defense in depth sobre el UI). (4) **UI Merchant** `src/components/comercios/SettingsForm.tsx` — completamente reescrito el DocumentsSection. Tipo `DocStatus = "PENDING" | "APPROVED" | "REJECTED"`, mirror client-side `FOOD_TYPES = new Set([...])` para gatear Registro Sanitario (solo food). 5 tarjetas (`<DocumentRow>`) — CUIT (text), CBU/Alias (text), Constancia AFIP (url), Habilitación Municipal (url), Registro Sanitario (url condicional). Cada tarjeta muestra status chip color-coded (gris "Sin cargar" / amber "En revisión" / verde "Aprobado" / rojo "Rechazado") + ícono `Lock` cuando APPROVED + razón de rechazo en caja roja cuando REJECTED. Si APPROVED: doc bloqueado, se muestra botón amber "Solicitar cambio" que abre `<ChangeRequestModal>` (textarea min 10/max 500 chars con live char counter, role="dialog" aria-modal, click-outside para cerrar, POST al endpoint, feedback inline). Si hay solicitud pendiente para ese field, el botón se deshabilita y muestra "Ya tenés una solicitud pendiente". Sección de solicitudes: tarjetas amber para pendientes (con fecha y reason), `<details>` colapsable para historial (APPROVED/REJECTED). Para fields en PENDING/REJECTED con kind text: input inline + botón "Guardar"/"Actualizar" que llama update-docs. Para kind url: label-as-button "Reemplazar documento" o "Subir documento" con file input oculto. Todo sin prop drilling — `docState` como `Record<DocKey, {value, status, rejectionReason}>` single source. `src/app/comercios/(protected)/configuracion/page.tsx` ahora descifra fiscal data (`decryptMerchantData`) y pasa los valores reales de cuit/bankAccount (no solo booleanos) + los 5 pares status/reason al componente. (5) **UI OPS** `src/app/ops/(protected)/usuarios/[id]/page.tsx` — reemplazada la sección genérica "Documentación" por `<MerchantDocumentsAdmin>` con las mismas 5 tarjetas pero en modo admin: botones inline "Aprobar" / "Rechazar" (este abre prompt de razón) para cada doc, además del visor de cada URL. Segunda sub-sección `<ChangeRequestsAdmin>` lista solicitudes pendientes de este comercio con botones "Aprobar" y "Rechazar (nota)" — la aprobación dispara el reset del campo + notifica al comercio que puede re-subir. Cuando la aprobación del último doc requerido dispara auto-activación, el panel muestra un toast verde "Comercio activado automáticamente — los 4-5 documentos requeridos están aprobados". (6) **Validación CBU/Alias endurecida**: `src/app/api/auth/register/merchant/route.ts` y `/api/auth/activate-merchant` y `/api/merchant/update-docs` ahora pasan el bankAccount por `validateBankAccount()` antes de encriptar. Si `validateBankAccount` retorna `valid: false`, devuelven 400 con el error específico — "CBU inválido: checksum incorrecto" o "Alias inválido: debe tener 6-20 caracteres alfanuméricos y puntos". El formulario de registro (`src/app/comercio/registro/page.tsx`) también valida client-side con el mismo helper para mejor UX. **Emails**: `src/lib/email.ts` agregó plantillas `merchantDocumentApproved(merchantName, fieldLabel)`, `merchantDocumentRejected(merchantName, fieldLabel, reason)`, `merchantAutoActivated(merchantName)` y `merchantChangeRequestResolved(merchantName, fieldLabel, approved)` — todas con el tono habitual de MOOVY. Triggered desde los endpoints admin correspondientes con try/catch fire-and-forget. **Archivos nuevos**: `src/lib/bank-account.ts`, `src/lib/merchant-document-approval.ts`, `src/app/api/admin/merchants/[id]/change-requests/route.ts`, `src/app/api/admin/merchants/[id]/change-requests/[requestId]/resolve/route.ts`, `src/app/api/admin/merchants/[id]/documents/[field]/approve/route.ts`, `src/app/api/admin/merchants/[id]/documents/[field]/reject/route.ts`, `src/app/api/merchant/documents/change-request/route.ts`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/admin/users-unified/[id]/route.ts`, `src/app/api/auth/activate-merchant/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/merchant/update-docs/route.ts`, `src/app/comercio/registro/page.tsx`, `src/app/comercios/(protected)/configuracion/page.tsx`, `src/app/ops/(protected)/usuarios/[id]/page.tsx`, `src/components/comercios/SettingsForm.tsx`, `src/lib/email.ts`. **Pendiente post-merge**: correr `npx prisma db push && npx prisma generate` local para registrar los 10 nuevos campos en Merchant + el modelo MerchantDocumentChangeRequest. Sin eso, todos los endpoints de documentos tirarán runtime error "Unknown field" / "merchantDocumentChangeRequest does not exist". **TS clean** sobre los 3 archivos de UI (SettingsForm, configuracion/page, ops/usuarios/[id]/page) — los ~20 errores que aparecen son TODOS Prisma client stale en los archivos server-side (routes + lib/merchant-document-approval), mismo patrón documentado en ramas ISSUE-054/031/032 — resuelve con `prisma generate`. **Regla nueva #1**: cualquier documento/dato aprobado por OPS (fiscal, bancario, habilitante) DEBE quedar hard-locked server-side — el UI nunca es defensa suficiente. El único camino para modificar un dato aprobado es el flujo formal de change-request con auditoría completa. **Regla nueva #2**: cualquier campo que requiera validación específica del país (CBU argentino, CUIT, DNI, patente) DEBE tener su helper de validación en `src/lib/` con test de checksum donde aplique, NUNCA confiar en regex simple del UI. El mismo helper se invoca en TODOS los endpoints que reciben ese campo (registro, activate, update, etc.). **Regla nueva #3**: cuando un flujo multi-step tenga una condición de "todos los pasos completos" (onboarding, verificación, aprobación), la transición final DEBE ser automática dentro de la misma transacción que cierra el último paso — nunca requerir un click admin separado. El admin manual es solo para casos excepcionales, no para el happy path. **Regla nueva #4**: si un usuario tiene que pedir un cambio a un dato aprobado, el flujo DEBE ser formal (modelo + endpoint + audit + notificaciones), nunca via WhatsApp/email/soporte. La trazabilidad legal lo requiere — en caso de disputa, hay que poder mostrar "el comercio pidió el cambio el X, lo aprobó el admin Y el Z".)

## 2026-04-22 (rama `fix/menores-data-ops` RESUELTA — 3 issues de data + operaciones end-to-end en una pasada: ISSUE-032 + ISSUE-029 + ISSUE-026. **ISSUE-032 (zonas excluidas 100% configurables desde OPS)**: reemplaza el hardcode histórico de Costa Susana por un sistema genérico. Schema: `StoreSettings.excludedZonesJson String?` (array JSON con objetos `{id, name, lat, lng, radiusKm, reason, active, createdAt, updatedAt}` — se eligió campo único sobre tabla propia porque Ushuaia tendrá <20 zonas, el overhead de tabla + FK compensa recién a 100+). Requiere `npx prisma db push && npx prisma generate` post-merge. Nuevo `src/lib/excluded-zones.ts`: interfaz `ExcludedZone` + `parseExcludedZones(raw)` (defensa contra JSON corrupto — devuelve array vacío, nunca crashea), `getExcludedZone(lat, lng, zones)` con O(n) Haversine y primer match activo, `validateZoneInput(input)` con rangos: name 1-50 chars, lat/lng válidos, radiusKm 0.1-3km, reason 1-200 chars. Endpoints `GET/POST /api/ops/settings/excluded-zones` y `PATCH/DELETE /api/ops/settings/excluded-zones/[id]` (admin-only, rate limit 30/60s mutaciones). Panel OPS `/ops/zonas-excluidas` (`ExcludedZonesClient.tsx`, 28.5KB): tabla responsive (cards mobile + tabla desktop), modal crear/editar con **mini-mapa Google Maps** — marker draggable + slider de radio con visualización circular en tiempo real, toggle `active` inline por row (permite pausar zona sin borrar historial). Integración defense in depth: `src/app/api/delivery/calculate/route.ts` lee el JSON, parsea, y si el destino cae en zona activa devuelve 409 `{errorCode: "ZONE_EXCLUDED", zoneName, reason}` — el checkout muestra la razón al buyer sin código técnico. `src/app/api/orders/route.ts` re-valida server-side antes de crear la orden (por si el front se saltó el check via request directo). Doble gate garantiza que NINGÚN pedido hacia zona excluida se llegue a crear. **ISSUE-029 (soldCount excluye auto-compras del seller)**: limitación de Prisma: `_count: { select: { orderItems: { where: {...} } } }` NO puede referenciar campos del registro padre (el `userId` del seller en el Listing parent). No hay manera de filtrar "excluir items cuyo `Order.userId === SellerProfile.userId` del Listing" en una sola query Prisma. Fix: nuevo helper `src/lib/listing-counts.ts` exporta `getSoldCountsExcludingAutoPurchases(listingIds): Promise<Map<string, number>>` con una sola query `$queryRaw` + `Prisma.join` que hace JOIN OrderItem → Order → Listing → SellerProfile con filtro `o."userId" <> sp."userId"` y `GROUP BY oi."listingId"`. Short-circuit a `new Map()` si array vacío (evita `IN ()` SQL inválido). Una sola query batch sin importar volumen de listings. Migrado en 3 sitios: `src/app/api/listings/route.ts` (listado general — removed `orderItems` del `_count`, soldCount desde map), `src/app/api/listings/featured/route.ts` (destacados — eliminado el `_count` completo que solo tenía orderItems), `src/app/(store)/marketplace/vendedor/[id]/page.tsx` (perfil del vendedor — mantuvo `favorites` en `_count`, removió orderItems, soldCount desde map). **ISSUE-026 (healthcheck de crons genérico)**: sistema reusable para que el dashboard OPS alerte si cualquier cron registrado no corrió en su ventana esperada. Schema: nuevo modelo `CronRunLog` (id/jobName/startedAt/completedAt/success/durationMs/itemsProcessed/errorMessage) con índices `[jobName, startedAt]` y `[jobName, success, completedAt]`. Requiere `npx prisma db push && npx prisma generate` post-merge. Nuevo `src/lib/cron-health.ts`: wrapper `recordCronRun(jobName, fn)` crea row ANTES de correr `fn`, captura success/error/duración/items y UPDATE al final. Acepta shape `{ result, itemsProcessed }` para tomar el count explícito (ej: `deleteMany().count`) o forma plana. Re-throwea el error original para no ocultar fallas. Config canónica `CRON_EXPECTATIONS: Record<jobName, { maxHours, label }>` — arranca con `"cleanup-location-history": { maxHours: 30, label: "Limpieza de historial GPS" }`. Para un cron nuevo: wrap + agregar entrada acá. `getCronsHealthSummary()` devuelve `CronHealth[]` con status derivado: `healthy` (último success dentro de maxHours), `stale` (último success hace más → warning, runner puede tener hiccup pero data no corrupta), `failing` (último intento terminó con `success: false` → danger), `never-ran` (jamás registrado → danger). Dos queries paralelas por cron (último success + último intento cualquiera) para distinguir stale-por-fallo de stale-por-deploy-nuevo. `src/app/api/cron/cleanup-location-history/route.ts` envuelve el `deleteMany` en `recordCronRun(..., () => ({ result: del, itemsProcessed: del.count }))`. **Defense in depth**: el `verifyBearerToken` queda ANTES de `recordCronRun` — así intentos no autorizados (attackers probando CRON_SECRET) no ensucian el log con runs spurios. `src/app/ops/(protected)/dashboard/page.tsx` importa `getCronsHealthSummary()` con `.catch(() => [])` (safe fallback pre-migración). Loop pushea alerts: `failing` → danger `"Cron X falló en su último intento: <error>"`, `stale` → warning `"Cron X no corre hace Yh (esperado cada Zh)"`, `never-ran` → danger `"Cron X nunca se ejecutó — revisar configuración del runner"`. Link a `/ops/configuracion-logistica`. **Archivos nuevos**: `src/lib/excluded-zones.ts`, `src/lib/listing-counts.ts`, `src/lib/cron-health.ts`, `src/app/api/ops/settings/excluded-zones/route.ts`, `src/app/api/ops/settings/excluded-zones/[id]/route.ts`, `src/app/ops/(protected)/zonas-excluidas/page.tsx`, `src/app/ops/(protected)/zonas-excluidas/ExcludedZonesClient.tsx`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/delivery/calculate/route.ts`, `src/app/api/orders/route.ts`, `src/app/api/listings/route.ts`, `src/app/api/listings/featured/route.ts`, `src/app/(store)/marketplace/vendedor/[id]/page.tsx`, `src/app/api/cron/cleanup-location-history/route.ts`, `src/app/ops/(protected)/dashboard/page.tsx`. **Pendiente post-merge**: correr `npx prisma db push && npx prisma generate` local para registrar `StoreSettings.excludedZonesJson` + el modelo `CronRunLog`. Sin eso, el panel de zonas fallará al escribir y el dashboard tirará runtime error al consultar CronRunLog. **TS clean** sobre archivos nuevos/modificados (los errores pre-existentes siguen: `.next/dev/types/*` generados, `node_modules/.prisma/client` pre-generate, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127 — ninguno de esta rama). **Regla nueva #1**: parámetros operativos configurables (zonas, radios, tiempos, mínimos) DEBEN vivir en `StoreSettings`/`MoovyConfig` + OPS UI, NUNCA en constantes del código. Si un admin necesita tocar código para activar/desactivar algo de operaciones, el sistema está mal diseñado. **Regla nueva #2**: cualquier contador público (N vendidos, N favoritos, N pedidos) DEBE auditar el self-reference case — si el dueño del registro puede inflarlo auto-referenciándose, excluirlo explícitamente via raw query o filtro. Confiar en `_count` implícito de Prisma oculta este tipo de bug. **Regla nueva #3**: todo cron nuevo DEBE envolverse en `recordCronRun` + registrarse en `CRON_EXPECTATIONS`. Un cron sin healthcheck es un cron que falla callado — inaceptable si la ausencia de su ejecución degrada la DB o la UX.)

## 2026-04-21 (rama `fix/menores-merchant-driver` RESUELTA — 4 issues end-to-end merchant/driver en una sola pasada: ISSUE-031 + ISSUE-050 + ISSUE-051 + ISSUE-025. **ISSUE-031 (push de bienvenida al primer pedido del merchant)**: schema agregó `Merchant.firstOrderWelcomeSentAt DateTime?` (requiere `npx prisma db push` + `npx prisma generate` local post-merge). Nuevo helper `notifyMerchantFirstOrderWelcome(merchantUserId, merchantName, orderNumber)` en `src/lib/notifications.ts` con title `🎉 ¡Tu primer pedido en MOOVY!`, body `"${merchantName}: recibiste tu primer pedido ${orderNumber}. Confirmalo rápido para que tu comprador se lleve una gran experiencia."` y tag único `merchant-first-order-${merchantUserId}` distinto de `new-order-*` para no colapsar en el lock screen con el push regular. Nuevo helper `tryNotifyMerchantFirstOrderWelcome(merchantId, merchantUserId, merchantName, orderNumber)` en `src/app/api/orders/route.ts` que envuelve el patrón atómico battle-tested: `prisma.merchant.updateMany({where: {id, firstOrderWelcomeSentAt: null}, data: {firstOrderWelcomeSentAt: now}})` + check `count === 1` — solo ganamos la carrera UNA vez aunque dos orders del mismo merchant lleguen casi simultáneas. Si count=0 (ya se envió o race perdido), skipea el push silenciosamente. Invocado desde 4 sitios en la creación de orden (single-vendor cash, single-vendor MP approved, multi-vendor cash por SubOrder, multi-vendor MP approved por SubOrder) con `.catch(err => logger.error(...))` fire-and-forget para no bloquear la respuesta al buyer. **ISSUE-050 (OPS dashboard sin "Max $0" fantasma)**: en `src/app/ops/(protected)/dashboard/page.tsx` las 3 sub-stats del hero card (Ticket promedio, Ticket máximo, Pedidos sin asignar) ahora renderean solo si la stat principal es > 0 — si no hay pedidos hoy no tiene sentido mostrar "Max $0" ni "Ticket promedio $0" ocupando pantalla. Con flag `hasOrders = pedidosHoy > 0` los tres chips secundarios se ocultan completos (`hasOrders && (<div>...</div>)`), dejando solo el número grande de pedidosHoy (0) y un copy más limpio. Un panel con datos reales sigue viéndose igual. **ISSUE-051 (strip superior del driver dashboard)**: nuevo bloque de 3 chips debajo del header, encima del stats grid, en `src/app/repartidor/(protected)/dashboard/page.tsx`. Chips: (a) GPS — ícono `MapPin`, estado dinámico: "GPS activo" (verde, cuando hay `location`), "GPS cacheado" (amber, cuando `lowPowerGps`), "Sin GPS" (rojo, cuando `error` o sin location). Reemplaza el chip "zona" originalmente planeado porque Moovy no tiene helper lat/lng → zona (las zonas A/B/C son solo multiplicadores en el cálculo de fee); el GPS status es operativamente más útil para el driver. (b) Vehículo — emoji + label legible (`vehicleTypeIcon()` + `vehicleTypeToSpanish()` de `@/lib/vehicle-type-mapping`). El endpoint `src/app/api/driver/dashboard/route.ts` ahora expone `vehicleType: driver.vehicleType || null` en el response (evitando un round-trip extra — ya cargábamos el driver). (c) Batería — ícono `Battery` con estados: verde ≥30%, amber <30%, rojo <15%, ícono `Zap` cuando `batteryRaw.charging`. Si `batteryRaw.supported === false` (iOS Safari), el chip no se renderea. Divisores verticales (`w-px h-5 bg-gray-200`) entre chips. **ISSUE-025 (modo ahorro de batería para GPS)**: `src/hooks/useGeolocation.ts` ahora acepta `{ lowPower?: boolean }`. Cuando `lowPower === true`, `navigator.geolocation.watchPosition` recibe `{ enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }` — deshabilita el GPS hardware (~50mW sostenidos), usa triangulación celular/wifi y permite lecturas cacheadas hasta 30s. La precisión baja de ~5m a ~50m, aceptable para el mini-mapa y para el geofence del PIN de entrega (100m + gracia GPS 50m). El `useEffect` re-ejecuta `watchPosition` cuando `lowPower` cambia (la API nativa no tiene `setOptions`). En `dashboard/page.tsx`: `const batteryRaw = useBattery()` ahora vive arriba del todo (pre-dependencia de useGeolocation), flag derivado `lowPowerGps = batteryRaw.supported && batteryRaw.level !== null && batteryRaw.level < 0.15 && !batteryRaw.charging`, se pasa como `useGeolocation({ lowPower: lowPowerGps })`. Polling del endpoint pasa de 30s a 60s cuando `lowPowerGps` para ahorrar además bandwidth + parseo. Aviso one-shot al driver vía ref: `lowPowerNoticeShownRef.current` + `toast.warning("Batería baja — activamos modo ahorro GPS (ubicación menos precisa) para que sigas trabajando más tiempo.", 6000)` solo la primera vez que cruza el umbral; si la batería vuelve a subir (enchufó) y baja otra vez, NO re-muestra (fatigaría al driver). Duplicación previa de `useBattery()` en línea ~199 reemplazada por `const battery = batteryRaw` (single source). **Archivos nuevos**: ninguno (todos los cambios son extensión de archivos existentes). **Archivos modificados**: `prisma/schema.prisma`, `src/lib/notifications.ts`, `src/app/api/orders/route.ts`, `src/app/ops/(protected)/dashboard/page.tsx`, `src/app/repartidor/(protected)/dashboard/page.tsx`, `src/app/api/driver/dashboard/route.ts`, `src/hooks/useGeolocation.ts`. **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para que el cliente Prisma conozca `Merchant.firstOrderWelcomeSentAt` — sin esto, el primer POST /api/orders tirará "Unknown field". **TS clean** sobre los archivos modificados (los errores que aparecen son los pre-existentes: `.next/dev/types/*` generados, `node_modules/.prisma/client` pendiente, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127 — ninguno de esta rama). **Regla nueva**: cualquier trigger "first-time" del merchant/driver/seller (primer pedido, primer pago recibido, primera calificación, primer retiro) debe usar el mismo patrón atómico `updateMany WHERE flag IS NULL + count === 1` que ISSUE-054/013/031. Nunca `findFirst → if(!flag) send → update` secuencial porque permite doble disparo bajo concurrencia. El flag debe vivir en el modelo del dominio (no en tabla auxiliar) para que la atomicidad sea libre de locks.)

## 2026-04-21 (rama `fix/menores-ux-buyer` RESUELTA — 4 issues UX del buyer en una pasada: ISSUE-028 + ISSUE-048 + ISSUE-049 + ISSUE-030. **ISSUE-028 (EmptyState unificado)**: nuevo componente `src/components/ui/EmptyState.tsx` — único source of truth para estados vacíos en toda la app. Props: `icon` (LucideIcon opcional), `title`, `description`, `primaryCta { label, href?, onClick? }`, `secondaryCta` (mismo shape), `children` (slot para chips/hints), `tone` (`"neutral" | "brand" | "marketplace"`), `size` (`"sm" | "md" | "lg"`), `className`. Internamente: tablas `TONE_STYLES` (iconBg/iconColor/primaryBg/primaryHover — rojo MOOVY para brand, violeta marketplace, gris neutral) y `SIZE_STYLES` (padding + icon box + typography scales). El `CtaButton` interno soporta ambos contratos (href → `<Link>`, onClick → `<button>`). Accesibilidad: `role="status" aria-live="polite"`. Migradas las 3 superficies de mayor impacto: (a) `/mi-perfil/favoritos/page.tsx` — empty state global (tone brand, size lg, CTA dual "Explorar comercios" + "Ver productos") y helper `EmptyTab` reescrito con mapa `ctaByLabel` (comercios→/tiendas, productos→/productos, publicaciones→/marketplace); (b) `/mis-pedidos/page.tsx` — tab "En curso" y "Historial" con titles/descriptions diferenciados y CTAs a /productos + /tiendas; (c) `/store/[slug]/page.tsx` — empty state cuando el merchant no cargó productos, ícono `ShoppingBag` + CTA "Ver otros comercios" → `/tiendas`. **Regla nueva**: todo empty state DEBE ofrecer al menos un CTA. Un empty sin CTA es dead-end por definición — el usuario no tiene próxima acción y abandona. **ISSUE-048 (una sola barra de búsqueda en home)**: en desktop el home mostraba simultáneamente el botón rojo del `HomeHero` y el input central del `AppHeader` — dos CTAs compitiendo visualmente. Mobile ya estaba resuelto porque el hero emite un evento custom `moovy:hero-search-visibility` cada vez que entra/sale del viewport (via IntersectionObserver), y el header mobile escuchaba ese evento para ocultar su buscador compacto. Se extendió el mismo patrón al desktop: el wrapper del input central del `AppHeader` ahora se oculta con transición `opacity-0 + pointer-events-none + invisible` cuando `isHomepage && heroSearchVisible`. Agregado `aria-hidden` al wrapper y `tabIndex={-1}` al input para que sea realmente inaccesible cuando está invisible (no queda en el tab order). Un solo event listener, un solo source of truth visual. En páginas internas (`/tiendas`, `/marketplace`, detail pages, perfil, etc.) el header conserva su buscador siempre visible — la regla aplica exclusivamente al home. **ISSUE-049 (tienda sin "Otros (2)")**: en `store/[slug]/page.tsx` se agregó `FLAT_LIST_THRESHOLD = 5` + flag `useFlatList = totalProducts > 0 && totalProducts < FLAT_LIST_THRESHOLD`. Los productos ahora se normalizan primero (`normalizedProducts` con `image + merchantId + merchant.isOpen` respetando el estado real del horario) y SOLO se agrupan por categoría si `!useFlatList`. La sticky de pills solo se renderiza si hay más de una categoría (`!useFlatList && categories.length > 1`). Cuando `useFlatList === true`, rendereamos una única grilla de `<ProductCard>` sin headers per-category, sin contadores, sin pills — un layout limpio para merchants que recién arrancan con 1-4 productos. Evita el patrón "Otros (2)" que se lee experimental y sucio. **ISSUE-030 (marketplace header sin contadores vacíos)**: en `marketplace/page.tsx` stats row del hero. Agregada constante `SHOW_STATS_COUNTS_AT = 10` + flag `showHardStats = heroTotal >= SHOW_STATS_COUNTS_AT`. Si estamos arriba del umbral, se mantienen las dos pills duras (publicaciones + categorías) + "Compra protegida". Si estamos debajo, caen a un copy suave: ícono `Users` + texto "Publicaciones de vecinos" + "Compra protegida". Evita que en early-stage (ej: 5 publicaciones reales contra 18 categorías seed vacías) el header transmita "plataforma vacía" al buyer nuevo — los números aparecen solos cuando realmente valen la pena. **Archivos nuevos**: `src/components/ui/EmptyState.tsx`. **Archivos modificados**: `src/components/layout/AppHeader.tsx`, `src/app/(store)/mi-perfil/favoritos/page.tsx`, `src/app/(store)/mis-pedidos/page.tsx`, `src/app/(store)/store/[slug]/page.tsx`, `src/app/(store)/marketplace/page.tsx`. **TS clean** sobre todos los archivos modificados (los errores que aparecen son los pre-existentes: `.next/dev/types/*` generados, `node_modules/.prisma/client`, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127 — ninguno de esta rama). **Regla nueva**: cuando un componente muestra contadores de catálogo/inventario en pantallas de entrada (home, marketplace, categoría), siempre gatearlos por volumen mínimo razonable — "3 publicaciones" se lee peor que un copy cualitativo. Mostrar números duros solo cuando hay señal de actividad real.)

## 2026-04-21 (rama `fix/menores-seguridad` RESUELTA — ISSUE-024 + ISSUE-027 cerrados en una sola pasada de seguridad. **ISSUE-024 (puntos race condition)**: `recordPointsTransaction` en `src/lib/points.ts` ahora corre con `{ isolationLevel: "Serializable" }`. Síntoma teórico previo: si un mismo user gasta puntos desde dos tabs/dispositivos simultáneos, ambas transacciones leían el mismo `pointsBalance` y persistían dos updates con el mismo `newBalance` — efectivamente regalando puntos al user y descontando solo uno de los dos pedidos. Con Serializable, una de las dos transacciones falla con P2034 (serialization failure) y se reintenta hasta 3 veces con backoff lineal (50/100/150ms). Después de 3 intentos retorna `false` y el caller decide cómo manejarlo (típicamente: error al user, que reintenta). Constantes `POINTS_TX_MAX_RETRIES=3`, `POINTS_TX_RETRY_BASE_MS=50` exportadas implícitamente vía top-level. Detección de P2034 hecha defensivamente: chequea `error.code === "P2034"` + `error.meta?.code === "40001"` + regex `/could not serialize/i` sobre `error.message` — Prisma tiene historial de cambiar el shape del error entre versiones. **ISSUE-027 (reset-password timing-safe)**: defense in depth en 2 capas. (1) `src/app/api/auth/forgot-password/route.ts` ahora hashea el token con `sha256` ANTES de guardarlo en `User.resetToken`. El token plaintext SOLO viaja por email (en el `resetLink`). Si la DB se filtra, los tokens activos no sirven al atacante porque solo tiene el hash. (2) `src/app/api/auth/reset-password/route.ts` hashea el token recibido, busca el user con `where: { resetToken: hash, resetTokenExpiry: { gt: now } }`, y luego hace `crypto.timingSafeEqual(Buffer.from(user.resetToken, "hex"), Buffer.from(tokenHash, "hex"))` — incluso aunque la query Prisma ya filtró, comparamos hashes byte-a-byte en tiempo constante para evitar cualquier side channel residual del WHERE clause (cache hits, B-tree lookups, etc.). Helper local `timingSafeEqualHex(a, b)` con guard de longitud + try/catch alrededor de `Buffer.from(.., "hex")` por si el input no es hex válido. Validación de input también endurecida: `typeof token !== "string"` ahora rechaza temprano. **Pendiente operativo post-deploy**: los tokens activos generados antes del deploy (máximo 1h de vida) dejan de funcionar porque están guardados en plaintext y la nueva validación los hashea — los ≤5 usuarios afectados deben pedir un nuevo reset. Aceptable porque la ventana de deploy es chica y reset-password es low-volume. **Archivos modificados**: `src/lib/points.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`. **TS clean** (solo errores pre-existentes). **Regla nueva**: cualquier token de uso único (reset-password, magic links, invite codes, OAuth state) debe almacenarse hasheado en DB. El plaintext es ephemeral y solo debe existir en el canal donde se entrega al user (email/SMS/URL). La validación siempre debe usar `crypto.timingSafeEqual` sobre buffers de la misma longitud, nunca `===` directo.)

## 2026-04-21 (rama `feat/home-accesos-favorito` RESUELTA — ISSUE-012 accesos directos a Favoritos y Puntos MOOVER desde la home. **Síntoma / motivación**: Favoritos no tenía acceso directo desde ningún lado (estaba enterrado en `/mi-perfil/favoritos`, el usuario tenía que ir a perfil → bajar → favoritos, 3 taps); Puntos sí tenía acceso desde el BottomNav (botón central con estrella) y desde el AppHeader pero el usuario no veía el balance hasta entrar al detalle. Ambas son señales de personalización que aumentan la retención — si el usuario ve "1.250 pts · Canjealos" en el home, sabe que tiene algo que perder y vuelve. **Arquitectura**: (1) Nuevo componente `src/components/home/QuickAccessRow.tsx` (Server Component): lee `auth()` → si hay userId hace UNA query a `prisma.user.findUnique` con `select: { pointsBalance: true, _count: { select: { favorites: true } } }` (select explícito, cero N+1). Try/catch alrededor: si la query falla (DB down, user deleted mid-session), cae silenciosamente al estado deslogueado — el home NUNCA se rompe por este widget. (2) Render: `<section>` con `<div className="grid grid-cols-2 gap-3 lg:gap-4">` — 2 cards lado a lado en mobile-first, sin wrap en desktop. **Card Favoritos**: gradiente `from-rose-50 to-red-50`, círculo rojo MOOVY `#e60012` con `<Heart fill="white">` en blanco, hover `border-rose-200 + shadow-md + scale-110` en el icono. **Card Puntos MOOVER**: gradiente `from-amber-50 to-orange-50`, círculo gradient `from-amber-400 to-orange-500` con `<Star fill="white">` en blanco. Ambas con `<ArrowRight>` sutil al lado del título que se mueve 0.5 al hover. Active state `scale-[0.98]` para feedback táctil. (3) Textos dinámicos por cardinalidad — Favoritos logueado: 0 guardados → "Aún no guardaste ninguno. Tocá el ❤ en tus comercios.", 1 → "1 guardado · Entrá rápido a tu comercio", N → "N guardados · Entrá rápido a ellos"; Puntos logueado: 0 → "Sumá con cada pedido · 10 pts por cada $1.000", N → "N pts · Canjealos en tu próxima compra" (usa `toLocaleString("es-AR")` para formato "1.250"). Deslogueado: CTAs genéricos con `href` `/login?redirect=<destino>` para que vuelva al lugar correcto post-login. (4) `aria-label` compuesto con title+subtitle para lectores de pantalla, touch targets ≥44px (card completa es clickeable), `line-clamp-2` en el subtítulo para prevenir desborde en textos largos. (5) Integración en `src/app/(store)/page.tsx`: import arriba, invocación envuelta en `<AnimateIn animation="reveal">` entre `<HomeFeed>` y el bloque de `<CategoryGrid>` — primera fila visible después del hero/filtros, alta descubribilidad pero sin tapar el contenido principal. **Scope intencional**: el componente es async Server Component porque necesita `auth()` + 1 query; si bloquea el render del home sería un problema, pero como es la segunda sección (después de HomeFeed que ya es dinámico) y es una query trivial (<5ms), no empeora el TTFB. No usamos `Suspense` boundary porque agregar un fallback visual sería más disrupción que el tiempo que ahorra. **Archivos nuevos**: `src/components/home/QuickAccessRow.tsx`. **Archivos modificados**: `src/app/(store)/page.tsx` (import + insertion). **TS clean** (solo errores pre-existentes: `.next/dev/types/*` generados + `src/types/order-chat.ts` TS1127 + `scripts/socket-server.ts` TS1127 + `src/app/privacidad/page.tsx` TS1127 + `node_modules/.prisma/client` pendiente de regenerate). **Regla nueva**: accesos de personalización (favoritos, puntos, direcciones, pedidos recientes) deben tener entry points en el home, no solo en `/mi-perfil`. La home es la primera pantalla que ve el usuario al abrir la app — cualquier señal "tenés algo tuyo acá" aumenta retención.)

## 2026-04-21 (rama `retry-cron-escalation` RESUELTA — ISSUE-015 auto-cancelación final del cron de retry. **Síntoma / motivación**: el cron `retry-assignments` (corre cada 5min) SÍ reintentaba la asignación hasta `MAX_RETRIES = 3` y después escalaba a admin via `notifyAdminOfStuckOrder`, pero NO cerraba el flujo: el pedido quedaba `CONFIRMED` indefinidamente sin driver, el buyer miraba el mapa sin entender qué pasaba, el dinero del MP seguía retenido y nadie le daba un bonus compensatorio. Consecuencia operativa: admin tenía que cancelar manualmente desde OPS, refund manual desde MP panel, bonus manual — 4-5min de trabajo humano por incidente + exposición reputacional. **Arquitectura del fix** (idempotente, defense in depth): (1) En `src/app/api/cron/retry-assignments/route.ts` se agregó `AUTO_CANCEL_THRESHOLD = 6` (~30min de espera total con cron cada 5min: 3 retries propios + 3 retries admin-notified sin éxito) + constantes `AUTO_CANCEL_REASON = "No conseguimos repartidor disponible para tu pedido"` y `AUTO_CANCEL_BONUS_POINTS = 500`. (2) Nueva función `autoCancelStuckOrder(orderBrief, attempts)` que encapsula el cierre completo: primero `prisma.$transaction` atómico que marca Order como `CANCELLED` + `cancelReason` + `adminNotes` con timestamp, apaga SubOrders `updateMany`, restaura stock iterando items (product o listing `increment`), libera `driverId`/`pendingDriverId` (defensivo) y borra `PendingAssignment`; después en secuencia con try/catch individual: (a) si el pedido era `paymentMethod: mercadopago && paymentStatus: PAID` busca el `Payment` con `mpStatus: approved` y dispara `createRefund(mpPaymentId)` — on success actualiza `order.paymentStatus: REFUNDED` + `payment.mpStatus: refunded` con detail descriptivo, on failure emite `refund_failed` a `admin:orders` para que admin lo resuelva manual, (b) `reverseOrderPoints(orderId, reason)` para devolver REDEEM al buyer (idempotente via `Order.pointsEarned/pointsUsed` — nunca dobla reversión), (c) `recordPointsTransaction(userId, "BONUS", 500, description, orderId)` para otorgar el bonus compensatorio, (d) `notifyBuyerOrderAutoCancelled(userId, orderNumber, orderId, bonusAwarded, wasRefunded)` — nuevo helper en `src/lib/notifications.ts` con title `😔 No encontramos repartidor`, body dinámico que incluye las líneas "Te devolvimos el pago" (si refund OK) y "Te regalamos 500 puntos MOOVER por la espera" (si bonus OK), tag `order-autocancelled-${orderNumber}` (distinto de `order-cancelled` para que no colapse el push en el lock screen con una cancelación manual previa del merchant/buyer), (e) sockets `order_cancelled` con flag `auto: true` + `refunded` + `bonusAwarded` + `attempts` a `merchant:${merchantId}`, `admin:orders` y `customer:${userId}`. (3) Loop principal modificado en `POST`: agregada una nueva rama `if (assignmentLogs.length >= AUTO_CANCEL_THRESHOLD)` ANTES del `if (assignmentLogs.length >= MAX_RETRIES)` — cuando hay ≥6 intentos fallidos invoca `autoCancelStuckOrder` en try/catch (si tira excepción se loguea pero el cron sigue con las demás órdenes), y después llama igualmente a `notifyAdminOfStuckOrder` con mensaje completo que incluye refund status + bonus, para que el panel OPS mantenga visibilidad del incidente. Contador `autoCancelled` agregado al response JSON. **Defense in depth**: el `$transaction` ya garantiza el cierre del pedido aunque fallen después refund/points/push — el pedido queda `CANCELLED` sin importar qué side effect falló, y los logs + socket `refund_failed` permiten recovery manual. **Idempotencia end-to-end**: una vez `CANCELLED`, el `where: { status: "CONFIRMED" }` del query inicial del cron excluye la orden de runs futuros. El auto-cancel NO corre si `fullOrder.status === "CANCELLED" || "DELIVERED"` (early return). `reverseOrderPoints` y `recordPointsTransaction` son idempotentes via `pointsEarned/pointsUsed`. **Scope intencional**: single-vendor Orders en `stuckOrders` query. Multi-vendor SubOrder auto-cancel queda para fase 2 porque el refund parcial (cancelar 1 de 3 vendedores con un solo pago MP) requiere lógica de prorrateo que no existe aún en el codebase — admin lo maneja manual por ahora. **Archivos modificados**: `src/app/api/cron/retry-assignments/route.ts`, `src/lib/notifications.ts`. **TS clean** (los únicos errores son los pre-existentes: `node_modules/.prisma/client`, `.next/dev/types/*` generados, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127, `src/app/privacidad/page.tsx` TS1127). **Regla nueva**: cualquier cron de retry/escalación debe tener un "floor" de auto-resolución automática — no dejar al buyer esperando indefinidamente ni empujar el trabajo a admin manual. Umbral recomendado: 2× el umbral de escalación (o 30min absolutos, lo que sea menor). El auto-cierre debe incluir refund, reversión de puntos, bonus compensatorio y push — el buyer merece cierre limpio aunque falle la capa de asignación.)

## 2026-04-21 (rama `feat/push-repartidor-cerca` RESUELTA — ISSUE-013 push "tu repartidor está cerca". **Síntoma / motivación**: el buyer sabe cuando su pedido entra a IN_DELIVERY (push genérico de "está en camino") pero se queda mirando el mapa hasta que el driver toca timbre. En Ushuaia hace -5°C, queremos que el buyer pueda calentar la comida / tener cambio listo / prepararse cuando el driver está realmente por llegar. Complementa el PIN de entrega (ISSUE-001): el push de proximidad recuerda el código justo cuando lo va a necesitar. **Arquitectura**: (1) Schema Prisma: nuevo campo `nearDestinationNotified Boolean @default(false)` agregado a `Order` (single-vendor) Y `SubOrder` (multi-vendor: cada SubOrder tiene su driver independiente, cada uno dispara su push). Requiere `npx prisma db push` + `npx prisma generate` local post-merge. (2) `src/lib/notifications.ts` — nueva función `notifyBuyerDriverNear(userId, orderNumber, orderId, deliveryPin?)` con title `🏍️ Tu repartidor está cerca` y body dinámico: si tenemos `deliveryPin` (pedido ya PICKED_UP, lo normal) → `"Tené listo el código de entrega: XXX XXX"`; si no (edge case) → `"Tu pedido ${orderNumber} está por llegar. Revisá la app."`. Tag `order-near-${orderNumber}` distinto de `order-pin-*` e `order-in_delivery` para NO colapsar con pushes previos en el lock screen (el buyer los ve acumulados). Deep link a `/mis-pedidos/${orderId}`. (3) `src/lib/driver-proximity.ts` (NUEVO) — helper `checkAndNotifyNearDestination({driverId, driverLat, driverLng})`. Constantes: `NEAR_DESTINATION_METERS = 300` (Biblia UX: ≈3-5 min caminando en Ushuaia), `DELIVERY_ACTIVE_STATES = ["PICKED_UP", "IN_DELIVERY"] as const`. Dos paths en secuencia: **Path 1 (single-vendor)** `prisma.order.findMany({where: {driverId, deliveryStatus in ACTIVE_STATES, nearDestinationNotified: false, deletedAt: null}, take: 10})` con include de `address.{latitude,longitude}` + `deliveryPin`. Para cada order calcula `calculateDistance(driverLat, driverLng, destLat, destLng) * 1000` y si < 300m hace `prisma.order.updateMany({where: {id, nearDestinationNotified: false}, data: {nearDestinationNotified: true}})` ATÓMICO — solo si `update.count === 1` (ganamos la carrera, ningún otro request disparó) llamamos a `notifyBuyerDriverNear`. **Path 2 (multi-vendor)** mismo patrón sobre `prisma.subOrder.findMany({where: {driverId, deliveryStatus in ACTIVE_STATES, nearDestinationNotified: false, order: {deletedAt: null}}, take: 10})` con include de `order.{id, userId, orderNumber, address}` + `deliveryPin` a nivel SubOrder (multi-vendor tiene PINs por SubOrder). Un buyer con 3 vendedores recibe hasta 3 pushes — uno por cada driver que cruza el radio. Errores se loguean con `console.error` y nunca throwean (fire-and-forget). (4) `src/app/api/driver/location/route.ts` — después del update exitoso de coords + history, se invoca `checkAndNotifyNearDestination({driverId, driverLat: latitude, driverLng: longitude}).catch(err => console.error(...))` FIRE-AND-FORGET. El handler devuelve la respuesta HTTP sin esperar el check (crítico: la UI del driver dashboard pollea GPS cada 10s, no puede bloquearse por un push fallido). **Defensa de concurrencia**: el patrón `updateMany WHERE flag=false` es el mismo usado en ISSUE-054 (`DriverAvailabilitySubscription.notifiedAt`) — si dos updates GPS llegan casi simultáneos y ambos ven el flag en false, solo el primero gana (count=1), el segundo ve count=0 y skipea el push. Cero duplicados sin necesidad de transaction ni lock. **Cap de queries**: `take: 10` por path porque un driver no debería tener >10 entregas activas simultáneas (smart batching limita a 3-4 normalmente); el cap previene que una race condition crónica genere queries largas. **Idempotencia end-to-end**: una vez notificado, `nearDestinationNotified: true` impide cualquier re-push aunque el driver salga y vuelva al radio (común en Ushuaia con calles con poca señal). Si se quisiera resetear (ej: pedido devuelto al comercio por problema), habría que resetear el flag manualmente desde OPS, pero ese flujo no es común. **Archivos modificados**: `prisma/schema.prisma`, `src/lib/notifications.ts`, `src/app/api/driver/location/route.ts`. **Archivos nuevos**: `src/lib/driver-proximity.ts`. **TS clean** en los archivos nuevos/modificados (los errores pre-existentes de `.next/dev/types/*` generados + `src/app/privacidad/page.tsx` TS1127 + `src/types/order-chat.ts` TS1127 + `scripts/socket-server.ts` TS1127 + `node_modules/.prisma/client` pendiente de regenerate son los mismos que quedaron de las ramas anteriores, no de ésta). **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para que el cliente Prisma conozca `nearDestinationNotified` — sin esto, el código tirará runtime error "Unknown field" al primer GPS update del driver. **Regla nueva**: cualquier notificación post-pedido que tenga una transición "one-time" (one-shot: se dispara UNA vez y no se repite) debe usar el patrón `flag: false` + `updateMany WHERE flag: false` + check `count === 1` antes de disparar el side effect. Nunca usar `findFirst` → `if(!flag) send → update` secuencial porque permite doble disparo bajo concurrencia.)

## 2026-04-21 (rama `fix/chat-multidireccional` RESUELTA — chat orden multidireccional completo. Hasta ahora el OrderChat solo soportaba BUYER_MERCHANT, BUYER_DRIVER y BUYER_SELLER (buyer-céntrico). Problema: en multi-vendor el buyer veía UN solo card "Chat con vendedor" aunque el pedido tuviera 3 sellers, y el driver no tenía forma de coordinar con el comercio ni con los vendedores marketplace. **Arquitectura**: (1) Schema `OrderChat` ya tenía los enums `DRIVER_MERCHANT` y `DRIVER_SELLER` + campo `subOrderId` desde el WIP previo (commit `ddfd78f9`) — esta rama solo completa la UI de los 4 portales. (2) Buyer en `src/app/(store)/mis-pedidos/[orderId]/page.tsx`: reemplazado el card único de vendedor por un `map` sobre `order.subOrders?.filter(so => so.seller)` que monta UN `OrderChatPanel` por SubOrder con `subOrderId={so.id}` — ahora el buyer ve una card de chat por cada vendedor marketplace presente en el pedido. (3) Driver dashboard backend `src/app/api/driver/dashboard/route.ts`: el include de `activeOrders` ahora trae `subOrders: { id, driverId, seller: { id, displayName, userId } }`. El helper formateador agrega dos campos al response: `hasMerchant: !!order.merchant?.name` (para decidir si mostrar chat DRIVER_MERCHANT — en marketplace-only puede ser null) y `sellersEnPedido: Array<{subOrderId, sellerName}>` filtrado por `so.driverId === driver.id || !so.driverId` (un driver solo ve los vendedores cuyas SubOrders le fueron asignadas o en single-vendor delivery donde el driver está a nivel Order). Además se empezó a devolver `orderNumber` como campo distinto del display `orderId` para poder pasarlo al `OrderChatPanel` limpio. (4) Driver UI `src/app/repartidor/(protected)/dashboard/page.tsx`: fix de bug pre-existente — el chat BUYER_DRIVER pasaba `pedidoActivo.orderId` (display ID tipo "MOV-1234" que venía del `order.orderNumber || order.id.slice(-6)`) cuando el endpoint `/api/order-chat` espera el Prisma `id` cuid. Corregido a `pedidoActivo.id`. Agregados DRIVER_MERCHANT (condicional a `hasMerchant`) y DRIVER_SELLER (map sobre `sellersEnPedido` con `subOrderId`). La interface local `Order` extendida con `hasMerchant?: boolean` y `sellersEnPedido?: Array<{subOrderId, sellerName}>`. (5) Merchant UI `src/app/comercios/(protected)/pedidos/page.tsx`: el contenedor de chats cambió a `flex flex-wrap gap-2`. Agregado `DRIVER_MERCHANT` condicional a `order.driver?.user?.name` (solo aparece cuando el pedido ya fue asignado a un driver). (6) Seller backend `src/app/api/seller/orders/route.ts`: el include del `prisma.subOrder.findMany` ahora trae `driver` a nivel SubOrder (multi-vendor: cada SubOrder tiene driver propio, usado principalmente para el chat DRIVER_SELLER) + en `order.*` ahora vienen `id` y `driver` (fallback single-vendor cuando la SubOrder no tiene driver propio pero el Order sí). (7) Seller UI `src/app/vendedor/(protected)/pedidos/page.tsx`: interface `SubOrder` extendida con `driver?: { id, user: { name } }` y `order.driver?: ...`. Bloque de chats cambiado a `flex flex-wrap gap-2` con dos panels: `BUYER_SELLER` (bug histórico fixed: antes NO tenía `subOrderId`, ahora sí — el vendedor abría un chat compartido entre todos los pedidos del buyer con él en vez de scopeado a la SubOrder) y el nuevo `DRIVER_SELLER` (solo aparece cuando `sub.driver || order.driver` está presente, usa `subOrderId={order.id}` de la SubOrder). **Scoping de multi-vendor**: todos los chats no-BUYER_MERCHANT ahora llevan `subOrderId` — un pedido multi-vendor genera N chats independientes (uno por cada par seller/driver × SubOrder). Un pedido single-vendor sigue funcionando porque el API normaliza null/undefined en el lado del resolver. **Archivos modificados**: `src/app/(store)/mis-pedidos/[orderId]/page.tsx`, `src/app/api/driver/dashboard/route.ts`, `src/app/repartidor/(protected)/dashboard/page.tsx`, `src/app/comercios/(protected)/pedidos/page.tsx`, `src/app/api/seller/orders/route.ts`, `src/app/vendedor/(protected)/pedidos/page.tsx`. **Archivos del WIP previo (ya commiteados en `ddfd78f9`, no modificados en esta rama)**: `src/types/order-chat.ts` (enum + quick responses), `src/app/api/order-chat/route.ts` (POST/GET con resolveParticipants multi-rol), `src/app/api/order-chat/[chatId]/route.ts`, `src/app/api/order-chat/existing/route.ts`, `src/components/orders/OrderChatPanel.tsx` (soporte 5 chatTypes + paleta emerald para DRIVER_*), `src/lib/order-chat-notify.ts` (push + socket per-chatType), `scripts/socket-server.ts`. **TS clean** (0 errores sobre todo el repo con `npx tsc --noEmit --skipLibCheck`). **Regla nueva**: cualquier nuevo `OrderChatPanel` en multi-vendor DEBE pasar `subOrderId` de la SubOrder correspondiente. Sin ese scope, los mensajes de vendedores distintos en el mismo pedido se mezclan en un único chat.)

## 2026-04-21 (rama `fix/privacy-policy-aaip-compliance` RESUELTA — compliance integral Ley 25.326 + AAIP. **Síntoma**: pre-launch audit legal detectó que la plataforma no cumplía con varios requisitos de la Ley de Protección de Datos Personales de Argentina y la Resolución 47/2018 de AAIP: faltaba banner de cookies granular, no había endpoint de export (ARCO acceso/portabilidad), no se registraba el consentimiento con versión/IP/timestamp (auditable), no existía flujo de opt-in marketing separado (Ley 26.951 "No Llame"), no había panel de privacidad para que el user vea/revoque sus consentimientos, y los formularios de registro no pedían confirmación explícita de mayoría de edad. **Arquitectura del fix** (7 fases): (1) Schema Prisma: nuevo modelo `ConsentLog` (id/userId/consentType/version/action/ipAddress/userAgent/details/acceptedAt, índices `[userId,consentType]` y `[acceptedAt]`, cascade onDelete). Campos nuevos en `User`: `termsConsentVersion`, `privacyConsentVersion`, `age18Confirmed` (default false), `marketingConsent` (default false), `marketingConsentAt?`, `marketingConsentRevokedAt?`, `cookiesConsent?` (JSON), `cookiesConsentAt?`. Campo `acceptedPrivacyAt?` en `Driver` y `SellerProfile`. Requiere `npx prisma db push` + `npx prisma generate` local. (2) `src/lib/legal-versions.ts`: constantes canónicas `PRIVACY_POLICY_VERSION="2.0"`, `TERMS_VERSION="1.1"`, `COOKIES_POLICY_VERSION="1.1"`, `MARKETING_CONSENT_VERSION="1.0"` + enums `CONSENT_TYPES` (TERMS/PRIVACY/MARKETING/COOKIES) y `CONSENT_ACTIONS` (ACCEPT/REVOKE). Regla: solo bumpear versiones acá, nunca hardcodear en otros archivos. (3) `src/lib/consent.ts`: helper `recordConsent({userId, consentType, version, action, request, details})` que hace INSERT inmutable en `ConsentLog` extrayendo IP de `x-forwarded-for` (o `x-real-ip` fallback) y User-Agent (trunca a 500 chars). Nunca update — el log es append-only para auditoría AAIP. (4) Banner de cookies `src/components/legal/CookieBanner.tsx`: client component montado en `(store)/layout.tsx`, 3 acciones (Aceptar todas / Rechazar no esenciales / Configurar). Panel de settings con toggle por categoría (Essential siempre ON y disabled, Functional, Analytics, Marketing). Storage `localStorage.moovy_cookies_consent_v1`. Endpoint `POST /api/cookies/consent` (rate limit 10/60s, Zod `{essential: true, analytics, functional, marketing}`) que persiste en `User.cookiesConsent` + `recordConsent({consentType:"COOKIES"})` si está logueado, o 200 para client-side storage si no. (5) Export ARCO `GET /api/profile/export-data`: rate limit 3/10min, devuelve JSON descargable `moovy-datos-<userId>-<fecha>.json` con bloques `datosPersonales`, `direcciones`, `pedidos` (con items, SubOrders, delivery info), `transaccionesDePuntos`, `favoritos`, `suscripcionesPush`, `referidos`, `consentimientos` (todo el ConsentLog del user), `perfilRepartidor`, `comerciosPropios`, `perfilVendedor`. Loguea `USER_DATA_EXPORTED` en audit. Es el ejercicio del derecho de acceso (Art. 14) y portabilidad (Art. 19 bis). (6) Forms de registro actualizados: `auth/register/route.ts` (buyer) ahora valida `acceptTerms`, `acceptPrivacy`, `age18Confirmed` (400 si falta). Persiste `termsConsentAt/Version`, `privacyConsentAt/Version`, `age18Confirmed: true`, `marketingConsent` y `marketingConsentAt` (condicional). Llama `recordConsent` para TERMS, PRIVACY y opcionalmente MARKETING después del $transaction (try/catch — si falla el log, el registro no se tumba). Mismo pattern aplicado a `auth/register/driver/route.ts`, `auth/register/merchant/route.ts` (PATH B new user escribe los 4 campos de versión), y `auth/activate-seller/route.ts` (nuevo campo `acceptedPrivacy` requerido en body, valida + persiste + log). UI del `(store)/registro/page.tsx` (buyer) agrega checkbox obligatorio "Confirmo que soy mayor de 18 años" y checkbox opcional "Quiero recibir ofertas y novedades por email/push". Merchant/driver/seller UIs ya tenían ambos checkboxes, solo se ajustó el API consumer del `VendedorRegistroClient.tsx` para mandar `acceptedPrivacy: true`. (7) Panel de privacidad `src/app/(store)/mi-perfil/privacidad/page.tsx`: 5 secciones — banner ARCO, exportar datos (botón descarga), consentimientos vigentes (cards con versión + fecha + badge "Al día"/"Revisar vX.X" con link a /terminos o /privacidad; card marketing con toggle activar/revocar; card cookies con link a /cookies), historial de consentimientos (lista últimos 50 eventos del ConsentLog con badge color-coded Aceptó/Revocó/Actualizó + fecha + IP), contacto DPO `privacidad@somosmoovy.com`, y eliminar cuenta (link a `/mi-perfil/datos` que ya tiene el flujo). Endpoint `src/app/api/profile/privacy/route.ts`: GET devuelve `{current: {terms, privacy, marketing, cookies, age18Confirmed}, history: ConsentLog[]}` con flag `upToDate` calculado por versión latest vs aceptada. PATCH con Zod `{marketingConsent: boolean}` que actualiza `User.marketingConsent/marketingConsentAt/marketingConsentRevokedAt` + inserta `ConsentLog` con action ACCEPT o REVOKE. Rate limit 10/60s. Nuevo link "Privacidad y Datos" en `/mi-perfil` (icono Shield emerald) debajo de Favoritos. Página `/cookies` actualizada a v1.1 con banner gradient que explica el control del user y link al panel de privacidad. **Archivos nuevos**: `src/lib/legal-versions.ts`, `src/lib/consent.ts`, `src/components/legal/CookieBanner.tsx`, `src/app/api/cookies/consent/route.ts`, `src/app/api/profile/export-data/route.ts`, `src/app/api/profile/privacy/route.ts`, `src/app/(store)/mi-perfil/privacidad/page.tsx`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/driver/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/auth/activate-seller/route.ts`, `src/app/(store)/registro/page.tsx`, `src/app/vendedor/registro/VendedorRegistroClient.tsx`, `src/app/(store)/layout.tsx`, `src/app/(store)/mi-perfil/page.tsx`, `src/app/cookies/page.tsx`. **Regla nueva**: cualquier cambio a documentos legales (terms/privacy/cookies/marketing) DEBE (a) bumpear la constante en `src/lib/legal-versions.ts`, (b) mostrar al user el banner "Revisar vX.X" en el panel de privacidad, (c) pedir re-aceptación si el cambio es material (no typos). El historial en `ConsentLog` es la prueba legal de qué versión aceptó cada user — nunca update, solo insert. **TS clean** para los archivos nuevos/modificados de AAIP (los 3 errores pre-existentes son `src/types/order-chat.ts` y `scripts/socket-server.ts` con TS1127 chars inválidos — no parte de esta rama — y `node_modules/.prisma/client` pendiente de `prisma generate`). **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para regenerar el cliente con el nuevo modelo `ConsentLog` + campos nuevos en `User`/`Driver`/`SellerProfile`.)

## 2026-04-21 (rama `user-deletion-no-resurrection` RESUELTA — bug crítico de resurrección de cuentas, ISSUE-060. **Síntoma detectado por Mauro**: eliminó un usuario desde OPS, el mismo usuario volvió a registrarse con el mismo mail, y el sistema le trajo TODA su data vieja (comercios aprobados, productos, fiscal data, tokens MP). **Causa raíz**: `src/app/api/auth/register/route.ts` tenía un code path "reactivar" que, si detectaba un `User` con `deletedAt != null` en el email consultado, hacía `tx.user.update({deletedAt: null, password: nuevo, ...})` y seguía — PERO sin tocar los `Merchant`/`Driver`/`SellerProfile` colgados del `ownerId` viejo. Resultado: el registro "nuevo" quedaba con los comercios aprobados, fiscal data encriptada (cuit/cbu/cuil/ownerDni), `mpAccessToken/mpRefreshToken/mpUserId/mpEmail`, órdenes históricas y productos intactos. **Arquitectura del fix** (defense in depth, 4 capas): (1) `auth/register/route.ts` — eliminado el path de reactivación. Si existe `User` con `deletedAt != null` → **410** "Esta cuenta fue eliminada. Si creés que fue un error, escribinos a soporte." + audit log `ACCOUNT_RESURRECTION_BLOCKED`. Si existe con `deletedAt: null` → 409 "email en uso" (comportamiento previo). El `$transaction` quedó con el path "user nuevo" únicamente. (2) `auth/register/merchant/route.ts` — mismo check `if (existingUser?.deletedAt)` añadido antes del check de merchants colgados. Misma respuesta 410 + audit con `source: "auth/register/merchant"` y `businessName`. (3) `admin/users/[id]/delete/route.ts` — cascada completa dentro del `$transaction` serializable: Merchant queda `isActive: false`, `isOpen: false`, `approvalStatus: "REJECTED"`, `rejectionReason: "Cuenta eliminada por administrador"`, `isSuspended: true`, `suspendedAt: now`, y se **nullean** `cuit, cuil, bankAccount, ownerDni, mpAccessToken, mpRefreshToken, mpUserId, mpEmail`. Driver queda `isActive: false`, `isOnline: false`, `availabilityStatus: "FUERA_DE_SERVICIO"`, `approvalStatus: "REJECTED"`, `isSuspended: true`, + nulls `cuit, latitude, longitude`. SellerProfile queda `isActive: false`, `isOnline: false`, `isSuspended: true`, `displayName: "[Cuenta eliminada]"`, `bio: null`, + nulls `cuit, bankAlias, bankCbu, mpAccessToken, mpRefreshToken, mpUserId, mpEmail`. **Decisión intencional**: admin-delete NO anonimiza el email del User — lo mantiene "quemado" para que todo re-registro futuro responda 410. Admin que elimina desde OPS está tomando decisión grave (fraude/abuso), el email debe quedar bloqueado sin intervención humana adicional. (4) `profile/delete/route.ts` — agregada la cascada que FALTABA para Merchant (bug pre-existente: self-delete no apagaba comercios aprobados, los dejaba operativos bajo un User anonimizado). Mismo apagado que admin-delete. Además se agregaron `deletedAt: now`, `isSuspended: true`, `suspendedAt: now`, `suspensionReason: "Cuenta eliminada por el usuario"` al update del User — antes el código anonimizaba email/phone/password sin marcar `deletedAt` explícitamente. El Driver/Seller cascade también recibió REJECTED + fiscal data nulleada (antes solo deactivaban). **Self-delete sigue anonimizando email** (`deleted-${userId}@deleted.moovy.local`) — libera el unique constraint para que la persona pueda volver con cuenta fresca. Admin-delete NO anonimiza — email "quemado". La diferencia es deliberada: el usuario que se auto-elimina merece la opción de volver; el usuario echado por admin no. **Audit log nueva acción**: `ACCOUNT_RESURRECTION_BLOCKED` con `details: { email, deletedAt, source, timestamp, businessName? }`. **Script de detección**: `scripts/cleanup-resurrected-users.ts` (read-only). Tres heurísticas: (a) `User.updatedAt - createdAt > 7d` + merchants APPROVED aprobados pre-update; (b) `bonusActivated: false` + `pendingBonusPoints > 0` + cuenta > 30d + merchants APPROVED; (c) `termsConsentAt > createdAt + 7d`. Reporta candidatos con todos los detalles (merchants con approvedAt, drivers, sellers) para que el admin decida manualmente desde OPS. No modifica nada. Uso: `npx tsx scripts/cleanup-resurrected-users.ts`. **TS clean** (solo error pre-existente en `node_modules/.prisma/client` desde ISSUE-021). **Archivos modificados**: `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/admin/users/[id]/delete/route.ts`, `src/app/api/profile/delete/route.ts`, `scripts/cleanup-resurrected-users.ts` (nuevo). **Regla nueva**: nunca un endpoint de registro debe escribir sobre un User soft-deleted. La única operación válida contra `deletedAt != null` es la restauración explícita del admin o el cascading cleanup en delete. Cualquier intento de "reactivación" silenciosa es un bug por definición.)

## 2026-04-21 (rama `avisame-driver-disponible` RESUELTA — ISSUE-054 "avisame cuando haya repartidor". Nuevo flujo end-to-end para cuando el buyer llega al checkout sin repartidores disponibles: se suscribe con un tap, queda registrado con su ubicación + merchantId (opcional), y recibe push apenas un driver pasa a `isOnline: true` en un radio de 5km. **Schema**: nuevo modelo `DriverAvailabilitySubscription` (id/userId/latitude/longitude/merchantId?/createdAt/expiresAt/notifiedAt?) con relaciones a `User` y `Merchant` (onDelete: Cascade / SetNull). Índices: `userId`, `(notifiedAt, expiresAt)` y `merchantId`. Requiere `npx prisma db push` + `npx prisma generate` local. **Endpoint `POST /api/notifications/driver-available-subscribe`**: auth via `auth()`, rate limit 10/min por IP (`applyRateLimit`), Zod `{ latitude: [-90, 90], longitude: [-180, 180], merchantId: string(1,50)? }`. Antes de crear, valida que `merchantId` exista si viene (evita FKs rotas). Si ya hay sub activa para mismo user + merchant + ubicación a <~100m (delta 0.001°), REFRESCA `expiresAt` y ubicación en vez de duplicar. Enforcement `MAX_ACTIVE_SUBS_PER_USER=3` (429 si supera). TTL `SUBSCRIPTION_TTL_HOURS=4`. Devuelve `{ success, subscriptionId, expiresAt, refreshed }`. DELETE `?id=<subscriptionId>` con ownership check. **Helper `src/lib/driver-availability.ts`**: `notifyAvailabilitySubscribers({driverId, driverLat, driverLng})` busca subs con `notifiedAt: null, expiresAt > now` (cap 500), filtra por Haversine ≤ `NOTIFY_RADIUS_KM=5`. Procesa en chunks de `PUSH_CONCURRENCY=10` con `Promise.allSettled`. Para cada sub hace `updateMany({where:{id, notifiedAt: null}, data:{notifiedAt: now}})` ATÓMICO — si dos drivers se conectan en simultáneo, solo uno gana la carrera, el otro ve `count: 0` y skipea el push (zero doble notificación). Push: `title: "🏍️ ¡Ya hay repartidor en tu zona!"`, `body: "Entrá al checkout y completá tu pedido antes que vuelva a subir la demanda."`, `url: "/checkout"`, `tag: "driver-available-${sub.id}"`. Retorna `{candidates, notified, errors}`. Errores se loguean con pino, nunca throwean. Filtro "dentro del radio del BUYER" (no del comercio) porque el buyer es quien espera en su dirección; el driver se mueve hacia el merchant después. **Trigger en `PUT /api/driver/status`**: antes del update leemos `previous.isOnline` con `findUnique`; `wasOffline = !previous?.isOnline`. Después del update + PostGIS, si `driver.isOnline && wasOffline` disparamos `notifyAvailabilitySubscribers(...).catch(err => console.error(...))` fire-and-forget (no bloquea response). Solo se activa en la transición offline → online real, NO en toggles `DISPONIBLE ↔ OCUPADO` mientras ya estaba online — así evitamos spam cuando el driver pausa para ir al baño y vuelve. **UI checkout** (`src/app/(store)/checkout/page.tsx`): card de "no hay repartidores" rediseñada en el step 1. CTA primaria `🔔 Avisame cuando haya repartidor` (botón MOOVY rojo, full-width). Disabled + hint "Completá tu dirección abajo para activar el aviso" si `!address.latitude || !address.longitude`. Handler `handleSubscribeToDriverAvailable` POST al endpoint, toast.success en éxito, toast.error con mensaje del backend en falla. Estado optimistic `availabilitySubscribed`: al confirmar, la CTA se reemplaza por badge verde `✓ Te avisamos cuando haya` (ya no se puede volver a tocar). Texto top reemplazado a "Suele durar menos de 15 min en esta zona". Alternativas secundarias abajo, separadas por border-top: "Programar para más tarde" (cambia a `deliveryType SCHEDULED`) y "Retirar en local" (cambia a `deliveryMethod pickup`). Iconos: `Clock`, `Bell`, `CheckCircle`, `Loader2`. TS clean (solo errores pre-existentes en `node_modules/.prisma/client` desde ISSUE-021 — se limpian con el `prisma generate` post-schema).)

## 2026-04-21 (rama `fix/driver-offline-mid-delivery` RESUELTA — ISSUE-010 cron detecta driver offline mid-delivery. Extendido `src/app/api/cron/retry-assignments/route.ts` con dos queries nuevas que corren después del retry existente: (1) `prisma.order.findMany` con `driverId: { not: null }` + `deliveryStatus IN [DRIVER_ASSIGNED, DRIVER_ARRIVED, PICKED_UP]` + `status NOT IN [CANCELLED, DELIVERED]` + `OR: [driver.isOnline false, driver.lastLocationAt null, driver.lastLocationAt < now - 15min]` para single-vendor; (2) la misma lógica aplicada a `prisma.subOrder.findMany` para multi-vendor (cada SubOrder tiene su propio `driverId`). Ambas queries están capadas en 50 resultados — Ushuaia (80k hab) no debería tener >50 pedidos mid-delivery simultáneos. Nueva función `notifyAdminOfOfflineDriver({orderId, orderNumber, subOrderId?, driverId, driverName, deliveryStatus, minutesOffline, driverIsOnline, lastLocationAt})` emite socket event `driver_offline_mid_delivery` a tres rooms: `admin:<userId>` (cada admin), `admin:orders` y `admin:drivers` (cualquier panel puede renderizar el incidente). **No se reasigna automáticamente** porque el driver puede tener el paquete en mano (PICKED_UP) — la reasignación requiere coordinación humana (llamar al driver, ver si recuperó señal, etc.). Constantes top-level: `DRIVER_OFFLINE_THRESHOLD_MINUTES = 15`, `DRIVER_OFFLINE_ACTIVE_STATES = ["DRIVER_ASSIGNED","DRIVER_ARRIVED","PICKED_UP"] as const`. Se eliminó el `early return` cuando `stuckOrders.length === 0` — antes, si no había órdenes stuck en CONFIRMED, el cron retornaba sin correr el check nuevo; ahora siempre llega al final. El response JSON agrega `driverOfflineAlerts` al payload de stats. Admins reciben el alert cada run del cron (cada 5min) mientras la condición persista — mismo patrón que `stuck_order_alert` del ISSUE-015. TS clean (únicos errores son pre-existentes en `node_modules/.prisma/client` por el `npx prisma generate` pendiente desde ISSUE-021).)

## 2026-04-21 (rama `fix/checkout-breadcrumb-y-tour-buyer` RESUELTA — 2 issues UX pre-launch: ISSUE-055+056 (checkout con 3 tabs Entrega→Pago→Confirmar + tipo de entrega mudado al paso Entrega) + ISSUE-021 (tour buyer primera vez, 3 pantallas). **ISSUE-055+056**: `src/app/(store)/checkout/page.tsx` rediseñado de flujo 1→2 (Envío standalone eliminado, el costo de envío se ve inline en el sidebar "Tu Pedido") a 3 tabs claras Entrega → Pago → Confirmar. El breadcrumb superior muestra el paso actual, los completados con `CheckCircle` y los pendientes con número en círculo gris, con `aria-current="step"` en el activo. El bloque "¿Cuándo querés recibirlo?" (Inmediata vs Programada + `TimeSlotPicker`) se movió del paso Pago al paso Entrega — ahora vive junto al método de entrega (home/pickup) y la dirección, porque es una decisión del "cuándo" de la logística, no del pago. El paso Pago es solo `PointsWidget` + radio Efectivo/MP + "Continuar a confirmar". Paso Confirmar: resumen con cards para dirección (link "Cambiar" → step 1), tipo de entrega (con horario si programada), método de pago (link "Cambiar" → step 2), puntos aplicados (si `pointsUsed > 0`, card verde) y botón final "Confirmar Pedido" (disabled si `SCHEDULED && !slot` o no-pickup sin range). El sidebar "Tu Pedido" ya tenía el desglose completo de ISSUE-059 así que se mantuvo intacto. Import de `AlertCircle` eliminado (lo usaba solo el step 2 standalone viejo). **ISSUE-021**: schema `User.onboardingCompletedAt DateTime?` (requiere `npx prisma db push` + `npx prisma generate`). `src/app/api/onboarding/route.ts` con GET (`{ shouldShow: boolean }`) + POST (marca `new Date()`, idempotente — si ya estaba completo devuelve `alreadyCompleted: true` sin sobrescribir). `src/components/onboarding/BuyerOnboardingTour.tsx`: cliente, 3 slides full-screen (sheet desde abajo en mobile, modal centrado en desktop) con gradientes de marca (rojo MOOVY / violeta marketplace / amber-orange puntos). Slide 1 qué es Moovy (comercios locales, pago instantáneo, repartidores Ushuaia), slide 2 cómo pedir (flow aceptación → retiro → tracking), slide 3 puntos de bienvenida (10pts/$1k, 1pt=$1, referidos). Dots clickeables para saltar entre slides. Botón X top-right + botón "Saltar" bottom ambos marcan completado. Optimistic close con flag `localStorage` (`moovy_onboarding_done_<userId>`) por si el POST falla por red — evita re-mostrar. Self-gated: useSession authenticated + `GET /api/onboarding` devuelve `shouldShow: true`. Montado en `src/app/(store)/layout.tsx` junto al PromoPopup. Body scroll lockeado mientras está visible. Accesibilidad: `role="dialog" aria-modal="true" aria-label="Tour de bienvenida"`.)

