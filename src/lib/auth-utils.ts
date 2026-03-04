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

    // Prefer new roles[] array
    if (Array.isArray(user.roles) && user.roles.length > 0) {
        return user.roles.includes(role);
    }

    // Fallback to legacy single role
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

    if (Array.isArray(user.roles) && user.roles.length > 0) {
        return user.roles;
    }

    return user.role ? [user.role] : [];
}
