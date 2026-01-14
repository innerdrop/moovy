// Script to create admin user
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash("Admin*2026", 12);

    try {
        const user = await prisma.user.upsert({
            where: { email: "somosmoovy@gmail.com" },
            update: {
                role: "ADMIN",
                password: hashedPassword,
            },
            create: {
                email: "somosmoovy@gmail.com",
                name: "Moovy Admin",
                password: hashedPassword,
                role: "ADMIN",
                pointsBalance: 0,
            },
        });
        console.log("✅ Admin creado:", user.email, "- Rol:", user.role);
    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
