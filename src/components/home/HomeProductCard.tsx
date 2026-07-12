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
        <div className="group border border-gray-100 rounded-[18px] overflow-hidden bg-white hover-lift tap-bounce">
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
                    {/* Badge: Cerrado (prioridad) o Destacado */}
                    {isClosed ? (
                        <span className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {closedLabel}
                        </span>
                    ) : product.isFeatured ? (
                        <span className="absolute top-2 left-2 bg-[#e60012] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Destacado
                        </span>
                    ) : null}
                </div>
            </Link>

            <div className="p-3">
                {merchantName && (
                    <p className="text-[11px] text-gray-400 font-semibold mb-0.5 truncate">{merchantName}</p>
                )}
                <Link href={`/productos/${encodeURIComponent(product.slug)}`}>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#e60012] transition line-clamp-2 leading-tight mb-2 min-h-[36px]">
                        {product.name}
                    </h3>
                </Link>

                {/* Precio (negro) + botón "Agregar" (pill rojo) — como el diseño nuevo */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[16.5px] font-black text-gray-900">
                        ${product.price.toLocaleString("es-AR")}
                    </span>
                    <button
                        onClick={handleAdd}
                        disabled={isClosed}
                        title={isClosed ? `Tienda cerrada${product.merchant?.nextOpenLabel ? ` — ${product.merchant.nextOpenLabel}` : ""}` : "Agregar al carrito"}
                        className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full transition active:scale-95 flex-shrink-0 ${
                            isClosed
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : added
                                    ? "bg-green-500 text-white"
                                    : "bg-[#e60012] text-white shadow-[0_4px_10px_rgba(230,0,18,0.3)] hover:bg-[#cc000f]"
                        }`}
                    >
                        {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" strokeWidth={3} />}
                        {isClosed ? "Cerrado" : added ? "Agregado" : "Agregar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
