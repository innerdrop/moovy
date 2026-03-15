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
- Sistema multi-rol: un usuario puede tener USER + SELLER + DRIVER simultáneamente
- Roles almacenados en tabla `UserRole` (no en `User.role`)
- **SIEMPRE** verificar roles con `hasAnyRole(session, ["ROL"])` de `@/lib/auth-utils`
- **NUNCA** usar `session.user.role` directo — es campo legacy

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

## Deuda técnica conocida
- `SellerProfile` no tiene coordenadas de ubicación (pendiente Fase 4)
- Analytics cuenta roles desde `UserRole` table (ya migrado)
- Quedan ~8 extracciones de `(session.user as any).role` en support/chats y driver/location (no son comparaciones, son extracciones para lógica condicional)
- Portal COMEX eliminado (era legacy, apuntaba a rutas `/partner/` inexistentes)
- Crons corren dentro del socket-server (si se cae, todos mueren) — necesita health check independiente

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
