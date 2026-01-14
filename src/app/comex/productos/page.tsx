
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { redirect } from "next/navigation";

// Since this is a server component, we fetch data directly
async function getMerchantProducts(userId: string) {
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        select: { id: true }
    });

    if (!merchant) return null;

    const products = await prisma.product.findMany({
        where: { merchantId: merchant.id },
        orderBy: { name: 'asc' },
        include: {
            categories: {
                include: { category: true } // Assuming this relation exists as verified before
            }
        }
    });

    return products;
}

export default async function PartnerProductsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const products = await getMerchantProducts(session.user.id);

    if (!products) {
        return (
            <div className="text-center py-12">
                <p>No tienes una tienda asignada.</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mi Menú</h1>
                    <p className="text-gray-500">Gestiona tus productos y precios.</p>
                </div>
                <Link
                    href="/partner/productos/nuevo"
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Producto
                </Link>
            </div>

            {/* Filters (Visual only for now) */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012]"
                    />
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Precio</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {// Show first category or "Sin Categoría"
                                                product.categories?.[0]?.category.name || "Sin Categoría"
                                            }
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            ${product.price.toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {product.isActive ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Pausado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Link
                                                    href={`/partner/productos/${product.id}`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                {/* Actions to be implemented: Toggle Status, Delete */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <p className="mb-2">No tienes productos cargados.</p>
                                            <Link href="/partner/productos/nuevo" className="text-[#e60012] font-medium hover:underline">
                                                Crear el primero
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
