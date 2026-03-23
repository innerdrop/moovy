// Rate limit status check endpoint
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = body.email?.toLowerCase();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check rate limit for this email
        const rateLimitKey = `login:${email}`;
        const rateCheck = await checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

        if (!rateCheck.allowed) {
            // Calculate remaining seconds until reset
            const remainingSeconds = Math.ceil(rateCheck.resetIn / 1000);
            return NextResponse.json(
                {
                    rateLimited: true,
                    remainingSeconds,
                    message: `Demasiados intentos. Esperá ${Math.ceil(remainingSeconds / 60)} minutos.`,
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                rateLimited: false,
                remainingSeconds: 0,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[Rate Limit Check] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
