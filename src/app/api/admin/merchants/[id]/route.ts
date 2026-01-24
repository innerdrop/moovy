import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single merchant by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const merchant = await prisma.merchant.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                        orders: true,
                    },
                },
            },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
        }

        return NextResponse.json(merchant);
    } catch (error) {
        console.error("Error fetching merchant:", error);
        return NextResponse.json({ error: "Error fetching merchant" }, { status: 500 });
    }
}

// PATCH update merchant
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    try {
        // Build update data
        const updateData: any = {};

        // Toggle fields
        if (typeof body.isVerified === "boolean") updateData.isVerified = body.isVerified;
        if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;
        if (typeof body.isOpen === "boolean") updateData.isOpen = body.isOpen;

        // Extended fields
        if (body.cuil !== undefined) updateData.cuil = body.cuil || null;
        if (body.businessName !== undefined) updateData.businessName = body.businessName || null;
        if (body.bankAccount !== undefined) updateData.bankAccount = body.bankAccount || null;
        if (body.ownerDni !== undefined) updateData.ownerDni = body.ownerDni || null;
        if (body.ownerBirthDate !== undefined) {
            updateData.ownerBirthDate = body.ownerBirthDate ? new Date(body.ownerBirthDate) : null;
        }
        if (body.startedAt !== undefined) {
            updateData.startedAt = body.startedAt ? new Date(body.startedAt) : null;
        }
        if (body.instagramUrl !== undefined) updateData.instagramUrl = body.instagramUrl || null;
        if (body.facebookUrl !== undefined) updateData.facebookUrl = body.facebookUrl || null;
        if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber || null;
        if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes || null;

        const merchant = await prisma.merchant.update({
            where: { id },
            data: updateData,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                        orders: true,
                    },
                },
            },
        });

        return NextResponse.json(merchant);
    } catch (error) {
        console.error("Error updating merchant:", error);
        return NextResponse.json({ error: "Error updating merchant" }, { status: 500 });
    }
}
