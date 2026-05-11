import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // chore/github-actions-ci (2026-05-10): archivos auxiliares que no son
    // parte del bundle de la app y tienen deuda tecnica de hace tiempo
    // (require() vs import, any sin tipar). El lint del codigo de la app
    // (src/**) sigue corriendo normal. Si en el futuro se decide limpiar
    // scripts/ o seeds, removemos los ignores correspondientes.
    "scripts/**",        // admin/seed/migracion CLI scripts
    "prisma/seed*.ts",   // seeds (corren con tsx, no son parte del bundle)
    "prisma/seed*.mjs",
    "load-testing/**",   // tests de carga con k6 (otro runtime)
    "public/sw.js",      // service worker — pre-existente con warnings de unused vars
  ]),
]);

export default eslintConfig;
