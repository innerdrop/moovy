# Moovy — Issues pre-lanzamiento

**Última actualización:** 2026-04-20 (bundle UX pulido pre-launch: ISSUE-036, 037, 038, 039, 041, 042, 043, 044, 047, 059 resueltos — rama `fix/ux-pulido-pre-launch`)
**Versión anterior:** 2026-04-20 (bundle seguridad: ISSUE-017, 018, 019 resueltos; ISSUE-022 diferido con rationale)

Este archivo es la fuente única de verdad del estado real pre-lanzamiento. Antes del audit del 2026-04-20 la lista estaba seriamente desactualizada: muchos issues marcados como 🔴 CRÍTICOS abiertos ya estaban resueltos desde hacía semanas (PIN doble, autocompra, reconciliación MP, state machine driver, delivery fee fallback, redirects, etc.). La nueva versión refleja lo que realmente queda.

---

## Resumen ejecutivo — dónde estamos

**Críticos reales restantes: 1** (data cleanup manual — ISSUE-004 via script PL-001 pre-lanzamiento).
**Críticos parciales: 1** (ISSUE-054 mensaje "sin repartidores" — tiene mensaje y programar, falta "avisame cuando haya driver").
**Importantes reales restantes: 5** (principalmente backend/logística; 10 de UX pulido + 3 de seguridad urgentes + el diferido se cerraron el 2026-04-20).
**Menores: 16** (post-lanzamiento).

La buena noticia: **todos los críticos que tenían riesgo de dinero, fraude o datos ya están resueltos** (PIN doble, autocompra, reconciliación MP, state machine driver, delivery fee fallback, puntos post-DELIVERED, subastas ocultas, redirects rotos, post-checkout redirect). El código está en un estado sólido para lanzar.

Lo que queda bloqueante es la decisión operativa de ISSUE-004 (limpiar data de prueba) + el detalle de ISSUE-054 (UX del "sin repartidores"). Ambos se pueden cerrar en 1 día de trabajo.

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

### ISSUE-054 — "NO HAY REPARTIDORES DISPONIBLES" sin canal para avisar al usuario
**Estado:** 🟡 PARCIAL — el checkout ya tiene mensaje cálido + botón "Programar tu entrega". Falta:
- Botón "Avisame cuando haya repartidor" → push cuando `Driver.isOnline=true` en la zona
- Texto que indique que suele durar <15 min
**Severidad:** crítico en ciudad chica — este mensaje en 3 pedidos seguidos hace desinstalar.
**Dónde:** `src/app/(store)/checkout/page.tsx` L570-600 (sección de mensaje cuando no hay drivers).
**Esfuerzo:** M (4-6 horas) — UI + endpoint `POST /api/notifications/driver-available-subscribe` + check en assignment engine cuando un driver va online.

---

## 🟡 IMPORTANTES reales (afectan experiencia, no bloquean)

### Seguridad / backend

#### ISSUE-010 — Driver se desconecta mid-delivery y el pedido queda huérfano
**Estado:** ✅ RESUELTO 2026-04-21 en rama `fix/driver-offline-mid-delivery`.
**Qué se hizo:** Extendido `src/app/api/cron/retry-assignments/route.ts` con dos queries nuevas (single-vendor + multi-vendor SubOrders) que detectan órdenes en `DRIVER_ASSIGNED` / `DRIVER_ARRIVED` / `PICKED_UP` cuyo driver está `isOnline: false` o con `lastLocationAt` más viejo de 15min. Escala a admin vía socket `driver_offline_mid_delivery` con payload que incluye `orderId`, `orderNumber`, `subOrderId?`, `driverId`, `driverName`, `deliveryStatus`, `minutesOffline`, `driverIsOnline`, `lastLocationAt` — el admin puede contactar al driver o reasignar manualmente. Se eliminó el early return cuando `stuckOrders.length === 0` para que el check de driver offline corra siempre. **No reasignamos automáticamente** porque el driver puede tener el paquete en mano (PICKED_UP) y la reasignación requiere coordinación humana. Constantes: `DRIVER_OFFLINE_THRESHOLD_MINUTES = 15`, `DRIVER_OFFLINE_ACTIVE_STATES = ["DRIVER_ASSIGNED","DRIVER_ARRIVED","PICKED_UP"]`, cap de 50 órdenes por query (una ciudad de 80k hab no debería tener >50 pedidos mid-delivery simultáneos). Socket emite a `admin:<userId>`, `admin:orders` y `admin:drivers` para que cualquier panel pueda renderizar el incidente.

#### ISSUE-015 — Retry cron sin escalación final completa
**Estado:** 🟡 PARCIAL — el cron SÍ escala a admin después de 3 intentos (`notifyAdminOfStuckOrder`), pero NO cancela, NO hace refund automático, NO da puntos bonus al comprador.
**Fix:** Cuando `assignmentLogs.length >= MAX_RETRIES * 2`, cancelar orden con razón "No hay repartidores disponibles", disparar refund MP (si fue pagado), notificar buyer + otorgar bonus $500 pts.
**Esfuerzo:** M (1 día).

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
**Estado:** 🔴 ABIERTO
**Qué pasa:** El sistema emite `posicion_repartidor` por socket y el mapa actualiza, pero no hay push cuando el driver cruza <300m del destino. Con PIN de entrega (ISSUE-001 ✅ resuelto), es crítico que el comprador esté con el teléfono a mano.
**Fix:** En el handler de ubicación del driver, si `distancia_al_destino < 300m` y flag `nearDestinationNotified === false`, disparar push al buyer con el deliveryPin recordado + marcar flag.
**Esfuerzo:** S (3-4 horas — incluye campo en Order, check en location handler, template de push).

#### ISSUE-014 — Smart batching multi-vendor sin validación de capacidad de vehículo
**Estado:** 🟡 PARCIAL — el assignment engine sí maneja `packageCategory` y `volumeScore` (ver `src/lib/assignment-engine.ts`). Falta validar explícitamente en el path de batching multi-vendor que la suma de volumen cabe en el vehículo antes de asignar el mismo driver a 2 comercios cercanos.
**Fix:** En `startSubOrderAssignmentCycle`, antes de batchar, sumar `volumeScore` de ambas SubOrders y comparar contra capacidad del vehículo del driver candidato.
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
**Estado:** 🟡 PARCIAL — breadcrumb checkout resuelto por ISSUE-055. Falta solo: accesos directos a favoritos y puntos desde la home.
**Esfuerzo:** S (1 hora) para los accesos restantes.

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
Race condition teórico si usuario gasta puntos desde 2 tabs simultáneas. Fix: agregar `{ isolationLevel: "Serializable" }` al `$transaction` en `src/lib/points.ts`.

### ISSUE-025 — GPS polling 10s sin throttle por batería
Driver puede quedarse sin batería mid-entrega. Fix: si `navigator.getBattery().level < 0.15`, aumentar intervalo a 30s y mostrar aviso.

### ISSUE-026 — `DriverLocationHistory` cleanup cron sin alerta si falla
Si el cron de cleanup no corre, la tabla crece sin límite. Fix: healthCheck en dashboard OPS que avise si `lastRun > 24h`.

### ISSUE-027 — Timing attack en validación de reset-password token
Comparación probablemente con `===`. Fix: `crypto.timingSafeEqual()`.

### ISSUE-028 — Estados vacíos sin componente unificado
Varias pantallas muestran listas vacías sin CTA. Fix: componente `<EmptyState icon title cta />` reutilizable.

### ISSUE-029 — "1 vendido" en listings puede ser falso
Contador `timesSold` incluye ventas de la propia cuenta del seller. Al tener ISSUE-003 resuelto, recalcular ahora es seguro.

### ISSUE-030 — "2 publicaciones, 10 categorías" en header marketplace es engañoso
Ocultar contadores hasta tener volumen, o decir "Publicaciones de vecinos".

### ISSUE-031 — Merchant dashboard sin alerta "primer pedido"
Al recibir primer pedido, no hay aviso especial. Fix: Check `merchant.totalOrders === 0` al crear orden → notificación con guía de 3 pasos.

### ISSUE-032 — Costa Susana: verificar bloqueo real en checkout
Confirmar que `/api/delivery/calculate` rechaza con error claro.

### ISSUE-048 — Home comprador: dos barras de búsqueda
Simplificar a una sola (hero en home, header en páginas internas).

### ISSUE-049 — Tienda: categoría "Otros (2)" cuando solo hay 2 productos
Mostrar lista sin filtro si <5 productos.

### ISSUE-050 — "Facturado hoy $0 · Max $0" confunde
Ocultar "Max" hasta tener datos.

### ISSUE-051 — Portal repartidor: $1,235 sin info de zona, vehículo ni batería
Agregar strip superior con estos 3 datos.

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
| Críticos abiertos | 1 completo (ISSUE-004/PL-001) + 1 parcial (ISSUE-054) | 1 día |
| Importantes abiertos | 19 (de los cuales varios son XS/S) | 6-9 días |
| Menores | 16 | 4-6 días (post-lanzamiento) |
| **Pre-lanzamiento mínimo viable** | **ISSUE-004 + ISSUE-054 + 4-5 importantes de seguridad** | **2-3 días** |

### Priorización para lanzar (mínimo viable)

**Día 1 (1 día de trabajo):**
1. ~~ISSUE-017 XSS direcciones — Zod regex (1h)~~ ✅ Resuelto 2026-04-20
2. ~~ISSUE-018 Sanitizar dangerouslySetInnerHTML emails OPS (1h)~~ ✅ Resuelto 2026-04-20
3. ~~ISSUE-019 Socket rooms ownership (2h)~~ ✅ Resuelto 2026-04-20
4. ~~ISSUE-022 Remover seller.id (30min)~~ 🟢 Diferido con rationale 2026-04-20
5. ISSUE-038 Chip "Abierto" con estado real (1h)
6. ISSUE-043 Quitar line-through (15min)

**Día 2 (1 día de trabajo):**
7. ISSUE-054 Botón "avisame cuando haya driver" (4-6h)
8. ~~ISSUE-010 Driver offline mid-delivery en cron (2-3h)~~ ✅ RESUELTO 2026-04-21

**Día del lanzamiento:**
9. ISSUE-004 PL-001 reset total ejecutado en prod
10. Smoke test de los 4 flujos end-to-end
11. Abrir las puertas

Todo el resto (ISSUE-012, 013, 014, 020, 021, 036, 037, 039, 041, 042, 044, 045, 047, 055, 056, 059 + los 16 menores) se puede cerrar en las 2-3 semanas post-lanzamiento con el producto ya en vivo.

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
