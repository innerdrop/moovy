import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["MERCHANT"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const merchantId = (session?.user as any)?.merchantId;
        if (!merchantId) {
            return NextResponse.json({ error: "Merchant no asociado" }, { status: 401 });
        }

        const purchases = await prisma.packagePurchase.findMany({
            where: { merchantId },
            orderBy: { createdAt: "desc" },
            include: {
                category: { select: { id: true, name: true, image: true } },
            },
        });

        // Stats
        const stats = {
            totalPurchases: purchases.length,
            totalSpent: purchases.filter(p => p.paymentStatus === "approved").reduce((s, p) => s + p.amount, 0),
            totalImported: purchases.reduce((s, p) => s + p.importedCount, 0),
            pendingPayments: purchases.filter(p => p.paymentStatus === "pending").length,
        };

        return NextResponse.json({ purchases, stats });
    } catch (error) {
        console.error("Error fetching purchase history:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
