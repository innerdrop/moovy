"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Upload,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageDesktop: string | null;
  imageMobile: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function HeroPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState<{
    [key: string]: boolean;
  }>({});

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    buttonText: "Ver más",
    buttonLink: "/productos",
    imageDesktop: "" as string | null,
    imageMobile: "" as string | null,
    isActive: true,
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await fetch("/api/admin/slides");
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch (error) {
      console.error("Error fetching slides:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "imageDesktop" | "imageMobile"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show upload indicator
    const uploadKey = `${editingId || "new"}-${fieldName}`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          [fieldName]: data.url,
        }));
      } else {
        const error = await res.json();
        alert(`Error al subir imagen: ${error.error}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir imagen");
    } finally {
      setUploading((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      alert("El título es requerido");
      return;
    }

    if (!formData.imageDesktop && !formData.imageMobile) {
      alert("Debes subir al menos una imagen (desktop o mobile)");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/slides`
        : `/api/admin/slides`;

      const method = editingId ? "PATCH" : "POST";
      const body = editingId
        ? { ...formData, id: editingId }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        fetchSlides();
        setShowForm(false);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving slide:", error);
      alert("Error al guardar slide");
    }
  };

  const handleEdit = (slide: Slide) => {
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
      imageDesktop: slide.imageDesktop,
      imageMobile: slide.imageMobile,
      isActive: slide.isActive,
    });
    setEditingId(slide.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este slide?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/slides?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSlides();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting slide:", error);
      alert("Error al eliminar slide");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      buttonText: "Ver más",
      buttonLink: "/productos",
      imageDesktop: null,
      imageMobile: null,
      isActive: true,
    });
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#e60012] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ops"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-gray-900">
                  Banners de Inicio
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gestiona los banners de imagen que aparecen en la página de
                  inicio
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 bg-[#e60012] text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-[#cc000f] transition"
            >
              <Plus className="w-5 h-5" />
              Nuevo Banner
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {editingId ? "Editar Banner" : "Nuevo Banner"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ej: Pedí ahora"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para accesibilidad y SEO
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="Ej: Envío rápido a Ushuaia"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para SEO (meta description)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Texto del botón
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonText: e.target.value })
                    }
                    placeholder="Ej: Explorar"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link del botón
                  </label>
                  <input
                    type="text"
                    value={formData.buttonLink}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonLink: e.target.value })
                    }
                    placeholder="Ej: /productos"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-[#e60012] rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Activo
                    </span>
                  </label>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="border-t pt-8">
                <h3 className="text-xl font-black text-gray-900 mb-6">
                  Imágenes del Banner
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Desktop Image */}
                  <div>
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Banner Desktop
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">
                          1440 × 500 px | WebP/JPG | Máx 300 KB
                        </p>

                        <label className="inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(e, "imageDesktop")
                            }
                            disabled={
                              uploading[`${editingId || "new"}-imageDesktop`]
                            }
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              (e.target as HTMLLabelElement)
                                .querySelector("input")
                                ?.click();
                            }}
                            disabled={
                              uploading[`${editingId || "new"}-imageDesktop`]
                            }
                            className="px-4 py-2 bg-[#e60012] text-white rounded-lg font-semibold text-sm hover:bg-[#cc000f] transition disabled:opacity-50"
                          >
                            {uploading[`${editingId || "new"}-imageDesktop`]
                              ? "Subiendo..."
                              : "Seleccionar imagen"}
                          </button>
                        </label>

                        <a
                          href="https://www.canva.com/design/create?width=1440&height=500&units=px"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#e60012] font-semibold text-sm mt-3 hover:underline"
                        >
                          Diseñar en Canva
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {formData.imageDesktop && (
                        <div className="mt-4 pt-4 border-t">
                          <img
                            src={formData.imageDesktop}
                            alt="Desktop preview"
                            className="w-full h-auto rounded-lg max-h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                imageDesktop: null,
                              })
                            }
                            className="mt-2 text-red-600 text-sm font-semibold hover:underline"
                          >
                            Eliminar imagen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Image */}
                  <div>
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Banner Mobile
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">
                          800 × 800 px | WebP/JPG | Máx 300 KB
                        </p>

                        <label className="inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(e, "imageMobile")
                            }
                            disabled={
                              uploading[`${editingId || "new"}-imageMobile`]
                            }
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              (e.target as HTMLLabelElement)
                                .querySelector("input")
                                ?.click();
                            }}
                            disabled={
                              uploading[`${editingId || "new"}-imageMobile`]
                            }
                            className="px-4 py-2 bg-[#e60012] text-white rounded-lg font-semibold text-sm hover:bg-[#cc000f] transition disabled:opacity-50"
                          >
                            {uploading[`${editingId || "new"}-imageMobile`]
                              ? "Subiendo..."
                              : "Seleccionar imagen"}
                          </button>
                        </label>

                        <a
                          href="https://www.canva.com/design/create?width=800&height=800&units=px"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#e60012] font-semibold text-sm mt-3 hover:underline"
                        >
                          Diseñar en Canva
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {formData.imageMobile && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="w-32 mx-auto">
                            <img
                              src={formData.imageMobile}
                              alt="Mobile preview"
                              className="w-full h-auto rounded-lg max-h-48 object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                imageMobile: null,
                              })
                            }
                            className="mt-2 w-full text-red-600 text-sm font-semibold hover:underline"
                          >
                            Eliminar imagen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-8 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-[#e60012] text-white py-3 rounded-xl font-bold hover:bg-[#cc000f] transition"
                >
                  {editingId ? "Actualizar Banner" : "Crear Banner"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Slides List */}
        {slides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 overflow-hidden relative">
                  {slide.imageMobile || slide.imageDesktop ? (
                    <img
                      src={slide.imageMobile || slide.imageDesktop || ""}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                  {!slide.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        Inactivo
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate">
                    {slide.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {slide.subtitle}
                  </p>

                  {/* Badges */}
                  <div className="flex gap-2 mt-3 mb-4">
                    {slide.imageDesktop && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                        Desktop
                      </span>
                    )}
                    {slide.imageMobile && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                        Mobile
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(slide)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-2">
              Sin banners aún
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Crea tu primer banner para que aparezca en la página de inicio
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-[#e60012] text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-[#cc000f] transition"
            >
              <Plus className="w-4 h-4" />
              Crear Banner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
