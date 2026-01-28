// Admin Comercios Page - Gestión de Comercios
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Building2,
    Search,
    Eye,
    MapPin,
    Phone,
    Mail,
    CheckCircle,
    XCircle,
    Loader2,
    Package,
    ShoppingCart,
    Store,
    User
} from "lucide-react";

interface Merchant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    isActive: boolean;
    isOpen: boolean;
    isVerified: boolean;
    email: string | null;
    phone: string | null;
    address: string | null;
    category: string | null;
    _count: {
        products: number;
        orders: number;
    };
    owner: {
        firstName: string | null;
        lastName: string | null;
        email: string;
        phone: string | null;
    } | null;
}

export default function ComerciosPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/merchants?${params}`);
            const data = await res.json();
            setMerchants(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching merchants:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, [statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => fetchMerchants(), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const toggleVerified = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            await fetch("/api/admin/merchants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isVerified: !currentStatus })
            });
            fetchMerchants();
        } catch (error) {
            console.error("Error updating merchant:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            await fetch("/api/admin/merchants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: !currentStatus })
            });
            fetchMerchants();
        } catch (error) {
            console.error("Error updating merchant:", error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Comercios</h1>
                <p className="text-slate-600">{merchants.length} comercios registrados</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar comercios..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white md:w-48"
                >
                    <option value="">Todos</option>
                    <option value="verified">Verificados</option>
                    <option value="pending">Pendientes</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                </select>
            </div>

            {/* Merchants Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
            ) : merchants.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {merchants.map((merchant) => (
                        <div key={merchant.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {merchant.image ? (
                                            <Image src={merchant.image} alt={merchant.name} width={48} height={48} className="object-cover" />
                                        ) : (
                                            <Store className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 truncate">{merchant.name}</h3>
                                            {merchant.isVerified && (
                                                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{merchant.category || "Sin categoría"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                                <div className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1 text-slate-600">
                                        <Package className="w-4 h-4" />
                                        <span className="font-bold">{merchant._count.products}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Productos</p>
                                </div>
                                <div className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1 text-slate-600">
                                        <ShoppingCart className="w-4 h-4" />
                                        <span className="font-bold">{merchant._count.orders}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Pedidos</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-3 space-y-2 text-sm border-b border-slate-100">
                                {merchant.owner && (
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="truncate">{merchant.owner.firstName} {merchant.owner.lastName}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-1 pl-6">
                                    {merchant.email && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="truncate">{merchant.email}</span>
                                        </div>
                                    )}
                                    {merchant.phone && (
                                        <div className="flex items-center gap-2 text-slate-600" title="Teléfono del Negocio">
                                            <Phone className="w-3.5 h-3.5 text-blue-400" />
                                            <span>{merchant.phone} <span className="text-[10px] text-slate-400">(Negocio)</span></span>
                                        </div>
                                    )}
                                    {merchant.owner?.phone && (
                                        <div className="flex items-center gap-2 text-slate-600" title="Teléfono Personal">
                                            <Phone className="w-3.5 h-3.5 text-green-400" />
                                            <span>{merchant.owner.phone} <span className="text-[10px] text-slate-400">(Personal)</span></span>
                                        </div>
                                    )}
                                </div>
                                {merchant.address && (
                                    <div className="flex items-center gap-2 text-slate-600 pl-6 border-t pt-1 mt-1">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate">{merchant.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-3 flex gap-2">
                                <button
                                    onClick={() => toggleVerified(merchant.id, merchant.isVerified)}
                                    disabled={actionLoading === merchant.id}
                                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition flex items-center justify-center gap-1 ${merchant.isVerified
                                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {actionLoading === merchant.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            {merchant.isVerified ? "Verificado" : "Verificar"}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => toggleActive(merchant.id, merchant.isActive)}
                                    disabled={actionLoading === merchant.id}
                                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition flex items-center justify-center gap-1 ${merchant.isActive
                                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                                        : "bg-red-50 text-red-600 hover:bg-red-100"
                                        }`}
                                >
                                    {merchant.isActive ? (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            Activo
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Inactivo
                                        </>
                                    )}
                                </button>
                            </div>
                            {/* View Detail Link */}
                            <div className="px-3 pb-3">
                                <Link
                                    href={`/ops/comercios/${merchant.id}`}
                                    className="block w-full text-center py-2 text-sm rounded-lg font-medium bg-[#e60012] text-white hover:bg-[#c5000f] transition"
                                >
                                    Ver Perfil Completo
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                    <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay comercios</h3>
                    <p className="text-slate-500">No se encontraron comercios con los filtros aplicados</p>
                </div>
            )}
        </div>
    );
}
