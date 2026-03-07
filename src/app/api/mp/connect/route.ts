// API Route: Initiate MercadoPago OAuth for vendor linking
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOAuthAuthorizeUrl, signOAuthState } from "@/lib/mercadopago";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const type = request.nextUrl.searchParams.get("type");
        if (type !== "merchant" && type !== "seller") {
            return NextResponse.json({ error: "Tipo inválido. Usar ?type=merchant o ?type=seller" }, { status: 400 });
        }

        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        const redirectUri = `${baseUrl}/api/mp/callback`;

        // Sign state to prevent CSRF
        const state = signOAuthState({
            type,
            userId: session.user.id,
            ts: String(Date.now()),
        });

        const authorizeUrl = getOAuthAuthorizeUrl(state, redirectUri);

        return NextResponse.redirect(authorizeUrl);
    } catch (error) {
        console.error("[MP-OAuth] Error initiating connect:", error);
        return NextResponse.json({ error: "Error al iniciar vinculación" }, { status: 500 });
    }
}
