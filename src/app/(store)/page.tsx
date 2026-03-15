// Home Page - Página de Inicio
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
    title: "MOOVY — Tu marketplace y delivery en Ushuaia",
    description: "Comprá productos, comida y más de comercios locales en Ushuaia. Delivery rápido a tu puerta.",
};

import Link from "next/link";
import {
    ArrowRight,
    Milk,
    Wine,
    Sandwich,
    Candy,
    Store,
    SprayCan
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import HeroSliderNew from "@/components/home/HeroSliderNew";
import MerchantCard from "@/components/store/MerchantCard";
import ListingCard from "@/components/store/ListingCard";

// Configuration — Maintenance mode controlado por env var
// MAINTENANCE_MODE=true  → muestra "Volvemos Pronto"
// MAINTENANCE_MODE=false → muestra la app normalmente
const IS_MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

// Category icons mapping
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    lacteos: Milk,
    bebidas: Wine,
    sandwicheria: Sandwich,
    golosinas: Candy,
    almacen: Store,
    limpieza: SprayCan,
};

async function getHeroSlides() {
    try {
        const slides = await prisma.heroSlide.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        });
        return slides;
    } catch (error) {
        return [];
    }
}

async function getCategories(limit: number = 6) {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            take: limit,
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
            take: 12,
            orderBy: [
                { isOpen: 'desc' },
                { displayOrder: 'desc' },
                { isPremium: 'desc' },
                { name: 'asc' }
            ]
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
                categories: { include: { category: true } },
                images: true,
                merchant: { select: { id: true, name: true, isOpen: true } }
            },
            take: 8,
        });
        return products;
    } catch (error) {
        return [];
    }
}

async function getTodayStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await prisma.order.count({
            where: {
                createdAt: { gte: today },
                status: { not: "CANCELLED" },
            },
        });
        return count;
    } catch {
        return 0;
    }
}

async function getRecentListings() {
    try {
        const listings = await prisma.listing.findMany({
            where: { isActive: true },
            include: {
                seller: {
                    select: { displayName: true, rating: true, avatar: true },
                },
                images: { orderBy: { order: "asc" }, take: 1 },
                category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 4,
        });
        return listings;
    } catch (error) {
        return [];
    }
}

function MaintenanceView() {
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

async function LiveStoreView() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } });
    const categories = await getCategories(settings?.maxCategoriesHome ?? 6);
    const merchants = await getFeaturedMerchants();
    const featuredProducts = await getFeaturedProducts();
    const recentListings = await getRecentListings();
    const slides = await getHeroSlides();
    const slideInterval = settings?.heroSliderInterval ?? 5000;
    const todayOrders = await getTodayStats();

    return (
        <div className="animate-fadeIn">

            <HeroSliderNew slides={slides} slideInterval={slideInterval} />

            {/* Social Proof Banner */}
            {todayOrders > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-y border-green-100">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-800 font-medium">
                            {todayOrders} {todayOrders === 1 ? "pedido" : "pedidos"} hoy en Ushuaia
                        </span>
                    </div>
                </div>
            )}
            <section className="pt-4 pb-4 lg:pt-6 lg:pb-6 bg-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
                        Explorá por <span className="text-[#e60012]">Categoría</span>
                    </h2>

                    {/* Desktop: Horizontal scrollable row */}
                    <div className="hidden lg:block -mx-4 px-4">
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                            {categories.map((cat) => {
                                const Icon = categoryIcons[cat.slug] || Store;
                                return (
                                    <Link
                                        key={cat.id}
                                        href={`/productos?categoria=${cat.slug}`}
                                        className="flex-shrink-0 w-44 snap-start group"
                                    >
                                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-[#e60012]/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e60012] to-[#ff4444] mx-auto mb-3 flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                                                <Icon className="w-8 h-8 text-white drop-shadow-sm" />
                                            </div>
                                            <h3 className="font-semibold text-gray-800 group-hover:text-[#e60012] transition-colors">
                                                {cat.name}
                                            </h3>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile: Dual-row auto-scroll + manual touch scroll */}
                    <div className="lg:hidden space-y-3 -mx-4">
                        {/* Row 1: Scroll Right Animation + Touch Scroll */}
                        <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            <div className="flex gap-3 pl-4 pr-4 animate-scroll-right touch-pan-x" style={{ width: 'max-content' }}>
                                {[...categories, ...categories, ...categories].map((cat, index) => {
                                    const Icon = categoryIcons[cat.slug] || Store;
                                    return (
                                        <Link
                                            key={`row1-${cat.id}-${index}`}
                                            href={`/productos?categoria=${cat.slug}`}
                                            className="flex-shrink-0 w-28"
                                        >
                                            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-3 text-center shadow-sm active:scale-95 transition-transform">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e60012] to-[#ff6666] mx-auto mb-2 flex items-center justify-center shadow-md">
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="font-medium text-gray-800 text-xs truncate">
                                                    {cat.name}
                                                </h3>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 2: Scroll Left Animation + Touch Scroll */}
                        <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            <div className="flex gap-3 pl-4 pr-4 animate-scroll-left touch-pan-x" style={{ width: 'max-content' }}>
                                {[...categories, ...categories, ...categories].reverse().map((cat, index) => {
                                    const Icon = categoryIcons[cat.slug] || Store;
                                    return (
                                        <Link
                                            key={`row2-${cat.id}-${index}`}
                                            href={`/productos?categoria=${cat.slug}`}
                                            className="flex-shrink-0 w-28"
                                        >
                                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-3 text-center shadow-sm active:scale-95 transition-transform">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff4444] to-[#e60012] mx-auto mb-2 flex items-center justify-center shadow-md">
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="font-medium text-gray-800 text-xs truncate">
                                                    {cat.name}
                                                </h3>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-6 lg:py-8 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            Comercios <span className="text-[#e60012]">Cercanos</span>
                        </h2>
                        <Link href="/productos" className="text-[#e60012] font-semibold hover:underline flex items-center gap-1">
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
                                <p className="font-medium text-gray-600">Estamos sumando comercios cada dia</p>
                                <p className="text-sm mt-1">Pronto vas a encontrar tu favorito</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
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
                                        <div className="w-full h-full flex items-center justify-center text-gray-50">
                                            {/* Show Image if available */}
                                            {product.images && product.images[0]?.url ? (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <Store className="w-12 h-12 text-gray-300 opacity-50" />
                                            )}
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
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xl font-bold text-[#e60012]">
                                                ${product.price.toLocaleString("es-AR")}
                                            </p>
                                            {product.stock <= 0 && (
                                                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                    Sin Stock
                                                </span>
                                            )}
                                            {product.merchant && !product.merchant.isOpen && (
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded">
                                                    Cerrado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-400">
                                <p className="font-medium text-gray-600">Estamos preparando ofertas increibles para vos</p>
                                <p className="text-sm mt-1">Volve pronto</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Marketplace Section */}
            {recentListings.length > 0 && (
                <section className="py-12 lg:py-16 bg-gray-50 border-t border-gray-100">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                <span className="text-[#e60012]">Marketplace</span>
                            </h2>
                            <Link href="/marketplace" className="text-[#e60012] font-semibold hover:underline flex items-center gap-1">
                                Ver todo <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                            {recentListings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Cómo funciona MOOVY */}
            <section className="py-12 lg:py-16 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 text-center mb-2">
                        Como funciona <span className="text-[#e60012]">MOOVY</span>
                    </h2>
                    <p className="text-gray-500 text-center mb-10 max-w-lg mx-auto">
                        Comprar en Ushuaia nunca fue tan facil
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { step: "1", title: "Elegí", desc: "Explorá comercios y productos cercanos, o comprá en el marketplace de vendedores particulares.", icon: "🛒" },
                            { step: "2", title: "Pagá", desc: "Pagá con MercadoPago o en efectivo al recibir. Simple y seguro.", icon: "💳" },
                            { step: "3", title: "Recibí", desc: "Un repartidor MOOVY lo busca y te lo lleva a tu puerta. Seguilo en tiempo real.", icon: "🚀" },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-16 h-16 rounded-full bg-[#e60012]/10 mx-auto mb-4 flex items-center justify-center text-3xl">
                                    {item.icon}
                                </div>
                                <div className="inline-flex items-center gap-2 mb-2">
                                    <span className="w-7 h-7 rounded-full bg-[#e60012] text-white text-sm font-bold flex items-center justify-center">{item.step}</span>
                                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                                </div>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">{item.desc}</p>
                            </div>
                        ))}
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

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Logo y descripción */}
                        <div className="md:col-span-2">
                            <Link href="/" className="inline-block mb-4">
                                <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span>
                            </Link>
                            <p className="text-sm text-gray-400 mb-4">
                                Tu antojo manda! MOOVY es una plataforma que conecta a comercios locales con consumidores,
                                facilitando la compra y entrega de productos en Ushuaia.
                            </p>
                            <p className="text-xs text-gray-500">
                                MOOVY no vende productos directamente. Actuamos como intermediarios entre comercios y consumidores.
                            </p>
                        </div>

                        {/* Links rápidos */}
                        <div>
                            <h4 className="font-bold text-white mb-4">Enlaces</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/productos" className="hover:text-[#e60012] transition">Productos</Link></li>
                                <li><Link href="/marketplace" className="hover:text-[#e60012] transition">Marketplace</Link></li>
                                <li><Link href="/puntos" className="hover:text-[#e60012] transition">Programa MOOVER</Link></li>
                                <li><Link href="/contacto" className="hover:text-[#e60012] transition">Contacto</Link></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-bold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/terminos" className="hover:text-[#e60012] transition">Términos y Condiciones</Link></li>
                                <li><Link href="/privacidad" className="hover:text-[#e60012] transition">Política de Privacidad</Link></li>
                                <li><Link href="/cookies" className="hover:text-[#e60012] transition">Cookies</Link></li>
                                <li><Link href="/devoluciones" className="hover:text-[#e60012] transition">Devoluciones</Link></li>
                                <li><Link href="/cancelaciones" className="hover:text-[#e60012] transition">Cancelaciones</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-800 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-xs text-gray-500">
                                © {new Date().getFullYear()} MOOVY. Todos los derechos reservados.
                            </p>
                            <p className="text-xs text-gray-500">
                                Ushuaia, Tierra del Fuego 🇦🇷
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function HomePage() {
    if (IS_MAINTENANCE_MODE) {
        return <MaintenanceView />;
    }
    return <LiveStoreView />;
}
