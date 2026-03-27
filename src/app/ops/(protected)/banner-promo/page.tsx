"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Loader2,
  X,
  Eye,
  EyeOff,
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
}

export default function PromoBannerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const [settings, setSettings] = useState<BannerSettings>({
    promoBannerEnabled: true,
    promoBannerTitle: "Noches de\nPizza & Pelis",
    promoBannerSubtitle: "2x1 en locales seleccionados de 20hs a 23hs.",
    promoBannerButtonText: "Ver locales",
    promoBannerButtonLink: "/productos?categoria=pizzas",
    promoBannerImage: null,
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Show/hide toast after 3 seconds
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
          promoBannerTitle: data.promoBannerTitle || "Noches de\nPizza & Pelis",
          promoBannerSubtitle: data.promoBannerSubtitle || "2x1 en locales seleccionados de 20hs a 23hs.",
          promoBannerButtonText: data.promoBannerButtonText || "Ver locales",
          promoBannerButtonLink: data.promoBannerButtonLink || "/productos?categoria=pizzas",
          promoBannerImage: data.promoBannerImage || null,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setToast({
        message: "Error al cargar la configuración",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof BannerSettings,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setToast({
        message: "Por favor, selecciona un archivo de imagen",
        type: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({
        message: "La imagen no debe pesar más de 5MB",
        type: "error",
      });
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
        setSettings((prev) => ({
          ...prev,
          promoBannerImage: data.url,
        }));
        setToast({
          message: "Imagen subida correctamente",
          type: "success",
        });
      } else {
        const error = await res.json();
        setToast({
          message: error.error || "Error al subir la imagen",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setToast({
        message: "Error al subir la imagen",
        type: "error",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setSettings((prev) => ({
      ...prev,
      promoBannerImage: null,
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!settings.promoBannerTitle.trim()) {
      setToast({
        message: "El título es requerido",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promoBannerEnabled: settings.promoBannerEnabled,
          promoBannerTitle: settings.promoBannerTitle,
          promoBannerSubtitle: settings.promoBannerSubtitle,
          promoBannerButtonText: settings.promoBannerButtonText,
          promoBannerButtonLink: settings.promoBannerButtonLink,
          promoBannerImage: settings.promoBannerImage,
        }),
      });

      if (res.ok) {
        setToast({
          message: "Banner promocional guardado",
          type: "success",
        });
      } else {
        const error = await res.json();
        setToast({
          message: error.error || "Error al guardar",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setToast({
        message: "Error al guardar los cambios",
        type: "error",
      });
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/ops">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
          </Link>
          <h1 className="text-3xl font-black text-gray-900">
            Banner Promocional
          </h1>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              {/* Enable/Disable Toggle */}
              <div className="mb-8">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative w-14 h-8 bg-gray-300 rounded-full transition-colors group-hover:bg-gray-400"
                    onClick={() =>
                      handleInputChange(
                        "promoBannerEnabled",
                        !settings.promoBannerEnabled
                      )
                    }
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        settings.promoBannerEnabled ? "translate-x-6" : ""
                      }`}
                    />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {settings.promoBannerEnabled ? "Banner activo" : "Banner inactivo"}
                  </span>
                </label>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={settings.promoBannerTitle}
                    onChange={(e) =>
                      handleInputChange("promoBannerTitle", e.target.value)
                    }
                    placeholder="Noches de\nPizza & Pelis"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Usa saltos de línea para separar líneas (ej: "Noche de\nPizza & Pelis")
                  </p>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={settings.promoBannerSubtitle}
                    onChange={(e) =>
                      handleInputChange("promoBannerSubtitle", e.target.value)
                    }
                    placeholder="2x1 en locales seleccionados de 20hs a 23hs."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Button Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Texto del botón
                  </label>
                  <input
                    type="text"
                    value={settings.promoBannerButtonText}
                    onChange={(e) =>
                      handleInputChange("promoBannerButtonText", e.target.value)
                    }
                    placeholder="Ver locales"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Button Link */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    URL del botón
                  </label>
                  <input
                    type="text"
                    value={settings.promoBannerButtonLink}
                    onChange={(e) =>
                      handleInputChange("promoBannerButtonLink", e.target.value)
                    }
                    placeholder="/productos?categoria=pizzas"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Imagen de fondo (opcional)
                  </label>
                  <div className="space-y-3">
                    {/* Current Image Preview */}
                    {settings.promoBannerImage && (
                      <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={settings.promoBannerImage}
                          alt="Banner image preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Upload Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        {uploading ? "Subiendo..." : "Haz clic o arrastra una imagen"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos: JPG, PNG, WebP, GIF (máx 5MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">Vista previa</h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showPreview ? (
                    <Eye className="w-5 h-5 text-gray-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>

              {showPreview && settings.promoBannerEnabled && (
                <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 overflow-hidden">
                  <div className="scale-90 origin-top-left">
                    <PromoBanner
                      enabled={true}
                      title={settings.promoBannerTitle}
                      subtitle={settings.promoBannerSubtitle}
                      buttonText={settings.promoBannerButtonText}
                      buttonLink={settings.promoBannerButtonLink}
                      image={settings.promoBannerImage}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Vista en mobile
                  </p>
                </div>
              )}

              {showPreview && !settings.promoBannerEnabled && (
                <div className="bg-gray-50 rounded-[2rem] p-8 text-center border border-gray-200">
                  <EyeOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    El banner está desactivado
                  </p>
                </div>
              )}

              {!showPreview && (
                <div className="bg-gray-50 rounded-[2rem] p-8 text-center border border-gray-200">
                  <EyeOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Vista previa oculta
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
