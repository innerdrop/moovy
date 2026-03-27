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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PromoBanner from "@/components/home/PromoBanner";

interface BannerSettings {
  promoBannerEnabled: boolean;
  promoBannerTitle: string;
  promoBannerSubtitle: string;
  promoBannerButtonText: string;
  promoBannerButtonLink: string;
  promoBannerImage: string | null;
  promoBannerCtaPosition: string;
}

const CTA_POSITIONS = [
  { value: "arriba-izquierda", label: "Arriba izquierda" },
  { value: "arriba-centro", label: "Arriba centro" },
  { value: "arriba-derecha", label: "Arriba derecha" },
  { value: "centro-izquierda", label: "Centro izquierda" },
  { value: "centro", label: "Centro" },
  { value: "centro-derecha", label: "Centro derecha" },
  { value: "abajo-izquierda", label: "Abajo izquierda" },
  { value: "abajo-centro", label: "Abajo centro" },
  { value: "abajo-derecha", label: "Abajo derecha" },
] as const;

// Visual position grid for visual picker
const POSITION_GRID = [
  ["arriba-izquierda", "arriba-centro", "arriba-derecha"],
  ["centro-izquierda", "centro", "centro-derecha"],
  ["abajo-izquierda", "abajo-centro", "abajo-derecha"],
] as const;

export default function PromoBannerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");

  const [settings, setSettings] = useState<BannerSettings>({
    promoBannerEnabled: true,
    promoBannerTitle: "",
    promoBannerSubtitle: "",
    promoBannerButtonText: "",
    promoBannerButtonLink: "",
    promoBannerImage: null,
    promoBannerCtaPosition: "abajo-izquierda",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

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
      if (res.ok) {
        const data = await res.json();
        setSettings({
          promoBannerEnabled: data.promoBannerEnabled ?? true,
          promoBannerTitle: data.promoBannerTitle || "",
          promoBannerSubtitle: data.promoBannerSubtitle || "",
          promoBannerButtonText: data.promoBannerButtonText || "",
          promoBannerButtonLink: data.promoBannerButtonLink || "",
          promoBannerImage: data.promoBannerImage || null,
          promoBannerCtaPosition: data.promoBannerCtaPosition || "abajo-izquierda",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setToast({ message: "Error al cargar la configuración", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BannerSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ message: "Por favor, seleccioná un archivo de imagen", type: "error" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: "La imagen no debe pesar más de 10MB", type: "error" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/promo/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, promoBannerImage: data.url }));
        setToast({ message: "Imagen subida correctamente", type: "success" });
      } else {
        const error = await res.json();
        setToast({ message: error.error || "Error al subir la imagen", type: "error" });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setToast({ message: "Error al subir la imagen", type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setSettings((prev) => ({ ...prev, promoBannerImage: null }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoBannerEnabled: settings.promoBannerEnabled,
          promoBannerTitle: settings.promoBannerTitle,
          promoBannerSubtitle: settings.promoBannerSubtitle,
          promoBannerButtonText: settings.promoBannerButtonText,
          promoBannerButtonLink: settings.promoBannerButtonLink,
          promoBannerImage: settings.promoBannerImage,
          promoBannerCtaPosition: settings.promoBannerCtaPosition,
        }),
      });

      if (res.ok) {
        setToast({ message: "Banner guardado correctamente", type: "success" });
      } else {
        const error = await res.json();
        setToast({ message: error.error || "Error al guardar", type: "error" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setToast({ message: "Error al guardar los cambios", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ops">
              <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
            </Link>
            <h1 className="text-2xl font-black text-gray-900">Banner Promocional</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-[#e60012] hover:bg-[#cc000f] disabled:bg-gray-300 text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-xl text-white font-medium z-50 shadow-lg ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Form Section — 3 cols */}
          <div className="xl:col-span-3 space-y-6">
            {/* Toggle Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.promoBannerEnabled ? "bg-[#e60012]" : "bg-gray-300"
                  }`}
                  onClick={() => handleInputChange("promoBannerEnabled", !settings.promoBannerEnabled)}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      settings.promoBannerEnabled ? "translate-x-6" : ""
                    }`}
                  />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900">
                    {settings.promoBannerEnabled ? "Banner activo" : "Banner inactivo"}
                  </span>
                  <p className="text-xs text-gray-500">El banner se muestra en la página de inicio</p>
                </div>
              </label>
            </div>

            {/* Image Upload Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Imagen del banner</h2>
              <p className="text-sm text-gray-500 mb-4">
                Subí la imagen con el diseño completo. Se muestra con los colores originales, sin filtros ni superposiciones.
              </p>

              {settings.promoBannerImage ? (
                <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
                  <div className="relative w-full aspect-[3/1]">
                    <Image
                      src={settings.promoBannerImage}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    uploading
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-[#e60012] hover:bg-red-50/30"
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="w-10 h-10 text-[#e60012] mx-auto mb-3 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  )}
                  <p className="text-sm font-semibold text-gray-700">
                    {uploading ? "Subiendo..." : "Hacé clic o arrastrá una imagen"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP o GIF — máx 10MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />

              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-700">
                  <strong>Medida recomendada:</strong> 1200×400 px (ratio 3:1). La imagen se muestra tal cual la subís, sin degradados ni filtros.
                </p>
              </div>
            </div>

            {/* Text Fields Card — all optional */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Texto sobre el banner</h2>
              <p className="text-sm text-gray-500 mb-5">
                Todos los campos son opcionales. Si no completás ninguno, se muestra solo la imagen.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título</label>
                  <textarea
                    value={settings.promoBannerTitle}
                    onChange={(e) => handleInputChange("promoBannerTitle", e.target.value)}
                    placeholder="Ej: Noches de Pizza & Pelis"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] resize-none text-sm"
                    rows={2}
                  />
                  <p className="mt-1 text-xs text-gray-400">Usá \n para hacer saltos de línea</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtítulo</label>
                  <input
                    type="text"
                    value={settings.promoBannerSubtitle}
                    onChange={(e) => handleInputChange("promoBannerSubtitle", e.target.value)}
                    placeholder="Ej: 2x1 en locales seleccionados"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Texto del botón</label>
                    <input
                      type="text"
                      value={settings.promoBannerButtonText}
                      onChange={(e) => handleInputChange("promoBannerButtonText", e.target.value)}
                      placeholder="Ej: Ver locales"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL del botón</label>
                    <input
                      type="text"
                      value={settings.promoBannerButtonLink}
                      onChange={(e) => handleInputChange("promoBannerButtonLink", e.target.value)}
                      placeholder="Ej: /productos?categoria=pizzas"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Position Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Posición del contenido</h2>
              <p className="text-sm text-gray-500 mb-5">
                Elegí dónde aparece el texto y el botón sobre la imagen.
              </p>

              {/* Visual Position Grid */}
              <div className="inline-block border border-gray-200 rounded-xl overflow-hidden">
                {POSITION_GRID.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex">
                    {row.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleInputChange("promoBannerCtaPosition", pos)}
                        className={`w-16 h-12 border border-gray-100 flex items-center justify-center transition-all ${
                          settings.promoBannerCtaPosition === pos
                            ? "bg-[#e60012] shadow-inner"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        title={CTA_POSITIONS.find((p) => p.value === pos)?.label}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${
                            settings.promoBannerCtaPosition === pos
                              ? "bg-white"
                              : "bg-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <p className="mt-3 text-sm font-medium text-gray-700">
                {CTA_POSITIONS.find((p) => p.value === settings.promoBannerCtaPosition)?.label || "Abajo izquierda"}
              </p>
            </div>
          </div>

          {/* Preview Section — 2 cols */}
          <div className="xl:col-span-2">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">Vista previa</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-2 rounded-lg transition-colors ${
                      previewMode === "mobile"
                        ? "bg-[#e60012] text-white"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                    title="Vista mobile"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-2 rounded-lg transition-colors ${
                      previewMode === "desktop"
                        ? "bg-[#e60012] text-white"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                    title="Vista desktop"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showPreview ? (
                      <Eye className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {showPreview && settings.promoBannerEnabled && (
                <div
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${
                    previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
                  }`}
                >
                  <div className={previewMode === "mobile" ? "p-2" : "p-3"}>
                    <PromoBanner
                      enabled={true}
                      title={settings.promoBannerTitle || undefined}
                      subtitle={settings.promoBannerSubtitle || undefined}
                      buttonText={settings.promoBannerButtonText || undefined}
                      buttonLink={settings.promoBannerButtonLink || "/"}
                      image={settings.promoBannerImage}
                      ctaPosition={settings.promoBannerCtaPosition}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100">
                    Vista {previewMode === "mobile" ? "mobile (375px)" : "desktop"}
                  </p>
                </div>
              )}

              {showPreview && !settings.promoBannerEnabled && (
                <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                  <EyeOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">El banner está desactivado</p>
                </div>
              )}

              {/* Tips */}
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h3 className="text-sm font-bold text-amber-800 mb-2">Consejos</h3>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li>• La imagen se muestra con sus colores originales</li>
                  <li>• Si el texto no se ve bien sobre la imagen, ajustá el diseño de la imagen directamente</li>
                  <li>• Si solo subís una imagen sin texto, se muestra como banner visual puro</li>
                  <li>• Probá distintas posiciones del contenido con la grilla de arriba</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
