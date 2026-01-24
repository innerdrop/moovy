// API Route: Admin Merchants Management
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all merchants with filters
export async function GET(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!session || userRole !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const where: any = {};

        if (status === "verified") {
            where.isVerified = true;
        } else if (status === "pending") {
            where.isVerified = false;
        } else if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const merchants = await prisma.merchant.findMany({
            where,
            include: {
                owner: {
                    select: { firstName: true, lastName: true, email: true }
                },
                _count: {
                    select: { products: true, orders: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(merchants);
    } catch (error) {
        console.error("Error fetching merchants:", error);
        return NextResponse.json({ error: "Error al obtener comercios" }, { status: 500 });
    }
}

// PATCH - Update merchant
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!session || userRole !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        const updated = await prisma.merchant.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ message: "Comercio actualizado", merchant: updated });
    } catch (error) {
        console.error("Error updating merchant:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}
