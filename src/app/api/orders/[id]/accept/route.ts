import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "DRIVER" && role !== "ADMIN") {
            return NextResponse.json({ error: "Only drivers can accept orders" }, { status: 403 });
        }

        const { id } = await context.params;

        // Get driver profile
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id }
        });

        if (!driver) {
            return NextResponse.json({ error: "Driver profile not found" }, { status: 404 });
        }

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Check if order is still available
            const order = await tx.order.findUnique({
                where: { id }
            });

            if (!order) {
                throw new Error("Order not found");
            }

            if (order.status !== "READY" || order.driverId) {
                throw new Error("Order is no longer available");
            }

            // Assign driver
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: "DRIVER_ASSIGNED",
                    driverId: driver.id,
                    deliveryStatus: "ASSIGNED"
                }
            });

            return updatedOrder;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error accepting order:", error);
        return NextResponse.json(
            { error: error.message || "Failed to accept order" },
            { status: 400 }
        );
    }
}
