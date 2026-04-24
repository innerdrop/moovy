"use client";

// OPS — Panel de pagos pendientes a drivers y merchants con batches.
// MOOVY NUNCA dispara plata sola. Este panel solo:
//   1. Calcula saldos pendientes derivados de orders DELIVERED
//   2. Permite armar batches (DRAFT) agrupando los saldos
//   3. Genera CSV para transferencia bulk en MP/banco (manual por el admin)
//   4. Marca batches como PAID después de que el admin transfirió afuera
//      (requiere texto "CONFIRMAR PAGO" para evitar clicks accidentales)

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/store/toast";
import {
    Wallet,
    Loader2,
    RefreshCw,
    Download,
    CheckCircle2,
    AlertTriangle,
    Truck,
    Store,
    FileText,
    XCircle,
    Clock,
    CheckCheck,
} from "lucide-react";

type PendingItem = {
    recipientType: "DRIVER" | "MERCHANT";
    recipientId: string;
    recipientName: string;
    bankAccount: string | null;
    cuit: string | null;
    orderCount: number;
    totalAmount: number;
    orderIds: string[];
};

type Batch = {
    id: string;
    batchType: "DRIVER" | "MERCHANT";
    status: "DRAFT" | "GENERATED" | "PAID" | "CANCELLED";
    periodStart: string;
    periodEnd: string;
    totalAmount: number;
    itemCount: number;
    generatedBy: string;
    paidBy: string | null;
    paidAt: string | null;
    notes: string | null;
    createdAt: string;
    _count?: { items: number };
};

type Tab = "DRIVER" | "MERCHANT";

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);

export default function PagosPendientesPage() {
    const [tab, setTab] = useState<Tab>("DRIVER");
    const [pending, setPending] = useState<PendingItem[]>([]);
    const [pendingTotals, setPendingTotals] = useState<{ recipients: number; orders: number; amount: number } | null>(null);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
    const [generating, setGenerating] = useState(false);

    const load = useCallback(async (t: Tab) => {
        setLoading(true);
        try {
            const [pRes, bRes] = await Promise.all([
                fetch(`/api/admin/payouts/pending?type=${t}`),
                fetch(`/api/admin/payouts/batches?type=${t}`),
            ]);
            const [pData, bData] = await Promise.all([pRes.json(), bRes.json()]);
            if (pRes.ok) {
                setPending(pData.items || []);
                setPendingTotals(pData.totals);
            }
            if (bRes.ok) setBatches(bData.batches || []);
            setSelectedRecipients(new Set());
        } catch {
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(tab);
    }, [tab, load]);

    function toggleRecipient(id: string) {
        const next = new Set(selectedRecipients);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedRecipients(next);
    }

    function selectAll() {
        if (selectedRecipients.size === pending.length) {
            setSelectedRecipients(new Set());
        } else {
            setSelectedRecipients(new Set(pending.map((p) => p.recipientId)));
        }
    }

    async function generateBatch() {
        if (selectedRecipients.size === 0) {
            toast.error("Elegí al menos un recipient");
            return;
        }
        const selectedItems = pending.filter((p) => selectedRecipients.has(p.recipientId));
        const withoutBank = selectedItems.filter((i) => !i.bankAccount);
        if (withoutBank.length > 0) {
            toast.error(`${withoutBank.length} recipient(s) no tienen CBU/alias. Cargalo antes.`);
            return;
        }
        const totalToPay = selectedItems.reduce((s, i) => s + i.totalAmount, 0);
        if (!confirm(
            `Vas a crear un batch ${tab} con ${selectedItems.length} items por ${formatARS(totalToPay)}.\n\nEl batch queda en DRAFT. Después tenés que descargar el CSV y hacer la transferencia manual.\n\n¿Continuar?`,
        )) return;

        setGenerating(true);
        try {
            const res = await fetch("/api/admin/payouts/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchType: tab,
                    recipientIds: Array.from(selectedRecipients),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error generando batch");
            toast.success("Batch creado. Descargá el CSV y marcá como PAID cuando confirmes la transferencia.");
            await load(tab);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        } finally {
            setGenerating(false);
        }
    }

    async function downloadCsv(batchId: string) {
        window.location.href = `/api/admin/payouts/batches/${batchId}?format=csv`;
    }

    async function markPaid(batchId: string) {
        const confirmed = window.prompt(
            'Escribí exactamente "CONFIRMAR PAGO" (mayúsculas, sin comillas) para marcar este batch como pagado.\n\nEsto es irreversible. Solo hacelo DESPUÉS de haber transferido la plata fuera de la app.',
        );
        if (confirmed !== "CONFIRMAR PAGO") {
            if (confirmed !== null) toast.error("Confirmación inválida. No se marcó como pagado.");
            return;
        }
        try {
            const res = await fetch(`/api/admin/payouts/batches/${batchId}/mark-paid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmText: "CONFIRMAR PAGO" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            toast.success("Batch marcado como PAID");
            await load(tab);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        }
    }

    async function cancelBatch(batchId: string) {
        if (!confirm("¿Cancelar este batch? Los orders vuelven a aparecer como pendientes.")) return;
        try {
            const res = await fetch(`/api/admin/payouts/batches/${batchId}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            toast.success("Batch cancelado");
            await load(tab);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        }
    }

    const selectedTotal = pending
        .filter((p) => selectedRecipients.has(p.recipientId))
        .reduce((s, p) => s + p.totalAmount, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-[#e60012]" />
                            Pagos Pendientes
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Saldos derivados de orders DELIVERED. MOOVY nunca dispara plata sola — este panel
                            solo registra lo que vos transferís manualmente afuera.
                        </p>
                    </div>
                    <button
                        onClick={() => load(tab)}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 mb-6">
                    {(["DRIVER", "MERCHANT"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${tab === t
                                ? "border-[#e60012] text-[#e60012]"
                                : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {t === "DRIVER" ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                            {t === "DRIVER" ? "Repartidores" : "Comercios"}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                {pendingTotals && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Recipients</p>
                            <p className="text-2xl font-bold text-gray-900">{pendingTotals.recipients}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{pendingTotals.orders}</p>
                        </div>
                        <div className="bg-white rounded-xl border-2 border-[#e60012] p-4">
                            <p className="text-xs text-red-600 uppercase tracking-wide font-semibold">Pendiente total</p>
                            <p className="text-2xl font-bold text-[#e60012]">{formatARS(pendingTotals.amount)}</p>
                        </div>
                    </div>
                )}

                {/* Pendientes */}
                <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-gray-700">Saldos pendientes</h2>
                            {pending.length > 0 && (
                                <button
                                    onClick={selectAll}
                                    className="text-xs text-[#e60012] hover:underline"
                                >
                                    {selectedRecipients.size === pending.length ? "Deseleccionar todos" : "Seleccionar todos"}
                                </button>
                            )}
                        </div>
                        {selectedRecipients.size > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-600">
                                    {selectedRecipients.size} seleccionados · <strong>{formatARS(selectedTotal)}</strong>
                                </span>
                                <button
                                    onClick={generateBatch}
                                    disabled={generating}
                                    className="inline-flex items-center gap-2 bg-[#e60012] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#cc000f] disabled:opacity-60"
                                >
                                    {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                    Generar batch
                                </button>
                            </div>
                        )}
                    </div>
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : pending.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No hay saldos pendientes de {tab === "DRIVER" ? "repartidores" : "comercios"}.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {pending.map((p) => (
                                <li key={p.recipientId} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={selectedRecipients.has(p.recipientId)}
                                        onChange={() => toggleRecipient(p.recipientId)}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{p.recipientName}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                                            <span>{p.orderCount} orders</span>
                                            {p.cuit && <span>CUIT: {p.cuit}</span>}
                                            {p.bankAccount ? (
                                                <span className="text-gray-500">CBU/Alias: {p.bankAccount.substring(0, 8)}…</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Sin CBU cargado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{formatARS(p.totalAmount)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Batches existentes */}
                <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700">Batches ({tab})</h2>
                    </div>
                    {batches.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Todavía no hay batches para {tab === "DRIVER" ? "repartidores" : "comercios"}.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {batches.map((b) => (
                                <li key={b.id} className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-mono text-xs text-gray-500">#{b.id.substring(0, 8)}</span>
                                                <StatusChip status={b.status} />
                                                <span className="text-xs text-gray-500">
                                                    {b._count?.items ?? b.itemCount} items
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(b.createdAt).toLocaleString("es-AR")}
                                                </span>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">{formatARS(b.totalAmount)}</p>
                                            {b.paidAt && (
                                                <p className="text-xs text-green-700 mt-1">
                                                    Marcado PAID el {new Date(b.paidAt).toLocaleString("es-AR")}
                                                </p>
                                            )}
                                            {b.notes && (
                                                <p className="text-xs text-gray-500 italic mt-1">&ldquo;{b.notes}&rdquo;</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => downloadCsv(b.id)}
                                                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                                                title="Descargar CSV"
                                            >
                                                <Download className="w-3 h-3" />
                                                CSV
                                            </button>
                                            {(b.status === "DRAFT" || b.status === "GENERATED") && (
                                                <>
                                                    <button
                                                        onClick={() => markPaid(b.id)}
                                                        className="inline-flex items-center gap-1 text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg font-medium"
                                                    >
                                                        <CheckCheck className="w-3 h-3" />
                                                        Marcar PAID
                                                    </button>
                                                    <button
                                                        onClick={() => cancelBatch(b.id)}
                                                        className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 hover:bg-red-50 px-3 py-1.5 rounded-lg text-red-600"
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        Cancelar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

function StatusChip({ status }: { status: Batch["status"] }) {
    const map = {
        DRAFT: { label: "Borrador", color: "bg-gray-100 text-gray-700", Icon: Clock },
        GENERATED: { label: "CSV generado", color: "bg-blue-100 text-blue-700", Icon: FileText },
        PAID: { label: "Pagado", color: "bg-green-100 text-green-700", Icon: CheckCircle2 },
        CANCELLED: { label: "Cancelado", color: "bg-gray-200 text-gray-600", Icon: XCircle },
    };
    const { label, color, Icon } = map[status];
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}
