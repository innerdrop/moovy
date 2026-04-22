
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/ProductCard";
import MerchantScheduleWidget from "@/components/store/MerchantScheduleWidget";
import EmptyState from "@/components/ui/EmptyState";
import { checkMerchantSchedule } from "@/lib/merchant-schedule";
import { MapPin, Clock, Star, Info, ChevronLeft, BadgeCheck, ShoppingBag } from "lucide-react";

// ISSUE-049: umbral para mostrar lista plana sin filtro de categorías.
// Si el comercio tiene < 5 productos, el filtro por categorías genera
// ruido visual ("Otros (2)") en vez de ayudar a explorar. Debajo de este
// umbral mostramos todo junto en una sola grilla limpia.
const FLAT_LIST_THRESHOLD = 5;

async function getMerchant(slug: string) {
    const merchant = await prisma.merchant.findUnique({
        where: { slug },
        include: {
            products: {
                where: { isActive: true },
                include: {
                    // If we had categories relation in Product, we would include it.
                    // Looking at schema, Product has categories through ProductCategory
                    categories: {
                        include: {
                            category: true
                        }
                    },
                    images: true
                }
            },
        }
    });
    return merchant;
}
type Merchant = Awaited<ReturnType<typeof getMerchant>>;

export default async function MerchantPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const merchant = await getMerchant(slug);

    if (!merchant) {
        notFound();
    }

    // Calcular estado real (pausa manual + horario) en timezone de Ushuaia.
    // merchant.isOpen es SOLO la pausa manual; el estado que el buyer tiene
    // que ver combina eso con el horario configurado. El guard server-side
    // en /api/orders usa la misma función (defense in depth).
    const scheduleResult = checkMerchantSchedule({
        isOpen: merchant.isOpen,
        scheduleJson: merchant.scheduleJson,
    });
    const isCurrentlyOpen = scheduleResult.isCurrentlyOpen;

    // Normalizamos cada producto para el ProductCard (image + merchant con
    // estado REAL). Pasamos el estado combinado (pausa + horario), no el flag
    // crudo — así el card respeta el horario aunque el merchant no esté
    // manualmente pausado.
    const normalizedProducts = merchant.products.map(product => ({
        ...product,
        image: product.images[0]?.url || null,
        merchantId: merchant.id,
        merchant: { isOpen: isCurrentlyOpen },
    }));

    const totalProducts = normalizedProducts.length;

    // ISSUE-049: si hay < 5 productos, mostramos lista plana sin agrupar
    // por categoría. Evita el "Otros (2)" cuando el merchant recién arranca
    // y todavía no categorizó.
    const useFlatList = totalProducts > 0 && totalProducts < FLAT_LIST_THRESHOLD;

    // Group products by category (solo se usa cuando NO va en flat list).
    const productsByCategory: Record<string, typeof normalizedProducts> = {};
    if (!useFlatList) {
        for (const product of normalizedProducts) {
            const catName = product.categories[0]?.category.name || "Otros";
            if (!productsByCategory[catName]) {
                productsByCategory[catName] = [];
            }
            productsByCategory[catName].push(product);
        }
    }

    const categories = Object.keys(productsByCategory);

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Simple Header */}
            <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center gap-3">
                <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-navy truncate">{merchant.name}</h1>
                    {merchant.isVerified && (
                        <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                </div>
            </header>

            {/* Merchant Header / Cover */}
            <div className="bg-white border-b border-gray-100">
                <div className="h-32 sm:h-40 bg-gradient-to-r from-gray-800 to-gray-900 relative">
                    {/* Banner Image would go here */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <span className="text-4xl font-bold text-white tracking-widest uppercase">{merchant.name}</span>
                    </div>
                    {/* Verified Badge on Banner */}
                    {merchant.isVerified && (
                        <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                            <BadgeCheck className="w-4 h-4" />
                            Verificado
                        </div>
                    )}
                </div>

                <div className="container mx-auto px-4 -mt-10 relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl shadow-md p-1">
                            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-400">
                                {merchant.name.charAt(0)}
                            </div>
                        </div>

                        <div className="flex-1 pb-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
                                {merchant.isVerified && (
                                    <BadgeCheck className="w-6 h-6 text-blue-500" />
                                )}
                            </div>
                            <p className="text-gray-500 text-sm">{merchant.description}</p>
                        </div>
                    </div>

                    {/* Merchant Info Bar */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 py-3 border-t border-gray-50">
                        <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-gray-900">{merchant.rating ? merchant.rating.toFixed(1) : "Nuevo"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{merchant.address}</span>
                        </div>
                        {merchant.deliveryFee === 0 && (
                            <div className="text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-md">
                                Envío Gratis
                            </div>
                        )}
                    </div>

                    {/* Horarios de atención — widget expandible con estado real */}
                    <div className="pb-4">
                        <MerchantScheduleWidget
                            isOpen={merchant.isOpen}
                            scheduleJson={merchant.scheduleJson}
                        />
                    </div>
                </div>
            </div>

            {/* Banner de cierre — usa el estado REAL (pausa + horario), no solo isOpen.
                Mensajes diferenciados para que el buyer sepa si es pausa temporal o
                fuera de horario + cuándo vuelve a abrir. */}
            {!isCurrentlyOpen && (
                <div className="bg-red-50 border-y border-red-100 py-3">
                    <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-red-600 font-bold text-center">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm md:text-base">
                            {scheduleResult.isPaused
                                ? "Este comercio está cerrado temporalmente y no recibe pedidos"
                                : scheduleResult.nextOpenTime && scheduleResult.nextOpenDay
                                    ? `Cerrado · Abre ${scheduleResult.nextOpenDay === "Hoy" ? "hoy" : scheduleResult.nextOpenDay} a las ${scheduleResult.nextOpenTime}`
                                    : "Este comercio está cerrado en este momento"}
                        </p>
                    </div>
                </div>
            )}

            {/* Categories Tabs — solo si tenemos suficientes productos para agrupar.
                ISSUE-049: debajo de FLAT_LIST_THRESHOLD, las categorías generan más
                ruido que valor (un solo grupo "Otros" con 2 productos). */}
            {!useFlatList && categories.length > 1 && (
                <div className="sticky top-[60px] z-10 bg-white shadow-sm mb-6">
                    <div className="container mx-auto px-4">
                        <div className="flex overflow-x-auto py-3 gap-4 no-scrollbar">
                            {categories.map(cat => (
                                <a
                                    key={cat}
                                    href={`#cat-${cat}`}
                                    className="whitespace-nowrap px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-[#e60012] hover:text-white transition"
                                >
                                    {cat}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Product Lists */}
            <div className={`container mx-auto px-4 ${useFlatList ? "pt-6" : ""} space-y-8`}>
                {useFlatList ? (
                    // ISSUE-049: flat list sin headers de categoría ni contadores.
                    // Grid limpio con los ≤4 productos del merchant.
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {normalizedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} showAddButton />
                        ))}
                    </div>
                ) : (
                    categories.map(category => (
                        <div key={category} id={`cat-${category}`} className="scroll-mt-32">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                {category}
                                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {productsByCategory[category].length}
                                </span>
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {productsByCategory[category].map((product) => (
                                    <ProductCard key={product.id} product={product} showAddButton />
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {totalProducts === 0 && (
                    <EmptyState
                        icon={ShoppingBag}
                        tone="neutral"
                        size="md"
                        title="Todavía no cargaron productos"
                        description="Este comercio está arrancando. Volvé a visitarlo en unos días para ver su catálogo."
                        primaryCta={{ label: "Ver otros comercios", href: "/tiendas" }}
                    />
                )}
            </div>
        </div>
    );
}
