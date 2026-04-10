/**
 * Centralized Role Access Control
 *
 * Single source of truth for "can this user access the X portal?"
 * Handles the full chain: registration → approval → suspension → activity.
 *
 * Used by:
 *  - Protected layouts (comercios, repartidor, vendedor) — server-side redirect
 *  - API endpoints that need to verify access without redirecting
 *  - Future: access-status endpoints (GET /api/driver/access-status) for client-side modals
 *
 * Design notes:
 *  - Each helper does ONE DB query with a narrow select.
 *  - Denial always carries BOTH a redirectTo (for layouts) AND a human message (for UI).
 *  - Sellers have no approvalStatus — they self-activate on registration.
 *  - Admins are NOT short-circuited here; layouts must bypass via hasAnyRole(["ADMIN"])
 *    before calling these helpers, so admin access stays explicit at the call site.
 */

import { prisma } from "@/lib/prisma";

export type AccessDenialReason =
    | "NOT_REGISTERED"      // No row exists in Merchant/Driver/SellerProfile
    | "PENDING_APPROVAL"    // approvalStatus === "PENDING"
    | "REJECTED"            // approvalStatus === "REJECTED"
    | "SUSPENDED"           // isSuspended === true
    | "INACTIVE";           // isActive === false (sellers only for now)

export interface RoleAccessResult {
    canAccess: boolean;
    reason?: AccessDenialReason;
    /** Path to redirect to from a server component. Never null when canAccess is false. */
    redirectTo?: string;
    /** Human-readable Spanish message for showing in UI (toast/modal). */
    message?: string;
}

/**
 * Check if a user can access the /comercios portal.
 * Chain: merchant exists → APPROVED → not suspended.
 */
export async function getMerchantAccess(userId: string): Promise<RoleAccessResult> {
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        select: { approvalStatus: true, isSuspended: true, rejectionReason: true },
    });

    if (!merchant) {
        return {
            canAccess: false,
            reason: "NOT_REGISTERED",
            redirectTo: "/comercios/login",
            message: "No encontramos un comercio asociado a tu cuenta.",
        };
    }

    if (merchant.approvalStatus === "PENDING") {
        return {
            canAccess: false,
            reason: "PENDING_APPROVAL",
            redirectTo: "/comercios/pendiente-aprobacion",
            message: "Tu comercio está pendiente de aprobación. Te avisamos por email apenas esté listo.",
        };
    }

    if (merchant.approvalStatus === "REJECTED") {
        return {
            canAccess: false,
            reason: "REJECTED",
            redirectTo: "/comercios/pendiente-aprobacion",
            message: merchant.rejectionReason
                ? `Tu solicitud fue rechazada: ${merchant.rejectionReason}`
                : "Tu solicitud de comercio fue rechazada. Contactanos a soporte@somosmoovy.com.",
        };
    }

    if (merchant.isSuspended) {
        return {
            canAccess: false,
            reason: "SUSPENDED",
            redirectTo: "/cuenta-suspendida?role=comercio",
            message: "Tu comercio está suspendido temporalmente.",
        };
    }

    return { canAccess: true };
}

/**
 * Check if a user can access the /repartidor portal.
 * Chain: driver exists → APPROVED → not suspended.
 */
export async function getDriverAccess(userId: string): Promise<RoleAccessResult> {
    const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { approvalStatus: true, isSuspended: true, isActive: true, rejectionReason: true },
    });

    if (!driver) {
        return {
            canAccess: false,
            reason: "NOT_REGISTERED",
            redirectTo: "/repartidor/registro",
            message: "No encontramos un perfil de repartidor asociado a tu cuenta.",
        };
    }

    if (driver.approvalStatus === "PENDING") {
        return {
            canAccess: false,
            reason: "PENDING_APPROVAL",
            redirectTo: "/repartidor/pendiente-aprobacion",
            message: "Tu solicitud de repartidor está pendiente de aprobación. Te avisamos por email apenas esté listo.",
        };
    }

    if (driver.approvalStatus === "REJECTED") {
        return {
            canAccess: false,
            reason: "REJECTED",
            redirectTo: "/repartidor/pendiente-aprobacion",
            message: driver.rejectionReason
                ? `Tu solicitud fue rechazada: ${driver.rejectionReason}`
                : "Tu solicitud de repartidor fue rechazada. Contactanos a soporte@somosmoovy.com.",
        };
    }

    if (driver.isSuspended) {
        return {
            canAccess: false,
            reason: "SUSPENDED",
            redirectTo: "/cuenta-suspendida?role=driver",
            message: "Tu cuenta de repartidor está suspendida temporalmente.",
        };
    }

    // isActive === false means the driver was approved but admin manually deactivated
    if (!driver.isActive) {
        return {
            canAccess: false,
            reason: "INACTIVE",
            redirectTo: "/repartidor/pendiente-aprobacion",
            message: "Tu cuenta de repartidor está desactivada. Contactá a soporte para reactivarla.",
        };
    }

    return { canAccess: true };
}

/**
 * Check if a user can access the /vendedor portal.
 * Marketplace sellers auto-activate on registration (no approval gate).
 * Chain: seller profile exists → active → not suspended.
 */
export async function getSellerAccess(userId: string): Promise<RoleAccessResult> {
    const seller = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: { isSuspended: true, isActive: true },
    });

    if (!seller) {
        return {
            canAccess: false,
            reason: "NOT_REGISTERED",
            redirectTo: "/vendedor/registro",
            message: "No encontramos un perfil de vendedor asociado a tu cuenta.",
        };
    }

    if (!seller.isActive) {
        return {
            canAccess: false,
            reason: "INACTIVE",
            redirectTo: "/mi-perfil",
            message: "Tu perfil de vendedor está inactivo. Contactá a soporte para reactivarlo.",
        };
    }

    if (seller.isSuspended) {
        return {
            canAccess: false,
            reason: "SUSPENDED",
            redirectTo: "/cuenta-suspendida?role=seller",
            message: "Tu cuenta de vendedor está suspendida temporalmente.",
        };
    }

    return { canAccess: true };
}
