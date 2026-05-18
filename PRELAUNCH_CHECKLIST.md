# Moovy — Pre-Launch QA Checklist

> Documento vivo de control de calidad antes del lanzamiento público.
>
> **Cómo usarlo**:
>
> - Marcá cada item con su estado real probando en local o staging.
> - Estados disponibles: `[ ]` pendiente · `[✅]` pasa · `[❌]` falla · `[⚠️]` parcial / con observaciones · `[🚫]` bloqueado por otra cosa
> - Criticidad: 🔴 bloqueante launch · 🟡 no bloquea (mejora post-launch)
> - Cuando hay observación, sumarla como sub-item con `Obs:`
> - Cuando termines, abrí el HTML companion (`prelaunch-checklist.html`) o pedile a Claude "leé el checklist y armá el plan de acción"
>
> **Última actualización**: 2026-05-17

---

## 🛒 Buyer (Comprador)

### Registro y login

- [ ] 🔴 Crear cuenta nueva con email válido → recibe `BuyerWelcome` email + sesión iniciada
- [ ] 🔴 Crear cuenta con email ya existente (soft-deleted) → devuelve 410, NO permite resurrección
- [ ] 🔴 Crear cuenta sin aceptar T&C → bloquea submit + crea `ConsentLog` cuando acepta
- [ ] 🔴 Login con credenciales válidas → JWT de 7 días + redirect a `/`
- [ ] 🔴 Login con password incorrecto → mensaje claro "Credenciales inválidas"
- [ ] 🟡 Recuperar password → flujo completo email + reset
- [ ] 🔴 Logout → limpia sesión + redirect a `/`
- [ ] 🟡 Login + cuenta `deletedAt != null` → bloquea + sugiere soporte

### Tienda y descubrimiento

- [ ] 🔴 Home `/` carga en <3s en 3G simulado → hero + categorías + comercios
- [ ] 🔴 Comercios sin `image` no aparecen en listado público (filtro `image: { not: null }`)
- [ ] 🔴 Comercios con `approvalStatus !== APPROVED` no aparecen en listado público
- [ ] 🔴 Tap en categoría → filtra comercios correctamente
- [ ] 🔴 Búsqueda → resultados relevantes en <500ms
- [ ] 🟡 Estado vacío en búsqueda → mensaje + CTA volver al inicio
- [ ] 🔴 Página de comercio cerrado por horario → muestra cartel "Cerrado" + próximo horario apertura
- [ ] 🔴 Página de comercio en zona excluida → muestra mensaje "No entregamos en esta zona"

### Carrito y checkout

- [ ] 🔴 Agregar producto al carrito desde home → toast + contador BottomNav
- [ ] 🔴 Aumentar/disminuir cantidad → recalcula subtotal correctamente
- [ ] 🔴 Eliminar producto → desaparece del carrito + actualiza totales
- [ ] 🔴 Carrito persiste al cerrar/reabrir pestaña (SavedCart)
- [ ] 🔴 Checkout con MercadoPago Sandbox → redirect a MP + vuelta con `payment_id` + status PAID
- [ ] 🔴 Checkout con pago en efectivo (feature flag ON) → crea Order PENDING sin pasar por MP
- [ ] 🔴 Checkout con efectivo desactivado en OPS → la opción NO aparece en el selector de pago
- [ ] 🔴 Checkout con scheduled delivery → permite elegir slot + queda como SCHEDULED
- [ ] 🔴 Cupón válido → aplica descuento, absorbe Moovy (no el comercio)
- [ ] 🟡 Cupón vencido / mal escrito → error específico
- [ ] 🔴 Aplicar puntos MOOVER en checkout → respeta min 500pts, max 20% subtotal
- [ ] 🔴 Subtotal $0 después de descuentos → bloquea checkout (no permitir)
- [ ] 🔴 Distancia > umbral o zona excluida → bloquea checkout con mensaje claro
- [ ] 🔴 Comercio en pausa durante checkout → bloquea con mensaje
- [ ] 🔴 Stock 0 durante checkout → bloquea ese item y permite continuar sin él

### Tracking y pedido

- [ ] 🔴 `/mis-pedidos` lista todos los pedidos del usuario
- [ ] 🔴 Filtros (activos/finalizados) funcionan
- [ ] 🔴 Detalle de pedido `/mis-pedidos/[orderId]` muestra estado actual
- [ ] 🔴 Status del pedido se actualiza en tiempo real (Socket.IO)
- [ ] 🔴 Mapa de tracking en vivo se actualiza con la posición del driver
- [ ] 🔴 Push notification cuando driver está cerca (`nearDestinationNotified`)
- [ ] 🔴 Chat con comercio funciona mientras el pedido está activo
- [ ] 🔴 Chat con driver funciona desde `DRIVER_ASSIGNED` hasta `DELIVERED`
- [ ] 🔴 Botones de teléfono/chat se ocultan después de `DELIVERED`
- [ ] 🟡 Botón de soporte visible y accesible en todos los estados
- [ ] 🔴 Modal de calificación aparece automáticamente al pasar a `DELIVERED`
- [ ] 🔴 Modal NO se cierra accidentalmente (no z-index conflicts con BottomNav)
- [ ] 🔴 Modal persiste si el usuario lo cierra → reaparece la próxima vez
- [ ] 🔴 Calificar al driver → guarda rating + comentario + el pedido NO vuelve a Pendiente
- [ ] 🔴 Calificar al comercio → guarda rating + comentario sin afectar status

### Puntos MOOVER

- [ ] 🔴 Botón MOOVER siempre visible en BottomNav (NUNCA detrás de flag)
- [ ] 🔴 `/puntos` carga balance, lifetime, redeemableValue
- [ ] 🔴 Earn al pasar pedido a `DELIVERED` (10pts / $1.000 si nivel MOOVER)
- [ ] 🔴 Earn es idempotente — pasar a DELIVERED dos veces NO duplica
- [ ] 🔴 Burn en checkout — 1pt = $1 ARS, min 500, max 20% subtotal
- [ ] 🔴 Niveles dinámicos suben en pedidos 5 (SILVER), 15 (GOLD), 40 (BLACK)
- [ ] 🔴 Balance nunca negativo (defensa server-side)
- [ ] 🟡 Cancelar pedido revierte EARN, devuelve REDEEM (`reverseOrderPoints` idempotente)
- [ ] 🟡 Expiración 6 meses sin pedidos
- [ ] 🟡 Signup bonus se otorga al crear cuenta (1.000 mes 1 / 500 mes 2+)
- [ ] 🟡 Referral bonus al completar primer pedido del referido (1.000 + 500)

### Marketplace

- [ ] 🔴 Botón Marketplace siempre visible en BottomNav (NUNCA detrás de flag)
- [ ] 🔴 `/marketplace` carga listings de vendedores
- [ ] 🔴 Filtros por categoría / precio / condición funcionan
- [ ] 🔴 Búsqueda dentro del marketplace funciona
- [ ] 🔴 Detalle de listing muestra fotos, descripción, vendedor
- [ ] 🔴 Agregar listing al carrito → genera SubOrder con sellerId

### Perfil y datos

- [ ] 🔴 `/mi-perfil` muestra datos del usuario
- [ ] 🔴 Editar dirección → guarda + valida con Places API
- [ ] 🔴 Cambiar password → flujo completo
- [ ] 🟡 Direcciones múltiples → CRUD funciona
- [ ] 🔴 Auto-delete (self-delete) anonimiza email + soft-delete + revoke sesión
- [ ] 🔴 Notificaciones push funcionan (permisos solicitados al usuario)

---

## 🏪 Comercio (Merchant)

### Registro y aprobación

- [ ] 🔴 Registro merchant desde `/comercios/registro` → crea Merchant con `approvalStatus=PENDING`
- [ ] 🔴 Email recibido confirmando registro + esperar aprobación
- [ ] 🔴 Upload de docs (DNI, CUIT, monotributo, etc.) con status `PENDING` por doc
- [ ] 🔴 Validación CUIT con checksum AFIP (`src/lib/cuit.ts`)
- [ ] 🔴 OPS aprueba doc por doc → cuando TODOS los requeridos están APPROVED, auto-activa
- [ ] 🔴 OPS aprueba con source `PHYSICAL` requiere nota mínimo 5 chars (audit AAIP)
- [ ] 🔴 OPS rechaza doc → notificación con `rejectionReason`
- [ ] 🔴 Email cuando se aprueba el comercio (rama `feat/welcome-email-seller` adaptado)
- [ ] 🔴 Hard-lock server-side de docs aprobados — UI nunca es defensa
- [ ] 🟡 Cambio post-aprobación → change-request formal con audit log

### Dashboard y pedidos

- [ ] 🔴 `/comercios` carga el dashboard con métricas
- [ ] 🔴 Listado de pedidos con filtros (status, fecha)
- [ ] 🔴 Pedido nuevo → notificación sonora + visual + push
- [ ] 🔴 Confirmar pedido → status pasa a CONFIRMED + notifica al buyer
- [ ] 🔴 Rechazar pedido → status REJECTED + refund automático si pagado MP
- [ ] 🔴 Marcar listo → status READY + busca driver
- [ ] 🔴 PIN de retiro visible SOLO cuando driver llegó (DRIVER_ARRIVED) Y comercio READY
- [ ] 🔴 Timeout en PENDING → bloquea botón "Aceptar" automáticamente
- [ ] 🔴 Pedidos programados aparecen con badge SCHEDULED + tiempo restante
- [ ] 🔴 "Tu venta" muestra subtotal (no total con delivery fee)
- [ ] 🔴 "Cobrás $X (-Y%)" muestra el neto post-comisión con tier dinámico
- [ ] 🔴 Chat con buyer disponible en pedido activo

### Productos y catálogo

- [ ] 🔴 Crear producto manual → guarda con todos los campos requeridos
- [ ] 🔴 Crear producto con tamaño/peso → selector Glovo-style + advanced mode
- [ ] 🔴 Editar producto → banner flotante "Tenés cambios sin guardar"
- [ ] 🔴 Eliminar producto → confirmación + soft delete
- [ ] 🔴 Importar paquete del catálogo MOOVY → carga productos con foto profesional
- [ ] 🔴 Stock se descuenta automáticamente con cada venta
- [ ] 🔴 Subir foto producto → comprimida a sharp + crop 1:1
- [ ] 🟡 Categorías custom del comercio funcionan
- [ ] 🟡 Productos destacados / sugeridos

### Configuración del comercio

- [ ] 🔴 Editar perfil → banner flotante de cambios sin guardar
- [ ] 🔴 Cambiar horarios → guarda + se aplica para mostrar "Abierto/Cerrado" en tienda
- [ ] 🔴 Cambiar imagen del comercio → comprime + queda visible en listado
- [ ] 🔴 Conectar MercadoPago OAuth → guarda `mpAccessToken` cifrado
- [ ] 🔴 Pausar tienda manualmente → comercio aparece como CERRADO
- [ ] 🔴 Loyalty tier (BRONCE/PLATA/ORO/DIAMANTE) refleja comisión correcta
- [ ] 🟡 Redes sociales (Instagram, FB, WhatsApp) se muestran en perfil público

### Pagos al comercio (payouts)

- [ ] 🔴 OPS genera PayoutBatch MERCHANT → CSV correcto
- [ ] 🔴 Al marcar PAID → Order.commissionPaid se setea a true en los orders incluidos
- [ ] 🔴 Comercio ve el histórico de pagos recibidos en su panel
- [ ] 🟡 Comercio puede descargar CSV propio de su histórico

---

## 🛵 Repartidor (Driver)

### Registro y aprobación

- [ ] 🔴 Registro desde `/repartidor/registro` con todos los datos requeridos
- [ ] 🔴 Upload de docs: DNI, licencia, seguro, RTO, cédula verde (status per-doc)
- [ ] 🔴 RTO NO es obligatorio (rama `2A`) pero declaración jurada T&C sí
- [ ] 🔴 Validación CBU con checksum BCRA (`src/lib/bank-account.ts`)
- [ ] 🔴 Botón "Cargar mi documentación" después del registro lleva al panel
- [ ] 🔴 Confirmación del registro muestra DNI/CUIT cargados (no campos vacíos)
- [ ] 🔴 Sin error de consola en aceptación T&C
- [ ] 🔴 Cron diario de vencimiento docs avisa 7d/3d/1d antes + auto-suspende al vencer
- [ ] 🔴 Aprobación driver dispara email + activa rol DRIVER en JWT (socket roles_updated)

### Estado online y asignación

- [ ] 🔴 Toggle online/offline funciona
- [ ] 🔴 Estado online persiste tras reload
- [ ] 🔴 GPS pidiendo permisos al ir online
- [ ] 🔴 Driver con GPS denegado NO puede ir online (muestra mensaje claro)
- [ ] 🔴 Pedido asignado → notificación sonora + push + UI con detalles
- [ ] 🔴 Aceptar → arranca tracking + state PICKED_UP_PENDING
- [ ] 🔴 Rechazar → vuelve a PendingAssignment para próximo driver
- [ ] 🔴 Timeout sin responder → auto-reasigna
- [ ] 🟡 Smart batching <3km funciona (asigna 2 pedidos al mismo driver)
- [ ] 🟡 Sin drivers disponibles → status UNASSIGNABLE + refund auto si MP

### PIN doble y entrega

- [ ] 🔴 Llegar al comercio → state DRIVER_ARRIVED + comercio ve el PIN
- [ ] 🔴 Ingresar PIN correcto de retiro → state PICKED_UP
- [ ] 🔴 PIN incorrecto → muestra intentos restantes
- [ ] 🔴 Máximo intentos PIN retiro → state bloqueado + botones soporte VISIBLES
- [ ] 🔴 Geofence: PIN fuera de 100m bloquea con mensaje claro + botones soporte
- [ ] 🔴 Ingresar PIN correcto de entrega → state DELIVERED
- [ ] 🔴 Máximo intentos PIN entrega → mismo flujo de soporte
- [ ] 🔴 Driver con ≥3 incidentes PIN → fraudScore + auto-suspend
- [ ] 🔴 Reportar problema desde modal → email a alertEmails + audit log
- [ ] 🔴 WhatsApp soporte abre con mensaje pre-armado contextual al error

### Ganancias y pagos

- [ ] 🔴 `EarningsView` carga "Mis ganancias" con tabs "Ganancias" y "Pagos recibidos"
- [ ] 🔴 Selector de período: Esta semana / Este mes / últimos 12 meses / Todo el tiempo
- [ ] 🔴 Tab "Pagos recibidos" muestra historial de PayoutBatch PAID del driver
- [ ] 🔴 Total acumulado histórico se calcula correctamente
- [ ] 🔴 Propinas declaradas aparecen separadas (no las procesa Moovy)
- [ ] 🟡 Driver sin bankAlias ve warning para cargarlo
- [ ] 🔴 Tracking GPS se sube al server cada 10s mientras tiene pedido activo

---

## 🛍️ Vendedor Marketplace (Seller)

### Registro y configuración

- [ ] 🔴 Registro seller desde `/vendedor/registro` → SellerProfile creado
- [ ] 🔴 Email de bienvenida (rama `feat/welcome-email-seller`)
- [ ] 🔴 Validación de docs fiscales + DNI/CUIT
- [ ] 🔴 Aprobación admin → activa rol SELLER
- [ ] 🟡 Conectar MP OAuth → token cifrado

### Listings y ventas

- [ ] 🔴 Crear listing con foto, descripción, precio, categoría peso
- [ ] 🔴 Editar listing → ¿banner flotante también acá? (Opcional, no implementado)
- [ ] 🔴 Pausar/activar listing
- [ ] 🔴 Eliminar listing → soft delete
- [ ] 🔴 Variantes (talle, color) funcionan si aplican
- [ ] 🔴 Stock se descuenta con cada venta

### Pedidos y panel

- [ ] 🔴 `/vendedor/pedidos` lista SubOrders del seller
- [ ] 🔴 Filtros por estado funcionan
- [ ] 🔴 "Tu venta" muestra subtotal, "Cobrás" muestra sellerPayout (12% comisión)
- [ ] 🔴 Chat con buyer disponible en pedido activo
- [ ] 🔴 Chat con driver disponible en multi-vendor
- [ ] 🔴 Notificación sonora + visual + push en pedido nuevo

---

## 🛠️ OPS (Admin)

### Login y acceso

- [ ] 🔴 Login OPS desde `/ops/login` con credenciales admin
- [ ] 🔴 Proxy bloquea `/ops/*` sin rol ADMIN
- [ ] 🔴 Logout → limpia sesión + redirect a login
- [ ] 🔴 Selector de panel después de login (si tiene múltiples roles)

### Gestión de usuarios

- [ ] 🔴 `/ops/usuarios` lista todos los usuarios con paginación
- [ ] 🔴 Auto-refresh cada 30s (pausa cuando pestaña no visible)
- [ ] 🔴 Botón "Actualizar" manual + label "Hace X segundos"
- [ ] 🔴 Filtros por rol (Buyer, Merchant, Driver, Seller, Admin)
- [ ] 🔴 Tabs con contadores (PENDING, APPROVED, etc.)
- [ ] 🔴 Badge de pendientes en menú de OPS
- [ ] 🔴 Form de creación admin coincide con registro público (paridad)
- [ ] 🔴 Soft-delete user desde OPS funciona (no anonimiza email)

### Pedidos en vivo

- [ ] 🔴 `/ops/pedidos/live` muestra pedidos activos en tiempo real
- [ ] 🔴 Refund manual con confirmación textual "ELIMINAR DEFINITIVAMENTE"
- [ ] 🔴 Reasignar driver con audit log
- [ ] 🔴 Override geofence con audit log

### Aprobaciones de docs

- [ ] 🔴 Per-doc status (PENDING/APPROVED/REJECTED) + bloqueo server-side
- [ ] 🔴 Aprobación PHYSICAL pide nota mín 5 chars
- [ ] 🔴 Auto-activación cuando TODOS los requeridos en APPROVED
- [ ] 🔴 Auto-refresh del JWT del actor afectado (socket roles_updated)
- [ ] 🔴 Mutations admin parsean `data.error` y muestran en toast

### Configuración

- [ ] 🔴 Config Biblia v3 editable (riderCommissionPercent, costo km, etc.)
- [ ] 🔴 Zonas de delivery (PostGIS) editable desde `/ops/zonas-delivery`
- [ ] 🔴 Zonas excluidas configurables (no hardcoded)
- [ ] 🔴 PointsConfig editable
- [ ] 🔴 MerchantLoyaltyConfig (tiers) editable
- [ ] 🔴 EmailTemplate editable con preview
- [ ] 🔴 PlaybookChecklist editable
- [ ] 🔴 Segmentos de usuarios + broadcast campaigns con consent check
- [ ] 🔴 Feature flags togglean correctamente con cache 30s + invalidación
- [ ] 🔴 Panel `/ops/feature-flags` NO muestra `buyer.marketplace` ni `buyer.puntos-moover` (post-cleanup)

### Payouts y refunds

- [ ] 🔴 Generar PayoutBatch DRIVER con periodo configurable → CSV correcto
- [ ] 🔴 Generar PayoutBatch MERCHANT idem
- [ ] 🔴 Mark-paid con confirmación textual "CONFIRMAR PAGO" + audit log
- [ ] 🔴 Refund manual con confirmación + audit + email al buyer
- [ ] 🔴 CSV cuadra: ingreso_moovy = comisión_merchant + comisión_seller + delivery_fee × (1 - riderCommission%)

---

## 🔧 Cross-cutting

### Seguridad

- [ ] 🔴 IDOR test: usuario A intenta ver pedido de usuario B → 403
- [ ] 🔴 IDOR test: driver A intenta marcar PIN de driver B → 403
- [ ] 🔴 IDOR test: merchant A intenta editar producto de merchant B → 403
- [ ] 🔴 Rate limit 60 req/min en endpoints públicos
- [ ] 🔴 Rate limit en login (5/min para evitar brute force)
- [ ] 🔴 Zod schema en TODOS los inputs de API routes
- [ ] 🔴 Upload de imágenes valida magic bytes + max 10MB
- [ ] 🔴 SQL injection bloqueada (Prisma + $queryRaw revisado)
- [ ] 🔴 XSS: `dangerouslySetInnerHTML` sanitizado donde aplica
- [ ] 🔴 CSRF: origin check en endpoints sensibles
- [ ] 🔴 Tokens cifrados (mpAccessToken, mpRefreshToken) en DB
- [ ] 🔴 CUIT/CBU/DNI cifrados — `decrypt<Modelo>Data` antes de response
- [ ] 🔴 Audit log para refund / delete / reassign / role-change
- [ ] 🟡 Headers de seguridad (CSP, X-Frame-Options, etc.) configurados

### Performance

- [ ] 🔴 Home `/` carga en <3s en 3G simulado (DevTools throttling)
- [ ] 🔴 Listado de 50+ pedidos en `/ops/pedidos` paginado correctamente
- [ ] 🔴 Mapa con muchos markers no traba el browser
- [ ] 🔴 Imágenes optimizadas con sharp + next/image
- [ ] 🟡 Lazy loading de dynamic imports donde aplica
- [ ] 🟡 Sin N+1 queries (revisar logs de Prisma con `?logging=true`)
- [ ] 🟡 Caché in-memory de StoreSettings/PointsConfig (30s TTL)

### Legal y privacidad

- [ ] 🔴 `/terminos` accesible y actualizado
- [ ] 🔴 `/politica-privacidad` accesible y actualizado
- [ ] 🔴 ConsentLog se crea al aceptar T&C
- [ ] 🔴 Soft delete obligatorio para User / Merchant / Driver
- [ ] 🔴 Self-delete anonimiza email del usuario eliminado
- [ ] 🔴 Self-delete revoca todas las sesiones activas
- [ ] 🔴 Hard delete (Order/SubOrder) requiere confirmación textual literal
- [ ] 🔴 Datos sensibles (CUIT/CBU/DNI/tokens) cifrados at-rest
- [ ] 🟡 GDPR/AAIP: usuario puede exportar sus datos
- [ ] 🟡 Política de retención de logs documentada

### Infra y configuración

- [ ] 🔴 Variables de entorno completas en `.env.production`:
  - [ ] DATABASE_URL, SHADOW_DATABASE_URL
  - [ ] AUTH_SECRET, NEXTAUTH_SECRET, CRON_SECRET
  - [ ] MP_ACCESS_TOKEN (prod), MP_PUBLIC_KEY, MP_WEBHOOK_SECRET, MP_APP_ID
  - [ ] SMTP_HOST/PORT/USER/PASS, NOTIFICATION_EMAIL
  - [ ] VAPID public/private + email
  - [ ] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY + MAP_ID
  - [ ] NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
- [ ] 🔴 PostGIS Docker arriba en puerto 5436 (prod)
- [ ] 🔴 MP webhook URL configurada en panel MP apuntando a prod
- [ ] 🔴 SMTP funciona — test: enviar `BuyerWelcome` y recibirlo
- [ ] 🔴 Sentry recibe errores client + server + edge
- [ ] 🔴 Sentry tunnel route `/monitoring` funciona
- [ ] 🔴 Sentry PII scrubbing aplicado (no leaks de email/CBU/CUIT/tokens)
- [ ] 🔴 Socket.IO socket-server arriba
- [ ] 🔴 Crons configurados (CRON_SECRET headers): expiración docs, location-cleanup, broadcasts
- [ ] 🟡 Redis (opcional) — si no, fallback in-memory activo

### Monitoreo y observabilidad

- [ ] 🔴 Logs estructurados con Pino (orderId, userId, action)
- [ ] 🔴 Webhooks loguean recepción + procesamiento + resultado
- [ ] 🔴 Sentry recibe error capturado al disparar uno intencional
- [ ] 🔴 Healthcheck `/api/healthcheck` responde 200
- [ ] 🔴 CronRunLog se popula correctamente
- [ ] 🟡 Métricas básicas (req count, error rate, p95 latency) visibles

### Pagos y MercadoPago

- [ ] 🔴 Webhook MP en producción recibe eventos (test card aprobado)
- [ ] 🔴 Webhook valida monto vs total con tolerancia $1
- [ ] 🔴 Webhook idempotente — mandar el mismo evento 2 veces NO duplica
- [ ] 🔴 Refund automático en webhook RECHAZADO + restore stock
- [ ] 🔴 EventId determinístico (no UUID random) en MpWebhookLog
- [ ] 🔴 Test cards: APRO (aprobado), CONT (en proceso), CALL (rechazado)
- [ ] 🔴 Split payments funcionando si MP OAuth conectado en merchants
- [ ] 🔴 Comisiones se aplican según tier dinámico — verificar:
  - [ ] Comercio MES 1 → 0%
  - [ ] Comercio MES 2 BRONCE → 8%
  - [ ] Seller marketplace → 12%
  - [ ] Cupón → absorbe Moovy (no comercio)

### Comunicaciones (matrix por evento)

- [ ] 🔴 Pedido creado → push buyer + email + in-app
- [ ] 🔴 Pedido confirmado por comercio → push buyer + email
- [ ] 🔴 Pedido listo (READY) → push buyer
- [ ] 🔴 Driver asignado → push buyer + socket + chat enabled
- [ ] 🔴 Driver en camino al comercio (PICKED_UP) → push buyer
- [ ] 🔴 Driver cerca del destino → push (nearDestinationNotified)
- [ ] 🔴 Pedido entregado (DELIVERED) → push buyer + modal calificación auto
- [ ] 🔴 Pedido cancelado por comercio → push buyer + email + refund
- [ ] 🔴 Pedido sin driver (UNASSIGNABLE) → push buyer + email + refund
- [ ] 🔴 Welcome email al crear cuenta (per role: buyer/merchant/driver/seller)
- [ ] 🔴 Email a OPS cuando comentario en review se marca como PENDING
- [ ] 🟡 Push de calificación pendiente 24h después de DELIVERED

### Soporte y UX

- [ ] 🔴 WhatsApp soporte funciona desde:
  - [ ] PinKeypad cuando OUT_OF_GEOFENCE
  - [ ] PinKeypad cuando TOO_MANY_ATTEMPTS
  - [ ] PinKeypad botón universal "¿Tenés problemas?"
  - [ ] `/soporte` página pública
- [ ] 🔴 Errores user-facing dicen QUÉ HACER (no "Error 500")
- [ ] 🔴 Errores en español argentino sin anglicismos
- [ ] 🔴 NUNCA "OPS" en strings user-facing → "el equipo de Moovy"
- [ ] 🔴 NUNCA mencionar competidores en strings user-facing
- [ ] 🔴 Empty states amigables (no en blanco)
- [ ] 🔴 Loading states con skeleton (no spinner blanco)
- [ ] 🔴 Mobile-first: todos los flujos críticos funcionan en celular
- [ ] 🔴 Touch targets ≥44px en mobile

---

## 📊 Resumen de progreso

Cuando termines de testear, pedile a Claude:

> "Leé el archivo `PRELAUNCH_CHECKLIST.md` y armá el plan de acción para lanzar."

Y Claude va a:

1. Contar % testeado total y por sección
2. Listar todos los ❌ y ⚠️ ordenados por criticidad (🔴 primero)
3. Listar los 🚫 con la razón del bloqueo
4. Proponer plan de acción priorizado
5. Decir si estamos listos para lanzar o qué falta

---

_Generado por la rama `chore/prelaunch-qa-checklist` — 2026-05-17_
