// Admin Comercios Page - Gestión de Comercios
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UploadImage from "@/components/ui/UploadImage";
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

            {/* Merchants Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-moovy mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sincronizando comercios...</p>
                </div>
            ) : merchants.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="w-10 px-4 py-3">
                                        <button
                                            onClick={() => {
                                                const pageIds = merchants.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(m => m.id);
                                                const allSelected = pageIds.every(id => selectedMerchants.includes(id));
                                                setSelectedMerchants(allSelected ? selectedMerchants.filter(id => !pageIds.includes(id)) : [...new Set([...selectedMerchants, ...pageIds])]);
                                            }}
                                            className="w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center hover:border-blue-400 transition"
                                        >
                                            {merchants.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).every(m => selectedMerchants.includes(m.id)) && merchants.length > 0 && (
                                                <Check className="w-3 h-3 text-blue-500" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comercio</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categoría</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                    <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Productos</th>
                                    <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pedidos</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {merchants.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((merchant) => (
                                    <tr key={merchant.id} className={`hover:bg-gray-50/50 transition ${
                                        isPending(merchant) ? "bg-amber-50/30" : merchant.approvalStatus === "REJECTED" ? "bg-red-50/20" : ""
                                    }`}>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleMerchantSelection(merchant.id)}
                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedMerchants.includes(merchant.id) ? "bg-blue-500 border-blue-500" : "border-gray-300 hover:border-blue-400"}`}
                                            >
                                                {selectedMerchants.includes(merchant.id) && <Check className="w-3 h-3 text-white" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                                                    {merchant.image ? (
                                                        <UploadImage src={merchant.image} alt={merchant.name} width={40} height={40} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-bold text-gray-900 text-sm truncate">{merchant.name}</p>
                                                        {merchant.isVerified && (
                                                            <div className="bg-blue-500 rounded-full p-0.5 flex-shrink-0">
                                                                <CheckCircle className="w-2.5 h-2.5 text-white fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate">{merchant.email || "—"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {merchant.category || "General"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                {getApprovalBadge(merchant)}
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${merchant.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                                                    <span className="text-[10px] text-gray-400 font-medium">{merchant.isActive ? "Activo" : "Inactivo"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-bold text-gray-900">{merchant._count.products}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-bold text-gray-900">{merchant._count.orders}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-0.5">
                                                {merchant.phone && (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3 text-gray-300" />
                                                        {merchant.phone}
                                                    </p>
                                                )}
                                                {merchant.address && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate max-w-[200px]">
                                                        <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                                        {merchant.address}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {isPending(merchant) ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(merchant.id)}
                                                            disabled={actionLoading === merchant.id}
                                                            className="p-2 hover:bg-green-50 rounded-lg transition text-green-600"
                                                            title="Aprobar"
                                                        >
                                                            {actionLoading === merchant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectModal({ merchantId: merchant.id, merchantName: merchant.name })}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
                                                            title="Rechazar"
                                                        >
                                                            <ShieldX className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => toggleVerified(merchant.id, merchant.isVerified)}
                                                            disabled={actionLoading === merchant.id}
                                                            className={`p-2 rounded-lg transition ${merchant.isVerified ? "text-blue-600 hover:bg-blue-50" : "text-gray-400 hover:bg-gray-50"}`}
                                                            title={merchant.isVerified ? "Quitar verificación" : "Verificar"}
                                                        >
                                                            {actionLoading === merchant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleActive(merchant.id, merchant.isActive)}
                                                            disabled={actionLoading === merchant.id}
                                                            className={`p-2 rounded-lg transition ${merchant.isActive ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`}
                                                            title={merchant.isActive ? "Desactivar" : "Activar"}
                                                        >
                                                            {actionLoading === merchant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : merchant.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/ops/comercios/${merchant.id}`}
                                                    className="p-2 hover:bg-slate-50 rounded-lg transition text-slate-400 hover:text-gray-900"
                                                    title="Ver panel"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {merchants.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((merchant) => (
                            <div key={merchant.id} className={`bg-white rounded-xl shadow-sm border p-4 space-y-3 ${
                                isPending(merchant) ? "border-amber-200" : merchant.approvalStatus === "REJECTED" ? "border-red-200" : "border-gray-100"
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                                        {merchant.image ? (
                                            <UploadImage src={merchant.image} alt={merchant.name} width={48} height={48} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="w-6 h-6 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-bold text-gray-900 text-sm truncate">{merchant.name}</p>
                                            {merchant.isVerified && (
                                                <div className="bg-blue-500 rounded-full p-0.5 flex-shrink-0">
                                                    <CheckCircle className="w-2.5 h-2.5 text-white fill-current" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{merchant.category || "General"}</span>
                                            {getApprovalBadge(merchant)}
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${merchant.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {merchant._count.products} prod.</span>
                                    <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /> {merchant._count.orders} ped.</span>
                                    {merchant.email && <span className="truncate flex items-center gap-1"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {merchant.email}</span>}
                                </div>

                                {merchant.approvalStatus === "REJECTED" && merchant.rejectionReason && (
                                    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{merchant.rejectionReason}</p>
                                )}

                                <div className="flex gap-2">
                                    {isPending(merchant) ? (
                                        <>
                                            <button
                                                onClick={() => handleApprove(merchant.id)}
                                                disabled={actionLoading === merchant.id}
                                                className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100 hover:bg-green-100 flex items-center justify-center gap-1.5"
                                            >
                                                {actionLoading === merchant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => setRejectModal({ merchantId: merchant.id, merchantName: merchant.name })}
                                                className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 flex items-center justify-center gap-1.5"
                                            >
                                                <ShieldX className="w-4 h-4" />
                                                Rechazar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => toggleVerified(merchant.id, merchant.isVerified)}
                                                disabled={actionLoading === merchant.id}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${merchant.isVerified ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}
                                            >
                                                {merchant.isVerified ? "Verificado" : "Verificar"}
                                            </button>
                                            <button
                                                onClick={() => toggleActive(merchant.id, merchant.isActive)}
                                                disabled={actionLoading === merchant.id}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${merchant.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-500 border-red-100"}`}
                                            >
                                                {merchant.isActive ? "Activo" : "Inactivo"}
                                            </button>
                                        </>
                                    )}
                                    <Link
                                        href={`/ops/comercios/${merchant.id}`}
                                        className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:opacity-90"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {Math.ceil(merchants.length / ITEMS_PER_PAGE) > 1 && (
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
