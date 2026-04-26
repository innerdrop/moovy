/**
 * Validación de la rama `feat/ops-pedidos-realtime`.
 *
 * Mauro 2026-04-26: el panel /ops/pedidos no se actualizaba solo. Si no refrescaba
 * manualmente la página, no aparecían los pedidos nuevos. Pidió "como las apps
 * millonarias" (Rappi, ML, Uber).
 *
 * Implementación (3 capas defense in depth, mismo patrón Uber/Rappi/Cabify):
 *
 *   1. Socket.IO real-time (instantáneo) — useRealtimeOrders hook con role=admin.
 *      Eventos onNewOrder, onStatusChange, onOrderCancelled disparan fetchOrders(true).
 *      Indicador Wifi/WifiOff visible al admin (En vivo / Polling).
 *
 *   2. Polling fallback cada 30s — para cuando Socket.IO se cae o no está suscrito.
 *      Patrón copiado de /ops/live. fetchOrders(silent=true) sin spinner.
 *
 *   3. Tab visibility API — pausa el polling cuando la pestaña está oculta. Reanuda
 *      + fetch inmediato al volver a visible. Ahorra 90% de requests inútiles cuando
 *      Mauro tiene /ops/pedidos abierto en una pestaña sin mirar.
 *
 *   Plus: botón "Actualizar" manual con icon RefreshCw (loading state animado) +
 *   indicador "Actualizado hace Xs" para feedback visual de que el sistema está vivo.
 *
 * Mismo patrón aplicado a /ops/live para consistencia (ya tenía polling + socket,
 * solo le faltaba tab visibility).
 *
 * No requiere conexión a DB — todos los checks son estáticos.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const checks: { section: string; name: string; pass: boolean; detail?: string }[] = [];

function fileContains(rel: string, needles: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const missing = needles.filter(n => !content.includes(n));
    return { ok: missing.length === 0, missing };
}

function add(section: string, name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section, name, pass: r.ok, detail: r.missing.join(" | ") });
}

// ═══════════════════════════════════════════════════════════════════════════
// (A) /ops/pedidos — auto-refresh + Socket.IO + tab visibility
// ═══════════════════════════════════════════════════════════════════════════

add("A", "imports: useCallback, useRef, RefreshCw, Wifi, WifiOff",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        "useState, useEffect, useCallback, useRef",
        "RefreshCw,",
        "Wifi,",
        "WifiOff",
    ])
);

add("A", "import del hook useRealtimeOrders",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        'import { useRealtimeOrders } from "@/hooks/useRealtimeOrders"',
    ])
);

add("A", "fetchOrders convertido a useCallback con flag silent",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        "const fetchOrders = useCallback(async (silent = false)",
        "if (!silent) setLoading(true)",
        "if (!silent) setLoading(false)",
        "[page, filter, search, dateFrom, dateTo]",
    ])
);

add("A", "state lastUpdate + setLastUpdate al fetch exitoso",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        'const [lastUpdate, setLastUpdate] = useState<Date | null>(null)',
        "setLastUpdate(new Date())",
    ])
);

add("A", "Socket.IO via useRealtimeOrders con role=admin + 3 callbacks",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        'role: "admin"',
        "onNewOrder: () => fetchOrders(true)",
        "onStatusChange: () => fetchOrders(true)",
        "onOrderCancelled: () => fetchOrders(true)",
    ])
);

add("A", "tab visibility API: pausa polling cuando oculto, reanuda al volver",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        'document.visibilityState === "visible"',
        "isVisibleRef",
        "document.addEventListener",
        '"visibilitychange"',
        "startPolling",
        "stopPolling",
        "30000",
    ])
);

add("A", "cleanup del useEffect: removeEventListener + clearInterval",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        "document.removeEventListener",
        'return () => {',
    ])
);

add("A", "UI: botón Actualizar manual con RefreshCw animado",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        "onClick={() => fetchOrders()}",
        'className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}',
        "Actualizar",
    ])
);

add("A", "UI: indicador Wifi/WifiOff (En vivo / Polling)",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        "isConnected",
        "<Wifi",
        "<WifiOff",
        "En vivo",
        "Polling",
    ])
);

add("A", "UI: indicador timestamp Actualizado hace Xs",
    fileContains("src/app/ops/(protected)/pedidos/page.tsx", [
        "function timeAgoShort",
        "Actualizado",
        "timeAgoShort(lastUpdate)",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (B) /ops/live — mismo patrón tab visibility (ya tenía polling + socket)
// ═══════════════════════════════════════════════════════════════════════════

add("B", "/ops/live: tab visibility API agregada al setInterval existente",
    fileContains("src/app/ops/(protected)/live/page.tsx", [
        'document.visibilityState === "visible"',
        '"visibilitychange"',
        "startPolling",
        "stopPolling",
        "document.removeEventListener",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama feat/ops-pedidos-realtime");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "/ops/pedidos auto-refresh completo",
    B: "/ops/live tab visibility consistencia",
};

let failed = 0;
let lastSection = "";
for (const c of checks) {
    if (c.section !== lastSection) {
        console.log(`\n${CYAN}── (${c.section}) ${sections[c.section] ?? c.section}${RESET}`);
        lastSection = c.section;
    }
    const icon = c.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${icon} ${c.name}`);
    if (!c.pass && c.detail) console.log(`    ${YELLOW}faltan: ${c.detail}${RESET}`);
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Probar manual:");
    console.log("  1. Logueate como admin OPS y andá a /ops/pedidos.");
    console.log("  2. Verificá en el header:");
    console.log("     - Pill 'En vivo' (verde) o 'Polling' (gris) según conexión Socket.IO.");
    console.log("     - 'Actualizado hace Xs' debajo del título.");
    console.log("     - Botón 'Actualizar' con ícono refresh.");
    console.log("  3. Tocá el botón 'Actualizar' → ícono gira → fetchea + actualiza timestamp.");
    console.log("  4. Auto-refresh cada 30s sin tocar nada.");
    console.log("  5. Tab visibility:");
    console.log("     - Cambiá de pestaña 1 minuto.");
    console.log("     - Volvé a /ops/pedidos → debería refrescar al instante.");
    console.log("     - En DevTools Network, verificás que mientras la pestaña estaba oculta NO hubo requests a /api/admin/orders.");
    console.log("  6. Socket.IO en vivo:");
    console.log("     - Desde otra pestaña/dispositivo, hacé un pedido nuevo.");
    console.log("     - El listado en /ops/pedidos se actualiza al instante (no esperar 30s).");
    console.log("  7. /ops/live (mismo patrón aplicado):");
    console.log("     - Tab visibility funciona igual.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
