"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  Loader2,
  X,
  Eye,
  EyeOff,
  Save,
  Monitor,
  Smartphone,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import UploadImage from "@/components/ui/UploadImage";
import PromoBanner, { type PromoSlide } from "@/components/home/PromoBanner";

const CTA_POSITIONS = [
  { value: "arriba-izquierda", label: "Arriba izq" },
  { value: "arriba-centro", label: "Arriba centro" },
  { value: "arriba-derecha", label: "Arriba der" },
  { value: "centro-izquierda", label: "Centro izq" },
  { value: "centro", label: "Centro" },
  { value: "centro-derecha", label: "Centro der" },
  { value: "abajo-izquierda", label: "Abajo izq" },
  { value: "abajo-centro", label: "Abajo centro" },
  { value: "abajo-derecha", label: "Abajo der" },
] as const;

const POSITION_GRID = [
  ["arriba-izquierda", "arriba-centro", "arriba-derecha"],
  ["centro-izquierda", "centro", "centro-derecha"],
  ["abajo-izquierda", "abajo-centro", "abajo-derecha"],
] as const;

function generateId() {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptySlide(order: number): PromoSlide {
  return {
    id: generateId(),
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "/",
    image: null,
    ctaPosition: "abajo-izquierda",
    enabled: true,
    order,
  };
}

export default function PromoBannerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [slides, setSlides] = useState<PromoSlide[]>([]);
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetSlideId = useRef<string | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setGlobalEnabled(data.promoBannerEnabled ?? true);

      let parsedSlides: PromoSlide[] = [];
      if (data.promoSlidesJson) {
        try {
          const arr = JSON.parse(data.promoSlidesJson);
          if (Array.isArray(arr) && arr.length > 0) parsedSlides = arr;
        } catch { /* ignore */ }
      }

      if (parsedSlides.length === 0) {
        const hasLegacy = data.promoBannerTitle || data.promoBannerSubtitle || data.promoBannerImage || data.promoBannerButtonText;
        if (hasLegacy) {
          parsedSlides = [{
            id: generateId(),
            title: data.promoBannerTitle || "",
            subtitle: data.promoBannerSubtitle || "",
            buttonText: data.promoBannerButtonText || "",
            buttonLink: data.promoBannerButtonLink || "/",
            image: data.promoBannerImage || null,
            ctaPosition: data.promoBannerCtaPosition || "abajo-izquierda",
            enabled: true,
            order: 0,
          }];
        }
      }

      setSlides(parsedSlides);
      if (parsedSlides.length > 0) setExpandedSlideId(parsedSlides[0].id);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setToast({ message: "Error al cargar la configuración", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const addSlide = () => {
    const newSlide = createEmptySlide(slides.length);
    setSlides((prev) => [...prev, newSlide]);
    setExpandedSlideId(newSlide.id);
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
    if (expandedSlideId === id) {
      setExpandedSlideId(slides.length > 1 ? slides.find((s) => s.id !== id)?.id || null : null);
    }
  };

  const duplicateSlide = (id: string) => {
    const source = slides.find((s) => s.id === id);
    if (!source) return;
    const newSlide: PromoSlide = { ...source, id: generateId(), title: source.title ? `${source.title} (copia)` : "", order: slides.length };
    setSlides((prev) => [...prev, newSlide]);
    setExpandedSlideId(newSlide.id);
  };

  const updateSlide = (id: string, field: keyof PromoSlide, value: any) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const moveSlide = (id: string, direction: "up" | "down") => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy.map((s, i) => ({ ...s, order: i }));
    });
  };

  const triggerImageUpload = (slideId: string) => {
    uploadTargetSlideId.current = slideId;
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slideId = uploadTargetSlideId.current;
    if (!file || !slideId) return;
    if (!file.type.startsWith("image/")) { setToast({ message: "Por favor, seleccioná un archivo de imagen", type: "error" }); return; }
    if (file.size > 10 * 1024 * 1024) { setToast({ message: "La imagen no debe pesar más de 10MB", type: "error" }); return; }

    setUploadingSlideId(slideId);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/promo/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        updateSlide(slideId, "image", data.url);
        setToast({ message: "Imagen subida correctamente", type: "success" });
      } else {
        const error = await res.json();
        setToast({ message: error.error || "Error al subir la imagen", type: "error" });
      }
    } catch { setToast({ message: "Error al subir la imagen", type: "error" }); }
    finally {
      setUploadingSlideId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoBannerEnabled: globalEnabled, promoSlidesJson: JSON.stringify(slides) }),
      });
      if (res.ok) setToast({ message: "Banners guardados correctamente", type: "success" });
      else { const error = await res.json(); setToast({ message: error.error || "Error al guardar", type: "error" }); }
    } catch { setToast({ message: "Error al guardar los cambios", type: "error" }); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const enabledSlides = slides.filter((s) => s.enabled !== false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ops/dashboard"><ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" /></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Banner Promocional</h1>
              <p className="text-xs text-gray-500">{slides.length} slide{slides.length !== 1 ? "s" : ""} — {enabledSlides.length} activo{enabledSlides.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#e60012] hover:bg-[#cc000f] disabled:bg-gray-300 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-xl text-white font-medium z-50 shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left: Slide List + Editor (3 cols) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Global Toggle */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className={`relative w-14 h-8 rounded-full transition-colors ${globalEnabled ? "bg-[#e60012]" : "bg-gray-300"}`} onClick={() => setGlobalEnabled(!globalEnabled)}>
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${globalEnabled ? "translate-x-6" : ""}`} />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900">{globalEnabled ? "Carrusel activo" : "Carrusel inactivo"}</span>
                  <p className="text-xs text-gray-500">El carrusel se muestra en la página de inicio</p>
                </div>
              </label>
            </div>

            {/* Slide Cards */}
            {slides.map((slide, idx) => {
              const isExpanded = expandedSlideId === slide.id;
              const isUploading = uploadingSlideId === slide.id;
              return (
                <div key={slide.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${isExpanded ? "border-[#e60012]/30 ring-1 ring-[#e60012]/10" : "border-gray-100"}`}>
                  {/* Slide Header */}
                  <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpandedSlideId(isExpanded ? null : slide.id)}>
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      {slide.image ? <UploadImage src={slide.image} alt="" fill className="object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 truncate">{slide.title?.trim() || `Slide ${idx + 1}`}</span>
                        {slide.enabled === false && <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">OCULTO</span>}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{slide.subtitle?.trim() || (slide.image ? "Solo imagen" : "Sin contenido")}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => moveSlide(slide.id, "up")} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-50" title="Mover arriba"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveSlide(slide.id, "down")} disabled={idx === slides.length - 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-50" title="Mover abajo"><ChevronDown className="w-4 h-4" /></button>
                      <button onClick={() => updateSlide(slide.id, "enabled", !slide.enabled)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" title={slide.enabled !== false ? "Ocultar" : "Activar"}>
                        {slide.enabled !== false ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => duplicateSlide(slide.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" title="Duplicar"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => removeSlide(slide.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Expanded Editor */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                      {/* Image */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen</label>
                        <p className="text-xs text-gray-400 mb-3">Medida recomendada: <strong className="text-gray-600">1200 x 400 px</strong> (ratio 3:1)</p>
                        {slide.image ? (
                          <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
                            <div className="relative w-full aspect-[3/1]"><UploadImage src={slide.image} alt="Preview" fill className="object-cover" /></div>
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button onClick={() => triggerImageUpload(slide.id)} className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg transition shadow-sm" title="Cambiar"><Upload className="w-3.5 h-3.5" /></button>
                              <button onClick={() => updateSlide(slide.id, "image", null)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition shadow-sm" title="Quitar"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => triggerImageUpload(slide.id)} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isUploading ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-[#e60012] hover:bg-red-50/30"}`}>
                            {isUploading ? <Loader2 className="w-8 h-8 text-[#e60012] mx-auto mb-2 animate-spin" /> : <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />}
                            <p className="text-sm font-semibold text-gray-700">{isUploading ? "Subiendo..." : "Subir imagen"}</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — máx 10MB</p>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título</label>
                        <textarea value={slide.title || ""} onChange={(e) => updateSlide(slide.id, "title", e.target.value)} placeholder="Ej: Noches de Pizza & Pelis" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] resize-none text-sm" rows={2} />
                        <p className="mt-1 text-xs text-gray-400">Usá \n para saltos de línea</p>
                      </div>

                      {/* Subtitle */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtítulo</label>
                        <input type="text" value={slide.subtitle || ""} onChange={(e) => updateSlide(slide.id, "subtitle", e.target.value)} placeholder="Ej: 2x1 en locales seleccionados" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] text-sm" />
                      </div>

                      {/* Button fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Texto del botón</label>
                          <input type="text" value={slide.buttonText || ""} onChange={(e) => updateSlide(slide.id, "buttonText", e.target.value)} placeholder="Ej: Ver locales" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL del botón</label>
                          <input type="text" value={slide.buttonLink || ""} onChange={(e) => updateSlide(slide.id, "buttonLink", e.target.value)} placeholder="Ej: /productos?categoria=pizzas" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] text-sm" />
                        </div>
                      </div>

                      {/* CTA Position */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Posición del contenido</label>
                        <div className="flex items-center gap-4">
                          <div className="inline-block border border-gray-200 rounded-xl overflow-hidden">
                            {POSITION_GRID.map((row, rowIdx) => (
                              <div key={rowIdx} className="flex">
                                {row.map((pos) => (
                                  <button key={pos} type="button" onClick={() => updateSlide(slide.id, "ctaPosition", pos)} className={`w-12 h-9 border border-gray-100 flex items-center justify-center transition-all ${slide.ctaPosition === pos ? "bg-[#e60012] shadow-inner" : "bg-gray-50 hover:bg-gray-100"}`}>
                                    <div className={`w-2.5 h-2.5 rounded-full ${slide.ctaPosition === pos ? "bg-white" : "bg-gray-300"}`} />
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{CTA_POSITIONS.find((p) => p.value === slide.ctaPosition)?.label || "Abajo izq"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Slide */}
            <button onClick={addSlide} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-[#e60012] hover:text-[#e60012] hover:bg-red-50/30 transition-all">
              <Plus className="w-5 h-5" /><span className="font-semibold text-sm">Agregar slide</span>
            </button>

            {slides.length === 0 && (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay slides configurados</p>
                <p className="text-sm text-gray-400 mt-1">Agregá tu primer banner promocional</p>
              </div>
            )}
          </div>

          {/* Right: Preview (2 cols) */}
          <div className="xl:col-span-2">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">Vista previa</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewMode("mobile")} className={`p-2 rounded-lg transition-colors ${previewMode === "mobile" ? "bg-[#e60012] text-white" : "hover:bg-gray-100 text-gray-500"}`} title="Mobile"><Smartphone className="w-4 h-4" /></button>
                  <button onClick={() => setPreviewMode("desktop")} className={`p-2 rounded-lg transition-colors ${previewMode === "desktop" ? "bg-[#e60012] text-white" : "hover:bg-gray-100 text-gray-500"}`} title="Desktop"><Monitor className="w-4 h-4" /></button>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <button onClick={() => setShowPreview(!showPreview)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    {showPreview ? <Eye className="w-4 h-4 text-gray-500" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>

              {showPreview && globalEnabled && enabledSlides.length > 0 && (
                <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""}`}>
                  <div className={previewMode === "mobile" ? "p-2" : "p-3"}>
                    <PromoBanner slides={enabledSlides} interval={5000} />
                  </div>
                  <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100">
                    Vista {previewMode === "mobile" ? "mobile (375px)" : "desktop"} — {enabledSlides.length} slide{enabledSlides.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {showPreview && (!globalEnabled || enabledSlides.length === 0) && (
                <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                  <EyeOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{!globalEnabled ? "El carrusel está desactivado" : "No hay slides activos"}</p>
                </div>
              )}

              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h3 className="text-sm font-bold text-amber-800 mb-2">Consejos</h3>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li>Diseñá cada imagen a <strong>1200 x 400 px</strong> (ratio 3:1)</li>
                  <li>Los slides rotan automáticamente cada 5 segundos</li>
                  <li>Podés desactivar slides individuales sin eliminarlos</li>
                  <li>Usá las flechas para cambiar el orden de los slides</li>
                  <li>Si solo subís imagen sin texto, se muestra como banner visual puro</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
