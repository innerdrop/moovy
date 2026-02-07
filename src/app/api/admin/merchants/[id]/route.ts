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
                        firstName: true,
                        lastName: true,
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

        // Address with automatic geocoding
        if (body.address !== undefined) {
            updateData.address = body.address || null;

            // Auto-geocode if address is provided and no coordinates given
            if (body.address && (body.latitude === undefined || body.longitude === undefined)) {
                try {
                    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                    const fullAddress = `${body.address}, Ushuaia, Tierra del Fuego, Argentina`;
                    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

                    const geoResponse = await fetch(geocodeUrl);
                    const geoData = await geoResponse.json();

                    if (geoData.status === "OK" && geoData.results.length > 0) {
                        updateData.latitude = geoData.results[0].geometry.location.lat;
                        updateData.longitude = geoData.results[0].geometry.location.lng;
                        console.log(`[Merchant] Auto-geocoded "${body.address}" to ${updateData.latitude}, ${updateData.longitude}`);
                    }
                } catch (geoError) {
                    console.error("[Merchant] Geocoding error:", geoError);
                }
            }
        }

        // Manual coordinates override (if explicitly provided)
        if (body.latitude !== undefined) updateData.latitude = body.latitude !== null ? parseFloat(body.latitude) : null;
        if (body.longitude !== undefined) updateData.longitude = body.longitude !== null ? parseFloat(body.longitude) : null;

        const merchant = await prisma.merchant.update({
            where: { id },
            data: updateData,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
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
