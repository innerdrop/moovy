/**
 * Cambia la direccion de correo de una cuenta, completa.
 *
 * fix/el-correo-y-la-llave-de-fernando (2026-08-02).
 *
 * Existe porque no hay ninguna pantalla que lo haga. El endpoint
 * PATCH /api/admin/users acepta `email`, pero ninguna vista de OPS lo llama con
 * ese campo, y aunque se lo llamara a mano le faltan cuatro cosas que este
 * script si hace:
 *
 *   1. Sincroniza Merchant.email. Es un campo APARTE del User (schema:665) y
 *      algunos avisos salen por ahi. Cambiar uno solo deja la cuenta partida.
 *   2. Resetea emailVerified. Si no, la cuenta queda marcada como verificada
 *      con una direccion que nadie verifico nunca.
 *   3. Limpia resetToken / resetTokenExpiry. Un link de recupero emitido para
 *      el correo viejo no puede seguir siendo valido despues del cambio.
 *   4. Deja rastro en AuditLog. Cambiar el correo es un cambio de identidad: si
 *      manana hay una discusion sobre quien accedio a que, tiene que haber
 *      registro de quien lo cambio y cuando.
 *
 * Ademas cubre el agujero del endpoint: el chequeo de duplicados ignora a los
 * usuarios borrados logicamente, pero el @unique de la base no sabe de borrados
 * logicos, asi que ahi Prisma revienta con un error ilegible en vez de avisar.
 *
 * NO cierra las sesiones ya emitidas: NextAuth v5 usa JWT y el token viejo vive
 * hasta que expira. Para este caso no importa (la cuenta todavia no la uso
 * nadie), pero si algun dia se cambia el correo de una cuenta activa, el titular
 * tiene que cerrar sesion y volver a entrar.
 *
 * Uso:
 *   npx tsx scripts/cambiar-email-usuario.ts <correo-viejo> <correo-nuevo>
 *
 * Muestra el antes y el despues y pide confirmacion escrita antes de tocar nada.
 * Corre contra la base que apunte DATABASE_URL.
 */
import { prisma } from "../src/lib/prisma";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ADMIN_EMAIL_FALLBACK = process.env.ADMIN_EMAIL || "";

function normalizar(v: string): string {
    return v.trim().toLowerCase();
}

function esCorreoPlausible(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

async function main() {
    const [viejoRaw, nuevoRaw] = process.argv.slice(2);
    if (!viejoRaw || !nuevoRaw) {
        console.error("Uso: npx tsx scripts/cambiar-email-usuario.ts <correo-viejo> <correo-nuevo>");
        process.exit(1);
    }

    const viejo = normalizar(viejoRaw);
    const nuevo = normalizar(nuevoRaw);

    if (viejo === nuevo) {
        console.error("Los dos correos son el mismo. No hay nada que cambiar.");
        process.exit(1);
    }
    if (!esCorreoPlausible(nuevo)) {
        console.error(`"${nuevo}" no parece una direccion de correo valida.`);
        process.exit(1);
    }

    const usuario = await prisma.user.findUnique({
        where: { email: viejo },
        select: {
            id: true, email: true, name: true, firstName: true, lastName: true,
            role: true, emailVerified: true, deletedAt: true, createdAt: true,
            ownedMerchants: { select: { id: true, name: true, slug: true, email: true } },
        },
    });

    if (!usuario) {
        console.error(`No existe ninguna cuenta con el correo "${viejo}".`);
        process.exit(1);
    }
    if (usuario.deletedAt) {
        console.error("Esa cuenta esta dada de baja. No se le cambia el correo: se restaura primero o se crea una nueva.");
        process.exit(1);
    }

    // El @unique de la base NO excluye a los borrados logicos, asi que un correo
    // "libre" segun la app puede reventar igual al escribir. Se chequea aca.
    const ocupado = await prisma.user.findUnique({
        where: { email: nuevo },
        select: { id: true, deletedAt: true },
    });
    if (ocupado) {
        const estado = ocupado.deletedAt
            ? "una cuenta dada de baja (el correo sigue reservado en la base)"
            : "una cuenta activa";
        console.error(`El correo "${nuevo}" ya lo tiene ${estado}. No se puede reasignar.`);
        process.exit(1);
    }

    const nombre = usuario.name || [usuario.firstName, usuario.lastName].filter(Boolean).join(" ") || "(sin nombre)";

    console.log("");
    console.log("  CUENTA");
    console.log("  ------");
    console.log("  Nombre        ", nombre);
    console.log("  Rol           ", usuario.role);
    console.log("  Alta          ", usuario.createdAt.toISOString().slice(0, 10));
    console.log("  Verificado    ", usuario.emailVerified ? "si" : "no");
    console.log("");
    console.log("  Correo ACTUAL ", usuario.email);
    console.log("  Correo NUEVO  ", nuevo);
    console.log("");

    if (usuario.ownedMerchants.length > 0) {
        console.log("  COMERCIOS QUE ADMINISTRA");
        console.log("  ------------------------");
        for (const m of usuario.ownedMerchants) {
            const suyo = m.email ? m.email : "(sin correo propio)";
            const accion = m.email && normalizar(m.email) === viejo
                ? "  -> tambien se actualiza"
                : "  -> se deja como esta";
            console.log(`  ${m.name} (/${m.slug})   correo del comercio: ${suyo}${accion}`);
        }
        console.log("");
    }

    console.log("  Ademas: se marca el correo como NO verificado y se invalidan los");
    console.log("  links de recupero de contrasena que hubiera pendientes.");
    console.log("");

    const rl = readline.createInterface({ input, output });
    const respuesta = await rl.question('  Escribi "cambiar" para confirmar (cualquier otra cosa cancela): ');
    rl.close();

    if (respuesta.trim().toLowerCase() !== "cambiar") {
        console.log("\n  Cancelado. No se toco nada.\n");
        return;
    }

    // Quien queda registrado como autor del cambio en la auditoria. AuditLog.userId
    // es obligatorio y apunta a un User real, asi que si no encontramos un admin
    // no inventamos nada: se avisa y el cambio queda sin registrar.
    const admin = await prisma.user.findFirst({
        where: ADMIN_EMAIL_FALLBACK
            ? { email: normalizar(ADMIN_EMAIL_FALLBACK), deletedAt: null }
            : { role: "ADMIN", deletedAt: null },
        select: { id: true, email: true },
        orderBy: { createdAt: "asc" },
    });

    const comerciosASincronizar = usuario.ownedMerchants
        .filter((m) => m.email && normalizar(m.email) === viejo)
        .map((m) => m.id);

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: usuario.id },
            data: {
                email: nuevo,
                emailVerified: null,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        if (comerciosASincronizar.length > 0) {
            await tx.merchant.updateMany({
                where: { id: { in: comerciosASincronizar } },
                data: { email: nuevo },
            });
        }

        if (admin) {
            await tx.auditLog.create({
                data: {
                    action: "USER_EMAIL_CHANGED",
                    entityType: "User",
                    entityId: usuario.id,
                    userId: admin.id,
                    details: JSON.stringify({
                        antes: viejo,
                        despues: nuevo,
                        comerciosSincronizados: comerciosASincronizar,
                        via: "scripts/cambiar-email-usuario.ts",
                    }),
                },
            });
        }
    });

    console.log("");
    console.log("  Listo.");
    console.log(`  ${viejo}  ->  ${nuevo}`);
    if (comerciosASincronizar.length > 0) {
        console.log(`  Comercios sincronizados: ${comerciosASincronizar.length}`);
    }
    if (admin) {
        console.log(`  Auditoria registrada a nombre de ${admin.email}`);
    } else {
        console.log("  OJO: no se encontro un admin para firmar la auditoria — el cambio NO quedo registrado.");
    }
    console.log("");
    console.log("  Que sigue: que la persona entre al portal, toque \"olvidaste tu");
    console.log("  contrasena\" y elija la suya. El link le llega al correo nuevo.");
    console.log("");
}

main()
    .catch((e) => {
        console.error("\nError:", e instanceof Error ? e.message : e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
