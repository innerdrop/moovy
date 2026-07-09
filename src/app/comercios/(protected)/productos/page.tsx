import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Plus, XCircle, Upload } from "lucide-react";
import ProductsSearchContainer from "@/components/comercios/ProductsSearchContainer";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function ProductosPage() {
    const session = await auth();

    // fix/panel-comercio-auditoria: el botón "Mis Paquetes" solo si el sistema
    // de Paquetes B2B está prendido (flag merchant.paquetes, hoy OFF).
    const paquetesEnabled = await isFeatureEnabled("merchant.paquetes");

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
    // + categorías activas para el cambio de categoría en lote.
    const [products, categories] = await Promise.all([
        prisma.product.findMany({
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
        }),
        prisma.category.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mis Productos</h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Gestiona tu inventario, precios y visibilidad</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {paquetesEnabled && (
                        <Link
                            href="/comercios/productos/desde-paquetes"
                            className="flex-1 md:flex-none py-4 px-6 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-sm text-center"
                        >
                            Mis Paquetes
                        </Link>
                    )}
                    <Link
                        href="/comercios/productos/importar"
                        className="flex-1 md:flex-none py-4 px-5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-sm text-center inline-flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Upload className="w-4 h-4" />
                        Importar CSV
                    </Link>
                    <Link
                        href="/comercios/productos/nuevo"
                        className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 py-4 px-5 shadow-xl shadow-red-500/20 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        Nuevo Producto
                    </Link>
                </div>
            </div>

            {/* Dynamic Search and List Container */}
            <ProductsSearchContainer initialProducts={products as any} categories={categories} />
        </div>
    );
}

