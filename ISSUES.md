# Moovy — Issues pre-lanzamiento

**Generado:** 2026-04-15
**Rama:** `docs/pre-launch-issues-audit`
**Alcance:** Auditoría integral (7 roles + recorrido visual de somosmoovy.com + audit de ~170 endpoints) para identificar bloqueantes y mejoras previas al lanzamiento.

**Total:** 32 issues | **Críticos:** 8 | **Importantes:** 15 | **Menores:** 9

---

## Resumen ejecutivo

El sistema está en un estado sólido en la mayoría de las áreas técnicas (roles derivados, rate limiting, validación Zod exhaustiva, webhook MP con HMAC + idempotencia determinística, cron de cleanup, multi-vendor con SubOrder independientes). Sin embargo, hay **bloqueantes reales de dinero, fraude y flujo** que impiden un lanzamiento responsable:

1. **Subastas** están incompletas (el ganador no puede pagar) → decisión tomada 2026-04-15: esconder la funcionalidad, lanzar solo con precio fijo, reactivar en Fase 2.
2. **PIN doble de entrega** no existe en código → sin esto, un repartidor puede marcar "entregado" sin haber ido.
3. El fraude financiero más fácil de explotar (**autocompra para farmear puntos**) está abierto.
4. **Data de prueba visible en producción** (testing interna de Mauro) que hay que limpiar antes de abrir las puertas.
5. El webhook de MP **no tiene reconciliación**: un pedido pagado con webhook fallido queda huérfano en AWAITING_PAYMENT indefinidamente.
6. Los puntos MOOVER se otorgan **antes** de DELIVERED y **no se revierten** en rechazos o refunds manuales.

Los 8 críticos suman ~6-9 días de trabajo full (bajó de 10-14 al decidir esconder subastas en vez de completarlas). Ver estimación al final.

---

## 🔴 CRÍTICOS — Bloquean el lanzamiento

### ISSUE-001 — PIN doble de entrega no implementado
**Detectado por:** Logística, QA, Experto local (CONOCIDO-004)
**Qué pasa:** El sistema del doble PIN (retiro en comercio + entrega al comprador) no existe en el código. Sin PIN, un driver puede marcar "entregado" sin haber llegado al destino. El GPS polling cada 10s no alcanza como validación porque el driver puede falsificar coordenadas (emuladores, mock location en Android).
**Escenario:** Driver acepta pedido, va a su casa en vez del comercio, marca PICKED_UP, luego marca DELIVERED. El comprador nunca recibe y Moovy ya pagó al driver.
**Impacto:** Fraude del repartidor. Este es exactamente el dolor que los comercios le atribuyen a PedidosYa y que Moovy promete resolver.
**Dónde:** Falta por completo:
- `prisma/schema.prisma` — sin `Order.pickupPin` ni `Order.deliveryPin` (y análogos en `SubOrder`)
- Sin endpoints `POST /api/orders/[id]/verify-pickup-pin` ni `verify-delivery-pin`
- `src/app/api/driver/orders/[id]/status/route.ts` permite transicionar a `DELIVERED` sin validación de PIN
- Sin UI en driver app para ingresar PIN
- Sin flujo offline (descarga al dispositivo, validación local, sync al recuperar señal)
- Sin flujo "no pude entregar" (foto de puerta, espera mínima 3min validada por GPS, política de costo envío retenido)
**Cómo resolverlo:**
1. Schema: agregar `pickupPin VARCHAR(6)` y `deliveryPin VARCHAR(6)` en `Order` y `SubOrder`. Generar al crear orden con `crypto.randomInt(100000, 999999)`.
2. Endpoint `POST /api/orders/[id]/verify-pickup-pin` — driver ingresa PIN al recoger, valida `pin === order.pickupPin` (timing-safe), transiciona a `PICKED_UP`. Sin match → 403 y log en audit.
3. Endpoint `POST /api/orders/[id]/verify-delivery-pin` — análogo pero al entregar. El PIN de entrega le llega al comprador por push cuando el driver sale del comercio.
4. `driver/orders/[id]/status/route.ts`: eliminar transición directa `DRIVER_ASSIGNED → PICKED_UP` (ver ISSUE-007) y bloquear `→ DELIVERED` sin llamada previa a verify-delivery-pin.
5. UI driver: pantalla de input de 6 dígitos con teclado numérico, botón "no pude entregar" que abre flujo foto + 3min wait con GPS.
6. Offline: descargar PINs al `JSON.stringify` local al aceptar, validar client-side si no hay red, sincronizar en el próximo fetch.
7. Regla: GPS del driver debe estar a <100m del destino para permitir validación (evita fraude de "ingresé el PIN desde mi casa").

### ISSUE-002 — Esconder funcionalidad de subastas hasta post-lanzamiento
**Detectado por:** Producto, QA (CONOCIDO-003)
**Decisión tomada (2026-04-15):** El flujo de subastas no sale al lanzamiento. El vendedor solo puede publicar con precio fijo. La infraestructura de auction se mantiene en código y schema (para no perder trabajo), pero **oculta** en toda UI pública y del vendedor.
**Por qué:** Auditoría confirmó que el ciclo post-cierre está roto: el ganador recibe "¡Ganaste! Completá el pago" pero no existe ruta ni endpoint de pago; no hay notificación push/email al ganador; no existe panel "Mis ofertas"; no hay cron que expire la ventana de pago; no hay conversión de auction ganada a Order. Completar el flujo correctamente son 2-3 días que necesitamos para estabilizar el resto. Publicar subastas rotas destruye confianza en semana uno.
**Qué hay que hacer concretamente:**
1. **Formulario de publicación del vendedor** (`src/app/vendedor/(protected)/listings/new/page.tsx` o el que corresponda): remover el selector "tipo: precio fijo / subasta" o forzarlo a "precio fijo" con el otro deshabilitado. Validar server-side en `/api/seller/listings` que rechace `type !== "FIXED"` con 400.
2. **Marketplace público**: ocultar cualquier badge/tag "SUBASTA" y los listings con `type === "AUCTION"`. Filtrar en el endpoint `GET /api/listings` por defecto. Las que ya existen en DB quedan inaccesibles para el público.
3. **Limpiar las 2 subastas activas actuales** (vistas en marketplace): soft-delete o convertir a precio fijo si el vendedor las quiere mantener.
4. **AuctionBidPanel**: no renderizar. Si un usuario con link directo llega al detalle de una subasta vieja, mostrar "Esta publicación ya no está disponible".
5. **Cron `close-auctions`**: dejarlo corriendo pero sin efectos públicos (o deshabilitar el cron job en producción).
6. **Documentar en CLAUDE.md**: decisión de producto 2026-04-15 — subastas fuera de scope de lanzamiento, reactivar en Fase 2.

**Tiempo estimado:** 3-4 horas. Mucho más rápido que completar el flujo, sin perder la infraestructura para reactivar después.

### ISSUE-003 — Autocompra permitida (farmeo de puntos y comisiones ficticias)
**Detectado por:** Pagos, Seguridad, QA (CONOCIDO-002)
**Qué pasa:** `POST /api/orders/route.ts` no valida que el comprador (`session.user.id`) sea distinto del vendedor del producto o listing. El bloqueo existe en el endpoint de bid (`/api/listings/[id]/bid/route.ts:76` con `CANNOT_BID_OWN`) pero no se replica en creación de orden.
**Escenario:** Seller crea Listing propio, hace checkout del mismo con MP, paga con su propia tarjeta. La orden llega a DELIVERED (él mismo la "recibe"). Gana puntos MOOVER. Repite N veces. También activa bonus de referido si el seller se auto-invitó con otra cuenta.
**Impacto:** Dinero regalado en puntos. Puede sobrecargar el sistema de recompensas en semana uno.
**Dónde:** `src/app/api/orders/route.ts` — no hay check. La query `tx.listing.findUnique` necesita incluir `seller: { select: { userId: true } }` y comparar.
**Cómo resolverlo:** En el loop de items, para cada `listing`: `if (listing.seller.userId === session.user.id) throw new Error("SELF_PURCHASE")`. Para products: `if (product.merchant.ownerId === session.user.id) throw new Error("SELF_PURCHASE")`. Devolver 403 con mensaje "No podés comprar tus propias publicaciones". 1 hora de trabajo.

### ISSUE-004 — Limpiar data de prueba antes del lanzamiento público
**Detectado por:** Recorrido visual (somosmoovy.com/marketplace), Marketing
**Contexto (aclarado por Mauro, 2026-04-15):** El listing "Chico lindo" a $100.000.000 con selfie es una broma interna de Mauro mientras prueba el sistema; el vendedor "Tienda Prueba" y los contadores de "1 vendido" también son testing. No son bugs del producto, pero **no pueden quedar visibles el día del lanzamiento**.
**Qué hay que hacer:**
1. **Inventario previo al lanzamiento** de todo lo que hay en marketplace y en merchants: listar todos los Listings, Products, SellerProfile, Merchant creados con fines de testing. Mauro confirma uno por uno cuáles se borran y cuáles quedan.
2. **Soft-delete o cleanup de data de test**: correr script (crear `scripts/pre-launch-cleanup.ts`) que liste candidatos (precios >$1M, nombres con "prueba"/"test"/"demo", imágenes duplicadas, vendedores sin pedidos reales en los últimos 30 días). Ejecutar con dry-run primero, aplicar después.
3. **Resetear contadores ficticios**: `timesSold`, `totalOrders`, ratings con un solo voto del propio seller (ver ISSUE-003 — al bloquear autocompra esto se pinta solo).
4. **Verificar manualmente las imágenes de los listings restantes**: cuando hice el recorrido visual me pareció ver una imagen que podía interpretarse como el logo de Subway (colores verde/amarillo) en uno de los listings de subasta. No lo puedo afirmar con certeza desde la captura pequeña, pero conviene que Mauro lo confirme uno por uno. Si efectivamente hay imágenes con logos de marcas registradas de terceros, hay que removerlas (riesgo de reclamo por uso de marca).
5. **Política a futuro**: sumar validación en `/api/seller/listings` que rechace (o flaguee para revisión) imágenes que matcheen hashes de logos conocidos, y nombres de producto con patrones obvios de test.
**Severidad:** CRÍTICO solo por timing — tiene que estar hecho antes de abrir las puertas. Técnicamente es limpieza de datos, no un bug.

### ISSUE-005 — Webhook MP sin reconciliación de pagos pendientes
**Detectado por:** Pagos, CTO, Monitoreo
**Qué pasa:** Si el webhook de MP falla (timeout, 5xx, servidor caído durante los 3 reintentos automáticos de MP), la orden queda en `AWAITING_PAYMENT` con `mpStatus: null` **para siempre**. No hay cron de polling que reconcile consultando el estado real de MP.
**Escenario:** Pico de demanda viernes a la noche, servidor con carga alta, MP reintenta 3 veces y se rinde. Dinero del comprador cobrado en MP, pero la orden nunca pasa a CONFIRMED, el merchant no ve el pedido, el comprador está en AWAITING_PAYMENT eternamente.
**Impacto:** Pérdida silenciosa de pedidos pagados. Reclamo directo del comprador con plata cobrada. Daño reputacional irreparable.
**Dónde:** `src/app/api/webhooks/mercadopago/route.ts` funciona bien en el happy path. Falta cron complementario.
**Cómo resolverlo:**
1. Crear `src/app/api/cron/mp-reconcile/route.ts` que corra cada 10 minutos, busque `Order.findMany({ where: { mpStatus: null, status: "AWAITING_PAYMENT", mpPaymentId: { not: null }, updatedAt: { lt: fiveMinutesAgo } }})`, y para cada una consulte `paymentApi.get({ id: order.mpPaymentId })`. Si `approved` → dispara la misma función `handleApproved()` del webhook (idempotente porque usa eventId determinístico).
2. Alertar a admin si hay pedidos >1h en AWAITING_PAYMENT con payment approved en MP.
3. Agregar métrica "pedidos huérfanos reconciliados" al dashboard OPS.

### ISSUE-006 — Puntos MOOVER otorgados antes de DELIVERED y no revertidos en refund
**Detectado por:** Pagos (Puntos MOOVER subdirector)
**Qué pasa:** Violación de la regla de Biblia Financiera v3: "Points are awarded ONLY when order is DELIVERED". El código actual otorga puntos en `POST /api/orders/route.ts:849` inmediatamente al crear la orden (estado `AWAITING_PAYMENT`/`PENDING`). Además:
- Si el merchant rechaza un pedido ya pagado, `merchant/orders/[id]/reject/route.ts` restaura stock y hace refund de MP pero **no revierte los puntos ganados** (el buyer se queda con puntos gratis).
- Refund manual desde OPS (`/api/ops/refund`) tampoco revierte ni earn ni redeem de puntos.
- El canje de puntos (REDEEM) sí se revierte en cancelación del buyer (`/api/orders/[id]/cancel/route.ts:107-125`) pero solo en ese path.
**Escenario:** Comprador hace pedido de $10.000 usando 0 puntos. Recibe 100 pts al crear orden. Merchant rechaza. Dinero devuelto. Pedido cancelado. El comprador retiene 100 pts de regalo. Repetir.
**Impacto:** Farmeo de puntos vía rechazos controlados. Inflación del pasivo de puntos.
**Dónde:**
- `src/app/api/orders/route.ts:849-866` — mover `recordPointsTransaction(EARN)` fuera de la creación
- `src/app/api/driver/orders/[id]/status/route.ts` — agregarlo cuando `deliveryStatus === "DELIVERED"`
- `src/app/api/merchant/orders/[id]/reject/route.ts` — revertir `pointsEarned`
- `src/app/api/ops/refund/route.ts` — revertir earn y redeem
**Cómo resolverlo:**
1. Persistir `pointsEarned` en `Order` al crear (para saber cuánto revertir).
2. Mover `recordPointsTransaction("EARN")` al handler que transiciona a DELIVERED (driver status).
3. En reject/refund: `if (order.pointsEarned > 0) recordPointsTransaction(userId, "ADJUSTMENT", -order.pointsEarned, "Reversión por rechazo")`.
4. En refund: revertir también el REDEEM (`Math.round(order.discount / pointsConfig.pointsValue)`).
5. Testing: script `scripts/validate-points-integrity.ts` que recorra órdenes canceladas/rechazadas y verifique que no hay puntos huérfanos.

### ISSUE-007 — State machine del driver permite saltar DRIVER_ARRIVED y llegar a DELIVERED sin validación
**Detectado por:** Logística, QA
**Qué pasa:** `src/app/api/driver/orders/[id]/status/route.ts:53-58` permite la transición `DRIVER_ASSIGNED → PICKED_UP` (skip directo) y `PICKED_UP → DELIVERED`. Combinado con la falta de PIN (ISSUE-001), un driver puede marcar DELIVERED en 2 clicks desde que aceptó, sin siquiera pasar cerca del comercio.
**Escenario:** Driver acepta oferta, presiona "Pedido retirado" antes de salir de su casa, luego "Entregado". Cobra. Nunca fue a ningún lado.
**Impacto:** Fraude del driver. Exacerba ISSUE-001.
**Dónde:** `src/app/api/driver/orders/[id]/status/route.ts` — matriz de transiciones permitidas incluye el skip "para compat hacia atrás".
**Cómo resolverlo:**
1. Eliminar el skip. Secuencia estricta: `DRIVER_ASSIGNED → DRIVER_ARRIVED → PICKED_UP → DELIVERED`.
2. Cada transición debe validar proximidad GPS (DRIVER_ARRIVED requiere <50m del comercio, DELIVERED requiere <50m del destino).
3. Con ISSUE-001 implementado, PICKED_UP requiere verificación de pickup PIN y DELIVERED requiere delivery PIN.

### ISSUE-008 — Delivery fee: fallback acepta valor del cliente si falla el cálculo server
**Detectado por:** Pagos, Seguridad
**Qué pasa:** `src/app/api/orders/route.ts:162-256` recalcula delivery fee server-side (correcto), pero si ese cálculo falla (try/catch interno, L188), usa el `deliveryFee` que mandó el cliente como fallback. Un atacante puede forzar el fallo (entrada inválida, condición de carrera) y mandar `deliveryFee: 1`.
**Escenario:** Buyer manipula payload de checkout enviando un address payload que rompa el cálculo server + `deliveryFee: 1`. La orden se crea con subtotal correcto y envío de $1.
**Impacto:** Moovy absorbe la diferencia del envío (cubre al repartidor, al comercio y al costo operativo real). Escala rápido si se distribuye el truco.
**Dónde:** `src/app/api/orders/route.ts:183-198` (catch del cálculo de fee).
**Cómo resolverlo:** En el catch, **no** usar el fee del cliente. Retornar `NextResponse.json({ error: "No pudimos calcular el envío. Intentá de nuevo." }, { status: 500 })`. Forzar al cliente a reintentar con un payload que el server pueda calcular. Loguear en Pino con severidad `error` incluyendo el payload para debug.

---

## 🟡 IMPORTANTES — Afectan experiencia o generan fricción, no bloquean

### ISSUE-009 — Multi-vendor: doble contabilidad de comisión
**Qué pasa:** En `src/app/api/orders/route.ts:698-757` cada `SubOrder` persiste su propia `moovyCommission`. Pero además, el `Order` de nivel superior calcula en L471 una `moovyCommission` basada en el `merchantId` singular, como si toda la orden fuera de un solo comercio. En reportes se suman ambos.
**Impacto:** Comisiones infladas en analytics y CSV export. Reportes contables incorrectos.
**Fix:** Si `isMultiVendor === true`, dejar `Order.moovyCommission = 0` y usar solo `SubOrder.moovyCommission` agregado.

### ISSUE-010 — Driver se desconecta mid-delivery y el pedido queda huérfano
**Qué pasa:** El cron `retry-assignments` solo busca órdenes en `CONFIRMED`. Una orden en `PICKED_UP` con driver offline >15min no se reasigna ni alerta.
**Impacto:** Comprador + comercio esperando entrega que nunca llega. Reclamo.
**Fix:** Agregar en el cron: `Order.where({ deliveryStatus: "PICKED_UP", driver: { isOnline: false }, updatedAt: { lt: 15minAgo } })` → reasignar o alertar admin.

### ISSUE-011 — Bug mapa tracking horizontal: se resetea al hacer zoom
**Detectado por:** CONOCIDO-001
**Qué pasa:** En la versión horizontal, el `fitBounds` no preserva el viewport del usuario. Cada update del driver dispara el reset. En vertical está bien.
**Fix:** `src/components/orders/OrderTrackingMiniMap.tsx:287-291` — pasar `{ preserveViewport: true, maxZoom: 18 }` al `fitBounds`. O detectar si el usuario interactuó con el mapa (onDragEnd) y no volver a llamar fitBounds en ese caso.

### ISSUE-012 — Navegación: sin breadcrumbs en checkout y accesos faltantes
**Detectado por:** CONOCIDO-005 confirmado con recorrido visual
**Qué pasa:** Bottom nav muestra Inicio/Marketplace/MOOVER/Pedidos/Perfil. Checkout multi-paso no tiene breadcrumb (carrito → checkout → pago) por lo que el usuario no sabe en qué paso está ni puede volver a carrito sin perder progreso. Algunas secciones útiles (favoritos, direcciones guardadas, historial de puntos) solo son accesibles desde el perfil, sin shortcut visible.
**Fix:** Breadcrumb en checkout con 3 pasos claros y estado "donde estoy". Revisar accesos a favoritos y puntos desde home. (El acceso a "Mis ofertas" queda fuera de scope dado que subastas se esconden — ver ISSUE-002.)

### ISSUE-013 — Aviso "tu repartidor está cerca" no existe
**Qué pasa:** El sistema emite `posicion_repartidor` por socket y el mapa actualiza, pero no hay push notification cuando el driver cruza un umbral de distancia (ej: <300m del destino).
**Impacto:** Comprador no sabe que tiene que bajar a recibir. Driver espera. Si hay PIN (ISSUE-001), es crítico que el comprador esté con el teléfono a mano.
**Fix:** Al procesar la location del driver, si `distancia_al_destino < 300m` y no se emitió antes para esa orden (flag `nearDestinationNotified` en Order), enviar push al buyer con el PIN de entrega.

### ISSUE-014 — Smart batching multi-vendor sin validación de capacidad de vehículo
**Qué pasa:** `src/lib/assignment-engine.ts:523-700` (`startSubOrderAssignmentCycle`) hace batching si los comercios están a <3km, pero no suma volumen/peso para verificar que realmente cabe en el vehículo del driver.
**Impacto:** Driver sobrecargado, entrega lenta, items dañados.
**Fix:** Agregar tabla de capacidad por vehículo (BIKE 5 / MOTO 15 / CAR 30 / TRUCK 60 "package units") y validar suma de `packageCategory` score antes de batchar.

### ISSUE-015 — Retry cron de asignación no tiene escalación final
**Qué pasa:** Tras 3 escaladas sin driver, el pedido queda esperando. No hay fallback a "UNDELIVERABLE" ni notificación al comprador ni refund automático.
**Fix:** Si `assignmentLogs.length >= MAX_RETRIES * 2`, cancelar orden con `cancelReason: "No hay repartidores disponibles"`, disparar refund MP, notificar buyer con disculpas + puntos bonus de $500.

### ISSUE-016 — Refund manual desde OPS no revierte puntos ganados ni canjeados
**Relacionado a ISSUE-006** pero como issue independiente para el endpoint.
**Qué pasa:** `/api/ops/refund` devuelve el dinero en MP pero no toca `PointsTransaction`.
**Fix:** Replicar la lógica de reversión del cancel buyer, adaptada al contexto admin.

### ISSUE-017 — XSS stored en direcciones del perfil
**Qué pasa:** `src/app/api/profile/addresses/route.ts:44-108` acepta `label`, `street`, `neighborhood` sin sanitizar contenido. Si se renderiza con `{address.label}` en JSX está escapado, pero si alguna vista lo mete en `dangerouslySetInnerHTML` (ej: en template de email de confirmación), es XSS.
**Fix:** Validar con Zod: `z.string().trim().max(100).regex(/^[\w\sñáéíóúÑÁÉÍÓÚ.,#\-°º]+$/)`. Rechazar `<`, `>`, `{`, `}`, backticks.

### ISSUE-018 — `dangerouslySetInnerHTML` en panel de emails OPS
**Qué pasa:** `src/app/ops/(protected)/emails/page.tsx` usa `dangerouslySetInnerHTML` para preview. Si el contenido viene de templates editables por admin, es un vector interno; si incluye variables del comprador sin escapar, es XSS stored.
**Fix:** Sanitizar con `DOMPurify` antes de inyectar. Whitelist de tags permitidos en templates.

### ISSUE-019 — Socket.IO: rooms de tracking sin validación de ownership
**Qué pasa:** `scripts/socket-server.ts:259` (`track_order`) permite a cualquier socket autenticado hacer join al room `order:<id>` sin validar que el user sea el buyer/merchant/driver/admin de esa orden.
**Impacto:** Un user curioso puede escuchar updates de ubicación de otros drivers/órdenes.
**Fix:** Antes de `socket.join(...)`, verificar `order.userId === socket.data.userId || order.merchantId === socket.data.merchantId || order.driverId === socket.data.driverId || socket.data.role === "ADMIN"`.

### ISSUE-020 — Comisión mes 1 (0%) vs mes 2+ (8%): criterio de "mes" no documentado
**Qué pasa:** La regla es "0% el primer mes". Si se interpreta como mes calendario vs primeros 30 días exactos, un merchant creado el 25 puede ser cobrado distinto que uno creado el 2.
**Fix:** Definir en código y en Biblia: "30 días corridos desde `Merchant.createdAt`". Test unitario con 3 fechas borde. Exponerlo en el dashboard del merchant ("Tu período sin comisión vence el DD/MM/AAAA").

### ISSUE-021 — Onboarding vacío para buyer nuevo
**Qué pasa:** Un comprador recién registrado que entra al home ve "La Estancia" y poco más. No hay tooltip de "acá está tu carrito", "así funciona MOOVER", "tenés $500 de bienvenida".
**Fix:** Tour opcional de 3 pantallas al primer login: (1) qué es Moovy, (2) cómo pedir, (3) tus puntos de bienvenida. Guardar flag `onboardingCompletedAt` en User.

### ISSUE-022 — Listings públicas exponen `seller.id`
**Qué pasa:** `GET /api/listings` devuelve `seller.id` en cada listing. No es IDOR directo, pero facilita enumeración y ataques dirigidos a sellers.
**Fix:** Remover `seller.id` del select público. Devolver solo `displayName`, `rating`, `avatar`.

### ISSUE-023 — `/api/search/autocomplete` sin rate limit
**Qué pasa:** Endpoint sin `applyRateLimit()`. Un atacante hace 10k queries/min → carga en DB.
**Fix:** Agregar `applyRateLimit(request, "search:autocomplete", 30, 60_000)`.

---

## 🟢 MENORES — Pulir post-lanzamiento

### ISSUE-024 — Puntos: transacción no usa `isolationLevel: Serializable`
Race condition teórico si usuario gasta puntos desde 2 tabs simultáneas. Fix: agregar `{ isolationLevel: "Serializable" }` al `$transaction` en `src/lib/points.ts:206`.

### ISSUE-025 — GPS polling 10s sin throttle por batería
Driver puede quedarse sin batería mid-entrega. Fix: si `navigator.getBattery().level < 0.15`, aumentar intervalo a 30s y mostrar aviso.

### ISSUE-026 — `DriverLocationHistory` cleanup cron sin alerta si falla
Si el cron de cleanup no corre, la tabla crece sin límite. Fix: agregar `healthCheck` al dashboard OPS que avise si `lastRun > 24h`.

### ISSUE-027 — Timing attack en validación de reset-password token
Comparación probablemente con `===` (no verificado). Fix: usar `crypto.timingSafeEqual()`.

### ISSUE-028 — Estados vacíos sin componente unificado
Varias pantallas muestran listas vacías sin CTA. Fix: componente `<EmptyState icon={...} title="..." cta="..." />` reutilizable.

### ISSUE-029 — "1 vendido" en listings puede ser falso
Contador `timesSold` visible en marketplace incluye ventas de la propia cuenta del seller (ver ISSUE-003). Al arreglar autocompra, recalcular.

### ISSUE-030 — Contador "2 publicaciones, 10 categorías" en header de marketplace es engañoso
Decir "Conocé las 2 publicaciones actuales" no inspira confianza pre-lanzamiento. Alternativa: ocultar contadores hasta tener volumen, o decir "Publicaciones de vecinos".

### ISSUE-031 — Merchant dashboard sin alerta "primer pedido"
Al recibir el primer pedido de la vida, el merchant no recibe aviso especial (push + email "tenés tu primer pedido, hacé clic para aceptarlo").
**Fix:** Check `merchant.totalOrders === 0` al crear orden → notificación especial con guía de 3 pasos.

### ISSUE-032 — Costa Susana (zona excluida): verificar bloqueo real en checkout
CLAUDE.md dice que está excluida por falta de señal. Confirmar que `/api/delivery/calculate` rechaza con error claro al usuario ("Lamentablemente no llegamos a Costa Susana por falta de señal celular") y no solo aplica un multiplicador alto.

---

## ✅ Lo que está bien (no tocar)

- Sistema de roles derivados desde el dominio (2026-04-10): excelente decisión, elimina clase entera de bugs de drift.
- Rate limiting en auth/register/forgot-password/orders/upload: configurado correctamente con fallback in-memory si Redis no está.
- Validación de magic bytes en uploads + sharp compression + 10MB max.
- `verifyBearerToken()` con timing-safe comparison en crons.
- Webhook MP: HMAC validation + idempotencia determinística + validación de monto con tolerancia $1.
- Validación Zod exhaustiva en ~120 endpoints.
- Transacción serializable en ratings, cupones, stock (donde se usa).
- Driver accept: transacción Serializable previene doble aceptación (aunque el status 409 falta — ver ISSUE relacionado).
- CORS Socket.IO: whitelist estricta.
- Merchant orders confirm/reject: valida ownership correctamente.
- Soft delete en User, Order, etc.
- Auditoría previa de role system (2026-04-10) documentada.

---

## ⏱ Estimación

| Categoría | Issues | Días de trabajo (full) |
|-----------|--------|-------------------------|
| Críticos (8) | 001-008 | 6-9 días |
| Importantes (15) | 009-023 | 8-12 días |
| Menores (9) | 024-032 | 3-5 días post-lanzamiento |
| **Total pre-lanzamiento** | **23** | **14-21 días** |

### Priorización sugerida para lanzamiento

**Semana 1 (bloqueantes absolutos):**
- ISSUE-002 Esconder subastas (3-4h) — primer paso, libera foco
- ISSUE-003 Autocompra (1h)
- ISSUE-004 Limpiar data de prueba (2-3h + revisión manual con Mauro)
- ISSUE-001 PIN doble (3-4d) — el grande de la semana
- ISSUE-005 Webhook MP reconcile (1d)

**Semana 2 (bloqueantes por dinero/fraude):**
- ISSUE-006 Puntos reversión (1-2d)
- ISSUE-007 State machine driver (1d)
- ISSUE-008 Delivery fee fallback (2h)

**Semana 3 (importantes):**
- ISSUE-009, 010, 011, 012, 013 — UX y consistencia contable

**Post-lanzamiento:**
- Resto de importantes + todos los menores

### Validación obligatoria antes de deploy

Para cualquier cambio en este ISSUES.md que toque dinero, asignación o parámetros configurables, correr:
- `npx tsx scripts/validate-ops-config.ts`
- Script específico de integridad de puntos (crear en ISSUE-006)
- Smoke test manual de los 4 flujos (PROJECT_STATUS.md)
