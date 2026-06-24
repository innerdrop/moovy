import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/pending-counts
 *
 * Lightweight endpoint para el badge amarillo "pendientes de aprobacion"
 * en el sidebar OPS (items "Usuarios" y "Pipeline Comercios").
 *
 * Devuelve los counts de Merchant + Driver con approvalStatus = "PENDING".
 * Ambos modelos tienen indice en approvalStatus (ver prisma/schema.prisma:699
 * y :867), asi que el count es O(log n).
 *
 * Soft delete: Merchant y Driver no tienen deletedAt propio (el soft delete
 * cascade desde User). Filtramos por owner.deletedAt / user.deletedAt = null
 * para no contar solicitudes huerfanas de cuentas eliminadas (no son
 * actionables por el admin).
 *
 * Polling: el sidebar lo llama cada 60s. No hay cache server-side porque
 * dos counts indexados son muy baratos y queremos que cuando un admin
 * aprueba un caso, el badge baje al instante.
 *
 * Behavior degradado: si falla la auth o la query, devuelve ceros para
 * no romper el render del sidebar (mismo patron que /api/admin/active-orders).
 */
export async function GET() {
    try {
        // Behavior degradado: si la auth no es admin (DB source of truth),
        // devolvemos ceros para no romper el render del sidebar.
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) {
            return NextResponse.json({ merchants: 0, drivers: 0, total: 0 });
        }

        const [merchants, drivers] = await Promise.all([
            prisma.merchant.count({
                where: {
                    approvalStatus: "PENDING",
                    owner: { deletedAt: null },
                },
            }),
            prisma.driver.count({
                where: {
                    approvalStatus: "PENDING",
                    user: { deletedAt: null },
                },
            }),
        ]);

        return NextResponse.json({
            merchants,
            drivers,
            total: merchants + drivers,
        });
    } catch {
        return NextResponse.json({ merchants: 0, drivers: 0, total: 0 });
    }
}
