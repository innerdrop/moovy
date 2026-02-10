// API Route: Generate a short-lived token for Socket.IO authentication
// This token is separate from the main session JWT to keep socket connections lightweight

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const SOCKET_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

/**
 * Generate a signed token for Socket.IO connections
 * Token format: base64(JSON({ userId, role, exp })) + "." + HMAC signature
 * Expires in 1 hour (short-lived for security)
 */
function generateSocketToken(userId: string, role: string): string {
    const payload = {
        userId,
        role,
        exp: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", SOCKET_SECRET)
        .update(payloadBase64)
        .digest("base64url");

    return `${payloadBase64}.${signature}`;
}

/**
 * Verify a socket token and return the payload
 */
export function verifySocketToken(token: string): { userId: string; role: string } | null {
    try {
        const [payloadBase64, signature] = token.split(".");
        if (!payloadBase64 || !signature) return null;

        // Verify signature
        const expectedSignature = crypto
            .createHmac("sha256", SOCKET_SECRET)
            .update(payloadBase64)
            .digest("base64url");

        if (signature !== expectedSignature) return null;

        // Decode payload
        const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());

        // Check expiration
        if (payload.exp < Date.now()) return null;

        return { userId: payload.userId, role: payload.role };
    } catch {
        return null;
    }
}

// GET /api/auth/socket-token — Get a token for the current authenticated user
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const token = generateSocketToken(
            session.user.id,
            (session.user as any).role || "USER"
        );

        return NextResponse.json({ token });
    } catch (error) {
        console.error("[SocketToken] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
