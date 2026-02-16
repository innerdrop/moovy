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

interface SupportViewProps {
    onBack: () => void;
    onChatRead?: () => void;
}

export default function SupportView({ onBack, onChatRead }: SupportViewProps) {
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
                            // If new messages arrived, mark as read
                            if (onChatRead) onChatRead();
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
                // Refresh parent unread count
                if (onChatRead) onChatRead();
                // Also update local list to remove badge immediately
                setChats(prev => prev.map(c =>
                    c.id === chatId ? { ...c, unreadCount: 0 } : c
                ));
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
            <div className="absolute inset-0 z-50 bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 bg-gray-50 animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white shadow-sm h-full flex overflow-hidden">
                    {/* Sidebar - Chat List */}
                    <div className={`w-full md:w-72 border-r flex flex-col ${selectedChat || showNewChat ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b flex items-center justify-between bg-[#e60012] text-white">
                            <div className="flex items-center gap-2">
                                <button onClick={onBack} className="p-1 hover:bg-white/20 rounded transition">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h2 className="font-bold">Soporte MOOVY</h2>
                            </div>
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
                                    <button onClick={() => setShowNewChat(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="font-bold text-gray-900">Nueva consulta</h3>
                                </div>
                                <form onSubmit={createNewChat} className="flex-1 p-4 flex flex-col">
                                    <input
                                        type="text"
                                        value={newChatSubject}
                                        onChange={(e) => setNewChatSubject(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                        placeholder="Asunto (opcional)"
                                    />
                                    <textarea
                                        value={newChatMessage}
                                        onChange={(e) => setNewChatMessage(e.target.value)}
                                        className="w-full flex-1 resize-none mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                        placeholder="¿En qué podemos ayudarte?"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newChatMessage.trim()}
                                        className="w-full py-3 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] flex items-center justify-center gap-2"
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
                                    <div className="flex-1 pt-safe-top">
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

                                <div className="p-4 bg-white border-t border-gray-100" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                                    <form onSubmit={sendMessage} className="flex gap-2 items-center bg-gray-50 rounded-[24px] p-2 border border-transparent focus-within:bg-white focus-within:border-red-100 focus-within:shadow-[0_4px_20px_-4px_rgba(230,0,18,0.1)] transition-all duration-300">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Escribe un mensaje..."
                                            className="flex-1 bg-transparent px-4 py-2 outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="w-11 h-11 bg-[#e60012] text-white rounded-full hover:bg-[#c5000f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-90 transition-all"
                                        >
                                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center p-8 hidden md:flex">
                                <div>
                                    <MessageCircle className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                                    <h3 className="font-bold text-gray-900 mb-2">Soporte</h3>
                                    <p className="text-gray-500 text-sm mb-4">¿Tenés dudas? Escribinos.</p>
                                    <button onClick={() => setShowNewChat(true)} className="px-4 py-2 bg-[#e60012] text-white rounded-lg">
                                        Nueva consulta
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
