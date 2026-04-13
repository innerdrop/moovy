// Diagnóstico de login: simula lo que hace authorize() y muestra config NextAuth
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function testLogin() {
    const email = (process.argv[2] || process.env.ADMIN_RESET_EMAIL || "").toLowerCase().trim();
    const password = process.argv[3] || process.env.ADMIN_PASSWORD || "";

    console.log("🔍 TEST DE LOGIN");
    console.log("════════════════════════════════════");
    console.log("Email:", email);
    console.log("Password:", `"${password}" (${password.length} chars)`);
    console.log("");

    // 1. Buscar usuario exactamente como auth.ts (lowercase)
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            deletedAt: true,
            isSuspended: true,
        },
    });

    if (!user) {
        console.log("❌ PASO 1: No existe usuario con email:", email);
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, role: true },
        });
        console.log("\n📋 Admins en DB:", admins.length);
        admins.forEach((a) => console.log(`   - ${a.email}`));
        await prisma.$disconnect();
        return;
    }
    console.log("✅ PASO 1: Usuario encontrado:", user.email, "role:", user.role);

    if (user.deletedAt) {
        console.log("❌ PASO 2: Usuario ELIMINADO en", user.deletedAt);
        await prisma.$disconnect();
        return;
    }
    console.log("✅ PASO 2: No está eliminado");

    if (user.isSuspended) {
        console.log("⚠️  PASO 2b: Usuario SUSPENDIDO");
    } else {
        console.log("✅ PASO 2b: No está suspendido");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        console.log("❌ PASO 3: Password NO coincide");
        await prisma.$disconnect();
        return;
    }
    console.log("✅ PASO 3: Password coincide");

    // 4. Variables de NextAuth
    console.log("\n🔍 PASO 4: Variables de NextAuth:");
    console.log("   AUTH_SECRET:", process.env.AUTH_SECRET ? `SET (${process.env.AUTH_SECRET.length} chars)` : "❌ NO DEFINIDO");
    console.log("   NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? `SET (${process.env.NEXTAUTH_SECRET.length} chars)` : "❌ NO DEFINIDO");
    console.log("   NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "❌ NO DEFINIDO");
    console.log("   NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "❌ NO DEFINIDO");
    console.log("   AUTH_URL:", process.env.AUTH_URL || "❌ NO DEFINIDO");
    console.log("   AUTH_TRUST_HOST:", process.env.AUTH_TRUST_HOST || "❌ NO DEFINIDO");
    console.log("   NODE_ENV:", process.env.NODE_ENV || "❌ NO DEFINIDO");

    console.log("\n════════════════════════════════════");
    if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
        console.log("🚨 PROBLEMA: Ni AUTH_SECRET ni NEXTAUTH_SECRET están definidos. NextAuth no puede firmar cookies.");
    } else if (!process.env.AUTH_TRUST_HOST && !process.env.NEXTAUTH_URL) {
        console.log("🚨 PROBLEMA: Falta AUTH_TRUST_HOST=true o NEXTAUTH_URL. NextAuth no confía en el host en producción.");
    } else {
        console.log("✅ Config parece correcta. Si sigue fallando, revisar que PM2 tenga las mismas env vars.");
    }

    await prisma.$disconnect();
}

testLogin().catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
});
