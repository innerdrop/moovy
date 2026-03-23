// API: Admin - Update/delete operator
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// PATCH - Update operator
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const { isActive, displayName, maxChats } = await request.json();

        const operator = await (prisma as any).supportOperator.update({
            where: { id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(displayName && { displayName }),
                ...(maxChats && { maxChats })
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(operator);
    } catch (error) {
        console.error("Error updating operator:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE - Remove operator
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        // Move their active chats back to waiting
        await (prisma as any).supportChat.updateMany({
            where: { operatorId: id, status: "active" },
            data: { operatorId: null, status: "waiting" }
        });

        // Delete operator
        await (prisma as any).supportOperator.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting operator:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
