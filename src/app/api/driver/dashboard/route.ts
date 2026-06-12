import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistance, estimateTravelTime, formatDistance } from "@/lib/geo";
import { DRIVER_ACTIVE_STATUSES } from "@/lib/orders/order-status-machine";

// Estados legacy "activos" — fallback para pedidos pre-rama state-machine-paralela
// que todavía no tienen driverStatus seteado. Las queries usan OR contra ambos
// para no perder pedidos viejos.
const LEGACY_ACTIVE_STATUSES = [
    "READY",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVED",
    "PICKED_UP",
    "IN_DELIVERY",
];

export async function GET(request: Request) {
    // Get driver location from query params (sent from frontend)
    const { searchParams } = new URL(request.url);
    const driverLat = parseFloat(searchParams.get("lat") || "0");
    const driverLng = parseFloat(searchParams.get("lng") || "0");
    const hasDriverLocation = driverLat !== 0 && driverLng !== 0;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const driver = await prisma.driver.findUnique({
            where: { userId }
        });

        if (!driver) {
            return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }

        // --- Update Driver Location ---
        if (hasDriverLocation) {
            await prisma.$executeRaw`
                UPDATE "Driver" 
                SET 
                    latitude = ${driverLat}, 
                    longitude = ${driverLng},
                    "lastLocationAt" = NOW(),
                    ubicacion = ST_SetSRID(ST_MakePoint(${driverLng}, ${driverLat}), 4326)
                WHERE id = ${driver.id}
            `;
        }

        // --- Fetch Store Settings (for rider commission %) ---
        const storeSettings = await prisma.storeSettings.findUnique({
            where: { id: "settings" }
        });
        const riderPercent = (storeSettings as any)?.riderCommissionPercent ?? 80;

        // --- Stats ---
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Pedidos Completados Hoy
        const completedOrders = await prisma.order.findMany({
            where: {
                driverId: driver.id,
                status: "DELIVERED",
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            select: { deliveryFee: true }
        });
        const completedToday = completedOrders.length;

        // Pedidos En Camino — Bug #1 fix (rama fix/state-machine-paralela-merchant-driver)
        // Filtra por driverStatus paralelo cuando existe; cae a status legacy para
        // pedidos viejos. Antes solo filtraba por status legacy y un pedido recién
        // aceptado podía caer fuera del filtro y aparecer en "Historial".
        const enCamino = await prisma.order.count({
            where: {
                driverId: driver.id,
                OR: [
                    { driverStatus: { in: DRIVER_ACTIVE_STATUSES } },
                    { driverStatus: null, status: { in: LEGACY_ACTIVE_STATUSES } },
                ],
            },
        });

        // Ganancias Hoy — real sum of deliveryFee × rider commission %
        const earnings = Math.round(
            completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0) * riderPercent / 100
        );

        // --- Unread Support Messages ---
        const unreadSupportMessages = await prisma.supportMessage.count({
            where: {
                chat: { userId },
                isFromAdmin: true,
                isRead: false
            }
        });

        // --- Pedidos Activos (Lista) ---
        // Fetch active orders for this driver. Mismo OR que enCamino arriba:
        // driverStatus paralelo cuando existe, status legacy como fallback.
        const activeOrders = await prisma.order.findMany({
            where: {
                driverId: driver.id,
                OR: [
                    { driverStatus: { in: DRIVER_ACTIVE_STATUSES } },
                    { driverStatus: null, status: { in: LEGACY_ACTIVE_STATUSES } },
                ],
            },
            include: {
                merchant: { select: { name: true, address: true, latitude: true, longitude: true } },
                address: { select: { street: true, number: true, city: true, latitude: true, longitude: true } },
                // Para chats DRIVER_SELLER multi-vendor: traer SubOrders con seller
                // asociadas a ESTE driver (o a la order sin driver específico si
                // es single-vendor delivery).
                subOrders: {
                    select: {
                        id: true,
                        driverId: true,
                        seller: { select: { id: true, displayName: true, userId: true } }
                    }
                }
            },
            orderBy: { updatedAt: "desc" }
        });

        // Default coordinates for Ushuaia (fallback)
        const DEFAULT_LAT_ACTIVE = -54.8019;
        const DEFAULT_LNG_ACTIVE = -68.3030;

        const formattedActiveOrders = activeOrders.map(order => {
            // Determine relevant address based on delivery status
            // If picked up, we need to go to customer. Before that, we are going to merchant.
            const isPickedUp = ["PICKED_UP", "IN_DELIVERY"].includes(order.status) || order.deliveryStatus === "PICKED_UP";

            let displayAddress = order.merchant?.address || "Comercio";
            let displayLabel = "Retirar en";
            // Use merchant coords or fallback to default
            let navLat = order.merchant?.latitude || DEFAULT_LAT_ACTIVE;
            let navLng = order.merchant?.longitude || DEFAULT_LNG_ACTIVE;

            if (isPickedUp && order.address) {
                displayAddress = `${order.address.street} ${order.address.number}, ${order.address.city}`;
                displayLabel = "Entregar en";
                navLat = order.address.latitude || DEFAULT_LAT_ACTIVE;
                navLng = order.address.longitude || DEFAULT_LNG_ACTIVE;
            }

            // Sellers de este pedido (marketplace multi-vendor) — para chat
            // DRIVER_SELLER. Filtramos por SubOrders asignadas a ESTE driver o
            // sin driver específico (fallback single-vendor).
            const sellersEnPedido = ((order as any).subOrders ?? [])
                .filter((so: any) => so?.seller && (so.driverId === driver.id || !so.driverId))
                .map((so: any) => ({
                    subOrderId: so.id as string,
                    sellerName: (so.seller?.displayName ?? "Vendedor") as string
                }));

            // ¿Este pedido tiene comercio (merchant)? El chat DRIVER_MERCHANT
            // solo se muestra si existe. En marketplace-only el merchant puede
            // ser null.
            const hasMerchant = !!order.merchant?.name;

            return {
                id: order.id, // Actual Prisma ID for API calls
                orderId: order.orderNumber || order.id.slice(-6), // Display ID for UI
                orderNumber: order.orderNumber || order.id.slice(-6),
                comercio: order.merchant?.name || "Comercio",
                direccion: displayAddress,
                direccionCliente: order.address ? `${order.address.street} ${order.address.number}` : null,
                labelDireccion: displayLabel,
                estado: order.status.toLowerCase(),
                deliveryStatus: order.deliveryStatus || null, // Actual delivery tracking field
                // Rama feat/no-show-flow: campos del state machine paralelo necesarios
                // para que la UI distinga entre AT_CUSTOMER, WAITING_FOR_CUSTOMER,
                // RETURNING_TO_MERCHANT, etc. El deliveryStatus legacy no los tiene.
                driverStatus: order.driverStatus || null,
                merchantStatus: order.merchantStatus || null,
                waitingStartedAt: order.waitingStartedAt ? order.waitingStartedAt.toISOString() : null,
                noShowReportedAt: order.noShowReportedAt ? order.noShowReportedAt.toISOString() : null,
                hora: order.updatedAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
                // Navigation coordinates (for Google Maps button)
                navLat,
                navLng,
                // Full coordinates for mini-map
                merchantLat: order.merchant?.latitude,
                merchantLng: order.merchant?.longitude,
                customerLat: order.address?.latitude,
                customerLng: order.address?.longitude,
                // Notas que el cliente dejó al repartidor en checkout
                // (Bug 6 rama fix/state-machine-paralela-merchant-driver)
                deliveryNotes: order.deliveryNotes || null,
                // Chat targets
                hasMerchant,
                sellersEnPedido
            };
        });

        // --- Pedidos Disponibles (READY, Sin driver) ---
        let availableOrders: any[] = [];
        let pendingOffers: any[] = [];

        // Only show orders if driver is online
        if (driver.isOnline) {
            // 1. First, find orders PENDING for this specific driver (Offers)
            const pendingOrders = await prisma.order.findMany({
                where: {
                    status: { in: ["PREPARING", "READY"] },
                    pendingDriverId: driver.id,
                    driverId: null
                },
                include: {
                    merchant: { select: { name: true, address: true, latitude: true, longitude: true } },
                    address: { select: { street: true, number: true, city: true, latitude: true, longitude: true } }
                },
                orderBy: { createdAt: "desc" },
            });

            // 2. Then, find general available orders (if they haven't seen them yet)
            const readyOrders = await prisma.order.findMany({
                where: {
                    status: { in: ["PREPARING", "READY"] },
                    driverId: null,
                    pendingDriverId: null // Not yet offered to anyone (or expired)
                },
                include: {
                    merchant: { select: { name: true, address: true, latitude: true, longitude: true } },
                    address: { select: { street: true, number: true, city: true, latitude: true, longitude: true } }
                },
                orderBy: { createdAt: "asc" },
                take: 10
            });

            availableOrders = readyOrders;
            pendingOffers = pendingOrders;
        }
        // Default coordinates for Ushuaia (fallback if merchant has no coordinates)
        const DEFAULT_LAT = -54.8019;
        const DEFAULT_LNG = -68.3030;

        // Helper to format orders with distance calculation
        const formatOrderWithLocation = (order: any) => {
            // Use merchant coordinates or fallback to default Ushuaia center
            const merchantLat = order.merchant?.latitude || DEFAULT_LAT;
            const merchantLng = order.merchant?.longitude || DEFAULT_LNG;
            const customerLat = order.address?.latitude;
            const customerLng = order.address?.longitude;

            // Use driver's location from DB if not provided in query params
            const activeLat = hasDriverLocation ? driverLat : (driver.latitude || 0);
            const activeLng = hasDriverLocation ? driverLng : (driver.longitude || 0);
            const canCalc = activeLat !== 0 && activeLng !== 0;

            // --- ETA to merchant (dynamic, informational only) ---
            let distToMerchant = 0;
            let timeToMerchant = 0;

            if (canCalc && merchantLat && merchantLng) {
                distToMerchant = calculateDistance(activeLat, activeLng, merchantLat, merchantLng);
                timeToMerchant = estimateTravelTime(distToMerchant, driver.vehicleType || "MOTO");
            }

            // --- Merchant→Customer distance (for ETA display only) ---
            let distToCustomer = 0;
            let timeToCustomer = 0;

            if (merchantLat && merchantLng && customerLat && customerLng) {
                distToCustomer = calculateDistance(merchantLat, merchantLng, customerLat, customerLng);
                timeToCustomer = estimateTravelTime(distToCustomer, driver.vehicleType || "MOTO");
            }

            // --- FROZEN earnings: use order's deliveryFee × rider commission % ---
            const gananciaEstimada = Math.round((order.deliveryFee || 0) * riderPercent / 100);

            // --- FROZEN distance: use order's distanceKm, fallback to calculated ---
            const frozenDistKm = order.distanceKm || distToCustomer;

            return {
                id: order.id,
                orderNumber: order.orderNumber,
                comercio: order.merchant?.name || "Comercio",
                direccion: order.merchant?.address || "Dirección",
                direccionCliente: order.address ? `${order.address.street} ${order.address.number}` : null,
                createdAt: order.createdAt,
                expiresAt: order.assignmentExpiresAt,
                merchantLat,
                merchantLng,
                customerLat,
                customerLng,
                tiempoAlComercio: timeToMerchant,
                tiempoAlCliente: timeToCustomer,
                distanciaTotal: formatDistance(frozenDistKm),
                gananciaEstimada,
                // Notas del cliente — el driver las ve ANTES de aceptar la oferta
                // (Bug 6 rama fix/state-machine-paralela-merchant-driver)
                deliveryNotes: order.deliveryNotes || null
            };
        };

        return NextResponse.json({
            driverId: driver.id,
            // ISSUE-051: strip superior necesita vehicleType para mostrar chip "Vehículo".
            // Lo exponemos acá (no en un endpoint nuevo) porque ya cargamos todo
            // el driver arriba y evitamos un round-trip extra.
            vehicleType: driver.vehicleType || null,
            // s2-2c-04: el dashboard muestra banner "completá tu documentación"
            // a los drivers pendientes (pueden entrar al panel pero no conectarse).
            approvalStatus: driver.approvalStatus,
            stats: {
                pedidosHoy: completedToday + enCamino,
                enCamino: enCamino,
                completados: completedToday,
                gananciasHoy: earnings
            },
            isOnline: driver.isOnline,
            availabilityStatus: driver.availabilityStatus,
            pedidosActivos: formattedActiveOrders,
            pedidosDisponibles: availableOrders.map(formatOrderWithLocation),
            pedidosPendientes: pendingOffers.map(formatOrderWithLocation),
            unreadSupportMessages
        });

    } catch (error) {
        console.error("Error fetching driver dashboard:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
