"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Gift, Percent, DollarSign, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface PointsConfig {
    pointsPerDollar: number;
    minPurchaseForPoints: number;
    pointsValue: number;
    minPointsToRedeem: number;
    maxDiscountPercent: number;
    signupBonus: number;
    referralBonus: number;
    reviewBonus: number;
}

export default function PointsConfigForm() {
    const router = useRouter();
    const [config, setConfig] = useState<PointsConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/admin/points-config");
            if (res.ok) {
                setConfig(await res.json());
            } else {
                setError("Error cargando configuración");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => prev ? ({ ...prev, [name]: parseFloat(value) || 0 }) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch("/api/admin/points-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al guardar");
            }

            setSuccess(true);
            router.refresh(); // Refresh stored config cache if any
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin w-8 h-8 text-gray-400 mx-auto" /></div>;
    if (!config) return <div className="text-red-500">No se pudo cargar la configuración.</div>;

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Reglas del Programa de Lealtad</h2>
                    <p className="text-sm text-slate-500">Configura cómo los usuarios ganan y gastan puntos.</p>
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Guardar Cambios
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100 flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Configuración guardada correctamente</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earning Rules */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                    <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        Ganancia de Puntos
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Puntos por cada $1 gastado</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="pointsPerDollar"
                                value={config.pointsPerDollar}
                                onChange={handleChange}
                                className="input pr-12"
                                step="0.1"
                                min="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">pts/$</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Si configuras 1, por $1000 gastados ganan 1000 pts.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Compra mínima para sumar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                name="minPurchaseForPoints"
                                value={config.minPurchaseForPoints}
                                onChange={handleChange}
                                className="input pl-7"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Redemption Rules */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                    <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-600" />
                        Canje y Valor
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor de 1 Punto (en $)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                name="pointsValue"
                                value={config.pointsValue}
                                onChange={handleChange}
                                className="input pl-7"
                                step="0.001"
                                min="0.001"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            1000 pts = ${(1000 * config.pointsValue).toFixed(0)} pesos.
                            (Actual: {((config.pointsValue / config.pointsPerDollar) * 100).toFixed(0)}% Cashback)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Máximo descuento permitido</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="maxDiscountPercent"
                                value={config.maxDiscountPercent}
                                onChange={handleChange}
                                className="input pr-12"
                                min="0"
                                max="100"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Límite del total de la compra pagable con puntos.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mínimo de puntos para canjear</label>
                        <input
                            type="number"
                            name="minPointsToRedeem"
                            value={config.minPointsToRedeem}
                            onChange={handleChange}
                            className="input"
                            min="0"
                        />
                    </div>
                </div>

                {/* Bonuses */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6 md:col-span-2">
                    <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Bonificaciones y Referidos
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bono Bienvenida (Signup)</label>
                            <input
                                type="number"
                                name="signupBonus"
                                value={config.signupBonus}
                                onChange={handleChange}
                                className="input"
                                min="0"
                            />
                            <p className="text-xs text-slate-500 mt-1">Valor: ${config.signupBonus * config.pointsValue}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bono por Referido (Dueño)</label>
                            <input
                                type="number"
                                name="referralBonus"
                                value={config.referralBonus}
                                onChange={handleChange}
                                className="input"
                                min="0"
                            />
                            <p className="text-xs text-slate-500 mt-1">Valor: ${config.referralBonus * config.pointsValue}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bono por Reseña/Review</label>
                            <input
                                type="number"
                                name="reviewBonus"
                                value={config.reviewBonus}
                                onChange={handleChange}
                                className="input"
                                min="0"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
