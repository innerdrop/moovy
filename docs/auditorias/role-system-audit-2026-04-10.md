# Auditoría del sistema de roles de Moovy

**Fecha:** 2026-04-10
**Rama:** `feat/roles-single-source-of-truth`
**Estado:** Propuesta de rediseño — pendiente de aprobación del fundador
**Alcance:** Auth, autorización, control de acceso por rol, aprobación de merchants/drivers/sellers

---

## 0. TL;DR — qué está roto y por qué

El sistema de roles de Moovy tiene **6 fuentes de verdad distintas** que compiten por representar el mismo concepto ("¿este usuario puede entrar al portal de comercio?"). Cada endpoint nuevo tiene que recordar actualizar entre 3 y 5 de ellas, y ninguno lo hace de forma consistente. El resultado es un estado que deriva con el tiempo y bugs silenciosos donde el usuario:

- ve un portal al que no puede entrar,
- es aprobado pero su sesión sigue "pendiente",
- tiene un rol activo en una tabla e inactivo en otra,
- pasa un middleware y muere en un layout.

Los parches (auto-heal, role-access helpers) reducen los síntomas pero no atacan la causa. El sistema necesita **una única fuente de verdad derivada** en vez de múltiples flags mantenidas a mano.

---

## 1. Las 6 fuentes de verdad actuales

Para saber "¿X puede acceder al portal de comercio?", el código tiene que consultar y mantener en sincronía:

| # | Campo | Tipo | Escrito por | Leído por |
|---|-------|------|-------------|-----------|
| 1 | `User.role` | String legacy | Solo registro inicial | JWT build (auth.ts:105) |
| 2 | `UserRole[].isActive` | Boolean por fila | Registro + approve + reject + auto-heal | `authorize()` (auth.ts:43) |
| 3 | `Merchant.approvalStatus` | String (PENDING/APPROVED/REJECTED/SUSPENDED) | Register, approve, reject | `getMerchantAccess()` (role-access.ts:42) |
| 4 | `Merchant.isActive` | Boolean | Register (false), approve (true), reject (false) | **Nada lo lee** en el gate de acceso |
| 5 | `Merchant.isVerified` | Boolean | Approve (true), reject (false) | Badges/UI |
| 6 | `Merchant.isSuspended` | Boolean | Suspend/unsuspend endpoints | `getMerchantAccess()` (role-access.ts:72) |

Más los equivalentes para `Driver.*` (con lógica inversa en `isActive`) y `SellerProfile.*` (que no tiene `approvalStatus`, se auto-activa). Total: ~15 campos repartidos en 4 tablas mantenidos a mano.

---

## 2. Inconsistencias verificadas en el código actual

Cada una con archivo, línea y explicación del impacto. Ordenadas por severidad.

### 2.1 [CRÍTICA] Approve/reject no refresca el JWT del usuario

**Dónde:** `src/app/api/admin/merchants/[id]/approve/route.ts`, `src/app/api/admin/drivers/[id]/approve/route.ts` y sus equivalentes reject.

**Qué pasa:** Cuando admin aprueba un merchant, el endpoint actualiza correctamente `Merchant.approvalStatus`, `Merchant.isActive`, `Merchant.isVerified` y activa el `UserRole COMERCIO` dentro de una `$transaction`. **Pero el JWT del usuario aprobado sigue exactamente igual hasta que haga logout/login.** El client del user no tiene forma de saber que algo cambió.

**Impacto real:** El síntoma que Mauro reporta como "aprobar/rechazar repartidor no funciona" probablemente es esto. Admin aprueba, la DB queda bien, pero el driver no ve el cambio en su portal porque su sesión todavía tiene el estado viejo. A ojo del driver, el approve "no hizo nada".

**Por qué el auto-heal no lo arregla:** `autoHealUserRoles` corre en `authorize()` (en el próximo login) y en `jwt()` trigger `update` (si el client pide un refresh). Pero ningún endpoint le dice al client "pedí refresh ahora". Y el driver no va a hacer logout por su cuenta, porque desde su perspectiva la app está rota.

### 2.2 [CRÍTICA] Auto-heal de COMERCIO inyecta el rol sin validar approvalStatus

**Dónde:** `src/lib/auto-heal-roles.ts:75-95`

**Código literal:**
```typescript
// Auto-heal COMERCIO: si existe Merchant para este user, asegurar
// UserRole COMERCIO. NOTA: aceptamos el merchant independientemente de
// su approvalStatus — el gate de aprobación es responsabilidad de
// `role-access.ts` (getMerchantAccess).
if (!activeRoles.has("COMERCIO")) {
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        select: { id: true },  // NO lee approvalStatus
    });
    if (merchant) {
        await prisma.userRole.upsert({...});
    }
}
```

**Qué pasa:** Un usuario con un Merchant en estado PENDING o REJECTED, después de auto-heal, termina con `UserRole COMERCIO.isActive = true` en la DB. El rol existe en el JWT. El `PortalSwitcher` le muestra el botón "Comercio". Cuando hace click, `getMerchantAccess()` lo bouncea a `/comercios/pendiente-aprobacion`.

**Comparación con DRIVER:** el auto-heal de DRIVER **sí** chequea `approvalStatus === "APPROVED"` (línea 42). Así que la lógica no es consistente entre tipos dentro del mismo archivo.

**Por qué era una decisión consciente:** yo mismo documenté esto en CLAUDE.md con la intención de "separar gating de role-presence". En retrospectiva, fue el parche equivocado: introduce una inconsistencia entre "tengo el rol" y "puedo usar el rol" que después tenemos que desentrañar en cada capa. La solución correcta es derivar el rol a partir de `approvalStatus`, no tenerlo como campo independiente.

### 2.3 [ALTA] `Merchant.isActive` y `Driver.isActive` tienen semántica opuesta

**Dónde:**
- `schema.prisma:393` — `Merchant.isActive @default(false)`
- `schema.prisma:503` — `Driver.isActive @default(true)`

**Problema:**
- Merchant arranca `isActive: false` → approve lo pone en `true` → reject lo vuelve a `false`.
- Driver arranca `isActive: true` → reject lo pone en `false`.
- `getMerchantAccess()` **no chequea** `isActive` (solo `approvalStatus` + `isSuspended`).
- `getDriverAccess()` **sí chequea** `isActive`.

**Consecuencia práctica:** Si un admin quiere "desactivar sin rechazar" a un merchant aprobado (por ejemplo, porque el comercio se fue de vacaciones), pone `isActive: false` y **no pasa nada** — el merchant sigue entrando al portal. Para el mismo caso con un driver, funciona.

**Origen del problema:** se agregaron los tres flags (`approvalStatus`, `isActive`, `isVerified`) en momentos distintos y nadie los consolidó. Hoy hay tres campos para representar una sola cosa.

### 2.4 [ALTA] `suspend` no desactiva UserRole (pero `reject` sí)

**Dónde:**
- `src/app/api/admin/users/[id]/suspend/route.ts:134-191` — solo toca `User.isSuspended`, nunca `UserRole.isActive`.
- `src/app/api/admin/merchants/[id]/reject/route.ts:55-58` — sí desactiva `UserRole COMERCIO`.

**Problema:** Dos formas de "bloquear a un usuario" con implementaciones distintas. Si querés preguntarle a la DB "¿este user tiene rol activo?", tenés que chequear además `User.isSuspended`, porque `UserRole.isActive` puede estar `true` mientras el user está suspendido.

**Consecuencia:** cualquier query que asuma "UserRole.isActive = true significa que el rol está vivo" está equivocada.

### 2.5 [ALTA] SellerProfile no tiene `approvalStatus` — modelo inconsistente con Merchant/Driver

**Dónde:** `schema.prisma:553-590`

**Problema:** SellerProfile solo tiene `isActive` e `isSuspended`, no tiene gate de aprobación. Cuando alguien se registra como seller, queda inmediatamente activo sin pasar por admin. Merchant y Driver sí pasan por admin approval.

**Consecuencias:**
- Cualquier persona puede listar productos en el marketplace sin validación.
- No hay `rejectionReason` para sellers.
- No hay trail de auditoría para "por qué rechazaste a X seller".
- La lógica de `getSellerAccess()` es distinta de `getMerchantAccess()` y `getDriverAccess()`.

### 2.6 [MEDIA] Approve/reject merchant y driver no llaman a `logAudit()`

**Dónde:**
- `admin/merchants/[id]/approve/route.ts` — sin logAudit
- `admin/merchants/[id]/reject/route.ts` — sin logAudit
- `admin/drivers/[id]/approve/route.ts` — sin logAudit
- `admin/drivers/[id]/reject/route.ts` — sin logAudit
- `admin/users/[id]/suspend/route.ts:212-222` — **sí** tiene logAudit
- `admin/users/[id]/unsuspend/route.ts:189-197` — **sí** tiene logAudit

**Problema:** Aprobar o rechazar un comercio/repartidor es la operación **más sensible** del panel admin (decide quién puede cobrar en la plataforma) y es la única que no queda registrada en el audit log. Compliance gap y riesgo legal.

### 2.7 [MEDIA] PortalSwitcher muestra portales según JWT sin validar estado real

**Dónde:** `src/components/ui/PortalSwitcher.tsx:39-47`

**Problema:** filtra portales por `userRoles.includes(p.role)` leyendo del JWT. No consulta `approvalStatus`. Si el user tiene COMERCIO en el JWT pero el Merchant está PENDING, ve el botón "Comercio" en el switcher. Click → redirect a pendiente-aprobacion.

**Impacto:** UX confusa, no es fuga de seguridad. Pero es un síntoma claro del problema de fondo: la UI y la seguridad leen distintas fuentes de verdad.

### 2.8 [BAJA] `User.role` legacy nunca se actualiza después del registro

**Dónde:** `schema.prisma:39`, `auth.ts:105`

**Problema:** `User.role` arranca como `"USER"` en el registro y nunca más se toca. `auth.ts` lo sigue leyendo para construir `token.role`. Cualquier código que dependa de ese campo está leyendo un valor obsoleto.

**Evidencia:** grep de `user.role` en el código muestra lecturas en `auth.ts`, `auth-utils.ts`, y algunos lugares dispersos.

### 2.9 [BAJA] Alias MERCHANT ↔ COMERCIO

**Dónde:** `src/lib/auth-utils.ts:19-27`

**Problema:** El enum de Prisma usa `COMERCIO`. El código viejo usa `MERCHANT`. `auth-utils.ts` mantiene un alias bidireccional `ROLE_ALIASES` para que ambos funcionen. `proxy.ts:143` usa `['MERCHANT', 'COMERCIO', 'ADMIN']` — tiene que incluir ambos porque no sabe cuál está en el JWT del user.

**Impacto:** cognitivo. Cada vez que tocás código de roles tenés que recordar el alias. Fuente de bugs futuros si alguien se olvida.

### 2.10 [BAJA] Driver auto-heal tiene lógica redundante

**Dónde:** `src/lib/auto-heal-roles.ts:42`

**Código:**
```typescript
if (driver && (driver.approvalStatus === "APPROVED" || driver.isActive)) {
```

**Problema:** La condición `|| driver.isActive` es redundante porque cualquier driver REJECTED también tiene `isActive: false`. Funciona por accidente. Si alguien cambia la semántica de `isActive` en el futuro, se rompe silenciosamente.

---

## 3. Diagnóstico raíz — por qué esto sigue pasando

El diseño actual trata el rol como **estado persistido** que hay que mantener sincronizado entre múltiples tablas. Cada vez que cambia algo en una tabla (merchant aprobado, driver suspendido, seller desactivado), alguien tiene que acordarse de actualizar la otra tabla. Nadie se acuerda siempre. Resultado: drift.

El auto-heal es un síntoma de este diseño, no una solución. Existe porque aceptamos que el drift va a pasar y tratamos de repararlo en cada login. Pero el auto-heal en sí mismo tomó decisiones cuestionables (COMERCIO se activa aunque esté PENDING) que empeoran el problema.

**El principio correcto es:** los roles no se guardan, se derivan. Un usuario **es** un merchant si existe un `Merchant` aprobado apuntando a su `userId`. Punto. No hace falta una fila en `UserRole` que diga "COMERCIO activo" — esa fila siempre es redundante con el estado del Merchant.

Con ese principio:

- No hay drift posible, porque solo hay una fuente de verdad.
- No hace falta auto-heal.
- `approve` solo cambia `Merchant.approvalStatus`. Nada más que sincronizar.
- El JWT se puede construir barato en cada request sin leer dos tablas.
- `PortalSwitcher`, `proxy`, `layout` y `role-access` leen todos del mismo lugar.

---

## 4. Propuesta de rediseño

### 4.1 Nuevo módulo central: `src/lib/roles.ts`

Una sola función que computa el estado de acceso de un usuario a partir del estado de dominio (Merchant, Driver, SellerProfile, User). Retorna un objeto con forma bien definida:

```typescript
type PortalStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

type UserAccess = {
  userId: string;
  isAdmin: boolean;
  isBuyer: boolean;              // todos los users son buyers por default
  merchant: PortalStatus;        // derivado de Merchant
  driver: PortalStatus;          // derivado de Driver
  seller: PortalStatus;          // derivado de SellerProfile
  isGloballySuspended: boolean;  // User.isSuspended
};

async function computeUserAccess(userId: string): Promise<UserAccess>;
```

`computeUserAccess` hace **una sola query con joins** que trae User + Merchant + Driver + SellerProfile (select mínimo), y devuelve el objeto derivado. Sin escrituras, sin auto-heal, sin drift.

Sobre este helper se construyen los gates específicos:

```typescript
async function requireMerchantAccess(userId: string): Promise<void>;
  // throws redirect(...) si merchant !== "approved"

async function requireDriverAccess(userId: string): Promise<void>;
async function requireSellerAccess(userId: string): Promise<void>;
async function requireAdminAccess(userId: string): Promise<void>;
```

Cada `require*Access` lanza un `redirect()` de Next.js con el destino correcto según el estado. Los layouts protegidos se vuelven de dos líneas:

```typescript
const session = await auth();
await requireMerchantAccess(session!.user!.id);
return <>{children}</>;
```

### 4.2 Qué hace el JWT

El JWT solo guarda lo mínimo estable: `userId`, `isAdmin` (porque admin sí es un campo plano en User), y nada más. No guarda `roles[]`, no guarda `merchantId`, no guarda nada derivado.

Cuando un layout o una API route necesita saber "¿este user puede ser merchant?", llama a `computeUserAccess(userId)` al inicio de la request. Es una sola query indexada, muy barata.

**Beneficio:** el JWT nunca queda desactualizado. El estado siempre se lee fresh del dominio.

**Costo:** una query extra por request protegida. Aceptable — es una query con índices y select mínimo. Se puede cachear por request con `React.cache()` si hace falta.

### 4.3 Qué hace proxy.ts

Solo chequea que haya sesión. Nada de roles. Los roles los chequean los layouts (que ya corren Server Components y pueden usar `requireXAccess`). Esto simplifica proxy.ts y elimina la duplicación entre proxy y layout.

### 4.4 Qué hacen los endpoints de registro

Crean el `Merchant` / `Driver` / `SellerProfile` con `approvalStatus: "PENDING"`. **No tocan `UserRole`.** (Fase 1 del rediseño mantiene la tabla por compatibilidad, pero ya no se usa para gating.)

### 4.5 Qué hacen los endpoints de approve/reject

Solo actualizan `approvalStatus` (más `approvedAt`, `rejectionReason`, `rejectedBy`). **No tocan `UserRole`, no tocan `isActive`, no tocan `isVerified`.** Esos campos o se eliminan en Fase 2 o se dejan como display-only.

Además, agregan audit log.

### 4.6 Qué hace suspend/unsuspend

Sigue tocando `User.isSuspended`. `computeUserAccess` chequea esto y cualquier gate falla si el user está globalmente suspendido. Sin tocar UserRole.

### 4.7 PortalSwitcher

Recibe el objeto `UserAccess` completo (se pasa desde el Server Component padre), no el JWT. Solo muestra portales donde `merchant === "approved"`, `driver === "approved"`, etc. Si está `"pending"`, muestra el portal en gris con un badge "Pendiente" que lleva a la pantalla de pendiente-aprobacion explícita.

### 4.8 Qué se borra

- `src/lib/auto-heal-roles.ts` — innecesario si no hay drift.
- `src/lib/role-access.ts` — reemplazado por `requireXAccess` en `roles.ts`.
- `src/lib/auth-utils.ts` — `hasRole`, `hasAnyRole`, `getUserRoles`, `ROLE_ALIASES` → todo reemplazado por `UserAccess`.
- Lectura de `token.roles` en cualquier lado del código.
- Lectura de `UserRole` table en cualquier lado del código (queda la tabla, pero para features futuras como audit de cambios de rol).
- `Merchant.isActive`, `Merchant.isVerified`, `Driver.isActive` como gates de acceso — se leen como display-only o se borran en Fase 2.
- Lógica de `refreshRoles` en `jwt()` callback — no hace falta, el JWT no guarda roles.

### 4.9 Qué se conserva

- `Merchant.approvalStatus`, `Driver.approvalStatus` — fuente de verdad.
- `Merchant.isSuspended`, `Driver.isSuspended`, `User.isSuspended` — bloqueos temporales ortogonales al approval.
- `Merchant.rejectionReason`, `Driver.rejectionReason`.
- `UserRole` table con `isActive` (por ahora) — no se borra para no forzar migración schema en Fase 1, pero deja de ser fuente de verdad.
- NextAuth + credentials + bcrypt.
- Audit log infrastructure (se va a usar más).
- Suspend/unsuspend flow (con mejoras menores).

### 4.10 Qué se crea nuevo

- `src/lib/roles.ts` — módulo canónico.
- `SellerProfile.approvalStatus` (Fase 2, schema migration) — para que seller sea consistente con merchant/driver.
- `scripts/validate-role-flows.ts` — script que simula los 12 flujos (register → approve → access / register → reject → access / suspend → access / etc.) contra la DB real y valida que cada estado lleve al lugar esperado.
- Audit log entries para approve/reject.
- Llamada a `update({ refreshRoles: true })` desde el cliente admin después de aprobar, para que el user aprobado vea el cambio sin logout. **Espera — con el nuevo diseño esto no hace falta**, porque el JWT no guarda roles. Tacho esta línea.

### 4.11 Fases del rediseño

**Fase 1 (esta rama, sin tocar schema):**
1. Crear `src/lib/roles.ts` con `computeUserAccess` y `requireXAccess`.
2. Crear `scripts/validate-role-flows.ts`.
3. Refactorear los 3 layouts protegidos para usar `requireXAccess`.
4. Refactorear `proxy.ts` para solo chequear sesión.
5. Refactorear endpoints de approve/reject para solo tocar `approvalStatus` + audit log. **No tocar UserRole** (Fase 1 los deja en sync por consistencia, pero el código ya no los lee como gate).
6. Refactorear endpoints de registro para no escribir `UserRole` (o seguir escribiéndolo por compat, pero el código ya no lo lee).
7. Refactorear PortalSwitcher para recibir `UserAccess`.
8. Eliminar `role-access.ts`, `auto-heal-roles.ts`, `auth-utils.ts`.
9. Eliminar lógica de `refreshRoles` en `jwt()` callback.
10. Correr `validate-role-flows.ts` — debe pasar los 12 casos.
11. tsc limpio.
12. Mauro smoke-testea manualmente los flujos.
13. Cierre de rama.

**Fase 2 (rama aparte, schema migration):**
1. Agregar `SellerProfile.approvalStatus`.
2. Eliminar `Merchant.isActive`, `Merchant.isVerified`, `Driver.isActive` (ya nadie los lee como gate).
3. Eliminar columna `UserRole.isActive` o la tabla entera.
4. Eliminar `User.role` legacy.
5. db push + verificar.

Fase 2 es opcional y puede esperar. La crítica es Fase 1 — elimina el drift y los bugs sin tocar schema.

---

## 5. Verificación de interferencia (meta-regla de Mauro)

Antes de borrar algo, chequeamos quién más lo usa. Todavía no lo ejecuté como grep exhaustivo, pero listo los consumidores conocidos de cada cosa a borrar:

| A borrar | Consumidores conocidos | Acción |
|----------|------------------------|--------|
| `role-access.ts` (getMerchantAccess, getDriverAccess, getSellerAccess) | 3 layouts protegidos | Reemplazar las 3 llamadas por `requireXAccess` y después borrar |
| `auto-heal-roles.ts` (autoHealUserRoles) | `auth.ts` authorize() y jwt() update | Quitar los 2 callsites y después borrar |
| `auth-utils.ts` (hasRole, hasAnyRole, getUserRoles, ROLE_ALIASES) | proxy.ts, 3 layouts, algunos otros | Requiere grep completo (parte del plan de ejecución) |
| Lectura de `token.roles` en jwt() callback | auth.ts mismo | Simplificar construcción de token |
| Lectura de `UserRole.isActive` como gate | `authorize()`, auto-heal | Queda la tabla pero no se lee |
| Escritura de `UserRole` en approve/reject | 4 endpoints admin | Quitar las escrituras (Fase 2 borra la columna) |

Cada uno de estos pasos va a incluir un grep previo al archivo afectado, y si aparece un consumidor nuevo que no está en esta lista, se documenta antes de borrar.

---

## 6. Riesgos del rediseño

1. **Una query extra por layout.** Cada request a un portal protegido hace una query `computeUserAccess` con joins. Mitigación: índices correctos (ya existen en `userId`), select mínimo, `React.cache()` por request si hace falta medir.

2. **Regresiones en edge cases que no documenté.** Mitigación: el script `validate-role-flows.ts` corre 12+ casos contra la DB real. Cualquier regresión sale ahí.

3. **Admin pierde la capacidad de "desactivar sin rechazar".** Hoy (en teoría) puedes poner `Merchant.isActive: false` sin `approvalStatus: REJECTED`. En el nuevo diseño eso no existe. Mitigación: si realmente necesitamos "pausa sin rechazo", se modela como `isSuspended: true`, que ya existe y ya se maneja. O se agrega un estado `"PAUSED"` a `approvalStatus`.

4. **Código externo (crons, webhooks) que lea UserRole.** Mitigación: grep para detectarlos. En Fase 1 dejamos UserRole intacto, solo dejamos de usarlo como gate. Nada externo se rompe.

5. **NextAuth v5 tiene cuirks con lo que acepta en JWT.** Mitigación: mantener `isAdmin` flag (ya está) + `userId`. Eso es todo lo que necesita.

---

## 7. Preguntas de aprobación para Mauro

Antes de tocar código necesito que confirmes o corrijas cuatro cosas:

### Pregunta 1 — ¿Alcance de Fase 1?

Fase 1 propone refactorear todo el código de autorización sin tocar schema. Son aproximadamente 15-20 archivos modificados, 3-4 archivos borrados, 2 archivos nuevos (`roles.ts` y `validate-role-flows.ts`). Tiempo estimado: esta sesión completa.

¿Te cierra el alcance? ¿O preferís partir Fase 1 en dos chunks más chicos?

### Pregunta 2 — ¿SellerProfile en Fase 1 o Fase 2?

Hoy cualquier persona registrada puede ser seller sin admin approval. Eso es un **agujero de producto** (legal y de compliance — vendedor marketplace sin validar). Opciones:

- **(a)** Fase 1: agregar `SellerProfile.approvalStatus` en schema ahora y meterlo en el flujo de approve/reject admin. Implica un `db push` en esta rama.
- **(b)** Fase 2: dejar seller como está en Fase 1, arreglarlo en una rama aparte cuando tocamos schema.
- **(c)** Fase 1 light: en `computeUserAccess`, tratar seller igual que antes (solo `isActive`) pero dejar la estructura lista para que Fase 2 solo haga schema change.

Mi recomendación: **(c)**. Pero dependía de vos qué tanta prisa hay con el agujero de seller.

### Pregunta 3 — ¿Mantenemos `UserRole` table o la eliminamos?

- **Fase 1 sin tocar:** UserRole sigue existiendo y se sigue escribiendo (por compat), pero el código de gating ya no la lee. En el día a día no pasa nada.
- **Fase 2:** eliminamos `UserRole.isActive` o la tabla entera.

Mi recomendación: mantener en Fase 1 para minimizar cambios de schema. Confirmame que te parece bien.

### Pregunta 4 — ¿Script de validación corre contra DB real o mockeada?

Mauro estableció en CLAUDE.md regla: "Cada feature que toque parámetros financieros o configurables DEBE incluir script de verificación que pruebe contra la DB real (no mocks)". Roles no es financiero, pero es sensible igual.

- **(a)** `validate-role-flows.ts` crea usuarios de prueba en la DB real, los aprueba/rechaza, verifica los redirects, y limpia al final.
- **(b)** `validate-role-flows.ts` asume que la DB tiene un snapshot seed con usuarios en cada estado y solo lee.

Mi recomendación: **(a)** porque ejercita escrituras, que es donde vive el bug. Requiere permisos de escritura en la DB local.

---

## 8. Próximos pasos si aprobás

1. Vos respondés las 4 preguntas de arriba (o me decís "aprobado default" y uso mis recomendaciones).
2. Creo `src/lib/roles.ts` **y nada más**, te lo muestro, lo aprobás.
3. Creo `scripts/validate-role-flows.ts` **y nada más**, te lo muestro, lo aprobás, lo corrés.
4. Recién con esos dos archivos validados arranco a refactorear layouts, proxy, endpoints, etc. — un chunk a la vez, con tsc + validate-role-flows.ts después de cada chunk.
5. Al final: commit, finish.ps1, cierre de rama.

No escribo ni una línea de código hasta tener las 4 respuestas (o la aprobación default).
