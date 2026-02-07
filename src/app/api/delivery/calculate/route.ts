// API Route: Calculate Delivery Cost (with geocoding)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance, calculateDeliveryCost, DeliverySettings } from "@/lib/delivery";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { destinationLat, destinationLng, address, merchantId, orderTotal = 0 } = body;

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

        // Determine origin
        let originLat = settings.originLat;
        let originLng = settings.originLng;
        let originAddress = settings.storeAddress;

        if (merchantId) {
            const merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: { latitude: true, longitude: true, address: true, name: true }
            });

            if (merchant) {
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
                    console.log(`[DeliveryCalc] Origin set from merchant coordinates: ${merchant.name} (${originLat}, ${originLng})`);
                } else if (merchant.address) {
                    // Try to geocode merchant address if coords are missing or invalid
                    console.log(`[DeliveryCalc] Merchant lacks valid coordinates, geocoding address: ${merchant.address}`);
                    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(merchant.address + ", Ushuaia, Argentina")}&key=${apiKey}`;

                    const geoResponse = await fetch(geocodeUrl);
                    const geoData = await geoResponse.json();

                    if (geoData.status === "OK" && geoData.results.length > 0) {
                        originLat = geoData.results[0].geometry.location.lat;
                        originLng = geoData.results[0].geometry.location.lng;
                        originAddress = merchant.address;
                        console.log(`[DeliveryCalc] Merchant geocoded to: ${originLat}, ${originLng}`);
                    }
                }
            }
        }

        console.log(`[DeliveryCalc] Final Points -> Origin: ${originLat},${originLng} | Dest: ${lat},${lng}`);

        // --- REAL ROAD DISTANCE: Google Distance Matrix ---
        let distanceKm = 0;
        let isRealRoadDistance = false;

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

            // Build Distance Matrix URL with explicit driving mode
            const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&mode=driving&units=metric&key=${apiKey}`;

            console.log(`[DeliveryCalc] Requesting distance from ${originAddress} to destination...`);

            const distRes = await fetch(distUrl);
            const distData = await distRes.json();

            if (distData.status === "OK" && distData.rows[0].elements[0].status === "OK") {
                // Distance value is in meters, convert to km
                const distanceMeters = distData.rows[0].elements[0].distance.value;
                distanceKm = distanceMeters / 1000;
                isRealRoadDistance = true;
                console.log(`[DeliveryCalc] Real road distance: ${distanceKm.toFixed(2)} km`);
            } else {
                console.warn(`[DeliveryCalc] Distance Matrix failed (${distData.status}), using fallback.`);
                // Fallback to Haversine (straight line) if API fails
                distanceKm = calculateDistance(originLat, originLng, parseFloat(lat), parseFloat(lng));
            }
        } catch (e) {
            console.error("[DeliveryCalc] Critical error calling Distance Matrix:", e);
            distanceKm = calculateDistance(originLat, originLng, parseFloat(lat), parseFloat(lng));
        }

        const deliverySettings: DeliverySettings = {
            fuelPricePerLiter: settings.fuelPricePerLiter,
            fuelConsumptionPerKm: settings.fuelConsumptionPerKm,
            baseDeliveryFee: settings.baseDeliveryFee,
            maintenanceFactor: settings.maintenanceFactor,
            freeDeliveryMinimum: settings.freeDeliveryMinimum,
            maxDeliveryDistance: settings.maxDeliveryDistance,
            originLat,
            originLng,
        };

        const result = calculateDeliveryCost(distanceKm, deliverySettings, parseFloat(orderTotal));

        return NextResponse.json({
            ...result,
            storeAddress: originAddress,
            isRealRoadDistance,
            message: result.isWithinRange
                ? result.isFreeDelivery
                    ? "¡Envío gratis!"
                    : isRealRoadDistance
                        ? `Costo de envío (recorrido real): $${result.totalCost}`
                        : `Costo de envío (estimado): $${result.totalCost}`
                : "Lo sentimos, la dirección está fuera de nuestra zona de delivery",
        });
    } catch (error) {
        console.error("Error calculating delivery:", error);
        return NextResponse.json({
            distanceKm: 0,
            totalCost: 0,
            isWithinRange: false,
            isFreeDelivery: false,
            message: "Error al calcular el envío. Intenta de nuevo.",
        });
    }
}
