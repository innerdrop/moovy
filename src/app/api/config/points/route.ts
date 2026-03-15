// Public Points Config Endpoint
// Returns points system configuration for public access (no auth required)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const config = await prisma.pointsConfig.findUnique({
            where: { id: "points_config" }
        });

        // Default values if no config exists
        const defaults = {
            pointsPerDollar: 1,
            signupBonus: 250,
            referralBonus: 500,
            refereeBonus: 250,
            reviewBonus: 25,
            minPointsToRedeem: 500,
            maxDiscountPercent: 15,
            pointsValue: 0.015,
            pointsExpire: false
        };

        if (!config) {
            return NextResponse.json(defaults);
        }

        return NextResponse.json({
            pointsPerDollar: config.pointsPerDollar,
            signupBonus: config.signupBonus,
            referralBonus: config.referralBonus,
            refereeBonus: (config as any).refereeBonus ?? defaults.refereeBonus,
            reviewBonus: config.reviewBonus,
            minPointsToRedeem: config.minPointsToRedeem,
            maxDiscountPercent: config.maxDiscountPercent,
            pointsValue: config.pointsValue,
            pointsExpire: config.pointsExpireDays ? true : false
        });
    } catch (error) {
        console.error("[Points Config API] Error:", error);
        // Return defaults on error
        return NextResponse.json({
            pointsPerDollar: 1,
            signupBonus: 250,
            referralBonus: 500,
            refereeBonus: 250,
            reviewBonus: 25,
            minPointsToRedeem: 500,
            maxDiscountPercent: 15,
            pointsValue: 0.015,
            pointsExpire: false
        });
    }
}
