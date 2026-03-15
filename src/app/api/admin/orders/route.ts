// API: Admin Orders Management
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - List all orders with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
        const skip = (page - 1) * limit;

        // Filters
        const status = searchParams.get("status");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const search = searchParams.get("search");

        const where: any = {};

        // Status filter
        if (status && status !== "all") {
            where.status = status;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.createdAt.lte = new Date(dateTo);
            }
        }

        // Search filter (orderNumber or user name/email)
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } }
            ];
        }

        // Fetch total count for pagination
        const total = await prisma.order.count({ where });
        const totalPages = Math.ceil(total / limit);

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
            skip,
            take: limit,
        });

        return NextResponse.json({
            orders,
            total,
            page,
            limit,
            totalPages
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE - Delete orders (with optional backup)
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
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
