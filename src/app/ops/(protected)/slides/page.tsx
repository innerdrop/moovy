"use client";

// Admin Slides Page - Gestión de Hero Slider
import { useState, useEffect, useRef } from "react";
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Image as ImageIcon,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeOff,
    Save,
    X,
    Upload
} from "lucide-react";

interface Slide {
    id: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    gradient: string;
    image: string | null;
    isActive: boolean;
    order: number;
}

const GRADIENT_OPTIONS = [
    { name: "Rojo Moovy", value: "from-[#e60012] via-[#ff2a3a] to-[#ff6b6b]" },
    { name: "Naranja", value: "from-[#ff6b35] via-[#ff8c42] to-[#ffba69]" },
    { name: "Rojo Oscuro", value: "from-[#e60012] via-[#c70010] to-[#a5000d]" },
    { name: "Azul", value: "from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa]" },
    { name: "Verde", value: "from-[#065f46] via-[#10b981] to-[#34d399]" },
    { name: "Morado", value: "from-[#581c87] via-[#9333ea] to-[#c084fc]" },
];

export default function AdminSlidesPage() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formSubtitle, setFormSubtitle] = useState("");
    const [formButtonText, setFormButtonText] = useState("");
    const [formButtonLink, setFormButtonLink] = useState("");
    const [formGradient, setFormGradient] = useState(GRADIENT_OPTIONS[0].value);
    const [formImage, setFormImage] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);
    const [error, setError] = useState("");

    // Image upload state
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSlides();
    }, []);

    async function loadSlides() {
        try {
            const res = await fetch("/api/admin/slides");
            if (res.ok) {
                const data = await res.json();
                setSlides(data);
            }
        } catch (error) {
            console.error("Error loading slides:", error);
        } finally {
            setLoading(false);
        }
    }

    function startEdit(slide: Slide) {
        setEditingId(slide.id);
        setFormTitle(slide.title);
        setFormSubtitle(slide.subtitle);
        setFormButtonText(slide.buttonText);
        setFormButtonLink(slide.buttonLink);
        setFormGradient(slide.gradient);
        setFormImage(slide.image || "");
        setFormIsActive(slide.isActive);
        setShowForm(true);
        setError("");
    }

    function startNew() {
        setEditingId(null);
        setFormTitle("");
        setFormSubtitle("");
        setFormButtonText("Ver más");
        setFormButtonLink("/productos");
        setFormGradient(GRADIENT_OPTIONS[0].value);
        setFormImage("");
        setFormIsActive(true);
        setShowForm(true);
        setError("");
    }

    // Handle image upload
    async function handleImageUpload(file: File) {
        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/slides/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setFormImage(data.url);
            } else {
                const data = await res.json();
                setError(data.error || "Error al subir la imagen");
            }
        } catch (error) {
            setError("Error de conexión al subir imagen");
        } finally {
            setUploading(false);
        }
    }

    function handleFileDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handleImageUpload(file);
        } else {
            setError("Solo se permiten archivos de imagen");
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setFormTitle("");
        setFormSubtitle("");
        setFormButtonText("");
        setFormButtonLink("");
        setFormImage("");
        setError("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formTitle.trim()) {
            setError("El título es requerido");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const payload = {
                id: editingId,
                title: formTitle,
                subtitle: formSubtitle,
                buttonText: formButtonText,
                buttonLink: formButtonLink,
                gradient: formGradient,
                image: formImage || null,
                isActive: formIsActive,
            };

            const res = await fetch("/api/admin/slides", {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await loadSlides();
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

    async function handleDelete(id: string, title: string) {
        if (!confirm(`¿Eliminar el slide "${title}"?`)) return;

        try {
            const res = await fetch(`/api/admin/slides?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                await loadSlides();
            }
        } catch (error) {
            console.error("Error deleting slide:", error);
        }
    }

    async function toggleActive(slide: Slide) {
        try {
            const res = await fetch("/api/admin/slides", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: slide.id, isActive: !slide.isActive }),
            });

            if (res.ok) {
                await loadSlides();
            }
        } catch (error) {
            console.error("Error toggling slide:", error);
        }
    }

    async function moveSlide(index: number, direction: "up" | "down") {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= slides.length) return;

        const newSlides = [...slides];
        [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
        setSlides(newSlides);

        try {
            const slideIds = newSlides.map(s => s.id);
            await fetch("/api/admin/slides/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slideIds }),
            });
        } catch (error) {
            console.error("Error reordering slides:", error);
            await loadSlides();
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
                    <h1 className="text-2xl font-bold text-navy">Hero Slider</h1>
                    <p className="text-gray-600">Administra las diapositivas del carrusel principal</p>
                </div>
                <button
                    onClick={startNew}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Slide
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-moovy">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-navy">
                            {editingId ? "Editar Slide" : "Nuevo Slide"}
                        </h2>
                        <button onClick={cancelForm} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moovy focus:border-transparent"
                                    placeholder="Ej: Delivery Rápido"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subtítulo
                                </label>
                                <input
                                    type="text"
                                    value={formSubtitle}
                                    onChange={(e) => setFormSubtitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moovy focus:border-transparent"
                                    placeholder="Ej: Llevamos tu antojo donde estés"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Texto del Botón
                                </label>
                                <input
                                    type="text"
                                    value={formButtonText}
                                    onChange={(e) => setFormButtonText(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moovy focus:border-transparent"
                                    placeholder="Ej: Ver más"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Enlace del Botón
                                </label>
                                <input
                                    type="text"
                                    value={formButtonLink}
                                    onChange={(e) => setFormButtonLink(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moovy focus:border-transparent"
                                    placeholder="Ej: /productos"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Imagen del Slide
                                </label>

                                {/* Drop zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleFileDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${dragOver
                                        ? "border-moovy bg-moovy-light"
                                        : "border-gray-300 hover:border-gray-400"
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-moovy" />
                                            <p className="text-sm text-gray-600">Subiendo imagen...</p>
                                        </div>
                                    ) : formImage ? (
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={formImage}
                                                alt="Preview"
                                                className="w-24 h-24 object-contain rounded-lg bg-gray-100"
                                            />
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium text-gray-900">Imagen cargada</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{formImage}</p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setFormImage(""); }}
                                                    className="mt-2 text-xs text-red-500 hover:text-red-700"
                                                >
                                                    Quitar imagen
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-8 h-8 text-gray-400" />
                                            <p className="text-sm text-gray-600">
                                                Arrastra una imagen o <span className="text-moovy font-medium">haz click</span> para seleccionar
                                            </p>
                                            <p className="text-xs text-gray-400">JPG, PNG, WEBP o GIF (máx. 5MB)</p>
                                        </div>
                                    )}
                                </div>

                                {/* Or URL input */}
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 mb-1">O pega una URL:</p>
                                    <input
                                        type="text"
                                        value={formImage}
                                        onChange={(e) => setFormImage(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-moovy focus:border-transparent"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Color de Fondo
                                </label>
                                <select
                                    value={formGradient}
                                    onChange={(e) => setFormGradient(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moovy focus:border-transparent"
                                >
                                    {GRADIENT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vista Previa
                            </label>
                            <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${formGradient} p-6`}>
                                <div className="flex items-center min-h-[120px]">
                                    <div className="flex-1 text-white">
                                        <h3 className="text-xl font-bold">{formTitle || "Título"}</h3>
                                        <p className="text-sm opacity-90">{formSubtitle || "Subtítulo"}</p>
                                        <button className="mt-2 px-4 py-1 bg-white text-gray-800 rounded-full text-sm font-medium">
                                            {formButtonText || "Botón"}
                                        </button>
                                    </div>
                                    {formImage && (
                                        <img src={formImage} alt="Preview" className="w-24 h-24 object-contain" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer mt-4">
                            <input
                                type="checkbox"
                                checked={formIsActive}
                                onChange={(e) => setFormIsActive(e.target.checked)}
                                className="w-5 h-5 text-moovy rounded"
                            />
                            <span className="text-sm text-gray-700">Slide activo</span>
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
                                    <Save className="w-5 h-5" />
                                )}
                                {editingId ? "Guardar Cambios" : "Crear Slide"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Slides List */}
            {slides.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No hay slides creados</p>
                    <button onClick={startNew} className="btn-primary">
                        Crear primer slide
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={`bg-white rounded-xl shadow-sm overflow-hidden border ${slide.isActive ? "border-gray-100" : "border-gray-300 opacity-60"}`}
                        >
                            {/* Mobile: Stacked layout */}
                            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
                                {/* Preview thumbnail */}
                                <div className={`w-full md:w-32 h-24 md:h-20 rounded-lg bg-gradient-to-r ${slide.gradient} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                                    {slide.image ? (
                                        <img src={slide.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-white/50" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-navy truncate">{slide.title}</h3>
                                    <p className="text-sm text-gray-500 truncate">{slide.subtitle}</p>
                                    <p className="text-xs text-gray-400 mt-1 hidden md:block">
                                        Botón: {slide.buttonText} → {slide.buttonLink}
                                    </p>
                                </div>

                                {/* Actions row - always visible */}
                                <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-0">
                                    {/* Order controls */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => moveSlide(index, "up")}
                                            disabled={index === 0}
                                            className={`p-2 rounded-lg transition ${index === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-moovy hover:bg-moovy-light"}`}
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveSlide(index, "down")}
                                            disabled={index === slides.length - 1}
                                            className={`p-2 rounded-lg transition ${index === slides.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-moovy hover:bg-moovy-light"}`}
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => toggleActive(slide)}
                                            className={`p-2 rounded-lg transition ${slide.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                            title={slide.isActive ? "Desactivar" : "Activar"}
                                        >
                                            {slide.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => startEdit(slide)}
                                            className="p-2 text-gray-500 hover:text-moovy hover:bg-moovy-light rounded-lg transition"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(slide.id, slide.title)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
