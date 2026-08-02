// API: Importación masiva de productos por el COMERCIO (desde CSV).
// Rama: feat/import-productos-comercio · fix/import-no-pisa-el-trabajo
//
// A diferencia del import de OPS (catálogo maestro, merchantId null, formato rico),
// este crea productos DEL comercio como BORRADORES (isActive:false, sin foto), a
// partir de lo poco que trae un export real: nombre, descripción (si viene),
// precio y barcode. Todo lo demás (foto, tamaño, categoría) lo completa el
// comercio después.
//
// El QUÉ se crea, QUÉ se actualiza y QUÉ se omite lo decide src/lib/import/plan.ts,
// que es puro y está testeado, y es el MISMO que usa la ruta /preview. Acá solo se
// escribe el plan. Regla que lo gobierna: un campo vacío NUNCA pisa un campo lleno —
// una importación sin columna de stock deja el stock como está, no en cero.
//
// NOTA: usamos (prisma as any) en las ops que tocan `barcode` porque el campo es
// nuevo en el schema; el client tipado lo conoce recién tras `prisma generate`
// (post db push). En runtime funciona igual.

import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";
import { leerEntrada, SELECT_EXISTENTES } from "@/lib/import/entrada";
import { planificarImport, type ProductoExistente } from "@/lib/import/plan";

const CREATE_CHUNK = 400;

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

    const entrada = leerEntrada(body);
    if ("error" in entrada) return NextResponse.json({ error: entrada.error }, { status: 400 });

    const errors = [...entrada.errores];
    if (entrada.filas.length === 0) {
        return NextResponse.json({ created: 0, updated: 0, skipped: 0, errors }, { status: 200 });
    }

    // Traemos TODOS los productos del comercio. No se puede filtrar por
    // `barcode: { in: [...] }` porque el emparejamiento es sobre el código normalizado
    // (sin espacios, sin el cero que Excel se come) y sobre el nombre, y eso no se
    // puede expresar en SQL sobre el valor crudo. Son seis columnas de ~1.000 filas.
    const existentes: ProductoExistente[] = await (prisma as any).product.findMany({
        where: { merchantId: merchant.id },
        select: SELECT_EXISTENTES,
    });

    const plan = planificarImport(entrada.filas, existentes);
    for (const o of plan.omitidas) errors.push({ row: 0, reason: o.detalle });

    let created = 0;
    let updated = 0;
    let sinCambios = 0;
    let actualizadosOcultos = 0;

    // 1. Updates: solo los campos que el archivo realmente trae (ver plan.ts). Los que
    // no cambian nada no se escriben — así reimportar el mismo archivo dos veces no
    // hace nada la segunda vez.
    for (const a of plan.aActualizar) {
        if (a.cambios.length === 0) {
            sinCambios++;
            continue;
        }
        try {
            await (prisma as any).product.update({ where: { id: a.id }, data: a.datos });
            updated++;
            if (a.estaEliminado) actualizadosOcultos++;
        } catch {
            errors.push({ row: 0, reason: `No se pudo actualizar "${a.fila.name}"` });
        }
    }
    if (actualizadosOcultos > 0) {
        errors.push({
            row: 0,
            reason: `${actualizadosOcultos} producto(s) se actualizaron pero siguen ocultos porque fueron dados de baja por moderación.`,
        });
    }

    // 2. Creates: como BORRADORES (isActive:false, sin foto), en lotes.
    for (let i = 0; i < plan.aCrear.length; i += CREATE_CHUNK) {
        const chunk = plan.aCrear.slice(i, i + CREATE_CHUNK);
        const data = chunk.map(({ fila: c }) => ({
            name: c.name,
            slug: generateSlug(c.name),
            description: c.description,
            price: c.price,
            basePrice: c.basePrice,
            markupPercent: c.markupPercent,
            costPrice: 0,
            stock: c.stock ?? 0, // producto nuevo: sin dato, arranca en cero
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
            unchanged: sinCambios,
            skipped: plan.omitidas.length,
            total: entrada.filas.length,
            errors: errors.slice(0, 50), // no inundar la respuesta
        },
        { status: 200 },
    );
}
