// API Route: Calculate Delivery Cost (with geocoding)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateDistance, computeDeliveryFee } from "@/lib/delivery";
import { calculateOrderCategory } from "@/lib/assignment-engine";
import { getSizeFromWeight } from "@/lib/product-weight";
import { parseExcludedZones, getExcludedZone } from "@/lib/excluded-zones";
import { getZoneSnapshotForLocation, getCoverageStatus } from "@/lib/delivery-zones";
// Rama fix/delivery-geocoding-cobertura: geocoding server-side centralizado
// (sin forzar "Ushuaia"), compartido con el cobro en /api/orders.
import { geocodeAddress, buildAddressQuery } from "@/lib/geocoding";
import { deliveryLogger } from "@/lib/logger";

const DeliveryCalcSchema = z.object({
    destinationLat: z.number().optional(),
    destinationLng: z.number().optional(),
    address: z.object({
        street: z.string(),
        number: z.string().optional(),
        city: z.string().optional(),
        // Rama fix/delivery-geocoding-cobertura: provincia para desambiguar el geocoding.
        province: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
    }).optional(),
    merchantId: z.string().min(1, "merchantId requerido"),
    orderTotal: z.number().min(0).optional(),
    // Rama fix/biblia-motor-envio-y-comisiones: items del carrito para derivar la
    // categoría REAL del pedido (vehículo → costo_km + mínimo). El preview resuelve
    // la categoría server-side desde los productId/listingId (MISMA cascada que el
    // cobro en POST /api/orders), garantizando preview == cobro. Si no se mandan
    // items, cae a "MEDIUM" (default histórico).
    items: z.array(z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        type: z.enum(["product", "listing"]).optional(),
        name: z.string().optional(),
    })).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = DeliveryCalcSchema.safeParse(body);

        if (!validation.success) {
            const message = validation.error.issues[0]?.message || "Datos inválidos";
            return NextResponse.json(
                { success: false, error: message },
                { status: 400 }
            );
        }

        const { destinationLat, destinationLng, address, merchantId, orderTotal = 0, items } = validation.data;

        // Extract lat/lng from root or nested address object
        let lat = destinationLat || address?.latitude;
        let lng = destinationLng || address?.longitude;

        // If address text is provided but coordinates are missing, do geocoding
        // Rama fix/delivery-geocoding-cobertura: usamos el helper centralizado que
        // NO fuerza "Ushuaia". Geocodifica con la ciudad/provincia capturadas (si
        // vinieron) o solo ", Argentina" — así una dirección de otra ciudad resuelve
        // a su ubicación REAL y el gate de cobertura (más abajo) puede rechazarla.
        if (address && (!lat || !lng)) {
            const geo = await geocodeAddress(
                buildAddressQuery({
                    street: address.street,
                    number: address.number,
                    city: address.city,
                    province: address.province,
                })
            );
            if (geo) {
                lat = geo.lat;
                lng = geo.lng;
            } else {
                return NextResponse.json({
                    distanceKm: 0,
                    totalCost: 0,
                    isWithinRange: false,
                    isFreeDelivery: false,
                    message: "No pudimos encontrar la ubicación exacta. Por favor, verificá la dirección.",
                });
            }
        }

        if (!lat || !lng) {
            return NextResponse.json(
                { error: "Se requieren coordenadas de destino o dirección" },
                { status: 400 }
            );
        }

        // Get store settings
        const settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });

        if (!settings) throw new Error("Configuración no encontrada");

        // === ZONA EXCLUIDA: bloqueo antes de calcular fee ===
        // Si el destino cae en un círculo de zona excluida activa, devolver 422 con razón.
        const excludedZones = parseExcludedZones((settings as any).excludedZonesJson);
        const matchedZone = getExcludedZone(lat, lng, excludedZones);
        if (matchedZone) {
            deliveryLogger.info(
                { zone: matchedZone.name, lat, lng, merchantId },
                "Destination falls within excluded zone"
            );
            return NextResponse.json(
                {
                    error: "zone_excluded",
                    zone: { name: matchedZone.name, reason: matchedZone.reason },
                    distanceKm: 0,
                    totalCost: 0,
                    isWithinRange: false,
                    isFreeDelivery: false,
                    message: `No realizamos envíos a ${matchedZone.name}: ${matchedZone.reason}. Probá con otra dirección o elegí retiro en local.`,
                },
                { status: 422 }
            );
        }

        // === GATE DE COBERTURA POR ZONAS (rama fix/delivery-geocoding-cobertura) ===
        // Modelo del CEO: estar dentro de una DeliveryZone (polígono) = cubierto.
        // Afuera de TODAS = fuera de cobertura → rechazar (ej: Río Grande, ~200km).
        // FALLBACK SEGURO: si NO hay zonas configuradas (NO_ZONES), NO bloqueamos —
        // caemos al comportamiento legacy (radio del merchant / maxDistance) y
        // logueamos warning. Así no rompemos producción antes de pintar las zonas.
        const coverage = await getCoverageStatus(lat, lng);
        if (coverage.status === "OUT_OF_COVERAGE") {
            deliveryLogger.info(
                { lat, lng, merchantId },
                "Preview rechazado: destino fuera de zona de cobertura"
            );
            return NextResponse.json(
                {
                    error: "out_of_coverage",
                    zone: { name: "Fuera de cobertura", reason: "Todavía no llegamos a esa dirección" },
                    distanceKm: 0,
                    totalCost: 0,
                    isWithinRange: false,
                    isFreeDelivery: false,
                    message: "Moovy todavía no llega a esa dirección (fuera de zona de cobertura). Probá con otra dirección o elegí retiro en local.",
                },
                { status: 422 }
            );
        }
        if (coverage.status === "NO_ZONES") {
            deliveryLogger.warn(
                { lat, lng, merchantId },
                "Sin zonas de cobertura configuradas — fallback a radio del merchant (pintá las zonas en /ops/zonas-delivery)"
            );
        }

        // Determine origin (Strictly from Merchant now, no global fallback)
        let originLat: number | null = null;
        let originLng: number | null = null;
        let originAddress: string | null = null;

        const merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
            select: { latitude: true, longitude: true, address: true, name: true }
        });

        if (!merchant) {
            deliveryLogger.warn({ merchantId }, "Merchant not found");
            return NextResponse.json({
                distanceKm: 0,
                totalCost: 0,
                isWithinRange: false,
                isFreeDelivery: false,
                message: "El comercio asociado no existe.",
            });
        }

        // Check if merchant has VALID coordinates (not null, not 0,0 which is middle of ocean)
        const hasValidCoords =
            merchant.latitude !== null &&
            merchant.longitude !== null &&
            merchant.latitude !== 0 &&
            merchant.longitude !== 0 &&
            // Must be in Argentina region roughly
            merchant.latitude < -20 && merchant.latitude > -60 &&
            merchant.longitude < -50 && merchant.longitude > -80;

        if (hasValidCoords) {
            originLat = merchant.latitude as number;
            originLng = merchant.longitude as number;
            originAddress = merchant.address || merchant.name;
            deliveryLogger.info(
                { merchantId, merchantName: merchant.name, lat: originLat, lng: originLng },
                "Origin set from merchant coordinates"
            );
        } else if (merchant.address) {
            // Try to geocode merchant address if coords are missing or invalid
            deliveryLogger.info(
                { merchantId, address: merchant.address },
                "Merchant lacks valid coordinates, geocoding"
            );
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(merchant.address + ", Ushuaia, Argentina")}&key=${apiKey}`;

            try {
                const geoResponse = await fetch(geocodeUrl);
                const geoData = await geoResponse.json();

                if (geoData.status === "OK" && geoData.results.length > 0) {
                    originLat = geoData.results[0].geometry.location.lat;
                    originLng = geoData.results[0].geometry.location.lng;
                    originAddress = merchant.address;
                    deliveryLogger.info(
                        { merchantId, lat: originLat, lng: originLng },
                        "Merchant geocoded successfully"
                    );
                }
            } catch (geoErr) {
                deliveryLogger.error(
                    { merchantId, error: geoErr instanceof Error ? geoErr.message : String(geoErr) },
                    "Geocoding error for merchant"
                );
            }
        }

        if (!originLat || !originLng) {
            deliveryLogger.error(
                { merchantId, merchantName: merchant.name },
                "Could not determine origin for merchant"
            );
            return NextResponse.json({
                distanceKm: 0,
                totalCost: 0,
                isWithinRange: false,
                isFreeDelivery: false,
                message: "El comercio no tiene una ubicación válida configurada.",
            });
        }

        deliveryLogger.debug(
            { originLat, originLng, destinationLat: lat, destinationLng: lng },
            "Calculating delivery"
        );

        // --- REAL ROAD DISTANCE: Google Distance Matrix ---
        let distanceKm = 0;
        let isRealRoadDistance = false;

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

            // Build Distance Matrix URL with explicit driving mode
            const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&mode=driving&units=metric&key=${apiKey}`;

            deliveryLogger.debug(
                { origin: originAddress },
                "Requesting distance matrix"
            );

            const distRes = await fetch(distUrl);
            const distData = await distRes.json();

            if (distData.status === "OK" && distData.rows[0].elements[0].status === "OK") {
                // Distance value is in meters, convert to km
                const distanceMeters = distData.rows[0].elements[0].distance.value;
                distanceKm = distanceMeters / 1000;
                isRealRoadDistance = true;
                deliveryLogger.info(
                    { distanceKm: parseFloat(distanceKm.toFixed(2)), source: "google-distance-matrix" },
                    "Road distance calculated"
                );
            } else {
                deliveryLogger.warn(
                    { status: distData.status },
                    "Distance Matrix API failed, using Haversine fallback"
                );
                // Fallback to Haversine (straight line) if API fails
                distanceKm = calculateDistance(originLat, originLng, lat, lng);
            }
        } catch (e) {
            deliveryLogger.error(
                { error: e instanceof Error ? e.message : String(e) },
                "Error calling Distance Matrix API"
            );
            distanceKm = calculateDistance(originLat, originLng, lat, lng);
        }

        // Parse climate multipliers from StoreSettings (Biblia v3)
        let climateMultipliers: Record<string, number> = { normal: 1.0, lluvia_leve: 1.15, temporal_fuerte: 1.30 };
        try {
            if ((settings as any).climateMultipliersJson) {
                climateMultipliers = JSON.parse((settings as any).climateMultipliersJson);
            }
        } catch { /* use defaults */ }

        const activeClimate: string = (settings as any).activeClimateCondition ?? "normal";
        const operationalCostPercent: number = (settings as any).operationalCostPercent ?? 5;

        // Rama fix/biblia-motor-envio-y-comisiones: SURGE / demanda (espejo de clima).
        // El preview DEBE leer el surge de la Biblia igual que el cobro → preview == cobro.
        let demandMultipliers: Record<string, number> = { normal: 1.0, alta: 1.20, pico: 1.40 };
        try {
            if ((settings as any).demandMultipliersJson) {
                demandMultipliers = JSON.parse((settings as any).demandMultipliersJson);
            }
        } catch { /* use defaults */ }
        const activeDemand: string = (settings as any).activeDemandCondition ?? "normal";
        const demandMultiplier = demandMultipliers[activeDemand] ?? 1.0;

        // Rama feat/zonas-delivery-multiplicador: detectar zona REAL con PostGIS
        // (point-in-polygon contra DeliveryZone polygons). Si el destino no cae
        // en ninguna zona configurada, default { zoneCode: null, multiplier: 1.0 }.
        // Esto reemplaza el hardcoded "ZONA_A" anterior, que causaba mismatch
        // entre el preview del fee (que asumía A) y el cobro real al crear el
        // pedido (que sí detectaba la zona).
        const zoneSnapshot = await getZoneSnapshotForLocation(lat, lng);
        const zone = zoneSnapshot.zoneCode || "ZONA_DEFAULT";
        const zoneMultiplier = zoneSnapshot.zoneMultiplier;
        const climateMultiplier = climateMultipliers[activeClimate] ?? 1.0;

        // ─── Rama fix/biblia-motor-envio-y-comisiones ─────────────────────────
        // MOTOR ÚNICO: el preview usa computeDeliveryFee (delivery.ts, fórmula
        // maestra canónica), EXACTAMENTE el mismo motor que el cobro en
        // POST /api/orders. costo_km y mínimo salen de DeliveryRate por categoría;
        // zona/clima/operativo%/riderShare/freeDelivery/maxDistance de la Biblia.
        //
        // PREVIEW == COBRO: derivamos la categoría REAL del pedido con
        // calculateOrderCategory (igual que orders/route.ts). Si el frontend no
        // manda items, caemos a "MEDIUM" (mismo default histórico).
        const riderSharePercent: number = settings.riderCommissionPercent ?? 80;

        let packageCategory = "MEDIUM";
        if (items && items.length > 0) {
            try {
                // Resolver categoría por item desde DB, MISMA cascada que orders/route.ts:
                //   Product → packageCategory.name | getSizeFromWeight(weightGrams) | "SMALL"
                //   Listing → getSizeFromWeight(weightKg×1000) | "SMALL"
                const previewProductIds = items.filter((i) => i.type !== "listing").map((i) => i.productId);
                const previewListingIds = items.filter((i) => i.type === "listing").map((i) => i.productId);
                const [pProducts, pListings] = await Promise.all([
                    previewProductIds.length > 0
                        ? prisma.product.findMany({
                              where: { id: { in: previewProductIds } },
                              select: { id: true, weightGrams: true, packageCategory: { select: { name: true } } },
                          })
                        : Promise.resolve([] as Array<{ id: string; weightGrams: number | null; packageCategory: { name: string } | null }>),
                    previewListingIds.length > 0
                        ? prisma.listing.findMany({
                              where: { id: { in: previewListingIds } },
                              select: { id: true, weightKg: true },
                          })
                        : Promise.resolve([] as Array<{ id: string; weightKg: number | null }>),
                ]);
                const catById = new Map<string, string>();
                for (const p of pProducts) {
                    catById.set(p.id, p.packageCategory?.name || (p.weightGrams != null ? getSizeFromWeight(p.weightGrams) : "SMALL"));
                }
                for (const l of pListings) {
                    catById.set(l.id, l.weightKg != null ? getSizeFromWeight(Math.round(l.weightKg * 1000)) : "SMALL");
                }
                const oc = await calculateOrderCategory(
                    items.map((i) => ({
                        packageCategory: catById.get(i.productId) ?? "SMALL",
                        quantity: i.quantity,
                        name: i.name,
                    }))
                );
                packageCategory = oc.category;
            } catch {
                // Defensivo: ante error usar MEDIUM (no romper el preview).
            }
        }

        const feeResult = await computeDeliveryFee({
            distanceKm,
            packageCategory,
            orderSubtotal: orderTotal,
            isPickup: false,
            biblia: {
                freeDeliveryMinimum: settings.freeDeliveryMinimum,
                maxDeliveryDistance: settings.maxDeliveryDistance,
                operationalCostPercent,
                riderSharePercent,
                baseDeliveryFee: settings.baseDeliveryFee,
                // MODELO B (rama fix/biblia-motor-envio-y-comisiones): globales del
                // combustible para derivar costo_km por vehículo (mismo motor que el cobro).
                fuelPricePerLiter: (settings as any).fuelPricePerLiter ?? 1591,
                maintenanceFactor: (settings as any).maintenanceFactor ?? 1.35,
            },
            zoneMultiplier,
            climateMultiplier,
            demandMultiplier,               // surge (rama fix/biblia-motor-envio-y-comisiones)
        });

        const finalTotal = feeResult.totalCost;
        const isWithinRange = feeResult.isWithinRange;
        const isFreeDelivery = feeResult.isFreeDelivery;

        deliveryLogger.info(
            {
                distanceKm: parseFloat(distanceKm.toFixed(2)),
                packageCategory,
                tripCost: feeResult.tripCost,
                operationalCost: feeResult.operationalCost,
                climateMultiplier,
                zoneMultiplier,
                finalTotal,
                isFreeDelivery,
                source: "computeDeliveryFee-unified",
            },
            "Delivery fee preview calculated (matches POST /api/orders)"
        );

        return NextResponse.json({
            distanceKm,
            // Desglose del shipping (compatibilidad con consumidores que muestran detalles)
            baseCost: feeResult.baseCost,
            distanceCost: feeResult.distanceComponent,
            shipmentSurcharge: 0,
            operationalCost: feeResult.operationalCost,
            packageCategory,
            // Total final que paga el cliente — matchea el cobro de POST /api/orders
            totalCost: finalTotal,
            isWithinRange,
            isFreeDelivery,
            storeAddress: originAddress,
            isRealRoadDistance,
            zone,
            // Snapshot de zona para el desglose del checkout (línea "Zona X +Y%")
            zoneSnapshot: {
                zoneCode: zoneSnapshot.zoneCode,
                zoneMultiplier: zoneSnapshot.zoneMultiplier,
                zoneDriverBonus: zoneSnapshot.zoneDriverBonus,
            },
            activeClimate,
            message: isWithinRange
                ? isFreeDelivery
                    ? "¡Envío gratis!"
                    : isRealRoadDistance
                        ? `Costo de envío (recorrido real): $${finalTotal}`
                        : `Costo de envío (estimado): $${finalTotal}`
                : "Lo sentimos, la dirección está fuera de nuestra zona de delivery",
        });
    } catch (error) {
        deliveryLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error calculating delivery"
        );
        return NextResponse.json({
            success: false,
            distanceKm: 0,
            totalCost: 0,
            isWithinRange: false,
            isFreeDelivery: false,
            message: "Error al calcular el envío. Intenta de nuevo.",
        });
    }
}
