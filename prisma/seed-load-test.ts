// Script para generar datos de prueba para load testing
// Ejecutar: node prisma/seed-load-test.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🗑️ Limpiando datos de prueba anteriores...");

    // Limpiar solo datos de test (preservar admin y configuración)
    await prisma.order.deleteMany({ where: { customerEmail: { contains: "loadtest" } } });
    await prisma.driver.deleteMany({ where: { user: { email: { contains: "loadtest" } } } });
    await prisma.user.deleteMany({ where: { email: { contains: "loadtest" } } });

    console.log("✅ Limpieza completa\n");

    const password = await bcrypt.hash("demo123", 10);

    // ==================== 20 REPARTIDORES ====================
    console.log("🏍️ Creando 20 repartidores...");

    const vehicleTypes = ["MOTO", "BICICLETA", "AUTO"];

    for (let i = 1; i <= 20; i++) {
        const user = await prisma.user.create({
            data: {
                email: `loadtest-rider${i}@somosmoovy.com`,
                password,
                name: `Load Test Rider ${i}`,
                role: "DRIVER",
            },
        });

        await prisma.driver.create({
            data: {
                userId: user.id,
                vehicleType: vehicleTypes[i % 3],
                licensePlate: `LT${String(i).padStart(3, '0')}`,
                isActive: true,
                isOnline: Math.random() > 0.3, // 70% online
            },
        });
    }
    console.log("   ✅ 20 repartidores creados\n");

    // ==================== 100 CLIENTES ====================
    console.log("👥 Creando 100 clientes...");

    for (let i = 1; i <= 100; i++) {
        await prisma.user.create({
            data: {
                email: `loadtest-client${i}@somosmoovy.com`,
                password,
                name: `Load Test Client ${i}`,
                role: "CLIENT",
            },
        });
    }
    console.log("   ✅ 100 clientes creados\n");

    console.log("=".repeat(50));
    console.log("🎉 DATOS DE LOAD TESTING CREADOS");
    console.log("=".repeat(50));
    console.log("\n📋 RESUMEN:");
    console.log("   • 20 Repartidores (loadtest-rider1@somosmoovy.com ... rider20)");
    console.log("   • 100 Clientes (loadtest-client1@somosmoovy.com ... client100)");
    console.log("\n🔐 Contraseña para todos: demo123");
    console.log("\n💡 Próximo paso:");
    console.log("   1. Ejecutar: .\\scripts\\setup-monitoring.ps1");
    console.log("   2. Ejecutar: .\\scripts\\run-load-tests.ps1");
    console.log("");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
