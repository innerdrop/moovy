"use client";

// Seller Onboarding - Wizard de registro para vendedores marketplace
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
    ShoppingBag,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Sparkles,
    User,
    CreditCard,
    Tag,
    Rocket
} from "lucide-react";

function SellerRegistroContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, update: updateSession } = useSession();
    const fromProfile = searchParams.get("from") === "profile";
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Guard: if user already has SELLER role, redirect to seller panel
    useEffect(() => {
        const roles = (session?.user as any)?.roles || [];
        if (roles.includes("SELLER")) {
            router.replace("/vendedor/dashboard");
        }
    }, [session, router]);

    const [formData, setFormData] = useState({
        // Paso 1: Datos fiscales
        cuit: "",
        acceptTerms: false,
        acceptPrivacy: false,
        // Paso 2: Perfil vendedor
        displayName: "",
        bio: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validar CUIT formato
        const cuitDigits = formData.cuit.replace(/\D/g, "");
        if (cuitDigits.length !== 11) {
            setError("El CUIT debe tener 11 dígitos");
            return;
        }

        if (!formData.acceptTerms || !formData.acceptPrivacy) {
            setError("Debés aceptar los Términos para Vendedores y la Política de Privacidad");
            return;
        }

        // NO hacemos API call aquí. Solo validamos client-side y avanzamos a Step 2.
        // La SellerProfile se crea en Step 2 cuando ya tenemos displayName y bio.
        setStep(2);
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.displayName.trim()) {
            setError("Debés ingresar un nombre público");
            return;
        }

        setIsLoading(true);

        try {
            // Ahora activamos el vendedor con TODOS los datos: CUIT + displayName + bio + términos
            // La SellerProfile se crea con toda la información de una sola vez
            const res = await fetch("/api/auth/activate-seller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cuit: formData.cuit,
                    displayName: formData.displayName,
                    bio: formData.bio,
                    acceptedTerms: true,
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    // Ya es vendedor — refrescar sesión y redirigir al panel
                    await updateSession();
                    router.replace("/vendedor/dashboard");
                    return;
                }
                throw new Error(data.error || "Error al activar vendedor");
            }

            // Refrescar JWT para que incluya el nuevo rol SELLER
            await updateSession();

            setStep(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8 px-4">
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
                {step < 3 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                {s < 2 && <div className={`w-12 h-1 rounded ${step > s ? "bg-amber-600" : "bg-gray-200"}`} />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Success Step */}
                {step === 3 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Rocket className="w-10 h-10 text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Tu tienda está lista!</h2>
                        <p className="text-gray-500 mb-6">
                            Ya podés empezar a publicar productos y vender en MOOVY.
                            Configurá tu disponibilidad y creá tu primer listing.
                        </p>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-amber-50 rounded-lg p-3 text-center">
                                <Tag className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Publicá productos</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 text-center">
                                <ShoppingBag className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Recibí pedidos</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 text-center">
                                <Sparkles className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Crecé con MOOVY</p>
                            </div>
                        </div>

                        <Link
                            href="/vendedor"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition mb-3"
                        >
                            <Rocket className="w-5 h-5" />
                            Ir al Panel de Vendedor
                        </Link>

                        <Link
                            href={fromProfile ? "/mi-perfil" : "/"}
                            className="inline-flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                        </Link>
                    </div>
                )}

                {/* Step 1: Datos Fiscales + Términos */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Quiero ser Vendedor</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 1: Datos fiscales y aceptación de términos</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep1Submit} className="space-y-4">
                            {/* CUIT */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CUIT <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="cuit"
                                        value={formData.cuit}
                                        onChange={handleCuitChange}
                                        placeholder="XX-XXXXXXXX-X"
                                        maxLength={13}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    Si realizás ventas habituales, necesitás estar inscripto en AFIP (Monotributo o Responsable Inscripto).
                                </p>
                            </div>

                            {/* Info comisiones */}
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                    <span className="font-semibold text-amber-900">Comisiones</span>
                                </div>
                                <p className="text-sm text-amber-700">
                                    MOOVY cobra una comisión por cada venta realizada a través de la plataforma.
                                    Consultá los detalles en los{" "}
                                    <Link href="/terminos-vendedor" className="underline font-medium" target="_blank">
                                        Términos para Vendedores
                                    </Link>.
                                </p>
                            </div>

                            {/* Checkboxes legales */}
                            <div className="space-y-3 border-t pt-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onChange={handleChange}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Acepto los{" "}
                                        <Link href="/terminos-vendedor" className="text-amber-600 underline font-medium" target="_blank">
                                            Términos y Condiciones para Vendedores
                                        </Link>{" "}
                                        y los{" "}
                                        <Link href="/terminos" className="text-amber-600 underline font-medium" target="_blank">
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
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Acepto la{" "}
                                        <Link href="/privacidad" className="text-amber-600 underline font-medium" target="_blank">
                                            Política de Privacidad
                                        </Link>{" "}
                                        y el tratamiento de mis datos personales conforme la Ley 25.326. <span className="text-red-500">*</span>
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !formData.acceptTerms || !formData.acceptPrivacy}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Activando...
                                    </>
                                ) : (
                                    "Continuar"
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Perfil Vendedor */}
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Tu Perfil de Vendedor</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Paso 2: ¿Cómo te verán los compradores?</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep2Submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre público <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        placeholder="Ej: Tienda de Juan, Artesanías Ushuaia..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    Este nombre será visible para los compradores en tus publicaciones.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción corta
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Contá brevemente qué vendés, qué te hace especial..."
                                    rows={3}
                                    maxLength={300}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    {formData.bio.length}/300 caracteres. Podés editarlo después desde la configuración.
                                </p>
                            </div>

                            {/* Tips */}
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                    <span className="font-semibold text-amber-900">Consejos para vender más</span>
                                </div>
                                <ul className="text-sm text-amber-700 space-y-1">
                                    <li>• Elegí un nombre claro y memorable</li>
                                    <li>• Describí qué tipo de productos ofrecés</li>
                                    <li>• Subí fotos de calidad en tus publicaciones</li>
                                    <li>• Respondé rápido a los pedidos</li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-5 h-5" />
                                        Crear mi Tienda
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

export default function SellerRegistroPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60012]"></div>
            </div>
        }>
            <SellerRegistroContent />
        </Suspense>
    );
}
