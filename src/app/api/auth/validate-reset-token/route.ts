import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Token requerido" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Token inválido o expirado" },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error("Token validation error:", error);
        return NextResponse.json(
            { error: "Error al validar token" },
            { status: 500 }
        );
    }
}
