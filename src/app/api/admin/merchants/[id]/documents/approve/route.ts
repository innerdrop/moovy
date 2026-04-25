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
import { sendMerchantDocumentApprovedEmail } from "@/lib/email";
import { sendMerchantApprovedEmail } from "@/lib/email-p0";

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
        if (!isValidDocumentField(field)) {
            return NextResponse.json(
                { error: "Campo de documento inválido" },
                { status: 400 }
            );
        }

        // Origen de la aprobación. DIGITAL = el merchant subió el doc al sistema.
        // PHYSICAL = admin lo recibió en papel/email/whatsapp y aprueba manualmente
        // sin URL. La nota describe cómo lo recibió (clave para auditoría AAIP).
        const sourceRaw = typeof body.source === "string" ? body.source.toUpperCase() : "DIGITAL";
        const source: "DIGITAL" | "PHYSICAL" = sourceRaw === "PHYSICAL" ? "PHYSICAL" : "DIGITAL";
        const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;

        if (source === "PHYSICAL" && (!note || note.length < 5)) {
            return NextResponse.json(
                { error: "Para aprobación física se requiere una nota de al menos 5 caracteres describiendo cómo se recibió el documento." },
                { status: 400 }
            );
        }

        // Verificamos que el merchant exista. El valor del campo es opcional cuando
        // source === PHYSICAL: el admin recibió el doc fuera del sistema.
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
        if (!currentValue && source === "DIGITAL") {
            return NextResponse.json(
                { error: `No hay ${cols.label} cargado en el sistema. Si lo recibiste en papel, marcá como aprobación física.` },
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
            source,
            note,
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
                sendMerchantApprovedEmail({
                    email: ownerEmail,
                    businessName: (merchant as any).name,
                    contactName: (merchant as any).owner?.name || "",
                });
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
