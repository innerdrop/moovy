# Rama A1: feat/paginas-legales — Crear 6 páginas legales faltantes

## Context
La auditoría 360° de MOOVY identificó que faltan 6 páginas legales críticas. Se deben crear siguiendo el patrón visual de `src/app/terminos/page.tsx` y `src/app/privacidad/page.tsx`, y agregar links desde mi-perfil.

## Patrón visual (de terminos/page.tsx y privacidad/page.tsx)
- Server component con `export const metadata`
- Imports: `React`, `Link` (next/link), `ArrowLeft` (lucide-react)
- Wrapper: `min-h-screen bg-gray-50 py-12` → `container mx-auto px-4 max-w-4xl`
- Back link con ArrowLeft → `/`, h1 bold, fecha "Última actualización: Marzo 2026"
- Card: `bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8`
- h2: `text-xl font-bold text-gray-900 mb-4`, h3: `font-semibold text-gray-800 mt-4 mb-2`
- Listas: `list-disc list-inside space-y-2 text-gray-600`
- Warning boxes: `bg-red-50 border border-red-200 rounded-xl p-4` o `bg-amber-50`
- Footer copyright, contacto: `legal@somosmoovy.com`, jurisdicción: Ushuaia, TDF, Argentina

## Archivos a crear (6)

1. **`src/app/cookies/page.tsx`** — Política de Cookies (5+ secciones: qué son, cuáles usa MOOVY, de terceros, gestión, cambios, contacto)
2. **`src/app/terminos-vendedor/page.tsx`** — Términos para Vendedores (relación intermediario, comisiones %, obligaciones CUIT/productos, prohibiciones, responsabilidad, cancelaciones, suspensión, ley, contacto)
3. **`src/app/terminos-repartidor/page.tsx`** — Términos para Repartidores (independiente NO empleado, requisitos DNI/licencia/seguro/CUIT, comisiones, responsabilidad transporte, seguro vigente, conducta, suspensión, ley, contacto)
4. **`src/app/terminos-comercio/page.tsx`** — Términos para Comercios (intermediario, requisitos CUIT/habilitación/sanitario, comisiones, SLA timeout, responsabilidad productos, suspensión, ley, contacto)
5. **`src/app/devoluciones/page.tsx`** — Política de Devoluciones (Ley 24.240, cuándo, proceso, plazos 10 días, reembolso MP/MOOVER, no retornables perecederos, contacto)
6. **`src/app/cancelaciones/page.tsx`** — Política de Cancelaciones (comprador antes/después/en camino, vendedor/comercio, penalidades, automáticas timeout, reembolsos, contacto)

## Archivo a modificar

**`src/app/(store)/mi-perfil/page.tsx`** — En sección "Configuración y Ayuda" (después del link "Términos y Condiciones" en línea ~404), agregar links a:
- Política de Privacidad → `/privacidad`
- Política de Cookies → `/cookies`
- Devoluciones y Reembolsos → `/devoluciones`

Mismos iconos/estilo que los links existentes (FileText/Shield, bg-gray-50 text-gray-600). NO tocar otras secciones.

## Verificación
- `npx tsc --noEmit`
- Listar archivos creados/modificados

---
# AUDITORÍA 360° COMPLETA (referencia)

## 1.1 Resumen de Inventario
| Portal | Páginas | API Routes | Bottom Nav |
|--------|---------|------------|------------|
| Store (/) | 23 | ~40 | 5 tabs |
| Driver (/repartidor) | 8 | ~15 | 4 tabs |
| Merchant (/comercios) | 11 | ~12 | 6 tabs |
| Seller (/vendedor) | 7 | ~8 | 5 tabs |
| Ops (/ops) | 24 | ~25 | Sidebar |
| Públicas | 18 | ~22 | N/A |
| **Total** | **78** | **122** | — |

## 1.2 Rutas que existen en código pero NO tienen link desde la UI

| Ruta | Archivo | Severidad | Descripción |
|------|---------|-----------|-------------|
| `/landing` | `src/app/landing/page.tsx` | WARNING | Landing page alternativa, no linkeada desde ningún nav. Solo accesible por URL directa |
| `/moovyx` | `src/app/moovyx/page.tsx` | MINOR | Página MOOVYX (coming soon), slide en landing dice "PRÓXIMAMENTE" pero no hay link directo claro |
| `/moover` | `src/app/moover/page.tsx` | WARNING | Programa MOOVER, accesible solo si sabés la URL. El BottomNav va a `/puntos`, no a `/moover` |
| `/contacto` | `src/app/contacto/page.tsx` | MINOR | Página de contacto, posiblemente linkeada desde footer pero no verificado en nav principal |
| `/nosotros` | `src/app/nosotros/page.tsx` | MINOR | Página "Sobre Nosotros", no en nav principal |
| `/mantenimiento` | `src/app/mantenimiento/page.tsx` | MINOR | Página de mantenimiento dedicada (con API fetch), pero el homepage usa su propio MaintenanceView inline |
| `/seguimiento/[orderId]` | `src/app/seguimiento/[orderId]/page.tsx` | OK | Se accede desde link en detalle de pedido — funciona |
| `/repartidor/pedidos` | `repartidor/(protected)/pedidos/page.tsx` | WARNING | Existe como página separada pero NO está en el RiderBottomNav (4 tabs: Dashboard, Ganancias, Historial, Perfil) |
| `/repartidor/soporte` | `repartidor/(protected)/soporte/page.tsx` | WARNING | No en BottomNav del driver |

## 1.3 Links/Botones que apuntan a rutas potencialmente problemáticas

| Origen | Destino | Severidad | Problema |
|--------|---------|-----------|---------|
| Driver registro L536 | `/terminos` | WARNING | Link dice "términos y condiciones para repartidores" pero apunta a los términos generales. No existen términos específicos para repartidores |
| BottomNav centro | `/puntos` | MINOR | El botón "MOOVER" va a `/puntos` que es la página de puntos, no la explicación del programa (`/moover`) |

## 1.4 Portales o secciones vacías/placeholder

| Sección | Archivo | Severidad | Estado |
|---------|---------|-----------|--------|
| `/ops/moderacion` | `ops/(protected)/moderacion/page.tsx` | WARNING | Necesita verificación de contenido real |
| `/ops/live` | `ops/(protected)/live/page.tsx` | WARNING | Live tracking — verificar si tiene contenido funcional |

## 1.5 Bottom Navigation — Detalle por Portal

### Store BottomNav (`src/components/layout/BottomNav.tsx`)
| # | Label | Icono | Destino | Existe | Nota |
|---|-------|-------|---------|--------|------|
| 1 | Inicio | Home | `/tienda` | Si | OK |
| 2 | Buscar | Search | `/buscar` | Si | OK |
| 3 | MOOVER | Star (centro, dorado) | `/puntos` | Si | Animación pulse, sparkles. El nombre "MOOVER" lleva a puntos, no al programa |
| 4 | Pedidos | Package | `/mis-pedidos` | Si | Requiere auth, modal si no logueado |
| 5 | Perfil | User/LogIn | `/mi-perfil` o `/login` | Si | Cambia según auth |

**Problema**: No hay tab de Marketplace en el BottomNav. El marketplace solo es accesible desde la homepage o URL directa.

### Driver RiderBottomNav (`src/components/rider/RiderBottomNav.tsx`)
| # | Label | Icono | Destino | Existe |
|---|-------|-------|---------|--------|
| 1 | Inicio | Home | Dashboard | Si |
| 2 | Ganancias | Wallet | Earnings | Si |
| 3 | Historial | History | History | Si |
| 4 | Perfil | User | Profile | Si |

**Problema**: No hay tab de Pedidos ni Soporte en el nav.

### Merchant Bottom Nav (inline en layout.tsx)
| # | Label | Icono | Destino | Existe |
|---|-------|-------|---------|--------|
| 1 | Inicio | LayoutDashboard | / | Si |
| 2 | Pedidos | ShoppingCart | /pedidos | Si |
| 3 | Productos | Package | /productos | Si |
| 4 | Paquetes | Store | /adquirir-paquetes | Si |
| 5 | Soporte | SupportNavBadge | /soporte | Si |
| 6 | Ajustes | Settings | /configuracion | Si |

### Seller Bottom Nav (inline en layout.tsx)
| # | Label | Icono | Destino | Existe |
|---|-------|-------|---------|--------|
| 1 | Dashboard | LayoutDashboard | / | Si |
| 2 | Mis Listings | Tag | /listings | Si |
| 3 | Mis Ventas | ShoppingCart | /pedidos | Si |
| 4 | Ganancias | DollarSign | /ganancias | Si |
| 5 | Configuración | Settings | /configuracion | Si |

**Score Part 1: 7/10** — Inventario sólido pero hay rutas huérfanas y el marketplace no está en el nav principal.

---

# PART 2 — AUDITORÍA DE FLUJOS DE USUARIO

## FLOW 1 — Cliente nuevo, primera compra

| Paso | Estado | Detalle |
|------|--------|---------|
| Homepage | **BLOQUEADO EN PROD** | `IS_MAINTENANCE_MODE = process.env.NODE_ENV === "production"` en `(store)/page.tsx:23`. La tienda muestra "VOLVEMOS PRONTO" en producción |
| Explorar productos | OK | Categorías, merchants, productos featured |
| Detalle de producto | OK | `/productos/[slug]` con imágenes, precio, agregar al carrito |
| Agregar al carrito | OK | Zustand store, CartSidebar, FloatingCartButton |
| Carrito | OK | `/carrito` con empty state ("Tu carrito está vacío" + CTA) |
| Checkout | OK | Multi-step: dirección → delivery → puntos → pago |
| Pago MP | PARCIAL | Solo sandbox (TEST- keys). Checkout Pro redirect + callback |
| Confirmación pedido | OK | Redirect a `/mis-pedidos` |
| Tracking | OK | `/seguimiento/[orderId]` con Google Maps + WebSocket |
| Delivery recibido | OK | Push notification "Pedido entregado" |
| Calificar | OK | RateMerchantModal + RateSellerModal + RateDriverModal (1-5 estrellas + comentario) |

### CRITICAL Issues:
1. **`IS_MAINTENANCE_MODE = process.env.NODE_ENV === "production"`** — La tienda está BLOQUEADA en producción. Esto es un BLOCKER absoluto. Archivo: `src/app/(store)/page.tsx:23`
2. **No hay botón "Atrás" consistente** en el checkout — el usuario no puede volver atrás paso a paso
3. **No hay página de confirmación de pedido dedicada** — redirige a la lista de pedidos

### WARNING Issues:
4. Checkout usa `alert()` para errores en vez de toast
5. El pedido activo se muestra en el header con polling cada 30s — funciona pero el popup de pedido activo podría ser más prominente
6. No hay way to cancel an order from the customer side

## FLOW 2 — Nuevo vendedor, primera venta

| Paso | Estado | Detalle |
|------|--------|---------|
| Perfil → "Quiero vender" | OK | Botón en `/mi-perfil` sección "Oportunidades MOOVY" |
| Activación | PARCIAL | Un click activa seller role via `/api/auth/activate-seller`. NO hay onboarding |
| Completar perfil vendedor | PARCIAL | `/vendedor/configuracion` tiene displayName, bio, preparationMinutes |
| Listar primer producto | OK | `/vendedor/listings/nuevo` con NewListingForm |
| Abrir tienda | OK | AvailabilityToggle (online/offline/pausa) |
| Recibir pedido | OK | Socket.IO notificación en real-time |
| Confirmar pedido | OK | Desde `/vendedor/pedidos` |

### CRITICAL Issues:
1. **No hay onboarding para vendedores** — se activa el rol con un click sin recopilar NINGÚN dato (ni CUIT, ni declaración jurada, ni nada). Esto es un problema legal serio.
2. **No hay términos específicos para vendedores marketplace** que el vendedor deba aceptar antes de vender.

### WARNING Issues:
3. El seller dashboard no tiene guía de "primeros pasos" — un vendedor nuevo llega a un dashboard con stats en 0 sin saber qué hacer
4. No se verifica identidad del vendedor de ninguna forma

## FLOW 3 — Nuevo repartidor, primera entrega

| Paso | Estado | Detalle |
|------|--------|---------|
| Registro | OK | `/repartidor/registro` — 2 pasos: datos personales + vehículo |
| Datos recopilados | PARCIAL | Nombre, DNI, email, teléfono, vehículo (marca/modelo/año/color/patente), checkbox licencia + términos |
| Verificación | PENDIENTE | Post-registro dice "Verificación de documentos" pero NO hay upload de documentos |
| Dashboard | OK | `/repartidor/dashboard` con mapa, geolocalización, bottom sheet |
| Online/Offline | OK | Toggle prominente en dashboard |
| Recibir oferta | OK | Socket.IO `new_delivery_offer` con detalles completos |
| Aceptar/Rechazar | OK | `driverAcceptOrder` / `driverRejectOrder` con race-condition prevention |
| Navegar a merchant | PARCIAL | Mapa muestra ubicación pero no integración con Google Maps navigation |
| Marcar entregado | OK | Status update via API |
| Ver ganancias | OK | `/repartidor/ganancias` |

### CRITICAL Issues:
1. **No hay upload de documentos** — el registro dice "verificación" pero no sube licencia, seguro, VTV, ni foto de DNI. Todo se hace "offline" fuera de la app.
2. **No se recopila CUIT** del repartidor — obligatorio para cobrar como monotributista
3. **No se verifica seguro del vehículo** — obligatorio por ley argentina
4. **El formulario NO distingue entre bicicleta y motorizado** — `vehicleType` default es "auto" pero bicicleta no necesita licencia ni patente

### WARNING Issues:
5. `vehicleType` está hardcodeado a "auto" en el state inicial — no hay selector visible de tipo de vehículo (bici/moto/auto/camión) en el formulario
6. No hay integración de navegación GPS (abrir Google Maps/Waze)
7. No hay way to report a problem with a delivery

## FLOW 4 — Comercio recibiendo pedidos

| Paso | Estado | Detalle |
|------|--------|---------|
| Dashboard | OK | Stats: productos activos, pedidos hoy, ventas mes, pendientes |
| Alerta pedido nuevo | OK | Socket.IO + potencial push |
| Ver detalle pedido | OK | `/comercios/pedidos` |
| Confirmar en 3 min | PARCIAL | merchant-timeout cron existe (configurable, default 5 min), pero no hay countdown visual en la UI del merchant |
| Marcar listo | OK | API `/merchant/orders/[id]/ready` |
| Ver driver asignado | PARCIAL | Depende de assignment engine — si no hay driver, no hay feedback claro al merchant |
| Pedido entregado | OK | Status update via socket |

### WARNING Issues:
1. **No hay sonido de alerta** para pedidos nuevos en el portal del comercio
2. **No hay countdown visual** del timeout de confirmación — el merchant no sabe cuánto tiempo le queda
3. Si no hay driver disponible después de agotar intentos (`order_unassignable` event), no hay UI clara para el merchant

## FLOW 5 — Entrega programada

| Paso | Estado | Detalle |
|------|--------|---------|
| UI de selección de horario | OK | TimeSlotPicker en checkout |
| Pago | OK | Mismo flow de checkout |
| Notificación al vendedor 30 min antes | OK | Cron `scheduled-notify` (configurable, default 30 min) |
| Vendedor confirma | OK | Via API |
| Auto-cancelación si no confirma | OK | Cron cancela después de N min (default 10) |
| Asignación de driver 45 min antes | OK | Cron trigger hardcodeado a 45 min |
| Delivery | OK | Mismo flow |

### WARNING Issues:
1. El trigger de 45 minutos antes para asignación está hardcodeado (no en MoovyConfig)
2. No está claro si el vendedor ve los pedidos programados separados de los inmediatos en su dashboard

## FLOW 6 — Operador OPS configurando el sistema

| Paso | Estado | Detalle |
|------|--------|---------|
| `/ops/configuracion-logistica` | OK | 3 secciones: Global Config, Package Categories, Delivery Rates |
| Cambiar timeout driver | OK | Desde MoovyConfig, leído en runtime |
| Cambiar tarifas delivery | OK | Per-category rates (base + per-km) |
| Cambiar comisiones | OK | seller_commission_pct, driver_commission_pct en MoovyConfig |
| Feedback de guardado | VERIFICAR | Necesita toast/feedback visual al guardar |

### WARNING Issues:
1. Algunos valores aún tienen fallbacks hardcodeados en código (rating radius 300m, PostGIS 50km, grace window 10s) — deberían ser configurables
2. No hay audit log de cambios de configuración

**Score Part 2: 5/10** — Los flujos básicos funcionan pero hay gaps críticos en onboarding, verificación de documentos, y la tienda está bloqueada en producción.

---

# PART 3 — AUDITORÍA DE CONTENIDO PÁGINA POR PÁGINA

## 3a. Empty States

| Página | Empty State | Calidad | Mejora necesaria |
|--------|------------|---------|------------------|
| Carrito (`/carrito`) | "Tu carrito está vacío" + CTA "Ver Productos" | BUENO | OK |
| Mis Pedidos (`/mis-pedidos`) | "Debes iniciar sesión" (sin auth) | BUENO | OK para no-auth |
| Mis Pedidos (sin pedidos) | No verificado | WARNING | Necesita mensaje motivante + CTA |
| Favoritos (sin favoritos) | No verificado | WARNING | Necesita CTA |
| Canjes MOOVER (sin canjes) | "Aún no tenés canjes" + "Usá tus puntos MOOVER" + CTA "Ir a la tienda" | BUENO | OK |
| Driver dashboard (sin pedidos) | No verificado en detalle | WARNING | Debería decir "No hay pedidos disponibles. ¡Mantené la app abierta!" |
| Seller dashboard (sin listings) | Muestra stats en 0 | WARNING | Necesita guía de primeros pasos |
| Merchant (sin productos) | No verificado | WARNING | Necesita CTA para crear primer producto |

## 3b. Loading States

| Patrón | Uso | Calidad |
|--------|-----|---------|
| Loader2 spinner (animate-spin) | Mis Pedidos, Order Detail, Checkout | ACEPTABLE |
| Skeleton loaders | Solo en mapa de tracking (BottomSheet) | WARNING — Deberían usarse más |
| Loading overlays con backdrop | Checkout submit | OK |

**WARNING**: No hay skeleton loaders en las páginas principales (homepage, marketplace, merchant cards). Todo es spinner genérico.

## 3c. Error States

| Patrón | Uso | Calidad |
|--------|-----|---------|
| `alert()` nativo | Perfil (activar rol), checkout errores, reorder | MALO — No usar alert() en app móvil moderna |
| Red error banner | Registro driver/merchant, formularios | BUENO |
| XCircle + mensaje | Order not found | BUENO |
| Catch silencioso | Homepage data fetching, header active orders | WARNING — Errores no se muestran |

**CRITICAL**: No hay `error.tsx` ni `not-found.tsx` en ninguna ruta. Un error no capturado crashea silenciosamente.

## 3d. Copy y Texto

### Texto en inglés que debería estar en español:
- No se encontraron instancias significativas de texto en inglés en la UI (buen trabajo de localización)

### Placeholder/TODO/Coming Soon:
- `MerchantCard.tsx:50`: Comentario `{/* Image placeholder or real image */}` — solo comentario, no visible al usuario
- `NewListingForm.tsx:67`: `body: JSON.stringify({})` con comentario "placeholder; images handled separately" — solo código interno
- Landing page slide "MOOVY X": Dice "PRÓXIMAMENTE" — intencional

### Botones claros y orientados a la acción:
- "Enviar Solicitud" (registro) — OK
- "Confirmar pedido" (checkout) — VERIFICAR texto exacto
- "Aceptar" (driver acepta pedido) — OK
- "Ver Productos" (carrito vacío) — OK

### Tono:
- Consistente, amigable, usa voseo ("Registrate", "Ingresá") — apropiado para Argentina
- "Hecho con ❤️ en Ushuaia" en footer de perfil — buen toque local

## 3e. Missing Content

| Sección | Estado | Severidad |
|---------|--------|-----------|
| Política de Cookies | NO EXISTE | CRITICAL (legal) |
| Términos para Vendedores | NO EXISTE | CRITICAL (legal) |
| Términos para Repartidores | NO EXISTE | CRITICAL (legal) |
| Términos para Comercios | NO EXISTE | CRITICAL (legal) |
| Política de Devoluciones | NO EXISTE | CRITICAL (legal) |
| Política de Cancelaciones | NO EXISTE | CRITICAL (legal) |

**Score Part 3: 5/10** — Copy y tono son buenos, pero faltan páginas legales críticas, no hay error boundaries, y los empty states son genéricos.

---

# PART 4 — NAVEGACIÓN E INFORMACIÓN ARQUITECTÓNICA

## 4a. Bottom Navigation (Mobile)

### Store: 5 tabs
Análisis detallado en Part 1. **Problema principal**: El Marketplace NO es accesible desde el BottomNav. Para un app que es "Amazon + Rappi" el marketplace debería ser tab principal.

**Recomendación como experto UX startup**:
```
Propuesta de BottomNav óptimo para MOOVY:
1. Tienda (Home) → /tienda
2. Marketplace (ShoppingCart) → /marketplace  ← AGREGAR
3. MOOVER (Star, centro) → /puntos
4. Pedidos (Package) → /mis-pedidos
5. Perfil (User) → /mi-perfil
```
Quitar "Buscar" del nav (integrarlo como search bar en cada sección) y agregar Marketplace.

## 4b. Header / Top Navigation

**Mobile Header** (`AppHeader.tsx`):
- Izquierda: Avatar + nombre (si logueado) o "Ushuaia" con pin
- Centro: Logo MOOVY
- Derecha: Puntos MOOVER badge + Carrito con contador

**MISSING**:
- **No hay icono de notificaciones/campana** — CRITICAL para una app de delivery
- **No hay link al marketplace** en el header
- **No hay breadcrumb** en pages interiores

## 4c. Página de Perfil (`/mi-perfil`)

**Secciones**:
1. **Mi Cuenta**: Datos Personales, Direcciones, Favoritos — OK
2. **Mis Portales**: Links condicionales a Vendedor, Repartidor, Comercio, Ops — OK, bien implementado
3. **Oportunidades MOOVY**: Registrar Comercio, Quiero Vender, Quiero ser Repartidor — OK
4. **Configuración y Ayuda**: Push notifications toggle, Centro de Ayuda, Términos — OK
5. **Logout**: Botón prominente — OK

**MISSING**:
- **No hay link a Cambiar Contraseña** desde la sección Mi Cuenta (la página `/mi-perfil/cambiar-password` existe pero no está linkeada)
- **No hay link a Política de Privacidad** en la sección de configuración
- **No hay link a "Mis Pedidos"** en el perfil (solo accesible desde BottomNav)

## 4d. Deep Linking

- **Compartir producto**: Los productos tienen URL `/productos/[slug]` — deberían ser compartibles. No hay botón de compartir visible.
- **Notificación → Pedido**: Push notifications usan URL `/mis-pedidos` (la lista), NO deep-link al pedido específico
- **Tracking link**: `/seguimiento/[orderId]` funciona como deep link — OK

**Score Part 4: 5/10** — Navegación funcional pero le falta campana de notificaciones, marketplace en nav, deep-linking a pedidos específicos, y link a cambiar contraseña.

---

# PART 5 — AUDITORÍA DE DASHBOARDS

## MERCHANT DASHBOARD (/comercios)

### Lo que existe:
- Dashboard con stats (productos activos, pedidos hoy, ventas mes, pendientes)
- Gestión de pedidos (`/comercios/pedidos`)
- Gestión de productos (`/comercios/productos` + nuevo + editar)
- Paquetes de publicación (`/comercios/adquirir-paquetes`)
- Configuración (`/comercios/configuracion`)
- Soporte (`/comercios/soporte`)

### Lo que FALTA vs lo que necesita un comercio real:
| Feature | Estado | Severidad |
|---------|--------|-----------|
| Resumen de pedidos del día (conteo, revenue, pendientes) | EXISTE (dashboard) | OK |
| Historial de pedidos con filtros | EXISTE (/pedidos) | OK |
| Gestión de productos (CRUD) | EXISTE (/productos) | OK |
| Horarios del comercio | NO EXISTE | WARNING |
| Perfil del comercio (nombre, dirección, foto, descripción) | PARCIAL (configuracion) | WARNING |
| Historial de pagos y desglose de comisiones | NO EXISTE | WARNING |
| Rating y reviews recibidos | NO EXISTE en dashboard | WARNING |
| Preferencias de notificación | NO EXISTE | MINOR |
| Analytics (pedidos/día, productos más vendidos) | NO EXISTE | MINOR |
| Countdown de timeout de confirmación | NO EXISTE | WARNING |
| Sonido de alerta para pedidos nuevos | NO EXISTE | WARNING |

## DRIVER DASHBOARD (/repartidor)

### Lo que existe:
- Dashboard con mapa y geolocalización
- Toggle online/offline
- Bottom sheet con detalles de pedido
- Ganancias (`/repartidor/ganancias`)
- Historial (`/repartidor/historial`)
- Perfil (`/repartidor/perfil`)
- Soporte (`/repartidor/soporte`)

### Lo que FALTA vs lo que necesita un repartidor profesional:
| Feature | Estado | Severidad |
|---------|--------|-----------|
| Ganancias hoy/semana/mes | EXISTE (/ganancias) | OK |
| Toggle online/offline prominente | EXISTE (dashboard) | OK |
| Pedido activo con mapa | EXISTE (dashboard bottom sheet) | OK |
| Historial de pedidos | EXISTE (/historial) | OK |
| Rating recibido | NO VERIFICADO en /perfil | WARNING |
| Tipo de vehículo configurable | NO EN UI | CRITICAL — Solo se setea en registro |
| Schedule de disponibilidad | NO EXISTE | MINOR |
| Reportar problema con entrega | NO EXISTE | WARNING |
| Navegación integrada (abrir Maps/Waze) | NO EXISTE | WARNING |
| Contactar al cliente | NO VERIFICADO | WARNING |

**Score Part 5: 6/10** — Dashboards funcionales con las features core, pero faltan features operacionales importantes (horarios, analytics, ratings, navegación GPS).

---

# PART 6 — AUDITORÍA PORTAL VENDEDOR (/vendedor)

| Feature | Estado | Detalle |
|---------|--------|---------|
| Accesible desde perfil | SI | Link en "Mis Portales" si tiene rol SELLER |
| Toggle online/offline | SI | AvailabilityToggle component (online/offline/pausa) |
| Tiempo de preparación | SI | En AvailabilityToggle y configuración |
| Schedule recurrente | PARCIAL | `scheduleEnabled` y `scheduleJson` en schema, verificar UI |
| Pedidos en tiempo real | SI | `/vendedor/pedidos` con Socket.IO |
| Pedidos programados separados | NO VERIFICADO | Los pedidos podrían no estar filtrados por tipo |
| Gestión de listings | SI | `/vendedor/listings` + nuevo + editar |
| Desglose ganancias/comisiones | EXISTE | `/vendedor/ganancias` |
| Pausar tienda temporalmente | SI | Pausa con countdown en AvailabilityToggle |
| Onboarding guiado | NO | Solo activación con un click, sin wizard |

**Score Part 6: 6/10** — Portal funcional pero sin onboarding y sin verificación de identidad.

---

# PART 7 — AUDITORÍA DE CONECTIVIDAD TÉCNICA

## 7a. API Endpoints sin UI

| Endpoint | Estado |
|----------|--------|
| `GET /api/referrals` | Existe pero sin página de referidos en la UI |
| `GET /api/moover/gift` | Existe pero sin UI de regalo MOOVER |
| `GET /api/moover/friends` | Existe pero sin UI de amigos MOOVER |
| `POST /api/moovyx/register` | Existe pero MOOVYX es "coming soon" |
| `GET /api/debug-session` | Dev only — OK |
| `GET /api/debug-cookies` | Dev only — OK |

## 7b. Socket.IO Events — Emisión vs Escucha

| Evento | Emitido | Escuchado | Estado |
|--------|---------|-----------|--------|
| `new_delivery_offer` | assignment-engine | driver dashboard | OK |
| `order_status_changed` | merchant confirm/ready | mis-pedidos (useRealtimeOrders) | OK |
| `assignment_started` | assignment-engine | admin:orders | OK |
| `order_cancelled` | merchant-timeout, scheduled-notify | customer, admin | OK |
| `order_unassignable` | assignment-engine | admin:orders | WARNING — No UI visible para merchant |
| `scheduled_order_reminder` | scheduled-notify | seller/merchant | VERIFICAR — Necesita listener en portales |

## 7c. MoovyConfig — Hardcodeados vs DB

| Valor | Fuente | Estado |
|-------|--------|--------|
| Driver response timeout | MoovyConfig (fallback 20s) | OK |
| Merchant confirm timeout | MoovyConfig (fallback 300s) | OK |
| Scheduled notify before | MoovyConfig (fallback 30min) | OK |
| Scheduled cancel if no confirm | MoovyConfig (fallback 10min) | OK |
| Max assignment attempts | MoovyConfig (fallback 5) | OK |
| Assignment rating radius | MoovyConfig (fallback 300m) | OK |
| **Scheduled pre-assignment trigger** | **HARDCODEADO 45 min** | **WARNING** |
| **Score thresholds (MICRO/SMALL/etc)** | **HARDCODEADO** | **MINOR** |
| **PostGIS search radius** | **HARDCODEADO 50km** | **MINOR** |
| **Grace window** | **HARDCODEADO 10s** | **MINOR** |

## 7d. Cron Endpoints — Seguridad

| Endpoint | CRON_SECRET | Existe | vercel.json |
|----------|-------------|--------|-------------|
| `/api/cron/assignment-tick` | SI | SI | **NO** — No hay vercel.json |
| `/api/cron/merchant-timeout` | SI | SI | **NO** |
| `/api/cron/scheduled-notify` | SI | SI | **NO** |
| `/api/cron/seller-resume` | SI | SI | **NO** |

**CRITICAL**: No existe `vercel.json` — los crons no se ejecutarán automáticamente en Vercel. Necesitan un scheduler externo o vercel.json config.

## 7e. Protección de Roles

- Todos los endpoints admin usan `hasAnyRole(session, ["ADMIN"])` — OK
- Todos los endpoints merchant/driver/seller verifican roles — OK
- **Legacy pattern**: `src/app/comercios/(protected)/layout.tsx:21` usa `(session.user as any).role` — funciona con fallback pero debería migrar
- **No hay rate limiting** visible en ningún endpoint API

**Score Part 7: 7/10** — Buena conectividad técnica, pero falta vercel.json para crons y hay valores hardcodeados.

---

# PART 8 — AUDITORÍA DE COMPLIANCE LEGAL (Argentina / Tierra del Fuego)

## 8A. Páginas Legales

| Página | Existe | Contenido Real | Severidad si falta |
|--------|--------|---------------|-------------------|
| Términos y Condiciones generales | SI (`/terminos`) | SI, 12 secciones, actualizado Ene 2026 | — |
| Política de Privacidad | SI (`/privacidad`) | SI, 11 secciones, menciona ARCO y Ley 25.326 | — |
| Términos MOOVER | SI (`/terminos-moover`) | SI, términos del programa de puntos | — |
| **Política de Cookies** | **NO** | — | **CRITICAL** — Requerido por buenas prácticas y GDPR-like compliance |
| **Términos para Vendedores Marketplace** | **NO** | — | **CRITICAL** — Responsabilidades, comisiones, prohibiciones |
| **Términos para Repartidores** | **NO** | — | **CRITICAL** — Relación contractual, seguro, responsabilidad |
| **Términos para Comercios** | **NO** | — | **CRITICAL** — Comisiones, SLA, obligaciones |
| **Política de Devoluciones/Reembolsos** | **NO** | — | **CRITICAL** — Ley defensa del consumidor (24.240) requiere esto |
| **Política de Cancelaciones** | **NO** | — | **CRITICAL** — Cuándo puede cancelar cada parte |

## 8B. Requisitos Legales para Comercios

| Requisito | Recopilado en Registro | Obligatorio | Severidad |
|-----------|----------------------|-------------|-----------|
| Nombre del comercio | SI | SI | OK |
| Nombre del titular | SI | SI | OK |
| Email | SI | SI | OK |
| Teléfono | SI | SI | OK |
| Dirección con geoloc | SI | SI | OK |
| Tipo de negocio | SI | SI | OK |
| **CUIT/CUIL** | **NO** | **SI** (obligatorio para actividad comercial) | **CRITICAL** |
| **Constancia AFIP** (monotributo/RI) | **NO** | **SI** | **CRITICAL** |
| **Habilitación municipal Ushuaia** | **NO** | **SI** (para alimentos: bromatológica) | **CRITICAL** |
| **CBU/Alias para pagos** | **NO** | **SI** (para split payments MP) | **CRITICAL** |
| **Registro sanitario TDF** | **NO** | **SI** (alimentos) | **CRITICAL** |
| **Seguro responsabilidad civil** | **NO** | Recomendado | **WARNING** |

**El formulario de registro de comercio solo recopila datos básicos de contacto. NO recopila NINGÚN dato legal/fiscal.**

## 8C. Requisitos Legales para Vendedores Marketplace

| Requisito | Recopilado | Obligatorio | Severidad |
|-----------|-----------|-------------|-----------|
| **CUIT/CUIL** | **NO** | **SI** (para ventas habituales, monotributo) | **CRITICAL** |
| **Declaración jurada de veracidad** | **NO** | Recomendado | **WARNING** |
| **Aceptación de términos de vendedor** | **NO** (no existen) | **SI** | **CRITICAL** |
| **Prohibición productos ilegales/falsificados** | **NO** (en TyC pero no en onboarding) | **SI** | **WARNING** |

**El onboarding de vendedor es literalmente un botón "Quiero vender" → rol activado. CERO verificación.**

Nota: AFIP permite ventas ocasionales sin monotributo bajo cierto monto, pero ventas habituales requieren inscripción. MOOVY debería al menos recopilar CUIT y una declaración de responsabilidad.

## 8D. Requisitos Legales para Repartidores

| Requisito | Recopilado | Obligatorio | Severidad |
|-----------|-----------|-------------|-----------|
| Nombre completo | SI | SI | OK |
| DNI | SI | SI | OK |
| Email y teléfono | SI | SI | OK |
| Datos del vehículo | SI | SI | OK |
| Patente | SI | SI (motorizado) | OK |
| Checkbox "Tengo licencia vigente" | SI (checkbox) | SI (motorizado) | PARCIAL — No se sube copia |
| **Upload de licencia de conducir** | **NO** | **SI** | **CRITICAL** |
| **Upload de seguro del vehículo** | **NO** | **SI** (obligatorio Ley 24.449) | **CRITICAL** |
| **VTV (Verificación Técnica Vehicular)** | **NO** | **SI** (motorizado) | **CRITICAL** |
| **CUIT/CUIL** | **NO** | **SI** (para cobrar) | **CRITICAL** |
| **Foto de DNI (frente/dorso)** | **NO** | Recomendado (verificación) | **WARNING** |
| **Habilitación transporte de carga** | **NO** | SI (camión/flete) | **WARNING** |
| **Distinción bici vs motorizado** | **NO** | SI (bici no necesita licencia/patente) | **WARNING** |

## 8E. Protecciones Legales de la Plataforma

| Protección | Estado | Detalle |
|-----------|--------|---------|
| MOOVY es intermediario, no vendedor | SI | TyC Sección 2: explícitamente dice que MOOVY NO es vendedor ni responsable de productos |
| Limitación de responsabilidad por demoras | PARCIAL | TyC Sección 5 menciona servicio de delivery pero no específicamente clima/Ushuaia |
| Mecanismo de resolución de disputas | NO | No hay proceso definido de reclamos/mediación |
| Protección contra fraude/productos ilegales | PARCIAL | TyC Sección 8 "Uso Aceptable" pero genérico |
| Verificación de edad (18+) | NO | Sin gate de edad para productos restringidos (alcohol, etc.) |
| Consentimiento explícito datos (Ley 25.326) | PARCIAL | Privacy policy menciona ARCO pero no hay checkbox de consentimiento en registro |
| Push notification disclosure | PARCIAL | Toggle en perfil pero no disclosure previo |

## 8F. Compliance Financiero

| Requisito | Estado | Severidad |
|-----------|--------|-----------|
| CUIT para MP sobre threshold | NO recopilado | CRITICAL |
| Comisiones claramente informadas pre-aceptación | NO — no hay pantalla que muestre "MOOVY cobra X% de comisión" al onboarding | CRITICAL |
| Generación de factura/comprobante | NO EXISTE | WARNING (no legal stricto, pero recomendado) |
| Desglose de comisiones para vendedores | EXISTE en `/vendedor/ganancias` | OK |

**Score Part 8: 2/10** — Situación legal MUY débil. Las bases están (TyC y Privacy), pero falta todo lo de compliance fiscal, verificación documental, y términos específicos por rol.

---

# PART 9 — AUDITORÍA DE CONTENIDO Y MARKETING

## 9a. Brand Voice
- **Consistente**: Voseo argentino ("Registrate", "Ingresá"), tono amigable
- **Local**: "Ushuaia" en header, "Hecho con ❤️ en Ushuaia" en perfil, jurisdicción TDF en términos
- **Identidad visual**: Rojo #e60012 consistente, gradientes modernos
- **Calificación**: BUENO — Se siente local y de startup

## 9b. Onboarding Copy
- **Cliente primera vez**: Ve splash screen (3.5s) → Homepage con hero slider → Browseable. **BUENO** si no estuviera el maintenance mode bloqueando
- **Vendedor primera vez**: Un botón "Quiero vender" → activación instantánea → Dashboard vacío. **MALO** — No hay propuesta de valor, no hay wizard, no hay explicación de comisiones
- **Driver primera vez**: Formulario de registro con sección "¿Por qué MOOVY?" mostrando: "$50,000/semana, horarios flexibles, seguro, pagos rápidos". **BUENO** — Copy motivante

## 9c. Empty State Copy

| Empty State | Copy Actual | Calidad | Sugerencia |
|-------------|------------|---------|------------|
| Carrito vacío | "Tu carrito está vacío" + "Ver Productos" | OK | "¡Tu carrito espera! Explorá los comercios de Ushuaia" |
| Sin canjes | "Aún no tenés canjes" + "Usá tus puntos MOOVER" | BUENO | OK |
| Otros | No verificados en detalle | WARNING | Necesitan copy motivante |

## 9d. Push Notification Copy

| Status | Título | Body | Calidad |
|--------|--------|------|---------|
| CONFIRMED | "✅ Pedido confirmado" | "Tu pedido {n} fue confirmado ✅" | BÁSICO — Redundante emoji en título y body |
| PREPARING | "👨‍🍳 Preparando tu pedido" | "Tu pedido {n} se está preparando 👨‍🍳" | OK |
| IN_DELIVERY | "🛵 En camino" | "Tu pedido {n} está en camino 🛵" | BÁSICO |
| DELIVERED | "✅ Pedido entregado" | "Tu pedido {n} fue entregado ✅" | BÁSICO |

**PROBLEMA**: Las notificaciones son genéricas. No incluyen monto, nombre del comercio, ETA, ni CTA. Comparar con la sugerencia del brief: "¡Nuevo pedido en MOOVY! $2.350 · Lista en 15 min · Aceptá ahora" que es mucho más rico.

**PROBLEMA 2**: Todas las notificaciones apuntan a `/mis-pedidos` (la lista), no al pedido específico. El tag es `order-{status}` que reemplaza notificaciones del mismo tipo.

## 9e. SEO y Discoverability

| Aspecto | Estado | Severidad |
|---------|--------|-----------|
| Meta titles/descriptions en páginas públicas | SOLO en /terminos y /privacidad | CRITICAL |
| Homepage metadata | NO TIENE | CRITICAL |
| Marketplace metadata | NO TIENE | CRITICAL |
| Productos individuales metadata | NO VERIFICADO | CRITICAL |
| sitemap.xml | NO EXISTE | CRITICAL |
| robots.txt | NO EXISTE | CRITICAL |
| Structured data (JSON-LD) | NO EXISTE | WARNING |
| Open Graph tags para compartir | NO VERIFICADO | WARNING |

**Para una app que depende de tráfico orgánico local en Ushuaia, NO tener SEO es un problema grave.**

## 9f. Growth Hooks

| Feature | Estado | Detalle |
|---------|--------|---------|
| Programa de referidos | PARCIAL | APIs existen (`/api/referrals`, `/api/moover/friends`) pero NO hay UI de invitar amigos |
| Compartir producto en redes | NO EXISTE | No hay botón "Compartir" en productos ni listings |
| "Calificá tu experiencia" post-delivery | SI | Rating modals después de entrega |
| Descuento de bienvenida | PARCIAL | PromotionalPopup se muestra pero dice "Registrate ahora", no ofrece descuento claro |
| Incentivo vendedores nuevos | NO EXISTE | No hay "primeros 3 meses sin comisión" ni similar |
| Programa de puntos | SI | MOOVER con 3 niveles, bien implementado |

**Score Part 9: 4/10** — Brand voice es bueno pero falta SEO completo, growth hooks están a medio implementar, y las push notifications son genéricas.

---

# PART 10 — PLAN DE ACCIÓN PRIORIZADO

## TIER 1 — BLOCKERS (Antes de cualquier lanzamiento público)

| # | Issue | Branch | Archivo(s) | Fix |
|---|-------|--------|-----------|-----|
| 1 | **Tienda bloqueada en producción** | `hotfix/maintenance-mode` | `src/app/(store)/page.tsx:23` | Cambiar `IS_MAINTENANCE_MODE` a variable de entorno o flag en DB: `const IS_MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true"` |
| | | | **finish.ps1 msg**: `"hotfix: hacer maintenance mode configurable por env var"` |
| 2 | **No hay vercel.json para crons** | `feat/vercel-cron-config` | `vercel.json` (nuevo) | Crear vercel.json con los 4 cron endpoints registrados |
| | | | **finish.ps1 msg**: `"feat: configurar cron jobs en vercel.json"` |
| 3 | **Páginas legales faltantes (6)** | `feat/paginas-legales` | 6 páginas nuevas en `src/app/` | Crear: cookies, terminos-vendedor, terminos-repartidor, terminos-comercio, devoluciones, cancelaciones |
| | | | **finish.ps1 msg**: `"feat: agregar páginas legales faltantes — cookies, términos por rol, devoluciones, cancelaciones"` |
| 4 | **Comercio no recopila CUIT/habilitación/CBU** | `feat/merchant-legal-fields` | `src/app/comercio/registro/page.tsx`, `prisma/schema.prisma`, API registro | Agregar campos: CUIT, constanciaAFIP, habilitacionMunicipal, CBU, registroSanitario |
| | | | **finish.ps1 msg**: `"feat: agregar campos legales obligatorios al registro de comercio"` |
| 5 | **Repartidor no sube documentos** | `feat/driver-document-upload` | `src/app/repartidor/registro/page.tsx`, API, schema | Agregar upload de: licencia, seguro, VTV, foto DNI. Agregar campo CUIT. Diferenciar bici vs motorizado |
| | | | **finish.ps1 msg**: `"feat: upload de documentos legales en registro de repartidor"` |
| 6 | **Vendedor sin onboarding ni verificación** | `feat/seller-onboarding` | `src/app/(store)/mi-perfil/page.tsx`, nueva página onboarding vendedor | Crear wizard de onboarding: CUIT, aceptar términos de vendedor, declaración jurada |
| | | | **finish.ps1 msg**: `"feat: onboarding de vendedor con CUIT y aceptación de términos"` |
| 7 | **Comisiones no informadas al onboarding** | Incluir en branches 4, 5, 6 | Formularios de registro | Mostrar claramente el % de comisión antes de que vendedores/merchants/drivers acepten |
| 8 | **No hay error boundaries** | `feat/error-boundaries` | `src/app/error.tsx`, `src/app/not-found.tsx`, por portal | Crear error.tsx y not-found.tsx globales + por portal |
| | | | **finish.ps1 msg**: `"feat: agregar error boundaries y página 404 para todos los portales"` |
| 9 | **No hay consentimiento explícito de datos al registro** | Incluir en branches de registro | Formularios de registro | Agregar checkbox "Acepto la Política de Privacidad" con link, conforme Ley 25.326 |

## TIER 2 — IMPORTANTES (Primeras 2 semanas post-lanzamiento)

| # | Issue | Branch | Fix |
|---|-------|--------|-----|
| 10 | SEO: metadata, sitemap, robots | `feat/seo-basico` | Agregar metadata a TODAS las páginas públicas, crear sitemap.ts y robots.ts |
| | | **finish.ps1 msg**: `"feat: SEO básico — metadata, sitemap.xml, robots.txt"` |
| 11 | Marketplace en BottomNav | `feat/nav-marketplace` | Reemplazar "Buscar" por "Marketplace" en BottomNav |
| | | **finish.ps1 msg**: `"feat: agregar marketplace al bottom nav principal"` |
| 12 | Notificaciones bell en header | `feat/notifications-bell` | Agregar icono campana con badge en AppHeader |
| | | **finish.ps1 msg**: `"feat: agregar campana de notificaciones al header"` |
| 13 | Push notifications enriquecidas | `feat/push-enriquecido` | Incluir monto, nombre merchant, ETA. Deep-link a pedido específico |
| | | **finish.ps1 msg**: `"feat: enriquecer push notifications con monto, merchant y deep link"` |
| 14 | Toast system (reemplazar alert()) | `feat/toast-system` | Implementar toast component global, reemplazar todos los `alert()` |
| | | **finish.ps1 msg**: `"feat: sistema de toast notifications, reemplazar alert() nativos"` |
| 15 | Sonido de alerta para merchants | `feat/merchant-sound-alert` | Audio notification cuando llega pedido nuevo al portal merchant |
| | | **finish.ps1 msg**: `"feat: alerta sonora para pedidos nuevos en portal comercio"` |
| 16 | Countdown visual merchant timeout | `feat/merchant-countdown` | Mostrar timer de countdown en UI del merchant para confirmar pedido |
| | | **finish.ps1 msg**: `"feat: countdown visual de timeout de confirmación para comercios"` |
| 17 | Link cambiar contraseña en perfil | `fix/profile-password-link` | Agregar link a `/mi-perfil/cambiar-password` en sección Mi Cuenta |
| | | **finish.ps1 msg**: `"fix: agregar link a cambiar contraseña en mi perfil"` |
| 18 | Referral UI | `feat/referral-ui` | Crear página de "Invitá amigos" con código, compartir link, tracking |
| | | **finish.ps1 msg**: `"feat: UI de programa de referidos — invitar amigos, compartir link"` |
| 19 | Compartir producto/listing | `feat/share-product` | Botón compartir con Web Share API en productos y listings |
| | | **finish.ps1 msg**: `"feat: botón compartir producto en redes sociales"` |
| 20 | vehicleType selector en registro driver | `fix/driver-vehicle-type` | Agregar selector bici/moto/auto/camioneta/camión con validación condicional |
| | | **finish.ps1 msg**: `"fix: selector de tipo de vehículo en registro de repartidor"` |

## TIER 3 — NICE TO HAVE (Backlog post-lanzamiento)

| # | Issue | Descripción |
|---|-------|-------------|
| 21 | Skeleton loaders | Reemplazar spinners genéricos por skeleton loaders en homepage, marketplace, merchants |
| 22 | Merchant analytics | Gráficos de pedidos/día, productos más vendidos, revenue trends |
| 23 | Driver navigation integration | Botón "Abrir en Maps/Waze" para navegar a merchant y customer |
| 24 | Structured data JSON-LD | Para productos, merchants, listados marketplace (SEO avanzado) |
| 25 | Open Graph tags | Para compartir productos en WhatsApp/redes con preview |
| 26 | Seller primer-paso wizard | Guía paso a paso cuando un vendedor llega al dashboard vacío |
| 27 | Audit log para config changes en OPS | Registrar quién cambió qué configuración y cuándo |
| 28 | Rate limiting en API | Agregar rate limiting a endpoints públicos y de autenticación |
| 29 | Reportar problema en delivery | UI para que driver y customer reporten problemas |
| 30 | Factura/comprobante digital | Generación automática de comprobante de compra |
| 31 | Horarios del comercio | CRUD de horarios de atención por día de la semana |
| 32 | Verificación de edad para productos restringidos | Gate de edad (18+) para alcohol y otros productos regulados |
| 33 | Mover scheduled pre-assignment trigger (45min) a MoovyConfig | Actualmente hardcodeado |

---

---

# PLAN DE TRABAJO DIVIDIDO EN 2 DESARROLLADORES

## Principio de división
- **DEV A**: Todo lo legal, registros, onboarding, y páginas legales (toca: formularios de registro, schema prisma, nuevas páginas legales, perfil)
- **DEV B**: Infraestructura técnica, navegación, UX, SEO, y mejoras de UI (toca: componentes de layout, config, crons, error boundaries, push notifications)

**Regla**: Ninguna rama de Dev A toca archivos que toque Dev B y viceversa.

---

## DEV A — Legal, Compliance, y Onboarding

### Rama A1: `feat/paginas-legales`
**Nombre rama**: `feat/paginas-legales`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: agregar páginas legales faltantes — cookies, términos por rol, devoluciones, cancelaciones"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Crear las 6 páginas legales faltantes para MOOVY. MOOVY es un marketplace + delivery en Ushuaia, Tierra del Fuego, Argentina.

Páginas a crear (cada una como page.tsx con export const metadata):

1. `src/app/cookies/page.tsx` — Política de Cookies
   - Qué cookies usa MOOVY (sesión NextAuth, preferencias, analytics)
   - Cómo desactivarlas
   - Mínimo 5 secciones

2. `src/app/terminos-vendedor/page.tsx` — Términos para Vendedores Marketplace
   - Relación: MOOVY es intermediario, el vendedor es responsable de sus productos
   - Comisiones: MOOVY cobra un % de comisión configurable por cada venta
   - Obligaciones del vendedor: CUIT, productos legítimos, no falsificados, descripción veraz
   - Prohibiciones: productos ilegales, armas, medicamentos sin receta, etc.
   - Responsabilidad: el vendedor responde por calidad y veracidad
   - Cancelaciones y devoluciones del lado vendedor
   - Suspensión de cuenta por incumplimiento

3. `src/app/terminos-repartidor/page.tsx` — Términos para Repartidores
   - Relación contractual: el repartidor es independiente, NO empleado de MOOVY
   - Requisitos: DNI, licencia vigente (motorizado), seguro vehicular, CUIT
   - Comisiones: MOOVY retiene un % por gestión
   - Responsabilidad del repartidor durante el transporte
   - Seguro: el repartidor debe mantener seguro vigente
   - Código de conducta
   - Suspensión por incumplimiento

4. `src/app/terminos-comercio/page.tsx` — Términos para Comercios
   - Relación: MOOVY es intermediario
   - Requisitos: CUIT, habilitación municipal, registro sanitario (alimentos)
   - Comisiones y tarifas
   - SLA: confirmar pedidos dentro del timeout configurado
   - Responsabilidad sobre productos y stock
   - Suspensión por incumplimiento

5. `src/app/devoluciones/page.tsx` — Política de Devoluciones y Reembolsos
   - Conforme Ley 24.240 de Defensa del Consumidor (Argentina)
   - Cuándo se puede devolver (producto defectuoso, no coincide con descripción)
   - Proceso de devolución
   - Plazos (10 días hábiles conforme ley)
   - Reembolso por MercadoPago o puntos MOOVER
   - Productos no retornables (alimentos perecederos, etc.)

6. `src/app/cancelaciones/page.tsx` — Política de Cancelaciones
   - Cuándo puede cancelar el comprador (antes de confirmación, después, en camino)
   - Cuándo puede cancelar el vendedor/comercio
   - Penalidades o cargos por cancelación
   - Cancelaciones automáticas (timeout merchant, timeout driver)
   - Reembolsos por cancelación

Además:
7. En `src/app/(store)/mi-perfil/page.tsx`: Agregar links a Política de Cookies y Política de Devoluciones en la sección "Configuración y Ayuda" (después del link a Términos y Condiciones existente). NO tocar otras secciones del archivo.

Estilo visual: Seguir exactamente el mismo patrón de `src/app/terminos/page.tsx` y `src/app/privacidad/page.tsx` (leer ambos antes de empezar). Usar las mismas clases CSS, estructura de secciones con h2/h3, y el mismo footer con email de contacto.

Jurisdicción: Ushuaia, Tierra del Fuego, Argentina. Ley aplicable: leyes de Argentina.
Email de contacto: legal@somosmoovy.com

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados/creados.
```

**Archivos que toca**: Solo páginas nuevas en `src/app/` + links en `mi-perfil/page.tsx` (sección Configuración)

---

### Rama A2: `feat/merchant-legal-fields`
**Nombre rama**: `feat/merchant-legal-fields`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: agregar campos legales obligatorios al registro de comercio — CUIT, habilitación, CBU"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Agregar campos legales obligatorios al formulario de registro de comercios y al schema de Prisma.

Contexto: El registro actual de comercios (`src/app/comercio/registro/page.tsx`) solo recopila datos básicos (nombre, email, teléfono, dirección, contraseña). Para operar legalmente en Argentina, MOOVY necesita recopilar datos fiscales y documentación.

Cambios requeridos:

1. En `prisma/schema.prisma`, modelo `Merchant`, agregar estos campos (todos opcionales String? para no romper datos existentes):
   - `cuit String?` — CUIT/CUIL del titular
   - `constanciaAfipUrl String?` — URL del archivo de constancia AFIP subido
   - `habilitacionMunicipalUrl String?` — URL de habilitación municipal
   - `cbu String?` — CBU o alias para pagos
   - `registroSanitarioUrl String?` — URL de registro sanitario (solo alimentos)
   - `acceptedTermsAt DateTime?` — Timestamp de aceptación de términos
   - `acceptedPrivacyAt DateTime?` — Timestamp de aceptación de privacidad

2. Aplicar cambios al schema con `npx prisma db push`

3. En `src/app/comercio/registro/page.tsx`, reorganizar en 3 pasos:
   - Paso 1: Datos del negocio (businessName, businessType, firstName, lastName) + Contraseña — lo que hoy es Step 1 + parte de Step 2
   - Paso 2: Contacto y dirección (email, phone, businessPhone, address) — lo que hoy es parte de Step 2
   - Paso 3: Datos fiscales y legales (NUEVO):
     * Campo CUIT (input text, formato XX-XXXXXXXX-X)
     * Campo CBU/Alias (input text)
     * Upload de Constancia AFIP (usar componente ImageUpload existente de `@/components/ui/`)
     * Upload de Habilitación Municipal (ImageUpload)
     * Upload de Registro Sanitario (ImageUpload) — solo si businessType es alimentos (Restaurante, Pizzería, etc.)
     * Checkbox: "Acepto los Términos para Comercios" con link a `/terminos-comercio`
     * Checkbox: "Acepto la Política de Privacidad" con link a `/privacidad`
     * Info box: "MOOVY cobra una comisión por cada venta realizada a través de la plataforma. Consultá los detalles en los Términos para Comercios."

4. En `src/app/api/auth/register/merchant/route.ts`: recibir y guardar los nuevos campos (cuit, cbu, URLs de documentos, timestamps de aceptación)

Patrón de diseño: Seguir el estilo visual existente del formulario (gradientes azules, rounded-2xl, iconos Lucide). Usar `ImageUpload` de `@/components/ui/` para uploads de documentos.

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: `prisma/schema.prisma` (modelo Merchant), `src/app/comercio/registro/page.tsx`, `src/app/api/auth/register/merchant/route.ts`

---

### Rama A3: `feat/driver-legal-onboarding`
**Nombre rama**: `feat/driver-legal-onboarding`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: upload de documentos legales y selector de vehículo en registro de repartidor"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Mejorar el formulario de registro de repartidores para recopilar documentación legal obligatoria y distinguir tipos de vehículo.

Contexto: El registro actual (`src/app/repartidor/registro/page.tsx`) recopila datos personales y del vehículo pero NO sube documentos, no pide CUIT, y no distingue entre bicicleta y vehículo motorizado. Por ley argentina (Ley 24.449), los vehículos motorizados requieren licencia, seguro y VTV.

Cambios requeridos:

1. En `prisma/schema.prisma`, modelo `DriverProfile`, agregar:
   - `cuit String?`
   - `licenciaUrl String?` — Foto de licencia de conducir
   - `seguroUrl String?` — Comprobante de seguro vehicular
   - `vtvUrl String?` — VTV vigente
   - `dniFrenteUrl String?` — Foto DNI frente
   - `dniDorsoUrl String?` — Foto DNI dorso
   - `acceptedTermsAt DateTime?`

2. Aplicar con `npx prisma db push`

3. En `src/app/repartidor/registro/page.tsx`, reorganizar en 3 pasos:
   - Paso 1: Datos personales (lo existente) + CUIT (nuevo campo) + Upload foto DNI frente y dorso
   - Paso 2: Vehículo:
     * AGREGAR selector visual de tipo de vehículo al INICIO: Bicicleta 🚲 / Moto 🏍️ / Auto 🚗 / Camioneta 🚙 / Camión 🚛
     * El vehicleType default actual es "auto" — cambiarlo a "" (vacío, obligar a elegir)
     * Si vehicleType === "bicicleta": NO mostrar campos de patente, marca, modelo, año. NO requerir licencia.
     * Si vehicleType !== "bicicleta" (motorizado): Mostrar todos los campos actuales + upload de:
       - Licencia de conducir (ImageUpload)
       - Seguro del vehículo (ImageUpload)
       - VTV (ImageUpload)
   - Paso 3: Confirmación (lo existente):
     * Checkbox licencia (solo motorizado): "Tengo licencia de conducir vigente"
     * Checkbox términos: Cambiar link de `/terminos` a `/terminos-repartidor`
     * Info box comisión: "MOOVY retiene un porcentaje por la gestión de cada entrega. Consultá los detalles en los Términos para Repartidores."

4. En `src/app/api/auth/register/driver/route.ts`: recibir y guardar los nuevos campos

Usar `ImageUpload` existente de `@/components/ui/` para todos los uploads.
Mantener el estilo visual existente (gradientes verdes, rounded-2xl).

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: `prisma/schema.prisma` (modelo DriverProfile), `src/app/repartidor/registro/page.tsx`, `src/app/api/auth/register/driver/route.ts`

**IMPORTANTE**: A2 y A3 tocan ambos `prisma/schema.prisma` pero modelos DISTINTOS (Merchant vs DriverProfile). Se pueden hacer en paralelo si cada uno edita solo su modelo. Si hay duda, hacer A2 primero y mergear antes de A3.

---

### Rama A4: `feat/seller-onboarding`
**Nombre rama**: `feat/seller-onboarding`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: onboarding de vendedor con CUIT, términos y declaración jurada"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Crear un flujo de onboarding para vendedores marketplace en vez de la activación instantánea actual.

Contexto: Actualmente cuando un usuario hace click en "Quiero vender" en `/mi-perfil`, se llama a `/api/auth/activate-seller` y se activa el rol SELLER instantáneamente SIN recopilar ningún dato. Esto es un problema legal porque AFIP requiere que vendedores habituales tengan CUIT y MOOVY necesita que acepten términos específicos.

Cambios requeridos:

1. En `prisma/schema.prisma`, modelo `SellerProfile`, agregar:
   - `cuit String?`
   - `acceptedTermsAt DateTime?`
   Aplicar con `npx prisma db push`

2. Crear `src/app/vendedor/registro/page.tsx` — Wizard de 2 pasos:
   - Paso 1: "Datos fiscales"
     * Campo CUIT (input text, formato XX-XXXXXXXX-X, con validación de formato)
     * Checkbox: "Acepto los Términos para Vendedores" con link a `/terminos-vendedor`
     * Checkbox: "Acepto la Política de Privacidad" con link a `/privacidad`
     * Info box: "MOOVY cobra una comisión por cada venta. Consultá los detalles en los Términos para Vendedores."
   - Paso 2: "Tu perfil de vendedor"
     * displayName (nombre público como vendedor)
     * bio (descripción corta)
     * Estos campos hoy están en `/vendedor/configuracion` — reusar la misma lógica
   - Step 3: Confirmación "¡Tu tienda está lista!" con CTA "Ir al Panel de Vendedor"

   Estilo visual: Seguir el patrón del registro de repartidor (`src/app/repartidor/registro/page.tsx`) — gradientes emerald/green, rounded-2xl, progress steps.

3. En `src/app/(store)/mi-perfil/page.tsx`:
   - Cambiar SOLO el botón "Quiero vender" (sección "Oportunidades MOOVY", función `handleActivateSeller`):
     * En vez de llamar a `/api/auth/activate-seller` directamente, hacer `router.push("/vendedor/registro?from=profile")`
   - NO tocar ninguna otra sección del archivo

4. En `src/app/api/auth/activate-seller/route.ts`:
   - Agregar validación: requerir `cuit` y `acceptedTerms: true` en el body
   - Guardar `cuit` en SellerProfile y `acceptedTermsAt: new Date()`
   - Si faltan, retornar 400 con error descriptivo

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: `prisma/schema.prisma` (modelo SellerProfile), nuevo `src/app/vendedor/registro/page.tsx`, `src/app/(store)/mi-perfil/page.tsx` (solo la función handleActivateSeller y el botón), `src/app/api/auth/activate-seller/route.ts`

---

### Rama A5: `feat/consentimiento-datos`
**Nombre rama**: `feat/consentimiento-datos`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: agregar consentimiento explícito de datos personales en registros — Ley 25.326"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Agregar consentimiento explícito de datos personales en los formularios de registro de usuarios, conforme Ley 25.326 de Protección de Datos Personales de Argentina.

Cambios requeridos:

1. En `prisma/schema.prisma`, modelo `User`, agregar:
   - `privacyConsentAt DateTime?`
   - `termsConsentAt DateTime?`
   Aplicar con `npx prisma db push`

2. En `src/app/(store)/registro/page.tsx`:
   - Agregar checkbox obligatorio: "Acepto los Términos y Condiciones" con link a `/terminos`
   - Agregar checkbox obligatorio: "Acepto la Política de Privacidad y el tratamiento de mis datos personales conforme la Ley 25.326" con link a `/privacidad`
   - Ambos checkboxes deben ser required para poder enviar el formulario
   - Enviar timestamps en el body del POST

3. En `src/app/(store)/login/page.tsx`:
   - Agregar texto pequeño debajo del botón de login: "Al iniciar sesión aceptás los Términos y Condiciones y la Política de Privacidad"
   - Con links a `/terminos` y `/privacidad`

4. En `src/app/api/auth/register/route.ts` (o el API de registro de usuarios):
   - Recibir y guardar `privacyConsentAt` y `termsConsentAt` como `new Date()` al crear el usuario

Estilo: Usar el mismo estilo de checkbox que usa el registro de repartidor (label con span text-sm text-gray-600 + link underline).

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: `src/app/(store)/registro/page.tsx`, `src/app/(store)/login/page.tsx`, `prisma/schema.prisma` (modelo User), API de registro

---

## DEV B — Infraestructura, Navegación, UX, y SEO

### Rama B1: `hotfix/maintenance-mode`
**Nombre rama**: `hotfix/maintenance-mode`
**Cerrar con**: `.\scripts\finish.ps1 -Message "hotfix: hacer maintenance mode configurable por env var en vez de hardcodeado a producción"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: El homepage de la tienda está BLOQUEADO en producción porque el maintenance mode está hardcodeado.

En `src/app/(store)/page.tsx`, línea 23, dice:
const IS_MAINTENANCE_MODE = process.env.NODE_ENV === "production";

Esto hace que TODA la tienda muestre "VOLVEMOS PRONTO" en producción. Nadie puede ver la app.

Cambios:
1. En `src/app/(store)/page.tsx:23`: Cambiar a `const IS_MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true"`
2. En `.env.example`: Agregar `MAINTENANCE_MODE=false  # true para mostrar página de mantenimiento`

Solo estos 2 archivos. Nada más.

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: `src/app/(store)/page.tsx` (línea 23), `.env.example`

**PRIORIDAD MÁXIMA** — Hacer esta rama PRIMERO y mergear inmediatamente

---

### Rama B2: `feat/vercel-cron-config`
**Nombre rama**: `feat/vercel-cron-config`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: configurar cron jobs en vercel.json para ejecución automática"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Configurar cron jobs para ejecución automática en el VPS de Hostinger (Linux). NO usar Vercel ni vercel.json — el proyecto corre en un VPS con acceso SSH y crontab.

MOOVY tiene 4 cron endpoints en `src/app/api/cron/`:
- `/api/cron/assignment-tick` — Procesa timeouts de asignación de drivers (debe correr cada minuto)
- `/api/cron/merchant-timeout` — Auto-cancela pedidos no confirmados por merchants (cada minuto)
- `/api/cron/scheduled-notify` — Notifica vendedores de pedidos programados próximos (cada 5 min)
- `/api/cron/seller-resume` — Reanuda vendedores pausados (cada 5 min)

Todos están protegidos con CRON_SECRET en Bearer token.

Cambios:

1. Leer cada archivo en `src/app/api/cron/` y verificar que validen correctamente el header `Authorization: Bearer ${CRON_SECRET}`. Si alguno no lo hace o usa un patrón diferente, corregirlo para que todos usen el mismo patrón consistente.

2. Crear `scripts/setup-cron.sh`:
   - Leer CRON_SECRET y APP_URL desde `.env` o `.env.production` del proyecto
   - Generar las 4 entradas de crontab con curl:
     * `* * * * *` para assignment-tick y merchant-timeout
     * `*/5 * * * *` para scheduled-notify y seller-resume
   - Cada curl debe enviar el header `Authorization: Bearer $CRON_SECRET`
   - Redirigir output a `/var/log/moovy-cron.log` con timestamp
   - El script debe ser IDEMPOTENTE: si se ejecuta dos veces, no duplicar entradas en crontab (usar un marcador como `# MOOVY-CRON` para identificar y reemplazar)
   - Hacerlo ejecutable con chmod +x

3. Crear endpoint de health check en `src/app/api/cron/health/route.ts`:
   - GET que devuelve status 200 con JSON: { status: "ok", timestamp: new Date().toISOString(), server: "vps" }
   - Protegido con el mismo CRON_SECRET
   - Sirve para verificar que los cron jobs están llegando correctamente

4. Crear `docs/CRON-SETUP.md` con documentación:
   - Cómo conectarse por SSH al VPS
   - Cómo ejecutar `bash scripts/setup-cron.sh` para instalar los cron jobs
   - Cómo verificar que están corriendo (`crontab -l`)
   - Cómo revisar los logs (`tail -f /var/log/moovy-cron.log`)
   - Cómo desactivar los cron jobs (`crontab -e` y borrar líneas con # MOOVY-CRON)

Restricciones:
- NO crear vercel.json — no usamos Vercel
- NO instalar dependencias adicionales — usar curl que ya viene en el VPS
- NO tocar archivos fuera de los mencionados

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos creados/modificados.
---

### Rama B3: `feat/error-boundaries`
**Nombre rama**: `feat/error-boundaries`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: agregar error boundaries y página 404 para todos los portales"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Crear error boundaries (error.tsx) y página 404 (not-found.tsx) para todos los portales de MOOVY.

Actualmente NO existe ningún error.tsx ni not-found.tsx. Si ocurre un error o el usuario navega a una ruta inexistente, ve una pantalla en blanco o el error default de Next.js.

Crear los siguientes archivos:

1. `src/app/not-found.tsx` — Página 404 global
   - Mostrar logo MOOVY, mensaje "Página no encontrada", ilustración simple
   - Botón "Volver al inicio" que lleva a "/"
   - Estilo: Centrado, fondo blanco, color rojo MOOVY (#e60012)

2. `src/app/error.tsx` — Error boundary global ("use client")
   - Props: { error, reset }
   - Mostrar mensaje amigable: "¡Ups! Algo salió mal"
   - Botón "Reintentar" que llama a reset()
   - Botón "Ir al inicio" con link a "/"
   - Log del error en console.error
   - Estilo: Centrado, fondo blanco

3. `src/app/(store)/error.tsx` — Error boundary tienda
   - Similar al global pero con link "Volver a la tienda" → "/tienda"
   - Color rojo MOOVY

4. `src/app/comercios/(protected)/error.tsx` — Error boundary comercio
   - "Volver al panel" → "/comercios"
   - Color azul

5. `src/app/repartidor/(protected)/error.tsx` — Error boundary repartidor
   - "Volver al dashboard" → "/repartidor/dashboard"
   - Color verde

6. `src/app/vendedor/(protected)/error.tsx` — Error boundary vendedor
   - "Volver al panel" → "/vendedor"
   - Color emerald

7. `src/app/ops/(protected)/error.tsx` — Error boundary ops
   - "Volver al panel" → "/ops"
   - Color rojo

Todos deben ser "use client" (requerimiento de Next.js para error boundaries).
Usar iconos Lucide (AlertTriangle, RefreshCcw, Home).
Mantener estilo consistente con MOOVY (rounded-2xl, shadow-lg, gradientes suaves).

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos creados.
```

**Archivos que toca**: Solo archivos NUEVOS `error.tsx` y `not-found.tsx`

---

### Rama B4: `feat/nav-marketplace-bell`
**Nombre rama**: `feat/nav-marketplace-bell`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: agregar marketplace al bottom nav y campana de notificaciones al header"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Mejorar la navegación principal de la tienda — agregar Marketplace al BottomNav y campana de notificaciones al header.

Contexto: El BottomNav actual tiene 5 tabs (Inicio, Buscar, MOOVER, Pedidos, Perfil). El Marketplace no es accesible desde el nav — solo desde la homepage. Esto es un problema grave porque el marketplace es un pilar del negocio. Además, el AppHeader no tiene icono de campana de notificaciones.

Cambios:

1. En `src/components/layout/BottomNav.tsx`:
   - Reemplazar el tab "Buscar" (Search icon → `/buscar`) por "Marketplace" (Store icon → `/marketplace`)
   - Mantener el mismo estilo visual (icono + label, highlight rojo cuando activo)
   - El nuevo orden queda: Inicio, Marketplace, MOOVER (centro), Pedidos, Perfil

2. En `src/components/layout/AppHeader.tsx`:
   - Agregar icono de campana (Bell de Lucide) entre los puntos MOOVER y el carrito
   - Sin funcionalidad de badge por ahora (solo el icono, visual placeholder)
   - En mobile: entre el badge de puntos y el ShoppingBag
   - En desktop: en la misma zona de iconos
   - Al hacer click: navegar a `/mis-pedidos` (por ahora, hasta que haya un centro de notificaciones)

3. En `src/app/(store)/mi-perfil/page.tsx`:
   - En la sección "Mi Cuenta" (entre "Mis Direcciones" y "Favoritos"), agregar un link a "Cambiar Contraseña":
     * Icono: Shield (Lucide) en bg-indigo-50 text-indigo-600
     * Label: "Cambiar Contraseña"
     * Link: `/mi-perfil/cambiar-password`
   - SOLO tocar la sección "Mi Cuenta", NO tocar otras secciones

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: `src/components/layout/BottomNav.tsx`, `src/components/layout/AppHeader.tsx`, `src/app/(store)/mi-perfil/page.tsx` (solo sección Mi Cuenta)

**NOTA**: Dev A también toca `mi-perfil/page.tsx` en A1 (links legales en sección Configuración) y A4 (botón seller en sección Oportunidades). Son secciones distintas del archivo — no debería haber conflicto.

---

### Rama B5: `feat/seo-basico`
**Nombre rama**: `feat/seo-basico`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: SEO básico — metadata en páginas públicas, sitemap.xml, robots.txt"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Implementar SEO básico para MOOVY — metadata en todas las páginas públicas, sitemap dinámico, y robots.txt.

Contexto: Actualmente solo 2 páginas tienen metadata (terminos y privacidad). No hay sitemap.xml ni robots.txt. Para una app local en Ushuaia que necesita tráfico orgánico, esto es crítico.

Cambios:

1. Crear `src/app/sitemap.ts`:
   - Exportar función `sitemap()` que genere un sitemap dinámico
   - Incluir: páginas estáticas (/, /tienda, /marketplace, /ayuda, /moover, /contacto, /nosotros, /terminos, /privacidad)
   - Incluir: productos dinámicos desde DB (Product con isActive: true)
   - Incluir: merchants activos (Merchant con isActive: true)
   - Incluir: listings activos (Listing con isActive: true)
   - Base URL: process.env.NEXT_PUBLIC_APP_URL || "https://www.somosmoovy.com"

2. Crear `src/app/robots.ts`:
   - Allow: / (todo público)
   - Disallow: /api/, /ops/, /comercios/, /repartidor/, /vendedor/ (portales privados)
   - Sitemap: {baseUrl}/sitemap.xml

3. Agregar metadata a las siguientes páginas (usar `export const metadata` para estáticas, `generateMetadata` para dinámicas):

   - `src/app/(store)/page.tsx`: "MOOVY — Tu marketplace y delivery en Ushuaia" / "Comprá productos, comida y más de comercios locales en Ushuaia. Delivery rápido a tu puerta."
   - `src/app/(store)/marketplace/page.tsx`: "Marketplace MOOVY — Comprá y vendé en Ushuaia"
   - `src/app/(store)/tienda/page.tsx`: "Tienda MOOVY — Comercios de Ushuaia"
   - `src/app/(store)/buscar/page.tsx`: "Buscar en MOOVY — Productos y comercios en Ushuaia"
   - `src/app/(store)/ayuda/page.tsx`: "Centro de Ayuda — MOOVY"
   - `src/app/landing/page.tsx`: "MOOVY — Marketplace y Delivery en Ushuaia, Tierra del Fuego"
   - `src/app/moover/page.tsx`: "Programa MOOVER — Puntos y beneficios en MOOVY"
   - `src/app/contacto/page.tsx`: "Contacto — MOOVY Ushuaia"
   - `src/app/nosotros/page.tsx`: "Sobre Nosotros — MOOVY"
   - `src/app/(store)/productos/[slug]/page.tsx`: generateMetadata dinámico con nombre del producto, precio, y merchant

4. En `src/app/layout.tsx` (root): Agregar metadata defaults con Open Graph:
   - openGraph: { type: "website", locale: "es_AR", siteName: "MOOVY" }
   - twitter: { card: "summary_large_image" }

IMPORTANTE: Varias de estas páginas son "use client" — en ese caso NO se puede usar export const metadata. Solo agregar metadata a las que son server components o crear un archivo layout.tsx intermedio. Verificar cada una antes de modificar.

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: Nuevo `sitemap.ts`, nuevo `robots.ts`, metadata en páginas existentes (solo agregar export const)

---

### Rama B6: `feat/toast-push-enriched`
**Nombre rama**: `feat/toast-push-enriched`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: sistema de toast global y push notifications enriquecidas con monto y deep link"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Crear un sistema de toast notifications global y enriquecer las push notifications con más contexto.

Contexto: MOOVY actualmente usa `alert()` nativo del browser para errores, lo cual es inaceptable en una app móvil moderna. Además, las push notifications son genéricas ("Tu pedido X fue confirmado") sin incluir monto, nombre del comercio, ni deep-link al pedido específico.

Cambios:

PARTE 1 — Sistema de Toast:

1. Crear `src/store/toast.ts` — Zustand store:
   - Estado: array de toasts con { id, type: 'success'|'error'|'warning'|'info', message, duration? }
   - Acciones: addToast(type, message, duration?), removeToast(id)
   - Auto-remove después de duration (default 4 segundos)
   - Exportar helper: `toast.success(msg)`, `toast.error(msg)`, `toast.warning(msg)`, `toast.info(msg)`

2. Crear `src/components/ui/Toast.tsx`:
   - ToastContainer: fixed bottom-right (desktop) o top-center (mobile)
   - Cada toast: fondo coloreado según tipo, icono (CheckCircle/XCircle/AlertTriangle/Info), texto, botón X para cerrar
   - Animación: slide-in desde abajo, fade-out al salir
   - z-index alto (z-[9999]) para estar sobre todo
   - Max 3 toasts visibles

3. En `src/app/(store)/layout.tsx`: Agregar `<ToastContainer />` dentro del layout (después de los otros componentes globales como CartSidebar, PromoPopup, etc.)

PARTE 2 — Push Notifications Enriquecidas:

4. En `src/lib/notifications.ts`:
   - La función `notifyBuyer` actualmente recibe (userId, status, orderNumber)
   - Cambiar para recibir también: { total?: number, merchantName?: string, orderId?: string }
   - Actualizar templates:
     * CONFIRMED: "✅ Tu pedido #{n} fue confirmado" → "✅ Pedido confirmado · ${merchantName} · $${total}"
     * PREPARING: "👨‍🍳 Preparando tu pedido" → "👨‍🍳 ${merchantName} está preparando tu pedido de $${total}"
     * IN_DELIVERY: "🛵 En camino" → "🛵 ¡Tu pedido de $${total} de ${merchantName} está en camino!"
     * DELIVERED: "✅ Entregado" → "✅ ¡Pedido entregado! ¿Cómo fue tu experiencia?"
   - Cambiar URL de `/mis-pedidos` a `/mis-pedidos/${orderId}` para deep-link directo

5. En `public/sw.js`:
   - En el handler `notificationclick`: actualizar para manejar URLs que incluyen orderId (actualmente solo matchea rutas fijas)

6. Actualizar TODOS los call sites de `notifyBuyer` en el codebase para pasar los nuevos parámetros (total, merchantName, orderId). Buscar con grep todos los usos de `notifyBuyer`.

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: Nuevos `Toast.tsx` y `toast.ts`, `src/app/(store)/layout.tsx` (solo agregar componente), `src/lib/notifications.ts`, `public/sw.js`, y call sites de notifyBuyer

---

### Rama B7: `feat/merchant-alerts`
**Nombre rama**: `feat/merchant-alerts`
**Cerrar con**: `.\scripts\finish.ps1 -Message "feat: alerta sonora y countdown visual de timeout para pedidos en portal comercio"`

**Prompt para Claude**:
```
IMPORTANT: Before doing anything else, read CLAUDE.md in the root of the project. Follow every rule defined there without exception.

Tarea: Agregar alerta sonora para pedidos nuevos y countdown visual de timeout de confirmación en el portal de comercios.

Contexto: Cuando un merchant recibe un pedido nuevo, no hay sonido de alerta. Además, el merchant tiene un timeout configurable para confirmar (default 5 min, desde MoovyConfig key `merchant_confirm_timeout_seconds`), pero no hay countdown visual en la UI. El merchant no sabe cuánto tiempo le queda.

Cambios:

1. Agregar sonido de alerta:
   - Buscar un sonido de notificación libre de royalty (o crear uno simple) y guardarlo en `public/sounds/new-order.mp3`
   - En `src/app/comercios/(protected)/pedidos/page.tsx`: cuando se recibe un pedido nuevo (via socket event o poll), reproducir el audio
   - Usar `new Audio('/sounds/new-order.mp3').play()` con catch para manejar autoplay restrictions
   - Solo reproducir si el pedido es nuevo (no al cargar la lista)

2. Countdown visual de timeout:
   - En la card/row de cada pedido con status PENDING (esperando confirmación del merchant):
     * Mostrar un timer countdown que cuenta hacia atrás desde el timeout configurado
     * Leer timeout de la API `/api/ops/config/global` (key `merchant_confirm_timeout_seconds`, default 300 = 5 min)
     * Calcular tiempo restante: timeout - (now - order.createdAt)
     * Si queda < 1 min: mostrar en rojo parpadeante
     * Si se agota: mostrar "Tiempo agotado" en rojo
   - Usar un setInterval de 1 segundo para actualizar el countdown

3. Feedback cuando no hay driver:
   - Escuchar el socket event `order_unassignable` (emitido por assignment-engine cuando se agotan los intentos)
   - Mostrar un banner/alert: "No se encontró repartidor disponible para el pedido #{orderNumber}. El equipo de MOOVY fue notificado."

Leer primero `src/app/comercios/(protected)/pedidos/page.tsx` para entender la estructura actual antes de modificar.

Al terminar: correr `npx tsc --noEmit` y mostrar lista de archivos modificados.
```

**Archivos que toca**: `src/app/comercios/(protected)/pedidos/page.tsx`, nuevo archivo de audio en `public/sounds/`

---

## ORDEN DE EJECUCIÓN RECOMENDADO

### DEV A (Legal & Onboarding):
```
A1 (páginas legales) → A2 (merchant fields) → A3 (driver docs) → A4 (seller onboarding) → A5 (consentimiento)
```
A1 primero porque A2, A3 y A4 referencian las páginas legales creadas en A1.
A2 y A3 tocan schema pero modelos distintos — pueden hacerse en paralelo si quieren.

### DEV B (Infra & UX):
```
B1 (maintenance mode) → B2 (vercel cron) → B3 (error boundaries) → B4 (nav) → B5 (SEO) → B6 (toast+push) → B7 (merchant alerts)
```
B1 PRIMERO (hotfix de 1 minuto, mergear inmediatamente).
B2-B3 son independientes, pueden hacerse en paralelo.
B4-B5-B6-B7 son independientes entre sí.

### Punto de sincronización:
Después de que ambos devs mergeen sus primeras ramas (A1+A2 y B1+B2+B3), hacer un pull de develop antes de continuar para incorporar los cambios del otro.

---

# RESUMEN FINAL

## Scores por Área

| Área | Score | Justificación |
|------|-------|---------------|
| Part 1 — Inventario de Rutas | 7/10 | Completo pero marketplace no accesible desde nav |
| Part 2 — Flujos de Usuario | 5/10 | Core flows funcionan pero gaps en onboarding y docs |
| Part 3 — Contenido | 5/10 | Buen copy/tono, pero faltan legales y error boundaries |
| Part 4 — Navegación | 5/10 | Funcional pero falta campana, marketplace en nav |
| Part 5 — Dashboards | 6/10 | Sólidos pero faltan features operacionales |
| Part 6 — Portal Vendedor | 6/10 | Funcional pero sin onboarding |
| Part 7 — Conectividad Técnica | 7/10 | Buena arquitectura, falta vercel.json |
| Part 8 — Legal/Compliance | 2/10 | MUY débil — faltan docs, verificaciones, y páginas legales |
| Part 9 — Marketing/Contenido | 4/10 | Marca fuerte, pero sin SEO, growth hooks incompletos |
| Part 10 — Plan de Acción | — | 9 blockers, 11 importantes, 13 nice-to-have |

## **SCORE GLOBAL DE READINESS: 4.5 / 10**

## La cosa MÁS IMPORTANTE para arreglar HOY:

**`IS_MAINTENANCE_MODE = process.env.NODE_ENV === "production"` en `src/app/(store)/page.tsx:23`**

La tienda completa está bloqueada en producción. NADIE puede ver la app. Esto es un cambio de UNA LÍNEA que desbloquea todo. Cambiarlo a una variable de entorno controlable (`process.env.MAINTENANCE_MODE === "true"`).
