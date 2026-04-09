# Moovy — Tareas pendientes
Score: 99/100 | P0: 2 tareas (bloqueadas) | P1: 0 | P2: 3
Última actualización: 2026-04-08 (post-fix archivos truncados)

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

- [x] Página de estado del pedido pública (sin auth) — `src/app/seguimiento/[orderId]/page.tsx` — S ✅ 2026-03-21
  Nuevo endpoint /api/orders/[id]/tracking (datos no sensibles). Página funciona sin auth.

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
- Recuperación de carritos abandonados (email/push 2h después) — M — Est: +5-10% conversión
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         