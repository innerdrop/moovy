// feat/driver-bank-mp (2026-04-26)
//
// Endpoint del driver para cargar/actualizar sus datos bancarios.
// Sin estos datos, MOOVY no puede pagar el payout semanal vía MP Bulk Transfer.
//
// PATCH /api/driver/bank-account
// Body: { bankCbu?: string, bankAlias?: string }
// - Acepta uno u otro o ambos. Al menos uno es requerido.
// - Valida con el helper canónico bank-account.ts (CBU = checksum BCRA, Alias = 6-20 chars).
// - Audit log DRIVER_BANK_ACCOUNT_UPDATED con previous/new values (saneados).
//
// GET /api/driver/bank-account
// - Devuelve los datos bancarios actuales del driver autenticado.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { validateBankAccount } from "@/lib/bank-account";
import { z } from "zod";

const PatchSchema = z.object({
    bankCbu: z.string().max(50).optional().nullable(),
    bankAlias: z.string().max(50).optional().nullable(),
});

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
        select: {
            id: true,
            bankCbu: true,
            bankAlias: true,
            bankAccountUpdatedAt: true,
        },
    });

    if (!driver) {
        return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
        bankCbu: driver.bankCbu ?? null,
        bankAlias: driver.bankAlias ?? null,
        bankAccountUpdatedAt: driver.bankAccountUpdatedAt?.toISOString() ?? null,
        hasBankAccount: !!(driver.bankCbu || driver.bankAlias),
    });
}

export async function PATCH(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
        select: {
            id: true,
            bankCbu: true,
            bankAlias: true,
        },
    });

    if (!driver) {
        return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Datos inválidos", detail: parsed.error.issues[0]?.message },
            { status: 400 }
        );
    }

    const { bankCbu: rawCbu, bankAlias: rawAlias } = parsed.data;

    // Normalizar: trim + null si vacío
    const cbuInput = rawCbu?.trim() || null;
    const aliasInput = rawAlias?.trim() || null;

    // Al menos uno es requerido (no se permite vaciar ambos — eso es sub-uso del endpoint)
    if (!cbuInput && !aliasInput) {
        return NextResponse.json(
            { error: "Tenés que cargar al menos un CBU o un Alias" },
            { status: 400 }
        );
    }

    // Validar cada campo si vino con valor
    let normalizedCbu: string | null = null;
    let normalizedAlias: string | null = null;

    if (cbuInput) {
        const v = validateBankAccount(cbuInput);
        if (!v.valid || v.type !== "CBU") {
            return NextResponse.json(
                { error: v.error || "CBU inválido. Tienen que ser 22 dígitos con checksum válido." },
                { status: 400 }
            );
        }
        normalizedCbu = v.normalized;
    }

    if (aliasInput) {
        const v = validateBankAccount(aliasInput);
        if (!v.valid || v.type !== "ALIAS") {
            return NextResponse.json(
                { error: v.error || "Alias inválido. 6-20 caracteres alfanuméricos, puntos o guiones." },
                { status: 400 }
            );
        }
        normalizedAlias = v.normalized;
    }

    const now = new Date();
    await prisma.driver.update({
        where: { id: driver.id },
        data: {
            bankCbu: normalizedCbu,
            bankAlias: normalizedAlias,
            bankAccountUpdatedAt: now,
        },
    });

    // Audit log con valores previos y nuevos (sin guardar CBU plaintext en details — solo flag)
    logAudit({
        action: "DRIVER_BANK_ACCOUNT_UPDATED",
        entityType: "Driver",
        entityId: driver.id,
        userId: session.user.id,
        details: {
            previousHadCbu: !!driver.bankCbu,
            previousHadAlias: !!driver.bankAlias,
            newHasCbu: !!normalizedCbu,
            newHasAlias: !!normalizedAlias,
            timestamp: now.toISOString(),
        },
    }).catch((err) => console.error("[bank-account] audit log failed:", err));

    return NextResponse.json({
        success: true,
        bankCbu: normalizedCbu,
        bankAlias: normalizedAlias,
        bankAccountUpdatedAt: now.toISOString(),
        hasBankAccount: !!(normalizedCbu || normalizedAlias),
        message: "Datos bancarios actualizados. Te vamos a pagar a esta cuenta.",
    });
}
