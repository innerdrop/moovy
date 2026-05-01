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
// HEURÍSTICA por keywords (applyHeuristic): se usa SOLO cuando el cache no tiene
// match y el flag de IA está apagado. Reconoce patrones argentinos comunes:
// "1.5L", "500ml", "1kg", "pack x6", etc. NO es la fuente principal — es fallback.
//
// HASHING: el cache se indexa por sha256 del nombre normalizado (lowercase + trim
// + collapse de espacios + sin tildes). Esto permite que "Coca Cola 1.5L" y
// "  COCA  COLA  1.5L  " hagan match al mismo entry.

import { createHash } from "crypto";

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

export interface HeuristicSuggestion {
  weightGrams: number;
  volumeMl: number;
  confidence: number; // 0-100
  matchedPatterns: string[];
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
 * Metadata canónica de las 5 categorías. Esta es LA fuente de verdad — el
 * form, el endpoint, el cache y el motor logístico la consumen.
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

// ─── Normalización + hashing ─────────────────────────────────────────────────

/**
 * Normaliza el nombre del producto para hashing del cache.
 * Lowercase, trim, colapsa espacios múltiples, remueve tildes/diacríticos,
 * remueve puntuación común. NO recorta unidades — "coca cola 1.5l" y
 * "coca cola 2l" son entradas distintas adrede.
 */
export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[.,;:!?"'`()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Hash sha256 del nombre normalizado. Es la clave de búsqueda en
 * ProductWeightCache.nameHash.
 */
export function hashProductName(name: string): string {
  const normalized = normalizeProductName(name);
  return createHash("sha256").update(normalized).digest("hex");
}

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

// ─── Heurística por keywords (fallback cuando IA está OFF) ───────────────────

/**
 * Patrones de unidades con su factor de conversión a gramos/ml.
 * Orden importa: el primero que matchea gana.
 */
const UNIT_PATTERNS: Array<{
  regex: RegExp;
  toGrams: (n: number) => number;
  toMl: (n: number) => number;
  pattern: string;
}> = [
  // Litros: "1.5L", "1,5 l", "2 litros"
  {
    regex: /(\d+(?:[.,]\d+)?)\s*(?:l|lt|lts|litros?)\b/i,
    toGrams: (n) => Math.round(n * 1000),
    toMl: (n) => Math.round(n * 1000),
    pattern: "litros",
  },
  // Mililitros: "500ml", "750 ml"
  {
    regex: /(\d+(?:[.,]\d+)?)\s*ml\b/i,
    toGrams: (n) => Math.round(n),
    toMl: (n) => Math.round(n),
    pattern: "mililitros",
  },
  // Kilos: "1kg", "2.5 kilos", "3 kilo"
  {
    regex: /(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?)\b/i,
    toGrams: (n) => Math.round(n * 1000),
    toMl: (n) => Math.round(n * 1200), // sólidos: ~1.2× volumen
    pattern: "kilos",
  },
  // Gramos: "500g", "250 gr", "100 gramos"
  {
    regex: /(\d+(?:[.,]\d+)?)\s*(?:g|gr|grs|gramos?)\b/i,
    toGrams: (n) => Math.round(n),
    toMl: (n) => Math.round(n * 1.2),
    pattern: "gramos",
  },
];

/**
 * Detecta multiplicadores tipo "pack x6", "x12", "caja de 24".
 * Devuelve el factor (1 si no encuentra).
 */
function detectPackMultiplier(name: string): number {
  const xMatch = name.match(/\bx\s*(\d+)\b/i);
  if (xMatch) return parseInt(xMatch[1], 10);
  const cajaMatch = name.match(/\b(?:caja|pack|paquete|set)\s+(?:de\s+)?(\d+)\b/i);
  if (cajaMatch) return parseInt(cajaMatch[1], 10);
  return 1;
}

/**
 * Diccionario base de productos típicos sin medida en el nombre.
 * Pensado para Ushuaia: cubrir kioscos/restaurantes/farmacias comunes.
 * Cada entrada se matchea con includes() sobre el nombre normalizado.
 *
 * NO pretende ser exhaustivo. Es complemento de la heurística numérica.
 */
const KEYWORD_DICTIONARY: Array<{
  keyword: string;
  weightGrams: number;
  volumeMl: number;
  confidence: number;
}> = [
  // Comida
  { keyword: "hamburguesa", weightGrams: 350, volumeMl: 600, confidence: 70 },
  { keyword: "pizza", weightGrams: 800, volumeMl: 4000, confidence: 75 },
  { keyword: "empanada", weightGrams: 80, volumeMl: 150, confidence: 80 },
  { keyword: "sandwich", weightGrams: 250, volumeMl: 500, confidence: 70 },
  { keyword: "milanesa", weightGrams: 250, volumeMl: 400, confidence: 75 },
  { keyword: "alfajor", weightGrams: 80, volumeMl: 120, confidence: 85 },
  { keyword: "factura", weightGrams: 60, volumeMl: 100, confidence: 75 },
  // Bebidas (sin medida explícita)
  { keyword: "cafe", weightGrams: 250, volumeMl: 350, confidence: 65 },
  { keyword: "gaseosa", weightGrams: 1500, volumeMl: 1500, confidence: 60 },
  { keyword: "cerveza", weightGrams: 1000, volumeMl: 1000, confidence: 65 },
  // Farmacia
  { keyword: "blister", weightGrams: 30, volumeMl: 60, confidence: 80 },
  { keyword: "ibuprofeno", weightGrams: 30, volumeMl: 60, confidence: 75 },
  { keyword: "pastillas", weightGrams: 30, volumeMl: 60, confidence: 70 },
  { keyword: "jarabe", weightGrams: 250, volumeMl: 200, confidence: 75 },
  // Ferretería
  { keyword: "tornillo", weightGrams: 10, volumeMl: 20, confidence: 70 },
  { keyword: "clavo", weightGrams: 5, volumeMl: 10, confidence: 70 },
  { keyword: "martillo", weightGrams: 600, volumeMl: 800, confidence: 75 },
  { keyword: "destornillador", weightGrams: 200, volumeMl: 400, confidence: 75 },
  // Mueblería / hogar (peso alto)
  { keyword: "silla", weightGrams: 5000, volumeMl: 60000, confidence: 65 },
  { keyword: "mesa", weightGrams: 15000, volumeMl: 200000, confidence: 60 },
  { keyword: "sillon", weightGrams: 25000, volumeMl: 300000, confidence: 60 },
  { keyword: "colchon", weightGrams: 25000, volumeMl: 400000, confidence: 65 },
  // Indumentaria
  { keyword: "remera", weightGrams: 200, volumeMl: 1000, confidence: 75 },
  { keyword: "campera", weightGrams: 800, volumeMl: 5000, confidence: 70 },
  { keyword: "zapatilla", weightGrams: 700, volumeMl: 4000, confidence: 75 },
  // Electro
  { keyword: "auriculares", weightGrams: 250, volumeMl: 500, confidence: 75 },
  { keyword: "cable", weightGrams: 150, volumeMl: 400, confidence: 70 },
  { keyword: "cargador", weightGrams: 200, volumeMl: 300, confidence: 75 },
];

/**
 * Aplica heurística por keywords sobre el nombre del producto.
 * Devuelve null si NO encuentra ningún patrón con confianza razonable.
 *
 * Estrategia:
 *   1. Buscar unidades numéricas (litros, kilos, ml, g) → confidence 90.
 *   2. Si no, buscar keyword del diccionario → confidence variable.
 *   3. Multiplicar por pack si hay "x6", "caja de 12", etc.
 */
export function applyHeuristic(name: string, description?: string | null): HeuristicSuggestion | null {
  const fullText = normalizeProductName([name, description ?? ""].join(" "));
  const matchedPatterns: string[] = [];

  // Paso 1: unidades numéricas
  for (const unit of UNIT_PATTERNS) {
    const m = fullText.match(unit.regex);
    if (m) {
      const value = parseFloat(m[1].replace(",", "."));
      if (!isFinite(value) || value <= 0) continue;
      const packMul = detectPackMultiplier(fullText);
      if (packMul > 1) matchedPatterns.push(`pack x${packMul}`);
      matchedPatterns.push(unit.pattern);
      return {
        weightGrams: unit.toGrams(value) * packMul,
        volumeMl: unit.toMl(value) * packMul,
        confidence: 90,
        matchedPatterns,
      };
    }
  }

  // Paso 2: diccionario de keywords
  for (const entry of KEYWORD_DICTIONARY) {
    if (fullText.includes(entry.keyword)) {
      const packMul = detectPackMultiplier(fullText);
      if (packMul > 1) matchedPatterns.push(`pack x${packMul}`);
      matchedPatterns.push(`keyword:${entry.keyword}`);
      return {
        weightGrams: entry.weightGrams * packMul,
        volumeMl: entry.volumeMl * packMul,
        confidence: entry.confidence,
        matchedPatterns,
      };
    }
  }

  // Paso 3: nada matcheó
  return null;
}
