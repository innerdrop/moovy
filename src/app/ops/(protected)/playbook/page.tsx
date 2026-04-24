"use client";

// OPS Playbook — checklists operativos editables
// Fase 1: consulta + edición. No hay tracking de completados por operador.
// Cada checklist agrupa pasos ordenables con flag "obligatorio" (solo visual).

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    ClipboardCheck,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    GripVertical,
    ChevronDown,
    ChevronRight,
    Loader2,
    FileText,
    AlertTriangle,
    ShieldCheck,
    Flame,
    HelpCircle,
    BookOpen,
} from "lucide-react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ──────────────────────────────────────────────────────────────────

type PlaybookCategory = "onboarding" | "approval" | "escalation" | "incident" | "other";

interface PlaybookStep {
    id: string;
    checklistId: string;
    content: string;
    order: number;
    required: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ChecklistSummary {
    id: string;
    name: string;
    description: string | null;
    category: PlaybookCategory;
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
    _count?: { steps: number };
}

interface ChecklistDetail extends ChecklistSummary {
    steps: PlaybookStep[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_META: Record<PlaybookCategory, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    onboarding: {
        label: "Onboarding",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: <BookOpen className="w-4 h-4" />,
    },
    approval: {
        label: "Aprobación",
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: <ShieldCheck className="w-4 h-4" />,
    },
    escalation: {
        label: "Escalación",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: <AlertTriangle className="w-4 h-4" />,
    },
    incident: {
        label: "Incidentes",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <Flame className="w-4 h-4" />,
    },
    other: {
        label: "Otros",
        color: "text-slate-700",
        bg: "bg-slate-50",
        border: "border-slate-200",
        icon: <HelpCircle className="w-4 h-4" />,
    },
};

const CATEGORY_ORDER: PlaybookCategory[] = ["onboarding", "approval", "escalation", "incident", "other"];

const SEED_CHECKLISTS: Array<{
    name: string;
    description: string;
    category: PlaybookCategory;
    steps: Array<{ content: string; required: boolean }>;
}> = [
    {
        name: "Alta de comercio nuevo",
        description: "Pasos para incorporar un comercio que recién se registró.",
        category: "onboarding",
        steps: [
            { content: "Contactar al comercio en 24h por WhatsApp o llamada", required: true },
            { content: "Verificar docs AFIP y habilitación municipal", required: true },
            { content: "Revisar foto de fachada y del local", required: true },
            { content: "Aprobar en OPS si todo está OK", required: true },
            { content: "Enviar email de bienvenida manual si algo no está claro", required: false },
        ],
    },
    {
        name: "Revisión de docs de driver",
        description: "Validar documentación del repartidor antes de aprobarlo.",
        category: "approval",
        steps: [
            { content: "Verificar que el DNI coincide con la foto de perfil", required: true },
            { content: "Chequear que la licencia de conducir esté vigente", required: true },
            { content: "Validar que el seguro del vehículo esté al día", required: true },
            { content: "Confirmar CUIT/Monotributo activo en AFIP", required: true },
            { content: "Aprobar cada doc individualmente desde el panel", required: true },
        ],
    },
    {
        name: "Pedido demorado >30 min",
        description: "Protocolo de incidente cuando un pedido se queda stuck.",
        category: "incident",
        steps: [
            { content: "Abrir el pedido en /ops/pedidos", required: true },
            { content: "Verificar estado del driver en tiempo real", required: true },
            { content: "Intentar reasignar driver si corresponde", required: true },
            { content: "Contactar al buyer por el chat del pedido", required: true },
            { content: "Si no se puede resolver, cancelar + refund manual", required: false },
        ],
    },
    {
        name: "Reclamo de comercio por pago",
        description: "Cómo manejar una consulta del comercio sobre un cobro.",
        category: "escalation",
        steps: [
            { content: "Abrir ficha del comercio en /ops/usuarios/[id]", required: true },
            { content: "Revisar los últimos pedidos DELIVERED", required: true },
            { content: "Consultar el estado de MP en la sección Pagos", required: true },
            { content: "Si hay retención legítima, explicarle al comercio por WhatsApp", required: true },
            { content: "Documentar la conversación con una nota interna", required: true },
        ],
    },
];

// ─── Sortable Step Item ─────────────────────────────────────────────────────

interface SortableStepProps {
    step: PlaybookStep;
    onEdit: (step: PlaybookStep, nextContent: string) => Promise<void>;
    onToggleRequired: (step: PlaybookStep) => Promise<void>;
    onDelete: (step: PlaybookStep) => void;
}

function SortableStepItem({ step, onEdit, onToggleRequired, onDelete }: SortableStepProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? ("relative" as const) : ("static" as const),
    };

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(step.content);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!editing) setDraft(step.content);
    }, [step.content, editing]);

    async function save() {
        const trimmed = draft.trim();
        if (!trimmed) {
            toast.error("El contenido no puede estar vacío");
            return;
        }
        if (trimmed === step.content) {
            setEditing(false);
            return;
        }
        if (trimmed.length > 500) {
            toast.error("El contenido no puede superar los 500 caracteres");
            return;
        }
        setSaving(true);
        try {
            await onEdit(step, trimmed);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-2 sm:gap-3 ${
                isDragging ? "shadow-2xl ring-2 ring-[#e60012]/60 z-50" : "hover:border-slate-300"
            }`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="mt-1 text-slate-300 cursor-grab active:cursor-grabbing hover:text-[#e60012] p-1 -m-1 rounded hover:bg-slate-50 transition-colors select-none"
                style={{ touchAction: "none" } as React.CSSProperties}
                aria-label="Arrastrar para reordenar"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
                {editing ? (
                    <div className="space-y-2">
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    save();
                                }
                                if (e.key === "Escape") {
                                    setDraft(step.content);
                                    setEditing(false);
                                }
                            }}
                            rows={2}
                            maxLength={500}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#e60012] focus:ring-2 focus:ring-[#e60012]/10 resize-none"
                            autoFocus
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{draft.length}/500</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft(step.content);
                                        setEditing(false);
                                    }}
                                    className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={save}
                                    disabled={saving}
                                    className="px-3 py-1 bg-[#e60012] text-white rounded-lg hover:bg-red-700 transition-colors font-bold disabled:opacity-50 flex items-center gap-1"
                                >
                                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="text-left text-sm text-slate-800 leading-snug w-full hover:text-slate-900 break-words whitespace-pre-wrap"
                    >
                        {step.content}
                    </button>
                )}

                <div className="flex items-center gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => onToggleRequired(step)}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border transition-colors ${
                            step.required
                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                        title="Click para alternar obligatorio/sugerido"
                    >
                        {step.required ? "Obligatorio" : "Sugerido"}
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                {!editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onDelete(step)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Borrar"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── New Checklist Modal ────────────────────────────────────────────────────

interface NewChecklistModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; description: string; category: PlaybookCategory }) => Promise<void>;
}

function NewChecklistModal({ open, onClose, onCreate }: NewChecklistModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<PlaybookCategory>("onboarding");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setName("");
            setDescription("");
            setCategory("onboarding");
            setError("");
        }
    }, [open]);

    if (!open) return null;

    async function submit() {
        if (!name.trim()) {
            setError("El nombre es requerido");
            return;
        }
        if (name.length > 100) {
            setError("Nombre demasiado largo");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await onCreate({
                name: name.trim(),
                description: description.trim(),
                category,
            });
            onClose();
        } catch (err: any) {
            setError(err?.message || "Error al crear");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 overflow-y-auto"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo checklist"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mb-10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-900">Nuevo checklist</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm mb-4">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            placeholder="Ej: Alta de comercio nuevo"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#e60012] focus:ring-2 focus:ring-[#e60012]/10"
                            autoFocus
                        />
                        <p className="text-[10px] text-slate-400 mt-1">{name.length}/100</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Breve contexto para el operador"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#e60012] focus:ring-2 focus:ring-[#e60012]/10 resize-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">{description.length}/500</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                            Categoría
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORY_ORDER.map((cat) => {
                                const meta = CATEGORY_META[cat];
                                const selected = cat === category;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                                            selected
                                                ? `${meta.bg} ${meta.color} ${meta.border}`
                                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        {meta.icon}
                                        {meta.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-[#e60012] text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Crear
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PlaybookPage() {
    const [checklists, setChecklists] = useState<ChecklistSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ChecklistDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // Collapsed categories in sidebar
    const [collapsedCats, setCollapsedCats] = useState<Record<PlaybookCategory, boolean>>({
        onboarding: false,
        approval: false,
        escalation: false,
        incident: false,
        other: false,
    });

    // Mobile: detail view toggle
    const [mobileShowDetail, setMobileShowDetail] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ─── Load checklists list ──────────────────────────────────────────────
    const loadChecklists = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/playbook", { cache: "no-store" });
            if (!res.ok) {
                toast.error("Error al cargar checklists");
                return;
            }
            const json = await res.json();
            const list: ChecklistSummary[] = json.data || [];
            setChecklists(list);
            // Seleccionar el primero si hay uno y no hay ninguno seleccionado
            if (list.length > 0 && !selectedId) {
                setSelectedId(list[0].id);
            }
            if (selectedId && !list.find((c) => c.id === selectedId)) {
                setSelectedId(list[0]?.id ?? null);
            }
        } catch (error) {
            console.error("Error loading checklists:", error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        loadChecklists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Load detail when selected ─────────────────────────────────────────
    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            return;
        }
        let cancelled = false;
        (async () => {
            setDetailLoading(true);
            try {
                const res = await fetch(`/api/admin/playbook/${selectedId}`, { cache: "no-store" });
                if (!res.ok) {
                    if (!cancelled) toast.error("Error al cargar el detalle");
                    return;
                }
                const json = await res.json();
                if (!cancelled) setDetail(json.data);
            } catch (error) {
                console.error("Error loading detail:", error);
                if (!cancelled) toast.error("Error de conexión");
            } finally {
                if (!cancelled) setDetailLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    // Group by category
    const grouped = useMemo(() => {
        const map = new Map<PlaybookCategory, ChecklistSummary[]>();
        for (const cat of CATEGORY_ORDER) map.set(cat, []);
        for (const c of checklists) {
            const key = (CATEGORY_ORDER as string[]).includes(c.category)
                ? (c.category as PlaybookCategory)
                : "other";
            map.get(key)!.push(c);
        }
        return map;
    }, [checklists]);

    // ─── Create new checklist ──────────────────────────────────────────────
    async function handleCreate(data: { name: string; description: string; category: PlaybookCategory }) {
        const res = await fetch("/api/admin/playbook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: data.name,
                description: data.description || undefined,
                category: data.category,
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Error al crear");
        }
        const json = await res.json();
        const created: ChecklistSummary = json.data;
        toast.success("Checklist creado");
        await loadChecklists();
        setSelectedId(created.id);
        setMobileShowDetail(true);
    }

    // ─── Seed 4 initial checklists ─────────────────────────────────────────
    async function handleSeed() {
        setSeeding(true);
        try {
            for (const seed of SEED_CHECKLISTS) {
                // create checklist
                const res = await fetch("/api/admin/playbook", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: seed.name,
                        description: seed.description,
                        category: seed.category,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || `Error al crear "${seed.name}"`);
                }
                const json = await res.json();
                const id = json.data.id;
                // Create steps in order
                for (const s of seed.steps) {
                    await fetch(`/api/admin/playbook/${id}/steps`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(s),
                    });
                }
            }
            toast.success("Checklists de ejemplo cargados");
            await loadChecklists();
        } catch (err: any) {
            toast.error(err?.message || "Error al cargar ejemplos");
        } finally {
            setSeeding(false);
        }
    }

    // ─── Patch checklist (header editing) ──────────────────────────────────
    async function patchChecklist(
        id: string,
        data: Partial<Pick<ChecklistDetail, "name" | "description" | "category" | "isActive">>
    ) {
        const res = await fetch(`/api/admin/playbook/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Error al actualizar");
        }
        const json = await res.json();
        // Optimistic update
        setChecklists((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...json.data, _count: c._count } : c))
        );
        setDetail((prev) => (prev && prev.id === id ? { ...prev, ...json.data, steps: prev.steps } : prev));
    }

    // ─── Delete checklist ──────────────────────────────────────────────────
    function handleDeleteChecklist(id: string, name: string) {
        confirm({
            title: "Eliminar checklist",
            message: `¿Seguro que querés borrar "${name}"? Se perderán todos sus pasos.`,
            variant: "danger",
            confirmLabel: "Eliminar",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/playbook/${id}`, { method: "DELETE" });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        toast.error(err.error || "Error al eliminar");
                        return;
                    }
                    toast.success("Checklist eliminado");
                    if (selectedId === id) setSelectedId(null);
                    await loadChecklists();
                } catch (error) {
                    console.error("Error deleting checklist:", error);
                    toast.error("Error de conexión");
                }
            },
        });
    }

    // ─── Add step ─────────────────────────────────────────────────────────
    async function handleAddStep() {
        if (!detail) return;
        const content = window.prompt("Contenido del nuevo paso:");
        if (!content) return;
        const trimmed = content.trim();
        if (!trimmed) {
            toast.error("El contenido no puede estar vacío");
            return;
        }
        if (trimmed.length > 500) {
            toast.error("Máximo 500 caracteres");
            return;
        }
        try {
            const res = await fetch(`/api/admin/playbook/${detail.id}/steps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: trimmed, required: true }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Error al agregar paso");
                return;
            }
            const json = await res.json();
            setDetail((prev) =>
                prev ? { ...prev, steps: [...prev.steps, json.data] } : prev
            );
            // Update count in sidebar
            setChecklists((prev) =>
                prev.map((c) =>
                    c.id === detail.id
                        ? { ...c, _count: { steps: (c._count?.steps || 0) + 1 } }
                        : c
                )
            );
            toast.success("Paso agregado");
        } catch (error) {
            console.error("Error adding step:", error);
            toast.error("Error de conexión");
        }
    }

    // ─── Edit step content ────────────────────────────────────────────────
    async function handleEditStep(step: PlaybookStep, nextContent: string) {
        if (!detail) return;
        try {
            const res = await fetch(
                `/api/admin/playbook/${detail.id}/steps/${step.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: nextContent }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Error al guardar");
                throw new Error("update failed");
            }
            const json = await res.json();
            setDetail((prev) =>
                prev
                    ? {
                          ...prev,
                          steps: prev.steps.map((s) => (s.id === step.id ? json.data : s)),
                      }
                    : prev
            );
            toast.success("Paso actualizado");
        } catch (error) {
            console.error("Error updating step:", error);
        }
    }

    // ─── Toggle required ──────────────────────────────────────────────────
    async function handleToggleRequired(step: PlaybookStep) {
        if (!detail) return;
        // Optimistic
        const next = !step.required;
        setDetail((prev) =>
            prev
                ? {
                      ...prev,
                      steps: prev.steps.map((s) =>
                          s.id === step.id ? { ...s, required: next } : s
                      ),
                  }
                : prev
        );
        try {
            const res = await fetch(
                `/api/admin/playbook/${detail.id}/steps/${step.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ required: next }),
                }
            );
            if (!res.ok) {
                // revert
                setDetail((prev) =>
                    prev
                        ? {
                              ...prev,
                              steps: prev.steps.map((s) =>
                                  s.id === step.id ? { ...s, required: !next } : s
                              ),
                          }
                        : prev
                );
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Error al cambiar");
            }
        } catch (error) {
            console.error("Error toggling required:", error);
            toast.error("Error de conexión");
        }
    }

    // ─── Delete step ──────────────────────────────────────────────────────
    function handleDeleteStep(step: PlaybookStep) {
        if (!detail) return;
        confirm({
            title: "Eliminar paso",
            message: "¿Seguro que querés borrar este paso?",
            variant: "danger",
            confirmLabel: "Eliminar",
            onConfirm: async () => {
                try {
                    const res = await fetch(
                        `/api/admin/playbook/${detail.id}/steps/${step.id}`,
                        { method: "DELETE" }
                    );
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        toast.error(err.error || "Error al eliminar");
                        return;
                    }
                    setDetail((prev) =>
                        prev
                            ? { ...prev, steps: prev.steps.filter((s) => s.id !== step.id) }
                            : prev
                    );
                    setChecklists((prev) =>
                        prev.map((c) =>
                            c.id === detail.id
                                ? {
                                      ...c,
                                      _count: {
                                          steps: Math.max(0, (c._count?.steps || 1) - 1),
                                      },
                                  }
                                : c
                        )
                    );
                    toast.success("Paso eliminado");
                } catch (error) {
                    console.error("Error deleting step:", error);
                    toast.error("Error de conexión");
                }
            },
        });
    }

    // ─── DnD: reorder ─────────────────────────────────────────────────────
    async function handleDragEnd(event: DragEndEvent) {
        if (!detail) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = detail.steps.findIndex((s) => s.id === active.id);
        const newIndex = detail.steps.findIndex((s) => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const prevSteps = detail.steps;
        const newSteps = arrayMove(prevSteps, oldIndex, newIndex).map((s, i) => ({
            ...s,
            order: i,
        }));

        // Optimistic
        setDetail((prev) => (prev ? { ...prev, steps: newSteps } : prev));

        try {
            const res = await fetch(
                `/api/admin/playbook/${detail.id}/reorder-steps`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stepIds: newSteps.map((s) => s.id) }),
                }
            );
            if (!res.ok) {
                setDetail((prev) => (prev ? { ...prev, steps: prevSteps } : prev));
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Error al reordenar");
            }
        } catch (error) {
            console.error("Error reordering steps:", error);
            setDetail((prev) => (prev ? { ...prev, steps: prevSteps } : prev));
            toast.error("Error de conexión");
        }
    }

    function toggleCategoryCollapsed(cat: PlaybookCategory) {
        setCollapsedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
    }

    // ─── Render ───────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    const hasAny = checklists.length > 0;

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        Playbook
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-1">
                        Manuales operativos editables del equipo OPS
                    </p>
                </div>
                {hasAny && (
                    <button
                        type="button"
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#e60012] text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo checklist
                    </button>
                )}
            </div>

            {!hasAny ? (
                <EmptyState onCreate={() => setShowNewModal(true)} onSeed={handleSeed} seeding={seeding} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Sidebar checklists — desktop */}
                    <aside
                        className={`lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 ${
                            mobileShowDetail ? "hidden lg:block" : "block"
                        }`}
                    >
                        <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                            {CATEGORY_ORDER.map((cat) => {
                                const items = grouped.get(cat) || [];
                                if (items.length === 0) return null;
                                const meta = CATEGORY_META[cat];
                                const collapsed = collapsedCats[cat];
                                return (
                                    <div key={cat}>
                                        <button
                                            type="button"
                                            onClick={() => toggleCategoryCollapsed(cat)}
                                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 rounded-lg"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className={meta.color}>{meta.icon}</span>
                                                {meta.label}
                                                <span className="text-slate-400 font-bold ml-1">
                                                    ({items.length})
                                                </span>
                                            </span>
                                            {collapsed ? (
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        {!collapsed && (
                                            <div className="mt-1 space-y-1">
                                                {items.map((c) => {
                                                    const selected = c.id === selectedId;
                                                    return (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedId(c.id);
                                                                setMobileShowDetail(true);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                                                selected
                                                                    ? "bg-slate-900 text-white"
                                                                    : "text-slate-700 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <FileText
                                                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                                                    selected
                                                                        ? "text-white/70"
                                                                        : "text-slate-400"
                                                                }`}
                                                            />
                                                            <span className="flex-1 min-w-0">
                                                                <span
                                                                    className={`block text-sm font-bold truncate ${
                                                                        !c.isActive && !selected
                                                                            ? "text-slate-400"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    {c.name}
                                                                </span>
                                                                <span
                                                                    className={`block text-[10px] font-medium ${
                                                                        selected
                                                                            ? "text-white/60"
                                                                            : "text-slate-400"
                                                                    }`}
                                                                >
                                                                    {c._count?.steps ?? 0} paso
                                                                    {(c._count?.steps ?? 0) === 1
                                                                        ? ""
                                                                        : "s"}
                                                                    {!c.isActive && " · Inactivo"}
                                                                </span>
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Detail panel */}
                    <section
                        className={`lg:col-span-8 xl:col-span-9 ${
                            !mobileShowDetail ? "hidden lg:block" : "block"
                        }`}
                    >
                        {/* Mobile back button */}
                        {mobileShowDetail && (
                            <button
                                type="button"
                                onClick={() => setMobileShowDetail(false)}
                                className="lg:hidden flex items-center gap-1 text-sm text-slate-600 mb-3 font-medium"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" /> Volver a la lista
                            </button>
                        )}

                        {detailLoading && !detail ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-10 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-[#e60012]" />
                            </div>
                        ) : detail ? (
                            <ChecklistDetailView
                                detail={detail}
                                sensors={sensors}
                                onPatch={(data) => patchChecklist(detail.id, data)}
                                onDelete={() => handleDeleteChecklist(detail.id, detail.name)}
                                onAddStep={handleAddStep}
                                onEditStep={handleEditStep}
                                onToggleRequired={handleToggleRequired}
                                onDeleteStep={handleDeleteStep}
                                onDragEnd={handleDragEnd}
                            />
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
                                Elegí un checklist de la lista para verlo
                            </div>
                        )}
                    </section>
                </div>
            )}

            <NewChecklistModal
                open={showNewModal}
                onClose={() => setShowNewModal(false)}
                onCreate={handleCreate}
            />
        </div>
    );
}

// ─── Detail View ────────────────────────────────────────────────────────────

interface ChecklistDetailViewProps {
    detail: ChecklistDetail;
    sensors: ReturnType<typeof useSensors>;
    onPatch: (data: Partial<Pick<ChecklistDetail, "name" | "description" | "category" | "isActive">>) => Promise<void>;
    onDelete: () => void;
    onAddStep: () => Promise<void>;
    onEditStep: (step: PlaybookStep, content: string) => Promise<void>;
    onToggleRequired: (step: PlaybookStep) => Promise<void>;
    onDeleteStep: (step: PlaybookStep) => void;
    onDragEnd: (event: DragEndEvent) => void;
}

function ChecklistDetailView({
    detail,
    sensors,
    onPatch,
    onDelete,
    onAddStep,
    onEditStep,
    onToggleRequired,
    onDeleteStep,
    onDragEnd,
}: ChecklistDetailViewProps) {
    const [nameDraft, setNameDraft] = useState(detail.name);
    const [descDraft, setDescDraft] = useState(detail.description || "");
    const [category, setCategory] = useState<PlaybookCategory>(detail.category);
    const [isActive, setIsActive] = useState(detail.isActive);
    const [savingMeta, setSavingMeta] = useState(false);

    useEffect(() => {
        setNameDraft(detail.name);
        setDescDraft(detail.description || "");
        setCategory(detail.category);
        setIsActive(detail.isActive);
    }, [detail.id, detail.name, detail.description, detail.category, detail.isActive]);

    async function saveName() {
        const trimmed = nameDraft.trim();
        if (!trimmed || trimmed === detail.name) {
            setNameDraft(detail.name);
            return;
        }
        if (trimmed.length > 100) {
            toast.error("Nombre demasiado largo");
            setNameDraft(detail.name);
            return;
        }
        setSavingMeta(true);
        try {
            await onPatch({ name: trimmed });
            toast.success("Nombre actualizado");
        } catch (err: any) {
            toast.error(err?.message || "Error al guardar");
            setNameDraft(detail.name);
        } finally {
            setSavingMeta(false);
        }
    }

    async function saveDescription() {
        const trimmed = descDraft.trim();
        const prev = detail.description || "";
        if (trimmed === prev) return;
        if (trimmed.length > 500) {
            toast.error("Descripción demasiado larga");
            setDescDraft(prev);
            return;
        }
        setSavingMeta(true);
        try {
            await onPatch({ description: trimmed || null });
            toast.success("Descripción actualizada");
        } catch (err: any) {
            toast.error(err?.message || "Error al guardar");
            setDescDraft(prev);
        } finally {
            setSavingMeta(false);
        }
    }

    async function changeCategory(next: PlaybookCategory) {
        if (next === category) return;
        setCategory(next);
        setSavingMeta(true);
        try {
            await onPatch({ category: next });
            toast.success("Categoría actualizada");
        } catch (err: any) {
            toast.error(err?.message || "Error al guardar");
            setCategory(detail.category);
        } finally {
            setSavingMeta(false);
        }
    }

    async function toggleActive() {
        const next = !isActive;
        setIsActive(next);
        setSavingMeta(true);
        try {
            await onPatch({ isActive: next });
        } catch (err: any) {
            toast.error(err?.message || "Error al guardar");
            setIsActive(!next);
        } finally {
            setSavingMeta(false);
        }
    }

    const meta = CATEGORY_META[category];

    return (
        <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <input
                            type="text"
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onBlur={saveName}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                if (e.key === "Escape") {
                                    setNameDraft(detail.name);
                                    (e.target as HTMLInputElement).blur();
                                }
                            }}
                            maxLength={100}
                            className="w-full text-xl sm:text-2xl font-bold text-slate-900 bg-transparent focus:outline-none focus:bg-slate-50 rounded-lg px-2 -mx-2 py-1"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {savingMeta && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        <button
                            type="button"
                            onClick={onDelete}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar checklist"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <textarea
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    onBlur={saveDescription}
                    maxLength={500}
                    rows={2}
                    placeholder="Descripción breve (opcional)"
                    className="w-full text-sm text-slate-600 bg-transparent focus:outline-none focus:bg-slate-50 rounded-lg px-2 -mx-2 py-1 resize-none"
                />

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Categoría
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {CATEGORY_ORDER.map((cat) => {
                                const m = CATEGORY_META[cat];
                                const selected = cat === category;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => changeCategory(cat)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                                            selected
                                                ? `${m.bg} ${m.color} ${m.border}`
                                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        {m.icon}
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={toggleActive}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors w-full sm:w-auto"
                        >
                            <div
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                                    isActive ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                            >
                                <div
                                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                                        isActive ? "translate-x-5" : "translate-x-0"
                                    }`}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                                {isActive ? "Activo" : "Inactivo"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <ClipboardCheck className={`w-4 h-4 ${meta.color}`} />
                        Pasos
                        <span className="text-slate-400 text-sm font-medium">
                            ({detail.steps.length})
                        </span>
                    </h3>
                    <button
                        type="button"
                        onClick={onAddStep}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e60012] text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar paso
                    </button>
                </div>

                {detail.steps.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        Todavía no hay pasos. Agregá el primero con el botón de arriba.
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={detail.steps.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {detail.steps.map((step) => (
                                    <SortableStepItem
                                        key={step.id}
                                        step={step}
                                        onEdit={onEditStep}
                                        onToggleRequired={onToggleRequired}
                                        onDelete={onDeleteStep}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                <p className="text-[10px] text-slate-400 mt-3 text-center">
                    Tocá un paso para editarlo · mantené presionado el handle para reordenar
                </p>
            </div>
        </div>
    );
}

// ─── Empty State ────────────────────────────────────────────────────────────

interface EmptyStateProps {
    onCreate: () => void;
    onSeed: () => Promise<void>;
    seeding: boolean;
}

function EmptyState({ onCreate, onSeed, seeding }: EmptyStateProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
                Todavía no hay checklists
            </h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                Creá el primero con el botón + o cargá los 4 checklists de ejemplo
                para tener una base lista para editar.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e60012] text-white rounded-xl font-bold hover:bg-red-700 transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Crear checklist
                </button>
                <button
                    type="button"
                    onClick={onSeed}
                    disabled={seeding}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                    {seeding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <BookOpen className="w-4 h-4" />
                    )}
                    {seeding ? "Cargando..." : "Cargar checklists de ejemplo"}
                </button>
            </div>
        </div>
    );
}
