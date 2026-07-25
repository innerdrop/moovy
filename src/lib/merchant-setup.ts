// Estado de armado de la tienda (feat/panel-inmediato-comercio).
// ÚNICA fuente de verdad de los pasos de preparación: la consumen el dashboard
// (tarjeta-guía), la barra de progreso del layout y toggleMerchantOpen (server).
// Misma lógica canónica de requisitos que /api/merchant/onboarding.
//
// fix/aprobacion-docs-pipeline-y-portada (2026-07-25):
// - Un doc requerido cuenta como cumplido si el comercio CARGÓ el archivo/valor
//   O si su estado es APPROVED (cubre la aprobación FÍSICA desde OPS, que no
//   deja URL — antes el paso "Completá tu documentación" quedaba en rojo
//   eternamente aunque OPS ya hubiera aprobado todo).
// - Si el comercio ya está APPROVED globalmente (botón "Aprobar Comercio",
//   que a propósito no exige docs), el paso de documentación se da por
//   cumplido: Moovy ya lo aprobó, no tiene sentido seguir pidiendo papeles.
// - La foto de PORTADA es un paso de la guía y requisito para abrir la tienda
//   (decisión founder 2026-07-25: logo + portada obligatorios para PUBLICAR;
//   la aprobación sigue sin bloquear por imágenes — fix/aprobacion-sin-logo).

import type { Merchant } from "@prisma/client";
import { prisma } from "./prisma";
import {
    getRequiredDocumentFields,
    DOCUMENT_COLUMNS,
    type MerchantDocumentField,
} from "./merchant-document-approval";

export interface SetupStep {
    id: string;
    label: string;
    hint: string;
    done: boolean;
    href: string;
}

export interface MerchantSetupState {
    steps: SetupStep[];
    doneCount: number;
    total: number;
    nextStep: SetupStep | null;
    /** true mientras el comercio no está aprobado O le faltan requisitos */
    setupMode: boolean;
    /** completó todo de su lado y solo falta la aprobación de Moovy */
    waitingApproval: boolean;
    canOpenStore: boolean;
    docsComplete: boolean;
    activeProducts: number;
    /** labels de los pasos que faltan (para mensajes de error server-side) */
    missingLabels: string[];
}

/**
 * Un documento requerido está "cumplido" desde la perspectiva del comercio si:
 * - cargó el archivo/valor (aunque OPS todavía no lo haya revisado), O
 * - su estado es APPROVED (cubre la aprobación PHYSICAL desde OPS sin URL).
 */
export function isDocumentSatisfied(
    merchant: Merchant,
    field: MerchantDocumentField
): boolean {
    const cols = DOCUMENT_COLUMNS[field];
    const value = (merchant as Record<string, unknown>)[cols.valueColumn];
    const status = (merchant as Record<string, unknown>)[cols.statusColumn];
    return Boolean(value) || status === "APPROVED";
}

export async function computeMerchantSetup(merchant: Merchant): Promise<MerchantSetupState> {
    const [activeProducts, requiredDocs] = await Promise.all([
        prisma.product.count({ where: { merchantId: merchant.id, isActive: true } }),
        getRequiredDocumentFields(merchant.category),
    ]);

    const isApproved = merchant.approvalStatus === "APPROVED";
    const docsComplete =
        isApproved || requiredDocs.every((f) => isDocumentSatisfied(merchant, f));

    const hasProducts = activeProducts >= 1;
    const hasLogo = Boolean(merchant.image);
    const hasBanner = Boolean(merchant.banner);
    const hasSchedule = Boolean(merchant.scheduleJson);
    const hasAddress = Boolean(merchant.address && merchant.latitude);
    const canOpenStore =
        docsComplete && hasSchedule && hasProducts && hasAddress && hasLogo && hasBanner;

    // Ordenados por valor para el comercio: lo lindo primero, el papeleo al final.
    const steps: SetupStep[] = [
        { id: "product", label: "Cargá tu primer producto", hint: "Con foto y precio. Después agregás los que quieras.", done: hasProducts, href: "/comercios/productos/nuevo" },
        { id: "logo", label: "Subí el logo de tu comercio", hint: "La cara de tu tienda en los listados.", done: hasLogo, href: "/comercios/mi-comercio/perfil" },
        { id: "banner", label: "Subí tu foto de portada", hint: "La imagen grande que corona tu tienda.", done: hasBanner, href: "/comercios/mi-comercio/perfil" },
        { id: "schedule", label: "Definí tus horarios", hint: "Cuándo recibís pedidos.", done: hasSchedule, href: "/comercios/mi-comercio/horarios" },
        { id: "address", label: "Confirmá tu dirección", hint: "Para calcular los envíos.", done: hasAddress, href: "/comercios/mi-comercio/perfil" },
        { id: "docs", label: "Completá tu documentación", hint: "La revisamos y publicamos tu tienda.", done: docsComplete, href: "/comercios/mi-comercio/documentacion" },
    ];

    const doneCount = steps.filter((s) => s.done).length;
    const nextStep = steps.find((s) => !s.done) ?? null;
    const missingLabels = steps.filter((s) => !s.done).map((s) => s.label);
    const setupMode = !isApproved || !canOpenStore;
    const waitingApproval = !nextStep && !isApproved;

    return { steps, doneCount, total: steps.length, nextStep, setupMode, waitingApproval, canOpenStore, docsComplete, activeProducts, missingLabels };
}
