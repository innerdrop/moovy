// Home Page - Página de Inicio
import Link from "next/link";
import { Store } from "lucide-react";

export default function HomePage() {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-24 h-24 bg-[#e60012] rounded-full flex items-center justify-center mb-8 shadow-xl animate-pulse">
                <Store className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                VOLVEMOS <span className="text-[#e60012]">PRONTO</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto mb-10">
                Estamos actualizando nuestra plataforma para brindarte una mejor experiencia de compra.
            </p>

            <div className="w-16 h-1 bg-[#e60012] rounded-full opacity-50" />

            <p className="mt-8 text-sm text-gray-400 font-medium">
                Moovy &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
}


/* 
// ORIGINAL HOME PAGE CODE - RESTORE WHEN READY
// -------------------------------------------
import {
    ArrowRight,
    Milk,
    Wine,
    Sandwich,
    Candy,
    SprayCan
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import HeroSlider from "@/components/home/HeroSlider";
import PersonalizedWelcome from "@/components/home/PersonalizedWelcome";
import MerchantCard from "@/components/store/MerchantCard";

// Category icons mapping
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    lacteos: Milk,
    bebidas: Wine,
    sandwicheria: Sandwich,
    golosinas: Candy,
    almacen: Store,
    limpieza: SprayCan,
};

async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            take: 6,
        });
        return categories;
    } catch (error) {
        return [];
    }
}

async function getFeaturedMerchants() {
    try {
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true },
            take: 8,
            orderBy: { name: 'asc' } // Or by rating/promoted
        });
        return merchants;
    } catch (error) {
        return [];
    }
}

async function getFeaturedProducts() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            include: {
                categories: { include: { category: true } }
            },
            take: 8,
        });
        return products;
    } catch (error) {
        return [];
    }
}

export async function OldHomePage() {
    const categories = await getCategories();
    const merchants = await getFeaturedMerchants();
    const featuredProducts = await getFeaturedProducts();

    return (
        <div className="animate-fadeIn">
            <PersonalizedWelcome />
            <HeroSlider />
            <section className="pt-4 pb-8 lg:pt-6 lg:pb-12 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
                        Explorá por <span className="text-[#e60012]">Categoría</span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        {categories.length > 0 ? (
                            categories.map((cat, index) => {
                                const Icon = categoryIcons[cat.slug] || Store;
                                return (
                                    <Link
                                        key={cat.id}
                                        href={`/explorar?categoria=${cat.slug}`}
                                        className="category-card p-4 sm:p-6 text-center group animate-fadeIn"
                                    >
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e60012] mx-auto mb-3 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                        </div>
                                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base group-hover:text-[#e60012] transition-colors">
                                            {cat.name}
                                        </h3>
                                    </Link>
                                );
                            })
                        ) : (
                            <p className="col-span-full text-center text-gray-500">Cargando categorías...</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-12 lg:py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            Comercios <span className="text-[#e60012]">Cercanos</span>
                        </h2>
                        <Link href="/explorar" className="text-[#e60012] font-semibold hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {merchants.length > 0 ? (
                            merchants.map((merchant) => (
                                <MerchantCard key={merchant.id} merchant={merchant} />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                <Store className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p>No hay comercios disponibles en este momento.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-12 lg:py-16 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            Productos <span className="text-[#e60012]">Recomendados</span>
                        </h2>
                        <Link href="/productos" className="text-[#e60012] font-semibold hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {featuredProducts.length > 0 ? (
                            featuredProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/productos/${product.slug}`}
                                    className="card overflow-hidden group border border-gray-100 rounded-xl"
                                >
                                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Store className="w-12 h-12 opacity-20" />
                                        </div>
                                        {product.isFeatured && (
                                            <span className="absolute top-2 left-2 bg-[#e60012] text-white text-xs px-2 py-1 rounded-full shadow-sm">
                                                ⭐ Destacado
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 group-hover:text-[#e60012] transition line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xl font-bold text-[#e60012] mt-2">
                                            ${product.price.toLocaleString("es-AR")}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="col-span-full text-center text-gray-400">No hay productos destacados.</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                        ¿Listo para comprar?
                    </h2>
                    <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                        Explorá nuestro catálogo y encontrá todo lo que necesitás.
                    </p>
                    <Link href="/productos" className="btn-primary text-lg px-10 py-4">
                        Ver Productos
                    </Link>
                </div>
            </section>
        </div>
    );
}
*/

