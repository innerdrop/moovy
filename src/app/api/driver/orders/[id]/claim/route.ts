// API Route: Driver Claim Order
// Allows an APPROVED driver to claim an available READY order
// Uses transaction to prevent race condition (two drivers claiming same order)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { requireDriverApi } from "@/lib/driver-auth";
// Rama fix/asignacion-match-vehiculo: antes de permitir el claim, validamos que el
// vehículo del driver pueda transportar el pedido. calculateOrderCategory deriva los
// vehículos permitidos (allowedVehicles) a partir de OrderItem.packageCategoryName;
// vehicleTypeMatches normaliza español/enum para comparar contra el del driver.
import { calculateOrderCategory } from "@/lib/assignment-engine";
import { vehicleTypeMatches } from "@/lib/vehicle-type-mapping";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        const { id: orderId } = await params;

        if (!driver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado. Registrate primero." }, { status: 404 });
        }

        if (driver.approvalStatus !== "APPROVED") {
            return NextResponse.json(
                { error: "Tu solicitud está pendiente de aprobación" },
                { status: 403 }
            );
        }

        if (!driver.isActive) {
            return NextResponse.json({ error: "Tu cuenta está desactivada" }, { status: 403 });
        }

        // ─── Rama fix/asignacion-match-vehiculo ──────────────────────────────────
        // FILTRO DE VEHÍCULO: un driver no puede autoasignarse un pedido que su
        // vehículo no puede transportar (antes el claim no chequeaba nada, así que
        // una bici podía tomar un pedido con un colchón XL). Mismo criterio que usa
        // findNextEligibleDriver en el assignment-engine: comparamos el vehicleType
        // del driver contra los allowedVehicles que deriva calculateOrderCategory.
        //
        // Solo validamos si el pedido existe, está disponible (READY) y tiene items
        // con categoría. Si por datos viejos no hay categoría resoluble,
        // calculateOrderCategory devuelve un set de vehículos (nunca vacío), así que
        // el chequeo es seguro.
        const orderItems = await prisma.orderItem.findMany({
            where: { orderId },
            select: { packageCategoryName: true, quantity: true, name: true },
        });

        if (orderItems.length > 0) {
            const orderCategory = await calculateOrderCategory(
                orderItems.map((it) => ({
                    packageCategory: it.packageCategoryName || null,
                    quantity: it.quantity,
                    name: it.name || undefined,
                }))
            );

            if (!vehicleTypeMatches(driver.vehicleType, orderCategory.allowedVehicles)) {
                return NextResponse.json(
                    {
                        error: "Tu vehículo no puede transportar este pedido por su tamaño o peso.",
                        allowedVehicles: orderCategory.allowedVehicles,
                        packageCategory: orderCategory.category,
                    },
                    { status: 409 }
                );
            }
        }

        // Atomic claim using updateMany with condition to prevent race condition
        // Only updates if order is READY and has no driver assigned
        const result = await prisma.order.updateMany({
            where: {
                id: orderId,
                status: "READY",
                driverId: null,
                deletedAt: null,
            },
            data: {
                driverId: driver.id,
                status: "DRIVER_ASSIGNED",
                deliveryStatus: "DRIVER_ASSIGNED",
                // Rama fix/state-machine-paralela-merchant-driver:
                // setear driverStatus paralelo cuando el driver acepta.
                // El dashboard filtra por driverStatus IN DRIVER_ACTIVE_STATUSES,
                // y "ASSIGNED" es el primer estado activo del flujo del driver.
                driverStatus: "ASSIGNED",
            },
        });

        if (result.count === 0) {
            // Check why it failed — order doesn't exist, wrong status, or already claimed
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { status: true, driverId: true, deletedAt: true },
            });

            if (!order || order.deletedAt) {
                return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
            }
            if (order.driverId) {
                return NextResponse.json({ error: "Este pedido ya fue tomado por otro repartidor" }, { status: 409 });
            }
            return NextResponse.json(
                { error: `Este pedido no está disponible (estado: ${order.status})` },
                { status: 400 }
            );
        }

        // Fetch order data for notification
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true, orderNumber: true, id: true, total: true },
        });

        if (order) {
            notifyBuyer(order.userId, "DRIVER_ASSIGNED", order.orderNumber, {
                total: order.total,
                orderId: order.id,
            }).catch(err => console.error("[Push] Buyer notification error:", err));
        }

        return NextResponse.json({ success: true, message: "Pedido asignado correctamente" });
    } catch (error) {
        console.error("Error claiming order:", error);
        return NextResponse.json(
            { error: "Error al tomar el pedido" },
            { status: 500 }
        );
    }
}
