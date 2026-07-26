import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { recordPointsTransaction } from "@/lib/points";
import { logUserActivity } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// POST — Ajuste manual de puntos MOOVER por un admin.
// feat/ops-ficha-usuario-operativa: el endpoint existía huérfano (sin UI y sin
// blindaje). Ahora: motivo OBLIGATORIO (≥5 chars), monto entero acotado,
// AuditLog (quién/cuánto/por qué) y entrada en la actividad del usuario —
// puntos = plata (1 pt = $1), se trazan como plata.
//
// Reversión enlazada (v2): body { revertTransactionId } crea el movimiento
// INVERSO de un ajuste existente, marcado "[REV:<id>]" en la descripción.
// Así lo hacen los programas de puntos serios: nunca se borra ni edita una
// transacción — se compensa con otra, enlazada y auditada. Guardas: solo
// ajustes manuales, una reversión no se revierte, y cada ajuste se revierte
// UNA sola vez (el marcador [REV:<id>] hace de candado).
const MAX_ADJUSTMENT = 100_000;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;
        const body = await request.json().catch(() => ({}));

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, pointsBalance: true, deletedAt: true },
        });
        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }
        if (user.deletedAt) {
            return NextResponse.json({ error: "La cuenta está eliminada — no se pueden ajustar puntos." }, { status: 409 });
        }

        // ── Rama 1: reversión enlazada de un ajuste existente ──────────────
        const revertTransactionId =
            typeof body?.revertTransactionId === "string" ? body.revertTransactionId.trim() : "";

        if (revertTransactionId) {
            const original = await prisma.pointsTransaction.findFirst({
                where: { id: revertTransactionId, userId: id },
            });
            if (!original) {
                return NextResponse.json(
                    { error: "No se encontró ese movimiento en la cuenta de este usuario." },
                    { status: 404 }
                );
            }
            if (original.type !== "ADJUSTMENT") {
                return NextResponse.json(
                    { error: "Solo se pueden revertir ajustes manuales. Los puntos de pedidos se manejan desde el pedido." },
                    { status: 400 }
                );
            }
            if (original.description?.includes("[REV:")) {
                return NextResponse.json(
                    { error: "Una reversión no se puede revertir. Si hace falta, hacé un ajuste manual nuevo con su motivo." },
                    { status: 400 }
                );
            }
            const alreadyReverted = await prisma.pointsTransaction.findFirst({
                where: { userId: id, description: { contains: `[REV:${original.id}]` } },
                select: { id: true },
            });
            if (alreadyReverted) {
                return NextResponse.json(
                    { error: "Ese movimiento ya fue revertido — cada ajuste se revierte una sola vez." },
                    { status: 409 }
                );
            }

            const inverse = -original.amount;
            if (inverse < 0 && user.pointsBalance + inverse < 0) {
                return NextResponse.json(
                    { error: `El usuario tiene ${user.pointsBalance} pts — revertir dejaría el saldo negativo (el usuario ya gastó esos puntos).` },
                    { status: 400 }
                );
            }

            const revDescription = `[REV:${original.id}] Reversión de "${(original.description ?? "ajuste").slice(0, 120)}"`;
            const ok = await recordPointsTransaction(id, "ADJUSTMENT", inverse, revDescription);
            if (!ok) {
                return NextResponse.json({ error: "Error al registrar la reversión" }, { status: 500 });
            }

            await logAudit({
                action: "ADMIN_POINTS_REVERSAL",
                entityType: "User",
                entityId: id,
                userId: admin.userId,
                details: {
                    adminEmail: admin.email ?? "unknown",
                    userEmail: user.email,
                    revertedTransactionId: original.id,
                    originalAmount: original.amount,
                    originalDescription: original.description,
                    amount: inverse,
                    balanceBefore: user.pointsBalance,
                    balanceAfter: user.pointsBalance + inverse,
                },
            });
            await logUserActivity({
                userId: id,
                action: "POINTS_ADJUSTED_BY_ADMIN",
                entityType: "User",
                entityId: id,
                metadata: {
                    amount: inverse,
                    reason: revDescription,
                    revertedTransactionId: original.id,
                    adminEmail: admin.email ?? "unknown",
                },
            });

            return NextResponse.json({ success: true, newBalance: user.pointsBalance + inverse });
        }

        // ── Rama 2: ajuste manual (sumar / restar) ─────────────────────────
        const amount = Number(body?.amount);
        const description = typeof body?.description === "string" ? body.description.trim() : "";

        if (!Number.isInteger(amount) || amount === 0) {
            return NextResponse.json(
                { error: "Cantidad inválida: entero distinto de cero (positivo suma, negativo resta)." },
                { status: 400 }
            );
        }
        if (Math.abs(amount) > MAX_ADJUSTMENT) {
            return NextResponse.json(
                { error: `Cantidad fuera de rango (máximo ±${MAX_ADJUSTMENT.toLocaleString("es-AR")} pts por ajuste).` },
                { status: 400 }
            );
        }
        if (description.length < 5) {
            return NextResponse.json(
                { error: "El motivo es obligatorio (mínimo 5 caracteres) — queda auditado." },
                { status: 400 }
            );
        }
        if (description.includes("[REV:")) {
            return NextResponse.json(
                { error: 'El marcador "[REV:" está reservado para reversiones automáticas.' },
                { status: 400 }
            );
        }
        if (amount < 0 && user.pointsBalance + amount < 0) {
            return NextResponse.json(
                { error: `El usuario tiene ${user.pointsBalance} pts — no se puede dejar el saldo negativo.` },
                { status: 400 }
            );
        }

        const success = await recordPointsTransaction(id, "ADJUSTMENT", amount, description);
        if (!success) {
            return NextResponse.json({ error: "Error al registrar la transacción" }, { status: 500 });
        }

        // Trazabilidad doble: auditoría admin + línea de tiempo del usuario.
        await logAudit({
            action: "ADMIN_POINTS_ADJUSTMENT",
            entityType: "User",
            entityId: id,
            userId: admin.userId,
            details: {
                adminEmail: admin.email ?? "unknown",
                userEmail: user.email,
                amount,
                reason: description,
                balanceBefore: user.pointsBalance,
                balanceAfter: user.pointsBalance + amount,
            },
        });
        await logUserActivity({
            userId: id,
            action: "POINTS_ADJUSTED_BY_ADMIN",
            entityType: "User",
            entityId: id,
            metadata: { amount, reason: description, adminEmail: admin.email ?? "unknown" },
        });

        return NextResponse.json({ success: true, newBalance: user.pointsBalance + amount });
    } catch (error) {
        console.error("Error adjusting points:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
