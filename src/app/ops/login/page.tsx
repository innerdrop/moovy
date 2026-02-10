"use client";

import { Shield, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loginAction } from "./actions";

function OpsLoginContent() {
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam === "Unauthorized") {
            setError("No tienes permisos de administrador para acceder a este panel.");
        } else if (errorParam === "CredentialsSignin") {
            setError("Credenciales inválidas. Verifica tu email y contraseña.");
        }
    }, [searchParams]);

    const handleSubmit = (formData: FormData) => {
        setError("");
        startTransition(async () => {
            const result = await loginAction(formData);
            if (result && !result.success) {
                setError(result.error || "Error de autenticación");
            } else {
                // Success: Client-side redirect to preserve host/IP (fixes mobile access issue)
                router.push("/ops");
                router.refresh();
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
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

                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                placeholder="admin@somosmoovy.com"
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                                disabled={isPending}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending ? (
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
