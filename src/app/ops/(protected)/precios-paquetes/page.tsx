"use client";

import { useState, useEffect } from "react";
import {
    DollarSign, Plus, Loader2, Trash2, Edit3, Check,
    X, Package, TrendingDown, Save, ToggleLeft, ToggleRight, Info
} from "lucide-react";

interface PricingTier {
    id: string;
    name: string;
    minItems: number;
    maxItems: number | null;
    pricePerItem: number;
    totalPrice: number;
    isActive: boolean;
    order: number;
}

export default function PricingTiersPage() {
    const [tiers, setTiers] = useState<PricingTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: "", minItems: "", maxItems: "", pricePerItem: "", totalPrice: "",
    });

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const fetchTiers = async () => {
        try {
            const res = await fetch("/api/admin/pricing-tiers");
            const data = await res.json();
            if (Array.isArray(data)) setTiers(data);
        } catch (error) {
            console.error("Error fetching tiers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTiers(); }, []);

    const resetForm = () => {
        setForm({ name: "", minItems: "", maxItems: "", pricePerItem: "", totalPrice: "" });
        setShowForm(false);
        setEditingId(null);
    };

    // Auto-calculate totalPrice when minItems and pricePerItem change
    const updateForm = (field: string, value: string) => {
        const newForm = { ...form, [field]: value };

        if (field === "minItems" || field === "pricePerItem") {
            const items = Number(newForm.minItems) || 0;
            const price = Number(newForm.pricePerItem) || 0;
            if (items > 0 && price > 0) {
                newForm.totalPrice = String(items * price);
            }
        }

        setForm(newForm);
    };

    const handleSave = async () => {
        if (!form.name || !form.minItems || !form.pricePerItem || !form.totalPrice) {
            showToast("Completa todos los campos requeridos");
            return;
        }

        setSaving(true);
        try {
            const body = {
                ...(editingId ? { id: editingId } : {}),
                name: form.name,
                minItems: Number(form.minItems),
                maxItems: form.maxItems ? Number(form.maxItems) : null,
                pricePerItem: Number(form.pricePerItem),
                totalPrice: Number(form.totalPrice),
            };

            const res = await fetch("/api/admin/pricing-tiers", {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast(editingId ? "Tier actualizado" : "Tier creado");
                resetForm();
                fetchTiers();
            } else {
                showToast("Error al guardar");
            }
        } catch {
            showToast("Error de conexion");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (tier: PricingTier) => {
        setForm({
            name: tier.name,
            minItems: String(tier.minItems),
            maxItems: tier.maxItems ? String(tier.maxItems) : "",
            pricePerItem: String(tier.pricePerItem),
            totalPrice: String(tier.totalPrice),
        });
        setEditingId(tier.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminar este tier de precios?")) return;
        try {
            const res = await fetch(`/api/admin/pricing-tiers?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Tier eliminado");
                fetchTiers();
            }
        } catch {
            showToast("Error al eliminar");
        }
    };

    const handleToggleActive = async (tier: PricingTier) => {
        try {
            const res = await fetch("/api/admin/pricing-tiers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: tier.id, isActive: !tier.isActive }),
            });
            if (res.ok) {
                showToast(tier.isActive ? "Tier desactivado" : "Tier activado");
                fetchTiers();
            }
        } catch {
            showToast("Error al actualizar");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toastMsg && (
                <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-top duration-300">
                    {toastMsg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        Precios de Paquetes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configurar precios escalonados para la compra de productos individuales por comercios</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Nuevo Tier
                </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-blue-900">Como funcionan los tiers</p>
                    <p className="text-xs text-blue-700/70 mt-1">
                        Cuando un comercio elige &quot;Armar tu propio paquete&quot;, el precio por producto baja a medida que selecciona mas items.
                        Por ejemplo: 1 producto = $500, Pack x10 = $300/producto, Pack x50 = $160/producto.
                        Esto incentiva compras mas grandes.
                    </p>
                </div>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-in slide-in-from-top duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900">{editingId ? "Editar Tier" : "Nuevo Tier de Precio"}</h2>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => updateForm("name", e.target.value)}
                                placeholder="Pack x10"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Min. items *</label>
                            <input
                                type="number"
                                value={form.minItems}
                                onChange={(e) => updateForm("minItems", e.target.value)}
                                placeholder="10"
                                min="1"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Max. items</label>
                            <input
                                type="number"
                                value={form.maxItems}
                                onChange={(e) => updateForm("maxItems", e.target.value)}
                                placeholder="Sin limite"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Precio/item ($) *</label>
                            <input
                                type="number"
                                value={form.pricePerItem}
                                onChange={(e) => updateForm("pricePerItem", e.target.value)}
                                placeholder="300"
                                min="0"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Precio total ($) *</label>
                            <input
                                type="number"
                                value={form.totalPrice}
                                onChange={(e) => updateForm("totalPrice", e.target.value)}
                                placeholder="3000"
                                min="0"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {form.minItems && form.pricePerItem && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            <span className="font-bold">{form.name || "Este tier"}</span>: Un comercio que seleccione {form.minItems}+ productos pagara <span className="font-bold text-blue-600">${Number(form.pricePerItem).toLocaleString()}</span> por cada uno (total ${Number(form.totalPrice).toLocaleString()})
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={resetForm} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editingId ? "Actualizar" : "Crear"}
                        </button>
                    </div>
                </div>
            )}

            {/* Tiers Table */}
            {tiers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-500 mb-1">Sin tiers de precio</h3>
                    <p className="text-sm text-gray-400 mb-4">Crea tu primer tier para que los comercios vean precios al armar paquetes personalizados</p>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition"
                    >
                        Crear primer tier
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs">Nombre</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-600 text-xs">Min Items</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-600 text-xs">Max Items</th>
                                <th className="text-right py-3 px-4 font-bold text-gray-600 text-xs">$/Producto</th>
                                <th className="text-right py-3 px-4 font-bold text-gray-600 text-xs">Total Pack</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-600 text-xs">Estado</th>
                                <th className="text-right py-3 px-4 font-bold text-gray-600 text-xs">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tiers.map((tier, i) => (
                                <tr key={tier.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${!tier.isActive ? "opacity-50" : ""}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                                                i === 0 ? "bg-red-500" : i === 1 ? "bg-orange-500" : i === 2 ? "bg-blue-500" : "bg-green-500"
                                            }`}>
                                                x{tier.minItems}
                                            </div>
                                            <span className="font-bold text-gray-900">{tier.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center text-gray-600">{tier.minItems}</td>
                                    <td className="py-3 px-4 text-center text-gray-600">{tier.maxItems || "∞"}</td>
                                    <td className="py-3 px-4 text-right font-bold text-gray-900">${tier.pricePerItem.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right font-bold text-blue-600">${tier.totalPrice.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button onClick={() => handleToggleActive(tier)} className="inline-flex items-center gap-1">
                                            {tier.isActive ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                                    <ToggleRight className="w-3 h-3" /> Activo
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                                                    <ToggleLeft className="w-3 h-3" /> Inactivo
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleEdit(tier)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tier.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Eliminar"
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
            )}

            {/* How pricing works visual */}
            {tiers.filter(t => t.isActive).length >= 2 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-gray-900">Asi lo ve el comercio</h3>
                    </div>
                    <div className="flex items-end gap-4 overflow-x-auto pb-2">
                        {tiers.filter(t => t.isActive).sort((a, b) => a.minItems - b.minItems).map((tier, i) => {
                            const maxPrice = Math.max(...tiers.filter(t => t.isActive).map(t => t.pricePerItem));
                            const heightPct = (tier.pricePerItem / maxPrice) * 100;
                            return (
                                <div key={tier.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                                    <p className="text-xs font-bold text-gray-900">${tier.pricePerItem.toLocaleString()}</p>
                                    <div
                                        className={`w-16 rounded-t-lg transition-all ${
                                            i === tiers.filter(t => t.isActive).length - 1 ? "bg-green-500" : "bg-green-300"
                                        }`}
                                        style={{ height: `${Math.max(heightPct * 0.8, 20)}px` }}
                                    />
                                    <p className="text-[10px] font-bold text-gray-500 text-center">{tier.name}</p>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-green-700 mt-3">Cuantos mas productos elige el comercio, menos paga por cada uno</p>
                </div>
            )}
        </div>
    );
}
