// API Route: Admin Create Merchant
// Allows OPS admin to create a new merchant (with or without existing user)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encryptMerchantData } from "@/lib/fiscal-crypto";

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.email || !data.businessName) {
            return NextResponse.json(
                { error: "Email y nombre del comercio son obligatorios" },
                { status: 400 }
            );
        }

        // Generate unique slug
        let slug = generateSlug(data.businessName);
        const existingSlug = await prisma.merchant.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
            include: {
                roles: { where: { isActive: true }, select: { role: true } },
                ownedMerchants: { select: { id: true }, take: 1 },
            },
        });

        // If user already has a merchant, reject
        if (existingUser?.ownedMerchants && existingUser.ownedMerchants.length > 0) {
            return NextResponse.json(
                { error: "Este email ya tiene un comercio registrado" },
                { status: 409 }
            );
        }

        // Merchant base data
        let merchantData: any = {
            name: data.businessName,
            businessName: data.businessName,
            slug,
            category: data.category || "Otro",
            email: data.email.toLowerCase(),
            phone: data.phone || null,
            address: data.address || null,
            description: data.description || "",
            // Admin-created merchants are pre-approved
            isActive: true,
            isVerified: false,
            approvalStatus: "APPROVED",
            approvedAt: new Date(),
        };

        // Encrypt sensitive data
        merchantData = encryptMerchantData(merchantData);

        let createdMerchantId: string | null = null;

        await prisma.$transaction(async (tx) => {
            if (existingUser) {
                // User exists — add COMERCIO role + create merchant
                const hasMerchantRole = existingUser.roles.some(
                    (r: { role: string }) => r.role === "COMERCIO"
                );
                if (!hasMerchantRole) {
                    await tx.userRole.create({
                        data: { userId: existingUser.id, role: "COMERCIO", isActive: true },
                    });
                }

                const merchant = await tx.merchant.create({
                    data: { ...merchantData, ownerId: existingUser.id },
                });
                createdMerchantId = merchant.id;
            } else {
                // New user — create user + roles + merchant
                if (!data.password) {
                    throw new Error("Se requiere contraseña para usuarios nuevos");
                }

                const hashedPassword = await bcrypt.hash(data.password, 10);
                const fullName = data.ownerName || data.businessName;

                const newUser = await tx.user.create({
                    data: {
                        email: data.email.toLowerCase(),
                        password: hashedPassword,
                        name: fullName,
                        firstName: fullName.split(" ")[0] || fullName,
                        lastName: fullName.split(" ").slice(1).join(" ") || "",
                        role: "USER",
                    },
                });

                await tx.userRole.createMany({
                    data: [
                        { userId: newUser.id, role: "USER", isActive: true },
                        { userId: newUser.id, role: "COMERCIO", isActive: true },
                    ],
                });

                const merchant = await tx.merchant.create({
                    data: { ...merchantData, ownerId: newUser.id },
                });
                createdMerchantId = merchant.id;
            }
        });

        return NextResponse.json({
            success: true,
            merchantId: createdMerchantId,
            message: existingUser
                ? "Comercio creado y vinculado al usuario existente"
                : "Comercio y usuario creados exitosamente",
        });
    } catch (error: any) {
        console.error("[Admin Create Merchant] Error:", error);
        return NextResponse.json(
            { error: error.message || "Error al crear comercio" },
            { status: 500 }
        );
    }
}
