"use client";

// Admin Categories Page - Gestión de Categorías (Apple Style Redesign - Refined Typography - Smaller Cards)
import { useState, useEffect } from "react";
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
    ArrowUp,
    ArrowDown,
    LayoutGrid,
    List,
    Clock
} from "lucide-react";
import { CATEGORY_ICONS, getCategoryIcon } from "@/lib/icons";

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
            const res = await fetch(`/api/admin/categories/${category.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !category.isActive }),
            });

            if (res.ok) {
                await loadCategories();
            }
        } catch (error) {
            console.error("Error toggling category:", error);
        }
    }

    async function moveCategory(index: number, direction: "up" | "down") {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        // Swap categories in the array
        const newCategories = [...categories];
        [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

        // Update local state immediately for responsive UI
        setCategories(newCategories);

        // Save new order to server
        try {
            const categoryIds = newCategories.map(c => c.id);
            await fetch("/api/admin/categories/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryIds }),
            });
        } catch (error) {
            console.error("Error reordering categories:", error);
            // Reload original order on error
            await loadCategories();
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
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
                            <Tag className="w-5 h-5 text-white" />
                        </div>
                        Categorías
                    </h1>
                    <p className="text-slate-500 font-medium text-xs mt-1 ml-1">Gestioná las colecciones de tu tienda</p>
                </div>
                <button
                    onClick={startNew}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-moovy/20 hover:shadow-moovy/40 transition-shadow rounded-xl px-4 py-2.5 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="font-bold">Nueva Categoría</span>
                </button>
            </div>

            {/* Categories Grid - Smaller Cards Layout */}
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {categories.map((category, index) => (
                        <div
                            key={category.id}
                            className={`group bg-white rounded-3xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col relative overflow-hidden h-full ${!category.isActive ? "opacity-60 grayscale-[0.5]" : ""}`}
                        >
                            {/* Decorative Background */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent -mr-8 -mt-8 rounded-full transition-transform duration-500 group-hover:scale-110 opacity-50`} />

                            <div className="flex items-start justify-between mb-3 relative z-10">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:-rotate-6 ${category.isActive ? "bg-moovy-light/30 text-moovy" : "bg-slate-100 text-slate-400"}`}>
                                    {category.icon ? (
                                        <div className="w-5 h-5 drop-shadow-sm">
                                            {getCategoryIcon(category.icon)}
                                        </div>
                                    ) : (
                                        <Tag className="w-5 h-5" />
                                    )}
                                </div>

                                {/* Order Controls - Compact */}
                                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveCategory(index, "up"); }}
                                        disabled={index === 0}
                                        className={`p-1 rounded transition-colors ${index === 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-300 hover:bg-slate-100 hover:text-moovy"}`}
                                    >
                                        <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveCategory(index, "down"); }}
                                        disabled={index === categories.length - 1}
                                        className={`p-1 rounded transition-colors ${index === categories.length - 1 ? "text-slate-200 cursor-not-allowed" : "text-slate-300 hover:bg-slate-100 hover:text-moovy"}`}
                                    >
                                        <ArrowDown className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3 flex-1 relative z-10">
                                <h3 className="text-base font-bold text-navy leading-tight mb-1 group-hover:text-moovy transition-colors tracking-tight line-clamp-1" title={category.name}>
                                    {category.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 inline-flex">
                                        <Package className="w-3 h-3" />
                                        {category._count?.products || 0}
                                    </span>
                                    {!category.isActive && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-500">
                                            Inactiva
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 pt-3 border-t border-slate-50 relative z-10 mt-auto">
                                <button
                                    onClick={() => toggleActive(category)}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${category.isActive
                                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                >
                                    {category.isActive ? "Activa" : "Activar"}
                                </button>
                                <button
                                    onClick={() => startEdit(category)}
                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id, category.name)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-slideUp">
                        <div className="p-6 flex items-center justify-between border-b border-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-navy tracking-tight">
                                    {editingId ? "Editar Categoría" : "Nueva Categoría"}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Detalles de la colección</p>
                            </div>
                            <button
                                onClick={cancelForm}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-navy transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-navy mb-1.5 pl-1">
                                        Nombre de la Categoría
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Ej: Hamburguesas"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-navy focus:ring-2 focus:ring-moovy focus:outline-none transition-all placeholder:text-slate-400"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-navy mb-1.5 pl-1">
                                        Descripción (Opcional)
                                    </label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Breve descripción..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-navy focus:ring-2 focus:ring-moovy focus:outline-none transition-all placeholder:text-slate-400 resize-none"
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-navy mb-1.5 pl-1">
                                        Icono Representativo
                                    </label>

                                    <div className="border border-slate-100 rounded-xl p-3 bg-white shadow-sm">
                                        {formIcon ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-moovy-light/20 rounded-xl flex items-center justify-center border border-moovy/20">
                                                    <div className="w-6 h-6 text-moovy">
                                                        {getCategoryIcon(formIcon)}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-navy capitalize mb-0.5">{formIcon}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormIcon("")}
                                                        className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        Eliminar icono
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowIconSelector(true)}
                                                    className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-navy hover:bg-slate-100 transition-colors"
                                                >
                                                    Cambiar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowIconSelector(true)}
                                                className="w-full py-4 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-moovy hover:text-moovy hover:bg-moovy-light/5 transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold">Seleccionar Icono</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Icon Selector Nested Modal */}
                                    {showIconSelector && (
                                        <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-xl rounded-3xl flex flex-col animate-fadeIn">
                                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
                                                <h3 className="font-bold text-navy text-lg">Iconos</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowIconSelector(false)}
                                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-5 overflow-y-auto flex-1">
                                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                                    {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormIcon(key);
                                                                setShowIconSelector(false);
                                                            }}
                                                            className={`aspect-square flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-300 group ${formIcon === key
                                                                ? "border-moovy bg-moovy text-white shadow-lg shadow-moovy/30 scale-105"
                                                                : "border-slate-100 bg-white text-slate-400 hover:border-moovy/30 hover:shadow-md hover:-translate-y-1"
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 transition-transform duration-300 ${formIcon !== key ? "group-hover:scale-110" : ""}`}>
                                                                {icon}
                                                            </div>
                                                            <span className="text-[9px] font-semibold uppercase tracking-wide truncate w-full text-center">
                                                                {key}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer" onClick={() => setFormIsActive(!formIsActive)}>
                                    <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${formIsActive ? "bg-green-500" : "bg-slate-300"}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${formIsActive ? "translate-x-4" : "translate-x-0"}`} />
                                    </div>
                                    <span className="text-xs font-bold text-navy select-none">
                                        Visible en la tienda
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                    <button
                                        type="button"
                                        onClick={cancelForm}
                                        className="py-3 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn-primary py-3 px-4 rounded-xl text-xs font-bold shadow-lg shadow-moovy/20 flex items-center justify-center gap-2 hover:shadow-moovy/40 hover:-translate-y-0.5 transition-all"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        {editingId ? "Guardar" : "Crear"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
