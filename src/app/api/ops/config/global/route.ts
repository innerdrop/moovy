// API Route: Ops Global Config (MoovyConfig table)
// GET  → returns all config rows
// PATCH → updates one config value by key
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const configs = await prisma.moovyConfig.findMany({
            orderBy: { key: "asc" },
        });

        return NextResponse.json({ configs });
    } catch (error) {
        console.error("Error fetching global config:", error);
        return NextResponse.json(
            { error: "Error al obtener configuración" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined || value === null) {
            return NextResponse.json(
                { error: "key y value son requeridos" },
                { status: 400 }
            );
        }

        const updated = await prisma.moovyConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: {
                key,
                value: String(value),
                description: key.replace(/_/g, " "),
            },
        });

        return NextResponse.json({ config: updated });
    } catch (error) {
        console.error("Error updating global config:", error);
        return NextResponse.json(
            { error: "Error al actualizar configuración" },
            { status: 500 }
        );
    }
}
