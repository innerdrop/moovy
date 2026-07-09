// Bandeja de tickets de soporte para OPS.
// Rama: feat/soporte-bandeja-ops
//
// Es lo que reemplaza el placeholder vacío de la pestaña "Conversaciones" en
// /ops/soporte. Un admin lee TODOS los tickets (comprador/comercio/repartidor),
// los filtra por origen y estado, abre la conversación, RESPONDE y marca
// resuelto/cerrado — todo dentro de OPS. Consume /api/admin/support/chats[/id].

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Send, RefreshCw, Store, User as UserIcon, Bike, CheckCircle2, XCircle, Inbox, AlertCircle, RotateCcw } from "lucide-react";
import { useSupportSocket } from "@/hooks/useSupportSocket";

type Origin = "BUYER" | "MERCHANT" | "DRIVER";

interface ChatListItem {
    id: string;
    subject: string | null;
    origin: Origin;
    status: string;
    category: string | null;
    lastMessageAt: string;
    user: { id: string; name: string | null; email: string | null };
    messages: { content: string; createdAt: string; isFromAdmin: boolean }[];
    _count?: { messages: number };
    unreadCount?: number;
}

interface ChatMessage {
    id: string;
    content: string;
    isFromAdmin: boolean;
    isSystem: boolean;
    createdAt: string;
    sender?: { id: string; name: string | null };
}

interface ChatDetail extends Omit<ChatListItem, "messages"> {
    messages: ChatMessage[];
}

const ORIGIN_META: Record<Origin, { label: string; icon: typeof Store; classes: string }> = {
    BUYER: { label: "Comprador", icon: UserIcon, classes: "bg-blue-50 text-blue-700" },
    MERCHANT: { label: "Comercio", icon: Store, classes: "bg-violet-50 text-violet-700" },
    DRIVER: { label: "Repartidor", icon: Bike, classes: "bg-amber-50 text-amber-700" },
};

const STATUS_LABEL: Record<string, string> = {
    waiting: "Esperando",
    active: "Activo",
    resolved: "Resuelto",
    closed: "Cerrado",
};

function OriginBadge({ origin }: { origin: Origin }) {
    const meta = ORIGIN_META[origin] ?? ORIGIN_META.BUYER;
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.classes}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
        </span>
    );
}

export default function SupportInbox() {
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [originFilter, setOriginFilter] = useState<"" | Origin>("");
    const [groupFilter, setGroupFilter] = useState<"open" | "closed" | "">("open");

    const [selected, setSelected] = useState<ChatDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [available, setAvailable] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const selectedIdRef = useRef<string | null>(null);
    selectedIdRef.current = selected?.id ?? null;

    const loadChats = useCallback(async (silent = false) => {
        if (!silent) { setLoading(true); setError(""); }
        try {
            const qs = new URLSearchParams();
            if (originFilter) qs.set("origin", originFilter);
            if (groupFilter) qs.set("group", groupFilter);
            const res = await fetch(`/api/admin/support/chats?${qs.toString()}`);
            if (!res.ok) throw new Error("bad status");
            setChats(await res.json());
        } catch {
            if (!silent) setError("No pudimos cargar los tickets. Reintentá.");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [originFilter, groupFilter]);

    // Refresca el chat abierto sin spinner (para socket/polling).
    const refreshSelected = useCallback(async () => {
        const id = selectedIdRef.current;
        if (!id) return;
        try {
            const res = await fetch(`/api/admin/support/chats/${id}`);
            if (res.ok) setSelected(await res.json());
        } catch { /* ignore */ }
    }, []);

    async function toggleAvailable() {
        const next = !available;
        setAvailable(next);
        try {
            await fetch("/api/admin/support/availability", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ available: next }),
            });
        } catch { setAvailable(!next); }
    }

    useEffect(() => { loadChats(); }, [loadChats]);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected?.messages]);

    // Disponibilidad para chat en vivo: estado inicial.
    useEffect(() => {
        fetch("/api/admin/support/availability").then((r) => r.json()).then((d) => setAvailable(!!d.available)).catch(() => {});
    }, []);
    // Heartbeat cada 30s + aviso offline al cerrar (mientras estoy disponible).
    useEffect(() => {
        if (!available) return;
        const iv = setInterval(() => {
            fetch("/api/admin/support/availability", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ available: true }),
            }).catch(() => {});
        }, 30000);
        const onHide = () => {
            try { navigator.sendBeacon("/api/admin/support/availability", new Blob([JSON.stringify({ available: false })], { type: "application/json" })); } catch { /* */ }
        };
        window.addEventListener("pagehide", onHide);
        return () => { clearInterval(iv); window.removeEventListener("pagehide", onHide); };
    }, [available]);

    // Tiempo real: socket (instantáneo) + polling de respaldo cada 6s.
    useSupportSocket((data) => {
        loadChats(true);
        if (data.chatId === selectedIdRef.current) refreshSelected();
    });
    useEffect(() => {
        const iv = setInterval(() => { loadChats(true); refreshSelected(); }, 6000);
        return () => clearInterval(iv);
    }, [loadChats, refreshSelected]);

    async function openChat(id: string) {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/support/chats/${id}`);
            if (!res.ok) throw new Error();
            setSelected(await res.json());
            // refrescar la lista para bajar el conteo de no leídos
            loadChats();
        } catch {
            setError("No pudimos abrir el ticket.");
        } finally {
            setDetailLoading(false);
        }
    }

    async function sendReply(e: React.FormEvent) {
        e.preventDefault();
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/admin/support/chats/${selected.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: reply }),
            });
            if (!res.ok) throw new Error();
            const msg = await res.json();
            setSelected({ ...selected, messages: [...selected.messages, msg], status: selected.status === "waiting" ? "active" : selected.status });
            setReply("");
        } catch {
            setError("No se pudo enviar la respuesta.");
        } finally {
            setSending(false);
        }
    }

    async function changeStatus(status: string) {
        if (!selected) return;
        try {
            const res = await fetch(`/api/admin/support/chats/${selected.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error();
            setSelected({ ...selected, status });
            loadChats();
        } catch {
            setError("No se pudo cambiar el estado.");
        }
    }

    const originTabs: Array<{ key: "" | Origin; label: string }> = [
        { key: "", label: "Todos" },
        { key: "MERCHANT", label: "Comercios" },
        { key: "BUYER", label: "Compradores" },
        { key: "DRIVER", label: "Repartidores" },
    ];

    return (
        <div className="space-y-4">
            {/* Barra de disponibilidad para chat en vivo (feat/chat-en-vivo) */}
            <div className="flex items-center justify-between gap-3 bg-white border rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${available ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                    <span className="text-sm font-semibold text-gray-800">{available ? "Disponible para chat en vivo" : "No disponible"}</span>
                    <span className="text-xs text-gray-400 hidden md:inline truncate">— {available ? "los usuarios te ven en línea y chatean en vivo" : "los usuarios dejan su consulta como ticket"}</span>
                </div>
                <button onClick={toggleAvailable} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-shrink-0 ${available ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {available ? "Ponerme no disponible" : "Ponerme disponible"}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 min-h-[520px]">
            {/* Lista */}
            <div className="lg:w-96 flex-shrink-0 border rounded-xl overflow-hidden flex flex-col">
                <div className="p-3 border-b space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Tickets</span>
                        <button onClick={() => loadChats()} className="p-1.5 text-gray-400 hover:text-[#e60012] transition" title="Actualizar">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {originTabs.map((t) => (
                            <button
                                key={t.key || "all"}
                                onClick={() => setOriginFilter(t.key)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${originFilter === t.key ? "bg-[#e60012] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        {([
                            { key: "open", label: "Abiertas" },
                            { key: "closed", label: "Cerradas" },
                            { key: "", label: "Todas" },
                        ] as const).map((g) => (
                            <button
                                key={g.key || "all"}
                                onClick={() => setGroupFilter(g.key)}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition ${groupFilter === g.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#e60012]" /></div>
                    ) : error && chats.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-300" />
                            {error}
                            <button onClick={() => loadChats()} className="block mx-auto mt-3 text-[#e60012] font-semibold">Reintentar</button>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">
                            <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            No hay tickets con estos filtros.
                        </div>
                    ) : (
                        chats.map((c) => {
                            const last = c.messages?.[0];
                            const isSel = selected?.id === c.id;
                            const unread = c.unreadCount ?? 0;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => openChat(c.id)}
                                    className={`w-full text-left p-3 border-b transition relative ${isSel ? "bg-red-50" : unread > 0 ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-gray-50"}`}
                                >
                                    {unread > 0 && <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r" />}
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <OriginBadge origin={c.origin} />
                                        <div className="flex items-center gap-1.5">
                                            {unread > 0 && (
                                                <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">{unread}</span>
                                            )}
                                            <span className="text-[10px] text-gray-400">{new Date(c.lastMessageAt).toLocaleDateString("es-AR")}</span>
                                        </div>
                                    </div>
                                    <p className={`text-sm truncate text-gray-900 ${unread > 0 ? "font-bold" : "font-semibold"}`}>{c.subject || "Consulta"}</p>
                                    <p className="text-xs text-gray-500 truncate">{c.user?.name || c.user?.email || "Usuario"}</p>
                                    {last && <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-gray-600 font-medium" : "text-gray-400"}`}>{last.isFromAdmin ? "Vos: " : ""}{last.content}</p>}
                                    <span className="inline-block mt-1 text-[10px] font-medium text-gray-500">{STATUS_LABEL[c.status] ?? c.status}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Detalle */}
            <div className="flex-1 border rounded-xl flex flex-col min-h-[520px]">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center text-center text-gray-400 p-8">
                        <div>
                            <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                            <p className="text-sm">Elegí un ticket de la izquierda para leerlo y responder.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <OriginBadge origin={selected.origin} />
                                    <span className="text-xs text-gray-400">{STATUS_LABEL[selected.status] ?? selected.status}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 truncate">{selected.subject || "Consulta"}</h3>
                                <p className="text-xs text-gray-500 truncate">{selected.user?.name || "—"} · {selected.user?.email || "—"}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                {(selected.status === "closed" || selected.status === "resolved") ? (
                                    <button onClick={() => changeStatus("active")} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition" title="Reabrir consulta">
                                        <RotateCcw className="w-4 h-4" /> Reabrir
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => changeStatus("resolved")} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition" title="Marcar resuelto">
                                            <CheckCircle2 className="w-4 h-4" /> Resolver
                                        </button>
                                        <button onClick={() => changeStatus("closed")} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition" title="Cerrar">
                                            <XCircle className="w-4 h-4" /> Cerrar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 max-h-[46vh]">
                            {detailLoading ? (
                                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#e60012]" /></div>
                            ) : (
                                selected.messages.map((m: ChatMessage) => (
                                    m.isSystem ? (
                                        <p key={m.id} className="text-center text-[11px] text-gray-400 italic">{m.content}</p>
                                    ) : (
                                        <div key={m.id} className={`flex ${m.isFromAdmin ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.isFromAdmin ? "bg-[#e60012] text-white" : "bg-white border shadow-sm"}`}>
                                                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                                                <p className={`text-[10px] mt-1 ${m.isFromAdmin ? "text-white/70" : "text-gray-400"}`}>
                                                    {m.isFromAdmin ? "Equipo" : (selected.user?.name || "Usuario")} · {new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                            <div ref={endRef} />
                        </div>

                        {(selected.status === "closed" || selected.status === "resolved") ? (
                            <div className="p-3 border-t bg-gray-50 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-500">Consulta cerrada. Reabrila para responder.</span>
                                <button onClick={() => changeStatus("active")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex-shrink-0">
                                    <RotateCcw className="w-4 h-4" /> Reabrir
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={sendReply} className="p-3 border-t bg-white flex gap-2">
                                <input
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Escribí tu respuesta…"
                                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                />
                                <button type="submit" disabled={sending || !reply.trim()} className="p-3 bg-[#e60012] text-white rounded-full hover:bg-[#cc000f] transition disabled:opacity-50">
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
            </div>
        </div>
    );
}
