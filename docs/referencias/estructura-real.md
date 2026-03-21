# MOOVY — Estado Real del Proyecto

> Generado automáticamente. Última actualización: Marzo 2026

---

## 1. ÁRBOL DE PÁGINAS (todas las rutas existentes)

### 🛒 (store) — Tienda / Comprador

| Path | Archivo | Estado | Qué hace |
|------|---------|--------|----------|
| `/tienda` | `(store)/page.tsx` | COMPLETO | Home de tienda: hero slider, categorías, comercios destacados, productos destacados, sección marketplace |
| `/tienda` (alias) | `(store)/tienda/page.tsx` | COMPLETO | Página de exploración de tienda con categorías y búsqueda |
| `/productos` | `(store)/productos/page.tsx` | COMPLETO | Buscador/listado de productos con filtros |
| `/productos/[slug]` | `(store)/productos/[slug]/page.tsx` | COMPLETO | Detalle de producto con opciones, cantidad y agregar al carrito |
| `/store/[slug]` | `(store)/store/[slug]/page.tsx` | COMPLETO | Perfil público de un comercio con sus productos |
| `/marketplace` | `(store)/marketplace/page.tsx` | COMPLETO | Marketplace de vendedores particulares con búsqueda, filtros (categoría, condición) y paginación |
| `/marketplace/[id]` | `(store)/marketplace/[id]/page.tsx` | COMPLETO | Detalle de listing del marketplace con imágenes, vendedor y agregar al carrito |
| `/carrito` | `(store)/carrito/page.tsx` | COMPLETO | Carrito de compras agrupado por vendedor, actualizar cantidades, eliminar items |
| `/checkout` | `(store)/checkout/page.tsx` | COMPLETO | Checkout multi-paso: método entrega, dirección, cálculo envío, pago (efectivo/MP), canje puntos |
| `/checkout/mp-return` | `(store)/checkout/mp-return/page.tsx` | COMPLETO | Retorno de Mercado Pago: polling de estado de pago y pantalla de resultado |
| `/puntos` | `(store)/puntos/page.tsx` | COMPLETO | Dashboard MOOVER completo: balance, niveles, QR referido, compartir código, historial, regalar puntos, stats referidos |
| `/mi-perfil` | `(store)/mi-perfil/page.tsx` | COMPLETO | Perfil de usuario: datos, activación de roles (vendedor/repartidor), canjes, logout |
| `/mi-perfil/datos` | `(store)/mi-perfil/datos/page.tsx` | COMPLETO | Edición de datos personales |
| `/mi-perfil/direcciones` | `(store)/mi-perfil/direcciones/page.tsx` | COMPLETO | Gestión de direcciones guardadas |
| `/mi-perfil/favoritos` | `(store)/mi-perfil/favoritos/page.tsx` | PARCIAL | Lista de favoritos (depende de API de favoritos) |
| `/mi-perfil/cambiar-password` | `(store)/mi-perfil/cambiar-password/page.tsx` | COMPLETO | Cambio de contraseña |
| `/mis-pedidos` | `(store)/mis-pedidos/page.tsx` | COMPLETO | Historial de pedidos del comprador |
| `/mis-pedidos/[orderId]` | `(store)/mis-pedidos/[orderId]/page.tsx` | COMPLETO | Detalle de un pedido con tracking, calificación de repartidor |
| `/login` | `(store)/login/page.tsx` | COMPLETO | Login del portal comprador (renderiza `PortalLoginForm`) |
| `/registro` | `(store)/registro/page.tsx` | COMPLETO | Registro de usuario con soporte para código de referido |

**Layout:** `(store)/layout.tsx` — AppHeader + BottomNav + CartSidebar + WelcomeSplash + PromoPopup

---

### 🏍️ repartidor/ — Portal Repartidor

| Path | Archivo | Estado | Qué hace |
|------|---------|--------|----------|
| `/repartidor` | `repartidor/(protected)/dashboard/page.tsx` | COMPLETO | SPA dashboard (991 líneas): mapa interactivo, bottom sheet, estado online/offline, ofertas de pedido, aceptar/rechazar, seguimiento, navegación GPS |
| `/repartidor/historial` | `repartidor/(protected)/historial/page.tsx` | COMPLETO | Historial de entregas del repartidor con estadísticas |
| `/repartidor/perfil` | `repartidor/(protected)/perfil/page.tsx` | COMPLETO | Perfil del repartidor: datos, zona, rating promedio |
| `/repartidor/login` | `repartidor/login/page.tsx` | COMPLETO | Login del portal repartidor |
| `/repartidor/registro` | `repartidor/registro/page.tsx` | COMPLETO | Registro de repartidor |

**Layout:** SPA — SPA dentro de `dashboard/page.tsx` con `Sidebar`, `RiderBottomNav`, `BottomSheet`, `RiderMiniMap` (componentes dinámicos)

---

### 🏪 comercios/ — Portal Comercio

| Path | Archivo | Estado | Qué hace |
|------|---------|--------|----------|
| `/comercios` | `comercios/(protected)/page.tsx` | COMPLETO | Dashboard del comercio: stats, pedidos recientes, acciones rápidas |
| `/comercios/pedidos` | `comercios/(protected)/pedidos/page.tsx` | COMPLETO | Lista de pedidos del comercio con filtros y estados |
| `/comercios/productos` | `comercios/(protected)/productos/page.tsx` | COMPLETO | Administración de productos: listado, activar/desactivar, stock |
| `/comercios/productos/nuevo` | `comercios/(protected)/productos/nuevo/page.tsx` | COMPLETO | Formulario para agregar nuevo producto |
| `/comercios/productos/[id]` | `comercios/(protected)/productos/[id]/page.tsx` | COMPLETO | Edición de producto existente |
| `/comercios/productos/desde-paquetes` | `comercios/(protected)/productos/desde-paquetes/page.tsx` | COMPLETO | Importación de productos desde paquetes adquiridos |
| `/comercios/adquirir-paquetes` | `comercios/(protected)/adquirir-paquetes/page.tsx` | COMPLETO | Catálogo de paquetes de productos para adquirir |
| `/comercios/checkout` | `comercios/(protected)/checkout/page.tsx` | COMPLETO | Checkout para adquisición de paquetes |
| `/comercios/configuracion` | `comercios/(protected)/configuracion/page.tsx` | COMPLETO | Configuración del comercio: datos, horarios, zona |
| `/comercios/soporte` | `comercios/(protected)/soporte/page.tsx` | COMPLETO | Chat de soporte con el admin |
| `/comercios/login` | `comercios/login/page.tsx` | COMPLETO | Login del portal comercio |
| `/comercio/registro` | `comercio/registro/page.tsx` | COMPLETO | Registro/onboarding de nuevo comercio |

**Layout:** `comercios/(protected)/layout.tsx` — Sidebar desktop + Header + BottomNav mobile (Inicio/Pedidos/Productos/Paquetes/Soporte/Ajustes)

---

### 🔧 ops/ — Panel Admin

| Path | Archivo | Estado | Qué hace |
|------|---------|--------|----------|
| `/ops` | `ops/(protected)/page.tsx` | COMPLETO | Dashboard admin: KPIs en tiempo real, pedidos recientes |
| `/ops/live` | `ops/(protected)/live/page.tsx` | COMPLETO | Monitoreo en vivo de pedidos y repartidores |
| `/ops/pedidos` | `ops/(protected)/pedidos/page.tsx` | COMPLETO | Gestión de todos los pedidos con filtros, asignación de repartidor |
| `/ops/pedidos/[id]` | `ops/(protected)/pedidos/[id]/page.tsx` | COMPLETO | Detalle de pedido con timeline completo |
| `/ops/comercios` | `ops/(protected)/comercios/page.tsx` | COMPLETO | Lista y gestión de comercios |
| `/ops/comercios/[id]` | `ops/(protected)/comercios/[id]/page.tsx` | COMPLETO | Detalle de un comercio: datos, productos, stats |
| `/ops/productos` | `ops/(protected)/productos/page.tsx` | COMPLETO | Gestión de productos de todos los comercios |
| `/ops/repartidores` | `ops/(protected)/repartidores/page.tsx` | COMPLETO | Lista de repartidores, aprobación, estado |
| `/ops/vendedores` | `ops/(protected)/vendedores/page.tsx` | COMPLETO | Moderación de vendedores particulares |
| `/ops/moderacion` | `ops/(protected)/moderacion/page.tsx` | COMPLETO | Moderación de listings del marketplace |
| `/ops/clientes` | `ops/(protected)/clientes/page.tsx` | COMPLETO | Lista de clientes/usuarios |
| `/ops/clientes/[id]` | `ops/(protected)/clientes/[id]/page.tsx` | COMPLETO | Detalle de cliente: pedidos, puntos, datos |
| `/ops/categorias` | `ops/(protected)/categorias/page.tsx` | COMPLETO | Administración de categorías con reordenamiento |
| `/ops/slides` | `ops/(protected)/slides/page.tsx` | COMPLETO | Gestión del hero slider del home |
| `/ops/puntos` | `ops/(protected)/puntos/page.tsx` | COMPLETO | Configuración del programa de puntos, otorgación manual |
| `/ops/analytics` | `ops/(protected)/analytics/page.tsx` | COMPLETO | Dashboard de analytics y métricas |
| `/ops/configuracion` | `ops/(protected)/configuracion/page.tsx` | COMPLETO | Config general: mantenimiento, promo popups, delivery |
| `/ops/catalogo-paquetes` | `ops/(protected)/catalogo-paquetes/page.tsx` | COMPLETO | Gestión del catálogo de paquetes para comercios |
| `/ops/comisiones` | `ops/(protected)/comisiones/page.tsx` | COMPLETO | Configuración de comisiones |
| `/ops/soporte` | `ops/(protected)/soporte/page.tsx` | COMPLETO | Panel de soporte: chats con comercios |
| `/ops/login` | `ops/login/page.tsx` | COMPLETO | Login del panel admin |

**Layout:** `ops/(protected)/layout.tsx` — `OpsSidebar` component (17 secciones en sidebar desktop, 4 en mobile bottom nav + drawer "Más")

---

### 🏷️ vendedor/ — Portal Vendedor (Marketplace Individual)

| Path | Archivo | Estado | Qué hace |
|------|---------|--------|----------|
| `/vendedor` | `vendedor/(protected)/page.tsx` | COMPLETO | Dashboard de vendedor: stats de ventas, rating, listings activos |
| `/vendedor/listings` | `vendedor/(protected)/listings/page.tsx` | COMPLETO | Mis listings publicados con acciones (editar, pausa, eliminar) |
| `/vendedor/listings/nuevo` | `vendedor/(protected)/listings/nuevo/page.tsx` | COMPLETO | Crear nuevo listing con imágenes, precio, categoría, condición |
| `/vendedor/listings/[id]` | `vendedor/(protected)/listings/[id]/page.tsx` | COMPLETO | Editar listing existente |
| `/vendedor/pedidos` | `vendedor/(protected)/pedidos/page.tsx` | COMPLETO | Pedidos recibidos como vendedor particular |
| `/vendedor/ganancias` | `vendedor/(protected)/ganancias/page.tsx` | COMPLETO | Resumen de ganancias por período |
| `/vendedor/configuracion` | `vendedor/(protected)/configuracion/page.tsx` | COMPLETO | Configuración de perfil de vendedor |

**Layout:** `vendedor/(protected)/layout.tsx` — Sidebar desktop + Header + BottomNav mobile (Dashboard/Listings/Ventas/Ganancias/Config) — Color verde esmeralda

---

### 🌐 / — Páginas Públicas

| Path | Archivo | Estado | Qué hace |
|------|---------|--------|----------|
| `/` | `page.tsx` (→ LandingPage) | COMPLETO | Redirige a componente `LandingPage` |
| `/landing` | `landing/page.tsx` | COMPLETO | Landing principal (761 líneas): hero slider 3 slides (Tienda, Jobs, MOOVY X), sección comunidad, footer |
| `/nosotros` | `nosotros/page.tsx` | COMPLETO | Página "Sobre nosotros": historia de Moovy, misión, foto del equipo |
| `/contacto` | `contacto/page.tsx` | COMPLETO | Contacto: WhatsApp, email, Instagram, ubicación, horarios, CTA rápido |
| `/terminos` | `terminos/page.tsx` | COMPLETO | Términos y Condiciones completos (12 secciones, 220 líneas) |
| `/privacidad` | `privacidad/page.tsx` | COMPLETO | Política de Privacidad completa (11 secciones, 215 líneas) |
| `/terminos-moover` | `terminos-moover/page.tsx` | COMPLETO | Términos específicos del programa MOOVER (puntos, referidos, canje, regalos) |
| `/moover` | `moover/page.tsx` | COMPLETO | Landing del programa MOOVER |
| `/moovyx` | `moovyx/page.tsx` | COMPLETO | Landing de MOOVY X (futuro servicio) |
| `/mantenimiento` | `mantenimiento/page.tsx` | COMPLETO | Página de modo mantenimiento |
| `/logout` | `logout/page.tsx` | COMPLETO | Pantalla de cierre de sesión |
| `/seguimiento/[orderId]` | `seguimiento/[orderId]/page.tsx` | COMPLETO | Seguimiento público de un pedido |

### 🏢 comex/ — Portal COMEX (Comercio Exterior / Otro)

| Path | Archivo | Estado | Qué hace |
|------|---------|--------|----------|
| `/comex` | `comex/page.tsx` | PARCIAL | Dashboard de COMEX |
| `/comex/productos` | `comex/productos/page.tsx` | PARCIAL | Lista de productos COMEX |
| `/comex/productos/[id]` | `comex/productos/[id]/page.tsx` | PARCIAL | Detalle producto COMEX |
| `/comex/login` | `comex/login/page.tsx` | COMPLETO | Login del portal COMEX |

---

## 2. COMPONENTES DE NAVEGACIÓN

### 🛒 (store) — Tienda

| Componente | Tipo | Descripción |
|------------|------|-------------|
| `AppHeader` | Topbar fijo | Logo central, saludo usuario (o ubicación si anónimo), badge de puntos MOOVER, botón carrito con contador. Desktop y mobile. |
| `BottomNav` | Bottom nav fijo | 5 tabs: **Inicio** (`/tienda`), **Buscar** (`/productos`), **MOOVER** (`/puntos` — botón central destacado), **Pedidos** (`/mis-pedidos`), **Perfil** (`/mi-perfil` o Login) |
| `CartSidebar` | Drawer lateral | Panel del carrito que se desliza desde la derecha |

- ✅ **¿Links al Marketplace?** Sí, desde el home de la tienda (sección "Marketplace" con link "Ver más")
- ✅ **¿Links al perfil?** Sí, desde AppHeader (avatar) y BottomNav ("Perfil")
- ✅ **¿Switch de rol (comprador ↔ vendedor)?** Sí, desde `/mi-perfil` (sección "Oportunidades MOOVY") con botones para activar rol Vendedor y Repartidor

### 🏍️ repartidor/ — Portal Repartidor

| Componente | Tipo | Descripción |
|------------|------|-------------|
| `Sidebar` | Drawer lateral | Menú lateral con secciones: Dashboard, Historial, Ganancias, Perfil, Soporte, Configuración |
| `RiderBottomNav` | Bottom nav | Navegación entre vistas del SPA |
| `BottomSheet` | Sheet inferior | Panel deslizable sobre el mapa para info del pedido activo, navegación paso a paso |

- ❌ **¿Links al Marketplace?** No
- ✅ **¿Links al perfil?** Sí, desde Sidebar → "Perfil"
- ❌ **¿Switch de rol?** No (portal independiente)

### 🏪 comercios/ — Portal Comercio

| Componente | Tipo | Descripción |
|------------|------|-------------|
| Sidebar desktop | Sidebar fija | Inicio, Pedidos, Productos, Paquetes, Soporte, Ajustes |
| Header mobile | Topbar | Logo + logout |
| BottomNav mobile | Bottom nav | 6 items: Inicio, Pedidos, Productos, Paquetes, Soporte, Ajustes |

- ❌ **¿Links al Marketplace?** No
- ❌ **¿Links al perfil de usuario?** No (hay configuración del comercio)
- ❌ **¿Switch de rol?** No (portal independiente)

### 🔧 ops/ — Panel Admin

| Componente | Tipo | Descripción |
|------------|------|-------------|
| `OpsSidebar` | Sidebar fija + drawer | 17 secciones: Dashboard, En Vivo, Catálogo Paquetes, Productos Comercios, Pedidos, Comercios, Repartidores, Vendedores, Moderación, Clientes, Soporte, Categorías, Hero Slider, Puntos, Analytics, Config, Comisiones |
| Mobile top bar | Topbar | Logo + hamburger |
| Mobile bottom nav | Bottom nav | 4 items principales + "Más" (abre drawer) |

- ✅ **¿Links al Marketplace?** Indirecto (Vendedores, Moderación)
- ❌ **¿Links al perfil de usuario?** Muestra nombre/avatar del admin en sidebar
- ❌ **¿Switch de rol?** No. Tiene link "Ir a la Tienda" en footer del sidebar

### 🏷️ vendedor/ — Portal Vendedor

| Componente | Tipo | Descripción |
|------------|------|-------------|
| Sidebar desktop | Sidebar fija | Dashboard, Mis Listings, Mis Ventas, Ganancias, Configuración |
| Header mobile | Topbar | Logo vendedor + logout |
| BottomNav mobile | Bottom nav | 5 items iguales al sidebar |

- ❌ **¿Links al Marketplace?** No directamente
- ❌ **¿Links al perfil de usuario?** Muestra nombre en sidebar
- ❌ **¿Switch de rol?** No (portal independiente)

---

## 3. FLUJOS INCOMPLETOS

### UI sin API conectada

| Funcionalidad | Archivo UI | Estado API |
|---------------|-----------|------------|
| Favoritos | `(store)/mi-perfil/favoritos/page.tsx` | No verificado — puede faltar endpoint dedicado a favoritos |
| Portal COMEX | `comex/page.tsx`, `comex/productos/page.tsx` | Portal separado, posiblemente incompleto (PARCIAL) |

### API sin UI completa

| Endpoint API | Qué hace | ¿Tiene UI? |
|-------------|----------|------------|
| `api/cart/reorder/route.ts` | Reordenar un pedido anterior | No hay botón visible de "Repetir pedido" |
| `api/delivery/availability/route.ts` | Verificar disponibilidad de delivery | Usado internamente en checkout |
| `api/admin/points/config/route.ts` | Configuración avanzada de puntos (duplicado con `api/admin/points-config`) | Se usa en `/ops/puntos`, pero hay endpoints duplicados |
| `api/debug-cookies/route.ts` | Debug de cookies | Solo para desarrollo |
| `api/debug-session/route.ts` | Debug de sesión | Solo para desarrollo |

### Observaciones de integridad

- **Catálogo de Canje de puntos:** La UI en `/puntos` muestra un teaser con badge "PRÓXIMAMENTE" para el catálogo de canje. No existe API ni UI para canjear puntos por productos/experiencias (solo canje por descuento en checkout).
- **Notificaciones push:** Integradas en el dashboard del repartidor. No implementadas para compradores ni comercios.
- **Búsqueda global:** `/productos` tiene búsqueda de productos de comercios. El marketplace tiene su propia búsqueda. No hay una búsqueda unificada.

---

## 4. LANDING PAGE ACTUAL

**Archivo:** `landing/page.tsx` (761 líneas)

### Secciones actuales:

1. **Hero Slider** — 3 slides con animación:
   - **Slide 1 (Tienda):** "Todo Ushuaia en tus manos" → CTA: "Pedir ahora" → `/tienda`
   - **Slide 2 (Jobs):** "Trabajá cuando quieras" → CTA: "Quiero ser repartidor" → `/repartidor/registro`
   - **Slide 3 (MOOVY X):** "MOOVY X · Próximamente" → CTA: "Más info" → `/moovyx`

2. **Sección Comunidad** (3 tarjetas):
   - **"Pedí tu comida"** → `/tienda`
   - **"Sé parte del equipo"** → `/repartidor/registro`
   - **"Registrá tu negocio"** → `/comercio/registro`

3. **Footer** con links a Términos, Privacidad, Instagram

### ¿Menciona el Marketplace?
- ❌ **No directamente desde el landing.** El Marketplace se accede desde el home de la tienda (`/tienda`), pero el landing (`/`) no tiene link directo.

### ¿Menciona el Programa MOOVER?
- ❌ **No en el landing principal.** Se accede desde el BottomNav y desde el home de la tienda.

### ¿Menciona posibilidad de vender?
- ❌ **No directamente.** El landing menciona "Registrá tu negocio" (comercios), pero no menciona ventas individuales (marketplace/vendedor).

### ¿Links de registro unificados?
- ✅ **Registro de repartidor** desde landing
- ✅ **Registro de comercio** desde landing
- ❌ **Registro de vendedor** NO mencionado en landing (se activa desde `/mi-perfil`)
- ❌ **Registro general de comprador** NO enlazado directamente (el usuario entra desde `/tienda` → login/registro)

---

## 5. PÁGINAS LEGALES

| Página | Path | Archivo | Contenido | Estado |
|--------|------|---------|-----------|--------|
| Términos y Condiciones | `/terminos` | `terminos/page.tsx` | ✅ Contenido REAL — 12 secciones completas (220 líneas): Introducción, Naturaleza del servicio, Exclusión responsabilidad, Comercios, Delivery, Programa MOOVER, Modelo negocio, Uso aceptable, Propiedad intelectual, Modificaciones, Ley aplicable (Argentina), Contacto | COMPLETO |
| Política de Privacidad | `/privacidad` | `privacidad/page.tsx` | ✅ Contenido REAL — 11 secciones completas (215 líneas): Info recolectada, Uso, Compartir, Seguridad, Cookies, Derechos ARCO (Ley 25.326), Retención, Menores, Cambios, Contacto | COMPLETO |
| Contacto | `/contacto` | `contacto/page.tsx` | ✅ Contenido REAL — WhatsApp, email, Instagram, ubicación, horarios, CTAs para comercio/repartidor | COMPLETO |
| Términos MOOVER | `/terminos-moover` | `terminos-moover/page.tsx` | ✅ Contenido REAL — Valor puntos, cómo ganar, sistema de referidos, regalo de puntos, info legal | COMPLETO |
| Nosotros | `/nosotros` | `nosotros/page.tsx` | ✅ Contenido REAL — Historia en Ushuaia, misión, foto equipo, CTAs | COMPLETO |
| Ayuda | `/ayuda` | ❌ No existe | Enlazado desde perfil (`mi-perfil`) y nosotros, pero la página NO EXISTE. Los links a `/ayuda` dan 404 | FALTANTE |

---

## 6. RATINGS Y REVIEWS

### Componentes existentes

| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `components/orders/RateDriverModal.tsx` | Componente UI (165 líneas) | Modal para calificar repartidor: 1-5 estrellas + comentario opcional. POST a `/api/orders/[id]/rate` |
| `api/orders/[id]/rate/route.ts` | API endpoint | Recibe rating + comentario, guarda calificación del repartidor |
| `components/store/MerchantCard.tsx` | Componente UI | Muestra rating en la tarjeta del comercio (campo `rating` del merchant) |
| `components/store/ListingCard.tsx` | Componente UI | Muestra rating del vendedor en la tarjeta del listing |
| `components/rider/views/ProfileView.tsx` | Componente UI | Muestra rating promedio del repartidor en su perfil |
| `components/rider/views/HistoryView.tsx` | Componente UI | Muestra rating recibido en cada entrega del historial |

### Estado actual:

- ✅ **Rating de repartidores:** Flujo completo (UI modal → API → perfil repartidor)
- ⚠️ **Rating de comercios:** Se muestra en `MerchantCard` pero no se encontró flujo para que el comprador DEJE un rating al comercio
- ⚠️ **Rating de vendedores del marketplace:** Se muestra en `ListingCard` pero no se encontró flujo para que el comprador DEJE un rating al vendedor
- ❌ **Reviews escritos de productos:** No existen. No hay modelo ni UI para reviews textuales de productos
- ❌ **Reviews de comercios:** No existen como sistema independiente

---

## 7. ESTADO DEL PROGRAMA MOOVER

### `/puntos` — Dashboard MOOVER (1117 líneas)

| Feature | Estado | Detalles |
|---------|--------|---------|
| Balance de puntos | ✅ COMPLETO | Se muestra prominente en hero card rojo, con badge "#SoyMoover" |
| Niveles (Moover → Pro → Leyenda) | ✅ COMPLETO | 3 niveles basados en `pointsLifetime`: Moover (<300K), Pro (300K-1M), Leyenda (>1M). Barra de progreso visual |
| Modal de beneficios por nivel | ✅ COMPLETO | Se abre al tocar la tarjeta de nivel |
| Código QR de referido | ✅ COMPLETO | Genera QR con código de referido, descarga como PNG con template |
| Compartir código | ✅ COMPLETO | Web Share API en mobile, WhatsApp fallback, clipboard en desktop |
| Copiar código | ✅ COMPLETO | Clipboard API + fallback |
| Stats de referidos | ✅ COMPLETO | Total amigos invitados, puntos por referidos, stats mensuales |
| Lista de amigos invitados | ✅ COMPLETO | Modal con lista de amigos, nombres, puntos ganados por cada uno |
| Regalar puntos | ✅ COMPLETO | Modal para enviar puntos por email, validaciones, POST a `/api/moover/gift` |
| Historial de movimientos | ✅ COMPLETO | Lista scrollable con tipo de transacción, monto, saldo, fecha |
| Cómo ganar puntos | ✅ COMPLETO | Sección expandible: comprando (1pt/$1), refiriendo (500pts), bono de bienvenida (250pts) |
| Cómo usar puntos | ✅ COMPLETO | Info de canje en checkout |
| Catálogo de canje por productos | ⏳ PRÓXIMAMENTE | Teaser visible con badge "PRÓXIMAMENTE" |
| Landing anónimo | ✅ COMPLETO | Versión para usuarios no logueados: beneficios, CTA de registro |

### Checkout — Canje de puntos

| Feature | Estado | Detalles |
|---------|--------|---------|
| Slider de puntos | ✅ COMPLETO | En `checkout/page.tsx`: permite elegir cuántos puntos usar, muestra descuento equivalente |
| Cálculo de descuento | ✅ COMPLETO | Descuento máximo del 50% del subtotal, mínimo 500 puntos |
| Integración con API de puntos | ✅ COMPLETO | Se envía `pointsToRedeem` al crear orden, se debitan los puntos |

### Upgrade automático de nivel

| Feature | Estado | Detalles |
|---------|--------|---------|
| Cálculo de nivel | ✅ COMPLETO (Frontend) | En UI: se calcula en base a `pointsLifetime` con thresholds hardcodeados (300K Pro, 1M Leyenda) |
| Lógica backend de niveles | ⚠️ No verificado | La lógica de niveles parece ser solo del frontend (display). No se encontró un campo `level` en el modelo de usuario ni lógica de upgrade automático en backend |

---

## 8. ACCESO AL MARKETPLACE

| Punto de acceso | Ubicación | Tipo | Destino |
|----------------|-----------|------|---------|
| Home tienda | `(store)/page.tsx` — Sección "Marketplace" | Link "Ver más" | `/marketplace` |
| URL directa | Browser | Ruta Next.js | `/marketplace` (dentro de layout `(store)`) |
| BottomNav | `BottomNav.tsx` | ❌ No tiene link | — |
| AppHeader | `AppHeader.tsx` | ❌ No tiene link | — |
| Landing principal | `landing/page.tsx` | ❌ No mencionado | — |
| Perfil | `mi-perfil/page.tsx` | ❌ No mencionado | — |

### Estado del Marketplace

- ✅ **Listado de publicaciones:** Funcional con paginación (`/api/listings`)
- ✅ **Filtros:** Categoría, condición (nuevo/usado/reacondicionado), búsqueda de texto
- ✅ **Detalle de listing:** Página individual con imágenes, info del vendedor, agregar al carrito
- ✅ **Panel vendedor:** Portal completo para gestionar listings (`/vendedor`)
- ✅ **Moderación OPS:** Panel de moderación en `/ops/moderacion` y `/ops/vendedores`
- ⚠️ **Accesibilidad limitada:** Solo accesible desde una sección del home de la tienda. No está en la navegación principal (BottomNav, AppHeader, Landing).

---

## Resumen de Conteo

| Métrica | Valor |
|---------|-------|
| Total de páginas (page.tsx) | 88 |
| Total de API routes (route.ts) | 106 |
| Portales | 7 (store, repartidor, comercios, ops, vendedor, comex, público) |
| Páginas COMPLETAS | ~80 (estimado) |
| Páginas PARCIALES | ~5 (comex, favoritos) |
| Páginas STUB/ROTAS | 0 detectadas |
| Páginas legales con contenido real | 5/5 verificadas |
