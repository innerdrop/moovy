# Auditoría Técnica — Moovy
> Fecha: 2026-03-06 | Rama: `feat/revision`

---

## 1. FLUJOS DE USUARIO REALES

### 🟡 Comprador: Registrarse → Login → Compra → Pago → Entrega

| Paso | Estado | Detalle |
|------|--------|---------|
| Registro | ✅ | `/registro` → `POST /api/auth/register` — funcional |
| Login | ✅ | `/login` → NextAuth credentials — funcional |
| Agregar al carrito | ✅ | Zustand store, persiste en localStorage |
| Checkout (pasos 1-3) | ✅ | UI completa: método, dirección, pago |
| Cálculo delivery | ✅ | `POST /api/delivery/calculate` conectado |
| Pago en efectivo | ✅ | Flujo completo → crea Order en DB |
| **Pago con Mercado Pago** | ❌ | **BLOQUEADO** — botón deshabilitado (`disabled`, línea 734 checkout/page.tsx), sin integración real |
| Email confirmación | ✅ | Se dispara en `POST /api/orders` |
| Seguimiento pedido | ✅ | `/mis-pedidos` conectado a `GET /api/orders` |
| Puntos por compra | ✅ | `processOrderPoints()` funcional |

**Veredicto**: El flujo de compra **funciona end-to-end con efectivo**. El flujo de pago digital está bloqueado intencionalmente.

---

### 🟡 Vendedor Individual: Activar → Publicar Listing → Recibir Venta

| Paso | Estado | Detalle |
|------|--------|---------|
| Activar rol seller | ✅ | `POST /api/seller/activate` → crea `SellerProfile` + `UserRole` |
| Acceder a portal `/vendedor` | ✅ | Middleware protege, redirige si no tiene sesión |
| Crear listing | ✅ | `POST /api/seller/listings` — validado, requiere auth |
| Ver listings propios | ✅ | `GET /api/seller/listings` — conectado a UI |
| Subir imágenes | ⚠️ | `POST /api/upload` existe, pero no verifiqué si la UI de listings lo llama |
| **Recibir SubOrder** | ⚠️ | `SubOrder` se crea con `sellerId` en `POST /api/orders`, pero **no hay notificación** al vendedor (solo notifica a merchants y admin via socket) |
| Ver pedidos como vendedor | ✅ | `/vendedor/pedidos` → `GET /api/seller/orders` |
| Ver ganancias | ✅ | `/vendedor/ganancias` — UI existe |

**Veredicto**: El flujo **casi completo**. Falta notificación socket al seller cuando entra una SubOrder.

---

### 🟡 Repartidor: Solicitar Rol → Ser Aprobado → Completar Entrega

| Paso | Estado | Detalle |
|------|--------|---------|
| Solicitar rol DRIVER | ✅ | `POST /api/driver` desde `/mi-perfil` |
| Aprobación por Admin | ✅ | `PUT /api/admin/drivers/[id]/approve` conectado a OPS UI |
| Acceso a `/repartidor` | ✅ | Funcional post-fix de hoy |
| Ver pedidos disponibles | ⚠️ | `GET /api/driver/orders?status=disponibles` — **bug**: usa `session.user.role` (campo legacy string), falla con sistema multi-rol (línea 19, `driver/orders/route.ts`) |
| Aceptar pedido | ✅ | API existe |
| Cambiar estado pedido | ✅ | `PATCH /api/orders/[id]` — múltiples estados |
| Notificación push al comprador | ✅ | Se dispara al cambiar estado en `orders/[id]/route.ts` |
| Historial entregas | ✅ | `GET /api/driver/orders?status=historial` |

**Veredicto**: Flujo **mayormente funcional** pero con bug de rol que impide a drivers multi-rol ver pedidos.

---

### 🟢 Merchant: Registrarse → Procesar Pedido

| Paso | Estado | Detalle |
|------|--------|---------|
| Registro merchant | ✅ | `POST /api/merchant` existe |
| Dashboard pedidos | ✅ | `/comercios/pedidos` → `GET /api/merchant/orders` |
| Cambiar estado pedido | ✅ | Conectado al flujo general de orders |
| **Importar productos (CSV)** | ❌ | UI en `/comercios/checkout/page.tsx` llama `POST /api/merchant/import` — **este endpoint NO EXISTE** |
| Analíticas del comercio | ✅ | Dashboard con métricas |

**Veredicto**: Flujo principal funcional. Endpoint de importación CSV fantasma rompe la página de importación.

---

### 🟢 Admin: Aprobar Driver → Gestionar Pedidos → Analytics

| Paso | Estado | Detalle |
|------|--------|---------|
| Login OPS | ✅ | `/ops/login` funcional |
| Dashboard OPS | ✅ | `GET /api/admin/analytics` — completo, conectado |
| Listar drivers | ✅ | `GET /api/admin/drivers` |
| Aprobar driver | ✅ | `PUT /api/admin/drivers/[id]/approve` + email |
| Crear driver manualmente | ✅ | `POST /api/admin/drivers` funcional |
| Gestionar pedidos | ✅ | `/ops/pedidos` con filtros |
| Moderar sellers | ✅ | `/ops/vendedores` + `GET /api/admin/sellers` |
| Moderar listings | ✅ | `/ops/listings` + `GET /api/admin/listings` |
| Analytics | ✅ | Revenue, órdenes, usuarios, top merchants |

**Veredicto**: El flujo Admin es el **más completo** del sistema.

---

## 2. BLOCKERS

### B1 — API INEXISTENTE llamada desde UI
**Archivo**: `src/app/comercios/(protected)/checkout/page.tsx`, línea 98  
**Llamada**: `POST /api/merchant/import`  
**Endpoint real**: No existe en `src/app/api/merchant/`  
**Impacto**: La página de importación de productos del portal merchant arroja 404.

### B2 — Bug Multi-Rol en Portal Repartidor
**Archivo**: `src/app/api/driver/orders/route.ts`, línea 16-20  
```ts
const role = (session.user as any).role; // ← campo legacy string
if (!["DRIVER", "ADMIN"].includes(role)) { return 403 }
```
**Problema**: Usuarios que activaron DRIVER mediante el sistema multi-rol (`UserRole` table) tienen `role = "USER"` en el campo legacy. El check falla y devuelve 403.  
**Mismo bug en**: `src/app/api/admin/drivers/route.ts` líneas 11 y 43 (usa `role !== "ADMIN"`).

### B3 — Mercado Pago sin Implementar
**Archivo**: `src/app/(store)/checkout/page.tsx`, líneas 725-740  
El botón está visualmente presente pero con `disabled` hardcodeado y sin integración a ningún SDK de MP.  
**Impacto**: Solo se puede pagar en efectivo. Limita severamente la base de usuarios real.

### B4 — Socket no notifica a Sellers
**Archivo**: `src/app/api/orders/route.ts`, líneas 280-316  
El socket solo notifica a **merchants** (`merchant:${group.merchantId}`) y al admin. Los vendedores individuales (`sellerId`) no reciben notificación de nueva SubOrder.  
**Impacto**: Vendedores no se enteran de ventas nuevas en tiempo real.

---

## 3. DEUDA TÉCNICA

### DT1 — Secret hardcodeado en producción (CRÍTICO)
**Archivos**: `orders/route.ts` (×3), `orders/[id]/route.ts` (×3), `logistics/timeout/route.ts`  
```ts
`Bearer ${process.env.CRON_SECRET || "moovy-cron-secret-change-in-production"}`
```
Si `CRON_SECRET` no está en `.env`, el fallback expone el socket server sin seguridad real.

### DT2 — Verificación de rol duplicada e inconsistente
- `proxy.ts` usa `hasAnyRole()` (correcto, lee `roles[]`)
- `api/driver/orders` usa `session.user.role` (legacy)
- `api/admin/*` usa `session.user.role` (legacy)
- `api/admin/analytics` usa `session.user.role` (legacy)

Hay **3 formas distintas** de verificar roles en el mismo proyecto.

### DT3 — `api/delivery/availability` sin autenticación
**Archivo**: `src/app/api/delivery/availability/route.ts`  
Endpoint público que expone cuántos repartidores hay activos. No requiere sesión. Información operacional expuesta innecesariamente.

### DT4 — carpeta `src/app/admin/` huérfana
La carpeta `src/app/admin/` existe con 8 children pero el panel de admin real está en `src/app/ops/`. Revisar si es código muerto.

### DT5 — `src/app/comercio/` vs `src/app/comercios/`
Existen **dos carpetas** con nombres similares: `comercio/` (1 child) y `comercios/` (13 children). La de singular probablemente es un artefacto.

### DT6 — Analytics cuenta usuarios por campo legacy `role`
**Archivo**: `src/app/api/admin/analytics/route.ts`, línea 43  
```ts
prisma.user.count({ where: { role: "CLIENT" } })
```
Con el sistema multi-rol, los nuevos usuarios usan `UserRole` table. Este count es incorrecto para usuarios registrados post-migración.

---

## 4. VEREDICTO FINAL

### ¿Se puede completar una compra real hoy?

**Sí, con efectivo.**  
El flujo comprador → carrito → checkout → confirmación → `mis-pedidos` funciona de punta a punta. El email de confirmación se envía. Los puntos se acreditan.

**No, con Mercado Pago.** El botón está explícitamente deshabilitado.

### Top 3 Issues Críticos

1. **Bug multi-rol en `/api/driver/orders`** — Los repartidores que se registraron con el nuevo sistema no pueden ver pedidos. Bloquea el portal del repartidor para todos los DRIVERs nuevos.

2. **`POST /api/merchant/import` inexistente** — La página de importación de productos de comercios arroja 404. Flujo roto, pendiente de implementación.

3. **Secret hardcodeado en producción** — `"moovy-cron-secret-change-in-production"` en 7 lugares. Si `CRON_SECRET` no está en `.env` de producción, el socket server queda con auth predecible.

### Qué fue construido pero es actualmente inútil

- **Botón Mercado Pago**: UI terminada, sin backend. Ocupa espacio y confunde al usuario.
- **`src/app/admin/`**: Carpeta con código posiblemente huérfano (el admin real está en `/ops`).
- **`src/app/comercio/`** (singular): Un child, probablemente residuo de un refactor.
- **Notificaciones push al seller**: El sistema de push existe (`/api/push/send`), la suscripción funciona, pero los sellers no reciben nada al entrar una nueva venta.

### Qué falta para una beta funcional

| Ítem | Esfuerzo |
|------|----------|
| Fix bug rol en `driver/orders` (usar `hasAnyRole`) | Bajo (1h) |
| Implementar `POST /api/merchant/import` o eliminar UI | Medio (3h) |
| Notificación socket a sellers en nueva SubOrder | Bajo (1h) |
| Mercado Pago integración mínima | Alto (2-3 días) |
| Migrar checks de rol legacy a `hasAnyRole` en todas las APIs | Bajo (2h) |
| Mover `CRON_SECRET` a `.env.example` y documentar | Bajo (30min) |
