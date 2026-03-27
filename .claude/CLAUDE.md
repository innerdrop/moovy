# MOOVY
Última actualización: 2026-03-26 (smoke test flows 2/3/4: 12 fixes seguridad + race conditions)
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
DriverLocationHistory → GPS trace por orden (batch save, cleanup 30d, admin trace)
MerchantLoyaltyConfig → tiers de fidelización (BRONCE/PLATA/ORO/DIAMANTE, comisión dinámica)

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
✅ Páginas institucionales — /quienes-somos, /terminos (14 cláusulas), /comisiones (transparencia + comparación)
✅ Analytics OPS — Dashboard con KPIs negocio/merchants/drivers/buyers, API por período, auto-refresh
✅ Soporte MOOVY — Chat live con operadores, auto-asignación, mensaje sistema, canned responses, portal operador
✅ Chat de Pedido — Comprador↔Comercio, Comprador↔Vendedor, Comprador↔Repartidor, respuestas rápidas por rol + contexto delivery (distancia/ETA/proximidad) + read receipts
✅ Historial GPS Driver — DriverLocationHistory batch save, auto-persist con orden activa, admin trace, cron cleanup 30d
✅ Fidelización Merchants — 4 tiers (BRONCE 8% → DIAMANTE 5%), comisión dinámica, widget dashboard, badge público, admin panel, cron diario
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
- Webhook MP: validación de monto (tolerance $1), idempotencia determinística, refund automático
- Order creation: merchant approvalStatus + isOpen + schedule + minOrderAmount + deliveryRadiusKm
- Cupones: maxUsesPerUser + registro atómico dentro de transaction principal
- Portal merchant: redirect a /pendiente-aprobacion si no APPROVED

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
- Scheduled delivery: capacidad 15 pedidos por slot, slots 2h dinámicos según horario real del vendor, min 1.5h anticipación, max 48h. Backend valida slot vs schedule. Sellers configuran su propio schedule de despacho
- Delete account: doble confirmación (escribir ELIMINAR), POST /api/profile/delete (soft delete)
- Google Places: Decisión 2026-03-21: AddressAutocomplete usa Places API (New) Data API como primario (AutocompleteSuggestion.fetchAutocompleteSuggestions) con fallback a Geocoding API. Session tokens para optimización de billing. Auto-detecta disponibilidad de la API. Ver sección "Dependencias externas"
- Auditoría checkout 2026-03-24: Webhook MP ahora valida monto pagado vs total orden (tolerancia $1). Idempotencia usa eventId determinístico. Order creation valida approvalStatus, isOpen, horario, minOrderAmount, deliveryRadiusKm, maxUsesPerUser de cupón. Cupón se registra dentro de $transaction. Refund automático vía API REST cuando merchant rechaza pedido pagado. Portal merchant protegido por approvalStatus. Delivery fee se calcula server-side si falta (no se hardcodea).
- Fidelización merchants 2026-03-24: Comisión dinámica por tier (BRONCE 8%, PLATA 7%, ORO 6%, DIAMANTE 5%) calculada por volumen de pedidos DELIVERED en últimos 30 días. getEffectiveCommission() reemplaza el 8% hardcodeado en order creation. Tiers configurables desde admin. Cron diario recalcula. Diferenciador vs PedidosYa (ellos cobran 25-30% fijo).
- Consolidación OPS 2026-03-26: Biblia Financiera es la ÚNICA fuente de verdad para parámetros financieros. /ops/puntos redirige a Biblia. /api/settings/ bloqueado para campos financieros (solo UI/store). configuracion-logistica mantiene solo campos de asignación/logística (MoovyConfig). Biblia sincroniza automáticamente timeouts y comisiones a MoovyConfig para que assignment-engine y crons los lean. Script validate-ops-config.ts verifica integridad. /api/admin/points/config/ marcado como deprecated (proxy a points-config canónico).

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
Redis: REDIS_URL (opcional — si no está, rate limiter usa in-memory con fallback automático)

## Scripts
start.ps1: crear rama | finish.ps1: cerrar rama y merge a develop | publish.ps1: push + dump DB
devmain.ps1: deploy a producción | sync.ps1: pull develop
validate-ops-config.ts: validación de integridad del panel OPS (9 tests: settings, puntos, moovyconfig, biblia, sync, tiers, audit, fórmula, duplicados)
fix-ops-config.ts: corrige configs faltantes (PointsConfig, MoovyConfig keys, sync timeouts, loyalty tiers) + re-verifica

## Regla de testing obligatorio
Cada feature que toque parámetros financieros, de asignación, o configurables DEBE incluir:
1. Script de verificación que pruebe lectura/escritura/rangos contra la DB real (no mocks)
2. Simulación financiera si toca dinero: subtotal + delivery fee + comisiones + puntos deben cuadrar
3. Detección de conflictos: verificar que no haya dos sistemas escribiendo el mismo parámetro con valores distintos
4. Pre-deploy: `npx tsx scripts/validate-ops-config.ts` bloquea si hay errores
5. Antes de escribir código que referencie modelos de Prisma: LEER el schema para verificar nombres exactos de campos

## Dependencias externas y servicios de terceros

Registro obligatorio de todas las APIs, SDKs y servicios externos que usa Moovy.
Cada sesión que integre, actualice o detecte un cambio en un servicio externo
DEBE actualizar esta sección. Antes de implementar features que usen estos
servicios, verificar que la versión y el estado sigan vigentes.

### Google Cloud Platform (Proyecto ID: 1036892490928)
| Servicio | Estado | Versión/API | Uso en Moovy | Última verificación |
|----------|--------|-------------|--------------|---------------------|
| Maps JavaScript API | ✅ Habilitada | v3 weekly | Mapas en tracking, checkout, driver portal | 2026-03-21 |
| Geocoding API | ✅ Habilitada | v1 | AddressAutocomplete (fallback si Places API falla) | 2026-03-21 |
| Places API (New) | ✅ Habilitada | Data API v1 | AddressAutocomplete (primary: AutocompleteSuggestion + fetchFields) | 2026-03-21 |
| Places API (Legacy) | ⛔ Deprecada | — | Deprecada marzo 2025, no disponible para proyectos nuevos | 2026-03-21 |
| Directions API | ✅ Habilitada | v1 | Ruta en tracking page (driver → destino) | 2026-03-21 |

**✅ Places API (New) habilitada el 2026-03-21.** AddressAutocomplete usa Data API como primario con Geocoding como fallback automático.

### MercadoPago
| Componente | Estado | Versión | Uso en Moovy | Última verificación |
|------------|--------|---------|--------------|---------------------|
| Checkout Pro (redirect) | ✅ Sandbox | SDK JS v2 | Pagos de pedidos | 2026-03-21 |
| Webhooks (IPN) | ✅ Configurado (test) | v1 | Confirmación automática de pagos | 2026-03-21 |
| OAuth (merchant connect) | 🟡 Pendiente | v2 | Split payments a comercios | 2026-03-21 |

**Acción pendiente para producción:** Activar credenciales de producción, configurar webhook URL en panel MP (https://somosmoovy.com/api/webhooks/mercadopago), testear pago real.

### Otros servicios
| Servicio | Estado | Versión | Uso en Moovy | Última verificación |
|----------|--------|---------|--------------|---------------------|
| SMTP (Nodemailer) | 🟡 Sin config prod | v6 | Emails transaccionales (~50 templates) | 2026-03-21 |
| Web Push (VAPID) | ✅ Configurado | web-push v3 | Notificaciones push a buyers/merchants/drivers | 2026-03-21 |
| Socket.IO | ✅ Funcional | v4 | Real-time: pedidos, tracking, admin feed | 2026-03-21 |
| PostGIS | ✅ Docker local | v3.4 | Geolocalización de drivers, cálculo de distancias | 2026-03-21 |
| Pino (logger) | ✅ Con fallback | v9 | Logging estructurado en API routes | 2026-03-21 |
| Sharp | ✅ Funcional | v0.33 | Compresión de imágenes en uploads | 2026-03-21 |
| Redis (ioredis) | 🟡 Opcional | v5.10 | Rate limiting persistente. Sin REDIS_URL cae a in-memory | 2026-03-23 |

### NPM: dependencias clave y versiones
| Paquete | Versión | Notas |
|---------|---------|-------|
| next | 16.x | Verificar changelog en major updates |
| react | 19.x | Server Components, use() hook |
| prisma | 5.22.0 | NUNCA usar migrate dev, solo db push |
| next-auth | 5.x (beta) | JWT 7 días, credentials-only |
| @react-google-maps/api | 2.x | Wrapper para Google Maps JS API |
| socket.io / socket.io-client | 4.x | WebSocket + polling fallback |
| mercadopago | 2.x | SDK oficial de MercadoPago |
| bcryptjs | 2.x | Hash de passwords |
| zod | 3.x | Validación de schemas |
| zustand | 4.x | State management (cart, favorites, toast, points) |
| ioredis | 5.x | Rate limiting persistente, fallback automático a in-memory |

### Protocolo de actualización
1. Al inicio de cada sesión larga: verificar si hay deprecaciones conocidas en los servicios principales (Google, MP, Next.js)
2. Al integrar un servicio nuevo: agregar una fila a la tabla correspondiente
3. Al detectar un warning de deprecación: documentarlo inmediatamente con fecha y plan de migración
4. Cada 2 semanas (o al iniciar sprint): revisar versiones de dependencias npm con `npm outdated`
5. Antes de deploy a producción: verificar que todas las APIs estén habilitadas y con credenciales de prod

## Reglas de ejecución
1. NO abrir browser, NO npm run dev/build, NO pruebas visuales
2. Verificar TS con `npx tsc --noEmit` (targeted si OOM)
3. Crear rama nueva antes de tocar código. NUNCA trabajar en develop
4. Mostrar plan → esperar aprobación → ejecutar → mostrar archivos modificados + tsc
5. Ignorar 3 errores pre-existentes: `--incremental`, `session.user` ×2
6. Al cerrar rama: actualizar CLAUDE.md + PROJECT_STATUS.md en el commit
7. Rutas con paréntesis: `git add "src/app/(store)/page.tsx"` (PowerShell requiere comillas)
8. Al dar comandos de cierre de rama o cualquier comando git: SIEMPRE especificar en qué rama debe estar posicionado Mauro antes de ejecutar. Formato: "Posicionate en la rama `nombre-rama`" + luego el comando. Aplica para finish.ps1, commits, cherry-pick, merge, o cualquier operación git.
9. Al cerrar rama: SIEMPRE dar el comando completo de cierre (commit + checkout develop + merge + delete branch) en vez de solo `.\scripts\finish.ps1`. El finish.ps1 pide input interactivo. Formato: commit con mensaje descriptivo → checkout develop → merge con mensaje → delete branch.
10. PowerShell NO soporta `&&`. SIEMPRE separar comandos con `;` o dar cada comando en línea separada. NUNCA usar `&&` en comandos para Mauro.

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

### Regla de marca: NUNCA mencionar competidores (Decisión 2026-03-27)

**MOOVY es un movimiento, no una comparación.**

Regla absoluta para TODO contenido visible al usuario (páginas, emails,
textos en la app, soporte, marketing, redes sociales, documentación pública):

1. NUNCA nombrar competidores (PedidosYa, Rappi, Uber Eats, iFood, etc.)
   en ningún texto, página, componente o comunicación visible al usuario
2. NUNCA hacer comparaciones directas ("a diferencia de X", "mejor que Y",
   "mientras otros cobran Z%")
3. Se pueden hacer referencias genéricas al rubro ("otras plataformas de
   delivery", "el mercado actual") pero sin nombrar empresas específicas
4. Filosofía Apple: no mencionamos a Samsung. Somos mejores, punto.
   El usuario lo descubre solo

**USO INTERNO PERMITIDO:** El análisis de competencia de arriba es para
decisiones internas de producto y estrategia. Sirve para saber QUÉ
debilidades atacar, pero NUNCA se exponen al público.

**Cómo comunicar ventajas sin comparar:**
- MAL: "A diferencia de PedidosYa, cobramos menos comisión"
- BIEN: "Comisiones desde el 8% — las más bajas del mercado"
- MAL: "Mientras otros retienen tu dinero por semanas..."
- BIEN: "Cobrás al instante. Cada venta, cada vez"
- MAL: "Nuestro soporte es mejor que el de Rappi"
- BIEN: "Soporte humano en Ushuaia. Te contestamos en minutos"

MOOVY no necesita hablar de otros. MOOVY habla de lo que hace bien.

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

## Roles permanentes (cubrir en cada tarea)

Cada cambio en Moovy pasa por un board de directores virtuales. No son
preguntas retóricas: son filtros obligatorios que se ejecutan ANTES de
dar por terminada cualquier tarea. Si un rol detecta un problema, la
tarea NO está completa.

### Protocolo de activación

No todos los roles aplican a toda tarea. Regla:
- PRODUCTO, ARQUITECTURA, QA, SEGURIDAD → SIEMPRE, en cada tarea sin excepción
- UX → si hay componente visual o interacción de usuario
- PAGOS, FINANZAS → si toca Order, SubOrder, Payment, comisiones, delivery fee, puntos, cupones, o cualquier campo monetario
- LOGÍSTICA → si toca Order, Driver, PendingAssignment, delivery, tracking
- COMUNICACIONES → si un evento afecta a buyer, merchant, driver o seller
- SOPORTE → si cambia un flujo que el usuario puede necesitar reclamar
- LEGAL → si cambia cómo se recolectan datos, procesan pagos, o condiciones del servicio
- INFRA → si toca config, env vars, Docker, deploy, cron, o servicios externos
- PERFORMANCE → si toca queries, listas, imágenes, o endpoints de alto tráfico
- MONITOREO → si hay operación que puede fallar silenciosamente
- MARKETING, CONTENIDO → si hay texto visible al usuario final
- GOOGLE PLAY → si cambia permisos, datos recolectados, o privacidad
- GO-TO-MARKET → en features nuevas o cambios de flujo principales
- ONBOARDING → si afecta la primera experiencia de merchant, driver o seller

### Los roles

**PRODUCTO** — Director de Producto
¿Funciona end-to-end? Recorré mentalmente el flujo completo del usuario
afectado (buyer/merchant/driver/seller/admin). Si tocás checkout, recorré
desde "agregar al carrito" hasta "pedido entregado + calificación". No
alcanza con que compile: tiene que tener sentido como experiencia. Verificá
que no rompés flujos adyacentes (ej: si cambiás Order, ¿SubOrder sigue
funcionando? ¿El tracking se actualiza? ¿El admin lo ve?).

**ARQUITECTURA** — CTO
¿Sigue los patrones del proyecto? Verificar:
- API routes en src/app/api/ con validación Zod + auth check + try/catch + logger
- Prisma queries con select/include explícito (NUNCA select * implícito)
- Transacciones serializables para operaciones atómicas (ratings, puntos, cupones, stock)
- Componentes: Server Components por defecto, "use client" solo si hay interactividad
- Zustand solo para estado cross-component (cart, favorites, toast, pointsCelebration)
- NUNCA Prisma migrate dev, solo db push
- Si es patrón nuevo que no existe en el proyecto: documentar en "Decisiones tomadas" con fecha y razonamiento

**UX** — Director de Experiencia
¿Es responsive? ¿Tiene los 4 estados obligatorios?
1. Loading (skeleton o spinner, no pantalla en blanco)
2. Error (mensaje claro en español argentino, acción de retry)
3. Vacío (ilustración o texto amigable, CTA para siguiente acción)
4. Éxito (feedback visual, toast o redirect según contexto)
Verificar en mobile-first (Ushuaia = mucho celular). Touch targets mínimo
44px. Textos legibles sin zoom. Colores: rojo #e60012 (MOOVY), violeta
#7C3AED (marketplace). Font: Plus Jakarta Sans. Sin jerga técnica en
textos al usuario. Accesibilidad: alt en imágenes, labels en forms,
contraste WCAG AA.

**QA** — Director de Calidad
¿Se puede romper? Pensar como un usuario malicioso Y como un usuario
distraído. Verificar:
- Input vacío, null, undefined, string donde va número
- Race conditions (stock negativo, doble pago, doble asignación de driver)
- Límites: pedido de $0, cantidad negativa, cupón expirado, merchant cerrado
- Permisos: ¿un buyer puede acceder a rutas de merchant? ¿un driver puede ver datos de otro driver?
- Concurrencia: ¿qué pasa si 2 drivers aceptan el mismo pedido al mismo tiempo?
- Timeouts: ¿qué pasa si MP no responde? ¿Si el merchant no confirma? ¿Si el driver pierde conexión?
- Rollback: si falla a mitad de proceso, ¿queda en estado inconsistente?

**LOGÍSTICA** — Director de Operaciones
Si toca pedidos o delivery, verificar la cadena completa:
- Order status flow: PENDING → CONFIRMED → PREPARING → READY → PICKED_UP → DELIVERED (+ CANCELLED/REJECTED en cualquier punto)
- PendingAssignment: ¿el ciclo de asignación respeta timeout/retry? ¿AssignmentLog registra cada intento?
- PostGIS: ¿la query de drivers cercanos es correcta? ¿Haversine fallback funciona si PostGIS falla?
- Tracking: ¿GPS polling cada 10s actualiza? ¿Socket.IO emite a los rooms correctos?
- Scheduled delivery: ¿slot validado vs schedule del vendor? ¿Capacidad 15/slot respetada?
- Multi-vendor: ¿SubOrders se crean correctamente? ¿Cada merchant ve solo su parte?

**PAGOS** — Director Financiero (CERO TOLERANCIA A ERRORES)
Si toca dinero en CUALQUIER forma, aplicar estas verificaciones matemáticas:
```
subtotal = Σ(item.price × item.quantity) por cada SubOrder
descuento_puntos = min(puntos_usados × 0.01, subtotal × 0.50)
delivery_fee = calcularDeliveryFee(distancia) // NUNCA hardcodeado
comision_moovy = subtotal × commissionRate // 0.08 merchant, 0.12 seller
pago_repartidor = delivery_fee × riderCommissionPercent // default 0.80
total = subtotal - descuento_puntos + delivery_fee
```
Verificar que:
- Webhook MP valida monto pagado vs total (tolerancia $1, ver src/app/api/webhooks/mercadopago)
- Idempotencia usa eventId determinístico (NUNCA UUID random)
- Stock se restaura si pago es rechazado/reembolsado
- Refund automático funciona cuando merchant rechaza pedido pagado
- Montos nunca son negativos (validar server-side, no confiar en el client)
- TODOS los cálculos monetarios son server-side (el frontend solo muestra)
- Decimal precision: usar Math.round(x * 100) / 100 para centavos

**PUNTOS MOOVER** — Subdirector Financiero (CERO TOLERANCIA A ERRORES)
Los puntos son dinero disfrazado. Un bug acá = regalar plata o enfurecer
usuarios. Verificar:
- Earn: 1 punto por $1 gastado. Se otorgan SOLO cuando el pedido pasa a DELIVERED, NUNCA antes
- Burn: $0.01 por punto. Máximo 50% del subtotal como descuento
- Signup bonus: 100 puntos. Se otorgan una sola vez (verificar que no se duplique)
- Referral: 200 puntos al referidor + 100 al referido. Verificar que el referido sea nuevo
- Transacción atómica: earn/burn dentro de $transaction serializable
- Balance NUNCA negativo (validar server-side antes de descontar)
- Si se cancela un pedido que usó puntos: DEVOLVER los puntos gastados
- Si se cancela un pedido que otorgó puntos: REVERTIR los puntos ganados
- PointsConfig: respetar configuración dinámica, no valores hardcodeados
- Nivel del usuario: recalcular después de cada earn/burn

**COMUNICACIONES** — Director de Comunicaciones
Si un evento afecta al usuario, DEBE haber notificación. Matriz obligatoria:
| Evento | Email | Push | Socket.IO | In-app |
|--------|-------|------|-----------|--------|
| Nuevo pedido (merchant) | ✅ | ✅ | ✅ | — |
| Pedido confirmado (buyer) | ✅ | ✅ | ✅ | — |
| Driver asignado (buyer) | — | ✅ | ✅ | — |
| Pedido entregado (buyer) | ✅ | ✅ | ✅ | toast |
| Pedido cancelado/rechazado | ✅ | ✅ | ✅ | — |
| Refund procesado (buyer) | ✅ | ✅ | — | — |
| Rating recibido (merchant/driver) | — | ✅ | — | — |
| Puntos acreditados (buyer) | — | — | — | celebration |
Si falta alguna notificación para un evento que tocás, agregarla.
Textos en español argentino. Sin anglicismos innecesarios.

**SOPORTE** — Director de Atención al Cliente
¿El usuario puede reportar un problema en este flujo? Verificar:
- Chat de pedido disponible para el estado actual (buyer↔merchant, buyer↔driver)
- Soporte MOOVY accesible desde la pantalla afectada
- Si hay error, el mensaje le dice al usuario QUÉ HACER, no solo qué falló
- Canned responses actualizadas si el flujo cambia
- Si es un flujo de dinero: el reclamo debe poder escalar a admin/ops

**SEGURIDAD** — Director de Seguridad (SIEMPRE ACTIVO)
En cada endpoint y cada página, verificar:
- Auth: ¿session válida? ¿getServerSession() o middleware protege la ruta?
- Autorización: ¿el rol correcto? Un COMERCIO no puede ver datos de otro COMERCIO (IDOR)
- Validación: Zod en TODOS los inputs del body/query. NUNCA confiar en el client
- Rate limiting: ¿el endpoint tiene rate limit apropiado? (ver src/lib/rate-limit.ts)
- SQL injection: Prisma parametriza, pero verificar $queryRaw si se usa
- XSS: ¿hay dangerouslySetInnerHTML? Si sí, sanitizar
- CSRF: verificar origin en mutations sensibles
- Uploads: magic bytes + extensión + 10MB max + sharp compression
- Tokens: timing-safe comparison para cron/webhook secrets
- Logging: operaciones sensibles (refund, delete, reassign, export) deben ir al audit log

**INFRA** — Director de Infraestructura
¿Funciona en el VPS de Hostinger? Verificar:
- Variables de entorno: ¿se necesita nueva env var? Documentarla en "Variables de entorno"
- Docker: ¿PostGIS sigue corriendo en puerto 5436?
- Servicios externos: ¿se agregó una API nueva? Documentar en "Dependencias externas"
- Memory: ¿la operación puede causar OOM? (ej: queries sin paginación, uploads grandes)
- CORS: si toca Socket.IO, verificar whitelist
- Cron: si hay tarea programada, verificar CRON_SECRET

**PERFORMANCE** — Director de Rendimiento
¿Es eficiente para una ciudad con conexiones irregulares? Verificar:
- Queries: select solo los campos necesarios. Include solo las relaciones necesarias
- Paginación: TODA lista debe tener paginación (take/skip). NUNCA traer todo
- Imágenes: sharp compression en upload, next/image con sizes, lazy loading
- Bundle: ¿el import es dinámico donde corresponde? (mapas, componentes pesados)
- N+1: ¿hay loop que hace query por iteración? Refactorizar a include o batch
- Caché: ¿se puede cachear? (categorías, StoreSettings, MoovyConfig)
- Mobile: ¿funciona en 3G lento? Loading states son críticos

**MONITOREO** — Director de Observabilidad
Si algo falla, ¿alguien se entera? Verificar:
- Logger (Pino): ¿los catch blocks loguean con contexto suficiente? (orderId, userId, action)
- Operaciones críticas deben tener log level "error" o "warn", no solo "info"
- Webhooks: ¿se loguea recepción, procesamiento, y resultado?
- Si falla un pago/refund/asignación: ¿queda registro en MpWebhookLog/AssignmentLog?
- Admin feed: ¿Socket.IO emite eventos relevantes al panel ops?
- Si es operación que puede fallar silenciosamente (cron, email, push): log obligatorio

**LEGAL** — Director Legal
Si el cambio afecta datos, pagos, o condiciones del servicio:
- ¿Hay que actualizar /terminos? (14 cláusulas actuales)
- ¿Se recolectan datos nuevos del usuario? → actualizar política de privacidad
- ¿Cambia cómo se procesan pagos? → verificar cumplimiento BCRA/AFIP
- ¿Se comparten datos con terceros? (MP, Google, SMTP) → documentar
- Soft delete obligatorio para datos de usuario (NUNCA hard delete)
- Edad mínima: si aplica, verificar

**FINANZAS** — Controller
¿Los números cierran? Verificar con la fórmula maestra:
```
ingreso_moovy = comision_merchant + comision_seller + (delivery_fee × (1 - riderCommissionPercent))
```
- ¿commissionRate viene de MoovyConfig/StoreSettings (dinámico), no hardcodeado?
- ¿riderCommissionPercent viene de StoreSettings?
- Si hay cupón: ¿quién absorbe el descuento? (Moovy, no el merchant)
- CSV export del panel ops: ¿los totales coinciden con la suma de las partes?
- Facturación AFIP: si el cambio afecta montos, anotar para revisión fiscal

**MARKETING / CONTENIDO** — Director de Marketing
¿Los textos son profesionales y en español argentino? Verificar:
- Sin typos, sin placeholder ("Lorem ipsum", "TODO", "test")
- Tono: cercano pero profesional. "Tu pedido está en camino" no "Su orden ha sido despachada"
- Sin anglicismos: "delivery" es aceptable (ya adoptado), pero no "checkout flow" al usuario
- Branding: MOOVY en mayúsculas cuando es marca. Colores correctos
- SEO: ¿tiene generateMetadata()? ¿JSON-LD si es detalle público?
- Comparación competitiva: ¿el texto transmite las ventajas vs PedidosYa/Rappi?

**GOOGLE PLAY** — Compliance
Si el cambio afecta permisos o datos:
- ¿Se usa geolocalización? → Data Safety: "Location: Approximate/Precise"
- ¿Se usa cámara/galería? → documentar propósito
- ¿Se recolectan datos personales nuevos? → actualizar Data Safety form
- ¿Push notifications? → ya declarado, pero verificar si cambia el uso

**GO-TO-MARKET** — Director Comercial
¿Esto acerca o aleja el lanzamiento? Preguntarse:
- ¿Es blocker para lanzar? Si sí, prioridad máxima
- ¿Mejora la primera impresión de un comercio nuevo?
- ¿Mejora la primera impresión de un comprador nuevo?
- ¿Es algo que PedidosYa NO tiene en Ushuaia? → diferenciador, destacar

**ONBOARDING** — Director de Éxito del Cliente
¿Un usuario nuevo entiende qué hacer? Verificar por rol:
- Merchant nuevo: ¿el flujo registro → aprobación → primer producto → primer pedido es claro?
- Driver nuevo: ¿el flujo registro → aprobación → conectarse → primer pedido es claro?
- Seller nuevo: ¿el flujo registro → primer listing → primera venta es claro?
- Buyer nuevo: ¿puede completar su primer pedido sin ayuda en menos de 3 minutos?
- ¿Hay tooltips/guías donde se necesitan? ¿Los pasos son obvios?

### Cadena de reacción entre roles

Cuando un rol detecta que necesita algo, activa a otros roles automáticamente:

PAGOS cambia → COMUNICACIONES (¿notificar?), LEGAL (¿TyC?), FINANZAS (¿números cierran?), MONITOREO (¿se loguea?), QA (¿edge cases de montos?)
LOGÍSTICA cambia → COMUNICACIONES (¿notificar status?), UX (¿tracking actualizado?), PERFORMANCE (¿polling eficiente?)
SEGURIDAD detecta riesgo → BLOQUEA la tarea hasta que se resuelva. No se avanza con vulnerabilidades conocidas
PRODUCTO agrega feature → ONBOARDING (¿se entiende?), MARKETING (¿copy listo?), GO-TO-MARKET (¿acerca el lanzamiento?), GOOGLE PLAY (¿permisos nuevos?)
UX cambia pantalla → PERFORMANCE (¿carga rápido en 3G?), QA (¿4 estados cubiertos?), CONTENIDO (¿textos correctos?)

### Regla de oro

Si al revisar una tarea completada, CUALQUIER rol encuentra un problema
clasificado como CRÍTICO (pérdida de dinero, vulnerabilidad de seguridad,
datos expuestos, flujo roto para el usuario), la tarea se considera
INCOMPLETA y se debe resolver antes de cerrar la rama.

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
