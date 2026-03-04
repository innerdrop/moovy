# MOOVY — Prompts Fase 2
> Ejecutar en Antigravity con **Planning activado** + **Claude Opus 4.6**
> ⚠️ Ejecutar en orden. Cada prompt depende del anterior.

---

## PROMPT 2.0-A — Botón Aprobar Driver en OPS
> **Rama:** `feat/ops-approve-driver`
> **Alcance:** `src/app/ops/(protected)/repartidores/page.tsx`
> **Complejidad:** Baja
> **Antes de pegar:** mencioná `@src/app/ops/(protected)/repartidores/page.tsx`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4).

CONTEXTO:
El archivo ops/(protected)/repartidores/page.tsx (680 líneas) gestiona
los repartidores. Ya existe el endpoint PUT /api/admin/drivers/[id]/approve
pero no hay ningún botón en la UI para usarlo.

TAREA:
Modificar repartidores/page.tsx para agregar un botón "Aprobar" en la
lista de repartidores que tengan isActive = false.

REQUERIMIENTOS:
1. Solo mostrar el botón "Aprobar" en drivers con isActive = false
2. Al hacer click llamar a PUT /api/admin/drivers/[id]/approve
3. Mostrar estado de carga mientras se procesa
4. Al aprobar exitosamente:
   - Actualizar el estado local sin recargar la página
   - Mostrar un toast/mensaje de éxito
   - El driver debe cambiar visualmente a "Activo"
5. Mantener el diseño visual consistente con los botones existentes en esa página

NO modificar ningún otro archivo.
Mostrarme el plan antes de ejecutar.
```

---

## PROMPT 2.0-B — Notificaciones push al comprador
> **Rama:** `feat/push-buyer-notifications`
> **Alcance:** `src/lib/notifications.ts` (nuevo) + rutas de cambio de estado de Order
> **Complejidad:** Baja
> **Antes de pegar:** mencioná `@src/app/api/orders` y `@src/app/api/push`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, Prisma 5).

CONTEXTO:
La infraestructura de push notifications ya está completa:
- VAPID keys configuradas
- Service Worker registrado
- PushSubscription almacenada en BD por userId
- API funcional en /api/push/send

HOY solo se notifica al RIDER cuando le llega un pedido.
El COMPRADOR no recibe ninguna notificación de los estados de su pedido.

TAREA:

1. Crear src/lib/notifications.ts con función:
   notifyBuyer(userId: string, status: string, orderNumber: string)
   
   Que envíe los siguientes mensajes según el status:
   - CONFIRMED  → "Tu pedido [orderNumber] fue confirmado ✅"
   - PREPARING  → "Tu pedido [orderNumber] se está preparando 👨‍🍳"
   - READY      → "Tu pedido [orderNumber] está listo 📦"
   - IN_DELIVERY → "Tu pedido [orderNumber] está en camino 🛵"
   - DELIVERED  → "Tu pedido [orderNumber] fue entregado ✅"
   - CANCELLED  → "Tu pedido [orderNumber] fue cancelado ❌"

   La función debe:
   - Buscar las PushSubscriptions activas del userId
   - Llamar internamente a la lógica de /api/push/send
   - Ser no-bloqueante (no debe frenar el cambio de estado si falla)

2. Identificar en el codebase dónde se actualizan los estados de Order
   (probablemente en api/orders/[id]/route.ts o similar)

3. Agregar llamadas a notifyBuyer() en cada cambio de estado,
   pasando el userId del comprador y el orderNumber

NO modificar la lógica de notificaciones al rider.
NO modificar el Service Worker.
Mostrarme el plan con los archivos afectados antes de ejecutar.
```

---

## PROMPT 2.1-A — Layout y Dashboard del vendedor individual
> **Rama:** `feat/seller-panel-layout`
> **Alcance:** `src/app/vendedor/` (nuevo portal)
> **Complejidad:** Media
> **Antes de pegar:** mencioná `@src/app/comercios/(protected)/layout.tsx` y `@src/app/comercios/(protected)/page.tsx`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4).

CONTEXTO:
El panel de comercios en /comercios/(protected)/ tiene un layout con
sidebar/nav y un dashboard. Necesitamos crear el portal del vendedor
individual en /vendedor/ reutilizando ese diseño como base.

DIFERENCIAS con el panel de comercios:
- El vendedor individual vende Listings (no Products de Merchant)
- No tiene configuración de horarios ni delivery fee
- El acceso requiere rol SELLER (no COMERCIO) en la sesión

TAREA:

1. Crear src/app/vendedor/(protected)/layout.tsx
   - Reutilizar la estructura del layout de comercios
   - Sidebar con items: Dashboard, Mis Listings, Mis Ventas, Ganancias, Configuración
   - Proteger con verificación de rol SELLER usando hasRole() de src/lib/auth-utils.ts
   - Si no tiene rol SELLER redirigir a /mi-perfil con mensaje

2. Crear src/app/vendedor/(protected)/page.tsx (Dashboard)
   - Reutilizar el diseño del dashboard de comercios como base
   - Mostrar cards con:
     * Total de Listings activas (desde GET /api/seller/listings)
     * Ventas del mes (desde SubOrders completados)
     * Ganancias del mes (suma de sellerPayout)
     * Rating promedio del SellerProfile
   - Mostrar las 5 últimas Listings publicadas

3. Crear src/app/vendedor/page.tsx (redirect)
   - Si está logueado con rol SELLER → redirigir a /vendedor/dashboard
   - Si no → redirigir a /mi-perfil

Mostrarme el plan con todos los archivos a crear antes de ejecutar.
```

---

## PROMPT 2.1-B — CRUD de Listings en el panel vendedor
> **Rama:** `feat/seller-listings-crud`
> **Requiere:** Prompt 2.1-A mergeado
> **Alcance:** `src/app/vendedor/(protected)/listings/` + componentes
> **Complejidad:** Media
> **Antes de pegar:** mencioná `@src/components/comercios/NewProductForm.tsx` y `@src/components/ui/ImageUpload.tsx`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4).
YA EXISTE el layout del portal vendedor en /vendedor/(protected)/

CONTEXTO:
El componente NewProductForm.tsx (429 líneas) crea productos para comercios.
Necesitamos adaptarlo para crear Listings de vendedores individuales.

Diferencias clave entre Product y Listing:
- Listing tiene: condition (NUEVO/USADO/REACONDICIONADO), no tiene variantes,
  no tiene costPrice, usa ListingImage en lugar de ProductImage
- Las APIs ya existen: GET/POST /api/seller/listings
  y necesitamos agregar GET/PUT/DELETE /api/seller/listings/[id]

TAREA:

1. Crear /api/seller/listings/[id]/route.ts con:
   - GET: obtener una Listing por id (verificar que pertenece al seller)
   - PUT: actualizar título, descripción, precio, stock, condición, categoryId
   - DELETE: desactivar la listing (isActive = false, no eliminar)

2. Crear componente src/components/seller/NewListingForm.tsx
   Basado en NewProductForm.tsx pero adaptado:
   - Campos: título, descripción, precio, stock
   - Select de condición: NUEVO / USADO / REACONDICIONADO
   - Select de categoría (desde /api/categories)
   - Subida de imágenes usando ImageUpload.tsx existente
   - Sin campos de variantes, costPrice ni merchantId

3. Crear componente src/components/seller/EditListingForm.tsx
   Similar al anterior pero con datos pre-cargados para edición

4. Crear páginas:
   - /vendedor/(protected)/listings/page.tsx
     → Lista todas las Listings del vendedor
     → Botones: Crear, Editar, Activar/Desactivar
   - /vendedor/(protected)/listings/nuevo/page.tsx
     → Formulario de creación con NewListingForm
   - /vendedor/(protected)/listings/[id]/page.tsx
     → Formulario de edición con EditListingForm

Mostrarme el plan con todos los archivos antes de ejecutar.
```

---

## PROMPT 2.1-C — Mis Ventas y Ganancias del vendedor
> **Rama:** `feat/seller-orders-earnings`
> **Requiere:** Prompts 2.1-A y 2.1-B mergeados
> **Alcance:** `/api/seller/orders` (nuevo) + páginas de ventas y ganancias
> **Complejidad:** Media
> **Antes de pegar:** mencioná `@src/app/vendedor/(protected)/` y `@prisma/schema.prisma`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4, Prisma 5).
YA EXISTE el portal vendedor con CRUD de Listings.

TAREA:

1. Crear /api/seller/orders/route.ts (GET):
   - Requiere sesión con rol SELLER
   - Obtener el SellerProfile del usuario autenticado
   - Devolver todos los SubOrders donde sellerId = SellerProfile.id
   - Incluir: items, order (con orderNumber, createdAt), estado, total, sellerPayout
   - Permitir filtro por status en query param

2. Crear /vendedor/(protected)/pedidos/page.tsx
   - Listar SubOrders del vendedor agrupados por estado
   - Mostrar: orderNumber, items, total, sellerPayout, estado, fecha
   - Diseño similar a la página de pedidos del panel de comercios

3. Crear /vendedor/(protected)/ganancias/page.tsx
   - Resumen mensual de ganancias (suma de sellerPayout de SubOrders DELIVERED)
   - Total del mes actual vs mes anterior
   - Historial de pagos recibidos
   - Datos bancarios configurados (bankAlias/bankCbu del SellerProfile)

4. Crear /vendedor/(protected)/configuracion/page.tsx
   - Formulario para editar el SellerProfile:
     displayName, bio, avatar, bankAlias, bankCbu
   - Usar PUT /api/seller/profile existente

Mostrarme el plan antes de ejecutar.
```

---

## PROMPT 2.2-A — API pública de Listings + ListingCard
> **Rama:** `feat/marketplace-api-card`
> **Requiere:** Prompts 2.1-A/B/C mergeados
> **Alcance:** `/api/listings/` (nuevo) + componente ListingCard
> **Complejidad:** Media
> **Antes de pegar:** mencioná `@src/components/store/ProductCard.tsx`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4, Prisma 5).

TAREA:

1. Crear /api/listings/route.ts (GET público, sin auth):
   - Devolver Listings activas con isActive = true
   - Incluir: seller (displayName, rating, avatar), images, category
   - Soportar query params: categoryId, condition, search (título), limit, offset
   - Ordenar por createdAt DESC por defecto

2. Crear /api/listings/[id]/route.ts (GET público):
   - Devolver una Listing por id con todos sus datos
   - Incluir seller completo, imágenes, categoría
   - Si isActive = false devolver 404

3. Crear componente src/components/store/ListingCard.tsx
   Basado en ProductCard.tsx pero adaptado para Listings:
   - Mostrar: imagen principal, título, precio, condición (badge USADO/NUEVO),
     nombre del seller, rating del seller
   - Badge de condición con colores: NUEVO=verde, USADO=naranja, REACONDICIONADO=azul
   - Diseño consistente con ProductCard existente
   - Link a /marketplace/[id]

Mostrarme el plan antes de ejecutar.
```

---

## PROMPT 2.2-B — Página Marketplace en la tienda
> **Rama:** `feat/marketplace-page`
> **Requiere:** Prompt 2.2-A mergeado
> **Alcance:** `src/app/(store)/marketplace/` + modificar home
> **Complejidad:** Media
> **Antes de pegar:** mencioná `@src/app/(store)/page.tsx` y `@src/app/(store)/productos/page.tsx`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4).
YA EXISTE /api/listings y el componente ListingCard.

TAREA:

1. Crear /src/app/(store)/marketplace/page.tsx
   - Título: "Marketplace — Vendedores particulares"
   - Grid de ListingCards con filtros:
     * Por categoría (select)
     * Por condición (NUEVO / USADO / REACONDICIONADO)
     * Búsqueda por texto
   - Paginación o infinite scroll
   - Diseño consistente con /productos/page.tsx

2. Crear /src/app/(store)/marketplace/[id]/page.tsx
   - Detalle de una Listing:
     * Galería de imágenes
     * Título, precio, condición, descripción
     * Info del seller: avatar, displayName, rating, totalSales
     * Botón "Comprar" (por ahora redirigir a WhatsApp del seller o mostrar
       mensaje de contacto — el checkout multi-vendor viene en Fase 2.3)
     * Categoría con link de vuelta al marketplace

3. Modificar src/app/(store)/page.tsx (Home):
   - Agregar una sección "Marketplace" después de las categorías existentes
   - Mostrar las 4 Listings más recientes usando ListingCard
   - Botón "Ver todo el Marketplace" → /marketplace

4. Agregar link "Marketplace" en la navegación de la tienda
   (donde estén los links de navegación existentes)

Mantener el diseño visual consistente con el resto de la tienda.
Mostrarme el plan con todos los archivos afectados antes de ejecutar.
```

---

## PROMPT 2.3 — Checkout multi-vendedor
> **Rama:** `feat/checkout-multivendor`
> **Requiere:** Todos los prompts anteriores mergeados
> **Alcance:** `src/store/cart.ts` · carrito · checkout · `/api/orders`
> **Complejidad:** Alta ⚠️
> **Antes de pegar:** mencioná `@src/store/cart.ts`, `@src/app/(store)/carrito/page.tsx` y `@src/app/(store)/checkout/page.tsx`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4, Prisma 5).
YA EXISTE el modelo SubOrder en la BD y el Marketplace con Listings.

CONTEXTO ACTUAL:
- cart.ts (Zustand) enforcea un solo merchantId por carrito
- checkout/page.tsx (817 líneas) requiere un merchantId fijo
- api/orders/route.ts crea Order con merchantId único, sin SubOrders

OBJETIVO:
Permitir que un comprador agregue al carrito tanto Products de Merchants
como Listings de Sellers, y al hacer checkout se generen SubOrders
automáticamente por cada vendedor.

TAREA:

1. Modificar src/store/cart.ts:
   - Agregar a CartItem: sellerId?: string, sellerName?: string,
     type: 'product' | 'listing'
   - Eliminar la restricción de single-merchant
   - Agregar función groupByVendor() que agrupe items por merchantId o sellerId

2. Modificar src/app/(store)/carrito/page.tsx:
   - Mostrar items agrupados por vendedor/comercio
   - Cada grupo con: nombre del vendedor, subtotal del grupo
   - Calcular delivery fee por grupo si aplica

3. Modificar src/app/(store)/checkout/page.tsx:
   - Mostrar resumen agrupado por vendedor
   - Calcular total general sumando todos los grupos
   - Al confirmar, enviar al API los grupos de items separados

4. Modificar /api/orders/route.ts:
   - Al recibir un pedido con items de múltiples vendedores:
     * Crear 1 Order principal con isMultiVendor = true
     * Por cada grupo de items, crear 1 SubOrder con:
       - merchantId O sellerId según corresponda
       - Los OrderItems del grupo con subOrderId asignado
       - Subtotal, deliveryFee y total del grupo
   - Si hay un solo vendedor, mantener el flujo actual

IMPORTANTE:
- Los pedidos existentes (single-merchant) deben seguir funcionando igual
- No romper el sistema de asignación de riders (logistics.ts)
- Mostrarme el plan completo con todos los archivos afectados antes de ejecutar
```

---

## PROMPT 2.4 — Panel OPS: Vendedores y Moderación
> **Rama:** `feat/ops-sellers-moderation`
> **Requiere:** Todos los prompts anteriores mergeados
> **Alcance:** `/ops/(protected)/vendedores/` + `/ops/(protected)/moderacion/` + APIs admin
> **Complejidad:** Media
> **Antes de pegar:** mencioná `@src/app/ops/(protected)/comercios/` y `@src/app/ops/(protected)/layout.tsx`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, React 19, Tailwind v4, Prisma 5).

TAREA:

1. Crear /api/admin/sellers/route.ts (GET):
   - Listar todos los SellerProfiles con datos del User
   - Soportar filtros: isActive, isVerified, search por nombre/email

2. Crear /api/admin/sellers/[id]/route.ts (PUT):
   - Verificar un seller: isVerified = true
   - Suspender un seller: isActive = false
   - Reactivar un seller: isActive = true

3. Crear /api/admin/listings/route.ts (GET):
   - Listar todas las Listings con datos del seller
   - Filtros: isActive, condition, categoryId

4. Crear /api/admin/listings/[id]/route.ts (PUT):
   - Aprobar listing: isActive = true
   - Rechazar/pausar listing: isActive = false

5. Crear /ops/(protected)/vendedores/page.tsx:
   - Tabla de vendedores con: nombre, email, totalSales, rating,
     isVerified, isActive
   - Botones: Verificar, Suspender, Reactivar
   - Diseño consistente con /ops/(protected)/comercios/

6. Crear /ops/(protected)/moderacion/page.tsx:
   - Tabla de Listings con: título, seller, precio, condición, isActive
   - Botones: Aprobar, Pausar
   - Filtros por estado

7. Agregar links a "Vendedores" y "Moderación" en el sidebar del panel OPS
   (src/app/ops/(protected)/layout.tsx)

Mostrarme el plan con todos los archivos antes de ejecutar.
```

---

## Orden de ejecución

| # | Prompt | Rama | Depende de | Complejidad |
|---|--------|------|-----------|-------------|
| 2.0-A | Botón aprobar driver en OPS | `feat/ops-approve-driver` | — | Baja |
| 2.0-B | Push notifications al comprador | `feat/push-buyer-notifications` | — | Baja |
| 2.1-A | Layout y Dashboard vendedor | `feat/seller-panel-layout` | 2.0-A y 2.0-B | Media |
| 2.1-B | CRUD de Listings | `feat/seller-listings-crud` | 2.1-A | Media |
| 2.1-C | Mis Ventas y Ganancias | `feat/seller-orders-earnings` | 2.1-B | Media |
| 2.2-A | API pública + ListingCard | `feat/marketplace-api-card` | 2.1-C | Media |
| 2.2-B | Página Marketplace en tienda | `feat/marketplace-page` | 2.2-A | Media |
| 2.3 | Checkout multi-vendedor | `feat/checkout-multivendor` | 2.2-B | Alta ⚠️ |
| 2.4 | OPS Vendedores y Moderación | `feat/ops-sellers-moderation` | 2.3 | Media |

---

## Nota sobre MercadoPago

La integración de pagos online no está incluida en esta fase porque depende de tener el checkout multi-vendedor funcionando primero (Prompt 2.3). Una vez que el Prompt 2.3 esté completo y probado, se puede agregar MercadoPago como Fase 3 — que incluirá cobro al comprador y distribución automática de pagos a cada vendedor y al repartidor.

---

*MOOVY · somosmoovy.com · Fase 2 — UI y Marketplace*
