// API Route: Merchant Registration
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        console.log("[Register Merchant] Received:", data.businessName);

        // Validate required fields
        if (!data.email || !data.password || !data.firstName || !data.businessName) {
            return NextResponse.json(
                { error: "Faltan datos obligatorios" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Ya existe una cuenta con ese email" },
                { status: 409 }
            );
        }

        // Generate slug
        let slug = generateSlug(data.businessName);
        // Check for duplicate slug
        const existingSlug = await prisma.merchant.findUnique({
            where: { slug }
        });
        if (existingSlug) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        // Create User + Merchant in transaction
        await prisma.$transaction(async (tx) => {
            // 1. Create User
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: fullName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: 'MERCHANT',
                }
            });

            // 2. Create Merchant
            await tx.merchant.create({
                data: {
                    ownerId: newUser.id,
                    name: data.businessName,
                    slug: slug,
                    category: data.businessType,
                    cuit: data.cuit,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    latitude: data.latitude ? parseFloat(data.latitude) : null,
                    longitude: data.longitude ? parseFloat(data.longitude) : null,
                    description: data.description,
                    isActive: false, // Pending approval
                    isVerified: false
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: "Solicitud enviada exitosamente"
        });

    } catch (error: any) {
        console.error("[Register Merchant] Error:", error);
        return NextResponse.json(
            { error: `Error al registrar: ${error.message}` },
            { status: 500 }
        );
    }
}
