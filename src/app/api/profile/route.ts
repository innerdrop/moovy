// API Route: User Profile
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get current user profile
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                addresses: {
                    orderBy: [
                        { isDefault: 'desc' },
                        { createdAt: 'desc' }
                    ]
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            image: user.image,
            addresses: user.addresses.map(addr => ({
                ...addr,
                isDefault: addr.isDefault // Boolean natively in Prisma
            }))
        });

    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
    }
}

// PATCH - Update current user profile
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();

        // Prepare update data
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.phone !== undefined) updateData.phone = data.phone;

        // Handle name split if full name provided but not parts
        if (data.name && !data.firstName && !data.lastName) {
            const parts = data.name.trim().split(" ");
            if (parts.length > 0) {
                updateData.firstName = parts[0];
                updateData.lastName = parts.slice(1).join(" ") || "";
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
    }
}

// DELETE - Soft Delete User Account (Data Retention)
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { confirmationEmail } = data;

        if (!confirmationEmail || confirmationEmail !== session.user.email) {
            return NextResponse.json(
                { error: "El email de confirmación no coincide" },
                { status: 400 }
            );
        }

        // SOFT DELETE ONLY - Keep all data for analytics
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                deletedAt: new Date(),
            }
        });

        return NextResponse.json({ message: "Cuenta desactivada correctamente" });

    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json(
            { error: "Error al eliminar la cuenta. Intenta más tarde." },
            { status: 500 }
        );
    }
}
