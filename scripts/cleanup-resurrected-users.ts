/**
 * Script de detección: usuarios "resucitados" por el bug de reactivación
 * silenciosa en auth/register (bug hasta 2026-04-21, rama user-deletion-no-resurrection).
 *
 * Contexto del bug:
 *   El endpoint auth/register/route.ts, si encontraba un User con deletedAt != null
 *   al recibir un intento de registro con el mismo email, "reactivaba" la cuenta
 *   (deletedAt = null, nuevo password, nuevo name) SIN tocar los Merchants/Drivers/
 *   SellerProfiles colgados del User. Resultado: el usuario que re-registraba con
 *   el mismo email recuperaba TODO su historial (comercios aprobados, productos,
 *   fiscal data encriptada, tokens de MercadoPago, etc.).
 *
 * Este script es READ-ONLY: reporta candidatos sospechosos. La limpieza manual
 * (re-eliminar, mantener, auditar con el usuario) la hace el admin desde OPS.
 *
 * Heurística (un candidato cumple al menos una):
 *   1. User.updatedAt supera a User.createdAt por > 7 días Y posee Merchants
 *      con approvalStatus "APPROVED" aprobados ANTES de updatedAt + 1 día.
 *      (Señal de "re-registro con data vieja colgada".)
 *   2. User con bonusActivated=false + pendingBonusPoints > 0 + createdAt > 30
 *      días atrás + Merchants APPROVED. (Post-reactivación: el bonus de
 *      bienvenida se re-seteó pero la cuenta es "vieja" con data vieja.)
 *   3. User con termsConsentAt > createdAt + 7 días (re-aceptación tardía de
 *      términos = registro nuevo contra cuenta existente).
 *
 * Uso:
 *   npx tsx scripts/cleanup-resurrected-users.ts
 *
 * Para cada candidato reporta: email, createdAt, updatedAt, bonus state,
 * merchants activos (con approvedAt), drivers, sellers. No modifica nada.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

interface Candidate {
    userId: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    termsConsentAt: Date | null;
    bonusActivated: boolean;
    pendingBonusPoints: number;
    reasons: string[];
    merchants: Array<{
        id: string;
        name: string;
        approvalStatus: string;
        isActive: boolean;
        approvedAt: Date | null;
        createdAt: Date;
    }>;
    drivers: Array<{
        id: string;
        approvalStatus: string;
        isActive: boolean;
        approvedAt: Date | null;
    }>;
    sellers: Array<{
        id: string;
        displayName: string | null;
        isActive: boolean;
    }>;
}

async function main() {
    console.log("\n🔎 MOOVY — Detección de usuarios 'resucitados' (read-only)\n");
    console.log("=".repeat(70));

    // Traer todos los users activos (deletedAt == null) con suficiente metadata
    const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            termsConsentAt: true,
            bonusActivated: true,
            pendingBonusPoints: true,
            ownedMerchants: {
                select: {
                    id: true,
                    name: true,
                    approvalStatus: true,
                    isActive: true,
                    approvedAt: true,
                    createdAt: true,
                },
            },
            driver: {
                select: {
                    id: true,
                    approvalStatus: true,
                    isActive: true,
                    approvedAt: true,
                },
            },
            sellerProfile: {
                select: {
                    id: true,
                    displayName: true,
                    isActive: true,
                },
            },
        },
    });

    const candidates: Candidate[] = [];

    for (const u of users) {
        const reasons: string[] = [];
        const gapDays = (u.updatedAt.getTime() - u.createdAt.getTime()) / DAY_MS;
        const ageDays = (Date.now() - u.createdAt.getTime()) / DAY_MS;
        const approvedMerchants = u.ownedMerchants.filter(
            (m) => m.approvalStatus === "APPROVED"
        );

        // Heurística 1: gap temporal + merchants aprobados ANTES del update
        if (gapDays > 7 && approvedMerchants.length > 0) {
            const preUpdateApproved = approvedMerchants.filter(
                (m) =>
                    m.approvedAt !== null &&
                    m.approvedAt.getTime() < u.updatedAt.getTime() - DAY_MS
            );
            if (preUpdateApproved.length > 0) {
                reasons.push(
                    `gap User.updatedAt-createdAt = ${gapDays.toFixed(1)}d + ${preUpdateApproved.length} merchant(s) aprobado(s) previamente`
                );
            }
        }

        // Heurística 2: bonus pendiente + cuenta vieja + merchants APPROVED
        if (
            !u.bonusActivated &&
            u.pendingBonusPoints > 0 &&
            ageDays > 30 &&
            approvedMerchants.length > 0
        ) {
            reasons.push(
                `bonusActivated=false + ${u.pendingBonusPoints} pts pendientes + cuenta de ${ageDays.toFixed(0)}d con merchants APPROVED`
            );
        }

        // Heurística 3: termsConsentAt muy posterior a createdAt
        if (
            u.termsConsentAt &&
            u.termsConsentAt.getTime() > u.createdAt.getTime() + 7 * DAY_MS
        ) {
            const termsGapDays =
                (u.termsConsentAt.getTime() - u.createdAt.getTime()) / DAY_MS;
            reasons.push(
                `termsConsentAt ${termsGapDays.toFixed(1)}d después de createdAt (re-aceptación)`
            );
        }

        if (reasons.length > 0) {
            candidates.push({
                userId: u.id,
                email: u.email,
                name: u.name,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
                termsConsentAt: u.termsConsentAt,
                bonusActivated: u.bonusActivated,
                pendingBonusPoints: u.pendingBonusPoints,
                reasons,
                merchants: u.ownedMerchants,
                drivers: u.driver ? [u.driver] : [],
                sellers: u.sellerProfile ? [u.sellerProfile] : [],
            });
        }
    }

    if (candidates.length === 0) {
        console.log(
            "\n✨ No se detectaron candidatos sospechosos de resurrección.\n"
        );
        const totalUsers = users.length;
        console.log(`   Total usuarios activos analizados: ${totalUsers}`);
        console.log(
            "\n   (Este resultado es consistente con una DB limpia o con la fix de\n    auth/register aplicada desde el inicio.)\n"
        );
        return;
    }

    console.log(`\n⚠️  ${candidates.length} candidato(s) sospechoso(s):\n`);

    for (const c of candidates) {
        console.log("─".repeat(70));
        console.log(`📧 ${c.email}   (${c.name || "sin nombre"})`);
        console.log(`   userId:        ${c.userId}`);
        console.log(`   createdAt:     ${c.createdAt.toISOString()}`);
        console.log(`   updatedAt:     ${c.updatedAt.toISOString()}`);
        if (c.termsConsentAt)
            console.log(`   termsConsentAt:${c.termsConsentAt.toISOString()}`);
        console.log(
            `   bonus:         activated=${c.bonusActivated}, pending=${c.pendingBonusPoints}`
        );

        console.log(`\n   Razones:`);
        c.reasons.forEach((r) => console.log(`     • ${r}`));

        if (c.merchants.length > 0) {
            console.log(`\n   Merchants (${c.merchants.length}):`);
            c.merchants.forEach((m) => {
                console.log(
                    `     - [${m.approvalStatus}/${m.isActive ? "active" : "inactive"}] ${m.name}`
                );
                console.log(
                    `         createdAt=${m.createdAt.toISOString()}  approvedAt=${m.approvedAt?.toISOString() ?? "-"}`
                );
            });
        }
        if (c.drivers.length > 0) {
            console.log(`\n   Drivers (${c.drivers.length}):`);
            c.drivers.forEach((d) => {
                console.log(
                    `     - [${d.approvalStatus}/${d.isActive ? "active" : "inactive"}] driverId=${d.id}  approvedAt=${d.approvedAt?.toISOString() ?? "-"}`
                );
            });
        }
        if (c.sellers.length > 0) {
            console.log(`\n   Sellers (${c.sellers.length}):`);
            c.sellers.forEach((s) => {
                console.log(
                    `     - [${s.isActive ? "active" : "inactive"}] ${s.displayName ?? "(sin nombre)"}  sellerId=${s.id}`
                );
            });
        }
        console.log("");
    }

    console.log("=".repeat(70));
    console.log(
        "\nAcción recomendada:\n" +
            "   1. Para cada candidato, revisar manualmente con el usuario si corresponde.\n" +
            "   2. Si fue resurrección real e indeseada: usar el panel OPS → Usuarios →\n" +
            "      Eliminar (la cascada nueva apaga Merchant/Driver/Seller y nullea\n" +
            "      la fiscal data sensible).\n" +
            "   3. Si el usuario era legítimo (se re-registró con permiso del admin\n" +
            "      previamente): dejarlo como está.\n"
    );
}

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
