// Products Listing Page - Página de Productos
import { getAllProducts, getAllCategories, type Product, type Category } from "@/lib/db";
import Link from "next/link";
import { Package, Filter } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

interface ProductsPageProps {
    searchParams: Promise<{ categoria?: string; buscar?: string }>;
}

function getProducts(categoria?: string, buscar?: string): Product[] {
    let products = getAllProducts();

    // Filter by category
    if (categoria) {
        products = products.filter(p =>
            p.categories.some(c => c.category.slug === categoria)
        );
    }

    // Filter by search term
    if (buscar) {
        const searchLower = buscar.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            (p.description || "").toLowerCase().includes(searchLower)
        );
    }

    // Sort by name
    products.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[ProductosPage] Found ${products.length} products`);
    return products;
}

function getCategories(): Category[] {
    return getAllCategories();
}

export default async function ProductosPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams;
    const products = await getProducts(params.categoria, params.buscar);
    const categories = await getCategories();

    const currentCategory = categories.find(c => c.slug === params.categoria);

    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            {/* Mobile Category Chips - Horizontal Scroll */}
            <div className="lg:hidden mb-4 -mx-4 px-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Link
                        href="/productos"
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${!params.categoria
                            ? "bg-[#e60012] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Todos
                    </Link>
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/productos?categoria=${cat.slug}`}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${params.categoria === cat.slug
                                ? "bg-[#e60012] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Sidebar - Categories (Desktop Only) */}
                <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-[#e60012]" />
                            Categorías
                        </h2>

                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/productos"
                                    className={`block py-2 px-3 rounded-lg transition ${!params.categoria
                                        ? "bg-[#e60012] text-white"
                                        : "hover:bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    Todos los productos
                                </Link>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <Link
                                        href={`/productos?categoria=${cat.slug}`}
                                        className={`block py-2 px-3 rounded-lg transition ${params.categoria === cat.slug
                                            ? "bg-[#e60012] text-white"
                                            : "hover:bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            {currentCategory ? currentCategory.name : "Todos los Productos"}
                        </h1>
                        <p className="text-gray-600">
                            {products.length} productos encontrados
                        </p>
                    </div>

                    {/* Search Notice */}
                    {params.buscar && (
                        <div className="bg-red-50 p-4 rounded-lg mb-6">
                            <p className="text-gray-900">
                                Resultados para: <strong>{params.buscar}</strong>
                                {" "}
                                <Link href="/productos" className="text-[#e60012] hover:underline">
                                    (Limpiar)
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Products Grid */}
                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                No encontramos productos
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {params.buscar
                                    ? "Intentá con otra búsqueda"
                                    : "No hay productos en esta categoría"}
                            </p>
                            <Link href="/productos" className="btn-primary">
                                Ver todos los productos
                            </Link>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
