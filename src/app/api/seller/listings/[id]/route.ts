import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get a single listing by ID (must belong to the authenticated seller)
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const userId = (session.user as any).id;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor." },
                { status: 404 }
            );
        }

        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                images: { orderBy: { order: "asc" } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        if (!listing || listing.sellerId !== seller.id) {
            return NextResponse.json(
                { error: "Listing no encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json(listing);
    } catch (error) {
        console.error("Error fetching listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PUT - Update a listing
export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const userId = (session.user as any).id;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor." },
                { status: 404 }
            );
        }

        // Verify ownership
        const existing = await prisma.listing.findUnique({
            where: { id },
            select: { sellerId: true },
        });

        if (!existing || existing.sellerId !== seller.id) {
            return NextResponse.json(
                { error: "Listing no encontrada" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { title, description, price, stock, condition, categoryId } = body;

        const updated = await prisma.listing.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(price !== undefined && { price }),
                ...(stock !== undefined && { stock }),
                ...(condition !== undefined && { condition }),
                ...(categoryId !== undefined && { categoryId: categoryId || null }),
            },
            include: {
                images: { orderBy: { order: "asc" } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE - Soft delete (deactivate) a listing
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const userId = (session.user as any).id;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor." },
                { status: 404 }
            );
        }

        const existing = await prisma.listing.findUnique({
            where: { id },
            select: { sellerId: true, isActive: true },
        });

        if (!existing || existing.sellerId !== seller.id) {
            return NextResponse.json(
                { error: "Listing no encontrada" },
                { status: 404 }
            );
        }

        // Toggle isActive
        const updated = await prisma.listing.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });

        return NextResponse.json({
            success: true,
            isActive: updated.isActive,
            message: updated.isActive ? "Listing activada" : "Listing desactivada",
        });
    } catch (error) {
        console.error("Error toggling listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
