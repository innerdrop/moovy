
import Link from "next/link";
import { Store, Plus } from "lucide-react";

interface ProductCardProps {
    product: {
        id: string;
        slug: string;
        name: string;
        price: number;
        description: string | null;
        image?: string | null; // Assuming image property structure
        isFeatured?: boolean;
        merchant?: {
            isOpen: boolean;
        };
    };
    showAddButton?: boolean;
}

export default function ProductCard({ product, showAddButton = false }: ProductCardProps) {
    return (
        <Link
            href={`/productos/${product.slug}`}
            className="card overflow-hidden group bg-white border border-gray-100 rounded-xl block h-full flex flex-col"
        >
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {/* Image placeholder */}
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    <Store className="w-10 h-10 opacity-20" />
                </div>

                {product.isFeatured && (
                    <span className="absolute top-2 left-2 bg-[#e60012] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        DESTACADO
                    </span>
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800 text-sm group-hover:text-[#e60012] transition line-clamp-2 mb-1">
                    {product.name}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-auto">
                    {product.description}
                </p>

                <div className="flex items-center justify-between mt-3">
                    <p className="text-lg font-bold text-[#e60012]">
                        ${product.price.toLocaleString("es-AR")}
                    </p>
                    {showAddButton && (
                        product.merchant?.isOpen !== false ? (
                            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#e60012] hover:text-white transition">
                                <Plus className="w-4 h-4" />
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
    );
}
