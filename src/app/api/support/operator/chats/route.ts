// API: Operator - List chats
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOperator(userId: string) {
    return (prisma as any).supportOperator.findUnique({
        where: { userId }
    });
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const operator = await getOperator(userId);

        if (!operator || !operator.isActive) {
            return NextResponse.json({ error: "No eres un operador de soporte" }, { status: 403 });
        }

        // Get assigned chats + waiting chats (for claiming)
        const assignedChats = await (prisma as any).supportChat.findMany({
            where: {
                operatorId: operator.id,
                status: { in: ["active", "waiting"] }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                _count: { select: { messages: true } }
            },
            orderBy: [
                { status: "desc" }, // active first
                { lastMessageAt: "desc" }
            ]
        });

        // Get waiting chats (not assigned) for operator to claim
        const waitingChats = await (prisma as any).supportChat.findMany({
            where: {
                status: "waiting",
                operatorId: null
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                _count: { select: { messages: true } }
            },
            orderBy: { createdAt: "asc" },
            take: 10 // Show first 10 waiting chats
        });

        // Count unread for each chat
        const assignedWithUnread = await Promise.all(
            assignedChats.map(async (chat: any) => {
                const unreadCount = await (prisma as any).supportMessage.count({
                    where: {
                        chatId: chat.id,
                        isFromAdmin: false,
                        isRead: false
                    }
                });
                return { ...chat, unreadCount };
            })
        );

        const waitingWithUnread = await Promise.all(
            waitingChats.map(async (chat: any) => {
                const unreadCount = await (prisma as any).supportMessage.count({
                    where: {
                        chatId: chat.id,
                        isFromAdmin: false,
                        isRead: false
                    }
                });
                return { ...chat, unreadCount };
            })
        );

        // Check current active chat count
        const activeChatCount = assignedChats.filter(
            (c: any) => c.status === "active"
        ).length;

        return NextResponse.json({
            operator: {
                ...operator,
                activeChatCount
            },
            assigned: assignedWithUnread,
            waiting: waitingWithUnread,
            totalAssigned: assignedChats.length,
            totalWaiting: waitingChats.length
        });
    } catch (error) {
        console.error("Error fetching operator chats:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
