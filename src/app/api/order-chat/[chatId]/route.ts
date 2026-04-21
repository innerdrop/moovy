// API: Order Chat Messages — enviar mensajes y marcar leídos
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    notifyChatMessage,
    targetUrlForRecipient,
} from "@/lib/order-chat-notify";
import type { OrderChatType } from "@/types/order-chat";

// GET — obtener mensajes del chat
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { chatId } = await params;

        // Verify user is participant
        const chat = await (prisma as any).orderChat.findUnique({
            where: { id: chatId }
        });

        if (!chat || (chat.participantAId !== userId && chat.participantBId !== userId)) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        // Get messages
        const messages = await (prisma as any).orderChatMessage.findMany({
            where: { chatId },
            include: {
                sender: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "asc" }
        });

        // Mark messages from other participant as read
        await (prisma as any).orderChatMessage.updateMany({
            where: {
                chatId,
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST — enviar mensaje
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { chatId } = await params;
        const { content } = await request.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
        }

        // Verify user is participant and chat is active — incluimos order
        // para poder armar el push body con el orderNumber y el targetUrl.
        const chat = await (prisma as any).orderChat.findUnique({
            where: { id: chatId },
            include: {
                order: { select: { id: true, orderNumber: true } },
            },
        });

        if (!chat || (chat.participantAId !== userId && chat.participantBId !== userId)) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        if (chat.status === "closed") {
            return NextResponse.json({ error: "Este chat está cerrado" }, { status: 400 });
        }

        // Create message and update chat timestamp
        const [newMessage] = await (prisma as any).$transaction([
            (prisma as any).orderChatMessage.create({
                data: {
                    chatId,
                    senderId: userId,
                    content: content.trim(),
                    isSystem: false
                },
                include: {
                    sender: { select: { id: true, name: true } }
                }
            }),
            (prisma as any).orderChat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() }
            })
        ]);

        // Notificación fire-and-forget al destinatario: push + socket event.
        // No bloqueamos la respuesta del endpoint — los errores se loguean
        // dentro del helper pero nunca throwean.
        try {
            const senderIsA = chat.participantAId === userId;
            const recipientId = senderIsA
                ? chat.participantBId
                : chat.participantAId;
            const recipientIsA = !senderIsA;
            const chatType = chat.chatType as OrderChatType;
            const targetUrl = targetUrlForRecipient(
                chatType,
                recipientIsA,
                chat.orderId
            );

            // No await: disparamos y seguimos. El helper ya hace allSettled
            // internamente y atrapa errores de red / push endpoint.
            void notifyChatMessage({
                chatId,
                senderId: userId,
                senderName: newMessage.sender?.name ?? null,
                recipientId,
                orderId: chat.orderId,
                orderNumber: chat.order?.orderNumber ?? "",
                chatType,
                content: newMessage.content,
                targetUrl,
                senderIsA,
            });
        } catch (notifyErr) {
            // Defensivo: si algo falla al armar los params, logueamos pero
            // NO rompemos el POST — el mensaje ya está guardado en DB.
            console.error(
                "[order-chat] failed to dispatch notification:",
                notifyErr
            );
        }

        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
