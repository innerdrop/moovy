import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { socketLogger } from "@/lib/logger";

const PushSendSchema = z.object({
    userId: z.string().min(1, "userId requerido"),
    title: z.string().min(1, "title requerido"),
    body: z.string().min(1, "body requerido"),
    data: z.record(z.string(), z.any()).optional(),
});

// Configurar VAPID keys (solo una vez al arrancar)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_EMAIL || "mailto:admin@somosmoovy.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * POST /api/push/send
 * Envía una push notification a un rider específico
 * Este endpoint es INTERNO (llamado desde el servidor, no desde el cliente)
 */
export async function POST(req: NextRequest) {
  try {
    // Validar que tenga el header de autorización interna
    const authHeader = req.headers.get("authorization");
    const internalToken = process.env.INTERNAL_API_TOKEN;

    if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = PushSendSchema.safeParse(body);

    if (!validation.success) {
      const message = validation.error.issues[0]?.message || "Datos inválidos";
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    const { userId, title, body: notificationBody, data } = validation.data;

    // Obtener todas las suscripciones del usuario
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { success: true, sent: 0, failed: 0, total: 0, message: "Usuario no tiene suscripciones activas" },
        { status: 200 }
      );
    }

    const payload = JSON.stringify({
      title,
      body: notificationBody,
      icon: "/icons/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // Si la suscripción ya no es válida (expired/unsubscribed), borrarla
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
            socketLogger.info(
              { endpoint: sub.endpoint },
              "Deleted expired push subscription"
            );
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    socketLogger.info(
      { userId, sent: successful, failed, total: subscriptions.length },
      "Push notifications sent"
    );

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    socketLogger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "Error sending push notifications"
    );
    return NextResponse.json(
      { success: false, error: "Error al enviar notificación" },
      { status: 500 }
    );
  }
}
