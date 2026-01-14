"use client";

import { useState, useEffect } from "react";
import {
    Gift,
    DollarSign,
    Percent,
    Users,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle,
    Info
} from "lucide-react";

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

export default function PointsConfigPage() {
    const [config, setConfig] = useState<PointsConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/admin/points/config");
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            } else {
                setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config) return;

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/points/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
            } else {
                setMessage({ type: 'error', text: 'Error al guardar los cambios.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión.' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: keyof PointsConfig, value: string) => {
        if (!config) return;
        const numValue = parseFloat(value);
        setConfig({
            ...config,
            [key]: isNaN(numValue) ? 0 : numValue
        });
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!config) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sistema de Puntos</h1>
                    <p className="text-gray-500">Configurá cómo los usuarios ganan y canjean puntos.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Ganancia de Puntos */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6 text-[#e60012]">
                            <DollarSign className="w-6 h-6" />
                            <h2 className="text-lg font-bold">Ganancia de Puntos</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Puntos por cada $1 gastado
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={config.pointsPerDollar}
                                        onChange={(e) => handleChange('pointsPerDollar', e.target.value)}
                                        className="input flex-1"
                                    />
                                    <span className="text-gray-500 text-sm">pts/$</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Ej: Si ponés 1, el usuario gana 1000 puntos por una compra de $1000.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Compra mínima para sumar
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={config.minPurchaseForPoints}
                                        onChange={(e) => handleChange('minPurchaseForPoints', e.target.value)}
                                        className="input flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Canje de Puntos */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6 text-indigo-600">
                            <Gift className="w-6 h-6" />
                            <h2 className="text-lg font-bold">Canje de Puntos</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor de 1 punto (en Pesos)
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={config.pointsValue}
                                        onChange={(e) => handleChange('pointsValue', e.target.value)}
                                        className="input flex-1"
                                    />
                                </div>
                                <div className="mt-2 bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex items-start gap-2">
                                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p>
                                        Con este valor, 100 puntos = <strong>${(100 * config.pointsValue).toFixed(2)}</strong> de descuento.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mínimo de puntos para canjear
                                </label>
                                <input
                                    type="number"
                                    value={config.minPointsToRedeem}
                                    onChange={(e) => handleChange('minPointsToRedeem', e.target.value)}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tope máximo de descuento
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={config.maxDiscountPercent}
                                        onChange={(e) => handleChange('maxDiscountPercent', e.target.value)}
                                        className="input flex-1"
                                    />
                                    <Percent className="w-4 h-4 text-gray-500" />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Porcentaje máximo del total del pedido que se puede pagar con puntos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bonificaciones */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6 text-green-600">
                            <Users className="w-6 h-6" />
                            <h2 className="text-lg font-bold">Bonificaciones Automáticas</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Registro de Usuario
                                </label>
                                <input
                                    type="number"
                                    value={config.signupBonus}
                                    onChange={(e) => handleChange('signupBonus', e.target.value)}
                                    className="input"
                                />
                                <p className="text-xs text-gray-400 mt-1">Puntos de regalo al registrarse.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Referidos (Próximamente)
                                </label>
                                <input
                                    type="number"
                                    value={config.referralBonus}
                                    onChange={(e) => handleChange('referralBonus', e.target.value)}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reseñas (Próximamente)
                                </label>
                                <input
                                    type="number"
                                    value={config.reviewBonus}
                                    onChange={(e) => handleChange('reviewBonus', e.target.value)}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-6 right-6 lg:static lg:mt-6 lg:flex lg:justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#e60012] hover:bg-[#c4000f] text-white px-8 py-3 rounded-full lg:rounded-lg font-bold shadow-lg lg:shadow-none transition transform hover:scale-105 lg:hover:scale-100 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
