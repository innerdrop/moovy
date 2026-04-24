"use client";

// OPS — Broadcast push/email a segmentos.
// Flujo: elegir segmento → redactar título/cuerpo o elegir template → preview →
// lanzar (RUNNING) o programar (SCHEDULED). El cron /api/cron/process-broadcasts
// procesa en batches de 200 recipients cada ~10min.

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/store/toast";
import {
    Send,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    PauseCircle,
    XCircle,
    PlayCircle,
    Clock,
    Trash2,
    Mail,
    Bell,
} from "lucide-react";

type Segment = {
    id: string;
    name: string;
    lastCount: number | null;
    filters: string;
};

type EmailTemplate = {
    id: string;
    key: string;
    name: string;
    subject: string;
};

type Campaign = {
    id: string;
    name: string;
    channel: "push" | "email" | "both";
    segmentId: string;
    templateId: string | null;
    customTitle: string | null;
    customBody: string | null;
    customUrl: string | null;
    status: "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
    segment?: { id: string; name: string; lastCount: number | null };
};

const STATUS_META: Record<
    Campaign["status"],
    { label: string; color: string; Icon: any }
> = {
    DRAFT: { label: "Borrador", color: "bg-gray-100 text-gray-700", Icon: Clock },
    SCHEDULED: { label: "Programada", color: "bg-blue-100 text-blue-700", Icon: Clock },
    RUNNING: { label: "Enviando", color: "bg-amber-100 text-amber-700", Icon: PlayCircle },
    COMPLETED: { label: "Completa", color: "bg-green-100 text-green-700", Icon: CheckCircle2 },
    FAILED: { label: "Falló", color: "bg-red-100 text-red-700", Icon: XCircle },
    CANCELLED: { label: "Cancelada", color: "bg-gray-200 text-gray-600", Icon: PauseCircle },
};

function BroadcastPageInner() {
    const searchParams = useSearchParams();
    const initialSegmentId = searchParams.get("segmentId") || "";

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state (nueva campaña)
    const [showForm, setShowForm] = useState(!!initialSegmentId);
    const [formName, setFormName] = useState("");
    const [formChannel, setFormChannel] = useState<"push" | "email" | "both">("push");
    const [formSegmentId, setFormSegmentId] = useState(initialSegmentId);
    const [formTemplateId, setFormTemplateId] = useState("");
    const [formCustomTitle, setFormCustomTitle] = useState("");
    const [formCustomBody, setFormCustomBody] = useState("");
    const [formCustomUrl, setFormCustomUrl] = useState("");
    const [formScheduled, setFormScheduled] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [cRes, sRes, tRes] = await Promise.all([
                fetch("/api/admin/broadcast"),
                fetch("/api/admin/segments?isActive=true"),
                fetch("/api/admin/email-templates"),
            ]);
            const [cData, sData, tData] = await Promise.all([cRes.json(), sRes.json(), tRes.json()]);
            if (cRes.ok) setCampaigns(cData.items || []);
            if (sRes.ok) setSegments(sData.segments || []);
            if (tRes.ok) setTemplates(tData.templates || []);
        } catch (err) {
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function createCampaign() {
        if (!formName.trim() || !formSegmentId) {
            toast.error("Nombre y segmento son obligatorios");
            return;
        }
        if (!formTemplateId && (!formCustomTitle.trim() || !formCustomBody.trim())) {
            toast.error("Elegí un template o completá título + cuerpo custom");
            return;
        }
        setSaving(true);
        try {
            const body: any = {
                name: formName.trim(),
                channel: formChannel,
                segmentId: formSegmentId,
            };
            if (formTemplateId) body.templateId = formTemplateId;
            if (formCustomTitle.trim()) body.customTitle = formCustomTitle.trim();
            if (formCustomBody.trim()) body.customBody = formCustomBody.trim();
            if (formCustomUrl.trim()) body.customUrl = formCustomUrl.trim();
            if (formScheduled) body.scheduledAt = new Date(formScheduled).toISOString();

            const res = await fetch("/api/admin/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error creando campaña");
            toast.success("Campaña creada como borrador");
            resetForm();
            await load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        } finally {
            setSaving(false);
        }
    }

    function resetForm() {
        setShowForm(false);
        setFormName("");
        setFormChannel("push");
        setFormSegmentId("");
        setFormTemplateId("");
        setFormCustomTitle("");
        setFormCustomBody("");
        setFormCustomUrl("");
        setFormScheduled("");
    }

    async function launchCampaign(id: string, immediate: boolean) {
        if (!confirm(immediate ? "¿Lanzar AHORA? Se empezarán a mandar mensajes en el próximo ciclo del cron (~15min)." : "¿Programar esta campaña?")) return;
        try {
            const res = await fetch(`/api/admin/broadcast/${id}/launch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ immediate }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error lanzando");
            toast.success(immediate ? "Campaña en cola para envío" : "Campaña programada");
            await load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        }
    }

    async function cancelCampaign(id: string) {
        if (!confirm("¿Cancelar esta campaña? No se podrá reanudar.")) return;
        try {
            const res = await fetch(`/api/admin/broadcast/${id}/cancel`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            toast.success("Campaña cancelada");
            await load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        }
    }

    async function deleteCampaign(id: string) {
        if (!confirm("¿Borrar este borrador?")) return;
        try {
            const res = await fetch(`/api/admin/broadcast/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            toast.success("Borrador eliminado");
            await load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        }
    }

    const selectedSegment = segments.find((s) => s.id === formSegmentId);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Send className="w-6 h-6 text-[#e60012]" />
                            Broadcast
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Campañas push/email masivas a segmentos. Procesa el cron cada ~10 min.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/ops/segmentos"
                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                        >
                            Administrar segmentos
                        </Link>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-2 bg-[#e60012] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#cc000f]"
                            >
                                <Plus className="w-4 h-4" />
                                Nueva campaña
                            </button>
                        )}
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Nueva campaña</h2>
                            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">
                                Cancelar
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre interno</label>
                                <input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Ej: Reactivación buyers 30d"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#e60012] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Canal</label>
                                <select
                                    value={formChannel}
                                    onChange={(e) => setFormChannel(e.target.value as any)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="push">Push</option>
                                    <option value="email">Email</option>
                                    <option value="both">Push + Email</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Segmento</label>
                                <select
                                    value={formSegmentId}
                                    onChange={(e) => setFormSegmentId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">— Elegí un segmento —</option>
                                    {segments.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.lastCount != null ? `(${s.lastCount.toLocaleString("es-AR")})` : ""}
                                        </option>
                                    ))}
                                </select>
                                {selectedSegment && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        ~{selectedSegment.lastCount?.toLocaleString("es-AR") || "?"} recipients
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Programar (opcional)</label>
                                <input
                                    type="datetime-local"
                                    value={formScheduled}
                                    onChange={(e) => setFormScheduled(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                    Template (opcional — si elegís uno, ignora título/cuerpo custom)
                                </label>
                                <select
                                    value={formTemplateId}
                                    onChange={(e) => setFormTemplateId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">— Sin template (título/cuerpo custom) —</option>
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} · {t.key}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {!formTemplateId && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                            Título / Subject
                                        </label>
                                        <input
                                            value={formCustomTitle}
                                            onChange={(e) => setFormCustomTitle(e.target.value)}
                                            placeholder="Ej: 🔥 Te extrañamos — 20% off en tu próximo pedido"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#e60012] focus:outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                            Cuerpo (HTML soporta placeholders {"{{firstName}}"}, {"{{email}}"})
                                        </label>
                                        <textarea
                                            value={formCustomBody}
                                            onChange={(e) => setFormCustomBody(e.target.value)}
                                            rows={6}
                                            placeholder="Hola {{firstName}}, volvé a pedir y te descontamos..."
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-[#e60012] focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}
                            {(formChannel === "push" || formChannel === "both") && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">URL deep-link (opcional, para push)</label>
                                    <input
                                        value={formCustomUrl}
                                        onChange={(e) => setFormCustomUrl(e.target.value)}
                                        placeholder="/ofertas o https://..."
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-5">
                            <button
                                onClick={createCampaign}
                                disabled={saving}
                                className="inline-flex items-center gap-2 bg-[#e60012] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#cc000f] disabled:opacity-60"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Crear borrador
                            </button>
                            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex-1">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    Creamos como borrador primero. Desde la lista lo revisás y lo lanzás. Para marketing,
                                    el segmento DEBE tener <code>hasMarketingConsent = true</code> (Ley 26.951).
                                </span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Lista de campañas */}
                <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700">Campañas</h2>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Todavía no hay campañas. Creá la primera.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {campaigns.map((c) => {
                                const st = STATUS_META[c.status];
                                const progress = c.totalRecipients > 0 ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;
                                return (
                                    <li key={c.id} className="px-5 py-4">
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-semibold text-gray-900">{c.name}</span>
                                                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                                                        <st.Icon className="w-3 h-3" />
                                                        {st.label}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                        {c.channel === "push" && <Bell className="w-3 h-3" />}
                                                        {c.channel === "email" && <Mail className="w-3 h-3" />}
                                                        {c.channel === "both" && (
                                                            <>
                                                                <Bell className="w-3 h-3" />
                                                                <Mail className="w-3 h-3" />
                                                            </>
                                                        )}
                                                        {c.channel}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Segmento: <strong>{c.segment?.name || c.segmentId}</strong>
                                                    {c.scheduledAt && (
                                                        <span className="ml-2">
                                                            · Programada: {new Date(c.scheduledAt).toLocaleString("es-AR")}
                                                        </span>
                                                    )}
                                                </div>
                                                {(c.status === "RUNNING" || c.status === "COMPLETED") && c.totalRecipients > 0 && (
                                                    <div className="mt-2">
                                                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                                            <span>
                                                                {c.sentCount.toLocaleString("es-AR")} / {c.totalRecipients.toLocaleString("es-AR")}
                                                                {c.failedCount > 0 && <span className="text-red-500"> ({c.failedCount} fallos)</span>}
                                                            </span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-[#e60012] h-1.5 transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {c.status === "DRAFT" && (
                                                    <>
                                                        <button
                                                            onClick={() => launchCampaign(c.id, true)}
                                                            className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                                                        >
                                                            <PlayCircle className="w-3 h-3" />
                                                            Lanzar ahora
                                                        </button>
                                                        {c.scheduledAt && (
                                                            <button
                                                                onClick={() => launchCampaign(c.id, false)}
                                                                className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                                                            >
                                                                <Clock className="w-3 h-3" />
                                                                Programar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteCampaign(c.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Borrar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {(c.status === "SCHEDULED" || c.status === "RUNNING") && (
                                                    <button
                                                        onClick={() => cancelCampaign(c.id)}
                                                        className="inline-flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

export default function BroadcastPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>}>
            <BroadcastPageInner />
        </Suspense>
    );
}
