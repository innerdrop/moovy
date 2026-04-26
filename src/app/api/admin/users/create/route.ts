// API: admin OPS crea cuenta de buyer/driver/seller — magic link pattern.
//
// Diferente al endpoint /api/admin/merchants/create que pide password en el body
// (admin lo elige por el user — anti-pattern: el admin nunca debería conocer la
// contraseña ajena). Este endpoint:
//
//   1. Solo pide email + datos mínimos.
//   2. Crea User SIN password real (placeholder bcrypt-hash random no-usable).
//   3. Genera resetToken hasheado SHA-256 con expiry 24h (vs 1h de forgot-password
//      regular — el user nuevo necesita más tiempo para revisar el email).
//   4. Envía email "Bienvenido — configurá tu contraseña" con link a
//      /restablecer-contrasena?token=plaintext (reusa el flujo de reset existente).
//   5. Para DRIVER/SELLER crea entidad asociada con userId — el resto de campos
//      (vehicleType, displayName, cuit, etc.) son opcionales en schema y quedan
//      pending de completar por el user al loguearse.
//   6. Anti-resurrección: si existe User con deletedAt > now → 410 (mismo patrón
//      que auth/register, regla del 2026-04-21).
//   7. Audit log USER_CREATED_BY_ADMIN con detalles del tipo y entidad creada.
//
// El user, al loguearse por primera vez con la contraseña que setea, llega al
// portal correspondiente (buyer → home, driver → /repartidor, seller → /vendedor)
// donde puede completar su perfil.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// 24h = bastante tiempo para que el user revise el email.
// Si pasa de 24h sin setear password, el admin re-genera el invite (futuro).
const WELCOME_TOKEN_EXPIRY_HOURS = 24;

// Discriminated union — el body cambia según el type.
const createUserSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("BUYER"),
        email: z.string().email("Email inválido").max(254),
        name: z.string().min(2, "Nombre mínimo 2 caracteres").max(80),
        phone: z.string().max(30).optional().nullable(),
    }),
    z.object({
        type: z.literal("DRIVER"),
        email: z.string().email("Email inválido").max(254),
        name: z.string().min(2, "Nombre mínimo 2 caracteres").max(80),
        phone: z.string().max(30).optional().nullable(),
        // Vehicle type opcional al crear — driver lo completa después.
        vehicleType: z.enum([
            "MOTO", "AUTO", "BICI", "BICICLETA", "PATIN", "PATINETA",
            "CAMIONETA", "PICKUP", "SUV", "FLETE",
        ]).optional().nullable(),
    }),
    z.object({
        type: z.literal("SELLER"),
        email: z.string().email("Email inválido").max(254),
        name: z.string().min(2, "Nombre mínimo 2 caracteres").max(80),
        phone: z.string().max(30).optional().nullable(),
        // displayName opcional al crear — seller lo completa después.
        displayName: z.string().min(2).max(80).optional().nullable(),
    }),
]);

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = createUserSchema.safeParse(body);

        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return NextResponse.json(
                { error: firstIssue?.message || "Body inválido" },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const emailLower = data.email.toLowerCase().trim();

        // Anti-resurrección + duplicados
        const existingUser = await prisma.user.findUnique({
            where: { email: emailLower },
            select: { id: true, deletedAt: true },
        });

        if (existingUser?.deletedAt) {
            return NextResponse.json(
                {
                    error: "Esta cuenta fue eliminada. Si creés que fue un error, escribinos a soporte.",
                },
                { status: 410 }
            );
        }

        if (existingUser) {
            return NextResponse.json(
                { error: "Ya existe una cuenta con ese email" },
                { status: 409 }
            );
        }

        // Generar token plaintext (al email) + hash SHA-256 (a DB) — defense in depth
        // mismo patrón que /api/auth/forgot-password (regla del 2026-04-21).
        const tokenPlaintext = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto
            .createHash("sha256")
            .update(tokenPlaintext)
            .digest("hex");
        const tokenExpiry = new Date(
            Date.now() + WELCOME_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
        );

        // Placeholder password — random bcrypt hash que NO matchea ninguna entrada
        // razonable. El user va a setear su contraseña real con el link del email.
        // Aún si alguien obtiene el placeholder hash, no puede revertirlo a plaintext
        // (bcrypt es one-way + el random es 32 bytes).
        const placeholderPassword = await bcrypt.hash(
            crypto.randomBytes(32).toString("hex"),
            10
        );

        // Crear User + entidad asociada en una sola transacción
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: emailLower,
                    password: placeholderPassword,
                    name: data.name,
                    firstName: data.name.split(" ")[0] || data.name,
                    lastName: data.name.split(" ").slice(1).join(" ") || "",
                    phone: data.phone || null,
                    role: "USER",
                    resetToken: tokenHash,
                    resetTokenExpiry: tokenExpiry,
                },
                select: { id: true, email: true, name: true },
            });

            let entityId: string | null = null;

            if (data.type === "DRIVER") {
                const driver = await tx.driver.create({
                    data: {
                        userId: newUser.id,
                        vehicleType: data.vehicleType || null,
                        // Approval status PENDING por default (schema) — admin
                        // o auto-activación lo aprueba después cuando el driver
                        // suba sus documentos.
                    },
                    select: { id: true },
                });
                entityId = driver.id;
            } else if (data.type === "SELLER") {
                const seller = await tx.sellerProfile.create({
                    data: {
                        userId: newUser.id,
                        displayName: data.displayName || data.name,
                        // isActive: false por default — seller completa su perfil
                        // y se activa después.
                    },
                    select: { id: true },
                });
                entityId = seller.id;
            }
            // BUYER → solo el User, sin entidad asociada.

            return { user: newUser, entityId };
        });

        // Audit log
        try {
            auditLog({
                timestamp: new Date().toISOString(),
                userId: session.user?.id,
                action: "USER_CREATED_BY_ADMIN",
                resource: "User",
                resourceId: result.user.id,
                details: {
                    createdByAdmin: session.user?.email,
                    targetEmail: result.user.email,
                    targetName: result.user.name,
                    accountType: data.type,
                    entityId: result.entityId,
                    tokenExpiresAt: tokenExpiry.toISOString(),
                },
            });
        } catch (err) {
            console.error("[admin/users/create] Audit log failed:", err);
        }

        // Enviar email — fire-and-forget (no bloquea la response).
        // Si falla, queda en logs y el admin puede re-disparar manualmente.
        try {
            const baseUrl = process.env.NEXTAUTH_URL || "https://somosmoovy.com";
            const setupLink = `${baseUrl}/restablecer-contrasena?token=${tokenPlaintext}`;
            const { sendAccountCreatedByAdminEmail } = await import("@/lib/email-admin-ops");
            sendAccountCreatedByAdminEmail({
                email: result.user.email,
                name: result.user.name,
                accountType: data.type,
                setupLink,
                expiresAt: tokenExpiry,
            }).catch((err) => {
                console.error("[admin/users/create] sendAccountCreatedByAdminEmail failed:", err);
            });
        } catch (err) {
            console.error("[admin/users/create] Failed to import welcome email:", err);
        }

        return NextResponse.json({
            success: true,
            user: result.user,
            accountType: data.type,
            message: `Cuenta creada. Le mandamos un email a ${result.user.email} para que configure su contraseña.`,
        });
    } catch (error: any) {
        console.error("[admin/users/create] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Error al crear la cuenta" },
            { status: 500 }
        );
    }
}
