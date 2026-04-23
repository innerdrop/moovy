// API Route: Update merchant documents (CUIT, CBU/Alias, AFIP, habilitación, sanitario)
//
// Reglas post fix/onboarding-comercio-completo:
// - Docs APPROVED NO se pueden sobrescribir. El merchant tiene que pasar
//   antes por /api/merchant/documents/change-request y esperar autorización
//   de OPS, que baja el status a PENDING.
// - Al subir un doc (PENDING o REJECTED), se llama a resetDocumentToPending
//   para limpiar el motivo de rechazo y dejarlo listo para re-revisión.
// - CBU/Alias usa validateBankAccount (misma lib que el form de registro).
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateBankAccount } from "@/lib/bank-account";
import { encryptMerchantData } from "@/lib/fiscal-crypto";
import {
    DOCUMENT_COLUMNS,
    isValidDocumentField,
    resetDocumentToPending,
    type MerchantDocumentField,
} from "@/lib/merchant-document-approval";

// Campos que el merchant puede re-subir. El orden acá es sólo por legibilidad.
const ALLOWED_FIELDS: MerchantDocumentField[] = [
    "cuit",
    "bankAccount",
    "constanciaAfipUrl",
    "habilitacionMunicipalUrl",
    "registroSanitarioUrl",
];

export async function PATCH(request: NextRequest) {
    const limited = await applyRateLimit(request, "merchant:update-docs", 10, 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "COMERCIO", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: {
                id: true,
                cuitStatus: true,
                bankAccountStatus: true,
                constanciaAfipStatus: true,
                habilitacionMunicipalStatus: true,
                registroSanitarioStatus: true,
            },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const body = await request.json();

        // Construimos el update filtrando:
        // 1. Sólo campos whitelisteados.
        // 2. Sólo strings no vacíos.
        // 3. El doc actual no puede estar APPROVED (bloqueo de seguridad).
        // 4. Si es bankAccount, validar con validateBankAccount.
        const updateData: Record<string, string> = {};
        const fieldsTouched: MerchantDocumentField[] = [];
        const errors: string[] = [];

        for (const field of ALLOWED_FIELDS) {
            const rawValue = body[field];
            if (typeof rawValue !== "string" || rawValue.trim().length === 0) continue;
            if (!isValidDocumentField(field)) continue;

            const cols = DOCUMENT_COLUMNS[field];
            const currentStatus = (merchant as any)[cols.statusColumn];

            // Bloqueo: no sobrescribir APPROVED sin change request.
            if (currentStatus === "APPROVED") {
                errors.push(
                    `${cols.label} ya fue aprobado. Para modificarlo necesitás pedir permiso desde "Solicitar cambio".`
                );
                continue;
            }

            // Validaciones específicas por tipo.
            if (field === "bankAccount") {
                const bankCheck = validateBankAccount(rawValue);
                if (!bankCheck.valid) {
                    errors.push(bankCheck.error || "CBU o Alias inválido");
                    continue;
                }
                updateData[field] = bankCheck.normalized;
            } else if (field === "cuit") {
                const onlyDigits = rawValue.replace(/\D/g, "");
                if (onlyDigits.length !== 11) {
                    errors.push("El CUIT debe tener 11 dígitos.");
                    continue;
                }
                updateData[field] = onlyDigits;
            } else {
                // Los 3 campos URL ya vienen validados desde el endpoint
                // /api/upload/registration (magic bytes, tamaño, extensión).
                updateData[field] = rawValue.trim();
            }

            fieldsTouched.push(field);
        }

        if (errors.length > 0 && Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: errors.join(" ") },
                { status: 400 }
            );
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No se proporcionaron documentos válidos" },
                { status: 400 }
            );
        }

        // CUIT y bankAccount viajan encriptados en DB. URL docs van plain.
        // encryptMerchantData es no-op sobre campos que no están en la lista
        // de fiscal-sensitive, así que lo aplicamos sobre todo el payload.
        const encrypted = encryptMerchantData(updateData);

        await prisma.merchant.update({
            where: { id: merchant.id },
            data: encrypted,
        });

        // Cada doc actualizado vuelve explícitamente a PENDING (aunque ya lo
        // estuviera) + limpieza de rejectionReason + audit log individual.
        // Esto permite a OPS ver en el feed "merchant re-subió X documento".
        for (const field of fieldsTouched) {
            try {
                await resetDocumentToPending(merchant.id, field, session.user.id);
            } catch (e) {
                console.error("[UpdateDocs] resetDocumentToPending failed for", field, e);
            }
        }

        return NextResponse.json({
            success: true,
            updated: fieldsTouched,
            partialErrors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("[UpdateDocs] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
