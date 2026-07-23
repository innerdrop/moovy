// API pública: pre-registro de comercios/repartidores desde la cortina "Próximamente".
// Rama: feat/landing-cortina-preregistro
//
// Es PÚBLICO (la cortina está abierta aunque la tienda esté cerrada), así que:
//   - Rate limit por IP (anti-spam).
//   - Zod en todo el body.
//   - Honeypot anti-bot (campo "website" oculto: si viene con contenido = bot).
//   - Dedupe vía upsert (email+rol). Anotarse dos veces no rompe.
//   - Consentimiento explícito obligatorio + se registra IP/UA/fecha (AAIP / Ley 26.951).
// NO pide datos fiscales: solo contacto + rol + nombre opcional.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const SignupSchema = z.object({
    role: z.enum(["COMERCIO", "DRIVER", "CLIENTE"]),
    email: z.string().email("Ingresá un email válido").max(120),
    whatsapp: z.string().max(30).optional().nullable(),
    name: z.string().max(80).optional().nullable(),
    rubro: z.string().max(60).optional().nullable(),
    businessName: z.string().max(120).optional().nullable(),
    consent: z.boolean().refine((v) => v === true, {
        message: "Necesitamos tu OK para poder contactarte.",
    }),
    website: z.string().optional(), // honeypot (debe venir vacío)
});

export async function POST(request: NextRequest) {
    // Rate limit: 5 altas cada 10 minutos por IP.
    const limited = await applyRateLimit(request, "prelaunch:signup", 5, 10 * 60_000);
    if (limited) return limited;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || "Datos inválidos" },
            { status: 400 }
        );
    }

    // Honeypot: un bot completa el campo oculto → respondemos OK falso (sin guardar).
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
        return NextResponse.json({ success: true });
    }

    const role = parsed.data.role;
    const email = parsed.data.email.trim().toLowerCase();
    const whatsapp = parsed.data.whatsapp?.trim() || null;
    const name = parsed.data.name?.trim() || null;
    const rubro = parsed.data.rubro?.trim() || null;
    const businessName = parsed.data.businessName?.trim() || null;

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) || null;
    const now = new Date();

    try {
        await prisma.preLaunchLead.upsert({
            where: { email_role: { email, role } },
            create: {
                role,
                email,
                whatsapp,
                name,
                rubro,
                businessName,
                consent: true,
                consentAt: now,
                ipAddress,
                userAgent,
                source: "landing",
            },
            update: {
                // Si se reanota, actualizamos contacto y refrescamos consentimiento.
                whatsapp: whatsapp ?? undefined,
                name: name ?? undefined,
                rubro: rubro ?? undefined,
                businessName: businessName ?? undefined,
                consent: true,
                consentAt: now,
            },
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[prelaunch/signup] error:", e);
        return NextResponse.json({ error: "No pudimos guardar tus datos. Probá de nuevo." }, { status: 500 });
    }
}
