"use client";

// Login Page - Página de Inicio de Sesión
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Check, ArrowLeft } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get("registered") === "true";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Email o contraseña incorrectos");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Error al iniciar sesión. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-start bg-gray-50 px-4 py-6">
            <div className="w-full max-w-sm sm:max-w-md">
                {/* Logo */}
                <div className="text-center mb-6 sm:mb-8">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={150}
                            height={48}
                            className="mx-auto"
                            priority
                        />
                    </Link>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#e60012] flex items-center justify-center">
                            <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-4 sm:mb-6">
                        Iniciar Sesión
                    </h3>

                    {justRegistered && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            <span>¡Cuenta creada! Ya podés iniciar sesión.</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                            {error}
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
                                    className="input input-with-icon"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Contraseña
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
                                    className="input input-with-icon input-with-icon-right"
                                    required
                                    autoComplete="off"
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

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base sm:text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Ingresar
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        ¿No tenés cuenta?{" "}
                        <Link href="/registro" className="text-[#e60012] font-semibold hover:underline">
                            Registrate aquí
                        </Link>
                    </div>

                    {/* Back to Home */}
                    <Link
                        href="/"
                        className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#e60012] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a la tienda
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-[#e60012] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

