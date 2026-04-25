/**
 * POST /api/admin/drivers/[id]/documents/approve
 *
 * Aprueba un documento individual del driver (cuit, constanciaCuitUrl,
 * dniFrenteUrl, dniDorsoUrl, licenciaUrl, seguroUrl, vtvUrl, cedulaVerdeUrl).
 * Si al aprobar este doc todos los requeridos quedan APPROVED, se dispara
 * automáticamente `approveDriverTransition`.
 *
 * Body: { field: DriverDocumentField }
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
    approveDriverDocument,
    isValidDriverDocumentField,
    DRIVER_DOCUMENT_COLUMNS,
} from "@/lib/driver-document-approval";
import {
    sendDriverApprovalEmail,
    sendDriverDocumentApprovedEmail,
} from "@/lib/email";

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

        let body: { field?: string; source?: string; note?: string } = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Body inválido" }, { status: 400 });
        }

        const field = typeof body.field === "string" ? body.field : "";
        if (!isValidDriverDocumentField(field)) {
            return NextResponse.json(
                { error: "Campo de documento inválido" },
                { status: 400 }
            );
        }

        // Origen de la aprobación: DIGITAL (subido al sistema) o PHYSICAL (admin
        // recibió el doc fuera del sistema). En PHYSICAL la URL puede quedar null
        // y la nota describe cómo se recibió (auditoría AAIP/Trans. Ushuaia).
        const sourceRaw = typeof body.source === "string" ? body.source.toUpperCase() : "DIGITAL";
        const source: "DIGITAL" | "PHYSICAL" = sourceRaw === "PHYSICAL" ? "PHYSICAL" : "DIGITAL";
        const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;

        if (source === "PHYSICAL" && (!note || note.length < 5)) {
            return NextResponse.json(
                { error: "Para aprobación física se requiere una nota de al menos 5 caracteres describiendo cómo se recibió el documento." },
                { status: 400 }
            );
        }

        const cols = DRIVER_DOCUMENT_COLUMNS[field];
        const driver = await prisma.driver.findUnique({
            where: { id },
            select: {
                id: true,
                [cols.valueColumn]: true,
                [cols.statusColumn]: true,
                user: { select: { email: true, name: true } },
            } as any,
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        const currentValue = (driver as any)[cols.valueColumn];
        if (!currentValue && source === "DIGITAL") {
            return NextResponse.json(
                { error: `No hay ${cols.label} cargado en el sistema. Si lo recibiste en papel, marcá como aprobación física.` },
                { status: 400 }
            );
        }

        if ((driver as any)[cols.statusColumn] === "APPROVED") {
            return NextResponse.json(
                { error: `${cols.label} ya está aprobado` },
                { status: 409 }
            );
        }

        const result = await approveDriverDocument(id, field, {
            adminId: session.user.id,
            adminEmail: session.user.email ?? "unknown",
            source,
            note,
        });

        // Notificaciones (non-blocking)
        const driverEmail = (driver as any).user?.email;
        const driverName = (driver as any).user?.name || "Repartidor";
        if (driverEmail) {
            sendDriverDocumentApprovedEmail(
                driverEmail,
                driverName,
                cols.label,
                result.driverAutoActivated
            );
            if (result.driverAutoActivated) {
                sendDriverApprovalEmail(driverEmail, driverName);
            }
        }

        return NextResponse.json({
            success: true,
            field,
            label: cols.label,
            driverAutoActivated: result.driverAutoActivated,
        });
    } catch (error) {
        console.error("[AdminApproveDriverDocument] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
