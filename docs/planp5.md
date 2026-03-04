# Unified Registration System

Actualmente existen 3 flujos de registro separados (usuario, driver, merchant) con endpoints y páginas independientes. El objetivo es unificarlos: **todos se registran como Moover (comprador)** y los roles adicionales se activan post-registro desde el perfil.

## User Review Required

> [!IMPORTANT]
> Los endpoints `register/driver/route.ts` y `register/merchant/route.ts` **no se eliminan en esta fase** para evitar romper el flujo existente de admin que crea drivers desde `/ops/repartidores`. Se dejan como están por ahora y se deprecan progresivamente.

> [!WARNING]
> La página de registro actualmente **redirige a `/login?registered=true`** después del registro exitoso. El plan cambia esto a redirigir directamente a la **tienda (`/`)**, haciendo auto-login con `signIn()` de NextAuth. ¿Confirmás este cambio, o preferís mantener la redirección a login?

> [!IMPORTANT]
> La sección "Oportunidades MOOVY" del perfil ya tiene links a `/comercio/registro` y `/repartidor/registro`. El plan es reemplazar el link de repartidor con un botón que llama al endpoint `activate-driver`, y agregar un nuevo botón "Quiero vender" que activa SELLER. El link de comercio se mantiene (el onboarding requiere datos del negocio).

---

## Proposed Changes

### 1. API – Registro unificado

#### [MODIFY] [route.ts](file:///c:/moovy/moovy/src/app/api/auth/register/route.ts)

Cambios:
- `phone` pasa a ser **opcional** (ya no es obligatorio)
- Agregar creación de `UserRole { role: 'USER' }` dentro de la transacción
- Leer `signupBonus` desde `PointsConfig` en vez de hardcoded `250`
- Agregar `user: { id, email, name }` a la respuesta

```diff
 // Validate required fields
-if (!data.firstName || !data.lastName || !data.email || !data.password || !data.phone) {
+if (!data.firstName || !data.lastName || !data.email || !data.password) {
     return NextResponse.json(
         { error: "Todos los campos obligatorios deben ser completados." },
         { status: 400 }
     );
 }
```

```diff
-// Pending signup bonus (activates after first qualifying purchase)
-const pendingBonus = 250;
+// Get signup bonus from config
+const pointsConfig = await prisma.pointsConfig.findUnique({
+    where: { id: "points_config" }
+});
+const pendingBonus = pointsConfig?.signupBonus ?? 100;
```

Dentro de la transacción, agregar después de crear el usuario:

```diff
+// Create UserRole entry
+await tx.userRole.create({
+    data: {
+        userId: newUser.id,
+        role: 'USER',
+        isActive: true,
+    }
+});
```

Actualizar respuesta:

```diff
 return NextResponse.json({
     success: true,
+    user: { id: result.id, email: result.email, name: result.name },
     message: referrerId ? "..." : "...",
     referralCode: newUserReferralCode,
     pendingPoints: pendingBonus
 });
```

---

### 2. API – Activación de seller

#### [NEW] [route.ts](file:///c:/moovy/moovy/src/app/api/auth/activate-seller/route.ts)

- Requiere sesión autenticada via `auth()`
- Verifica que el usuario no tenga ya el rol SELLER
- Crea `UserRole { role: SELLER, isActive: true }`
- Devuelve perfil con roles actualizados

```typescript
// POST - Activate SELLER role for authenticated user
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // Check if already a seller
    const existingRole = await prisma.userRole.findUnique({
        where: { userId_role: { userId: session.user.id, role: 'SELLER' } }
    });
    if (existingRole) {
        return NextResponse.json({ error: "Ya tenés el rol de vendedor" }, { status: 409 });
    }
    
    // Create seller role
    await prisma.userRole.create({
        data: { userId: session.user.id, role: 'SELLER', isActive: true }
    });
    
    return NextResponse.json({ success: true, role: 'SELLER', status: 'ACTIVE' });
}
```

---

### 3. API – Activación de driver (solicitud)

#### [NEW] [route.ts](file:///c:/moovy/moovy/src/app/api/auth/activate-driver/route.ts)

- Requiere sesión autenticada
- Verifica que no exista un Driver previo para este usuario
- Crea `Driver { isActive: false }` y `UserRole { role: DRIVER, isActive: false }` en transacción
- Envía email de notificación al admin (usando `nodemailer` como en `email.ts`)
- Devuelve `{ success: true, status: 'PENDING_VERIFICATION' }`

```typescript
// POST - Request DRIVER role activation (pending admin approval)
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // Check if already a driver
    const existingDriver = await prisma.driver.findUnique({
        where: { userId: session.user.id }
    });
    if (existingDriver) {
        return NextResponse.json({ 
            error: existingDriver.isActive 
                ? "Ya sos repartidor activo" 
                : "Tu solicitud está pendiente de aprobación", 
            status: existingDriver.isActive ? 'ACTIVE' : 'PENDING_VERIFICATION' 
        }, { status: 409 });
    }
    
    await prisma.$transaction(async (tx) => {
        await tx.driver.create({
            data: { userId: session.user.id, isActive: false }
        });
        await tx.userRole.create({
            data: { userId: session.user.id, role: 'DRIVER', isActive: false }
        });
    });
    
    // Send admin notification email (non-blocking)
    sendDriverRequestNotification(session.user.name, session.user.email);
    
    return NextResponse.json({ success: true, status: 'PENDING_VERIFICATION' });
}
```

Se agrega una función `sendDriverRequestNotification` en `email.ts` con un email simple al admin.

#### [MODIFY] [email.ts](file:///c:/moovy/moovy/src/lib/email.ts)

Agregar función `sendDriverRequestNotification(driverName, driverEmail)` y `sendDriverApprovalEmail(email, firstName)`:

```typescript
export async function sendDriverRequestNotification(
    driverName: string | null, 
    driverEmail: string | null
) { /* email al admin notificando nueva solicitud */ }

export async function sendDriverApprovalEmail(
    email: string, 
    firstName: string
) { /* email de bienvenida al repartidor aprobado */ }
```

---

### 4. API – Aprobación de driver por admin

#### [NEW] [route.ts](file:///c:/moovy/moovy/src/app/api/admin/drivers/[id]/approve/route.ts)

- Requiere sesión admin
- Busca el Driver por su `id`
- Activa `Driver.isActive = true`
- Activa `UserRole { role: DRIVER, isActive: true }`
- Envía email de bienvenida al repartidor
- Devuelve el driver actualizado

```typescript
// PUT - Approve driver application
export async function PUT(request, context) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return 401;
    }
    
    const { id } = await context.params;
    const driver = await prisma.driver.findUnique({
        where: { id },
        include: { user: { select: { id, name, email } } }
    });
    
    await prisma.$transaction(async (tx) => {
        await tx.driver.update({ where: { id }, data: { isActive: true } });
        await tx.userRole.updateMany({
            where: { userId: driver.userId, role: 'DRIVER' },
            data: { isActive: true }
        });
    });
    
    sendDriverApprovalEmail(driver.user.email, driver.user.name);
    return NextResponse.json({ success: true, driver });
}
```

---

### 5. Frontend – Página de registro

#### [MODIFY] [page.tsx](file:///c:/moovy/moovy/src/app/(store)/registro/page.tsx)

Cambios mínimos:
- Remover validación de teléfono obligatorio (líneas 60-63)
- Cambiar tooltip del teléfono de "Necesario para..." a "Opcional, para que el repartidor te contacte"
- Agregar auto-login después del registro exitoso (usando `signIn` de `next-auth/react`)
- Redirigir a `/` (tienda) en vez de `/login?registered=true`

```diff
-if (!phone || phone.length < 8) {
-    setError("Por favor ingresá un número de teléfono válido");
-    return;
-}
```

```diff
 if (res.ok) {
     setSuccess(true);
-    setTimeout(() => {
-        router.push("/login?registered=true");
-    }, 2000);
+    // Auto-login and redirect to store
+    const signInResult = await signIn("credentials", {
+        email,
+        password,
+        redirect: false,
+    });
+    if (signInResult?.ok) {
+        router.push("/");
+    } else {
+        router.push("/login?registered=true");
+    }
 }
```

---

### 6. Frontend – Perfil (Oportunidades MOOVY)

#### [MODIFY] [page.tsx](file:///c:/moovy/moovy/src/app/(store)/mi-perfil/page.tsx)

Cambios en la sección "Oportunidades MOOVY" (líneas 131-160):
- Agregar estado para cargar roles del usuario al montar
- Agregar botón **"Quiero vender"** → llama a `/api/auth/activate-seller`
- Cambiar link de repartidor → botón que llama a `/api/auth/activate-driver`
- Mostrar badges de estado: ✅ Activo, ⏳ Pendiente, etc.
- Mantener link de comercio como está (onboarding separado)

---

## Verification Plan

### Automated Tests

No hay tests automatizados existentes para los endpoints de auth. Se valida con `npx next build` para asegurar que no hay errores de compilación:

```bash
cd c:\moovy\moovy && npx next build
```

### Manual Verification

> [!NOTE]
> Para todas las pruebas, usar la app en `http://localhost:3000` con `npm run dev`.

1. **Registro de usuario nuevo:**
   - Ir a `/registro`
   - Completar: nombre, apellido, email, contraseña (sin teléfono)
   - Verificar que se registra correctamente y redirige a la tienda
   - Verificar en DB que se creó `User` con `role: USER` y `UserRole { role: USER }`

2. **Activación de seller:**
   - Loguearse con el usuario creado
   - Ir a `/mi-perfil`
   - Clickear "Quiero vender"
   - Verificar que muestra estado activo
   - Verificar en DB que se creó `UserRole { role: SELLER }`

3. **Solicitud de driver:**
   - Desde `/mi-perfil`, clickear "Quiero repartir"
   - Verificar que muestra "Pendiente de verificación"
   - Verificar en DB que se creó `Driver { isActive: false }` y `UserRole { role: DRIVER, isActive: false }`

4. **Aprobación de driver:**
   - Loguearse como admin
   - Desde la API: `PUT /api/admin/drivers/{driverId}/approve`
   - Verificar que `Driver.isActive` y `UserRole.isActive` se actualizaron a `true`
