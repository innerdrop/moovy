"use client";

// Ops Logistics Configuration Panel
// Sections: Global Config, Package Categories, Delivery Rates, Coverage Zones
import { useState, useEffect, useCallback } from "react";
import {
    Settings,
    Package,
    Truck,
    MapPin,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Calculator,
    Globe,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MoovyConfigItem {
    id: string;
    key: string;
    value: string;
    description: string;
}

interface PackageCategoryItem {
    id: string;
    name: string;
    maxWeightGrams: number;
    maxLengthCm: number;
    maxWidthCm: number;
    maxHeightCm: number;
    volumeScore: number;
    allowedVehicles: string[];
    displayOrder: number;
}

interface DeliveryRateItem {
    id: string;
    categoryId: string;
    basePriceArs: number;
    pricePerKmArs: number;
    category: { name: string; displayOrder: number };
}

// ─── Config keys definition ────────────────────────────────────────────────────

const GLOBAL_CONFIG_FIELDS = [
    { key: "driver_response_timeout_seconds", label: "Timeout respuesta driver", unit: "seg", min: 10, max: 60 },
    { key: "merchant_confirm_timeout_seconds", label: "Timeout confirmación comercio", unit: "seg", min: 10, max: 300 },
    { key: "seller_commission_pct", label: "Comisión vendedor", unit: "%", min: 0, max: 100 },
    { key: "driver_commission_pct", label: "Comisión repartidor", unit: "%", min: 0, max: 100 },
    { key: "max_delivery_distance_km", label: "Distancia máx. delivery", unit: "km", min: 1, max: 200 },
    { key: "min_order_amount_ars", label: "Monto mínimo pedido", unit: "ARS", min: 0, max: 999999 },
    { key: "max_assignment_attempts", label: "Intentos máx. asignación", unit: "", min: 1, max: 20 },
    { key: "assignment_rating_radius_meters", label: "Radio rating asignación", unit: "m", min: 100, max: 50000 },
    { key: "scheduled_notify_before_minutes", label: "Notificar antes (prog.)", unit: "min", min: 1, max: 120 },
    { key: "scheduled_cancel_if_no_confirm_minutes", label: "Cancelar sin confirmación", unit: "min", min: 1, max: 120 },
];

const VEHICLE_OPTIONS = ["BIKE", "MOTO", "CAR", "TRUCK"] as const;
const VEHICLE_LABELS: Record<string, string> = { BIKE: "🚲 Bici", MOTO: "🏍️ Moto", CAR: "🚗 Auto", TRUCK: "🚛 Camión" };

// ─── Toast Component ────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn text-sm font-bold ${
                type === "success"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
            }`}
        >
            {type === "success" ? (
                <CheckCircle className="w-5 h-5" />
            ) : (
                <AlertCircle className="w-5 h-5" />
            )}
            {message}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ConfigLogisticaPage() {
    // Toast state
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
    }, []);

    // ── Section 1: Global Config ────────────────────────────────────────────────
    const [configs, setConfigs] = useState<MoovyConfigItem[]>([]);
    const [configValues, setConfigValues] = useState<Record<string, string>>({});
    const [loadingConfigs, setLoadingConfigs] = useState(true);
    const [savingConfigs, setSavingConfigs] = useState(false);

    // ── Section 2: Package Categories ───────────────────────────────────────────
    const [categories, setCategories] = useState<PackageCategoryItem[]>([]);
    const [editedCategories, setEditedCategories] = useState<Record<string, Partial<PackageCategoryItem>>>({});
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [savingCategories, setSavingCategories] = useState(false);

    // ── Section 3: Delivery Rates ───────────────────────────────────────────────
    const [rates, setRates] = useState<DeliveryRateItem[]>([]);
    const [editedRates, setEditedRates] = useState<Record<string, Partial<DeliveryRateItem>>>({});
    const [loadingRates, setLoadingRates] = useState(true);
    const [savingRates, setSavingRates] = useState(false);

    // ── Load all data ───────────────────────────────────────────────────────────
    useEffect(() => {
        async function loadAll() {
            try {
                const [configRes, catRes, rateRes] = await Promise.all([
                    fetch("/api/ops/config/global"),
                    fetch("/api/ops/config/categories"),
                    fetch("/api/ops/config/rates"),
                ]);

                if (configRes.ok) {
                    const data = await configRes.json();
                    setConfigs(data.configs || []);
                    const map: Record<string, string> = {};
                    for (const c of data.configs || []) {
                        map[c.key] = c.value;
                    }
                    setConfigValues(map);
                }

                if (catRes.ok) {
                    const data = await catRes.json();
                    setCategories(data.categories || []);
                }

                if (rateRes.ok) {
                    const data = await rateRes.json();
                    setRates(data.rates || []);
                }
            } catch (err) {
                console.error("Error loading config data:", err);
                showToast("Error al cargar datos", "error");
            } finally {
                setLoadingConfigs(false);
                setLoadingCategories(false);
                setLoadingRates(false);
            }
        }
        loadAll();
    }, [showToast]);

    // ── Save: Global Config ─────────────────────────────────────────────────────
    async function saveGlobalConfig() {
        setSavingConfigs(true);
        const prevValues = { ...configValues };
        try {
            for (const field of GLOBAL_CONFIG_FIELDS) {
                const currentVal = configValues[field.key] ?? "";
                const existingConfig = configs.find((c) => c.key === field.key);
                if (existingConfig && existingConfig.value === currentVal) continue;
                if (!existingConfig && currentVal === "") continue;

                const res = await fetch("/api/ops/config/global", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: field.key, value: currentVal }),
                });
                if (!res.ok) throw new Error(`Error guardando ${field.key}`);
            }
            // Refresh from server
            const refreshRes = await fetch("/api/ops/config/global");
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setConfigs(data.configs || []);
            }
            showToast("Configuración global guardada", "success");
        } catch (err) {
            setConfigValues(prevValues);
            showToast("Error al guardar configuración global", "error");
        } finally {
            setSavingConfigs(false);
        }
    }

    // ── Save: Package Categories ────────────────────────────────────────────────
    async function saveCategories() {
        setSavingCategories(true);
        const prevCategories = [...categories];
        try {
            for (const [id, fields] of Object.entries(editedCategories)) {
                if (Object.keys(fields).length === 0) continue;
                const res = await fetch("/api/ops/config/categories", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, ...fields }),
                });
                if (!res.ok) throw new Error(`Error guardando categoría ${id}`);
            }
            // Refresh
            const refreshRes = await fetch("/api/ops/config/categories");
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setCategories(data.categories || []);
            }
            setEditedCategories({});
            showToast("Categorías de paquete guardadas", "success");
        } catch (err) {
            setCategories(prevCategories);
            showToast("Error al guardar categorías", "error");
        } finally {
            setSavingCategories(false);
        }
    }

    // ── Save: Delivery Rates ────────────────────────────────────────────────────
    async function saveRates() {
        setSavingRates(true);
        const prevRates = [...rates];
        try {
            for (const [id, fields] of Object.entries(editedRates)) {
                if (Object.keys(fields).length === 0) continue;
                const res = await fetch("/api/ops/config/rates", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, ...fields }),
                });
                if (!res.ok) throw new Error(`Error guardando tarifa ${id}`);
            }
            // Refresh
            const refreshRes = await fetch("/api/ops/config/rates");
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setRates(data.rates || []);
            }
            setEditedRates({});
            showToast("Tarifas de envío guardadas", "success");
        } catch (err) {
            setRates(prevRates);
            showToast("Error al guardar tarifas", "error");
        } finally {
            setSavingRates(false);
        }
    }

    // ── Helpers: Category editing ───────────────────────────────────────────────
    function getCategoryValue<K extends keyof PackageCategoryItem>(cat: PackageCategoryItem, field: K): PackageCategoryItem[K] {
        const edited = editedCategories[cat.id];
        if (edited && field in edited) return edited[field] as PackageCategoryItem[K];
        return cat[field];
    }

    function updateCategory(id: string, field: string, value: unknown) {
        setEditedCategories((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value },
        }));
        // Optimistic UI: update displayed categories
        setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        );
    }

    // ── Helpers: Rate editing ───────────────────────────────────────────────────
    function getRateValue(rate: DeliveryRateItem, field: "basePriceArs" | "pricePerKmArs"): number {
        const edited = editedRates[rate.id];
        if (edited && field in edited) return edited[field] as number;
        return rate[field];
    }

    function updateRate(id: string, field: string, value: number) {
        setEditedRates((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value },
        }));
        setRates((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
        );
    }

    // ── Loading state ───────────────────────────────────────────────────────────
    const anyLoading = loadingConfigs || loadingCategories || loadingRates;
    if (anyLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-moovy" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 italic">
                    <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20 not-italic">
                        <Settings className="w-7 h-7 text-white" />
                    </div>
                    Config Logística
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">
                    Parámetros operativos del sistema de delivery
                </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 1 — Configuración Global (MoovyConfig)
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none">Configuración Global</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Parámetros clave del sistema</p>
                        </div>
                    </div>
                    <button
                        onClick={saveGlobalConfig}
                        disabled={savingConfigs}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
                    >
                        {savingConfigs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {GLOBAL_CONFIG_FIELDS.map((field) => (
                        <div key={field.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                {field.label}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={field.min}
                                    max={field.max}
                                    step={field.key.includes("pct") ? "0.1" : "1"}
                                    required
                                    value={configValues[field.key] ?? ""}
                                    onChange={(e) =>
                                        setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                                    }
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-14"
                                />
                                {field.unit && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">
                                        {field.unit}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 2 — Categorías de Paquete (PackageCategory)
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <Package className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none">Categorías de Paquete</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Dimensiones y vehículos permitidos</p>
                        </div>
                    </div>
                    <button
                        onClick={saveCategories}
                        disabled={savingCategories}
                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition disabled:opacity-50 shadow-lg shadow-amber-600/20"
                    >
                        {savingCategories ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                    </button>
                </div>

                {categories.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No hay categorías de paquete configuradas</p>
                ) : (
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="text-left p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                                    <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso máx (g)</th>
                                    <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Largo (cm)</th>
                                    <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ancho (cm)</th>
                                    <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alto (cm)</th>
                                    <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vol. Score</th>
                                    <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3">
                                            <span className="font-black text-gray-900 text-sm px-3 py-1 bg-slate-100 rounded-lg">
                                                {cat.name}
                                            </span>
                                        </td>
                                        {(["maxWeightGrams", "maxLengthCm", "maxWidthCm", "maxHeightCm", "volumeScore"] as const).map((field) => (
                                            <td key={field} className="p-3 text-center">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    required
                                                    value={getCategoryValue(cat, field)}
                                                    onChange={(e) => updateCategory(cat.id, field, parseInt(e.target.value) || 0)}
                                                    className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                                                />
                                            </td>
                                        ))}
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                {VEHICLE_OPTIONS.map((v) => {
                                                    const vehicles = getCategoryValue(cat, "allowedVehicles") as string[];
                                                    const checked = vehicles.includes(v);
                                                    return (
                                                        <label
                                                            key={v}
                                                            className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer text-[10px] font-bold transition-all border ${
                                                                checked
                                                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => {
                                                                    const next = checked
                                                                        ? vehicles.filter((x) => x !== v)
                                                                        : [...vehicles, v];
                                                                    updateCategory(cat.id, "allowedVehicles", next);
                                                                }}
                                                                className="sr-only"
                                                            />
                                                            {VEHICLE_LABELS[v]}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 3 — Tarifas de Envío (DeliveryRate)
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                            <Truck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none">Tarifas de Envío</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Precio base y por kilómetro</p>
                        </div>
                    </div>
                    <button
                        onClick={saveRates}
                        disabled={savingRates}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 shadow-lg shadow-green-600/20"
                    >
                        {savingRates ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                    </button>
                </div>

                {rates.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No hay tarifas configuradas</p>
                ) : (
                    <>
                        <div className="overflow-x-auto -mx-2 mb-8">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="text-left p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                                        <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Base (ARS)</th>
                                        <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio/km (ARS)</th>
                                        <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo 5km</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rates.map((rate) => {
                                        const base = getRateValue(rate, "basePriceArs");
                                        const perKm = getRateValue(rate, "pricePerKmArs");
                                        const cost5km = base + perKm * 5;
                                        return (
                                            <tr key={rate.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3">
                                                    <span className="font-black text-gray-900 text-sm px-3 py-1 bg-green-50 rounded-lg border border-green-100">
                                                        {rate.category.name}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="relative inline-block">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            required
                                                            value={base}
                                                            onChange={(e) => updateRate(rate.id, "basePriceArs", parseFloat(e.target.value) || 0)}
                                                            className="w-28 bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-center font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="relative inline-block">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            required
                                                            value={perKm}
                                                            onChange={(e) => updateRate(rate.id, "pricePerKmArs", parseFloat(e.target.value) || 0)}
                                                            className="w-28 bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-center font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="font-black text-green-700 text-base">
                                                        ${cost5km.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Live Preview */}
                        <div className="bg-navy text-white rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 -mr-24 -mt-24 rounded-full" />
                            <div className="flex items-center gap-3 mb-4">
                                <Calculator className="w-5 h-5 text-green-400" />
                                <h3 className="text-sm font-black uppercase tracking-widest">Simulador Rápido — 5 KM</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {rates.map((rate) => {
                                    const base = getRateValue(rate, "basePriceArs");
                                    const perKm = getRateValue(rate, "pricePerKmArs");
                                    const cost = base + perKm * 5;
                                    return (
                                        <div key={rate.id} className="p-3 bg-white/10 rounded-xl">
                                            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">
                                                {rate.category.name}
                                            </p>
                                            <p className="text-xl font-black text-green-400">
                                                ${cost.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 4 — Zonas de Cobertura (Placeholder)
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 leading-none">Zonas de Cobertura</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configuración geográfica</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                        <MapPin className="w-10 h-10 text-purple-300" />
                    </div>
                    <p className="text-lg font-black text-slate-300 italic">Próximamente</p>
                    <p className="text-sm text-slate-400 mt-1">Configuración de zonas geográficas de cobertura</p>
                </div>
            </section>
        </div>
    );
}
