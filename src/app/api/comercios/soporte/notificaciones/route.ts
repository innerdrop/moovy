import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id }
        });

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
