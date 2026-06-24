"use client";

// Formulario de pre-registro de la cortina "Próximamente".
// Rama: feat/landing-cortina-preregistro
// Comercios y repartidores se anotan para que Moovy los contacte al lanzar.

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
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <div className="text-3xl mb-2">🙌</div>
                <h2 className="text-xl font-bold text-white">¡Listo! Ya quedaste anotado.</h2>
                <p className="mt-2 text-sm text-white/60">
                    Te vamos a escribir apenas Moovy abra en Ushuaia. Gracias por querer ser
                    de los primeros.
                </p>
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
                    : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
        >
            {label}
        </button>
    );

    return (
        <form
            onSubmit={submit}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur"
        >
            <p className="mb-3 text-center text-sm font-medium text-white/80">
                Sumate ahora y sé de los primeros 👇
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
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#e60012]"
                />
                <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp (opcional)"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#e60012]"
                />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#e60012]"
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

                <label className="flex items-start gap-2 pt-1 text-xs text-white/60">
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 accent-[#e60012]"
                    />
                    <span>Quiero que Moovy me contacte cuando lance en Ushuaia.</span>
                </label>
            </div>

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

            <button
                type="submit"
                disabled={status === "loading"}
                className="mt-4 w-full rounded-xl bg-[#e60012] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c2000f] disabled:opacity-60"
            >
                {status === "loading" ? "Enviando…" : "Quiero ser de los primeros"}
            </button>
        </form>
    );
}
