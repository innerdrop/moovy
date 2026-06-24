import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = await applyRateLimit(request, "ops:coupons", 30, 60_000);
  if (limited) return limited;

  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, "ops:coupons:create", 20, 60_000);
  if (limited) return limited;

  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();

    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      maxUses,
      maxUsesPerUser,
      validUntil,
    } = body;

    if (!code || !discountType || typeof discountValue !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este código de cupón ya existe" },
        { status: 409 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || null,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount || null,
        maxDiscountAmount: maxDiscountAmount || null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || 1,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
