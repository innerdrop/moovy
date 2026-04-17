/**
 * User Activity Logger
 *
 * Logs user actions to UserActivityLog for admin visibility.
 * Used across all portals: buyer, merchant, seller, driver, admin.
 *
 * Actions follow the pattern: ENTITY_VERB (e.g., ORDER_CREATED, PRODUCT_ADDED, LOGIN)
 * This is separate from AuditLog which tracks admin/ops actions.
 */

import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const activityLogger = logger.child({ context: "user-activity" });

export interface LogActivityParams {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a user activity. Fire-and-forget — never throws.
 */
export async function logUserActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Never let activity logging break the main flow
    activityLogger.error({ error, ...params }, "Failed to log user activity");
  }
}

/**
 * Log an admin action on a user (suspend, unsuspend, archive, commission change, etc.)
 * This is a convenience wrapper that also stores the admin's userId in metadata.
 */
export async function logAdminAction(params: {
  adminUserId: string;
  targetUserId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId: params.targetUserId,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        metadata: JSON.stringify({
          adminUserId: params.adminUserId,
          ...params.details,
        }),
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    activityLogger.error({ error, ...params }, "Failed to log admin action");
  }
}

/**
 * Extract IP and User-Agent from NextRequest headers.
 */
export function extractRequestInfo(request: Request): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}

// Standard action constants for consistency
export const ACTIVITY_ACTIONS = {
  // Auth
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",

  // Orders
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_REJECTED: "ORDER_REJECTED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_DELIVERED: "ORDER_DELIVERED",

  // Products / Listings
  PRODUCT_ADDED: "PRODUCT_ADDED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_DELETED: "PRODUCT_DELETED",
  LISTING_ADDED: "LISTING_ADDED",
  LISTING_UPDATED: "LISTING_UPDATED",
  LISTING_DELETED: "LISTING_DELETED",

  // Merchant
  MERCHANT_SETTINGS_UPDATED: "MERCHANT_SETTINGS_UPDATED",
  MERCHANT_SCHEDULE_UPDATED: "MERCHANT_SCHEDULE_UPDATED",

  // Driver
  DRIVER_CONNECTED: "DRIVER_CONNECTED",
  DRIVER_DISCONNECTED: "DRIVER_DISCONNECTED",
  DELIVERY_ACCEPTED: "DELIVERY_ACCEPTED",
  DELIVERY_REJECTED: "DELIVERY_REJECTED",
  DELIVERY_COMPLETED: "DELIVERY_COMPLETED",

  // Admin actions on user
  ADMIN_SUSPENDED: "ADMIN_SUSPENDED",
  ADMIN_UNSUSPENDED: "ADMIN_UNSUSPENDED",
  ADMIN_ARCHIVED: "ADMIN_ARCHIVED",
  ADMIN_UNARCHIVED: "ADMIN_UNARCHIVED",
  ADMIN_USER_DELETED: "ADMIN_USER_DELETED",
  ADMIN_USER_RESTORED: "ADMIN_USER_RESTORED",
  ADMIN_COMMISSION_OVERRIDE: "ADMIN_COMMISSION_OVERRIDE",
  ADMIN_LOYALTY_TIER_CHANGED: "ADMIN_LOYALTY_TIER_CHANGED",
  ADMIN_LOYALTY_TIER_LOCKED: "ADMIN_LOYALTY_TIER_LOCKED",
  ADMIN_LOYALTY_TIER_UNLOCKED: "ADMIN_LOYALTY_TIER_UNLOCKED",
  ADMIN_ROLE_APPROVED: "ADMIN_ROLE_APPROVED",
  ADMIN_ROLE_REJECTED: "ADMIN_ROLE_REJECTED",

  // Ratings
  RATING_GIVEN: "RATING_GIVEN",
  RATING_RECEIVED: "RATING_RECEIVED",

  // Points
  POINTS_EARNED: "POINTS_EARNED",
  POINTS_REDEEMED: "POINTS_REDEEMED",
} as const;
