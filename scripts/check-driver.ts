import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
    // Check drivers
    const drivers = await p.driver.findMany({
        select: {
            id: true, isOnline: true, isActive: true,
            availabilityStatus: true, latitude: true, longitude: true,
            vehicleType: true,
            user: { select: { name: true, email: true } }
        }
    });
    console.log("=== DRIVERS ===");
    console.log(JSON.stringify(drivers, null, 2));

    // Check recent orders
    const orders = await p.order.findMany({
        select: {
            id: true, orderNumber: true, status: true,
            driverId: true, pendingDriverId: true,
            merchantId: true, createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 5
    });
    console.log("\n=== RECENT ORDERS ===");
    console.log(JSON.stringify(orders, null, 2));

    // Check if ubicacion (PostGIS) is set for drivers
    const ubicacionCheck = await p.$queryRaw`
        SELECT id, latitude, longitude, ubicacion IS NOT NULL as has_ubicacion 
        FROM "Driver"
    ` as any[];
    console.log("\n=== DRIVER UBICACION (PostGIS) ===");
    console.log(JSON.stringify(ubicacionCheck, null, 2));

    await p.$disconnect();
}

main().catch(console.error);
