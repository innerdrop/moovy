// API publica: lista de feature flags (con o sin filtro de scope).
//
// feat/feature-flags-ops (2026-05-13): endpoint que sirve el hook
// useFeatureFlag (client) y cualquier consumer del lado cliente que
// necesite saber que flags estan ON. Como los flags pueden cambiar el
// menu/UX visible al usuario (ej: ocultar item del menu), tiene que ser
// accesible desde client components.
//
// Por que publico sin auth: los flags determinan visibilidad de features
// publicas (que ve un buyer / merchant / seller / driver) y no contienen
// info sensible. El comportamiento del flag es publico igual — si miras
// el HTML renderizado, ya ves que features estan ON.
//
// Devuelve solo { key, isActive } por flag. NO devolvemos label, description
// ni lastToggledBy — eso es solo para OPS (ver /api/admin/features).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_SCOPES = new Set(["MERCHANT", "SELLER", "BUYER", "GLOBAL"]);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const scopeParam = searchParams.get("scope");

        const where: { scope?: string } = {};
        if (scopeParam) {
            const scope = scopeParam.toUpperCase();
            if (!VALID_SCOPES.has(scope)) {
                return NextResponse.json(
                    { error: "scope debe ser MERCHANT | SELLER | BUYER | GLOBAL" },
                    { status: 400 }
                );
            }
            where.scope = scope;
        }

        const flags = await prisma.featureFlag.findMany({
            where,
            select: { key: true, isActive: true },
        });

        // Devolvemos como objeto keyed por flag.key para que el cliente lo
        // consuma directo como flags["merchant.publicidad"].
        const flagsMap: Record<string, boolean> = {};
        for (const f of flags) {
            flagsMap[f.key] = f.isActive;
        }

        return NextResponse.json({ flags: flagsMap });
    } catch (error: any) {
        console.error("[features/list] Error:", error);
        // Si falla, devolvemos vacio en vez de 500. El frontend cae en defaults
        // (false) para todos los flags, lo que esconde features incompletas.
        return NextResponse.json({ flags: {} });
    }
}
