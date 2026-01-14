"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Truck,
    CheckCircle,
    Package,
    XCircle,
    Loader2
} from "lucide-react";

export default function OrderActions({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const updateStatus = async (newStatus: string) => {
        if (!confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Error actualizando orden");

            router.refresh(); // Refresh server data
        } catch (error) {
            console.error(error);
            alert("Error al actualizar el estado");
        } finally {
            setLoading(false);
        }
    };

    if (currentStatus === "CANCELLED" || currentStatus === "DELIVERED") {
        return (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                    Esta orden está finalizada ({currentStatus}) y no se puede modificar.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">Acciones</h3>

            <div className="space-y-2">
                {currentStatus === "PENDING" && (
                    <button
                        onClick={() => updateStatus("CONFIRMED")}
                        disabled={loading}
                        className="w-full btn py-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        Confirmar Pedido
                    </button>
                )}

                {currentStatus === "CONFIRMED" && (
                    <button
                        onClick={() => updateStatus("PREPARING")}
                        disabled={loading}
                        className="w-full btn py-2 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Package className="w-4 h-4" />}
                        Empezar a Preparar
                    </button>
                )}

                {(currentStatus === "PREPARING" || currentStatus === "READY") && (
                    <button
                        onClick={() => updateStatus("IN_DELIVERY")}
                        disabled={loading}
                        className="w-full btn py-2 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        Enviar Pedido
                    </button>
                )}

                {currentStatus === "IN_DELIVERY" && (
                    <button
                        onClick={() => updateStatus("DELIVERED")}
                        disabled={loading}
                        className="w-full btn py-2 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        Marcar como Entregado
                    </button>
                )}

                <div className="pt-4 border-t mt-4">
                    <button
                        onClick={() => updateStatus("CANCELLED")}
                        disabled={loading}
                        className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancelar Pedido
                    </button>
                </div>
            </div>
        </div>
    );
}
