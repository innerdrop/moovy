/**
 * API Route: OPS ETA Calculator Config
 * GET  → returns current ETA config (from MoovyConfig or defaults)
 * PATCH → saves updated ETA config to MoovyConfig
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import {
  loadETACalculatorConfig,
  saveETACalculatorConfig,
  type ETACalculatorConfig,
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

    const config = await loadETACalculatorConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching ETA config:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración de ETA" },
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

    const body = (await request.json()) as ETACalculatorConfig;

    if (typeof body.defaultDriverWaitTimeMin !== "number" || body.defaultDriverWaitTimeMin < 0 || body.defaultDriverWaitTimeMin > 60) {
      return NextResponse.json(
        { error: "defaultDriverWaitTimeMin debe ser entre 0 y 60" },
        { status: 400 }
      );
    }
    if (typeof body.pickupTimeMin !== "number" || body.pickupTimeMin < 0 || body.pickupTimeMin > 60) {
      return NextResponse.json(
        { error: "pickupTimeMin debe ser entre 0 y 60" },
        { status: 400 }
      );
    }
    if (typeof body.bufferPercent !== "number" || body.bufferPercent < 0 || body.bufferPercent > 1) {
      return NextResponse.json(
        { error: "bufferPercent debe ser entre 0 y 1 (ej: 0.15 = 15%)" },
        { status: 400 }
      );
    }
    if (typeof body.rangeMinus !== "number" || body.rangeMinus < 0 || body.rangeMinus > 60) {
      return NextResponse.json(
        { error: "rangeMinus debe ser entre 0 y 60" },
        { status: 400 }
      );
    }
    if (typeof body.rangePlus !== "number" || body.rangePlus < 0 || body.rangePlus > 60) {
      return NextResponse.json(
        { error: "rangePlus debe ser entre 0 y 60" },
        { status: 400 }
      );
    }

    await saveETACalculatorConfig(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving ETA config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración de ETA" },
      { status: 500 }
    );
  }
}
