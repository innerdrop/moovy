"use client";

// Admin Categories Page - Gestión de Categorías
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
    ArrowDown
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Categorías</h1>
                    <p className="text-gray-600">Organiza tus productos por categorías</p>
                </div>
                <button
                    onClick={startNew}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Categoría
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-moovy">
                    <h2 className="font-bold text-navy mb-4">
                        {editingId ? "Editar Categoría" : "Nueva Categoría"}
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Ej: Lácteos"
                                className="input"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Descripción opcional"
                                className="input"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Icono
                            </label>

                            <div className="border border-gray-200 rounded-lg p-3">
                                {formIcon ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 p-2">
                                            {getCategoryIcon(formIcon)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 capitalize">{formIcon}</p>
                                            <button
                                                type="button"
                                                onClick={() => setFormIcon("")}
                                                className="text-xs text-red-500 hover:text-red-700 mt-0.5"
                                            >
                                                Quitar icono
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowIconSelector(true)}
                                            className="text-sm text-moovy font-medium hover:underline"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowIconSelector(true)}
                                        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-moovy hover:text-moovy transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Seleccionar Icono
                                    </button>
                                )}
                            </div>

                            {/* Icon Selector Modal (Embedded) */}
                            {showIconSelector && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                                        <div className="p-4 border-b flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">Seleccionar Icono</h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowIconSelector(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="p-4">
                                            {/* Search */}
                                            <div className="relative mb-4">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar icono..."
                                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-moovy"
                                                    onChange={(e) => {
                                                        const term = e.target.value.toLowerCase();
                                                        // Simple filter visual implementation
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
                                                {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormIcon(key);
                                                            setShowIconSelector(false);
                                                        }}
                                                        className={`aspect-square flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all ${formIcon === key
                                                            ? "border-moovy bg-moovy-light/20 shadow-sm ring-1 ring-moovy"
                                                            : "border-gray-100 hover:bg-gray-50 hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <div className="w-8 h-8">
                                                            {icon}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 truncate w-full text-center capitalize">
                                                            {key}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer mt-4">
                            <input
                                type="checkbox"
                                checked={formIsActive}
                                onChange={(e) => setFormIsActive(e.target.checked)}
                                className="w-5 h-5 text-moovy rounded"
                            />
                            <span className="text-sm text-gray-700">Categoría activa</span>
                        </label>

                        <div className="flex gap-3 pt-4 border-t mt-4">
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="btn-outline flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Check className="w-5 h-5" />
                                )}
                                {editingId ? "Actualizar" : "Crear"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories List */}
            {categories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No hay categorías creadas</p>
                    <button onClick={startNew} className="btn-primary">
                        Crear primera categoría
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Productos
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Orden
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {categories.map((category, index) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-moovy-light rounded-lg flex items-center justify-center">
                                                <Tag className="w-5 h-5 text-moovy" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-navy">{category.name}</p>
                                                <p className="text-sm text-gray-500">/{category.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                                            <Package className="w-4 h-4" />
                                            {category._count?.products || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleActive(category)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${category.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {category.isActive ? "Activa" : "Inactiva"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => moveCategory(index, "up")}
                                                disabled={index === 0}
                                                className={`p-1.5 rounded-lg transition ${index === 0
                                                    ? "text-gray-300 cursor-not-allowed"
                                                    : "text-gray-500 hover:text-moovy hover:bg-moovy-light"
                                                    }`}
                                                title="Subir"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => moveCategory(index, "down")}
                                                disabled={index === categories.length - 1}
                                                className={`p-1.5 rounded-lg transition ${index === categories.length - 1
                                                    ? "text-gray-300 cursor-not-allowed"
                                                    : "text-gray-500 hover:text-moovy hover:bg-moovy-light"
                                                    }`}
                                                title="Bajar"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => startEdit(category)}
                                                className="p-2 text-gray-500 hover:text-moovy hover:bg-moovy-light rounded-lg transition"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id, category.name)}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
    );
}

