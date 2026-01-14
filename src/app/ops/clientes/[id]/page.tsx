"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronLeft, Gift, Save, Loader2, AlertCircle, CheckCircle, User, CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/delivery";

interface UserData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    pointsBalance: number;
    createdAt: string;
}

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params in Next 15+
    const unwrappedParams = use(params);
    const userId = unwrappedParams.id;

    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [adjustmentType, setAdjustmentType] = useState<"ADD" | "SUBTRACT">("ADD");
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        try {
            // Reusing the users list API but filtering? No, ideally we should have a GET /api/admin/users/[id]
            // For now, let's just fetch all users and find the one (not optimal but works for MVP since I didn't create the specific endpoint)
            // Correction: I should probably create a specific endpoint or update users API. 
            // Let's assume fetching list and filtering for now as I created the list API.
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                const foundUser = data.find((u: UserData) => u.id === userId);
                if (foundUser) setUser(foundUser);
                else setMessage({ type: 'error', text: 'Usuario no encontrado' });
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setProcessing(true);

        const amount = parseInt(adjustmentAmount);
        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: 'error', text: 'Ingresá un monto válido.' });
            setProcessing(false);
            return;
        }

        const finalAmount = adjustmentType === "ADD" ? amount : -amount;

        try {
            const res = await fetch(`/api/admin/users/${userId}/points`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: finalAmount,
                    description: adjustmentReason || "Ajuste manual de administrador",
                    type: "ADJUSTMENT"
                }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Puntos ajustados correctamente.' });
                setAdjustmentAmount("");
                setAdjustmentReason("");
                // Refresh use data
                fetchUser();
            } else {
                setMessage({ type: 'error', text: 'Error al ajustar puntos.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión.' });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Usuario no encontrado.</p>
                <Link href="/admin/clientes" className="text-[#e60012] hover:underline mt-2 inline-block">
                    Volver al listado
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                href="/admin/clientes"
                className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition"
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Volver a Clientes
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {user.name}
                        {user.role === 'ADMIN' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                Admin
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Saldo Actual</p>
                    <p className="text-3xl font-bold text-[#e60012] flex items-center justify-end gap-2">
                        <Gift className="w-6 h-6" />
                        {user.pointsBalance}
                    </p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* User Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        Información
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">ID de Usuario</p>
                            <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1">{user.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <p className="font-medium">{user.phone || "No registrado"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Fecha de Registro</p>
                            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Adjustment Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[#e60012]" />
                        Ajustar Puntos
                    </h2>

                    <form onSubmit={handleAdjustment} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setAdjustmentType("ADD")}
                                className={`py-2 text-sm font-medium rounded-md transition ${adjustmentType === "ADD"
                                        ? "bg-white text-green-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Sumar (+)
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdjustmentType("SUBTRACT")}
                                className={`py-2 text-sm font-medium rounded-md transition ${adjustmentType === "SUBTRACT"
                                        ? "bg-white text-red-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Restar (-)
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad de Puntos
                            </label>
                            <input
                                type="number"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                                placeholder="0"
                                className="input"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo (Opcional)
                            </label>
                            <input
                                type="text"
                                value={adjustmentReason}
                                onChange={(e) => setAdjustmentReason(e.target.value)}
                                placeholder="Ej: Bonificación por error..."
                                className="input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full py-2.5 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 ${adjustmentType === "ADD"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                                }`}
                        >
                            {processing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {adjustmentType === "ADD" ? "Sumar Puntos" : "Restar Puntos"}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
