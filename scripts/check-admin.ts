// Diagnóstico: verifica si el admin existe y si la contraseña matchea
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function check() {
    const email = process.argv[2]
        || process.env.OPS_LOGIN_EMAIL
        || process.env.ADMIN_RESET_EMAIL
        || process.env.ADMIN_EMAIL;
    const pass = process.env.OPS_LOGIN_PASSWORD
        || process.env.ADMIN_PASSWORD;

    console.log("🔍 Diagnóstico admin OPS...");
    console.log("   Email buscado:", email);
    console.log("   Password:", pass ? `"${pass}" (${pass.length} chars)` : "❌ NO DEFINIDO");
    console.log("   OPS_LOGIN_EMAIL:", process.env.OPS_LOGIN_EMAIL || "NO DEFINIDO");
    console.log("   OPS_LOGIN_PASSWORD:", process.env.OPS_LOGIN_PASSWORD ? "SET" : "NO DEFINIDO");
    console.log("   (legacy) ADMIN_RESET_EMAIL:", process.env.ADMIN_RESET_EMAIL || "NO DEFINIDO");
    console.log("   (legacy) ADMIN_EMAIL:", process.env.ADMIN_EMAIL || "NO DEFINIDO");

    const user = await prisma.user.findUnique({
        where: { email: email || "" },
        select: { id: true, email: true, name: true, role: true, password: true, deletedAt: true, isSuspended: true },
    });

    if (!user) {
        console.log("\n❌ No existe usuario con ese email en la DB");
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, name: true, role: true },
        });
        console.log("\n📋 Admins existentes:", admins.length);
        admins.forEach((a) => console.log(`   - ${a.email} (${a.name}) role=${a.role}`));
    } else {
        console.log("\n✅ Usuario encontrado:");
        console.log("   Email:", user.email);
        console.log("   Role:", user.role);
        console.log("   deletedAt:", user.deletedAt || "null (OK)");
        console.log("   isSuspended:", user.isSuspended);

        if (pass && user.password) {
            const match = await bcrypt.compare(pass, user.password);
            console.log("   Password matchea:", match ? "✅ SÍ" : "❌ NO");
        }

        if (user.deletedAt) {
            console.log("\n🚨 Usuario ELIMINADO — corré: npx tsx scripts/create-admin.ts");
        }
        if (user.isSuspended) {
            console.log("\n🚨 Usuario SUSPENDIDO — corré: npx tsx scripts/create-admin.ts");
        }
    }

    await prisma.$disconnect();
}

check().catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
});
