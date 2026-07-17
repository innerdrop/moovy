"use client";

// Client Registration Page
import { useState, useEffect, Suspense } from "react";
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
import { formatReferralCode, isValidReferralCode } from "@/lib/referral";

// feat/login-google: logo oficial de Google (multicolor) para el botón.
function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

// feat/login-google (atribución de referidos): cookie de último-toque, lado cliente.
// Sobrevive el viaje a Google (la URL/formulario no). El server la lee al crear la cuenta.
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 días
function writeRefCookie(code: string) {
    if (typeof document === "undefined") return;
    document.cookie = `moovy_ref=${encodeURIComponent(code)}; path=/; max-age=${REF_COOKIE_MAX_AGE}; SameSite=Lax`;
}
function readRefCookie(): string {
    if (typeof document === "undefined") return "";
    const m = document.cookie.match(/(?:^|;\s*)moovy_ref=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
}
function clearRefCookie() {
    if (typeof document === "undefined") return;
    document.cookie = "moovy_ref=; path=/; max-age=0; SameSite=Lax";
}

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
    // feat/login-google: nombre del referidor resuelto (para el cartel "Te invitó X").
    const [referrerName, setReferrerName] = useState<string | null>(null);
    // feat/rediseno-registro: mostrar el input de código a mano (si no vino por link).
    const [showRefEditor, setShowRefEditor] = useState(false);
    // feat/registro-simplificado: una sola tilde legal (Términos + Privacidad + +18).
    // Marketing sigue SEPARADO y opt-in (Ley 26.951).
    const [acceptLegal, setAcceptLegal] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);

    // Captura de ÚLTIMO-TOQUE: el ?ref (acción deliberada más reciente) pisa la
    // cookie. Si no hay ?ref, recuperamos el último código guardado (link previo),
    // así el que hizo click hace días igual queda atribuido.
    useEffect(() => {
        const refParam = searchParams.get("ref");
        if (refParam) {
            const formatted = formatReferralCode(refParam);
            if (formatted) {
                setReferralCode(formatted);
                writeRefCookie(formatted); // último-toque: pisa el anterior
            }
        } else {
            const cookied = readRefCookie();
            if (cookied) setReferralCode(formatReferralCode(cookied));
        }
    }, [searchParams]);

    // Resuelve el código → nombre del referidor para el cartel "Te invitó [Nombre]".
    // Así la persona VE a quién le da los puntos y puede cambiarlo antes de registrarse.
    useEffect(() => {
        if (!isValidReferralCode(referralCode)) {
            setReferrerName(null);
            return;
        }
        let cancelled = false;
        fetch(`/api/referral/resolve?code=${encodeURIComponent(referralCode)}`)
            .then((r) => r.json())
            .then((d) => { if (!cancelled) setReferrerName(d?.valid ? d.name : null); })
            .catch(() => { if (!cancelled) setReferrerName(null); });
        return () => { cancelled = true; };
    }, [referralCode]);

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

    // feat/rediseno-registro: pegar el código completo (ej. "MOV-AB23" o "AB23") en el
    // input único de referido.
    const handleRefPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").trim().toUpperCase().replace(/^MOV-?/, "");
        handleReferralSuffixChange(text);
    };

    // feat/login-google: registro/ingreso de un toque con Google. Antes de irnos a
    // Google guardamos el código en la cookie (la URL/formulario no sobreviven el viaje).
    const handleGoogle = () => {
        if (referralCode && isValidReferralCode(referralCode)) {
            writeRefCookie(referralCode);
        }
        setIsLoading(true);
        signIn("google", { callbackUrl: "/" });
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
                clearRefCookie(); // ya atribuido, no re-usar
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

    const inputCls =
        "w-full h-12 rounded-xl border border-gray-200 pl-11 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-[#e60012] focus:ring-2 focus:ring-red-100 focus:outline-none transition";

    return (
        <div className="flex flex-col items-center justify-start bg-gray-50 px-4 py-8 lg:py-12 min-h-screen lg:bg-white">
            <div className="w-full max-w-md lg:max-w-4xl animate-fadeIn lg:flex lg:items-center lg:gap-16">
                {/* Left side branding (desktop only) */}
                <div className="hidden lg:flex lg:flex-col lg:flex-1">
                    <Image src="/logo-moovy.svg" alt="Moovy" width={150} height={42} className="h-11 w-auto mb-8" priority />
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                        Sumate a Moovy
                    </h2>
                    <p className="text-gray-500 mt-3 text-lg max-w-sm">
                        La app de delivery y marketplace de Ushuaia. Rápido, cercano y con puntos en cada compra.
                    </p>
                    <div className="mt-8 space-y-4">
                        {[
                            { icon: <Gift className="w-5 h-5" />, t: "$2.500 de bienvenida", s: "Al hacer tu primer pedido" },
                            { icon: <Check className="w-5 h-5" />, t: "Puntos en cada compra", s: "Canjealos por descuentos y envíos" },
                            { icon: <User className="w-5 h-5" />, t: "Invitá y ganás más", s: "Puntos por cada amigo que sumás" },
                        ].map((b, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 text-[#e60012] flex items-center justify-center flex-shrink-0">
                                    {b.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{b.t}</p>
                                    <p className="text-gray-500 text-xs">{b.s}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side form */}
                <div className="w-full lg:flex-1 lg:max-w-md">
                <div className="bg-white rounded-3xl shadow-xl lg:shadow-none border border-gray-100 lg:border-0 p-6 sm:p-8 lg:p-0">

                    {/* Logo (mobile) */}
                    <div className="text-center mb-4 lg:hidden">
                        <Image src="/logo-moovy.svg" alt="Moovy" width={116} height={32} className="h-8 w-auto mx-auto" priority />
                    </div>

                    {/* Header */}
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Creá tu cuenta</h1>
                    <p className="text-gray-500 mt-1 mb-5">Delivery y marketplace de Ushuaia</p>

                    {/* Bonus teaser */}
                    <div className="flex items-center gap-2 bg-[#fff4f5] border border-[#ffd9dd] rounded-xl px-3 py-2.5 mb-5">
                        <Gift className="w-4 h-4 text-[#e60012] flex-shrink-0" />
                        <span className="text-sm text-[#a32d2d]">Arrancás con <strong className="font-black">$2.500</strong> de bienvenida</span>
                    </div>

                    {/* Success / Error */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-center gap-3 animate-scaleIn">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="font-bold text-green-800 text-sm">¡Cuenta creada! Iniciando sesión...</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 animate-shake">
                            <p className="text-red-700 font-medium text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={isLoading || success}
                        className="w-full h-12 flex items-center justify-center gap-2.5 bg-white border-[1.5px] border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        <GoogleIcon />
                        Continuá con Google
                    </button>
                    <p className="text-[11px] text-gray-400 text-center mt-2">
                        Al continuar aceptás los{" "}
                        <Link href="/terminos" className="underline hover:text-gray-600" target="_blank">Términos</Link>,{" "}
                        la{" "}
                        <Link href="/privacidad" className="underline hover:text-gray-600" target="_blank">Privacidad</Link>{" "}
                        y confirmás ser +18.
                    </p>

                    <div className="flex items-center gap-3 my-4">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-400">o con tu email</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Nombre y apellido */}
                        <div className="relative">
                            <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nombre y apellido"
                                className={inputCls}
                                required
                                autoFocus
                                autoComplete="name"
                            />
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="hola@ejemplo.com"
                                className={inputCls}
                                required
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    className={`${inputCls} pr-11`}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5 ml-1">8+ caracteres, con mayúscula, minúscula y número</p>
                        </div>

                        {/* Teléfono (opcional) */}
                        <div>
                            <PhoneInput
                                value={phone}
                                onChange={setPhone}
                                error={!!error && error.includes("teléfono")}
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Teléfono (opcional) — para que el repartidor te ubique</p>
                        </div>

                        {/* Referido — feat/rediseno-registro: chip elegante si vino por link,
                            link discreto + input único si lo pone a mano. Sin cajitas PIN. */}
                        <div>
                            {referrerName ? (
                                <div className="flex items-center gap-3 bg-[#f0faf4] border border-[#cdeede] rounded-xl px-3 py-2.5">
                                    <div className="w-9 h-9 rounded-full bg-[#d9f2e4] flex items-center justify-center flex-shrink-0">
                                        <Gift className="w-4 h-4 text-[#0f6e56]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#0f6e56] truncate">Te invitó {referrerName}</p>
                                        <p className="text-xs text-[#3a8b70]">Sumás puntos extra en tu primer pedido</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowRefEditor(true)}
                                        className="text-xs text-gray-500 underline flex-shrink-0"
                                    >
                                        cambiar
                                    </button>
                                </div>
                            ) : !showRefEditor && !referralCode ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRefEditor(true)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
                                >
                                    <Gift className="w-4 h-4 text-gray-400" />
                                    ¿Tenés un código de invitación?
                                </button>
                            ) : null}

                            {(showRefEditor || (referralCode && !referrerName)) && (
                                <div className="mt-2">
                                    <div
                                        className={`flex items-center h-12 rounded-xl border px-3.5 transition ${
                                            referralCodeShowError
                                                ? "border-red-300 bg-red-50/40"
                                                : referralCodeValid
                                                    ? "border-green-400 bg-green-50/40"
                                                    : "border-gray-200 focus-within:border-[#e60012] focus-within:ring-2 focus-within:ring-red-100"
                                        }`}
                                    >
                                        <span className="font-mono font-bold tracking-wider text-gray-400 select-none">MOV-</span>
                                        <input
                                            type="text"
                                            value={referralSuffix}
                                            onChange={(e) => handleReferralSuffixChange(e.target.value)}
                                            onPaste={handleRefPaste}
                                            placeholder="AB23"
                                            maxLength={4}
                                            autoComplete="off"
                                            aria-label="Código de invitación (4 caracteres)"
                                            className="flex-1 ml-1.5 min-w-0 bg-transparent uppercase font-mono font-bold tracking-[0.2em] text-gray-800 placeholder:text-gray-300 placeholder:tracking-normal focus:outline-none"
                                        />
                                        {referralCodeValid && <Check className="w-5 h-5 text-green-600 flex-shrink-0" />}
                                        {referralCodeShowError && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                                    </div>
                                    {referralCodeShowError && (
                                        <p className="text-[11px] text-red-600 mt-1.5 ml-1">Completá los 4 caracteres después de MOV-.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Consentimiento legal (una tilde) + marketing (opt-in separado) */}
                        <div className="space-y-2.5 pt-1">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptLegal}
                                    onChange={(e) => setAcceptLegal(e.target.checked)}
                                    className="mt-0.5 w-5 h-5 rounded accent-[#e60012] flex-shrink-0"
                                />
                                <span className="text-[13px] text-gray-600 leading-snug">
                                    Soy mayor de 18 y acepto los{" "}
                                    <Link href="/terminos" className="text-[#e60012] underline font-medium" target="_blank">Términos y Condiciones</Link>{" "}
                                    y la{" "}
                                    <Link href="/privacidad" className="text-[#e60012] underline font-medium" target="_blank">Política de Privacidad</Link>{" "}
                                    (Ley 25.326). <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={marketingConsent}
                                    onChange={(e) => setMarketingConsent(e.target.checked)}
                                    className="mt-0.5 w-5 h-5 rounded accent-[#e60012] flex-shrink-0"
                                />
                                <span className="text-[13px] text-gray-500 leading-snug">
                                    Quiero recibir ofertas y novedades de MOOVY por email y push (opcional).
                                </span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || success || !acceptLegal}
                            className="w-full h-12 bg-[#e60012] hover:bg-red-700 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                "Crear mi cuenta"
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center mt-5 text-sm text-gray-600">
                        ¿Ya tenés cuenta?{" "}
                        <Link href="/login" className="text-[#e60012] hover:underline font-bold">Iniciá sesión</Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6 mb-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition font-medium">
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
