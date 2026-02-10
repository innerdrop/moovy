"use client";

// Admin Categories Page - Gestión de Categorías (Drag & Drop Reorder - Optimized Fluidity)
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
    Plus,
    Edit2,
    Trash2,
    Tag,
    Loader2,
    Check,
    X,
    GripVertical,
    Package,
    Search,
    LayoutList
} from "lucide-react";
import { CATEGORY_ICONS, getCategoryIcon } from "@/lib/icons";

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragMoveEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image?: string | null;
    icon?: string | null;
    isActive: boolean;
    order: number;
    _count?: { products: number };
}

// --- Sortable Item Component ---
function SortableCategoryItem({
    category,
    toggleActive,
    startEdit,
    handleDelete
}: {
    category: Category;
    toggleActive: (c: Category) => void;
    startEdit: (c: Category) => void;
    handleDelete: (id: string, name: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-center gap-2 sm:gap-4 relative overflow-hidden ${isDragging ? "shadow-2xl scale-[1.02] ring-2 ring-moovy z-50 opacity-95" : "hover:shadow-md hover:border-moovy/20"} ${!category.isActive ? "opacity-60 grayscale-[0.5]" : ""}`}
        >
            {/* Drag Handle - ONLY this element triggers drag */}
            <div
                {...attributes}
                {...listeners}
                className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-moovy p-2 -m-2 rounded-xl hover:bg-slate-50 transition-colors select-none"
                style={{ touchAction: "none", userSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
            >
                <GripVertical className="w-5 h-5" />
            </div>

            {/* Icon */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 ${category.isActive ? "bg-moovy-light/20 text-moovy" : "bg-slate-100 text-slate-400"}`}>
                {category.icon ? (
                    <div className="w-6 h-6 drop-shadow-sm">
                        {getCategoryIcon(category.icon)}
                    </div>
                ) : (
                    <Tag className="w-6 h-6" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-navy truncate leading-tight">
                        {category.name}
                    </h3>
                    {!category.isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 uppercase tracking-wide">
                            Inactiva
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        <Package className="w-3 h-3" />
                        {category._count?.products || 0}
                    </span>
                    <span className="hidden sm:inline-block truncate max-w-[200px]">
                        {category.description || "Sin descripción"}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
                <button
                    onClick={() => toggleActive(category)}
                    className={`p-2 rounded-xl transition-colors ${category.isActive
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                    title={category.isActive ? "Desactivar" : "Activar"}
                >
                    <Check className={`w-4 h-4 ${category.isActive ? "opacity-100" : "opacity-0"}`} />
                </button>
                <button
                    onClick={() => startEdit(category)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function AdminCategoriasPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state for new/edit
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formIcon, setFormIcon] = useState("");
    const [showIconSelector, setShowIconSelector] = useState(false);
    const [formIsActive, setFormIsActive] = useState(true);
    const [error, setError] = useState("");

    // DnD Sensors - Desktop + Mobile
    // PointerSensor handles mouse/trackpad, TouchSensor handles iOS/Android touch
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // Hold-to-drag on mobile
                tolerance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Custom auto-scroll during drag for native-like experience
    const scrollAnimationRef = useRef<number | null>(null);

    const handleDragMove = useCallback((event: DragMoveEvent) => {
        // Cancel any existing animation frame
        if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
        }

        const { activatorEvent } = event;
        if (!activatorEvent) return;

        // Get touch/pointer position
        let clientY: number;
        if ('touches' in activatorEvent && (activatorEvent as TouchEvent).touches.length > 0) {
            clientY = (activatorEvent as TouchEvent).touches[0].clientY;
        } else if ('clientY' in activatorEvent) {
            clientY = (activatorEvent as PointerEvent).clientY;
        } else {
            return;
        }

        const viewportHeight = window.innerHeight;
        const scrollSpeed = 12; // pixels per frame

        // Scroll zone: top 25% scrolls up, bottom 40% scrolls down
        const topThreshold = viewportHeight * 0.25;
        const bottomThreshold = viewportHeight * 0.60;

        const scroll = () => {
            if (clientY < topThreshold) {
                // Scroll up - faster when closer to edge
                const intensity = 1 - (clientY / topThreshold);
                window.scrollBy(0, -scrollSpeed * intensity * 2);
            } else if (clientY > bottomThreshold) {
                // Scroll down - faster when closer to edge
                const intensity = (clientY - bottomThreshold) / (viewportHeight - bottomThreshold);
                window.scrollBy(0, scrollSpeed * intensity * 2);
            }

            scrollAnimationRef.current = requestAnimationFrame(scroll);
        };

        scroll();
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        // Stop scrolling
        if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
            scrollAnimationRef.current = null;
        }

        handleDragEndInternal(event);
    }, []);

    // Load categories
    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        try {
            const res = await fetch("/api/admin/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        } finally {
            setLoading(false);
        }
    }

    // DnD Handler (internal)
    async function handleDragEndInternal(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Save new order to server
                // We do this after state update for instant feedback (optimistic UI)
                saveOrder(newItems);

                return newItems;
            });
        }
    }

    async function saveOrder(items: Category[]) {
        try {
            const categoryIds = items.map(c => c.id);
            await fetch("/api/admin/categories/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryIds }),
            });
        } catch (error) {
            console.error("Error reordering categories:", error);
            // Ideally revert state here on error
        }
    }

    function startEdit(category: Category) {
        setEditingId(category.id);
        setFormName(category.name);
        setFormDescription(category.description || "");
        setFormIcon(category.icon || "");
        setFormIsActive(category.isActive);
        setShowForm(true);
        setError("");
        setShowIconSelector(false);
    }

    function startNew() {
        setEditingId(null);
        setFormName("");
        setFormDescription("");
        setFormIcon("");
        setFormIsActive(true);
        setShowForm(true);
        setError("");
        setShowIconSelector(false);
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setFormName("");
        setFormDescription("");
        setFormIcon("");
        setError("");
        setShowIconSelector(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formName.trim()) {
            setError("El nombre es requerido");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const url = editingId
                ? `/api/admin/categories/${editingId}`
                : "/api/admin/categories";

            const res = await fetch(url, {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    description: formDescription || null,
                    icon: formIcon || null,
                    isActive: formIsActive,
                }),
            });

            if (res.ok) {
                await loadCategories();
                cancelForm();
            } else {
                const data = await res.json();
                setError(data.error || "Error al guardar");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                await loadCategories();
            } else {
                const data = await res.json();
                alert(data.error || "Error al eliminar");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    }

    async function toggleActive(category: Category) {
        try {
            const isDeactivating = category.isActive; // true means we're about to deactivate

            const res = await fetch(`/api/admin/categories/${category.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !category.isActive }),
            });

            if (res.ok) {
                if (isDeactivating) {
                    // Move to end of list when deactivating
                    setCategories((items) => {
                        const index = items.findIndex((item) => item.id === category.id);
                        if (index === -1) return items;

                        const newItems = [...items];
                        const [removed] = newItems.splice(index, 1);
                        removed.isActive = false; // Update local state
                        newItems.push(removed); // Add to end

                        // Update order in backend
                        const newOrder = newItems.map((c, i) => ({ id: c.id, order: i }));
                        fetch("/api/admin/categories/reorder", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ categories: newOrder }),
                        });

                        return newItems;
                    });
                } else {
                    // Just reload when activating
                    await loadCategories();
                }
            }
        } catch (error) {
            console.error("Error toggling category:", error);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-moovy" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-md z-30 py-4 px-4 md:static md:bg-transparent md:p-0">
                <div>
                    <h1 className="text-2xl font-bold text-navy flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
                            <LayoutList className="w-5 h-5 text-white" />
                        </div>
                        Categorías
                    </h1>
                    <p className="text-slate-500 font-medium text-xs mt-1 ml-1 hidden sm:block">Mantén presionado para reordenar</p>
                </div>
                <button
                    onClick={startNew}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-moovy/20 hover:shadow-moovy/40 transition-shadow rounded-xl px-4 py-2.5 text-sm w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    <span className="font-bold">Nueva Categoría</span>
                </button>
            </div>

            {/* Hint for mobile (if not in header) */}
            <div className="sm:hidden text-center text-xs text-slate-400 font-medium bg-white/50 py-2 rounded-lg border border-slate-100">
                👆 Mantén presionado una tarjeta para moverla
            </div>

            {/* Draggable List */}
            {categories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-navy mb-2">No hay categorías</h3>
                    <p className="text-slate-400 text-sm mb-6">Comienza creando la primera categoría.</p>
                    <button onClick={startNew} className="btn-primary rounded-xl px-4 py-2 text-sm">
                        Crear Categoría
                    </button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    autoScroll={false}
                >
                    <SortableContext
                        items={categories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-3">
                            {categories.map((category) => (
                                <SortableCategoryItem
                                    key={category.id}
                                    category={category}
                                    toggleActive={toggleActive}
                                    startEdit={startEdit}
                                    handleDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Modal Form - Simple like Clientes, Positioned Top */}
            {showForm && (
                <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-10 sm:pt-20 overflow-y-auto" onClick={cancelForm}>
                    <div
                        className="bg-white rounded-xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl relative mb-10 mt-safe animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Simple Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl text-gray-900 tracking-tight">
                                {editingId ? "Editar Categoría" : "Nueva Categoría"}
                            </h3>
                            <button onClick={cancelForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-100 font-medium">{error}</div>}

                        {/* Form */}
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="input w-full bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                    placeholder="Ej: Hamburguesas"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Descripción</label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    className="input w-full resize-none bg-white border-gray-200 focus:border-moovy focus:ring-4 focus:ring-moovy/5 transition-all"
                                    placeholder="Breve descripción..."
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Icono</label>
                                {!showIconSelector ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowIconSelector(true)}
                                        className="w-full flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:border-moovy hover:shadow-sm transition-all text-left"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formIcon ? 'bg-[#e60012]/10 text-[#e60012]' : 'bg-gray-100 text-gray-400'}`}>
                                            {formIcon ? (
                                                <div className="w-6 h-6">{getCategoryIcon(formIcon)}</div>
                                            ) : (
                                                <Plus className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-700">
                                                {formIcon ? formIcon.charAt(0).toUpperCase() + formIcon.slice(1) : 'Seleccionar icono'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Toca para cambiar</p>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-inner">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Iconos Disponibles</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowIconSelector(false)}
                                                className="text-xs text-[#e60012] font-bold hover:underline"
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                            {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormIcon(key);
                                                        setShowIconSelector(false);
                                                    }}
                                                    className={`aspect-square flex items-center justify-center rounded-xl border transition-all ${formIcon === key
                                                        ? 'bg-[#e60012] border-[#e60012] text-white shadow-lg scale-110 z-10'
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-moovy hover:text-moovy'
                                                        }`}
                                                >
                                                    <div className="w-5 h-5">{icon}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div
                                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-gray-200 transition-all active:bg-gray-50"
                                onClick={() => setFormIsActive(!formIsActive)}
                            >
                                <div>
                                    <p className="text-sm font-bold text-gray-700">Visible en la tienda</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase">Estado de activación</p>
                                </div>
                                <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${formIsActive ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${formIsActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-6">
                            <button
                                onClick={cancelForm}
                                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 py-3 bg-[#e60012] text-white rounded-xl font-bold hover:bg-[#c5000f] shadow-xl shadow-moovy/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {editingId ? 'Guardar Cambios' : 'Crear Categoría'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
