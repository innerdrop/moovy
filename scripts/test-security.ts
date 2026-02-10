// Test script for security fixes - run with: npx tsx scripts/test-security.ts
import http from "http";

const SOCKET_URL = "http://localhost:3001";

console.log("\n🧪 Testing Security Fixes...\n");

// Test 1: /emit endpoint protected (no CRON_SECRET)
console.log("━━━ Test 4: Socket /emit sin CRON_SECRET ━━━");
const emitData = JSON.stringify({ event: "test", room: "test", data: {} });
const emitReq = http.request(`${SOCKET_URL}/emit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(emitData) },
}, (res) => {
    let body = "";
    res.on("data", (chunk) => body += chunk);
    res.on("end", () => {
        if (res.statusCode === 401) {
            console.log(`✅ /emit rechazó sin CRON_SECRET → ${res.statusCode} ${body}`);
        } else {
            console.log(`❌ /emit NO rechazó → ${res.statusCode} ${body}`);
        }
        console.log("");

        // Test 2: /emit with correct CRON_SECRET
        console.log("━━━ Test 5: Socket /emit CON CRON_SECRET ━━━");
        const cronSecret = process.env.CRON_SECRET || "moovy-cron-secret-change-in-production";
        const emitReq2 = http.request(`${SOCKET_URL}/emit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(emitData),
                "Authorization": `Bearer ${cronSecret}`,
            },
        }, (res2) => {
            let body2 = "";
            res2.on("data", (chunk) => body2 += chunk);
            res2.on("end", () => {
                if (res2.statusCode === 200) {
                    console.log(`✅ /emit aceptó con CRON_SECRET → ${res2.statusCode} ${body2}`);
                } else {
                    console.log(`⚠️ /emit respondió → ${res2.statusCode} ${body2} (puede ser OK si no hay room/event válido)`);
                }
                console.log("");

                // Test 3: Zod validation on orders
                console.log("━━━ Test 6: Zod validation en /api/orders ━━━");
                const badOrder = JSON.stringify({ items: [] });
                const zodReq = http.request("http://localhost:3000/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(badOrder) },
                }, (res3) => {
                    let body3 = "";
                    res3.on("data", (chunk) => body3 += chunk);
                    res3.on("end", () => {
                        if (res3.statusCode === 400 || res3.statusCode === 401) {
                            console.log(`✅ Validación Zod rechazó datos inválidos → ${res3.statusCode} ${body3}`);
                        } else {
                            console.log(`❌ No validó → ${res3.statusCode} ${body3}`);
                        }
                        console.log("\n🏁 Tests completados!\n");
                        process.exit(0);
                    });
                });
                zodReq.on("error", (e) => { console.error("Error:", e.message); process.exit(1); });
                zodReq.write(badOrder);
                zodReq.end();
            });
        });
        emitReq2.on("error", (e) => { console.error("Error:", e.message); process.exit(1); });
        emitReq2.write(emitData);
        emitReq2.end();
    });
});
emitReq.on("error", (e) => {
    console.error("❌ No se pudo conectar al socket server. ¿Está corriendo npm run dev:full?");
    process.exit(1);
});
emitReq.write(emitData);
emitReq.end();
