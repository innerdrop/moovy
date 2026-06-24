"use client";

// Formulario de pre-registro de la cortina "Próximamente".
// Rama: feat/landing-cortina-preregistro
// Tarjeta blanca (resalta sobre el fondo rojo Moovy del diseño mundialista).

import { useState } from "react";

type Role = "COMERCIO" | "DRIVER";
type Status = "idle" | "loading" | "success" | "error";

export default function PreLaunchForm() {
    const [role, setRole] = useState<Role>("COMERCIO");
    const [email, setEmail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [name, setName] = useState("");
    const [consent, setConsent] = useState(false);
    const [website, setWebsite] = useState(""); // honeypot
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");
    const [shareMsg, setShareMsg] = useState("");

    const shareUrl = () =>
        typeof window !== "undefined" ? window.location.origin : "https://somosmoovy.com";

    // Copia legacy que funciona también en http (sin HTTPS): textarea + execCommand.
    const legacyCopy = (url: string): boolean => {
        try {
            const ta = document.createElement("textarea");
            ta.value = url;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand("copy");
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    };

    const copyLink = async () => {
        setShareMsg("");
        const url = shareUrl();
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
                setShareMsg("¡Link copiado! Pegalo donde quieras compartirlo.");
                return;
            }
        } catch {
            // Sigue al fallback legacy.
        }
        if (legacyCopy(url)) {
            setShareMsg("¡Link copiado! Pegalo donde quieras compartirlo.");
        } else {
            setShareMsg(`Copiá este link para compartir: ${url}`);
        }
    };

    const shareWhatsApp = () => {
        // Mensaje pre-escrito que llega listo para enviar.
        const message =
            `Mirá esto: Moovy está por llegar a Ushuaia. ` +
            `Si tenés un comercio o querés repartir, anotate ahora y sé de los primeros en ser parte: ` +
            `${shareUrl()}`;
        const msg = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!consent) {
            setError("Marcá la casilla para que podamos contactarte.");
            return;
        }
        setStatus("loading");
        try {
            const res = await fetch("/api/prelaunch/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, email, whatsapp, name, consent, website }),
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

    if (status === "success") {
        return (
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                <h2 className="text-xl font-black text-slate-800">¡Listo! Ya quedaste anotado.</h2>
                <p className="mt-2 text-sm text-slate-500">
                    Te vamos a escribir apenas Moovy abra en Ushuaia. Gracias por querer ser
                    de los primeros.
                </p>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                    ¿Conocés a alguien a quien le sirva? Compartilo.
                </p>

                <button
                    type="button"
                    onClick={shareWhatsApp}
                    className="mt-3 w-full rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-95"
                >
                    Compartir por WhatsApp
                </button>

                <button
                    type="button"
                    onClick={copyLink}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                    Copiar link
                </button>

                {shareMsg && (
                    <p className="mt-2 text-xs font-medium text-slate-500">{shareMsg}</p>
                )}
            </div>
        );
    }

    const roleBtn = (value: Role, label: string) => (
        <button
            type="button"
            onClick={() => setRole(value)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                role === value
                    ? "bg-[#e60012] text-white shadow"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
        >
            {label}
        </button>
    );

    const input =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#e60012] focus:ring-2 focus:ring-[#e60012]/20";

    return (
        <form
            onSubmit={submit}
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-left shadow-2xl"
        >
            <p className="mb-3 text-center text-sm font-semibold text-slate-700">
                Sumate ahora y sé de los primeros
            </p>

            <div className="mb-3 flex gap-2">
                {roleBtn("COMERCIO", "Tengo un comercio")}
                {roleBtn("DRIVER", "Quiero repartir")}
            </div>

            <div className="space-y-2.5">
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu email *"
                    autoComplete="email"
                    className={input}
                />
                <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp (opcional)"
                    autoComplete="tel"
                    className={input}
                />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    autoComplete="name"
                    className={input}
                />

                {/* Honeypot anti-bot: oculto para humanos, los bots lo completan. */}
                <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="hidden"
                    aria-hidden="true"
                />

                <label className="flex items-start gap-2 pt-1 text-xs text-slate-500">
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 accent-[#e60012]"
                    />
                    <span>
                        Quiero que Moovy me contacte cuando lance en Ushuaia.
                        <span className="text-[#e60012]"> *</span>
                    </span>
                </label>
            </div>

            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={status === "loading"}
                className="mt-4 w-full rounded-xl bg-[#e60012] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#e60012]/30 transition hover:bg-[#c2000f] disabled:opacity-60"
            >
                {status === "loading" ? "Enviando…" : "Quiero ser de los primeros"}
            </button>
        </form>
    );
}
