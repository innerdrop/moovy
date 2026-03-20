import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const purchases = await prisma.packagePurchase.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                merchant: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, image: true } },
            },
        });

        const enriched = purchases.map(p => ({
            id: p.id,
            merchantId: p.merchantId,
            merchantName: p.merchant.name,
            purchaseType: p.purchaseType,
            categoryName: p.category?.name || null,
            itemCount: p.itemCount,
            amount: p.amount,
            paymentStatus: p.paymentStatus,
            paymentMethod: p.paymentMethod,
            importStatus: p.importStatus,
            importedCount: p.importedCount,
            promoCode: p.promoCode,
            createdAt: p.createdAt,
        }));

        const approvedPurchases = purchases.filter(p => p.paymentStatus === "approved");
        const uniqueMerchants = new Set(approvedPurchases.map(p => p.merchantId));

        const stats = {
            total: purchases.length,
            revenue: approvedPurchases.reduce((s, p) => s + p.amount, 0),
            merchants: uniqueMerchants.size,
            imported: approvedPurchases.reduce((s, p) => s + p.importedCount, 0),
        };

        return NextResponse.json({ purchases: enriched, stats });
    } catch (error) {
        console.error("Error fetching package sales:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
