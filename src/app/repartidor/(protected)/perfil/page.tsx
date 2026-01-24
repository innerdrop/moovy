"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Bike,
    Star,
    Package,
    Loader2,
    Check,
    Edit
} from "lucide-react";

import ImageUpload from "@/components/ui/ImageUpload";

export default function PerfilPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [formData, setFormData] = useState({
        image: "",
        email: "",
        phone: "",
        vehicleType: "MOTO",
        vehicleModel: "",
        vehiclePlate: ""
    });

    // Mock driver data - replace with API
    const [driverStats, setDriverStats] = useState({
        totalDeliveries: 0,
        rating: 5.0,
        memberSince: new Date().toISOString()
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/driver/profile");
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        image: data.user.image || "",
                        email: data.user.email || "",
                        phone: data.user.phone || "",
                        vehicleType: data.vehicleType || "MOTO",
                        vehicleModel: data.vehicleModel || "",
                        vehiclePlate: data.vehiclePlate || ""
                    });
                    setDriverStats({
                        totalDeliveries: data.totalDeliveries || 0,
                        rating: data.rating || 5.0,
                        memberSince: data.createdAt || new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error("Error fetching profile", error);
            }
        };

        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/driver/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setEditMode(false);
                setShowConfirm(false);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-6 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link href="/repartidor/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-bold">Mi Perfil</h1>
                    </div>
                </div>
            </div>

            <div className="px-4 -mt-14 max-w-4xl mx-auto space-y-4">
                {/* Profile Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                    <div className="w-24 h-24 mx-auto mb-4 relative">
                        {editMode ? (
                            <ImageUpload
                                value={formData.image}
                                onChange={(url) => setFormData({ ...formData, image: url })}
                                disabled={saving}
                            />
                        ) : (
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                                {formData.image ? (
                                    <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-green-600" />
                                )}
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">{session?.user?.name || "Repartidor"}</h2>
                    <p className="text-gray-500 text-sm">Repartidor desde {new Date(driverStats.memberSince).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>

                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{driverStats.rating}</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300" />
                        <div className="flex items-center gap-1">
                            <Package className="w-5 h-5 text-green-500" />
                            <span className="font-bold">{driverStats.totalDeliveries}</span>
                            <span className="text-gray-500 text-sm">entregas</span>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Información de Contacto</h3>
                        {!editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="text-green-600 text-sm font-medium flex items-center gap-1"
                            >
                                <Edit className="w-4 h-4" />
                                Editar
                            </button>
                        )}
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-gray-500" />
                            </div>
                            {editMode ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Email"
                                />
                            ) : (
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-gray-900">{formData.email || "No registrado"}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Phone className="w-5 h-5 text-gray-500" />
                            </div>
                            {editMode ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Teléfono"
                                />
                            ) : (
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Teléfono</p>
                                    <p className="text-gray-900">{formData.phone || "No registrado"}</p>
                                </div>
                            )}
                        </div>

                        {editMode && (
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                    Guardar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-900">Vehículo</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Bike className="w-5 h-5 text-green-600" />
                            </div>
                            {editMode ? (
                                <div className="flex-1 space-y-3">
                                    <select
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="MOTO">Moto</option>
                                        <option value="AUTO">Auto</option>
                                        <option value="BICICLETA">Bicicleta</option>
                                        <option value="PIE">A pie</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={formData.vehicleModel}
                                        onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Modelo (Ej: Honda Wave)"
                                    />
                                    <input
                                        type="text"
                                        value={formData.vehiclePlate}
                                        onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Patente (Opcional)"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {formData.vehicleType === "MOTO" ? "Moto" :
                                            formData.vehicleType === "BICICLETA" ? "Bicicleta" :
                                                formData.vehicleType === "AUTO" ? "Auto" : "A pie"}
                                        {formData.vehicleModel ? ` - ${formData.vehicleModel}` : ""}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formData.vehiclePlate ? `Patente: ${formData.vehiclePlate}` : "Tipo de vehículo"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">Confirmar Cambios</h3>
                        <p className="text-gray-600 mb-6">¿Estás seguro de guardar los cambios en tu perfil?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
