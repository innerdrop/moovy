// API Route: Orders CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processOrderPoints, getUserPointsBalance, calculateMaxPointsDiscount, getPointsConfig } from "@/lib/points";

// Helper to generate order number (MOV-XXXX format)
function generateOrderNumber(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like 0/O, 1/I
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MOV-${code}`;
}

// POST - Create a new order
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Debe iniciar sesión para realizar un pedido" },
                { status: 401 }
            );
        }

        const data = await request.json();
        const {
            items,
            addressId,
            addressData,
            paymentMethod,
            deliveryFee,
            distanceKm,
            deliveryNotes,
            customerNotes,
            pointsUsed,
            discountAmount,
            merchantId
        } = data;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "El carrito está vacío" },
                { status: 400 }
            );
        }

        // Calculate subtotal
        const subtotal = items.reduce(
            (sum: number, item: { price: number; quantity: number }) =>
                sum + item.price * item.quantity,
            0
        );

        let finalTotal = subtotal + (deliveryFee || 0);

        // Validate points usage
        let validPointsUsed = 0;
        let validDiscount = 0;

        if (pointsUsed > 0) {
            const userBalance = await getUserPointsBalance(session.user.id);
            const config = await getPointsConfig();

            // Re-calculate to ensure frontend didn't tamper with values
            const maxDiscount = calculateMaxPointsDiscount(subtotal, userBalance, config);

            if (pointsUsed <= maxDiscount.pointsUsable) {
                validPointsUsed = pointsUsed;
                // Use the explicitly requested discount amount unless it exceeds calculated max
                // This handles rounding differences, but caps it at secure max
                validDiscount = Math.min(discountAmount || 0, maxDiscount.discountAmount);
            }

            finalTotal = Math.max(0, finalTotal - validDiscount);
        }

        // Get or create address
        let finalAddressId = addressId;

        if (!addressId && addressData) {
            // Create new address for this user
            const newAddress = await prisma.address.create({
                data: {
                    userId: session.user.id,
                    label: "Entrega",
                    street: addressData.street,
                    number: addressData.number,
                    apartment: addressData.floor || null,
                    neighborhood: null,
                    city: addressData.city || "Ushuaia",
                    province: "Tierra del Fuego",
                    isDefault: false,
                },
            });
            finalAddressId = newAddress.id;
        }

        if (!finalAddressId) {
            return NextResponse.json(
                { error: "Se requiere una dirección de entrega" },
                { status: 400 }
            );
        }

        // Create order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    userId: session.user.id,
                    addressId: finalAddressId,
                    merchantId: merchantId || null,
                    status: "PENDING",
                    paymentStatus: "PENDING",
                    paymentMethod: paymentMethod || "cash",
                    subtotal,
                    deliveryFee: deliveryFee || 0,
                    discount: validDiscount,
                    total: finalTotal,
                    distanceKm: distanceKm || null,
                    deliveryNotes: deliveryNotes || null,
                    customerNotes: customerNotes || null,
                },
            });

            // Create order items
            for (const item of items) {
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        variantName: item.variantName || null,
                        subtotal: item.price * item.quantity,
                    },
                });

                // Update product stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });
            }

            return newOrder;
        });

        // Process points independently (outside Prisma transaction as it uses different DB connection method)
        // This calculates points earned AND deducts points used
        // Since we are using "better-sqlite3" in lib/points.ts and prisma here, we can't share transaction easily.
        // In a real production postgres app, both would use the same connection pool.
        let pointsResult = { earned: 0, spent: 0 };
        try {
            pointsResult = await processOrderPoints(
                session.user.id,
                order.id,
                // Points are earned on SUBTOTAL (products only), not including delivery
                subtotal,
                validPointsUsed
            );
        } catch (pointsError) {
            console.error("Error processing points for order:", order.id, pointsError);
            // Don't fail the order if points fail, but log it
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: order.total,
                status: order.status,
            },
            points: pointsResult
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Error al crear el pedido" },
            { status: 500 }
        );
    }
}

// GET - Get user's orders
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const isAdmin = (session.user as any).role === "ADMIN";
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: any = isAdmin ? {} : { userId: session.user.id };
        if (status) {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: true,
                address: true,
                user: {
                    select: { id: true, name: true, email: true, phone: true },
                },
                driver: {
                    select: { id: true, user: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    }
}

