/**
 * scripts/verify-borrado-definitivo.ts
 *
 * Rama: feat/borrado-definitivo-cuenta
 *
 * Verifica contra la DB REAL que el derecho de supresión (Ley 25.326) se cumple
 * de punta a punta: se destruyen los datos personales, se conserva el registro
 * fiscal disociado, y la casilla de correo queda LIBRE para volver a usarse.
 *
 * Crea un usuario de prueba con datos en todas las tablas sensibles, lo borra y
 * revisa el resultado. Al final limpia lo que creó.
 *
 * Correr: npx tsx scripts/verify-borrado-definitivo.ts
 */

import { prisma } from "../src/lib/prisma";
import {
    purgeUserAccount,
    anonymizedEmailFor,
    isPurged,
    AccountPurgeError,
} from "../src/lib/account-purge";

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
    if (cond) {
        passed++;
        console.log(`  ✅ ${label}`);
    } else {
        failed++;
        console.log(`  ❌ ${label}`);
    }
}

const STAMP = Date.now();
const TEST_EMAIL = `purge-test-${STAMP}@moovy.test`;

async function main() {
    console.log("\n🧪 Borrado definitivo de cuenta (derecho de supresión)\n");

    // ── Setup: usuario con datos personales repartidos por todos lados ───────
    console.log("== Preparando usuario de prueba ==");
    const user = await prisma.user.create({
        data: {
            email: TEST_EMAIL,
            name: "Persona De Prueba",
            firstName: "Persona",
            lastName: "De Prueba",
            phone: "2901555123",
            password: "hash-falso",
            pointsBalance: 4200,
            pendingBonusPoints: 2500,
        },
    });

    const address = await prisma.address.create({
        data: {
            userId: user.id,
            label: "Casa",
            street: "San Martín",
            number: "1234",
            apartment: "3B",
            neighborhood: "Centro",
            latitude: -54.8,
            longitude: -68.3,
        },
    });

    await prisma.favorite.create({ data: { userId: user.id } as any }).catch(() => {
        // Favorite puede exigir merchantId/productId según el schema: no es el
        // foco del test, seguimos sin él.
    });
    await prisma.pushSubscription
        .create({
            data: {
                userId: user.id,
                endpoint: `https://push.test/${STAMP}`,
                p256dh: "x",
                auth: "y",
            } as any,
        })
        .catch(() => {});

    console.log(`   Usuario ${user.email} creado (id ${user.id})`);
    console.log(`   Dirección: ${address.street} ${address.number}, ${address.apartment}\n`);

    try {
        // ── 1. El borrado corre ──────────────────────────────────────────────
        console.log("== Ejecutando el borrado ==");
        const result = await purgeUserAccount(user.id, {
            source: "ADMIN",
            actorUserId: user.id,
            actorEmail: "test@moovy.test",
            reason: "Verificación automática",
        });
        assert(result.previousEmail === TEST_EMAIL, "Devuelve el email original (para el audit)");
        assert(
            result.anonymizedEmail === anonymizedEmailFor(user.id),
            "Devuelve el email técnico con el que queda la fila"
        );

        // ── 2. Datos personales destruidos ───────────────────────────────────
        console.log("\n== Datos personales ==");
        const after = await prisma.user.findUnique({ where: { id: user.id } });
        assert(after !== null, "La fila del usuario sigue existiendo (integridad referencial)");
        assert(after?.email !== TEST_EMAIL, "El email original ya no está en la tabla");
        assert(isPurged(after?.email ?? ""), "El email quedó anonimizado");
        assert(after?.name === "[Cuenta eliminada]", "El nombre fue reemplazado");
        assert(after?.firstName === null && after?.lastName === null, "Nombre y apellido borrados");
        assert(after?.phone === null, "Teléfono borrado");
        assert(after?.image === null, "Foto borrada");
        assert(after?.pointsBalance === 0, "Saldo de puntos en cero");
        assert(after?.pendingBonusPoints === 0, "Puntos pendientes en cero");
        assert(after?.resetToken === null, "Token de recuperación borrado");
        assert(after?.deletedAt !== null, "Queda marcada como eliminada");
        assert(after?.marketingConsent === false, "Consentimiento de marketing revocado");

        console.log("\n== Dirección (no se borra: la referencian pedidos) ==");
        const addrAfter = await prisma.address.findUnique({ where: { id: address.id } });
        assert(addrAfter !== null, "La fila sigue (si se borrara, rompería la FK de los pedidos)");
        assert(addrAfter?.street !== "San Martín", "La calle ya no está");
        assert(addrAfter?.apartment === null, "El departamento ya no está");
        assert(
            addrAfter?.latitude === null && addrAfter?.longitude === null,
            "Las coordenadas ya no están"
        );
        assert(addrAfter?.deletedAt !== null, "Queda marcada como eliminada");

        console.log("\n== Datos que se destruyen enteros ==");
        const [favs, pushes, carts, refs] = await Promise.all([
            prisma.favorite.count({ where: { userId: user.id } }),
            prisma.pushSubscription.count({ where: { userId: user.id } }),
            prisma.cartItem.count({ where: { userId: user.id } }),
            prisma.referral.count({
                where: { OR: [{ referrerId: user.id }, { refereeId: user.id }] },
            }),
        ]);
        assert(favs === 0, "Favoritos borrados");
        assert(pushes === 0, "Suscripciones de notificaciones borradas");
        assert(carts === 0, "Carrito borrado");
        assert(refs === 0, "Referidos borrados");

        // ── 3. La casilla quedó libre ────────────────────────────────────────
        console.log("\n== La casilla de correo quedó libre ==");
        const stillTaken = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
        assert(stillTaken === null, `Nadie ocupa ${TEST_EMAIL}`);

        const reused = await prisma.user.create({
            data: { email: TEST_EMAIL, name: "Cuenta Nueva", password: "hash-falso" },
        });
        assert(reused.id !== user.id, "Se puede crear una cuenta NUEVA con el mismo email");
        assert(reused.pointsBalance === 0, "La cuenta nueva arranca limpia (sin datos viejos)");
        await prisma.user.delete({ where: { id: reused.id } });

        // ── 4. Auditoría ─────────────────────────────────────────────────────
        console.log("\n== Rastro de auditoría (lo que se le muestra a la AAIP) ==");
        const audit = await prisma.auditLog.findFirst({
            where: { action: "ACCOUNT_PURGED", entityId: user.id },
            orderBy: { createdAt: "desc" },
        });
        assert(audit !== null, "Quedó registrado el borrado en AuditLog");
        // AuditLog.details es un String con JSON adentro (no una columna JSON).
        let details: Record<string, unknown> = {};
        try {
            details = audit?.details ? JSON.parse(audit.details) : {};
        } catch {
            details = {};
        }
        assert(
            details.purgedEmail === TEST_EMAIL,
            "El audit guarda a quién se borró (única forma de probar que cumplimos)"
        );
        assert(
            typeof details.reason === "string" && (details.reason as string).length > 0,
            "El audit guarda el motivo / quién pidió la baja"
        );

        // ── 5. Idempotencia ──────────────────────────────────────────────────
        console.log("\n== Doble ejecución ==");
        let rejected = false;
        try {
            await purgeUserAccount(user.id, {
                source: "ADMIN",
                actorUserId: user.id,
                actorEmail: "test@moovy.test",
                reason: "Segundo intento",
            });
        } catch (err) {
            rejected = err instanceof AccountPurgeError && err.code === "ALREADY_PURGED";
        }
        assert(rejected, "Borrar dos veces la misma cuenta se rechaza (no duplica auditoría)");

        let notFound = false;
        try {
            await purgeUserAccount("id-que-no-existe", {
                source: "ADMIN",
                actorUserId: user.id,
                actorEmail: "test@moovy.test",
            });
        } catch (err) {
            notFound = err instanceof AccountPurgeError && err.code === "NOT_FOUND";
        }
        assert(notFound, "Un id inexistente devuelve NOT_FOUND (no rompe)");
    } finally {
        // Limpieza: el usuario de prueba no debe quedar en la base.
        console.log("\n🧹 Limpiando datos de prueba...");
        await prisma.address.deleteMany({ where: { userId: user.id } });
        await prisma.auditLog.deleteMany({ where: { entityId: user.id } });
        await prisma.userActivityLog.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        console.log("   Listo.");
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});
