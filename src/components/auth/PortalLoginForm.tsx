"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Check, ArrowLeft, Store, Truck, Shield } from "lucide-react";

type PortalType = 'client' | 'comercio' | 'conductor' | 'ops';

const portalConfig = {
    client: {
        title: 'Iniciar Sesión',
        subtitle: 'Accede a tu cuenta de cliente',
        logo: '/logo-moovy.png',
        color: '#e60012',
        bgGradient: 'from-red-500 to-red-600',
        icon: LogIn,
        redirectAfterLogin: '/tienda',
        registerLink: '/registro',
        backLink: { href: '/', label: 'Volver a la tienda' },
    },
    comercio: {
        title: 'Portal Comercios',
        subtitle: 'Gestiona tu tienda en Moovy',
        logo: '/logo-moovy.png',
        color: '#2563eb',
        bgGradient: 'from-blue-500 to-blue-600',
        icon: Store,
        redirectAfterLogin: '/comercios',
        registerLink: '/registro',
        backLink: { href: 'https://somosmoovy.com', label: 'Ir a Moovy' },
    },
    conductor: {
        title: 'Portal Conductores',
        subtitle: 'Gestiona tus entregas',
        logo: '/logo-moovy.png',
        color: '#16a34a',
        bgGradient: 'from-green-500 to-green-600',
        icon: Truck,
        redirectAfterLogin: '/conductores',
        registerLink: null,
        backLink: { href: 'https://somosmoovy.com', label: 'Ir a Moovy' },
    },
    ops: {
        title: 'Centro de Comando',
        subtitle: 'Administración de Moovy',
        logo: '/logo-moovy.png',
        color: '#7c3aed',
        bgGradient: 'from-purple-500 to-purple-600',
        icon: Shield,
        redirectAfterLogin: '/ops',
        registerLink: null,
        backLink: null,
    },
};

function LoginFormContent({ portal }: { portal: PortalType }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get("registered") === "true";
    const callbackUrl = searchParams.get("callbackUrl");
    const config = portalConfig[portal];
    const IconComponent = config.icon;

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
                router.push(callbackUrl || config.redirectAfterLogin);
                router.refresh();
            }
        } catch (err) {
            setError("Error al iniciar sesión. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center pt-8 lg:pt-12 bg-gray-50 px-4 pb-8">
            <div className="w-full max-w-sm sm:max-w-md">

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                        <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r ${config.bgGradient} flex items-center justify-center`}
                        >
                            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-1">
                        {config.title}
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        {config.subtitle}
                    </p>

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
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0"
                                    style={{ '--tw-ring-color': config.color } as any}
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
                                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                    style={{ '--tw-ring-color': config.color } as any}
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

                        {/* Forgot Password */}
                        <div className="text-right">
                            <Link
                                href="/recuperar-contrasena"
                                className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 flex items-center justify-center gap-2 text-base sm:text-lg text-white rounded-xl font-semibold transition-all bg-gradient-to-r ${config.bgGradient} hover:opacity-90 disabled:opacity-50`}
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
                    {config.registerLink && (
                        <div className="mt-6 text-center text-sm text-gray-600">
                            ¿No tenés cuenta?{" "}
                            <Link
                                href={config.registerLink}
                                className="font-semibold hover:underline"
                                style={{ color: config.color }}
                            >
                                Registrate aquí
                            </Link>
                        </div>
                    )}

                    {/* Back Link */}
                    {config.backLink && (
                        <Link
                            href={config.backLink.href}
                            className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {config.backLink.label}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PortalLoginForm({ portal }: { portal: PortalType }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginFormContent portal={portal} />
        </Suspense>
    );
}
