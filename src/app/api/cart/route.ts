// API Route: Saved Cart for logged-in users
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Load saved cart for current user
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const savedCart = await prisma.savedCart.findUnique({
            where: { userId: session.user.id }
        });

        if (!savedCart) {
            return NextResponse.json({ items: [], merchantId: null });
        }

        return NextResponse.json({
            items: savedCart.items,
            merchantId: savedCart.merchantId
        });
    } catch (error) {
        console.error("Error loading cart:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Save cart for current user
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { items, merchantId } = await request.json();

        // Validate items is an array
        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
        }

        // If cart is empty, delete the saved cart
        if (items.length === 0) {
            await prisma.savedCart.delete({
                where: { userId: session.user.id }
            }).catch(() => {
                // Ignore error if cart doesn't exist
            });
            return NextResponse.json({ success: true, message: "Carrito vaciado" });
        }

        // Upsert the cart
        await prisma.savedCart.upsert({
            where: { userId: session.user.id },
            update: {
                items: items,
                merchantId: merchantId || null
            },
            create: {
                userId: session.user.id,
                items: items,
                merchantId: merchantId || null
            }
        });

        return NextResponse.json({ success: true, message: "Carrito guardado" });
    } catch (error) {
        console.error("Error saving cart:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
