"use client";

// OPS — Visor del AuditLog.
// Muestra todas las acciones auditables del sistema (approve, reject, refund,
// document decisions, admin notes, etc.) con filtros combinables por
// action/entityType/entityId/userId/rango de fechas.

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
    FileText,
    Search,
    RefreshCw,
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    Loader2,
    Clock,
} from "lucide-react";
import { toast } from "@/store/toast";

interface AuditLogItem {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    details: string | null;
    createdAt: string;
    user: { id: string; name: string | null; email: string } | null;
}

interface AuditResponse {
    items: AuditLogItem[];
    total: number;
}

// Acciones conocidas (se completa con cualquier otra detectada en el GET).
const KNOWN_ACTIONS: Array<{ value: string; label: string }> = [
    { value: "MERCHANT_APPROVED", label: "Comercio aprobado" },
    { value: "MERCHANT_REJECTED", label: "Comercio rechazado" },
    { value: "DRIVER_APPROVED", label: "Driver aprobado" },
    { value: "DRIVER_REJECTED", label: "Driver rechazado" },
    { value: "MERCHANT_DOCUMENT_APPROVED", label: "Doc merchant aprobado" },
    { value: "MERCHANT_DOCUMENT_REJECTED", label: "Doc merchant rechazado" },
    { value: "MERCHANT_DOCUMENT_RESUBMITTED", label: "Doc merchant reenviado" },
    { value: "DRIVER_DOCUMENT_APPROVED", label: "Doc driver aprobado" },
    { value: "DRIVER_DOCUMENT_REJECTED", label: "Doc driver rechazado" },
    { value: "DRIVER_DOCUMENT_RESUBMITTED", label: "Doc driver reenviado" },
    { value: "DRIVER_CHANGE_REQUEST_CREATED", label: "Cambio doc driver solicitado" },
    { value: "MERCHANT_CHANGE_REQUEST_CREATED", label: "Cambio doc merchant solicitado" },
    { value: "DRIVER_AUTO_SUSPENDED", label: "Driver auto-suspendido" },
    { value: "DRIVER_AUTO_SUSPENDED_BY_EXPIRY", label: "Driver auto-suspendido por vencimiento" },
    { value: "DRIVER_FRAUD_RESET", label: "Reset fraude driver" },
    { value: "PIN_VERIFIED", label: "PIN verificado" },
    { value: "PIN_VERIFICATION_FAIL", label: "PIN incorrecto" },
    { value: "PIN_LOCKED", label: "PIN bloqueado" },
    { value: "PIN_GEOFENCE_FAIL", label: "PIN fuera de zona" },
    { value: "REFUND_PROCESSED", label: "Reembolso" },
    { value: "ORDER_DRIVER_REASSIGNED", label: "Driver reasignado" },
    { value: "USER_SUSPENDED", label: "Usuario suspendido" },
    { value: "USER_UNSUSPENDED", label: "Usuario reactivado" },
    { value: "USER_ARCHIVED", label: "Usuario archivado" },
    { value: "USER_UNARCHIVED", label: "Usuario desarchivado" },
    { value: "ADMIN_USER_DELETED", label: "Usuario eliminado por admin" },
    { value: "USER_DELETED", label: "Usuario eliminado" },
    { value: "USER_RESTORED", label: "Usuario restaurado" },
    { value: "ACCOUNT_DELETION_REQUESTED", label: "Eliminación solicitada" },
    { value: "ACCOUNT_RESURRECTION_BLOCKED", label: "Re-registro bloqueado" },
    { value: "USER_DATA_EXPORTED", label: "Export de datos (ARCO)" },
    { value: "UNLOCK_ACCOUNT", label: "Cuenta desbloqueada" },
    { value: "MERCHANT_COMMISSION_OVERRIDE", label: "Override comisión" },
    { value: "MERCHANT_LOYALTY_TIER_OVERRIDE", label: "Override tier fidelización" },
    { value: "EMAIL_TEMPLATE_CREATED", label: "Plantilla email creada" },
    { value: "EMAIL_TEMPLATE_UPDATED", label: "Plantilla email actualizada" },
    { value: "EXCLUDED_ZONE_CREATED", label: "Zona excluida creada" },
    { value: "EXCLUDED_ZONE_UPDATED", label: "Zona excluida editada" },
    { value: "EXCLUDED_ZONE_DELETED", label: "Zona excluida borrada" },
    { value: "BULK_IMPORT_PRODUCTS", label: "Import masivo de productos" },
    { value: "DATA_EXPORT", label: "Export de datos OPS" },
    { value: "LISTING_DELETE", label: "Listing borrado" },
    { value: "PRODUCT_UPDATE_REJECTED_FIELDS", label: "Update producto parcial" },
    { value: "PRODUCT_DELETE", label: "Producto borrado" },
    { value: "ADMIN_NOTE_CREATED", label: "Nota interna creada" },
    { value: "ADMIN_NOTE_UPDATED", label: "Nota interna editada" },
    { value: "ADMIN_NOTE_DELETED", label: "Nota interna borrada" },
];

const KNOWN_ENTITY_TYPES = [
    "Order",
    "SubOrder",
    "Merchant",
    "Driver",
    "SellerProfile",
    "User",
    "Listing",
    "Product",
    "EmailTemplate",
    "AdminNote",
    "ExcludedZone",
];

const PAGE_SIZE = 50;

function prettyAction(action: string): string {
    const found = KNOWN_ACTIONS.find((a) => a.value === action);
    return found?.label || action;
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function formatDetails(raw: string | null): string {
    if (!raw) return "—";
    try {
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return raw;
    }
}

export default function AuditoriaPage() {
    // Filtros
    const [actionFilter, setActionFilter] = useState("");
    const [entityTypeFilter, setEntityTypeFilter] = useState("");
    const [entityIdFilter, setEntityIdFilter] = useState("");
    const [userIdFilter, setUserIdFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Data
    const [items, setItems] = useState<AuditLogItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0); // 0-indexed
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(true);

    const skip = page * PAGE_SIZE;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (actionFilter) params.set("action", actionFilter);
            if (entityTypeFilter) params.set("entityType", entityTypeFilter);
            if (entityIdFilter.trim()) params.set("entityId", entityIdFilter.trim());
            if (userIdFilter.trim()) params.set("userId", userIdFilter.trim());
            if (dateFrom) params.set("dateFrom", dateFrom);
            if (dateTo) params.set("dateTo", dateTo);
            params.set("take", String(PAGE_SIZE));
            params.set("skip", String(skip));

            const res = await fetch(`/api/admin/audit?${params.toString()}`, {
                cache: "no-store",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error al cargar");
            }
            const data = (await res.json()) as AuditResponse;
            setItems(data.items || []);
            setTotal(data.total || 0);
        } catch (e: any) {
            toast.error(e?.message || "Error al cargar auditoría");
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [actionFilter, entityTypeFilter, entityIdFilter, userIdFilter, dateFrom, dateTo, skip]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleApplyFilters = (e?: React.FormEvent) => {
        e?.preventDefault();
        setPage(0);
        // el useEffect captura el cambio automáticamente porque loadData
        // depende de los filtros. Pero si filter no cambia y solo page=0, forzamos:
        if (page === 0) void loadData();
    };

    const handleClearFilters = () => {
        setActionFilter("");
        setEntityTypeFilter("");
        setEntityIdFilter("");
        setUserIdFilter("");
        setDateFrom("");
        setDateTo("");
        setPage(0);
    };

    const uniqueActions = useMemo(() => {
        const set = new Set(KNOWN_ACTIONS.map((a) => a.value));
        items.forEach((i) => set.add(i.action));
        return Array.from(set).sort();
    }, [items]);

    const hasFilters =
        !!actionFilter ||
        !!entityTypeFilter ||
        entityIdFilter.trim() !== "" ||
        userIdFilter.trim() !== "" ||
        !!dateFrom ||
        !!dateTo;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Auditoría
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Acciones auditables del sistema. Solo lectura.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 min-h-[44px]"
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? "Ocultar filtros" : "Filtros"}
                    </button>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
                        aria-label="Refrescar"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refrescar
                    </button>
                </div>
            </div>

            {/* Filtros */}
            {showFilters && (
                <form
                    onSubmit={handleApplyFilters}
                    className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-sm"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                            <label
                                htmlFor="f-action"
                                className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5"
                            >
                                Acción
                            </label>
                            <select
                                id="f-action"
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                            >
                                <option value="">Todas las acciones</option>
                                {uniqueActions.map((action) => (
                                    <option key={action} value={action}>
                                        {prettyAction(action)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="f-entityType"
                                className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5"
                            >
                                Tipo de entidad
                            </label>
                            <select
                                id="f-entityType"
                                value={entityTypeFilter}
                                onChange={(e) => setEntityTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                {KNOWN_ENTITY_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="f-entityId"
                                className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5"
                            >
                                ID de entidad
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    id="f-entityId"
                                    type="text"
                                    value={entityIdFilter}
                                    onChange={(e) => setEntityIdFilter(e.target.value)}
                                    placeholder="Buscar por ID (parcial)"
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor="f-userId"
                                className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5"
                            >
                                Admin (userId exacto)
                            </label>
                            <input
                                id="f-userId"
                                type="text"
                                value={userIdFilter}
                                onChange={(e) => setUserIdFilter(e.target.value)}
                                placeholder="cuid del admin"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="f-from"
                                className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5"
                            >
                                Desde
                            </label>
                            <input
                                id="f-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="f-to"
                                className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5"
                            >
                                Hasta
                            </label>
                            <input
                                id="f-to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2 flex-wrap">
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 min-h-[44px]"
                            >
                                <X className="w-4 h-4" />
                                Limpiar
                            </button>
                        )}
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#e60012] hover:bg-red-700 text-white text-sm font-bold rounded-lg min-h-[44px]"
                        >
                            Aplicar
                        </button>
                    </div>
                </form>
            )}

            {/* Resultados */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-gray-600">
                        {loading ? (
                            <span className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
                            </span>
                        ) : (
                            <>
                                <span className="font-bold text-gray-900">{total}</span>{" "}
                                {total === 1 ? "evento" : "eventos"}
                                {hasFilters && " con los filtros aplicados"}
                            </>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        Página {page + 1} de {totalPages}
                    </div>
                </div>

                {loading && items.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cargando eventos...
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        {hasFilters
                            ? "No hay eventos con esos filtros."
                            : "No hay eventos registrados todavía."}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">
                                            Fecha
                                        </th>
                                        <th className="text-left px-6 py-3 font-semibold">
                                            Admin
                                        </th>
                                        <th className="text-left px-6 py-3 font-semibold">
                                            Acción
                                        </th>
                                        <th className="text-left px-6 py-3 font-semibold">
                                            Entidad
                                        </th>
                                        <th className="text-right px-6 py-3 font-semibold">
                                            Detalles
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((entry) => {
                                        const isExpanded = expandedId === entry.id;
                                        return (
                                            <Fragment key={entry.id}>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            {formatDate(entry.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="font-medium text-gray-900 truncate max-w-[180px]">
                                                            {entry.user?.name ||
                                                                entry.user?.email.split(
                                                                    "@"
                                                                )[0] ||
                                                                "—"}
                                                        </div>
                                                        <div className="text-xs text-gray-400 truncate max-w-[180px]">
                                                            {entry.user?.email || entry.userId}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                                                            {prettyAction(entry.action)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="text-xs text-gray-600">
                                                            {entry.entityType}
                                                        </div>
                                                        <code className="text-[10px] font-mono text-gray-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                            {entry.entityId}
                                                        </code>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button
                                                            onClick={() =>
                                                                setExpandedId(
                                                                    isExpanded
                                                                        ? null
                                                                        : entry.id
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 text-gray-700 hover:bg-slate-50"
                                                            aria-expanded={isExpanded}
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                                    Ocultar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                                    Ver
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="px-6 pb-4 bg-slate-50"
                                                        >
                                                            <pre className="bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono text-gray-800 whitespace-pre-wrap break-all overflow-auto max-h-80">
                                                                {formatDetails(entry.details)}
                                                            </pre>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {items.map((entry) => {
                                const isExpanded = expandedId === entry.id;
                                return (
                                    <div key={entry.id} className="p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-sm text-gray-900 truncate">
                                                    {prettyAction(entry.action)}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {entry.user?.name ||
                                                        entry.user?.email ||
                                                        entry.userId}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                                                {formatDate(entry.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                                {entry.entityType}
                                            </span>
                                            <code className="text-[10px] font-mono text-gray-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-full">
                                                {entry.entityId}
                                            </code>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setExpandedId(isExpanded ? null : entry.id)
                                            }
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#e60012]"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                    Ocultar detalles
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                    Ver detalles
                                                </>
                                            )}
                                        </button>
                                        {isExpanded && (
                                            <pre className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-gray-800 whitespace-pre-wrap break-all overflow-auto max-h-72">
                                                {formatDetails(entry.details)}
                                            </pre>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Paginación */}
                {items.length > 0 && (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0 || loading}
                            className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold rounded-lg min-h-[44px]"
                        >
                            Anterior
                        </button>
                        <span className="text-xs text-gray-500">
                            {skip + 1}–{Math.min(skip + items.length, total)} de {total}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={
                                loading ||
                                items.length < PAGE_SIZE ||
                                skip + items.length >= total
                            }
                            className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold rounded-lg min-h-[44px]"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
