// API: Importación masiva de productos por el COMERCIO (desde CSV).
// Rama: feat/import-productos-comercio
//
// A diferencia del import de OPS (catálogo maestro, merchantId null, formato rico),
// este crea productos DEL comercio como BORRADORES (isActive:false, sin foto), a
// partir de lo poco que trae un export real: nombre, descripción (si viene),
// precio y barcode. Todo lo demás (foto, tamaño, categoría) lo completa el
// comercio después. Deduplica por barcode: si el comercio ya tiene ese barcode,
// actualiza precio/descr/stock en vez de duplicar.
//
// NOTA: usamos (prisma as any) en las ops que tocan `barcode` porque el campo es
// nuevo en el schema; el client tipado lo conoce recién tras `prisma generate`
// (post db push). En runtime funciona igual.

import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_ROWS = 2000;
const CREATE_CHUNK = 400;

const RowSchema = z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    price: z.coerce.number().min(0).max(100_000_000),
    barcode: z.string().trim().max(64).optional().nullable(),
    stock: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
});

function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "producto";
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
}

export async function POST(request: Request) {
    const authResult = await requireMerchantApi();
    if (authResult instanceof NextResponse) return authResult;
    const { merchant } = authResult;
    if (!merchant) {
        return NextResponse.json({ error: "No tenés un comercio asociado" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const rows = (body as any)?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "No se recibieron filas para importar" }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
        return NextResponse.json({ error: `Máximo ${MAX_ROWS} productos por importación` }, { status: 400 });
    }

    // 1. Validar fila por fila (server-side, no confiar en el cliente).
    const errors: { row: number; reason: string }[] = [];
    type Clean = { name: string; description: string | null; price: number; barcode: string | null; stock: number };
    const clean: Clean[] = [];
    const seenBarcodes = new Set<string>();

    rows.forEach((raw: any, i: number) => {
        const parsed = RowSchema.safeParse(raw);
        if (!parsed.success) {
            errors.push({ row: i + 1, reason: parsed.error.issues[0]?.message || "Fila inválida" });
            return;
        }
        const d = parsed.data;
        let barcode = d.barcode && d.barcode.length > 0 ? d.barcode : null;
        // Dedup dentro del mismo archivo: si el barcode ya vino, lo dejamos sin
        // barcode para no chocar con el índice único (mejor duplicar sin código
        // que perder la fila).
        if (barcode && seenBarcodes.has(barcode)) barcode = null;
        if (barcode) seenBarcodes.add(barcode);
        clean.push({
            name: d.name,
            description: d.description && d.description.length > 0 ? d.description : null,
            price: Math.round(d.price * 100) / 100,
            barcode,
            stock: d.stock ?? 0,
        });
    });

    if (clean.length === 0) {
        return NextResponse.json({ created: 0, updated: 0, skipped: 0, errors }, { status: 200 });
    }

    // 2. Deduplicar contra lo que el comercio YA tiene (por barcode).
    const barcodes = clean.map((c) => c.barcode).filter((b): b is string => !!b);
    const existing = barcodes.length
        ? await (prisma as any).product.findMany({
              where: { merchantId: merchant.id, barcode: { in: barcodes } },
              select: { id: true, barcode: true },
          })
        : [];
    const existingByBarcode = new Map<string, string>(existing.map((p: any) => [p.barcode, p.id]));

    const toCreate = clean.filter((c) => !(c.barcode && existingByBarcode.has(c.barcode)));
    const toUpdate = clean.filter((c) => c.barcode && existingByBarcode.has(c.barcode));

    let created = 0;
    let updated = 0;

    // 3. Updates (los que ya existen por barcode): precio/descr/stock.
    for (const c of toUpdate) {
        try {
            await (prisma as any).product.update({
                where: { id: existingByBarcode.get(c.barcode!) },
                data: {
                    price: c.price,
                    stock: c.stock,
                    ...(c.description ? { description: c.description } : {}),
                },
            });
            updated++;
        } catch (err) {
            errors.push({ row: 0, reason: `No se pudo actualizar "${c.name}"` });
        }
    }

    // 4. Creates: como BORRADORES (isActive:false, sin foto), en lotes.
    for (let i = 0; i < toCreate.length; i += CREATE_CHUNK) {
        const chunk = toCreate.slice(i, i + CREATE_CHUNK);
        const data = chunk.map((c) => ({
            name: c.name,
            slug: generateSlug(c.name),
            description: c.description,
            price: c.price,
            costPrice: 0,
            stock: c.stock,
            isActive: false, // borrador: oculto hasta que el comercio le ponga foto
            merchantId: merchant.id,
            barcode: c.barcode,
        }));
        try {
            const res = await (prisma as any).product.createMany({ data, skipDuplicates: true });
            created += res.count ?? chunk.length;
        } catch (err) {
            console.error("[import comercio] fallo un lote:", err);
            errors.push({ row: 0, reason: `Falló un lote de ${chunk.length} productos` });
        }
    }

    return NextResponse.json(
        {
            created,
            updated,
            skipped: errors.length,
            total: rows.length,
            errors: errors.slice(0, 50), // no inundar la respuesta
        },
        { status: 200 },
    );
}
