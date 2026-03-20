import { Home, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center space-y-6">
                {/* Logo MOOVY */}
                <div className="flex justify-center">
                    <Image
                        src="/logo-moovy.svg"
                        alt="MOOVY"
                        width={120}
                        height={38}
                        priority
                    />
                </div>

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

                {/* Action */}
                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e60012] hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
