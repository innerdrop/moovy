/**
 * src/lib/merchant-document-approval.ts
 *
 * Lógica canónica para aprobación granular de documentos del merchant y gestión
 * de solicitudes de cambio. Este módulo reemplaza el flujo global de
 * approve/reject a nivel Merchant por uno per-documento (CUIT, CBU/Alias,
 * Constancia AFIP, Habilitación Municipal, Registro Sanitario).
 *
 * Regla de oro: la auto-activación del merchant se dispara AUTOMÁTICAMENTE
 * cuando todos los documentos requeridos quedan en estado "APPROVED". No hay
 * botón "Aprobar todo" — OPS revisa doc por doc y el sistema consolida.
 *
 * Los rubros alimenticios (FOOD_BUSINESS_TYPES) exigen registroSanitario como
 * 4to documento. El resto de rubros lo marca como NOT_REQUIRED al registrarse
 * y la auto-activación lo cuenta como OK.
 */

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { approveMerchantTransition } from "@/lib/roles";
import { emitRoleUpdate } from "@/lib/role-change-notify";

// Rubros que requieren habilitación bromatológica / registro sanitario.
// Debe coincidir con FOOD_BUSINESS_TYPES en src/app/comercio/registro/page.tsx.
const FOOD_BUSINESS_TYPES = new Set([
    "Restaurante",
    "Pizzería",
    "Hamburguesería",
    "Parrilla",
    "Cafetería",
    "Heladería",
    "Panadería/Pastelería",
    "Sushi",
    "Comida Saludable",
    "Rotisería",
    "Bebidas",
    "Vinoteca/Licorería",
]);

/**
 * Identificadores canónicos de cada documento. Se usan como "documentField" en
 * la URL del endpoint y en MerchantDocumentChangeRequest.documentField.
 */
export type MerchantDocumentField =
    | "cuit"
    | "bankAccount"
    | "constanciaAfipUrl"
    | "habilitacionMunicipalUrl"
    | "registroSanitarioUrl";

/**
 * Mapeo de documento → columnas de schema. Esto evita string-concatenation en
 * las queries Prisma y centraliza la relación campo-valor ↔ columnas de status.
 */
interface DocumentColumnSet {
    statusColumn: string;
    approvedAtColumn: string;
    rejectionColumn: string;
    sourceColumn: string; // DIGITAL | PHYSICAL — origen de la aprobación
    noteColumn: string;   // Nota libre del admin describiendo el doc físico
    valueColumn: string; // columna donde vive el valor (URL o texto)
    label: string; // texto human-readable (para emails/audit)
    alwaysRequired: boolean; // true = obligatorio en todos los rubros
    foodOnly: boolean; // true = sólo obligatorio para FOOD_BUSINESS_TYPES
}

export const DOCUMENT_COLUMNS: Record<MerchantDocumentField, DocumentColumnSet> = {
    cuit: {
        statusColumn: "cuitStatus",
        approvedAtColumn: "cuitApprovedAt",
        rejectionColumn: "cuitRejectionReason",
        sourceColumn: "cuitApprovalSource",
        noteColumn: "cuitApprovalNote",
        valueColumn: "cuit",
        label: "CUIT",
        alwaysRequired: true,
        foodOnly: false,
    },
    bankAccount: {
        statusColumn: "bankAccountStatus",
        approvedAtColumn: "bankAccountApprovedAt",
        rejectionColumn: "bankAccountRejectionReason",
        sourceColumn: "bankAccountApprovalSource",
        noteColumn: "bankAccountApprovalNote",
        valueColumn: "bankAccount",
        label: "CBU/Alias bancario",
        alwaysRequired: true,
        foodOnly: false,
    },
    constanciaAfipUrl: {
        statusColumn: "constanciaAfipStatus",
        approvedAtColumn: "constanciaAfipApprovedAt",
        rejectionColumn: "constanciaAfipRejectionReason",
        sourceColumn: "constanciaAfipApprovalSource",
        noteColumn: "constanciaAfipApprovalNote",
        valueColumn: "constanciaAfipUrl",
        label: "Constancia de Inscripción AFIP",
        alwaysRequired: true,
        foodOnly: false,
    },
    habilitacionMunicipalUrl: {
        statusColumn: "habilitacionMunicipalStatus",
        approvedAtColumn: "habilitacionMunicipalApprovedAt",
        rejectionColumn: "habilitacionMunicipalRejectionReason",
        sourceColumn: "habilitacionMunicipalApprovalSource",
        noteColumn: "habilitacionMunicipalApprovalNote",
        valueColumn: "habilitacionMunicipalUrl",
        label: "Habilitación Municipal",
        alwaysRequired: true,
        foodOnly: false,
    },
    registroSanitarioUrl: {
        statusColumn: "registroSanitarioStatus",
        approvedAtColumn: "registroSanitarioApprovedAt",
        rejectionColumn: "registroSanitarioRejectionReason",
        sourceColumn: "registroSanitarioApprovalSource",
        noteColumn: "registroSanitarioApprovalNote",
        valueColumn: "registroSanitarioUrl",
        label: "Registro Sanitario / Habilitación Bromatológica",
        alwaysRequired: false,
        foodOnly: true,
    },
};

export const ALL_DOCUMENT_FIELDS = Object.keys(DOCUMENT_COLUMNS) as MerchantDocumentField[];

/**
 * Validación cheap: chequea si un string arbitrario es un documentField válido.
 * Se usa en endpoints admin y merchant para rechazar temprano inputs inválidos.
 */
export function isValidDocumentField(field: string): field is MerchantDocumentField {
    return field in DOCUMENT_COLUMNS;
}

export function isFoodCategory(category: string | null | undefined): boolean {
    return !!category && FOOD_BUSINESS_TYPES.has(category);
}

/**
 * Mapeo documento → key del feature flag que lo prende/apaga.
 * feat/docs-comercio-configurables-ops: OPS puede dejar de pedir un documento
 * apagando su flag desde /ops/feature-flags.
 */
export const DOCUMENT_FLAG_KEYS: Record<MerchantDocumentField, string> = {
    cuit: "merchant.doc.cuit",
    bankAccount: "merchant.doc.bank-account",
    constanciaAfipUrl: "merchant.doc.constancia-afip",
    habilitacionMunicipalUrl: "merchant.doc.habilitacion-municipal",
    registroSanitarioUrl: "merchant.doc.registro-sanitario",
};

/**
 * Devuelve el set de documentos DESACTIVADOS desde OPS.
 *
 * Semántica fail-safe (INVERSA a isFeatureEnabled): un documento se considera
 * desactivado SÓLO si existe una fila FeatureFlag con su key y `isActive=false`.
 * Si la fila no existe (seed no corrido en ese entorno) o si la query falla,
 * NO desactivamos nada → el doc sigue siendo requerido. Para documentación
 * fiscal/legal preferimos pedir de más que de menos ante cualquier duda.
 */
export async function getDisabledDocumentFields(): Promise<Set<MerchantDocumentField>> {
    const disabled = new Set<MerchantDocumentField>();
    try {
        const offRows = await prisma.featureFlag.findMany({
            where: {
                key: { in: Object.values(DOCUMENT_FLAG_KEYS) },
                isActive: false,
            },
            select: { key: true },
        });
        const offKeys = new Set(offRows.map((r) => r.key));
        for (const f of ALL_DOCUMENT_FIELDS) {
            if (offKeys.has(DOCUMENT_FLAG_KEYS[f])) disabled.add(f);
        }
    } catch (err) {
        console.error("[merchant-docs] error leyendo flags de documentos, se piden todos", err);
        return new Set();
    }
    return disabled;
}

/**
 * Versión SINCRÓNICA: documentos requeridos según categoría menos los
 * desactivados (que el caller ya consultó con getDisabledDocumentFields).
 * Útil dentro de transacciones, donde no queremos abrir otra query con el
 * cliente global.
 */
export function getRequiredDocumentFieldsSync(
    category: string | null | undefined,
    disabled: Set<MerchantDocumentField> = new Set()
): MerchantDocumentField[] {
    const base = ALL_DOCUMENT_FIELDS.filter(
        (f) => DOCUMENT_COLUMNS[f].alwaysRequired
    );
    if (isFoodCategory(category)) {
        base.push("registroSanitarioUrl");
    }
    return base.filter((f) => !disabled.has(f));
}

/**
 * Devuelve los documentos requeridos para un merchant según su categoría y los
 * flags de OPS. Registro sanitario sólo se cuenta para rubros alimenticios, y
 * además cualquier doc puede apagarse desde OPS.
 */
export async function getRequiredDocumentFields(
    category: string | null | undefined
): Promise<MerchantDocumentField[]> {
    const disabled = await getDisabledDocumentFields();
    return getRequiredDocumentFieldsSync(category, disabled);
}

interface AdminContext {
    adminId: string;
    adminEmail: string;
    /** Origen de la aprobación. Default DIGITAL si el merchant ya tenía URL/valor cargado. */
    source?: "DIGITAL" | "PHYSICAL";
    /** Nota libre describiendo la aprobación física (obligatoria si source === PHYSICAL). */
    note?: string | null;
}

interface DocumentApprovalResult {
    success: boolean;
    merchantAutoActivated: boolean;
}

/**
 * Aprueba un documento individual y —si al hacerlo todos los requeridos
 * quedan APPROVED— dispara la aprobación global del merchant.
 *
 * Atomicidad: el update del doc y el chequeo de auto-activación corren en la
 * misma transacción para evitar races donde dos admins aprueban el último doc
 * faltante en paralelo.
 */
export async function approveDocument(
    merchantId: string,
    field: MerchantDocumentField,
    ctx: AdminContext
): Promise<DocumentApprovalResult> {
    const cols = DOCUMENT_COLUMNS[field];
    const now = new Date();
    const source = ctx.source ?? "DIGITAL";
    const note = ctx.note ?? null;

    // Documentos desactivados desde OPS — los leemos ANTES de la tx para no abrir
    // una query con el cliente global dentro del $transaction (evita contención
    // de conexiones). El set se usa para el chequeo de auto-activación.
    const disabledDocs = await getDisabledDocumentFields();

    // El chequeo de auto-activación necesita leer TODOS los status columns
    // después del update; hacemos eso dentro de una tx serializable.
    const autoActivated = await prisma.$transaction(async (tx) => {
        const updated = await tx.merchant.update({
            where: { id: merchantId },
            data: {
                [cols.statusColumn]: "APPROVED",
                [cols.approvedAtColumn]: now,
                [cols.rejectionColumn]: null,
                [cols.sourceColumn]: source,
                [cols.noteColumn]: note,
            },
            select: {
                id: true,
                name: true,
                category: true,
                approvalStatus: true,
                cuitStatus: true,
                bankAccountStatus: true,
                constanciaAfipStatus: true,
                habilitacionMunicipalStatus: true,
                registroSanitarioStatus: true,
            },
        });

        // Chequeo de auto-activación: todos los requeridos en APPROVED y
        // merchant todavía PENDING (si ya está APPROVED no re-disparamos).
        // Los documentos apagados desde OPS no cuentan como requeridos.
        const required = getRequiredDocumentFieldsSync(updated.category, disabledDocs);
        const allApproved = required.every((f) => {
            const statusCol = DOCUMENT_COLUMNS[f].statusColumn as keyof typeof updated;
            return updated[statusCol] === "APPROVED";
        });

        if (allApproved && updated.approvalStatus !== "APPROVED") {
            // Auto-activación. approveMerchantTransition se llama FUERA de esta
            // tx porque tiene su propia $transaction interna — Prisma no permite
            // transacciones anidadas. Devolvemos flag para disparar afuera.
            return true;
        }
        return false;
    });

    await logAudit({
        action: "MERCHANT_DOCUMENT_APPROVED",
        entityType: "Merchant",
        entityId: merchantId,
        userId: ctx.adminId,
        details: {
            documentField: field,
            documentLabel: cols.label,
            adminEmail: ctx.adminEmail,
            triggeredAutoActivation: autoActivated,
        },
    });

    // fix/aprobacion-sin-logo (2026-04-27): aprobación de merchant ya no bloquea
    // por logo, así que la auto-activación corre limpia siempre que todos los
    // documentos requeridos estén APPROVED.
    let activatedNow = false;
    if (autoActivated) {
        await approveMerchantTransition(merchantId, ctx);
        activatedNow = true;

        // Refresh JWT del merchant para que pueda entrar al panel sin logout/login.
        const merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
            select: { ownerId: true, name: true },
        });
        if (merchant) {
            emitRoleUpdate({
                userId: merchant.ownerId,
                role: "MERCHANT",
                action: "AUTO_ACTIVATED",
                message: `¡Tu comercio "${merchant.name}" fue aprobado automáticamente! Todos los documentos están al día.`,
                portalUrl: "/comercios",
            });
        }
    }

    return { success: true, merchantAutoActivated: activatedNow };
}

/**
 * Rechaza un documento individual con un motivo.
 * No cambia el estado global del merchant (puede seguir PENDING con algunos
 * docs APPROVED y otros REJECTED — el merchant debe reemplazar el rejectado).
 */
export async function rejectDocument(
    merchantId: string,
    field: MerchantDocumentField,
    reason: string,
    ctx: AdminContext
): Promise<{ success: boolean }> {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
        throw new Error("Motivo de rechazo obligatorio (mínimo 3 caracteres)");
    }
    const cols = DOCUMENT_COLUMNS[field];

    await prisma.merchant.update({
        where: { id: merchantId },
        data: {
            [cols.statusColumn]: "REJECTED",
            [cols.rejectionColumn]: trimmed,
            [cols.approvedAtColumn]: null,
        },
    });

    await logAudit({
        action: "MERCHANT_DOCUMENT_REJECTED",
        entityType: "Merchant",
        entityId: merchantId,
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
 * merchant sube un archivo nuevo (en respuesta a un REJECTED o para reemplazar
 * un PENDING que aún no fue revisado). Nunca se puede llamar sobre un APPROVED
 * — esa vía requiere change request previa.
 */
export async function resetDocumentToPending(
    merchantId: string,
    field: MerchantDocumentField,
    actorUserId: string
): Promise<{ success: boolean }> {
    const cols = DOCUMENT_COLUMNS[field];

    await prisma.merchant.update({
        where: { id: merchantId },
        data: {
            [cols.statusColumn]: "PENDING",
            [cols.rejectionColumn]: null,
            [cols.approvedAtColumn]: null,
        },
    });

    await logAudit({
        action: "MERCHANT_DOCUMENT_RESUBMITTED",
        entityType: "Merchant",
        entityId: merchantId,
        userId: actorUserId,
        details: {
            documentField: field,
            documentLabel: cols.label,
        },
    });

    return { success: true };
}

/**
 * Lee los 5 status columns y los devuelve como map. Útil para UI que necesita
 * pintar cada badge (PENDING naranja / APPROVED verde / REJECTED rojo).
 */
export async function getDocumentStatuses(merchantId: string): Promise<{
    statuses: Record<MerchantDocumentField, string>;
    required: MerchantDocumentField[];
    allRequiredApproved: boolean;
}> {
    const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: {
            category: true,
            cuitStatus: true,
            bankAccountStatus: true,
            constanciaAfipStatus: true,
            habilitacionMunicipalStatus: true,
            registroSanitarioStatus: true,
        },
    });
    if (!merchant) throw new Error("Merchant no encontrado");

    const statuses: Record<MerchantDocumentField, string> = {
        cuit: merchant.cuitStatus,
        bankAccount: merchant.bankAccountStatus,
        constanciaAfipUrl: merchant.constanciaAfipStatus,
        habilitacionMunicipalUrl: merchant.habilitacionMunicipalStatus,
        registroSanitarioUrl: merchant.registroSanitarioStatus,
    };

    const required = await getRequiredDocumentFields(merchant.category);
    const allRequiredApproved = required.every((f) => statuses[f] === "APPROVED");

    return { statuses, required, allRequiredApproved };
}
