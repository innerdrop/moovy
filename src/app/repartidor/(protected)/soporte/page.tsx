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
import Link from "next/link";

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

export default function RepartidorSoportePage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatSubject, setNewChatSubject] = useState("");
    const [newChatMessage, setNewChatMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

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

    async function createNewChat(e: React.FormEvent) {
        e.preventDefault();
        if (!newChatMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch("/api/support/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: newChatSubject || "Consulta de repartidor",
                    message: newChatMessage
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setShowNewChat(false);
                setNewChatSubject("");
                setNewChatMessage("");
                await fetchChats();
                openChat(data.chat?.id || data.id);
            }
        } catch (error) {
            console.error("Error:", error);
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
            <div className="bg-white rounded-xl shadow-sm h-full flex overflow-hidden">
                {/* Sidebar - Chat List */}
                <div className={`w-full md:w-72 border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b flex items-center justify-between bg-[#e60012] text-white">
                        <h2 className="font-bold">Soporte MOOVY</h2>
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {chats.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">Sin conversaciones</p>
                                <button
                                    onClick={() => setShowNewChat(true)}
                                    className="mt-3 text-[#e60012] font-medium text-sm"
                                >
                                    Iniciar consulta
                                </button>
                            </div>
                        ) : (
                            chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => openChat(chat.id)}
                                    className={`w-full p-3 border-b text-left hover:bg-gray-50 ${selectedChat?.id === chat.id ? 'bg-red-50 border-l-4 border-l-[#e60012]' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900 text-sm truncate">
                                            {chat.subject}
                                        </span>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-[#e60012] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(chat.lastMessageAt).toLocaleDateString("es-AR", { day: 'numeric', month: 'short' })}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${!selectedChat && !showNewChat ? 'hidden md:flex' : 'flex'}`}>
                    {showNewChat ? (
                        <div className="flex-1 flex flex-col">
                            <div className="p-4 border-b flex items-center gap-3">
                                <Link href="/repartidor" className="p-2 hover:bg-gray-100 rounded-lg transition" title="Volver al inicio">
                                    <ChevronLeft className="w-5 h-5" />
                                </Link>
                                <button onClick={() => setShowNewChat(false)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-gray-900">Nueva consulta</h3>
                            </div>
                            <form onSubmit={createNewChat} className="flex-1 p-4 flex flex-col">
                                <input
                                    type="text"
                                    value={newChatSubject}
                                    onChange={(e) => setNewChatSubject(e.target.value)}
                                    className="input w-full mb-3"
                                    placeholder="Asunto (opcional)"
                                />
                                <textarea
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    className="input w-full flex-1 resize-none mb-3"
                                    placeholder="¿En qué podemos ayudarte?"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newChatMessage.trim()}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Enviar
                                </button>
                            </form>
                        </div>
                    ) : selectedChat ? (
                        <>
                            <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
                                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{selectedChat.subject}</h3>
                                    <p className="text-xs text-gray-500">Soporte MOOVY</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                                {selectedChat.messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.isFromAdmin ? 'bg-white shadow-sm' : 'bg-[#e60012] text-white'
                                            }`}>
                                            {msg.isFromAdmin && (
                                                <p className="text-xs font-medium text-[#e60012] mb-1">MOOVY</p>
                                            )}
                                            <p className="text-sm">{msg.content}</p>
                                            <div className={`flex items-center gap-1 mt-1 text-xs ${msg.isFromAdmin ? 'text-gray-400' : 'text-white/70'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}
                                                {!msg.isFromAdmin && msg.isRead && <CheckCheck className="w-3 h-3" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={sendMessage} className="p-3 border-t bg-white flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Mensaje..."
                                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="p-2.5 bg-[#e60012] text-white rounded-full hover:bg-[#c5000f] disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <MessageCircle className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                                <h3 className="font-bold text-gray-900 mb-2">Soporte</h3>
                                <p className="text-gray-500 text-sm mb-4">¿Tenés dudas? Escribinos.</p>
                                <button onClick={() => setShowNewChat(true)} className="btn-primary">
                                    Nueva consulta
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
