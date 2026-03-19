// Hero Config API — GET (public) and PUT (admin only)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";

// Default hero configuration
const DEFAULTS: Record<string, string> = {
    hero_title: "Todo Ushuaia en\ntu puerta.",
    hero_subtitle: "Pedidos de comercios locales en minutos",
    hero_bg_color: "#e60012",
    hero_bg_gradient: "linear-gradient(135deg, #a3000c 0%, #cc000f 25%, #e60012 50%, #ff1a2e 75%, #ff4d5e 100%)",
    hero_bg_image: "",
    hero_cta_text: "",
    hero_cta_link: "",
    hero_search_enabled: "true",
    hero_search_placeholder: "¿Qué querés pedir?",
    hero_person_image: "/hero-person.png",
    hero_person_enabled: "true",
    hero_stats_enabled: "true",
};

const HERO_KEYS = Object.keys(DEFAULTS);

// GET — public, returns all hero config values
export async function GET() {
    try {
        const configs = await prisma.moovyConfig.findMany({
            where: { key: { in: HERO_KEYS } },
        });

        const result: Record<string, string> = { ...DEFAULTS };
        for (const c of configs) {
            result[c.key] = c.value;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching hero config:", error);
        return NextResponse.json(DEFAULTS);
    }
}

// PUT — admin only, upserts hero config values
export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const updates: { key: string; value: string }[] = [];

        for (const key of HERO_KEYS) {
            if (key in body && typeof body[key] === "string") {
                updates.push({ key, value: body[key] });
            }
        }

        // Upsert each key
        await Promise.all(
            updates.map((u) =>
                prisma.moovyConfig.upsert({
                    where: { key: u.key },
                    create: { key: u.key, value: u.value, description: `Hero config: ${u.key}` },
                    update: { value: u.value },
                })
            )
        );

        return NextResponse.json({ success: true, updated: updates.length });
    } catch (error) {
        console.error("Error updating hero config:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
