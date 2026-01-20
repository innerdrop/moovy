import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const cookies = req.cookies.getAll();
    const headers: Record<string, string> = {};

    req.headers.forEach((value, key) => {
        headers[key] = value;
    });

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        cookies: cookies.map(c => ({ name: c.name, valuePreview: c.value.substring(0, 20) + '...' })),
        host: headers['host'],
        origin: headers['origin'],
        referer: headers['referer'],
        nodeEnv: process.env.NODE_ENV,
        hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    });
}
