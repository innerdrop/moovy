// Public config endpoint — returns whitelisted MoovyConfig values
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Only these keys can be read without authentication
const PUBLIC_KEYS = new Set([
    "merchant_confirm_timeout_seconds",
    "driver_response_timeout_seconds",
]);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key || !PUBLIC_KEYS.has(key)) {
        return NextResponse.json({ error: "Key not allowed" }, { status: 400 });
    }

    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    return NextResponse.json({ key, value: config?.value ?? null });
}
