"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2, Plus, Trash2, Home, Briefcase, Map as MapIcon, CheckCircle } from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";

export default function DireccionesPage() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New address state
    const [newAddress, setNewAddress] = useState({
        label: "Mi Casa",
        street: "",
        number: "",
        floor: "",
        city: "Ushuaia",
        latitude: null as number | null,
        longitude: null as number | null,
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/profile/addresses");
            const data = await res.json();
            if (Array.isArray(data)) {
                setAddresses(data);
            }
        } catch (error) {
            console.error("Error fetching addresses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress.street) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/profile/addresses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newAddress,
                    isDefault: addresses.length === 0
                }),
            });

            if (res.ok) {
                setIsAdding(false);
                setNewAddress({
                    label: "Mi Casa",
                    street: "",
                    number: "",
                    floor: "",
                    city: "Ushuaia",
                    latitude: null,
                    longitude: null,
                });
                fetchAddresses();
            }
        } catch (error) {
            console.error("Error adding address", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta dirección?")) return;

        try {
            await fetch(`/api/profile/addresses/${id}`, { method: "DELETE" });
            setAddresses(addresses.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting address", error);
        }
    };

    const getLabelIcon = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes("casa") || l.includes("home")) return <Home className="w-4 h-4" />;
        if (l.includes("trabajo") || l.includes("oficina") || l.includes("work")) return <Briefcase className="w-4 h-4" />;
        return <MapIcon className="w-4 h-4" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/mi-perfil" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <h1 className="font-bold text-lg text-gray-900">Mis Direcciones</h1>
                    </div>
                    {addresses.length > 0 && !isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-red-50 text-moovy p-2 rounded-full hover:bg-red-100 transition"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                {isAdding ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-gray-900">Nueva Dirección</h2>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancelar
                            </button>
                        </div>

                        <form onSubmit={handleAddAddress} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Etiqueta</label>
                                <input
                                    type="text"
                                    value={newAddress.label}
                                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                    placeholder="Ej: Casa, Trabajo, Novia..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-moovy transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Dirección</label>
                                <AddressAutocomplete
                                    value={newAddress.street && newAddress.number ? `${newAddress.street} ${newAddress.number}` : newAddress.street}
                                    onChange={(val, lat, lng, street, num) => {
                                        setNewAddress({
                                            ...newAddress,
                                            street: street || val,
                                            number: num || "",
                                            latitude: lat || null,
                                            longitude: lng || null,
                                        });
                                    }}
                                    placeholder="Buscá tu calle y número..."
                                />
                            </div>

                            <div className="grid grid-cols-1">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Piso/Depto</label>
                                    <input
                                        type="text"
                                        value={newAddress.floor}
                                        onChange={(e) => setNewAddress({ ...newAddress, floor: e.target.value })}
                                        placeholder="Opcional"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-moovy transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !newAddress.street}
                                className="w-full bg-moovy text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                                Guardar Dirección
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-moovy mb-2" />
                                <p className="text-gray-400 text-sm">Cargando tus lugares...</p>
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MapPin className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Sin direcciones</h3>
                                <p className="text-gray-500 mb-8">
                                    Aún no has guardado ninguna dirección de entrega.
                                </p>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="bg-moovy text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-red-100 hover:scale-105 transition active:scale-95"
                                >
                                    Agregar Dirección
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-red-50 group-hover:text-moovy transition">
                                                {getLabelIcon(addr.label)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900">{addr.label}</h3>
                                                    {addr.isDefault && (
                                                        <span className="flex items-center gap-0.5 text-[9px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                                            <CheckCircle className="w-2 h-2" /> Principal
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {addr.street} {addr.number}
                                                    {addr.apartment && `, ${addr.apartment}`}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(addr.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium hover:border-moovy hover:text-moovy hover:bg-red-50/30 transition flex items-center justify-center gap-2 mt-4"
                                >
                                    <Plus className="w-5 h-5" />
                                    Agregar otra ubicación
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
