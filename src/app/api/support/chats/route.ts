// API: Support Chat CRUD
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSupportAvailable, SUPPORT_UNAVAILABLE_MESSAGE } from "@/lib/support-availability";

// GET - Get user's support chats
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const chats = await (prisma as any).supportChat.findMany({
            where: { userId },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                operator: {
                    select: { id: true, displayName: true, isOnline: true }
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { lastMessageAt: "desc" }
        });

        const chatsWithUnread = await Promise.all(chats.map(async (chat: any) => {
            const unreadCount = await (prisma as any).supportMessage.count({
                where: {
                    chatId: chat.id,
                    isFromAdmin: true,
                    isRead: false
                }
            });
            return { ...chat, unreadCount };
        }));

        return NextResponse.json(chatsWithUnread);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Create new support chat with auto-assignment
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userName = (session.user as any).name || "Cliente";
        const { category, message, subject: subjectInput, origin: originHint } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
        }

        // feat/chat-en-vivo: solo se puede iniciar una consulta si hay soporte en línea.
        if (!(await isSupportAvailable())) {
            return NextResponse.json({ error: SUPPORT_UNAVAILABLE_MESSAGE }, { status: 409 });
        }

        // feat/soporte-bandeja-ops: origen DERIVADO server-side (no confiar en el
        // hint del cliente). MERCHANT solo si el user tiene comercio (y ahí sí
        // seteamos merchantId, que arregla el badge del panel comercio); DRIVER
        // solo si tiene registro de repartidor; el resto es BUYER.
        let origin: "BUYER" | "MERCHANT" | "DRIVER" = "BUYER";
        let merchantId: string | undefined = undefined;
        if (originHint === "MERCHANT") {
            const merchant = await prisma.merchant.findFirst({ where: { ownerId: userId }, select: { id: true } });
            if (merchant) { origin = "MERCHANT"; merchantId = merchant.id; }
        } else if (originHint === "DRIVER") {
            const driver = await prisma.driver.findUnique({ where: { userId }, select: { id: true } });
            if (driver) { origin = "DRIVER"; }
        }

        // Find available operator: online, active, with capacity
        const availableOperator = await findAvailableOperator();

        // Subject: usar el que mandó el usuario si vino; si no, derivarlo del mensaje.
        const rawSubject = (typeof subjectInput === "string" && subjectInput.trim())
            ? subjectInput.trim()
            : message.trim();
        const subject = rawSubject.length > 60
            ? rawSubject.substring(0, 57) + "..."
            : rawSubject;

        // Create chat with user's message + optional system message
        const messagesData: any[] = [
            {
                senderId: userId,
                content: message.trim(),
                isFromAdmin: false,
                isSystem: false
            }
        ];

        // If operator found, add system assignment message
        if (availableOperator) {
            messagesData.push({
                senderId: availableOperator.userId,
                content: `${availableOperator.displayName} es tu operador asignado. En un momento te atiende, ${userName}.`,
                isFromAdmin: true,
                isSystem: true
            });
        }

        const chat = await (prisma as any).supportChat.create({
            data: {
                userId,
                merchantId,
                origin,
                category: category || "general",
                subject,
                status: availableOperator ? "active" : "waiting",
                priority: "normal",
                operatorId: availableOperator?.id || undefined,
                messages: {
                    create: messagesData
                }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                operator: {
                    select: { id: true, displayName: true, isOnline: true }
                },
                messages: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        // Aviso al equipo (fire-and-forget: nunca rompe la creación del ticket).
        (async () => {
            try {
                const { sendAdminNewSupportTicketEmail } = await import("@/lib/email-admin-ops");
                await sendAdminNewSupportTicketEmail({
                    origin,
                    userName,
                    subject,
                    message: message.trim(),
                    chatId: chat.id,
                });
            } catch (err) {
                console.error("[support] fallo aviso de nuevo ticket:", err);
            }
        })();

        return NextResponse.json(chat, { status: 201 });
    } catch (error) {
        console.error("Error creating chat:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// Find the best available operator (online, active, with lowest active chats below their max)
async function findAvailableOperator() {
    const operators = await (prisma as any).supportOperator.findMany({
        where: {
            isActive: true,
            isOnline: true
        }
    });

    if (operators.length === 0) return null;

    // Get active chat counts for each operator
    const operatorsWithLoad = await Promise.all(
        operators.map(async (op: any) => {
            const activeChats = await (prisma as any).supportChat.count({
                where: {
                    operatorId: op.id,
                    status: { in: ["active", "waiting"] }
                }
            });
            return { ...op, activeChats };
        })
    );

    // Filter operators with capacity and sort by lowest load
    const available = operatorsWithLoad
        .filter((op: any) => op.activeChats < op.maxChats)
        .sort((a: any, b: any) => a.activeChats - b.activeChats);

    return available.length > 0 ? available[0] : null;
}
