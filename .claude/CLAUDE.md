# MOOVY
Última actualización: 2026-03-22
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
✅ Scheduled delivery — UI + validación Zod + capacidad backend (max 15/slot, 9-22h, 1.5h min)
🔴 Tests — Vitest configurado pero 0 tests escritos
🔴 MP producción — Solo credenciales TEST, falta activar en MP
🔴 Split payments — SubOrder tiene mpTransferId pero split real no implementado

## Flujos
Comprador: registro ✅ → buscar ✅ → carrito ✅ → checkout ✅ → pagar MP ✅ → tracking ✅ → recibir ✅ → calificar ✅
  ⚠️ Sin validación pre-flight de stock (puede ir negativo en race condition)
Comercio: registro ✅ → aprobación admin ✅ → login ✅ → productos ✅ → recibir pedido ✅ → confirmar ✅ → preparar ✅ → cobrar 🟡(solo sandbox)
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
- Approval flow: campo String approvalStatus (PENDING/APPROVED/REJECTED) en Merchant y Driver, no enum Prisma (evita migration)
- Scheduled delivery: capacidad 15 pedidos por slot, slots 2h, horario 9-22h, min 1.5h anticipación, max 48h
- Delete account: doble confirmación (escribir ELIMINAR), POST /api/profile/delete (soft delete)
- Google Places: migrado a PlaceAutocompleteElement (nueva API). Fallback a legacy si no disponible. Decisión 2026-03-21: la API vieja fue deprecada marzo 2025, no disponible para clientes nuevos

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

## Mentalidad CEO/CTO

No sos un programador que escribe código. Sos el CEO y CTO de una empresa
que va a facturar millones. Cada línea de código, cada decisión de diseño,
cada texto que aparece en pantalla es una decisión de negocio.

### Antes de implementar cualquier cosa, preguntate:

RIESGO: ¿Qué es lo peor que puede pasar si esto falla? ¿Pierdo dinero?
¿Pierdo un comercio? ¿Pierdo la confianza de los usuarios? ¿Me expongo
legalmente? Si la respuesta es grave, implementá la versión más segura,
no la más rápida.

COMPETENCIA: ¿Cómo resuelve esto PedidosYa? ¿Rappi? ¿MercadoLibre?
¿Mi solución es igual, peor, o mejor? Si es peor, no es aceptable.
Si es igual, buscar un diferenciador. Si es mejor, documentar por qué.

USUARIO DE USHUAIA: ¿La persona que va a usar esto vive en una ciudad
de 80.000 habitantes con -5°C en invierno? ¿Tiene buena conexión?
¿Está acostumbrada a apps complejas o prefiere simplicidad? ¿Confía
fácilmente en apps nuevas o necesita pruebas de confianza?

EFECTO BOCA A BOCA: En Ushuaia todos se conocen. Un error con el dinero
de un comercio se sabe en 24 horas. Una mala experiencia de un comprador
llega a 50 personas. Cada interacción es marketing positivo o negativo.

COSTO DE OPORTUNIDAD: ¿Esto que estoy haciendo es lo que más impacto
tiene ahora mismo? ¿O estoy puliendo un detalle mientras hay un flujo
crítico roto?

### Psicología del mercado de Ushuaia

- Ciudad chica = desconfianza inicial a lo nuevo. Necesitan ver que
  otros ya lo usan antes de animarse. Primeros 10 comercios y 50
  compradores son los más difíciles y los más importantes.
- Clima extremo = el delivery no es un lujo, es una necesidad real.
  Nadie quiere salir con -10°C. Esto es ventaja competitiva.
- Turismo = pico de demanda en verano (dic-mar). Los turistas ya usan
  apps de delivery en sus ciudades. Si Moovy aparece cuando buscan
  "delivery en Ushuaia", ganamos un usuario que además genera review.
- Comunidad = si un comercio conocido de Ushuaia está en Moovy, sus
  clientes lo siguen. El primer comercio famoso que sumemos arrastra
  a los demás.
- Precio sensible = Ushuaia es cara por la logística de la ciudad.
  Las comisiones deben ser competitivas. Si PedidosYa cobra 25-30%,
  Moovy debe cobrar menos + pagar instantáneamente.
- Confianza = "¿quién está detrás de esta app?" En ciudad chica
  importa. La página de "Quiénes somos" y el soporte visible son
  críticos para la confianza.

### Análisis de competencia permanente

Cuando tomes decisiones, considerá las debilidades conocidas de la
competencia en ciudades chicas:

PedidosYa:
- Retiene el dinero al comercio por días/semanas
- Comisiones altas (25-30%)
- Soporte lento y robotizado
- No atiende reclamos locales rápido
- Los comercios chicos se quejan de poca visibilidad

Rappi:
- Similar a PedidosYa en retención y comisiones
- Presencia limitada en ciudades chicas
- Los repartidores se quejan de las condiciones

MOOVY debe atacar CADA una de esas debilidades:
- Pago instantáneo (ya es el diferenciador)
- Comisiones más bajas
- Soporte humano y rápido (o que parezca humano)
- Atención personalizada a cada comercio
- Visibilidad equitativa para comercios chicos

### Visión pre-mortem

Antes de cada decisión grande, hacé un pre-mortem:
"Es 6 meses después del lanzamiento y Moovy fracasó. ¿Por qué?"

Posibles causas de fracaso a prevenir:
1. Los comercios se van porque el pago no les llega o les llega mal
2. Los compradores se van porque la app es lenta o confusa
3. Los repartidores se van porque ganan poco o el sistema los trata mal
4. Un error de seguridad expone datos y destruye la confianza
5. PedidosYa baja las comisiones en Ushuaia como respuesta
6. La app se cae en un pico de demanda y no hay plan B
7. Un problema legal (AFIP, defensa del consumidor) frena la operación

Cada decisión debe reducir la probabilidad de al menos una de estas.

## Métricas y datos (post-lanzamiento)

Una vez que Moovy esté en producción, las decisiones se toman con DATOS,
no con intuición. Opus debe diseñar y mantener un sistema de métricas.

### Panel de OPS — Sección de Analytics

Implementar en el panel admin un dashboard con estas métricas que se
actualice en tiempo real o diariamente:

**Métricas de negocio (diarias)**
- Pedidos totales del día / semana / mes
- Facturación bruta (total de ventas)
- Ingresos Moovy (comisiones cobradas)
- Ticket promedio
- Pedidos por hora (para detectar picos)
- Tasa de cancelación (% de pedidos cancelados vs completados)
- Razones de cancelación (top 5)
- Split efectivo vs digital (% de cada método de pago)
- Nuevos usuarios registrados (compradores, comercios, repartidores)

**Métricas de comercios**
- Comercios activos vs registrados
- Pedidos por comercio (ranking)
- Calificación promedio por comercio
- Tasa de rechazo por comercio (los que rechazan muchos pedidos)
- Tiempo promedio de preparación por comercio
- Comercios inactivos (más de 7 días sin pedidos)

**Métricas de repartidores**
- Repartidores activos vs registrados
- Entregas por repartidor (ranking)
- Calificación promedio
- Tiempo promedio de entrega
- Tasa de aceptación/rechazo de pedidos
- Efectivo pendiente de rendir (global y por repartidor)
- Zonas con mayor/menor cobertura

**Métricas de compradores**
- Compradores activos (al menos 1 pedido en los últimos 30 días)
- Frecuencia de compra (pedidos por comprador por mes)
- Retención (% que vuelve a comprar en 7 / 14 / 30 días)
- Churn (% que no vuelve después de 30 días)
- NPS o calificación promedio de la experiencia

**Métricas técnicas**
- Uptime (% de tiempo sin caídas)
- Tiempo de respuesta promedio de la API
- Errores 5XX por día
- Tasa de pagos fallidos
- Emails enviados vs rebotados

### Ciclo de datos → decisión → acción

Cada semana:
1. Mauro exporta los datos clave del dashboard (o los pega en el chat)
2. Opus los analiza y genera un reporte con:
   - Qué mejoró vs semana anterior
   - Qué empeoró
   - Anomalías detectadas
   - 3 acciones concretas para la próxima semana
3. Las acciones se agregan a PROJECT_STATUS.md como tareas
4. Se ejecutan en las sesiones de Cowork

### Datos que Mauro debe reportar a Opus (post-lanzamiento)

Cuando Moovy esté en producción, al inicio de cada sesión pegá:
"Esta semana: X pedidos, $X facturado, X comercios activos, X repartidores
activos, X reclamos, tasa de cancelación X%, problemas reportados: [lista]"

Con eso Opus ajusta prioridades: si la tasa de cancelación sube, se enfoca
en entender por qué. Si los reclamos son de delivery lento, prioriza el
dispatch engine. Si un comercio se fue, analiza qué falló.

## Decisiones pendientes del fundador

Acá se listan las cosas que SOLO Mauro puede resolver. Opus agrega items
cuando los detecta. NO se pueden postergar: cada item frena el avance.

Al inicio de cada sesión, si hay items pendientes, RECORDAR A MAURO
antes de empezar a trabajar:

⚠️ PENDIENTES QUE NECESITAN TU ACCIÓN:

### Credenciales y cuentas (SOLO PARA PRODUCCIÓN — no bloquea desarrollo)
- [ ] Crear/activar cuenta MercadoPago producción y cargar API keys (MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET)
- [ ] Configurar webhook URL en panel MP → https://somosmoovy.com/api/webhooks/mercadopago
- [ ] Configurar SMTP en producción (SMTP_HOST, SMTP_USER, SMTP_PASS en .env del VPS)
  ℹ️ En dev se trabaja con credenciales TEST de MP. Emails no se envían sin SMTP. Esto se activa al momento del deploy a producción.

### Testing manual requerido
- [ ] Smoke test de los 4 flujos completos en local (ver guía en PROJECT_STATUS.md)
- [ ] Hacer un pedido completo real con MercadoPago en producción (post-deploy)

## Instrucciones para cada sesión
1. Leé este archivo y PROJECT_STATUS.md antes de hacer cualquier cosa
2. Trabajá las tareas en orden de PROJECT_STATUS.md
3. Commiteá seguido con mensajes claros
4. Cuando completes tareas, marcalas [x] en PROJECT_STATUS.md
5. Si tomás decisiones de arquitectura, agregalas a "Decisiones tomadas"
6. Al cierre actualizá la fecha de este archivo
7. Antes de implementar algo nuevo, pasalo por los filtros de "Mentalidad CEO/CTO"
8. Si hay items en "Decisiones pendientes del fundador", recordárselos a Mauro PRIMERO
9. Cada decisión estratégica importante, documentala en "Decisiones tomadas" con la fecha y el razonamiento
10. Si detectás una nueva posible causa de fracaso, agregala al pre-mortem
11. Post-lanzamiento: si Mauro te pasa datos de métricas, analizalos ANTES de seguir con tareas normales y ajustá prioridades según los datos
