// Socket.io server for real-time driver tracking
// Run with: npx tsx scripts/socket-server.ts
// This runs alongside Next.js on port 3001

import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.SOCKET_PORT || 3001;
const NEXT_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

logistica.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Driver goes online with their ID
    socket.on("driver_online", (driverId: string) => {
        console.log(`[Socket] Driver ${driverId} online`);
        driverSockets.set(driverId, socket.id);
        socket.join(`driver:${driverId}`);
        socket.data.driverId = driverId;
        socket.data.role = "driver";
    });

    // Driver starts delivery for an order
    socket.on("start_delivery", ({ orderId, driverId }: { orderId: string; driverId: string }) => {
        console.log(`[Socket] Driver ${driverId} started delivery for order ${orderId}`);
        orderDrivers.set(orderId, driverId);
        socket.join(`order:${orderId}`);
    });

    // Driver position update - broadcast to order tracking clients
    socket.on("actualizar_posicion", ({
        driverId,
        lat,
        lng,
        orderId,
        heading,
        speed
    }: {
        driverId: string;
        lat: number;
        lng: number;
        orderId?: string;
        heading?: number;
        speed?: number;
    }) => {
        // Broadcast to all clients tracking this order
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

        // Also update admin tracking room
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

    // Client starts tracking an order
    socket.on("track_order", (orderId: string) => {
        console.log(`[Socket] Client tracking order ${orderId}`);
        socket.join(`order:${orderId}`);
        socket.data.orderId = orderId;
        socket.data.role = "customer";
    });

    // Admin joins tracking room
    socket.on("admin_tracking", () => {
        console.log(`[Socket] Admin joined tracking room`);
        socket.join("admin:tracking");
        socket.data.role = "admin";
    });

    // Delivery completed - notify customer
    socket.on("delivery_completed", ({ orderId }: { orderId: string }) => {
        console.log(`[Socket] Delivery completed for order ${orderId}`);
        logistica.to(`order:${orderId}`).emit("pedido_entregado", { orderId });
        orderDrivers.delete(orderId);
    });

    // New order offer to driver (called from API via emitter)
    socket.on("new_order_offer", ({ driverId, order }: { driverId: string; order: any }) => {
        const socketId = driverSockets.get(driverId);
        if (socketId) {
            logistica.to(socketId).emit("orden_pendiente", order);
        }
    });

    socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);

        // Clean up driver socket mapping
        if (socket.data.driverId) {
            driverSockets.delete(socket.data.driverId);
        }
    });

    // --- NEW ROOM JOIN EVENTS FOR REAL-TIME ORDER UPDATES ---

    // Merchant joins their orders room
    socket.on("join_merchant_room", (merchantId: string) => {
        console.log(`[Socket] Merchant ${merchantId} joined their room`);
        socket.join(`merchant:${merchantId}`);
        socket.data.merchantId = merchantId;
        socket.data.role = "merchant";
    });

    // Customer joins their orders room
    socket.on("join_customer_room", (userId: string) => {
        console.log(`[Socket] Customer ${userId} joined their room`);
        socket.join(`customer:${userId}`);
        socket.data.userId = userId;
        socket.data.role = "customer";
    });

    // Admin joins orders tracking room
    socket.on("join_admin_orders", () => {
        console.log(`[Socket] Admin joined orders room`);
        socket.join("admin:orders");
        socket.data.role = "admin";
    });
});

// HTTP endpoint for internal API calls to emit events
httpServer.on("request", (req, res) => {
    if (req.method === "POST" && req.url === "/emit") {
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

httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🚀 Moovy Socket.io Server Started                ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(50)}║
║  Namespace: /logistica                                    ║
║  CORS: ${NEXT_URL.padEnd(48)}║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export { io, logistica };
