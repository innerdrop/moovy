import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await applyRateLimit(request, "ops:coupons:update", 30, 60_000);
  if (limited) return limited;

  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const body = await request.json();

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.discountType && { discountType: body.discountType }),
        ...(typeof body.discountValue === "number" && {
          discountValue: body.discountValue,
        }),
        ...(body.minOrderAmount !== undefined && {
          minOrderAmount: body.minOrderAmount,
        }),
        ...(body.maxDiscountAmount !== undefined && {
          maxDiscountAmount: body.maxDiscountAmount,
        }),
        ...(body.maxUses !== undefined && { maxUses: body.maxUses }),
        ...(typeof body.maxUsesPerUser === "number" && {
          maxUsesPerUser: body.maxUsesPerUser,
        }),
        ...(body.validUntil !== undefined && {
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
        }),
        ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await applyRateLimit(request, "ops:coupons:delete", 20, 60_000);
  if (limited) return limited;

  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;

    // Delete associated usages first (cascade)
    await prisma.couponUsage.deleteMany({
      where: { couponId: id },
    });

    // Delete the coupon
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to delete not found")
    ) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
