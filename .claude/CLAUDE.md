# MOOVY — Instrucciones para Claude

## Stack técnico
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma 5, PostgreSQL + PostGIS
- **Auth**: NextAuth v5
- **Realtime**: Socket.IO
- **Pagos**: MercadoPago SDK v2 (Checkout Pro)
- **Push**: Web Push API (VAPID)
- **Estado**: Zustand

## Portales de la app
| Portal | Ruta | Rol requerido |
|--------|------|---------------|
| Tienda | `/` | Público |
| Repartidor | `/repartidor` | DRIVER |
| Comercio | `/comercios` | MERCHANT |
| Vendedor | `/vendedor` | SELLER |
| Admin/Ops | `/ops` | ADMIN |
| Marketplace | `/marketplace` | Público |

## Arquitectura de roles
- Sistema multi-rol: un usuario puede tener USER + SELLER + DRIVER + MERCHANT simultáneamente
- Roles almacenados en tabla `UserRole` (no en `User.role`)
- **SIEMPRE** verificar roles con `hasAnyRole(session, ["ROL"])` de `@/lib/auth-utils`
- **NUNCA** usar `session.user.role` directo — es campo legacy
- **Alias MERCHANT ↔ COMERCIO**: El enum `UserRoleType` en Prisma usa `COMERCIO`, pero el código usa `MERCHANT`. `auth-utils` resuelve esto automáticamente con aliases. Usar `"MERCHANT"` en los checks es correcto.
- **Modelo de cuenta unificada**: Todo registro (merchant, driver) crea o reutiliza un User con rol base `USER`. Los roles B2B se agregan como UserRole adicionales. Si el email ya existe, se agrega el rol sin crear cuenta nueva.

## Base de datos
- Motor: PostgreSQL + PostGIS en Docker (puerto 5436)
- ORM: Prisma 5
- **SIEMPRE** usar `npx prisma db push` para aplicar cambios al schema
- **NUNCA** usar `npx prisma migrate dev` — requiere modo interactivo y falla con PostGIS
- Shadow DB configurada en `.env` como `SHADOW_DATABASE_URL`

## Workflow obligatorio de ramas
Cada tarea debe hacerse en su propia rama. Sin excepciones.

**Iniciar rama** (terminal, no chat):
```powershell
.\scripts\start.ps1
# Seleccionar tipo: 1=feat, 2=fix, 3=hotfix, 4=refactor
# Ingresar nombre corto sin espacios
```

**Publicar rama** (terminal, no chat):
```powershell
.\scripts\finish.ps1 -Message "tipo: descripcion en español"
```

## Notas para git en PowerShell
- Rutas con paréntesis como `(store)` deben ir entre comillas dobles: `git add "src/app/(store)/page.tsx"`
- PowerShell interpreta `()` como sintaxis propia — sin comillas da error "outside repository"
- Auth en NextAuth v5: usar `import { auth } from "@/lib/auth"` + `await auth()`, **NUNCA** `getServerSession(authOptions)` (eso es v4)

## Reglas de ejecución — SIEMPRE seguir estas reglas
1. **NO** abrir browser ni ejecutar dev server
2. **NO** correr `npm run dev` ni `npm run build`
3. **NO** ejecutar pruebas visuales ni screenshots
4. Verificar TypeScript con: `npx tsc --noEmit` (targeted si falla por OOM)
5. Al terminar mostrar SOLO: lista de archivos modificados + resultado del tsc
6. Mostrar el plan completo antes de ejecutar cualquier cambio
7. Esperar aprobación explícita antes de tocar archivos

## Actualización obligatoria del CLAUDE.md
Al finalizar cada rama, antes de ejecutar `.\scripts\finish.ps1`:
1. Actualizá este archivo `CLAUDE.md` con cualquier cambio relevante:
   - Nuevos archivos críticos agregados
   - Nuevos patrones de código establecidos
   - Deuda técnica resuelta o nueva
   - Nuevas variables de entorno agregadas
   - Funcionalidades completadas (mover de "No existe todavía" a su sección)
2. Incluí el `CLAUDE.md` en el commit de la rama

## Optimización de tokens
- Leer solo los archivos necesarios para la tarea actual
- No explorar directorios completos innecesariamente
- No re-leer archivos ya leídos en la misma sesión
- Reportar solo errores nuevos (ignorar los 3 pre-existentes: `--incremental`, `session.user` ×2)
- Resumir cambios en tabla al finalizar, no listar línea por línea

## Variables de entorno clave
```
DATABASE_URL          # PostgreSQL puerto 5436
SHADOW_DATABASE_URL   # Shadow DB con PostGIS
NEXTAUTH_SECRET       # Auth
CRON_SECRET           # Socket.IO auth — NUNCA usar fallback hardcodeado
NEXT_PUBLIC_APP_URL   # URL canónica de la app (dev: http://localhost:3000, prod: https://www.somosmoovy.com)
MP_PUBLIC_KEY         # MercadoPago public key (TEST- en sandbox)
MP_ACCESS_TOKEN       # MercadoPago access token (TEST- en sandbox)
MP_WEBHOOK_SECRET     # MercadoPago webhook HMAC secret
MP_APP_ID             # ID de la app MOOVY en MP
```
Ver `.env.example` en la raíz del proyecto para la lista completa con comentarios.

## Archivos críticos — leer antes de modificar
| Archivo | Por qué es crítico |
|---------|-------------------|
| `src/lib/auth-utils.ts` | hasRole(), hasAnyRole() — usar siempre para verificar roles |
| `src/lib/mercadopago.ts` | SDK MP, preference builder, OAuth helpers |
| `src/store/cart.ts` | Zustand cart con groupByVendor() |
| `prisma/schema.prisma` | Modelos completos incluyendo SubOrder, Payment, MpWebhookLog |
| `src/app/api/orders/route.ts` | Creación de órdenes con flujo cash y MP |
| `src/lib/notifications.ts` | notifyBuyer() para push al comprador |
| `.env.example` | Referencia completa de todas las variables de entorno |
| `src/app/api/driver/orders/route.ts` | Endpoint de pedidos para repartidores (disponibles/activos/historial) |
| `src/app/api/orders/[id]/accept/route.ts` | Aceptar pedido como repartidor (socket + push) |
| `src/lib/moover-level.ts` | Niveles MOOVER compartidos (server + client) |
| `src/store/favorites.ts` | Zustand store de favoritos con optimistic update |
| `src/app/api/favorites/route.ts` | API GET/POST/DELETE de favoritos |
| `src/lib/seller-availability.ts` | Funciones de disponibilidad vendedor (online/offline/pause/resume) |
| `src/lib/assignment-engine.ts` | Motor de asignacion de repartidores con PostGIS y rating |
| `src/hooks/useColorScheme.ts` | Hook dark/light detection — usar en componentes rider con inline styles |
| `src/app/globals.css` | Variables CSS `--rider-*` para dark mode portal repartidor |

## Patrones establecidos — seguir estos patrones
- **Protección de rutas API**: `if (!hasAnyRole(session, ["ROL"])) return 403`
- **Notificación push**: `notifyBuyer(userId, status, orderNumber).catch(console.error)`
- **Socket emit**: fetch a `${socketUrl}/emit` con Bearer CRON_SECRET
- **Imágenes**: usar `ImageUpload.tsx` existente en `src/components/ui/`
- **Formularios**: nunca usar `<form>` HTML, usar handlers onClick/onChange
- **Favoritos**: usar `HeartButton` de `@/components/ui/HeartButton` en cards
- **Niveles MOOVER**: importar de `@/lib/moover-level` (nunca duplicar constantes)

## Patrones nuevos (auditoría 2026-03-14)
- **SEO dinámico**: usar `generateMetadata()` + JSON-LD en páginas de detalle (producto, listing, vendedor)
- **Config dinámica frontend**: leer MoovyConfig desde `/api/config/public?key=xxx` (whitelisted keys)
- **Comisiones**: leer `default_merchant_commission_pct` y `default_seller_commission_pct` de MoovyConfig (fallback 8% y 10%)
- **Buscador global**: AppHeader incluye SearchOverlay mobile y dropdown desktop con debounce 300ms
- **Tracking mapa buyer**: usar `OrderTrackingMiniMap` con `dynamic()` import (no SSR) en pedidos activos
- **Filtros API listings**: soporta `sellerId`, `minPrice`, `maxPrice`, `sortBy` (price_asc/price_desc/newest)

## Patrones portal repartidor (redesign v2 — 2026-03-15)
- **Dashboard Status-First**: mapa NO aparece en idle; solo con pedido activo (auto-expand). Hero = botón conectar + stats
- **Dark mode**: `prefers-color-scheme` del OS + override manual desde Settings (auto/light/dark vía `data-theme` + `colorScheme`). Variables CSS `--rider-*` en `globals.css` + clases `dark:` en Tailwind v4
- **Colores semánticos**: usar `var(--rider-accent)`, `var(--rider-online)`, `var(--rider-offline)` etc. en vez de hardcodear hex
- **Dark mode inline styles**: para componentes con inline styles (BottomSheet, RiderBottomNav), usar hook `useColorScheme()` de `@/hooks/useColorScheme`
- **Skeleton loaders**: reemplazar spinners por skeletons con `animate-pulse` + clases `dark:` correspondientes
- **Pull-to-refresh**: gesto nativo en dashboard repartidor (touchstart/touchmove/touchend → reload)
- **Haptic feedback**: `navigator.vibrate?.(ms)` en acciones clave (aceptar pedido, cambiar estado)
- **Animated counters**: earnings con `requestAnimationFrame` + ease-out cúbico (1200ms)
- **Empty states mejorados**: icono circular + texto principal + texto secundario descriptivo
- **Swipe-to-confirm**: usar `SwipeToConfirm` de `@/components/rider/SwipeToConfirm` para avance de estado (evita toques accidentales)
- **Battery monitor**: hook `useBattery()` de `@/hooks/useBattery` muestra banner cuando batería < 20%
- **Llamar cliente (card mode)**: botón teléfono visible en card de pedido activo (modo home) además del BottomSheet

## Patrones panel OPS (refactor v2)
- **Paginación server-side**: API retorna `{ items, total, page, limit, totalPages }`, frontend con prev/next
- **Paginación client-side**: `ITEMS_PER_PAGE = 20`, slice del array filtrado, reset page al cambiar filtros
- **Filtros fecha OPS**: inputs type="date" con `dateFrom`/`dateTo` como query params
- **Audit log**: usar `logAudit({ action, entityType, entityId, userId, details })` de `@/lib/audit`
- **Bulk operations**: checkbox selection + sequential PATCH per item
- **Quick replies soporte**: array de strings, onClick popula el input (no auto-envía)

## Patrones config dinámica (v3)
- **Config pública puntos**: GET `/api/config/points` (sin auth) retorna pointsPerDollar, signupBonus, referralBonus, etc.
- **Config pública niveles**: GET `/api/config/levels` (sin auth) retorna levels con benefits dinámicos
- **Soft delete**: Orders tienen campo `deletedAt` — `null` = activo, `DateTime` = eliminado
- **Backup restore**: POST `/api/admin/backups` con `{ backupId }` restaura pedido soft-deleted

## Sistema de colores de marca (refactor 2026-03-18)
- **MOOVY brand (Tienda, Repartidor, Comercio, OPS)**: Rojo `#e60012` como primario
  - Dark: `#cc000f`, Darker: `#a3000c`, Light: `#ff1a2e`, Lighter: `#ff4d5e`, Lightest: `#fff1f2`
- **Marketplace (Vendedor, Listings)**: Violeta `#7C3AED` como primario
  - Dark: `#5B21B6`, Darker: `#4C1D95`, Light: `#8B5CF6`, Lighter: `#A78BFA`, Lightest: `#EDE9FE`
- **Logos**: `logo-moovy.svg` (rojo), `logo-moovy-white.svg` (blanco), `logo-moovy-purple.svg` (violeta marketplace)
- **PWA icons**: `moovy-m.png` (M roja 500x500) — único ícono de app, sin variante violeta (eliminada)
- **Font**: Plus Jakarta Sans (reemplaza Poppins, variable `--font-jakarta`)
- **AppSwitcher + AppHeader**: detectan ruta `/marketplace` via `usePathname()` y cambian logo/acento a violeta
- **ListingCard**: prop `variant="marketplace"` para violeta, default para rojo
- **Header fijo**: fondo blanco, línea roja de acento, buscador compacto al scroll con onda SVG
- **Scroll search**: usa `data-hero-search` en HeroStatic como marcador, `IntersectionObserver`-like en AppHeader

## Deuda técnica conocida
- ~~Registro merchant/driver creaban cuentas aisladas sin UserRole~~ **RESUELTO** — ahora crean USER base + rol B2B en UserRole, reusan cuenta existente si el email ya existe
- ~~Alias MERCHANT/COMERCIO inconsistente~~ **RESUELTO** — `auth-utils` resuelve aliases automáticamente
- `SellerProfile` no tiene coordenadas de ubicación (pendiente Fase 4)
- Analytics cuenta roles desde `UserRole` table (ya migrado)
- ~~Quedan ~8 extracciones de `(session.user as any).role`~~ **RESUELTO** — migrado a `hasAnyRole()` / `getUserRoles()` (solo quedan 2 en `auth.ts` que son la fuente)
- Portal COMEX eliminado (era legacy, apuntaba a rutas `/partner/` inexistentes)
- ~~Crons sin health check~~ **RESUELTO** — socket-server expone `GET /health` con estado de cada cron + `GET /api/health` en Next.js verifica DB + socket
- `logo-moovy.png` y `logo-moovy-white.png` (PNGs viejos) — aún referenciados en emails (`src/lib/email.ts`), requieren reemplazo en producción por versiones rojas actualizadas
- Imágenes eliminadas del proyecto (backup en Desktop/newimg/unused-assets): logo-jobs-v2/v3, moovyx-*.png, file/globe/next/vercel/window.svg, logo-moovy-white.png
- **`@font-face` Poppins** en globals.css: las declaraciones `@font-face` para Poppins siguen en el CSS pero ya no se usan (Next.js carga Plus Jakarta Sans via `next/font/google`). Pueden eliminarse para limpiar

## Lo que NO existe todavía
- Pago con MP en producción (requiere credenciales productivas)
- Split automático entre vendedores (requiere Marketplace API de MP)
- Múltiples ciudades (hardcodeado Ushuaia)
- App nativa iOS/Android

## Archivos agregados recientemente
- `src/app/(store)/ayuda/page.tsx` — Centro de Ayuda con FAQ acordeón (7 secciones) + contacto rápido
- `landing/page.tsx` — Marketplace hero slide (index 2, violeta), sección marketplace, card comunidad, links en menú mobile y footer
- `components/orders/RateMerchantModal.tsx` — Modal para calificar comercios (1-5 estrellas + comentario)
- `components/orders/RateSellerModal.tsx` — Modal para calificar vendedores marketplace
- `api/orders/[id]/rate-merchant/route.ts` — Endpoint POST para calificar comercio + actualizar promedio
- `api/orders/[id]/rate-seller/route.ts` — Endpoint POST para calificar vendedor + actualizar promedio
- Schema: `merchantRating`, `merchantRatingComment`, `sellerRating`, `sellerRatingComment` en Order; `rating` en Merchant
- `src/lib/moover-level.ts` — Constantes y funciones de nivel MOOVER compartidas (server/client)
- `src/store/favorites.ts` — Zustand store de favoritos con optimistic toggle
- `src/components/ui/HeartButton.tsx` — Botón corazón reutilizable para cards
- `src/app/api/favorites/route.ts` — API GET/POST/DELETE de favoritos (polimórfica: merchant/product/listing)
- Schema: modelo `Favorite` con FKs a User, Merchant, Product, Listing + unique constraints
- `src/app/api/points/route.ts` — Ahora retorna `mooverLevel`, `mooverLevelColor`, `nextLevelAt`
- Push: `notifyBuyer()` conectado en `driver/claim` (IN_DELIVERY) y `driver/status` (DELIVERED)
- `sw.js` — Fix notificationclick para soportar buyers (antes solo matcheaba `/repartidor`)
- `mi-perfil/page.tsx` — Toggle de notificaciones push en sección Configuración
- `src/lib/seller-availability.ts` — Funciones: getSellerStatus, setSellerOnline/Offline, pauseSeller, checkAndResumePaused
- `src/app/api/seller/availability/route.ts` — GET/POST disponibilidad vendedor (protegido SELLER)
- `src/app/api/cron/seller-resume/route.ts` — Cron para reanudar vendedores pausados (CRON_SECRET)
- `src/components/seller/AvailabilityToggle.tsx` — Toggle online/offline/pausa con countdown y tiempo de preparacion
- `src/lib/assignment-engine.ts` — Motor de asignacion: calculateOrderCategory, findNextEligibleDriver, startAssignmentCycle, processExpiredAssignments, driverAcceptOrder/RejectOrder
- `src/app/api/cron/assignment-tick/route.ts` — Cron para procesar timeouts de asignacion (CRON_SECRET)
- `src/components/store/ListingCard.tsx` — Ahora muestra badge de disponibilidad del vendedor
- `src/app/api/listings/route.ts` — Incluye sellerAvailability en respuesta
- `src/app/cookies/page.tsx` — Política de Cookies (7 secciones: qué son, tipos, terceros, gestión, duración, cambios, contacto)
- `src/app/terminos-vendedor/page.tsx` — Términos para Vendedores Marketplace (12 secciones: relación, requisitos CUIT, comisiones, obligaciones, prohibiciones, responsabilidad, cancelaciones, suspensión, PI, ley)
- `src/app/terminos-repartidor/page.tsx` — Términos para Repartidores (11 secciones: relación independiente, requisitos DNI/licencia/seguro, comisiones, responsabilidad, seguro Ley 24.449, conducta, suspensión)
- `src/app/terminos-comercio/page.tsx` — Términos para Comercios (11 secciones: relación intermediario, requisitos CUIT/habilitación/sanitario, comisiones, SLA timeout, responsabilidad, suspensión)
- `src/app/devoluciones/page.tsx` — Política de Devoluciones (9 secciones: Ley 24.240, plazos 10 días, proceso, reembolsos MP/MOOVER, no retornables perecederos, garantía legal)
- `src/app/cancelaciones/page.tsx` — Política de Cancelaciones (8 secciones: comprador antes/después/en camino, vendedor/comercio, automáticas timeout, reembolsos, penalidades)
- `mi-perfil/page.tsx` — Agregados links a Privacidad, Cookies y Devoluciones en sección Configuración y Ayuda
- Schema Merchant: nuevos campos `constanciaAfipUrl`, `habilitacionMunicipalUrl`, `registroSanitarioUrl`, `acceptedTermsAt`, `acceptedPrivacyAt`
- `src/app/comercio/registro/page.tsx` — Reorganizado en 3 pasos: info básica, contacto+contraseña, datos fiscales/legales (CUIT, CBU, uploads docs, checkboxes términos/privacidad)
- `src/app/api/auth/register/merchant/route.ts` — Recibe y guarda campos fiscales/legales, valida aceptación de términos
- Schema Driver: nuevos campos `cuit`, `licenciaUrl`, `seguroUrl`, `vtvUrl`, `dniFrenteUrl`, `dniDorsoUrl`, `acceptedTermsAt`
- `src/app/repartidor/registro/page.tsx` — Reorganizado en 3 pasos: datos personales+CUIT+DNI fotos, selector vehículo (bici/moto/auto/camioneta)+docs condicionales, confirmación+checkboxes términos
- `src/app/api/auth/register/driver/route.ts` — Recibe campos legales/docs, distingue bici vs motorizado, valida aceptación de términos
- Schema SellerProfile: nuevos campos `cuit`, `acceptedTermsAt`
- `src/app/vendedor/registro/page.tsx` — Wizard onboarding vendedor: paso 1 CUIT+términos, paso 2 displayName+bio, paso 3 confirmación con CTA al panel
- `src/app/api/auth/activate-seller/route.ts` — Ahora requiere body con CUIT y acceptedTerms, crea SellerProfile en transacción
- `mi-perfil/page.tsx` — Botón "Quiero vender" cambiado de onClick a Link → `/vendedor/registro?from=profile`
- `src/app/(store)/productos/[slug]/page.tsx` — Convertido a server component con generateMetadata() + JSON-LD
- `src/app/(store)/productos/[slug]/ProductDetailClient.tsx` — Lógica interactiva extraída del detalle de producto
- `src/app/(store)/marketplace/[id]/page.tsx` — generateMetadata() + JSON-LD para listings
- `src/app/(store)/marketplace/vendedor/[id]/page.tsx` — Perfil público de vendedor con listings, rating, bio y generateMetadata
- `src/components/layout/AppHeader.tsx` — Buscador global: desktop inline con dropdown, mobile overlay, debounce 300ms
- `src/app/api/config/public/route.ts` — Endpoint público de config (whitelisted keys: merchant_confirm_timeout, driver_response_timeout)
- `src/app/api/orders/route.ts` — Comisiones leídas de MoovyConfig (configurable desde OPS)
- `src/app/api/listings/route.ts` — Filtros: sellerId, minPrice, maxPrice, sortBy
- `src/app/api/merchant/earnings/route.ts` — Resumen de ganancias y comisiones para comercios
- `src/app/comercios/(protected)/pagos/page.tsx` — Sección de pagos y comisiones con KPIs y transacciones
- `src/app/comercios/(protected)/layout.tsx` — Agregado link "Pagos" en nav
- `src/app/(store)/mis-pedidos/[orderId]/page.tsx` — Tracking GPS en tiempo real con OrderTrackingMiniMap + polling 10s
- Schema Listing: nuevos campos `weightKg`, `lengthCm`, `widthCm`, `heightCm` (Float?)
- `src/components/seller/NewListingForm.tsx` — Campos de peso y dimensiones en formulario
- `src/app/vendedor/(protected)/pedidos/page.tsx` — Alerta sonora para nuevos pedidos (polling 15s + new-order.wav)
- `src/components/layout/Footer.tsx` — 6 links legales agregados (cookies, devoluciones, cancelaciones, términos por rol)
- `src/app/(store)/page.tsx` — Sección "Cómo funciona MOOVY" (3 pasos: Elegí, Pagá, Recibí)
- `src/app/(store)/productos/[slug]/ProductDetailClient.tsx` — Botón compartir por WhatsApp en detalle de producto
- `src/app/(store)/marketplace/[id]/page.tsx` — Botón compartir por WhatsApp en detalle de listing
- `src/app/(store)/productos/loading.tsx` — Loading skeleton para listado de productos
- `src/app/(store)/marketplace/loading.tsx` — Loading skeleton para marketplace
- `src/app/(store)/productos/[slug]/loading.tsx` — Loading skeleton para detalle de producto
- Schema Merchant: nuevos campos `scheduleEnabled`, `scheduleJson` (horarios de atención por día)
- `src/components/comercios/SettingsForm.tsx` — UI de horarios de atención por día (lun-dom, open/close por día)
- `src/app/comercios/actions.ts` — Nueva acción `updateMerchantSchedule()`
- `src/app/api/ops/export/route.ts` — Export CSV (orders/users/merchants) protegido ADMIN
- `src/app/api/reviews/route.ts` — API de reseñas (merchant/seller/driver) para ReviewsList
- `src/components/ui/ReviewsList.tsx` — Componente reutilizable de reseñas con resumen y listado
- `src/app/comercios/(protected)/resenas/page.tsx` — Vista de reseñas para comercios
- `src/app/vendedor/(protected)/resenas/page.tsx` — Vista de reseñas para vendedores
- `src/app/api/ops/revenue/route.ts` — API de revenue con desglose allTime/mensual/por método de pago
- `src/app/ops/(protected)/revenue/page.tsx` — Dashboard de revenue OPS con KPIs, comparación mensual, desglose
- `src/app/ops/(protected)/comercios/[id]/page.tsx` — Sección documentos en tab fiscal (constancia AFIP, habilitación, sanitario)
- `src/app/ops/(protected)/repartidores/page.tsx` — Documentación en modal de detalle (DNI, licencia, seguro, VTV, CUIT)
- `src/app/api/ops/refund/route.ts` — API de reembolso manual (marca paymentStatus REFUNDED + log en adminNotes)
- `src/app/ops/(protected)/pedidos/[id]/page.tsx` — Botón "Procesar Reembolso" con modal y motivo
- `src/app/(store)/page.tsx` — Banner social proof "X pedidos hoy en Ushuaia"
- `src/app/terminos/page.tsx` — Nuevas secciones: exención climática (s11) y resolución de disputas (s12)
- `src/hooks/useColorScheme.ts` — Hook reactivo que detecta `prefers-color-scheme` del OS (dark/light) con listener en tiempo real
- `src/app/globals.css` — Variables CSS `--rider-*` (bg, surface, surface-alt, text, glass-bg, glass-border) con overrides en `@media (prefers-color-scheme: dark)`
- Portal repartidor: dark mode automático en dashboard, BottomSheet, RiderBottomNav, ShiftSummaryModal, EarningsView, HistoryView, ProfileView, SupportView
- Portal repartidor: skeleton loaders (dashboard), pull-to-refresh, haptic feedback, animated earnings counter, empty states mejorados (EarningsView, HistoryView)
- `src/components/rider/SwipeToConfirm.tsx` — Componente slide-to-confirm para avance de estado de pedido (reemplaza botón tap)
- `src/hooks/useBattery.ts` — Hook Battery Status API: level (0-1), charging, supported. Banner en dashboard < 20%
- Portal repartidor: botón llamar cliente visible en card pedido activo (modo home), swipe-to-advance, battery warning
- `src/app/api/health/route.ts` — Health check Next.js: DB connectivity + socket-server status
- `scripts/socket-server.ts` — Health check `GET /health` con estado de cada cron (consecutiveFailures, lastRunAt, lastSuccessAt)
- Migrado `session.user.role` → `hasAnyRole()` en: support/chats/route.ts, support/chats/[id]/route.ts, driver/location/route.ts, auth/validate/route.ts
- Schema: modelo `AuditLog` con action, entityType, entityId, userId, details + índices
- `src/lib/audit.ts` — Utility `logAudit()` para registrar acciones admin
- `src/app/api/admin/orders/route.ts` — Paginación server-side (page, limit, dateFrom, dateTo, search)
- `src/app/api/admin/orders/[id]/reassign/route.ts` — POST reasignación de repartidor en pedido
- `src/app/api/ops/revenue/route.ts` — Filtros dateFrom/dateTo opcionales
- `src/app/ops/(protected)/pedidos/page.tsx` — Paginación, filtros fecha, búsqueda
- `src/app/ops/(protected)/pedidos/[id]/page.tsx` — Modal reasignación driver + info merchant
- `src/app/ops/(protected)/clientes/page.tsx` — Paginación client-side (20 por página)
- `src/app/ops/(protected)/clientes/[id]/page.tsx` — Detalle cliente con historial pedidos y stats
- `src/app/ops/(protected)/comercios/page.tsx` — Paginación + operaciones bulk (verificar/suspender)
- `src/app/ops/(protected)/vendedores/page.tsx` — Paginación + link "Abrir Panel" a detalle
- `src/app/ops/(protected)/vendedores/[id]/page.tsx` — Detalle vendedor: perfil, stats, editar bio/comisión, verificar/suspender, listings
- `src/app/ops/(protected)/revenue/page.tsx` — Export CSV + filtros fecha
- `src/app/ops/(protected)/soporte/page.tsx` — 5 respuestas rápidas predefinidas
- `src/app/ops/(protected)/repartidores/page.tsx` — Indicadores de documentación (subido/faltante) en modal
- `src/app/ops/(protected)/configuracion-logistica/page.tsx` — Simulador de costos con distancia configurable (antes hardcoded 5km)
- `src/app/ops/(protected)/moderacion/page.tsx` — Modal detalle con galería imágenes + modal rechazo con motivo
- `src/app/ops/(protected)/comisiones/page.tsx` — Botón "Marcar Pagado", CSV export, KPIs, búsqueda
- `src/app/repartidor/page.tsx` — Redirect root: auth → dashboard, no auth → login
- `src/app/vendedor/page.tsx` — Redirect root: auth → dashboard, no auth → registro
- `src/app/comercios/page.tsx` — Redirect root: auth → dashboard, no auth → login
- `src/app/ops/page.tsx` — Redirect root: auth → dashboard, no auth → login
- `src/components/rider/views/SettingsView.tsx` — Configuración repartidor: tema (auto/light/dark), sonido, vibración, app de mapas (Google/Waze), alerta batería configurable, auto-desconexión
- Dashboard repartidor rediseñado: layout Status-First, hero connect button, animated earnings counter, auto-expand map con pedido activo, trend card motivacional, searching animation
- **Block B OPS - Merchant Detail Upgrade (2026-03-15)**:
  - `src/app/ops/(protected)/comercios/[id]/page.tsx` — REESCRITO: 7 tabs (Info, Fiscal, Pedidos, Productos, Ganancias, Horarios, Notas)
  - Nuevos tabs: **Pedidos** (tabla historial), **Productos** (grid), **Ganancias** (KPI revenue), **Horarios** (schedule editor)
  - Nuevos botones header: Toggle Active/Suspended, Toggle Open/Closed
  - 5º stat card: Rating con star icon
  - Sidebar additions: Commission rate editor + MercadoPago connection status
  - Lazy loading: Tabs fetch data on-demand (orders, products, earnings)
  - Schedule editor: Día-por-día con toggle enable/disable + time inputs open/close
  - API updates: `/api/admin/merchants/[id]` soporta PATCH para commissionRate, scheduleEnabled, scheduleJson
  - API updates: `/api/admin/orders` soporte merchantId filter
  - API updates: `/api/merchant/earnings` soporte merchantId para ADMIN queries
  - Merchant interface extended: `commissionRate`, `rating`, `scheduleEnabled`, `scheduleJson`, `mpAccessToken`
- **Block A OPS - Config Dinámica (2026-03-15)**:
  - `src/app/api/config/points/route.ts` — API pública de config de puntos (lee de PointsConfig DB)
  - `src/app/api/config/levels/route.ts` — API pública de niveles MOOVER con beneficios dinámicos
  - `src/app/moover/page.tsx` — REESCRITO: valores dinámicos (pointsPerDollar, signupBonus, referralBonus, etc.)
  - `src/app/api/config/public/route.ts` — Whitelist expandida (5 keys nuevas de puntos)
- **Block C OPS - Backups + Soft Delete (2026-03-15)**:
  - Schema Order: campo `deletedAt` (DateTime?) + índice para soft delete
  - Schema OrderBackup: índices en backupName, deletedAt, orderId
  - `src/app/api/admin/orders/route.ts` — DELETE ahora es soft delete (setea deletedAt), GET excluye eliminados
  - `src/app/api/admin/backups/route.ts` — API para listar backups (paginado, search) y restaurar pedidos
  - `src/app/ops/(protected)/backups/page.tsx` — Visor de copias de seguridad con detalle y restauración
  - `src/components/ops/OpsSidebar.tsx` — Link "Backups" en sección Sistema

## Security Hardening (2026-03-19)
- **Auditoría de seguridad integral**: 30 vulnerabilidades identificadas y corregidas
- `src/lib/env-validation.ts` — **NUEVO**: Validación de env vars al startup + `verifyBearerToken()` timing-safe
- `scripts/socket-server.ts` — Eliminados secrets hardcodeados (fail-fast), CORS restringido a whitelist, timing-safe en /emit
- `src/app/api/debug-cookies/route.ts` — Deshabilitado (retorna 404)
- `src/app/api/debug-session/route.ts` — Deshabilitado (retorna 404)
- `src/app/api/auth/register/route.ts` — Password policy unificada con `validatePasswordStrength()`, eliminado console.log con PII
- `src/app/api/auth/reset-password/route.ts` — Password policy unificada
- `src/app/api/auth/change-password/route.ts` — Password policy unificada
- `next.config.ts` — CSP: eliminado `unsafe-eval`, agregado `base-uri` y `form-action`
- `src/app/api/cron/assignment-tick/route.ts` — Timing-safe token comparison via `verifyBearerToken()`
- `src/app/api/cron/seller-resume/route.ts` — Timing-safe token comparison
- `src/app/api/cron/merchant-timeout/route.ts` — Timing-safe token comparison
- `src/app/api/cron/scheduled-notify/route.ts` — Timing-safe token comparison
- Rate limiting agregado: config/public, config/points, config/levels, reviews, push/subscribe
- `src/app/api/webhooks/mercadopago/route.ts` — MP_WEBHOOK_SECRET requerido siempre; UUID fallback en idempotency
- `src/app/api/ops/refund/route.ts` — Validación de monto (>0, <=total), motivo requerido, audit logging
- `src/app/api/upload/route.ts` — Magic bytes validation, whitelist extensiones, límite 10MB
- `src/app/api/orders/[id]/rate-merchant/route.ts` — Transacción serializable (fix race condition TOCTOU)
- `src/app/api/orders/[id]/rate-seller/route.ts` — Transacción serializable (fix race condition TOCTOU)
- `src/app/api/driver/location/route.ts` — Validación de velocidad GPS (max 200 km/h)
- `docker-compose.yml` — Credenciales DB vía env vars
- `.github/workflows/security.yml` — **NUEVO**: CI pipeline con npm audit, TypeScript check, Gitleaks
- `src/app/api/admin/orders/[id]/reassign/route.ts` — Audit logging en reasignación
- `src/app/api/ops/export/route.ts` — Audit logging en exports CSV
- `src/app/api/profile/delete/route.ts` — **NUEVO**: Endpoint eliminación de cuenta (requisito Google Play)
- `src/app/api/settings/route.ts` — Eliminados console.log con datos sensibles
- `public/sw.js` — Validación de URLs en notificaciones push (prevent phishing redirect)

### Patrones de seguridad establecidos
- **Validación de tokens cron**: SIEMPRE usar `verifyBearerToken()` de `@/lib/env-validation` en endpoints protegidos con CRON_SECRET
- **Passwords**: SIEMPRE usar `validatePasswordStrength()` de `@/lib/security` — NUNCA `password.length < 6`
- **Audit logging**: SIEMPRE agregar `logAudit()` en operaciones admin sensibles (refund, reassign, delete, export)
- **Rate limiting**: SIEMPRE agregar `applyRateLimit()` en endpoints públicos
- **Uploads**: Validar magic bytes + extensión + tamaño ANTES de procesar con sharp

### Deuda técnica de seguridad resuelta
- ~~Secrets hardcodeados en socket-server.ts~~ **RESUELTO**
- ~~Debug endpoints expuestos~~ **RESUELTO** (deshabilitados)
- ~~Password policy inconsistente (6 vs 8 chars)~~ **RESUELTO** (unificado en 8+ con validatePasswordStrength)
- ~~CORS Socket.IO origin: true~~ **RESUELTO** (whitelist)
- ~~CSP con unsafe-eval~~ **RESUELTO** (eliminado)
- ~~Timing attacks en cron tokens~~ **RESUELTO** (timingSafeEqual)
- ~~Webhook MP sin validación si falta secret~~ **RESUELTO** (requerido siempre)
- ~~Refund sin validación de monto~~ **RESUELTO** (validación completa + audit)
- ~~Upload sin validación de contenido real~~ **RESUELTO** (magic bytes)
- ~~Race condition en ratings~~ **RESUELTO** (transacciones serializables)
- ~~Sin eliminación de cuenta~~ **RESUELTO** (POST /api/profile/delete)

### Deuda técnica de seguridad pendiente
- Play Integrity API (necesario para app nativa Android)
- Migrar rate limiter a Redis para multi-instancia
- Encriptación at-rest para columnas sensibles (CUIT, CBU)
- Logger estructurado (Pino/Winston) reemplazando console.log
- Mecanismo de revocación de sesiones JWT (token blacklist)
- Botón "Eliminar mi cuenta" en UI de mi-perfil (endpoint ya existe)

## Sistema de Paquetes B2B Pro (2026-03-19)
- **PackagePurchase model**: Registra compras de catálogos por comercios (tipo, monto, estado pago, estado import, MP refs)
- **PackagePricingTier model**: Precios escalonados para compras custom (Pack x10, x25, x50 con precio/item)
- **Category**: Nuevos campos `starterPrice` (Float?) y `isStarter` (Boolean) para paquetes starter curados
- **Flujo de compra**: Comercio → elige paquete → POST `/api/merchant/packages/purchase` → crea preferencia MP → redirect a MP → webhook confirma → auto-import
- **Auto-import**: Al confirmar pago, los productos se clonan automáticamente a la tienda del comercio (sin intervención manual)
- **Seguridad**: `/api/merchant/import` ahora verifica que el comercio tenga una `PackagePurchase` aprobada o `MerchantCategory`/`MerchantAcquiredProduct`
- **Compras gratis**: Soporte para promoCode "FUNDADOR" y compras con amount=0 (auto-import inmediato sin MP)
- **Webhook MP**: Detecta paquetes por external_reference que empieza con `pkg_`, procesa pago y auto-import
- **3 opciones UX**: Paquete Completo (por rubro), Armar tu propio (custom builder con pricing tiers), Mis Paquetes (gestión)
- **Buscador global**: En catálogo de rubros y en custom builder
- **Upselling**: Sticky bar con tier actual + sugerencia del siguiente tier más barato
- **Historial de compras**: `/comercios/paquetes/historial` con stats y lista de todas las compras
- **Resultado de compra**: `/comercios/paquetes/resultado` con polling de status para MP async
- **OPS Ventas B2B**: `/ops/ventas-paquetes` con KPIs (revenue, comercios, productos importados) y tabla de ventas
- **Checkout legacy**: `/comercios/checkout` redirige al nuevo flujo

### Archivos nuevos/modificados (Paquetes B2B)
- `src/app/api/merchant/packages/purchase/route.ts` — **NUEVO**: Crear compra + preferencia MP + auto-import para gratis
- `src/app/api/merchant/packages/catalog/route.ts` — **NUEVO**: Catálogo público con tiers, owned, historial
- `src/app/api/merchant/packages/history/route.ts` — **NUEVO**: Historial de compras del comercio
- `src/app/api/admin/package-sales/route.ts` — **NUEVO**: Vista admin de todas las ventas B2B
- `src/app/api/merchant/import/route.ts` — **REESCRITO**: Verificación de pago/adquisición antes de importar
- `src/app/api/webhooks/mercadopago/route.ts` — Agregado handler para paquetes (external_ref `pkg_*`)
- `src/app/comercios/(protected)/adquirir-paquetes/page.tsx` — **REESCRITO**: 3 opciones + buscador + custom builder + upselling
- `src/app/comercios/(protected)/paquetes/resultado/page.tsx` — **NUEVO**: Resultado de compra con polling
- `src/app/comercios/(protected)/paquetes/historial/page.tsx` — **NUEVO**: Historial de compras con stats
- `src/app/ops/(protected)/ventas-paquetes/page.tsx` — **NUEVO**: Dashboard ventas B2B para admin
- `src/app/comercios/(protected)/checkout/page.tsx` — Redirect legacy al nuevo flujo
- Schema: Modelos `PackagePurchase`, `PackagePricingTier` + campos `starterPrice`/`isStarter` en Category

### Patrones paquetes establecidos
- **Compra paquete**: POST `/api/merchant/packages/purchase` con `{ purchaseType, categoryId?, productIds?, promoCode? }`
- **Tipos de compra**: `package` (rubro completo), `starter` (curado), `custom` (mix de productos), `individual` (uno solo)
- **Auto-import**: función `autoImportProducts()` exportada desde purchase/route.ts, usada por webhook
- **Verificación en import**: SIEMPRE verificar `PackagePurchase` aprobada O `MerchantCategory`/`MerchantAcquiredProduct` antes de importar
- **External reference MP**: Paquetes usan `pkg_{uuid}` para distinguirse de orders en el webhook

## Marketplace UX Overhaul (2026-03-19)
- **Hero compacto**: Reducido de ~400px a ~140px en mobile. Título + stats inline, sin búsqueda duplicada (se usa la del sticky bar debajo)
- **Búsqueda única**: Barra de búsqueda sticky debajo del hero (no en el hero), evita duplicación con AppHeader search
- **Categorías con contadores**: `/api/categories-public` ahora retorna `listingCount` con `_count` de Prisma
- **Destacados reales**: Nuevo endpoint `/api/listings/featured` ordena por `seller.isVerified` desc → `seller.rating` desc → `seller.totalSales` desc (no más "newest = featured")
- **Social proof en cards**: API `/api/listings` ahora retorna `soldCount` y `favCount` via `_count` de Prisma. ListingCard muestra "X vendidos" y badge "Últimas N" cuando stock ≤ 3
- **Detalle violet premium**: Nuevo `ListingDetailClient.tsx` client component con galería swipe (touch), dots, thumbnails, breadcrumb, botón "Agregar al carrito" funcional, trust signals, badge "Últimas unidades", share nativo (Web Share API con fallback WhatsApp)
- **Sección "Más de este vendedor"**: Server component fetchea `getRelatedListings()` (mismo seller, excluye current, take 4)
- **Perfil vendedor violet**: Stats en cards (rating, ventas, publicaciones, miembro desde), glass card, badges verificado/online, stagger animations en listings
- **Empty states inteligentes**: Sugieren categorías con publicaciones, CTA "Publicar algo", textos contextuales según búsqueda vs categoría vacía
- **CTA vendedor integrado**: Mini-banner mobile (no intrusivo), botón "Vender" en hero desktop, CTA scroll-reveal para desktop
- **Loading skeletons**: Detalle (`[id]/loading.tsx`) y listado (`loading.tsx`) actualizados para matchear nuevos layouts

### Archivos nuevos/modificados
- `src/app/api/listings/featured/route.ts` — **NUEVO**: Endpoint de destacados reales (por calidad de vendedor)
- `src/app/(store)/marketplace/[id]/ListingDetailClient.tsx` — **NUEVO**: Client component del detalle (galería, carrito, share)
- `src/app/(store)/marketplace/[id]/loading.tsx` — **NUEVO**: Skeleton del detalle
- `src/app/api/categories-public/route.ts` — Ahora retorna `listingCount`
- `src/app/api/listings/route.ts` — Ahora retorna `soldCount`, `favCount` via `_count`
- `src/app/(store)/marketplace/page.tsx` — **REESCRITO**: Hero compacto, búsqueda sticky, chips con contador, featured real, empty states, CTA integrado
- `src/app/(store)/marketplace/[id]/page.tsx` — **REESCRITO**: Server component + client component, related listings
- `src/app/(store)/marketplace/vendedor/[id]/page.tsx` — **REESCRITO**: Tema violet, stats cards, stagger animations
- `src/components/store/ListingCard.tsx` — Marketplace variant: social proof, low stock badge, tamaños ajustados
- `src/app/(store)/marketplace/loading.tsx` — Actualizado para nuevo layout compacto

### Sistema de categorías con scope (2026-03-19)
- Schema Category: nuevo campo `scope` (String, default "BOTH") — valores: `STORE`, `MARKETPLACE`, `BOTH`
- `/api/categories-public?scope=STORE|MARKETPLACE` filtra categorías por scope (incluye "BOTH" automáticamente)
- Home + Productos filtran `scope: { in: ["STORE", "BOTH"] }`
- Marketplace filtra `scope: { in: ["MARKETPLACE", "BOTH"] }`
- Panel OPS Categorías: selector visual de scope (Tienda/Marketplace/Ambos) al crear/editar
- Panel OPS: badges de scope (rojo=Tienda, violeta=Marketplace, azul=Ambos) + contadores de products y listings
- `src/lib/db.ts` → `getAllCategories(scope?)` acepta filtro opcional
- **IMPORTANTE**: Después de agregar el campo `scope`, ejecutar `npx prisma db push` para regenerar el client

### Patrones marketplace establecidos
- **Detalle split**: Server component (SEO, data, JSON-LD) + Client component (interacciones, carrito, galería)
- **Featured logic**: Ordenar por `isVerified` → `rating` → `totalSales`, nunca usar "newest" como "featured"
- **Social proof fields**: `soldCount` y `favCount` disponibles en `/api/listings` response
- **Low stock threshold**: stock ≤ 3 muestra badge "Últimas N" en card y detalle
- **Web Share API**: Usar `navigator.share` con fallback a WhatsApp deep link
- **Categorías con count**: Siempre mostrar `listingCount` en chips y selects
- **Category scope**: Tienda usa STORE, Marketplace usa MARKETPLACE, compartidas usan BOTH
