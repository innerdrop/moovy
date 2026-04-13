// Script to create/reset OPS admin user
// Usage: npx tsx scripts/create-admin.ts [email]
// If email is passed as argument, it overrides .env
// Reads OPS_LOGIN_EMAIL (login) + OPS_LOGIN_PASSWORD from .env
// Also supports legacy ADMIN_RESET_EMAIL / ADMIN_PASSWORD as fallback
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const emailArg = process.argv[2]
    || process.env.OPS_LOGIN_EMAIL
    || process.env.ADMIN_RESET_EMAIL
    || process.env.ADMIN_EMAIL;
const passArg = process.env.OPS_LOGIN_PASSWORD
    || process.env.ADMIN_PASSWORD;

if (!emailArg || !passArg) {
    console.log("❌ Falta email y/o password.");
    console.log("   Opciones:");
    console.log("   1. npx tsx scripts/create-admin.ts tu@email.com  (lee password del .env)");
    console.log("   2. Seteá OPS_LOGIN_EMAIL y OPS_LOGIN_PASSWORD en el .env");
    process.exit(1);
}

const email: string = emailArg;
const pass: string = passArg;

console.log(`🔧 Creando/actualizando admin OPS con email: ${email}`);

const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash(pass, 12);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: "ADMIN",
                password: hashedPassword,
                deletedAt: null,
                isSuspended: false,
            },
            create: {
                email,
                name: "Admin MOOVY",
                password: hashedPassword,
                role: "ADMIN",
                pointsBalance: 0,
            },
        });
        console.log("✅ Admin OPS creado:", user.email, "- Rol:", user.role);
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
