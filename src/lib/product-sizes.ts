// Product Sizes — opciones de tamaño DERIVADAS de la config de OPS.
// Rama: feat/tamanos-producto-desde-ops
//
// PROBLEMA que resuelve: el form del comercio mostraba 5 tarjetas de tamaño con
// rangos de peso y vehículo HARDCODEADOS (SIZE_METADATA). Si en OPS
// (/ops/configuracion-logistica → PackageCategory) cambiabas un peso máximo o
// qué vehículos puede llevar una categoría, el comercio seguía viendo lo viejo.
//
// SOLUCIÓN (como las grandes de logística): OPS es la ÚNICA fuente de verdad de
// peso→vehículo. Este helper lee las PackageCategory activas y arma las opciones
// que ve el comercio:
//   - weightRange: derivado de maxWeightGrams (min = max de la categoría previa).
//   - vehicleLabel: vehículo MÍNIMO permitido por OPS (allowedVehicles).
//   - assumedWeightGrams: peso unitario asumido al elegir la categoría (punto
//     medio del rango) — lo que se persiste en Product.weightGrams.
//   - respeta isActive (no muestra categorías apagadas) y displayOrder (orden).
//
// Lo COSMÉTICO (ícono, ejemplos, nombre lindo) sigue en SIZE_METADATA keyado por
// name — no es dato de logística, es copy de UI.

import { prisma } from "@/lib/prisma";
import { SIZE_METADATA, type MerchantSizeOption, type ProductSize } from "@/lib/product-weight";
import { normalizeVehicleTypes, type VehicleTypeEnum } from "@/lib/vehicle-type-mapping";

// Ranking de vehículos de menor a mayor capacidad. El "vehículo mínimo" que se
// le muestra al comercio es el más chico que OPS permite para esa categoría.
const VEHICLE_RANK: Record<VehicleTypeEnum, number> = { BIKE: 0, MOTO: 1, CAR: 2, TRUCK: 3 };
const VEHICLE_LABEL: Record<VehicleTypeEnum, string> = {
  BIKE: "Bici",
  MOTO: "Moto",
  CAR: "Auto",
  TRUCK: "Camioneta",
};

/** Ícono neutro para categorías custom de OPS sin cosmético en SIZE_METADATA. */
const DEFAULT_ICON = "Package" as const;

/** Formatea gramos a un string legible: "200 g", "2 kg", "1,5 kg". */
function formatGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    // 2 → "2 kg", 1.5 → "1,5 kg" (coma decimal argentina)
    const label = Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(".", ",");
    return `${label} kg`;
  }
  return `${grams} g`;
}

/**
 * Arma las opciones de tamaño que ve el comercio, leyendo PackageCategory de OPS.
 * Devuelve [] si no hay categorías activas o si la query falla (defensivo: el
 * form muestra un aviso y deja crear el producto sin tamaño → cae al fallback
 * conservador del motor).
 */
export async function getMerchantSizeOptions(): Promise<MerchantSizeOption[]> {
  let categories;
  try {
    categories = await prisma.packageCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        name: true,
        maxWeightGrams: true,
        allowedVehicles: true,
        volumeScore: true,
      },
    });
  } catch (err) {
    console.error("[getMerchantSizeOptions] query PackageCategory falló:", err);
    return [];
  }

  const options: MerchantSizeOption[] = [];
  let prevMax = 0;

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const isLast = i === categories.length - 1;
    const cosmetic = SIZE_METADATA[cat.name as ProductSize];

    // Rango de peso derivado de OPS.
    let weightRange: string;
    if (i === 0) {
      weightRange = `Hasta ${formatGrams(cat.maxWeightGrams)}`;
    } else if (isLast) {
      weightRange = `Más de ${formatGrams(prevMax)}`;
    } else {
      weightRange = `${formatGrams(prevMax)} a ${formatGrams(cat.maxWeightGrams)}`;
    }

    // Peso asumido: punto medio del rango (para la última, su max). Es un valor
    // secundario — al persistir el producto también se guarda el packageCategoryId,
    // que es lo que el motor de asignación prioriza sobre los gramos.
    const assumedWeightGrams = isLast
      ? cat.maxWeightGrams
      : Math.round((prevMax + cat.maxWeightGrams) / 2);

    // Volumen asumido: usamos el cosmético si existe; si no, derivamos del
    // volumeScore de OPS (aprox), con un piso razonable.
    const assumedVolumeMl = cosmetic?.volumeMl ?? Math.max(300, cat.volumeScore * 4000);

    // Vehículo mínimo permitido por OPS.
    const vehicles = normalizeVehicleTypes(cat.allowedVehicles);
    vehicles.sort((a, b) => VEHICLE_RANK[a] - VEHICLE_RANK[b]);
    const minVehicle = vehicles[0];
    const vehicleLabel = minVehicle ? VEHICLE_LABEL[minVehicle] : "—";

    options.push({
      size: cat.name,
      displayName: cosmetic?.displayName ?? cat.name,
      description: cosmetic?.description ?? "",
      examples: cosmetic?.examples ?? "",
      iconName: cosmetic?.iconName ?? DEFAULT_ICON,
      weightRange,
      assumedWeightGrams,
      assumedVolumeMl,
      vehicleLabel,
    });

    prevMax = cat.maxWeightGrams;
  }

  return options;
}
