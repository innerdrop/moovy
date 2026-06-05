/**
 * Tests para los módulos P0 del motor logístico.
 *
 * Ejecutar con:
 *   npx tsx src/lib/__tests__/logistics-p0.test.ts
 *
 * No requiere DB ni servidor — todos los módulos testeados son funciones puras.
 */

import { normalizeVehicleType, normalizeVehicleTypeOrDefault, vehicleTypeMatches, getVehicleSpeed } from "../vehicle-type-mapping";
import { getShipmentType, autoDetectShipmentType, getCompatibleVehicles, isVehicleCompatibleWithShipment, SHIPMENT_TYPES, getShipmentSLALabel } from "../shipment-types";
// Rama fix/biblia-motor-envio-y-comisiones: calculateShippingCost / validateDeliveryFee /
// calculateDriverEarnings se ELIMINARON (motor único de envío en delivery.ts).
// Los tests de esos módulos se removieron de este archivo.
import { calculateOrderPriority, prioritizeOrders, isOrderExceedingSLA } from "../order-priority";
// fix/asignacion-y-logistica (2026-06-05): eta-calculator eliminado (código muerto).
// Las pruebas de ETA de este check fueron removidas junto con el módulo.

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

function section(name: string) {
  console.log(`\n━━━ ${name} ━━━`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Vehicle Type Mapping
// ═══════════════════════════════════════════════════════════════════════════════

section("Vehicle Type Mapping — Normalización");

assert(normalizeVehicleType("bicicleta") === "BIKE", "bicicleta → BIKE");
assert(normalizeVehicleType("BIKE") === "BIKE", "BIKE → BIKE");
assert(normalizeVehicleType("moto") === "MOTO", "moto → MOTO");
assert(normalizeVehicleType("MOTO") === "MOTO", "MOTO → MOTO");
assert(normalizeVehicleType("auto") === "CAR", "auto → CAR");
assert(normalizeVehicleType("CAR") === "CAR", "CAR → CAR");
assert(normalizeVehicleType("camioneta") === "TRUCK", "camioneta → TRUCK");
assert(normalizeVehicleType("TRUCK") === "TRUCK", "TRUCK → TRUCK");
assert(normalizeVehicleType("Bicicleta") === "BIKE", "Bicicleta (capitalizada) → BIKE");
assert(normalizeVehicleType(null) === null, "null → null");
assert(normalizeVehicleType("patineta") === null, "patineta → null (no reconocido)");
assert(normalizeVehicleTypeOrDefault(null) === "MOTO", "null con default → MOTO");

section("Vehicle Type Mapping — Matching");

assert(vehicleTypeMatches("bicicleta", ["BIKE", "MOTO"]) === true, "bicicleta matchea con [BIKE, MOTO]");
assert(vehicleTypeMatches("auto", ["BIKE", "MOTO"]) === false, "auto NO matchea con [BIKE, MOTO]");
assert(vehicleTypeMatches("moto", ["BIKE", "MOTO", "CAR", "TRUCK"]) === true, "moto matchea con todos");
assert(vehicleTypeMatches(null, ["BIKE"]) === false, "null no matchea");

section("Vehicle Type Mapping — Velocidades");

assert(getVehicleSpeed("MOTO") === 25, "MOTO: 25 km/h");
assert(getVehicleSpeed("bicicleta") === 12, "bicicleta: 12 km/h (normaliza a BIKE)");
assert(getVehicleSpeed("auto") === 20, "auto: 20 km/h (normaliza a CAR)");
assert(getVehicleSpeed("TRUCK") === 18, "TRUCK: 18 km/h");
assert(getVehicleSpeed("desconocido") === 25, "desconocido: fallback 25 km/h (MOTO)");

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Shipment Types
// ═══════════════════════════════════════════════════════════════════════════════

section("Shipment Types — Definiciones");

assert(SHIPMENT_TYPES.HOT.maxDeliveryMinutes === 45, "HOT SLA: 45 min");
assert(SHIPMENT_TYPES.FRESH.maxDeliveryMinutes === 90, "FRESH SLA: 90 min");
assert(SHIPMENT_TYPES.STANDARD.maxDeliveryMinutes === 480, "STANDARD SLA: 480 min");
assert(SHIPMENT_TYPES.HOT.requiresThermalBag === true, "HOT requiere bolsa térmica");
assert(SHIPMENT_TYPES.FRESH.requiresColdChain === true, "FRESH requiere cadena de frío");
assert(SHIPMENT_TYPES.FRAGILE.requiresCarefulHandle === true, "FRAGILE requiere manipulación cuidadosa");
assert(SHIPMENT_TYPES.HOT.priorityWeight === 100, "HOT prioridad: 100");
assert(SHIPMENT_TYPES.FRESH.surchargeArs === 200, "FRESH recargo: $200");

section("Shipment Types — getShipmentType");

assert(getShipmentType("HOT").code === "HOT", "getShipmentType('HOT') funciona");
assert(getShipmentType("hot").code === "HOT", "getShipmentType('hot') normaliza");
assert(getShipmentType(null).code === "STANDARD", "null → STANDARD");
assert(getShipmentType("INEXISTENTE").code === "STANDARD", "desconocido → STANDARD");

section("Shipment Types — Auto-detección");

assert(
  autoDetectShipmentType({ merchantCategoryName: "Gastronomía", productNames: ["Pizza grande"] }) === "HOT",
  "Merchant 'Gastronomía' + pizza → HOT"
);
assert(
  autoDetectShipmentType({ merchantCategoryName: "Restaurante", productNames: ["Hamburguesa"] }) === "HOT",
  "Merchant 'Restaurante' → HOT"
);
assert(
  autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Helado artesanal"] }) === "FRESH",
  "Producto 'Helado' → FRESH"
);
assert(
  autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Jarrón de vidrio"] }) === "FRAGILE",
  "Producto 'vidrio' → FRAGILE"
);
assert(
  autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Sobre carta", "Factura"] }) === "DOCUMENT",
  "Todos documentos → DOCUMENT"
);
assert(
  autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Remera", "Pantalón"] }) === "STANDARD",
  "Ropa genérica → STANDARD"
);
assert(
  autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Zapatillas"], manualOverride: "FRAGILE" }) === "FRAGILE",
  "Override manual tiene prioridad"
);

section("Shipment Types — Compatibilidad de vehículos");

assert(isVehicleCompatibleWithShipment("CAR", "HOT") === true, "CAR compatible con HOT");
assert(isVehicleCompatibleWithShipment("TRUCK", "HOT") === false, "TRUCK NO compatible con HOT");
assert(isVehicleCompatibleWithShipment("BIKE", "FRAGILE") === false, "BIKE NO compatible con FRAGILE");
assert(isVehicleCompatibleWithShipment("CAR", "FRAGILE") === true, "CAR compatible con FRAGILE");

section("Shipment Types — Intersección de vehículos");

const hotVehicles = getCompatibleVehicles(["BIKE", "MOTO", "CAR", "TRUCK"], "HOT");
assert(hotVehicles.includes("MOTO") && hotVehicles.includes("CAR") && !hotVehicles.includes("TRUCK"), "MICRO + HOT = [BIKE,MOTO,CAR] (sin TRUCK)");

const fragileVehicles = getCompatibleVehicles(["CAR", "TRUCK"], "FRAGILE");
assert(fragileVehicles.includes("CAR") && fragileVehicles.includes("TRUCK"), "LARGE + FRAGILE = [CAR,TRUCK]");

const fragileSmall = getCompatibleVehicles(["BIKE", "MOTO", "CAR", "TRUCK"], "FRAGILE");
assert(!fragileSmall.includes("BIKE") && !fragileSmall.includes("MOTO"), "SMALL + FRAGILE = sin BIKE ni MOTO");

section("Shipment Types — SLA Labels");

assert(getShipmentSLALabel("HOT").includes("45 min"), "HOT label incluye '45 min'");
assert(getShipmentSLALabel("STANDARD").includes("día"), "STANDARD label incluye 'día'");

// ═══════════════════════════════════════════════════════════════════════════════
// 3. (Shipping Cost Calculator) — ELIMINADO en fix/biblia-motor-envio-y-comisiones.
//    El motor único de envío es calculateDeliveryCost/computeDeliveryFee
//    (delivery.ts). Sus tests viven en la simulación financiera de la rama.
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Order Priority
// ═══════════════════════════════════════════════════════════════════════════════

section("Order Priority — Cálculo individual");

const hotOrder = calculateOrderPriority({
  id: "hot-1",
  createdAt: new Date(Date.now() - 5 * 60000), // 5 min ago
  shipmentTypeCode: "HOT",
  assignmentAttempts: 0,
});
assert(hotOrder.breakdown.shipmentTypePriority === 100, "HOT priority weight: 100");
assert(hotOrder.breakdown.waitTimePriority === 10, "5 min wait: +10");
assert(hotOrder.priority === 110, "HOT 5min total: 110");

const stdOrder = calculateOrderPriority({
  id: "std-1",
  createdAt: new Date(Date.now() - 5 * 60000),
  shipmentTypeCode: "STANDARD",
  assignmentAttempts: 0,
});
assert(stdOrder.priority === 10, "STANDARD 5min total: 10");

section("Order Priority — Ordenamiento de cola");

const orders = [
  { id: "std", createdAt: new Date(Date.now() - 10 * 60000), shipmentTypeCode: "STANDARD" as const, assignmentAttempts: 0 },
  { id: "hot", createdAt: new Date(Date.now() - 2 * 60000), shipmentTypeCode: "HOT" as const, assignmentAttempts: 0 },
  { id: "fresh", createdAt: new Date(Date.now() - 5 * 60000), shipmentTypeCode: "FRESH" as const, assignmentAttempts: 0 },
  { id: "std-retry", createdAt: new Date(Date.now() - 3 * 60000), shipmentTypeCode: "STANDARD" as const, assignmentAttempts: 3 },
];

const sorted = prioritizeOrders(orders);
assert(sorted[0].orderId === "hot", "HOT es primero en la cola");
assert(sorted[1].orderId === "fresh", "FRESH es segundo");

section("Order Priority — SLA check");

const slaHot = isOrderExceedingSLA({
  createdAt: new Date(Date.now() - 60 * 60000),
  shipmentTypeCode: "HOT",
});
assert(slaHot.exceeding === true, "HOT de 60min excede SLA de 45min");
assert(slaHot.slaMinutes === 45, "HOT SLA: 45 min");

const slaStd = isOrderExceedingSLA({
  createdAt: new Date(Date.now() - 60 * 60000),
  shipmentTypeCode: "STANDARD",
});
assert(slaStd.exceeding === false, "STANDARD de 60min NO excede SLA de 480min");

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ETA Calculator — ELIMINADO (fix/asignacion-y-logistica): el módulo
//    eta-calculator era código muerto y se retiró. No hay pruebas que correr.
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// Resultado
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n${"═".repeat(60)}`);
console.log(`  RESULTADO: ${passed} pasaron, ${failed} fallaron`);
console.log(`${"═".repeat(60)}\n`);

if (failed > 0) {
  process.exit(1);
}