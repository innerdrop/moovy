import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Activate seller profile for the authenticated user
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Create SellerProfile if it doesn't exist.
        // El rol SELLER se deriva de SellerProfile.isActive en cada request
        // (ver src/lib/roles.ts), ya no escribimos UserRole.
        const seller = await prisma.sellerProfile.upsert({
            where: { userId },
            update: { isActive: true },
            create: {
                userId,
                displayName: session.user.name || null,
                isActive: true,
            },
        });

        return NextResponse.json({ success: true, seller });
    } catch (error) {
        console.error("Error activating seller profile:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
