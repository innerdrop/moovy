/**
 * Auth Utility Functions for Multi-Role System
 *
 * These functions work with both the new `roles[]` array
 * and fall back to the legacy `role` string field.
 *
 * Role aliases: "MERCHANT" ↔ "COMERCIO" are treated as equivalent
 * because legacy User.role uses "MERCHANT" but UserRoleType enum uses "COMERCIO".
 */

import { Session } from "next-auth";

type SessionUser = Session["user"] & { role?: string; roles?: string[] };

/**
 * Role aliases — legacy names that map to enum values and vice versa.
 * When checking for "MERCHANT", also check "COMERCIO" and vice versa.
 */
const ROLE_ALIASES: Record<string, string[]> = {
    MERCHANT: ["MERCHANT", "COMERCIO"],
    COMERCIO: ["MERCHANT", "COMERCIO"],
};

/** Expand a role name to include its aliases */
function expandRole(role: string): string[] {
    return ROLE_ALIASES[role] || [role];
}

/**
 * Check if the session user has a specific role.
 * Handles role aliases (MERCHANT ↔ COMERCIO) automatically.
 * Checks both `roles[]` array and legacy `role` string.
 */
export function hasRole(session: Session | null, role: string): boolean {
    if (!session?.user) return false;
    const user = session.user as SessionUser;
    const rolesToCheck = expandRole(role);

    // Check roles[] array
    if (Array.isArray(user.roles)) {
        if (rolesToCheck.some(r => user.roles!.includes(r))) {
            return true;
        }
    }

    // Also check legacy role field
    return rolesToCheck.includes(user.role || "");
}

/**
 * Check if the session user has ANY of the specified roles.
 */
export function hasAnyRole(session: Session | null, roles: string[]): boolean {
    if (!session?.user) return false;
    return roles.some(role => hasRole(session, role));
}

/**
 * Get all active roles for the session user.
 * Returns `roles[]` if available, otherwise wraps legacy `role` in array.
 */
/**
 * Canonical role names — normalize aliases to a single name for display/comparison.
 * "COMERCIO" → "MERCHANT" (the name used throughout the codebase)
 */
const CANONICAL_ROLES: Record<string, string> = {
    COMERCIO: "MERCHANT",
};

export function getUserRoles(session: Session | null): string[] {
    if (!session?.user) return [];
    const user = session.user as SessionUser;

    // Merge both sources to handle data inconsistencies
    const rolesFromArray = Array.isArray(user.roles) ? user.roles : [];
    const legacyRole = user.role ? [user.role] : [];

    // Normalize aliases to canonical names
    const normalized = [...rolesFromArray, ...legacyRole].map(r => CANONICAL_ROLES[r] || r);
    const merged = [...new Set(normalized)];
    return merged.length > 0 ? merged : [];
}
