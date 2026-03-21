/**
 * API Route: OPS Vehicle Speeds Config
 * GET  → returns current vehicle speeds (from MoovyConfig or defaults)
 * PATCH → saves updated vehicle speeds to MoovyConfig
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import {
  loadVehicleSpeedsConfig,
  saveVehicleSpeedsConfig,
  type VehicleSpeedsConfig,
} from "@/lib/logistics-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const config = await loadVehicleSpeedsConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching vehicle speeds config:", error);
    return NextResponse.json(
      { error: "Error al obtener velocidades de vehículos" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = (await request.json()) as VehicleSpeedsConfig;

    // Validate: all speeds must be positive numbers
    for (const [vehicle, speed] of Object.entries(body)) {
      if (typeof speed !== "number" || speed <= 0 || speed > 200) {
        return NextResponse.json(
          { error: `Velocidad inválida para ${vehicle}: debe ser entre 1 y 200 km/h` },
          { status: 400 }
        );
      }
    }

    await saveVehicleSpeedsConfig(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving vehicle speeds config:", error);
    return NextResponse.json(
      { error: "Error al guardar velocidades" },
      { status: 500 }
    );
  }
}
