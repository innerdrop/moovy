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
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-moovy mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando comercios...</p>
                </div>
            ) : merchants.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {merchants.map((merchant) => (
                        <div key={merchant.id} className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
                            {/* Header Section */}
                            <div className="p-5 border-b border-slate-50 flex items-start gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                    {merchant.image ? (
                                        <Image src={merchant.image} alt={merchant.name} width={64} height={64} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="w-8 h-8 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <h3 className="font-black text-navy text-lg truncate leading-tight">{merchant.name}</h3>
                                        {merchant.isVerified && (
                                            <div className="bg-blue-500 rounded-full p-0.5 flex-shrink-0 shadow-sm shadow-blue-200">
                                                <CheckCircle className="w-3 h-3 text-white fill-current" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">
                                        {merchant.category || "General"}
                                    </span>
                                </div>
                                <div className={`w-3 h-3 rounded-full border-2 ${merchant.isActive ? 'bg-green-500 border-green-100 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300 border-slate-100'}`} />
                            </div>

                            {/* Stats Dashboard */}
                            <div className="grid grid-cols-2 gap-px bg-slate-50 border-b border-slate-50">
                                <div className="bg-white p-4 text-center group-hover:bg-slate-50/50 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Productos</p>
                                    <div className="flex items-center justify-center gap-1.5 font-black text-navy text-xl">
                                        <Package className="w-5 h-5 text-moovy/20" />
                                        {merchant._count.products}
                                    </div>
                                </div>
                                <div className="bg-white p-4 text-center group-hover:bg-slate-50/50 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedidos</p>
                                    <div className="flex items-center justify-center gap-1.5 font-black text-navy text-xl">
                                        <ShoppingCart className="w-5 h-5 text-moovy/20" />
                                        {merchant._count.orders}
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-5 flex-1 space-y-4">
                                {/* Owner */}
                                {merchant.owner && (
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-navy/5 border border-navy/5">
                                        <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-black text-xs shadow-sm">
                                            {merchant.owner.firstName?.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-navy/40 uppercase tracking-widest leading-none mb-1">Dueño</p>
                                            <p className="font-bold text-navy text-sm truncate">{merchant.owner.firstName} {merchant.owner.lastName}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Details */}
                                <div className="space-y-3 px-1">
                                    {merchant.email && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <span className="text-xs font-bold truncate">{merchant.email}</span>
                                        </div>
                                    )}
                                    {merchant.phone && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-3.5 h-3.5 text-green-500" />
                                            </div>
                                            <span className="text-xs font-bold">{merchant.phone}</span>
                                        </div>
                                    )}
                                    {merchant.address && (
                                        <div className="flex items-start gap-3 text-slate-600">
                                            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                            </div>
                                            <span className="text-xs font-bold line-clamp-2 leading-relaxed">{merchant.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-5 pt-0 mt-auto">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <button
                                        onClick={() => toggleVerified(merchant.id, merchant.isVerified)}
                                        disabled={actionLoading === merchant.id}
                                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${merchant.isVerified
                                                ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                                : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                            }`}
                                    >
                                        {actionLoading === merchant.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                        ) : merchant.isVerified ? "Verificado" : "Verificar"}
                                    </button>
                                    <button
                                        onClick={() => toggleActive(merchant.id, merchant.isActive)}
                                        disabled={actionLoading === merchant.id}
                                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${merchant.isActive
                                                ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                                                : "bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                                            }`}
                                    >
                                        {actionLoading === merchant.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                        ) : merchant.isActive ? "Activo" : "Inactivo"}
                                    </button>
                                </div>
                                <Link
                                    href={`/ops/comercios/${merchant.id}`}
                                    className="block w-full text-center py-3 bg-navy text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-navy/10 active:scale-95"
                                >
                                    Abrir Panel
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100">
                    <Building2 className="w-20 h-20 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-navy mb-2">Sin resultados</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Prueba ajustando los filtros de búsqueda</p>
                </div>
            )}
        </div>
    );
}
