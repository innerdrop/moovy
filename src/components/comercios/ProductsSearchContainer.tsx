"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Edit, Package, X, SearchIcon, Filter } from "lucide-react";
import ProductStatusToggle from "./ProductStatusToggle";
import DeleteProductButton from "./DeleteProductButton";
import { cleanEncoding } from "@/lib/utils/stringUtils";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
    images: { url: string }[];
    categories: { category: { name: string } }[];
}

interface ProductsSearchContainerProps {
    initialProducts: Product[];
}

export default function ProductsSearchContainer({ initialProducts }: ProductsSearchContainerProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return initialProducts;
        const term = searchTerm.toLowerCase();
        return initialProducts.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.categories.some(c => c.category.name.toLowerCase().includes(term))
        );
    }, [searchTerm, initialProducts]);

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

            {/* List */}
            {filteredProducts.length === 0 ? (
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
                    <div className="hidden md:grid md:grid-cols-6 gap-4 px-8 py-4 bg-gray-50/50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <div className="col-span-2">Producto</div>
                        <div>Categoría</div>
                        <div>Precio</div>
                        <div>Stock</div>
                        <div className="text-right">Acciones</div>
                    </div>

                    {/* Products List */}
                    <div className="space-y-3">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-3xl border border-gray-100 p-4 md:px-8 md:py-5 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-0.5 transition-all group"
                            >
                                <div className="flex flex-col md:grid md:grid-cols-6 gap-4 items-center">
                                    {/* Product Info */}
                                    <div className="col-span-2 flex items-center gap-5 w-full">
                                        <div className="w-20 h-20 md:w-16 md:h-16 rounded-2xl bg-gray-50 relative overflow-hidden flex-shrink-0 shadow-inner border border-gray-100">
                                            {product.images[0]?.url ? (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <Package className="w-8 h-8 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate text-lg">{cleanEncoding(product.name)}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg uppercase tracking-wider md:hidden">
                                                    {cleanEncoding(product.categories[0]?.category.name || "Sin categoría")}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${product.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {product.isActive ? 'Visible' : 'Oculto'}
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
                                    <div className="flex items-center justify-between w-full md:contents border-t md:border-t-0 pt-4 md:pt-0">
                                        <div className="font-black text-blue-600 text-xl md:text-gray-900">
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
                                    <div className="flex items-center justify-end gap-3 md:w-full pt-4 md:pt-0 border-t md:border-t-0 w-full">
                                        <ProductStatusToggle
                                            productId={product.id}
                                            initialStatus={product.isActive}
                                        />
                                        <Link
                                            href={`/comercios/productos/${product.id}`}
                                            className="p-3 rounded-2xl border border-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition shadow-sm active:scale-95"
                                            title="Editar"
                                        >
                                            <Edit className="w-5 h-5" />
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
                </div>
            )}
        </div>
    );
}
