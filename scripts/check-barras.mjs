#!/usr/bin/env node
/**
 * check:barras — red de seguridad de la regla #47.
 *
 * rama feat/barras-flotantes-y-copy
 *
 * Ninguna barra fija escribe su propio número. El offset sale de
 * --moovy-bar-bottom, que se define UNA vez por zona en globals.css.
 *
 * Este chequeo existe porque el bug ya volvió tres veces: se arreglaba una barra
 * a mano, y a las semanas nacía otra con el número copiado (y mal). Busca los
 * dos patrones que lo delatan:
 *
 *   1. `fixed` + `bottom-16` / `bottom-20` / `bottom-24` / `bottom-28` /
 *      `bottom-32` en el mismo className. Esos valores NUNCA son legítimos:
 *      son intentos de esquivar la navegación a ojo.
 *      (`bottom-0` sí es legítimo — es lo que usan las navegaciones mismas.)
 *
 *   2. Aritmética a mano con la safe-area: `env(safe-area-inset-bottom) + 72px`
 *      y parientes. Ese "+ 72" fue el número mal calculado que se copió de un
 *      archivo a otro.
 *
 * No es un linter completo ni pretende serlo: es barato, no tiene falsos
 * positivos conocidos y ataca exactamente la forma en que este bug reaparece.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = "src";

/** Archivos que pueden escribir números a mano, con motivo. */
const PERMITIDOS = new Set([
    // La página de diagnóstico dibuja una barra de prueba y necesita un valor
    // de respaldo literal para poder comparar contra el token.
    "src/app/(store)/debug/viewport/ViewportDebugClient.tsx",
]);

const PATRON_CLASE = /className\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g;
const BOTTOM_MAGICO = /\bbottom-(?:16|20|24|28|32|36|40)\b/;
const ARITMETICA = /env\(\s*safe-area-inset-bottom[^)]*\)\s*\)?\s*[+-]\s*\d/;
/**
 * Números mágicos en JS: la burbuja de soporte tenía `BOTTOM_NAV_SPACE = 116`
 * y calculaba su posición con `window.innerHeight - 116`. Es el mismo bug que
 * el de las clases, pero escrito en JavaScript, así que el patrón de className
 * no lo veía. Fue la TERCERA reaparición.
 */
const JS_MAGICO = /(?:innerHeight|clientHeight)\s*-\s*(?:\d{2,3})\b/;

function* tsx(dir) {
    for (const nombre of readdirSync(dir)) {
        const p = join(dir, nombre);
        if (statSync(p).isDirectory()) {
            yield* tsx(p);
        } else if (p.endsWith(".tsx") || p.endsWith(".ts")) {
            yield p;
        }
    }
}

const fallas = [];

for (const archivo of tsx(RAIZ)) {
    const rel = relative(".", archivo).split("\\").join("/");
    if (PERMITIDOS.has(rel)) continue;

    const src = readFileSync(archivo, "utf8");
    const lineas = src.split("\n");

    lineas.forEach((linea, i) => {
        if (ARITMETICA.test(linea)) {
            fallas.push({
                archivo: rel,
                linea: i + 1,
                texto: linea.trim(),
                motivo: "aritmética a mano con la safe-area — usá var(--moovy-bar-bottom)",
            });
        }
        if (JS_MAGICO.test(linea)) {
            fallas.push({
                archivo: rel,
                linea: i + 1,
                texto: linea.trim(),
                motivo:
                    "número mágico restado al alto de la pantalla — usá medirEspacioInferior() de @/lib/useNavPeak",
            });
        }
    });

    for (const m of src.matchAll(PATRON_CLASE)) {
        const clases = m[1] ?? m[2] ?? m[3] ?? "";
        if (!clases.includes("fixed")) continue;
        if (!BOTTOM_MAGICO.test(clases)) continue;

        const linea = src.slice(0, m.index).split("\n").length;
        fallas.push({
            archivo: rel,
            linea,
            texto: clases.trim().slice(0, 120),
            motivo: "barra fija con el offset escrito a mano — usá var(--moovy-bar-bottom)",
        });
    }
}

if (fallas.length === 0) {
    console.log("✅ check:barras — ninguna barra fija escribe su propio número.");
    process.exit(0);
}

console.error(`\n❌ check:barras — ${fallas.length} problema(s). Regla #47.\n`);
for (const f of fallas) {
    console.error(`  ${f.archivo}:${f.linea}`);
    console.error(`    ${f.motivo}`);
    console.error(`    → ${f.texto}\n`);
}
console.error(
    "El offset de las barras inferiores se define UNA vez por zona en\n" +
    "src/app/globals.css. Si tu pantalla necesita otro valor, el que está mal es\n" +
    "el token de la zona, no la barra.\n",
);
process.exit(1);
