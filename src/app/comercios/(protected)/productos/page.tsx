import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, Package, Layers, ArrowRight } from "lucide-react";
import ProductStatusToggle from "@/components/comercios/ProductStatusToggle";

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

            {/* Promo Banner - Products from Packages */}
            <Link
                href="/comercios/productos/desde-paquetes"
                className="group flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">¿Tenés paquetes adquiridos?</h3>
                        <p className="text-white/80 text-sm">Gestioná qué productos mostrar en tu tienda de forma visual</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl font-bold text-sm group-hover:bg-white/30 transition">
                    Ver Paquetes
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>

            {/* List */}
            {products.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Tu catálogo está vacío</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Agrega tus productos para empezar a vender. Recuerda subir fotos de calidad.
                    </p>
                    <Link
                        href="/comercios/productos/nuevo"
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Primer Producto
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop Table Header (hidden on mobile) */}
                    <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <div className="col-span-2">Producto</div>
                        <div>Categoría</div>
                        <div>Precio</div>
                        <div>Stock</div>
                        <div className="text-right">Acciones</div>
                    </div>

                    {/* Products Grid/List */}
                    <div className="grid grid-cols-1 md:block gap-4">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl md:rounded-none md:border-b md:last:border-b-0 border border-gray-100 md:border-gray-50 p-4 md:px-6 md:py-4 hover:bg-gray-50 transition group"
                            >
                                <div className="flex flex-col md:grid md:grid-cols-6 gap-4 items-center">
                                    {/* Product Info */}
                                    <div className="col-span-2 flex items-center gap-4 w-full">
                                        <div className="w-16 h-16 md:w-12 md:h-12 rounded-xl bg-gray-100 relative overflow-hidden flex-shrink-0 shadow-sm">
                                            {product.images[0]?.url ? (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform"
                                                />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate">{product.name}</h4>
                                            <span className="md:hidden text-xs text-gray-500">
                                                {product.categories[0]?.category.name || "Sin categoría"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Category (Desktop only) */}
                                    <div className="hidden md:block text-sm text-gray-600 font-medium">
                                        {product.categories[0]?.category.name || "—"}
                                    </div>

                                    {/* Price and Stock (Mobile: Row) */}
                                    <div className="flex items-center justify-between w-full md:contents">
                                        <div className="font-bold text-blue-600 md:text-gray-900">
                                            ${product.price.toLocaleString("es-AR")}
                                        </div>

                                        <div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${product.stock > 10 ? "bg-green-100 text-green-700" :
                                                product.stock > 0 ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                                }`}>
                                                {product.stock} un.
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2 md:w-full">
                                        <ProductStatusToggle
                                            productId={product.id}
                                            initialStatus={product.isActive}
                                        />
                                        <Link
                                            href={`/comercios/productos/${product.id}`}
                                            className="md:p-2 py-2 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition text-center text-sm font-bold flex items-center justify-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span className="md:hidden">Editar</span>
                                        </Link>
                                        <button
                                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 transition hidden md:block"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

