"use client";

// Legacy checkout — redirects to new package flow
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCheckoutPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/comercios/adquirir-paquetes"); }, [router]);
    return <div className="flex items-center justify-center py-20"><p className="text-slate-400 text-sm">Redirigiendo...</p></div>;
}
