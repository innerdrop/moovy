"use client";

import { useState, useEffect, useCallback } from "react";
import { Archive, RotateCcw, Eye, Search, Loader2, Trash2, CheckCircle, AlertCircle } from "lucide-react";

interface Backup {
    id: string;
    backupName: string;
    orderNumber: string;
    total: number;
    deletedAt: string;
    deletedBy: string | null;
    orderData?: string;
}

interface PaginationData {
    backups: Backup[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function BackupsPage() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [paginationData, setPaginationData] = useState<PaginationData | null>(null);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [parsedOrderData, setParsedOrderData] = useState<any>(null);
    const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((text: string, type: "success" | "error") => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg(null), 3000);
    }, []);

    // Fetch backups
    useEffect(() => {
        fetchBackups();
    }, [page, search]);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20"
            });
            if (search) params.append("search", search);

            const res = await fetch(`/api/admin/backups?${params}`);
            if (!res.ok) throw new Error("Error al cargar backups");

            const data = await res.json();
            setBackups(data.backups);
            setPaginationData(data);
        } catch (error) {
            showToast("Error al cargar copias de seguridad", "error");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDetailClick = (backup: Backup) => {
        setSelectedBackup(backup);
        try {
            const parsed = JSON.parse(backup.orderData || "{}");
            setParsedOrderData(parsed);
        } catch (e) {
            setParsedOrderData(null);
        }
        setShowDetailModal(true);
    };

    const handleRestoreClick = (backup: Backup) => {
        setSelectedBackup(backup);
        setShowRestoreModal(true);
    };

    const confirmRestore = async () => {
        if (!selectedBackup) return;

        try {
            setRestoreLoading(true);
            const res = await fetch("/api/admin/backups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ backupId: selectedBackup.id })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al restaurar");
            }

            showToast("Pedido restaurado exitosamente", "success");
            setShowRestoreModal(false);
            setSelectedBackup(null);
            setPage(1);
            await fetchBackups();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al restaurar", "error");
        } finally {
            setRestoreLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS"
        }).format(price);
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toastMsg && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold text-white ${toastMsg.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
                    {toastMsg.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {toastMsg.text}
                </div>
            )}
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Archive className="w-8 h-8" />
                    Copias de Seguridad
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                    Total: {paginationData?.total || 0} copias
                </p>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de backup o número de pedido..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    </div>
                ) : backups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <Archive className="w-12 h-12 mb-3 opacity-50" />
                        <p>No hay copias de seguridad</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        Número de Pedido
                                    </th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        Eliminado Por
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {backups.map((backup) => (
                                    <tr key={backup.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                                            {backup.backupName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {backup.orderNumber || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900 font-semibold text-right">
                                            {backup.total ? formatPrice(backup.total) : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            <span className="font-medium text-slate-900">
                                                {backup.deletedBy || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {formatDate(backup.deletedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDetailClick(backup)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
                                                    title="Ver Detalle"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRestoreClick(backup)}
                                                    className="p-2 hover:bg-green-50 rounded-lg transition text-green-600 hover:text-green-700"
                                                    title="Restaurar"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {paginationData && paginationData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Página {paginationData.page} de {paginationData.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(Math.min(paginationData.totalPages, page + 1))}
                            disabled={page === paginationData.totalPages}
                            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedBackup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                Detalle de Copia: {selectedBackup.backupName}
                            </h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {parsedOrderData ? (
                                <>
                                    {/* Order Header */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                Número de Pedido
                                            </p>
                                            <p className="text-lg font-bold text-slate-900">
                                                {parsedOrderData.orderNumber}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                Estado
                                            </p>
                                            <p className="text-lg font-bold text-slate-900">
                                                {parsedOrderData.status}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                Fecha
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                {formatDate(parsedOrderData.createdAt)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                Método de Pago
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                {parsedOrderData.paymentMethod || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="border-t border-slate-200 pt-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
                                            Cliente
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-slate-900">
                                                {parsedOrderData.user?.name}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {parsedOrderData.user?.email}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {parsedOrderData.user?.phone}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    {parsedOrderData.items && parsedOrderData.items.length > 0 && (
                                        <div className="border-t border-slate-200 pt-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
                                                Productos
                                            </h3>
                                            <div className="space-y-2">
                                                {parsedOrderData.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-slate-700">
                                                            {item.name} x{item.quantity}
                                                        </span>
                                                        <span className="font-medium text-slate-900">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Address */}
                                    {parsedOrderData.address && (
                                        <div className="border-t border-slate-200 pt-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
                                                Dirección de Entrega
                                            </h3>
                                            <p className="text-sm text-slate-700">
                                                {parsedOrderData.address.street} {parsedOrderData.address.number}
                                                {parsedOrderData.address.apartment ? ` - ${parsedOrderData.address.apartment}` : ""}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {parsedOrderData.address.neighborhood}, {parsedOrderData.address.city}
                                            </p>
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div className="border-t border-slate-200 pt-6 space-y-2 bg-slate-50 -mx-6 -mb-6 px-6 py-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-700">Subtotal:</span>
                                            <span className="font-medium text-slate-900">
                                                {formatPrice(parsedOrderData.subtotal || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-700">Envío:</span>
                                            <span className="font-medium text-slate-900">
                                                {formatPrice(parsedOrderData.deliveryFee || 0)}
                                            </span>
                                        </div>
                                        {parsedOrderData.discount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-700">Descuento:</span>
                                                <span className="font-medium text-green-600">
                                                    -{formatPrice(parsedOrderData.discount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t border-slate-200 pt-2 flex justify-between">
                                            <span className="font-bold text-slate-900">Total:</span>
                                            <span className="font-bold text-lg text-slate-900">
                                                {formatPrice(parsedOrderData.total)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    No se pudo parsear los datos del pedido
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Confirmation Modal */}
            {showRestoreModal && selectedBackup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-green-600" />
                                Restaurar Copia
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-slate-700">
                                ¿Está seguro de que desea restaurar el pedido{" "}
                                <span className="font-bold text-slate-900">
                                    {selectedBackup.orderNumber}
                                </span>
                                ?
                            </p>
                            <p className="text-sm text-slate-600">
                                El pedido volverá a estar disponible y la copia de seguridad será eliminada.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRestoreModal(false)}
                                disabled={restoreLoading}
                                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRestore}
                                disabled={restoreLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition"
                            >
                                {restoreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Restaurar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
