// OPS Moderación Page - Gestión de Listings del Marketplace
"use client";

import { useState, useEffect } from "react";
import {
    Shield,
    Search,
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    EyeOff,
    Tag,
    Image as ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
    Weight,
    Ruler,
    Package,
    AlertTriangle,
    Clock,
} from "lucide-react";
import { formatPrice } from "@/lib/delivery";

interface ListingMod {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    condition: string;
    weightKg: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
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
    // Detail modal
    const [selectedListing, setSelectedListing] = useState<ListingMod | null>(null);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);
    // Rejection modal
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

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
            if (selectedListing?.id === id) {
                setSelectedListing((prev) => prev ? { ...prev, isActive: !currentStatus } : null);
            }
        } catch (error) {
            console.error("Error updating listing:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectingId || !rejectReason.trim()) return;
        setActionLoading(rejectingId);
        try {
            await fetch(`/api/admin/listings/${rejectingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: false, rejectionReason: rejectReason.trim() }),
            });
            setRejectingId(null);
            setRejectReason("");
            fetchListings();
            if (selectedListing?.id === rejectingId) {
                setSelectedListing((prev) => prev ? { ...prev, isActive: false } : null);
            }
        } catch (error) {
            console.error("Error rejecting listing:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const openDetail = (listing: ListingMod) => {
        setSelectedListing(listing);
        setCurrentImageIdx(0);
    };

    const totalActive = listings.filter((l) => l.isActive).length;
    const totalPaused = listings.filter((l) => !l.isActive).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Moderación de Listings</h1>
                    <p className="text-slate-500 text-sm">{listings.length} listings en el marketplace</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Eye className="w-4 h-4" />
                        {totalActive} activas
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <EyeOff className="w-4 h-4" />
                        {totalPaused} pausadas
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
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
                    <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
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
                                    <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
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
                                                    <button
                                                        onClick={() => openDetail(listing)}
                                                        className="font-bold text-gray-900 text-sm truncate max-w-[200px] block hover:text-red-500 transition-colors text-left"
                                                    >
                                                        {listing.title}
                                                    </button>
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
                                            <span className="font-bold text-gray-900">{formatPrice(listing.price)}</span>
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
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => openDetail(listing)}
                                                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
                                                >
                                                    Ver
                                                </button>
                                                {listing.isActive ? (
                                                    <button
                                                        onClick={() => {
                                                            setRejectingId(listing.id);
                                                            setRejectReason("");
                                                        }}
                                                        disabled={actionLoading === listing.id}
                                                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all"
                                                    >
                                                        {actionLoading === listing.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : "Pausar"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleActive(listing.id, listing.isActive)}
                                                        disabled={actionLoading === listing.id}
                                                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-all"
                                                    >
                                                        {actionLoading === listing.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : "Aprobar"}
                                                    </button>
                                                )}
                                            </div>
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
                                <div className="flex items-start gap-3" onClick={() => openDetail(listing)}>
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
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{listing.title}</h3>
                                        <p className="text-xs text-slate-500">{listing.seller.displayName || listing.seller.user.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-red-500 text-sm">{formatPrice(listing.price)}</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${conditionColors[listing.condition] || "bg-slate-100 text-slate-600"}`}>
                                                {conditionLabels[listing.condition] || listing.condition}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-2.5 h-2.5 rounded-full ${listing.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openDetail(listing)}
                                        className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200"
                                    >
                                        Ver Detalle
                                    </button>
                                    {listing.isActive ? (
                                        <button
                                            onClick={() => {
                                                setRejectingId(listing.id);
                                                setRejectReason("");
                                            }}
                                            disabled={actionLoading === listing.id}
                                            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-100"
                                        >
                                            {actionLoading === listing.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : "Pausar"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => toggleActive(listing.id, listing.isActive)}
                                            disabled={actionLoading === listing.id}
                                            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100"
                                        >
                                            {actionLoading === listing.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : "Aprobar"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100">
                    <Shield className="w-20 h-20 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-900 mb-2">Sin resultados</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay listings que coincidan con los filtros</p>
                </div>
            )}

            {/* ═══ Detail Modal ═══ */}
            {selectedListing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedListing(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                            <h2 className="font-bold text-gray-900 text-lg truncate pr-4">{selectedListing.title}</h2>
                            <button onClick={() => setSelectedListing(null)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Image Gallery */}
                            {selectedListing.images.length > 0 ? (
                                <div className="relative">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <img
                                            src={selectedListing.images[currentImageIdx]?.url}
                                            alt={selectedListing.title}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    {selectedListing.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentImageIdx((prev) => prev === 0 ? selectedListing.images.length - 1 : prev - 1)}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition"
                                            >
                                                <ChevronLeft className="w-5 h-5 text-slate-700" />
                                            </button>
                                            <button
                                                onClick={() => setCurrentImageIdx((prev) => prev === selectedListing.images.length - 1 ? 0 : prev + 1)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition"
                                            >
                                                <ChevronRight className="w-5 h-5 text-slate-700" />
                                            </button>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {selectedListing.images.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIdx(idx)}
                                                        className={`w-2 h-2 rounded-full transition ${idx === currentImageIdx ? "bg-red-500 w-5" : "bg-white/70"}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                                        {currentImageIdx + 1}/{selectedListing.images.length}
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                    <ImageIcon className="w-12 h-12 text-slate-300" />
                                </div>
                            )}

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precio</p>
                                    <p className="text-xl font-bold text-gray-900">{formatPrice(selectedListing.price)}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                                    <p className="text-xl font-bold text-gray-900">{selectedListing.stock} unidades</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Condición</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${conditionColors[selectedListing.condition] || "bg-slate-200 text-slate-600"}`}>
                                        {conditionLabels[selectedListing.condition] || selectedListing.condition}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${selectedListing.isActive ? "text-green-600" : "text-red-500"}`}>
                                        {selectedListing.isActive ? <><Eye className="w-4 h-4" /> Activa</> : <><EyeOff className="w-4 h-4" /> Pausada</>}
                                    </span>
                                </div>
                            </div>

                            {/* Dimensions & Weight */}
                            {(selectedListing.weightKg || selectedListing.lengthCm) && (
                                <div className="bg-blue-50 p-4 rounded-xl space-y-2">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Dimensiones y Peso</p>
                                    <div className="flex flex-wrap gap-4 text-sm text-blue-700">
                                        {selectedListing.weightKg && (
                                            <span className="flex items-center gap-1.5"><Weight className="w-4 h-4" /> {selectedListing.weightKg} kg</span>
                                        )}
                                        {selectedListing.lengthCm && selectedListing.widthCm && selectedListing.heightCm && (
                                            <span className="flex items-center gap-1.5">
                                                <Ruler className="w-4 h-4" />
                                                {selectedListing.lengthCm} × {selectedListing.widthCm} × {selectedListing.heightCm} cm
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción</p>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {selectedListing.description || "Sin descripción"}
                                </p>
                            </div>

                            {/* Seller Info */}
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vendedor</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                        {selectedListing.seller.displayName || "Sin nombre"}
                                    </span>
                                    {selectedListing.seller.isVerified && (
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{selectedListing.seller.user.email}</p>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Publicado: {new Date(selectedListing.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            </div>

                            {/* Category */}
                            {selectedListing.category && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Tag className="w-4 h-4" />
                                    Categoría: <span className="font-medium text-gray-900">{selectedListing.category.name}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2 border-t border-slate-100">
                                {selectedListing.isActive ? (
                                    <button
                                        onClick={() => {
                                            setRejectingId(selectedListing.id);
                                            setRejectReason("");
                                        }}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Pausar / Rechazar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => toggleActive(selectedListing.id, selectedListing.isActive)}
                                        disabled={actionLoading === selectedListing.id}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        {actionLoading === selectedListing.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <><CheckCircle className="w-4 h-4" /> Aprobar Listing</>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedListing(null)}
                                    className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Rejection Modal ═══ */}
            {rejectingId && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setRejectingId(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Pausar Listing</h3>
                                    <p className="text-sm text-slate-500">El vendedor será notificado del motivo</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del rechazo / pausa</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Ej: Imágenes de baja calidad, precio sospechoso, descripción incompleta..."
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-28 text-sm"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim() || actionLoading === rejectingId}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {actionLoading === rejectingId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <><XCircle className="w-4 h-4" /> Confirmar Pausa</>
                                    )}
                                </button>
                                <button
                                    onClick={() => setRejectingId(null)}
                                    className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
