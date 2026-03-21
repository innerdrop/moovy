/**
 * API Route: OPS Logistics SLA Dashboard
 * GET → returns live order stats: active orders with SLA status,
 *       priority queue, and aggregate KPIs.
 *
 * Nota: Hasta que se agregue `shipmentTypeCode` al modelo Order
 * (ver CAMBIOS_COMPARTIDOS_LOGISTICS.md), se infiere el tipo
 * de envío desde la categoría del comercio vía autoDetectShipmentType().
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { autoDetectShipmentType, getShipmentType } from "@/lib/shipment-types";
import { calculateOrderPriority, classifyOrderUrgency } from "@/lib/order-priority";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Active orders = not delivered, not cancelled, not deleted
    const activeOrders = await prisma.order.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      include: {
        merchant: {
          select: {
            businessName: true,
            category: true,
          },
        },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Enrich each order with shipment type + priority + SLA status
    const enriched = activeOrders.map((order: any) => {
      const merchantCategoryName = order.merchant?.category ?? "";
      const productNames = (order.items ?? [])
        .map((i: any) => i.product?.name ?? "")
        .filter(Boolean);

      const shipmentTypeCode = autoDetectShipmentType({
        merchantCategoryName,
        productNames,
      });
      const shipmentDef = getShipmentType(shipmentTypeCode);

      const elapsedMin = Math.round(
        (Date.now() - new Date(order.createdAt).getTime()) / 60000
      );
      const slaMinutes = shipmentDef.maxDeliveryMinutes;
      const slaPercent = Math.round((elapsedMin / slaMinutes) * 100);
      const exceedsSLA = elapsedMin > slaMinutes;

      const priority = calculateOrderPriority({
        id: order.id,
        createdAt: new Date(order.createdAt),
        shipmentTypeCode,
        assignmentAttempts: order.assignmentAttempts,
        deliveryType: order.deliveryType as "IMMEDIATE" | "SCHEDULED" | undefined,
        scheduledSlotStart: order.scheduledSlotStart
          ? new Date(order.scheduledSlotStart)
          : undefined,
      });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        merchantName: order.merchant?.businessName ?? "—",
        createdAt: order.createdAt,
        elapsedMin,
        shipmentTypeCode,
        shipmentTypeName: shipmentDef.name,
        shipmentTypeIcon: shipmentDef.icon,
        slaMinutes,
        slaPercent,
        exceedsSLA,
        priority: priority.priority,
        hasDriver: !!order.driverId,
        assignmentAttempts: order.assignmentAttempts,
        distanceKm: order.distanceKm,
      };
    });

    // Sort by priority descending (highest priority first)
    enriched.sort((a, b) => b.priority - a.priority);

    // Classify urgency
    const urgencyInput = enriched.map((o) => ({
      id: o.id,
      createdAt: new Date(o.createdAt),
      shipmentTypeCode: o.shipmentTypeCode as "HOT" | "FRESH" | "FRAGILE" | "DOCUMENT" | "STANDARD",
      assignmentAttempts: o.assignmentAttempts,
    }));
    const urgency = classifyOrderUrgency(urgencyInput);

    // KPIs
    const totalActive = enriched.length;
    const criticalCount = urgency.critical.length;
    const urgentCount = urgency.urgent.length;
    const normalCount = urgency.normal.length;
    const withoutDriver = enriched.filter((o) => !o.hasDriver).length;
    const exceedingSLA = enriched.filter((o) => o.exceedsSLA).length;
    const avgWaitMin =
      totalActive > 0
        ? Math.round(enriched.reduce((sum, o) => sum + o.elapsedMin, 0) / totalActive)
        : 0;

    // Recent deliveries (last 24h) for SLA compliance rate
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDelivered = await prisma.order.count({
      where: {
        deletedAt: null,
        status: "DELIVERED",
        deliveredAt: { gte: twentyFourHoursAgo },
      },
    });
    const recentTotal = await prisma.order.count({
      where: {
        deletedAt: null,
        createdAt: { gte: twentyFourHoursAgo },
        status: { notIn: ["CANCELLED"] },
      },
    });
    const slaComplianceRate =
      recentTotal > 0 ? Math.round((recentDelivered / recentTotal) * 100) : 100;

    return NextResponse.json({
      orders: enriched,
      kpis: {
        totalActive,
        criticalCount,
        urgentCount,
        normalCount,
        withoutDriver,
        exceedingSLA,
        avgWaitMin,
        slaComplianceRate,
        recentDelivered,
        recentTotal,
      },
    });
  } catch (error) {
    console.error("Error fetching SLA dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener dashboard SLA" },
      { status: 500 }
    );
  }
}
