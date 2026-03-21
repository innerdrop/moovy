# Moovy — Tareas pendientes
Score: 78/100 | P0: 5 tareas | P1: 14 | P2: 12
Última actualización: 2026-03-21

## P0 — Sin esto no se lanza

- [x] Validación pre-flight de stock en checkout — `src/app/api/orders/route.ts` — S ✅ 2026-03-21

- [ ] Flujo de aprobación de merchant/driver — `src/app/ops/(protected)/comercios/page.tsx`, `repartidores/page.tsx` — M
  Hoy solo toggle isActive. Falta: estado PENDING_APPROVAL, notificación al admin, email al merchant/driver al aprobar/rechazar.

- [ ] Credenciales MP producción — config + testing — M
  Cambiar TEST- por credenciales productivas. Verificar webhook URL en panel MP. Testear pago real ida y vuelta.

- [ ] Validación de scheduled delivery — `src/app/api/orders/route.ts`, `checkout/page.tsx` — M
  TimeSlotPicker existe pero el backend no valida disponibilidad del slot ni capacidad de entrega.

- [x] Manejo de errores de pago visible al usuario — `mp-return/page.tsx` — S ✅ 2026-03-21
  Ya tenía timeout+FAILED+PAID. Agregado: soporte APPROVED status, link WhatsApp en timeout.

- [ ] Email de confirmación de pedido funcional — `src/lib/email.ts` — S
  Verificar que SMTP esté configurado en producción. Testear que los emails lleguen (no spam).

- [x] Notificación push al merchant/seller cuando recibe pedido — S ✅ 2026-03-21
  notifyMerchant() y notifySeller() en notifications.ts, llamados en orders/route.ts (cash + MP).

- [x] Cancelación de pedido por buyer — `src/app/api/orders/[id]/cancel/route.ts` — M ✅ 2026-03-21
  Endpoint creado: valida permisos, restaura stock, libera driver, notifica por socket+push.

- [x] Página de error 404 y 500 customizada — ya existían y están bien — S ✅ 2026-03-21

- [x] PWA manifest + icons correctos — ya configurado correctamente — S ✅ 2026-03-21

- [x] Seed de datos iniciales para producción — `prisma/seed-production.ts` — M ✅ 2026-03-21
  Admin, StoreSettings, PointsConfig, MoovyConfig (10 keys), PackageCategories, DeliveryRates, PricingTiers.

- [ ] Smoke test manual de flujo completo — ningún archivo — L
  Recorrer los 4 flujos completos en local antes de deploy. Documentar bugs encontrados.

## P1 — Sin esto los usuarios se van

- [ ] Tests unitarios para order creation + webhook MP — `__tests__/` — L
  Mínimo: crear orden cash, crear orden MP, webhook approve, webhook reject, stock restore.

- [ ] Botón "Eliminar mi cuenta" en UI — `src/app/(store)/mi-perfil/page.tsx` — S
  Endpoint existe (POST /api/profile/delete) pero no hay botón en la UI. Requerido por Google Play.

- [ ] Onboarding del merchant post-aprobación — `src/app/comercios/(protected)/page.tsx` — M
  Wizard o checklist: subir logo, configurar horarios, importar primer paquete de productos.

- [ ] Sonido/vibración en notificaciones del merchant — `src/app/comercios/(protected)/pedidos/page.tsx` — S
  El vendedor tiene alerta sonora (new-order.wav) pero el merchant no. Puede perder pedidos.

- [ ] Página de estado del pedido pública (sin auth) — `src/app/seguimiento/[orderId]/page.tsx` — S
  Verificar que funciona sin auth para que el buyer comparta link por WhatsApp.

- [ ] Retry automático de asignación si no hay drivers — `src/lib/assignment-engine.ts` — M
  Después de agotar todos los drivers, el pedido queda en limbo. Falta: retry cada X minutos o notificar admin.

- [ ] Dashboard merchant con KPIs reales — `src/app/comercios/(protected)/page.tsx` — M
  Pedidos hoy, ingresos del día, pedidos pendientes, rating promedio. Ahora es genérico.

- [ ] Responsive completo en checkout — `src/app/(store)/checkout/page.tsx` — S
  Verificar en móvil real (iPhone SE, Android low-end). Formularios largos pueden ser difíciles.

- [ ] Comprobante/recibo descargable — `src/app/(store)/mis-pedidos/[orderId]/page.tsx` — M
  PDF o imagen con detalle del pedido, monto, fecha, nro de orden. Para reclamos y contabilidad.

- [ ] Notificación cuando pedido está listo para retirar — `src/app/api/merchant/orders/[id]/ready/route.ts` — S
  Verificar que el push llega al driver cuando merchant marca "listo". Si no, el driver no sabe cuándo ir.

- [ ] Rate limiting en login de portales — `src/app/repartidor/login/page.tsx`, etc. — S
  El rate limit está en el backend pero el frontend no muestra mensaje claro de "demasiados intentos".

- [ ] Validación de imágenes en listings — `src/app/vendedor/(protected)/listings/nuevo/page.tsx` — S
  Verificar que se requiere al menos 1 imagen. Hoy se puede publicar listing sin foto.

- [ ] Mejorar empty states en marketplace — `src/app/(store)/marketplace/page.tsx` — S
  Si no hay listings en una categoría, sugerir vendedores verificados o CTA para vender.

- [ ] Soporte WhatsApp directo — `src/components/layout/WhatsAppButton.tsx` — S
  Verificar que el botón flotante funciona con el número correcto y mensaje pre-cargado.

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
- [x] Validación pre-flight de stock en checkout — 2026-03-21
- [x] Notificación push al merchant/seller cuando recibe pedido — 2026-03-21
- [x] Endpoint de cancelación de pedido por buyer (POST /api/orders/[id]/cancel) — 2026-03-21
- [x] Manejo de errores de pago visible al usuario (mp-return + checkout stock errors) — 2026-03-21
- [x] Páginas de error 404 y 500 customizadas (ya existían) — 2026-03-21
- [x] PWA manifest + icons correctos (ya configurado) — 2026-03-21
- [x] Seed de datos iniciales para producción (prisma/seed-production.ts) — 2026-03-21
