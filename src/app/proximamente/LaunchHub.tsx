"use client";

// LaunchHub — cortina de somosmoovy.com como hub "elegí tu mundo".
// Rama: feat/rediseno-registro-comercio-repartidor
//
// Reemplaza la cortina de un solo formulario por una experiencia de marca que
// recibe con una frase ("Algo nuevo llega a Ushuaia") y ofrece TRES caminos,
// cada uno con su PROPIA personalidad (no bloques calcados, sin pills, sin pasos
// numerados como si fueran opciones):
//   · Comercio  → mundo editorial premium (crema/rojo) → CTA a /comercio/registro
//   · Repartidor→ mundo oscuro, honesto-que-convierte (transparencia + al instante,
//                  sin prometer ingresos ni volumen; vehículos en tonos NEUTROS
//                  porque el repartidor es el vecino, no una flota pintada) → /repartidor/registro
//   · Moover    → waitlist del cliente (deja su mail hasta que abramos)
//
// La cortina y los dos registros quedan abiertos aunque la tienda esté cerrada
// (allowlist del candado en proxy.ts), así se recluta la oferta antes del lanzamiento.

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    ArrowLeft,
    Store,
    Bike,
    ShoppingBag,
    Check,
    Zap,
    Clock,
    Eye,
    TrendingUp,
    Loader2,
    Package,
    PersonStanding,
    Car,
    Star,
    Share2,
    Instagram,
} from "lucide-react";

type View = "chooser" | "comercio" | "repartidor" | "moover";

const RED = "#e60012";
// Monobrand (decisión founder 2026-07-22): la cortina usa SOLO rojo Moovy +
// neutros (crema #FAF7F2, rojo profundo #B4000E, rosados #FFC9CD/#FDECED).
// Nada de azul/verde por-portal acá — significados aún no definidos.

export default function LaunchHub() {
    const [view, setView] = useState<View>("chooser");

    useEffect(() => {
        if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    }, [view]);

    const go = (v: View) => setView(v);

    return (
        <main className="font-[inherit]">
            <style>{`@keyframes hubIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.hub-in{animation:hubIn .38s ease both}@keyframes ctaPop{0%{transform:scale(.99);box-shadow:0 0 0 0 rgba(255,255,255,.65)}40%{transform:scale(1.035);box-shadow:0 0 26px 6px rgba(255,255,255,.55)}100%{transform:scale(1);box-shadow:0 12px 26px rgba(0,0,0,.16)}}.cta-flash{animation:ctaPop .6s ease-out}@keyframes ctaBeat{0%,100%{transform:scale(1)}12%{transform:scale(1.035)}22%{transform:scale(1)}32%{transform:scale(1.02)}42%{transform:scale(1)}}.cta-beat{animation:ctaBeat 2.4s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.cta-beat{animation:none}}@keyframes tierBeat{0%{transform:scale(1)}6%{transform:scale(1.12)}14%{transform:scale(1)}100%{transform:scale(1)}}.tier-beat{animation:tierBeat 3.6s ease-in-out infinite;transform-origin:50% 100%}@media (prefers-reduced-motion: reduce){.tier-beat{animation:none}}@keyframes claimIn{from{opacity:0;transform:translateX(46px)}to{opacity:1;transform:none}}.claim-in{animation:claimIn .42s cubic-bezier(.22,.8,.36,1) both}@media (prefers-reduced-motion: reduce){.claim-in{animation:none}}`}</style>

            {view === "chooser" && <Chooser key="chooser" onPick={go} />}
            {view === "comercio" && <ComercioWorld key="comercio" onBack={() => go("chooser")} />}
            {view === "repartidor" && <RepartidorWorld key="repartidor" onBack={() => go("chooser")} />}
            {view === "moover" && <MooverWorld key="moover" onBack={() => go("chooser")} />}
        </main>
    );
}

// ─────────────────────────────────────────────────────────── CHOOSER ──────────
type ChoiceKey = "comercio" | "repartidor" | "moover";

function Chooser({ onPick }: { onPick: (v: View) => void }) {
    const [sel, setSel] = useState<ChoiceKey | null>(null);
    const [pulse, setPulse] = useState(0);
    const pick = (k: ChoiceKey) => {
        setSel(k);
        setPulse((p) => p + 1); // dispara el destello del CTA en cada cambio de opción
    };

    const OPTIONS: { key: ChoiceKey; icon: React.ReactNode; title: string; sub: string; extra?: React.ReactNode }[] = [
        { key: "comercio", icon: <Store className="h-6 w-6 flex-shrink-0 text-white" strokeWidth={1.6} />, title: "Tengo un comercio", sub: "Vendé a toda la ciudad" },
        {
            key: "repartidor",
            icon: <Package className="h-6 w-6 flex-shrink-0 text-white" strokeWidth={1.6} />,
            title: "Quiero repartir",
            sub: "Ganá a tu ritmo",
            extra: (
                <span className="flex items-center gap-2 text-white/75">
                    <PersonStanding className="h-[22px] w-[22px]" strokeWidth={1.7} />
                    <Bike className="h-[22px] w-[22px]" strokeWidth={1.7} />
                    <Car className="h-[22px] w-[22px]" strokeWidth={1.7} />
                </span>
            ),
        },
        { key: "moover", icon: <ShoppingBag className="h-6 w-6 flex-shrink-0 text-white" strokeWidth={1.6} />, title: "Quiero ser un MOOVER", sub: "Pedí lo que quieras y sumá puntos" },
    ];

    return (
        <section className="hub-in relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#e60012] text-white">
            {/* Foto de Ushuaia arriba, difuminada hacia el rojo sólido abajo (vignette
                fotográfico, no un degradé decorativo). Identidad roja + paisaje del fin del mundo. */}
            <div className="absolute inset-x-0 top-0 h-[64%]" aria-hidden="true">
                <Image src="/ushuaia-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-[#e60012] mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#e60012]/20 via-[#e60012]/45 to-[#e60012]" />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
                {/* Header centrado: logo + kicker de ubicación (texto, sin pill) */}
                <div className="flex flex-col items-center text-center">
                    <Image src="/logo-moovy-white.svg" alt="Moovy" width={140} height={40} priority className="h-9 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
                    <div className="mt-5 text-[13px] font-bold uppercase tracking-[0.34em] text-white/90">Todo se mueve</div>
                </div>

                <div className="mt-auto pt-10">
                    <h1 className="text-[40px] font-black leading-[1.03] tracking-tight [text-wrap:balance] sm:text-5xl">
                        Algo nuevo llega a Ushuaia<span className="text-white/70">.</span>
                    </h1>
                    <p className="mt-3 max-w-md text-[16px] leading-relaxed text-white/85">
                        Hecha en el fin del mundo. Elegí cómo querés ser parte desde el día uno.
                    </p>

                    {/* Tarjetas de vidrio esmerilado, seleccionables */}
                    <div className="mt-7 space-y-3">
                        {OPTIONS.map((o) => {
                            const active = sel === o.key;
                            return (
                                <button
                                    key={o.key}
                                    type="button"
                                    onClick={() => pick(o.key)}
                                    className={`flex w-full items-center gap-3.5 rounded-2xl border px-5 py-4 text-left text-white backdrop-blur-md transition ${active ? "border-white/70 bg-white/[0.22]" : "border-white/25 bg-white/[0.10] hover:bg-white/[0.16]"}`}
                                >
                                    {o.icon}
                                    <span className="flex-1">
                                        <span className="block text-[16px] font-black">{o.title}</span>
                                        <span className="block text-[13px] text-white/70">{o.sub}</span>
                                    </span>
                                    {o.extra}
                                </button>
                            );
                        })}
                    </div>

                    {/* CTA principal: apagado hasta elegir; se ilumina y destella al seleccionar */}
                    <button
                        key={pulse}
                        type="button"
                        disabled={!sel}
                        onClick={() => sel && onPick(sel)}
                        className={`mt-8 w-full rounded-full py-4 text-[16px] font-black transition ${sel ? "cta-flash bg-white text-[#e60012] shadow-xl hover:brightness-95" : "cursor-not-allowed border border-white/25 bg-white/10 text-white/55"}`}
                    >
                        ¡Vamos!
                    </button>

                    {/* Pie en dos niveles: la red arriba (accionable), el copyright
                        abajo (informativo, más tenue). */}
                    <div className="mt-7 pb-1 text-center">
                        <a
                            href="https://instagram.com/somosmoovy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/85 transition hover:text-white"
                        >
                            <Instagram className="h-[17px] w-[17px]" strokeWidth={2} /> Seguinos en Instagram
                        </a>
                        <p className="mt-2 text-[11px] font-medium text-white/45">Ushuaia, Tierra del Fuego · 2026</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Botón compartir (Web Share API + fallback WhatsApp). SIN prometer puntos por
// compartir: no hay mecánica que rastree shares (veto Puntos/Legal).
function ShareMoovyButton({ message }: { message: string }) {
    const share = () => {
        const url = "https://somosmoovy.com";
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({ title: "Moovy", text: message, url }).catch(() => { /* cancelado */ });
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`, "_blank", "noopener");
        }
    };
    return (
        <button
            type="button"
            onClick={share}
            className="mx-auto mt-5 flex h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl text-[15px] font-black text-white transition hover:brightness-95"
            style={{ backgroundColor: RED }}
        >
            <Share2 className="h-[18px] w-[18px]" strokeWidth={2.4} /> Compartí Moovy
        </button>
    );
}

// ─────────────────────────────────────────── LEAD FORM (interés, etapa piloto) ──
// Etapa piloto (feat/rediseno-registro-comercio-repartidor): la oferta NO se auto-
// registra todavía. La cortina junta INTERESADOS (nombre, comercio, rubro, contacto)
// y Moovy los onboardea a mano, rubro por rubro. La auto-registración con panel se
// prende en la etapa pública (los formularios /comercio/registro y /repartidor/registro
// quedan construidos y accesibles solo por preview para el piloto).
const RUBROS = [
    "Kiosco / Almacén",
    "Panchería / Carrito",
    "Comida / Restaurante",
    "Pizzería",
    "Heladería",
    "Cafetería / Panadería",
    "Rotisería",
    "Bebidas / Vinoteca",
    "Verdulería / Carnicería",
    "Farmacia",
    "Mascotas / Veterinaria",
    "Otro",
];

function LeadForm({ role, accent }: { role: "COMERCIO" | "DRIVER"; accent: string }) {
    const isComercio = role === "COMERCIO";
    const [name, setName] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [rubro, setRubro] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [email, setEmail] = useState("");
    const [consent, setConsent] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [error, setError] = useState("");
    // Validación propia (sin globos nativos del navegador): campo con borde rojo
    // + mensaje en rojo debajo. El error de un campo se limpia al tipear en él.
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (key: string) =>
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const errs: Record<string, string> = {};
        if (isComercio && !businessName.trim()) errs.businessName = "Completá el nombre de tu comercio.";
        if (isComercio && !rubro) errs.rubro = "Elegí el rubro de tu comercio.";
        if (!name.trim()) errs.name = "Completá tu nombre y apellido.";
        if (!whatsapp.trim()) errs.whatsapp = "Completá tu WhatsApp.";
        if (!email.trim()) errs.email = "Completá tu email.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Ese email no parece válido.";
        if (!consent) errs.consent = "Marcá la casilla para que podamos contactarte.";
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setStatus("loading");
        try {
            const res = await fetch("/api/prelaunch/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    name,
                    email,
                    whatsapp,
                    consent,
                    rubro: isComercio ? rubro : undefined,
                    businessName: isComercio ? businessName : undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setStatus("error");
                setError(data.error || "No pudimos guardar tus datos. Probá de nuevo.");
                return;
            }
            setStatus("success");
        } catch {
            setStatus("error");
            setError("Hubo un problema de conexión. Probá de nuevo.");
        }
    };

    // Paso 2 del repartidor (preguntas opcionales post-envío)
    const [followup, setFollowup] = useState<"ask" | "done">("ask");
    const [fuVehicle, setFuVehicle] = useState("");
    const [fuOtherApp, setFuOtherApp] = useState("");
    const [fuEarnings, setFuEarnings] = useState("");
    const [fuSending, setFuSending] = useState(false);

    const sendFollowup = async () => {
        // Nada elegido = omitir silencioso
        if (!fuVehicle && !fuOtherApp) {
            setFollowup("done");
            return;
        }
        setFuSending(true);
        try {
            await fetch("/api/prelaunch/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    name,
                    email,
                    whatsapp,
                    consent: true,
                    vehicle: fuVehicle ? fuVehicle.toUpperCase() : undefined,
                    worksOtherApp: fuOtherApp ? fuOtherApp === "SI" : undefined,
                    earningsRange: fuOtherApp === "SI" && fuEarnings ? fuEarnings : undefined,
                }),
            });
        } catch {
            // fire-and-forget: el lead principal ya está guardado
        }
        setFuSending(false);
        setFollowup("done");
    };

    const inputBase = "h-12 w-full rounded-xl border bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none";
    const input = (key: string) =>
        `${inputBase} ${fieldErrors[key] ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-400"}`;
    const FieldError = ({ id }: { id: string }) =>
        fieldErrors[id] ? <p className="-mt-1.5 px-1 text-[12px] font-medium text-red-500">{fieldErrors[id]}</p> : null;

    if (status === "success") {
        // Repartidor, paso 2 (opcional): tres preguntas DESPUÉS de dejar los datos
        // (cero fricción en la conversión; el que ya se anotó contesta con gusto).
        if (!isComercio && followup === "ask") {
            return (
                <div className="rounded-2xl bg-gray-50 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: accent }}>
                        <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="mt-3 text-[16px] font-black text-gray-900">¡Listo! Ya quedaste anotado.</p>
                    <p className="mt-1 text-[14px] text-gray-500">¿Nos contás un poco más? Es opcional y tardás 10 segundos.</p>
                    <div className="mt-4 space-y-3 text-left">
                        <select className={`${inputBase} appearance-none border-gray-200 focus:border-gray-400 ${fuVehicle ? "" : "text-gray-400"}`} value={fuVehicle} onChange={(e) => setFuVehicle(e.target.value)}>
                            <option value="">¿Con qué repartirías?</option>
                            {["Bici", "Moto", "Auto", "Flete"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select className={`${inputBase} appearance-none border-gray-200 focus:border-gray-400 ${fuOtherApp ? "" : "text-gray-400"}`} value={fuOtherApp} onChange={(e) => setFuOtherApp(e.target.value)}>
                            <option value="">¿Repartís hoy en otra app?</option>
                            <option value="SI">Sí</option>
                            <option value="NO">No</option>
                        </select>
                        {fuOtherApp === "SI" && (
                            <select className={`${inputBase} appearance-none border-gray-200 focus:border-gray-400 ${fuEarnings ? "" : "text-gray-400"}`} value={fuEarnings} onChange={(e) => setFuEarnings(e.target.value)}>
                                <option value="">¿Cuánto ganás por viaje, aprox.?</option>
                                {["Menos de $2.000", "$2.000 a $3.500", "$3.500 a $5.000", "Más de $5.000", "Prefiero no decirlo"].map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}
                    </div>
                    <button
                        type="button"
                        disabled={fuSending}
                        onClick={sendFollowup}
                        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-black text-white transition hover:brightness-95 disabled:opacity-60"
                        style={{ backgroundColor: accent }}
                    >
                        {fuSending ? (<><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</>) : "Enviar"}
                    </button>
                    <button type="button" onClick={() => setFollowup("done")} className="mt-2.5 text-[13px] font-bold text-gray-400 transition hover:text-gray-600">
                        Omitir
                    </button>
                </div>
            );
        }

        return (
            <div className="rounded-2xl bg-gray-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: accent }}>
                    <Check className="h-6 w-6 text-white" />
                </div>
                <p className="mt-3 text-[16px] font-black text-gray-900">{isComercio ? "¡Listo! Ya quedaste anotado." : "¡Gracias! Con eso nos ayudás un montón."}</p>
                <p className="mt-1 text-[14px] text-gray-500">Te contactamos para sumarte a Moovy. Gracias por querer ser de los primeros.</p>
                <ShareMoovyButton
                    message={
                        isComercio
                            ? "Estoy sumando mi comercio a Moovy, el delivery hecho en Ushuaia: primer mes sin comisión y cobrás al instante. Sumate 👉"
                            : "Me anoté para repartir en Moovy, el delivery hecho en Ushuaia: cobrás al instante y manejás tus horarios. Sumate 👉"
                    }
                />
                <p className="mt-2 text-[12px] text-gray-400">Si conocés a alguien más, pasale el dato.</p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-3">
            {isComercio && (
                <>
                    <input className={input("businessName")} placeholder="Nombre del comercio" value={businessName} onChange={(e) => { setBusinessName(e.target.value); clearFieldError("businessName"); }} />
                    <FieldError id="businessName" />
                    <select className={`${input("rubro")} appearance-none ${rubro ? "" : "text-gray-400"}`} value={rubro} onChange={(e) => { setRubro(e.target.value); clearFieldError("rubro"); }}>
                        <option value="">Rubro del comercio</option>
                        {RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <FieldError id="rubro" />
                </>
            )}
            <input className={input("name")} placeholder="Nombre y apellido" value={name} onChange={(e) => { setName(e.target.value); clearFieldError("name"); }} autoComplete="name" />
            <FieldError id="name" />
            <input className={input("whatsapp")} type="tel" placeholder="WhatsApp" value={whatsapp} onChange={(e) => { setWhatsapp(e.target.value); clearFieldError("whatsapp"); }} />
            <FieldError id="whatsapp" />
            <input className={input("email")} type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }} autoComplete="email" />
            <FieldError id="email" />
            <label className={`flex items-start gap-2.5 pt-0.5 text-[12px] ${fieldErrors.consent ? "text-red-500" : "text-gray-500"}`}>
                <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); clearFieldError("consent"); }} className="mt-0.5 h-5 w-5 flex-shrink-0 rounded" style={{ accentColor: fieldErrors.consent ? "#ef4444" : accent }} />
                <span>Quiero que Moovy me contacte para sumarme.<span style={{ color: fieldErrors.consent ? "#ef4444" : accent }}> *</span></span>
            </label>
            <FieldError id="consent" />
            {error && <p className="text-[12px] font-medium text-red-500">{error}</p>}
            <button type="submit" disabled={status === "loading"} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-black text-white transition hover:brightness-95 disabled:opacity-60" style={{ backgroundColor: accent }}>
                {status === "loading" ? (<><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</>) : (isComercio ? "Quiero que me contacten" : "Quiero repartir")}
            </button>
            {/* Finalidad de los datos (Ley 25.326) + canal REAL para ejercer el
                borrado (prometer el derecho sin canal es incumplimiento) */}
            <p className="text-center text-[11px] leading-relaxed text-gray-400">
                Usamos tus datos solo para contactarte por Moovy. Podés pedir que los borremos cuando quieras escribiendo a <a href="mailto:somosmoovy@gmail.com" className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600">somosmoovy@gmail.com</a>.
            </p>
        </form>
    );
}

// Cierre de página de los mundos: CTA con latido que vuelve al formulario +
// mini-footer de marca. Evita que la página "termine en la nada".
function WorldFooter({ formId, cta }: { formId: string; cta: string }) {
    return (
        <div className="mt-9 pb-2 text-center">
            <button
                type="button"
                onClick={() => document.getElementById(formId)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="cta-beat flex h-[52px] w-full items-center justify-center rounded-2xl text-[16px] font-black text-white transition hover:brightness-95"
                style={{ backgroundColor: RED, boxShadow: "0 14px 26px -10px rgba(230,0,18,0.45)" }}
            >
                {cta}
            </button>
            <div className="mt-8 flex items-center justify-center gap-2 text-[12px] font-semibold text-gray-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: RED }}>M</span>
                Moovy · Ushuaia, Tierra del Fuego
            </div>
            <p className="mx-auto mt-3 max-w-[44ch] text-[10.5px] leading-relaxed text-gray-300">
                La información publicada es orientativa de pre-lanzamiento y puede actualizarse. Las condiciones se confirman al momento del alta.
            </p>
        </div>
    );
}

// Header neutro de marca para los tres mundos: blanco, Volver gris + logo Moovy
// rojo. Neutro a propósito: separa el rojo de la marca del color de cada portal
// (azul comercio / verde repartidor) sin que choquen.
function WorldHeader({ onBack }: { onBack: () => void }) {
    return (
        <header className="border-b border-gray-100 bg-white">
            <div className="mx-auto flex h-[58px] max-w-lg items-center justify-between px-6">
                <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-gray-400 transition hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Volver
                </button>
                <Image src="/logo-moovy.svg" alt="Moovy" width={110} height={32} className="h-[26px] w-auto" />
            </div>
        </header>
    );
}

// Mini-slide del hero comercio: rota tres argumentos cortos, uno por vez.
function HeroClaims() {
    const CLAIMS = ["Sin apps caras", "Sin complicaciones", "Más ventas para vos"];
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % CLAIMS.length), 2500);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mt-2 flex h-9 overflow-hidden">
            <span key={idx} className="claim-in flex items-center gap-2 text-[20px] font-extrabold text-gray-900">
                <Check className="h-[22px] w-[22px] flex-shrink-0" strokeWidth={3} style={{ color: RED }} /> {CLAIMS[idx]}
            </span>
        </div>
    );
}

// Slide rotativo del hero repartidor: una promesa por vez, en tarjeta fija.
function DriverClaims() {
    const CLAIMS: { icon: React.ReactNode; strong: string; rest: string }[] = [
        { icon: <Eye className="h-6 w-6 flex-shrink-0 text-[#FFC9CD]" />, strong: "Sabés cuánto ganás", rest: " en cada pedido antes de aceptarlo. Nunca vas a ciegas." },
        { icon: <Zap className="h-6 w-6 flex-shrink-0 text-[#FFC9CD]" />, strong: "Cobrás al instante", rest: ", sin esperar liquidaciones." },
        { icon: <Clock className="h-6 w-6 flex-shrink-0 text-[#FFC9CD]" />, strong: "Vos elegís cuándo.", rest: " Sin jefe ni horario fijo." },
    ];
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % CLAIMS.length), 3000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mt-6 min-h-[52px] overflow-hidden">
            <div key={idx} className="claim-in flex items-center gap-3">
                {CLAIMS[idx].icon}
                <p className="text-[16px] leading-snug text-white/80">
                    <b className="font-black text-white">{CLAIMS[idx].strong}</b>
                    {CLAIMS[idx].rest}
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────── COMERCIO WORLD ───────
function ComercioWorld({ onBack }: { onBack: () => void }) {
    const STEPS: [string, string][] = [
        ["Registrás tu comercio", "en 5 minutos, gratis y sin vueltas."],
        ["Cargás tus productos", "con foto y precio, desde tu panel."],
        ["Recibís pedidos", "de toda la ciudad, en tiempo real."],
        ["Cobrás al instante", "cada venta, directo a tu cuenta."],
    ];
    const TIERS: [string, string][] = [
        ["Arrancás", "10%"],
        ["Crecés", "9%"],
        ["Más ventas", "8%"],
        ["Top", "7%"],
    ];
    const TOOLS = [
        "Tu catálogo online, con fotos y precios",
        "Pedidos en tiempo real, con avisos al toque",
        "Cobros por MercadoPago, acreditados al instante",
        "Tus ventas y tus números, siempre a mano",
    ];

    return (
        <section className="hub-in min-h-[100dvh] bg-[#FAF7F2] text-gray-900">
            <WorldHeader onBack={onBack} />
            <div className="mx-auto max-w-lg px-6 pb-6 pt-2">
                {/* Hero tipográfico, sin imagen: el título y el subtítulo ocupan
                    todo el ancho. */}
                <div className="mt-4">
                    <p className="text-[12px] font-extrabold uppercase tracking-[0.16em]" style={{ color: RED }}>Comercios fundadores</p>
                    <h2 className="mt-2 text-[38px] font-black tracking-tight sm:text-[46px]" style={{ lineHeight: 1.05 }}>
                        Vendé más.<br />
                        <span style={{ color: RED }}>Pagá menos.</span>
                    </h2>
                    <p className="mt-3 text-[17px] leading-relaxed text-gray-600">
                        En Moovy conectamos tu negocio con miles de clientes en Ushuaia.
                    </p>
                    {/* Los tres argumentos como mini-slide rotativo (una frase por vez) */}
                    <HeroClaims />
                </div>

                {/* Oferta + formulario UNIDOS en una sola pieza: la razón (30 días
                    gratis) es el encabezado del form. Sin tarjeta-banner suelta. */}
                <div id="comercio-form" className="mt-5 scroll-mt-6 overflow-hidden rounded-xl bg-white shadow-[0_18px_36px_-16px_rgba(180,0,14,0.35)]">
                    <div className="relative overflow-hidden px-5 pb-4 pt-4 text-white" style={{ background: "linear-gradient(120deg, #E60012 0%, #B4000E 100%)" }}>
                        <span aria-hidden className="pointer-events-none absolute -right-4 -top-7 select-none text-[110px] font-black leading-none text-white/[0.07]">%</span>
                        <div className="relative flex items-baseline gap-2.5">
                            <span className="text-[34px] font-black leading-none tracking-tight">30 días</span>
                            <span className="text-[20px] font-black uppercase leading-none text-[#FFC9CD]">gratis</span>
                        </div>
                        <p className="relative mt-1.5 text-[13.5px] font-semibold text-white/85">
                            0% de comisión tu primer mes · sin tarjeta · sin permanencia
                        </p>
                    </div>
                    <div className="p-5">
                        <h3 className="text-[16px] font-black text-gray-900">Sumá tu comercio</h3>
                        <p className="mt-1 text-[14px] leading-relaxed text-gray-500">Dejanos tus datos y te contactamos para sumarte. Estamos incorporando comercios de a poco, rubro por rubro.</p>
                        <div className="mt-4">
                            <LeadForm role="COMERCIO" accent={RED} />
                        </div>
                        <p className="mt-3 text-center text-[11px] text-gray-400">Oferta de lanzamiento para comercios nuevos. Desde el mes 2, comisión del 10% que baja a medida que vendés.</p>
                    </div>
                </div>

                {/* Comisión que baja cuanto más vendés */}
                <div className="mt-6 rounded-2xl border border-red-100 bg-white p-5">
                    <p className="flex items-center gap-2 text-[16px] font-black text-gray-900">
                        <TrendingUp className="h-4 w-4" style={{ color: RED }} /> Cuanto más vendés, menos comisión
                    </p>
                    <p className="mt-1.5 text-[15.5px] leading-relaxed text-gray-600">
                        Premiamos a los que más crecen: tu comisión arranca en 10% y baja a medida que vendés más.
                    </p>
                    {/* Niveles con marco rojo sutil (#FFD4D7); el 7% remata en rojo
                        pleno con estrella. */}
                    <div className="mt-6 grid grid-cols-4 items-end gap-2">
                        {TIERS.map(([label, pct], i) => {
                            const best = i === TIERS.length - 1;
                            const h = [64, 74, 84, 98][i];
                            const fs = [17, 19, 22, 27][i];
                            return (
                                <div key={pct} className={`tier-beat relative flex flex-col items-center justify-center rounded-xl text-center ${best ? "border-2 shadow-[0_10px_20px_-8px_rgba(230,0,18,0.35)]" : "border"}`} style={{ height: h, borderColor: best ? RED : "#FFD4D7", backgroundColor: best ? "#fdeeef" : "#FFFDFD", animationDelay: `${i * 0.45}s` }}>
                                    {best && (
                                        <span className="absolute -top-3 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md" style={{ backgroundColor: RED }}>
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                        </span>
                                    )}
                                    <div className="font-black leading-none" style={{ fontSize: fs, color: best ? RED : "#1a1a1a" }}>{pct}</div>
                                    <div className={`mt-1 text-[10px] leading-tight ${best ? "font-bold" : ""}`} style={{ color: best ? RED : "#6b7280" }}>{label}</div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Cláusula de vigencia (Ley 24.240 art. 8: la publicidad integra el
                        contrato — los números van SIEMPRE con condición + vigencia) */}
                    <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
                        Comisiones según volumen de ventas. Valores de lanzamiento, sujetos a confirmación al momento del alta.
                    </p>
                </div>

                {/* Cobrás al instante — tarjeta destacada: sin íconos, con un "$"
                    gigante de marca de agua de fondo (mismo lenguaje que la "M"
                    de la tarjeta navy) sobre un degradado celeste. */}
                <div className="relative mt-6 overflow-hidden rounded-[26px] border border-red-100 p-6 shadow-[0_14px_30px_-14px_rgba(230,0,18,0.2)]" style={{ background: "linear-gradient(135deg, #ffffff 0%, #FFF3F4 70%, #FFE7E9 100%)" }}>
                    <span aria-hidden className="pointer-events-none absolute -right-3 -top-10 select-none text-[170px] font-black leading-none" style={{ color: "rgba(230,0,18,0.07)", transform: "rotate(10deg)" }}>$</span>
                    <div className="relative">
                        <p className="text-[21px] font-black leading-tight text-gray-900">Cobrás al instante.</p>
                        <p className="mt-2 max-w-[46ch] text-[15.5px] leading-relaxed text-gray-600">
                            Cada venta se acredita en tu MercadoPago <b className="rounded bg-[#FFE0E3] px-1 font-black text-gray-900">apenas el cliente paga</b>. <b className="rounded bg-[#FFE0E3] px-1 font-black text-gray-900">Sin esperas</b> ni dinero retenido semanas.
                        </p>
                    </div>
                </div>

                {/* Cómo funciona — SECCIÓN roja full-bleed: banda de color que
                    separa el capítulo. */}
                <div className="-mx-6 mt-8 px-6 py-7" style={{ background: "linear-gradient(155deg, #FF3B45 0%, #E60012 50%, #B4000E 100%)" }}>
                    <h3 className="text-[18px] font-black text-white">Cómo funciona</h3>
                    <div className="mt-4 space-y-3.5">
                        {STEPS.map(([t, s], i) => (
                            <div key={t} className="flex items-start gap-3">
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-black" style={{ color: RED }}>{i + 1}</span>
                                <p className="text-[15.5px] leading-snug text-white/85"><b className="font-bold text-white">{t}</b> {s}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Qué incluye el panel — sección gris muy sutil */}
                <div className="-mx-6 mt-8 bg-[#F3F1EC] px-6 py-7">
                    <h3 className="text-[16px] font-black text-gray-900">Todo en un solo panel</h3>
                    <div className="mt-4 space-y-2.5">
                        {TOOLS.map((t) => (
                            <div key={t} className="flex items-start gap-2.5">
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: RED }} />
                                <p className="text-[15.5px] leading-snug text-gray-600">{t}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <WorldFooter formId="comercio-form" cta="Sumá tu comercio" />

                <div className="h-6" />
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────── REPARTIDOR WORLD ─────
function RepartidorWorld({ onBack }: { onBack: () => void }) {
    return (
        <section className="hub-in min-h-[100dvh] bg-[#FAF7F2] text-gray-900">
            <WorldHeader onBack={onBack} />
            {/* ── Bloque hero VERDE full-bleed (color blocking, como el rojo del chooser) */}
            <div className="rounded-b-[36px] pb-16" style={{ background: "linear-gradient(160deg, #FF3B45 0%, #D50011 55%, #9E000D 100%)" }}>
                <div className="mx-auto max-w-lg px-6 pt-7">
                    <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#FFC9CD]">Repartidores fundadores</p>
                    <h2 className="mt-2 text-[40px] font-black tracking-tight text-white sm:text-[48px]" style={{ lineHeight: 1.02 }}>
                        Repartí<br />a tu ritmo<span className="text-[#FFC9CD]">.</span>
                    </h2>
                    <p className="mt-3 max-w-[30ch] text-[17px] leading-relaxed text-white/80">
                        Vos manejás tu tiempo. Nosotros ponemos los pedidos.
                    </p>

                    {/* Slide de promesas, vidrio esmerilado sobre el verde */}
                    <DriverClaims />
                </div>
            </div>

            <div className="mx-auto max-w-lg px-6">
                {/* ── El FORMULARIO muerde el bloque verde: es lo primero que ves
                    (patrón partner-first: el que llegó hasta acá viene a anotarse) */}
                <div id="repartidor-form" className="-mt-9 scroll-mt-6 rounded-3xl bg-white p-5 shadow-[0_20px_40px_-18px_rgba(158,0,13,0.35)]">
                    <h3 className="text-[18px] font-black text-gray-900">Quiero repartir</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-gray-500">Dejanos tus datos y te contactamos para sumarte al equipo.</p>
                    <div className="mt-4">
                        <LeadForm role="DRIVER" accent={RED} />
                    </div>
                    <p className="mt-3 text-center text-[11px] text-gray-400">Anotarte es gratis · vos elegís cuándo</p>
                </div>

                {/* ── Vehículos: tiles verdes */}
                <div className="mt-6 rounded-3xl bg-white p-5 shadow-[0_10px_24px_-16px_rgba(158,0,13,0.28)]">
                    <h3 className="text-[16px] font-black text-gray-900">Empezás con lo que tengas</h3>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        {["Bici", "Moto", "Auto", "Flete"].map((v) => (
                            <div key={v} className="rounded-xl bg-[#FDECED] py-3 text-center">
                                <Check className="mx-auto h-[18px] w-[18px]" strokeWidth={3} style={{ color: RED }} />
                                <div className="mt-1 text-[14px] font-extrabold text-[#8E1216]">{v}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bloque VERDE OSCURO: la ventaja de entrar primero, en grande */}
                <div className="relative mt-6 overflow-hidden rounded-3xl p-6 text-white" style={{ background: "linear-gradient(150deg, #26272C 0%, #121317 100%)" }}>
                    <span aria-hidden className="pointer-events-none absolute -right-8 -top-12 select-none text-[190px] font-black leading-none text-white/[0.05]">1°</span>
                    <p className="text-[24px] font-black leading-tight">Sé de los primeros<br />repartidores de Ushuaia.</p>
                    <p className="mt-2 max-w-[34ch] text-[15.5px] leading-relaxed text-white/75">
                        Entrás temprano, con menos competencia por los pedidos.
                    </p>
                </div>

                {/* Cómo arrancás — pasos concretos (info que el repartidor necesita
                    para decidirse, sin prometer ingresos ni volumen) */}
                <div className="-mx-6 mt-8 px-6 py-7" style={{ background: "linear-gradient(155deg, #FF3B45 0%, #E60012 50%, #B4000E 100%)" }}>
                    <h3 className="text-[18px] font-black text-white">Cómo arrancás</h3>
                    <div className="mt-4 space-y-3.5">
                        {[
                            ["Dejás tus datos", "en un minuto, desde el celular."],
                            ["Te contactamos nosotros", "sin filas ni trámites presenciales."],
                            ["Activás tu cuenta", "cargando tu documentación desde el panel."],
                            ["Salís a repartir", "ves cuánto paga cada pedido antes de aceptarlo y cobrás al instante."],
                        ].map(([t, s], i) => (
                            <div key={t} className="flex items-start gap-3">
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-black" style={{ color: RED }}>{i + 1}</span>
                                <p className="text-[15.5px] leading-snug text-white/85"><b className="font-bold text-white">{t}</b> {s}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lo que te da Moovy — argumentos concretos, sin humo */}
                <div className="-mx-6 mt-8 bg-[#F3F1EC] px-6 py-7">
                    <h3 className="text-[16px] font-black text-gray-900">Repartir con Moovy es</h3>
                    <div className="mt-4 space-y-2.5">
                        {[
                            "Cada entrega se te acredita al instante por MercadoPago",
                            "Ves la plata de cada pedido ANTES de aceptarlo",
                            "Sin mínimo de horas ni penalidades por desconectarte",
                            "Soporte humano de Ushuaia, no un bot en otro país",
                        ].map((t) => (
                            <div key={t} className="flex items-start gap-2.5">
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: RED }} />
                                <p className="text-[15.5px] leading-snug text-gray-600">{t}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Requisitos — genérico a propósito (revisión legal): la lista exacta
                    depende del vehículo (motorizados incluyen seguro vigente) y se
                    gestiona en el panel. No enumerar acá evita prometer menos de lo
                    que después se exige. */}
                <div className="mt-6 rounded-3xl border-l-4 bg-white p-5 shadow-[0_10px_24px_-16px_rgba(158,0,13,0.28)]" style={{ borderColor: RED }}>
                    <h3 className="text-[16px] font-black text-gray-900">¿Qué necesitás?</h3>
                    <p className="mt-2 text-[15.5px] leading-relaxed text-gray-600">
                        Tu documentación se carga desde tu panel para activar la cuenta: te decimos exactamente qué papeles van según tu vehículo cuando te contactemos. Empezar el registro no te compromete a nada.
                    </p>
                </div>

                <WorldFooter formId="repartidor-form" cta="Sumarme como fundador" />

                <div className="h-6" />
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────── MOOVER WORLD ─────
function MooverWorld({ onBack }: { onBack: () => void }) {
    const [email, setEmail] = useState("");
    const [consent, setConsent] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [consentError, setConsentError] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setEmailError("");
        setConsentError(false);
        let invalid = false;
        if (!email.trim()) {
            setEmailError("Completá tu email.");
            invalid = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setEmailError("Ese email no parece válido.");
            invalid = true;
        }
        if (!consent) {
            setConsentError(true);
            setError("Marcá la casilla para que podamos avisarte.");
            invalid = true;
        }
        if (invalid) return;
        setStatus("loading");
        try {
            const res = await fetch("/api/prelaunch/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: "CLIENTE", email, consent }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setStatus("error");
                setError(data.error || "No pudimos guardar tu mail. Probá de nuevo.");
                return;
            }
            setStatus("success");
        } catch {
            setStatus("error");
            setError("Hubo un problema de conexión. Probá de nuevo.");
        }
    };

    return (
        <section className="hub-in min-h-[100dvh] bg-[#FAF7F2] text-gray-900">
            <WorldHeader onBack={onBack} />
            <div className="mx-auto max-w-md px-6 pb-6 pt-2">
                <p className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.16em]" style={{ color: RED }}>Moovers fundadores</p>
                <h2 className="mt-2 text-[38px] font-black tracking-tight sm:text-[44px]" style={{ lineHeight: 1.05 }}>
                    Estamos por abrir.<br />
                    <span style={{ color: RED }}>Tu antojo manda.</span>
                </h2>
                <p className="mt-3 text-[17px] leading-relaxed text-gray-500">
                    Dejanos tu mail y sé de los primeros en pedir —y en sumar puntos MOOVER— cuando la tienda esté lista.
                </p>

                {status === "success" ? (
                    <div className="mt-7 rounded-2xl bg-[#fbeaea] p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: RED }}>
                            <Check className="h-6 w-6 text-white" />
                        </div>
                        <p className="mt-3 text-[16px] font-black text-[#a32d2d]">¡Listo! Ya quedaste anotado.</p>
                        <p className="mt-1 text-[14px] text-[#8a5a5a]">Te avisamos apenas Moovy abra en Ushuaia.</p>
                        {/* Compartir en el pico de entusiasmo (post-registro) */}
                        <ShareMoovyButton message="Moovy está por llegar a Ushuaia: delivery hecho acá, por gente de acá. Anotate para ser de los primeros 👉" />
                        <p className="mt-2 text-[12px] text-[#8a5a5a]">Cuanto más seamos, antes abrimos.</p>
                    </div>
                ) : (
                    <form onSubmit={submit} noValidate className="mt-7 space-y-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                            placeholder="tu@email.com"
                            autoComplete="email"
                            className={`h-12 w-full rounded-xl border px-4 text-[16px] text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 ${emailError ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-[#e60012] focus:ring-red-100"}`}
                        />
                        {emailError && <p className="-mt-1.5 px-1 text-[13px] font-medium text-red-600">{emailError}</p>}
                        <label className={`flex items-start gap-2.5 pt-0.5 text-[13px] ${consentError ? "text-red-600" : "text-gray-500"}`}>
                            <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setConsentError(false); setError(""); }} className="mt-0.5 h-5 w-5 flex-shrink-0 rounded accent-[#e60012]" />
                            <span>Quiero que Moovy me avise cuando lance en Ushuaia.<span style={{ color: RED }}> *</span></span>
                        </label>
                        {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}
                        <button type="submit" disabled={status === "loading"} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-black text-white transition hover:brightness-95 disabled:opacity-60" style={{ backgroundColor: RED }}>
                            {status === "loading" ? (<><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</>) : ("Avisame cuando abran")}
                        </button>
                        {/* Finalidad de los datos (Ley 25.326) + canal real de borrado */}
                        <p className="text-center text-[11px] leading-relaxed text-gray-400">
                            Usamos tu email solo para avisarte del lanzamiento. Podés pedir que lo borremos cuando quieras escribiendo a <a href="mailto:somosmoovy@gmail.com" className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600">somosmoovy@gmail.com</a>.
                        </p>
                    </form>
                )}

                {/* Ser MOOVER tiene premio — banda roja */}
                <div className="-mx-6 mt-8 px-6 py-7" style={{ background: "linear-gradient(155deg, #FF3B45 0%, #E60012 50%, #B4000E 100%)" }}>
                    <h3 className="text-[18px] font-black text-white">Ser MOOVER tiene premio</h3>
                    <div className="mt-4 space-y-2.5">
                        {[
                            "Sumás puntos con cada pedido que hacés",
                            "Los canjeás por descuentos y envíos gratis",
                            "Los primeros arrancan con beneficios de bienvenida",
                        ].map((t) => (
                            <div key={t} className="flex items-start gap-2.5">
                                <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#FFC9CD]" strokeWidth={2.6} />
                                <p className="text-[15.5px] leading-snug text-white/90">{t}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Qué vas a poder pedir — banda gris sutil */}
                <div className="-mx-6 mt-8 bg-[#F3F1EC] px-6 py-7">
                    <h3 className="text-[16px] font-black text-gray-900">Lo que necesites, a tu puerta</h3>
                    <p className="mt-2 text-[15.5px] leading-relaxed text-gray-600">
                        Comida, kiosco, almacén y más: estamos sumando comercios de Ushuaia rubro por rubro. Cuando abramos, vas a pedir de locales de acá, atendidos por gente de acá.
                    </p>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-[12px] font-semibold text-gray-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: RED }}>M</span>
                    Moovy · Ushuaia, Tierra del Fuego
                </div>
                <p className="mx-auto mt-3 max-w-[44ch] pb-2 text-center text-[10.5px] leading-relaxed text-gray-300">
                    Los beneficios publicados son orientativos de pre-lanzamiento y pueden actualizarse.
                </p>
            </div>
        </section>
    );
}
