// API: Support Chat Messages
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get messages for a specific chat
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
        const role = (session.user as any).role;

        // Get chat
        const chat = await prisma.supportChat.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true }
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

        // Check permission
        if (role !== "ADMIN" && chat.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Mark messages as read
        if (role === "ADMIN") {
            // Admin reads user messages
            await prisma.supportMessage.updateMany({
                where: { chatId: id, isFromAdmin: false },
                data: { isRead: true }
            });
        } else {
            // User reads admin messages
            await prisma.supportMessage.updateMany({
                where: { chatId: id, isFromAdmin: true },
                data: { isRead: true }
            });
        }

        return NextResponse.json(chat);
    } catch (error) {
        console.error("Error fetching chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Send a message to a chat
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
        const role = (session.user as any).role;

        // Get chat
        const chat = await prisma.supportChat.findUnique({ where: { id } });

        if (!chat) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        // Check permission
        if (role !== "ADMIN" && chat.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { content } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
        }

        // Create message
        const message = await prisma.supportMessage.create({
            data: {
                chatId: id,
                senderId: userId,
                content: content.trim(),
                isFromAdmin: role === "ADMIN"
            },
            include: {
                sender: {
                    select: { id: true, name: true, role: true }
                }
            }
        });

        // Update chat timestamp
        await prisma.supportChat.update({
            where: { id },
            data: { lastMessageAt: new Date() }
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PATCH - Update chat status (admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const { status } = await request.json();

        const chat = await prisma.supportChat.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(chat);
    } catch (error) {
        console.error("Error updating chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
