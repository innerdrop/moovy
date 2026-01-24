"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Package, Navigation, Clock, CheckCircle2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
    id: string;
    orderNumber: string;
    comercio: string; // Merchant name
    direccion: string;
    estado: string;
    total: number;
    merchantId: string;
    createdAt: string;
}

export default function PedidosRepartidorPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<"disponibles" | "activos" | "historial">("activos");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Implement polling or real-time updates here later
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // This API endpoint needs to be created/updated to filter by status and exclusivity
            // For now, let's assume it returns what we need or mock it
            // NOTE: api/driver/orders endpoint might need to be created if not exists, 
            // but assuming it exists from referenced code context or previous steps.
            const res = await fetch(`/api/driver/orders?status=${activeTab}&ts=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId: string) => {
        if (!session?.user) return;

        // Optimistic update or loading state
        const confirm = window.confirm("¿Aceptar este pedido?");
        if (!confirm) return;

        try {
            const res = await fetch(`/api/orders/${orderId}/accept`, {
                method: "POST",
            });

            if (res.ok) {
                alert("¡Pedido aceptado!");
                setActiveTab("activos"); // Switch to active tab
                fetchOrders(); // Refresh
            } else {
                const error = await res.json();
                alert(error.error || "Error al aceptar el pedido");
            }
        } catch (error) {
            console.error("Error accepting order:", error);
            alert("Error de conexión");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/repartidor/dashboard" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <Navigation className="w-6 h-6 rotate-180" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Mis Pedidos</h1>
                </div>

                {/* Tabs */}
                <div className="flex mt-4 p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setActiveTab("disponibles")}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "disponibles"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Disponibles
                    </button>
                    <button
                        onClick={() => setActiveTab("activos")}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "activos"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Activos
                    </button>
                    <button
                        onClick={() => setActiveTab("historial")}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "historial"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-full"></div>
                        </div>
                    ))
                ) : orders.length > 0 ? (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900">{order.comercio}</h3>
                                    <p className="text-xs text-gray-500">#{order.orderNumber}</p>
                                </div>
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                    ${order.total.toLocaleString("es-AR")}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{order.direccion}</span>
                            </div>

                            <div className="flex gap-2">
                                {activeTab === "disponibles" && (
                                    <button
                                        onClick={() => handleAcceptOrder(order.id)}
                                        className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                                    >
                                        Aceptar Pedido
                                    </button>
                                )}
                                {activeTab === "activos" && (
                                    <div className="flex-1 flex gap-2">
                                        <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition">
                                            Ver Detalles
                                        </button>
                                        <button className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition">
                                            Actualizar
                                        </button>
                                    </div>
                                )}
                                {activeTab === "historial" && (
                                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                                        Ver Comprobante
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No hay pedidos {activeTab}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
