// Auto-heal UserRole inconsistencies
//
// Algunos usuarios tienen filas en Merchant / Driver / SellerProfile pero su
// UserRole correspondiente está en `isActive: false` o nunca se creó (código
// histórico, migraciones parciales, aprobación manual sin pasar por los
// endpoints actuales, etc).
//
// Este helper detecta esas inconsistencias y las repara: si existe el perfil
// subyacente (Merchant, Driver aprobado o activo, SellerProfile activo) pero
// el UserRole está inactivo o ausente, lo crea / activa.
//
// Se llama desde:
//   1. `authorize()` de auth.ts, después de validar la contraseña, para que
//      CADA login nuevo auto-repare cualquier drift acumulado y el JWT
//      emitido ya incluya los roles correctos.
//   2. El trigger `update` del callback `jwt()` con `refreshRoles: true`,
//      para que activaciones en caliente (ej: aprobación de un driver
//      mientras el user tiene sesión abierta) puedan refrescar los roles
//      sin pedirle al user que cierre sesión.
//
// Devuelve la lista actualizada de roles activos desde `UserRole` (SIN
// incluir el campo legacy `User.role` — eso lo maneja el caller).

import { prisma } from "@/lib/prisma";

export async function autoHealUserRoles(userId: string): Promise<string[]> {
    // Leer roles activos actuales
    const currentRoles = await prisma.userRole.findMany({
        where: { userId, isActive: true },
        select: { role: true },
    });
    const activeRoles = new Set(currentRoles.map((r) => r.role));

    // Auto-heal DRIVER: si hay Driver row con approvalStatus === APPROVED o
    // isActive === true, asegurar que UserRole DRIVER esté activo
    if (!activeRoles.has("DRIVER")) {
        try {
            const driver = await prisma.driver.findUnique({
                where: { userId },
                select: { approvalStatus: true, isActive: true },
            });
            if (driver && (driver.approvalStatus === "APPROVED" || driver.isActive)) {
                await prisma.userRole.upsert({
                    where: { userId_role: { userId, role: "DRIVER" } },
                    update: { isActive: true },
                    create: { userId, role: "DRIVER", isActive: true },
                });
                activeRoles.add("DRIVER");
            }
        } catch (err) {
            console.error("[auto-heal-roles] DRIVER heal failed:", err);
        }
    }

    // Auto-heal SELLER: si hay SellerProfile activo, asegurar UserRole SELLER
    if (!activeRoles.has("SELLER")) {
        try {
            const seller = await prisma.sellerProfile.findUnique({
                where: { userId },
                select: { isActive: true },
            });
            if (seller?.isActive) {
                await prisma.userRole.upsert({
                    where: { userId_role: { userId, role: "SELLER" } },
                    update: { isActive: true },
                    create: { userId, role: "SELLER", isActive: true },
                });
                activeRoles.add("SELLER");
            }
        } catch (err) {
            console.error("[auto-heal-roles] SELLER heal failed:", err);
        }
    }

    // Auto-heal COMERCIO: si existe Merchant para este user, asegurar
    // UserRole COMERCIO. NOTA: aceptamos el merchant independientemente de
    // su approvalStatus — el gate de aprobación es responsabilidad de
    // `role-access.ts` (getMerchantAccess). Acá solo queremos que el JWT
    // refleje que el user ES dueño de un merchant, así `proxy.ts` no lo
    // bouncea antes de llegar al layout protegido (que es quien decide si
    // lo manda a /comercios/pendiente-aprobacion).
    if (!activeRoles.has("COMERCIO")) {
        try {
            const merchant = await prisma.merchant.findFirst({
                where: { ownerId: userId },
                select: { id: true },
            });
            if (merchant) {
                await prisma.userRole.upsert({
                    where: { userId_role: { userId, role: "COMERCIO" } },
                    update: { isActive: true },
                    create: { userId, role: "COMERCIO", isActive: true },
                });
                activeRoles.add("COMERCIO");
            }
        } catch (err) {
            console.error("[auto-heal-roles] COMERCIO heal failed:", err);
        }
    }

    return Array.from(activeRoles);
}
