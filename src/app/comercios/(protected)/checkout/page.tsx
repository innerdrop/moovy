"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    CreditCard,
    ShieldCheck,
    ShoppingBag,
    Loader2,
    CheckCircle2,
    ArrowLeft,
    Layers,
    Info
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    price: number;
    description: string | null;
    images: { url: string }[];
}

interface Category {
    id: string;
    name: string;
    price: number;
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const categoryId = searchParams.get("categoryId");
    const productIdsStr = searchParams.get("productIds");
    const mode = searchParams.get("mode") as "package" | "items";

    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (mode === "package" && categoryId) {
                    const res = await fetch("/api/admin/categories");
                    const data = await res.json();
                    const found = data.find((c: any) => c.id === categoryId);
                    if (found) {
                        setCategory(found);
                        setTotal(found.price || 0);

                        // Fetch products in this category for the summary
                        const pRes = await fetch("/api/admin/products");
                        const pData = await pRes.json();
                        const catProds = pData.filter((p: any) =>
                            p.merchant === null &&
                            p.isActive === true &&
                            p.categories.some((c: any) => c.category.id === categoryId)
                        );
                        setProducts(catProds);
                    }
                } else if (mode === "items" && productIdsStr) {
                    const ids = productIdsStr.split(",");
                    const pRes = await fetch("/api/admin/products");
                    const pData = await pRes.json();
                    const selectedProds = pData.filter((p: any) => ids.includes(p.id) && p.isActive === true);
                    setProducts(selectedProds);
                    // For individual items, let's assume a sample cost or just simple sum for now
                    // User didn't specify per-product purchase price yet, using 0 or 100 as placeholder
                    setTotal(selectedProds.length * 100);
                }
            } catch (error) {
                console.error("Error fetching checkout data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId, productIdsStr, mode]);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Emulated delay for payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Activate products (Clone to merchant panel)
            const ids = products.map(p => p.id);
            const res = await fetch("/api/merchant/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productIds: ids })
            });

            if (res.ok) {
                setIsSuccess(true);
            } else {
                alert("Error al activar los productos. Por favor contactá a soporte.");
            }
        } catch (error) {
            console.error("Payment error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Preparando tu orden...</p>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100 border-4 border-white">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">¡Pago Exitoso!</h1>
                <p className="text-slate-600 text-lg mb-10 font-medium">
                    Hemos procesado tu pago correctamente. El paquete <b>{category?.name || "seleccionado"}</b> ya está activo en tu catálogo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/comercios/productos"
                        className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-200"
                    >
                        Gestionar mis Productos
                    </Link>
                    <Link
                        href="/comercios/adquirir-paquetes"
                        className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-50 transition"
                    >
                        Ver mas paquetes
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <Link href="/comercios/adquirir-paquetes" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[10px] mb-8 transition">
                <ArrowLeft className="w-4 h-4" />
                Volver al buscador
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Side: Summary & Items */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Resumen de Compra</h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Estás por adquirir información oficial</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {mode === "package" ? (
                                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 group">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <Layers className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{category?.name}</h3>
                                        <p className="text-slate-500 text-sm font-medium italic">Acceso ilimitado a {products.length} productos oficiales</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-2xl font-black text-blue-600 tabular-nums">${total.toLocaleString()}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {products.map(p => (
                                        <div key={p.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl relative overflow-hidden shrink-0">
                                                {p.images[0] && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 text-sm uppercase">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Item Seleccionado</p>
                                            </div>
                                            <p className="font-bold text-slate-900">$100</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-start gap-4">
                                <Info className="w-6 h-6 text-blue-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900 uppercase tracking-tight mb-1">Activación Inmediata</p>
                                    <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                                        Una vez confirmado el pago, sincronizaremos automáticamente toda la base de datos Moovy (fotos, stocks y nombres) a tu panel.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Form & Checkout */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>

                        <div className="relative space-y-8">
                            <div>
                                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Total a Pagar</p>
                                <h2 className="text-5xl font-black tabular-nums tracking-tighter">${total.toLocaleString()}</h2>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-white/10">
                                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="text-white">${total.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase tracking-widest">
                                    <span>Impuestos</span>
                                    <span className="text-white">$0</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xl font-black">
                                    <span className="uppercase tracking-tight text-blue-400">Total</span>
                                    <span className="tabular-nums">${total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Procesando Pago...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        Finalizar Pago
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] pt-4">
                                <ShieldCheck className="w-3 h-3 text-blue-500" />
                                <span>Moovy Secure Checkout</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aceptamos todos los medios</p>
                        <div className="flex gap-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="w-10 h-6 bg-slate-200 rounded"></div>
                            <div className="w-10 h-6 bg-slate-200 rounded"></div>
                            <div className="w-10 h-6 bg-slate-200 rounded"></div>
                            <div className="ml-auto font-mono text-[10px] pt-1">SSL 256·BIT</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
