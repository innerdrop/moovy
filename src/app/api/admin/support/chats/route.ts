// API: Admin - List all support chats
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "";
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = {};
        if (status) where.status = status;

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

        return NextResponse.json(chats);
    } catch (error) {
        console.error("Error fetching admin chats:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
