/**
 * Seed: 4 cuentas test para "prueba de mundo real" en Ushuaia
 * Rama: chore/seed-mundo-real
 *
 * Crea las cuentas necesarias para correr el checklist pre-lanzamiento manual:
 *   1. Buyer       — Av. San Martín 1234 (Centro)
 *   2. Merchant    — Av. Maipú 363 (Centro comercial), aprobado, abierto, 5 productos sembrados
 *   3. Driver      — Av. Don Bosco 1100, aprobado, MOTO, online
 *   4. Seller      — Magallanes 444, marketplace aprobado
 *
 * Direcciones distribuidas estratégicamente (no todas en el mismo punto) para
 * que la matriz de pruebas cubra distancias reales (~500m a ~1.5km), zonas
 * distintas si el admin dibuja polígonos, y multi-vendor con drivers separados.
 *
 * Todos los docs aprobados de antemano para que las cuentas operen inmediatamente
 * (esto es seed de TESTING, no de onboarding real). El merchant tiene horario
 * lun-dom 9:00–22:00 (siempre abierto durante el checklist).
 *
 * IDEMPOTENTE: upsert por email. Corrido 2 veces, no duplica.
 *
 * Uso:
 *   npx tsx scripts/seed-real-world-test.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Password compartido para todas las cuentas test (seed local, no prod).
const TEST_PASSWORD = "Test1234!";

// Schedule "siempre abierto" lun-dom 9:00–22:00 (1=Mon, 7=Sun).
const SCHEDULE_ALWAYS_OPEN = JSON.stringify({
    "1": [{ open: "09:00", close: "22:00" }],
    "2": [{ open: "09:00", close: "22:00" }],
    "3": [{ open: "09:00", close: "22:00" }],
    "4": [{ open: "09:00", close: "22:00" }],
    "5": [{ open: "09:00", close: "22:00" }],
    "6": [{ open: "09:00", close: "22:00" }],
    "7": [{ open: "09:00", close: "22:00" }],
});

// Direcciones distribuidas estratégicamente en las 3 zonas de delivery según
// las calles principales de Ushuaia que delimitan cada zona:
//
//   ZONA A (Centro / Costa, ×1.0)   — desde el Canal Beagle hasta calle Alem (Ruta 3)
//   ZONA B (Intermedia, ×1.15)      — desde Alem hasta Las Primulas
//   ZONA C (Alta / Difícil, ×1.35)  — desde Las Primulas hacia las montañas
//
// El Buyer tiene 3 Address (una por zona) para que pueda probar pedidos con
// destinos en cada zona durante el checklist sin tener que mockear GPS o
// crear addresses a mano. Las otras cuentas se distribuyen en zonas distintas
// para que el flow cross-rol también cubra distancias variadas.

const ACCOUNTS = {
    buyer: {
        email: "buyer.test@moovy.local",
        name: "Cliente Test",
        // 3 direcciones en zonas A/B/C según calles principales de Ushuaia
        // (definidas por el founder 2026-04-30):
        //   Zona A — Av. San Martín 850 (centro)
        //   Zona B — Las Primulas 191 (intermedia, frontera con la zona alta)
        //   Zona C — Haruwen 2329 (zona alta, hacia la montaña)
        addresses: [
            {
                label: "Casa Centro (Zona A)",
                street: "Avenida San Martín",
                number: "850",
                neighborhood: "Centro",
                latitude: -54.806,
                longitude: -68.302,
                isDefault: true,
            },
            {
                label: "Casa Intermedia (Zona B)",
                street: "Las Primulas",
                number: "191",
                neighborhood: "Intermedia",
                latitude: -54.793,
                longitude: -68.310,
                isDefault: false,
            },
            {
                label: "Casa Alta (Zona C)",
                street: "Haruwen",
                number: "2329",
                neighborhood: "Zona Alta",
                latitude: -54.785,
                longitude: -68.320,
                isDefault: false,
            },
        ],
    },
    merchant: {
        email: "merchant.test@moovy.local",
        name: "Comercio Test",
        // Calle Magallanes, zona céntrica (Zona A)
        address: {
            label: "Comercio",
            street: "Magallanes",
            number: "250",
            neighborhood: "Centro",
            latitude: -54.808,
            longitude: -68.309,
            isDefault: true,
        },
    },
    driver: {
        email: "driver.test@moovy.local",
        name: "Repartidor Test",
        // Calle Magallanes, zona céntrica (Zona A)
        address: {
            label: "Casa",
            street: "Magallanes",
            number: "600",
            neighborhood: "Centro",
            latitude: -54.807,
            longitude: -68.311,
            isDefault: true,
        },
    },
    seller: {
        email: "seller.test@moovy.local",
        name: "Vendedor Marketplace Test",
        // Calle Magallanes, zona céntrica (Zona A)
        address: {
            label: "Casa",
            street: "Magallanes",
            number: "900",
            neighborhood: "Centro",
            latitude: -54.806,
            longitude: -68.313,
            isDefault: true,
        },
    },
};

// 5 productos cubre la matriz de pesos del Motor Logístico:
// 2 SMALL (gaseosa, alfajor), 2 MEDIUM (pizza, kit almacén), 1 LARGE (caja).
const MERCHANT_PRODUCTS = [
    {
        name: "Gaseosa Coca Cola 1.5L",
        description: "Botella retornable 1.5L",
        price: 2500,
        stock: 50,
        weightGrams: 1500,
        volumeMl: 1500,
        packageCategoryName: "SMALL",
    },
    {
        name: "Alfajor Havanna individual",
        description: "Alfajor de chocolate con dulce de leche",
        price: 800,
        stock: 100,
        weightGrams: 60,
        volumeMl: 100,
        packageCategoryName: "MICRO",
    },
    {
        name: "Pizza muzzarella grande",
        description: "Pizza de muzzarella tamaño grande, 8 porciones",
        price: 8500,
        stock: 20,
        weightGrams: 900,
        volumeMl: 5000,
        packageCategoryName: "MEDIUM",
    },
    {
        name: "Kit almacén básico",
        description: "Yerba 1kg + azúcar 1kg + aceite 1.5L + fideos 500g",
        price: 12000,
        stock: 15,
        weightGrams: 4500,
        volumeMl: 5500,
        packageCategoryName: "MEDIUM",
    },
    {
        name: "Caja electrodoméstico chico",
        description: "Pava eléctrica con caja",
        price: 35000,
        stock: 5,
        weightGrams: 2500,
        volumeMl: 15000,
        packageCategoryName: "LARGE",
    },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertUser(email: string, name: string, role: string = "USER"): Promise<string> {
    const password = await bcrypt.hash(TEST_PASSWORD, 12);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            name,
            role: role as any,
            password,
            deletedAt: null,
            isSuspended: false,
        },
        create: {
            email,
            name,
            role: role as any,
            password,
            pointsBalance: 0,
        },
    });
    return user.id;
}

interface AddrInput {
    label: string;
    street: string;
    number: string;
    neighborhood?: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
}

async function upsertAddress(userId: string, addr: AddrInput): Promise<void> {
    // Si esta address va a ser default, primero quitamos el flag de cualquier
    // otra default del user (evita 2+ defaults cuando el seed cambia de calles
    // entre runs y deja addresses viejas de calles distintas).
    if (addr.isDefault) {
        await prisma.address.updateMany({
            where: { userId, deletedAt: null, isDefault: true },
            data: { isDefault: false },
        });
    }

    // No hay unique key compuesta en Address — buscamos por userId+street+number
    const existing = await prisma.address.findFirst({
        where: { userId, street: addr.street, number: addr.number, deletedAt: null },
    });
    const data = {
        label: addr.label,
        street: addr.street,
        number: addr.number,
        neighborhood: addr.neighborhood,
        latitude: addr.latitude,
        longitude: addr.longitude,
        isDefault: addr.isDefault ?? false,
    };
    if (existing) {
        await prisma.address.update({
            where: { id: existing.id },
            data,
        });
    } else {
        await prisma.address.create({
            data: { userId, ...data },
        });
    }
}

/**
 * Soft-deletea las addresses anteriores del user que no estén en la lista
 * actual (limpia zombies cuando el seed cambia de calles entre runs).
 */
async function archiveStaleAddresses(userId: string, currentAddrs: AddrInput[]): Promise<void> {
    const keepKeys = new Set(currentAddrs.map((a) => `${a.street}|${a.number}`));
    const all = await prisma.address.findMany({
        where: { userId, deletedAt: null },
    });
    const toArchive = all.filter((a) => !keepKeys.has(`${a.street}|${a.number}`));
    if (toArchive.length === 0) return;
    await prisma.address.updateMany({
        where: { id: { in: toArchive.map((a) => a.id) } },
        data: { deletedAt: new Date() },
    });
    console.log(`    (archivadas ${toArchive.length} addresses viejas)`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
    console.log("\n[SEED] Cuentas test para prueba de mundo real");
    console.log("─".repeat(70));

    // 1. BUYER — 3 direcciones, una en cada zona, para probar la matriz completa
    console.log("\n→ Buyer (cliente) — 3 direcciones distribuidas en zonas A/B/C");
    const buyerUserId = await upsertUser(ACCOUNTS.buyer.email, ACCOUNTS.buyer.name);
    for (const addr of ACCOUNTS.buyer.addresses) {
        await upsertAddress(buyerUserId, addr);
    }
    await archiveStaleAddresses(buyerUserId, ACCOUNTS.buyer.addresses);
    console.log(`  ✓ ${ACCOUNTS.buyer.email}`);
    for (const addr of ACCOUNTS.buyer.addresses) {
        console.log(`    · ${addr.label}: ${addr.street} ${addr.number}  (${addr.latitude}, ${addr.longitude})`);
    }

    // 2. MERCHANT
    console.log("\n→ Merchant (comercio aprobado)");
    const merchantUserId = await upsertUser(ACCOUNTS.merchant.email, ACCOUNTS.merchant.name);
    await upsertAddress(merchantUserId, ACCOUNTS.merchant.address);
    await archiveStaleAddresses(merchantUserId, [ACCOUNTS.merchant.address]);
    const slug = "comercio-test";
    const now = new Date();
    const merchantData = {
        name: ACCOUNTS.merchant.name,
        slug,
        businessName: "Comercio Test SA",
        description: "Comercio sembrado para pruebas pre-launch",
        category: "Almacén",
        email: ACCOUNTS.merchant.email,
        phone: "+542901123456",
        address: `${ACCOUNTS.merchant.address.street} ${ACCOUNTS.merchant.address.number}`,
        latitude: ACCOUNTS.merchant.address.latitude,
        longitude: ACCOUNTS.merchant.address.longitude,
        isActive: true,
        isOpen: true,
        scheduleEnabled: true,
        scheduleJson: SCHEDULE_ALWAYS_OPEN,
        approvalStatus: "APPROVED",
        // Docs todos APROBADOS para operar inmediato
        cuit: "30715432109",
        cuitStatus: "APPROVED",
        cuitApprovedAt: now,
        cuitApprovalSource: "PHYSICAL",
        cuitApprovalNote: "Aprobado por seed-real-world-test.ts (cuenta de prueba)",
        bankAccount: "0070123456789012345678",
        bankAccountStatus: "APPROVED",
        bankAccountApprovedAt: now,
        bankAccountApprovalSource: "PHYSICAL",
        bankAccountApprovalNote: "Aprobado por seed",
        constanciaAfipUrl: "https://example.com/seed-afip.pdf",
        constanciaAfipStatus: "APPROVED",
        constanciaAfipApprovedAt: now,
        constanciaAfipApprovalSource: "PHYSICAL",
        constanciaAfipApprovalNote: "Aprobado por seed",
        habilitacionMunicipalUrl: "https://example.com/seed-habilitacion.pdf",
        habilitacionMunicipalStatus: "APPROVED",
        habilitacionMunicipalApprovedAt: now,
        habilitacionMunicipalApprovalSource: "PHYSICAL",
        habilitacionMunicipalApprovalNote: "Aprobado por seed",
        registroSanitarioStatus: "NOT_REQUIRED",
        commissionRate: 10,
        loyaltyTier: "BRONCE",
        deliveryRadiusKm: 15,
        deliveryTimeMin: 20,
        deliveryTimeMax: 40,
        allowPickup: true,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
        startedAt: now,
        ownerId: merchantUserId,
    };
    const merchant = await prisma.merchant.upsert({
        where: { slug },
        update: merchantData,
        create: merchantData,
    });
    console.log(`  ✓ ${ACCOUNTS.merchant.email} → comercio "${merchant.name}" APROBADO + ABIERTO`);
    console.log(`    Dirección: ${merchantData.address}`);

    // 3. PRODUCTOS DEL MERCHANT (5)
    console.log("\n→ Productos sembrados en el merchant test");
    for (const p of MERCHANT_PRODUCTS) {
        const cat = await prisma.packageCategory.findUnique({
            where: { name: p.packageCategoryName },
        });
        const productSlug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-test`;
        const productData = {
            name: p.name,
            slug: productSlug,
            description: p.description,
            price: p.price,
            costPrice: Math.round(p.price * 0.7),
            stock: p.stock,
            isActive: true,
            merchantId: merchant.id,
            weightGrams: p.weightGrams,
            volumeMl: p.volumeMl,
            packageCategoryId: cat?.id ?? null,
        };
        await prisma.product.upsert({
            where: { slug: productSlug },
            update: productData,
            create: productData,
        });
        console.log(`    + ${p.name} ($${p.price}, ${p.weightGrams}g, ${p.packageCategoryName})`);
    }

    // 4. DRIVER
    console.log("\n→ Driver (repartidor aprobado, MOTO, online)");
    const driverUserId = await upsertUser(ACCOUNTS.driver.email, ACCOUNTS.driver.name);
    await upsertAddress(driverUserId, ACCOUNTS.driver.address);
    await archiveStaleAddresses(driverUserId, [ACCOUNTS.driver.address]);
    const driverData = {
        userId: driverUserId,
        vehicleType: "MOTO",
        vehicleBrand: "Honda",
        vehicleModel: "Wave",
        vehicleYear: 2022,
        vehicleColor: "Rojo",
        licensePlate: "AC123BD",
        cuit: "20234567894",
        // Docs APROBADOS
        cuitStatus: "APPROVED",
        cuitApprovedAt: now,
        constanciaCuitStatus: "APPROVED",
        constanciaCuitApprovedAt: now,
        dniFrenteStatus: "APPROVED",
        dniFrenteApprovedAt: now,
        dniDorsoStatus: "APPROVED",
        dniDorsoApprovedAt: now,
        licenciaStatus: "APPROVED",
        licenciaApprovedAt: now,
        licenciaExpiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        seguroStatus: "APPROVED",
        seguroApprovedAt: now,
        seguroExpiresAt: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        vtvStatus: "APPROVED",
        vtvApprovedAt: now,
        vtvExpiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        cedulaVerdeStatus: "APPROVED",
        cedulaVerdeApprovedAt: now,
        applicationStatus: "APPROVED",
        approvalStatus: "APPROVED",
        approvedAt: now,
        isActive: true,
        isOnline: true,
        availabilityStatus: "DISPONIBLE",
        latitude: ACCOUNTS.driver.address.latitude,
        longitude: ACCOUNTS.driver.address.longitude,
        lastLocationAt: now,
        bankCbu: "0070123456789012345679",
        bankAccountUpdatedAt: now,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
    };
    await prisma.driver.upsert({
        where: { userId: driverUserId },
        update: driverData,
        create: driverData,
    });
    console.log(`  ✓ ${ACCOUNTS.driver.email} → MOTO Honda Wave AC123BD, ONLINE`);
    console.log(`    Posición inicial: ${ACCOUNTS.driver.address.street} ${ACCOUNTS.driver.address.number}`);

    // 5. SELLER (marketplace)
    console.log("\n→ Seller (marketplace aprobado)");
    const sellerUserId = await upsertUser(ACCOUNTS.seller.email, ACCOUNTS.seller.name);
    await upsertAddress(sellerUserId, ACCOUNTS.seller.address);
    await archiveStaleAddresses(sellerUserId, [ACCOUNTS.seller.address]);
    const sellerData = {
        userId: sellerUserId,
        displayName: ACCOUNTS.seller.name,
        bio: "Vendedor de prueba marketplace, pre-launch",
        cuit: "27345678901",
        applicationStatus: "APPROVED",
        approvedAt: now,
        isActive: true,
        isVerified: true,
        commissionRate: 12,
        bankCbu: "0070123456789012345680",
        scheduleEnabled: true,
        scheduleJson: SCHEDULE_ALWAYS_OPEN,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
    };
    await prisma.sellerProfile.upsert({
        where: { userId: sellerUserId },
        update: sellerData,
        create: sellerData,
    });
    console.log(`  ✓ ${ACCOUNTS.seller.email} → marketplace APROBADO`);
    console.log(`    Dirección: ${ACCOUNTS.seller.address.street} ${ACCOUNTS.seller.address.number}`);

    // ─── Resumen final ──────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(70));
    console.log("  CUENTAS TEST CREADAS — credenciales para login");
    console.log("═".repeat(70));
    console.log(`  Password único: ${TEST_PASSWORD}`);
    console.log("");
    const buyerDefaultAddr = ACCOUNTS.buyer.addresses.find((a) => a.isDefault) ?? ACCOUNTS.buyer.addresses[0];
    const table = [
        ["Rol", "Email", "Zona", "Dirección"],
        ["─────────", "──────────────────────────────", "──────", "─────────────────────────────"],
        ["Buyer", ACCOUNTS.buyer.email, "A/B/C", `3 dirs (default: ${buyerDefaultAddr.street} ${buyerDefaultAddr.number})`],
        ["Merchant", ACCOUNTS.merchant.email, "A", `${ACCOUNTS.merchant.address.street} ${ACCOUNTS.merchant.address.number}`],
        ["Driver", ACCOUNTS.driver.email, "B", `${ACCOUNTS.driver.address.street} ${ACCOUNTS.driver.address.number}`],
        ["Seller", ACCOUNTS.seller.email, "C", `${ACCOUNTS.seller.address.street} ${ACCOUNTS.seller.address.number}`],
    ];
    for (const row of table) {
        console.log(`  ${row[0].padEnd(10)} ${row[1].padEnd(32)} ${row[2].padEnd(7)} ${row[3]}`);
    }
    console.log("\n  Coords (para mockear GPS en Chrome DevTools):");
    console.log(`    Buyer Centro (A)     → lat ${ACCOUNTS.buyer.addresses[0].latitude}, lng ${ACCOUNTS.buyer.addresses[0].longitude}`);
    console.log(`    Buyer Intermedia (B) → lat ${ACCOUNTS.buyer.addresses[1].latitude}, lng ${ACCOUNTS.buyer.addresses[1].longitude}`);
    console.log(`    Buyer Alta (C)       → lat ${ACCOUNTS.buyer.addresses[2].latitude}, lng ${ACCOUNTS.buyer.addresses[2].longitude}`);
    console.log(`    Merchant (A)         → lat ${ACCOUNTS.merchant.address.latitude}, lng ${ACCOUNTS.merchant.address.longitude}`);
    console.log(`    Driver (B)           → lat ${ACCOUNTS.driver.address.latitude}, lng ${ACCOUNTS.driver.address.longitude}`);
    console.log(`    Seller (C)           → lat ${ACCOUNTS.seller.address.latitude}, lng ${ACCOUNTS.seller.address.longitude}`);
    console.log("\n✓ Seed completado. Usá las credenciales para correr el checklist pre-launch.\n");
}

main()
    .catch((err) => {
        console.error("✖ Error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
