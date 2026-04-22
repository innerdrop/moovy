"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import {
    OrderChat,
    OrderChatMessage,
    OrderChatType,
    QuickResponse,
    BUYER_QUICK_RESPONSES,
    MERCHANT_QUICK_RESPONSES,
    SELLER_QUICK_RESPONSES,
    DRIVER_QUICK_RESPONSES,
} from "@/types/order-chat";
import { useSocketAuth } from "@/hooks/useSocketAuth";

interface OrderChatPanelProps {
    orderId: string;
    orderNumber: string;
    chatType: OrderChatType;
    /**
     * Scopea el chat a una SubOrder. Requerido cuando hay múltiples sellers o
     * para DRIVER_SELLER (cada SubOrder tiene su propio seller/driver). Opcional
     * en BUYER_MERCHANT / BUYER_DRIVER / DRIVER_MERCHANT de pedidos single-vendor.
     */
    subOrderId?: string;
    /** Nombre del otro participante para mostrar en header */
    counterpartName?: string;
    /** Rol del usuario actual para seleccionar respuestas rápidas */
    userRole: "buyer" | "merchant" | "seller" | "driver";
    /** Compact mode for inline embedding */
    compact?: boolean;
    /** Optional delivery context for BUYER_DRIVER chats */
    driverLocation?: {
        latitude?: number;
        longitude?: number;
        distanceKm?: number;
        estimatedMinutes?: number;
        status?: "approaching" | "arrived" | "in_pickup" | "in_delivery";
    };
}

// ─── Helpers para etiquetas por chatType + userRole ────────────────────────

/**
 * Label del otro participante (la "contraparte") según chatType y el rol
 * que asume el usuario actual. Se usa en el botón cerrado y en el header.
 */
function counterpartLabel(chatType: OrderChatType, userRole: OrderChatPanelProps["userRole"]): string {
    switch (chatType) {
        case "BUYER_MERCHANT":
            return userRole === "buyer" ? "Comercio" : "Comprador";
        case "BUYER_DRIVER":
            return userRole === "buyer" ? "Repartidor" : "Comprador";
        case "BUYER_SELLER":
            return userRole === "buyer" ? "Vendedor" : "Comprador";
        case "DRIVER_MERCHANT":
            return userRole === "driver" ? "Comercio" : "Repartidor";
        case "DRIVER_SELLER":
            return userRole === "driver" ? "Vendedor" : "Repartidor";
        default:
            return "Participante";
    }
}

/** Paleta de color por chatType para diferenciar visualmente los canales. */
function paletteFor(chatType: OrderChatType): {
    solidBg: string;
    solidHover: string;
    lightBg: string;
    lightText: string;
    lightBorder: string;
    lightHover: string;
    headerGradient: string;
    inputFocus: string;
    myBubble: string;
    myBubbleTime: string;
    quickBg: string;
    quickText: string;
    quickBorder: string;
    quickHover: string;
    pillBg: string;
    pillText: string;
} {
    switch (chatType) {
        case "BUYER_DRIVER":
            return {
                solidBg: "bg-amber-600",
                solidHover: "hover:bg-amber-700",
                lightBg: "bg-amber-50",
                lightText: "text-amber-700",
                lightBorder: "border-amber-200",
                lightHover: "hover:bg-amber-100",
                headerGradient: "bg-gradient-to-r from-amber-600 to-amber-700",
                inputFocus: "focus:ring-amber-500",
                myBubble: "bg-amber-600 text-white",
                myBubbleTime: "text-amber-100",
                quickBg: "bg-amber-50",
                quickText: "text-amber-700",
                quickBorder: "border-amber-200",
                quickHover: "hover:bg-amber-100",
                pillBg: "bg-amber-100",
                pillText: "text-amber-600",
            };
        case "DRIVER_MERCHANT":
        case "DRIVER_SELLER":
            // Canales driver↔contraparte: verde — distinto de buyer↔driver
            return {
                solidBg: "bg-emerald-600",
                solidHover: "hover:bg-emerald-700",
                lightBg: "bg-emerald-50",
                lightText: "text-emerald-700",
                lightBorder: "border-emerald-200",
                lightHover: "hover:bg-emerald-100",
                headerGradient: "bg-gradient-to-r from-emerald-600 to-emerald-700",
                inputFocus: "focus:ring-emerald-500",
                myBubble: "bg-emerald-600 text-white",
                myBubbleTime: "text-emerald-100",
                quickBg: "bg-emerald-50",
                quickText: "text-emerald-700",
                quickBorder: "border-emerald-200",
                quickHover: "hover:bg-emerald-100",
                pillBg: "bg-emerald-100",
                pillText: "text-emerald-600",
            };
        case "BUYER_SELLER":
            // Marketplace: violeta MOOVY
            return {
                solidBg: "bg-violet-600",
                solidHover: "hover:bg-violet-700",
                lightBg: "bg-violet-50",
                lightText: "text-violet-700",
                lightBorder: "border-violet-200",
                lightHover: "hover:bg-violet-100",
                headerGradient: "bg-gradient-to-r from-violet-600 to-violet-700",
                inputFocus: "focus:ring-violet-500",
                myBubble: "bg-violet-600 text-white",
                myBubbleTime: "text-violet-100",
                quickBg: "bg-violet-50",
                quickText: "text-violet-700",
                quickBorder: "border-violet-200",
                quickHover: "hover:bg-violet-100",
                pillBg: "bg-violet-100",
                pillText: "text-violet-600",
            };
        case "BUYER_MERCHANT":
        default:
            return {
                solidBg: "bg-[#e60012]",
                solidHover: "hover:bg-red-700",
                lightBg: "bg-blue-50",
                lightText: "text-blue-700",
                lightBorder: "border-blue-200",
                lightHover: "hover:bg-blue-100",
                headerGradient: "bg-gradient-to-r from-blue-600 to-blue-700",
                inputFocus: "focus:ring-blue-500",
                myBubble: "bg-blue-600 text-white",
                myBubbleTime: "text-blue-200",
                quickBg: "bg-blue-50",
                quickText: "text-blue-700",
                quickBorder: "border-blue-200",
                quickHover: "hover:bg-blue-100",
                pillBg: "bg-blue-100",
                pillText: "text-blue-600",
            };
    }
}

export default function OrderChatPanel({
    orderId,
    orderNumber,
    chatType,
    subOrderId,
    counterpartName,
    userRole,
    compact = false,
    driverLocation,
}: OrderChatPanelProps) {
    const { data: session } = useSession();
    const [chat, setChat] = useState<OrderChat | null>(null);
    const [messages, setMessages] = useState<OrderChatMessage[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showQuick, setShowQuick] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    // Badge state (estado colapsado): cuántos mensajes sin leer tengo.
    const [unreadCount, setUnreadCount] = useState(0);
    // Guardamos el chatId aunque el panel esté cerrado — nos sirve para
    // pollear `/existing` y para identificar eventos socket relevantes.
    const [existingChatId, setExistingChatId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<NodeJS.Timeout>(null);
    const unreadPollRef = useRef<NodeJS.Timeout>(null);
    const socketRef = useRef<Socket | null>(null);
    const userId = (session?.user as any)?.id;

    const palette = paletteFor(chatType);
    const counterpart = counterpartName || counterpartLabel(chatType, userRole);
    const roleLabel = counterpartLabel(chatType, userRole);

    const quickResponses: QuickResponse[] =
        userRole === "buyer" ? BUYER_QUICK_RESPONSES
            : userRole === "merchant" ? MERCHANT_QUICK_RESPONSES
                : userRole === "seller" ? SELLER_QUICK_RESPONSES
                    : DRIVER_QUICK_RESPONSES;

    // Auth token para abrir la conexión socket — reusamos el hook canónico
    // que ya fetchea + cachea el JWT de socket.
    const { token: socketToken } = useSocketAuth(!!session?.user);

    // ─── Pre-fetch del chat existente (no crea nada) ─────────────────────
    // Esto alimenta el badge de "mensaje sin leer" cuando el panel está
    // cerrado. Se llama al montar y cada 15s (fallback por si el socket
    // está caído o desconectado).
    const checkExisting = useCallback(async () => {
        if (!session?.user) return;
        try {
            const qs = new URLSearchParams({ orderId, chatType });
            if (subOrderId) qs.set("subOrderId", subOrderId);
            const res = await fetch(`/api/order-chat/existing?${qs.toString()}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.exists) {
                setExistingChatId(data.chatId);
                setUnreadCount(data.unreadCount || 0);
            } else {
                setExistingChatId(null);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("[OrderChatPanel] checkExisting failed:", err);
        }
    }, [session?.user, orderId, chatType, subOrderId]);

    // Initialize or load chat — crea el chat si no existe, carga mensajes
    const initChat = useCallback(async () => {
        if (!session?.user) return;
        try {
            const body: any = { orderId, chatType };
            if (subOrderId) body.subOrderId = subOrderId;
            const res = await fetch("/api/order-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const data = await res.json();
                setChat(data);
                setExistingChatId(data.id);
                setMessages(data.messages || []);
                // El GET del endpoint [chatId] marca como leído — al abrir,
                // reseteamos el badge de UI para no mostrar "nuevo" mientras
                // el usuario ya está mirando.
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error initializing chat:", error);
        }
    }, [session?.user, orderId, chatType, subOrderId]);

    // Poll for new messages — solo cuando el panel está abierto
    const loadMessages = useCallback(async () => {
        if (!chat?.id) return;
        try {
            const res = await fetch(`/api/order-chat/${chat.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                // Como el GET marca como leído del lado del backend, también
                // reseteamos el contador local.
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    }, [chat?.id]);

    // Pre-fetch badge al montar + cada 15s cuando el panel está cerrado
    useEffect(() => {
        if (!session?.user) return;
        checkExisting();
        if (!isOpen) {
            unreadPollRef.current = setInterval(checkExisting, 15000);
            return () => {
                if (unreadPollRef.current) clearInterval(unreadPollRef.current);
            };
        }
    }, [session?.user, isOpen, checkExisting]);

    // Init al abrir
    useEffect(() => {
        if (isOpen && !chat) {
            initChat();
        }
    }, [isOpen, chat, initChat]);

    // Poll messages cada 5s cuando el panel está abierto
    useEffect(() => {
        if (isOpen && chat?.id) {
            loadMessages();
            pollRef.current = setInterval(loadMessages, 5000);
            return () => {
                if (pollRef.current) clearInterval(pollRef.current);
            };
        }
    }, [isOpen, chat?.id, loadMessages]);

    // Socket real-time: escuchar `new_chat_message` en el room user:<userId>
    // El socket-server auto-joinea a `user:<userId>` al autenticarse.
    useEffect(() => {
        if (!socketToken || !session?.user) return;

        const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        const isLocalHostEnv =
            envSocketUrl.includes("localhost") || envSocketUrl.includes("127.0.0.1");
        const socketUrl =
            (isLocalHostEnv && typeof window !== "undefined" && !window.location.hostname.includes("localhost"))
                ? `${window.location.protocol}//${window.location.hostname}:3001`
                : envSocketUrl;

        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
            auth: { token: socketToken },
        });
        socketRef.current = socket;

        const handleNewMessage = (payload: {
            chatId: string;
            orderId: string;
            subOrderId?: string | null;
            chatType: string;
            senderId: string;
            preview?: string;
            timestamp?: string;
        }) => {
            // Filtrar: el evento debe ser para ESTE chat (por chatType + order
            // + subOrder), y no debe ser un mensaje mío (los míos los pinto
            // optimistic al enviarlos).
            if (payload.orderId !== orderId) return;
            if (payload.chatType !== chatType) return;
            if (subOrderId && payload.subOrderId !== subOrderId) return;
            if (!subOrderId && payload.subOrderId) return;
            if (payload.senderId === userId) return;

            if (isOpen && chat?.id) {
                // Panel abierto: recargar mensajes ya para verlo al toque.
                loadMessages();
            } else {
                // Panel cerrado: bumpear el badge y refrescar el chatId por
                // si era el primer mensaje del chat.
                setExistingChatId(payload.chatId);
                setUnreadCount((prev) => prev + 1);
            }
        };

        socket.on("new_chat_message", handleNewMessage);

        return () => {
            socket.off("new_chat_message", handleNewMessage);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [socketToken, session?.user, orderId, chatType, subOrderId, userId, isOpen, chat?.id, loadMessages]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || !chat?.id) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/order-chat/${chat.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content.trim() })
            });
            if (res.ok) {
                const newMsg = await res.json();
                setMessages(prev => [...prev, newMsg]);
                setMessage("");
                setShowQuick(false);
            }
        } catch (error) {
            console.error("Error sending:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(message);
    };

    if (!session?.user) return null;

    // Collapsed state — solo el botón (con badge si hay mensajes sin leer)
    if (!isOpen) {
        const hasUnread = unreadCount > 0;
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all text-sm min-h-[44px] ${
                    compact
                        ? `${palette.lightBg} ${palette.lightText} ${palette.lightHover} border ${palette.lightBorder}`
                        : `${palette.solidBg} text-white ${palette.solidHover} shadow-md hover:shadow-lg`
                }`}
                title={`Abrir chat con ${roleLabel.toLowerCase()}`}
                aria-label={
                    hasUnread
                        ? `Abrir chat con ${roleLabel.toLowerCase()} — ${unreadCount} mensaje${unreadCount > 1 ? "s" : ""} sin leer`
                        : `Abrir chat con ${roleLabel.toLowerCase()}`
                }
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chatear con {roleLabel}</span>
                {hasUnread && (
                    <>
                        {/* Badge contador — visible siempre que hay mensajes sin leer */}
                        <span
                            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md ring-2 ring-white animate-pulse"
                            aria-hidden="true"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                        {/* Dot halo para llamar la atención */}
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" aria-hidden="true" />
                    </>
                )}
            </button>
        );
    }

    // Open state — panel completo
    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden flex flex-col ${compact ? "h-80" : "h-96"}`}>
            {/* Header */}
            <div className={`text-white px-4 py-3 flex items-center justify-between shrink-0 ${palette.headerGradient}`}>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{counterpart}</p>
                    <p className="text-xs text-opacity-90 truncate">
                        Pedido #{orderNumber} — {roleLabel}
                    </p>
                    {/* Delivery context para chats de driver */}
                    {chatType === "BUYER_DRIVER" && driverLocation && (
                        <div className="text-xs text-opacity-75 mt-1 space-y-0.5">
                            {driverLocation.status === "approaching" && (
                                <p>🚗 Aproximándose...</p>
                            )}
                            {driverLocation.status === "arrived" && (
                                <p>📍 Llegó a tu domicilio</p>
                            )}
                            {driverLocation.estimatedMinutes && driverLocation.status !== "arrived" && (
                                <p>⏱️ ~{driverLocation.estimatedMinutes} min</p>
                            )}
                            {driverLocation.distanceKm && driverLocation.distanceKm > 0.2 && driverLocation.status !== "arrived" && (
                                <p>📏 {driverLocation.distanceKm.toFixed(1)}km</p>
                            )}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white text-lg shrink-0 ml-2"
                    aria-label="Cerrar chat"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {messages.map((msg) => {
                    const isMine = msg.senderId === userId;
                    if (msg.isSystem) {
                        return (
                            <div key={msg.id} className="text-center">
                                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                    {msg.content}
                                </span>
                            </div>
                        );
                    }
                    return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMine
                                    ? `${palette.myBubble} rounded-br-md`
                                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                                    }`}
                            >
                                {!isMine && msg.sender?.name && (
                                    <p className={`text-xs font-semibold ${palette.lightText} mb-0.5`}>{msg.sender.name}</p>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? palette.myBubbleTime : "text-gray-400"}`}>
                                    <span>
                                        {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    {isMine && (
                                        <span title={msg.isRead ? "Leído" : "Entregado"}>
                                            {msg.isRead ? "✓✓" : "✓"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Responses */}
            {showQuick && (
                <div className="border-t bg-white px-3 py-2 max-h-32 overflow-y-auto shrink-0">
                    <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                        {quickResponses.map((qr) => (
                            <button
                                key={qr.id}
                                onClick={() => sendMessage(qr.message)}
                                className={`text-xs py-2 px-2 rounded-lg transition-colors border font-medium whitespace-normal h-auto min-h-[44px] flex items-center justify-center ${palette.quickBg} ${palette.quickText} ${palette.quickBorder} ${palette.quickHover}`}
                                title={qr.message}
                            >
                                {qr.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t bg-white px-3 py-2 flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={() => setShowQuick(!showQuick)}
                    className={`p-2 rounded-lg transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        showQuick
                            ? `${palette.pillBg} ${palette.pillText}`
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    }`}
                    title="Respuestas rápidas"
                    aria-label="Respuestas rápidas"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribí tu mensaje..."
                    className={`flex-1 px-3 py-2.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors border-gray-200 ${palette.inputFocus}`}
                    aria-label="Escribí tu mensaje"
                />
                <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className={`text-white p-2 rounded-full hover:opacity-90 disabled:opacity-40 transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${palette.solidBg} ${palette.solidHover}`}
                    title="Enviar"
                    aria-label="Enviar mensaje"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
