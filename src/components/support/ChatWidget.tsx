"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChatBubbleIcon } from "./ChatBubbleIcon";
import { SupportChat } from "@/types/support";

function OnlineIndicator() {
    return (
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white" />
        </span>
    );
}

/** Interactive star rating component */
function StarRating({ onRate }: { onRate: (rating: number) => void }) {
    const [hovered, setHovered] = useState(0);
    const [selected, setSelected] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const handleClick = (rating: number) => {
        setSelected(rating);
        setSubmitted(true);
        onRate(rating);
    };

    if (submitted) {
        return (
            <div className="text-center py-2">
                <div className="flex justify-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={`text-xl ${i <= selected ? "text-yellow-400" : "text-gray-300"}`}>
                            ★
                        </span>
                    ))}
                </div>
                <p className="text-xs text-green-600 font-medium">¡Gracias por tu calificación!</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => handleClick(i)}
                    className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`Calificar ${i} estrella${i > 1 ? "s" : ""}`}
                >
                    <span className={i <= (hovered || selected) ? "text-yellow-400" : "text-gray-300"}>
                        ★
                    </span>
                </button>
            ))}
        </div>
    );
}

export function ChatWidget() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [chats, setChats] = useState<SupportChat[]>([]);
    const [activeChat, setActiveChat] = useState<SupportChat | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("otro");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load user's chats
    const loadChats = useCallback(async () => {
        if (!session?.user) return;
        try {
            const res = await fetch("/api/support/chats");
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    }, [session?.user]);

    useEffect(() => {
        if (!session?.user || !isOpen) return;
        loadChats();
    }, [session?.user, isOpen, loadChats]);

    // Load active chat detail with polling
    useEffect(() => {
        if (!activeChat || activeChat.id === "new") return;

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
        const interval = setInterval(loadChat, 5000);
        return () => clearInterval(interval);
    }, [activeChat?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (activeChat && activeChat.id !== "new") {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [activeChat?.id]);

    const handleCreateChat = async () => {
        if (!message.trim()) return;

        try {
            setLoading(true);
            const res = await fetch("/api/support/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: selectedCategory,
                    message: message.trim()
                })
            });

            if (res.ok) {
                const newChat = await res.json();
                setChats(prev => [newChat, ...prev]);
                setActiveChat(newChat);
                setMessage("");
                setSelectedCategory("otro");
            }
        } catch (error) {
            console.error("Error creating chat:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !activeChat || loading) return;

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
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
                // Refresh chat list to reflect status change
                await loadChats();
            }
        } catch (error) {
            console.error("Error rating chat:", error);
        }
    };

    // Status label helper
    const statusLabel = (status: string) => {
        switch (status) {
            case "waiting": return "En espera";
            case "active": return "Activo";
            case "resolved": return "Resuelto";
            case "closed": return "Cerrado";
            default: return status;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "waiting": return "bg-yellow-100 text-yellow-700";
            case "active": return "bg-green-100 text-green-700";
            case "resolved": return "bg-blue-100 text-blue-700";
            case "closed": return "bg-gray-100 text-gray-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    // --- Draggable button logic (MUST be before any conditional return) ---
    const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, bx: 0, by: 0 });
    const hasMoved = useRef(false);

    const getDefaultPos = useCallback(() => {
        if (typeof window === "undefined") return { x: 358, y: 760 };
        return { x: window.innerWidth - 72, y: window.innerHeight - 140 };
    }, []);

    const clampPos = useCallback((x: number, y: number) => {
        const maxX = (typeof window !== "undefined" ? window.innerWidth : 430) - 56;
        const maxY = (typeof window !== "undefined" ? window.innerHeight : 900) - 56;
        return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) };
    }, []);

    const handleDragStart = useCallback((clientX: number, clientY: number) => {
        const pos = bubblePos || getDefaultPos();
        dragging.current = true;
        hasMoved.current = false;
        dragStart.current = { x: clientX, y: clientY, bx: pos.x, by: pos.y };
    }, [bubblePos, getDefaultPos]);

    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (!dragging.current) return;
        const dx = clientX - dragStart.current.x;
        const dy = clientY - dragStart.current.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
        setBubblePos(clampPos(dragStart.current.bx + dx, dragStart.current.by + dy));
    }, [clampPos]);

    const handleDragEnd = useCallback(() => {
        dragging.current = false;
        // Snap to nearest horizontal edge
        if (bubblePos) {
            const midX = (typeof window !== "undefined" ? window.innerWidth : 430) / 2;
            const snapX = bubblePos.x < midX ? 16 : (typeof window !== "undefined" ? window.innerWidth : 430) - 72;
            setBubblePos(prev => prev ? { ...prev, x: snapX } : prev);
        }
    }, [bubblePos]);

    useEffect(() => {
        const onMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        const onEnd = () => handleDragEnd();
        const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const onMouseUp = () => handleDragEnd();
        if (dragging.current) {
            window.addEventListener("touchmove", onMove, { passive: false });
            window.addEventListener("touchend", onEnd);
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        }
        return () => {
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    });

    // Users not logged in don't see the chat widget
    // They have WhatsApp, email, and /ayuda for support
    if (!session?.user) {
        return null;
    }

    const currentPos = bubblePos || getDefaultPos();
    const chatOpensUp = currentPos.y > 300;
    return (
        <div
            className="fixed z-40"
            style={{ left: currentPos.x, top: currentPos.y, touchAction: "none" }}
        >
            <button
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
                onClick={() => { if (!hasMoved.current) setIsOpen(!isOpen); }}
                className={`w-14 h-14 rounded-full bg-[#e60012] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center relative cursor-grab active:cursor-grabbing ${
                    isOpen ? "scale-125" : "hover:scale-110"
                }`}
                aria-label="Chat de soporte"
            >
                <ChatBubbleIcon className="w-7 h-7" />
                {chats.some(c => (c.unreadCount || 0) > 0) ? (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                    </span>
                ) : isOnline ? (
                    <OnlineIndicator />
                ) : null}
            </button>

            {isOpen && (
                <div className={`absolute ${chatOpensUp ? "bottom-20" : "top-20"} right-0 w-96 max-w-[calc(100vw-32px)] bg-white rounded-lg shadow-2xl flex flex-col h-96 md:h-[500px] animate-in slide-in-from-bottom-5`}>
                    {!activeChat ? (
                        <>
                            {/* Header - Chat list */}
                            <div className="bg-[#e60012] text-white p-4 rounded-t-lg shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Soporte MOOVY</h3>
                                        <p className="text-xs opacity-90">
                                            {isOnline ? "En línea" : "Fuera de línea"}
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

                            {/* Chat list */}
                            <div className="flex-1 overflow-y-auto">
                                {chats.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        <div className="text-3xl mb-2">💬</div>
                                        <p className="text-sm">No tenés consultas aún</p>
                                        <p className="text-xs text-gray-400 mt-1">Creá una nueva si necesitás ayuda</p>
                                    </div>
                                ) : (
                                    chats.map(chat => (
                                        <button
                                            key={chat.id}
                                            onClick={() => setActiveChat(chat)}
                                            className="w-full text-left p-3 border-b hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-sm truncate flex-1">
                                                    {chat.subject || "Consulta"}
                                                </p>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {(chat.unreadCount || 0) > 0 && (
                                                        <span className="bg-[#e60012] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                                            {chat.unreadCount}
                                                        </span>
                                                    )}
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(chat.status)}`}>
                                                        {statusLabel(chat.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(chat.lastMessageAt || chat.createdAt).toLocaleDateString("es-AR", {
                                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                                })}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* New chat button */}
                            <div className="border-t p-3 shrink-0">
                                <button
                                    onClick={() => setActiveChat({ id: "new", userId: "", status: "waiting", priority: "normal", createdAt: new Date(), updatedAt: new Date(), lastMessageAt: new Date(), messages: [] })}
                                    className="w-full bg-[#e60012] text-white py-2.5 rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                                >
                                    + Nueva consulta
                                </button>
                            </div>
                        </>
                    ) : activeChat.id === "new" ? (
                        <>
                            {/* Header - New chat */}
                            <div className="bg-[#e60012] text-white p-4 rounded-t-lg shrink-0">
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
                                        <label className="text-sm font-medium block mb-2">Categoría</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012] text-sm"
                                        >
                                            <option value="otro">Otra consulta</option>
                                            <option value="pedido">Sobre un pedido</option>
                                            <option value="pago">Sobre el pago</option>
                                            <option value="cuenta">Mi cuenta</option>
                                            <option value="reclamo">Reclamo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium block mb-2">Mensaje</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                                                    e.preventDefault();
                                                    handleCreateChat();
                                                }
                                            }}
                                            placeholder="Contanos qué necesitás..."
                                            className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#e60012] text-sm"
                                            rows={4}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateChat}
                                    disabled={loading || !message.trim()}
                                    className="w-full bg-[#e60012] text-white py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {loading ? "Enviando..." : "Enviar consulta"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Header - Active chat */}
                            <div className="bg-[#e60012] text-white p-4 rounded-t-lg shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm truncate">{activeChat.subject || "Consulta"}</h3>
                                        <p className="text-xs opacity-90">
                                            {activeChat.status === "resolved" || activeChat.status === "closed"
                                                ? statusLabel(activeChat.status)
                                                : activeChat.operator?.isOnline
                                                    ? "Operador en línea"
                                                    : "Esperando respuesta"
                                            }
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveChat(null)}
                                        className="text-lg hover:opacity-80 ml-2 shrink-0"
                                    >
                                        ←
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
                                {(activeChat.messages || []).map(msg => {
                                    // System messages render centered
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
                                            className={`flex ${msg.isFromAdmin ? "justify-start" : "justify-end"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                                                    msg.isFromAdmin
                                                        ? "bg-white border border-gray-200 rounded-bl-md"
                                                        : "bg-[#e60012] text-white rounded-br-md"
                                                }`}
                                            >
                                                {msg.isFromAdmin && activeChat.operator?.displayName && (
                                                    <p className="text-xs font-semibold text-[#e60012] mb-0.5">
                                                        {activeChat.operator.displayName}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 ${msg.isFromAdmin ? "text-gray-400" : "text-red-200"}`}>
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

                            {/* Rating (if resolved and not yet rated) */}
                            {activeChat.status === "resolved" && !activeChat.rating && (
                                <div className="border-t p-3 bg-yellow-50 shrink-0">
                                    <p className="text-sm font-medium text-center mb-2">¿Cómo fue tu experiencia?</p>
                                    <StarRating onRate={handleRateChat} />
                                </div>
                            )}

                            {/* Input — show for active and waiting chats */}
                            {(activeChat.status === "active" || activeChat.status === "waiting") && (
                                <div className="border-t p-3 shrink-0">
                                    <div className="flex gap-2">
                                        <input
                                            ref={inputRef}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Escribí un mensaje..."
                                            className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                            disabled={loading}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={loading || !message.trim()}
                                            className="bg-[#e60012] text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-40 transition-colors shrink-0"
                                            aria-label="Enviar mensaje"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Closed/rated message */}
                            {activeChat.status === "closed" && (
                                <div className="border-t p-3 bg-gray-50 text-center shrink-0">
                                    <p className="text-sm text-gray-500">
                                        Consulta cerrada
                                        {activeChat.rating && (
                                            <span className="ml-1">
                                                — {[1, 2, 3, 4, 5].map(i => (
                                                    <span key={i} className={i <= activeChat.rating! ? "text-yellow-400" : "text-gray-300"}>★</span>
                                                ))}
                                            </span>
                                        )}
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
