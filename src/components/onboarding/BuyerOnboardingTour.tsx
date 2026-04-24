"use client";

// ISSUE-021: Tour buyer primera vez — 3 pantallas al primer login.
// Mostramos solo si el User no tiene onboardingCompletedAt.
// El usuario puede "Saltar" en cualquier momento (también marca como completado).
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShoppingBag, Truck, Gift, ChevronRight, X } from "lucide-react";

interface Slide {
    icon: React.ReactNode;
    title: string;
    description: string;
    accent: string;
}

const SLIDES: Slide[] = [
    {
        icon: <ShoppingBag className="w-14 h-14 lg:w-16 lg:h-16 text-white" />,
        title: "Bienvenido a MOOVY",
        description:
            "Comercios de Ushuaia al alcance de un clic. Productos reales, de gente de acá, con pago al instante al comercio y repartidores locales que conocen la ciudad.",
        accent: "from-[#e60012] to-[#ff1a2e]",
    },
    {
        icon: <Truck className="w-14 h-14 lg:w-16 lg:h-16 text-white" />,
        title: "Pedir es fácil",
        description:
            "Elegís, agregás al carrito y listo. Te avisamos cuando el comercio acepte, cuando el repartidor llegue a retirar y cuando esté en camino. Seguís todo en tiempo real.",
        accent: "from-violet-500 to-violet-600",
    },
    {
        icon: <Gift className="w-14 h-14 lg:w-16 lg:h-16 text-white" />,
        title: "Tenés puntos de bienvenida",
        description:
            "Activamos tus Puntos MOOVER al completar tu primer pedido. Cada $1.000 suma puntos, y cada punto vale $1 de descuento en futuros pedidos. Invitás amigos, sumás más puntos.",
        accent: "from-amber-400 to-orange-500",
    },
];

export default function BuyerOnboardingTour() {
    const { data: session, status } = useSession();
    const [shouldShow, setShouldShow] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [isClosing, setIsClosing] = useState(false);
    const [checked, setChecked] = useState(false);

    // Detectar si debe mostrarse — solo para usuarios autenticados
    useEffect(() => {
        if (status !== "authenticated" || !session?.user?.id || checked) return;
        let cancelled = false;

        // Fallback local: si el usuario ya cerró el tour pero la DB aún no sincronizó
        // (ej. offline al momento), evitamos volver a mostrarlo.
        try {
            const localFlag = localStorage.getItem(`moovy_onboarding_done_${session.user.id}`);
            if (localFlag) {
                setChecked(true);
                return;
            }
        } catch {
            // ignore storage errors
        }

        fetch("/api/onboarding")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled) return;
                setChecked(true);
                if (data?.shouldShow) {
                    setShouldShow(true);
                }
            })
            .catch(() => {
                if (!cancelled) setChecked(true);
            });

        return () => {
            cancelled = true;
        };
    }, [status, session?.user?.id, checked]);

    // Bloquear scroll del body mientras el tour está visible
    useEffect(() => {
        if (!shouldShow) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [shouldShow]);

    const markComplete = async () => {
        // Optimistic: guardamos flag local inmediatamente para evitar re-mostrar
        try {
            if (session?.user?.id) {
                localStorage.setItem(`moovy_onboarding_done_${session.user.id}`, "1");
            }
        } catch {
            // ignore
        }
        // Fire and forget — si falla, el flag local igual lo previene la próxima vez
        fetch("/api/onboarding", { method: "POST" }).catch(() => {});
    };

    const handleNext = () => {
        if (slideIndex < SLIDES.length - 1) {
            setSlideIndex((i) => i + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setIsClosing(true);
        markComplete();
        setTimeout(() => {
            setShouldShow(false);
            setIsClosing(false);
        }, 250);
    };

    const handleSkip = () => {
        handleFinish();
    };

    if (!shouldShow) return null;

    const current = SLIDES[slideIndex];
    const isLast = slideIndex === SLIDES.length - 1;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Tour de bienvenida"
            className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 ${
                isClosing ? "animate-fadeOut" : "animate-fadeIn"
            }`}
        >
            <div
                className={`relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${
                    isClosing ? "" : "animate-slideUp"
                }`}
            >
                {/* Skip button */}
                <button
                    type="button"
                    onClick={handleSkip}
                    aria-label="Saltar tour"
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Illustration block */}
                <div
                    className={`relative bg-gradient-to-br ${current.accent} h-48 lg:h-56 flex items-center justify-center`}
                >
                    <div className="bg-white/15 rounded-full p-6 backdrop-blur-sm">
                        {current.icon}
                    </div>
                </div>

                {/* Text block */}
                <div className="p-6 lg:p-8 space-y-3 lg:space-y-4">
                    <h2 className="text-xl lg:text-2xl font-bold text-navy text-center">
                        {current.title}
                    </h2>
                    <p className="text-sm lg:text-base text-gray-600 text-center leading-relaxed">
                        {current.description}
                    </p>

                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                        {SLIDES.map((_, i) => (
                            <button
                                type="button"
                                key={i}
                                onClick={() => setSlideIndex(i)}
                                aria-label={`Ir a la pantalla ${i + 1}`}
                                className={`transition-all rounded-full ${
                                    i === slideIndex
                                        ? "w-6 h-2 bg-[#e60012]"
                                        : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-3 lg:pt-4">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="flex-1 py-3 lg:py-3.5 text-sm lg:text-base font-semibold text-gray-500 hover:text-gray-700 transition"
                        >
                            Saltar
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex-[2] py-3 lg:py-3.5 bg-[#e60012] hover:bg-[#c5000f] text-white text-sm lg:text-base font-bold rounded-xl transition flex items-center justify-center gap-2"
                        >
                            {isLast ? "Empezar a explorar" : "Siguiente"}
                            {!isLast && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideUp {
                    from { transform: translateY(32px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
                .animate-fadeOut { animation: fadeOut 0.25s ease-out forwards; }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}
