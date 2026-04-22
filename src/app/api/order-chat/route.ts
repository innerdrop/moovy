// API: Order Chat — crear o abrir un chat de pedido
//
// Soporta 5 canales entre los roles de un pedido:
//   BUYER_MERCHANT  | BUYER_DRIVER  | BUYER_SELLER
//   DRIVER_MERCHANT | DRIVER_SELLER
//
// Multi-vendor: los canales *_SELLER y DRIVER_MERCHANT/DRIVER_SELLER aceptan
// un `subOrderId` opcional para scopear el chat a una SubOrder específica.
// Esto permite que un pedido con 2+ vendedores tenga un chat independiente
// con cada uno, y que el repartidor pueda hablar con el comercio/vendedor
// asociado a SU pickup sin pisar chats de otros.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    notifyChatMessage,
    targetUrlForRecipient,
} from "@/lib/order-chat-notify";
import type { OrderChatType } from "@/types/order-chat";

const VALID_CHAT_TYPES: OrderChatType[] = [
    "BUYER_MERCHANT",
    "BUYER_DRIVER",
    "BUYER_SELLER",
    "DRIVER_MERCHANT",
    "DRIVER_SELLER",
];

// ─── GET — obtener chats del usuario para un pedido ────────────────────────

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json({ error: "orderId es requerido" }, { status: 400 });
        }

        // Verify user is participant in the order
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            select: {
                id: true, orderNumber: true, status: true, userId: true,
                merchantId: true, driverId: true,
                merchant: { select: { ownerId: true } },
                driver: { select: { userId: true } },
                subOrders: {
                    select: {
                        id: true,
                        sellerId: true,
                        driverId: true,
                        seller: { select: { userId: true } },
                        driver: { select: { userId: true } },
                        merchant: { select: { ownerId: true } },
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        const isBuyer = order.userId === userId;
        const isMerchant = order.merchant?.ownerId === userId
            || order.subOrders.some((so: any) => so.merchant?.ownerId === userId);
        const isDriver = order.driver?.userId === userId
            || order.subOrders.some((so: any) => so.driver?.userId === userId);
        const isSeller = order.subOrders.some((so: any) => so.seller?.userId === userId);

        if (!isBuyer && !isMerchant && !isDriver && !isSeller) {
            return NextResponse.json({ error: "No sos parte de este pedido" }, { status: 403 });
        }

        // All chats for this order where user is a participant
        const chats = await (prisma as any).orderChat.findMany({
            where: {
                orderId,
                OR: [
                    { participantAId: userId },
                    { participantBId: userId }
                ]
            },
            include: {
                participantA: { select: { id: true, name: true } },
                participantB: { select: { id: true, name: true } },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                },
                _count: { select: { messages: true } }
            },
            orderBy: { updatedAt: "desc" }
        });

        // Unread count per chat
        const chatsWithUnread = await Promise.all(
            chats.map(async (chat: any) => {
                const unread = await (prisma as any).orderChatMessage.count({
                    where: {
                        chatId: chat.id,
                        senderId: { not: userId },
                        isRead: false
                    }
                });
                return { ...chat, unreadCount: unread };
            })
        );

        return NextResponse.json(chatsWithUnread);
    } catch (error) {
        console.error("Error fetching order chats:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// ─── POST — crear o abrir (findOrCreate) un chat ───────────────────────────

interface ResolveParticipantsResult {
    ok: true;
    participantAId: string;
    participantBId: string;
    resolvedSubOrderId: string | null;
}

interface ResolveParticipantsFailure {
    ok: false;
    error: string;
    status: number;
}

/**
 * Resuelve los participantes (A, B) según chatType + subOrderId + order data.
 * Encapsula la lógica de multi-vendor y de permisos por rol.
 *
 * Convención:
 *   BUYER_*   → A = buyer,  B = contraparte
 *   DRIVER_*  → A = driver, B = contraparte
 */
function resolveParticipants(
    chatType: OrderChatType,
    subOrderId: string | null,
    order: any
): ResolveParticipantsResult | ResolveParticipantsFailure {
    // Helper: buscar subOrder por id
    const findSubOrder = (id: string) =>
        order.subOrders.find((so: any) => so.id === id);

    // Sub-roles que requieren una SubOrder identificada:
    // BUYER_SELLER, DRIVER_SELLER siempre requieren subOrder (el seller vive en SubOrder).
    // DRIVER_MERCHANT en pedidos multi-vendor también se scopea por subOrder
    // (cada SubOrder tiene su merchant + driver).

    switch (chatType) {
        case "BUYER_MERCHANT": {
            // Permite modo "order-global" si el order tiene merchant directo,
            // o modo subOrder si se pasa subOrderId (multi-vendor con 2+ comercios).
            if (subOrderId) {
                const so = findSubOrder(subOrderId);
                if (!so?.merchant?.ownerId) {
                    return { ok: false, error: "La SubOrder indicada no tiene comercio asignado", status: 400 };
                }
                return {
                    ok: true,
                    participantAId: order.userId,
                    participantBId: so.merchant.ownerId,
                    resolvedSubOrderId: subOrderId,
                };
            }
            if (!order.merchant?.ownerId) {
                return { ok: false, error: "Este pedido no tiene comercio asignado", status: 400 };
            }
            return {
                ok: true,
                participantAId: order.userId,
                participantBId: order.merchant.ownerId,
                resolvedSubOrderId: null,
            };
        }

        case "BUYER_DRIVER": {
            if (subOrderId) {
                const so = findSubOrder(subOrderId);
                if (!so?.driver?.userId) {
                    return { ok: false, error: "La SubOrder indicada no tiene repartidor asignado", status: 400 };
                }
                return {
                    ok: true,
                    participantAId: order.userId,
                    participantBId: so.driver.userId,
                    resolvedSubOrderId: subOrderId,
                };
            }
            if (!order.driver?.userId) {
                return { ok: false, error: "Este pedido no tiene repartidor asignado", status: 400 };
            }
            return {
                ok: true,
                participantAId: order.userId,
                participantBId: order.driver.userId,
                resolvedSubOrderId: null,
            };
        }

        case "BUYER_SELLER": {
            // Multi-vendor: requiere subOrderId si hay más de un seller.
            const sellerSubs = order.subOrders.filter((so: any) => so.seller?.userId);
            if (sellerSubs.length === 0) {
                return { ok: false, error: "Este pedido no tiene vendedor asignado", status: 400 };
            }
            let so: any;
            if (subOrderId) {
                so = findSubOrder(subOrderId);
                if (!so?.seller?.userId) {
                    return { ok: false, error: "La SubOrder indicada no tiene vendedor asignado", status: 400 };
                }
            } else if (sellerSubs.length === 1) {
                so = sellerSubs[0]; // fallback compat: orden con 1 solo seller
            } else {
                return {
                    ok: false,
                    error: "Este pedido tiene múltiples vendedores. Especificá subOrderId para elegir con cuál chatear.",
                    status: 400,
                };
            }
            return {
                ok: true,
                participantAId: order.userId,
                participantBId: so.seller.userId,
                resolvedSubOrderId: so.id,
            };
        }

        case "DRIVER_MERCHANT": {
            // El driver puede chatear con el merchant al que va a buscar el pedido.
            // Single-vendor: order.driver + order.merchant.
            // Multi-vendor: subOrder.driver + subOrder.merchant.
            if (subOrderId) {
                const so = findSubOrder(subOrderId);
                if (!so?.driver?.userId) {
                    return { ok: false, error: "Esta SubOrder aún no tiene repartidor asignado", status: 400 };
                }
                if (!so?.merchant?.ownerId) {
                    return { ok: false, error: "Esta SubOrder no tiene comercio asignado", status: 400 };
                }
                return {
                    ok: true,
                    participantAId: so.driver.userId,
                    participantBId: so.merchant.ownerId,
                    resolvedSubOrderId: subOrderId,
                };
            }
            if (!order.driver?.userId) {
                return { ok: false, error: "Este pedido aún no tiene repartidor asignado", status: 400 };
            }
            if (!order.merchant?.ownerId) {
                return { ok: false, error: "Este pedido no tiene comercio asignado", status: 400 };
            }
            return {
                ok: true,
                participantAId: order.driver.userId,
                participantBId: order.merchant.ownerId,
                resolvedSubOrderId: null,
            };
        }

        case "DRIVER_SELLER": {
            // Siempre requiere SubOrder — el seller vive a nivel SubOrder.
            const sellerSubs = order.subOrders.filter((so: any) => so.seller?.userId);
            if (sellerSubs.length === 0) {
                return { ok: false, error: "Este pedido no tiene vendedor asignado", status: 400 };
            }
            let so: any;
            if (subOrderId) {
                so = findSubOrder(subOrderId);
                if (!so?.seller?.userId) {
                    return { ok: false, error: "La SubOrder indicada no tiene vendedor asignado", status: 400 };
                }
            } else if (sellerSubs.length === 1) {
                so = sellerSubs[0];
            } else {
                return {
                    ok: false,
                    error: "Este pedido tiene múltiples vendedores. Especificá subOrderId.",
                    status: 400,
                };
            }
            if (!so.driver?.userId) {
                return { ok: false, error: "Esta SubOrder aún no tiene repartidor asignado", status: 400 };
            }
            return {
                ok: true,
                participantAId: so.driver.userId,
                participantBId: so.seller.userId,
                resolvedSubOrderId: so.id,
            };
        }

        default:
            return { ok: false, error: "chatType inválido", status: 400 };
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();
        const { orderId, chatType, subOrderId, message } = body || {};

        if (!orderId || !chatType) {
            return NextResponse.json({ error: "orderId y chatType son requeridos" }, { status: 400 });
        }

        if (!VALID_CHAT_TYPES.includes(chatType)) {
            return NextResponse.json({ error: "chatType inválido" }, { status: 400 });
        }

        if (subOrderId !== undefined && subOrderId !== null && typeof subOrderId !== "string") {
            return NextResponse.json({ error: "subOrderId inválido" }, { status: 400 });
        }

        // Get order with all the relations we might need to resolve participants.
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                merchant: { select: { ownerId: true, name: true } },
                driver: { select: { userId: true } },
                subOrders: {
                    select: {
                        id: true,
                        merchant: { select: { ownerId: true, name: true } },
                        driver: { select: { userId: true } },
                        seller: { select: { userId: true, displayName: true } },
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        const resolved = resolveParticipants(
            chatType as OrderChatType,
            (subOrderId as string | null | undefined) ?? null,
            order
        );

        if (!resolved.ok) {
            return NextResponse.json({ error: resolved.error }, { status: resolved.status });
        }

        const { participantAId, participantBId, resolvedSubOrderId } = resolved;

        // El caller debe ser uno de los participantes resueltos.
        if (userId !== participantAId && userId !== participantBId) {
            return NextResponse.json({ error: "No sos parte de este chat" }, { status: 403 });
        }

        // Buscar chat existente respetando subOrderId (para multi-vendor).
        const existingWhere: any = {
            orderId,
            chatType,
            participantAId,
            participantBId,
        };
        if (resolvedSubOrderId) {
            existingWhere.subOrderId = resolvedSubOrderId;
        } else {
            existingWhere.subOrderId = null;
        }

        let chat = await (prisma as any).orderChat.findFirst({
            where: existingWhere,
            include: {
                participantA: { select: { id: true, name: true } },
                participantB: { select: { id: true, name: true } },
                messages: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        sender: { select: { id: true, name: true } }
                    }
                }
            }
        });

        if (!chat) {
            const roleLabel =
                chatType === "BUYER_MERCHANT" ? "comercio"
                : chatType === "BUYER_DRIVER" ? "repartidor"
                : chatType === "BUYER_SELLER" ? "vendedor"
                : chatType === "DRIVER_MERCHANT" ? "comercio"
                : "vendedor"; // DRIVER_SELLER

            const messagesData: any[] = [
                {
                    senderId: userId,
                    content: `Chat iniciado para el pedido #${order.orderNumber}. Podés comunicarte directamente con el ${roleLabel}.`,
                    isSystem: true,
                    isRead: true,
                }
            ];

            if (typeof message === "string" && message.trim()) {
                messagesData.push({
                    senderId: userId,
                    content: message.trim(),
                    isSystem: false,
                });
            }

            chat = await (prisma as any).orderChat.create({
                data: {
                    orderId,
                    subOrderId: resolvedSubOrderId,
                    chatType,
                    participantAId,
                    participantBId,
                    status: "active",
                    messages: { create: messagesData },
                },
                include: {
                    participantA: { select: { id: true, name: true } },
                    participantB: { select: { id: true, name: true } },
                    messages: {
                        orderBy: { createdAt: "asc" },
                        include: {
                            sender: { select: { id: true, name: true } }
                        }
                    }
                }
            });

            // Si el caller además envió un mensaje de arranque, avisamos
            // al destinatario (push + socket). El mensaje de sistema no
            // dispara notificación — solo el user-message, si vino.
            if (typeof message === "string" && message.trim()) {
                try {
                    const senderIsA = participantAId === userId;
                    const recipientId = senderIsA ? participantBId : participantAId;
                    const recipientIsA = !senderIsA;
                    const senderName =
                        (senderIsA
                            ? chat.participantA?.name
                            : chat.participantB?.name) ?? null;
                    const targetUrl = targetUrlForRecipient(
                        chatType as OrderChatType,
                        recipientIsA,
                        orderId
                    );
                    void notifyChatMessage({
                        chatId: chat.id,
                        senderId: userId,
                        senderName,
                        recipientId,
                        orderId,
                        orderNumber: order.orderNumber ?? "",
                        chatType: chatType as OrderChatType,
                        content: message.trim(),
                        targetUrl,
                        senderIsA,
                    });
                } catch (notifyErr) {
                    console.error(
                        "[order-chat] failed to dispatch first-message notification:",
                        notifyErr
                    );
                }
            }
        }

        return NextResponse.json(chat, { status: 201 });
    } catch (error) {
        console.error("Error creating order chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
