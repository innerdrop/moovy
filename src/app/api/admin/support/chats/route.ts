// API: Admin - List all support chats
import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "";
        const origin = searchParams.get("origin") || "";
        const group = searchParams.get("group") || "";
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = {};
        // feat/chat-en-vivo: `group` agrupa estados — open = esperando+activo,
        // closed = resuelto+cerrado (la "sección de cerradas"). Precede a `status`.
        if (group === "open") where.status = { in: ["waiting", "active"] };
        else if (group === "closed") where.status = { in: ["resolved", "closed"] };
        else if (status) where.status = status;
        // feat/soporte-bandeja-ops: filtro por origen (BUYER/MERCHANT/DRIVER).
        if (origin) where.origin = origin;

        const chats = await (prisma as any).supportChat.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
                operator: { select: { id: true, displayName: true, isOnline: true } },
                messages: {
                    orderBy: { createdAt: "desc" as const },
                    take: 1,
                    select: { content: true, createdAt: true, isFromAdmin: true }
                },
                _count: { select: { messages: true } }
            },
            orderBy: { lastMessageAt: "desc" as const },
            take: limit,
        });

        // feat/chat-en-vivo: mensajes del usuario sin leer por el equipo, por ticket
        // (para resaltar el ticket en la bandeja de OPS).
        const withUnread = await Promise.all(
            (chats as any[]).map(async (chat) => {
                const unreadCount = await (prisma as any).supportMessage.count({
                    where: { chatId: chat.id, isFromAdmin: false, isRead: false },
                });
                return { ...chat, unreadCount };
            })
        );

        return NextResponse.json(withUnread);
    } catch (error) {
        console.error("Error fetching admin chats:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
