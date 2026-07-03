/**
 * Verificación — fix/asignacion-sin-filtro-equipamiento
 *
 * Comprueba contra la DB real (NO mocks) que la naturaleza del envío
 * (caliente/frío) ya NO excluye repartidores ni restringe vehículos,
 * y que el tamaño/peso (PackageCategory) SIGUE mandando.
 *
 * Uso: npx tsx scripts/verify-asignacion-sin-equipamiento.ts
 */

import { prisma } from "../src/lib/prisma";
import {
    EQUIPMENT_FILTERS_ENABLED,
    driverMeetsEquipmentRequirements,
    getCompatibleVehicles,
    isVehicleCompatibleWithShipment,
} from "../src/lib/shipment-types";
import { calculateOrderCategory, findNextEligibleDriver } from "../src/lib/assignment-engine";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string) {
    if (ok) {
        passed++;
        console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`);
    } else {
        failed++;
        console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
    }
}

async function main() {
    console.log("── Verificación: asignación sin filtro de equipamiento ──\n");

    // 0. El interruptor tiene que estar apagado para el lanzamiento.
    check("Interruptor EQUIPMENT_FILTERS_ENABLED apagado", EQUIPMENT_FILTERS_ENABLED === false);

    // 1. Un driver SIN equipamiento declarado califica para cualquier tipo de envío.
    for (const tipo of ["HOT", "FRESH", "FRAGILE", "STANDARD", "DOCUMENT"]) {
        check(
            `driverMeetsEquipmentRequirements(${tipo}) sin equipamiento`,
            driverMeetsEquipmentRequirements(tipo, { hasThermalBag: false, hasColdStorage: false })
        );
    }

    // 2. La naturaleza del envío no recorta vehículos: entra lo que dicta el tamaño.
    const porTamano = ["BIKE", "MOTO", "CAR", "TRUCK"];
    const conHot = getCompatibleVehicles(porTamano, "HOT");
    check(
        "getCompatibleVehicles(HOT) devuelve los vehículos del tamaño intactos",
        JSON.stringify(conHot) === JSON.stringify(porTamano),
        `resultado: [${conHot.join(", ")}]`
    );
    check("isVehicleCompatibleWithShipment(TRUCK, HOT)", isVehicleCompatibleWithShipment("TRUCK", "HOT"));

    // 3. calculateOrderCategory con comercio gastronómico (auto-detecta HOT):
    //    los vehículos permitidos deben salir SOLO del tamaño (DB PackageCategory).
    const cat = await calculateOrderCategory(
        [{ packageCategory: "SMALL", quantity: 1, name: "producto de prueba" }],
        { merchantCategoryName: "Gastronomía" }
    );
    const smallRow = await prisma.packageCategory.findFirst({ where: { name: cat.category } });
    const esperados = (smallRow?.allowedVehicles as string[] | null) ?? [];
    check(
        `calculateOrderCategory: vehículos = los del tamaño ${cat.category} en DB`,
        esperados.length > 0 && JSON.stringify([...cat.allowedVehicles].sort()) === JSON.stringify([...esperados].sort()),
        `motor: [${cat.allowedVehicles.join(", ")}] · DB: [${esperados.join(", ")}]`
    );

    // 4. El tamaño SIGUE restringiendo (una bici no lleva una heladera):
    const catXL = await calculateOrderCategory([{ packageCategory: "XL", quantity: 1 }]);
    check(
        "El tamaño XL sigue excluyendo BIKE",
        !catXL.allowedVehicles.includes("BIKE"),
        `XL permite: [${catXL.allowedVehicles.join(", ")}]`
    );

    // 5. Contra DB real: si hay un driver online SIN equipamiento y un comercio con
    //    coordenadas, la búsqueda para un envío HOT tiene que encontrarlo.
    const driverSinEquipo = await prisma.driver.findFirst({
        where: { isOnline: true, isActive: true, hasThermalBag: false, latitude: { not: null } },
        select: { id: true, vehicleType: true },
    });
    const merchantConCoords = await prisma.merchant.findFirst({
        where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
        select: { name: true, latitude: true, longitude: true },
    });

    if (driverSinEquipo && merchantConCoords) {
        const encontrado = await findNextEligibleDriver(
            merchantConCoords.latitude!,
            merchantConCoords.longitude!,
            ["BIKE", "MOTO", "CAR", "TRUCK"],
            [],
            "HOT"
        );
        check(
            "findNextEligibleDriver(HOT) encuentra al driver online sin mochila térmica",
            encontrado !== null,
            encontrado ? `driver ${encontrado.id} a ${encontrado.distance.toFixed(2)}km` : "no encontró a nadie"
        );
    } else {
        console.log("⏭️  Test 5 SALTEADO: no hay driver online sin equipamiento o comercio con coords en esta DB");
    }

    console.log(`\n── Resumen: ${passed} ✅ · ${failed} ❌ ──`);
    process.exit(failed > 0 ? 1 : 0);
}

main()
    .catch((e) => {
        console.error("Error corriendo la verificación:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
