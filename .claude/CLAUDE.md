# MOOVY
Última actualización: 2026-03-21
Marketplace + tienda + delivery en Ushuaia, Argentina (80k hab). El comercio cobra al instante.
Stack: Next.js 16 + React 19 + TS + Tailwind 4 + Prisma 5 + PostgreSQL/PostGIS + NextAuth v5 (JWT) + Socket.IO + Zustand
Hosting: VPS Hostinger. Deploy: PowerShell scripts → SSH. Dominio: somosmoovy.com

## Estructura
```
src/app/(store)/        Tienda pública + buyer auth pages
src/app/repartidor/     Portal driver (protected + registro/login)
src/app/comercios/      Portal merchant (protected + registro/login)
src/app/vendedor/       Portal seller marketplace (protected + registro)
src/app/ops/            Panel admin/operaciones (protected)
src/app/api/            ~170 route handlers (auth, orders, driver, merchant, seller, admin, webhooks, cron)
src/components/         ~80 componentes (layout, rider, seller, comercios, ops, orders, ui, checkout, home)
src/lib/                ~37 utils (auth, MP, email, assignment-engine, points, shipping, security)
src/hooks/              12 hooks (battery, colorScheme, geolocation, socket, push, realtimeOrders)
src/store/              4 Zustand stores (cart, favorites, toast, pointsCelebration)
scripts/                PowerShell (start/finish/publish/sync) + socket-server.ts + seeds
prisma/schema.prisma    ~30 modelos con PostGIS
```

## Modelos clave
User → multi-rol via UserRole (USER/ADMIN/COMERCIO/DRIVER/SELLER) + points + referrals + soft delete
Merchant → tienda física, schedule, docs fiscales (CUIT/AFIP/habilitación), commissionRate 8%, MP OAuth
SellerProfile → vendedor marketplace, commissionRate 12%, rating, MP OAuth
Driver → vehículo, docs (DNI/licencia/seguro/VTV), PostGIS ubicacion, rating
Order → multivendor via SubOrder, MP integration (preference/payment/webhook), soft delete, assignment cycle
Listing → marketplace items con peso/dimensiones, stock, condition
PackagePurchase → B2B paquetes de catálogo para comercios
Payment/MpWebhookLog → registro de pagos MP con idempotency
PendingAssignment/AssignmentLog → ciclo de asignación de repartidores
StoreSettings/MoovyConfig/PointsConfig → config dinámica singleton

## Módulos
✅ Auth — NextAuth v5 JWT, multi-rol, rate limit login, password policy 8+ chars
✅ Registro — Buyer/Merchant/Driver/Seller con docs y términos legales
✅ Catálogo — Productos + Listings con categorías scoped (STORE/MARKETPLACE/BOTH)
✅ Carrito — Zustand multi-vendor con groupByVendor()
✅ Checkout — Cash + MercadoPago Checkout Pro, puntos como descuento
✅ Pagos MP — Webhook HMAC + idempotency + auto-confirm + stock restore on reject
✅ Assignment Engine — PostGIS + Haversine fallback, ciclo timeout/retry por driver
✅ Tracking — GPS polling cada 10s + OrderTrackingMiniMap (dynamic import)
✅ Push — Web Push VAPID, notifyBuyer() en cada cambio de estado
✅ Socket.IO — Real-time para pedidos, driver tracking, admin live feed
✅ Ratings — Merchant + Seller + Driver con promedios atómicos (serializable tx)
✅ Favoritos — Polymorphic (merchant/product/listing) con optimistic update
✅ Puntos MOOVER — Earn/burn/bonus/referral con niveles dinámicos
✅ Paquetes B2B — Compra de catálogos por comercios (completo/starter/custom)
✅ Email — Nodemailer con ~50 templates, requiere SMTP configurado
✅ Seguridad — Rate limiting, timing-safe tokens, magic bytes upload, CSP, audit log
✅ SEO — generateMetadata() + JSON-LD en detalle producto/listing/vendedor
🟡 Dark mode rider — CSS vars + prefers-color-scheme, funciona con inconsistencias menores
🟡 Scheduled delivery — UI existe, backend parcial (slot picker sin validación disponibilidad)
🔴 Tests — Vitest configurado pero 0 tests escritos
🔴 MP producción — Solo credenciales TEST, falta activar en MP
🔴 Split payments — SubOrder tiene mpTransferId pero split real no implementado

## Flujos
Comprador: registro ✅ → buscar ✅ → carrito ✅ → checkout ✅ → pagar MP ✅ → tracking ✅ → recibir ✅ → calificar ✅
  ⚠️ Sin validación pre-flight de stock (puede ir negativo en race condition)
Comercio: registro ✅ → login ✅ → productos ✅ → recibir pedido ✅ → confirmar ✅ → preparar ✅ → cobrar 🟡(solo sandbox)
  ⚠️ No hay flujo formal de aprobación (solo toggle isActive en OPS)
Repartidor: registro ✅ → login ✅ → conectarse ✅ → recibir oferta ✅ → aceptar ✅ → retirar ✅ → entregar ✅ → cobrar 🟡
Admin: login ✅ → dashboard ✅ → usuarios ✅ → pedidos ✅ → revenue ✅ → config ✅ → export CSV ✅

## Seguridad
- Rate limiting: auth 5/15min, orders 10/min, upload 10/min, search 30/min, config 30/min
- CORS Socket.IO: whitelist (localhost + somosmoovy.com)
- CSP: sin unsafe-eval, base-uri self, form-action self
- Timing-safe: cron tokens via verifyBearerToken()
- Uploads: magic bytes + extensión + 10MB max + sharp compression
- Audit log: refund, reassign, export, delete
- HMAC: MP webhook siempre validado, debug endpoints deshabilitados

## Decisiones tomadas
- Auth: JWT 7 días, credentials-only (no OAuth social)
- Pagos: MP Checkout Pro (redirect), no Checkout API (inline)
- DB: PostgreSQL + PostGIS Docker puerto 5436, Prisma db push (NUNCA migrate dev)
- Comisiones: 8% merchant, 12% seller, 80% repartidor (configurable en MoovyConfig/StoreSettings)
- Delivery fee: base + por km, calculado dinámicamente con logistics-config
- Multi-vendor: SubOrder por vendedor, un solo pago al comprador
- Colores: Rojo #e60012 (MOOVY), Violeta #7C3AED (Marketplace)
- Font: Plus Jakarta Sans (variable --font-jakarta)

## Reglas de negocio
- Comisión MOOVY: 8% merchant, 12% seller, configurable desde MoovyConfig
- Repartidor: 80% del delivery fee (riderCommissionPercent en StoreSettings)
- Puntos: 1 punto por $1 gastado, $0.01 por punto, max 50% descuento
- Signup bonus: 100 puntos, referral: 200 puntos
- Pedido mínimo: configurable por merchant (minOrderAmount)
- Radio de entrega: configurable por merchant (deliveryRadiusKm, default 5km)
- Timeout merchant: configurable (merchant_confirm_timeout en MoovyConfig)
- Timeout driver: configurable (driver_response_timeout en MoovyConfig)

## Variables de entorno
DB: DATABASE_URL, SHADOW_DATABASE_URL
Auth: AUTH_SECRET, NEXTAUTH_SECRET, CRON_SECRET
App: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SOCKET_URL, SOCKET_PORT, SOCKET_INTERNAL_URL
MP: MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET, MP_APP_ID
Email: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL
Push: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
Maps: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID

## Scripts
start.ps1: crear rama | finish.ps1: cerrar rama y merge a develop | publish.ps1: push + dump DB
devmain.ps1: deploy a producción | sync.ps1: pull develop

## Reglas de ejecución
1. NO abrir browser, NO npm run dev/build, NO pruebas visuales
2. Verificar TS con `npx tsc --noEmit` (targeted si OOM)
3. Crear rama nueva antes de tocar código. NUNCA trabajar en develop
4. Mostrar plan → esperar aprobación → ejecutar → mostrar archivos modificados + tsc
5. Ignorar 3 errores pre-existentes: `--incremental`, `session.user` ×2
6. Al cerrar rama: actualizar CLAUDE.md + PROJECT_STATUS.md en el commit
7. Rutas con paréntesis: `git add "src/app/(store)/page.tsx"` (PowerShell requiere comillas)

## Instrucciones para cada sesión
1. Leé este archivo y PROJECT_STATUS.md antes de hacer cualquier cosa
2. Trabajá las tareas en orden de PROJECT_STATUS.md
3. Commiteá seguido con mensajes claros
4. Cuando completes tareas, marcalas [x] en PROJECT_STATUS.md
5. Si tomás decisiones de arquitectura, agregalas a "Decisiones tomadas"
6. Al cierre actualizá la fecha de este archivo
