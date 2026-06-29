/**
 * Setup Mundo Real — runbook orquestador para ambiente de prueba pre-launch
 * Rama: chore/seed-mundo-real
 *
 * Corre todos los seeds en orden y valida la integridad al final. Diseñado para
 * que vos corras UN SOLO comando y tengas el ambiente armado:
 *
 *   npx tsx scripts/setup-mundo-real.ts            # dry-run, lista pasos
 *   npx tsx scripts/setup-mundo-real.ts --execute  # corre todo
 *
 * Pasos en orden (dependen unos de otros):
 *   1. seed-categories            → Categorías de productos (Comida, Bebidas, etc)
 *   2. seed-biblia-launch         → StoreSettings, Points, Tiers, MoovyConfig
 *   3. seed-package-categories    → PackageCategory + DeliveryRate (Biblia v3)
 *   4. seed-delivery-zones        → 3 zonas A/B/C (polígonos vacíos)
 *   5. seed-product-weight-cache  → 130 productos comunes argentinos
 *   6. seed-real-world-test       → 4 cuentas test + 5 productos
 *   7. validate-ops-config        → integridad del panel OPS
 *
 * IDEMPOTENTE: cada seed individual lo es; corrido 2 veces no duplica.
 *
 * IMPORTANTE: corré primero `clean-db-pre-launch.ts --execute` si querés
 * empezar de cero (preserva el admin OPS, borra todo lo demás).
 */

import { spawnSync } from "child_process";
import path from "path";

const isExecute = process.argv.includes("--execute");

interface Step {
    name: string;
    description: string;
    script: string;
    args?: string[];
    optional?: boolean;
}

const STEPS: Step[] = [
    {
        name: "1. Categorías de productos",
        description: "Comida, Bebidas, Almacén, etc. Necesarias para el catálogo.",
        script: "seed-categories.ts",
    },
    {
        name: "2. Biblia Financiera",
        description: "StoreSettings (delivery, comisiones, zonas legacy, clima), PointsConfig (10pts/$1k, signup 1.000, niveles), MerchantLoyaltyConfig (BRONCE 10% → DIAMANTE 7%), MoovyConfig (key-value).",
        script: "seed-biblia-launch.ts",
    },
    {
        name: "3. Categorías de paquete",
        description: "MICRO/SMALL/MEDIUM/LARGE/XL/FLETE + DeliveryRate (Biblia v3: $800 a $8.000 base).",
        script: "seed-package-categories.ts",
    },
    {
        name: "4. Zonas de delivery",
        description: "Zona A/B/C con multipliers 1.0/1.15/1.35 y bonus driver 0/150/350. Polígonos vacíos (los dibujás vos en /ops/zonas-delivery).",
        script: "seed-delivery-zones.ts",
    },
    {
        name: "5. Cache de pesos comunes",
        description: "130 productos típicos argentinos con peso/volumen estimado. Reduce llamadas a IA en el botón 'Sugerir' del form de comercio.",
        script: "seed-product-weight-cache.ts",
        args: ["--execute"],
    },
    {
        name: "6. Cuentas test",
        description: "Buyer + Merchant aprobado (5 productos) + Driver MOTO online + Seller marketplace. Direcciones reales en Ushuaia.",
        script: "seed-real-world-test.ts",
    },
    {
        name: "7. Validación final",
        description: "9 tests de integridad del panel OPS. Detecta configs faltantes o inconsistentes.",
        script: "validate-ops-config.ts",
        optional: true, // Falla por inconsistencias menores no bloquea el setup
    },
];

function runStep(step: Step): boolean {
    const scriptPath = path.join("scripts", step.script);
    const args = ["tsx", scriptPath, ...(step.args ?? [])];
    console.log(`\n${"━".repeat(70)}`);
    console.log(`  ${step.name}`);
    console.log(`  ${step.description}`);
    console.log(`${"━".repeat(70)}`);
    console.log(`  $ npx ${args.join(" ")}\n`);

    const result = spawnSync("npx", args, {
        stdio: "inherit",
        shell: true,
    });

    if (result.status !== 0) {
        console.log(`\n  ✖ Step "${step.name}" failed con exit code ${result.status}`);
        if (step.optional) {
            console.log(`  ⚠ Es OPCIONAL — seguimos con los siguientes pasos.\n`);
            return true;
        }
        return false;
    }
    return true;
}

function dryRun() {
    console.log("\n[DRY-RUN] Setup Mundo Real — pasos planeados");
    console.log("═".repeat(70));
    for (const step of STEPS) {
        console.log(`\n  ${step.name}${step.optional ? "  (opcional)" : ""}`);
        console.log(`    Script: scripts/${step.script}${step.args ? ` ${step.args.join(" ")}` : ""}`);
        console.log(`    Detalle: ${step.description}`);
    }
    console.log("\n" + "═".repeat(70));
    console.log("  Para ejecutar:  npx tsx scripts/setup-mundo-real.ts --execute");
    console.log("");
}

async function execute() {
    const startedAt = Date.now();
    console.log("\n[EXECUTE] Setup Mundo Real");
    console.log("═".repeat(70));

    let okCount = 0;
    let failedAt: string | null = null;

    for (const step of STEPS) {
        const ok = runStep(step);
        if (!ok) {
            failedAt = step.name;
            break;
        }
        okCount++;
    }

    const duration = Math.round((Date.now() - startedAt) / 1000);

    console.log("\n" + "═".repeat(70));
    if (failedAt) {
        console.log(`  ✖ SETUP INCOMPLETO — falló en: ${failedAt}`);
        console.log(`  Pasos completados: ${okCount}/${STEPS.length}  ·  Tiempo: ${duration}s`);
        console.log("");
        process.exit(1);
    } else {
        console.log(`  ✓ SETUP COMPLETADO — todos los pasos OK`);
        console.log(`  Pasos: ${okCount}/${STEPS.length}  ·  Tiempo: ${duration}s`);
        console.log("");
        console.log("  Próximos pasos:");
        console.log("    1. Levantar app:        npm run dev");
        console.log("    2. Login admin OPS:     /ops");
        console.log("    3. Dibujar zonas:       /ops/zonas-delivery");
        console.log("    4. Correr checklist:    docs/testing/checklist-mundo-real.md");
        console.log("");
    }
}

if (isExecute) {
    execute();
} else {
    dryRun();
}
