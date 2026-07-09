import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

// UI compartida de las sub-páginas de Mi Comercio (header con volver + error).
// Rama: feat/bloquear-publicidad

export function SubHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="flex items-center gap-3">
            <Link
                href="/comercios/mi-comercio"
                className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition shadow-sm flex-shrink-0"
                aria-label="Volver a Mi Comercio"
            >
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
            </div>
        </div>
    );
}

export function MerchantMissing() {
    return (
        <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Error de Cuenta</h2>
            <p className="text-gray-500">No tienes un comercio asociado a tu cuenta.</p>
        </div>
    );
}
