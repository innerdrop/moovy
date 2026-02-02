"use client";

import { useState } from "react";
import { createProduct } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, ArrowLeft, Search, Package, Check, Plus, Layers, Ban } from "lucide-react";
import Link from 'next/link';

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

export default function NewProductForm({ categories, catalogProducts }: NewProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState("");

    // Catalog integration state
    const [searchTerm, setSearchTerm] = useState("");
    const [showCatalogList, setShowCatalogList] = useState(false);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogProduct | null>(null);
    const [selectedCatalogCategoryId, setSelectedCatalogCategoryId] = useState("");

    // Form values state for auto-population
    const [formValues, setFormValues] = useState({
        name: "",
        description: "",
        price: "" as string | number,
        categoryId: ""
    });

    const handleSelectCatalogProduct = (item: CatalogProduct) => {
        setSelectedCatalogItem(item);
        setFormValues({
            name: item.name,
            description: item.description,
            price: item.price,
            categoryId: item.categoryId
        });
        setImageUrl(item.imageUrl);
        setShowCatalogList(false);
        setSearchTerm("");
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
        <form action={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/comercios/productos"
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Guardar Producto
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            {/* Catalog Search Selection - Step 1: Category */}
            <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 space-y-6 shadow-sm shadow-blue-50">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-blue-900 uppercase tracking-tighter">Cargar desde Catálogo Moovy</h2>
                        <p className="text-xs text-blue-700/60 font-bold uppercase tracking-widest italic">Paso 1: Seleccioná el rubro</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <select
                            className="w-full bg-white border-2 border-transparent focus:border-blue-500 p-4 rounded-2xl transition-all font-black text-blue-900 uppercase tracking-tight shadow-sm appearance-none cursor-pointer"
                            value={selectedCatalogCategoryId}
                            onChange={(e) => {
                                setSelectedCatalogCategoryId(e.target.value);
                                setSelectedCatalogItem(null);
                                setSearchTerm("");
                            }}
                        >
                            <option value="">Elegir Rubro / Categoría...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>

                    {selectedCatalogCategoryId && (
                        <div className="relative animate-in slide-in-from-right-4 duration-300">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                            <input
                                type="text"
                                placeholder="Paso 2: Buscá el producto..."
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl shadow-sm transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowCatalogList(true);
                                }}
                                onFocus={() => setShowCatalogList(true)}
                            />
                        </div>
                    )}
                </div>

                {showCatalogList && selectedCatalogCategoryId && (
                    <div className="relative">
                        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-2xl max-h-80 overflow-y-auto p-3 space-y-1 animate-in fade-in zoom-in duration-300">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-2">Productos en este rubro</p>
                            {catalogProducts
                                .filter(p =>
                                    p.categoryId === selectedCatalogCategoryId &&
                                    p.name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectCatalogProduct(item)}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 rounded-2xl transition text-left group"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-slate-100 relative shrink-0 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <Package className="w-7 h-7 absolute inset-0 m-auto text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 text-sm uppercase leading-tight tracking-tight">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sugerido: ${item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-blue-100 p-2 rounded-xl text-blue-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </button>
                                ))
                            }
                            {catalogProducts.filter(p => p.categoryId === selectedCatalogCategoryId && p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <div className="p-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <Ban className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-xs text-slate-400 font-bold italic uppercase tracking-widest">No hay más productos en este rubro</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {selectedCatalogItem && (
                    <div className="flex items-center justify-between p-4 bg-white/80 border border-blue-200 rounded-2xl animate-in slide-in-from-top-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
                                <Check className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-blue-900 uppercase tracking-tight leading-none mb-1">Vinculado con éxito</p>
                                <p className="text-sm font-bold text-slate-600 italic">Base de datos de: {selectedCatalogItem.name}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCatalogItem(null);
                                setFormValues({ name: "", description: "", price: "", categoryId: "" });
                                setImageUrl("");
                                setSelectedCatalogCategoryId("");
                            }}
                            className="bg-slate-100 hover:bg-red-50 hover:text-red-600 p-2 rounded-xl transition-all"
                            title="Quitar Vínculo"
                        >
                            <Ban className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Image */}
                <div className="md:col-span-1 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagen del Producto
                        </label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={setImageUrl}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Recomendado: 800x800px. Formato cuadrado.
                        </p>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Producto
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="Ej. Hamburguesa Doble con Queso"
                            className="input"
                            disabled={isLoading}
                            value={formValues.name}
                            onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                        </label>
                        <select
                            name="categoryId"
                            className="input"
                            disabled={isLoading || categories.length === 0}
                            value={formValues.categoryId}
                            onChange={(e) => setFormValues({ ...formValues, categoryId: e.target.value })}
                        >
                            <option value="" disabled>Seleccionar categoría...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {categories.length === 0 && (
                            <p className="text-xs text-yellow-600 mt-1">
                                No hay categorías activas. Contacta a soporte.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="input !pl-10"
                                    disabled={isLoading}
                                    value={formValues.price}
                                    onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock Inicial
                            </label>
                            <input
                                name="stock"
                                type="number"
                                min="0"
                                required
                                placeholder="Ej. 100"
                                className="input"
                                defaultValue="100"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción (Opcional)
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Describe los ingredientes o detalles..."
                            className="input"
                            disabled={isLoading}
                            value={formValues.description}
                            onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
