// Products Listing Page - Rediseño v2
import { getAllCategories, type Product, type Category } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Filter, ShoppingBag } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import ProductSearchBar from "@/components/products/ProductSearchBar";
import { cleanEncoding } from "@/lib/utils/stringUtils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Productos — MOOVY",
    description: "Explorá todos los productos disponibles en Ushuaia con delivery rápido.",
};

interface ProductsPageProps {
    searchParams: Promise<{ categoria?: string; buscar?: string }>;
}

async function getProducts(categoria?: string, buscar?: string): Promise<Product[]> {
    const baseWhere: any = {
        isActive: true,
        merchantId: { not: null }
    };

    if (categoria) {
        baseWhere.categories = {
            some: { category: { slug: categoria } }
        };
    }

    if (buscar) {
        baseWhere.AND = [
            {
                OR: [
                    { name: { contains: buscar, mode: 'insensitive' } },
                    { description: { contains: buscar, mode: 'insensitive' } },
                ]
            }
        ];
    }

    const products = await prisma.product.findMany({
        where: baseWhere,
        include: {
            categories: { include: { category: true } },
            images: true,
            merchant: true,
            acquiredBy: {
                include: { merchant: true },
                take: 1
            }
        },
        orderBy: { name: "asc" },
    });

    return products.map(p => ({
        ...p,
        merchant: p.merchant || p.acquiredBy?.[0]?.merchant || null,
        merchantId: p.merchantId || p.acquiredBy?.[0]?.merchantId || undefined,
        image: p.images[0]?.url || null
    }));
}

async function getCategories(): Promise<Category[]> {
    return await getAllCategories();
}

export default async function ProductosPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams;
    const products = await getProducts(params.categoria, params.buscar);
    const categories = await getCategories();

    const currentCategory = categories.find(c => c.slug === params.categoria);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header con fondo sutil */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e60012] to-red-600 flex items-center justify-center shadow-sm">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                                {currentCategory ? cleanEncoding(currentCategory.name) : "Todos los Productos"}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {products.length} {products.length === 1 ? "producto" : "productos"} disponibles
                            </p>
                        </div>
                    </div>
                    <ProductSearchBar />
                </div>
            </div>

            {/* Category chips — horizontal scroll */}
            <div className="bg-white border-b border-gray-100 sticky top-14 z-20">
                <div className="container mx-auto px-4">
                    <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                        <Link
                            href="/productos"
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${!params.categoria
                                ? "bg-[#e60012] text-white shadow-sm"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Todos
                        </Link>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/productos?categoria=${cat.slug}`}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${params.categoria === cat.slug
                                    ? "bg-[#e60012] text-white shadow-sm"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {cleanEncoding(cat.name)}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-5">
                {/* Search notice */}
                {params.buscar && (
                    <div className="bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-5 flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Resultados para: <strong className="text-gray-900">{params.buscar}</strong>
                        </p>
                        <Link href="/productos" className="text-xs font-semibold text-[#e60012] hover:underline ml-3">
                            Limpiar
                        </Link>
                    </div>
                )}

                {/* Desktop layout: sidebar + grid */}
                <div className="flex gap-6">
                    {/* Desktop sidebar */}
                    <aside className="hidden lg:block w-56 flex-shrink-0">
                        <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-32 border border-gray-100">
                            <h2 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[#e60012]" />
                                Categorías
                            </h2>
                            <ul className="space-y-1">
                                <li>
                                    <Link
                                        href="/productos"
                                        className={`block py-2 px-3 rounded-xl text-sm font-medium transition ${!params.categoria
                                            ? "bg-[#e60012] text-white"
                                            : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        Todos
                                    </Link>
                                </li>
                                {categories.map((cat) => (
                                    <li key={cat.id}>
                                        <Link
                                            href={`/productos?categoria=${cat.slug}`}
                                            className={`block py-2 px-3 rounded-xl text-sm font-medium transition ${params.categoria === cat.slug
                                                ? "bg-[#e60012] text-white"
                                                : "hover:bg-gray-50 text-gray-700"
                                                }`}
                                        >
                                            {cleanEncoding(cat.name)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Products grid */}
                    <div className="flex-1">
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">
                                    No encontramos productos
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    {params.buscar ? "Intentá con otra búsqueda" : "No hay productos en esta categoría"}
                                </p>
                                <Link href="/productos" className="text-sm font-semibold text-[#e60012] hover:underline">
                                    Ver todos los productos
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
