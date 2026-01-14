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
    Package
} from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
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
        setFormIsActive(category.isActive);
        setShowForm(true);
        setError("");
    }

    function startNew() {
        setEditingId(null);
        setFormName("");
        setFormDescription("");
        setFormIsActive(true);
        setShowForm(true);
        setError("");
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setFormName("");
        setFormDescription("");
        setError("");
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

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formIsActive}
                                onChange={(e) => setFormIsActive(e.target.checked)}
                                className="w-5 h-5 text-moovy rounded"
                            />
                            <span className="text-sm text-gray-700">Categoría activa</span>
                        </label>

                        <div className="flex gap-3 pt-2">
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
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {categories.map((category) => (
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

