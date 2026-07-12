"use client";

import Link from "next/link";
import { getCategoryIcon } from "@/lib/icons";

// feat/rediseno-home: 3 categorías destacadas (tarjetas con imagen) + el resto como
// grilla de íconos. Reemplaza la fila auto-scroll anterior por el patrón del diseño.

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    image?: string | null;
}

interface CategoryGridProps {
    categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
    if (categories.length === 0) return null;
    const featured = categories.slice(0, 3);
    const more = categories.slice(3, 11);

    return (
        <div className="container mx-auto max-w-3xl lg:max-w-4xl">
            {/* Categorías destacadas */}
            {featured.length > 0 && (
                <div className="px-4">
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        {featured.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/productos?categoria=${cat.slug}`}
                                className="group rounded-[20px] overflow-hidden bg-white border border-gray-100 shadow-[0_8px_24px_rgba(80,5,10,0.10)]"
                            >
                                <div className="h-[92px] bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {cat.image ? (
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 flex items-center justify-center">
                                            {getCategoryIcon(cat.icon || cat.slug)}
                                        </div>
                                    )}
                                </div>
                                <div className="px-2.5 py-2.5 text-center">
                                    <span className="text-[12.5px] font-black text-gray-900 leading-tight">{cat.name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Más categorías — íconos */}
            {more.length > 0 && (
                <div className="px-4 pt-4">
                    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                        {more.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/productos?categoria=${cat.slug}`}
                                className="group flex flex-col items-center gap-1.5"
                            >
                                <div className="w-full aspect-square max-w-[86px] rounded-[22px] bg-white border border-gray-100 shadow-[0_2px_10px_rgba(30,10,5,0.06)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                    <div className="w-[62%] h-[62%] rounded-xl overflow-hidden flex items-center justify-center">
                                        {cat.image ? (
                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {getCategoryIcon(cat.icon || cat.slug)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[11.5px] font-extrabold text-gray-700 text-center leading-tight w-full">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
