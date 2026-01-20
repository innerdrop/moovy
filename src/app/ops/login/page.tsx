
"use client";

import { signIn } from "next-auth/react";
import { Shield, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OpsLoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const searchParams = useSearchParams();

    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam === "Unauthorized") {
            setError("No tienes permisos de administrador para acceder a este panel.");
        } else if (errorParam === "CredentialsSignin") {
            setError("Credenciales inválidas. Verifica tu email y contraseña.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Use redirect: false to handle the response manually
            const result = await signIn("credentials", {
                email: email.toLowerCase().trim(),
                password,
                redirect: false,
            });

            console.log("[OPS Login] SignIn result:", result);

            if (result?.error) {
                console.log("[OPS Login] Error:", result.error);
                setError("Credenciales inválidas. Verifica tu email y contraseña.");
                setLoading(false);
                return;
            }

            if (result?.ok) {
                console.log("[OPS Login] Success, redirecting...");
                // Use window.location for a full page reload to ensure cookies are sent
                // Small delay to ensure cookie is properly set
                setTimeout(() => {
                    window.location.href = window.location.origin + "/ops";
                }, 100);
                return;
            }

            // Unexpected result
            console.log("[OPS Login] Unexpected result:", result);
            setError("Error inesperado. Intenta de nuevo.");
            setLoading(false);
        } catch (err) {
            console.error("[OPS Login] Exception:", err);
            setError("Error de conexión. Intenta de nuevo.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Moovy <span className="text-blue-400">Ops</span></h1>
                    <p className="text-slate-400 mt-1">Panel de Operaciones</p>
                </div>

                {/* Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
                    <h2 className="text-xl font-bold text-white mb-6 text-center">
                        Acceso Administrativo
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                placeholder="admin@somosmoovy.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                "Acceder"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500 mt-6">
                    Acceso restringido a personal autorizado
                </p>
            </div>
        </div>
    );
}

export default function OpsLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>}>
            <OpsLoginContent />
        </Suspense>
    );
}
