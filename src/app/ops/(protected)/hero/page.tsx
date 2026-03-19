"use client";

import { useState, useEffect } from "react";
import { Wand2 } from "lucide-react";

interface HeroConfig {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_bg_color: string;
  hero_bg_gradient: string;
  hero_bg_image: string;
  hero_search_enabled: boolean;
  hero_search_placeholder: string;
  hero_person_enabled: boolean;
  hero_person_image: string;
  hero_stats_enabled: boolean;
}

const defaultConfig: HeroConfig = {
  hero_title: "Bienvenido a MOOVY",
  hero_subtitle: "Compra en los mejores comercios de Ushuaia",
  hero_cta_text: "Explorar tienda",
  hero_cta_link: "/productos",
  hero_bg_color: "#e60012",
  hero_bg_gradient: "linear-gradient(135deg, #e60012 0%, #a3000c 100%)",
  hero_bg_image: "",
  hero_search_enabled: true,
  hero_search_placeholder: "Busca productos...",
  hero_person_enabled: false,
  hero_person_image: "",
  hero_stats_enabled: true,
};

export default function HeroConfigPage() {
  const [config, setConfig] = useState<HeroConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/config/hero");
      if (response.ok) {
        const data = await response.json();
        setConfig({ ...defaultConfig, ...data });
      }
    } catch (error) {
      console.error("Error fetching hero config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof HeroConfig,
    value: string | boolean
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/config/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setToastMessage("Cambios guardados exitosamente");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage("Error al guardar los cambios");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Error saving config:", error);
      setToastMessage("Error al guardar los cambios");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Configurar Hero</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              Personaliza la sección hero de tu tienda
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Column: Form (60%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contenido Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="text-lg">📝</span>
              </div>
              <h2 className="text-lg font-black text-gray-900">Contenido</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  Título Principal
                </label>
                <textarea
                  value={config.hero_title}
                  onChange={(e) => handleInputChange("hero_title", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all resize-none"
                  rows={2}
                  placeholder="Bienvenido a MOOVY"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={config.hero_subtitle}
                  onChange={(e) =>
                    handleInputChange("hero_subtitle", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="Compra en los mejores comercios"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={config.hero_cta_text}
                    onChange={(e) =>
                      handleInputChange("hero_cta_text", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="Explorar tienda"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                    Link del Botón
                  </label>
                  <input
                    type="text"
                    value={config.hero_cta_link}
                    onChange={(e) =>
                      handleInputChange("hero_cta_link", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="/productos"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Apariencia Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <span className="text-lg">🎨</span>
              </div>
              <h2 className="text-lg font-black text-gray-900">Apariencia</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                    Color de Fondo
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.hero_bg_color}
                      onChange={(e) =>
                        handleInputChange("hero_bg_color", e.target.value)
                      }
                      className="w-16 h-12 rounded-xl border border-slate-100 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.hero_bg_color}
                      onChange={(e) =>
                        handleInputChange("hero_bg_color", e.target.value)
                      }
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      placeholder="#e60012"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  Gradiente CSS (opcional)
                </label>
                <textarea
                  value={config.hero_bg_gradient}
                  onChange={(e) =>
                    handleInputChange("hero_bg_gradient", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all resize-none"
                  rows={2}
                  placeholder="linear-gradient(135deg, #e60012 0%, #a3000c 100%)"
                />
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  Ejemplo: linear-gradient(135deg, #e60012 0%, #a3000c 100%)
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  URL de Imagen de Fondo (opcional)
                </label>
                <input
                  type="text"
                  value={config.hero_bg_image}
                  onChange={(e) =>
                    handleInputChange("hero_bg_image", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  Se superpone al color/gradiente
                </p>
              </div>
            </div>
          </div>

          {/* Buscador Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <span className="text-lg">🔍</span>
                </div>
                <h2 className="text-lg font-black text-gray-900">Buscador</h2>
              </div>
              <button
                onClick={() =>
                  handleInputChange(
                    "hero_search_enabled",
                    !config.hero_search_enabled
                  )
                }
                className={`w-14 h-8 rounded-full transition-all ${
                  config.hero_search_enabled ? "bg-green-500" : "bg-gray-300"
                } flex items-center p-1`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform ${
                    config.hero_search_enabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {config.hero_search_enabled && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  Texto del Placeholder
                </label>
                <input
                  type="text"
                  value={config.hero_search_placeholder}
                  onChange={(e) =>
                    handleInputChange(
                      "hero_search_placeholder",
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Busca productos..."
                />
              </div>
            )}
          </div>

          {/* Persona Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <h2 className="text-lg font-black text-gray-900">Persona</h2>
              </div>
              <button
                onClick={() =>
                  handleInputChange(
                    "hero_person_enabled",
                    !config.hero_person_enabled
                  )
                }
                className={`w-14 h-8 rounded-full transition-all ${
                  config.hero_person_enabled ? "bg-green-500" : "bg-gray-300"
                } flex items-center p-1`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform ${
                    config.hero_person_enabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {config.hero_person_enabled && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  URL de la Imagen
                </label>
                <input
                  type="text"
                  value={config.hero_person_image}
                  onChange={(e) =>
                    handleInputChange("hero_person_image", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="https://ejemplo.com/persona.png"
                />
              </div>
            )}
          </div>

          {/* Estadísticas Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <h2 className="text-lg font-black text-gray-900">
                  Estadísticas
                </h2>
              </div>
              <button
                onClick={() =>
                  handleInputChange(
                    "hero_stats_enabled",
                    !config.hero_stats_enabled
                  )
                }
                className={`w-14 h-8 rounded-full transition-all ${
                  config.hero_stats_enabled ? "bg-green-500" : "bg-gray-300"
                } flex items-center p-1`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform ${
                    config.hero_stats_enabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Muestra un banner con estadísticas como "X pedidos hoy"
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black py-4 rounded-2xl transition-all text-lg"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {/* Right Column: Preview (40%) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">
              Vista Previa
            </h3>

            {/* Preview Container */}
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-gray-200 aspect-video flex flex-col justify-between p-6 text-white"
              style={{
                background: config.hero_bg_gradient
                  ? config.hero_bg_gradient
                  : config.hero_bg_color,
                backgroundImage: config.hero_bg_image
                  ? `url(${config.hero_bg_image})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/20" />

              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <h1 className="text-2xl font-black mb-2 line-clamp-2">
                  {config.hero_title || "Título aquí"}
                </h1>

                {/* Subtitle */}
                <p className="text-sm font-medium opacity-90 mb-4 line-clamp-2">
                  {config.hero_subtitle || "Subtítulo aquí"}
                </p>

                {/* Search Bar */}
                {config.hero_search_enabled && (
                  <div className="mb-4">
                    <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 w-full max-w-xs">
                      <span className="text-gray-400">🔍</span>
                      <input
                        type="text"
                        disabled
                        placeholder={config.hero_search_placeholder}
                        className="flex-1 bg-transparent text-gray-700 text-sm outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                {config.hero_cta_text && (
                  <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all">
                    {config.hero_cta_text}
                  </button>
                )}
              </div>

              {/* Bottom indicators */}
              <div className="relative z-10 space-y-2">
                {config.hero_person_enabled && (
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1 rounded-lg w-fit backdrop-blur-sm">
                    <span>👤</span>
                    <span>Persona habilitada</span>
                  </div>
                )}

                {config.hero_stats_enabled && (
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1 rounded-lg w-fit backdrop-blur-sm">
                    <span>📊</span>
                    <span>Estadísticas visibles</span>
                  </div>
                )}
              </div>
            </div>

            {/* Config Summary */}
            <div className="mt-6 space-y-2 text-[10px] text-slate-400">
              <p>
                <span className="font-bold">Color:</span> {config.hero_bg_color}
              </p>
              <p className="truncate">
                <span className="font-bold">Gradiente:</span>{" "}
                {config.hero_bg_gradient
                  ? config.hero_bg_gradient.substring(0, 50) + "..."
                  : "Ninguno"}
              </p>
              <p>
                <span className="font-bold">Buscador:</span>{" "}
                {config.hero_search_enabled ? "Sí" : "No"}
              </p>
              <p>
                <span className="font-bold">Persona:</span>{" "}
                {config.hero_person_enabled ? "Sí" : "No"}
              </p>
              <p>
                <span className="font-bold">Estadísticas:</span>{" "}
                {config.hero_stats_enabled ? "Sí" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg animate-pulse">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
