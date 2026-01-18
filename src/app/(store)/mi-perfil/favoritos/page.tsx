"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Construction } from "lucide-react";

export default function FavoritosPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <Link href="/mi-perfil" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="font-bold text-lg text-gray-900">Favoritos</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-12 text-center">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Construction className="w-10 h-10 text-pink-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Próximamente</h2>
                <p className="text-gray-500 mb-8">
                    Pronto podrás guardar tus productos y comercios favoritos para acceder rápidamente.
                </p>
                <Link href="/mi-perfil" className="text-[#e60012] font-semibold hover:underline">
                    ← Volver al Perfil
                </Link>
            </div>
        </div>
    );
}
