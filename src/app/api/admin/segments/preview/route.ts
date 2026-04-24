import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { SegmentFiltersSchema, previewSegment } from "@/lib/user-segments";
import logger from "@/lib/logger";

/**
 * POST /api/admin/segments/preview
 * Body: SegmentFilters (sin name/description — solo los filtros)
 * Responde: { count, sample }
 *
 * Uso: desde la UI del editor de segmentos, cada vez que el admin ajusta un
 * filtro, se llama a este endpoint para mostrar cuántos users matchean en vivo
 * antes de guardar el segmento formalmente.
 */
export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:segments-preview", 30, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = SegmentFiltersSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Filtros inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    try {
        const { count, sample } = await previewSegment(parsed.data, 10);
        return NextResponse.json({ ok: true, count, sample });
    } catch (error) {
        logger.error({ error }, "[admin/segments/preview POST] error");
        return NextResponse.json({ error: "Error ejecutando preview" }, { status: 500 });
    }
}
