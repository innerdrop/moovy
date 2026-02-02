import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Plus, XCircle } from "lucide-react";
import ProductsSearchContainer from "@/components/comercios/ProductsSearchContainer";

export default async function ProductosPage() {
    const session = await auth();

    // Find merchant
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session?.user?.id },
    });

    if (!merchant) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Error de Cuenta</h2>
                <p className="text-gray-500 font-medium">No tienes un comercio asociado a este usuario.</p>
            </div>
        );
    }

    // Fetch all products (both active and inactive) so merchant can manage them
    const products = await prisma.product.findMany({
        where: { merchantId: merchant.id },
        include: {
            images: {
                orderBy: { order: 'asc' },
                take: 1
            },
            categories: {
                include: {
                    category: true
                }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mis Productos</h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Gestiona tu inventario, precios y visibilidad</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link
                        href="/comercios/productos/desde-paquetes"
                        className="flex-1 md:flex-none py-4 px-6 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-sm text-center"
                    >
                        Ver Rubros Oficiales
                    </Link>
                    <Link
                        href="/comercios/productos/nuevo"
                        className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-3 py-4 px-8 shadow-xl shadow-red-500/20"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        Nuevo Producto
                    </Link>
                </div>
            </div>

            {/* Dynamic Search and List Container */}
            <ProductsSearchContainer initialProducts={products as any} />
        </div>
    );
}

