"use client";

import { useState, useEffect, useRef } from "react";
import {
    MessageCircle,
    Send,
    Loader2,
    Plus,
    ChevronLeft,
    Clock,
    CheckCheck
} from "lucide-react";
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
        <div className="h-[calc(100dvh-232px)] min-h-[420px] md:h-[calc(100vh-8rem)]">
            {/* Tailwind 4: un `border` sin color usa currentColor (negro). TODOS los
                bordes de esta pantalla llevan color explícito — si no, aparecen
                líneas negras (la vertical del panel a ancho completo en mobile). */}
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(15,23,42,0.10)] ring-1 ring-gray-100 h-full flex overflow-hidden">
                {/* Sidebar - Chat List */}
                <div className={`w-full md:w-80 md:border-r md:border-gray-100 flex flex-col ${selectedChat || showNewChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 rounded-2xl bg-[#e60012] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-red-200">M</div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${supportOnline ? "bg-green-500" : "bg-gray-300"}`} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-black text-[16px] text-gray-900 leading-tight">Soporte MOOVY</h2>
                                <span className="flex items-center gap-1.5 text-[12px] font-medium mt-0.5">
                                    <span className={supportOnline ? "text-green-600" : "text-gray-400"}>{supportOnline ? "En línea ahora" : "Te respondemos pronto"}</span>
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowNewChat(true)}
                            title="Nueva consulta"
                            className="flex-shrink-0 p-2.5 bg-[#e60012] text-white rounded-2xl shadow-sm shadow-red-200 hover:bg-[#cc000f] active:scale-95 transition"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {chats.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center px-8 py-10 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                                    <MessageCircle className="h-8 w-8 text-[#e60012]" />
                                </div>
                                <h3 className="mt-4 text-[17px] font-black text-gray-900">¿Necesitás una mano?</h3>
                                <p className="mt-1.5 max-w-[26ch] text-[14px] leading-relaxed text-gray-500">
                                    {supportOnline
                                        ? "Estamos en línea: escribinos y te respondemos al instante."
                                        : "Dejanos tu consulta y te respondemos apenas estemos en línea."}
                                </p>
                                <button
                                    onClick={() => setShowNewChat(true)}
                                    className="mt-5 flex h-12 w-full max-w-[260px] items-center justify-center rounded-2xl bg-[#e60012] text-[15px] font-black text-white transition hover:bg-[#cc000f]"
                                >
                                    Iniciar consulta
                                </button>
                                <p className="mt-3 text-[12px] text-gray-400">Somos de Ushuaia — atención humana, sin bots.</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {chats.map((chat) => {
                                    const isOpen = chat.status === "waiting" || chat.status === "active";
                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => openChat(chat.id)}
                                            className={`w-full rounded-2xl p-3.5 text-left transition ${selectedChat?.id === chat.id
                                                ? "bg-red-50 ring-1 ring-red-100"
                                                : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-bold text-[14px] text-gray-900 truncate">
                                                    {chat.subject || "Consulta"}
                                                </span>
                                                {chat.unreadCount > 0 && (
                                                    <span className="flex-shrink-0 bg-[#e60012] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[12px] text-gray-400">
                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                {new Date(chat.lastMessageAt).toLocaleDateString("es-AR")}
                                                <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium ${isOpen ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                                                    }`}>
                                                    {isOpen ? "Abierto" : "Cerrado"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${!selectedChat && !showNewChat ? 'hidden md:flex' : 'flex'}`}>
                    {showNewChat ? (
                        // New Chat Form
                        <div className="flex-1 flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                <button
                                    onClick={() => setShowNewChat(false)}
                                    className="md:hidden -ml-1 p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition"
                                    aria-label="Volver"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h3 className="font-black text-[16px] text-gray-900">Nueva consulta</h3>
                            </div>
                            <form onSubmit={createNewChat} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
                                <p className="text-[14px] leading-relaxed text-gray-500">
                                    {supportOnline
                                        ? "Estamos en línea: contanos qué pasa y te respondemos al instante."
                                        : "Contanos qué pasa. Te respondemos apenas estemos en línea."}
                                </p>
                                <textarea
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    autoFocus
                                    className="w-full flex-1 min-h-[140px] resize-none rounded-2xl border border-gray-200 p-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-[#e60012] focus:outline-none focus:ring-2 focus:ring-red-100"
                                    placeholder="Escribí tu consulta acá…"
                                    required
                                />
                                <input
                                    type="text"
                                    value={newChatSubject}
                                    onChange={(e) => setNewChatSubject(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-gray-200 px-4 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-[#e60012] focus:outline-none"
                                    placeholder="Asunto (opcional) — ej: problema con un pedido"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newChatMessage.trim()}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e60012] text-[15px] font-black text-white transition hover:bg-[#cc000f] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Enviar consulta
                                </button>
                            </form>
                        </div>
                    ) : selectedChat ? (
                        // Chat View
                        <>
                            <div className="p-4 border-b border-gray-100 flex items-center gap-2.5">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="md:hidden -ml-1 p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition"
                                    aria-label="Volver a mis consultas"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-2xl bg-[#e60012] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-red-200">M</div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${supportOnline ? "bg-green-500" : "bg-gray-300"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-[15px] text-gray-900 truncate leading-tight">{selectedChat.subject || "Consulta"}</h3>
                                    <p className="text-[12px] text-gray-400 mt-0.5">
                                        Equipo MOOVY · {supportOnline ? "en línea" : "te respondemos pronto"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2.5 bg-gray-50/70">
                                {selectedChat.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`max-w-[82%] px-3.5 py-2.5 shadow-sm ${msg.isFromAdmin
                                            ? 'bg-white border border-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                                            : 'bg-[#e60012] text-white rounded-2xl rounded-br-md'
                                            }`}>
                                            {msg.isFromAdmin && (
                                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#e60012] mb-1">
                                                    MOOVY Soporte
                                                </p>
                                            )}
                                            <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${msg.isFromAdmin ? 'text-gray-400' : 'text-white/70'
                                                }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                                {!msg.isFromAdmin && msg.isRead && (
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Sin respuesta todavía: el comercio ve que su mensaje llegó y qué esperar. */}
                                {selectedChat.messages.length > 0 && !selectedChat.messages.some((m) => m.isFromAdmin) && (
                                    <p className="pt-2 text-center text-[12px] text-gray-400">
                                        {supportOnline
                                            ? "Estamos en línea — te respondemos en un momento."
                                            : "Recibimos tu mensaje. Te respondemos apenas volvamos."}
                                    </p>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedChat && (selectedChat.status === "closed" || selectedChat.status === "resolved") ? (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-[13px] text-gray-500">
                                    Esta consulta finalizó. Si necesitás más ayuda, iniciá una nueva con el botón +.
                                </div>
                            ) : (
                                <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={supportOnline ? "Escribí tu mensaje…" : "Escribí — te respondemos apenas volvamos"}
                                        className="flex-1 min-w-0 h-11 px-4 bg-gray-50 border border-gray-200 rounded-full text-[15px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#e60012] focus:outline-none focus:ring-2 focus:ring-red-100 transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="flex-shrink-0 h-11 w-11 flex items-center justify-center bg-[#e60012] text-white rounded-full shadow-sm shadow-red-200 hover:bg-[#cc000f] active:scale-95 transition disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
                                        aria-label="Enviar mensaje"
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
                        // Empty State
                        <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-50/70">
                            <div className="max-w-sm">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                                    <MessageCircle className="h-8 w-8 text-[#e60012]" />
                                </div>
                                <h3 className="mt-4 text-[18px] font-black text-gray-900">Centro de Soporte</h3>
                                <p className="mt-1.5 text-[14px] leading-relaxed text-gray-500">
                                    {supportOnline
                                        ? "Estamos en línea — escribinos y te respondemos al instante."
                                        : "Dejanos tu consulta y te respondemos apenas estemos en línea."}
                                </p>
                                <button
                                    onClick={() => setShowNewChat(true)}
                                    className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-[#e60012] px-8 text-[15px] font-black text-white shadow-sm shadow-red-200 transition hover:bg-[#cc000f] active:scale-95"
                                >
                                    {supportOnline ? "Chatear en vivo" : "Iniciar consulta"}
                                </button>
                                <p className="mt-3 text-[12px] text-gray-400">Somos de Ushuaia — atención humana, sin bots.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
