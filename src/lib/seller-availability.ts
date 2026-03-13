// Seller Availability Management
// Handles online/offline/pause states for marketplace sellers

import { prisma } from "./prisma";

export interface SellerStatus {
    isOnline: boolean;
    isPaused: boolean;
    pauseEndsAt: Date | null;
    preparationMinutes: number;
    scheduleEnabled: boolean;
    scheduleJson: string | null;
}

/**
 * Get the current availability status for a seller.
 * Creates a default record if none exists.
 */
export async function getSellerStatus(userId: string): Promise<SellerStatus> {
    const availability = await prisma.sellerAvailability.upsert({
        where: { sellerId: userId },
        update: {},
        create: {
            sellerId: userId,
            isOnline: false,
            isPaused: false,
            preparationMinutes: 15,
        },
    });

    return {
        isOnline: availability.isOnline,
        isPaused: availability.isPaused,
        pauseEndsAt: availability.pauseEndsAt,
        preparationMinutes: availability.preparationMinutes,
        scheduleEnabled: availability.scheduleEnabled,
        scheduleJson: availability.scheduleJson,
    };
}

/**
 * Set seller as online and clear any pause.
 */
export async function setSellerOnline(userId: string): Promise<SellerStatus> {
    const availability = await prisma.sellerAvailability.upsert({
        where: { sellerId: userId },
        update: {
            isOnline: true,
            isPaused: false,
            pauseEndsAt: null,
        },
        create: {
            sellerId: userId,
            isOnline: true,
            isPaused: false,
            preparationMinutes: 15,
        },
    });

    return {
        isOnline: availability.isOnline,
        isPaused: availability.isPaused,
        pauseEndsAt: availability.pauseEndsAt,
        preparationMinutes: availability.preparationMinutes,
        scheduleEnabled: availability.scheduleEnabled,
        scheduleJson: availability.scheduleJson,
    };
}

/**
 * Set seller as offline.
 */
export async function setSellerOffline(userId: string): Promise<SellerStatus> {
    const availability = await prisma.sellerAvailability.upsert({
        where: { sellerId: userId },
        update: {
            isOnline: false,
            isPaused: false,
            pauseEndsAt: null,
        },
        create: {
            sellerId: userId,
            isOnline: false,
            isPaused: false,
            preparationMinutes: 15,
        },
    });

    return {
        isOnline: availability.isOnline,
        isPaused: availability.isPaused,
        pauseEndsAt: availability.pauseEndsAt,
        preparationMinutes: availability.preparationMinutes,
        scheduleEnabled: availability.scheduleEnabled,
        scheduleJson: availability.scheduleJson,
    };
}

/**
 * Pause the seller for a given number of minutes.
 * Seller stays "online" but is paused (won't receive new orders).
 */
export async function pauseSeller(
    userId: string,
    minutes: 15 | 30 | 60
): Promise<SellerStatus> {
    const pauseEndsAt = new Date(Date.now() + minutes * 60 * 1000);

    const availability = await prisma.sellerAvailability.upsert({
        where: { sellerId: userId },
        update: {
            isPaused: true,
            pauseEndsAt,
        },
        create: {
            sellerId: userId,
            isOnline: true,
            isPaused: true,
            pauseEndsAt,
            preparationMinutes: 15,
        },
    });

    return {
        isOnline: availability.isOnline,
        isPaused: availability.isPaused,
        pauseEndsAt: availability.pauseEndsAt,
        preparationMinutes: availability.preparationMinutes,
        scheduleEnabled: availability.scheduleEnabled,
        scheduleJson: availability.scheduleJson,
    };
}

/**
 * Update preparation time in minutes.
 */
export async function updatePreparationMinutes(
    userId: string,
    minutes: number
): Promise<SellerStatus> {
    const availability = await prisma.sellerAvailability.upsert({
        where: { sellerId: userId },
        update: { preparationMinutes: minutes },
        create: {
            sellerId: userId,
            isOnline: false,
            isPaused: false,
            preparationMinutes: minutes,
        },
    });

    return {
        isOnline: availability.isOnline,
        isPaused: availability.isPaused,
        pauseEndsAt: availability.pauseEndsAt,
        preparationMinutes: availability.preparationMinutes,
        scheduleEnabled: availability.scheduleEnabled,
        scheduleJson: availability.scheduleJson,
    };
}

/**
 * Update schedule settings.
 */
export async function updateSchedule(
    userId: string,
    scheduleEnabled: boolean,
    scheduleJson: string | null
): Promise<SellerStatus> {
    const availability = await prisma.sellerAvailability.upsert({
        where: { sellerId: userId },
        update: { scheduleEnabled, scheduleJson },
        create: {
            sellerId: userId,
            isOnline: false,
            isPaused: false,
            preparationMinutes: 15,
            scheduleEnabled,
            scheduleJson,
        },
    });

    return {
        isOnline: availability.isOnline,
        isPaused: availability.isPaused,
        pauseEndsAt: availability.pauseEndsAt,
        preparationMinutes: availability.preparationMinutes,
        scheduleEnabled: availability.scheduleEnabled,
        scheduleJson: availability.scheduleJson,
    };
}

/**
 * Cron job: resume all paused sellers whose pauseEndsAt has passed.
 * Returns the number of sellers resumed.
 */
export async function checkAndResumePaused(): Promise<number> {
    const result = await prisma.sellerAvailability.updateMany({
        where: {
            isPaused: true,
            pauseEndsAt: { lt: new Date() },
        },
        data: {
            isPaused: false,
            pauseEndsAt: null,
        },
    });

    if (result.count > 0) {
        console.log(`[SellerAvailability] Resumed ${result.count} paused seller(s)`);
    }

    return result.count;
}
