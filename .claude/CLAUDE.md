# MOOVY — Instrucciones para Claude

## Stack técnico
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma 5, PostgreSQL + PostGIS
- **Auth**: NextAuth v5
- **Realtime**: Socket.IO
- **Pagos**: MercadoPago SDK v2 (Checkout Pro)
- **Push**: Web Push API (VAPID)
- **Estado**: Zustand

## Portales de la app
| Portal | Ruta | Rol requerido |
|--------|------|---------------|
| Tienda | `/` | Público |
| Repartidor | `/repartidor` | DRIVER |
| Comercio | `/comercios` | MERCHANT |
| Vendedor | `/vendedor` | SELLER |
| Admin/Ops | `/ops` | ADMIN |
| Marketplace | `/marketplace` | Público |

## Arquitectura de roles
- Sistema multi-rol: un usuario puede tener USER + SELLER + DRIVER simultáneamente
- Roles almacenados en tabla `UserRole` (no en `User.role`)
- **SIEMPRE** verificar roles con `hasAnyRole(session, ["ROL"])` de `@/lib/auth-utils`
- **NUNCA** usar `session.user.role` directo — es campo legacy

## Base de datos
- Motor: PostgreSQL + PostGIS en Docker (puerto 5436)
- ORM: Prisma 5
- **SIEMPRE** usar `npx prisma db push` para aplicar cambios al schema
- **NUNCA** usar `npx prisma migrate dev` — requiere modo interactivo y falla con PostGIS
- Shadow DB configurada en `.env` como `SHADOW_DATABASE_URL`

## Workflow obligatorio de ramas
Cada tarea debe hacerse en su propia rama. Sin excepciones.

**Iniciar rama** (terminal, no chat):
```powershell
.\scripts\start.ps1
# Seleccionar tipo: 1=feat, 2=fix, 3=hotfix, 4=refactor
# Ingresar nombre corto sin espacios
```

**Publicar rama** (terminal, no chat):
```powershell
.\scripts\finish.ps1 -Message "tipo: descripcion en español"
```

## Reglas de ejecución — SIEMPRE seguir estas reglas
1. **NO** abrir browser ni ejecutar dev server
2. **NO** correr `npm run dev` ni `npm run build`
3. **NO** ejecutar pruebas visuales ni screenshots
4. Verificar TypeScript con: `npx tsc --noEmit` (targeted si falla por OOM)
5. Al terminar mostrar SOLO: lista de archivos modificados + resultado del tsc
6. Mostrar el plan completo antes de ejecutar cualquier cambio
7. Esperar aprobación explícita antes de tocar archivos

## Actualización obligatoria del CLAUDE.md
Al finalizar cada rama, antes de ejecutar `.\scripts\finish.ps1`:
1. Actualizá este archivo `CLAUDE.md` con cualquier cambio relevante:
   - Nuevos archivos críticos agregados
   - Nuevos patrones de código establecidos
   - Deuda técnica resuelta o nueva
   - Nuevas variables de entorno agregadas
   - Funcionalidades completadas (mover de "No existe todavía" a su sección)
2. Incluí el `CLAUDE.md` en el commit de la rama

## Optimización de tokens
- Leer solo los archivos necesarios para la tarea actual
- No explorar directorios completos innecesariamente
- No re-leer archivos ya leídos en la misma sesión
- Reportar solo errores nuevos (ignorar los 3 pre-existentes: `--incremental`, `session.user` ×2)
- Resumir cambios en tabla al finalizar, no listar línea por línea

## Variables de entorno clave
```
DATABASE_URL          # PostgreSQL puerto 5436
SHADOW_DATABASE_URL   # Shadow DB con PostGIS
NEXTAUTH_SECRET       # Auth
CRON_SECRET           # Socket.IO auth — NUNCA usar fallback hardcodeado
NEXT_PUBLIC_APP_URL   # URL canónica de la app (dev: http://localhost:3000, prod: https://www.somosmoovy.com)
MP_PUBLIC_KEY         # MercadoPago public key (TEST- en sandbox)
MP_ACCESS_TOKEN       # MercadoPago access token (TEST- en sandbox)
MP_WEBHOOK_SECRET     # MercadoPago webhook HMAC secret
MP_APP_ID             # ID de la app MOOVY en MP
```
Ver `.env.example` en la raíz del proyecto para la lista completa con comentarios.

## Archivos críticos — leer antes de modificar
| Archivo | Por qué es crítico |
|---------|-------------------|
| `src/lib/auth-utils.ts` | hasRole(), hasAnyRole() — usar siempre para verificar roles |
| `src/lib/mercadopago.ts` | SDK MP, preference builder, OAuth helpers |
| `src/store/cart.ts` | Zustand cart con groupByVendor() |
| `prisma/schema.prisma` | Modelos completos incluyendo SubOrder, Payment, MpWebhookLog |
| `src/app/api/orders/route.ts` | Creación de órdenes con flujo cash y MP |
| `src/lib/notifications.ts` | notifyBuyer() para push al comprador |
| `.env.example` | Referencia completa de todas las variables de entorno |
| `src/app/api/driver/orders/route.ts` | Endpoint de pedidos para repartidores (disponibles/activos/historial) |
| `src/app/api/orders/[id]/accept/route.ts` | Aceptar pedido como repartidor (socket + push) |
| `src/lib/moover-level.ts` | Niveles MOOVER compartidos (server + client) |
| `src/store/favorites.ts` | Zustand store de favoritos con optimistic update |
| `src/app/api/favorites/route.ts` | API GET/POST/DELETE de favoritos |
| `src/lib/seller-availability.ts` | Funciones de disponibilidad vendedor (online/offline/pause/resume) |
| `src/lib/assignment-engine.ts` | Motor de asignacion de repartidores con PostGIS y rating |

## Patrones establecidos — seguir estos patrones
- **Protección de rutas API**: `if (!hasAnyRole(session, ["ROL"])) return 403`
- **Notificación push**: `notifyBuyer(userId, status, orderNumber).catch(console.error)`
- **Socket emit**: fetch a `${socketUrl}/emit` con Bearer CRON_SECRET
- **Imágenes**: usar `ImageUpload.tsx` existente en `src/components/ui/`
- **Formularios**: nunca usar `<form>` HTML, usar handlers onClick/onChange
- **Favoritos**: usar `HeartButton` de `@/components/ui/HeartButton` en cards
- **Niveles MOOVER**: importar de `@/lib/moover-level` (nunca duplicar constantes)

## Deuda técnica conocida
- `SellerProfile` no tiene coordenadas de ubicación (pendiente Fase 4)
- Analytics cuenta roles desde `UserRole` table (ya migrado)
- Quedan ~8 extracciones de `(session.user as any).role` en support/chats y driver/location (no son comparaciones, son extracciones para lógica condicional)
- Portal COMEX eliminado (era legacy, apuntaba a rutas `/partner/` inexistentes)

## Lo que NO existe todavía
- Pago con MP en producción (requiere credenciales productivas)
- Split automático entre vendedores (requiere Marketplace API de MP)
- Múltiples ciudades (hardcodeado Ushuaia)
- App nativa iOS/Android

## Archivos agregados recientemente
- `src/app/(store)/ayuda/page.tsx` — Centro de Ayuda con FAQ acordeón (7 secciones) + contacto rápido
- `landing/page.tsx` — Marketplace hero slide (index 2, violeta), sección marketplace, card comunidad, links en menú mobile y footer
- `components/orders/RateMerchantModal.tsx` — Modal para calificar comercios (1-5 estrellas + comentario)
- `components/orders/RateSellerModal.tsx` — Modal para calificar vendedores marketplace
- `api/orders/[id]/rate-merchant/route.ts` — Endpoint POST para calificar comercio + actualizar promedio
- `api/orders/[id]/rate-seller/route.ts` — Endpoint POST para calificar vendedor + actualizar promedio
- Schema: `merchantRating`, `merchantRatingComment`, `sellerRating`, `sellerRatingComment` en Order; `rating` en Merchant
- `src/lib/moover-level.ts` — Constantes y funciones de nivel MOOVER compartidas (server/client)
- `src/store/favorites.ts` — Zustand store de favoritos con optimistic toggle
- `src/components/ui/HeartButton.tsx` — Botón corazón reutilizable para cards
- `src/app/api/favorites/route.ts` — API GET/POST/DELETE de favoritos (polimórfica: merchant/product/listing)
- Schema: modelo `Favorite` con FKs a User, Merchant, Product, Listing + unique constraints
- `src/app/api/points/route.ts` — Ahora retorna `mooverLevel`, `mooverLevelColor`, `nextLevelAt`
- Push: `notifyBuyer()` conectado en `driver/claim` (IN_DELIVERY) y `driver/status` (DELIVERED)
- `sw.js` — Fix notificationclick para soportar buyers (antes solo matcheaba `/repartidor`)
- `mi-perfil/page.tsx` — Toggle de notificaciones push en sección Configuración
- `src/lib/seller-availability.ts` — Funciones: getSellerStatus, setSellerOnline/Offline, pauseSeller, checkAndResumePaused
- `src/app/api/seller/availability/route.ts` — GET/POST disponibilidad vendedor (protegido SELLER)
- `src/app/api/cron/seller-resume/route.ts` — Cron para reanudar vendedores pausados (CRON_SECRET)
- `src/components/seller/AvailabilityToggle.tsx` — Toggle online/offline/pausa con countdown y tiempo de preparacion
- `src/lib/assignment-engine.ts` — Motor de asignacion: calculateOrderCategory, findNextEligibleDriver, startAssignmentCycle, processExpiredAssignments, driverAcceptOrder/RejectOrder
- `src/app/api/cron/assignment-tick/route.ts` — Cron para procesar timeouts de asignacion (CRON_SECRET)
- `src/components/store/ListingCard.tsx` — Ahora muestra badge de disponibilidad del vendedor
- `src/app/api/listings/route.ts` — Incluye sellerAvailability en respuesta
- `src/app/cookies/page.tsx` — Política de Cookies (7 secciones: qué son, tipos, terceros, gestión, duración, cambios, contacto)
- `src/app/terminos-vendedor/page.tsx` — Términos para Vendedores Marketplace (12 secciones: relación, requisitos CUIT, comisiones, obligaciones, prohibiciones, responsabilidad, cancelaciones, suspensión, PI, ley)
- `src/app/terminos-repartidor/page.tsx` — Términos para Repartidores (11 secciones: relación independiente, requisitos DNI/licencia/seguro, comisiones, responsabilidad, seguro Ley 24.449, conducta, suspensión)
- `src/app/terminos-comercio/page.tsx` — Términos para Comercios (11 secciones: relación intermediario, requisitos CUIT/habilitación/sanitario, comisiones, SLA timeout, responsabilidad, suspensión)
- `src/app/devoluciones/page.tsx` — Política de Devoluciones (9 secciones: Ley 24.240, plazos 10 días, proceso, reembolsos MP/MOOVER, no retornables perecederos, garantía legal)
- `src/app/cancelaciones/page.tsx` — Política de Cancelaciones (8 secciones: comprador antes/después/en camino, vendedor/comercio, automáticas timeout, reembolsos, penalidades)
- `mi-perfil/page.tsx` — Agregados links a Privacidad, Cookies y Devoluciones en sección Configuración y Ayuda
- Schema Merchant: nuevos campos `constanciaAfipUrl`, `habilitacionMunicipalUrl`, `registroSanitarioUrl`, `acceptedTermsAt`, `acceptedPrivacyAt`
- `src/app/comercio/registro/page.tsx` — Reorganizado en 3 pasos: info básica, contacto+contraseña, datos fiscales/legales (CUIT, CBU, uploads docs, checkboxes términos/privacidad)
- `src/app/api/auth/register/merchant/route.ts` — Recibe y guarda campos fiscales/legales, valida aceptación de términos
