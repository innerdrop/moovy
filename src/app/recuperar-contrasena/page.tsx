"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send, AlertCircle } from "lucide-react";

export default function RecuperarContrasenaPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitted(true);
            } else {
                setError(data.error || "Error al enviar el correo. Intentá de nuevo.");
            }
        } catch (err) {
            setError("Error de conexión. Intentá de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Correo enviado!</h1>
                        <p className="text-gray-600 mb-6">
                            Si el email <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Revisá tu bandeja de entrada y la carpeta de spam.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#e60012] text-white rounded-xl font-semibold hover:bg-[#cc000f] transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" /> Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center pt-8 lg:pt-12 bg-gray-50 px-4 pb-8">
            <div className="w-full max-w-sm sm:max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Link href="/">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={160}
                            height={60}
                            priority
                            className="h-14 w-auto"
                        />
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            Recuperar contraseña
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 flex items-center justify-center gap-2 text-base sm:text-lg text-white rounded-xl font-semibold transition-all bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Enviar enlace
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <Link
                        href="/login"
                        className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al login
                    </Link>
                </div>
            </div>
        </div>
    );
}
