"use client";

// Product Detail Page - Página de Detalle de Producto
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";
import {
    ChevronLeft,
    Package,
    ShoppingCart,
    Plus,
    Minus,
    Check,
    AlertCircle,
    Loader2
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    categories: Array<{ category: { id: string; name: string; slug: string } }>;
    images: Array<{ id: string; url: string; alt: string | null }>;
}

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);

    useEffect(() => {
        async function fetchProduct() {
            try {
                const response = await fetch(`/api/products/${slug}`);
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

        if (slug) {
            fetchProduct();
        }
    }, [slug]);

    const handleAddToCart = () => {
        if (!product || product.stock <= 0) return;

        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.images[0]?.url || undefined,
        });

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleAddAndGoToCart = () => {
        handleAddToCart();
        setTimeout(() => openCart(), 300);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-navy mb-4">Producto no encontrado</h1>
                <p className="text-gray-600 mb-6">El producto que buscás no existe o fue eliminado.</p>
                <Link href="/productos" className="btn-primary">
                    Ver todos los productos
                </Link>
            </div>
        );
    }

    const category = product.categories[0]?.category;
    const inStock = product.stock > 0;

    return (
        <div className="container mx-auto px-4 py-6 lg:py-10">
            {/* Breadcrumb */}
            <nav className="mb-6">
                <ol className="flex items-center gap-2 text-sm text-gray-500">
                    <li>
                        <Link href="/" className="hover:text-[#e60012] transition">
                            Inicio
                        </Link>
                    </li>
                    <li>/</li>
                    <li>
                        <Link href="/productos" className="hover:text-[#e60012] transition">
                            Productos
                        </Link>
                    </li>
                    {category && (
                        <>
                            <li>/</li>
                            <li>
                                <Link
                                    href={`/productos?categoria=${category.slug}`}
                                    className="hover:text-[#e60012] transition"
                                >
                                    {category.name}
                                </Link>
                            </li>
                        </>
                    )}
                    <li>/</li>
                    <li className="text-navy font-medium truncate max-w-[150px]">
                        {product.name}
                    </li>
                </ol>
            </nav>

            {/* Back Link (Mobile) */}
            <Link
                href="/productos"
                className="lg:hidden inline-flex items-center text-gray-600 hover:text-[#e60012] mb-4"
            >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Volver
            </Link>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
                    {product.images.length > 0 ? (
                        <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-24 h-24 text-gray-300" />
                        </div>
                    )}

                    {product.isFeatured && (
                        <span className="absolute top-4 left-4 bg-[#e60012] text-white px-3 py-1 rounded-full text-sm font-medium">
                            ⭐ Destacado
                        </span>
                    )}

                    {!inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
                                Sin Stock
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                    {/* Category */}
                    {category && (
                        <Link
                            href={`/productos?categoria=${category.slug}`}
                            className="text-[#e60012] text-sm font-medium hover:underline mb-2"
                        >
                            {category.name}
                        </Link>
                    )}

                    {/* Name */}
                    <h1 className="text-3xl lg:text-4xl font-bold text-navy mb-4">
                        {product.name}
                    </h1>

                    {/* Price */}
                    <p className="text-3xl lg:text-4xl font-bold text-[#e60012] mb-6">
                        {formatPrice(product.price)}
                    </p>

                    {/* Description */}
                    {product.description && (
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    {/* Stock Status */}
                    <div className="flex items-center gap-2 mb-6">
                        {inStock ? (
                            <>
                                <Check className="w-5 h-5 text-green-500" />
                                <span className="text-green-600 font-medium">
                                    En stock ({product.stock} disponibles)
                                </span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <span className="text-red-600 font-medium">
                                    Sin stock
                                </span>
                            </>
                        )}
                    </div>

                    {/* Quantity Selector */}
                    {inStock && (
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-gray-700 font-medium">Cantidad:</span>
                            <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-semibold text-lg">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
                                    disabled={quantity >= product.stock}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add to Cart Buttons */}
                    {inStock && (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={addedToCart}
                                className={`btn-primary flex-1 py-4 flex items-center justify-center gap-2 text-lg ${addedToCart ? "bg-green-500" : ""
                                    }`}
                            >
                                {addedToCart ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        ¡Agregado!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        Agregar al Carrito
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleAddAndGoToCart}
                                className="btn-outline flex-1 py-4 text-lg"
                            >
                                Comprar Ahora
                            </button>
                        </div>
                    )}

                    {/* Extra Info */}
                    <div className="mt-8 pt-6 border-t space-y-3 text-sm text-gray-600">
                        <p>🚚 Envío a todo San Juan</p>
                        <p>💳 Efectivo o Mercado Pago</p>
                        <p>📞 Consultas por WhatsApp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
