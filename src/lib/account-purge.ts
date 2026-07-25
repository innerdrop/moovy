/**
 * src/lib/account-purge.ts
 *
 * BORRADO DEFINITIVO DE CUENTA — fuente única del derecho de supresión
 * (Ley 25.326, art. 16). La usan el borrado que hace el propio titular desde su
 * perfil y el que ejecuta el equipo de Moovy desde OPS cuando alguien lo pide.
 *
 * ══ Qué significa "borrar" acá ══
 *
 * NO es un `DELETE FROM "User"`, y no debe serlo: los pedidos son documentación
 * comercial y fiscal que estamos obligados a conservar (AFIP). Lo que hacemos es
 * DISOCIAR: se destruyen los datos personales y se conserva el registro contable
 * sin dueño identificable. El pedido #1234 sigue existiendo con sus montos, pero
 * ya no dice quién lo hizo ni a dónde fue.
 *
 * ══ Por qué no se borran las direcciones ══
 *
 * `Order.addressId` es una relación OBLIGATORIA: borrar la fila de Address de
 * alguien que alguna vez pidió algo revienta la foreign key (y hacía fallar al
 * borrado del perfil, que intentaba `address.deleteMany`). Se anonimizan en su
 * lugar: la calle desaparece, la fila queda como esqueleto para que el pedido
 * histórico siga siendo válido.
 *
 * ══ Qué se conserva a propósito ══
 *
 * - Pedidos, montos y comisiones (obligación fiscal).
 * - `AuditLog` y `ConsentLog`: son la PRUEBA de que el consentimiento existió y
 *   de que la supresión se ejecutó. Borrarlos nos dejaría sin cómo demostrarle a
 *   la AAIP que cumplimos.
 *
 * ══ El email ══
 *
 * Se libera (pasa a `deleted-<id>@deleted.moovy.local`), así la persona puede
 * volver a registrarse con esa casilla y obtener una cuenta LIMPIA. Esto no
 * reabre el bug de resurrección: la cuenta vieja queda anonimizada, así que un
 * registro nuevo con ese email no la encuentra y crea una cuenta de cero.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import logger from "./logger";

const purgeLogger = logger.child({ context: "account-purge" });

export interface PurgeActor {
    /** Quién ejecuta: el propio titular o un admin a pedido del titular. */
    source: "SELF" | "ADMIN";
    /** userId de quien ejecuta (el mismo titular en SELF). */
    actorUserId: string;
    actorEmail: string;
    /** Nota libre del admin: quién pidió la baja y por qué medio (auditoría AAIP). */
    reason?: string | null;
}

export interface PurgeResult {
    userId: string;
    /** Email original — se devuelve para poder informarlo y para el audit. */
    previousEmail: string;
    /** Email técnico con el que queda la fila (la casilla original queda libre). */
    anonymizedEmail: string;
    roles: string[];
    counts: {
        addressesAnonymized: number;
        ordersDisassociated: number;
        supportMessagesRedacted: number;
        orderChatMessagesRedacted: number;
        favoritesDeleted: number;
        cartItemsDeleted: number;
        pushSubscriptionsDeleted: number;
        referralsDeleted: number;
        availabilitySubsDeleted: number;
        merchantsCascaded: number;
        driverCascaded: boolean;
        sellerCascaded: boolean;
    };
}

const ANON_NAME = "[Cuenta eliminada]";
const ANON_TEXT = "[Dato eliminado]";

export class AccountPurgeError extends Error {
    constructor(message: string, readonly code: "NOT_FOUND" | "ALREADY_PURGED") {
        super(message);
        this.name = "AccountPurgeError";
    }
}

export function anonymizedEmailFor(userId: string): string {
    return `deleted-${userId}@deleted.moovy.local`;
}

/** true si la cuenta ya pasó por el borrado definitivo (email liberado). */
export function isPurged(email: string): boolean {
    return email.endsWith("@deleted.moovy.local");
}

/**
 * Ejecuta el borrado definitivo. Idempotente: si la cuenta ya fue purgada,
 * lanza ALREADY_PURGED en vez de volver a correr (así un doble click no
 * genera dos entradas de auditoría contradictorias).
 *
 * El audit log se escribe ANTES del borrado — si algo falla a mitad de camino,
 * queda registrado que la operación se intentó (regla #26).
 */
export async function purgeUserAccount(
    userId: string,
    actor: PurgeActor
): Promise<PurgeResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            ownedMerchants: { select: { id: true } },
            driver: { select: { id: true } },
            sellerProfile: { select: { id: true } },
        },
    });

    if (!user) {
        throw new AccountPurgeError("Usuario no encontrado", "NOT_FOUND");
    }
    if (isPurged(user.email)) {
        throw new AccountPurgeError(
            "Esta cuenta ya fue borrada definitivamente",
            "ALREADY_PURGED"
        );
    }

    const roles: string[] = ["USER"];
    if (user.ownedMerchants.length) roles.push("COMERCIO");
    if (user.driver) roles.push("DRIVER");
    if (user.sellerProfile) roles.push("SELLER");

    // Auditoría ANTES del side effect (regla #26). Guarda el email original: es
    // el único rastro que queda para responderle a la AAIP "sí, borramos a esta
    // persona" sin conservar sus datos en la tabla de usuarios.
    //
    // Se escribe con `prisma.auditLog.create` directo y NO con el helper
    // `logAudit`, que se traga los errores: acá el registro es la PRUEBA legal
    // de que cumplimos, así que si no se puede escribir, el borrado no ocurre.
    await prisma.auditLog.create({
        data: {
            action: "ACCOUNT_PURGED",
            entityType: "User",
            entityId: userId,
            userId: actor.actorUserId,
            details: JSON.stringify({
                source: actor.source,
                actorEmail: actor.actorEmail,
                purgedEmail: user.email,
                purgedName: user.name,
                roles,
                reason: actor.reason ?? null,
                timestamp: new Date().toISOString(),
            }),
        },
    });

    const now = new Date();
    const anonymizedEmail = anonymizedEmailFor(userId);
    const cascadeReason =
        actor.source === "SELF"
            ? "Cuenta eliminada por el usuario"
            : "Cuenta eliminada a pedido del titular";

    const counts = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            // ── 1. Datos que se destruyen enteros (no hay obligación de conservarlos)
            const [favorites, cartItems, pushSubs, availabilitySubs] = await Promise.all([
                tx.favorite.deleteMany({ where: { userId } }),
                tx.cartItem.deleteMany({ where: { userId } }),
                tx.pushSubscription.deleteMany({ where: { userId } }),
                tx.driverAvailabilitySubscription.deleteMany({ where: { userId } }),
            ]);

            const referrals = await tx.referral.deleteMany({
                where: { OR: [{ referrerId: userId }, { refereeId: userId }] },
            });

            // ── 2. Direcciones: se vacían, NO se borran (las referencian pedidos)
            const addresses = await tx.address.updateMany({
                where: { userId },
                data: {
                    label: ANON_TEXT,
                    street: ANON_TEXT,
                    number: "",
                    apartment: null,
                    neighborhood: null,
                    zipCode: null,
                    latitude: null,
                    longitude: null,
                    isDefault: false,
                    deletedAt: now,
                },
            });

            // ── 3. Pedidos: se conservan (fiscal) sin datos personales
            const orders = await tx.order.updateMany({
                where: { userId },
                data: { deliveryNotes: null, customerNotes: null },
            });

            // ── 4. Conversaciones: el contenido es correspondencia personal
            const supportMsgs = await tx.supportMessage.updateMany({
                where: { senderId: userId },
                data: { content: ANON_TEXT },
            });
            const chatMsgs = await tx.orderChatMessage.updateMany({
                where: { senderId: userId },
                data: { content: ANON_TEXT },
            });

            // ── 5. La persona
            await tx.user.update({
                where: { id: userId },
                data: {
                    name: ANON_NAME,
                    firstName: null,
                    lastName: null,
                    email: anonymizedEmail,
                    phone: null,
                    password: "DELETED",
                    image: null,
                    pointsBalance: 0,
                    pendingBonusPoints: 0,
                    bonusActivated: false,
                    referralCode: `DEL-${userId.slice(0, 8)}`,
                    referredById: null,
                    resetToken: null,
                    resetTokenExpiry: null,
                    emailVerified: null,
                    marketingConsent: false,
                    marketingConsentRevokedAt: now,
                    cookiesConsent: null,
                    failedLoginAttempts: 0,
                    loginLockedUntil: null,
                    deletedAt: now,
                    isSuspended: true,
                    suspendedAt: now,
                    suspensionReason: cascadeReason,
                },
            });

            // ── 6. Roles de negocio: apagados + sin datos fiscales
            const merchants = await tx.merchant.updateMany({
                where: { ownerId: userId },
                data: {
                    isActive: false,
                    isOpen: false,
                    approvalStatus: "REJECTED",
                    rejectionReason: cascadeReason,
                    isSuspended: true,
                    suspendedAt: now,
                    suspensionReason: cascadeReason,
                    cuit: null,
                    cuil: null,
                    bankAccount: null,
                    ownerDni: null,
                    mpAccessToken: null,
                    mpRefreshToken: null,
                    mpUserId: null,
                    mpEmail: null,
                },
            });

            let driverCascaded = false;
            if (user.driver) {
                await tx.driver.update({
                    where: { id: user.driver.id },
                    data: {
                        isActive: false,
                        isOnline: false,
                        availabilityStatus: "FUERA_DE_SERVICIO",
                        approvalStatus: "REJECTED",
                        rejectionReason: cascadeReason,
                        isSuspended: true,
                        suspendedAt: now,
                        suspensionReason: cascadeReason,
                        cuit: null,
                        latitude: null,
                        longitude: null,
                    },
                });
                // El rastro GPS es dato personal y no tiene valor fiscal.
                await tx.driverLocationHistory.deleteMany({
                    where: { driverId: user.driver.id },
                });
                driverCascaded = true;
            }

            let sellerCascaded = false;
            if (user.sellerProfile) {
                await tx.sellerProfile.update({
                    where: { id: user.sellerProfile.id },
                    data: {
                        displayName: ANON_NAME,
                        bio: null,
                        isActive: false,
                        isOnline: false,
                        isSuspended: true,
                        suspendedAt: now,
                        suspensionReason: cascadeReason,
                        cuit: null,
                        bankAlias: null,
                        bankCbu: null,
                        mpAccessToken: null,
                        mpRefreshToken: null,
                        mpUserId: null,
                        mpEmail: null,
                    },
                });
                sellerCascaded = true;
            }

            return {
                addressesAnonymized: addresses.count,
                ordersDisassociated: orders.count,
                supportMessagesRedacted: supportMsgs.count,
                orderChatMessagesRedacted: chatMsgs.count,
                favoritesDeleted: favorites.count,
                cartItemsDeleted: cartItems.count,
                pushSubscriptionsDeleted: pushSubs.count,
                referralsDeleted: referrals.count,
                availabilitySubsDeleted: availabilitySubs.count,
                merchantsCascaded: merchants.count,
                driverCascaded,
                sellerCascaded,
            };
        },
        { isolationLevel: "Serializable" }
    );

    purgeLogger.info(
        { userId, source: actor.source, actorId: actor.actorUserId, roles, counts },
        "Cuenta borrada definitivamente (email liberado)"
    );

    return {
        userId,
        previousEmail: user.email,
        anonymizedEmail,
        roles,
        counts,
    };
}
