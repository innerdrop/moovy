/**
 * Validación de la rama `fix/driver-presence-detection`.
 *
 * Bug B detectado en testing 2026-04-26: drivers que cerraban su browser sin
 * tocar "DESCONECTAR" quedaban con isOnline=true en DB. El buyer veía "hay
 * drivers" cuando en realidad no había nadie. El assignment engine asignaba
 * pedidos a drivers fantasmas → timeout → retry → eventualmente auto-cancel.
 * Buyer esperaba 30 minutos para nada. Reputacional: en Ushuaia se sabe.
 *
 * Solución: 3 capas defense in depth (mismo patrón Uber/Rappi/Cabify):
 *
 *   (1) Socket.IO disconnect handler con debounce 30s — instantáneo.
 *       En scripts/socket-server.ts: cuando un socket de driver se desconecta,
 *       agendamos setTimeout 30s. Si reconecta antes (driver_online), lo
 *       cancelamos. Si no, marca isOnline=false + availabilityStatus=
 *       FUERA_DE_SERVICIO en DB. 30s evita falsos positivos por señal débil
 *       en Ushuaia.
 *
 *   (2) Cron POST /api/cron/driver-presence-check — defense in depth.
 *       Cada 60s busca drivers con isOnline=true pero lastLocationAt < now-90s
 *       (o NULL). Marca offline + audit log DRIVER_AUTO_OFFLINE_BY_PRESENCE.
 *       Catch-all si Capa 1 falla (server reinicia, race condition).
 *
 *   (3) navigator.sendBeacon('pagehide') — cierre intencional rápido.
 *       En el driver dashboard: cuando el browser dispara pagehide o
 *       beforeunload, mandamos beacon a POST /api/driver/heartbeat-disconnect
 *       (endpoint específico para sendBeacon, sin validaciones de GPS).
 *       Funciona aún en crashes, OS mata proceso, mobile background kill.
 *
 * Las 3 capas se complementan: Capa 1 detecta cierres normales rápidos, Capa 2
 * cubre casos donde Capa 1 falla, Capa 3 es la primera en disparar para cierre
 * deliberado.
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
// (A) Capa 1 — Socket.IO disconnect handler con debounce
// ═══════════════════════════════════════════════════════════════════════════

add("A", "socket-server: Map driverDisconnectTimers + constante debounce",
    fileContains("scripts/socket-server.ts", [
        "driverDisconnectTimers = new Map<string, NodeJS.Timeout>",
        "DRIVER_OFFLINE_DEBOUNCE_MS = 30_000",
    ])
);

add("A", "socket-server: driver_online cancela timeout pendiente al reconectar",
    fileContains("scripts/socket-server.ts", [
        "driverDisconnectTimers.get(driverId)",
        "clearTimeout(pendingOffline)",
        "reconectó antes del debounce",
    ])
);

add("A", "socket-server: disconnect agenda setTimeout para marcar offline",
    fileContains("scripts/socket-server.ts", [
        "setTimeout(async () =>",
        "isOnline: false",
        'availabilityStatus: "FUERA_DE_SERVICIO"',
        "DRIVER_OFFLINE_DEBOUNCE_MS",
    ])
);

add("A", "socket-server: disconnect cancela timeout previo si existía",
    fileContains("scripts/socket-server.ts", [
        "previousTimer",
        "if (previousTimer) clearTimeout(previousTimer)",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (B) Capa 2 — Cron driver-presence-check
// ═══════════════════════════════════════════════════════════════════════════

add("B", "endpoint /api/cron/driver-presence-check existe + auth CRON_SECRET",
    fileContains("src/app/api/cron/driver-presence-check/route.ts", [
        "export async function POST",
        "verifyBearerToken(token, process.env.CRON_SECRET)",
        "Unauthorized",
    ])
);

add("B", "cron: PRESENCE_TIMEOUT_MS = 90s + busca isOnline=true sin GPS reciente",
    fileContains("src/app/api/cron/driver-presence-check/route.ts", [
        "PRESENCE_TIMEOUT_MS = 90_000",
        "isOnline: true",
        "lastLocationAt: { lt: cutoff }",
        "lastLocationAt: null",
    ])
);

add("B", "cron: marca offline + availabilityStatus FUERA_DE_SERVICIO",
    fileContains("src/app/api/cron/driver-presence-check/route.ts", [
        "isOnline: false",
        'availabilityStatus: "FUERA_DE_SERVICIO"',
    ])
);

add("B", "cron: audit log DRIVER_AUTO_OFFLINE_BY_PRESENCE por cada ghost",
    fileContains("src/app/api/cron/driver-presence-check/route.ts", [
        'action: "DRIVER_AUTO_OFFLINE_BY_PRESENCE"',
        "secondsSinceLastLocation",
        '"no_gps_for_90s"',
    ])
);

add("B", "cron: envuelto en recordCronRun para healthcheck OPS",
    fileContains("src/app/api/cron/driver-presence-check/route.ts", [
        "recordCronRun",
        '"driver-presence-check"',
    ])
);

add("B", "cron registrado en CRON_EXPECTATIONS con maxHours=1",
    fileContains("src/lib/cron-health.ts", [
        '"driver-presence-check"',
        "maxHours: 1",
        "Detección de drivers fantasmas",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (C) Capa 3 — sendBeacon en pagehide del driver dashboard
// ═══════════════════════════════════════════════════════════════════════════

add("C", "endpoint /api/driver/heartbeat-disconnect existe (POST) + autenticado",
    fileContains("src/app/api/driver/heartbeat-disconnect/route.ts", [
        "export async function POST",
        "requireDriverApi",
    ])
);

add("C", "heartbeat-disconnect: idempotente (updateMany WHERE isOnline=true)",
    fileContains("src/app/api/driver/heartbeat-disconnect/route.ts", [
        "updateMany",
        "isOnline: true",
        "isOnline: false",
        'availabilityStatus: "FUERA_DE_SERVICIO"',
    ])
);

add("C", "heartbeat-disconnect: audit log DRIVER_DISCONNECT_BEACON",
    fileContains("src/app/api/driver/heartbeat-disconnect/route.ts", [
        'action: "DRIVER_DISCONNECT_BEACON"',
        '"browser_pagehide_beacon"',
    ])
);

add("C", "driver dashboard: useEffect monta sendBeacon en pagehide + beforeunload",
    fileContains("src/app/repartidor/(protected)/dashboard/page.tsx", [
        "navigator.sendBeacon",
        "/api/driver/heartbeat-disconnect",
        '"pagehide"',
        '"beforeunload"',
    ])
);

add("C", "driver dashboard: el effect solo escucha si isOnline=true (no spamea)",
    fileContains("src/app/repartidor/(protected)/dashboard/page.tsx", [
        "if (!isOnline) return",
        "[isOnline]",
    ])
);

add("C", "driver dashboard: cleanup del effect (removeEventListener)",
    fileContains("src/app/repartidor/(protected)/dashboard/page.tsx", [
        "window.removeEventListener",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/driver-presence-detection");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Capa 1 — Socket.IO disconnect debounce",
    B: "Capa 2 — Cron driver-presence-check",
    C: "Capa 3 — sendBeacon en pagehide",
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
    console.log("Pendiente post-merge:");
    console.log("  Registrar en el runner externo de crons:");
    console.log("    POST /api/cron/driver-presence-check");
    console.log("    Authorization: Bearer ${CRON_SECRET}");
    console.log("    Frecuencia: cada 60 segundos (1 minuto)");
    console.log("");
    console.log("Probar manual:");
    console.log("  Capa 1 (socket disconnect debounce):");
    console.log("    1. Logueate como driver, conectate (botón CONECTAR).");
    console.log("    2. Verificá en DB: isOnline=true.");
    console.log("    3. Cerrá la pestaña del driver dashboard.");
    console.log("    4. Esperá 30 segundos.");
    console.log("    5. Verificá en DB: isOnline=false, availabilityStatus=FUERA_DE_SERVICIO.");
    console.log("    6. Variante: cerrar la pestaña y reabrir antes de 30s — el debounce");
    console.log("       se cancela al reconectar (driver_online), driver sigue online.");
    console.log("");
    console.log("  Capa 2 (cron presence-check):");
    console.log("    1. Driver online sin GPS hace >90s (manualmente seteá lastLocationAt");
    console.log("       a hace 5 minutos en DB).");
    console.log("    2. Disparar el cron: curl POST /api/cron/driver-presence-check con");
    console.log("       Bearer ${CRON_SECRET}.");
    console.log("    3. Verificá DB: driver marcado offline + audit log con action");
    console.log("       DRIVER_AUTO_OFFLINE_BY_PRESENCE.");
    console.log("");
    console.log("  Capa 3 (sendBeacon pagehide):");
    console.log("    1. Driver online + dashboard abierto.");
    console.log("    2. En DevTools Network, filtrar por 'heartbeat'.");
    console.log("    3. Cerrar la pestaña del driver dashboard.");
    console.log("    4. En la pestaña Network del browser, debería verse un request POST");
    console.log("       a /api/driver/heartbeat-disconnect (puede aparecer brevemente).");
    console.log("    5. Verificá en DB: isOnline=false al instante (no esperar 30s).");
    console.log("    6. Verificá audit log: action DRIVER_DISCONNECT_BEACON.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
