/**
 * Simulación / verificación del motor de envío ADITIVO (Plan Maestro v1).
 *
 * Corre la fórmula REAL (calculateDeliveryCost) con los valores por vehículo del
 * Plan Maestro y verifica los invariantes financieros. No toca la DB — prueba la
 * función pura del motor.
 *
 * Ejecutar:  npx tsx scripts/simular-envios.ts
 *
 * Verifica:
 *   1. Los números dan EXACTO al Plan Maestro (moto 3km zona A = $2.190).
 *   2. El cliente paga = costo del viaje (sin operativo).
 *   3. El repartidor cobra el 80% del viaje; Moovy el 20%.
 *   4. Moovy NUNCA queda negativo en pedidos normales (incluida zona C).
 *   5. En envío gratis, el cliente paga $0 PERO el repartidor cobra igual.
 *   6. El operativo quedó en 0 (eliminado).
 */
import { calculateDeliveryCost, DeliverySettings } from "../src/lib/delivery";

type Veh = { nombre: string; base: number; perKm: number };
const VEHICULOS: Veh[] = [
  { nombre: "Bici (MICRO/SMALL)", base: 1600, perKm: 90 },
  { nombre: "Moto (MEDIUM)", base: 1800, perKm: 130 },
  { nombre: "Auto (LARGE)", base: 2600, perKm: 190 },
  { nombre: "Pickup (XL)", base: 6500, perKm: 300 },
  { nombre: "Flete (fallback)", base: 18000, perKm: 450 },
];

const ZONAS: Record<string, number> = { A: 1.0, B: 1.15, C: 1.35 };
const DISTANCIAS = [1, 3, 5, 10, 15];
const RIDER_SHARE = 80;

function settingsFor(v: Veh, zona: number, freeMin: number | null): DeliverySettings {
  return {
    baseDeliveryFee: v.base,
    freeDeliveryMinimum: freeMin,
    maxDeliveryDistance: 15,
    zoneMultiplier: zona,
    climateMultiplier: 1.0,
    demandMultiplier: 1.0,
    riderSharePercent: RIDER_SHARE,
    rate: { pricePerKmArs: v.perKm, minVehicleFee: v.base, consumptionPerKm: 0 },
  };
}

const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
let fallos = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) { fallos++; console.log("  ❌ " + msg); }
};

// ── 1. Tabla de precios (zona A) ─────────────────────────────────────────────
console.log("\n=== PRECIO AL CLIENTE por vehículo y distancia (zona A) ===");
console.log(
  "Vehículo".padEnd(20) + DISTANCIAS.map((d) => (d + "km").padStart(10)).join("")
);
for (const v of VEHICULOS) {
  let row = v.nombre.padEnd(20);
  for (const d of DISTANCIAS) {
    const r = calculateDeliveryCost(d, settingsFor(v, 1.0, null), 20000);
    row += money(r.totalCost).padStart(10);
  }
  console.log(row);
}

// ── 2. Invariantes financieros (todos los vehículos × distancias × zonas) ────
console.log("\n=== VERIFICACIÓN DE INVARIANTES ===");
for (const v of VEHICULOS) {
  for (const [, zona] of Object.entries(ZONAS)) {
    for (const d of DISTANCIAS) {
      const r = calculateDeliveryCost(d, settingsFor(v, zona, null), 20000);
      const esperadoTrip = Math.round((v.base + v.perKm * d) * zona);
      check(r.tripCost === esperadoTrip, `${v.nombre} ${d}km z${zona}: tripCost ${r.tripCost} != ${esperadoTrip}`);
      check(r.totalCost === r.tripCost, `${v.nombre} ${d}km z${zona}: cliente paga != viaje (op debería ser 0)`);
      check(r.operationalCost === 0, `${v.nombre} ${d}km z${zona}: operativo != 0`);
      // fix/driver-payout-centavos: el 80% del rider ahora se redondea a CENTAVOS
      // (regla PAGOS), no a pesos enteros. El invariante correcto es exactitud
      // al centavo contra el 80% matemático.
      check(r.riderEarnings === Math.round(r.tripCost * 0.8 * 100) / 100, `${v.nombre} ${d}km z${zona}: repartidor != 80%`);
      check(Math.abs(r.moovyDeliveryEarnings - (r.totalCost - r.riderEarnings)) < 0.01, `${v.nombre} ${d}km z${zona}: Moovy != total - repartidor`);
      check(r.moovyDeliveryEarnings >= 0, `${v.nombre} ${d}km z${zona}: Moovy NEGATIVO (${r.moovyDeliveryEarnings})`);
    }
  }
}

// ── 3. Chequeo puntual: Plan Maestro ─────────────────────────────────────────
const moto3 = calculateDeliveryCost(3, settingsFor(VEHICULOS[1], 1.0, null), 20000);
check(moto3.totalCost === 2190, `Plan Maestro: moto 3km debe ser $2.190, dio ${money(moto3.totalCost)}`);
check(moto3.riderEarnings === 1752, `Plan Maestro: repartidor moto 3km debe ser $1.752, dio ${money(moto3.riderEarnings)}`);

// ── 4. Envío gratis: cliente $0, repartidor cobra igual ──────────────────────
console.log("\n=== ENVÍO GRATIS (controlado por Moovy) ===");
const free = calculateDeliveryCost(3, settingsFor(VEHICULOS[1], 1.0, 5000), 20000); // freeMin 5000, pedido 20000
console.log(`  Moto 3km, envío gratis → cliente paga ${money(free.totalCost)}, repartidor cobra ${money(free.riderEarnings)}, Moovy ${money(free.moovyDeliveryEarnings)}`);
check(free.isFreeDelivery === true, "envío gratis: isFreeDelivery debería ser true");
check(free.totalCost === 0, "envío gratis: el cliente debería pagar $0");
check(free.riderEarnings > 0, "envío gratis: el REPARTIDOR debería cobrar igual (no $0)");
check(free.moovyDeliveryEarnings < 0, "envío gratis: Moovy debería absorber el costo (negativo)");

// ── Resultado ────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(50));
if (fallos === 0) {
  console.log("✅ TODOS los invariantes OK. Motor de envío verificado.");
  process.exit(0);
} else {
  console.log(`❌ ${fallos} chequeo(s) fallaron. Revisar antes de cerrar la rama.`);
  process.exit(1);
}
