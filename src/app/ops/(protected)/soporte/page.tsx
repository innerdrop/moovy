"use client";

import { useEffect, useState, useCallback } from "react";
import { SupportOperator, CannedResponse } from "@/types/support";

export default function AdminSoportePage() {
    const [tab, setTab] = useState<"chats" | "operators" | "canned" | "stats">("chats");
    const [operators, setOperators] = useState<SupportOperator[]>([]);
    const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [chatFilter, setChatFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [newOperatorEmail, setNewOperatorEmail] = useState("");
    const [newOperatorName, setNewOperatorName] = useState("");
    const [newCannedForm, setNewCannedForm] = useState({
        shortcut: "",
        title: "",
        content: "",
        category: "general"
    });

    // Load operators
    const loadOperators = async () => {
        try {
            const res = await fetch("/api/admin/support/operators");
            if (res.ok) {
                const data = await res.json();
                setOperators(data);
            }
        } catch (error) {
            console.error("Error loading operators:", error);
        }
    };

    // Load canned responses
    const loadCanned = async () => {
        try {
            const res = await fetch("/api/admin/support/canned-responses");
            if (res.ok) {
                const data = await res.json();
                setCannedResponses(data);
            }
        } catch (error) {
            console.error("Error loading canned responses:", error);
        }
    };

    // Load stats
    const loadStats = async () => {
        try {
            const res = await fetch("/api/admin/support/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const loadChats = useCallback(async () => {
        try {
            const url = chatFilter
                ? `/api/admin/support/chats?status=${chatFilter}`
                : "/api/admin/support/chats";
            const res = await fetch(url);
            if (res.ok) setChats(await res.json());
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    }, [chatFilter]);

    useEffect(() => {
        loadOperators();
        loadCanned();
        loadStats();
        loadChats();
    }, [loadChats]);

    const handleCreateOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOperatorEmail || !newOperatorName) return;

        try {
            setLoading(true);
            const res = await fetch("/api/admin/support/operators", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newOperatorEmail,
                    displayName: newOperatorName,
                })
            });

            if (res.ok) {
                await loadOperators();
                setNewOperatorEmail("");
                setNewOperatorName("");
            } else {
                const data = await res.json();
                alert(data.error || "Error al crear operador");
            }
        } catch (error) {
            console.error("Error creating operator:", error);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCanned = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCannedForm.shortcut || !newCannedForm.content) return;

        try {
            setLoading(true);
            const res = await fetch("/api/admin/support/canned-responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCannedForm)
            });

            if (res.ok) {
                await loadCanned();
                setNewCannedForm({ shortcut: "", title: "", content: "", category: "general" });
                alert("Respuesta creada exitosamente");
            } else {
                const error = await res.json();
                alert(error.error || "Error al crear");
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleOperator = async (operatorId: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/support/operators/${operatorId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive })
            });

            if (res.ok) {
                await loadOperators();
            }
        } catch (error) {
            console.error("Error updating operator:", error);
        }
    };

    const deleteCanned = async (cannedId: string) => {
        if (!confirm("¿Eliminar esta respuesta?")) return;

        try {
            const res = await fetch(`/api/admin/support/canned-responses/${cannedId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await loadCanned();
            }
        } catch (error) {
            console.error("Error deleting canned response:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Centro de Soporte</h1>
                <p className="text-gray-600 mt-2">Gestiona operadores, respuestas rápidas y estadísticas</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex border-b">
                    <button
                        onClick={() => setTab("chats")}
                        className={`flex-1 py-4 px-6 font-medium transition-colors ${
                            tab === "chats"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Conversaciones
                    </button>
                    <button
                        onClick={() => setTab("operators")}
                        className={`flex-1 py-4 px-6 font-medium transition-colors ${
                            tab === "operators"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Operadores
                    </button>
                    <button
                        onClick={() => setTab("canned")}
                        className={`flex-1 py-4 px-6 font-medium transition-colors ${
                            tab === "canned"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Respuestas Rápidas
                    </button>
                    <button
                        onClick={() => setTab("stats")}
                        className={`flex-1 py-4 px-6 font-medium transition-colors ${
                            tab === "stats"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Estadísticas
                    </button>
                </div>

                {/* Tab: Chats */}
                {tab === "chats" && (
                    <div className="p-6 space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { value: "", label: "Todos" },
                                { value: "waiting", label: "En espera" },
                                { value: "active", label: "Activos" },
                                { value: "resolved", label: "Resueltos" },
                                { value: "closed", label: "Cerrados" },
                            ].map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setChatFilter(f.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                        chatFilter === f.value
                                            ? "bg-[#e60012] text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                            <button
                                onClick={loadChats}
                                className="ml-auto px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                            >
                                Actualizar
                            </button>
                        </div>

                        {/* Chat list */}
                        {chats.length === 0 ? (
                            <p className="text-gray-500 py-8 text-center">No hay conversaciones{chatFilter ? ` con estado "${chatFilter}"` : ""}</p>
                        ) : (
                            <div className="space-y-2">
                                {chats.map((chat: any) => {
                                    const lastMsg = chat.messages?.[0];
                                    const statusColors: Record<string, string> = {
                                        waiting: "bg-yellow-100 text-yellow-700",
                                        active: "bg-blue-100 text-blue-700",
                                        resolved: "bg-green-100 text-green-700",
                                        closed: "bg-gray-100 text-gray-600",
                                    };
                                    const statusLabels: Record<string, string> = {
                                        waiting: "En espera",
                                        active: "Activo",
                                        resolved: "Resuelto",
                                        closed: "Cerrado",
                                    };
                                    return (
                                        <div key={chat.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition">
                                            <div className="w-10 h-10 rounded-full bg-[#e60012]/10 flex items-center justify-center text-[#e60012] font-bold text-sm flex-shrink-0">
                                                {chat.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-900 truncate">{chat.user?.name || chat.user?.email || "Usuario"}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[chat.status] || "bg-gray-100 text-gray-600"}`}>
                                                        {statusLabels[chat.status] || chat.status}
                                                    </span>
                                                    {chat.category && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{chat.category}</span>
                                                    )}
                                                </div>
                                                {lastMsg && (
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {lastMsg.isFromAdmin ? "Operador: " : ""}{lastMsg.content}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                    <span>{chat._count?.messages || 0} mensajes</span>
                                                    {chat.operator && <span>Op: {chat.operator.displayName}</span>}
                                                    <span>{new Date(chat.lastMessageAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                                                    {chat.rating && <span>⭐ {chat.rating}/5</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Operators */}
                {tab === "operators" && (
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Operadores Activos</h3>
                                <div className="space-y-2">
                                    {operators.length === 0 ? (
                                        <p className="text-gray-500">No hay operadores</p>
                                    ) : (
                                        operators.map(op => (
                                            <div key={op.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium">{op.displayName}</p>
                                                    <p className="text-sm text-gray-500">{op.user?.email}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {op.activeChatCount || 0}/{op.maxChats} chats activos
                                                        {op.isOnline && " • 🟢 En línea"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleOperator(op.id, op.isActive)}
                                                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                                                            op.isActive
                                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        }`}
                                                    >
                                                        {op.isActive ? "Activo" : "Inactivo"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Crear Operador</h3>
                                <form onSubmit={handleCreateOperator} className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email del usuario</label>
                                        <input
                                            type="email"
                                            value={newOperatorEmail}
                                            onChange={(e) => setNewOperatorEmail(e.target.value)}
                                            placeholder="operador@moovy.com"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nombre para mostrar</label>
                                        <input
                                            type="text"
                                            value={newOperatorName}
                                            onChange={(e) => setNewOperatorName(e.target.value)}
                                            placeholder="Juan García"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#e60012] text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                                    >
                                        {loading ? "Creando..." : "Crear Operador"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Canned Responses */}
                {tab === "canned" && (
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Respuestas Rápidas</h3>
                                <div className="space-y-2">
                                    {cannedResponses.length === 0 ? (
                                        <p className="text-gray-500">No hay respuestas rápidas</p>
                                    ) : (
                                        cannedResponses.map(resp => (
                                            <div key={resp.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-mono text-sm font-semibold text-[#e60012]">{resp.shortcut}</p>
                                                        <p className="font-medium">{resp.title}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteCanned(resp.id)}
                                                        className="text-red-600 hover:text-red-700 text-sm"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{resp.content}</p>
                                                <p className="text-xs text-gray-400">Categoría: {resp.category}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Agregar Respuesta Rápida</h3>
                                <form onSubmit={handleCreateCanned} className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Shortcut (ej: /saludo)</label>
                                            <input
                                                type="text"
                                                value={newCannedForm.shortcut}
                                                onChange={(e) =>
                                                    setNewCannedForm({ ...newCannedForm, shortcut: e.target.value })
                                                }
                                                placeholder="/saludo"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Categoría</label>
                                            <select
                                                value={newCannedForm.category}
                                                onChange={(e) =>
                                                    setNewCannedForm({ ...newCannedForm, category: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012]"
                                            >
                                                <option value="general">General</option>
                                                <option value="pedido">Pedido</option>
                                                <option value="pago">Pago</option>
                                                <option value="cuenta">Cuenta</option>
                                                <option value="cierre">Cierre</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Título</label>
                                        <input
                                            type="text"
                                            value={newCannedForm.title}
                                            onChange={(e) =>
                                                setNewCannedForm({ ...newCannedForm, title: e.target.value })
                                            }
                                            placeholder="Descripción corta"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Contenido</label>
                                        <textarea
                                            value={newCannedForm.content}
                                            onChange={(e) =>
                                                setNewCannedForm({ ...newCannedForm, content: e.target.value })
                                            }
                                            placeholder="Texto completo de la respuesta..."
                                            rows={4}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012] resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#e60012] text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                                    >
                                        {loading ? "Creando..." : "Agregar Respuesta Rápida"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Stats */}
                {tab === "stats" && (
                    <div className="p-6">
                        {stats ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-gray-600">Total de chats</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.counts.total}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-gray-600">Hoy</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.counts.today}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-gray-600">Promedio de rating</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {stats.avgRating.toFixed(1)} ⭐
                                        </p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-gray-600">Tiempo promedio</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {Math.round(stats.avgResolutionMinutes)}m
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <p className="font-semibold mb-3">Por estado</p>
                                        <div className="space-y-2">
                                            {Object.entries(stats.byStatus).map(([status, count]) => (
                                                <div key={status} className="flex justify-between text-sm">
                                                    <span className="capitalize text-gray-600">{status}</span>
                                                    <span className="font-medium">{String(count)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <p className="font-semibold mb-3">Operadores en línea</p>
                                        <div className="space-y-2">
                                            {stats.operators
                                                .filter((op: any) => op.isOnline)
                                                .map((op: any) => (
                                                    <div key={op.id} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{op.displayName}</span>
                                                        <span className="font-medium">{op.activeChats} chats</span>
                                                    </div>
                                                ))}
                                            {stats.operators.filter((op: any) => op.isOnline).length === 0 && (
                                                <p className="text-sm text-gray-400">Ninguno en línea</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Cargando estadísticas...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
