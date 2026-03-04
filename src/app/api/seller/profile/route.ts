import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get seller profile for the authenticated user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
                _count: { select: { listings: true } },
            },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor. Activalo primero." },
                { status: 404 }
            );
        }

        return NextResponse.json(seller);
    } catch (error) {
        console.error("Error fetching seller profile:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PUT - Update seller profile
export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();
        const { displayName, bio, avatar, bankAlias, bankCbu } = body;

        // Verify seller profile exists
        const existing = await prisma.sellerProfile.findUnique({
            where: { userId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor. Activalo primero." },
                { status: 404 }
            );
        }

        const updated = await prisma.sellerProfile.update({
            where: { userId },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(bio !== undefined && { bio }),
                ...(avatar !== undefined && { avatar }),
                ...(bankAlias !== undefined && { bankAlias }),
                ...(bankCbu !== undefined && { bankCbu }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating seller profile:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
