"use client";

// feat/moover-canje-recompensas: botones de UN TOQUE para canjear puntos por una
// recompensa en el checkout. Sin código, sin billetera. Al tocar, el checkout setea
// el rewardId + el descuento y limpia el slider de puntos (mutuamente exclusivos).
// La validación real (saldo + activo) es server-side en la creación del pedido.

import { useState, useEffect } from "react";
import { Gift, Check } from "lucide-react";
import { formatPrice } from "@/lib/delivery";

export interface Reward {
    id: string;
    label: string;
    icon: string;
    description: string | null;
    pointsCost: number;
    type: string;
    value: number;
}

interface Props {
    subtotal: number;
    deliveryCost: number;
    selectedRewardId: string | null;
    onSelect: (reward: Reward | null, discount: number) => void;
}

export default function RewardPicker({ subtotal, deliveryCost, selectedRewardId, onSelect }: Props) {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [rRes, pRes] = await Promise.all([fetch("/api/rewards"), fetch("/api/points")]);
                if (rRes.ok) {
                    const d = await rRes.json();
                    setRewards(Array.isArray(d.rewards) ? d.rewards : []);
                }
                if (pRes.ok) {
                    const d = await pRes.json();
                    setBalance(d.balance || 0);
                }
            } catch {
                /* si falla, el picker no se muestra */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const discountFor = (r: Reward) => {
        if (r.type === "FREE_DELIVERY") return deliveryCost;
        if (r.type === "FIXED_AMOUNT") return Math.min(r.value, subtotal);
        return 0;
    };

    if (loading || rewards.length === 0) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-[#e60012]" />
                <h4 className="font-black text-gray-900 lg:text-lg">Canjeá tus puntos</h4>
                <span className="ml-auto text-xs font-semibold text-gray-400">
                    Tenés {balance.toLocaleString("es-AR")} pts
                </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {rewards.map((r) => {
                    const disc = discountFor(r);
                    const affordable = balance >= r.pointsCost;
                    const applicable = disc > 0;
                    const selected = selectedRewardId === r.id;
                    const disabled = (!affordable || !applicable) && !selected;
                    return (
                        <button
                            key={r.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => (selected ? onSelect(null, 0) : onSelect(r, disc))}
                            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                selected
                                    ? "border-[#e60012] bg-red-50 ring-2 ring-[#e60012]/20"
                                    : disabled
                                        ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                        : "border-gray-200 hover:border-[#e60012]/40 active:scale-[0.99]"
                            }`}
                        >
                            <span className="text-2xl flex-shrink-0">{r.icon}</span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-gray-900 truncate">{r.label}</p>
                                <p className="text-xs text-gray-500">
                                    {r.pointsCost.toLocaleString("es-AR")} pts
                                    {applicable ? ` · −${formatPrice(disc)}` : ""}
                                    {!affordable ? " · te faltan puntos" : ""}
                                    {affordable && !applicable ? " · no aplica a este pedido" : ""}
                                </p>
                            </div>
                            {selected && <Check className="w-5 h-5 text-[#e60012] flex-shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
