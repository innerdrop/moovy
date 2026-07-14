"use client";

// OPS — Catálogo de recompensas MOOVER (feat/moover-canje-recompensas).
// CRUD sobre el modelo Reward vía /api/ops/rewards (+ [id]). Las recompensas
// activas se canjean de un toque en el checkout.

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Gift, Loader2, Check, X, Truck, DollarSign } from "lucide-react";
import { toast } from "@/store/toast";

type RewardType = "FREE_DELIVERY" | "FIXED_AMOUNT";

interface Reward {
    id: string;
    label: string;
    icon: string;
    description: string | null;
    pointsCost: number;
    type: RewardType;
    value: number;
    isActive: boolean;
    order: number;
}

const emptyForm = {
    label: "",
    icon: "🎁",
    description: "",
    pointsCost: 100,
    type: "FIXED_AMOUNT" as RewardType,
    value: 1000,
    isActive: true,
    order: 0,
};

export default function RecompensasPage() {
    const [rewards, setRewards] = useState<Reward[] | null>(null);
    const [error, setError] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setError(false);
        try {
            const res = await fetch("/api/ops/rewards");
            if (!res.ok) throw new Error();
            setRewards(await res.json());
        } catch {
            setError(true);
        }
    };
    useEffect(() => { load(); }, []);

    const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
    const openEdit = (r: Reward) => {
        setForm({ label: r.label, icon: r.icon, description: r.description || "", pointsCost: r.pointsCost, type: r.type, value: r.value, isActive: r.isActive, order: r.order });
        setEditingId(r.id);
        setShowForm(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            const url = editingId ? `/api/ops/rewards/${editingId}` : "/api/ops/rewards";
            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
            toast.success(editingId ? "Recompensa actualizada" : "Recompensa creada");
            setShowForm(false);
            load();
        } catch (e: any) {
            toast.error(e?.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (r: Reward) => {
        if (!confirm(`¿Eliminar "${r.label}"?`)) return;
        try {
            const res = await fetch(`/api/ops/rewards/${r.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Recompensa eliminada");
            load();
        } catch {
            toast.error("No se pudo eliminar");
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e60012]/10">
                        <Gift className="h-6 w-6 text-[#e60012]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Recompensas MOOVER</h1>
                        <p className="text-sm text-gray-500">Se canjean de un toque en el checkout. Sin código.</p>
                    </div>
                </div>
                <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-[#e60012] px-4 py-2.5 text-sm font-black text-white shadow-md hover:bg-[#cc000f]">
                    <Plus className="h-4 w-4" /> Nueva
                </button>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                    <p className="font-bold text-red-700">No se pudieron cargar las recompensas.</p>
                    <button onClick={load} className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm">Reintentar</button>
                </div>
            ) : rewards === null ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : rewards.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center text-gray-500">
                    Todavía no hay recompensas. Creá la primera (ej: "🚚 Envío gratis" o "🍫 $1.000 de descuento").
                </div>
            ) : (
                <div className="grid gap-3">
                    {rewards.map((r) => (
                        <div key={r.id} className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm ${r.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
                            <span className="text-2xl">{r.icon}</span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-gray-900">{r.label}</p>
                                <p className="text-xs text-gray-500">
                                    {r.pointsCost.toLocaleString("es-AR")} pts · {r.type === "FREE_DELIVERY" ? "Envío gratis" : `−$${r.value.toLocaleString("es-AR")}`}{!r.isActive ? " · oculta" : ""}
                                </p>
                            </div>
                            <button onClick={() => openEdit(r)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => remove(r)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setShowForm(false)}>
                    <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900">{editingId ? "Editar recompensa" : "Nueva recompensa"}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-20">
                                    <label className="text-xs font-bold text-gray-500">Ícono</label>
                                    <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={4} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-center text-2xl" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500">Nombre</label>
                                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Chocolate gratis" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Tipo</label>
                                <div className="mt-1 grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setForm({ ...form, type: "FIXED_AMOUNT" })} className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold ${form.type === "FIXED_AMOUNT" ? "border-[#e60012] bg-red-50 text-[#e60012]" : "border-gray-200 text-gray-500"}`}><DollarSign className="h-4 w-4" /> Descuento fijo</button>
                                    <button type="button" onClick={() => setForm({ ...form, type: "FREE_DELIVERY" })} className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold ${form.type === "FREE_DELIVERY" ? "border-[#e60012] bg-red-50 text-[#e60012]" : "border-gray-200 text-gray-500"}`}><Truck className="h-4 w-4" /> Envío gratis</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Costo en puntos</label>
                                    <input type="number" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: parseInt(e.target.value) || 0 })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </div>
                                {form.type === "FIXED_AMOUNT" && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Descuento ($)</label>
                                        <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" />
                                    </div>
                                )}
                            </div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#e60012]" />
                                Visible en el checkout
                            </label>
                            <button onClick={save} disabled={saving || !form.label} className="w-full rounded-xl bg-[#e60012] py-3 font-black text-white disabled:bg-gray-300 flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
