"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2, Plus, Trash2, Pencil, Home, Briefcase, Map as MapIcon, CheckCircle } from "lucide-react";
import { MAX_SAVED_ADDRESSES } from "@/lib/addresses";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";

// Estado vacío del form. Campo `apartment` (no "floor"): tanto el POST como el
// PATCH del backend usan `apartment` — antes el form mandaba "floor" y el piso
// se perdía silenciosamente. Fix incluido en s2-2a-07.
const EMPTY_ADDRESS = {
    label: "Mi Casa",
    street: "",
    number: "",
    apartment: "",
    city: "",
    province: "",
    latitude: null as number | null,
    longitude: null as number | null,
};

export default function DireccionesPage() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    // Fix s2-2a-07: id de la dirección en edición (null = no estamos editando).
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Rama fix/delivery-geocoding-cobertura: ya NO hardcodeamos "Ushuaia". La
    // ciudad/provincia se capturan del autocomplete y, si faltan, el servidor
    // las completa geocodificando. El mismo form sirve para alta y edición.
    const [formAddress, setFormAddress] = useState({ ...EMPTY_ADDRESS });

    const showForm = isAdding || editingId !== null;

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

    const closeForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormAddress({ ...EMPTY_ADDRESS });
    };

    const startAdd = () => {
        setEditingId(null);
        setFormAddress({ ...EMPTY_ADDRESS });
        setIsAdding(true);
    };

    // Fix s2-2a-07: abre el mismo form precargado para EDITAR una dirección.
    const startEdit = (addr: any) => {
        setIsAdding(false);
        setFormAddress({
            label: addr.label || "Mi Casa",
            street: addr.street || "",
            number: addr.number || "",
            apartment: addr.apartment || "",
            city: addr.city || "",
            province: addr.province || "",
            latitude: addr.latitude ?? null,
            longitude: addr.longitude ?? null,
        });
        setEditingId(addr.id);
    };

    const handleSubmitAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return; // Defensa extra contra doble submit
        if (!formAddress.street) return;

        setSubmitting(true);
        try {
            const isEdit = editingId !== null;
            const res = await fetch(
                isEdit ? `/api/profile/addresses/${editingId}` : "/api/profile/addresses",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        isEdit
                            ? { ...formAddress }
                            : { ...formAddress, isDefault: addresses.length === 0 }
                    ),
                }
            );

            if (res.ok) {
                toast.success(isEdit ? "Dirección actualizada" : "Dirección guardada");
                closeForm();
                fetchAddresses();
            } else if (res.status === 409) {
                // Dedup server-side: ya existe una dirección con misma etiqueta + lugar
                const data = await res.json();
                toast.error(data.error || "Esa dirección ya está guardada");
                closeForm();
                fetchAddresses();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "No se pudo guardar la dirección");
            }
        } catch (error) {
            console.error("Error saving address", error);
            toast.error("Error de conexión. Intentá de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (addr: { id: string; label: string; street: string; number: string }) => {
        // ISSUE-044: si es la única dirección, bloquear — mejor que borrar todo
        // y quedar sin forma de pedir. Le pedimos agregar otra antes.
        if (addresses.length === 1) {
            await confirm({
                title: "No podés quedarte sin direcciones",
                message:
                    "Esta es tu única dirección guardada. Agregá otra antes de eliminarla — así podés seguir pidiendo sin cargarla de nuevo cada vez.",
                confirmLabel: "Entendido",
                cancelLabel: "Cerrar",
                variant: "warning",
            });
            return;
        }

        const ok = await confirm({
            title: `Eliminar "${addr.label}"`,
            message: `¿Eliminar ${addr.street} ${addr.number}? Esta acción no se puede deshacer.`,
            confirmLabel: "Eliminar",
            cancelLabel: "Cancelar",
            variant: "danger",
        });
        if (!ok) return;

        try {
            const res = await fetch(`/api/profile/addresses/${addr.id}`, { method: "DELETE" });
            if (res.ok) {
                setAddresses(addresses.filter(a => a.id !== addr.id));
                toast.success("Dirección eliminada");
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "No se pudo eliminar la dirección.");
            }
        } catch (error) {
            console.error("Error deleting address", error);
            toast.error("Error de conexión al intentar eliminar la dirección.");
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
            <div className="bg-white border-b border-gray-100 px-4 lg:px-6 xl:px-8 py-4 lg:py-6 sticky top-0 z-10 shadow-sm">
                <div className="max-w-md mx-auto lg:max-w-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/mi-perfil" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <h1 className="font-bold text-lg text-gray-900">Mis Direcciones</h1>
                    </div>
                    {addresses.length > 0 && addresses.length < MAX_SAVED_ADDRESSES && !showForm && (
                        <button
                            onClick={startAdd}
                            className="bg-red-50 text-moovy p-2 rounded-full hover:bg-red-100 transition"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-md mx-auto lg:max-w-2xl px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
                {showForm ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-gray-900">{editingId ? "Editar Dirección" : "Nueva Dirección"}</h2>
                            <button
                                onClick={closeForm}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancelar
                            </button>
                        </div>

                        <form onSubmit={handleSubmitAddress} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Etiqueta</label>
                                <input
                                    type="text"
                                    value={formAddress.label}
                                    onChange={(e) => setFormAddress({ ...formAddress, label: e.target.value })}
                                    placeholder="Ej: Casa, Trabajo, Novia..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-moovy transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Dirección</label>
                                <AddressAutocomplete
                                    value={formAddress.street && formAddress.number ? `${formAddress.street} ${formAddress.number}` : formAddress.street}
                                    onChange={(val, lat, lng, street, num, city, province) => {
                                        setFormAddress({
                                            ...formAddress,
                                            street: street || val,
                                            number: num || "",
                                            // Rama fix/delivery-geocoding-cobertura: guardamos la
                                            // ciudad/provincia REALES capturadas (si vinieron).
                                            city: city || "",
                                            province: province || "",
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
                                        value={formAddress.apartment}
                                        onChange={(e) => setFormAddress({ ...formAddress, apartment: e.target.value })}
                                        placeholder="Opcional"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-moovy transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !formAddress.street}
                                className="w-full bg-moovy text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                                {editingId ? "Guardar Cambios" : "Guardar Dirección"}
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
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Agrega tu primera direccion</h3>
                                <p className="text-gray-500 mb-8">
                                    Guarda tu direccion para recibir pedidos mas rapido.
                                </p>
                                <button
                                    onClick={startAdd}
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
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-red-50 group-hover:text-moovy transition flex-shrink-0">
                                                {getLabelIcon(addr.label)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 truncate">{addr.label}</h3>
                                                    {addr.isDefault && (
                                                        <span className="flex items-center gap-0.5 text-[9px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter flex-shrink-0">
                                                            <CheckCircle className="w-2 h-2" /> Principal
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {addr.street} {addr.number}
                                                    {addr.apartment && `, ${addr.apartment}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => startEdit(addr)}
                                                className="p-2 text-gray-300 hover:text-moovy hover:bg-red-50 rounded-full transition"
                                                aria-label={`Editar ${addr.label}`}
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(addr)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                                aria-label={`Eliminar ${addr.label}`}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Límite de direcciones (feat/direcciones-limite-y-chip-header):
                                    al llegar al máximo, el botón se reemplaza por la explicación.
                                    La defensa real está en el POST del endpoint. */}
                                {addresses.length < MAX_SAVED_ADDRESSES ? (
                                    <button
                                        onClick={startAdd}
                                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium hover:border-moovy hover:text-moovy hover:bg-red-50/30 transition flex items-center justify-center gap-2 mt-4"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Agregar otra ubicación
                                    </button>
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-4 mt-2">
                                        Podés tener hasta {MAX_SAVED_ADDRESSES} direcciones guardadas.
                                        Para agregar otra, eliminá una primero.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
