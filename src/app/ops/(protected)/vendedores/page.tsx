// OPS Vendedores Page - Gestión de Vendedores Individuales
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    UserCheck,
    Search,
    CheckCircle,
    XCircle,
    Loader2,
    Package,
    ShoppingCart,
    Star,
    User,
    Mail,
    Shield,
} from "lucide-react";

interface Seller {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    isActive: boolean;
    isVerified: boolean;
    totalSales: number;
    rating: number | null;
    commissionRate: number;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
        phone: string | null;
    };
    _count: {
        listings: number;
        subOrders: number;
    };
}

const ITEMS_PER_PAGE = 20;

export default function VendedoresPage() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const fetchSellers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/sellers?${params}`);
            const data = await res.json();
            setSellers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching sellers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchSellers();
    }, [statusFilter]);

    useEffect(() => {
        setPage(1);
        const timer = setTimeout(() => fetchSellers(), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const toggleVerified = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            await fetch(`/api/admin/sellers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isVerified: !currentStatus }),
            });
            fetchSellers();
        } catch (error) {
            console.error("Error updating seller:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            await fetch(`/api/admin/sellers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            fetchSellers();
        } catch (error) {
            console.error("Error updating seller:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const totalPages = Math.ceil(sellers.length / ITEMS_PER_PAGE);
    const paginatedSellers = sellers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Vendedores</h1>
                <p className="text-slate-600">{sellers.length} vendedores registrados</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar vendedores..."
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
                    <option value="inactive">Suspendidos</option>
                </select>
            </div>

            {/* Sellers Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-moovy mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando vendedores...</p>
                </div>
            ) : sellers.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedSellers.map((seller) => (
                            <div key={seller.id} className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
                                {/* Header */}
                                <div className="p-5 border-b border-slate-50 flex items-start gap-4">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-emerald-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        {seller.avatar ? (
                                            <img src={seller.avatar} alt={seller.displayName || ""} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-8 h-8 text-emerald-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <h3 className="font-black text-gray-900 text-lg truncate leading-tight">
                                                {seller.displayName || seller.user.name || "Sin nombre"}
                                            </h3>
                                            {seller.isVerified && (
                                                <div className="bg-blue-500 rounded-full p-0.5 flex-shrink-0 shadow-sm shadow-blue-200">
                                                    <CheckCircle className="w-3 h-3 text-white fill-current" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">
                                            Vendedor Individual
                                        </span>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full border-2 ${seller.isActive ? 'bg-green-500 border-green-100 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300 border-slate-100'}`} />
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-px bg-slate-50 border-b border-slate-50">
                                    <div className="bg-white p-3 text-center group-hover:bg-slate-50/50 transition-colors">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Listings</p>
                                        <div className="flex items-center justify-center gap-1 font-black text-gray-900 text-lg">
                                            <Package className="w-4 h-4 text-moovy/20" />
                                            {seller._count.listings}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 text-center group-hover:bg-slate-50/50 transition-colors">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas</p>
                                        <div className="flex items-center justify-center gap-1 font-black text-gray-900 text-lg">
                                            <ShoppingCart className="w-4 h-4 text-moovy/20" />
                                            {seller.totalSales}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 text-center group-hover:bg-slate-50/50 transition-colors">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                                        <div className="flex items-center justify-center gap-1 font-black text-gray-900 text-lg">
                                            <Star className="w-4 h-4 text-amber-400" />
                                            {seller.rating?.toFixed(1) || "—"}
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-5 flex-1 space-y-3">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-bold truncate">{seller.user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-3.5 h-3.5 text-purple-500" />
                                        </div>
                                        <span className="text-xs font-bold">Comisión: {seller.commissionRate}%</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-5 pt-0 mt-auto">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => toggleVerified(seller.id, seller.isVerified)}
                                            disabled={actionLoading === seller.id}
                                            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${seller.isVerified
                                                ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                                : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                                }`}
                                        >
                                            {actionLoading === seller.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : seller.isVerified ? "Verificado" : "Verificar"}
                                        </button>
                                        <button
                                            onClick={() => toggleActive(seller.id, seller.isActive)}
                                            disabled={actionLoading === seller.id}
                                            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${seller.isActive
                                                ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                                                : "bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                                                }`}
                                        >
                                            {actionLoading === seller.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : seller.isActive ? "Activo" : "Suspendido"}
                                        </button>
                                    </div>
                                    <Link
                                        href={`/ops/vendedores/${seller.id}`}
                                        className="block w-full text-center py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg shadow-slate-800/10 active:scale-95 mt-3"
                                    >
                                        Abrir Panel
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                            <span className="text-sm text-gray-500">
                                Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, sellers.length)} de {sellers.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                                <span className="text-sm font-medium text-gray-700">{page} / {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100">
                    <UserCheck className="w-20 h-20 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-900 mb-2">Sin resultados</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Prueba ajustando los filtros de búsqueda</p>
                </div>
            )}
        </div>
    );
}
