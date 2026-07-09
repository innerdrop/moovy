"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search, Edit, Package, X, SearchIcon, ChevronLeft, ChevronRight, ArrowUp,
    Trash2, Eye, EyeOff, FolderTree, Percent, Download, Loader2, CheckSquare, Square, AlertTriangle,
} from "lucide-react";
import ProductStatusToggle from "./ProductStatusToggle";
import DeleteProductButton from "./DeleteProductButton";
import { cleanEncoding } from "@/lib/utils/stringUtils";
import {
    bulkSetProductsActive, bulkDeleteProducts, bulkSetProductsCategory, bulkAdjustProductsPrice,
} from "@/app/comercios/bulk-actions";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
    description?: string | null;
    images: { url: string }[];
    categories: { category: { name: string } }[];
}

type ProductStatus = "published" | "ready" | "incomplete";

// ¿El producto cumple los requisitos para publicarse? (foto + descripción ≥10 + precio)
function isComplete(p: Product): boolean {
    return (p.images?.length ?? 0) > 0 && ((p.description?.trim().length ?? 0) >= 10) && p.price > 0;
}
// Estado: en tienda (publicado) | listo (oculto pero completo) | incompleto (falta algo).
function statusOf(p: Product): ProductStatus {
    return p.isActive ? "published" : (isComplete(p) ? "ready" : "incomplete");
}
const STATUS_RANK: Record<ProductStatus, number> = { published: 0, ready: 1, incomplete: 2 };
const STATUS_META: Record<ProductStatus, { label: string; classes: string }> = {
    published: { label: "En tienda", classes: "text-green-600" },
    ready: { label: "Listo", classes: "text-blue-600" },
    incomplete: { label: "Incompleto", classes: "text-amber-600" },
};

interface ProductsSearchContainerProps {
    initialProducts: Product[];
    // feat/recargo-moovy-y-tamano-toggle: categorías para el cambio en lote.
    categories?: { id: string; name: string }[];
}

export default function ProductsSearchContainer({ initialProducts, categories = [] }: ProductsSearchContainerProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");

    // Contadores globales del catálogo (para los chips de arriba).
    const counts = useMemo(() => {
        let published = 0, ready = 0, incomplete = 0;
        for (const p of initialProducts) {
            const s = statusOf(p);
            if (s === "published") published++;
            else if (s === "ready") ready++;
            else incomplete++;
        }
        return { total: initialProducts.length, published, ready, incomplete };
    }, [initialProducts]);

    // Lista visible: búsqueda + filtro de estado + orden (publicados primero,
    // luego listos, luego incompletos; dentro de cada grupo, los más recientes).
    const visible = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let list = initialProducts.filter(p =>
            !term ||
            p.name.toLowerCase().includes(term) ||
            p.categories.some(c => c.category.name.toLowerCase().includes(term))
        );
        if (statusFilter) list = list.filter(p => statusOf(p) === statusFilter);
        return list
            .map((p, i) => ({ p, i }))
            .sort((a, b) => (STATUS_RANK[statusOf(a.p)] - STATUS_RANK[statusOf(b.p)]) || (a.i - b.i))
            .map((x) => x.p);
    }, [searchTerm, statusFilter, initialProducts]);

    // Paginación (cliente): default 20/página, configurable.
    const [pageSize, setPageSize] = useState(20);
    const [page, setPage] = useState(1);
    const [showTop, setShowTop] = useState(false);

    useEffect(() => { setPage(1); }, [searchTerm, statusFilter, pageSize]);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 600);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageProducts = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

    const goTo = (p: number) => {
        setPage(Math.min(Math.max(1, p), totalPages));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ---- Selección en lote ----
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [modal, setModal] = useState<null | "delete" | "category" | "price">(null);
    const [catChoice, setCatChoice] = useState<string>("");
    const [pctChoice, setPctChoice] = useState<string>("");

    const selectedCount = selectedIds.size;
    const pageAllSelected = pageProducts.length > 0 && pageProducts.every((p) => selectedIds.has(p.id));
    const visibleAllSelected = visible.length > 0 && visible.every((p) => selectedIds.has(p.id));

    const setMany = (ids: string[], on: boolean) =>
        setSelectedIds((prev) => {
            const n = new Set(prev);
            ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
            return n;
        });
    const toggleOne = (id: string) =>
        setSelectedIds((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    const togglePage = () => setMany(pageProducts.map((p) => p.id), !pageAllSelected);
    const selectAllVisible = () => setMany(visible.map((p) => p.id), true);
    const clearSelection = () => setSelectedIds(new Set());

    // Al cambiar el filtro/búsqueda, limpiamos la selección para no arrastrar ids
    // que ya no se ven (evita "eliminé algo que no estaba mirando").
    useEffect(() => { clearSelection(); setMsg(null); }, [searchTerm, statusFilter]);

    const idsArray = () => Array.from(selectedIds);

    async function handle<T extends { error: string } | { ok: true; [k: string]: unknown }>(
        p: Promise<T>,
        okText: (r: any) => string,
    ) {
        setBusy(true);
        setMsg(null);
        try {
            const res = await p;
            if ("error" in res) { setMsg({ type: "err", text: (res as { error: string }).error }); return; }
            setMsg({ type: "ok", text: okText(res) });
            clearSelection();
            setModal(null);
            router.refresh();
        } catch {
            setMsg({ type: "err", text: "Ocurrió un error. Probá de nuevo." });
        } finally {
            setBusy(false);
        }
    }

    const doHide = () => handle(bulkSetProductsActive(idsArray(), false), (r) => `${r.updated} producto(s) ocultado(s)`);
    const doShow = () => handle(bulkSetProductsActive(idsArray(), true), (r) =>
        `${r.updated} publicado(s)${r.skipped ? ` · ${r.skipped} incompleto(s) no se pudieron` : ""}`);
    const doDelete = () => handle(bulkDeleteProducts(idsArray()), (r) =>
        `${r.deleted} eliminado(s)${r.hidden ? ` · ${r.hidden} con ventas se ocultaron` : ""}`);
    const doCategory = () => handle(bulkSetProductsCategory(idsArray(), catChoice || null), (r) =>
        catChoice ? `Categoría asignada a ${r.updated}` : `Categoría quitada a ${r.updated}`);
    const doPrice = () => handle(bulkAdjustProductsPrice(idsArray(), Number(pctChoice)), (r) =>
        `Precio ajustado en ${r.updated} producto(s)`);

    const exportCsv = () => {
        const map = new Map(initialProducts.map((p) => [p.id, p]));
        const rows = idsArray().map((id) => map.get(id)).filter((p): p is Product => !!p);
        const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const header = ["Nombre", "Precio", "Stock", "Categoria", "Estado"];
        const lines = [header.join(",")].concat(
            rows.map((p) => [
                cleanEncoding(p.name), p.price, p.stock,
                cleanEncoding(p.categories[0]?.category.name || ""), STATUS_META[statusOf(p)].label,
            ].map(esc).join(",")),
        );
        const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `productos-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const statusTabs: Array<{ key: "" | ProductStatus; label: string; count: number; color: string }> = [
        { key: "", label: "Todos", count: counts.total, color: "text-gray-700" },
        { key: "published", label: "En tienda", count: counts.published, color: "text-green-600" },
        { key: "ready", label: "Listos", count: counts.ready, color: "text-blue-600" },
        { key: "incomplete", label: "Incompletos", count: counts.incomplete, color: "text-amber-600" },
    ];

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className={`w-5 h-5 transition-colors ${searchTerm ? 'text-blue-600' : 'text-gray-400 group-focus-within:text-blue-600'}`} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar producto por nombre o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-12 py-5 bg-white border border-gray-100 rounded-[2rem] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all shadow-sm hover:shadow-md text-lg font-medium"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Filtros por estado */}
            {counts.total > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {statusTabs.map((t) => (
                        <button
                            key={t.key || "all"}
                            onClick={() => setStatusFilter(t.key)}
                            className={`px-3.5 py-1.5 rounded-full text-sm font-bold transition flex items-center gap-1.5 border ${statusFilter === t.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                        >
                            {t.label}
                            <span className={`text-xs font-black ${statusFilter === t.key ? "text-white/80" : t.color}`}>{t.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Toast de resultado */}
            {msg && (
                <div className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between gap-3 border ${msg.type === "ok" ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-600"}`}>
                    <span>{msg.text}</span>
                    <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* List */}
            {visible.length === 0 ? (
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-0 transition-transform">
                        <SearchIcon className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {searchTerm ? "No encontramos coincidencias" : "Tu catálogo está vacío"}
                    </h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">
                        {searchTerm
                            ? `No hay productos que coincidan con "${searchTerm}". Prueba con otros términos.`
                            : "Agrega tus productos para empezar a vender. Recuerda subir fotos de calidad."}
                    </p>
                    {searchTerm ? (
                        <button onClick={() => setSearchTerm("")} className="text-blue-600 font-bold hover:underline">
                            Ver todos los productos
                        </button>
                    ) : (
                        <Link href="/comercios/productos/nuevo" className="btn-primary inline-flex items-center gap-2 px-8 py-4">
                            Crear Primer Producto
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop Table Header con checkbox de "seleccionar página" */}
                    <div className="hidden md:grid md:grid-cols-6 gap-4 px-5 py-2.5 bg-gray-50/50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <div className="col-span-2 flex items-center gap-3">
                            <button onClick={togglePage} className="text-gray-400 hover:text-blue-600 transition" title="Seleccionar esta página">
                                {pageAllSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                            </button>
                            Producto
                        </div>
                        <div>Categoría</div>
                        <div>Precio</div>
                        <div>Stock</div>
                        <div className="text-right">Acciones</div>
                    </div>

                    {/* Banner "seleccionar todos los del filtro" (estilo Gmail) */}
                    {selectedCount > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm">
                            <span className="font-semibold text-blue-800">
                                {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
                            </span>
                            <div className="flex items-center gap-3">
                                {!visibleAllSelected && visible.length > pageProducts.length && (
                                    <button onClick={selectAllVisible} className="font-bold text-blue-700 hover:underline">
                                        Seleccionar los {visible.length} del filtro
                                    </button>
                                )}
                                <button onClick={clearSelection} className="font-semibold text-gray-500 hover:text-gray-700">Limpiar</button>
                            </div>
                        </div>
                    )}

                    {/* Products List */}
                    <div className="space-y-3">
                        {pageProducts.map((product) => {
                            const checked = selectedIds.has(product.id);
                            return (
                            <div
                                key={product.id}
                                className={`bg-white rounded-2xl border p-3 md:px-5 md:py-3 transition-all group ${checked ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100 hover:shadow-md hover:shadow-blue-900/5"}`}
                            >
                                <div className="flex flex-col md:grid md:grid-cols-6 gap-3 items-center">
                                    {/* Product Info + checkbox */}
                                    <div className="col-span-2 flex items-center gap-3 w-full">
                                        <button
                                            onClick={() => toggleOne(product.id)}
                                            className="flex-shrink-0 text-gray-300 hover:text-blue-600 transition"
                                            title={checked ? "Quitar de la selección" : "Seleccionar"}
                                        >
                                            {checked ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                        </button>
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 relative overflow-hidden flex-shrink-0 shadow-inner border border-gray-100">
                                            {product.images[0]?.url ? (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate text-base">{cleanEncoding(product.name)}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg uppercase tracking-wider md:hidden">
                                                    {cleanEncoding(product.categories[0]?.category.name || "Sin categoría")}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${STATUS_META[statusOf(product)].classes}`}>
                                                    {STATUS_META[statusOf(product)].label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category (Desktop only) */}
                                    <div className="hidden md:block">
                                        <span className="text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-xl">
                                            {cleanEncoding(product.categories[0]?.category.name || "—")}
                                        </span>
                                    </div>

                                    {/* Price and Stock */}
                                    <div className="flex items-center justify-between w-full md:contents border-t md:border-t-0 pt-3 md:pt-0">
                                        <div className="font-black text-blue-600 text-lg md:text-gray-900">
                                            ${product.price.toLocaleString("es-AR")}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                                            <span className="text-sm font-bold text-gray-600">{product.stock} un.</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2 md:w-full pt-3 md:pt-0 border-t md:border-t-0 w-full">
                                        <ProductStatusToggle productId={product.id} initialStatus={product.isActive} />
                                        <Link
                                            href={`/comercios/productos/${product.id}`}
                                            className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition shadow-sm active:scale-95"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <DeleteProductButton productId={product.id} productName={product.name} />
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    {/* Paginación */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{visible.length} producto{visible.length !== 1 ? "s" : ""}</span>
                            <span className="text-gray-300">·</span>
                            <label className="flex items-center gap-1.5">
                                Mostrar
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                por página
                            </label>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => goTo(safePage - 1)} disabled={safePage <= 1} className="p-2.5 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition" title="Anterior">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center">Página {safePage} de {totalPages}</span>
                                <button onClick={() => goTo(safePage + 1)} disabled={safePage >= totalPages} className="p-2.5 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition" title="Siguiente">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Barra de acciones en lote — flotante, aparece con ≥1 seleccionado. */}
            {selectedCount > 0 && (
                <div className="fixed left-0 right-0 bottom-16 md:bottom-6 z-40 px-3 sm:px-4 pointer-events-none">
                    <div className="max-w-3xl mx-auto pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-2.5 sm:p-3 flex items-center gap-2 overflow-x-auto">
                        <span className="text-sm font-black text-gray-900 whitespace-nowrap px-2">{selectedCount} sel.</span>
                        <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
                        <button onClick={doShow} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-green-700 hover:bg-green-50 transition disabled:opacity-50 whitespace-nowrap">
                            <Eye className="w-4 h-4" /> Mostrar
                        </button>
                        <button onClick={doHide} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 whitespace-nowrap">
                            <EyeOff className="w-4 h-4" /> Ocultar
                        </button>
                        <button onClick={() => { setCatChoice(""); setModal("category"); }} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 whitespace-nowrap">
                            <FolderTree className="w-4 h-4" /> Categoría
                        </button>
                        <button onClick={() => { setPctChoice(""); setModal("price"); }} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 whitespace-nowrap">
                            <Percent className="w-4 h-4" /> Precio
                        </button>
                        <button onClick={exportCsv} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 whitespace-nowrap">
                            <Download className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={() => setModal("delete")} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition disabled:opacity-50 whitespace-nowrap">
                            <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                        {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />}
                        <button onClick={clearSelection} disabled={busy} className="ml-auto p-2 text-gray-400 hover:text-gray-700 flex-shrink-0" title="Limpiar selección">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Eliminar */}
            {modal === "delete" && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Eliminar {selectedCount} producto(s)</h3>
                                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-6">
                            Los que tengan historial de ventas se <b>ocultan</b> en vez de borrarse, para no romper pedidos anteriores.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} disabled={busy} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium">Cancelar</button>
                            <button onClick={doDelete} disabled={busy} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Categoría */}
            {modal === "category" && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-1">Categoría para {selectedCount} producto(s)</h3>
                        <p className="text-sm text-gray-500 mb-4">Reemplaza la categoría actual de los seleccionados.</p>
                        <select
                            value={catChoice}
                            onChange={(e) => setCatChoice(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 mb-5"
                        >
                            <option value="">— Quitar categoría —</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{cleanEncoding(c.name)}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} disabled={busy} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium">Cancelar</button>
                            <button onClick={doCategory} disabled={busy} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderTree className="w-4 h-4" />} Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Precio */}
            {modal === "price" && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-1">Ajustar precio de {selectedCount} producto(s)</h3>
                        <p className="text-sm text-gray-500 mb-4">Un porcentaje sobre el precio actual. Ej: <b>10</b> sube 10%, <b>-5</b> baja 5%.</p>
                        <div className="relative mb-2">
                            <input
                                type="number"
                                step="0.5"
                                value={pctChoice}
                                onChange={(e) => setPctChoice(e.target.value)}
                                placeholder="0"
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-bold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-5">El precio pasa a ser un valor directo (se quita el recargo guardado, si tenía).</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} disabled={busy} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium">Cancelar</button>
                            <button onClick={doPrice} disabled={busy || !pctChoice || Number(pctChoice) === 0} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Percent className="w-4 h-4" />} Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Volver arriba */}
            {showTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    title="Volver arriba"
                    className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
