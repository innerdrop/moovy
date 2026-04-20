# Moovy — Issues pre-lanzamiento

**Última actualización:** 2026-04-20 (audit full contra código real — rama `docs/audit-estado-real`)
**Versión anterior:** 2026-04-15 (audit inicial + UX pass + checkout e2e)

Este archivo es la fuente única de verdad del estado real pre-lanzamiento. Antes del audit del 2026-04-20 la lista estaba seriamente desactualizada: muchos issues marcados como 🔴 CRÍTICOS abiertos ya estaban resueltos desde hacía semanas (PIN doble, autocompra, reconciliación MP, state machine driver, delivery fee fallback, redirects, etc.). La nueva versión refleja lo que realmente queda.

---

## Resumen ejecutivo — dónde estamos

**Críticos reales restantes: 1** (data cleanup manual — ISSUE-004 via script PL-001 pre-lanzamiento).
**Críticos parciales: 1** (ISSUE-054 mensaje "sin repartidores" — tiene mensaje y programar, falta "avisame cuando haya driver").
**Importantes reales restantes: 19** (principalmente UX + polish + 3 de seguridad no-urgentes).
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
**Estado:** 🔴 ABIERTO
**Qué pasa:** `retry-assignments` cron solo busca `status: "CONFIRMED"` + `driverId: null`. Una orden en `PICKED_UP` con driver offline >15min no se reasigna ni alerta.
**Fix:** Agregar query adicional en el cron que busque órdenes en `PICKED_UP` con driver offline y escale a admin + ofrezca reasignación.
**Esfuerzo:** S (2-3 horas).

#### ISSUE-015 — Retry cron sin escalación final completa
**Estado:** 🟡 PARCIAL — el cron SÍ escala a admin después de 3 intentos (`notifyAdminOfStuckOrder`), pero NO cancela, NO hace refund automático, NO da puntos bonus al comprador.
**Fix:** Cuando `assignmentLogs.length >= MAX_RETRIES * 2`, cancelar orden con razón "No hay repartidores disponibles", disparar refund MP (si fue pagado), notificar buyer + otorgar bonus $500 pts.
**Esfuerzo:** M (1 día).

#### ISSUE-017 — Input de direcciones sin regex validation
**Estado:** 🔴 ABIERTO
**Qué pasa:** `src/app/api/profile/addresses/route.ts` acepta `label`, `street`, `neighborhood`, etc. con solo `trim()` y check de vacío. Sin Zod schema ni regex que bloquee `<`, `>`, `{`, `}`, backticks.
**Impacto:** XSS stored si alguna vista los mete en `dangerouslySetInnerHTML` (ej: template email sin sanitizar).
**Fix:** Agregar Zod schema con `z.string().trim().max(100).regex(/^[\w\sñáéíóúÑÁÉÍÓÚ.,#\-°º]+$/)` en POST y PATCH.
**Esfuerzo:** S (1 hora).

#### ISSUE-018 — `dangerouslySetInnerHTML` en panel de emails OPS sin sanitizar
**Estado:** 🔴 ABIERTO
**Dónde:** `src/app/ops/(protected)/emails/page.tsx` L517 — `dangerouslySetInnerHTML={{ __html: selectedEmail.html }}`.
**Fix:** Envolver con `DOMPurify.sanitize(selectedEmail.html, { ALLOWED_TAGS: [...] })`. Templates son editados por admin, pero una variable del comprador sin escapar = XSS stored al admin.
**Esfuerzo:** S (1 hora).

#### ISSUE-019 — Socket.IO `track_order` sin validación de ownership
**Estado:** 🔴 ABIERTO
**Dónde:** `scripts/socket-server.ts` L259-262 — `socket.on("track_order", orderId => socket.join(\`order:${orderId}\`))` sin validar que el user sea buyer/merchant/driver/admin de esa orden.
**Impacto:** Un usuario curioso puede escuchar updates de ubicación de otros drivers.
**Fix:** Antes de `socket.join(...)`, query `Order.findUnique({ where: { id }, select: { userId, merchantId, driverId } })` y validar contra `socket.data.userId/merchantId/driverId` o `role === "ADMIN"`.
**Esfuerzo:** S (1-2 horas).

#### ISSUE-022 — Listings públicas exponen `seller.id`
**Estado:** 🔴 ABIERTO
**Dónde:** `src/app/api/listings/route.ts` L67-88 — el `include` de seller tiene `id: true`.
**Impacto:** No es IDOR directo pero facilita enumeración y ataques dirigidos a sellers.
**Fix:** Remover `id: true` del select de seller en endpoints públicos. Mantener solo `displayName`, `rating`, `avatar`, `isVerified`. Usar `slug` si hace falta URL.
**Esfuerzo:** S (30 min).

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
**Estado:** 🔴 ABIERTO
**Qué pasa:** "La Estancia" aparece en "Abiertos ahora", "Nuevos en MOOVY", "Los más pedidos" y "Mejor calificados". En launch week con pocos comercios, transmite pobreza de oferta.
**Fix:** Regla de diversidad — si <3 comercios totales, mostrar una sola sección "Comercios en Moovy". Si ≥3, garantizar que cada sección tenga 2+ comercios distintos y ningún merchant aparezca en 2+ secciones. Ocultar "Los más pedidos" si no hay data.
**Esfuerzo:** M (4-6 horas).

#### ISSUE-037 — Dashboard comercio: contador de progreso aún con 2 números distintos
**Estado:** 🟡 PARCIAL — ya no son 3 (5/7, 5/8, 5/9). Ahora son 2: en `OnboardingChecklist.tsx` L93 `{completedTotal}/{allSteps.length}` y L129 `({completedRequired}/{requiredSteps.length})`. Siguen siendo dos números distintos en la misma vista.
**Fix:** Unificar en uno solo — "5 de 7 requisitos obligatorios". Los opcionales se listan abajo pero no cuentan en el contador principal.
**Esfuerzo:** S (30 min).

#### ISSUE-038 — Dashboard comercio: chip "Abierto" verde cuando la tienda está cerrada
**Estado:** 🔴 ABIERTO
**Dónde:** `src/app/comercios/(protected)/page.tsx` L64-66 — `{merchant.isOpen ? "Abierto" : "Cerrado"}` usando solo `merchant.isOpen`, ignora el estado de onboarding incompleto.
**Fix:** Tres estados posibles: "Pendiente" (gris, requisitos incompletos o approvalStatus !== APPROVED), "Cerrada" (rojo, cumple requisitos pero merchant la cerró manualmente), "Abierta" (verde, lista).
**Esfuerzo:** S (1 hora).

#### ISSUE-039 — Formato de moneda US en driver dashboard
**Estado:** 🟡 PARCIAL — algunos lugares ya usan es-AR, pero `src/app/repartidor/(protected)/dashboard/page.tsx` L1049 sigue con `${displayedEarnings.toLocaleString()}` sin locale.
**Fix:** Auditar TODOS los `.toLocaleString()` en el proyecto, envolver en helper central `formatARS(n)` que use `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.
**Esfuerzo:** S (1-2 horas para barrido completo).

#### ISSUE-041 — Detalle de producto: no muestra nombre del comercio visible en la UI
**Estado:** 🔴 ABIERTO (el merchant está en el JSON-LD para SEO, pero no se renderiza visible al usuario).
**Fix:** Bajo el precio, chip clickeable: "De La Estancia · 30-45 min" con link al detalle del comercio.
**Esfuerzo:** S (1 hora).

#### ISSUE-042 — Sin breadcrumbs en flujos multi-paso
**Estado:** 🔴 ABIERTO
**Fix:** Breadcrumb "Inicio > La Estancia > Coca Cola" en desktop. En mobile, subtítulo clickeable con nombre del comercio bajo el título del producto.
**Esfuerzo:** S (2-3 horas).

#### ISSUE-043 — Tachado verde sobre items completados se lee como "eliminado"
**Estado:** 🔴 ABIERTO
**Dónde:** `OnboardingChecklist.tsx` L156, 193 — `step.completed ? "text-green-700 line-through decoration-green-300"`.
**Fix:** Quitar `line-through`. Mantener texto verde + ícono ✓ + opacidad 70% para diferenciar.
**Esfuerzo:** XS (15 min).

#### ISSUE-044 — Eliminar dirección: solo `confirm()` nativo, sin check si es la única
**Estado:** 🟡 PARCIAL — `/mi-perfil/direcciones/page.tsx` L94 tiene `confirm("¿Estás seguro...")`. Falta: modal custom bonito + bloqueo si es la única dirección del user.
**Fix:** Reemplazar `confirm()` por `<ConfirmModal>`. Si `addresses.length === 1`, deshabilitar el tacho y mostrar "Reemplazar" / "Editar" en su lugar.
**Esfuerzo:** S (1-2 horas).

#### ISSUE-045 — Puntos: progress bar al próximo nivel y explicación del valor
**Estado:** 🟡 PARCIAL — `/puntos/page.tsx` ya menciona "5 pedidos en 90 días" para SILVER y "15 pedidos en 90 días" para GOLD. Falta: bloque explicativo del valor ("1 punto = $1, mínimo 500, max 20%") destacado + progress bar visual hacia el siguiente nivel.
**Fix:** Agregar bloque destacado bajo el balance con la regla de canje. Progress bar con el % completado al próximo nivel.
**Esfuerzo:** M (3-4 horas).

#### ISSUE-047 — Portal vendedor: toggle "Cerrado / No recibo pedidos" con semántica ambigua
**Estado:** 🔴 ABIERTO (sin verificar en detalle, pero el issue visual sigue).
**Fix:** Un único label grande dependiendo del estado: "Abierto a ventas" (verde) / "Cerrado a ventas" (rojo). Switch visualmente subordinado al estado.
**Esfuerzo:** S (1 hora).

#### ISSUE-055 — Breadcrumb checkout: nombres y los 3 activos al mismo tiempo
**Estado:** 🔴 ABIERTO
**Fix:** 3 tabs con un solo activo por paso: **Entrega** → **Pago** → **Confirmar**. Renombrar y reordenar.
**Esfuerzo:** M (2-3 horas).

#### ISSUE-056 — Paso "Confirmar" mezcla tipo de entrega con método de pago
**Estado:** 🔴 ABIERTO — depende de ISSUE-055.
**Fix:** Mover "Tipo de entrega (Inmediata/Programada)" al paso Entrega. Dejar Pago con solo puntos, cupón, efectivo/MP.
**Esfuerzo:** incluido en ISSUE-055.

#### ISSUE-059 — Resumen de checkout no desglosa costo de envío
**Estado:** 🔴 ABIERTO
**Fix:** Siempre desglosar: Subtotal, Envío (con valor y método), Descuentos (puntos/cupones), Total. Transparencia de precio es valor fundacional de Moovy.
**Esfuerzo:** S (1-2 horas).

### Negocio / onboarding

#### ISSUE-012 — Navegación: sin breadcrumbs en checkout y accesos faltantes
**Estado:** 🔴 ABIERTO — ver ISSUE-055 (breadcrumb checkout) + accesos a favoritos y puntos desde home.
**Esfuerzo:** incluido en ISSUE-055 + S (1 hora) para accesos.

#### ISSUE-020 — Comisión mes 1 (0%) vs mes 2+ (8%): criterio de "mes" no documentado
**Estado:** 🔴 ABIERTO
**Fix:** Definir en código y Biblia: "30 días corridos desde `Merchant.createdAt`". Exponer en dashboard del merchant ("Tu período sin comisión vence el DD/MM/AAAA"). Test unitario con 3 fechas borde.
**Esfuerzo:** S (2-3 horas).

#### ISSUE-021 — Onboarding vacío para buyer nuevo
**Estado:** 🔴 ABIERTO
**Fix:** Tour opcional de 3 pantallas al primer login: (1) qué es Moovy, (2) cómo pedir, (3) tus puntos de bienvenida. Guardar flag `onboardingCompletedAt` en User.
**Esfuerzo:** M (1 día).

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
1. ISSUE-017 XSS direcciones — Zod regex (1h)
2. ISSUE-018 Sanitizar dangerouslySetInnerHTML emails OPS (1h)
3. ISSUE-019 Socket rooms ownership (2h)
4. ISSUE-022 Remover seller.id (30min)
5. ISSUE-038 Chip "Abierto" con estado real (1h)
6. ISSUE-043 Quitar line-through (15min)

**Día 2 (1 día de trabajo):**
7. ISSUE-054 Botón "avisame cuando haya driver" (4-6h)
8. ISSUE-010 Driver offline mid-delivery en cron (2-3h)

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
