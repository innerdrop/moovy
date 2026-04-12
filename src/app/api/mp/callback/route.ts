// API Route: MercadoPago OAuth callback — exchanges code for tokens
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeOAuthCode, verifyOAuthState } from "@/lib/mercadopago";

export async function GET(request: NextRequest) {
    try {
        const code = request.nextUrl.searchParams.get("code");
        const state = request.nextUrl.searchParams.get("state");

        if (!code || !state) {
            return redirectWithError("merchant", "Parámetros inválidos");
        }

        // Verify state HMAC
        const stateData = verifyOAuthState(state);
        if (!stateData || !stateData.type || !stateData.userId) {
            return redirectWithError("merchant", "Estado de OAuth inválido");
        }

        const { type, userId } = stateData;

        // Check timestamp (max 10 minutes)
        const ts = Number(stateData.ts);
        if (Date.now() - ts > 10 * 60 * 1000) {
            return redirectWithError(type, "El enlace de vinculación expiró");
        }

        // Exchange code for tokens
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || "https://somosmoovy.com";
        const redirectUri = `${baseUrl}/api/mp/callback`;

        const tokens = await exchangeOAuthCode(code, redirectUri);

        // Get email from MP user API
        let mpEmail: string | null = null;
        try {
            const userRes = await fetch("https://api.mercadopago.com/users/me", {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                mpEmail = userData.email || null;
            }
        } catch {
            // Non-critical, continue without email
        }

        const mpData = {
            mpAccessToken: tokens.access_token,
            mpRefreshToken: tokens.refresh_token,
            mpUserId: String(tokens.user_id),
            mpEmail,
            mpLinkedAt: new Date(),
        };

        // Save tokens in the appropriate model
        if (type === "merchant") {
            const merchant = await prisma.merchant.findFirst({ where: { ownerId: userId } });
            if (!merchant) {
                return redirectWithError(type, "Comercio no encontrado");
            }

            await prisma.merchant.update({
                where: { id: merchant.id },
                data: mpData,
            });

            return NextResponse.redirect(`${baseUrl}/comercios/configuracion?mp=connected`);
        } else if (type === "seller") {
            const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
            if (!seller) {
                return redirectWithError(type, "Perfil de vendedor no encontrado");
            }

            await prisma.sellerProfile.update({
                where: { userId },
                data: mpData,
            });

            return NextResponse.redirect(`${baseUrl}/vendedor/configuracion?mp=connected`);
        }

        return redirectWithError("merchant", "Tipo inválido");
    } catch (error) {
        console.error("[MP-OAuth] Callback error:", error);
        return redirectWithError("merchant", "Error al procesar vinculación");
    }
}

function redirectWithError(type: string, error: string) {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || "https://somosmoovy.com";
    const path = type === "seller" ? "/vendedor/configuracion" : "/comercios/configuracion";
    return NextResponse.redirect(`${baseUrl}${path}?mp=error&message=${encodeURIComponent(error)}`);
}
