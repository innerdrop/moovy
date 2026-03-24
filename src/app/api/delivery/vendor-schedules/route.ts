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

interface ScheduleDay {
  open: string;
  close: string;
}

type Schedule = Record<string, ScheduleDay | null>;

// Default schedules — DEBEN coincidir con SettingsForm DEFAULT_SCHEDULE
// Mon-Fri: 09:00-21:00, Sat: 10:00-14:00, Sun: cerrado
const DEFAULT_MERCHANT_HOURS = "09:00";
const DEFAULT_MERCHANT_CLOSE = "21:00";
const DEFAULT_SELLER_HOURS = "09:00";
const DEFAULT_SELLER_CLOSE = "21:00";

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
      schedule: Schedule;
    }> = [];

    for (const vendor of vendorData) {
      let schedule: Schedule = {};

      if (vendor.scheduleEnabled && vendor.scheduleJson) {
        try {
          schedule = JSON.parse(vendor.scheduleJson);
        } catch {
          // If JSON is invalid, use defaults
          schedule = getDefaultSchedule(vendor.type);
        }
      } else {
        // No schedule configured, use defaults
        schedule = getDefaultSchedule(vendor.type);
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
 * Get default schedule for a vendor type
 */
function getDefaultSchedule(_type: "merchant" | "seller"): Schedule {
  // Debe coincidir con DEFAULT_SCHEDULE en SettingsForm.tsx
  return {
    "1": { open: "09:00", close: "21:00" }, // Lunes
    "2": { open: "09:00", close: "21:00" }, // Martes
    "3": { open: "09:00", close: "21:00" }, // Miércoles
    "4": { open: "09:00", close: "21:00" }, // Jueves
    "5": { open: "09:00", close: "21:00" }, // Viernes
    "6": { open: "10:00", close: "14:00" }, // Sábado
    "7": null                                // Domingo cerrado
  };
}

/**
 * Compute intersection of all vendor schedules
 * For each day: if ANY vendor is closed, the day is null
 * Otherwise: latest open time and earliest close time
 */
function computeScheduleIntersection(
  vendorSchedules: Array<{
    name: string;
    type: "merchant" | "seller";
    schedule: Schedule;
  }>
): Schedule {
  const result: Schedule = {};

  // Iterate through days 1-7
  for (let day = 1; day <= 7; day++) {
    const dayKey = day.toString();
    const daySchedules: ScheduleDay[] = [];

    // Collect all schedules for this day
    for (const vendor of vendorSchedules) {
      const daySchedule = vendor.schedule[dayKey];
      if (daySchedule === null) {
        // If any vendor is closed on this day, the entire day is closed
        result[dayKey] = null;
        break;
      }
      if (daySchedule) {
        daySchedules.push(daySchedule);
      }
    }

    // If no vendor is closed on this day, compute the intersection
    if (result[dayKey] !== null && daySchedules.length === vendorSchedules.length) {
      // Find latest open time and earliest close time
      const openTimes = daySchedules.map((s) => s.open).sort();
      const closeTimes = daySchedules.map((s) => s.close).sort();

      const latestOpen = openTimes[openTimes.length - 1];
      const earliestClose = closeTimes[0];

      // Validate that intersection makes sense
      if (latestOpen < earliestClose) {
        result[dayKey] = {
          open: latestOpen,
          close: earliestClose
        };
      } else {
        // No valid intersection, close the day
        result[dayKey] = null;
      }
    }
  }

  return result;
}
