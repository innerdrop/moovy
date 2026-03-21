/**
 * Shipment Types — Clasificación por naturaleza del envío
 *
 * Complementa el sistema de PackageCategory (tamaño MICRO→XL) con
 * la naturaleza del producto: HOT, FRESH, FRAGILE, STANDARD, DOCUMENT.
 *
 * Cada tipo define SLA máximo, requerimientos de equipamiento,
 * prioridad de asignación y recargos.
 *
 * NOTA: Hasta que se cree el modelo ShipmentType en Prisma,
 * estos valores viven como constantes en código. Ver CAMBIOS_COMPARTIDOS_LOGISTICS.md.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ShipmentTypeDefinition {
  code: ShipmentTypeCode;
  name: string;
  description: string;
  maxDeliveryMinutes: number;
  requiresThermalBag: boolean;
  requiresColdChain: boolean;
  requiresCarefulHandle: boolean;
  priorityWeight: number; // Mayor = más urgente en la cola
  surchargeArs: number;
  allowedVehicles: string[]; // Vehículos que pueden transportar este tipo
  icon: string;
}

export type ShipmentTypeCode = "HOT" | "FRESH" | "FRAGILE" | "STANDARD" | "DOCUMENT";

// ─── Definiciones ───────────────────────────────────────────────────────────────

export const SHIPMENT_TYPES: Record<ShipmentTypeCode, ShipmentTypeDefinition> = {
  HOT: {
    code: "HOT",
    name: "Comida caliente",
    description: "Alimentos preparados que deben entregarse calientes",
    maxDeliveryMinutes: 45,
    requiresThermalBag: true,
    requiresColdChain: false,
    requiresCarefulHandle: false,
    priorityWeight: 100,
    surchargeArs: 0, // Incluido en tarifa base
    allowedVehicles: ["BIKE", "MOTO", "CAR"], // TRUCK no es apropiado
    icon: "🔥",
  },
  FRESH: {
    code: "FRESH",
    name: "Perecedero / Refrigerado",
    description: "Productos que requieren cadena de frío o manipulación rápida",
    maxDeliveryMinutes: 90,
    requiresThermalBag: false,
    requiresColdChain: true,
    requiresCarefulHandle: false,
    priorityWeight: 80,
    surchargeArs: 200,
    allowedVehicles: ["MOTO", "CAR", "TRUCK"], // BIKE no puede mantener frío
    icon: "❄️",
  },
  FRAGILE: {
    code: "FRAGILE",
    name: "Frágil",
    description: "Productos que requieren manipulación cuidadosa",
    maxDeliveryMinutes: 480,
    requiresThermalBag: false,
    requiresColdChain: false,
    requiresCarefulHandle: true,
    priorityWeight: 30,
    surchargeArs: 150,
    allowedVehicles: ["CAR", "TRUCK"], // BIKE/MOTO no aptos para frágil
    icon: "⚠️",
  },
  STANDARD: {
    code: "STANDARD",
    name: "Estándar",
    description: "Paquetería general sin requisitos especiales",
    maxDeliveryMinutes: 480,
    requiresThermalBag: false,
    requiresColdChain: false,
    requiresCarefulHandle: false,
    priorityWeight: 0,
    surchargeArs: 0,
    allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"],
    icon: "📦",
  },
  DOCUMENT: {
    code: "DOCUMENT",
    name: "Documento / Sobre",
    description: "Documentos, sobres y papelería",
    maxDeliveryMinutes: 240,
    requiresThermalBag: false,
    requiresColdChain: false,
    requiresCarefulHandle: false,
    priorityWeight: 10,
    surchargeArs: 0,
    allowedVehicles: ["BIKE", "MOTO", "CAR"],
    icon: "📄",
  },
};

// Lista ordenada por prioridad (para UI y selección)
export const SHIPMENT_TYPE_LIST: ShipmentTypeDefinition[] = Object.values(SHIPMENT_TYPES).sort(
  (a, b) => b.priorityWeight - a.priorityWeight
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Obtiene un ShipmentType por código. Retorna STANDARD si no existe.
 */
export function getShipmentType(code: string | null | undefined): ShipmentTypeDefinition {
  if (!code) return SHIPMENT_TYPES.STANDARD;
  const upper = code.toUpperCase() as ShipmentTypeCode;
  return SHIPMENT_TYPES[upper] ?? SHIPMENT_TYPES.STANDARD;
}

/**
 * Verifica si un vehículo es compatible con un tipo de envío.
 * Combina restricciones del ShipmentType con las del PackageCategory.
 */
export function isVehicleCompatibleWithShipment(
  vehicleType: string,
  shipmentTypeCode: string
): boolean {
  const shipment = getShipmentType(shipmentTypeCode);
  return shipment.allowedVehicles.includes(vehicleType.toUpperCase());
}

/**
 * Filtra vehículos permitidos combinando PackageCategory + ShipmentType.
 * Retorna la intersección de ambas listas (el conjunto más restrictivo).
 */
export function getCompatibleVehicles(
  packageCategoryVehicles: string[],
  shipmentTypeCode: string
): string[] {
  const shipment = getShipmentType(shipmentTypeCode);
  const shipmentSet = new Set(shipment.allowedVehicles);
  return packageCategoryVehicles.filter((v) => shipmentSet.has(v));
}

/**
 * Verifica si un driver tiene el equipamiento requerido para un tipo de envío.
 * Recibe los flags del driver (cuando existan en el modelo).
 */
export function driverMeetsEquipmentRequirements(
  shipmentTypeCode: string,
  driverEquipment: {
    hasThermalBag?: boolean;
    hasColdStorage?: boolean;
  }
): boolean {
  const shipment = getShipmentType(shipmentTypeCode);

  if (shipment.requiresThermalBag && !driverEquipment.hasThermalBag) {
    return false;
  }
  if (shipment.requiresColdChain && !driverEquipment.hasColdStorage) {
    return false;
  }

  return true;
}

// ─── Categorías de comercio → ShipmentType auto-detection ───────────────────────

/** Palabras clave en la categoría del merchant que indican comida caliente */
const HOT_CATEGORY_KEYWORDS = [
  "gastronomía",
  "gastronomia",
  "comida",
  "restaurant",
  "restaurante",
  "pizzería",
  "pizzeria",
  "hamburguesas",
  "burger",
  "sushi",
  "empanadas",
  "parrilla",
  "cocina",
  "fast food",
  "comida rápida",
  "comida rapida",
  "cafetería",
  "cafeteria",
  "heladería",
  "heladeria",
  "rotisería",
  "rotiseria",
  "delivery de comida",
];

/** Palabras clave en productos que indican perecedero/refrigerado */
const FRESH_PRODUCT_KEYWORDS = [
  "perecedero",
  "refrigerado",
  "congelado",
  "fresco",
  "lácteo",
  "lacteo",
  "carne",
  "pescado",
  "helado",
  "frozen",
];

/** Palabras clave en productos que indican frágil */
const FRAGILE_PRODUCT_KEYWORDS = [
  "frágil",
  "fragil",
  "vidrio",
  "cristal",
  "cerámica",
  "ceramica",
  "porcelana",
  "electrónico",
  "electronico",
  "monitor",
  "pantalla",
  "espejo",
];

/** Palabras clave para documentos */
const DOCUMENT_PRODUCT_KEYWORDS = [
  "documento",
  "sobre",
  "carta",
  "factura",
  "contrato",
  "papelería",
  "papeleria",
];

/**
 * Auto-detecta el ShipmentType basado en la categoría del merchant y los nombres de los productos.
 *
 * Reglas de prioridad:
 * 1. Si el merchant es de categoría gastronómica → HOT
 * 2. Si algún producto tiene keywords de perecedero → FRESH
 * 3. Si algún producto tiene keywords de frágil → FRAGILE
 * 4. Si todos los items son documentos → DOCUMENT
 * 5. Default → STANDARD
 *
 * El comercio puede hacer override manual al preparar el pedido.
 */
export function autoDetectShipmentType(params: {
  merchantCategoryName?: string | null;
  productNames: string[];
  /** Override manual del comercio (si existe) */
  manualOverride?: ShipmentTypeCode | null;
}): ShipmentTypeCode {
  // Override manual tiene prioridad absoluta
  if (params.manualOverride && SHIPMENT_TYPES[params.manualOverride]) {
    return params.manualOverride;
  }

  const merchantCategory = (params.merchantCategoryName || "").toLowerCase();
  const productNamesLower = params.productNames.map((n) => n.toLowerCase());

  // 1. Merchant de categoría gastronómica → HOT
  if (HOT_CATEGORY_KEYWORDS.some((kw) => merchantCategory.includes(kw))) {
    return "HOT";
  }

  // 2. Algún producto perecedero → FRESH
  if (
    productNamesLower.some((name) =>
      FRESH_PRODUCT_KEYWORDS.some((kw) => name.includes(kw))
    )
  ) {
    return "FRESH";
  }

  // 3. Algún producto frágil → FRAGILE
  if (
    productNamesLower.some((name) =>
      FRAGILE_PRODUCT_KEYWORDS.some((kw) => name.includes(kw))
    )
  ) {
    return "FRAGILE";
  }

  // 4. Todos los productos son documentos → DOCUMENT
  if (
    productNamesLower.length > 0 &&
    productNamesLower.every((name) =>
      DOCUMENT_PRODUCT_KEYWORDS.some((kw) => name.includes(kw))
    )
  ) {
    return "DOCUMENT";
  }

  // 5. Default
  return "STANDARD";
}

/**
 * Obtiene el SLA label para mostrar al comprador.
 * Ej: "Entrega en 30-45 min" para HOT, "Entrega mismo día" para STANDARD
 */
export function getShipmentSLALabel(code: ShipmentTypeCode): string {
  const type = SHIPMENT_TYPES[code];
  if (type.maxDeliveryMinutes <= 60) {
    return `Entrega en ${type.maxDeliveryMinutes} min máx.`;
  }
  if (type.maxDeliveryMinutes <= 240) {
    return `Entrega en ${Math.round(type.maxDeliveryMinutes / 60)} horas máx.`;
  }
  return "Entrega en el día";
}
