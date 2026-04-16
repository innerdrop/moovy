import { Home, SearchX, ShoppingBag, Star, Receipt } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header minimal */}
            <header className="bg-white border-b border-gray-100 px-4 py-3">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo-moovy.svg"
                        alt="MOOVY"
                        width={100}
                        height={32}
                        priority
                    />
                </Link>
            </header>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center space-y-6">
                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                        <SearchX className="w-8 h-8 text-red-500" />
                    </div>

                    {/* 404 badge */}
                    <div className="inline-block px-4 py-1 bg-gray-100 rounded-full text-sm font-mono text-gray-500">
                        404
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Página no encontrada
                        </h1>
                        <p className="text-gray-500 mt-2">
                            La página que buscás no existe o fue movida.
                        </p>
                    </div>

                    {/* Quick links — ISSUE-035: sugerencias útiles */}
                    <div className="text-left space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            ¿Buscabas alguna de estas?
                        </p>
                        <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-gray-700">
                            <Home className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium">Inicio</span>
                        </Link>
                        <Link href="/marketplace" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-gray-700">
                            <ShoppingBag className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-medium">Marketplace</span>
                        </Link>
                        <Link href="/mis-pedidos" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-gray-700">
                            <Receipt className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Mis pedidos</span>
                        </Link>
                        <Link href="/puntos" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-gray-700">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium">Puntos MOOVER</span>
                        </Link>
                    </div>

                    {/* Primary CTA */}
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e60012] hover:bg-red-700 text-white font-semibold rounded-xl transition-colors w-full"
                    >
                        <Home className="w-4 h-4" />
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}