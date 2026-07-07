import { NextResponse } from "next/server";
// fix/panel-comercio-auditoria: helper canónico en vez de auth artesanal.
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const authResult = await requireMerchantApi();
        if (authResult instanceof NextResponse) return authResult;
        const { merchant } = authResult;

        if (!merchant) {
            return NextResponse.json({ count: 0 });
        }

        // Count unread support messages for this merchant
        const unreadCount = await prisma.supportMessage.count({
            where: {
                chat: {
                    merchantId: merchant.id
                },
                isFromAdmin: true,
                isRead: false
            }
        });

        return NextResponse.json({ count: unreadCount });

    } catch (error) {
        console.error("Error fetching support notifications:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
