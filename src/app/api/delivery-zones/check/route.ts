// API: GET /api/delivery-zones/check?lat=X&lng=Y
// Rama: feat/zonas-delivery-multiplicador
//
// Devuelve la zona de delivery aplicable a una coordenada. Útil para:
//   - Debug del operador OPS (ver qué zona aplica a una dirección).
//   - Checkout del cliente (mostrar "Zona Norte" en desglose antes de pagar).
//   - Tests automatizados.
//
// PUBLIC (sin auth) porque solo devuelve info no sensible: nombre, multiplicador,
// bonus driver. NO devuelve el polígono completo (eso es admin-only).
//
// Rate limit: 60/min por IP para evitar enumeration de zonas.

import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { getZoneSnapshotForLocation } from "@/lib/delivery-zones";

export async function GET(request: Request) {
    const limit = await applyRateLimit(request, "delivery-zones:check", 60, 60_000);
    if (limit) return limit;

    const url = new URL(request.url);
    const latStr = url.searchParams.get("lat");
    const lngStr = url.searchParams.get("lng");

    const lat = latStr ? parseFloat(latStr) : NaN;
    const lng = lngStr ? parseFloat(lngStr) : NaN;

    if (!isFinite(lat) || !isFinite(lng)) {
        return NextResponse.json(
            { error: "Parámetros lat/lng inválidos" },
            { status: 400 }
        );
    }

    const snapshot = await getZoneSnapshotForLocation(lat, lng);
    return NextResponse.json(snapshot);
}
