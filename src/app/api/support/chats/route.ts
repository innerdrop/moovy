// API: Support Chat CRUD
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Get user's support chats
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Regular users see only their chats
        const chats = await (prisma as any).supportChat.findMany({
            where: { userId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true }
                },
                operator: {
                    select: { id: true, displayName: true, isOnline: true }
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { lastMessageAt: "desc" }
        });

        // Add unread count
        const chatsWithUnread = await Promise.all(chats.map(async (chat: any) => {
            const unreadCount = await (prisma as any).supportMessage.count({
                where: {
                    chatId: chat.id,
                    isFromAdmin: true,
                    isRead: false
                }
            });
            return { ...chat, unreadCount };
        }));

        return NextResponse.json(chatsWithUnread);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Create new support chat
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { category, subject, message } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
        }

        // Create new chat
        const chat = await (prisma as any).supportChat.create({
            data: {
                userId,
                category: category || "otro",
                subject: subject || "Consulta general",
                status: "waiting",
                priority: "normal",
                messages: {
                    create: {
                        senderId: userId,
                        content: message.trim(),
                        isFromAdmin: false,
                        isSystem: false
                    }
                }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true }
                },
                messages: true
            }
        });

        return NextResponse.json(chat, { status: 201 });
    } catch (error) {
        console.error("Error creating chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
