"use client";

import Link from "next/link";
import { Store, Plus, Check } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";
import { useCartStore } from "@/store/cart";
import { useState } from "react";
import HeartButton from "@/components/ui/HeartButton";

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
            // Rama feat/bloqueo-comercio-cerrado
            // isCurrentlyOpen contempla pausa manual + horario (scheduleJson + timezone Ushuaia).
            // Cuando está presente, se usa este. Si no, fallback a isOpen (legacy).
            // El estado correcto se calcula con checkMerchantSchedule() en el server.
            isCurrentlyOpen?: boolean;
            // Texto opcional que la card muestra como "Abre Mañana 09:00".
            nextOpenLabel?: string | null;
        };
    };
    showAddButton?: boolean;
}

export default function ProductCard({ product, showAddButton = false }: ProductCardProps) {
    const addItem = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);

    // isClosed = TRUE si la tienda no está actualmente operativa (pausa O fuera de horario).
    // Si el caller calculó isCurrentlyOpen explícitamente lo respetamos; sino fallback al
    // chequeo crudo de isOpen (legacy, solo detecta pausa manual).
    const isClosed = product.merchant?.isCurrentlyOpen !== undefined
        ? !product.merchant.isCurrentlyOpen
        : product.merchant?.isOpen === false;
    const closedLabel = product.merchant?.nextOpenLabel || "CERRADO";

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isClosed) return;

        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image || undefined,
            merchantId: product.merchantId,
            type: "product",
        });

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

                    <HeartButton type="product" itemId={product.id} className="absolute top-2 right-2" />
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
                                <span
                                    className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded leading-tight max-w-[100px] text-right"
                                    title={closedLabel}
                                >
                                    {closedLabel}
                                </span>
                            )
                        )}
                    </div>
                </div>
            </Link>
        </>
    );
}
