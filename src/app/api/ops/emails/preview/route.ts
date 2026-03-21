import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { getEmailById, EMAIL_REGISTRY } from "@/lib/email-registry";

/**
 * GET /api/ops/emails/preview?id=welcome
 * Retorna el HTML de preview de un email específico.
 *
 * GET /api/ops/emails/preview (sin id)
 * Retorna la lista completa del registro de emails (metadata sin HTML).
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const emailId = req.nextUrl.searchParams.get("id");

    // Si no hay id, devolver lista de emails
    if (!emailId) {
        const registry = EMAIL_REGISTRY.map(({ generatePreview, ...rest }) => rest);
        return NextResponse.json({ emails: registry });
    }

    // Si hay id, devolver HTML de preview
    const entry = getEmailById(emailId);
    if (!entry) {
        return NextResponse.json({ error: "Email no encontrado" }, { status: 404 });
    }

    try {
        const html = entry.generatePreview();
        return NextResponse.json({
            id: entry.id,
            name: entry.name,
            subject: entry.subject,
            category: entry.category,
            recipient: entry.recipient,
            priority: entry.priority,
            status: entry.status,
            trigger: entry.trigger,
            functionName: entry.functionName,
            file: entry.file,
            html,
        });
    } catch (error) {
        console.error(`[Email Preview] Error generating preview for ${emailId}:`, error);
        return NextResponse.json({ error: "Error generando preview" }, { status: 500 });
    }
}
