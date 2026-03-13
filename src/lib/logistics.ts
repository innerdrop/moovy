// DEPRECATED: Use assignment-engine.ts directly.
// This file re-exports for backward compatibility with existing consumers.

import {
    findNextEligibleDriver,
    startAssignmentCycle,
    processExpiredAssignments as _processExpiredAssignments,
    driverAcceptOrder as _driverAcceptOrder,
    driverRejectOrder as _driverRejectOrder,
} from "./assignment-engine";
import type { DriverWithDistance } from "./assignment-engine";

export type { DriverWithDistance };

/**
 * @deprecated Use `startAssignmentCycle` from `@/lib/assignment-engine` instead.
 */
export async function assignOrderToNearestDriver(
    orderId: string
): Promise<{ success: boolean; driverId?: string; error?: string }> {
    return startAssignmentCycle(orderId);
}

/**
 * @deprecated Use `findNextEligibleDriver` from `@/lib/assignment-engine` instead.
 */
export async function findNearestAvailableDrivers(
    merchantLat: number,
    merchantLng: number,
    excludeDriverIds: string[] = [],
    _maxDistanceKm: number = 20
): Promise<DriverWithDistance[]> {
    const allVehicles = ["BIKE", "MOTO", "CAR", "TRUCK"];
    const driver = await findNextEligibleDriver(merchantLat, merchantLng, allVehicles, excludeDriverIds);
    return driver ? [driver] : [];
}

/**
 * @deprecated Use `processExpiredAssignments` from `@/lib/assignment-engine` instead.
 */
export const processExpiredAssignments = _processExpiredAssignments;

/**
 * @deprecated Use `driverAcceptOrder` from `@/lib/assignment-engine` instead.
 */
export const driverAcceptOrder = _driverAcceptOrder;

/**
 * @deprecated Use `driverRejectOrder` from `@/lib/assignment-engine` instead.
 */
export const driverRejectOrder = _driverRejectOrder;
