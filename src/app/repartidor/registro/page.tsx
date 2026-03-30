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
    Zap,
    Bike,
    CreditCard
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";
import DocumentUpload from "@/components/ui/DocumentUpload";

// Tipos de vehículo con sus propiedades
const VEHICLE_TYPES = [
    { value: "bicicleta", label: "Bicicleta", icon: "🚲", motorized: false },
    { value: "moto", label: "Moto", icon: "🏍️", motorized: true },
    { value: "auto", label: "Auto", icon: "🚗", motorized: true },
    { value: "camioneta", label: "Camioneta", icon: "🚙", motorized: true },
];

function RepartidorRegistroContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromProfile = searchParams.get("from") === "profile";
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        cuit: "",
        password: "",
        confirmPassword: "",
        dniFrenteUrl: "",
        dniDorsoUrl: "",
        // Paso 2: Datos del vehículo
        vehicleType: "",
        vehicleBrand: "",
        vehicleModel: "",
        vehicleYear: "",
        vehicleColor: "",
        licensePlate: "",
        licenciaUrl: "",
        seguroUrl: "",
        vtvUrl: "",
        // Paso 3: Confirmación
        hasLicense: false,
        acceptTerms: false,
        acceptPrivacy: false,
    });

    const isMotorized = VEHICLE_TYPES.find(v => v.value === formData.vehicleType)?.motorized ?? false;

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

    // Validación formato CUIT: XX-XXXXXXXX-X
    const formatCuit = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
    };

    const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, cuit: formatCuit(e.target.value) });
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (formData.password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        setStep(2);
    };

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.vehicleType) {
            setError("Seleccioná un tipo de vehículo");
            return;
        }

        if (isMotorized) {
            const year = parseInt(formData.vehicleYear);
            if (year < minYear) {
                setError(`El vehículo debe ser del año ${minYear} o más reciente (máximo 10 años de antigüedad)`);
                return;
            }
        }

        setStep(3);
    };

    const handleFinalSubmit = async () => {
        setError("");

        if (isMotorized && !formData.hasLicense) {
            setError("Debés confirmar que tenés licencia de conducir vigente");
            return;
        }

        if (!formData.acceptTerms || !formData.acceptPrivacy) {
            setError("Debés aceptar los Términos para Repartidores y la Política de Privacidad");
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

            setStep(4); // Success step
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
                            src="/logo-moovy.svg"
                            alt="Moovy"
                            width={120}
                            height={38}
                            className="mx-auto"
                            priority
                        />
                    </Link>
                </div>

                {/* Progress Steps */}
                {step < 4 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                {s < 3 && <div className={`w-12 h-1 rounded ${step > s ? "bg-green-600" : "bg-gray-200"}`} />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Success Step */}
                {step === 4 && (
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
                                    <p className="text-sm text-green-700">Nuestro equipo revisará tu documentación y te contactaremos en las próximas 24-48 horas.</p>
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

                {/* Step 1: Personal Data + CUIT + DNI photos */}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">CUIT <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="cuit"
                                        value={formData.cuit}
                                        onChange={handleCuitChange}
                                        placeholder="XX-XXXXXXXX-X"
                                        maxLength={13}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    Necesario para facturar y cobrar como monotributista.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Mínimo 6"
                                            className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                            minLength={8}
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Repetí"
                                            className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                            minLength={8}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* DNI Photos */}
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Foto de DNI</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Frente</label>
                                        <DocumentUpload
                                            value={formData.dniFrenteUrl}
                                            onChange={(url) => setFormData(prev => ({ ...prev, dniFrenteUrl: url }))}
                                            placeholder="Subí foto del frente"
                                            formatHint="JPG, PNG o PDF (Max 10MB)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Dorso</label>
                                        <DocumentUpload
                                            value={formData.dniDorsoUrl}
                                            onChange={(url) => setFormData(prev => ({ ...prev, dniDorsoUrl: url }))}
                                            placeholder="Subí foto del dorso"
                                            formatHint="JPG, PNG o PDF (Max 10MB)"
                                        />
                                    </div>
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
                            ¿Ya tenés cuenta? <Link href="/repartidor/login" className="text-green-600 font-medium hover:underline">Iniciá sesión</Link>
                        </p>
                    </div>
                )}

                {/* Step 2: Vehicle Type + Data + Documents */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <button
                            onClick={() => { setError(""); setStep(1); }}
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
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 2: Tipo de vehículo y documentación</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep2Submit} className="space-y-4">
                            {/* Vehicle Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de vehículo <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {VEHICLE_TYPES.map((vt) => (
                                        <button
                                            key={vt.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, vehicleType: vt.value }))}
                                            className={`p-3 rounded-xl border-2 text-center transition ${
                                                formData.vehicleType === vt.value
                                                    ? "border-green-500 bg-green-50"
                                                    : "border-gray-200 hover:border-green-300"
                                            }`}
                                        >
                                            <span className="text-2xl block mb-1">{vt.icon}</span>
                                            <span className="text-xs font-medium text-gray-700">{vt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Motorized vehicle fields */}
                            {isMotorized && (
                                <>
                                    {/* Vehicle Age Warning */}
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Requisito de vehículo</p>
                                            <p className="text-xs text-amber-700">Solo aceptamos vehículos con máximo 10 años de antigüedad (del {minYear} en adelante)</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Marca <span className="text-red-500">*</span></label>
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo <span className="text-red-500">*</span></label>
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
                                                Año <span className="text-red-500">*</span>
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
                                                Color <span className="text-red-500">*</span>
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
                                            Patente <span className="text-red-500">*</span>
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

                                    {/* Document uploads for motorized */}
                                    <div className="border-t pt-4 space-y-4">
                                        <p className="text-sm font-medium text-gray-700">Documentación del vehículo</p>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Licencia de Conducir</label>
                                            <DocumentUpload
                                                value={formData.licenciaUrl}
                                                onChange={(url) => setFormData(prev => ({ ...prev, licenciaUrl: url }))}
                                                placeholder="Subí tu licencia de conducir"
                                                formatHint="JPG, PNG o PDF (Max 10MB)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Seguro del Vehículo</label>
                                            <DocumentUpload
                                                value={formData.seguroUrl}
                                                onChange={(url) => setFormData(prev => ({ ...prev, seguroUrl: url }))}
                                                placeholder="Subí el seguro del vehículo"
                                                formatHint="JPG, PNG o PDF (Max 10MB)"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                                Obligatorio por Ley 24.449. Cobertura de responsabilidad civil hacia terceros.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">VTV (Verificación Técnica Vehicular)</label>
                                            <DocumentUpload
                                                value={formData.vtvUrl}
                                                onChange={(url) => setFormData(prev => ({ ...prev, vtvUrl: url }))}
                                                placeholder="Subí tu VTV vigente"
                                                formatHint="JPG, PNG o PDF (Max 10MB)"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Bicycle info */}
                            {formData.vehicleType === "bicicleta" && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                                    <Bike className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800">Bicicleta</p>
                                        <p className="text-xs text-green-700">No se requiere licencia de conducir, patente ni seguro vehicular. Se recomienda usar casco, luces y reflectantes.</p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!formData.vehicleType}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continuar
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 3: Confirmation - Checkboxes + Benefits + Submit */}
                {step === 3 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <button
                            onClick={() => { setError(""); setStep(2); }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver
                        </button>

                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Confirmación</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 3: Revisá y aceptá los términos</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <p className="text-sm font-medium text-gray-800">Resumen de tu solicitud:</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-gray-500">Nombre:</span>
                                    <span className="text-gray-800 font-medium">{formData.firstName} {formData.lastName}</span>
                                    <span className="text-gray-500">DNI:</span>
                                    <span className="text-gray-800 font-medium">{formData.dni}</span>
                                    <span className="text-gray-500">CUIT:</span>
                                    <span className="text-gray-800 font-medium">{formData.cuit}</span>
                                    <span className="text-gray-500">Vehículo:</span>
                                    <span className="text-gray-800 font-medium capitalize">
                                        {formData.vehicleType}
                                        {isMotorized && ` ${formData.vehicleBrand} ${formData.vehicleModel}`}
                                    </span>
                                    {isMotorized && (
                                        <>
                                            <span className="text-gray-500">Patente:</span>
                                            <span className="text-gray-800 font-medium uppercase">{formData.licensePlate}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Info comisiones */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-900">Comisiones y pagos</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    MOOVY retiene un porcentaje por la gestión de cada entrega.
                                    Consultá los detalles en los{" "}
                                    <Link href="/terminos-repartidor" className="underline font-medium" target="_blank">
                                        Términos para Repartidores
                                    </Link>.
                                </p>
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
                                        <Zap className="w-4 h-4" />
                                        Pagos rápidos y transparentes
                                    </li>
                                </ul>
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-3 border-t pt-4">
                                {isMotorized && (
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="hasLicense"
                                            checked={formData.hasLicense}
                                            onChange={handleChange}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-600">
                                            Tengo licencia de conducir vigente y documentación del vehículo al día. <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                )}

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onChange={handleChange}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Acepto los{" "}
                                        <Link href="/terminos-repartidor" className="text-green-600 underline font-medium" target="_blank">
                                            Términos y Condiciones para Repartidores
                                        </Link>{" "}
                                        y los{" "}
                                        <Link href="/terminos" className="text-green-600 underline font-medium" target="_blank">
                                            Términos y Condiciones generales
                                        </Link>{" "}
                                        de MOOVY. <span className="text-red-500">*</span>
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="acceptPrivacy"
                                        checked={formData.acceptPrivacy}
                                        onChange={handleChange}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Acepto la{" "}
                                        <Link href="/privacidad" className="text-green-600 underline font-medium" target="_blank">
                                            Política de Privacidad
                                        </Link>{" "}
                                        y el tratamiento de mis datos personales conforme la Ley 25.326. <span className="text-red-500">*</span>
                                    </span>
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isLoading || !formData.acceptTerms || !formData.acceptPrivacy || (isMotorized && !formData.hasLicense)}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        </div>
                    </div>
                )}

                {/* Back Link */}
                {step < 4 && (
                    <Link
                        href="/"
                        className="mt-4 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition"
                    >
                        ← Volver al inicio
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function RepartidorRegistroPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>}>
            <RepartidorRegistroContent />
        </Suspense>
    );
}