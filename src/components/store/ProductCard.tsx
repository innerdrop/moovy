import Link from "next/link";
import { Store, Plus, Check, ShoppingCart, AlertCircle } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

interface ProductCardProps {
    product: {
        id: string;
        slug: string;
        name: string;
        price: number;
        description: string | null;
        image?: string | null;
        isFeatured?: boolean;
        merchantId?: string;
        merchant?: {
            isOpen: boolean;
        };
    };
    showAddButton?: boolean;
}

export default function ProductCard({ product, showAddButton = false }: ProductCardProps) {
    const { addItem, forceAddItem } = useCartStore();
    const [added, setAdded] = useState(false);
    const [showConflict, setShowConflict] = useState(false);

    const isClosed = product.merchant?.isOpen === false;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isClosed) return;

        const item = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image || undefined,
            merchantId: product.merchantId,
        };

        const success = addItem(item);

        if (!success) {
            setShowConflict(true);
        } else {
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
        }
    };

    const handleForceAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

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
                className="card overflow-hidden group bg-white border border-gray-100 rounded-xl block h-full flex flex-col relative"
            >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <Store className="w-10 h-10 opacity-20" />
                        </div>
                    )}

                    {product.isFeatured && (
                        <span className="absolute top-2 left-2 bg-[#e60012] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            DESTACADO
                        </span>
                    )}
                </div>

                <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-800 text-sm group-hover:text-[#e60012] transition line-clamp-2 mb-1">
                        {cleanEncoding(product.name)}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-2 mb-auto">
                        {cleanEncoding(product.description)}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                        <p className="text-lg font-bold text-[#e60012]">
                            ${product.price.toLocaleString("es-AR")}
                        </p>
                        {showAddButton && (
                            !isClosed ? (
                                <button
                                    onClick={handleAddToCart}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${added ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-[#e60012] hover:text-white"
                                        }`}
                                >
                                    {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>
                            ) : (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                                    CERRADO
                                </span>
                            )
                        )}
                    </div>
                </div>
            </Link>

            {/* Merchant Conflict Modal */}
            {showConflict && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
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
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConflict(false); }}
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
