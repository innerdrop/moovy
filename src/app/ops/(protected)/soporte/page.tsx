"use client";

import { useEffect, useState } from "react";
import { SupportOperator, CannedResponse } from "@/types/support";

export default function AdminSoportePage() {
    const [tab, setTab] = useState<"chats" | "operators" | "canned" | "stats">("chats");
    const [operators, setOperators] = useState<SupportOperator[]>([]);
    const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [newOperatorEmail, setNewOperatorEmail] = useState("");
    const [newOperatorPassword, setNewOperatorPassword] = useState("");
    const [newOperatorName, setNewOperatorName] = useState("");
    const [operatorError, setOperatorError] = useState("");
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

    useEffect(() => {
        loadOperators();
        loadCanned();
        loadStats();
    }, []);

    const handleCreateOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        setOperatorError("");
        if (!newOperatorEmail || !newOperatorName || !newOperatorPassword) return;

        if (newOperatorPassword.length < 8) {
            setOperatorError("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/admin/support/operators", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newOperatorEmail,
                    password: newOperatorPassword,
                    displayName: newOperatorName,
                })
            });

            if (res.ok) {
                await loadOperators();
                setNewOperatorEmail("");
                setNewOperatorPassword("");
                setNewOperatorName("");
                alert("Operador creado exitosamente. Ya puede iniciar sesión en /soporte/login");
            } else {
                const data = await res.json();
                setOperatorError(data.error || "Error al crear operador");
            }
        } catch {
            setOperatorError("Error de conexión");
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Centro de Soporte</h1>
                <p className="text-gray-600 text-sm mt-1 sm:mt-2">Gestiona operadores, respuestas rápidas y estadísticas</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex border-b overflow-x-auto">
                    <button
                        onClick={() => setTab("chats")}
                        className={`flex-1 min-w-max py-3 sm:py-4 px-4 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                            tab === "chats"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Conversaciones
                    </button>
                    <button
                        onClick={() => setTab("operators")}
                        className={`flex-1 min-w-max py-3 sm:py-4 px-4 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                            tab === "operators"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Operadores
                    </button>
                    <button
                        onClick={() => setTab("canned")}
                        className={`flex-1 min-w-max py-3 sm:py-4 px-4 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                            tab === "canned"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Respuestas Rápidas
                    </button>
                    <button
                        onClick={() => setTab("stats")}
                        className={`flex-1 min-w-max py-3 sm:py-4 px-4 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
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
                    <div className="p-4 sm:p-6">
                        <p className="text-gray-600">Ver conversaciones en el portal de soporte operadores</p>
                    </div>
                )}

                {/* Tab: Operators */}
                {tab === "operators" && (
                    <div className="p-4 sm:p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Operadores Activos</h3>
                                <div className="space-y-2">
                                    {operators.length === 0 ? (
                                        <p className="text-gray-500">No hay operadores</p>
                                    ) : (
                                        operators.map(op => (
                                            <div key={op.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">{op.displayName}</p>
                                                    <p className="text-sm text-gray-500 truncate">{op.user?.email}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {op.activeChatCount || 0}/{op.maxChats} chats activos
                                                        {op.isOnline && " • 🟢 En línea"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
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
                                <p className="text-sm text-gray-500 mb-4">
                                    Crea una cuenta nueva para el operador. No necesita ser un cliente existente de MOOVY.
                                </p>
                                {operatorError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {operatorError}
                                    </div>
                                )}
                                <form onSubmit={handleCreateOperator} className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nombre para mostrar</label>
                                        <input
                                            type="text"
                                            value={newOperatorName}
                                            onChange={(e) => setNewOperatorName(e.target.value)}
                                            placeholder="Juan García"
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={newOperatorEmail}
                                            onChange={(e) => setNewOperatorEmail(e.target.value)}
                                            placeholder="operador@moovy.com"
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Contraseña</label>
                                        <input
                                            type="password"
                                            value={newOperatorPassword}
                                            onChange={(e) => setNewOperatorPassword(e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            required
                                            minLength={8}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">El operador usará este email y contraseña para ingresar en /soporte/login</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !newOperatorEmail || !newOperatorName || !newOperatorPassword}
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
                    <div className="p-4 sm:p-6">
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="p-4 sm:p-6">
                        {stats ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="p-4 border rounded-lg min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Total de chats</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.counts.total}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Hoy</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.counts.today}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Promedio rating</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {stats.avgRating.toFixed(1)} ⭐
                                        </p>
                                    </div>
                                    <div className="p-4 border rounded-lg min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Tiempo promedio</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {Math.round(stats.avgResolutionMinutes)}m
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
