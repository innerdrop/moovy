// API: Operator - Get canned responses
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Verify is operator
        const operator = await (prisma as any).supportOperator.findUnique({
            where: { userId }
        });

        if (!operator || !operator.isActive) {
            return NextResponse.json({ error: "No eres un operador de soporte" }, { status: 403 });
        }

        const responses = await (prisma as any).cannedResponse.findMany({
            where: { isActive: true },
            orderBy: [
                { category: "asc" },
                { sortOrder: "asc" }
            ]
        });

        return NextResponse.json(responses);
    } catch (error) {
        console.error("Error fetching canned responses:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
