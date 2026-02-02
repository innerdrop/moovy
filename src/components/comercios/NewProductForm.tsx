"use client";

import { useState, useMemo } from "react";
import { createProduct, importCatalogProducts } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, ArrowLeft, Search, Package, Check, Plus, Layers, Ban, ShoppingBag, Sparkles, Edit } from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { cleanEncoding } from "@/lib/utils/stringUtils";

interface CatalogProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryId: string;
}

interface NewProductFormProps {
    categories: { id: string; name: string }[];
    catalogProducts: CatalogProduct[];
}

const cleanName = cleanEncoding;

export default function NewProductForm({ categories, catalogProducts }: NewProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState<string | boolean>(false);
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Catalog integration state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCatalogCategoryId, setSelectedCatalogCategoryId] = useState("");

    // Form values state for manual entry
    const [formValues, setFormValues] = useState({
        name: "",
        description: "",
        price: "" as string | number,
        categoryId: ""
    });

    const filteredCatalog = useMemo(() => {
        if (!selectedCatalogCategoryId) return [];
        return catalogProducts.filter(p =>
            p.categoryId === selectedCatalogCategoryId &&
            (searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [selectedCatalogCategoryId, searchTerm, catalogProducts]);

    const handleImportOne = async (product: CatalogProduct) => {
        setIsImporting(product.id);
        setError("");
        try {
            const result = await importCatalogProducts([product.id]);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccessMsg(`"${product.name}" agregado con éxito`);
                setTimeout(() => setSuccessMsg(""), 3000);
            }
        } catch (err) {
            setError("Error al importar");
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportAll = async () => {
        if (filteredCatalog.length === 0) return;
        setIsImporting(true);
        setError("");
        try {
            const ids = filteredCatalog.map(p => p.id);
            const result = await importCatalogProducts(ids);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccessMsg(`${result.count} productos agregados con éxito`);
                setTimeout(() => setSuccessMsg(""), 5000);
            }
        } catch (err) {
            setError("Error al importar el paquete");
        } finally {
            setIsImporting(false);
        }
    };

    const handleFillForm = (item: CatalogProduct) => {
        setFormValues({
            name: item.name,
            description: item.description,
            price: item.price,
            categoryId: item.categoryId
        });
        setImageUrl(item.imageUrl);
        setSearchTerm("");
        setSuccessMsg("Datos cargados correctamente");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError("");

        if (!imageUrl) {
            setError("Debes subir una imagen para el producto");
            setIsLoading(false);
            return;
        }

        formData.append("imageUrl", imageUrl);

        const result = await createProduct(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            // Redirect happens in server action
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Page Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/comercios/productos"
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition shadow-sm group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
                        <p className="text-sm text-gray-500 font-medium">Gestioná tu inventario con el catálogo oficial Moovy</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Ban className="w-4 h-4" />
                    </div>
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4" />
                    </div>
                    {successMsg}
                </div>
            )}

            {/* Premium Catalog Section - Gradient style from Dashboard */}
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 md:p-10 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/15 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />

                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 animate-pulse-slow">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Catálogo Oficial Moovy</h2>
                                <p className="text-blue-100 font-medium opcity-90">Fotos profesionales y descripciones optimizadas.</p>
                            </div>
                        </div>

                        {selectedCatalogCategoryId && filteredCatalog.length > 0 && (
                            <button
                                type="button"
                                onClick={handleImportAll}
                                disabled={!!isImporting}
                                className="bg-white text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow-lg active:scale-95 disabled:opacity-50 font-bold text-sm flex items-center gap-2"
                            >
                                {isImporting === true ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                                Importar {filteredCatalog.length} Productos
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <select
                                className="w-full bg-white/10 backdrop-blur-md border border-white/20 focus:bg-white/20 p-4 rounded-xl transition-all font-bold text-white shadow-sm appearance-none cursor-pointer pr-12 outline-none placeholder:text-blue-200"
                                value={selectedCatalogCategoryId}
                                onChange={(e) => {
                                    setSelectedCatalogCategoryId(e.target.value);
                                    setSearchTerm("");
                                }}
                            >
                                <option value="" className="text-gray-900">1. Seleccionar Rubro</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="text-gray-900">
                                        {cleanName(cat.name)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
                                <Layers className="w-5 h-5" />
                            </div>
                        </div>

                        {selectedCatalogCategoryId && (
                            <div className="relative animate-in fade-in slide-in-from-right-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                                <input
                                    type="text"
                                    placeholder="2. Buscar por nombre..."
                                    className="w-full pl-12 pr-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 focus:bg-white/20 rounded-xl shadow-sm transition-all font-medium text-white placeholder:text-blue-100/60 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Infinite-like scroll or clean list */}
                    {selectedCatalogCategoryId && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 max-h-[400px] overflow-y-auto scrollbar-hide border border-white/10">
                            {filteredCatalog.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {filteredCatalog.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white/10 border border-white/10 p-3 rounded-xl flex items-center gap-4 hover:bg-white/20 transition-all group/item"
                                        >
                                            <div className="w-14 h-14 rounded-lg bg-white/10 relative overflow-hidden shrink-0 border border-white/10">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full group-hover/item:scale-110 transition-transform duration-500" />
                                                ) : <Package className="w-5 h-5 absolute inset-0 m-auto text-blue-200/50" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                                                    <span className="px-1.5 py-0.5 bg-blue-500/30 border border-blue-400/20 rounded text-[8px] font-black text-white uppercase tracking-tighter shrink-0">
                                                        Adquirido
                                                    </span>
                                                </div>
                                                <p className="text-xs text-blue-100/70 mt-0.5">${item.price.toLocaleString("es-AR")}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleFillForm(item)}
                                                    className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/30 transition-colors"
                                                    title="Cargar datos"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleImportOne(item)}
                                                    disabled={!!isImporting}
                                                    className="p-2.5 bg-white text-blue-700 rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isImporting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-blue-100/50">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No hay productos que coincidan</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Divider */}
            <div className="flex items-center gap-4 py-4 px-2">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Carga Manual</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Manual Form Section */}
            <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-up">
                {/* Left: Image Side */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[3rem] -mr-8 -mt-8 -z-0 transition-all group-hover:bg-gray-100" />

                        <div className="relative z-10 text-center">
                            <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                                Visualización
                            </span>
                            <ImageUpload
                                value={imageUrl}
                                onChange={setImageUrl}
                                disabled={isLoading}
                            />
                            <p className="mt-4 text-[11px] text-gray-400 font-medium leading-relaxed">
                                Subí una foto nítida y bien iluminada <br />
                                <span className="text-gray-300">Recomendado: Fondo blanco o neutro</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full rotate-12 transition-transform group-hover:scale-125" />
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Tip de Ventas
                        </h4>
                        <p className="text-xs text-blue-100 leading-relaxed font-medium">
                            Los productos con buenas fotos y descripciones detalladas venden hasta un 40% más.
                        </p>
                    </div>
                </div>

                {/* Right: Details Side */}
                <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 ml-1">
                                Nombre del Producto
                            </label>
                            <input
                                name="name"
                                type="text"
                                required
                                placeholder="Ej. Alfajor de Maicena con Dulce de Leche"
                                className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-500 p-4 rounded-xl transition-all font-bold text-gray-900 outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300"
                                disabled={isLoading}
                                value={formValues.name}
                                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 ml-1">
                                Rubro / Categoría
                            </label>
                            <div className="relative">
                                <select
                                    name="categoryId"
                                    className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-500 p-4 rounded-xl transition-all font-bold text-gray-900 appearance-none outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 cursor-pointer"
                                    disabled={isLoading || categories.length === 0}
                                    value={formValues.categoryId}
                                    onChange={(e) => setFormValues({ ...formValues, categoryId: e.target.value })}
                                >
                                    <option value="" disabled>Elegir rubro...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cleanName(cat.name)}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                                    <Layers className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 ml-1">
                                Precio de Venta
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-500 p-4 pl-9 rounded-xl transition-all font-bold text-gray-900 outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300"
                                    disabled={isLoading}
                                    value={formValues.price}
                                    onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 ml-1">
                            Descripción del Producto
                        </label>
                        <textarea
                            name="description"
                            rows={4}
                            placeholder="Describí los detalles de tu producto para tus clientes..."
                            className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-500 p-4 rounded-xl transition-all font-medium text-gray-600 outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 resize-none placeholder:text-gray-300"
                            disabled={isLoading}
                            value={formValues.description}
                            onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                        />
                    </div>

                    <div className="flex pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary flex items-center justify-center gap-3 px-10 py-5 rounded-2xl shadow-xl shadow-red-500/10 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Plus className="w-6 h-6" />
                            )}
                            <span className="text-base font-bold">Publicar Producto en Tienda</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
