/**
 * Auth Utility Functions for Multi-Role System
 * 
 * These functions work with both the new `roles[]` array
 * and fall back to the legacy `role` string field.
 */

import { Session } from "next-auth";

type SessionUser = Session["user"] & { role?: string; roles?: string[] };

/**
 * Check if the session user has a specific role.
 * Prefers `roles[]` array, falls back to legacy `role` string.
 */
export function hasRole(session: Session | null, role: string): boolean {
    if (!session?.user) return false;
    const user = session.user as SessionUser;

    // Check roles[] array first
    if (Array.isArray(user.roles) && user.roles.includes(role)) {
        return true;
    }

    // Also check legacy role field (defense-in-depth for data inconsistencies)
    return user.role === role;
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
export function getUserRoles(session: Session | null): string[] {
    if (!session?.user) return [];
    const user = session.user as SessionUser;

    // Merge both sources to handle data inconsistencies
    const rolesFromArray = Array.isArray(user.roles) ? user.roles : [];
    const legacyRole = user.role ? [user.role] : [];

    const merged = [...new Set([...rolesFromArray, ...legacyRole])];
    return merged.length > 0 ? merged : [];
}
