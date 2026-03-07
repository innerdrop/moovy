// API Route: Create MercadoPago Preference for an order
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { preferenceApi, buildPreferenceBody } from "@/lib/mercadopago";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { orderId } = body as { orderId?: string };

        if (!orderId) {
            return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
        }

        // Fetch order with items and subOrders
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { select: { id: true, name: true, price: true, quantity: true } },
                subOrders: { select: { moovyCommission: true } },
                user: { select: { name: true, email: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        // Validate ownership
        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Validate order is eligible for MP payment
        if (order.paymentMethod !== "mercadopago") {
            return NextResponse.json(
                { error: "Esta orden no usa MercadoPago como método de pago" },
                { status: 400 }
            );
        }

        if (!["PENDING", "AWAITING_PAYMENT"].includes(order.status)) {
            return NextResponse.json(
                { error: "La orden no está en estado válido para pagar" },
                { status: 400 }
            );
        }

        // Idempotency: if preference already exists, return it
        if (order.mpPreferenceId) {
            return NextResponse.json({
                preferenceId: order.mpPreferenceId,
                initPoint: order.mpStatus || null, // stored init_point in mpStatus temporarily
            });
        }

        // Build and create MP Preference
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        const preferenceBody = buildPreferenceBody(order, baseUrl);

        const preference = await preferenceApi.create({ body: preferenceBody });

        // Save preference ID and init_point
        await prisma.order.update({
            where: { id: orderId },
            data: {
                mpPreferenceId: preference.id || null,
                status: "AWAITING_PAYMENT",
            },
        });

        return NextResponse.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
        });
    } catch (error) {
        console.error("Error creating MP preference:", error);
        return NextResponse.json(
            { error: "Error al crear la preferencia de pago" },
            { status: 500 }
        );
    }
}
