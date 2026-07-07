# MOOVY — CLAUDE.md

Última actualización: 2026-07-06

> **Este archivo contiene SOLO información canónica y perdurable.**
>
> - Para histórico cronológico de ramas y cambios → `.claude/CHANGELOG.md` (NO se carga auto, consultá con grep solo si te lo piden explícitamente).
> - Para issues abiertos hoy → `ISSUES.md`.
> - Para tareas del sprint actual → `PROJECT_STATUS.md`.

---

## Quick reference

Marketplace + tienda + delivery en Ushuaia, Argentina (80k hab). El comercio cobra al instante.

- **Stack**: Next.js 16 + React 19 + TS + Tailwind 4 + Prisma 5 + PostgreSQL/PostGIS + NextAuth v5 (JWT) + Socket.IO + Zustand
- **Hosting**: VPS Hostinger | **Deploy**: PowerShell scripts → SSH | **Dominio**: somosmoovy.com
- **Marca**: Rojo `#e60012` (MOOVY) | Violeta `#7C3AED` (Marketplace) | Font: Plus Jakarta Sans
- **Cotización referencia**: USD 1 = ARS 1.450

## Estructura del repo

```
src/app/(store)/        Tienda pública + buyer auth
src/app/repartidor/     Portal driver
src/app/comercios/      Portal merchant
src/app/vendedor/       Portal seller marketplace
src/app/ops/            Panel admin/operaciones
src/app/api/            ~170 route handlers
src/components/         ~80 componentes
src/lib/                ~37 utils
src/hooks/              12 hooks
src/store/              4 Zustand stores
scripts/                PowerShell + socket-server.ts + seeds + validate-*.ts
prisma/schema.prisma    ~30 modelos con PostGIS
```

## Modelos clave

- **User** → multi-rol legacy + points + referrals + soft delete
- **Merchant** → docs fiscales con triple status (Status + ApprovedAt + RejectionReason + ApprovalSource DIGITAL/PHYSICAL + ApprovalNote), commission dinámico por tier, MP OAuth
- **SellerProfile** → marketplace, 12% commission, MP OAuth
- **Driver** → docs (DNI/licencia/seguro/RTO/cédula verde) con triple status + ExpiresAt + NotifiedStage, fraudScore, PostGIS, banco (bankCbu/bankAlias/mpAccessToken)
- **Order** → multivendor via SubOrder, soft delete, PIN doble, pointsEarned/pointsUsed/nearDestinationNotified
- **SubOrder** → un comercio por subOrder, driver+PIN+fee independientes
- **Listing** → marketplace items
- **Payment / MpWebhookLog** → registro pagos MP
- **PendingAssignment / AssignmentLog** → ciclo asignación
- **StoreSettings / MoovyConfig / PointsConfig** → config dinámica singleton
- **DriverLocationHistory** → GPS trace, cleanup 30d
- **MerchantLoyaltyConfig** → tiers BRONCE/PLATA/ORO/DIAMANTE
- **EmailTemplate / AdminNote / UserSegment / BroadcastCampaign / PayoutBatch / PayoutItem / PlaybookChecklist** → CRM/OPS editables
- **DriverAvailabilitySubscription** → "avisame cuando haya repartidor"
- **ConsentLog** → auditoría AAIP (Ley 25.326)
- **CronRunLog** → healthcheck genérico de crons

## Reglas de negocio canónicas (FUENTE DE VERDAD)

> **Refactor 2026-04-30 (rama refactor/separar-motor-y-finanzas)**: las reglas se
> dividen en dos dominios independientes con interfaz limpia entre ambos:
>
> - **Motor Logístico** → produce el costo del viaje (un número en pesos) +
>   asignación operativa. Inputs: distancia, vehículo, peso, zona, clima.
>   Outputs: `tripCost`, `operationalCost`, `driverPayoutAmount`.
> - **Reparto Financiero** → reparte la plata entre actores. Inputs: el output
>   del motor + rates configurables. Outputs: `merchantPayout`, `sellerPayout`,
>   `moovyRevenue`, puntos otorgados/quemados.
>
> Schema: `SubOrder` persiste el snapshot inmutable (`tripCost`, `operationalCost`,
> `driverPayoutAmount`, `merchantCommissionRate`, `merchantCommissionSource`).
> NUNCA recalcular sobre orders cerradas (rompe cierres fiscales AFIP).
> Orquestación: `src/lib/orders/order-totals.ts` (`buildSubOrderFinancialSnapshot`).

### Motor Logístico (pricing del viaje + asignación)

Fórmula aditiva (Plan Maestro v1 — el envío es solo logística, sin operativo):
\`\`\`
costo_viaje = (base_vehículo + costo_km × distancia) × zona × clima × demanda
\`\`\`

- Vehículos (base + costo_km): Bici ($1.600 + $90/km) | Moto ($1.800 + $130/km) | Auto ($2.600 + $190/km) | Pickup/SUV ($6.500 + $300/km) | Flete ($18.000 + $450/km)
- Zonas: A (×1.0) | B (×1.15, +$150 driver) | C (×1.35, +$350 driver)
- Zonas excluidas: configurables desde `/ops/zonas-excluidas` (NO hardcoded)
- Clima: normal ×1.0 | lluvia ×1.15 | temporal ×1.30
- Demanda: normal ×1.0 | alta ×1.20 | pico ×1.40
- Peso cobrable: max(real, largo×ancho×alto/5000)
- Nafta super Ushuaia: $1.702/litro
- Asignación: PendingAssignment + AssignmentLog, smart batching <3km, geofence PIN 100m

Tamaños de producto canónicos (selector Glovo-style en `/comercios`):
MICRO (≤200g) | SMALL (≤2kg) | MEDIUM (≤15kg) | LARGE (≤30kg) | XL (>30kg).
Mapping a vehículo en `src/lib/product-weight.ts` (`SIZE_METADATA`).

### Reparto Financiero (comisiones, splits, puntos)

#### Comisiones

- Comercio MES 1: **0%** (30 días desde `Merchant.createdAt`)
- Comercio MES 2+: **10%** base, dinámico por tier (BRONCE 10% → PLATA 9% → ORO 8% → DIAMANTE 7%)
- Seller marketplace: **10%** desde día 1 (sin first-month-free)
- Service fee al comprador: 0% (precio limpio)
- Costo operativo: **ELIMINADO** (Plan Maestro v1). El envío es solo logística; el margen de Moovy vive en la comisión, no embebido en el envío
- Repartidor: **80%** del costo del viaje. En envío gratis el cliente paga $0 pero el repartidor cobra igual (lo absorbe Moovy)
- Moovy delivery: 20% del costo del viaje (sin operativo)
- MP real: 7.6% (acreditación AL INSTANTE — es la que usamos). El 3.81% es la tarifa con acreditación diferida, que NO aplica a Moovy.
- **Split MP — cada parte paga lo suyo** (rama `fix/split-mp-cada-parte-paga-lo-suyo`, verificado con pago real en prod 2026-07-05): MP cobra su comisión UNA vez y TODA al comercio (el cobrador) sobre el TOTAL; el `marketplace_fee` le llega a Moovy intacto. Para que cada parte pague SU porción, Moovy se auto-descuenta: `marketplace_fee = (comisión + envío − descuento) × (1 − r)`, con `r` = reserva MP configurable en la Biblia (usar 7.6; en prod estaba en 8 → bajar). Función pura canónica `computeMpSplit` en `src/lib/finance/mp-split.ts` (única fuente de verdad del reparto MP). Propiedades: exacto para cualquier monto, rechazo CPT01 imposible por construcción, liberación diferida del comercio = ahorro todo del comercio (Moovy no cambia), cupón > parte Moovy = fee piso $0 + warning logueado. Verificación: `scripts/verify-split-cada-parte.ts`.
- **Liberación del `marketplace_fee`**: la config "al instante" de la cuenta aplica a ventas propias; la comisión de marketplace tiene calendario de liberación PROPIO a nivel aplicación (queda en "dinero a liquidar"). Se gestiona con el ejecutivo comercial de MP. Impacto: capital de trabajo para cubrir payouts de drivers durante el plazo de retención.
- Gastos fijos: ~$440K ARS/mes

Helper canónico: `getEffectiveCommissionWithSource(merchantId)` con precedencia
`OVERRIDE > FIRST_MONTH > TIER > FALLBACK`. El source se persiste en
`SubOrder.merchantCommissionSource` para audit AAIP/AFIP.

#### Puntos MOOVER

- Earn: 10pts/$1.000 (MOOVER), 12.5/$1K (SILVER), 15/$1K (GOLD), 20/$1K (BLACK)
- Solo se otorgan al pasar a **DELIVERED** (idempotente via `Order.pointsEarned`)
- 1pt = $1 ARS. Min 500 pts. Max 20% del subtotal
- Signup mes 1: 1.000 pts. Mes 2+: 500 pts. **Pending hasta 1ra compra de $5.000+** (`minPurchaseForBonus` en `src/lib/points.ts`)
- Referral: 1.000 referidor + 500 referido (post-DELIVERED del primer pedido **con subtotal ≥ $8.000**, `minReferralPurchase`)
- Boost lanzamiento 30d: ×2
- Niveles por DELIVERED en 90d: MOOVER (0), SILVER (5), GOLD (15), BLACK (40)
- Expiración: 6 meses sin pedidos
- Cancelación: revertir EARN, devolver REDEEM (`reverseOrderPoints` idempotente)

#### Publicidad (Fase 2 con 5+ comercios activos)

- VISIBLE $25K/mes | DESTACADO $50K/mes | PREMIUM $100K/mes | LANZAMIENTO $150K/mes

#### Protocolo efectivo repartidores

- Primeras 10: solo MP | 10-30: $15K | 30-60: $25K | 60+: $40K | 200+: $60K o ilimitado
- Compensación cruzada automática

## Decisiones arquitectónicas canónicas

- **Auth**: JWT 7 días, credentials-only
- **Pagos**: MP Checkout Pro (redirect)
- **DB**: PostgreSQL + PostGIS Docker puerto 5436. **SOLO `prisma db push`, NUNCA `migrate dev`**
- **Approval flow**: `String approvalStatus` (PENDING/APPROVED/REJECTED), no enum Prisma
- **Roles derivados (2026-04-10)**: COMERCIO/DRIVER/SELLER se calculan de domain state en cada request via `computeUserAccess(userId)` en `src/lib/roles.ts`. JWT `roles[]` = CACHE, no source of truth. NUNCA escribir a `UserRole` desde código nuevo. Helpers `requireMerchantAccess`/`requireDriverAccess`/`requireSellerAccess` redirigen al lugar correcto. Transiciones atomizadas con audit log.
- **Multi-vendor: DESHABILITADO para el lanzamiento** (`fix/carrito-un-solo-comercio`, decisión founder 2026-07-06): UN pedido = UN solo comercio o vendedor. Bloqueado en el carrito (modal `VendorSwitchModal` "Vaciar y agregar / Conservar") y con verificación AUTORITATIVA server-side en POST /api/orders (deriva los locales de los items contra la DB — `groups` del cliente es falsificable). El código multi-vendor (SubOrder por vendedor, batching <3km, PINs independientes) queda DORMIDO; para reactivarlo hay que quitar los guards Y ANTES construir la derivación de estados que NUNCA existió (SubOrder→DELIVERED→Order padre→puntos/emails; verificado en auditoría: sin eso un pedido multi-vendor jamás cierra).
- **Auth de API del seller contra DB**: `requireSellerApi()` en `src/lib/seller-auth.ts` (usa `computeUserAccess`, espejo de `requireMerchantApi`/`requireDriverApi`). Los endpoints de seller NUNCA autorizan con `hasAnyRole` (JWT cache).
- **Aprobación operativa vs visibilidad**: aprobación = capacidad operativa, logo/foto = visibilidad pública (filtros `image: { not: null }` en listados). NO bloquea aprobación.
- **Aprobación de docs**: per-doc status + hard-lock server-side cuando APPROVED. Cambio requiere change-request formal con audit + email. Aprobación PHYSICAL requiere nota mín 5 chars (auditoría AAIP). Auto-activación cuando todos los requeridos en APPROVED.
- **Auto-refresh JWT post-aprobación**: socket `roles_updated` + `RoleUpdateListener` global → `useSession.update({refreshRoles:true})` → JWT callback re-deriva roles
- **Soft delete obligatorio** para User/Merchant/Driver. Hard delete solo en Order/SubOrder via endpoint con confirmación textual literal "ELIMINAR DEFINITIVAMENTE"
- **Resurrección de cuentas BLOQUEADA**: registro con email soft-deleted → 410 + audit. Admin-delete NO anonimiza email (queda quemado). Self-delete SÍ anonimiza
- **Webhook MP**: valida monto vs total con tolerancia $1, idempotencia con `eventId` determinístico (NUNCA UUID random), refund automático, stock restore on reject
- **Confirmación textual para acciones irreversibles**: hard delete, mark-paid payouts, refund manual → body Zod literal exacta + Serializable tx + audit log
- **Encriptación campos sensibles AAIP**: `decrypt<Modelo>Data` antes de response, `encrypt<Modelo>Data` antes de update. CUIT/CBU/DNI/MP tokens cifrados
- **Validaciones country-specific**: CBU (checksum BCRA) en `src/lib/bank-account.ts`, CUIT (checksum AFIP) en `src/lib/cuit.ts`. Mismo helper client + server
- **Email transaccional**: función exportada (NUNCA inline) + entrada en `EMAIL_REGISTRY` con `generatePreview()` + trigger conectado. Editable desde `/ops/emails`
- **Cron idempotente**: patrón `updateMany WHERE flag IS NULL + count === 1` antes del side effect. Wrap en `recordCronRun(jobName, fn)` + entrada en `CRON_EXPECTATIONS`
- **Panel OPS único operativo**: todo parámetro editable post-launch (copy, segmentos, playbooks, tiers, zonas, emails) en DB con UI CRUD desde `/ops`. NUNCA en constantes del código
- **Biblia Financiera única fuente de verdad** financiera. `getEffectiveCommission()` con precedencia: `commissionOverride > first-month-free (0%) > tier > fallback 10%`
- **Wording user-facing**: NUNCA "OPS" → "el equipo de Moovy". NUNCA mencionar competidores
- **PIN doble entrega**: state machine bloquea PICKED_UP sin pickup verified, DELIVERED sin delivery verified. Geofence 100m+gracia, 5 intentos, fraudScore +1 al lockear, auto-suspend ≥3 incidentes
- **proxy.ts no chequea roles JWT** para `/comercios/*` ni `/repartidor/*`. Solo sesión. Layout protegido decide vía DB. ADMIN sí en proxy para `/ops/*`
- **Zonas de delivery con polígonos** (rama `feat/zonas-delivery-multiplicador`): la fuente de verdad de multiplicadores y bonus driver por zona es la tabla `DeliveryZone` (PostGIS Polygon SRID 4326 + GiST index), editable desde `/ops/zonas-delivery` con drawing UX pro (click-by-click / pintar freehand / edit inline). Helper canónico `getZoneSnapshotForLocation(lat, lng)` con cache invalidable. Snapshot inmutable persistido en `SubOrder.zoneCode/zoneMultiplier/zoneDriverBonus` al crear pedido (NUNCA recalcular retroactivo). El campo `StoreSettings.zoneMultipliersJson` queda como legacy del simulador en `/ops/config-biblia` y NO afecta el cobro real. Detección de overlaps con `ST_Intersects` al guardar zona — informativo, gana displayOrder mayor.

## Reglas acumuladas (#1-#32)

> Lista numerada que crece con cada sprint. Antes de empezar una rama, escanear las que apliquen al dominio.

1. **Datos aprobados hard-locked server-side** — UI nunca es defensa. Cambio solo via change-request formal con audit
2. **Validaciones country-specific con helper en `src/lib/`** — checksums compartidos client+server. Nunca regex simple del UI
3. **Transición final automática en mismo `$transaction`** — flujos multi-step con condición "todos los pasos completos" no requieren click admin separado
4. **Cambios formales con audit, nunca por WhatsApp/email** — modelo + endpoint + audit + notificaciones para change-requests
5. **Approval por doc aplica a TODOS los actores** — merchant/driver/seller. Per-doc status + hard-lock + change-request + auto-activación
6. **Docs con vencimiento legal** — `<doc>ExpiresAt` + `<doc>NotifiedStage Int` + cron diario que avisa 7/3/1d antes y auto-suspende al vencer
7. **Campos condicionales con helper centralizado** — `getRequiredXFields(condition)` consumido por client form + server endpoint + auto-activación
8. **Operaciones de dinero requieren confirmación textual** — body Zod literal + Serializable tx + endpoint NUNCA ejecuta transferencia, solo registra
9. **Comunicación masiva** — cursor-based resume safe ante crashes + validar consentimiento marketing (Ley 26.951) antes de disparar
10. **Panel OPS única interfaz operativa post-launch** — todo parámetro editable en DB con UI CRUD. Nunca constantes en código
11. **Email transaccional** — función exportada (nunca inline) + entrada en EMAIL_REGISTRY + trigger conectado
12. **Cron idempotente** — `updateMany WHERE flag IS NULL + count === 1` antes del side effect
13. **Driver API auth via helper canónico** — `requireDriverApi()` consulta DB. JWT `roles[]` es cache
14. **Listados públicos** — combinar `isActive` + `approvalStatus === "APPROVED"` en where
15. **Defaults conservadores** — si falta config crítica, default = NO operar
16. **Preferencias localStorage** — hook centralizado + Initializer component que aplica on mount + feedback inmediato
17. **Emails admin transaccionales** — usar versiones registradas en `EMAIL_REGISTRY`. Si hay legacy + nueva, eliminar legacy y migrar callers
18. **Layouts protegidos por rol** — montar `PWAInstallPrompt` al final
19. **Endpoints admin que cambian roles** — llamar `emitRoleUpdate` al final del happy path
20. **Status derivado por workflow** — chequeos downstream basados en status, NUNCA en si el campo de origen tiene valor
21. **Docs con auditoría legal** — permitir aprobación PHYSICAL con nota libre
22. **Strings user-facing** — NUNCA "OPS" → "el equipo de Moovy"
23. **Campos cifrados** — endpoints que leen/escriben deben aplicar `decrypt<Modelo>Data` / `encrypt<Modelo>Data`
24. **Flujos OPS con input + validación** — NO usar `window.confirm/prompt` nativos. Modal con diseño Moovy
25. **Mutations admin desde cliente** — parsear `data.error` del response y mostrarlo en toast
26. **Operaciones irreversibles** — confirmación textual literal en body Zod, no solo click. Audit log antes del side effect
27. **UI multi-rol** — minimizar clicks al panel principal. Si rol activo requiere >2 clicks desde la home, hay un detour
28. **proxy.ts y JWT roles[]** — chequeos en proxy son cache, no autorización. Layouts protegidos usan `computeUserAccess` contra DB
29. **Pedido pagado nunca queda sin asignar** (`feat/asignacion-reintento-y-reembolso`): si al confirmar no hay repartidor elegible, el pedido entra en `SEARCHING_DRIVER` con ventana configurable (`driver_search_window_minutes`, default 20 min). El cron `assignment-tick` y el hook de driver-online reintentan vía `retrySearchingOrder`/`retryAllSearchingOrders`; al vencer sin repartidor → `refundOrderIfPaid` automático. `onNoEligibleDriver` es el punto único (reemplaza las llamadas directas a `handleNoDriverFound`). El checkout bloquea el pago sin repartidor y ofrece "Retirar en local" / "Avisame cuando haya repartidor" (con email, no solo push). Campo `Order.driverSearchUntil`. Sin "pagar y esperar".
30. **La naturaleza del envío NO restringe la asignación** (`fix/asignacion-sin-filtro-equipamiento`, decisión founder para el lanzamiento): caliente/frío/frágil no filtra ni vehículos ni equipamiento del repartidor — solo TAMAÑO/PESO (PackageCategory → vehículo) y distancia mandan. Interruptor único `EQUIPMENT_FILTERS_ENABLED = false` en `src/lib/shipment-types.ts` (sistema dormido: SLA/prioridades siguen; se reactiva poniendo true y la sección Equipamiento del perfil driver reaparece sola). Cazado en prod: un driver online con GPS quedaba excluido en silencio por no declarar mochila térmica.
31. **Direcciones del comprador**: máximo 2 guardadas (`MAX_SAVED_ADDRESSES` en `src/lib/addresses.ts`, defensa server-side en tx Serializable + UI que esconde el botón). La dirección activa se muestra en la barra "Entregar en" (`DeliveryAddressBar`, montada en el layout de (store) DENTRO del contenido scrolleable, no en el header fijo).
32. **Emails del ciclo — disparo fire-and-forget + dedup cancelación/reembolso**: los emails transaccionales del ciclo (pedido entregado, nuevo pedido al comercio, pagos, cancelaciones, suspensión, pago recibido) se disparan con patrón **fire-and-forget** (IIFE async + try/catch o `.catch`, import dinámico) que NUNCA rompe el flujo del pedido/pago si el email falla. En el webhook de MP el email NO puede throwear hacia afuera (haría que MP reintente). Los emails de dinero van DENTRO del bloque idempotente (el `count>0` de la confirmación de pago / el `eventId` del webhook) para no doblarse. **DEDUP**: en una cancelación de pedido pagado con MP sale SOLO el email de reembolso (`order_refunded` vía `refundOrderIfPaid`), NO el de cancelación; el de cancelación solo se manda para pedidos NO pagados online. Estado pagado canónico = `"PAID"` (nunca `"APPROVED"`).

## Variables de entorno

```
DB:        DATABASE_URL, SHADOW_DATABASE_URL
Auth:      AUTH_SECRET, NEXTAUTH_SECRET, CRON_SECRET
App:       NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SOCKET_URL, SOCKET_PORT, SOCKET_INTERNAL_URL
MP:        MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET, MP_APP_ID
Email:     SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFICATION_EMAIL
OPS:       OPS_LOGIN_EMAIL, OPS_LOGIN_PASSWORD
Push:      NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
Maps:      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID, NEXT_PUBLIC_USE_ROUTES_API (opcional)
Redis:     REDIS_URL (opcional, fallback in-memory automático)
Sentry:    NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN (solo build/CI)
```

## Scripts

| Script                               | Uso                                                        |
| ------------------------------------ | ---------------------------------------------------------- |
| `start.ps1 <nombre>`                 | Crear rama desde develop                                   |
| `finish.ps1`                         | Cerrar rama: commit + push + merge develop + delete branch |
| `publish.ps1`                        | Push + dump DB                                             |
| `devmain.ps1`                        | Deploy a producción                                        |
| `sync.ps1`                           | Pull develop                                               |
| `validate-ops-config.ts`             | Integridad panel OPS (9 tests)                             |
| `fix-ops-config.ts`                  | Corrige configs faltantes                                  |
| `reset-admin.ts` / `create-admin.ts` | Admin OPS                                                  |
| `clean-db-pre-launch.ts`             | Cleanup data prueba (dry-run, `--execute` interactivo)     |
| `validate-role-flows.ts`             | 12 tests de roles derivados                                |
| `test-pin-verification.ts`           | 11 tests del PIN                                           |
| `cleanup-resurrected-users.ts`       | Detecta cuentas resucitadas (read-only)                    |

## Reglas de ejecución (las 10 inviolables)

1. NO abrir browser, NO `npm run dev/build`, NO pruebas visuales
2. Verificar TS con `npx tsc --noEmit --skipLibCheck` (targeted si OOM)
3. **NUNCA EDITAR CÓDIGO EN DEVELOP/MAIN.** Verificar rama antes de tocar archivo. Si está en `develop`/`main`: detener, pedir `start.ps1`. Si rama ya cerrada y hay otro cambio: nueva rama
4. Mostrar plan → esperar aprobación → ejecutar → mostrar archivos modificados + tsc
5. Ignorar errores TS pre-existentes (`.next/dev/types/*`, `node_modules/.prisma/client`, archivos con TS1127 documentados)
6. Al cerrar rama: actualizar CLAUDE.md (si tocó decisión canónica), ISSUES.md (si cerró issue), CHANGELOG.md (entry de la rama)
7. Rutas con paréntesis: `git add "src/app/(store)/page.tsx"` (PowerShell requiere comillas)
8. Comandos git: especificar siempre en qué rama estar posicionado antes
9. Cierre rama: usar `.\scripts\finish.ps1` (interactivo). NO inventar comandos git manuales
10. PowerShell NO soporta `&&`. Separar con `;` o líneas distintas

## Regla de testing obligatorio

Cada feature que toque parámetros financieros, asignación o configurables DEBE incluir:

1. Script de verificación contra DB real (NO mocks)
2. Simulación financiera si toca dinero
3. Detección de conflictos: dos sistemas no escriben mismo parámetro con valores distintos
4. Pre-deploy: `npx tsx scripts/validate-ops-config.ts`
5. Antes de código que referencia Prisma: LEER schema para verificar campos exactos

## Mentalidad CEO/CTO

No sos un programador. Sos el CEO y CTO de una empresa que va a facturar millones. Cada línea de código es una decisión de negocio.

### Antes de implementar cualquier cosa, preguntate

- **RIESGO**: ¿Lo peor si falla? Si es grave (dinero, comercios, confianza, legal) → versión más segura, no más rápida
- **COMPETENCIA**: ¿Cómo lo resuelve PedidosYa/Rappi/MercadoLibre? Igual/peor → no aceptable. Si igual → diferenciador
- **USUARIO DE USHUAIA**: 80k hab, -5°C, conexión irregular, desconfianza inicial a apps nuevas
- **EFECTO BOCA A BOCA**: error con dinero se sabe en 24h. Cada interacción es marketing
- **COSTO DE OPORTUNIDAD**: ¿es lo de mayor impacto ahora? ¿O un detalle mientras hay flujo crítico roto?

### Psicología del mercado de Ushuaia

- Ciudad chica = primeros 10 comercios son los más importantes (desconfianza inicial)
- Clima extremo = delivery es necesidad real, ventaja competitiva
- Turismo = pico verano dic-mar, turistas ya usan delivery en sus ciudades
- Comunidad = comercio famoso arrastra clientes
- Precio sensible = comisiones competitivas + pago instantáneo
- Confianza = "¿quién está detrás?" importa, /quienes-somos y soporte críticos

### Análisis de competencia (uso INTERNO)

PedidosYa/Rappi: retención de dinero, comisiones 25-30%, soporte lento, presencia limitada en ciudades chicas. MOOVY ataca cada debilidad: pago instantáneo, comisiones bajas, soporte humano, atención personalizada.

### Regla de marca: NUNCA mencionar competidores (público)

MOOVY es un movimiento, no comparación. Filosofía Apple: no nombramos a Samsung.

- ❌ "A diferencia de PedidosYa..." | ✅ "Comisiones desde el 10% — las más bajas del mercado"
- ❌ "Mientras otros retienen tu dinero..." | ✅ "Cobrás al instante. Cada venta, cada vez"

### Pre-mortem antes de cada decisión grande

"Es 6 meses post-launch y Moovy fracasó. ¿Por qué?"

1. Comercios se van porque pago no llega bien | 2. Compradores se van por app lenta/confusa | 3. Repartidores se van por ganar poco | 4. Error de seguridad expone datos | 5. Competencia baja comisiones | 6. App se cae en pico | 7. Problema legal AFIP/defensa consumidor

Cada decisión debe reducir la probabilidad de al menos una.

## Roles permanentes (filtros antes de cerrar tarea)

**Activación selectiva**:

- PRODUCTO, ARQUITECTURA, QA, SEGURIDAD → SIEMPRE
- UX → si hay UI/interacción
- PAGOS, FINANZAS → si toca dinero (Order, Payment, comisiones, puntos, cupones)
- LOGÍSTICA → si toca Order, Driver, delivery, tracking
- COMUNICACIONES → si evento afecta a usuarios
- SOPORTE → si cambia flujo reclamable
- LEGAL → si cambia datos, pagos, condiciones
- INFRA → si toca config, env, Docker, deploy, cron
- PERFORMANCE → si toca queries, listas, imágenes, alto tráfico
- MONITOREO → si hay operación que puede fallar silenciosa
- MARKETING/CONTENIDO → si hay texto user-facing
- GO-TO-MARKET → en features nuevas o cambios de flujo

### Los 14 roles

**PRODUCTO**: ¿funciona end-to-end? Recorré flujo completo del afectado. No alcanza con compilar — tiene que tener sentido como experiencia.

**ARQUITECTURA**: API routes con Zod + auth + try/catch + logger. Prisma queries con select/include explícito. Tx serializables para atómicas. Server Components default. NUNCA `migrate dev`.

**UX**: 4 estados obligatorios — Loading (skeleton, no blanco), Error (mensaje + retry), Vacío (texto + CTA), Éxito (toast/redirect). Mobile-first. Touch ≥44px. Sin jerga técnica. WCAG AA.

**QA**: pensar como malicioso Y distraído. Inputs vacíos/null/wrong type. Race conditions. Límites ($0, negativo, expirado). Permisos (IDOR). Concurrencia. Timeouts. Rollback.

**LOGÍSTICA**: Order status flow completo. PendingAssignment ciclo. PostGIS query + Haversine fallback. GPS polling 10s. Scheduled slots vs schedule. Multi-vendor SubOrders.

**PAGOS** (CERO TOLERANCIA): fórmula maestra subtotal/descuento/costo_viaje/operativo/comisión/pago_repartidor. Webhook valida monto vs total tolerancia $1. Idempotencia eventId determinístico. Stock restore. Refund auto. Montos NUNCA negativos. TODO server-side. `Math.round(x*100)/100` para centavos.

**PUNTOS MOOVER** (los puntos son dinero disfrazado): earn solo post-DELIVERED idempotente. Burn 1pt=$1, max 20%, min 500. Niveles dinámicos. Tx serializable. Balance NUNCA negativo. PointsConfig dinámico no hardcoded.

**COMUNICACIONES**: matriz por evento (email/push/socket/in-app). Si falta notificación para evento que tocás, agregarla. Español argentino sin anglicismos.

**SOPORTE**: chat de pedido disponible para estado actual. Soporte accesible desde pantalla. Errores dicen QUÉ HACER. Si hay dinero: reclamo escala a admin/ops.

**SEGURIDAD** (SIEMPRE): auth válida + middleware. Autorización (no IDOR). Zod en TODOS los inputs. Rate limit. SQL injection (Prisma + verificar `$queryRaw`). XSS (sanitizar `dangerouslySetInnerHTML`). CSRF origin. Uploads magic bytes + 10MB. Tokens timing-safe + hasheados. Audit log para refund/delete/reassign.

**INFRA**: env vars nuevas documentadas. PostGIS Docker. Servicios externos en tabla. Memory (paginación). CORS Socket.IO. Cron CRON_SECRET.

**PERFORMANCE**: select/include explícitos. Paginación obligatoria. Imágenes sharp + next/image. Dynamic imports. Sin N+1. Caché para configs. Mobile 3G.

**MONITOREO**: Pino con contexto (orderId/userId/action). Operaciones críticas error/warn. Webhooks loguean recepción/procesamiento/resultado. Operación silenciosa: log obligatorio.

**LEGAL**: ¿actualizar /terminos? Datos nuevos → política privacidad. Pagos → BCRA/AFIP. Datos a terceros → documentar. Soft delete obligatorio.

**FINANZAS**: `ingreso_moovy = comision_merchant + comision_seller + (delivery_fee × (1 - riderCommissionPercent))`. commissionRate dinámico. Cupones absorbe Moovy. CSV totales coinciden con suma de partes.

## Dependencias externas

### Google Cloud Platform (Proyecto 1036892490928)

| Servicio         | Estado | Uso                                                         |
| ---------------- | ------ | ----------------------------------------------------------- |
| Maps JavaScript  | ✅     | Mapas tracking/checkout/driver                              |
| Geocoding        | ✅     | AddressAutocomplete fallback                                |
| Places API (New) | ✅     | AddressAutocomplete primary                                 |
| Directions       | ✅     | Ruta tracking                                               |
| Routes API       | 🟡     | Wrapper listo, flag `NEXT_PUBLIC_USE_ROUTES_API` no seteado |

### MercadoPago

| Componente     | Estado  | Uso               |
| -------------- | ------- | ----------------- |
| Checkout Pro   | ✅ Prod | Pagos pedidos     |
| Webhooks IPN   | ✅ Prod | Confirmación auto |
| OAuth merchant | 🟡      | Split payments    |

### Otros

| Servicio        | Estado      | Uso                                                      |
| --------------- | ----------- | -------------------------------------------------------- |
| SMTP Nodemailer | 🟡          | ~60 templates, sin config prod                           |
| Web Push VAPID  | ✅          | Push buyers/merchants/drivers                            |
| Socket.IO v4    | ✅          | Real-time                                                |
| PostGIS v3.4    | ✅ Docker   | Geolocalización                                          |
| Pino v9         | ✅          | Logging                                                  |
| Sharp v0.33     | ✅          | Compresión imágenes                                      |
| Redis ioredis   | 🟡 Opcional | Rate limit (fallback in-memory)                          |
| Sentry          | ✅          | Error tracking client/server/edge con PII scrubbing AAIP |

### NPM clave

next 16 | react 19 | prisma 5.22 | next-auth 5 (beta) | @react-google-maps 2 | socket.io 4 | mercadopago 2 | bcryptjs 2 | zod 3 | zustand 4 | ioredis 5 | @sentry/nextjs 9

### Sentry — decisiones canónicas

- **PII scrubbing obligatorio**: hook `beforeSend` aplica `scrubSentryEvent` (helper en `src/lib/sentry-scrub.ts`) a todos los eventos. Cumple Ley 25.326 AAIP. Redacta emails, CBU, CUIT, DNI, MP tokens (APP_USR/TEST), JWT, Bearer tokens, PIN 4 dígitos, tarjetas, headers Authorization/Cookie/x-api-key.
- **Tunnel route `/monitoring`**: el SDK proxea por nuestro propio dominio para esquivar adblockers y simplificar CSP. Configurado en `withSentryConfig`.
- **Sample rates**: client tracing 10% prod, server 20% prod, edge 5% prod (alto tráfico). Errors siempre 100%.
- **Source maps**: solo se suben en CI con `SENTRY_AUTH_TOKEN`. `hideSourceMaps: true` evita que queden accesibles en el bundle del cliente.
- **Activación condicional**: si `NEXT_PUBLIC_SENTRY_DSN` no está seteado, Sentry no se inicializa (local dev sin proyecto Sentry funciona normal).
- **Error pages**: `error.tsx` y `global-error.tsx` capturan con `Sentry.captureException` automáticamente.

### Protocolo

1. Inicio sesión larga: verificar deprecaciones en Google/MP/Next
2. Servicio nuevo: agregar fila a tabla
3. Warning de deprecación: documentar con plan
4. Cada 2 semanas: `npm outdated`
5. Pre-deploy prod: verificar APIs habilitadas + credenciales

## 2. Candado de lanzamiento (`LAUNCH_GATE`)

**Qué es:** la decisión de que el sitio se mantiene privado mostrando
"Próximamente" hasta que vos lo abras a mano. Ya funciona; falta que el manual lo diga.

**Dónde va:** sección **"Decisiones arquitectónicas canónicas"** (como un bullet más).

```
- **Candado de lanzamiento `LAUNCH_GATE`** (en `proxy.ts`): por entorno, fail-closed,
  solo en prod y solo en páginas. El público ve la cortina `/proximamente`. Se entra
  con `?preview=PREVIEW_TOKEN` → cookie httpOnly 30 días. Se abre/cierra con
  `scripts/abrir-tienda.ps1` / `cerrar-tienda.ps1` (NO desde OPS; el modo
  mantenimiento se sacó de OPS). Deployar NO expone el sitio.
```

---

## 3. Cómo se verifica que un comercio está aprobado (`requireMerchantApi`)

**Qué es:** cuando un comercio entra a su panel, el sistema chequea contra la base
de datos que esté realmente aprobado (no por un atajo guardado que puede quedar viejo).

**Dónde va:** lista **"Reglas acumuladas"** (como una regla nueva).

```
- **Auth de API del comercio contra DB**: `requireMerchantApi()` consulta la base de
  datos (no el JWT cache, que queda stale tras aprobar). Espejo de `requireDriverApi`.
  El JWT `roles[]` es solo cache. (Arregló el 403 post-aprobación.)
```

---

## 4. Documentos del comercio configurables (fail-safe inverso)

**Qué es:** desde OPS se puede prender/apagar qué documentos se le piden a un comercio.
Por seguridad legal, si algo falla, el documento **se pide igual**.

**Dónde va:** lista **"Reglas acumuladas"**.

```
- **Flags `merchant.doc.*` con fail-safe inverso**: el documento es requerido SALVO
  que el flag exista y esté explícitamente en OFF. Si falta la fila o falla la query,
  se pide igual (compliance). `getRequiredDocumentFields` es async + flag-aware.
```

---

## 5. Aviso opcional al aprobar/rechazar (`notified`)

**Qué es:** al aprobar o rechazar un comercio/repartidor desde OPS, hay un casillero
"Notificar por email" (prendido por defecto). El registro guarda si se avisó o no.

**Dónde va:** lista **"Reglas acumuladas"**.

```
- **Aprobación/rechazo con notificación opcional**: checkbox "Notificar al usuario por
  email" (default ON) al aprobar/rechazar comercio o driver. El audit log siempre
  registra y guarda `notified` (permite correcciones/QA sin spamear).
```

---

## 6. Vendedor del marketplace sin fricción

**Qué es:** los vendedores del marketplace entran directo, sin subir documentación ni
esperar aprobación (a diferencia de los comercios).

**Dónde va:** sección **"Decisiones arquitectónicas canónicas"**.

```
- **Vendedor marketplace = frictionless**: sin documentación ni aprobación. Entra y
  publica directo (a diferencia del comercio, que sí pasa por aprobación de docs).
```

---

## 7. Compra del propio comercio bloqueada

**Qué es:** un comercio no puede comprarse a sí mismo.

**Dónde va:** sección **"Decisiones arquitectónicas canónicas"**.

```
- **Compra del propio comercio bloqueada** (ISSUE-003): un usuario-comercio no puede
  comprar en su propia tienda.
```

---

## 8. Dashboard de Unit Economics

**Qué es:** una pantalla de solo lectura en OPS que muestra los números por pedido
(cuánto gana Moovy, cuánto el repartidor, etc.).

**Dónde va:** sección **"Decisiones arquitectónicas canónicas"**.

```
- **Unit Economics**: dashboard read-only en `/ops/unit-economics` + lib
  `src/lib/finance/unit-economics.ts`.
```

---

## 9. Efectivo apagado para el lanzamiento

**Qué es:** para arrancar, solo se acepta pago electrónico. El código del pago en
efectivo quedó guardado para más adelante.

**Dónde va:** sección **"Decisiones arquitectónicas canónicas"**.

```
- **Efectivo = electrónico-only para lanzamiento**: el checkout es solo pago
  electrónico. El flag fantasma `buyer.cash-payment` se removió; el código de efectivo
  queda dormido para Fase 2.
```
