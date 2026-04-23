/**
 * POST /api/admin/drivers/[id]/documents/reject
 *
 * Rechaza un documento individual del driver con un motivo. El driver queda
 * informado vía email y la UI de su perfil le muestra el status REJECTED con
 * el motivo arriba del campo para que pueda reemplazarlo.
 *
 * Body: { field: DriverDocumentField, reason: string }
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
    rejectDriverDocument,
    isValidDriverDocumentField,
    DRIVER_DOCUMENT_COLUMNS,
} from "@/lib/driver-document-approval";
import { sendDriverDocumentRejectedEmail } from "@/lib/email";

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

        if (!isValidDriverDocumentField(field)) {
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

        const cols = DRIVER_DOCUMENT_COLUMNS[field];
        const driver = await prisma.driver.findUnique({
            where: { id },
            select: {
                id: true,
                user: { select: { email: true, name: true } },
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        await rejectDriverDocument(id, field, reason, {
            adminId: session.user.id,
            adminEmail: session.user.email ?? "unknown",
        });

        const driverEmail = driver.user?.email;
        const driverName = driver.user?.name || "Repartidor";
        if (driverEmail) {
            sendDriverDocumentRejectedEmail(driverEmail, driverName, cols.label, reason);
        }

        return NextResponse.json({
            success: true,
            field,
            label: cols.label,
            reason,
        });
    } catch (error) {
        console.error("[AdminRejectDriverDocument] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
