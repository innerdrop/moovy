// API: previsualización de la importación — NO escribe nada.
// Rama: fix/import-no-pisa-el-trabajo
//
// Devuelve el mismo plan que después va a aplicar /api/comercios/products/import,
// calculado con el mismo módulo puro. Es lo que alimenta la pantalla de "qué va a
// cambiar": el comercio ve el antes y el después producto por producto y decide,
// en vez de apretar Importar y rezar.

import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";
import { leerEntrada, SELECT_EXISTENTES } from "@/lib/import/entrada";
import { planificarImport, type ProductoExistente } from "@/lib/import/plan";

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

    // Traemos TODOS los productos del comercio: el emparejamiento es sobre el código
    // normalizado y sobre el nombre, y ninguna de las dos cosas se puede expresar en
    // SQL sobre el valor crudo. Son seis columnas de ~1.000 filas.
    const existentes: ProductoExistente[] = await (prisma as any).product.findMany({
        where: { merchantId: merchant.id },
        select: SELECT_EXISTENTES,
    });

    const plan = planificarImport(entrada.filas, existentes);

    // Los que emparejaron y NO cambian. Antes iban solo como número, y el comercio
    // no tenía forma de verificar que un producto hubiera emparejado bien: el único
    // indicio era que NO apareciera en "se crean". Encontrado probando el caso del
    // código al que Excel le come el cero de la izquierda.
    const sinCambios = plan.aActualizar
        .filter((a) => a.cambios.length === 0)
        .map((a) => ({ nombre: a.antes.name, barcode: a.fila.barcode, precio: a.antes.price }));

    const actualizar = plan.aActualizar
        .filter((a) => a.cambios.length > 0)
        .map((a) => ({
            barcode: a.fila.barcode,
            nombre: a.antes.name,
            via: a.via,
            estaEliminado: a.estaEliminado,
            cambios: a.cambios,
            precioAntes: a.antes.price,
            precioDespues: a.datos.price,
            stockAntes: a.antes.stock,
            stockDespues: a.datos.stock ?? null,
        }));

    return NextResponse.json({
        resumen: {
            filas: entrada.filas.length,
            actualizan: actualizar.length,
            sinCambios: sinCambios.length,
            crean: plan.aCrear.length,
            omitidas: plan.omitidas.length,
            ausentes: plan.ausentes.length,
            invalidas: entrada.errores.length,
        },
        actualizar,
        sinCambios,
        crear: plan.aCrear.map((a) => ({
            nombre: a.fila.name,
            barcode: a.fila.barcode,
            precio: a.fila.price,
            sugerencia: a.sugerencia ?? null,
        })),
        omitidas: plan.omitidas.map((o) => ({ nombre: o.fila.name, motivo: o.motivo, detalle: o.detalle })),
        ausentes: plan.ausentes.slice(0, 200).map((p) => ({ nombre: p.name, barcode: p.barcode, precio: p.price })),
        invalidas: entrada.errores.slice(0, 50),
    });
}
