// API: Admin - Operators CRUD
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - List operators
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const operators = await (prisma as any).supportOperator.findMany({
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { chats: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Add active chat count
        const withCounts = await Promise.all(
            operators.map(async (op: any) => {
                const activeCount = await (prisma as any).supportChat.count({
                    where: {
                        operatorId: op.id,
                        status: "active"
                    }
                });
                return {
                    ...op,
                    activeChatCount: activeCount
                };
            })
        );

        return NextResponse.json(withCounts);
    } catch (error) {
        console.error("Error fetching operators:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Create operator (link to existing user)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { userId, email, displayName, maxChats } = await request.json();

        if ((!userId && !email) || !displayName) {
            return NextResponse.json(
                { error: "email (o userId) y displayName son requeridos" },
                { status: 400 }
            );
        }

        // Find user by email or id
        const user = email
            ? await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
            : await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "No se encontró un usuario con ese email. El usuario debe tener una cuenta registrada en MOOVY." }, { status: 404 });
        }

        // Check operator doesn't already exist
        const existing = await (prisma as any).supportOperator.findUnique({
            where: { userId: user.id }
        });
        if (existing) {
            return NextResponse.json({ error: "Este usuario ya es un operador" }, { status: 400 });
        }

        const operator = await (prisma as any).supportOperator.create({
            data: {
                userId: user.id,
                displayName,
                maxChats: maxChats || 5,
                isActive: true,
                isOnline: false
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(operator, { status: 201 });
    } catch (error) {
        console.error("Error creating operator:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
