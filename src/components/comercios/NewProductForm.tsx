"use client";

import { useState, useMemo } from "react";
import { createProduct, importCatalogProducts } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import SizeSelector from "@/components/comercios/SizeSelector";
import { ProductSize, SIZE_METADATA, getSizeFromWeight } from "@/lib/product-weight";
import { Loader2, Plus, ArrowLeft, Search, Package, Check, Layers, Ban, Sparkles, Edit, Info, Image as ImageIcon, Settings } from "lucide-react";
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
    allCategories: { id: string; name: string }[];
}

const cleanName = cleanEncoding;

export default function NewProductForm({ categories, catalogProducts, allCategories }: NewProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState<string | boolean>(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Catalog state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCatalogCategoryId, setSelectedCatalogCategoryId] = useState("");

    // Form values
    const [formValues, setFormValues] = useState({
        name: "",
        description: "",
        price: "" as string | number,
        stock: "10" as string | number,
        categoryId: "",
        // Rama feat/peso-volumen-productos: peso/volumen unitarios
        weightGrams: "" as string | number,
        volumeMl: "" as string | number,
        packageCategoryId: "",
    });

    // Tamaño elegido por el comerciante (Glovo-style). null = ninguno seleccionado.
    const [productSize, setProductSize] = useState<ProductSize | null>(null);
    // Modo avanzado: el comerciante puede tipear gramos exactos en vez de elegir categoría
    const [advancedMode, setAdvancedMode] = useState(false);
    // Estado del botón "Sugerir tamaño"
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionInfo, setSuggestionInfo] = useState<string>("");

    /**
     * Cuando el comerciante elige una categoría visual, autocompletamos los
     * weightGrams/volumeMl internos con el default de la categoría. Esos
     * valores son los que persiste el server action.
     */
    const handleSelectSize = (size: ProductSize) => {
        const meta = SIZE_METADATA[size];
        setProductSize(size);
        setFormValues((prev) => ({
            ...prev,
            weightGrams: meta.weightGrams,
            volumeMl: meta.volumeMl,
        }));
    };

    const hasCatalog = catalogProducts.length > 0;

    const filteredCatalog = useMemo(() => {
        if (!selectedCatalogCategoryId) return [];
        return catalogProducts.filter(p =>
            p.categoryId === selectedCatalogCategoryId &&
            (searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [selectedCatalogCategoryId, searchTerm, catalogProducts]);

    // Use allCategories for manual form (independent of purchased catalog)
    const manualCategories = allCategories.length > 0 ? allCategories : categories;

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
            stock: 10,
            categoryId: item.categoryId,
            weightGrams: "",
            volumeMl: "",
            packageCategoryId: "",
        });
        if (item.imageUrl) setImageUrls([item.imageUrl]);
        setSearchTerm("");
        setFieldErrors({});
        setSuccessMsg("Datos cargados — editá lo que quieras y publicá");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    /**
     * Pide al backend una sugerencia de peso/volumen para el producto actual.
     * Endpoint: POST /api/comercios/products/suggest-weight
     * Resultado: autocompleta los campos. El comercio puede ajustar.
     */
    const handleSuggestWeight = async () => {
        if (!formValues.name || formValues.name.trim().length < 2) {
            setSuggestionInfo("Ingresá un nombre antes de pedir sugerencia");
            setTimeout(() => setSuggestionInfo(""), 3000);
            return;
        }
        setIsSuggesting(true);
        setSuggestionInfo("");
        try {
            const res = await fetch("/api/comercios/products/suggest-weight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formValues.name,
                    description: formValues.description || null,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setSuggestionInfo(err.error || "No se pudo obtener sugerencia");
                return;
            }
            const data = await res.json();
            if (data.weightGrams && data.volumeMl) {
                // Mapear el peso sugerido a una categoría visual (a menos que el
                // backend ya haya devuelto suggestedSize)
                const suggestedSize: ProductSize = data.suggestedSize || getSizeFromWeight(data.weightGrams);
                setProductSize(suggestedSize);
                setFormValues((prev) => ({
                    ...prev,
                    weightGrams: data.weightGrams,
                    volumeMl: data.volumeMl,
                    packageCategoryId: data.packageCategoryId || prev.packageCategoryId,
                }));
                const sourceLabel =
                    data.source === "CACHE" ? "encontrado en catálogo común" :
                    data.source === "AI" ? "sugerido por IA" :
                    data.source === "HEURISTIC" ? "estimado por nombre" :
                    "sugerencia";
                const sizeName = SIZE_METADATA[suggestedSize].displayName;
                setSuggestionInfo(`Tamaño ${sourceLabel}: ${sizeName}. Podés cambiarlo si no coincide.`);
            } else {
                setSuggestionInfo("No encontramos tamaño para este producto. Elegí uno manualmente.");
            }
            setTimeout(() => setSuggestionInfo(""), 6000);
        } catch (err) {
            setSuggestionInfo("Error al obtener sugerencia. Cargá los valores manualmente.");
            setTimeout(() => setSuggestionInfo(""), 4000);
        } finally {
            setIsSuggesting(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formValues.name || formValues.name.length < 3) {
            errors.name = "El nombre debe tener al menos 3 caracteres";
        }
        if (imageUrls.length === 0) {
            errors.image = "Subí al menos una imagen del producto";
        }
        if (!formValues.price || Number(formValues.price) <= 0) {
            errors.price = "Ingresá un precio válido mayor a $0";
        }
        if (formValues.stock === "" || Number(formValues.stock) < 0) {
            errors.stock = "El stock no puede ser negativo";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError("");
        setFieldErrors({});

        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        // Send imageUrls as JSON array (matches schema expectation)
        formData.set("imageUrls", JSON.stringify(imageUrls));

        const result = await createProduct(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    const fieldClass = (field: string) =>
        `w-full bg-gray-50 border ${fieldErrors[field] ? "border-red-400 bg-red-50/30 ring-2 ring-red-400/20" : "border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"} focus:bg-white p-4 rounded-xl transition-all font-bold text-gray-900 outline-none shadow-sm placeholder:text-gray-300`;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/comercios/productos" className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition shadow-sm group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
                        <p className="text-sm text-gray-500 font-medium">Agregá productos a tu tienda</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Ban className="w-4 h-4" />
                    </div>
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-sm font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4" />
                    </div>
                    {successMsg}
                </div>
            )}

            {/* Catalog Section - only if merchant has purchased packages */}
            {hasCatalog && (
                <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />

                    <div className="relative z-10 space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Importar del Catálogo MOOVY</h2>
                                    <p className="text-blue-100 text-sm">Productos con fotos profesionales listos para publicar. Elegí un rubro y agregá con un click.</p>
                                </div>
                            </div>

                            {selectedCatalogCategoryId && filteredCatalog.length > 0 && (
                                <button type="button" onClick={handleImportAll} disabled={!!isImporting}
                                    className="bg-white text-blue-700 px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow-lg disabled:opacity-50 font-bold text-sm flex items-center gap-2">
                                    {isImporting === true ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                                    Importar {filteredCatalog.length} productos
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <select
                                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl font-bold text-white shadow-sm appearance-none cursor-pointer pr-12 outline-none"
                                    value={selectedCatalogCategoryId}
                                    onChange={(e) => { setSelectedCatalogCategoryId(e.target.value); setSearchTerm(""); }}
                                >
                                    <option value="" className="text-gray-900">Seleccionar Rubro</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id} className="text-gray-900">{cleanName(cat.name)}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60"><Layers className="w-5 h-5" /></div>
                            </div>

                            {selectedCatalogCategoryId && (
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                                    <input type="text" placeholder="Buscar por nombre..." className="w-full pl-12 pr-4 p-4 bg-white/10 border border-white/20 rounded-xl font-medium text-white placeholder:text-blue-100/60 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            )}
                        </div>

                        {selectedCatalogCategoryId && (
                            <div className="bg-white/10 rounded-xl p-2 max-h-[350px] overflow-y-auto border border-white/10">
                                {filteredCatalog.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {filteredCatalog.map((item) => (
                                            <div key={item.id} className="bg-white/10 border border-white/10 p-3 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-all">
                                                <div className="w-12 h-12 rounded-lg bg-white/10 relative overflow-hidden shrink-0 border border-white/10">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                                                    ) : <Package className="w-5 h-5 absolute inset-0 m-auto text-blue-200/50" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                                                    <p className="text-xs text-blue-100/70">${item.price.toLocaleString("es-AR")}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={() => handleFillForm(item)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/30 transition" title="Editar y publicar">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleImportOne(item)} disabled={!!isImporting} className="p-2 bg-white text-blue-700 rounded-lg hover:shadow-lg transition disabled:opacity-50">
                                                        {isImporting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-blue-100/50">
                                        <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm font-medium">No hay productos que coincidan</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* If no catalog, show info banner */}
            {!hasCatalog && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-blue-900">Catálogo MOOVY disponible</p>
                        <p className="text-xs text-blue-700 mt-1">
                            Podés comprar paquetes de productos con fotos profesionales ya listas desde la sección
                            <Link href="/comercios/adquirir-paquetes" className="font-bold underline ml-1">Paquetes</Link>.
                            O cargá tus productos manualmente acá abajo.
                        </p>
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 py-2 px-2">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{hasCatalog ? "O cargá manualmente" : "Cargá tu producto"}</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Manual Form */}
            <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: Images */}
                <div className="lg:col-span-1 space-y-4">
                    <div className={`bg-white p-6 rounded-2xl border ${fieldErrors.image ? "border-red-300 ring-2 ring-red-200" : "border-gray-100"} shadow-sm space-y-4`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen principal</span>
                            {fieldErrors.image && <span className="text-xs font-semibold text-red-500">{fieldErrors.image}</span>}
                        </div>

                        <ImageUpload
                            value={imageUrls[0] || ""}
                            onChange={(url) => {
                                if (url) {
                                    setImageUrls(prev => {
                                        const next = [...prev];
                                        next[0] = url;
                                        return next;
                                    });
                                } else {
                                    setImageUrls(prev => prev.filter((_, i) => i !== 0));
                                }
                                setFieldErrors(prev => { const { image, ...rest } = prev; return rest; });
                            }}
                            disabled={isLoading}
                        />
                        <p className="text-[11px] text-gray-400 font-medium text-center">
                            Foto nítida y bien iluminada. Fondo blanco o neutro recomendado.
                        </p>
                    </div>

                    {/* Additional images */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Imágenes adicionales (opcional)</span>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((idx) => (
                                <div key={idx}>
                                    {imageUrls[idx] ? (
                                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                            <img src={imageUrls[idx]} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">
                                                &times;
                                            </button>
                                        </div>
                                    ) : (
                                        <ImageUpload
                                            value=""
                                            onChange={(url) => {
                                                if (url) {
                                                    setImageUrls(prev => {
                                                        const next = [...prev];
                                                        // Fill next available slot
                                                        while (next.length <= idx) next.push("");
                                                        next[idx] = url;
                                                        return next.filter(Boolean);
                                                    });
                                                }
                                            }}
                                            disabled={isLoading}
                                            compact
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Form fields */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                            Nombre del Producto <span className="text-red-400">*</span>
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="Ej. Alfajor de Maicena con Dulce de Leche"
                            className={fieldClass("name")}
                            disabled={isLoading}
                            value={formValues.name}
                            onChange={(e) => { setFormValues({ ...formValues, name: e.target.value }); setFieldErrors(prev => { const { name, ...rest } = prev; return rest; }); }}
                        />
                        {fieldErrors.name && <p className="text-xs text-red-500 font-semibold mt-1 ml-1">{fieldErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Category */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Categoría</label>
                            <div className="relative">
                                <select
                                    name="categoryId"
                                    className={fieldClass("categoryId")}
                                    style={{ appearance: "none" }}
                                    disabled={isLoading}
                                    value={formValues.categoryId}
                                    onChange={(e) => setFormValues({ ...formValues, categoryId: e.target.value })}
                                >
                                    <option value="">Sin categoría</option>
                                    {manualCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cleanName(cat.name)}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"><Layers className="w-4 h-4" /></div>
                            </div>
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                Precio de Venta <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    placeholder="0"
                                    className={`${fieldClass("price")} pl-9`}
                                    disabled={isLoading}
                                    value={formValues.price}
                                    onChange={(e) => { setFormValues({ ...formValues, price: e.target.value }); setFieldErrors(prev => { const { price, ...rest } = prev; return rest; }); }}
                                />
                            </div>
                            {fieldErrors.price && <p className="text-xs text-red-500 font-semibold mt-1 ml-1">{fieldErrors.price}</p>}
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                Stock disponible
                            </label>
                            <input
                                name="stock"
                                type="number"
                                min="0"
                                step="1"
                                placeholder="10"
                                className={fieldClass("stock")}
                                disabled={isLoading}
                                value={formValues.stock}
                                onChange={(e) => { setFormValues({ ...formValues, stock: e.target.value }); setFieldErrors(prev => { const { stock, ...rest } = prev; return rest; }); }}
                            />
                            {fieldErrors.stock && <p className="text-xs text-red-500 font-semibold mt-1 ml-1">{fieldErrors.stock}</p>}
                            <p className="text-[10px] text-gray-400 mt-1 ml-1">Unidades disponibles. Se descuenta con cada venta.</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                            Descripción del Producto
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Describí los detalles de tu producto para tus clientes..."
                            className={`${fieldClass("description")} resize-none font-medium`}
                            disabled={isLoading}
                            value={formValues.description}
                            onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                        />
                    </div>

                    {/* Tamaño del producto — rama feat/peso-volumen-productos */}
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Tamaño del producto</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    Elegí el tamaño del producto. Eso define qué vehículo usamos para entregarlo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSuggestWeight}
                                disabled={isLoading || isSuggesting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-100 transition disabled:opacity-50 whitespace-nowrap"
                            >
                                {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Sugerir
                            </button>
                        </div>

                        <SizeSelector
                            value={productSize}
                            onChange={handleSelectSize}
                            disabled={isLoading}
                        />

                        {suggestionInfo && (
                            <p className="text-xs text-blue-600 font-semibold mt-3 ml-1 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                {suggestionInfo}
                            </p>
                        )}

                        {/* Modo avanzado: tipear gramos exactos (farmacia/seller con productos heterogéneos) */}
                        <div className="mt-5 pt-4 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => setAdvancedMode((v) => !v)}
                                className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 font-semibold transition"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                {advancedMode ? "Ocultar modo avanzado" : "Modo avanzado: tipear gramos exactos"}
                            </button>
                            {advancedMode && (
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Peso por unidad (gramos)</label>
                                        <input
                                            name="weightGrams"
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="Ej. 1500"
                                            className={fieldClass("weightGrams")}
                                            disabled={isLoading}
                                            value={formValues.weightGrams}
                                            onChange={(e) => setFormValues({ ...formValues, weightGrams: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Volumen por unidad (ml)</label>
                                        <input
                                            name="volumeMl"
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="Ej. 1500"
                                            className={fieldClass("volumeMl")}
                                            disabled={isLoading}
                                            value={formValues.volumeMl}
                                            onChange={(e) => setFormValues({ ...formValues, volumeMl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Hidden inputs: si NO está en modo avanzado, los campos numéricos no son visibles
                            pero los gramos/volumen ya están en formValues vía handleSelectSize. */}
                        {!advancedMode && (
                            <>
                                <input type="hidden" name="weightGrams" value={formValues.weightGrams} />
                                <input type="hidden" name="volumeMl" value={formValues.volumeMl} />
                            </>
                        )}
                        <input type="hidden" name="packageCategoryId" value={formValues.packageCategoryId} />
                        <input type="hidden" name="productSize" value={productSize ?? ""} />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary flex items-center justify-center gap-3 px-10 py-4 rounded-xl shadow-lg active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        <span className="font-bold">Publicar Producto</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
