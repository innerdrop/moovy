// Planificador de la importación de productos por CSV — lógica PURA.
// Rama: fix/import-no-pisa-el-trabajo
//
// Vive separado de la ruta (src/app/api/comercios/products/import) por dos motivos:
// se puede testear sin base de datos (regla canónica: lo que toca plata lleva test), y
// la pantalla de "qué va a cambiar" usa EXACTAMENTE el mismo plan que después se
// aplica. Si el preview y la escritura calcularan por separado, el preview mentiría —
// y un preview que miente es peor que no tener preview.
//
// REGLA QUE GOBIERNA TODO EL MÓDULO:
//   Un campo vacío NUNCA pisa un campo lleno.
// Si el archivo no trae stock, el stock no se toca. Si no trae descripción, la
// descripción no se toca. Antes de esto, una importación sin columna de stock dejaba
// en CERO todo el catálogo que emparejaba: la tienda entera sin stock, en silencio.

/** Una fila del archivo, ya validada y con el precio final derivado. */
export interface FilaImport {
    name: string;
    description: string | null;
    price: number;
    basePrice: number | null;
    markupPercent: number | null;
    barcode: string | null;
    /** null = la columna no vino en el archivo → el stock existente NO se toca. */
    stock: number | null;
    /**
     * Producto al que el comercio decidió apuntar esta fila desde la pantalla de
     * revisión (emparejamiento por nombre confirmado a mano). Manda sobre el código.
     */
    matchId?: string | null;
}

/** Lo mínimo que necesitamos saber de un producto que el comercio ya tiene. */
export interface ProductoExistente {
    id: string;
    name: string;
    barcode: string | null;
    price: number;
    stock: number;
    /** Soft delete de moderación. Un producto borrado se actualiza pero sigue oculto. */
    deletedAt?: Date | null;
}

export type MotivoOmision = "codigo-roto-por-excel" | "codigo-repetido-en-el-archivo";

export interface Omitida {
    fila: FilaImport;
    motivo: MotivoOmision;
    /** Texto listo para mostrarle al comercio. */
    detalle: string;
}

export type CampoCambiado = "precio" | "stock" | "descripcion";

export interface Actualizacion {
    id: string;
    fila: FilaImport;
    /** Solo los campos que efectivamente se van a escribir. */
    datos: DatosActualizables;
    /** Qué cambia de verdad respecto de lo que hay hoy. Vacío = nada cambia. */
    cambios: CampoCambiado[];
    /** Cómo se emparejó: por código o porque el comercio lo eligió a mano. */
    via: "codigo" | "eleccion-manual";
    /** El producto está soft-deleted: se actualiza pero no va a verse. */
    estaEliminado: boolean;
    /** Lo que hay hoy, para mostrar el antes y después. */
    antes: { name: string; price: number; stock: number };
}

export interface DatosActualizables {
    price: number;
    basePrice: number | null;
    markupPercent: number | null;
    stock?: number;
    description?: string;
}

export interface Alta {
    fila: FilaImport;
    /**
     * Un producto que ya existe y se llama igual, pero no tiene código (o tiene otro).
     * Es una SUGERENCIA: el comercio decide. Nunca se empareja solo por nombre, porque
     * un catálogo real tiene nombres repetidos que son productos distintos.
     */
    sugerencia?: { id: string; name: string; price: number };
}

export interface PlanImport {
    aCrear: Alta[];
    aActualizar: Actualizacion[];
    omitidas: Omitida[];
    /** Productos del comercio que NO vinieron en el archivo. Quedan como están. */
    ausentes: ProductoExistente[];
}

/**
 * Detecta un código que Excel arruinó al guardar: 7790895000129 se convierte en
 * "7.79089E+12" y los dígitos perdidos NO se pueden recuperar. Por eso la fila se
 * omite con un mensaje claro en vez de guardar basura que después nunca va a
 * emparejar y termina duplicando el producto en cada importación.
 */
export function esCodigoRotoPorExcel(raw: string): boolean {
    return /^\d+(?:[.,]\d+)?E\+?\d+$/i.test(raw.trim());
}

/**
 * Clave de comparación de códigos. Dos escrituras del MISMO producto tienen que dar
 * la misma clave.
 *
 * - Espacios y guiones no significan nada en un código de barras.
 * - Los ceros a la izquierda se descartan SOLO en códigos numéricos, porque
 *   EAN-13 = "0" + UPC-12 es la misma mercadería (y porque Excel se come ese cero
 *   al abrir el archivo). "0790895000129" y "790895000129" son el mismo producto.
 * - Los códigos internos del comercio (con letras) se comparan en mayúsculas y tal
 *   cual: ahí un cero adelante SÍ puede ser significativo.
 */
export function claveDeCodigo(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const limpio = raw.replace(/[\s\-]/g, "").toUpperCase();
    if (!limpio) return null;
    if (/^\d+$/.test(limpio)) {
        const sinCeros = limpio.replace(/^0+/, "");
        return sinCeros || "0";
    }
    return limpio;
}

/**
 * Clave de comparación de nombres, para SUGERIR un emparejamiento cuando no hay
 * código. Sin acentos, sin puntuación, sin espacios de más, en minúsculas.
 * "COCA COLA 2.5L" y "Coca-Cola 2.5 L" dan la misma clave.
 */
export function claveDeNombre(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const k = raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    return k || null;
}

/**
 * Qué campos se escriben en un producto que ya existe. Acá vive la regla del módulo:
 * lo que el archivo no trae, no se toca. El precio siempre se actualiza porque es el
 * motivo por el que alguien reimporta una lista.
 */
export function datosDeActualizacion(fila: FilaImport): DatosActualizables {
    const datos: DatosActualizables = {
        price: fila.price,
        basePrice: fila.basePrice,
        markupPercent: fila.markupPercent,
    };
    if (fila.stock !== null && fila.stock !== undefined) datos.stock = fila.stock;
    if (fila.description && fila.description.trim().length > 0) {
        datos.description = fila.description;
    }
    return datos;
}

/** Qué cambia de verdad respecto del producto que ya está cargado. */
function calcularCambios(datos: DatosActualizables, actual: ProductoExistente): CampoCambiado[] {
    const cambios: CampoCambiado[] = [];
    if (Math.abs(datos.price - actual.price) > 0.009) cambios.push("precio");
    if (datos.stock !== undefined && datos.stock !== actual.stock) cambios.push("stock");
    if (datos.description !== undefined) cambios.push("descripcion");
    return cambios;
}

/**
 * Arma el plan completo: qué se crea, qué se actualiza, qué se omite y qué quedó
 * afuera del archivo. No toca la base ni escribe nada; devolver el plan es todo lo
 * que hace.
 */
export function planificarImport(
    filas: FilaImport[],
    existentes: ProductoExistente[],
): PlanImport {
    const porId = new Map<string, ProductoExistente>();
    const porCodigo = new Map<string, ProductoExistente>();
    for (const p of existentes) {
        porId.set(p.id, p);
        const k = claveDeCodigo(p.barcode);
        // El primero gana: si el comercio arrastra dos productos con el mismo código
        // (datos viejos previos al índice único), actualizamos uno solo y no rompemos.
        if (k && !porCodigo.has(k)) porCodigo.set(k, p);
    }

    // Índice de nombres para SUGERIR. Un nombre que se repite queda descartado: en un
    // catálogo real "GALLETITAS COFLER BLOCK" son tres productos distintos, y sugerir
    // el equivocado es peor que no sugerir nada.
    const porNombre = new Map<string, ProductoExistente | null>();
    for (const p of existentes) {
        const k = claveDeNombre(p.name);
        if (!k) continue;
        porNombre.set(k, porNombre.has(k) ? null : p);
    }

    const plan: PlanImport = { aCrear: [], aActualizar: [], omitidas: [], ausentes: [] };
    const vistasEnElArchivo = new Set<string>();
    const tocados = new Set<string>();

    for (const fila of filas) {
        if (fila.barcode && esCodigoRotoPorExcel(fila.barcode)) {
            plan.omitidas.push({
                fila,
                motivo: "codigo-roto-por-excel",
                detalle:
                    `"${fila.name}": el código quedó como "${fila.barcode}". Excel lo convirtió a ` +
                    `notación científica y los dígitos ya no se pueden recuperar. Volvé a exportar ` +
                    `el archivo como CSV, o formateá la columna del código como texto antes de guardar.`,
            });
            continue;
        }

        const clave = claveDeCodigo(fila.barcode);

        if (clave && vistasEnElArchivo.has(clave)) {
            // Antes esta fila se guardaba con el código en blanco y creaba un producto
            // fantasma imposible de emparejar en la siguiente importación.
            plan.omitidas.push({
                fila,
                motivo: "codigo-repetido-en-el-archivo",
                detalle: `"${fila.name}": el código ${fila.barcode} aparece más de una vez en el archivo. Se importó la primera aparición.`,
            });
            continue;
        }
        if (clave) vistasEnElArchivo.add(clave);

        // La elección manual del comercio manda sobre el emparejamiento por código.
        const elegido = fila.matchId ? porId.get(fila.matchId) : undefined;
        const existente = elegido ?? (clave ? porCodigo.get(clave) : undefined);

        if (existente) {
            const datos = datosDeActualizacion(fila);
            plan.aActualizar.push({
                id: existente.id,
                fila,
                datos,
                cambios: calcularCambios(datos, existente),
                via: elegido ? "eleccion-manual" : "codigo",
                estaEliminado: !!existente.deletedAt,
                antes: { name: existente.name, price: existente.price, stock: existente.stock },
            });
            tocados.add(existente.id);
            continue;
        }

        // Alta. Si hay un producto que se llama igual y todavía nadie lo tocó en esta
        // corrida, lo ofrecemos como sugerencia para que el comercio decida.
        const kn = claveDeNombre(fila.name);
        const candidato = kn ? porNombre.get(kn) : null;
        const sugerencia =
            candidato && !tocados.has(candidato.id)
                ? { id: candidato.id, name: candidato.name, price: candidato.price }
                : undefined;
        plan.aCrear.push(sugerencia ? { fila, sugerencia } : { fila });
    }

    plan.ausentes = existentes.filter((p) => !tocados.has(p.id) && !p.deletedAt);
    return plan;
}
