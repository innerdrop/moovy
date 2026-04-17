/**
 * PIN doble de entrega — lógica compartida de verificación (ISSUE-001)
 *
 * Este módulo centraliza TODA la validación del PIN doble:
 * - Carga del entity (Order o SubOrder)
 * - Ownership check (el driver es el asignado)
 * - Estado correcto (DRIVER_ARRIVED para pickup, PICKED_UP para delivery)
 * - Idempotencia (si ya está verificado, responder OK sin duplicar trabajo)
 * - Límite de intentos (PIN_MAX_ATTEMPTS = 5)
 * - Geofence (driver debe estar cerca del comercio/destino, tolerancia GPS)
 * - Comparación timing-safe (crypto.timingSafeEqual vía verifyPin)
 * - Audit log de cada intento (éxito y fallo)
 * - Fraud score si se excede el umbral
 *
 * Los endpoints son thin wrappers: parsean request + llaman a este helper.
 */

import { prisma } from "@/lib/prisma";
import {
    verifyPin,
    sanitizePinInput,
    PIN_MAX_ATTEMPTS,
    PIN_GEOFENCE_METERS,
    PIN_GEOFENCE_GRACE_METERS,
    PIN_FRAUD_THRESHOLD,
} from "@/lib/pin";
import { calculateDistance } from "@/lib/geo";
import { logAudit } from "@/lib/audit";
import logger from "@/lib/logger";
import { socketEmitToRooms } from "@/lib/socket-emit";

const pinLogger = logger.child({ context: "pin-verification" });

export type PinType = "pickup" | "delivery";
export type PinEntityType = "order" | "subOrder";

export interface PinVerificationInput {
    entityType: PinEntityType;
    entityId: string;
    pinType: PinType;
    pinInput: string;
    driverId: string;
    userId: string; // session user id (para audit)
    driverGps?: {
        lat: number;
        lng: number;
        accuracy?: number;
    } | null;
}

export type PinErrorCode =
    | "INVALID_FORMAT"
    | "NOT_FOUND"
    | "NOT_ASSIGNED"
    | "INVALID_STATE"
    | "PIN_NOT_SET"
    | "ALREADY_VERIFIED"
    | "WRONG_PIN"
    | "TOO_MANY_ATTEMPTS"
    | "OUT_OF_GEOFENCE"
    | "UNKNOWN";

export interface PinVerificationResult {
    success: boolean;
    status: number; // HTTP status
    error?: string;
    errorCode?: PinErrorCode;
    remainingAttempts?: number;
    distanceMeters?: number;
    verifiedAt?: Date;
    /** Flag interno: true si fue idempotente (ya estaba verificado) */
    alreadyVerified?: boolean;
}

/**
 * Verifica un PIN (pickup o delivery) sobre un Order o SubOrder.
 *
 * Retorna siempre un resultado con status HTTP — el endpoint solo debe
 * hacer `return NextResponse.json(result, { status: result.status })`.
 */
export async function verifyOrderOrSubOrderPin(
    input: PinVerificationInput
): Promise<PinVerificationResult> {
    const { entityType, entityId, pinType, pinInput, driverId, userId, driverGps } = input;

    // 1. Sanitize + format check (prevent wasting attempts on obvious typos)
    const sanitized = sanitizePinInput(pinInput);
    if (sanitized.length !== 6) {
        return {
            success: false,
            status: 400,
            error: "El PIN debe tener 6 dígitos numéricos",
            errorCode: "INVALID_FORMAT",
        };
    }

    // 2. Load entity + ownership + state + PIN fields
    const loaded = await loadEntity(entityType, entityId);
    if (!loaded) {
        return { success: false, status: 404, error: "Pedido no encontrado", errorCode: "NOT_FOUND" };
    }

    if (loaded.driverId !== driverId) {
        return {
            success: false,
            status: 403,
            error: "Este pedido no está asignado a vos",
            errorCode: "NOT_ASSIGNED",
        };
    }

    // 3. State check: pickup requiere DRIVER_ARRIVED, delivery requiere PICKED_UP
    const requiredState = pinType === "pickup" ? "DRIVER_ARRIVED" : "PICKED_UP";
    if (loaded.deliveryStatus !== requiredState) {
        return {
            success: false,
            status: 409,
            error: pinType === "pickup"
                ? "Tenés que marcar que llegaste al comercio antes de ingresar el PIN de retiro"
                : "Tenés que marcar el retiro antes de ingresar el PIN de entrega",
            errorCode: "INVALID_STATE",
        };
    }

    // 4. PIN existe (edge case: pedidos viejos sin PIN, o pickup orders)
    const storedPin = pinType === "pickup" ? loaded.pickupPin : loaded.deliveryPin;
    if (!storedPin) {
        pinLogger.warn(
            { entityType, entityId, pinType },
            "Attempt to verify PIN on entity without stored PIN (pickup order or legacy)"
        );
        return {
            success: false,
            status: 409,
            error: "Este pedido no requiere PIN de entrega",
            errorCode: "PIN_NOT_SET",
        };
    }

    // 5. Idempotency: si ya fue verificado, responder OK
    const storedVerifiedAt = pinType === "pickup" ? loaded.pickupPinVerifiedAt : loaded.deliveryPinVerifiedAt;
    if (storedVerifiedAt) {
        return {
            success: true,
            status: 200,
            verifiedAt: storedVerifiedAt,
            alreadyVerified: true,
            remainingAttempts: Math.max(
                0,
                PIN_MAX_ATTEMPTS - (pinType === "pickup" ? loaded.pickupPinAttempts : loaded.deliveryPinAttempts)
            ),
        };
    }

    // 6. Límite de intentos
    const currentAttempts = pinType === "pickup" ? loaded.pickupPinAttempts : loaded.deliveryPinAttempts;
    if (currentAttempts >= PIN_MAX_ATTEMPTS) {
        // El bloqueo persistente se maneja en el primer hit al umbral (abajo).
        // Acá ya está bloqueado.
        return {
            success: false,
            status: 423, // Locked
            error: "Superaste el máximo de intentos. El pedido está bloqueado y fue alertado al equipo.",
            errorCode: "TOO_MANY_ATTEMPTS",
            remainingAttempts: 0,
        };
    }

    // 7. Geofence: si tenemos GPS del driver Y coords del lugar, validar proximidad
    let distanceMeters: number | undefined;
    if (driverGps && driverGps.lat && driverGps.lng) {
        const targetCoords = pinType === "pickup"
            ? getPickupCoords(loaded)
            : getDeliveryCoords(loaded);

        if (targetCoords) {
            distanceMeters = Math.round(
                calculateDistance(driverGps.lat, driverGps.lng, targetCoords.lat, targetCoords.lng, "m")
            );

            // Umbral base 100m + gracia si GPS tiene mala precisión
            const accuracy = driverGps.accuracy ?? 0;
            const effectiveThreshold = accuracy > PIN_GEOFENCE_METERS
                ? PIN_GEOFENCE_METERS + PIN_GEOFENCE_GRACE_METERS
                : PIN_GEOFENCE_METERS;

            if (distanceMeters > effectiveThreshold) {
                // NO incrementamos intentos ni bloqueamos — es un error de ubicación,
                // no un fraude de PIN. Pero sí logueamos para fraud detection.
                pinLogger.warn(
                    {
                        entityType,
                        entityId,
                        pinType,
                        driverId,
                        distanceMeters,
                        threshold: effectiveThreshold,
                        accuracy,
                    },
                    "FRAUD ALERT: PIN verification attempted outside geofence"
                );

                await logAudit({
                    action: "PIN_GEOFENCE_FAIL",
                    entityType: entityType === "order" ? "Order" : "SubOrder",
                    entityId,
                    userId,
                    details: {
                        pinType,
                        driverId,
                        distanceMeters,
                        threshold: effectiveThreshold,
                        accuracy,
                    },
                });

                return {
                    success: false,
                    status: 403,
                    error: `Estás a ${distanceMeters}m del lugar. Tenés que estar a menos de ${effectiveThreshold}m para validar el PIN.`,
                    errorCode: "OUT_OF_GEOFENCE",
                    distanceMeters,
                };
            }
        }
    }

    // 8. Comparar PIN con timing-safe
    const isMatch = verifyPin(sanitized, storedPin);

    // 9. Aplicar el resultado (transacción atómica: incrementar attempts o marcar verificado)
    if (!isMatch) {
        // Fallo: incrementar attempts atomically y detectar si llegó al umbral
        const updated = await incrementAttempts(entityType, entityId, pinType);
        const newAttempts = pinType === "pickup" ? updated.pickupPinAttempts : updated.deliveryPinAttempts;
        const remaining = Math.max(0, PIN_MAX_ATTEMPTS - newAttempts);

        await logAudit({
            action: "PIN_VERIFICATION_FAIL",
            entityType: entityType === "order" ? "Order" : "SubOrder",
            entityId,
            userId,
            details: { pinType, driverId, attempts: newAttempts, remaining, distanceMeters },
        });

        pinLogger.warn(
            { entityType, entityId, pinType, driverId, attempts: newAttempts, remaining, distanceMeters },
            "PIN verification failed"
        );

        // Si llegó al umbral: alerta real-time a admin + incrementar fraudScore
        if (newAttempts >= PIN_MAX_ATTEMPTS) {
            // Incrementar fraudScore atomically y leer el valor resultante para
            // decidir si corresponde auto-suspensión.
            const updatedDriver = await prisma.driver.update({
                where: { id: driverId },
                data: { fraudScore: { increment: 1 } },
                select: { fraudScore: true, isSuspended: true, userId: true },
            });

            await logAudit({
                action: "PIN_LOCKED",
                entityType: entityType === "order" ? "Order" : "SubOrder",
                entityId,
                userId,
                details: {
                    pinType,
                    driverId,
                    attempts: newAttempts,
                    fraudScore: updatedDriver.fraudScore,
                },
            });

            // Auto-suspensión si supera el umbral Y todavía no está suspendido
            let autoSuspended = false;
            if (updatedDriver.fraudScore >= PIN_FRAUD_THRESHOLD && !updatedDriver.isSuspended) {
                await prisma.driver.update({
                    where: { id: driverId },
                    data: {
                        isSuspended: true,
                        suspendedAt: new Date(),
                        suspensionReason: `Auto-suspendido por ${updatedDriver.fraudScore} incidentes de PIN bloqueado (umbral: ${PIN_FRAUD_THRESHOLD}).`,
                    },
                });
                autoSuspended = true;
                pinLogger.error(
                    { driverId, fraudScore: updatedDriver.fraudScore },
                    "AUTO-SUSPENSION: driver exceeded PIN fraud threshold"
                );
                await logAudit({
                    action: "DRIVER_AUTO_SUSPENDED",
                    entityType: "Driver",
                    entityId: driverId,
                    userId,
                    details: {
                        reason: "PIN_FRAUD_THRESHOLD_EXCEEDED",
                        fraudScore: updatedDriver.fraudScore,
                        threshold: PIN_FRAUD_THRESHOLD,
                        triggeringEntity: entityType,
                        triggeringEntityId: entityId,
                    },
                });
            }

            await socketEmitToRooms(
                ["admin:orders", "admin:fraud"],
                "pin_locked",
                {
                    entityType,
                    entityId,
                    pinType,
                    driverId,
                    attempts: newAttempts,
                    fraudScore: updatedDriver.fraudScore,
                    autoSuspended,
                }
            ).catch((e) => pinLogger.error({ error: e }, "Failed to emit PIN lock alert"));

            return {
                success: false,
                status: 423,
                error: autoSuspended
                    ? "Superaste el máximo de intentos. Tu cuenta fue suspendida automáticamente. Contactá soporte."
                    : "Superaste el máximo de intentos. El pedido está bloqueado y fue alertado al equipo.",
                errorCode: "TOO_MANY_ATTEMPTS",
                remainingAttempts: 0,
                distanceMeters,
            };
        }

        return {
            success: false,
            status: 400,
            error: `PIN incorrecto. Te quedan ${remaining} intento${remaining === 1 ? "" : "s"}.`,
            errorCode: "WRONG_PIN",
            remainingAttempts: remaining,
            distanceMeters,
        };
    }

    // 10. Éxito: marcar verificado
    const verifiedAt = new Date();
    await markVerified(entityType, entityId, pinType, verifiedAt);

    await logAudit({
        action: "PIN_VERIFIED",
        entityType: entityType === "order" ? "Order" : "SubOrder",
        entityId,
        userId,
        details: { pinType, driverId, distanceMeters, attempts: currentAttempts + 1 },
    });

    pinLogger.info(
        { entityType, entityId, pinType, driverId, distanceMeters },
        "PIN verified successfully"
    );

    return {
        success: true,
        status: 200,
        verifiedAt,
        remainingAttempts: Math.max(0, PIN_MAX_ATTEMPTS - (currentAttempts + 1)),
        distanceMeters,
    };
}

// ===================================================================
// Helpers privados
// ===================================================================

interface LoadedEntity {
    id: string;
    driverId: string | null;
    deliveryStatus: string | null;
    pickupPin: string | null;
    pickupPinVerifiedAt: Date | null;
    pickupPinAttempts: number;
    deliveryPin: string | null;
    deliveryPinVerifiedAt: Date | null;
    deliveryPinAttempts: number;
    merchantLat: number | null;
    merchantLng: number | null;
    addressLat: number | null;
    addressLng: number | null;
}

async function loadEntity(entityType: PinEntityType, entityId: string): Promise<LoadedEntity | null> {
    if (entityType === "order") {
        const order = await prisma.order.findUnique({
            where: { id: entityId },
            select: {
                id: true,
                driverId: true,
                deliveryStatus: true,
                pickupPin: true,
                pickupPinVerifiedAt: true,
                pickupPinAttempts: true,
                deliveryPin: true,
                deliveryPinVerifiedAt: true,
                deliveryPinAttempts: true,
                merchant: { select: { latitude: true, longitude: true } },
                address: { select: { latitude: true, longitude: true } },
            },
        });

        if (!order) return null;

        return {
            id: order.id,
            driverId: order.driverId,
            deliveryStatus: order.deliveryStatus,
            pickupPin: order.pickupPin,
            pickupPinVerifiedAt: order.pickupPinVerifiedAt,
            pickupPinAttempts: order.pickupPinAttempts,
            deliveryPin: order.deliveryPin,
            deliveryPinVerifiedAt: order.deliveryPinVerifiedAt,
            deliveryPinAttempts: order.deliveryPinAttempts,
            merchantLat: order.merchant?.latitude ?? null,
            merchantLng: order.merchant?.longitude ?? null,
            addressLat: order.address?.latitude ?? null,
            addressLng: order.address?.longitude ?? null,
        };
    } else {
        const subOrder = await prisma.subOrder.findUnique({
            where: { id: entityId },
            select: {
                id: true,
                driverId: true,
                deliveryStatus: true,
                pickupPin: true,
                pickupPinVerifiedAt: true,
                pickupPinAttempts: true,
                deliveryPin: true,
                deliveryPinVerifiedAt: true,
                deliveryPinAttempts: true,
                merchant: { select: { latitude: true, longitude: true } },
                order: {
                    select: {
                        address: { select: { latitude: true, longitude: true } },
                    },
                },
            },
        });

        if (!subOrder) return null;

        return {
            id: subOrder.id,
            driverId: subOrder.driverId,
            deliveryStatus: subOrder.deliveryStatus,
            pickupPin: subOrder.pickupPin,
            pickupPinVerifiedAt: subOrder.pickupPinVerifiedAt,
            pickupPinAttempts: subOrder.pickupPinAttempts,
            deliveryPin: subOrder.deliveryPin,
            deliveryPinVerifiedAt: subOrder.deliveryPinVerifiedAt,
            deliveryPinAttempts: subOrder.deliveryPinAttempts,
            merchantLat: subOrder.merchant?.latitude ?? null,
            merchantLng: subOrder.merchant?.longitude ?? null,
            addressLat: subOrder.order?.address?.latitude ?? null,
            addressLng: subOrder.order?.address?.longitude ?? null,
        };
    }
}

function getPickupCoords(e: LoadedEntity): { lat: number; lng: number } | null {
    if (e.merchantLat != null && e.merchantLng != null) {
        return { lat: e.merchantLat, lng: e.merchantLng };
    }
    // Seller marketplace: no hay lat/lng en SellerProfile todavía.
    // Fase 2 del rollout: agregar pickupLocation a SellerProfile y usarla acá.
    // Por ahora, si no hay coords, se saltea el geofence (no bloquea).
    return null;
}

function getDeliveryCoords(e: LoadedEntity): { lat: number; lng: number } | null {
    if (e.addressLat != null && e.addressLng != null) {
        return { lat: e.addressLat, lng: e.addressLng };
    }
    return null;
}

async function incrementAttempts(
    entityType: PinEntityType,
    entityId: string,
    pinType: PinType
): Promise<{ pickupPinAttempts: number; deliveryPinAttempts: number }> {
    const updateData = pinType === "pickup"
        ? { pickupPinAttempts: { increment: 1 } }
        : { deliveryPinAttempts: { increment: 1 } };

    if (entityType === "order") {
        const updated = await prisma.order.update({
            where: { id: entityId },
            data: updateData,
            select: { pickupPinAttempts: true, deliveryPinAttempts: true },
        });
        return updated;
    } else {
        const updated = await prisma.subOrder.update({
            where: { id: entityId },
            data: updateData,
            select: { pickupPinAttempts: true, deliveryPinAttempts: true },
        });
        return updated;
    }
}

async function markVerified(
    entityType: PinEntityType,
    entityId: string,
    pinType: PinType,
    verifiedAt: Date
): Promise<void> {
    const updateData = pinType === "pickup"
        ? { pickupPinVerifiedAt: verifiedAt, pickupPinAttempts: { increment: 1 } }
        : { deliveryPinVerifiedAt: verifiedAt, deliveryPinAttempts: { increment: 1 } };

    if (entityType === "order") {
        await prisma.order.update({ where: { id: entityId }, data: updateData });
    } else {
        await prisma.subOrder.update({ where: { id: entityId }, data: updateData });
    }
}
