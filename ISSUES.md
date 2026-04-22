# Moovy — Issues pre-lanzamiento

**Última actualización:** 2026-04-21 (bug crítico de resurrección de cuentas resuelto — rama `user-deletion-no-resurrection`. Nuevo ISSUE-060 documentado y cerrado en el mismo día.)
**Versión anterior:** 2026-04-20 (bundle UX pulido pre-launch: ISSUE-036, 037, 038, 039, 041, 042, 043, 044, 047, 059 resueltos — rama `fix/ux-pulido-pre-launch`)

Este archivo es la fuente única de verdad del estado real pre-lanzamiento. Antes del audit del 2026-04-20 la lista estaba seriamente desactualizada: muchos issues marcados como 🔴 CRÍTICOS abiertos ya estaban resueltos desde hacía semanas (PIN doble, autocompra, reconciliación MP, state machine driver, delivery fee fallback, redirects, etc.). La nueva versión refleja lo que realmente queda.

---

## Resumen ejecutivo — dónde estamos

**Críticos reales restantes: 1** (data cleanup manual — ISSUE-004 via script PL-001 pre-lanzamiento).
**Críticos parciales: 0** (ISSUE-054 resuelto completo el 2026-04-21).
**Importantes reales restantes: 5** (principalmente backend/logística; 10 de UX pulido + 3 de seguridad urgentes + el diferido se cerraron el 2026-04-20).
**Menores: 16** (post-lanzamiento).

La buena noticia: **todos los críticos que tenían riesgo de dinero, fraude o datos ya están resueltos** (PIN doble, autocompra, reconciliación MP, state machine driver, delivery fee fallback, puntos post-DELIVERED, subastas ocultas, redirects rotos, post-checkout redirect). El código está en un estado sólido para lanzar.

Lo único bloqueante que queda es la decisión operativa de ISSUE-004 (limpiar data de prueba antes de abrir). Se ejecuta via script PL-001 el día del lanzamiento.

**Estimación para estar listos:** 1-2 días de trabajo real + el día de ejecución de PL-001 (reset total antes de abrir).

---

## 🔴 CRÍTICOS reales (bloquean lanzamiento)

### ISSUE-004 — Limpiar data de prueba antes del lanzamiento público
**Estado:** 🔴 ABIERTO — se resuelve con `scripts/pre-launch-reset.ts` (PL-001) el día antes del lanzamiento.
**Qué hace falta:**
1. Escribir `scripts/pre-launch-reset.ts` (ver sección "Pre-lanzamiento final" más abajo)
2. Ejecutar primero en DB local contra copia de producción
3. Día antes de abrir: correr en producción, confirmar admin OPS preservado, validar configs intactas, DB limpia

**Esfuerzo:** 3-4 horas (script + validación local + ejecución supervisada).

### ISSUE-060 — Resurrección de cuentas: email eliminado re-registra con data vieja
**Estado:** ✅ RESUELTO 2026-04-21 en rama `user-deletion-no-resurrection`.
**Descubierto por:** Mauro. Reporte: "eliminé un usuario desde OPS, el usuario volvió a crear la cuenta con el mismo mail, le trajo toda la información vieja (comercios aprobados, productos, etc.)".
**Causa raíz:** `src/app/api/auth/register/route.ts` tenía un path "reactivar" que, si encontraba un `User` con `deletedAt != null` al recibir un registro con el mismo email, seteaba `deletedAt: null` y reseteaba algunos campos del User, PERO dejaba intactos los `Merchant`/`Driver`/`SellerProfile` colgados del `ownerId` viejo. Resultado: `approvalStatus: "APPROVED"`, fiscal data, tokens de MercadoPago, productos, y órdenes históricas "resucitaban" al nuevo login.
**Cascada secundaria:** `src/app/api/profile/delete/route.ts` tampoco tocaba Merchants en absoluto (ni self-delete ni admin-delete apagaban el comercio), y `src/app/api/admin/users/[id]/delete/route.ts` solo ponía `isActive: false` en Merchant sin cambiar `approvalStatus` ni anular fiscal data.
**Qué se hizo:**
1. **auth/register/route.ts** — eliminado el path de "reactivación". Si existe `User` con `deletedAt != null` → 410 "Esta cuenta fue eliminada. Si creés que fue un error, escribinos a soporte." + audit log `ACCOUNT_RESURRECTION_BLOCKED`. Si existe con `deletedAt: null` → 409 "email en uso" (comportamiento previo). La transacción de creación quedó solo con el path "user nuevo".
2. **auth/register/merchant/route.ts** — mismo check añadido antes de buscar merchants colgados. Rechaza con 410 si `existingUser.deletedAt != null`.
3. **admin/users/[id]/delete/route.ts** — cascada completa dentro del `$transaction` serializable: Merchant queda `isActive: false`, `isOpen: false`, `approvalStatus: "REJECTED"`, `rejectionReason: "Cuenta eliminada por administrador"`, `isSuspended: true`, `suspendedAt: now`, y se nullean `cuit, cuil, bankAccount, ownerDni, mpAccessToken, mpRefreshToken, mpUserId, mpEmail`. Driver y SellerProfile reciben el mismo tratamiento (REJECTED + SUSPENDED + fiscal data nulleada). **El email del User NO se anonimiza** en admin-delete — es intencional, para que intentos futuros de registro con ese email sean rechazados con 410 (cuenta "quemada" por fraude/abuso/etc).
4. **profile/delete/route.ts** — agregada la cascada que faltaba para Merchant (mismo apagado que admin-delete). También se agregaron `deletedAt: now`, `isSuspended: true`, `suspendedAt: now`, `suspensionReason: "Cuenta eliminada por el usuario"` al update del User (antes solo se anonimizaban campos sin marcar deletedAt explícitamente — el código confiaba en el audit log y el campo anonimizado, pero no seteaba deletedAt). Self-delete sigue anonimizando el email (`deleted-${userId}@deleted.moovy.local`) para liberar el unique y permitir re-registrarse con una cuenta FRESCA.
5. **Audit log nueva acción:** `ACCOUNT_RESURRECTION_BLOCKED` registra todo intento de registro contra email soft-deleted, tanto en `auth/register` como en `auth/register/merchant`, con `details.source` indicando qué endpoint.
6. **Script de detección:** `scripts/cleanup-resurrected-users.ts` (read-only). Tres heurísticas: (a) gap `updatedAt - createdAt > 7d` + merchants `APPROVED` aprobados pre-update; (b) `bonusActivated: false` + `pendingBonusPoints > 0` + cuenta de > 30d + merchants APPROVED; (c) `termsConsentAt > createdAt + 7d` (re-aceptación tardía). Reporta candidatos con todos los detalles para que el admin decida manualmente desde OPS. No modifica nada.

**Defense in depth:** el fix no depende de una sola capa. El register bloquea, el admin-delete marca el email como "quemado", el self-delete anonimiza y libera el email para re-registrarse fresco, y el cleanup script detecta casos históricos que quedaron en la DB antes del fix.

**Decisión de diseño — admin-delete NO anonimiza email:** El admin que elimina un usuario desde OPS está tomando una decisión deliberada (fraude, abuso, violación de términos). Si el email se anonimizara automáticamente, el usuario podría re-registrarse con una cuenta fresca sin intervención humana — contra intuición del admin. Manteniéndolo intacto, el email queda en la DB como "quemado" y todo intento futuro de re-registro retorna 410 con el mensaje "escribinos a soporte". Si el admin se equivocó al eliminar, puede restaurar desde OPS (botón existente) y la cuenta vuelve (aunque el Merchant queda REJECTED — re-aprobación manual, también por diseño).

**Archivos modificados:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/admin/users/[id]/delete/route.ts`, `src/app/api/profile/delete/route.ts`, `scripts/cleanup-resurrected-users.ts` (nuevo).

**TS clean.**

### ISSUE-054 — "NO HAY REPARTIDORES DISPONIBLES" sin canal para avisar al usuario
**Estado:** ✅ RESUELTO 2026-04-21 en rama `avisame-driver-disponible`.
**Qué se hizo:**
1. **Schema:** nuevo modelo `DriverAvailabilitySubscription` (id, userId, latitude, longitude, merchantId?, createdAt, expiresAt, notifiedAt?) con relaciones a `User` y `Merchant`. Índices en `userId`, `(notifiedAt, expiresAt)` y `merchantId`. Requiere `npx prisma db push` + `npx prisma generate`.
2. **Endpoint `POST /api/notifications/driver-available-subscribe`:** auth + rate limit 10/min por IP + Zod (lat/lng rangos, merchantId opcional). TTL 4h. Max 3 activas por usuario (429 si se excede). Si ya existe sub activa con mismo user + ubicación a <~100m + mismo merchant, refresca `expiresAt` en vez de duplicar. DELETE con ownership check para cancelar.
3. **Helper `src/lib/driver-availability.ts`:** `notifyAvailabilitySubscribers({driverId, driverLat, driverLng})` busca subs activas (no expiradas, no notificadas, cap 500), filtra por radio 5km con Haversine, y dispara push en chunks de 10 en paralelo. **Idempotencia:** `updateMany({where:{id, notifiedAt: null}})` atómico garantiza que si dos drivers se conectan en simultáneo, solo uno gana la carrera — el otro ve `count: 0` y skipea el push (evita doble notificación). Título: "🏍️ ¡Ya hay repartidor en tu zona!", body: "Entrá al checkout y completá tu pedido antes que vuelva a subir la demanda.", url `/checkout`. Errores se loguean, nunca se propagan.
4. **Trigger en `PUT /api/driver/status`:** antes de update leemos el estado previo de `isOnline`. Después de actualizar PostGIS, SOLO si `wasOffline && driver.isOnline` (transición offline → online), llamamos `notifyAvailabilitySubscribers(...)` fire-and-forget con `.catch()` logging. No se dispara en toggles `DISPONIBLE ↔ OCUPADO` mientras el driver ya estaba online — solo en la conexión real.
5. **UI checkout:** card de "no hay repartidores" rediseñada. CTA primaria "🔔 Avisame cuando haya repartidor" (botón rojo MOOVY, disabled si no hay lat/lng en el address; muestra hint "Completá tu dirección abajo para activar el aviso" si falta). Estado optimistic después del POST: badge verde con check "Te avisamos cuando haya". Texto actualizado: "Suele durar menos de 15 min en esta zona." Botones "Programar para más tarde" y "Retirar en local" quedan como secundarios debajo, separados por border.
**Dónde:** `prisma/schema.prisma`, `src/app/api/notifications/driver-available-subscribe/route.ts`, `src/lib/driver-availability.ts`, `src/app/api/driver/status/route.ts`, `src/app/(store)/checkout/page.tsx`.
**Rate limit + cap de suscripciones:** defiende contra abuso. 3 activas por usuario + TTL 4h auto-expira. Si el buyer cambió de idea o ya pidió por otro canal, tiene DELETE.
**Observabilidad:** helper loguea candidates/notified/errors por ejecución. Si `notified > 0` loguea a nivel `info` con driverId — queda rastro en pino para auditar si un buyer dice "no me llegó".

---

## 🟡 IMPORTANTES reales (afectan experiencia, no bloquean)

### Seguridad / backend

#### ISSUE-010 — Driver se desconecta mid-delivery y el pedido queda huérfano
**Estado:** ✅ RESUELTO 2026-04-21 en rama `fix/driver-offline-mid-delivery`.
**Qué se hizo:** Extendido `src/app/api/cron/retry-assignments/route.ts` con dos queries nuevas (single-vendor + multi-vendor SubOrders) que detectan órdenes en `DRIVER_ASSIGNED` / `DRIVER_ARRIVED` / `PICKED_UP` cuyo driver está `isOnline: false` o con `lastLocationAt` más viejo de 15min. Escala a admin vía socket `driver_offline_mid_delivery` con payload que incluye `orderId`, `orderNumber`, `subOrderId?`, `driverId`, `driverName`, `deliveryStatus`, `minutesOffline`, `driverIsOnline`, `lastLocationAt` — el admin puede contactar al driver o reasignar manualmente. Se eliminó el early return cuando `stuckOrders.length === 0` para que el check de driver offline corra siempre. **No reasignamos automáticamente** porque el driver puede tener el paquete en mano (PICKED_UP) y la reasignación requiere coordinación humana. Constantes: `DRIVER_OFFLINE_THRESHOLD_MINUTES = 15`, `DRIVER_OFFLINE_ACTIVE_STATES = ["DRIVER_ASSIGNED","DRIVER_ARRIVED","PICKED_UP"]`, cap de 50 órdenes por query (una ciudad de 80k hab no debería tener >50 pedidos mid-delivery simultáneos). Socket emite a `admin:<userId>`, `admin:orders` y `admin:drivers` para que cualquier panel pueda renderizar el incidente.

#### ISSUE-015 — Retry cron sin escalación final completa
**Estado:** ✅ RESUELTO 2026-04-21 en rama `retry-cron-escalation`.
**Fix aplicado:** En `src/app/api/cron/retry-assignments/route.ts` se agregó el umbral `AUTO_CANCEL_THRESHOLD = 6` (~30min con cron cada 5min) y la función `autoCancelStuckOrder(order, attempts)` que, cuando `assignmentLogs.length >= 6`: (1) marca Order como `CANCELLED` con `cancelReason = "No conseguimos repartidor disponible para tu pedido"` + `adminNotes` con timestamp y # de intentos, apagando también SubOrders dentro del mismo `$transaction` atómico; (2) restaura stock de todos los items (product o listing); (3) libera `driverId`/`pendingDriverId` y borra `PendingAssignment`; (4) si el pedido era `mercadopago + PAID`, busca `Payment` con `mpStatus: approved` y dispara `createRefund(mpPaymentId)` — on success actualiza `paymentStatus: REFUNDED` + `payment.mpStatus: "refunded"` con detail "Auto-cancelación sin repartidor disponible", on failure emite `refund_failed` a `admin:orders`; (5) llama `reverseOrderPoints(orderId, reason)` (idempotente via `Order.pointsEarned/pointsUsed`) para devolver REDEEM al buyer; (6) otorga bonus compensatorio de `AUTO_CANCEL_BONUS_POINTS = 500` pts via `recordPointsTransaction(userId, "BONUS", 500, description, orderId)`; (7) dispara push `notifyBuyerOrderAutoCancelled(userId, orderNumber, orderId, bonusAwarded, wasRefunded)` — nuevo helper en `src/lib/notifications.ts` con title `😔 No encontramos repartidor`, body dinámico que incluye refund + bonus, tag `order-autocancelled-${orderNumber}` (distinto de `order-cancelled` para que no colapse); (8) emite socket `order_cancelled` con flag `auto: true` a `merchant:${id}`, `admin:orders` y `customer:${userId}`. Además sigue escalando a admin via `notifyAdminOfStuckOrder` con mensaje que incluye refund status + bonus. El loop principal ahora chequea `AUTO_CANCEL_THRESHOLD` ANTES del `MAX_RETRIES` existente — si hay ≥6 intentos auto-cancela, si hay ≥3 escala, si no retry via `startAssignmentCycle`. Cada side-effect (refund, points reverse, bonus, push) va en try/catch porque el `$transaction` ya garantiza el cierre del pedido; los side-effects se loguean y admin los resuelve manualmente. Idempotencia: una vez `CANCELLED`, el `where: { status: "CONFIRMED" }` del query inicial excluye la orden de runs futuros. Response JSON ahora incluye `autoCancelled` count. Scope intencional: single-vendor Orders. Multi-vendor SubOrder auto-cancel queda para fase 2 (requiere lógica de prorrateo de refund parcial que no existe aún).
**Archivos modificados:** `src/app/api/cron/retry-assignments/route.ts`, `src/lib/notifications.ts`.

#### ISSUE-022 — Listings públicas exponen `seller.id` (DIFERIDO con rationale)
**Estado:** 🟢 DIFERIDO — cerrado como "no-op" el 2026-04-20.
**Análisis real:**
1. `SellerProfile.id` es un CUID. No es enumerable por incremento.
2. `ListingCard.tsx` L138, 241, 370 USA `seller.id` para navegar a `/marketplace/vendedor/${id}` — removerlo rompería la UX crítica del marketplace.
3. El select público ya excluye todo campo sensible (userId, mpAccessToken, mpRefreshToken, mpEmail, cuit, bankAlias, bankCbu). Solo expone `displayName`, `rating`, `avatar`, `isVerified` + `sellerAvailability`.
4. `SellerProfile` no tiene slug — no hay URL alternativa.
**Conclusión:** removería UX crítica para mitigar un riesgo teórico (CUIDs no son enumerables y no hay campos siblings sensibles). El issue original reposa en un miedo sin amenaza concreta.
**Acción futura (post-lanzamiento):** si se detecta abuso real (ej: scraping masivo), considerar agregar `slug` a `SellerProfile` y migrar las URLs.

### Asignación / logística

#### ISSUE-013 — Aviso push "tu repartidor está cerca"
**Estado:** ✅ RESUELTO (rama `feat/push-repartidor-cerca`, 2026-04-21)
**Qué pasa:** El sistema emite `posicion_repartidor` por socket y el mapa actualiza, pero no hay push cuando el driver cruza <300m del destino. Con PIN de entrega (ISSUE-001 ✅ resuelto), es crítico que el comprador esté con el teléfono a mano.
**Fix implementado:** Campo `nearDestinationNotified Boolean @default(false)` en Order y SubOrder. Helper `src/lib/driver-proximity.ts` chequea distancia en cada GPS update del driver y si <300m hace `updateMany WHERE flag: false` atómico — si gana la carrera dispara push via `notifyBuyerDriverNear` con recordatorio del PIN. Multi-vendor soportado (cada SubOrder es independiente). Fire-and-forget desde `PUT /api/driver/location` para no bloquear el update GPS.
**Esfuerzo:** S (3-4 horas — incluye campo en Order, check en location handler, template de push).

#### ISSUE-014 — Smart batching multi-vendor sin validación de capacidad de vehículo
**Estado:** ✅ RESUELTO (rama `feat/batch-capacity-check`, 2026-04-21)
**Qué pasaba:** En `startSubOrderAssignmentCycle`, el loop de batching combinaba `[itemCategories, ...siblingItems]` en cada iteración — ignoraba los siblings ya aceptados en iteraciones previas. Si 3 SubOrders cabían individualmente con la original, las 3 terminaban batcheadas aunque juntas excedieran la capacidad (bug silencioso que sólo se manifestaba con 3+ vendedores cercanos y volúmenes medianos).
**Fix implementado:** Acumulador `accumulatedItems` que arranca con los items originales y crece con cada sibling aceptado. En cada iteración se calcula `calculateOrderCategory([...accumulatedItems, ...siblingItems])` — el check de capacidad siempre refleja el TOTAL real que el driver debe cargar. Doble guardia: (a) si `combinedCategory.allowedVehicles` queda vacío → skip (capacidad excedida), (b) si la intersección con `subOrderCategory.allowedVehicles` queda vacía → skip (evita cambiar silenciosamente la clase de vehículo buscada). Logs con `combinedScore` y `batchedCount` para observabilidad.
**Esfuerzo:** S (2-3 horas).

### UX / visibilidad

#### ISSUE-036 — Home: la misma tienda aparece 4 veces en distintas secciones
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `src/app/(store)/page.tsx` — nueva función `applyDiversityRule()` con prioridad Populares → Mejor calificados → Nuevos. Cada fila excluye merchants ya tomados por filas anteriores. Filas con <2 merchants se ocultan. Si <3 merchants activos en total, se ocultan TODAS las filas curadas (la fila principal "Abiertos ahora" sigue mostrando todo). Cada fila tiene conditional render si queda vacía.

#### ISSUE-037 — Dashboard comercio: contador de progreso aún con 2 números distintos
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `OnboardingChecklist.tsx` — contador unificado usa `{completedRequired}/{requiredSteps.length}` en todos los lugares. Los opcionales se listan abajo pero no suman al contador principal.

#### ISSUE-038 — Dashboard comercio: chip "Abierto" verde cuando la tienda está cerrada
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `src/app/comercios/(protected)/page.tsx` — chip tri-estado que combina `approvalStatus` + check de onboarding (docs/schedule/productos/dirección, misma lógica que `/api/merchant/onboarding`) + `checkMerchantSchedule` (pausa manual + horario real). Estados: "Pendiente" (gris), "Cerrada" (rojo con subtítulo: pausada manualmente / abre [día] [hora] / fuera de horario), "Abierta" (verde).

#### ISSUE-039 — Formato de moneda US en driver dashboard
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** Nuevo helper `src/lib/format.ts` con `formatARS(n)` y `formatPriceARS(n)` usando `Intl.NumberFormat("es-AR")` con formatters cacheados. Barrido en `src/app/repartidor/(protected)/dashboard/page.tsx`, `rider/views/HistoryView.tsx`, `rider/views/EarningsView.tsx`, `rider/ShiftSummaryModal.tsx`, `home/FavoritesCarousel.tsx` — todos los `.toLocaleString()` sin locale migrados.

#### ISSUE-041 — Detalle de producto: no muestra nombre del comercio visible en la UI
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `ProductDetailClient.tsx` — chip del comercio visible en mobile (junto a categoría) con link a su detalle, y subtítulo "Vendido por [merchant]" bajo el título del producto. En desktop, chip de comercio junto a la categoría.

#### ISSUE-042 — Sin breadcrumbs en flujos multi-paso
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `ProductDetailClient.tsx` — breadcrumb desktop "Inicio › Categoría › Comercio › Producto" con `aria-current="page"` en el último. Mobile usa el chip de comercio + subtítulo "Vendido por" como equivalente no-wrap. (Resuelto en compound con ISSUE-041 porque ambos tocan el header del detalle.)

#### ISSUE-043 — Tachado verde sobre items completados se lee como "eliminado"
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `OnboardingChecklist.tsx` — reemplazado `line-through decoration-green-300` por `opacity-70`. Texto verde + ícono ✓ + opacidad se lee como completado, no eliminado.

#### ISSUE-044 — Eliminar dirección: solo `confirm()` nativo, sin check si es la única
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `src/app/(store)/mi-perfil/direcciones/page.tsx` — reemplazado `confirm()` nativo por el `ConfirmModal` global vía `confirm()` promise API (store/confirm). Si `addresses.length === 1`, se bloquea con modal warning "No podés quedarte sin direcciones — Agregá otra antes de eliminarla". Modal de confirmación con variant danger incluye la dirección completa en el mensaje. Added `aria-label` al botón y toast.success post-delete.

#### ISSUE-045 — Puntos: progress bar al próximo nivel y explicación del valor
**Estado:** ✅ RESUELTO (rama `feat/ux-flujo-checkout-y-onboarding`, 2026-04-20)
**Fix aplicado:** `/api/points/route.ts` ahora expone `userLevel` usando la función canónica `getUserLevel(userId)` de `src/lib/points.ts` (Biblia v3: MOOVER/SILVER/GOLD/BLACK por pedidos DELIVERED últimos 90 días) con `ordersInWindow`, `nextLevel`, `ordersToNextLevel`. `/puntos/page.tsx` Hero Card muestra ícono + nombre del nivel real (no más `"🚀 MOOVER"` hardcodeado) + progress bar dorada con "X pedidos (90 días) — Faltan N para 🥈 SILVER" (o "Nivel máximo alcanzado" si BLACK). Bloque destacado "Cómo funcionan tus puntos" entre Hero y código de referido con 3 columnas (Valor 1pt=$1 / Mínimo 500 pts / Máximo 20% subtotal) leyendo `pointsConfig` del backend (no hardcoded — Biblia Financiera como fuente de verdad). Pie dinámico: "Ya podés canjear" si `balance >= minPointsToRedeem`, si no "Te faltan N pts". Accesibilidad: role=progressbar + aria-valuenow/min/max + aria-label.

#### ISSUE-047 — Portal vendedor: toggle "Cerrado / No recibo pedidos" con semántica ambigua
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** Portal vendedor usa el mismo lenguaje en todos los touchpoints: dashboard muestra badge "Abierta a ventas" / "Cerrada a ventas" por listing y stat card "Abiertas a ventas". Listings page stats usan "Abiertas a ventas" / "Cerradas a ventas". Semántico al vendedor: es disponibilidad al comprador, no un estado técnico "Activa/Inactiva".

#### ISSUE-055 — Breadcrumb checkout: nombres y los 3 activos al mismo tiempo
**Estado:** ✅ RESUELTO (rama `fix/checkout-breadcrumb-y-tour-buyer`, 2026-04-21)
**Fix aplicado:** Checkout rediseñado a 3 tabs **Entrega → Pago → Confirmar** con un solo activo por paso. Breadcrumb superior con `CheckCircle` en pasos completados, círculo gris con número en pendientes, y `aria-current="step"` en el activo. Step 1 Entrega: método (home/pickup) + dirección + ¿cuándo? (Inmediata/Programada + TimeSlotPicker). Step 2 Pago: PointsWidget + radio Efectivo/MP. Step 3 Confirmar: resumen con cards editables de dirección, tipo entrega, método de pago, puntos — botón final "Confirmar Pedido". Ver `src/app/(store)/checkout/page.tsx`.

#### ISSUE-056 — Paso "Confirmar" mezcla tipo de entrega con método de pago
**Estado:** ✅ RESUELTO (rama `fix/checkout-breadcrumb-y-tour-buyer`, 2026-04-21)
**Fix aplicado:** El bloque "¿Cuándo querés recibirlo?" (Inmediata vs Programada + `TimeSlotPicker`) se movió al paso Entrega junto al método (home/pickup) y la dirección — es una decisión del "cuándo" de la logística, no del pago. Step Pago quedó con solo `PointsWidget` + radio Efectivo/MP. Resuelto en el mismo commit que ISSUE-055.

#### ISSUE-059 — Resumen de checkout no desglosa costo de envío
**Estado:** ✅ RESUELTO (rama `fix/ux-pulido-pre-launch`, 2026-04-20)
**Fix aplicado:** `src/app/(store)/checkout/page.tsx` — desglose siempre visible: Subtotal + método de entrega (Retiro en local GRATIS / Envío a domicilio · vendor con valor o "Ingresá tu dirección" si aún no hay cálculo) + Descuento (Puntos MOOVER) + Total. Multi-vendor muestra una línea por comercio. "GRATIS" en verde para envío sin costo.

### Negocio / onboarding

#### ISSUE-012 — Navegación: sin breadcrumbs en checkout y accesos faltantes
**Estado:** ✅ RESUELTO (rama `feat/home-accesos-favorito`, 2026-04-21) — breadcrumb checkout resuelto previamente por ISSUE-055; accesos directos a favoritos y puntos desde la home cerrados en esta rama.
**Fix aplicado:** Nuevo componente `src/components/home/QuickAccessRow.tsx` (Server Component) insertado en `src/app/(store)/page.tsx` entre `HomeFeed` y `CategoryGrid` — la posición más alta del home después del hero/filtros, máxima descubribilidad. 2 cards lado a lado en mobile-first (`grid-cols-2`): **Favoritos** (gradiente rose/red + corazón MOOVY rojo en círculo) → `/mi-perfil/favoritos`, **Puntos MOOVER** (gradiente amber/orange + estrella amber) → `/puntos`. Logueado: UNA query a `User { pointsBalance, _count.favorites }` con `select` explícito → subtítulos dinámicos ("3 guardados · Entrá rápido a ellos", "1.250 pts · Canjealos en tu próxima compra"). Deslogueado: CTAs genéricos ("Iniciá sesión y tenelos siempre a mano", "Sumá con cada pedido · 10 pts por cada $1.000") con `href` `/login?redirect=<destino>`. Textos dinámicos por cardinalidad (0 / 1 / N+). Try/catch alrededor de la query — si falla, cae silenciosamente al estado deslogueado (home nunca se rompe por este widget). Envuelto en `AnimateIn animation="reveal"` para match del resto del home.
**Motivo:** Favoritos no tenía acceso directo desde ningún lado (estaba enterrado en /mi-perfil/favoritos); Puntos ya tenía desde BottomNav y AppHeader pero gana un segundo punto de entrada con contexto (balance visible = señal de personalización).

#### ISSUE-020 — Comisión mes 1 (0%) vs mes 2+ (8%): criterio de "mes" no documentado
**Estado:** ✅ RESUELTO (rama `feat/ux-flujo-checkout-y-onboarding`, 2026-04-20)
**Fix aplicado:** Criterio canónico "30 días corridos desde `Merchant.createdAt`" en `src/lib/merchant-loyalty.ts` (constante `FIRST_MONTH_FREE_DAYS=30` + 3 helpers `isInFirstMonthFree`, `getFirstMonthFreeEndDate`, `getFirstMonthFreeDaysRemaining`). `getEffectiveCommission()` aplica precedencia `commissionOverride > first-month-free (0%) > tier > fallback 8%`. Fix bug crítico pre-existente: path multi-vendor de `/api/orders/route.ts` leía `merchant.commissionRate` crudo en vez de `getEffectiveCommission()` (bypassaba mes gratis y lealtad). Single-vendor cambiado de `||` a `??`. Dashboard merchant (`comercios/(protected)/page.tsx`) muestra banner esmeralda "Tu primer mes en MOOVY: 0% — quedan X días — vence DD/MM/AAAA". `comercios/pendiente-aprobacion/page.tsx` muestra promesa. `MerchantLoyaltyWidget` con banner forward-compat. Script `scripts/test-first-month-free.ts` con 12+ asserts (funciones puras + integración Prisma real con 5 escenarios: BRONCE nuevo, DIAMANTE nuevo, override, BRONCE vencido, DIAMANTE vencido).

#### ISSUE-021 — Onboarding vacío para buyer nuevo
**Estado:** ✅ RESUELTO (rama `fix/checkout-breadcrumb-y-tour-buyer`, 2026-04-21)
**Fix aplicado:** Schema: `User.onboardingCompletedAt DateTime?` (requiere `npx prisma db push` + `npx prisma generate`). Endpoint `/api/onboarding` con `GET` (devuelve `{ shouldShow: boolean }`) y `POST` (marca completado con `new Date()`, idempotente). Componente `src/components/onboarding/BuyerOnboardingTour.tsx` — cliente, 3 slides full-screen con backdrop, íconos lucide + gradientes de marca: (1) "Bienvenido a MOOVY" (qué es: comercios locales Ushuaia, pago instantáneo al comercio, repartidores que conocen la ciudad), (2) "Pedir es fácil" (cómo: elegís → confirmación del comercio → retiro → tracking real-time), (3) "Tenés puntos de bienvenida" (valor: activación al primer pedido DELIVERED, 10pts por $1k, 1pt = $1, referidos suman). UI: sheet desde abajo en mobile, modal centrado en desktop. Navegación: dots clickeables para ir a cualquier slide, "Siguiente"/"Empezar a explorar" en la última, botón "Saltar" en cualquier momento (también marca como completado). Backdrop bloqueado (scroll body lockeado mientras está visible). Optimistic close con flag en `localStorage` (`moovy_onboarding_done_<userId>`) para prevenir re-mostrar si el POST falla por red. Montado en `src/app/(store)/layout.tsx`, se self-gatea vía `useSession` (solo authenticated) + `GET /api/onboarding`.
**Decisión:** tour NO se dispara al registrarse — se dispara al primer render del store layout post-login. Esto cubre tanto al usuario que se registra y aterriza en home, como al usuario que migró y nunca había visto el tour. El flag `onboardingCompletedAt` es permanente (no hay "reset tour" en el perfil por ahora — agregarlo es trivial si se necesita más adelante).

---

## ✅ Críticos resueltos (evidencia contra código, audit 2026-04-20)

| Issue | Resolución | Evidencia |
|-------|------------|-----------|
| ISSUE-001 PIN doble de entrega | ✅ Resuelto 2026-04-17 | `src/lib/pin.ts`, `src/lib/pin-verification.ts`, state machine en `driver/orders/[id]/status/route.ts` L56-86, panel `/ops/fraude`, `feat/pin` mergeado |
| ISSUE-002 Esconder subastas | ✅ Resuelto | `src/app/vendedor/(protected)/listings/page.tsx` L162, 197, 322 comentan auction flow como "reactivar Fase 2" |
| ISSUE-003 Autocompra (SELF_PURCHASE) | ✅ Resuelto | `src/app/api/orders/route.ts` L574-592 con throw `SELF_PURCHASE`, L1238 handler |
| ISSUE-005 Webhook MP sin reconciliación | ✅ Resuelto | `src/app/api/cron/mp-reconcile/route.ts` existe, 10min cron |
| ISSUE-006 Puntos antes de DELIVERED | ✅ Resuelto 2026-04-15 | `awardOrderPointsIfDelivered` en `src/lib/points.ts:401`, llamada desde driver status route L156. `reverseOrderPoints` en L462 usado en cancel/reject/refund |
| ISSUE-007 State machine driver con skip | ✅ Resuelto | `src/app/api/driver/orders/[id]/status/route.ts` L89-94 secuencia estricta DRIVER_ASSIGNED → DRIVER_ARRIVED → PICKED_UP → DELIVERED |
| ISSUE-008 Delivery fee fallback del cliente | ✅ Resuelto | `src/app/api/orders/route.ts` L186-258 retorna error en vez de usar fee del cliente |
| ISSUE-033 `/moover` crash | ✅ Resuelto | `next.config.ts` L170-173 redirect 301 a `/puntos` |
| ISSUE-034 Comercio "Sin conexión" sin fallback | ✅ Resuelto | `src/app/comercios/(protected)/pedidos/page.tsx` tiene 5s grace period, REST polling fallback 10s, botón reconnect (L162, 179, 256, 312, 441-460) |
| ISSUE-035 `/pedidos` y `/perfil` 404 | ✅ Resuelto | `next.config.ts` L174-183 redirects a `/mis-pedidos` y `/mi-perfil` |
| ISSUE-052 Post-checkout redirect a `/productos` | ✅ Resuelto | `src/app/(store)/checkout/page.tsx` L523 `router.push(\`/mis-pedidos/${orderId}\`)` |
| ISSUE-053 Puntos regalados al crear orden | ✅ Resuelto con ISSUE-006 | `orders/route.ts` ya no otorga EARN al crear; solo se otorga en DELIVERED vía `awardOrderPointsIfDelivered` |

---

## ✅ Importantes resueltos (evidencia, audit 2026-04-20)

| Issue | Evidencia |
|-------|-----------|
| ISSUE-017 Input direcciones sin regex | Resuelto 2026-04-20. `src/app/api/profile/addresses/route.ts` + `[id]/route.ts` ahora validan con Zod + regex unicode `/^[\p{L}\p{N}\s.,#\-/()°º'ª]+$/u` + max 150. Rechaza `<`, `>`, `{`, `}`, backticks, `$`, `&`, comillas. |
| ISSUE-018 `dangerouslySetInnerHTML` emails OPS sin sanitizar | Resuelto 2026-04-20. `src/app/ops/(protected)/emails/page.tsx` L505+ envuelve con `DOMPurify.sanitize()` con whitelist de tags HTML-email (a, table, tr, td, img, style, etc.) y atributos seguros. |
| ISSUE-019 Socket `track_order` sin ownership | Resuelto 2026-04-20. `scripts/socket-server.ts` — handler ahora hace `prisma.order.findUnique` con userId + driver.userId + merchant.ownerId + subOrders (multi-vendor). Solo entran buyer/merchant/driver/seller o ADMIN. Valida typeof + length del orderId. |
| ISSUE-022 Listings exponen seller.id | Diferido con rationale (ver arriba). CUIDs no enumerables + UX dependiente + sin campos siblings sensibles. |
| ISSUE-009 Multi-vendor doble contabilidad comisión | `orders/route.ts` L398 `moovyCommission = 0` por default, L402 condiciona cálculo a `if (merchantId)` singular. Multi-vendor pone `merchantId: null` y usa SubOrder commissions. No hay doble contabilidad. |
| ISSUE-011 fitBounds resetea viewport | `src/components/orders/OrderTrackingMiniMap.tsx` L348 `preserveViewport: true` |
| ISSUE-016 Refund OPS no revierte puntos | `src/app/api/ops/refund/route.ts` L89-90 llama `reverseOrderPoints(orderId, reason)` |
| ISSUE-023 `/api/search/autocomplete` sin rate limit | `src/app/api/search/autocomplete/route.ts` L7 `applyRateLimit(request, "autocomplete", 60, 60_000)` |
| ISSUE-040 Detalle comercio sin horario visible | `src/app/(store)/store/[slug]/page.tsx` L6, 150, 169 importa y usa `MerchantScheduleWidget` |
| ISSUE-046 Bottom nav "MOOVER" vs `/puntos` | Redirect existe en `next.config.ts`. Inconsistencia de marca/ruta es preferencia, no bug. |
| ISSUE-057 Carrito "Comercio" genérico | `src/app/(store)/carrito/page.tsx` L72 muestra `{group.vendorName}` real |
| ISSUE-058 Badge del carrito desync | `src/store/cart.ts` L191 `items.reduce((sum, item) => sum + item.quantity, 0)` — contador derivado correcto |

---

## 🟢 MENORES — Pulir post-lanzamiento (sin cambios desde 2026-04-15)

### ISSUE-024 — Puntos: transacción sin `isolationLevel: Serializable`
**Estado:** ✅ RESUELTO (rama `fix/menores-seguridad`, 2026-04-21)
**Fix aplicado:** `recordPointsTransaction` en `src/lib/points.ts` ahora corre con `{ isolationLevel: "Serializable" }`. Si dos tabs gastan puntos en simultáneo, una de las transacciones falla con P2034 y se reintenta hasta 3 veces con backoff lineal (50/100/150ms). Después de 3 intentos retorna `false` (caller decide). Constantes `POINTS_TX_MAX_RETRIES=3` y `POINTS_TX_RETRY_BASE_MS=50`.

### ISSUE-025 — GPS polling 10s sin throttle por batería
**Estado:** ✅ RESUELTO (rama `fix/menores-merchant-driver`, 2026-04-21)
**Fix aplicado:** Modo ahorro GPS automático. (1) `src/hooks/useGeolocation.ts` ahora acepta `{ lowPower?: boolean }` como opción. Cuando `lowPower: true`, `watchPosition` usa `enableHighAccuracy: false` (usa red celular/wifi en vez del hardware GPS — ~50mW menos de consumo sostenido) y `maximumAge: 30000` (acepta lecturas cacheadas hasta 30s en vez de 10s). Precisión baja de ~5m a ~50m — aceptable para el mini-mapa y para el geofence del PIN (tolerancia 100m + gracia 50m). (2) En el dashboard del driver (`src/app/repartidor/(protected)/dashboard/page.tsx`) se computa `lowPowerGps = battery.supported && battery.level < 0.15 && !battery.charging` y se pasa al hook. El hook re-ejecuta el `watchPosition` cuando cambia la opción (no hay setOptions en la API del navegador). (3) El polling fallback del dashboard también se duplica: de 30s a 60s cuando `lowPowerGps`. El socket sigue empujando refresh real-time, así que el polling es solo fallback — bajar frecuencia acá no degrada UX. (4) Toast one-shot informativo al driver la primera vez que entra a modo ahorro: "Batería baja — activamos modo ahorro GPS (ubicación menos precisa) para que sigas trabajando más tiempo." (persistido vía `useRef` para no re-disparar si el nivel oscila alrededor del umbral).

### ISSUE-026 — `DriverLocationHistory` cleanup cron sin alerta si falla
**Estado:** ✅ RESUELTO (rama `fix/menores-data-ops`, 2026-04-22)
**Fix aplicado:** Healthcheck de crons genérico con registro persistente + alertas en dashboard OPS. (1) Schema: nuevo modelo `CronRunLog` (id/jobName/startedAt/completedAt/success/durationMs/itemsProcessed/errorMessage) con índices `[jobName, startedAt]` y `[jobName, success, completedAt]`. Requiere `npx prisma db push && npx prisma generate` post-merge. (2) `src/lib/cron-health.ts` (nuevo): wrapper `recordCronRun(jobName, fn)` que crea la row ANTES de correr `fn`, captura éxito/error/duración/items y actualiza al final. Soporta shape `{ result, itemsProcessed }` para tomar el count explícito si el caller lo retorna, o usa la forma plana. Re-throwea el error original para no ocultar fallas al caller. (3) Config canónica en el mismo archivo: `CRON_EXPECTATIONS` es un `Record<jobName, { maxHours, label }>` — arrancamos con `"cleanup-location-history": { maxHours: 30, label: "Limpieza de historial GPS" }`. Para registrar un nuevo cron: wrap con `recordCronRun` + agregar entrada aquí. Zero changes al dashboard — se pinta automático. (4) `getCronsHealthSummary()` devuelve un array `CronHealth[]` con status derivado de 4 valores: `healthy` (último success dentro de `maxHours`), `stale` (último success hace más de `maxHours` → warning), `failing` (último intento terminó con `success: false` → danger), `never-ran` (jamás se registró → danger). Dos queries paralelas por cron (último success + último intento cualquiera) para distinguir "stale porque falló" de "stale porque nunca corrió en este deploy". (5) `src/app/api/cron/cleanup-location-history/route.ts` envuelve `prisma.driverLocationHistory.deleteMany` en `recordCronRun("cleanup-location-history", async () => { ...; return { result: del, itemsProcessed: del.count }; })`. **Defense in depth**: el `verifyBearerToken` se validó ANTES del `recordCronRun` — así intentos no autorizados (attackers probando `CRON_SECRET`) no ensucian el healthcheck con runs spurios. (6) `src/app/ops/(protected)/dashboard/page.tsx` importa `getCronsHealthSummary()` con `.catch(() => [])` (safe fallback si la tabla aún no existe pre-migración). Loop sobre los crons no-healthy empuja entradas al array `alerts` con mensaje diferenciado por status: `failing` → "Cron X falló en su último intento: <error>" (danger), `stale` → "Cron X no corre hace Yh (esperado cada Zh)" (warning), `never-ran` → "Cron X nunca se ejecutó — revisar configuración del runner" (danger). Link a `/ops/configuracion-logistica`. **Regla nueva**: para agregar un nuevo cron al healthcheck → (a) envolver su handler con `recordCronRun`, (b) agregar una entrada a `CRON_EXPECTATIONS` con `maxHours` + `label`. Zero code en el dashboard. El patrón es reusable por retry-assignments, cart-recovery, merchant-loyalty-daily, etc.

### ISSUE-027 — Timing attack en validación de reset-password token
**Estado:** ✅ RESUELTO (rama `fix/menores-seguridad`, 2026-04-21)
**Fix aplicado:** Defense in depth: (1) `forgot-password/route.ts` ahora hashea el token con `sha256` antes de guardarlo en `User.resetToken` — el plaintext SOLO viaja por email. Si la DB se filtra, los tokens activos no sirven al atacante. (2) `reset-password/route.ts` hashea el token recibido, busca al user por hash + expiry > now, y luego hace `crypto.timingSafeEqual` sobre los hashes (defensa en profundidad ante side channels residuales del WHERE clause de Prisma — cache, B-tree lookups). Helper `timingSafeEqualHex` con guard de longitud + try/catch alrededor de `Buffer.from(.., "hex")`. **Pendiente operativo**: tokens activos previos al deploy (max 1h de vida) dejan de funcionar — los users que los reciban deben pedir un nuevo reset. Aceptable porque son ≤5 personas en la ventana de deploy.

### ISSUE-028 — Estados vacíos sin componente unificado
**Estado:** ✅ RESUELTO (rama `fix/menores-ux-buyer`, 2026-04-21)
**Fix aplicado:** Nuevo componente `src/components/ui/EmptyState.tsx` con props `icon`, `title`, `description`, `primaryCta`, `secondaryCta`, `tone` (`neutral`/`brand`/`marketplace`) y `size` (`sm`/`md`/`lg`). Internamente soporta `href` (Link) y `onClick` (button). Accesibilidad: `role="status" aria-live="polite"`. Migradas las 3 superficies de mayor impacto: `favoritos/page.tsx` (estado global + per-tab `EmptyTab` helper con CTA mapeado por tab), `mis-pedidos/page.tsx` (tabs "En curso" / "Historial" con CTAs diferenciados), y el empty state `totalProducts === 0` de `store/[slug]/page.tsx`. Regla nueva: todo estado vacío DEBE tener al menos un CTA — un empty sin CTA es dead-end.

### ISSUE-029 — "1 vendido" en listings puede ser falso
**Estado:** ✅ RESUELTO (rama `fix/menores-data-ops`, 2026-04-22)
**Fix aplicado:** El contador `soldCount` ahora excluye auto-compras del propio seller. Limitación de Prisma: `_count: { select: { orderItems: { where: {...} } } }` no puede referenciar campos del registro padre (el `userId` del seller en el Listing), así que no hay forma de filtrar "excluir items cuyo `Order.userId` coincida con el `SellerProfile.userId` del padre" en una sola query Prisma. (1) Nuevo helper `src/lib/listing-counts.ts` exporta `getSoldCountsExcludingAutoPurchases(listingIds: string[]): Promise<Map<string, number>>` con una sola query `$queryRaw` que hace JOIN `OrderItem → Order → Listing → SellerProfile` con filtro `o."userId" <> sp."userId"` y `GROUP BY oi."listingId"`. Retorna `Map<listingId, count>` para O(1) lookup. Short-circuit a `new Map()` si el array de IDs está vacío (evita `IN ()` inválido). Una sola query batch sin importar cuántos listings. (2) `src/app/api/listings/route.ts`: removido `orderItems` del `_count` (solo queda `favorites`), fetch del map después del `findMany`, reemplazado `soldCount: _count?.orderItems || 0` por `soldCount: soldCountMap.get(listing.id) || 0`. (3) `src/app/api/listings/featured/route.ts`: mismo patrón — eliminado el `_count` que solo tenía `orderItems`, soldCount viene del map. (4) `src/app/(store)/marketplace/vendedor/[id]/page.tsx`: mismo patrón — el detail del seller ahora muestra el contador real (sin sus propias compras) aún cuando el seller mismo usa la plataforma como comprador. **Regla nueva**: cualquier contador de "N vendidos" / "N favoritos" / "N pedidos" que se exponga al público DEBE auditar el self-reference case — ¿puede el dueño del registro inflarlo auto-referenciándose? Si sí, excluirlo via raw query o filtro explícito. Confiar en `_count` implícito de Prisma oculta este bug.

### ISSUE-030 — "2 publicaciones, 10 categorías" en header marketplace es engañoso
**Estado:** ✅ RESUELTO (rama `fix/menores-ux-buyer`, 2026-04-21)
**Fix aplicado:** En `marketplace/page.tsx` se agregó flag `showHardStats = heroTotal >= 10` (constante `SHOW_STATS_COUNTS_AT = 10`). Si supera el umbral, stats row conserva los dos contadores (publicaciones + categorías) + badge de compra protegida. Si no, cae a un copy suave: ícono `Users` + "Publicaciones de vecinos" + badge de compra protegida. Evita que en early-stage (5 publicaciones reales, 18 categorías seed vacías) el header transmita "plataforma vacía". Los números aparecen solos cuando hay volumen real para mostrar.

### ISSUE-031 — Merchant dashboard sin alerta "primer pedido"
**Estado:** ✅ RESUELTO (rama `fix/menores-merchant-driver`, 2026-04-21)
**Fix aplicado:** Push especial al merchant en su primer pedido. (1) Schema: nuevo campo `Merchant.firstOrderWelcomeSentAt DateTime?` — flag one-shot que garantiza que el push solo se dispara una vez por merchant (requiere `npx prisma db push && npx prisma generate` post-merge). (2) `src/lib/notifications.ts` nueva función `notifyMerchantFirstOrderWelcome(merchantId, orderNumber, total)` que manda push al owner con title "🎉 ¡Tu primer pedido en MOOVY!" y body "Pedido X por $Y. Confirmalo, preparalo y entregalo — te guiamos paso a paso desde el panel." Tag `merchant-welcome-${merchantId}` para no colapsar con push de "nuevo pedido" regular. (3) Helper local `tryNotifyMerchantFirstOrderWelcome` en `src/app/api/orders/route.ts` usa el patrón atómico `updateMany WHERE firstOrderWelcomeSentAt = null` + `count === 1` (mismo patrón que ISSUE-054 y ISSUE-013) — si dos orders llegan casi simultáneas, solo una gana la carrera de DB y dispara el push. (4) Se invoca `tryNotifyMerchantFirstOrderWelcome(merchantId, order.orderNumber, order.total)` en los 4 sites donde se persiste la orden: flujo MP (loop `groups` + single-merchant fallback) y flujo Cash (loop `groups` + single-merchant fallback). Fire-and-forget — si falla el push no rompe el flujo de creación. Defensa in depth: el flag se setea ANTES de intentar el push, así aún si el push falla, nunca hay doble disparo del "primer pedido".

### ISSUE-032 — Costa Susana: verificar bloqueo real en checkout
**Estado:** ✅ RESUELTO (rama `fix/menores-data-ops`, 2026-04-22)
**Fix aplicado:** Sistema de zonas excluidas completamente configurable desde OPS (ninguna zona hardcoded en código). (1) `src/lib/excluded-zones.ts` (nuevo): define la interfaz `ExcludedZone` (id/name/lat/lng/radiusKm/reason/active/createdAt/updatedAt) + helpers `parseExcludedZones(raw)` (defensa: JSON malformado → array vacío), `getExcludedZone(lat, lng, zones)` (O(n) con Haversine, primer match activo) y `validateZoneInput(input)` (validación de rangos: name 1-50 chars, lat/lng en [-90,90]/[-180,180], radiusKm 0.1-3km, reason 1-200 chars). (2) Persistencia: nuevo campo `StoreSettings.excludedZonesJson String?` que guarda el array completo como JSON. Se eligió campo único sobre una tabla propia porque Ushuaia tendrá <20 zonas razonablemente — el overhead de una tabla con FK + índices compensa cuando llegue a 100+. Requiere `npx prisma db push && npx prisma generate` post-merge. (3) Endpoints `GET/POST /api/ops/settings/excluded-zones` (listar + crear con UUID + timestamps) y `PATCH/DELETE /api/ops/settings/excluded-zones/[id]` (editar campos individuales + soft toggle `active` o hard delete). Auth: admin-only. Rate limit: 30/60s para mutaciones. (4) Panel OPS `/ops/zonas-excluidas` (`ExcludedZonesClient.tsx`, client component 28.5KB): tabla responsive con cards mobile + tabla desktop; modal de creación/edición con **mini-mapa Google Maps** que permite arrastrar marker + ajustar radio con slider (visualización del círculo en tiempo real); toggle `active` inline en cada row; campos "razón" editable (se muestra al buyer en checkout). Accesible desde el sidebar OPS sección Operaciones. (5) Integración en el flow de pedido (defense in depth): (a) `src/app/api/delivery/calculate/route.ts` lee `StoreSettings.excludedZonesJson`, parsea, y si el destino cae en alguna zona activa retorna **`409 { errorCode: "ZONE_EXCLUDED", zoneName, reason }`** — el checkout muestra la razón directo al buyer sin código técnico. (b) `src/app/api/orders/route.ts` re-valida server-side antes de crear la orden por si el frontend se saltó el check (ej: request directo a la API). Doble gate garantiza que NINGÚN pedido hacia zona excluida se llegue a crear. **Decisión**: Costa Susana ya no está hardcoded — el admin la configura desde OPS. Esto cubre casos futuros (cortes de ruta temporales, barrios con inseguridad, etc.) sin tocar código. **Regla nueva**: parámetros configurables de logística/operaciones DEBEN vivir en `StoreSettings` + OPS UI, no en constantes del código. Si un admin necesita tocar un código para activar/desactivar algo operativo, el sistema está mal diseñado.

### ISSUE-048 — Home comprador: dos barras de búsqueda
**Estado:** ✅ RESUELTO (rama `fix/menores-ux-buyer`, 2026-04-21)
**Fix aplicado:** En desktop el home mostraba simultáneamente el botón rojo de búsqueda del hero (`HomeHero`) Y el input central del `AppHeader`. En mobile ya estaba bien resuelto vía el evento custom `moovy:hero-search-visibility` que emitía el IntersectionObserver del hero. Se extendió ese mismo patrón al desktop: el wrapper del input central del header ahora se oculta con transición `opacity/visibility/pointer-events-none` cuando `isHomepage && heroSearchVisible`, más `aria-hidden` y `tabIndex={-1}` en el input para accesibilidad cuando está invisible. En páginas internas (`/tiendas`, `/marketplace`, detalles, etc.) el header conserva su buscador — la regla aplica solo en home.

### ISSUE-049 — Tienda: categoría "Otros (2)" cuando solo hay 2 productos
**Estado:** ✅ RESUELTO (rama `fix/menores-ux-buyer`, 2026-04-21)
**Fix aplicado:** En `store/[slug]/page.tsx` se agregó constante `FLAT_LIST_THRESHOLD = 5` y flag `useFlatList = totalProducts > 0 && totalProducts < FLAT_LIST_THRESHOLD`. Cuando es true, el componente renderiza una grilla plana con todos los productos (sin pills de categoría sticky, sin headers por categoría, sin contadores per-section). Cuando es false, conserva el layout agrupado con tabs y headers. Las category pills solo aparecen si hay más de una categoría (`!useFlatList && categories.length > 1`). El empty state (`totalProducts === 0`) migrado al `<EmptyState>` unificado con ícono `ShoppingBag` y CTA "Ver otros comercios" → `/tiendas`. Evita el patrón "Otros (2)" que se lee experimental cuando el merchant recién arranca.

### ISSUE-050 — "Facturado hoy $0 · Max $0" confunde
**Estado:** ✅ RESUELTO (rama `fix/menores-merchant-driver`, 2026-04-21)
**Fix aplicado:** En `src/app/ops/(protected)/dashboard/page.tsx` las 3 sub-líneas secundarias de las stat cards ahora se renderean condicionalmente: `{stats.revenueMonth > 0 && <p>Mes: ${formatPrice(stats.revenueMonth)}</p>}`, `{stats.ordersYesterday > 0 && <p>Ayer: {stats.ordersYesterday}</p>}`, `{stats.deliveredToday > 0 && <p>Entregados hoy: {stats.deliveredToday}</p>}`. Cuando no hay datos reales (día 1 pre-launch), las líneas de comparación contra otros periodos se omiten en vez de mostrar "$0" o "0" — evita que el panel OPS transmita "plataforma vacía" al admin mientras todavía no hay actividad. Mismo principio que ISSUE-030 (hide hard counters below threshold): mostrar números duros solo cuando hay señal de actividad real.

### ISSUE-051 — Portal repartidor: $1,235 sin info de zona, vehículo ni batería
**Estado:** ✅ RESUELTO (rama `fix/menores-merchant-driver`, 2026-04-21)
**Fix aplicado:** Strip superior agregado al dashboard del driver (`src/app/repartidor/(protected)/dashboard/page.tsx`) ARRIBA del stats grid (Ganancias Hoy / Completados) y DEBAJO del bloque "Buscando ofertas". Contiene 3 chips separados por divisores verticales: (1) **GPS** — ícono MapPin verde si `location?.latitude` está definido + label "Activo", ícono amber + label "Sin señal" en caso contrario. Ayuda al driver a detectar rápidamente si tiene problemas de permisos/GPS antes de aceptar ofertas. (2) **Vehículo** — emoji del vehículo (🏍️ MOTO / 🚲 BIKE / 🚗 CAR / 🚙 TRUCK) vía `vehicleTypeIcon()` + label normalizado con `vehicleTypeToSpanish()` (helpers de `src/lib/vehicle-type-mapping.ts`). Confirma que está usando el vehículo correcto — importante si tiene permisos para varios. (3) **Batería** — usa el hook `useBattery()` existente. Verde (≥30%) / Amber (≤30%) / Rojo (≤15%) — o ícono Zap cuando está cargando. Label muestra porcentaje + "⚡" si carga. Si el navegador no soporta Battery API, muestra "—". **Decisión**: "zona" no se incluyó porque no existe un helper automático lat/lng → A/B/C en el codebase — los multiplicadores zonales se aplican en delivery fee pero no hay detección de zona por coordenadas. Se reemplazó por GPS status que es más operativamente útil para el driver. Endpoint `/api/driver/dashboard` ahora también devuelve `vehicleType` para alimentar el chip.

---

## Pre-lanzamiento final (paquete operativo)

Sin cambios respecto a la versión 2026-04-17:

### PL-001 — Reset total de data transaccional (el día antes del lanzamiento)
Script `scripts/pre-launch-reset.ts` que:
- Backup `pre-launch-backup-YYYYMMDD.sql.gz` antes de tocar nada
- Confirmación interactiva (escribir `RESET-LANZAMIENTO`)
- Guard crítico: abortar si NODE_ENV prod + >1 usuario no-admin + orders DELIVERED reales
- Preserva: `MoovyConfig`, `PointsConfig`, `StoreSettings`, `DeliveryRate`, `MerchantLoyaltyConfig`, categorías, advertisement packages, admin OPS
- Borra: `User` (excepto admin), `Merchant`, `Driver`, `SellerProfile`, `Product`, `Listing`, `Order`, `SubOrder`, `Payment`, `MpWebhookLog`, `PendingAssignment`, `AssignmentLog`, `DriverLocationHistory`, `Rating`, `Review`, `PointsTransaction`, `Referral`, `Favorite`, `Coupon`, `Notification`, `PushSubscription`, `SupportTicket`, `ChatMessage`, `SavedCart`, `AuditLog`
- Post: ejecuta `prisma/seed-production.ts` y `validate-ops-config.ts`

**Esfuerzo:** 3-4 horas. Este ISSUE-004 se cierra cuando PL-001 esté escrito y testeado en local.

### PL-002 — Ambiente de staging separado (post-lanzamiento semana 1)
DB + subdominio separados. MP sandbox en staging. Script `sync-prod-to-staging.ts` con anonimización.
**Esfuerzo:** 1 día.

### PL-003 — Backups automáticos diarios con retención
Cron 3AM con `pg_dump | gzip` → storage externo. Retención rolling 30d/12m/3y. Script `test-backup-restore.ts` mensual.
**Esfuerzo:** 4-6 horas.

### PL-004 — Script de limpieza quirúrgica post-lanzamiento
Reemplazo de PL-001 una vez con data real. Subcomandos `soft-delete-user --id`, `soft-delete-listing`, etc. Dry-run por default.
**Esfuerzo:** 1 día.

---

## Estimación actualizada

| Categoría | Issues reales | Días de trabajo |
|-----------|---------------|-----------------|
| Críticos abiertos | 1 (ISSUE-004/PL-001 — data cleanup) | 1 día |
| Importantes abiertos | 19 (de los cuales varios son XS/S) | 6-9 días |
| Menores | 16 | 4-6 días (post-lanzamiento) |
| **Pre-lanzamiento mínimo viable** | **ISSUE-004 + 4-5 importantes de seguridad** | **1-2 días** |

### Priorización para lanzar (mínimo viable)

**Día 1 (1 día de trabajo):**
1. ~~ISSUE-017 XSS direcciones — Zod regex (1h)~~ ✅ Resuelto 2026-04-20
2. ~~ISSUE-018 Sanitizar dangerouslySetInnerHTML emails OPS (1h)~~ ✅ Resuelto 2026-04-20
3. ~~ISSUE-019 Socket rooms ownership (2h)~~ ✅ Resuelto 2026-04-20
4. ~~ISSUE-022 Remover seller.id (30min)~~ 🟢 Diferido con rationale 2026-04-20
5. ISSUE-038 Chip "Abierto" con estado real (1h)
6. ISSUE-043 Quitar line-through (15min)

**Día 2 (1 día de trabajo):**
7. ~~ISSUE-054 Botón "avisame cuando haya driver"~~ ✅ RESUELTO 2026-04-21
8. ~~ISSUE-010 Driver offline mid-delivery en cron~~ ✅ RESUELTO 2026-04-21

**Día del lanzamiento:**
9. ISSUE-004 PL-001 reset total ejecutado en prod
10. Smoke test de los 4 flujos end-to-end
11. Abrir las puertas

Todo el resto (ISSUE-013, 014, 020, 021, 036, 037, 039, 041, 042, 044, 045, 047, 055, 056, 059 + los 16 menores) se puede cerrar en las 2-3 semanas post-lanzamiento con el producto ya en vivo.

---

## Validación obligatoria antes de deploy

Para cualquier cambio que toque dinero, asignación o parámetros configurables:
- `npx tsx scripts/validate-ops-config.ts` (bloquea si hay errores)
- `npx tsx scripts/test-pin-verification.ts` (11 tests de PIN)
- Smoke test manual de los 4 flujos

---

## Cambios desde versión anterior (2026-04-15)

Audit contra código real del 2026-04-20 descubrió que **12 de 13 críticos y 8 de 30 importantes ya estaban resueltos** en ramas mergeadas entre el 2026-04-15 y el 2026-04-17 pero nunca se actualizó el ISSUES.md. Los issues resueltos mueven a la tabla "Críticos/Importantes resueltos" con evidencia file:line. Las estimaciones bajan de 21-30 días a 2-3 días para lanzar, + 1-2 semanas de pulido post-lanzamiento.

**Regla nueva:** al cerrar una rama que resuelve un issue de ISSUES.md, actualizar este archivo en el mismo commit. El audit descoordinado de la semana del 2026-04-17 dejó el archivo reportando miedo injustificado.
