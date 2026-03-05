// OPS Moderación Page - Gestión de Listings del Marketplace
"use client";

import { useState, useEffect } from "react";
import {
    Shield,
    Search,
    CheckCircle,
    XCircle,
    Loader2,
    Package,
    Eye,
    EyeOff,
    User,
    Tag,
    Image as ImageIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/delivery";

interface ListingMod {
    id: string;
    title: string;
    price: number;
    stock: number;
    condition: string;
    isActive: boolean;
    createdAt: string;
    seller: {
        id: string;
        displayName: string | null;
        isVerified: boolean;
        user: { email: string };
    };
    images: { url: string }[];
    category: { name: string } | null;
}

const conditionLabels: Record<string, string> = {
    NUEVO: "Nuevo",
    USADO: "Usado",
    REACONDICIONADO: "Reacondicionado",
};

const conditionColors: Record<string, string> = {
    NUEVO: "bg-green-100 text-green-700",
    USADO: "bg-amber-100 text-amber-700",
    REACONDICIONADO: "bg-blue-100 text-blue-700",
};

export default function ModeracionPage() {
    const [listings, setListings] = useState<ListingMod[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [conditionFilter, setConditionFilter] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);
            if (conditionFilter) params.set("condition", conditionFilter);

            const res = await fetch(`/api/admin/listings?${params}`);
            const data = await res.json();
            setListings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [statusFilter, conditionFilter]);

    useEffect(() => {
        const timer = setTimeout(() => fetchListings(), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const toggleActive = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            await fetch(`/api/admin/listings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            fetchListings();
        } catch (error) {
            console.error("Error updating listing:", error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Moderación de Listings</h1>
                <p className="text-slate-600">{listings.length} listings en el marketplace</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título o vendedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white md:w-40"
                >
                    <option value="">Todos</option>
                    <option value="active">Activas</option>
                    <option value="inactive">Pausadas</option>
                </select>
                <select
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white md:w-48"
                >
                    <option value="">Todas las condiciones</option>
                    <option value="NUEVO">Nuevo</option>
                    <option value="USADO">Usado</option>
                    <option value="REACONDICIONADO">Reacondicionado</option>
                </select>
            </div>

            {/* Listings Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-moovy mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando listings...</p>
                </div>
            ) : listings.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Condición</th>
                                    <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                    <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map((listing) => (
                                    <tr key={listing.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                                                    {listing.images[0] ? (
                                                        <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-5 h-5 text-slate-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-navy text-sm truncate max-w-[200px]">{listing.title}</p>
                                                    {listing.category && (
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{listing.category.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-700">
                                                    {listing.seller.displayName || listing.seller.user.email}
                                                </span>
                                                {listing.seller.isVerified && (
                                                    <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-bold text-navy">{formatPrice(listing.price)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${conditionColors[listing.condition] || "bg-slate-100 text-slate-600"}`}>
                                                {conditionLabels[listing.condition] || listing.condition}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${listing.isActive
                                                ? "bg-green-50 text-green-600"
                                                : "bg-red-50 text-red-500"
                                                }`}>
                                                {listing.isActive ? (
                                                    <><Eye className="w-3 h-3" /> Activa</>
                                                ) : (
                                                    <><EyeOff className="w-3 h-3" /> Pausada</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => toggleActive(listing.id, listing.isActive)}
                                                disabled={actionLoading === listing.id}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${listing.isActive
                                                    ? "bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                                                    : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                                                    }`}
                                            >
                                                {actionLoading === listing.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : listing.isActive ? "Pausar" : "Aprobar"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {listings.map((listing) => (
                            <div key={listing.id} className="p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                                        {listing.images[0] ? (
                                            <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-navy text-sm truncate">{listing.title}</h3>
                                        <p className="text-xs text-slate-500">{listing.seller.displayName || listing.seller.user.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-moovy text-sm">{formatPrice(listing.price)}</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${conditionColors[listing.condition] || "bg-slate-100 text-slate-600"}`}>
                                                {conditionLabels[listing.condition] || listing.condition}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-2.5 h-2.5 rounded-full ${listing.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                </div>
                                <button
                                    onClick={() => toggleActive(listing.id, listing.isActive)}
                                    disabled={actionLoading === listing.id}
                                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${listing.isActive
                                        ? "bg-red-50 text-red-500 border-red-100"
                                        : "bg-green-50 text-green-600 border-green-100"
                                        }`}
                                >
                                    {actionLoading === listing.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : listing.isActive ? "Pausar Listing" : "Aprobar Listing"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100">
                    <Shield className="w-20 h-20 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-navy mb-2">Sin resultados</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay listings que coincidan con los filtros</p>
                </div>
            )}
        </div>
    );
}
