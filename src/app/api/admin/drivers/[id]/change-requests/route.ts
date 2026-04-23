/**
 * GET /api/admin/drivers/[id]/change-requests
 *
 * Lista las solicitudes de cambio de documentos del driver. Usado en la
 * pantalla del detalle de driver en OPS para mostrar qué docs están pedidos
 * cambiar + histórico (append-only, no se borran).
 *
 * Query params: ?status=PENDING (opcional, filtra por estado)
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get("status");

        const driver = await prisma.driver.findUnique({
            where: { id },
            select: {
                id: true,
                user: { select: { name: true, email: true } },
            },
        });
        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        const where: any = { driverId: id };
        if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
            where.status = statusFilter;
        }

        const requests = await prisma.driverDocumentChangeRequest.findMany({
            where,
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            select: {
                id: true,
                documentField: true,
                reason: true,
                status: true,
                resolvedAt: true,
                resolvedBy: true,
                resolutionNote: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const resolverIds = Array.from(
            new Set(requests.map((r) => r.resolvedBy).filter((x): x is string => !!x))
        );
        let resolverMap: Record<string, string> = {};
        if (resolverIds.length > 0) {
            const resolvers = await prisma.user.findMany({
                where: { id: { in: resolverIds } },
                select: { id: true, name: true, email: true },
            });
            resolverMap = Object.fromEntries(
                resolvers.map((u) => [u.id, u.name || u.email || "Admin"])
            );
        }

        return NextResponse.json({
            driver: {
                id: driver.id,
                name: driver.user?.name || driver.user?.email || "Repartidor",
            },
            requests: requests.map((r) => ({
                ...r,
                resolvedByName: r.resolvedBy ? resolverMap[r.resolvedBy] ?? "Admin" : null,
            })),
        });
    } catch (error) {
        console.error("[AdminDriverChangeRequestsList] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
