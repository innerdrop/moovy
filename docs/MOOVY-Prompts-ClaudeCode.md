# MOOVY — Prompts de Refactorización para Claude Code
> Ejecutar en Antigravity con **Planning activado** + **Claude Opus 4.6**
> ⚠️ Ejecutar en orden. Cada prompt depende del anterior.

---

## PROMPT 1 — Refactor del schema: sistema de roles múltiples
> **Alcance:** `prisma/schema.prisma` + script de migración
> **Antes de pegar:** mencioná `@prisma/schema.prisma` en el chat

```
Trabajás sobre el proyecto MOOVY (Next.js 16, Prisma 5, PostgreSQL).
El archivo schema.prisma está en /prisma/schema.prisma.

PROBLEMA ACTUAL:
El modelo User tiene `role String @default("USER")` con valores posibles:
USER, ADMIN, COMERCIO, DRIVER. Un usuario solo puede tener un rol.
Necesitamos que un usuario pueda tener múltiples roles simultáneamente.

CAMBIO REQUERIDO EN EL SCHEMA:

1. Crear enum UserRoleType:
   USER, ADMIN, COMERCIO, DRIVER, SELLER
   (SELLER es nuevo: vendedor individual, distinto de COMERCIO)

2. Crear modelo UserRole (tabla pivot):
   - id: String @id @default(cuid())
   - userId: String
   - role: UserRoleType
   - isActive: Boolean @default(true)
   - activatedAt: DateTime @default(now())
   - @@unique([userId, role])
   - relación con User

3. En modelo User:
   - Mantener el campo `role String` TEMPORALMENTE (para migración segura)
   - Agregar campo `roles UserRole[]`
   - NO eliminar ninguna relación existente

4. Crear migración de Prisma con nombre:
   add_multi_role_system

5. Crear script /scripts/migrate-roles.ts que:
   - Lee todos los User existentes
   - Para cada user, crea un UserRole con su role actual
   - Loggea el resultado (X usuarios migrados)

IMPORTANTE:
- NO eliminar el campo role String todavía (se eliminará en el Prompt 2)
- NO modificar ningún archivo fuera de schema.prisma y el script de migración
- Mostrarme el plan completo antes de ejecutar cualquier cambio
```

---

## PROMPT 2 — Actualizar NextAuth para leer roles múltiples
> **Alcance:** `src/lib/auth.ts` · `middleware.ts` · tipos TypeScript
> **Requiere:** Prompt 1 ejecutado
> **Antes de pegar:** mencioná `@src/lib/auth.ts` y `@middleware.ts`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, NextAuth v5 beta, Prisma 5).
YA SE EJECUTÓ el Prompt 1: existe la tabla UserRole en la BD.

CONTEXTO ACTUAL DE AUTH:
- NextAuth está configurado en src/lib/auth.ts o src/auth.ts
- La sesión actual incluye session.user.role como String único
- El middleware en middleware.ts usa session.user.role para proteger rutas
- Las rutas protegidas actuales son:
  /repartidor/* → requiere role DRIVER
  /comercios/*  → requiere role COMERCIO
  /ops/*        → requiere role ADMIN

CAMBIOS REQUERIDOS:

1. En la configuración de NextAuth (callbacks.session y callbacks.jwt):
   - Mantener session.user.role String (compatibilidad con código existente)
   - AGREGAR session.user.roles String[] con todos los roles activos del user
   - Hacer un include de UserRole en el query del usuario al hacer login

2. Crear utility function en src/lib/auth-utils.ts:
   hasRole(session, role: string): boolean
   hasAnyRole(session, roles: string[]): boolean
   → Estas funciones deben funcionar tanto con el campo roles[]
      como hacer fallback al campo role String legacy

3. Actualizar el TypeScript type de Session para incluir roles[]:
   Archivo: types/next-auth.d.ts o donde esté la extensión de tipos

4. Actualizar middleware.ts:
   - Las rutas existentes deben seguir funcionando igual
   - Usar hasAnyRole() para los checks, no comparación directa de string

NO CAMBIAR todavía:
- El campo role String en User (sigue como está)
- Ninguna API route ni componente de UI
- El flujo de registro existente

Mostrarme el plan completo con los archivos afectados antes de ejecutar.
```

---

## PROMPT 3 — Nuevo modelo SellerProfile (vendedor individual)
> **Alcance:** `prisma/schema.prisma` + nuevas API routes en `/api/seller/`
> **Requiere:** Prompts 1 y 2 ejecutados
> **Antes de pegar:** mencioná `@prisma/schema.prisma`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, Prisma 5).
YA SE EJECUTARON los Prompts 1 y 2.

CONTEXTO DE DISEÑO:
Hoy MOOVY tiene el modelo Merchant para comercios adheridos (con CUIT,
comisiones, verificación manual). El SellerProfile es diferente: es para
cualquier Moover que quiere vender algo puntual (objeto usado, producto
casero, servicio). No requiere CUIT ni verificación manual — solo datos
bancarios para cobrar.

CAMBIOS REQUERIDOS:

── EN schema.prisma ──────────────────────────────────────

1. Crear modelo SellerProfile:
   id             String    @id @default(cuid())
   userId         String    @unique
   displayName    String?
   bio            String?
   avatar         String?
   bankAlias      String?   // CBU o alias bancario para cobrar
   bankCbu        String?
   isActive       Boolean   @default(true)
   isVerified     Boolean   @default(false)
   totalSales     Int       @default(0)
   rating         Float?
   commissionRate Float     @default(12) // % que se queda MOOVY
   createdAt      DateTime  @default(now())
   updatedAt      DateTime  @updatedAt
   user           User      @relation(fields: [userId], references: [id])
   listings       Listing[]

2. Crear modelo Listing (publicación de vendedor individual):
   id           String    @id @default(cuid())
   sellerId     String
   title        String
   description  String?
   price        Float
   stock        Int       @default(1)
   condition    String    @default("NUEVO") // NUEVO, USADO, REACONDICIONADO
   isActive     Boolean   @default(true)
   categoryId   String?
   createdAt    DateTime  @default(now())
   updatedAt    DateTime  @updatedAt
   seller       SellerProfile @relation(fields: [sellerId], references: [id])
   images       ListingImage[]
   category     Category? @relation(fields: [categoryId], references: [id])

3. Crear modelo ListingImage:
   id        String  @id @default(cuid())
   listingId String
   url       String
   order     Int     @default(0)
   listing   Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

4. Agregar en User:
   sellerProfile  SellerProfile?

5. Agregar en Category:
   listings  Listing[]

── EN LA API ──────────────────────────────────────────────

6. Crear /src/app/api/seller/activate/route.ts (POST):
   - Requiere sesión autenticada
   - Crea SellerProfile si no existe
   - Agrega UserRole con role SELLER al usuario
   - Devuelve { success: true, seller: SellerProfile }

7. Crear /src/app/api/seller/profile/route.ts (GET y PUT):
   - GET: devuelve el SellerProfile del usuario autenticado
   - PUT: actualiza displayName, bio, avatar, bankAlias, bankCbu

8. Crear /src/app/api/seller/listings/route.ts (GET y POST):
   - GET: lista las Listings del vendedor autenticado
   - POST: crea una nueva Listing
     Body: { title, description, price, stock, condition, categoryId }

Generar migración con nombre: add_seller_profile_and_listings
Mostrar el plan completo antes de ejecutar.
```

---

## PROMPT 4 — Order multi-vendedor con SubOrder
> **Alcance:** `prisma/schema.prisma` · modelo Order · modelo OrderItem
> **Requiere:** Prompts 1, 2 y 3 ejecutados
> **Antes de pegar:** mencioná `@prisma/schema.prisma`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, Prisma 5).
YA SE EJECUTARON los Prompts 1, 2 y 3.

CONTEXTO:
El modelo Order actual asume un solo vendedor por pedido (merchantId directo
en Order). Para el marketplace unificado, un carrito puede tener productos
de múltiples vendedores. Necesitamos introducir SubOrder sin romper los
pedidos existentes.

NUEVO MODELO DE DATOS:
  Order (pedido madre — lo que ve el cliente)
    └── SubOrder (uno por vendedor involucrado)
          └── OrderItem (los productos de ese vendedor)

Esto permite:
  · Un solo checkout para el cliente
  · Pagos separados a cada vendedor
  · Repartidores asignados por SubOrder, no por Order
  · Estados independientes por SubOrder

CAMBIOS REQUERIDOS EN schema.prisma:

1. Crear modelo SubOrder:
   id                   String    @id @default(cuid())
   orderId              String
   merchantId           String?   // si es un comercio adherido
   sellerId             String?   // si es un SellerProfile
   status               String    @default("PENDING")
   subtotal             Float
   deliveryFee          Float     @default(0)
   discount             Float     @default(0)
   total                Float
   driverId             String?
   moovyCommission      Float?    @default(0)
   sellerPayout         Float?    @default(0)
   paymentStatus        String    @default("PENDING")
   deliveryStatus       String?
   deliveredAt          DateTime?
   deliveryPhoto        String?
   driverRating         Int?
   assignmentAttempts   Int       @default(0)
   assignmentExpiresAt  DateTime?
   attemptedDriverIds   Json?
   pendingDriverId      String?
   createdAt            DateTime  @default(now())
   updatedAt            DateTime  @updatedAt
   order                Order     @relation(fields: [orderId], references: [id])
   merchant             Merchant? @relation(fields: [merchantId], references: [id])
   seller               SellerProfile? @relation(fields: [sellerId], references: [id])
   driver               Driver?   @relation(fields: [driverId], references: [id])
   items                OrderItem[]

2. Modificar modelo Order:
   - Agregar: subOrders SubOrder[]
   - Agregar: isMultiVendor Boolean @default(false)
   - Mantener TODOS los campos actuales sin eliminar ninguno

3. Modificar modelo OrderItem:
   - Agregar campo: subOrderId String?
   - Agregar relación: subOrder SubOrder? @relation(...)
   - Mantener la relación con Order existente

4. Agregar en SellerProfile:
   subOrders SubOrder[]

5. Agregar en Driver:
   subOrders SubOrder[]

NO MODIFICAR:
- La lógica de asignación de riders en src/lib/logistics.ts
- Las API routes de /api/orders existentes
- El portal de la tienda (store)

Los pedidos existentes NO deben ser afectados — el cambio es aditivo.

Generar migración con nombre: add_suborder_multi_vendor
Mostrar plan completo antes de ejecutar.
```

---

## PROMPT 5 — Onboarding unificado (un solo registro)
> **Alcance:** `/api/auth/register` · página de registro en `(store)` · nuevas rutas de activación
> **Requiere:** Prompts 1 al 4 ejecutados
> **Antes de pegar:** mencioná `@src/app/api/auth` y `@src/app/(store)`

```
Trabajás sobre el proyecto MOOVY (Next.js 16, NextAuth v5, Prisma 5).
YA SE EJECUTARON los Prompts 1 al 4.

CONTEXTO ACTUAL:
Hoy existen 3 flujos de registro separados para clientes, comercios y
repartidores. La visión es: todos empiezan como Moover (comprador).
Los roles adicionales se activan post-registro desde el perfil.

Buscá en el codebase dónde están actualmente:
- El endpoint de registro: probablemente /api/auth/register/route.ts
- La página de registro: probablemente src/app/(store)/registro/page.tsx

FLUJO OBJETIVO:
  REGISTRO (único, sin fricción):
    Nombre · Email · Contraseña · Teléfono (opcional)
    → Crea User con role USER
    → Crea UserRole { role: USER }
    → Asigna signupBonus de PointsConfig
    → Redirige a tienda (home)

  POST-REGISTRO desde el perfil:
    'Quiero vender'   → activa SELLER sin verificación
    'Quiero repartir' → inicia verificación DRIVER (aprobación manual por Ops)
    'Tengo un negocio' → inicia onboarding COMERCIO (flujo existente)

CAMBIOS REQUERIDOS:

1. Modificar /api/auth/register (POST):
   - Solo aceptar: name, email, password, phone (opcional), referralCode (opcional)
   - Crear User con role 'USER' (campo legacy) Y crear UserRole { role: USER }
   - Asignar signupBonus según PointsConfig
   - NO crear Driver ni Merchant en el registro
   - Devolver { success: true, user: { id, email, name } }

2. Crear /api/auth/activate-seller (POST):
   - Requiere sesión autenticada
   - Llama internamente a /api/seller/activate
   - Devuelve perfil actualizado

3. Crear /api/auth/activate-driver (POST):
   - Requiere sesión autenticada
   - Crea Driver con isActive: false (pendiente verificación)
   - Agrega UserRole { role: DRIVER, isActive: false }
   - Envía email al admin notificando nueva solicitud
   - Devuelve { success: true, status: 'PENDING_VERIFICATION' }

4. En /ops/repartidores, agregar endpoint de aprobación:
   PUT /api/admin/drivers/[id]/approve:
   - Activa Driver.isActive = true
   - Activa UserRole { role: DRIVER, isActive: true }
   - Envía email de bienvenida al repartidor

5. Actualizar la página de registro en (store):
   - Mostrar un único formulario: nombre, email, contraseña, teléfono
   - Eliminar selección de tipo de cuenta del formulario
   - Mantener el diseño visual existente

Mostrar plan completo con todos los archivos afectados antes de ejecutar.
```

---

## Orden de ejecución

| # | Prompt | Depende de | Habilita |
|---|--------|-----------|---------|
| 1 | Schema de roles múltiples | — | Todo lo demás |
| 2 | NextAuth con roles múltiples | Prompt 1 | Prompts 3, 4, 5 |
| 3 | Modelo SellerProfile | Prompts 1 y 2 | Prompts 4 y 5 |
| 4 | Order multi-vendedor (SubOrder) | Prompts 1, 2 y 3 | Checkout multi-vendedor |
| 5 | Onboarding unificado | Prompts 1 al 4 | UX de activación de roles |

---

## Próxima fase (después de estos 5 prompts)

Una vez completada esta fase, el siguiente paso es:

1. **Integración MercadoPago** — con SubOrder en su lugar, la distribución de pagos a múltiples vendedores se puede implementar correctamente
2. **UI del panel vendedor individual** — pantallas para publicar y gestionar Listings
3. **Checkout multi-vendedor** — actualizar el carrito para agrupar items por vendedor y generar SubOrders automáticamente

---

*MOOVY · somosmoovy.com · Documento interno de arquitectura*
