"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { OperatorChatListItem, SupportOperator, CannedResponse } from "@/types/support";

export default function SoporteDashboard() {
    const { data: session } = useSession();
    const [operator, setOperator] = useState<SupportOperator | null>(null);
    const [assignedChats, setAssignedChats] = useState<OperatorChatListItem[]>([]);
    const [waitingChats, setWaitingChats] = useState<OperatorChatListItem[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState("");
    const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
    const [showCannedMenu, setShowCannedMenu] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resolvingChat, setResolvingChat] = useState(false);
    const [showTransferMenu, setShowTransferMenu] = useState(false);
    const [otherOperators, setOtherOperators] = useState<SupportOperator[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const refreshIntervalRef = useRef<NodeJS.Timeout>(null);

    // Load operator chats
    const loadChats = async () => {
        try {
            const res = await fetch("/api/support/operator/chats");
            if (res.ok) {
                const data = await res.json();
                setOperator(data.operator);
                setAssignedChats(data.assigned || []);
                setWaitingChats(data.waiting || []);
            }
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    };

    // Load canned responses
    const loadCannedResponses = async () => {
        try {
            const res = await fetch("/api/support/operator/canned-responses");
            if (res.ok) {
                const data = await res.json();
                setCannedResponses(data);
            }
        } catch (error) {
            console.error("Error loading canned responses:", error);
        }
    };

    // Load all operators for transfer menu
    const loadOperators = async () => {
        try {
            const res = await fetch("/api/admin/support/operators");
            if (res.ok) {
                const data = await res.json();
                const active = data.filter(
                    (op: any) => op.isActive && op.isOnline && op.id !== operator?.id
                );
                setOtherOperators(active);
            }
        } catch (error) {
            console.error("Error loading operators:", error);
        }
    };

    // Load chat detail
    const loadChatDetail = async (chatId: string) => {
        try {
            const res = await fetch(`/api/support/operator/chats/${chatId}`);
            if (res.ok) {
                const data = await res.json();
                setActiveChat(data);
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Error loading chat:", error);
        }
    };

    // Initial load
    useEffect(() => {
        loadChats();
        loadCannedResponses();
    }, []);

    // Load active chat detail
    useEffect(() => {
        if (!activeChat?.id) return;
        loadChatDetail(activeChat.id);
    }, [activeChat?.id]);

    // Refresh chat list periodically
    useEffect(() => {
        const refreshChats = setInterval(() => {
            loadChats();
            if (activeChat?.id) {
                loadChatDetail(activeChat.id);
            }
        }, 5000);

        return () => clearInterval(refreshChats);
    }, [activeChat?.id]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Toggle operator status
    const toggleStatus = async () => {
        if (!operator) return;
        try {
            const res = await fetch("/api/support/operator/status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOnline: !operator.isOnline })
            });
            if (res.ok) {
                const data = await res.json();
                setOperator(data);
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    // Claim waiting chat
    const claimChat = async (chatId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/support/operator/chats/${chatId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "claim" })
            });
            if (res.ok) {
                await loadChats();
                const updated = await res.json();
                setActiveChat(updated);
                setMessages(updated.messages || []);
            }
        } catch (error) {
            console.error("Error claiming chat:", error);
        } finally {
            setLoading(false);
        }
    };

    // Send message
    const sendMessage = async (content: string) => {
        if (!activeChat || !content.trim()) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/support/operator/chats/${activeChat.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content.trim() })
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages(prev => [...prev, newMessage]);
                setMessageText("");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setLoading(false);
        }
    };

    // Resolve chat
    const resolveChat = async (resolutionNote?: string) => {
        if (!activeChat) return;

        try {
            setResolvingChat(true);
            const res = await fetch(`/api/support/operator/chats/${activeChat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "resolve",
                    resolutionNote
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setActiveChat(updated);
                await loadChats();
            }
        } catch (error) {
            console.error("Error resolving chat:", error);
        } finally {
            setResolvingChat(false);
        }
    };

    // Transfer chat
    const transferChat = async (targetOperatorId: string) => {
        if (!activeChat) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/support/operator/chats/${activeChat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "transfer",
                    transferToOperatorId: targetOperatorId
                })
            });

            if (res.ok) {
                await loadChats();
                setActiveChat(null);
                setMessages([]);
            }
        } catch (error) {
            console.error("Error transferring chat:", error);
        } finally {
            setLoading(false);
            setShowTransferMenu(false);
        }
    };

    const allChats = [...assignedChats, ...waitingChats];
    const activeChatsCount = assignedChats.filter(c => c.status === "active").length;

    return (
        <div className="h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-bold text-lg">MOOVY Soporte</h2>
                            <p className="text-xs opacity-75">Operador: {operator?.displayName}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="text-sm hover:opacity-75"
                            title="Cerrar sesión"
                        >
                            🚪
                        </button>
                    </div>

                    {/* Status toggle */}
                    <button
                        onClick={toggleStatus}
                        className={`w-full py-2 rounded-lg font-medium transition-colors ${
                            operator?.isOnline
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-gray-600 hover:bg-gray-700"
                        }`}
                    >
                        {operator?.isOnline ? "🟢 En línea" : "⚫ Fuera de línea"}
                    </button>
                </div>

                {/* Chat count info */}
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                    <p className="text-sm font-medium text-blue-900">
                        {activeChatsCount} / {operator?.maxChats} chats activos
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                        {waitingChats.length} esperando
                    </p>
                </div>

                {/* Chat list */}
                <div className="flex-1 overflow-y-auto">
                    {/* Active chats */}
                    {assignedChats.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-slate-100 text-xs font-semibold text-slate-700 sticky top-0">
                                ASIGNADOS ({assignedChats.filter(c => c.status === "active").length})
                            </div>
                            {assignedChats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    className={`w-full text-left px-4 py-3 border-b border-slate-200 hover:bg-slate-100 transition-colors ${
                                        activeChat?.id === chat.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{chat.user.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {chat.user.email}
                                            </p>
                                        </div>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(chat.lastMessageAt).toLocaleTimeString("es-AR", {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Waiting chats */}
                    {waitingChats.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-amber-50 text-xs font-semibold text-amber-700 sticky top-12">
                                ESPERANDO ({waitingChats.length})
                            </div>
                            {waitingChats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => claimChat(chat.id)}
                                    className="w-full text-left px-4 py-3 border-b border-slate-200 hover:bg-amber-50 transition-colors group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm group-hover:text-amber-700">
                                                {chat.user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {chat.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-1 group-hover:font-medium">
                                        Haz clic para reclamar
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {allChats.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            <p className="text-sm">No hay chats</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <>
                        {/* Chat header */}
                        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">{activeChat.user.name}</h3>
                                <p className="text-sm text-gray-500">{activeChat.user.email}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {activeChat._count?.messages || 0} mensajes
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        activeChat.status === "active"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-green-100 text-green-700"
                                    }`}
                                >
                                    {activeChat.status}
                                </span>
                                {/* Transfer button */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            loadOperators();
                                            setShowTransferMenu(!showTransferMenu);
                                        }}
                                        className="px-3 py-1 text-sm bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                                        title="Transferir chat"
                                    >
                                        📤
                                    </button>
                                    {showTransferMenu && (
                                        <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-48">
                                            {otherOperators.length > 0 ? (
                                                otherOperators.map(op => (
                                                    <button
                                                        key={op.id}
                                                        onClick={() => transferChat(op.id)}
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm border-b last:border-0"
                                                    >
                                                        {op.displayName}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-sm text-gray-500">
                                                    No hay operadores disponibles
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                            {messages.map(msg => {
                                if (msg.isSystem) {
                                    return (
                                        <div key={msg.id} className="text-center py-1">
                                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full inline-block">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );
                                }
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isFromAdmin ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-sm px-4 py-2 rounded-2xl text-sm ${
                                                msg.isFromAdmin
                                                    ? "bg-blue-600 text-white rounded-br-md"
                                                    : "bg-white border border-slate-200 rounded-bl-md"
                                            }`}
                                        >
                                            {!msg.isFromAdmin && msg.sender?.name && (
                                                <p className="text-xs font-semibold text-blue-600 mb-0.5">{msg.sender.name}</p>
                                            )}
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${
                                                msg.isFromAdmin ? "text-blue-200" : "text-gray-400"
                                            }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Canned responses menu */}
                        {showCannedMenu && (
                            <div className="border-t border-slate-200 bg-white p-4 max-h-48 overflow-y-auto">
                                <div className="text-sm font-medium mb-3 flex items-center justify-between">
                                    <span>Respuestas rápidas</span>
                                    <button
                                        onClick={() => setShowCannedMenu(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {cannedResponses.map(response => (
                                        <button
                                            key={response.id}
                                            onClick={() => {
                                                setMessageText(response.content);
                                                setShowCannedMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 rounded transition-colors"
                                        >
                                            <p className="font-medium text-xs">{response.shortcut}</p>
                                            <p className="text-xs text-gray-600 line-clamp-2">
                                                {response.content}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message input */}
                        {activeChat.status !== "closed" && (
                            <div className="bg-white border-t border-slate-200 p-4">
                                <div className="flex gap-2 mb-2">
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(messageText);
                                            }
                                        }}
                                        placeholder="Escribí un mensaje..."
                                        className="flex-1 p-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        rows={2}
                                    />
                                    <button
                                        onClick={() => sendMessage(messageText)}
                                        disabled={loading || !messageText.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                                    >
                                        Enviar
                                    </button>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCannedMenu(!showCannedMenu)}
                                        className="px-3 py-1 text-sm bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                                        title="Respuestas rápidas"
                                    >
                                        📋 Rápidas
                                    </button>
                                    {activeChat.status === "active" && (
                                        <button
                                            onClick={() => resolveChat()}
                                            disabled={resolvingChat}
                                            className="ml-auto px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 font-medium"
                                        >
                                            {resolvingChat ? "Resolviendo..." : "✓ Resolver"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Chat resolved message */}
                        {activeChat.status === "resolved" && (
                            <div className="bg-green-50 border-t border-green-200 p-4 text-center text-sm text-green-700 font-medium">
                                Chat resuelto. Esperando calificación del usuario.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <div className="text-5xl mb-4">💬</div>
                            <p>Selecciona un chat para empezar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
