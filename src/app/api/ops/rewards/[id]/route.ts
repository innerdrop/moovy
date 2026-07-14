import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const updateSchema = z.object({
    label: z.string().min(1).max(60).optional(),
    icon: z.string().min(1).max(8).optional(),
    description: z.string().max(160).optional().nullable(),
    pointsCost: z.number().int().min(1).optional(),
    type: z.enum(["FREE_DELIVERY", "FIXED_AMOUNT"]).optional(),
    value: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const limited = await applyRateLimit(request, "ops:rewards:update", 30, 60_000);
    if (limited) return limited;
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;
        const body = await request.json().catch(() => null);
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
        }

        const data: any = { ...parsed.data };
        // FREE_DELIVERY siempre value 0.
        if (data.type === "FREE_DELIVERY") data.value = 0;
        if (data.description !== undefined) data.description = data.description || null;

        const reward = await prisma.reward.update({ where: { id }, data });
        return NextResponse.json(reward);
    } catch (error) {
        console.error("Error updating reward:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const limited = await applyRateLimit(request, "ops:rewards:delete", 20, 60_000);
    if (limited) return limited;
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;
        await prisma.reward.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting reward:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
