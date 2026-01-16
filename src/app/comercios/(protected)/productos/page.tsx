import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";

export default async function ProductosPage() {
    const session = await auth();

    // Find merchant
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session?.user?.id },
    });

    if (!merchant) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-gray-800">Error de Cuenta</h2>
                <p className="text-gray-500">No tienes un comercio asociado.</p>
            </div>
        );
    }

    const products = await prisma.product.findMany({
        where: { merchantId: merchant.id },
        include: { images: true, categories: { include: { category: true } } },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flax-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
                    <p className="text-gray-500">Gestiona tu catálogo y precios</p>
                </div>
                <Link
                    href="/comercios/productos/nuevo"
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Producto
                </Link>
            </div>

            {/* List */}
            {products.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Tu catálogo está vacío</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Agrega tus productos para empezar a vender. Recuerda subir fotos de calidad.
                    </p>
                    <Link
                        href="/comercios/productos/nuevo"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Primer Producto
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Producto</th>
                                    <th className="px-6 py-3 font-medium">Categoría</th>
                                    <th className="px-6 py-3 font-medium">Precio</th>
                                    <th className="px-6 py-3 font-medium">Stock</th>
                                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 relative overflow-hidden flex-shrink-0">
                                                    {product.images[0]?.url ? (
                                                        <Image
                                                            src={product.images[0].url}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {product.categories[0]?.category.name || "Sin categoría"}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            ${product.price.toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                {product.stock} un.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 p-2">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
