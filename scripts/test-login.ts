// Diagnóstico de login: simula exactamente lo que hace authorize() en auth.ts
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
            image: true,
            referralCode: true,
            deletedAt: true,
        },
    });

    if (!user) {
        console.log("❌ PASO 1 FALLÓ: No existe usuario con email:", email);
        console.log("\n📋 Todos los usuarios con role ADMIN:");
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, role: true },
        });
        admins.forEach((a) => console.log(`   - ${a.email}`));
        await prisma.$disconnect();
        return;
    }
    console.log("✅ PASO 1: Usuario encontrado:", user.email, "role:", user.role);

    // 2. Check soft delete
    if (user.deletedAt) {
        console.log("❌ PASO 2 FALLÓ: Usuario soft-deleted en", user.deletedAt);
        await prisma.$disconnect();
        return;
    }
    console.log("✅ PASO 2: No está eliminado");

    // 3. Verificar password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        console.log("❌ PASO 3 FALLÓ: Password NO coincide");
        console.log("   Hash en DB:", user.password.substring(0, 20) + "...");
        // Intentar re-hashear para verificar
        const newHash = await bcrypt.hash(password, 12);
        const recheck = await bcrypt.compare(password, newHash);
        console.log("   Re-hash test:", recheck ? "OK (bcrypt funciona)" : "FALLO (problema con bcrypt)");
        await prisma.$disconnect();
        return;
    }
    console.log("✅ PASO 3: Password coincide");

    // 4. Simular computeUserAccess
    console.log("\n🔍 PASO 4: Simulando computeUserAccess...");
    const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            role: true,
            isSuspended: true,
            suspendedUntil: true,
            deletedAt: true,
            merchant: { select: { id: true, approvalStatus: true, isActive: true } },
            driver: { select: { id: true, approvalStatus: true, isActive: true, isSuspended: true } },
            sellerProfile: { select: { id: true, isActive: true } },
        },
    });

    console.log("   User.role:", fullUser?.role);
    console.log("   isAdmin:", fullUser?.role === "ADMIN");
    console.log("   isSuspended:", fullUser?.isSuspended);
    console.log("   Merchant:", fullUser?.merchant ? `id=${fullUser.merchant.id} status=${fullUser.merchant.approvalStatus}` : "NO TIENE");
    console.log("   Driver:", fullUser?.driver ? `id=${fullUser.driver.id} status=${fullUser.driver.approvalStatus}` : "NO TIENE");
    console.log("   Seller:", fullUser?.sellerProfile ? `id=${fullUser.sellerProfile.id} active=${fullUser.sellerProfile.isActive}` : "NO TIENE");

    // 5. Check NextAuth env
    console.log("\n🔍 PASO 5: Variables de NextAuth:");
    console.log("   AUTH_SECRET:", process.env.AUTH_SECRET ? `SET (${process.env.AUTH_SECRET.length} chars)` : "❌ NO DEFINIDO");
    console.log("   NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? `SET (${process.env.NEXTAUTH_SECRET.length} chars)` : "❌ NO DEFINIDO");
    console.log("   NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NO DEFINIDO");
    console.log("   NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "NO DEFINIDO");
    console.log("   AUTH_URL:", process.env.AUTH_URL || "NO DEFINIDO");
    console.log("   AUTH_TRUST_HOST:", process.env.AUTH_TRUST_HOST || "NO DEFINIDO");

    console.log("\n════════════════════════════════════");
    console.log("✅ Si todos los pasos pasaron, el problema es de NextAuth config (secrets/URL/cookies)");

    await prisma.$disconnect();
}

testLogin().catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
});
