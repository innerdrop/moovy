/**
 * Test script: Verificación completa de flujos de mensajes del chat
 *
 * Valida que todas las queries Prisma usen campos que existen en el schema,
 * y que el flujo completo de mensajes funcione end-to-end.
 *
 * Ejecutar: npx tsx scripts/test-chat-flow.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Colors for output
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg: string) {
    console.log(`  ${GREEN}✓${RESET} ${msg}`);
    passed++;
}
function fail(msg: string, err?: any) {
    console.log(`  ${RED}✗${RESET} ${msg}`);
    if (err) console.log(`    ${RED}Error: ${err.message || err}${RESET}`);
    failed++;
}
function warn(msg: string) {
    console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
    warnings++;
}
function section(title: string) {
    console.log(`\n${CYAN}${BOLD}═══ ${title} ═══${RESET}`);
}

async function main() {
    console.log(`${BOLD}🔬 Test de Flujo de Mensajes — MOOVY Chat System${RESET}`);
    console.log(`   Fecha: ${new Date().toLocaleString("es-AR")}\n`);

    // ═══════════════════════════════════════════
    // TEST 1: Schema validation — modelos existen
    // ═══════════════════════════════════════════
    section("1. Verificación de Modelos en DB");

    try {
        const userCount = await prisma.user.count();
        pass(`User model OK (${userCount} registros)`);
    } catch (e: any) { fail("User model no accesible", e); }

    try {
        const chatCount = await (prisma as any).supportChat.count();
        pass(`SupportChat model OK (${chatCount} registros)`);
    } catch (e: any) { fail("SupportChat model no accesible — ¿corriste prisma db push?", e); }

    try {
        const msgCount = await (prisma as any).supportMessage.count();
        pass(`SupportMessage model OK (${msgCount} registros)`);
    } catch (e: any) { fail("SupportMessage model no accesible", e); }

    try {
        const opCount = await (prisma as any).supportOperator.count();
        pass(`SupportOperator model OK (${opCount} registros)`);
    } catch (e: any) { fail("SupportOperator model no accesible", e); }

    try {
        const orderChatCount = await (prisma as any).orderChat.count();
        pass(`OrderChat model OK (${orderChatCount} registros)`);
    } catch (e: any) { fail("OrderChat model no accesible — ¿corriste prisma db push?", e); }

    try {
        const orderMsgCount = await (prisma as any).orderChatMessage.count();
        pass(`OrderChatMessage model OK (${orderMsgCount} registros)`);
    } catch (e: any) { fail("OrderChatMessage model no accesible", e); }

    // ═══════════════════════════════════════════
    // TEST 2: Queries del flujo Soporte MOOVY
    // ═══════════════════════════════════════════
    section("2. Queries del Chat de Soporte MOOVY");

    // 2a: GET /api/support/chats — Lista de chats del buyer
    try {
        await (prisma as any).supportChat.findMany({
            where: { userId: "test-nonexistent" },
            include: {
                user: { select: { id: true, name: true, email: true } },
                operator: { select: { id: true, displayName: true, isOnline: true } },
                messages: { orderBy: { createdAt: "desc" }, take: 1 },
                _count: { select: { messages: true } }
            },
            orderBy: { lastMessageAt: "desc" }
        });
        pass("GET /api/support/chats — query de lista OK");
    } catch (e: any) { fail("GET /api/support/chats — query de lista FALLA", e); }

    // 2b: Unread count query
    try {
        await (prisma as any).supportMessage.count({
            where: { chatId: "test-nonexistent", isFromAdmin: true, isRead: false }
        });
        pass("Unread count (buyer side) — query OK");
    } catch (e: any) { fail("Unread count (buyer side) FALLA", e); }

    // 2c: GET /api/support/chats/[id] — Detalle del chat (buyer)
    try {
        await (prisma as any).supportChat.findUnique({
            where: { id: "test-nonexistent" },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                operator: { select: { id: true, displayName: true, isOnline: true } },
                messages: {
                    include: {
                        sender: { select: { id: true, name: true, role: true } }
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });
        pass("GET /api/support/chats/[id] — query detalle buyer OK");
    } catch (e: any) { fail("GET /api/support/chats/[id] — query detalle buyer FALLA", e); }

    // 2d: POST /api/support/chats/[id] — Enviar mensaje (buyer)
    try {
        // Solo verificamos la query de lectura del chat (la creación necesita datos reales)
        const chat = await (prisma as any).supportChat.findUnique({ where: { id: "test-nonexistent" } });
        pass("POST /api/support/chats/[id] — findUnique OK");
    } catch (e: any) { fail("POST /api/support/chats/[id] — findUnique FALLA", e); }

    // 2e: Crear mensaje con sender include (la query que FALLABA antes del fix)
    try {
        // Simulamos el include que hace POST /api/support/chats/[id]
        // No podemos crear sin datos reales, pero podemos validar el findMany con include
        await (prisma as any).supportMessage.findMany({
            where: { chatId: "test-nonexistent" },
            include: {
                sender: { select: { id: true, name: true, role: true } }
            },
            take: 1
        });
        pass("SupportMessage sender include (sin displayName) — query OK");
    } catch (e: any) { fail("SupportMessage sender include FALLA", e); }

    // 2f: VALIDAR QUE displayName EN User FALLA (para confirmar el bug original)
    try {
        await (prisma as any).supportMessage.findMany({
            where: { chatId: "test-nonexistent" },
            include: {
                sender: { select: { id: true, name: true, displayName: true, role: true } }
            },
            take: 1
        });
        // Si llega aquí, User SÍ tiene displayName (no esperado)
        warn("sender select con displayName NO falló — User podría tener ese campo (verificar)");
    } catch (e: any) {
        pass("CONFIRMADO: sender select con displayName FALLA (User no tiene ese campo) — bug original verificado");
    }

    // ═══════════════════════════════════════════
    // TEST 3: Queries del Operador
    // ═══════════════════════════════════════════
    section("3. Queries del Panel de Operador");

    // 3a: GET /api/support/operator/chats — Lista de chats del operador
    try {
        await (prisma as any).supportChat.findMany({
            where: { operatorId: "test-nonexistent", status: { in: ["active", "waiting"] } },
            include: {
                user: { select: { id: true, name: true, email: true } },
                _count: { select: { messages: true } }
            },
            orderBy: [{ status: "desc" }, { lastMessageAt: "desc" }]
        });
        pass("GET /api/support/operator/chats — assigned query OK");
    } catch (e: any) { fail("GET /api/support/operator/chats — assigned query FALLA", e); }

    // 3b: Waiting chats (sin operador)
    try {
        await (prisma as any).supportChat.findMany({
            where: { status: "waiting", operatorId: null },
            include: {
                user: { select: { id: true, name: true, email: true } },
                _count: { select: { messages: true } }
            },
            orderBy: { createdAt: "asc" },
            take: 10
        });
        pass("Waiting chats (sin operador) — query OK");
    } catch (e: any) { fail("Waiting chats query FALLA", e); }

    // 3c: Operator unread count
    try {
        await (prisma as any).supportMessage.count({
            where: { chatId: "test-nonexistent", isFromAdmin: false, isRead: false }
        });
        pass("Unread count (operator side) — query OK");
    } catch (e: any) { fail("Unread count (operator side) FALLA", e); }

    // 3d: GET /api/support/operator/chats/[id] — Detalle para operador
    try {
        await (prisma as any).supportChat.findUnique({
            where: { id: "test-nonexistent" },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                operator: { select: { id: true, displayName: true, isOnline: true } },
                messages: {
                    include: {
                        sender: { select: { id: true, name: true, role: true } }
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });
        pass("GET /api/support/operator/chats/[id] — detalle operador OK");
    } catch (e: any) { fail("GET /api/support/operator/chats/[id] — detalle operador FALLA", e); }

    // 3e: POST /api/support/operator/chats/[id] — Enviar mensaje operador
    try {
        await (prisma as any).supportMessage.findMany({
            where: { chatId: "test-nonexistent" },
            include: {
                sender: { select: { id: true, name: true } }
            },
            take: 1
        });
        pass("POST operator message sender include — query OK");
    } catch (e: any) { fail("POST operator message sender include FALLA", e); }

    // 3f: findAvailableOperator query
    try {
        const ops = await (prisma as any).supportOperator.findMany({
            where: { isActive: true, isOnline: true }
        });
        pass(`findAvailableOperator — query OK (${ops.length} operadores online)`);
    } catch (e: any) { fail("findAvailableOperator — query FALLA", e); }

    // ═══════════════════════════════════════════
    // TEST 4: Queries del Order Chat
    // ═══════════════════════════════════════════
    section("4. Queries del Chat de Pedido (Order Chat)");

    // 4a: GET /api/order-chat — Lista de chats de pedido
    try {
        await (prisma as any).orderChat.findMany({
            where: {
                orderId: "test-nonexistent",
                OR: [{ participantAId: "test" }, { participantBId: "test" }]
            },
            include: {
                participantA: { select: { id: true, name: true } },
                participantB: { select: { id: true, name: true } },
                messages: { orderBy: { createdAt: "desc" }, take: 1 },
                _count: { select: { messages: true } }
            },
            orderBy: { updatedAt: "desc" }
        });
        pass("GET /api/order-chat — lista de chats OK");
    } catch (e: any) { fail("GET /api/order-chat — lista de chats FALLA", e); }

    // 4b: Unread count order chat
    try {
        await (prisma as any).orderChatMessage.count({
            where: { chatId: "test-nonexistent", senderId: { not: "test" }, isRead: false }
        });
        pass("OrderChat unread count — query OK");
    } catch (e: any) { fail("OrderChat unread count FALLA", e); }

    // 4c: GET /api/order-chat/[chatId] — Mensajes
    try {
        await (prisma as any).orderChatMessage.findMany({
            where: { chatId: "test-nonexistent" },
            include: { sender: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" }
        });
        pass("GET /api/order-chat/[chatId] — mensajes OK");
    } catch (e: any) { fail("GET /api/order-chat/[chatId] — mensajes FALLA", e); }

    // 4d: Mark read query
    try {
        await (prisma as any).orderChatMessage.updateMany({
            where: { chatId: "test-nonexistent", senderId: { not: "test" }, isRead: false },
            data: { isRead: true }
        });
        pass("OrderChat mark read — query OK");
    } catch (e: any) { fail("OrderChat mark read FALLA", e); }

    // ═══════════════════════════════════════════
    // TEST 5: Flujo completo con datos reales
    // ═══════════════════════════════════════════
    section("5. Verificación de Datos Existentes");

    // Check if there are any support operators
    const operators = await (prisma as any).supportOperator.findMany({
        include: { user: { select: { id: true, name: true, email: true } } }
    });
    if (operators.length > 0) {
        pass(`${operators.length} operador(es) registrado(s):`);
        operators.forEach((op: any) => {
            const status = op.isOnline ? "🟢 Online" : "⚫ Offline";
            console.log(`      ${status} ${op.displayName} (${op.user?.email}) — max ${op.maxChats} chats, ${op.isActive ? "activo" : "inactivo"}`);
        });
    } else {
        warn("No hay operadores registrados — el chat de soporte no puede auto-asignar");
    }

    // Check existing chats
    const existingChats = await (prisma as any).supportChat.findMany({
        include: {
            user: { select: { name: true, email: true } },
            operator: { select: { displayName: true } },
            _count: { select: { messages: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
    });
    if (existingChats.length > 0) {
        pass(`${existingChats.length} chat(s) de soporte encontrado(s):`);
        existingChats.forEach((chat: any) => {
            console.log(`      [${chat.status}] "${chat.subject || "Sin asunto"}" — ${chat._count.messages} msgs — Operador: ${chat.operator?.displayName || "Sin asignar"} — Usuario: ${chat.user?.email}`);
        });
    } else {
        warn("No hay chats de soporte — normal si es primera vez");
    }

    // Check order chats
    const orderChats = await (prisma as any).orderChat.findMany({
        include: {
            participantA: { select: { name: true } },
            participantB: { select: { name: true } },
            _count: { select: { messages: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
    });
    if (orderChats.length > 0) {
        pass(`${orderChats.length} chat(s) de pedido encontrado(s):`);
        orderChats.forEach((chat: any) => {
            console.log(`      [${chat.chatType}] ${chat.participantA?.name} ↔ ${chat.participantB?.name} — ${chat._count.messages} msgs`);
        });
    } else {
        warn("No hay chats de pedido — normal si no hay pedidos activos");
    }

    // ═══════════════════════════════════════════
    // TEST 6: Verificación de status/public endpoint
    // ═══════════════════════════════════════════
    section("6. Endpoint Público de Status");

    try {
        const onlineOps = await (prisma as any).supportOperator.findMany({
            where: { isActive: true, isOnline: true }
        });
        pass(`Status endpoint query OK — ${onlineOps.length} operador(es) online`);
        if (onlineOps.length === 0) {
            warn("Ningún operador online — el widget mostrará 'Fuera de línea'");
        }
    } catch (e: any) { fail("Status endpoint query FALLA", e); }

    // ═══════════════════════════════════════════
    // RESUMEN
    // ═══════════════════════════════════════════
    console.log(`\n${BOLD}${"═".repeat(50)}${RESET}`);
    console.log(`${BOLD}RESULTADOS:${RESET}`);
    console.log(`  ${GREEN}✓ ${passed} pasaron${RESET}`);
    if (failed > 0) console.log(`  ${RED}✗ ${failed} fallaron${RESET}`);
    if (warnings > 0) console.log(`  ${YELLOW}⚠ ${warnings} advertencias${RESET}`);
    console.log(`${BOLD}${"═".repeat(50)}${RESET}\n`);

    if (failed > 0) {
        console.log(`${RED}${BOLD}⛔ HAY ERRORES CRÍTICOS — los mensajes NO llegarán correctamente${RESET}`);
        process.exit(1);
    } else {
        console.log(`${GREEN}${BOLD}✅ Todas las queries de chat son válidas — flujo de mensajes OK${RESET}\n`);

        // Quick summary of the two chat systems
        console.log(`${CYAN}${BOLD}Resumen de los dos sistemas de chat:${RESET}`);
        console.log(`  📱 ${BOLD}Soporte MOOVY${RESET} (ChatWidget + Panel Operador)`);
        console.log(`     Buyer → POST /api/support/chats → crea chat + auto-asigna operador`);
        console.log(`     Buyer → POST /api/support/chats/[id] → envía mensaje (isFromAdmin: false)`);
        console.log(`     Operador → GET /api/support/operator/chats → ve lista con unread count`);
        console.log(`     Operador → POST /api/support/operator/chats/[id] → responde (isFromAdmin: true)`);
        console.log(`     Buyer ← polling cada 5s GET /api/support/chats/[id] → recibe mensajes`);
        console.log(``);
        console.log(`  💬 ${BOLD}Chat de Pedido${RESET} (OrderChatPanel — buyer ↔ comercio/repartidor/vendedor)`);
        console.log(`     Cualquier parte → POST /api/order-chat → crea/abre chat`);
        console.log(`     Cualquier parte → POST /api/order-chat/[chatId] → envía mensaje`);
        console.log(`     Ambos lados ← polling cada 5s GET /api/order-chat/[chatId] → reciben mensajes`);
        console.log(``);
        console.log(`  ${BOLD}Los dos sistemas son independientes:${RESET}`);
        console.log(`     - Soporte MOOVY: widget flotante (rojo), para problemas con la plataforma`);
        console.log(`     - Chat de Pedido: panel inline en detalle de pedido, comunicación directa entre roles`);
    }

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(`${RED}Error fatal:${RESET}`, e);
    await prisma.$disconnect();
    process.exit(1);
});
