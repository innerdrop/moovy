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

## Patrones establecidos — seguir estos patrones
- **Protección de rutas API**: `if (!hasAnyRole(session, ["ROL"])) return 403`
- **Notificación push**: `notifyBuyer(userId, status, orderNumber).catch(console.error)`
- **Socket emit**: fetch a `${socketUrl}/emit` con Bearer CRON_SECRET
- **Imágenes**: usar `ImageUpload.tsx` existente en `src/components/ui/`
- **Formularios**: nunca usar `<form>` HTML, usar handlers onClick/onChange

## Deuda técnica conocida
- `SellerProfile` no tiene coordenadas de ubicación (pendiente Fase 4)
- Analytics cuenta roles desde `UserRole` table (ya migrado)
- Quedan ~8 extracciones de `(session.user as any).role` en support/chats y driver/location (no son comparaciones, son extracciones para lógica condicional)

## Lo que NO existe todavía
- Pago con MP en producción (requiere credenciales productivas)
- Split automático entre vendedores (requiere Marketplace API de MP)
- Múltiples ciudades (hardcodeado Ushuaia)
- Ratings y reviews
- App nativa iOS/Android
