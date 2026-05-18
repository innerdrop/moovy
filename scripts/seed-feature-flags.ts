// feat/feature-flags-ops (2026-05-13): seed que crea los flags iniciales.
//
// Idempotente: usa upsert por `key`, asi que correrlo multiples veces no
// rompe nada. Si un flag ya existe con un estado distinto al default,
// preserva ese estado (no lo resetea).
//
// CUANDO CORRERLO:
// - Primera vez post-migracion (`npx prisma db push` ya ejecutado).
// - Si se agrega un flag nuevo al schema, agregarlo a SEED_FLAGS y volver
//   a correr — el upsert solo crea el faltante.
//
// Rama fix/restaurar-moover-y-marketplace-sin-flags (2026-05-17):
// Sacamos los flags `buyer.marketplace` y `buyer.puntos-moover` del seed
// porque esas secciones forman parte del producto core y nunca deberían
// ocultarse desde OPS. El código ya no las consume. Los rows que quedaron
// en la DB de prod los limpia un DELETE manual una vez (ver
// .commit-message). Los flags MERCHANT, SELLER y los otros BUYER se
// mantienen.
//
// Uso:
//   npx tsx scripts/seed-feature-flags.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedFlag {
    key: string;
    label: string;
    description: string;
    scope: "MERCHANT" | "SELLER" | "BUYER" | "GLOBAL";
}

const SEED_FLAGS: SeedFlag[] = [
    // ─── MERCHANT ──────────────────────────────────────────────────────────
    {
        key: "merchant.publicidad",
        label: "Publicidad",
        description:
            "Permite a los comercios pagar por destacar productos o aparecer en banners. Mientras este OFF, el item 'Publicidad' no aparece en el menu del comercio y la pagina /comercios/publicidad redirige al dashboard.",
        scope: "MERCHANT",
    },
    {
        key: "merchant.paquetes",
        label: "Paquetes B2B",
        description:
            "Permite a los comercios adquirir paquetes pre-armados de productos (combos de proveedores). Mientras este OFF, los items 'Adquirir paquetes' e 'Historial de paquetes' no aparecen en el menu y las paginas correspondientes redirigen al dashboard.",
        scope: "MERCHANT",
    },
    {
        key: "merchant.tracking-en-vivo",
        label: "Tracking en vivo del driver",
        description:
            "Muestra al comercio el mapa con la ubicacion en tiempo real del repartidor que retiro su pedido. Si esta OFF, el comercio solo ve el estado de texto (DRIVER_ASSIGNED, PICKED_UP, etc.) sin mapa.",
        scope: "MERCHANT",
    },

    // ─── SELLER ────────────────────────────────────────────────────────────
    {
        key: "seller.paquetes",
        label: "Paquetes para vendedores",
        description:
            "Permite a los vendedores del marketplace adquirir paquetes B2B. Mientras este OFF, los items relacionados no aparecen en el menu del vendedor.",
        scope: "SELLER",
    },

    // ─── BUYER ─────────────────────────────────────────────────────────────
    // NOTA: los flags `buyer.marketplace` y `buyer.puntos-moover` fueron
    // removidos en la rama fix/restaurar-moover-y-marketplace-sin-flags
    // (2026-05-17). Esas secciones son producto core y no deben ocultarse
    // desde OPS.
    {
        key: "buyer.scheduled-delivery",
        label: "Pedidos programados",
        description:
            "Habilita la opcion de programar entregas a una franja horaria futura (ej: 'entregar entre 20:00 y 21:00'). Mientras este OFF, todos los pedidos son entrega inmediata.",
        scope: "BUYER",
    },
    {
        key: "buyer.cash-payment",
        label: "Pago en efectivo",
        description:
            "Habilita el pago al driver con efectivo al recibir el pedido. Mientras este OFF, todos los pedidos se pagan online via MercadoPago.",
        scope: "BUYER",
    },
];

async function main() {
    console.log(`[seed-feature-flags] Iniciando upsert de ${SEED_FLAGS.length} flags...`);

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const flag of SEED_FLAGS) {
        const existing = await prisma.featureFlag.findUnique({
            where: { key: flag.key },
        });

        if (!existing) {
            await prisma.featureFlag.create({
                data: {
                    key: flag.key,
                    label: flag.label,
                    description: flag.description,
                    scope: flag.scope,
                    isActive: false, // Default explicit: todo apagado al crearse
                },
            });
            created++;
            console.log(`  [CREATED] ${flag.key} → ${flag.label} (${flag.scope})`);
        } else {
            // Si existe, actualizamos solo label/description/scope (info "estatica"
            // del flag) pero NO tocamos isActive — ese estado lo controla el admin
            // desde la UI y no debe resetearse por correr el seed.
            const needsUpdate =
                existing.label !== flag.label ||
                existing.description !== flag.description ||
                existing.scope !== flag.scope;

            if (needsUpdate) {
                await prisma.featureFlag.update({
                    where: { key: flag.key },
                    data: {
                        label: flag.label,
                        description: flag.description,
                        scope: flag.scope,
                    },
                });
                updated++;
                console.log(`  [UPDATED] ${flag.key} → label/desc/scope actualizados (isActive preservado: ${existing.isActive})`);
            } else {
                unchanged++;
                console.log(`  [UNCHANGED] ${flag.key} (isActive: ${existing.isActive})`);
            }
        }
    }

    console.log(`\n[seed-feature-flags] Listo: ${created} creados, ${updated} actualizados, ${unchanged} sin cambios.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
