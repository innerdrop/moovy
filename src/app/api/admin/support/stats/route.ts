// API: Admin - Support statistics
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

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all chats
        const allChats = await (prisma as any).supportChat.findMany({
            include: {
                messages: { select: { createdAt: true } }
            }
        });

        // Count by period
        const todayChats = allChats.filter((c: any) => c.createdAt >= startOfToday).length;
        const weekChats = allChats.filter((c: any) => c.createdAt >= startOfWeek).length;
        const monthChats = allChats.filter((c: any) => c.createdAt >= startOfMonth).length;

        // Status breakdown
        const byStatus = {
            waiting: allChats.filter((c: any) => c.status === "waiting").length,
            active: allChats.filter((c: any) => c.status === "active").length,
            resolved: allChats.filter((c: any) => c.status === "resolved").length,
            closed: allChats.filter((c: any) => c.status === "closed").length
        };

        // Category breakdown
        const byCategory: Record<string, number> = {};
        allChats.forEach((chat: any) => {
            const cat = chat.category || "otro";
            byCategory[cat] = (byCategory[cat] || 0) + 1;
        });

        // Average rating
        const ratedChats = allChats.filter((c: any) => c.rating !== null);
        const avgRating = ratedChats.length > 0
            ? ratedChats.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / ratedChats.length
            : 0;

        // Average resolution time
        const resolvedChats = allChats.filter((c: any) => c.resolvedAt && c.createdAt);
        const avgResolutionMinutes = resolvedChats.length > 0
            ? resolvedChats.reduce((sum: number, c: any) => {
                const time = (c.resolvedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60);
                return sum + time;
            }, 0) / resolvedChats.length
            : 0;

        // Operators stats
        const operators = await (prisma as any).supportOperator.findMany({
            include: {
                chats: true
            }
        });

        const operatorStats = await Promise.all(
            operators.map(async (op: any) => {
                const activeCount = await (prisma as any).supportChat.count({
                    where: { operatorId: op.id, status: "active" }
                });
                return {
                    id: op.id,
                    displayName: op.displayName,
                    isActive: op.isActive,
                    isOnline: op.isOnline,
                    totalChats: op.chats.length,
                    activeChats: activeCount
                };
            })
        );

        return NextResponse.json({
            counts: {
                total: allChats.length,
                today: todayChats,
                week: weekChats,
                month: monthChats
            },
            byStatus,
            byCategory,
            avgRating: parseFloat(avgRating.toFixed(2)),
            avgResolutionMinutes: parseFloat(avgResolutionMinutes.toFixed(2)),
            ratedCount: ratedChats.length,
            operators: operatorStats
        });
    } catch (error) {
        console.error("Error fetching support stats:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
