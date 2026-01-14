import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
import Link from "next/link";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    Image as ImageIcon
} from "lucide-react";
import Image from "next/image";

export default async function AdminProductsPage() {
    const products = await prisma.product.findMany({
        include: {
            categories: { include: { category: true } },
            images: true
        },
        orderBy: { name: "asc" }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
                    <p className="text-slate-500">Administrá tu catálogo, stock y precios.</p>
                </div>
                <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Nuevo Producto
                </Link>
            </div>

            {/* <ProductFilters /> - Future work */}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative border border-slate-200">
                                            {product.images?.[0]?.url ? (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt={product.images[0].alt || product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{product.name}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                                {product.slug}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {product.categories.map(c => c.category.name).join(", ") || "-"}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {formatPrice(product.price)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${product.stock <= 5 ? "text-red-600" : "text-green-600"}`}>
                                            {product.stock}
                                        </span>
                                        {product.stock <= 5 && (
                                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Bajo</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.isActive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {product.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/admin/products/${product.id}`}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
