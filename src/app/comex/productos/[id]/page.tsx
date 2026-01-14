
import { createProduct, updateProduct } from "@/actions/partner-products";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Get categories for the select dropdown
async function getCategories() {
    return await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
    });
}

async function getProduct(id: string) {
    return await prisma.product.findUnique({
        where: { id },
        include: {
            categories: true
        }
    });
}

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isNew = id === "nuevo";

    const session = await auth();
    if (!session) redirect("/login");

    let product = null;
    if (!isNew) {
        product = await getProduct(id);
        if (!product) {
            return <div>Producto no encontrado</div>;
        }
    }

    const categories = await getCategories();
    const activeCategoryId = product?.categories?.[0]?.categoryId || "";

    // We use a simple form action depending on mode
    // Note: In a real app we might use useFormState/useFormStatus for client feedback
    // but for MVP server actions + standard form submission is easiest.

    const updateAction = updateProduct.bind(null, id);

    return (
        <div className="max-w-2xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/partner/productos" className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isNew ? "Nuevo Producto" : "Editar Producto"}
                    </h1>
                    <p className="text-gray-500">
                        {isNew ? "Agrega un item a tu menú" : `Editando: ${product?.name}`}
                    </p>
                </div>
            </div>

            <form action={isNew ? createProduct : updateAction} className="space-y-6">

                {/* Basic Info Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Información Básica</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={product?.name}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012]"
                            placeholder="Ej. Hamburguesa Doble"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            name="description"
                            defaultValue={product?.description || ""}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012]"
                            placeholder="Ingredientes, tamaño, detalles..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                            <input
                                type="number"
                                name="price"
                                defaultValue={product?.price}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <select
                                name="categoryId"
                                defaultValue={activeCategoryId}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] bg-white"
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Estado Visible</h3>
                        <p className="text-sm text-gray-500">¿El producto está disponible para la venta?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={product?.isActive ?? true}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e60012]"></div>
                    </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="btn-primary flex items-center gap-2 px-8"
                    >
                        <Save className="w-5 h-5" />
                        Guardar Producto
                    </button>
                </div>
            </form>
        </div>
    );
}
