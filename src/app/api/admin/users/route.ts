
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - List all users (Admin only)
export async function GET(request: Request) {
    try {
        const session = await auth();
        // Check if user is admin - Adjust role check based on your auth implementation
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email === "admin@moovy.com";

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                pointsBalance: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Create a new user (Admin only)
export async function POST(request: Request) {
    try {
        const session = await auth();
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email === "admin@moovy.com";

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, phone, password, role = "CLIENT" } = body;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone: phone || null,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                pointsBalance: true,
                createdAt: true,
            }
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}

// PATCH - Update a user (Admin only)
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email === "admin@moovy.com";

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, email, phone, pointsBalance, action, newPassword } = body;

        if (!id) {
            return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Handle password reset action
        if (action === "reset_password") {
            if (!newPassword || newPassword.length < 6) {
                return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id },
                data: { password: hashedPassword }
            });

            return NextResponse.json({ success: true, message: "Contraseña actualizada" });
        }

        // Check if new email already exists (for another user)
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({ where: { email } });
            if (emailExists) {
                return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone !== undefined && { phone: phone || null }),
                ...(pointsBalance !== undefined && { pointsBalance }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                pointsBalance: true,
                createdAt: true,
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
    }
}

// DELETE - Delete users (Admin only, bulk)
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email === "admin@moovy.com";

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { userIds } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: "No se especificaron usuarios" }, { status: 400 });
        }

        // Prevent deleting admin users
        const usersToDelete = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, role: true, email: true }
        });

        const hasAdmin = usersToDelete.some(u => u.role === "ADMIN");
        if (hasAdmin) {
            return NextResponse.json({ error: "No se pueden eliminar usuarios admin" }, { status: 400 });
        }

        // Delete users
        await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });

        return NextResponse.json({
            success: true,
            deleted: userIds.length,
            message: `${userIds.length} usuario(s) eliminado(s)`
        });
    } catch (error) {
        console.error("Error deleting users:", error);
        return NextResponse.json({ error: "Error al eliminar usuarios" }, { status: 500 });
    }
}
