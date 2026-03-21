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
import { calculateShippingCost, validateDeliveryFee, calculateDriverEarnings } from "../shipping-cost-calculator";
import { calculateOrderPriority, prioritizeOrders, isOrderExceedingSLA } from "../order-priority";
import { calculateFullETA, calculatePreCheckoutETA } from "../eta-calculator";

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
// 3. Shipping Cost Calculator
// ═══════════════════════════════════════════════════════════════════════════════

section("Shipping Cost — Cálculo básico");

const costMediumStd = calculateShippingCost({
  distanceKm: 3.5,
  packageCategory: "MEDIUM",
  shipmentTypeCode: "STANDARD",
  orderTotal: 5000,
  freeDeliveryMinimum: null,
});
assert(costMediumStd.baseCost === 600, "MEDIUM base: $600");
assert(costMediumStd.distanceCost === 875, "MEDIUM 3.5km: $875");
assert(costMediumStd.shipmentSurcharge === 0, "STANDARD sin recargo");
assert(costMediumStd.total === 1475, "MEDIUM STANDARD 3.5km total: $1475");

const costMediumFresh = calculateShippingCost({
  distanceKm: 3.5,
  packageCategory: "MEDIUM",
  shipmentTypeCode: "FRESH",
  orderTotal: 5000,
  freeDeliveryMinimum: null,
});
assert(costMediumFresh.shipmentSurcharge === 200, "FRESH recargo: $200");
assert(costMediumFresh.total === 1675, "MEDIUM FRESH 3.5km total: $1675");

section("Shipping Cost — Envío gratis");

const costFree = calculateShippingCost({
  distanceKm: 3.5,
  packageCategory: "MEDIUM",
  shipmentTypeCode: "STANDARD",
  orderTotal: 10000,
  freeDeliveryMinimum: 8000,
});
assert(costFree.isFreeDelivery === true, "Order $10000 > min $8000 → gratis");
assert(costFree.total === 0, "Total $0 con envío gratis");

section("Shipping Cost — Retiro en local");

const costPickup = calculateShippingCost({
  distanceKm: 3.5,
  packageCategory: "MEDIUM",
  shipmentTypeCode: "STANDARD",
  orderTotal: 5000,
  freeDeliveryMinimum: null,
  isPickup: true,
});
assert(costPickup.total === 0, "Pickup total: $0");

section("Shipping Cost — Validación de fee del frontend");

const serverResult = calculateShippingCost({
  distanceKm: 3,
  packageCategory: "SMALL",
  shipmentTypeCode: "STANDARD",
  orderTotal: 3000,
  freeDeliveryMinimum: null,
});

const v1 = validateDeliveryFee(0, serverResult);
assert(v1.wasModified === true, "Frontend $0 → corregido");
assert(v1.correctedFee === serverResult.total, "Corregido al valor server");

const v2 = validateDeliveryFee(serverResult.total, serverResult);
assert(v2.wasModified === false, "Fee correcto → sin cambio");

const v3 = validateDeliveryFee(99999, serverResult);
assert(v3.wasModified === true, "Fee exagerado → corregido");

section("Shipping Cost — Earnings del driver");

const earnings = calculateDriverEarnings("MEDIUM", 5);
assert(earnings === 1850, "MEDIUM 5km earnings: 600 + 250*5 = $1850");

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
// 5. ETA Calculator
// ═══════════════════════════════════════════════════════════════════════════════

section("ETA Calculator — Cálculo completo");

const etaHot = calculateFullETA({
  distanceDriverToMerchantKm: 1.5,
  distanceMerchantToCustomerKm: 3.0,
  vehicleType: "MOTO",
  merchantPrepTimeMin: 15,
  shipmentTypeCode: "HOT",
  hasDriverAssigned: true,
});
assert(etaHot.totalMinutes > 0, `ETA HOT calculado: ${etaHot.totalMinutes} min`);
assert(etaHot.slaMinutes === 45, "SLA HOT: 45 min");
assert(etaHot.displayLabel.includes("min"), `Display label: "${etaHot.displayLabel}"`);
assert(etaHot.breakdown.prepTime === 15, "Prep time: 15 min");
assert(etaHot.breakdown.driverWaitTime === 0, "Sin espera de driver (ya asignado)");

section("ETA Calculator — Sin driver asignado");

const etaNoDriver = calculateFullETA({
  distanceDriverToMerchantKm: 0,
  distanceMerchantToCustomerKm: 3.0,
  vehicleType: "MOTO",
  merchantPrepTimeMin: 15,
  shipmentTypeCode: "STANDARD",
  hasDriverAssigned: false,
});
assert(etaNoDriver.breakdown.driverWaitTime === 5, "Driver wait: 5 min promedio");
assert(etaNoDriver.breakdown.driverToMerchant === 0, "Driver to merchant: 0 (no asignado)");

section("ETA Calculator — SLA excedido");

const etaFarHot = calculateFullETA({
  distanceDriverToMerchantKm: 10,
  distanceMerchantToCustomerKm: 15,
  vehicleType: "BIKE",
  merchantPrepTimeMin: 20,
  shipmentTypeCode: "HOT",
  hasDriverAssigned: true,
});
assert(etaFarHot.exceedsSLA === true, `HOT lejano (${etaFarHot.totalMinutes}min) excede SLA de 45min`);
assert(etaFarHot.slaWarning !== undefined, "Warning presente cuando excede SLA");

section("ETA Calculator — Pre-checkout");

const etaPreCheckout = calculatePreCheckoutETA({
  distanceMerchantToCustomerKm: 3.0,
  merchantPrepTimeMin: 15,
  shipmentTypeCode: "HOT",
});
assert(etaPreCheckout.breakdown.driverWaitTime === 5, "Pre-checkout: incluye wait time");
assert(etaPreCheckout.totalMinutes > 0, `Pre-checkout ETA: ${etaPreCheckout.totalMinutes} min`);

section("ETA Calculator — Normalización de vehicleType");

const etaBici = calculateFullETA({
  distanceDriverToMerchantKm: 2,
  distanceMerchantToCustomerKm: 3,
  vehicleType: "bicicleta",
  merchantPrepTimeMin: 10,
  shipmentTypeCode: "STANDARD",
  hasDriverAssigned: true,
});
const etaBike = calculateFullETA({
  distanceDriverToMerchantKm: 2,
  distanceMerchantToCustomerKm: 3,
  vehicleType: "BIKE",
  merchantPrepTimeMin: 10,
  shipmentTypeCode: "STANDARD",
  hasDriverAssigned: true,
});
assert(etaBici.totalMinutes === etaBike.totalMinutes, `"bicicleta" y "BIKE" dan mismo ETA: ${etaBici.totalMinutes}min`);

// ═══════════════════════════════════════════════════════════════════════════════
// Resultado
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n${"═".repeat(60)}`);
console.log(`  RESULTADO: ${passed} pasaron, ${failed} fallaron`);
console.log(`${"═".repeat(60)}\n`);

if (failed > 0) {
  process.exit(1);
}
