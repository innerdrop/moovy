#!/usr/bin/env node
/**
 * Test runner para módulos P0 logísticos.
 *
 * Ejecutar: node --experimental-strip-types --experimental-transform-types --no-warnings src/lib/__tests__/run-logistics-p0.cjs
 */

const { normalizeVehicleType, normalizeVehicleTypeOrDefault, vehicleTypeMatches, getVehicleSpeed } = require("../vehicle-type-mapping.ts");
const { getShipmentType, autoDetectShipmentType, getCompatibleVehicles, isVehicleCompatibleWithShipment, SHIPMENT_TYPES, getShipmentSLALabel } = require("../shipment-types.ts");
// Rama fix/biblia-motor-envio-y-comisiones: calculateShippingCost / validateDeliveryFee /
// calculateDriverEarnings se eliminaron (motor único en delivery.ts).
const { calculateOrderPriority, prioritizeOrders, isOrderExceedingSLA } = require("../order-priority.ts");
const { calculateFullETA, calculatePreCheckoutETA } = require("../eta-calculator.ts");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

function section(name) {
  console.log(`\n━━━ ${name} ━━━`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Vehicle Type Mapping
// ═══════════════════════════════════════════════════════════════════════════════

section("Vehicle Type Mapping — Normalización");
assert(normalizeVehicleType("bicicleta") === "BIKE", "bicicleta → BIKE");
assert(normalizeVehicleType("BIKE") === "BIKE", "BIKE → BIKE");
assert(normalizeVehicleType("moto") === "MOTO", "moto → MOTO");
assert(normalizeVehicleType("auto") === "CAR", "auto → CAR");
assert(normalizeVehicleType("camioneta") === "TRUCK", "camioneta → TRUCK");
assert(normalizeVehicleType("Bicicleta") === "BIKE", "Bicicleta (capitalizada) → BIKE");
assert(normalizeVehicleType(null) === null, "null → null");
assert(normalizeVehicleType("patineta") === null, "patineta → null");
assert(normalizeVehicleTypeOrDefault(null) === "MOTO", "null con default → MOTO");

section("Vehicle Type Mapping — Matching");
assert(vehicleTypeMatches("bicicleta", ["BIKE", "MOTO"]) === true, "bicicleta matchea con [BIKE, MOTO]");
assert(vehicleTypeMatches("auto", ["BIKE", "MOTO"]) === false, "auto NO matchea con [BIKE, MOTO]");
assert(vehicleTypeMatches(null, ["BIKE"]) === false, "null no matchea");

section("Vehicle Type Mapping — Velocidades");
assert(getVehicleSpeed("MOTO") === 25, "MOTO: 25 km/h");
assert(getVehicleSpeed("bicicleta") === 12, "bicicleta: 12 km/h");
assert(getVehicleSpeed("auto") === 20, "auto: 20 km/h");
assert(getVehicleSpeed("TRUCK") === 18, "TRUCK: 18 km/h");

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Shipment Types
// ═══════════════════════════════════════════════════════════════════════════════

section("Shipment Types — Definiciones");
assert(SHIPMENT_TYPES.HOT.maxDeliveryMinutes === 45, "HOT SLA: 45 min");
assert(SHIPMENT_TYPES.FRESH.maxDeliveryMinutes === 90, "FRESH SLA: 90 min");
assert(SHIPMENT_TYPES.STANDARD.maxDeliveryMinutes === 480, "STANDARD SLA: 480 min");
assert(SHIPMENT_TYPES.HOT.requiresThermalBag === true, "HOT requiere bolsa térmica");
assert(SHIPMENT_TYPES.FRESH.requiresColdChain === true, "FRESH requiere cadena de frío");
assert(SHIPMENT_TYPES.HOT.priorityWeight === 100, "HOT prioridad: 100");
assert(SHIPMENT_TYPES.FRESH.surchargeArs === 200, "FRESH recargo: $200");

section("Shipment Types — getShipmentType");
assert(getShipmentType("HOT").code === "HOT", "getShipmentType('HOT') funciona");
assert(getShipmentType("hot").code === "HOT", "getShipmentType('hot') normaliza");
assert(getShipmentType(null).code === "STANDARD", "null → STANDARD");
assert(getShipmentType("INEXISTENTE").code === "STANDARD", "desconocido → STANDARD");

section("Shipment Types — Auto-detección");
assert(autoDetectShipmentType({ merchantCategoryName: "Gastronomía", productNames: ["Pizza"] }) === "HOT", "Gastronomía → HOT");
assert(autoDetectShipmentType({ merchantCategoryName: "Restaurante", productNames: ["Burger"] }) === "HOT", "Restaurante → HOT");
assert(autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Helado artesanal"] }) === "FRESH", "Helado → FRESH");
assert(autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Jarrón de vidrio"] }) === "FRAGILE", "Vidrio → FRAGILE");
assert(autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Sobre carta", "Factura"] }) === "DOCUMENT", "Documentos → DOCUMENT");
assert(autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["Remera"] }) === "STANDARD", "Ropa → STANDARD");
assert(autoDetectShipmentType({ merchantCategoryName: "Tienda", productNames: ["X"], manualOverride: "FRAGILE" }) === "FRAGILE", "Override manual");

section("Shipment Types — Vehículos compatibles");
assert(isVehicleCompatibleWithShipment("CAR", "HOT") === true, "CAR + HOT ✅");
assert(isVehicleCompatibleWithShipment("TRUCK", "HOT") === false, "TRUCK + HOT ❌");
assert(isVehicleCompatibleWithShipment("BIKE", "FRAGILE") === false, "BIKE + FRAGILE ❌");

const hotV = getCompatibleVehicles(["BIKE", "MOTO", "CAR", "TRUCK"], "HOT");
assert(!hotV.includes("TRUCK"), "HOT filtra TRUCK de allowed vehicles");
assert(hotV.includes("MOTO"), "HOT permite MOTO");

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Shipping Cost
// ═══════════════════════════════════════════════════════════════════════════════

// Shipping Cost — ELIMINADO en fix/biblia-motor-envio-y-comisiones (motor único
// calculateDeliveryCost/computeDeliveryFee en delivery.ts).

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Order Priority
// ═══════════════════════════════════════════════════════════════════════════════

section("Order Priority");
const hp = calculateOrderPriority({ id: "h1", createdAt: new Date(Date.now() - 5*60000), shipmentTypeCode: "HOT", assignmentAttempts: 0 });
assert(hp.breakdown.shipmentTypePriority === 100, "HOT priority: 100");
assert(hp.priority === 110, "HOT 5min: priority 110");

const sp = calculateOrderPriority({ id: "s1", createdAt: new Date(Date.now() - 5*60000), shipmentTypeCode: "STANDARD", assignmentAttempts: 0 });
assert(sp.priority === 10, "STANDARD 5min: priority 10");

const sorted = prioritizeOrders([
  { id: "std", createdAt: new Date(Date.now() - 10*60000), shipmentTypeCode: "STANDARD", assignmentAttempts: 0 },
  { id: "hot", createdAt: new Date(Date.now() - 2*60000), shipmentTypeCode: "HOT", assignmentAttempts: 0 },
  { id: "fresh", createdAt: new Date(Date.now() - 5*60000), shipmentTypeCode: "FRESH", assignmentAttempts: 0 },
]);
assert(sorted[0].orderId === "hot", "Cola: HOT primero");
assert(sorted[1].orderId === "fresh", "Cola: FRESH segundo");

section("Order Priority — SLA");
assert(isOrderExceedingSLA({ createdAt: new Date(Date.now() - 60*60000), shipmentTypeCode: "HOT" }).exceeding === true, "HOT 60min > 45min SLA");
assert(isOrderExceedingSLA({ createdAt: new Date(Date.now() - 60*60000), shipmentTypeCode: "STANDARD" }).exceeding === false, "STD 60min < 480min SLA");

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ETA Calculator
// ═══════════════════════════════════════════════════════════════════════════════

section("ETA Calculator");
const eta1 = calculateFullETA({ distanceDriverToMerchantKm: 1.5, distanceMerchantToCustomerKm: 3.0, vehicleType: "MOTO", merchantPrepTimeMin: 15, shipmentTypeCode: "HOT", hasDriverAssigned: true });
assert(eta1.totalMinutes > 0, `ETA HOT: ${eta1.totalMinutes} min`);
assert(eta1.slaMinutes === 45, "SLA HOT: 45 min");
assert(eta1.breakdown.driverWaitTime === 0, "Driver asignado: wait=0");

const eta2 = calculateFullETA({ distanceDriverToMerchantKm: 0, distanceMerchantToCustomerKm: 3.0, vehicleType: "MOTO", merchantPrepTimeMin: 15, shipmentTypeCode: "STANDARD", hasDriverAssigned: false });
assert(eta2.breakdown.driverWaitTime === 5, "Sin driver: wait=5 min");

const eta3 = calculateFullETA({ distanceDriverToMerchantKm: 10, distanceMerchantToCustomerKm: 15, vehicleType: "BIKE", merchantPrepTimeMin: 20, shipmentTypeCode: "HOT", hasDriverAssigned: true });
assert(eta3.exceedsSLA === true, `HOT lejano (${eta3.totalMinutes}min) excede SLA`);
assert(eta3.slaWarning != null, "Warning presente");

section("ETA — Normalización vehicleType");
const eb = calculateFullETA({ distanceDriverToMerchantKm: 2, distanceMerchantToCustomerKm: 3, vehicleType: "bicicleta", merchantPrepTimeMin: 10, shipmentTypeCode: "STANDARD", hasDriverAssigned: true });
const eB = calculateFullETA({ distanceDriverToMerchantKm: 2, distanceMerchantToCustomerKm: 3, vehicleType: "BIKE", merchantPrepTimeMin: 10, shipmentTypeCode: "STANDARD", hasDriverAssigned: true });
assert(eb.totalMinutes === eB.totalMinutes, `"bicicleta" = "BIKE": ${eb.totalMinutes}min`);

// ═══════════════════════════════════════════════════════════════════════════════
console.log(`\n${"═".repeat(60)}`);
console.log(`  RESULTADO: ${passed} pasaron, ${failed} fallaron`);
console.log(`${"═".repeat(60)}\n`);
if (failed > 0) process.exit(1);
