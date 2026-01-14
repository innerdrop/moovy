"use client";

// Product Card Component - Tarjeta de producto con botón Agregar funcional
import Link from "next/link";
import { Package, ShoppingCart, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/delivery";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        stock: number;
        isFeatured?: boolean;
        image?: string | null;
        categories?: { category: { name: string; slug: string } }[];
        merchantId?: string;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem, forceAddItem } = useCartStore();
    const [showConflict, setShowConflict] = useState(false);
    const [added, setAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();

        if (product.stock <= 0) return;

        const item = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image || undefined,
            merchantId: product.merchantId || "default",
        };

        const success = addItem(item);

        if (!success) {
            // Merchant conflict - show warning
            setShowConflict(true);
        } else {
            // Show added feedback
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
        }
    };

    const handleForceAdd = () => {
        const item = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image || undefined,
            merchantId: product.merchantId || "default",
        };
        forceAddItem(item);
        setShowConflict(false);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <>
            <Link
                href={`/productos/${product.slug}`}
                className="card overflow-hidden group flex flex-col h-full relative"
            >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="w-12 h-12" />
                    </div>
                    {product.isFeatured && (
                        <span className="absolute top-2 left-2 bg-[#e60012] text-white text-xs px-2 py-1 rounded-full">
                            ⭐ Destacado
                        </span>
                    )}
                    {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Sin Stock
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-4 flex flex-col flex-grow">
                    {/* Category */}
                    {product.categories?.[0] && (
                        <span className="text-xs text-[#e60012]">
                            {product.categories[0].category.name}
                        </span>
                    )}

                    {/* Name */}
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#e60012] transition line-clamp-2 mt-1 min-h-[2.5rem]">
                        {product.name}
                    </h3>

                    {/* Price */}
                    <p className="text-xl font-bold text-[#e60012] mt-2">
                        {formatPrice(product.price)}
                    </p>

                    {/* Spacer */}
                    <div className="flex-grow min-h-2"></div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                        className={`w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm rounded-lg font-semibold transition-all ${product.stock <= 0
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : added
                                    ? "bg-green-500 text-white"
                                    : "bg-[#e60012] text-white hover:bg-red-700 active:scale-[0.98]"
                            }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {added ? "¡Agregado!" : product.stock <= 0 ? "Sin Stock" : "Agregar"}
                    </button>
                </div>
            </Link>

            {/* Merchant Conflict Modal */}
            {showConflict && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">¿Cambiar de comercio?</h3>
                                <p className="text-sm text-gray-500">Tu carrito tiene productos de otro comercio</p>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-6">
                            Si agregás este producto, se vaciará tu carrito actual.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConflict(false)}
                                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleForceAdd}
                                className="flex-1 py-2 px-4 bg-[#e60012] text-white rounded-lg font-medium hover:bg-red-700"
                            >
                                Sí, cambiar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
