/**
 * src/lib/driver-document-approval.ts
 *
 * Lógica canónica para aprobación granular de documentos del driver y gestión
 * de solicitudes de cambio. Espejo de src/lib/merchant-document-approval.ts.
 *
 * Documentos trackeados:
 *   - cuit                → CUIT/CUIL (texto, persona física monotributista)
 *   - constanciaCuitUrl   → PDF: Constancia AFIP / Monotributo (obligatoria, AFIP legal)
 *   - dniFrenteUrl        → foto DNI frente
 *   - dniDorsoUrl         → foto DNI dorso
 *   - licenciaUrl         → licencia de conducir (solo motorizados)
 *   - seguroUrl           → póliza de seguro vigente (solo motorizados)
 *   - vtvUrl              → RTO en Tierra del Fuego (solo motorizados)
 *   - cedulaVerdeUrl      → cédula verde, titularidad del vehículo (solo motorizados)
 *
 * Categorización:
 *   - BICI_NO_MOTORIZADO: bicicleta, patineta, triciclo, u otros sin motor.
 *     Requiere: cuit, constanciaCuit, dniFrente, dniDorso (4 docs)
 *     NO requiere: licencia, seguro, RTO, cédula verde
 *
 *   - MOTORIZADO: moto, auto, camioneta, pickup, SUV, flete.
 *     Requiere: cuit, constanciaCuit, dniFrente, dniDorso, licencia, seguro,
 *               vtv (RTO), cedulaVerde (8 docs)
 *
 * Regla de oro: la auto-activación del driver se dispara AUTOMÁTICAMENTE
 * cuando todos los documentos requeridos quedan en estado "APPROVED".
 */

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { approveDriverTransition } from "@/lib/roles";

/**
 * Tipos de vehículo no-motorizados. Deben mantenerse sincronizados con el
 * formulario de registro (src/app/repartidor/registro/RepartidorRegistroClient.tsx)
 * y con la lógica de activación (src/app/api/auth/register/driver/route.ts).
 */
const NON_MOTORIZED_TYPES = new Set(["BICI", "BICICLETA", "PATIN", "PATINETA", "TRICI"]);

export function isMotorizedVehicle(vehicleType: string | null | undefined): boolean {
    if (!vehicleType) return false;
    const upper = vehicleType.toUpperCase();
    return !NON_MOTORIZED_TYPES.has(upper);
}

/**
 * Identificadores canónicos de cada documento del driver. Se usan como
 * "documentField" en las URLs de endpoints y en DriverDocumentChangeRequest.documentField.
 */
export type DriverDocumentField =
    | "cuit"
    | "constanciaCuitUrl"
    | "dniFrenteUrl"
    | "dniDorsoUrl"
    | "licenciaUrl"
    | "seguroUrl"
    | "vtvUrl"
    | "cedulaVerdeUrl";

interface DocumentColumnSet {
    statusColumn: string;
    approvedAtColumn: string;
    rejectionColumn: string;
    valueColumn: string;
    label: string;
    alwaysRequired: boolean; // true = todos los drivers (incluida bici)
    motorizedOnly: boolean;  // true = solo vehículos con motor
    hasExpiration: boolean;  // true = tiene <doc>ExpiresAt
    expirationColumn?: string;
    notifiedStageColumn?: string;
}

export const DRIVER_DOCUMENT_COLUMNS: Record<DriverDocumentField, DocumentColumnSet> = {
    cuit: {
        statusColumn: "cuitStatus",
        approvedAtColumn: "cuitApprovedAt",
        rejectionColumn: "cuitRejectionReason",
        valueColumn: "cuit",
        label: "CUIT/CUIL",
        alwaysRequired: true,
        motorizedOnly: false,
        hasExpiration: false,
    },
    constanciaCuitUrl: {
        statusColumn: "constanciaCuitStatus",
        approvedAtColumn: "constanciaCuitApprovedAt",
        rejectionColumn: "constanciaCuitRejectionReason",
        valueColumn: "constanciaCuitUrl",
        label: "Constancia de Inscripción AFIP / Monotributo",
        alwaysRequired: true,
        motorizedOnly: false,
        hasExpiration: false,
    },
    dniFrenteUrl: {
        statusColumn: "dniFrenteStatus",
        approvedAtColumn: "dniFrenteApprovedAt",
        rejectionColumn: "dniFrenteRejectionReason",
        valueColumn: "dniFrenteUrl",
        label: "DNI (frente)",
        alwaysRequired: true,
        motorizedOnly: false,
        hasExpiration: false,
    },
    dniDorsoUrl: {
        statusColumn: "dniDorsoStatus",
        approvedAtColumn: "dniDorsoApprovedAt",
        rejectionColumn: "dniDorsoRejectionReason",
        valueColumn: "dniDorsoUrl",
        label: "DNI (dorso)",
        alwaysRequired: true,
        motorizedOnly: false,
        hasExpiration: false,
    },
    licenciaUrl: {
        statusColumn: "licenciaStatus",
        approvedAtColumn: "licenciaApprovedAt",
        rejectionColumn: "licenciaRejectionReason",
        valueColumn: "licenciaUrl",
        label: "Licencia de conducir",
        alwaysRequired: false,
        motorizedOnly: true,
        hasExpiration: true,
        expirationColumn: "licenciaExpiresAt",
        notifiedStageColumn: "licenciaNotifiedStage",
    },
    seguroUrl: {
        statusColumn: "seguroStatus",
        approvedAtColumn: "seguroApprovedAt",
        rejectionColumn: "seguroRejectionReason",
        valueColumn: "seguroUrl",
        label: "Póliza de seguro",
        alwaysRequired: false,
        motorizedOnly: true,
        hasExpiration: true,
        expirationColumn: "seguroExpiresAt",
        notifiedStageColumn: "seguroNotifiedStage",
    },
    vtvUrl: {
        statusColumn: "vtvStatus",
        approvedAtColumn: "vtvApprovedAt",
        rejectionColumn: "vtvRejectionReason",
        valueColumn: "vtvUrl",
        label: "RTO (Revisión Técnica)",
        alwaysRequired: false,
        motorizedOnly: true,
        hasExpiration: true,
        expirationColumn: "vtvExpiresAt",
        notifiedStageColumn: "vtvNotifiedStage",
    },
    cedulaVerdeUrl: {
        statusColumn: "cedulaVerdeStatus",
        approvedAtColumn: "cedulaVerdeApprovedAt",
        rejectionColumn: "cedulaVerdeRejectionReason",
        valueColumn: "cedulaVerdeUrl",
        label: "Cédula verde",
        alwaysRequired: false,
        motorizedOnly: true,
        hasExpiration: true,
        expirationColumn: "cedulaVerdeExpiresAt",
        notifiedStageColumn: "cedulaVerdeNotifiedStage",
    },
};

export const ALL_DRIVER_DOCUMENT_FIELDS = Object.keys(
    DRIVER_DOCUMENT_COLUMNS
) as DriverDocumentField[];

/**
 * Validación cheap: chequea si un string arbitrario es un documentField válido.
 */
export function isValidDriverDocumentField(field: string): field is DriverDocumentField {
    return field in DRIVER_DOCUMENT_COLUMNS;
}

/**
 * Devuelve los documentos requeridos para un driver según su vehicleType.
 */
export function getRequiredDriverDocumentFields(
    vehicleType: string | null | undefined
): DriverDocumentField[] {
    const motorized = isMotorizedVehicle(vehicleType);
    return ALL_DRIVER_DOCUMENT_FIELDS.filter((f) => {
        const cfg = DRIVER_DOCUMENT_COLUMNS[f];
        if (cfg.alwaysRequired) return true;
        if (cfg.motorizedOnly && motorized) return true;
        return false;
    });
}

interface AdminContext {
    adminId: string;
    adminEmail: string;
}

interface DocumentApprovalResult {
    success: boolean;
    driverAutoActivated: boolean;
}

/**
 * Aprueba un documento individual y —si al hacerlo todos los requeridos
 * quedan APPROVED— dispara la aprobación global del driver.
 *
 * Atomicidad: el update del doc y el chequeo de auto-activación corren en la
 * misma transacción serializable para evitar races donde dos admins aprueban
 * el último doc faltante en paralelo.
 */
export async function approveDriverDocument(
    driverId: string,
    field: DriverDocumentField,
    ctx: AdminContext
): Promise<DocumentApprovalResult> {
    const cols = DRIVER_DOCUMENT_COLUMNS[field];
    const now = new Date();

    const autoActivated = await prisma.$transaction(async (tx) => {
        const updated = await tx.driver.update({
            where: { id: driverId },
            data: {
                [cols.statusColumn]: "APPROVED",
                [cols.approvedAtColumn]: now,
                [cols.rejectionColumn]: null,
            },
            select: {
                id: true,
                vehicleType: true,
                approvalStatus: true,
                cuitStatus: true,
                constanciaCuitStatus: true,
                dniFrenteStatus: true,
                dniDorsoStatus: true,
                licenciaStatus: true,
                seguroStatus: true,
                vtvStatus: true,
                cedulaVerdeStatus: true,
            },
        });

        const required = getRequiredDriverDocumentFields(updated.vehicleType);
        const allApproved = required.every((f) => {
            const statusCol = DRIVER_DOCUMENT_COLUMNS[f].statusColumn as keyof typeof updated;
            return updated[statusCol] === "APPROVED";
        });

        if (allApproved && updated.approvalStatus !== "APPROVED") {
            return true;
        }
        return false;
    });

    await logAudit({
        action: "DRIVER_DOCUMENT_APPROVED",
        entityType: "Driver",
        entityId: driverId,
        userId: ctx.adminId,
        details: {
            documentField: field,
            documentLabel: cols.label,
            adminEmail: ctx.adminEmail,
            triggeredAutoActivation: autoActivated,
        },
    });

    if (autoActivated) {
        // approveDriverTransition tiene su propia $transaction interna.
        await approveDriverTransition(driverId, ctx);
    }

    return { success: true, driverAutoActivated: autoActivated };
}

/**
 * Rechaza un documento individual con un motivo.
 * No cambia el estado global del driver.
 */
export async function rejectDriverDocument(
    driverId: string,
    field: DriverDocumentField,
    reason: string,
    ctx: AdminContext
): Promise<{ success: boolean }> {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
        throw new Error("Motivo de rechazo obligatorio (mínimo 3 caracteres)");
    }
    const cols = DRIVER_DOCUMENT_COLUMNS[field];

    await prisma.driver.update({
        where: { id: driverId },
        data: {
            [cols.statusColumn]: "REJECTED",
            [cols.rejectionColumn]: trimmed,
            [cols.approvedAtColumn]: null,
        },
    });

    await logAudit({
        action: "DRIVER_DOCUMENT_REJECTED",
        entityType: "Driver",
        entityId: driverId,
        userId: ctx.adminId,
        details: {
            documentField: field,
            documentLabel: cols.label,
            adminEmail: ctx.adminEmail,
            reason: trimmed,
        },
    });

    return { success: true };
}

/**
 * Reset a PENDING de un documento. Se invoca desde update-docs cuando el
 * driver sube un archivo nuevo (en respuesta a un REJECTED o para reemplazar
 * un PENDING que aún no fue revisado). Nunca se puede llamar sobre un APPROVED
 * — esa vía requiere change request previa.
 *
 * Si el doc tiene vencimiento (licencia/seguro/RTO/cédula), el nuevo ExpiresAt
 * se acepta vía parámetro expiresAt? y resetea el notifiedStage a 0.
 */
export async function resetDriverDocumentToPending(
    driverId: string,
    field: DriverDocumentField,
    actorUserId: string,
    options?: { expiresAt?: Date | null }
): Promise<{ success: boolean }> {
    const cols = DRIVER_DOCUMENT_COLUMNS[field];

    const data: Record<string, unknown> = {
        [cols.statusColumn]: "PENDING",
        [cols.rejectionColumn]: null,
        [cols.approvedAtColumn]: null,
    };

    if (cols.hasExpiration && cols.expirationColumn && cols.notifiedStageColumn) {
        if (options?.expiresAt !== undefined) {
            data[cols.expirationColumn] = options.expiresAt;
        }
        data[cols.notifiedStageColumn] = 0; // Reset de notificaciones
    }

    await prisma.driver.update({
        where: { id: driverId },
        data,
    });

    await logAudit({
        action: "DRIVER_DOCUMENT_RESUBMITTED",
        entityType: "Driver",
        entityId: driverId,
        userId: actorUserId,
        details: {
            documentField: field,
            documentLabel: cols.label,
        },
    });

    return { success: true };
}

/**
 * Lee los 8 status columns y los devuelve como map. Útil para UI que necesita
 * pintar cada badge (PENDING naranja / APPROVED verde / REJECTED rojo).
 */
export async function getDriverDocumentStatuses(driverId: string): Promise<{
    statuses: Record<DriverDocumentField, string>;
    required: DriverDocumentField[];
    allRequiredApproved: boolean;
    vehicleType: string | null;
}> {
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: {
            vehicleType: true,
            cuitStatus: true,
            constanciaCuitStatus: true,
            dniFrenteStatus: true,
            dniDorsoStatus: true,
            licenciaStatus: true,
            seguroStatus: true,
            vtvStatus: true,
            cedulaVerdeStatus: true,
        },
    });
    if (!driver) throw new Error("Driver no encontrado");

    const statuses: Record<DriverDocumentField, string> = {
        cuit: driver.cuitStatus,
        constanciaCuitUrl: driver.constanciaCuitStatus,
        dniFrenteUrl: driver.dniFrenteStatus,
        dniDorsoUrl: driver.dniDorsoStatus,
        licenciaUrl: driver.licenciaStatus,
        seguroUrl: driver.seguroStatus,
        vtvUrl: driver.vtvStatus,
        cedulaVerdeUrl: driver.cedulaVerdeStatus,
    };

    const required = getRequiredDriverDocumentFields(driver.vehicleType);
    const allRequiredApproved = required.every((f) => statuses[f] === "APPROVED");

    return { statuses, required, allRequiredApproved, vehicleType: driver.vehicleType };
}
