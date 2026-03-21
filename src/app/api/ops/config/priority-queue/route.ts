/**
 * API Route: OPS Order Priority Queue Config
 * GET  → returns current priority config (from MoovyConfig or defaults)
 * PATCH → saves updated priority config to MoovyConfig
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import {
  loadOrderPriorityConfig,
  saveOrderPriorityConfig,
  type OrderPriorityConfig,
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

    const config = await loadOrderPriorityConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching priority config:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración de prioridad" },
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

    const body = (await request.json()) as OrderPriorityConfig;

    if (typeof body.maxWaitPriority !== "number" || body.maxWaitPriority < 0 || body.maxWaitPriority > 1000) {
      return NextResponse.json(
        { error: "maxWaitPriority debe ser entre 0 y 1000" },
        { status: 400 }
      );
    }
    if (typeof body.waitPriorityPerMinute !== "number" || body.waitPriorityPerMinute < 0 || body.waitPriorityPerMinute > 100) {
      return NextResponse.json(
        { error: "waitPriorityPerMinute debe ser entre 0 y 100" },
        { status: 400 }
      );
    }
    if (typeof body.retryPriorityPerAttempt !== "number" || body.retryPriorityPerAttempt < 0 || body.retryPriorityPerAttempt > 200) {
      return NextResponse.json(
        { error: "retryPriorityPerAttempt debe ser entre 0 y 200" },
        { status: 400 }
      );
    }
    if (typeof body.scheduledPenalty !== "number" || body.scheduledPenalty > 0 || body.scheduledPenalty < -500) {
      return NextResponse.json(
        { error: "scheduledPenalty debe ser entre -500 y 0" },
        { status: 400 }
      );
    }

    await saveOrderPriorityConfig(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving priority config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración de prioridad" },
      { status: 500 }
    );
  }
}
