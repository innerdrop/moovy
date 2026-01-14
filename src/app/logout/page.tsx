
"use client";

import { signOut } from "next-auth/react";
import { LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LogoutPage() {
    const [loading, setLoading] = useState(false);

    const handleSignOut = async () => {
        setLoading(true);
        await signOut({ callbackUrl: "/" });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#e60012] font-script">MOOVY</h1>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LogOut className="w-8 h-8 text-[#e60012]" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        ¿Cerrar sesión?
                    </h2>
                    <p className="text-gray-500 mb-8">
                        ¡Te esperamos pronto de vuelta!
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="w-full py-3 bg-[#e60012] text-white font-semibold rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Cerrando...</span>
                            ) : (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    Sí, cerrar sesión
                                </>
                            )}
                        </button>

                        <Link
                            href="/"
                            className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
