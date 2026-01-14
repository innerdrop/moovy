
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
