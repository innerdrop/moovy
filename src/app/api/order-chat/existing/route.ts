// API: Order Chat — consulta ligera para badge de mensajes sin leer
//
// GET /api/order-chat/existing?orderId=...&chatType=...&subOrderId=...(opcional)
//
// Devuelve { exists: bool, chatId?: string, unreadCount: number, lastMessageAt?: Date }
// SIN crear el chat si no existe. Pensado para que los paneles muestren un
// badge de "mensaje nuevo" en estado cerrado, polling cada ~15s, sin efectos
// colaterales.
//
// Diferencia vs POST /api/order-chat:
//   - POST crea el chat si no existe (efecto colateral, abre un chat vacío)
//   - GET existing NO crea nada, solo responde si ya existe
//
// Se valida que el caller sea participante del pedido (mismo criterio que GET /).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OrderChatType } from "@/types/order-chat";

const VALID_CHAT_TYPES: OrderChatType[] = [
    "BUYER_MERCHANT",
    "BUYER_DRIVER",
    "BUYER_SELLER",
    "DRIVER_MERCHANT",
    "DRIVER_SELLER",
];

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("orderId");
        const chatType = searchParams.get("chatType") as OrderChatType | null;
        const subOrderId = searchParams.get("subOrderId");

        if (!orderId || !chatType) {
            return NextResponse.json(
                { error: "orderId y chatType son requeridos" },
                { status: 400 }
            );
        }

        if (!VALID_CHAT_TYPES.includes(chatType)) {
            return NextResponse.json({ error: "chatType inválido" }, { status: 400 });
        }

        // Ownership check — reutilizamos el mismo criterio que GET /api/order-chat
        // para evitar que un usuario aleatorio haga polling de todos los chats
        // del sistema.
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            select: {
                userId: true,
                merchant: { select: { ownerId: true } },
                driver: { select: { userId: true } },
                subOrders: {
                    select: {
                        id: true,
                        seller: { select: { userId: true } },
                        driver: { select: { userId: true } },
                        merchant: { select: { ownerId: true } },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        const isBuyer = order.userId === userId;
        const isMerchant =
            order.merchant?.ownerId === userId ||
            order.subOrders.some((so: any) => so.merchant?.ownerId === userId);
        const isDriver =
            order.driver?.userId === userId ||
            order.subOrders.some((so: any) => so.driver?.userId === userId);
        const isSeller = order.subOrders.some(
            (so: any) => so.seller?.userId === userId
        );

        if (!isBuyer && !isMerchant && !isDriver && !isSeller) {
            return NextResponse.json(
                { error: "No sos parte de este pedido" },
                { status: 403 }
            );
        }

        // Scopeamos al subOrder si viene; si no, buscamos el chat "order-global".
        const where: any = {
            orderId,
            chatType,
            OR: [
                { participantAId: userId },
                { participantBId: userId },
            ],
        };
        if (subOrderId) {
            where.subOrderId = subOrderId;
        } else {
            where.subOrderId = null;
        }

        const chat = await (prisma as any).orderChat.findFirst({
            where,
            select: {
                id: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
        });

        if (!chat) {
            return NextResponse.json({
                exists: false,
                unreadCount: 0,
            });
        }

        const unreadCount = await (prisma as any).orderChatMessage.count({
            where: {
                chatId: chat.id,
                senderId: { not: userId },
                isRead: false,
            },
        });

        return NextResponse.json({
            exists: true,
            chatId: chat.id,
            unreadCount,
            lastMessageAt: chat.updatedAt,
        });
    } catch (error) {
        console.error("[order-chat/existing] error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
