# MOOVY
Última actualización: 2026-04-21 (rama `feat/home-accesos-favorito` RESUELTA — ISSUE-012 accesos directos a Favoritos y Puntos MOOVER desde la home. **Síntoma / motivación**: Favoritos no tenía acceso directo desde ningún lado (estaba enterrado en `/mi-perfil/favoritos`, el usuario tenía que ir a perfil → bajar → favoritos, 3 taps); Puntos sí tenía acceso desde el BottomNav (botón central con estrella) y desde el AppHeader pero el usuario no veía el balance hasta entrar al detalle. Ambas son señales de personalización que aumentan la retención — si el usuario ve "1.250 pts · Canjealos" en el home, sabe que tiene algo que perder y vuelve. **Arquitectura**: (1) Nuevo componente `src/components/home/QuickAccessRow.tsx` (Server Component): lee `auth()` → si hay userId hace UNA query a `prisma.user.findUnique` con `select: { pointsBalance: true, _count: { select: { favorites: true } } }` (select explícito, cero N+1). Try/catch alrededor: si la query falla (DB down, user deleted mid-session), cae silenciosamente al estado deslogueado — el home NUNCA se rompe por este widget. (2) Render: `<section>` con `<div className="grid grid-cols-2 gap-3 lg:gap-4">` — 2 cards lado a lado en mobile-first, sin wrap en desktop. **Card Favoritos**: gradiente `from-rose-50 to-red-50`, círculo rojo MOOVY `#e60012` con `<Heart fill="white">` en blanco, hover `border-rose-200 + shadow-md + scale-110` en el icono. **Card Puntos MOOVER**: gradiente `from-amber-50 to-orange-50`, círculo gradient `from-amber-400 to-orange-500` con `<Star fill="white">` en blanco. Ambas con `<ArrowRight>` sutil al lado del título que se mueve 0.5 al hover. Active state `scale-[0.98]` para feedback táctil. (3) Textos dinámicos por cardinalidad — Favoritos logueado: 0 guardados → "Aún no guardaste ninguno. Tocá el ❤ en tus comercios.", 1 → "1 guardado · Entrá rápido a tu comercio", N → "N guardados · Entrá rápido a ellos"; Puntos logueado: 0 → "Sumá con cada pedido · 10 pts por cada $1.000", N → "N pts · Canjealos en tu próxima compra" (usa `toLocaleString("es-AR")` para formato "1.250"). Deslogueado: CTAs genéricos con `href` `/login?redirect=<destino>` para que vuelva al lugar correcto post-login. (4) `aria-label` compuesto con title+subtitle para lectores de pantalla, touch targets ≥44px (card completa es clickeable), `line-clamp-2` en el subtítulo para prevenir desborde en textos largos. (5) Integración en `src/app/(store)/page.tsx`: import arriba, invocación envuelta en `<AnimateIn animation="reveal">` entre `<HomeFeed>` y el bloque de `<CategoryGrid>` — primera fila visible después del hero/filtros, alta descubribilidad pero sin tapar el contenido principal. **Scope intencional**: el componente es async Server Component porque necesita `auth()` + 1 query; si bloquea el render del home sería un problema, pero como es la segunda sección (después de HomeFeed que ya es dinámico) y es una query trivial (<5ms), no empeora el TTFB. No usamos `Suspense` boundary porque agregar un fallback visual sería más disrupción que el tiempo que ahorra. **Archivos nuevos**: `src/components/home/QuickAccessRow.tsx`. **Archivos modificados**: `src/app/(store)/page.tsx` (import + insertion). **TS clean** (solo errores pre-existentes: `.next/dev/types/*` generados + `src/types/order-chat.ts` TS1127 + `scripts/socket-server.ts` TS1127 + `src/app/privacidad/page.tsx` TS1127 + `node_modules/.prisma/client` pendiente de regenerate). **Regla nueva**: accesos de personalización (favoritos, puntos, direcciones, pedidos recientes) deben tener entry points en el home, no solo en `/mi-perfil`. La home es la primera pantalla que ve el usuario al abrir la app — cualquier señal "tenés algo tuyo acá" aumenta retención.)

Actualización previa: 2026-04-21 (rama `retry-cron-escalation` RESUELTA — ISSUE-015 auto-cancelación final del cron de retry. **Síntoma / motivación**: el cron `retry-assignments` (corre cada 5min) SÍ reintentaba la asignación hasta `MAX_RETRIES = 3` y después escalaba a admin via `notifyAdminOfStuckOrder`, pero NO cerraba el flujo: el pedido quedaba `CONFIRMED` indefinidamente sin driver, el buyer miraba el mapa sin entender qué pasaba, el dinero del MP seguía retenido y nadie le daba un bonus compensatorio. Consecuencia operativa: admin tenía que cancelar manualmente desde OPS, refund manual desde MP panel, bonus manual — 4-5min de trabajo humano por incidente + exposición reputacional. **Arquitectura del fix** (idempotente, defense in depth): (1) En `src/app/api/cron/retry-assignments/route.ts` se agregó `AUTO_CANCEL_THRESHOLD = 6` (~30min de espera total con cron cada 5min: 3 retries propios + 3 retries admin-notified sin éxito) + constantes `AUTO_CANCEL_REASON = "No conseguimos repartidor disponible para tu pedido"` y `AUTO_CANCEL_BONUS_POINTS = 500`. (2) Nueva función `autoCancelStuckOrder(orderBrief, attempts)` que encapsula el cierre completo: primero `prisma.$transaction` atómico que marca Order como `CANCELLED` + `cancelReason` + `adminNotes` con timestamp, apaga SubOrders `updateMany`, restaura stock iterando items (product o listing `increment`), libera `driverId`/`pendingDriverId` (defensivo) y borra `PendingAssignment`; después en secuencia con try/catch individual: (a) si el pedido era `paymentMethod: mercadopago && paymentStatus: PAID` busca el `Payment` con `mpStatus: approved` y dispara `createRefund(mpPaymentId)` — on success actualiza `order.paymentStatus: REFUNDED` + `payment.mpStatus: refunded` con detail descriptivo, on failure emite `refund_failed` a `admin:orders` para que admin lo resuelva manual, (b) `reverseOrderPoints(orderId, reason)` para devolver REDEEM al buyer (idempotente via `Order.pointsEarned/pointsUsed` — nunca dobla reversión), (c) `recordPointsTransaction(userId, "BONUS", 500, description, orderId)` para otorgar el bonus compensatorio, (d) `notifyBuyerOrderAutoCancelled(userId, orderNumber, orderId, bonusAwarded, wasRefunded)` — nuevo helper en `src/lib/notifications.ts` con title `😔 No encontramos repartidor`, body dinámico que incluye las líneas "Te devolvimos el pago" (si refund OK) y "Te regalamos 500 puntos MOOVER por la espera" (si bonus OK), tag `order-autocancelled-${orderNumber}` (distinto de `order-cancelled` para que no colapse el push en el lock screen con una cancelación manual previa del merchant/buyer), (e) sockets `order_cancelled` con flag `auto: true` + `refunded` + `bonusAwarded` + `attempts` a `merchant:${merchantId}`, `admin:orders` y `customer:${userId}`. (3) Loop principal modificado en `POST`: agregada una nueva rama `if (assignmentLogs.length >= AUTO_CANCEL_THRESHOLD)` ANTES del `if (assignmentLogs.length >= MAX_RETRIES)` — cuando hay ≥6 intentos fallidos invoca `autoCancelStuckOrder` en try/catch (si tira excepción se loguea pero el cron sigue con las demás órdenes), y después llama igualmente a `notifyAdminOfStuckOrder` con mensaje completo que incluye refund status + bonus, para que el panel OPS mantenga visibilidad del incidente. Contador `autoCancelled` agregado al response JSON. **Defense in depth**: el `$transaction` ya garantiza el cierre del pedido aunque fallen después refund/points/push — el pedido queda `CANCELLED` sin importar qué side effect falló, y los logs + socket `refund_failed` permiten recovery manual. **Idempotencia end-to-end**: una vez `CANCELLED`, el `where: { status: "CONFIRMED" }` del query inicial del cron excluye la orden de runs futuros. El auto-cancel NO corre si `fullOrder.status === "CANCELLED" || "DELIVERED"` (early return). `reverseOrderPoints` y `recordPointsTransaction` son idempotentes via `pointsEarned/pointsUsed`. **Scope intencional**: single-vendor Orders en `stuckOrders` query. Multi-vendor SubOrder auto-cancel queda para fase 2 porque el refund parcial (cancelar 1 de 3 vendedores con un solo pago MP) requiere lógica de prorrateo que no existe aún en el codebase — admin lo maneja manual por ahora. **Archivos modificados**: `src/app/api/cron/retry-assignments/route.ts`, `src/lib/notifications.ts`. **TS clean** (los únicos errores son los pre-existentes: `node_modules/.prisma/client`, `.next/dev/types/*` generados, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127, `src/app/privacidad/page.tsx` TS1127). **Regla nueva**: cualquier cron de retry/escalación debe tener un "floor" de auto-resolución automática — no dejar al buyer esperando indefinidamente ni empujar el trabajo a admin manual. Umbral recomendado: 2× el umbral de escalación (o 30min absolutos, lo que sea menor). El auto-cierre debe incluir refund, reversión de puntos, bonus compensatorio y push — el buyer merece cierre limpio aunque falle la capa de asignación.)

Actualización previa: 2026-04-21 (rama `feat/push-repartidor-cerca` RESUELTA — ISSUE-013 push "tu repartidor está cerca". **Síntoma / motivación**: el buyer sabe cuando su pedido entra a IN_DELIVERY (push genérico de "está en camino") pero se queda mirando el mapa hasta que el driver toca timbre. En Ushuaia hace -5°C, queremos que el buyer pueda calentar la comida / tener cambio listo / prepararse cuando el driver está realmente por llegar. Complementa el PIN de entrega (ISSUE-001): el push de proximidad recuerda el código justo cuando lo va a necesitar. **Arquitectura**: (1) Schema Prisma: nuevo campo `nearDestinationNotified Boolean @default(false)` agregado a `Order` (single-vendor) Y `SubOrder` (multi-vendor: cada SubOrder tiene su driver independiente, cada uno dispara su push). Requiere `npx prisma db push` + `npx prisma generate` local post-merge. (2) `src/lib/notifications.ts` — nueva función `notifyBuyerDriverNear(userId, orderNumber, orderId, deliveryPin?)` con title `🏍️ Tu repartidor está cerca` y body dinámico: si tenemos `deliveryPin` (pedido ya PICKED_UP, lo normal) → `"Tené listo el código de entrega: XXX XXX"`; si no (edge case) → `"Tu pedido ${orderNumber} está por llegar. Revisá la app."`. Tag `order-near-${orderNumber}` distinto de `order-pin-*` e `order-in_delivery` para NO colapsar con pushes previos en el lock screen (el buyer los ve acumulados). Deep link a `/mis-pedidos/${orderId}`. (3) `src/lib/driver-proximity.ts` (NUEVO) — helper `checkAndNotifyNearDestination({driverId, driverLat, driverLng})`. Constantes: `NEAR_DESTINATION_METERS = 300` (Biblia UX: ≈3-5 min caminando en Ushuaia), `DELIVERY_ACTIVE_STATES = ["PICKED_UP", "IN_DELIVERY"] as const`. Dos paths en secuencia: **Path 1 (single-vendor)** `prisma.order.findMany({where: {driverId, deliveryStatus in ACTIVE_STATES, nearDestinationNotified: false, deletedAt: null}, take: 10})` con include de `address.{latitude,longitude}` + `deliveryPin`. Para cada order calcula `calculateDistance(driverLat, driverLng, destLat, destLng) * 1000` y si < 300m hace `prisma.order.updateMany({where: {id, nearDestinationNotified: false}, data: {nearDestinationNotified: true}})` ATÓMICO — solo si `update.count === 1` (ganamos la carrera, ningún otro request disparó) llamamos a `notifyBuyerDriverNear`. **Path 2 (multi-vendor)** mismo patrón sobre `prisma.subOrder.findMany({where: {driverId, deliveryStatus in ACTIVE_STATES, nearDestinationNotified: false, order: {deletedAt: null}}, take: 10})` con include de `order.{id, userId, orderNumber, address}` + `deliveryPin` a nivel SubOrder (multi-vendor tiene PINs por SubOrder). Un buyer con 3 vendedores recibe hasta 3 pushes — uno por cada driver que cruza el radio. Errores se loguean con `console.error` y nunca throwean (fire-and-forget). (4) `src/app/api/driver/location/route.ts` — después del update exitoso de coords + history, se invoca `checkAndNotifyNearDestination({driverId, driverLat: latitude, driverLng: longitude}).catch(err => console.error(...))` FIRE-AND-FORGET. El handler devuelve la respuesta HTTP sin esperar el check (crítico: la UI del driver dashboard pollea GPS cada 10s, no puede bloquearse por un push fallido). **Defensa de concurrencia**: el patrón `updateMany WHERE flag=false` es el mismo usado en ISSUE-054 (`DriverAvailabilitySubscription.notifiedAt`) — si dos updates GPS llegan casi simultáneos y ambos ven el flag en false, solo el primero gana (count=1), el segundo ve count=0 y skipea el push. Cero duplicados sin necesidad de transaction ni lock. **Cap de queries**: `take: 10` por path porque un driver no debería tener >10 entregas activas simultáneas (smart batching limita a 3-4 normalmente); el cap previene que una race condition crónica genere queries largas. **Idempotencia end-to-end**: una vez notificado, `nearDestinationNotified: true` impide cualquier re-push aunque el driver salga y vuelva al radio (común en Ushuaia con calles con poca señal). Si se quisiera resetear (ej: pedido devuelto al comercio por problema), habría que resetear el flag manualmente desde OPS, pero ese flujo no es común. **Archivos modificados**: `prisma/schema.prisma`, `src/lib/notifications.ts`, `src/app/api/driver/location/route.ts`. **Archivos nuevos**: `src/lib/driver-proximity.ts`. **TS clean** en los archivos nuevos/modificados (los errores pre-existentes de `.next/dev/types/*` generados + `src/app/privacidad/page.tsx` TS1127 + `src/types/order-chat.ts` TS1127 + `scripts/socket-server.ts` TS1127 + `node_modules/.prisma/client` pendiente de regenerate son los mismos que quedaron de las ramas anteriores, no de ésta). **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para que el cliente Prisma conozca `nearDestinationNotified` — sin esto, el código tirará runtime error "Unknown field" al primer GPS update del driver. **Regla nueva**: cualquier notificación post-pedido que tenga una transición "one-time" (one-shot: se dispara UNA vez y no se repite) debe usar el patrón `flag: false` + `updateMany WHERE flag: false` + check `count === 1` antes de disparar el side effect. Nunca usar `findFirst` → `if(!flag) send → update` secuencial porque permite doble disparo bajo concurrencia.)

Actualización previa: 2026-04-21 (rama `fix/chat-multidireccional` RESUELTA — chat orden multidireccional completo. Hasta ahora el OrderChat solo soportaba BUYER_MERCHANT, BUYER_DRIVER y BUYER_SELLER (buyer-céntrico). Problema: en multi-vendor el buyer veía UN solo card "Chat con vendedor" aunque el pedido tuviera 3 sellers, y el driver no tenía forma de coordinar con el comercio ni con los vendedores marketplace. **Arquitectura**: (1) Schema `OrderChat` ya tenía los enums `DRIVER_MERCHANT` y `DRIVER_SELLER` + campo `subOrderId` desde el WIP previo (commit `ddfd78f9`) — esta rama solo completa la UI de los 4 portales. (2) Buyer en `src/app/(store)/mis-pedidos/[orderId]/page.tsx`: reemplazado el card único de vendedor por un `map` sobre `order.subOrders?.filter(so => so.seller)` que monta UN `OrderChatPanel` por SubOrder con `subOrderId={so.id}` — ahora el buyer ve una card de chat por cada vendedor marketplace presente en el pedido. (3) Driver dashboard backend `src/app/api/driver/dashboard/route.ts`: el include de `activeOrders` ahora trae `subOrders: { id, driverId, seller: { id, displayName, userId } }`. El helper formateador agrega dos campos al response: `hasMerchant: !!order.merchant?.name` (para decidir si mostrar chat DRIVER_MERCHANT — en marketplace-only puede ser null) y `sellersEnPedido: Array<{subOrderId, sellerName}>` filtrado por `so.driverId === driver.id || !so.driverId` (un driver solo ve los vendedores cuyas SubOrders le fueron asignadas o en single-vendor delivery donde el driver está a nivel Order). Además se empezó a devolver `orderNumber` como campo distinto del display `orderId` para poder pasarlo al `OrderChatPanel` limpio. (4) Driver UI `src/app/repartidor/(protected)/dashboard/page.tsx`: fix de bug pre-existente — el chat BUYER_DRIVER pasaba `pedidoActivo.orderId` (display ID tipo "MOV-1234" que venía del `order.orderNumber || order.id.slice(-6)`) cuando el endpoint `/api/order-chat` espera el Prisma `id` cuid. Corregido a `pedidoActivo.id`. Agregados DRIVER_MERCHANT (condicional a `hasMerchant`) y DRIVER_SELLER (map sobre `sellersEnPedido` con `subOrderId`). La interface local `Order` extendida con `hasMerchant?: boolean` y `sellersEnPedido?: Array<{subOrderId, sellerName}>`. (5) Merchant UI `src/app/comercios/(protected)/pedidos/page.tsx`: el contenedor de chats cambió a `flex flex-wrap gap-2`. Agregado `DRIVER_MERCHANT` condicional a `order.driver?.user?.name` (solo aparece cuando el pedido ya fue asignado a un driver). (6) Seller backend `src/app/api/seller/orders/route.ts`: el include del `prisma.subOrder.findMany` ahora trae `driver` a nivel SubOrder (multi-vendor: cada SubOrder tiene driver propio, usado principalmente para el chat DRIVER_SELLER) + en `order.*` ahora vienen `id` y `driver` (fallback single-vendor cuando la SubOrder no tiene driver propio pero el Order sí). (7) Seller UI `src/app/vendedor/(protected)/pedidos/page.tsx`: interface `SubOrder` extendida con `driver?: { id, user: { name } }` y `order.driver?: ...`. Bloque de chats cambiado a `flex flex-wrap gap-2` con dos panels: `BUYER_SELLER` (bug histórico fixed: antes NO tenía `subOrderId`, ahora sí — el vendedor abría un chat compartido entre todos los pedidos del buyer con él en vez de scopeado a la SubOrder) y el nuevo `DRIVER_SELLER` (solo aparece cuando `sub.driver || order.driver` está presente, usa `subOrderId={order.id}` de la SubOrder). **Scoping de multi-vendor**: todos los chats no-BUYER_MERCHANT ahora llevan `subOrderId` — un pedido multi-vendor genera N chats independientes (uno por cada par seller/driver × SubOrder). Un pedido single-vendor sigue funcionando porque el API normaliza null/undefined en el lado del resolver. **Archivos modificados**: `src/app/(store)/mis-pedidos/[orderId]/page.tsx`, `src/app/api/driver/dashboard/route.ts`, `src/app/repartidor/(protected)/dashboard/page.tsx`, `src/app/comercios/(protected)/pedidos/page.tsx`, `src/app/api/seller/orders/route.ts`, `src/app/vendedor/(protected)/pedidos/page.tsx`. **Archivos del WIP previo (ya commiteados en `ddfd78f9`, no modificados en esta rama)**: `src/types/order-chat.ts` (enum + quick responses), `src/app/api/order-chat/route.ts` (POST/GET con resolveParticipants multi-rol), `src/app/api/order-chat/[chatId]/route.ts`, `src/app/api/order-chat/existing/route.ts`, `src/components/orders/OrderChatPanel.tsx` (soporte 5 chatTypes + paleta emerald para DRIVER_*), `src/lib/order-chat-notify.ts` (push + socket per-chatType), `scripts/socket-server.ts`. **TS clean** (0 errores sobre todo el repo con `npx tsc --noEmit --skipLibCheck`). **Regla nueva**: cualquier nuevo `OrderChatPanel` en multi-vendor DEBE pasar `subOrderId` de la SubOrder correspondiente. Sin ese scope, los mensajes de vendedores distintos en el mismo pedido se mezclan en un único chat.)

Actualización previa: 2026-04-21 (rama `fix/privacy-policy-aaip-compliance` RESUELTA — compliance integral Ley 25.326 + AAIP. **Síntoma**: pre-launch audit legal detectó que la plataforma no cumplía con varios requisitos de la Ley de Protección de Datos Personales de Argentina y la Resolución 47/2018 de AAIP: faltaba banner de cookies granular, no había endpoint de export (ARCO acceso/portabilidad), no se registraba el consentimiento con versión/IP/timestamp (auditable), no existía flujo de opt-in marketing separado (Ley 26.951 "No Llame"), no había panel de privacidad para que el user vea/revoque sus consentimientos, y los formularios de registro no pedían confirmación explícita de mayoría de edad. **Arquitectura del fix** (7 fases): (1) Schema Prisma: nuevo modelo `ConsentLog` (id/userId/consentType/version/action/ipAddress/userAgent/details/acceptedAt, índices `[userId,consentType]` y `[acceptedAt]`, cascade onDelete). Campos nuevos en `User`: `termsConsentVersion`, `privacyConsentVersion`, `age18Confirmed` (default false), `marketingConsent` (default false), `marketingConsentAt?`, `marketingConsentRevokedAt?`, `cookiesConsent?` (JSON), `cookiesConsentAt?`. Campo `acceptedPrivacyAt?` en `Driver` y `SellerProfile`. Requiere `npx prisma db push` + `npx prisma generate` local. (2) `src/lib/legal-versions.ts`: constantes canónicas `PRIVACY_POLICY_VERSION="2.0"`, `TERMS_VERSION="1.1"`, `COOKIES_POLICY_VERSION="1.1"`, `MARKETING_CONSENT_VERSION="1.0"` + enums `CONSENT_TYPES` (TERMS/PRIVACY/MARKETING/COOKIES) y `CONSENT_ACTIONS` (ACCEPT/REVOKE). Regla: solo bumpear versiones acá, nunca hardcodear en otros archivos. (3) `src/lib/consent.ts`: helper `recordConsent({userId, consentType, version, action, request, details})` que hace INSERT inmutable en `ConsentLog` extrayendo IP de `x-forwarded-for` (o `x-real-ip` fallback) y User-Agent (trunca a 500 chars). Nunca update — el log es append-only para auditoría AAIP. (4) Banner de cookies `src/components/legal/CookieBanner.tsx`: client component montado en `(store)/layout.tsx`, 3 acciones (Aceptar todas / Rechazar no esenciales / Configurar). Panel de settings con toggle por categoría (Essential siempre ON y disabled, Functional, Analytics, Marketing). Storage `localStorage.moovy_cookies_consent_v1`. Endpoint `POST /api/cookies/consent` (rate limit 10/60s, Zod `{essential: true, analytics, functional, marketing}`) que persiste en `User.cookiesConsent` + `recordConsent({consentType:"COOKIES"})` si está logueado, o 200 para client-side storage si no. (5) Export ARCO `GET /api/profile/export-data`: rate limit 3/10min, devuelve JSON descargable `moovy-datos-<userId>-<fecha>.json` con bloques `datosPersonales`, `direcciones`, `pedidos` (con items, SubOrders, delivery info), `transaccionesDePuntos`, `favoritos`, `suscripcionesPush`, `referidos`, `consentimientos` (todo el ConsentLog del user), `perfilRepartidor`, `comerciosPropios`, `perfilVendedor`. Loguea `USER_DATA_EXPORTED` en audit. Es el ejercicio del derecho de acceso (Art. 14) y portabilidad (Art. 19 bis). (6) Forms de registro actualizados: `auth/register/route.ts` (buyer) ahora valida `acceptTerms`, `acceptPrivacy`, `age18Confirmed` (400 si falta). Persiste `termsConsentAt/Version`, `privacyConsentAt/Version`, `age18Confirmed: true`, `marketingConsent` y `marketingConsentAt` (condicional). Llama `recordConsent` para TERMS, PRIVACY y opcionalmente MARKETING después del $transaction (try/catch — si falla el log, el registro no se tumba). Mismo pattern aplicado a `auth/register/driver/route.ts`, `auth/register/merchant/route.ts` (PATH B new user escribe los 4 campos de versión), y `auth/activate-seller/route.ts` (nuevo campo `acceptedPrivacy` requerido en body, valida + persiste + log). UI del `(store)/registro/page.tsx` (buyer) agrega checkbox obligatorio "Confirmo que soy mayor de 18 años" y checkbox opcional "Quiero recibir ofertas y novedades por email/push". Merchant/driver/seller UIs ya tenían ambos checkboxes, solo se ajustó el API consumer del `VendedorRegistroClient.tsx` para mandar `acceptedPrivacy: true`. (7) Panel de privacidad `src/app/(store)/mi-perfil/privacidad/page.tsx`: 5 secciones — banner ARCO, exportar datos (botón descarga), consentimientos vigentes (cards con versión + fecha + badge "Al día"/"Revisar vX.X" con link a /terminos o /privacidad; card marketing con toggle activar/revocar; card cookies con link a /cookies), historial de consentimientos (lista últimos 50 eventos del ConsentLog con badge color-coded Aceptó/Revocó/Actualizó + fecha + IP), contacto DPO `privacidad@somosmoovy.com`, y eliminar cuenta (link a `/mi-perfil/datos` que ya tiene el flujo). Endpoint `src/app/api/profile/privacy/route.ts`: GET devuelve `{current: {terms, privacy, marketing, cookies, age18Confirmed}, history: ConsentLog[]}` con flag `upToDate` calculado por versión latest vs aceptada. PATCH con Zod `{marketingConsent: boolean}` que actualiza `User.marketingConsent/marketingConsentAt/marketingConsentRevokedAt` + inserta `ConsentLog` con action ACCEPT o REVOKE. Rate limit 10/60s. Nuevo link "Privacidad y Datos" en `/mi-perfil` (icono Shield emerald) debajo de Favoritos. Página `/cookies` actualizada a v1.1 con banner gradient que explica el control del user y link al panel de privacidad. **Archivos nuevos**: `src/lib/legal-versions.ts`, `src/lib/consent.ts`, `src/components/legal/CookieBanner.tsx`, `src/app/api/cookies/consent/route.ts`, `src/app/api/profile/export-data/route.ts`, `src/app/api/profile/privacy/route.ts`, `src/app/(store)/mi-perfil/privacidad/page.tsx`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/driver/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/auth/activate-seller/route.ts`, `src/app/(store)/registro/page.tsx`, `src/app/vendedor/registro/VendedorRegistroClient.tsx`, `src/app/(store)/layout.tsx`, `src/app/(store)/mi-perfil/page.tsx`, `src/app/cookies/page.tsx`. **Regla nueva**: cualquier cambio a documentos legales (terms/privacy/cookies/marketing) DEBE (a) bumpear la constante en `src/lib/legal-versions.ts`, (b) mostrar al user el banner "Revisar vX.X" en el panel de privacidad, (c) pedir re-aceptación si el cambio es material (no typos). El historial en `ConsentLog` es la prueba legal de qué versión aceptó cada user — nunca update, solo insert. **TS clean** para los archivos nuevos/modificados de AAIP (los 3 errores pre-existentes son `src/types/order-chat.ts` y `scripts/socket-server.ts` con TS1127 chars inválidos — no parte de esta rama — y `node_modules/.prisma/client` pendiente de `prisma generate`). **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para regenerar el cliente con el nuevo modelo `ConsentLog` + campos nuevos en `User`/`Driver`/`SellerProfile`.)

Actualización previa: 2026-04-21 (rama `user-deletion-no-resurrection` RESUELTA — bug crítico de resurrección de cuentas, ISSUE-060. **Síntoma detectado por Mauro**: eliminó un usuario desde OPS, el mismo usuario volvió a registrarse con el mismo mail, y el sistema le trajo TODA su data vieja (comercios aprobados, productos, fiscal data, tokens MP). **Causa raíz**: `src/app/api/auth/register/route.ts` tenía un code path "reactivar" que, si detectaba un `User` con `deletedAt != null` en el email consultado, hacía `tx.user.update({deletedAt: null, password: nuevo, ...})` y seguía — PERO sin tocar los `Merchant`/`Driver`/`SellerProfile` colgados del `ownerId` viejo. Resultado: el registro "nuevo" quedaba con los comercios aprobados, fiscal data encriptada (cuit/cbu/cuil/ownerDni), `mpAccessToken/mpRefreshToken/mpUserId/mpEmail`, órdenes históricas y productos intactos. **Arquitectura del fix** (defense in depth, 4 capas): (1) `auth/register/route.ts` — eliminado el path de reactivación. Si existe `User` con `deletedAt != null` → **410** "Esta cuenta fue eliminada. Si creés que fue un error, escribinos a soporte." + audit log `ACCOUNT_RESURRECTION_BLOCKED`. Si existe con `deletedAt: null` → 409 "email en uso" (comportamiento previo). El `$transaction` quedó con el path "user nuevo" únicamente. (2) `auth/register/merchant/route.ts` — mismo check `if (existingUser?.deletedAt)` añadido antes del check de merchants colgados. Misma respuesta 410 + audit con `source: "auth/register/merchant"` y `businessName`. (3) `admin/users/[id]/delete/route.ts` — cascada completa dentro del `$transaction` serializable: Merchant queda `isActive: false`, `isOpen: false`, `approvalStatus: "REJECTED"`, `rejectionReason: "Cuenta eliminada por administrador"`, `isSuspended: true`, `suspendedAt: now`, y se **nullean** `cuit, cuil, bankAccount, ownerDni, mpAccessToken, mpRefreshToken, mpUserId, mpEmail`. Driver queda `isActive: false`, `isOnline: false`, `availabilityStatus: "FUERA_DE_SERVICIO"`, `approvalStatus: "REJECTED"`, `isSuspended: true`, + nulls `cuit, latitude, longitude`. SellerProfile queda `isActive: false`, `isOnline: false`, `isSuspended: true`, `displayName: "[Cuenta eliminada]"`, `bio: null`, + nulls `cuit, bankAlias, bankCbu, mpAccessToken, mpRefreshToken, mpUserId, mpEmail`. **Decisión intencional**: admin-delete NO anonimiza el email del User — lo mantiene "quemado" para que todo re-registro futuro responda 410. Admin que elimina desde OPS está tomando decisión grave (fraude/abuso), el email debe quedar bloqueado sin intervención humana adicional. (4) `profile/delete/route.ts` — agregada la cascada que FALTABA para Merchant (bug pre-existente: self-delete no apagaba comercios aprobados, los dejaba operativos bajo un User anonimizado). Mismo apagado que admin-delete. Además se agregaron `deletedAt: now`, `isSuspended: true`, `suspendedAt: now`, `suspensionReason: "Cuenta eliminada por el usuario"` al update del User — antes el código anonimizaba email/phone/password sin marcar `deletedAt` explícitamente. El Driver/Seller cascade también recibió REJECTED + fiscal data nulleada (antes solo deactivaban). **Self-delete sigue anonimizando email** (`deleted-${userId}@deleted.moovy.local`) — libera el unique constraint para que la persona pueda volver con cuenta fresca. Admin-delete NO anonimiza — email "quemado". La diferencia es deliberada: el usuario que se auto-elimina merece la opción de volver; el usuario echado por admin no. **Audit log nueva acción**: `ACCOUNT_RESURRECTION_BLOCKED` con `details: { email, deletedAt, source, timestamp, businessName? }`. **Script de detección**: `scripts/cleanup-resurrected-users.ts` (read-only). Tres heurísticas: (a) `User.updatedAt - createdAt > 7d` + merchants APPROVED aprobados pre-update; (b) `bonusActivated: false` + `pendingBonusPoints > 0` + cuenta > 30d + merchants APPROVED; (c) `termsConsentAt > createdAt + 7d`. Reporta candidatos con todos los detalles (merchants con approvedAt, drivers, sellers) para que el admin decida manualmente desde OPS. No modifica nada. Uso: `npx tsx scripts/cleanup-resurrected-users.ts`. **TS clean** (solo error pre-existente en `node_modules/.prisma/client` desde ISSUE-021). **Archivos modificados**: `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/admin/users/[id]/delete/route.ts`, `src/app/api/profile/delete/route.ts`, `scripts/cleanup-resurrected-users.ts` (nuevo). **Regla nueva**: nunca un endpoint de registro debe escribir sobre un User soft-deleted. La única operación válida contra `deletedAt != null` es la restauración explícita del admin o el cascading cleanup en delete. Cualquier intento de "reactivación" silenciosa es un bug por definición.)

Actualización previa: 2026-04-21 (rama `avisame-driver-disponible` RESUELTA — ISSUE-054 "avisame cuando haya repartidor". Nuevo flujo end-to-end para cuando el buyer llega al checkout sin repartidores disponibles: se suscribe con un tap, queda registrado con su ubicación + merchantId (opcional), y recibe push apenas un driver pasa a `isOnline: true` en un radio de 5km. **Schema**: nuevo modelo `DriverAvailabilitySubscription` (id/userId/latitude/longitude/merchantId?/createdAt/expiresAt/notifiedAt?) con relaciones a `User` y `Merchant` (onDelete: Cascade / SetNull). Índices: `userId`, `(notifiedAt, expiresAt)` y `merchantId`. Requiere `npx prisma db push` + `npx prisma generate` local. **Endpoint `POST /api/notifications/driver-available-subscribe`**: auth via `auth()`, rate limit 10/min por IP (`applyRateLimit`), Zod `{ latitude: [-90, 90], longitude: [-180, 180], merchantId: string(1,50)? }`. Antes de crear, valida que `merchantId` exista si viene (evita FKs rotas). Si ya hay sub activa para mismo user + merchant + ubicación a <~100m (delta 0.001°), REFRESCA `expiresAt` y ubicación en vez de duplicar. Enforcement `MAX_ACTIVE_SUBS_PER_USER=3` (429 si supera). TTL `SUBSCRIPTION_TTL_HOURS=4`. Devuelve `{ success, subscriptionId, expiresAt, refreshed }`. DELETE `?id=<subscriptionId>` con ownership check. **Helper `src/lib/driver-availability.ts`**: `notifyAvailabilitySubscribers({driverId, driverLat, driverLng})` busca subs con `notifiedAt: null, expiresAt > now` (cap 500), filtra por Haversine ≤ `NOTIFY_RADIUS_KM=5`. Procesa en chunks de `PUSH_CONCURRENCY=10` con `Promise.allSettled`. Para cada sub hace `updateMany({where:{id, notifiedAt: null}, data:{notifiedAt: now}})` ATÓMICO — si dos drivers se conectan en simultáneo, solo uno gana la carrera, el otro ve `count: 0` y skipea el push (zero doble notificación). Push: `title: "🏍️ ¡Ya hay repartidor en tu zona!"`, `body: "Entrá al checkout y completá tu pedido antes que vuelva a subir la demanda."`, `url: "/checkout"`, `tag: "driver-available-${sub.id}"`. Retorna `{candidates, notified, errors}`. Errores se loguean con pino, nunca throwean. Filtro "dentro del radio del BUYER" (no del comercio) porque el buyer es quien espera en su dirección; el driver se mueve hacia el merchant después. **Trigger en `PUT /api/driver/status`**: antes del update leemos `previous.isOnline` con `findUnique`; `wasOffline = !previous?.isOnline`. Después del update + PostGIS, si `driver.isOnline && wasOffline` disparamos `notifyAvailabilitySubscribers(...).catch(err => console.error(...))` fire-and-forget (no bloquea response). Solo se activa en la transición offline → online real, NO en toggles `DISPONIBLE ↔ OCUPADO` mientras ya estaba online — así evitamos spam cuando el driver pausa para ir al baño y vuelve. **UI checkout** (`src/app/(store)/checkout/page.tsx`): card de "no hay repartidores" rediseñada en el step 1. CTA primaria `🔔 Avisame cuando haya repartidor` (botón MOOVY rojo, full-width). Disabled + hint "Completá tu dirección abajo para activar el aviso" si `!address.latitude || !address.longitude`. Handler `handleSubscribeToDriverAvailable` POST al endpoint, toast.success en éxito, toast.error con mensaje del backend en falla. Estado optimistic `availabilitySubscribed`: al confirmar, la CTA se reemplaza por badge verde `✓ Te avisamos cuando haya` (ya no se puede volver a tocar). Texto top reemplazado a "Suele durar menos de 15 min en esta zona". Alternativas secundarias abajo, separadas por border-top: "Programar para más tarde" (cambia a `deliveryType SCHEDULED`) y "Retirar en local" (cambia a `deliveryMethod pickup`). Iconos: `Clock`, `Bell`, `CheckCircle`, `Loader2`. TS clean (solo errores pre-existentes en `node_modules/.prisma/client` desde ISSUE-021 — se limpian con el `prisma generate` post-schema).)

Actualización previa: 2026-04-21 (rama `fix/driver-offline-mid-delivery` RESUELTA — ISSUE-010 cron detecta driver offline mid-delivery. Extendido `src/app/api/cron/retry-assignments/route.ts` con dos queries nuevas que corren después del retry existente: (1) `prisma.order.findMany` con `driverId: { not: null }` + `deliveryStatus IN [DRIVER_ASSIGNED, DRIVER_ARRIVED, PICKED_UP]` + `status NOT IN [CANCELLED, DELIVERED]` + `OR: [driver.isOnline false, driver.lastLocationAt null, driver.lastLocationAt < now - 15min]` para single-vendor; (2) la misma lógica aplicada a `prisma.subOrder.findMany` para multi-vendor (cada SubOrder tiene su propio `driverId`). Ambas queries están capadas en 50 resultados — Ushuaia (80k hab) no debería tener >50 pedidos mid-delivery simultáneos. Nueva función `notifyAdminOfOfflineDriver({orderId, orderNumber, subOrderId?, driverId, driverName, deliveryStatus, minutesOffline, driverIsOnline, lastLocationAt})` emite socket event `driver_offline_mid_delivery` a tres rooms: `admin:<userId>` (cada admin), `admin:orders` y `admin:drivers` (cualquier panel puede renderizar el incidente). **No se reasigna automáticamente** porque el driver puede tener el paquete en mano (PICKED_UP) — la reasignación requiere coordinación humana (llamar al driver, ver si recuperó señal, etc.). Constantes top-level: `DRIVER_OFFLINE_THRESHOLD_MINUTES = 15`, `DRIVER_OFFLINE_ACTIVE_STATES = ["DRIVER_ASSIGNED","DRIVER_ARRIVED","PICKED_UP"] as const`. Se eliminó el `early return` cuando `stuckOrders.length === 0` — antes, si no había órdenes stuck en CONFIRMED, el cron retornaba sin correr el check nuevo; ahora siempre llega al final. El response JSON agrega `driverOfflineAlerts` al payload de stats. Admins reciben el alert cada run del cron (cada 5min) mientras la condición persista — mismo patrón que `stuck_order_alert` del ISSUE-015. TS clean (únicos errores son pre-existentes en `node_modules/.prisma/client` por el `npx prisma generate` pendiente desde ISSUE-021).)

Actualización previa: 2026-04-21 (rama `fix/checkout-breadcrumb-y-tour-buyer` RESUELTA — 2 issues UX pre-launch: ISSUE-055+056 (checkout con 3 tabs Entrega→Pago→Confirmar + tipo de entrega mudado al paso Entrega) + ISSUE-021 (tour buyer primera vez, 3 pantallas). **ISSUE-055+056**: `src/app/(store)/checkout/page.tsx` rediseñado de flujo 1→2 (Envío standalone eliminado, el costo de envío se ve inline en el sidebar "Tu Pedido") a 3 tabs claras Entrega → Pago → Confirmar. El breadcrumb superior muestra el paso actual, los completados con `CheckCircle` y los pendientes con número en círculo gris, con `aria-current="step"` en el activo. El bloque "¿Cuándo querés recibirlo?" (Inmediata vs Programada + `TimeSlotPicker`) se movió del paso Pago al paso Entrega — ahora vive junto al método de entrega (home/pickup) y la dirección, porque es una decisión del "cuándo" de la logística, no del pago. El paso Pago es solo `PointsWidget` + radio Efectivo/MP + "Continuar a confirmar". Paso Confirmar: resumen con cards para dirección (link "Cambiar" → step 1), tipo de entrega (con horario si programada), método de pago (link "Cambiar" → step 2), puntos aplicados (si `pointsUsed > 0`, card verde) y botón final "Confirmar Pedido" (disabled si `SCHEDULED && !slot` o no-pickup sin range). El sidebar "Tu Pedido" ya tenía el desglose completo de ISSUE-059 así que se mantuvo intacto. Import de `AlertCircle` eliminado (lo usaba solo el step 2 standalone viejo). **ISSUE-021**: schema `User.onboardingCompletedAt DateTime?` (requiere `npx prisma db push` + `npx prisma generate`). `src/app/api/onboarding/route.ts` con GET (`{ shouldShow: boolean }`) + POST (marca `new Date()`, idempotente — si ya estaba completo devuelve `alreadyCompleted: true` sin sobrescribir). `src/components/onboarding/BuyerOnboardingTour.tsx`: cliente, 3 slides full-screen (sheet desde abajo en mobile, modal centrado en desktop) con gradientes de marca (rojo MOOVY / violeta marketplace / amber-orange puntos). Slide 1 qué es Moovy (comercios locales, pago instantáneo, repartidores Ushuaia), slide 2 cómo pedir (flow aceptación → retiro → tracking), slide 3 puntos de bienvenida (10pts/$1k, 1pt=$1, referidos). Dots clickeables para saltar entre slides. Botón X top-right + botón "Saltar" bottom ambos marcan completado. Optimistic close con flag `localStorage` (`moovy_onboarding_done_<userId>`) por si el POST falla por red — evita re-mostrar. Self-gated: useSession authenticated + `GET /api/onboarding` devuelve `shouldShow: true`. Montado en `src/app/(store)/layout.tsx` junto al PromoPopup. Body scroll lockeado mientras está visible. Accesibilidad: `role="dialog" aria-modal="true" aria-label="Tour de bienvenida"`.)
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
✅ Carrito — Zustand multi-vendor con groupByVendor() + detección automática multi-vendor + toast informativo
✅ Checkout — Cash + MercadoPago Checkout Pro, puntos como descuento, delivery fee per-vendor para multi-vendor
✅ Pagos MP — Webhook HMAC + idempotency + auto-confirm + stock restore on reject
✅ Assignment Engine — PostGIS + Haversine fallback, ciclo timeout/retry por driver + per-SubOrder assignment para multi-vendor
✅ Tracking — GPS polling cada 10s + OrderTrackingMiniMap (dynamic import) + per-SubOrder tracking cards para multi-vendor
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
✅ Publicidad — Espacios publicitarios (Hero, Banner Promo, Destacados, Productos), precios en Biblia Financiera, sección Marketing en OPS
✅ Recuperación carritos — Cron cada 30min detecta carritos abandonados, envía hasta 2 emails + push (2h y 24h), configurable via MoovyConfig
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
- Delivery fee (Biblia v3): max(min_vehiculo, costo_km × dist × 2.2) × zona × clima + subtotal×5%. Zonas A/B/C. Factor 2.2
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
- Publicidad 2026-03-29 (Biblia v3): 4 paquetes: VISIBLE $25K, DESTACADO $50K, PREMIUM $100K, LANZAMIENTO ESPECIAL $150K. Se activa en Fase 2 (5+ comercios activos). REEMPLAZA los 6 espacios anteriores. Sidebar OPS con sección Marketing.
- Sidebar OPS reorganizado 2026-03-27: Nueva sección "Marketing" (Hero Banners, Banner Promo, Destacados). Paquetes B2B separados de Catálogo.
- Dólar referencia 2026-03-27: USD 1 = ARS 1.450.
- Biblia Financiera v3 2026-03-29: Documento maestro aprobado como FUENTE DE VERDAD para lanzamiento. Puntos MOOVER reformulados (10pts/$1K, $1/pt, 4 niveles, boost 30 días). Delivery con factor 2.2 + zonas A/B/C + 5% operativo embebido. Comisión 0% mes 1 comercios. Protocolo efectivo 3 capas. Publicidad 4 paquetes ($25K-$150K). Nafta $1,591/litro. Gastos fijos ~$440K/mes.
- Multi-vendor delivery 2026-04-08: Cada SubOrder tiene delivery independiente con su propio repartidor, fee y tracking. Carrito detecta multi-vendor y muestra toast informativo (una vez por sesión). Checkout calcula delivery fee por vendor en paralelo via /api/delivery/calculate. Order API valida fees server-side por grupo y los asigna a SubOrders. Assignment engine tiene startSubOrderAssignmentCycle() que usa campos propios de SubOrder (pendingDriverId, assignmentExpiresAt, attemptedDriverIds). Smart batching: si comercios están a <3km Y el volumen combinado cabe en el mismo vehículo, se asigna el mismo repartidor. Merchant/seller confirm routes disparan asignación per SubOrder para multi-vendor. Retry cron maneja SubOrders stuck. Tracking muestra cards independientes por SubOrder con estado, driver, mini-mapa y items. Fees desglosados por vendor en resumen del pedido.
- UX smoke test 2026-04-07: Búsqueda incluye descripción (OR clause). Chat bubble draggable (hooks antes de return condicional). Notas de producto dinámicas desde merchant config (deliveryRadiusKm, minOrderAmount, allowPickup). Fix crítico puntos MOOVER: display usaba Math.floor(price) = 100x inflado, corregido a Math.floor(price/100) = 10pts/$1K. Badge "Compra protegida". Checkout: CTA "Seguir comprando" + subtotal en botón mobile.
- calculateEstimatedEarnings 2026-04-08: Función en assignment-engine.ts que calcula ganancia estimada del driver para mostrar en la oferta de pedido. Busca DeliveryRate de DB, fallback a rates hardcoded (Biblia v3). Fórmula: max(base, perKm × distancia × 2.2) × 0.80. Se usa en startAssignmentCycle, startSubOrderAssignmentCycle y rejectOrder.
- Control de acceso por rol 2026-04-10: Centralizado en `src/lib/role-access.ts` con `getMerchantAccess(userId)`, `getDriverAccess(userId)` y `getSellerAccess(userId)`. Cada helper hace UNA query y devuelve `{ canAccess, reason, redirectTo, message }` con la cadena completa: registered → approved → not suspended → active. Los 3 layouts protegidos (`/comercios/(protected)`, `/repartidor/(protected)`, `/vendedor/(protected)`) llaman al helper correspondiente después del check de rol. **Fix crítico**: el layout de `/repartidor/(protected)` NO tenía check de rol ni de approvalStatus (sólo bounced suspended drivers). Ahora bloquea no-drivers, pending, rejected y suspended. Admins bypasean los helpers explícitamente en cada layout porque pueden no tener fila Merchant/Driver/SellerProfile. **Decisión**: UserRole siempre se crea con `isActive: true` en todos los endpoints de register/activate (incluyendo DRIVER pending de aprobación) para que el JWT incluya el rol y el portal switcher muestre el tab. El gating real pasa por `approvalStatus` en la DB vía `role-access.ts`. Esto simplifica el auto-heal del JWT callback a defensa en profundidad. Se creó `/repartidor/pendiente-aprobacion/page.tsx` como contraparte de la misma página en `/comercios`. Se arregló también el silent failure del botón CONECTAR en driver dashboard (ahora muestra toast con el mensaje real del backend en vez de ignorar errores).
- Auto-heal de UserRole en login 2026-04-10: Nuevo helper `src/lib/auto-heal-roles.ts` con `autoHealUserRoles(userId)` que repara inconsistencias de `UserRole.isActive` ANTES de construir el JWT. Si existe `Merchant` pero `UserRole COMERCIO` está inactivo (o no existe), lo crea/activa. Mismo criterio para DRIVER (si `Driver.approvalStatus === APPROVED` o `Driver.isActive`) y SELLER (si `SellerProfile.isActive`). Se llama desde dos lugares: (1) `authorize()` en `src/lib/auth.ts` después de validar bcrypt — así CADA login nuevo auto-repara drift histórico y el JWT emitido ya incluye los roles correctos; (2) el trigger `update` del callback `jwt()` con `refreshRoles: true`, reemplazando el código inline duplicado que tenía la misma lógica. **Motivo**: antes, si un user tenía un `Merchant` pero su `UserRole COMERCIO` quedó en `isActive: false` (código viejo, migración parcial, drift histórico), el `authorize()` nunca lo levantaba porque filtra `where: { isActive: true }`. Resultado: `proxy.ts` lo bouncenaba a `/` al entrar a `/comercios` porque el JWT no tenía el rol. El auto-heal en login elimina esa clase entera de bugs sin necesidad de reparaciones manuales en DB. **Nota importante**: el auto-heal de COMERCIO NO revisa `Merchant.approvalStatus` — inyecta el rol igual aunque esté PENDING. El gate de aprobación es responsabilidad exclusiva de `role-access.ts` (`getMerchantAccess`) en el layout protegido, que es quien decide si mandar al user a `/comercios/pendiente-aprobacion`. Separar gating de role-presence evita que `proxy.ts` bounce al inicio a usuarios que deberían ver la pantalla de "pendiente de aprobación".
- **Sistema de roles derivados (rediseño completo) 2026-04-10**: Reemplaza al control de acceso + auto-heal anteriores con un único módulo canónico en `src/lib/roles.ts`. **Principio rector**: "Los roles NO se guardan, se DERIVAN". COMERCIO/DRIVER/SELLER se calculan desde el estado del dominio (`Merchant.approvalStatus`, `Driver.approvalStatus + isSuspended`, `SellerProfile.isActive`) en CADA request, eliminando la entera clase de bugs de drift de UserRole. El rol ADMIN sigue viniendo de `User.role = 'ADMIN'` (legacy field) porque no tiene domain state asociado, y el rol base USER también viene de `User.role`. **API canónica**: `computeUserAccess(userId)` hace UNA query con joins a Merchant/Driver/SellerProfile y retorna `{ userId, user, isAdmin, merchant, driver, seller }` donde cada sub-objeto tiene `status: "none" | "pending" | "approved" | "rejected" | "active" | "suspended" | "inactive"`. Helpers `requireMerchantAccess(userId)`, `requireDriverAccess(userId)`, `requireSellerAccess(userId)` usan un switch exhaustivo con `never` check y disparan `redirect()` al lugar correcto (login/pending/rejected/suspended/home) si el gate no pasa. React `cache()` deduplica llamadas dentro del mismo request. **Transiciones atomizadas**: `approveMerchantTransition`, `rejectMerchantTransition`, `approveDriverTransition`, `rejectDriverTransition` encapsulan el update del approvalStatus + audit log (usando `details: JSON.stringify(...)` — el campo se llama `details`, no `metadata`) en una sola función reusable. **Refactor global**: (1) `src/lib/auth.ts` — `authorize()` y `jwt()` callback ahora llaman `computeUserAccess()` en vez de leer `roles: { where: { isActive: true } }`. El JWT `roles[]` se volvió un CACHE de estado derivado, no fuente de verdad. (2) Los 3 layouts protegidos (`comercios/(protected)`, `repartidor/(protected)`, `vendedor/(protected)`) ahora son 3 líneas: `auth()` → `require*Access(userId)` → render. (3) Admin approve/reject de merchants y drivers usan las funciones de transición (no escriben UserRole). (4) Endpoints de registro/activate/cancel (register, register/merchant, register/driver, activate-merchant, activate-driver, activate-seller, seller/activate, admin/merchants/create, auth/cancel-merchant, auth/cancel-driver, profile/delete, admin/users/[id]/delete, admin/users/bulk-delete) ya NO escriben UserRole en ningún código de write-path. (5) `assignment-engine.ts` y `cron/retry-assignments` ahora leen admins vía `User.role = 'ADMIN'` en vez de `UserRole` filtrado. (6) Se borraron `src/lib/auto-heal-roles.ts` y `src/lib/role-access.ts`. **Decisión deliberada**: NO se refactoriza `auth-utils.ts` (126 archivos consumen `hasRole`, `hasAnyRole`, `getUserRoles`) porque su implementación lee el JWT `roles[]`, que ahora se popula desde `computeUserAccess()` en cada login/refresh. Queda como cache rápido session-based; el source of truth siempre es el dominio via `computeUserAccess()`. **Bug histórico resuelto**: antes, si un user tenía Merchant APPROVED pero su `UserRole COMERCIO` quedaba en `isActive: false` por drift, el `proxy.ts` lo bouncenaba al entrar a `/comercios`. Con el rediseño eso es IMPOSIBLE: no hay nada que drift contra — el rol se calcula del Merchant en cada request. **Regla crítica**: cualquier campo nuevo de tipo approval/access debe modelarse como columna del dominio (Merchant/Driver/SellerProfile) y derivarse via `computeUserAccess`, NUNCA agregando una nueva fila en UserRole. Los endpoints de activate/register/cancel/delete ya no deben tocar UserRole jamás. Validación: `npx tsx scripts/validate-role-flows.ts` corre 12 tests (6 estáticos que verifican que no quedan writes a UserRole + los archivos legacy fueron borrados + layouts/endpoints usan los helpers canónicos; 6 dinámicos contra DB real que verifican que Merchants APPROVED tienen `merchant.status === "active"`, PENDING tienen `"pending"`, drivers matchean su approvalStatus, sellers matchean su isActive, soft-deleted retornan `null`, y admins tienen `isAdmin === true`). Tabla `UserRole` sigue existiendo en Prisma schema por compatibilidad con `auth-utils.ts` pero ya NO se escribe en ningún código nuevo — en una futura limpieza se puede deprecar por completo.

- **Fix portal switcher + registro loop + approve/reject drivers 2026-04-12**: (1) OPS: links de "volver" en `/ops/destacados` y `/ops/banner-promo` apuntaban a `/ops` (causaba flash por redirect chain), corregido a `/ops/dashboard`. (2) Registro repartidor/vendedor: `useEffect` en client component leía JWT `roles[]` (cache stale) para decidir redirect, causando loop infinito `/registro` ↔ `/dashboard` cuando el JWT tenía rol DRIVER pero el domain state era `"none"`. Fix: extraído Client Component (`RepartidorRegistroClient.tsx`, `VendedorRegistroClient.tsx`) y nuevo Server Component `page.tsx` que usa `computeUserAccess()` con switch exhaustivo. NO usa `requireDriverAccess()`/`requireSellerAccess()` porque esos helpers redirigen `"none"` a `/registro` = recursión infinita. (3) OPS approve/reject drivers: endpoints `/api/admin/drivers/[id]/approve` y `/reject` solo exportaban `PUT`, pero `usuarios/[id]/page.tsx` llamaba con `method: "POST"` → 405. Fix: agregado wrapper `POST` que llama `PUT()` (mismo patrón que merchants).
- **Fix Service Worker auto-reload 2026-04-12**: `public/sw.js` tenía `self.skipWaiting()` + `clients.claim()` y `ServiceWorkerRegistrar.tsx` hacía `window.location.reload()` al detectar `updatefound` → `activated`. Esto creaba un ciclo de recarga cada ~60s en producción que interrumpía formularios. Fix: eliminados `skipWaiting()` y `clients.claim()` de sw.js (ahora v3). Eliminado el auto-reload del Registrar. El nuevo SW se instala en background y toma control en la próxima visita natural. Push notifications, cache offline y fallback offline siguen funcionando igual.
- **Script reset-admin 2026-04-12**: `scripts/reset-admin.ts` lee `ADMIN_RESET_EMAIL` (fallback `ADMIN_EMAIL`) + `ADMIN_PASSWORD` del `.env`, hashea con bcrypt(12) y actualiza la DB. También asigna `role: "ADMIN"` si el usuario no lo tenía. Variables `.env`: `ADMIN_EMAIL` sigue siendo para notificaciones (`src/lib/email.ts`), `ADMIN_RESET_EMAIL` es para el script. Uso: `npx tsx scripts/reset-admin.ts` (local o VPS vía SSH).
- **Fix bug referidos 2026-04-12**: `activatePendingBonuses()` en `src/lib/points.ts` otorgaba los puntos de referido correctamente pero NUNCA actualizaba `Referral.status` de `"PENDING"` a `"COMPLETED"`. Resultado: `/api/referrals` filtraba por `status: 'COMPLETED'` y la página de invitar amigos siempre mostraba 0 amigos, 0 puntos. Fix: después de otorgar puntos, `updateMany` el Referral a `status: "COMPLETED"` con los montos reales de PointsConfig.
- **Recuperación de carritos abandonados 2026-04-12**: Sistema completo para recuperar carritos abandonados via email + push. Schema: `SavedCart` ahora tiene `reminderCount`, `lastRemindedAt`, `recoveredAt`, `cartValue` + índice en `updatedAt`. Cron: `/api/cron/cart-recovery` (cada 30min) detecta carritos sin actividad por X horas (configurable), envía hasta 2 recordatorios (2h y 24h), verifica que el usuario no haya hecho un pedido posterior, marca como recuperado si sí. Email: `sendCartAbandonmentEmail()` en `email-p0.ts` con lista de productos, total, y CTA a checkout. Push: título y body diferenciados por 1er/2do recordatorio. Config: 5 keys en MoovyConfig (`cart_recovery_enabled`, `cart_recovery_first_reminder_hours`, `cart_recovery_second_reminder_hours`, `cart_recovery_max_reminders`, `cart_recovery_min_cart_value`). El cart API resetea `reminderCount` cuando el usuario modifica su carrito (evita re-notificar después de actividad). Carritos legacy con `cartValue: 0` no reciben recordatorios hasta su próxima modificación. Email registry actualizado con 2 entries (#175, #176) en categoría "Recuperación". Estimación de impacto: +5-10% conversión sobre carritos abandonados.
- **Fix reset-admin.ts truncado 2026-04-12**: El script `scripts/reset-admin.ts` estaba truncado (faltaban `}`, `finally`, `prisma.$disconnect()` y llamada a `main()`). Completado.
- **Fix crítico cálculo de puntos MOOVER 2026-04-15**: Auditoría reveló que `PointsConfig` en la DB de producción tenía valores invertidos: `pointsPerDollar=1` (debía ser `0.01`, resultado: cashback 100% en vez de 1%), `pointsValue=0.01` (debía ser `1`, cada punto valía $0.01 al canjear en vez de $1), `signupBonus=100` (debía ser `1000`), `referralBonus=200` (debía ser `1000`), `refereeBonus=100` (debía ser `500`). El fix del 2026-04-07 había corregido el display pero NO la config de fondo. Corregidos los 5 valores via UPDATE directo en producción. Adicionalmente: (1) `src/app/api/orders/route.ts:843-868` otorgaba EARN en la creación del pedido (antes de DELIVERED, violando Biblia v3 y generando puntos regalados si luego se cancelaba). Eliminado el bloque. (2) Nueva función `awardOrderPointsIfDelivered(orderId)` en `src/lib/points.ts` que se invoca en `src/app/api/driver/orders/[id]/status/route.ts` cuando `deliveryStatus === "DELIVERED"`. Idempotente: usa `Order.pointsEarned` (nuevo campo en schema) para evitar doble award. Aplica el `earnMultiplier` del nivel del usuario (MOOVER×1, SILVER×1.25, GOLD×1.5, BLACK×2), cosa que el código eliminado no hacía. (3) Nueva función `reverseOrderPoints(orderId, reason)` que revierte el EARN (si pasó a DELIVERED) y devuelve el REDEEM (puntos canjeados) al balance. Invocada en `orders/[id]/cancel`, `merchant/orders/[id]/reject` y `ops/refund`. Idempotente via el mismo campo. (4) Schema: agregados `Order.pointsEarned Int?` y `Order.pointsUsed Int?`. Requiere `npx prisma db push` + `npx prisma generate`. (5) Los puntos REDEEM siguen registrándose dentro de la transacción de creación de orden (línea ~780) porque el descuento se aplica al pago inmediato; esto no cambió. (6) Datos históricos en producción: 2 usuarios afectados (`ing.iyad@gmail.com` beta tester real con 100M pts y `maugrod@gmail.com` cuenta de test). Aplicado ADJUSTMENT compensatorio con la diferencia exacta contra lo que debió haber sido (`SUM(FLOOR(subtotal * 0.01))`). Balances finales: ing.iyad con 1.000.410 pts legítimos, maugrod con 10 pts legítimos. **No se tocó `activatePendingBonuses`**: el signup/referral bonus ya no dispara al crear la orden sino al pasar a DELIVERED dentro de `awardOrderPointsIfDelivered`. Esto es intencional: la Biblia dice que el referral se completa "al primer pedido DELIVERED del referido", no al crearlo.
- **Fix acceso al portal de repartidor desde mi-perfil 2026-04-15**: El link "Panel de Repartidor" en `/mi-perfil` rebotaba al home (`/`) en vez de llevar al dashboard. Causa raíz: `src/proxy.ts:161-167` gateaba `/repartidor/*` chequeando `hasAnyRole(session, ['DRIVER', 'ADMIN'])` contra el JWT cacheado. El JWT `roles[]` puede estar desincronizado con el estado real del dominio (usuario activado como driver después del login, JWT no refrescado, etc.). Eso rompe el modelo documentado el 2026-04-10 ("Los roles NO se guardan, se DERIVAN"): el JWT debe ser un cache rápido, no gate terminal. **Fix**: removido el chequeo de rol en el proxy para `/repartidor/*` — mantiene solo la validación de sesión. El layout `/repartidor/(protected)/layout.tsx` ya usa `requireDriverAccess()` que consulta DB vía `computeUserAccess()` (source of truth canónico) y redirige al lugar correcto (registro/pendiente/login/home) según el estado real. El mismo patrón debería aplicarse eventualmente a `/comercios/*` y `/vendedor/*` pero no se toca en esta rama porque funciona. **Fix adicional en `src/app/(store)/mi-perfil/page.tsx`**: (a) condición de visibilidad del botón Panel de Repartidor cambiada de `driverStatus === "ACTIVE"` a `(hasDriver || driverStatus === "ACTIVE")` para alinear con el botón de Comercio; (b) click handler simplificado: `router.push` cuando el JWT ya tiene DRIVER (sin flicker), `window.location.href` solo cuando el JWT aún no tiene DRIVER y necesita refresh. (c) Fix del 404 ruidoso en Console: el `useEffect` fetcheaba `/api/seller/profile` en el primer render incluso si el user ya tenía rol SELLER (porque en el primer render `session` todavía cargaba y `hasSeller` era false); agregado guard `sessionReady && !hasSeller` + short-circuit que marca el seller como activo directo si el JWT ya lo confirma.
- **Auto-desconexión de driver al cambiar de portal 2026-04-15**: Decisión del consejo directivo. Si un driver online cambia del portal repartidor a otro portal (tienda, comercio, vendedor, ops), **se desconecta automáticamente** para que el assignment engine no le asigne pedidos que no va a ver. Excepción: si tiene un pedido activo en curso (`deliveryStatus` en `DRIVER_ASSIGNED` / `DRIVER_ARRIVED` / `PICKED_UP`), el cambio se **bloquea con modal** que dice "Tenés una entrega en curso (#MOV-XXXX). Completala antes de cambiar de portal" y botón "Volver al pedido". Implementación: (1) Nuevo endpoint `GET /api/driver/active-order` (`src/app/api/driver/active-order/route.ts`) que devuelve `{ hasActive, orderId, orderNumber, deliveryStatus }`. (2) `src/components/ui/PortalSwitcher.tsx` convertido a client component con hook `useSmartPortalNavigation` que: fetch active-order (si hay activo → modal bloquea), fetch driver status (si online → PUT `/api/driver/status` con `status: "FUERA_DE_SERVICIO"` + toast informativo "Te desconectamos del portal repartidor..."), luego navegar. La lógica solo se activa cuando `currentPortal === "repartidor"` y el destino no es el mismo portal (sin overhead para switches entre otros portales). `PortalSwitcherDark` (variante del portal driver dark mode) también aplica el mismo comportamiento — es justamente el switcher que el driver ve al salir. **Motivo**: un driver "online pero ausente" es peor que offline — el assignment engine lo elige primero, timeout, pasa al siguiente, el buyer espera 30s extra por cada driver fantasma. En ciudad chica con 3-5 drivers activos, el tiempo promedio de asignación se duplicaba. Fase 2: considerar un toggle "Modo pausa" configurable por el driver (recibir ofertas solo cuando está activamente en el portal vs permitir ofertas en background).
- **Responsive OPS panel 2026-04-16**: Pase mobile-first en 9 secciones del panel OPS que estaban rotas en celular (tablas desbordadas, textos cortados, botones apilados mal). Patrones aplicados: (1) Tablas con `hidden md:block` + vista de tarjetas `md:hidden space-y-3` en paralelo para mobile (Usuarios, Destacados, Lealtad Comercios). (2) Grids `grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4` con `min-w-0 truncate` en labels y tamaños tipográficos responsive (`text-2xl sm:text-3xl`, `text-xs sm:text-sm`) para stat cards (En Vivo, Soporte, Destacados). (3) Headers que apilan en mobile con `flex-col sm:flex-row gap-4`, botones `w-full sm:w-auto flex-shrink-0` (Hero Banner, Lealtad Comercios, Motor Logístico SectionCard). (4) Tabs con `overflow-x-auto min-w-max whitespace-nowrap` para scroll horizontal en Soporte y Motor Logístico (8 tabs). (5) Paddings responsive (`px-4 sm:px-6`, `p-4 sm:p-6`, `py-6 sm:py-8`). (6) Filtros con `flex-wrap` y `flex-1 min-w-0` en date pickers (Pedidos). **Archivos modificados**: `ops/(protected)/{usuarios,live,pedidos,soporte,hero,destacados,lealtad-comercios,configuracion-logistica}/page.tsx`. (7) Bonus: `ops/(protected)/config-biblia/BibliaConfigClient.tsx` — cambio de `useState<SectionKey | null>("delivery")` a `useState<SectionKey | null>(null)` para que la Biblia Financiera abra colapsada (toda la vista visible sin scroll), no con "Delivery & Logística" desplegado por default.
- **Fix UX navegación repartidor 2026-04-17 (rama `fix/ride`, Ramas 1+2+3 completas)**: Pase completo sobre los problemas reportados del portal driver: botones flotantes superpuestos, BottomSheet de 4 snaps con conflictos de scroll, navegación con distancias estáticas, warnings de deprecación en consola. **Rama 1 (UX crítico)**: (1) Consolidación de botones flotantes en `RiderMiniMap.tsx` — eliminado el botón Recenter/Crosshair duplicado (el dashboard ya expone "Centrar" + "CONECTADO"), movido el toggle Rumbo/Norte a `absolute bottom-[180px] left-3 z-20` para no chocar con el HOME. Z-index hierarchy: dashboard top bar `z-30` > BottomSheet `z-20` > mapa controls. (2) `BottomSheet.tsx` refactor de 4 estados (`expanded`/`mid`/`minimized`/`hidden`) a 2 estados (`expanded`/`peek`) estilo Uber/Cabify. Peek snap = `calc(100% - 220px - env(safe-area-inset-bottom))` para mostrar info crítica sin ocupar la mitad de la pantalla. Scroll isolation: `touchAction: state === "expanded" ? "pan-y" : "none"` previene conflicto con el drag del sheet. `normalizeState()` helper mapea valores legacy de localStorage (`minimized`→`peek`, `mid`→`expanded`) para retrocompatibilidad. (3) CSP: `next.config.ts` agrega `'wasm-unsafe-eval'` al `script-src` (Google Maps ahora usa WebAssembly; `unsafe-eval` sería más laxo). (4) `useAdvancedMarker` hook en `RiderMiniMap.tsx` cambia `addListener("click", ...)` por `addListener("gmp-click", ...)` (warning de deprecación de Google: `AdvancedMarkerElement.click` será removido). **Rama 2 (navegación real-time)**: (1) Polyline matching — proyección perpendicular del GPS del driver sobre segmentos de la ruta con búsqueda en ventana de 30 puntos (optimización vs recorrer los ~500 del path completo) + haversine para distancia perpendicular. Equirectangular projection (~0.1% error bajo 200m, suficiente para navegación urbana). `NavStepInfo` extendido con `distanceMeters`, `durationSeconds`, `pathStartIdx`, `pathEndIdx` para poder calcular live por step. (2) Tabla de longitudes acumuladas (`cumulativeLenRef`) para O(1) lookup de distancia restante por diferencia de dos sumas. Instrucciones de navegación actualizan texto en vivo en `NavUpdateData` (liveStepDistanceText/liveStepDurationText) en cada tick del GPS, no quedan congeladas en lo que devolvió la API. (3) Detección de desvío — si la distancia perpendicular supera `OFF_ROUTE_METERS=60` durante `OFF_ROUTE_STREAK=3` muestras consecutivas (~30s a 10s polling), bumpeamos `refetchNonce` que fuerza re-fetch de la ruta. Cooldown `OFF_ROUTE_COOLDOWN_MS=20000` previene storms. El useEffect de route-fetch tiene bypass `forcedByNonce` sobre el early-return para que el nonce dispare el refetch aunque no cambie el stage (MERCHANT↔CUSTOMER). **Rama 3 (Routes API)**: (1) `src/lib/routes-api.ts` — wrapper cliente para `https://routes.googleapis.com/directions/v2:computeRoutes` con field mask restringido (control de billing). Exports: `computeRoute(origin, destination)` que devuelve un shape compatible con DirectionsStep (legs[].steps[] con path/distance/duration/maneuver/end_location), `isRoutesApiEnabled()` helper (chequea `NEXT_PUBLIC_USE_ROUTES_API === "true"`). `normalizeManeuver()` convierte SCREAMING_SNAKE_CASE de Routes API a lowercase-dash legacy para que el `getManeuverIcon` del BottomSheet siga funcionando sin cambios. (2) `RiderMiniMap.tsx` — useEffect de route-fetch ahora branchea por `isRoutesApiEnabled()`: si está activo llama `await computeRoute(origin, destination)`, si no cae al legacy `DirectionsService`. Ambos backends normalizan a un shape común via helper `applyNormalizedLegs` (single source of truth para state updates). Cancel guard con flag `cancelled` en cleanup del effect evita stale writes si el stage cambia mientras está pendiente la respuesta. **Estado Routes API**: wrapper implementado y funcional, pero el feature flag `NEXT_PUBLIC_USE_ROUTES_API` NO está seteado en el .env todavía — el código cae al legacy DirectionsService por default. Para activar: (a) habilitar Routes API en Google Cloud Console (proyecto 1036892490928), (b) setear `NEXT_PUBLIC_USE_ROUTES_API=true` en .env, (c) testear una entrega de punta a punta. El fallback a DirectionsService existe justamente para evitar bloquear el lanzamiento si hay problemas de billing/configuración con Routes API. **Verificación TS**: `npx tsc --noEmit --skipLibCheck` limpio sobre todo `src/**` después del refactor (los únicos errores son en `.next/dev/types/*` y `node_modules/.prisma/client/*.d.ts`, ambos generados, no nuestros).
- **Fix horario del comercio en detail page 2026-04-18 (rama `fix/merchant-schedule-detail`)**: Bug crítico detectado por Mauro: los horarios de atención del merchant se guardaban correctamente en `Merchant.scheduleJson` desde `/comercios/mi-comercio`, pero el buyer en `/store/[slug]` (a donde redirige `/tienda/[slug]`) nunca los veía ni se respetaban para cerrar la tienda automáticamente. **Causa raíz**: la página del detalle usaba `merchant.isOpen` crudo (que solo refleja la pausa manual del merchant, no el horario) para el banner "CERRADO" y nunca llamaba a `checkMerchantSchedule()` — mientras que el listado `/tiendas` sí lo hacía. Inconsistencia entre ambas páginas. **Fix**: (1) Nuevo componente `src/components/store/MerchantScheduleWidget.tsx` (Server Component puro con `<details>/<summary>` HTML nativo, cero JS al cliente, importante para Ushuaia con conexiones irregulares) que renderea el estado actual (`Abierto · hasta las 21:00` / `Cerrado · Abre mañana a las 09:00` / `Cerrado temporalmente`) + acordeón expandible con los 7 días y el día actual marcado con badge rojo. Reusa `checkMerchantSchedule` + `parseSchedule` + `DEFAULT_MERCHANT_SCHEDULE` de `src/lib/merchant-schedule.ts`. Si `scheduleJson === null`, muestra nota "Horario estándar — el comercio aún no personalizó sus horas". (2) `src/app/(store)/store/[slug]/page.tsx` ahora calcula `scheduleResult = checkMerchantSchedule({isOpen, scheduleJson})` al entrar y usa `scheduleResult.isCurrentlyOpen` en vez de `merchant.isOpen` para: el banner rojo del cierre (con 3 variantes de mensaje: pausado / cerrado con próxima apertura / cerrado genérico) y el prop `merchant.isOpen` que se pasa al `ProductCard` (para que el botón "Agregar al carrito" respete también el horario). El widget se inserta en el info bar debajo de rating/delivery/dirección. (3) El guard server-side en `/api/orders/route.ts:440` ya usa `validateMerchantCanReceiveOrders` desde 2026-03-24 — no se tocó. Defense in depth intacta. **NO se tocó**: el schema, la lib de schedule, el formulario del panel de comercio, el endpoint de save, ni el listado `/tiendas`. **Motivo del bug histórico**: la lib de schedule se refactorizó (última actualización 2026-04-13) y se integró correctamente en el listado y en el guard de orders, pero la página de detalle quedó sin migrar. Sin tests de UI end-to-end, el disconnect pasó desapercibido hasta que Mauro detectó que el buyer no veía los horarios. **Regla nueva**: si se agrega/cambia un campo en el panel del merchant (schedule, approvalStatus, minOrderAmount, etc.), verificar explícitamente que las 3 superficies downstream lo respeten — listado público, detail público y validación server-side en creación de orden.
- **ISSUE-001 PIN doble de entrega 2026-04-17 (rama `feat/pin`, Fases 1-9 completas)**: Sistema completo de PIN doble para prevenir fraude del repartidor ("marcé entregado sin ir"). **Schema**: agregados `pickupPin` + `pickupPinVerifiedAt` + `pickupPinAttempts` + `deliveryPin` + `deliveryPinVerifiedAt` + `deliveryPinAttempts` en `Order` y `SubOrder` (multi-vendor independiente). `Driver.fraudScore Int @default(0)` + `isSuspended` existente. Requiere `npx prisma db push` + `npx prisma generate`. **Generación (`src/lib/pin.ts`)**: `generatePinPair()` usa `crypto.randomInt(0, 1_000_000)` → 6 dígitos con leading zeros, pickup y delivery NUNCA coinciden (regenera en colisión, ~0.0001%). `verifyPin()` usa `timingSafeEqual` (resistente a timing attacks). `sanitizePinInput()` tolera "048 291" / "048-291". `formatPinForDisplay("048291")` → `"048 291"`. Constantes exportadas: `PIN_MAX_ATTEMPTS = 5`, `PIN_GEOFENCE_METERS = 100`, `PIN_GEOFENCE_GRACE_METERS = 50`, `PIN_FRAUD_THRESHOLD = 3`. PINs se crean en `orders/route.ts` dentro del `$transaction` de creación. **Verificación unificada (`src/lib/pin-verification.ts`)**: `verifyOrderOrSubOrderPin({ entityType, entityId, pinType, pinInput, driverId, userId, driverGps })` encapsula toda la lógica: sanitize + format check → ownership check → state check (pickup requiere DRIVER_ARRIVED, delivery requiere PICKED_UP) → idempotencia si ya verificado → límite 5 intentos → geofence 100m (con gracia GPS si accuracy > 100m) → `timingSafeEqual` → audit log → incrementar `attempts` atomically → si `attempts >= PIN_MAX_ATTEMPTS` incrementar `Driver.fraudScore` + emitir socket `pin_locked` a rooms `admin:orders` y `admin:fraud`. Retorna `{ success, status (HTTP), error, errorCode, remainingAttempts, distanceMeters, verifiedAt, alreadyVerified }`. **Endpoints**: `POST /api/driver/orders/[id]/verify-pin` y `POST /api/driver/suborders/[id]/verify-pin`, thin wrappers que parsean body `{ pinType: "pickup"|"delivery", pin, gps? }` y llaman al helper. **State machine**: `src/app/api/driver/orders/[id]/status/route.ts` bloquea transición `→ PICKED_UP` sin `pickupPinVerifiedAt` seteado y `→ DELIVERED` sin `deliveryPinVerifiedAt` seteado. Retorna `409 { errorCode: "PIN_NOT_VERIFIED" }`. **UI por rol**: (1) Merchant en `/comercios/pedidos/[id]`: card destacada mostrando `pickupPin` solo cuando `deliveryStatus === "DRIVER_ARRIVED"`. Sanitización server-side en `/api/merchant/orders/[id]` (si no es el estado correcto → `pickupPin: null`). (2) Driver en `/repartidor/pedidos/[id]`: keypad numérico de 6 dígitos (componente `PinKeypad`) con input masking, botón "Verificar" que llama al endpoint, muestra intentos restantes, bloqueo visual al agotarse. (3) Buyer en `/mis-pedidos/[orderId]`: badge "🔐 Código de entrega" con display grande del `deliveryPin` solo cuando `deliveryStatus ∈ ["PICKED_UP", "IN_DELIVERY"]`. Sanitización en `/api/orders/[id]` (si status distinto → `deliveryPin: null`). Push dedicado `notifyBuyerDeliveryPin()` disparado junto con el push de PICKED_UP (tag distinto `order-pin-${orderNumber}` para no colapsar). **Fraud detection + auto-suspensión**: cuando `Driver.fraudScore >= PIN_FRAUD_THRESHOLD (3)`, el driver se suspende automáticamente (`isSuspended: true`, `suspendedAt`, `suspensionReason`) y se loguea `DRIVER_AUTO_SUSPENDED`. Rationale: 3 PIN_LOCKED en distintos pedidos es estadísticamente improbable sin intención maliciosa. Admin puede revertir manualmente. **Audit log** (entityType Driver u Order/SubOrder): `PIN_VERIFIED`, `PIN_VERIFICATION_FAIL`, `PIN_LOCKED`, `PIN_GEOFENCE_FAIL`, `DRIVER_AUTO_SUSPENDED`, `DRIVER_FRAUD_RESET`. `details` como JSON con pinType, driverId, attempts, distanceMeters, fraudScore. **Panel admin `/ops/fraude`**: stats cards (total incidentes, drivers flagged, auto-suspendidos, resets), tabla responsive de drivers con `fraudScore > 0` (mobile cards + desktop table), feed de eventos paginado auto-refresh 30s con icono/color por action. Botones reset (resetear score) y reactivar (levantar suspensión). `POST /api/admin/fraud/drivers/[id]/reset` acepta `{ resetScore, unsuspend, note }` y loguea `DRIVER_FRAUD_RESET`. Nueva entrada en `OpsSidebar` sección Operaciones con icono `Shield`. **Testing obligatorio (`scripts/test-pin-verification.ts`)**: 11 tests — funciones puras (`generatePin` formato + entropía, `generatePinPair` no colisión 1000 iters, `verifyPin` match/mismatch/null/longitud/vacío, `sanitizePinInput` espacios/guiones/clampeo, `formatPinForDisplay` casos edge, constantes), sanity de datos (Orders/SubOrders post-Fase1 tienen pickup+delivery distintos y formato correcto, attempts bounded por PIN_MAX_ATTEMPTS+1), invariante fraud (no hay drivers con `fraudScore >= threshold` sin `isSuspended`), AuditLog parsea details como JSON válido, simulación damage cap. **Damage cap calculado**: 3 orders × 5 intentos = 15 fallos antes de auto-suspensión. Exposición estimada `3 × $5,000 = $15,000` ARS por driver malicioso antes de freno. **Pendientes (mejoras incrementales post-launch)**: Fase 11 (offline mode — IndexedDB cache del PIN para validación sin red), Fase 12 (flow "no pude entregar" con foto + GPS + espera mínima validada), Fase 13 (cron 5min que detecta drivers no-moviendo >10min con orden activa). El sistema actual está production-ready sin estas fases; son refinements de edge cases.

## Reglas de negocio (Biblia Financiera v3 — FUENTE DE VERDAD)
- Comisión comercios MES 1: 0% (30 días gratis, inversión de adquisición)
- Comisión comercios MES 2+: 8% sobre ventas, configurable desde MoovyConfig
- Comisión sellers marketplace: 12% desde día 1
- Service fee al comprador: 0% (eliminado, precio limpio: producto + envío)
- Costo operativo: 5% del subtotal embebido en delivery fee (cubre MP 3.81% + margen 1.19%)
- Repartidor: 80% del costo REAL del viaje (NO incluye el 5% operativo)
- Moovy en delivery: 20% del viaje + 5% operativo
- Pedido mínimo: configurable por merchant (minOrderAmount)
- Radio de entrega: configurable por merchant (deliveryRadiusKm, default 5km)
- Timeout merchant: configurable (merchant_confirm_timeout en MoovyConfig)
- Timeout driver: configurable (driver_response_timeout en MoovyConfig)
- Costo real MercadoPago: 3.81% (3.15% + IVA 21%), redondeado a 4% en proyecciones
- Cotización referencia: USD 1 = ARS 1.450
- Gastos fijos mensuales: ~$440,641 ARS (~$304 USD)

### Puntos MOOVER (Biblia v3)
- Earn rate MOOVER (básico): 10 pts por $1,000 gastados (~1% cashback)
- Earn rate SILVER: 12.5 pts/$1,000 (~1.25%)
- Earn rate GOLD: 15 pts/$1,000 (~1.5%)
- Earn rate BLACK: 20 pts/$1,000 (~2%)
- Valor del punto: $1 ARS (1 punto = $1 de descuento)
- Max descuento con puntos: 20% del subtotal
- Min puntos para canjear: 500 puntos
- Signup bonus MES 1 (boost): 1,000 pts ($1,000)
- Signup bonus MES 2+: 500 pts ($500)
- Referral (quien refiere): 1,000 pts (referido debe completar PRIMER pedido DELIVERED)
- Referral (referido): 500 pts (al completar primer pedido)
- Boost lanzamiento (30 días): TODOS los puntos se duplican
- Expiración: 6 meses completos sin pedidos = puntos vencen
- Garantía primer pedido: reembolso completo + 500 pts bonus si hay problema
- Niveles por pedidos DELIVERED en 90 días: MOOVER (0), SILVER (5), GOLD (15), BLACK (40)

### Delivery (Biblia v3)
- Fórmula: fee = max(MINIMO, costo_km × distancia × 2.2) × zona × clima + (subtotal × 5%)
- Factor distancia: ×2.2 (1.0 ida + 1.0 vuelta + 0.2 espera/maniobras)
- Nafta super Ushuaia: $1,591/litro
- Vehículos: Bici ($15/km, min $800), Moto ($73/km, min $1,500), Auto chico ($193/km, min $2,200), Auto mediano ($222/km, min $2,500), Pickup/SUV ($269/km, min $3,000), Flete ($329/km, min $3,800)
- Zona A (Centro/Costa): ×1.0, bonus driver $0
- Zona B (Intermedia): ×1.15, bonus driver +$150
- Zona C (Alta/Difícil): ×1.35, bonus driver +$350
- Zona Excluida: Costa Susana (sin señal celular)
- Clima normal: ×1.0, lluvia leve: ×1.15, temporal fuerte: ×1.30
- Demanda normal: ×1.0, alta (vie-sáb): ×1.20, pico (feriados): ×1.40
- Bonus nocturno (23:00-07:00): +30% al fee del repartidor (lo paga Moovy)
- Categorías marketplace: SOBRE (0-2kg, $800), PEQUEÑO (2-5kg, $1,200), MEDIANO (5-15kg, $2,500), GRANDE (15-30kg, $3,500), EXTRA GRANDE (30-70kg, $5,000), FLETE (70+kg, $8,000)
- Peso cobrable marketplace: max(peso_real_kg, largo×ancho×alto/5000)

### Publicidad (Biblia v3)
- VISIBLE: $25,000/mes — Logo en categoría + Top 5 + Badge 'Nuevo'
- DESTACADO: $50,000/mes — VISIBLE + banner rotativo + 2 push/mes + 3 productos destacados
- PREMIUM: $100,000/mes — DESTACADO + banner homepage + popup + posición #1 + 4 push
- LANZAMIENTO ESPECIAL: $150,000/mes — PREMIUM + video + influencers + exclusividad 7 días
- Se activa en Fase 2 (5+ comercios activos)

### Protocolo efectivo repartidores (Biblia v3)
- Primeras 10 entregas: SOLO pedidos MP (sin efectivo)
- 10-30 entregas: límite deuda efectivo $15,000
- 30-60 entregas: límite $25,000
- 60+ entregas: límite $40,000
- 200+ entregas (6+ meses): límite $60,000 o sin límite
- Compensación cruzada automática: deuda se descuenta del próximo pago MP

## Variables de entorno
DB: DATABASE_URL, SHADOW_DATABASE_URL
Auth: AUTH_SECRET, NEXTAUTH_SECRET, CRON_SECRET
App: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SOCKET_URL, SOCKET_PORT, SOCKET_INTERNAL_URL
MP: MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET, MP_APP_ID
Email: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFICATION_EMAIL (notificaciones admin, fallback ADMIN_EMAIL)
OPS Admin: OPS_LOGIN_EMAIL (email login OPS), OPS_LOGIN_PASSWORD (password OPS). Fallback legacy: ADMIN_RESET_EMAIL, ADMIN_PASSWORD
Push: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
Maps: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
Redis: REDIS_URL (opcional — si no está, rate limiter usa in-memory con fallback automático)

## Scripts
start.ps1: crear rama | finish.ps1: cerrar rama y merge a develop | publish.ps1: push + dump DB
devmain.ps1: deploy a producción | sync.ps1: pull develop
validate-ops-config.ts: validación de integridad del panel OPS (9 tests: settings, puntos, moovyconfig, biblia, sync, tiers, audit, fórmula, duplicados)
fix-ops-config.ts: corrige configs faltantes (PointsConfig, MoovyConfig keys, sync timeouts, loyalty tiers) + re-verifica
reset-admin.ts: resetea contraseña del admin desde OPS_LOGIN_EMAIL + OPS_LOGIN_PASSWORD del .env. Uso: `npx tsx scripts/reset-admin.ts`
create-admin.ts: crea/resetea admin OPS. Acepta email como argumento CLI. Uso: `npx tsx scripts/create-admin.ts [email]`. Limpia deletedAt y isSuspended automáticamente.

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
3. **REGLA CRÍTICA — NUNCA EDITAR CÓDIGO EN DEVELOP.** Antes de tocar CUALQUIER archivo de código, PRIMERO verificar en qué rama está Mauro. Si está en `develop` o `main`: DETENER TODO, avisar a Mauro, y pedirle que cree una rama nueva con `.\scripts\start.ps1`. Si la rama ya fue cerrada/mergeada y hay que hacer otro cambio: crear una NUEVA rama. No existe excepción a esta regla. Cada cambio va en su propia rama feature/fix. Si no se sabe en qué rama está Mauro, PREGUNTAR antes de escribir código.
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
Si toca dinero en CUALQUIER forma, aplicar estas verificaciones (Biblia v3):
```
subtotal = Σ(item.price × item.quantity) por cada SubOrder
descuento_puntos = min(puntos_usados × $1, subtotal × 0.20) // 1pt=$1, max 20%
costo_viaje = max(fee_minimo_vehiculo, costo_km × distancia × 2.2) × zona × clima
costo_operativo = subtotal × 0.05 // 5% embebido que cubre MP + margen
delivery_fee_visible = costo_viaje + costo_operativo // lo que ve el comprador
comision_moovy = subtotal × commissionRate // 0% mes 1, 8% mes 2+ merchant, 12% seller
pago_repartidor = costo_viaje × 0.80 // 80% del viaje REAL, no del fee visible
moovy_delivery = costo_viaje × 0.20 + costo_operativo // 20% viaje + 5% operativo
total = subtotal - descuento_puntos + delivery_fee_visible
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
usuarios. Verificar según Biblia v3:
- Earn: 10 pts por $1,000 gastados (nivel básico MOOVER). Se otorgan SOLO cuando pedido pasa a DELIVERED
- Earn rates por nivel: SILVER 12.5/$1K, GOLD 15/$1K, BLACK 20/$1K
- Burn: 1 punto = $1 ARS de descuento. Máximo 20% del subtotal
- Min puntos para canjear: 500 puntos
- Signup bonus mes 1 (boost): 1,000 pts. Mes 2+: 500 pts. Se otorgan una sola vez
- Referral: 1,000 pts al referidor + 500 pts al referido. Solo post-DELIVERED del primer pedido
- Boost lanzamiento (30 días): TODOS los puntos se duplican. Se desactiva automáticamente día 31
- Niveles: MOOVER (0 pedidos), SILVER (5/90d), GOLD (15/90d), BLACK (40/90d). Recalculo diario
- Expiración: 6 meses completos sin pedidos = puntos vencen. 1 pedido reinicia el timer
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

**MARKETING / CONTE