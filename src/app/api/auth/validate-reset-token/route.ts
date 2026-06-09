import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

        // ISSUE-027: el token viaja plano por email pero en la DB se guarda
        // hasheado (sha256). Hay que hashear el token entrante ANTES de buscar,
        // igual que hace /reset-password. (Bug s2-2a-04: este endpoint comparaba
        // el token plano contra el hash guardado -> nunca matcheaba -> siempre
        // "Enlace invalido".)
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
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
