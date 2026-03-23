// API: Admin - Operators CRUD
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

// POST - Create operator
// Soporta dos flujos:
// 1. Crear cuenta nueva: { email, password, displayName, maxChats? }
// 2. Vincular usuario existente: { userId, displayName, maxChats? }
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { userId, email, password, displayName, maxChats } = await request.json();

        if (!displayName) {
            return NextResponse.json(
                { error: "displayName es requerido" },
                { status: 400 }
            );
        }

        let targetUserId: string;

        if (userId) {
            // Flujo 2: Vincular usuario existente
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
            }
            targetUserId = user.id;
        } else if (email && password) {
            // Flujo 1: Crear cuenta nueva para el operador
            const normalizedEmail = email.toLowerCase().trim();

            if (password.length < 8) {
                return NextResponse.json(
                    { error: "La contraseña debe tener al menos 8 caracteres" },
                    { status: 400 }
                );
            }

            // Verificar que no exista ya un usuario con ese email
            const existingUser = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });
            if (existingUser) {
                return NextResponse.json(
                    { error: "Ya existe un usuario con ese email. Podés vincularlo como operador desde la pestaña de usuarios." },
                    { status: 400 }
                );
            }

            // Crear usuario + operador en transacción
            const hashedPassword = await bcrypt.hash(password, 12);

            const result = await prisma.$transaction(async (tx: any) => {
                const newUser = await tx.user.create({
                    data: {
                        email: normalizedEmail,
                        name: displayName,
                        password: hashedPassword,
                        roles: {
                            create: { role: "ADMIN" }
                        }
                    }
                });

                const newOperator = await tx.supportOperator.create({
                    data: {
                        userId: newUser.id,
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

                return newOperator;
            });

            return NextResponse.json(result, { status: 201 });
        } else {
            return NextResponse.json(
                { error: "Se requiere email + contraseña para crear un operador nuevo, o userId para vincular uno existente" },
                { status: 400 }
            );
        }

        // Flujo 2 continúa: vincular usuario existente como operador
        const existing = await (prisma as any).supportOperator.findUnique({
            where: { userId: targetUserId }
        });
        if (existing) {
            return NextResponse.json({ error: "Este usuario ya es un operador" }, { status: 400 });
        }

        const operator = await (prisma as any).supportOperator.create({
            data: {
                userId: targetUserId,
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
