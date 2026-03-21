/**
 * API Route: OPS Shipping Cost Defaults Config
 * GET  → returns current shipping defaults (from MoovyConfig or defaults)
 * PATCH → saves updated shipping defaults to MoovyConfig
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import {
  loadShippingDefaultsConfig,
  saveShippingDefaultsConfig,
  type ShippingDefaultsConfig,
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

    const config = await loadShippingDefaultsConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching shipping defaults:", error);
    return NextResponse.json(
      { error: "Error al obtener tarifas por defecto" },
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

    const body = (await request.json()) as ShippingDefaultsConfig;

    // Validate each category
    for (const [cat, values] of Object.entries(body)) {
      if (typeof values.basePriceArs !== "number" || values.basePriceArs < 0) {
        return NextResponse.json(
          { error: `Tarifa base inválida para ${cat}` },
          { status: 400 }
        );
      }
      if (typeof values.pricePerKmArs !== "number" || values.pricePerKmArs < 0) {
        return NextResponse.json(
          { error: `Precio por km inválido para ${cat}` },
          { status: 400 }
        );
      }
    }

    await saveShippingDefaultsConfig(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving shipping defaults:", error);
    return NextResponse.json(
      { error: "Error al guardar tarifas por defecto" },
      { status: 500 }
    );
  }
}
