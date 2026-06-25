// API Route: Orders CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { processOrderPoints, getUserPointsBalance, calculateMaxPointsDiscount, getPointsConfig, recordPointsTransaction } from "@/lib/points";
import { CreateOrderSchema, validateInput } from "@/lib/validations";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { httpRequestsTotal, httpRequestDuration } from "@/lib/metrics";
import { preferenceApi, buildPreferenceBody, createVendorPreference } from "@/lib/mercadopago";
import { applyRateLimit } from "@/lib/rate-limit";
import { notifyMerchant, notifySeller, notifyMerchantFirstOrderWelcome } from "@/lib/notifications";
import { orderLogger } from "@/lib/logger";
// Rama fix/biblia-motor-envio-y-comisiones: MOTOR ÚNICO de envío. El cobro usa
// computeDeliveryFee (delivery.ts, fórmula maestra canónica), el MISMO motor que
// el preview en /api/delivery/calculate. Reemplaza a calculateShippingCost
// (shipping-cost-calculator.ts), que se eliminó.
import { computeDeliveryFee } from "@/lib/delivery";
import { validateMerchantCanReceiveOrders } from "@/lib/merchant-schedule";
import { logUserActivity, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { generatePinPair } from "@/lib/pin";
import { getEffectiveCommission, getEffectiveCommissionWithSource } from "@/lib/merchant-loyalty";
import { buildSubOrderFinancialSnapshot } from "@/lib/orders/order-totals";
// Rama fix/split-mp-reserva-y-operativo: reparto del split con reserva para la
// comisión de MP (que el comercio no quede negativo → MP no rechaza el CPT01).
import { computeMpSplit } from "@/lib/finance/mp-split";
import { getMpReservePercent } from "@/lib/finance/mp-reserve";
// Rama fix/cifrar-tokens-mp: el token del vendedor (split) se guarda cifrado at-rest;
// se descifra antes de usarlo para crear la preferencia. decrypt es seguro sobre plano.
import { decrypt } from "@/lib/encryption";
import { getZoneSnapshotForLocation, getCoverageStatus } from "@/lib/delivery-zones";
import { parseExcludedZones, getExcludedZone } from "@/lib/excluded-zones";
// Rama fix/delivery-geocoding-cobertura: COBRO BLINDADO. La distancia se
// recalcula server-side desde las coords REALES del destino (geocodificadas si
// faltan) + las del comercio. NUNCA se confía en el distanceKm del navegador.
import { geocodeAddress, buildAddressQuery, getRoadDistanceKm } from "@/lib/geocoding";
// Rama fix/asignacion-match-vehiculo: el tamaño del producto debe fluir al pedido
// (OrderItem.packageCategoryName) y al cálculo de envío. calculateOrderCategory
// deriva la categoría agregada del pedido; getSizeFromWeight es el fallback por peso.
import { calculateOrderCategory } from "@/lib/assignment-engine";
import { getSizeFromWeight } from "@/lib/product-weight";

// Read a MoovyConfig value with fallback
async function getConfigValue(key: string, fallback: string): Promise<string> {
    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    return config?.value ?? fallback;
}

// Read OPS config from StoreSettings (Biblia Financiera)
async function getOpsSettings() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } });
    const s = settings as any;
    return {
        defaultMerchantCommission: s?.defaultMerchantCommission ?? 8,
        defaultSellerCommission: s?.defaultSellerCommission ?? 12,
        riderCommissionPercent: settings?.riderCommissionPercent ?? 80,
        maxOrdersPerSlot: s?.maxOrdersPerSlot ?? 15,
        slotDurationMinutes: s?.slotDurationMinutes ?? 120,
        minAnticipationHours: s?.minAnticipationHours ?? 1.5,
        maxAnticipationHours: s?.maxAnticipationHours ?? 48,
        operatingHoursStart: s?.operatingHoursStart ?? "09:00",
        operatingHoursEnd: s?.operatingHoursEnd ?? "22:00",
        merchantConfirmTimeoutSec: s?.merchantConfirmTimeoutSec ?? 300,
        driverResponseTimeoutSec: s?.driverResponseTimeoutSec ?? 60,
        // Delivery fee config
        zoneMultipliers: (() => { try { return JSON.parse(s?.zoneMultipliersJson ?? "{}"); } catch { return { ZONA_A: 1.0, ZONA_B: 1.15, ZONA_C: 1.35 }; } })(),
        climateMultipliers: (() => { try { return JSON.parse(s?.climateMultipliersJson ?? "{}"); } catch { return { normal: 1.0, lluvia: 1.10, nieve: 1.15, extremo: 1.25 }; } })(),
        activeClimateCondition: s?.activeClimateCondition ?? "normal",
        // Rama fix/biblia-motor-envio-y-comisiones: SURGE / demanda (espejo de clima).
        demandMultipliers: (() => { try { return JSON.parse(s?.demandMultipliersJson ?? "{}"); } catch { return { normal: 1.0, alta: 1.20, pico: 1.40 }; } })(),
        activeDemandCondition: s?.activeDemandCondition ?? "normal",
        operationalCostPercent: s?.operationalCostPercent ?? 5,
        excludedZonesJson: s?.excludedZonesJson ?? "[]",
        // Rama fix/biblia-motor-envio-y-comisiones: parámetros que consume el
        // MOTOR ÚNICO de envío (computeDeliveryFee). Antes vivían hardcodeados
        // en shipping-cost-calculator; ahora salen de la Biblia.
        freeDeliveryMinimum: settings?.freeDeliveryMinimum ?? null,
        maxDeliveryDistance: settings?.maxDeliveryDistance ?? 15,
        baseDeliveryFee: settings?.baseDeliveryFee ?? 500,
        // MODELO B (rama fix/biblia-motor-envio-y-comisiones): globales del
        // combustible para derivar costo_km por vehículo dentro del motor.
        fuelPricePerLiter: settings?.fuelPricePerLiter ?? 1591,
        maintenanceFactor: settings?.maintenanceFactor ?? 1.35,
        // Cash protocol
        cashMpOnlyDeliveries: s?.cashMpOnlyDeliveries ?? 10,
        cashLimitL1: s?.cashLimitL1 ?? 15000,
        cashLimitL2: s?.cashLimitL2 ?? 25000,
        cashLimitL3: s?.cashLimitL3 ?? 40000,
    };
}

// Helper to generate order number (MOV-XXXX format)
function generateOrderNumber(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like 0/O, 1/I
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MOV-${code}`;
}

// ISSUE-031: dispara el push especial de bienvenida al primer pedido de un merchant.
// Atómico: updateMany WHERE firstOrderWelcomeSentAt = null garantiza que aunque
// lleguen 2 pedidos concurrentes, solo uno gana la carrera (count === 1) y dispara
// el push. El otro ve count === 0 y skipea. Defense in depth para la notif
// "bienvenida" que debe ser one-shot. Fire-and-forget: errores se loguean pero
// nunca bubblean al cliente — el push es nice-to-have, no crítico para el flujo.
async function tryNotifyMerchantFirstOrderWelcome(
    merchantId: string,
    orderNumber: string,
    total: number
): Promise<void> {
    try {
        const updated = await prisma.merchant.updateMany({
            where: { id: merchantId, firstOrderWelcomeSentAt: null },
            data: { firstOrderWelcomeSentAt: new Date() },
        });
        if (updated.count === 1) {
            notifyMerchantFirstOrderWelcome(merchantId, orderNumber, total).catch((err) =>
                orderLogger.error({ error: err, merchantId }, "Failed to send first-order welcome push")
            );
        }
    } catch (err) {
        orderLogger.error({ error: err, merchantId }, "Failed atomic first-order welcome check");
    }
}

// POST - Create a new order
export async function POST(request: Request) {
    // Rate limit: max 10 orders per minute per IP
    const limited = await applyRateLimit(request, "orders:create", 10, 60_000);
    if (limited) return limited;

    const start = Date.now();
    let status = "201";
    try {

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Debe iniciar sesión para realizar un pedido" },
                { status: 401 }
            );
        }

        const rawData = await request.json();

        // IDEMPOTENCY: Prevenir double-submit en checkout
        // Detectar si el mismo usuario creó una orden idéntica en los últimos 30 segundos
        const recentDuplicate = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                createdAt: { gte: new Date(Date.now() - 30 * 1000) }, // últimos 30 seg
                status: { in: ["PENDING", "SCHEDULED"] },
                deletedAt: null,
            },
            select: { id: true, orderNumber: true, total: true },
            orderBy: { createdAt: "desc" },
        });
        if (recentDuplicate) {
            orderLogger.warn(
                { existingOrderId: recentDuplicate.id, userId: session.user.id },
                "Possible double-submit: order created <30s ago for same user"
            );
            return NextResponse.json(
                { error: "Ya tenés un pedido en proceso. Esperá unos segundos.", orderId: recentDuplicate.id, orderNumber: recentDuplicate.orderNumber },
                { status: 409 }
            );
        }

        // Validate input with Zod
        const validation = validateInput(CreateOrderSchema, rawData);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const data = validation.data!;
        const {
            items,
            groups,
            addressId,
            addressData,
            paymentMethod,
            deliveryFee,
            distanceKm,
            isPickup,
            deliveryNotes,
            customerNotes,
            pointsUsed,
            discountAmount,
            merchantId,
            deliveryType,
            scheduledSlotStart,
            scheduledSlotEnd,
            couponCode,
        } = data;

        const isMultiVendor = (groups && groups.length > 1) || false;

        // Load OPS config from Biblia Financiera (StoreSettings) — single DB read for all config
        const opsSettings = await getOpsSettings();

        // ─── Rama fix/asignacion-match-vehiculo ──────────────────────────────────
        // Mapa productId/listingId → nombre de categoría de paquete (MICRO..XL).
        //
        // PROBLEMA QUE RESUELVE: el motor de asignación lee OrderItem.packageCategoryName
        // pero ese campo NUNCA se completaba al crear el pedido (quedaba null), y el
        // costo de envío se calculaba con packageCategory:"MEDIUM" hardcodeado. Resultado:
        // un colchón XL y un alfajor MICRO costaban lo mismo de envío y ambos podían
        // caer en una bici.
        //
        // SIN N+1: cargamos TODOS los productos y listings del carrito en exactamente
        // DOS queries (una por tabla), con su relación packageCategory{name} + weightGrams.
        // El mapa se reutiliza tanto para el cálculo de envío (paso 3) como para setear
        // OrderItem.packageCategoryName dentro de la transacción (paso 2).
        //
        // CASCADA de resolución por item:
        //   Product  → 1. packageCategory?.name (tamaño elegido por el comercio)
        //              2. getSizeFromWeight(weightGrams) (derivado del peso explícito)
        //              3. "SMALL" (fallback conservador, NO "MICRO" — evita mandar
        //                 bicis a paquetes sin data)
        //   Listing  → 1. getSizeFromWeight(weightKg × 1000) (Listing NO tiene
        //                 packageCategory ni weightGrams en el schema; usa weightKg)
        //              2. "SMALL" (mismo fallback conservador)
        const productIds = items.filter((i) => i.type !== "listing").map((i) => i.productId);
        const listingIds = items.filter((i) => i.type === "listing").map((i) => i.productId);

        const [productCats, listingCats] = await Promise.all([
            productIds.length > 0
                ? prisma.product.findMany({
                      where: { id: { in: productIds } },
                      select: {
                          id: true,
                          weightGrams: true,
                          packageCategory: { select: { name: true } },
                      },
                  })
                : Promise.resolve(
                      [] as Array<{ id: string; weightGrams: number | null; packageCategory: { name: string } | null }>
                  ),
            // Listing usa weightKg (Float, kilogramos), no weightGrams ni packageCategory.
            listingIds.length > 0
                ? prisma.listing.findMany({
                      where: { id: { in: listingIds } },
                      select: { id: true, weightKg: true },
                  })
                : Promise.resolve([] as Array<{ id: string; weightKg: number | null }>),
        ]);

        const packageCategoryNameById = new Map<string, string>();
        for (const p of productCats) {
            const name =
                p.packageCategory?.name ||
                (p.weightGrams != null ? getSizeFromWeight(p.weightGrams) : "SMALL");
            packageCategoryNameById.set(p.id, name);
        }
        for (const l of listingCats) {
            const name = l.weightKg != null ? getSizeFromWeight(Math.round(l.weightKg * 1000)) : "SMALL";
            packageCategoryNameById.set(l.id, name);
        }
        // Helper: nombre de categoría para un item (fallback conservador SMALL).
        const resolveItemCategoryName = (productOrListingId: string): string =>
            packageCategoryNameById.get(productOrListingId) ?? "SMALL";

        // Calculate subtotal (necesario antes del fee: el operativo y el envío
        // gratis se basan en el subtotal del pedido).
        const subtotal = items.reduce(
            (sum: number, item: { price: number; quantity: number }) =>
                sum + item.price * item.quantity,
            0
        );

        // ─── DESTINO REAL + COBERTURA + DISTANCIA SERVER-SIDE ─────────────────────
        // Rama fix/delivery-geocoding-cobertura (COBRO BLINDADO):
        //   1. Resolver las coords REALES del destino (de addressData, del addressId
        //      guardado, o geocodificando el texto). Si no se puede ubicar → rechazar.
        //   2. Gate de cobertura: afuera de toda DeliveryZone → rechazar. Si no hay
        //      zonas configuradas (NO_ZONES) → fallback seguro al radio del merchant.
        //   3. La distancia para el fee y el radio se RECALCULA server-side por
        //      comercio (merchant.coords → dest.coords), nunca con el distanceKm del
        //      navegador (manipulable). resolveVendorDistanceKm memoiza por merchant.
        let destLat: number | null = null;
        let destLng: number | null = null;
        let resolvedDestCity: string | null = null;
        let resolvedDestProvince: string | null = null;
        // Distancia server-side del comercio principal (single-vendor): alimenta el
        // fee, el chequeo de radio y el snapshot persistido en Order.distanceKm.
        let effectiveDistanceKm: number | null = null;

        if (!isPickup) {
            // 1a. Coords directas del cliente (eligió sugerencia del autocomplete).
            if (addressData?.latitude != null && addressData?.longitude != null) {
                destLat = addressData.latitude;
                destLng = addressData.longitude;
            } else if (addressId) {
                // 1b. Dirección guardada: usar sus coords; si faltan, geocodificar el
                //     texto y PERSISTIR las coords reales (autocura direcciones viejas).
                const savedAddr = await prisma.address.findUnique({
                    where: { id: addressId },
                    select: { latitude: true, longitude: true, street: true, number: true, city: true, province: true },
                });
                if (savedAddr?.latitude != null && savedAddr?.longitude != null) {
                    destLat = savedAddr.latitude;
                    destLng = savedAddr.longitude;
                } else if (savedAddr) {
                    const geo = await geocodeAddress(
                        buildAddressQuery({ street: savedAddr.street, number: savedAddr.number, city: savedAddr.city, province: savedAddr.province })
                    );
                    if (geo) {
                        destLat = geo.lat;
                        destLng = geo.lng;
                        resolvedDestCity = geo.city;
                        resolvedDestProvince = geo.province;
                        await prisma.address.update({
                            where: { id: addressId },
                            data: {
                                latitude: geo.lat,
                                longitude: geo.lng,
                                ...(geo.city ? { city: geo.city } : {}),
                                ...(geo.province ? { province: geo.province } : {}),
                            },
                        }).catch((e) => orderLogger.warn({ addressId, error: e }, "No se pudo persistir geocoding de address guardada"));
                    }
                }
            }
            // 1c. addressData sin coords (user tipeó a mano): geocodificar el texto.
            if ((destLat === null || destLng === null) && addressData) {
                const geo = await geocodeAddress(
                    buildAddressQuery({ street: addressData.street, number: addressData.number, city: addressData.city, province: (addressData as { province?: string }).province })
                );
                if (geo) {
                    destLat = geo.lat;
                    destLng = geo.lng;
                    resolvedDestCity = geo.city;
                    resolvedDestProvince = geo.province;
                }
            }

            if (destLat === null || destLng === null) {
                orderLogger.warn({ userId: session.user.id, addressId, hasAddressData: !!addressData }, "No se pudo resolver destino para delivery");
                return NextResponse.json(
                    { error: "No pudimos ubicar tu dirección de entrega. Verificá la dirección e intentá de nuevo." },
                    { status: 400 }
                );
            }

            // 2. Gate de cobertura por zonas.
            const coverage = await getCoverageStatus(destLat, destLng);
            if (coverage.status === "OUT_OF_COVERAGE") {
                orderLogger.info({ destLat, destLng, userId: session.user.id }, "Order rechazado: fuera de zona de cobertura");
                return NextResponse.json(
                    {
                        error: "out_of_coverage",
                        message: "Moovy todavía no llega a esa dirección (fuera de zona de cobertura). Probá con otra dirección o elegí retiro en local.",
                    },
                    { status: 422 }
                );
            }
            if (coverage.status === "NO_ZONES") {
                orderLogger.warn({ destLat, destLng }, "Sin zonas de cobertura configuradas — fallback a radio del merchant (pintá las zonas en /ops/zonas-delivery)");
            }
        }

        // Memoización de distancia server-side por comercio. Sellers (marketplace)
        // no tienen coords en el schema → caen al fallback del cliente con warning.
        const serverDistanceCache = new Map<string, number>();
        const resolveVendorDistanceKm = async (
            vendorMerchantId: string | undefined | null,
            clientFallbackKm: number
        ): Promise<number> => {
            // Capturamos en consts locales para que TS estreche el tipo dentro del closure.
            const dLat = destLat;
            const dLng = destLng;
            if (isPickup || dLat === null || dLng === null) return clientFallbackKm;
            if (!vendorMerchantId) {
                // Seller sin coords: no podemos recalcular → usamos el cliente (con warning).
                if (clientFallbackKm > 0) orderLogger.warn({ clientFallbackKm }, "Vendor sin merchantId/coords — distancia del cliente como fallback (marketplace)");
                return clientFallbackKm;
            }
            const cached = serverDistanceCache.get(vendorMerchantId);
            if (cached !== undefined) return cached;
            const m = await prisma.merchant.findUnique({
                where: { id: vendorMerchantId },
                select: { latitude: true, longitude: true },
            });
            const valid =
                !!m && m.latitude != null && m.longitude != null &&
                m.latitude !== 0 && m.longitude !== 0 &&
                m.latitude < -20 && m.latitude > -60 &&
                m.longitude < -50 && m.longitude > -80;
            if (!valid) {
                orderLogger.warn({ vendorMerchantId }, "Merchant sin coords válidas — distancia del cliente como fallback");
                serverDistanceCache.set(vendorMerchantId, clientFallbackKm);
                return clientFallbackKm;
            }
            const road = await getRoadDistanceKm(m!.latitude as number, m!.longitude as number, dLat, dLng);
            const serverKm = road.distanceKm;
            serverDistanceCache.set(vendorMerchantId, serverKm);
            orderLogger.info(
                { vendorMerchantId, serverKm: parseFloat(serverKm.toFixed(2)), clientKm: clientFallbackKm, isRealRoadDistance: road.isRealRoadDistance },
                "Distancia recalculada server-side (cobro blindado)"
            );
            return serverKm;
        };

        // ─── DELIVERY FEE — MOTOR ÚNICO (Rama fix/biblia-motor-envio-y-comisiones) ──
        // SIEMPRE recalcular server-side con computeDeliveryFee (el MISMO motor que
        // el preview /api/delivery/calculate). NUNCA confiar en el frontend.
        //
        // computeDeliveryFee aplica la fórmula maestra completa por grupo/single:
        //   max(MIN_VEHICULO, costo_km × dist × 2.2) × clima  +  subtotal×operativo%
        // donde costo_km y MIN salen de DeliveryRate (categoría/vehículo del pedido)
        // y clima/operativo%/freeDelivery/maxDistance/riderShare de la Biblia.
        //
        // El multiplicador de ZONA se aplica MÁS ABAJO (necesita destLat/destLng),
        // por eso acá pasamos zoneMultiplier=1.0. El operationalCost por grupo se
        // captura en validatedGroupFees para que buildSubOrderFinancialSnapshot
        // derive tripCost exacto (deliveryFee − operationalCost).
        let validatedDeliveryFee = 0;
        const validatedGroupFees: Map<string, { deliveryFee: number; distanceKm: number; operationalCost: number }> = new Map();

        // Clima activo de la Biblia (se aplica DENTRO de computeDeliveryFee).
        const climateCond = opsSettings.activeClimateCondition || "normal";
        const climateMultiplier = opsSettings.climateMultipliers[climateCond] ?? 1.0;

        // Rama fix/biblia-motor-envio-y-comisiones: SURGE / demanda activa de la
        // Biblia (espejo de clima). Se aplica DENTRO de computeDeliveryFee, sobre
        // el viaje (no el operativo), igual que zona y clima.
        const demandCond = opsSettings.activeDemandCondition || "normal";
        const demandMultiplier = opsSettings.demandMultipliers[demandCond] ?? 1.0;

        // Helper: arma el bloque `biblia` que consume computeDeliveryFee.
        const bibliaForFee = {
            freeDeliveryMinimum: opsSettings.freeDeliveryMinimum,
            maxDeliveryDistance: opsSettings.maxDeliveryDistance,
            operationalCostPercent: opsSettings.operationalCostPercent,
            riderSharePercent: opsSettings.riderCommissionPercent,
            baseDeliveryFee: opsSettings.baseDeliveryFee,
            // MODELO B: globales del combustible para derivar costo_km por vehículo.
            fuelPricePerLiter: opsSettings.fuelPricePerLiter,
            maintenanceFactor: opsSettings.maintenanceFactor,
        };

        if (!isPickup) {
            // Reject negative fees
            if (deliveryFee !== undefined && deliveryFee !== null && deliveryFee < 0) {
                return NextResponse.json(
                    { error: "El costo de envío no puede ser negativo" },
                    { status: 400 }
                );
            }

            // --- Multi-vendor: validate per-group delivery fees server-side ---
            if (isMultiVendor && groups && groups.length > 1) {
                for (const group of groups) {
                    const groupKey = group.merchantId || group.sellerId || "unknown";
                    // Cobro blindado: distancia server-side (merchant.coords → dest).
                    // Sellers sin coords caen al distanceKm del cliente (fallback).
                    const groupDistKm = await resolveVendorDistanceKm(group.merchantId, group.distanceKm || 0);
                    const groupClientFee = group.deliveryFee || 0;
                    const groupSubtotal = group.items.reduce(
                        (sum: number, gi: { price: number; quantity: number }) => sum + gi.price * gi.quantity, 0
                    );

                    if (groupDistKm > 0) {
                        try {
                            // Categoría REAL del grupo → costo_km + mínimo (vehículo).
                            const groupCategory = await calculateOrderCategory(
                                group.items.map((gi: { productId: string; quantity: number; name?: string }) => ({
                                    packageCategory: resolveItemCategoryName(gi.productId),
                                    quantity: gi.quantity,
                                    name: gi.name,
                                }))
                            );
                            const serverFee = await computeDeliveryFee({
                                distanceKm: groupDistKm,
                                packageCategory: groupCategory.category,
                                orderSubtotal: groupSubtotal,
                                isPickup: false,
                                biblia: bibliaForFee,
                                zoneMultiplier: 1.0,            // zona se aplica más abajo
                                climateMultiplier,
                                demandMultiplier,               // surge (rama fix/biblia-motor-envio-y-comisiones)
                            });
                            if (serverFee && serverFee.totalCost > 0) {
                                // Log si el frontend mandó un fee distinto (posible manipulación)
                                if (groupClientFee > 0 && Math.abs(groupClientFee - serverFee.totalCost) > serverFee.totalCost * 0.25) {
                                    orderLogger.warn(
                                        { groupKey, clientFee: groupClientFee, serverFee: serverFee.totalCost, distanceKm: groupDistKm },
                                        "FRAUD ALERT: Multi-vendor group delivery fee differs >25% from server calculation"
                                    );
                                }

                                validatedGroupFees.set(groupKey, {
                                    deliveryFee: serverFee.totalCost,
                                    distanceKm: groupDistKm,
                                    operationalCost: serverFee.operationalCost,
                                });
                            } else if (serverFee && serverFee.isFreeDelivery) {
                                // Envío gratis del comercio: el cliente solo paga el operativo.
                                validatedGroupFees.set(groupKey, {
                                    deliveryFee: serverFee.totalCost,
                                    distanceKm: groupDistKm,
                                    operationalCost: serverFee.operationalCost,
                                });
                            } else {
                                // ISSUE-008: NUNCA usar fee del cliente como fallback — retornar error
                                orderLogger.error({ groupKey, clientFee: groupClientFee, distanceKm: groupDistKm }, "Server fee calc returned 0 for multi-vendor group");
                                return NextResponse.json(
                                    { error: "No pudimos calcular el envío para uno de los comercios. Intentá de nuevo." },
                                    { status: 500 }
                                );
                            }
                        } catch (calcError) {
                            // ISSUE-008: NUNCA usar fee del cliente si falla el cálculo — retornar error
                            orderLogger.error({ groupKey, clientFee: groupClientFee, error: calcError }, "Server fee calc error for multi-vendor group");
                            return NextResponse.json(
                                { error: "Error al calcular el costo de envío. Intentá de nuevo." },
                                { status: 500 }
                            );
                        }
                    } else {
                        // ISSUE-008: Sin distancia = no se puede calcular, rechazar
                        orderLogger.error({ groupKey }, "No distanceKm for multi-vendor group, cannot calculate fee");
                        return NextResponse.json(
                            { error: "Falta la distancia de envío para uno de los comercios. Volvé a seleccionar tu dirección." },
                            { status: 400 }
                        );
                    }
                }

                // Sum all validated group fees
                validatedDeliveryFee = Array.from(validatedGroupFees.values()).reduce((sum, g) => sum + g.deliveryFee, 0);

                if (validatedDeliveryFee <= 0) {
                    return NextResponse.json(
                        { error: "Se requiere el costo de envío para cada comercio en pedidos multi-vendor" },
                        { status: 400 }
                    );
                }

                orderLogger.info(
                    { groupCount: groups.length, totalDeliveryFee: validatedDeliveryFee, perGroup: Object.fromEntries(validatedGroupFees) },
                    "Multi-vendor delivery fees validated (computeDeliveryFee)"
                );
            } else {
                // --- Single-vendor ---
                // Cobro blindado (rama fix/delivery-geocoding-cobertura): la distancia
                // se RECALCULA server-side desde las coords reales del comercio y el
                // destino. Si el merchant no tiene coords válidas, cae al distanceKm
                // del cliente (con warning). Ya NO dependemos de que el navegador mande
                // una distancia > 0: con coords reales la calculamos siempre.
                const singleServerKm = await resolveVendorDistanceKm(merchantId, distanceKm || 0);
                effectiveDistanceKm = singleServerKm;
                if (singleServerKm && singleServerKm > 0) {
                    try {
                        // Categoría REAL del pedido → costo_km + mínimo (vehículo).
                        const orderCategory = await calculateOrderCategory(
                            items.map((i) => ({
                                packageCategory: resolveItemCategoryName(i.productId),
                                quantity: i.quantity,
                                name: i.name,
                            }))
                        );
                        const serverFee = await computeDeliveryFee({
                            distanceKm: singleServerKm,
                            packageCategory: orderCategory.category,
                            orderSubtotal: subtotal,
                            isPickup: false,
                            biblia: bibliaForFee,
                            zoneMultiplier: 1.0,            // zona se aplica más abajo
                            climateMultiplier,
                            demandMultiplier,               // surge (rama fix/biblia-motor-envio-y-comisiones)
                        });
                        if (serverFee && (serverFee.totalCost > 0 || serverFee.isFreeDelivery)) {
                            validatedDeliveryFee = serverFee.totalCost;
                            // Operativo del pedido (single-vendor también lo registra para el snapshot).
                            validatedGroupFees.set(merchantId || "single", {
                                deliveryFee: serverFee.totalCost,
                                distanceKm: singleServerKm,
                                operationalCost: serverFee.operationalCost,
                            });

                            // Log si el frontend mandó un fee distinto (posible manipulación)
                            if (deliveryFee && deliveryFee > 0 && Math.abs(deliveryFee - serverFee.totalCost) > serverFee.totalCost * 0.25) {
                                orderLogger.warn(
                                    { clientFee: deliveryFee, serverFee: serverFee.totalCost, distanceKm: singleServerKm, diff: Math.abs(deliveryFee - serverFee.totalCost) },
                                    "FRAUD ALERT: Client delivery fee differs >25% from server calculation. Using server fee."
                                );
                            }
                        } else {
                            return NextResponse.json(
                                { error: "No se pudo calcular el costo de envío. Intentá de nuevo." },
                                { status: 400 }
                            );
                        }
                    } catch {
                        return NextResponse.json(
                            { error: "Error al calcular el costo de envío. Intentá de nuevo." },
                            { status: 400 }
                        );
                    }
                } else {
                    // Sin distancia server-side (ni coords del comercio ni del cliente):
                    // no se puede calcular el envío → rechazar (nunca aceptar fee del cliente).
                    orderLogger.error(
                        { clientFee: deliveryFee, merchantId },
                        "No se pudo determinar la distancia server-side (merchant sin coords y cliente sin distancia)"
                    );
                    return NextResponse.json(
                        { error: "No pudimos calcular el envío. Volvé a seleccionar tu dirección e intentá de nuevo." },
                        { status: 400 }
                    );
                }
            }
        } else {
            // For pickup orders, fee must be 0
            validatedDeliveryFee = 0;
        }

        let finalTotal = subtotal + validatedDeliveryFee;

        // Validate points usage
        let validPointsUsed = 0;
        let validDiscount = 0;

        if (pointsUsed > 0) {
            const userBalance = await getUserPointsBalance(session.user.id);
            const config = await getPointsConfig();

            // Re-calculate to ensure frontend didn't tamper with values
            const maxDiscount = calculateMaxPointsDiscount(subtotal, userBalance, config);

            if (pointsUsed <= maxDiscount.pointsUsable) {
                validPointsUsed = pointsUsed;
                // Use the explicitly requested discount amount unless it exceeds calculated max
                // This handles rounding differences, but caps it at secure max
                validDiscount = Math.min(discountAmount || 0, maxDiscount.discountAmount);
            }

            finalTotal = Math.max(0, finalTotal - validDiscount);
        }

        // Get or create address
        let finalAddressId = addressId;

        if (!addressId && addressData) {
            // Create new address for this user.
            // Rama fix/delivery-geocoding-cobertura: persistimos las coords REALES
            // (geocodificadas si el cliente no las mandó) y la ciudad/provincia REALES,
            // NO las crudas del cliente ni "Ushuaia" hardcodeado. Así la dirección
            // queda con la verdad geográfica para tracking, asignación y auditoría.
            const newAddress = await prisma.address.create({
                data: {
                    userId: session.user.id,
                    label: "Entrega",
                    street: addressData.street,
                    number: addressData.number,
                    apartment: addressData.floor || null,
                    neighborhood: null,
                    city: resolvedDestCity || addressData.city || "Ushuaia",
                    province: resolvedDestProvince || "Tierra del Fuego",
                    latitude: destLat ?? addressData.latitude ?? null,
                    longitude: destLng ?? addressData.longitude ?? null,
                    isDefault: false,
                },
            });
            finalAddressId = newAddress.id;
        }

        if (!finalAddressId) {
            return NextResponse.json(
                { error: "Se requiere una dirección de entrega" },
                { status: 400 }
            );
        }

        // === ZONA EXCLUIDA + ZONA DELIVERY MULTIPLIER ===
        // Defense in depth vs /api/delivery/calculate.
        // Si el pedido es para entrega:
        //   1. Si la dirección cae en zona excluida → 422 zone_excluded.
        //   2. Sino, consultar DeliveryZone aplicable y aplicar multiplicador
        //      al delivery fee (rama feat/zonas-delivery-multiplicador).
        // El zoneSnapshot final se persiste por SubOrder más abajo.
        let zoneSnapshot: { zoneCode: string | null; zoneMultiplier: number; zoneDriverBonus: number } = {
            zoneCode: null,
            zoneMultiplier: 1.0,
            zoneDriverBonus: 0,
        };
        if (!isPickup) {
            // Rama fix/delivery-geocoding-cobertura: reusamos destLat/destLng YA
            // resueltos arriba (geocodificados si hacía falta). No re-resolvemos.
            if (destLat !== null && destLng !== null) {
                // 1. Zona excluida (sigue como estaba)
                const zones = parseExcludedZones(opsSettings.excludedZonesJson);
                const matchedZone = getExcludedZone(destLat, destLng, zones);
                if (matchedZone) {
                    orderLogger.info(
                        { zone: matchedZone.name, destLat, destLng, userId: session.user.id },
                        "Order rejected: destination in excluded zone"
                    );
                    return NextResponse.json(
                        {
                            error: "zone_excluded",
                            zone: { name: matchedZone.name, reason: matchedZone.reason },
                            message: `No realizamos envíos a ${matchedZone.name}: ${matchedZone.reason}. Probá con otra dirección o elegí retiro en local.`,
                        },
                        { status: 422 }
                    );
                }

                // 2. Zona de pricing — aplicar multiplicador al delivery fee.
                // Si la dirección no cae en ninguna zona, snapshot queda con multiplier 1.0
                // y el fee no se altera. driverBonus se persiste y se SUMA en buildSubOrderFinancialSnapshot.
                //
                // Rama fix/biblia-motor-envio-y-comisiones: el multiplicador de zona
                // se aplica SOLO al costo del VIAJE (no al operativo), respetando la
                // fórmula maestra `max(MIN, costo_km×dist×2.2) × zona × clima + op`.
                // Recalculamos por grupo manteniendo tripCost/operationalCost consistentes
                // (el snapshot deriva tripCost = deliveryFee − operationalCost).
                zoneSnapshot = await getZoneSnapshotForLocation(destLat, destLng);
                if (zoneSnapshot.zoneMultiplier !== 1.0 && validatedDeliveryFee > 0) {
                    const originalFee = validatedDeliveryFee;
                    let newTotal = 0;
                    for (const [, val] of validatedGroupFees) {
                        const groupTrip = Math.max(0, val.deliveryFee - val.operationalCost);
                        const adjustedTrip = Math.round(groupTrip * zoneSnapshot.zoneMultiplier);
                        val.deliveryFee = adjustedTrip + val.operationalCost;
                        newTotal += val.deliveryFee;
                    }
                    validatedDeliveryFee = newTotal;
                    orderLogger.info(
                        {
                            zoneCode: zoneSnapshot.zoneCode,
                            multiplier: zoneSnapshot.zoneMultiplier,
                            driverBonus: zoneSnapshot.zoneDriverBonus,
                            originalFee,
                            adjustedFee: validatedDeliveryFee,
                        },
                        "Delivery zone multiplier applied (trip-only, computeDeliveryFee)"
                    );
                }
            }
        }

        // === DRIVERS DISPONIBLES: defense in depth vs /api/delivery/availability ===
        // fix/bugs-checkout-pre-launch (Bug C): el frontend chequea drivers online al
        // MONTAR el checkout, pero si todos se desconectan después y el user completa
        // el pedido, antes se creaba igual y quedaba en estado zombie. Solo aplica a
        // delivery INMEDIATE a domicilio — pickup y SCHEDULED no requieren drivers
        // en el momento de creación.
        if (!isPickup && deliveryType !== "SCHEDULED") {
            const onlineDriversCount = await prisma.driver.count({
                where: {
                    isOnline: true,
                    availabilityStatus: "DISPONIBLE",
                },
            });
            if (onlineDriversCount === 0) {
                orderLogger.warn(
                    { userId: session.user.id, deliveryType, isPickup },
                    "Order rejected: no drivers online for IMMEDIATE delivery"
                );
                return NextResponse.json(
                    {
                        error: "no_drivers_available",
                        errorCode: "NO_DRIVERS_AVAILABLE",
                        message: "En este momento no hay repartidores disponibles. Podés programar el pedido para más tarde, retirar en el local, o pedir que te avisemos cuando haya repartidor.",
                    },
                    { status: 409 }
                );
            }
        }

        // Calculate commission using loyalty program (dynamic rates)
        // Reads from StoreSettings (Biblia Financiera) instead of MoovyConfig key-value
        let moovyCommission = 0;
        let merchantPayout = 0;
        const defaultMerchantCommission = opsSettings.defaultMerchantCommission;

        if (merchantId) {
            const merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: {
                    commissionRate: true,
                    approvalStatus: true,
                    isOpen: true,
                    minOrderAmount: true,
                    deliveryRadiusKm: true,
                    businessName: true,
                    scheduleEnabled: true,
                    scheduleJson: true,
                    loyaltyTier: true,
                }
            });

            if (!merchant) {
                return NextResponse.json(
                    { error: "Comercio no encontrado" },
                    { status: 404 }
                );
            }

            // AUDIT FIX 1.2: Validate merchant is approved
            if (merchant.approvalStatus !== "APPROVED") {
                orderLogger.warn(
                    { merchantId, approvalStatus: merchant.approvalStatus },
                    "Order attempt on non-approved merchant"
                );
                return NextResponse.json(
                    { error: "Este comercio no está habilitado para recibir pedidos" },
                    { status: 403 }
                );
            }

            // Validate merchant can receive orders (pausa manual + horario obligatorio)
            // Si el merchant no configuró horario, se aplica el default (lun-vie 9-21, sáb 10-14)
            if (deliveryType !== "SCHEDULED") {
                const scheduleCheck = validateMerchantCanReceiveOrders(merchant);
                if (!scheduleCheck.allowed) {
                    return NextResponse.json(
                        { error: scheduleCheck.reason },
                        { status: 400 }
                    );
                }
            } else {
                // Para pedidos programados: solo verificar pausa manual
                // El slot ya se valida contra el horario en la sección de scheduled delivery
                if (!merchant.isOpen) {
                    return NextResponse.json(
                        { error: `${merchant.businessName || "El comercio"} está cerrado en este momento` },
                        { status: 400 }
                    );
                }
            }

            // AUDIT FIX 2.2: Validate minimum order amount
            if (merchant.minOrderAmount && subtotal < merchant.minOrderAmount) {
                return NextResponse.json(
                    { error: `El pedido mínimo para ${merchant.businessName || "este comercio"} es de $${merchant.minOrderAmount}` },
                    { status: 400 }
                );
            }

            // AUDIT FIX 2.1: Validate delivery radius
            // Rama fix/delivery-geocoding-cobertura: el radio se valida contra la
            // distancia SERVER-SIDE (no la del cliente). effectiveDistanceKm ya la
            // tiene en single-vendor; si no, la resolvemos (memoizada) para merchantId.
            if (!isPickup && merchant.deliveryRadiusKm) {
                const radiusDistanceKm = effectiveDistanceKm ?? await resolveVendorDistanceKm(merchantId, distanceKm || 0);
                if (radiusDistanceKm && radiusDistanceKm > merchant.deliveryRadiusKm) {
                    return NextResponse.json(
                        { error: `Tu dirección está fuera del radio de entrega de ${merchant.businessName || "este comercio"} (máx ${merchant.deliveryRadiusKm}km)` },
                        { status: 400 }
                    );
                }
            }

            // MERCHANT LOYALTY: Get effective commission from loyalty tier.
            // ISSUE-020: getEffectiveCommission puede devolver 0 legítimo durante
            // el mes 1 gratis (Biblia v3). Usamos ?? en vez de || para no tratar
            // 0 como falsy y caer al fallback del 8%.
            const loyaltyRate = await getEffectiveCommission(merchantId);
            const rate = loyaltyRate ?? merchant.commissionRate ?? defaultMerchantCommission;
            moovyCommission = subtotal * (rate / 100);
            merchantPayout = subtotal - moovyCommission;

            orderLogger.info(
                { merchantId, tier: merchant.loyaltyTier, rate, moovyCommission, merchantPayout },
                "Commission calculated with loyalty tier"
            );
        }

        // AUDIT FIX 1.4+1.5: Pre-validate coupon with maxUsesPerUser check
        // Actual recording moved inside main transaction to prevent race conditions
        let validCouponCode: string | undefined;
        if (couponCode) {
            try {
                const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
                if (coupon && coupon.isActive) {
                    const now = new Date();
                    const notExpired = !coupon.validUntil || coupon.validUntil > now;
                    const notExhausted = !coupon.maxUses || coupon.usedCount < coupon.maxUses;

                    // Check per-user limit
                    let perUserOk = true;
                    if (coupon.maxUsesPerUser) {
                        const userUsageCount = await prisma.couponUsage.count({
                            where: {
                                couponId: coupon.id,
                                userId: session.user.id,
                            },
                        });
                        perUserOk = userUsageCount < coupon.maxUsesPerUser;
                    }

                    if (notExpired && notExhausted && perUserOk) {
                        validCouponCode = couponCode;
                    } else if (!perUserOk) {
                        orderLogger.info(
                            { couponCode, userId: session.user.id },
                            "Coupon per-user limit reached"
                        );
                    }
                }
            } catch (e) {
                orderLogger.warn({ couponCode }, "Coupon validation failed, proceeding without coupon");
            }
        }

        // Create order with items in a transaction
        // BUG #4 FIX: Move points deduction INSIDE transaction to prevent order with discount but no points deduction
        let pointsResult = { earned: 0, spent: 0 };
        const order = await prisma.$transaction(async (tx) => {
            // --- PRE-FLIGHT STOCK VALIDATION ---
            // Check all items have sufficient stock BEFORE creating the order
            const stockErrors: string[] = [];
            for (const item of items) {
                const isListing = item.type === "listing";
                if (isListing) {
                    const listing = await tx.listing.findUnique({
                        where: { id: item.productId },
                        select: { id: true, title: true, stock: true, isActive: true },
                    });
                    if (!listing) {
                        stockErrors.push(`Publicación "${item.name}" ya no existe`);
                    } else if (!listing.isActive) {
                        stockErrors.push(`"${item.name}" ya no está disponible`);
                    } else if (listing.stock < item.quantity) {
                        stockErrors.push(
                            listing.stock === 0
                                ? `"${item.name}" está agotado`
                                : `"${item.name}" solo tiene ${listing.stock} unidad(es) disponible(s)`
                        );
                    }
                } else {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { id: true, name: true, stock: true, isActive: true },
                    });
                    if (!product) {
                        stockErrors.push(`Producto "${item.name}" ya no existe`);
                    } else if (!product.isActive) {
                        stockErrors.push(`"${item.name}" ya no está disponible`);
                    } else if (product.stock < item.quantity) {
                        stockErrors.push(
                            product.stock === 0
                                ? `"${item.name}" está agotado`
                                : `"${item.name}" solo tiene ${product.stock} unidad(es) disponible(s)`
                        );
                    }
                }
            }

            if (stockErrors.length > 0) {
                throw new Error(`STOCK_ERROR:${JSON.stringify(stockErrors)}`);
            }

            // --- SELF-PURCHASE PREVENTION (ISSUE-003) ---
            // Block buyers from purchasing their own products/listings (anti-fraud: prevents points farming)
            for (const item of items) {
                const isListing = item.type === "listing";
                if (isListing) {
                    const listingOwner = await tx.listing.findUnique({
                        where: { id: item.productId },
                        select: { seller: { select: { userId: true } } },
                    });
                    if (listingOwner?.seller.userId === session.user.id) {
                        throw new Error("SELF_PURCHASE");
                    }
                } else {
                    const productOwner = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { merchant: { select: { ownerId: true } } },
                    });
                    if (productOwner?.merchant?.ownerId === session.user.id) {
                        throw new Error("SELF_PURCHASE");
                    }
                }
            }

            // Validate scheduled slot capacity
            const isScheduled = deliveryType === "SCHEDULED";
            if (isScheduled && scheduledSlotStart && scheduledSlotEnd) {
                const slotStart = new Date(scheduledSlotStart);
                const slotEnd = new Date(scheduledSlotEnd);

                // Count existing orders that OVERLAP with the requested slot (not just exact match)
                // Un pedido existente se solapa si: empieza antes de que termine el nuevo Y termina después de que empiece el nuevo
                const existingOrdersInSlot = await tx.order.count({
                    where: {
                        deliveryType: "SCHEDULED",
                        scheduledSlotStart: { lt: slotEnd },   // empieza antes de que termine el solicitado
                        scheduledSlotEnd: { gt: slotStart },   // termina después de que empiece el solicitado
                        status: { notIn: ["CANCELLED"] },
                        deletedAt: null,
                    },
                });

                // Configurable via Biblia Financiera OPS panel (StoreSettings.maxOrdersPerSlot)
                const MAX_ORDERS_PER_SLOT = opsSettings.maxOrdersPerSlot;
                if (existingOrdersInSlot >= MAX_ORDERS_PER_SLOT) {
                    throw new Error("SLOT_FULL:El horario seleccionado ya no tiene disponibilidad. Por favor elegí otro horario.");
                }

                // Validate slot is within vendor's operating hours
                // Convert JS day (0=Sun) to schedule format (1=Mon..7=Sun)
                const jsDay = slotStart.getDay();
                const scheduleDay = jsDay === 0 ? "7" : String(jsDay);
                const slotHour = slotStart.getHours();

                // Check primary merchant schedule if available
                if (merchantId) {
                    const merchant = await tx.merchant.findUnique({
                        where: { id: merchantId },
                        select: { scheduleEnabled: true, scheduleJson: true, name: true },
                    });
                    if (merchant?.scheduleEnabled && merchant.scheduleJson) {
                        try {
                            const schedule = JSON.parse(merchant.scheduleJson);
                            const daySchedule = schedule[scheduleDay];
                            if (!daySchedule) {
                                throw new Error(`SLOT_FULL:${merchant.name} no opera ese día. Elegí otro horario.`);
                            }
                            const [openH] = daySchedule.open.split(":").map(Number);
                            const [closeH] = daySchedule.close.split(":").map(Number);
                            if (slotHour < openH || slotHour >= closeH) {
                                throw new Error(`SLOT_FULL:El horario seleccionado está fuera del horario de ${merchant.name} (${daySchedule.open}-${daySchedule.close}).`);
                            }
                        } catch (e: any) {
                            if (e?.message?.startsWith("SLOT_FULL:")) throw e;
                            // Invalid JSON, skip validation
                        }
                    }
                }
            }

            // --- PIN DOBLE DE ENTREGA (ISSUE-001) ---
            // Generar par {pickupPin, deliveryPin} para pedidos con delivery (no pickup).
            // - Single-vendor: PINs en Order (Order es la unidad de entrega)
            // - Multi-vendor: PINs por SubOrder (cada SubOrder tiene su propio driver)
            // - Pickup: no hay driver, no se necesitan PINs
            const orderPinPair = (!isPickup && !isMultiVendor) ? generatePinPair() : null;

            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    userId: session.user.id,
                    addressId: finalAddressId,
                    merchantId: merchantId || null,
                    status: isScheduled ? "SCHEDULED" : "PENDING",
                    paymentStatus: "PENDING",
                    paymentMethod: paymentMethod || "cash",
                    subtotal,
                    deliveryFee: validatedDeliveryFee,
                    discount: validDiscount,
                    total: isPickup ? Math.max(0, subtotal - validDiscount) : finalTotal,
                    isPickup: isPickup || false,
                    // Rama fix/delivery-geocoding-cobertura: persistimos la distancia
                    // SERVER-SIDE (snapshot real), no la del navegador.
                    distanceKm: isPickup ? null : (effectiveDistanceKm ?? distanceKm ?? null),
                    deliveryNotes: deliveryNotes || null,
                    customerNotes: customerNotes || null,
                    moovyCommission,
                    merchantPayout,
                    commissionPaid: false,
                    isMultiVendor,
                    deliveryType: isScheduled ? "SCHEDULED" : "IMMEDIATE",
                    scheduledSlotStart: scheduledSlotStart ? new Date(scheduledSlotStart) : null,
                    scheduledSlotEnd: scheduledSlotEnd ? new Date(scheduledSlotEnd) : null,
                    // PIN doble: solo para single-vendor con delivery
                    pickupPin: orderPinPair?.pickupPin || null,
                    deliveryPin: orderPinPair?.deliveryPin || null,
                },
            });

            // Create order items
            for (const item of items) {
                const isListing = item.type === "listing";
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: isListing ? null : item.productId,
                        listingId: isListing ? item.productId : null,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        variantName: item.variantName || null,
                        subtotal: item.price * item.quantity,
                        // Rama fix/asignacion-match-vehiculo: persistir la categoría de
                        // paquete del item (MICRO..XL). Este es el campo que lee el motor
                        // de asignación (calculateOrderCategory en assignment-engine) para
                        // decidir qué vehículos pueden llevar el pedido. Antes quedaba null
                        // y todo se trataba como MICRO. Snapshot inmutable del pedido.
                        packageCategoryName: resolveItemCategoryName(item.productId),
                    },
                });

                // BUG #8 FIX: Update stock and verify it doesn't go negative
                if (!item.type || item.type === "product") {
                    const updatedProduct = await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity },
                        },
                        select: { stock: true },
                    });

                    // Verify stock is not negative (race condition prevention)
                    if (updatedProduct.stock < 0) {
                        throw new Error(`STOCK_ERROR:Insuficiente stock para "${item.name}" después de descuento`);
                    }
                } else if (item.type === "listing") {
                    const updatedListing = await tx.listing.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity },
                        },
                        select: { stock: true },
                    });

                    // Verify stock is not negative (race condition prevention)
                    if (updatedListing.stock < 0) {
                        throw new Error(`STOCK_ERROR:Insuficiente stock para "${item.name}" después de descuento`);
                    }
                }
            }

            // Create SubOrders if multi-vendor or if groups are provided
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    const groupSubtotal = group.items.reduce(
                        (sum: number, gi: { price: number; quantity: number }) => sum + gi.price * gi.quantity,
                        0
                    );

                    let groupCommission = 0;
                    let groupPayout = 0;
                    // Rama refactor/separar-motor-y-finanzas: snapshot del rate + source
                    // que se persiste en SubOrder.merchantCommissionRate / Source.
                    // NUNCA recalcular sobre orders cerradas.
                    let snapshotRate: number | undefined;
                    let snapshotSource: import("@/lib/merchant-loyalty").CommissionSource | undefined;

                    // Calculate commission for merchant groups.
                    // ISSUE-020: pasamos por getEffectiveCommissionWithSource() para que
                    // multi-vendor respete el loyalty tier y el mes 1 gratis,
                    // capturando además el origen del rate para auditoría.
                    if (group.merchantId) {
                        const effective = await getEffectiveCommissionWithSource(group.merchantId);
                        const gMerchant = await tx.merchant.findUnique({
                            where: { id: group.merchantId },
                            select: { commissionRate: true },
                        });
                        const rate = effective.rate ?? gMerchant?.commissionRate ?? defaultMerchantCommission;
                        groupCommission = groupSubtotal * (rate / 100);
                        groupPayout = groupSubtotal - groupCommission;
                        snapshotRate = rate;
                        snapshotSource = effective.source;
                    } else if (group.sellerId) {
                        // Seller commission from Biblia Financiera (StoreSettings)
                        const sellerRate = opsSettings.defaultSellerCommission;
                        groupCommission = groupSubtotal * (sellerRate / 100);
                        groupPayout = groupSubtotal - groupCommission;
                    }

                    // Resolve per-group delivery fee (multi-vendor or single)
                    const groupKey = group.merchantId || group.sellerId || "unknown";
                    const groupFeeData = validatedGroupFees.get(groupKey);
                    const groupDeliveryFee = isPickup ? 0 : (groupFeeData?.deliveryFee || 0);

                    // Rama refactor/separar-motor-y-finanzas: snapshot financiero del SubOrder.
                    // Single-vendor no setea operationalCost en el Map (ver bloque else de
                    // surcharge), así que lo derivamos de subtotal × opCostPct si falta.
                    // Si es pickup, no hay operativo ni viaje.
                    const opCostPctForSnapshot = opsSettings.operationalCostPercent || 0;
                    const groupOperationalCost = isPickup
                        ? 0
                        : (groupFeeData?.operationalCost ?? Math.round(groupSubtotal * (opCostPctForSnapshot / 100)));

                    const financialSnapshot = await buildSubOrderFinancialSnapshot({
                        subtotal: groupSubtotal,
                        deliveryFee: groupDeliveryFee,
                        operationalCost: groupOperationalCost,
                        merchantId: group.merchantId || null,
                        sellerId: group.sellerId || null,
                        sellerCommissionRate: opsSettings.defaultSellerCommission,
                        // Rama fix/biblia-motor-envio-y-comisiones: riderShare de la Biblia
                        // (antes el helper usaba 80 fijo por default). El % del viaje que
                        // cobra el repartidor ahora es 100% config-driven.
                        riderSharePercent: opsSettings.riderCommissionPercent,
                        precomputedMerchantRate: snapshotRate,
                        precomputedMerchantSource: snapshotSource,
                        // Rama feat/zonas-delivery-multiplicador: snapshot de zona del destino.
                        // El bonus se SUMA al driverPayoutAmount internamente.
                        zoneSnapshot: !isPickup ? zoneSnapshot : undefined,
                    });

                    // PIN doble por SubOrder: solo para multi-vendor con delivery.
                    // Cada SubOrder tiene su propio driver → necesita su propio par de PINs
                    // independiente del resto.
                    const subOrderPinPair = (!isPickup && isMultiVendor) ? generatePinPair() : null;

                    const subOrder = await tx.subOrder.create({
                        data: {
                            orderId: newOrder.id,
                            merchantId: group.merchantId || null,
                            sellerId: group.sellerId || null,
                            status: "PENDING",
                            subtotal: groupSubtotal,
                            deliveryFee: groupDeliveryFee,
                            total: groupSubtotal + groupDeliveryFee,
                            moovyCommission: groupCommission,
                            sellerPayout: groupPayout,
                            // Rama refactor/separar-motor-y-finanzas: snapshot inmutable
                            // del Motor Logístico + Reparto Financiero. payouts.ts consume
                            // driverPayoutAmount cuando != null (en vez de aproximar al 70%).
                            tripCost: financialSnapshot.tripCost,
                            operationalCost: financialSnapshot.operationalCost,
                            driverPayoutAmount: financialSnapshot.driverPayoutAmount,
                            merchantCommissionRate: financialSnapshot.merchantCommissionRate,
                            merchantCommissionSource: financialSnapshot.merchantCommissionSource,
                            // Rama feat/zonas-delivery-multiplicador: snapshot inmutable de zona
                            // (audit AAIP/AFIP, NUNCA recalcular retroactivo si se mueven polígonos).
                            zoneCode: financialSnapshot.zoneCode,
                            zoneMultiplier: financialSnapshot.zoneMultiplier,
                            zoneDriverBonus: financialSnapshot.zoneDriverBonus,
                            // PIN doble: solo para multi-vendor con delivery
                            pickupPin: subOrderPinPair?.pickupPin || null,
                            deliveryPin: subOrderPinPair?.deliveryPin || null,
                        },
                    });

                    // Link OrderItems to this SubOrder
                    // BUG #12 FIX: Use both productId/listingId AND type to avoid ambiguity between merchant products and marketplace listings
                    for (const gi of group.items) {
                        const isListing = gi.type === "listing";
                        // For listings, productId is stored in listingId; for products, it's in productId
                        const whereClause = isListing
                            ? { orderId: newOrder.id, listingId: gi.productId, subOrderId: null }
                            : { orderId: newOrder.id, productId: gi.productId, subOrderId: null };

                        await tx.orderItem.updateMany({
                            where: whereClause,
                            data: { subOrderId: subOrder.id },
                        });
                    }
                }
            }

            // BUG #4 FIX: Deduct points INSIDE the transaction
            // Process points (deduct used points and earn new points atomically)
            if (validPointsUsed > 0) {
                // Deduct points used for discount
                const user = await tx.user.findUnique({
                    where: { id: session.user.id },
                    select: { pointsBalance: true }
                });

                if (user) {
                    const newBalance = (user.pointsBalance || 0) - validPointsUsed;
                    if (newBalance < 0) {
                        throw new Error("Insufficient points for discount");
                    }

                    await tx.user.update({
                        where: { id: session.user.id },
                        data: {
                            pointsBalance: newBalance,
                            updatedAt: new Date(),
                            // Reset el flag del cron de puntos por vencer: el user volvió a usar la app.
                            pointsExpiryNotifiedAt: null,
                        }
                    });

                    await tx.pointsTransaction.create({
                        data: {
                            userId: session.user.id,
                            orderId: newOrder.id,
                            type: "REDEEM",
                            amount: -validPointsUsed,
                            balanceAfter: newBalance,
                            description: `Canjeaste ${validPointsUsed} puntos en tu pedido`,
                        }
                    });

                    pointsResult.spent = validPointsUsed;
                }
            }

            // AUDIT FIX 1.5: Record coupon usage INSIDE the main transaction
            // Prevents race condition where two orders use the same coupon simultaneously
            if (validCouponCode) {
                const coupon = await tx.coupon.findUnique({
                    where: { code: validCouponCode },
                    select: { id: true, maxUses: true, usedCount: true, maxUsesPerUser: true },
                });

                if (coupon) {
                    // Double-check limits inside transaction (serializable guarantee)
                    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
                        orderLogger.warn({ couponCode: validCouponCode }, "Coupon exhausted during transaction");
                    } else {
                        // Double-check per-user limit inside transaction
                        let perUserOk = true;
                        if (coupon.maxUsesPerUser) {
                            const userUsageCount = await tx.couponUsage.count({
                                where: { couponId: coupon.id, userId: session.user.id },
                            });
                            perUserOk = userUsageCount < coupon.maxUsesPerUser;
                        }

                        if (perUserOk) {
                            await tx.couponUsage.create({
                                data: {
                                    couponId: coupon.id,
                                    userId: session.user.id,
                                    orderId: newOrder.id,
                                },
                            });
                            await tx.coupon.update({
                                where: { id: coupon.id },
                                data: { usedCount: { increment: 1 } },
                            });
                        }
                    }
                }
            }

            return newOrder;
        }, {
            // Serializable previene race conditions de stock:
            // dos órdenes simultáneas no pueden leer el mismo stock y decrementar ambas
            isolationLevel: "Serializable",
            maxWait: 10000,  // 10s max wait para adquirir el lock
            timeout: 30000,  // 30s max para la transacción completa
        });

        // PIN DOBLE: audit log (sin exponer PINs reales)
        if (!isPickup) {
            orderLogger.info(
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    isMultiVendor,
                    pinsGeneratedAt: isMultiVendor ? "subOrder" : "order",
                    pinsCount: isMultiVendor ? (groups?.length || 0) * 2 : 2,
                },
                "PIN doble generado para pedido"
            );
        }

        // FIX 2026-04-15: NO se otorgan puntos EARN en la creaci\u00f3n de la orden.
        // Los puntos se otorgan SOLO cuando el pedido pasa a DELIVERED (Biblia Financiera v3).
        // El EARN se ejecuta en src/app/api/driver/orders/[id]/status/route.ts via awardOrderPointsIfDelivered().
        // activatePendingBonuses tambi\u00e9n se mueve a DELIVERED (ah\u00ed corresponde: el referido se "completa"
        // cuando hace su primer DELIVERED, no cuando crea el carrito).
        // El REDEEM de puntos canjeados s\u00ed se mantiene dentro de la transacci\u00f3n de creaci\u00f3n porque
        // el descuento se aplica al total del pago (ver l\u00edneas ~780).
        if (validPointsUsed > 0) {
            pointsResult.spent = validPointsUsed;
            // Persistir en Order para poder revertir en cancel/reject/refund
            try {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { pointsUsed: validPointsUsed },
                });
            } catch (persistError) {
                orderLogger.error({ orderId: order.id, error: persistError }, "Error persisting pointsUsed on order");
            }
        }

        // AUDIT FIX 1.5: Coupon usage recording moved inside main transaction above
        // This eliminates the race condition where order gets discount but coupon isn't recorded

        // --- MERCADOPAGO: Create preference and return early ---
        if (paymentMethod === "mercadopago") {
            try {
                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || "https://somosmoovy.com";

                // Fetch order with relations needed for preference
                const orderForPref = await prisma.order.findUnique({
                    where: { id: order.id },
                    include: {
                        items: { select: { id: true, name: true, price: true, quantity: true } },
                        subOrders: { select: { moovyCommission: true, merchantId: true, sellerId: true } },
                        user: { select: { name: true, email: true } },
                    },
                });

                if (!orderForPref) throw new Error("Order not found after creation");

                // Split payment: resolve vendor access token first (needed to decide marketplace_fee)
                let vendorAccessToken: string | null = null;
                if (!isMultiVendor) {
                    if (orderForPref.subOrders.length === 1) {
                        const sub = orderForPref.subOrders[0];
                        if (sub.merchantId) {
                            const m = await prisma.merchant.findUnique({
                                where: { id: sub.merchantId },
                                select: { mpAccessToken: true },
                            });
                            vendorAccessToken = m?.mpAccessToken ? decrypt(m.mpAccessToken) : null;
                        } else if (sub.sellerId) {
                            const s = await prisma.sellerProfile.findUnique({
                                where: { id: sub.sellerId },
                                select: { mpAccessToken: true },
                            });
                            vendorAccessToken = s?.mpAccessToken ? decrypt(s.mpAccessToken) : null;
                        }
                    } else if (merchantId && orderForPref.subOrders.length === 0) {
                        const m = await prisma.merchant.findUnique({
                            where: { id: merchantId },
                            select: { mpAccessToken: true },
                        });
                        vendorAccessToken = m?.mpAccessToken ? decrypt(m.mpAccessToken) : null;
                    }
                }

                // marketplace_fee only valid for split payments (vendor's token)
                // Passing it with Moovy's own token causes a 400 from the MP API
                // fix/split-pagos-token-vendedor: redondear a centavos (MP rechaza
                // montos con >2 decimales con 400) y clamp [0, total-1] para que el
                // fee nunca sea ≥ al total ni negativo.
                // fix/split-fee-incluye-envio (Grupo C): Moovy cobra el envío. El
                // marketplace_fee = comisión del comercio + delivery fee completo. Así
                // el comercio recibe solo su producto (menos comisión) y Moovy recibe
                // la plata del envío para pagarle al repartidor (80% del viaje, vía
                // PayoutBatch) y quedarse el 20% + operativo. La contabilidad interna
                // (order-totals.ts) ya asumía este flujo; esto alinea el reparto físico.
                // fix/split-mp-reserva-y-operativo (PASO 1): el marketplace_fee reserva
                // la comisión de MP para que al comercio (que cobra) le quede SIEMPRE su
                // producto → MP nunca rechaza (era la causa del "Algo salió mal / CPT01").
                // grossUp=false: NO tocamos el total del pedido (no toca el webhook).
                // Moovy absorbe la comisión de MP por ahora; el buffer al comprador
                // (Moovy cobra el envío completo) es el PASO 2, con test real previo.
                const commissionSum = orderForPref.subOrders.reduce(
                    (s, sub) => s + (sub.moovyCommission || 0),
                    0
                );
                const mpReservePercent = await getMpReservePercent();
                // Rama fix/split-mp-grossup-comprador (PASO 2): grossUp=true → el
                // comprador cubre la comisión de MP (7,6% acreditación al instante),
                // embebida en el envío. Además, el descuento (cupón/puntos) entra en
                // chargedTotal vía netTarget, así que ahora SÍ queda aplicado al cobro
                // (antes la preferencia cobraba el precio sin descuento → amount_mismatch).
                const mpSplit = computeMpSplit({
                    subtotal: orderForPref.subtotal,
                    deliveryFee: orderForPref.deliveryFee || 0,
                    commission: commissionSum,
                    discount: orderForPref.discount || 0,
                    mpReservePercent,
                    // Gross-up SOLO si hay envío con costo: ahí se embebe la comisión de
                    // MP dentro del envío. En retiro o envío gratis (deliveryFee = 0) no
                    // hay dónde esconderla sin una línea de "servicio" aparte (lo legalmente
                    // riesgoso), así que en esos casos Moovy absorbe MP (minoría, ~break-even).
                    grossUp: (orderForPref.deliveryFee || 0) > 0,
                });
                const marketplaceFee = vendorAccessToken ? mpSplit.marketplaceFee : 0;
                if (vendorAccessToken && mpSplit.notes.length > 0) {
                    orderLogger.warn(
                        { orderId: order.id, mpReservePercent, notes: mpSplit.notes },
                        "MP split: tope de reserva activado (Moovy cobra menos para que el comercio cobre su producto)"
                    );
                }
                // El comprador paga chargedTotal = (subtotal + envío − descuento) / (1 − reservaMP).
                // order.total pasa a ser ESE número: la preferencia (buildPreferenceBody
                // totaliza order.total) y el webhook (valida transaction_amount vs order.total)
                // quedan alineados al peso. El repartidor y el comercio NO se afectan: usan
                // el snapshot inmutable (tripCost / comisión), nunca order.total.
                const chargedTotal = Math.round(mpSplit.chargedTotal);
                if (chargedTotal !== orderForPref.total) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { total: chargedTotal },
                    });
                    orderForPref.total = chargedTotal;
                    order.total = chargedTotal;
                }
                const prefBody = buildPreferenceBody(orderForPref, baseUrl, marketplaceFee);

                const preference = vendorAccessToken
                    ? await createVendorPreference(vendorAccessToken, prefBody)
                    : await preferenceApi.create({ body: prefBody });

                // Update order with preference ID and AWAITING_PAYMENT status
                // Scheduled orders keep their SCHEDULED status — payment is still captured
                // fix/mp-return-confirmacion (2026-04-26): también seteamos
                // paymentStatus="AWAITING_PAYMENT" para que el polling client
                // (que filtra por paymentStatus) auto-confirme via /api/payments/[id]/status.
                // Antes quedaba en "PENDING" y ningún reconciler lo atrapaba hasta el cron.
                const mpStatus = order.deliveryType === "SCHEDULED" ? "SCHEDULED" : "AWAITING_PAYMENT";
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        mpPreferenceId: preference.id || null,
                        status: mpStatus,
                        paymentStatus: "AWAITING_PAYMENT",
                    },
                });

                // Notify vendors via socket (same as cash flow below)
                try {
                    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
                    const socketHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` };
                    const socketData = { orderId: order.id, orderNumber: order.orderNumber, total: order.total, status: "AWAITING_PAYMENT", userId: session.user.id };

                    if (groups && groups.length > 0) {
                        for (const group of groups) {
                            if (group.merchantId) {
                                await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: `merchant:${group.merchantId}`, data: socketData }) });
                            }
                            if (group.sellerId) {
                                await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: `seller:${group.sellerId}`, data: socketData }) });
                            }
                        }
                    } else if (merchantId) {
                        await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: `merchant:${merchantId}`, data: socketData }) });
                    }
                    await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: "admin:orders", data: { ...socketData, merchantId, isMultiVendor } }) });
                } catch (e) {
                    orderLogger.error({ orderId: order.id, error: e }, "Failed to notify new MP order via socket");
                }

                // Push notify vendors about new MP order (non-blocking)
                try {
                    const buyerName = session.user.name || undefined;
                    if (groups && groups.length > 0) {
                        for (const group of groups) {
                            if (group.merchantId) {
                                notifyMerchant(group.merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
                                // ISSUE-031: bienvenida one-shot al primer pedido de este merchant.
                                tryNotifyMerchantFirstOrderWelcome(group.merchantId, order.orderNumber, order.total);
                            }
                            if (group.sellerId) notifySeller(group.sellerId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify seller"));
                        }
                    } else if (merchantId) {
                        notifyMerchant(merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
                        // ISSUE-031: bienvenida one-shot al primer pedido de este merchant.
                        tryNotifyMerchantFirstOrderWelcome(merchantId, order.orderNumber, order.total);
                    }
                } catch (e) {
                    orderLogger.error({ orderId: order.id, error: e }, "Failed to notify vendor (MP flow)");
                }

                // Always use init_point — MP auto-redirects to sandbox when using TEST- credentials.
                // sandbox_init_point causes ERR_TOO_MANY_REDIRECTS with test users.
                const initPoint = preference.init_point;

                // NO email — will be sent by webhook when payment is confirmed
                return NextResponse.json({
                    success: true,
                    order: { id: order.id, orderNumber: order.orderNumber, total: order.total, status: "AWAITING_PAYMENT" },
                    points: pointsResult,
                    preferenceId: preference.id,
                    initPoint,
                    sandboxInitPoint: preference.sandbox_init_point,
                }, { status: 201 });

            } catch (mpError) {
                orderLogger.error({ orderId: order.id, error: mpError }, "Error creating preference");
                // Cancel the order since payment can't proceed
                await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelReason: "Error al crear preferencia de pago" } });
                return NextResponse.json({ error: "Error al iniciar el pago con MercadoPago" }, { status: 500 });
            }
        }

        // --- REAL-TIME: Notify merchants/sellers and admin about new order ---
        try {
            const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

            // Notify each vendor group
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    if (group.merchantId) {
                        await fetch(`${socketUrl}/emit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                            body: JSON.stringify({
                                event: "new_order",
                                room: `merchant:${group.merchantId}`,
                                data: {
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                    total: order.total,
                                    status: order.status,
                                    userId: session.user.id,
                                }
                            })
                        });
                    }
                    if (group.sellerId) {
                        await fetch(`${socketUrl}/emit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                            body: JSON.stringify({
                                event: "new_order",
                                room: `seller:${group.sellerId}`,
                                data: {
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                    total: order.total,
                                    status: order.status,
                                    userId: session.user.id,
                                }
                            })
                        });
                    }
                }
            } else if (merchantId) {
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                    body: JSON.stringify({
                        event: "new_order",
                        room: `merchant:${merchantId}`,
                        data: {
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            total: order.total,
                            status: order.status,
                            userId: session.user.id,
                        }
                    })
                });
            }

            // Always notify admin
            await fetch(`${socketUrl}/emit`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                body: JSON.stringify({
                    event: "new_order",
                    room: "admin:orders",
                    data: {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        total: order.total,
                        status: order.status,
                        merchantId,
                        isMultiVendor,
                        userId: session.user.id,
                    }
                })
            });

            orderLogger.info({ orderId: order.id, orderNumber: order.orderNumber }, "New order notified via socket");
        } catch (e) {
            orderLogger.error({ orderId: order.id, error: e }, "Failed to notify new order via socket");
        }

        // --- PUSH: Notify merchants/sellers about new order ---
        try {
            const buyerName = session.user.name || undefined;
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    if (group.merchantId) {
                        notifyMerchant(group.merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
                        // ISSUE-031: bienvenida one-shot al primer pedido de este merchant.
                        tryNotifyMerchantFirstOrderWelcome(group.merchantId, order.orderNumber, order.total);
                    }
                    if (group.sellerId) {
                        notifySeller(group.sellerId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify seller"));
                    }
                }
            } else if (merchantId) {
                notifyMerchant(merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
                // ISSUE-031: bienvenida one-shot al primer pedido de este merchant.
                tryNotifyMerchantFirstOrderWelcome(merchantId, order.orderNumber, order.total);
            }
        } catch (e) {
            orderLogger.error({ orderId: order.id, error: e }, "Failed to notify vendor");
        }

        // --- EMAIL: Send order confirmation to customer ---
        try {
            // we need the full address string for the email
            let addressString = "Dirección no especificada";
            if (addressId) {
                const addr = await prisma.address.findUnique({ where: { id: addressId } });
                if (addr) {
                    addressString = `${addr.street} ${addr.number}${addr.apartment ? `, ${addr.apartment}` : ''}, ${addr.city}`;
                }
            } else if (addressData) {
                addressString = `${addressData.street} ${addressData.number}${addressData.floor ? `, ${addressData.floor}` : ''}, ${addressData.city || 'Ushuaia'}`;
            }

            sendOrderConfirmationEmail({
                email: session.user.email || "",
                customerName: session.user.name || "Cliente",
                orderNumber: order.orderNumber,
                items: items, // use items from request which already has names/prices
                total: order.total,
                subtotal: subtotal,
                deliveryFee: order.deliveryFee,
                discount: order.discount,
                paymentMethod: paymentMethod,
                address: addressString,
                isPickup: isPickup || false
            });
        } catch (emailError) {
            orderLogger.error({ orderId: order.id, error: emailError }, "Failed to trigger confirmation email");
        }

        // BUG #13 FIX: Add flag to indicate cash orders need merchant confirmation
        // Known limitation: Cash orders stay PENDING indefinitely if merchant doesn't confirm.
        // This should be handled by a cron job that auto-cancels after merchant_confirm_timeout.
        // See: src/app/api/cron/assignment-timeout or similar
        const requiresMerchantConfirmation = paymentMethod === "cash" || paymentMethod === undefined;

        // Log order creation activity (fire-and-forget)
        const { ipAddress, userAgent } = extractRequestInfo(request);
        logUserActivity({
            userId: session.user.id,
            action: ACTIVITY_ACTIONS.ORDER_CREATED,
            entityType: "Order",
            entityId: order.id,
            metadata: { orderNumber: order.orderNumber, total: order.total, isMultiVendor },
            ipAddress,
            userAgent,
        }).catch((err) => orderLogger.error({ error: err }, "Failed to log order creation activity"));

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: order.total,
                status: order.status,
            },
            points: pointsResult,
            requiresMerchantConfirmation,
        }, { status: 201 });

    } catch (error: any) {
        // Handle stock validation errors (thrown from inside transaction)
        if (error?.message?.startsWith("STOCK_ERROR:")) {
            status = "409";
            const message = error.message.replace("STOCK_ERROR:", "");
            // Check if it's a JSON array (pre-flight validation) or a string message (post-decrement)
            try {
                const stockErrors = JSON.parse(message);
                return NextResponse.json(
                    { error: "Algunos productos no tienen stock suficiente", stockErrors },
                    { status: 409 }
                );
            } catch {
                // It's a simple error message from post-decrement validation
                return NextResponse.json(
                    { error: message || "Insuficiente stock en algunos productos" },
                    { status: 409 }
                );
            }
        }

        if (error?.message === "SELF_PURCHASE") {
            return NextResponse.json(
                { error: "No podés comprar tus propias publicaciones o productos" },
                { status: 403 }
            );
        }

        if (error?.message?.startsWith("SLOT_FULL:")) {
            const msg = error.message.replace("SLOT_FULL:", "");
            return NextResponse.json(
                { error: msg },
                { status: 409 }
            );
        }
        status = "500";
        orderLogger.error({ error }, "Error creating order");
        return NextResponse.json(
            { error: "Error al crear el pedido" },
            { status: 500 }
        );
    } finally {
        try {
            const duration = Date.now() - start;
            httpRequestsTotal.inc({ method: "POST", route: "/api/orders", status });
            httpRequestDuration.observe({ method: "POST", route: "/api/orders", status }, duration);
        } catch (e) {
            orderLogger.error({ error: e }, "Metrics increment failed");
        }
    }
}



// GET - Get user's orders
export async function GET(request: Request) {
    const start = Date.now();
    let status = "200";
    try {

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const isAdmin = hasAnyRole(session, ["ADMIN"]);
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get("status");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
        const skip = (page - 1) * limit;

        const where: any = isAdmin ? {} : { userId: session.user.id };
        where.deletedAt = null; // Always exclude soft-deleted
        if (statusFilter) {
            where.status = statusFilter;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: true,
                    address: true,
                    user: {
                        select: { id: true, name: true, email: true, phone: true },
                    },
                    driver: {
                        select: {
                            id: true,
                            latitude: true,
                            longitude: true,
                            user: { select: { name: true, phone: true } }
                        }
                    },
                    merchant: {
                        select: { id: true, name: true, latitude: true, longitude: true }
                    },
                    subOrders: {
                        select: { id: true, status: true, merchantId: true, sellerId: true, deliveryFee: true, driverId: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        status = "500";
        orderLogger.error({ error }, "Error fetching orders");
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    } finally {
        try {
            const duration = Date.now() - start;
            httpRequestsTotal.inc({ method: "GET", route: "/api/orders", status });
            httpRequestDuration.observe({ method: "GET", route: "/api/orders", status }, duration);
        } catch (e) {
            orderLogger.error({ error: e }, "Metrics increment failed");
        }
    }
}



