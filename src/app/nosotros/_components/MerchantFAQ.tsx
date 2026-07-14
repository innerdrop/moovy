"use client";

/**
 * MerchantFAQ — accordion para las 3 preguntas frecuentes de comercios.
 * Diseño de Sofía: el ícono "+" rota 45° hasta volverse "×" rojo cuando
 * el item se abre. Una sola pregunta abierta a la vez.
 */

import { Plus } from "lucide-react";
import { useState } from "react";

interface FAQItem {
    q: string;
    a: string;
}

const ITEMS: FAQItem[] = [
    {
        q: "¿En cuánto tiempo cobro?",
        a: "Al instante. Cuando el cliente paga, el dinero es tuyo.",
    },
    {
        q: "¿Cuánta comisión cobran?",
        a: "10%, y el primer mes es 0%. Nada escondido. De las más bajas del mercado.",
    },
    {
        q: "¿Quién me ayuda si tengo dudas?",
        a: "Nuestro equipo. WhatsApp, mail, lo que prefieras. Personas de verdad.",
    },
];

export default function MerchantFAQ() {
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    return (
        <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafaf9] p-4 md:p-6">
            {ITEMS.map((item, i) => {
                const isOpen = openIdx === i;
                const isFirst = i === 0;
                return (
                    <div
                        key={i}
                        className={
                            isFirst ? "" : "mt-1 border-t border-[#e5e7eb] pt-1"
                        }
                    >
                        <button
                            type="button"
                            onClick={() => setOpenIdx(isOpen ? null : i)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left text-[15px] font-semibold leading-snug text-[#111827] md:py-[18px] md:text-base"
                        >
                            <span>{item.q}</span>
                            <Plus
                                className={`h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 ease-out ${
                                    isOpen
                                        ? "rotate-45 text-[#e60012]"
                                        : "text-[#6b7280]"
                                }`}
                                strokeWidth={2}
                            />
                        </button>
                        <div
                            className="overflow-hidden transition-[max-height] duration-[240ms] ease-out"
                            style={{ maxHeight: isOpen ? "200px" : "0px" }}
                        >
                            <div className="px-1 pb-4 text-[15px] leading-relaxed text-[#4b5563]">
                                {item.a}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
