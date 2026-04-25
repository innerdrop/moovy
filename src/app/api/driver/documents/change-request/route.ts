/**
 * POST /api/driver/documents/change-request
 *
 * El driver solicita permiso para modificar un documento que ya fue APPROVED.
 * No puede sobrescribir el doc directamente: necesita justificar el cambio y
 * que OPS lo autorice. Aplica a los 8 docs (cuit, constanciaCuit, DNI, licencia,
 * seguro, RTO, cédula verde) — todos son información fiscal/legal y cambiar
 * el CUIT o la cédula verde después de aprobado podría encubrir suplantación
 * de identidad o cambio de vehículo no declarado.
 *
 * Body: { documentField: DriverDocumentField, reason: string }
 *
 * GET /api/driver/documents/change-request
 *
 * Lista las solicitudes propias del driver autenticado (histórico + pending).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import {
    isValidDriverDocumentField,
    DRIVER_DOCUMENT_COLUMNS,
} from "@/lib/driver-document-approval";
import { sendAdminDriverChangeRequestEmail } from "@/lib/email";
import { requireDriverApi } from "@/lib/driver-auth";

export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(
        request,
        "driver:change-request",
        5,
        15 * 60_000
    );
    if (limited) return limited;

    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { userId } = authResult;

        const driver = await prisma.driver.findUnique({
            where: { userId },
            select: {
                id: true,
                cuitStatus: true,
                constanciaCuitStatus: true,
                dniFrenteStatus: true,
                dniDorsoStatus: true,
                licenciaStatus: true,
                seguroStatus: true,
                vtvStatus: true,
                cedulaVerdeStatus: true,
                user: { select: { email: true, name: true } },
            },
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Repartidor no encontrado" },
                { status: 404 }
            );
        }

        let body: { documentField?: string; reason?: string } = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Body inválido" }, { status: 400 });
        }

        const documentField =
            typeof body.documentField === "string" ? body.documentField : "";
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";

        if (!isValidDriverDocumentField(documentField)) {
            return NextResponse.json(
                { error: "Campo de documento inválido" },
                { status: 400 }
            );
        }
        if (reason.length < 10) {
            return NextResponse.json(
                { error: "Explicá brevemente por qué necesitás cambiarlo (mínimo 10 caracteres)" },
                { status: 400 }
            );
        }
        if (reason.length > 500) {
            return NextResponse.json(
                { error: "El motivo es demasiado largo (máximo 500 caracteres)" },
                { status: 400 }
            );
        }

        const cols = DRIVER_DOCUMENT_COLUMNS[documentField];

        // Sólo tiene sentido solicitar cambio de un doc APPROVED. Para PENDING
        // o REJECTED el driver puede subir/reemplazar el archivo directamente
        // desde el panel (update-docs lo permite sin change-request).
        const currentStatus = (driver as any)[cols.statusColumn];
        if (currentStatus !== "APPROVED") {
            return NextResponse.json(
                {
                    error:
                        currentStatus === "PENDING"
                            ? `${cols.label} todavía está pendiente de aprobación — podés reemplazarlo directamente desde tu perfil.`
                            : `${cols.label} está rechazado — podés subir un archivo nuevo directamente desde tu perfil.`,
                },
                { status: 400 }
            );
        }

        // No permitir más de 1 request pending simultánea para el mismo doc.
        const existing = await prisma.driverDocumentChangeRequest.findFirst({
            where: {
                driverId: driver.id,
                documentField,
                status: "PENDING",
            },
            select: { id: true, createdAt: true },
        });
        if (existing) {
            return NextResponse.json(
                {
                    error:
                        "Ya tenés una solicitud pendiente para este documento. Esperá que el equipo de Moovy la resuelva.",
                },
                { status: 409 }
            );
        }

        const created = await prisma.driverDocumentChangeRequest.create({
            data: {
                driverId: driver.id,
                documentField,
                reason,
                status: "PENDING",
            },
            select: {
                id: true,
                documentField: true,
                reason: true,
                status: true,
                createdAt: true,
            },
        });

        await logAudit({
            action: "DRIVER_CHANGE_REQUEST_CREATED",
            entityType: "Driver",
            entityId: driver.id,
            userId,
            details: {
                requestId: created.id,
                documentField,
                documentLabel: cols.label,
                driverName: driver.user?.name || driver.user?.email || "Repartidor",
                reason,
            },
        });

        // Notificar a OPS (non-blocking).
        sendAdminDriverChangeRequestEmail(
            driver.user?.name || "Repartidor",
            driver.user?.email || null,
            cols.label,
            reason,
            driver.id
        );

        return NextResponse.json({
            success: true,
            request: {
                id: created.id,
                documentField: created.documentField,
                documentLabel: cols.label,
                status: created.status,
                reason: created.reason,
                createdAt: created.createdAt,
            },
        });
    } catch (error) {
        console.error("[DriverChangeRequest] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function GET(_request: NextRequest) {
    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        if (!driver) {
            return NextResponse.json(
                { error: "Repartidor no encontrado" },
                { status: 404 }
            );
        }

        const requests = await prisma.driverDocumentChangeRequest.findMany({
            where: { driverId: driver.id },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            select: {
                id: true,
                documentField: true,
                reason: true,
                status: true,
                resolvedAt: true,
                resolutionNote: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const enriched = requests.map((r) => ({
            ...r,
            documentLabel: isValidDriverDocumentField(r.documentField)
                ? DRIVER_DOCUMENT_COLUMNS[r.documentField].label
                : r.documentField,
        }));

        return NextResponse.json({ requests: enriched });
    } catch (error) {
        console.error("[DriverChangeRequestList] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
