// Admin Comercios Page - Gestión de Comercios
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";
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
    User,
    Download,
    Check,
    X,
    ShieldCheck,
    ShieldX,
    Clock,
    AlertTriangle
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
    approvalStatus: string;
    approvedAt: string | null;
    rejectionReason: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    category: string | null;
    createdAt: string;
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

const ITEMS_PER_PAGE = 20;

export default function ComerciosPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Rejection modal state
    const [rejectModal, setRejectModal] = useState<{ merchantId: string; merchantName: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectLoading, setRejectLoading] = useState(false);

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
        setPage(1);
    }, [statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMerchants();
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleApprove = async (id: string) => {
        const ok = await confirm({ title: "Aprobar comercio", message: "El comercio podrá empezar a operar de inmediato. ¿Confirmar aprobación?", confirmLabel: "Aprobar", variant: "default" });
        if (!ok) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/merchants/${id}/approve`, { method: "PUT" });
            if (res.ok) {
                toast.success("Comercio aprobado exitosamente");
                fetchMerchants();
            }
        } catch (error) {
            toast.error("Error al aprobar comercio");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setRejectLoading(true);
        try {
            const res = await fetch(`/api/admin/merchants/${rejectModal.merchantId}/reject`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason || undefined }),
            });
            if (res.ok) {
                toast.success("Comercio rechazado");
                setRejectModal(null);
                setRejectReason("");
                fetchMerchants();
            }
        } catch (error) {
            console.error("Error rejecting merchant:", error);
        } finally {
            setRejectLoading(false);
        }
    };

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

    const toggleMerchantSelection = (id: string) => {
        setSelectedMerchants(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const bulkVerify = async () => {
        setBulkLoading(true);
        try {
            for (const id of selectedMerchants) {
                await fetch(`/api/admin/merchants/${id}/approve`, { method: "PUT" });
            }
            setSelectedMerchants([]);
            fetchMerchants();
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setBulkLoading(false);
        }
    };

    const bulkSuspend = async () => {
        setBulkLoading(true);
        try {
            for (const id of selectedMerchants) {
                await fetch("/api/admin/merchants", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, isActive: false }),
                });
            }
            setSelectedMerchants([]);
            fetchMerchants();
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setBulkLoading(false);
        }
    };

    const pendingCount = merchants.filter(m => m.approvalStatus === "PENDING" || (!m.approvalStatus && !m.isVerified && !m.isActive)).length;

    const getApprovalBadge = (merchant: Merchant) => {
        const status = merchant.approvalStatus || (merchant.isVerified ? "APPROVED" : "PENDING");
        switch (status) {
            case "APPROVED":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        Aprobado
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <ShieldX className="w-3 h-3" />
                        Rechazado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        Pendiente
                    </span>
                );
        }
    };

    const isPending = (merchant: Merchant) => {
        return merchant.approvalStatus === "PENDING" || (!merchant.approvalStatus && !merchant.isVerified && !merchant.isActive);
    };

    return (
        <div className="space-y-6">
            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn">
                    <ShieldCheck className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-bold text-lg mb-2 text-gray-900">Rechazar comercio</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Vas a rechazar a <strong>{rejectModal.merchantName}</strong>. Se le enviará un email con el motivo.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Motivo del rechazo (opcional pero recomendado)..."
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                            rows={3}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectLoading}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {rejectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                                Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Comercios</h1>
                    <p className="text-gray-600">
                        {merchants.length} comercios registrados
                        {pendingCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''} de aprobación
                            </span>
                        )}
                    </p>
                </div>
                {selectedMerchants.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-500">{selectedMerchants.length} seleccionados</span>
                        <button onClick={bulkVerify} disabled={bulkLoading} className="px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100 hover:bg-green-100 transition flex items-center gap-2">
                            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Aprobar todos
                        </button>
                        <button onClick={bulkSuspend} disabled={bulkLoading} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100 transition flex items-center gap-2">
                            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Suspender todos
                        </button>
                        <button onClick={() => setSelectedMerchants([])} className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-200 transition">
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <a
                        href="/api/ops/export?type=merchants"
                        className="btn-secondary flex items-center gap-2"
                        download
                    >
                        <Download className="w-4 h-4" />
                        CSV
                    </a>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar comercios..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white md:w-48"
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
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-moovy mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sincronizando comercios...</p>
                </div>
            ) : merchants.length > 0 ? (
                <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {merchants
                            .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                            .map((merchant) => (
                        <div key={merchant.id} className={`group bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col relative ${
                            merchant.approvalStatus === "PENDING" || (!merchant.approvalStatus && !merchant.isVerified)
                                ? "border-amber-200 ring-1 ring-amber-100"
                                : merchant.approvalStatus === "REJECTED"
                                    ? "border-red-200"
                                    : "border-gray-100"
                        }`}>
                            {/* Checkbox */}
                            <div className="absolute top-3 right-3 z-10">
                                <button
                                    onClick={() => toggleMerchantSelection(merchant.id)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedMerchants.includes(merchant.id) ? "bg-blue-500 border-blue-500" : "border-gray-300 hover:border-blue-400 bg-white"}`}
                                >
                                    {selectedMerchants.includes(merchant.id) && <Check className="w-3 h-3 text-white" />}
                                </button>
                            </div>

                            {/* Header Section */}
                            <div className="p-5 border-b border-gray-50 flex items-start gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                    {merchant.image ? (
                                        <Image src={merchant.image} alt={merchant.name} width={64} height={64} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <h3 className="font-black text-gray-900 text-lg truncate leading-tight">{merchant.name}</h3>
                                        {merchant.isVerified && (
                                            <div className="bg-blue-500 rounded-full p-0.5 flex-shrink-0 shadow-sm shadow-blue-200">
                                                <CheckCircle className="w-3 h-3 text-white fill-current" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">
                                            {merchant.category || "General"}
                                        </span>
                                        {getApprovalBadge(merchant)}
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full border-2 ${merchant.isActive ? 'bg-green-500 border-green-100 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300 border-gray-100'}`} />
                            </div>

                            {/* Rejection reason */}
                            {merchant.approvalStatus === "REJECTED" && merchant.rejectionReason && (
                                <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Motivo del rechazo</p>
                                    <p className="text-xs text-red-700 line-clamp-2">{merchant.rejectionReason}</p>
                                </div>
                            )}

                            {/* Stats Dashboard */}
                            <div className="grid grid-cols-2 gap-px bg-gray-50 border-b border-gray-50">
                                <div className="bg-white p-4 text-center group-hover:bg-gray-50/50 transition-colors">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Productos</p>
                                    <div className="flex items-center justify-center gap-1.5 font-black text-gray-900 text-xl">
                                        <Package className="w-5 h-5 text-moovy/20" />
                                        {merchant._count.products}
                                    </div>
                                </div>
                                <div className="bg-white p-4 text-center group-hover:bg-gray-50/50 transition-colors">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pedidos</p>
                                    <div className="flex items-center justify-center gap-1.5 font-black text-gray-900 text-xl">
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
                                            <p className="text-[10px] font-black text-gray-900/40 uppercase tracking-widest leading-none mb-1">Dueño</p>
                                            <p className="font-bold text-gray-900 text-sm truncate">{merchant.owner.firstName} {merchant.owner.lastName}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Details */}
                                <div className="space-y-3 px-1">
                                    {merchant.email && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <span className="text-xs font-bold truncate">{merchant.email}</span>
                                        </div>
                                    )}
                                    {merchant.phone && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-3.5 h-3.5 text-green-500" />
                                            </div>
                                            <span className="text-xs font-bold">{merchant.phone}</span>
                                        </div>
                                    )}
                                    {merchant.address && (
                                        <div className="flex items-start gap-3 text-gray-600">
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
                                {/* Approval actions for pending merchants */}
                                {(merchant.approvalStatus === "PENDING" || (!merchant.approvalStatus && !merchant.isVerified && !merchant.isActive)) && (
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <button
                                            onClick={() => handleApprove(merchant.id)}
                                            disabled={actionLoading === merchant.id}
                                            className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border bg-green-50 text-green-600 border-green-200 hover:bg-green-100 flex items-center justify-center gap-1.5"
                                        >
                                            {actionLoading === merchant.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="w-4 h-4" />
                                            )}
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => setRejectModal({ merchantId: merchant.id, merchantName: merchant.name })}
                                            disabled={actionLoading === merchant.id}
                                            className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border bg-red-50 text-red-500 border-red-200 hover:bg-red-100 flex items-center justify-center gap-1.5"
                                        >
                                            <ShieldX className="w-4 h-4" />
                                            Rechazar
                                        </button>
                                    </div>
                                )}

                                {/* Standard actions for approved/rejected merchants */}
                                {merchant.approvalStatus !== "PENDING" && (merchant.approvalStatus || merchant.isVerified || merchant.isActive) && (
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <button
                                            onClick={() => toggleVerified(merchant.id, merchant.isVerified)}
                                            disabled={actionLoading === merchant.id}
                                            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${merchant.isVerified
                                                    ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                                    : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
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
                                )}
                                <Link
                                    href={`/ops/comercios/${merchant.id}`}
                                    className="block w-full text-center py-3 bg-navy text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-navy/10 active:scale-95"
                                >
                                    Abrir Panel
                                </Link>
                            </div>
                        </div>
                    ))}
                    </div>
                    {!loading && merchants.length > 0 && Math.ceil(merchants.length / ITEMS_PER_PAGE) > 1 && (
                        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                            <span className="text-sm text-gray-500">
                                Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, merchants.length)} de {merchants.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm font-medium text-gray-700">{page} / {Math.ceil(merchants.length / ITEMS_PER_PAGE)}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(Math.ceil(merchants.length / ITEMS_PER_PAGE), p + 1))}
                                    disabled={page === Math.ceil(merchants.length / ITEMS_PER_PAGE)}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl p-20 text-center shadow-sm border border-gray-100">
                    <Building2 className="w-20 h-20 text-gray-100 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-900 mb-2">Sin resultados</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Prueba ajustando los filtros de búsqueda</p>
                </div>
            )}
        </div>
    );
}
