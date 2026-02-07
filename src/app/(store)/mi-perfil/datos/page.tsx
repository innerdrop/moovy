"use client";

import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, Loader2, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface UserData {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    createdAt?: string;
}

export default function DatosPersonalesPage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Editable fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
                setFirstName(data.firstName || "");
                setLastName(data.lastName || "");
                setPhone(data.phone || "");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setSaving(true);

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    phone
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setUserData(prev => prev ? { ...prev, ...updated } : updated);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const errData = await res.json();
                setError(errData.error || "Error al guardar los cambios");
            }
        } catch (err) {
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#e60012] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <Link href="/mi-perfil" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="font-bold text-lg text-gray-900">Datos Personales</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                        Tu email es tu identificador único y no puede ser modificado. 
                        Para cambiarlo, contacta a soporte.
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in">
                        <Check className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-green-700 font-medium">Cambios guardados correctamente</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Read-only Fields Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-700 text-sm">Información Fija</h2>
                        </div>
                        
                        {/* Email (Read-only) */}
                        <div className="p-4 border-b border-gray-50">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                Email
                            </label>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gray-300" />
                                <span className="text-gray-600">{userData?.email}</span>
                            </div>
                        </div>

                        {/* User ID (Read-only) */}
                        <div className="p-4">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                ID de Usuario
                            </label>
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-300" />
                                <span className="text-gray-400 text-sm font-mono">{userData?.id.slice(0, 12)}...</span>
                            </div>
                        </div>
                    </div>

                    {/* Editable Fields Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-700 text-sm">Información Editable</h2>
                        </div>

                        {/* First Name */}
                        <div className="p-4 border-b border-gray-50">
                            <label htmlFor="firstName" className="block text-xs font-medium text-gray-500 mb-2">
                                Nombre
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] transition"
                                placeholder="Tu nombre"
                            />
                        </div>

                        {/* Last Name */}
                        <div className="p-4 border-b border-gray-50">
                            <label htmlFor="lastName" className="block text-xs font-medium text-gray-500 mb-2">
                                Apellido
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] transition"
                                placeholder="Tu apellido"
                            />
                        </div>

                        {/* Phone */}
                        <div className="p-4">
                            <label htmlFor="phone" className="block text-xs font-medium text-gray-500 mb-2">
                                Teléfono
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] transition"
                                    placeholder="+54 9 2901 123456"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-[#e60012] text-white font-bold rounded-xl hover:bg-[#c5000f] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar Cambios"
                        )}
                    </button>
                </form>

                {/* Change Password Link */}
                <div className="mt-6 text-center">
                    <Link 
                        href="/mi-perfil/cambiar-password" 
                        className="text-[#e60012] font-medium hover:underline text-sm"
                    >
                        ¿Querés cambiar tu contraseña?
                    </Link>
                </div>
            </div>
        </div>
    );
}
