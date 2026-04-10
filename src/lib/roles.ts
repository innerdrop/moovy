/**
 * src/lib/roles.ts
 *
 * Sistema canónico de control de acceso por rol para Moovy.
 *
 * -----------------------------------------------------------------------------
 * PRINCIPIO DE DISEÑO (2026-04-10 — rediseño)
 * -----------------------------------------------------------------------------
 *
 * Los roles NO se guardan como estado persistido separado. Se DERIVAN en cada
 * request desde el estado de dominio (Merchant.approvalStatus, Driver.approvalStatus,
 * SellerProfile.isActive, etc.).
 *
 * Esto elimina una familia entera de bugs que Moovy tenía:
 *   - UserRole.isActive desincronizado del estado real del Merchant
 *   - Auto-heal rebotando roles entre login y JWT refresh
 *   - JWT con roles obsoletos después de admin approve/reject
 *   - Merchant PENDING con rol COMERCIO activo en el token
 *   - PortalSwitcher mostrando portales que el user no puede usar
 *
 * Regla de oro: si el código necesita saber "¿este user puede entrar al portal X?",
 * llama a `computeUserAccess(userId)` o `requireXAccess(userId)`. NUNCA lee
 * UserRole.isActive, token.roles, ni chequea flags sueltos de Merchant/Driver.
 *
 * -----------------------------------------------------------------------------
 * CAMPOS QUE SÍ SE LEEN (fuente de verdad)
 * -----------------------------------------------------------------------------
 *   User.isSuspended / suspendedUntil   → bloqueo global temporal o permanente
 *   User.archivedAt                     → usuario archivado (no puede loguear)
 *   User.deletedAt                      → soft delete (no existe más)
 *   User.role === "ADMIN"               → flag de administrador (campo plano)
 *   Merchant.approvalStatus             → PENDING | APPROVED | REJECTED
 *   Merchant.isSuspended / suspendedUntil → bloqueo temporal del comercio
 *   Driver.approvalStatus               → PENDING | APPROVED | REJECTED
 *   Driver.isSuspended / suspendedUntil → bloqueo temporal del driver
 *   SellerProfile.isActive              → activo/inactivo (Fase 1, sin approval)
 *   SellerProfile.isSuspended           → bloqueo temporal del seller
 *
 * -----------------------------------------------------------------------------
 * CAMPOS QUE NO SE LEEN MÁS (legacy — ignorar)
 * -----------------------------------------------------------------------------
 *   UserRole[]              → tabla sigue existiendo por compat, pero este
 *                             módulo NO la consulta. En Fase 2 se elimina.
 *   User.role (String)      → legacy, solo se usa para chequear ADMIN.
 *                             El resto de roles se deriva del dominio.
 *   Merchant.isActive       → legacy. approvalStatus es la fuente de verdad.
 *   Merchant.isVerified     → legacy display-only (badge). No es gate.
 *   Driver.isActive         → legacy. approvalStatus es la fuente de verdad.
 *
 * -----------------------------------------------------------------------------
 * USO TÍPICO
 * -----------------------------------------------------------------------------
 *
 *   // En un Server Component / layout protegido:
 *   import { requireMerchantAccess } from "@/lib/roles";
 *   const session = await auth();
 *   const access = await requireMerchantAccess(session!.user!.id);
 *   // Si llegamos acá, el user es merchant aprobado. access.merchant.merchantId existe.
 *
 *   // En un componente de UI (PortalSwitcher, sidebar, etc.):
 *   import { computeUserAccess, canAccessMerchantPortal } from "@/lib/roles";
 *   const access = await computeUserAccess(session.user.id);
 *   if (canAccessMerchantPortal(access)) { ... }
 *
 *   // En un endpoint admin (approve merchant):
 *   import { approveMerchantTransition } from "@/lib/roles";
 *   await approveMerchantTransition({ merchantId, adminId, adminEmail });
 */

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------------
// TIPOS PÚBLICOS
// -----------------------------------------------------------------------------

/**
 * Estado de acceso de un usuario a un portal específico (comercio, repartidor, vendedor).
 *
 *   "none"      — el user no tiene el perfil creado (no se registró como X)
 *   "pending"   — el perfil existe, esperando aprobación de admin
 *   "approved"  — el perfil está aprobado y el user puede usar el portal
 *   "rejected"  — admin rechazó el perfil (terminal; requiere recrear perfil)
 *   "suspended" — aprobado pero temporalmente bloqueado (global o por entidad)
 */
export type PortalStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

export type MerchantAccess = {
    status: PortalStatus;
    merchantId: string | null;
    rejectionReason: string | null;
    suspendedUntil: Date | null;
    suspensionReason: string | null;
};

export type DriverAccess = {
    status: PortalStatus;
    driverId: string | null;
    rejectionReason: string | null;
    suspendedUntil: Date | null;
    suspensionReason: string | null;
};

export type SellerAccess = {
    status: PortalStatus;
    sellerId: string | null;
    rejectionReason: string | null;
    suspendedUntil: Date | null;
    suspensionReason: string | null;
};

/**
 * Snapshot completo del estado de acceso de un usuario.
 *
 * Este objeto es la única fuente de verdad que el resto del código debe usar
 * para decidir qué puede hacer un usuario. Se obtiene via `computeUserAccess(userId)`
 * y está cacheado por request (React cache), así que llamarlo múltiples veces
 * en la misma request no genera queries duplicadas.
 */
export type UserAccess = {
    userId: string;
    email: string;
    name: string;

    // Flags globales del user
    isAdmin: boolean;
    isArchived: boolean;
    isGloballySuspended: boolean;
    globalSuspendedUntil: Date | null;
    globalSuspensionReason: string | null;

    // Estado por portal
    merchant: MerchantAccess;
    driver: DriverAccess;
    seller: SellerAccess;
};

// -----------------------------------------------------------------------------
// CÓMPUTO DE ACCESO (la función core)
// -----------------------------------------------------------------------------

/**
 * Computa el estado de acceso de un usuario a partir del estado del dominio.
 *
 * Cacheado por request via React `cache()`, así que si un layout lo llama y
 * un child component también, es una sola query a la DB.
 *
 * Retorna `null` si el usuario no existe, está soft-deleted, o el ID es inválido.
 * El caller es responsable de redirigir a /login en ese caso.
 *
 * IMPORTANTE: esta función es READ-ONLY. No escribe en la DB, no auto-repara
 * drift, no mutara nada. Si necesitás que una transición (approve, reject,
 * suspend) pase, usá las funciones `*Transition` de abajo.
 */
export const computeUserAccess = cache(
    async (userId: string): Promise<UserAccess | null> => {
        if (!userId) return null;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isSuspended: true,
                suspendedUntil: true,
                suspensionReason: true,
                archivedAt: true,
                deletedAt: true,
                ownedMerchants: {
                    orderBy: { createdAt: "asc" },
                    take: 1,
                    select: {
                        id: true,
                        approvalStatus: true,
                        rejectionReason: true,
                        isSuspended: true,
                        suspendedUntil: true,
                        suspensionReason: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        approvalStatus: true,
                        rejectionReason: true,
                        isSuspended: true,
                        suspendedUntil: true,
                        suspensionReason: true,
                    },
                },
                sellerProfile: {
                    select: {
                        id: true,
                        isActive: true,
                        isSuspended: true,
                        suspendedUntil: true,
                        suspensionReason: true,
                    },
                },
            },
        });

        if (!user || user.deletedAt) {
            return null;
        }

        const isGloballySuspended = isCurrentlySuspended(
            user.isSuspended,
            user.suspendedUntil
        );
        const isArchived = Boolean(user.archivedAt);

        return {
            userId: user.id,
            email: user.email,
            name: user.name ?? "",
            isAdmin: user.role === "ADMIN",
            isArchived,
            isGloballySuspended,
            globalSuspendedUntil: isGloballySuspended ? user.suspendedUntil : null,
            globalSuspensionReason: isGloballySuspended ? user.suspensionReason : null,
            merchant: deriveMerchantAccess(user.ownedMerchants[0] ?? null, isGloballySuspended),
            driver: deriveDriverAccess(user.driver, isGloballySuspended),
            seller: deriveSellerAccess(user.sellerProfile, isGloballySuspended),
        };
    }
);

// -----------------------------------------------------------------------------
// DERIVADORES PUROS (privados — sin side effects)
// -----------------------------------------------------------------------------

/**
 * Si `suspendedUntil` ya pasó, el user NO está suspendido aunque el flag diga lo contrario.
 * Esto evita que un flag stale deje al user bloqueado después de que expiró la suspensión.
 * La limpieza del flag se delega a un cron aparte (fuera del path de lectura).
 */
function isCurrentlySuspended(
    isSuspended: boolean,
    suspendedUntil: Date | null
): boolean {
    if (!isSuspended) return false;
    if (!suspendedUntil) return true; // permanente
    return suspendedUntil > new Date();
}

type MerchantRow = {
    id: string;
    approvalStatus: string;
    rejectionReason: string | null;
    isSuspended: boolean;
    suspendedUntil: Date | null;
    suspensionReason: string | null;
};

function deriveMerchantAccess(
    row: MerchantRow | null,
    userGloballySuspended: boolean
): MerchantAccess {
    if (!row) {
        return {
            status: "none",
            merchantId: null,
            rejectionReason: null,
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    // REJECTED es terminal — tiene precedencia sobre cualquier suspensión.
    // Si admin rechazó el merchant, el user tiene que ver esa decisión
    // primero antes que cualquier otro estado.
    if (row.approvalStatus === "REJECTED") {
        return {
            status: "rejected",
            merchantId: row.id,
            rejectionReason: row.rejectionReason,
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    // Cualquier estado distinto a APPROVED es pending (incluye PENDING literal
    // y cualquier valor futuro que agreguemos).
    if (row.approvalStatus !== "APPROVED") {
        return {
            status: "pending",
            merchantId: row.id,
            rejectionReason: null,
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    // APPROVED — chequear suspensión (global o específica del merchant)
    const merchantSuspended = isCurrentlySuspended(row.isSuspended, row.suspendedUntil);
    if (userGloballySuspended || merchantSuspended) {
        return {
            status: "suspended",
            merchantId: row.id,
            rejectionReason: null,
            suspendedUntil: merchantSuspended ? row.suspendedUntil : null,
            suspensionReason: merchantSuspended ? row.suspensionReason : null,
        };
    }

    return {
        status: "approved",
        merchantId: row.id,
        rejectionReason: null,
        suspendedUntil: null,
        suspensionReason: null,
    };
}

type DriverRow = {
    id: string;
    approvalStatus: string;
    rejectionReason: string | null;
    isSuspended: boolean;
    suspendedUntil: Date | null;
    suspensionReason: string | null;
};

function deriveDriverAccess(
    row: DriverRow | null,
    userGloballySuspended: boolean
): DriverAccess {
    if (!row) {
        return {
            status: "none",
            driverId: null,
            rejectionReason: null,
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    if (row.approvalStatus === "REJECTED") {
        return {
            status: "rejected",
            driverId: row.id,
            rejectionReason: row.rejectionReason,
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    if (row.approvalStatus !== "APPROVED") {
        return {
            status: "pending",
            driverId: row.id,
            rejectionReason: null,
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    const driverSuspended = isCurrentlySuspended(row.isSuspended, row.suspendedUntil);
    if (userGloballySuspended || driverSuspended) {
        return {
            status: "suspended",
            driverId: row.id,
            rejectionReason: null,
            suspendedUntil: driverSuspended ? row.suspendedUntil : null,
            suspensionReason: driverSuspended ? row.suspensionReason : null,
        };
    }

    return {
        status: "approved",
        driverId: row.id,
        rejectionReason: null,
        suspendedUntil: null,
        suspensionReason: null,
    };
}

type SellerRow = {
    id: string;
    isActive: boolean;
    isSuspended: boolean;
    suspendedUntil: Date | null;
    suspensionReason: string | null;
};

function deriveSellerAccess(
    row: SellerRow | null,
    userGloballySuspended: boolean
): SellerAccess {
    if (!row) {
        return {
            status: "none",
            sellerId: null,
            rejectionReason: null,
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    // Fase 1: SellerProfile no tiene approvalStatus. Usamos isActive como proxy.
    // isActive=false se trata como "rejected" (admin lo desactivó o hay un problema).
    // TODO Fase 2: agregar SellerProfile.approvalStatus y migrar este chequeo.
    if (!row.isActive) {
        return {
            status: "rejected",
            sellerId: row.id,
            rejectionReason: null, // TODO Fase 2: leer rejectionReason real
            suspendedUntil: null,
            suspensionReason: null,
        };
    }

    const sellerSuspended = isCurrentlySuspended(row.isSuspended, row.suspendedUntil);
    if (userGloballySuspended || sellerSuspended) {
        return {
            status: "suspended",
            sellerId: row.id,
            rejectionReason: null,
            suspendedUntil: sellerSuspended ? row.suspendedUntil : null,
            suspensionReason: sellerSuspended ? row.suspensionReason : null,
        };
    }

    return {
        status: "approved",
        sellerId: row.id,
        rejectionReason: null,
        suspendedUntil: null,
        suspensionReason: null,
    };
}

// -----------------------------------------------------------------------------
// GATES (require*Access) — usan redirect() de Next.js
// -----------------------------------------------------------------------------

/**
 * Exige que el user esté autenticado y no archivado/suspendido globalmente.
 * Uso típico: layouts que no gatean por rol pero sí exigen sesión válida.
 */
export async function requireAuthenticated(userId: string | null | undefined): Promise<UserAccess> {
    if (!userId) {
        redirect("/login");
    }

    const access = await computeUserAccess(userId);

    if (!access) {
        redirect("/login");
    }

    if (access.isArchived) {
        redirect("/cuenta-archivada");
    }

    if (access.isGloballySuspended) {
        redirect("/cuenta-suspendida");
    }

    return access;
}

/**
 * Exige acceso al portal de comercio. Redirige según el estado:
 *   - No autenticado → /comercios/login
 *   - Archivado → /cuenta-archivada
 *   - Sin perfil merchant (none) → /comercios/registro
 *   - Pending → /comercios/pendiente-aprobacion
 *   - Rejected → /comercios/pendiente-aprobacion?rejected=1
 *   - Suspended (global o del merchant) → /cuenta-suspendida?role=comercio
 *   - Admin: acceso libre (bypass completo)
 *
 * En caso de acceso permitido, retorna el UserAccess completo.
 * El llamador puede leer `access.merchant.merchantId` si lo necesita.
 */
export async function requireMerchantAccess(userId: string | null | undefined): Promise<UserAccess> {
    if (!userId) {
        redirect("/comercios/login");
    }

    const access = await computeUserAccess(userId);

    if (!access) {
        redirect("/comercios/login");
    }

    if (access.isArchived) {
        redirect("/cuenta-archivada");
    }

    // Admin bypass: admin entra a todos los portales sin importar perfiles.
    // Nota: admin globalmente suspendido igual queda fuera (seguridad).
    if (access.isAdmin) {
        if (access.isGloballySuspended) {
            redirect("/cuenta-suspendida");
        }
        return access;
    }

    switch (access.merchant.status) {
        case "approved":
            return access;
        case "none":
            redirect("/comercios/registro");
        case "pending":
            redirect("/comercios/pendiente-aprobacion");
        case "rejected":
            redirect("/comercios/pendiente-aprobacion?rejected=1");
        case "suspended":
            redirect("/cuenta-suspendida?role=comercio");
        default: {
            // Exhaustive check — TypeScript valida que cubrimos todos los casos
            const _never: never = access.merchant.status;
            throw new Error(`Unhandled merchant status: ${String(_never)}`);
        }
    }
}

/**
 * Exige acceso al portal de repartidor. Ver docstring de `requireMerchantAccess`
 * para el detalle de redirects.
 */
export async function requireDriverAccess(userId: string | null | undefined): Promise<UserAccess> {
    if (!userId) {
        redirect("/repartidor/login");
    }

    const access = await computeUserAccess(userId);

    if (!access) {
        redirect("/repartidor/login");
    }

    if (access.isArchived) {
        redirect("/cuenta-archivada");
    }

    if (access.isAdmin) {
        if (access.isGloballySuspended) {
            redirect("/cuenta-suspendida");
        }
        return access;
    }

    switch (access.driver.status) {
        case "approved":
            return access;
        case "none":
            redirect("/repartidor/registro");
        case "pending":
            redirect("/repartidor/pendiente-aprobacion");
        case "rejected":
            redirect("/repartidor/pendiente-aprobacion?rejected=1");
        case "suspended":
            redirect("/cuenta-suspendida?role=repartidor");
        default: {
            const _never: never = access.driver.status;
            throw new Error(`Unhandled driver status: ${String(_never)}`);
        }
    }
}

/**
 * Exige acceso al portal de vendedor marketplace. Nota: Fase 1 no tiene estado
 * "pending" para sellers (auto-activación), así que ese caso redirige igual que
 * cualquier otro caso inesperado.
 */
export async function requireSellerAccess(userId: string | null | undefined): Promise<UserAccess> {
    if (!userId) {
        redirect("/vendedor/registro");
    }

    const access = await computeUserAccess(userId);

    if (!access) {
        redirect("/vendedor/registro");
    }

    if (access.isArchived) {
        redirect("/cuenta-archivada");
    }

    if (access.isAdmin) {
        if (access.isGloballySuspended) {
            redirect("/cuenta-suspendida");
        }
        return access;
    }

    switch (access.seller.status) {
        case "approved":
            return access;
        case "none":
            redirect("/vendedor/registro");
        case "pending":
            // Fase 1 no tiene pending para sellers, pero cubrimos el caso por si
            // Fase 2 agrega approvalStatus. Por ahora es unreachable.
            redirect("/vendedor/pendiente-aprobacion");
        case "rejected":
            redirect("/mi-perfil?error=seller_inactive");
        case "suspended":
            redirect("/cuenta-suspendida?role=vendedor");
        default: {
            const _never: never = access.seller.status;
            throw new Error(`Unhandled seller status: ${String(_never)}`);
        }
    }
}

/**
 * Exige acceso al panel de admin/ops.
 * Solo usuarios con `User.role === "ADMIN"` pueden entrar. Admin suspendido
 * globalmente queda bloqueado.
 */
export async function requireAdminAccess(userId: string | null | undefined): Promise<UserAccess> {
    if (!userId) {
        redirect("/ops/login");
    }

    const access = await computeUserAccess(userId);

    if (!access) {
        redirect("/ops/login");
    }

    if (!access.isAdmin) {
        redirect("/");
    }

    if (access.isArchived) {
        redirect("/cuenta-archivada");
    }

    if (access.isGloballySuspended) {
        redirect("/cuenta-suspendida");
    }

    return access;
}

// -----------------------------------------------------------------------------
// QUERY HELPERS (sin redirects — para UI que necesita decidir qué mostrar)
// -----------------------------------------------------------------------------

/**
 * ¿El user puede entrar al portal de comercio? (sin mutaciones, sin redirects)
 * Uso: PortalSwitcher, sidebar, badges.
 */
export function canAccessMerchantPortal(access: UserAccess | null): boolean {
    if (!access) return false;
    if (access.isGloballySuspended || access.isArchived) return false;
    if (access.isAdmin) return true;
    return access.merchant.status === "approved";
}

export function canAccessDriverPortal(access: UserAccess | null): boolean {
    if (!access) return false;
    if (access.isGloballySuspended || access.isArchived) return false;
    if (access.isAdmin) return true;
    return access.driver.status === "approved";
}

export function canAccessSellerPortal(access: UserAccess | null): boolean {
    if (!access) return false;
    if (access.isGloballySuspended || access.isArchived) return false;
    if (access.isAdmin) return true;
    return access.seller.status === "approved";
}

export function canAccessAdminPortal(access: UserAccess | null): boolean {
    if (!access) return false;
    if (access.isGloballySuspended || access.isArchived) return false;
    return access.isAdmin;
}

/**
 * Lista de portales a los que el user tiene acceso. Útil para PortalSwitcher
 * para decidir qué botones renderizar.
 */
export type PortalId = "tienda" | "comercio" | "repartidor" | "vendedor" | "ops";

export function getAvailablePortals(access: UserAccess | null): PortalId[] {
    const portals: PortalId[] = ["tienda"]; // tienda siempre disponible
    if (!access) return portals;
    if (canAccessMerchantPortal(access)) portals.push("comercio");
    if (canAccessDriverPortal(access)) portals.push("repartidor");
    if (canAccessSellerPortal(access)) portals.push("vendedor");
    if (canAccessAdminPortal(access)) portals.push("ops");
    return portals;
}

/**
 * ¿El user tiene algún perfil pending de aprobación?
 * Útil para mostrar un banner "Tu solicitud está siendo revisada" en el home.
 */
export function hasPendingApproval(access: UserAccess | null): boolean {
    if (!access) return false;
    return (
        access.merchant.status === "pending" ||
        access.driver.status === "pending"
    );
}

/**
 * ¿El user tiene algún perfil rechazado?
 * Útil para mostrar un mensaje o permitir re-aplicar.
 */
export function hasRejectedProfile(access: UserAccess | null): boolean {
    if (!access) return false;
    return (
        access.merchant.status === "rejected" ||
        access.driver.status === "rejected"
    );
}

// -----------------------------------------------------------------------------
// TRANSICIONES DE ESTADO (approve / reject / suspend)
// -----------------------------------------------------------------------------
//
// Estas funciones son las ÚNICAS que deberían mutar el approvalStatus de
// Merchant/Driver. Centralizar las escrituras acá garantiza:
//   1. Audit log consistente en cada transición
//   2. No se olvidan campos derivados (approvedAt, rejectionReason, etc.)
//   3. Ningún endpoint tiene lógica ad-hoc que genere drift
//
// Los endpoints admin (approve/reject routes) deberían ser wrappers finos sobre
// estas funciones.

type TransitionContext = {
    adminId: string;
    adminEmail: string;
};

/**
 * Transición: PENDING → APPROVED para un Merchant.
 * Crea entrada en audit log.
 *
 * NOTA: esta función NO toca UserRole. En el nuevo diseño, el rol COMERCIO se
 * deriva de Merchant.approvalStatus en cada request — no hay flag que mantener.
 */
export async function approveMerchantTransition(
    merchantId: string,
    ctx: TransitionContext
): Promise<void> {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
        const merchant = await tx.merchant.update({
            where: { id: merchantId },
            data: {
                approvalStatus: "APPROVED",
                approvedAt: now,
                rejectionReason: null,
                // Legacy flags: mantenemos sincronizados por compat con código
                // viejo que todavía los pueda leer (display, badges).
                // Fase 2 los elimina del schema.
                isActive: true,
                isVerified: true,
            },
            select: { id: true, name: true, ownerId: true },
        });

        await tx.auditLog.create({
            data: {
                action: "MERCHANT_APPROVED",
                userId: ctx.adminId,
                entityType: "Merchant",
                entityId: merchant.id,
                details: JSON.stringify({
                    merchantName: merchant.name,
                    merchantOwnerId: merchant.ownerId,
                    adminEmail: ctx.adminEmail,
                }),
            },
        });
    });
}

/**
 * Transición: * → REJECTED para un Merchant.
 * Crea entrada en audit log con el motivo.
 */
export async function rejectMerchantTransition(
    merchantId: string,
    reason: string,
    ctx: TransitionContext
): Promise<void> {
    if (!reason || reason.trim().length < 3) {
        throw new Error("Rejection reason is required (min 3 chars)");
    }

    await prisma.$transaction(async (tx) => {
        const merchant = await tx.merchant.update({
            where: { id: merchantId },
            data: {
                approvalStatus: "REJECTED",
                rejectionReason: reason.trim(),
                // Legacy flags por compat
                isActive: false,
                isVerified: false,
            },
            select: { id: true, name: true, ownerId: true },
        });

        await tx.auditLog.create({
            data: {
                action: "MERCHANT_REJECTED",
                userId: ctx.adminId,
                entityType: "Merchant",
                entityId: merchant.id,
                details: JSON.stringify({
                    merchantName: merchant.name,
                    merchantOwnerId: merchant.ownerId,
                    adminEmail: ctx.adminEmail,
                    reason: reason.trim(),
                }),
            },
        });
    });
}

/**
 * Transición: PENDING → APPROVED para un Driver.
 */
export async function approveDriverTransition(
    driverId: string,
    ctx: TransitionContext
): Promise<void> {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
        const driver = await tx.driver.update({
            where: { id: driverId },
            data: {
                approvalStatus: "APPROVED",
                approvedAt: now,
                rejectionReason: null,
                // Legacy flag por compat
                isActive: true,
            },
            select: { id: true, userId: true },
        });

        await tx.auditLog.create({
            data: {
                action: "DRIVER_APPROVED",
                userId: ctx.adminId,
                entityType: "Driver",
                entityId: driver.id,
                details: JSON.stringify({
                    driverUserId: driver.userId,
                    adminEmail: ctx.adminEmail,
                }),
            },
        });
    });
}

/**
 * Transición: * → REJECTED para un Driver.
 */
export async function rejectDriverTransition(
    driverId: string,
    reason: string,
    ctx: TransitionContext
): Promise<void> {
    if (!reason || reason.trim().length < 3) {
        throw new Error("Rejection reason is required (min 3 chars)");
    }

    await prisma.$transaction(async (tx) => {
        const driver = await tx.driver.update({
            where: { id: driverId },
            data: {
                approvalStatus: "REJECTED",
                rejectionReason: reason.trim(),
                // Legacy flag por compat
                isActive: false,
            },
            select: { id: true, userId: true },
        });

        await tx.auditLog.create({
            data: {
                action: "DRIVER_REJECTED",
                userId: ctx.adminId,
                entityType: "Driver",
                entityId: driver.id,
                details: JSON.stringify({
                    driverUserId: driver.userId,
                    adminEmail: ctx.adminEmail,
                    reason: reason.trim(),
                }),
            },
        });
    });
}
