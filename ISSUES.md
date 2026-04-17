# Moovy — Issues pre-lanzamiento

**Generado:** 2026-04-15 (auditoría inicial) + **2026-04-15 UX pass** (recorrido completo de pantallas en producción con usuario real de 4 roles + admin)
**Ramas:** `docs/pre-launch-issues-audit` (técnico), `docs/pre-launch-ux-audit` (UX)
**Alcance:** Auditoría integral (7 roles + recorrido visual de somosmoovy.com + audit de ~170 endpoints + UX pass sobre 25+ pantallas con cuenta multi-rol y cuenta admin) para identificar bloqueantes y mejoras previas al lanzamiento.

**Total:** 59 issues | **Críticos:** 13 | **Importantes:** 30 | **Menores:** 16

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

---

# UX Pass — 2026-04-15

Pasada por las pantallas reales de producción con cuenta multi-rol (`maugrod@gmail.com`, roles USER/COMERCIO/DRIVER/SELLER) y cuenta admin (`maurod@me.com`) aplicando el protocolo de 7 preguntas. 19 hallazgos. Chrome se cerró un par de veces mid-audit, así que el checkout (agregar al carrito + 3 pantallas del flujo de pago) no se pudo completar end-to-end — queda para smoke test manual pre-lanzamiento.

## 🔴 CRÍTICOS UX

### ISSUE-033 — `/moover` crashea con error genérico "Algo salió mal"
**Actor:** comprador
**Pregunta fallida:** 4 (¿qué pasó después de actuar?) y 5 (¿qué hacer si algo falla?)
**Qué ve hoy:** La bottom nav dice "MOOVER" y sugiere que esa es la sección de puntos. Al tipear `/moover` o al tocar el link (desde algún otro lado si existe), la página muestra "Algo salió mal / Ocurrió un error inesperado" con botones Reintentar / Ir al inicio. La ruta real es `/puntos`.
**Qué debería ver:** O la ruta `/moover` redirige a `/puntos` (301), o la página `/moover` existe y muestra el mismo contenido. El mensaje genérico "Algo salió mal" sin contexto asusta al usuario nuevo que está explorando.
**Severidad:** crítico
**Esfuerzo:** S (30 min — agregar redirect en `src/app/moover/page.tsx` o en `next.config.js`)
**Dónde:** error visible en `https://somosmoovy.com/moover`. Verificar si el link del bottom nav apunta a `/puntos` o a `/moover` (en screenshots parecía `/puntos`, pero el nombre del ítem "MOOVER" genera la confusión).

### ISSUE-034 — Comercio muestra badge "Sin conexión" en la pantalla de pedidos
**Actor:** comercio
**Pregunta fallida:** 4 (¿sabe qué pasó?) — si hay un pedido nuevo, no se entera
**Qué ve hoy:** En `/comercios/pedidos` aparece un badge rojo "Sin conexión" junto al título "Pedidos", con un ícono de refresh. El Socket.IO está caído y la UI lo muestra pero no auto-recupera ni alerta audible.
**Qué debería ver:** Auto-reintentar la conexión sin intervención. Si no se puede, mostrar un banner sticky con "Tu conexión se cortó. Tocá para reintentar. Mientras tanto podés perderte pedidos." + sonido de alerta si dura >30s. Mientras el socket esté caído, hacer polling cada 10s al endpoint REST como fallback.
**Severidad:** crítico — un comercio que pierde pedidos pierde plata y reputación
**Esfuerzo:** M
**Dónde:** `src/hooks/useSocket.ts` + `src/app/comercios/(protected)/pedidos/**`

### ISSUE-035 — Rutas naturales de comprador (`/pedidos`, `/perfil`) tiran 404
**Actor:** comprador
**Pregunta fallida:** 1 (¿sabe dónde está?) y 2 (¿qué puede hacer?)
**Qué ve hoy:** Al tipear directamente `/pedidos` o `/perfil` (rutas intuitivas que cualquiera probaría, especialmente si compartís un link desde WhatsApp o guardás un favorito), la página muestra 404 "Página no encontrada" sin bottom nav ni header. La 404 no sugiere alternativas: no dice "¿Buscabas Mis Pedidos?" con link a `/mis-pedidos`. Las rutas reales son `/mis-pedidos` y `/mi-perfil`.
**Qué debería ver:** `/pedidos` y `/perfil` redirigen 301 a sus equivalentes con `/mis-` prefijo. Y la página de 404 debe tener header + bottom nav + sugerencias clickeables.
**Severidad:** crítico — bloquea share de links por WhatsApp, favorites, memoria muscular de usuarios que vienen de otras apps donde la ruta es `/pedidos`
**Esfuerzo:** S (redirects en `next.config.js` + mejora de `src/app/not-found.tsx`)

## 🟡 IMPORTANTES UX

### ISSUE-036 — Home: la misma tienda aparece 4 veces en distintas secciones
**Actor:** comprador
**Pregunta fallida:** 3 (¿tiene información para decidir?)
**Qué ve hoy:** "La Estancia" aparece en "Abiertos ahora", "Nuevos en MOOVY", "Los más pedidos" y "Mejor calificados". La primera impresión es que hay un solo comercio pero cuatro secciones hablando de él. En lugar de dar variedad, transmite pobreza de oferta.
**Qué debería ver:** Reglas de diversidad: si hay <3 comercios totales, mostrar una sola sección "Comercios en Moovy" con todos. Si hay ≥3, garantizar que cada sección tenga al menos 2 comercios distintos y nunca repetir el mismo comercio en 2+ secciones. "Los más pedidos" debe ocultarse si no hay pedidos todavía (launch week = sin datos).
**Severidad:** importante
**Esfuerzo:** M

### ISSUE-037 — Dashboard comercio: contador de progreso inconsistente (5/7, 5/8 y 5/9 visibles)
**Actor:** comercio
**Pregunta fallida:** 3 (¿información para decidir?) y 5 (¿qué hacer si algo falla?)
**Qué ve hoy:** En `/comercios` (dashboard) el banner dice "5/9 Completa los pasos obligatorios" arriba, pero abajo aparece "Tu tienda permanecerá cerrada hasta que completes los pasos obligatorios (5/7)" — y según el viewport también aparece "5/8". Tres números distintos para el mismo contador.
**Qué debería ver:** Un único contador coherente, derivado del mismo cálculo server-side. Sugerencia: "5 de 7 requisitos obligatorios" (no contar los "Recomendados" en el número). En el check de apertura, usar exactamente esos 7.
**Severidad:** importante — rompe confianza del merchant en la plataforma desde el día 1
**Esfuerzo:** S

### ISSUE-038 — Dashboard comercio: chip "Abierto" verde cuando la tienda está cerrada
**Actor:** comercio
**Pregunta fallida:** 1 (¿sabe dónde está?) y 2 (¿qué puede hacer?)
**Qué ve hoy:** Junto al título "Dashboard" hay un chip verde "● Abierto" mientras el banner dice "Tu tienda permanecerá cerrada hasta que completes los pasos obligatorios". Contradicción visual directa.
**Qué debería ver:** El chip debe reflejar estado real. Tres estados posibles: "Pendiente" (gris, requisitos incompletos), "Cerrada" (rojo, cumple requisitos pero el merchant la cerró manualmente), "Abierta" (verde, lista y recibiendo). En este caso sería "Pendiente".
**Severidad:** importante
**Esfuerzo:** S

### ISSUE-039 — Portal repartidor: formato de moneda US en app argentina ($1,235 en vez de $1.235)
**Actor:** repartidor
**Pregunta fallida:** 3 (información para decidir)
**Qué ve hoy:** En el dashboard driver, "Ganancias hoy $1,235" con coma como separador de miles (formato US). En Argentina la coma es decimal y el punto es separador de miles. Leer "$1,235" un argentino lo interpreta como "un peso con veintitrés centavos".
**Qué debería ver:** `$1.235` o `$1.235,00` usando `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.
**Severidad:** importante — un driver que no entiende lo que cobra pierde confianza
**Esfuerzo:** S — auditar todos los usos de `.toLocaleString()` y `toFixed()` en el proyecto, envolver en helper centralizado `formatARS()`

### ISSUE-040 — Detalle de comercio: falta horario visible y pedido mínimo
**Actor:** comprador
**Pregunta fallida:** 3 (información para decidir) — no sabe si el comercio está abierto AHORA ni cuánto tiene que gastar mínimo
**Qué ve hoy:** `/tienda/la-estancia` muestra rating, tiempo de entrega (30-45 min), dirección, chip "Envío Gratis" y lista de productos. No muestra: estado "Abierto/Cerrado ahora", horarios de atención del día, pedido mínimo, radio de entrega.
**Qué debería ver:** Chip verde "Abierto hasta las 22:00" o rojo "Cerrado. Abre mañana 9:00". Debajo, "Pedido mínimo: $3.000" si aplica. "Envía a tu zona" o "No envía a tu zona" basado en la dirección guardada del usuario.
**Severidad:** importante — el usuario arma el carrito, va a checkout, y ahí descubre que el local está cerrado o que no llega a su barrio
**Esfuerzo:** M

### ISSUE-041 — Detalle de producto: no muestra nombre del comercio ni tiempo de entrega
**Actor:** comprador
**Pregunta fallida:** 1 (¿dónde está?) y 3 (información para decidir)
**Qué ve hoy:** `/productos/coca-cola-...` muestra imagen, nombre, precio, "En stock", descripción "500ml" y botón Agregar. No dice de qué comercio es ni cuánto tarda en llegar.
**Qué debería ver:** Bajo el precio, un chip clickeable con el nombre del comercio y tiempo de entrega: "De La Estancia · 30-45 min".
**Severidad:** importante
**Esfuerzo:** S

### ISSUE-042 — Sin breadcrumbs en flujos multi-paso (catálogo, checkout)
**Actor:** comprador
**Pregunta fallida:** 1 (¿dónde está?) y 2 (qué puede hacer)
**Qué ve hoy:** Al entrar a un producto, solo hay un `<` (flecha atrás). No dice "Inicio > La Estancia > Coca Cola". Si el usuario llega desde un link directo, no sabe de qué comercio es ni cómo volver a él sin perder el scroll.
**Qué debería ver:** Breadcrumb clickeable en desktop; en mobile, mantener la `<` pero mostrar un subtítulo "La Estancia" bajo el nombre del producto con link.
**Severidad:** importante
**Esfuerzo:** S

### ISSUE-043 — Dashboard comercio: tachado visual sobre items completados se lee como "eliminado"
**Actor:** comercio
**Pregunta fallida:** 2 (qué puede hacer) y 4 (feedback claro)
**Qué ve hoy:** En la lista de setup, los items completados ("CUIT cargado", "CBU o Alias bancario", "Configurá horarios") aparecen con texto verde pero **con línea de tachado encima**. En UI occidental, strike-through significa eliminado/invalidado, no completado.
**Qué debería ver:** Texto verde + ícono ✓ + SIN tachado. Opcional: opacidad reducida (70%) para diferenciar de los pendientes sin transmitir "anulado".
**Severidad:** importante
**Esfuerzo:** S

### ISSUE-044 — Perfil: ícono de tacho para eliminar dirección PRINCIPAL sin confirmación
**Actor:** comprador
**Pregunta fallida:** 7 (confirmación antes de destructivo)
**Qué ve hoy:** En `/mi-perfil/direcciones` junto a la dirección marcada como PRINCIPAL hay un tacho clickeable. No sabemos si tiene confirmación (no llegué a clickear en el audit), pero si no la tiene, un toque accidental deja al usuario sin dirección y el próximo checkout falla.
**Qué debería ver:** Tacho dispara modal "¿Eliminar Mi Casa? No podrás hacer pedidos a esta dirección. [Cancelar] [Eliminar]". Si es la ÚNICA dirección, no permitir eliminar, reemplazar CTA por "Editar" o "Reemplazar".
**Severidad:** importante
**Esfuerzo:** S
**Nota:** Verificar con click real si ya tiene confirmación; si la tiene, bajar a menor.

### ISSUE-045 — Puntos: falta progress bar a próximo nivel y explicación del valor del punto
**Actor:** comprador
**Pregunta fallida:** 2 (qué puede hacer) y 3 (información para decidir)
**Qué ve hoy:** `/puntos` muestra "0 puntos" grande + "Tu nivel: MOOVER" + código de referido. No hay progress bar hacia SILVER (5 pedidos en 90 días) ni mención del valor del punto ("1 punto = $1, mínimo 500 pts para canjear, hasta 20% del subtotal"). Esas reglas viven solo en Biblia Financiera v3.
**Qué debería ver:** Bajo el balance, un bloque "Vos gastás 1 punto = $1 de descuento. Desde 500 pts podés canjear. Máximo 20% del pedido." Debajo, tabla visual de niveles con checkmark en donde estás y progress hacia el siguiente.
**Severidad:** importante — sin esto, el sistema de puntos no motiva porque el usuario no entiende qué ganará
**Esfuerzo:** M

### ISSUE-046 — Bottom nav dice "MOOVER" pero ruta es `/puntos` — inconsistencia marca vs ruta
**Actor:** comprador
**Pregunta fallida:** 1 (¿dónde está?)
**Qué ve hoy:** Al tocar el tab "MOOVER" del bottom nav se va a `/puntos` (se ve bien). Pero al tipear `/moover` crashea (ver ISSUE-033). La URL no refleja el nombre de la marca que el usuario lee en pantalla.
**Qué debería ver:** Elegir una de las dos: renombrar la ruta a `/moover` (más consistente con el branding) o renombrar el tab del bottom nav a "Puntos" (más descriptivo). Recomendación: `/moover` porque MOOVER es el sistema de loyalty y ya está siendo marketing; hacer redirect de `/puntos` → `/moover`.
**Severidad:** importante (también hace ISSUE-033 más urgente)
**Esfuerzo:** S

### ISSUE-047 — Portal vendedor: toggle "Cerrado / No recibo pedidos" con semántica ambigua
**Actor:** vendedor marketplace
**Pregunta fallida:** 2 y 4
**Qué ve hoy:** Un switch con label "● Cerrado / No recibo pedidos". No queda claro si el switch off = cerrado (como está ahora) o switch off = abierto. El punto rojo al lado del texto refuerza "cerrado" pero el copy "No recibo pedidos" es la subexplicación, no el estado.
**Qué debería ver:** Un único label grande: "Abierto a ventas" / "Cerrado a ventas" dependiendo del estado real, con color de fondo (verde/rojo) que refuerce. El switch debe quedar visualmente subordinado al estado.
**Severidad:** importante
**Esfuerzo:** S

## 🟢 MENORES UX

### ISSUE-048 — Home comprador: dos barras de búsqueda (una en header, otra hero)
En desktop se ven dos inputs de búsqueda: uno compacto en el header y uno grande bajo "¿Se te antoja algo?". Simplificar a uno (el del hero en home, el del header en páginas internas).

### ISSUE-049 — Tienda: categoría única "Otros (2)" cuando solo hay 2 productos
Mostrar la lista sin filtro de categoría si hay <5 productos. El filtro "Otros" para 2 productos es visual overhead sin valor.

### ISSUE-050 — Dashboard ops: "Facturado hoy $0 · Max $0" confunde
El métrico "Max: $0" junto a "Facturado hoy: $0" no tiene sentido en lanzamiento (nunca hubo max distinto de 0). Ocultar hasta que haya datos o reemplazar por "Récord: $0".

### ISSUE-051 — Portal repartidor: $1,235 sin info de zona, vehículo ni batería
El dashboard driver no muestra el vehículo configurado, la zona asignada ni el nivel de batería (que es crítico para evitar quedarse sin GPS mid-entrega). Agregar strip superior con estos 3 datos.

---

## Respuestas a las 3 preguntas finales

### ¿Cuál es la pantalla con más problemas?

**Dashboard del comercio (`/comercios`).** Concentra tres bugs visibles en la misma pantalla: (a) contador inconsistente 5/7 vs 5/8 vs 5/9, (b) chip "Abierto" verde mientras la tienda está cerrada, (c) tachado sobre items completados. A esto se suma que la pantalla hermana (`/comercios/pedidos`) muestra "Sin conexión" — el merchant abre el panel y lo primero que ve son contradicciones y errores. Primera impresión del actor más crítico del negocio (el que cobra al instante, nuestra principal propuesta de valor) comprometida.

### ¿Hay algún flujo completo que esté roto, no solo una pantalla?

**Sí, dos:**

1. **Flujo de descubrimiento → navegación de rutas intuitivas.** Un usuario que viene de apps como PedidosYa tipea `/pedidos` o `/perfil` por memoria muscular → 404. Un usuario que lee "MOOVER" en el bottom nav y quiere recordar la URL tipea `/moover` → crash. Estas 3 rutas naturales rotas rompen el flujo antes de que el usuario encuentre lo que busca.

2. **Flujo del comercio en sus primeros 10 minutos (ISSUE-034 + ISSUE-037 + ISSUE-038 + ISSUE-043 combinados).** Un merchant nuevo entra, ve "Abierto" pero también "permanecerá cerrada", el contador de progreso cambia según la pantalla, los items completados se ven tachados como si hubieran sido eliminados, y al ir a Pedidos aparece "Sin conexión". No hay un solo momento de confianza en los primeros 30 segundos.

### ¿Cuál es el issue de UX que más daño haría al lanzamiento si queda sin resolver?

**ISSUE-034 — "Sin conexión" en portal comercio.** Razones:

- Un comercio que no recibe la notificación del pedido pierde plata real (la venta se cancela, el buyer se frustra, el rating del comercio baja).
- En ciudad chica de 80k habitantes, un solo comercio que se queje públicamente ("me dejó de llegar") contamina la percepción de toda la plataforma en 48h.
- Es probabilísticamente cierto que va a pasar (el badge ya aparece en producción aunque no haya tráfico real — imaginá con 20 comercios conectados).
- El fix no es complejo (polling fallback + alerta audible + auto-reconnect agresivo) pero requiere trabajo deliberado.

Si tuviera que elegir UNO solo para tapar, sería este.

## Ajuste a la estimación total

Con los 19 issues UX sumados:

| Categoría | Total issues | Días estimados |
|-----------|-------------|----------------|
| Críticos (10) | ISSUE-001 a 008 + UX-033, 034, 035 | 7-10 días |
| Importantes (25) | ISSUE-009 a 023 + UX-036 a 047 | 10-14 días |
| Menores (16) | ISSUE-024 a 032 + UX-048 a 051 | 4-6 días post-lanzamiento |
| **Total pre-lanzamiento** | **35** | **17-24 días full** |

El incremento por el UX pass es moderado (~3-4 días) porque muchos issues UX son S (<2h cada uno) — redirects, renombres, copy fixes, componentes existentes.

---

# Checkout end-to-end — 2026-04-15 (segunda pasada)

Pude completar el flujo con `maugrod@gmail.com`: agregar Coca Cola al carrito, `/carrito` → `/checkout` método de entrega → confirmar → **el pedido se creó (ID `#MOV-7F43`, estado Pendiente, método Efectivo, La Estancia, $1.000)**. Hallazgos en vivo:

## 🔴 CRÍTICOS adicionales

### ISSUE-052 — Post-confirmación redirige a `/productos` en vez de a la pantalla del pedido (y se dispara modal de puntos encima)
**Actor:** comprador
**Pregunta fallida:** 4 (¿sabe qué pasó después de actuar?) catastróficamente
**Qué pasa:** Al tocar "Confirmar Pedido" en el último paso del checkout, la app:
1. Crea el pedido correctamente (aparece en `/mis-pedidos`).
2. Redirige al usuario a `/productos` (pantalla de listado de productos del marketplace).
3. Encima de esa pantalla, muestra un modal "¡GANASTE! +1.000 PUNTOS MOOVY / Ver mis puntos / Cerrar".

Esto deja al comprador **desorientado**: pagó (se comprometió a pagar efectivo), pero en vez de ver "Pedido recibido, #MOV-XXXX, estamos avisando al comercio" con tracking, ve una pantalla genérica de productos + un modal de puntos. No sabe si el pedido se creó. No tiene link directo al tracking. Tiene que navegar manualmente a Pedidos.
**Qué debería pasar:** Redirect a `/pedido/[id]` (o `/mis-pedidos/[id]`) con una pantalla "¡Gracias! Tu pedido está en camino" que muestre:
- Número de pedido grande y copiable
- Estado inicial "Esperando confirmación de La Estancia"
- Resumen (items, total, método de pago)
- Tiempo estimado
- Botón "Seguir pedido" / "Ver mapa"
- Opcional modal de puntos después, sin bloquear

**Severidad:** crítico — una pantalla post-checkout ausente en el momento más emocional del flujo destruye confianza
**Esfuerzo:** S (crear `src/app/pedido/[id]/confirmado/page.tsx` + cambiar el redirect del handler de Confirmar en checkout)

### ISSUE-053 — Puntos otorgados al CREAR el pedido, antes de CONFIRMED/DELIVERED (evidencia viva de ISSUE-006)
**Actor:** comprador (validado en vivo)
**Qué pasó en el test:** Balance previo **0 puntos**. Se crea pedido MOV-7F43 estado "Pendiente" (sin aceptar por comercio, sin entregar, método Efectivo = sin pago todavía). Aparece modal "+1.000 puntos" y `/puntos` ahora muestra balance **1.000**.

Dos problemas superpuestos:

1. **Timing**: los puntos se dieron en estado Pendiente, violando la regla "earn ONLY en DELIVERED" de Biblia Financiera v3. Confirma ISSUE-006 con evidencia directa. Si el comercio rechaza el pedido o el buyer lo cancela, los puntos **no se revierten** (según ISSUE-006 la lógica de reversión no existe en ese path).

2. **Monto**: 1.000 puntos por $1.000 = **100% cashback**, cuando Biblia dice 10 pts por cada $1.000 (1%). Hay dos hipótesis:
   - **A) El código está pagando 100x lo debido** (regresión del fix de 2026-04-07 documentado en CLAUDE.md, o que el fix solo corrigió el display pero no el cálculo del earn real).
   - **B) Es el welcome bonus de mes 1 ($1.000 pts por signup), que debería haberse acreditado al registrarse pero está disparándose aquí por timing incorrecto.**

Cualquiera sea el caso, hay que auditar `src/lib/points.ts` + `src/app/api/orders/route.ts:849-866` con queries directas a DB:
```ts
SELECT * FROM "PointsTransaction" WHERE "userId" = <maugrod user_id> ORDER BY "createdAt" DESC LIMIT 5;
```
Esto va a decir si es type=EARN (problema A, bug de cálculo) o type=BONUS_SIGNUP (problema B, timing equivocado).

**Severidad:** crítico — dinero regalado sin control
**Esfuerzo:** L (requiere investigar causa + fix + script de validación + reversión + tests)

### ISSUE-054 — "NO HAY REPARTIDORES DISPONIBLES" visible en checkout sin canal para avisar al usuario
**Actor:** comprador
**Pregunta fallida:** 5 (¿qué hacer si algo falla?)
**Qué ve hoy:** En `/checkout` paso 1 aparece un warning amarillo "NO HAY REPARTIDORES DISPONIBLES / Podés realizar tu compra, pero deberás retirarla personalmente por el local." El selector "ENVÍO A DOMICILIO" queda en gris y se fuerza "RETIRO EN LOCAL".
**Por qué es crítico:** El valor principal de Moovy para el comprador es delivery. Un usuario que viene a pedir cena (-10°C afuera en Ushuaia) encuentra este mensaje en su primer pedido y:
1. No sabe cuándo va a volver a estar disponible el delivery.
2. No hay canal para pedir aviso ("Avisame cuando haya repartidor").
3. No sabe si es algo temporal (11pm, hora valle) o estructural (siempre pasa).
4. La decisión forzada es "retiro en local" — literalmente lo opuesto al producto.

**Qué debería ver:**
- Mensaje más cálido: "Justo ahora no hay repartidores cerca. Estamos coordinando. Esto suele durar menos de 15 minutos."
- Botón "Avisame cuando haya repartidor" → push notification cuando `Driver.isOnline=true` en la zona del user.
- Alternativa "Programar entrega" destacada (para más tarde cuando haya driver).
- "Retiro en local" como 3ra opción, no la única.

**Severidad:** crítico — en ciudad chica, este mensaje en 3 pedidos seguidos hace que el usuario desinstale
**Esfuerzo:** M

## 🟡 IMPORTANTES adicionales

### ISSUE-055 — Breadcrumb del checkout: nombres no describen los pasos y los 3 se ven activos
**Qué ve hoy:** Tabs "Método / Confirmar / Pago" con los 3 subrayados en rojo al mismo tiempo. "Método" cubre método de entrega; "Confirmar" cubre método de pago + tipo de entrega (Inmediata/Programada); "Pago" debería ser el paso final pero nunca llegamos porque al confirmar se creó el pedido.
**Qué debería ver:** 3 tabs con un solo activo por paso: **Entrega** (domicilio/retiro, dirección) → **Pago** (método de pago, puntos a usar, cupón) → **Confirmar** (resumen final con total desglosado y botón de pago). Renombrar y reordenar.
**Severidad:** importante
**Esfuerzo:** M

### ISSUE-056 — Paso "Confirmar" mezcla conceptos (Tipo de entrega dentro de Método de Pago)
**Qué ve hoy:** En el paso 2 "Confirmar", el bloque "Método de Pago" contiene subsecciones: "Tenés 0 puntos", "Tipo de entrega: Inmediata / Programada", "Efectivo", "Mercado Pago". Mezcla dos decisiones distintas.
**Qué debería ver:** "Tipo de entrega (Inmediata/Programada)" pertenece al paso de Entrega (ISSUE-055). "Método de Pago" queda con solo: puntos, cupón, efectivo/MP.
**Severidad:** importante

### ISSUE-057 — Carrito y checkout muestran "Comercio" como etiqueta en vez del nombre real del vendor
**Qué ve hoy:** En `/carrito` y en `/checkout` resumen, el agrupador dice "Comercio" (literal, label genérico) en vez de "La Estancia".
**Qué debería ver:** Nombre real del merchant/seller con su ícono.
**Severidad:** importante (pequeño pero reduce confianza)
**Esfuerzo:** S

### ISSUE-058 — Badge del carrito en header no se sincroniza con el contenido real
**Qué ve hoy:** Después de agregar 1 Coca Cola y luego restar a 1 (o navegar), el badge del header mostraba "3" cuando el carrito tenía "(1)". Eventualmente se sincronizó a "1". Sugiere que el Zustand del carrito tiene dos contadores distintos (agregados vs estado actual) o que el badge no se hidrata del store.
**Qué debería ver:** Badge siempre = `cart.items.reduce((s,i) => s + i.quantity, 0)`.
**Severidad:** importante
**Esfuerzo:** S

### ISSUE-059 — Resumen de checkout no desglosa costo de envío (incluso cuando es $0 por retiro)
**Qué ve hoy:** "Subtotal $1.000 / Total $1.000". No hay línea "Envío: $0 (retiro en local)" ni "Puntos aplicados: 0" ni "Cupón: —". El usuario no ve el desglose que después verá en el email de confirmación o en Mis Pedidos.
**Qué debería ver:** Siempre desglosar: Subtotal, Envío (con valor y método), Descuentos (puntos y cupones si los hay), Total.
**Severidad:** importante (transparencia de precio = valor fundacional de Moovy)
**Esfuerzo:** S

## Ajuste final a la estimación

Con los 8 issues del checkout:

| Categoría | Total issues | Días estimados |
|-----------|-------------|----------------|
| Críticos (13) | 001-008 + UX-033-035 + 052-054 | 9-13 días |
| Importantes (30) | 009-023 + UX-036-047 + 055-059 | 12-17 días |
| Menores (16) | 024-032 + UX-048-051 | 4-6 días post-lanzamiento |
| **Total pre-lanzamiento** | **43** | **21-30 días full** |

**ISSUE-053 es el que más me preocupa**: evidencia viva de que los puntos se regalan sin que el pedido esté entregado. Cada pedido Pendiente que nunca se acepte está regalando 1.000 puntos ($1.000 de pasivo por cada click en Confirmar). Antes de abrir el producto, **correr el query de `PointsTransaction` para confirmar si es type=EARN o type=BONUS_SIGNUP** y priorizar el fix según lo que se encuentre.

---

# Pre-lanzamiento final (última acción antes de abrir)

Decisión tomada 2026-04-17: resolver ISSUE-004 (limpieza de data de prueba) con **reset total de data transaccional preservando reference/seed data**. Esta sección es el paquete operativo que se ejecuta como ÚLTIMO paso del pre-lanzamiento, una vez que todos los críticos de código estén cerrados.

### PL-001 — Reset total de data de usuarios (el día antes del lanzamiento)

**Qué se hace:** Borrar TODA la data transaccional y de usuarios de la DB de producción, preservando solo la configuración del sistema y el admin OPS.

**Qué se preserva (reference + seed data):**
- `MoovyConfig` (timeouts, flags, configuraciones dinámicas)
- `PointsConfig` (earn rates, burn rates, niveles, expiración)
- `StoreSettings` (commission rates, riderCommissionPercent)
- `DeliveryRate` (tarifas por tipo de vehículo, Biblia v3)
- `MerchantLoyaltyConfig` (4 tiers BRONCE/PLATA/ORO/DIAMANTE)
- `Categories` (categorías de productos con scope STORE/MARKETPLACE/BOTH)
- Advertisement packages (4 paquetes con precios)
- Admin OPS del `.env` (única cuenta de usuario preservada, recreada desde `OPS_LOGIN_EMAIL` + `OPS_LOGIN_PASSWORD`)

**Qué se borra (transactional + user data):**
- `User` (excepto admin OPS), `UserRole`
- `Merchant`, `Driver`, `SellerProfile`
- `Product`, `Listing`, `PackagePurchase`
- `Order`, `SubOrder`, `Payment`, `MpWebhookLog`
- `PendingAssignment`, `AssignmentLog`, `DriverLocationHistory`
- `Rating`, `Review`
- `PointsTransaction`, `Referral`, `Favorite`
- `Coupon` (salvo cupones de lanzamiento preconfigurados), `CouponUsage`
- `Notification`, `PushSubscription`
- `SupportTicket`, `SupportMessage`, `ChatMessage`
- `SavedCart`, `AuditLog`

**Cómo ejecutarlo:**
1. Crear `scripts/pre-launch-reset.ts` que:
   - Genere backup comprimido `pre-launch-backup-YYYYMMDD.sql.gz` antes de tocar nada (fallo = abort)
   - Pida confirmación interactiva: escribir literal `RESET-LANZAMIENTO` para avanzar
   - **Guard crítico**: abortar si `NODE_ENV === "production"` **Y** existen >1 usuarios no-admin **Y** hay órdenes DELIVERED reales (protección contra correr esto post-lanzamiento por accidente)
   - Ejecute truncate en orden correcto respetando FKs, o `prisma db push --force-reset` (más simple, drop+recreate schema)
   - Ejecute `prisma/seed-production.ts` para recrear admin + configs + categorías + tarifas
   - Ejecute `npx tsx scripts/validate-ops-config.ts` como validación post-reset
   - Loguee en archivo `pre-launch-reset.log` con timestamp, usuario que lo ejecutó, hash del backup
2. Ejecutar primero en DB **local** contra copia de producción para validar que el flujo funciona
3. Ejecutar en producción el día anterior al lanzamiento (no el mismo día por si algo falla)
4. Mauro loguea como admin OPS y confirma que el panel funciona, las configuraciones están intactas, la DB está limpia
5. Post-reset: el admin OPS no tiene permitido volver a ejecutar este script (el guard lo bloquea automáticamente cuando aparece el primer usuario real con pedido DELIVERED)

**Severidad:** CRÍTICO — última acción antes de abrir. Sin esto, el sitio abre con "Chico lindo $100.000.000", logos posiblemente de marcas ajenas, vendedores "Tienda Prueba", y contadores ficticios.

**Esfuerzo:** 3-4 horas (script + validación local + ejecución supervisada)

### PL-002 — Ambiente de staging separado

**Qué se hace:** Montar un segundo entorno idéntico a producción con una DB separada, para poder probar features nuevas sin tocar los datos reales de usuarios.

**Por qué importa post-lanzamiento:** Una vez que tengamos 1 usuario real con 1 pedido real, **nunca más se puede probar en producción**. Sin staging, las opciones son: (a) probar en prod y romper cosas a usuarios reales, (b) no probar y lanzar features a ciegas. Ambas son inaceptables. Staging es el cinturón de seguridad obligatorio.

**Cómo implementarlo:**
1. Crear una DB PostgreSQL + PostGIS separada en el VPS de Hostinger (o proyecto aparte en Railway/Supabase por ~$10/mes)
2. Duplicar el deploy script de producción a `devmain-staging.ps1` que apunte a otro dominio (ej: `staging.somosmoovy.com`)
3. Configurar MercadoPago con credenciales sandbox en staging (prod usa producción)
4. Configurar subdominio DNS + Nginx vhost separado
5. Variables de entorno separadas: `DATABASE_URL_STAGING`, `NEXT_PUBLIC_APP_URL_STAGING`, etc.
6. Script `scripts/sync-prod-to-staging.ts` que:
   - Copie schema + reference/seed data de prod a staging
   - NO copie data de usuarios reales (privacidad)
   - O alternativamente: copie todo pero corra anonimización (reemplace nombres, emails, DNIs, direcciones por data sintética)
7. Agregar reminder en CLAUDE.md: "toda feature nueva se prueba en staging antes de ir a producción"

**Severidad:** CRÍTICO post-lanzamiento — sin esto no podemos iterar sin romper cosas

**Esfuerzo:** 1 día completo + pruebas

### PL-003 — Backups automáticos diarios con retención

**Qué se hace:** Cron diario que haga `pg_dump` de la DB de producción, comprima, y suba a storage externo. Retención: 30 días diarios, 12 meses mensuales.

**Por qué importa:** Un servidor puede caer, un disco puede romperse, un script mal corrido puede borrar la tabla equivocada. Sin backups probados, un incidente = fin del negocio. En Ushuaia donde todo se sabe, perder el historial de un comercio por un error técnico nos destruye la reputación en 48 horas.

**Cómo implementarlo:**
1. Cron en el VPS a las 3:00 AM diarias: `pg_dump moovy_db | gzip > /backups/moovy-$(date +%Y%m%d).sql.gz`
2. Subir a storage externo (Hostinger tiene storage incluido, o S3/Backblaze B2 por ~$1-5/mes)
3. Retención rolling: 30 días diarios, 12 meses últimos días de cada mes, 3 años últimos días de cada año
4. Script de prueba de restore: `scripts/test-backup-restore.ts` que levante una DB temporal, restaure el backup del día anterior, valide counts de tablas clave, y borre la DB temporal
5. Correr el test de restore **una vez al mes mínimo**: un backup que no probaste es un backup que no tenés
6. Alerta por email si el backup falla 2 días seguidos

**Severidad:** CRÍTICO post-lanzamiento

**Esfuerzo:** 4-6 horas (cron + storage + script de test + primera validación)

### PL-004 — Script de limpieza quirúrgica post-lanzamiento

**Qué se hace:** Reemplazo del `pre-launch-reset.ts` una vez que haya data real. Script genérico que recibe IDs específicos y hace soft-delete preciso de registros, sin tocar lo de al lado.

**Por qué importa:** Inevitablemente aparecerán registros tóxicos: spam de un seller, pedido fraudulento, usuario que pide borrado por Ley de Datos Personales, listing que viola términos. Borrarlos a mano en DB es peligroso (SQL libre = error de 3 caracteres = borrar tabla completa).

**Cómo implementarlo:**
1. `scripts/surgical-cleanup.ts` con subcomandos:
   - `soft-delete-user --id=123 --reason="GDPR request"` → soft-delete user + anonimizar sus datos personales
   - `soft-delete-listing --id=456 --reason="marca registrada"` → soft-delete listing + dejar registro en AuditLog
   - `soft-delete-order --id=789 --reason="fraude confirmado"` → soft-delete + revertir puntos + flag en audit
   - `reset-counters --seller=X` → resetear `timesSold`/`ratings` de un seller específico
2. Todo dentro de `$transaction` con rollback ante cualquier error
3. Todo registra en `AuditLog` con: qué se hizo, por qué, quién lo hizo, cuándo, IDs afectados
4. Dry-run obligatorio por default, requiere `--apply` para ejecutar
5. Export automático de lo afectado a `cleanups/YYYY-MM-DD-HHmmss.json` antes de aplicar (respaldo adicional)

**Severidad:** IMPORTANTE post-lanzamiento

**Esfuerzo:** 1 día

---

**Resumen de la sección Pre-lanzamiento final:**
- PL-001 (reset total) se ejecuta **una sola vez**, el día antes del lanzamiento
- PL-002, PL-003, PL-004 se implementan **dentro de las 2 primeras semanas post-lanzamiento** como parte de la infraestructura permanente
- Después de PL-001 ejecutado, el mismo script queda bloqueado por su propio guard (no se puede volver a correr con usuarios reales adentro)
