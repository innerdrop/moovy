"use client";

// Comercio Registration — feat/rediseno-registro-comercio-repartidor (2026-07):
// Diseño editorial premium (aprobado por el founder): fondo crema, hairline rojo
// arriba, header con "REGISTRO · 5 MIN" (sin pill cliché), titular grande con el
// punto en rojo, beneficios como filas tipográficas (0% / Al instante / 10%), y el
// formulario en una tarjeta blanca con la ilustración 3D asomando. El grueso
// (docs/fiscal) sigue diferido al panel. Conserva endpoints, validación CUIT/CBU,
// autocompletado de dirección y flujo "desde perfil".

import { useState, useEffect, useRef, Suspense } from "react";
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
    Building2,
    ArrowLeft,
    CheckCircle2,
    Clock,
    ChevronDown,
    Plus,
    ShieldCheck,
    MapPin,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import { toast } from "@/store/toast";
import { detectBankAccountType, validateBankAccount } from "@/lib/bank-account";

const RED = "#e60012";

const BUSINESS_TYPES = [
    "Restaurante", "Pizzería", "Hamburguesería", "Parrilla", "Cafetería", "Heladería",
    "Panadería/Pastelería", "Sushi", "Comida Saludable", "Rotisería", "Bebidas",
    "Vinoteca/Licorería", "Supermercado/Almacén", "Kiosco", "Dietética/Naturista",
    "Farmacia", "Veterinaria/Pet Shop", "Óptica", "Perfumería/Cosmética", "Ferretería",
    "Mueblería/Decoración", "Lavandería/Tintorería", "Librería/Papelería",
    "Electrónica/Celulares", "Regalería/Cotillón", "Floristería", "Juguetería",
    "Indumentaria", "Otro",
];

// Marcador de sección numerado (editorial): "01 — TU NEGOCIO"
function SectionMarker({ n, children }: { n: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-3 mt-1">
            <span className="text-[11px] font-black tracking-[0.16em]" style={{ color: RED }}>{n}</span>
            <span className="text-[11px] font-extrabold tracking-[0.16em] uppercase text-gray-400">— {children}</span>
        </div>
    );
}

function ComercioRegistroContent() {
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
    const [showBilling, setShowBilling] = useState(false);
    const errorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (error) {
            toast.error(error);
            errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [error]);

    const [formData, setFormData] = useState({
        businessName: "",
        ownerName: "",
        businessType: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        latitude: null as number | null,
        longitude: null as number | null,
        cuit: "",
        cbu: "",
        acceptedLegal: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const formatCuit = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
    };
    const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, cuit: formatCuit(e.target.value) }));
    };
    const bankAccountType = detectBankAccountType(formData.cbu);

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
        if (formData.cuit && formData.cuit.replace(/\D/g, "").length > 0 && formData.cuit.replace(/\D/g, "").length < 11) {
            setError("El CUIT debe tener 11 dígitos");
            return;
        }
        let normalizedCbu: string | null = null;
        if (formData.cbu && formData.cbu.trim().length > 0) {
            const bankCheck = validateBankAccount(formData.cbu);
            if (!bankCheck.valid) {
                setError(bankCheck.error || "El CBU o Alias bancario es inválido");
                return;
            }
            normalizedCbu = bankCheck.normalized;
        }
        if (!formData.acceptedLegal) {
            setError("Debés aceptar los Términos para Comercios y la Política de Privacidad");
            return;
        }

        setIsLoading(true);

        const nameParts = formData.ownerName.trim().split(/\s+/);
        const firstName = nameParts[0] || formData.ownerName.trim();
        const lastName = nameParts.slice(1).join(" ");
        const phoneWithPrefix = formData.phone
            ? (formData.phone.startsWith("+549") ? formData.phone : `+549${formData.phone.replace(/^\+?54?9?/, "")}`)
            : "";

        const submissionData = {
            businessName: formData.businessName,
            firstName,
            lastName,
            businessType: formData.businessType,
            email: formData.email,
            phone: phoneWithPrefix,
            businessPhone: phoneWithPrefix,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude,
            password: formData.password,
            cuit: formData.cuit,
            cbu: normalizedCbu ?? "",
            acceptedTerms: formData.acceptedLegal,
            acceptedPrivacy: formData.acceptedLegal,
        };

        try {
            const endpoint = isLogged ? "/api/auth/activate-merchant" : "/api/auth/register/merchant";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al registrar");
            if (isLogged) await updateSession({ refreshRoles: true });
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const inputCls =
        "w-full h-12 rounded-xl border border-gray-200 pl-11 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-[#e60012] focus:ring-2 focus:ring-red-100 focus:outline-none transition";

    // ── Success ──
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#f6f5f2] flex items-start justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">¡Solicitud enviada!</h2>
                    <p className="text-gray-500 mb-6">Recibimos tu solicitud. El equipo de Moovy la revisa y te contacta en 24-48 horas.</p>
                    <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-center gap-3 text-left">
                        <Clock className="w-5 h-5 text-[#e60012] flex-shrink-0" />
                        <p className="text-sm text-[#a32d2d]">Te enviamos un email con los próximos pasos para activar tu tienda.</p>
                    </div>
                    <Link href={fromProfile ? "/mi-perfil" : "/proximamente"} className="inline-flex items-center gap-2 text-[#e60012] font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" />
                        {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f5f2]">
            {/* Hairline rojo de marca en el borde superior */}
            <div className="h-1 w-full" style={{ backgroundColor: RED }} />

            <div className="max-w-lg mx-auto px-6">
                {/* Header: logo + meta (sin pill) */}
                <header className="flex items-center justify-between py-5 border-b border-gray-200/80">
                    <Image src="/logo-moovy.svg" alt="Moovy" width={120} height={34} className="h-7 w-auto" priority />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Registro · 5 min</span>
                </header>

                {/* Titular editorial con el punto en rojo */}
                <h1 className="text-[40px] sm:text-5xl font-black text-gray-900 leading-[1.02] tracking-tight mt-8 [text-wrap:balance]">
                    Tu comercio, abierto a toda Ushuaia<span style={{ color: RED }}>.</span>
                </h1>
                <p className="text-gray-500 text-[15px] leading-relaxed mt-4 max-w-md">
                    Registrate en cinco minutos y empezá a vender a todo Ushuaia.
                </p>

                {isLogged && (
                    <div className="mt-5 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-[#a32d2d]">
                        <span className="font-bold">{session?.user?.name}</span>, completá los datos de tu negocio para sumarlo.
                    </div>
                )}

                {/* Propuesta de valor: bloque editorial con barra roja (tipo cita) */}
                <div className="mt-9 border-l-[3px] pl-5" style={{ borderColor: RED }}>
                    <p className="text-[22px] sm:text-2xl font-black text-gray-900 leading-[1.34] [text-wrap:balance]">
                        Primer mes <span style={{ color: RED }}>sin comisión</span>. Cobrás al instante, cada venta. Después, <span style={{ color: RED }}>desde 10%</span> — de las más bajas del mercado.
                    </p>
                </div>

                {error && (
                    <div ref={errorRef} className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">{error}</div>
                )}

                {/* Formulario en tarjeta blanca */}
                <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-900/[0.06] border border-gray-100 mt-8 mb-8 p-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">{isLogged ? "Datos de tu comercio" : "Creá tu cuenta"}</h2>
                        <p className="text-[13px] text-gray-400 mt-0.5">Sin costo de alta ni permanencia · activamos tu tienda en 24–48 hs.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                        <SectionMarker n="01">Tu negocio</SectionMarker>
                        <div className="relative">
                            <Store className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Nombre del comercio" className={inputCls} required />
                        </div>
                        {!isLogged && (
                            <div className="relative">
                                <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Nombre y apellido" className={inputCls} required autoComplete="name" />
                            </div>
                        )}
                        <div className="relative">
                            <Building2 className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select name="businessType" value={formData.businessType} onChange={handleChange} className={`${inputCls} pr-10 appearance-none bg-white`} required>
                                <option value="">Rubro del negocio</option>
                                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="h-px bg-gray-100 my-1" />

                        <SectionMarker n="02">Contacto y acceso</SectionMarker>
                        {!isLogged && (
                            <div className="relative">
                                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={inputCls} required autoComplete="email" />
                            </div>
                        )}
                        <div className="relative">
                            <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+549 2901 ..." className={inputCls} required />
                        </div>
                        <div>
                            <AddressAutocomplete
                                value={formData.address}
                                onChange={(address, lat, lng, street, num) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        address: num ? `${street} ${num}` : address,
                                        latitude: lat ?? prev.latitude,
                                        longitude: lng ?? prev.longitude,
                                    }));
                                }}
                                placeholder="Dirección del negocio"
                                required
                            />
                        </div>
                        {!isLogged && (
                            <div>
                                <div className="relative">
                                    <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Contraseña" className={`${inputCls} pr-11`} required minLength={8} autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1} aria-label={showPassword ? "Ocultar" : "Mostrar"}>
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5 ml-1">8+ caracteres, con mayúscula, minúscula y número</p>
                            </div>
                        )}

                        <div className="h-px bg-gray-100 my-1" />

                        <SectionMarker n="03">Facturación <span className="text-gray-300 normal-case tracking-normal font-semibold">· opcional</span></SectionMarker>

                        {!showBilling ? (
                            <button type="button" onClick={() => setShowBilling(true)} className="flex items-center justify-between w-full h-10 border border-dashed border-gray-300 rounded-xl px-3.5 text-sm text-gray-500 hover:bg-gray-50 transition">
                                <span>Agregar CUIT y CBU</span>
                                <Plus className="w-4 h-4" style={{ color: RED }} />
                            </button>
                        ) : (
                            <div className="space-y-2.5">
                                <input type="text" name="cuit" value={formData.cuit} onChange={handleCuitChange} placeholder="CUIT (opcional)" className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-[#e60012] focus:ring-2 focus:ring-red-100 focus:outline-none transition" inputMode="numeric" />
                                <div>
                                    <input type="text" name="cbu" value={formData.cbu} onChange={handleChange} placeholder="CBU o alias (opcional)" className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-[#e60012] focus:ring-2 focus:ring-red-100 focus:outline-none transition" />
                                    {bankAccountType && <p className="text-[11px] text-gray-400 mt-1 ml-1">Detectado: {bankAccountType}</p>}
                                </div>
                                <p className="text-[11px] text-gray-400 ml-1">CUIT y CBU los podés cargar ahora o después desde tu panel.</p>
                            </div>
                        )}

                        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                            <input type="checkbox" checked={formData.acceptedLegal} onChange={(e) => setFormData((prev) => ({ ...prev, acceptedLegal: e.target.checked }))} className="mt-0.5 w-5 h-5 rounded accent-[#e60012] flex-shrink-0" />
                            <span className="text-[13px] text-gray-600 leading-snug">
                                Acepto los <Link href="/terminos-comercio" className="text-[#e60012] underline font-medium" target="_blank">Términos para Comercios</Link> y la <Link href="/privacidad" className="text-[#e60012] underline font-medium" target="_blank">Política de Privacidad</Link> (Ley 25.326). <span className="text-red-500">*</span>
                            </span>
                        </label>

                        {/* Anclaje de confianza (¿quién está detrás? + plata segura) */}
                        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pt-1 text-[11px] text-gray-400">
                            <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" style={{ color: RED }} /> Cobrás por MercadoPago</span>
                            <span className="text-gray-300">·</span>
                            <span>Datos protegidos (Ley 25.326)</span>
                            <span className="text-gray-300">·</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" style={{ color: RED }} /> Hecha en Ushuaia</span>
                        </div>

                        <button type="submit" disabled={isLoading || !formData.acceptedLegal} className="w-full h-12 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 transition disabled:opacity-50 mt-1 hover:brightness-95" style={{ backgroundColor: RED }}>
                            {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>) : ("Sumar mi comercio")}
                        </button>
                        <p className="text-center text-[11px] text-gray-400">Gratis · sin permanencia · cancelás cuando quieras</p>
                    </form>

                    {!isLogged && (
                        <p className="mt-5 text-center text-sm text-gray-600">
                            ¿Ya tenés cuenta? <Link href="/comercios/login" className="text-[#e60012] font-bold hover:underline">Iniciá sesión</Link>
                        </p>
                    )}
                </div>

                <div className="text-center pb-8">
                    <Link href={fromProfile ? "/mi-perfil" : "/proximamente"} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        {fromProfile ? "Volver al perfil" : "Volver al inicio"}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ComercioRegistroPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#e60012]" /></div>}>
            <ComercioRegistroContent />
        </Suspense>
    );
}
