// Admin Products Page - Gestión de Productos
import { getAllProducts, getAllCategories } from "@/lib/db";
import { formatPrice } from "@/lib/delivery";
import Link from "next/link";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    AlertTriangle,
    Filter
} from "lucide-react";

async function getProducts() {
    return getAllProducts();
}

async function getCategories() {
    return getAllCategories();
}

export default async function ProductsPage() {
    const products = await getProducts();
    const categories = await getCategories();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Productos</h1>
                    <p className="text-gray-600">{products.length} productos en total</p>
                </div>
                <Link
                    href="/admin/productos/nuevo"
                    className="btn-primary flex items-center gap-2 w-fit"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Producto
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        className="input pl-10"
                    />
                </div>

                {/* Category Filter */}
                <select className="input w-full md:w-48">
                    <option value="">Todas las categorías</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                </select>

                {/* Stock Filter */}
                <select className="input w-full md:w-40">
                    <option value="">Todo el stock</option>
                    <option value="bajo">Stock bajo</option>
                    <option value="sin">Sin stock</option>
                </select>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-gray-600">Producto</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Categoría</th>
                                    <th className="text-right p-4 font-semibold text-gray-600">Costo</th>
                                    <th className="text-right p-4 font-semibold text-gray-600">Precio</th>
                                    <th className="text-right p-4 font-semibold text-gray-600">Margen</th>
                                    <th className="text-center p-4 font-semibold text-gray-600">Stock</th>
                                    <th className="text-center p-4 font-semibold text-gray-600">Estado</th>
                                    <th className="text-right p-4 font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.map((product) => {
                                    const margin = product.price - product.costPrice;
                                    const marginPercent = ((margin / product.costPrice) * 100).toFixed(1);
                                    const isLowStock = product.stock <= product.minStock;

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-navy">{product.name}</p>
                                                        <p className="text-xs text-gray-500">{product.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {product.categories.map((pc) => (
                                                    <span
                                                        key={pc.category.id}
                                                        className="inline-block bg-turquoise-light text-navy text-xs px-2 py-1 rounded-full mr-1"
                                                    >
                                                        {pc.category.name}
                                                    </span>
                                                ))}
                                            </td>
                                            <td className="p-4 text-right text-gray-600">
                                                {formatPrice(product.costPrice)}
                                            </td>
                                            <td className="p-4 text-right font-bold text-turquoise">
                                                {formatPrice(product.price)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div>
                                                    <span className="font-medium text-green-600">
                                                        {formatPrice(margin)}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        ({marginPercent}%)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${isLowStock
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-green-100 text-green-700"
                                                    }`}>
                                                    {isLowStock && <AlertTriangle className="w-3 h-3" />}
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs ${product.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {product.isActive ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/productos/${product.id}`}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4 text-gray-600" />
                                                    </Link>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded-lg transition"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            No hay productos
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Empezá agregando tu primer producto
                        </p>
                        <Link href="/admin/productos/nuevo" className="btn-primary">
                            <Plus className="w-5 h-5 mr-2 inline" />
                            Agregar Producto
                        </Link>
                    </div>
                )}
            </div>

            {/* Margin Calculator Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-navy mb-4">
                    🧮 Calculadora de Margen
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo del producto
                        </label>
                        <input
                            type="number"
                            placeholder="0"
                            className="input"
                            id="calc-cost"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Margen deseado (%)
                        </label>
                        <input
                            type="number"
                            placeholder="30"
                            defaultValue={30}
                            className="input"
                            id="calc-margin"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio sugerido
                        </label>
                        <div className="input bg-turquoise-light text-turquoise font-bold text-center">
                            $0
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ganancia
                        </label>
                        <div className="input bg-green-50 text-green-600 font-bold text-center">
                            $0
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    * Ingresá el costo y el margen deseado para calcular el precio de venta sugerido
                </p>
            </div>
        </div>
    );
}
