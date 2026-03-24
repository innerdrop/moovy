// API Route: Orders CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { processOrderPoints, getUserPointsBalance, calculateMaxPointsDiscount, getPointsConfig, recordPointsTransaction } from "@/lib/points";
import { CreateOrderSchema, validateInput } from "@/lib/validations";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { httpRequestsTotal, httpRequestDuration } from "@/lib/metrics";
import { preferenceApi, buildPreferenceBody, createVendorPreference } from "@/lib/mercadopago";
import { applyRateLimit } from "@/lib/rate-limit";
import { notifyMerchant, notifySeller } from "@/lib/notifications";
import { orderLogger } from "@/lib/logger";
import { calculateShippingCost, validateDeliveryFee } from "@/lib/shipping-cost-calculator";

// Read a MoovyConfig value with fallback
async function getConfigValue(key: string, fallback: string): Promise<string> {
    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    return config?.value ?? fallback;
}

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
    // Rate limit: max 10 orders per minute per IP
    const limited = await applyRateLimit(request, "orders:create", 10, 60_000);
    if (limited) return limited;

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
            groups,
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
            merchantId,
            deliveryType,
            scheduledSlotStart,
            scheduledSlotEnd,
            couponCode,
        } = data;

        const isMultiVendor = (groups && groups.length > 1) || false;

        // BUG #5 FIX: Enhanced delivery fee validation (fraud prevention)
        // Validate that deliveryFee is reasonable and server-side calculated
        let validatedDeliveryFee = deliveryFee || 0;

        if (!isPickup) {
            // For deliveries, validate fee is not negative and not zero
            if (deliveryFee !== undefined && deliveryFee !== null && deliveryFee < 0) {
                return NextResponse.json(
                    { error: "El costo de envío no puede ser negativo" },
                    { status: 400 }
                );
            }

            // AUDIT FIX 2.5: Reject delivery orders with no delivery fee instead of hardcoding
            // Previous: silently set to 100 ARS. Now: require frontend to send a calculated fee.
            if (!deliveryFee || deliveryFee === 0) {
                // Try server-side calculation if distance is available
                if (distanceKm && distanceKm > 0) {
                    try {
                        const serverFee = calculateShippingCost({
                            distanceKm,
                            packageCategory: "MEDIUM",
                            shipmentTypeCode: "STANDARD",
                            orderTotal: 0, // Not yet calculated — just need base fee
                            freeDeliveryMinimum: null,
                        });
                        if (serverFee && serverFee.total > 0) {
                            validatedDeliveryFee = serverFee.total;
                            orderLogger.info(
                                { distanceKm, calculatedFee: serverFee.total },
                                "Server-side delivery fee calculation for missing frontend fee"
                            );
                        } else {
                            return NextResponse.json(
                                { error: "No se pudo calcular el costo de envío. Intentá de nuevo." },
                                { status: 400 }
                            );
                        }
                    } catch {
                        return NextResponse.json(
                            { error: "Error al calcular el costo de envío. Intentá de nuevo." },
                            { status: 400 }
                        );
                    }
                } else {
                    return NextResponse.json(
                        { error: "Se requiere el costo de envío para pedidos con delivery" },
                        { status: 400 }
                    );
                }
            }
        } else {
            // For pickup orders, fee must be 0
            validatedDeliveryFee = 0;
        }

        // Calculate subtotal
        const subtotal = items.reduce(
            (sum: number, item: { price: number; quantity: number }) =>
                sum + item.price * item.quantity,
            0
        );

        let finalTotal = subtotal + validatedDeliveryFee;

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

        // Calculate commission (read default from MoovyConfig)
        let moovyCommission = 0;
        let merchantPayout = 0;
        const defaultMerchantCommission = parseFloat(await getConfigValue("default_merchant_commission_pct", "8"));

        if (merchantId) {
            const merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: {
                    commissionRate: true,
                    approvalStatus: true,
                    isOpen: true,
                    minOrderAmount: true,
                    deliveryRadiusKm: true,
                    businessName: true,
                    scheduleEnabled: true,
                    scheduleJson: true,
                }
            });

            if (!merchant) {
                return NextResponse.json(
                    { error: "Comercio no encontrado" },
                    { status: 404 }
                );
            }

            // AUDIT FIX 1.2: Validate merchant is approved
            if (merchant.approvalStatus !== "APPROVED") {
                orderLogger.warn(
                    { merchantId, approvalStatus: merchant.approvalStatus },
                    "Order attempt on non-approved merchant"
                );
                return NextResponse.json(
                    { error: "Este comercio no está habilitado para recibir pedidos" },
                    { status: 403 }
                );
            }

            // AUDIT FIX 1.3: Validate merchant is open
            if (!merchant.isOpen) {
                return NextResponse.json(
                    { error: `${merchant.businessName || "El comercio"} está cerrado en este momento` },
                    { status: 400 }
                );
            }

            // AUDIT FIX 1.3b: Validate merchant schedule for immediate orders
            if (deliveryType !== "SCHEDULED" && merchant.scheduleEnabled && merchant.scheduleJson) {
                try {
                    const schedule = JSON.parse(merchant.scheduleJson);
                    const now = new Date();
                    const jsDay = now.getDay();
                    const scheduleDay = jsDay === 0 ? "7" : String(jsDay);
                    const daySchedule = schedule[scheduleDay];

                    if (!daySchedule) {
                        return NextResponse.json(
                            { error: `${merchant.businessName || "El comercio"} no opera hoy` },
                            { status: 400 }
                        );
                    }

                    const currentHour = now.getHours();
                    const currentMin = now.getMinutes();
                    const [openH, openM] = daySchedule.open.split(":").map(Number);
                    const [closeH, closeM] = daySchedule.close.split(":").map(Number);
                    const currentMinutes = currentHour * 60 + currentMin;
                    const openMinutes = openH * 60 + (openM || 0);
                    const closeMinutes = closeH * 60 + (closeM || 0);

                    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
                        return NextResponse.json(
                            { error: `${merchant.businessName || "El comercio"} está fuera de horario (${daySchedule.open}-${daySchedule.close})` },
                            { status: 400 }
                        );
                    }
                } catch {
                    // Invalid schedule JSON — skip validation, log warning
                    orderLogger.warn({ merchantId }, "Invalid scheduleJson, skipping schedule validation");
                }
            }

            // AUDIT FIX 2.2: Validate minimum order amount
            if (merchant.minOrderAmount && subtotal < merchant.minOrderAmount) {
                return NextResponse.json(
                    { error: `El pedido mínimo para ${merchant.businessName || "este comercio"} es de $${merchant.minOrderAmount}` },
                    { status: 400 }
                );
            }

            // AUDIT FIX 2.1: Validate delivery radius
            if (!isPickup && merchant.deliveryRadiusKm && distanceKm) {
                if (distanceKm > merchant.deliveryRadiusKm) {
                    return NextResponse.json(
                        { error: `Tu dirección está fuera del radio de entrega de ${merchant.businessName || "este comercio"} (máx ${merchant.deliveryRadiusKm}km)` },
                        { status: 400 }
                    );
                }
            }

            const rate = merchant.commissionRate || defaultMerchantCommission;
            moovyCommission = subtotal * (rate / 100);
            merchantPayout = subtotal - moovyCommission;
        }

        // AUDIT FIX 1.4+1.5: Pre-validate coupon with maxUsesPerUser check
        // Actual recording moved inside main transaction to prevent race conditions
        let validCouponCode: string | undefined;
        if (couponCode) {
            try {
                const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
                if (coupon && coupon.isActive) {
                    const now = new Date();
                    const notExpired = !coupon.validUntil || coupon.validUntil > now;
                    const notExhausted = !coupon.maxUses || coupon.usedCount < coupon.maxUses;

                    // Check per-user limit
                    let perUserOk = true;
                    if (coupon.maxUsesPerUser) {
                        const userUsageCount = await prisma.couponUsage.count({
                            where: {
                                couponId: coupon.id,
                                userId: session.user.id,
                            },
                        });
                        perUserOk = userUsageCount < coupon.maxUsesPerUser;
                    }

                    if (notExpired && notExhausted && perUserOk) {
                        validCouponCode = couponCode;
                    } else if (!perUserOk) {
                        orderLogger.info(
                            { couponCode, userId: session.user.id },
                            "Coupon per-user limit reached"
                        );
                    }
                }
            } catch (e) {
                orderLogger.warn({ couponCode }, "Coupon validation failed, proceeding without coupon");
            }
        }

        // Create order with items in a transaction
        // BUG #4 FIX: Move points deduction INSIDE transaction to prevent order with discount but no points deduction
        let pointsResult = { earned: 0, spent: 0 };
        const order = await prisma.$transaction(async (tx) => {
            // --- PRE-FLIGHT STOCK VALIDATION ---
            // Check all items have sufficient stock BEFORE creating the order
            const stockErrors: string[] = [];
            for (const item of items) {
                const isListing = item.type === "listing";
                if (isListing) {
                    const listing = await tx.listing.findUnique({
                        where: { id: item.productId },
                        select: { id: true, title: true, stock: true, isActive: true },
                    });
                    if (!listing) {
                        stockErrors.push(`Publicación "${item.name}" ya no existe`);
                    } else if (!listing.isActive) {
                        stockErrors.push(`"${item.name}" ya no está disponible`);
                    } else if (listing.stock < item.quantity) {
                        stockErrors.push(
                            listing.stock === 0
                                ? `"${item.name}" está agotado`
                                : `"${item.name}" solo tiene ${listing.stock} unidad(es) disponible(s)`
                        );
                    }
                } else {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { id: true, name: true, stock: true, isActive: true },
                    });
                    if (!product) {
                        stockErrors.push(`Producto "${item.name}" ya no existe`);
                    } else if (!product.isActive) {
                        stockErrors.push(`"${item.name}" ya no está disponible`);
                    } else if (product.stock < item.quantity) {
                        stockErrors.push(
                            product.stock === 0
                                ? `"${item.name}" está agotado`
                                : `"${item.name}" solo tiene ${product.stock} unidad(es) disponible(s)`
                        );
                    }
                }
            }

            if (stockErrors.length > 0) {
                throw new Error(`STOCK_ERROR:${JSON.stringify(stockErrors)}`);
            }

            // Validate scheduled slot capacity
            const isScheduled = deliveryType === "SCHEDULED";
            if (isScheduled && scheduledSlotStart && scheduledSlotEnd) {
                const slotStart = new Date(scheduledSlotStart);
                const slotEnd = new Date(scheduledSlotEnd);

                // Count existing orders in the same time slot (not cancelled)
                const existingOrdersInSlot = await tx.order.count({
                    where: {
                        deliveryType: "SCHEDULED",
                        scheduledSlotStart: { gte: slotStart },
                        scheduledSlotEnd: { lte: slotEnd },
                        status: { notIn: ["CANCELLED"] },
                        deletedAt: null,
                    },
                });

                // Max 15 orders per 2-hour slot (configurable via MoovyConfig if needed)
                const MAX_ORDERS_PER_SLOT = 15;
                if (existingOrdersInSlot >= MAX_ORDERS_PER_SLOT) {
                    throw new Error("SLOT_FULL:El horario seleccionado ya no tiene disponibilidad. Por favor elegí otro horario.");
                }

                // Validate slot is within vendor's operating hours
                // Convert JS day (0=Sun) to schedule format (1=Mon..7=Sun)
                const jsDay = slotStart.getDay();
                const scheduleDay = jsDay === 0 ? "7" : String(jsDay);
                const slotHour = slotStart.getHours();

                // Check primary merchant schedule if available
                if (merchantId) {
                    const merchant = await tx.merchant.findUnique({
                        where: { id: merchantId },
                        select: { scheduleEnabled: true, scheduleJson: true, name: true },
                    });
                    if (merchant?.scheduleEnabled && merchant.scheduleJson) {
                        try {
                            const schedule = JSON.parse(merchant.scheduleJson);
                            const daySchedule = schedule[scheduleDay];
                            if (!daySchedule) {
                                throw new Error(`SLOT_FULL:${merchant.name} no opera ese día. Elegí otro horario.`);
                            }
                            const [openH] = daySchedule.open.split(":").map(Number);
                            const [closeH] = daySchedule.close.split(":").map(Number);
                            if (slotHour < openH || slotHour >= closeH) {
                                throw new Error(`SLOT_FULL:El horario seleccionado está fuera del horario de ${merchant.name} (${daySchedule.open}-${daySchedule.close}).`);
                            }
                        } catch (e: any) {
                            if (e?.message?.startsWith("SLOT_FULL:")) throw e;
                            // Invalid JSON, skip validation
                        }
                    }
                }
            }

            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    userId: session.user.id,
                    addressId: finalAddressId,
                    merchantId: merchantId || null,
                    status: isScheduled ? "SCHEDULED" : "PENDING",
                    paymentStatus: "PENDING",
                    paymentMethod: paymentMethod || "cash",
                    subtotal,
                    deliveryFee: validatedDeliveryFee,
                    discount: validDiscount,
                    total: isPickup ? Math.max(0, subtotal - validDiscount) : finalTotal,
                    isPickup: isPickup || false,
                    distanceKm: isPickup ? null : (distanceKm || null),
                    deliveryNotes: deliveryNotes || null,
                    customerNotes: customerNotes || null,
                    moovyCommission,
                    merchantPayout,
                    commissionPaid: false,
                    isMultiVendor,
                    deliveryType: isScheduled ? "SCHEDULED" : "IMMEDIATE",
                    scheduledSlotStart: scheduledSlotStart ? new Date(scheduledSlotStart) : null,
                    scheduledSlotEnd: scheduledSlotEnd ? new Date(scheduledSlotEnd) : null,
                },
            });

            // Create order items
            for (const item of items) {
                const isListing = item.type === "listing";
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: isListing ? null : item.productId,
                        listingId: isListing ? item.productId : null,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        variantName: item.variantName || null,
                        subtotal: item.price * item.quantity,
                    },
                });

                // BUG #8 FIX: Update stock and verify it doesn't go negative
                if (!item.type || item.type === "product") {
                    const updatedProduct = await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity },
                        },
                        select: { stock: true },
                    });

                    // Verify stock is not negative (race condition prevention)
                    if (updatedProduct.stock < 0) {
                        throw new Error(`STOCK_ERROR:Insuficiente stock para "${item.name}" después de descuento`);
                    }
                } else if (item.type === "listing") {
                    const updatedListing = await tx.listing.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity },
                        },
                        select: { stock: true },
                    });

                    // Verify stock is not negative (race condition prevention)
                    if (updatedListing.stock < 0) {
                        throw new Error(`STOCK_ERROR:Insuficiente stock para "${item.name}" después de descuento`);
                    }
                }
            }

            // Create SubOrders if multi-vendor or if groups are provided
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    const groupSubtotal = group.items.reduce(
                        (sum: number, gi: { price: number; quantity: number }) => sum + gi.price * gi.quantity,
                        0
                    );

                    let groupCommission = 0;
                    let groupPayout = 0;

                    // Calculate commission for merchant groups
                    if (group.merchantId) {
                        const gMerchant = await tx.merchant.findUnique({
                            where: { id: group.merchantId },
                            select: { commissionRate: true },
                        });
                        const rate = gMerchant?.commissionRate || defaultMerchantCommission;
                        groupCommission = groupSubtotal * (rate / 100);
                        groupPayout = groupSubtotal - groupCommission;
                    } else if (group.sellerId) {
                        // Seller commission from config
                        const sellerRate = parseFloat(await getConfigValue("default_seller_commission_pct", "10"));
                        groupCommission = groupSubtotal * (sellerRate / 100);
                        groupPayout = groupSubtotal - groupCommission;
                    }

                    const subOrder = await tx.subOrder.create({
                        data: {
                            orderId: newOrder.id,
                            merchantId: group.merchantId || null,
                            sellerId: group.sellerId || null,
                            status: "PENDING",
                            subtotal: groupSubtotal,
                            total: groupSubtotal,
                            moovyCommission: groupCommission,
                            sellerPayout: groupPayout,
                        },
                    });

                    // Link OrderItems to this SubOrder
                    // BUG #12 FIX: Use both productId/listingId AND type to avoid ambiguity between merchant products and marketplace listings
                    for (const gi of group.items) {
                        const isListing = gi.type === "listing";
                        // For listings, productId is stored in listingId; for products, it's in productId
                        const whereClause = isListing
                            ? { orderId: newOrder.id, listingId: gi.productId, subOrderId: null }
                            : { orderId: newOrder.id, productId: gi.productId, subOrderId: null };

                        await tx.orderItem.updateMany({
                            where: whereClause,
                            data: { subOrderId: subOrder.id },
                        });
                    }
                }
            }

            // BUG #4 FIX: Deduct points INSIDE the transaction
            // Process points (deduct used points and earn new points atomically)
            if (validPointsUsed > 0) {
                // Deduct points used for discount
                const user = await tx.user.findUnique({
                    where: { id: session.user.id },
                    select: { pointsBalance: true }
                });

                if (user) {
                    const newBalance = (user.pointsBalance || 0) - validPointsUsed;
                    if (newBalance < 0) {
                        throw new Error("Insufficient points for discount");
                    }

                    await tx.user.update({
                        where: { id: session.user.id },
                        data: { pointsBalance: newBalance, updatedAt: new Date() }
                    });

                    await tx.pointsTransaction.create({
                        data: {
                            userId: session.user.id,
                            orderId: newOrder.id,
                            type: "REDEEM",
                            amount: -validPointsUsed,
                            balanceAfter: newBalance,
                            description: `Canjeaste ${validPointsUsed} puntos en tu pedido`,
                        }
                    });

                    pointsResult.spent = validPointsUsed;
                }
            }

            // AUDIT FIX 1.5: Record coupon usage INSIDE the main transaction
            // Prevents race condition where two orders use the same coupon simultaneously
            if (validCouponCode) {
                const coupon = await tx.coupon.findUnique({
                    where: { code: validCouponCode },
                    select: { id: true, maxUses: true, usedCount: true, maxUsesPerUser: true },
                });

                if (coupon) {
                    // Double-check limits inside transaction (serializable guarantee)
                    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
                        orderLogger.warn({ couponCode: validCouponCode }, "Coupon exhausted during transaction");
                    } else {
                        // Double-check per-user limit inside transaction
                        let perUserOk = true;
                        if (coupon.maxUsesPerUser) {
                            const userUsageCount = await tx.couponUsage.count({
                                where: { couponId: coupon.id, userId: session.user.id },
                            });
                            perUserOk = userUsageCount < coupon.maxUsesPerUser;
                        }

                        if (perUserOk) {
                            await tx.couponUsage.create({
                                data: {
                                    couponId: coupon.id,
                                    userId: session.user.id,
                                    orderId: newOrder.id,
                                },
                            });
                            await tx.coupon.update({
                                where: { id: coupon.id },
                                data: { usedCount: { increment: 1 } },
                            });
                        }
                    }
                }
            }

            return newOrder;
        });

        // Process points earning (outside transaction)
        // This calculates points earned on the order
        try {
            const config = await getPointsConfig();
            const earned = Math.floor(subtotal * config.pointsPerDollar);
            if (earned > 0) {
                await recordPointsTransaction(
                    session.user.id,
                    "EARN",
                    earned,
                    `Ganaste ${earned} puntos por tu compra`,
                    order.id
                );
                pointsResult.earned = earned;
            }

            // Try to activate pending bonuses
            const { bonusAwarded } = await import("@/lib/points").then(m => m.activatePendingBonuses(
                session.user.id,
                subtotal,
                order.id
            ));
        } catch (pointsError) {
            orderLogger.error({ orderId: order.id, error: pointsError }, "Error processing points earning for order");
            // Don't fail the order if points fail, but log it
        }

        // AUDIT FIX 1.5: Coupon usage recording moved inside main transaction above
        // This eliminates the race condition where order gets discount but coupon isn't recorded

        // --- MERCADOPAGO: Create preference and return early ---
        if (paymentMethod === "mercadopago") {
            try {
                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

                // Fetch order with relations needed for preference
                const orderForPref = await prisma.order.findUnique({
                    where: { id: order.id },
                    include: {
                        items: { select: { id: true, name: true, price: true, quantity: true } },
                        subOrders: { select: { moovyCommission: true, merchantId: true, sellerId: true } },
                        user: { select: { name: true, email: true } },
                    },
                });

                if (!orderForPref) throw new Error("Order not found after creation");

                // Split payment: resolve vendor access token first (needed to decide marketplace_fee)
                let vendorAccessToken: string | null = null;
                if (!isMultiVendor) {
                    if (orderForPref.subOrders.length === 1) {
                        const sub = orderForPref.subOrders[0];
                        if (sub.merchantId) {
                            const m = await prisma.merchant.findUnique({
                                where: { id: sub.merchantId },
                                select: { mpAccessToken: true },
                            });
                            vendorAccessToken = m?.mpAccessToken || null;
                        } else if (sub.sellerId) {
                            const s = await prisma.sellerProfile.findUnique({
                                where: { id: sub.sellerId },
                                select: { mpAccessToken: true },
                            });
                            vendorAccessToken = s?.mpAccessToken || null;
                        }
                    } else if (merchantId && orderForPref.subOrders.length === 0) {
                        const m = await prisma.merchant.findUnique({
                            where: { id: merchantId },
                            select: { mpAccessToken: true },
                        });
                        vendorAccessToken = m?.mpAccessToken || null;
                    }
                }

                // marketplace_fee only valid for split payments (vendor's token)
                // Passing it with Moovy's own token causes a 400 from the MP API
                const marketplaceFee = vendorAccessToken
                    ? orderForPref.subOrders.reduce((s, sub) => s + (sub.moovyCommission || 0), 0)
                    : 0;
                const prefBody = buildPreferenceBody(orderForPref, baseUrl, marketplaceFee);

                const preference = vendorAccessToken
                    ? await createVendorPreference(vendorAccessToken, prefBody)
                    : await preferenceApi.create({ body: prefBody });

                // Update order with preference ID and AWAITING_PAYMENT status
                // Scheduled orders keep their SCHEDULED status — payment is still captured
                const mpStatus = order.deliveryType === "SCHEDULED" ? "SCHEDULED" : "AWAITING_PAYMENT";
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        mpPreferenceId: preference.id || null,
                        status: mpStatus,
                    },
                });

                // Notify vendors via socket (same as cash flow below)
                try {
                    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
                    const socketHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` };
                    const socketData = { orderId: order.id, orderNumber: order.orderNumber, total: order.total, status: "AWAITING_PAYMENT", userId: session.user.id };

                    if (groups && groups.length > 0) {
                        for (const group of groups) {
                            if (group.merchantId) {
                                await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: `merchant:${group.merchantId}`, data: socketData }) });
                            }
                            if (group.sellerId) {
                                await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: `seller:${group.sellerId}`, data: socketData }) });
                            }
                        }
                    } else if (merchantId) {
                        await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: `merchant:${merchantId}`, data: socketData }) });
                    }
                    await fetch(`${socketUrl}/emit`, { method: "POST", headers: socketHeaders, body: JSON.stringify({ event: "new_order", room: "admin:orders", data: { ...socketData, merchantId, isMultiVendor } }) });
                } catch (e) {
                    orderLogger.error({ orderId: order.id, error: e }, "Failed to notify new MP order via socket");
                }

                // Push notify vendors about new MP order (non-blocking)
                try {
                    const buyerName = session.user.name || undefined;
                    if (groups && groups.length > 0) {
                        for (const group of groups) {
                            if (group.merchantId) notifyMerchant(group.merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
                            if (group.sellerId) notifySeller(group.sellerId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify seller"));
                        }
                    } else if (merchantId) {
                        notifyMerchant(merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
                    }
                } catch (e) {
                    orderLogger.error({ orderId: order.id, error: e }, "Failed to notify vendor (MP flow)");
                }

                // Always use init_point — MP auto-redirects to sandbox when using TEST- credentials.
                // sandbox_init_point causes ERR_TOO_MANY_REDIRECTS with test users.
                const initPoint = preference.init_point;

                // NO email — will be sent by webhook when payment is confirmed
                return NextResponse.json({
                    success: true,
                    order: { id: order.id, orderNumber: order.orderNumber, total: order.total, status: "AWAITING_PAYMENT" },
                    points: pointsResult,
                    preferenceId: preference.id,
                    initPoint,
                    sandboxInitPoint: preference.sandbox_init_point,
                }, { status: 201 });

            } catch (mpError) {
                orderLogger.error({ orderId: order.id, error: mpError }, "Error creating preference");
                // Cancel the order since payment can't proceed
                await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelReason: "Error al crear preferencia de pago" } });
                return NextResponse.json({ error: "Error al iniciar el pago con MercadoPago" }, { status: 500 });
            }
        }

        // --- REAL-TIME: Notify merchants/sellers and admin about new order ---
        try {
            const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

            // Notify each vendor group
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    if (group.merchantId) {
                        await fetch(`${socketUrl}/emit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                            body: JSON.stringify({
                                event: "new_order",
                                room: `merchant:${group.merchantId}`,
                                data: {
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                    total: order.total,
                                    status: order.status,
                                    userId: session.user.id,
                                }
                            })
                        });
                    }
                    if (group.sellerId) {
                        await fetch(`${socketUrl}/emit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                            body: JSON.stringify({
                                event: "new_order",
                                room: `seller:${group.sellerId}`,
                                data: {
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                    total: order.total,
                                    status: order.status,
                                    userId: session.user.id,
                                }
                            })
                        });
                    }
                }
            } else if (merchantId) {
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
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
            }

            // Always notify admin
            await fetch(`${socketUrl}/emit`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                body: JSON.stringify({
                    event: "new_order",
                    room: "admin:orders",
                    data: {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        total: order.total,
                        status: order.status,
                        merchantId,
                        isMultiVendor,
                        userId: session.user.id,
                    }
                })
            });

            orderLogger.info({ orderId: order.id, orderNumber: order.orderNumber }, "New order notified via socket");
        } catch (e) {
            orderLogger.error({ orderId: order.id, error: e }, "Failed to notify new order via socket");
        }

        // --- PUSH: Notify merchants/sellers about new order ---
        try {
            const buyerName = session.user.name || undefined;
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    if (group.merchantId) {
                        notifyMerchant(group.merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
                    }
                    if (group.sellerId) {
                        notifySeller(group.sellerId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify seller"));
                    }
                }
            } else if (merchantId) {
                notifyMerchant(merchantId, order.orderNumber, order.total, buyerName).catch((err) => orderLogger.error({ error: err }, "Failed to notify merchant"));
            }
        } catch (e) {
            orderLogger.error({ orderId: order.id, error: e }, "Failed to notify vendor");
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
            orderLogger.error({ orderId: order.id, error: emailError }, "Failed to trigger confirmation email");
        }

        // BUG #13 FIX: Add flag to indicate cash orders need merchant confirmation
        // Known limitation: Cash orders stay PENDING indefinitely if merchant doesn't confirm.
        // This should be handled by a cron job that auto-cancels after merchant_confirm_timeout.
        // See: src/app/api/cron/assignment-timeout or similar
        const requiresMerchantConfirmation = paymentMethod === "cash" || paymentMethod === undefined;

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: order.total,
                status: order.status,
            },
            points: pointsResult,
            requiresMerchantConfirmation,
        }, { status: 201 });

    } catch (error: any) {
        // Handle stock validation errors (thrown from inside transaction)
        if (error?.message?.startsWith("STOCK_ERROR:")) {
            status = "409";
            const message = error.message.replace("STOCK_ERROR:", "");
            // Check if it's a JSON array (pre-flight validation) or a string message (post-decrement)
            try {
                const stockErrors = JSON.parse(message);
                return NextResponse.json(
                    { error: "Algunos productos no tienen stock suficiente", stockErrors },
                    { status: 409 }
                );
            } catch {
                // It's a simple error message from post-decrement validation
                return NextResponse.json(
                    { error: message || "Insuficiente stock en algunos productos" },
                    { status: 409 }
                );
            }
        }

        if (error?.message?.startsWith("SLOT_FULL:")) {
            const msg = error.message.replace("SLOT_FULL:", "");
            return NextResponse.json(
                { error: msg },
                { status: 409 }
            );
        }
        status = "500";
        orderLogger.error({ error }, "Error creating order");
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
            orderLogger.error({ error: e }, "Metrics increment failed");
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

        const isAdmin = hasAnyRole(session, ["ADMIN"]);
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
        orderLogger.error({ error }, "Error fetching orders");
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
            orderLogger.error({ error: e }, "Metrics increment failed");
        }
    }
}



