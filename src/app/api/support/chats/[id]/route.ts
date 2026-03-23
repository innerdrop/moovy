// API: Support Chat Messages - Buyer side
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get chat with messages
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as any).id;

        // Get chat
        const chat = await (prisma as any).supportChat.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true }
                },
                operator: {
                    select: { id: true, displayName: true, isOnline: true }
                },
                messages: {
                    include: {
                        sender: {
                            select: { id: true, name: true, role: true }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!chat) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        // Check permission - only own chats
        if (chat.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Mark user's unread operator messages as read
        await (prisma as any).supportMessage.updateMany({
            where: { chatId: id, isFromAdmin: true, isRead: false },
            data: { isRead: true }
        });

        return NextResponse.json(chat);
    } catch (error) {
        console.error("Error fetching chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Send message from buyer
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as any).id;
        const { content } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
        }

        // Get chat
        const chat = await (prisma as any).supportChat.findUnique({ where: { id } });
        if (!chat) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        // Check permission
        if (chat.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Create message
        const message = await (prisma as any).supportMessage.create({
            data: {
                chatId: id,
                senderId: userId,
                content: content.trim(),
                isFromAdmin: false,
                isSystem: false
            },
            include: {
                sender: {
                    select: { id: true, name: true, role: true }
                }
            }
        });

        // Update chat timestamp and status
        await (prisma as any).supportChat.update({
            where: { id },
            data: {
                lastMessageAt: new Date(),
                status: chat.status === "waiting" ? "active" : chat.status
            }
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Rate chat after resolution
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as any).id;
        const { rating, ratingComment } = await request.json();

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Calificación inválida (1-5)" }, { status: 400 });
        }

        // Get chat
        const chat = await (prisma as any).supportChat.findUnique({ where: { id } });
        if (!chat) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        // Check permission
        if (chat.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Update rating
        const updated = await (prisma as any).supportChat.update({
            where: { id },
            data: {
                rating,
                ratingComment: ratingComment || null,
                status: "closed"
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error rating chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
