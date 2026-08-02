// Validación y normalización del cuerpo que manda el asistente de importación.
// Rama: fix/import-no-pisa-el-trabajo
//
// Lo usan las DOS rutas —la de previsualizar y la de aplicar— para que el preview y
// la escritura partan exactamente de las mismas filas. Si cada una parseara por su
// lado, el preview podría mostrar algo distinto de lo que después se guarda.

import { z } from "zod";
import { deriveImportPricing } from "@/lib/finance/product-pricing";
import type { FilaImport } from "./plan";

export const MAX_ROWS = 2000;

const RowSchema = z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    price: z.coerce.number().min(0).max(100_000_000),
    barcode: z.string().trim().max(64).optional().nullable(),
    stock: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
    /** Producto elegido a mano en la pantalla de revisión. */
    matchId: z.string().trim().max(64).optional().nullable(),
});

export interface EntradaImport {
    filas: FilaImport[];
    errores: { row: number; reason: string }[];
    markupPercent: number;
    treatAsFinal: boolean;
}

export type EntradaInvalida = { error: string };

export function leerEntrada(body: unknown): EntradaImport | EntradaInvalida {
    const rows = (body as any)?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
        return { error: "No se recibieron filas para importar" };
    }
    if (rows.length > MAX_ROWS) {
        return { error: `Máximo ${MAX_ROWS} productos por importación` };
    }

    // feat/recargo-moovy-y-tamano-toggle: recargo del lote (0..1000%) + escotilla
    // "estos ya son precios finales". Clampeamos server-side (no confiar en el cliente).
    const rawMarkup = Number((body as any)?.markupPercent);
    const markupPercent = Number.isFinite(rawMarkup) ? Math.min(1000, Math.max(0, rawMarkup)) : 0;
    const treatAsFinal = (body as any)?.treatAsFinal === true;

    const errores: { row: number; reason: string }[] = [];
    const filas: FilaImport[] = [];

    rows.forEach((raw: unknown, i: number) => {
        const parsed = RowSchema.safeParse(raw);
        if (!parsed.success) {
            errores.push({ row: i + 1, reason: parsed.error.issues[0]?.message || "Fila inválida" });
            return;
        }
        const d = parsed.data;
        // El precio mapeado es el del LOCAL; derivamos el final con el recargo del lote.
        const mapped = Math.round(d.price * 100) / 100;
        const pricing = deriveImportPricing(mapped, markupPercent, treatAsFinal);
        filas.push({
            name: d.name,
            description: d.description && d.description.length > 0 ? d.description : null,
            price: pricing.price,
            basePrice: pricing.basePrice,
            markupPercent: pricing.markupPercent,
            barcode: d.barcode && d.barcode.length > 0 ? d.barcode : null,
            // undefined = el comercio no mapeó la columna → el stock existente no se toca.
            stock: d.stock ?? null,
            matchId: d.matchId || null,
        });
    });

    return { filas, errores, markupPercent, treatAsFinal };
}

/** Columnas que necesita el planificador. Una sola definición para las dos rutas. */
export const SELECT_EXISTENTES = {
    id: true,
    name: true,
    barcode: true,
    price: true,
    stock: true,
    deletedAt: true,
} as const;
