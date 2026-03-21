/**
 * API Route: OPS Shipment Types Config
 * GET  → returns current shipment types config (from MoovyConfig or defaults)
 * PATCH → saves updated shipment types config to MoovyConfig
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import {
  loadShipmentTypesConfig,
  saveShipmentTypesConfig,
  type ShipmentTypesConfig,
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

    const config = await loadShipmentTypesConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching shipment types config:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración de tipos de envío" },
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

    const body = (await request.json()) as ShipmentTypesConfig;

    // Validate structure
    for (const [code, def] of Object.entries(body) as [string, { maxDeliveryMinutes: number; priorityWeight: number; surchargeArs: number; allowedVehicles: string[] }][]) {
      if (typeof def.maxDeliveryMinutes !== "number" || def.maxDeliveryMinutes < 1) {
        return NextResponse.json(
          { error: `SLA inválido para ${code}` },
          { status: 400 }
        );
      }
      if (typeof def.priorityWeight !== "number" || def.priorityWeight < 0) {
        return NextResponse.json(
          { error: `Peso de prioridad inválido para ${code}` },
          { status: 400 }
        );
      }
      if (typeof def.surchargeArs !== "number" || def.surchargeArs < 0) {
        return NextResponse.json(
          { error: `Recargo inválido para ${code}` },
          { status: 400 }
        );
      }
      if (!Array.isArray(def.allowedVehicles) || def.allowedVehicles.length === 0) {
        return NextResponse.json(
          { error: `Vehículos permitidos vacíos para ${code}` },
          { status: 400 }
        );
      }
    }

    await saveShipmentTypesConfig(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving shipment types config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
