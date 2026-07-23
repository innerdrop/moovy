"use client";

// Repartidor Registration — feat/rediseno-registro-comercio-repartidor (2026-07):
// Reescrito de un wizard de 3 pasos a UNA sola página. El form real pedía ~5 campos
// (nombre, email, tel, contraseña, tipo de vehículo) — 3 pasos era sobre-estructura,
// y el "paso de confirmación" ya no resumía nada (todo diferido al panel). Ahora:
// argumento de venta arriba (cobrás al instante · vos elegís los horarios · empezás
// con bici/moto/auto), un scroll, nombre unido, sin confirmar contraseña, y una
// sección de DOCUMENTOS OPCIONAL (licencia + cédula + seguro para motorizados; DNI
// para bici) que se puede subir acá o después desde el panel. Conserva endpoints,
// tipos de vehículo y flujo "desde perfil".

import { useState, useEffect, Suspense } from "react";
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
    ArrowLeft,
    CheckCircle2,
    ArrowRight,
    Zap,
    Clock,
    Bike,
    Plus,
} from "lucide-react";
import DocumentUpload from "@/components/ui/DocumentUpload";
import SearchableSelect from "@/components/ui/SearchableSelect";

// Tipos de vehículo (espeja MAX_VEHICLE_AGE del endpoint register/driver).
const VEHICLE_TYPES = [
    { value: "bicicleta", label: "Bicicleta", icon: "🚲", motorized: false },
    { value: "moto", label: "Moto", icon: "🏍️", motorized: true },
    { value: "auto", label: "Auto", icon: "🚗", motorized: true },
    { value: "camioneta", label: "Camioneta", icon: "🚙", motorized: true },
    { value: "pickup", label: "Pickup", icon: "🛻", motorized: true },
    { value: "suv", label: "SUV", icon: "🚙", motorized: true },
    { value: "flete", label: "Flete", icon: "🚚", motorized: true },
] as const;

type VehicleTypeValue = typeof VEHICLE_TYPES[number]["value"];
const VEHICLE_TYPE_OPTIONS: string[] = VEHICLE_TYPES.map((v) => `${v.icon}  ${v.label}`);
function parseVehicleTypeOption(label: string): VehicleTypeValue | "" {
    const match = VEHICLE_TYPES.find((v) => label.includes(v.label));
    return match ? match.value : "";
}
function vehicleTypeToLabel(value: VehicleTypeValue | ""): string {
    if (!value) return "";
    const match = VEHICLE_TYPES.find((v) => v.value === value);
    return match ? `${match.icon}  ${match.label}` : "";
}

function RepartidorRegistroContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, update: updateSession } = useSession();
    const fromProfile = searchParams.get("from") === "profile";
    const isAuthenticated = !!session?.user;
    const isLogged = fromProfile && isAuthenticated;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDocs, setShowDocs] = useState(false);

    // Guard: from=profile pero no autenticado → login
    useEffect(() => {
        if (fromProfile && !isAuthenticated && session !== undefined) {
            router.replace("/login");
        }
    }, [fromProfile, isAuthenticated, session, router]);

    const [formData, setFormData] = useState({
        ownerName: "",
        email: "",
        phone: "",
        password: "",
        vehicleType: "" as VehicleTypeValue | "",
        // Documentos (opcionales en el alta; se pueden subir después en el panel)
        licenciaUrl: "",
        cedulaVerdeUrl: "",
        seguroUrl: "",
        dniFrenteUrl: "",
        hasInsurance: false,
        acceptLegal: false,
    });

    const vehicleMeta = VEHICLE_TYPES.find((v) => v.value === formData.vehicleType) ?? null;
    const isMotorized = vehicleMeta?.motorized ?? false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!isLogged) {
            if (formData.ownerName.trim().length < 2) {
                setError("Ingresá tu nombre y apellido.");
                return;
            }
            if (
                formData.password.length < 8 ||
                !/[a-z]/.test(formData.password) ||
                !/[A-Z]/.test(formData.password) ||
                !/\d/.test(formData.password)
            ) {
                setError("La contraseña necesita al menos 8 caracteres, con una mayúscula, una minúscula y un número.");
                return;
            }
        }
        if (!formData.vehicleType) {
            setError("Elegí tu tipo de vehículo");
            return;
        }
        if (!formData.acceptLegal) {
            setError("Debés aceptar los Términos para Repartidores y la Política de Privacidad");
            return;
        }

        setIsLoading(true);

        const nameParts = formData.ownerName.trim().split(/\s+/);
        const firstName = nameParts[0] || formData.ownerName.trim();
        const lastName = nameParts.slice(1).join(" ");

        const payload: Record<string, any> = {
            firstName,
            lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            vehicleType: formData.vehicleType,
            // Docs opcionales (los que haya subido en el form).
            licenciaUrl: formData.licenciaUrl,
            cedulaVerdeUrl: formData.cedulaVerdeUrl,
            seguroUrl: formData.seguroUrl,
            dniFrenteUrl: formData.dniFrenteUrl,
            acceptTerms: formData.acceptLegal,
            acceptPrivacy: formData.acceptLegal,
        };

        try {
            const endpoint = isLogged ? "/api/auth/activate-driver" : "/api/auth/register/driver";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al registrar");
            if (isLogged) await updateSession();
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const inputCls =
        "w-full h-12 rounded-xl border border-gray-200 pl-11 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none transition";
    const sectionLabel = "text-[11px] font-extrabold tracking-[0.14em] uppercase text-gray-400 mb-3";

    // ── Success ──
    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">¡Solicitud enviada!</h2>
                    <p className="text-gray-500 mb-6">Tu cuenta de repartidor ya está creada. Cargá la documentación que falte en el panel y el equipo de Moovy te habilita en 24-48 horas.</p>
                    <div className="flex flex-col gap-3 items-center">
                        <Link href={isLogged ? "/repartidor/dashboard" : "/repartidor"} className="inline-flex items-center justify-center gap-2 w-full h-12 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition active:scale-95">
                            {isLogged ? "Ir a mi panel" : "Cargar mi documentación"}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href={fromProfile ? "/mi-perfil" : "/proximamente"} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="w-4 h-4" />
                            {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen lg:flex bg-[#e9f7ef]">
            {/* Panel de marca (desktop) — foto de Ushuaia en duotono verde (como la cortina). */}
            <aside className="hidden lg:flex lg:w-[42%] relative overflow-hidden text-white flex-col justify-between p-12 xl:p-16">
                <div className="absolute inset-0" aria-hidden="true">
                    <Image src="/ushuaia-bg.jpg" alt="" fill sizes="42vw" className="object-cover" priority />
                    <div className="absolute inset-0 bg-[#15803d] mix-blend-multiply" />
                    <div className="absolute inset-0 bg-[#0b3d20]/55" />
                </div>
                <Image src="/logo-moovy-white.svg" alt="Moovy" width={132} height={38} className="relative z-10 h-9 w-auto drop-shadow-md" priority />
                <div className="relative z-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-3">para repartidores</p>
                    <h2 className="text-4xl xl:text-5xl font-black leading-[1.1] mb-5 drop-shadow-sm">Repartí con Moovy</h2>
                    <p className="text-white/90 text-lg mb-9 max-w-sm drop-shadow-sm">Cobrás al instante y elegís cuándo trabajar. Empezás con lo que tengas.</p>
                    <ul className="space-y-4 text-[15px] font-medium drop-shadow-sm">
                        <li className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5" /></span>Cobrás al instante, sin retenciones</li>
                        <li className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" /></span>Vos elegís cuándo trabajar</li>
                        <li className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Bike className="w-5 h-5" /></span>Empezá con bici, moto o auto</li>
                    </ul>
                </div>
                <p className="relative z-10 text-white/70 text-sm">Hecho en Ushuaia, para Ushuaia.</p>
            </aside>

            {/* Panel del formulario */}
            <div className="flex-1 flex flex-col lg:items-center lg:justify-center lg:px-4 lg:py-12">
              {/* Banner de marca (mobile) — foto de Ushuaia en duotono verde */}
              <div className="lg:hidden relative overflow-hidden text-white px-6 pt-9 pb-7">
                  <div className="absolute inset-0" aria-hidden="true">
                      <Image src="/ushuaia-bg.jpg" alt="" fill sizes="100vw" className="object-cover" priority />
                      <div className="absolute inset-0 bg-[#15803d] mix-blend-multiply" />
                      <div className="absolute inset-0 bg-[#0b3d20]/55" />
                  </div>
                  <div className="relative z-10">
                      <Image src="/logo-moovy-white.svg" alt="Moovy" width={116} height={32} className="h-8 w-auto drop-shadow-md" priority />
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mt-3">para repartidores</p>
                      <h2 className="text-2xl font-black leading-tight mt-1 mb-4 drop-shadow-sm">Repartí con Moovy</h2>
                      <ul className="space-y-2.5 text-[13px] font-medium drop-shadow-sm">
                          <li className="flex items-center gap-2.5"><Zap className="w-4 h-4 flex-shrink-0" />Cobrás al instante, sin retenciones</li>
                          <li className="flex items-center gap-2.5"><Clock className="w-4 h-4 flex-shrink-0" />Vos elegís cuándo trabajar</li>
                          <li className="flex items-center gap-2.5"><Bike className="w-4 h-4 flex-shrink-0" />Empezá con bici, moto o auto</li>
                      </ul>
                  </div>
              </div>
              <div className="w-full max-w-md px-4 py-6 lg:p-0 flex flex-col gap-4">
                <div className="bg-white rounded-3xl shadow-xl shadow-green-900/5 border border-gray-100 p-6">
                    {isLogged && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800">
                            <span className="font-bold">{session?.user?.name}</span>, completá tus datos para registrarte como repartidor.
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Tus datos */}
                        {!isLogged && (
                            <>
                                <p className={sectionLabel}>Tus datos</p>
                                <div className="relative">
                                    <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input type="text" name="ownerName" value={formData.ownerName} onChange={(e) => setFormData((p) => ({ ...p, ownerName: e.target.value }))} placeholder="Nombre y apellido" className={inputCls} required autoComplete="name" />
                                </div>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input type="email" name="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className={inputCls} required autoComplete="email" />
                                </div>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="+549 2901 ..." className={inputCls} required />
                                </div>
                                <div>
                                    <div className="relative">
                                        <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} placeholder="Contraseña" className={`${inputCls} pr-11`} required minLength={8} autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1} aria-label={showPassword ? "Ocultar" : "Mostrar"}>
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1.5 ml-1">8+ caracteres, con mayúscula, minúscula y número</p>
                                </div>
                                <div className="h-px bg-gray-100 my-1" />
                            </>
                        )}

                        {/* Tu vehículo */}
                        <p className={sectionLabel}>Tu vehículo</p>
                        <SearchableSelect
                            required
                            icon={Car}
                            placeholder="Elegí tu vehículo"
                            options={VEHICLE_TYPE_OPTIONS}
                            value={vehicleTypeToLabel(formData.vehicleType)}
                            onChange={(label) => {
                                const v = parseVehicleTypeOption(label);
                                setFormData((prev) => ({ ...prev, vehicleType: v }));
                            }}
                            searchPlaceholder="Buscar tipo..."
                        />

                        {/* Documentos (opcional) — plegable, según vehículo */}
                        {formData.vehicleType && (
                            <>
                                <div className="h-px bg-gray-100 my-1" />
                                {!showDocs ? (
                                    <button type="button" onClick={() => setShowDocs(true)} className="flex items-center justify-between w-full h-10 border border-dashed border-gray-300 rounded-xl px-3.5 text-sm text-gray-500 hover:bg-gray-50 transition">
                                        <span>Subir documentos ahora <span className="text-gray-400">(opcional)</span></span>
                                        <Plus className="w-4 h-4 text-green-600" />
                                    </button>
                                ) : isMotorized ? (
                                    <div className="space-y-3">
                                        <p className={sectionLabel}>Documentos (opcional)</p>
                                        <div>
                                            <p className="text-[13px] font-medium text-gray-700 mb-1.5">Licencia de conducir</p>
                                            <DocumentUpload value={formData.licenciaUrl} onChange={(url) => setFormData((p) => ({ ...p, licenciaUrl: url }))} placeholder="Subí tu licencia" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-medium text-gray-700 mb-1.5">Cédula del vehículo</p>
                                            <DocumentUpload value={formData.cedulaVerdeUrl} onChange={(url) => setFormData((p) => ({ ...p, cedulaVerdeUrl: url }))} placeholder="Subí la cédula" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-medium text-gray-700 mb-1.5">Seguro del vehículo</p>
                                            <DocumentUpload value={formData.seguroUrl} onChange={(url) => setFormData((p) => ({ ...p, seguroUrl: url }))} placeholder="Subí el seguro" />
                                        </div>
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input type="checkbox" checked={formData.hasInsurance} onChange={(e) => setFormData((p) => ({ ...p, hasInsurance: e.target.checked }))} className="mt-0.5 w-5 h-5 rounded accent-green-600 flex-shrink-0" />
                                            <span className="text-[12px] text-gray-600 leading-snug">Declaro que tengo un seguro vigente para el vehículo con el que voy a repartir.</span>
                                        </label>
                                        <p className="text-[11px] text-gray-400 ml-1">Si no los tenés a mano, los cargás después desde tu panel.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className={sectionLabel}>Identidad (opcional)</p>
                                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2">
                                            <Bike className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-green-700">En bici no necesitás licencia ni seguro. Subí tu DNI para verificar tu identidad (o cargalo después en el panel).</p>
                                        </div>
                                        <DocumentUpload value={formData.dniFrenteUrl} onChange={(url) => setFormData((p) => ({ ...p, dniFrenteUrl: url }))} placeholder="Subí tu DNI (frente)" />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Legal */}
                        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                            <input type="checkbox" checked={formData.acceptLegal} onChange={(e) => setFormData((p) => ({ ...p, acceptLegal: e.target.checked }))} className="mt-0.5 w-5 h-5 rounded accent-green-600 flex-shrink-0" />
                            <span className="text-[13px] text-gray-600 leading-snug">
                                Acepto los <Link href="/terminos-repartidor" className="text-green-600 underline font-medium" target="_blank">Términos para Repartidores</Link> y la <Link href="/privacidad" className="text-green-600 underline font-medium" target="_blank">Política de Privacidad</Link> (Ley 25.326). <span className="text-red-500">*</span>
                            </span>
                        </label>

                        <button type="submit" disabled={isLoading || !formData.acceptLegal} className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 transition disabled:opacity-50 mt-1">
                            {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>) : (<><Car className="w-5 h-5" />Enviar solicitud</>)}
                        </button>

                        <p className="text-[11px] text-gray-400 text-center leading-relaxed">Te creamos la cuenta al toque. Cargás la documentación en el panel y te habilitamos.</p>
                    </form>

                    {!isLogged && (
                        <p className="mt-5 text-center text-sm text-gray-600">
                            ¿Ya tenés cuenta? <Link href="/repartidor/login" className="text-green-600 font-bold hover:underline">Iniciá sesión</Link>
                        </p>
                    )}
                </div>

                <div className="text-center pb-4">
                    <Link href={fromProfile ? "/mi-perfil" : "/proximamente"} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                    </Link>
                </div>
              </div>
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
