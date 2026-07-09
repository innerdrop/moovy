"use client";

import { useState, useEffect, useRef } from "react";
import {
    MessageCircle,
    Send,
    Loader2,
    Plus,
    ChevronLeft,
    User,
    Clock,
    CheckCheck
} from "lucide-react";
import Link from "next/link";
// fix/panel-comercio-auditoria: errores visibles, no tragados (estado UX de error).
import { toast } from "@/store/toast";
import { useSupportSocket } from "@/hooks/useSupportSocket";

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
}

export default function ComercioSoportePage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatSubject, setNewChatSubject] = useState("");
    const [newChatMessage, setNewChatMessage] = useState("");
    const [supportOnline, setSupportOnline] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedIdRef = useRef<string | null>(null);
    selectedIdRef.current = selectedChat?.id ?? null;

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

    // Estado del equipo: en línea → chat en vivo; offline → ticket. Poll 30s.
    useEffect(() => {
        const check = () => fetch("/api/support/status").then((r) => r.json()).then((d) => setSupportOnline(!!d.isOnline)).catch(() => {});
        check();
        const iv = setInterval(check, 30000);
        return () => clearInterval(iv);
    }, []);

    // Tiempo real: socket (instantáneo) + polling del chat abierto cada 5s (respaldo).
    useSupportSocket((data) => {
        if (data.chatId === selectedIdRef.current) openChat(data.chatId);
        fetchChats();
    });
    useEffect(() => {
        if (!selectedChat?.id) return;
        const iv = setInterval(() => { if (selectedIdRef.current) openChat(selectedIdRef.current); }, 5000);
        return () => clearInterval(iv);
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
            } else {
                toast.error("No pudimos cargar tus conversaciones. Recargá la página.");
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
            toast.error("Error de conexión al cargar soporte. Revisá tu internet.");
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
            } else {
                toast.error("No pudimos abrir la conversación. Intentá de nuevo.");
            }
        } catch (error) {
            console.error("Error fetching chat:", error);
            toast.error("Error de conexión al abrir la conversación.");
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
            } else {
                const d = await res.json().catch(() => ({}));
                toast.error(d.error || "No se pudo enviar el mensaje.");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    }

    async function createNewChat(e: React.FormEvent) {
        e.preventDefault();
        if (!newChatMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch("/api/support/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: newChatSubject || "Consulta general",
                    message: newChatMessage,
                    // feat/soporte-bandeja-ops: etiqueta el ticket como de comercio
                    // (el server valida contra la DB antes de confiar en esto).
                    origin: "MERCHANT"
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setShowNewChat(false);
                setNewChatSubject("");
                setNewChatMessage("");
                await fetchChats();
                openChat(data.chat?.id || data.id);
            } else {
                const d = await res.json().catch(() => ({}));
                toast.error(d.error || "No se pudo iniciar la consulta.");
            }
        } catch (error) {
            console.error("Error creating chat:", error);
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)]">
            <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-100 h-full flex overflow-hidden">
                {/* Sidebar - Chat List */}
                <div className={`w-full md:w-80 border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-lg text-gray-900">Soporte MOOVY</h2>
                            <span className="flex items-center gap-1.5 text-xs font-medium mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${supportOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                                <span className={supportOnline ? "text-green-600" : "text-gray-400"}>{supportOnline ? "En línea" : "Fuera de línea"}</span>
                            </span>
                        </div>
                        <button
                            onClick={() => setShowNewChat(true)}
                            disabled={!supportOnline}
                            title={supportOnline ? "Nueva consulta" : "Soporte no disponible ahora"}
                            className="p-2 bg-[#e60012] text-white rounded-lg hover:bg-[#cc000f] transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {chats.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">No tenés conversaciones</p>
                                <button
                                    onClick={() => setShowNewChat(true)}
                                    className="mt-4 text-[#e60012] font-medium text-sm"
                                >
                                    Iniciar nueva consulta
                                </button>
                            </div>
                        ) : (
                            chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => openChat(chat.id)}
                                    className={`w-full p-4 border-b text-left hover:bg-gray-50 transition ${selectedChat?.id === chat.id ? 'bg-red-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900 truncate">
                                            {chat.subject || "Consulta"}
                                        </span>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-[#e60012] text-white text-xs px-2 py-0.5 rounded-full">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(chat.lastMessageAt).toLocaleDateString("es-AR")}
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${chat.status === 'waiting' || chat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {chat.status === 'waiting' || chat.status === 'active' ? 'Abierto' : 'Cerrado'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${!selectedChat && !showNewChat ? 'hidden md:flex' : 'flex'}`}>
                    {showNewChat ? (
                        // New Chat Form
                        <div className="flex-1 flex flex-col">
                            <div className="p-4 border-b flex items-center gap-3">
                                <button
                                    onClick={() => setShowNewChat(false)}
                                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-gray-900">Nueva consulta</h3>
                            </div>
                            <form onSubmit={createNewChat} className="flex-1 p-6 flex flex-col">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Asunto (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newChatSubject}
                                        onChange={(e) => setNewChatSubject(e.target.value)}
                                        className="input w-full"
                                        placeholder="Ej: Problema con un pedido"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mensaje *
                                    </label>
                                    <textarea
                                        value={newChatMessage}
                                        onChange={(e) => setNewChatMessage(e.target.value)}
                                        className="input w-full h-40 resize-none"
                                        placeholder="Contanos en qué podemos ayudarte..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending || !newChatMessage.trim() || !supportOnline}
                                    className="mt-4 btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                    Enviar consulta
                                </button>
                            </form>
                        </div>
                    ) : selectedChat ? (
                        // Chat View
                        <>
                            <div className="p-4 border-b flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-[#e60012] text-white flex items-center justify-center font-bold text-sm">M</div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${supportOnline ? "bg-green-500" : "bg-gray-300"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{selectedChat.subject || "Consulta"}</h3>
                                    <p className="text-xs text-gray-500">
                                        Equipo MOOVY · {supportOnline ? "en línea" : "te respondemos pronto"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {selectedChat.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.isFromAdmin
                                                ? 'bg-white border shadow-sm'
                                                : 'bg-[#e60012] text-white'
                                            }`}>
                                            {msg.isFromAdmin && (
                                                <p className="text-xs font-medium text-[#e60012] mb-1">
                                                    MOOVY Soporte
                                                </p>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <div className={`flex items-center gap-1 mt-1 text-xs ${msg.isFromAdmin ? 'text-gray-400' : 'text-white/70'
                                                }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                                {!msg.isFromAdmin && msg.isRead && (
                                                    <CheckCheck className="w-3 h-3" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedChat && (selectedChat.status === "closed" || selectedChat.status === "resolved") ? (
                                <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-500">
                                    Esta consulta finalizó. Si necesitás más ayuda, iniciá una nueva desde el botón +.
                                </div>
                            ) : supportOnline ? (
                                <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Escribí tu mensaje..."
                                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="p-3 bg-[#e60012] text-white rounded-full hover:bg-[#cc000f] transition disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-500">
                                    El soporte no está disponible ahora. Vas a poder escribir cuando el equipo esté en línea.
                                </div>
                            )}
                        </>
                    ) : (
                        // Empty State
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="font-bold text-gray-900 mb-2">Centro de Soporte</h3>
                                <p className="text-gray-500 mb-4">
                                    {supportOnline
                                        ? "Estamos en línea — chateá con nuestro equipo y te respondemos al instante."
                                        : "El soporte no está disponible en este momento. Volvé cuando estemos en línea para chatear con nuestro equipo."}
                                </p>
                                <button
                                    onClick={() => setShowNewChat(true)}
                                    disabled={!supportOnline}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {supportOnline ? "Chatear en vivo" : "No disponible ahora"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
