"use client";

// Repartidor Registration Page - Formulario de registro para repartidores
//
// Post fix/registro-repartidor-ux (2026-04-23):
// - Step 1 ahora SIEMPRE se muestra (antes se saltaba cuando fromProfile
//   && isAuthenticated → causaba DNI/CUIT en blanco en Confirmación y
//   rechazo del server "El CUIT/CUIL es obligatorio"). Cuando el usuario
//   ya está logueado se oculta email/password y se muestran solo los
//   campos específicos de driver (Sexo + DNI + CUIT + DNI photos + constancia AFIP).
// - Sexo M/F toggle: afecta el cálculo automático del CUIT (prefijo 20 vs 27)
//   al tipear el DNI. El usuario siempre puede editar.
// - Vehículo: reemplazado el grid de 7 botones por SearchableSelect
//   (dropdown con buscador). Marca/Modelo cascading — al elegir "Peugeot"
//   solo aparecen sus modelos (206, 208, 308, etc). Color y Año también
//   con SearchableSelect.
// - Patente: input mask progresivo para MERCOSUR (AA 123 BB) y legacy
//   (ABC 123). Normalización a canonical (sin espacios) antes del POST.
//   Validación con regex dedicado server-side.
// - Fechas: el <input type="date"> sigue usando value ISO (el browser
//   renderiza según locale). En la pantalla de Confirmación las mostramos
//   en DD/MM/AAAA (formato argentino) para que el usuario confirme
//   sin ambigüedad.
import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
    CreditCard,
    AlertCircle,
    Receipt,
    Tag,
    Box
} from "lucide-react";
import DocumentUpload from "@/components/ui/DocumentUpload";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { validateCuit, buildCuitFromDni, formatCuitForDisplay } from "@/lib/cuit";
import { applyPatenteMask, validatePatente, sanitizePatenteInput } from "@/lib/patente";
import {
    getVehicleCategoryFromFormType,
    getBrandsForCategory,
    getModelsForBrand,
    VEHICLE_COLORS,
} from "@/lib/argentine-vehicles";

// Tipos de vehículo + antigüedad máxima permitida. Espeja exactamente el map
// MAX_VEHICLE_AGE_YEARS del endpoint /api/auth/register/driver. Si cambiás uno,
// cambiá el otro.
const VEHICLE_TYPES = [
    { value: "bicicleta", label: "Bicicleta", icon: "🚲", motorized: false, maxAge: null },
    { value: "moto", label: "Moto", icon: "🏍️", motorized: true, maxAge: 15 },
    { value: "auto", label: "Auto", icon: "🚗", motorized: true, maxAge: 25 },
    { value: "camioneta", label: "Camioneta", icon: "🚙", motorized: true, maxAge: 25 },
    { value: "pickup", label: "Pickup", icon: "🛻", motorized: true, maxAge: 25 },
    { value: "suv", label: "SUV", icon: "🚙", motorized: true, maxAge: 25 },
    { value: "flete", label: "Flete", icon: "🚚", motorized: true, maxAge: 30 },
] as const;

type VehicleTypeValue = typeof VEHICLE_TYPES[number]["value"];

/** Opciones del SearchableSelect de tipo de vehículo, con emoji incluido */
const VEHICLE_TYPE_OPTIONS: string[] = VEHICLE_TYPES.map((v) => `${v.icon}  ${v.label}`);

/** Mapea el label del SearchableSelect al value del enum */
function parseVehicleTypeOption(label: string): VehicleTypeValue | "" {
    const match = VEHICLE_TYPES.find((v) => label.includes(v.label));
    return match ? match.value : "";
}

/** Label para SearchableSelect a partir del value */
function vehicleTypeToLabel(value: VehicleTypeValue | ""): string {
    if (!value) return "";
    const match = VEHICLE_TYPES.find((v) => v.value === value);
    return match ? `${match.icon}  ${match.label}` : "";
}

/**
 * Convierte una fecha ISO "YYYY-MM-DD" (o Date válido) a formato argentino
 * DD/MM/AAAA para mostrar en la pantalla de Confirmación.
 * Si viene vacío, devuelve "—".
 */
function formatDateAR(iso: string): string {
    if (!iso) return "—";
    // Evitamos new Date() porque puede shiftear por timezone.
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formatea el DNI con puntos de miles mientras el usuario escribe.
 * Acepta input crudo y devuelve el display con puntos: 12.345.678
 */
function formatDniInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, digits.length - 3)}.${digits.slice(-3)}`;
    return `${digits.slice(0, digits.length - 6)}.${digits.slice(-6, -3)}.${digits.slice(-3)}`;
}

function RepartidorRegistroContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, update: updateSession } = useSession();
    const fromProfile = searchParams.get("from") === "profile";
    const isAuthenticated = !!session?.user;

    // Pasos: 1 = datos personales + docs identidad, 2 = vehículo + docs vehiculares, 3 = confirmación, 4 = éxito
    // IMPORTANTE: NO se puede skipear el paso 1 para fromProfile porque
    // DNI, CUIT, sexo, fotos del DNI y constancia AFIP SIEMPRE son
    // obligatorios y no están en el objeto User. Para fromProfile se ocultan
    // solo los campos que ya tenemos (nombre/email/password) pero el paso
    // sigue siendo necesario.
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validación CUIT en vivo (solo UI — el server re-valida con el mismo helper)
    const [cuitValidation, setCuitValidation] = useState<{
        state: "empty" | "valid" | "invalid";
        message: string;
    }>({ state: "empty", message: "" });

    // Validación patente en vivo
    const [patenteValidation, setPatenteValidation] = useState<{
        state: "empty" | "valid" | "invalid";
        message: string;
    }>({ state: "empty", message: "" });

    // Guard: if from=profile but not authenticated, redirect to login
    useEffect(() => {
        if (fromProfile && !isAuthenticated && session !== undefined) {
            router.replace("/login");
        }
    }, [fromProfile, isAuthenticated, session, router]);

    // NOTA: el guard "si ya es DRIVER redirigir al dashboard" vive en
    // src/app/repartidor/registro/page.tsx como Server Component, usando
    // computeUserAccess() del dominio. No se usa el JWT `roles[]` acá porque
    // puede estar stale (cache) y causaba un loop registro <-> dashboard.

    const currentYear = new Date().getFullYear();

    // Form data
    const [formData, setFormData] = useState({
        // Paso 1: Datos personales (firstName/lastName/email/password/phone se
        // ignoran cuando fromProfile && isAuthenticated — el server los toma
        // del User autenticado)
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dni: "",
        sex: "" as "M" | "F" | "",  // NUEVO: para cálculo automático de CUIT (prefijo 20 vs 27)
        cuit: "",
        password: "",
        confirmPassword: "",
        dniFrenteUrl: "",
        dniDorsoUrl: "",
        constanciaCuitUrl: "",
        // Paso 2: Datos del vehículo
        vehicleType: "" as VehicleTypeValue | "",
        vehicleBrand: "",
        vehicleModel: "",
        vehicleYear: "",
        vehicleColor: "",
        licensePlate: "",       // display con espacios (AA 123 BB)
        licenciaUrl: "",
        licenciaExpiresAt: "",
        seguroUrl: "",
        seguroExpiresAt: "",
        rtoUrl: "",
        rtoExpiresAt: "",
        cedulaVerdeUrl: "",
        cedulaVerdeExpiresAt: "",
        // Paso 3: Confirmación
        hasLicense: false,
        acceptTerms: false,
        acceptPrivacy: false,
    });

    const vehicleMeta = VEHICLE_TYPES.find(v => v.value === formData.vehicleType) ?? null;
    const isMotorized = vehicleMeta?.motorized ?? false;
    const maxAge = vehicleMeta?.maxAge ?? null;
    const minYear = maxAge !== null ? currentYear - maxAge : currentYear - 25;

    // Category para cascading dropdowns de marca/modelo
    const vehicleCategory = useMemo(
        () => getVehicleCategoryFromFormType(formData.vehicleType || ""),
        [formData.vehicleType]
    );

    const brandOptions = useMemo(
        () => (vehicleCategory ? getBrandsForCategory(vehicleCategory) : []),
        [vehicleCategory]
    );

    const modelOptions = useMemo(
        () =>
            vehicleCategory && formData.vehicleBrand
                ? getModelsForBrand(vehicleCategory, formData.vehicleBrand)
                : [],
        [vehicleCategory, formData.vehicleBrand]
    );

    // Años como array de strings (SearchableSelect usa strings)
    const yearOptions = useMemo(() => {
        const years: string[] = [];
        for (let y = currentYear; y >= minYear; y--) {
            years.push(String(y));
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

    const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDniInput(e.target.value);
        setFormData((prev) => ({ ...prev, dni: formatted }));
    };

    // Validación formato CUIT (solo visual)
    const formatCuit = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
    };

    const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCuit(e.target.value);
        setFormData({ ...formData, cuit: formatted });

        const digits = formatted.replace(/\D/g, "");
        if (digits.length === 0) {
            setCuitValidation({ state: "empty", message: "" });
        } else if (digits.length < 11) {
            setCuitValidation({ state: "empty", message: "" });
        } else {
            const result = validateCuit(formatted);
            if (result.valid) {
                setCuitValidation({
                    state: "valid",
                    message:
                        result.personType === "FISICA"
                            ? "CUIT válido (persona física)"
                            : "CUIT válido (persona jurídica)",
                });
            } else {
                setCuitValidation({
                    state: "invalid",
                    message: result.error || "CUIT inválido",
                });
            }
        }
    };

    // Al cambiar sexo, si tenemos DNI completo y el CUIT actual no fue editado
    // manualmente más allá del prefijo default, recalculamos.
    const handleSexChange = (next: "M" | "F") => {
        setFormData((prev) => {
            const nextState = { ...prev, sex: next };
            const dniDigits = prev.dni.replace(/\D/g, "");
            if (dniDigits.length !== 7 && dniDigits.length !== 8) return nextState;

            const currentCuitDigits = prev.cuit.replace(/\D/g, "");
            // Si el usuario ya editó el CUIT completo (11 dígitos), respetamos
            if (currentCuitDigits.length === 11) return nextState;

            const guessed = buildCuitFromDni(dniDigits, next);
            if (!guessed) return nextState;
            nextState.cuit = formatCuitForDisplay(guessed);

            const result = validateCuit(nextState.cuit);
            if (result.valid) {
                setCuitValidation({
                    state: "valid",
                    message: "CUIT calculado automáticamente — verificá que sea correcto",
                });
            }
            return nextState;
        });
    };

    // Autocompletar CUIT desde DNI onBlur. Respeta el sexo elegido.
    const handleDniBlur = () => {
        const dniDigits = formData.dni.replace(/\D/g, "");
        if (dniDigits.length !== 7 && dniDigits.length !== 8) return;

        const currentCuitDigits = formData.cuit.replace(/\D/g, "");
        if (currentCuitDigits.length >= 11) return;

        // Usamos el sexo elegido; fallback a "M" si aún no eligió
        const sexForGuess = formData.sex || "M";
        const guessed = buildCuitFromDni(dniDigits, sexForGuess);
        if (!guessed) return;

        const formatted = formatCuitForDisplay(guessed);
        setFormData((prev) => ({ ...prev, cuit: formatted }));

        const result = validateCuit(formatted);
        if (result.valid) {
            setCuitValidation({
                state: "valid",
                message: "CUIT calculado automáticamente — verificá que sea correcto",
            });
        }
    };

    // Patente: mask progresivo + validación en vivo
    const handlePatenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = applyPatenteMask(e.target.value);
        setFormData((prev) => ({ ...prev, licensePlate: masked }));

        const clean = sanitizePatenteInput(masked);
        if (clean.length === 0) {
            setPatenteValidation({ state: "empty", message: "" });
            return;
        }
        const result = validatePatente(masked);
        if (result.valid) {
            setPatenteValidation({
                state: "valid",
                message:
                    result.format === "MERCOSUR"
                        ? "Formato MERCOSUR (2016→)"
                        : "Formato legacy (1995-2016)",
            });
        } else if (clean.length >= 6) {
            // Solo mostramos error si ya tiene al menos longitud mínima
            setPatenteValidation({
                state: "invalid",
                message: result.error || "Patente inválida",
            });
        } else {
            setPatenteValidation({ state: "empty", message: "" });
        }
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Los campos de cuenta (email/password) solo aplican si NO estamos logueados
        if (!(fromProfile && isAuthenticated)) {
            if (formData.password !== formData.confirmPassword) {
                setError("Las contraseñas no coinciden");
                return;
            }
            if (formData.password.length < 8) {
                setError("La contraseña debe tener al menos 8 caracteres");
                return;
            }
        }

        if (!formData.sex) {
            setError("Seleccioná tu sexo (necesario para el cálculo del CUIT)");
            return;
        }

        // feat/registro-simplificado (2026-04-27): DNI, CUIT, fotos y constancia AFIP
        // son OPCIONALES en el registro. El driver los completa después en su panel.
        if (formData.dni && formData.dni.replace(/\D/g, "").length > 0) {
            if (formData.dni.replace(/\D/g, "").length < 7) {
                setError("Si cargás el DNI, ingresá mínimo 7 dígitos");
                return;
            }
        }

        if (formData.cuit && formData.cuit.toString().trim().length > 0) {
            const cuitCheck = validateCuit(formData.cuit);
            if (!cuitCheck.valid) {
                setError(cuitCheck.error || "CUIT/CUIL inválido");
                return;
            }
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

        // feat/registro-simplificado (2026-04-27): datos del vehículo y docs son OPCIONALES.
        // El driver completa marca/modelo/color/año/patente/licencia/seguro/RTO/cédula
        // verde en su panel después. approveDriverTransition los exige para activar.

        setStep(3);
    };

    const handleFinalSubmit = async () => {
        setError("");

        // feat/registro-simplificado: no chequeamos hasLicense acá. Docs y declaración
        // de licencia los completa el driver en su panel después de crear la cuenta.

        if (!formData.acceptTerms || !formData.acceptPrivacy) {
            setError("Debés aceptar los Términos para Repartidores y la Política de Privacidad");
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = fromProfile && isAuthenticated
                ? "/api/auth/activate-driver"
                : "/api/auth/register/driver";

            // El backend usa `vtvUrl` + `vtvExpiresAt` (columna histórica de la DB).
            // La UI muestra "RTO" porque en Tierra del Fuego así se llama.
            // Normalizamos la patente a canonical (sin espacios, UPPERCASE).
            const plateCheck = validatePatente(formData.licensePlate);
            const normalizedPlate = plateCheck.valid
                ? plateCheck.normalized
                : sanitizePatenteInput(formData.licensePlate);

            const payload: Record<string, any> = {
                ...formData,
                licensePlate: normalizedPlate,
                vtvUrl: formData.rtoUrl,
                vtvExpiresAt: formData.rtoExpiresAt || null,
                licenciaExpiresAt: formData.licenciaExpiresAt || null,
                seguroExpiresAt: formData.seguroExpiresAt || null,
                cedulaVerdeExpiresAt: formData.cedulaVerdeExpiresAt || null,
            };
            delete payload.rtoUrl;
            delete payload.rtoExpiresAt;
            delete payload.confirmPassword;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al registrar");
            }

            if (fromProfile && isAuthenticated) {
                await updateSession();
            }

            setStep(4);
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

                {/* Progress Steps — siempre mostramos 3 pasos */}
                {step < 4 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3].map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                </div>
                                {i < 2 && <div className={`w-12 h-1 rounded ${step > s ? "bg-green-600" : "bg-gray-200"}`} />}
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

                        <Link
                            href={fromProfile ? "/mi-perfil" : "/"}
                            className="inline-flex items-center gap-2 text-green-600 font-medium hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                        </Link>
                    </div>
                )}

                {/* Step 1: Personal Data + Sexo + DNI + CUIT + DNI photos + Constancia AFIP */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        {fromProfile && isAuthenticated ? (
                            <button
                                onClick={() => router.push("/mi-perfil")}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al perfil
                            </button>
                        ) : null}

                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Quiero ser Repartidor</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 1: Tus datos personales</p>

                        {fromProfile && isAuthenticated && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800">
                                <span className="font-medium">{session?.user?.name}</span>, completá los datos fiscales y de identidad para registrarte como repartidor.
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep1Submit} className="space-y-4">
                            {/* Sección de cuenta — solo si NO estamos logueados */}
                            {!(fromProfile && isAuthenticated) && (
                                <>
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
                                                    placeholder="Mínimo 8"
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
                                </>
                            )}

                            {/* feat/registro-simplificado (2026-04-27): documentos eliminados del registro.
                                El driver completa DNI, CUIT, fotos DNI, constancia AFIP, etc en su perfil
                                después de crear la cuenta. El equipo de Moovy le indica qué falta. */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
                                <p className="font-semibold mb-1">Te creamos tu cuenta en menos de 1 minuto</p>
                                <p>Cuando entres al panel te indicamos qué documentación cargar para que el
                                equipo de Moovy active tu cuenta de repartidor.</p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
                            >
                                Continuar
                            </button>
                        </form>

                        {!(fromProfile && isAuthenticated) && (
                            <p className="mt-4 text-center text-sm text-gray-500">
                                ¿Ya tenés cuenta? <Link href="/repartidor/login" className="text-green-600 font-medium hover:underline">Iniciá sesión</Link>
                            </p>
                        )}
                    </div>
                )}

                {/* Step 2: Vehicle Type + Data + Documents + Expirations */}
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
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Paso 2: Tipo de vehículo y documentación
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep2Submit} className="space-y-4">
                            {/* Vehicle Type Selector */}
                            <SearchableSelect
                                label="Tipo de vehículo"
                                required
                                icon={Car}
                                placeholder="Elegí tu vehículo"
                                options={VEHICLE_TYPE_OPTIONS}
                                value={vehicleTypeToLabel(formData.vehicleType)}
                                onChange={(label) => {
                                    const v = parseVehicleTypeOption(label);
                                    setFormData((prev) => ({
                                        ...prev,
                                        vehicleType: v,
                                        vehicleBrand: "",
                                        vehicleModel: "",
                                        vehicleYear: "",
                                        vehicleColor: "",
                                        licensePlate: "",
                                    }));
                                    setPatenteValidation({ state: "empty", message: "" });
                                }}
                                searchPlaceholder="Buscar tipo..."
                            />

                            {/* feat/registro-simplificado (2026-04-27): datos del vehículo y docs
                                eliminados del registro. El driver completa marca, modelo, patente,
                                licencia, seguro, RTO, cédula verde, etc en su perfil después. */}
                            {isMotorized && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                                    <p className="font-semibold mb-1">Después te pediremos los datos del vehículo</p>
                                    <p>Cuando entres al panel vas a ver la documentación que necesitamos:
                                    licencia, seguro, RTO, cédula verde y datos del vehículo. El equipo de
                                    Moovy te avisa por email cuando tu cuenta queda aprobada.</p>
                                </div>
                            )}

                            {/* Bicycle / non-motorized info */}
                            {formData.vehicleType === "bicicleta" && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                                    <Bike className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800">Bicicleta</p>
                                        <p className="text-xs text-green-700">
                                            No se requiere licencia de conducir, patente ni seguro vehicular.
                                            Se recomienda usar casco, luces y reflectantes.
                                        </p>
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

                {/* Step 3: Confirmation */}
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
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Paso 3: Revisá y aceptá los términos
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <p className="text-sm font-medium text-gray-800">Resumen de tu solicitud:</p>
                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                                    <span className="text-gray-500">Nombre:</span>
                                    <span className="text-gray-800 font-medium">
                                        {fromProfile && isAuthenticated
                                            ? (session?.user?.name || "—")
                                            : `${formData.firstName} ${formData.lastName}`}
                                    </span>
                                    <span className="text-gray-500">DNI:</span>
                                    <span className="text-gray-800 font-medium">{formData.dni || "—"}</span>
                                    <span className="text-gray-500">CUIT:</span>
                                    <span className="text-gray-800 font-medium">{formData.cuit || "—"}</span>
                                    <span className="text-gray-500">Vehículo:</span>
                                    <span className="text-gray-800 font-medium capitalize">
                                        {vehicleMeta?.label || formData.vehicleType || "—"}
                                        {isMotorized && formData.vehicleBrand && ` ${formData.vehicleBrand}`}
                                        {isMotorized && formData.vehicleModel && ` ${formData.vehicleModel}`}
                                        {isMotorized && formData.vehicleYear && ` (${formData.vehicleYear})`}
                                    </span>
                                    {isMotorized && (
                                        <>
                                            <span className="text-gray-500">Color:</span>
                                            <span className="text-gray-800 font-medium">{formData.vehicleColor || "—"}</span>
                                            <span className="text-gray-500">Patente:</span>
                                            <span className="text-gray-800 font-medium uppercase tracking-wider">{formData.licensePlate || "—"}</span>
                                        </>
                                    )}
                                </div>

                                {isMotorized && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-[11px] text-gray-500 mb-1">Vencimientos cargados:</p>
                                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[11px]">
                                            <span className="text-gray-500">Licencia:</span>
                                            <span className="text-gray-700">{formatDateAR(formData.licenciaExpiresAt)}</span>
                                            <span className="text-gray-500">Seguro:</span>
                                            <span className="text-gray-700">{formatDateAR(formData.seguroExpiresAt)}</span>
                                            <span className="text-gray-500">RTO:</span>
                                            <span className="text-gray-700">{formatDateAR(formData.rtoExpiresAt)}</span>
                                            <span className="text-gray-500">Cédula verde:</span>
                                            <span className="text-gray-700">{formatDateAR(formData.cedulaVerdeExpiresAt)}</span>
                                        </div>
                                    </div>
                                )}
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
                                        Pago al instante, sin retenciones
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
                                disabled={isLoading || !formData.acceptTerms || !formData.acceptPrivacy}
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

export default function RepartidorRegistroClient() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>}>
            <RepartidorRegistroContent />
        </Suspense>
    );
}
