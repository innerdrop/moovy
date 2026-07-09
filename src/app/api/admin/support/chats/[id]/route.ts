// API: Admin — detalle de un ticket, responder y cambiar estado.
// Rama: feat/soporte-bandeja-ops
//
// Espejo del endpoint del operador (/api/support/operator/chats/[id]) pero
// autorizado contra DB con requireApiAdmin (reglas #28/#29). Es lo que consume
// la bandeja de OPS: leer la conversación, responder, y marcar resuelto/cerrado.
import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notifySupportMessage } from "@/lib/support-notify";

// GET — detalle del chat + mensajes. Marca como leídos los mensajes del usuario.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;

        const chat = await (prisma as any).supportChat.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                operator: { select: { id: true, displayName: true, isOnline: true } },
                messages: {
                    include: { sender: { select: { id: true, name: true } } },
                    orderBy: { createdAt: "asc" as const },
                },
            },
        });

        if (!chat) {
            return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
        }

        // Marcar como leídos los mensajes del usuario (para el conteo "sin responder").
        await (prisma as any).supportMessage.updateMany({
            where: { chatId: id, isFromAdmin: false, isRead: false },
            data: { isRead: true },
        });

        return NextResponse.json(chat);
    } catch (error) {
        console.error("Error fetching admin chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST — el equipo responde el ticket.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;
        const { content } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
        }

        const chat = await (prisma as any).supportChat.findUnique({ where: { id } });
        if (!chat) {
            return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
        }
        // No se puede responder una consulta cerrada/resuelta: hay que reabrirla.
        if (chat.status === "closed" || chat.status === "resolved") {
            return NextResponse.json({ error: "La consulta está cerrada. Reabrila para responder." }, { status: 409 });
        }

        // isFromAdmin:true + isRead:false → cuenta como no leído PARA EL USUARIO
        // (enciende el badge del panel comercio, que filtra por merchantId).
        const message = await (prisma as any).supportMessage.create({
            data: {
                chatId: id,
                senderId: admin.userId,
                content: content.trim(),
                isFromAdmin: true,
                isSystem: false,
                isRead: false,
            },
            include: { sender: { select: { id: true, name: true } } },
        });

        await (prisma as any).supportChat.update({
            where: { id },
            data: {
                lastMessageAt: new Date(),
                status: chat.status === "waiting" ? "active" : chat.status,
            },
        });

        // Tiempo real: avisar al usuario dueño del chat (fire-and-forget).
        notifySupportMessage({ chatId: id, chatUserId: chat.userId, isFromAdmin: true, message }).catch(() => {});

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error sending admin message:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PATCH — cambiar estado del ticket (resolver / cerrar / reabrir).
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await params;
        const { status } = await request.json();

        const allowed = ["waiting", "active", "resolved", "closed"];
        if (!allowed.includes(status)) {
            return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
        }

        const chat = await (prisma as any).supportChat.findUnique({ where: { id } });
        if (!chat) {
            return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
        }

        const updated = await (prisma as any).supportChat.update({
            where: { id },
            data: {
                status,
                resolvedAt: status === "resolved" || status === "closed" ? new Date() : null,
            },
        });

        // feat/chat-en-vivo: al CERRAR o RESOLVER, avisar al usuario que la consulta
        // finalizó y que puede iniciar una nueva si necesita más ayuda (mensaje
        // visible + notificación en tiempo real / badge).
        if ((status === "closed" || status === "resolved") && chat.status !== status) {
            const closeMsg = await (prisma as any).supportMessage.create({
                data: {
                    chatId: id,
                    senderId: admin.userId,
                    content: "El equipo de Moovy dio por finalizada esta consulta. Si necesitás más ayuda, podés iniciar una nueva cuando quieras. ¡Gracias!",
                    isFromAdmin: true,
                    isSystem: false,
                    isRead: false,
                },
            });
            notifySupportMessage({ chatId: id, chatUserId: chat.userId, isFromAdmin: true, message: closeMsg }).catch(() => {});
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating admin chat status:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
