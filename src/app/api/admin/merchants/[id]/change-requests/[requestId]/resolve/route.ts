/**
 * POST /api/admin/merchants/[id]/change-requests/[requestId]/resolve
 *
 * Resuelve una solicitud de cambio de documento del merchant. Si se aprueba:
 * el status correspondiente del documento vuelve a PENDING (permitiendo al
 * merchant subir un archivo nuevo) y le llega un email autorizándolo. Si se
 * rechaza: el status se mantiene como estaba (APPROVED sigue APPROVED) y el
 * merchant recibe un email con el comentario de por qué no se autoriza.
 *
 * Body: { status: "APPROVED" | "REJECTED", note?: string }
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
    isValidDocumentField,
    DOCUMENT_COLUMNS,
} from "@/lib/merchant-document-approval";
import {
    sendMerchantChangeRequestApprovedEmail,
    sendMerchantChangeRequestRejectedEmail,
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

        const changeRequest = await prisma.merchantDocumentChangeRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                merchantId: true,
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
        if (changeRequest.merchantId !== id) {
            return NextResponse.json(
                { error: "La solicitud no pertenece a este comercio" },
                { status: 400 }
            );
        }
        if (changeRequest.status !== "PENDING") {
            return NextResponse.json(
                { error: `La solicitud ya fue ${changeRequest.status.toLowerCase()}` },
                { status: 409 }
            );
        }

        if (!isValidDocumentField(changeRequest.documentField)) {
            // No debería pasar (validamos al crear), pero defense in depth.
            return NextResponse.json(
                { error: "La solicitud tiene un documento inválido" },
                { status: 500 }
            );
        }

        const cols = DOCUMENT_COLUMNS[changeRequest.documentField];
        const now = new Date();

        // Atomicidad: marcamos la request y en el MISMO paso reseteamos el doc
        // a PENDING si aprobamos. Si rechazamos, sólo tocamos la request.
        const merchant = await prisma.merchant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                approvalStatus: true,
                isActive: true,
                isVerified: true,
                owner: { select: { email: true, name: true } },
            },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.merchantDocumentChangeRequest.update({
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
                // PENDING (el merchant tiene que subir algo nuevo). El valor
                // previo permanece hasta que suba el reemplazo.
                await tx.merchant.update({
                    where: { id },
                    data: {
                        [cols.statusColumn]: "PENDING",
                        [cols.approvedAtColumn]: null,
                        [cols.rejectionColumn]: null,
                    },
                });
            }
        });

        await logAudit({
            action:
                status === "APPROVED"
                    ? "MERCHANT_CHANGE_REQUEST_APPROVED"
                    : "MERCHANT_CHANGE_REQUEST_REJECTED",
            entityType: "Merchant",
            entityId: id,
            userId: session.user.id,
            details: {
                requestId,
                documentField: changeRequest.documentField,
                documentLabel: cols.label,
                merchantName: merchant.name,
                reason: changeRequest.reason,
                resolutionNote: note || null,
            },
        });

        // Notificación al merchant (non-blocking).
        const ownerEmail = merchant.owner?.email;
        if (ownerEmail) {
            if (status === "APPROVED") {
                sendMerchantChangeRequestApprovedEmail(
                    ownerEmail,
                    merchant.name,
                    cols.label,
                    note || null
                );
            } else {
                sendMerchantChangeRequestRejectedEmail(
                    ownerEmail,
                    merchant.name,
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
        console.error("[AdminResolveChangeRequest] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
