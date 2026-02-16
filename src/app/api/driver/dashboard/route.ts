import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistance, estimateTravelTime, formatDistance } from "@/lib/geo";

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

        // --- Stats ---
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Pedidos Completados Hoy
        const completedToday = await prisma.order.count({
            where: {
                driverId: driver.id,
                status: "DELIVERED",
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // Pedidos En Camino (Asignados al driver y no entregados)
        const enCamino = await prisma.order.count({
            where: {
                driverId: driver.id,
                status: {
                    in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP", "IN_DELIVERY"]
                }
            }
        });

        // Ganancias Hoy (Mock simple calculation)
        // In real app, sum up earnings from Order table or Transaction table
        const earnings = completedToday * 850; // Mock: $850 per delivery

        // --- Unread Support Messages ---
        const unreadSupportMessages = await prisma.supportMessage.count({
            where: {
                chat: { userId },
                isFromAdmin: true,
                isRead: false
            }
        });

        // --- Pedidos Activos (Lista) ---
        // Fetch active orders for this driver
        const activeOrders = await prisma.order.findMany({
            where: {
                driverId: driver.id,
                status: {
                    in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP", "IN_DELIVERY"]
                }
            },
            include: {
                merchant: { select: { name: true, address: true, latitude: true, longitude: true } },
                address: { select: { street: true, number: true, city: true, latitude: true, longitude: true } }
            },
            orderBy: { updatedAt: "desc" }
        });

        // Default coordinates for Ushuaia (fallback)
        const DEFAULT_LAT_ACTIVE = -54.8019;
        const DEFAULT_LNG_ACTIVE = -68.3030;

        const formattedActiveOrders = activeOrders.map(order => {
            // Determine relevant address based on status
            // If picked up, we need to go to customer. Before that, we are going to merchant.
            const isPickedUp = ["PICKED_UP", "IN_DELIVERY"].includes(order.status);

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

            return {
                id: order.id, // Actual Prisma ID for API calls
                orderId: order.orderNumber || order.id.slice(-6), // Display ID for UI
                comercio: order.merchant?.name || "Comercio",
                direccion: displayAddress,
                direccionCliente: order.address ? `${order.address.street} ${order.address.number}` : null,
                labelDireccion: displayLabel,
                estado: order.status.toLowerCase(),
                hora: order.updatedAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
                // Navigation coordinates (for Google Maps button)
                navLat,
                navLng,
                // Full coordinates for mini-map
                merchantLat: order.merchant?.latitude,
                merchantLng: order.merchant?.longitude,
                customerLat: order.address?.latitude,
                customerLng: order.address?.longitude
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
                orderBy: { createdAt: "desc" }
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

            let distToMerchant = 0;
            let distToCustomer = 0;
            let timeToMerchant = 0;
            let timeToCustomer = 0;

            if (canCalc && merchantLat && merchantLng) {
                distToMerchant = calculateDistance(activeLat, activeLng, merchantLat, merchantLng);
                timeToMerchant = estimateTravelTime(distToMerchant, driver.vehicleType || "MOTO");
            }

            if (merchantLat && merchantLng && customerLat && customerLng) {
                distToCustomer = calculateDistance(merchantLat, merchantLng, customerLat, customerLng);
                timeToCustomer = estimateTravelTime(distToCustomer, driver.vehicleType || "MOTO");
            }

            const totalDist = distToMerchant + distToCustomer;
            const gananciaBase = 500;
            const gananciaKm = 300;
            const gananciaEstimada = Math.round(gananciaBase + (totalDist * gananciaKm));

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
                distanciaTotal: formatDistance(totalDist),
                gananciaEstimada
            };
        };

        return NextResponse.json({
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
