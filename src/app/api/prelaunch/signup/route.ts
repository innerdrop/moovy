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
import { sendTelegramNotification } from "@/lib/telegram";
import { sendPrelaunchLeadEmail } from "@/lib/email-prelaunch";

const SignupSchema = z.object({
    role: z.enum(["COMERCIO", "DRIVER", "CLIENTE"]),
    email: z.string().email("Ingresá un email válido").max(120),
    whatsapp: z.string().max(30).optional().nullable(),
    name: z.string().max(80).optional().nullable(),
    rubro: z.string().max(60).optional().nullable(),
    businessName: z.string().max(120).optional().nullable(),
    // Preguntas opcionales del lead repartidor (paso 2, post-envío de datos)
    vehicle: z.enum(["BICI", "MOTO", "AUTO", "FLETE"]).optional().nullable(),
    worksOtherApp: z.boolean().optional().nullable(),
    earningsRange: z
        .enum(["Menos de $2.000", "$2.000 a $3.500", "$3.500 a $5.000", "Más de $5.000", "Prefiero no decirlo"])
        .optional()
        .nullable(),
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
    const vehicle = parsed.data.vehicle ?? null;
    const worksOtherApp = parsed.data.worksOtherApp ?? null;
    const earningsRange = parsed.data.earningsRange ?? null;

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) || null;
    const now = new Date();

    try {
        // ¿El lead ya existía? (el paso 2 del repartidor y las re-anotaciones
        // re-postean al mismo endpoint: email de bienvenida solo al ALTA; a
        // Telegram va el alta, y las re-anotaciones SOLO si algo cambió)
        const existing = await prisma.preLaunchLead.findUnique({
            where: { email_role: { email, role } },
            select: { id: true, name: true, whatsapp: true, rubro: true, businessName: true, vehicle: true, worksOtherApp: true, earningsRange: true },
        });

        await prisma.preLaunchLead.upsert({
            where: { email_role: { email, role } },
            create: {
                role,
                email,
                whatsapp,
                name,
                rubro,
                businessName,
                vehicle,
                worksOtherApp,
                earningsRange,
                consent: true,
                consentAt: now,
                ipAddress,
                userAgent,
                source: "landing",
            },
            update: {
                // Si se reanota (o manda el paso 2 de preguntas), actualizamos lo
                // que venga y refrescamos consentimiento.
                whatsapp: whatsapp ?? undefined,
                name: name ?? undefined,
                rubro: rubro ?? undefined,
                businessName: businessName ?? undefined,
                vehicle: vehicle ?? undefined,
                worksOtherApp: worksOtherApp ?? undefined,
                earningsRange: earningsRange ?? undefined,
                consent: true,
                consentAt: now,
            },
        });

        // Avisos fire-and-forget (regla #32): si Telegram o el email fallan, el
        // lead ya quedó guardado y la respuesta no cambia.
        //   - Lead NUEVO → Telegram + email de bienvenida.
        //   - Re-anotación → SOLO Telegram y SOLO si algo cambió (sin cambios =
        //     silencio; email nunca se re-envía). El paso 2 del repartidor entra
        //     acá: llega un aviso con las respuestas de las preguntas.
        const ROLE_EMOJI: Record<string, string> = { COMERCIO: "🏪", DRIVER: "🛵", CLIENTE: "🛍️" };
        const ROLE_LABEL: Record<string, string> = { COMERCIO: "COMERCIO", DRIVER: "REPARTIDOR", CLIENTE: "CLIENTE" };

        if (!existing) {
            void (async () => {
                try {
                    const total = await prisma.preLaunchLead.count({ where: { role } });
                    const lines = [
                        `${ROLE_EMOJI[role]} Nuevo lead ${ROLE_LABEL[role]} (#${total})`,
                        businessName ? `Negocio: ${businessName}${rubro ? ` (${rubro})` : ""}` : rubro ? `Rubro: ${rubro}` : null,
                        name ? `Nombre: ${name}` : null,
                        whatsapp ? `WhatsApp: ${whatsapp}` : null,
                        `Email: ${email}`,
                    ].filter(Boolean);
                    await sendTelegramNotification(lines.join("\n"));
                } catch (e) {
                    console.error("[prelaunch/signup] telegram error:", e);
                }
                try {
                    await sendPrelaunchLeadEmail(role, email, { name, businessName });
                } catch (e) {
                    console.error("[prelaunch/signup] email error:", e);
                }
            })();
        } else {
            // Diff de lo que vino vs lo guardado: solo campos enviados que cambiaron.
            const fmtBool = (v: boolean | null) => (v == null ? null : v ? "Sí" : "No");
            const cambios: string[] = [];
            const diff = (label: string, nuevo: string | null, viejo: string | null) => {
                if (nuevo != null && nuevo !== viejo) cambios.push(`${label}: ${viejo || "—"} → ${nuevo}`);
            };
            diff("Nombre", name, existing.name);
            diff("WhatsApp", whatsapp, existing.whatsapp);
            diff("Negocio", businessName, existing.businessName);
            diff("Rubro", rubro, existing.rubro);
            diff("Vehículo", vehicle, existing.vehicle);
            diff("Reparte en otra app", fmtBool(worksOtherApp), fmtBool(existing.worksOtherApp));
            diff("Gana por viaje", earningsRange, existing.earningsRange);

            if (cambios.length > 0) {
                void sendTelegramNotification(
                    [`🔄 Lead ${ROLE_LABEL[role]} se anotó de nuevo y actualizó datos`, `Email: ${email}`, ...cambios].join("\n")
                ).catch((e) => console.error("[prelaunch/signup] telegram error:", e));
            }
        }

        // `existing` le permite a la UI avisar "ya estabas anotado" (los datos
        // se actualizan igual; avisos/email solo salieron en el alta original).
        return NextResponse.json({ success: true, existing: Boolean(existing) });
    } catch (e) {
        console.error("[prelaunch/signup] error:", e);
        return NextResponse.json({ error: "No pudimos guardar tus datos. Probá de nuevo." }, { status: 500 });
    }
}
