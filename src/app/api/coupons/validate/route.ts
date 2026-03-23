import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit: max 20 validations per minute per IP
  const limited = await applyRateLimit(request, "coupons:validate", 20, 60_000);
  if (limited) return limited;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debe iniciar sesión" },
        { status: 401 }
      );
    }

    const { code, orderTotal } = await request.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Código de cupón inválido" },
        { status: 400 }
      );
    }

    if (typeof orderTotal !== "number" || orderTotal <= 0) {
      return NextResponse.json(
        { error: "Total de pedido inválido" },
        { status: 400 }
      );
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Cupón no encontrado o inválido" },
        { status: 404 }
      );
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "Este cupón ya no está disponible" },
        { status: 400 }
      );
    }

    // Check date range
    const now = new Date();
    if (coupon.validFrom > now) {
      return NextResponse.json(
        { error: "Este cupón aún no está disponible" },
        { status: 400 }
      );
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json(
        { error: "Este cupón ha expirado" },
        { status: 400 }
      );
    }

    // Check total uses
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: "Este cupón ha alcanzado su límite de usos" },
        { status: 400 }
      );
    }

    // Check per-user limit
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId: session.user.id,
      },
    });

    if (userUsageCount >= coupon.maxUsesPerUser) {
      return NextResponse.json(
        { error: `Ya has usado este cupón ${coupon.maxUsesPerUser} vez(ces)` },
        { status: 400 }
      );
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `El pedido debe ser mayor a $${coupon.minOrderAmount.toLocaleString("es-AR")}`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "FIXED_AMOUNT") {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Error validando cupón" },
      { status: 500 }
    );
  }
}
