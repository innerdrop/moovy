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
//
// feat/el-panel-dice-la-verdad (2026-08-02):
// - El paso del producto deja de ser un sí/no. Cuando no hay ninguno publicado
//   busca los borradores y dice QUÉ le falta al que está más cerca de salir.
//   Salió del caso real: el comercio que importa por planilla entra todo como
//   borrador (isActive:false) y la guía le seguía diciendo "cargá tu primer
//   producto" cuando en realidad ya lo había cargado y solo le faltaba la foto.
// - El conteo de publicados ahora excluye los borrados por moderación de OPS.

import type { Merchant } from "@prisma/client";
import { prisma } from "./prisma";
import {
    getRequiredDocumentFields,
    DOCUMENT_COLUMNS,
    type MerchantDocumentField,
} from "./merchant-document-approval";
import { faltantesDeProducto } from "./product-completeness";
// Los nombres importados por planilla llegan con mojibake; se limpian acá para
// que la guía y la barra muestren el mismo texto que el listado de productos.
import { cleanEncoding } from "./utils/stringUtils";

/** El borrador que el comercio tiene más cerca de publicar, y qué le falta. */
export interface DetallePasoProducto {
    productoId: string;
    nombre: string;
    /** Vacío = el borrador está completo y solo falta que lo muestre. */
    faltan: string[];
    /** Cuántos borradores más quedan además de este. */
    otrosPendientes: number;
}

export interface SetupStep {
    id: string;
    label: string;
    hint: string;
    done: boolean;
    href: string;
    /** Hoy solo lo trae el paso `product`. Ver detallePasoProducto(). */
    detalle?: DetallePasoProducto | null;
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
    /** Atajo al detalle del paso `product` (null si no hay borradores). */
    productoPendiente: DetallePasoProducto | null;
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

/**
 * Busca el borrador que el comercio dejó más cerca de publicarse.
 *
 * Elegimos el que MENOS cosas necesita para que el próximo paso sea el más
 * barato; a igualdad de faltantes gana el más recién tocado (el orderBy ya los
 * trae así, y el `>=` estricto conserva al primero).
 *
 * El take de 20 es a propósito: con más borradores el número exacto deja de
 * importar y solo hace falta uno para explicar el paso.
 */
async function detallePasoProducto(merchantId: string): Promise<DetallePasoProducto | null> {
    const borradores = await prisma.product.findMany({
        where: { merchantId, isActive: false, deletedAt: null },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            weightGrams: true,
            _count: { select: { images: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
    });
    if (borradores.length === 0) return null;

    let elegido: DetallePasoProducto | null = null;
    for (const borrador of borradores) {
        const faltan = faltantesDeProducto(borrador);
        if (elegido && faltan.length >= elegido.faltan.length) continue;
        elegido = {
            productoId: borrador.id,
            nombre: cleanEncoding(borrador.name),
            faltan,
            otrosPendientes: borradores.length - 1,
        };
    }
    return elegido;
}

export async function computeMerchantSetup(merchant: Merchant): Promise<MerchantSetupState> {
    const [activeProducts, requiredDocs] = await Promise.all([
        // deletedAt: un producto dado de baja por moderación de OPS no puede
        // seguir contando como "ya cargaste tu primer producto" — la tienda se
        // habilitaría con cero productos visibles.
        prisma.product.count({ where: { merchantId: merchant.id, isActive: true, deletedAt: null } }),
        getRequiredDocumentFields(merchant.category),
    ]);

    // Solo vale la pena mirar los borradores si no hay NINGÚN producto publicado:
    // es el único caso en que el paso sigue pendiente y podemos explicar por qué.
    const productoPendiente = activeProducts === 0 ? await detallePasoProducto(merchant.id) : null;

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
        // Con un borrador a medio cargar el CTA no puede ser "nuevo producto": lo
        // mandamos a terminar el que ya tiene (la ruta de edición del listado).
        { id: "product", label: "Cargá tu primer producto", hint: "Con foto y precio. Después agregás los que quieras.", done: hasProducts, href: productoPendiente ? `/comercios/productos/${productoPendiente.productoId}` : "/comercios/productos/nuevo", detalle: productoPendiente },
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

    return { steps, doneCount, total: steps.length, nextStep, setupMode, waitingApproval, canOpenStore, docsComplete, activeProducts, missingLabels, productoPendiente };
}
