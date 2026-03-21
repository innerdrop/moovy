# MOOVY — Reporte de Lanzamiento

**Fecha**: 9 de marzo de 2026
**Branch auditada**: feat/mp-return-fix
**Autor**: Auditoría automática de codebase

---

## PARTE 1 — AUDITORIA DE FLUJOS

### COMPRADOR

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Registro y login | ✅ Funciona | `src/app/(store)/registro/page.tsx`, `src/app/api/auth/register/route.ts`. Credentials provider, bcrypt, rate limiting (5 intentos/15min), JWT 7 dias |
| Buscar y ver productos | ✅ Funciona | `src/app/(store)/productos/page.tsx`. Filtros por categoria y busqueda, ProductCard con imagen/precio/stock |
| Agregar al carrito | ✅ Funciona | `src/store/cart.ts`. Zustand con `groupByVendor()`, soporta products + listings, persistencia en localStorage |
| Checkout | ✅ Funciona | `src/app/(store)/checkout/page.tsx` (853 lineas). 4 pasos: direccion, metodo entrega, pago, revision. Soporta delivery y pickup |
| Pago en efectivo | ✅ Funciona | `src/app/api/orders/route.ts`. Crea orden PENDING, decrementa stock, envia email, notifica via Socket.IO |
| Pago con MercadoPago | ✅ Funciona | Flujo completo: orden → preferencia → redirect MP → polling mp-return → webhook confirma pago. Split payment implementado |
| Ver pedidos e historial | ✅ Funciona | `src/app/(store)/mis-pedidos/page.tsx`. Updates en tiempo real via Socket.IO + polling fallback cada 10s. Mapa de tracking |
| Notificaciones push | ✅ Requiere config | `src/lib/push.ts`, `public/sw.js`. 6 estados configurados (CONFIRMED, PREPARING, READY, IN_DELIVERY, DELIVERED, CANCELLED). Requiere VAPID keys |
| Emails | ✅ Requiere config | `src/lib/email.ts`. Welcome email + confirmacion de orden. Requiere App Password de Gmail |

### COMERCIO

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Registro | ✅ Funciona | `src/app/comercio/registro/page.tsx`, `POST /api/auth/register/merchant`. Recoge datos del negocio + ubicacion. Merchant creado con isActive=false (requiere aprobacion admin) |
| Cargar y gestionar productos | ✅ Funciona | `/comercios/productos/nuevo`, `/comercios/productos/[id]`. Campos: nombre, slug, descripcion, precio, stock, categorias, imagenes multiples, variantes. Upload a WebP optimizado |
| Productos en la tienda | ✅ Funciona | Home page muestra comercios destacados + productos featured. Filtrado por isActive=true |
| Ver y gestionar pedidos | ✅ Funciona | `/comercios/pedidos`. Status flow: PENDING→CONFIRMED→PREPARING→READY. Cancelacion con 10 razones predefinidas. Real-time via Socket.IO |
| Ver ganancias | ⚠️ Basico | Dashboard muestra stats (productos activos, pedidos hoy, ventas mes). NO hay pagina dedicada de ganancias/payouts detallados |
| Notificaciones de pedidos | ✅ Funciona | Socket.IO room `merchant:{id}`. Emision en creacion de orden (cash y MP) |
| MP OAuth (split payment) | ✅ Funciona | `/api/mp/connect?type=merchant` → `/api/mp/callback`. Tokens guardados en Merchant. Split payment con marketplace_fee |

### VENDEDOR INDIVIDUAL

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Activar rol SELLER | ✅ Funciona | `POST /api/auth/activate-seller`. Crea SellerProfile + UserRole. Boton "Ser Vendedor" en perfil, redirige a /vendedor |
| Crear y gestionar Listings | ✅ Funciona | `/vendedor/listings/nuevo`, `/vendedor/listings/[id]`. Campos: titulo, descripcion, precio, stock, condicion (NUEVO/USADO/REACONDICIONADO), categorias, imagenes multiples |
| Listings en Marketplace | ✅ Funciona | `src/app/(store)/marketplace/page.tsx`. Busqueda, filtro por categoria y condicion, paginacion. ListingCard con avatar del vendedor |
| Comprar desde Marketplace | ✅ Funciona | Listings se agregan al mismo carrito que productos. Checkout crea SubOrder por vendedor |
| Ver pedidos | ✅ Funciona | `/vendedor/pedidos`. Muestra SubOrders del seller con status, items, detalles del comprador |
| Ver ganancias | ✅ Funciona | `/vendedor/ganancias`. Muestra: ganancias del mes, mes anterior, total historico, ventas del mes, detalle de pedidos entregados. Comision default 10% |
| MP OAuth (split payment) | ✅ Funciona | `/api/mp/connect?type=seller`. Misma infraestructura que merchants |

### REPARTIDOR

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Solicitar rol DRIVER | ✅ Funciona | `src/app/repartidor/registro/page.tsx`. Formulario 2 pasos: datos personales + vehiculo. Crea User + Driver con isActive=false |
| Admin puede aprobarlo | ✅ Funciona | `/ops/repartidores`. Toggle isActive. API: `PATCH /api/admin/drivers/[id]` |
| Ver pedidos disponibles | ❌ ROTO | Frontend llama `GET /api/driver/orders` — **este endpoint NO EXISTE** |
| Tomar y gestionar pedidos | ❌ ROTO | Frontend llama `POST /api/orders/[id]/accept` — **este endpoint NO EXISTE** |
| Tracking de ubicacion | ✅ Funciona | `PUT /api/driver/location`. PostGIS, optimizado (solo actualiza si movio >10m) |
| Cambio de estado | ✅ Funciona | `PUT /api/driver/status`. Estados: DISPONIBLE, OCUPADO, FUERA_DE_SERVICIO |
| Notificaciones | ⚠️ Incompleto | Infraestructura existe pero depende de endpoints faltantes |

### ADMIN / OPS

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Ver y gestionar pedidos | ✅ Funciona | `/ops/pedidos`. GET/DELETE con backup. Filtros por estado |
| Aprobar repartidores | ✅ Funciona | `/ops/repartidores`. Toggle isActive, eliminar driver |
| Moderar comercios | ✅ Funciona | API `GET/PATCH /api/admin/merchants`. Toggle isVerified, isActive |
| Moderar vendedores/listings | ⚠️ Parcial | API `/api/admin/listings/[id]` existe. Falta UI dedicada de moderacion |
| Analytics | ✅ Funciona | `/ops/analytics`. Metricas por periodo (hoy/semana/mes): pedidos, revenue, usuarios, top merchants/products |

---

## PARTE 2 — BUGS Y PROBLEMAS CRITICOS

### 🔴 BLOQUEANTES

1. **`GET /api/driver/orders` no existe**
   - El frontend del repartidor (`/repartidor/pedidos`) llama a este endpoint para obtener pedidos disponibles, activos e historicos
   - Sin este endpoint los repartidores no pueden ver ningun pedido
   - Archivo que lo llama: `src/app/repartidor/(protected)/pedidos/page.tsx` linea 39

2. **`POST /api/orders/[id]/accept` no existe**
   - El frontend llama a este endpoint cuando un repartidor acepta un pedido
   - Sin esto no hay forma de asignar repartidores a pedidos
   - Archivo que lo llama: `src/app/repartidor/(protected)/pedidos/page.tsx` linea 56

3. **Emails fallan con EAUTH de Gmail**
   - El SMTP_PASS debe ser una App Password de Gmail (16 caracteres), no la contrasena regular
   - Sin emails no hay confirmacion de ordenes ni bienvenida
   - Archivo: `src/lib/email.ts`

### 🟡 IMPORTANTES (no bloquean pero afectan)

4. **Verificacion de roles inconsistente**
   - 60+ instancias usan `(session.user as any).role === "ADMIN"` (patron legacy)
   - Deberia usar `hasAnyRole(session, ["ADMIN"])` de `@/lib/auth-utils`
   - Riesgo: si se migra el campo `User.role` sin actualizar estos 60 archivos, el admin pierde acceso

5. **No existe `.env.example`**
   - Ningun desarrollador nuevo puede configurar el proyecto sin revisar el codigo
   - ~15 variables de entorno requeridas sin documentar

6. **Faltan indices en la base de datos**
   - Solo 5 indices definidos en 623 lineas de schema
   - Faltan indices en: `Order(status)`, `Order(driverId)`, `SubOrder(status)`, `Driver(isOnline)`, `Merchant(ownerId)`, `Merchant(isActive)`
   - Impacto: queries lentas al escalar

7. **Ganancias del comercio son basicas**
   - Solo muestra stats en el dashboard (ventas del mes, pedidos hoy)
   - No hay desglose de comisiones, payouts individuales, ni historial

---

## PARTE 3 — DEUDA TECNICA

| Prioridad | Item | Detalle |
|---|---|---|
| Alta | Legacy `User.role` | Schema tiene `User.role` (string) Y `UserRole[]` (tabla). 60+ rutas API usan el campo legacy en vez de `hasAnyRole()` |
| Alta | `as any` en session | 60+ ocurrencias de `(session.user as any).role`. Falta tipado correcto de la session |
| Media | console.log en produccion | ~25 console.log en codigo de produccion. Deberian ser logs estructurados |
| Media | Sin cache | No hay Redis ni HTTP caching headers. Analytics recalcula en cada request |
| Media | Sin CSRF | No hay proteccion CSRF en formularios |
| Media | Error handling inconsistente | No hay middleware global de errores. Algunos errores de DB se exponen al cliente |
| Baja | SellerProfile sin coordenadas | No tiene lat/long para calculo de delivery. Hardcodeado Ushuaia |
| Baja | Sin .env.example | Variables de entorno no documentadas en archivo de ejemplo |
| Baja | Sin ratings/reviews | Campos existen en schema pero no hay UI para enviar resenas |

---

## PARTE 4 — VEREDICTO STARTUP

### 1. Flujo mas cerca de estar listo

**Comprador + Comercio + Retiro en local (pickup)** es el flujo mas completo. Funciona end-to-end:
- Comprador se registra, navega productos, agrega al carrito
- Hace checkout con pago en efectivo o MercadoPago
- Comercio recibe notificacion en tiempo real, gestiona el pedido
- Comprador ve el estado y recibe email de confirmacion

El marketplace (vendedores) tambien esta operativo pero es un valor agregado, no el core.

### 2. MVP minimo para beta en Ushuaia

**Opcion A — Lanzar YA (solo pickup, sin delivery):**
- ✅ Todo funciona hoy
- ✅ Solo necesita: corregir emails (App Password de Gmail)
- ✅ Registrar 3-5 comercios reales con productos cargados
- ⚠️ Limitacion: no hay delivery, solo retiro en local

**Opcion B — Lanzar con delivery (requiere ~2-3 dias de dev):**
- Implementar `GET /api/driver/orders` (listar pedidos para repartidores)
- Implementar `POST /api/orders/[id]/accept` (aceptar pedido)
- Testing basico del flujo repartidor
- ✅ Todo lo demas ya funciona

**Recomendacion: Opcion B.** El delivery es el diferenciador de MOOVY. 2-3 dias de desarrollo para tener el flujo completo vale la pena.

### 3. Features que se pueden cortar

| Feature | Veredicto | Razon |
|---|---|---|
| Marketplace (vendedores) | Cortar para beta | Es un canal adicional, no el core. Los comercios son la prioridad |
| Puntos MOOVER | Mantener | Ya funciona y es un diferenciador para retencion |
| Split payment MP | Posponer | Arrancar con pagos centralizados (Moovy cobra todo y liquida despues). Requiere menos configuracion |
| Analytics avanzados | Cortar | El admin tiene stats basicos. Dashboards avanzados post-lanzamiento |
| Ratings y reviews | Cortar | No existe aun, no bloquea nada |
| Multi-ciudad | Cortar | Hardcodeado Ushuaia. Escalar despues |

### 4. Riesgos tecnicos antes del lanzamiento

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| MP en produccion | Alta | Alto | Las credenciales TEST- funcionan en sandbox. Credenciales productivas requieren aprobacion de MP (puede demorar dias) |
| SMTP falla en produccion | Media | Alto | Configurar App Password de Gmail o migrar a servicio dedicado (Resend, SendGrid) |
| Base de datos sin indices | Baja (al inicio) | Alto (al escalar) | Agregar indices antes de superar ~1000 ordenes |
| Socket.IO downtime | Media | Medio | Si el server Socket.IO cae, las notificaciones en tiempo real se pierden. Fallback de polling existe |
| Sin backups automaticos | Alta | Critico | Configurar pg_dump automatico o servicio de DB managed |
| Sin rate limiting en APIs | Media | Medio | Solo el login tiene rate limiting. APIs de ordenes podrian ser abusadas |
| 60+ rutas con role legacy | Baja (corto plazo) | Alto (si se migra) | No tocar User.role hasta migrar las 60 rutas |

---

## PARTE 5 — PLAN DE ACCION

### 🔴 Bloqueante — Sin esto NO se lanza

| # | Tarea | Complejidad | Estimacion |
|---|---|---|---|
| 1 | Implementar `GET /api/driver/orders` (listar pedidos disponibles/activos/historico para repartidores) | Media | 4-6h |
| 2 | Implementar `POST /api/orders/[id]/accept` (repartidor toma un pedido) | Media | 3-4h |
| 3 | Corregir emails: configurar App Password de Gmail en SMTP_PASS | Trivial | 15min |
| 4 | Testing end-to-end del flujo repartidor (registro → aprobacion → ver pedidos → aceptar → entregar) | Media | 2-3h |
| 5 | Obtener credenciales productivas de MercadoPago (si se quiere cobrar con MP en la beta) | Externa | 1-5 dias (depende de MP) |

### 🟡 Importante — Afecta la experiencia

| # | Tarea | Complejidad | Estimacion |
|---|---|---|---|
| 6 | Agregar indices a Prisma schema (Order.status, Order.driverId, SubOrder.status, Driver.isOnline, Merchant.isActive) | Baja | 1h |
| 7 | Crear `.env.example` con todas las variables documentadas | Baja | 30min |
| 8 | Dashboard de ganancias detallado para comercios (desglose de comisiones, historial de payouts) | Media | 4-6h |
| 9 | UI de moderacion de sellers/listings para admin | Media | 3-4h |
| 10 | Migrar las 60+ rutas de `session.user.role` a `hasAnyRole()` | Media (repetitiva) | 3-4h |
| 11 | Configurar backups automaticos de PostgreSQL | Baja | 1-2h |

### 🟢 Nice to have — Post-lanzamiento

| # | Tarea | Complejidad | Estimacion |
|---|---|---|---|
| 12 | Sistema de ratings y reviews | Alta | 2-3 dias |
| 13 | Agregar CSRF protection | Media | 2-3h |
| 14 | Reemplazar console.log con logging estructurado (Winston/Pino) | Baja | 2h |
| 15 | Cache layer (Redis) para analytics y datos frecuentes | Media | 4-6h |
| 16 | Soporte multi-ciudad (quitar hardcode de Ushuaia) | Alta | 2-3 dias |
| 17 | App nativa iOS/Android (o PWA mejorada) | Muy Alta | Semanas |
| 18 | Split automatico de pagos MP (Marketplace API) | Alta | 3-5 dias |
| 19 | Coordenadas de ubicacion en SellerProfile | Baja | 1-2h |
| 20 | Tipar correctamente session de NextAuth (eliminar `as any`) | Media | 2-3h |

---

## TIMELINE SUGERIDO PARA BETA

```
Semana 1 (Dias 1-3):
  - [🔴] Implementar endpoints de repartidor (#1, #2)
  - [🔴] Corregir emails (#3)
  - [🔴] Testing flujo repartidor (#4)
  - [🟡] Agregar indices (#6)
  - [🟡] Crear .env.example (#7)

Semana 1 (Dias 4-5):
  - [🔴] Tramitar credenciales MP produccion (#5)
  - [🟡] Migrar role checks (#10)
  - [🟡] Backups automaticos (#11)

Semana 2:
  - Onboarding de 3-5 comercios piloto
  - Onboarding de 2-3 repartidores
  - Testing con usuarios reales (beta cerrada)

Semana 3:
  - Beta abierta en Ushuaia
  - Monitoreo y bug fixes
```

---

*Generado automaticamente por auditoria de codebase — Marzo 2026*
