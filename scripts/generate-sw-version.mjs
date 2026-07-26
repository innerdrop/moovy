// scripts/generate-sw-version.mjs
// fix/pwa-actualizacion-instantanea (2026-07-25)
//
// Estampa la versión del Service Worker en public/sw-version.js (GITIGNORADO
// — el VPS hace `git reset --hard` antes de cada build, así que un archivo
// generado nunca ensucia el árbol ni rompe el pull).
//
// Corre automáticamente como "prebuild" (npm lo encadena antes de `npm run
// build`, en local y en el VPS). Versión = hash del commit + timestamp del
// build: cada deploy produce bytes nuevos ⇒ el navegador detecta el SW nuevo
// (updateViaCache:"none" en el registrar) ⇒ banner "Actualizar" en minutos.
// Nunca más bumpear CACHE_VERSION a mano.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

let commit = "nogit";
try {
    commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
} catch {
    // Sin git (tarball, CI raro): el timestamp solo alcanza para versionar.
}

const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12); // YYYYMMDDHHmm
const version = `${commit}-${stamp}`;

writeFileSync(
    "public/sw-version.js",
    `// Generado por scripts/generate-sw-version.mjs — NO editar, NO commitear.\nself.__MOOVY_SW_VERSION__ = '${version}';\n`,
    "utf8"
);

console.log(`[sw-version] Service Worker version: ${version}`);
