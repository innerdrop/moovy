// API Route: Merchant Orders
// Returns orders for the merchant's store(s)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Get merchant(s) owned by this user
        const merchants = await prisma.merchant.findMany({
            where: { ownerId: session.user.id },
            select: { id: true }
        });

        const merchantIds = merchants.map(m => m.id);

        // If ADMIN, show all orders. If MERCHANT, filter by their stores.
        // Always exclude soft-deleted orders
        const isAdmin = hasAnyRole(session, ["ADMIN"]);
        const where = isAdmin
            ? { deletedAt: null }
            : {
                  merchantId: { in: merchantIds.length > 0 ? merchantIds : ["NONE"] },
                  deletedAt: null,
              };

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: true,
                subOrders: isAdmin ? undefined : {
                    where: { merchantId: { in: merchantIds } },
                },
                address: { select: { street: true, number: true, city: true } },
                user: { select: { name: true, phone: true } },
                driver: { select: { user: { select: { name: true, phone: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit to recent orders
        });

        // ISSUE-001: PIN doble — solo mostrar pickupPin cuando AMBAS condiciones se cumplen:
        //   (a) el driver llegó al comercio (deliveryStatus=DRIVER_ARRIVED o driverStatus=AT_MERCHANT)
        //   (b) el comercio ya marcó "Listo para retirar" (merchantStatus=READY o status legacy=READY)
        //
        // Rama feat/payment-pending-cancellation (fix bug PIN prematuro):
        // Antes solo chequeaba (a). Si el driver llegaba antes que el comercio dijera
        // listo, el PIN aparecía igual y desaparecía la opción "Listo para retirar".
        // El comercio veía "ya está, dale el PIN al driver" cuando todavía no había
        // terminado de preparar. Ahora chequeamos ambas — el PIN aparece solo cuando
        // el comercio marcó listo Y el driver llegó.
        //
        // Defense-in-depth: aunque el merchant sea dueño del pedido, no exponemos el PIN
        // hasta que sea necesario. Previene leaks accidentales y ataques de phishing
        // donde un falso driver llama antes de llegar.
        const canShowPickupForOrder = (o: any): boolean => {
            const driverArrived = o.deliveryStatus === "DRIVER_ARRIVED" || o.driverStatus === "AT_MERCHANT";
            // Compat retro: pedidos pre-rama state-machine-paralela tienen merchantStatus=null,
            // en ese caso fallback al status legacy.
            const merchantReady = o.merchantStatus
                ? ["READY", "PICKED_UP", "RETURNED"].includes(o.merchantStatus)
                : ["READY", "PICKED_UP", "IN_DELIVERY", "DELIVERED"].includes(o.status);
            return driverArrived && merchantReady;
        };
        const canShowPickupForSubOrder = (sub: any): boolean => {
            const driverArrived = sub.deliveryStatus === "DRIVER_ARRIVED" || sub.driverStatus === "AT_MERCHANT";
            const merchantReady = sub.merchantStatus
                ? ["READY", "PICKED_UP", "RETURNED"].includes(sub.merchantStatus)
                : ["READY", "PICKED_UP", "IN_DELIVERY", "DELIVERED"].includes(sub.status);
            return driverArrived && merchantReady;
        };

        const sanitizedOrders = orders.map((order: any) => {
            return {
                ...order,
                pickupPin: canShowPickupForOrder(order) ? order.pickupPin : null,
                deliveryPin: null, // Nunca exponer el deliveryPin al merchant
                subOrders: order.subOrders?.map((sub: any) => ({
                    ...sub,
                    pickupPin: canShowPickupForSubOrder(sub) ? sub.pickupPin : null,
                    deliveryPin: null,
                })),
            };
        });

        return NextResponse.json(sanitizedOrders);
    } catch (error) {
        console.error("Error fetching merchant orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    }
}
