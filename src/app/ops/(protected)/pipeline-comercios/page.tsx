"use client";

// OPS — Pipeline/kanban de onboarding de comercios.
// No requiere schema nuevo: todo se deriva de Merchant.approvalStatus + docs + timestamps.
// Columnas: Pendiente docs → En revisión → Aprobados (30d) → Rechazados (30d).

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    GitBranch,
    Loader2,
    RefreshCw,
    Store,
    Phone,
    Mail,
    FileCheck2,
    FileClock,
    CheckCircle2,
    XCircle,
    ChevronRight,
} from "lucide-react";

type OwnerInfo = { id: string; email: string; name: string | null; phone: string | null };
type CardMerchant = {
    id: string;
    businessName: string;
    category: string | null;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string | null;
    rejectionReason?: string | null;
    owner: OwnerInfo;
    constanciaAfipUrl?: string | null;
    habilitacionMunicipalUrl?: string | null;
    registroSanitarioUrl?: string | null;
    cuit?: string | null;
    bankAccount?: string | null;
};

type PipelineData = {
    pendiente_docs: CardMerchant[];
    en_revision: CardMerchant[];
    aprobados: CardMerchant[];
    rechazados: CardMerchant[];
};

const COLUMNS: Array<{
    key: keyof PipelineData;
    title: string;
    color: string;
    Icon: any;
    desc: string;
}> = [
        {
            key: "pendiente_docs",
            title: "Pendiente docs",
            color: "bg-gray-100 border-gray-300",
            Icon: FileClock,
            desc: "Se registraron pero no cargaron todos los docs fiscales.",
        },
        {
            key: "en_revision",
            title: "En revisión",
            color: "bg-amber-50 border-amber-300",
            Icon: FileCheck2,
            desc: "Docs cargados. Listo para aprobación por admin.",
        },
        {
            key: "aprobados",
            title: "Aprobados (30d)",
            color: "bg-green-50 border-green-300",
            Icon: CheckCircle2,
            desc: "Operando. Merchants aprobados en los últimos 30 días.",
        },
        {
            key: "rechazados",
            title: "Rechazados (30d)",
            color: "bg-red-50 border-red-300",
            Icon: XCircle,
            desc: "Rechazados con razón. Seguimiento manual si aplica.",
        },
    ];

function daysAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "hoy";
    if (days === 1) return "ayer";
    if (days < 30) return `hace ${days} días`;
    return new Date(iso).toLocaleDateString("es-AR");
}

export default function PipelineComerciosPage() {
    const [data, setData] = useState<PipelineData | null>(null);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/pipeline-comercios");
            const json = await res.json();
            if (res.ok) {
                setData(json.columns);
                setCounts(json.counts);
            }
        } catch (err) {
            console.error("pipeline load error", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <GitBranch className="w-6 h-6 text-[#e60012]" />
                            Pipeline de Comercios
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Visualización del funnel de alta. Los datos vienen de Merchant.approvalStatus + timestamps.
                        </p>
                    </div>
                    <button
                        onClick={load}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                    </button>
                </div>

                {loading && !data && (
                    <div className="p-12 text-center bg-white rounded-xl border border-gray-100">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </div>
                )}

                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {COLUMNS.map((col) => {
                            const items = data[col.key];
                            return (
                                <div
                                    key={col.key}
                                    className={`rounded-2xl border-2 ${col.color} overflow-hidden flex flex-col`}
                                >
                                    <div className="px-4 py-3 border-b-2 border-inherit bg-white/60">
                                        <div className="flex items-center justify-between mb-1">
                                            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                                                <col.Icon className="w-4 h-4" />
                                                {col.title}
                                            </h2>
                                            <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                                {counts[col.key] ?? 0}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 leading-snug">{col.desc}</p>
                                    </div>
                                    <div className="p-3 space-y-2 max-h-[75vh] overflow-y-auto flex-1">
                                        {items.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-6">(vacío)</p>
                                        ) : (
                                            items.map((m) => (
                                                <MerchantCard key={m.id} m={m} columnKey={col.key} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function MerchantCard({ m, columnKey }: { m: CardMerchant; columnKey: keyof PipelineData }) {
    const timeLabel =
        columnKey === "aprobados" && m.approvedAt
            ? `Aprobado ${daysAgo(m.approvedAt)}`
            : columnKey === "rechazados"
                ? `Rechazado ${daysAgo(m.updatedAt)}`
                : `Registrado ${daysAgo(m.createdAt)}`;

    return (
        <Link
            href={`/ops/usuarios/${m.owner.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:border-gray-300 transition group"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 text-[#e60012]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{m.businessName}</p>
                        {m.category && (
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{m.category}</p>
                        )}
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
            </div>
            <p className="text-[11px] text-gray-500 mb-2">{timeLabel}</p>
            <div className="space-y-1 text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{m.owner.email}</span>
                </div>
                {m.owner.phone && (
                    <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <span>{m.owner.phone}</span>
                    </div>
                )}
            </div>
            {columnKey === "pendiente_docs" && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {!m.constanciaAfipUrl && (
                        <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Sin constancia AFIP</span>
                    )}
                    {!m.habilitacionMunicipalUrl && (
                        <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Sin habilitación</span>
                    )}
                    {!m.cuit && (
                        <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Sin CUIT</span>
                    )}
                    {!m.bankAccount && (
                        <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Sin CBU</span>
                    )}
                </div>
            )}
            {columnKey === "rechazados" && m.rejectionReason && (
                <p className="mt-2 text-[10px] text-red-600 bg-red-50 rounded px-2 py-1 line-clamp-2">
                    {m.rejectionReason}
                </p>
            )}
        </Link>
    );
}
