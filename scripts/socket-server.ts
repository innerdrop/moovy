// Socket.io server for real-time driver tracking
// Run with: npx tsx scripts/socket-server.ts
// This runs alongside Next.js on port 3001

import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";

const PORT = process.env.SOCKET_PORT || 3001;
const NEXT_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SOCKET_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const CRON_SECRET = process.env.CRON_SECRET || "moovy-cron-secret-change-in-production";

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

// ─── HTTP & Socket.IO Server ─────────────────────────────────────────────────

const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: true, // Allow all origins for local network testing
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
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/emit") {
        // ── Verify Authorization ────────────────────────────────────────
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
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
╚═══════════════════════════════════════════════════════════╝
  `);

    // ─── Periodic Timeout Processor ──────────────────────────────────────
    // Process expired assignment offers every 15 seconds
    // This replaces the need for an external cron job
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
                const data = await res.json();
                if (data.processed > 0) {
                    console.log(`[Cron] Processed ${data.processed} expired assignment(s)`);
                }
            }
        } catch (e) {
            // Silent - Next.js might not be ready yet
        }
    }, 15_000);
});

export { io, logistica };
