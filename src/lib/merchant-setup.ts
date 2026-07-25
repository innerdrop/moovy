// Estado de armado de la tienda (feat/panel-inmediato-comercio).
// ÚNICA fuente de verdad de los pasos de preparación: la consumen el dashboard
// (tarjeta-guía) y la barra de progreso del layout. Misma lógica canónica de
// requisitos que /api/merchant/onboarding.

import type { Merchant } from "@prisma/client";
import { prisma } from "./prisma";
import { getRequiredDocumentFields } from "./merchant-document-approval";

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
}

export async function computeMerchantSetup(merchant: Merchant): Promise<MerchantSetupState> {
    const [activeProducts, requiredDocs] = await Promise.all([
        prisma.product.count({ where: { merchantId: merchant.id, isActive: true } }),
        getRequiredDocumentFields(merchant.category),
    ]);

    const docOk = (field: string, present: boolean) =>
        !(requiredDocs as string[]).includes(field) || present;
    const docsComplete =
        docOk("cuit", Boolean(merchant.cuit)) &&
        docOk("bankAccount", Boolean(merchant.bankAccount)) &&
        docOk("constanciaAfipUrl", Boolean(merchant.constanciaAfipUrl)) &&
        docOk("habilitacionMunicipalUrl", Boolean(merchant.habilitacionMunicipalUrl)) &&
        docOk("registroSanitarioUrl", Boolean(merchant.registroSanitarioUrl));

    const hasProducts = activeProducts >= 1;
    const hasLogo = Boolean(merchant.image);
    const hasSchedule = Boolean(merchant.scheduleJson);
    const hasAddress = Boolean(merchant.address && merchant.latitude);
    const canOpenStore = docsComplete && hasSchedule && hasProducts && hasAddress;

    // Ordenados por valor para el comercio: lo lindo primero, el papeleo al final.
    const steps: SetupStep[] = [
        { id: "product", label: "Cargá tu primer producto", hint: "Con foto y precio. Después agregás los que quieras.", done: hasProducts, href: "/comercios/productos/nuevo" },
        { id: "logo", label: "Subí el logo de tu comercio", hint: "La cara de tu tienda en los listados.", done: hasLogo, href: "/comercios/mi-comercio/perfil" },
        { id: "schedule", label: "Definí tus horarios", hint: "Cuándo recibís pedidos.", done: hasSchedule, href: "/comercios/mi-comercio/horarios" },
        { id: "address", label: "Confirmá tu dirección", hint: "Para calcular los envíos.", done: hasAddress, href: "/comercios/mi-comercio/perfil" },
        { id: "docs", label: "Completá tu documentación", hint: "La revisamos y publicamos tu tienda.", done: docsComplete, href: "/comercios/mi-comercio/documentacion" },
    ];

    const doneCount = steps.filter((s) => s.done).length;
    const nextStep = steps.find((s) => !s.done) ?? null;
    const setupMode = merchant.approvalStatus !== "APPROVED" || !canOpenStore;
    const waitingApproval = !nextStep && merchant.approvalStatus !== "APPROVED";

    return { steps, doneCount, total: steps.length, nextStep, setupMode, waitingApproval, canOpenStore, docsComplete, activeProducts };
}
