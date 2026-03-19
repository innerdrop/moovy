"use client";

// Product Detail Client — Redesigned like top marketplace/delivery apps
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
// useSession removed — cart works without auth, login at checkout
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";
import {
    ChevronLeft,
    ChevronRight,
    Package,
    ShoppingCart,
    Plus,
    Minus,
    Check,
    AlertCircle,
    Loader2,
    Share2,
    Store,
    Clock,
    MapPin,
    Star,
    Shield,
    CreditCard,
    Banknote,
    Truck,
    MessageCircle,
    Heart,
} from "lucide-react";
import HeartButton from "@/components/ui/HeartButton";

interface Merchant {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    isOpen: boolean;
    isVerified: boolean;
    isPremium: boolean;
    rating: number | null;
    deliveryTimeMin: number;
    deliveryTimeMax: number;
    deliveryFee: number;
    address: string | null;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    merchantId: string;
    merchant: Merchant | null;
    categories: Array<{ category: { id: string; name: string; slug: string } }>;
    images: Array<{ id: string; url: string; alt: string | null }>;
}

export default function ProductDetailClient() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);

    useEffect(() => {
        async function fetchProduct() {
            try {
                const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
                if (response.ok) {
                    const data = await response.json();
                    setProduct(data);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        }
        if (slug) fetchProduct();
    }, [slug]);

    const handleAddToCart = () => {
        if (!product || product.stock <= 0) return;
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.images[0]?.url || undefined,
            merchantId: product.merchantId,
            type: "product",
        });
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleAddAndGoToCart = () => {
        handleAddToCart();
        setTimeout(() => openCart(), 300);
    };

    const handleShare = () => {
        if (!product) return;
        const url = `${window.location.origin}/productos/${product.slug}`;
        const text = `${product.name} — ${formatPrice(product.price)}`;
        if (navigator.share) {
            navigator.share({ title: product.name, text, url }).catch(() => {});
        } else {
            const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
            window.open(waUrl, "_blank");
        }
    };

    // === LOADING ===
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    // === NOT FOUND ===
    if (!product) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
                <p className="text-gray-600 mb-6">El producto que buscás no existe o fue eliminado.</p>
                <Link href="/productos" className="inline-flex items-center gap-2 bg-[#e60012] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#cc000f] transition">
                    Ver todos los productos
                </Link>
            </div>
        );
    }

    const category = product.categories[0]?.category;
    const inStock = product.stock > 0;
    const merchant = product.merchant;

    return (
        <>
            {/* ═══════ MOBILE: App-style full-bleed layout ═══════ */}
            <div className="lg:hidden">
                {/* Floating top bar */}
                <div className="sticky top-14 z-20 flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-md border-b border-gray-100">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex items-center gap-1">
                        <HeartButton type="product" itemId={product.id} />
                        <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 transition">
                            <Share2 className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Image carousel */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {product.images.length > 0 ? (
                        <img
                            src={product.images[selectedImageIndex]?.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-24 h-24 text-gray-300" />
                        </div>
                    )}
                    {product.isFeatured && (
                        <span className="absolute top-3 left-3 bg-[#e60012] text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                            Destacado
                        </span>
                    )}
                    {!inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">Sin Stock</span>
                        </div>
                    )}
                    {/* Image dots */}
                    {product.images.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {product.images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImageIndex(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === selectedImageIndex ? "bg-white w-5" : "bg-white/50"}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="px-4 pt-4 pb-32">
                    {/* Category */}
                    {category && (
                        <Link href={`/productos?categoria=${category.slug}`} className="inline-block text-xs font-semibold text-[#e60012] bg-red-50 px-2.5 py-1 rounded-full mb-2">
                            {category.name}
                        </Link>
                    )}

                    {/* Name + Price */}
                    <h1 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h1>
                    <p className="text-2xl font-bold text-[#e60012] mb-1">{formatPrice(product.price)}</p>
                    <p className="text-xs text-amber-600 font-medium mb-3 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        +{Math.floor(product.price)} puntos MOOVER
                    </p>

                    {/* Stock */}
                    <div className="flex items-center gap-1.5 mb-4">
                        {inStock ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                <Check className="w-3 h-3" /> En stock
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Sin stock
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="mb-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Descripción</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                        </div>
                    )}

                    {/* ── Merchant card ── */}
                    {merchant && (
                        <Link
                            href={`/tienda/${merchant.slug}`}
                            className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3.5 mb-5 shadow-sm hover:shadow-md transition group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                {merchant.image ? (
                                    <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Store className="w-5 h-5 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#e60012] transition">{merchant.name}</p>
                                    {merchant.isVerified && <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2.5 mt-0.5 text-xs text-gray-500">
                                    {merchant.rating && (
                                        <span className="flex items-center gap-0.5">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            {merchant.rating.toFixed(1)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-0.5">
                                        <Clock className="w-3 h-3" />
                                        {merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min
                                    </span>
                                    {merchant.isOpen ? (
                                        <span className="text-green-600 font-medium">Abierto</span>
                                    ) : (
                                        <span className="text-gray-400">Cerrado</span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </Link>
                    )}

                    {/* ── Delivery & payment info ── */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Truck className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Envío a todo Ushuaia</p>
                                <p className="text-xs text-gray-500">
                                    {merchant?.deliveryFee ? `$${merchant.deliveryFee.toLocaleString("es-AR")} de envío` : "Consultar costo de envío"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Mercado Pago</p>
                                <p className="text-xs text-gray-500">Tarjeta, débito o dinero en cuenta</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <Banknote className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Efectivo</p>
                                <p className="text-xs text-gray-500">Pagás al recibir tu pedido</p>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp CTA */}
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Compartir por WhatsApp
                    </button>
                </div>

                {/* ── Fixed bottom bar ── */}
                {inStock && (
                    <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center gap-3">
                            {/* Quantity */}
                            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center"
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center"
                                    disabled={quantity >= product.stock}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Add to cart */}
                            <button
                                onClick={handleAddToCart}
                                disabled={addedToCart}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition shadow-md ${
                                    addedToCart
                                        ? "bg-green-500"
                                        : "bg-[#e60012] hover:bg-[#cc000f] active:scale-[0.98]"
                                }`}
                            >
                                {addedToCart ? (
                                    <><Check className="w-5 h-5" /> Agregado</>
                                ) : (
                                    <><ShoppingCart className="w-5 h-5" /> Agregar {formatPrice(product.price * quantity)}</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ DESKTOP: Two-column layout ═══════ */}
            <div className="hidden lg:block container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <nav className="mb-6">
                    <ol className="flex items-center gap-2 text-sm text-gray-500">
                        <li><Link href="/" className="hover:text-[#e60012] transition">Inicio</Link></li>
                        <li>/</li>
                        <li><Link href="/productos" className="hover:text-[#e60012] transition">Productos</Link></li>
                        {category && (
                            <>
                                <li>/</li>
                                <li><Link href={`/productos?categoria=${category.slug}`} className="hover:text-[#e60012] transition">{category.name}</Link></li>
                            </>
                        )}
                        <li>/</li>
                        <li className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</li>
                    </ol>
                </nav>

                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
                            {product.images.length > 0 ? (
                                <img src={product.images[selectedImageIndex]?.url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="w-24 h-24 text-gray-300" /></div>
                            )}
                            {product.isFeatured && (
                                <span className="absolute top-4 left-4 bg-[#e60012] text-white px-3 py-1 rounded-full text-sm font-bold">Destacado</span>
                            )}
                            {!inStock && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">Sin Stock</span>
                                </div>
                            )}
                        </div>
                        {product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {product.images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                                            selectedImageIndex === index ? "border-[#e60012] ring-2 ring-[#e60012]/30" : "border-gray-200 hover:border-gray-400"
                                        }`}
                                    >
                                        <img src={image.url} alt={image.alt || `Imagen ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        {category && (
                            <Link href={`/productos?categoria=${category.slug}`} className="text-[#e60012] text-sm font-medium hover:underline mb-2">
                                {category.name}
                            </Link>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        <div className="flex items-center gap-3 mb-4">
                            <div>
                                <p className="text-3xl font-bold text-[#e60012]">{formatPrice(product.price)}</p>
                                <p className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    +{Math.floor(product.price)} puntos MOOVER con esta compra
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <HeartButton type="product" itemId={product.id} />
                                <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 transition" title="Compartir">
                                    <Share2 className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {inStock ? (
                            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium mb-4">
                                <Check className="w-4 h-4" /> En stock ({product.stock} disponibles)
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium mb-4">
                                <AlertCircle className="w-4 h-4" /> Sin stock
                            </span>
                        )}

                        {product.description && (
                            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                        )}

                        {/* Quantity + CTA */}
                        {inStock && (
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-700 font-medium">Cantidad:</span>
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition" disabled={quantity <= 1}>
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-10 text-center font-semibold">{quantity}</span>
                                        <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition" disabled={quantity >= product.stock}>
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={addedToCart}
                                        className={`flex-1 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition shadow-md ${addedToCart ? "bg-green-500" : "bg-[#e60012] hover:bg-[#cc000f]"}`}
                                    >
                                        {addedToCart ? <><Check className="w-5 h-5" /> ¡Agregado!</> : <><ShoppingCart className="w-5 h-5" /> Agregar al carrito</>}
                                    </button>
                                    <button onClick={handleAddAndGoToCart} className="flex-1 py-3.5 rounded-xl font-semibold border-2 border-[#e60012] text-[#e60012] hover:bg-red-50 transition">
                                        Comprar ahora
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Merchant card */}
                        {merchant && (
                            <Link href={`/tienda/${merchant.slug}`} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 hover:shadow-md transition group">
                                <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                                    {merchant.image ? (
                                        <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Store className="w-6 h-6 text-gray-400" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-semibold text-gray-900 group-hover:text-[#e60012] transition">{merchant.name}</p>
                                        {merchant.isVerified && <Shield className="w-4 h-4 text-blue-500" />}
                                        {merchant.isOpen ? (
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">ABIERTO</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">CERRADO</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                        {merchant.rating && (
                                            <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{merchant.rating.toFixed(1)}</span>
                                        )}
                                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min</span>
                                        {merchant.address && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3" />{merchant.address}</span>}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </Link>
                        )}

                        {/* Payment & Delivery info */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Truck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>Envío a todo Ushuaia — {merchant?.deliveryFee ? `$${merchant.deliveryFee.toLocaleString("es-AR")}` : "consultar"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <CreditCard className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span>Mercado Pago — tarjeta, débito o dinero en cuenta</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Banknote className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <span>Efectivo al recibir</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login modal removed — login required at checkout only */}
        </>
    );
}
