/**
 * POST /api/admin/merchants/[id]/documents/approve
 *
 * Aprueba un documento individual del merchant (CUIT, CBU/Alias, Constancia AFIP,
 * Habilitación Municipal o Registro Sanitario). La lógica de chequeo de
 * auto-activación está encapsulada en `approveDocument` — si al aprobar este
 * doc todos los requeridos quedan APPROVED, se dispara automáticamente
 * `approveMerchantTransition` (set isActive=true, isVerified=true, approvalStatus=APPROVED).
 *
 * Body: { field: MerchantDocumentField }
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
    approveDocument,
    isValidDocumentField,
    DOCUMENT_COLUMNS,
} from "@/lib/merchant-document-approval";
import { sendMerchantApprovalEmail, sendMerchantDocumentApprovedEmail } from "@/lib/email";

export async function POST(
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

        let body: { field?: string } = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Body inválido" }, { status: 400 });
        }

        const field = typeof body.field === "string" ? body.field : "";
        if (!isValidDocumentField(field)) {
            return NextResponse.json(
                { error: "Campo de documento inválido" },
                { status: 400 }
            );
        }

        // Verificamos que el merchant exista y tenga valor cargado en ese campo
        // (no tiene sentido aprobar un doc vacío). También extraemos email del
        // owner para la notif posterior.
        const cols = DOCUMENT_COLUMNS[field];
        const merchant = await prisma.merchant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                [cols.valueColumn]: true,
                [cols.statusColumn]: true,
                owner: { select: { email: true, name: true } },
            } as any,
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const currentValue = (merchant as any)[cols.valueColumn];
        if (!currentValue) {
            return NextResponse.json(
                { error: `No hay ${cols.label} cargado para aprobar` },
                { status: 400 }
            );
        }

        if ((merchant as any)[cols.statusColumn] === "APPROVED") {
            return NextResponse.json(
                { error: `${cols.label} ya está aprobado` },
                { status: 409 }
            );
        }

        const result = await approveDocument(id, field, {
            adminId: session.user.id,
            adminEmail: session.user.email ?? "unknown",
        });

        // Notificaciones (non-blocking): siempre avisamos al merchant que un doc
        // específico fue aprobado; si además esto gatilló la auto-activación global
        // mandamos también el email de bienvenida clásico.
        const ownerEmail = (merchant as any).owner?.email;
        if (ownerEmail) {
            sendMerchantDocumentApprovedEmail(
                ownerEmail,
                (merchant as any).name,
                cols.label,
                result.merchantAutoActivated
            );
            if (result.merchantAutoActivated) {
                sendMerchantApprovalEmail(ownerEmail, (merchant as any).name);
            }
        }

        return NextResponse.json({
            success: true,
            field,
            label: cols.label,
            merchantAutoActivated: result.merchantAutoActivated,
        });
    } catch (error) {
        console.error("[AdminApproveDocument] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
