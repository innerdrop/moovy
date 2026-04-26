# Moovy — Tareas pendientes
Score: 99/100 | P0: 1 (ISSUE-004 cleanup pre-launch) | P1: 1 (auth bloqueo+reset) | P2: 5
Última actualización: 2026-04-25 (sprint pre-launch — 6 ramas chicas cerradas en una jornada post-deploy)

## Cambio 2026-04-25 — Sprint pre-launch ronda final (6 ramas en una jornada)

### Contexto

Después del deploy del 2026-04-24 con DB limpia (vía `scripts/clean-db-pre-launch.ts`), Mauro empezó a testear E2E en producción y reportó múltiples cosas para pulir antes del lanzamiento. Se trabajó con el patrón **"una rama chica por feature, script de validación obligatorio, build local antes del deploy"**. Después de varios deploys fallidos por TS errors no detectables sin `next build` local, se estandarizó el flujo: `npx prisma generate ; npx next build` antes de cualquier `devmain.ps1`.

### 6 ramas mergeadas (orden cronológico)

#### 1. `auto-refresh-rol-aprobado` — JWT refresh post-aprobación

Cuando admin aprobaba un comercio/driver/seller, el JWT del user en su browser seguía con los roles viejos. El usuario tenía que hacer logout+login para entrar a su panel — fricción inaceptable post-aprobación. Solución: socket event `roles_updated` emitido desde 6 puntos (4 endpoints approve/reject + 2 helpers de auto-activación por docs) + nuevo componente `RoleUpdateListener` montado en `Providers.tsx` que dispara `useSession.update({refreshRoles:true})` (el JWT callback ya soportaba esto desde el rediseño de roles del 2026-04-10). Toast diferenciado por tono + redirect automático al portal después de 1.5s.

**Archivos:** nuevos `src/lib/role-change-notify.ts` + `src/components/auth/RoleUpdateListener.tsx` + `scripts/validate-role-refresh.ts`. Modificados: `Providers.tsx`, 4 endpoints admin approve/reject, 2 helpers de auto-activación.

#### 2. `fix/comercio-onboarding-completo` — banner registro + checklist hide + aprobación digital/física + logo obligatorio

4 cambios relacionados al onboarding:

- **Banner registro merchant**: caja azul "Podés completar la documentación más tarde" en `/comercio/registro` paso 3, con lista de los 7 requisitos (CUIT, CBU/Alias, Constancia AFIP, Habilitación Municipal, Registro Sanitario si food, Logo, Horarios).
- **Checklist auto-hide**: `OnboardingChecklist` se oculta cuando `canOpenStore=true` (antes esperaba `isComplete` que requería MP recomendado, prácticamente nunca se ocultaba).
- **Aprobación OPS digital/física**: schema agrega `<doc>ApprovalSource` + `<doc>ApprovalNote` para los 5 docs Merchant + 8 docs Driver. Cuando admin aprueba PHYSICAL exige nota mín 5 chars (auditoría AAIP). El doc queda APPROVED sin URL — admin recibió el papel/email/whatsapp.
- **Logo obligatorio**: `approveMerchantTransition` y `approveDriverTransition` validan `Merchant.image` / `User.image` antes de marcar APPROVED. Throw `code: LOGO_MISSING` / `PHOTO_MISSING` que los endpoints catchean → 400. Auto-activación por docs respeta el bloqueo.

**Schema:** 26 campos nuevos (`<doc>ApprovalSource` + `<doc>ApprovalNote` × 5 docs Merchant + 8 docs Driver). Requiere `npx prisma db push && npx prisma generate` post-merge — `devmain.ps1 -SchemaOnly` lo hace solo en producción.

#### 3. `ops-upload-logo-merchant` — admin sube logo + checklist usa status APPROVED + nota física visible

Hotfix de la rama anterior + dos extras del mismo dominio:

- **Admin sube logo**: nuevo endpoint `PATCH /api/admin/merchants/[id]/logo` + sub-componente `MerchantLogoAdmin` en `/ops/usuarios/[id]`. Caso real: comercio entrega logo en USB/WhatsApp y admin lo carga sin loguearse como él. Reusa `<ImageUpload>` existente, audita `MERCHANT_LOGO_UPDATED_BY_ADMIN`.
- **Bug crítico de UX**: `/api/merchant/onboarding` chequeaba `Boolean(merchant.cuit)` para `hasCuit` etc., excluyendo aprobaciones físicas. Cambiado a `merchant.cuitStatus === "APPROVED"` para los 5 docs. Sin esto, los merchants veían "Te falta CUIT" indefinidamente aunque el admin ya hubiera aprobado físicamente.
- **UI nota física visible**: OPS ve caja amarilla "Aprobación física — nota del admin" cuando `approvalSource === PHYSICAL` (recordatorio para auditoría) + chip dice "APPROVED · físico". UI Merchant en `/comercios/configuracion` muestra banner verde "Aprobado por administrador — recibimos este documento fuera del sistema" en lugar del upload + sin botón "Solicitar cambio" (no hay nada que reemplazar).

**Endpoint admin `users-unified/[id]` extendido** para devolver los nuevos campos source/note del merchant.

#### 4. `wording-publico-no-ops` — reemplazar "OPS" por "el equipo de Moovy"

OPS es jerga interna y exponerla erosiona la marca + confunde al user. Reemplazo único: "el equipo de Moovy" con variantes naturales según contexto ("revisado por", "la va a resolver", "Respuesta del equipo:" en historiales, "Comentario del equipo:" en emails).

**5 archivos modificados (12 reemplazos):** `SettingsForm.tsx` (7 toasts/textos del merchant), `ProfileView.tsx` (5 toasts/textos del driver), 2 endpoints `change-request/route.ts` (mensajes de error 409), `email.ts` (2 emails de change request resolved).

**NO se tocó:** comentarios de código (internos), `src/app/ops/**`, `src/components/ops/**`, `src/lib/email-admin-ops.ts`, paths URL `/ops/...`.

Script `scripts/validate-no-ops-public.ts` con regex que filtra comentarios y reporta cualquier mención a "OPS" en strings de texto user-facing.

#### 5. `fix/driver-profile-decrypt-cuit` — decrypt CUIT del driver + encrypt en update

Bug visible: el campo CUIT/CUIL del panel del driver mostraba el ciphertext hex `9dadd36061412e5816f0a4ed` en lugar del valor legible. Causa: `GET /api/driver/profile` devolvía `driver.cuit` directo desde Prisma sin pasar por `decryptDriverData()`. Fix: 1 import + wrap del response.

**Bug latente adicional encontrado en la auditoría:** `POST /api/driver/documents/update` guardaba el CUIT en DB sin cifrar — cualquier driver que actualizaba su CUIT desde el panel quedaba con plaintext en `Driver.cuit`, violando convención AAIP. Resuelto en la misma rama agregando `encryptDriverData(updateData)` antes del `prisma.driver.update`.

**No requiere migración de datos:** `decrypt()` es defensivo (devuelve plaintext as-is si no tiene formato cifrado) y `encryptIfNeeded` es idempotente.

#### 6. `fix/modales-aprobacion-docs` — modal Moovy reemplaza window.confirm/prompt

Bug visual: el flujo de aprobación de doc usaba 3 pop-ups nativos del browser ("localhost:3000 says") — feos, sin marca, default engañoso (cancelar = digital), nota en `prompt()` separado.

**Fix:** nuevo componente `src/components/ops/DocApprovalModal.tsx` con diseño Moovy (~210 líneas):
- 2 cards radio explícitos: Digital (ya subido) / Físico (papel/email/whatsapp).
- Si elige Físico: textarea con contador live (5-500 chars).
- Botón Aprobar deshabilitado hasta validación OK.
- Diseño coherente con `ConfirmModal`: backdrop blur, card blanca, rojo MOOVY en CTA, animación, focus management, cierre con Escape.

**Refactor de handlers:** antes ~70 líneas duplicadas entre `handleApproveDocument` (merchant) y `handleApproveDriverDocument` (driver) — ahora ~30 líneas, cada handler solo abre el modal con state local; un único callback `submitApprovalDecision` compartido entre ambos dispara el fetch al endpoint correspondiente según el `entity` del approvalModal.

### Sprint stats

- **Ramas mergeadas:** 6
- **Archivos tocados:** ~30 (15 nuevos + 15 modificados)
- **Scripts de validación nuevos:** 6 en `scripts/validate-*.ts`
- **Campos nuevos en schema:** 26 (`<doc>ApprovalSource` + `<doc>ApprovalNote` × 13 docs)
- **TS clean en cada rama, build local pasó antes de cada deploy.**

### Pendiente para próxima sesión

- **Rama #3 del plan:** `fix/auth-bloqueo-y-reset` — warning "te quedan X intentos" antes de bloqueo + fix botón "Desbloquear cuenta" en OPS (no funciona) + auditoría reset password (token único, rate limit forgot-password, mensaje genérico anti email-enumeration, validación strength).
- **Rama #4:** `fix/producto-multifoto-carousel` — bug visible: producto con 3+ fotos solo muestra la primera en página de detalle. Carousel táctil + swipe.
- **Rama #5:** `feat/ops-crear-cuentas` — admin crea cuentas de buyer/driver/seller desde OPS (merchant ya existe). Magic link de set-password.

### Post-launch (no bloqueante)

- `feat/driver-bank-mp` — Driver no tiene campos bancarios en schema. Hoy admin paga manual fuera del sistema.
- `feat/propinas-driver` — buyer le da propina al driver post-DELIVERED.
- Bug encoding UTF-8 — cada deploy a producción rompe tildes en datos de DB ("Electrónica" → "Electr├│nica"). Cosmético, ver `.auto-memory/project_utf8_encoding_bug.md`.

### Reglas nuevas del sprint (#19-#24)

- **#19** Cualquier endpoint admin que cambie el set de roles derivados de un usuario DEBE llamar `emitRoleUpdate` al final del happy path.
- **#20** Cuando un campo del modelo tiene un "status" derivado por workflow de aprobación, los chequeos downstream (checklist, listados, badges) DEBEN basarse en el status, NUNCA en si el campo de origen tiene valor.
- **#21** Cualquier doc con auditoría legal (AAIP/AFIP/municipal) DEBE permitir aprobación PHYSICAL con nota libre.
- **#22** Cualquier string user-facing NUNCA debe usar "OPS" — siempre "el equipo de Moovy" o variante natural.
- **#23** Cualquier endpoint que lea/escriba campos cifrados DEBE aplicar `decrypt<Modelo>Data` / `encrypt<Modelo>Data`.
- **#24** Cualquier nuevo flujo de OPS con input + validación NO debe usar `window.confirm/prompt` nativos — usar componente modal con diseño Moovy.

---

## Cambio 2026-04-17 — ISSUE-001 PIN doble de entrega (Fases 1-9 completas)

Rama: `feat/pin`

### Resumen
Sistema completo de PIN doble para prevenir fraude del repartidor. El driver ya no puede marcar "entregado" sin validar dos códigos: uno del comercio (pickupPin) y otro del comprador (deliveryPin). Cierra el bloqueante más importante del lanzamiento. Ver detalle en CLAUDE.md → Decisiones tomadas → "ISSUE-001 PIN doble de entrega 2026-04-17" y en ISSUES.md → ISSUE-001 (marcado ✅ RESUELTO).

### Archivos creados
- `src/lib/pin.ts` — generación/comparación timing-safe + constantes (PIN_MAX_ATTEMPTS=5, PIN_FRAUD_THRESHOLD=3, PIN_GEOFENCE_METERS=100)
- `src/lib/pin-verification.ts` — `verifyOrderOrSubOrderPin()` centraliza toda la lógica (ownership + estado + intentos + geofence + timing-safe + audit + alerta socket)
- `src/app/api/driver/orders/[id]/verify-pin/route.ts` — endpoint driver para Orders
- `src/app/api/driver/suborders/[id]/verify-pin/route.ts` — endpoint driver para SubOrders (multi-vendor)
- `src/app/api/admin/fraud/pin-events/route.ts` — GET feed de eventos + drivers flagged
- `src/app/api/admin/fraud/drivers/[id]/reset/route.ts` — POST para resetear score / levantar suspensión
- `src/app/ops/(protected)/fraude/page.tsx` — panel admin con stats, tabla, feed, auto-refresh 30s
- `scripts/test-pin-verification.ts` — 11 tests (funciones puras + sanity datos + invariantes + AuditLog)

### Archivos modificados
- `prisma/schema.prisma` — agregados `pickupPin`, `pickupPinVerifiedAt`, `pickupPinAttempts`, `deliveryPin`, `deliveryPinVerifiedAt`, `deliveryPinAttempts` en `Order` y `SubOrder`. `Driver.fraudScore Int @default(0)` + índice
- `src/app/api/orders/route.ts` — genera `pickupPin`/`deliveryPin` con `generatePinPair()` al crear la orden (dentro del `$transaction`)
- `src/app/api/driver/orders/[id]/status/route.ts` — bloquea `→ PICKED_UP` sin `pickupPinVerifiedAt` y `→ DELIVERED` sin `deliveryPinVerifiedAt`. Dispara `notifyBuyerDeliveryPin()` al PICKED_UP
- `src/app/api/orders/[id]/route.ts` — sanitiza PINs según rol + estado (delivery solo visible en PICKED_UP/IN_DELIVERY)
- `src/app/api/merchant/orders/[id]/route.ts` — sanitiza `pickupPin` (solo en DRIVER_ARRIVED)
- `src/app/(store)/mis-pedidos/[orderId]/page.tsx` — badge destacado con `deliveryPin` + instructions
- `src/components/repartidor/PinKeypad.tsx` — keypad numérico 6 dígitos con input masking
- `src/app/repartidor/(protected)/pedidos/[id]/page.tsx` — integración del keypad + lógica verify-pin
- `src/app/comercios/(protected)/pedidos/[id]/page.tsx` — card destacada con `pickupPin`
- `src/lib/notifications.ts` — agregada `notifyBuyerDeliveryPin()` con tag distinto del push genérico de status
- `src/components/ops/OpsSidebar.tsx` — entrada "Fraude" en sección Operaciones

### Migración requerida
```
npx prisma db push        # aplica nuevos campos al DB local
npx prisma generate       # regenera tipos Prisma Client
```

### Testing
```
npx tsx scripts/test-pin-verification.ts
```
Cubre: generación, verificación timing-safe, formato/sanitización, constantes, sanity de PINs en DB, bounds de `pickupPinAttempts`/`deliveryPinAttempts`, invariante `fraudScore >= PIN_FRAUD_THRESHOLD → isSuspended === true`, AuditLog parseable, simulación damage cap.

### Fases post-launch (incrementales, no bloqueantes)
- **Fase 11** — Offline mode: IndexedDB + service worker cache del PIN para validación sin red (driver pierde señal en el portal del edificio).
- **Fase 12** — Flow "No pude entregar": botón activo tras 5min en destino, captura foto + GPS + motivo, crea `DeliveryAttempt` record.
- **Fase 13** — Cron 5min: detecta drivers sin movimiento >10min con orden activa → alerta + auto-reassign si >15min.

El sistema actual es production-ready sin estas fases.

---

## Cambio 2026-04-16 (PM) — UX polish: toasts, signOut, logout, SCHEDULED label

Rama: `fix/ux-t`

### 1. Toast redesign MOOVY-branded
- Reescrito `src/components/ui/Toast.tsx` completo
- Centrado arriba de la pantalla (top-20, left-1/2), fondo blanco, borde izquierdo de color
- Success usa rojo MOOVY (#e60012), error rojo estándar, warning amber, info blue
- Animación slide-down con scale + opacity
- Botón de cierre, auto-dismiss respetado

### 2. SignOut custom en 4 portales
- `src/app/comercios/(protected)/layout.tsx` — 2 links de signOut cambiados de `/api/auth/signout` a `/logout`
- `src/app/vendedor/(protected)/layout.tsx` — 2 links cambiados
- `src/app/cuenta-suspendida/page.tsx` — 1 link cambiado
- `src/app/cuenta-archivada/page.tsx` — 1 link cambiado
- Elimina la página negra en inglés de NextAuth default signout

### 3. Logout page mejorada
- `src/app/logout/page.tsx` — Logo SVG real (`/logo-moovy.svg`) en vez de texto
- Botón "Volver" usa `router.back()` en vez de link a `/` (vuelve a donde estaba)

### 4. SCHEDULED label en español
- `src/app/(store)/mis-pedidos/[orderId]/page.tsx` — statusLabelMap con "Entrega programada"
- `src/app/(store)/mis-pedidos/page.tsx` — SCHEDULED en statusConfig + activeStatuses + Calendar icon

### 5. Fix redirect seguimiento (truncación de rama anterior)
- `src/app/seguimiento/[orderId]/page.tsx` — reparado redirect que estaba truncado

## Cambio 2026-04-16 (AM) — Consolidación tracking + checkout UX

Rama: `fix/no-drivers-checkout-ux`

### 1. Consolidación de páginas de tracking
- `/seguimiento/[id]` reemplazado por redirect a `/mis-pedidos/[id]`
- `/mis-pedidos/[id]` ahora tiene Socket.IO real-time + RateDriverModal + scroll-to-map
- `/mis-pedidos/page.tsx` — todos los links unificados a `/mis-pedidos/${id}`
- `mp-return/page.tsx` — link de éxito ahora va directo al detalle del pedido

### 2. Fix flash de confirmación post-pago efectivo
- Eliminada pantalla de confirmación in-state en checkout (frágil, se perdía en remount)
- Post-pago efectivo: clearCart → toast.success → router.push a `/mis-pedidos/${orderId}`
- Patrón robusto: el detalle del pedido ES la confirmación (como PedidosYa/Amazon)

### 3. Bloqueo botón "Inmediata" sin drivers
- Botón deshabilitado (gris, cursor-not-allowed, opacity-60) cuando no hay drivers disponibles
- Auto-selecciona SCHEDULED como alternativa
- Texto "Sin repartidores ahora" con sugerencia de programar

## Cambio 2026-04-12 (PM) — Recuperación de carritos abandonados + fix referidos

Rama: `feat/referral-fix-cart-recovery`

### 1. Fix bug referidos (status PENDING nunca pasaba a COMPLETED)
- `activatePendingBonuses()` otorgaba puntos pero no actualizaba `Referral.status`
- `/api/referrals` filtraba por `COMPLETED` → la página de invitar amigos siempre mostraba 0
- Fix: después de otorgar puntos, `updateMany` el Referral a `COMPLETED` con montos reales
- Archivos: `src/lib/points.ts`

### 2. Recuperación de carritos abandonados (feature completa)
- Schema: `SavedCart` + campos `reminderCount`, `lastRemindedAt`, `recoveredAt`, `cartValue` + índice
- Cron: `/api/cron/cart-recovery` detecta carritos sin actividad, envía hasta 2 recordatorios
- Email: `sendCartAbandonmentEmail()` con lista de productos, total, CTA a checkout
- Push: título y body diferenciados por 1er/2do recordatorio
- Config: 5 keys MoovyConfig (habilitado, horas 1er/2do recordatorio, max recordatorios, valor mínimo)
- Cart API: resetea reminder tracking cuando usuario modifica carrito
- Email registry: 2 entries (#175, #176) en categoría "Recuperación"
- Requiere: `npx prisma db push` para los nuevos campos + seed para las config keys

### 3. Fix reset-admin.ts truncado
- Faltaban `}`, `finally { prisma.$disconnect() }` y `main()`
- Archivo: `scripts/reset-admin.ts`

## Cambio 2026-04-12 — Fixes críticos UX + herramientas admin

Ramas: `fix/portal-switcher-direct-links` + `fix/auto-refresh-global-60s` + `feat/reset-admin-script`

### 1. Fix portal switcher + registro loop + approve/reject drivers
- OPS: links "volver" en destacados y banner-promo apuntaban a `/ops` (flash), corregido a `/ops/dashboard`
- Registro repartidor/vendedor: loop infinito `/registro` ↔ `/dashboard` por useEffect que leía JWT stale. Extraído a Server Component con `computeUserAccess()` como gate
- OPS approve/reject drivers: endpoints solo exportaban PUT pero frontend llamaba POST → 405. Agregado wrapper POST (mismo patrón merchants)

### 2. Fix Service Worker auto-reload en producción
- `sw.js` con `skipWaiting()` + `clients.claim()` + auto-reload en ServiceWorkerRegistrar creaba ciclo de recarga cada ~60s que interrumpía formularios
- Eliminados `skipWaiting()` y `clients.claim()`. Eliminado auto-reload. SW ahora se actualiza en la próxima visita natural
- Push notifications, cache offline y fallback offline siguen funcionando

### 3. Script reset-admin + configuración VPS
- Creado `scripts/reset-admin.ts`: lee `ADMIN_RESET_EMAIL` + `ADMIN_PASSWORD` del .env, hashea con bcrypt(12), actualiza DB y asigna rol ADMIN
- Variables .env: `ADMIN_EMAIL` para notificaciones (email.ts), `ADMIN_RESET_EMAIL` + `ADMIN_PASSWORD` para el script
- NEXT_PUBLIC_APP_URL del VPS corregido a `https://somosmoovy.com` (antes apuntaba a localhost:3000)
- Uso: `npx tsx scripts/reset-admin.ts` (local o VPS vía SSH)

## Cambio 2026-04-10 (PM) — Rediseño completo: roles derivados, single source of truth

Rama: `feat/roles-single-source-of-truth`

Contexto: el sistema anterior (role-access.ts + auto-heal-roles.ts + UserRole como
fuente paralela) dejaba abierta toda una clase de bugs por drift entre el estado
del dominio (Merchant/Driver/SellerProfile) y la tabla UserRole. Cada endpoint de
register/activate/cancel tenía que acordarse de tocar la tabla, y el drift lo
parchábamos a posteriori con auto-heal en login. Mauro pidió rediseñar esto "a
la altura de las grandes apps" — decidí eliminar el problema de raíz.

Principio: **los roles NO se guardan, se DERIVAN**. COMERCIO/DRIVER/SELLER se
derivan del estado del dominio en cada request. ADMIN y USER se siguen leyendo
de `User.role` (legacy, sin estado de dominio propio).

Solución:

1. **`src/lib/roles.ts` — único punto de verdad**
   - `computeUserAccess(userId)`: una sola query con todos los includes
     (ownedMerchants, driver, sellerProfile) y devuelve el `UserAccess`
     completo: `{ userId, isAdmin, isSuspended, isArchived, merchant, driver,
     seller }` con status derivado por dominio (NONE/PENDING/APPROVED/REJECTED/
     SUSPENDED/INACTIVE/ACTIVE).
   - Envuelto en `React.cache()` para deduplicación automática por request.
   - `requireMerchantAccess(userId)`, `requireDriverAccess(userId)`,
     `requireSellerAccess(userId)`: gates canónicos que verifican sesión →
     archived → suspended → registered → approved/active y disparan el
     `redirect()` correcto. Usan exhaustive switch con check `never` para
     que TypeScript detecte estados no cubiertos en compile time.
   - `deriveUserRoles(access)`: deriva el array `["USER", "COMERCIO", ...]`
     para cachear en el JWT.
   - Transiciones (`approveMerchant`, `rejectMerchant`, `approveDriver`,
     `rejectDriver`, `suspendMerchant`, `reactivateMerchant`, etc.): todas
     con audit log consistente usando el campo `details: JSON.stringify(...)`
     (no `metadata`, que no existe en el modelo AuditLog).

2. **`src/lib/auth.ts` refactorizado**
   - `authorize()` llama `computeUserAccess()` en vez de leer `UserRole`
     con `where: { isActive: true }`.
   - Callback `jwt()` llama `deriveUserRoles(computeUserAccess())` para
     refrescar el JWT. El array `roles[]` del JWT ahora es un **cache** del
     estado derivado, no la fuente de verdad.
   - Auto-heal eliminado: ya no hace falta, porque no hay drift posible.

3. **Layouts protegidos simplificados**
   - `/comercios/(protected)/layout.tsx`, `/repartidor/(protected)/layout.tsx`,
     `/vendedor/(protected)/layout.tsx` ahora llaman al gate canónico
     (`requireMerchantAccess` etc.) en una sola línea. Sin duplicación, sin
     checks dispersos, sin bypass inconsistentes.
   - Admin bypass incluido dentro del gate (un admin sin Merchant entra igual).

4. **Endpoints de register/activate/cancel limpiados**
   - `api/auth/register/driver` — ya no crea UserRole (dos paths: PATH A
     existing user, PATH B new user).
   - `api/auth/register` (buyer/merchant) — ya no upsertea ni crea UserRole.
   - `api/auth/activate-merchant` — solo crea el Merchant.
   - `api/auth/activate-driver` — solo crea el Driver.
   - `api/auth/activate-seller` — check de "already seller" ahora es
     `SellerProfile.isActive`, no UserRole.
   - `api/seller/activate` — upsert de SellerProfile con `isActive: true`.
   - `api/auth/cancel-merchant` — solo elimina Merchant.
   - `api/auth/cancel-driver` — solo elimina Driver.
   - `api/admin/merchants/create` — ya no crea UserRole en PATH A/B.
   - `api/admin/users/[id]/delete` — `derivedRoles` calculado desde
     relations incluidas, sin query a UserRole.
   - `api/admin/users/bulk-delete` — mismo patrón, por usuario.
   - `api/profile/delete` — ya no borra UserRole (los roles se derivan y
     se apagan solos porque `deletedAt != null`).

5. **Endpoints que leían admins por UserRole migrados a User.role**
   - `src/lib/assignment-engine.ts` → `notifyOps()`.
   - `src/app/api/cron/retry-assignments/route.ts` → `notifyAdminOfStuckOrder()`.

6. **Archivos eliminados**
   - `src/lib/role-access.ts` — reemplazado por `roles.ts`.
   - `src/lib/auto-heal-roles.ts` — innecesario sin drift.

7. **`src/lib/auth-utils.ts` intacto a propósito**
   - 126 archivos lo usan (`hasRole`, `hasAnyRole`, `getUserRoles`).
   - Ahora actúa como **cache layer**: lee el array `roles[]` del JWT, que
     ya viene poblado por `computeUserAccess()`. Indirecta pero correcta.
   - Refactor masivo de los 126 callers = riesgo sin beneficio, se queda así.

8. **Tabla `UserRole` en el schema**
   - Se deja porque `auth-utils.ts` lee `roles[]` del JWT (no la tabla) y
     ningún código escribe a ella nunca más.
   - Deprecar/dropear en cleanup futuro.

9. **Script de validación: `scripts/validate-role-flows.ts`**
   - 12 tests (6 estáticos + 6 dinámicos contra DB real).
   - Estáticos: legacy files borrados, exports canónicos en `roles.ts`,
     cero writes a `userRole` en endpoints, approve/reject usan transitions,
     layouts protegidos usan gates, `auth.ts` usa `computeUserAccess`.
   - Dinámicos: merchants aprobados acceden, pending no, drivers cumplen
     `approvalStatus`, sellers cumplen `isActive`, users soft-deleted
     devuelven null, admins tienen `isAdmin: true`.
   - Usa dynamic import para evitar problemas de resolución de alias TSX.
   - Ejecutar con `npx tsx scripts/validate-role-flows.ts` antes de deploy.

10. **Bug histórico resuelto**
    - El drift donde un `Merchant` existente tenía `UserRole COMERCIO` en
      `isActive: false` y el `authorize()` filtraba `isActive: true` no
      emitiendo el rol → `proxy.ts` lo bouncenaba a `/`. Imposible de
      reproducir ahora porque el rol se deriva del Merchant directamente.

Validación:
- `npx tsc --noEmit` → 0 errores (excepto los 3 pre-existentes del baseline).
- `grep -r "tx.userRole.(create|createMany|upsert|update|updateMany|delete|deleteMany)" src/` → 0 matches.
- `grep -r "prisma.userRole.(create|createMany|upsert|update|updateMany|delete|deleteMany)" src/` → 0 matches.
- Script de validación listo para ejecutar en la máquina de Mauro.

Nota operativa: el script `validate-role-flows.ts` debe ejecutarse en Windows
porque `node_modules/esbuild` está instalado para esa plataforma. Los tests
estáticos corren en segundos; los dinámicos requieren DB local (PostGIS docker).

## Cambio 2026-04-10 (AM) — Foundation rediseño flujo de roles

Rama: `feat/rediseno-flujo-roles-y-docs`

Problema detectado: el layout de `/repartidor/(protected)` no tenía check de rol
ni de approvalStatus — un buyer podía entrar al dashboard del driver. El botón
CONECTAR silenciaba los errores 403 (pending/suspended) sin mostrar feedback al
usuario. Los endpoints de register/activate eran inconsistentes en cómo seteaban
`UserRole.isActive` (driver a veces false, a veces true).

Solución — chunk 1 de varios (foundation, sin tocar schema):

1. Creado `src/lib/role-access.ts` con `getMerchantAccess`, `getDriverAccess`,
   `getSellerAccess`. Cada helper hace UNA query y devuelve
   `{ canAccess, reason, redirectTo, message }` cubriendo toda la cadena:
   registered → approved → not suspended → active.
2. Los 3 layouts protegidos llaman al helper correspondiente. Admins bypasean
   explícitamente en el call site porque pueden no tener fila de Merchant/Driver/
   SellerProfile.
3. `/repartidor/(protected)/layout.tsx` ahora bloquea:
   - No logged in → /repartidor/login
   - Sin rol DRIVER/ADMIN → /repartidor/login
   - User suspended/archived → páginas correspondientes
   - Driver pending/rejected/suspended/inactive → /repartidor/pendiente-aprobacion
4. Creada `/repartidor/pendiente-aprobacion/page.tsx` como contraparte del mismo
   patrón usado en `/comercios`.
5. Normalizado `activate-driver`: ahora crea UserRole DRIVER con `isActive: true`
   (consistente con merchant, seller y register/driver). El gating real pasa por
   `approvalStatus` en la DB vía `role-access.ts`.
6. Fix silent failures en el dashboard de driver (connect + disconnect): ahora
   muestran toast con el mensaje real del backend en vez de ignorar errores.
7. CLAUDE.md actualizado con la decisión de arquitectura.
8. **Auto-heal de UserRole en login (bug en producción)**: al probar la rama,
   Mauro detectó que al ir a `/comercios` desde Mi Perfil lo bouncenaba a `/`.
   Causa: su `UserRole COMERCIO` estaba en `isActive: false` (drift histórico),
   el `authorize()` de `auth.ts` filtra `where: { isActive: true }`, y el JWT
   se emitía sin el rol → `proxy.ts` línea 143 bouncea al inicio. El auto-heal
   que ya existía en `auth.ts` SOLO disparaba en el trigger `update` con
   `refreshRoles: true`, nunca en login normal. Solución: extraído a helper
   `src/lib/auto-heal-roles.ts` (`autoHealUserRoles(userId)`), ahora llamado
   desde `authorize()` Y desde el trigger `update` (el código inline duplicado
   fue reemplazado). Cada login nuevo auto-repara drift de UserRole para
   COMERCIO, DRIVER (si approved o active) y SELLER (si active). El auto-heal
   NO revisa `Merchant.approvalStatus` — inyecta el rol igual aunque esté
   PENDING, porque el gate de aprobación es responsabilidad exclusiva de
   `role-access.ts` en el layout protegido. Separar gating de role-presence
   evita que `proxy.ts` bounce al inicio a usuarios que deberían ver
   `/comercios/pendiente-aprobacion`.

Lo que NO entra en esta rama (chunks futuros):
- Setup Checklist Hero (patrón Stripe/Shopify para onboarding post-registro)
- Schema de DriverDocument/MerchantDocument para rechazo per-documento
- UI de review per-documento en OPS
- Modal completo del botón CONECTAR con estado per-documento
- Endpoint `access-status` para poder mostrar el modal sin recargar

## P0 — Sin esto no se lanza

- [x] Validación pre-flight de stock en checkout — `src/app/api/orders/route.ts` — S ✅ 2026-03-21

- [x] Flujo de aprobación de merchant/driver — M ✅ 2026-03-21
  Schema: approvalStatus + approvedAt + rejectionReason en Merchant y Driver.
  API: approve/reject endpoints para ambos. Emails: 4 nuevos templates.
  OPS UI: botones Aprobar/Rechazar con modal de motivo. Notificación al admin en registro merchant.

- [ ] Credenciales MP producción — config + testing — M ⏸️ NO BLOQUEANTE PARA DEV
  Para producción con dinero real. En dev se trabaja con credenciales TEST. Al momento de subir a prod: cambiar API keys, configurar webhook URL en panel MP, testear pago real.

- [x] Validación de scheduled delivery — `src/app/api/orders/route.ts`, `src/lib/validations.ts` — M ✅ 2026-03-21
  Zod: slot mínimo 1.5h desde ahora, máximo 48h, horario 9-22h, duración 1-3h.
  Backend: capacidad máxima 15 pedidos por slot. Error SLOT_FULL con 409.

- [x] Manejo de errores de pago visible al usuario — `mp-return/page.tsx` — S ✅ 2026-03-21
  Ya tenía timeout+FAILED+PAID. Agregado: soporte APPROVED status, link WhatsApp en timeout.

- [x] Email de confirmación de pedido funcional — `src/lib/email.ts` — S ✅ 2026-03-21
  Código verificado: sendOrderConfirmationEmail se llama en orders/route.ts (cash) y webhook MP (pago aprobado).
  Pendiente: configurar SMTP en producción y verificar que no caiga en spam.

- [x] Notificación push al merchant/seller cuando recibe pedido — S ✅ 2026-03-21
  notifyMerchant() y notifySeller() en notifications.ts, llamados en orders/route.ts (cash + MP).

- [x] Cancelación de pedido por buyer — `src/app/api/orders/[id]/cancel/route.ts` — M ✅ 2026-03-21
  Endpoint creado: valida permisos, restaura stock, libera driver, notifica por socket+push.

- [x] Página de error 404 y 500 customizada — ya existían y están bien — S ✅ 2026-03-21

- [x] PWA manifest + icons correctos — ya configurado correctamente — S ✅ 2026-03-21

- [x] Seed de datos iniciales para producción — `prisma/seed-production.ts` — M ✅ 2026-03-21
  Admin, StoreSettings, PointsConfig, MoovyConfig (10 keys), PackageCategories, DeliveryRates, PricingTiers.

- [ ] Smoke test manual de flujo completo — ningún archivo — L
  Flow 1 (comprador) parcialmente testeado. Bugs encontrados y corregidos:
  ✅ Error 500 al pagar con efectivo (couponCode + logger fix)
  ✅ Error 500 en tracking (estimatedDeliveryTime → estimatedTime)
  ✅ WhatsApp button tapaba botón Agregar (bottom-20 → bottom-6)
  ✅ Heart button feo cuando deslogueado (rediseñado ghost style)
  ✅ Botón puntos desbordaba en pantalla chica (texto acortado)
  ✅ Indicadores Offline/En vivo innecesarios (removidos)
  ✅ Celebración puntos con glow azul fuera de branding (rediseñada)
  ✅ Tracking page con BottomSheet feo (rediseñado completo)
  Flow 2 (comercio) — code review completo 2026-03-26:
  ✅ Race condition en merchant/orders/ready (updateMany condicional)
  ✅ Merchant orders excluyen pedidos soft-deleted (deletedAt filter)
  ✅ Merchant orders incluyen subOrders filtradas por merchantId (multi-vendor privacy)
  ⚠️ Merchant orders: take:50 hardcoded, sin paginación (aceptable pre-lanzamiento)
  ⚠️ merchantId no existe en session.user — afecta import/packages (ver nota)
  Flow 3 (repartidor) — code review completo 2026-03-26:
  ✅ CRITICAL: toggle-status sin hasAnyRole ni approvalStatus check (corregido)
  ✅ CRITICAL: toggle-status sin Zod — "false" string coercionaba a true (corregido)
  ✅ CRITICAL: claim endpoint auto-creaba driver sin registro (eliminado)
  ✅ CRITICAL: claim endpoint sin protección de race condition (updateMany atómico)
  ✅ HIGH: location endpoint sin approval check (corregido)
  ✅ Password policy LoginSchema min(6)→min(8) consistente con CLAUDE.md (corregido 2026-04-08)
  Flow 4 (admin/ops) — code review completo 2026-03-26:
  ✅ CRITICAL: puntos/page.tsx truncado con redirect incompleto (corregido)
  ✅ CRITICAL: points/config/route.ts truncado (corregido)
  ✅ CRITICAL: scripts truncados fix-ops-config.ts y validate-ops-config.ts (corregidos)
  ✅ HIGH: admin users DELETE hacía hard delete (convertido a soft delete)
  ✅ HIGH: admin merchants usaba legacy role check (migrado a hasAnyRole)
  ✅ HIGH: admin merchants PATCH sin whitelist de campos (whitelist agregado)
  Pendiente: smoke test visual en navegador (Mauro)
  UX improvements (smoke test visual — 2026-04-07):
  ✅ Búsqueda por descripción además de nombre (autocomplete + listings)
  ✅ Chat bubble draggable con snap-to-edge (fix hooks order que causaba error flash al login)
  ✅ Notas de producto dinámicas desde config del merchant (radio, tiempo, fee, retiro, pedido mínimo)
  ✅ FIX CRÍTICO: puntos MOOVER mostraban Math.floor(price) — 100x inflado — corregido a price/100
  ✅ Badge "Compra protegida — garantía MOOVY" en página de producto
  ✅ CTA "¿Te falta algo? Seguir comprando" en resumen del checkout
  ✅ Subtotal visible en botón Continuar mobile (checkout)

## P1 — Sin esto los usuarios se van

- [x] Tests unitarios para order creation + webhook MP — `__tests__/` — L ✅ 2026-03-21
  68 tests (orders.test.ts + webhook-mp.test.ts): schema validation, scheduled delivery, webhook structure.

- [x] Botón "Eliminar mi cuenta" en UI — `src/app/(store)/mi-perfil/page.tsx` — S ✅ 2026-03-21
  Botón discreto + modal con doble confirmación (escribir ELIMINAR). Llama a POST /api/profile/delete.

- [x] Onboarding del merchant post-aprobación — `src/app/comercios/(protected)/page.tsx` — M ✅ 2026-03-21
  OnboardingChecklist: 4 pasos (logo, horarios, 3+ productos, delivery). API /api/merchant/onboarding. Auto-hide al completar.

- [x] Sonido/vibración en notificaciones del merchant — `src/app/comercios/(protected)/pedidos/page.tsx` — S ✅ 2026-03-21
  El merchant ya tenía audio (new-order.wav). Agregado: navigator.vibrate() + Notification API cuando tab en background.

- [x] Página de estado del pedido pública (sin auth) — `src/app/(store)/mis-pedidos/[orderId]/page.tsx` — S ✅ 2026-03-21
  Endpoint /api/orders/[id]/tracking (datos no sensibles). Consolidado en `/mis-pedidos/[id]` (2026-04-16). `/seguimiento/[id]` redirige automáticamente.

- [x] Retry automático de asignación si no hay drivers — `src/app/api/cron/retry-assignments/route.ts` — M ✅ 2026-03-21
  Cron cada 5min: busca pedidos CONFIRMED sin driver, reintenta asignación (max 3), escala a admin si falla.

- [x] Dashboard merchant con KPIs reales — `src/app/comercios/(protected)/page.tsx` — M ✅ 2026-03-21
  KPI cards: Pedidos hoy, ingresos hoy, pendientes, rating, pedidos semana, ingresos semana. API endpoint /api/merchant/stats. Auto-refresh 30s.

- [x] Responsive completo en checkout — `src/app/(store)/checkout/page.tsx` — S ✅ 2026-03-21
  Verificado por Mauro en iPhone SE (375px). 16 puntos chequeados, todos OK. Agregado botón geolocalización.

- [x] Comprobante/recibo descargable — `src/app/api/orders/[id]/receipt/route.ts` — M ✅ 2026-03-21
  HTML printable: datos del pedido, items, totales, método de pago. Botón en detalle de pedido. Browser print-to-PDF.

- [x] Notificación cuando pedido está listo para retirar — `src/app/api/merchant/orders/[id]/ready/route.ts` — S ✅ 2026-03-21
  notifyDriver() + notifyBuyer(READY) + socket a todas las partes cuando merchant marca listo.

- [x] Rate limiting en login de portales — PortalLoginForm.tsx — S ✅ 2026-03-21
  Detecta 429, muestra countdown MM:SS. Endpoint /api/auth/check-rate-limit. Aplica a todos los portales.

- [x] Validación de imágenes en listings — NewListingForm + EditListingForm + API — S ✅ 2026-03-21
  Client-side y server-side: requiere al menos 1 imagen para publicar listing.

- [x] Mejorar empty states en marketplace — `src/app/(store)/marketplace/page.tsx` — S ✅ 2026-03-21
  CTAs para vender, sugerencia de vendedores verificados, diseño mejorado.

- [x] Soporte WhatsApp directo — `src/components/layout/WhatsAppButton.tsx` — S ✅ 2026-03-21
  Botón flotante verde en store layout, abre wa.me con mensaje pre-cargado. TODO: reemplazar número placeholder.

## P2 — Esto lo hace competitivo

- [x] Logger estructurado (Pino) — `src/lib/logger.ts` — L ✅ 2026-03-21
  Child loggers por módulo, 62 calls en orders/webhooks/assignment/email. JSON en prod, pretty en dev.

- [x] Migrar rate limiter a Redis — `src/lib/security.ts`, `src/lib/redis.ts` — M ✅ 2026-03-23
  ioredis 5.x con fallback automático a in-memory. Redis primario (INCR atómico + PEXPIRE), in-memory si Redis no está. REDIS_URL opcional. 22 callers actualizados a async.

- [x] Encriptación at-rest para CUIT/CBU — `src/lib/encryption.ts` — M ✅ 2026-03-21
  AES-256-GCM en merchant/seller/driver registration y APIs. Backward compatible. Dev key fallback.

- [x] Métricas de performance (Web Vitals) — `src/components/analytics/WebVitalsReporter.tsx` — S ✅ 2026-03-21
  LCP, INP, CLS, FCP, TTFB. sendBeacon en prod, console coloreada en dev. API /api/analytics/vitals.

- [ ] App nativa Android (TWA o React Native) — proyecto separado — XL
  Para notificaciones nativas, geolocalización background, mejor UX.

- [ ] Múltiples ciudades — schema + config — XL
  Hoy hardcodeado Ushuaia. Necesita: city en Order/Merchant/Driver, config por ciudad.

- [ ] Split payment automático via MP Marketplace API — `src/lib/mercadopago.ts` — L
  Pagar directo al vendedor/merchant sin intervención manual. Requiere aprobación MP.

- [x] Sistema de cupones/descuentos — schema + API + checkout + admin — M ✅ 2026-03-21
  Coupon + CouponUsage models. Validate API, CouponInput en checkout, admin CRUD en /ops/cupones. % o fijo, límites, fechas.

- [x] Chat en tiempo real buyer-driver — Socket.IO + UI — M ✅ 2026-03-24
  Quick replies de delivery (12 opciones por fase), contexto de ubicación en header (distancia+ETA), read receipts, UI amber para driver, mobile-first 44px touch targets. Nuevo endpoint /api/orders/[id]/delivery-context. Lib: delivery-chat.ts (Haversine+ETA+proximidad).

- [x] Historial de ubicación del driver — `src/app/api/driver/location/` — S ✅ 2026-03-24
  Schema DriverLocationHistory (lat/lng/accuracy/speed/heading/timestamp). Batch POST /api/driver/location/history (max 100 pts, rate limit 10/min). Auto-save en location/route.ts cuando driver tiene orden activa. Admin trace: GET /api/admin/orders/[id]/location-trace (distancia total + duración). Cron cleanup 30 días.

- [x] Dashboard analytics avanzado — `src/app/ops/(protected)/analytics/page.tsx` — L ✅ 2026-03-23
  API /api/admin/analytics con métricas por período (hoy/semana/mes). KPIs: revenue, ticket promedio, cancelación, payment split. Rankings de comercios y drivers. Métricas de buyers activos y retención. Auto-refresh 60s.

- [x] Programa de fidelización para merchants — API + UI + admin — M ✅ 2026-03-24
  4 tiers: BRONCE (8%), PLATA (7%), ORO (6%), DIAMANTE (5%) — comisión dinámica por volumen de pedidos/mes. Schema: MerchantLoyaltyConfig + campos loyaltyTier/loyaltyOrderCount en Merchant. Servicio: merchant-loyalty.ts (cálculo tier, comisión efectiva, widget data). Cron diario /api/cron/update-merchant-tiers. Widget en dashboard merchant (tier + progreso + beneficios). Badge público MerchantBadge.tsx. Admin: /ops/lealtad-comercios (ver tiers, editar config, recalcular). Comisión en order creation ahora usa getEffectiveCommission() dinámico. Seed de 4 tiers.

## Backlog futuro (P3/P4)

### Revenue directo (detectado en análisis 2026-03-24)
- Surge pricing (recargo hora pico + clima extremo) — M — Est: +$1-2k/mes
- Promoted listings (merchants pagan por posicionamiento) — S — Est: +$1-5k/mes
- Suscripción delivery pass (envío gratis por $X/mes) — M — Est: +$15-50k/mes
- Cross-selling en checkout (productos complementarios) — M — Est: +15-25% ticket
- ~~Recuperación de carritos abandonados (email/push 2h después) — M — Est: +5-10% conversión~~ ✅ Implementado con cron + email + push + config dinámica
- Descuentos bulk B2B (hoteles, oficinas, hospitales) — M

### Eficiencia operativa
- ~~Batched deliveries (agrupar pedidos misma ruta) — L~~ ✅ Implementado como smart batching en multi-vendor (comercios <3km + volumen compatible)
- Smart assignment (heading-aware, no solo distancia) — M — Est: -15min ETA
- Auto-aprobación merchants (CUIT válido + docs OK) — S
- Alertas predictivas de stock bajo para merchants — S

### Plataforma
- Pago con QR en punto de venta
- Integración con sistemas POS de comercios
- API pública para integraciones terceros
- Multi-idioma (inglés para turistas)
- IA para recomendaciones personalizadas
- Programa de embajadores/influencers
- Gestión de inventario avanzada
- Sistema de disputas/mediación automatizado
- Facturación electrónica AFIP
- Revocación de sesiones JWT (token blacklist)
- Play Integrity API para Android
- Página de referidos con UI de compartir (WhatsApp/SMS/copy)

## Completadas
- [x] Dashboard merchant con KPIs reales (6 KPI cards, API stats endpoint) — 2026-03-21
- [x] Validación pre-flight de stock en checkout — 2026-03-21
- [x] Notificación push al merchant/seller cuando recibe pedido — 2026-03-21
- [x] Endpoint de cancelación de pedido por buyer (POST /api/orders/[id]/cancel) — 2026-03-21
- [x] Manejo de errores de pago visible al usuario (mp-return + checkout stock errors) — 2026-03-21
- [x] Páginas de error 404 y 500 customizadas (ya existían) — 2026-03-21
- [x] PWA manifest + icons correctos (ya configurado) — 2026-03-21
- [x] Seed de datos iniciales para producción (prisma/seed-production.ts) — 2026-03-21
- [x] Flujo de aprobación de merchant/driver (schema + API + emails + OPS UI) — 2026-03-21
- [x] Validación de scheduled delivery (Zod + capacidad backend) — 2026-03-21
- [x] Email de confirmación de pedido (código verificado, falta SMTP prod) — 2026-03-21
- [x] Botón "Eliminar mi cuenta" en UI (modal doble confirmación) — 2026-03-21
- [x] Sonido/vibración en notificaciones del merchant (vibrate + Notification API) — 2026-03-21
- [x] Tests unitarios (68 tests: orders + webhook MP) — 2026-03-21
- [x] Rate limiting UI en login de portales (countdown + check-rate-limit endpoint) — 2026-03-21
- [x] Validación de imágenes en listings (client + server) — 2026-03-21
- [x] Página de seguimiento pública sin auth (tracking endpoint) — 2026-03-21
- [x] Notificación push cuando pedido listo (notifyDriver + notifyBuyer READY) — 2026-03-21
- [x] Mejorar empty states en marketplace (CTAs + diseño) — 2026-03-21
- [x] Soporte WhatsApp directo (botón flotante en store layout) — 2026-03-21
- [x] Onboarding merchant post-aprobación (checklist 4 pasos + API) — 2026-03-21
- [x] Retry automático asignación drivers (cron + escalación admin) — 2026-03-21
- [x] Comprobante/recibo descargable (HTML printable + botón) — 2026-03-21
- [x] Dashboard merchant con KPIs reales (6 cards, API stats, auto-refresh) — 2026-03-21
- [x] Responsive checkout verificado (16 puntos OK, geolocalización agregada) — 2026-03-21
- [x] Smart scheduled delivery (slots basados en horario real del vendor) — 2026-03-21
- [x] Seller schedule config (UI + server action + schema) — 2026-03-21
- [x] Migración Google Places API (PlaceAutocompleteElement) — 2026-03-21
- [x] Logger estructurado Pino (62 calls, 4 módulos críticos) — 2026-03-21
- [x] Encriptación AES-256-GCM para CUIT/CBU (6 APIs) — 2026-03-21
- [x] Web Vitals (LCP/INP/CLS/FCP/TTFB + API + admin page) — 2026-03-21
- [x] Sistema de cupones (schema + validate + checkout + admin CRUD) — 2026-03-21
- [x] Página /quienes-somos (About Us — confianza, misión, valores, cómo funciona) — 2026-03-23
- [x] Página /terminos (Términos y Condiciones — 14 cláusulas, Ley 24.240 + 25.326) — 2026-03-23
- [x] Página /comisiones (transparencia de tarifas, comparación vs competencia) — 2026-03-23
- [x] Dashboard analytics avanzado OPS (KPIs negocio/merchants/drivers/buyers, API por período) — 2026-03-23
- [x] Auditoría pre-lanzamiento: bypass admin, puntos cancel, comisión rejected, deliveryFee negativo, passwords admin, rating hardcodeado, Facebook link, acento, cupón atómico, indexes DB — 2026-03-23
- [x] Auditoría exhaustiva checkout: webhook MP (monto+idempotencia), merchant (approval+isOpen+schedule+minOrder+radius), cupón (maxUsesPerUser+tx), refund MP, portal merchant, delivery fee — 2026-03-24
- [x] Chat buyer-driver mejorado (quick replies delivery, contexto ubicación, read receipts, delivery-context API) — 2026-03-24
- [x] Historial ubicación driver (DriverLocationHistory, batch save, admin trace, cron cleanup 30d) — 2026-03-24
- [x] Programa fidelización merchants (4 tiers BRONCE→DIAMANTE, comisión dinámica 5-8%, widget, badge, admin, cron) — 2026-03-24
- [x] Smoke test code review flows 2/3/4: 12 bugs críticos/altos corregidos (driver approval gating, race conditions, admin soft delete, whitelist PATCH, syntax errors, scripts truncados) — 2026-03-26

### 2026-04-08 — Driver onboarding desde perfil comprador
- ✅ "Quiero ser Repartidor" ahora muestra modal de confirmación → redirige a wizard de registro
- ✅ Wizard de registro adaptado: si venís logueado desde perfil, saltea datos personales (2 pasos en vez de 3)
- ✅ activate-driver API reescrito: acepta datos completos (vehículo, docs, CUIT, términos)
- ✅ Auto-refresh de roles en mi-perfil: al volver a la pestaña detecta aprobación de OPS
- ✅ Guard: si ya sos DRIVER, redirige al dashboard. Si no estás logueado, redirige a login
- ✅ Progress bar adaptado (2 pasos vs 3 según origen)

### 2026-04-08 — Smoke test code review (4 flujos)
- ✅ HIGH: Seller confirm no detectaba SubOrders de merchants en estado PREPARING (mixto multi-vendor)
- ✅ HIGH: driverRejectOrder no incrementaba assignmentAttempts en Order (retry cron contaba mal)
- ✅ HIGH: GET /api/orders sin paginación — ahora tiene take/skip + count + excluye soft-deleted
- ✅ HIGH: Variable shadowing `status` en GET /api/orders (metrics siempre reportaban "200")
- ✅ Consumer mis-pedidos adaptado al nuevo formato { orders, pagination }
- ✅ SubOrders incluidas en response de GET /api/orders (para tracking multi-vendor)
- ✅ TypeScript compila limpio — 0 errores

### 2026-04-08 — Reparación archivos truncados + fixes compilación
- ✅ CRITICAL: 5 archivos truncados reparados (retry-assignments, assignment-engine, orders/[id], merchant/confirm, CartSidebar)
- ✅ CRITICAL: función calculateEstimatedEarnings faltante en assignment-engine (ganancia estimada del driver)
- ✅ CRITICAL: validateInput en validations.ts truncado (completado)
- ✅ HIGH: LoginSchema password min(6)→min(8) consistente con política documentada
- ✅ HIGH: ProductDetailClient null checks para merchant.minOrderAmount
- ✅ MEDIUM: Indexes SubOrder (orderId, driverId) para performance de queries multi-vendor
- ✅ TypeScript compila limpio — 0 errores

### 2026-04-08 — Multi-vendor Delivery System
- ✅ Carrito detecta multi-vendor y muestra toast informativo (una vez por sesión)
- ✅ CartSidebar agrupa items por vendedor con banner info
- ✅ Checkout calcula delivery fee por vendor en paralelo
- ✅ Order API valida fees server-side por grupo, asigna deliveryFee a SubOrders
- ✅ startSubOrderAssignmentCycle() en assignment engine con smart batching (<3km + volumen)
- ✅ Merchant/seller confirm disparan asignación per SubOrder
- ✅ Retry cron maneja SubOrders stuck sin driver
- ✅ Tracking muestra cards independientes por SubOrder (estado, driver, mapa, items)
- ✅ Fees desglosados por vendor en resumen del pedido
- ✅ Validación Zod: OrderGroupSchema acepta deliveryFee + distanceKm

### 2026-04-12 — Fix referidos + Recuperación carritos abandonados
- ✅ Fix bug referidos: Referral.status nunca pasaba de PENDING a COMPLETED (puntos se otorgaban pero stats mostraban 0)
- ✅ Recuperación carritos abandonados: cron + email + push + config dinámica + email registry
- ✅ Fix reset-admin.ts truncado (faltaban cierre de bloques)

### 2026-04-16 — Consolidación tracking + checkout UX + UX polish
- ✅ Consolidación: `/seguimiento/[id]` → redirect a `/mis-pedidos/[id]` (una sola página de tracking)
- ✅ Socket.IO real-time en detalle de pedido (reemplaza polling 10s, mantiene fallback 30s)
- ✅ RateDriverModal en detalle de pedido (antes solo en `/seguimiento`)
- ✅ Fix flash confirmación post-pago efectivo (eliminada pantalla in-state, router.push directo)
- ✅ Bloqueo botón "Inmediata" sin drivers + auto-select SCHEDULED
- ✅ SCHEDULED label en español ("Entrega programada") en mis-pedidos y detalle
- ✅ Toast redesign MOOVY-branded (centrado, blanco, borde de color, animación)
- ✅ SignOut custom en comercios/vendedor/suspendida/archivada (adiós página negra NextAuth)
- ✅ Logout page: logo SVG real + botón Volver con router.back()

### 2026-04-07 — UX Smoke Test Improvements
- ✅ Búsqueda por descripción + Chat bubble draggable (fix hooks order)
- ✅ Notas dinámicas de merchant + Fix crítico puntos MOOVER (100x inflado)
- ✅ Badge "Compra protegida" + CTA "Seguir comprando" + subtotal en botón mobile

### 2026-03-27 — Marketing & Publicidad
- ✅ Sección "Destacados" en home page (3 tiers: Platino/Destacado/Premium)
- ✅ Sidebar OPS reorganizado: nueva sección "Marketing"
- ✅ Campos de publicidad en Biblia Financiera (precios configurables)
- ✅ Regla de marca: NUNCA mencionar competidores (documentado en CLAUDE.md)
- ✅ Header: MapPin + Ushuaia reemplaza "Ingresar" (rama anterior mergeada)
- ✅ Fondos blancos uniformes en toda la home
