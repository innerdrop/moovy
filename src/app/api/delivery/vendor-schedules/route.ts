import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface VendorId {
  type: "merchant" | "seller";
  id: string;
}

interface VendorScheduleRequest {
  vendorIds: VendorId[];
}

/** Un rango horario dentro de un día */
interface TimeRange {
  open: string;  // "09:00"
  close: string; // "13:00"
}

/**
 * Schedule normalizado: cada día es un array de TimeRange o null (cerrado).
 * Formato en DB puede ser:
 *   Legacy:  { "1": { "open": "09:00", "close": "21:00" } }
 *   Nuevo:   { "1": [{ "open": "09:00", "close": "13:00" }, { "open": "16:00", "close": "20:30" }] }
 *   Cerrado: { "7": null }
 */
type NormalizedSchedule = Record<string, TimeRange[] | null>;

/** Formato que devuelve la API al cliente (mismo formato normalizado) */
export type VendorScheduleResponse = NormalizedSchedule;

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body: VendorScheduleRequest = await request.json();

    // Validate input
    if (!Array.isArray(body.vendorIds) || body.vendorIds.length === 0) {
      return NextResponse.json(
        { error: "vendorIds debe ser un array no vacío" },
        { status: 400 }
      );
    }

    // Validate each vendor ID
    for (const vendor of body.vendorIds) {
      if (!vendor.type || !vendor.id) {
        return NextResponse.json(
          { error: "Cada vendor debe tener type e id" },
          { status: 400 }
        );
      }
      if (!["merchant", "seller"].includes(vendor.type)) {
        return NextResponse.json(
          { error: "type debe ser 'merchant' o 'seller'" },
          { status: 400 }
        );
      }
    }

    // Fetch vendors from DB
    const vendorData: Array<{
      name: string;
      type: "merchant" | "seller";
      scheduleEnabled: boolean;
      scheduleJson: string | null;
    }> = [];

    const merchantIds = body.vendorIds
      .filter((v) => v.type === "merchant")
      .map((v) => v.id);
    const sellerIds = body.vendorIds
      .filter((v) => v.type === "seller")
      .map((v) => v.id);

    // Get merchants
    if (merchantIds.length > 0) {
      const merchants = await prisma.merchant.findMany({
        where: { id: { in: merchantIds } },
        select: { id: true, name: true, scheduleEnabled: true, scheduleJson: true }
      });
      vendorData.push(
        ...merchants.map((m) => ({
          name: m.name,
          type: "merchant" as const,
          scheduleEnabled: m.scheduleEnabled,
          scheduleJson: m.scheduleJson
        }))
      );
    }

    // Get sellers via SellerAvailability and SellerProfile
    if (sellerIds.length > 0) {
      const sellerAvailabilities = await prisma.sellerAvailability.findMany({
        where: { sellerId: { in: sellerIds } },
        select: {
          sellerId: true,
          scheduleEnabled: true,
          scheduleJson: true
        }
      });

      const sellerProfiles = await prisma.sellerProfile.findMany({
        where: { id: { in: sellerIds } },
        select: {
          id: true,
          displayName: true
        }
      });

      const displayNameMap = new Map(sellerProfiles.map((s) => [s.id, s.displayName || "Vendedor"]));

      vendorData.push(
        ...sellerAvailabilities.map((s) => ({
          name: displayNameMap.get(s.sellerId) || "Vendedor",
          type: "seller" as const,
          scheduleEnabled: s.scheduleEnabled,
          scheduleJson: s.scheduleJson
        }))
      );
    }

    // Parse schedules
    const parsedSchedules: Array<{
      name: string;
      type: "merchant" | "seller";
      schedule: NormalizedSchedule;
    }> = [];

    for (const vendor of vendorData) {
      let schedule: NormalizedSchedule;

      // Siempre usar el schedule configurado del comercio si existe,
      // independientemente de scheduleEnabled (que controla si ofrece
      // entrega programada, no los horarios de operación)
      if (vendor.scheduleJson) {
        try {
          const raw = JSON.parse(vendor.scheduleJson);
          schedule = normalizeSchedule(raw);
        } catch {
          schedule = getDefaultSchedule();
        }
      } else {
        schedule = getDefaultSchedule();
      }

      parsedSchedules.push({
        name: vendor.name,
        type: vendor.type,
        schedule
      });
    }

    // Compute intersection of all schedules
    const mergedSchedule = computeScheduleIntersection(parsedSchedules);

    // Build vendors array for response
    const vendorsResponse = vendorData.map((v) => ({
      name: v.name,
      type: v.type
    }));

    return NextResponse.json({
      schedules: mergedSchedule,
      vendors: vendorsResponse
    });
  } catch (error) {
    console.error("[Vendor Schedules] Error:", error);
    return NextResponse.json(
      { error: "Error interno al obtener horarios" },
      { status: 500 }
    );
  }
}

/**
 * Normaliza el schedule de la DB (legacy o nuevo) a formato array.
 * Legacy: { "1": { open, close } } → { "1": [{ open, close }] }
 * Nuevo:  { "1": [{ open, close }, ...] } → sin cambio
 * null:   { "7": null } → sin cambio
 */
function normalizeSchedule(raw: Record<string, unknown>): NormalizedSchedule {
  const normalized: NormalizedSchedule = {};

  for (let day = 1; day <= 7; day++) {
    const key = day.toString();
    const value = raw[key];

    if (value === null || value === undefined) {
      normalized[key] = null;
      continue;
    }

    // Nuevo formato: ya es un array
    if (Array.isArray(value)) {
      const ranges: TimeRange[] = value
        .filter((r): r is TimeRange =>
          r !== null &&
          typeof r === "object" &&
          typeof (r as TimeRange).open === "string" &&
          typeof (r as TimeRange).close === "string"
        )
        .sort((a, b) => a.open.localeCompare(b.open));

      normalized[key] = ranges.length > 0 ? ranges : null;
      continue;
    }

    // Legacy formato: objeto { open, close }
    if (
      typeof value === "object" &&
      typeof (value as TimeRange).open === "string" &&
      typeof (value as TimeRange).close === "string"
    ) {
      normalized[key] = [{ open: (value as TimeRange).open, close: (value as TimeRange).close }];
      continue;
    }

    // Formato desconocido → cerrado
    normalized[key] = null;
  }

  return normalized;
}

/**
 * Get default schedule (Mon-Fri 09:00-21:00, Sat 10:00-14:00, Sun cerrado)
 */
function getDefaultSchedule(): NormalizedSchedule {
  return {
    "1": [{ open: "09:00", close: "21:00" }],
    "2": [{ open: "09:00", close: "21:00" }],
    "3": [{ open: "09:00", close: "21:00" }],
    "4": [{ open: "09:00", close: "21:00" }],
    "5": [{ open: "09:00", close: "21:00" }],
    "6": [{ open: "10:00", close: "14:00" }],
    "7": null
  };
}

function parseHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + (m || 0) / 60;
}

/**
 * Compute intersection of all vendor schedules (multi-turno aware).
 * Para cada día: si CUALQUIER vendor está cerrado, el día es null.
 * Si hay un solo vendor: se devuelve su schedule tal cual.
 * Si hay múltiples vendors: se intersectan los rangos de cada vendor.
 * La intersección produce rangos donde TODOS los vendors están abiertos.
 */
function computeScheduleIntersection(
  vendorSchedules: Array<{
    name: string;
    type: "merchant" | "seller";
    schedule: NormalizedSchedule;
  }>
): NormalizedSchedule {
  if (vendorSchedules.length === 0) return getDefaultSchedule();
  if (vendorSchedules.length === 1) return vendorSchedules[0].schedule;

  const result: NormalizedSchedule = {};

  for (let day = 1; day <= 7; day++) {
    const dayKey = day.toString();

    // Check if any vendor is closed
    let anyClosed = false;
    const allRanges: TimeRange[][] = [];

    for (const vendor of vendorSchedules) {
      const dayRanges = vendor.schedule[dayKey];
      if (!dayRanges || dayRanges.length === 0) {
        anyClosed = true;
        break;
      }
      allRanges.push(dayRanges);
    }

    if (anyClosed) {
      result[dayKey] = null;
      continue;
    }

    // Intersect all vendor ranges for this day
    // Start with the first vendor's ranges, then intersect with each subsequent
    let currentRanges = allRanges[0];

    for (let i = 1; i < allRanges.length; i++) {
      currentRanges = intersectRangeArrays(currentRanges, allRanges[i]);
      if (currentRanges.length === 0) break;
    }

    result[dayKey] = currentRanges.length > 0 ? currentRanges : null;
  }

  return result;
}

/**
 * Intersect two arrays of time ranges.
 * Returns ranges where BOTH arrays have coverage.
 */
function intersectRangeArrays(a: TimeRange[], b: TimeRange[]): TimeRange[] {
  const result: TimeRange[] = [];

  for (const rangeA of a) {
    for (const rangeB of b) {
      const startA = parseHour(rangeA.open);
      const endA = parseHour(rangeA.close);
      const startB = parseHour(rangeB.open);
      const endB = parseHour(rangeB.close);

      const overlapStart = Math.max(startA, startB);
      const overlapEnd = Math.min(endA, endB);

      if (overlapStart < overlapEnd) {
        // Format back to HH:MM
        const openH = Math.floor(overlapStart);
        const openM = Math.round((overlapStart - openH) * 60);
        const closeH = Math.floor(overlapEnd);
        const closeM = Math.round((overlapEnd - closeH) * 60);

        result.push({
          open: `${String(openH).padStart(2, "0")}:${String(openM).padStart(2, "0")}`,
          close: `${String(closeH).padStart(2, "0")}:${String(closeM).padStart(2, "0")}`
        });
      }
    }
  }

  return result.sort((a, b) => a.open.localeCompare(b.open));
}
