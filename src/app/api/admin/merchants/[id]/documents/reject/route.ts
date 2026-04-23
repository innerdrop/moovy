/**
 * POST /api/admin/merchants/[id]/documents/reject
 *
 * Rechaza un documento individual con un motivo. El merchant queda informado
 * vía email y la UI del panel de comercio le muestra el status REJECTED con
 * el motivo arriba del campo para que pueda reemplazarlo.
 *
 * Body: { field: MerchantDocumentField, reason: string }
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
    rejectDocument,
    isValidDocumentField,
    DOCUMENT_COLUMNS,
} from "@/lib/merchant-document-approval";
import { sendMerchantDocumentRejectedEmail } from "@/lib/email";

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

        let body: { field?: string; reason?: string } = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Body inválido" }, { status: 400 });
        }

        const field = typeof body.field === "string" ? body.field : "";
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";

        if (!isValidDocumentField(field)) {
            return NextResponse.json(
                { error: "Campo de documento inválido" },
                { status: 400 }
            );
        }
        if (reason.length < 3) {
            return NextResponse.json(
                { error: "El motivo de rechazo es obligatorio (mínimo 3 caracteres)" },
                { status: 400 }
            );
        }
        if (reason.length > 500) {
            return NextResponse.json(
                { error: "El motivo de rechazo es demasiado largo (máximo 500 caracteres)" },
                { status: 400 }
            );
        }

        const cols = DOCUMENT_COLUMNS[field];
        const merchant = await prisma.merchant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                owner: { select: { email: true, name: true } },
            },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        await rejectDocument(id, field, reason, {
            adminId: session.user.id,
            adminEmail: session.user.email ?? "unknown",
        });

        const ownerEmail = merchant.owner?.email;
        if (ownerEmail) {
            sendMerchantDocumentRejectedEmail(
                ownerEmail,
                merchant.name,
                cols.label,
                reason
            );
        }

        return NextResponse.json({
            success: true,
            field,
            label: cols.label,
            reason,
        });
    } catch (error) {
        console.error("[AdminRejectDocument] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
