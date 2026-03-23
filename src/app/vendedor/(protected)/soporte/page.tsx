"use client";

import { useState, useEffect, useRef } from "react";
import {
    MessageCircle,
    Send,
    Loader2,
    Plus,
    ArrowLeft,
    Clock,
    CheckCheck,
} from "lucide-react";

interface Message {
    id: string;
    content: string;
    isFromAdmin: boolean;
    isSystem: boolean;
    isRead: boolean;
    createdAt: string;
    sender?: { id: string; name?: string };
}

interface Chat {
    id: string;
    subject: string;
    status: string;
    lastMessageAt: string;
    messages: Message[];
    unreadCount: number;
    operator?: { displayName: string; isOnline: boolean };
}

const CATEGORIES = [
    { id: "comisiones", label: "Comisiones y pagos" },
    { id: "listings", label: "Mis listings" },
    { id: "envios", label: "Envíos y logística" },
    { id: "cuenta", label: "Mi cuenta" },
    { id: "otro", label: "Otro" },
];

export default function VendedorSoportePage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatMessage, setNewChatMessage] = useState("");
    const [newChatCategory, setNewChatCategory] = useState("otro");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchChats(); }, []);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedChat?.messages]);

    // Poll
    useEffect(() => {
        if (!selectedChat) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/support/chats/${selectedChat.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setSelectedChat(prev => prev && JSON.stringify(prev.messages) !== JSON.stringify(data.messages) ? data : prev);
                }
            } catch { /* silent */ }
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedChat?.id]);

    const fetchChats = async () => {
        try {
            const res = await fetch("/api/support/chats");
            if (res.ok) setChats(await res.json());
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const openChat = async (chat: Chat) => {
        try {
            const res = await fetch(`/api/support/chats/${chat.id}`);
            if (res.ok) {
                setSelectedChat(await res.json());
                await fetchChats();
            }
        } catch { /* silent */ }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;
        setSending(true);
        try {
            const res = await fetch(`/api/support/chats/${selectedChat.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage.trim() })
            });
            if (res.ok) {
                const msg = await res.json();
                setSelectedChat(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : null);
                setNewMessage("");
            }
        } catch { /* silent */ } finally { setSending(false); }
    };

    const createChat = async () => {
        if (!newChatMessage.trim()) return;
        setSending(true);
        try {
            const res = await fetch("/api/support/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: newChatCategory, message: newChatMessage.trim() })
            });
            if (res.ok) {
                const chat = await res.json();
                setSelectedChat(chat);
                setShowNewChat(false);
                setNewChatMessage("");
                await fetchChats();
            }
        } catch { /* silent */ } finally { setSending(false); }
    };

    // Chat list view
    if (!selectedChat && !showNewChat) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Soporte MOOVY</h1>
                        <p className="text-gray-500 text-sm">Contactá al equipo de soporte</p>
                    </div>
                    <button
                        onClick={() => setShowNewChat(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva consulta
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : chats.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No tenés consultas de soporte</p>
                        <p className="text-gray-400 text-sm">Creá una nueva si necesitás ayuda</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {chats.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => openChat(chat)}
                                className="w-full text-left p-4 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-semibold text-gray-900 text-sm truncate flex-1">{chat.subject}</p>
                                    {chat.unreadCount > 0 && (
                                        <span className="ml-2 bg-emerald-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${chat.status === "active" ? "bg-green-100 text-green-700" : chat.status === "waiting" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                                        {chat.status === "active" ? "Activo" : chat.status === "waiting" ? "En espera" : chat.status === "resolved" ? "Resuelto" : "Cerrado"}
                                    </span>
                                    <span>{new Date(chat.lastMessageAt).toLocaleDateString("es-AR")}</span>
                                    {chat.operator && <span>· {chat.operator.displayName}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // New chat form
    if (showNewChat) {
        return (
            <div className="space-y-6">
                <button onClick={() => setShowNewChat(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm">
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <h2 className="text-xl font-bold text-gray-900">Nueva consulta</h2>

                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setNewChatCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${newChatCategory === cat.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tu consulta</label>
                        <textarea
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            placeholder="Describí tu consulta..."
                            rows={4}
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                    </div>
                    <button
                        onClick={createChat}
                        disabled={sending || !newChatMessage.trim()}
                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar
                    </button>
                </div>
            </div>
        );
    }

    // Chat conversation view
    const chat = selectedChat!;
    return (
        <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b">
                <button onClick={() => setSelectedChat(null)} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{chat.subject}</p>
                    {chat.operator && (
                        <p className="text-xs text-gray-400">Operador: {chat.operator.displayName}</p>
                    )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${chat.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {chat.status === "active" ? "Activo" : chat.status === "waiting" ? "En espera" : "Cerrado"}
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {chat.messages.map(msg => {
                    if (msg.isSystem) {
                        return (
                            <div key={msg.id} className="text-center">
                                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.content}</span>
                            </div>
                        );
                    }
                    return (
                        <div key={msg.id} className={`flex ${msg.isFromAdmin ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.isFromAdmin ? "bg-gray-100 text-gray-900 rounded-bl-md" : "bg-emerald-600 text-white rounded-br-md"}`}>
                                {msg.isFromAdmin && msg.sender?.name && (
                                    <p className="text-xs font-semibold text-emerald-600 mb-0.5">{msg.sender.name}</p>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${msg.isFromAdmin ? "text-gray-400" : "text-emerald-200"}`}>
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
                                    {!msg.isFromAdmin && msg.isRead && <CheckCheck className="w-3 h-3" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {chat.status !== "closed" && (
                <div className="border-t pt-3 flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Escribí tu mensaje..."
                        className="flex-1 px-4 py-2.5 border rounded-full text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="bg-emerald-600 text-white p-2.5 rounded-full hover:bg-emerald-700 disabled:opacity-40 transition"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </div>
    );
}
