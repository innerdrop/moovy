"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
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

interface OrderChatPanelProps {
    orderId: string;
    orderNumber: string;
    chatType: OrderChatType;
    /** Nombre del otro participante para mostrar en header */
    counterpartName?: string;
    /** Rol del usuario actual para seleccionar respuestas rápidas */
    userRole: "buyer" | "merchant" | "seller" | "driver";
    /** Compact mode for inline embedding */
    compact?: boolean;
}

export default function OrderChatPanel({
    orderId,
    orderNumber,
    chatType,
    counterpartName = "Participante",
    userRole,
    compact = false,
}: OrderChatPanelProps) {
    const { data: session } = useSession();
    const [chat, setChat] = useState<OrderChat | null>(null);
    const [messages, setMessages] = useState<OrderChatMessage[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showQuick, setShowQuick] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<NodeJS.Timeout>(null);
    const userId = (session?.user as any)?.id;

    const quickResponses: QuickResponse[] =
        userRole === "buyer" ? BUYER_QUICK_RESPONSES
            : userRole === "merchant" ? MERCHANT_QUICK_RESPONSES
                : userRole === "seller" ? SELLER_QUICK_RESPONSES
                    : DRIVER_QUICK_RESPONSES;

    const roleLabel =
        chatType === "BUYER_MERCHANT" ? (userRole === "buyer" ? "Comercio" : "Comprador")
            : chatType === "BUYER_DRIVER" ? (userRole === "buyer" ? "Repartidor" : "Comprador")
                : (userRole === "buyer" ? "Vendedor" : "Comprador");

    // Initialize or load chat
    const initChat = useCallback(async () => {
        if (!session?.user) return;
        try {
            const res = await fetch("/api/order-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, chatType })
            });
            if (res.ok) {
                const data = await res.json();
                setChat(data);
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Error initializing chat:", error);
        }
    }, [session?.user, orderId, chatType]);

    // Poll for new messages
    const loadMessages = useCallback(async () => {
        if (!chat?.id) return;
        try {
            const res = await fetch(`/api/order-chat/${chat.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    }, [chat?.id]);

    // Init on open
    useEffect(() => {
        if (isOpen && !chat) {
            initChat();
        }
    }, [isOpen, chat, initChat]);

    // Poll messages every 5s when open
    useEffect(() => {
        if (isOpen && chat?.id) {
            loadMessages();
            pollRef.current = setInterval(loadMessages, 5000);
            return () => {
                if (pollRef.current) clearInterval(pollRef.current);
            };
        }
    }, [isOpen, chat?.id, loadMessages]);

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

    // Collapsed state — just the button
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${compact
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    : "bg-[#e60012] text-white hover:bg-red-700 shadow-md hover:shadow-lg"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chatear con {roleLabel}
            </button>
        );
    }

    // Open state — full chat panel
    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden flex flex-col ${compact ? "h-80" : "h-96"}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
                <div>
                    <p className="font-semibold text-sm">{counterpartName}</p>
                    <p className="text-xs text-blue-100">Pedido #{orderNumber} — {roleLabel}</p>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white text-lg"
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
                                    ? "bg-blue-600 text-white rounded-br-md"
                                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                                    }`}
                            >
                                {!isMine && msg.sender?.name && (
                                    <p className="text-xs font-semibold text-blue-600 mb-0.5">{msg.sender.name}</p>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Responses */}
            {showQuick && (
                <div className="border-t bg-white px-3 py-2 max-h-28 overflow-y-auto shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                        {quickResponses.map((qr) => (
                            <button
                                key={qr.id}
                                onClick={() => sendMessage(qr.message)}
                                className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
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
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${showQuick ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                    title="Respuestas rápidas"
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
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
