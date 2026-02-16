"use client";

import { useState, useEffect, useRef } from "react";
import {
    MessageCircle,
    Send,
    Loader2,
    ChevronLeft,
    Clock,
    CheckCheck,
    User,
    Store,
    Bike,
    XCircle,
    CheckCircle
} from "lucide-react";

interface Message {
    id: string;
    content: string;
    isFromAdmin: boolean;
    isRead: boolean;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        role: string;
    };
}

interface Chat {
    id: string;
    subject: string;
    status: string;
    lastMessageAt: string;
    messages: Message[];
    unreadCount: number;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export default function AdminSoportePage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchChats();
        // Poll for new messages every 10 seconds
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

    // Poll active chat for new messages
    useEffect(() => {
        if (!selectedChat) return;

        const interval = setInterval(async () => {
            try {
                // Don't use openChat to avoid UI flickering/unread count logic loop
                const res = await fetch(`/api/support/chats/${selectedChat.id}`);
                if (res.ok) {
                    const data = await res.json();

                    // Only update if there are new messages (simple length check or last ID)
                    setSelectedChat(prev => {
                        if (!prev) return null;
                        // Determine if we need to update to avoid render loops
                        if (JSON.stringify(prev.messages) !== JSON.stringify(data.messages)) {
                            return data;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedChat?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    async function fetchChats() {
        try {
            const res = await fetch("/api/support/chats");
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function openChat(chatId: string) {
        try {
            const res = await fetch(`/api/support/chats/${chatId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedChat(data);
                // Update local state to remove unread badge
                setChats(chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedChat || !newMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch(`/api/support/chats/${selectedChat.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage }),
            });

            if (res.ok) {
                const message = await res.json();
                setSelectedChat({
                    ...selectedChat,
                    messages: [...selectedChat.messages, message]
                });
                setNewMessage("");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setSending(false);
        }
    }

    function requestToggleChatStatus() {
        if (!selectedChat) return;
        // If closing, show confirmation
        if (selectedChat.status === "open") {
            setShowCloseConfirm(true);
        } else {
            // Reopening doesn't need confirmation
            toggleChatStatus();
        }
    }

    async function toggleChatStatus() {
        if (!selectedChat) return;
        setShowCloseConfirm(false);

        const newStatus = selectedChat.status === "open" ? "closed" : "open";

        try {
            const res = await fetch(`/api/support/chats/${selectedChat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setSelectedChat({ ...selectedChat, status: newStatus });
                setChats(chats.map(c => c.id === selectedChat.id ? { ...c, status: newStatus } : c));
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    const filteredChats = filter === "all"
        ? chats
        : chats.filter(c => c.status === filter);

    const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Centro de Soporte</h1>
                    <p className="text-gray-600">
                        {chats.length} conversaciones • {totalUnread > 0 ? `${totalUnread} sin leer` : "Todo al día"}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border h-[calc(100vh-12rem)] flex overflow-hidden">
                {/* Sidebar - Chat List */}
                <div className={`w-full md:w-80 border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    {/* Filters */}
                    <div className="p-3 border-b flex gap-2">
                        {["all", "open", "closed"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f
                                    ? 'bg-[#e60012] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f === "all" ? "Todos" : f === "open" ? "Abiertos" : "Cerrados"}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredChats.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">No hay conversaciones</p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => openChat(chat.id)}
                                    className={`w-full p-4 border-b text-left hover:bg-gray-50 transition ${selectedChat?.id === chat.id ? 'bg-red-50 border-l-4 border-l-[#e60012]' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${chat.user.role === "MERCHANT" ? 'bg-purple-100' : 'bg-blue-100'
                                            }`}>
                                            {chat.user.role === "MERCHANT" ? (
                                                <Store className="w-4 h-4 text-purple-600" />
                                            ) : (
                                                <Bike className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate text-sm">
                                                {chat.user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {chat.user.role === "MERCHANT" ? "Comercio" : "Repartidor"}
                                            </p>
                                        </div>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-[#e60012] text-white text-xs px-2 py-0.5 rounded-full">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-800 font-medium truncate mb-1">
                                        {chat.subject}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(chat.lastMessageAt).toLocaleDateString("es-AR")}
                                        <span className={`ml-auto px-1.5 py-0.5 rounded text-xs ${chat.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {chat.status === 'open' ? 'Abierto' : 'Cerrado'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    {selectedChat ? (
                        <>
                            <div className="p-4 border-b flex items-center gap-3 bg-white">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedChat.user.role === "MERCHANT" ? 'bg-purple-100' : 'bg-blue-100'
                                    }`}>
                                    {selectedChat.user.role === "MERCHANT" ? (
                                        <Store className="w-5 h-5 text-purple-600" />
                                    ) : (
                                        <Bike className="w-5 h-5 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{selectedChat.user.name}</h3>
                                    <p className="text-xs text-gray-500">
                                        {selectedChat.user.email} • {selectedChat.subject}
                                    </p>
                                </div>
                                <button
                                    onClick={requestToggleChatStatus}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedChat.status === "open"
                                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                                        : "bg-green-100 text-green-700 hover:bg-green-200"
                                        }`}
                                >
                                    {selectedChat.status === "open" ? (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Cerrar
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Reabrir
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                {selectedChat.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.isFromAdmin
                                            ? 'bg-[#e60012] text-white'
                                            : 'bg-white shadow-sm border'
                                            }`}>
                                            {!msg.isFromAdmin && (
                                                <p className="text-xs font-medium text-gray-600 mb-1">
                                                    {msg.sender.name}
                                                </p>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <div className={`flex items-center gap-1 mt-1 text-xs ${msg.isFromAdmin ? 'text-white/70' : 'text-gray-400'
                                                }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                                {msg.isFromAdmin && msg.isRead && (
                                                    <CheckCheck className="w-3 h-3" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedChat.status === "closed" ? (
                                <div className="p-4 border-t bg-yellow-50 text-center">
                                    <p className="text-yellow-800 text-sm mb-2">
                                        Este chat está cerrado. Reabrilo para poder responder.
                                    </p>
                                    <button
                                        onClick={toggleChatStatus}
                                        className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition"
                                    >
                                        Reabrir chat
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Escribí tu respuesta..."
                                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="p-3 bg-[#e60012] text-white rounded-full hover:bg-[#c5000f] transition disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="font-bold text-gray-900 mb-2">Centro de Soporte</h3>
                                <p className="text-gray-500">
                                    Seleccioná una conversación para responder
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Close Chat Confirmation Modal */}
            {showCloseConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-lg text-gray-900 mb-4">Cerrar Conversación</h3>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de cerrar esta conversación con {selectedChat?.user.name}?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCloseConfirm(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={toggleChatStatus}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                                Cerrar Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
