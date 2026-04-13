/**
 * Reset Admin Password
 *
 * Lee OPS_LOGIN_EMAIL y OPS_LOGIN_PASSWORD del .env y actualiza la contraseña
 * del admin en la base de datos. También limpia deletedAt y isSuspended.
 *
 * Uso:
 *   npx tsx scripts/reset-admin.ts
 *
 * Requisito: tener OPS_LOGIN_EMAIL y OPS_LOGIN_PASSWORD en el .env
 * (también acepta legacy ADMIN_RESET_EMAIL / ADMIN_PASSWORD como fallback)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const OPS_EMAIL = process.env.OPS_LOGIN_EMAIL
    || process.env.ADMIN_RESET_EMAIL
    || process.env.ADMIN_EMAIL;
const OPS_PASSWORD = process.env.OPS_LOGIN_PASSWORD
    || process.env.ADMIN_PASSWORD;

async function main() {
    console.log("\n🔐 MOOVY — Reset Admin Password");
    console.log("================================\n");

    if (!OPS_EMAIL) {
        console.error("❌ Falta OPS_LOGIN_EMAIL en el .env");
        process.exit(1);
    }

    if (!OPS_PASSWORD) {
        console.error("❌ Falta OPS_LOGIN_PASSWORD en el .env");
        process.exit(1);
    }

    if (OPS_PASSWORD.length < 8) {
        console.error("❌ La contraseña debe tener al menos 8 caracteres");
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        const user = await prisma.user.findUnique({
            where: { email: OPS_EMAIL },
            select: { id: true, email: true, name: true, role: true },
        });

        if (!user) {
            console.error(`❌ No existe un usuario con email: ${OPS_EMAIL}`);
            console.error("   Usá 'npx tsx scripts/create-admin.ts' para crearlo primero");
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(OPS_PASSWORD, 12);

        const wasAdmin = user.role === "ADMIN";
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                role: "ADMIN",
                deletedAt: null,
                isSuspended: false,
            },
        });

        console.log(`✅ Contraseña actualizada para: ${user.email} (${user.name || "sin nombre"})`);
        if (!wasAdmin) {
            console.log(`   ⬆️  Rol cambiado de ${user.role} → ADMIN`);
        }
        console.log("   Podés loguearte en /ops/login con la nueva clave.\n");
    } catch (error: any) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
