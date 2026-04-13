// Diagnóstico: verifica si el admin existe y si la contraseña matchea
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function check() {
    const email = process.argv[2] || process.env.ADMIN_RESET_EMAIL || process.env.ADMIN_EMAIL;
    const pass = process.env.ADMIN_PASSWORD;

    console.log("🔍 Buscando admin...");
    console.log("   Email buscado:", email);
    console.log("   ADMIN_PASSWORD en .env:", pass ? `"${pass}" (${pass.length} chars)` : "❌ NO DEFINIDO");
    console.log("   ADMIN_RESET_EMAIL:", process.env.ADMIN_RESET_EMAIL || "NO DEFINIDO");
    console.log("   ADMIN_EMAIL:", process.env.ADMIN_EMAIL || "NO DEFINIDO");

    const user = await prisma.user.findUnique({
        where: { email: email || "" },
        select: { id: true, email: true, name: true, role: true, password: true },
    });

    if (!user) {
        console.log("\n❌ No existe usuario con ese email en la DB");
        // Buscar todos los admins
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, name: true, role: true },
        });
        console.log("\n📋 Admins existentes en la DB:", admins.length);
        admins.forEach((a) => console.log(`   - ${a.email} (${a.name}) role=${a.role}`));
    } else {
        console.log("\n✅ Usuario encontrado:");
        console.log("   ID:", user.id);
        console.log("   Email:", user.email);
        console.log("   Nombre:", user.name);
        console.log("   Role:", user.role);
        console.log("   Tiene password:", !!user.password);

        if (pass && user.password) {
            const match = await bcrypt.compare(pass, user.password);
            console.log("   Password matchea:", match ? "✅ SÍ" : "❌ NO");
        }
    }

    await prisma.$disconnect();
}

check().catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
});