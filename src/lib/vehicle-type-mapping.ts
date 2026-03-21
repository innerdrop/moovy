/**
 * Vehicle Type Mapping — Normalización de tipos de vehículo
 *
 * Resuelve la inconsistencia P0 entre:
 * - Registro de driver: guarda "bicicleta", "moto", "auto", "camioneta" (español minúscula)
 * - Assignment engine: consulta por "BIKE", "MOTO", "CAR", "TRUCK" (enum mayúscula)
 * - PackageCategory.allowedVehicles: usa el enum ["BIKE", "MOTO", "CAR", "TRUCK"]
 *
 * Este módulo normaliza en ambas direcciones para que el matching funcione
 * independientemente de cómo esté guardado el vehicleType del driver.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

/** Enum canónico usado por el assignment engine y PackageCategory */
export type VehicleTypeEnum = "BIKE" | "MOTO" | "CAR" | "TRUCK";

/** Valores en español que guarda el registro de drivers */
export type VehicleTypeSpanish = "bicicleta" | "moto" | "auto" | "camioneta";

// ─── Mapeos ─────────────────────────────────────────────────────────────────────

/**
 * Mapeo español → enum canónico.
 * Case-insensitive: se normaliza a minúsculas antes de buscar.
 */
const SPANISH_TO_ENUM: Record<string, VehicleTypeEnum> = {
  bicicleta: "BIKE",
  bici: "BIKE",
  moto: "MOTO",
  motocicleta: "MOTO",
  auto: "CAR",
  automóvil: "CAR",
  automovil: "CAR",
  coche: "CAR",
  camioneta: "TRUCK",
  camión: "TRUCK",
  camion: "TRUCK",
  furgoneta: "TRUCK",
  furgón: "TRUCK",
  furgon: "TRUCK",
};

/**
 * Mapeo enum → español para display.
 */
const ENUM_TO_SPANISH: Record<VehicleTypeEnum, VehicleTypeSpanish> = {
  BIKE: "bicicleta",
  MOTO: "moto",
  CAR: "auto",
  TRUCK: "camioneta",
};

/**
 * Enum values válidos (para validación rápida).
 */
const VALID_ENUMS = new Set<string>(["BIKE", "MOTO", "CAR", "TRUCK"]);

// ─── Funciones principales ──────────────────────────────────────────────────────

/**
 * Normaliza un vehicleType a su enum canónico.
 *
 * Acepta tanto el enum ("BIKE", "MOTO") como el español ("bicicleta", "moto")
 * y variantes con capitalización distinta ("Bicicleta", "BICICLETA").
 *
 * Retorna el enum canónico o null si no se reconoce.
 *
 * @example
 * normalizeVehicleType("bicicleta")  // "BIKE"
 * normalizeVehicleType("BIKE")       // "BIKE"
 * normalizeVehicleType("Moto")       // "MOTO"
 * normalizeVehicleType("BICICLETA")  // "BIKE"
 * normalizeVehicleType(null)         // null
 */
export function normalizeVehicleType(vehicleType: string | null | undefined): VehicleTypeEnum | null {
  if (!vehicleType) return null;

  const upper = vehicleType.toUpperCase();
  const lower = vehicleType.toLowerCase();

  // Primero: ¿ya es un enum válido?
  if (VALID_ENUMS.has(upper)) {
    return upper as VehicleTypeEnum;
  }

  // Segundo: buscar en el mapeo español
  const mapped = SPANISH_TO_ENUM[lower];
  if (mapped) return mapped;

  // Tercero: intentar match parcial para capitalización rara (ej: "BICICLETA")
  const mappedUpper = SPANISH_TO_ENUM[lower];
  if (mappedUpper) return mappedUpper;

  console.warn(`[VehicleTypeMapping] Tipo de vehículo no reconocido: "${vehicleType}"`);
  return null;
}

/**
 * Normaliza a enum canónico con fallback a MOTO (para queries donde se necesita un valor).
 */
export function normalizeVehicleTypeOrDefault(
  vehicleType: string | null | undefined,
  defaultType: VehicleTypeEnum = "MOTO"
): VehicleTypeEnum {
  return normalizeVehicleType(vehicleType) ?? defaultType;
}

/**
 * Convierte un enum canónico a su nombre en español para mostrar en la UI.
 *
 * @example
 * vehicleTypeToSpanish("BIKE")  // "bicicleta"
 * vehicleTypeToSpanish("MOTO")  // "moto"
 */
export function vehicleTypeToSpanish(vehicleType: string): VehicleTypeSpanish {
  const normalized = normalizeVehicleType(vehicleType);
  if (normalized) return ENUM_TO_SPANISH[normalized];
  return "moto"; // fallback
}

/**
 * Obtiene el ícono del vehículo.
 */
export function vehicleTypeIcon(vehicleType: string): string {
  const normalized = normalizeVehicleType(vehicleType);
  const icons: Record<VehicleTypeEnum, string> = {
    BIKE: "🚲",
    MOTO: "🏍️",
    CAR: "🚗",
    TRUCK: "🚙",
  };
  return normalized ? icons[normalized] : "🏍️";
}

/**
 * Normaliza un array de vehicleTypes (típico de PackageCategory.allowedVehicles).
 * Elimina duplicados y valores no reconocidos.
 */
export function normalizeVehicleTypes(types: string[]): VehicleTypeEnum[] {
  const normalized = new Set<VehicleTypeEnum>();
  for (const t of types) {
    const n = normalizeVehicleType(t);
    if (n) normalized.add(n);
  }
  return Array.from(normalized);
}

/**
 * Verifica si el vehicleType de un driver matchea con alguno de los permitidos.
 * Normaliza ambos lados antes de comparar.
 *
 * @example
 * vehicleTypeMatches("bicicleta", ["BIKE", "MOTO"])  // true
 * vehicleTypeMatches("auto", ["BIKE", "MOTO"])        // false
 */
export function vehicleTypeMatches(
  driverVehicleType: string | null | undefined,
  allowedVehicles: string[]
): boolean {
  const normalizedDriver = normalizeVehicleType(driverVehicleType);
  if (!normalizedDriver) return false;

  const normalizedAllowed = normalizeVehicleTypes(allowedVehicles);
  return normalizedAllowed.includes(normalizedDriver);
}

/**
 * Velocidades promedio por tipo de vehículo en km/h (zona urbana).
 * Centralizadas aquí en vez de hardcodeadas en geo.ts.
 */
export const VEHICLE_SPEEDS: Record<VehicleTypeEnum, number> = {
  MOTO: 25,
  CAR: 20,
  BIKE: 12,
  TRUCK: 18,
};

/**
 * Obtiene la velocidad promedio para un vehicleType (normalizado).
 * Fallback a MOTO (25 km/h) si no se reconoce.
 */
export function getVehicleSpeed(vehicleType: string | null | undefined): number {
  const normalized = normalizeVehicleType(vehicleType);
  if (normalized) return VEHICLE_SPEEDS[normalized];
  return VEHICLE_SPEEDS.MOTO;
}
