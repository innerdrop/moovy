// API Route: Admin Merchants Management
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Fetch all merchants with filters
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const where: any = {};

        if (status === "verified") {
            where.isVerified = true;
        } else if (status === "pending") {
            where.OR = [
                { approvalStatus: "PENDING" },
                { approvalStatus: null, isVerified: false },
            ];
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
                    select: { firstName: true, lastName: true, email: true, phone: true }
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

// Allowed fields for admin merchant update (whitelist to prevent injection)
const ALLOWED_MERCHANT_UPDATE_FIELDS = new Set([
    "name",
    "description",
    "email",
    "phone",
    "address",
    "image",
    "logo",
    "isActive",
    "isVerified",
    "approvalStatus",
    "approvedAt",
    "rejectionReason",
    "minOrderAmount",
    "deliveryRadiusKm",
    "commissionRate",
    "schedule",
]);

// PATCH - Update merchant (whitelist-protected)
export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const data = await request.json();
        const { id, ...rawData } = data;

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        // Filter to only allowed fields
        const updateData: Record<string, any> = {};
        for (const [key, value] of Object.entries(rawData)) {
            if (ALLOWED_MERCHANT_UPDATE_FIELDS.has(key)) {
                updateData[key] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No se proporcionaron campos válidos para actualizar" }, { status: 400 });
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
