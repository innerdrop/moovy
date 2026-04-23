/**
 * POST /api/merchant/documents/change-request
 *
 * El merchant solicita permiso para modificar un documento que ya fue APPROVED.
 * No puede sobrescribir el doc directamente: necesita justificar el cambio y
 * que OPS lo autorice. Esto existe porque los 5 docs (CUIT, CBU/Alias,
 * Constancia AFIP, Habilitación Municipal, Registro Sanitario) son información
 * fiscal/legal — cambiar el CUIT después de aprobado puede encubrir fraude o
 * cambio de titularidad no declarado.
 *
 * Body: { documentField: MerchantDocumentField, reason: string }
 *
 * GET /api/merchant/documents/change-request
 *
 * Lista las solicitudes propias del merchant autenticado (histórico + pending).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import {
    isValidDocumentField,
    DOCUMENT_COLUMNS,
} from "@/lib/merchant-document-approval";
import { sendAdminChangeRequestEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(
        request,
        "merchant:change-request",
        5,
        15 * 60_000
    );
    if (limited) return limited;

    try {
        const session = await auth();
        if (
            !session?.user?.id ||
            !hasAnyRole(session, ["MERCHANT", "COMERCIO", "ADMIN"])
        ) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: {
                id: true,
                name: true,
                cuitStatus: true,
                bankAccountStatus: true,
                constanciaAfipStatus: true,
                habilitacionMunicipalStatus: true,
                registroSanitarioStatus: true,
                owner: { select: { email: true, name: true } },
            },
        });

        if (!merchant) {
            return NextResponse.json(
                { error: "Comercio no encontrado" },
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

        if (!isValidDocumentField(documentField)) {
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

        const cols = DOCUMENT_COLUMNS[documentField];

        // Sólo tiene sentido solicitar cambio de un doc APPROVED. Para PENDING
        // o REJECTED el merchant puede subir un archivo nuevo directamente
        // desde el panel (update-docs lo permite).
        const currentStatus = (merchant as any)[cols.statusColumn];
        if (currentStatus !== "APPROVED") {
            return NextResponse.json(
                {
                    error:
                        currentStatus === "PENDING"
                            ? `${cols.label} todavía está pendiente de aprobación — podés reemplazarlo directamente desde el panel.`
                            : `${cols.label} está rechazado — podés subir un archivo nuevo directamente desde el panel.`,
                },
                { status: 400 }
            );
        }

        // No permitir más de 1 request pending simultánea para el mismo doc.
        const existing = await prisma.merchantDocumentChangeRequest.findFirst({
            where: {
                merchantId: merchant.id,
                documentField,
                status: "PENDING",
            },
            select: { id: true, createdAt: true },
        });
        if (existing) {
            return NextResponse.json(
                {
                    error:
                        "Ya tenés una solicitud pendiente para este documento. Esperá que OPS la resuelva.",
                },
                { status: 409 }
            );
        }

        const created = await prisma.merchantDocumentChangeRequest.create({
            data: {
                merchantId: merchant.id,
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
            action: "MERCHANT_CHANGE_REQUEST_CREATED",
            entityType: "Merchant",
            entityId: merchant.id,
            userId: session.user.id,
            details: {
                requestId: created.id,
                documentField,
                documentLabel: cols.label,
                merchantName: merchant.name,
                reason,
            },
        });

        // Notificar a OPS (non-blocking).
        sendAdminChangeRequestEmail(
            merchant.name,
            merchant.owner?.email || null,
            cols.label,
            reason,
            merchant.id
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
        console.error("[MerchantChangeRequest] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (
            !session?.user?.id ||
            !hasAnyRole(session, ["MERCHANT", "COMERCIO", "ADMIN"])
        ) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: { id: true, name: true },
        });
        if (!merchant) {
            return NextResponse.json(
                { error: "Comercio no encontrado" },
                { status: 404 }
            );
        }

        const requests = await prisma.merchantDocumentChangeRequest.findMany({
            where: { merchantId: merchant.id },
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

        // Enriquecer con el label humano de cada doc para que el frontend no
        // tenga que volver a mapear.
        const enriched = requests.map((r) => ({
            ...r,
            documentLabel: isValidDocumentField(r.documentField)
                ? DOCUMENT_COLUMNS[r.documentField].label
                : r.documentField,
        }));

        return NextResponse.json({ requests: enriched });
    } catch (error) {
        console.error("[MerchantChangeRequestList] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
