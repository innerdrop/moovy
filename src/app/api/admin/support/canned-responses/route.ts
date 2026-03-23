// API: Admin - Canned responses CRUD
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - List canned responses
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const responses = await (prisma as any).cannedResponse.findMany({
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

// POST - Create canned response
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { shortcut, title, content, category, sortOrder } = await request.json();

        if (!shortcut || !title || !content || !category) {
            return NextResponse.json(
                { error: "shortcut, title, content, y category son requeridos" },
                { status: 400 }
            );
        }

        const response = await (prisma as any).cannedResponse.create({
            data: {
                shortcut: shortcut.toLowerCase(),
                title,
                content,
                category,
                sortOrder: sortOrder || 0,
                isActive: true
            }
        });

        return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
        console.error("Error creating canned response:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "El shortcut ya existe" },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
