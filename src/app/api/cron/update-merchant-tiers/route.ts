/**
 * Cron: Update merchant loyalty tiers
 *
 * Recalculates merchant tiers based on delivered orders in last 30 days.
 * Should run once daily.
 * Notifies merchants via email and push if their tier changes.
 *
 * Protected by CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAllMerchantTiers, updateMerchantTier, getTierConfig } from "@/lib/merchant-loyalty";
import logger from "@/lib/logger";
import { emailLayout, emailButton, emailAlertBox, sendEmail } from "@/lib/email";

const cronLogger = logger.child({ context: "cron-merchant-tiers" });

export async function POST(req: NextRequest) {
  try {
    // Auth: CRON_SECRET timing-safe comparison
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const { verifyBearerToken } = await import("@/lib/env-validation");
    if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
      cronLogger.warn({}, "Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    cronLogger.info({}, "Starting merchant tier recalculation");

    // Get all approved merchants
    const merchants = await prisma.merchant.findMany({
      where: { isActive: true, approvalStatus: "APPROVED" },
      select: {
        id: true,
        loyaltyTier: true,
        email: true,
        name: true,
        ownerId: true,
      },
    });

    let changedCount = 0;
    const tierChanges: Array<{
      merchantId: string;
      name: string;
      oldTier: string;
      newTier: string;
      email: string;
    }> = [];

    for (const merchant of merchants) {
      try {
        const result = await updateMerchantTier(merchant.id);

        if (result.changed && result.oldTier && result.newTier) {
          changedCount++;
          tierChanges.push({
            merchantId: merchant.id,
            name: merchant.name,
            oldTier: result.oldTier,
            newTier: result.newTier,
            email: merchant.email || "",
          });
        }
      } catch (error) {
        cronLogger.error({ error, merchantId: merchant.id }, "Error updating single merchant tier");
      }
    }

    // Send notifications for tier changes
    for (const change of tierChanges) {
      try {
        const oldTierConfig = await getTierConfig(change.oldTier as any);
        const newTierConfig = await getTierConfig(change.newTier as any);

        if (!newTierConfig) continue;

        // Email notification
        if (change.email) {
          const html = emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">¡Felicitaciones, ${change.name}!</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              Tu comercio ascendió de rango en MOOVY.
            </p>
            ${emailAlertBox(`
              <strong>Antiguo rango:</strong> ${change.oldTier}<br/>
              <strong>Nuevo rango:</strong> ${change.newTier}<br/>
              <strong>Nueva comisión:</strong> ${(newTierConfig.commissionRate * 100).toFixed(1)}%
            `, 'success')}
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              ${newTierConfig.benefits?.join(", ") || "Acceso a nuevos beneficios"}
            </p>
            ${emailButton('Ver mi dashboard', `${process.env.NEXT_PUBLIC_APP_URL}/comercios/dashboard`, 'green')}
          `);

          await sendEmail({
            to: change.email,
            subject: `🎉 ¡Tu comercio ascendió a ${change.newTier} en MOOVY!`,
            html,
            tag: "merchant_tier_upgrade",
          }).catch((err: Error) => {
            cronLogger.error({ error: err, email: change.email }, "Failed to send tier upgrade email");
          });
        }

        cronLogger.info(
          {
            merchantId: change.merchantId,
            oldTier: change.oldTier,
            newTier: change.newTier,
            email: change.email,
          },
          "Tier change notification sent"
        );
      } catch (error) {
        cronLogger.error({ error, merchantId: change.merchantId }, "Error sending tier change notification");
      }
    }

    cronLogger.info(
      {
        totalMerchants: merchants.length,
        changedCount,
        changedMerchants: tierChanges,
      },
      "Merchant tier recalculation completed"
    );

    return NextResponse.json({
      success: true,
      message: `Recalculated ${merchants.length} merchants, ${changedCount} tier changes`,
      changedCount,
      tierChanges: tierChanges.map((c) => ({
        merchantId: c.merchantId,
        name: c.name,
        oldTier: c.oldTier,
        newTier: c.newTier,
      })),
    });
  } catch (error) {
    cronLogger.error({ error }, "Cron update-merchant-tiers failed");
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
