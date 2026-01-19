"use client";

// Repartidor Registration Page - Formulario de registro para repartidores
import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Car,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    User,
    Phone,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Calendar,
    Palette,
    Hash,
    Sparkles,
    Shield,
    DollarSign,
    Zap
} from "lucide-react";

function RepartidorRegistroContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromProfile = searchParams.get("from") === "profile";
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Current year for vehicle validation (max 10 years old)
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 10;

    // Form data
    const [formData, setFormData] = useState({
        // Paso 1: Datos personales
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dni: "",
        password: "",
        // Paso 2: Datos del vehículo
        vehicleType: "auto",
        vehicleBrand: "",
        vehicleModel: "",
        vehicleYear: "",
        vehicleColor: "",
        licensePlate: "",
        hasLicense: false,
        acceptTerms: false,
    });

    const vehicleBrands = [
        "Chevrolet",
        "Fiat",
        "Ford",
        "Honda",
        "Hyundai",
        "Nissan",
        "Peugeot",
        "Renault",
        "Toyota",
        "Volkswagen",
        "Otra"
    ];

    // Generate years array (current year to 10 years ago)
    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= minYear; y--) {
            years.push(y);
        }
        return years;
    }, [currentYear, minYear]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate vehicle year
        const year = parseInt(formData.vehicleYear);
        if (year < minYear) {
            setError(`El vehículo debe ser del año ${minYear} o más reciente (máximo 10 años de antigüedad)`);
            return;
        }

        if (!formData.hasLicense) {
            setError("Debés tener licencia de conducir vigente");
            return;
        }

        if (!formData.acceptTerms) {
            setError("Debés aceptar los términos y condiciones");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register/driver", {
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                {s < 2 && <div className={`w-12 h-1 rounded ${step > s ? "bg-green-600" : "bg-gray-200"}`} />}
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
                            Tu solicitud para ser repartidor MOOVY está en revisión. Te contactaremos pronto para coordinar la verificación de documentos.
                        </p>

                        <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-green-600" />
                                <div className="text-left">
                                    <p className="font-medium text-green-900">Próximos pasos</p>
                                    <p className="text-sm text-green-700">Te enviaremos un email con instrucciones para verificar tu identidad y licencia.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <Shield className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Verificación</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <FileText className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Documentos</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <Zap className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">¡A rodar!</p>
                            </div>
                        </div>

                        <Link
                            href={fromProfile ? "/mi-perfil" : "/"}
                            className="inline-flex items-center gap-2 text-green-600 font-medium hover:underline"
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Quiero ser Repartidor</h2>
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
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="dni"
                                        value={formData.dni}
                                        onChange={handleChange}
                                        placeholder="12.345.678"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                        placeholder="juan@email.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
                            >
                                Continuar
                            </button>
                        </form>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            ¿Ya tenés cuenta? <Link href="/repartidores/login" className="text-green-600 font-medium hover:underline">Iniciá sesión</Link>
                        </p>
                    </div>
                )}

                {/* Step 2: Vehicle Data */}
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Tu Vehículo</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 2: Datos del vehículo</p>

                        {/* Vehicle Age Warning */}
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Requisito de vehículo</p>
                                <p className="text-xs text-amber-700">Solo aceptamos vehículos con máximo 10 años de antigüedad (del {minYear} en adelante)</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                    <select
                                        name="vehicleBrand"
                                        value={formData.vehicleBrand}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {vehicleBrands.map((brand) => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                                    <input
                                        type="text"
                                        name="vehicleModel"
                                        value={formData.vehicleModel}
                                        onChange={handleChange}
                                        placeholder="Ej: Gol Trend"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Año
                                    </label>
                                    <select
                                        name="vehicleYear"
                                        value={formData.vehicleYear}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {yearOptions.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Palette className="w-4 h-4 inline mr-1" />
                                        Color
                                    </label>
                                    <input
                                        type="text"
                                        name="vehicleColor"
                                        value={formData.vehicleColor}
                                        onChange={handleChange}
                                        placeholder="Ej: Blanco"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Patente
                                </label>
                                <input
                                    type="text"
                                    name="licensePlate"
                                    value={formData.licensePlate}
                                    onChange={handleChange}
                                    placeholder="AB 123 CD"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                                    required
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="hasLicense"
                                        checked={formData.hasLicense}
                                        onChange={handleChange}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Tengo licencia de conducir vigente y documentación del vehículo al día
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onChange={handleChange}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Acepto los <Link href="/terminos" className="text-green-600 underline">términos y condiciones</Link> para repartidores
                                    </span>
                                </label>
                            </div>

                            {/* Benefits */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-900">¿Por qué MOOVY?</span>
                                </div>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Ganá hasta $50,000/semana
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Horarios 100% flexibles
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Seguro mientras trabajás
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Pagos rápidos y transparentes
                                    </li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Car className="w-5 h-5" />
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

export default function RepartidorRegistroPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60012]"></div>
            </div>
        }>
            <RepartidorRegistroContent />
        </Suspense>
    );
}
