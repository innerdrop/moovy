// API Route: Calculate Delivery Cost (with geocoding)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/delivery";
import { calculateShippingCost } from "@/lib/shipping-cost-calculator";
import { parseExcludedZones, getExcludedZone } from "@/lib/excluded-zones";
import { getZoneSnapshotForLocation } from "@/lib/delivery-zones";
import { deliveryLogger } from "@/lib/logger";

const DeliveryCalcSchema = z.object({
    destinationLat: z.number().optional(),
    destinationLng: z.number().optional(),
    address: z.object({
        street: z.string(),
        number: z.string().optional(),
        city: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
    }).optional(),
    merchantId: z.string().min(1, "merchantId requerido"),
    orderTotal: z.number().min(0).optional(),
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

        const { destinationLat, destinationLng, address, merchantId, orderTotal = 0 } = validation.data;

        // Extract lat/lng from root or nested address object
        let lat = destinationLat || address?.latitude;
        let lng = destinationLng || address?.longitude;

        // If address text is provided but coordinates are missing, do geocoding
        if (address && (!lat || !lng)) {
            const cityName = address.city || "Ushuaia";
            const fullAddress = address.number
                ? `${address.street} ${address.number}, ${cityName}, Argentina`
                : `${address.street}, ${cityName}, Argentina`;
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

            const geoResponse = await fetch(geocodeUrl);
            const geoData = await geoResponse.json();

            if (geoData.status === "OK" && geoData.results.length > 0) {
                lat = geoData.results[0].geometry.location.lat;
                lng = geoData.results[0].geometry.location.lng;
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

        // ─── Rama fix/delivery-fee-preview-vs-cobro ────────────────────────────
        // ANTES: este endpoint usaba calculateDeliveryCost (delivery.ts, fórmula
        // maestra) mientras que POST /api/orders usaba calculateShippingCost
        // (shipping-cost-calculator.ts). Producían resultados muy distintos →
        // el cliente veía $2.763 en checkout pero al pagar se cobraba $1.315.
        // Disparaba "FRAUD ALERT: Client delivery fee differs >25%".
        //
        // AHORA: replicamos EXACTAMENTE el flujo de POST /api/orders:
        //   1. calculateShippingCost con MEDIUM/STANDARD/orderTotal=0 → base + km
        //   2. Si orderTotal > 0, sumar operational cost surcharge (5% subtotal)
        //   3. Aplicar climate multiplier
        //   4. Aplicar zone multiplier
        //
        // Resultado: el preview coincide al peso con el cobro real. Sin mismatch.

        const merchantPackageCategory = "MEDIUM";   // default que usa orders/route.ts
        const merchantShipmentType = "STANDARD";    // default que usa orders/route.ts
        const isWithinRange = settings.maxDeliveryDistance > 0
            ? distanceKm <= settings.maxDeliveryDistance
            : true;

        const baseShippingResult = calculateShippingCost({
            distanceKm,
            packageCategory: merchantPackageCategory,
            shipmentTypeCode: merchantShipmentType,
            orderTotal: 0,                              // mismo default que orders/route.ts
            freeDeliveryMinimum: settings.freeDeliveryMinimum,
        });

        // 2. Operational cost surcharge sobre el orderTotal real (igual que orders/route.ts)
        const opSurcharge = orderTotal > 0
            ? Math.round(orderTotal * (operationalCostPercent / 100))
            : 0;

        // 3 + 4. Aplicar climate y zone multipliers
        let finalTotal = baseShippingResult.total + opSurcharge;
        if (climateMultiplier !== 1.0) {
            finalTotal = Math.round(finalTotal * climateMultiplier);
        }
        if (zoneMultiplier !== 1.0) {
            finalTotal = Math.round(finalTotal * zoneMultiplier);
        }

        // Free delivery: si el comercio definió freeDeliveryMinimum y el orderTotal lo cumple,
        // el cliente NO paga el viaje pero sí el operacional + extras de zona/clima
        // (Moovy NO regala el costo MP). Mismo criterio que calculateShippingCost.
        const isFreeDelivery = baseShippingResult.isFreeDelivery;

        deliveryLogger.info(
            {
                distanceKm: parseFloat(distanceKm.toFixed(2)),
                baseShipping: baseShippingResult.total,
                opSurcharge,
                climateMultiplier,
                zoneMultiplier,
                finalTotal,
                isFreeDelivery,
                source: "calculateShippingCost-unified",
            },
            "Delivery fee preview calculated (matches POST /api/orders)"
        );

        return NextResponse.json({
            distanceKm,
            // Desglose del shipping (compatibilidad con consumidores que muestran detalles)
            baseCost: baseShippingResult.baseCost,
            distanceCost: baseShippingResult.distanceCost,
            shipmentSurcharge: baseShippingResult.shipmentSurcharge,
            operationalCost: opSurcharge,
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
