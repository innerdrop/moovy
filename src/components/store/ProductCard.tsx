"use client";

import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
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
        /** Puntos MOOVER que earnea este producto. SIEMPRE calculado server-side
            con calculatePointsEarned + getPointsConfig (nunca estimar en el
            cliente — el checkout ya tuvo ese bug). Si no viene, no se muestra. */
        points?: number | null;
        /** fix/comercio-pausa-stock-y-ajustes (2026-07-27): unidades disponibles.
            Antes esta card NO sabía de stock — un producto agotado se mostraba
            normal con el (+) activo, el cliente lo sumaba al carrito y recién en
            el checkout le decían que no había (el server SÍ valida stock, así
            que no hubo sobreventa: era fricción pura en el peor momento). */
        stock?: number;
    };
    showAddButton?: boolean;
}

/** Insignia MOOVER: círculo rojo degradé con estrella blanca — la misma marca
    del botón MOOVER de la nav, en miniatura. Único rojo lleno de la card. */
function MooverStar() {
    return (
        <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-[17px] h-[17px] rounded-full flex-shrink-0 shadow-[0_2px_5px_rgba(230,0,18,0.3)]"
            style={{ background: "linear-gradient(135deg,#ff4d2e,#e60012)" }}
        >
            <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] fill-white">
                <path d="M12 2.8l2.7 5.6 6.2.8-4.5 4.2 1.1 6.1L12 16.6l-5.5 2.9 1.1-6.1-4.5-4.2 6.2-.8z" />
            </svg>
        </span>
    );
}

// feat/rediseno-perfil-comercio (2026-07-25): card GRILLA VIDRIERA (opción A,
// decisión founder tras ver las 4 escuelas): tile vertical con la foto arriba
// (producto ENTERO en object-contain — nunca recortado), corazón y (+) montados
// sobre la foto, y abajo nombre + la fila de decisión: PRECIO negro extrabold a
// la izquierda y puntos MOOVER (insignia propia) enfrentados a la derecha.
// Sin descripción (vive en la ficha del producto). Economía del rojo: solo la
// insignia MOOVER y la cruz del (+).
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

    // Sin stock manda sobre "cerrado": aunque el comercio abra, este producto no
    // se puede comprar. Si `stock` no viene (callers viejos) no se asume nada.
    const isOutOfStock = typeof product.stock === "number" && product.stock <= 0;
    const isUnavailable = isOutOfStock || isClosed;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isUnavailable) return;

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
        <Link
            href={`/productos/${product.slug}`}
            title={isClosed && !isOutOfStock ? closedLabel : undefined}
            className={`group h-full flex flex-col bg-white rounded-2xl border border-gray-50 shadow-[0_3px_16px_rgba(23,24,28,0.07)] hover:shadow-[0_6px_22px_rgba(23,24,28,0.11)] transition-shadow overflow-hidden ${
                isUnavailable ? "opacity-60" : ""
            }`}
        >
            {/* Foto: producto ENTERO, con corazón y (+) montados */}
            <div className="relative aspect-[3/2]">
                {product.image ? (
                    <SmartImage
                        src={product.image}
                        alt={product.name}
                        className={`object-contain p-2 ${isUnavailable ? "grayscale" : ""}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <Store className="w-8 h-8 opacity-20" />
                    </div>
                )}

                {product.isFeatured && (
                    <span className="absolute top-2 left-2 bg-[#e60012] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        DESTACADO
                    </span>
                )}

                <HeartButton type="product" itemId={product.id} className="absolute top-2 right-2" />

                {showAddButton && !isUnavailable && (
                    <button
                        onClick={handleAddToCart}
                        aria-label={`Agregar ${product.name} al carrito`}
                        className={`absolute bottom-2 right-2 w-[34px] h-[34px] rounded-full flex items-center justify-center transition shadow-[0_3px_10px_rgba(0,0,0,0.15)] ${
                            added
                                ? "bg-green-500 text-white"
                                : "bg-white text-[#e60012] border border-gray-100 hover:bg-[#e60012] hover:text-white hover:border-[#e60012]"
                        }`}
                    >
                        {added ? <Check className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                    </button>
                )}
                {/* Comercio cerrado: NO se repite "CERRADO" en cada tarjeta
                    (founder 07-27: "es demasiado"). El catálogo se apaga entero y
                    el (+) desaparece — el aviso lo da la cabecera de la tienda una
                    sola vez, como hace PedidosYa. `closedLabel` sigue en el título
                    accesible para quien navegue con lector de pantalla. */}
            </div>

            {/* Nombre + fila de decisión: precio ⟷ puntos, enfrentados */}
            <div className="px-3 pb-3 pt-0.5 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900 text-base leading-[1.25] line-clamp-2 group-hover:text-[#e60012] transition">
                    {cleanEncoding(product.name)}
                </h3>
                {/* Fila de decisión. Agotado (opción C, founder 07-27): la FOTO
                    queda limpia — nada de sellos ni bandas encima. El precio se
                    tacha y "Agotado" ocupa el lugar de los puntos, que es donde el
                    ojo ya está mirando para decidir. Escuela Uber Eats. */}
                <div className="mt-auto pt-1.5 flex items-center justify-between gap-2">
                    <span
                        className={`text-lg font-extrabold tracking-tight leading-none ${
                            isOutOfStock ? "text-gray-400 line-through decoration-[1.5px]" : "text-[#17181c]"
                        }`}
                    >
                        ${product.price.toLocaleString("es-AR")}
                    </span>
                    {isOutOfStock ? (
                        <span className="text-[11.5px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full leading-none">
                            Agotado
                        </span>
                    ) : (
                        typeof product.points === "number" && product.points > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-gray-600">
                                <MooverStar />
                                +{product.points.toLocaleString("es-AR")}
                            </span>
                        )
                    )}
                </div>
            </div>
        </Link>
    );
}
