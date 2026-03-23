// API: Order Chat Messages — enviar mensajes y marcar leídos
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        // Verify user is participant and chat is active
        const chat = await (prisma as any).orderChat.findUnique({
            where: { id: chatId }
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

        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
