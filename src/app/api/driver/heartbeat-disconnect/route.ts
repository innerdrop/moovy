// API: Driver heartbeat disconnect (Capa 3 de fix/driver-presence-detection)
// POST /api/driver/heartbeat-disconnect
//
// Endpoint específico para navigator.sendBeacon() del driver dashboard cuando
// el browser dispara `pagehide` o `beforeunload`. sendBeacon es el único método
// garantizado por el browser para mandar data al cerrar la página/tab/app —
// funciona aún en crashes, OS matando el proceso, mobile background kill, etc.
//
// Diferencias vs PUT /api/driver/status:
//   - Solo POST (sendBeacon no soporta PUT).
//   - SIN validación de GPS (vamos saliendo, no entrando — no aplica el gate).
//   - Solo marca offline si actualmente está online (idempotente, no spamea logs).
//   - No emite socket events ni push (el cliente está cerrando, no le interesa).
//   - Audit log dedicado DRIVER_DISCONNECT_BEACON para distinguir del flow normal.
//
// Auth: cookie de sesión NextAuth (sendBeacon envía cookies por default).
// Si el driver no tiene sesión válida, devuelve 401 — el browser ignora la
// respuesta de sendBeacon de todos modos, así que no hay impacto UX.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";
import { auditLog } from "@/lib/security";

export async function POST(request: Request) {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { userId, driver } = authResult;

        if (!driver) {
            return NextResponse.json(
                { error: "Perfil de repartidor no encontrado" },
                { status: 404 }
            );
        }

        // Idempotente: solo update si actualmente está online.
        const result = await prisma.driver.updateMany({
            where: {
                userId,
                isOnline: true,
            },
            data: {
                isOnline: false,
                availabilityStatus: "FUERA_DE_SERVICIO",
            },
        });

        if (result.count > 0) {
            try {
                auditLog({
                    timestamp: new Date().toISOString(),
                    userId,
                    action: "DRIVER_DISCONNECT_BEACON",
                    resource: "Driver",
                    resourceId: driver.id,
                    details: {
                        reason: "browser_pagehide_beacon",
                    },
                });
            } catch (err) {
                console.error("[heartbeat-disconnect] Audit log failed:", err);
            }
        }

        return NextResponse.json({ success: true, updated: result.count });
    } catch (error: any) {
        console.error("[heartbeat-disconnect] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Error interno" },
            { status: 500 }
        );
    }
}
