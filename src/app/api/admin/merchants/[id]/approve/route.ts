import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendMerchantApprovedEmail } from "@/lib/email-p0";
import { approveMerchantTransition } from "@/lib/roles";
import { emitRoleUpdate } from "@/lib/role-change-notify";

// PUT/POST - Approve merchant application (admin only)
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    return PUT(request, context);
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;

        const merchant = await prisma.merchant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                approvalStatus: true,
                ownerId: true,
                owner: { select: { id: true, name: true, email: true } },
            },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        if (merchant.approvalStatus === "APPROVED") {
            return NextResponse.json({ error: "El comercio ya está aprobado" }, { status: 409 });
        }

        // Transición centralizada: escribe approvalStatus, flags legacy y audit log.
        // Ya no tocamos UserRole acá porque el rol COMERCIO se deriva de Merchant.approvalStatus
        // en cada request. Ver src/lib/roles.ts.
        try {
            await approveMerchantTransition(id, {
                adminId: session.user.id,
                adminEmail: session.user.email ?? "unknown",
            });
        } catch (e: any) {
            // Errores de pre-condición (ej: LOGO_MISSING) → 400 con mensaje claro al admin.
            if (e?.code === "LOGO_MISSING") {
                return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
            }
            throw e;
        }

        // Send approval email (non-blocking). Usa la versión oficial del registry
        // (src/lib/email-p0.ts) para que lo que el admin edita en /ops/emails
        // sea lo que realmente recibe el merchant.
        if (merchant.owner?.email) {
            sendMerchantApprovedEmail({
                email: merchant.owner.email,
                businessName: merchant.name,
                contactName: merchant.owner.name || "",
            });
        }

        // Avisar al cliente del merchant para que refresque su JWT sin tener
        // que hacer logout/login. El frontend escucha `roles_updated` y dispara
        // session.update({ refreshRoles: true }) — ver useRoleUpdateListener.
        emitRoleUpdate({
            userId: merchant.ownerId,
            role: "MERCHANT",
            action: "APPROVED",
            message: `¡Tu comercio "${merchant.name}" fue aprobado! Ya podés operar.`,
            portalUrl: "/comercios",
        });

        return NextResponse.json({
            success: true,
            merchant: { id: merchant.id, name: merchant.name, approvalStatus: "APPROVED" },
        });
    } catch (error) {
        console.error("Error approving merchant:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}