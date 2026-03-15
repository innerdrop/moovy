// API: Backup Viewer & Restore
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - List all backups with pagination and search
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
        const skip = (page - 1) * limit;

        // Search filter
        const search = searchParams.get("search");

        const where: any = {};

        if (search) {
            where.OR = [
                { backupName: { contains: search, mode: "insensitive" } },
                { orderNumber: { contains: search, mode: "insensitive" } }
            ];
        }

        // Fetch total count for pagination
        const total = await prisma.orderBackup.count({ where });
        const totalPages = Math.ceil(total / limit);

        const backups = await prisma.orderBackup.findMany({
            where,
            orderBy: { deletedAt: "desc" },
            skip,
            take: limit,
        });

        return NextResponse.json({
            backups,
            total,
            page,
            limit,
            totalPages
        });
    } catch (error) {
        console.error("Error fetching backups:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Restore backup
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { backupId } = body;

        if (!backupId) {
            return NextResponse.json({ error: "backupId es requerido" }, { status: 400 });
        }

        // Get the backup
        const backup = await prisma.orderBackup.findUnique({
            where: { id: backupId }
        });

        if (!backup) {
            return NextResponse.json({ error: "Backup no encontrado" }, { status: 404 });
        }

        // Check if order still exists
        const order = await prisma.order.findUnique({
            where: { id: backup.orderId || "" }
        });

        if (!order) {
            return NextResponse.json(
                { error: "El pedido fue eliminado permanentemente y no se puede restaurar" },
                { status: 400 }
            );
        }

        // Restore the order (undelete)
        await prisma.order.update({
            where: { id: backup.orderId! },
            data: { deletedAt: null }
        });

        // Delete the backup after successful restore
        await prisma.orderBackup.delete({
            where: { id: backupId }
        });

        return NextResponse.json({
            success: true,
            message: `Pedido ${backup.orderNumber} restaurado exitosamente`
        });
    } catch (error) {
        console.error("Error restoring backup:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
