// feat/login-google: alta / vinculación de usuarios que entran con Google.
//
// NextAuth corre con estrategia JWT + credenciales, SIN adapter de base de datos.
// Por eso, cuando alguien entra con Google, nosotros manejamos a mano el upsert
// del usuario en nuestra tabla User (el adapter no crea nada). Este helper es la
// ÚNICA fuente de esa lógica, para que un usuario de Google quede con los mismos
// campos que uno del registro por email (bono de bienvenida pendiente, código de
// referido MOV-XXXX, consentimiento registrado, email verificado).
//
// Reglas:
//  - Email soft-deleted → se rechaza (misma política que el registro: no resucitar).
//  - Email ya existente (cuenta por email) → se permite (vinculación por email
//    verificado por Google). El usuario podrá entrar con ambos métodos.
//  - Email nuevo → se crea la cuenta (password null; solo entra con Google).

import { prisma } from "@/lib/prisma";
import { generateReferralCode, isValidReferralCode } from "@/lib/referral";
import { TERMS_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/legal-versions";

export type GoogleUpsertResult =
    | { ok: true; created: boolean; userId: string }
    | { ok: false; reason: "deleted" | "no_email" };

/** Genera un referralCode MOV-XXXX que no colisione (reintenta unas pocas veces). */
async function generateUniqueReferralCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
        const code = generateReferralCode();
        const clash = await prisma.user.findUnique({
            where: { referralCode: code },
            select: { id: true },
        });
        if (!clash) return code;
    }
    // Último recurso: cuid único (el schema igual acepta cualquier string único).
    return generateReferralCode() + Date.now().toString(36).slice(-3).toUpperCase();
}

export async function upsertGoogleUser(params: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
    /** Código del referidor (leído de la cookie moovy_ref). Solo aplica a altas nuevas. */
    referredByCode?: string | null;
}): Promise<GoogleUpsertResult> {
    const email = (params.email || "").trim().toLowerCase();
    if (!email) return { ok: false, reason: "no_email" };

    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, deletedAt: true, image: true },
    });

    if (existing) {
        // Misma política que el registro: cuenta eliminada NO se resucita.
        if (existing.deletedAt) return { ok: false, reason: "deleted" };
        // Cuenta existente (por email o Google previo): vinculamos. Si no tenía
        // foto, aprovechamos la de Google.
        if (!existing.image && params.image) {
            await prisma.user
                .update({ where: { id: existing.id }, data: { image: params.image } })
                .catch(() => {});
        }
        return { ok: true, created: false, userId: existing.id };
    }

    // Usuario nuevo por Google.
    const cfg = await prisma.pointsConfig.findUnique({
        where: { id: "points_config" },
        select: { signupBonus: true },
    });
    const pendingBonus = cfg?.signupBonus ?? 2500;
    const newReferralCode = await generateUniqueReferralCode();

    // Atribución de referido (mismo criterio que el registro por email): si vino un
    // código válido y existe el referidor (y no es la misma persona), lo vinculamos.
    let referrerId: string | null = null;
    const invitedCode = (params.referredByCode || "").trim().toUpperCase();
    if (invitedCode && isValidReferralCode(invitedCode)) {
        const referrer = await prisma.user.findUnique({
            where: { referralCode: invitedCode },
            select: { id: true, email: true, deletedAt: true },
        });
        if (referrer && !referrer.deletedAt && referrer.email.toLowerCase() !== email) {
            referrerId = referrer.id;
        }
    }

    const name = (params.name || "").trim() || "Usuario Moovy";
    const nameParts = name.split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ");

    const now = new Date();
    const user = await prisma.user.create({
        data: {
            email,
            password: null, // solo entra con Google
            name,
            firstName,
            lastName,
            image: params.image || null,
            role: "USER",
            emailVerified: now, // Google ya verificó el email
            pointsBalance: 0,
            pendingBonusPoints: pendingBonus, // bienvenida pendiente hasta 1er pedido
            bonusActivated: false,
            referralCode: newReferralCode,
            referredById: referrerId,
            // Consentimiento: el usuario aceptó Términos + Privacidad + +18 al continuar
            // con Google (aviso legal visible junto al botón). Ley 25.326.
            termsConsentAt: now,
            termsConsentVersion: TERMS_VERSION,
            privacyConsentAt: now,
            privacyConsentVersion: PRIVACY_POLICY_VERSION,
            age18Confirmed: true,
            // Marketing NO se asume (Ley 26.951 exige opt-in explícito). Queda false;
            // el usuario lo activa desde su perfil si quiere.
            marketingConsent: false,
        },
        select: { id: true },
    });

    // Registro de referido PENDING — se paga en el primer pedido entregado, igual
    // que el flujo por email (mismos valores para no divergir).
    if (referrerId) {
        await prisma.referral
            .create({
                data: {
                    referrerId,
                    refereeId: user.id,
                    codeUsed: invitedCode,
                    referrerPoints: 500,
                    refereePoints: 250,
                    status: "PENDING",
                },
            })
            .catch((e) => console.error("[google-signin] referral create failed:", e));
    }

    return { ok: true, created: true, userId: user.id };
}
