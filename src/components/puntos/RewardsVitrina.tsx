"use client";

// feat/moover: vidriera aspiracional de recompensas en /puntos. Muestra qué se
// puede canjear con puntos ("con tus puntos podés..."). Lee el catálogo real
// (/api/rewards); si no hay recompensas activas, no renderiza nada. El canje real
// es de un toque en el checkout (esto es solo la motivación para juntar).

import { useState, useEffect } from "react";

interface Reward {
    id: string;
    label: string;
    icon: string;
    description: string | null;
    pointsCost: number;
    type: string;
    value: number;
}

export default function RewardsVitrina() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch("/api/rewards")
            .then((r) => (r.ok ? r.json() : { rewards: [] }))
            .then((d) => {
                setRewards(Array.isArray(d.rewards) ? d.rewards : []);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    if (!loaded || rewards.length === 0) return null;

    return (
        <section className="px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#e60012]">Canjeá al pagar</p>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-1">Con tus puntos podés</h2>
                <p className="text-gray-500 mb-6">Un toque en el checkout, sin código. Tus puntos, cosas de verdad.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rewards.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <span className="text-3xl flex-shrink-0">{r.icon}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-black text-gray-900 truncate">{r.label}</p>
                                <p className="text-xs font-black text-[#e60012]">{r.pointsCost.toLocaleString("es-AR")} pts</p>
                                {r.description && <p className="mt-0.5 text-xs text-gray-400 truncate">{r.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
