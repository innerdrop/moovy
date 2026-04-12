"use client";

// Comercio Registration Page - Formulario de registro para comercios
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
    Sparkles,
    Shield,
    CreditCard,
    Upload
} from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import ImageUpload from "@/components/ui/ImageUpload";
import DocumentUpload from "@/components/ui/DocumentUpload";

// Tipos de negocio que requieren registro sanitario (alimentos)
const FOOD_BUSINESS_TYPES = [
    "Restaurante",
    "Pizzería",
    "Hamburguesería",
    "Parrilla",
    "Cafetería",
    "Heladería",
    "Panadería/Pastelería",
    "Sushi",
    "Comida Saludable",
    "Rotisería",
    "Bebidas",
    "Vinoteca/Licorería"
];

function ComercioRegistroContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, update: updateSession } = useSession();
    const fromProfile = searchParams.get("from") === "profile";
    const isAuthenticated = !!session?.user;

    // If from profile (authenticated), skip step 2 (contact/password) → go 1 → 3
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        businessName: "",
        firstName: "",
        lastName: "",
        businessType: "",
        email: "",
        phone: "",
        businessPhone: "",
        address: "",
        password: "",
        confirmPassword: "",
        latitude: null as number | null,
        longitude: null as number | null,
        // Paso 3: Datos fiscales y legales
        cuit: "",
        cbu: "",
        constanciaAfipUrl: "",
        habilitacionMunicipalUrl: "",
        registroSanitarioUrl: "",
        acceptedTerms: false,
        acceptedPrivacy: false,
    });

    const businessTypes = [
        // Gastronomía
        "Restaurante",
        "Pizzería",
        "Hamburguesería",
        "Parrilla",
        "Cafetería",
        "Heladería",
        "Panadería/Pastelería",
        "Sushi",
        "Comida Saludable",
        "Rotisería",
        // Bebidas
        "Bebidas",
        "Vinoteca/Licorería",
        // Compras diarias
        "Supermercado/Almacén",
        "Kiosco",
        "Dietética/Naturista",
        // Salud y bienestar
        "Farmacia",
        "Veterinaria/Pet Shop",
        "Óptica",
        "Perfumería/Cosmética",
        // Hogar
        "Ferretería",
        "Mueblería/Decoración",
        "Lavandería/Tintorería",
        // Otros comercios
        "Librería/Papelería",
        "Electrónica/Celulares",
        "Regalería/Cotillón",
        "Floristería",
        "Juguetería",
        "Indumentaria",
        "Otro"
    ];

    const isFoodBusiness = FOOD_BUSINESS_TYPES.includes(formData.businessType);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target;
        if (target instanceof HTMLInputElement && target.type === "checkbox") {
            setFormData({ ...formData, [target.name]: target.checked });
        } else {
            setFormData({ ...formData, [target.name]: target.value });
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

    const handleFinalSubmit = async () => {
        setError("");

        // Validar CUIT obligatorio
        if (!formData.cuit || formData.cuit.replace(/\D/g, "").length < 11) {
            setError("El CUIT es obligatorio y debe tener 11 dígitos");
            return;
        }

        // Validar CBU/Alias obligatorio
        if (!formData.cbu || formData.cbu.trim().length < 6) {
            setError("El CBU o Alias bancario es obligatorio");
            return;
        }

        // Validar checkboxes obligatorios
        if (!formData.acceptedTerms || !formData.acceptedPrivacy) {
            setError("Debés aceptar los Términos para Comercios y la Política de Privacidad");
            return;
        }

        setIsLoading(true);

        // Add prefix to phone numbers if they don't have it
        const submissionData = {
            ...formData,
            phone: formData.phone.startsWith("+549") ? formData.phone : `+549${formData.phone}`,
            businessPhone: formData.businessPhone.startsWith("+549") ? formData.businessPhone : `+549${formData.businessPhone}`
        };

        try {
            // Authenticated user from profile → activate-merchant (adds role to existing account)
            // New user → register/merchant (creates new account + merchant)
            const endpoint = fromProfile && isAuthenticated
                ? "/api/auth/activate-merchant"
                : "/api/auth/register/merchant";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al registrar");
            }

            // Refresh session so COMERCIO role appears in JWT
            if (fromProfile && isAuthenticated) {
                await updateSession({ refreshRoles: true });
            }

            setStep(4); // Success step
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
                {step < 4 && (() => {
                    // From profile: show steps 1 and 3 as "1 of 2" and "2 of 2" (skip step 2)
                    const steps = fromProfile && isAuthenticated ? [1, 3] : [1, 2, 3];
                    return (
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {steps.map((s, i) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                                        {step > s ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                    </div>
                                    {i < steps.length - 1 && <div className={`w-12 h-1 rounded ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {/* Success Step */}
                {step === 4 && (
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

                {/* Step 1: Business and Basic Info */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Registrar mi Comercio</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            {fromProfile && isAuthenticated ? "Paso 1: Datos de tu negocio" : "Paso 1: Información básica"}
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setError("");
                            // From profile: skip step 2 (contact/password), go straight to fiscal docs
                            setStep(fromProfile && isAuthenticated ? 3 : 2);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Comercio <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        placeholder="Mi local moovy"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Personal data — only for new users (profile users already have this) */}
                            {!(fromProfile && isAuthenticated) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre <span className="text-red-500">*</span>
                                        </label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Apellido <span className="text-red-500">*</span>
                                        </label>
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
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de negocio <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        name="businessType"
                                        value={formData.businessType}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">Seleccioná un rubro</option>
                                        {businessTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
                            >
                                Continuar
                            </button>
                        </form>

                        {!(fromProfile && isAuthenticated) && (
                            <p className="mt-4 text-center text-sm text-gray-500">
                                ¿Ya tenés cuenta? <Link href="/comercios/login" className="text-blue-600 font-medium hover:underline">Iniciá sesión</Link>
                            </p>
                        )}
                    </div>
                )}

                {/* Step 2: Contact, Address and Password */}
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Contacto y Dirección</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 2: Datos de contacto y acceso</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={(e) => {
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
                            setStep(3);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono (+549) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-900 font-bold border-r pr-1.5 border-gray-200 text-sm">
                                            +549
                                        </span>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="2901 ..."
                                            className="w-full pl-[5.5rem] pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                        Ingresá solo números, sin 0 y sin 15.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono Negocio (+549) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-900 font-bold border-r pr-1.5 border-gray-200 text-sm">
                                            +549
                                        </span>
                                        <input
                                            type="tel"
                                            name="businessPhone"
                                            value={formData.businessPhone}
                                            onChange={handleChange}
                                            placeholder="2901 ..."
                                            className="w-full pl-[5.5rem] pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                        Ingresá solo números, sin 0 y sin 15.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre o dirección del negocio <span className="text-red-500">*</span>
                                </label>
                                <AddressAutocomplete
                                    value={formData.address}
                                    onChange={(address, lat, lng, street, num) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            address: num ? `${street} ${num}` : address,
                                            latitude: lat ?? prev.latitude,
                                            longitude: lng ?? prev.longitude
                                        }));
                                    }}
                                    placeholder="Buscá tu dirección o nombre de negocio..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Mínimo 8"
                                            autoComplete="new-password"
                                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmar <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Repetí"
                                            autoComplete="new-password"
                                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
                            >
                                Continuar
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 3: Fiscal and Legal Data */}
                {step === 3 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <button
                            onClick={() => { setError(""); setStep(fromProfile && isAuthenticated ? 1 : 2); }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver
                        </button>

                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Datos Fiscales y Legales</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            {fromProfile && isAuthenticated ? "Paso 2: Documentación para operar" : "Paso 3: Documentación para operar"}
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Business address & phone — only shown here when from profile (step 2 is skipped) */}
                            {fromProfile && isAuthenticated && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Teléfono del Negocio (+549) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-900 font-bold border-r pr-1.5 border-gray-200 text-sm">
                                                +549
                                            </span>
                                            <input
                                                type="tel"
                                                name="businessPhone"
                                                value={formData.businessPhone}
                                                onChange={handleChange}
                                                placeholder="2901 ..."
                                                className="w-full pl-[5.5rem] pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                            Ingresá solo números, sin 0 y sin 15.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dirección del negocio <span className="text-red-500">*</span>
                                        </label>
                                        <AddressAutocomplete
                                            value={formData.address}
                                            onChange={(address, lat, lng, street, num) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    address: num ? `${street} ${num}` : address,
                                                    latitude: lat ?? prev.latitude,
                                                    longitude: lng ?? prev.longitude
                                                }));
                                            }}
                                            placeholder="Buscá tu dirección o nombre de negocio..."
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* CUIT */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CUIT <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="cuit"
                                        value={formData.cuit}
                                        onChange={handleCuitChange}
                                        placeholder="XX-XXXXXXXX-X"
                                        maxLength={13}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    CUIT de la persona física o jurídica titular del comercio.
                                </p>
                            </div>

                            {/* CBU / Alias */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CBU o Alias bancario <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="cbu"
                                        value={formData.cbu}
                                        onChange={handleChange}
                                        placeholder="CBU de 22 dígitos o alias"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    Para la recepción de pagos por ventas a través de la plataforma.
                                </p>
                            </div>

                            {/* Constancia AFIP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Constancia de Inscripción AFIP *
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Es el comprobante que certifica tu inscripción fiscal. Lo descargás desde{" "}
                                    <a href="https://www.afip.gob.ar" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">afip.gob.ar</a>{" "}
                                    → Constancia de inscripción. Puede ser Monotributo o Responsable Inscripto.
                                </p>
                                <DocumentUpload
                                    value={formData.constanciaAfipUrl}
                                    onChange={(url) => setFormData(prev => ({ ...prev, constanciaAfipUrl: url }))}
                                    placeholder="Subí tu constancia AFIP"
                                    formatHint="PDF, JPG o PNG (Max 10MB)"
                                />
                            </div>

                            {/* Habilitación Municipal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Habilitación Municipal *
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Es el permiso que otorga la Municipalidad de Ushuaia para operar tu comercio.
                                    Si todavía estás en trámite, podés subir el comprobante de inicio de trámite.
                                </p>
                                <DocumentUpload
                                    value={formData.habilitacionMunicipalUrl}
                                    onChange={(url) => setFormData(prev => ({ ...prev, habilitacionMunicipalUrl: url }))}
                                    placeholder="Subí tu habilitación municipal"
                                    formatHint="PDF, JPG o PNG (Max 10MB)"
                                />
                            </div>

                            {/* Registro Sanitario - solo para alimentos */}
                            {isFoodBusiness && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Registro Sanitario / Habilitación Bromatológica *
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Obligatorio para comercios que elaboran o manipulan alimentos.
                                        Lo expide la autoridad sanitaria de Tierra del Fuego.
                                    </p>
                                    <DocumentUpload
                                        value={formData.registroSanitarioUrl}
                                        onChange={(url) => setFormData(prev => ({ ...prev, registroSanitarioUrl: url }))}
                                        placeholder="Subí tu registro sanitario"
                                        formatHint="PDF, JPG o PNG (Max 10MB)"
                                    />
                                </div>
                            )}

                            {/* Info comisiones */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Comisiones</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    MOOVY cobra una comisión por cada venta realizada a través de la plataforma.
                                    El porcentaje será informado antes de la activación de tu cuenta.
                                    Consultá los detalles en los{" "}
                                    <Link href="/terminos-comercio" className="underline font-medium" target="_blank">
                                        Términos para Comercios
                                    </Link>.
                                </p>
                            </div>

                            {/* Checkboxes legales */}
                            <div className="space-y-3 border-t pt-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="acceptedTerms"
                                        checked={formData.acceptedTerms}
                                        onChange={handleChange}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Acepto los{" "}
                                        <Link href="/terminos-comercio" className="text-blue-600 underline font-medium" target="_blank">
                                            Términos y Condiciones para Comercios
                                        </Link>{" "}
                                        y los{" "}
                                        <Link href="/terminos" className="text-blue-600 underline font-medium" target="_blank">
                                            Términos y Condiciones generales
                                        </Link>{" "}
                                        de MOOVY. <span className="text-red-500">*</span>
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="acceptedPrivacy"
                                        checked={formData.acceptedPrivacy}
                                        onChange={handleChange}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Acepto la{" "}
                                        <Link href="/privacidad" className="text-blue-600 underline font-medium" target="_blank">
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
                                disabled={isLoading || !formData.acceptedTerms || !formData.acceptedPrivacy}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        </div>
                    </div>
                )}

                {/* Back Link */}
                {step < 4 && (
                    <Link
                        href={fromProfile ? "/mi-perfil" : "/"}
                        className="mt-4 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition"
                    >
                        ← Volver al inicio
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function ComercioRegistroPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <ComercioRegistroContent />
        </Suspense>
    );
}