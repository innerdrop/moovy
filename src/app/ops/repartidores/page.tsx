"use client";

// Admin Drivers Page - Gestión de Repartidores
import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Truck,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    User,
    Phone,
    Check,
    X,
    Star,
    Package
} from "lucide-react";

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

interface UserOption {
    id: string;
    name: string;
    email: string;
}

export default function AdminRepartidoresPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [vehicleType, setVehicleType] = useState("MOTO");
    const [licensePlate, setLicensePlate] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            // Load drivers
            const driversRes = await fetch("/api/admin/drivers");
            if (driversRes.ok) {
                const driversData = await driversRes.json();
                setDrivers(driversData);
            }

            // Load available users (non-drivers)
            const usersRes = await fetch("/api/admin/users?role=USER");
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }

    function startNew() {
        setSelectedUserId("");
        setVehicleType("MOTO");
        setLicensePlate("");
        setShowForm(true);
        setError("");
    }

    function cancelForm() {
        setShowForm(false);
        setSelectedUserId("");
        setError("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedUserId) {
            setError("Selecciona un usuario");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/admin/drivers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUserId,
                    vehicleType,
                    licensePlate: licensePlate || null,
                }),
            });

            if (res.ok) {
                await loadData();
                cancelForm();
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

    async function toggleActive(driver: Driver) {
        try {
            const res = await fetch(`/api/admin/drivers/${driver.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !driver.isActive }),
            });

            if (res.ok) {
                await loadData();
            }
        } catch (error) {
            console.error("Error toggling driver:", error);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`¿Quitar a "${name}" como repartidor?`)) return;

        try {
            const res = await fetch(`/api/admin/drivers/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                await loadData();
            } else {
                const data = await res.json();
                alert(data.error || "Error al eliminar");
            }
        } catch (error) {
            alert("Error de conexión");
        }
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
                    onClick={startNew}
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
                <div className="bg-[#e60012] rounded-xl p-4 border border-[#e60012]">
                    <p className="text-sm text-[#e60012]">En línea</p>
                    <p className="text-2xl font-bold text-[#e60012]">
                        {drivers.filter(d => d.isOnline).length}
                    </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-purple-800">Entregas hoy</p>
                    <p className="text-2xl font-bold text-purple-900">-</p>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-moovy">
                    <h2 className="font-bold text-navy mb-4">Agregar Repartidor</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Selecciona un usuario existente para convertirlo en repartidor
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Usuario *
                            </label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="input"
                                required
                            >
                                <option value="">Seleccionar usuario</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                            {users.length === 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    No hay usuarios disponibles. Primero deben registrarse.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Vehículo
                                </label>
                                <select
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    className="input"
                                >
                                    <option value="MOTO">Moto</option>
                                    <option value="BICICLETA">Bicicleta</option>
                                    <option value="AUTO">Auto</option>
                                    <option value="A_PIE">A pie</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Patente (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={licensePlate}
                                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                                    placeholder="ABC 123"
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="btn-outline flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !selectedUserId}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Check className="w-5 h-5" />
                                )}
                                Agregar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Drivers List */}
            {drivers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No hay repartidores registrados</p>
                    <button onClick={startNew} className="btn-primary">
                        Agregar primer repartidor
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Repartidor
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Vehículo
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Entregas
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {drivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${driver.isOnline ? "bg-green-100" : "bg-gray-100"
                                                }`}>
                                                <User className={`w-5 h-5 ${driver.isOnline ? "text-green-600" : "text-gray-400"
                                                    }`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-navy">{driver.user.name}</p>
                                                <p className="text-sm text-gray-500">{driver.user.email}</p>
                                                {driver.user.phone && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {driver.user.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div>
                                            <span className="text-sm font-medium">
                                                {driver.vehicleType === "MOTO" ? "🏍️ Moto" :
                                                    driver.vehicleType === "BICICLETA" ? "🚲 Bici" :
                                                        driver.vehicleType === "AUTO" ? "🚗 Auto" : "🚶 A pie"}
                                            </span>
                                            {driver.licensePlate && (
                                                <p className="text-xs text-gray-500">{driver.licensePlate}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                                            <Package className="w-4 h-4" />
                                            {driver._count?.orders || 0}
                                        </span>
                                        {driver.rating && (
                                            <p className="text-xs text-yellow-600 flex items-center justify-center gap-1 mt-1">
                                                <Star className="w-3 h-3 fill-current" />
                                                {driver.rating.toFixed(1)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => toggleActive(driver)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${driver.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {driver.isActive ? "Activo" : "Inactivo"}
                                            </button>
                                            {driver.isOnline && (
                                                <p className="text-xs text-[#e60012]">● En línea</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(driver.id, driver.user.name)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Quitar repartidor"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

