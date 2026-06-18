// API: campana de notificaciones de OPS (feat/ops-campana-notificaciones, 2026-06-17).
//
// GET /api/admin/notifications
//
// Agrega en UNA sola respuesta los "pendientes accionables" que hoy el admin
// solo descubre entrando a cada seccion o por email. Todo se DERIVA de datos
// existentes — no hay modelo nuevo ni cambio de schema (decision del founder:
// derivar al vuelo, polling 30-60s).
//
// Fuentes (cada una en su propio try/catch: si una falla, las demas siguen):
//   1. Aprobaciones pendientes: Merchant + Driver con approvalStatus = "PENDING".
//   2. Change-requests de documentos abiertos: MerchantDocumentChangeRequest +
//      DriverDocumentChangeRequest con status = "PENDING".
//   3. Resenas en moderacion: Order con cualquiera de los 3 *RatingModerationStatus
//      = "PENDING" (mismo criterio que /api/admin/review-moderation).
//   4. Incidentes de PIN/soporte: AuditLog action = "DRIVER_PIN_ISSUE_REPORTED"
//      dentro de una ventana reciente (no tienen flag de "resuelto").
//
// Cada item lleva un href de deep-link a la pantalla de OPS donde se resuelve.
// El total es la suma de items abiertos. Cap defensivo por fuente + global.
//
// Auth: solo ADMIN. No-admin -> 403. Si la sesion o TODAS las fuentes fallan,
// devolvemos lista vacia con 200 para no romper el render de la campana.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Cuanto miramos atras para los incidentes de PIN (no tienen estado "resuelto",
// asi que usamos una ventana temporal + el "visto" del cliente via localStorage).
const PIN_ISSUE_WINDOW_HOURS = 48;

// Cap por fuente para que una cola gigante no infle el payload ni la query.
const PER_SOURCE_CAP = 25;
// Cap global del payload final.
const GLOBAL_CAP = 50;

type OpsNotificationType =
    | "PENDING_MERCHANT"
    | "PENDING_DRIVER"
    | "CHANGE_REQUEST_MERCHANT"
    | "CHANGE_REQUEST_DRIVER"
    | "REVIEW_MODERATION"
    | "PIN_ISSUE";

type Severity = "info" | "warning" | "critical";

interface OpsNotificationItem {
    id: string;
    type: OpsNotificationType;
    title: string;
    description: string;
    href: string;
    createdAt: string; // ISO
    severity: Severity;
}

// Etiquetas legibles para el campo de un change-request.
const DOC_FIELD_LABELS: Record<string, string> = {
    cuit: "CUIT",
    bankAccount: "Cuenta bancaria (CBU/Alias)",
    constanciaAfipUrl: "Constancia de AFIP",
    habilitacionMunicipalUrl: "Habilitación Municipal",
    registroSanitarioUrl: "Registro Sanitario",
    constanciaCuitUrl: "Constancia de CUIT",
    dniFrenteUrl: "DNI (frente)",
    dniDorsoUrl: "DNI (dorso)",
    licenciaUrl: "Licencia de conducir",
    seguroUrl: "Seguro",
    vtvUrl: "VTV",
    cedulaVerdeUrl: "Cédula verde",
};

const docLabel = (field: string) => DOC_FIELD_LABELS[field] || field;

export async function GET() {
    // Auth primero. No-admin -> 403 explicito (la campana solo se monta dentro
    // del layout protegido de OPS, asi que en la practica nunca pasa).
    const session = await auth().catch(() => null);
    if (!hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const items: OpsNotificationItem[] = [];

    // ── 1. Aprobaciones pendientes (merchants + drivers) ──────────────────
    try {
        const [merchants, drivers] = await Promise.all([
            prisma.merchant.findMany({
                where: { approvalStatus: "PENDING", owner: { deletedAt: null } },
                select: { id: true, name: true, ownerId: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                take: PER_SOURCE_CAP,
            }),
            prisma.driver.findMany({
                where: { approvalStatus: "PENDING", user: { deletedAt: null } },
                select: {
                    id: true,
                    userId: true,
                    createdAt: true,
                    user: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: PER_SOURCE_CAP,
            }),
        ]);

        for (const m of merchants) {
            items.push({
                id: `pending-merchant:${m.id}`,
                type: "PENDING_MERCHANT",
                title: "Comercio esperando aprobación",
                description: m.name || "Comercio sin nombre",
                href: `/ops/usuarios/${m.ownerId}`,
                createdAt: m.createdAt.toISOString(),
                severity: "warning",
            });
        }
        for (const d of drivers) {
            items.push({
                id: `pending-driver:${d.id}`,
                type: "PENDING_DRIVER",
                title: "Repartidor esperando aprobación",
                description: d.user?.name || "Repartidor sin nombre",
                href: `/ops/usuarios/${d.userId}`,
                createdAt: d.createdAt.toISOString(),
                severity: "warning",
            });
        }
    } catch (err) {
        console.error("[admin/notifications] fuente aprobaciones falló:", err);
    }

    // ── 2. Change-requests de documentos abiertos ────────────────────────
    try {
        const [merchantCRs, driverCRs] = await Promise.all([
            prisma.merchantDocumentChangeRequest.findMany({
                where: { status: "PENDING" },
                select: {
                    id: true,
                    documentField: true,
                    createdAt: true,
                    merchant: { select: { name: true, ownerId: true } },
                },
                orderBy: { createdAt: "desc" },
                take: PER_SOURCE_CAP,
            }),
            prisma.driverDocumentChangeRequest.findMany({
                where: { status: "PENDING" },
                select: {
                    id: true,
                    documentField: true,
                    createdAt: true,
                    driver: { select: { userId: true, user: { select: { name: true } } } },
                },
                orderBy: { createdAt: "desc" },
                take: PER_SOURCE_CAP,
            }),
        ]);

        for (const cr of merchantCRs) {
            items.push({
                id: `cr-merchant:${cr.id}`,
                type: "CHANGE_REQUEST_MERCHANT",
                title: "Pedido de cambio de documento (comercio)",
                description: `${cr.merchant?.name || "Comercio"} — ${docLabel(cr.documentField)}`,
                href: cr.merchant?.ownerId ? `/ops/usuarios/${cr.merchant.ownerId}` : "/ops/usuarios",
                createdAt: cr.createdAt.toISOString(),
                severity: "info",
            });
        }
        for (const cr of driverCRs) {
            items.push({
                id: `cr-driver:${cr.id}`,
                type: "CHANGE_REQUEST_DRIVER",
                title: "Pedido de cambio de documento (repartidor)",
                description: `${cr.driver?.user?.name || "Repartidor"} — ${docLabel(cr.documentField)}`,
                href: cr.driver?.userId ? `/ops/usuarios/${cr.driver.userId}` : "/ops/usuarios",
                createdAt: cr.createdAt.toISOString(),
                severity: "info",
            });
        }
    } catch (err) {
        console.error("[admin/notifications] fuente change-requests falló:", err);
    }

    // ── 3. Reseñas en moderación ──────────────────────────────────────────
    // Mismo criterio que /api/admin/review-moderation: Order con al menos un
    // rating en moderationStatus = "PENDING". Una notificación por Order
    // (linkea a la cola completa, no a un target puntual).
    try {
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { driverRatingModerationStatus: "PENDING" },
                    { merchantRatingModerationStatus: "PENDING" },
                    { sellerRatingModerationStatus: "PENDING" },
                ],
            },
            select: { id: true, orderNumber: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: PER_SOURCE_CAP,
        });

        for (const o of orders) {
            items.push({
                id: `review:${o.id}`,
                type: "REVIEW_MODERATION",
                title: "Reseña en moderación",
                description: `Pedido ${o.orderNumber}`,
                href: "/ops/reviews-pendientes",
                createdAt: o.createdAt.toISOString(),
                severity: "info",
            });
        }
    } catch (err) {
        console.error("[admin/notifications] fuente reseñas falló:", err);
    }

    // ── 4. Incidentes de PIN / soporte (AuditLog, ventana reciente) ───────
    try {
        const since = new Date(Date.now() - PIN_ISSUE_WINDOW_HOURS * 60 * 60 * 1000);
        const pinIssues = await prisma.auditLog.findMany({
            where: {
                action: "DRIVER_PIN_ISSUE_REPORTED",
                createdAt: { gte: since },
            },
            select: { id: true, entityId: true, details: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: PER_SOURCE_CAP,
        });

        for (const log of pinIssues) {
            // details es un JSON string con { pinType, comment, distanceMeters, ... }.
            let pinType: string | null = null;
            let comment: string | null = null;
            try {
                const parsed = log.details ? JSON.parse(log.details) : {};
                pinType = parsed?.pinType ?? null;
                comment = parsed?.comment ?? null;
            } catch {
                // details corrupto/no-JSON: seguimos con el item igual.
            }
            const tipo = pinType === "pickup" ? "retiro" : pinType === "delivery" ? "entrega" : "PIN";
            const desc = comment
                ? `Problema de ${tipo}: "${comment.slice(0, 80)}"`
                : `Problema de ${tipo} reportado por el repartidor`;
            items.push({
                id: `pin:${log.id}`,
                type: "PIN_ISSUE",
                title: "Incidente de PIN / soporte",
                description: desc,
                href: `/ops/pedidos/${log.entityId}`,
                createdAt: log.createdAt.toISOString(),
                severity: "critical",
            });
        }
    } catch (err) {
        console.error("[admin/notifications] fuente incidentes PIN falló:", err);
    }

    // Orden global por fecha desc + cap.
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    const capped = items.slice(0, GLOBAL_CAP);

    // Conteo agrupado por tipo (útil para el dropdown).
    const groups = capped.reduce<Record<string, number>>((acc, it) => {
        acc[it.type] = (acc[it.type] || 0) + 1;
        return acc;
    }, {});

    return NextResponse.json({
        items: capped,
        total: items.length, // total real (antes del cap visual)
        groups,
        generatedAt: new Date().toISOString(),
    });
}
