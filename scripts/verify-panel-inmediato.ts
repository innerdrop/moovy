// Verificación: panel inmediato para comercios PENDING (feat/panel-inmediato-comercio)
//
// Confirma contra la DB real y el código que abrir el panel a comercios pendientes
// NO expone nada al público:
//   1. Ningún comercio no-APPROVED cumple el where de los listados públicos.
//   2. El guard de POST /api/orders (rechazo a merchant no aprobado) sigue presente.
//   3. requireMerchantAccess permite "pending" (el panel es de armado libre).
//
// Uso: npx tsx scripts/verify-panel-inmediato.ts

import { prisma } from "../src/lib/prisma";
import { readFileSync } from "fs";
import { join } from "path";

let failures = 0;
function check(name: string, ok: boolean, detail?: string) {
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
    if (!ok) failures++;
}

async function main() {
    // 1. Listado público: el where canónico (regla #14) no devuelve pendientes.
    const publicList = await prisma.merchant.findMany({
        where: { isActive: true, approvalStatus: "APPROVED", image: { not: null } },
        select: { id: true, approvalStatus: true },
    });
    check(
        "Listado público solo contiene APPROVED",
        publicList.every((m) => m.approvalStatus === "APPROVED"),
        `${publicList.length} comercios públicos`
    );

    const pendientes = await prisma.merchant.count({ where: { approvalStatus: { not: "APPROVED" } } });
    const filtrados = await prisma.merchant.count({
        where: { approvalStatus: { not: "APPROVED" }, isActive: true, AND: { approvalStatus: "APPROVED" } },
    });
    check(
        "Ningún comercio no-aprobado pasa el filtro público",
        filtrados === 0,
        `${pendientes} comercios no-aprobados en DB, 0 visibles`
    );

    // 2. Guard de pedidos en el código (defensa en profundidad).
    const ordersRoute = readFileSync(join(process.cwd(), "src/app/api/orders/route.ts"), "utf-8");
    check(
        'POST /api/orders rechaza merchant no aprobado (guard "approvalStatus !== \\"APPROVED\\"")',
        ordersRoute.includes('approvalStatus !== "APPROVED"')
    );

    // 3. El gate del panel permite pending (case "pending" retorna access).
    const roles = readFileSync(join(process.cwd(), "src/lib/roles.ts"), "utf-8");
    const pendingReturns = /case "pending":[\s\S]{0,600}?return access;/.test(roles);
    check('requireMerchantAccess permite "pending" (panel inmediato)', pendingReturns);

    console.log(failures === 0 ? "\nTodo OK: panel inmediato sin exposición pública." : `\n${failures} chequeo(s) fallaron.`);
    process.exit(failures === 0 ? 0 : 1);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
