"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { ChatBubbleIcon } from "./ChatBubbleIcon";
import { SupportChat } from "@/types/support";

export function ChatWidget() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [chats, setChats] = useState<SupportChat[]>([]);
    const [activeChat, setActiveChat] = useState<SupportChat | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check operator status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch("/api/support/status");
                if (res.ok) {
                    const data = await res.json();
                    setIsOnline(data.isOnline);
                }
            } catch (error) {
                console.error("Error checking support status:", error);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    // Load user's chats
    useEffect(() => {
        if (!session?.user || !isOpen) return;

        const loadChats = async () => {
            try {
                const res = await fetch("/api/support/chats");
                if (res.ok) {
                    const data = await res.json();
                    setChats(data);
                    // Set active chat to most recent
                    if (data.length > 0 && !activeChat) {
                        setActiveChat(data[0]);
                    }
                }
            } catch (error) {
                console.error("Error loading chats:", error);
            }
        };

        loadChats();
    }, [session?.user, isOpen]);

    // Load active chat detail
    useEffect(() => {
        if (!activeChat) return;

        const loadChat = async () => {
            try {
                const res = await fetch(`/api/support/chats/${activeChat.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setActiveChat(data);
                }
            } catch (error) {
                console.error("Error loading chat:", error);
            }
        };

        loadChat();
        const interval = setInterval(loadChat, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [activeChat?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);

    const handleCreateChat = async (category: string) => {
        if (!message.trim()) return;

        try {
            setLoading(true);
            const res = await fetch("/api/support/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    subject: "Consulta desde widget",
                    message: message.trim()
                })
            });

            if (res.ok) {
                const newChat = await res.json();
                setChats(prev => [newChat, ...prev]);
                setActiveChat(newChat);
                setMessage("");
            }
        } catch (error) {
            console.error("Error creating chat:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !activeChat) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/support/chats/${activeChat.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message.trim() })
            });

            if (res.ok) {
                const newMessage = await res.json();
                setActiveChat(prev => prev ? {
                    ...prev,
                    messages: [...(prev.messages || []), newMessage]
                } : null);
                setMessage("");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRateChat = async (rating: number) => {
        if (!activeChat) return;

        try {
            const res = await fetch(`/api/support/chats/${activeChat.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating })
            });

            if (res.ok) {
                const updated = await res.json();
                setActiveChat(updated);
                // Show thank you message
                setTimeout(() => {
                    setIsOpen(false);
                }, 2000);
            }
        } catch (error) {
            console.error("Error rating chat:", error);
        }
    };

    // If not logged in and no active chat, show pre-chat form
    if (!session?.user && !activeChat) {
        return (
            <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40">
                {/* Bubble button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full bg-[#e60012] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${
                        isOpen ? "scale-125" : "hover:scale-110"
                    }`}
                    aria-label="Abrir chat de soporte"
                >
                    <ChatBubbleIcon className="w-7 h-7" />
                </button>

                {/* Chat window */}
                {isOpen && (
                    <div className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-32px)] bg-white rounded-lg shadow-2xl flex flex-col h-96 md:h-[500px] animate-in slide-in-from-bottom-5">
                        {/* Header */}
                        <div className="bg-[#e60012] text-white p-4 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">Soporte MOOVY</h3>
                                    <p className="text-sm opacity-90">
                                        {isOnline ? "🟢 En línea" : "⚫ Fuera de línea"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-lg hover:opacity-80"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 flex flex-col overflow-hidden p-4">
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-4xl mb-3">👋</div>
                                    <p className="font-semibold mb-2">
                                        {isOnline ? "¡Hola! Estamos aquí para ayudarte" : "Estamos fuera de línea"}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {isOnline
                                            ? "Escribe tu mensaje y nos pondremos en contacto"
                                            : "Dejanos tu mensaje y te responderemos pronto"}
                                    </p>
                                </div>
                            </div>

                            {/* Input */}
                            <div className="border-t pt-4 space-y-3">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Escribí tu consulta..."
                                    className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                    rows={2}
                                />
                                <button
                                    onClick={() => handleCreateChat("otro")}
                                    disabled={loading || !message.trim()}
                                    className="w-full bg-[#e60012] text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {loading ? "Enviando..." : "Enviar mensaje"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // If logged in or has active chat
    return (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40">
            {/* Bubble button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full bg-[#e60012] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center relative ${
                    isOpen ? "scale-125" : "hover:scale-110"
                }`}
                aria-label="Chat de soporte"
            >
                <ChatBubbleIcon className="w-7 h-7" />
                {chats.some(c => (c.unreadCount || 0) > 0) && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                    </span>
                )}
            </button>

            {/* Chat window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-32px)] bg-white rounded-lg shadow-2xl flex flex-col h-96 md:h-[500px] animate-in slide-in-from-bottom-5">
                    {!activeChat ? (
                        <>
                            {/* Header - Chat list */}
                            <div className="bg-[#e60012] text-white p-4 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Mis consultas</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-lg hover:opacity-80"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Chat list */}
                            <div className="flex-1 overflow-y-auto">
                                {chats.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        No tenés consultas aún
                                    </div>
                                ) : (
                                    chats.map(chat => (
                                        <button
                                            key={chat.id}
                                            onClick={() => setActiveChat(chat)}
                                            className="w-full text-left p-3 border-b hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {chat.subject || "Consulta"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(chat.createdAt).toLocaleDateString("es-AR")}
                                                    </p>
                                                </div>
                                                {chat.unreadCount ? (
                                                    <span className="bg-[#e60012] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                        {chat.unreadCount}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Estado: <span className="capitalize">{chat.status}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* New chat button */}
                            <div className="border-t p-4">
                                <button
                                    onClick={() => setActiveChat({ id: "new", userId: "", status: "waiting", priority: "normal", createdAt: new Date(), updatedAt: new Date(), lastMessageAt: new Date(), messages: [] })}
                                    className="w-full bg-[#e60012] text-white py-2 rounded-lg hover:bg-red-700 font-medium text-sm"
                                >
                                    Nueva consulta
                                </button>
                            </div>
                        </>
                    ) : activeChat.id === "new" ? (
                        <>
                            {/* Header - New chat */}
                            <div className="bg-[#e60012] text-white p-4 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Nueva consulta</h3>
                                    <button
                                        onClick={() => setActiveChat(null)}
                                        className="text-lg hover:opacity-80"
                                    >
                                        ←
                                    </button>
                                </div>
                            </div>

                            {/* New chat form */}
                            <div className="flex-1 flex flex-col p-4">
                                <div className="space-y-3 flex-1">
                                    <div>
                                        <label className="text-sm font-medium block mb-2">
                                            Categoría
                                        </label>
                                        <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012] text-sm">
                                            <option value="otro">Otra consulta</option>
                                            <option value="pedido">Sobre un pedido</option>
                                            <option value="pago">Sobre el pago</option>
                                            <option value="cuenta">Mi cuenta</option>
                                            <option value="reclamo">Reclamo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium block mb-2">
                                            Mensaje
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Contanos qué necesitás..."
                                            className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#e60012] text-sm"
                                            rows={4}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const cat = (document.querySelector("select") as HTMLSelectElement)?.value || "otro";
                                        handleCreateChat(cat);
                                    }}
                                    disabled={loading || !message.trim()}
                                    className="w-full bg-[#e60012] text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {loading ? "Enviando..." : "Enviar consulta"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Header - Active chat */}
                            <div className="bg-[#e60012] text-white p-4 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{activeChat.subject || "Consulta"}</h3>
                                        <p className="text-xs opacity-90">
                                            {activeChat.operator?.isOnline ? "🟢 Operador en línea" : "Esperando respuesta"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveChat(null)}
                                        className="text-lg hover:opacity-80"
                                    >
                                        ←
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                                {(activeChat.messages || []).map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isFromAdmin ? "justify-start" : "justify-end"}`}
                                    >
                                        <div
                                            className={`max-w-xs px-3 py-2 rounded-lg ${
                                                msg.isFromAdmin
                                                    ? "bg-white border border-gray-200"
                                                    : "bg-[#e60012] text-white"
                                            }`}
                                        >
                                            {msg.isSystem && (
                                                <p className="text-xs text-gray-500 text-center italic">
                                                    {msg.content}
                                                </p>
                                            )}
                                            {!msg.isSystem && (
                                                <>
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p className="text-xs opacity-60 mt-1">
                                                        {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Rating (if resolved) */}
                            {activeChat.status === "resolved" && !activeChat.rating && (
                                <div className="border-t p-4 bg-yellow-50">
                                    <p className="text-sm font-medium mb-2">¿Cómo fue tu experiencia?</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <button
                                                key={rating}
                                                onClick={() => handleRateChat(rating)}
                                                className="text-2xl hover:scale-125 transition-transform"
                                            >
                                                {"★".repeat(rating)}{"☆".repeat(5 - rating)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input */}
                            {activeChat.status !== "closed" && activeChat.status !== "resolved" && (
                                <div className="border-t p-4">
                                    <div className="flex gap-2">
                                        <input
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Escribí un mensaje..."
                                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012] text-sm"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={loading || !message.trim()}
                                            className="bg-[#e60012] text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        >
                                            📤
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Closed message */}
                            {activeChat.status === "closed" && activeChat.rating && (
                                <div className="border-t p-4 bg-green-50 text-center">
                                    <p className="text-sm">
                                        ¡Gracias por tu calificación! {"★".repeat(activeChat.rating)}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
