"use client";

// Comercio Registration Page - Formulario de registro para comercios
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Store,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    User,
    Phone,
    MapPin,
    Building2,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Sparkles
} from "lucide-react";

export default function ComercioRegistroPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromProfile = searchParams.get("from") === "profile";
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        // Paso 1: Datos del responsable
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        // Paso 2: Datos del comercio
        businessName: "",
        businessType: "",
        cuit: "",
        address: "",
        description: "",
    });

    const businessTypes = [
        "Restaurante",
        "Cafetería",
        "Panadería",
        "Heladería",
        "Minimercado",
        "Farmacia",
        "Ferretería",
        "Librería",
        "Ropa y Accesorios",
        "Electrónica",
        "Otro"
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register/merchant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al registrar");
            }

            setStep(3); // Success step
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Logo */}
                <div className="text-center mb-6">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={120}
                            height={38}
                            className="mx-auto"
                            priority
                        />
                    </Link>
                </div>

                {/* Progress Steps */}
                {step < 3 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                {s < 2 && <div className={`w-12 h-1 rounded ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Success Step */}
                {step === 3 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
                        <p className="text-gray-500 mb-6">
                            Recibimos tu solicitud para unirte a MOOVY. Nuestro equipo la revisará y te contactaremos en las próximas 24-48 horas.
                        </p>
                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <div className="text-left">
                                    <p className="font-medium text-blue-900">¿Qué sigue?</p>
                                    <p className="text-sm text-blue-700">Te enviaremos un email con los próximos pasos.</p>
                                </div>
                            </div>
                        </div>
                        <Link
                            href={fromProfile ? "/mi-perfil" : "/"}
                            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                        </Link>
                    </div>
                )}

                {/* Step 1: Personal Data */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Registrar mi Comercio</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 1: Tus datos personales</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep1Submit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="Juan"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Pérez"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="juan@micomercio.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+54 2901 ..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
                            >
                                Continuar
                            </button>
                        </form>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            ¿Ya tenés cuenta? <Link href="/comercios/login" className="text-blue-600 font-medium hover:underline">Iniciá sesión</Link>
                        </p>
                    </div>
                )}

                {/* Step 2: Business Data */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver
                        </button>

                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Datos del Comercio</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 2: Información de tu negocio</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Comercio</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        placeholder="Mi Super Negocio"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                                <select
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                >
                                    <option value="">Seleccioná un rubro</option>
                                    {businessTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CUIT (opcional)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="cuit"
                                        value={formData.cuit}
                                        onChange={handleChange}
                                        placeholder="20-12345678-9"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del Comercio</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Av. San Martín 1234, Ushuaia"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Contanos un poco sobre tu negocio..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            {/* Benefits */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Beneficios de unirte</span>
                                </div>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>✓ Llegá a miles de clientes en tu ciudad</li>
                                    <li>✓ Panel de gestión fácil de usar</li>
                                    <li>✓ Sin costo de alta</li>
                                    <li>✓ Entregas con repartidores verificados</li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Store className="w-5 h-5" />
                                        Enviar Solicitud
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Back Link */}
                {step < 3 && (
                    <Link
                        href={fromProfile ? "/mi-perfil" : "/"}
                        className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                    </Link>
                )}
            </div>
        </div>
    );
}
