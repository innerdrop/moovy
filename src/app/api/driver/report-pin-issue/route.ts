// API: driver reporta problema de GPS durante verificacion de PIN.
//
// feat/driver-soporte-gps-bloqueado (2026-05-13): cuando el driver intenta
// validar el PIN (pickup en el comercio o delivery en el cliente) y el sistema
// le devuelve OUT_OF_GEOFENCE, este endpoint le permite escalar el caso a OPS
// con un click + comentario opcional. Sin esto, drivers con GPS impreciso
// (frecuente en mobile + clima frio Ushuaia) quedan bloqueados sin salida.
//
// Acciones:
// 1. Validar auth driver + que el order le pertenezca.
// 2. Registrar audit log DRIVER_PIN_ISSUE_REPORTED con todo el contexto
//    (orderId, pinType, distanceMeters, ubicacion declarada, comentario).
// 3. Disparar email a alertEmails (admins configurados en StoreSettings)
//    con el contexto + telefono del driver para que llamen / wppeen.
// 4. Devolver { success, message } al driver para mostrarle confirmacion.
//
// IMPORTANTE: NO hace override del geofence automatico. La idea es que el
// admin reciba el reporte, hable con el driver por whatsapp, confirme que
// esta en el lugar y manualmente destrabe el caso desde /ops/pedidos/[id]
// si corresponde. Anti-fraude: cualquier override queda con audit trail.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";
import { logAudit } from "@/lib/audit";
import { sendAdminPinIssueEmail } from "@/lib/email-admin-ops";

export const dynamic = "force-dynamic";

// Limite de comentario para evitar spam/abuso. El driver suele escribir
// algo corto desde mobile a -5 grados con guantes — 500 chars sobran.
const COMMENT_MAX = 500;

const reportSchema = z.object({
    orderId: z.string().min(1, "orderId requerido"),
    pinType: z.enum(["pickup", "delivery"]),
    // distanceMeters viene del backend de verificacion del PIN. Puede ser
    // null si el driver reportar antes de intentar el PIN (poco probable
    // pero defendemos contra eso).
    distanceMeters: z.number().nonnegative().max(100_000).optional().nullable(),
    // Ubicacion del driver al momento de reportar. Opcional porque el
    // permiso de geolocation puede estar denegado.
    currentLat: z.number().min(-90).max(90).optional().nullable(),
    currentLng: z.number().min(-180).max(180).optional().nullable(),
    // Lo que el driver escribe en el textarea libre.
    comment: z.string().max(COMMENT_MAX).optional().nullable(),
});

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireDriverApi({ allowAdmin: false });
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;
        if (!driver) {
            return NextResponse.json({ error: "Driver no encontrado" }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = reportSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Body inválido" },
                { status: 400 }
            );
        }

        const { orderId, pinType, distanceMeters, currentLat, currentLng, comment } = parsed.data;

        // Verificar que el order le pertenezca al driver (anti-abuso).
        // Para multi-vendor el driver puede estar asignado al SubOrder en vez
        // del Order; chequeamos ambos.
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                driverId: true,
                isMultiVendor: true,
                subOrders: {
                    select: { driverId: true },
                },
                user: { select: { name: true, phone: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        const driverAssignedToOrder = order.driverId === driver.id
            || order.subOrders.some((so) => so.driverId === driver.id);
        if (!driverAssignedToOrder) {
            return NextResponse.json(
                { error: "Este pedido no te fue asignado" },
                { status: 403 }
            );
        }

        // Cargar nombre + telefono del driver desde el User asociado.
        const driverUser = await prisma.user.findUnique({
            where: { id: driver.userId },
            select: { name: true, phone: true },
        });

        const trimmedComment = (comment || "").trim() || null;

        // Audit log con TODO el contexto. Si el caso escala a una disputa
        // o investigacion de fraude, esta es la fuente de verdad.
        await logAudit({
            action: "DRIVER_PIN_ISSUE_REPORTED",
            entityType: "Order",
            entityId: orderId,
            userId: driver.userId,
            details: {
                driverId: driver.id,
                pinType,
                distanceMeters: distanceMeters ?? null,
                currentLat: currentLat ?? null,
                currentLng: currentLng ?? null,
                comment: trimmedComment,
                userAgent: request.headers.get("user-agent") || null,
            },
        }).catch((err) => console.error("[report-pin-issue] audit failed:", err));

        // Email a admin/owner. Fire-and-forget para no bloquear la response.
        sendAdminPinIssueEmail({
            driverName: driverUser?.name || "Repartidor",
            driverPhone: driverUser?.phone || "No informado",
            orderId: order.id,
            orderNumber: order.orderNumber,
            pinType,
            distanceMeters: distanceMeters ?? null,
            currentLat: currentLat ?? null,
            currentLng: currentLng ?? null,
            comment: trimmedComment,
        }).catch((err) => console.error("[report-pin-issue] email failed:", err));

        return NextResponse.json({
            success: true,
            message: "Avisamos a soporte. Te van a contactar para destrabar el caso.",
        });
    } catch (error: any) {
        console.error("[report-pin-issue] Error:", error);
        return NextResponse.json(
            { error: "Error al registrar el reporte. Probá de nuevo o contactá soporte por WhatsApp." },
            { status: 500 }
        );
    }
}
