/**
 * POST /api/admin/drivers/[id]/change-requests/[requestId]/resolve
 *
 * Resuelve una solicitud de cambio de documento del driver. Si se aprueba:
 * el status correspondiente del documento vuelve a PENDING (permitiendo al
 * driver subir un archivo nuevo) y le llega un email autorizándolo. Si se
 * rechaza: el status se mantiene como estaba (APPROVED sigue APPROVED) y el
 * driver recibe un email con el motivo.
 *
 * Body: { status: "APPROVED" | "REJECTED", note?: string }
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
    isValidDriverDocumentField,
    DRIVER_DOCUMENT_COLUMNS,
} from "@/lib/driver-document-approval";
import {
    sendDriverChangeRequestApprovedEmail,
    sendDriverChangeRequestRejectedEmail,
} from "@/lib/email";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string; requestId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id, requestId } = await context.params;

        let body: { status?: string; note?: string } = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Body inválido" }, { status: 400 });
        }

        const status = typeof body.status === "string" ? body.status : "";
        if (status !== "APPROVED" && status !== "REJECTED") {
            return NextResponse.json(
                { error: "Status inválido (APPROVED o REJECTED)" },
                { status: 400 }
            );
        }

        const note = typeof body.note === "string" ? body.note.trim() : "";
        if (status === "REJECTED" && note.length < 3) {
            return NextResponse.json(
                { error: "Para rechazar una solicitud debes incluir un motivo (≥3 caracteres)" },
                { status: 400 }
            );
        }
        if (note.length > 500) {
            return NextResponse.json(
                { error: "El comentario es demasiado largo (máximo 500 caracteres)" },
                { status: 400 }
            );
        }

        const changeRequest = await prisma.driverDocumentChangeRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                driverId: true,
                documentField: true,
                reason: true,
                status: true,
            },
        });

        if (!changeRequest) {
            return NextResponse.json(
                { error: "Solicitud de cambio no encontrada" },
                { status: 404 }
            );
        }
        if (changeRequest.driverId !== id) {
            return NextResponse.json(
                { error: "La solicitud no pertenece a este repartidor" },
                { status: 400 }
            );
        }
        if (changeRequest.status !== "PENDING") {
            return NextResponse.json(
                { error: `La solicitud ya fue ${changeRequest.status.toLowerCase()}` },
                { status: 409 }
            );
        }

        if (!isValidDriverDocumentField(changeRequest.documentField)) {
            // No debería pasar (validamos al crear), pero defense in depth.
            return NextResponse.json(
                { error: "La solicitud tiene un documento inválido" },
                { status: 500 }
            );
        }

        const cols = DRIVER_DOCUMENT_COLUMNS[changeRequest.documentField];
        const now = new Date();

        const driver = await prisma.driver.findUnique({
            where: { id },
            select: {
                id: true,
                approvalStatus: true,
                isActive: true,
                user: { select: { email: true, name: true } },
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.driverDocumentChangeRequest.update({
                where: { id: requestId },
                data: {
                    status,
                    resolvedAt: now,
                    resolvedBy: session.user!.id,
                    resolutionNote: note || null,
                },
            });

            if (status === "APPROVED") {
                // Habilitamos la modificación: el status del doc vuelve a
                // PENDING (el driver tiene que subir algo nuevo). El valor
                // previo permanece hasta que suba el reemplazo — esto evita
                // dejar al driver sin documentación mientras prepara la nueva.
                const data: Record<string, unknown> = {
                    [cols.statusColumn]: "PENDING",
                    [cols.approvedAtColumn]: null,
                    [cols.rejectionColumn]: null,
                };
                // Si el doc tiene expiración, reseteamos el stage de avisos.
                if (cols.hasExpiration && cols.notifiedStageColumn) {
                    data[cols.notifiedStageColumn] = 0;
                }
                await tx.driver.update({
                    where: { id },
                    data,
                });
            }
        });

        await logAudit({
            action:
                status === "APPROVED"
                    ? "DRIVER_CHANGE_REQUEST_APPROVED"
                    : "DRIVER_CHANGE_REQUEST_REJECTED",
            entityType: "Driver",
            entityId: id,
            userId: session.user.id,
            details: {
                requestId,
                documentField: changeRequest.documentField,
                documentLabel: cols.label,
                driverName: driver.user?.name || driver.user?.email || "Repartidor",
                reason: changeRequest.reason,
                resolutionNote: note || null,
            },
        });

        // Notificación al driver (non-blocking).
        const driverEmail = driver.user?.email;
        const driverName = driver.user?.name || "Repartidor";
        if (driverEmail) {
            if (status === "APPROVED") {
                sendDriverChangeRequestApprovedEmail(
                    driverEmail,
                    driverName,
                    cols.label,
                    note || null
                );
            } else {
                sendDriverChangeRequestRejectedEmail(
                    driverEmail,
                    driverName,
                    cols.label,
                    note
                );
            }
        }

        return NextResponse.json({
            success: true,
            requestId,
            status,
            documentField: changeRequest.documentField,
            documentLabel: cols.label,
        });
    } catch (error) {
        console.error("[AdminResolveDriverChangeRequest] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
