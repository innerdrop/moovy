"use client";

// Client Registration Page
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Check,
    ArrowLeft,
    Gift,
} from "lucide-react";
import PhoneInput from "@/components/ui/forms/PhoneInput";
import InfoTooltip from "@/components/ui/forms/InfoTooltip";

function RegistrationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form Fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [referralCode, setReferralCode] = useState("");

    useEffect(() => {
        const refParam = searchParams.get("ref");
        if (refParam) {
            setReferralCode(refParam.toUpperCase());
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (!phone || phone.length < 8) {
            setError("Por favor ingresá un número de teléfono válido");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    password,
                    referralCode: referralCode.trim() || undefined
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login?registered=true");
                }, 2000);
            } else {
                setError(data.error || "Error al registrar usuario");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-start bg-gray-50 px-4 py-8 min-h-screen">
            <div className="w-full max-w-lg animate-fadeIn">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block hover:opacity-90 transition">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={160}
                            height={52}
                            className="mx-auto mb-5"
                            priority
                        />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crear Cuenta</h1>
                    <p className="text-gray-600 mt-2 text-lg">Unite a la comunidad de delivery más patagónica</p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center gap-4 animate-scaleIn shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-green-800 text-lg">¡Cuenta creada con éxito!</p>
                            <p className="text-green-700">Te estamos redirigiendo para iniciar sesión...</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-shake">
                        <p className="text-red-700 font-medium text-center">{error}</p>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Name Fields Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nombre
                                    <InfoTooltip text="Tu nombre real como figura en tu DNI." />
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Ej. Juan"
                                        className="input input-with-icon"
                                        required
                                        autoComplete="given-name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Apellido
                                    <InfoTooltip text="Tu apellido familiar." />
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Ej. Pérez"
                                    className="input"
                                    required
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                                <InfoTooltip text="Lo usarás para iniciar sesión y recibir comprobantes." />
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hola@ejemplo.com"
                                    className="input input-with-icon"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Teléfono / Celular
                                <InfoTooltip text="Necesario para que el repartidor te contacte." />
                            </label>
                            <PhoneInput
                                value={phone}
                                onChange={setPhone}
                                error={!!error && error.includes("teléfono")}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Contraseña
                                <InfoTooltip text="Mínimo 6 caracteres." />
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
                                    className="input input-with-icon pr-10"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                    className="input input-with-icon"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 ml-1">
                                * Todos los campos marcados arriba son obligatorios
                            </p>
                        </div>

                        <hr className="border-gray-100 my-4" />

                        {/* Referral Code (Optional) */}
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Gift className="w-4 h-4 text-blue-500" />
                                ¿Tenés un código de referido?
                                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">Opcional</span>
                            </label>
                            <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                placeholder="Ej: MOOV-ABC123"
                                className="input uppercase font-mono tracking-wider text-center border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                                autoComplete="off"
                            />
                            <p className="text-xs text-blue-600 mt-2 text-center font-medium">
                                ¡Sumás puntos extra si te invita un amigo! 🎁
                            </p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg mt-4 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    Crear mi cuenta
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center mt-8 text-gray-600">
                        ¿Ya tenés cuenta?{" "}
                        <Link href="/login" className="text-[#e60012] hover:underline font-bold">
                            Iniciá sesión acá
                        </Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-8 mb-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a la tienda
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function RegistroPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <RegistrationForm />
        </Suspense>
    );
}
