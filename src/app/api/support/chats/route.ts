// API: Support Chat CRUD
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get user's support chats or all chats for admin
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        let chats;

        if (role === "ADMIN") {
            // Admin sees all chats
            chats = await prisma.supportChat.findMany({
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true }
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

            // Add unread count for admin
            chats = await Promise.all(chats.map(async (chat) => {
                const unreadCount = await prisma.supportMessage.count({
                    where: {
                        chatId: chat.id,
                        isFromAdmin: false,
                        isRead: false
                    }
                });
                return { ...chat, unreadCount };
            }));
        } else {
            // Regular user sees only their chats
            chats = await prisma.supportChat.findMany({
                where: { userId },
                include: {
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

            // Add unread count for user
            chats = await Promise.all(chats.map(async (chat) => {
                const unreadCount = await prisma.supportMessage.count({
                    where: {
                        chatId: chat.id,
                        isFromAdmin: true,
                        isRead: false
                    }
                });
                return { ...chat, unreadCount };
            }));
        }

        return NextResponse.json(chats);
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
        const role = (session.user as any).role;

        // Only merchants and drivers can create support chats
        if (role !== "MERCHANT" && role !== "DRIVER") {
            return NextResponse.json({ error: "Solo comercios y repartidores pueden usar el chat de soporte" }, { status: 403 });
        }

        const { subject, message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
        }

        // Check if user has an open chat already
        const existingOpenChat = await prisma.supportChat.findFirst({
            where: { userId, status: "open" }
        });

        if (existingOpenChat) {
            // Add message to existing chat instead
            const newMessage = await prisma.supportMessage.create({
                data: {
                    chatId: existingOpenChat.id,
                    senderId: userId,
                    content: message,
                    isFromAdmin: false
                }
            });

            await prisma.supportChat.update({
                where: { id: existingOpenChat.id },
                data: { lastMessageAt: new Date() }
            });

            return NextResponse.json({ chat: existingOpenChat, message: newMessage });
        }

        // Get merchant ID if user is a merchant
        let merchantId = null;
        if (role === "MERCHANT") {
            const merchant = await prisma.merchant.findFirst({
                where: { ownerId: userId }
            });
            merchantId = merchant?.id || null;
        }

        // Create new chat with first message
        const chat = await prisma.supportChat.create({
            data: {
                userId,
                merchantId,
                subject: subject || "Consulta general",
                status: "open",
                messages: {
                    create: {
                        senderId: userId,
                        content: message,
                        isFromAdmin: false
                    }
                }
            },
            include: {
                messages: true
            }
        });

        return NextResponse.json(chat, { status: 201 });
    } catch (error) {
        console.error("Error creating chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
