"use client";

import { useState, useRef } from "react";
import { updateProduct, deleteProduct } from "@/app/comercios/actions";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import SizeSelector from "@/components/comercios/SizeSelector";
import PriceRecargoField from "@/components/comercios/PriceRecargoField";
import { getSizeFromWeight, type MerchantSizeOption } from "@/lib/product-weight";
import { Loader2, Save, ArrowLeft, Trash2, AlertTriangle, Settings, X } from "lucide-react";
import Link from 'next/link';

interface EditProductFormProps {
    product: {
        id: string;
        name: string;
        description: string;
        price: number;
        stock: number;
        imageUrls: string[];
        categoryId: string;
        isActive: boolean;
        // Rama feat/peso-volumen-productos
        weightGrams: number | null;
        volumeMl: number | null;
        packageCategoryId: string | null;
        // feat/recargo-moovy-y-tamano-toggle: metadata del recargo (null si se cargó
        // con precio final directo o es un producto legacy).
        basePrice: number | null;
        markupPercent: number | null;
    };
    categories: { id: string; name: string }[];
    /** Opciones de tamaño derivadas de OPS (PackageCategory). Ver src/lib/product-sizes.ts */
    sizeOptions: MerchantSizeOption[];
    /** Rate de comisión efectivo (%) para el desglose del recargo. 0 en primer mes. */
    commissionRate: number;
    /** El rate 0 es por el mes gratis (no un override). Muestra el renglón "desde el mes 2". */
    firstMonthFree?: boolean;
    /** Rate que aplicará cuando termine el mes gratis. */
    futureCommissionRate?: number;
}

export default function EditProductForm({ product, categories, sizeOptions, commissionRate, firstMonthFree, futureCommissionRate }: EditProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>(product.imageUrls);
    const [error, setError] = useState("");

    // Rama feat/peso-volumen-productos: estado para campos editables + sugerencia
    const [weightGrams, setWeightGrams] = useState<string>(
        product.weightGrams != null ? String(product.weightGrams) : ""
    );
    const [volumeMl, setVolumeMl] = useState<string>(
        product.volumeMl != null ? String(product.volumeMl) : ""
    );
    const [packageCategoryId, setPackageCategoryId] = useState<string>(product.packageCategoryId || "");
    const [name, setName] = useState<string>(product.name);
    const [description, setDescription] = useState<string>(product.description);
    // Fix s4-4a-07: price/stock/category pasan a estado controlado para que
    // isDirty los detecte y el banner "Guardar" aparezca al editarlos (antes
    // eran defaultValue no trackeados -> el comercio no veia como guardar).
    // feat/recargo-moovy-y-tamano-toggle: el precio lo maneja PriceRecargoField.
    // `price` guarda el precio FINAL (para el dirty-state) y lo actualiza el callback.
    // `priceMeta` guarda el modo + base + recargo (también para el dirty-state).
    const initialPriceMode: "direct" | "markup" =
        product.basePrice != null && product.basePrice > 0 ? "markup" : "direct";
    const initialBasePriceStr = product.basePrice != null && product.basePrice > 0 ? String(product.basePrice) : "";
    const initialMarkupStr = product.markupPercent != null ? String(product.markupPercent) : "";
    const [price, setPrice] = useState<string>(String(product.price));
    const [priceMeta, setPriceMeta] = useState<{ mode: "direct" | "markup"; basePrice: string; markupPercent: string }>({
        mode: initialPriceMode,
        basePrice: initialBasePriceStr,
        markupPercent: initialMarkupStr,
    });
    const [priceResetKey, setPriceResetKey] = useState(0);
    const [stock, setStock] = useState<string>(String(product.stock));
    const [categoryId, setCategoryId] = useState<string>(product.categoryId);
    // Tamaño: si el producto ya tenía weightGrams cargado, derivar la categoría
    // inicial (string = name de la PackageCategory).
    const [productSize, setProductSize] = useState<string | null>(
        product.weightGrams != null ? getSizeFromWeight(product.weightGrams) : null
    );
    const [advancedMode, setAdvancedMode] = useState(false);

    // feat/comercio-ux-guardar-y-totales (2026-05-13): snapshot del estado
    // inicial del producto al montar. Lo usamos para calcular si el form
    // esta dirty (hay cambios sin guardar) y mostrar el banner flotante
    // solo cuando hace falta. La idea es no contaminar la UI con un boton
    // "Guardar" siempre visible cuando no hay nada que guardar — patron
    // estandar UX (Notion, Linear, GitHub editar issue).
    const initialState = useRef({
        name: product.name,
        description: product.description,
        price: String(product.price),
        priceMode: initialPriceMode,
        basePrice: initialBasePriceStr,
        markupPercent: initialMarkupStr,
        stock: String(product.stock),
        categoryId: product.categoryId,
        weightGrams: product.weightGrams != null ? String(product.weightGrams) : "",
        volumeMl: product.volumeMl != null ? String(product.volumeMl) : "",
        packageCategoryId: product.packageCategoryId || "",
        imageUrls: JSON.stringify(product.imageUrls),
    });

    const isDirty =
        name !== initialState.current.name ||
        description !== initialState.current.description ||
        price !== initialState.current.price ||
        priceMeta.mode !== initialState.current.priceMode ||
        priceMeta.basePrice !== initialState.current.basePrice ||
        priceMeta.markupPercent !== initialState.current.markupPercent ||
        stock !== initialState.current.stock ||
        categoryId !== initialState.current.categoryId ||
        weightGrams !== initialState.current.weightGrams ||
        volumeMl !== initialState.current.volumeMl ||
        packageCategoryId !== initialState.current.packageCategoryId ||
        JSON.stringify(imageUrls) !== initialState.current.imageUrls;

    // Descartar cambios — vuelve todo a los valores iniciales sin guardar.
    const handleDiscard = () => {
        setName(initialState.current.name);
        setDescription(initialState.current.description);
        setPrice(initialState.current.price);
        setPriceMeta({
            mode: initialState.current.priceMode,
            basePrice: initialState.current.basePrice,
            markupPercent: initialState.current.markupPercent,
        });
        setPriceResetKey((k) => k + 1); // remonta PriceRecargoField con los valores iniciales
        setStock(initialState.current.stock);
        setCategoryId(initialState.current.categoryId);
        setWeightGrams(initialState.current.weightGrams);
        setVolumeMl(initialState.current.volumeMl);
        setPackageCategoryId(initialState.current.packageCategoryId);
        setImageUrls(JSON.parse(initialState.current.imageUrls));
        // productSize derivado se recalcula automaticamente desde weightGrams
        // en el siguiente render, no hace falta resetearlo manual.
        setError("");
    };

    /**
     * Click en una card de SizeSelector. Autocompleta los gramos/volumen
     * internos con los valores DERIVADOS de OPS para esa categoría. Si option
     * es null (reaprieta la card ya elegida) deselecciona y limpia peso/volumen.
     */
    const handleSelectSize = (option: MerchantSizeOption | null) => {
        if (!option) {
            setProductSize(null);
            setWeightGrams("");
            setVolumeMl("");
            return;
        }
        setProductSize(option.size);
        setWeightGrams(String(option.assumedWeightGrams));
        setVolumeMl(String(option.assumedVolumeMl));
    };

    // fix/comercio-ux: el banner de error vive arriba del form — si el usuario
    // esta abajo (mobile) no lo ve. Scroll al banner cada vez que seteamos error.
    const showError = (msg: string) => {
        setError(msg);
        requestAnimationFrame(() => {
            document.getElementById("banner-error-editar-producto")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    };

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError("");

        // feat: al EDITAR se puede guardar el AVANCE aunque falten campos (foto o
        // descripción) — típico de un borrador importado. La completitud (foto +
        // descripción ≥10 + precio) se exige recién al MOSTRARLO en la tienda (el
        // server relaja el guardado y auto-oculta si quedó incompleto). Por eso acá
        // ya NO bloqueamos el guardado.

        // Send all image URLs as JSON array
        formData.append("imageUrls", JSON.stringify(imageUrls));

        const result = await updateProduct(product.id, formData);

        if (result?.error) {
            showError(result.error);
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteProduct(product.id);

        if (result?.error) {
            setError(result.error);
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
        // Redirect happens on success
    };

    return (
        <>
            <form action={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-24">
                {/* Header / Actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/comercios/productos"
                            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Editar producto</h1>
                            <p className="text-sm text-gray-500 font-medium">Actualizá los datos, fotos y tamaño</p>
                        </div>
                    </div>
                    {/* feat/comercio-ux-guardar-y-totales (2026-05-13): boton
                        "Guardar Cambios" se movio al banner flotante abajo
                        que aparece solo cuando isDirty. Solo dejamos el tacho
                        en el header — accion irreversible que no depende de
                        cambios pendientes. */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            disabled={isLoading || isDeleting}
                            aria-label="Eliminar producto"
                            title="Eliminar producto"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div id="banner-error-editar-producto" className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column: Images */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Imágenes del producto
                            </label>
                            <MultiImageUpload
                                values={imageUrls}
                                onChange={setImageUrls}
                                maxImages={4}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Producto
                            </label>
                            <input
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. Hamburguesa Doble con Queso"
                                className="input"
                                disabled={isLoading}
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
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="" disabled>Seleccionar categoría...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Precio — feat/recargo-moovy-y-tamano-toggle: precio final
                            directo o calculadora de recargo sobre el precio del local. */}
                        <PriceRecargoField
                            key={priceResetKey}
                            commissionRate={commissionRate}
                            firstMonthFree={firstMonthFree}
                            futureCommissionRate={futureCommissionRate}
                            initialPrice={product.price}
                            initialBasePrice={product.basePrice}
                            initialMarkupPercent={product.markupPercent}
                            disabled={isLoading}
                            onFinalPriceChange={(fp) => setPrice(fp > 0 ? String(fp) : "")}
                            onStateChange={(s) => setPriceMeta({ mode: s.mode, basePrice: s.basePrice, markupPercent: s.markupPercent })}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock
                            </label>
                            <input
                                name="stock"
                                type="number"
                                min="0"
                                required
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="Ej. 100"
                                className="input"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            {/* fix/comercio-ux: decia "(Opcional)" pero el server la
                                exige (min 10 chars). Asterisco + helper + contador. */}
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe los ingredientes o detalles..."
                                className="input"
                                disabled={isLoading}
                            />
                            <div className="flex items-start justify-between gap-3 mt-1">
                                <p className="text-[11px] text-gray-400">Mín. 10 caracteres para mostrarlo en la tienda. Podés guardar el avance sin ella.</p>
                                <p className={`text-[11px] font-bold whitespace-nowrap ${description.trim().length >= 10 ? "text-green-600" : "text-gray-400"}`}>
                                    {description.trim().length >= 10 ? "✓ " : ""}{description.trim().length}/10
                                </p>
                            </div>
                        </div>

                        {/* Tamaño del producto — feat/tamanos-producto-desde-ops (opciones de OPS) */}
                        <div className="border-t border-gray-100 pt-5">
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-gray-900">Tamaño del producto</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Elegí el tamaño. Define qué vehículo usamos para entregarlo.
                                </p>
                            </div>

                            <SizeSelector
                                options={sizeOptions}
                                value={productSize}
                                onChange={handleSelectSize}
                                disabled={isLoading}
                            />

                            {/* Modo avanzado */}
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Peso por unidad (g)</label>
                                            <input
                                                name="weightGrams"
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="Ej. 1500"
                                                className="input"
                                                disabled={isLoading}
                                                onWheel={(e) => e.currentTarget.blur()}
                                                value={weightGrams}
                                                onChange={(e) => setWeightGrams(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Volumen por unidad (ml)</label>
                                            <input
                                                name="volumeMl"
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="Ej. 1500"
                                                className="input"
                                                disabled={isLoading}
                                                onWheel={(e) => e.currentTarget.blur()}
                                                value={volumeMl}
                                                onChange={(e) => setVolumeMl(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Hidden inputs para enviar al server cuando NO está modo avanzado */}
                            {!advancedMode && (
                                <>
                                    <input type="hidden" name="weightGrams" value={weightGrams} />
                                    <input type="hidden" name="volumeMl" value={volumeMl} />
                                </>
                            )}
                            <input type="hidden" name="packageCategoryId" value={packageCategoryId} />
                            <input type="hidden" name="productSize" value={productSize ?? ""} />
                        </div>
                    </div>
                </div>

                {/* feat/comercio-ux-guardar-y-totales (2026-05-13): banner
                    flotante sticky abajo. Aparece solo cuando isDirty (algun
                    campo modificado vs estado inicial). Se posiciona arriba
                    del BottomNav del layout del comercio. pb-safe para iOS
                    bottom inset. z-30 lo deja arriba del contenido pero abajo
                    de modales (que son z-50+). */}
                {isDirty && (
                    <div className="fixed left-0 right-0 bottom-16 z-30 px-3 sm:px-4 pb-2 pointer-events-none animate-in slide-in-from-bottom-2 duration-200">
                        <div className="max-w-2xl mx-auto pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 flex-1 min-w-0 truncate">
                                Tenés cambios sin guardar
                            </p>
                            <button
                                type="button"
                                onClick={handleDiscard}
                                disabled={isLoading}
                                className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                                title="Descartar cambios"
                            >
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">Descartar</span>
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#e60012] text-white hover:bg-[#cc000f] transition disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>Guardar</span>
                            </button>
                        </div>
                    </div>
                )}
            </form>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Eliminar Producto</h3>
                                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que querés eliminar <strong>{product.name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

