import { auth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        const token = await getToken({ req, secret });

        return Response.json({
            timestamp: new Date().toISOString(),
            hasSession: !!session,
            sessionUser: session?.user?.email || null,
            sessionRole: (session?.user as any)?.role || null,
            hasToken: !!token,
            tokenRole: token?.role || null,
            tokenEmail: token?.email || null,
            hasCookie: req.headers.get('cookie')?.includes('next-auth') || false,
            secretConfigured: !!secret,
        });
    } catch (error) {
        return Response.json({
            error: (error as Error).message,
            stack: (error as Error).stack
        }, { status: 500 });
    }
}
