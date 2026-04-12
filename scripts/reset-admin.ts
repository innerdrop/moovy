/**
 * Reset Admin Password
 *
 * Lee ADMIN_EMAIL y ADMIN_PASSWORD del .env y actualiza la contraseña
 * del admin en la base de datos.
 *
 * Uso:
 *   npx tsx scripts/reset-admin.ts
 *
 * Requisito: tener ADMIN_EMAIL y ADMIN_PASSWORD en el .env
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_RESET_EMAIL || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
    console.log("\n🔐 MOOVY — Reset Admin Password");
    console.log("================================\n");

    if (!ADMIN_EMAIL) {
        console.error("❌ Falta ADMIN_EMAIL en el .env");
        process.exit(1);
    }

    if (!ADMIN_PASSWORD) {
        console.error("❌ Falta ADMIN_PASSWORD en el .env");
        process.exit(1);
    }

    if (ADMIN_PASSWORD.length < 8) {
        console.error("❌ La contraseña debe tener al menos 8 caracteres");
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        // Buscar el usuario admin
        const user = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL },
            select: { id: true, email: true, name: true, role: true },
        });

        if (!user) {
            console.error(`❌ No existe un usuario con email: ${ADMIN_EMAIL}`);
            process.exit(1);
        }

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        // Actualizar contraseña + asegurar rol ADMIN
        const wasAdmin = user.role === "ADMIN";
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, role: "ADMIN" },
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
        process.exit(1)