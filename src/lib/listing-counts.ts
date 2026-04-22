/**
 * ISSUE-029: Contador `soldCount` de listings debe EXCLUIR auto-compras.
 *
 * Un seller que se compra su propio producto (mismo `User` detrás del buyer y del
 * SellerProfile) no cuenta como venta real y no debe inflar el "X vendidos" público.
 *
 * El `_count.orderItems` nativo de Prisma no soporta referenciar campos del padre
 * (`listing.seller.userId`) dentro del `where` del count, así que resolvemos con un
 * solo `$queryRaw` que hace el join completo y excluye las auto-compras en SQL.
 *
 * Uso: pasar el array de `Listing.id` visibles en la pantalla, recibir un Map
 * `listingId -> soldCount`. Si no se encuentra el listing en el Map, asumir 0.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SoldCountRow = { listingId: string; soldCount: bigint };

/**
 * Retorna un Map `listingId -> soldCount` contando solo OrderItems donde el
 * comprador (`Order.userId`) NO coincide con el dueño del SellerProfile
 * (`SellerProfile.userId`). Listings sin ventas quedan fuera del Map (asumir 0).
 */
export async function getSoldCountsExcludingAutoPurchases(
    listingIds: string[]
): Promise<Map<string, number>> {
    if (listingIds.length === 0) return new Map();

    const rows = await prisma.$queryRaw<SoldCountRow[]>`
        SELECT oi."listingId" AS "listingId",
               COUNT(*)::bigint AS "soldCount"
        FROM "OrderItem" oi
        INNER JOIN "Order" o ON oi."orderId" = o.id
        INNER JOIN "Listing" l ON oi."listingId" = l.id
        INNER JOIN "SellerProfile" sp ON l."sellerId" = sp.id
        WHERE oi."listingId" IN (${Prisma.join(listingIds)})
          AND o."userId" <> sp."userId"
        GROUP BY oi."listingId"
    `;

    return new Map(rows.map((r) => [r.listingId, Number(r.soldCount)]));
}
