/**
 * Test script: ISSUE-032 — Sistema de zonas excluidas de cobertura
 *
 * Verifica que:
 *  1. `parseExcludedZones` es defensivo ante JSON inválido / shape malformado.
 *  2. `validateZoneInput` rechaza rangos inválidos (lat/lng/radio/nombre/razón).
 *  3. `getExcludedZone` hace el matching geográfico correcto via Haversine.
 *  4. Las zonas `active: false` NO bloquean aunque el punto caiga dentro.
 *  5. La columna `StoreSettings.excludedZonesJson` existe y su contenido parsea OK.
 *
 * Uso:
 *   npx tsx scripts/test-excluded-zones.ts
 */

import { PrismaClient } from "@prisma/client";
import {
    parseExcludedZones,
    getExcludedZone,
    validateZoneInput,
    type ExcludedZone,
} from "../src/lib/excluded-zones";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
    if (cond) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`);
        failed++;
    }
}

function makeZone(partial: Partial<ExcludedZone> = {}): ExcludedZone {
    const now = new Date().toISOString();
    return {
        id: "zone-test-1",
        name: "Zona Test",
        lat: -54.8019,
        lng: -68.3030,
        radiusKm: 0.5,
        reason: "Test",
        active: true,
        createdAt: now,
        updatedAt: now,
        ...partial,
    };
}

async function main() {
    console.log("\n=== ISSUE-032: test de zonas excluidas ===\n");

    // ------------------------------------------------------------------
    // 1. parseExcludedZones — defensa ante inputs rotos
    // ------------------------------------------------------------------
    console.log("1. parseExcludedZones defensivo:");
    assert("null → []", parseExcludedZones(null).length === 0);
    assert("undefined → []", parseExcludedZones(undefined).length === 0);
    assert("string vacío → []", parseExcludedZones("").length === 0);
    assert("JSON inválido → []", parseExcludedZones("not json").length === 0);
    assert("objeto no-array → []", parseExcludedZones('{"foo":1}').length === 0);
    assert(
        "array con entries malformadas filtra silenciosamente",
        parseExcludedZones('[{"foo":"bar"},{"id":"x","name":"X","lat":-54,"lng":-68,"radiusKm":1,"reason":"r","active":true,"createdAt":"2026-01-01","updatedAt":"2026-01-01"}]').length === 1
    );
    assert(
        "array válido parsea todas las zonas",
        parseExcludedZones(JSON.stringify([makeZone({ id: "a" }), makeZone({ id: "b" })])).length === 2
    );

    // ------------------------------------------------------------------
    // 2. validateZoneInput — rangos
    // ------------------------------------------------------------------
    console.log("\n2. validateZoneInput rangos:");
    const validInput = {
        name: "Costa Susana",
        lat: -54.83,
        lng: -68.35,
        radiusKm: 0.5,
        reason: "Sin señal celular",
    };
    const validResult = validateZoneInput(validInput);
    assert("payload válido → ok:true", validResult.ok === true);

    assert("name vacío rechazado", validateZoneInput({ ...validInput, name: "" }).ok === false);
    assert("name > 50 chars rechazado", validateZoneInput({ ...validInput, name: "x".repeat(51) }).ok === false);
    assert("lat > 90 rechazado", validateZoneInput({ ...validInput, lat: 91 }).ok === false);
    assert("lat < -90 rechazado", validateZoneInput({ ...validInput, lat: -91 }).ok === false);
    assert("lng > 180 rechazado", validateZoneInput({ ...validInput, lng: 181 }).ok === false);
    assert("lng < -180 rechazado", validateZoneInput({ ...validInput, lng: -181 }).ok === false);
    assert("radiusKm < 0.1 rechazado", validateZoneInput({ ...validInput, radiusKm: 0.05 }).ok === false);
    assert("radiusKm > 3 rechazado", validateZoneInput({ ...validInput, radiusKm: 3.5 }).ok === false);
    assert("reason vacío rechazado", validateZoneInput({ ...validInput, reason: "" }).ok === false);
    assert("reason > 200 chars rechazado", validateZoneInput({ ...validInput, reason: "x".repeat(201) }).ok === false);
    assert("null rechazado", validateZoneInput(null).ok === false);
    assert("string rechazado", validateZoneInput("hola").ok === false);
    assert(
        "active: false respetado",
        (() => {
            const r = validateZoneInput({ ...validInput, active: false });
            return r.ok === true && r.data.active === false;
        })()
    );
    assert(
        "active ausente → default true",
        (() => {
            const r = validateZoneInput(validInput);
            return r.ok === true && r.data.active === true;
        })()
    );

    // ------------------------------------------------------------------
    // 3. getExcludedZone — matching geográfico
    // ------------------------------------------------------------------
    console.log("\n3. getExcludedZone matching geográfico:");

    // Zona "Costa Susana" 300m de radio, centro hipotético
    const costaSusana: ExcludedZone = makeZone({
        id: "costa-susana",
        name: "Costa Susana",
        lat: -54.8300,
        lng: -68.3500,
        radiusKm: 0.3,
        reason: "Sin señal celular",
        active: true,
    });
    const centroUshuaia: ExcludedZone = makeZone({
        id: "centro-test",
        name: "Zona Test Centro",
        lat: -54.8019,
        lng: -68.3030,
        radiusKm: 0.2,
        reason: "Test",
        active: true,
    });
    const zonaPausada: ExcludedZone = makeZone({
        id: "pausada-test",
        name: "Pausada",
        lat: -54.8019,
        lng: -68.3030,
        radiusKm: 10, // radio enorme, si no fuera por active:false matchearía todo
        reason: "Pausada",
        active: false,
    });

    const zones = [costaSusana, centroUshuaia, zonaPausada];

    // Punto exactamente en el centro de Costa Susana → matchea
    const hit1 = getExcludedZone(-54.8300, -68.3500, zones);
    assert("Punto en centro de Costa Susana matchea", hit1?.id === "costa-susana");

    // Punto a ~50m del centro de Costa Susana → matchea (dentro del radio 300m)
    // 50m en lat ≈ 0.00045 grados
    const hit2 = getExcludedZone(-54.82955, -68.3500, zones);
    assert("Punto a ~50m matchea (dentro del radio)", hit2?.id === "costa-susana");

    // Punto a >1km de Costa Susana → no matchea
    // 1km en lat ≈ 0.009 grados
    const miss1 = getExcludedZone(-54.8400, -68.3500, zones);
    assert("Punto a >1km NO matchea Costa Susana", miss1?.id !== "costa-susana");

    // Punto en centro Ushuaia (lejos de Costa Susana, cerca de centroUshuaia)
    const hit3 = getExcludedZone(-54.8019, -68.3030, zones);
    assert("Punto en centro Ushuaia matchea zona centro", hit3?.id === "centro-test");

    // Punto lejano → no matchea ninguna zona activa (pausada tiene radio 10km pero active:false)
    const miss2 = getExcludedZone(-50.0, -60.0, zones);
    assert("Punto lejano NO matchea ninguna zona activa", miss2 === null);

    // Punto en zona pausada → NO matchea (active:false)
    const missPaused = getExcludedZone(-54.8019, -68.3030, [zonaPausada]);
    assert("Zona con active:false NO bloquea", missPaused === null);

    // Array vacío → null
    assert("zones vacío → null", getExcludedZone(-54.8, -68.3, []) === null);

    // ------------------------------------------------------------------
    // 4. Sanity check: StoreSettings.excludedZonesJson existe y parsea
    // ------------------------------------------------------------------
    console.log("\n4. StoreSettings.excludedZonesJson en DB:");
    try {
        const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } });
        if (!settings) {
            console.log("  ⚠️  No hay StoreSettings con id='settings' — skipping DB tests");
        } else {
            const raw = (settings as any).excludedZonesJson;
            assert(
                "excludedZonesJson existe (string)",
                typeof raw === "string",
                `tipo recibido: ${typeof raw}`
            );
            const parsed = parseExcludedZones(raw);
            assert(
                "excludedZonesJson parsea sin crashear",
                Array.isArray(parsed),
                `devuelto: ${typeof parsed}`
            );
            console.log(`  ℹ️  Zonas configuradas en DB: ${parsed.length}`);
            parsed.forEach((z) => {
                console.log(`     - ${z.name} (${z.radiusKm}km) [${z.active ? "activa" : "pausada"}]`);
            });
        }
    } catch (e: any) {
        console.log(`  ❌ Error al leer StoreSettings: ${e.message}`);
        failed++;
    }

    // ------------------------------------------------------------------
    console.log(`\n=== Resultado: ${passed} OK, ${failed} errores ===\n`);
    if (failed > 0) process.exit(1);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
