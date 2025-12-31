// Home Page - Página de Inicio
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
import HeroSlider from "@/components/home/HeroSlider";
import PromotionalPopup from "@/components/home/PromotionalPopup";

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

async function getFeaturedProducts() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            include: {
                images: { take: 1 },
                categories: { include: { category: true } },
            },
            take: 8,
        });
        return products;
    } catch (error) {
        return [];
    }
}

export default async function HomePage() {
    const categories = await getCategories();
    const featuredProducts = await getFeaturedProducts();

    return (
        <div className="animate-fadeIn">
            {/* <PromotionalPopup /> (HIDDEN PHASE 1) */}
            {/* Ocultado temporalmente para fase Institucional, ya que ofrece descuento en compra */}
            {/* <PromotionalPopup /> */}

            {/* Hero Promo Slider (includes feature pills) */}
            <HeroSlider />

            {/* Categories - Animated Cards (HIDDEN PHASE 1) */}
            {/* <section className="pt-4 pb-8 lg:pt-6 lg:pb-12 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl lg:text-3xl font-bold text-navy mb-6 text-center">
                        Explorá por <span className="text-turquoise">Categoría</span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        {categories.length > 0 ? (
                            categories.map((cat, index) => {
                                const Icon = categoryIcons[cat.slug] || Store;
                                return (
                                    <Link
                                        key={cat.id}
                                        href={`/productos?categoria=${cat.slug}`}
                                        className={`category-card p-4 sm:p-6 text-center group stagger-${(index % 6) + 1} animate-fadeIn`}
                                        style={{ animationFillMode: 'both' }}
                                    >
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-turquoise to-cyan mx-auto mb-3 flex items-center justify-center shadow-lg group-hover:shadow-turquoise/50 transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                                            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                        </div>
                                        <h3 className="font-semibold text-navy text-sm sm:text-base group-hover:text-turquoise transition-colors">
                                            {cat.name}
                                        </h3>
                                    </Link>
                                );
                            })
                        ) : (
                            // Placeholder categories with animations
                            ["Lácteos", "Bebidas", "Sandwichería", "Golosinas", "Almacén", "Limpieza"].map((name, i) => (
                                <Link
                                    key={i}
                                    href={`/productos?categoria=${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                    className={`category-card p-4 sm:p-6 text-center group stagger-${i + 1} animate-fadeIn`}
                                    style={{ animationFillMode: 'both' }}
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-turquoise to-cyan mx-auto mb-3 flex items-center justify-center shadow-lg group-hover:shadow-turquoise/50 transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                                        <Store className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-navy text-sm sm:text-base group-hover:text-turquoise transition-colors">
                                        {name}
                                    </h3>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section> */}

            {/* Featured Products (HIDDEN PHASE 1) */}
            {/* <section className="py-12 lg:py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-navy">
                            Productos <span className="text-turquoise">Destacados</span>
                        </h2>
                        <Link href="/productos" className="text-turquoise font-semibold hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {featuredProducts.length > 0 ? (
                            featuredProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/productos/${product.slug}`}
                                    className="card overflow-hidden group"
                                >
                                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Store className="w-12 h-12" />
                                        </div>
                                        {product.isFeatured && (
                                            <span className="absolute top-2 left-2 bg-turquoise text-white text-xs px-2 py-1 rounded-full">
                                                ⭐ Destacado
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-navy group-hover:text-turquoise transition line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xl font-bold text-turquoise mt-2">
                                            ${product.price.toLocaleString("es-AR")}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            [
                                { name: "Leche La Serenísima 1L", price: 1200 },
                                { name: "Coca-Cola 2.25L", price: 2800 },
                                { name: "Sándwich de Milanesa", price: 3500 },
                                { name: "Alfajor Havanna", price: 1500 },
                            ].map((p, i) => (
                                <div key={i} className="card overflow-hidden">
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300">
                                        <Store className="w-12 h-12" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-navy line-clamp-2">{p.name}</h3>
                                        <p className="text-xl font-bold text-turquoise mt-2">
                                            ${p.price.toLocaleString("es-AR")}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section> */}

            {/* CTA Banner - Contacto */}
            <section className="py-16 bg-gray-50 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-navy-dark mb-4">
                        ¿Necesitás algo ahora?
                    </h2>
                    <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                        Estamos abiertos las 24 horas. Comunicate con nosotros para hacer tu pedido o consulta.
                    </p>
                    <Link href="/contacto" className="btn-primary text-lg px-10 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                        Contactanos
                    </Link>
                </div>
            </section>
        </div>
    );
}
