/**
 * PATCH /api/driver/documents/update
 *
 * Permite al driver subir/reemplazar documentos SOLO si su status NO es APPROVED.
 * Un doc APPROVED está hard-locked server-side: el driver debe pedir un
 * change-request formal antes de poder re-subirlo.
 *
 * Body (todos los campos son opcionales; se procesa lo que venga):
 *   {
 *     cuit?: string,
 *     constanciaCuitUrl?: string,
 *     dniFrenteUrl?: string,
 *     dniDorsoUrl?: string,
 *     licenciaUrl?: string,
 *     licenciaExpiresAt?: string (ISO),
 *     seguroUrl?: string,
 *     seguroExpiresAt?: string (ISO),
 *     vtvUrl?: string,
 *     vtvExpiresAt?: string (ISO),
 *     cedulaVerdeUrl?: string,
 *     cedulaVerdeExpiresAt?: string (ISO),
 *   }
 *
 * Comportamiento:
 *  - Cada field cuyo status sea APPROVED: se retorna error parcial y no se toca.
 *  - Resto: se actualiza el valor, se llama resetDriverDocumentToPending() que
 *    limpia rejection + vuelve a PENDING + (si aplica) resetea el notifiedStage.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuit } from "@/lib/cuit";
import {
    DRIVER_DOCUMENT_COLUMNS,
    isValidDriverDocumentField,
    resetDriverDocumentToPending,
    type DriverDocumentField,
} from "@/lib/driver-document-approval";

// Whitelist de campos que el driver puede re-subir.
const ALLOWED_FIELDS: DriverDocumentField[] = [
    "cuit",
    "constanciaCuitUrl",
    "dniFrenteUrl",
    "dniDorsoUrl",
    "licenciaUrl",
    "seguroUrl",
    "vtvUrl",
    "cedulaVerdeUrl",
];

/**
 * Parsea un string ISO a Date. Valida que sea una fecha razonable.
 * Retorna null si el input es inválido o la fecha está fuera de rango.
 */
function parseExpirationDate(raw: unknown): Date | null | "invalid" {
    if (raw === null) return null;
    if (typeof raw !== "string" || raw.trim().length === 0) return null;
    const date = new Date(raw);
    if (isNaN(date.getTime())) return "invalid";
    // Sanity: entre hoy-1d y hoy+20 años. Licencia/RTO/seguro nunca son >20 años.
    const now = new Date();
    const maxFuture = new Date(now);
    maxFuture.setFullYear(maxFuture.getFullYear() + 20);
    const minPast = new Date(now);
    minPast.setDate(minPast.getDate() - 1);
    if (date < minPast || date > maxFuture) return "invalid";
    return date;
}

export async function PATCH(request: NextRequest) {
    const limited = await applyRateLimit(
        request,
        "driver:update-docs",
        10,
        60_000
    );
    if (limited) return limited;

    try {
        const session = await auth();
        if (
            !session?.user?.id ||
            !hasAnyRole(session, ["DRIVER", "ADMIN"])
        ) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                vehicleType: true,
                cuitStatus: true,
                constanciaCuitStatus: true,
                dniFrenteStatus: true,
                dniDorsoStatus: true,
                licenciaStatus: true,
                seguroStatus: true,
                vtvStatus: true,
                cedulaVerdeStatus: true,
            },
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Repartidor no encontrado" },
                { status: 404 }
            );
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Body inválido" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        const fieldsTouched: Array<{
            field: DriverDocumentField;
            newExpiration?: Date | null;
        }> = [];
        const errors: string[] = [];

        for (const field of ALLOWED_FIELDS) {
            const rawValue = body[field];
            if (typeof rawValue !== "string" || rawValue.trim().length === 0) continue;
            if (!isValidDriverDocumentField(field)) continue;

            const cols = DRIVER_DOCUMENT_COLUMNS[field];
            const currentStatus = (driver as any)[cols.statusColumn];

            // Hard-lock: un doc aprobado requiere change-request formal.
            if (currentStatus === "APPROVED") {
                errors.push(
                    `${cols.label} ya fue aprobado. Para modificarlo pedí permiso desde "Solicitar cambio".`
                );
                continue;
            }

            // Validaciones específicas por tipo.
            if (field === "cuit") {
                const cuitCheck = validateCuit(rawValue);
                if (!cuitCheck.valid) {
                    errors.push(cuitCheck.error || "CUIT/CUIL inválido");
                    continue;
                }
                updateData[field] = cuitCheck.normalized;
            } else {
                // Los campos URL ya vienen validados desde /api/upload/registration
                // (magic bytes + tamaño + extensión).
                updateData[field] = rawValue.trim();
            }

            // Si el campo tiene vencimiento, procesar el expiresAt correspondiente.
            let newExpiration: Date | null | undefined = undefined;
            if (cols.hasExpiration && cols.expirationColumn) {
                const rawExp = body[cols.expirationColumn as string];
                if (rawExp !== undefined) {
                    const parsed = parseExpirationDate(rawExp);
                    if (parsed === "invalid") {
                        errors.push(
                            `Fecha de vencimiento de ${cols.label} inválida.`
                        );
                        // Rollback: no incluimos este field
                        delete updateData[field];
                        continue;
                    }
                    newExpiration = parsed;
                    updateData[cols.expirationColumn] = parsed;
                }
            }

            fieldsTouched.push({
                field,
                newExpiration:
                    newExpiration === undefined ? undefined : newExpiration,
            });
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

        // Aplicamos el update con los valores nuevos.
        await prisma.driver.update({
            where: { id: driver.id },
            data: updateData,
        });

        // Cada doc actualizado vuelve a PENDING explícitamente via helper —
        // limpia rejectionReason, resetea notifiedStage, y emite audit log.
        for (const { field, newExpiration } of fieldsTouched) {
            try {
                await resetDriverDocumentToPending(
                    driver.id,
                    field,
                    session.user.id,
                    newExpiration !== undefined
                        ? { expiresAt: newExpiration }
                        : undefined
                );
            } catch (e) {
                console.error(
                    "[DriverUpdateDocs] resetDriverDocumentToPending failed for",
                    field,
                    e
                );
            }
        }

        return NextResponse.json({
            success: true,
            updated: fieldsTouched.map((f) => f.field),
            partialErrors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("[DriverUpdateDocs] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
