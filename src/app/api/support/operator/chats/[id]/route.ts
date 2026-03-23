// API: Operator - Chat detail, messages, claim, resolve
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOperator(userId: string) {
    return (prisma as any).supportOperator.findUnique({
        where: { userId }
    });
}

// GET - Get chat detail for operator
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
        const operator = await getOperator(userId);

        if (!operator || !operator.isActive) {
            return NextResponse.json({ error: "No eres un operador de soporte" }, { status: 403 });
        }

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
                            select: { id: true, name: true, displayName: true, role: true }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!chat) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        // Check permission - own chat or waiting
        if (
            chat.operatorId !== operator.id &&
            chat.status !== "waiting"
        ) {
            return NextResponse.json({ error: "No tienes acceso a este chat" }, { status: 403 });
        }

        // Mark unread buyer messages as read
        await (prisma as any).supportMessage.updateMany({
            where: {
                chatId: id,
                isFromAdmin: false,
                isRead: false
            },
            data: { isRead: true }
        });

        return NextResponse.json(chat);
    } catch (error) {
        console.error("Error fetching chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Send operator message
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
        const operator = await getOperator(userId);

        if (!operator || !operator.isActive) {
            return NextResponse.json({ error: "No eres un operador de soporte" }, { status: 403 });
        }

        const { content, action } = await request.json();

        // Get chat
        const chat = await (prisma as any).supportChat.findUnique({ where: { id } });
        if (!chat) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        // Check permission
        if (chat.operatorId !== operator.id) {
            return NextResponse.json({ error: "No tienes acceso a este chat" }, { status: 403 });
        }

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
        }

        // Create message
        const message = await (prisma as any).supportMessage.create({
            data: {
                chatId: id,
                senderId: userId,
                content: content.trim(),
                isFromAdmin: true,
                isSystem: false
            },
            include: {
                sender: {
                    select: { id: true, name: true, displayName: true }
                }
            }
        });

        // Update chat - set to active if it was waiting
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

// PATCH - Claim, resolve, or transfer chat
export async function PATCH(
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
        const operator = await getOperator(userId);

        if (!operator || !operator.isActive) {
            return NextResponse.json({ error: "No eres un operador de soporte" }, { status: 403 });
        }

        const { action, resolutionNote, transferToOperatorId } = await request.json();

        const chat = await (prisma as any).supportChat.findUnique({ where: { id } });
        if (!chat) {
            return NextResponse.json({ error: "Chat no encontrado" }, { status: 404 });
        }

        if (action === "claim") {
            // Claim a waiting chat
            if (chat.status !== "waiting" || chat.operatorId) {
                return NextResponse.json({ error: "Este chat no está disponible" }, { status: 400 });
            }

            // Check if operator has capacity
            const activeChats = await (prisma as any).supportChat.count({
                where: {
                    operatorId: operator.id,
                    status: "active"
                }
            });

            if (activeChats >= operator.maxChats) {
                return NextResponse.json(
                    { error: `Capacidad máxima alcanzada (${operator.maxChats} chats)` },
                    { status: 400 }
                );
            }

            const updated = await (prisma as any).supportChat.update({
                where: { id },
                data: {
                    operatorId: operator.id,
                    status: "active",
                    lastMessageAt: new Date()
                },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    messages: { orderBy: { createdAt: "asc" } }
                }
            });

            // Add system message
            await (prisma as any).supportMessage.create({
                data: {
                    chatId: id,
                    senderId: userId,
                    content: `${operator.displayName} se unió al chat`,
                    isFromAdmin: true,
                    isSystem: true
                }
            });

            return NextResponse.json(updated);
        } else if (action === "resolve") {
            // Resolve the chat
            if (chat.operatorId !== operator.id) {
                return NextResponse.json({ error: "No tienes acceso a este chat" }, { status: 403 });
            }

            const updated = await (prisma as any).supportChat.update({
                where: { id },
                data: {
                    status: "resolved",
                    resolvedAt: new Date()
                }
            });

            // Add system message
            if (resolutionNote) {
                await (prisma as any).supportMessage.create({
                    data: {
                        chatId: id,
                        senderId: userId,
                        content: resolutionNote,
                        isFromAdmin: true,
                        isSystem: false
                    }
                });
            }

            return NextResponse.json(updated);
        } else if (action === "transfer") {
            // Transfer to another operator
            if (chat.operatorId !== operator.id) {
                return NextResponse.json({ error: "No tienes acceso a este chat" }, { status: 403 });
            }

            if (!transferToOperatorId) {
                return NextResponse.json({ error: "Especifica el operador destino" }, { status: 400 });
            }

            const targetOperator = await (prisma as any).supportOperator.findUnique({
                where: { id: transferToOperatorId }
            });

            if (!targetOperator || !targetOperator.isActive) {
                return NextResponse.json({ error: "Operador destino no válido" }, { status: 400 });
            }

            const updated = await (prisma as any).supportChat.update({
                where: { id },
                data: {
                    operatorId: transferToOperatorId,
                    lastMessageAt: new Date()
                }
            });

            // Add system message
            await (prisma as any).supportMessage.create({
                data: {
                    chatId: id,
                    senderId: userId,
                    content: `Chat transferido a ${targetOperator.displayName}`,
                    isFromAdmin: true,
                    isSystem: true
                }
            });

            return NextResponse.json(updated);
        } else {
            return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error updating chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
