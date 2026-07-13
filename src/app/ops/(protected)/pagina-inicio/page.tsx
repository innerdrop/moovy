"use client";

// OPS — Página de Inicio / Home Builder (feat/home-builder-pagina-inicio)
// Organizador de las secciones MOVIBLES del home: arrastrar para reordenar +
// interruptor de prendido/apagado. Persiste vía /api/ops/home-sections (upsert).
// Hero + "Abiertos ahora" (arriba) y CTAs + Footer (abajo) son FIJOS, no aparecen
// acá. El "apagado" es un candado adicional: cada sección igual se oculta sola si
// no tiene datos (ej: Promos sin cupones). Regla #10: parámetro operativo en OPS.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Home,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeOff,
    Loader2,
    Save,
    RefreshCw,
    Tag,
    Image as ImageIcon,
    Megaphone,
    Star,
    ExternalLink,
    Info,
} from "lucide-react";
import { toast } from "@/store/toast";

interface Section {
    key: string;
    label: string;
    description: string;
    order: number;
    enabled: boolean;
}

const MANAGER_SHORTCUTS = [
    { href: "/ops/categorias", label: "Categorías del home", desc: "Imágenes y nombres de las categorías", icon: Tag },
    { href: "/ops/hero", label: "Hero Banners", desc: "Slides grandes del carrusel", icon: ImageIcon },
    { href: "/ops/banner-promo", label: "Banner Promo", desc: "Banners promocionales", icon: Megaphone },
    { href: "/ops/destacados", label: "Productos destacados", desc: "Qué productos van en 'Lo más pedido'", icon: Star },
];

export default function PaginaInicioPage() {
    const [sections, setSections] = useState<Section[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch("/api/ops/home-sections");
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSections(data.sections);
            setDirty(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const move = (from: number, to: number) => {
        setSections((prev) => {
            if (!prev) return prev;
            if (to < 0 || to >= prev.length) return prev;
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
        setDirty(true);
    };

    const toggle = (index: number) => {
        setSections((prev) =>
            prev ? prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)) : prev
        );
        setDirty(true);
    };

    const save = async () => {
        if (!sections) return;
        setSaving(true);
        try {
            const payload = {
                sections: sections.map((s, i) => ({
                    key: s.key,
                    order: (i + 1) * 10,
                    enabled: s.enabled,
                })),
            };
            const res = await fetch("/api/ops/home-sections", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
            setSections(data.sections);
            setDirty(false);
            toast.success("Home actualizada");
        } catch (e: any) {
            toast.error(e?.message || "No se pudo guardar");
        } finally {
            setSaving(false);
        }
    };

    // Drag & drop (HTML5). Reordena en vivo mientras se arrastra.
    const onDragOver = (e: React.DragEvent, i: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === i) return;
        move(dragIndex, i);
        setDragIndex(i);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e60012]/10">
                        <Home className="h-6 w-6 text-[#e60012]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Página de Inicio</h1>
                        <p className="text-sm text-gray-500">
                            Ordená y mostrá/ocultá las secciones del home de la tienda.
                        </p>
                    </div>
                </div>
                <button
                    onClick={save}
                    disabled={!dirty || saving}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition active:scale-95 ${
                        dirty && !saving
                            ? "bg-[#e60012] text-white shadow-md hover:bg-[#cc000f]"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Guardando…" : "Guardar cambios"}
                </button>
            </div>

            {/* Nota de secciones fijas */}
            <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <p className="text-xs leading-relaxed text-blue-900/80">
                    El <strong>encabezado con el buscador</strong> (arriba) y el <strong>footer con los
                    CTAs</strong> (abajo) son fijos y no se pueden mover. Además, una sección solo aparece
                    si tiene contenido para mostrar (ej: "Promos del Mundial" necesita cupones activos),
                    aunque esté encendida acá.
                </p>
            </div>

            {/* Estados */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[72px] rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                    <p className="font-bold text-red-700">No se pudieron cargar las secciones.</p>
                    <button
                        onClick={load}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50"
                    >
                        <RefreshCw className="h-4 w-4" /> Reintentar
                    </button>
                </div>
            ) : sections && sections.length > 0 ? (
                <div className="space-y-2.5">
                    {sections.map((s, i) => (
                        <div
                            key={s.key}
                            draggable
                            onDragStart={() => setDragIndex(i)}
                            onDragOver={(e) => onDragOver(e, i)}
                            onDragEnd={() => setDragIndex(null)}
                            className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm transition ${
                                dragIndex === i ? "border-[#e60012] ring-2 ring-[#e60012]/20" : "border-gray-100"
                            } ${!s.enabled ? "opacity-60" : ""}`}
                        >
                            {/* Handle de arrastre */}
                            <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                                <GripVertical className="h-5 w-5" />
                            </div>

                            {/* Orden */}
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-500">
                                {i + 1}
                            </span>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-gray-900">{s.label}</p>
                                <p className="truncate text-xs text-gray-400">{s.description}</p>
                            </div>

                            {/* Flechas (fallback al drag) */}
                            <div className="flex flex-col">
                                <button
                                    onClick={() => move(i, i - 1)}
                                    disabled={i === 0}
                                    className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                                    aria-label="Subir"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => move(i, i + 1)}
                                    disabled={i === sections.length - 1}
                                    className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                                    aria-label="Bajar"
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Toggle enabled */}
                            <button
                                onClick={() => toggle(i)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition ${
                                    s.enabled
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                                aria-label={s.enabled ? "Ocultar sección" : "Mostrar sección"}
                            >
                                {s.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                {s.enabled ? "Visible" : "Oculta"}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center text-gray-500">
                    No hay secciones para mostrar.
                </div>
            )}

            {/* Accesos directos a los managers del home */}
            <div className="pt-2">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-gray-400">
                    Gestionar el contenido del home
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    {MANAGER_SHORTCUTS.map((m) => {
                        const Icon = m.icon;
                        return (
                            <Link
                                key={m.href}
                                href={m.href}
                                className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-gray-200 hover:shadow-md"
                            >
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#e60012]/10">
                                    <Icon className="h-5 w-5 text-[#e60012]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-gray-900">{m.label}</p>
                                    <p className="truncate text-xs text-gray-400">{m.desc}</p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
