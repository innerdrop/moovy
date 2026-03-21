# Moovy — Tareas pendientes
Score: 94/100 | P0: 2 tareas | P1: 1 | P2: 12
Última actualización: 2026-03-21

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
  Recorrer los 4 flujos completos en local antes de deploy. Documentar bugs encontrados. (Ver guía abajo)

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

- [ ] Responsive completo en checkout — `src/app/(store)/checkout/page.tsx` — S
  Verificar en móvil real (iPhone SE, Android low-end). Formularios largos pueden ser difíciles.

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

- [ ] Logger estructurado (Pino/Winston) — reemplazar console.log — L
  Para debugging en producción. Agregar request ID, user ID, latencias.

- [ ] Migrar rate limiter a Redis — `src/lib/rate-limit.ts` — M
  Hoy es in-memory, se resetea con cada deploy. Redis persiste y escala.

- [ ] Encriptación at-rest para CUIT/CBU — schema + lib — M
  Datos fiscales sensibles guardados en plain text. Usar AES-256 con key en env var.

- [ ] Métricas de performance (Web Vitals) — layout.tsx — S
  Reportar LCP, FID, CLS a analytics para optimizar UX.

- [ ] App nativa Android (TWA o React Native) — proyecto separado — XL
  Para notificaciones nativas, geolocalización background, mejor UX.

- [ ] Múltiples ciudades — schema + config — XL
  Hoy hardcodeado Ushuaia. Necesita: city en Order/Merchant/Driver, config por ciudad.

- [ ] Split payment automático via MP Marketplace API — `src/lib/mercadopago.ts` — L
  Pagar directo al vendedor/merchant sin intervención manual. Requiere aprobación MP.

- [ ] Sistema de cupones/descuentos — schema + API + checkout — M
  Códigos de descuento por porcentaje o monto fijo. Para marketing y retención.

- [ ] Chat en tiempo real buyer-driver — Socket.IO + UI — M
  Para coordinar entrega (portería, timbre, referencias).

- [ ] Historial de ubicación del driver — `src/app/api/driver/location/route.ts` — S
  Guardar trace GPS para disputas y optimización de rutas.

- [ ] Dashboard analytics avanzado — `src/app/ops/(protected)/analytics/page.tsx` — L
  Cohortes, retención, CAC, LTV, funnel de conversión.

- [ ] Programa de fidelización para merchants — API + UI — M
  Beneficios por volumen, destacado en home, badge premium.

## Backlog futuro (P3/P4)
- Pago con QR en punto de venta
- Integración con sistemas POS de comercios
- API pública para integraciones terceros
- Multi-idioma (inglés para turistas)
- IA para recomendaciones personalizadas
- Programa de embajadores/influencers
- Delivery programado con slots precisos
- Gestión de inventario avanzada (alertas stock bajo)
- Panel de analytics para merchants
- Sistema de disputas/mediación automatizado
- Facturación electrónica AFIP
- Revocación de sesiones JWT (token blacklist)
- Play Integrity API para Android

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
