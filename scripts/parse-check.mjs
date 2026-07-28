// scripts/parse-check.mjs — verificación de PARSEO real de archivos .tsx
//
// Por qué existe (fix/comercio-pausa-stock-y-ajustes, 2026-07-27): `tsc --noEmit`
// dio LIMPIO con un archivo que Turbopack rechazaba con "Parsing ecmascript
// source code failed" — el founder se encontró el Build Error en el navegador.
// La causa fue un comentario JSX `{/* ... */}` colocado como primer hijo dentro
// de `{condicion && ( ... )}`: ese paréntesis admite UN solo elemento, y tsc no
// lo marcó. Este script usa el mismo tipo de parser que el build (esbuild) para
// atrapar esa familia de errores ANTES de abrir el navegador.
//
// Uso:
//   node scripts/parse-check.mjs                 → todos los .tsx cambiados vs develop
//   node scripts/parse-check.mjs ruta/al/File.tsx → archivos puntuales
//
// Nota: esbuild trae binario por plataforma. Corre en la máquina donde se hizo
// `npm install` (Windows para el equipo Moovy).

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

let files = process.argv.slice(2);

if (files.length === 0) {
    // Sin commitear + staged + ya commiteado en la rama + archivos nuevos.
    // (La primera versión miraba SOLO `develop...HEAD` y no encontraba nada
    //  mientras el trabajo vivía en el árbol de trabajo — que es justo el
    //  momento en el que uno quiere verificar antes de cerrar la rama.)
    const sources = [
        "git diff --name-only",
        "git diff --name-only --cached",
        "git diff --name-only develop...HEAD",
        "git ls-files --others --exclude-standard",
    ];
    const found = new Set();
    for (const cmd of sources) {
        try {
            for (const line of execSync(cmd, { encoding: "utf8" }).split("\n")) {
                const f = line.trim();
                if (f.endsWith(".tsx") && existsSync(f)) found.add(f);
            }
        } catch {
            // Alguna fuente puede fallar (ej: sin rama develop). Seguimos.
        }
    }
    files = [...found].sort();
}

if (files.length === 0) {
    console.log("Sin archivos .tsx para revisar.");
    process.exit(0);
}

const { transformSync } = await import("esbuild");

let bad = 0;
for (const f of files) {
    try {
        transformSync(readFileSync(f, "utf8"), { loader: "tsx", jsx: "preserve" });
        console.log("  ok    " + f);
    } catch (e) {
        bad++;
        const err = e.errors?.[0];
        console.log("  ROTO  " + f);
        console.log("        " + (err?.text || e.message) + (err?.location ? ` (línea ${err.location.line})` : ""));
    }
}

console.log(bad ? `\n${bad} archivo(s) no parsean.` : `\n${files.length} archivo(s) OK.`);
process.exit(bad ? 1 : 0);
