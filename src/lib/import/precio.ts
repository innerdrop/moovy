// Lectura del precio de una celda de CSV — lógica PURA.
// Rama: feat/import-mostrar-los-que-quedan-igual
//
// Vive acá y no en la página porque decide plata: un error de interpretación acá se
// escribe en el catálogo entero. Testeado en src/__tests__/import-precio.test.ts.
//
// EL PROBLEMA: en Argentina el punto es separador de miles y la coma de decimales,
// pero medio parque de sistemas exporta al revés, y muchos exportan sin decimales.
// "8.400" puede ser ocho mil cuatrocientos (lo normal en un kiosco) u ocho con cuatro
// décimas. La versión anterior leía siempre 8,40 — y como el archivo de Pixel Point
// venía con enteros pelados, nunca se notó. Con el export de otro comercio, el
// catálogo entero entraba a la milésima parte de su precio.
//
// LA REGLA: si el separador aparece una sola vez y lo siguen EXACTAMENTE tres
// dígitos, es de miles. En precios de comercio no existen tres decimales. Si lo
// siguen uno o dos dígitos, es decimal. Si el mismo separador aparece varias veces,
// siempre es de miles.

/**
 * Convierte el texto de una celda en un número. Devuelve null si no hay número.
 * Acepta "$", espacios y cualquier otro adorno alrededor.
 */
export function parsePrecio(v: string | null | undefined): number | null {
    if (!v) return null;
    const limpio = v.trim().replace(/[^\d.,-]/g, "");
    if (!limpio || !/\d/.test(limpio)) return null;

    const puntos = (limpio.match(/\./g) || []).length;
    const comas = (limpio.match(/,/g) || []).length;

    let normalizado: string;
    if (puntos > 0 && comas > 0) {
        // Vienen los dos: el ÚLTIMO en aparecer es el decimal, el otro es de miles.
        const decimal = limpio.lastIndexOf(",") > limpio.lastIndexOf(".") ? "," : ".";
        const miles = decimal === "," ? "." : ",";
        normalizado = limpio.split(miles).join("").replace(decimal, ".");
    } else if (puntos + comas === 0) {
        normalizado = limpio;
    } else {
        const sep = puntos > 0 ? "." : ",";
        const veces = puntos + comas;
        const cola = limpio.slice(limpio.lastIndexOf(sep) + 1);
        // Varias apariciones (1.234.567) o exactamente tres dígitos detrás (8.400):
        // separador de miles. Un precio de comercio no tiene tres decimales.
        const esDeMiles = veces > 1 || cola.length === 3;
        normalizado = esDeMiles ? limpio.split(sep).join("") : limpio.replace(sep, ".");
    }

    const n = parseFloat(normalizado);
    return Number.isFinite(n) ? n : null;
}
