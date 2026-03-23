// API: Order Chat — crear o obtener chat de pedido
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — obtener chats del usuario para un pedido específico
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
                merchant: { select: { userId: true } },
                subOrders: {
                    select: {
                        sellerId: true,
                        seller: { select: { userId: true } }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Check user is a participant
        const isBuyer = order.userId === userId;
        const isMerchant = order.merchant?.userId === userId;
        const isDriver = order.driverId === userId;
        const isSeller = order.subOrders.some((so: any) => so.seller?.userId === userId);

        if (!isBuyer && !isMerchant && !isDriver && !isSeller) {
            return NextResponse.json({ error: "No sos parte de este pedido" }, { status: 403 });
        }

        // Get all chats for this order where user is a participant
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

        // Add unread count per chat
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

// POST — crear un nuevo chat de pedido o abrir existente
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userName = (session.user as any).name || "Usuario";
        const { orderId, chatType, message } = await request.json();

        if (!orderId || !chatType) {
            return NextResponse.json({ error: "orderId y chatType son requeridos" }, { status: 400 });
        }

        // Validate chatType
        if (!["BUYER_MERCHANT", "BUYER_DRIVER", "BUYER_SELLER"].includes(chatType)) {
            return NextResponse.json({ error: "chatType inválido" }, { status: 400 });
        }

        // Get order with participants
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            include: {
                merchant: { select: { userId: true, businessName: true } },
                driver: { select: { userId: true, user: { select: { name: true } } } },
                subOrders: {
                    include: {
                        seller: { select: { userId: true, displayName: true } }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Determine participants based on chat type and who's initiating
        let participantAId: string; // buyer
        let participantBId: string; // counterpart

        if (chatType === "BUYER_MERCHANT") {
            if (!order.merchant?.userId) {
                return NextResponse.json({ error: "Este pedido no tiene comercio asignado" }, { status: 400 });
            }
            participantAId = order.userId;
            participantBId = order.merchant.userId;
        } else if (chatType === "BUYER_DRIVER") {
            if (!order.driver?.userId) {
                return NextResponse.json({ error: "Este pedido no tiene repartidor asignado" }, { status: 400 });
            }
            participantAId = order.userId;
            participantBId = order.driver.userId;
        } else if (chatType === "BUYER_SELLER") {
            const sellerSub = order.subOrders.find((so: any) => so.seller?.userId);
            if (!sellerSub?.seller?.userId) {
                return NextResponse.json({ error: "Este pedido no tiene vendedor asignado" }, { status: 400 });
            }
            participantAId = order.userId;
            participantBId = sellerSub.seller.userId;
        } else {
            return NextResponse.json({ error: "chatType inválido" }, { status: 400 });
        }

        // Verify user is one of the participants
        if (userId !== participantAId && userId !== participantBId) {
            return NextResponse.json({ error: "No sos parte de este chat" }, { status: 403 });
        }

        // Find existing or create new chat
        let chat = await (prisma as any).orderChat.findFirst({
            where: {
                orderId,
                chatType,
                participantAId,
                participantBId
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

        if (!chat) {
            // Create new chat with optional first message
            const messagesData: any[] = [];

            // System message
            const roleLabel = chatType === "BUYER_MERCHANT" ? "comercio"
                : chatType === "BUYER_DRIVER" ? "repartidor" : "vendedor";
            messagesData.push({
                senderId: userId,
                content: `Chat iniciado para el pedido #${order.orderNumber}. Podés comunicarte directamente con el ${roleLabel}.`,
                isSystem: true,
                isRead: true
            });

            if (message?.trim()) {
                messagesData.push({
                    senderId: userId,
                    content: message.trim(),
                    isSystem: false
                });
            }

            chat = await (prisma as any).orderChat.create({
                data: {
                    orderId,
                    chatType,
                    participantAId,
                    participantBId,
                    status: "active",
                    messages: { create: messagesData }
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
        }

        return NextResponse.json(chat, { status: 201 });
    } catch (error) {
        console.error("Error creating order chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
