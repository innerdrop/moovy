"use client";

// OPS — Gestión de Cupones (feat/rediseno-home)
// CRUD sobre el modelo Coupon vía /api/ops/coupons (+ [id]). Los cupones activos,
// vigentes y no agotados alimentan la sección "Promos del Mundial" de la tienda.
// Regla #10: parámetro operativo editable desde OPS, nunca hardcodeado.

import { useState, useEffect } from "react";
import {
    Plus,
    Edit2,
    Trash2,
    Ticket,
    Loader2,
    Check,
    X,
    Percent,
    DollarSign,
    Truck,
} from "lucide-react";
import { toast } from "@/store/toast";

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DELIVERY";

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discountType: DiscountType;
    discountValue: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    maxUses: number | null;
    maxUsesPerUser: number;
    usedCount: number;
    isActive: boolean;
    validFrom: string;
    validUntil: string | null;
}

const TYPE_OPTIONS: { value: DiscountType; label: string; icon: any; color: string }[] = [
    { value: "PERCENTAGE", label: "Porcentaje", icon: Percent, color: "border-red-300 bg-red-50 text-red-700" },
    { value: "FIXED_AMOUNT", label: "Monto fijo", icon: DollarSign, color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
    { value: "FREE_DELIVERY", label: "Envío gratis", icon: Truck, color: "border-blue-300 bg-blue-50 text-blue-700" },
];

function formatDiscount(c: Pick<Coupon, "discountType" | "discountValue">): string {
    if (c.discountType === "FREE_DELIVERY") return "Envío gratis";
    if (c.discountType === "FIXED_AMOUNT") return `$${Math.round(c.discountValue).toLocaleString("es-AR")}`;
    return `${Math.round(c.discountValue)}%`;
}

function toDateInput(v: string | null): string {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

/** Estado visible del cupón para el badge de la lista. */
function couponStatus(c: Coupon): { label: string; cls: string; shownInPromos: boolean } {
    const now = Date.now();
    if (!c.isActive) return { label: "Inactivo", cls: "bg-slate-100 text-slate-500", shownInPromos: false };
    if (c.validUntil && new Date(c.validUntil).getTime() < now)
        return { label: "Vencido", cls: "bg-amber-50 text-amber-600", shownInPromos: false };
    if (c.maxUses != null && c.usedCount >= c.maxUses)
        return { label: "Agotado", cls: "bg-amber-50 text-amber-600", shownInPromos: false };
    return { label: "Activo · en Promos", cls: "bg-green-50 text-green-600", shownInPromos: true };
}

export default function OpsCuponesPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    // Form state
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [minOrderAmount, setMinOrderAmount] = useState("");
    const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [maxUsesPerUser, setMaxUsesPerUser] = useState("1");
    const [validUntil, setValidUntil] = useState("");

    useEffect(() => {
        loadCoupons();
    }, []);

    async function loadCoupons() {
        try {
            const res = await fetch("/api/ops/coupons");
            if (res.ok) setCoupons(await res.json());
        } catch (e) {
            console.error("Error loading coupons:", e);
        } finally {
            setLoading(false);
        }
    }

    function startNew() {
        setEditingId(null);
        setCode("");
        setDescription("");
        setDiscountType("PERCENTAGE");
        setDiscountValue("");
        setMinOrderAmount("");
        setMaxDiscountAmount("");
        setMaxUses("");
        setMaxUsesPerUser("1");
        setValidUntil("");
        setError("");
        setShowForm(true);
    }

    function startEdit(c: Coupon) {
        setEditingId(c.id);
        setCode(c.code);
        setDescription(c.description || "");
        setDiscountType(c.discountType);
        setDiscountValue(c.discountType === "FREE_DELIVERY" ? "" : String(c.discountValue));
        setMinOrderAmount(c.minOrderAmount != null ? String(c.minOrderAmount) : "");
        setMaxDiscountAmount(c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : "");
        setMaxUses(c.maxUses != null ? String(c.maxUses) : "");
        setMaxUsesPerUser(String(c.maxUsesPerUser || 1));
        setValidUntil(toDateInput(c.validUntil));
        setError("");
        setShowForm(true);
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setError("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedCode) {
            setError("El código es requerido");
            return;
        }
        const value = discountType === "FREE_DELIVERY" ? 0 : parseFloat(discountValue);
        if (discountType !== "FREE_DELIVERY" && (!isFinite(value) || value <= 0)) {
            setError("El valor del descuento debe ser mayor a 0");
            return;
        }
        if (discountType === "PERCENTAGE" && value > 100) {
            setError("El porcentaje no puede ser mayor a 100");
            return;
        }

        const payload = {
            code: trimmedCode,
            description: description.trim() || null,
            discountType,
            discountValue: value,
            minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
            maxDiscountAmount:
                discountType === "PERCENTAGE" && maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
            maxUses: maxUses ? parseInt(maxUses, 10) : null,
            maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser, 10) : 1,
            validUntil: validUntil || null,
        };

        setSaving(true);
        try {
            const url = editingId ? `/api/ops/coupons/${editingId}` : "/api/ops/coupons";
            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                await loadCoupons();
                toast.success(editingId ? "Cupón actualizado" : "Cupón creado");
                cancelForm();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Error al guardar");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(c: Coupon) {
        try {
            const res = await fetch(`/api/ops/coupons/${c.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !c.isActive }),
            });
            if (res.ok) {
                setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)));
            } else {
                toast.error("No se pudo actualizar");
            }
        } catch {
            toast.error("Error de conexión");
        }
    }

    async function handleDelete(c: Coupon) {
        if (!confirm(`¿Eliminar el cupón "${c.code}"?\n\nSe borran también sus usos registrados. Esta acción no se puede deshacer.`)) return;
        try {
            const res = await fetch(`/api/ops/coupons/${c.id}`, { method: "DELETE" });
            if (res.ok) {
                setCoupons((list) => list.filter((x) => x.id !== c.id));
                toast.success(`Cupón "${c.code}" eliminado`);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al eliminar");
            }
        } catch {
            toast.error("Error de conexión");
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
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-md z-30 py-4 px-4 md:static md:bg-transparent md:p-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        Cupones
                    </h1>
                    <p className="text-slate-500 font-medium text-xs mt-1 ml-1 hidden sm:block">
                        Los cupones activos y vigentes se muestran en “Promos del Mundial” de la tienda.
                    </p>
                </div>
                <button
                    onClick={startNew}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-moovy/20 hover:shadow-moovy/40 transition-shadow rounded-xl px-4 py-2.5 text-sm w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    <span className="font-bold">Nuevo Cupón</span>
                </button>
            </div>

            {/* Lista */}
            {coupons.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">No hay cupones</h3>
                    <p className="text-slate-400 text-sm mb-6">Creá el primero y aparecerá en Promos del Mundial.</p>
                    <button onClick={startNew} className="btn-primary rounded-xl px-4 py-2 text-sm">
                        Crear Cupón
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {coupons.map((c) => {
                        const st = couponStatus(c);
                        return (
                            <div
                                key={c.id}
                                className={`group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 ${!c.isActive ? "opacity-70" : ""}`}
                            >
                                {/* Descuento */}
                                <div className="w-16 h-16 rounded-2xl flex-shrink-0 bg-gradient-to-br from-[#75AADB] to-[#5b95c9] text-white flex flex-col items-center justify-center shadow-sm">
                                    <span className="text-lg font-black leading-none">{formatDiscount(c)}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="text-base font-black text-gray-900 tracking-wide truncate">{c.code}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                                            {st.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium truncate">
                                        {c.description || "Sin descripción"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-semibold flex-wrap">
                                        <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                            {c.minOrderAmount ? `Mín $${Math.round(c.minOrderAmount).toLocaleString("es-AR")}` : "Sin mínimo"}
                                        </span>
                                        <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                            Usos: {c.usedCount}{c.maxUses != null ? `/${c.maxUses}` : ""}
                                        </span>
                                        <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                            {c.validUntil ? `Hasta ${toDateInput(c.validUntil)}` : "Sin vencimiento"}
                                        </span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => toggleActive(c)}
                                        className={`p-2 rounded-xl transition-colors ${c.isActive
                                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            }`}
                                        title={c.isActive ? "Desactivar" : "Activar"}
                                    >
                                        <Check className={`w-4 h-4 ${c.isActive ? "opacity-100" : "opacity-0"}`} />
                                    </button>
                                    <button
                                        onClick={() => startEdit(c)}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-10 sm:pt-16 overflow-y-auto bg-black/30" onClick={cancelForm}>
                    <div
                        className="bg-white rounded-xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl relative mb-10 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl text-gray-900 tracking-tight">
                                {editingId ? "Editar Cupón" : "Nuevo Cupón"}
                            </h3>
                            <button onClick={cancelForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-100 font-medium">{error}</div>}

                        <div className="space-y-5">
                            {/* Código */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Código</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    disabled={!!editingId}
                                    className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all uppercase tracking-wider font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="MUNDIAL20"
                                    autoFocus={!editingId}
                                />
                                {editingId && <p className="text-[10px] text-gray-400 mt-1 ml-1">El código no se puede cambiar.</p>}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Descripción</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                    placeholder="20% en tu primer pedido del Mundial"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">Es el texto que ve el comprador en la tarjeta.</p>
                            </div>

                            {/* Tipo de descuento */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Tipo de descuento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {TYPE_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        const active = discountType === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setDiscountType(opt.value)}
                                                className={`py-2.5 rounded-xl text-[11px] font-bold border-2 transition-all active:scale-95 flex flex-col items-center gap-1 ${active ? opt.color + " shadow-sm" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"}`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Valor (oculto para envío gratis) */}
                            {discountType !== "FREE_DELIVERY" && (
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                                        {discountType === "PERCENTAGE" ? "Porcentaje (%)" : "Monto ($)"}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step={discountType === "PERCENTAGE" ? "1" : "50"}
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                        placeholder={discountType === "PERCENTAGE" ? "20" : "2000"}
                                    />
                                </div>
                            )}

                            {/* Tope de descuento (solo porcentaje) */}
                            {discountType === "PERCENTAGE" && (
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Tope de descuento ($) — opcional</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="50"
                                        value={maxDiscountAmount}
                                        onChange={(e) => setMaxDiscountAmount(e.target.value)}
                                        className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                        placeholder="Ej: 5000 (límite en pesos)"
                                    />
                                </div>
                            )}

                            {/* Mínimo de compra */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Mínimo de compra ($) — opcional</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={minOrderAmount}
                                    onChange={(e) => setMinOrderAmount(e.target.value)}
                                    className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                    placeholder="Ej: 8000"
                                />
                            </div>

                            {/* Límites de uso */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Usos totales</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                        placeholder="Ilimitado"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Por persona</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={maxUsesPerUser}
                                        onChange={(e) => setMaxUsesPerUser(e.target.value)}
                                        className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            {/* Vencimiento */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Vence el — opcional</label>
                                <input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">Sin fecha = no vence. Al vencer sale solo de Promos del Mundial.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button
                                onClick={cancelForm}
                                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 py-3 bg-moovy text-white rounded-xl font-bold hover:bg-red-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingId ? "Guardar" : "Crear"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
