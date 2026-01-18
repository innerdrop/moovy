"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    // Validate token on load
    useEffect(() => {
        if (!token) {
            setIsValidToken(false);
            return;
        }

        const validateToken = async () => {
            try {
                const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
                setIsValidToken(response.ok);
            } catch {
                setIsValidToken(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.error || "Error al restablecer la contraseña");
            }
        } catch (err) {
            setError("Error de conexión. Intentá de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isValidToken === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-[#e60012] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Invalid token
    if (!isValidToken) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace inválido</h1>
                        <p className="text-gray-600 mb-6">
                            El enlace de recuperación es inválido o ya expiró.
                            Por favor, solicitá uno nuevo.
                        </p>
                        <Link
                            href="/recuperar-contrasena"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#e60012] text-white rounded-xl font-semibold hover:bg-[#cc000f] transition-colors"
                        >
                            Solicitar nuevo enlace
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h1>
                        <p className="text-gray-600 mb-6">
                            Tu contraseña fue restablecida exitosamente.
                            Ya podés iniciar sesión con tu nueva contraseña.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#e60012] text-white rounded-xl font-semibold hover:bg-[#cc000f] transition-colors"
                        >
                            Iniciar sesión
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
                            Nueva contraseña
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Ingresá tu nueva contraseña.
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
                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nueva contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
                                    required
                                    minLength={6}
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
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Guardar contraseña
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

export default function RestablecerContrasenaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-[#e60012] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
