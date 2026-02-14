// API Route: Orders CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processOrderPoints, getUserPointsBalance, calculateMaxPointsDiscount, getPointsConfig } from "@/lib/points";
import { CreateOrderSchema, validateInput } from "@/lib/validations";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { httpRequestsTotal, httpRequestDuration } from "@/lib/metrics";

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
    const start = Date.now();
    let status = "201";
    try {

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Debe iniciar sesión para realizar un pedido" },
                { status: 401 }
            );
        }

        const rawData = await request.json();

        // Validate input with Zod
        const validation = validateInput(CreateOrderSchema, rawData);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const data = validation.data!;
        const {
            items,
            addressId,
            addressData,
            paymentMethod,
            deliveryFee,
            distanceKm,
            isPickup,
            deliveryNotes,
            customerNotes,
            pointsUsed,
            discountAmount,
            merchantId
        } = data;

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
                    latitude: addressData.latitude || null,
                    longitude: addressData.longitude || null,
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

        // Calculate commission
        let moovyCommission = 0;
        let merchantPayout = 0;

        if (merchantId) {
            const merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: { commissionRate: true }
            });

            if (merchant) {
                const rate = merchant.commissionRate || 8.0;
                moovyCommission = subtotal * (rate / 100);
                merchantPayout = subtotal - moovyCommission;
            }
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
                    deliveryFee: isPickup ? 0 : (deliveryFee || 0),
                    discount: validDiscount,
                    total: isPickup ? Math.max(0, subtotal - validDiscount) : finalTotal,
                    isPickup: isPickup || false,
                    distanceKm: isPickup ? null : (distanceKm || null),
                    deliveryNotes: deliveryNotes || null,
                    customerNotes: customerNotes || null,
                    moovyCommission,
                    merchantPayout,
                    commissionPaid: false,
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

        // --- REAL-TIME: Notify merchant and admin about new order ---
        if (merchantId) {
            try {
                const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

                // Notify merchant
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET || "moovy-cron-secret-change-in-production"}` },
                    body: JSON.stringify({
                        event: "new_order",
                        room: `merchant:${merchantId}`,
                        data: {
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            total: order.total,
                            status: order.status,
                            userId: session.user.id,
                        }
                    })
                });

                // Notify admin
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET || "moovy-cron-secret-change-in-production"}` },
                    body: JSON.stringify({
                        event: "new_order",
                        room: "admin:orders",
                        data: {
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            total: order.total,
                            status: order.status,
                            merchantId,
                            userId: session.user.id,
                        }
                    })
                });

                console.log(`[Socket-Emit] New order ${order.orderNumber} notified to merchant and admin`);
            } catch (e) {
                console.error("[Socket-Emit] Failed to notify new order:", e);
            }
        }

        // --- EMAIL: Send order confirmation to customer ---
        try {
            // we need the full address string for the email
            let addressString = "Dirección no especificada";
            if (addressId) {
                const addr = await prisma.address.findUnique({ where: { id: addressId } });
                if (addr) {
                    addressString = `${addr.street} ${addr.number}${addr.apartment ? `, ${addr.apartment}` : ''}, ${addr.city}`;
                }
            } else if (addressData) {
                addressString = `${addressData.street} ${addressData.number}${addressData.floor ? `, ${addressData.floor}` : ''}, ${addressData.city || 'Ushuaia'}`;
            }

            sendOrderConfirmationEmail({
                email: session.user.email || "",
                customerName: session.user.name || "Cliente",
                orderNumber: order.orderNumber,
                items: items, // use items from request which already has names/prices
                total: order.total,
                subtotal: subtotal,
                deliveryFee: order.deliveryFee,
                discount: order.discount,
                paymentMethod: paymentMethod,
                address: addressString,
                isPickup: isPickup || false
            });
        } catch (emailError) {
            console.error("[Email] Failed to trigger confirmation email:", emailError);
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
        status = "500";
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Error al crear el pedido" },
            { status: 500 }
        );
    } finally {
        try {
            const duration = Date.now() - start;
            httpRequestsTotal.inc({ method: "POST", route: "/api/orders", status });
            httpRequestDuration.observe({ method: "POST", route: "/api/orders", status }, duration);
        } catch (e) {
            console.error("Metrics increment failed:", e);
        }
    }
}



// GET - Get user's orders
export async function GET(request: Request) {
    const start = Date.now();
    let status = "200";
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
                    select: {
                        id: true,
                        latitude: true,
                        longitude: true,
                        user: { select: { name: true, phone: true } }
                    }
                },
                merchant: {
                    select: { id: true, name: true, latitude: true, longitude: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders);
    } catch (error) {
        status = "500";
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    } finally {
        try {
            const duration = Date.now() - start;
            httpRequestsTotal.inc({ method: "GET", route: "/api/orders", status });
            httpRequestDuration.observe({ method: "GET", route: "/api/orders", status }, duration);
        } catch (e) {
            console.error("Metrics increment failed:", e);
        }
    }
}



