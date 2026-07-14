import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// feat/moover-canje-recompensas: CRUD del catálogo de recompensas (OPS).
// El usuario las canjea de un toque en el checkout. Admin-only.

export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "ops:rewards", 30, 60_000);
    if (limited) return limited;
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const rewards = await prisma.reward.findMany({ orderBy: { order: "asc" } });
        return NextResponse.json(rewards);
    } catch (error) {
        console.error("Error fetching rewards:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const createSchema = z.object({
    label: z.string().min(1).max(60),
    icon: z.string().min(1).max(8).default("🎁"),
    description: z.string().max(160).optional().nullable(),
    pointsCost: z.number().int().min(1),
    type: z.enum(["FREE_DELIVERY", "FIXED_AMOUNT"]),
    value: z.number().min(0).default(0),
    isActive: z.boolean().default(true),
    order: z.number().int().default(0),
});

export async function POST(request: Request) {
    const limited = await applyRateLimit(request, "ops:rewards:create", 20, 60_000);
    if (limited) return limited;
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const body = await request.json().catch(() => null);
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        // FIXED_AMOUNT requiere un valor > 0; FREE_DELIVERY ignora value.
        const value = parsed.data.type === "FIXED_AMOUNT" ? parsed.data.value : 0;
        if (parsed.data.type === "FIXED_AMOUNT" && value <= 0) {
            return NextResponse.json({ error: "El descuento fijo necesita un valor mayor a 0" }, { status: 400 });
        }

        const reward = await prisma.reward.create({
            data: {
                label: parsed.data.label,
                icon: parsed.data.icon,
                description: parsed.data.description || null,
                pointsCost: parsed.data.pointsCost,
                type: parsed.data.type,
                value,
                isActive: parsed.data.isActive,
                order: parsed.data.order,
            },
        });
        return NextResponse.json(reward, { status: 201 });
    } catch (error) {
        console.error("Error creating reward:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
