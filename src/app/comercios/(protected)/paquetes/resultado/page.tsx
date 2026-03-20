"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Loader2, Package, ArrowRight } from "lucide-react";

function ResultContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status") || "pending";
    const isFree = searchParams.get("free") === "true";
    const count = searchParams.get("count") || "0";
    const ref = searchParams.get("ref");
    const [purchaseStatus, setPurchaseStatus] = useState<string>(status);
    const [importedCount, setImportedCount] = useState(parseInt(count));

    // Poll for status if payment is pending (MP redirect back)
    useEffect(() => {
        if (status === "success" && ref && !isFree) {
            // Check if import has completed
            const checkStatus = async () => {
                try {
                    const res = await fetch("/api/merchant/packages/history");
                    const data = await res.json();
                    const purchase = data.purchases?.find((p: any) => p.mpExternalRef === ref);
                    if (purchase) {
                        setPurchaseStatus(purchase.paymentStatus === "approved" ? "success" : purchase.paymentStatus);
                        setImportedCount(purchase.importedCount || 0);
                    }
                } catch {}
            };
            checkStatus();
            const interval = setInterval(checkStatus, 3000);
            return () => clearInterval(interval);
        }
    }, [status, ref, isFree]);

    if (purchaseStatus === "success") {
        return (
            <div className="max-w-lg mx-auto py-16 px-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-3">Compra exitosa</h1>
                <p className="text-slate-500 mb-8">
                    {importedCount > 0
                        ? `Se importaron ${importedCount} productos a tu tienda automaticamente.`
                        : "Tu pago fue procesado. Los productos se estan importando a tu tienda."
                    }
                </p>
                <div className="flex flex-col gap-3">
                    <Link
                        href="/comercios/productos/desde-paquetes"
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                        <Package className="w-5 h-5" />
                        Ver mis productos importados
                    </Link>
                    <Link
                        href="/comercios/adquirir-paquetes"
                        className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition"
                    >
                        Explorar mas paquetes
                    </Link>
                </div>
            </div>
        );
    }

    if (purchaseStatus === "failure" || purchaseStatus === "rejected") {
        return (
            <div className="max-w-lg mx-auto py-16 px-4 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-3">Pago no procesado</h1>
                <p className="text-slate-500 mb-8">
                    Hubo un problema con tu pago. No se realizo ningun cargo. Podes intentar de nuevo.
                </p>
                <Link
                    href="/comercios/adquirir-paquetes"
                    className="px-8 py-4 bg-[#e60012] text-white rounded-2xl font-bold hover:bg-red-700 transition inline-flex items-center gap-2"
                >
                    Volver al catalogo <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    // Pending
    return (
        <div className="max-w-lg mx-auto py-16 px-4 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">Pago pendiente</h1>
            <p className="text-slate-500 mb-8">
                Tu pago esta siendo procesado. Cuando se confirme, los productos se importaran automaticamente a tu tienda.
            </p>
            <Link
                href="/comercios/productos"
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition inline-block"
            >
                Ir a mi tienda
            </Link>
        </div>
    );
}

export default function PurchaseResultPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
            <ResultContent />
        </Suspense>
    );
}
