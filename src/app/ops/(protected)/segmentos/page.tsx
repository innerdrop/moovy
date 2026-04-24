"use client";

// OPS — Editor de segmentos de usuarios para CRM / broadcast.
// Filtros editables con preview en vivo (count + sample). Los segmentos
// guardados se usan desde el broadcast para elegir a quién mandar.

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "@/store/toast";
import {
    Filter,
    Plus,
    Trash2,
    Save,
    Users,
    Loader2,
    RefreshCw,
    AlertCircle,
    Send,
} from "lucide-react";

type SegmentFilters = {
    role?: "USER" | "COMERCIO" | "DRIVER" | "SELLER" | "ADMIN";
    isSuspended?: boolean;
    hasMarketingConsent?: boolean;
    minPoints?: number;
    maxPoints?: number;
    createdAfter?: string;
    createdBefore?: string;
    hasOrdered?: boolean;
    noOrdersInDays?: number;
    city?: string;
};

type Segment = {
    id: string;
    name: string;
    description: string | null;
    filters: string;
    lastCount: number | null;
    lastCountAt: string | null;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    _count?: { campaigns: number };
};

type SampleUser = {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
};

const EMPTY_FILTERS: SegmentFilters = {};

function parseFilters(raw: string): SegmentFilters {
    try {
        return JSON.parse(raw) ?? {};
    } catch {
        return {};
    }
}

export default function SegmentosPage() {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mode, setMode] = useState<"view" | "edit" | "new">("view");

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [filters, setFilters] = useState<SegmentFilters>(EMPTY_FILTERS);

    // Preview state
    const [preview, setPreview] = useState<{ count: number; sample: SampleUser[] } | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load segments
    const loadSegments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/segments");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error cargando segmentos");
            setSegments(data.segments || []);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSegments();
    }, [loadSegments]);

    // When selecting a segment, load it into form
    useEffect(() => {
        if (!selectedId) {
            setName("");
            setDescription("");
            setFilters(EMPTY_FILTERS);
            setPreview(null);
            return;
        }
        const seg = segments.find((s) => s.id === selectedId);
        if (!seg) return;
        setName(seg.name);
        setDescription(seg.description ?? "");
        setFilters(parseFilters(seg.filters));
    }, [selectedId, segments]);

    // Run preview whenever filters change (debounced)
    useEffect(() => {
        if (mode === "view" && !selectedId) return;
        const t = setTimeout(() => runPreview(filters), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, mode, selectedId]);

    async function runPreview(f: SegmentFilters) {
        setPreviewLoading(true);
        try {
            const res = await fetch("/api/admin/segments/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en preview");
            setPreview({ count: data.count, sample: data.sample });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
            setPreview(null);
        } finally {
            setPreviewLoading(false);
        }
    }

    function startNew() {
        setSelectedId(null);
        setName("");
        setDescription("");
        setFilters(EMPTY_FILTERS);
        setPreview(null);
        setMode("new");
    }

    function startEdit() {
        setMode("edit");
    }

    async function save() {
        if (!name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        setSaving(true);
        try {
            if (mode === "new") {
                const res = await fetch("/api/admin/segments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, filters }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error guardando");
                toast.success("Segmento creado");
                setSelectedId(data.segment.id);
                setMode("view");
                await loadSegments();
            } else if (mode === "edit" && selectedId) {
                const res = await fetch(`/api/admin/segments/${selectedId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim(), description: description.trim() || null, filters }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error guardando");
                toast.success("Segmento actualizado");
                setMode("view");
                await loadSegments();
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        } finally {
            setSaving(false);
        }
    }

    async function deleteSegment() {
        if (!selectedId) return;
        if (!confirm("¿Borrar este segmento? Si tiene campañas asociadas, se desactiva en lugar de borrar.")) return;
        try {
            const res = await fetch(`/api/admin/segments/${selectedId}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error borrando");
            toast.success(data.deactivated ? "Segmento desactivado (tenía campañas)" : "Segmento borrado");
            setSelectedId(null);
            setMode("view");
            await loadSegments();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        }
    }

    const selected = useMemo(() => segments.find((s) => s.id === selectedId) ?? null, [segments, selectedId]);
    const editing = mode === "new" || mode === "edit";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Filter className="w-6 h-6 text-[#e60012]" />
                            Segmentos de usuarios
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Definí grupos filtrados para usar en campañas de broadcast.
                        </p>
                    </div>
                    <button
                        onClick={startNew}
                        className="inline-flex items-center gap-2 bg-[#e60012] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#cc000f] transition"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo segmento
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">Guardados</span>
                                <button
                                    onClick={loadSegments}
                                    className="p-1.5 hover:bg-gray-100 rounded"
                                    title="Recargar"
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                                {loading && (
                                    <li className="p-4 text-center">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                                    </li>
                                )}
                                {!loading && segments.length === 0 && (
                                    <li className="p-6 text-center text-sm text-gray-400">
                                        Todavía no hay segmentos. Creá el primero con el botón de arriba.
                                    </li>
                                )}
                                {segments.map((seg) => (
                                    <li key={seg.id}>
                                        <button
                                            onClick={() => {
                                                setSelectedId(seg.id);
                                                setMode("view");
                                            }}
                                            className={`w-full text-left px-4 py-3 transition ${selectedId === seg.id ? "bg-red-50" : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {seg.name}
                                                </span>
                                                {!seg.isActive && (
                                                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {seg.lastCount ?? "?"}
                                                </span>
                                                {seg._count?.campaigns ? (
                                                    <span className="flex items-center gap-1">
                                                        <Send className="w-3 h-3" />
                                                        {seg._count.campaigns}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Detalle / Editor */}
                    <section className="lg:col-span-2">
                        {!selected && mode !== "new" && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                                <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Elegí un segmento de la izquierda o creá uno nuevo.</p>
                            </div>
                        )}

                        {(editing || selected) && (
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                                    {editing ? (
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nombre del segmento"
                                            className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-dashed border-gray-200 focus:border-[#e60012] pb-1"
                                        />
                                    ) : (
                                        <h2 className="text-lg font-bold text-gray-900">{selected?.name}</h2>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {!editing && selected && (
                                            <>
                                                <button
                                                    onClick={startEdit}
                                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={deleteSegment}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Borrar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    href={`/ops/broadcast?segmentId=${selected.id}`}
                                                    className="inline-flex items-center gap-1 text-sm bg-[#e60012] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#cc000f]"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    Usar en broadcast
                                                </Link>
                                            </>
                                        )}
                                        {editing && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        if (mode === "new") {
                                                            setSelectedId(null);
                                                            setMode("view");
                                                        } else {
                                                            setMode("view");
                                                            if (selected) {
                                                                setName(selected.name);
                                                                setDescription(selected.description ?? "");
                                                                setFilters(parseFilters(selected.filters));
                                                            }
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={save}
                                                    disabled={saving || !name.trim()}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-[#e60012] text-white rounded-lg font-medium hover:bg-[#cc000f] disabled:opacity-60"
                                                >
                                                    {saving ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4" />
                                                    )}
                                                    Guardar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 space-y-5">
                                    {editing && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                Descripción (opcional)
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Ej: Buyers que no hicieron un pedido hace más de 30 días"
                                                rows={2}
                                                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#e60012] focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    {!editing && selected?.description && (
                                        <p className="text-sm text-gray-600">{selected.description}</p>
                                    )}

                                    {/* Filtros */}
                                    <FiltersEditor filters={filters} onChange={setFilters} readonly={!editing} />

                                    {/* Marketing consent warning */}
                                    {filters.hasMarketingConsent !== true && (
                                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-xs text-amber-900">
                                                <strong>Ley 26.951 (No Llame):</strong> para enviar broadcasts de marketing
                                                este segmento DEBE tener <code>hasMarketingConsent = true</code>. Sólo se
                                                puede usar para comunicaciones transaccionales o de servicio.
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-700" />
                                                <span className="text-sm font-semibold text-gray-700">Preview</span>
                                            </div>
                                            {previewLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                            ) : preview ? (
                                                <span className="text-2xl font-bold text-[#e60012]">
                                                    {preview.count.toLocaleString("es-AR")}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </div>
                                        {preview && preview.sample.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                                    Muestra (primeros {preview.sample.length})
                                                </p>
                                                <ul className="divide-y divide-gray-200 bg-white rounded-lg overflow-hidden border border-gray-100">
                                                    {preview.sample.map((u) => (
                                                        <li
                                                            key={u.id}
                                                            className="flex items-center justify-between px-3 py-2 text-xs"
                                                        >
                                                            <span className="font-medium text-gray-800 truncate">
                                                                {u.name || "(sin nombre)"}
                                                            </span>
                                                            <span className="text-gray-500 truncate">{u.email}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {preview && preview.count === 0 && (
                                            <p className="text-xs text-gray-500 text-center py-2">
                                                Ningún usuario matchea estos filtros.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

// ─── Filters Editor ───────────────────────────────────────────────────────

function FiltersEditor({
    filters,
    onChange,
    readonly,
}: {
    filters: SegmentFilters;
    onChange: (f: SegmentFilters) => void;
    readonly: boolean;
}) {
    function update<K extends keyof SegmentFilters>(key: K, value: SegmentFilters[K] | undefined) {
        const next = { ...filters };
        if (value === undefined || value === "" || (typeof value === "number" && isNaN(value))) {
            delete next[key];
        } else {
            next[key] = value;
        }
        onChange(next);
    }

    const baseClass = readonly
        ? "border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm w-full cursor-not-allowed"
        : "border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:border-[#e60012] focus:outline-none";

    return (
        <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Filtros (AND entre sí)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Rol">
                    <select
                        disabled={readonly}
                        value={filters.role ?? ""}
                        onChange={(e) => update("role", (e.target.value || undefined) as any)}
                        className={baseClass}
                    >
                        <option value="">— Cualquiera —</option>
                        <option value="USER">Buyers (USER)</option>
                        <option value="COMERCIO">Comercios</option>
                        <option value="DRIVER">Repartidores</option>
                        <option value="SELLER">Vendedores</option>
                        <option value="ADMIN">Admins</option>
                    </select>
                </Field>

                <Field label="Estado">
                    <select
                        disabled={readonly}
                        value={filters.isSuspended === undefined ? "" : filters.isSuspended ? "true" : "false"}
                        onChange={(e) =>
                            update("isSuspended", e.target.value === "" ? undefined : e.target.value === "true")
                        }
                        className={baseClass}
                    >
                        <option value="">— Cualquiera —</option>
                        <option value="false">Activos (no suspendidos)</option>
                        <option value="true">Suspendidos</option>
                    </select>
                </Field>

                <Field label="Consentimiento marketing">
                    <select
                        disabled={readonly}
                        value={
                            filters.hasMarketingConsent === undefined
                                ? ""
                                : filters.hasMarketingConsent
                                    ? "true"
                                    : "false"
                        }
                        onChange={(e) =>
                            update(
                                "hasMarketingConsent",
                                e.target.value === "" ? undefined : e.target.value === "true",
                            )
                        }
                        className={baseClass}
                    >
                        <option value="">— Cualquiera —</option>
                        <option value="true">Opt-in (sí)</option>
                        <option value="false">Opt-out (no)</option>
                    </select>
                </Field>

                <Field label="Hizo algún pedido">
                    <select
                        disabled={readonly}
                        value={filters.hasOrdered === undefined ? "" : filters.hasOrdered ? "true" : "false"}
                        onChange={(e) =>
                            update("hasOrdered", e.target.value === "" ? undefined : e.target.value === "true")
                        }
                        className={baseClass}
                    >
                        <option value="">— Cualquiera —</option>
                        <option value="true">Sí (al menos 1 DELIVERED)</option>
                        <option value="false">No (nunca completó uno)</option>
                    </select>
                </Field>

                <Field label="Sin pedido en últimos N días">
                    <input
                        type="number"
                        disabled={readonly}
                        min={1}
                        max={3650}
                        value={filters.noOrdersInDays ?? ""}
                        onChange={(e) =>
                            update("noOrdersInDays", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                        placeholder="Ej: 30"
                        className={baseClass}
                    />
                </Field>

                <Field label="Ciudad (contiene)">
                    <input
                        type="text"
                        disabled={readonly}
                        value={filters.city ?? ""}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="Ej: Ushuaia"
                        className={baseClass}
                    />
                </Field>

                <Field label="Puntos mínimos">
                    <input
                        type="number"
                        disabled={readonly}
                        min={0}
                        value={filters.minPoints ?? ""}
                        onChange={(e) =>
                            update("minPoints", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                        placeholder="Ej: 500"
                        className={baseClass}
                    />
                </Field>

                <Field label="Puntos máximos">
                    <input
                        type="number"
                        disabled={readonly}
                        min={0}
                        value={filters.maxPoints ?? ""}
                        onChange={(e) =>
                            update("maxPoints", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                        placeholder="Ej: 10000"
                        className={baseClass}
                    />
                </Field>

                <Field label="Registrado después de">
                    <input
                        type="date"
                        disabled={readonly}
                        value={filters.createdAfter ? filters.createdAfter.substring(0, 10) : ""}
                        onChange={(e) =>
                            update("createdAfter", e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined)
                        }
                        className={baseClass}
                    />
                </Field>

                <Field label="Registrado antes de">
                    <input
                        type="date"
                        disabled={readonly}
                        value={filters.createdBefore ? filters.createdBefore.substring(0, 10) : ""}
                        onChange={(e) =>
                            update("createdBefore", e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined)
                        }
                        className={baseClass}
                    />
                </Field>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {label}
            </span>
            {children}
        </label>
    );
}
