// Script to create/reset admin user
// Usage: npx tsx scripts/create-admin.ts [email]
// If email is passed as argument, it overrides .env
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Priority: CLI argument > ADMIN_RESET_EMAIL > ADMIN_EMAIL
const emailArg = process.argv[2] || process.env.ADMIN_RESET_EMAIL || process.env.ADMIN_EMAIL;
const passArg = process.env.ADMIN_PASSWORD;

if (!emailArg || !passArg) {
    console.log("❌ Falta email (pasalo como argumento o seteá ADMIN_RESET_EMAIL en .env) y/o ADMIN_PASSWORD en el .env");
    process.exit(1);
}

const email: string = emailArg;
const pass: string = passArg;

console.log(`🔧 Creando/actualizando admin con email: ${email}`);

const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash(pass, 12);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: "ADMIN",
                password: hashedPassword,
            },
            create: {
                email,
                name: "Admin MOOVY",
                password: hashedPassword,
                role: "ADMIN",
                pointsBalance: 0,
            },
        });
        console.log("✅ Admin creado:", user.email, "- Rol:", user.role);
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();