// API: Admin Orders Management
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all orders
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: any = {};
        if (status && status !== "all") {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: true,
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                driver: {
                    include: {
                        user: { select: { name: true } }
                    }
                },
                merchant: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE - Delete orders (with optional backup)
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { orderIds, createBackup, backupName } = body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "No se especificaron pedidos" }, { status: 400 });
        }

        // If backup requested, save orders first
        if (createBackup) {
            const ordersToBackup = await prisma.order.findMany({
                where: { id: { in: orderIds } },
                include: {
                    items: true,
                    address: true,
                    user: { select: { id: true, name: true, email: true, phone: true } },
                    driver: { include: { user: { select: { name: true } } } },
                    merchant: { select: { id: true, name: true } }
                }
            });

            const finalBackupName = backupName || `backup-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}`;

            // Create backup entries
            for (const order of ordersToBackup) {
                await prisma.orderBackup.create({
                    data: {
                        backupName: finalBackupName,
                        orderData: JSON.stringify(order),
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        total: order.total,
                        deletedBy: (session.user as any).id
                    }
                });
            }
        }

        // Delete orders (cascade will delete items)
        await prisma.order.deleteMany({
            where: { id: { in: orderIds } }
        });

        return NextResponse.json({
            success: true,
            deleted: orderIds.length,
            message: `${orderIds.length} pedido(s) eliminado(s)${createBackup ? " con respaldo" : ""}`
        });
    } catch (error) {
        console.error("Error deleting orders:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
