// Product Weight & Volume Resolver
// Rama: feat/peso-volumen-productos
//
// Fuente única para resolver peso/volumen de un Product en TODOS los flujos
// downstream (motor logístico, asignación de vehículo, costo del viaje).
//
// CASCADA de resolución (de más exacto a menos):
//   1. Si Product.weightGrams / volumeMl están seteados → usar esos.
//   2. Si Product.packageCategoryId existe → usar promedio del rango de la
//      PackageCategory (ej: MEDIUM 5-15kg → 10kg).
//   3. Fallback final: 500g + 1000ml (categoría SMALL conservadora).
//
// REGLA: nadie consume Product.weightGrams crudo. Todo pasa por resolveItemWeight()
// para que el fallback sea consistente y testeable.
//
// NOTA (feat/tamanos-producto-desde-ops): la sugerencia automática de peso
// (cache global + heurística + endpoint suggest-weight) se removió. Los tamaños
// que ve el comercio ahora se DERIVAN de la config de OPS (tabla PackageCategory)
// — ver src/lib/product-sizes.ts. Este archivo conserva la metadata cosmética
// (SIZE_METADATA) y los resolvers de peso downstream.

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ItemWithWeight {
  weightGrams: number;
  volumeMl: number;
  source: "EXPLICIT" | "CATEGORY" | "FALLBACK";
}

export interface ProductWeightInput {
  weightGrams: number | null;
  volumeMl: number | null;
  packageCategory?: {
    maxWeightGrams: number | null;
    name: string | null;
  } | null;
}

export interface CartItemWeightInput {
  product: ProductWeightInput | null;
  quantity: number;
}

export interface CartWeightSummary {
  totalGrams: number;
  totalMl: number;
  itemCount: number;
  /** True si TODOS los items tenían weightGrams/volumeMl explícitos */
  allExplicit: boolean;
}

// ─── Constantes de fallback ──────────────────────────────────────────────────

/**
 * Default conservador cuando no hay data alguna del producto.
 * Equivalente a una caja chica tipo SMALL. Pensado para que un cart de items
 * "anónimos" igual sume algo razonable y no se asignen a una bici.
 */
export const FALLBACK_WEIGHT_GRAMS = 500;
export const FALLBACK_VOLUME_ML = 1000;

/**
 * Tamaños de producto disponibles para el comerciante en el form.
 * Inspirado en Glovo/Cabify: el comercio NO tipea gramos, elige una categoría
 * visual con descripción y ejemplos. Cada categoría mapea internamente a
 * peso/volumen y vehículo recomendado mínimo.
 *
 * Las 5 categorías cubren el 99% de los casos:
 *   MICRO  — sobre/blister (alfajor, pastillas)
 *   SMALL  — bolsa de mandados (hamburguesa, gaseosa 1.5L)
 *   MEDIUM — caja de zapatos (pizza grande, kit de almacén)
 *   LARGE  — caja de TV chica (silla, set de herramientas)
 *   XL     — mueble grande / flete (sillón, colchón, electrodoméstico)
 *
 * Power-users pueden activar "Modo avanzado" en el form y tipear gramos
 * exactos (caso farmacia con productos de peso muy variable, marketplace
 * seller con catálogo heterogéneo).
 */
export type ProductSize = "MICRO" | "SMALL" | "MEDIUM" | "LARGE" | "XL";

export interface SizeMetadata {
  /** Identificador interno (matchea ProductSize) */
  size: ProductSize;
  /** Nombre corto para UI (ej: "Pequeño") */
  displayName: string;
  /** Descripción breve (ej: "Bolsa de mandados") */
  description: string;
  /** Ejemplos concretos para el comerciante (ej: "hamburguesa, gaseosa 1.5L") */
  examples: string;
  /** Rango de peso aproximado para el tooltip ("≤200g", "500g-2kg", etc) */
  weightRange: string;
  /** Peso unitario asumido cuando se elige esta categoría (gramos) */
  weightGrams: number;
  /** Volumen unitario asumido cuando se elige esta categoría (ml) */
  volumeMl: number;
  /** Vehículo recomendado mínimo */
  vehicle: "BIKE" | "MOTO" | "CAR" | "TRUCK";
  /** Nombre del icono de lucide-react a renderizar en la card */
  iconName: "Mail" | "ShoppingBag" | "Package" | "PackageOpen" | "Truck";
}

/**
 * Opción de tamaño que ve el comercio en el formulario, DERIVADA de la config
 * de OPS (tabla PackageCategory). A diferencia de SIZE_METADATA — que es
 * cosmético + fallback hardcodeado —, estos valores (rango de peso, vehículo
 * mínimo, peso asumido) salen de la DB. El helper que la arma vive en
 * src/lib/product-sizes.ts (server, usa prisma). El TIPO vive acá para que los
 * componentes cliente (SizeSelector, NewProductForm) lo importen sin arrastrar
 * prisma al bundle.
 */
export interface MerchantSizeOption {
  /** name de la PackageCategory (MICRO, SMALL, … o una custom de OPS) */
  size: string;
  displayName: string;
  description: string;
  examples: string;
  iconName: "Mail" | "ShoppingBag" | "Package" | "PackageOpen" | "Truck";
  /** Rango de peso legible, derivado de maxWeightGrams de OPS (ej: "Hasta 2 kg") */
  weightRange: string;
  /** Peso unitario asumido al elegir esta categoría (deriva del rango de OPS) */
  assumedWeightGrams: number;
  /** Volumen unitario asumido */
  assumedVolumeMl: number;
  /** Vehículo mínimo permitido por OPS para esta categoría ("Bici", "Moto"…) */
  vehicleLabel: string;
}

/**
 * Metadata cosmética + fallback de las 5 categorías estándar. Ya NO es la fuente
 * de verdad de peso/vehículo (eso ahora vive en OPS/PackageCategory). Se usa
 * para: (a) los ejemplos/ícono/nombre que muestra el form, keyados por name;
 * (b) fallback de los resolvers de peso downstream cuando no hay category.
 */
export const SIZE_METADATA: Record<ProductSize, SizeMetadata> = {
  MICRO: {
    size: "MICRO",
    displayName: "Sobre o Blister",
    description: "Cabe en un bolsillo",
    examples: "Alfajor, blister de pastillas, llaves, papel",
    weightRange: "Hasta 200g",
    weightGrams: 200,
    volumeMl: 300,
    vehicle: "BIKE",
    iconName: "Mail",
  },
  SMALL: {
    size: "SMALL",
    displayName: "Pequeño",
    description: "Bolsa de mandados",
    examples: "Hamburguesa, gaseosa 1.5L, libro, pack de cervezas",
    weightRange: "200g a 2kg",
    weightGrams: 1500,
    volumeMl: 2500,
    vehicle: "BIKE",
    iconName: "ShoppingBag",
  },
  MEDIUM: {
    size: "MEDIUM",
    displayName: "Mediano",
    description: "Caja de zapatos",
    examples: "Pizza grande, kit almacén, pollo entero, ropa",
    weightRange: "2kg a 15kg",
    weightGrams: 7000,
    volumeMl: 10000,
    vehicle: "MOTO",
    iconName: "Package",
  },
  LARGE: {
    size: "LARGE",
    displayName: "Grande",
    description: "Caja de TV chica",
    examples: "Silla, set de herramientas, electrodoméstico chico",
    weightRange: "15kg a 30kg",
    weightGrams: 20000,
    volumeMl: 30000,
    vehicle: "CAR",
    iconName: "PackageOpen",
  },
  XL: {
    size: "XL",
    displayName: "Extra grande / Flete",
    description: "Mueble grande",
    examples: "Sillón, colchón, heladera, mesa de comedor",
    weightRange: "Más de 30kg",
    weightGrams: 50000,
    volumeMl: 80000,
    vehicle: "TRUCK",
    iconName: "Truck",
  },
};

/**
 * Lista ordenada para iterar en la UI (orden visual del selector).
 */
export const SIZE_ORDER: ProductSize[] = ["MICRO", "SMALL", "MEDIUM", "LARGE", "XL"];

/**
 * Devuelve metadata de una categoría. Si el size no existe, devuelve SMALL
 * como fallback conservador (no rompe el flow).
 */
export function getSizeMetadata(size: string | null | undefined): SizeMetadata {
  if (!size) return SIZE_METADATA.SMALL;
  return SIZE_METADATA[size as ProductSize] ?? SIZE_METADATA.SMALL;
}

/**
 * Mapea un peso en gramos a la categoría que mejor lo represente.
 * Útil para sugerir categoría cuando el cache/heurística devuelve gramos.
 */
export function getSizeFromWeight(weightGrams: number): ProductSize {
  if (weightGrams <= 500) return "MICRO";
  if (weightGrams <= 2000) return "SMALL";
  if (weightGrams <= 15000) return "MEDIUM";
  if (weightGrams <= 30000) return "LARGE";
  return "XL";
}

/**
 * Defaults legacy por nombre de PackageCategory de DB. Se mantiene para
 * retrocompatibilidad con productos seedeados desde imports masivos OPS y
 * Listings de marketplace que cargan PackageCategory directo.
 *
 * Volúmenes derivados como aproximación cúbica del peso.
 */
const CATEGORY_DEFAULTS: Record<string, { weightGrams: number; volumeMl: number }> = {
  MICRO: { weightGrams: 200, volumeMl: 300 },
  SMALL: { weightGrams: 1500, volumeMl: 2500 },
  MEDIUM: { weightGrams: 7000, volumeMl: 10000 },
  LARGE: { weightGrams: 20000, volumeMl: 30000 },
  XL: { weightGrams: 50000, volumeMl: 80000 },
  FLETE: { weightGrams: 100000, volumeMl: 150000 },
};

// ─── Resolución de peso unitario ─────────────────────────────────────────────

/**
 * Resuelve el peso/volumen unitario de un producto siguiendo la cascada
 * canónica. NUNCA devuelve null — el fallback final garantiza un número.
 *
 * Esta es la función que TODO el motor logístico debe consumir cuando necesita
 * saber "cuánto pesa una unidad de este producto". No leer Product.weightGrams
 * directamente.
 */
export function resolveItemWeight(product: ProductWeightInput | null): ItemWithWeight {
  // Caso 1: producto null (item anónimo, no debería pasar pero defensivo)
  if (!product) {
    return {
      weightGrams: FALLBACK_WEIGHT_GRAMS,
      volumeMl: FALLBACK_VOLUME_ML,
      source: "FALLBACK",
    };
  }

  // Caso 2: campos explícitos (vía form del comercio o seed)
  if (product.weightGrams !== null && product.volumeMl !== null) {
    return {
      weightGrams: product.weightGrams,
      volumeMl: product.volumeMl,
      source: "EXPLICIT",
    };
  }

  // Caso 3: hereda de packageCategory por nombre
  if (product.packageCategory?.name) {
    const def = CATEGORY_DEFAULTS[product.packageCategory.name.toUpperCase()];
    if (def) {
      return {
        weightGrams: product.weightGrams ?? def.weightGrams,
        volumeMl: product.volumeMl ?? def.volumeMl,
        source: "CATEGORY",
      };
    }
  }

  // Caso 4: si la category trae maxWeightGrams pero no tiene name conocido,
  // usar la mitad del max como heurística (rango medio)
  if (product.packageCategory?.maxWeightGrams) {
    return {
      weightGrams: product.weightGrams ?? Math.round(product.packageCategory.maxWeightGrams / 2),
      volumeMl: product.volumeMl ?? FALLBACK_VOLUME_ML,
      source: "CATEGORY",
    };
  }

  // Caso 5: fallback final
  return {
    weightGrams: FALLBACK_WEIGHT_GRAMS,
    volumeMl: FALLBACK_VOLUME_ML,
    source: "FALLBACK",
  };
}

/**
 * Suma peso/volumen total de un carrito de items.
 * Usado por el motor logístico para elegir vehículo y calcular costo del viaje.
 *
 * Ejemplo: 20 cocas de 1.5L → totalGrams = 20 × 1500 = 30.000g (30kg) → vehículo
 * mínimo es Auto chico, no bici.
 */
export function resolveCartWeight(items: CartItemWeightInput[]): CartWeightSummary {
  let totalGrams = 0;
  let totalMl = 0;
  let itemCount = 0;
  let allExplicit = items.length > 0;

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const resolved = resolveItemWeight(item.product);
    totalGrams += resolved.weightGrams * item.quantity;
    totalMl += resolved.volumeMl * item.quantity;
    itemCount += item.quantity;
    if (resolved.source !== "EXPLICIT") allExplicit = false;
  }

  return { totalGrams, totalMl, itemCount, allExplicit };
}
