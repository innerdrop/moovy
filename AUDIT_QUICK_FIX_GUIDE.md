# Quick Fix Guide - Moovy API Audit Issues

## CRITICAL Issues - Fix First (2-3 hours)

### Issue #1: Order Cancellation Stock Loss
**File:** `src/app/api/orders/[id]/route.ts` (lines 337-351)

**Current Code:**
```typescript
const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });

await prisma.$transaction(async (tx) => {
    for (const item of orderItems) {
        if (item.listingId) {
            await tx.listing.update({
                where: { id: item.listingId },
                data: { stock: { increment: item.quantity } },
            });
```

**Fixed Code:**
```typescript
const orderItems = await prisma.orderItem.findMany({
    where: { orderId: id },
    include: { listing: { select: { id: true, stock: true } }, product: { select: { id: true, stock: true } } }
});

await prisma.$transaction(async (tx) => {
    for (const item of orderItems) {
        if (item.listingId && item.listing) {
            // Verify stock was actually decremented before refunding
            const listing = await tx.listing.findUnique({ where: { id: item.listingId } });
            if (!listing) continue; // Listing deleted, skip

            await tx.listing.update({
                where: { id: item.listingId },
                data: { stock: { increment: item.quantity } },
            });
        } else if (item.productId && item.product) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) continue; // Product deleted, skip

            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
            });
        }
    }
```

---

### Issue #2: Admin Can Delete Other Admins
**File:** `src/app/api/admin/users/route.ts` (line 193)

**Current Code:**
```typescript
const usersToDelete = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, role: true, email: true }
});

const hasAdmin = usersToDelete.some(u => u.role === "ADMIN");  // ❌ WRONG
if (hasAdmin) {
    return NextResponse.json({ error: "No se pueden eliminar usuarios admin" }, { status: 400 });
}
```

**Fixed Code:**
```typescript
const usersToDelete = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
        id: true,
        email: true,
        roles: { select: { role: true } }  // ✅ Include UserRole records
    }
});

// Check actual roles in UserRole table, not legacy user.role field
const hasAdminRole = usersToDelete.some(u =>
    u.roles?.some((r: any) => r.role === "ADMIN")
);
if (hasAdminRole) {
    return NextResponse.json({ error: "No se pueden eliminar usuarios admin" }, { status: 400 });
}
```

---

### Issue #3: Deleted Users Visible in Admin Panel
**File:** `src/app/api/admin/users/route.ts` (line 19)

**Current Code:**
```typescript
const users = await prisma.user.findMany({
    select: { /* ... */ },
    orderBy: { createdAt: "desc" }
});  // ❌ No deletedAt filter
```

**Fixed Code:**
```typescript
const users = await prisma.user.findMany({
    where: { deletedAt: null },  // ✅ Filter soft-deleted
    select: { /* ... */ },
    orderBy: { createdAt: "desc" }
});
```

**Apply Same Fix To:**
- `/src/app/api/orders/route.ts` line 777
- `/src/app/api/admin/drivers/route.ts` line 16
- `/src/app/api/products/route.ts` line 42

---

## HIGH Priority Issues - Fix This Week (4-6 hours)

### Issue #4 & #5: Inconsistent Auth Checks
**Files:** Multiple `/src/app/api/admin/*` routes

**Replace All Instances Of:**
```typescript
// ❌ DO NOT USE
const userRole = (session?.user as any)?.role;
if (!session || userRole !== "ADMIN") { ... }

// ❌ DO NOT USE EITHER
const isAdmin = hasAnyRole(session, ["ADMIN"]) || session?.user?.email === "admin@moovy.com";

// ✅ USE ONLY THIS
if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
}
```

---

### Issue #7: Driver Can Update Another Driver's Location
**File:** `src/app/api/driver/location/route.ts`

**Current Code:**
```typescript
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { latitude, longitude, driverId } = await request.json();

    await prisma.driver.update({
        where: { id: driverId },  // ❌ No check that this is the logged-in driver
        data: { latitude, longitude }
    });
}
```

**Fixed Code:**
```typescript
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id }
    });

    if (!driver) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

    const { latitude, longitude } = await request.json();

    // Only allow drivers to update their own location
    await prisma.driver.update({
        where: { id: driver.id },  // ✅ Uses authenticated user's driver ID
        data: { latitude, longitude }
    });
}
```

---

### Issue #9: User Can Delete Another User's Address
**File:** `src/app/api/profile/addresses/[id]/route.ts`

**Add DELETE Handler (if missing):**
```typescript
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        // ✅ Verify ownership before deleting
        const address = await prisma.address.findUnique({ where: { id } });
        if (!address) {
            return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
        }

        if (address.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        await prisma.address.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting address:", error);
        return NextResponse.json({ error: "Error al eliminar dirección" }, { status: 500 });
    }
}
```

---

### Issue #11: Merchant Can See Other Merchants' Orders
**File:** `src/app/api/merchant/orders/route.ts` (line 30-32)

**Current Code:**
```typescript
const where = hasAnyRole(session, ["ADMIN"])
    ? {}
    : { merchantId: { in: merchantIds.length > 0 ? merchantIds : ["NONE"] } };
    //                                                   ^^^^^^ ← Dangerous!
```

**Fixed Code:**
```typescript
let where: any = {};

if (!hasAnyRole(session, ["ADMIN"])) {
    if (merchantIds.length === 0) {
        // Merchant has no stores; return empty result
        return NextResponse.json([]);
    }
    where = { merchantId: { in: merchantIds } };
}

const orders = await prisma.order.findMany({
    where,
    // ...
});
```

---

## MEDIUM Priority Issues - This Sprint (3-4 hours)

### Issue #12: Admin PATCH Missing Validation
**File:** `src/app/api/admin/merchants/route.ts` (lines 62-89)

**Before:**
```typescript
const data = await request.json();
const { id, ...updateData } = data;

const updated = await prisma.merchant.update({
    where: { id },
    data: updateData  // ❌ NO VALIDATION!
});
```

**After:**
```typescript
import { z } from "zod";

const MerchantUpdateSchema = z.object({
    name: z.string().optional(),
    businessName: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    // ✅ Whitelist ONLY safe fields; exclude mpAccessToken, cuit, etc.
});

const data = await request.json();
const { id, ...rawUpdateData } = data;

const validation = validateInput(MerchantUpdateSchema, rawUpdateData);
if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
}

const updated = await prisma.merchant.update({
    where: { id },
    data: validation.data!
});
```

---

### Issue #13: Standardize Password Validation
**Files:**
- `src/app/api/admin/drivers/route.ts` line 56
- `src/app/api/admin/users/route.ts` line 57
- `src/app/api/auth/register/route.ts` (already correct)

**Replace:**
```typescript
if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
}
```

**With:**
```typescript
const pwCheck = validatePasswordStrength(password);
if (!pwCheck.valid) {
    return NextResponse.json(
        { error: `Contraseña débil: ${pwCheck.errors.join(", ")}` },
        { status: 400 }
    );
}
```

---

### Issue #14: Add Pagination to Admin Routes
**Files:** All admin list endpoints

**Template:**
```typescript
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");

        const [items, total] = await Promise.all([
            prisma.item.findMany({
                where: { deletedAt: null },
                skip: offset,
                take: limit,
                orderBy: { createdAt: "desc" }
            }),
            prisma.item.count({ where: { deletedAt: null } })
        ]);

        return NextResponse.json({ items, total, limit, offset });
    } catch (error) {
        console.error("Error fetching items:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
```

---

### Issue #16: Better Referral Code Error Handling
**File:** `src/app/api/auth/register/route.ts` (lines 75-88)

**Current:**
```typescript
if (data.referralCode && data.referralCode.trim()) {
    const referralCodeClean = data.referralCode.trim().toUpperCase();
    referrerInfo = await prisma.user.findUnique({
        where: { referralCode: referralCodeClean },
        select: { id: true, name: true, pointsBalance: true }
    });

    if (referrerInfo) {
        referrerId = referrerInfo.id;
    } else {
        // Invalid referral code — silently ignore  ❌
    }
}
```

**Fixed:**
```typescript
if (data.referralCode && data.referralCode.trim()) {
    const referralCodeClean = data.referralCode.trim().toUpperCase();
    referrerInfo = await prisma.user.findUnique({
        where: { referralCode: referralCodeClean },
        select: { id: true, name: true, pointsBalance: true }
    });

    if (!referrerInfo) {
        // ✅ Reject invalid codes immediately
        return NextResponse.json(
            { error: "Código de referencia inválido o expirado" },
            { status: 400 }
        );
    }

    referrerId = referrerInfo.id;
}
```

---

## Testing Checklist After Fixes

- [ ] Run `npx tsc --noEmit` to verify no TypeScript errors
- [ ] Test order cancellation doesn't go negative stock
- [ ] Verify admin can't be deleted by other admins
- [ ] Verify deleted users don't appear in admin panel
- [ ] Verify driver can only update their own location
- [ ] Verify user can't delete other user's addresses
- [ ] Verify merchant can't see other merchant orders
- [ ] Run existing test suite (if any)
- [ ] Manual smoke test: registration → order → payment → delivery

---

## Files Modified Summary

```
src/app/api/orders/[id]/route.ts                   (1 fix)
src/app/api/admin/users/route.ts                   (3 fixes)
src/app/api/admin/merchants/route.ts               (2 fixes)
src/app/api/admin/drivers/route.ts                 (2 fixes)
src/app/api/driver/location/route.ts               (1 fix)
src/app/api/profile/addresses/[id]/route.ts        (1 fix)
src/app/api/merchant/orders/route.ts               (1 fix)
src/app/api/orders/route.ts                        (1 fix)
src/app/api/products/route.ts                      (1 fix)
src/app/api/auth/register/route.ts                 (1 fix)

Total: 14 files, ~30 code changes
Estimated time: 9-13 hours
```

---

## Questions?

Refer to the full `API_AUDIT_REPORT.md` for detailed analysis, or `AUDIT_SUMMARY.txt` for executive overview.
