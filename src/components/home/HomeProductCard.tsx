"use client";

import Link from "next/link";
import { Plus, Store, Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

interface HomeProductCardProps {
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        isFeatured?: boolean;
        images?: { url: string }[];
        merchant?: {
            id: string;
            name: string;
            slug: string;
            isOpen: boolean;
            // Rama feat/bloqueo-comercio-cerrado
            isCurrentlyOpen?: boolean;
            nextOpenLabel?: string | null;
        } | null;
    };
}

export default function HomeProductCard({ product }: HomeProductCardProps) {
    const image = product.images?.[0]?.url;
    const merchantName = product.merchant?.name || "";
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);
    const [added, setAdded] = useState(false);

    // Cerrado = pausa manual O fuera de horario. Respeta isCurrentlyOpen si vino calculado.
    const isClosed = product.merchant?.isCurrentlyOpen !== undefined
        ? !product.merchant.isCurrentlyOpen
        : product.merchant?.isOpen === false;
    const closedLabel = product.merchant?.nextOpenLabel || "Cerrado";

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isClosed) return;

        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: image || undefined,
            merchantId: product.merchant?.id,
            merchantName: product.merchant?.name,
            type: "product",
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    return (
        <div className="group border border-gray-100 rounded-xl overflow-hidden bg-white hover-lift tap-bounce">
            <Link href={`/productos/${encodeURIComponent(product.slug)}`}>
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {image ? (
                        <img
                            src={image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Store className="w-12 h-12 text-gray-200" />
                        </div>
                    )}
                    {product.isFeatured && (
                        <span className="absolute top-2 left-2 bg-[#e60012] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Destacado
                        </span>
                    )}
                </div>
            </Link>

            <div className="p-3 relative">
                {/* Add to cart button — funcional. Si la tienda está cerrada, el botón
                    queda en gris y no agrega al carrito (rama feat/bloqueo-comercio-cerrado). */}
                <button
                    onClick={handleAdd}
                    disabled={isClosed}
                    title={isClosed ? `Tienda cerrada${product.merchant?.nextOpenLabel ? ` — ${product.merchant.nextOpenLabel}` : ""}` : undefined}
                    className={`absolute -top-4 right-3 w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold shadow-md border-[3px] border-white transition-all z-10 ${
                        isClosed
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : added
                                ? "bg-green-500 text-white hover:scale-110"
                                : "bg-[#e60012] hover:bg-[#cc000f] text-white hover:scale-110"
                    }`}
                >
                    {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
                {isClosed && (
                    <span className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                        {closedLabel}
                    </span>
                )}

                {merchantName && (
                    <p className="text-xs text-gray-400 font-medium mb-0.5 truncate">{merchantName}</p>
                )}
                <Link href={`/productos/${encodeURIComponent(product.slug)}`}>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#e60012] transition line-clamp-2 leading-tight mb-1">
                        {product.name}
                    </h3>
                </Link>
                <p className="text-lg font-extrabold text-[#e60012]">
                    ${product.price.toLocaleString("es-AR")}
                </p>
            </div>
        </div>
    );
}
