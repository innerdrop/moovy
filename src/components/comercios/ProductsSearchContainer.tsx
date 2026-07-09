"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Edit, Package, X, SearchIcon, ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";
import ProductStatusToggle from "./ProductStatusToggle";
import DeleteProductButton from "./DeleteProductButton";
import { cleanEncoding } from "@/lib/utils/stringUtils";

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
}

export default function ProductsSearchContainer({ initialProducts }: ProductsSearchContainerProps) {
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

    // Paginación (cliente): default 20/página, configurable. Reemplaza el scroll
    // infinito — estándar de gestión de catálogo (Shopify/MeLi seller).
    const [pageSize, setPageSize] = useState(20);
    const [page, setPage] = useState(1);
    const [showTop, setShowTop] = useState(false);

    // Volver a la página 1 al cambiar búsqueda, filtro o tamaño de página.
    useEffect(() => { setPage(1); }, [searchTerm, statusFilter, pageSize]);

    // Botón flotante "volver arriba" cuando se scrolleó bastante.
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

    const statusTabs: Array<{ key: "" | ProductStatus; label: string; count: number; color: string }> = [
        { key: "", label: "Todos", count: counts.total, color: "text-gray-700" },
        { key: "published", label: "En tienda", count: counts.published, color: "text-green-600" },
        { key: "ready", label: "Listos", count: counts.ready, color: "text-blue-600" },
        { key: "incomplete", label: "Incompletos", count: counts.incomplete, color: "text-amber-600" },
    ];

    return (
        <div className="space-y-6">
            {/* Search Bar Replacement */}
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

            {/* Filtros por estado (chips con contadores) — herramientas de gestión */}
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
                        <button
                            onClick={() => setSearchTerm("")}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Ver todos los productos
                        </button>
                    ) : (
                        <Link
                            href="/comercios/productos/nuevo"
                            className="btn-primary inline-flex items-center gap-2 px-8 py-4"
                        >
                            Crear Primer Producto
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop Table Header (hidden on mobile) */}
                    <div className="hidden md:grid md:grid-cols-6 gap-4 px-5 py-2.5 bg-gray-50/50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <div className="col-span-2">Producto</div>
                        <div>Categoría</div>
                        <div>Precio</div>
                        <div>Stock</div>
                        <div className="text-right">Acciones</div>
                    </div>

                    {/* Products List */}
                    <div className="space-y-3">
                        {pageProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl border border-gray-100 p-3 md:px-5 md:py-3 hover:shadow-md hover:shadow-blue-900/5 transition-all group"
                            >
                                <div className="flex flex-col md:grid md:grid-cols-6 gap-3 items-center">
                                    {/* Product Info */}
                                    <div className="col-span-2 flex items-center gap-3 w-full">
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
                                            <span className="text-sm font-bold text-gray-600">
                                                {product.stock} un.
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2 md:w-full pt-3 md:pt-0 border-t md:border-t-0 w-full">
                                        <ProductStatusToggle
                                            productId={product.id}
                                            initialStatus={product.isActive}
                                        />
                                        <Link
                                            href={`/comercios/productos/${product.id}`}
                                            className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition shadow-sm active:scale-95"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <DeleteProductButton
                                            productId={product.id}
                                            productName={product.name}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
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

            {/* Volver arriba — aparece al scrollear. bottom-24 en mobile para no tapar la barra inferior. */}
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
