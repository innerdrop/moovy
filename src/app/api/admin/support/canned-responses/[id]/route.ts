// API: Admin - Update/delete canned response
import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// PATCH - Update canned response
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;
        const { shortcut, title, content, category, sortOrder, isActive } = await request.json();

        const response = await (prisma as any).cannedResponse.update({
            where: { id },
            data: {
                ...(shortcut && { shortcut: shortcut.toLowerCase() }),
                ...(title && { title }),
                ...(content && { content }),
                ...(category && { category }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive })
            }
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error updating canned response:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE - Delete canned response
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;

        await (prisma as any).cannedResponse.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting canned response:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
