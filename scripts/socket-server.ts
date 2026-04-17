// Socket.io server for real-time driver tracking
// Run with: npx tsx scripts/socket-server.ts
// This runs alongside Next.js on port 3001

import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";

const PORT = process.env.SOCKET_PORT || 3001;
const NEXT_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ── Security: No fallback secrets — fail fast if not configured ─────────────
const _socketSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const _cronSecret = process.env.CRON_SECRET;

if (!_socketSecret) {
    console.error("FATAL: AUTH_SECRET or NEXTAUTH_SECRET must be set. Cannot start socket server.");
    process.exit(1);
}
if (!_cronSecret) {
    console.error("FATAL: CRON_SECRET must be set. Cannot start socket server.");
    process.exit(1);
}

// After validation, these are guaranteed to be strings
const SOCKET_SECRET: string = _socketSecret;
const CRON_SECRET: string = _cronSecret;

// ── CORS: Whitelist allowed origins ─────────────────────────────────────────
const ALLOWED_ORIGINS = [
    NEXT_URL,
    "http://localhost:3000",
    "https://somosmoovy.com",
    "https://www.somosmoovy.com",
].filter(Boolean);

// ─── Token Verification ─────────────────────────────────────────────────────

/**
 * Verify a socket token signed by /api/auth/socket-token
 * Token format: base64url(JSON payload) + "." + HMAC-SHA256 signature
 */
function verifySocketToken(token: string): { userId: string; role: string } | null {
    try {
        const [payloadBase64, signature] = token.split(".");
        if (!payloadBase64 || !signature) return null;

        const expectedSignature = crypto
            .createHmac("sha256", SOCKET_SECRET)
            .update(payloadBase64)
            .digest("base64url");

        if (signature !== expectedSignature) return null;

        const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());

        if (payload.exp < Date.now()) return null;

        return { userId: payload.userId, role: payload.role };
    } catch {
        return null;
    }
}

// ─── Cron Health Tracking ────────────────────────────────────────────────────

interface CronStatus {
    lastRunAt: string | null;
    lastSuccessAt: string | null;
    consecutiveFailures: number;
    lastError: string | null;
}

const cronHealth: Record<string, CronStatus> = {
    "assignment-timeout": { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, lastError: null },
    "merchant-timeout":   { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, lastError: null },
    "seller-resume":      { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, lastError: null },
    "scheduled-notify":   { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, lastError: null },
    "close-auctions":     { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, lastError: null },
};

function ensureCronEntry(name: string) {
    if (!cronHealth[name]) {
        cronHealth[name] = { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, lastError: null };
    }
}

function cronSuccess(name: string) {
    ensureCronEntry(name);
    const now = new Date().toISOString();
    cronHealth[name].lastRunAt = now;
    cronHealth[name].lastSuccessAt = now;
    cronHealth[name].consecutiveFailures = 0;
    cronHealth[name].lastError = null;
}

function cronFailure(name: string, error: string) {
    ensureCronEntry(name);
    cronHealth[name].lastRunAt = new Date().toISOString();
    cronHealth[name].consecutiveFailures++;
    cronHealth[name].lastError = error;
    // Log warning if 3+ consecutive failures
    if (cronHealth[name].consecutiveFailures >= 3) {
        console.error(`[HEALTH WARNING] Cron "${name}" has ${cronHealth[name].consecutiveFailures} consecutive failures: ${error}`);
    }
}

const startedAt = new Date().toISOString();

// ─── HTTP & Socket.IO Server ─────────────────────────────────────────────────

const httpServer = createServer((req, res) => {
    // Health check endpoint for external monitoring
    if (req.method === "GET" && req.url === "/health") {
        const connectedDrivers = driverSockets.size;
        const cronStatuses = Object.entries(cronHealth).map(([name, status]) => ({
            name,
            ...status,
            healthy: status.consecutiveFailures < 3,
        }));
        const allCronsHealthy = cronStatuses.every(c => c.healthy);

        const body = JSON.stringify({
            status: allCronsHealthy ? "ok" : "degraded",
            uptime: startedAt,
            connectedDrivers,
            crons: cronStatuses,
        });

        res.writeHead(allCronsHealthy ? 200 : 503, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        });
        res.end(body);
        return;
    }
});

const io = new Server(httpServer, {
    cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
                callback(null, true);
            } else {
                console.warn(`[Socket] CORS rejected origin: ${origin}`);
                callback(new Error("CORS not allowed"));
            }
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Namespace for logistics/tracking
const logistica = io.of("/logistica");

// Track active driver connections and their current order
const driverSockets = new Map<string, string>(); // driverId -> socketId
const orderDrivers = new Map<string, string>(); // orderId -> driverId

// ─── Authentication Middleware ───────────────────────────────────────────────

logistica.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        console.warn(`[Socket] Connection rejected: no token provided (${socket.id})`);
        return next(new Error("Authentication required"));
    }

    const decoded = verifySocketToken(token);
    if (!decoded) {
        console.warn(`[Socket] Connection rejected: invalid/expired token (${socket.id})`);
        return next(new Error("Invalid or expired token"));
    }

    // Attach user data to socket for later use
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;

    console.log(`[Socket] Authenticated: ${decoded.userId} (${decoded.role})`);
    next();
});

// ─── Socket Event Handlers ──────────────────────────────────────────────────

logistica.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} | User: ${socket.data.userId} | Role: ${socket.data.role}`);

    // ── Driver Events (DRIVER role only) ────────────────────────────────────

    socket.on("driver_online", (driverId: string) => {
        if (socket.data.role !== "DRIVER" && socket.data.role !== "ADMIN") {
            console.warn(`[Socket] Unauthorized driver_online from ${socket.data.role}`);
            return;
        }
        console.log(`[Socket] Driver online: ${driverId}`);
        driverSockets.set(driverId, socket.id);
        socket.join(`driver:${driverId}`);
    });

    socket.on("start_delivery", ({ orderId, driverId }: { orderId: string; driverId: string }) => {
        if (socket.data.role !== "DRIVER" && socket.data.role !== "ADMIN") {
            console.warn(`[Socket] Unauthorized start_delivery from ${socket.data.role}`);
            return;
        }
        console.log(`[Socket] Driver ${driverId} started delivery for order ${orderId}`);
        orderDrivers.set(orderId, driverId);
        socket.join(`order:${orderId}`);
    });

    socket.on("actualizar_posicion", ({ driverId, lat, lng, orderId, heading, speed }: any) => {
        if (socket.data.role !== "DRIVER" && socket.data.role !== "ADMIN") {
            console.warn(`[Socket] Unauthorized actualizar_posicion from ${socket.data.role}`);
            return;
        }

        // Broadcast to order tracking clients
        if (orderId) {
            logistica.to(`order:${orderId}`).emit("posicion_repartidor", {
                driverId,
                lat,
                lng,
                heading,
                speed,
                timestamp: Date.now(),
            });
        }

        // Broadcast to admin tracking room
        logistica.to("admin:tracking").emit("driver_position", {
            driverId,
            lat,
            lng,
            orderId,
            heading,
            speed,
            timestamp: Date.now(),
        });
    });

    socket.on("pedido_entregado", ({ orderId }: { orderId: string }) => {
        if (socket.data.role !== "DRIVER" && socket.data.role !== "ADMIN") {
            console.warn(`[Socket] Unauthorized pedido_entregado from ${socket.data.role}`);
            return;
        }
        console.log(`[Socket] Order ${orderId} delivered`);
        logistica.to(`order:${orderId}`).emit("pedido_completado", { orderId });
        logistica.to("admin:orders").emit("order_status_changed", {
            orderId,
            status: "DELIVERED",
        });
        orderDrivers.delete(orderId);
    });

    // ── Customer/Public Events (any authenticated user) ─────────────────────

    socket.on("track_order", (orderId: string) => {
        console.log(`[Socket] Client tracking order: ${orderId}`);
        socket.join(`order:${orderId}`);
    });

    // ── Merchant Events (MERCHANT role only) ────────────────────────────────

    socket.on("join_merchant_room", (merchantId: string) => {
        if (socket.data.role !== "MERCHANT" && socket.data.role !== "ADMIN") {
            console.warn(`[Socket] Unauthorized join_merchant_room from ${socket.data.role}`);
            return;
        }
        console.log(`[Socket] Merchant ${merchantId} joined room`);
        socket.join(`merchant:${merchantId}`);
    });

    // ── Customer Room (USER role) ───────────────────────────────────────────

    socket.on("join_customer_room", (userId: string) => {
        console.log(`[Socket] Customer ${userId} joined room`);
        socket.join(`customer:${userId}`);
        socket.data.userId = userId;
        socket.data.role = "customer";
    });

    // ── Auction Events (any authenticated user) ─────────────────────────────

    socket.on("join_auction", (listingId: string) => {
        console.log(`[Socket] Client joined auction room: ${listingId}`);
        socket.join(`auction:${listingId}`);
    });

    socket.on("leave_auction", (listingId: string) => {
        console.log(`[Socket] Client left auction room: ${listingId}`);
        socket.leave(`auction:${listingId}`);
    });

    // ── Admin Events (ADMIN role only) ──────────────────────────────────────

    socket.on("join_admin_orders", () => {
        if (socket.data.role !== "ADMIN") {
            console.warn(`[Socket] Unauthorized join_admin_orders from ${socket.data.role}`);
            return;
        }
        console.log(`[Socket] Admin joined orders room`);
        socket.join("admin:orders");
    });

    socket.on("join_admin_tracking", () => {
        if (socket.data.role !== "ADMIN") {
            console.warn(`[Socket] Unauthorized join_admin_tracking from ${socket.data.role}`);
            return;
        }
        socket.join("admin:tracking");
    });

    // ── Disconnect ──────────────────────────────────────────────────────────

    socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        // Clean up driver mapping
        for (const [driverId, socketId] of driverSockets.entries()) {
            if (socketId === socket.id) {
                driverSockets.delete(driverId);
                break;
            }
        }
    });
});

// ─── HTTP Endpoint for Internal API Calls ────────────────────────────────────
// Protected with CRON_SECRET — only the Next.js server should call this

httpServer.on("request", (req, res) => {
    // CORS headers — restrict to known origins
    const reqOrigin = req.headers.origin || "";
    const allowedOrigin = ALLOWED_ORIGINS.find(o => reqOrigin.startsWith(o)) || NEXT_URL;
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/emit") {
        // ── Verify Authorization (timing-safe) ─────────────────────────
        const authHeader = req.headers.authorization;
        const providedToken = authHeader?.replace("Bearer ", "") || "";
        const tokenBuffer = Buffer.from(providedToken, "utf-8");
        const secretBuffer = Buffer.from(CRON_SECRET, "utf-8");
        const isValidToken = tokenBuffer.length === secretBuffer.length && crypto.timingSafeEqual(tokenBuffer, secretBuffer);
        if (!authHeader || !isValidToken) {
            console.warn(`[Socket HTTP] Unauthorized /emit attempt from ${req.socket.remoteAddress}`);
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return;
        }

        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
            try {
                const { event, room, data } = JSON.parse(body);

                if (room) {
                    logistica.to(room).emit(event, data);
                } else {
                    logistica.emit(event, data);
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
        });
    } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Moovy Socket.io Server - Port " + PORT);
    }
});

// ─── Start Server ────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🚀 Moovy Socket.io Server Started                ║
║         🔒 Authentication: ENABLED                       ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(50)}║
║  Namespace: /logistica                                    ║
║  CORS: ${NEXT_URL.padEnd(48)}║
╠═══════════════════════════════════════════════════════════╣
║  ⏱  Cron: assignment-timeout    every 15s                ║
║  ⏱  Cron: merchant-timeout      every 60s                ║
║  ⏱  Cron: seller-resume         every 5 min              ║
║  ⏱  Cron: scheduled-notify      every 5 min              ║
║  ⏱  Cron: close-auctions       every 60s                ║
╚═══════════════════════════════════════════════════════════╝
  `);

    // ─── Cron: Assignment Timeout (every 15s) ─────────────────────────────
    // Process expired assignment offers
    setInterval(async () => {
        try {
            const res = await fetch(`${NEXT_URL}/api/logistics/timeout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CRON_SECRET}`
                }
            });
            if (res.ok) {
                cronSuccess("assignment-timeout");
                const data = await res.json();
                if (data.processed > 0) {
                    console.log(`[Cron] Processed ${data.processed} expired assignment(s)`);
                }
            } else {
                cronFailure("assignment-timeout", `HTTP ${res.status}`);
            }
        } catch (e: any) {
            cronFailure("assignment-timeout", e.message || "fetch error");
        }
    }, 15_000);

    // ─── Cron: Merchant Timeout (every 60s) ─────────────────────────────
    // Auto-cancel PENDING orders not confirmed by merchants
    setInterval(async () => {
        try {
            const res = await fetch(`${NEXT_URL}/api/cron/merchant-timeout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CRON_SECRET}`
                }
            });
            if (res.ok) {
                cronSuccess("merchant-timeout");
                const data = await res.json();
                if (data.cancelled > 0) {
                    console.log(`[Cron] Merchant timeout: cancelled ${data.cancelled} order(s)`);
                }
            } else {
                cronFailure("merchant-timeout", `HTTP ${res.status}`);
            }
        } catch (e: any) {
            cronFailure("merchant-timeout", e.message || "fetch error");
        }
    }, 60_000);

    // ─── Cron: Seller Resume (every 5 min) ──────────────────────────────
    // Resume sellers whose pause time has expired
    setInterval(async () => {
        try {
            const res = await fetch(`${NEXT_URL}/api/cron/seller-resume`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CRON_SECRET}`
                }
            });
            if (res.ok) {
                cronSuccess("seller-resume");
                const data = await res.json();
                if (data.resumed > 0) {
                    console.log(`[Cron] Resumed ${data.resumed} paused seller(s)`);
                }
            } else {
                cronFailure("seller-resume", `HTTP ${res.status}`);
            }
        } catch (e: any) {
            cronFailure("seller-resume", e.message || "fetch error");
        }
    }, 300_000);

    // ─── Cron: Scheduled Notify (every 5 min) ───────────────────────────
    // Notify sellers of upcoming scheduled orders, auto-cancel unconfirmed
    setInterval(async () => {
        try {
            const res = await fetch(`${NEXT_URL}/api/cron/scheduled-notify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CRON_SECRET}`
                }
            });
            if (res.ok) {
                cronSuccess("scheduled-notify");
                const data = await res.json();
                if (data.notified > 0 || data.cancelled > 0) {
                    console.log(`[Cron] Scheduled: notified ${data.notified || 0}, cancelled ${data.cancelled || 0}`);
                }
            } else {
                cronFailure("scheduled-notify", `HTTP ${res.status}`);
            }
        } catch (e: any) {
            cronFailure("scheduled-notify", e.message || "fetch error");
        }
    }, 300_000);

    // ─── Cron: Close Auctions (every 60s) ──────────────────────────────
    // Close expired auctions, assign winners, mark no-bid auctions
    setInterval(async () => {
        try {
            const res = await fetch(`${NEXT_URL}/api/cron/close-auctions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CRON_SECRET}`
                }
            });
            if (res.ok) {
                cronSuccess("close-auctions");
                const data = await res.json();
                if (data.closed > 0) {
                    console.log(`[Cron] Closed ${data.closed} auction(s) (${data.withBids} con ofertas, ${data.noBids} sin ofertas)`);
                }
            } else {
                cronFailure("close-auctions", `HTTP ${res.status}`);
            }
        } catch (e: any) {
            cronFailure("close-auctions", e.message || "fetch error");
        }
    }, 60_000);
});

export { io, logistica };
