"use client";

// Admin Drivers Page - Gestión de Repartidores
import { useState, useEffect } from "react";
import {
    Truck,
    Plus,
    Trash2,
    Loader2,
    User,
    Phone,
    Check,
    X,
    Star,
    Package,
    Mail,
    Eye,
    Award,
    Calendar,
    TrendingUp,
    Home
} from "lucide-react";
import Link from "next/link";

interface Driver {
    id: string;
    vehicleType: string;
    licensePlate: string | null;
    isActive: boolean;
    isOnline: boolean;
    totalDeliveries: number;
    rating: number | null;
    user: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
    };
    _count?: { orders: number };
}

export default function AdminRepartidoresPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        vehicleType: "MOTO",
        licensePlate: "",
    });

    // Confirmation modal state
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ driverId: string; action: "toggle" | "delete"; driverName: string } | null>(null);

    // View driver details modal
    const [viewDriver, setViewDriver] = useState<Driver | null>(null);

    useEffect(() => {
        loadDrivers();

        // Poll for driver updates every 10 seconds
        const interval = setInterval(() => {
            loadDrivers();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    async function loadDrivers() {
        try {
            const driversRes = await fetch("/api/admin/drivers");
            if (driversRes.ok) {
                const driversData = await driversRes.json();
                setDrivers(driversData);
            }
        } catch (error) {
            console.error("Error loading drivers:", error);
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setFormData({
            name: "",
            email: "",
            phone: "",
            password: "",
            vehicleType: "MOTO",
            licensePlate: "",
        });
        setError("");
        setShowForm(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!formData.name || !formData.email || !formData.password) {
            setError("Nombre, email y contraseña son obligatorios");
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/admin/drivers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || null,
                    password: formData.password,
                    vehicleType: formData.vehicleType,
                    licensePlate: formData.licensePlate || null,
                }),
            });

            if (res.ok) {
                await loadDrivers();
                resetForm();
            } else {
                const data = await res.json();
                setError(data.error || "Error al crear repartidor");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    function requestToggleActive(driver: Driver) {
        setPendingAction({ driverId: driver.id, action: "toggle", driverName: driver.user.name });
        setShowConfirm(true);
    }

    function requestDelete(driver: Driver) {
        setPendingAction({ driverId: driver.id, action: "delete", driverName: driver.user.name });
        setShowConfirm(true);
    }

    async function confirmAction() {
        if (!pendingAction) return;
        setShowConfirm(false);

        if (pendingAction.action === "toggle") {
            const driver = drivers.find(d => d.id === pendingAction.driverId);
            if (driver) {
                try {
                    await fetch(`/api/admin/drivers/${driver.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isActive: !driver.isActive }),
                    });
                    await loadDrivers();
                } catch (error) {
                    console.error("Error toggling driver:", error);
                }
            }
        } else if (pendingAction.action === "delete") {
            try {
                await fetch(`/api/admin/drivers/${pendingAction.driverId}`, {
                    method: "DELETE",
                });
                await loadDrivers();
            } catch (error) {
                console.error("Error deleting driver:", error);
            }
        }

        setPendingAction(null);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-moovy" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Repartidores</h1>
                    <p className="text-gray-600">Gestiona el equipo de delivery</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Agregar Repartidor
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-navy">{drivers.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-green-800">Activos</p>
                    <p className="text-2xl font-bold text-green-900">
                        {drivers.filter(d => d.isActive).length}
                    </p>
                </div>
                <div className="bg-[#e60012]/10 rounded-xl p-4 border border-[#e60012]/20">
                    <p className="text-sm text-[#e60012]">En línea</p>
                    <p className="text-2xl font-bold text-[#e60012]">
                        {drivers.filter(d => d.isOnline).length}
                    </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-purple-800">Entregas totales</p>
                    <p className="text-2xl font-bold text-purple-900">
                        {drivers.reduce((sum, d) => sum + (d._count?.orders || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && pendingAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">
                            {pendingAction.action === "toggle" ? "Confirmar cambio de estado" : "Confirmar eliminación"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {pendingAction.action === "toggle"
                                ? `¿Estás seguro de cambiar el estado del repartidor "${pendingAction.driverName}"?`
                                : `¿Estás seguro de quitar a "${pendingAction.driverName}" como repartidor?`
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowConfirm(false); setPendingAction(null); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`flex-1 py-2 text-white rounded-lg transition ${pendingAction.action === "delete"
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-[#e60012] hover:bg-[#c5000f]"
                                    }`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Driver Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-navy">Agregar Nuevo Repartidor</h3>
                            <button
                                onClick={resetForm}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <User className="w-4 h-4 inline mr-1" />
                                        Nombre completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input w-full"
                                        placeholder="Juan Pérez"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input w-full"
                                        placeholder="repartidor@email.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input w-full"
                                        placeholder="+54 9 2901 ..."
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input w-full"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <hr className="my-4" />
                            <h4 className="font-medium text-gray-700">Información del Vehículo</h4>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Vehículo
                                    </label>
                                    <select
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="MOTO">🏍️ Moto</option>
                                        <option value="BICICLETA">🚲 Bicicleta</option>
                                        <option value="AUTO">🚗 Auto</option>
                                        <option value="A_PIE">🚶 A pie</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Patente (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.licensePlate}
                                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                        placeholder="ABC 123"
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Check className="w-5 h-5" />
                                    )}
                                    Crear Repartidor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Drivers List */}
            {drivers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Truck className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium text-lg">No hay repartidores registrados</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 text-moovy font-bold hover:underline"
                    >
                        Agregar el primero
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left p-4 font-bold text-navy text-xs uppercase tracking-widest">Repartidor</th>
                                    <th className="text-center p-4 font-bold text-navy text-xs uppercase tracking-widest">Vehículo</th>
                                    <th className="text-center p-4 font-bold text-navy text-xs uppercase tracking-widest">Entregas</th>
                                    <th className="text-center p-4 font-bold text-navy text-xs uppercase tracking-widest">Estado</th>
                                    <th className="text-right p-4 font-bold text-navy text-xs uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {drivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${driver.isOnline ? "bg-green-50 text-green-600 border-green-200" : "bg-slate-50 text-slate-400 border-slate-200"
                                                    }`}>
                                                    {driver.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-navy">{driver.user.name}</span>
                                                    <span className="text-xs text-slate-400">{driver.user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {driver.vehicleType === "MOTO" ? "🏍️ Moto" :
                                                        driver.vehicleType === "BICICLETA" ? "🚲 Bicicleta" :
                                                            driver.vehicleType === "AUTO" ? "🚗 Auto" : "🚶 A pie"}
                                                </span>
                                                {driver.licensePlate && (
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500 mt-1 uppercase">
                                                        {driver.licensePlate}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-extrabold text-navy">{driver._count?.orders || 0}</span>
                                                {driver.rating && (
                                                    <div className="flex items-center gap-1 text-xs text-yellow-600 font-bold">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {driver.rating.toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => requestToggleActive(driver)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${driver.isActive
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                        }`}
                                                >
                                                    {driver.isActive ? "Activo" : "Inactivo"}
                                                </button>
                                                {driver.isOnline && (
                                                    <span className="text-[9px] text-green-600 font-bold uppercase flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                        Online
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setViewDriver(driver)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => requestDelete(driver)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Premium Driver Cards */}
                    <div className="md:hidden space-y-4">
                        {drivers.map((driver) => (
                            <div
                                key={driver.id}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 transition-all relative overflow-hidden"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 flex-shrink-0 ${driver.isOnline ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-300 border-slate-100"
                                        }`}>
                                        {driver.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="font-extrabold text-navy text-lg line-height-none truncate">{driver.user.name}</h3>
                                        <p className="text-xs text-slate-400 truncate mb-2">{driver.user.email}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                                                {driver.vehicleType}
                                            </span>
                                            {driver.isOnline && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    Online
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => requestToggleActive(driver)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${driver.isActive ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-300"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 border-current flex items-center justify-center ${driver.isActive ? "bg-green-600" : "bg-transparent"}`}>
                                            {driver.isActive && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50 mb-4">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Entregas</p>
                                        <p className="font-black text-navy">{driver._count?.orders || 0}</p>
                                    </div>
                                    <div className="text-center border-x border-slate-50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Rating</p>
                                        <div className="flex items-center justify-center gap-1 font-black text-navy">
                                            {driver.rating ? (
                                                <>
                                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                    {driver.rating.toFixed(1)}
                                                </>
                                            ) : "-"}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Vehículo</p>
                                        <p className="font-black text-navy text-[10px]">{driver.licensePlate || "S/P"}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewDriver(driver)}
                                        className="flex-1 py-2.5 bg-slate-50 text-navy font-bold text-xs rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
                                    >
                                        Ver Perfil
                                    </button>
                                    <button
                                        onClick={() => requestDelete(driver)}
                                        className="w-12 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 ${driver.isActive ? "bg-green-500/5" : "bg-slate-500/5"}`}></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Driver Details Modal */}
            {viewDriver && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-navy">Detalles del Repartidor</h3>
                            <button onClick={() => setViewDriver(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Driver Info */}
                        <div className="text-center mb-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${viewDriver.isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <User className={`w-10 h-10 ${viewDriver.isOnline ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <h4 className="font-bold text-xl text-gray-900">{viewDriver.user.name}</h4>
                            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                                {viewDriver.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                                {viewDriver.isOnline ? 'En línea' : 'Fuera de línea'}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-blue-900">{viewDriver._count?.orders || 0}</p>
                                <p className="text-xs text-blue-700">Entregas</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-yellow-900">{viewDriver.rating?.toFixed(1) || '-'}</p>
                                <p className="text-xs text-yellow-700">Rating</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <Award className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-green-900">{viewDriver.isActive ? 'Sí' : 'No'}</p>
                                <p className="text-xs text-green-700">Activo</p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">{viewDriver.user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">{viewDriver.user.phone || 'No registrado'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Truck className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">
                                    {viewDriver.vehicleType === 'MOTO' ? '🏍️ Moto' :
                                        viewDriver.vehicleType === 'BICICLETA' ? '🚲 Bicicleta' :
                                            viewDriver.vehicleType === 'AUTO' ? '🚗 Auto' : '🚶 A pie'}
                                    {viewDriver.licensePlate && ` • ${viewDriver.licensePlate}`}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setViewDriver(null)}
                            className="w-full mt-4 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] transition"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
