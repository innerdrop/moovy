"use client";

// Client Registration Page
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Check,
    ArrowLeft,
    Gift,
    AlertCircle,
} from "lucide-react";
import PhoneInput from "@/components/ui/forms/PhoneInput";
import InfoTooltip from "@/components/ui/forms/InfoTooltip";
import { formatReferralCode, isValidReferralCode } from "@/lib/referral";

function RegistrationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form Fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [referralCode, setReferralCode] = useState("");
    // feat/registro-simplificado: una sola tilde legal (Términos + Privacidad + +18).
    // Marketing sigue SEPARADO y opt-in (Ley 26.951).
    const [acceptLegal, setAcceptLegal] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);

    useEffect(() => {
        const refParam = searchParams.get("ref");
        if (refParam) {
            // Pasamos el ref por el formateador igual que cualquier input del
            // usuario — si vino con formato raro lo normaliza, si no es
            // matcheable lo deja vacío.
            setReferralCode(formatReferralCode(refParam));
        }
    }, [searchParams]);

    // Rama fix/referral-code-formato-forzado (2026-05-17):
    // Estados derivados del campo de código para feedback inline.
    // - isEmpty: el usuario no escribió nada todavía (estado neutro).
    // - isComplete: ya tiene los 8 caracteres del formato canónico.
    // - isValid: matchea exacto la regex. Solo true cuando isComplete.
    // - isPartialOrInvalid: tiene contenido pero todavía no es válido.
    //   En este caso mostramos el borde rojo + mensaje.
    const referralCodeEmpty = referralCode.length === 0;
    const referralCodeValid = isValidReferralCode(referralCode);
    const referralCodeShowError = !referralCodeEmpty && !referralCodeValid;

    // Fix s2-2a-00: el prefijo "MOV-" queda FIJO; el usuario solo escribe los 4
    // caracteres siguientes. referralCode sigue siendo el codigo COMPLETO (o ""
    // si no hay). Editamos/mostramos solo el sufijo.
    const referralSuffix = referralCode.replace(/^MOV-/, "");
    const handleReferralSuffixChange = (raw: string) => {
        const cleaned = raw
            .toUpperCase()
            .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
            .slice(0, 4);
        setReferralCode(cleaned ? `MOV-${cleaned}` : "");
    };

    // feat/referido-pin-y-pedido-prefijo: 4 casillas tipo PIN para el sufijo (los 4
    // caracteres tras "MOV-"). La fuente de verdad sigue siendo referralCode; cada
    // casilla mapea a un caracter del sufijo. Elimina el bug de encimado del prefijo.
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handlePinChange = (index: number, raw: string) => {
        const ch = raw
            .toUpperCase()
            .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
            .slice(-1);
        const arr = [0, 1, 2, 3].map((k) => referralSuffix[k] || "");
        arr[index] = ch;
        const next = arr.join(""); // izquierda-empaquetado (sin huecos)
        handleReferralSuffixChange(next);
        // Foco a la próxima casilla vacía (según el largo real).
        if (ch) pinRefs.current[Math.min(next.length, 3)]?.focus();
    };

    const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !referralSuffix[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowLeft" && index > 0) {
            pinRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    // Pegar el código completo (ej. "MOV-AB23" o "AB23") llena las 4 casillas.
    const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData
            .getData("text")
            .trim()
            .toUpperCase()
            .replace(/^MOV-?/, "");
        handleReferralSuffixChange(text);
        const len = Math.min(
            text.replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "").length,
            4,
        );
        setTimeout(() => pinRefs.current[Math.min(len, 3)]?.focus(), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (fullName.trim().length < 2) {
            setError("Ingresá tu nombre y apellido.");
            return;
        }

        // Fuerza de contraseña (espejo del backend: 8+ con mayúscula, minúscula y número).
        if (
            password.length < 8 ||
            !/[a-z]/.test(password) ||
            !/[A-Z]/.test(password) ||
            !/\d/.test(password)
        ) {
            setError("La contraseña necesita al menos 8 caracteres, con una mayúscula, una minúscula y un número.");
            return;
        }

        if (!acceptLegal) {
            setError("Para continuar tenés que aceptar los Términos, la Política de Privacidad y confirmar que sos mayor de 18 años.");
            return;
        }

        // Rama fix/referral-code-formato-forzado (2026-05-17):
        // Validar formato del código de referido antes de mandarlo al server.
        // El campo es opcional — vacío está permitido. Solo bloqueamos si el
        // usuario escribió algo pero no completó el formato MOV-XXXX.
        if (referralCode.length > 0 && !isValidReferralCode(referralCode)) {
            setError(
                "El código de referido tiene formato inválido. Debe ser MOV-XXXX (ej. MOV-AB23). Si no tenés código, dejá el campo vacío.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: fullName.trim(),
                    email,
                    phone,
                    password,
                    referralCode: referralCode.trim() || undefined,
                    acceptTerms: true,
                    acceptPrivacy: true,
                    age18Confirmed: true,
                    marketingConsent,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                // Auto-login and redirect to store
                const signInResult = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });
                if (signInResult?.ok) {
                    router.push("/");
                } else {
                    router.push("/login?registered=true");
                }
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
        <div className="flex flex-col items-center justify-start bg-gray-50 px-4 py-8 lg:py-12 min-h-screen lg:bg-white">
            <div className="w-full max-w-lg lg:max-w-2xl animate-fadeIn lg:flex lg:items-center lg:gap-12">
                {/* Left side branding (desktop only) */}
                <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:flex-1">
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#e60012] to-[#ff1a2e] flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-white text-4xl font-bold">M</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Bienvenido a MOOVY</h2>
                        <p className="text-gray-600 max-w-xs">La forma más rápida y confiable de recibir lo que necesitas en Ushuaia</p>
                    </div>
                </div>

                {/* Right side form wrapper */}
                <div className="w-full lg:flex-1">
                {/* Header */}
                <div className="text-center mb-8 lg:text-left">
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
                            <p className="text-green-700">Iniciando sesión...</p>
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
                <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-none border border-gray-100 p-6 sm:p-8 lg:p-0">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Nombre y apellido (un solo campo) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nombre y apellido
                                <InfoTooltip text="Tu nombre completo como figura en tu DNI." />
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <User className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Ej. Juan Pérez"
                                    className="input input-with-icon"
                                    required
                                    autoFocus
                                    autoComplete="name"
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
                                <InfoTooltip text="Opcional, para que el repartidor te contacte." />
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
                                <InfoTooltip text="Al menos 8 caracteres, con una mayúscula, una minúscula y un número." />
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
                                    minLength={8}
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
                            <p className="text-xs text-gray-500 mt-2 ml-1">
                                8+ caracteres, con una mayúscula, una minúscula y un número.
                            </p>
                        </div>

                        <hr className="border-gray-100 my-4" />

                        {/* Referral Code (Optional)
                            feat/referido-pin-y-pedido-prefijo (2026-07-15):
                            - Prefijo "MOV-" FIJO como etiqueta (evoca MOOVER) + 4
                              casillas tipo PIN para el sufijo. Reemplaza el input
                              anterior con prefijo superpuesto (que se encimaba en
                              prod porque el prefijo era más ancho que el padding).
                            - referralCode sigue siendo la fuente de verdad; cada
                              casilla mapea a un char del sufijo. Auto-avance entre
                              casillas + soporte de pegar el código completo.
                            - Feedback visual inline: verde + check cuando está
                              completo y válido, rojo + alerta si tiene contenido
                              pero todavía no es válido, neutro si está vacío. */}
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Gift className="w-4 h-4 text-blue-500" />
                                ¿Tenés un código de referido?
                                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">Opcional</span>
                            </label>
                            {/* feat/referido-pin-y-pedido-prefijo: prefijo "MOV-" FIJO como
                                etiqueta + 4 casillas tipo PIN. Sin superposición posible.
                                Auto-avance entre casillas y soporte de pegar el código completo. */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold tracking-wider text-gray-500 select-none text-lg">
                                    MOV-
                                </span>
                                <div className="flex items-center gap-2">
                                    {[0, 1, 2, 3].map((i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { pinRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="text"
                                            value={referralSuffix[i] || ""}
                                            onChange={(e) => handlePinChange(i, e.target.value)}
                                            onKeyDown={(e) => handlePinKeyDown(i, e)}
                                            onPaste={handlePinPaste}
                                            maxLength={1}
                                            aria-label={`Carácter ${i + 1} del código de referido`}
                                            aria-invalid={referralCodeShowError}
                                            autoComplete="off"
                                            className={`w-11 h-12 text-center text-lg font-mono font-bold uppercase rounded-xl border-2 focus:outline-none focus:ring-2 transition ${
                                                referralCodeShowError
                                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30"
                                                    : referralCodeValid
                                                        ? "border-green-400 focus:border-green-500 focus:ring-green-200 bg-green-50/30"
                                                        : "border-blue-200 focus:border-blue-500 focus:ring-blue-200 bg-white"
                                            }`}
                                        />
                                    ))}
                                </div>
                                {referralCodeValid && (
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                )}
                                {referralCodeShowError && (
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                )}
                            </div>
                            {referralCodeShowError ? (
                                <p className="text-xs text-red-600 mt-2 text-center font-medium">
                                    Completá los 4 caracteres después de MOV-
                                </p>
                            ) : referralCodeValid ? (
                                <p className="text-xs text-green-700 mt-2 text-center font-medium">
                                    ✓ Código válido — ¡Vas a sumar puntos extra al hacer tu primer pedido!
                                </p>
                            ) : (
                                <p className="text-xs text-blue-600 mt-2 text-center font-medium">
                                    Escribí los 4 caracteres después de MOV-. ¡Sumás puntos si te invita un amigo! 🎁
                                </p>
                            )}
                        </div>

                        {/* Legal Consent — feat/registro-simplificado: una sola tilde
                            obligatoria (Términos + Privacidad + +18). Marketing SEPARADO
                            y opt-in (Ley 26.951). */}
                        <div className="space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptLegal}
                                    onChange={(e) => setAcceptLegal(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#e60012] focus:ring-[#e60012]"
                                />
                                <span className="text-sm text-gray-600">
                                    Soy mayor de 18 años y acepto los{" "}
                                    <Link href="/terminos" className="text-[#e60012] underline font-medium" target="_blank">
                                        Términos y Condiciones
                                    </Link>{" "}
                                    y la{" "}
                                    <Link href="/privacidad" className="text-[#e60012] underline font-medium" target="_blank">
                                        Política de Privacidad
                                    </Link>{" "}
                                    (Ley 25.326). <span className="text-red-500">*</span>
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={marketingConsent}
                                    onChange={(e) => setMarketingConsent(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#e60012] focus:ring-[#e60012]"
                                />
                                <span className="text-sm text-gray-600">
                                    Quiero recibir ofertas, novedades y beneficios de MOOVY por email y notificaciones push.
                                    Puedo revocar este consentimiento cuando quiera desde mi perfil.
                                </span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || success || !acceptLegal}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg mt-4 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-shadow"
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
                <div className="text-center mt-8 mb-4 lg:text-left">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a la tienda
                    </Link>
                </div>
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
