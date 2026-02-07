"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, Check, AlertCircle, Shield, KeyRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CambiarPasswordPage() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Password strength calculation
    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(newPassword);
    const strengthLabels = ["Muy débil", "Débil", "Regular", "Buena", "Muy fuerte"];
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-600"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Client-side validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Todos los campos son obligatorios");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas nuevas no coinciden");
            return;
        }

        if (newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (currentPassword === newPassword) {
            setError("La nueva contraseña debe ser diferente a la actual");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || "Error al cambiar la contraseña");
            }
        } catch (err) {
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
                    <div className="max-w-md mx-auto flex items-center gap-3">
                        <Link href="/mi-perfil/datos" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <h1 className="font-bold text-lg text-gray-900">Cambiar Contraseña</h1>
                    </div>
                </div>

                <div className="max-w-md mx-auto px-4 py-12 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
                    <p className="text-gray-500 mb-2">
                        Tu contraseña fue modificada exitosamente.
                    </p>
                    <p className="text-gray-400 text-sm mb-8">
                        Te enviamos un email de confirmación a tu correo registrado.
                    </p>
                    <Link
                        href="/mi-perfil"
                        className="inline-block px-6 py-3 bg-[#e60012] text-white font-bold rounded-xl hover:bg-[#c5000f] transition"
                    >
                        Volver al Perfil
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <Link href="/mi-perfil/datos" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="font-bold text-lg text-gray-900">Cambiar Contraseña</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Security Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Recomendaciones de seguridad:</p>
                        <ul className="list-disc list-inside text-blue-600 space-y-0.5 text-xs">
                            <li>Usa al menos 8 caracteres</li>
                            <li>Incluí mayúsculas y minúsculas</li>
                            <li>Agregá números y símbolos</li>
                            <li>No uses información personal</li>
                        </ul>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-500 mb-2">
                            Contraseña Actual
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showCurrent ? "text" : "password"}
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] transition"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <label htmlFor="newPassword" className="block text-xs font-medium text-gray-500 mb-2">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showNew ? "text" : "password"}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] transition"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <div className="mt-3">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 flex-1 rounded-full transition-all ${level <= passwordStrength
                                                    ? strengthColors[passwordStrength - 1]
                                                    : "bg-gray-200"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Seguridad: <span className="font-medium">{strengthLabels[Math.max(0, passwordStrength - 1)]}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-500 mb-2">
                            Confirmar Nueva Contraseña
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showConfirm ? "text" : "password"}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${confirmPassword && confirmPassword !== newPassword
                                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                                        : confirmPassword && confirmPassword === newPassword
                                            ? "border-green-300 focus:ring-green-200 focus:border-green-400"
                                            : "border-gray-200 focus:ring-[#e60012]/20 focus:border-[#e60012]"
                                    }`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-xs text-red-500 mt-2">Las contraseñas no coinciden</p>
                        )}
                        {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Las contraseñas coinciden
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        className="w-full py-4 bg-[#e60012] text-white font-bold rounded-xl hover:bg-[#c5000f] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <Lock className="w-5 h-5" />
                                Cambiar Contraseña
                            </>
                        )}
                    </button>
                </form>

                {/* Forgot Password Link */}
                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm mb-2">¿Olvidaste tu contraseña actual?</p>
                    <Link
                        href="/recuperar-contrasena"
                        className="text-[#e60012] font-medium hover:underline text-sm"
                    >
                        Recuperar mediante email
                    </Link>
                </div>
            </div>
        </div>
    );
}
