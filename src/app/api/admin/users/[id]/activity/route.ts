import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const adminLogger = logger.child({ context: "admin/user-activity" });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasRole(session, "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    // Check that user exists
    const userExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "20";
    const action = searchParams.get("action");

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = { userId: id };
    if (action) {
      where.action = action;
    }

    // Fetch activity logs with pagination
    const [logs, total] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
          // Skip userAgent for privacy
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.userActivityLog.count({ where }),
    ]);

    // Parse metadata JSON strings
    const logsWithParsedMetadata = logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));

    const totalPages = Math.ceil(total / limit);

    adminLogger.info(
      { userId: id, page, limit, total, action },
      "Registros de actividad del usuario obtenidos"
    );

    return NextResponse.json({
      success: true,
      logs: logsWithParsedMetadata,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    adminLogger.error({ error }, "Error al obtener registros de actividad");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
